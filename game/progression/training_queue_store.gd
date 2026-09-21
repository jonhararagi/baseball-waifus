class_name TrainingQueueStore
extends RefCounted

## Offline persistent training queue.
## One active training per character prevents duplicate completion claims.
## The queue stores only intent/timestamps; stat mutation belongs to the progression authority.

const SAVE_PATH := "user://baseball_waifus/training_queue.json"
const SAVE_VERSION := 1

func load_state() -> Dictionary:
	var defaults := {"version": SAVE_VERSION, "trainings": {}}
	if not FileAccess.file_exists(SAVE_PATH):
		return defaults
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return defaults
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or int(parsed.get("version", -1)) != SAVE_VERSION:
		return defaults
	var clean := defaults.duplicate(true)
	var trainings: Dictionary = parsed.get("trainings", {})
	if typeof(trainings) == TYPE_DICTIONARY:
		for key in trainings.keys():
			var character_id := str(key)
			var record = trainings[key]
			if character_id.is_empty() or typeof(record) != TYPE_DICTIONARY:
				continue
			var started := int(record.get("started_unix", 0))
			var complete := int(record.get("complete_unix", 0))
			var training_type := str(record.get("training_type", ""))
			var duration_key := str(record.get("duration_key", ""))
			var duration := EconomyRules.training_duration_seconds(duration_key)
			if started <= 0 or complete < started or duration <= 0 or complete != started + duration or not EconomyRules.is_valid_training_type(training_type):
				continue
			clean["trainings"][character_id] = {
				"character_id": character_id,
				"training_type": training_type,
				"duration_key": duration_key,
				"started_unix": started,
				"complete_unix": complete
			}
	return clean

func save_state(state: Dictionary) -> bool:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify({
		"version": SAVE_VERSION,
		"trainings": state.get("trainings", {})
	}, "\t"))
	return true

func start(character_id: String, training_type: String, duration_key: String, now_unix: int = -1) -> Dictionary:
	var now := int(Time.get_unix_time_from_system()) if now_unix < 0 else now_unix
	if character_id.is_empty():
		return {"ok": false, "reason": "invalid_character"}
	if not EconomyRules.is_valid_training_type(training_type):
		return {"ok": false, "reason": "invalid_training_type"}
	var duration := EconomyRules.training_duration_seconds(duration_key)
	if duration <= 0:
		return {"ok": false, "reason": "invalid_duration"}
	var state := load_state()
	var trainings: Dictionary = state.get("trainings", {})
	if trainings.has(character_id):
		return {"ok": false, "reason": "already_training"}
	var candidate := state.duplicate(true)
	candidate["trainings"][character_id] = {
		"character_id": character_id,
		"training_type": training_type,
		"duration_key": duration_key,
		"started_unix": now,
		"complete_unix": now + duration
	}
	if not save_state(candidate):
		return {"ok": false, "reason": "save_failed"}
	return {
		"ok": true,
		"character_id": character_id,
		"training_type": training_type,
		"duration_key": duration_key,
		"started_unix": now,
		"complete_unix": now + duration
	}

func status(character_id: String, now_unix: int = -1) -> Dictionary:
	var now := int(Time.get_unix_time_from_system()) if now_unix < 0 else now_unix
	var state := load_state()
	var record = state.get("trainings", {}).get(character_id, null)
	if record == null:
		return {"ok": false, "reason": "not_training"}
	if now < int(record["started_unix"]):
		return {"ok": false, "reason": "clock_rollback"}
	var remaining := maxi(0, int(record["complete_unix"]) - now)
	return {
		"ok": true,
		"character_id": character_id,
		"training_type": str(record["training_type"]),
		"duration_key": str(record["duration_key"]),
		"started_unix": int(record["started_unix"]),
		"complete_unix": int(record["complete_unix"]),
		"remaining_seconds": remaining,
		"ready": remaining == 0
	}

func claim(character_id: String, now_unix: int = -1) -> Dictionary:
	var now := int(Time.get_unix_time_from_system()) if now_unix < 0 else now_unix
	var state := load_state()
	var trainings: Dictionary = state.get("trainings", {})
	var record = trainings.get(character_id, null)
	if record == null:
		return {"ok": false, "reason": "not_training"}
	if now < int(record["started_unix"]):
		return {"ok": false, "reason": "clock_rollback"}
	if now < int(record["complete_unix"]):
		return {"ok": false, "reason": "not_ready", "remaining_seconds": int(record["complete_unix"]) - now}
	var gains := EconomyRules.training_gains(str(record["duration_key"]), str(record["training_type"]))
	if gains.is_empty():
		return {"ok": false, "reason": "invalid_training_payload"}
	var candidate := state.duplicate(true)
	candidate["trainings"].erase(character_id)
	if not save_state(candidate):
		return {"ok": false, "reason": "save_failed"}
	return {
		"ok": true,
		"character_id": character_id,
		"training_type": str(record["training_type"]),
		"duration_key": str(record["duration_key"]),
		"completed_unix": int(record["complete_unix"])
	}

func restore_claim(record: Dictionary) -> bool:
	if typeof(record) != TYPE_DICTIONARY:
		return false
	var character_id := str(record.get("character_id", ""))
	var started := int(record.get("started_unix", 0))
	var complete := int(record.get("complete_unix", 0))
	var training_type := str(record.get("training_type", ""))
	var duration_key := str(record.get("duration_key", ""))
	var duration := EconomyRules.training_duration_seconds(duration_key)
	if character_id.is_empty() or started <= 0 or complete != started + duration or not EconomyRules.is_valid_training_type(training_type):
		return false
	var state := load_state()
	var trainings: Dictionary = state.get("trainings", {})
	if trainings.has(character_id):
		return false
	var candidate := state.duplicate(true)
	candidate["trainings"][character_id] = {
		"character_id": character_id,
		"training_type": training_type,
		"duration_key": duration_key,
		"started_unix": started,
		"complete_unix": complete
	}
	return save_state(candidate)
