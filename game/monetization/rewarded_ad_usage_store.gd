class_name RewardedAdUsageStore
extends RefCounted

const SAVE_PATH := "user://baseball_waifus/rewarded_ad_usage.json"
const SAVE_VERSION := 1

func load_state(today_utc: String) -> Dictionary:
	var defaults := _empty_state(today_utc)
	if not FileAccess.file_exists(SAVE_PATH):
		return defaults
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return defaults
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return defaults
	if int(parsed.get("version", -1)) != SAVE_VERSION:
		return defaults
	if str(parsed.get("date_utc", "")) != today_utc:
		return defaults
	var uses: Dictionary = parsed.get("uses", {})
	for key in ["player_energy", "materials", "character_energy"]:
		defaults["uses"][key] = clampi(int(uses.get(key, 0)), 0, 10)
	return defaults

func save_state(state: Dictionary) -> bool:
	var dir := DirAccess.open("user://")
	if dir == null:
		return false
	if not DirAccess.dir_exists_absolute("user://baseball_waifus"):
		var error := DirAccess.make_dir_recursive_absolute("user://baseball_waifus")
		if error != OK:
			return false
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify({
		"version": SAVE_VERSION,
		"date_utc": str(state.get("date_utc", "")),
		"uses": state.get("uses", {})
	}))
	return true

func record_completed_reward(state: Dictionary, category_key: String) -> Dictionary:
	var uses: Dictionary = state.get("uses", {})
	var current := clampi(int(uses.get(category_key, 0)), 0, 10)
	if current >= 10:
		return {"accepted": false, "reason": "daily_limit", "state": state}
	uses[category_key] = current + 1
	state["uses"] = uses
	return {"accepted": true, "state": state}

func _empty_state(today_utc: String) -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"date_utc": today_utc,
		"uses": {
			"player_energy": 0,
			"materials": 0,
			"character_energy": 0
		}
	}
