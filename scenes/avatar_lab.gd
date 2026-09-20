extends Node2D

var avatar: AnimeAvatar2D
var receiver: TrackingReceiver
var info: Label

func _ready() -> void:
	_build_scene()

func _build_scene() -> void:
	var profile := AvatarProfile.new()
	profile.display_name = "Test Player"
	profile.height = 1.0
	profile.shoulder_width = 1.0
	profile.waist_width = 0.9
	profile.hip_width = 1.05
	profile.bust = 1.0
	profile.hair_style = "long"

	avatar = AnimeAvatar2D.new()
	avatar.position = Vector2(420, 390)
	avatar.setup(profile)
	add_child(avatar)

	receiver = TrackingReceiver.new()
	add_child(receiver)
	receiver.attach(avatar)

	var panel := ColorRect.new()
	panel.position = Vector2(760, 90)
	panel.size = Vector2(450, 520)
	panel.color = Color("#18212a")
	add_child(panel)

	var title := Label.new()
	title.position = Vector2(25, 20)
	title.text = "ANIME CHARACTER LAB"
	title.add_theme_font_size_override("font_size", 26)
	panel.add_child(title)

	info = Label.new()
	info.position = Vector2(25, 75)
	info.add_theme_font_size_override("font_size", 18)
	panel.add_child(info)

	var help := Label.new()
	help.position = Vector2(25, 310)
	help.text = "1 Idle   2 Walk   3 Run\n4 Bat   5 Pitch   6 Catch\n7 Celebrate   8 Hit reaction\n\nFlechas: cuerpo\n↑/↓ altura   ←/→ cintura\nA/D cadera   W/S hombros\n\nESC: salir"
	help.add_theme_font_size_override("font_size", 16)
	panel.add_child(help)

	info.text = "Perfil: %s\nAltura: %.2f\nCintura: %.2f\nCadera: %.2f\nHombros: %.2f\n\nUDP tracking: 127.0.0.1:%d" % [profile.display_name, profile.height, profile.waist_width, profile.hip_width, profile.shoulder_width, receiver.port]

func _process(_delta: float) -> void:
	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()
	var p := avatar.profile
	if Input.is_key_pressed(KEY_UP):
		p.height = clamp(p.height + 0.01, 0.75, 1.25)
	if Input.is_key_pressed(KEY_DOWN):
		p.height = clamp(p.height - 0.01, 0.75, 1.25)
	if Input.is_key_pressed(KEY_LEFT):
		p.waist_width = clamp(p.waist_width - 0.01, 0.70, 1.35)
	if Input.is_key_pressed(KEY_RIGHT):
		p.waist_width = clamp(p.waist_width + 0.01, 0.70, 1.35)
	if Input.is_key_pressed(KEY_A):
		p.hip_width = clamp(p.hip_width - 0.01, 0.70, 1.45)
	if Input.is_key_pressed(KEY_D):
		p.hip_width = clamp(p.hip_width + 0.01, 0.70, 1.45)
	if Input.is_key_pressed(KEY_W):
		p.shoulder_width = clamp(p.shoulder_width + 0.01, 0.75, 1.30)
	if Input.is_key_pressed(KEY_S):
		p.shoulder_width = clamp(p.shoulder_width - 0.01, 0.75, 1.30)

	if Input.is_key_pressed(KEY_1): avatar.set_pose(AnimeAvatar2D.Pose.IDLE)
	if Input.is_key_pressed(KEY_2): avatar.set_pose(AnimeAvatar2D.Pose.WALK)
	if Input.is_key_pressed(KEY_3): avatar.set_pose(AnimeAvatar2D.Pose.RUN)
	if Input.is_key_pressed(KEY_4): avatar.set_pose(AnimeAvatar2D.Pose.BAT)
	if Input.is_key_pressed(KEY_5): avatar.set_pose(AnimeAvatar2D.Pose.PITCH)
	if Input.is_key_pressed(KEY_6): avatar.set_pose(AnimeAvatar2D.Pose.CATCH)
	if Input.is_key_pressed(KEY_7): avatar.set_pose(AnimeAvatar2D.Pose.CELEBRATE)
	if Input.is_key_pressed(KEY_8): avatar.set_pose(AnimeAvatar2D.Pose.HIT_REACTION)

	info.text = "Perfil: %s\nAltura: %.2f\nCintura: %.2f\nCadera: %.2f\nHombros: %.2f\nPecho: %.2f\nPose: %s\n\nUDP tracking: 127.0.0.1:%d" % [p.display_name, p.height, p.waist_width, p.hip_width, p.shoulder_width, p.bust, AnimeAvatar2D.Pose.keys()[avatar.pose], receiver.port]
