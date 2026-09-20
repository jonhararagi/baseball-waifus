extends Node2D

func _ready() -> void:
	var team := DemoTeamFactory.create_player_team()
	var state := BaseballGameState.new()

	var batter0 := team.batting_player(0)
	var first := team.batting_player(1)
	var second := team.batting_player(2)

	var first_token := RunnerToken.from_player(first, team.team_id)
	var second_token := RunnerToken.from_player(second, team.team_id)
	state.base_runners = [first_token, second_token, null]
	state.bases = [true, true, false]

	var hit_plan := state.apply_hit(batter0, team.team_id, 1)
	assert(state.base_runners[1] != null)
	assert(state.base_runners[2] != null)
	assert(hit_plan["plan"].size() == 3)
	assert(state.score[0] == 0)
	assert(state.current_batter_index() == 0)

	state.advance_lineup()
	assert(state.current_batter_index() == 1)

	state.base_runners[0] = first_token
	state.base_runners[1] = second_token
	state.base_runners[2] = null
	state.bases = [true, true, false]
	state.outs = 1
	state.remove_base_runner(0)
	state.add_outs(2)
	assert(state.outs == 0)
	assert(state.half == 1)

	print("MATCH SYSTEM TEST OK")
	get_tree().quit()
