extends Node

const STARTER_ID := "bw001"
const PORTRAIT_PATH := "res://assets/ui/characters/bw001_portrait.svg"
const FIRE_ICON_PATH := "res://assets/ui/icons/icon_fire.svg"
const POWER_ICON_PATH := "res://assets/ui/icons/icon_power.svg"

func _ready() -> void:
    var entry := CharacterArchetypeCatalog.find(STARTER_ID)
    assert(not entry.is_empty(), "bw001 must exist in the canonical character catalog.")

    var visual: Dictionary = entry.get("visual", {})
    assert(str(entry.get("rarity", "")) == "R", "bw001 rarity must remain R.")
    assert(str(entry.get("element", "")) == "fire", "bw001 element must remain fire.")
    assert(str(entry.get("position", "")) == "3B", "bw001 position must remain 3B.")
    assert(str(entry.get("specialization", "")) == "power", "bw001 specialization must remain power.")
    assert(str(visual.get("body_preset", "")) == "power", "bw001 body preset must remain power.")
    assert(str(visual.get("hair_color", "")) == "#5a3327", "bw001 hair color changed unexpectedly.")
    assert(str(visual.get("accent", "")) == "#e4572e", "bw001 accent changed unexpectedly.")

    assert(ResourceLoader.exists(PORTRAIT_PATH), "bw001 portrait asset must exist.")
    assert(ResourceLoader.exists(FIRE_ICON_PATH), "Fire icon asset must exist.")
    assert(ResourceLoader.exists(POWER_ICON_PATH), "Power icon asset must exist.")

    var dialogue := StartingCharacterDialogue.new()
    assert(dialogue.load_data(), "bw001 dialogue data must load.")
    assert(dialogue.count() == 10, "bw001 must expose exactly ten hub comments.")

    var player := CharacterArchetypeCatalog.create_player(STARTER_ID)
    assert(player != null, "bw001 PlayerData must resolve.")
    assert(int(player.power) == int(entry.stats.power), "Presentation setup may not mutate gameplay stats.")

    print("bw001 presentation QA passed: catalog, portrait, icons and ten dialogue lines are structurally valid.")
