extends Node

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")

func _ready() -> void:
	assert(Controller.VALID_EXPRESSIONS.size() == 5, "Expression vocabulary must remain explicit and bounded.")
	for expression_id in Controller.VALID_EXPRESSIONS:
		assert(Controller.is_valid(expression_id), "Expression must validate: " + expression_id)
		assert(ResourceLoader.exists("res://assets/characters/expressions/bw001_%s.svg" % expression_id), "Missing bw001 expression asset: " + expression_id)
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL, "Starter must begin neutral.")
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED, "Comment expression mapping drifted.")
	assert(CardScript.has_method("set_expression"), "Character card must expose presentation-only expression state.")
	print("Character expression structural checks passed.")
