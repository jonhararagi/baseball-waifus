extends Node

func _ready() -> void:
	var scheduler := BaseballMatchEventScheduler.new()
	var started: Array[String] = []
	var finished: Array[String] = []
	scheduler.event_started.connect(func(name: String): started.append(name))
	scheduler.event_finished.connect(func(name: String): finished.append(name))

	scheduler.start_match_intro()
	var intro := scheduler.tick(1.0)
	assert(intro.active)
	assert(intro.event == "MATCH_INTRO")
	assert(intro.progress > 0.0 and intro.progress < 1.0)

	var intro_done := scheduler.tick(2.0)
	assert(intro_done.finished)
	assert(finished.back() == "MATCH_INTRO")

	scheduler.start_plate_prep()
	assert(scheduler.is_active("PLATE_PREP"))
	var prep_done := scheduler.tick(0.9)
	assert(prep_done.finished)

	scheduler.start_action_window(0.5)
	var action_done := scheduler.tick(0.5)
	assert(action_done.finished)

	var snapshot := scheduler.snapshot()
	scheduler.start_result()
	scheduler.restore(snapshot)
	assert(scheduler.snapshot() == snapshot)
	assert(started.size() == 4)
	print("BaseballMatchEventScheduler structural test prepared.")
