extends Node

const EXPORTER_PATH := "res://game/ui/visual_qa_exporter.gd"
const EXPECTED_TIMEOUT := "const SAFETY_TIMEOUT_SECONDS := 5.0"
const EXPECTED_SUCCESS_EXIT := "get_tree().quit(0)"
const EXPECTED_FAILURE_EXIT := "get_tree().quit(1)"
const EXPECTED_TIMEOUT_LOG := '[QA_VISUAL] Timeout alcanzado. Forzando cierre.'

func _ready() -> void:
	var source := FileAccess.get_file_as_string(EXPORTER_PATH)
	assert(not source.is_empty(), "VisualQAExporter source must be readable.")
	assert(source.contains(EXPECTED_TIMEOUT), "VisualQAExporter must define a 5 second safety timeout.")
	assert(source.contains("get_tree().create_timer(SAFETY_TIMEOUT_SECONDS).timeout.connect"), "Safety timer must be connected.")
	assert(source.contains(EXPECTED_SUCCESS_EXIT), "Successful PNG capture must terminate with exit code 0.")
	assert(source.contains(EXPECTED_FAILURE_EXIT), "Safety/failure paths must terminate with exit code 1.")
	assert(source.contains(EXPECTED_TIMEOUT_LOG), "Timeout error log must remain explicit and auditable.")
	assert(source.contains("RenderingServer.frame_post_draw.connect"), "Capture must remain frame-post-draw based.")
	print("VisualQAExporter safety contract checks passed.")
	get_tree().quit(0)
