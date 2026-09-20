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

func _sample_quadratic(start: Vector2, control: Vector2, target: Vector2, samples: int) -> Array[Vector2]:
	var points: Array[Vector2] = []
	for i in range(samples + 1):
		var t := float(i) / float(samples)
		var u := 1.0 - t
		points.append(u * u * start + 2.0 * u * t * control + t * t * target)
	return points
