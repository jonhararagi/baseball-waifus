extends Node2D

const BALL_START := Vector2(610, 350)
const BATTER_POS := Vector2(1040, 430)
const CATCHER_POS := Vector2(1035, 485)
const TIMING_WINDOW_SECONDS := 1.0

var simulator := BaseballSimulator.new()
var state := BaseballGameState.new()
var ai := OpponentAI.new()
var decision_planner := BaseballDecisionPlanner.new()
var runner_system := RunnerSystem.new()
var fielding_resolver := FieldingResolver.new()
var throw_resolver := ThrowResolver.new()
var defensive_runner_resolver := DefensiveRunnerResolver.new()
var skill_state := BaseballSkillState.new()
var rng := RandomNumberGenerator.new()

var avatar_presenter: AvatarMatchPresenter
var field_avatar_presenter: BaseballFieldAvatarPresenter
var ball_controller: BaseballBallController

var player_team: BaseballTeamData
var rival_team: BaseballTeamData
var batter: PlayerData
var pitcher: PlayerData
var defensive_roster: Dictionary
var character_roster := CharacterRosterStore.new()

var current_pitch: Pitch
var pitch_elapsed := 0.0
var timing_value := 0.0
var timing_direction := 1.0
var timing_elapsed := 0.0
var phase := "PITCH_SELECT"
var result_timer := 0.0
var current_result := {}
var message := ""
var active_role_signature := ""
var pitch_select_elapsed := 0.0
var input_router: MobileInputRouter
var mobile_controls: MobileControls
var platform_bridge: PlatformBridge
var charm_store: CharmStateStore
var charm_panel: CharmPanel

func _ready() -> void:
	rng.randomize()
	character_roster.load_state()
	_build_demo_roster()

	avatar_presenter = AvatarMatchPresenter.new()
	add_child(avatar_presenter)

	field_avatar_presenter = BaseballFieldAvatarPresenter.new()
	add_child(field_avatar_presenter)

	ball_controller = BaseballBallController.new()
	add_child(ball_controller)
	ball_controller.ball_position = BALL_START

	input_router = MobileInputRouter.new()
	add_child(input_router)
	input_router.swing_requested.connect(_swing)
	input_router.steal_requested.connect(_attempt_steal)

	mobile_controls = MobileControls.new()
	add_child(mobile_controls)
	mobile_controls.swing_requested.connect(input_router.request_swing)
	mobile_controls.steal_requested.connect(input_router.request_steal)
	var small_screen := get_viewport().get_visible_rect().size.x < 900.0
	mobile_controls.set_mobile_active(OS.has_feature("mobile") or small_screen)

	platform_bridge = PlatformBridge.new()
	add_child(platform_bridge)
	platform_bridge.initialize()
	platform_bridge.set_fullscreen()

	var hud := GameHUD.new()
	add_child(hud)
	hud.setup()
	$HUDRef.set_meta("hud", hud)

	charm_store = CharmStateStore.new()
	charm_store.load_state()
	charm_panel = CharmPanel.new()
	add_child(charm_panel)
	charm_panel.setup(charm_store)

	_sync_match_roles()
	decision_planner.set_seed(rng.randi())
	queue_redraw()

func _build_demo_roster() -> void:
	player_team = DemoTeamFactory.create_player_team()
	rival_team = DemoTeamFactory.create_rival_team()
	for player in player_team.players:
		if player != null:
			character_roster.ensure_character(player)

func _team_for_batting() -> BaseballTeamData:
	return player_team if state.team_batting() == 0 else rival_team

func _team_for_fielding() -> BaseballTeamData:
	return rival_team if state.team_batting() == 0 else player_team

func _sync_match_roles(force := false) -> void:
	var batting_team := _team_for_batting()
	var fielding_team := _team_for_fielding()
	if batting_team == null or fielding_team == null:
		return

	batter = batting_team.batting_player(state.current_batter_index())
	pitcher = fielding_team.pitcher()
	defensive_roster = fielding_team.defensive_roster()

	if batter == null or pitcher == null:
		return

	var signature := "%d:%s:%s" % [state.half, batter.id, pitcher.id]
	if not force and signature == active_role_signature:
		return
	active_role_signature = signature

	avatar_presenter.setup(batter, pitcher)
	field_avatar_presenter.setup(defensive_roster)
	field_avatar_presenter.set_runner_players(_build_runner_player_lookup())
	field_avatar_presenter.sync_runners(state.base_runners)

