extends Control

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const CatalogScript: Script = preload("res://game/characters/character_archetype_catalog.gd")

const CHARACTER_ID := "bw006"
const EXPRESSION_LABELS := {
	"neutral": "NEUTRAL",
	"happy": "HAPPY",
	"focused": "FOCUSED",
	"surprised": "SURPRISED",
	"disappointed": "DISAPPOINTED"
}

var card: Control

func _ready() -> void:
	_validate_canonical_data()
	_build_visual_test()
	call_deferred("_set_focus_state")

func _validate_canonical_data() -> void:
	var entry: Dictionary = CatalogScript.call("find", CHARACTER_ID)
	assert(not entry.is_empty(), "bw006 must exist in the canonical character catalog.")
	assert(str(entry.get("display_name", "")) == "Akari Shimizu")
	assert(str(entry.get("rarity", "")) == "SR")
	assert(str(entry.get("element", "")) == "lightning")
	assert(str(entry.get("position", "")) == "1B")
	assert(str(entry.get("specialization", "")) == "defender")

	var player = CatalogScript.call("create_player", CHARACTER_ID)
	assert(player != null, "Canonical bw006 PlayerData must be constructible.")
	assert(player.id == CHARACTER_ID)
	assert(player.display_name == "Akari Shimizu")
	assert(player.rarity == "SR")
	assert(player.element == "lightning")
	assert(player.position == "1B")
	assert(player.specialization == "defender")
	assert(player.power == 68)
	assert(player.contact == 60)
	assert(player.speed == 52)
	assert(player.defense == 88)
	assert(player.stamina == 79)

	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path), "Missing bw006 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 4000, "bw006 expression asset is unexpectedly small: " + expression_id)
		assert(not content.contains("<text"), "bw006 expression SVG must not depend on embedded font glyphs: " + expression_id)
		assert(content.contains("#2f313f"), "bw006 hair palette drifted: " + expression_id)
		assert(content.contains("#f6d447"), "bw006 Lightning accent drifted: " + expression_id)
		assert(content.contains("#302b38"), "bw006 eye palette drifted: " + expression_id)
		assert(content.contains("#c88b68"), "bw006 skin palette drifted: " + expression_id)
		contents[expression_id] = content

	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(contents[first_id] != contents[second_id], "bw006 expression assets must remain distinct.")

	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw006_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw006_happy.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.FOCUSED).ends_with("bw006_focused.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.SURPRISED).ends_with("bw006_surprised.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.DISAPPOINTED).ends_with("bw006_disappointed.svg"))
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL)
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	print("bw006 structural and visual asset checks passed.")

func _build_visual_test() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.color = Color("#101318")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var glow := ColorRect.new()
	glow.color = Color(0.96, 0.83, 0.28, 0.08)
	glow.position = Vector2(0, 92)
	glow.size = Vector2(1280, 520)
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(glow)

	var title := Label.new()
	title.text = "CHARACTER PRESENTATION • BW006"
	title.position = Vector2(58, 26)
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color("#fff8d8"))
	add_child(title)

	var subtitle := Label.new()
	subtitle.text = "AKARI SHIMIZU  •  SR  •  LIGHTNING  •  1B  •  DEFENDER"
	subtitle.position = Vector2(60, 62)
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("#f6d447"))
	add_child(subtitle)

	card = CardScript.new()
	card.position = Vector2(52, 112)
	card.scale = Vector2(0.82, 0.82)
	add_child(card)
	assert(card.has_method("setup"), "BaseballCharacterCard must expose setup().")
	assert(card.has_method("set_expression"), "BaseballCharacterCard must expose set_expression().")
	assert(card.has_method("current_expression"), "BaseballCharacterCard must expose current_expression().")
	card.call("setup", CatalogScript.call("create_player", CHARACTER_ID))

	var panel := Panel.new()
	panel.position = Vector2(548, 120)
	panel.size = Vector2(650, 510)
	panel.add_theme_stylebox_override("panel", _panel_style())
	add_child(panel)

	var panel_title := Label.new()
	panel_title.text = "EXPRESSIVE STATES"
	panel_title.position = Vector2(30, 24)
	panel_title.add_theme_font_size_override("font_size", 18)
	panel_title.add_theme_color_override("font_color", Color("#fff8d8"))
	panel.add_child(panel_title)

	for i in range(Controller.VALID_EXPRESSIONS.size()):
		var expression_id: String = Controller.VALID_EXPRESSIONS[i]
		var frame := Panel.new()
		frame.position = Vector2(28 + i * 122, 74)
		frame.size = Vector2(110, 178)
		frame.add_theme_stylebox_override("panel", _small_panel_style())
		panel.add_child(frame)

		var portrait := TextureRect.new()
		portrait.position = Vector2(9, 8)
		portrait.size = Vector2(92, 138)
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		portrait.texture = load(Controller.resolve_portrait_path(CHARACTER_ID, expression_id))
		portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
		frame.add_child(portrait)

		var label := Label.new()
		label.text = EXPRESSION_LABELS[expression_id]
		label.position = Vector2(4, 148)
		label.size = Vector2(102, 22)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size", 11)
		label.add_theme_color_override("font_color", Color("#f6d447"))
		frame.add_child(label)

	var info := Label.new()
	info.text = "Presentation-only states for Akari.\nThe expression never changes PlayerData, statistics, progression or baseball results.\n\nThe collection card uses CharacterExpressionController for portrait resolution.\nThe SVGs are autonomous vector assets intended for replacement by final art without changing gameplay code."
	info.position = Vector2(30, 284)
	info.size = Vector2(590, 150)
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_theme_font_size_override("font_size", 15)
	info.add_theme_color_override("font_color", Color("#e4dfc9"))
	panel.add_child(info)

	var footer := Label.new()
	footer.text = "QA PREVIEW • 1280x720 • ORIGINAL VECTOR ASSETS • NO FONT EMBEDDING"
	footer.position = Vector2(58, 674)
	footer.add_theme_font_size_override("font_size", 12)
	footer.add_theme_color_override("font_color", Color("#8a825e"))
	add_child(footer)

func _set_focus_state() -> void:
	if card != null:
		card.call("set_expression", Controller.FOCUSED)

func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#171a20")
	style.border_color = Color("#f6d447")
	style.set_border_width_all(2)
	style.set_corner_radius_all(20)
	return style

func _small_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#1d2027")
	style.border_color = Color("#6d6332")
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	return style
