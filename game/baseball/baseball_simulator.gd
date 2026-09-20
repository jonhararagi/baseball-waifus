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

func contact_probability(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timing: float) -> float:
	var timing_score := clamp(timing, 0.0, 1.0)
	var contact_score := clamp(batter.effective_stat("contact") / 100.0, 0.0, 1.2)
	var control := clamp(pitcher.effective_stat("control") / 100.0, 0.0, 1.2)
	var chance := 0.20 + 0.45 * timing_score + 0.25 * contact_score - 0.25 * (pitch.difficulty + control * 0.25)
	chance += element_modifier(batter.element, pitcher.element)
	return clamp(chance, 0.05, 0.95)

func resolve_batted_ball(batter: PlayerData, pitcher: PlayerData, pitch: Pitch, timing: float, rng: RandomNumberGenerator) -> Dictionary:
	var label := timing_label(timing)
	var chance := contact_probability(batter, pitcher, pitch, timing)
	if rng.randf() > chance:
		return {"result": "STRIKE", "bases": 0, "timing": label}

	var power := batter.effective_stat("power") / 100.0
	var quality := clamp(timing * 0.72 + power * 0.28, 0.0, 1.0)
	var critical := batter.effective_stat("critical") / 100.0
	var critical_chance := critical * 0.35 + max(0.0, timing - 0.85) * 0.6
	var roll := rng.randf()

	if timing < 0.50:
		return {"result": "FOUL" if roll < 0.35 else "OUT", "bases": 0, "timing": label}

	if roll < critical_chance and timing >= 0.85:
		return {"result": "HOME RUN", "bases": 4, "timing": label}

	var distance := quality + rng.randf_range(-0.12, 0.12)
	if distance >= 0.82: return {"result": "TRIPLE", "bases": 3, "timing": label}
	if distance >= 0.62: return {"result": "DOUBLE", "bases": 2, "timing": label}
	if distance >= 0.36: return {"result": "SINGLE", "bases": 1, "timing": label}
	return {"result": "OUT", "bases": 0, "timing": label}
