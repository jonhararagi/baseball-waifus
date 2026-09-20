extends Node2D

var profile := AvatarProfile.new()
var store := AvatarProfileStore.new()
var avatar: AnimeAvatar2D
var receiver: TrackingReceiver
var info: Label
var sliders := {}
var selectors := {}
var colors := {}
var save_name := "designer_last.json"
var ai_request: HTTPRequest
var ai_status: Label
var ai_preview: TextureRect
var motion := AvatarMotionController.new()

func _ready() -> void:
	profile.display_name = "Prototype Player"
	profile.apply_body_preset("balanced")

	avatar = AnimeAvatar2D.new()
	avatar.position = Vector2(365, 430)
	avatar.setup(profile)
	add_child(avatar)
	motion.setup(avatar)

	receiver = TrackingReceiver.new()
	receiver.stale_timeout = 0.75
	add_child(receiver)
	receiver.attach(avatar)

	ai_request = HTTPRequest.new()
	ai_request.timeout = 190.0
	add_child(ai_request)
	ai_request.request_completed.connect(_on_ai_request_completed)

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
	move_child(preview, 1)

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
	_add_equipment_option(root, "Bate", ["bat_basic", "bat_power", "bat_precision", "bat_shadow"], "bat_style")
	_add_equipment_option(root, "Guantes", ["glove_basic", "glove_gold", "glove_precision", "glove_guardian"], "gloves_style")
	_add_equipment_option(root, "Gorra", ["cap_none", "cap_classic", "cap_visored", "cap_special"], "cap_style")
	_add_equipment_option(root, "Chaleco", ["vest_basic", "vest_power", "vest_guardian", "vest_light"], "vest_style")
	_add_equipment_option(root, "Falda", ["skirt_basic", "skirt_pleated", "skirt_sport", "skirt_special"], "skirt_style")
	_add_equipment_option(root, "Calzado", ["shoes_basic", "shoes_runner", "shoes_power", "shoes_ace"], "shoes_style")
	_make_slider(root, "Altura", 0.75, 1.25, 0.01, "height")
	_make_slider(root, "Hombros", 0.75, 1.30, 0.01, "shoulder_width")
	_make_slider(root, "Cintura", 0.70, 1.35, 0.01, "waist_width")
	_make_slider(root, "Cadera", 0.70, 1.45, 0.01, "hip_width")
	_make_slider(root, "Pecho", 0.70, 1.45, 0.01, "bust")
	_make_slider(root, "Cabeza", 0.80, 1.20, 0.01, "head_scale")
	_make_color_picker(root, "Piel", "skin")
	_make_color_picker(root, "Cabello", "hair")
	_make_color_picker(root, "Acento", "accent")
	_make_color_picker(root, "Ojos", "eye")

	var cap_check := CheckButton.new()
	cap_check.text = "Gorra de juego"
	cap_check.button_pressed = profile.show_cap
	cap_check.toggled.connect(func(value: bool): profile.show_cap = value)
	root.add_child(cap_check)
	selectors["cap"] = cap_check

	var actions := HBoxContainer.new()
	actions.position = Vector2(25, 545)
	actions.size = Vector2(500, 40)
	panel.add_child(actions)

	var random_button := Button.new()
	random_button.text = "Generar"
	random_button.pressed.connect(_randomize_profile)
	actions.add_child(random_button)

	var save_button := Button.new()
	save_button.text = "Guardar"
	save_button.pressed.connect(_save_profile)
	actions.add_child(save_button)

	var load_button := Button.new()
	load_button.text = "Cargar"
	load_button.pressed.connect(_load_profile)
	actions.add_child(load_button)

	var reset_button := Button.new()
	reset_button.text = "Reset"
	reset_button.pressed.connect(_reset_profile)
	actions.add_child(reset_button)

	var ai_button := Button.new()
	ai_button.text = "AI ref"
	ai_button.pressed.connect(_generate_ai_reference)
	actions.add_child(ai_button)

	var demo_button := Button.new()
	demo_button.text = "Demo roster"
	demo_button.pressed.connect(_load_demo_player)
	actions.add_child(demo_button)

	ai_status = Label.new()
	ai_status.position = Vector2(730, 575)
	ai_status.text = "AI reference: offline until Character AI bridge is running"
	add_child(ai_status)

	ai_preview = TextureRect.new()
	ai_preview.position = Vector2(45, 85)
	ai_preview.size = Vector2(220, 330)
	ai_preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ai_preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	ai_preview.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ai_preview.visible = false
	add_child(ai_preview)

	var pose_row := HBoxContainer.new()
	pose_row.position = Vector2(40, 640)
	pose_row.size = Vector2(630, 40)
	add_child(pose_row)

	var pose_data := [
		["Idle", AnimeAvatar2D.Pose.IDLE],
		["Walk", AnimeAvatar2D.Pose.WALK],
		["Run", AnimeAvatar2D.Pose.RUN],
		["Bat", AnimeAvatar2D.Pose.BAT],
		["Pitch", AnimeAvatar2D.Pose.PITCH],
		["Throw", AnimeAvatar2D.Pose.THROW],
		["Catch", AnimeAvatar2D.Pose.CATCH],
		["Steal", AnimeAvatar2D.Pose.STEAL],
		["Slide", AnimeAvatar2D.Pose.SLIDE],
		["Out", AnimeAvatar2D.Pose.OUT],
		["Win", AnimeAvatar2D.Pose.CELEBRATE],
		["Defeat", AnimeAvatar2D.Pose.DEFEAT]
	]
	for pair in pose_data:
		var button := Button.new()
		var pose_value: int = pair[1]
		button.text = str(pair[0])
		button.pressed.connect(func(): avatar.set_pose(pose_value))
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
	option.item_selected.connect(func(index: int): _option_changed(key, str(values[index])))

