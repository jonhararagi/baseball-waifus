class_name CharacterRosterStore
extends RefCounted

## Single persistent authority for owned character instances.
##
## Static archetype data remains immutable in CharacterArchetypeCatalog.
## This store owns instance progression: level, stats, charm, mood,
## character energy and gameplay equipment references.
##
## PlayerProgressStore remains responsible for account-level energy/materials.
## Its character-energy compatibility methods are migrated to this store.

const SAVE_PATH := "user://baseball_waifus/character_roster.json"
const SAVE_VERSION := 1

const STAT_NAMES := [
	"power", "contact", "speed", "pitch",
	"control", "defense", "critical", "stamina"
]
const STAT_CAP := 100
const LEVEL_MIN := 1
const LEVEL_MAX := 100
const ENERGY_MAX := 100
const ENERGY_REGEN_SECONDS := 360
const MOOD_MIN := 0
const MOOD_MAX := 100

var state: Dictionary = {}

func load_state() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		state = _defaults()
		save_state()
		return state.duplicate(true)
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		state = _defaults()
		return state.duplicate(true)
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		state = _defaults()
		return state.duplicate(true)
	state = _sanitize(parsed)
	return state.duplicate(true)

func save_state() -> bool:
	if state.is_empty():
		state = _defaults()
	return _write_state(_sanitize(state))

func _write_state(clean: Dictionary) -> bool:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(_sanitize(clean), "	"))
	return true

func has_character(character_id: String) -> bool:
	_ensure_loaded()
	return not character_id.is_empty() and state.get("characters", {}).has(character_id)

func ensure_character(player: PlayerData) -> Dictionary:
	_ensure_loaded()
	if player == null or player.id.is_empty():
		return {"ok": false, "reason": "invalid_character"}
	var characters: Dictionary = state.get("characters", {})
	if characters.has(player.id):
		var existing: Dictionary = characters[player.id]
		_apply_instance_to_player(player, existing)
		return {"ok": true, "created": false, "player": player}
	var record := _record_from_player(player)
	characters[player.id] = record
	state["characters"] = characters
	if not save_state():
		characters.erase(player.id)
		state["characters"] = characters
		return {"ok": false, "reason": "save_failed"}
	_apply_instance_to_player(player, record)
	return {"ok": true, "created": true, "player": player}

func get_player(character_id: String) -> PlayerData:
	_ensure_loaded()
	if character_id.is_empty():
		return null
	var record = state.get("characters", {}).get(character_id, null)
	if record == null:
		return null
	var player := CharacterArchetypeCatalog.create_player(character_id)
	if player == null:
		return null
	_apply_instance_to_player(player, record)
	return player

func list_character_ids() -> Array[String]:
	_ensure_loaded()
	var result: Array[String] = []
	for key in state.get("characters", {}).keys():
		result.append(str(key))
	result.sort()
	return result

func snapshot_character(character_id: String) -> Dictionary:
	_ensure_loaded()
	var record = state.get("characters", {}).get(character_id, null)
	return record.duplicate(true) if typeof(record) == TYPE_DICTIONARY else {}

func apply_training(character_id: String, gains: Dictionary) -> Dictionary:
	_ensure_loaded()
	var record = snapshot_character(character_id)
	if record.is_empty():
		return {"ok": false, "reason": "character_not_owned"}
	for stat in gains.keys():
		if str(stat) not in STAT_NAMES:
			return {"ok": false, "reason": "invalid_stat", "stat": str(stat)}
		var amount := int(gains[stat])
		if amount < 0:
			return {"ok": false, "reason": "invalid_gain"}
	var candidate := state.duplicate(true)
	var target: Dictionary = candidate["characters"][character_id]
	var applied: Dictionary = {}
	for stat in gains.keys():
		var key := str(stat)
		var before := int(target["stats"].get(key, 0))
		var after := mini(STAT_CAP, before + int(gains[key]))
		target["stats"][key] = after
		applied[key] = after - before
	target["level"] = clampi(int(target.get("level", 1)), LEVEL_MIN, LEVEL_MAX)
	candidate["characters"][character_id] = target
	if not _write_state(candidate):
		return {"ok": false, "reason": "save_failed"}
	state = _sanitize(candidate)
	return {"ok": true, "character_id": character_id, "stat_gains": applied}

