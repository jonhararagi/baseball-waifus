#!/usr/bin/env python3
"""Generate deterministic SVG prototype portraits from the Baseball Waifus roster catalog.

These are lightweight placeholder assets for Godot integration. They intentionally
use only the visual data already present in character_archetypes.json and can be
replaced later by licensed raster/rig artwork without changing PlayerData.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def svg_for(character: dict) -> str:
    v = character["visual"]
    skin = v.get("skin", "#e0ad90")
    hair = v.get("hair_color", "#3b2a2a")
    uniform = v.get("uniform_color", "#f3f3f3")
    accent = v.get("accent", "#e4572e")
    eye = v.get("eye", "#30252a")
    bw = 92 * v.get("shoulder_width", 1.0)
    hip = 82 * v.get("hip_width", 1.0)
    bust = 70 * v.get("bust", 1.0)
    scale = v.get("height", 1.0)
    face_rx = 67 if v.get("face_style") == "sharp" else 72
    hair_style = v.get("hair_style", "long")
    if hair_style == "short":
        hair_path = f'<path d="M184 166 Q256 78 328 166 L320 255 Q292 222 256 230 Q220 222 192 255 Z" fill="{hair}"/>'
    elif hair_style == "ponytail":
        hair_path = (
            f'<path d="M184 166 Q256 78 328 166 L320 255 Q292 222 256 230 '
            f'Q220 222 192 255 Z" fill="{hair}"/>'
            f'<path d="M325 185 Q398 208 358 318 Q332 286 330 242 Z" fill="{hair}"/>'
        )
    else:
        hair_path = f'<path d="M176 174 Q256 65 336 174 L327 300 Q302 245 256 236 Q210 245 185 300 Z" fill="{hair}"/>'
    s = 0.94 + 0.06 * scale
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="768" viewBox="0 0 512 768">
  <g transform="translate(0 {round(18 * (1-scale))}) scale({s:.3f})">
    <path d="M{256-bw:.1f} 430 Q256 388 {256+bw:.1f} 430 L{256+hip:.1f} 600 Q256 650 {256-hip:.1f} 600 Z" fill="{uniform}" stroke="{accent}" stroke-width="6"/>
    <path d="M{256-bw:.1f} 430 Q{256-bust:.1f} 372 256 398 Q{256+bust:.1f} 372 {256+bw:.1f} 430" fill="{uniform}" stroke="{accent}" stroke-width="5"/>
    <path d="M{256-bw-44:.1f} 482 Q{256-bw-32:.1f} 535 {256-bw-32:.1f} 565" fill="none" stroke="{skin}" stroke-width="24" stroke-linecap="round"/>
    <path d="M{256+bw+44:.1f} 482 Q{256+bw+32:.1f} 535 {256+bw+32:.1f} 565" fill="none" stroke="{skin}" stroke-width="24" stroke-linecap="round"/>
    <path d="M218 590 L204 738 M294 590 L308 738" stroke="{uniform}" stroke-width="48" stroke-linecap="round"/>
    <path d="M204 738 L176 738 M308 738 L336 738" stroke="{accent}" stroke-width="24" stroke-linecap="round"/>
    <ellipse cx="256" cy="190" rx="{face_rx}" ry="78" fill="{skin}"/>
    {hair_path}
    <path d="M190 158 Q256 118 322 158" fill="none" stroke="{hair}" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="225" cy="184" rx="9" ry="14" fill="{eye}"/><ellipse cx="287" cy="184" rx="9" ry="14" fill="{eye}"/>
    <circle cx="228" cy="181" r="3" fill="#fff"/><circle cx="290" cy="181" r="3" fill="#fff"/>
    <path d="M244 220 Q256 226 268 220" fill="none" stroke="#7a4b43" stroke-width="5" stroke-linecap="round"/>
    <path d="M222 150 Q238 142 249 148 M263 148 Q274 142 290 150" fill="none" stroke="{hair}" stroke-width="6" stroke-linecap="round"/>
    <path d="M{256-bust:.1f} 416 Q256 446 {256+bust:.1f} 416" fill="none" stroke="{accent}" stroke-width="7"/>
    <circle cx="256" cy="414" r="9" fill="{accent}"/>
  </g>
</svg>
'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="game/characters/character_archetypes.json")
    parser.add_argument("--output", default="assets/characters/generated")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    catalog = json.loads((root / args.catalog).read_text(encoding="utf-8"))
    output = root / args.output
    output.mkdir(parents=True, exist_ok=True)
    for character in catalog["characters"]:
        (output / f'{character["id"]}.svg').write_text(svg_for(character), encoding="utf-8")
    print(f"generated {len(catalog['characters'])} prototype SVG portraits in {output}")


if __name__ == "__main__":
    main()
