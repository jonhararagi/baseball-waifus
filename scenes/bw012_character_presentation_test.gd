extends Control

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const Catalog: Script = preload("res://game/characters/character_archetype_catalog.gd")

const CHARACTER_ID := "bw012"
const EXPRESSION_LABELS := {
	"neutral": "NEUTRAL",
	"happy": "HAPPY",
	"focused": "FOCUSED",
	"surprised": "SURPRISED",
	"disappointed": "DISAPPOINTED"
}

var card: BaseballCharacterCard

func _ready() -> void:
	_validate_canonical_data()
	_build_visual_test()
	call_deferred("_set_focus_state")

func _validate_canonical_data() -> void:
	var entry: Dictionary = Catalog.call("find", CHARACTER_ID)
	assert(not entry.is_empty(), "bw012 must exist in the canonical catalog.")
	assert(str(entry.get("display_name", "")) == "Sayu Kisaragi")
	assert(str(entry.get("rarity", "")) == "SR")
	assert(str(entry.get("element", "")) == "nature")
	assert(str(entry.get("position", "")) == "SS")
	assert(str(entry.get("specialization", "")) == "defender")

	var visual: Dictionary = entry.get("visual", {})
	assert(str(visual.get("hair_color", "")) == "#31513f")
	assert(str(visual.get("accent", "")) == "#4cae5f")
	assert(str(visual.get("eye", "")) == "#22392a")
	assert(str(visual.get("skin", "")) == "#d59a78")
	assert(str(visual.get("uniform_color", "")) == "#eef7e4")

	var identity: Dictionary = entry.get("character_identity", {})
	assert(str(identity.get("archetype", "")) == "quiet_nature_defender")
	assert(str(identity.get("play_identity", "")) == "coverage_anchor")
	assert(identity.get("signature_action_ids", []) == ["coverage_switch"])
	assert("defense" in identity.get("skill_roles", []))
	assert("combination" in identity.get("skill_roles", []))

	var player: PlayerData = Catalog.create_player(CHARACTER_ID)
	assert(player != null, "Canonical bw012 PlayerData must be constructible.")
	assert(player.id == CHARACTER_ID)
	assert(player.rarity == "SR")
	assert(player.position == "SS")
	assert(player.element == "nature")
	assert(player.power == 58 and player.contact == 67 and player.speed == 70)
	assert(player.pitch == 52 and player.control == 59 and player.defense == 84)
	assert(player.critical == 11 and player.stamina == 80 and player.potential == 4)

	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path), "Missing bw012 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 4500, "bw012 expression asset is unexpectedly small: " + expression_id)
		var normalized := content.to_lower()
		assert(normalized.begins_with("<?xml version="), "bw012 SVG must begin with XML header: " + expression_id)
		assert(normalized.contains("<svg "), "bw012 SVG root missing: " + expression_id)
		assert(normalized.contains("</svg>"), "bw012 SVG must close correctly: " + expression_id)
		assert(not normalized.contains("<text"), "bw012 SVG must not embed font/text nodes: " + expression_id)
		assert(not normalized.contains("xlink:href"), "bw012 SVG must not reference external XML links: " + expression_id)
		assert(not normalized.contains("href="), "bw012 SVG must not reference external resources: " + expression_id)
		assert(not normalized.contains("url(http"), "bw012 SVG must not reference remote paint resources: " + expression_id)
		assert(content.contains("#31513f"), "bw012 hair palette drifted: " + expression_id)
		assert(content.contains("#4cae5f"), "bw012 accent palette drifted: " + expression_id)
		assert(content.contains("#22392a"), "bw012 eye palette drifted: " + expression_id)
		assert(content.contains("#d59a78"), "bw012 skin palette drifted: " + expression_id)
		assert(content.contains("#eef7e4"), "bw012 uniform palette drifted: " + expression_id)
		contents[expression_id] = content

	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(contents[first_id] != contents[second_id], "bw012 expression assets must remain distinct.")

	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw012_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw012_happy.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.FOCUSED).ends_with("bw012_focused.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.SURPRISED).ends_with("bw012_surprised.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.DISAPPOINTED).ends_with("bw012_disappointed.svg"))
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL)
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	print("bw012 structural and visual asset checks passed.")

func _build_visual_test() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.color = Color("#07120d")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var glow := ColorRect.new()
	glow.color = Color(0.30, 0.68, 0.37, 0.08)
	glow.position = Vector2(0, 92)
	glow.size = Vector2(1280, 520)
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(glow)

	var title := Label.new()
	title.text = "CHARACTER PRESENTATION • BW012"
	title.position = Vector2(58, 26)
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color("#eef7e4"))
	add_child(title)

	var subtitle := Label.new()
	subtitle.text = "SAYU KISARAGI  •  SR  •  NATURE  •  SS  •  DEFENDER"
	subtitle.position = Vector2(60, 62)
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("#4cae5f"))
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
	panel_title.add_theme_color_override("font_color", Color("#eef7e4"))
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
		label.add_theme_color_override("font_color", Color("#4cae5f"))
		frame.add_child(label)

	var info := Label.new()
	info.text = "Presentation-only states for Sayu.\nThe expression layer never mutates PlayerData, progression, equipment, RNG or baseball results.\n\nThe collection card resolves portraits through CharacterExpressionController and remains renderer-only.\nThe SVG assets are autonomous vector art with no embedded glyphs or external dependencies."
	info.position = Vector2(30, 284)
	info.size = Vector2(590, 158)
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_theme_font_size_override("font_size", 15)
	info.add_theme_color_override("font_color", Color("#dce9df"))
	panel.add_child(info)

	var signature := Label.new()
	signature.text = "COVERAGE ANCHOR  •  COVERAGE SWITCH  •  DEFENSE 84"
	signature.position = Vector2(30, 455)
	signature.add_theme_font_size_override("font_size", 13)
	signature.add_theme_color_override("font_color", Color("#9acda4"))
	panel.add_child(signature)

	var footer := Label.new()
	footer.text = "VISUAL QA • 1280x720 • AUTONOMOUS SVG • ANDROID-SAFE VECTOR ASSETS"
	footer.position = Vector2(58, 674)
	footer.add_theme_font_size_override("font_size", 12)
	footer.add_theme_color_override("font_color", Color("#7e9f84"))
	add_child(footer)

func _set_focus_state() -> void:
	if card != null:
		card.call("set_expression", Controller.FOCUSED)

func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#11251a")
	style.border_color = Color("#4cae5f")
	style.set_border_width_all(2)
	style.set_corner_radius_all(20)
	return style

func _small_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#183522")
	style.border_color = Color("#386f46")
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	return style
