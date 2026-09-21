class_name Pixel3DBaseballCharacter
extends Node3D

var visual_profile: AvatarProfile
var body_root: Node3D
var torso: MeshInstance3D
var head: MeshInstance3D
var hair_mass: MeshInstance3D
var ponytail: MeshInstance3D
var eye_left: MeshInstance3D
var eye_right: MeshInstance3D
var skirt: MeshInstance3D
var bat_pivot: Node3D
var lead_arm: Node3D
var trail_arm: Node3D
var front_leg: Node3D
var rear_leg: Node3D
var front_shoe: MeshInstance3D
var rear_shoe: MeshInstance3D
var cap: MeshInstance3D

func setup(profile: AvatarProfile) -> void:
	visual_profile = profile
	_build_model()

func _build_model() -> void:
	for child in get_children():
		child.queue_free()

	body_root = Node3D.new()
	body_root.name = "BodyRoot"
	add_child(body_root)

	var scale_factor := visual_profile.height if visual_profile != null else 1.0
	body_root.scale = Vector3.ONE * scale_factor

	torso = _capsule("Torso", 0.30, 0.82, body_root)
	torso.position = Vector3(0, 1.12, 0)
	torso.scale = Vector3(
		0.92 * (visual_profile.shoulder_width if visual_profile != null else 1.0),
		1.0,
		0.72 * (visual_profile.waist_width if visual_profile != null else 0.9)
	)

	skirt = _cone("Skirt", 0.43, 0.31, 0.34, body_root)
	skirt.position = Vector3(0, 0.68, 0)
	skirt.scale.x = visual_profile.hip_width if visual_profile != null else 1.0
	skirt.scale.z = visual_profile.hip_width if visual_profile != null else 1.0

	head = _sphere("Head", 0.38, body_root)
	head.position = Vector3(0, 1.86, 0)
	head.scale = Vector3.ONE * (visual_profile.head_scale if visual_profile != null else 1.0)

	hair_mass = _sphere("HairMass", 0.42, body_root)
	hair_mass.position = Vector3(0, 1.93, -0.055)
	hair_mass.scale = Vector3(1.04, 1.02, 0.88)

	eye_left = _sphere("EyeLeft", 0.045, head)
	eye_left.position = Vector3(-0.145, 0.02, 0.34)
	eye_left.scale = Vector3(1.0, 1.25, 0.45)
	eye_right = _sphere("EyeRight", 0.045, head)
	eye_right.position = Vector3(0.145, 0.02, 0.34)
	eye_right.scale = Vector3(1.0, 1.25, 0.45)

	if visual_profile != null and visual_profile.hair_style == "ponytail":
		ponytail = _capsule("Ponytail", 0.15, 0.68, body_root)
		ponytail.position = Vector3(0.30, 1.78, -0.10)
		ponytail.rotation_degrees = Vector3(0, 0, -18)
	elif visual_profile != null and visual_profile.hair_style == "twin_tail":
		ponytail = _capsule("Ponytail", 0.13, 0.60, body_root)
		ponytail.position = Vector3(-0.30, 1.77, -0.08)
		ponytail.rotation_degrees = Vector3(0, 0, 18)
		var second_tail := _capsule("PonytailRight", 0.13, 0.60, body_root)
		second_tail.position = Vector3(0.30, 1.77, -0.08)
		second_tail.rotation_degrees = Vector3(0, 0, -18)

	bat_pivot = Node3D.new()
	bat_pivot.name = "BatPivot"
	bat_pivot.position = Vector3(0.34, 1.30, 0)
	body_root.add_child(bat_pivot)

	lead_arm = _capsule("LeadArm", 0.085, 0.58, bat_pivot)
	lead_arm.position = Vector3(0.18, 0.22, 0)
	lead_arm.rotation_degrees = Vector3(0, 0, -18)

	trail_arm = _capsule("TrailArm", 0.085, 0.58, bat_pivot)
	trail_arm.position = Vector3(0.05, 0.20, 0.055)
	trail_arm.rotation_degrees = Vector3(0, 0, -12)

	front_leg = _capsule("FrontLeg", 0.105, 0.68, body_root)
	front_leg.position = Vector3(-0.17, 0.42, 0)
	rear_leg = _capsule("RearLeg", 0.105, 0.68, body_root)
	rear_leg.position = Vector3(0.17, 0.42, 0)

	front_shoe = _box("FrontShoe", Vector3(0.25, 0.10, 0.42), body_root)
	front_shoe.position = Vector3(-0.17, 0.08, 0.06)
	rear_shoe = _box("RearShoe", Vector3(0.25, 0.10, 0.42), body_root)
	rear_shoe.position = Vector3(0.17, 0.08, 0.06)

	var bat := _cylinder("Bat", 0.055, 0.11, 1.12, bat_pivot)
	bat.position = Vector3(0.0, 0.58, 0)
	bat.rotation_degrees = Vector3(0, 0, 55)

	if visual_profile != null and visual_profile.show_cap:
		cap = _sphere("Cap", 0.39, body_root)
		cap.position = Vector3(0, 2.11, 0.01)
		cap.scale = Vector3(1.02, 0.38, 1.02)
		var brim := _box("CapBrim", Vector3(0.30, 0.035, 0.20), cap)
		brim.position = Vector3(0, -0.05, 0.34)

	_apply_materials()

