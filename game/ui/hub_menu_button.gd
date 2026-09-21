class_name BaseballHubMenuButton
extends Control

signal pressed

var button: Button
var icon_view: BaseballHubMenuIcon
var title_label: Label
var subtitle_label: Label
var icon_id := ""
var accent := Color("#ffd76a")
var _hovered := false

func _ready() -> void:
	custom_minimum_size = Vector2(232, 98)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build()

func setup(title: String, subtitle: String, new_icon_id: String, new_accent: Color = Color("#ffd76a")) -> void:
	icon_id = new_icon_id
	accent = new_accent
	if button == null:
		_build()
	title_label.text = title.to_upper()
	subtitle_label.text = subtitle
	icon_view.setup(icon_id, accent)
	queue_redraw()

func _build() -> void:
	button = Button.new()
	button.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	button.text = ""
	button.focus_mode = Control.FOCUS_ALL
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_stylebox_override("normal", _style("#202b49", "#536a9a", 1, 14))
	button.add_theme_stylebox_override("hover", _style("#2d3a61", "#ffd76a", 2, 14))
	button.add_theme_stylebox_override("pressed", _style("#17213a", "#f06d91", 2, 14))
	button.add_theme_stylebox_override("focus", _style("#27345a", "#9bb7e8", 2, 14))
	button.pressed.connect(_on_pressed)
	button.mouse_entered.connect(_on_mouse_entered)
	button.mouse_exited.connect(_on_mouse_exited)
	add_child(button)

	icon_view = BaseballHubMenuIcon.new()
	icon_view.position = Vector2(14, 27)
	icon_view.size = Vector2(44, 44)
	icon_view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(icon_view)

	title_label = Label.new()
	title_label.position = Vector2(68, 20)
	title_label.size = Vector2(150, 27)
	title_label.add_theme_font_size_override("font_size", 15)
	title_label.add_theme_color_override("font_color", Color("#eef4ff"))
	title_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.position = Vector2(68, 48)
	subtitle_label.size = Vector2(150, 35)
	subtitle_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle_label.add_theme_font_size_override("font_size", 11)
	subtitle_label.add_theme_color_override("font_color", Color("#9bb7e8"))
	subtitle_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(subtitle_label)

func _on_pressed() -> void:
	pressed.emit()

func _on_mouse_entered() -> void:
	_hovered = true
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2(1.025, 1.025), 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	queue_redraw()

func _on_mouse_exited() -> void:
	_hovered = false
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	queue_redraw()

func _style(fill: String, border: String, width: int, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(fill)
	style.border_color = Color(border)
	style.set_border_width_all(width)
	style.set_corner_radius_all(radius)
	style.shadow_color = Color(0, 0, 0, 0.25)
	style.shadow_size = 8
	return style

func _draw() -> void:
	if not _hovered:
		return
	draw_line(Vector2(8, 14), Vector2(8, 84), accent, 2.0)
