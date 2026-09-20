extends Node2D

var controls: MobileControls

func _ready() -> void:
	controls = MobileControls.new()
	add_child(controls)
	controls.set_mobile_active(true)
	controls.swing_requested.connect(_on_swing)
	controls.steal_requested.connect(_on_steal)

	var label := Label.new()
	label.position = Vector2(24, 32)
	label.text = "MOBILE CONTROLS TEST\nHIT = acción principal\nSTEAL = acción contextual"
	label.add_theme_font_size_override("font_size", 22)
	add_child(label)

func _on_swing() -> void:
	print("MOBILE SWING")

func _on_steal() -> void:
	print("MOBILE STEAL")