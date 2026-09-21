class_name EconomyRules
extends RefCounted

## Centralized v1 economy costs. Gameplay consumes resources through authorities.
const PLAYER_ENERGY_MAX := 100
const CHARACTER_ENERGY_MAX := 100
const ENERGY_REGEN_SECONDS := 360

const MATCH_COSTS := {
	"normal": 10,
	"hard": 10,
	"hell": 15,
	"demon_king": 20,
	"character_materials": 10,
	"equipment": 10,
	"r_cards_charm": 10
}

const CAMPAIGN_ATTEMPTS := {
	"normal": 10,
	"hard": 10,
	"hell": 10,
	"demon_king": 3,
	"character_materials": 10,
	"equipment": 10,
	"r_cards_charm": 10
}

const TRAINING_DURATIONS_SECONDS := {
	"30m": 1800,
	"2h": 7200,
	"6h": 21600,
	"12h": 43200,
	"24h": 86400
}

const TRAINING_STAT_BUNDLES := {
	"batting": {"primary": "power", "secondary": "contact"},
	"running": {"primary": "speed", "secondary": "stamina"},
	"pitching": {"primary": "pitch", "secondary": "control"},
	"defense": {"primary": "defense", "secondary": "critical"},
	"balanced": {"primary": "contact", "secondary": "stamina"}
}
 
## Deterministic training gains. These are v1 balance baselines.
const TRAINING_GAINS := {
	"30m": {"primary": 1, "secondary": 0},
	"2h": {"primary": 2, "secondary": 1},
	"6h": {"primary": 4, "secondary": 2},
	"12h": {"primary": 7, "secondary": 3},
	"24h": {"primary": 12, "secondary": 5}
}

static func match_energy_cost(mode: String) -> int:
	return int(MATCH_COSTS.get(mode, -1))

static func max_attempts(activity_type: String) -> int:
	return int(CAMPAIGN_ATTEMPTS.get(activity_type, -1))

static func training_duration_seconds(duration_key: String) -> int:
	return int(TRAINING_DURATIONS_SECONDS.get(duration_key, -1))

static func is_valid_training_type(training_type: String) -> bool:
	return TRAINING_STAT_BUNDLES.has(training_type)

static func training_gains(duration_key: String, training_type: String) -> Dictionary:
	if not TRAINING_GAINS.has(duration_key) or not TRAINING_STAT_BUNDLES.has(training_type):
		return {}
	var bundle: Dictionary = TRAINING_STAT_BUNDLES[training_type]
	var gains: Dictionary = TRAINING_GAINS[duration_key]
	return {
		str(bundle["primary"]): int(gains["primary"]),
		str(bundle["secondary"]): int(gains["secondary"])
	}
