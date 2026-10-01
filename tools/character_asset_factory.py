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
    try: w,h=dimensions(source)
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
            errors += validate_asset(cid,typ,aset.get(typ,{"source":None,"path":None,"status":"MISSING"}),seen)
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

def process_character(cid):
    data=manifest(); char=next((x for x in data["characters"] if x["character_id"]==cid),None)
    if not char: raise AssetFactoryError(f"character not in manifest: {cid}")
    generated=[]
    for typ,spec in char["asset_set"].items():
        source_value,path_value=spec.get("source"),spec.get("path")
        if not source_value or not path_value or spec.get("status")=="MISSING": continue
        source=ROOT/source_value; output=ROOT/path_value
        if source.resolve()==output.resolve(): generated.append(str(output.relative_to(ROOT))); continue
        if source.suffix.lower()==".svg" and typ in {"card","battle_idle","event"}:
            sizes={"card":(768,1024),"battle_idle":(256,384),"event":(1280,720)}
            _svg_wrapper(source,output,*sizes[typ],f"{cid} {typ}")
        elif source.suffix.lower()==".svg":
            output.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(source,output)
        else:
            try:
                from PIL import Image,ImageOps
            except ImportError as exc: raise AssetFactoryError("Pillow required for raster processing") from exc
            with Image.open(source) as im:
                rgba=im.convert("RGBA"); target=manifest()["asset_types"][typ]["dimensions"]
                fitted=ImageOps.contain(rgba,(target["min_width"],target["min_height"]),Image.Resampling.LANCZOS)
                canvas=Image.new("RGBA",(target["min_width"],target["min_height"]),(0,0,0,0))
                canvas.alpha_composite(fitted,((canvas.width-fitted.width)//2,(canvas.height-fitted.height)//2))
                output.parent.mkdir(parents=True,exist_ok=True); canvas.save(output,"PNG",optimize=True)
        generated.append(str(output.relative_to(ROOT)))
    return generated

def report():
    data=manifest(); print("CHARACTER | ASSET | STATUS | SOURCE | OUTPUT | DIMENSIONS")
    for char in data["characters"]:
        for typ,spec in char["asset_set"].items():
            p=spec.get("path"); dims="-"
            if p and (ROOT/p).is_file():
                try: dims="x".join(map(str,dimensions(ROOT/p)))
                except Exception: dims="INVALID"
            print(" | ".join([char["character_id"],typ,spec.get("status",""),spec.get("source") or "-",p or "-",dims]))
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
