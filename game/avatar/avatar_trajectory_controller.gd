class_name AvatarTrajectoryController
extends RefCounted

var active_tweens: Dictionary = {}

func move_to(node: Node2D, destination: Vector2, duration := 0.55, arc_height := 0.0) -> void:
	if node == null or not is_instance_valid(node):
		return
	var key := node.get_instance_id()
	if active_tweens.has(key):
		var previous: Tween = active_tweens[key]
		if previous and previous.is_valid():
			previous.kill()

	var start := node.position
	var tween := node.create_tween()
	active_tweens[key] = tween
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)

	if abs(arc_height) <= 0.01:
		tween.tween_property(node, "position", destination, max(duration, 0.05))
	else:
		var midpoint := (start + destination) * 0.5 + Vector2(0, -abs(arc_height))
		var points := PackedVector2Array([start, midpoint, destination])
		var path := _sample_quadratic(points, 14)
		var segment_duration := max(duration, 0.05) / float(max(path.size() - 1, 1))
		for i in range(1, path.size()):
			tween.tween_property(node, "position", path[i], segment_duration)

	tween.tween_callback(func():
		active_tweens.erase(key)
	)

func dash_to(node: Node2D, destination: Vector2, duration := 0.35) -> void:
	move_to(node, destination, duration, 8.0)

func clear(node: Node2D) -> void:
	if node == null:
		return
	var key := node.get_instance_id()
	if active_tweens.has(key):
		var tween: Tween = active_tweens[key]
		if tween and tween.is_valid():
			tween.kill()
		active_tweens.erase(key)

func _sample_quadratic(points: PackedVector2Array, samples: int) -> PackedVector2Array:
	var result := PackedVector2Array()
	if points.size() < 3:
		return points
	var p0 := points[0]
	var p1 := points[1]
	var p2 := points[2]
	for i in range(samples + 1):
		var t := float(i) / float(samples)
		var u := 1.0 - t
		result.append(u * u * p0 + 2.0 * u * t * p1 + t * t * p2)
	return result
