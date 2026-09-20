extends Node2D

const BALL_START := Vector2(610, 350)
const BATTER_POS := Vector2(1040, 430)
const PITCHER_POS := Vector2(640, 370)

var simulator := BaseballSimulator.new()
var state := BaseballGameState.new()
var ai := OpponentAI.new()
var runner_system := RunnerSystem.new()
var rng := RandomNumberGenerator.new()
var avatar_presenter: AvatarMatchPresenter
var field_avatar_presenter: BaseballFieldAvatarPresenter
var avatar_game_over_handled := false

var batter: PlayerData
var pitcher: PlayerData
var current_pitch: Pitch
var ball_position := BALL_START
var ball_progress := 0.0
var pitch_elapsed := 0.0
var timing_value := 0.0
var timing_direction := 1.0
var phase := "PITCH_SELECT"
var result_timer := 0.0
var current_result := {}
var message := ""

func _ready() -> void:
	rng.randomize()
	_build_demo_roster()

	avatar_presenter = AvatarMatchPresenter.new()
	add_child(avatar_presenter)
	avatar_presenter.setup(batter, pitcher)

	field_avatar_presenter = BaseballFieldAvatarPresenter.new()
	add_child(field_avatar_presenter)
	field_avatar_presenter.setup(_build_demo_defensive_roster())
	field_avatar_presenter.sync_runners(state.bases)

	var hud := GameHUD.new()
	add_child(hud)
	hud.setup()
	$HUDRef.set_meta("hud", hud)
	queue_redraw()

func _build_demo_roster() -> void:
	batter = PlayerData.new()
	batter.id = "starter_ssr"
	batter.display_name = "Starter"
	batter.rarity = "SSR"
	batter.element = "fire"
	batter.position = "CF"
	batter.specialization = "power"
	batter.power = 78
	batter.contact = 68
	batter.speed = 58
	batter.defense = 55
	batter.critical = 24
	batter.stamina = 78
	batter.potential = 5

	pitcher = PlayerData.new()
	pitcher.id = "rival_sr"
	pitcher.display_name = "Rival Ace"
	pitcher.rarity = "SR"
	pitcher.element = "ice"
	pitcher.position = "P"
	pitcher.pitch = 70
	pitcher.control = 64
	pitcher.defense = 60
	pitcher.stamina = 75
	pitcher.potential = 4

func _build_demo_defensive_roster() -> Dictionary:
	var result := {}
	var definitions := {
		"C": ["demo_catcher", "Catcher", "catcher", "water"],
		"1B": ["demo_first_base", "First Base", "defender", "nature"],
		"2B": ["demo_second_base", "Second Base", "contact", "light"],
		"3B": ["demo_third_base", "Third Base", "power", "fire"],
		"SS": ["demo_shortstop", "Shortstop", "contact", "lightning"],
		"LF": ["demo_left_field", "Left Field", "defender", "ice"],
		"CF": ["demo_center_field", "Center Field", "runner", "nature"],
		"RF": ["demo_right_field", "Right Field", "power", "darkness"]
	}
	for position in definitions.keys():
		var values: Array = definitions[position]
		var player := PlayerData.new()
		player.id = str(values[0])
		player.display_name = str(values[1])
		player.position = str(position)
		player.specialization = str(values[2])
		player.element = str(values[3])
		player.rarity = "SR"
		player.level = 10
		player.potential = 4
		player.speed = 58
		player.contact = 60
		player.power = 62
		player.defense = 64
		player.stamina = 72
		result[position] = player
	var catcher: PlayerData = result["C"]
	catcher.defense = 70
	return result

func _process(delta: float) -> void:
	if state.game_over:
		if not avatar_game_over_handled and avatar_presenter != null:
			avatar_presenter.on_game_over(state.winner)
			avatar_game_over_handled = true
		_update_hud()
		queue_redraw()
		return

	match phase:
		"PITCH_SELECT":
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
				_get_hud().clear_result()

	_update_hud()
	queue_redraw()

func _start_pitch() -> void:
	current_pitch = Pitch.create(ai.choose_pitch(pitcher, state.strikes, state.balls))
	ball_position = BALL_START
	ball_progress = 0.0
	pitch_elapsed = 0.0
	phase = "PITCHING"
	_get_hud().clear_result()
	if avatar_presenter != null:
		avatar_presenter.on_pitch_selected()
	if field_avatar_presenter != null:
		field_avatar_presenter.on_pitch()

