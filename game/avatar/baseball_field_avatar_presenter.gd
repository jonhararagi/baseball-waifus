class_name BaseballFieldAvatarPresenter
extends Node2D

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

const RUNNER_POSITIONS := [
	Vector2(810, 260),
	Vector2(550, 260),
	Vector2(790, 500)
]

var roster := AvatarRosterService.new()
var field_avatars: Dictionary = {}
var field_motions: Dictionary = {}
var runner_avatars: Array[AnimeAvatar2D] = []
var runner_motions: Array[AvatarMotionController] = []

func setup(defensive_roster: Dictionary) -> void:
	clear_field()

	for position in DEFENSIVE_POSITIONS.keys():
		var player: PlayerData = defensive_roster.get(position)
		if player == null:
			continue
		var avatar := _create_avatar(player, DEFENSIVE_POSITIONS[position], 14)
		field_avatars[position] = avatar
		var motion := AvatarMotionController.new()
		motion.setup(avatar)
		field_motions[position] = motion
		motion.play(AnimeAvatar2D.Pose.IDLE, 0.2, AnimeAvatar2D.Pose.IDLE)

	for i in range(RUNNER_POSITIONS.size()):
		var runner_avatar := _create_runner_placeholder(i)
		runner_avatars.append(runner_avatar)
		var runner_motion := AvatarMotionController.new()
		runner_motion.setup(runner_avatar)
		runner_motions.append(runner_motion)
		runner_avatar.visible = false

func _create_avatar(player: PlayerData, at: Vector2, order: int) -> AnimeAvatar2D:
	var avatar := AnimeAvatar2D.new()
	avatar.position = at
	avatar.z_index = order
	avatar.scale = Vector2(0.72, 0.72)
	avatar.setup(roster.profile_for_player(player))
	add_child(avatar)
	return avatar

func _create_runner_placeholder(index: int) -> AnimeAvatar2D:
	var player := PlayerData.new()
	player.id = "runner_visual_%d" % index
	player.display_name = "Runner %d" % (index + 1)
	player.position = "RF"
	player.specialization = "runner"
	player.element = "neutral"
	var avatar := AnimeAvatar2D.new()
	avatar.position = RUNNER_POSITIONS[index]
	avatar.z_index = 17
	avatar.scale = Vector2(0.68, 0.68)
	avatar.setup(PlayerAvatarAdapter.from_player(player))
	add_child(avatar)
	return avatar

func clear_field() -> void:
	for avatar in field_avatars.values():
		if is_instance_valid(avatar):
			avatar.queue_free()
	field_avatars.clear()
	field_motions.clear()

	for avatar in runner_avatars:
		if is_instance_valid(avatar):
			avatar.queue_free()
	runner_avatars.clear()
	runner_motions.clear()

func _process(delta: float) -> void:
	for motion in field_motions.values():
		motion.update(delta)
	for motion in runner_motions:
		motion.update(delta)

func on_pitch() -> void:
	_play_position("P", AnimeAvatar2D.Pose.PITCH, 0.85, AnimeAvatar2D.Pose.IDLE)
	_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.75, AnimeAvatar2D.Pose.IDLE)

func on_batted_ball(result: Dictionary) -> void:
	var result_name := str(result.get("result", ""))
	match result_name:
		"SINGLE":
			_play_position("LF", AnimeAvatar2D.Pose.RUN, 0.65, AnimeAvatar2D.Pose.IDLE)
			_play_position("CF", AnimeAvatar2D.Pose.CATCH, 0.65, AnimeAvatar2D.Pose.THROW)
			_play_position("SS", AnimeAvatar2D.Pose.THROW, 0.65, AnimeAvatar2D.Pose.IDLE)
			_play_position("2B", AnimeAvatar2D.Pose.CATCH, 0.65, AnimeAvatar2D.Pose.IDLE)
			_animate_active_fielders()
		"DOUBLE", "TRIPLE":
			_play_position("CF", AnimeAvatar2D.Pose.RUN, 0.75, AnimeAvatar2D.Pose.THROW)
			_play_position("LF", AnimeAvatar2D.Pose.RUN, 0.75, AnimeAvatar2D.Pose.THROW)
			_play_position("RF", AnimeAvatar2D.Pose.RUN, 0.75, AnimeAvatar2D.Pose.THROW)
			_animate_active_fielders()
		"HOME RUN":
			for position in ["LF", "CF", "RF", "SS", "2B", "3B"]:
				_play_position(position, AnimeAvatar2D.Pose.HIT_REACTION, 0.8, AnimeAvatar2D.Pose.IDLE)
		"OUT", "STRIKE":
			_play_position("P", AnimeAvatar2D.Pose.CELEBRATE, 0.8, AnimeAvatar2D.Pose.IDLE)
			_play_position("C", AnimeAvatar2D.Pose.CELEBRATE, 0.8, AnimeAvatar2D.Pose.IDLE)

func sync_runners(bases: Array) -> void:
	for i in range(min(3, runner_avatars.size())):
		var active := bool(bases[i])
		runner_avatars[i].visible = active
		if active:
			runner_avatars[i].position = RUNNER_POSITIONS[i]
			runner_motions[i].play(AnimeAvatar2D.Pose.IDLE, 0.2, AnimeAvatar2D.Pose.IDLE)

func on_steal_started(from_base: int) -> void:
	if from_base < 0 or from_base >= runner_avatars.size():
		return
	if not runner_avatars[from_base].visible:
		return
	runner_motions[from_base].play(AnimeAvatar2D.Pose.STEAL, 0.9, AnimeAvatar2D.Pose.RUN)

func on_steal_result(from_base: int, success: bool, destination_base: int) -> void:
	if from_base < 0 or from_base >= runner_avatars.size():
		return
	if not runner_avatars[from_base].visible:
		return

	if success and destination_base >= 0 and destination_base < runner_avatars.size():
		runner_avatars[from_base].visible = false
		runner_avatars[destination_base].visible = true
		runner_avatars[destination_base].position = RUNNER_POSITIONS[destination_base]
		runner_motions[destination_base].play(AnimeAvatar2D.Pose.RUN, 0.7, AnimeAvatar2D.Pose.IDLE)
	else:
		runner_motions[from_base].play(AnimeAvatar2D.Pose.OUT, 0.8, AnimeAvatar2D.Pose.IDLE)
		runner_avatars[from_base].visible = false

func on_game_over(winner: int) -> void:
	for position in field_avatars.keys():
		var motion: AvatarMotionController = field_motions[position]
		if winner == 1:
			motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.3, AnimeAvatar2D.Pose.MENU_IDLE)
		elif winner == 0:
			motion.play(AnimeAvatar2D.Pose.DEFEAT, 1.2, AnimeAvatar2D.Pose.MENU_IDLE)
		else:
			motion.play(AnimeAvatar2D.Pose.IDLE, 0.8, AnimeAvatar2D.Pose.MENU_IDLE)

func _play_position(position: String, pose: AnimeAvatar2D.Pose, duration: float, next_pose: AnimeAvatar2D.Pose) -> void:
	if not field_motions.has(position):
		return
	var motion: AvatarMotionController = field_motions[position]
	motion.play(pose, duration, next_pose)

func _animate_active_fielders() -> void:
	for position in ["SS", "2B", "1B", "3B"]:
		_play_position(position, AnimeAvatar2D.Pose.CATCH, 0.55, AnimeAvatar2D.Pose.THROW)
