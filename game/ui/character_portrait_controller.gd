class_name CharacterPortraitController
extends Control

signal state_changed(character_id: String, state_name: String)

enum PortraitState {
	IDLE,
	HAPPY,
	FOCUSED,
	SURPRISED,
	VICTORY,
	DISAPPOINTED
}

const PORTRAIT_ROOT := "res://assets/characters/portraits/"
const DEFAULT_STATE := PortraitState.IDLE

var character_id := ""
var state := PortraitState.IDLE
var texture_rect: TextureRect
var state_label: Label
var _accent := Color("#e4572e")
var _last_texture_path := ""

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_process_unhandled_key_input(false)
	_build_view()

func setup(target_character_id: String, initial_state: int = DEFAULT_STATE) -> void:
	character_id = target_character_id.strip_edges()
	state = initial_state
	if texture_rect == null:
		_build_view()
	_apply_visual_state(false)

func set_state(next_state: int, animate := true) -> void:
	var clamped_state := clampi(next_state, PortraitState.IDLE, PortraitState.DISAPPOINTED)
	if clamped_state == state and texture_rect != null and texture_rect.texture != null:
		return
	state = clamped_state
	_apply_visual_state(animate)
	state_changed.emit(character_id, state_name())

func state_name() -> String:
	return _state_filename(state).get_basename().to_upper()

func _build_view() -> void:
	custom_minimum_size = Vector2(260, 320)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_rect = TextureRect.new()
	texture_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(texture_rect)

	state_label = Label.new()
	state_label.position = Vector2(16, 14)
	state_label.add_theme_font_size_override("font_size", 12)
	state_label.add_theme_color_override("font_color", Color("#fff8e7"))
	state_label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	state_label.add_theme_constant_override("shadow_offset_x", 1)
	state_label.add_theme_constant_override("shadow_offset_y", 1)
	state_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(state_label)

func _apply_visual_state(animate: bool) -> void:
	var texture_path := _resolve_texture_path()
	if texture_path != _last_texture_path:
		texture_rect.texture = load(texture_path) as Texture2D
		_last_texture_path = texture_path
	state_label.text = state_name()

	var accent := _accent_for_state(state)
	_accent = accent
	queue_redraw()

	if not animate:
		return
	texture_rect.modulate = Color(1, 1, 1, 0.0)
	texture_rect.scale = Vector2(0.985, 0.985)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(texture_rect, "modulate", Color.WHITE, 0.16).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(texture_rect, "scale", Vector2.ONE, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _resolve_texture_path() -> String:
	var state_file := _state_filename(state)
	var state_path := "%s%s/%s.svg" % [PORTRAIT_ROOT, character_id, state_file]
	if ResourceLoader.exists(state_path):
		return state_path
	var neutral_path := "%s%s/neutral.svg" % [PORTRAIT_ROOT, character_id]
	if ResourceLoader.exists(neutral_path):
		return neutral_path
	return "res://assets/ui/baseball_waifus_icon.svg"

func _state_filename(target_state: int) -> String:
	match target_state:
		PortraitState.HAPPY:
			return "happy"
		PortraitState.FOCUSED:
			return "focused"
		PortraitState.SURPRISED:
			return "surprised"
		PortraitState.VICTORY:
			return "happy"
		PortraitState.DISAPPOINTED:
			return "focused"
		_:
			return "neutral"

func _accent_for_state(target_state: int) -> Color:
	match target_state:
		PortraitState.HAPPY, PortraitState.VICTORY:
			return Color("#ffd76a")
		PortraitState.FOCUSED:
			return Color("#8fc4ff")
		PortraitState.SURPRISED:
			return Color("#ff9cba")
		PortraitState.DISAPPOINTED:
			return Color("#b6a9c9")
		_:
			return Color("#e4572e")

func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, Color("#0d1020"), true)
	draw_line(Vector2(14, 14), Vector2(72, 14), _accent, 4.0)
	draw_line(Vector2(14, 14), Vector2(14, 72), _accent, 4.0)
	draw_line(Vector2(size.x - 14, size.y - 14), Vector2(size.x - 72, size.y - 14), _accent, 4.0)
	draw_line(Vector2(size.x - 14, size.y - 14), Vector2(size.x - 14, size.y - 72), _accent, 4.0)
	draw_line(Vector2(size.x * 0.5, size.y - 20), Vector2(size.x * 0.5, size.y - 8), _accent, 2.0)
