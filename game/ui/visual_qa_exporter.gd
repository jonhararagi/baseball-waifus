class_name VisualQAExporter
extends Node

## Headless visual QA exporter.
## Activated only when --run-qa-capture is present.

@export var output_path := "res://qa_captures/bw004_character_presentation.png"
@export var settle_seconds := 0.75

func _ready() -> void:
	if "--run-qa-capture" not in OS.get_cmdline_args():
		return
	call_deferred("_begin_capture")

func _begin_capture() -> void:
	await get_tree().create_timer(settle_seconds).timeout
	await get_tree().process_frame
	RenderingServer.frame_post_draw.connect(_capture_frame, CONNECT_ONE_SHOT)

func _capture_frame() -> void:
	var viewport := get_viewport()
	assert(viewport != null, "VisualQAExporter requires a valid viewport.")
	var texture := viewport.get_texture()
	assert(texture != null, "VisualQAExporter could not access the viewport texture.")
	var image := texture.get_image()
	assert(image != null, "VisualQAExporter could not read the viewport image.")
	var directory := ProjectSettings.globalize_path("res://qa_captures")
	DirAccess.make_dir_recursive_absolute(directory)
	var absolute_path := ProjectSettings.globalize_path(output_path)
	var error := image.save_png(absolute_path)
	assert(error == OK, "VisualQAExporter failed to save PNG: " + str(error))
	print("VisualQAExporter: saved ", absolute_path)
	get_tree().quit(0)
