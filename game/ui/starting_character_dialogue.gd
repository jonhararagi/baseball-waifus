class_name StartingCharacterDialogue
extends RefCounted

const DATA_PATH := "res://game/characters/starting_character_dialogue.json"
const CHARACTER_ID := "bw001"
const MAX_LINES := 10

var lines: Array[Dictionary] = []

func load_data() -> bool:
	lines.clear()
	if not FileAccess.file_exists(DATA_PATH):
		return false
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return false
	if str(parsed.get("character_id", "")) != CHARACTER_ID:
		return false
	var source: Array = parsed.get("lines", [])
	for raw in source:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var line := {
			"id": str(raw.get("id", "")),
			"context": str(raw.get("context", "hub_idle")),
			"text": str(raw.get("text", ""))
		}
		if not line["id"].is_empty() and not line["text"].is_empty():
			lines.append(line)
	return lines.size() == MAX_LINES

func get_line(index: int) -> String:
	if lines.is_empty():
		if not load_data():
			return ""
	var safe_index := posmod(index, lines.size())
	return str(lines[safe_index].get("text", ""))

func count() -> int:
	if lines.is_empty():
		load_data()
	return lines.size()
