class_name OpponentAI
extends RefCounted

var rng := RandomNumberGenerator.new()

func _init() -> void:
	rng.randomize()

func choose_pitch(pitcher: PlayerData, strikes: int, balls: int) -> Pitch.Type:
	if strikes >= 2:
		return Pitch.Type.CURVE if rng.randf() < 0.55 else Pitch.Type.SPECIAL
	if balls >= 3:
		return Pitch.Type.FASTBALL
	var r := rng.randf()
	if r < 0.45: return Pitch.Type.FASTBALL
	if r < 0.78: return Pitch.Type.CURVE
	return Pitch.Type.SPECIAL

func choose_batter_action(bases: Array, outs: int) -> String:
	if bases.has(true) and outs < 2 and rng.randf() < 0.12:
		return "STEAL"
	return "BAT"
