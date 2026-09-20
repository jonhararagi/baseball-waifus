class_name TrackingReceiver
extends Node

signal tracking_updated(data: Dictionary)
signal tracking_lost

@export var port := 8765
@export var stale_timeout := 0.75

const PROTOCOL_NAME := "baseball-waifus-tracking"
const PROTOCOL_VERSION := 1

var socket := PacketPeerUDP.new()
var avatar: AnimeAvatar2D
var last_packet_time := 0.0
var tracking_active := false
var last_sequence := -1
var invalid_packets := 0


func _ready() -> void:
	var err := socket.bind(port, "127.0.0.1")
	if err != OK:
		push_error("TrackingReceiver: no se pudo abrir UDP %d" % port)


func attach(target: AnimeAvatar2D) -> void:
	avatar = target


func _process(_delta: float) -> void:
	while socket.get_available_packet_count() > 0:
		var packet := socket.get_packet()
		var parsed = JSON.parse_string(packet.get_string_from_utf8())
		if not (parsed is Dictionary):
			invalid_packets += 1
			continue

		if not _validate_payload(parsed):
			invalid_packets += 1
			continue

		var sequence := int(parsed.get("sequence", -1))
		if sequence <= last_sequence:
			continue
		last_sequence = sequence

		var data: Dictionary = parsed.get("tracking", {})
		if avatar:
			avatar.apply_tracking(data)
		tracking_active = bool(data.get("tracking", false))
		last_packet_time = Time.get_ticks_msec() / 1000.0
		tracking_updated.emit(data)

	var now := Time.get_ticks_msec() / 1000.0
	if tracking_active and now - last_packet_time > stale_timeout:
		tracking_active = false
		if avatar:
			avatar.apply_tracking({
				"tracking": false,
				"yaw": 0.0,
				"pitch": 0.0,
				"roll": 0.0,
				"blink": 0.0,
				"mouth": 0.0
			})
		tracking_lost.emit()


func _validate_payload(payload: Dictionary) -> bool:
	if str(payload.get("protocol", "")) != PROTOCOL_NAME:
		return false
	if int(payload.get("version", -1)) != PROTOCOL_VERSION:
		return false
	if not (payload.get("tracking", {}) is Dictionary):
		return false
	var sequence = payload.get("sequence", -1)
	return sequence is int and int(sequence) >= 0
