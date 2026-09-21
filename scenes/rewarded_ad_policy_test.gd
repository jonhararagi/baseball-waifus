extends Node

const RewardedAdPolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")

func _ready() -> void:
	var policy = RewardedAdPolicyClass.new()
	var uses := {"player_energy": 0, "materials": 0, "character_energy": 0}

	assert(policy.can_claim(policy.RewardCategory.PLAYER_ENERGY, uses))
	for i in range(10):
		var result: Dictionary = policy.register_completed_reward(policy.RewardCategory.PLAYER_ENERGY, uses)
		assert(bool(result.get("accepted", false)))
	assert(not policy.can_claim(policy.RewardCategory.PLAYER_ENERGY, uses))
	assert(policy.remaining_uses(policy.RewardCategory.PLAYER_ENERGY, uses) == 0)

	assert(policy.can_claim(policy.RewardCategory.MATERIALS, uses))
	assert(policy.can_claim(policy.RewardCategory.CHARACTER_ENERGY, uses))

	var reward: Dictionary = policy.build_reward(policy.RewardCategory.CHARACTER_ENERGY)
	assert(int(reward.get("amount", 0)) == 20)
	assert(str(reward.get("unit", "")) == "character_energy")

	var invalid: Dictionary = policy.register_completed_reward(999, uses)
	assert(not bool(invalid.get("accepted", false)))
