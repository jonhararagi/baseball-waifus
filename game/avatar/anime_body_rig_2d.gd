class_name AnimeBodyRig2D
extends AnimeAvatar2D

var rig_time := 0.0

func _process(delta: float) -> void:
	rig_time += delta
	super._process(delta)

func _draw() -> void:
	if profile == null:
		return

	var scale_factor := profile.height
	var tracking_yaw := clamp(float(tracking.get("yaw", 0.0)), -1.0, 1.0)
	var tracking_pitch := clamp(float(tracking.get("pitch", 0.0)), -1.0, 1.0)
	var tracking_roll := clamp(float(tracking.get("roll", 0.0)), -1.0, 1.0)
	var blink := clamp(float(tracking.get("blink", 0.0)), 0.0, 1.0)
	var mouth := clamp(float(tracking.get("mouth", 0.0)), 0.0, 1.0)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2(scale_factor, scale_factor))

	var locomotion := 0.0
	var bob := 0.0
	if pose == Pose.WALK or pose == Pose.RUN:
		locomotion = sin(walk_phase)
		bob = abs(sin(walk_phase * 2.0)) * (-3.0 if pose == Pose.WALK else -7.0)
	elif pose == Pose.STEAL:
		locomotion = sin(walk_phase * 1.4)
		bob = -2.0
	elif pose == Pose.SLIDE:
		locomotion = 1.0
		bob = 18.0
	else:
		bob = sin(rig_time * 2.0) * (1.2 if pose == Pose.MENU_IDLE else 0.6)

	var hip := Vector2(0, 66.0 + bob)
	var chest := Vector2(0, 8.0 + bob)
	var neck := Vector2(0, -60.0 + bob)
	var head := Vector2(
		tracking_yaw * 8.0,
		-103.0 + bob + tracking_pitch * 7.0
	)

	if pose == Pose.DEFEAT:
		head.y += 13.0
	if pose == Pose.SLIDE:
		head.y += 22.0

	var shoulder_half := 49.0 * profile.shoulder_width
	var waist_half := 31.0 * profile.waist_width
	var hip_half := 43.0 * profile.hip_width
	var thigh_half := 12.0 * profile.hip_width

	var left_shoulder := chest + Vector2(-shoulder_half, 0)
	var right_shoulder := chest + Vector2(shoulder_half, 0)

	var leg_stride := locomotion * (18.0 if pose == Pose.WALK else 29.0 if pose == Pose.RUN else 34.0 if pose == Pose.STEAL else 4.0)
	var left_knee := hip + Vector2(-thigh_half - leg_stride, 49.0)
	var right_knee := hip + Vector2(thigh_half + leg_stride, 49.0)
	var left_foot := left_knee + Vector2(-leg_stride * 0.35 - 3.0, 56.0)
	var right_foot := right_knee + Vector2(leg_stride * 0.35 + 3.0, 56.0)

	if pose == Pose.SLIDE:
		left_knee = hip + Vector2(-54, 35)
		right_knee = hip + Vector2(35, 18)
		left_foot = left_knee + Vector2(-58, 14)
		right_foot = right_knee + Vector2(58, 20)

	var left_elbow := _arm_elbow(left_shoulder, -1.0)
	var right_elbow := _arm_elbow(right_shoulder, 1.0)
	var left_hand := _arm_hand(left_elbow, -1.0)
	var right_hand := _arm_hand(right_elbow, 1.0)

	var torso := PackedVector2Array([
		Vector2(-shoulder_half, chest.y),
		Vector2(shoulder_half, chest.y),
		Vector2(waist_half, chest.y + 45),
		Vector2(hip_half, hip.y),
		Vector2(-hip_half, hip.y),
		Vector2(-waist_half, chest.y + 45)
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

	var skirt_color := AvatarVisualCatalog.clothing_color(profile.accent, profile.equipment.skirt_style)
	draw_colored_polygon(
		PackedVector2Array([
			Vector2(-38, hip.y - 3),
			Vector2(38, hip.y - 3),
			Vector2(60.0 * profile.hip_width, hip.y + 31),
			Vector2(-60.0 * profile.hip_width, hip.y + 31)
		]),
		skirt_color
	)

	if profile.equipment.vest_style != "vest_basic":
		var vest_color := AvatarVisualCatalog.clothing_color(uniform_color, profile.equipment.vest_style)
		draw_line(Vector2(-waist_half, chest.y + 6), Vector2(-hip_half + 4, hip.y - 4), vest_color, 6.0)
		draw_line(Vector2(waist_half, chest.y + 6), Vector2(hip_half - 4, hip.y - 4), vest_color, 6.0)

	if profile.bust > 0.9:
		var chest_r := 12.0 * profile.bust
		draw_circle(Vector2(-18, chest.y + 27), chest_r, profile.uniform.darkened(0.04))
		draw_circle(Vector2(18, chest.y + 27), chest_r, profile.uniform.darkened(0.04))

	_draw_limb(hip, left_knee, 20.0, profile.skin)
	_draw_limb(hip, right_knee, 20.0, profile.skin)
	_draw_limb(left_knee, left_foot, 17.0, profile.accent)
	_draw_limb(right_knee, right_foot, 17.0, profile.accent)

	var shoe_color := AvatarVisualCatalog.footwear_color(profile.accent, profile.equipment.shoes_style)
	draw_line(left_foot + Vector2(-8, 2), left_foot + Vector2(13, 2), shoe_color, 8.0)
	draw_line(right_foot + Vector2(-13, 2), right_foot + Vector2(8, 2), shoe_color, 8.0)

	_draw_limb(left_shoulder, left_elbow, 14.0, profile.skin)
	_draw_limb(left_elbow, left_hand, 12.0, profile.skin)
	_draw_limb(right_shoulder, right_elbow, 14.0, profile.skin)
	_draw_limb(right_elbow, right_hand, 12.0, profile.skin)
	draw_circle(left_hand, 8.5, profile.skin)
	draw_circle(right_hand, 8.5, profile.skin)

	if profile.equipment.gloves_style != "glove_basic":
		var glove_color := profile.accessory
		match profile.equipment.gloves_style:
			"glove_gold":
				glove_color = Color("#d7b84c")
			"glove_precision":
				glove_color = Color("#c9d1d9")
			"glove_guardian":
				glove_color = Color("#5d6570")
		draw_circle(left_hand, 10.5, glove_color)
		draw_circle(right_hand, 10.5, glove_color)

	draw_line(Vector2(0, neck.y + 13), neck, profile.skin, 18.0)

	var head_radius := 50.0 * profile.head_scale
	draw_set_transform(head, tracking_roll * 0.30, Vector2(scale_factor, scale_factor))
	draw_circle(Vector2.ZERO, head_radius, profile.skin)
	_draw_hair(head_radius, tracking_yaw)

	var eye_open := 1.0 - blink
	var eye_height := 13.0 * eye_open + 1.0
	match profile.face_style:
		"sharp":
			eye_height *= 0.78
		"round":
			eye_height *= 1.18

	for x in [-18.0, 18.0]:
		draw_ellipse(Vector2(x, 5), Vector2(9, eye_height), profile.eye)
		draw_circle(Vector2(x + 2, 2), 3, Color.WHITE)

	if profile.face_style == "sharp":
		draw_line(Vector2(-27, -8), Vector2(-13, -11), profile.eye, 3)
		draw_line(Vector2(13, -11), Vector2(27, -8), profile.eye, 3)

	draw_circle(Vector2(-26, 24), 7, Color(profile.blush, 0.34))
	draw_circle(Vector2(26, 24), 7, Color(profile.blush, 0.34))
	draw_line(Vector2(-10, 27), Vector2(10, 27), profile.eye, 3)
	if mouth > 0.45:
		draw_arc(Vector2(0, 27), 9, 0.15, PI - 0.15, 12, profile.eye, 3)

	if pose == Pose.BAT:
		var bat_color := AvatarVisualCatalog.bat_color(profile.accent, profile.equipment.bat_style)
		draw_line(Vector2(25, 0), Vector2(105, -38), bat_color, 10.0)
		draw_circle(Vector2(107, -38), 5.0, bat_color)
	if pose == Pose.THROW:
		draw_circle(Vector2(-34, -20), 8.0, Color.WHITE)
	if pose == Pose.SLIDE:
		draw_line(Vector2(-88, 118), Vector2(96, 118), Color("#d8d0c5"), 5.0)

	if profile.show_cap or profile.equipment.cap_style != "cap_none":
		draw_colored_polygon(PackedVector2Array([
			Vector2(-head_radius - 5, -28),
			Vector2(0, -head_radius - 18),
			Vector2(head_radius + 5, -28),
			Vector2(head_radius - 7, -14),
			Vector2(-head_radius + 5, -14)
		]), profile.accent)
		draw_line(Vector2(18, -34), Vector2(44, -28), profile.accessory, 5)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _arm_elbow(shoulder: Vector2, side: float) -> Vector2:
	var angle := 0.18 * side
	match pose:
		Pose.BAT:
			angle = -0.95 if side < 0 else -0.58
		Pose.PITCH:
			angle = -1.70 if side < 0 else 0.55
		Pose.CATCH:
			angle = -0.75 if side < 0 else 0.75
		Pose.CELEBRATE:
			angle = -2.15 if side < 0 else -0.85
		Pose.HIT_REACTION:
			angle = 1.0 if side < 0 else -1.0
		Pose.THROW:
			angle = -1.25 if side < 0 else 1.25
		Pose.STEAL:
			angle = -1.1 if side < 0 else 1.1
		Pose.SLIDE:
			angle = -0.45 if side < 0 else 0.45
		Pose.OUT:
			angle = 0.45 if side < 0 else -0.45
		Pose.DEFEAT:
			angle = 1.25 if side < 0 else -1.25
	return shoulder + Vector2(cos(angle), sin(angle)) * 43.0

func _arm_hand(elbow: Vector2, side: float) -> Vector2:
	var target_angle := -0.15 * side
	match pose:
		Pose.BAT:
			target_angle = -0.65 if side < 0 else -0.40
		Pose.PITCH:
			target_angle = -1.10 if side < 0 else 0.25
		Pose.CATCH:
			target_angle = -0.35 if side < 0 else 0.35
		Pose.CELEBRATE:
			target_angle = -1.8 if side < 0 else -0.55
		Pose.THROW:
			target_angle = -0.8 if side < 0 else 1.05
		Pose.STEAL:
			target_angle = -0.75 if side < 0 else 0.75
	return elbow + Vector2(cos(target_angle), sin(target_angle)) * 36.0

func _draw_limb(a: Vector2, b: Vector2, width: float, color: Color) -> void:
	draw_line(a, b, color, width, true)
	draw_circle(b, width * 0.48, color)

func _draw_hair(head_radius: float, head_yaw: float) -> void:
	var sway := sin(rig_time * 4.0) * 2.0 + head_yaw * 4.0
	var hair_radius := head_radius + 7.0
	draw_arc(Vector2.ZERO, hair_radius, PI, TAU, 24, profile.hair, 16)
	match profile.hair_style:
		"long":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius + sway, -5),
				Vector2(-hair_radius + 12 + sway, 68),
				Vector2(-30, 48),
				Vector2(0, 72),
				Vector2(28, 48),
				Vector2(hair_radius - 12, 68),
				Vector2(hair_radius, -5)
			]), profile.hair)
		"short":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius, -5),
				Vector2(-38, 32),
				Vector2(0, 24),
				Vector2(36, 32),
				Vector2(hair_radius, -5)
			]), profile.hair)
		"bob":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius, -5),
				Vector2(-hair_radius + 6, 55),
				Vector2(-30, 42),
				Vector2(0, 55),
				Vector2(30, 42),
				Vector2(hair_radius - 6, 55),
				Vector2(hair_radius, -5)
			]), profile.hair)
		"ponytail":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius, -5),
				Vector2(-38, 46),
				Vector2(0, 30),
				Vector2(35, 46),
				Vector2(hair_radius, -5)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(hair_radius - 5 + sway, 10),
				Vector2(hair_radius + 40 + sway, 26),
				Vector2(hair_radius + 22, 63),
				Vector2(hair_radius - 9, 42)
			]), profile.hair)
		"twin_tail":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius, -5),
				Vector2(-38, 44),
				Vector2(0, 28),
				Vector2(36, 44),
				Vector2(hair_radius, -5)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(-hair_radius + 3, 5),
				Vector2(-hair_radius - 40, 25),
				Vector2(-hair_radius - 18, 62),
				Vector2(-hair_radius + 10, 43)
			]), profile.hair)
			draw_colored_polygon(PackedVector2Array([
				Vector2(hair_radius - 3, 5),
				Vector2(hair_radius + 40, 25),
				Vector2(hair_radius + 18, 62),
				Vector2(hair_radius - 10, 43)
			]), profile.hair)

func draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for i in range(24):
		var a := TAU * float(i) / 24.0
		points.append(center + Vector2(cos(a) * radii.x, sin(a) * radii.y))
	draw_colored_polygon(points, color)
