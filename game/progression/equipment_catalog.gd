class_name EquipmentCatalog
extends RefCounted

## Immutable gameplay catalog for equipment.
## Inventory ownership lives in PlayerProgressStore.
## Character equipment references live in CharacterRosterStore.
## Appearance identifiers are presentation-only and never affect gameplay.

const DATA_PATH := "res://game/progression/equipment_catalog.json"
const VALID_SLOTS := ["gloves", "bats", "caps", "vests", "skirts", "shoes"]
const VALID_RARITIES := ["R", "SR", "SSR", "UR"]
const VALID_STATS := ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"]

static var _cache: Array = []

static func all() -> Array:
	if _cache.is_empty():
		_load()
	return _cache.duplicate(true)

static func find(item_id: String) -> Dictionary:
	for item in all():
		if str(item.get("id", "")) == item_id:
			return item.duplicate(true)
	return {}

static func is_valid(item_id: String) -> bool:
	return not find(item_id).is_empty()

static func slot_for(item_id: String) -> String:
	return str(find(item_id).get("slot", ""))

static func modifiers_for(item_id: String) -> Dictionary:
	return find(item_id).get("stat_modifiers", {}).duplicate(true)

static func validate(item_id: String) -> Dictionary:
	var item := find(item_id)
	if item.is_empty():
		return {"ok": false, "reason": "unknown_equipment"}
	var slot := str(item.get("slot", ""))
	var rarity := str(item.get("rarity", ""))
	if slot not in VALID_SLOTS:
		return {"ok": false, "reason": "invalid_slot"}
	if rarity not in VALID_RARITIES:
		return {"ok": false, "reason": "invalid_rarity"}
	var modifiers: Dictionary = item.get("stat_modifiers", {})
	if typeof(modifiers) != TYPE_DICTIONARY:
		return {"ok": false, "reason": "invalid_modifiers"}
	for stat in modifiers.keys():
		if str(stat) not in VALID_STATS:
			return {"ok": false, "reason": "invalid_stat", "stat": str(stat)}
		if int(modifiers[stat]) < 0:
			return {"ok": false, "reason": "negative_modifier", "stat": str(stat)}
	return {"ok": true, "item": item.duplicate(true)}

static func _load() -> void:
	if not FileAccess.file_exists(DATA_PATH):
		push_error("EquipmentCatalog: missing " + DATA_PATH)
		_cache = []
		return
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(DATA_PATH))
	if parsed is Dictionary and parsed.has("equipment"):
		_cache = parsed.equipment
	else:
		push_error("EquipmentCatalog: invalid JSON catalog")
		_cache = []
