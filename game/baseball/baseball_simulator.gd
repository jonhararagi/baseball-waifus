class_name BaseballSimulator
extends RefCounted

const ADVANTAGE := {
	"fire": {"ice": 0.08, "water": -0.08},
	"ice": {"nature": 0.08, "fire": -0.08},
	"nature": {"water": 0.08, "ice": -0.08},
	"water": {"fire": 0.08, "nature": -0.08},
	"light": {"darkness": 0.08},
	"darkness": {"light": 0.08}
}

const PITCH_RULE_VERSION := "pitch_v1"
const CONTACT_RULE_VERSION := "contact_v1"
const EquipmentStatAdapterClass = preload("res://game/baseball/equipment_stat_adapter.gd")
const BaseballSkillStateClass = preload("res://game/baseball/skill_state.gd")

var equipment_stat_adapter := EquipmentStatAdapterClass.new()

func element_modifier(attacker: String, defender: String) -> float:
	if ADVANTAGE.has(attacker):
		return float(ADVANTAGE[attacker].get(defender, 0.0))
	return 0.0

func timing_label(t: float) -> String:
	if t >= 0.95: return "PERFECT"
	if t >= 0.85: return "GREAT"
	if t >= 0.70: return "GOOD"
	if t >= 0.50: return "NORMAL"
	return "BAD"

func pitch_in_zone_probability(pitcher: PlayerData, pitch: Pitch, skill_state: BaseballSkillState = null) -> float:
	var control := float(effective_stat(pitcher, "control"))
	if skill_state != null:
		control *= skill_state.get_stat_multiplier(pitcher.id, "control")
	control = clamp(control / 100.0, 0.0, 1.2)
	var chance := pitch.zone_bias + (control - 0.50) * 0.18
	return clamp(chance, 0.65, 0.96)

func resolve_pitch(pitcher: PlayerData, pitch: Pitch, rng: RandomNumberGenerator, skill_state: BaseballSkillState = null) -> Dictionary:
	var chance := pitch_in_zone_probability(pitcher, pitch, skill_state)
	var roll := rng.randf()
	var in_zone := roll < chance
	return {
		"result": "IN_ZONE" if in_zone else "BALL",
		"in_zone": in_zone,
		"chance": chance,
		"roll": roll,
		"rule_version": PITCH_RULE_VERSION
	}

func contact_probability(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timing: float, skill_state: BaseballSkillState = null) -> float:
	var timing_score := clamp(timing, 0.0, 1.0)
	var contact := effective_stat(batter, "contact")
	var control := effective_stat(pitcher, "control")
	if skill_state != null:
		contact *= skill_state.get_stat_multiplier(batter.id, "contact")
		control *= skill_state.get_stat_multiplier(pitcher.id, "control")
	var contact_score := clamp(contact / 100.0, 0.0, 1.2)
	var control_score := clamp(control / 100.0, 0.0, 1.2)
	var chance := 0.20 + 0.45 * timing_score + 0.25 * contact_score - 0.25 * (pitch.difficulty + control_score * 0.25)
	chance += element_modifier(batter.element, pitcher.element)
	return clamp(chance, 0.05, 0.95)

func resolve_batted_ball(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timing: float, rng: RandomNumberGenerator, skill_state: BaseballSkillState = null) -> Dictionary:
	var label := timing_label(timing)
	var chance := contact_probability(batter, pitcher, pitch, timing, skill_state)
	if rng.randf() > chance:
		return {"result": "STRIKE", "bases": 0, "timing": label, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}

	var power := effective_stat(batter, "power")
	if skill_state != null:
		power *= skill_state.get_stat_multiplier(batter.id, "power")
	power /= 100.0
	var quality := clamp(timing * 0.72 + power * 0.28, 0.0, 1.0)
	var critical := effective_stat(batter, "critical") / 100.0
	var critical_chance := critical * 0.35 + max(0.0, timing - 0.85) * 0.6
	if skill_state != null:
		critical_chance += skill_state.get_outcome_bonus(batter.id, "critical")
	var roll := rng.randf()

	if timing < 0.50:
		return {"result": "FOUL" if roll < 0.35 else "FIELDING_CANDIDATE", "bases": 1, "timing": label, "contact_quality": quality, "fielding_required": true, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}

	var home_run_bonus := 0.0
	if skill_state != null:
		home_run_bonus = skill_state.get_outcome_bonus(batter.id, "home_run")
	if roll < clamp(critical_chance + home_run_bonus, 0.0, 0.95) and timing >= 0.85:
		return {"result": "HOME RUN", "bases": 4, "timing": label, "contact_quality": quality, "fielding_required": false, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}

	var distance := quality + rng.randf_range(-0.12, 0.12)
	if distance >= 0.82: return {"result": "TRIPLE", "bases": 3, "timing": label, "contact_quality": quality, "fielding_required": false, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}
	if distance >= 0.62: return {"result": "DOUBLE", "bases": 2, "timing": label, "contact_quality": quality, "fielding_required": false, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}
	if distance >= 0.36: return {"result": "SINGLE", "bases": 1, "timing": label, "contact_quality": quality, "fielding_required": false, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}
	return {"result": "FIELDING_CANDIDATE", "bases": 1, "timing": label, "contact_quality": quality, "fielding_required": true, "contact_chance": chance, "rule_version": CONTACT_RULE_VERSION}


func effective_stat(player: PlayerData, stat: String) -> int:
	if player == null:
		return 0
	var base_stats := {}
	for key in ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"]:
		base_stats[key] = int(player.get(key))
	return equipment_stat_adapter.get_stat(player.id, stat, base_stats)
