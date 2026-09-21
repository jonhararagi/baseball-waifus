extends Node

func _ready() -> void:
	_test_force_out()
	_test_rundown_and_slide()
	_test_reception_error_event()
	print("DEFENSIVE RULES TEST OK")
	get_tree().quit()

func _runner(speed: float) -> RunnerToken:
	var player := PlayerData.new()
	player.id = "runner_%d" % int(speed)
	player.display_name = "Runner"
	player.speed = speed
	return RunnerToken.from_player(player, "home")

func _test_force_out() -> void:
	var resolver := DefensiveRunnerResolver.new()
	var runners := [_runner(50.0), null, null]
	var rng := RandomNumberGenerator.new()
	rng.seed = 42
	var result := resolver.resolve(
		{
			"success": true,
			"defender_position": "SS",
			"defense_score": 0.90,
			"double_play": {}
		},
		runners,
		0,
		rng
	)
	assert(result.has("force_out_chance"))
	assert(float(result.force_out_chance) >= 0.22 and float(result.force_out_chance) <= 0.84)
	assert(result.has("slide"))
	assert(str(result.slide.get("style", "")) in ["HEADFIRST", "FEET_FIRST"])

func _test_rundown_and_slide() -> void:
	var resolver := DefensiveRunnerResolver.new()
	var found := false
	for seed in range(1, 5000):
		var rng := RandomNumberGenerator.new()
		rng.seed = seed
		var result := resolver.resolve(
			{
				"success": true,
				"defender_position": "SS",
				"defense_score": 0.90,
				"double_play": {}
			},
			[null, _runner(65.0), null],
			0,
			rng
		)
		if bool(result.get("rundown", false)):
			found = true
			assert(result.has("slide"))
			break
	assert(found)

func _test_reception_error_event() -> void:
	var resolver := FieldingResolver.new()
	var roster := DemoTeamFactory.create_rival_team().defensive_roster()
	var event := BattedBallEvent.new()
	event.result = "FIELDING_CANDIDATE"
	event.target = Vector2(700, 310)
	event.origin = Vector2(1040, 430)
	event.contact_quality = 0.75
	var found := false
	for seed in range(1, 10000):
		var rng := RandomNumberGenerator.new()
		rng.seed = seed
		var result := resolver.resolve(event, roster, 0.90, [], 0, rng)
		if bool(result.get("reception_error", {}).get("error", false)):
			found = true
			assert(str(result.get("final_result", "")) == "FIELDING ERROR")
			assert(str(result.get("reason", "")) == "RECEPTION ERROR")
			break
	assert(found)
