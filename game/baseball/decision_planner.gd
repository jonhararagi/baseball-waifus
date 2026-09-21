class_name BaseballDecisionPlanner
extends RefCounted

## Lightweight offline planner.
## It does not simulate graphics or run a heavyweight AI model.
## It prepares deterministic RNG streams and a compact context snapshot while
## presentation is showing the field, characters and pitch preparation.

var _master_rng := RandomNumberGenerator.new()
var _plans: Dictionary = {}
var _sequence := 0

func _init(seed_value: int = 0) -> void:
	_master_rng.seed = seed_value if seed_value != 0 else 734287

func set_seed(seed_value: int) -> void:
	_master_rng.seed = seed_value

func prepare_plate_appearance(context: Dictionary) -> Dictionary:
	_sequence += 1
	var seed_base := _master_rng.randi()
	var plan := {
		"sequence": _sequence,
		"batter_id": str(context.get("batter_id", "")),
		"pitcher_id": str(context.get("pitcher_id", "")),
		"inning": int(context.get("inning", 0)),
		"half": int(context.get("half", 0)),
		"outs": int(context.get("outs", 0)),
		"balls": int(context.get("balls", 0)),
		"strikes": int(context.get("strikes", 0)),
		"score_batting": int(context.get("score_batting", 0)),
		"score_fielding": int(context.get("score_fielding", 0)),
		"bases": context.get("bases", [false, false, false]),
		"seeds": {
			"pitch": _derive_seed(seed_base, 11),
			"contact": _derive_seed(seed_base, 23),
			"defense": _derive_seed(seed_base, 37),
			"steal": _derive_seed(seed_base, 53)
		}
	}
	_plans[_sequence] = plan
	return plan.duplicate(true)

func current_plan() -> Dictionary:
	if _plans.is_empty():
		return {}
	var key = _plans.keys()[-1]
	return _plans[key].duplicate(true)

func rng_for(channel: String) -> RandomNumberGenerator:
	var plan := current_plan()
	var rng := RandomNumberGenerator.new()
	var seeds: Dictionary = plan.get("seeds", {})
	rng.seed = int(seeds.get(channel, 1))
	return rng

func describe_preparation() -> Dictionary:
	var plan := current_plan()
	if plan.is_empty():
		return {"ready": false}
	return {
		"ready": true,
		"sequence": plan.sequence,
		"channels": ["pitch", "contact", "defense", "steal"],
		"batter_id": plan.batter_id,
		"pitcher_id": plan.pitcher_id
	}

func clear_current() -> void:
	if _plans.is_empty():
		return
	var key = _plans.keys()[-1]
	_plans.erase(key)

func snapshot() -> Dictionary:
	return {
		"sequence": _sequence,
		"plans": _plans.duplicate(true)
	}

func restore(data: Dictionary) -> void:
	_sequence = int(data.get("sequence", 0))
	_plans = data.get("plans", {}).duplicate(true)

func _derive_seed(base_seed: int, salt: int) -> int:
	var value := int(base_seed)
	value = int((value * 1664525 + 1013904223 + salt * 374761393) & 0x7fffffff)
	return max(value, 1)
