class_name BaseballCharacterCard
extends PanelContainer

## Production collection card.
## Presentation-only: reads PlayerData and character catalog data.
## It never mutates gameplay, progression, inventory, or probabilities.

const RARITY_STYLES := {
	"R": {
		"accent": "#a9b4c7",
		"accent_soft": "#eef3fa",
		"panel": "#111a2b",
		"panel_top": "#1b2940",
		"badge": "#607089",
		"label": "R",
		"rank": 1
	},
	"SR": {
		"accent": "#62c7ff",
		"accent_soft": "#e5f7ff",
		"panel": "#10263a",
		"panel_top": "#173a55",
		"badge": "#1876ad",
		"label": "SR",
		"rank": 2
	},
	"SSR": {
		"accent": "#c58cff",
		"accent_soft": "#f5e7ff",
		"panel": "#211633",
		"panel_top": "#392257",
		"badge": "#7842ad",
		"label": "SSR",
		"rank": 3
	},
	"UR": {
		"accent": "#ffd76a",
		"accent_soft": "#fff7d5",
		"panel": "#302410",
		"panel_top": "#513b16",
		"badge": "#b27a18",
		"label": "UR",
		"rank": 4
	}
}

const ELEMENT_COLORS := {
	"fire": "#ef6a4f",
	"water": "#55a9e8",
	"ice": "#8edff5",
	"lightning": "#f2cf55",
	"nature": "#6fc66b",
	"darkness": "#9b79d1",
	"light": "#f5e5a0",
	"neutral": "#a9b4c7"
}

const STAT_ORDER := [
	["power", "PWR"],
	["contact", "CON"],
	["speed", "SPD"],
	["defense", "DEF"],
	["pitch", "PIT"],
	["control", "CTL"],
	["critical", "CRT"],
	["stamina", "STA"]
]

var character_id := ""
var portrait: TextureRect
var portrait_frame: Control
var name_label: Label
var meta_label: Label
var rarity_badge: Label
var level_label: Label
var identity_label: Label
var comment_label: Label
var element_icon: Control
var element_label: Label
var stat_bars: Dictionary = {}
var accent_color := Color.WHITE
var expression_id := "neutral"
var _hovered := false

class CardElementIcon:
	extends Control

	var element := "neutral"
	var accent := Color.WHITE

	func setup(value: String) -> void:
		element = value.to_lower()
		accent = Color(str(ELEMENT_COLORS.get(element, ELEMENT_COLORS["neutral"])))
		custom_minimum_size = Vector2(42, 42)
		queue_redraw()

	func _draw() -> void:
		var c := accent
		var center := size * 0.5
		var radius := min(size.x, size.y) * 0.38
		draw_circle(center, radius + 2.0, Color(0, 0, 0, 0.35))
		draw_circle(center, radius, Color(c, 0.18))
		draw_arc(center, radius, 0.0, TAU, 24, c, 2.0, true)

		match element:
			"fire":
				var flame := PackedVector2Array([
					center + Vector2(0, -11),
					center + Vector2(8, 1),
					center + Vector2(4, 10),
					center + Vector2(-5, 10),
					center + Vector2(-9, 1)
				])
				draw_colored_polygon(flame, c)
			"water":
				var drop := PackedVector2Array([
					center + Vector2(0, -11),
					center + Vector2(9, 2),
					center + Vector2(5, 9),
					center + Vector2(-5, 9),
					center + Vector2(-9, 2)
				])
				draw_colored_polygon(drop, c)
			"ice":
				draw_line(center + Vector2(0, -11), center + Vector2(0, 11), c, 2.0)
				draw_line(center + Vector2(-9, -6), center + Vector2(9, 6), c, 2.0)
				draw_line(center + Vector2(-9, 6), center + Vector2(9, -6), c, 2.0)
			"lightning":
				var bolt := PackedVector2Array([
					center + Vector2(2, -12),
					center + Vector2(-7, 1),
					center + Vector2(0, 1),
					center + Vector2(-3, 12),
					center + Vector2(8, -3),
					center + Vector2(1, -3)
				])
				draw_colored_polygon(bolt, c)
			"nature":
				var leaf := PackedVector2Array([
					center + Vector2(0, -11),
					center + Vector2(10, -2),
					center + Vector2(2, 10),
					center + Vector2(-8, 4)
				])
				draw_colored_polygon(leaf, c)
				draw_line(center + Vector2(-4, 7), center + Vector2(5, -6), Color.WHITE, 1.5)
			"darkness":
				draw_circle(center, radius * 0.55, c)
				draw_circle(center + Vector2(5, -3), radius * 0.55, Color("#1a1725"))
			"light":
				var star := PackedVector2Array()
				for i in range(10):
					var angle := -PI * 0.5 + float(i) * PI / 5.0
					var rr := 11.0 if i % 2 == 0 else 5.0
					star.append(center + Vector2(cos(angle), sin(angle)) * rr)
				draw_colored_polygon(star, c)
			_:
				draw_circle(center, 5.0, c)

