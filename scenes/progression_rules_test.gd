extends Node

const StoreClass = preload("res://game/progression/player_progress_store.gd")
const AttemptStoreClass = preload("res://game/progression/campaign_attempt_store.gd")
const EntryClass = preload("res://game/progression/campaign_entry_service.gd")
const RulesClass = preload("res://game/progression/economy_rules.gd")

func _ready() -> void:
	assert(RulesClass.match_energy_cost("normal") == 10)
	assert(RulesClass.match_energy_cost("hard") == 15)
	assert(RulesClass.match_energy_cost("demon_king") == 25)
	assert(RulesClass.max_attempts("normal") == 10)
	assert(RulesClass.max_attempts("demon_king") == 3)
	assert(RulesClass.training_duration_seconds("24h") == 86400)

	var store = StoreClass.new()
	store.state = {
		"version": StoreClass.SAVE_VERSION,
		"player_energy": 100,
		"materials": {},
		"character_energy": {},
		"player_energy_last_regen_unix": int(Time.get_unix_time_from_system()),
		"character_energy_last_regen_unix": {}
	}
	var attempts = AttemptStoreClass.new()
	var state := {"version": AttemptStoreClass.SAVE_VERSION, "cycle_id": "test", "attempts": {}}

	var entry = EntryClass.new()

	var result: Dictionary = entry.begin("zone1_normal_1", "normal", state, store, attempts)
	assert(bool(result.get("ok", false)))
	assert(store.get_player_energy() == 90)
	assert(int(state.attempts["zone1_normal_1"]) == 1)

	for i in range(9):
		var accepted: Dictionary = entry.begin("zone1_normal_1", "normal", state, store, attempts)
		assert(bool(accepted.get("ok", false)))

	assert(store.get_player_energy() == 0)
	var denied: Dictionary = entry.begin("zone1_normal_1", "normal", state, store, attempts)
	assert(not bool(denied.get("ok", false)))
	assert(str(denied.get("reason", "")) == "attempt_limit")

	var demon_state := {"version": AttemptStoreClass.SAVE_VERSION, "cycle_id": "test", "attempts": {}}
	store.state["player_energy"] = 100
	for i in range(3):
		var boss_entry: Dictionary = entry.begin("zone1_boss", "demon_king", demon_state, store, attempts)
		assert(bool(boss_entry.get("ok", false)))
	var boss_denied: Dictionary = entry.begin("zone1_boss", "demon_king", demon_state, store, attempts)
	assert(not bool(boss_denied.get("ok", false)))
	assert(str(boss_denied.get("reason", "")) == "attempt_limit")

	print("PROGRESSION RULES TEST OK")
	get_tree().quit()
