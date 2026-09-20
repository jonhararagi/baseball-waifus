extends Node2D

var resolver := FieldingResolver.new()
var ball: BaseballBallController
var defensive_roster: Dictionary
var event: BattedBallEvent
var rng := RandomNumberGenerator.new()
var status: Label
var defender_index := 0
var defenders := ["SS", "2B", "CF", "RF"]
var elapsed := 0.0
var last_resolution: Dictionary = {}

func _ready() -> void:
	defensive_roster = DemoTeamFactory.create_rival_team().defensive_roster()

	var background := ColorRect.new()
	background.size = Vector2(1280, 720)
	background.color = Color("10161d")
	add_child(background)
	move_child(background, 0)

	ball = BaseballBallController.new()
	add_child(ball)

	var title := Label.new()
	title.position = Vector2(40, 35)
	title.text = "BASEBALL WAIFUS • FIELDING TEST"
	title.add_theme_font_size_override("font_size", 28)
	add_child(title)

	status = Label.new()
	status.position = Vector2(40, 90)
	status.add_theme_font_size_override("font_size", 20)
	add_child(status)

	_play_trial()

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed >= 1.5:
		elapsed = 0.0
		defender_index = (defender_index + 1) % defenders.size()
		_play_trial()

	status.text = "Defender: %s\nResult: %s\nChance: %d%%\nReason: %s" % [
		defenders[defender_index],
		str(last_resolution.get("final_result", "")),
		int(float(last_resolution.get("chance", 0.0)) * 100.0),
		str(last_resolution.get("reason", ""))
	]

	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()

func _input(event_input: InputEvent) -> void:
	if event_input is InputEventKey and event_input.pressed and event_input.keycode == KEY_SPACE:
		defender_index = (defender_index + 1) % defenders.size()
		elapsed = 0.0
		_play_trial()

func _play_trial() -> void:
	var position := defenders[defender_index]
	var result := {
		"result": "FIELDING_CANDIDATE",
		"timing": "GOOD",
		"contact_quality": 0.30
	}
	event = BattedBallEvent.from_result(result, Vector2(930, 430), 9000 + defender_index)
	event.target = {
		"SS": Vector2(620, 325),
		"2B": Vector2(700, 310),
		"CF": Vector2(640, 260),
		"RF": Vector2(830, 320)
	}.get(position, Vector2(640, 300))
	event.control = event.origin.lerp(event.target, 0.5) + Vector2(0, -70)
	event.duration = 0.9

	rng.seed = 7000 + defender_index
	last_resolution = resolver.resolve(event, defensive_roster, 0.78, rng)
	ball.play_batted_event(event)
