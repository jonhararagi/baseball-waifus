class_name PlayerProgressStore
extends RefCounted

## Local authoritative progression/inventory state.
## Offline-first: no network, SDK, API or remote authority.
## Owns player energy, materials and per-character energy.

const SAVE_PATH := "user://baseball_waifus/player_progress.json"
const SAVE_VERSION := 2
const ENERGY_REGEN_SECONDS := 360
const MAX_PLAYER_ENERGY := 100
const MAX_CHARACTER_ENERGY := 100
const DEFAULT_PLAYER_ENERGY := 100
const DEFAULT_CHARACTER_ENERGY := 100

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

func get_material_count(item_id: String) -> int:
	_ensure_loaded()
	return maxi(0, int(state.get("materials", {}).get(item_id, 0)))

func get_character_energy(character_id: String) -> int:
	_ensure_loaded()
	if character_id.is_empty():
		return 0
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	return int(state.get("character_energy", {}).get(character_id, DEFAULT_CHARACTER_ENERGY))

func add_player_energy(amount: int) -> Dictionary:
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	if amount <= 0:
		return {"ok": false, "reason": "invalid_amount"}
	var before := get_player_energy()
	var after := clampi(before + amount, 0, MAX_PLAYER_ENERGY)
	state["player_energy"] = after
	state["player_energy_last_regen_unix"] = int(Time.get_unix_time_from_system())
	return _commit_change("player_energy", before, after)

func add_material(item_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	if item_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_material"}
	var materials: Dictionary = state.get("materials", {})
	var before := maxi(0, int(materials.get(item_id, 0)))
	var after := before + amount
	materials[item_id] = after
	state["materials"] = materials
	return _commit_change("material:" + item_id, before, after)

func add_character_energy(character_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	if character_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_character"}
	var energies: Dictionary = state.get("character_energy", {})
	var before := clampi(int(energies.get(character_id, DEFAULT_CHARACTER_ENERGY)), 0, MAX_CHARACTER_ENERGY)
	var after := clampi(before + amount, 0, MAX_CHARACTER_ENERGY)
	energies[character_id] = after
	state["character_energy"] = energies
	var regen_times: Dictionary = state.get("character_energy_last_regen_unix", {})
	regen_times[character_id] = int(Time.get_unix_time_from_system())
	state["character_energy_last_regen_unix"] = regen_times
	return _commit_change("character_energy:" + character_id, before, after)

func consume_player_energy(amount: int) -> Dictionary:
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	if amount <= 0:
		return {"ok": false, "reason": "invalid_amount"}
	var before := get_player_energy()
	if before < amount:
		return {"ok": false, "reason": "insufficient_energy", "current": before}
	var after := before - amount
	state["player_energy"] = after
	state["player_energy_last_regen_unix"] = int(Time.get_unix_time_from_system())
	return _commit_change("player_energy", before, after)

func consume_character_energy(character_id: String, amount: int) -> Dictionary:
	_ensure_loaded()
	_apply_passive_regeneration(int(Time.get_unix_time_from_system()))
	if character_id.is_empty() or amount <= 0:
		return {"ok": false, "reason": "invalid_request"}
	var before := get_character_energy(character_id)
	if before < amount:
		return {"ok": false, "reason": "insufficient_energy", "current": before}
	var energies: Dictionary = state.get("character_energy", {})
	var after := before - amount
	energies[character_id] = after
	state["character_energy"] = energies
	var regen_times: Dictionary = state.get("character_energy_last_regen_unix", {})
	regen_times[character_id] = int(Time.get_unix_time_from_system())
	state["character_energy_last_regen_unix"] = regen_times
	return _commit_change("character_energy:" + character_id, before, after)

func snapshot() -> Dictionary:
	_ensure_loaded()
	return state.duplicate(true)

func restore_snapshot(snapshot_state: Dictionary) -> bool:
	if typeof(snapshot_state) != TYPE_DICTIONARY or int(snapshot_state.get("version", -1)) < 1:
		return false
	state = _sanitize(snapshot_state)
	return save_state()

func _ensure_loaded() -> void:
	if state.is_empty():
		load_state()

func _commit_change(resource_key: String, before: int, after: int) -> Dictionary:
	var saved := save_state()
	return {"ok": saved, "resource": resource_key, "before": before, "after": after, "delta": after - before, "reason": "" if saved else "save_failed"}

func _defaults() -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"player_energy": DEFAULT_PLAYER_ENERGY,
		"materials": {},
		"character_energy": {},
		"player_energy_last_regen_unix": int(Time.get_unix_time_from_system()),
		"character_energy_last_regen_unix": {}
	}

func _sanitize(raw: Dictionary) -> Dictionary:
	var clean := _defaults()
	clean["player_energy"] = clampi(int(raw.get("player_energy", DEFAULT_PLAYER_ENERGY)), 0, MAX_PLAYER_ENERGY)
	var materials: Dictionary = raw.get("materials", {})
	if typeof(materials) == TYPE_DICTIONARY:
		for key in materials.keys():
			var item_id := str(key)
			if not item_id.is_empty():
				clean["materials"][item_id] = maxi(0, int(materials[key]))
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
	var energies: Dictionary = state.get("character_energy", {})
	var regen_times: Dictionary = state.get("character_energy_last_regen_unix", {})
	for key in energies.keys():
		var character_id := str(key)
		var energy := clampi(int(energies[key]), 0, MAX_CHARACTER_ENERGY)
		var last := int(regen_times.get(character_id, now_unix))
		if energy < MAX_CHARACTER_ENERGY and now_unix > last:
			var char_ticks := int((now_unix - last) / ENERGY_REGEN_SECONDS)
			if char_ticks > 0:
				var char_after := mini(MAX_CHARACTER_ENERGY, energy + char_ticks)
				if char_after != energy:
					energies[character_id] = char_after
					changed = true
				regen_times[character_id] = last + char_ticks * ENERGY_REGEN_SECONDS
		elif energy >= MAX_CHARACTER_ENERGY:
			regen_times[character_id] = now_unix
	state["character_energy"] = energies
	state["character_energy_last_regen_unix"] = regen_times
	if changed:
		save_state()