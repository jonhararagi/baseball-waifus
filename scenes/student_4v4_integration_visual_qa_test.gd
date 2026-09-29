extends Control

const ROLES := ["BUFFER", "HEALER", "DEBUFFER", "BATTER"]
const COLORS := {
  "BUFFER": Color("#00eaff"),
  "HEALER": Color("#58d6ff"),
  "DEBUFFER": Color("#ff3df2"),
  "BATTER": Color("#ffd166")
}

var status_label: Label
var role_labels: Array[Label] = []
var result_label: Label
var current_index := -1

func _ready() -> void:
  _build_view()
  _advance_role()
  var timer := get_tree().create_timer(2.4)
  timer.timeout.connect(_finish_fixture)

func _build_view() -> void:
  set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
  var background := ColorRect.new()
  background.color = Color("#070a13")
  background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
  add_child(background)

  var title := Label.new()
  title.text = "STUDENT 4V4 • INTEGRATION VISUAL QA"
  title.position = Vector2(48, 32)
  title.add_theme_font_size_override("font_size", 28)
  title.add_theme_color_override("font_color", Color("#e9f8ff"))
  add_child(title)

  var subtitle := Label.new()
  subtitle.text = "BUFFER → HEALER → DEBUFFER → BATTER → COMBINED RESULT"
  subtitle.position = Vector2(50, 72)
  subtitle.add_theme_font_size_override("font_size", 13)
  subtitle.add_theme_color_override("font_color", Color("#91a4b7"))
  add_child(subtitle)

  var panel := Panel.new()
  panel.position = Vector2(48, 122)
  panel.size = Vector2(1184, 500)
  panel.add_theme_stylebox_override("panel", _panel_style())
  add_child(panel)

  for index in ROLES.size():
    var card := Panel.new()
    card.position = Vector2(28 + index * 285, 30)
    card.size = Vector2(260, 150)
    card.add_theme_stylebox_override("panel", _role_style(ROLES[index], false))
    panel.add_child(card)

    var role := Label.new()
    role.text = ROLES[index]
    role.position = Vector2(18, 18)
    role.add_theme_font_size_override("font_size", 20)
    role.add_theme_color_override("font_color", COLORS[ROLES[index]])
    card.add_child(role)

    var state := Label.new()
    state.text = "PENDING"
    state.position = Vector2(18, 62)
    state.add_theme_font_size_override("font_size", 14)
    state.add_theme_color_override("font_color", Color("#91a4b7"))
    card.add_child(state)
    role_labels.append(state)

  status_label = Label.new()
  status_label.text = "PLAYER INPUT → ROLE GAMEPLAY"
  status_label.position = Vector2(30, 215)
  status_label.add_theme_font_size_override("font_size", 18)
  status_label.add_theme_color_override("font_color", Color("#e9f8ff"))
  panel.add_child(status_label)

  var flow := Label.new()
  flow.text = "ROLE_RESULT → ORCHESTRATOR → COMBAT_RESULT → PRESENTATION"
  flow.position = Vector2(30, 258)
  flow.add_theme_font_size_override("font_size", 15)
  flow.add_theme_color_override("font_color", Color("#00eaff"))
  panel.add_child(flow)

  result_label = Label.new()
  result_label.text = "COMBINED SCORE 0    ACCURACY 0%    SEED T042-VISUAL"
  result_label.position = Vector2(30, 330)
  result_label.add_theme_font_size_override("font_size", 20)
  result_label.add_theme_color_override("font_color", Color("#ff3df2"))
  panel.add_child(result_label)

  var boundary := Label.new()
  boundary.text = "QA FIXTURE ONLY • PRESENTATION VALIDATION • NO GAMEPLAY DUPLICATION"
  boundary.position = Vector2(30, 400)
  boundary.add_theme_font_size_override("font_size", 12)
  boundary.add_theme_color_override("font_color", Color("#6e8092"))
  panel.add_child(boundary)

func _advance_role() -> void:
  current_index += 1
  if current_index < ROLES.size():
    role_labels[current_index].text = "COMPLETED • RESULT"
    role_labels[current_index].add_theme_color_override("font_color", COLORS[ROLES[current_index]])
    status_label.text = "ROLE RESULT: " + ROLES[current_index] + " → NEXT ROLE"
  else:
    status_label.text = "ALL FOUR ROLE RESULTS → STUDENT4V4ORCHESTRATOR"
    result_label.text = "COMBINED SCORE 400    ACCURACY 100%    SEED T042-VISUAL"

func _finish_fixture() -> void:
  if current_index < ROLES.size():
    _advance_role()
    var timer := get_tree().create_timer(0.35)
    timer.timeout.connect(_finish_fixture)
    return
  print("student_4v4_visual_qa_fixture: PASS")

func _panel_style() -> StyleBoxFlat:
  var style := StyleBoxFlat.new()
  style.bg_color = Color("#0b1020")
  style.border_color = Color("#00eaff")
  style.set_border_width_all(2)
  style.set_corner_radius_all(18)
  return style

func _role_style(role: String, active: bool) -> StyleBoxFlat:
  var style := StyleBoxFlat.new()
  style.bg_color = Color("#111525")
  style.border_color = COLORS[role] if active else Color("#26314c")
  style.set_border_width_all(2)
  style.set_corner_radius_all(14)
  return style
