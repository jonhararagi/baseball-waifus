class_name FieldingResolver
extends RefCounted

const RULE_VERSION := "fielding_v2"
const RECEPTION_RULE_VERSION := "reception_v1"
const EquipmentStatAdapterClass = preload("res://game/baseball/equipment_stat_adapter.gd")

var equipment_stat_adapter := EquipmentStatAdapterClass.new()

const FIELD_POSITIONS := {
	"C": Vector2(1035, 485),
	"1B": Vector2(870, 390),
	"2B": Vector2(690, 315),
	"3B": Vector2(785, 390),
	"SS": Vector2(620, 315),
	"LF": Vector2(430, 295),
	"CF": Vector2(640, 235),
	"RF": Vector2(850, 295)
}

func resolve(event: BattedBallEvent, defensive_roster: Dictionary, timing_value: float, base_runners: Array, outs: int, rng: RandomNumberGenerator, roster: RefCounted = null) -> Dictionary:
	if event == null:
		return _miss_result("no_event")
	if event.result != "FIELDING_CANDIDATE":
		return {"required": false, "success": false, "final_result": event.result, "rule_version": RULE_VERSION}

	var defender_position := event.target_zone()
	if not defensive_roster.has(defender_position):
		defender_position = _nearest_defender(event.target)
	var defender: PlayerData = defensive_roster.get(defender_position)
	if defender == null:
		return _miss_result("missing_defender")

	var defense_base := {"defense": int(defender.effective_stat("defense"))}
	var effective_defense := equipment_stat_adapter.get_stat(defender.id, "defense", defense_base, roster)
	var defense_score := clamp(effective_defense / 120.0, 0.0, 1.0)
	var target_position: Vector2 = FIELD_POSITIONS.get(defender_position, event.target)
	var distance_score := clamp(target_position.distance_to(event.target) / 420.0, 0.0, 1.0)
	var timing_score := clamp(timing_value, 0.0, 1.0)
	var contact_quality := clamp(float(event.contact_quality), 0.0, 1.0)

	var positioning_score := 1.0 - distance_score
	var ball_handling_score := 1.0 - contact_quality
	var zone_bonus := 0.03 if defender_position in ["SS", "2B", "1B", "3B"] else 0.0

	var chance := 0.05
	chance += defense_score * 0.48
	chance += positioning_score * 0.16
	chance += timing_score * 0.16
	chance += ball_handling_score * 0.08
	chance += zone_bonus
	chance = clamp(chance, 0.08, 0.92)

	var roll := rng.randf()
	var success := roll < chance
	var result := {
		"required": true,
		"success": success,
		"final_result": "OUT" if success else "SINGLE",
		"bases": 0 if success else 1,
		"defender_position": defender_position,
		"defender_id": defender.id,
		"defense_score": defense_score,
		"distance_score": distance_score,
		"timing_score": timing_score,
		"contact_quality": contact_quality,
		"chance": chance,
		"roll": roll,
		"rule_version": RULE_VERSION,
		"reason": "CAUGHT" if success else "FIELDING MISS",
		"double_play": {},
		"reception_error": {}
	}

	if success:
		var reception_chance := clamp(
			0.025
			+ (1.0 - defense_score) * 0.07
			+ contact_quality * 0.035
			+ distance_score * 0.025,
			0.02,
			0.14
		)
		var reception_roll := rng.randf()
		var reception_error := reception_roll < reception_chance
		result["reception_error"] = {
			"error": reception_error,
			"chance": reception_chance,
			"roll": reception_roll,
			"rule_version": RECEPTION_RULE_VERSION
		}
		if reception_error:
			result["success"] = false
			result["final_result"] = "FIELDING ERROR"
			result["bases"] = 1
			result["reason"] = "RECEPTION ERROR"
			return result

		var double_play_resolver := DoublePlayResolver.new()
		var double_play := double_play_resolver.resolve(event, result, base_runners, outs, rng)
		result["double_play"] = double_play
		if bool(double_play.get("success", false)):
			result["final_result"] = "DOUBLE PLAY"
			result["bases"] = 0
	return result

func _nearest_defender(target: Vector2) -> String:
	var nearest := "CF"
	var nearest_distance := INF
	for position in FIELD_POSITIONS.keys():
		var distance: float = FIELD_POSITIONS[position].distance_to(target)
		if distance < nearest_distance:
			nearest_distance = distance
			nearest = position
	return nearest

func _miss_result(reason: String) -> Dictionary:
	return {
		"required": true,
		"success": false,
		"final_result": "SINGLE",
		"bases": 1,
		"defender_position": "CF",
		"chance": 0.0,
		"rule_version": RULE_VERSION,
		"reason": reason,
		"double_play": {}
	}
