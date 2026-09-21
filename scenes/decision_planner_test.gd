extends Node

func _ready() -> void:
	var planner := BaseballDecisionPlanner.new(12345)
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
		"bases": [true, false, true]
	})
	assert(plan.seeds.has("pitch"))
	assert(plan.seeds.has("contact"))
	assert(plan.seeds.has("defense"))
	assert(plan.seeds.has("steal"))
	var a := planner.rng_for("contact").randi()
	var b := planner.rng_for("contact").randi()
	assert(a == b)
	assert(planner.describe_preparation().ready)
	print("Decision planner structural test prepared.")
