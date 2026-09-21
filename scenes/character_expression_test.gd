extends Node

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")

func _ready() -> void:
	assert(Controller.VALID_EXPRESSIONS.size() == 5, "Expression vocabulary must remain explicit and bounded.")
	var asset_text: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		assert(Controller.is_valid(expression_id), "Expression must validate: " + expression_id)
		var path := "res://assets/characters/expressions/bw001_%s.svg" % expression_id
		assert(ResourceLoader.exists(path), "Missing bw001 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 2500, "Expression asset is unexpectedly small: " + expression_id)
		assert(not content.contains("<text"), "Expression SVG must not depend on embedded text glyphs: " + expression_id)
		asset_text[expression_id] = content
	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(asset_text[first_id] != asset_text[second_id], "Expression assets must remain visually distinct.")
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL, "Starter must begin neutral.")
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED, "Comment expression mapping drifted.")
	assert(CardScript.has_method("set_expression"), "Character card must expose presentation-only expression state.")
	assert(CardScript.has_method("current_expression"), "Character card must expose the current presentation expression.")
	print("Character expression structural checks passed.")
