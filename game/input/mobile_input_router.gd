class_name MobileInputRouter
extends Node

signal swing_requested
signal steal_requested

var mobile_mode := false
var touch_seen := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func enable_mobile_mode(enabled: bool = true) -> void:
	mobile_mode = enabled
	touch_seen = enabled

func handle_input(event: InputEvent) -> bool:
	if event is InputEventScreenTouch and event.pressed:
		touch_seen = true
		mobile_mode = true
		return true
	return false

func request_swing() -> void:
	emit_signal("swing_requested")

func request_steal() -> void:
	emit_signal("steal_requested")

func is_mobile_mode() -> bool:
	return mobile_mode
