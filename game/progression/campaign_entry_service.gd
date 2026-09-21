class_name CampaignEntryService
extends RefCounted

## Atomic local entry gate: attempt limit + player energy.
## It does not resolve rewards and cannot alter baseball results.

const StoreClass = preload("res://game/progression/player_progress_store.gd")
const AttemptStoreClass = preload("res://game/progression/campaign_attempt_store.gd")

func begin(activity_id: String, activity_type: String, cycle_state: Dictionary, progress_store: RefCounted = null, attempt_store: RefCounted = null) -> Dictionary:
	var cost := EconomyRules.match_energy_cost(activity_type)
	if cost < 0:
		return {"ok": false, "reason": "invalid_activity_type"}
	if activity_id.is_empty():
		return {"ok": false, "reason": "invalid_activity_id"}
	if progress_store == null:
		progress_store = StoreClass.new()
		progress_store.load_state()
	if attempt_store == null:
		attempt_store = AttemptStoreClass.new()
	if not attempt_store.can_attempt(activity_id, activity_type, cycle_state):
		return {"ok": false, "reason": "attempt_limit"}

	var snapshot: Dictionary = progress_store.snapshot()
	var energy_result: Dictionary = progress_store.consume_player_energy(cost)
	if not bool(energy_result.get("ok", false)):
		return energy_result

	var attempt_result: Dictionary = attempt_store.consume_attempt(activity_id, activity_type, cycle_state)
	if not bool(attempt_result.get("ok", false)):
		progress_store.restore_snapshot(snapshot)
		return {
			"ok": false,
			"reason": str(attempt_result.get("reason", "attempt_failed")),
			"rolled_back": true
		}

	return {
		"ok": true,
		"energy_cost": cost,
		"energy": energy_result,
		"attempt": attempt_result,
		"activity_id": activity_id,
		"activity_type": activity_type
	}
