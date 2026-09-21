class_name PlayerProgressStore
extends RefCounted

const RosterClass = preload("res://game/characters/character_roster_store.gd")

## Single local authority for account-level progression/inventory.
## Character instance progression is owned by CharacterRosterStore.
## This store owns player energy, coins, materials and owned equipment quantities.
## Offline-first: no network, SDK, API or remote authority.

const SAVE_PATH := "user://baseball_waifus/player_progress.json"
const SAVE_VERSION := 3
const ENERGY_REGEN_SECONDS := 360
const MAX_PLAYER_ENERGY := 100
const MAX_CHARACTER_ENERGY := 100
const DEFAULT_PLAYER_ENERGY := 100
const DEFAULT_CHARACTER_ENERGY := 100
const MAX_COINS := 2147483647

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
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	return state.duplicate(true)

func save_state() -> bool:
	if state.is_empty():
		state = _defaults()
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(_sanitize(state), "\t"))
	return true

func get_player_energy() -> int:
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	return int(state.get("player_energy", DEFAULT_PLAYER_ENERGY))

func add_player_energy(amount: int) -> Dictionary:
	return _change_account_int("player_energy", amount, 0, MAX_PLAYER_ENERGY)

func consume_player_energy(amount: int) -> Dictionary:
	if amount <= 0:
		return {"ok": false, "reason": "invalid_amount"}
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	var current := int(state.get("player_energy", DEFAULT_PLAYER_ENERGY))
	if current < amount:
		return {"ok": false, "reason": "insufficient_energy", "current": current}
	return _change_account_int("player_energy", -amount, 0, MAX_PLAYER_ENERGY, current)

func get_coins() -> int:
	_ensure_loaded()
	return clampi(int(state.get("coins", 0)), 0, MAX_COINS)

func add_coins(amount: int) -> Dictionary:
	return _change_account_int("coins", amount, 0, MAX_COINS)

func consume_coins(amount: int) -> Dictionary:
	if amount <= 0:
		return {"ok": false, "reason": "invalid_amount"}
	_ensure_loaded()
	var current := get_coins()
	if current < amount:
		return {"ok": false, "reason": "insufficient_coins", "current": current}
	return _change_account_int("coins", -amount, 0, MAX_COINS, current)

func get_material_count(item_id: String) -> int:
	_ensure_loaded()
	if item_id.is_empty():
		return 0
	return maxi(0, int(state.get("materials", {}).get(item_id, 0)))

func add_material(item_id: String, amount: int) -> Dictionary:
	if item_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_material"}
	_ensure_loaded()
	var current := get_material_count(item_id)
	var candidate := state.duplicate(true)
	var materials: Dictionary = candidate.get("materials", {})
	materials[item_id] = current + amount
	candidate["materials"] = materials
	return _commit_candidate(candidate, "material:" + item_id, current, current + amount)

func consume_material(item_id: String, amount: int) -> Dictionary:
	if item_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_material"}
	_ensure_loaded()
	var current := get_material_count(item_id)
	if current < amount:
		return {"ok": false, "reason": "insufficient_material", "item_id": item_id, "current": current}
	var candidate := state.duplicate(true)
	var materials: Dictionary = candidate.get("materials", {})
	materials[item_id] = current - amount
	candidate["materials"] = materials
	return _commit_candidate(candidate, "material:" + item_id, current, current - amount)

func get_equipment_count(item_id: String) -> int:
	_ensure_loaded()
	if item_id.is_empty():
		return 0
	return maxi(0, int(state.get("equipment_inventory", {}).get(item_id, 0)))

func add_equipment(item_id: String, amount: int = 1) -> Dictionary:
	if item_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_equipment"}
	_ensure_loaded()
	var current := get_equipment_count(item_id)
	var candidate := state.duplicate(true)
	var inventory: Dictionary = candidate.get("equipment_inventory", {})
	inventory[item_id] = current + amount
	candidate["equipment_inventory"] = inventory
	return _commit_candidate(candidate, "equipment:" + item_id, current, current + amount)

func consume_equipment(item_id: String, amount: int = 1) -> Dictionary:
	if item_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_equipment"}
	_ensure_loaded()
	var current := get_equipment_count(item_id)
	if current < amount:
		return {"ok": false, "reason": "insufficient_equipment", "item_id": item_id, "current": current}
	var candidate := state.duplicate(true)
	var inventory: Dictionary = candidate.get("equipment_inventory", {})
	inventory[item_id] = current - amount
	candidate["equipment_inventory"] = inventory
	return _commit_candidate(candidate, "equipment:" + item_id, current, current - amount)

func get_equipment_inventory() -> Dictionary:
	_ensure_loaded()
	return state.get("equipment_inventory", {}).duplicate(true)

func get_material_inventory() -> Dictionary:
	_ensure_loaded()
	return state.get("materials", {}).duplicate(true)

func get_account_inventory_snapshot() -> Dictionary:
	_ensure_loaded()
	return {
		"coins": get_coins(),
		"materials": get_material_inventory(),
		"equipment_inventory": get_equipment_inventory()
	}

func get_character_energy(character_id: String) -> int:
	var roster := RosterClass.new()
	return roster.get_character_energy(character_id)

func add_character_energy(character_id: String, amount: int) -> Dictionary:
	var roster := RosterClass.new()
	return roster.add_character_energy(character_id, amount)