func set_charm(character_id: String, charm: int) -> Dictionary:
	return _update_character_value(character_id, "charm", clampi(charm, 0, CharmSystem.MAX_CHARM))

func add_charm(character_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	var record := snapshot_character(character_id)
	if record.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_request"}
	return set_charm(character_id, int(record.get("charm", 0)) + amount)

func set_mood(character_id: String, mood: int) -> Dictionary:
	return _update_character_value(character_id, "mood", clampi(mood, MOOD_MIN, MOOD_MAX))

func add_character_energy(character_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	var record := snapshot_character(character_id)
	if record.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_request"}
	var before := get_character_energy(character_id)
	return _update_character_value(character_id, "energy", clampi(before + amount, 0, ENERGY_MAX), before)

func consume_character_energy(character_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	var record := snapshot_character(character_id)
	if record.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_request"}
	var before := get_character_energy(character_id)
	if before < amount:
		return {"ok": false, "reason": "insufficient_energy", "current": before}
	return _update_character_value(character_id, "energy", before - amount, before)

func get_character_energy(character_id: String) -> int:
	_ensure_loaded()
	_regenerate_character(character_id, int(Time.get_unix_time_from_system()))
	var record = state.get("characters", {}).get(character_id, null)
	return clampi(int(record.get("energy", ENERGY_MAX)), 0, ENERGY_MAX) if typeof(record) == TYPE_DICTIONARY else 0

func regenerate_character_energy(character_id: String, now_unix: int = -1) -> Dictionary:
	_ensure_loaded()
	if character_id.is_empty():
		return {"ok": false, "reason": "invalid_character"}
	var now := int(Time.get_unix_time_from_system()) if now_unix < 0 else now_unix
	return _regenerate_character(character_id, now)

func set_equipment_item(character_id: String, slot: String, item_id: String) -> Dictionary:
	_ensure_loaded()
	if slot.is_empty() or item_id.is_empty():
		return {"ok": false, "reason": "invalid_equipment"}
	var record := snapshot_character(character_id)
	if record.is_empty():
		return {"ok": false, "reason": "character_not_owned"}
	var equipment: Dictionary = record.get("equipment", {})
	equipment[slot] = item_id
	record["equipment"] = equipment
	return _replace_character(character_id, record)

func get_equipment(character_id: String) -> Dictionary:
	_ensure_loaded()
	var record = state.get("characters", {}).get(character_id, null)
	return record.get("equipment", {}).duplicate(true) if typeof(record) == TYPE_DICTIONARY else {}

func snapshot() -> Dictionary:
	_ensure_loaded()
	return state.duplicate(true)

func restore_snapshot(snapshot_state: Dictionary) -> bool:
	if typeof(snapshot_state) != TYPE_DICTIONARY:
		return false
	var clean := _sanitize(snapshot_state)
	if not _write_state(clean):
		return false
	state = clean
	return true

func _update_character_value(character_id: String, key: String, value: int, before_override: int = -1) -> Dictionary:
	_ensure_loaded()
	var record := snapshot_character(character_id)
	if record.is_empty():
		return {"ok": false, "reason": "character_not_owned"}
	var before := int(record.get(key, 0)) if before_override < 0 else before_override
	record[key] = value
	var result := _replace_character(character_id, record)
	if result.get("ok", false):
		result["before"] = before
		result["after"] = value
		result["delta"] = value - before
	return result

func _replace_character(character_id: String, record: Dictionary) -> Dictionary:
	if character_id.is_empty() or record.is_empty():
		return {"ok": false, "reason": "invalid_character"}
	var candidate := state.duplicate(true)
	candidate["characters"][character_id] = record
	if not save_state(candidate):
		return {"ok": false, "reason": "save_failed"}
	state = _sanitize(candidate)
	return {"ok": true, "character_id": character_id}

func _record_from_player(player: PlayerData) -> Dictionary:
	return {
		"character_id": player.id,
		"level": clampi(player.level, LEVEL_MIN, LEVEL_MAX),
		"potential": maxi(0, player.potential),
		"stats": _stats_from_player(player),
		"charm": clampi(player.charm, 0, CharmSystem.MAX_CHARM),
		"mood": clampi(player.mood, MOOD_MIN, MOOD_MAX),
		"energy": ENERGY_MAX,
		"energy_last_regen_unix": int(Time.get_unix_time_from_system()),
		"equipment": {}
	}

func _stats_from_player(player: PlayerData) -> Dictionary:
	var result := {}
	for stat in STAT_NAMES:
		result[stat] = clampi(int(player.get(stat)), 0, STAT_CAP)
	return result

func _apply_instance_to_player(player: PlayerData, record: Dictionary) -> void:
	player.level = clampi(int(record.get("level", player.level)), LEVEL_MIN, LEVEL_MAX)
	player.potential = maxi(0, int(record.get("potential", player.potential)))
	var stats: Dictionary = record.get("stats", {})
	for stat in STAT_NAMES:
		if stats.has(stat):
			player.set(stat, clampi(int(stats[stat]), 0, STAT_CAP))
	player.charm = clampi(int(record.get("charm", 0)), 0, CharmSystem.MAX_CHARM)
	player.mood = clampi(int(record.get("mood", MOOD_MAX)), MOOD_MIN, MOOD_MAX)
	player.equipment_ids = record.get("equipment", {}).duplicate(true)
	CharmSystem.configure_player(player)

func _ensure_loaded() -> void:
	if state.is_empty():
		load_state()

func _defaults() -> Dictionary:
	return {"version": SAVE_VERSION, "characters": {}}

func _sanitize(raw: Dictionary) -> Dictionary:
	var clean := _defaults()
	var characters: Dictionary = raw.get("characters", {})
	if typeof(characters) != TYPE_DICTIONARY:
		return clean
	for key in characters.keys():
		var character_id := str(key)
		var record = characters[key]
		if character_id.is_empty() or typeof(record) != TYPE_DICTIONARY:
			continue
		if CharacterArchetypeCatalog.find(character_id).is_empty():
			continue
		var source := CharacterArchetypeCatalog.create_player(character_id)
		if source == null:
			continue
		var stats: Dictionary = record.get("stats", {})
		var clean_stats := _stats_from_player(source)
		for stat in STAT_NAMES:
			if stats.has(stat):
				clean_stats[stat] = clampi(int(stats[stat]), 0, STAT_CAP)
		var equipment: Dictionary = record.get("equipment", {})
		if typeof(equipment) != TYPE_DICTIONARY:
			equipment = {}
		clean["characters"][character_id] = {
			"character_id": character_id,
			"level": clampi(int(record.get("level", 1)), LEVEL_MIN, LEVEL_MAX),
			"potential": maxi(0, int(record.get("potential", source.potential))),
			"stats": clean_stats,
			"charm": clampi(int(record.get("charm", 0)), 0, CharmSystem.MAX_CHARM),
			"mood": clampi(int(record.get("mood", MOOD_MAX)), MOOD_MIN, MOOD_MAX),
			"energy": clampi(int(record.get("energy", ENERGY_MAX)), 0, ENERGY_MAX),
			"energy_last_regen_unix": maxi(0, int(record.get("energy_last_regen_unix", Time.get_unix_time_from_system()))),
			"equipment": equipment.duplicate(true)
		}
	return clean

func _sanitize_record(record: Dictionary) -> Dictionary:
	return record.duplicate(true)


func _regenerate_character(character_id: String, now_unix: int) -> Dictionary:
	var record := snapshot_character(character_id)
	if record.is_empty():
		return {"ok": false, "reason": "character_not_owned"}
	var energy := clampi(int(record.get("energy", ENERGY_MAX)), 0, ENERGY_MAX)
	var last := int(record.get("energy_last_regen_unix", now_unix))
	if now_unix < last:
		return {"ok": false, "reason": "clock_rollback", "current": energy}
	if energy >= ENERGY_MAX:
		if last != now_unix:
			record["energy_last_regen_unix"] = now_unix
			return _replace_character(character_id, record)
		return {"ok": true, "energy": energy, "ticks": 0}
	var ticks := int((now_unix - last) / ENERGY_REGEN_SECONDS)
	if ticks <= 0:
		return {"ok": true, "energy": energy, "ticks": 0}
	var after := mini(ENERGY_MAX, energy + ticks)
	record["energy"] = after
	record["energy_last_regen_unix"] = last + ticks * ENERGY_REGEN_SECONDS
	var result := _replace_character(character_id, record)
	if result.get("ok", false):
		result["energy"] = after
		result["ticks"] = ticks
	return result
