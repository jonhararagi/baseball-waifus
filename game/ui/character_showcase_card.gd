class_name CharacterShowcaseCard
extends Panel

const PORTRAIT_ROOT := "res://assets/ui/characters/"
const ICON_ROOT := "res://assets/ui/icons/"

const CARD_SIZE := Vector2(430.0, 560.0)
const INNER_MARGIN := 24.0
const PORTRAIT_SIZE := Vector2(382.0, 290.0)

var character_id := ""
var character_data: Dictionary = {}
var player_data: PlayerData

var portrait: TextureRect
var name_label: Label
var identity_label: Label
var rarity_label: Label
var level_label: Label
var element_icon: TextureRect
var element_label: Label
var position_label: Label
var power_icon: TextureRect
var power_value: Label
var stat_rows: VBoxContainer
var mood_label: Label
var energy_label: Label
var accent_line: ColorRect

var _portrait_base_position := Vector2.ZERO

func _ready() -> void:
	custom_minimum_size = CARD_SIZE
	size = CARD_SIZE
	mouse_filter = Control.MOUSE_FILTER_PASS
	_build_style()
	_build_layout()
	if not character_id.is_empty():
		_refresh()

func setup(target_character_id: String, target_player: PlayerData = null) -> void:
	assert(target_character_id == "bw001", "CharacterShowcaseCard phase 1 is intentionally limited to bw001.")
	character_id = target_character_id
	character_data = CharacterArchetypeCatalog.find(character_id)
	assert(not character_data.is_empty(), "Character catalog entry must exist for " + character_id)

	player_data = target_player
	if player_data == null:
		player_data = CharacterArchetypeCatalog.create_player(character_id)

	if is_inside_tree():
		_refresh()

func _build_style() -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#11172a")
	style.border_color = Color("#a76a36")
	style.set_border_width_all(2)
	style.corner_radius_top_left = 24
	style.corner_radius_top_right = 24
	style.corner_radius_bottom_left = 24
	style.corner_radius_bottom_right = 24
	style.shadow_color = Color(0.0, 0.0, 0.0, 0.42)
	style.shadow_size = 18
	style.shadow_offset = Vector2(0, 8)
	add_theme_stylebox_override("panel", style)

func _build_layout() -> void:
	portrait = TextureRect.new()
	portrait.position = Vector2(INNER_MARGIN, INNER_MARGIN)
	portrait.size = PORTRAIT_SIZE
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(portrait)

	var portrait_frame := Panel.new()
	portrait_frame.position = portrait.position
	portrait_frame.size = portrait.size
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var frame_style := StyleBoxFlat.new()
	frame_style.bg_color = Color(0.0, 0.0, 0.0, 0.0)
	frame_style.border_color = Color("#e9bb6b")
	frame_style.set_border_width_all(2)
	frame_style.corner_radius_top_left = 18
	frame_style.corner_radius_top_right = 18
	frame_style.corner_radius_bottom_left = 18
	frame_style.corner_radius_bottom_right = 18
	portrait_frame.add_theme_stylebox_override("panel", frame_style)
	add_child(portrait_frame)

	var rarity_badge := Panel.new()
	rarity_badge.position = Vector2(28, 28)
	rarity_badge.size = Vector2(54, 40)
	rarity_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rarity_badge.add_theme_stylebox_override("panel", _pill_style("#9b552f", "#f7d27b", 16))
	add_child(rarity_badge)

	rarity_label = _make_label("R", 22, Color("#fff3d0"))
	rarity_label.position = Vector2(0, 0)
	rarity_label.size = rarity_badge.size
	rarity_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rarity_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	rarity_badge.add_child(rarity_label)

	level_label = _make_label("LV. 1", 14, Color("#dfe8ff"))
	level_label.position = Vector2(318, 33)
	level_label.size = Vector2(80, 26)
	level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(level_label)

	name_label = _make_label("Aiko Hanamori", 27, Color("#fff7e4"))
	name_label.position = Vector2(INNER_MARGIN, 328)
	name_label.size = Vector2(382, 38)
	add_child(name_label)

	identity_label = _make_label("POWER • THIRD BASE", 13, Color("#e7bc7a"))
	identity_label.position = Vector2(INNER_MARGIN, 366)
	identity_label.size = Vector2(382, 24)
	add_child(identity_label)

	accent_line = ColorRect.new()
	accent_line.position = Vector2(INNER_MARGIN, 396)
	accent_line.size = Vector2(382, 3)
	accent_line.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(accent_line)

	element_icon = TextureRect.new()
	element_icon.position = Vector2(INNER_MARGIN, 414)
	element_icon.size = Vector2(30, 30)
	element_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	element_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	element_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(element_icon)

	element_label = _make_label("FIRE", 15, Color("#ffbb7a"))
	element_label.position = Vector2(60, 416)
	element_label.size = Vector2(100, 25)
	add_child(element_label)

	power_icon = TextureRect.new()
	power_icon.position = Vector2(178, 414)
	power_icon.size = Vector2(30, 30)
	power_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	power_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	power_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(power_icon)

	power_value = _make_label("POWER 72", 15, Color("#f9df9c"))
	power_value.position = Vector2(214, 416)
	power_value.size = Vector2(190, 25)
	power_value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(power_value)

	stat_rows = VBoxContainer.new()
	stat_rows.position = Vector2(INNER_MARGIN, 454)
	stat_rows.size = Vector2(382, 74)
	stat_rows.add_theme_constant_override("separation", 4)
	stat_rows.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(stat_rows)

	mood_label = _make_label("MOOD 100", 12, Color("#a8e8d0"))
	mood_label.position = Vector2(24, 532)
	mood_label.size = Vector2(175, 20)
	add_child(mood_label)

	energy_label = _make_label("ENERGY 100 / 100", 12, Color("#a7d4ff"))
	energy_label.position = Vector2(220, 532)
	energy_label.size = Vector2(186, 20)
	energy_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(energy_label)

