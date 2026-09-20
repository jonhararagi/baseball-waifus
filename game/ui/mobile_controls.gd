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

	hit_button = _make_button("HIT", Vector2(0.72, 0.73), Vector2(0.97, 0.94), 30)
	steal_button = _make_button("STEAL", Vector2(0.55, 0.82), Vector2(0.70, 0.94), 18)
	hint_label = Label.new()
	hint_label.position = Vector2(24, 565)
	hint_label.add_theme_font_size_override("font_size", 16)
	hint_label.text = "TOCA HIT cuando la pelota entre en la zona."
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
	button.custom_minimum_size = Vector2(100, 64)
	button.visible = false
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

func set_steal_visible(visible_value: bool) -> void:
	if not mobile_active:
		steal_button.visible = false
		return
	steal_button.visible = visible_value

func _vibrate(milliseconds: int) -> void:
	if OS.has_feature("mobile"):
		Input.vibrate_handheld(milliseconds)
