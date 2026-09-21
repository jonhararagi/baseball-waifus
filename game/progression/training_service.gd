class_name TrainingService
extends RefCounted

## Coordinates the persistent training queue with deterministic economy rules.
## CharacterRosterStore is the single authority for persistent character progression.

const QueueClass = preload("res://game/progression/training_queue_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")

func start(character_id: String, training_type: String, duration_key: String, now_unix: int = -1) -> Dictionary:
	var queue := QueueClass.new()
	return queue.start(character_id, training_type, duration_key, now_unix)

func status(character_id: String, now_unix: int = -1) -> Dictionary:
	var queue := QueueClass.new()
	return queue.status(character_id, now_unix)

func claim(character_id: String, now_unix: int = -1) -> Dictionary:
	var queue := QueueClass.new()
	var result: Dictionary = queue.claim(character_id, now_unix)
	if not bool(result.get("ok", false)):
		return result
	var gains := EconomyRules.training_gains(
		str(result.get("duration_key", "")),
		str(result.get("training_type", ""))
	)
	if gains.is_empty():
		queue.restore_claim(result)
		return {"ok": false, "reason": "invalid_training_payload"}
	var roster := RosterClass.new()
	var apply_result := roster.apply_training(str(result.get("character_id", "")), gains)
	if not bool(apply_result.get("ok", false)):
		var restored := queue.restore_claim(result)
		return {
			"ok": false,
			"reason": str(apply_result.get("reason", "roster_update_failed")),
			"queue_restored": restored
		}
	result["stat_gains"] = apply_result.get("stat_gains", gains)
	result["roster_updated"] = true
	return result
