class_name RunnerSystem
extends RefCounted

var rng := RandomNumberGenerator.new()

func _init() -> void:
	rng.randomize()

func attempt_steal(speed: float, defense: float) -> Dictionary:
	var chance := clamp(0.35 + speed / 250.0 - defense / 400.0, 0.10, 0.90)
	var success := rng.randf() < chance
	return {"success": success, "chance": chance, "result": "STEAL SUCCESS" if success else "CAUGHT STEALING"}
