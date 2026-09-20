class_name ExternalRigAvatar2D
extends Node2D

var profile: AvatarProfile
var rig_instance: Node2D

func setup(p: AvatarProfile) -> void:
	profile = p
	_load_rig()
	queue_redraw()

func set_pose(pose: int) -> void:
	if rig_instance == null:
		return
	if rig_instance.has_method("set_pose"):
		rig_instance.call("set_pose", pose)

func apply_tracking(data: Dictionary) -> void:
	if rig_instance == null:
		return
	if rig_instance.has_method("apply_tracking"):
		rig_instance.call("apply_tracking", data)

func _load_rig() -> void:
	if profile == null or profile.rig_scene_path.is_empty():
		return
	if not ResourceLoader.exists(profile.rig_scene_path):
		return
	var packed := load(profile.rig_scene_path) as PackedScene
	if packed == null:
		return
	if is_instance_valid(rig_instance):
		rig_instance.queue_free()
	rig_instance = packed.instantiate() as Node2D
	if rig_instance != null:
		add_child(rig_instance)

func _draw() -> void:
	if rig_instance == null:
		draw_circle(Vector2.ZERO, 46.0, Color(0.2, 0.25, 0.35, 0.35))
