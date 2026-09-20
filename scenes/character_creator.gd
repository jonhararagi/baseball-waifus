extends Node2D

var profile := AvatarProfile.new()
var store := AvatarProfileStore.new()
var avatar: AnimeAvatar2D
var receiver: TrackingReceiver
var info: Label
var sliders := {}
var selectors := {}
var save_name := "designer_last.json"

func _ready() -> void:
	profile.display_name = "Prototype Player"
	profile.apply_body_preset("balanced")
	avatar = AnimeAvatar2D.new()
	avatar.position = Vector2(365, 430)
	avatar.setup(profile)
	add_child(avatar)

	receiver = TrackingReceiver.new()
	receiver.stale_timeout = 0.75
	add_child(receiver)
	receiver.attach(avatar)

	_build_ui()
	_sync_controls()

func _build_ui() -> void:
	var background := ColorRect.new()
	background.position = Vector2.ZERO
	background.size = Vector2(1280, 720)
	background.color = Color("#0e141b")
	add_child(background)
	move_child(background, 0)

	var preview := ColorRect.new()
	preview.position = Vector2(25, 25)
	preview.size = Vector2(650, 650)
	preview.color = Color("#17232f")
	add_child(preview)

	var title := Label.new()
	title.position = Vector2(40, 38)
	title.text = "BASEBALL WAIFUS • CHARACTER DESIGNER"
	title.add_theme_font_size_override("font_size", 24)
	add_child(title)

	info = Label.new()
	info.position = Vector2(40, 590)
	info.add_theme_font_size_override("font_size", 16)
	add_child(info)

	var panel := ColorRect.new()
	panel.position = Vector2(705, 25)
	panel.size = Vector2(550, 650)
	panel.color = Color("#18212a")
	add_child(panel)

	var panel_title := Label.new()
	panel_title.position = Vector2(25, 20)
	panel_title.text = "Diseño modular"
	panel_title.add_theme_font_size_override("font_size", 22)
	panel.add_child(panel_title)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(15, 60)
	scroll.size = Vector2(520, 470)
	panel.add_child(scroll)

	var root := VBoxContainer.new()
	root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(root)

	_add_option(root, "Cuerpo", ["slim", "balanced", "athletic", "curvy", "power"], "preset")
	_add_option(root, "Cabello", ["long", "short", "bob", "ponytail", "twin_tail"], "hair")
	_add_option(root, "Uniforme", ["standard", "sporty", "jacket", "sleeveless"], "uniform")
	_add_option(root, "Rostro", ["soft", "sharp", "round"], "face")
	_make_slider(root, "Altura", 0.75, 1.25, 0.01, "height")
	_make_slider(root, "Hombros", 0.75, 1.30, 0.01, "shoulder_width")
	_make_slider(root, "Cintura", 0.70, 1.35, 0.01, "waist_width")
	_make_slider(root, "Cadera", 0.70, 1.45, 0.01, "hip_width")
	_make_slider(root, "Pecho", 0.70, 1.45, 0.01, "bust")
	_make_slider(root, "Cabeza", 0.80, 1.20, 0.01, "head_scale")

	var actions := HBoxContainer.new()
	actions.position = Vector2(25, 545)
	actions.size = Vector2(500, 40)
	panel.add_child(actions)

	var random_button := Button.new()
	random_button.text = "🎲 Generar"
	random_button.pressed.connect(_randomize_profile)
	actions.add_child(random_button)

	var save_button := Button.new()
	save_button.text = "💾 Guardar"
	save_button.pressed.connect(_save_profile)
	actions.add_child(save_button)

	var load_button := Button.new()
	load_button.text = "📂 Cargar"
	load_button.pressed.connect(_load_profile)
	actions.add_child(load_button)

	var reset_button := Button.new()
	reset_button.text = "↺ Reset"
	reset_button.pressed.connect(_reset_profile)
	actions.add_child(reset_button)

	var pose_row := HBoxContainer.new()
	pose_row.position = Vector2(40, 640)
	pose_row.size = Vector2(630, 40)
	add_child(pose_row)
	for pair in [["Idle", AnimeAvatar2D.Pose.IDLE], ["Walk", AnimeAvatar2D.Pose.WALK], ["Run", AnimeAvatar2D.Pose.RUN], ["Bat", AnimeAvatar2D.Pose.BAT], ["Pitch", AnimeAvatar2D.Pose.PITCH], ["Catch", AnimeAvatar2D.Pose.CATCH], ["Win", AnimeAvatar2D.Pose.CELEBRATE]]:
		var button := Button.new()
		button.text = pair[0]
		button.pressed.connect(func(): avatar.set_pose(pair[1]))
		pose_row.add_child(button)

