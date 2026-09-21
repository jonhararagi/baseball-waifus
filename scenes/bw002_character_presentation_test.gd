extends Node

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const Catalog = preload("res://game/characters/character_archetype_catalog.gd")

const CHARACTER_ID := "bw002"

func _ready() -> void:
	var entry := Catalog.find(CHARACTER_ID)
	assert(not entry.is_empty(), "bw002 must exist in the canonical character catalog.")
	assert(str(entry.get("display_name", "")) == "Reina Kurose")
	assert(str(entry.get("rarity", "")) == "SSR")
	assert(str(entry.get("element", "")) == "ice")
	assert(str(entry.get("position", "")) == "P")
	assert(str(entry.get("specialization", "")) == "pitcher")

	var player := Catalog.create_player(CHARACTER_ID)
	assert(player != null, "Canonical bw002 PlayerData must be constructible.")
	assert(player.id == CHARACTER_ID)

	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path), "Missing bw002 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 2500, "bw002 expression asset is unexpectedly small: " + expression_id)
		assert(not content.contains("<text"), "bw002 expression SVG must not depend on embedded font glyphs: " + expression_id)
		assert(content.contains("#1d2738"), "bw002 hair palette drifted: " + expression_id)
		assert(content.contains("#8ad9ff"), "bw002 pitcher accent drifted: " + expression_id)
		contents[expression_id] = content

	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(contents[first_id] != contents[second_id], "bw002 expression assets must remain distinct.")

	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw002_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw002_happy.svg"))
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL)
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	assert(CardScript.has_method("set_expression"))
	assert(CardScript.has_method("current_expression"))

	print("bw002 character presentation checks passed.")
