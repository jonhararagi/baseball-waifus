extends Node

const QUEUE_PATH := "res://data/characters_queue.json"
const CATALOG_PATH := "res://game/characters/character_archetypes.json"

const IDS := ["bw016", "bw017", "bw018", "bw019", "bw020"]
const PALETTE_KEYS := ["skin", "hair_color", "uniform_color", "accent", "eye"]
const EXPRESSIONS := ["neutral", "happy", "focused", "surprised", "disappointed"]

func _ready() -> void:
	var queue_file := FileAccess.open(QUEUE_PATH, FileAccess.READ)
	assert(queue_file != null, "characters queue must exist.")
	var queue = JSON.parse_string(queue_file.get_as_text())
	assert(queue is Dictionary, "characters queue must remain a JSON object.")
	assert(int(queue.get("schema_version", 0)) == 1, "queue schema version must remain 1.")

	var batch = queue.get("batch_units", [])
	assert(batch is Array, "batch_units must be an array.")
	assert(batch.size() == IDS.size(), "bw016-bw020 batch must contain exactly five units.")

	var catalog_file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	assert(catalog_file != null, "canonical character catalog must exist.")
	var catalog = JSON.parse_string(catalog_file.get_as_text())
	assert(catalog is Dictionary)
	var characters: Array = catalog.get("characters", [])

	var seen := {}
	for unit_value in batch:
		assert(unit_value is Dictionary, "Each batch unit must be an object.")
		var unit: Dictionary = unit_value
		var character_id := str(unit.get("character_id", ""))
		assert(IDS.has(character_id), "Unexpected batch character: " + character_id)
		assert(not seen.has(character_id), "Duplicate batch character: " + character_id)
		seen[character_id] = true
		assert(int(unit.get("schema_version", 0)) == 1, character_id + " schema_version must be 1.")

		var canonical: Dictionary = unit.get("canonical", {})
		assert(bool(canonical.get("adult", false)), character_id + " must remain adult-only.")

		var catalog_entry: Dictionary = {}
		for candidate in characters:
			if str(candidate.get("id", "")) == character_id:
				catalog_entry = candidate
				break
		assert(not catalog_entry.is_empty(), character_id + " missing from canonical roster.")

		for key in ["display_name", "rarity", "position", "element", "specialization"]:
			assert(str(canonical.get(key, "")) == str(catalog_entry.get(key, "")), character_id + " canonical drift: " + key)
		assert(int(canonical.get("potential", -1)) == int(catalog_entry.get("potential", -2)), character_id + " canonical drift: potential")
		assert(canonical.get("stats", {}) == catalog_entry.get("stats", {}), character_id + " canonical drift: stats")

		var expected_identity: Dictionary = catalog_entry.get("character_identity", {})
		var queue_identity: Dictionary = canonical.get("identity", {})
		for key in ["archetype", "play_identity", "story_status"]:
			assert(str(queue_identity.get(key, "")) == str(expected_identity.get(key, "")), character_id + " identity drift: " + key)
		assert(queue_identity.get("signature_action_ids", []) == expected_identity.get("signature_action_ids", []), character_id + " signature action drift")
		assert(queue_identity.get("skill_roles", []) == expected_identity.get("skill_roles", []), character_id + " skill roles drift")

		var catalog_visual: Dictionary = catalog_entry.get("visual", {})
		var queue_visual: Dictionary = canonical.get("visual", {})
		for key in ["body_preset", "face_style", "hair_color", "hair_style", "uniform_style", "uniform_color", "accent", "eye", "skin"]:
			assert(str(queue_visual.get(key, "")) == str(catalog_visual.get(key, "")), character_id + " visual drift: " + key)

		for palette_key in PALETTE_KEYS:
			var palette_value := str(queue_visual.get(palette_key, ""))
			assert(palette_value.begins_with("#"), character_id + " palette must be hexadecimal: " + palette_key)
			assert(palette_value.length() in [4, 7, 9], character_id + " palette length invalid: " + palette_key)

		var pollinations: Dictionary = unit.get("pollinations", {})
		var base_prompt := str(pollinations.get("base_prompt", ""))
		var negative_prompt := str(pollinations.get("negative_prompt", "")).to_lower()
		assert(base_prompt.contains(str(canonical.get("display_name", ""))), character_id + " base prompt must identify the character.")
		assert(base_prompt.contains("adult anime female baseball player"), character_id + " base prompt must enforce adult baseball identity.")
		for forbidden in ["child", "teenager", "underage", "loli", "young-looking"]:
			assert(negative_prompt.contains(forbidden), character_id + " negative prompt must contain " + forbidden)
		var expressions: Dictionary = pollinations.get("expressions", {})
		for expression_id in EXPRESSIONS:
			assert(str(expressions.get(expression_id, "")).strip_edges() != "", character_id + " missing expression prompt: " + expression_id)

		var sprite: Dictionary = unit.get("pixel_art_generator", {})
		assert(str(sprite.get("sprite_resolution", "")) == "128x128", character_id + " sprite resolution must be 128x128.")
		assert(str(sprite.get("style", "")).contains("transparent background"), character_id + " sprite must use transparent background.")
		assert(str(sprite.get("prompt_sprite", "")).contains(str(canonical.get("display_name", ""))), character_id + " sprite prompt must identify the character.")

		var animation: Dictionary = unit.get("animation_layers", {})
		assert(str(animation.get("type", "")) == "2D_cutout_node_system", character_id + " animation type mismatch.")
		assert(str(animation.get("root_node", "")) != "", character_id + " rig root missing.")
		assert((animation.get("parts", []) as Array).size() >= 7, character_id + " requires a production rig layer set.")
		assert((animation.get("preset_animations", []) as Array).size() >= 4, character_id + " requires four presentation animations.")

	var serialized := FileAccess.get_file_as_string(QUEUE_PATH).to_lower()
	assert(not serialized.contains("http://"), "generation queue must not embed HTTP URLs.")
	assert(not serialized.contains("https://"), "generation queue must not embed HTTPS URLs.")

	print("bw016-bw020 generation queue QA passed.")
	get_tree().quit(0)
