class_name RewardedAdClaimService
extends RefCounted

## Local authority for the complete rewarded-ad claim transaction.
## Provider adapters must call this only after the platform reports a completed ad.
## It never displays an ad and never contacts a server.

const PolicyClass = preload("res://game/monetization/rewarded_ad_policy.gd")
const UsageStoreClass = preload("res://game/monetization/rewarded_ad_usage_store.gd")
const TransactionClass = preload("res://game/monetization/rewarded_ad_transaction.gd")
const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")

func claim(category: int, character_id: String = "", progress_store: RefCounted = null) -> Dictionary:
	var policy = PolicyClass.new()
	var usage_store = UsageStoreClass.new()
	var today := Time.get_date_string_from_system(true)
	var usage_state: Dictionary = usage_store.load_state(today)

	if not policy.can_claim(category, usage_state.get("uses", {})):
		return {"ok": false, "reason": "daily_limit"}

	if progress_store == null:
		progress_store = ProgressStoreClass.new()
		progress_store.load_state()

	var snapshot: Dictionary = progress_store.snapshot()
	var roster = RosterClass.new()
	roster.load_state()
	var roster_snapshot: Dictionary = roster.snapshot()
	var tx = TransactionClass.new()
	var usage_counts: Dictionary = usage_state.get("uses", {}).duplicate(true)
	var result: Dictionary = tx.grant(category, character_id, usage_counts, progress_store)
	if not bool(result.get("ok", false)):
		return result

	usage_state["uses"] = usage_counts
	if not usage_store.save_state(usage_state):
		var progress_restored := progress_store.restore_snapshot(snapshot)
		var roster_restored := roster.restore_snapshot(roster_snapshot)
		return {"ok": false, "reason": "usage_save_failed", "rolled_back": progress_restored and roster_restored, "progress_restored": progress_restored, "roster_restored": roster_restored}

	result["usage_persisted"] = true
	return result
