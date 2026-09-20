class_name RewardResolver
extends RefCounted

var rng := RandomNumberGenerator.new()

func _init(seed_value: int = 0) -> void:
	if seed_value == 0:
		rng.randomize()
	else:
		rng.seed = seed_value

func roll_drop(table: DropTable) -> Dictionary:
	var item := table.roll(rng)
	return {"table_id": table.table_id, "table_version": table.version, "item": item}

func roll_many(table: DropTable, amount: int) -> Array:
	var results := []
	for i in range(max(0, amount)):
		results.append(roll_drop(table))
	return results
