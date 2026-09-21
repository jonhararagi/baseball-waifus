class_name CharacterExpressionController
extends RefCounted

## Presentation-only expression resolver.
## It never changes PlayerData, stats, gameplay results, or progression.

const NEUTRAL := "neutral"
const HAPPY := "happy"
const FOCUSED := "focused"
const SURPRISED := "surprised"
const DISAPPOINTED := "disappointed"
const VALID_EXPRESSIONS := [NEUTRAL, HAPPY, FOCUSED, SURPRISED, DISAPPOINTED]
const EXPRESSION_ASSET_ROOT := "res://assets/characters/expressions"

static func is_valid(expression_id: String) -> bool:
	return expression_id in VALID_EXPRESSIONS

static func resolve_portrait_path(character_id: String, expression_id: String, fallback_path: String = "") -> String:
	var normalized := expression_id if is_valid(expression_id) else NEUTRAL
	var candidate := "%s/%s_%s.svg" % [EXPRESSION_ASSET_ROOT, character_id, normalized]
	if ResourceLoader.exists(candidate):
		return candidate
	if not fallback_path.is_empty() and ResourceLoader.exists(fallback_path):
		return fallback_path
	var base := "res://assets/characters/generated/%s.svg" % character_id
	if ResourceLoader.exists(base):
		return base
	return ""

static func expression_for_comment(index: int) -> String:
	var sequence := [NEUTRAL, FOCUSED, HAPPY, SURPRISED, FOCUSED, NEUTRAL, HAPPY, FOCUSED, DISAPPOINTED, HAPPY]
	if index < 0:
		return NEUTRAL
	return sequence[index % sequence.size()]