func setup(player: PlayerData, portrait_path: String = "", expression: String = "neutral") -> void:
	if player == null:
		return
	character_id = player.id
	expression_id = expression if CharacterExpressionController.is_valid(expression) else CharacterExpressionController.NEUTRAL
	if not has_node("CardRoot"):
		_build()
	_apply_player(player, portrait_path)

func _ready() -> void:
	if not has_node("CardRoot"):
		_build()

func _build() -> void:
	name = "CharacterCard"
	custom_minimum_size = Vector2(430, 570)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_apply_panel_style("R")

	var root := VBoxContainer.new()
	root.name = "CardRoot"
	root.add_theme_constant_override("separation", 6)
	add_child(root)

	portrait_frame = Control.new()
	portrait_frame.name = "PortraitArea"
	portrait_frame.custom_minimum_size = Vector2(400, 330)
	root.add_child(portrait_frame)

	portrait = TextureRect.new()
	portrait.name = "Portrait"
	portrait.position = Vector2(46, 8)
	portrait.size = Vector2(308, 308)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	portrait_frame.add_child(portrait)

	var frame := Panel.new()
	frame.name = "PortraitFrame"
	frame.position = Vector2(36, 0)
	frame.size = Vector2(328, 320)
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	portrait_frame.add_child(frame)
	portrait_frame.move_child(frame, 0)

	rarity_badge = _label("R", 22, Color.WHITE)
	rarity_badge.position = Vector2(14, 14)
	rarity_badge.size = Vector2(72, 40)
	rarity_badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rarity_badge.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	rarity_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	portrait_frame.add_child(rarity_badge)

	element_icon = CardElementIcon.new()
	element_icon.position = Vector2(342, 12)
	element_icon.size = Vector2(42, 42)
	element_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	portrait_frame.add_child(element_icon)

	name_label = _label("CHARACTER", 25, Color.WHITE)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(name_label)

	meta_label = _label("", 12, Color.WHITE)
	meta_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(meta_label)

	var progression := HBoxContainer.new()
	progression.name = "Progression"
	progression.alignment = BoxContainer.ALIGNMENT_CENTER
	progression.add_theme_constant_override("separation", 16)
	root.add_child(progression)

	level_label = _label("LV 1", 12, Color.WHITE)
	progression.add_child(level_label)

	element_label = _label("ELEMENT", 12, Color.WHITE)
	progression.add_child(element_label)

	identity_label = _label("", 11, Color.WHITE)
	identity_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	identity_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	identity_label.custom_minimum_size = Vector2(0, 28)
	root.add_child(identity_label)

	var stats_grid := GridContainer.new()
	stats_grid.name = "Stats"
	stats_grid.columns = 2
	stats_grid.add_theme_constant_override("h_separation", 12)
	stats_grid.add_theme_constant_override("v_separation", 3)
	root.add_child(stats_grid)

	for entry in STAT_ORDER:
		var stat_key: String = entry[0]
		var stat_short: String = entry[1]
		var row := HBoxContainer.new()
		row.custom_minimum_size = Vector2(188, 22)
		var label := _label(stat_short, 10, Color("#aebbd3"))
		label.custom_minimum_size = Vector2(34, 20)
		row.add_child(label)
		var bar := ProgressBar.new()
		bar.custom_minimum_size = Vector2(140, 15)
		bar.max_value = 100.0
		bar.show_percentage = false
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		row.add_child(bar)
		stats_grid.add_child(row)
		stat_bars[stat_key] = bar

	comment_label = _label("", 10, Color("#dce5f7"))
	comment_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	comment_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	comment_label.custom_minimum_size = Vector2(0, 34)
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

	meta_label.text = "%s  •  %s  •  %s" % [
		str(player.position),
		str(player.element).to_upper(),
		str(player.specialization).to_upper()
	]
	meta_label.add_theme_color_override("font_color", accent_color)

	level_label.text = "LV %d  •  POT %d" % [player.level, player.potential]
	var element := str(player.element).to_lower()
	element_label.text = element.to_upper()
	element_label.add_theme_color_override("font_color", Color(str(ELEMENT_COLORS.get(element, ELEMENT_COLORS["neutral"]))))
	(element_icon as CardElementIcon).setup(element)

	var identity := ""
	var archetype := CharacterArchetypeCatalog.find(player.id)
	var identity_data: Dictionary = archetype.get("character_identity", {})
	if not identity_data.is_empty():
		identity = str(identity_data.get("play_identity", "")).replace("_", " ").to_upper()
	else:
		identity = "BASEBALL PLAYER"
	identity_label.add_theme_color_override("font_color", Color("#dce5f7"))
	identity_label.text = identity
	identity_label.add_theme_color_override("font_color", Color("#dce5f7"))

	for entry in STAT_ORDER:
		var stat_key: String = entry[0]
		var bar: ProgressBar = stat_bars.get(stat_key)
		if bar == null:
			continue
		bar.value = clamp(float(player.get(stat_key)), 0.0, 100.0)
		var fill := StyleBoxFlat.new()
		fill.bg_color = accent_color
		fill.corner_radius_top_left = 6
		fill.corner_radius_top_right = 6
		fill.corner_radius_bottom_left = 6
		fill.corner_radius_bottom_right = 6
		bar.add_theme_stylebox_override("fill", fill)
		var background := StyleBoxFlat.new()
		background.bg_color = Color(1, 1, 1, 0.07)
		background.corner_radius_top_left = 6
		background.corner_radius_top_right = 6
		background.corner_radius_bottom_left = 6
		background.corner_radius_bottom_right = 6
		bar.add_theme_stylebox_override("background", background)

	var path := CharacterExpressionController.resolve_portrait_path(player.id, expression_id, portrait_path)
	if not path.is_empty() and ResourceLoader.exists(path):
		portrait.texture = load(path)
	_play_entry_animation()

