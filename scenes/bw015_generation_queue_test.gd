extends Node

const QUEUE_PATH := "res://data/characters_queue.json"
const CATALOG_PATH := "res://game/characters/character_archetypes.json"
const CHARACTER_ID := "bw015"

func _ready() -> void:
	var queue_file := FileAccess.open(QUEUE_PATH, FileAccess.READ)
	assert(queue_file != null, "bw015 queue file must exist.")
	var queue = JSON.parse_string(queue_file.get_as_text())
	assert(queue is Dictionary, "Character queue must be a JSON object.")
	assert(int(queue.get("schema_version", 0)) == 1)
	assert(str(queue.get("character_id", "")) == CHARACTER_ID)

	var canonical: Dictionary = queue.get("canonical", {})
	assert(bool(canonical.get("adult", false)), "bw015 must be adult-only.")
	assert(str(canonical.get("display_name", "")) == "Momo Hoshino")
	assert(str(canonical.get("rarity", "")) == "SSR")
	assert(str(canonical.get("position", "")) == "DH")
	assert(str(canonical.get("element", "")) == "fire")
	assert(str(canonical.get("specialization", "")) == "power")
	assert(int(canonical.get("potential", 0)) == 5)

	var stats: Dictionary = canonical.get("stats", {})
	var expected_stats := {
		"power": 71,
		"contact": 70,
		"speed": 54,
		"pitch": 66,
		"control": 78,
		"defense": 68,
		"critical": 15,
		"stamina": 83
	}
	for stat in expected_stats.keys():
		assert(int(stats.get(stat, -1)) == expected_stats[stat], "bw015 stat drift: " + stat)

	var identity: Dictionary = canonical.get("identity", {})
	assert(str(identity.get("archetype", "")) == "warm_curvy_power_hitter")
	assert(identity.get("style_tags", []) == ["warm", "curvy", "cheerful", "power"])
	assert(str(identity.get("play_identity", "")) == "clutch_contact")
	assert(str(identity.get("story_status", "")) == "story_seed")
	assert(str(identity.get("story_hook", "")) != "")
	assert(identity.get("signature_action_ids", []) == ["sacrifice_fly_focus"])
	assert(identity.get("skill_roles", []) == ["attack", "support"])

	var visual: Dictionary = canonical.get("visual", {})
	var expected_visual := {
		"body_preset": "curvy_power",
		"face_style": "warm",
		"skin": "#e8b18f",
		"hair_color": "#b85a3f",
		"hair_style": "medium_wavy",
		"uniform_style": "classic_baseball",
		"uniform_color": "#fff0dd",
		"accent": "#e4572e",
		"eye": "#633022"
	}
	for key in expected_visual.keys():
		assert(str(visual.get(key, "")) == str(expected_visual[key]), "bw015 generation visual drift: " + str(key))

	var pollinations: Dictionary = queue.get("pollinations", {})
	assert(str(pollinations.get("base_prompt", "")).contains("Momo Hoshino"))
	assert(str(pollinations.get("base_prompt", "")).contains("adult anime female baseball player"))
	var negative_prompt := str(pollinations.get("negative_prompt", "")).to_lower()
	assert(negative_prompt.contains("child"))
	assert(negative_prompt.contains("underage"))
	assert(not str(pollinations.get("base_prompt", "")).contains("watermark"))
	var expressions: Dictionary = pollinations.get("expressions", {})
	for expression_id in ["neutral", "happy", "focused", "surprised", "disappointed"]:
		assert(str(expressions.get(expression_id, "")) != "", "Missing bw015 expression prompt: " + expression_id)

	var sprite: Dictionary = queue.get("pixel_art_generator", {})
	assert(str(sprite.get("sprite_resolution", "")) == "128x128")
	assert(str(sprite.get("style", "")).contains("transparent background"))
	assert(str(sprite.get("prompt_sprite", "")).contains("Momo Hoshino"))

	var animation: Dictionary = queue.get("animation_layers", {})
	assert(str(animation.get("type", "")) == "2D_cutout_node_system")
	assert(str(animation.get("root_node", "")) == "MomoHoshino_Rig")
	assert(animation.get("parts", []) == [
		"head_neutral",
		"hair_wavy_back",
		"hair_wavy_front",
		"torso_curvy",
		"arm_left_bat_grip",
		"arm_right_bat_grip",
		"legs_power_stance",
		"baseball_bat_fire"
	])
	assert(animation.get("preset_animations", []) == [
		"idle_breathing",
		"batting_ready_loop",
		"power_swing_execution",
		"base_run_sprint"
	])

	var serialized := FileAccess.get_file_as_string(QUEUE_PATH).to_lower()
	assert(not serialized.contains("http://"), "bw015 queue must not embed remote URLs.")
	assert(not serialized.contains("https://"), "bw015 queue must not embed remote URLs.")

	var catalog_file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	assert(catalog_file != null, "Canonical character catalog must exist.")
	var catalog = JSON.parse_string(catalog_file.get_as_text())
	assert(catalog is Dictionary)
	var characters: Array = catalog.get("characters", [])
	var entry: Dictionary = {}
	for character in characters:
		if str(character.get("id", "")) == CHARACTER_ID:
			entry = character
			break
	assert(not entry.is_empty(), "bw015 must exist in canonical roster.")
	assert(str(entry.get("display_name", "")) == "Momo Hoshino")
	assert(str(entry.get("rarity", "")) == "SSR")
	assert(str(entry.get("position", "")) == "DH")
	assert(str(entry.get("element", "")) == "fire")
	assert(str(entry.get("specialization", "")) == "power")
	assert(int(entry.get("potential", 0)) == 5)
	assert(entry.get("stats", {}) == expected_stats)

	var catalog_identity: Dictionary = entry.get("character_identity", {})
	assert(str(catalog_identity.get("archetype", "")) == "warm_curvy_power_hitter")
	assert(str(catalog_identity.get("play_identity", "")) == "clutch_contact")
	assert(catalog_identity.get("signature_action_ids", []) == ["sacrifice_fly_focus"])
	assert(catalog_identity.get("skill_roles", []) == ["attack", "support"])

	print("bw015 generation queue QA passed.")
	get_tree().quit(0)
