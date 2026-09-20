extends Node2D

var avatar: AnimeBodyRig2D
var profile: AvatarProfile
var label: Label
var pose_index := 0
var pose_sequence := [
	AnimeAvatar2D.Pose.IDLE,
	AnimeAvatar2D.Pose.WALK,
	AnimeAvatar2D.Pose.RUN,
	AnimeAvatar2D.Pose.BAT,
	AnimeAvatar2D.Pose.PITCH,
	AnimeAvatar2D.Pose.THROW,
	AnimeAvatar2D.Pose.CATCH,
	AnimeAvatar2D.Pose.STEAL,
	AnimeAvatar2D.Pose.SLIDE,
	AnimeAvatar2D.Pose.OUT,
	AnimeAvatar2D.Pose.CELEBRATE,
	AnimeAvatar2D.Pose.DEFEAT
]
var auto_cycle := true
var cycle_clock := 0.0

func _ready() -> void:
	profile = AvatarProfile.new()
	profile.display_name = "Rig Test Player"
	profile.apply_body_preset("shonen_soft")
	profile.hair_style = "ponytail"
	profile.uniform_style = "sporty"
	profile.art_style = "rig"

	avatar = AnimeBodyRig2D.new()
	avatar.position = Vector2(390, 400)
	avatar.setup(profile)
	add_child(avatar)

	var title := Label.new()
	title.position = Vector2(45, 35)
	title.text = "ANIME BODY RIG TEST"
	title.add_theme_font_size_override("font_size", 28)
	add_child(title)

	label = Label.new()
	label.position = Vector2(45, 80)
	label.add_theme_font_size_override("font_size", 18)
	add_child(label)

	var help := Label.new()
	help.position = Vector2(770, 110)
	help.text = "SPACE  siguiente pose
P  alternar auto-ciclo
R  reiniciar secuencia
0-9  poses rápidas
Flechas  tracking simulado
Q/E  hombros
A/D  caderas"
	help.add_theme_font_size_override("font_size", 16)
	add_child(help)

	_set_pose(AnimeAvatar2D.Pose.IDLE)

func _set_pose(next_pose: AnimeAvatar2D.Pose) -> void:
	avatar.set_pose(next_pose)
	label.text = "Pose: %s
Auto: %s
Altura %.2f  Hombros %.2f  Cintura %.2f  Cadera %.2f" % [
		AnimeAvatar2D.Pose.keys()[avatar.pose],
		"ON" if auto_cycle else "OFF",
		profile.height,
		profile.shoulder_width,
		profile.waist_width,
		profile.hip_width
	]

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1:
				_set_pose(AnimeAvatar2D.Pose.IDLE)
			KEY_2:
				_set_pose(AnimeAvatar2D.Pose.WALK)
			KEY_3:
				_set_pose(AnimeAvatar2D.Pose.RUN)
			KEY_4:
				_set_pose(AnimeAvatar2D.Pose.BAT)
			KEY_5:
				_set_pose(AnimeAvatar2D.Pose.PITCH)
			KEY_6:
				_set_pose(AnimeAvatar2D.Pose.CATCH)
			KEY_7:
				_set_pose(AnimeAvatar2D.Pose.THROW)
			KEY_8:
				_set_pose(AnimeAvatar2D.Pose.STEAL)
			KEY_9:
				_set_pose(AnimeAvatar2D.Pose.SLIDE)
			KEY_0:
				_set_pose(AnimeAvatar2D.Pose.CELEBRATE)
			KEY_SPACE:
				pose_index = (pose_index + 1) % pose_sequence.size()
				_set_pose(pose_sequence[pose_index])
			KEY_P:
				auto_cycle = not auto_cycle
			KEY_R:
				pose_index = 0
				_set_pose(pose_sequence[0])
			KEY_ESCAPE:
				get_tree().quit()

func _process(delta: float) -> void:
	if Input.is_key_pressed(KEY_UP):
		avatar.tracking["pitch"] = clamp(float(avatar.tracking.get("pitch", 0.0)) + 0.02, -1.0, 1.0)
	if Input.is_key_pressed(KEY_DOWN):
		avatar.tracking["pitch"] = clamp(float(avatar.tracking.get("pitch", 0.0)) - 0.02, -1.0, 1.0)
	if Input.is_key_pressed(KEY_LEFT):
		avatar.tracking["yaw"] = clamp(float(avatar.tracking.get("yaw", 0.0)) - 0.02, -1.0, 1.0)
	if Input.is_key_pressed(KEY_RIGHT):
		avatar.tracking["yaw"] = clamp(float(avatar.tracking.get("yaw", 0.0)) + 0.02, -1.0, 1.0)
	if Input.is_key_pressed(KEY_Q):
		profile.shoulder_width = clamp(profile.shoulder_width - 0.01, 0.75, 1.30)
	if Input.is_key_pressed(KEY_E):
		profile.shoulder_width = clamp(profile.shoulder_width + 0.01, 0.75, 1.30)
	if Input.is_key_pressed(KEY_A):
		profile.hip_width = clamp(profile.hip_width - 0.01, 0.70, 1.45)
	if Input.is_key_pressed(KEY_D):
		profile.hip_width = clamp(profile.hip_width + 0.01, 0.70, 1.45)

	if auto_cycle:
		cycle_clock += delta
		if cycle_clock >= 1.0:
			cycle_clock = 0.0
			pose_index = (pose_index + 1) % pose_sequence.size()
			_set_pose(pose_sequence[pose_index])

	label.text = "Pose: %s
Auto: %s
Altura %.2f  Hombros %.2f  Cintura %.2f  Cadera %.2f" % [
		AnimeAvatar2D.Pose.keys()[avatar.pose],
		"ON" if auto_cycle else "OFF",
		profile.height,
		profile.shoulder_width,
		profile.waist_width,
		profile.hip_width
	]
