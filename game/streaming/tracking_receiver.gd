class_name TrackingReceiver
extends Node

@export var port := 8765
var socket := PacketPeerUDP.new()
var avatar: AnimeAvatar2D

func _ready() -> void:
	var err := socket.bind(port, "127.0.0.1")
	if err != OK:
		push_error("TrackingReceiver: no se pudo abrir UDP %d" % port)

func attach(target: AnimeAvatar2D) -> void:
	avatar = target

func _process(_delta: float) -> void:
	while socket.get_available_packet_count() > 0:
		var packet := socket.get_packet()
		var payload := packet.get_string_from_utf8()
		var parsed = JSON.parse_string(payload)
		if parsed is Dictionary and avatar:
			avatar.apply_tracking(parsed)
