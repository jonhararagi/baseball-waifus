class_name EconomyRules
extends RefCounted

## Centralized v1 economy costs. Gameplay consumes resources through authorities.
const PLAYER_ENERGY_MAX := 100
const CHARACTER_ENERGY_MAX := 100
const ENERGY_REGEN_SECONDS := 360

const MATCH_COSTS := {
	"normal": 10,
	"hard": 15,
	"hell": 15,
	"demon_king": 25
}

const CAMPAIGN_ATTEMPTS := {
	"normal": 10,
	"hard": 10,
	"hell": 10,
	"demon_king": 3
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

static func match_energy_cost(mode: String) -> int:
	return int(MATCH_COSTS.get(mode, -1))

static func max_attempts(activity_type: String) -> int:
	return int(CAMPAIGN_ATTEMPTS.get(activity_type, -1))

static func training_duration_seconds(duration_key: String) -> int:
	return int(TRAINING_DURATIONS_SECONDS.get(duration_key, -1))

static func is_valid_training_type(training_type: String) -> bool:
	return TRAINING_STAT_BUNDLES.has(training_type)
