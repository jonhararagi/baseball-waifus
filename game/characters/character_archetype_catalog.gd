class_name CharacterArchetypeCatalog
extends RefCounted

const DATA_PATH := "res://game/characters/character_archetypes.json"

static var _cache: Array = []

static func all() -> Array:
	if _cache.is_empty():
		_load()
	return _cache.duplicate(true)

static func find(character_id: String) -> Dictionary:
	for entry in all():
		if str(entry.get("id", "")) == character_id:
			return entry.duplicate(true)
	return {}

static func create_player(character_id: String) -> PlayerData:
	var entry := find(character_id)
	if entry.is_empty():
		return null
	var player := PlayerData.new()
	player.id = str(entry.id)
	player.display_name = str(entry.display_name)
	player.rarity = str(entry.rarity)
	player.element = str(entry.element)
	player.position = str(entry.position)
	player.specialization = str(entry.specialization)
	player.faction = str(entry.character_identity.get("faction", ""))
	player.skill_roles.clear()
	var skill_roles: Array = entry.get("skill_roles", [])
	for skill_role in skill_roles:
		player.skill_roles.append(str(skill_role))
	player.potential = int(entry.potential)
	var stats: Dictionary = entry.stats
	player.power = int(stats.power)
	player.contact = int(stats.contact)
	player.speed = int(stats.speed)
	player.pitch = int(stats.pitch)
	player.control = int(stats.control)
	player.defense = int(stats.defense)
	player.critical = int(stats.critical)
	player.stamina = int(stats.stamina)
	CharmSystem.configure_player(player)
	return player

static func create_avatar(character_id: String, variant: Dictionary = {}) -> AvatarProfile:
	var entry := find(character_id)
	if entry.is_empty():
		return null
	var data: Dictionary = entry.visual
	var profile := AvatarProfile.new()
	profile.display_name = str(entry.display_name)
	profile.height = float(data.height)
	profile.shoulder_width = float(data.shoulder_width)
	profile.waist_width = float(data.waist_width)
	profile.hip_width = float(data.hip_width)
	profile.bust = float(data.bust)
	profile.head_scale = float(data.head_scale)
	profile.body_preset = str(data.body_preset)
	profile.face_style = str(data.face_style)
	profile.hair = Color(str(data.hair_color))
	profile.hair_accent = profile.hair.lightened(0.22)
	profile.skin = Color(str(data.skin))
	profile.uniform = Color(str(data.uniform_color))
	profile.accent = Color(str(data.accent))
	profile.eye = Color(str(data.eye))
	profile.uniform_style = str(data.uniform_style)
	profile.hair_style = str(data.hair_style)
	profile.art_style = "soft"
	_apply_variant(profile, entry, variant)
	return profile

static func _apply_variant(profile: AvatarProfile, entry: Dictionary, variant: Dictionary) -> void:
	if variant.has("hair_color"):
		profile.hair = Color(str(variant.hair_color))
		profile.hair_accent = profile.hair.lightened(0.22)
	if variant.has("hair_style"):
		var hair_style := str(variant.hair_style)
		if hair_style in ["long", "short", "bob", "ponytail", "twin_tail"]:
			profile.hair_style = hair_style
	if variant.has("body_scale"):
		var rules: Dictionary = entry.variant_rules
		var scale := clampf(float(variant.body_scale), float(rules.body_scale_min), float(rules.body_scale_max))
		profile.height *= scale
		profile.shoulder_width *= scale
		profile.waist_width *= scale
		profile.hip_width *= scale
		profile.bust *= scale

static func _load() -> void:
	if not FileAccess.file_exists(DATA_PATH):
		push_error("CharacterArchetypeCatalog: missing " + DATA_PATH)
		_cache = []
		return
	var text := FileAccess.get_file_as_string(DATA_PATH)
	var parsed = JSON.parse_string(text)
	if parsed is Dictionary and parsed.has("characters"):
		_cache = parsed.characters
	else:
		push_error("CharacterArchetypeCatalog: invalid JSON catalog")
		_cache = []
