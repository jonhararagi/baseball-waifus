class_name PlayerAvatarAdapter
extends RefCounted

static func from_player(player: PlayerData) -> AvatarProfile:
	var profile := AvatarProfile.new()
	profile.display_name = player.display_name if not player.display_name.is_empty() else player.id
	profile.randomize_profile(abs(player.id.hash()))
	profile.body_preset = "athletic" if player.specialization in ["runner", "defender"] else "power" if player.specialization == "power" else "balanced"
	profile.apply_body_preset(profile.body_preset)
	profile.show_cap = player.position == "P"
	profile.equipment.cap_style = "cap_classic" if profile.show_cap else "cap_none"

	match player.specialization:
		"power":
			profile.uniform_style = "jacket"
		"runner":
			profile.uniform_style = "sporty"
		"defender":
			profile.uniform_style = "sleeveless"
		_:
			profile.uniform_style = "standard"

	match player.specialization:
		"power":
			profile.equipment.bat_style = "bat_power"
		"contact":
			profile.equipment.bat_style = "bat_precision"
		"runner":
			profile.equipment.shoes_style = "shoes_runner"
		"defender":
			profile.equipment.gloves_style = "glove_guardian"
		_:
			profile.equipment.bat_style = "bat_basic"

	match player.element:
		"fire":
			profile.accent = Color("#e4572e")
		"water":
			profile.accent = Color("#3b82f6")
		"ice":
			profile.accent = Color("#8ad9ff")
		"lightning":
			profile.accent = Color("#f6d447")
		"nature":
			profile.accent = Color("#4cae5f")
		"darkness":
			profile.accent = Color("#8b5cf6")
		"light":
			profile.accent = Color("#f4ed9b")
		_:
			profile.accent = Color("#e58b32")

	return profile
