class_name RunnerSystem
extends RefCounted

const RULE_VERSION := "runner_v2"

var rng := RandomNumberGenerator.new()

func _init() -> void:
	rng.randomize()

func attempt_steal(speed: float, defense: float, chance_modifier: float = 0.0, rng_override: RandomNumberGenerator = null) -> Dictionary:
	var chance := clamp(0.35 + speed / 250.0 - defense / 400.0 + chance_modifier, 0.10, 0.90)
	var source_rng := rng_override if rng_override != null else rng
	var roll := source_rng.randf()
	var success := roll < chance
	return {
		"success": success,
		"chance": chance,
		"roll": roll,
		"chance_modifier": chance_modifier,
		"result": "STEAL SUCCESS" if success else "CAUGHT STEALING",
		"rule_version": RULE_VERSION
	}
