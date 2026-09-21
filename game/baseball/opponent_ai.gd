class_name OpponentAI
extends RefCounted

const SkillResolverClass = preload("res://game/baseball/skill_resolver.gd")

const ROLE_SKILLS := {
	"defense": ["catch_boost", "double_play_setup", "defensive_cover"],
	"power_down": ["pitch_pressure"],
	"power_up": ["power_signal"],
	"attack": ["flame_strike"],
	"statistic": ["runner_boost", "steal_up"],
	"combination": ["runner_batter_link", "flame_combo_prime"]
}

var _rng := RandomNumberGenerator.new()
var _skill_resolver := SkillResolverClass.new()
var _catalog: Dictionary = {}
var _skill_cooldowns: Dictionary = {}
var _action_counter := 0

func _init() -> void:
	_rng.seed = 90210
	_catalog = _skill_resolver.load_catalog()

func choose_pitch(pitcher: PlayerData, strikes: int, balls: int, rng: RandomNumberGenerator = null, situation: Dictionary = {}) -> Pitch.Type:
	var random_source := rng if rng != null else _rng
	var control := pitcher.effective_stat("control") if pitcher != null else 50.0
	var pitch_aggression := float(situation.get("pitch_aggression", 0.5))
	var two_strikes := bool(situation.get("two_strikes", strikes >= 2))
	var full_count := bool(situation.get("full_count", balls >= 3 and strikes >= 2))
	if balls >= 3:
		return Pitch.Type.FASTBALL if random_source.randf() < 0.70 else Pitch.Type.CURVE
	if strikes >= 2:
		var put_away_roll := random_source.randf()
		if put_away_roll < clamp(0.45 + pitch_aggression * 0.20, 0.45, 0.75):
			return Pitch.Type.CURVE
		return Pitch.Type.SPECIAL
	if control >= 75.0:
		var roll := random_source.randf()
		if roll < 0.50:
			return Pitch.Type.FASTBALL
		if roll < 0.82:
			return Pitch.Type.CURVE
		return Pitch.Type.SPECIAL
	var safe_roll := random_source.randf()
	return Pitch.Type.FASTBALL if safe_roll < 0.62 else Pitch.Type.CURVE

func maybe_use_defense_skill(defensive_roster: Dictionary, base_runners: Array, outs: int, context: Dictionary, state: BaseballSkillState) -> Dictionary:
	if state == null:
		return {"used": false, "reason": "missing_skill_state"}
	if defensive_roster.is_empty():
		return {"used": false, "reason": "empty_defense"}

	var candidates: Array[PlayerData] = []
	for position in defensive_roster.keys():
		var defender: PlayerData = defensive_roster[position]
		if defender == null:
			continue
		if not defender.skill_roles.has("defense"):
			continue
		candidates.append(defender)

	if candidates.is_empty():
		return {"used": false, "reason": "no_defensive_skill"}

	candidates.sort_custom(func(a: PlayerData, b: PlayerData) -> bool:
		return a.effective_stat("defense") > b.effective_stat("defense")
	)
	var defender: PlayerData = candidates[0]

	if base_runners.size() > 0 and base_runners[0] != null and outs < 2:
		var dp_result := _try_skill("double_play_setup", defender, defender, {"same_team": true, "phase": "defense"}, state)
		if bool(dp_result.get("used", false)):
			return dp_result

	var catch_result := _try_skill("catch_boost", defender, defender, {"same_team": true, "phase": "defense"}, state)
	if bool(catch_result.get("used", false)):
		return catch_result

	return {"used": false, "reason": "skill_cooldown"}

func maybe_use_runner_skill(runner: PlayerData, phase_context: Dictionary, state: BaseballSkillState) -> Dictionary:
	if runner == null or state == null:
		return {"used": false, "reason": "missing_runner_or_state"}
	if not runner.skill_roles.has("statistic"):
		return {"used": false, "reason": "no_runner_skill"}
	return _try_skill("steal_up", runner, runner, {"same_team": true, "phase": "baserunning"}, state)

