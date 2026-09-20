class_name BaseballTeamData
extends Resource

@export var team_id := ""
@export var team_name := "Baseball Team"
@export var players: Array[PlayerData] = []
@export var batting_order: Array[int] = []
@export var pitcher_index := -1

func add_player(player: PlayerData, batting := false) -> void:
	if player == null:
		return
	players.append(player)
	if batting:
		batting_order.append(players.size() - 1)
	if player.position == "P":
		pitcher_index = players.size() - 1

func player_at(position: String) -> PlayerData:
	for player in players:
		if player != null and player.position == position:
			return player
	return null

func player_by_id(player_id: String) -> PlayerData:
	for player in players:
		if player != null and player.id == player_id:
			return player
	return null

func batting_player(order_index: int) -> PlayerData:
	if batting_order.is_empty():
		return null
	var safe_index := posmod(order_index, batting_order.size())
	var player_index := batting_order[safe_index]
	if player_index < 0 or player_index >= players.size():
		return null
	return players[player_index]

func lineup_size() -> int:
	return batting_order.size()

func pitcher() -> PlayerData:
	if pitcher_index >= 0 and pitcher_index < players.size():
		return players[pitcher_index]
	return player_at("P")

func defensive_roster() -> Dictionary:
	var result := {}
	for position in ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"]:
		var player := player_at(position)
		if player != null:
			result[position] = player
	return result