func _build_runner_player_lookup() -> Dictionary:
	var lookup := {}
	for team in [player_team, rival_team]:
		if team == null:
			continue
		for player in team.players:
			if player != null:
				lookup[player.id] = player
	return lookup

func _process(delta: float) -> void:
	if mobile_controls != null:
		mobile_controls.set_swing_enabled(phase == "TIMING")
		var has_runner := state.base_runners[0] != null or state.base_runners[1] != null or state.base_runners[2] != null
		mobile_controls.set_steal_visible(phase == "PITCH_SELECT" and has_runner)

	if state.game_over:
		if avatar_presenter != null:
			avatar_presenter.on_game_over(state.winner)
		_update_hud()
		queue_redraw()
		return

	match phase:
		"PITCH_SELECT":
			pitch_select_elapsed += delta
			if pitch_select_elapsed >= 1.0:
				_start_pitch()
		"PITCHING":
			_update_pitch(delta)
		"TIMING":
			_update_timing(delta)
		"RESULT":
			result_timer -= delta
			if result_timer <= 0.0:
				current_result = {}
				message = ""
				phase = "PITCH_SELECT"
				pitch_select_elapsed = 0.0
				_get_hud().clear_result()

	_update_hud()
	queue_redraw()

func _start_pitch() -> void:
	pitch_select_elapsed = 0.0
	_sync_match_roles()
	decision_planner.prepare_plate_appearance({
		"batter_id": batter.id if batter else "",
		"pitcher_id": pitcher.id if pitcher else "",
		"inning": state.inning,
		"half": state.half,
		"outs": state.outs,
		"balls": state.balls,
		"strikes": state.strikes,
		"score_batting": state.score[state.team_batting()],
		"score_fielding": state.score[1 - state.team_batting()],
		"bases": [
			state.base_runners[0] != null,
			state.base_runners[1] != null,
			state.base_runners[2] != null
		]
	})
	if state.team_batting() == 1:
		var ai_skill := ai.maybe_use_offensive_skill(batter, pitcher, {"phase": "pitch"}, skill_state)
		if bool(ai_skill.get("used", false)):
			message = "AI skill: " + str(ai_skill.get("skill_id", ""))
	var pitch_rng := decision_planner.rng_for("pitch")
	current_pitch = Pitch.create(ai.choose_pitch(pitcher, state.strikes, state.balls, pitch_rng))
	pitch_elapsed = 0.0
	phase = "PITCHING"
	_get_hud().clear_result()
	avatar_presenter.on_pitch_selected()
	field_avatar_presenter.on_pitch()
	ball_controller.play_pitch(BALL_START, BATTER_POS, 1.55 / current_pitch.speed, current_pitch.break_amount)

func _update_pitch(delta: float) -> void:
	pitch_elapsed += delta
	if pitch_elapsed < 1.55 / current_pitch.speed:
		return

	var pitch_result := simulator.resolve_pitch(pitcher, current_pitch, rng, skill_state)
	if str(pitch_result.get("result", "")) == "BALL":
		_finish_ball(pitch_result)
		return

	phase = "TIMING"
	timing_value = 0.0
	timing_direction = 1.0
	timing_elapsed = 0.0
	ball_controller.stop()
	avatar_presenter.on_timing_started()

func _update_timing(delta: float) -> void:
	timing_elapsed += delta
	timing_value += delta * timing_direction * 1.25
	if timing_value >= 1.0:
		timing_value = 1.0
		timing_direction = -1.0
	elif timing_value <= 0.0:
		timing_value = 0.0
		timing_direction = 1.0
	_get_hud().show_timing(timing_value)

	if timing_elapsed >= TIMING_WINDOW_SECONDS:
		_finish_called_strike()

