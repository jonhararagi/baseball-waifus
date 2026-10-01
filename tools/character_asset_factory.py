#!/usr/bin/env python3
"""BaseWarriors character asset factory.

Generation is external/offline. This tool owns validation, deterministic
normalization/composition, manifest checks, and compact reporting.
"""
from __future__ import annotations
import argparse, os, re, shutil, struct, sys
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/character_asset_manifest.json"
CHARACTER_SOURCE = ROOT / "game/characters/character_archetypes.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
STATUS = {"MISSING","DRAFT","READY","VALIDATED"}
QUALITY_CLASSES = {"REAL_PRODUCTION_ART","PROCESSED_ART","PLACEHOLDER","WRAPPER","MISSING"}
IMAGE_EXTS = {".svg",".png",".jpg",".jpeg"}

class AssetFactoryError(RuntimeError): pass

def load_json(path):
    return __import__("json").loads(path.read_text(encoding="utf-8"))

def manifest():
    data=load_json(MANIFEST_PATH)
    if data.get("schema_version") != 1: raise AssetFactoryError("unsupported manifest schema")
    return data

def canonical():
    return {str(x["id"]):x for x in load_json(CHARACTER_SOURCE).get("characters",[])}

def dimensions(path):
    suffix=path.suffix.lower()
    if suffix==".svg":
        root=ElementTree.parse(path).getroot()
        w,h=root.get("width"),root.get("height")
        if w and h:
            return int(float(re.sub(r"[^0-9.]+$","",w))), int(float(re.sub(r"[^0-9.]+$","",h)))
        vb=(root.get("viewBox") or "").replace(","," ").split()
        if len(vb)==4: return int(float(vb[2])),int(float(vb[3]))
        raise AssetFactoryError(f"SVG has no dimensions: {path}")
    if suffix==".png":
        raw=path.read_bytes()
        if len(raw)<24 or raw[:8]!=PNG_SIGNATURE: raise AssetFactoryError(f"invalid PNG: {path}")
        return struct.unpack(">II",raw[16:24])
    if suffix in {".jpg",".jpeg"}:
        try:
            from PIL import Image
        except ImportError as exc: raise AssetFactoryError("Pillow required for JPEG inspection") from exc
        with Image.open(path) as im: return im.size
    raise AssetFactoryError(f"unsupported image format: {path}")

def validate_asset(cid, typ, spec, seen):
    errors=[]
    quality_class=spec.get("quality_class")
    if quality_class not in QUALITY_CLASSES: errors.append(f"{cid}/{typ}: invalid quality_class {quality_class!r}")
    status=spec.get("status")
    source_value=spec.get("source")
    path_value=spec.get("path")
    if status not in STATUS: errors.append(f"{cid}/{typ}: invalid status {status!r}")
    if path_value is None:
        if status!="MISSING": errors.append(f"{cid}/{typ}: null path must be MISSING")
        if source_value is not None: errors.append(f"{cid}/{typ}: missing asset cannot have source")
        return errors
    path=Path(path_value)
    if path.is_absolute() or ".." in path.parts: errors.append(f"{cid}/{typ}: unsafe output path")
    if str(path) in seen: errors.append(f"duplicate asset path: {path}")
    seen.add(str(path))
    if path.suffix.lower() not in IMAGE_EXTS: errors.append(f"{cid}/{typ}: unsupported output format")
    source=ROOT/path
    if not source.is_file(): errors.append(f"{cid}/{typ}: missing runtime file {path}"); return errors
    try:
        if source.suffix.lower()==".svg": ElementTree.parse(source)
        w,h=dimensions(source)
    except Exception as exc: errors.append(f"{cid}/{typ}: invalid image: {exc}"); return errors
    rule=manifest()["asset_types"][typ]
    if path.suffix.lower().lstrip(".") not in rule["format"]: errors.append(f"{cid}/{typ}: format not allowed")
    if w<rule["dimensions"]["min_width"] or h<rule["dimensions"]["min_height"]:
        errors.append(f"{cid}/{typ}: dimensions {w}x{h} below minimum")
    if source_value:
        source_path=Path(source_value)
        if source_path.is_absolute() or ".." in source_path.parts: errors.append(f"{cid}/{typ}: unsafe source path")
        elif not (ROOT/source_path).is_file(): errors.append(f"{cid}/{typ}: missing source {source_path}")
    return errors

