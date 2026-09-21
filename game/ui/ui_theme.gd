class_name BaseballUITheme
extends RefCounted

static func panel_style(fill: Color, border: Color, radius := 16, border_width := 2) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = fill
	box.border_color = border
	box.set_border_width_all(border_width)
	box.corner_radius_top_left = radius
	box.corner_radius_top_right = radius
	box.corner_radius_bottom_left = radius
	box.corner_radius_bottom_right = radius
	box.shadow_color = Color(0, 0, 0, 0.28)
	box.shadow_size = 8
	box.content_margin_left = 14
	box.content_margin_right = 14
	box.content_margin_top = 10
	box.content_margin_bottom = 10
	return box

static func button_style(fill: Color, hover: Color, pressed: Color) -> Dictionary:
	return {
		"normal": panel_style(fill, Color(1, 1, 1, 0.14), 18, 1),
		"hover": panel_style(hover, Color(1, 1, 1, 0.28), 18, 2),
		"pressed": panel_style(pressed, Color(1, 1, 1, 0.36), 18, 2),
	}
