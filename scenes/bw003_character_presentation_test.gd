extends Node

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const Catalog = preload("res://game/characters/character_archetype_catalog.gd")

const CHARACTER_ID := "bw003"

func _ready() -> void:
	var entry := Catalog.find(CHARACTER_ID)
	assert(not entry.is_empty(), "bw003 must exist in the canonical character catalog.")
	assert(str(entry.get("display_name", "")) == "Miu Tachibana")
	assert(str(entry.get("rarity", "")) == "SR")
	assert(str(entry.get("element", "")) == "lightning")
	assert(str(entry.get("position", "")) == "SS")
	assert(str(entry.get("specialization", "")) == "contact")

	var player := Catalog.create_player(CHARACTER_ID)
	assert(player != null, "Canonical bw003 PlayerData must be constructible.")
	assert(player.id == CHARACTER_ID)
	assert(player.display_name == "Miu Tachibana")
	assert(player.rarity == "SR")
	assert(player.element == "lightning")
	assert(player.position == "SS")
	assert(player.specialization == "contact")

	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path), "Missing bw003 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 2500, "bw003 expression asset is unexpectedly small: " + expression_id)
		assert(not content.contains("<text"), "bw003 expression SVG must not depend on embedded font glyphs: " + expression_id)
		assert(content.contains("#7b4a2f"), "bw003 hair palette drifted: " + expression_id)
		assert(content.contains("#f6d447"), "bw003 lightning accent drifted: " + expression_id)
		assert(content.contains("#3d2b22"), "bw003 eye palette drifted: " + expression_id)
		contents[expression_id] = content

	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(contents[first_id] != contents[second_id], "bw003 expression assets must remain distinct.")

	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw003_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw003_happy.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.FOCUSED).ends_with("bw003_focused.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.SURPRISED).ends_with("bw003_surprised.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.DISAPPOINTED).ends_with("bw003_disappointed.svg"))
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL)
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	assert(CardScript.has_method("set_expression"))
	assert(CardScript.has_method("current_expression"))

	print("bw003 character presentation checks passed.")
