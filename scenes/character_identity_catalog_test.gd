extends Node

const CATALOG_PATH := "res://game/characters/character_archetypes.json"

func _ready() -> void:
	var file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	assert(file != null, "Character archetype catalog must exist")
	var parsed = JSON.parse_string(file.get_as_text())
	assert(parsed is Dictionary, "Character archetype catalog must be a JSON object")
	assert(int(parsed.get("roster_size", 0)) == 30, "Roster size must remain 30")
	assert(parsed.get("identity_schema", "") == "character_identity_v1", "Identity schema must be declared")

	var characters: Array = parsed.get("characters", [])
	assert(characters.size() == 30, "Catalog must contain exactly 30 characters")

	var seen := {}
	var story_required := 0
	for character in characters:
		var id := str(character.get("id", ""))
		assert(not seen.has(id), "Character IDs must be unique: " + id)
		seen[id] = true

		var identity: Dictionary = character.get("character_identity", {})
		assert(not identity.is_empty(), "Missing character identity: " + id)
		assert(str(identity.get("archetype", "")) != "", "Missing archetype: " + id)
		assert(identity.get("style_tags", []) is Array, "Style tags must be an array: " + id)
		assert(str(identity.get("play_identity", "")) != "", "Missing play identity: " + id)
		assert(identity.get("skill_roles", []) is Array and identity.get("skill_roles", []).size() >= 1, "Missing skill roles: " + id)

		var rarity := str(character.get("rarity", "R"))
		var story_status := str(identity.get("story_status", ""))
		if rarity == "R":
			assert(story_status == "none", "R characters should not require story seeds: " + id)
		else:
			story_required += 1
			assert(story_status == "story_seed", "SR+ characters require story seeds: " + id)
			assert(str(identity.get("story_hook", "")) != "", "SR+ characters require story hooks: " + id)
			var actions: Array = identity.get("signature_action_ids", [])
			assert(actions.size() >= 1, "SR+ characters require a signature action: " + id)

		var stats: Dictionary = character.get("stats", {})
		for stat in ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"]:
			assert(stats.has(stat), "Missing gameplay stat " + stat + ": " + id)

	assert(story_required > 0, "Catalog must contain SR+ story characters")
	print("Character identity catalog tests passed: 30/30 entries structurally valid.")
