extends Node

const QueueClass = preload("res://game/progression/training_queue_store.gd")
const ServiceClass = preload("res://game/progression/training_service.gd")
const RulesClass = preload("res://game/progression/economy_rules.gd")

func _ready() -> void:
	assert(RulesClass.training_duration_seconds("30m") == 1800)
	assert(RulesClass.training_duration_seconds("24h") == 86400)
	assert(RulesClass.training_gains("30m", "batting").get("power", -1) == 1)
	assert(RulesClass.training_gains("2h", "batting").get("contact", -1) == 1)
	assert(RulesClass.training_gains("24h", "defense").get("defense", -1) == 12)

	var queue := QueueClass.new()
	var service := ServiceClass.new()
	var start := queue.start("bw001", "batting", "2h", 1000)
	assert(bool(start.get("ok", false)))
	assert(int(start.get("complete_unix", 0)) == 8200)

	var duplicate := queue.start("bw001", "defense", "30m", 1000)
	assert(not bool(duplicate.get("ok", false)))
	assert(str(duplicate.get("reason", "")) == "already_training")

	var early := queue.claim("bw001", 8199)
	assert(not bool(early.get("ok", false)))
	assert(str(early.get("reason", "")) == "not_ready")

	var rollback := queue.status("bw001", 999)
	assert(not bool(rollback.get("ok", false)))
	assert(str(rollback.get("reason", "")) == "clock_rollback")

	var ready := service.claim("bw001", 8200)
	assert(bool(ready.get("ok", false)))
	assert(int(ready.get("stat_gains", {}).get("power", -1)) == 2)
	assert(int(ready.get("stat_gains", {}).get("contact", -1)) == 1)

	var claimed_again := queue.claim("bw001", 8200)
	assert(not bool(claimed_again.get("ok", false)))
	assert(str(claimed_again.get("reason", "")) == "not_training")

	print("TRAINING QUEUE TEST OK")
	get_tree().quit()
