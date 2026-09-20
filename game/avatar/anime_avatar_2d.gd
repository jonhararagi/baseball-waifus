class_name AnimeAvatar2D
extends Node2D

enum Pose { IDLE, WALK, RUN, BAT, PITCH, CATCH, CELEBRATE, HIT_REACTION, THROW, STEAL, SLIDE, OUT, DEFEAT, MENU_IDLE }

var profile: AvatarProfile
var pose := Pose.IDLE
var tracking := {}
var anim_time := 0.0
var walk_phase := 0.0

func _ready() -> void:
	if profile == null:
		profile = AvatarProfile.new()
	queue_redraw()

func setup(p: AvatarProfile) -> void:
	profile = p
	queue_redraw()

func set_pose(next_pose: Pose) -> void:
	pose = next_pose
	queue_redraw()

func apply_tracking(data: Dictionary) -> void:
	tracking = data
	queue_redraw()

func _process(delta: float) -> void:
	anim_time += delta
	if pose == Pose.WALK or pose == Pose.RUN:
		walk_phase += delta * (7.0 if pose == Pose.WALK else 12.0)
	else:
		walk_phase = lerp(walk_phase, 0.0, min(delta * 6.0, 1.0))
	queue_redraw()

func _draw() -> void:
	if profile == null:
		return

	var scale_factor := profile.height
	var equipment: AvatarEquipment = profile.equipment
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(scale_factor, scale_factor))

	var sway := sin(walk_phase) * (8.0 if pose != Pose.IDLE else 2.0)
	var hair_sway := sin(anim_time * 4.0) * (2.0 if pose == Pose.IDLE or pose == Pose.MENU_IDLE else 5.0)
	var bob := abs(sin(walk_phase * 2.0)) * (-7.0 if pose == Pose.RUN else -3.0)

	var tracked_roll := clamp(float(tracking.get("roll", 0.0)), -1.0, 1.0)
	var tracked_yaw := clamp(float(tracking.get("yaw", 0.0)), -1.0, 1.0)
	var tracked_pitch := clamp(float(tracking.get("pitch", 0.0)), -1.0, 1.0)
	var head_tilt := tracked_roll * 0.35
	var face_shift := tracked_yaw * 8.0
	var head_lift := tracked_pitch * 8.0

	var hip_y := 70.0 + bob
	var torso_y := -5.0 + bob
	var neck_y := -76.0 + bob
	var head_y := -115.0 + bob + head_lift
	if pose == Pose.DEFEAT:
		head_y += 15.0
	if pose == Pose.SLIDE:
		head_y += 28.0

	var leg_spread := 18.0 * profile.hip_width
	var stride := sin(walk_phase) * (18.0 if pose == Pose.WALK else 28.0 if pose == Pose.RUN else 3.0)
	if pose == Pose.STEAL:
		stride = sin(walk_phase * 1.4) * 34.0
	if pose == Pose.SLIDE:
		stride = 40.0
	var left_leg := Vector2(-leg_spread - stride, hip_y + 78.0)
	var right_leg := Vector2(leg_spread + stride, hip_y + 78.0)
	draw_line(Vector2(-leg_spread, hip_y), left_leg, profile.skin, 20.0)
	draw_line(Vector2(leg_spread, hip_y), right_leg, profile.skin, 20.0)
	draw_line(left_leg, left_leg + Vector2(0, 52), profile.accent, 18.0)
	draw_line(right_leg, right_leg + Vector2(0, 52), profile.accent, 18.0)

	var torso_top := 55.0 * profile.shoulder_width
	var torso_mid := 38.0 * profile.waist_width
	var torso_bottom := 52.0 * profile.hip_width
	var torso := PackedVector2Array([
		Vector2(-torso_top, torso_y),
		Vector2(torso_top, torso_y),
		Vector2(torso_mid, torso_y + 54),
		Vector2(torso_bottom, hip_y),
		Vector2(-torso_bottom, hip_y),
		Vector2(-torso_mid, torso_y + 54)
	])

	var uniform_color := profile.uniform
	match profile.uniform_style:
		"sporty":
			uniform_color = profile.uniform.lightened(0.04)
		"jacket":
			uniform_color = profile.uniform.darkened(0.04)
		"sleeveless":
			uniform_color = profile.uniform.lightened(0.08)
	draw_colored_polygon(torso, uniform_color)

	var vest_color := AvatarVisualCatalog.clothing_color(uniform_color, equipment.vest_style)
	if equipment.vest_style != "vest_basic":
		draw_line(Vector2(-torso_mid, torso_y + 8), Vector2(-torso_bottom + 4, hip_y - 2), vest_color, 6.0)
		draw_line(Vector2(torso_mid, torso_y + 8), Vector2(torso_bottom - 4, hip_y - 2), vest_color, 6.0)

	var chest_r := 13.0 * profile.bust
	if profile.bust > 0.9:
		draw_circle(Vector2(-18, torso_y + 29), chest_r, profile.uniform.darkened(0.04))
		draw_circle(Vector2(18, torso_y + 29), chest_r, profile.uniform.darkened(0.04))

	var skirt_w := 66.0 * profile.hip_width
	var skirt_h := 35.0
	if profile.uniform_style == "jacket":
		skirt_h = 31.0
	draw_colored_polygon(PackedVector2Array([
		Vector2(-38, hip_y - 3), Vector2(38, hip_y - 3),
		Vector2(skirt_w, hip_y + skirt_h), Vector2(-skirt_w, hip_y + skirt_h)
	]), AvatarVisualCatalog.clothing_color(profile.accent, equipment.skirt_style))

	var arm_angle_l := -0.25
	var arm_angle_r := 0.25
	match pose:
		Pose.BAT:
			arm_angle_l = -0.9
			arm_angle_r = -0.55
		Pose.PITCH:
			arm_angle_l = -1.8
			arm_angle_r = 0.65
		Pose.CATCH:
			arm_angle_l = -0.75
			arm_angle_r = 0.75
		Pose.CELEBRATE:
			arm_angle_l = -2.3
			arm_angle_r = -0.8
		Pose.HIT_REACTION:
			arm_angle_l = 1.1
			arm_angle_r = -1.1
		Pose.THROW:
			arm_angle_l = -1.25
			arm_angle_r = 1.35
		Pose.STEAL:
			arm_angle_l = -1.2
			arm_angle_r = 1.2
		Pose.SLIDE:
			arm_angle_l = -0.45
			arm_angle_r = 0.45
		Pose.OUT:
			arm_angle_l = 0.45
			arm_angle_r = -0.45
		Pose.DEFEAT:
			arm_angle_l = 1.4
			arm_angle_r = -1.4
		Pose.MENU_IDLE:
			arm_angle_l = -0.12
			arm_angle_r = 0.12
	arm_angle_l += sway * 0.003
	arm_angle_r -= sway * 0.003

	var arm_len := 70.0 * profile.shoulder_width
	var left_hand := Vector2(cos(arm_angle_l), sin(arm_angle_l)) * arm_len + Vector2(-torso_top, torso_y)
	var right_hand := Vector2(cos(arm_angle_r), sin(arm_angle_r)) * arm_len + Vector2(torso_top, torso_y)
	draw_line(Vector2(-torso_top, torso_y + 5), left_hand, profile.skin, 15.0)
	draw_line(Vector2(torso_top, torso_y + 5), right_hand, profile.skin, 15.0)
	draw_circle(left_hand, 9.0, profile.skin)
	draw_circle(right_hand, 9.0, profile.skin)

	var glove_color := profile.accessory
	match equipment.gloves_style:
		"glove_gold":
			glove_color = Color("#d7b84c")
		"glove_precision":
			glove_color = Color("#c9d1d9")
		"glove_guardian":
			glove_color = Color("#5d6570")
	if equipment.gloves_style != "glove_basic":
		draw_circle(left_hand, 11.0, glove_color)
		draw_circle(right_hand, 11.0, glove_color)

	var shoe_color := AvatarVisualCatalog.footwear_color(profile.accent, equipment.shoes_style)
	draw_line(left_leg + Vector2(-7, 52), left_leg + Vector2(13, 52), shoe_color, 8.0)
	draw_line(right_leg + Vector2(-13, 52), right_leg + Vector2(7, 52), shoe_color, 8.0)

	draw_line(Vector2(0, neck_y + 12), Vector2(0, neck_y - 5), profile.skin, 20.0)
	var head_r := 52.0 * profile.head_scale
	draw_set_transform(Vector2(face_shift, head_y), head_tilt, Vector2(scale_factor, scale_factor))
	draw_circle(Vector2.ZERO, head_r, profile.skin)

	var hair_r := head_r + 7.0
	draw_arc(Vector2.ZERO, hair_r, PI, TAU, 24, profile.hair, 16.0)
	match profile.hair_style:
		"long":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r + hair_sway, -5), Vector2(-hair_r + 12 + hair_sway, 70),
				Vector2(-28, 48), Vector2(0, 72),
				Vector2(25, 48), Vector2(hair_r - 12, 70), Vector2(hair_r, -5)
			]), profile.hair)
		"short":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r, -5), Vector2(-38, 32), Vector2(0, 23),
				Vector2(35, 32), Vector2(hair_r, -5)
			]), profile.hair)
		"bob":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r, -5), Vector2(-hair_r + 6, 55), Vector2(-30, 42),
				Vector2(0, 55), Vector2(30, 42), Vector2(hair_r - 6, 55), Vector2(hair_r, -5)
			]), profile.hair)
		"ponytail":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r, -5), Vector2(-38, 46), Vector2(0, 30),
				Vector2(35, 46), Vector2(hair_r, -5)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(hair_r - 5 + hair_sway, 10), Vector2(hair_r + 40 + hair_sway, 26),
				Vector2(hair_r + 22, 63), Vector2(hair_r - 9, 42)
			]), profile.hair)
		"twin_tail":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r, -5), Vector2(-38, 44), Vector2(0, 28),
				Vector2(36, 44), Vector2(hair_r, -5)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_r + 3, 5), Vector2(-hair_r - 40, 25),
				Vector2(-hair_r - 18, 62), Vector2(-hair_r + 10, 43)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(hair_r - 3, 5), Vector2(hair_r + 40, 25),
				Vector2(hair_r + 18, 62), Vector2(hair_r - 10, 43)
			]), profile.hair)

	var blink := clamp(float(tracking.get("blink", 0.0)), 0.0, 1.0)
	var mouth := clamp(float(tracking.get("mouth", 0.0)), 0.0, 1.0)
	var eye_open := 1.0 - blink
	var eye_y := 5.0
	for x in [-19.0, 19.0]:
		var eye_height := 13.0 * eye_open + 1.0
		match profile.face_style:
			"sharp":
				eye_height *= 0.78
			"round":
				eye_height *= 1.18
		draw_ellipse(Vector2(x, eye_y), Vector2(9, eye_height), profile.eye)
		draw_circle(Vector2(x + 2, 2), 3.0, Color.WHITE)

	if profile.face_style == "sharp":
		draw_line(Vector2(-27, -8), Vector2(-13, -11), profile.eye, 3.0)
		draw_line(Vector2(13, -11), Vector2(27, -8), profile.eye, 3.0)

	draw_circle(Vector2(-27, 24), 7.0, Color(profile.blush, 0.34))
	draw_circle(Vector2(27, 24), 7.0, Color(profile.blush, 0.34))
	draw_line(Vector2(-10, 27), Vector2(10, 27), profile.eye, 3.0)
	if mouth > 0.45:
		draw_arc(Vector2(0, 27), 9.0, 0.15, PI - 0.15, 12, profile.eye, 3.0)

	if profile.show_cap or equipment.cap_style != "cap_none":
		draw_colored_polygon(PackedVector2Array([
			Vector2(-head_r - 5, -28), Vector2(0, -head_r - 18),
			Vector2(head_r + 5, -28), Vector2(head_r - 7, -14),
			Vector2(-head_r + 5, -14)
		]), profile.accent)
		draw_line(Vector2(18, -34), Vector2(44, -28), profile.accessory, 5.0)

	draw_circle(Vector2(0, 42), 5.0, profile.accessory)

	if pose == Pose.BAT:
		var bat_color := AvatarVisualCatalog.bat_color(profile.accent, equipment.bat_style)
		draw_line(Vector2(25, 0), Vector2(105, -38), bat_color, 10.0)
		draw_circle(Vector2(107, -38), 5.0, bat_color)
	if pose == Pose.THROW:
		draw_circle(Vector2(-32, -18), 8.0, Color("#f5f5f5"))
	if pose == Pose.SLIDE:
		draw_line(Vector2(-80, 118), Vector2(92, 118), Color("#d8d0c5"), 5.0)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for i in range(24):
		var a := TAU * float(i) / 24.0
		points.append(center + Vector2(cos(a) * radii.x, sin(a) * radii.y))
	draw_colored_polygon(points, color)