func _play_entry_animation() -> void:
	modulate = Color(1, 1, 1, 0)
	scale = Vector2(0.965, 0.965)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate", Color.WHITE, 0.20)
	tween.tween_property(self, "scale", Vector2.ONE, 0.30).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func set_expression(expression: String) -> void:
	expression_id = expression if CharacterExpressionController.is_valid(expression) else CharacterExpressionController.NEUTRAL
	if character_id.is_empty() or portrait == null:
		return
	var path := CharacterExpressionController.resolve_portrait_path(character_id, expression_id)
	if not path.is_empty() and ResourceLoader.exists(path):
		portrait.texture = load(path)
	_play_entry_animation()

func set_comment(text_value: String) -> void:
	if comment_label != null:
		comment_label.text = text_value

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_hovered = true
		if not get_meta("hover_animation_running", false):
			set_meta("hover_animation_running", true)
			var tween := create_tween()
			tween.tween_property(self, "scale", Vector2(1.012, 1.012), 0.10)
			tween.finished.connect(func() -> void: set_meta("hover_animation_running", false))
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		accept_event()

func _notification(what: int) -> void:
	if what == NOTIFICATION_MOUSE_EXIT:
		_hovered = false
		var tween := create_tween()
		tween.tween_property(self, "scale", Vector2.ONE, 0.10)

func _apply_panel_style(rarity: String) -> void:
	var style: Dictionary = RARITY_STYLES.get(rarity, RARITY_STYLES["R"])
	var panel := BaseballUITheme.panel_style(
		Color(str(style["panel"])),
		Color(str(style["accent"])),
		22,
		2
	)
	panel.shadow_size = 12
	add_theme_stylebox_override("panel", panel)

func _badge_style(fill: String, border: String) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(fill, 0.96)
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
