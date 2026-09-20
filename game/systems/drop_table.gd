class_name DropTable
extends Resource

@export var table_id := ""
@export var version := 1
@export var weights: Dictionary = {}

func roll(rng: RandomNumberGenerator) -> String:
	var table := ProbabilityTable.new()
	table.entries = weights.duplicate(true)
	return table.roll(rng)

func expected_percentages() -> Dictionary:
	var table := ProbabilityTable.new()
	table.entries = weights.duplicate(true)
	return table.normalized()
