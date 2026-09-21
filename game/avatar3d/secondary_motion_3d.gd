class_name SecondaryMotion3D
extends Node

## Presentation-only secondary motion for the stylized adult 3D avatar.
## It never reads or changes gameplay state, stats, hit results or rewards.
##
## The model is intentionally spring-based rather than physics-body based:
## stable on mobile, deterministic enough for presentation, and easy to tune.
## It adds subtle delayed motion to chest, hips/skirt, thighs and torso/spine.

@export_range(0.0, 30.0, 0.1) var stiffness := 14.0
@export_range(0.0, 12.0, 0.1) var damping := 5.5
@export_range(0.0, 1.0, 0.01) var response := 0.34
@export_range(0.0, 0.20, 0.005) var max_displacement := 0.075
@export_range(0.0, 20.0, 0.1) var max_rotation_degrees := 5.5

var torso: Node3D
var skirt: Node3D
var chest_left: Node3D
var chest_right: Node3D
var front_leg: Node3D
var rear_leg: Node3D

var _nodes: Array[Node3D] = []
var _base_position: Dictionary = {}
var _base_rotation: Dictionary = {}
var _offset := Vector3.ZERO
var _velocity := Vector3.ZERO
var _rotation_offset := Vector3.ZERO
var _rotation_velocity := Vector3.ZERO
var _activity := Vector3.ZERO
var _phase := 0.0

func setup(
	p_torso: Node3D,
	p_skirt: Node3D,
	p_chest_left: Node3D,
	p_chest_right: Node3D,
	p_front_leg: Node3D,
	p_rear_leg: Node3D
) -> void:
	torso = p_torso
	skirt = p_skirt
	chest_left = p_chest_left
	chest_right = p_chest_right
	front_leg = p_front_leg
	rear_leg = p_rear_leg
	_nodes = [torso, skirt, chest_left, chest_right, front_leg, rear_leg]
	_capture_bases()

func set_activity(velocity_hint: Vector3) -> void:
	_activity = velocity_hint.clamp(Vector3(-1.0, -1.0, -1.0), Vector3.ONE)

func nudge(direction: Vector3, amount: float = 1.0) -> void:
	_velocity += direction.clamp(Vector3(-1.0, -1.0, -1.0), Vector3.ONE) * amount * response

func _capture_bases() -> void:
	_base_position.clear()
	_base_rotation.clear()
	for node in _nodes:
		if node == null:
			continue
		_base_position[node] = node.position
		_base_rotation[node] = node.rotation

func _process(delta: float) -> void:
	if _nodes.is_empty():
		return

	_phase += delta
	var locomotion := _activity
	var breathing := sin(_phase * 1.7) * 0.018
	var target_offset := Vector3(
		-locomotion.x * max_displacement * 0.55,
		-locomotion.y * max_displacement * 0.35 + breathing,
		-locomotion.z * max_displacement
	)
	var target_rotation := Vector3(
		-locomotion.y * deg_to_rad(max_rotation_degrees) * 0.55,
		-locomotion.x * deg_to_rad(max_rotation_degrees) * 0.70,
		-locomotion.z * deg_to_rad(max_rotation_degrees)
	)

	var force := (target_offset - _offset) * stiffness
	_velocity += force * delta
	_velocity *= exp(-damping * delta)
	_offset += _velocity * delta

	var rotation_force := (target_rotation - _rotation_offset) * stiffness
	_rotation_velocity += rotation_force * delta
	_rotation_velocity *= exp(-damping * delta)
	_rotation_offset += _rotation_velocity * delta

	var sway := sin(_phase * 8.0) * minf(abs(locomotion.x) + abs(locomotion.z), 1.0) * 0.012
	_apply_motion(_offset, _rotation_offset + Vector3(0.0, sway, 0.0))

func _apply_motion(offset: Vector3, rotation_offset: Vector3) -> void:
	_apply_node(torso, offset * 0.32, rotation_offset * 0.55)
	_apply_node(skirt, Vector3(offset.x * 0.85, offset.y * 0.25, offset.z * 0.85), rotation_offset * 0.85)

	# Chest masses lag slightly behind the torso to create readable secondary motion.
	_apply_node(chest_left, Vector3(offset.x * 0.70, offset.y * 0.95, offset.z * 0.45), rotation_offset * 0.42)
	_apply_node(chest_right, Vector3(offset.x * 0.72, offset.y * 0.92, offset.z * 0.45), rotation_offset * 0.42)

	# Thighs receive a small delayed counter-swing during running/sliding.
	_apply_node(front_leg, Vector3(offset.x * 0.18, 0.0, offset.z * 0.12), Vector3(rotation_offset.x * 0.55, 0.0, rotation_offset.z * 0.30))
	_apply_node(rear_leg, Vector3(-offset.x * 0.18, 0.0, -offset.z * 0.12), Vector3(-rotation_offset.x * 0.55, 0.0, -rotation_offset.z * 0.30))

func _apply_node(node: Node3D, position_offset: Vector3, rotation_offset: Vector3) -> void:
	if node == null or not _base_position.has(node):
		return
	node.position = _base_position[node] + position_offset
	node.rotation = _base_rotation[node] + rotation_offset