func _finish_ball(pitch_result: Dictionary) -> void:
	var batting_team_index := state.team_batting()
	var current_batter := batter
	var ball_plan := state.apply_ball(current_batter, _team_for_batting().team_id)
	current_result = pitch_result.duplicate()
	current_result["result"] = "WALK" if bool(ball_plan.get("walk", false)) else "BALL"
	current_result["balls"] = 4 if bool(ball_plan.get("walk", false)) else state.balls
	current_result["runs_scored"] = int(ball_plan.get("runs", 0))
	current_result["hit_plan"] = ball_plan
	current_result["batting_team"] = batting_team_index
	if bool(ball_plan.get("walk", false)):
		state.advance_lineup(batting_team_index)

	ball_controller.stop()
	ball_controller.play_miss_to_catcher(BATTER_POS, CATCHER_POS)
	avatar_presenter.on_batting_result(current_result)
	if bool(ball_plan.get("walk", false)):
		field_avatar_presenter.animate_hit(ball_plan["plan"], ball_plan["after_runners"], current_batter)
	else:
		field_avatar_presenter.sync_runners(state.base_runners)
	_get_hud().show_result(current_result)
	phase = "RESULT"
	result_timer = 1.5

func _finish_called_strike() -> void:
	if phase != "TIMING":
		return
	var batting_team_index := state.team_batting()
	current_result = {"result": "STRIKE", "bases": 0, "timing": "BAD", "called_strike": true}
	state.strikes += 1
	if state.strikes >= 3:
		state.add_out()
		state.advance_lineup(batting_team_index)
	_get_hud().show_result(current_result)
	avatar_presenter.on_batting_result(current_result)
	ball_controller.play_miss_to_catcher(BATTER_POS, CATCHER_POS)
	phase = "RESULT"
	result_timer = 1.2

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch and event.pressed:
		if mobile_controls != null:
			mobile_controls.set_mobile_active(true)
		return

	if input_router == null:
		return

	if event is InputEventKey and event.pressed and event.keycode == KEY_C:
		if charm_panel != null:
			charm_panel.toggle()
		return

	if event is InputEventKey and event.pressed and event.keycode == KEY_SPACE and phase == "TIMING":
		input_router.request_swing()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT and phase == "TIMING":
		input_router.request_swing()
	elif event is InputEventKey and event.pressed and event.keycode == KEY_S and phase == "PITCH_SELECT":
		input_router.request_steal()

