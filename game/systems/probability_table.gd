class_name ProbabilityTable
extends Resource

@export var entries: Dictionary = {}

func set_weight(key: String, weight: float) -> void:
	entries[key] = max(0.0, weight)

func roll(rng: RandomNumberGenerator) -> String:
	var total := 0.0
	for value in entries.values():
		total += float(value)
	if total <= 0.0:
		return ""
	var pick := rng.randf_range(0.0, total)
	for key in entries.keys():
		pick -= float(entries[key])
		if pick <= 0.0:
			return str(key)
	return str(entries.keys()[-1])

func normalized() -> Dictionary:
	var total := 0.0
	for value in entries.values():
		total += float(value)
	if total <= 0.0:
		return {}
	var result := {}
	for key in entries.keys():
		result[key] = float(entries[key]) / total
	return result
