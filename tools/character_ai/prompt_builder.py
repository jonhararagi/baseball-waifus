import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRESETS = json.loads((ROOT / "style_presets.json").read_text(encoding="utf-8"))


def build_prompt(profile: dict, preset_name: str = "baseball_waifus_soft") -> tuple[str, str]:
    preset = PRESETS.get(preset_name, PRESETS["baseball_waifus_soft"])

    body = str(profile.get("body_preset", "balanced"))
    hair = str(profile.get("hair_style", "long"))
    uniform = str(profile.get("uniform_style", "standard"))
    face = str(profile.get("face_style", "soft"))
    height = float(profile.get("height", 1.0))
    shoulders = float(profile.get("shoulder_width", 1.0))
    waist = float(profile.get("waist_width", 0.9))
    hips = float(profile.get("hip_width", 1.0))
    bust = float(profile.get("bust", 1.0))
    head = float(profile.get("head_scale", 1.0))
    display_name = str(profile.get("display_name", "Baseball Waifu"))

    body_terms = {
        "slim": "slim adult athletic build",
        "balanced": "balanced adult athletic build",
        "athletic": "strong adult athletic build",
        "curvy": "curvy adult athletic build, fuller hips and thighs",
        "power": "powerful adult athletic build, broad shoulders",
        "shonen_soft": "rounded adult shonen-sports build, fuller torso, rounded hips and thighs, soft heroic silhouette"
    }
    shape_terms = body_terms.get(body, body_terms["balanced"])

    positive_parts = [
        preset["positive"],
        f"character name {display_name}",
        shape_terms,
        f"body preset {body}",
        f"hair style {hair}",
        f"uniform style {uniform}",
        f"face style {face}",
        f"height proportion {height:.2f}",
        f"shoulder proportion {shoulders:.2f}",
        f"waist proportion {waist:.2f}",
        f"hip proportion {hips:.2f}",
        f"bust proportion {bust:.2f}",
        f"head proportion {head:.2f}",
        "adult original game character",
        "original sports anime aesthetic",
        "no direct franchise imitation"
    ]
    positive = ", ".join(positive_parts)
    negative = preset["negative"]
    return positive, negative
