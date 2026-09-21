extends Node

func _ready() -> void:
    _test_charm_cap_and_determinism()
    _test_ten_level_bonus()
    _test_daily_chat_limit()
    _test_gift_stock()
    _test_dialogue_catalog()
    print("CHARM RULES TEST OK")
    get_tree().quit()

func _player() -> PlayerData:
    var p := PlayerData.new()
    p.id = "charm_test"
    p.display_name = "Charm Test"
    p.specialization = "power"
    p.position = "3B"
    p.power = 60
    p.contact = 50
    p.speed = 50
    p.defense = 50
    CharmSystem.configure_player(p)
    return p

func _test_charm_cap_and_determinism() -> void:
    var p := _player()
    assert(p.charm_primary_stat == "power")
    assert(p.charm_bonus_stats == ["defense", "contact", "speed"])
    assert(CharmSystem.grant_charm(p, 150) == 100)
    assert(p.charm == 100)
    assert(CharmSystem.stat_after_charm(p, "power") == 100)
    assert(CharmSystem.stat_after_charm(p, "defense") == 60)

func _test_ten_level_bonus() -> void:
    var p := _player()
    CharmSystem.grant_charm(p, 19)
    var before := CharmSystem.stat_bonus(p, "defense")
    CharmSystem.grant_charm(p, 1)
    assert(before == 1)
    assert(CharmSystem.stat_bonus(p, "defense") == 2)

func _test_daily_chat_limit() -> void:
    var store := CharmStateStore.new()
    store.state = {"day": Time.get_date_string_from_system(), "chats_used": 0, "chatted_characters": [], "gift_materials": {"chocolate": 20}}
    assert(store.can_chat("bw001"))
    assert(store.register_chat("bw001", 20))
    assert(not store.can_chat("bw001"))
    assert(store.can_chat("bw002"))
    assert(store.register_chat("bw002", 3))
    assert(store.register_chat("bw003", 20))
    assert(not store.can_chat("bw004"))

func _test_gift_stock() -> void:
    var store := CharmStateStore.new()
    store.state = {"day": Time.get_date_string_from_system(), "chats_used": 0, "chatted_characters": [], "gift_materials": {"chocolate": 1}}
    var p := _player()
    var result := store.give_gift(p, "chocolate")
    assert(bool(result.get("ok", false)))
    assert(p.charm == 2)
    assert(store.material_count("chocolate") == 0)
    assert(not store.give_gift(p, "chocolate").get("ok", false))

func _test_dialogue_catalog() -> void:
    var rows := CharmDialogueCatalog.conversations("bw001")
    assert(rows.size() == 10)
    for row in rows:
        assert(row.responses.size() == 3)
        var correct := 0
        for response in row.responses:
            if bool(response.correct):
                correct += 1
        assert(correct == 1)
