class_name BaseballHub
extends Control

const STARTER_ID := "bw001"
const MATCH_SCENE := "res://scenes/main.tscn"
const CARD_SIZE := Vector2(430.0, 560.0)

var progress_store := PlayerProgressStore.new()
var roster_store := CharacterRosterStore.new()
var avatar_roster := AvatarRosterService.new()
var dialogue := StartingCharacterDialogue.new()

var starter: PlayerData
var starter_avatar: AnimeAvatar2D
var character_card: CharacterShowcaseCard
var energy_label: Label
var coins_label: Label
var dialogue_label: Label
var dialogue_index := 0

func _ready() -> void:
    set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    mouse_filter = Control.MOUSE_FILTER_STOP
    dialogue.load_data()
    _prepare_starter()
    _build_hub()
    resized.connect(_layout)
    _layout()
    _play_hub_intro()

func _prepare_starter() -> void:
    var catalog_player := CharacterArchetypeCatalog.create_player(STARTER_ID)
    assert(catalog_player != null, "Starter character bw001 must exist.")
    var ensure_result := roster_store.ensure_character(catalog_player)
    assert(bool(ensure_result.get("ok", false)), "Starter bw001 must be persistable.")
    starter = roster_store.get_player(STARTER_ID)
    assert(starter != null, "Starter bw001 must be available.")

func _build_hub() -> void:
    _build_header()
    _build_stage()
    _build_character_card()
    _build_actions()
    _build_dialogue_panel()
    _refresh_resources()
    queue_redraw()

func _build_header() -> void:
    var logo := TextureRect.new()
    logo.position = Vector2(34, 24)
    logo.size = Vector2(70, 70)
    logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
    logo.texture = load("res://assets/ui/baseball_waifus_icon.svg") as Texture2D
    logo.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(logo)

    var title := _make_label("BASEBALL WAIFUS", 26, Color("#fff3d5"))
    title.position = Vector2(116, 27)
    title.size = Vector2(420, 34)
    add_child(title)

    var subtitle := _make_label("SEASON 01  •  PLAYER HUB", 11, Color("#9faccc"))
    subtitle.position = Vector2(118, 59)
    subtitle.size = Vector2(360, 20)
    add_child(subtitle)

    var resource_panel := Panel.new()
    resource_panel.position = Vector2(730, 28)
    resource_panel.size = Vector2(500, 58)
    resource_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
    resource_panel.add_theme_stylebox_override("panel", _panel_style("#10172a", "#334365", 18))
    add_child(resource_panel)

    energy_label = _make_label("ENERGÍA 100 / 100", 14, Color("#9bd7ff"))
    energy_label.position = Vector2(26, 14)
    energy_label.size = Vector2(190, 28)
    resource_panel.add_child(energy_label)

    coins_label = _make_label("MONEDAS 0", 14, Color("#f4d18b"))
    coins_label.position = Vector2(236, 14)
    coins_label.size = Vector2(210, 28)
    coins_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    resource_panel.add_child(coins_label)

func _build_stage() -> void:
    var tag := _make_label("JUGADORA INICIAL", 11, Color("#e6b36f"))
    tag.position = Vector2(76, 118)
    tag.size = Vector2(360, 22)
    add_child(tag)

    var name := _make_label("Aiko Hanamori", 34, Color("#fff8eb"))
    name.position = Vector2(76, 145)
    name.size = Vector2(470, 46)
    add_child(name)

    var role := _make_label("POWER  •  3B  •  FIRE", 14, Color("#f2ad73"))
    role.position = Vector2(78, 189)
    role.size = Vector2(360, 24)
    add_child(role)

    starter_avatar = AvatarRendererFactory.create(
        avatar_roster.profile_for_player(starter),
        Vector2.ZERO,
        30
    ) as AnimeAvatar2D
    assert(starter_avatar != null, "bw001 hub renderer must resolve to AnimeAvatar2D.")
    starter_avatar.set_pose(AnimeAvatar2D.Pose.MENU_IDLE)
    starter_avatar.scale = Vector2(1.28, 1.28)
    add_child(starter_avatar)

    var spotlight := Panel.new()
    spotlight.name = "CharacterSpotlight"
    spotlight.mouse_filter = Control.MOUSE_FILTER_IGNORE
    spotlight.add_theme_stylebox_override("panel", _panel_style(
        Color(0.06, 0.09, 0.17, 0.42),
        Color(0.86, 0.58, 0.28, 0.16),
        30
    ))
    add_child(spotlight)

