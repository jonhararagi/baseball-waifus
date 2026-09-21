extends Node

const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")
const EquipmentServiceClass = preload("res://game/progression/equipment_service.gd")
const CharacterArchetypeCatalogClass = preload("res://game/characters/character_archetype_catalog.gd")

func _ready() -> void:
	var progress := ProgressStoreClass.new()
	progress.load_state()
	var roster := RosterClass.new()
	roster.load_state()
	var progress_snapshot := progress.snapshot()
	var roster_snapshot := roster.snapshot()

	var character_id := "bw001"
	var player = CharacterArchetypeCatalogClass.create_player(character_id)
	if not roster.has_character(character_id):
		assert(bool(roster.ensure_character(player).get("ok", false)), "character setup should succeed")

	assert(bool(progress.add_equipment("bat_r_01", 1).get("ok", false)), "test equipment should be granted")
	var service := EquipmentServiceClass.new()

	var equipped := service.equip(character_id, "bat_r_01", progress, roster)
	assert(bool(equipped.get("ok", false)), "equip should succeed")
	assert(roster.get_equipment(character_id).get("bats", "") == "bat_r_01", "bat should be equipped")
	assert(progress.get_equipment_count("bat_r_01") >= 0, "inventory count should remain valid")

	var modifiers := service.get_equipped_modifiers(character_id, roster)
	assert(int(modifiers.get("power", 0)) == 2, "bat should contribute power")

	var unequipped := service.unequip(character_id, "bats", progress, roster)
	assert(bool(unequipped.get("ok", false)), "unequip should succeed")
	assert(str(roster.get_equipment(character_id).get("bats", "")) == "", "slot should be empty")
	assert(progress.get_equipment_count("bat_r_01") >= 1, "unequipped item should return to inventory")

	assert(progress.restore_snapshot(progress_snapshot), "progress restore should succeed")
	assert(roster.restore_snapshot(roster_snapshot), "roster restore should succeed")