func _swing() -> void:
	if phase != "TIMING":
		return
	var contact_rng := decision_planner.rng_for("contact")
	var preliminary_result := simulator.resolve_batted_ball(batter, pitcher, current_pitch, timing_value, contact_rng, skill_state)
	var ball_event := BattedBallEvent.from_result(preliminary_result, BATTER_POS, rng.randi())
	var fielding_result: Dictionary = {}
	var fielding_play: FieldingPlayEvent = null

	if str(preliminary_result.get("result", "")) == "FIELDING_CANDIDATE":
		if state.team_batting() == 0:
			var ai_defense_skill := ai.maybe_use_defense_skill(
				defensive_roster,
				state.base_runners,
				state.outs,
				{"phase": "defense"},
				skill_state
			)
			if bool(ai_defense_skill.get("used", false)):
				message = "AI skill: " + str(ai_defense_skill.get("skill_id", ""))
		fielding_result = fielding_resolver.resolve(
			ball_event,
			defensive_roster,
			timing_value,
			state.base_runners,
			state.outs,
			decision_planner.rng_for("defense"),
			character_roster,
			skill_state
		)
		current_result = preliminary_result.duplicate()
		current_result["result"] = str(fielding_result.get("final_result", "SINGLE"))
		current_result["bases"] = int(fielding_result.get("bases", 1))
		current_result["fielding"] = fielding_result

		if not bool(fielding_result.get("double_play", {}).get("success", false)):
			var runner_play := defensive_runner_resolver.resolve(
				fielding_result,
				state.base_runners,
				state.outs,
				rng,
				character_roster,
				skill_state
			)
			current_result["fielding"]["runner_play"] = runner_play
			if str(runner_play.get("final_result", "")) == "FORCE OUT" or str(runner_play.get("final_result", "")) == "RUNDOWN OUT":
				current_result["result"] = str(runner_play["final_result"])

		var double_play: Dictionary = fielding_result.get("double_play", {})
		if bool(double_play.get("success", false)):
			fielding_play = FieldingPlayEvent.from_resolution(ball_event, fielding_result)
		elif not bool(fielding_result.get("success", false)) and str(fielding_result.get("reason", "")) == "FIELDING MISS":
			fielding_play = FieldingPlayEvent.from_resolution(ball_event, fielding_result)
			var defender: PlayerData = defensive_roster.get(str(fielding_result.get("defender_position", "")))
			var receiver: PlayerData = defensive_roster.get(fielding_play.receiver_position)
			var throw_result := throw_resolver.resolve(fielding_play, defender, receiver, rng, character_roster, skill_state)
			current_result["fielding"]["throwing_error"] = throw_result
			if bool(throw_result.get("error", false)):
				current_result["result"] = "FIELDING ERROR"
				current_result["bases"] = min(int(current_result["bases"]) + 1, 4)
		current_result["fielding_play"] = fielding_play

	_apply_batting_result(current_result)
	skill_state.consume_action()
	ai.tick_action()

	if str(current_result.get("result", "")) == "STRIKE":
		ball_controller.play_miss_to_catcher(BATTER_POS, CATCHER_POS)
	elif fielding_play != null:
		ball_controller.play_fielding_play(ball_event, fielding_play)
	else:
		ball_controller.play_batted_event(ball_event)

	avatar_presenter.on_batting_result(current_result)
	field_avatar_presenter.on_batted_ball_event(ball_event)

	if not fielding_result.is_empty():
		field_avatar_presenter.on_fielding_resolution(ball_event, fielding_result)
		var runner_play_for_presentation: Dictionary = fielding_result.get("runner_play", {})
		if not runner_play_for_presentation.is_empty():
			field_avatar_presenter.on_defensive_runner_play(
				runner_play_for_presentation,
				state.base_runners
			)
		if fielding_play != null:
			field_avatar_presenter.on_fielding_play(ball_event, fielding_play)

	if current_result.has("hit_plan"):
		var hit_data: Dictionary = current_result["hit_plan"]
		field_avatar_presenter.animate_hit(hit_data["plan"], hit_data["after_runners"], batter)
	else:
		field_avatar_presenter.sync_runners(state.base_runners)

	_get_hud().show_result(current_result)
	phase = "RESULT"
	result_timer = 2.0 if fielding_play != null else 1.2

func _apply_batting_result(result: Dictionary) -> void:
	var result_name := str(result.get("result", ""))
	var batting_team_index := state.team_batting()
	match result_name:
		"STRIKE":
			state.strikes += 1
			if state.strikes >= 3:
				state.add_out()
				state.advance_lineup(batting_team_index)
		"FOUL":
			if state.strikes < 2:
				state.strikes += 1
		"OUT":
			state.add_out()
			state.advance_lineup(batting_team_index)
		"DOUBLE PLAY":
			var double_play: Dictionary = result.get("fielding", {}).get("double_play", {})
			if bool(double_play.get("success", false)):
				state.remove_base_runner(0)
				state.add_outs(2)
				state.advance_lineup(batting_team_index)
		"FORCE OUT":
			var runner_play: Dictionary = result.get("fielding", {}).get("runner_play", {})
			var force_index := int(runner_play.get("force_runner_index", -1))
			var force_data := state.apply_force_out(force_index, batter, _team_for_batting().team_id)
			if bool(force_data.get("applied", false)):
				result["runner_play_state"] = force_data
				state.add_out()
				state.advance_lineup(batting_team_index)
		"RUNDOWN OUT":
			var rundown_play: Dictionary = result.get("fielding", {}).get("runner_play", {})
			var rundown_index := int(rundown_play.get("rundown_runner_index", -1))
			var rundown_data := state.apply_rundown_out(rundown_index)
			if bool(rundown_data.get("applied", false)):
				result["runner_play_state"] = rundown_data
				state.add_out()
				state.advance_lineup(batting_team_index)
		"SAFE":
			result["runner_play_state"] = result.get("fielding", {}).get("runner_play", {}).get("slide", {})
		"SINGLE", "DOUBLE", "TRIPLE", "HOME RUN", "FIELDING ERROR":
			var hit_data := state.apply_hit(batter, _team_for_batting().team_id, int(result.get("bases", 1)))
			result["hit_plan"] = hit_data
			result["runs_scored"] = hit_data["runs"]
			# BaseballGameState.apply_hit owns the score mutation. The main flow still clears the count.
			state.reset_count()

			state.advance_lineup(batting_team_index)

