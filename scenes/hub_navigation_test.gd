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
	print("Hub navigation structural checks passed.")
