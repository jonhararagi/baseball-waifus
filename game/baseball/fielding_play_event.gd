class_name FieldingPlayEvent
extends RefCounted

const BASE_POSITIONS := {
	"1B": Vector2(810, 260),
	"2B": Vector2(550, 260),
	"3B": Vector2(790, 500),
	"HOME": Vector2(1050, 500)
}

const DEFENSIVE_POSITIONS := {
	"C": Vector2(1035, 485),
	"1B": Vector2(870, 390),
	"2B": Vector2(690, 315),
	"3B": Vector2(785, 390),
	"SS": Vector2(620, 315),
	"LF": Vector2(430, 295),
	"CF": Vector2(640, 235),
	"RF": Vector2(850, 295)
}

var defender_position := ""
var receiver_position := "1B"
var rebound_points: Array[Vector2] = []
var pickup_point := Vector2.ZERO
var throw_target := Vector2.ZERO
var throw_duration := 0.55
var throw_arc := 45.0
var seed := 0
var throw_error := false
var wild_throw_target := Vector2.ZERO
var is_double_play := false
var assist_position := ""
var pivot_position := ""
var putout_position := "1B"

static func from_resolution(event: BattedBallEvent, resolution: Dictionary) -> FieldingPlayEvent:
	var play := FieldingPlayEvent.new()
	if event == null:
		return play

	play.seed = abs(event.seed) + 701
	play.defender_position = str(resolution.get("defender_position", event.target_zone()))
	play.receiver_position = _receiver_for_bases(int(resolution.get("bases", 1)))
	play.throw_target = BASE_POSITIONS.get(play.receiver_position, BASE_POSITIONS["1B"])
	var double_play: Dictionary = resolution.get("double_play", {})
	play.is_double_play = bool(double_play.get("success", false))
	play.assist_position = str(double_play.get("assist_position", ""))
	play.pivot_position = str(double_play.get("pivot_position", ""))
	play.putout_position = str(double_play.get("putout_position", "1B"))

	var rng := RandomNumberGenerator.new()
	rng.seed = play.seed

	var rebound_count := 1 if rng.randf() < 0.68 else 2
	var direction := event.target.direction_to(DEFENSIVE_POSITIONS.get(play.defender_position, event.target))
	if direction.length_squared() < 0.01:
		direction = Vector2(0.0, 1.0)

	var perpendicular := Vector2(-direction.y, direction.x)
	var current := event.target
	for i in range(rebound_count):
		var forward := rng.randf_range(22.0, 42.0)
		var side := rng.randf_range(-28.0, 28.0)
		current += direction * forward + perpendicular * side
		current.y = clamp(current.y, 205.0, 500.0)
		play.rebound_points.append(current)

	play.pickup_point = play.rebound_points.back() if not play.rebound_points.is_empty() else event.target
	play.throw_duration = rng.randf_range(0.42, 0.68)
	play.throw_arc = rng.randf_range(34.0, 58.0)
	return play

static func _receiver_for_bases(bases: int) -> String:
	match bases:
		3:
			return "3B"
		2:
			return "2B"
		_:
			return "1B"

func is_valid() -> bool:
	return not defender_position.is_empty() and not rebound_points.is_empty()
