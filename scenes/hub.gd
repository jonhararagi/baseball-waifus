class_name BaseballWaifusHub
extends Control

const STARTER_ID := "bw001"
const MATCH_SCENE := "res://scenes/main.tscn"
const COMMENT_LIMIT := 10

const COMMENTS := [
	"¡Bienvenida a Baseball Waifus! Soy Aiko. Hoy empezamos con una entrada limpia.",
	"El béisbol no se gana mirando la rareza de una carta. Hay que leer la jugada.",
	"Si mejoras mi Contacto, tendrás más margen para aprovechar un buen timing.",
	"Power ayuda, pero un swing horrible sigue siendo un swing horrible. ¡No me culpes!",
	"Historia guarda los partidos y lugares que vamos descubriendo. Los candados significan progreso real.",
	"Entrenar tarda tiempo, pero no necesitas quedarte mirando la pantalla. El equipo trabaja mientras haces otras cosas.",
	"El equipamiento puede mejorar nuestras estadísticas sin cambiar quién soy como jugadora.",
	"Cuando tengas más personajes, prueba combinaciones. Una buena alineación puede cambiar cómo se juega una entrada.",
	"Si una jugada sale mal, mira el contexto antes de culpar al azar. El partido guarda sus propias reglas.",
	"¡Ahora ve a Historia y juega una entrada! Yo me encargo de calentar el bate."
]

var progress_store: PlayerProgressStore
var roster_store: CharacterRosterStore
var starter: PlayerData
var comment_index := 0
var current_mode := "normal"

var content: Control
var overlay: ColorRect
var panel_host: PanelContainer
var panel_title: Label
var panel_body: Label
var panel_actions: HBoxContainer
var campaign_map: BaseballCampaignMapView
var energy_label: Label
var coin_label: Label
var level_label: Label
var panel_tween: Tween
var starter_card: BaseballCharacterCard

const HubMenuButtonClass = preload("res://game/ui/hub_menu_button.gd")
const MENU_ICON_IDS := ["history", "team", "training", "equipment", "gacha", "inventory", "story", "events", "options"]

func _ready() -> void:
	progress_store = PlayerProgressStore.new()
	progress_store.load_state()
	roster_store = CharacterRosterStore.new()
	roster_store.load_state()
	starter = CharacterArchetypeCatalog.create_player(STARTER_ID)
	var ensured := roster_store.ensure_character(starter)
	if ensured.get("ok", false):
		starter = roster_store.get_player(STARTER_ID)
	_build_ui()
	_refresh_account()
	queue_redraw()

