extends Node2D

var ball_controller: BaseballBallController
var play_event: FieldingPlayEvent
var label: Label
var elapsed := 0.0
var started := false

func _ready() -> void:
	ball_controller = BaseballBallController.new()
	add_child(ball_controller)

	var batted := BattedBallEvent.new()
	batted.result = "FIELDING_CANDIDATE"
	batted.timing = "GOOD"
	batted.seed = 424242
	batted.origin = Vector2(1040, 430)
	batted.target = Vector2(690, 315)
	batted.control = Vector2(810, 230)
	batted.duration = 0.7
	batted.arc_height = 34.0
	batted.contact_quality = 0.32

	play_event = FieldingPlayEvent.from_resolution(
		batted,
		{
			"success": false,
			"final_result": "SINGLE",
			"bases": 1,
			"defender_position": "2B"
		}
	)

	label = Label.new()
	label.position = Vector2(40, 35)
	label.text = "FIELDING PLAY TEST\nSPACE: replay   R: new rebound seed\nRebotes + recogida + lanzamiento a 1B"
	add_child(label)

	_start_demo(batted)

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_SPACE:
			_replay()
		elif event.keycode == KEY_R:
			play_event.seed += 1
			_rebuild_event()
			_replay()

func _process(delta: float) -> void:
	elapsed += delta
	if started and elapsed > 2.8:
		started = false

func _start_demo(batted: BattedBallEvent) -> void:
	started = true
	elapsed = 0.0
	ball_controller.play_fielding_play(batted, play_event)

func _replay() -> void:
	var batted := BattedBallEvent.new()
	batted.result = "FIELDING_CANDIDATE"
	batted.timing = "GOOD"
	batted.seed = play_event.seed - 701
	batted.origin = Vector2(1040, 430)
	batted.target = Vector2(690, 315)
	batted.control = Vector2(810, 230)
	batted.duration = 0.7
	batted.contact_quality = 0.32
	_start_demo(batted)

func _rebuild_event() -> void:
	var batted := BattedBallEvent.new()
	batted.result = "FIELDING_CANDIDATE"
	batted.seed = play_event.seed - 701
	batted.origin = Vector2(1040, 430)
	batted.target = Vector2(690, 315)
	batted.duration = 0.7
	play_event = FieldingPlayEvent.from_resolution(
		batted,
		{
			"success": false,
			"final_result": "SINGLE",
			"bases": 1,
			"defender_position": "2B"
		}
	)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 720), Color("162019"))
	draw_rect(Rect2(40, 270, 1200, 410), Color("315d36"))
	draw_circle(Vector2(1050, 500), 12, Color.WHITE)
	draw_circle(Vector2(810, 260), 12, Color.WHITE)
	draw_circle(Vector2(550, 260), 12, Color.WHITE)
	draw_circle(Vector2(790, 500), 12, Color.WHITE)

	if play_event != null:
		for point in play_event.rebound_points:
			draw_circle(point, 7, Color("e4c45f"))
			draw_arc(point, 16, 0, TAU, 18, Color(1, 1, 1, 0.25), 2.0)
		draw_circle(play_event.throw_target, 8, Color("8cc9ff"))
		draw_line(play_event.pickup_point, play_event.throw_target, Color(0.85, 0.85, 0.95, 0.35), 2.0)