func _build_character_card() -> void:
    character_card = CharacterShowcaseCard.new()
    character_card.name = "Bw001ShowcaseCard"
    character_card.setup(STARTER_ID, starter)
    add_child(character_card)

func _build_actions() -> void:
    var match_button := _make_button("JUGAR PARTIDO", 20, Color("#fff4da"))
    match_button.pressed.connect(_open_match)
    add_child(match_button)
    match_button.name = "MatchButton"

    var talk_button := _make_button("HABLAR", 16, Color("#ffe6c0"))
    talk_button.pressed.connect(_next_comment)
    add_child(talk_button)
    talk_button.name = "TalkButton"

    var profile_button := _make_button("VER PERFIL", 14, Color("#dbe6ff"))
    profile_button.pressed.connect(_focus_profile)
    add_child(profile_button)
    profile_button.name = "ProfileButton"

    var status := _make_label("SINCRONIZADO  •  DATOS LOCALES", 10, Color("#7ecda8"))
    status.name = "StatusLabel"
    add_child(status)

func _build_dialogue_panel() -> void:
    var panel := Panel.new()
    panel.name = "StarterDialogue"
    panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
    panel.add_theme_stylebox_override("panel", _panel_style(Color(0.05, 0.08, 0.15, 0.93), "#435a85", 20))
    add_child(panel)

    var title := _make_label("AIKO", 12, Color("#e9bb6b"))
    title.position = Vector2(22, 14)
    title.size = Vector2(160, 20)
    panel.add_child(title)

    dialogue_label = _make_label(dialogue.get_line(0), 16, Color("#f4f6fb"))
    dialogue_label.position = Vector2(22, 39)
    dialogue_label.size = Vector2(540, 64)
    dialogue_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    panel.add_child(dialogue_label)

func _refresh_resources() -> void:
    energy_label.text = "ENERGÍA  %d / 100" % progress_store.get_player_energy()
    coins_label.text = "MONEDAS  %d" % progress_store.get_coins()

func _next_comment() -> void:
    if dialogue.count() == 0:
        return
    dialogue_index = posmod(dialogue_index + 1, dialogue.count())
    dialogue_label.text = dialogue.get_line(dialogue_index)
    character_card.focus_card()
    var tween := create_tween()
    tween.tween_property(dialogue_label, "modulate", Color(1, 1, 1, 0.45), 0.08)
    tween.tween_property(dialogue_label, "modulate", Color.WHITE, 0.18)

func _focus_profile() -> void:
    character_card.focus_card()
    dialogue_label.text = "Perfil inicial de Aiko Hanamori. Sus estadísticas siguen viviendo en PlayerData y su apariencia en el pipeline de avatar."

func _open_match() -> void:
    get_tree().change_scene_to_file(MATCH_SCENE)

func _make_label(text_value: String, font_size: int, color: Color) -> Label:
    var label := Label.new()
    label.text = text_value
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.45))
    label.add_theme_constant_override("shadow_offset_x", 1)
    label.add_theme_constant_override("shadow_offset_y", 2)
    return label

func _make_button(text_value: String, font_size: int, text_color: Color) -> Button:
    var button := Button.new()
    button.text = text_value
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", text_color)
    button.add_theme_color_override("font_hover_color", Color.WHITE)
    button.add_theme_stylebox_override("normal", _button_style("#263550", "#49658f", 16))
    button.add_theme_stylebox_override("hover", _button_style("#334765", "#e9bb6b", 16))
    button.add_theme_stylebox_override("pressed", _button_style("#1d2940", "#e4572e", 16))
    button.add_theme_stylebox_override("focus", _button_style("#334765", "#e9bb6b", 16))
    button.mouse_entered.connect(func():
        var t := create_tween()
        t.tween_property(button, "scale", Vector2(1.025, 1.025), 0.10)
    )
    button.mouse_exited.connect(func():
        var t := create_tween()
        t.tween_property(button, "scale", Vector2.ONE, 0.12)
    )
    return button

