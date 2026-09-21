class_name DoublePlayResolver
extends RefCounted

const RULE_VERSION := "double_play_v1"

func resolve(event: BattedBallEvent, fielding_resolution: Dictionary, base_runners: Array, outs: int, rng: RandomNumberGenerator, skill_state: BaseballSkillState = null, defender_id: String = "") -> Dictionary:
	if event == null or fielding_resolution.is_empty():
		return {"eligible": false, "success": false, "rule_version": RULE_VERSION}
	if not bool(fielding_resolution.get("success", false)):
		return {"eligible": false, "success": false, "rule_version": RULE_VERSION}
	if outs >= 2:
		return {"eligible": false, "success": false, "rule_version": RULE_VERSION}
	if base_runners.size() < 1 or base_runners[0] == null:
		return {"eligible": false, "success": false, "rule_version": RULE_VERSION}

	var defender_position := str(fielding_resolution.get("defender_position", ""))
	if defender_position not in ["1B", "2B", "3B", "SS"]:
		return {"eligible": false, "success": false, "rule_version": RULE_VERSION}

	var defense_score := float(fielding_resolution.get("defense_score", 0.5))
	var contact_quality := float(fielding_resolution.get("contact_quality", 0.5))
	var chance := clamp(0.10 + defense_score * 0.12 + (1.0 - contact_quality) * 0.08, 0.08, 0.34)
	if skill_state != null and not defender_id.is_empty():
		chance = clamp(chance + skill_state.get_action_modifier(defender_id, "double_play"), 0.08, 0.50)
	var roll := rng.randf()
	var success := roll < chance

	var assist_position := defender_position
	var pivot_position := "2B" if defender_position in ["SS", "3B"] else "SS"
	if defender_position == "2B":
		pivot_position = "SS"
	if defender_position == "1B":
		pivot_position = "2B"

	return {
		"eligible": true,
		"success": success,
		"chance": chance,
		"roll": roll,
		"rule_version": RULE_VERSION,
		"outs_added": 2 if success else 1,
		"assist_position": assist_position,
		"pivot_position": pivot_position,
		"putout_position": "1B",
		"reason": "DOUBLE PLAY" if success else "DP FAILED"
	}
