class_name BaseballSituationEvaluator
extends RefCounted

## Lightweight rule-based baseball knowledge.
## No neural model, no per-frame simulation, no graphical inference.
## It converts a complete game snapshot into bounded tactical scores.

const TacticalCalculatorClass = preload("res://game/baseball/tactical_calculator.gd")

var tactical_calculator := TacticalCalculatorClass.new()

func evaluate(context: Dictionary, batter: PlayerData, pitcher: PlayerData, defensive_roster: Dictionary = {}) -> Dictionary:
	var outs := clampi(int(context.get("outs", 0)), 0, 2)
	var balls := clampi(int(context.get("balls", 0)), 0, 3)
	var strikes := clampi(int(context.get("strikes", 0)), 0, 2)
	var inning := maxi(int(context.get("inning", 1)), 1)
	var half := clampi(int(context.get("half", 0)), 0, 1)
	var score_batting := int(context.get("score_batting", 0))
	var score_fielding := int(context.get("score_fielding", 0))
	var bases: Array = context.get("bases", [false, false, false])

	var runners := 0
	for occupied in bases:
		if bool(occupied):
			runners += 1

	var score_diff := score_batting - score_fielding
	var late := inning >= int(context.get("max_innings", 3)) - 1
	var tying_or_leading := score_diff >= 0
	var two_strikes := strikes >= 2
	var full_count := balls >= 3 and strikes >= 2
	var force_runner := bool(bases[0]) if bases.size() > 0 else false
	var scoring_threat := bool(bases[2]) if bases.size() > 2 else false

	var batter_contact := float(batter.effective_stat("contact")) if batter != null else 0.0
	var batter_power := float(batter.effective_stat("power")) if batter != null else 0.0
	var batter_speed := float(batter.effective_stat("speed")) if batter != null else 0.0
	var pitcher_control := float(pitcher.effective_stat("control")) if pitcher != null else 0.0
	var pitcher_pitch := float(pitcher.effective_stat("pitch")) if pitcher != null else 0.0

	var contact_edge := clamp((batter_contact - pitcher_control) / 100.0, -1.0, 1.0)
	var power_edge := clamp((batter_power - pitcher_pitch) / 100.0, -1.0, 1.0)
	var steal_value := clamp((batter_speed - pitcher_control) / 100.0, -1.0, 1.0)

	var strike_pressure := 0.0
	if two_strikes:
		strike_pressure += 0.35
	if full_count:
		strike_pressure += 0.20
	if balls >= 2:
		strike_pressure -= 0.10

	var defensive_dp_value := 0.0
	if force_runner and outs < 2:
		defensive_dp_value = 0.55
	if runners >= 2 and outs < 2:
		defensive_dp_value += 0.20

	var offensive_steal_value := 0.0
	if runners > 0 and outs < 2:
		offensive_steal_value = clamp(0.20 + steal_value * 0.35, 0.0, 0.55)
		if scoring_threat:
			offensive_steal_value *= 0.65
		if two_strikes:
			offensive_steal_value *= 0.70

	var pitch_aggression := clamp(
		0.45
		+ contact_edge * 0.20
		+ (0.15 if strikes >= 2 else 0.0)
		- (0.18 if balls >= 3 else 0.0)
		+ (0.10 if late and not tying_or_leading else 0.0),
		0.10,
		0.90
	)

	var skill_priority := "NONE"
	if two_strikes:
		skill_priority = "CONTACT"
	elif score_diff < 0 and late:
		skill_priority = "POWER"
	elif runners > 0 and outs < 2:
		skill_priority = "RUNNER"

	return {
		"inning": inning,
		"half": half,
		"outs": outs,
		"balls": balls,
		"strikes": strikes,
		"score_diff": score_diff,
		"runners": runners,
		"force_runner": force_runner,
		"scoring_threat": scoring_threat,
		"late_game": late,
		"full_count": full_count,
		"two_strikes": two_strikes,
		"contact_edge": contact_edge,
		"power_edge": power_edge,
		"steal_value": steal_value,
		"offensive_steal_value": offensive_steal_value,
		"defensive_double_play_value": defensive_dp_value,
		"strike_pressure": strike_pressure,
		"pitch_aggression": pitch_aggression,
		"skill_priority": skill_priority,
		"batter_contact": batter_contact,
		"batter_power": batter_power,
		"batter_speed": batter_speed,
		"pitcher_control": pitcher_control,
		"pitcher_pitch": pitcher_pitch
	}

func preview_pitch(context: Dictionary, batter: PlayerData, pitcher: PlayerData, pitch: Pitch) -> Dictionary:
	if batter == null or pitcher == null or pitch == null:
		return {"valid": false}
	var timings: Array[float] = [0.35, 0.55, 0.72, 0.87, 0.97]
	var options := tactical_calculator.compare_tactics(batter, pitcher, pitch, timings)
	return {
		"valid": true,
		"pitch_type": pitch.type,
		"timing_options": options.get("options", [])
	}
