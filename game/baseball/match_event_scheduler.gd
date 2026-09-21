class_name BaseballMatchEventScheduler
extends RefCounted

## Lightweight event-based timing coordinator for match presentation and gameplay preparation.
## It never calculates baseball outcomes and never runs per-frame AI.
##
## Flow:
## MATCH_INTRO -> PLATE_PREP -> ACTION_WINDOW -> RESOLUTION -> RESULT
## The game can use the visual duration of each event as a natural preparation window.
## Gameplay preparation happens once when an event begins.

signal event_started(event_name: String)
signal event_finished(event_name: String)

const DURATIONS := {
	"MATCH_INTRO": 2.25,
	"PLATE_PREP": 0.90,
	"ACTION_WINDOW": 1.00,
	"RESOLUTION": 0.0,
	"RESULT": 1.20
}

var current_event := ""
var elapsed := 0.0
var sequence := 0
var _started := false

func start_match_intro() -> void:
	_start("MATCH_INTRO")

func start_plate_prep() -> void:
	_start("PLATE_PREP")

func start_action_window(duration: float = -1.0) -> void:
	if duration > 0.0:
		DURATIONS["ACTION_WINDOW"] = duration
	_start("ACTION_WINDOW")

func start_resolution() -> void:
	_start("RESOLUTION")

func start_result(duration: float = -1.0) -> void:
	if duration > 0.0:
		DURATIONS["RESULT"] = duration
	_start("RESULT")

func tick(delta: float) -> Dictionary:
	if current_event.is_empty():
		return {"active": false, "finished": false, "event": ""}

	elapsed += max(delta, 0.0)
	var duration := float(DURATIONS.get(current_event, 0.0))
	var finished := duration <= 0.0 or elapsed >= duration
	var progress := 1.0 if duration <= 0.0 else clamp(elapsed / duration, 0.0, 1.0)

	if finished:
		var finished_event := current_event
		current_event = ""
		elapsed = 0.0
		event_finished.emit(finished_event)
		return {
			"active": false,
			"finished": true,
			"event": finished_event,
			"progress": 1.0
		}

	return {
		"active": true,
		"finished": false,
		"event": current_event,
		"progress": progress,
		"remaining": max(duration - elapsed, 0.0)
	}

func is_active(event_name: String) -> bool:
	return current_event == event_name

func snapshot() -> Dictionary:
	return {
		"current_event": current_event,
		"elapsed": elapsed,
		"sequence": sequence,
		"started": _started
	}

func restore(data: Dictionary) -> void:
	current_event = str(data.get("current_event", ""))
	elapsed = max(float(data.get("elapsed", 0.0)), 0.0)
	sequence = int(data.get("sequence", 0))
	_started = bool(data.get("started", false))

func _start(event_name: String) -> void:
	current_event = event_name
	elapsed = 0.0
	sequence += 1
	_started = true
	event_started.emit(event_name)
