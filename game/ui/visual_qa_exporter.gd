class_name VisualQAExporter
extends Node

## Headless visual QA exporter.
## Activated only when --run-qa-capture is present.
##
## Capture order:
## 1. Wait for the scene to settle.
## 2. Try an immediate viewport capture after two process frames.
## 3. If headless rendering has not produced a readable texture yet, wait for
##    RenderingServer.frame_post_draw.
## 4. A 5 second watchdog remains the final safety boundary.

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
	await get_tree().process_frame
	if _finished:
		return

	if _try_capture():
		return

	RenderingServer.frame_post_draw.connect(_capture_frame, CONNECT_ONE_SHOT)

func _try_capture() -> bool:
	if _finished:
		return true

	var viewport := get_viewport()
	if viewport == null:
		return false

	var texture := viewport.get_texture()
	if texture == null:
		return false

	var image := texture.get_image()
	if image == null:
		return false

	var directory := ProjectSettings.globalize_path("res://qa_captures")
	var dir_error := DirAccess.make_dir_recursive_absolute(directory)
	if dir_error != OK and dir_error != ERR_ALREADY_EXISTS:
		return false

	var absolute_path := ProjectSettings.globalize_path(output_path)
	var error := image.save_png(absolute_path)
	if error != OK:
		return false

	_finished = true
	print("VisualQAExporter: saved ", absolute_path)
	get_tree().quit(0)
	return true

func _capture_frame() -> void:
	if _finished:
		return
	if _try_capture():
		return
	_fail_and_quit("[QA_VISUAL] La captura frame-post-draw no produjo una imagen válida.")

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
