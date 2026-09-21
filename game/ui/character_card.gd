class_name BaseballCharacterCard
extends PanelContainer

## Reusable collection card presentation.
## Presentation-only: it reads PlayerData and never changes gameplay state.

const RARITY_STYLES := {
	"R": {
		"accent": "#a9b4c7",
		"accent_soft": "#dce3ee",
		"panel": "#172033",
		"badge": "#7f8da5",
		"label": "R"
	},
	"SR": {
		"accent": "#62c7ff",
		"accent_soft": "#d9f3ff",
		"panel": "#13283b",
		"badge": "#2388c5",
		"label": "SR"
	},
	"SSR": {
		"accent": "#c58cff",
		"accent_soft": "#f0ddff",
		"panel": "#24183a",
		"badge": "#8b4fc4",
		"label": "SSR"
	},
	"UR": {
		"accent": "#ffd76a",
		"accent_soft": "#fff3c2",
		"panel": "#332713",
		"badge": "#c18a20",
		"label": "UR"
	}
}

var character_id := ""
var portrait: TextureRect
var name_label: Label
var meta_label: Label
var rarity_badge: Label
var stats_label: Label
var identity_label: Label
var accent_color := Color.WHITE

func setup(player: PlayerData, portrait_path: String = "") -> void:
	if player == null:
		return
	character_id = player.id
	_build()
	_apply_player(player, portrait_path)

func _ready() -> void:
	if not has_node("CardRoot"):
		_build()

func _build() -> void:
	name = "CharacterCard"
	custom_minimum_size = Vector2(430, 500)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_apply_panel_style("R")

	var root := VBoxContainer.new()
	root.name = "CardRoot"
	root.add_theme_constant_override("separation", 5)
	add_child(root)

	var visual := Control.new()
	visual.name = "PortraitArea"
	visual.custom_minimum_size = Vector2(400, 315)
	root.add_child(visual)

	portrait = TextureRect.new()
	portrait.name = "Portrait"
	portrait.position = Vector2(48, 5)
	portrait.size = Vector2(304, 304)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	visual.add_child(portrait)

	var glow := Panel.new()
	glow.name = "PortraitGlow"
	glow.position = Vector2(38, 0)
	glow.size = Vector2(324, 314)
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	visual.add_child(glow)
	visual.move_child(glow, 0)

	rarity_badge = _label("R", 22, Color.WHITE)
	rarity_badge.position = Vector2(16, 14)
	rarity_badge.size = Vector2(74, 42)
	rarity_badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rarity_badge.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	rarity_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	visual.add_child(rarity_badge)

	name_label = _label("CHARACTER", 25, Color.WHITE)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(name_label)

	meta_label = _label("", 12, Color.WHITE)
	meta_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(meta_label)

	identity_label = _label("", 11, Color.WHITE)
	identity_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	identity_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	identity_label.custom_minimum_size = Vector2(0, 30)
	root.add_child(identity_label)

	stats_label = _label("", 11, Color.WHITE)
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(stats_label)

	comment_label = _label("", 11, Color("#dce5f7"))
	comment_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	comment_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	comment_label.custom_minimum_size = Vector2(0, 38)
	root.add_child(comment_label)

func _apply_player(player: PlayerData, portrait_path: String) -> void:
	var rarity := str(player.rarity).to_upper()
	var style: Dictionary = RARITY_STYLES.get(rarity, RARITY_STYLES["R"])
	accent_color = Color(str(style["accent"]))
	_apply_panel_style(rarity)

	rarity_badge.text = str(style["label"])
	rarity_badge.add_theme_color_override("font_color", Color(str(style["accent_soft"])))
	rarity_badge.add_theme_stylebox_override("normal", _badge_style(str(style["badge"]), str(style["accent"])))

	name_label.text = player.display_name
	name_label.add_theme_color_override("font_color", Color(str(style["accent_soft"])))

	meta_label.text = "%s  •  %s  •  %s  •  %s" % [
		rarity,
		str(player.position),
		str(player.element).to_upper(),
		str(player.specialization).to_upper()
	]
	meta_label.add_theme_color_override("font_color", accent_color)

	var identity := ""
	var archetype := CharacterArchetypeCatalog.find(player.id)
	var identity_data: Dictionary = archetype.get("character_identity", {})
	if not identity_data.is_empty():
		identity = str(identity_data.get("play_identity", "")).replace("_", " ").to_upper()
	identity_label.text = identity
	identity_label.add_theme_color_override("font_color", Color("#dce5f7"))
	else:
		identity_label.text = "BASEBALL PLAYER"
		identity_label.add_theme_color_override("font_color", Color("#aebbd3"))

	stats_label.text = "PWR %d   CON %d   SPD %d   DEF %d" % [
		player.power, player.contact, player.speed, player.defense
	]
	stats_label.add_theme_color_override("font_color", Color("#aebbd3"))

	var path := portrait_path
	if path.is_empty():
		path = "res://assets/characters/generated/%s.svg" % player.id
	if ResourceLoader.exists(path):
		portrait.texture = load(path)
	_play_entry_animation()

func _play_entry_animation() -> void:
	modulate = Color(1, 1, 1, 0)
	scale = Vector2(0.97, 0.97)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate", Color.WHITE, 0.22)
	tween.tween_property(self, "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func set_comment(text_value: String) -> void:
	if comment_label != null:
		comment_label.text = text_value

func _apply_panel_style(rarity: String) -> void:
	var style: Dictionary = RARITY_STYLES.get(rarity, RARITY_STYLES["R"])
	var panel := StyleBoxFlat.new()
	panel.bg_color = Color(str(style["panel"]))
	panel.border_color = Color(str(style["accent"]))
	panel.set_border_width_all(3)
	panel.set_corner_radius_all(24)
	panel.shadow_color = Color(0, 0, 0, 0.38)
	panel.shadow_size = 10
	panel.content_margin_left = 14
	panel.content_margin_right = 14
	panel.content_margin_top = 12
	panel.content_margin_bottom = 12
	add_theme_stylebox_override("panel", panel)

func _badge_style(fill: String, border: String) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(fill, 0.94)
	style.border_color = Color(border)
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	return style

func _label(value: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	return label
