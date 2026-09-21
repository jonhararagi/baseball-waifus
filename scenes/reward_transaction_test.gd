extends SceneTree

const ProgressStoreClass = preload("res://game/progression/player_progress_store.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")
const RewardTransactionClass = preload("res://game/progression/reward_transaction_service.gd")
const EquipmentCatalogClass = preload("res://game/progression/equipment_catalog.gd")
const CharacterArchetypeCatalogClass = preload("res://game/characters/character_archetype_catalog.gd")

func _initialize() -> void:
	var progress := ProgressStoreClass.new()
	progress.load_state()
	var roster := RosterClass.new()
	roster.load_state()

	var progress_snapshot := progress.snapshot()
	var roster_snapshot := roster.snapshot()
	var test_character_id := "bw001"

	var catalog_check := EquipmentCatalogClass.validate("bat_r_01")
	assert(bool(catalog_check.get("ok", false)), "equipment catalog should validate bat_r_01")

	var transaction := RewardTransactionClass.new()
	var rewards := [
		{"category": "coins", "amount": 25},
		{"category": "materials", "item_id": "character_exp_small", "amount": 2},
		{"category": "equipment", "item_id": "bat_r_01", "amount": 1},
		{"category": "character", "character_id": test_character_id, "amount": 1}
	]

	if roster.has_character(test_character_id):
		rewards.remove_at(3)

	var result: Dictionary = transaction.grant(rewards, progress, roster)
	assert(bool(result.get("ok", false)), "valid reward batch should commit")
	assert(progress.get_coins() >= 25, "coins should be granted")
	assert(progress.get_material_count("character_exp_small") >= 2, "material should be granted")
	assert(progress.get_equipment_count("bat_r_01") >= 1, "equipment should be granted")

	var after_valid_progress := progress.snapshot()
	var after_valid_roster := roster.snapshot()
	var invalid := transaction.grant([
		{"category": "equipment", "item_id": "does_not_exist", "amount": 1}
	], progress, roster)
	assert(not bool(invalid.get("ok", false)), "invalid reward must fail")
	assert(progress.snapshot() == after_valid_progress, "invalid reward must not change account inventory")
	assert(roster.snapshot() == after_valid_roster, "invalid reward must not change roster")

	assert(progress.restore_snapshot(progress_snapshot), "progress snapshot should restore")
	assert(roster.restore_snapshot(roster_snapshot), "roster snapshot should restore")
	assert(not CharacterArchetypeCatalogClass.find(test_character_id).is_empty(), "test character must exist")

	print("reward_transaction_test: structural checks passed")
	quit()
