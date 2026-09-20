class_name AvatarRosterService
extends RefCounted

var store := AvatarProfileStore.new()

func profile_for_player(player: PlayerData) -> AvatarProfile:
	if player == null:
		return null

	var existing := store.load_player_profile(player.id)
	if existing != null:
		existing.display_name = player.display_name if not player.display_name.is_empty() else existing.display_name
		return existing

	var created := PlayerAvatarAdapter.from_player(player)
	store.save_player_profile(player.id, created)
	return created

func save_player_profile(player_id: String, profile: AvatarProfile) -> bool:
	return store.save_player_profile(player_id, profile)

func delete_player_profile(player_id: String) -> bool:
	return store.delete_player_profile(player_id)

func list_player_profiles() -> Array[String]:
	return store.list_player_profiles()
