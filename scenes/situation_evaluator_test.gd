extends Node

const EvaluatorClass = preload("res://game/baseball/situation_evaluator.gd")
const PlayerDataClass = preload("res://game/characters/player_data.gd")
const PitchClass = preload("res://game/baseball/pitch.gd")

func _ready() -> void:
	var batter := PlayerDataClass.new("batter", "Batter")
	batter.contact = 80
	batter.power = 85
	batter.speed = 75
	var pitcher := PlayerDataClass.new("pitcher", "Pitcher")
	pitcher.control = 70
	pitcher.pitch = 65
	var evaluator := EvaluatorClass.new()

	var snapshot := {
		"inning": 3, "max_innings": 3, "half": 0,
		"outs": 1, "balls": 2, "strikes": 2,
		"score_batting": 1, "score_fielding": 2,
		"bases": [true, false, true]
	}
	var result := evaluator.evaluate(snapshot, batter, pitcher, {})
	assert(bool(result.get("valid", true)) or result.has("contact_edge"))
	assert(float(result.contact_edge) > 0.0)
	assert(float(result.offensive_steal_value) > 0.0)
	assert(float(result.defensive_double_play_value) > 0.0)

	var preview := evaluator.preview_pitch(snapshot, batter, pitcher, PitchClass.create(Pitch.Type.FASTBALL))
	assert(bool(preview.valid))
	assert(preview.timing_options.size() == 5)
