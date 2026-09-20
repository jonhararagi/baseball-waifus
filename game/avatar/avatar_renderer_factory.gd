class_name AvatarRendererFactory
extends RefCounted

static func create(profile: AvatarProfile, at: Vector2, order: int) -> Node2D:
	if profile != null and profile.art_style == "rig" and not profile.rig_scene_path.is_empty():
		var external := ExternalRigAvatar2D.new()
		external.position = at
		external.z_index = order
		external.setup(profile)
		return external

	var procedural := AnimeAvatar2D.new()
	procedural.position = at
	procedural.z_index = order
	procedural.setup(profile)
	return procedural
