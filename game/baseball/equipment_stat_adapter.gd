class_name EquipmentStatAdapter
extends RefCounted

## Read-only gameplay adapter.
## It exposes effective stats without giving presentation or UI authority over
## baseball outcomes.

const EquipmentServiceClass = preload("res://game/progression/equipment_service.gd")
const RosterClass = preload("res://game/characters/character_roster_store.gd")

func get_effective_stats(character_id: String, base_stats: Dictionary, roster: RefCounted = null) -> Dictionary:
	var service := EquipmentServiceClass.new()
	return service.get_effective_stats(character_id, base_stats, roster)

func get_stat(character_id: String, stat: String, base_stats: Dictionary, roster: RefCounted = null) -> int:
	var stats := get_effective_stats(character_id, base_stats, roster)
	return int(stats.get(stat, base_stats.get(stat, 0)))
