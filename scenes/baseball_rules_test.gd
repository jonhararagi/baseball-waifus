extends Node

func _ready() -> void:
	_test_timing_labels()
	_test_pitch_probability_bounds()
	_test_walk_forces_runners()
	_test_walk_with_empty_first()
	_test_lineup_advances_for_original_batting_team()
	print("BASEBALL RULES TEST OK")
	get_tree().quit()

func _make_player(id: String, contact := 50, control := 50, defense := 50) -> PlayerData:
	var player := PlayerData.new()
	player.id = id
	player.display_name = id
	player.position = "CF"
	player.element = "fire"
	player.contact = contact
	player.control = control
	player.defense = defense
	player.potential = 3
	return player

func _test_timing_labels() -> void:
	var simulator := BaseballSimulator.new()
	assert(simulator.timing_label(0.95) == "PERFECT")
	assert(simulator.timing_label(0.85) == "GREAT")
	assert(simulator.timing_label(0.70) == "GOOD")
	assert(simulator.timing_label(0.50) == "NORMAL")
	assert(simulator.timing_label(0.49) == "BAD")

func _test_pitch_probability_bounds() -> void:
	var simulator := BaseballSimulator.new()
	var pitcher := _make_player("pitcher", 50, 100, 50)
	var fastball := Pitch.create(Pitch.Type.FASTBALL)
	var curve := Pitch.create(Pitch.Type.CURVE)
	assert(simulator.pitch_in_zone_probability(pitcher, fastball) <= 0.96)
	assert(simulator.pitch_in_zone_probability(pitcher, curve) >= 0.65)

func _test_walk_forces_runners() -> void:
	var state := BaseballGameState.new()
	var batter := _make_player("batter")
	var first := _make_player("first")
	var second := _make_player("second")
	var third := _make_player("third")
	state.base_runners = [
		RunnerToken.from_player(first, "team"),
		RunnerToken.from_player(second, "team"),
		RunnerToken.from_player(third, "team")
	]
	state._refresh_base_flags()
	state.balls = 3
	var result := state.apply_ball(batter, "team")
	assert(bool(result.get("walk", false)))
	assert(int(result.get("runs", 0)) == 1)
	assert(state.base_runners[0].player_id == "batter")
	assert(state.base_runners[1].player_id == "first")
	assert(state.base_runners[2].player_id == "second")
	assert(state.score[0] == 1)
	assert(state.balls == 0)

func _test_walk_with_empty_first() -> void:
	var state := BaseballGameState.new()
	var batter := _make_player("batter")
	var second := _make_player("second")
	state.base_runners = [null, RunnerToken.from_player(second, "team"), null]
	state._refresh_base_flags()
	state.balls = 3
	var result := state.apply_ball(batter, "team")
	assert(bool(result.get("walk", false)))
	assert(int(result.get("runs", 0)) == 0)
	assert(state.base_runners[0].player_id == "batter")
	assert(state.base_runners[1].player_id == "second")
	assert(state.balls == 0)

func _test_lineup_advances_for_original_batting_team() -> void:
	var state := BaseballGameState.new()
	state.batting_indices = [4, 7]
	var original_half := state.half
	state.add_outs(2)
	assert(state.half == 0)
	assert(state.batting_indices[0] == 4)
	state.add_out()
	assert(state.half == 1)
	state.advance_lineup(original_half)
	assert(state.batting_indices[0] == 5)
	assert(state.batting_indices[1] == 7)
