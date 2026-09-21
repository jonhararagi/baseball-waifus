class_name EquipmentService
extends RefCounted

## Owns equip/unequip rules.
## Inventory quantities are owned by PlayerProgressStore.
## Equipped references are owned by CharacterRosterStore.
## Gameplay modifiers are calculated from this service and must be consumed by
## gameplay resolvers, never by the renderer.

const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")
const EquipmentCatalogClass = preload("res://game/progression/equipment_catalog.gd")

func equip(character_id: String, item_id: String, progress_store: RefCounted = null, roster: RefCounted = null) -> Dictionary:
	var stores := _stores(progress_store, roster)
	progress_store = stores.progress
	roster = stores.roster
	if not roster.has_character(character_id):
		return {"ok": false, "reason": "character_not_owned"}
	var item := EquipmentCatalogClass.find(item_id)
	if item.is_empty():
		return {"ok": false, "reason": "unknown_equipment"}
	if progress_store.get_equipment_count(item_id) <= 0:
		return {"ok": false, "reason": "equipment_not_owned"}
	var slot := str(item.get("slot", ""))
	var current := roster.get_equipment(character_id)
	var old_item_id := str(current.get(slot, ""))
	if not old_item_id.is_empty():
		var old_check := EquipmentCatalogClass.validate(old_item_id)
		if not bool(old_check.get("ok", false)):
			return {"ok": false, "reason": "invalid_equipped_item", "item_id": old_item_id}
	if old_item_id == item_id:
		return {"ok": true, "character_id": character_id, "item_id": item_id, "slot": slot, "changed": false}

	var progress_snapshot := progress_store.snapshot()
	var roster_snapshot := roster.snapshot()

	var remove_new := progress_store.consume_equipment(item_id, 1)
	if not bool(remove_new.get("ok", false)):
		return remove_new

	if not old_item_id.is_empty():
		var restore_old := progress_store.add_equipment(old_item_id, 1)
		if not bool(restore_old.get("ok", false)):
			progress_store.restore_snapshot(progress_snapshot)
			roster.restore_snapshot(roster_snapshot)
			return {"ok": false, "reason": "failed_to_restore_previous_equipment"}

	var set_result := roster.set_equipment_item(character_id, slot, item_id)
	if not bool(set_result.get("ok", false)):
		progress_store.restore_snapshot(progress_snapshot)
		roster.restore_snapshot(roster_snapshot)
		return set_result

	return {
		"ok": true,
		"character_id": character_id,
		"item_id": item_id,
		"slot": slot,
		"replaced_item_id": old_item_id,
		"changed": true
	}

func unequip(character_id: String, slot: String, progress_store: RefCounted = null, roster: RefCounted = null) -> Dictionary:
	var stores := _stores(progress_store, roster)
	progress_store = stores.progress
	roster = stores.roster
	if not roster.has_character(character_id):
		return {"ok": false, "reason": "character_not_owned"}
	var current := roster.get_equipment(character_id)
	var item_id := str(current.get(slot, ""))
	if item_id.is_empty():
		return {"ok": false, "reason": "slot_empty"}
	var item := EquipmentCatalogClass.find(item_id)
	if item.is_empty() or str(item.get("slot", "")) != slot:
		return {"ok": false, "reason": "invalid_equipped_item"}

	var progress_snapshot := progress_store.snapshot()
	var roster_snapshot := roster.snapshot()
	var returned := progress_store.add_equipment(item_id, 1)
	if not bool(returned.get("ok", false)):
		return returned

	var set_result := roster.set_equipment_item(character_id, slot, "")
	if not bool(set_result.get("ok", false)):
		progress_store.restore_snapshot(progress_snapshot)
		roster.restore_snapshot(roster_snapshot)
		return set_result

	return {"ok": true, "character_id": character_id, "slot": slot, "item_id": item_id}

func get_equipped_modifiers(character_id: String, roster: RefCounted = null) -> Dictionary:
	if roster == null:
		roster = RosterClass.new()
		roster.load_state()
	if not roster.has_character(character_id):
		return {}
	var result := {}
	for item_id in roster.get_equipment(character_id).values():
		var id := str(item_id)
		if id.is_empty():
			continue
		var modifiers := EquipmentCatalogClass.modifiers_for(id)
		for stat in modifiers.keys():
			result[stat] = int(result.get(stat, 0)) + int(modifiers.get(stat, 0))
	return result

func get_effective_stats(character_id: String, base_stats: Dictionary, roster: RefCounted = null) -> Dictionary:
	var result := {}
	for key in base_stats.keys():
		result[str(key)] = int(base_stats[key])
	var modifiers := get_equipped_modifiers(character_id, roster)
	for key in modifiers.keys():
		result[key] = int(result.get(key, 0)) + int(modifiers.get(key, 0))
	return result

func _stores(progress_store: RefCounted, roster: RefCounted) -> Dictionary:
	if progress_store == null:
		progress_store = ProgressStoreClass.new()
		progress_store.load_state()
	if roster == null:
		roster = RosterClass.new()
		roster.load_state()
	return {"progress": progress_store, "roster": roster}
