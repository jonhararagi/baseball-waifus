class_name Pixel3DBaseballCharacter
extends Node3D

var visual_profile: AvatarProfile
var body_root: Node3D
var torso: MeshInstance3D
var head: MeshInstance3D
var bat_pivot: Node3D
var lead_arm: Node3D
var trail_arm: Node3D
var front_leg: Node3D
var rear_leg: Node3D

func setup(profile: AvatarProfile) -> void:
    visual_profile = profile
    _build_model()

func _build_model() -> void:
    for child in get_children():
        child.queue_free()
    body_root = Node3D.new()
    add_child(body_root)

    torso = _box("Torso", Vector3(0.62, 0.9, 0.38))
    torso.position = Vector3(0, 1.15, 0)
    head = _box("Head", Vector3(0.48, 0.48, 0.48))
    head.position = Vector3(0, 1.85, 0)
    bat_pivot = Node3D.new()
    bat_pivot.name = "BatPivot"
    bat_pivot.position = Vector3(0.34, 1.22, 0)
    body_root.add_child(bat_pivot)

    lead_arm = _box("LeadArm", Vector3(0.16, 0.62, 0.16))
    trail_arm = _box("TrailArm", Vector3(0.16, 0.62, 0.16))
    lead_arm.position = Vector3(0.28, 0.25, 0)
    trail_arm.position = Vector3(0.16, 0.28, 0.05)
    bat_pivot.add_child(lead_arm)
    bat_pivot.add_child(trail_arm)

    front_leg = _box("FrontLeg", Vector3(0.18, 0.72, 0.18))
    rear_leg = _box("RearLeg", Vector3(0.18, 0.72, 0.18))
    front_leg.position = Vector3(-0.18, 0.55, 0)
    rear_leg.position = Vector3(0.18, 0.55, 0)
    body_root.add_child(front_leg)
    body_root.add_child(rear_leg)

    var bat := _box("Bat", Vector3(0.10, 1.0, 0.10))
    bat.position = Vector3(0.0, 0.58, 0)
    bat.rotation_degrees = Vector3(0, 0, 55)
    bat_pivot.add_child(bat)

    _apply_materials()

func _box(part_name: String, size: Vector3) -> MeshInstance3D:
    var node := MeshInstance3D.new()
    node.name = part_name
    var mesh := BoxMesh.new()
    mesh.size = size
    node.mesh = mesh
    node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
    body_root.add_child(node)
    return node

func _apply_materials() -> void:
    var hair := Color("#3b2b28")
    var uniform := Color("#f5f0df")
    var skin := Color("#e0ad8c")
    if visual_profile != null:
        hair = visual_profile.hair
        uniform = visual_profile.uniform
        skin = visual_profile.skin
    _material(torso, uniform)
    _material(head, skin)
    _material(lead_arm, skin)
    _material(trail_arm, skin)
    _material(front_leg, uniform)
    _material(rear_leg, uniform)
    _material(bat_pivot.get_node("Bat"), Color("#9a633d"))

func _material(node: MeshInstance3D, color: Color) -> void:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = color
    mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
    node.material_override = mat
