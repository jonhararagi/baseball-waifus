class_name Player3DAvatarAdapter
extends RefCounted

static func create_from_player(player: PlayerData) -> Pixel3DBaseballCharacter:
    if player == null:
        return null
    var avatar := Pixel3DBaseballCharacter.new()
    avatar.setup(PlayerAvatarAdapter.from_player(player))
    return avatar
