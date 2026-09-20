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

const BASE_POSITIONS := [
	Vector2(810, 260),
	Vector2(550, 260),
	Vector2(790, 500)
]
const HOME_POSITION := Vector2(1050, 500)
const BATTER_RUN_POSITION := Vector2(1040, 430)

var roster := AvatarRosterService.new()
var field_avatars: Dictionary = {}
var field_motions: Dictionary = {}
var runner_avatars: Array[AnimeAvatar2D] = []
var runner_motions: Array[AvatarMotionController] = []
var runner_players: Dictionary = {}
var trajectory := AvatarTrajectoryController.new()

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

	for i in range(4):
		var runner_avatar := _create_runner_placeholder(i)
		runner_avatars.append(runner_avatar)
		var runner_motion := AvatarMotionController.new()
		runner_motion.setup(runner_avatar)
		runner_motions.append(runner_motion)
		runner_avatar.visible = false

func set_runner_players(players: Dictionary) -> void:
	runner_players = players.duplicate()


func _create_avatar(player: PlayerData, at: Vector2, order: int) -> AnimeAvatar2D:
	var avatar := AvatarRendererFactory.create(roster.profile_for_player(player), at, order) as AnimeAvatar2D
	avatar.scale = Vector2(0.72, 0.72)
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
	avatar.position = BATTER_RUN_POSITION if index == 3 else BASE_POSITIONS[index]
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
	_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.75, AnimeAvatar2D.Pose.IDLE)

func on_batted_ball_event(event: BattedBallEvent) -> void:
	if event == null:
		return

	var result_name := event.result
	var zone := event.target_zone()

	match result_name:
		"SINGLE":
			_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.45, AnimeAvatar2D.Pose.IDLE)
			_react_to_ball_zone(zone, event.target, 0.52)
			_animate_active_fielders()
		"DOUBLE", "TRIPLE":
			_react_to_ball_zone(zone, event.target, 0.68)
			_animate_active_fielders()
		"HOME RUN":
			for position in ["LF", "CF", "RF", "SS", "2B", "3B"]:
				_play_position(position, AnimeAvatar2D.Pose.HIT_REACTION, 0.8, AnimeAvatar2D.Pose.IDLE)
		"FIELDING ERROR":
			_react_to_ball_zone(zone, event.target, 0.65, AnimeAvatar2D.Pose.RUN)
		"DOUBLE PLAY":
			_react_to_ball_zone(zone, event.target, 0.55, AnimeAvatar2D.Pose.THROW)
		"FOUL":
			_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.55, AnimeAvatar2D.Pose.IDLE)
			_move_field("C", event.target, 0.28, 0.05)
		"FIELDING_CANDIDATE":
			_react_to_ball_zone(zone, event.target, 0.56, AnimeAvatar2D.Pose.CATCH)
		"OUT":
			_react_to_ball_zone(zone, event.target, 0.48, AnimeAvatar2D.Pose.THROW)
			_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.6, AnimeAvatar2D.Pose.IDLE)
		"STRIKE":
			_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.55, AnimeAvatar2D.Pose.IDLE)

func _react_to_ball_zone(zone: String, target: Vector2, duration: float, next_pose: AnimeAvatar2D.Pose = AnimeAvatar2D.Pose.THROW) -> void:
	var primary := zone
	if not field_avatars.has(primary):
		primary = "CF"
	_play_position(primary, AnimeAvatar2D.Pose.RUN, duration, next_pose)
	_move_field(primary, target, duration, 0.08)

func on_fielding_resolution(event: BattedBallEvent, resolution: Dictionary) -> void:
	if event == null or resolution.is_empty():
		return
	var defender_position := str(resolution.get("defender_position", event.target_zone()))
	var success := bool(resolution.get("success", false))
	var double_play: Dictionary = resolution.get("double_play", {})

	if bool(double_play.get("success", false)):
		_play_position(defender_position, AnimeAvatar2D.Pose.THROW, 0.75, AnimeAvatar2D.Pose.IDLE)
		var pivot := str(double_play.get("pivot_position", "2B"))
		_play_position(pivot, AnimeAvatar2D.Pose.CATCH, 0.75, AnimeAvatar2D.Pose.THROW)
		_play_position("1B", AnimeAvatar2D.Pose.CATCH, 1.1, AnimeAvatar2D.Pose.IDLE)
		return

	if success:
		_play_position(defender_position, AnimeAvatar2D.Pose.CATCH, 0.48, AnimeAvatar2D.Pose.CELEBRATE)
	else:
		_play_position(defender_position, AnimeAvatar2D.Pose.HIT_REACTION, 0.36, AnimeAvatar2D.Pose.RUN)
		_play_position("C", AnimeAvatar2D.Pose.CATCH, 0.55, AnimeAvatar2D.Pose.IDLE)

func on_fielding_play(event: BattedBallEvent, play: FieldingPlayEvent) -> void:
	if event == null or play == null or not play.is_valid():
		return
	_animate_fielding_play(event, play)

