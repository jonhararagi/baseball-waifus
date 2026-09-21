extends Node

const SkillResolverClass = preload("res://game/baseball/skill_resolver.gd")

func _ready() -> void:
	var resolver = SkillResolverClass.new()
	var catalog := resolver.load_catalog()
	assert(catalog.size() > 0, "Skill catalog must load")
	assert(catalog.get("categories", []).has("attack"))
	assert(catalog.get("categories", []).has("defense"))
	assert(catalog.get("categories", []).has("power_up"))
	assert(catalog.get("categories", []).has("power_down"))
	assert(catalog.get("categories", []).has("statistic"))
	assert(catalog.get("categories", []).has("combination"))

	var batter := PlayerData.new()
	batter.id = "test_batter_3"
	batter.power = 80
	batter.contact = 80
	batter.critical = 10
	batter.element = "fire"

	var pitcher := PlayerData.new()
	pitcher.id = "test_pitcher"
	pitcher.control = 90
	pitcher.element = "ice"

	var state = resolver.create_state()

	var power_up := resolver.get_skill(catalog, "power_signal")
	var result_up := resolver.apply_skill(power_up, batter, batter, {"same_team": true}, state)
	assert(result_up.applied)
	assert(is_equal_approx(state.get_stat_modifier(batter.id, "power"), 0.03))

	var power_down := resolver.get_skill(catalog, "pitch_pressure")
	var result_down := resolver.apply_skill(power_down, batter, pitcher, {"same_team": false}, state)
	assert(result_down.applied)
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), -0.03))

	var flame := resolver.get_skill(catalog, "flame_strike")
	var result_flame := resolver.apply_skill(flame, batter, batter, {"same_team": true}, state)
	assert(result_flame.applied)
	assert(is_equal_approx(state.get_stat_modifier(batter.id, "power"), 0.08))
	assert(is_equal_approx(state.get_outcome_bonus(batter.id, "home_run"), 0.05))

	state.consume_action()
	assert(is_equal_approx(state.get_stat_modifier(batter.id, "power"), 0.0))
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), -0.03))

	for _i in range(3):
		state.consume_action()
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), 0.0))

	print("Skill system tests passed: stacking, debuff duration and combo bonus validated structurally.")