func _build_ui() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content = Control.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(content)

	var background := TextureRect.new()
	background.texture = load("res://assets/ui/hub_background.svg")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(background)
	content.move_child(background, 0)

	var vignette := ColorRect.new()
	vignette.color = Color(0.04, 0.06, 0.14, 0.30)
	vignette.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(vignette)

	var top := ColorRect.new()
	top.color = Color(0.055, 0.075, 0.16, 0.94)
	top.position = Vector2(0, 0)
	top.size = Vector2(1280, 86)
	content.add_child(top)

	var logo := Label.new()
	logo.text = "BASEBALL WAIFUS"
	logo.position = Vector2(34, 16)
	logo.add_theme_font_size_override("font_size", 28)
	logo.add_theme_color_override("font_color", Color("#ffd76a"))
	content.add_child(logo)

	var subtitle := Label.new()
	subtitle.text = "ANIME BASEBALL • COLLECTION • TEAM BUILDING"
	subtitle.position = Vector2(36, 50)
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color("#9bb7e8"))
	content.add_child(subtitle)

	level_label = _label("PLAYER • Aiko Hanamori", 16, Color("#f8f9ff"))
	level_label.position = Vector2(760, 22)
	content.add_child(level_label)
	energy_label = _label("ENERGY 100 / 100", 16, Color("#ffdf76"))
	energy_label.position = Vector2(900, 22)
	content.add_child(energy_label)
	coin_label = _label("COINS 0", 16, Color("#a9e7ff"))
	coin_label.position = Vector2(1070, 22)
	content.add_child(coin_label)

	starter_card = BaseballCharacterCard.new()
	starter_card.position = Vector2(40, 116)
	starter_card.size = Vector2(430, 500)
	content.add_child(starter_card)
	starter_card.setup(starter)
	starter_card.set_comment(COMMENTS[0])
	starter_card.set_expression(CharacterExpressionController.expression_for_comment(comment_index))

	var comment_button := _button("SIGUIENTE COMENTARIO", 390, 42)
	comment_button.position = Vector2(60, 628)
	comment_button.pressed.connect(_next_comment)
	content.add_child(comment_button)

	var section_title := _label("CENTRAL", 14, Color("#9bb7e8"))
	section_title.position = Vector2(500, 105)
	content.add_child(section_title)

	var menu := GridContainer.new()
	menu.columns = 3
	menu.position = Vector2(500, 116)
	menu.size = Vector2(740, 330)
	menu.add_theme_constant_override("h_separation", 12)
	menu.add_theme_constant_override("v_separation", 12)
	content.add_child(menu)

	_add_menu_button(menu, "Historia", "Mapa de campaña", "history", _open_history)
	_add_menu_button(menu, "Equipo", "Roster y posiciones", "team", _open_roster)
	_add_menu_button(menu, "Entrenar", "Mejora de personajes", "training", _open_training)
	_add_menu_button(menu, "Equipamiento", "Objetos y estadísticas", "equipment", _open_equipment)
	_add_menu_button(menu, "Gacha", "Colección", "gacha", _open_gacha)
	_add_menu_button(menu, "Inventario", "Materiales y monedas", "inventory", _open_inventory)
	_add_menu_button(menu, "Crónicas", "Escenas y personajes", "story", _open_story)
	_add_menu_button(menu, "Eventos", "Contenido temporal", "events", _open_events)
	_add_menu_button(menu, "Opciones", "Configuración", "options", _open_options)

	var play := _button("CONTINUAR / JUGAR", 740, 68)
	play.position = Vector2(500, 470)
	play.add_theme_font_size_override("font_size", 21)
	play.pressed.connect(_open_history)
	content.add_child(play)

	var hint := _label("Elige una sección. Los paneles se abren aquí sin abandonar el hub.", 14, Color("#9bb7e8"))
	hint.position = Vector2(500, 552)
	content.add_child(hint)

	overlay = ColorRect.new()
	overlay.color = Color(0.02, 0.03, 0.08, 0.72)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.visible = false
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	panel_host = PanelContainer.new()
	panel_host.position = Vector2(120, 70)
	panel_host.size = Vector2(1040, 590)
	panel_host.add_theme_stylebox_override("panel", _panel_style("#11182c", "#ffd76a", 2, 22))
	panel_host.visible = false
	add_child(panel_host)

	var panel_box := VBoxContainer.new()
	panel_box.add_theme_constant_override("separation", 12)
	panel_host.add_child(panel_box)
	panel_title = _label("PANEL", 28, Color("#ffd76a"))
	panel_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel_box.add_child(panel_title)
	panel_body = _label("", 15, Color("#e7edf9"))
	panel_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel_box.add_child(panel_body)
	campaign_map = BaseballCampaignMapView.new()
	campaign_map.visible = false
	campaign_map.map_selected.connect(_on_map_selected)
	panel_box.add_child(campaign_map)
	panel_actions = HBoxContainer.new()
	panel_actions.alignment = BoxContainer.ALIGNMENT_CENTER
	panel_box.add_child(panel_actions)
	var close := _button("CERRAR", 180, 48)
	close.pressed.connect(_close_panel)
	panel_actions.add_child(close)

func _add_menu_button(parent: GridContainer, title: String, sub: String, icon_id: String, action: Callable) -> void:
	var menu_button := HubMenuButtonClass.new()
	menu_button.setup(title, sub, icon_id)
	menu_button.custom_minimum_size = Vector2(232, 98)
	menu_button.pressed.connect(action)
	parent.add_child(menu_button)

func _button(text_value: String, width: float, height: float) -> Button:
	var b := Button.new()
	b.text = text_value
	b.custom_minimum_size = Vector2(width, height)
	b.focus_mode = Control.FOCUS_ALL
	b.add_theme_stylebox_override("normal", _panel_style("#202b49", "#536a9a", 1, 14))
	b.add_theme_stylebox_override("hover", _panel_style("#2d3a61", "#ffd76a", 2, 14))
	b.add_theme_stylebox_override("pressed", _panel_style("#17213a", "#f06d91", 2, 14))
	b.add_theme_color_override("font_color", Color("#eef4ff"))
	b.mouse_entered.connect(func(): _button_hover(b, true))
	b.mouse_exited.connect(func(): _button_hover(b, false))
	return b

