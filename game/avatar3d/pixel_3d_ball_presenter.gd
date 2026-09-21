class_name Pixel3DBallPresenter
extends Node3D

var ball: MeshInstance3D
var from := Vector3.ZERO
var to := Vector3.ZERO
var elapsed := 0.0
var duration := 0.4
var active := false

func _ready() -> void:
    ball = MeshInstance3D.new()
    var mesh := SphereMesh.new()
    mesh.radius = 0.06
    mesh.height = 0.12
    ball.mesh = mesh
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color("#f4eee1")
    mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
    ball.material_override = mat
    add_child(ball)

func play_trajectory(origin: Vector3, destination: Vector3, seconds: float, arc_height := 0.0) -> void:
    from = origin
    to = destination
    duration = maxf(seconds, 0.05)
    elapsed = 0.0
    active = true
    ball.visible = true
    ball.position = from

func stop() -> void:
    active = false

func _process(delta: float) -> void:
    if not active or ball == null:
        return
    elapsed += delta
    var t := clampf(elapsed / duration, 0.0, 1.0)
    var p := from.lerp(to, t)
    p.y += sin(t * PI) * 0.35
    ball.position = p
    if t >= 1.0:
        active = false
