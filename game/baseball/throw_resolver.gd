class_name ThrowResolver
extends RefCounted

const RULE_VERSION := "throw_v1"

func resolve(play: FieldingPlayEvent, defender: PlayerData, receiver: PlayerData, rng: RandomNumberGenerator) -> Dictionary:
	if play == null or defender == null or receiver == null:
		return {"error": true, "chance": 0.20, "roll": 0.0, "rule_version": RULE_VERSION, "reason": "MISSING_THROW_ACTOR"}

	var defense_score := clamp(defender.effective_stat("defense") / 120.0, 0.0, 1.0)
	var receiver_score := clamp(receiver.effective_stat("defense") / 120.0, 0.0, 1.0)
	var distance := play.pickup_point.distance_to(play.throw_target)
	var distance_penalty := clamp(distance / 520.0, 0.0, 1.0)

	var chance := 0.035
	chance += (1.0 - defense_score) * 0.10
	chance += distance_penalty * 0.07
	chance += (1.0 - receiver_score) * 0.045
	chance = clamp(chance, 0.02, 0.24)

	var roll := rng.randf()
	var error := roll < chance
	if error:
		var wild := play.throw_target + Vector2(
			rng.randf_range(-85.0, 85.0),
			rng.randf_range(-70.0, 70.0)
		)
		wild.x = clamp(wild.x, 500.0, 1100.0)
		wild.y = clamp(wild.y, 210.0, 560.0)
		play.throw_error = true
		play.wild_throw_target = wild

	return {
		"error": error,
		"chance": chance,
		"roll": roll,
		"rule_version": RULE_VERSION,
		"reason": "THROWING ERROR" if error else "GOOD THROW"
	}
