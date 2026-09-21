extends Node

const PolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")
const UsageStoreClass = preload("res://game/monetization/rewarded_ad_usage_store.gd")
const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const ClaimServiceClass = preload("res://game/monetization/rewarded_ad_claim_service.gd")

func _ready() -> void:
	var policy = PolicyClass.new()
	var progress = ProgressStoreClass.new()
	progress.state = {
		"version": ProgressStoreClass.SAVE_VERSION,
		"player_energy": 50,
		"materials": {},
		"character_energy": {"bw001": 40},
		"player_energy_last_regen_unix": int(Time.get_unix_time_from_system()),
		"character_energy_last_regen_unix": {"bw001": int(Time.get_unix_time_from_system())}
	}

	var today := Time.get_date_string_from_system(true)
	var usage_store = UsageStoreClass.new()
	var usage := usage_store.load_state(today)
	usage["uses"] = {"player_energy": 0, "materials": 0, "character_energy": 0}
	assert(usage_store.save_state(usage))

	var claim = ClaimServiceClass.new()
	var result: Dictionary = claim.claim(policy.RewardCategory.PLAYER_ENERGY, "", progress)
	assert(bool(result.get("ok", false)))
	assert(progress.get_player_energy() == 70)

	var persisted := usage_store.load_state(today)
	assert(int(persisted["uses"]["player_energy"]) == 1)

	for i in range(9):
		var accepted: Dictionary = claim.claim(policy.RewardCategory.PLAYER_ENERGY, "", progress)
		assert(bool(accepted.get("ok", false)))
	var denied: Dictionary = claim.claim(policy.RewardCategory.PLAYER_ENERGY, "", progress)
	assert(not bool(denied.get("ok", false)))
	assert(str(denied.get("reason", "")) == "daily_limit")

	print("REWARDED AD CLAIM TEST OK")
	get_tree().quit()
