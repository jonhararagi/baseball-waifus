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


	var defender := PlayerData.new()
	defender.id = "test_defender"
	defender.defense = 80

	var runner := PlayerData.new()
	runner.id = "test_runner"
	runner.speed = 80

	var pitch_down := resolver.get_skill(catalog, "pitch_down")
	assert(resolver.apply_skill(pitch_down, batter, pitcher, {"same_team": false}, state).applied)
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), -0.06))

	var catch_boost := resolver.get_skill(catalog, "catch_boost")
	assert(resolver.apply_skill(catch_boost, batter, defender, {"same_team": true}, state).applied)
	assert(is_equal_approx(state.get_stat_modifier(defender.id, "defense"), 0.04))

	var steal_up := resolver.get_skill(catalog, "steal_up")
	assert(resolver.apply_skill(steal_up, batter, runner, {"same_team": true}, state).applied)
	assert(is_equal_approx(state.get_action_modifier(runner.id, "steal"), 0.05))

	var dp_setup := resolver.get_skill(catalog, "double_play_setup")
	assert(resolver.apply_skill(dp_setup, defender, defender, {"same_team": true}, state).applied)
	assert(is_equal_approx(state.get_action_modifier(defender.id, "double_play"), 0.05))

	var combo := resolver.get_skill(catalog, "runner_batter_link")
	assert(resolver.apply_skill(combo, runner, batter, {"same_team": true}, state).applied)
	assert(is_equal_approx(state.get_action_modifier(batter.id, "runner_batter_combo"), 0.03))

	var simulator := BaseballSimulator.new()
	var pitch := Pitch.create(Pitch.Type.FASTBALL)
	var pitch_state := resolver.create_state()
	var base_zone := simulator.pitch_in_zone_probability(pitcher, pitch)
	assert(resolver.apply_skill(pitch_down, batter, pitcher, {"same_team": false}, pitch_state).applied)
	var debuffed_zone := simulator.pitch_in_zone_probability(pitcher, pitch, pitch_state)
	assert(debuffed_zone < base_zone)

	var fielding_state := resolver.create_state()
	var fielding := FieldingResolver.new()
	var field_event := BattedBallEvent.new()
	field_event.result = "FIELDING_CANDIDATE"
	field_event.target = Vector2(620, 315)
	field_event.origin = Vector2(1040, 430)
	field_event.contact_quality = 0.55
	var base_field_rng := RandomNumberGenerator.new()
	base_field_rng.seed = 77
	var base_field := fielding.resolve(field_event, {"SS": defender}, 0.90, [], 0, base_field_rng)
	assert(resolver.apply_skill(catch_boost, batter, defender, {"same_team": true}, fielding_state).applied)
	var boosted_field_rng := RandomNumberGenerator.new()
	boosted_field_rng.seed = 77
	var boosted_field := fielding.resolve(field_event, {"SS": defender}, 0.90, [], 0, boosted_field_rng, null, fielding_state)
	assert(float(boosted_field.get("chance", 0.0)) > float(base_field.get("chance", 0.0)))

	var runner_system := RunnerSystem.new()
	var steal_rng := RandomNumberGenerator.new()
	steal_rng.seed = 123
	var steal_result := runner_system.attempt_steal(80.0, 50.0, state.get_action_modifier(runner.id, "steal"), steal_rng)
	assert(float(steal_result.get("chance_modifier", 0.0)) == 0.05)
	assert(float(steal_result.get("roll", -1.0)) >= 0.0 and float(steal_result.get("roll", -1.0)) < 1.0)

	state.consume_action()
	assert(is_equal_approx(state.get_stat_modifier(batter.id, "power"), 0.0))
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), -0.06))

	for _i in range(3):
		state.consume_action()
	assert(is_equal_approx(state.get_stat_modifier(pitcher.id, "control"), 0.0))

	print("Skill system tests passed: stacking, debuff duration and combo bonus validated structurally.")