func _update_pitch(delta: float) -> void:
	pitch_elapsed += delta
	ball_progress = clamp(pitch_elapsed / (1.55 / current_pitch.speed), 0.0, 1.0)
	ball_position = BALL_START.lerp(BATTER_POS, ball_progress)
	if ball_progress >= 1.0:
		phase = "TIMING"
		timing_value = 0.0
		timing_direction = 1.0
		if avatar_presenter != null:
			avatar_presenter.on_timing_started()

func _update_timing(delta: float) -> void:
	timing_value += delta * timing_direction * 1.25
	if timing_value >= 1.0:
		timing_value = 1.0
		timing_direction = -1.0
	elif timing_value <= 0.0:
		timing_value = 0.0
		timing_direction = 1.0
	_get_hud().show_timing(timing_value)

func _input(event: InputEvent) -> void:
	if ((event is InputEventKey and event.pressed and event.keycode == KEY_SPACE) or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT)) and phase == "TIMING":
		_swing()
	elif event is InputEventKey and event.pressed and event.keycode == KEY_S and phase == "PITCH_SELECT":
		_attempt_steal()

func _swing() -> void:
	current_result = simulator.resolve_batted_ball(batter, pitcher, current_pitch, timing_value, rng)
	_apply_batting_result(current_result)
	if avatar_presenter != null:
		avatar_presenter.on_batting_result(current_result)
	if field_avatar_presenter != null:
		field_avatar_presenter.on_batted_ball(current_result)
		field_avatar_presenter.sync_runners(state.bases)
	_get_hud().show_result(current_result)
	phase = "RESULT"
	result_timer = 1.2

func _apply_batting_result(result: Dictionary) -> void:
	match result.result:
		"STRIKE":
			state.strikes += 1
			if state.strikes >= 3:
				state.add_out()
		"FOUL":
			if state.strikes < 2:
				state.strikes += 1
		"OUT":
			state.add_out()
		"SINGLE", "DOUBLE", "TRIPLE", "HOME RUN":
			var runs := state.advance_bases(int(result.bases))
			state.score[state.team_batting()] += runs
			state.reset_count()

func _attempt_steal() -> void:
	if not state.bases.has(true):
		message = "No runner available."
		phase = "RESULT"
		result_timer = 0.8
		return

	if avatar_presenter != null:
		avatar_presenter.on_steal_started()

	var from_index := 2
	while from_index >= 0 and not state.bases[from_index]:
		from_index -= 1
	if field_avatar_presenter != null:
		field_avatar_presenter.on_steal_started(from_index)
	var result := runner_system.attempt_steal(batter.speed, pitcher.defense)
	message = result.result

	if result.success:
		state.bases[from_index] = false
		if from_index == 2:
			state.score[state.team_batting()] += 1
		else:
			state.bases[from_index + 1] = true
	else:
		state.add_out()

	if avatar_presenter != null:
		avatar_presenter.on_steal_result(result.success)
	if field_avatar_presenter != null:
		var destination_base := from_index + 1 if result.success else -1
		if destination_base > 2:
			destination_base = -1
		field_avatar_presenter.on_steal_result(from_index, result.success, destination_base)
		field_avatar_presenter.sync_runners(state.bases, false)

	phase = "RESULT"
	current_result = {"result": result.result, "timing": "%d%%" % int(result.chance * 100.0)}
	result_timer = 1.2
	_get_hud().show_result(current_result)

func _get_hud() -> GameHUD:
	return $HUDRef.get_meta("hud") as GameHUD

func _update_hud() -> void:
	var hud := _get_hud()
	if not hud:
		return
	var phase_text := "Preparando lanzamiento..."
	if phase == "PITCHING":
		phase_text = "La pelota viene..."
	elif phase == "TIMING":
		phase_text = "¡TIMING! ESPACIO o CLICK para batear."
	elif phase == "RESULT":
		phase_text = "Resultado: " + str(current_result.get("result", message))
	elif state.game_over:
		phase_text = "FIN DEL PARTIDO. " + ("GANASTE" if state.winner == 0 else "PERDISTE" if state.winner == 1 else "EMPATE")
	hud.update_state(state, phase_text, current_pitch)

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

	if phase == "PITCHING" or phase == "TIMING":
		draw_circle(ball_position, 9, Color.WHITE)