def validate():
    data=manifest(); canon=canonical(); errors=[]; seen=set()
    for char in data.get("characters",[]):
        cid=str(char.get("character_id",""))
        if cid not in canon: errors.append(f"unknown character_id: {cid!r}"); continue
        c=canon[cid]
        for field in ("display_name","rarity","position"):
            if str(char.get(field,"")) != str(c.get(field,"")): errors.append(f"{cid}: {field} disagrees with canonical data")
        aset=char.get("asset_set",{})
        for typ in data["asset_types"]:
            errors += validate_asset(cid,typ,aset.get(typ,{"source":None,"path":None,"status":"MISSING","quality_class":"MISSING"}),seen)
        for mood,spec in (char.get("expression_variants") or {}).items(): errors += validate_asset(cid,"expression:"+mood,spec,seen)
    return errors

def _svg_wrapper(source, output, width, height, title):
    rel=os.path.relpath(source, output.parent).replace(os.sep,"/")
    output.parent.mkdir(parents=True,exist_ok=True)
    text=f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <image x="0" y="0" width="{width}" height="{height}" preserveAspectRatio="xMidYMid meet" href="{rel}"/>
  <title>{title}</title>
</svg>
'''
    output.write_text(text,encoding="utf-8")

def _svg_inner(source):
    try:
        root = ElementTree.parse(source).getroot()
    except ElementTree.ParseError as exc:
        raise AssetFactoryError(f"invalid SVG source: {source}: {exc}") from exc
    if root.tag.rsplit("}", 1)[-1] != "svg":
        raise AssetFactoryError(f"SVG source root is not <svg>: {source}")
    ElementTree.register_namespace("", "http://www.w3.org/2000/svg")
    return "".join(ElementTree.tostring(child, encoding="unicode") for child in root)

def _nested_svg(inner, x, y, width, height, transform=None):
    transform_attr = f' transform="{transform}"' if transform else ""
    return f'<svg x="{x}" y="{y}" width="{width}" height="{height}" viewBox="0 0 512 768" preserveAspectRatio="xMidYMid meet"{transform_attr}>{inner}</svg>'

def _visual_svg(source,output,w,h,title,typ,mood=None):
    inner=_svg_inner(source)
    bg={'card':'#061522','battle_idle':'#07101d','battle_action':'#06172a','cutin':'#07111f','victory':'#100f24','event':'#081527'}.get(typ,'#07101d')
    label={'card':'CHARACTER CARD','battle_idle':'BATTLE IDLE','battle_action':'BATTLE ACTION','cutin':'HERO MOMENT','victory':'VICTORY','event':'CHARACTER PROFILE'}.get(typ,'CHARACTER')
    if typ=='expression':
        overlay={'neutral':'<path d="M239 276Q256 282 273 276" fill="none" stroke="#ffbf76" stroke-width="3"/>','focus':'<path d="M200 198Q225 184 246 194M266 194Q289 184 309 198" fill="none" stroke="#2f1717" stroke-width="8"/><path d="M207 260Q256 276 305 260" fill="none" stroke="#2f1717" stroke-width="5"/>','happy':'<path d="M203 220Q224 208 245 220M267 220Q288 208 309 220" fill="none" stroke="#4a2b24" stroke-width="7"/><path d="M230 258Q256 282 282 258" fill="none" stroke="#7a332d" stroke-width="6"/><circle cx="190" cy="254" r="8" fill="#e47a73"/><circle cx="322" cy="254" r="8" fill="#e47a73"/>','surprised':'<circle cx="223" cy="224" r="13" fill="#fff" stroke="#4a2b24" stroke-width="4"/><circle cx="289" cy="224" r="13" fill="#fff" stroke="#4a2b24" stroke-width="4"/><ellipse cx="256" cy="273" rx="13" ry="18" fill="#6d3432"/>','determined':'<path d="M201 205L246 218M311 205L266 218" stroke="#2f1717" stroke-width="8"/><path d="M229 264Q256 272 283 264" fill="none" stroke="#7a332d" stroke-width="6"/>'}.get(mood,'')
        body=f'<rect width="{w}" height="{h}" fill="{bg}"/>{_svg_inner(source)}{overlay}'
    elif typ=='card': body=f'<rect width="{w}" height="{h}" fill="{bg}"/><circle cx="384" cy="420" r="320" fill="none" stroke="#00f0ff" stroke-width="4" opacity=".22"/>{_nested_svg(inner,34,42,700,790)}<text x="52" y="890" font-family="Arial Black" font-size="40" fill="#fff">AIKO HANAMORI</text><text x="54" y="924" font-family="Arial Black" font-size="16" fill="#e4572e">R • 3B • POWER</text><text x="54" y="954" font-family="Arial Black" font-size="13" fill="#dbeef2">BIG SWING THREAT</text>'
    elif typ=='battle_idle': body=f'<rect width="{w}" height="{h}" fill="{bg}"/><ellipse cx="192" cy="245" rx="155" ry="180" fill="url(#a)"/>{_nested_svg(inner,22,-10,340,510)}<path d="M212 351L349 258" stroke="#ff00c8" stroke-width="5"/><circle cx="349" cy="258" r="7" fill="#fff"/><text x="16" y="28" font-family="Arial Black" font-size="11" fill="#00f0ff">BATTLE IDLE</text>'
    elif typ=='battle_action': body=f'<rect width="{w}" height="{h}" fill="{bg}"/>{_nested_svg(inner,126,22,390,585,"rotate(-8 320 320)")}<path d="M22 514Q240 420 620 106" fill="none" stroke="url(#s)" stroke-width="30"/><circle cx="520" cy="184" r="18" fill="#fff" stroke="#00f0ff" stroke-width="5"/><text x="48" y="74" font-family="Arial Black" font-size="18" fill="#00f0ff">BATTLE ACTION</text>'
    elif typ=='cutin': body=f'<rect width="{w}" height="{h}" fill="{bg}"/><g clip-path="url(#c)">{_nested_svg(inner,116,-84,520,780)}</g><path d="M0 486L800 0" stroke="#fff" stroke-width="3"/><text x="700" y="92" font-family="Arial Black" font-size="18" fill="#00f0ff">BASEWARRIORS // HERO MOMENT</text><text x="700" y="170" font-family="Arial Black" font-size="54" fill="#fff">BIG SWING</text><text x="700" y="214" font-family="Arial Black" font-size="21" fill="#e4572e">AIKO HANAMORI • POWER • 3B</text>'
    elif typ=='victory': body=f'<rect width="{w}" height="{h}" fill="{bg}"/><circle cx="330" cy="370" r="255" fill="none" stroke="#00f0ff" stroke-width="34" opacity=".12"/><circle cx="330" cy="370" r="220" fill="none" stroke="#ff00c8" stroke-width="3" opacity=".22"/>{_nested_svg(inner,-12,-42,620,930)}<text x="620" y="130" font-family="Arial Black" font-size="18" fill="#00f0ff">VICTORY // HERO MOMENT</text><text x="620" y="218" font-family="Arial Black" font-size="58" fill="#fff">HOME RUN</text><text x="620" y="258" font-family="Arial Black" font-size="21" fill="#e4572e">AIKO HANAMORI</text>'
    else: body=f'<rect width="{w}" height="{h}" fill="{bg}"/><circle cx="350" cy="340" r="285" fill="none" stroke="#00f0ff" stroke-width="4" opacity=".22"/>{_nested_svg(inner,10,-62,630,950)}<rect x="700" y="100" width="500" height="500" rx="28" fill="#091425" stroke="#00f0ff" stroke-width="3"/><text x="732" y="148" font-family="Arial Black" font-size="16" fill="#00f0ff">CHARACTER EXPERIENCE // PROFILE</text><text x="732" y="216" font-family="Arial Black" font-size="48" fill="#fff">AIKO HANAMORI</text><text x="732" y="266" font-family="Arial Black" font-size="17" fill="#e4572e">R • 3B • POWER • FIRE</text><text x="732" y="332" font-family="Arial Black" font-size="23" fill="#00f0ff">BIG SWING THREAT</text>'
    defs='<defs><linearGradient id="g"><stop stop-color="#00f0ff" stop-opacity=".26"/><stop offset="1" stop-color="#ff00c8" stop-opacity=".08"/></linearGradient><radialGradient id="a"><stop stop-color="#00f0ff" stop-opacity=".3"/><stop offset="1" stop-color="#00f0ff" stop-opacity="0"/></radialGradient><linearGradient id="s"><stop stop-color="#00f0ff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#ff00c8" stop-opacity="0"/></linearGradient><clipPath id="c"><path d="M0 0H720L640 540H0Z"/></clipPath></defs>'
    output.parent.mkdir(parents=True,exist_ok=True); output.write_text(f'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{title}</title>{defs}{body}</svg>\n',encoding='utf-8')

def process_character(cid):
    char=next((x for x in manifest()['characters'] if x['character_id']==cid),None)
    if not char: raise AssetFactoryError(f'character not in manifest: {cid}')
    sizes={'card':(768,1024),'battle_idle':(384,512),'battle_action':(640,640),'expression':(512,768),'cutin':(1280,540),'victory':(1024,768),'event':(1280,720)}
    generated=[]
    for typ,spec in char['asset_set'].items():
        sv,pv=spec.get('source'),spec.get('path')
        if not sv or not pv or spec.get('status')=='MISSING': continue
        src=ROOT/sv; dst=ROOT/pv
        if src.suffix.lower()=='.svg' and typ in sizes: _visual_svg(src,dst,*sizes[typ],f'{cid} {typ}',typ)
        elif src.resolve()!=dst.resolve(): dst.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(src,dst)
        generated.append(str(dst.relative_to(ROOT)))
    for mood,spec in (char.get('expression_variants') or {}).items():
        src=ROOT/spec['source']; dst=ROOT/spec['path']; _visual_svg(src,dst,512,768,f'{cid} expression {mood}','expression',mood); generated.append(str(dst.relative_to(ROOT)))
    return generated
def report():
    data=manifest(); print("CHARACTER | ASSET | STATUS | QUALITY | SOURCE | OUTPUT | DIMENSIONS")
    for char in data["characters"]:
        for typ,spec in char["asset_set"].items():
            p=spec.get("path"); dims="-"
            if p and (ROOT/p).is_file():
                try: dims="x".join(map(str,dimensions(ROOT/p)))
                except Exception: dims="INVALID"
            print(" | ".join([char["character_id"],typ,spec.get("status",""),spec.get("quality_class",""),spec.get("source") or "-",p or "-",dims]))
        for mood,spec in (char.get("expression_variants") or {}).items():
            p=spec.get("path"); dims="-"
            if p and (ROOT/p).is_file():
                try: dims="x".join(map(str,dimensions(ROOT/p)))
                except Exception: dims="INVALID"
            print(" | ".join([char["character_id"],f"expression:{mood}",spec.get("status",""),spec.get("quality_class",""),spec.get("source") or "-",p or "-",dims]))
    return 0

def main(argv=None):
    parser=argparse.ArgumentParser(); parser.add_argument("command",choices=["validate","report","process"]); parser.add_argument("--character",default="bw001")
    args=parser.parse_args(argv)
    if args.command=="validate":
        errors=validate()
        for e in errors: print("ERROR:",e,file=sys.stderr)
        print("character asset manifest: PASS_REAL" if not errors else "character asset manifest: FAIL")
        return 0 if not errors else 1
    if args.command=="report": return report()
    generated=process_character(args.character); print("processed:",", ".join(generated)); return 0

if __name__=="__main__": raise SystemExit(main())
