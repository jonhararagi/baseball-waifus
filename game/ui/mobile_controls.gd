class_name MobileControls
extends CanvasLayer

signal swing_requested
signal steal_requested

var hit_button: Button
var steal_button: Button
var hint_label: Label
var root: Control
var mobile_active := false

func _ready() -> void:
	layer = 90
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	hit_button = _make_button("BATEAR", Vector2(0.72, 0.70), Vector2(0.97, 0.94), 25)
	hit_button.icon = load("res://assets/ui/baseball_waifus_icon.svg")
	hit_button.expand_icon = true
	steal_button = _make_button("ROBAR", Vector2(0.54, 0.80), Vector2(0.70, 0.94), 18)

	hint_label = Label.new()
	hint_label.position = Vector2(24, 565)
	hint_label.add_theme_font_size_override("font_size", 16)
	hint_label.add_theme_color_override("font_color", Color(0.94, 0.97, 1.0, 0.92))
	hint_label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.65))
	hint_label.add_theme_constant_override("shadow_offset_x", 2)
	hint_label.add_theme_constant_override("shadow_offset_y", 2)
	hint_label.text = "TOCA BATEAR cuando la pelota entre en la zona."
	hint_label.visible = false
	root.add_child(hint_label)

	hit_button.pressed.connect(func():
		swing_requested.emit()
		_vibrate(25)
	)
	steal_button.pressed.connect(func():
		steal_requested.emit()
		_vibrate(20)
	)
	steal_button.visible = false

func _apply_button_theme(button: Button, accent: Color) -> void:
	var normal := BaseballUITheme.panel_style(Color(0.06, 0.08, 0.14, 0.96), Color(accent.r, accent.g, accent.b, 0.70), 20, 2)
	var hover := BaseballUITheme.panel_style(Color(0.10, 0.13, 0.22, 0.98), Color(accent.r, accent.g, accent.b, 0.92), 20, 2)
	var pressed := BaseballUITheme.panel_style(Color(0.16, 0.19, 0.30, 1.0), Color.WHITE, 20, 3)
	var disabled := BaseballUITheme.panel_style(Color(0.04, 0.05, 0.08, 0.72), Color(0.4, 0.45, 0.55, 0.35), 20, 1)
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("hover", hover)
	button.add_theme_stylebox_override("pressed", pressed)
	button.add_theme_stylebox_override("disabled", disabled)
	button.add_theme_color_override("font_color", Color(0.98, 0.99, 1.0))
	button.add_theme_color_override("font_hover_color", Color.WHITE)
	button.add_theme_color_override("font_pressed_color", Color.WHITE)
	button.add_theme_color_override("font_disabled_color", Color(0.55, 0.60, 0.68))

func _make_button(text_value: String, min_anchor: Vector2, max_anchor: Vector2, font_size: int) -> Button:
	var button := Button.new()
	button.text = text_value
	button.anchor_left = min_anchor.x
	button.anchor_top = min_anchor.y
	button.anchor_right = max_anchor.x
	button.anchor_bottom = max_anchor.y
	button.offset_left = 0
	button.offset_top = 0
	button.offset_right = 0
	button.offset_bottom = 0
	button.add_theme_font_size_override("font_size", font_size)
	button.custom_minimum_size = Vector2(110, 70)
	button.visible = false
	button.focus_mode = Control.FOCUS_NONE
	_apply_button_theme(button, Color(1.0, 0.46, 0.58))
	root.add_child(button)
	return button

func set_mobile_active(active: bool) -> void:
	mobile_active = active
	hit_button.visible = active
	hint_label.visible = active

func set_swing_enabled(enabled: bool) -> void:
	if not mobile_active:
		return
	hit_button.disabled = not enabled
	if enabled:
		hit_button.tooltip_text = "Batear ahora"
	else:
		hit_button.tooltip_text = "Espera el lanzamiento"

func set_steal_visible(visible_value: bool) -> void:
	if not mobile_active:
		steal_button.visible = false
		return
	steal_button.visible = visible_value

func _vibrate(milliseconds: int) -> void:
	if OS.has_feature("mobile"):
		Input.vibrate_handheld(milliseconds)
