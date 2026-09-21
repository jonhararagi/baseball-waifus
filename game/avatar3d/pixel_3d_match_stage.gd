class_name Pixel3DMatchStage
extends Node3D

var batter: Pixel3DBaseballCharacter
var batter_controller: Pixel3DBattingController
var ball_presenter: Pixel3DBallPresenter

func _ready() -> void:
	_build_field()
	_build_lighting()
	var profile := CharacterArchetypeCatalog.create_avatar("bw001")
	batter = Pixel3DBaseballCharacter.new()
	batter.position = Vector3(0.9, 0, 0)
	add_child(batter)
	batter.setup(profile)

	batter_controller = Pixel3DBattingController.new()
	add_child(batter_controller)
	batter_controller.setup(batter)

	ball_presenter = Pixel3DBallPresenter.new()
	add_child(ball_presenter)

func play_batting_sequence() -> void:
	batter_controller.play("READY")
	await get_tree().create_timer(0.18).timeout
	batter_controller.play("LOAD")
	await get_tree().create_timer(0.18).timeout
	batter_controller.play("SWING")
	ball_presenter.play_trajectory(Vector3(-2.4, 1.25, 0), Vector3(2.8, 1.6, -0.3), 0.7)
	await get_tree().create_timer(0.28).timeout
	batter_controller.play("FOLLOW_THROUGH")

func on_gameplay_event(event_name: String, payload: Dictionary = {}) -> void:
	match event_name:
		"PITCH":
			ball_presenter.play_trajectory(Vector3(-2.4, 1.25, 0), Vector3(0.7, 1.2, 0), 0.5)
			batter_controller.play("READY")
		"SWING":
			batter_controller.play("SWING")
		"CONTACT":
			var origin: Vector3 = payload.get("origin", Vector3(0.7, 1.2, 0))
			var destination: Vector3 = payload.get("destination", Vector3(3.0, 1.5, -0.4))
			var duration := float(payload.get("duration", 0.7))
			ball_presenter.play_trajectory(origin, destination, duration)
			batter_controller.play("FOLLOW_THROUGH")
		"RUN":
			batter_controller.play("RUN")
		"SLIDE":
			batter_controller.play("SLIDE")
		"CATCH":
			batter_controller.play("CATCH")
		"THROW":
			batter_controller.play("THROW")
		"CELEBRATE":
			batter_controller.play("CELEBRATE")
		"DEFEAT":
			batter_controller.play("DEFEAT")

func _build_field() -> void:
	var floor := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(12, 0.1, 8)
	floor.mesh = mesh
	floor.position = Vector3(0, -0.05, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#315d36")
	mat.roughness = 0.95
	floor.material_override = mat
	add_child(floor)

func _build_lighting() -> void:
	var sun := DirectionalLight3D.new()
	sun.name = "AnimeKeyLight"
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	add_child(sun)

	var fill := OmniLight3D.new()
	fill.name = "SoftFill"
	fill.position = Vector3(0, 4.5, 3.5)
	fill.light_energy = 1.0
	fill.omni_range = 10.0
	add_child(fill)