func _attempt_steal() -> void:
	var from_index := 2
	while from_index >= 0 and state.base_runners[from_index] == null:
		from_index -= 1

	if from_index < 0:
		message = "No runner available."
		phase = "RESULT"
		result_timer = 0.8
		return

	avatar_presenter.on_steal_started()
	field_avatar_presenter.on_steal_started(from_index)

	var source_runner: RunnerToken = state.base_runners[from_index]
	if state.team_batting() == 1:
		var ai_runner_player := character_roster.get_player(source_runner.player_id)
		if ai_runner_player != null:
			var ai_runner_skill := ai.maybe_use_runner_skill(ai_runner_player, {"phase": "baserunning"}, skill_state)
			if bool(ai_runner_skill.get("used", false)):
				message = "AI skill: " + str(ai_runner_skill.get("skill_id", ""))
	var steal_modifier := skill_state.get_action_modifier(source_runner.player_id, "steal")
	var result := runner_system.attempt_steal(source_runner.speed, pitcher.effective_stat("defense"), steal_modifier, decision_planner.rng_for("steal"))
	message = result.result
	var movement := state.move_runner_on_steal(from_index, result.success)

	var blocked := bool(movement.get("blocked", false))
	if not result.success and not blocked:
		state.add_out()

	var presentation_success := result.success and not blocked
	if presentation_success:
		skill_state.add_action_modifier(batter.id, "runner_batter_combo", 0.03, 2, "runner_batter_link_runtime")
	skill_state.consume_action()
	ai.tick_action()
	avatar_presenter.on_steal_result(presentation_success)
	var destination_base := int(movement.get("to", -1))
	field_avatar_presenter.on_steal_result(from_index, presentation_success, destination_base, state.base_runners)

	phase = "RESULT"
	current_result = {
		"result": "STEAL BLOCKED" if blocked else result.result,
		"timing": "%d%%" % int(result.chance * 100.0),
		"runner": source_runner.display_name,
		"blocked": blocked,
		"state_change": "NONE" if blocked else "OUT" if not result.success else "ADVANCE"
	}
	result_timer = 1.2
	_get_hud().show_result(current_result)

func _get_hud() -> GameHUD:
	return $HUDRef.get_meta("hud") as GameHUD

func _update_hud() -> void:
	var hud := _get_hud()
	if not hud:
		return
	var half_label := "TOP" if state.half == 0 else "BOTTOM"
	var batting_team := _team_for_batting()
	var batter_name := batter.display_name if batter else "-"
	var phase_text := "Preparando lanzamiento..."
	if phase == "PITCHING":
		phase_text = "La pelota viene..."
	elif phase == "TIMING":
		phase_text = "¡TIMING! ESPACIO o CLICK para batear. Bateadora: " + batter_name
	elif phase == "RESULT":
		phase_text = "Resultado: " + str(current_result.get("result", message))
	elif state.game_over:
		phase_text = "FIN DEL PARTIDO. " + ("GANASTE" if state.winner == 0 else "PERDISTE" if state.winner == 1 else "EMPATE")
	hud.update_state(state, phase_text, current_pitch)
	if batting_team != null:
		hud.show_match_roles(batting_team.team_name, batter_name, pitcher.display_name if pitcher else "-")

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 720), Color("17251b"))
	draw_rect(Rect2(40, 270, 1200, 410), Color("315d36"))

	var home := Vector2(1050, 500)
	var first := Vector2(810, 260)
	var second := Vector2(550, 260)
	var third := Vector2(790, 500)
	var diamond := PackedVector2Array([home, first, second, third])
	draw_colored_polygon(diamond, Color("a87855"))
	draw_line(home, first, Color("f1ead7"), 3)
	draw_line(first, second, Color("f1ead7"), 3)
	draw_line(second, third, Color("f1ead7"), 3)
	draw_line(third, home, Color("f1ead7"), 3)

	for base in [home, first, second, third]:
		draw_circle(base, 12, Color.WHITE)
