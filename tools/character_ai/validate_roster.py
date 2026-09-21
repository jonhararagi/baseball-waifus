import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "game" / "characters" / "character_archetypes.json"

ALLOWED_VARIANTS = {"hair_color", "hair_style", "body_scale"}
HAIR_STYLES = {"long", "short", "bob", "ponytail", "twin_tail"}
BODY_PRESETS = {"slim", "balanced", "athletic", "curvy", "power", "shonen_soft"}
RARITIES = {"R", "SR", "SSR", "UR"}


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    characters = data["characters"]
    assert data["adult_only"] is True
    assert len(characters) == 30

    ids = [c["id"] for c in characters]
    assert len(set(ids)) == 30

    rarity_counts = {rarity: 0 for rarity in RARITIES}
    for character in characters:
        assert character["rarity"] in RARITIES
        rarity_counts[character["rarity"]] += 1
        assert character["visual"]["body_preset"] in BODY_PRESETS
        assert character["visual"]["hair_style"] in HAIR_STYLES
        assert set(character["variant_rules"]["allowed"]) == ALLOWED_VARIANTS
        assert character["variant_rules"]["body_scale_min"] == 0.94
        assert character["variant_rules"]["body_scale_max"] == 1.06

    assert rarity_counts == {"R": 5, "SR": 13, "SSR": 10, "UR": 2}
    print("PASS: 30 character archetypes, unique IDs and variant constraints are valid.")


if __name__ == "__main__":
    main()
