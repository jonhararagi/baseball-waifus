extends Node

func _ready() -> void:
	_test_force_out()
	_test_game_state_force_out()
	_test_force_chain_preservation()
	_test_rundown_and_slide()
	_test_reception_error_event()
	_test_equipment_effective_stats_in_defense_and_runner()
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

func _test_game_state_force_out() -> void:
	var state := BaseballGameState.new()
	var runner := _runner(50.0)
	state.base_runners[0] = runner
	var batter := PlayerData.new()
	batter.id = "batter"
	batter.display_name = "Batter"
	var result := state.apply_force_out(0, batter, "home")
	assert(bool(result.get("applied", false)))
	assert(state.base_runners[0] != null)
	assert(state.base_runners[0].player_id == "batter")
	assert(result.runner_out.player_id == runner.player_id)


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


func _test_force_chain_preservation() -> void:
	var state := BaseballGameState.new()
	var first := _runner(40.0)
	var second := _runner(50.0)
	var third := _runner(60.0)
	state.base_runners = [first, second, third]
	var batter := PlayerData.new()
	batter.id = "batter_chain"
	var result := state.apply_force_out(2, batter, "home")
	assert(bool(result.get("applied", false)))
	assert(result.runner_out.player_id == third.player_id)
	assert(state.base_runners[0] != null)
	assert(state.base_runners[0].player_id == batter.id)
	assert(state.base_runners[1] != null)
	assert(state.base_runners[1].player_id == first.player_id)
	assert(state.base_runners[2] != null)
	assert(state.base_runners[2].player_id == second.player_id)
	assert(state.validate_invariants("force_chain").valid)


func _test_equipment_effective_stats_in_defense_and_runner() -> void:
	var progress := PlayerProgressStore.new()
	progress.load_state()
	var roster := CharacterRosterStore.new()
	roster.load_state()
	var progress_snapshot := progress.snapshot()
	var roster_snapshot := roster.snapshot()
	var character_id := "bw001"
	var player := CharacterArchetypeCatalog.create_player(character_id)
	if not roster.has_character(character_id):
		assert(bool(roster.ensure_character(player).get("ok", false)))
	assert(bool(progress.add_equipment("skirt_r_01", 1).get("ok", false)))
	assert(bool(progress.add_equipment("gloves_r_01", 1).get("ok", false)))
	var equipment_service := EquipmentService.new()
	assert(bool(equipment_service.equip(character_id, "skirt_r_01", progress, roster).get("ok", false)))
	assert(bool(equipment_service.equip(character_id, "gloves_r_01", progress, roster).get("ok", false)))
	var equipped_player := roster.get_player(character_id)
	var field_event := BattedBallEvent.new()
	field_event.result = "FIELDING_CANDIDATE"
	field_event.target = Vector2(620, 315)
	field_event.origin = Vector2(1040, 430)
	field_event.contact_quality = 0.75
	var fielding := FieldingResolver.new()
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	var equipped_result := fielding.resolve(field_event, {"SS": equipped_player}, 0.90, [], 0, rng, roster)
	var expected_defense := float(equipped_player.defense + 2)
	assert(abs(float(equipped_result.get("defense_score", 0.0)) - (expected_defense / 120.0)) < 0.0001)
	var runner := RunnerToken.from_player(equipped_player)
	var defensive_runner := DefensiveRunnerResolver.new()
	var runner_rng := RandomNumberGenerator.new()
	runner_rng.seed = 11
	var runner_result := defensive_runner.resolve({"success": true, "defender_position": "SS", "defense_score": 0.90, "double_play": {}}, [runner, null, null], 0, runner_rng, roster)
	var expected_speed := float(equipped_player.speed + 2)
	var expected_chance := clamp(0.30 + 0.90 * 0.34 - expected_speed / 500.0 + 0.05, 0.22, 0.84)
	assert(abs(float(runner_result.get("force_out_chance", 0.0)) - expected_chance) < 0.0001)
	assert(progress.restore_snapshot(progress_snapshot))
	assert(roster.restore_snapshot(roster_snapshot))
