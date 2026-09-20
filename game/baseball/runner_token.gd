class_name RunnerToken
extends RefCounted

var player_id := ""
var display_name := ""
var team_id := ""
var speed := 0.0

static func from_player(player: PlayerData, team_id_value: String = "") -> RunnerToken:
	var token := RunnerToken.new()
	if player == null:
		return token
	token.player_id = player.id
	token.display_name = player.display_name
	token.team_id = team_id_value
	token.speed = player.effective_stat("speed")
	return token

func is_valid() -> bool:
	return not player_id.is_empty()
