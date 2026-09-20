class_name AnimeAvatar2D
extends Node2D

enum Pose { IDLE, WALK, RUN, BAT, PITCH, CATCH, CELEBRATE, HIT_REACTION }

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

	var sway := sin(walk_phase) * (8.0 if pose != Pose.IDLE else 2.0)
	var bob := abs(sin(walk_phase * 2.0)) * (-7.0 if pose == Pose.RUN else -3.0)
	var tracked_roll := float(tracking.get("roll", 0.0))
	var tracked_yaw := clamp(float(tracking.get("yaw", 0.0)), -1.0, 1.0)
	var head_tilt := tracked_roll * 0.35
	var face_shift := tracked_yaw * 8.0

	var hip_y := 70.0 + bob
	var torso_y := -5.0 + bob
	var neck_y := -76.0 + bob
	var head_y := -115.0 + bob

	var leg_spread := 18.0 * profile.hip_width
	var stride := sin(walk_phase) * (18.0 if pose == Pose.WALK else 28.0 if pose == Pose.RUN else 3.0)
	var left_leg := Vector2(-leg_spread - stride, hip_y + 78.0)
	var right_leg := Vector2(leg_spread + stride, hip_y + 78.0)
	draw_line(Vector2(-leg_spread, hip_y), left_leg, profile.skin, 20.0)
	draw_line(Vector2(leg_spread, hip_y), right_leg, profile.skin, 20.0)
	draw_line(left_leg, left_leg + Vector2(0, 52), profile.accent, 18.0)
	draw_line(right_leg, right_leg + Vector2(0, 52), profile.accent, 18.0)
	draw_line(left_leg + Vector2(-7, 52), left_leg + Vector2(13, 52), Color("#302a32"), 8.0)
	draw_line(right_leg + Vector2(-13, 52), right_leg + Vector2(7, 52), Color("#302a32"), 8.0)

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
	draw_colored_polygon(torso, profile.uniform)

	var skirt_w := 66.0 * profile.hip_width
	draw_colored_polygon(PackedVector2Array([
		Vector2(-38, hip_y - 3), Vector2(38, hip_y - 3),
		Vector2(skirt_w, hip_y + 35), Vector2(-skirt_w, hip_y + 35)
	]), profile.accent)

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
	var arm_len := 70.0 * profile.shoulder_width
	var left_hand := Vector2(cos(arm_angle_l), sin(arm_angle_l)) * arm_len + Vector2(-torso_top, torso_y)
	var right_hand := Vector2(cos(arm_angle_r), sin(arm_angle_r)) * arm_len + Vector2(torso_top, torso_y)
	draw_line(Vector2(-torso_top, torso_y + 5), left_hand, profile.skin, 15.0)
	draw_line(Vector2(torso_top, torso_y + 5), right_hand, profile.skin, 15.0)
	draw_circle(left_hand, 9.0, profile.skin)
	draw_circle(right_hand, 9.0, profile.skin)

	draw_line(Vector2(0, neck_y + 12), Vector2(0, neck_y - 5), profile.skin, 20.0)
	var head_r := 52.0 * profile.head_scale
	draw_set_transform(Vector2(face_shift, head_y), head_tilt, Vector2.ONE)
	draw_circle(Vector2.ZERO, head_r, profile.skin)

	var hair_r := head_r + 7.0
	draw_arc(Vector2.ZERO, hair_r, PI, TAU, 24, profile.hair, 16.0)
	if profile.hair_style == "long":
		draw_colored_polygon(PackedVector2Array([
			Vector2(-hair_r, -5), Vector2(-hair_r + 12, 70),
			Vector2(-28, 48), Vector2(0, 72),
			Vector2(25, 48), Vector2(hair_r - 12, 70), Vector2(hair_r, -5)
		]), profile.hair)
	else:
		draw_colored_polygon(PackedVector2Array([
			Vector2(-hair_r, -5), Vector2(-38, 42), Vector2(0, 28),
			Vector2(35, 42), Vector2(hair_r, -5)
		]), profile.hair)

	var blink := float(tracking.get("blink", 0.0))
	var mouth := float(tracking.get("mouth", 0.0))
	var eye_open := 1.0 - clamp(blink, 0.0, 1.0)
	for x in [-19.0, 19.0]:
		draw_ellipse(Vector2(x, 5), Vector2(9, 13 * eye_open + 1), profile.eye)
		draw_circle(Vector2(x + 2, 2), 3.0, Color.WHITE)
	draw_line(Vector2(-10, 27), Vector2(10, 27), profile.eye, 3.0)
	if mouth > 0.45:
		draw_arc(Vector2(0, 27), 9.0, 0.15, PI - 0.15, 12, profile.eye, 3.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	var ear_y := head_y + 3.0
	draw_circle(Vector2(-head_r - 2, ear_y), 10.0, profile.accent)
	draw_circle(Vector2(head_r + 2, ear_y), 10.0, profile.accent)

	if pose == Pose.BAT:
		draw_line(Vector2(25, 0), Vector2(105, -38), Color("#8b5a2b"), 10.0)

func draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for i in range(24):
		var a := TAU * float(i) / 24.0
		points.append(center + Vector2(cos(a) * radii.x, sin(a) * radii.y))
	draw_colored_polygon(points, color)
