extends Node

const HubScript = preload("res://scenes/hub.gd")

func _ready() -> void:
	assert(HubScript.COMMENTS.size() == 10, "Starter character must have exactly 10 hub comments.")
	assert(HubScript.STARTER_ID == "bw001", "Starter character id changed unexpectedly.")
	assert(HubScript.MATCH_SCENE == "res://scenes/main.tscn", "Hub must route to the existing match scene.")
	print("Hub navigation structural checks passed.")
