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
	"¡Ahora ve a Historia y juega una entrada! Yo me encargo de calentar el bate. ⚾"
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
var comment_label: Label
var energy_label: Label
var coin_label: Label
var level_label: Label

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

	var top := ColorRect.new()
	top.color = Color("#10162a")
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
	energy_label = _label("⚡ 100 / 100", 16, Color("#ffdf76"))
	energy_label.position = Vector2(900, 22)
	content.add_child(energy_label)
	coin_label = _label("◈ 0", 16, Color("#a9e7ff"))
	coin_label.position = Vector2(1070, 22)
	content.add_child(coin_label)

	var character_card := PanelContainer.new()
	character_card.position = Vector2(40, 116)
	character_card.size = Vector2(430, 500)
	character_card.add_theme_stylebox_override("panel", _panel_style("#171f38", "#f06d91", 3, 18))
	content.add_child(character_card)

	var char_box := VBoxContainer.new()
	char_box.add_theme_constant_override("separation", 7)
	character_card.add_child(char_box)

	var portrait := Control.new()
	portrait.custom_minimum_size = Vector2(400, 285)
	portrait.draw.connect(_draw_starter_portrait.bind(portrait))
	char_box.add_child(portrait)

	var character_name := _label(starter.display_name, 25, Color("#fff5e5"))
	character_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	char_box.add_child(character_name)
	var character_meta := _label("%s • %s • %s • %s" % [starter.rarity, starter.position, starter.element.to_upper(), starter.specialization.to_upper()], 13, Color("#ff9c78"))
	character_meta.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	char_box.add_child(character_meta)

	comment_label = _label(COMMENTS[0], 15, Color("#e8efff"))
	comment_label.custom_minimum_size = Vector2(390, 74)
	comment_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	comment_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	char_box.add_child(comment_label)

	var comment_button := _button("💬 SIGUIENTE COMENTARIO", 390, 42)
	comment_button.pressed.connect(_next_comment)
	char_box.add_child(comment_button)

	var stats := _label("POWER %d   CONTACT %d   SPEED %d   DEF %d" % [starter.power, starter.contact, starter.speed, starter.defense], 12, Color("#aab9d8"))
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	char_box.add_child(stats)

	var menu := GridContainer.new()
	menu.columns = 3
	menu.position = Vector2(500, 116)
	menu.size = Vector2(740, 330)
	menu.add_theme_constant_override("h_separation", 12)
	menu.add_theme_constant_override("v_separation", 12)
	content.add_child(menu)

	_add_menu_button(menu, "⚾ HISTORIA", "Mapa de campaña", _open_history)
	_add_menu_button(menu, "👥 EQUIPO", "Roster y posiciones", _open_roster)
	_add_menu_button(menu, "🏋 ENTRENAR", "Mejora de personajes", _open_training)
	_add_menu_button(menu, "🎒 EQUIPAMIENTO", "Objetos y estadísticas", _open_equipment)
	_add_menu_button(menu, "🎲 GACHA", "Colección", _open_gacha)
	_add_menu_button(menu, "🎁 INVENTARIO", "Materiales y monedas", _open_inventory)
	_add_menu_button(menu, "📖 HISTORIA", "Escenas y personajes", _open_story)
	_add_menu_button(menu, "✨ EVENTOS", "Contenido temporal", _open_events)
	_add_menu_button(menu, "⚙ OPCIONES", "Configuración", _open_options)

	var play := _button("⚾  CONTINUAR / JUGAR", 740, 68)
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
	panel_actions = HBoxContainer.new()
	panel_actions.alignment = BoxContainer.ALIGNMENT_CENTER
	panel_box.add_child(panel_actions)
	var close := _button("CERRAR", 180, 48)
	close.pressed.connect(_close_panel)
	panel_actions.add_child(close)

func _add_menu_button(parent: GridContainer, title: String, sub: String, action: Callable) -> void:
	var button := _button(title + "
" + sub, 232, 98)
	button.add_theme_font_size_override("font_size", 17)
	button.pressed.connect(action)
	parent.add_child(button)

func _button(text_value: String, width: float, height: float) -> Button:
	var b := Button.new()
	b.text = text_value
	b.custom_minimum_size = Vector2(width, height)
	b.focus_mode = Control.FOCUS_ALL
	b.add_theme_stylebox_override("normal", _panel_style("#202b49", "#536a9a", 1, 14))
	b.add_theme_stylebox_override("hover", _panel_style("#2d3a61", "#ffd76a", 2, 14))
	b.add_theme_stylebox_override("pressed", _panel_style("#17213a", "#f06d91", 2, 14))
	b.add_theme_color_override("font_color", Color("#eef4ff"))
	return b

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
	comment_label.text = COMMENTS[comment_index]

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
	for child in panel_actions.get_children():
		if child != null and child.text != "CERRAR":
			child.queue_free()
	if history:
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

func _set_mode(mode: String) -> void:
	current_mode = mode
	panel_body.text = _history_text()

func _play_match() -> void:
	get_tree().change_scene_to_file(MATCH_SCENE)

func _close_panel() -> void:
	panel_host.visible = false
	overlay.visible = false

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
