extends Node

const HubScript = preload("res://scenes/hub.gd")

func _ready() -> void:
	assert(HubScript.COMMENTS.size() == 10, "Starter character must have exactly 10 hub comments.")
	assert(HubScript.STARTER_ID == "bw001", "Starter character id changed unexpectedly.")
	assert(HubScript.MATCH_SCENE == "res://scenes/main.tscn", "Hub must route to the existing match scene.")
	assert(ResourceLoader.exists("res://assets/ui/hub_background.svg"), "Hub background asset is missing.")
	assert(ResourceLoader.exists("res://assets/ui/campaign_map_background.svg"), "Campaign map background asset is missing.")
	assert(ResourceLoader.exists("res://assets/ui/starter_card_frame.svg"), "Starter card frame asset is missing.")
	assert(ResourceLoader.exists("res://assets/characters/generated/bw001.svg"), "Starter character asset is missing.")
	assert(ResourceLoader.exists("res://assets/characters/expressions/bw001_neutral.svg"), "Starter neutral expression asset is missing.")
	assert(ResourceLoader.exists("res://game/ui/character_card.gd"), "Reusable character card script is missing.")
	assert(ResourceLoader.exists("res://game/ui/character_card.tscn"), "Reusable character card scene is missing.")
	assert(ResourceLoader.exists("res://game/ui/hub_menu_button.gd"), "Reusable hub menu button is missing.")
	assert(ResourceLoader.exists("res://game/ui/hub_menu_icon.gd"), "Vector hub icon component is missing.")
	assert(HubScript.MENU_ICON_IDS.size() == 9, "Hub navigation must expose nine primary icon ids.")
	print("Hub navigation structural checks passed.")