func _sphere(part_name: String, radius: float, parent: Node3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = part_name
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 20
	mesh.rings = 12
	node.mesh = mesh
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(node)
	return node

func _capsule(part_name: String, radius: float, height: float, parent: Node3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = part_name
	var mesh := CapsuleMesh.new()
	mesh.radius = radius
	mesh.height = height
	mesh.radial_segments = 12
	mesh.rings = 4
	node.mesh = mesh
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(node)
	return node

func _cone(part_name: String, top_radius: float, bottom_radius: float, height: float, parent: Node3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = part_name
	var mesh := CylinderMesh.new()
	mesh.top_radius = top_radius
	mesh.bottom_radius = bottom_radius
	mesh.height = height
	mesh.radial_segments = 16
	node.mesh = mesh
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(node)
	return node

func _cylinder(part_name: String, top_radius: float, bottom_radius: float, height: float, parent: Node3D) -> MeshInstance3D:
	return _cone(part_name, top_radius, bottom_radius, height, parent)

func _box(part_name: String, size: Vector3, parent: Node3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = part_name
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(node)
	return node

func _apply_materials() -> void:
	var hair := Color("#3b2b28")
	var uniform := Color("#f5f0df")
	var skin := Color("#e0ad8c")
	var eye := Color("#2d2430")
	var accent := Color("#d88a42")
	if visual_profile != null:
		hair = visual_profile.hair
		uniform = visual_profile.uniform
		skin = visual_profile.skin
		eye = visual_profile.eye
		accent = visual_profile.accent

	_material(torso, uniform)
	_material(skirt, uniform.darkened(0.06))
	_material(head, skin)
	_material(hair_mass, hair)
	_material(eye_left, eye)
	_material(eye_right, eye)
	_material(lead_arm, skin)
	_material(trail_arm, skin)
	_material(front_leg, uniform)
	_material(rear_leg, uniform)
	_material(front_shoe, accent.darkened(0.25))
	_material(rear_shoe, accent.darkened(0.25))
	if ponytail != null:
		_material(ponytail, hair)
	if cap != null:
		_material(cap, accent.darkened(0.10))
		var brim := cap.get_node_or_null("CapBrim") as MeshInstance3D
		if brim != null:
			_material(brim, accent)
	_material(bat_pivot.get_node("Bat"), Color("#9a633d"))

func _material(node: MeshInstance3D, color: Color) -> void:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.82
	mat.metallic = 0.0
	mat.specular_mode = BaseMaterial3D.SPECULAR_SCHLICK_GGX
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR
	node.material_override = mat
