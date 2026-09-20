class_name AvatarProfileStore
extends RefCounted

const BASE_DIR := "user://baseball_waifus/characters"

func _ensure_directory() -> void:
	var absolute := ProjectSettings.globalize_path(BASE_DIR)
	DirAccess.make_dir_recursive_absolute(absolute)

func _safe_name(value: String) -> String:
	var cleaned := value.strip_edges()
	if cleaned.is_empty():
		cleaned = "character"
	for ch in ["/", "\\", ":", "*", "?", "\"", "<", ">", "|"]:

		cleaned = cleaned.replace(ch, "_")
	return cleaned.to_lower()

func save_profile(profile: AvatarProfile, filename := "designer_last.json") -> bool:
	_ensure_directory()
	var path := BASE_DIR.path_join(_safe_name(filename))
	if not path.to_lower().ends_with(".json"):
		path += ".json"
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(profile.to_dictionary(), "\t"))
	file.close()
	return true

func load_profile(filename := "designer_last.json") -> AvatarProfile:
	var path := BASE_DIR.path_join(_safe_name(filename))
	if not path.to_lower().ends_with(".json"):
		path += ".json"
	if not FileAccess.file_exists(path):
		return null
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		return AvatarProfile.from_dictionary(parsed)
	return null

func list_profiles() -> Array[String]:
	_ensure_directory()
	var result: Array[String] = []
	var dir := DirAccess.open(BASE_DIR)
	if dir == null:
		return result
	dir.list_dir_begin()
	while true:
		var item := dir.get_next()
		if item.is_empty():
			break
		if not dir.current_is_dir() and item.to_lower().ends_with(".json"):
			result.append(item)
	dir.list_dir_end()
	result.sort()
	return result

func _player_filename(player_id: String) -> String:
	var safe := _safe_name(player_id)
	if safe.is_empty():
		safe = "player"
	return "player_" + safe + ".json"

func save_player_profile(player_id: String, profile: AvatarProfile) -> bool:
	return save_profile(profile, _player_filename(player_id))

func load_player_profile(player_id: String) -> AvatarProfile:
	return load_profile(_player_filename(player_id))

func delete_player_profile(player_id: String) -> bool:
	var path := BASE_DIR.path_join(_player_filename(player_id))
	if not FileAccess.file_exists(path):
		return false
	return DirAccess.remove_absolute(ProjectSettings.globalize_path(path)) == OK

func list_player_profiles() -> Array[String]:
	_ensure_directory()
	var result: Array[String] = []
	var dir := DirAccess.open(BASE_DIR)
	if dir == null:
		return result
	dir.list_dir_begin()
	while true:
		var item := dir.get_next()
		if item.is_empty():
			break
		if not dir.current_is_dir() and item.begins_with("player_") and item.to_lower().ends_with(".json"):
			result.append(item)
	dir.list_dir_end()
	result.sort()
	return result
