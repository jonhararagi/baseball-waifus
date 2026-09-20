extends Node2D

var profile := AvatarProfile.new()
var avatar: AnimeAvatar2D
var motion := AvatarMotionController.new()
var status: Label
var action_index := 0
var actions := [
	["Idle", AnimeAvatar2D.Pose.IDLE, 1.2],
	["Bat", AnimeAvatar2D.Pose.BAT, 0.9],
	["Pitch", AnimeAvatar2D.Pose.PITCH, 0.9],
	["Throw", AnimeAvatar2D.Pose.THROW, 0.8],
	["Catch", AnimeAvatar2D.Pose.CATCH, 0.8],
	["Steal", AnimeAvatar2D.Pose.STEAL, 0.8],
	["Slide", AnimeAvatar2D.Pose.SLIDE, 0.9],
	["Out", AnimeAvatar2D.Pose.OUT, 0.9],
	["Win", AnimeAvatar2D.Pose.CELEBRATE, 1.2],
	["Defeat", AnimeAvatar2D.Pose.DEFEAT, 1.2]
]

func _ready() -> void:
	var bg := ColorRect.new()
	bg.size = Vector2(1280, 720)
	bg.color = Color("#10161d")
	add_child(bg)
	move_child(bg, 0)
	profile.display_name = "Motion Test Player"
	profile.art_style = "ecchi"
	profile.apply_body_preset("shonen_soft")
	profile.equipment.cap_style = "cap_classic"
	profile.equipment.bat_style = "bat_power"
	profile.equipment.gloves_style = "glove_precision"
	profile.equipment.shoes_style = "shoes_runner"
	avatar = AnimeAvatar2D.new()
	avatar.position = Vector2(460, 450)
	avatar.setup(profile)
	add_child(avatar)
	motion.setup(avatar)
	var title := Label.new()
	title.position = Vector2(40, 35)
	title.text = "BASEBALL WAIFUS • MOTION TEST"
	title.add_theme_font_size_override("font_size", 28)
	add_child(title)
	status = Label.new()
	status.position = Vector2(760, 90)
	status.add_theme_font_size_override("font_size", 20)
	add_child(status)
	var help := Label.new()
	help.position = Vector2(760, 170)
	help.text = "AUTO: ciclo completo\n\nSPACE: siguiente acción\n1 Bat\n2 Pitch\n3 Throw\n4 Catch\n5 Steal\n6 Slide\n7 Out\n8 Win\n9 Defeat\n\nESC: salir"
	help.add_theme_font_size_override("font_size", 17)
	add_child(help)
	_play_next_action()

func _play_next_action() -> void:
	var item = actions[action_index]
	status.text = "Acción: %s\nDuración: %.1fs\nCuerpo: shonen_soft" % [str(item[0]), float(item[2])]
	motion.play(item[1], float(item[2]), AnimeAvatar2D.Pose.IDLE)
	action_index = (action_index + 1) % actions.size()

func _process(delta: float) -> void:
	motion.update(delta)
	if not motion.is_playing():
		_play_next_action()
	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()
	if Input.is_key_pressed(KEY_SPACE):
		_play_next_action()
	if Input.is_key_pressed(KEY_1): motion.play(AnimeAvatar2D.Pose.BAT, 0.9)
	if Input.is_key_pressed(KEY_2): motion.play(AnimeAvatar2D.Pose.PITCH, 0.9)
	if Input.is_key_pressed(KEY_3): motion.play(AnimeAvatar2D.Pose.THROW, 0.8)
	if Input.is_key_pressed(KEY_4): motion.play(AnimeAvatar2D.Pose.CATCH, 0.8)
	if Input.is_key_pressed(KEY_5): motion.play(AnimeAvatar2D.Pose.STEAL, 0.8)
	if Input.is_key_pressed(KEY_6): motion.play(AnimeAvatar2D.Pose.SLIDE, 0.9)
	if Input.is_key_pressed(KEY_7): motion.play(AnimeAvatar2D.Pose.OUT, 0.9)
	if Input.is_key_pressed(KEY_8): motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.2)
	if Input.is_key_pressed(KEY_9): motion.play(AnimeAvatar2D.Pose.DEFEAT, 1.2)