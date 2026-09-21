class_name BaseballCampaignMapView
extends Control

signal map_selected(activity_id: String)

var mode := "normal"
var node_buttons: Array[Button] = []
var title_label: Label
var subtitle_label: Label
var selected_activity := ""
var selection_label: Label

const NODE_POSITIONS := [
	Vector2(74, 142), Vector2(218, 94), Vector2(365, 156), Vector2(510, 88),
	Vector2(655, 150), Vector2(790, 226), Vector2(675, 306), Vector2(515, 252),
	Vector2(342, 318), Vector2(180, 264)
]

func _ready() -> void:
	custom_minimum_size = Vector2(960, 420)
	_build()

func _build() -> void:
	var background := TextureRect.new()
	background.texture = load("res://assets/ui/campaign_map_background.svg")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var shade := ColorRect.new()
	shade.color = Color(0.04, 0.06, 0.14, 0.12)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(shade)

	title_label = Label.new()
	title_label.text = "ZONA 01  •  PRIMERA TEMPORADA"
	title_label.position = Vector2(24, 14)
	title_label.add_theme_font_size_override("font_size", 21)
	title_label.add_theme_color_override("font_color", Color("#fff1c2"))
	add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.text = "NORMAL"
	subtitle_label.position = Vector2(26, 48)
	subtitle_label.add_theme_font_size_override("font_size", 13)
	subtitle_label.add_theme_color_override("font_color", Color("#a9d8ee"))
	add_child(subtitle_label)

	var badge := Label.new()
	badge.text = "10 CAMPOS  •  1 JEFE"
	badge.position = Vector2(730, 18)
	badge.add_theme_font_size_override("font_size", 12)
	badge.add_theme_color_override("font_color", Color("#ffd76a"))
	add_child(badge)

	for i in range(10):
		var node := Button.new()
		node.text = str(i + 1).pad_zeros(2) if i < 3 else "LOCK"
		node.position = NODE_POSITIONS[i]
		node.size = Vector2(74, 52)
		node.disabled = i >= 3
		node.tooltip_text = "Campo %02d" % (i + 1)
		node.add_theme_font_size_override("font_size", 16)
		node.add_theme_stylebox_override("normal", _style("#233b58", "#ffe18a", 2, 18))
		node.add_theme_stylebox_override("hover", _style("#3b5a7b", "#fff6c9", 3, 18))
		node.add_theme_stylebox_override("pressed", _style("#1b2d48", "#f06d91", 3, 18))
		node.add_theme_stylebox_override("disabled", _style("#172438", "#596579", 1, 18))
		if i < 3:
			node.pressed.connect(_select.bind("zone_01_map_%02d" % (i + 1)))
			node.mouse_entered.connect(func(): _hover(node, true))
			node.mouse_exited.connect(func(): _hover(node, false))
		add_child(node)
		node_buttons.append(node)

	var boss := Button.new()
	boss.text = "★  DEMON KING"
	boss.position = Vector2(765, 74)
	boss.size = Vector2(165, 54)
	boss.disabled = true
	boss.add_theme_font_size_override("font_size", 14)
	boss.add_theme_stylebox_override("disabled", _style("#2b2035", "#a36cae", 2, 18))
	add_child(boss)

	selection_label = Label.new()
	selection_label.text = "Selecciona un campo disponible para comenzar."
	selection_label.position = Vector2(24, 372)
	selection_label.add_theme_font_size_override("font_size", 13)
	selection_label.add_theme_color_override("font_color", Color("#d9e8f2"))
	add_child(selection_label)

	queue_redraw()

func _hover(button: Button, hovered: bool) -> void:
	var target := Vector2(1.05, 1.05) if hovered else Vector2.ONE
	var tween := create_tween()
	tween.tween_property(button, "scale", target, 0.12)

func set_mode(new_mode: String) -> void:
	mode = new_mode
	subtitle_label.text = new_mode.to_upper()
	selection_label.text = "Dificultad %s. Selecciona un campo disponible." % new_mode.to_upper()
	queue_redraw()

func _select(activity_id: String) -> void:
	selected_activity = activity_id
	selection_label.text = "Campo %s seleccionado • listo para jugar." % activity_id.replace("zone_01_map_", "")
	map_selected.emit(activity_id)

func _style(fill: String, border: String, width: int, radius: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(fill)
	s.border_color = Color(border)
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	s.shadow_color = Color(0, 0, 0, 0.30)
	s.shadow_size = 6
	return s

func _draw() -> void:
	for i in range(NODE_POSITIONS.size() - 1):
		var a: Vector2 = NODE_POSITIONS[i] + Vector2(37, 26)
		var b: Vector2 = NODE_POSITIONS[i + 1] + Vector2(37, 26)
		draw_line(a, b, Color("#f0d58a", 0.42), 5)
		draw_line(a, b, Color("#ffffff", 0.12), 1)
