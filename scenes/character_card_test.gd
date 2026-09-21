extends Node

const CardClass = preload("res://game/ui/character_card.gd")
const PlayerDataClass = preload("res://game/characters/player_data.gd")

func _ready() -> void:
	var player := PlayerDataClass.new()
	player.id = "bw001"
	player.display_name = "Test Player"
	player.rarity = "UR"
	player.element = "fire"
	player.position = "P"
	player.specialization = "pitcher"
	player.level = 12
	player.potential = 5
	player.power = 70
	player.contact = 60
	player.speed = 55
	player.pitch = 90
	player.control = 88
	player.defense = 75
	player.critical = 18
	player.stamina = 86

	var card := CardClass.new()
	add_child(card)
	card.setup(player)

	assert(card.custom_minimum_size == Vector2(430, 570))
	assert(card.rarity_badge.text == "UR")
	assert(card.name_label.text == "Test Player")
	assert(card.level_label.text == "LV 12  •  POT 5")
	assert(card.meta_label.text == "P  •  FIRE  •  PITCHER")
assert(card.identity_label.text == "BIG SWING THREAT")
	assert(card.stat_bars.size() == 8)
	for entry in card.stat_bars:
		var bar: ProgressBar = card.stat_bars[entry]
		assert(bar.max_value == 100.0)
	assert(card.expression_id == "neutral")

	card.set_expression("happy")
	assert(card.expression_id == "happy")
	card.set_expression("invalid")
	assert(card.expression_id == "neutral")

	card.set_comment("Test comment")
	assert(card.comment_label.text == "Test comment")

	print("CharacterCardTest: PASS")