func _refresh() -> void:
	var visual: Dictionary = character_data.get("visual", {})
	var stats: Dictionary = character_data.get("stats", {})

	var portrait_path := PORTRAIT_ROOT + character_id + "_portrait.svg"
	portrait.texture = load(portrait_path) as Texture2D
	assert(portrait.texture != null, "Missing portrait asset: " + portrait_path)

	element_icon.texture = load(ICON_ROOT + "icon_fire.svg") as Texture2D
	power_icon.texture = load(ICON_ROOT + "icon_power.svg") as Texture2D

	name_label.text = str(character_data.get("display_name", ""))
	identity_label.text = "%s • %s" % [
		str(character_data.get("specialization", "CONTACT")).to_upper(),
		str(character_data.get("position", "CF")).to_upper()
	]
	rarity_label.text = str(character_data.get("rarity", "R"))
	level_label.text = "LV. %d" % int(player_data.level if player_data else 1)
	element_label.text = str(character_data.get("element", "neutral")).to_upper()
	power_value.text = "POWER %d" % int(stats.get("power", 0))
	accent_line.color = Color(str(visual.get("accent", "#e4572e")))

	_clear_stat_rows()
	_add_stat_row("CONTACT", int(stats.get("contact", 0)))
	_add_stat_row("DEFENSE", int(stats.get("defense", 0)))
	_add_stat_row("STAMINA", int(stats.get("stamina", 0)))

	var mood := int(player_data.mood if player_data else 100)
	var energy := int(player_data.energy if player_data else 100)
	mood_label.text = "MOOD %d" % mood
	energy_label.text = "ENERGY %d / 100" % energy

	if is_inside_tree():
		_play_entry_animation()

func _clear_stat_rows() -> void:
	for child in stat_rows.get_children():
		child.free()

func _add_stat_row(stat_name: String, value: int) -> void:
	var row := Control.new()
	row.custom_minimum_size = Vector2(382, 21)
	stat_rows.add_child(row)

	var label := _make_label(stat_name, 10, Color("#94a3bf"))
	label.position = Vector2.ZERO
	label.size = Vector2(78, 20)
	row.add_child(label)

	var bar := ProgressBar.new()
	bar.position = Vector2(84, 4)
	bar.size = Vector2(248, 12)
	bar.min_value = 0.0
	bar.max_value = 100.0
	bar.value = value
	bar.show_percentage = false
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_theme_stylebox_override("background", _bar_style("#202941"))
	bar.add_theme_stylebox_override("fill", _bar_style("#e4572e"))
	row.add_child(bar)

	var value_label := _make_label(str(value), 11, Color("#f3e7ca"))
	value_label.position = Vector2(340, 0)
	value_label.size = Vector2(42, 20)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(value_label)

func _make_label(text_value: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text_value
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.45))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 2)
	return label

func _pill_style(background: String, border: String, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(background)
	style.border_color = Color(border)
	style.set_border_width_all(1)
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	return style

func _bar_style(color_hex: String) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(color_hex)
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	return style

func _play_entry_animation() -> void:
	modulate = Color(1, 1, 1, 0)
	scale = Vector2(0.96, 0.96)
	pivot_offset = size * 0.5
	var tween := create_tween().set_parallel(true)
	tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate", Color.WHITE, 0.34)
	tween.tween_property(self, "scale", Vector2.ONE, 0.42)
	tween.tween_property(self, "position:y", position.y - 8.0, 0.42)
	tween.chain().tween_property(self, "position:y", position.y, 0.12)

func focus_card() -> void:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2(1.025, 1.025), 0.12)
	tween.tween_property(self, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
