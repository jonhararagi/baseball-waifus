class_name CharmDialogueCatalog
extends RefCounted

const DATA_PATH := "res://game/progression/charm_dialogues.json"
static var _cache: Dictionary = {}

static func conversations(character_id: String) -> Array:
    if _cache.is_empty():
        _load()
    var entry = _cache.get(character_id, [])
    return entry.duplicate(true)

static func _load() -> void:
    if not FileAccess.file_exists(DATA_PATH):
        push_error("CharmDialogueCatalog: missing " + DATA_PATH)
        return
    var parsed = JSON.parse_string(FileAccess.get_file_as_string(DATA_PATH))
    if not parsed is Dictionary:
        push_error("CharmDialogueCatalog: invalid JSON")
        return
    for entry in parsed.get("characters", []):
        _cache[str(entry.get("character_id", ""))] = entry.get("conversations", [])
