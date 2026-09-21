class_name GameHUD
extends CanvasLayer

var root: Control
var visual: GameHUDVisual

var title_label: Label
var score_label: Label
var inning_label: Label
var outs_label: Label
var count_label: Label
var pitch_label: Label
var phase_label: Label
var roles_label: Label
var result_label: Label
var timing_label: Label
var base_label: Label
var status_label: Label

func setup() -> void:
	layer = 80
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	visual = GameHUDVisual.new()
	root.add_child(visual)

	title_label = _make_label("BASEBALL WAIFUS", 24, Color(1.0, 0.86, 0.54))
	title_label.position = Vector2(42, 28)
	root.add_child(title_label)

	status_label = _make_label("LIVE", 13, Color(0.55, 1.0, 0.75))
	status_label.position = Vector2(44, 64)
	root.add_child(status_label)

	score_label = _make_label("YOU 0  •  0 RIVAL", 24, Color(0.98, 0.99, 1.0))
	score_label.position = Vector2(42, 55)
	root.add_child(score_label)

	inning_label = _make_label("1 / 3  •  TOP", 21, Color(0.75, 0.9, 1.0))
	inning_label.position = Vector2(0, 42)
	inning_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	inning_label.size = Vector2(220, 32)
	root.add_child(inning_label)
	inning_label.position.x = get_viewport().get_visible_rect().size.x * 0.43

	roles_label = _make_label("BATEADORA  •  PITCHER", 16, Color(0.91, 0.82, 1.0))
	roles_label.position = Vector2(get_viewport().get_visible_rect().size.x - 330, 28)
	roles_label.size = Vector2(300, 25)
	roles_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	root.add_child(roles_label)

	pitch_label = _make_label("Pitch", 14, Color(0.67, 0.72, 0.85))
	pitch_label.position = Vector2(get_viewport().get_visible_rect().size.x - 330, 56)
	pitch_label.size = Vector2(300, 28)
	pitch_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	root.add_child(pitch_label)

	outs_label = _make_label("OUTS 0", 16, Color(1.0, 0.72, 0.72))
	outs_label.position = Vector2(44, 112)
	root.add_child(outs_label)

	count_label = _make_label("STRIKE 0   BALL 0", 16, Color(0.72, 0.85, 1.0))
	count_label.position = Vector2(145, 112)
	root.add_child(count_label)

	base_label = _make_label("BASES  ◇  ◇  ◇", 15, Color(1.0, 0.88, 0.64))
	base_label.position = Vector2(340, 112)
	root.add_child(base_label)

	phase_label = _make_label("Preparando lanzamiento...", 18, Color(0.95, 0.97, 1.0))
	phase_label.position = Vector2(42, get_viewport().get_visible_rect().size.y - 132)
	phase_label.size = Vector2(get_viewport().get_visible_rect().size.x * 0.22, 56)
	phase_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(phase_label)

	timing_label = _make_label("TIMING", 15, Color(1.0, 0.84, 0.36))
	timing_label.position = Vector2(get_viewport().get_visible_rect().size.x * 0.28, get_viewport().get_visible_rect().size.y - 133)
	timing_label.size = Vector2(get_viewport().get_visible_rect().size.x * 0.44, 28)
	timing_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(timing_label)

	result_label = _make_label("", 22, Color(1.0, 0.98, 0.9))
	result_label.position = Vector2(42, 170)
	result_label.size = Vector2(get_viewport().get_visible_rect().size.x - 84, 44)
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(result_label)

func _make_label(text_value: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text_value
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.55))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	return label

func _resize_layout() -> void:
	if root == null:
		return
	var size := get_viewport().get_visible_rect().size
	inning_label.position.x = size.x * 0.43
	roles_label.position.x = size.x - 330.0
	pitch_label.position.x = size.x - 330.0
	phase_label.position.y = size.y - 132.0
	timing_label.position = Vector2(size.x * 0.28, size.y - 133.0)
	timing_label.size.x = size.x * 0.44
	result_label.size.x = size.x - 84.0

func _process(_delta: float) -> void:
	_resize_layout()

func update_state(state: BaseballGameState, phase: String, pitch: Pitch) -> void:
	var half := "TOP" if state.half == 0 else "BOTTOM"
	score_label.text = "YOU  %d   •   %d  RIVAL" % [state.score[0], state.score[1]]
	inning_label.text = "INNING  %d / %d   •   %s" % [state.inning, state.max_innings, half]
	outs_label.text = "OUTS  %d" % state.outs
	count_label.text = "STRIKE  %d    BALL  %d" % [state.strikes, state.balls]
	base_label.text = "BASES  ◇  ◇  ◇"
	pitch_label.text = "PITCH  •  " + (pitch.name if pitch else "PREPARANDO")
	phase_label.text = phase
	status_label.text = "● LIVE MATCH"
	status_label.add_theme_color_override("font_color", Color(0.46, 1.0, 0.72))

func show_timing(v: float) -> void:
	if visual:
		visual.set_timing(v, true)
	timing_label.text = "TIMING  •  PERFECT  |  GREAT  |  GOOD"

func show_match_roles(team_name: String, batter_name: String, pitcher_name: String) -> void:
	roles_label.text = "%s   •   BATEA: %s   •   LANZA: %s" % [team_name, batter_name, pitcher_name]

func show_result(result: Dictionary) -> void:
	var result_name := str(result.get("result", ""))
	var timing := str(result.get("timing", ""))
	var text := result_name
	if not timing.is_empty():
		text += "   •   " + timing
	var fielding: Dictionary = result.get("fielding", {})
	if not fielding.is_empty():
		var defender := str(fielding.get("defender_position", "FIELD"))
		var reason := str(fielding.get("reason", ""))
		if not reason.is_empty():
			text += "   •   %s %s" % [defender, reason]
	var throw_error: Dictionary = fielding.get("throwing_error", {})
	if bool(throw_error.get("error", false)):
		text += "   •   ERROR"
	var double_play: Dictionary = fielding.get("double_play", {})
	if bool(double_play.get("success", false)):
		text += "   •   DOUBLE PLAY"
	result_label.text = text
	if visual:
		visual.emphasize_result()

func clear_result() -> void:
	result_label.text = ""
	if visual:
		visual.clear_timing()
