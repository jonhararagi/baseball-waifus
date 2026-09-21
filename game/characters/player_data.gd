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

@export_category("Progression")
@export_range(0, 100, 1) var mood := 100
@export var equipment_ids: Dictionary = {}

@export_category("Charm")
@export_range(0, 100, 1) var charm := 0
@export var charm_primary_stat := "contact"
@export var charm_bonus_stats: Array = ["speed", "defense", "stamina"]

func effective_stat(stat: String) -> float:
    if charm_primary_stat != CharmSystem.primary_stat_for(specialization):
        CharmSystem.configure_player(self)
    var charm_adjusted := CharmSystem.stat_after_charm(self, stat)
    return float(charm_adjusted) * (0.85 + 0.03 * potential)

func charm_stat_bonus(stat: String) -> int:
    if charm_primary_stat != CharmSystem.primary_stat_for(specialization):
        CharmSystem.configure_player(self)
    return CharmSystem.stat_bonus(self, stat)

func is_pitcher() -> bool:
    return position == "P"
