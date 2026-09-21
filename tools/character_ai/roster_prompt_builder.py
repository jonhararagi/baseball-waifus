import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "game" / "characters" / "character_archetypes.json"


def build_prompt(character: dict, hair_color: str | None = None, hair_style: str | None = None, body_scale: float = 1.0) -> str:
    visual = character["visual"]
    hair = hair_color or visual["hair_color"]
    hairstyle = hair_style or visual["hair_style"]
    scale = max(0.94, min(1.06, float(body_scale)))
    return ", ".join([
        "adult anime woman baseball player",
        "original baseball sports anime game character",
        "full body character design",
        "mature face",
        "adult athletic proportions",
        f"name {character['display_name']}",
        f"position {character['position']}",
        f"specialization {character['specialization']}",
        f"element accent {character['element']}",
        f"body preset {visual['body_preset']}",
        f"body scale {scale:.2f}",
        f"hair color {hair}",
        f"hairstyle {hairstyle}",
        f"face style {visual['face_style']}",
        f"skin tone {visual['skin']}",
        "baseball uniform",
        "baseball cap or sports accessory only when appropriate",
        "clean cel shading",
        "strong readable silhouette",
        "tasteful fanservice",
        "no childlike proportions",
        "no chibi",
        "no text",
        "no watermark",
    ])


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for character in data["characters"]:
        print(f"## {character['id']} {character['display_name']}")
        print(build_prompt(character))
        print()


if __name__ == "__main__":
    main()
