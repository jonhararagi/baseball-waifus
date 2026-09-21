extends Node

const StoreClass = preload("res://game/monetization/rewarded_ad_usage_store.gd")

func _ready() -> void:
	var store = StoreClass.new()
	var state: Dictionary = store.load_state("2099-01-01")
	assert(str(state.get("date_utc", "")) == "2099-01-01")

	var accepted_count := 0
	for i in range(10):
		var result: Dictionary = store.record_completed_reward(state, "materials")
		if bool(result.get("accepted", false)):
			accepted_count += 1
	assert(accepted_count == 10)

	var denied: Dictionary = store.record_completed_reward(state, "materials")
	assert(not bool(denied.get("accepted", false)))

	var next_day: Dictionary = store.load_state("2099-01-02")
	assert(int(next_day.get("uses", {}).get("materials", -1)) == 0)