func choose_situational_action(batter: PlayerData, pitcher: PlayerData, context: Dictionary, state: BaseballSkillState) -> Dictionary:
	if batter == null or pitcher == null or state == null:
		return {"action": "BAT", "reason": "missing_context"}
	var situation: Dictionary = context.get("situation", {})
	var priority := str(situation.get("skill_priority", "NONE"))
	if priority == "CONTACT" and batter.skill_roles.has("power_down"):
		var pressure := _try_skill("pitch_pressure", batter, pitcher, {"same_team": false, "phase": "pitch"}, state)
		if bool(pressure.get("used", false)):
			return {"action": "BAT", "skill": pressure}
	if priority == "POWER" and batter.skill_roles.has("power_up"):
		var power := _try_skill("power_signal", batter, batter, {"same_team": true, "phase": "batting"}, state)
		if bool(power.get("used", false)):
			return {"action": "BAT", "skill": power}
	if priority == "RUNNER" and batter.skill_roles.has("statistic") and bool(situation.get("offensive_steal_value", 0.0) > 0.25):
		return {"action": "STEAL", "reason": "situational_runner_value"}
	var legacy := maybe_use_offensive_skill(batter, pitcher, context, state)
	return {"action": "BAT", "skill": legacy}

func maybe_use_offensive_skill(batter: PlayerData, pitcher: PlayerData, phase_context: Dictionary, state: BaseballSkillState) -> Dictionary:
	if batter == null or pitcher == null or state == null:
		return {"used": false, "reason": "missing_batting_context"}
	if batter.skill_roles.has("power_down"):
		var pressure := _try_skill("pitch_pressure", batter, pitcher, {"same_team": false, "phase": "pitch"}, state)
		if bool(pressure.get("used", false)):
			return pressure
	if batter.skill_roles.has("power_up"):
		var power := _try_skill("power_signal", batter, batter, {"same_team": true, "phase": "batting"}, state)
		if bool(power.get("used", false)):
			return power
	if batter.skill_roles.has("attack"):
		var attack := _try_skill("flame_strike", batter, batter, {"same_team": true, "phase": "batting"}, state)
		if bool(attack.get("used", false)):
			return attack
	return {"used": false, "reason": "no_available_offensive_skill"}

func _try_skill(skill_id: String, user: PlayerData, target: PlayerData, context: Dictionary, state: BaseballSkillState) -> Dictionary:
	var skill := _skill_resolver.get_skill(_catalog, skill_id)
	if skill.is_empty():
		return {"used": false, "reason": "skill_missing", "skill_id": skill_id}
	if int(_skill_cooldowns.get(skill_id, 0)) > 0:
		return {"used": false, "reason": "skill_cooldown", "skill_id": skill_id}
	var check := _skill_resolver.can_use(skill, context)
	if not bool(check.get("allowed", false)):
		return {"used": false, "reason": "context_failed", "details": check.get("reasons", [])}
	var applied := _skill_resolver.apply_skill(skill, user, target, context, state)
	if not bool(applied.get("applied", false)):
		return {"used": false, "reason": str(applied.get("reason", "apply_failed")), "details": applied}
	_skill_cooldowns[skill_id] = _cooldown_for(skill_id)
	_action_counter += 1
	return {
		"used": true,
		"skill_id": skill_id,
		"user_id": user.id if user != null else "",
		"target_id": target.id if target != null else "",
		"action_counter": _action_counter,
		"details": applied
	}

func tick_action() -> void:
	for skill_id in _skill_cooldowns.keys():
		var remaining := int(_skill_cooldowns[skill_id]) - 1
		if remaining <= 0:
			_skill_cooldowns.erase(skill_id)
		else:
			_skill_cooldowns[skill_id] = remaining

func snapshot() -> Dictionary:
	return {
		"cooldowns": _skill_cooldowns.duplicate(true),
		"action_counter": _action_counter
	}

func restore(data: Dictionary) -> void:
	_skill_cooldowns = data.get("cooldowns", {}).duplicate(true)
	_action_counter = int(data.get("action_counter", 0))

func _cooldown_for(skill_id: String) -> int:
	match skill_id:
		"double_play_setup":
			return 3
		"catch_boost":
			return 2
		"pitch_pressure":
			return 4
		"power_signal", "flame_strike":
			return 2
		"steal_up":
			return 2
		_:
			return 1
