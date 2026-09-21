extends Node

const ButtonClass = preload("res://game/ui/hub_menu_button.gd")
const IconClass = preload("res://game/ui/hub_menu_icon.gd")
const HubScript = preload("res://scenes/hub.gd")

func _ready() -> void:
	assert(HubScript.MENU_ICON_IDS.size() == 9, "Hub must expose exactly nine primary navigation icons.")
	for icon_id in HubScript.MENU_ICON_IDS:
		assert(not str(icon_id).is_empty(), "Hub icon ids must not be empty.")
	var button := ButtonClass.new()
	add_child(button)
	button.setup("Historia", "Mapa de campaña", "history")
	assert(button.icon_id == "history")
	var icon := IconClass.new()
	add_child(icon)
	icon.setup("history")
	assert(icon.icon_id == "history")
	assert(ResourceLoader.exists("res://game/ui/hub_menu_button.gd"))
	assert(ResourceLoader.exists("res://game/ui/hub_menu_icon.gd"))
	for forbidden in ["⚾", "👥", "🏋", "🎒", "🎲", "🎁", "📖", "✨", "⚙"]:
		assert(not HubScript.COMMENTS.any(func(value): return str(value).contains(forbidden)), "Forbidden emoji leaked into Hub comments.")
	print("Hub iconography structural checks passed.")
