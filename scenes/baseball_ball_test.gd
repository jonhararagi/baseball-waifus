extends Node2D

var ball: BaseballBallController
var event_index := 0
var elapsed := 0.0
var samples := [
	["PITCH", 1.2],
	["SINGLE", 1.0],
	["DOUBLE", 1.0],
	["TRIPLE", 1.1],
	["HOME RUN", 1.3],
	["FOUL", 0.8],
	["OUT", 0.9]
]

func _ready() -> void:
	var background := ColorRect.new()
	background.size = Vector2(1280, 720)
	background.color = Color("10161d")
	add_child(background)
	move_child(background, 0)

	ball = BaseballBallController.new()
	add_child(ball)

	var title := Label.new()
	title.position = Vector2(40, 35)
	title.text = "BASEBALL WAIFUS • BALL TRAJECTORY TEST"
	title.add_theme_font_size_override("font_size", 28)
	add_child(title)

	var help := Label.new()
	help.position = Vector2(40, 80)
	help.text = "SPACE: siguiente trayectoria\nESC: salir\nAuto: secuencia completa"
	help.add_theme_font_size_override("font_size", 18)
	add_child(help)

	queue_redraw()
	_play_current()

func _process(delta: float) -> void:
	elapsed += delta
	var current_duration: float = samples[event_index][1]
	if elapsed >= current_duration:
		elapsed = 0.0
		event_index = (event_index + 1) % samples.size()
		_play_current()

	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()
	if Input.is_key_pressed(KEY_SPACE):
		elapsed = 0.0
		event_index = (event_index + 1) % samples.size()
		_play_current()

	queue_redraw()

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_SPACE:
		elapsed = 0.0
		event_index = (event_index + 1) % samples.size()
		_play_current()

func _play_current() -> void:
	var kind := str(samples[event_index][0])
	match kind:
		"PITCH":
			ball.play_pitch(Vector2(360, 355), Vector2(900, 420), 0.9, 0.0)
		_:
			var result := {"result": kind, "timing": "TEST"}
			var event := BattedBallEvent.from_result(result, Vector2(900, 420), 5000 + event_index)
			ball.play_batted_event(event)

func _draw() -> void:
	draw_rect(Rect2(180, 180, 920, 460), Color("315d36"))
	var home := Vector2(900, 420)
	var first := Vector2(720, 255)
	var second := Vector2(510, 255)
	var third := Vector2(690, 420)
	draw_colored_polygon(PackedVector2Array([home, first, second, third]), Color("a87855"))
	for base in [home, first, second, third]:
		draw_circle(base, 12, Color.WHITE)

	var label := Label.new()
	label.position = Vector2(950, 90)
	label.text = "Trajectory: " + str(samples[event_index][0])
	label.add_theme_font_size_override("font_size", 22)
	add_child(label)
