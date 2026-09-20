class_name GameHUD
extends CanvasLayer

var score_label: Label
var state_label: Label
var result_label: Label
var instruction_label: Label
var pitch_label: Label
var timing_bar: ProgressBar
var roles_label: Label

func setup() -> void:
	var title := Label.new()
	title.position = Vector2(24, 18)
	title.text = "BASEBALL WAIFUS • PROTOTYPE"
	title.add_theme_font_size_override("font_size", 26)
	add_child(title)

	score_label = Label.new()
	score_label.position = Vector2(24, 58)
	score_label.add_theme_font_size_override("font_size", 22)
	add_child(score_label)

	state_label = Label.new()
	state_label.position = Vector2(24, 98)
	state_label.add_theme_font_size_override("font_size", 18)
	add_child(state_label)

	pitch_label = Label.new()
	pitch_label.position = Vector2(24, 135)
	pitch_label.add_theme_font_size_override("font_size", 18)
	add_child(pitch_label)

	result_label = Label.new()
	result_label.position = Vector2(24, 175)
	result_label.add_theme_font_size_override("font_size", 24)
	add_child(result_label)

	instruction_label = Label.new()
	instruction_label.position = Vector2(24, 610)
	instruction_label.add_theme_font_size_override("font_size", 18)
	add_child(instruction_label)

	timing_bar = ProgressBar.new()
	timing_bar.position = Vector2(24, 220)
	timing_bar.size = Vector2(420, 28)
	timing_bar.show_percentage = false
	add_child(timing_bar)

	roles_label = Label.new()
	roles_label.position = Vector2(24, 255)
	roles_label.add_theme_font_size_override("font_size", 16)
	add_child(roles_label)

func update_state(state: BaseballGameState, phase: String, pitch: Pitch) -> void:
	score_label.text = "YOU %d   |   RIVAL %d     INNING %d/%d   %s" % [state.score[0], state.score[1], state.inning, state.max_innings, "TOP" if state.half == 0 else "BOTTOM"]
	state_label.text = "OUTS %d   STRIKES %d   BALLS %d     BASES %s" % [state.outs, state.strikes, state.balls, str(state.bases)]
	pitch_label.text = "Pitch: " + pitch.name if pitch else ""
	instruction_label.text = phase

func show_timing(v: float) -> void:
	timing_bar.value = v * 100.0

func show_match_roles(team_name: String, batter_name: String, pitcher_name: String) -> void:
	roles_label.text = "%s • Batea: %s • Pitcher: %s" % [team_name, batter_name, pitcher_name]

func show_result(result: Dictionary) -> void:
	var text := "%s • %s" % [result.get("result", ""), result.get("timing", "")]
	var fielding: Dictionary = result.get("fielding", {})
	if not fielding.is_empty():
		var defender := str(fielding.get("defender_position", "FIELD"))
		var reason := str(fielding.get("reason", ""))
		var chance := int(float(fielding.get("chance", 0.0)) * 100.0)
		text += " • %s %s %d%%" % [defender, reason, chance]
	var throw_error: Dictionary = fielding.get("throwing_error", {})
	if bool(throw_error.get("error", false)):
		text += " • THROW ERROR"
	var double_play: Dictionary = fielding.get("double_play", {})
	if bool(double_play.get("success", false)):
		text += " • ASSIST %s → %s" % [str(double_play.get("assist_position", "?")), str(double_play.get("putout_position", "1B"))]
	result_label.text = text

func clear_result() -> void:
	result_label.text = ""
