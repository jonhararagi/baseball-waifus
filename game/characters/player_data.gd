class_name PlayerData
extends Resource

@export var id := ""
@export var display_name := ""
@export var rarity := "R"
@export var element := "neutral"
@export var position := "CF"
@export var specialization := "contact"
@export var level := 1
@export var potential := 3
@export var power := 50
@export var contact := 50
@export var speed := 50
@export var pitch := 50
@export var control := 50
@export var defense := 50
@export var critical := 10
@export var stamina := 70

func effective_stat(stat: String) -> float:
	return float(get(stat)) * (0.85 + 0.03 * potential)

func is_pitcher() -> bool:
	return position == "P"
