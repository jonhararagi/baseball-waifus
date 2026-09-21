class_name RewardedAdPolicy
extends RefCounted

## Offline-first policy for optional rewarded advertisements.
## This class does not show ads and does not mutate inventory.
## A platform adapter must call the policy only after a verified completed reward.

const MAX_DAILY_USES_PER_CATEGORY := 10

enum RewardCategory {
	PLAYER_ENERGY,
	MATERIALS,
	CHARACTER_ENERGY,
}

const CATEGORY_KEYS := {
	RewardCategory.PLAYER_ENERGY: "player_energy",
	RewardCategory.MATERIALS: "materials",
	RewardCategory.CHARACTER_ENERGY: "character_energy",
}

func category_key(category: int) -> String:
	return str(CATEGORY_KEYS.get(category, ""))

func can_claim(category: int, daily_uses: Dictionary) -> bool:
	if not CATEGORY_KEYS.has(category):
		return false
	return int(daily_uses.get(category_key(category), 0)) < MAX_DAILY_USES_PER_CATEGORY

func remaining_uses(category: int, daily_uses: Dictionary) -> int:
	if not CATEGORY_KEYS.has(category):
		return 0
	return maxi(0, MAX_DAILY_USES_PER_CATEGORY - int(daily_uses.get(category_key(category), 0)))

func build_reward(category: int) -> Dictionary:
	match category:
		RewardCategory.PLAYER_ENERGY:
			return {"category": category_key(category), "amount": 20, "unit": "player_energy"}
		RewardCategory.MATERIALS:
			return {"category": category_key(category), "amount": 1, "unit": "material_bundle"}
		RewardCategory.CHARACTER_ENERGY:
			return {"category": category_key(category), "amount": 20, "unit": "character_energy"}
		_:
			return {"category": "", "amount": 0, "unit": ""}

func register_completed_reward(category: int, daily_uses: Dictionary) -> Dictionary:
	if not can_claim(category, daily_uses):
		return {"accepted": false, "reason": "daily_limit"}
	var key := category_key(category)
	daily_uses[key] = int(daily_uses.get(key, 0)) + 1
	return {
		"accepted": true,
		"category": key,
		"uses_today": daily_uses[key],
		"remaining": MAX_DAILY_USES_PER_CATEGORY - daily_uses[key],
	}
