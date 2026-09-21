class_name CharmSystem
extends RefCounted

const MAX_CHARM := 100
const DAILY_CHAT_LIMIT := 3
const CORRECT_CHAT_REWARD := 20
const WRONG_CHAT_REWARD := 3
const STAT_CAP := 100

const PRIMARY_BY_SPECIALIZATION := {
    "power": "power",
    "contact": "contact",
    "runner": "speed",
    "pitcher": "pitch",
    "catcher": "defense",
    "defender": "defense"
}

const BONUS_BY_POSITION := {
    "P": ["control", "stamina", "defense"],
    "C": ["control", "stamina", "contact"],
    "1B": ["power", "defense", "stamina"],
    "2B": ["contact", "speed", "defense"],
    "3B": ["power", "defense", "contact"],
    "SS": ["speed", "defense", "contact"],
    "LF": ["speed", "defense", "critical"],
    "CF": ["speed", "defense", "contact"],
    "RF": ["power", "speed", "defense"],
    "DH": ["power", "contact", "critical"]
}

static func configure_player(player: PlayerData) -> void:
    if player == null:
        return
    player.charm_primary_stat = primary_stat_for(player.specialization)
    player.charm_bonus_stats = bonus_stats_for(player.position, player.charm_primary_stat)

static func primary_stat_for(specialization: String) -> String:
    return str(PRIMARY_BY_SPECIALIZATION.get(specialization, "contact"))

static func bonus_stats_for(position: String, primary: String) -> Array:
    var result: Array = []
    for stat in BONUS_BY_POSITION.get(position, ["contact", "speed", "defense"]):
        if str(stat) != primary and not result.has(stat):
            result.append(stat)
    for stat in ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"]:
        if result.size() >= 3:
            break
        if stat != primary and not result.has(stat):
            result.append(stat)
    return result

static func clamp_charm(value: int) -> int:
    return clampi(value, 0, MAX_CHARM)

static func stat_bonus(player: PlayerData, stat: String) -> int:
    if player == null:
        return 0
    var charm := clamp_charm(player.charm)
    var bonus := charm if stat == player.charm_primary_stat else 0
    if stat in player.charm_bonus_stats:
        bonus += charm / 10
    return bonus

static func stat_after_charm(player: PlayerData, stat: String) -> int:
    if player == null:
        return 0
    return mini(STAT_CAP, int(player.get(stat)) + stat_bonus(player, stat))

static func grant_charm(player: PlayerData, amount: int) -> int:
    if player == null or amount <= 0:
        return 0
    configure_player(player)
    var before := player.charm
    player.charm = clamp_charm(player.charm + amount)
    return player.charm - before

static func gift_amount(item_id: String) -> int:
    return int(GIFT_VALUES.get(item_id, 0))

static func can_gift(item_id: String) -> bool:
    return gift_amount(item_id) > 0

const GIFT_VALUES := {
    "chocolate": 2,
    "favorite_snack": 4,
    "bouquet": 7,
    "keepsake": 10,
    "special_gift": 15
}
