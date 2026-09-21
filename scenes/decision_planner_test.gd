extends Node

const PlayerDataClass = preload("res://game/characters/player_data.gd")

func _ready() -> void:
	var planner := BaseballDecisionPlanner.new(12345)
	var batter := PlayerDataClass.new("bw001", "Batter")
	batter.contact = 80
	batter.power = 75
	var pitcher := PlayerDataClass.new("bw002", "Pitcher")
	pitcher.control = 70
	var plan := planner.prepare_plate_appearance({
		"batter_id": "bw001",
		"pitcher_id": "bw002",
		"inning": 1,
		"half": 0,
		"outs": 1,
		"balls": 1,
		"strikes": 1,
		"score_batting": 2,
		"score_fielding": 1,
		"bases": [true, false, true],
		"max_innings": 3,
		"batter": batter,
		"pitcher": pitcher,
		"defensive_roster": {}
	})
	assert(plan.seeds.has("pitch"))
	assert(plan.seeds.has("contact"))
	assert(plan.seeds.has("defense"))
	assert(plan.seeds.has("steal"))
	assert(plan.has("situation"))
	assert(plan.situation.has("pitch_aggression"))
	var a := planner.rng_for("contact").randi()
	var b := planner.rng_for("contact").randi()
	assert(a == b)
	assert(planner.describe_preparation().ready)
	print("Decision planner structural test prepared.")