func _panel_style(background: Variant, border: Variant, radius: int) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = background if background is Color else Color(str(background))
    style.border_color = border if border is Color else Color(str(border))
    style.set_border_width_all(1)
    style.corner_radius_top_left = radius
    style.corner_radius_top_right = radius
    style.corner_radius_bottom_left = radius
    style.corner_radius_bottom_right = radius
    return style

func _button_style(background: String, border: String, radius: int) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = Color(background)
    style.border_color = Color(border)
    style.set_border_width_all(1)
    style.corner_radius_top_left = radius
    style.corner_radius_top_right = radius
    style.corner_radius_bottom_left = radius
    style.corner_radius_bottom_right = radius
    style.shadow_color = Color(0, 0, 0, 0.32)
    style.shadow_size = 7
    style.shadow_offset = Vector2(0, 3)
    return style

func _layout() -> void:
    var size := get_viewport_rect().size
    if character_card == null:
        return
    var card_x := maxf(590.0, size.x - CARD_SIZE.x - 42.0)
    var card_y := clampf((size.y - CARD_SIZE.y) * 0.5 + 28.0, 104.0, 142.0)
    character_card.position = Vector2(card_x, card_y)

    starter_avatar.position = Vector2(minf(size.x * 0.33, 470.0), size.y * 0.60)

    var spotlight := get_node_or_null("CharacterSpotlight") as Panel
    if spotlight != null:
        spotlight.position = Vector2(48, 112)
        spotlight.size = Vector2(minf(card_x - 88.0, 540.0), size.y - 154.0)

    var dialogue_panel := get_node_or_null("StarterDialogue") as Panel
    if dialogue_panel != null:
        dialogue_panel.position = Vector2(72, size.y - 164.0)
        dialogue_panel.size = Vector2(minf(card_x - 120.0, 620.0), 112.0)

    var match_button := get_node("MatchButton") as Button
    var talk_button := get_node("TalkButton") as Button
    var profile_button := get_node("ProfileButton") as Button
    var status := get_node("StatusLabel") as Label

    match_button.position = Vector2(76, size.y - 52.0)
    match_button.size = Vector2(240, 42)
    talk_button.position = Vector2(332, size.y - 52.0)
    talk_button.size = Vector2(126, 42)
    profile_button.position = Vector2(472, size.y - 52.0)
    profile_button.size = Vector2(126, 42)
    status.position = Vector2(76, size.y - 78.0)
    status.size = Vector2(420, 20)

func _play_hub_intro() -> void:
    modulate = Color(1, 1, 1, 0)
    var tween := create_tween()
    tween.tween_property(self, "modulate", Color.WHITE, 0.35)

func _draw() -> void:
    var size := get_viewport_rect().size
    for i in range(12):
        var t := float(i) / 11.0
        var c := Color(
            lerpf(0.035, 0.075, t),
            lerpf(0.055, 0.080, t),
            lerpf(0.12, 0.19, t),
            1.0
        )
        draw_rect(Rect2(0, i * size.y / 12.0, size.x, size.y / 12.0 + 2.0), c)

    for x in [110.0, 270.0, 430.0, 590.0, 820.0, 1000.0, 1170.0]:
        draw_circle(Vector2(x, 114), 7, Color("#f7dfab", 0.72))
        draw_circle(Vector2(x, 114), 15, Color("#f7dfab", 0.07))

    draw_arc(Vector2(size.x * 0.50, 660), minf(size.x, 980.0), PI, TAU, 64, Color("#f0c879", 0.18), 3.0)
    draw_arc(Vector2(size.x * 0.50, 660), minf(size.x, 760.0), PI, TAU, 64, Color("#5c77a7", 0.20), 2.0)

    var seam_center := Vector2(size.x * 0.17, size.y * 0.44)
    draw_arc(seam_center, 105, -1.2, 1.2, 36, Color("#f5ddae", 0.09), 4.0)
    draw_arc(seam_center + Vector2(18, 0), 105, 1.94, 4.34, 36, Color("#f5ddae", 0.09), 4.0)

    draw_colored_polygon(
        PackedVector2Array([
            Vector2(0, size.y * 0.76),
            Vector2(size.x * 0.34, size.y * 0.68),
            Vector2(size.x, size.y * 0.76),
            Vector2(size.x, size.y),
            Vector2(0, size.y)
        ]),
        Color("#101a28", 0.86)
    )
