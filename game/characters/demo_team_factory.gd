class_name DemoTeamFactory
extends RefCounted

static func create_player_team() -> BaseballTeamData:
	var team := BaseballTeamData.new()
	team.team_id = "demo_players"
	team.team_name = "Waifu Stars"
	var batting_ids := ["bw005", "bw006", "bw008", "bw001", "bw003", "bw009", "bw004", "bw007", "bw010"]
	var pitcher := CharacterArchetypeCatalog.create_player("bw002")
	team.add_player(pitcher, false)
	for character_id in batting_ids:
		team.add_player(CharacterArchetypeCatalog.create_player(character_id), true)
	return team

static func create_rival_team() -> BaseballTeamData:
	var team := BaseballTeamData.new()
	team.team_id = "demo_rival"
	team.team_name = "Rival Aces"
	var batting_ids := ["bw011", "bw018", "bw025", "bw013", "bw020", "bw026", "bw023", "bw028", "bw015"]
	var pitcher := CharacterArchetypeCatalog.create_player("bw024")
	team.add_player(pitcher, false)
	for character_id in batting_ids:
		team.add_player(CharacterArchetypeCatalog.create_player(character_id), true)
	return team
