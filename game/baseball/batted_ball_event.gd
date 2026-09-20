class_name BattedBallEvent
extends RefCounted

var result := ""
var timing := ""
var seed := 0
var origin := Vector2.ZERO
var target := Vector2.ZERO
var control := Vector2.ZERO
var duration := 0.8
var arc_height := 0.0
var is_home_run := false
var contact_quality := 0.0

static func from_result(result_data: Dictionary, origin_position: Vector2, seed_value: int) -> BattedBallEvent:
	var event := BattedBallEvent.new()
	event.result = str(result_data.get("result", "OUT"))
	event.timing = str(result_data.get("timing", ""))
	event.seed = seed_value
	event.contact_quality = float(result_data.get("contact_quality", 0.0))
	event.origin = origin_position
	event._configure_trajectory()
	return event

func _configure_trajectory() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = abs(seed) + 1

	match result:
		"HOME RUN":
			target = Vector2(
				rng.randf_range(560.0, 720.0),
				rng.randf_range(150.0, 205.0)
			)
			control = Vector2(
				rng.randf_range(530.0, 760.0),
				rng.randf_range(55.0, 130.0)
			)
			duration = 1.15
			arc_height = 100.0
			is_home_run = true
		"TRIPLE":
			target = [
				Vector2(430, 240),
				Vector2(855, 240),
				Vector2(680, 215)
			][rng.randi_range(0, 2)]
			control = Vector2(target.x, max(125.0, target.y - 120.0))
			duration = 1.0
			arc_height = 85.0
		"DOUBLE":
			target = [
				Vector2(470, 275),
				Vector2(800, 265),
				Vector2(665, 245)
			][rng.randi_range(0, 2)]
			control = Vector2(target.x, max(155.0, target.y - 95.0))
			duration = 0.9
			arc_height = 68.0
		"SINGLE":
			target = [
				Vector2(520, 315),
				Vector2(745, 300),
				Vector2(865, 355)
			][rng.randi_range(0, 2)]
			control = Vector2(target.x, max(205.0, target.y - 55.0))
			duration = 0.72
			arc_height = 42.0
		"FOUL":
			target = Vector2(
				origin.x + rng.randf_range(-260.0, -140.0),
				origin.y + rng.randf_range(-130.0, 40.0)
			)
			control = origin.lerp(target, 0.5) + Vector2(0, -55)
			duration = 0.55
			arc_height = 32.0
		_:
			target = [
				Vector2(640, 315),
				Vector2(745, 345),
				Vector2(575, 325),
				Vector2(895, 350)
			][rng.randi_range(0, 3)]
			control = origin.lerp(target, 0.5) + Vector2(0, -35)
			duration = 0.65
			arc_height = 28.0

func target_zone() -> String:
	if target.x < 520.0:
		return "LF"
	if target.x < 610.0:
		return "SS"
	if target.x < 745.0:
		return "CF"
	if target.x < 835.0:
		return "RF"
	return "RF"
