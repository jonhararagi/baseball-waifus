extends Node

const PolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")
const StoreClass = preload("res://game/progression/player_progress_store.gd")
const TransactionClass = preload("res://game/monetization/rewarded_ad_transaction.gd")

func _ready() -> void:
	var policy = PolicyClass.new()
	var store = StoreClass.new()
	store.state = {"version": StoreClass.SAVE_VERSION, "player_energy": 50, "materials": {}, "character_energy": {"bw001": 40}}
	var tx = TransactionClass.new()
	var usage := {"player_energy": 0, "materials": 0, "character_energy": 0}

	var energy_result: Dictionary = tx.grant(policy.RewardCategory.PLAYER_ENERGY, "", usage, store)
	assert(bool(energy_result.get("ok", false)))
	assert(store.get_player_energy() == 70)
	assert(int(usage.player_energy) == 1)

	var material_result: Dictionary = tx.grant(policy.RewardCategory.MATERIALS, "", usage, store)
	assert(bool(material_result.get("ok", false)))
	assert(store.get_material_count("material_bundle") == 1)
	assert(int(usage.materials) == 1)

	var character_result: Dictionary = tx.grant(policy.RewardCategory.CHARACTER_ENERGY, "bw001", usage, store)
	assert(bool(character_result.get("ok", false)))
	assert(store.get_character_energy("bw001") == 60)
	assert(int(usage.character_energy) == 1)

	var missing_character: Dictionary = tx.grant(policy.RewardCategory.CHARACTER_ENERGY, "", usage, store)
	assert(not bool(missing_character.get("ok", false)))
	assert(str(missing_character.get("reason", "")) == "character_required")

	for i in range(9):
		var accepted: Dictionary = tx.grant(policy.RewardCategory.PLAYER_ENERGY, "", usage, store)
		assert(bool(accepted.get("ok", false)))
	assert(int(usage.player_energy) == 10)

	var denied: Dictionary = tx.grant(policy.RewardCategory.PLAYER_ENERGY, "", usage, store)
	assert(not bool(denied.get("ok", false)))
	assert(str(denied.get("reason", "")) == "daily_limit")
