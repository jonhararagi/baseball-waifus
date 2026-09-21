class_name VisualQAExporter
extends Node

## Headless visual QA exporter.
## Activated only when --run-qa-capture is present.
##
## The exporter has two explicit termination paths:
## - success: PNG saved, exit code 0;
## - safety timeout/failure: exit code 1.
## This prevents GitHub Actions from remaining in-progress if the render
## never reaches frame_post_draw.

const SAFETY_TIMEOUT_SECONDS := 5.0

@export var output_path := "res://qa_captures/bw004_character_presentation.png"
@export var settle_seconds := 0.75

var _finished := false

func _ready() -> void:
	if "--run-qa-capture" not in OS.get_cmdline_args():
		return

	get_tree().create_timer(SAFETY_TIMEOUT_SECONDS).timeout.connect(_on_safety_timeout)
	call_deferred("_begin_capture")

func _begin_capture() -> void:
	await get_tree().create_timer(settle_seconds).timeout
	if _finished:
		return
	await get_tree().process_frame
	if _finished:
		return
	RenderingServer.frame_post_draw.connect(_capture_frame, CONNECT_ONE_SHOT)

func _capture_frame() -> void:
	if _finished:
		return

	var viewport := get_viewport()
	if viewport == null:
		_fail_and_quit("[QA_VISUAL] Viewport inválido.")
		return

	var texture := viewport.get_texture()
	if texture == null:
		_fail_and_quit("[QA_VISUAL] No se pudo acceder a la textura del viewport.")
		return

	var image := texture.get_image()
	if image == null:
		_fail_and_quit("[QA_VISUAL] No se pudo obtener la imagen del viewport.")
		return

	var directory := ProjectSettings.globalize_path("res://qa_captures")
	var dir_error := DirAccess.make_dir_recursive_absolute(directory)
	if dir_error != OK and dir_error != ERR_ALREADY_EXISTS:
		_fail_and_quit("[QA_VISUAL] No se pudo crear el directorio de capturas: " + str(dir_error))
		return

	var absolute_path := ProjectSettings.globalize_path(output_path)
	var error := image.save_png(absolute_path)
	if error != OK:
		_fail_and_quit("[QA_VISUAL] Error guardando PNG: " + str(error))
		return

	_finished = true
	print("VisualQAExporter: saved ", absolute_path)
	get_tree().quit(0)

func _on_safety_timeout() -> void:
	if _finished:
		return
	push_error("[QA_VISUAL] Timeout alcanzado. Forzando cierre.")
	get_tree().quit(1)

func _fail_and_quit(message: String) -> void:
	if _finished:
		return
	_finished = true
	push_error(message)
	get_tree().quit(1)
