class_name TrackingReceiver
extends Node

signal tracking_updated(data: Dictionary)
signal tracking_lost

@export var port := 8765
@export var stale_timeout := 0.75

var socket := PacketPeerUDP.new()
var avatar: AnimeAvatar2D
var last_packet_time := 0.0
var tracking_active := false


func _ready() -> void:
	var err := socket.bind(port, "127.0.0.1")
	if err != OK:
		push_error("TrackingReceiver: no se pudo abrir UDP %d" % port)


func attach(target: AnimeAvatar2D) -> void:
	avatar = target


func _process(_delta: float) -> void:
	while socket.get_available_packet_count() > 0:
		var packet := socket.get_packet()
		var payload_text := packet.get_string_from_utf8()
		var parsed = JSON.parse_string(payload_text)
		if not (parsed is Dictionary):
			continue

		var data: Dictionary = parsed.get("tracking", parsed)
		if avatar:
			avatar.apply_tracking(data)
		tracking_active = bool(data.get("tracking", false))
		last_packet_time = Time.get_ticks_msec() / 1000.0
		tracking_updated.emit(data)

	var now := Time.get_ticks_msec() / 1000.0
	if tracking_active and now - last_packet_time > stale_timeout:
		tracking_active = false
		if avatar:
			avatar.apply_tracking({"tracking": false, "yaw": 0.0, "pitch": 0.0, "roll": 0.0, "blink": 0.0, "mouth": 0.0})
		tracking_lost.emit()