func _button_hover(button: Button, hovered: bool) -> void:
	var target := Vector2(1.025, 1.025) if hovered else Vector2.ONE
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(button, "scale", target, 0.12)

func _label(text_value: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text_value
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l

func _panel_style(fill: String, border: String, width: int, radius: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(fill)
	s.border_color = Color(border)
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	return s

func _refresh_account() -> void:
	energy_label.text = "⚡ %d / 100" % progress_store.get_player_energy()
	coin_label.text = "◈ %d" % progress_store.get_coins()
	if starter != null:
		level_label.text = "PLAYER • %s" % starter.display_name

func _next_comment() -> void:
	comment_index = (comment_index + 1) % COMMENT_LIMIT
	if starter_card != null:
		starter_card.set_comment(COMMENTS[comment_index])
		starter_card.set_expression(CharacterExpressionController.expression_for_comment(comment_index))

func _open_history() -> void:
	_show_panel("HISTORIA", _history_text(), true)

func _history_text() -> String:
	return "ZONA 01 • PRIMERA TEMPORADA

Normal, Hard y Hell comparten el mismo mapa. La dificultad cambia el contexto de enemigos y recompensas, sin duplicar el escenario.

" + _mode_line() + "

" + "● Mapa 01  •  Campo de entrenamiento
● Mapa 02  •  Camino del río
● Mapa 03  •  Estadio viejo
○ Mapa 04  •  BLOQUEADO
○ Mapa 05  •  BLOQUEADO
○ Mapa 06  •  BLOQUEADO
○ Mapa 07  •  BLOQUEADO
○ Mapa 08  •  BLOQUEADO
○ Mapa 09  •  BLOQUEADO
○ Mapa 10  •  BLOQUEADO

★ DEMON KING  •  BLOQUEADO

Selecciona una ubicación disponible para comenzar un partido."

func _mode_line() -> String:
	return "DIFICULTAD: %s    |    ENERGÍA: %d    |    INTENTOS DEL MAPA: 10" % [current_mode.to_upper(), progress_store.get_player_energy()]

func _open_roster() -> void:
	var ids := roster_store.list_character_ids()
	_show_panel("EQUIPO", "Personajes obtenidos: %d

%s

La colección utiliza CharacterRosterStore como autoridad persistente." % [ids.size(), _roster_lines(ids)], false)

func _roster_lines(ids: Array[String]) -> String:
	var lines: Array[String] = []
	for id in ids.slice(0, 8):
		var p := roster_store.get_player(id)
		if p != null:
			lines.append("• %s  |  %s  | Lv.%d  | %s" % [p.display_name, p.rarity, p.level, p.position])
	return "
".join(lines) if not lines.is_empty() else "Todavía no hay personajes registrados."

func _open_training() -> void:
	_show_panel("ENTRENAMIENTO", "Los entrenamientos existentes utilizan TrainingQueueStore y TrainingService.

30m  •  +1 principal
2h   •  +2 principal / +1 secundaria
6h   •  +4 / +2
12h  •  +7 / +3
24h  •  +12 / +5

Esta pantalla es el punto de entrada visual. La cola persistente sigue siendo la autoridad.", false)

func _open_equipment() -> void:
	_show_panel("EQUIPAMIENTO", "Ranuras: Guantes • Bates • Gorras • Chalecos • Faldas • Zapatos

EquipmentService controla equipar/desequipar. Los modificadores se aplican mediante EquipmentStatAdapter, nunca desde la UI.

La apariencia del objeto queda separada de sus estadísticas.", false)

func _open_gacha() -> void:
	_show_panel("GACHA", "La puerta de colección ya está reservada, pero las tasas definitivas, pity y garantías siguen pendientes de cierre.

No se muestran probabilidades inventadas. Cuando el sistema quede definido, esta pantalla leerá sus tablas explícitas.", false)

func _open_inventory() -> void:
	var inv := progress_store.get_account_inventory_snapshot()
	_show_panel("INVENTARIO", "MONEDAS: %d

MATERIALES: %d tipos
EQUIPAMIENTO: %d tipos

La recompensa y la persistencia pasan por las autoridades existentes." % [int(inv.get("coins", 0)), inv.get("materials", {}).size(), inv.get("equipment_inventory", {}).size()], false)

func _open_story() -> void:
	_show_panel("ARCHIVO DE HISTORIA", "Aquí vivirán las escenas, perfiles y recuerdos desbloqueados. Las R tendrán identidad propia; SR/SSR/UR reciben mayor profundidad narrativa.

Contenido narrativo: EN DESARROLLO.", false)

func _open_events() -> void:
	_show_panel("EVENTOS", "Panel reservado para contenido temporal. No se crean recompensas, tasas ni calendarios ficticios desde la UI.

ESTADO: preparado para conectar contenido.", false)

func _open_options() -> void:
	_show_panel("OPCIONES", "Audio, vibración, idioma, accesibilidad y preferencias de presentación se conectarán aquí.

El menú no tendrá autoridad sobre estadísticas, probabilidades ni resultados de béisbol.", false)

func _show_panel(title: String, body: String, history: bool) -> void:
	panel_title.text = title
	panel_body.text = body
	campaign_map.visible = history
	panel_body.visible = not history
	for child in panel_actions.get_children():
		if child != null and child.text != "CERRAR":
			child.queue_free()
	if history:
		campaign_map.set_mode(current_mode)
		var normal := _button("NORMAL", 150, 44)
		normal.pressed.connect(_set_mode.bind("normal"))
		panel_actions.add_child(normal)
		var hard := _button("HARD", 150, 44)
		hard.pressed.connect(_set_mode.bind("hard"))
		panel_actions.add_child(hard)
		var hell := _button("HELL", 150, 44)
		hell.pressed.connect(_set_mode.bind("hell"))
		panel_actions.add_child(hell)
		var play := _button("JUGAR MAPA 01", 190, 44)
		play.pressed.connect(_play_match)
		panel_actions.add_child(play)
	overlay.visible = true
	panel_host.visible = true
	panel_host.modulate = Color(1, 1, 1, 0)
	panel_host.scale = Vector2(0.96, 0.96)
	if panel_tween != null and panel_tween.is_valid():
		panel_tween.kill()
	panel_tween = create_tween()
	panel_tween.set_parallel(true)
	panel_tween.tween_property(panel_host, "modulate", Color.WHITE, 0.18)
	panel_tween.tween_property(panel_host, "scale", Vector2.ONE, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _set_mode(mode: String) -> void:
	current_mode = mode
	campaign_map.set_mode(current_mode)
	panel_body.text = _history_text()

func _on_map_selected(activity_id: String) -> void:
	if activity_id == "zone_01_map_01":
		_play_match()

func _play_match() -> void:
	get_tree().change_scene_to_file(MATCH_SCENE)

func _close_panel() -> void:
	if panel_tween != null and panel_tween.is_valid():
		panel_tween.kill()
	panel_tween = create_tween()
	panel_tween.tween_property(panel_host, "modulate", Color(1, 1, 1, 0), 0.12)
	panel_tween.tween_callback(func():
		panel_host.visible = false
		overlay.visible = false
	)

func _draw_starter_portrait(view: Control) -> void:
	var size := view.size
	var center := Vector2(size.x * 0.5, size.y * 0.52)
	var visual := CharacterArchetypeCatalog.find(STARTER_ID).get("visual", {})
	var skin := Color(str(visual.get("skin", "#d99a78")))
	var hair := Color(str(visual.get("hair_color", "#5a3327")))
	var uniform := Color(str(visual.get("uniform_color", "#fff3dc")))
	var accent := Color(str(visual.get("accent", "#e4572e")))
	view.draw_circle(center + Vector2(0, -54), 64, Color("#0c1222"))
	view.draw_circle(center + Vector2(0, -48), 48, skin)
	view.draw_circle(center + Vector2(-39, -56), 25, hair)
	view.draw_circle(center + Vector2(39, -56), 25, hair)
	view.draw_circle(center + Vector2(0, 58), 84, uniform)
	view.draw_rect(Rect2(center + Vector2(-75, 55), Vector2(150, 112)), uniform)
	view.draw_line(center + Vector2(-66, 72), center + Vector2(66, 72), accent, 8)
	view.draw_circle(center + Vector2(-17, -48), 5, Color("#4a2b24"))
	view.draw_circle(center + Vector2(17, -48), 5, Color("#4a2b24"))
	view.draw_line(center + Vector2(-14, -24), center + Vector2(14, -24), Color("#6b3f36"), 3)
	view.draw_line(center + Vector2(74, 38), center + Vector2(130, -28), Color("#f0c98e"), 7)
	view.draw_line(center + Vector2(130, -28), center + Vector2(145, -45), Color("#f0c98e"), 5)