func _animate_fielding_play(event: BattedBallEvent, play: FieldingPlayEvent) -> void:
	var defender_position := play.defender_position
	if not field_avatars.has(defender_position):
		return

	var defender: AnimeAvatar2D = field_avatars[defender_position]
	var defender_motion: AvatarMotionController = field_motions[defender_position]
	trajectory.clear(defender)
	defender_motion.play(AnimeAvatar2D.Pose.RUN, event.duration, AnimeAvatar2D.Pose.RUN)
	trajectory.move_to(defender, event.target, event.duration, 12.0)
	await get_tree().create_timer(event.duration + 0.03).timeout

	if play.is_double_play:
		defender_motion.play(AnimeAvatar2D.Pose.THROW, play.throw_duration, AnimeAvatar2D.Pose.IDLE)
		var pivot := play.pivot_position
		if field_motions.has(pivot):
			field_motions[pivot].play(AnimeAvatar2D.Pose.CATCH, play.throw_duration, AnimeAvatar2D.Pose.THROW)
		await get_tree().create_timer(play.throw_duration).timeout
		if field_motions.has("1B"):
			field_motions["1B"].play(AnimeAvatar2D.Pose.CATCH, play.throw_duration, AnimeAvatar2D.Pose.IDLE)
		return

	for rebound in play.rebound_points:
		if not is_instance_valid(defender):
			return
		defender_motion.play(AnimeAvatar2D.Pose.RUN, 0.24, AnimeAvatar2D.Pose.RUN)
		trajectory.move_to(defender, rebound, 0.24, 8.0)
		await get_tree().create_timer(0.25).timeout

	if not is_instance_valid(defender):
		return
	defender_motion.play(AnimeAvatar2D.Pose.THROW, play.throw_duration, AnimeAvatar2D.Pose.IDLE)
	var receiver_position := play.receiver_position
	if field_motions.has(receiver_position):
		var receiver_motion: AvatarMotionController = field_motions[receiver_position]
		receiver_motion.play(
			AnimeAvatar2D.Pose.HIT_REACTION if play.throw_error else AnimeAvatar2D.Pose.CATCH,
			play.throw_duration,
			AnimeAvatar2D.Pose.IDLE
		)

func animate_hit(plan: Array, after_runners: Array, batter_player: PlayerData = null) -> void:
	var animation_time := 0.85
	for item in plan:
		var kind := str(item.get("kind", "runner"))
		var source := int(item.get("from", -1))
		var destination := int(item.get("to", -1))
		var scored := bool(item.get("scored", false))
		if kind == "runner" and source >= 0 and source < 3:
			var avatar: AnimeAvatar2D = runner_avatars[source]
			avatar.visible = true
			runner_motions[source].play(AnimeAvatar2D.Pose.RUN, animation_time, AnimeAvatar2D.Pose.IDLE)
			var target := HOME_POSITION if scored else BASE_POSITIONS[destination]
			trajectory.move_to(avatar, target, animation_time, 16.0)
		elif kind == "batter":
			var avatar: AnimeAvatar2D = runner_avatars[3]
			if batter_player != null:
				avatar.setup(roster.profile_for_player(batter_player))
			avatar.visible = true
			runner_motions[3].play(AnimeAvatar2D.Pose.RUN, animation_time, AnimeAvatar2D.Pose.IDLE)
			var target := HOME_POSITION if scored else BASE_POSITIONS[destination]
			trajectory.move_to(avatar, target, animation_time, 16.0)

	animation_time = 0.9
	get_tree().create_timer(animation_time).timeout.connect(func():
		sync_runners(after_runners, true)
	)

func sync_runners(runners: Array, snap_to_base := true) -> void:
	for i in range(3):
		var token: RunnerToken = runners[i] if i < runners.size() else null
		var active := token != null
		runner_avatars[i].visible = active
		if active:
			var player: PlayerData = runner_players.get(token.player_id)
			if player != null:
				runner_avatars[i].setup(roster.profile_for_player(player))
			if snap_to_base:
				runner_avatars[i].position = BASE_POSITIONS[i]
			runner_motions[i].play(AnimeAvatar2D.Pose.IDLE, 0.2, AnimeAvatar2D.Pose.IDLE)
	runner_avatars[3].visible = false

func on_steal_started(from_base: int) -> void:
	if from_base < 0 or from_base >= 3:
		return
	if not runner_avatars[from_base].visible:
		return
	runner_motions[from_base].play(AnimeAvatar2D.Pose.STEAL, 0.9, AnimeAvatar2D.Pose.RUN)

func on_steal_result(from_base: int, success: bool, destination_base: int) -> void:
	if from_base < 0 or from_base >= 3:
		return
	if not runner_avatars[from_base].visible:
		return

	if success and destination_base >= 0 and destination_base < 3:
		var travel_start := runner_avatars[from_base].position
		runner_avatars[from_base].position = travel_start
		runner_motions[from_base].play(AnimeAvatar2D.Pose.RUN, 0.7, AnimeAvatar2D.Pose.IDLE)
		trajectory.move_to(runner_avatars[from_base], BASE_POSITIONS[destination_base], 0.65, 14.0)
	else:
		runner_motions[from_base].play(AnimeAvatar2D.Pose.OUT, 0.8, AnimeAvatar2D.Pose.IDLE)
		get_tree().create_timer(0.65).timeout.connect(func():
			runner_avatars[from_base].visible = false
		)

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

func _move_field(position: String, destination: Vector2, duration: float, hold: float) -> void:
	if not field_avatars.has(position):
		return
	var avatar: AnimeAvatar2D = field_avatars[position]
	trajectory.move_and_return(avatar, destination, duration, hold)

func _animate_active_fielders() -> void:
	for position in ["SS", "2B", "1B", "3B"]:
		_play_position(position, AnimeAvatar2D.Pose.CATCH, 0.55, AnimeAvatar2D.Pose.THROW)
