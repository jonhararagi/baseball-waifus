class_name GameTables
extends RefCounted

static func campaign_drop_table(zone: int, difficulty: String) -> DropTable:
	var table := DropTable.new()
	table.table_id = "campaign_z%02d_%s" % [zone, difficulty]
	table.version = 1
	var base := 100.0
	if difficulty == "hard":
		base = 85.0
	elif difficulty == "hell":
		base = 70.0
	table.weights = {
		"coins": base,
		"exp": 35.0,
		"material_common": 20.0,
		"energy_drink": 5.0,
		"happiness_food": 5.0,
		"equipment_r": 3.0,
		"equipment_sr": 0.5 if difficulty != "hell" else 1.0,
		"boss_fragment": max(0.02, 0.10 + zone * 0.01)
	}
	return table

static func demon_king_fragment_table(zone: int, difficulty: String) -> DropTable:
	var table := DropTable.new()
	table.table_id = "demon_king_fragments_z%02d_%s" % [zone, difficulty]
	table.version = 1
	var bonus := 0.0
	if difficulty == "hard":
		bonus = 0.05
	elif difficulty == "hell":
		bonus = 0.15
	table.weights = {
		"no_fragment": 1000.0,
		"demon_king_fragment": 0.05 + zone * 0.01 + bonus
	}
	return table

static func fusion_table(parent_rarity: String) -> DropTable:
	var table := DropTable.new()
	table.table_id = "fusion_%s" % parent_rarity
	table.version = 1
	match parent_rarity:
		"R":
			table.weights = {"same_rarity": 80.0, "next_rarity": 20.0}
		"SR":
			table.weights = {"same_rarity": 90.0, "next_rarity": 10.0}
		"SSR":
			table.weights = {"same_rarity": 95.0, "next_rarity": 5.0}
		_:
			table.weights = {"same_rarity": 100.0}
	return table