func consume_character_energy(character_id: String, amount: int) -> Dictionary:
	var roster := RosterClass.new()
	return roster.consume_character_energy(character_id, amount)

func snapshot() -> Dictionary:
	_ensure_loaded()
	return state.duplicate(true)

func restore_snapshot(snapshot_state: Dictionary) -> bool:
	if typeof(snapshot_state) != TYPE_DICTIONARY or int(snapshot_state.get("version", -1)) < 1:
		return false
	var clean := _sanitize(snapshot_state)
	if not save_state(clean):
		return false
	state = clean
	return true

func _ensure_loaded() -> void:
	if state.is_empty():
		load_state()

func _change_account_int(key: String, delta: int, minimum: int, maximum: int, before_override: int = -1) -> Dictionary:
	if delta == 0:
		return {"ok": true, "resource": key, "before": int(state.get(key, 0)), "after": int(state.get(key, 0)), "delta": 0}
	_ensure_loaded()
	var before := int(state.get(key, 0)) if before_override < 0 else before_override
	var after := clampi(before + delta, minimum, maximum)
	if after == before:
		return {"ok": true, "resource": key, "before": before, "after": after, "delta": 0}
	var candidate := state.duplicate(true)
	candidate[key] = after
	return _commit_candidate(candidate, key, before, after)

func _commit_candidate(candidate: Dictionary, resource_key: String, before: int, after: int) -> Dictionary:
	var previous := state.duplicate(true)
	var clean := _sanitize(candidate)
	if not _write_state(clean):
		state = previous
		return {
			"ok": false,
			"resource": resource_key,
			"before": before,
			"after": before,
			"delta": 0,
			"reason": "save_failed"
		}
	state = clean
	return {
		"ok": true,
		"resource": resource_key,
		"before": before,
		"after": after,
		"delta": after - before
	}

func _write_state(clean: Dictionary) -> bool:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(clean, "\t"))
	return true

func _defaults() -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"player_energy": DEFAULT_PLAYER_ENERGY,
		"coins": 0,
		"materials": {},
		"equipment_inventory": {},
		"character_energy": {},
		"player_energy_last_regen_unix": int(Time.get_unix_time_from_system()),
		"character_energy_last_regen_unix": {}
	}

func _sanitize(raw: Dictionary) -> Dictionary:
	var clean := _defaults()
	clean["player_energy"] = clampi(int(raw.get("player_energy", DEFAULT_PLAYER_ENERGY)), 0, MAX_PLAYER_ENERGY)
	clean["coins"] = clampi(int(raw.get("coins", 0)), 0, MAX_COINS)
	var materials: Dictionary = raw.get("materials", {})
	if typeof(materials) == TYPE_DICTIONARY:
		for key in materials.keys():
			var item_id := str(key)
			if not item_id.is_empty():
				clean["materials"][item_id] = maxi(0, int(materials[key]))
	var equipment_inventory: Dictionary = raw.get("equipment_inventory", {})
	if typeof(equipment_inventory) == TYPE_DICTIONARY:
		for key in equipment_inventory.keys():
			var item_id := str(key)
			if not item_id.is_empty():
				clean["equipment_inventory"][item_id] = maxi(0, int(equipment_inventory[key]))
	# Legacy character-energy fields are retained for migration compatibility.
	var energies: Dictionary = raw.get("character_energy", {})
	if typeof(energies) == TYPE_DICTIONARY:
		for key in energies.keys():
			var character_id := str(key)
			if not character_id.is_empty():
				clean["character_energy"][character_id] = clampi(int(energies[key]), 0, MAX_CHARACTER_ENERGY)
	clean["player_energy_last_regen_unix"] = maxi(0, int(raw.get("player_energy_last_regen_unix", Time.get_unix_time_from_system())))
	var regen_times: Dictionary = raw.get("character_energy_last_regen_unix", {})
	if typeof(regen_times) == TYPE_DICTIONARY:
		for key in regen_times.keys():
			var character_id := str(key)
			if not character_id.is_empty():
				clean["character_energy_last_regen_unix"][character_id] = maxi(0, int(regen_times[key]))
	return clean

func _apply_passive_regeneration(now_unix: int) -> void:
	if state.is_empty():
		return
	var changed := false
	var player_energy := int(state.get("player_energy", DEFAULT_PLAYER_ENERGY))
	var player_last := int(state.get("player_energy_last_regen_unix", now_unix))
	if player_energy < MAX_PLAYER_ENERGY and now_unix > player_last:
		var ticks := int((now_unix - player_last) / ENERGY_REGEN_SECONDS)
		if ticks > 0:
			var after := mini(MAX_PLAYER_ENERGY, player_energy + ticks)
			if after != player_energy:
				state["player_energy"] = after
				changed = true
			state["player_energy_last_regen_unix"] = player_last + ticks * ENERGY_REGEN_SECONDS
	elif player_energy >= MAX_PLAYER_ENERGY:
		state["player_energy_last_regen_unix"] = now_unix
	# Legacy character-energy data is intentionally not regenerated here.
	# CharacterRosterStore is the current authority for character energy.
	state["character_energy"] = state.get("character_energy", {})
	state["character_energy_last_regen_unix"] = state.get("character_energy_last_regen_unix", {})
	if changed:
		save_state()
