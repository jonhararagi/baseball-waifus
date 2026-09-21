extends Node2D

const COLUMNS := 5
const ROWS := 6
const CELL := Vector2(250, 155)
const POSE_INTERVAL := 0.72

var avatars: Array[AnimeAvatar2D] = []
var pose_index := 0
var elapsed := 0.0

func _ready() -> void:
	_build_roster_preview()
	queue_redraw()

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed >= POSE_INTERVAL:
		elapsed = 0.0
		pose_index = (pose_index + 1) % 6
		_apply_pose_cycle()
	queue_redraw()

func _build_roster_preview() -> void:
	for child in get_children():
		if child is AnimeAvatar2D:
			child.queue_free()
	avatars.clear()

	var roster := CharacterArchetypeCatalog.all()
	for i in range(roster.size()):
		var id := str(roster[i].get("id", ""))
		var profile := CharacterArchetypeCatalog.create_avatar(id)
		if profile == null:
			continue
		var avatar := AnimeAvatar2D.new()
		avatar.position = Vector2(125, 128) + Vector2(i % COLUMNS, i / COLUMNS) * CELL
		avatar.scale = Vector2(0.62, 0.62)
		avatar.setup(profile)
		add_child(avatar)
		avatars.append(avatar)
	_apply_pose_cycle()

func _apply_pose_cycle() -> void:
	var poses := [
		AnimeAvatar2D.Pose.IDLE,
		AnimeAvatar2D.Pose.MENU_IDLE,
		AnimeAvatar2D.Pose.BAT,
		AnimeAvatar2D.Pose.PITCH,
		AnimeAvatar2D.Pose.RUN,
		AnimeAvatar2D.Pose.CELEBRATE,
	]
	for i in range(avatars.size()):
		avatars[i].set_pose(poses[(pose_index + i) % poses.size()])

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 960), Color("#101822"))
	draw_string(ThemeDB.fallback_font, Vector2(24, 34), "BASEBALL WAIFUS · 2D MOTION ROSTER", HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color("#f4f0df"))
	draw_string(ThemeDB.fallback_font, Vector2(24, 60), "30 adult roster profiles · procedural preview · replaceable by production art/rig", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("#b9c6d4"))
	for row in range(ROWS):
		for column in range(COLUMNS):
			var rect := Rect2(Vector2(column, row) * CELL + Vector2(8, 74), CELL - Vector2(16, 12))
			draw_style_box(_panel_style(), rect)

func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#182330")
	style.border_color = Color("#2c4054")
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	return style
