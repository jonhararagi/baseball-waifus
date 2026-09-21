class_name RewardedAdTransaction
extends RefCounted

## Single authority that converts an accepted rewarded-ad completion into
## a local progression mutation. RewardedAdPolicy defines the reward amount.

const RewardedAdPolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")
const PlayerProgressStoreClass = preload("res://game/progression/player_progress_store.gd")

func grant(policy_category: int, character_id: String = "", usage_state: Dictionary = {}, progress_store: RefCounted = null) -> Dictionary:
	var policy = RewardedAdPolicyClass.new()
	if not policy.can_claim(policy_category, usage_state):
		return {"ok": false, "reason": "daily_limit"}

	var reward: Dictionary = policy.build_reward(policy_category)
	var category := str(reward.get("category", ""))
	if category.is_empty():
		return {"ok": false, "reason": "invalid_reward"}

	if progress_store == null:
		progress_store = PlayerProgressStoreClass.new()
		progress_store.load_state()

	var mutation := _apply_reward(progress_store, category, reward, character_id)
	if not bool(mutation.get("ok", false)):
		return mutation

	var usage := policy.register_completed_reward(policy_category, usage_state)
	if not bool(usage.get("accepted", false)):
		return {"ok": false, "reason": "daily_limit", "rollback_required": true}

	return {"ok": true, "category": category, "reward": reward, "usage": usage, "mutation": mutation}

func _apply_reward(store: RefCounted, category: String, reward: Dictionary, character_id: String) -> Dictionary:
	var amount := int(reward.get("amount", 0))
	match category:
		"player_energy":
			return store.add_player_energy(amount)
		"materials":
			return store.add_material("material_bundle", amount)
		"character_energy":
			if character_id.is_empty():
				return {"ok": false, "reason": "character_required"}
			return store.add_character_energy(character_id, amount)
		_:
			return {"ok": false, "reason": "unknown_category"}
