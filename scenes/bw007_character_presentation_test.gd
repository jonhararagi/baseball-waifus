extends Control
const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const Catalog: Script = preload("res://game/characters/character_archetype_catalog.gd")
const CHARACTER_ID := "bw007"
const EXPRESSION_LABELS := {"neutral":"NEUTRAL","happy":"HAPPY","focused":"FOCUSED","surprised":"SURPRISED","disappointed":"DISAPPOINTED"}
var card: BaseballCharacterCard
func _ready() -> void:
	_validate_canonical_data()
	_build_visual_test()
	call_deferred("_set_focus_state")
func _validate_canonical_data() -> void:
	var entry: Dictionary = Catalog.call("find", CHARACTER_ID)
	assert(str(entry.get("display_name", "")) == "Kira Kurosawa")
	assert(str(entry.get("rarity", "")) == "SSR")
	assert(str(entry.get("element", "")) == "darkness")
	assert(str(entry.get("position", "")) == "RF")
	assert(str(entry.get("specialization", "")) == "power")
	var visual: Dictionary = entry.get("visual", {})
	assert(str(visual.get("hair_color", "")) == "#3b1e49")
	assert(str(visual.get("accent", "")) == "#8b5cf6")
	assert(str(visual.get("eye", "")) == "#3c2148")
	assert(str(visual.get("skin", "")) == "#e1aa8d")
	assert(str(visual.get("uniform_color", "")) == "#f1e8ff")
	var player: PlayerData = Catalog.create_player(CHARACTER_ID)
	assert(player != null)
	assert(player.power == 76 and player.contact == 69 and player.speed == 57)
	assert(player.pitch == 54 and player.control == 67 and player.defense == 61)
	assert(player.critical == 16 and player.stamina == 74 and player.potential == 5)
	assert("attack" in player.skill_roles and "statistic" in player.skill_roles)
	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path))
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 4200)
		assert(not content.contains("<text"))
		assert(content.contains("#3b1e49") and content.contains("#8b5cf6"))
		assert(content.contains("#3c2148") and content.contains("#e1aa8d") and content.contains("#f1e8ff"))
		contents[expression_id] = content
	for a in Controller.VALID_EXPRESSIONS:
		for b in Controller.VALID_EXPRESSIONS:
			if a != b: assert(contents[a] != contents[b])
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw007_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw007_happy.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.FOCUSED).ends_with("bw007_focused.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.SURPRISED).ends_with("bw007_surprised.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.DISAPPOINTED).ends_with("bw007_disappointed.svg"))
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	print("bw007 structural and visual asset checks passed.")
func _build_visual_test() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.color = Color("#0b0710")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)
	var glow := ColorRect.new()
	glow.color = Color(0.55, 0.36, 0.96, 0.10)
	glow.position = Vector2(0, 92)
	glow.size = Vector2(1280, 520)
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(glow)
	var title := Label.new()
	title.text = "CHARACTER PRESENTATION • BW007"
	title.position = Vector2(58, 26)
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color("#f6efff"))
	add_child(title)
	var subtitle := Label.new()
	subtitle.text = "KIRA KUROSAWA  •  SSR  •  DARKNESS  •  RF  •  POWER"
	subtitle.position = Vector2(60, 62)
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("#8b5cf6"))
	add_child(subtitle)
	card = CardScript.new() as BaseballCharacterCard
	card.position = Vector2(52, 112)
	card.scale = Vector2(0.82, 0.82)
	add_child(card)
	assert(card != null)
	assert(card.has_method("setup") and card.has_method("set_expression") and card.has_method("current_expression"))
	card.setup(Catalog.create_player(CHARACTER_ID))
	var panel := Panel.new()
	panel.position = Vector2(548, 120)
	panel.size = Vector2(650, 510)
	panel.add_theme_stylebox_override("panel", _panel_style())
	add_child(panel)
	var panel_title := Label.new()
	panel_title.text = "EXPRESSIVE STATES"
	panel_title.position = Vector2(30, 24)
	panel_title.add_theme_font_size_override("font_size", 18)
	panel_title.add_theme_color_override("font_color", Color("#f6efff"))
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
		label.add_theme_color_override("font_color", Color("#c9b0e7"))
		frame.add_child(label)
	var info := Label.new()
	info.text = "Presentation-only expression states for Kira.\nNo expression may mutate PlayerData, progression, equipment, RNG or baseball results.\n\nThe card resolves portraits through CharacterExpressionController and remains renderer-only.\nEach SVG is autonomous vector art with no embedded font glyphs or external assets."
	info.position = Vector2(30, 284)
	info.size = Vector2(590, 158)
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_theme_font_size_override("font_size", 15)
	info.add_theme_color_override("font_color", Color("#ddd2e8"))
	panel.add_child(info)
	var footer := Label.new()
	footer.text = "VISUAL QA • 1280x720 • AUTONOMOUS SVG • ANDROID-SAFE VECTOR ASSETS"
	footer.position = Vector2(58, 674)
	footer.add_theme_font_size_override("font_size", 12)
	footer.add_theme_color_override("font_color", Color("#7e6a92"))
	add_child(footer)
func _set_focus_state() -> void:
	card.call("set_expression", Controller.FOCUSED)
func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#140d1b")
	style.border_color = Color("#8b5cf6")
	style.set_border_width_all(2)
	style.set_corner_radius_all(20)
	return style
func _small_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#1a1022")
	style.border_color = Color("#523772")
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	return style
