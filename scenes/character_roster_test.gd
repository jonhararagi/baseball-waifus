extends Node

func _ready() -> void:
	var roster := CharacterRosterStore.new()
	var before := roster.snapshot()

	var player := CharacterArchetypeCatalog.create_player("bw001")
	assert(player != null, "catalog character must exist")
	var ensured := roster.ensure_character(player)
	assert(bool(ensured.get("ok", false)), "character must be persisted")
	assert(roster.has_character("bw001"), "roster must own character")

	var persisted := roster.get_player("bw001")
	assert(persisted != null, "persisted player must be reconstructable")
	assert(persisted.id == "bw001", "persisted identity must be stable")

	var training := roster.apply_training("bw001", {"power": 2, "contact": 1})
	assert(bool(training.get("ok", false)), "training must mutate persistent stats")
	var trained := roster.get_player("bw001")
	assert(trained.power >= player.power, "power gain must persist")
	assert(trained.contact >= player.contact, "contact gain must persist")

	var charm := roster.add_charm("bw001", 5)
	assert(bool(charm.get("ok", false)), "charm must use roster authority")
	var charm_player := roster.get_player("bw001")
	assert(charm_player.charm == 5, "charm must persist in roster")

	var mood := roster.set_mood("bw001", 72)
	assert(bool(mood.get("ok", false)), "mood must persist")
	var equipment := roster.set_equipment_item("bw001", "bat", "bat_power_r")
	assert(bool(equipment.get("ok", false)), "equipment reference must persist")

	var energy_before := roster.get_character_energy("bw001")
	var consumed := roster.consume_character_energy("bw001", 10)
	assert(bool(consumed.get("ok", false)), "character energy must be roster-owned")
	assert(roster.get_character_energy("bw001") == energy_before - 10, "energy consumption must persist")
	var restored := roster.add_character_energy("bw001", 10)
	assert(bool(restored.get("ok", false)), "character energy restoration must persist")

	assert(roster.restore_snapshot(before), "test must restore previous roster state")
	print("character_roster_test: PASS")
