class_name AvatarMatchPresenter
extends Node2D

const BATTER_POSITION := Vector2(1035, 470)
const PITCHER_POSITION := Vector2(640, 405)

var roster := AvatarRosterService.new()
var batter_avatar: AnimeAvatar2D
var pitcher_avatar: AnimeAvatar2D
var batter_motion := AvatarMotionController.new()
var pitcher_motion := AvatarMotionController.new()

func setup(batter: PlayerData, pitcher: PlayerData) -> void:
	_clear_avatars()

	batter_avatar = _create_avatar(roster.profile_for_player(batter), BATTER_POSITION, 20)
	pitcher_avatar = _create_avatar(roster.profile_for_player(pitcher), PITCHER_POSITION, 18)

	batter_motion.setup(batter_avatar)
	pitcher_motion.setup(pitcher_avatar)

	batter_motion.play(AnimeAvatar2D.Pose.MENU_IDLE, 0.9, AnimeAvatar2D.Pose.IDLE)
	pitcher_motion.play(AnimeAvatar2D.Pose.IDLE, 0.1, AnimeAvatar2D.Pose.IDLE)

func _create_avatar(profile: AvatarProfile, at: Vector2, order: int) -> AnimeAvatar2D:
	var avatar := AvatarRendererFactory.create(profile, at, order) as AnimeAvatar2D
	add_child(avatar)
	return avatar

func _clear_avatars() -> void:
	if is_instance_valid(batter_avatar):
		batter_avatar.queue_free()
	batter_avatar = null
	if is_instance_valid(pitcher_avatar):
		pitcher_avatar.queue_free()
	pitcher_avatar = null

func _process(delta: float) -> void:
	batter_motion.update(delta)
	pitcher_motion.update(delta)

func on_pitch_selected() -> void:
	batter_motion.play(AnimeAvatar2D.Pose.IDLE, 0.2, AnimeAvatar2D.Pose.IDLE)
	_pitcher_action(AnimeAvatar2D.Pose.PITCH, 0.85)

func on_pitch_started() -> void:
	_pitcher_action(AnimeAvatar2D.Pose.PITCH, 0.95)

func on_timing_started() -> void:
	batter_motion.play(AnimeAvatar2D.Pose.BAT, 999.0, AnimeAvatar2D.Pose.BAT)
	pitcher_motion.play(AnimeAvatar2D.Pose.IDLE, 999.0, AnimeAvatar2D.Pose.IDLE)

func on_batting_result(result: Dictionary) -> void:
	var result_name := str(result.get("result", ""))
	match result_name:
		"HOME RUN":
			batter_motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.2, AnimeAvatar2D.Pose.IDLE)
			pitcher_motion.play(AnimeAvatar2D.Pose.HIT_REACTION, 0.85, AnimeAvatar2D.Pose.IDLE)
		"SINGLE", "DOUBLE", "TRIPLE", "FIELDING ERROR":
			batter_motion.play(AnimeAvatar2D.Pose.HIT_REACTION, 0.75, AnimeAvatar2D.Pose.RUN)
			pitcher_motion.play(AnimeAvatar2D.Pose.HIT_REACTION, 0.75, AnimeAvatar2D.Pose.IDLE)
		"FOUL":
			batter_motion.play(AnimeAvatar2D.Pose.HIT_REACTION, 0.6, AnimeAvatar2D.Pose.BAT)
			pitcher_motion.play(AnimeAvatar2D.Pose.IDLE, 0.4, AnimeAvatar2D.Pose.IDLE)
		"OUT", "DOUBLE PLAY", "STRIKE":
			batter_motion.play(AnimeAvatar2D.Pose.OUT, 0.85, AnimeAvatar2D.Pose.IDLE)
			pitcher_motion.play(AnimeAvatar2D.Pose.CELEBRATE, 0.85, AnimeAvatar2D.Pose.IDLE)
		_:
			batter_motion.play(AnimeAvatar2D.Pose.IDLE, 0.3, AnimeAvatar2D.Pose.IDLE)
			pitcher_motion.play(AnimeAvatar2D.Pose.IDLE, 0.3, AnimeAvatar2D.Pose.IDLE)

func on_steal_started() -> void:
	batter_motion.play(AnimeAvatar2D.Pose.STEAL, 0.85, AnimeAvatar2D.Pose.RUN)

func on_steal_result(success: bool) -> void:
	if success:
		batter_motion.play(AnimeAvatar2D.Pose.STEAL, 0.7, AnimeAvatar2D.Pose.RUN)
	else:
		batter_motion.play(AnimeAvatar2D.Pose.OUT, 0.8, AnimeAvatar2D.Pose.IDLE)
		pitcher_motion.play(AnimeAvatar2D.Pose.CELEBRATE, 0.8, AnimeAvatar2D.Pose.IDLE)

func on_game_over(winner: int) -> void:
	if winner == 0:
		batter_motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.6, AnimeAvatar2D.Pose.MENU_IDLE)
		pitcher_motion.play(AnimeAvatar2D.Pose.DEFEAT, 1.4, AnimeAvatar2D.Pose.MENU_IDLE)
	elif winner == 1:
		batter_motion.play(AnimeAvatar2D.Pose.DEFEAT, 1.4, AnimeAvatar2D.Pose.MENU_IDLE)
		pitcher_motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.6, AnimeAvatar2D.Pose.MENU_IDLE)
	else:
		batter_motion.play(AnimeAvatar2D.Pose.IDLE, 1.0, AnimeAvatar2D.Pose.MENU_IDLE)
		pitcher_motion.play(AnimeAvatar2D.Pose.IDLE, 1.0, AnimeAvatar2D.Pose.MENU_IDLE)

func _pitcher_action(pose: AnimeAvatar2D.Pose, duration: float) -> void:
	pitcher_motion.play(pose, duration, AnimeAvatar2D.Pose.IDLE)
