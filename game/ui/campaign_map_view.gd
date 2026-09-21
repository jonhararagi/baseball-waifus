class_name BaseballCampaignMapView
extends Control

signal map_selected(activity_id: String)

var mode := "normal"
var node_buttons: Array[Button] = []
var title_label: Label
var subtitle_label: Label

func _ready() -> void:
	custom_minimum_size = Vector2(960, 390)
	_build()

func _build() -> void:
	var title := Label.new()
	title.text = "ZONA 01  •  PRIMERA TEMPORADA"
	title.position = Vector2(20, 8)
	title.add_theme_font_size_override("font_size", 21)
	title.add_theme_color_override("font_color", Color("#ffd76a"))
	add_child(title)
	title_label = title

	var sub := Label.new()
	sub.text = "NORMAL"
	sub.position = Vector2(20, 38)
	sub.add_theme_font_size_override("font_size", 13)
	sub.add_theme_color_override("font_color", Color("#9bb7e8"))
	add_child(sub)
	subtitle_label = sub

	var positions := [
		Vector2(70, 120), Vector2(230, 85), Vector2(390, 145), Vector2(550, 75),
		Vector2(710, 135), Vector2(820, 235), Vector2(660, 300), Vector2(480, 250),
		Vector2(285, 315), Vector2(115, 255)
	]
	for i in range(10):
		var node := Button.new()
		node.text = "01" if i == 0 else "02" if i == 1 else "03" if i == 2 else "🔒"
		node.position = positions[i]
		node.size = Vector2(68, 48)
		node.disabled = i >= 3
		node.add_theme_font_size_override("font_size", 16)
		node.add_theme_stylebox_override("normal", _style("#243557", "#ffd76a", 2, 18))
		node.add_theme_stylebox_override("hover", _style("#3b4d78", "#fff1a8", 3, 18))
		node.add_theme_stylebox_override("disabled", _style("#171e32", "#47516b", 1, 18))
		if i < 3:
			node.pressed.connect(_select.bind("zone_01_map_%02d" % (i + 1)))
		add_child(node)
		node_buttons.append(node)

	var boss := Button.new()
	boss.text = "★ DEMON KING"
	boss.position = Vector2(760, 55)
	boss.size = Vector2(150, 54)
	boss.disabled = true
	boss.add_theme_stylebox_override("disabled", _style("#241c30", "#8a5c93", 2, 18))
	add_child(boss)

	queue_redraw()

func set_mode(new_mode: String) -> void:
	mode = new_mode
	subtitle_label.text = new_mode.to_upper()
	queue_redraw()

func _select(activity_id: String) -> void:
	map_selected.emit(activity_id)

func _style(fill: String, border: String, width: int, radius: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(fill)
	s.border_color = Color(border)
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	return s

func _draw() -> void:
	draw_rect(Rect2(0, 0, size.x, size.y), Color("#10172a"))
	for i in range(9):
		var a := Vector2(100 + i * 92, 170 + sin(float(i)) * 40)
		var b := Vector2(100 + (i + 1) * 92, 170 + sin(float(i + 1)) * 40)
		draw_line(a, b, Color("#40537c"), 5)
	for i in range(10):
		var x := 95 + i * 88
		draw_circle(Vector2(x, 205 + sin(float(i)) * 30), 3, Color("#ffd76a"))
