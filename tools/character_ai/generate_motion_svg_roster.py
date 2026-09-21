#!/usr/bin/env python3
"""Generate deterministic four-frame 2D baseball character motion sheets.

The tool reads only character_archetypes.json. It creates original SVG artwork
for each roster character with four presentation frames:
IDLE, READY, SWING and RUN.

These are replaceable prototype assets, not gameplay data and not final art.
No external model, checkpoint or third-party image is required.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def esc(value: str) -> str:
    return str(value).replace("&", "&amp;").replace('"', "&quot;")


def frame(character: dict, index: int, x: int) -> str:
    v = character["visual"]
    skin = v.get("skin", "#e0ad90")
    hair = v.get("hair_color", "#3b2a2a")
    uniform = v.get("uniform_color", "#f3f3f3")
    accent = v.get("accent", "#e4572e")
    eye = v.get("eye", "#30252a")
    bw = 78 * float(v.get("shoulder_width", 1.0))
    hip = 68 * float(v.get("hip_width", 1.0))
    bust = 58 * float(v.get("bust", 1.0))
    scale = 0.92 + 0.08 * float(v.get("height", 1.0))
    hair_style = str(v.get("hair_style", "long"))

    poses = {
        0: {"lean": 0, "arm": 0, "leg": 0, "bat": -18},
        1: {"lean": -5, "arm": -18, "leg": 10, "bat": -42},
        2: {"lean": 12, "arm": 34, "leg": 18, "bat": 58},
        3: {"lean": -8, "arm": -30, "leg": 34, "bat": 12},
    }
    p = poses[index]
    cx = x + 256
    transform = f"translate({cx} 40) rotate({p['lean']} 0 360) scale({scale:.3f})"

    if hair_style == "short":
        hair_path = f'<path d="M184 150 Q256 68 328 150 L320 245 Q292 220 256 226 Q220 220 192 245 Z" fill="{hair}"/>'
    elif hair_style == "ponytail":
        hair_path = (
            f'<path d="M180 154 Q256 66 332 154 L322 248 Q292 218 256 226 Q220 218 190 248 Z" fill="{hair}"/>'
            f'<path d="M326 166 Q394 198 360 306 Q334 278 328 232 Z" fill="{hair}"/>'
        )
    elif hair_style == "twin_tail":
        hair_path = (
            f'<path d="M180 154 Q256 66 332 154 L322 248 Q292 218 256 226 Q220 218 190 248 Z" fill="{hair}"/>'
            f'<path d="M188 172 Q132 210 162 292 Q188 266 192 224 Z" fill="{hair}"/>'
            f'<path d="M324 172 Q380 210 350 292 Q324 266 320 224 Z" fill="{hair}"/>'
        )
    else:
        hair_path = f'<path d="M176 160 Q256 54 336 160 L326 292 Q300 238 256 228 Q212 238 186 292 Z" fill="{hair}"/>'

    leg_a = -hip * 0.35 - p["leg"]
    leg_b = hip * 0.35 + p["leg"]
    arm_a = -bw - 28 - p["arm"]
    arm_b = bw + 28 + p["arm"]
    bat_angle = p["bat"]

    return f"""
<g transform="{transform}">
  <ellipse cx="0" cy="714" rx="92" ry="12" fill="#000" opacity="0.10"/>
  <path d="M{-bw:.1f} 430 Q256 392 {bw:.1f} 430 L{hip:.1f} 592 Q256 632 {-hip:.1f} 592 Z"
        transform="translate(-256 0)" fill="{uniform}" stroke="{accent}" stroke-width="6"/>
  <path d="M{-bw:.1f} 430 Q{256-bust:.1f} 374 256 400 Q{256+bust:.1f} 374 {bw:.1f} 430"
        transform="translate(-256 0)" fill="{uniform}" stroke="{accent}" stroke-width="5"/>
  <path d="M{leg_a:.1f} 582 L{leg_a-10:.1f} 716" stroke="{uniform}" stroke-width="44" stroke-linecap="round"/>
  <path d="M{leg_b:.1f} 582 L{leg_b+10:.1f} 716" stroke="{uniform}" stroke-width="44" stroke-linecap="round"/>
  <path d="M{leg_a-10:.1f} 716 L{leg_a-42:.1f} 716" stroke="{accent}" stroke-width="24" stroke-linecap="round"/>
  <path d="M{leg_b+10:.1f} 716 L{leg_b+42:.1f} 716" stroke="{accent}" stroke-width="24" stroke-linecap="round"/>
  <path d="M{-bw-32-arm_a:.1f} 468 Q{arm_a:.1f} 520 {-bw-18:.1f} 566" fill="none" stroke="{skin}" stroke-width="25" stroke-linecap="round"/>
  <path d="M{bw+32+arm_b:.1f} 468 Q{arm_b:.1f} 520 {bw+18:.1f} 566" fill="none" stroke="{skin}" stroke-width="25" stroke-linecap="round"/>
  <ellipse cx="256" cy="188" rx="66" ry="76" fill="{skin}"/>
  {hair_path}
  <ellipse cx="226" cy="184" rx="9" ry="14" fill="{eye}"/>
  <ellipse cx="286" cy="184" rx="9" ry="14" fill="{eye}"/>
  <circle cx="229" cy="181" r="3" fill="#fff"/>
  <circle cx="289" cy="181" r="3" fill="#fff"/>
  <path d="M244 220 Q256 226 268 220" fill="none" stroke="#7a4b43" stroke-width="5" stroke-linecap="round"/>
  <path d="M{bw-4:.1f} 492 L{bw+76:.1f} 406" stroke="#9a633d" stroke-width="12" stroke-linecap="round"
        transform="rotate({bat_angle} {bw:.1f} 492)"/>
  <circle cx="256" cy="414" r="9" fill="{accent}"/>
</g>
""".replace("translate(-256 0)", "")


def svg_for(character: dict) -> str:
    name = esc(character["display_name"])
    panels = []
    for i in range(4):
        panels.append(frame(character, i, i * 512))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="768" viewBox="0 0 2048 768">
  <title>{name} Baseball Waifus motion sheet</title>
  <rect width="2048" height="768" fill="#ffffff"/>
  <g>{''.join(panels)}</g>
</svg>
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="game/characters/character_archetypes.json")
    parser.add_argument("--output", default="assets/characters/generated/motion")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    catalog = json.loads((root / args.catalog).read_text(encoding="utf-8"))
    output = root / args.output
    output.mkdir(parents=True, exist_ok=True)

    manifest = {
        "version": 1,
        "source": args.catalog,
        "frames": ["IDLE", "READY", "SWING", "RUN"],
        "characters": [],
    }

    for character in catalog["characters"]:
        character_id = str(character["id"])
        target = output / f"{character_id}_motion.svg"
        target.write_text(svg_for(character), encoding="utf-8")
        manifest["characters"].append(
            {"id": character_id, "display_name": character["display_name"], "asset": str(target.relative_to(root))}
        )

    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"generated {len(manifest['characters'])} four-frame motion sheets in {output}")


if __name__ == "__main__":
    main()
