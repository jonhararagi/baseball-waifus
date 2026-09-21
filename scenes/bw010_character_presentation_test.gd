extends Control

const Controller = preload("res://game/ui/character_expression_controller.gd")
const CardScript = preload("res://game/ui/character_card.gd")
const Catalog: Script = preload("res://game/characters/character_archetype_catalog.gd")

const CHARACTER_ID := "bw010"
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
	assert(not entry.is_empty(), "bw010 must exist in the canonical catalog.")
	assert(str(entry.get("display_name", "")) == "Mei Kanzaki")
	assert(str(entry.get("rarity", "")) == "SSR")
	assert(str(entry.get("element", "")) == "lightning")
	assert(str(entry.get("position", "")) == "DH")
	assert(str(entry.get("specialization", "")) == "pitcher")

	var visual: Dictionary = entry.get("visual", {})
	assert(str(visual.get("hair_color", "")) == "#60406e")
	assert(str(visual.get("accent", "")) == "#f6d447")
	assert(str(visual.get("eye", "")) == "#473153")
	assert(str(visual.get("skin", "")) == "#efc2a0")
	assert(str(visual.get("uniform_color", "")) == "#f5efff")

	var identity: Dictionary = entry.get("character_identity", {})
	assert(str(identity.get("archetype", "")) == "lightning_precision_pitcher")
	assert(str(identity.get("play_identity", "")) == "count_trap")
	assert("count_trap" in identity.get("signature_action_ids", []))
	assert("power_down" in identity.get("skill_roles", []))
	assert("combination" in identity.get("skill_roles", []))

	var player: PlayerData = Catalog.create_player(CHARACTER_ID)
	assert(player != null, "Canonical bw010 PlayerData must be constructible.")
	assert(player.id == CHARACTER_ID)
	assert(player.power == 49 and player.contact == 56 and player.speed == 61)
	assert(player.pitch == 79 and player.control == 84 and player.defense == 65)
	assert(player.critical == 14 and player.stamina == 82 and player.potential == 5)

	var contents: Dictionary = {}
	for expression_id in Controller.VALID_EXPRESSIONS:
		var path := "res://assets/characters/expressions/%s_%s.svg" % [CHARACTER_ID, expression_id]
		assert(ResourceLoader.exists(path), "Missing bw010 expression asset: " + expression_id)
		var content := FileAccess.get_file_as_string(path)
		assert(content.length() > 4500, "bw010 expression asset is unexpectedly small: " + expression_id)
		var normalized := content.to_lower()
		assert(not normalized.contains("<text"), "bw010 SVG must not embed text or fonts: " + expression_id)
		assert(not normalized.contains("xlink:href"), "bw010 SVG must not reference external XML links: " + expression_id)
		assert(not normalized.contains("href="), "bw010 SVG must not reference external resources: " + expression_id)
		assert(not normalized.contains("url(http"), "bw010 SVG must not reference external paint resources: " + expression_id)
		assert(content.contains("#60406e"), "bw010 hair palette drifted: " + expression_id)
		assert(content.contains("#f6d447"), "bw010 accent palette drifted: " + expression_id)
		assert(content.contains("#473153"), "bw010 eye palette drifted: " + expression_id)
		assert(content.contains("#efc2a0"), "bw010 skin palette drifted: " + expression_id)
		assert(content.contains("#f5efff"), "bw010 uniform palette drifted: " + expression_id)
		contents[expression_id] = content

	for first_id in Controller.VALID_EXPRESSIONS:
		for second_id in Controller.VALID_EXPRESSIONS:
			if first_id == second_id:
				continue
			assert(contents[first_id] != contents[second_id], "bw010 expression assets must remain distinct.")

	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.NEUTRAL).ends_with("bw010_neutral.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.HAPPY).ends_with("bw010_happy.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.FOCUSED).ends_with("bw010_focused.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.SURPRISED).ends_with("bw010_surprised.svg"))
	assert(Controller.resolve_portrait_path(CHARACTER_ID, Controller.DISAPPOINTED).ends_with("bw010_disappointed.svg"))
	assert(Controller.expression_for_comment(0) == Controller.NEUTRAL)
	assert(Controller.expression_for_comment(8) == Controller.DISAPPOINTED)
	print("bw010 structural and visual asset checks passed.")

func _build_visual_test() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.color = Color("#080611")
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
	title.text = "CHARACTER PRESENTATION • BW010"
	title.position = Vector2(58, 26)
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color("#f5efff"))
	add_child(title)

	var subtitle := Label.new()
	subtitle.text = "MEI KANZAKI  •  SSR  •  LIGHTNING  •  DH  •  PITCHER"
	subtitle.position = Vector2(60, 62)
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("#f6d447"))
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
	panel_title.add_theme_color_override("font_color", Color("#f5efff"))
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
	info.text = "Presentation-only states for Mei.\nThe expression layer never mutates PlayerData, progression, equipment, RNG or baseball results.\n\nThe collection card resolves portraits through CharacterExpressionController and remains renderer-only.\nThe SVG assets are autonomous vector art with no embedded font glyphs or external dependencies."
	info.position = Vector2(30, 284)
	info.size = Vector2(590, 158)
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_theme_font_size_override("font_size", 15)
	info.add_theme_color_override("font_color", Color("#e4dff0"))
	panel.add_child(info)

	var footer := Label.new()
	footer.text = "VISUAL QA • 1280x720 • AUTONOMOUS SVG • ANDROID-SAFE VECTOR ASSETS"
	footer.position = Vector2(58, 674)
	footer.add_theme_font_size_override("font_size", 12)
	footer.add_theme_color_override("font_color", Color("#8f7eaa"))
	add_child(footer)

func _set_focus_state() -> void:
	if card != null:
		card.call("set_expression", Controller.FOCUSED)

func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#120d1d")
	style.border_color = Color("#f6d447")
	style.set_border_width_all(2)
	style.set_corner_radius_all(20)
	return style

func _small_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#1b1328")
	style.border_color = Color("#634f7e")
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	return style
