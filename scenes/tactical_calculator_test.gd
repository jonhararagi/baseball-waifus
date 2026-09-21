extends Node

const TacticalCalculatorClass = preload("res://game/baseball/tactical_calculator.gd")
const PitchClass = preload("res://game/baseball/pitch.gd")
const PlayerDataClass = preload("res://game/characters/player_data.gd")

func _ready() -> void:
	var batter := PlayerDataClass.new("tactical_batter", "Tactical Batter")
	batter.contact = 70
	batter.power = 80
	batter.element = "fire"

	var pitcher := PlayerDataClass.new("tactical_pitcher", "Tactical Pitcher")
	pitcher.control = 70
	pitcher.element = "ice"

	var pitch := PitchClass.new(Pitch.Type.FASTBALL)
	var calculator := TacticalCalculatorClass.new()
	var first := calculator.evaluate_batting(batter, pitcher, pitch, 0.50)
	var second := calculator.evaluate_batting(batter, pitcher, pitch, 0.95)

	assert(bool(first.valid))
	assert(bool(second.valid))
	assert(float(second.contact_probability) > float(first.contact_probability))
	assert(is_equal_approx(float(first.contact_probability), float(calculator.evaluate_batting(batter, pitcher, pitch, 0.50).contact_probability)))
