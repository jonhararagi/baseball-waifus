extends Node

func _ready() -> void:
	var ai := OpponentAI.new()
	var pitcher := PlayerData.new()
	pitcher.id = "ai_pitcher"
	pitcher.display_name = "AI Pitcher"
	pitcher.control = 80
	pitcher.skill_roles = ["power_down"]

	var batter := PlayerData.new()
	batter.id = "ai_batter"
	batter.display_name = "AI Batter"
	batter.power = 70
	batter.skill_roles = ["attack"]

	var defender := PlayerData.new()
	defender.id = "ai_defender"
	defender.display_name = "AI Defender"
	defender.defense = 80
	defender.skill_roles = ["defense"]

	var state := BaseballSkillState.new()

	var pitch := ai.choose_pitch(pitcher, 0, 0)
	assert(pitch in [Pitch.Type.FASTBALL, Pitch.Type.CURVE, Pitch.Type.SPECIAL])

	var offensive := ai.maybe_use_offensive_skill(batter, pitcher, {"phase": "pitch"}, state)
	assert(bool(offensive.get("used", false)))
	assert(str(offensive.get("skill_id", "")) == "flame_strike")
	assert(state.get_stat_modifier(batter.id, "power") > 0.0)

	var defense := ai.maybe_use_defense_skill(
		{"SS": defender},
		[RunnerToken.new()],
		0,
		{"phase": "defense"},
		state
	)
	assert(bool(defense.get("used", false)))
	assert(str(defense.get("skill_id", "")) in ["double_play_setup", "catch_boost"])

	var cooldown_snapshot := ai.snapshot()
	assert(cooldown_snapshot.has("cooldowns"))
	ai.tick_action()
	ai.restore(cooldown_snapshot)
	assert(ai.snapshot() == cooldown_snapshot)

	print("OpponentAI structural test prepared.")
