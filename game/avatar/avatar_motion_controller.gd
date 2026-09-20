class_name AvatarMotionController
extends RefCounted

var avatar: AnimeAvatar2D
var action_time := 0.0
var action_duration := 0.0
var action_active := false
var return_pose := AnimeAvatar2D.Pose.IDLE

func setup(target: AnimeAvatar2D) -> void:
	avatar = target

func play(action: AnimeAvatar2D.Pose, duration := 0.75, next_pose := AnimeAvatar2D.Pose.IDLE) -> void:
	if avatar == null:
		return
	return_pose = next_pose
	action_duration = max(duration, 0.05)
	action_time = 0.0
	action_active = true
	avatar.set_pose(action)

func update(delta: float) -> void:
	if not action_active or avatar == null:
		return
	action_time += delta
	if action_time >= action_duration:
		action_active = false
		avatar.set_pose(return_pose)

func is_playing() -> bool:
	return action_active