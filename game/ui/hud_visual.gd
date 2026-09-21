class_name GameHUDVisual
extends Control

var pulse_time := 0.0
var timing_value := 0.0
var timing_active := false
var result_emphasis := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	queue_redraw()

func set_timing(value: float, active := true) -> void:
	timing_value = clampf(value, 0.0, 1.0)
	timing_active = active
	queue_redraw()

func clear_timing() -> void:
	timing_active = false
	timing_value = 0.0
	queue_redraw()

func emphasize_result() -> void:
	result_emphasis = 1.0
	queue_redraw()

func _process(delta: float) -> void:
	pulse_time += delta
	if result_emphasis > 0.0:
		result_emphasis = maxf(0.0, result_emphasis - delta * 1.8)
	queue_redraw()

func _draw() -> void:
	var size := get_viewport_rect().size
	var w := size.x
	var h := size.y

	# Soft field vignette. The game field remains visible through transparent overlays.
	draw_rect(Rect2(0, 0, w, 118), Color(0.025, 0.035, 0.065, 0.86))
	draw_rect(Rect2(0, h - 168, w, 168), Color(0.025, 0.035, 0.065, 0.72))

	# Scoreboard frame.
	_draw_panel(Rect2(20, 16, minf(520.0, w * 0.42), 82), Color(0.05, 0.075, 0.13, 0.96), Color(0.95, 0.65, 0.23, 0.75), 18)
	# Inning chip.
	_draw_panel(Rect2(w * 0.43, 22, minf(220.0, w * 0.18), 70), Color(0.08, 0.11, 0.18, 0.96), Color(0.40, 0.78, 1.0, 0.70), 18)
	# Batter/pitcher context.
	_draw_panel(Rect2(w - minf(350.0, w * 0.28) - 20, 16, minf(350.0, w * 0.28), 82), Color(0.05, 0.075, 0.13, 0.94), Color(0.72, 0.47, 1.0, 0.65), 18)

	# Bottom action deck.
	_draw_panel(Rect2(24, h - 138, w - 48, 104), Color(0.035, 0.045, 0.075, 0.94), Color(0.34, 0.47, 0.72, 0.60), 22)

	# Timing rail.
	var rail_rect := Rect2(w * 0.28, h - 105, w * 0.44, 24)
	_draw_timing_rail(rail_rect)

	# Small heartbeat indicator while timing.
	if timing_active:
		var pulse := 1.0 + sin(pulse_time * 9.0) * 0.06
		draw_circle(Vector2(w * 0.25, h - 93), 8.0 * pulse, Color(1.0, 0.36, 0.43, 0.85))

func _draw_panel(rect: Rect2, fill: Color, border: Color, radius: float) -> void:
	# Rounded panels are approximated with concentric rectangles and circles.
	var r := minf(radius, minf(rect.size.x, rect.size.y) * 0.5)
	draw_rect(Rect2(rect.position + Vector2(r, 0), Vector2(rect.size.x - r * 2.0, rect.size.y)), fill)
	draw_rect(Rect2(rect.position + Vector2(0, r), Vector2(rect.size.x, rect.size.y - r * 2.0)), fill)
	for center in [
		rect.position + Vector2(r, r),
		rect.position + Vector2(rect.size.x - r, r),
		rect.position + Vector2(r, rect.size.y - r),
		rect.position + Vector2(rect.size.x - r, rect.size.y - r)
	]:
		draw_circle(center, r, fill)
	# Light border.
	draw_line(rect.position + Vector2(r, 0), rect.position + Vector2(rect.size.x - r, 0), border, 2.0)
	draw_line(rect.position + Vector2(r, rect.size.y), rect.position + Vector2(rect.size.x - r, rect.size.y), border, 2.0)
	draw_line(rect.position + Vector2(0, r), rect.position + Vector2(0, rect.size.y - r), border, 2.0)
	draw_line(rect.position + Vector2(rect.size.x, r), rect.position + Vector2(rect.size.x, rect.size.y - r), border, 2.0)

func _draw_timing_rail(rect: Rect2) -> void:
	var bg := Color(0.10, 0.12, 0.19, 0.98)
	draw_rect(rect, bg)
	var center := rect.position.x + rect.size.x * 0.5
	var perfect_width := rect.size.x * 0.16
	var great_width := rect.size.x * 0.34
	draw_rect(Rect2(center - great_width * 0.5, rect.position.y, great_width, rect.size.y), Color(0.35, 0.78, 1.0, 0.35))
	draw_rect(Rect2(center - perfect_width * 0.5, rect.position.y, perfect_width, rect.size.y), Color(1.0, 0.82, 0.24, 0.92))
	var marker_x := rect.position.x + timing_value * rect.size.x
	draw_circle(Vector2(marker_x, rect.get_center().y), 14.0, Color(1, 1, 1, 0.96))
	draw_circle(Vector2(marker_x, rect.get_center().y), 7.0, Color(0.96, 0.35, 0.42, 1.0))
