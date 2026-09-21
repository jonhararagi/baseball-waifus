class_name CampaignAttemptStore
extends RefCounted

## Persistent attempt ledger. The cycle identifier is supplied by content data.
## It is intentionally independent from reward tables and energy.

const SAVE_PATH := "user://baseball_waifus/campaign_attempts.json"
const SAVE_VERSION := 1

func load_state() -> Dictionary:
	var defaults := {"version": SAVE_VERSION, "cycle_id": "season_1", "attempts": {}}
	if not FileAccess.file_exists(SAVE_PATH):
		return defaults
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return defaults
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or int(parsed.get("version", -1)) != SAVE_VERSION:
		return defaults
	var state := defaults.duplicate(true)
	state["cycle_id"] = str(parsed.get("cycle_id", "season_1"))
	var attempts: Dictionary = parsed.get("attempts", {})
	if typeof(attempts) == TYPE_DICTIONARY:
		for key in attempts.keys():
			state["attempts"][str(key)] = maxi(0, int(attempts[key]))
	return state

func save_state(state: Dictionary) -> bool:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify({
		"version": SAVE_VERSION,
		"cycle_id": str(state.get("cycle_id", "season_1")),
		"attempts": state.get("attempts", {})
	}, "\t"))
	return true

func can_attempt(activity_id: String, activity_type: String, state: Dictionary) -> bool:
	var limit := EconomyRules.max_attempts(activity_type)
	if activity_id.is_empty() or limit < 0:
		return false
	return int(state.get("attempts", {}).get(activity_id, 0)) < limit

func consume_attempt(activity_id: String, activity_type: String, state: Dictionary) -> Dictionary:
	if not can_attempt(activity_id, activity_type, state):
		return {"ok": false, "reason": "attempt_limit"}
	var candidate := state.duplicate(true)
	var attempts: Dictionary = candidate.get("attempts", {})
	var next := int(attempts.get(activity_id, 0)) + 1
	attempts[activity_id] = next
	candidate["attempts"] = attempts
	if not save_state(candidate):
		return {"ok": false, "reason": "save_failed"}
	state["attempts"] = candidate.get("attempts", {})
	return {
		"ok": true,
		"activity_id": activity_id,
		"activity_type": activity_type,
		"attempts_used": next,
		"remaining": EconomyRules.max_attempts(activity_type) - next
	}

func reset_cycle(new_cycle_id: String) -> Dictionary:
	if new_cycle_id.is_empty():
		return {"ok": false, "reason": "invalid_cycle"}
	var state := {"version": SAVE_VERSION, "cycle_id": new_cycle_id, "attempts": {}}
	if not save_state(state):
		return {"ok": false, "reason": "save_failed"}
	return {"ok": true, "cycle_id": new_cycle_id}
