class_name DefensiveRunnerResolver
extends RefCounted

const RULE_VERSION := "defensive_runner_v1"
const EquipmentStatAdapterClass = preload("res://game/baseball/equipment_stat_adapter.gd")

var equipment_stat_adapter := EquipmentStatAdapterClass.new()

func resolve(fielding_resolution: Dictionary, base_runners: Array, outs: int, rng: RandomNumberGenerator, roster: RefCounted = null, skill_state: BaseballSkillState = null) -> Dictionary:
	if fielding_resolution.is_empty() or not bool(fielding_resolution.get("success", false)):
		return {"applied": false, "rule_version": RULE_VERSION}

	if bool(fielding_resolution.get("double_play", {}).get("success", false)):
		return {"applied": false, "rule_version": RULE_VERSION, "reason": "DOUBLE_PLAY_ALREADY_RESOLVED"}

	var defender_position := str(fielding_resolution.get("defender_position", ""))
	var defense_score := float(fielding_resolution.get("defense_score", 0.5))
	var result := {
		"applied": false,
		"force_out": false,
		"rundown": false,
		"slide": {},
		"rule_version": RULE_VERSION
	}

	# A ground-ball fielding success can turn into a force out when a runner is
	# already on first. The batter then reaches first safely if the force succeeds.
	if base_runners.size() > 0 and base_runners[0] != null and defender_position in ["P", "1B", "2B", "3B", "SS", "C"]:
		var runner: RunnerToken = base_runners[0]
		var runner_speed := _effective_runner_speed(runner, roster)
		if skill_state != null:
			runner_speed *= skill_state.get_stat_multiplier(runner.player_id, "speed")
		var force_chance := clamp(
			0.30
			+ defense_score * 0.34
			- runner_speed / 500.0
			+ (0.05 if defender_position in ["2B", "SS", "1B", "3B"] else 0.0),
			0.22,
			0.84
		)
		if skill_state != null:
			force_chance = clamp(force_chance + skill_state.get_action_modifier(runner.player_id, "defensive_cover"), 0.22, 0.90)
		var force_roll := rng.randf()
		var force_success := force_roll < force_chance
		result["force_out"] = force_success
		result["force_out_chance"] = force_chance
		result["force_out_roll"] = force_roll
		result["force_runner_index"] = 0
		result["force_base"] = 1
		result["force_runner_id"] = runner.player_id
		if force_success:
			result["applied"] = true
			result["final_result"] = "FORCE OUT"
			result["outs_added"] = 1
			result["reason"] = "FORCED AT SECOND"
			result["slide"] = _slide_result(runner, true, rng)
			return result

	# If no force was completed, a runner can be caught off the bag during the
	# transfer. This is intentionally uncommon and only affects an existing runner.
	var candidate_index := _rundown_candidate(base_runners)
	if candidate_index >= 0 and outs < 2:
		var rundown_runner: RunnerToken = base_runners[candidate_index]
		var rundown_speed := _effective_runner_speed(rundown_runner, roster)
		var rundown_chance := clamp(
			0.07 + defense_score * 0.10 + max(0.0, 1.0 - rundown_speed / 110.0) * 0.05,
			0.05,
			0.22
		)
		var rundown_roll := rng.randf()
		if rundown_roll < rundown_chance:
			var slide := _slide_result(rundown_runner, false, rng)
			result["rundown"] = true
			result["rundown_chance"] = rundown_chance
			result["rundown_roll"] = rundown_roll
			result["rundown_runner_index"] = candidate_index
			result["rundown_runner_id"] = rundown_runner.player_id
			result["slide"] = slide
			if bool(slide.get("safe", false)):
				result["applied"] = false
				result["final_result"] = "SAFE"
				result["reason"] = "SLIDE_BEATS_TAG"
			else:
				result["applied"] = true
				result["final_result"] = "RUNDOWN OUT"
				result["outs_added"] = 1
				result["reason"] = "RUNDOWN TAG"

	return result

func _rundown_candidate(base_runners: Array) -> int:
	for index in [2, 1, 0]:
		if index < base_runners.size() and base_runners[index] != null:
			return index
	return -1

func _effective_runner_speed(runner: RunnerToken, roster: RefCounted) -> float:
	if runner == null:
		return 0.0
	if roster != null and not runner.player_id.is_empty():
		var player := roster.get_player(runner.player_id)
		if player != null:
			return float(equipment_stat_adapter.get_stat(player.id, "speed", {"speed": int(player.effective_stat("speed"))}, roster))
	return float(runner.speed)

func _slide_result(runner: RunnerToken, force_play: bool, rng: RandomNumberGenerator) -> Dictionary:
	var headfirst := runner.speed >= 78.0
	var save_chance := clamp(0.20 + runner.speed / 320.0, 0.20, 0.48)
	if force_play:
		save_chance = 0.0
	var roll := rng.randf()
	return {
		"attempted": true,
		"style": "HEADFIRST" if headfirst else "FEET_FIRST",
		"safe": not force_play and roll < save_chance,
		"chance": save_chance,
		"roll": roll,
		"rule_version": RULE_VERSION
	}
}