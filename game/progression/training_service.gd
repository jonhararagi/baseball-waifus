class_name TrainingService
extends RefCounted

## Coordinates the persistent training queue with deterministic economy rules.
## It does not own PlayerData mutation because the roster authority is not yet persistent.

const QueueClass = preload("res://game/progression/training_queue_store.gd")

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
		return {"ok": false, "reason": "invalid_training_payload"}
	result["stat_gains"] = gains
	return result