func _add_option(parent: Control, title: String, values: Array, key: String) -> void:
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = 38
	parent.add_child(row)
	var label := Label.new()
	label.text = title
	label.custom_minimum_size.x = 120
	row.add_child(label)
	var option := OptionButton.new()
	option.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for value in values:
		option.add_item(str(value))
	row.add_child(option)
	selectors[key] = option
	option.item_selected.connect(func(index: int): _option_changed(key, values[index]))

func _make_slider(parent: Control, title: String, min_value: float, max_value: float, step: float, key: String) -> void:
	var row := VBoxContainer.new()
	parent.add_child(row)
	var label := Label.new()
	label.text = title
	row.add_child(label)
	var slider := HSlider.new()
	slider.min_value = min_value
	slider.max_value = max_value
	slider.step = step
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(slider)
	sliders[key] = slider
	slider.value_changed.connect(func(value: float): profile.set(key, value))

func _make_color_picker(parent: Control, title: String, key: String) -> void:\n\tvar row := HBoxContainer.new()\n\trow.custom_minimum_size.y = 38\n\tparent.add_child(row)\n\tvar label := Label.new()\n\tlabel.text = title\n\tlabel.custom_minimum_size.x = 120\n\trow.add_child(label)\n\tvar picker := ColorPickerButton.new()\n\tpicker.color = profile.get(key)\n\tpicker.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\trow.add_child(picker)\n\tcolors[key] = picker\n\tpicker.color_changed.connect(func(value: Color): profile.set(key, value))\n\nfunc _option_changed(key: String, value: String) -> void:
	match key:
		"preset":
			profile.apply_body_preset(value)
		"hair":
			profile.hair_style = value
		"uniform":
			profile.uniform_style = value
		"face":
			profile.face_style = value
	_sync_controls()

func _sync_controls() -> void:
	for key in sliders.keys():
		sliders[key].set_value_no_signal(float(profile.get(key)))
	for key in selectors.keys():
		var option: OptionButton = selectors[key]
		var current := str(profile.get({"preset":"body_preset","hair":"hair_style","uniform":"uniform_style","face":"face_style"}[key]))
		for i in range(option.item_count):
			if option.get_item_text(i) == current:
				option.select(i)
				break
	avatar.setup(profile)
	_update_info()

func _update_info() -> void:
	var pose_name := AnimeAvatar2D.Pose.keys()[avatar.pose]
	info.text = "Perfil: %s    Pose: %s    Tracking: %s\nAltura %.2f  Hombros %.2f  Cintura %.2f  Cadera %.2f  Pecho %.2f  Cabeza %.2f\nUDP: 127.0.0.1:%d    Guardado: user://baseball_waifus/characters/%s" % [
		profile.display_name,
		pose_name,
		"ON" if receiver.tracking_active else "OFF",
		profile.height,
		profile.shoulder_width,
		profile.waist_width,
		profile.hip_width,
		profile.bust,
		profile.head_scale,
		receiver.port,
		save_name
	]

func _randomize_profile() -> void:
	profile.randomize_profile(Time.get_ticks_msec())
	_sync_controls()

func _save_profile() -> void:
	store.save_profile(profile, save_name)
	_update_info()

func _load_profile() -> void:
	var loaded := store.load_profile(save_name)
	if loaded != null:
		profile = loaded
		avatar.setup(profile)
		_sync_controls()

func _reset_profile() -> void:
	profile = AvatarProfile.new()
	profile.display_name = "Prototype Player"
	profile.apply_body_preset("balanced")
	avatar.setup(profile)
	_sync_controls()

func _process(_delta: float) -> void:
	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()
	if Input.is_key_pressed(KEY_1):
		avatar.set_pose(AnimeAvatar2D.Pose.IDLE)
	if Input.is_key_pressed(KEY_2):
		avatar.set_pose(AnimeAvatar2D.Pose.WALK)
	if Input.is_key_pressed(KEY_3):
		avatar.set_pose(AnimeAvatar2D.Pose.RUN)
	if Input.is_key_pressed(KEY_4):
		avatar.set_pose(AnimeAvatar2D.Pose.BAT)
	if Input.is_key_pressed(KEY_5):
		avatar.set_pose(AnimeAvatar2D.Pose.PITCH)
	if Input.is_key_pressed(KEY_6):
		avatar.set_pose(AnimeAvatar2D.Pose.CATCH)
	if Input.is_key_pressed(KEY_7):
		avatar.set_pose(AnimeAvatar2D.Pose.CELEBRATE)
	_update_info()
