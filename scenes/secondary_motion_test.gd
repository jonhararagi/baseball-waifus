extends Node3D

func _ready() -> void:
	var profile := CharacterArchetypeCatalog.create_avatar("bw001")
	assert(profile != null, "bw001 profile must exist")

	var character := Pixel3DBaseballCharacter.new()
	add_child(character)
	character.setup(profile)

	assert(character.secondary_motion != null, "secondary motion component must exist")
	assert(character.chest_mass_left != null, "left chest anchor must exist")
	assert(character.chest_mass_right != null, "right chest anchor must exist")
	assert(character.skirt != null, "hip/skirt anchor must exist")
	assert(character.front_leg != null, "front thigh anchor must exist")
	assert(character.rear_leg != null, "rear thigh anchor must exist")

	character.secondary_motion.set_activity(Vector3(1.0, 0.0, 0.5))
	character.secondary_motion.nudge(Vector3(0.5, 0.0, 0.25), 0.25)

	print("secondary_motion_test: PASS")