func _add_equipment_option(parent: Control, title: String, values: Array, key: String) -> void:
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
	selectors["equipment." + key] = option
	option.item_selected.connect(func(index: int):
		profile.equipment.set(key, str(values[index]))
		_sync_controls()
	)

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
	slider.value = float(profile.get(key))
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(slider)
	sliders[key] = slider
	slider.value_changed.connect(func(value: float): profile.set(key, value))

func _make_color_picker(parent: Control, title: String, key: String) -> void:
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = 38
	parent.add_child(row)

	var label := Label.new()
	label.text = title
	label.custom_minimum_size.x = 120
	row.add_child(label)

	var picker := ColorPickerButton.new()
	picker.color = profile.get(key)
	picker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(picker)
	colors[key] = picker
	picker.color_changed.connect(func(value: Color): profile.set(key, value))

func _option_changed(key: String, value: String) -> void:
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
		var slider: HSlider = sliders[key]
		slider.set_value_no_signal(float(profile.get(key)))

	var selector_properties := {
		"preset": "body_preset",
		"hair": "hair_style",
		"uniform": "uniform_style",
		"face": "face_style"
	}
	for key in selector_properties.keys():
		var option: OptionButton = selectors[key]
		var current := str(profile.get(selector_properties[key]))
		for i in range(option.item_count):
			if option.get_item_text(i) == current:
				option.select(i)
				break

	var cap: CheckButton = selectors["cap"]
	cap.set_pressed_no_signal(profile.show_cap)

	for key in colors.keys():
		var picker: ColorPickerButton = colors[key]
		picker.color = profile.get(key)

	_sync_equipment_selectors()
	avatar.setup(profile)
	_update_info()

func _sync_equipment_selectors() -> void:
	for key in ["bat_style", "gloves_style", "cap_style", "vest_style", "skirt_style", "shoes_style"]:
		var selector_key := "equipment." + key
		if not selectors.has(selector_key):
			continue
		var option: OptionButton = selectors[selector_key]
		var current := str(profile.equipment.get(key))
		for i in range(option.item_count):
			if option.get_item_text(i) == current:
				option.select(i)
				break

func _update_info() -> void:
	if info == null or receiver == null:
		return
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

func _generate_ai_reference() -> void:
	var payload := {
		"profile": profile.to_dictionary(),
		"preset": "baseball_waifus_ecchi"
	}
	var headers := ["Content-Type: application/json"]
	var body := JSON.stringify(payload)
	var err := ai_request.request("http://127.0.0.1:8766/generate", headers, HTTPClient.METHOD_POST, body)
	if err != OK:
		ai_status.text = "AI reference: no se pudo iniciar la petición"
	else:
		ai_status.text = "AI reference: generando..."

func _on_ai_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or response_code < 200 or response_code >= 300:
		ai_status.text = "AI reference: error HTTP %d" % response_code
		return
	var parsed = JSON.parse_string(body.get_string_from_utf8())
	if not (parsed is Dictionary) or not parsed.get("ok", false):
		ai_status.text = "AI reference: " + str(parsed.get("error", "error desconocido"))
		return
	var result_data: Dictionary = parsed.get("result", {})
	var encoded := str(result_data.get("image_base64", ""))
	var raw := Marshalls.base64_to_raw_array(encoded)
	var image := Image.new()
	var err := image.load_png_from_buffer(raw)
	if err != OK:
		err = image.load_jpg_from_buffer(raw)
	if err != OK:
		ai_status.text = "AI reference: imagen recibida pero no se pudo abrir"
		return
	ai_preview.texture = ImageTexture.create_from_image(image)
	ai_preview.visible = true
	ai_status.text = "AI reference: lista • seed %s" % str(result_data.get("seed", "?"))

func _load_demo_player() -> void:
	var player := PlayerData.new()
	player.id = "demo_ssr_fire_cf"
	player.display_name = "Demo Fire Batter"
	player.rarity = "SSR"
	player.element = "fire"
	player.position = "CF"
	player.specialization = "power"
	player.level = 25
	player.potential = 5
	profile = PlayerAvatarAdapter.from_player(player)
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
		motion.play(AnimeAvatar2D.Pose.CELEBRATE, 1.0)
	if Input.is_key_pressed(KEY_8):
		motion.play(AnimeAvatar2D.Pose.DEFEAT, 1.2)
	if Input.is_key_pressed(KEY_9):
		motion.play(AnimeAvatar2D.Pose.STEAL, 0.7)
	motion.update(_delta)
	_update_info()
