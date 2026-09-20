class_name BaseballBallController
extends Node2D

var ball_position := Vector2.ZERO
var ball_radius := 8.0
var visible_ball := false
var active_path: Array[Vector2] = []
var active_duration := 0.0
var active_elapsed := 0.0
var active_index := 0

func _ready() -> void:
	z_index = 50
	queue_redraw()

func play_pitch(origin: Vector2, target: Vector2, duration: float, break_amount: float) -> void:
	var midpoint := origin.lerp(target, 0.5)
	var control := midpoint + Vector2(break_amount * 120.0, -18.0)
	_start_path(_sample_quadratic(origin, control, target, 22), duration)

func play_batted_event(event: BattedBallEvent) -> void:
	if event == null:
		return
	_start_path(_sample_quadratic(event.origin, event.control, event.target, 26), event.duration)

func play_fielding_play(event: BattedBallEvent, play: FieldingPlayEvent) -> void:
	if event == null or play == null or not play.is_valid():
		play_batted_event(event)
		return

	var points: Array[Vector2] = _sample_quadratic(event.origin, event.control, event.target, 22)
	var current := event.target

	if not play.is_double_play:
		for rebound in play.rebound_points:
			var rebound_control := current.lerp(rebound, 0.5) + Vector2(0, -22)
			_append_segment(points, _sample_quadratic(current, rebound_control, rebound, 10))
			current = rebound

		var final_target := play.wild_throw_target if play.throw_error else play.throw_target
		var throw_control := current.lerp(final_target, 0.5) + Vector2(0, -play.throw_arc)
		_append_segment(points, _sample_quadratic(current, throw_control, final_target, 16))
	else:
		var pivot_target := FieldingPlayEvent.BASE_POSITIONS.get(play.pivot_position, FieldingPlayEvent.BASE_POSITIONS["2B"])
		var pivot_control := current.lerp(pivot_target, 0.5) + Vector2(0, -play.throw_arc)
		_append_segment(points, _sample_quadratic(current, pivot_control, pivot_target, 14))
		current = pivot_target
		var first_target := FieldingPlayEvent.BASE_POSITIONS["1B"]
		var first_control := current.lerp(first_target, 0.5) + Vector2(0, -play.throw_arc)
		_append_segment(points, _sample_quadratic(current, first_control, first_target, 14))

	var total_duration := event.duration
	if not play.is_double_play:
		total_duration += float(play.rebound_points.size()) * 0.24 + play.throw_duration
	else:
		total_duration += play.throw_duration * 2.0
	_start_path(points, total_duration)

func play_miss_to_catcher(origin: Vector2, target: Vector2) -> void:
	var control := origin.lerp(target, 0.5) + Vector2(0, -22)
	_start_path(_sample_quadratic(origin, control, target, 16), 0.42)

func stop() -> void:
	active_path.clear()
	active_elapsed = 0.0
	active_index = 0
	visible_ball = false
	queue_redraw()

func _start_path(points: Array[Vector2], duration: float) -> void:
	active_path = points
	active_duration = max(duration, 0.05)
	active_elapsed = 0.0
	active_index = 0
	visible_ball = not active_path.is_empty()
	if visible_ball:
		ball_position = active_path[0]
	queue_redraw()

func _process(delta: float) -> void:
	if active_path.size() < 2:
		queue_redraw()
		return

	active_elapsed += delta
	var progress := clamp(active_elapsed / active_duration, 0.0, 1.0)
	var scaled := progress * float(active_path.size() - 1)
	active_index = min(int(floor(scaled)), active_path.size() - 2)
	var local_t := scaled - float(active_index)
	ball_position = active_path[active_index].lerp(active_path[active_index + 1], local_t)

	if progress >= 1.0:
		ball_position = active_path[active_path.size() - 1]
		visible_ball = false

	queue_redraw()

func _draw() -> void:
	if not visible_ball:
		return
	draw_circle(ball_position, ball_radius + 2.0, Color(0.92, 0.92, 0.92, 0.18))
	draw_circle(ball_position, ball_radius, Color.WHITE)
	draw_arc(ball_position, ball_radius - 2.0, -0.75, 0.75, 10, Color(0.85, 0.15, 0.15), 1.4)

func _append_segment(points: Array[Vector2], segment: Array[Vector2]) -> void:
	if segment.is_empty():
		return
	var start_index := 1 if not points.is_empty() else 0
	for i in range(start_index, segment.size()):
		points.append(segment[i])

func _sample_quadratic(start: Vector2, control: Vector2, target: Vector2, samples: int) -> Array[Vector2]:
	var points: Array[Vector2] = []
	for i in range(samples + 1):
		var t := float(i) / float(samples)
		var u := 1.0 - t
		points.append(u * u * start + 2.0 * u * t * control + t * t * target)
	return points
