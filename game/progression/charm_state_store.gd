class_name CharmStateStore
extends RefCounted

const SAVE_PATH := "user://baseball_waifus/charm_state.json"

var state: Dictionary = {
    "day": "",
    "chats_used": 0,
    "chatted_characters": [],
    "dialogue_progress": {},
    "player_charm": {},
    "gift_materials": {
        "chocolate": 20,
        "favorite_snack": 10,
        "bouquet": 5,
        "keepsake": 3,
        "special_gift": 1
    }
}

func load_state() -> void:
    if not FileAccess.file_exists(SAVE_PATH):
        save_state()
        return
    var parsed = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
    if parsed is Dictionary:
        for key in parsed.keys():
            state[key] = parsed[key]
    _roll_day_if_needed()

func save_state() -> void:
    DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("user://baseball_waifus"))
    var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file:
        file.store_string(JSON.stringify(state, "\t"))

func _roll_day_if_needed() -> void:
    var today := Time.get_date_string_from_system()
    if str(state.get("day", "")) == today:
        return
    state["day"] = today
    state["chats_used"] = 0
    state["chatted_characters"] = []
    save_state()

func can_chat(character_id: String) -> bool:
    _roll_day_if_needed()
    return int(state.get("chats_used", 0)) < CharmSystem.DAILY_CHAT_LIMIT and character_id not in state.get("chatted_characters", [])

func register_chat(character_id: String) -> bool:
    if not can_chat(character_id):
        return false
    state["chats_used"] = int(state.get("chats_used", 0)) + 1
    var chars: Array = state.get("chatted_characters", [])
    chars.append(character_id)
    state["chatted_characters"] = chars
    var progress: Dictionary = state.get("dialogue_progress", {})
    progress[character_id] = mini(10, int(progress.get(character_id, 0)) + 1)
    state["dialogue_progress"] = progress
    save_state()
    return true

func dialogue_index(character_id: String) -> int:
    return clampi(int(state.get("dialogue_progress", {}).get(character_id, 0)), 0, 9)

func dialogue_completed(character_id: String) -> bool:
    return int(state.get("dialogue_progress", {}).get(character_id, 0)) >= 10

func material_count(item_id: String) -> int:
    return int(state.get("gift_materials", {}).get(item_id, 0))

func load_player(player: PlayerData) -> void:
    if player == null:
        return
    CharmSystem.configure_player(player)
    player.charm = CharmSystem.clamp_charm(int(state.get("player_charm", {}).get(player.id, 0)))

func save_player(player: PlayerData) -> void:
    if player == null:
        return
    var charms: Dictionary = state.get("player_charm", {})
    charms[player.id] = CharmSystem.clamp_charm(player.charm)
    state["player_charm"] = charms
    save_state()

func give_gift(player: PlayerData, item_id: String) -> Dictionary:
    var amount := CharmSystem.gift_amount(item_id)
    if player == null or amount <= 0:
        return {"ok": false, "reason": "invalid_gift"}
    load_player(player)
    if player.charm >= CharmSystem.MAX_CHARM:
        return {"ok": false, "reason": "charm_max"}
    var inventory: Dictionary = state.get("gift_materials", {})
    var stock := int(inventory.get(item_id, 0))
    if stock <= 0:
        return {"ok": false, "reason": "material_exhausted"}
    inventory[item_id] = stock - 1
    state["gift_materials"] = inventory
    var gained := CharmSystem.grant_charm(player, amount)
    save_player(player)
    return {"ok": gained > 0, "item_id": item_id, "charm_gained": gained, "remaining": inventory[item_id]}
