class_name RewardedAdTransaction
extends RefCounted

## Compatibility adapter for rewarded ads.
## Actual resource mutation is delegated to RewardTransactionService so ads,
## maps, gacha and future reward sources share the same transaction authority.

const RewardedAdPolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")
const RewardTransactionClass = preload("res://game/progression/reward_transaction_service.gd")
const PlayerProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const CharacterRosterStoreClass = preload("res://game/characters/character_roster_store.gd")

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

	var roster := CharacterRosterStoreClass.new()
	roster.load_state()

	if category == "character_energy" and character_id.is_empty():
		return {"ok": false, "reason": "character_required"}

	var transaction := RewardTransactionClass.new()
	var payload := [{
		"category": category,
		"amount": int(reward.get("amount", 0)),
		"character_id": character_id
	}]
	if category == "materials":
		payload[0]["item_id"] = "material_bundle"

	var mutation: Dictionary = transaction.grant(payload, progress_store, roster)
	if not bool(mutation.get("ok", false)):
		return mutation

	var usage := policy.register_completed_reward(policy_category, usage_state)
	if not bool(usage.get("accepted", false)):
		return {"ok": false, "reason": "daily_limit", "rollback_required": true}

	return {
		"ok": true,
		"category": category,
		"reward": reward,
		"usage": usage,
		"mutation": mutation
	}
