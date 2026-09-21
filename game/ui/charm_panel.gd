class_name CharmPanel
extends PanelContainer

var store: CharmStateStore
var player: PlayerData
var character_index := 0
var characters: Array = []
var title_label: Label
var charm_label: Label
var status_label: Label
var question_label: Label
var response_buttons: Array[Button] = []
var gift_buttons: Array[Button] = []
var prev_button: Button
var next_button: Button

func setup(charm_store: CharmStateStore) -> void:
    store = charm_store
    characters = CharacterArchetypeCatalog.all()
    _build_ui()
    _select_character(0)
    visible = false
    z_index = 200

func _build_ui() -> void:
    custom_minimum_size = Vector2(500, 520)
    position = Vector2(36, 150)
    var margin := MarginContainer.new()
    margin.add_theme_constant_override("margin_left", 18)
    margin.add_theme_constant_override("margin_right", 18)
    margin.add_theme_constant_override("margin_top", 16)
    margin.add_theme_constant_override("margin_bottom", 16)
    add_child(margin)
    var box := VBoxContainer.new()
    box.add_theme_constant_override("separation", 9)
    margin.add_child(box)

    title_label = Label.new()
    title_label.add_theme_font_size_override("font_size", 22)
    box.add_child(title_label)
    charm_label = Label.new()
    box.add_child(charm_label)

    var nav := HBoxContainer.new()
    prev_button = Button.new()
    prev_button.text = "◀"
    prev_button.pressed.connect(_previous_character)
    nav.add_child(prev_button)
    next_button = Button.new()
    next_button.text = "▶"
    next_button.pressed.connect(_next_character)
    nav.add_child(next_button)
    box.add_child(nav)

    question_label = Label.new()
    question_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    question_label.custom_minimum_size = Vector2(0, 70)
    box.add_child(question_label)

    for i in range(3):
        var button := Button.new()
        button.custom_minimum_size = Vector2(0, 42)
        button.pressed.connect(_answer.bind(i))
        response_buttons.append(button)
        box.add_child(button)

    var separator := HSeparator.new()
    box.add_child(separator)
    var gift_title := Label.new()
    gift_title.text = "REGALOS"
    box.add_child(gift_title)

    for item_id in CharmSystem.GIFT_VALUES.keys():
        var button := Button.new()
        button.text = str(item_id).replace("_", " ").capitalize()
        button.pressed.connect(_gift.bind(str(item_id)))
        gift_buttons.append(button)
        box.add_child(button)

    status_label = Label.new()
    status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    box.add_child(status_label)

func _select_character(index: int) -> void:
    if characters.is_empty():
        return
    character_index = posmod(index, characters.size())
    var id := str(characters[character_index].get("id", ""))
    player = CharacterArchetypeCatalog.create_player(id)
    store.load_player(player)
    _refresh()

func _previous_character() -> void:
    _select_character(character_index - 1)

func _next_character() -> void:
    _select_character(character_index + 1)

func _refresh() -> void:
    if player == null:
        return
    title_label.text = "AMOR / ENCANTO  •  %s" % player.display_name
    charm_label.text = "ENCANTO %d / %d  •  +%s principal" % [player.charm, CharmSystem.MAX_CHARM, player.charm_primary_stat.to_upper()]
    var talks := CharmDialogueCatalog.conversations(player.id)
    var index := store.dialogue_index(player.id)
    if talks.is_empty() or store.dialogue_completed(player.id):
        question_label.text = "Las 10 charlas de esta personaje ya fueron completadas."
        for b in response_buttons:
            b.disabled = true
            b.text = "COMPLETADO"
    elif not store.can_chat(player.id):
        question_label.text = "Límite diario alcanzado: vuelve mañana."
        for b in response_buttons:
            b.disabled = true
            b.text = "3/3 CHARLAS"
    else:
        var talk: Dictionary = talks[index]
        question_label.text = "Charla %d/10\n%s" % [index + 1, str(talk.prompt)]
        for i in range(3):
            var response: Dictionary = talk.responses[i]
            response_buttons[i].disabled = false
            response_buttons[i].text = str(response.text)
    for b in gift_buttons:
        var item_id := _gift_id_for_button(b)
        b.disabled = store.material_count(item_id) <= 0 or player.charm >= CharmSystem.MAX_CHARM
        b.text = "%s  [%d]" % [item_id.replace("_", " ").capitalize(), store.material_count(item_id)]
    status_label.text = "Charlas hoy: %d/%d" % [int(store.state.get("chats_used", 0)), CharmSystem.DAILY_CHAT_LIMIT]

func _gift_id_for_button(button: Button) -> String:
    var raw := button.text
    for item_id in CharmSystem.GIFT_VALUES.keys():
        if raw.to_lower().begins_with(str(item_id).replace("_", " ")):
            return str(item_id)
    return "chocolate"

func _gift(item_id: String) -> void:
    var result := store.give_gift(player, item_id)
    status_label.text = "Regalo: +%d Encanto" % int(result.get("charm_gained", 0)) if bool(result.get("ok", false)) else "Regalo no disponible."
    _refresh()

func _answer(index: int) -> void:
    var talks := CharmDialogueCatalog.conversations(player.id)
    var talk_index := store.dialogue_index(player.id)
    if talk_index >= talks.size() or not store.can_chat(player.id):
        _refresh()
        return
    var response: Dictionary = talks[talk_index].responses[index]
    var delta := int(response.get("charm_delta", 3))
    CharmSystem.grant_charm(player, delta)
    store.save_player(player)
    if store.register_chat(player.id):
        status_label.text = "Respuesta %s: +%d Encanto" % ["correcta" if bool(response.correct) else "incorrecta", delta]
    _refresh()

func toggle() -> void:
    visible = not visible
    if visible:
        _select_character(character_index)
