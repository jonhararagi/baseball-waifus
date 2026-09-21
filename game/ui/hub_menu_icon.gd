class_name BaseballHubMenuIcon
extends Control

var icon_id := "history"
var accent := Color("#ffd76a")

func setup(new_icon_id: String, new_accent: Color = Color("#ffd76a")) -> void:
	icon_id = new_icon_id
	accent = new_accent
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(44, 44)
	queue_redraw()

func _draw() -> void:
	var c := accent
	var center := size * 0.5
	var s: float = min(size.x, size.y)
	draw_circle(center, s * 0.46, Color(0.02, 0.04, 0.10, 0.55))
	draw_circle(center, s * 0.42, Color(c, 0.10))
	draw_arc(center, s * 0.42, 0.0, TAU, 32, Color(c, 0.78), 2.0, true)

	match icon_id:
		"history":
			draw_polyline(PackedVector2Array([
				center + Vector2(-14, 5),
				center + Vector2(-4, -4),
				center + Vector2(5, 2),
				center + Vector2(14, -9)
			]), c, 3.0, true)
			for p in [Vector2(-14, 5), Vector2(-4, -4), Vector2(5, 2), Vector2(14, -9)]:
				draw_circle(center + p, 3.0, c)
		"team":
			for p in [Vector2(-10, 0), Vector2(10, 0), Vector2(0, -12)]:
				draw_circle(center + p, 7.0, c)
			draw_line(center + Vector2(-17, 11), center + Vector2(-3, 11), c, 3.0)
			draw_line(center + Vector2(3, 11), center + Vector2(17, 11), c, 3.0)
		"training":
			draw_line(center + Vector2(-13, -11), center + Vector2(13, -11), c, 5.0)
			draw_line(center + Vector2(-13, 11), center + Vector2(13, 11), c, 5.0)
			draw_rect(Rect2(center + Vector2(-17, -14), Vector2(7, 28)), c, true)
			draw_rect(Rect2(center + Vector2(10, -14), Vector2(7, 28)), c, true)
		"equipment":
			var bat := PackedVector2Array([
				center + Vector2(-10, 14),
				center + Vector2(-5, 9),
				center + Vector2(13, -12),
				center + Vector2(8, -17)
			])
			draw_colored_polygon(bat, c)
			draw_circle(center + Vector2(-12, 16), 4.0, Color(c, 0.72))
		"gacha":
			var gem := PackedVector2Array([
				center + Vector2(0, -15),
				center + Vector2(13, -5),
				center + Vector2(8, 13),
				center + Vector2(-8, 13),
				center + Vector2(-13, -5)
			])
			draw_colored_polygon(gem, c)
			draw_line(center + Vector2(-8, -5), center + Vector2(8, -5), Color.WHITE, 2.0)
			draw_line(center + Vector2(0, -15), center + Vector2(0, 10), Color.WHITE, 2.0)
		"inventory":
			draw_rect(Rect2(center + Vector2(-14, -8), Vector2(28, 21)), c, true)
			draw_rect(Rect2(center + Vector2(-9, -13), Vector2(18, 6)), c, true)
			draw_line(center + Vector2(-7, 2), center + Vector2(7, 2), Color.WHITE, 2.0)
		"story":
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(-14, -13),
				center + Vector2(-1, -9),
				center + Vector2(-1, 14),
				center + Vector2(-14, 10)
			]), c)
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(1, -9),
				center + Vector2(14, -13),
				center + Vector2(14, 10),
				center + Vector2(1, 14)
			]), c)
			draw_line(center + Vector2(0, -8), center + Vector2(0, 14), Color.WHITE, 2.0)
		"events":
			draw_rect(Rect2(center + Vector2(-12, -8), Vector2(24, 21)), c, false, 3.0)
			draw_line(center + Vector2(-12, -1), center + Vector2(12, -1), c, 3.0)
			draw_line(center + Vector2(-7, -14), center + Vector2(-7, -5), c, 4.0)
			draw_line(center + Vector2(7, -14), center + Vector2(7, -5), c, 4.0)
			draw_circle(center + Vector2(0, 7), 3.0, c)
		"options":
			for i in range(8):
				var a := float(i) * TAU / 8.0
				var p := center + Vector2(cos(a), sin(a)) * 13.0
				draw_circle(p, 4.0, c)
			draw_circle(center, 8.0, Color(0.02, 0.04, 0.10))
			draw_arc(center, 8.0, 0.0, TAU, 20, c, 3.0, true)
		_:
			draw_circle(center, 7.0, c)
