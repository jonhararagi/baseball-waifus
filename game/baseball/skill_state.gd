class_name BaseballSkillState
extends RefCounted

const STAT_KEYS := ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"]
const MAX_MODIFIER := 0.25

var _modifiers: Dictionary = {}
var _pending_combos: Array[Dictionary] = []
var _event_log: Array[Dictionary] = []
var _action_modifiers: Dictionary = {}

func begin_plate_appearance() -> void:
	_pending_combos = []
	_event_log = []

func add_modifier(target_id: String, stat: String, amount: float, remaining_actions: int, source_skill_id: String) -> bool:
	if target_id.is_empty() or not STAT_KEYS.has(stat) or remaining_actions <= 0:
		return false
	var clamped_amount := clamp(amount, -MAX_MODIFIER, MAX_MODIFIER)
	var key := "%s:%s" % [target_id, stat]
	if not _modifiers.has(key):
		_modifiers[key] = []
	_modifiers[key].append({
			"amount": clamped_amount,
			"remaining_actions": remaining_actions,
			"source_skill_id": source_skill_id
		})
	_event_log.append({
		"type": "SKILL_MODIFIER_APPLIED",
		"target_id": target_id,
		"stat": stat,
		"amount": clamped_amount,
		"remaining_actions": remaining_actions,
		"source_skill_id": source_skill_id
	})
	return true

func get_stat_modifier(target_id: String, stat: String) -> float:
	var key := "%s:%s" % [target_id, stat]
	var total := 0.0
	for modifier in _modifiers.get(key, []):
		total += float(modifier.get("amount", 0.0))
	return clamp(total, -MAX_MODIFIER, MAX_MODIFIER)

func get_stat_multiplier(target_id: String, stat: String) -> float:
	return 1.0 + get_stat_modifier(target_id, stat)

func add_action_modifier(target_id: String, action_id: String, amount: float, remaining_actions: int, source_skill_id: String) -> bool:
	if target_id.is_empty() or action_id.is_empty() or remaining_actions <= 0:
		return false
	var clamped_amount := clamp(amount, -MAX_MODIFIER, MAX_MODIFIER)
	var key := "%s:%s" % [target_id, action_id]
	if not _action_modifiers.has(key):
		_action_modifiers[key] = []
	_action_modifiers[key].append({
		"amount": clamped_amount,
		"remaining_actions": remaining_actions,
		"source_skill_id": source_skill_id
	})
	_event_log.append({
		"type": "SKILL_ACTION_MODIFIER_APPLIED",
		"target_id": target_id,
		"action_id": action_id,
		"amount": clamped_amount,
		"remaining_actions": remaining_actions,
		"source_skill_id": source_skill_id
	})
	return true

func get_action_modifier(target_id: String, action_id: String) -> float:
	var key := "%s:%s" % [target_id, action_id]
	var total := 0.0
	for modifier in _action_modifiers.get(key, []):
		total += float(modifier.get("amount", 0.0))
	return clamp(total, -MAX_MODIFIER, MAX_MODIFIER)

func get_action_multiplier(target_id: String, action_id: String) -> float:
	return 1.0 + get_action_modifier(target_id, action_id)

func add_combo_condition(combo_id: String, target_id: String, condition: String, value: Variant = true) -> void:
	_pending_combos.append({
		"combo_id": combo_id,
		"target_id": target_id,
		"condition": condition,
		"value": value
	})

func consume_action() -> void:
	var empty_keys: Array[String] = []
	for key in _modifiers.keys():
		var kept: Array = []
		for modifier in _modifiers[key]:
			var remaining := int(modifier.get("remaining_actions", 0)) - 1
			if remaining > 0:
				var copy := modifier.duplicate(true)
				copy["remaining_actions"] = remaining
				kept.append(copy)
		if kept.is_empty():
			empty_keys.append(str(key))
		else:
			_modifiers[key] = kept
	for key in empty_keys:
		_modifiers.erase(key)

	var empty_action_keys: Array[String] = []
	for key in _action_modifiers.keys():
		var kept_actions: Array = []
		for modifier in _action_modifiers[key]:
			var remaining := int(modifier.get("remaining_actions", 0)) - 1
			if remaining > 0:
				var copy := modifier.duplicate(true)
				copy["remaining_actions"] = remaining
				kept_actions.append(copy)
		if kept_actions.is_empty():
			empty_action_keys.append(str(key))
		else:
			_action_modifiers[key] = kept_actions
	for key in empty_action_keys:
		_action_modifiers.erase(key)

func has_combo_condition(target_id: String, condition: String) -> bool:
	for entry in _pending_combos:
		if str(entry.get("target_id", "")) == target_id and str(entry.get("condition", "")) == condition:
			return true
	return false

func get_outcome_bonus(target_id: String, outcome_id: String) -> float:
	var total := 0.0
	for entry in _pending_combos:
		if str(entry.get("target_id", "")) == target_id and str(entry.get("combo_id", "")) == outcome_id and str(entry.get("condition", "")) == "outcome_bonus":
			total += float(entry.get("value", 0.0))
	return clamp(total, -0.25, 0.25)

func event_log() -> Array[Dictionary]:
	return _event_log.duplicate(true)

func snapshot() -> Dictionary:
	return {
		"modifiers": _modifiers.duplicate(true),
		"action_modifiers": _action_modifiers.duplicate(true),
		"pending_combos": _pending_combos.duplicate(true),
		"event_log": _event_log.duplicate(true)
	}

func restore(snapshot_data: Dictionary) -> void:
	_modifiers = snapshot_data.get("modifiers", {}).duplicate(true)
	_action_modifiers = snapshot_data.get("action_modifiers", {}).duplicate(true)
	_pending_combos = snapshot_data.get("pending_combos", []).duplicate(true)
	_event_log = snapshot_data.get("event_log", []).duplicate(true)
