class_name RewardTransactionService
extends RefCounted

## Applies already-resolved rewards as a compensating transaction across account inventory and roster.
## Rollback is persisted on failure; cross-file crash atomicity is not claimed.
## RewardResolver / future gacha/map systems remain responsible for resolving a reward payload.

const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")
const EquipmentCatalogClass = preload("res://game/progression/equipment_catalog.gd")

func grant(rewards: Array, progress_store: RefCounted = null, roster: RefCounted = null) -> Dictionary:
	if rewards.is_empty():
		return {"ok": false, "reason": "empty_reward"}

	if progress_store == null:
		progress_store = ProgressStoreClass.new()
		progress_store.load_state()
	if roster == null:
		roster = RosterClass.new()
		roster.load_state()

	var validation := _validate_rewards(rewards, roster)
	if not bool(validation.get("ok", false)):
		return validation

	var progress_snapshot: Dictionary = progress_store.snapshot()
	var roster_snapshot: Dictionary = roster.snapshot()
	var applied: Array = []

	for reward in rewards:
		var result := _apply_reward(reward, progress_store, roster)
		if not bool(result.get("ok", false)):
			var progress_restored := progress_store.restore_snapshot(progress_snapshot)
			var roster_restored := roster.restore_snapshot(roster_snapshot)
			return {
				"ok": false,
				"reason": str(result.get("reason", "reward_failed")),
				"failed_reward": reward.duplicate(true),
				"applied_before_failure": applied,
				"rolled_back": progress_restored and roster_restored,
				"progress_restored": progress_restored,
				"roster_restored": roster_restored
			}
		applied.append(result)

	return {
		"ok": true,
		"rewards": applied,
		"count": applied.size()
	}

func _validate_rewards(rewards: Array, roster: RefCounted) -> Dictionary:
	for reward in rewards:
		if typeof(reward) != TYPE_DICTIONARY:
			return {"ok": false, "reason": "invalid_reward"}
		var category := str(reward.get("category", ""))
		var amount := int(reward.get("amount", 0))
		if category.is_empty() or amount <= 0:
			return {"ok": false, "reason": "invalid_reward_amount", "reward": reward}
		match category:
			"coins":
				pass
			"player_energy":
				if amount > 100:
					return {"ok": false, "reason": "player_energy_reward_too_large"}
			"materials":
				if str(reward.get("item_id", "")).is_empty():
					return {"ok": false, "reason": "material_id_required"}
			"equipment":
				var item_id := str(reward.get("item_id", ""))
				var equipment_check := EquipmentCatalogClass.validate(item_id)
				if not bool(equipment_check.get("ok", false)):
					return equipment_check
			"character_energy":
				var character_id := str(reward.get("character_id", ""))
				if character_id.is_empty() or not roster.has_character(character_id):
					return {"ok": false, "reason": "character_required_or_not_owned", "character_id": character_id}
			"charm":
				var charm_character := str(reward.get("character_id", ""))
				if charm_character.is_empty() or not roster.has_character(charm_character):
					return {"ok": false, "reason": "character_required_or_not_owned", "character_id": charm_character}
			"character":
				var new_character_id := str(reward.get("character_id", ""))
				if amount != 1:
					return {"ok": false, "reason": "character_amount_must_be_one"}
				if new_character_id.is_empty() or CharacterArchetypeCatalog.find(new_character_id).is_empty():
					return {"ok": false, "reason": "unknown_character", "character_id": new_character_id}
				if roster.has_character(new_character_id):
					return {"ok": false, "reason": "character_already_owned", "character_id": new_character_id}
			_:
				return {"ok": false, "reason": "unknown_reward_category", "category": category}
	return {"ok": true}

func _apply_reward(reward: Dictionary, progress_store: RefCounted, roster: RefCounted) -> Dictionary:
	var category := str(reward.get("category", ""))
	var amount := int(reward.get("amount", 0))
	match category:
		"coins":
			return progress_store.add_coins(amount)
		"player_energy":
			return progress_store.add_player_energy(amount)
		"materials":
			return progress_store.add_material(str(reward.get("item_id", "")), amount)
		"equipment":
			return progress_store.add_equipment(str(reward.get("item_id", "")), amount)
		"character_energy":
			return roster.add_character_energy(str(reward.get("character_id", "")), amount)
		"charm":
			return roster.add_charm(str(reward.get("character_id", "")), amount)
		"character":
			var player := CharacterArchetypeCatalog.create_player(str(reward.get("character_id", "")))
			var ensure_result := roster.ensure_character(player)
			if not bool(ensure_result.get("ok", false)):
				return ensure_result
			return {
				"ok": true,
				"category": category,
				"character_id": player.id,
				"created": true
			}
		_:
			return {"ok": false, "reason": "unknown_reward_category"}
