class_name DemoTeamFactory
extends RefCounted

static func create_player_team() -> BaseballTeamData:
	var team := BaseballTeamData.new()
	team.team_id = "demo_players"
	team.team_name = "Waifu Stars"

	var pitcher := _player("demo_pitcher", "Star Pitcher", "P", "pitcher", "ice")
	pitcher.pitch = 68
	pitcher.control = 66
	pitcher.defense = 62
	pitcher.stamina = 78
	team.add_player(pitcher, false)

	team.add_player(_player("demo_catcher", "Catcher", "C", "catcher", "water"), true)
	team.add_player(_player("demo_first_base", "First Base", "1B", "defender", "nature"), true)
	team.add_player(_player("demo_second_base", "Second Base", "2B", "contact", "light"), true)
	team.add_player(_player("demo_third_base", "Third Base", "3B", "power", "fire"), true)
	team.add_player(_player("demo_shortstop", "Shortstop", "SS", "contact", "lightning"), true)
	team.add_player(_player("demo_left_field", "Left Field", "LF", "defender", "ice"), true)
	team.add_player(_player("demo_center_field", "Center Field", "CF", "runner", "nature"), true)
	team.add_player(_player("demo_right_field", "Right Field", "RF", "power", "darkness"), true)
	team.add_player(_player("starter_ssr", "Starter", "DH", "power", "fire"), true)
	return team

static func create_rival_team() -> BaseballTeamData:
	var team := BaseballTeamData.new()
	team.team_id = "demo_rival"
	team.team_name = "Rival Aces"

	team.add_player(_player("rival_sr", "Rival Ace", "P", "pitcher", "ice"), true)
	team.add_player(_player("rival_catcher", "Rival Catcher", "C", "catcher", "water"), true)
	team.add_player(_player("rival_1b", "Rival First", "1B", "defender", "nature"), true)
	team.add_player(_player("rival_2b", "Rival Second", "2B", "contact", "light"), true)
	team.add_player(_player("rival_3b", "Rival Third", "3B", "power", "fire"), true)
	team.add_player(_player("rival_ss", "Rival Short", "SS", "contact", "lightning"), true)
	team.add_player(_player("rival_lf", "Rival Left", "LF", "defender", "ice"), true)
	team.add_player(_player("rival_cf", "Rival Center", "CF", "runner", "nature"), true)
	team.add_player(_player("rival_rf", "Rival Right", "RF", "power", "darkness"), true)
	team.add_player(_player("rival_dh", "Rival Designated Hitter", "DH", "power", "fire"), true)

	return team

static func _player(id: String, name: String, position: String, specialization: String, element: String) -> PlayerData:
	var player := PlayerData.new()
	player.id = id
	player.display_name = name
	player.position = position
	player.specialization = specialization
	player.element = element
	player.rarity = "SR"
	player.level = 10
	player.potential = 4
	player.power = 62
	player.contact = 60
	player.speed = 58
	player.defense = 64
	player.stamina = 72
	return player
