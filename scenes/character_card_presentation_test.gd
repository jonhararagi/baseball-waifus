extends Node

const CardScript = preload("res://game/ui/character_card.gd")

func _ready() -> void:
	assert(CardScript.RARITY_STYLES.size() == 4, "Character card must define R/SR/SSR/UR presentation.")
	for rarity in ["R", "SR", "SSR", "UR"]:
		assert(CardScript.RARITY_STYLES.has(rarity), "Missing rarity style: " + rarity)
	assert(CardScript.RARITY_STYLES["R"]["accent"] != CardScript.RARITY_STYLES["UR"]["accent"], "R and UR must be visually distinguishable.")
	assert(CardScript.RARITY_STYLES["SR"]["accent"] != CardScript.RARITY_STYLES["SSR"]["accent"], "SR and SSR must be visually distinguishable.")
	assert(ResourceLoader.exists("res://assets/characters/generated/bw001.svg"), "Starter portrait asset missing.")
	print("Character card presentation structural checks passed.")
