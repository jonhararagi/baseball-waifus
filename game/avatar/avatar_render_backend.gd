class_name AvatarRenderBackend
extends RefCounted

func setup(profile: AvatarProfile) -> void:
	pass

func set_pose(pose: int) -> void:
	pass

func apply_tracking(data: Dictionary) -> void:
	pass

func supports_runtime_rig() -> bool:
	return false
