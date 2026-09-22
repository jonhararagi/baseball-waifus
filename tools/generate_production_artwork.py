#!/usr/bin/env python3
"""Generate production character artwork for Baseball Waifus.

Artwork generation is an offline build step. The shipped game never calls
Pollinations at runtime.
"""
from __future__ import annotations

import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / "data" / "characters_queue.json"
CARDS_DIR = ROOT / "assets" / "production" / "cards"
SPRITES_DIR = ROOT / "assets" / "production" / "sprites"

TARGET_IDS = ("bw001", "bw002")
POLLINATIONS_URL = "https://image.pollinations.ai/prompt"
MAX_ATTEMPTS = 3
REQUEST_TIMEOUT = 120

class GenerationError(RuntimeError):
    pass

def log(message: str) -> None:
    print(f"[production-art] {message}", flush=True)

def load_targets() -> list[dict]:
    data = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    targets = {
        str(item.get("character_id")): item
        for item in data.get("production_targets", [])
        if isinstance(item, dict)
    }
    missing = [char_id for char_id in TARGET_IDS if char_id not in targets]
    if missing:
        raise GenerationError(
            "Missing production targets in queue: " + ", ".join(missing)
        )
    return [targets[char_id] for char_id in TARGET_IDS]

def build_url(prompt: str, width: int, height: int, seed: int) -> str:
    params = {
        "width": str(width),
        "height": str(height),
        "seed": str(seed),
        "nologo": "true",
        "enhance": "true",
    }
    encoded_prompt = urllib.parse.quote(prompt, safe="")
    return f"{POLLINATIONS_URL}/{encoded_prompt}?{urllib.parse.urlencode(params)}"

def download_image(prompt: str, width: int, height: int, seed: int, label: str) -> Image.Image:
    url = build_url(prompt, width, height, seed)
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        log(f"request {label}: attempt {attempt}/{MAX_ATTEMPTS}")
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "BaseballWaifusProductionArt/1.0",
                    "Accept": "image/*",
                },
            )
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                payload = response.read()
            image = Image.open(io.BytesIO(payload)).convert("RGBA")
            if image.width < 256 or image.height < 256:
                raise GenerationError(
                    f"{label}: generator returned {image.size}"
                )
            return image
        except (
            urllib.error.URLError,
            TimeoutError,
            OSError,
            GenerationError,
        ) as exc:
            last_error = exc
            if attempt < MAX_ATTEMPTS:
                time.sleep(2 * attempt)
    raise GenerationError(f"{label}: generation failed: {last_error}")

def save_card(image: Image.Image, output: Path, width: int, height: int) -> None:
    normalized = ImageOps.fit(
        image.convert("RGB"),
        (width, height),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.45),
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(
        output,
        format="JPEG",
        quality=95,
        subsampling=0,
        optimize=True,
        progressive=True,
    )
    with Image.open(output) as check:
        if check.size != (width, height) or check.mode != "RGB":
            raise GenerationError(
                f"Invalid card output: {output} {check.size} {check.mode}"
            )
    if output.stat().st_size < 100_000:
        raise GenerationError(f"Card output is suspiciously small: {output}")

def chroma_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    keyed = []
    for r, g, b, a in rgba.getdata():
        green_strength = g - max(r, b)
        if g >= 145 and green_strength >= 48 and g >= b * 1.10 and g >= r * 1.20:
            keyed.append((r, g, b, 0))
            continue
        if g >= 120 and green_strength >= 25 and g >= b * 1.05:
            factor = max(0.0, min(1.0, (green_strength - 25) / 50.0))
            alpha = int(255 * (1.0 - factor * 0.82))
            keyed.append((r, g, b, min(a, alpha)))
            continue
        keyed.append((r, g, b, a))
    result = Image.new("RGBA", rgba.size)
    result.putdata(keyed)
    return result

def save_sprite(image: Image.Image, output: Path, width: int = 128, height: int = 128) -> None:
    keyed = chroma_key(image)
    bbox = keyed.getchannel("A").getbbox()
    if bbox is None:
        raise GenerationError(f"Sprite has no visible pixels: {output}")

    crop = keyed.crop(bbox)
    margin = 8
    crop.thumbnail(
        (width - margin * 2, height - margin * 2),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - crop.width) // 2
    y = (height - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))

    if canvas.getchannel("A").getbbox() is None:
        raise GenerationError(f"Sprite became empty after normalization: {output}")

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)

    with Image.open(output) as check:
        if check.size != (width, height) or check.mode != "RGBA":
            raise GenerationError(
                f"Invalid sprite output: {output} {check.size} {check.mode}"
            )
        alpha_min, alpha_max = check.getchannel("A").getextrema()
        if alpha_min == 255:
            raise GenerationError(f"Sprite is not transparent: {output}")

    if output.stat().st_size < 1_500:
        raise GenerationError(f"Sprite output is suspiciously small: {output}")

def process_target(target: dict) -> None:
    char_id = str(target["character_id"])
    seed = int(target.get("seed", 0))

    card_cfg = target["card"]
    sprite_cfg = target["sprite"]

    card_output = CARDS_DIR / f"{char_id}--normal.jpg"
    sprite_output = SPRITES_DIR / f"{char_id}_idle.png"

    card_image = download_image(
        str(card_cfg["prompt"]),
        int(card_cfg["width"]),
        int(card_cfg["height"]),
        seed,
        f"{char_id} card",
    )
    save_card(
        card_image,
        card_output,
        int(card_cfg["width"]),
        int(card_cfg["height"]),
    )

    sprite_image = download_image(
        str(sprite_cfg["prompt"]),
        int(sprite_cfg["width"]),
        int(sprite_cfg["height"]),
        seed + 1000,
        f"{char_id} sprite",
    )
    save_sprite(sprite_image, sprite_output)

    for legacy in (
        CARDS_DIR / f"{char_id}.svg",
        SPRITES_DIR / f"{char_id}.svg",
    ):
        if legacy.exists():
            legacy.unlink()
            log(f"removed legacy asset: {legacy.relative_to(ROOT)}")

def main() -> int:
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)

    for target in load_targets():
        log(f"processing {target['character_id']} ({target['display_name']})")
        process_target(target)

    required = [
        CARDS_DIR / "bw001--normal.jpg",
        CARDS_DIR / "bw002--normal.jpg",
        SPRITES_DIR / "bw001_idle.png",
        SPRITES_DIR / "bw002_idle.png",
    ]
    for path in required:
        if not path.is_file() or path.stat().st_size <= 0:
            raise GenerationError(f"Missing generated asset: {path}")

    log("production artwork generation completed")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GenerationError as exc:
        print(f"[production-art] ERROR: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(1)
