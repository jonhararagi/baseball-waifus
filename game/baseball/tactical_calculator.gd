class_name BaseballTacticalCalculator
extends RefCounted

## Lightweight, deterministic tactical calculator.
## It estimates bounded probabilities from the same gameplay inputs used by
## the baseball resolvers. It never rolls RNG and never decides the outcome.

const BaseballSimulatorClass = preload("res://game/baseball/baseball_simulator.gd")

var simulator := BaseballSimulatorClass.new()

func evaluate_batting(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timing: float, skill_state: BaseballSkillState = null) -> Dictionary:
	if batter == null or pitcher == null or pitch == null:
		return {"valid": false, "reason": "missing_input"}

	var contact := simulator.contact_probability(batter, pitcher, pitch, timing, skill_state)
	var timing_label := simulator.timing_label(timing)
	var effective_power := simulator.effective_stat(batter, "power")
	var effective_contact := simulator.effective_stat(batter, "contact")
	var effective_control := simulator.effective_stat(pitcher, "control")

	return {
		"valid": true,
		"timing": clamp(timing, 0.0, 1.0),
		"timing_label": timing_label,
		"contact_probability": contact,
		"miss_probability": 1.0 - contact,
		"effective_power": effective_power,
		"effective_contact": effective_contact,
		"opposing_control": effective_control,
		"pitch_difficulty": pitch.difficulty,
		"pitch_type": pitch.type
	}

func compare_tactics(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timings: Array[float], skill_state: BaseballSkillState = null) -> Dictionary:
	var evaluations: Array[Dictionary] = []
	for timing in timings:
		evaluations.append(evaluate_batting(batter, pitcher, pitch, float(timing), skill_state))
	return {
		"valid": true,
		"options": evaluations
	}
