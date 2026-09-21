class_name SkillResolver
extends RefCounted

const SKILL_CATALOG_PATH := "res://game/characters/skill_catalog.json"
const BaseballSkillStateClass = preload("res://game/baseball/skill_state.gd")

func create_state() -> BaseballSkillState:
	return BaseballSkillStateClass.new()

func load_catalog() -> Dictionary:
	var file := FileAccess.open(SKILL_CATALOG_PATH, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {}

func can_use(skill: Dictionary, context: Dictionary) -> Dictionary:
	var reasons: Array[String] = []
	if skill.is_empty():
		reasons.append("skill_missing")
	var phase := str(skill.get("phase", ""))
	if phase.is_empty():
		reasons.append("phase_missing")
	var requirements: Dictionary = skill.get("context_requirements", {})
	for key in requirements.keys():
		if not context.has(key) or context[key] != requirements[key]:
			reasons.append("requirement_%s" % key)
	return {"allowed": reasons.is_empty(), "reasons": reasons}

func apply_skill(skill: Dictionary, user: PlayerData, target: PlayerData, context: Dictionary, state: BaseballSkillState) -> Dictionary:
	if user == null or state == null:
		return {"applied": false, "reason": "missing_user_or_state"}
	var check := can_use(skill, context)
	if not bool(check.allowed):
		return {"applied": false, "reason": "context_failed", "details": check.reasons}

	var effects: Array = skill.get("effects", [])
	var applied: Array = []
	for effect in effects:
		var kind := str(effect.get("kind", ""))
		match kind:
			"stat_buff", "stat_debuff":
				var recipient := user
				if str(effect.get("target", "self")) == "target":
					recipient = target
				if recipient == null:
					return {"applied": false, "reason": "target_missing", "applied_effects": applied}
				var amount := float(effect.get("amount", 0.0))
				if kind == "stat_debuff":
					amount = -abs(amount)
				else:
					amount = abs(amount)
				var duration := int(effect.get("duration_actions", 1))
				var stat := str(effect.get("stat", ""))
				if not state.add_modifier(recipient.id, stat, amount, duration, str(skill.get("skill_id", ""))):
					return {"applied": false, "reason": "invalid_modifier", "applied_effects": applied}
				applied.append({"kind": kind, "target_id": recipient.id, "stat": stat, "amount": amount, "duration_actions": duration})
			"action_buff", "action_debuff":
				var recipient_action := user
				if str(effect.get("target", "self")) == "target":
					recipient_action = target
				if recipient_action == null:
					return {"applied": false, "reason": "target_missing", "applied_effects": applied}
				var action_amount := float(effect.get("amount", 0.0))
				if kind == "action_debuff":
					action_amount = -abs(action_amount)
				else:
					action_amount = abs(action_amount)
				var action_duration := int(effect.get("duration_actions", 1))
				var action_id := str(effect.get("action_id", ""))
				if not state.add_action_modifier(recipient_action.id, action_id, action_amount, action_duration, str(skill.get("skill_id", ""))):
					return {"applied": false, "reason": "invalid_action_modifier", "applied_effects": applied}
				applied.append({"kind": kind, "target_id": recipient_action.id, "action_id": action_id, "amount": action_amount, "duration_actions": action_duration})
			"outcome_bonus":
				var recipient_id := user.id if str(effect.get("target", "self")) == "self" else (target.id if target != null else "")
				state.add_combo_condition(str(effect.get("condition_id", "")), recipient_id, "outcome_bonus", float(effect.get("amount", 0.0)))
				applied.append({"kind": kind, "target_id": recipient_id, "condition_id": str(effect.get("condition_id", "")), "amount": float(effect.get("amount", 0.0))})
			"combo_prime":
				state.add_combo_condition(str(effect.get("condition_id", "")), user.id, "combo_primed", true)
				applied.append({"kind": kind, "condition_id": str(effect.get("condition_id", ""))})
			_:
				return {"applied": false, "reason": "unsupported_effect_kind", "kind": kind, "applied_effects": applied}
	return {"applied": true, "skill_id": str(skill.get("skill_id", "")), "applied_effects": applied}

func get_skill(catalog: Dictionary, skill_id: String) -> Dictionary:
	var skills: Array = catalog.get("skills", [])
	for skill in skills:
		if str(skill.get("skill_id", "")) == skill_id:
			return skill
	return {}
