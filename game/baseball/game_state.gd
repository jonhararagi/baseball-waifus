class_name BaseballGameState
extends RefCounted

var inning := 1
var max_innings := 3
var half := 0
var outs := 0
var strikes := 0
var balls := 0
var score := [0, 0]
var bases := [false, false, false]
var game_over := false
var winner := -1

func reset_count() -> void:
	strikes = 0
	balls = 0

func advance_bases(hit_bases: int) -> int:
	var runs := 0
	if hit_bases >= 4:
		for i in 3:
			if bases[i]:
				runs += 1
		bases = [false, false, false]
		return runs + 1

	var moved := [false, false, false]
	for i in 3:
		if bases[i]:
			var destination := i + hit_bases
			if destination >= 3:
				runs += 1
			else:
				moved[destination] = true
	if hit_bases > 0:
		moved[hit_bases - 1] = true
	bases = moved
	return runs

func add_out() -> void:
	outs += 1
	reset_count()
	if outs >= 3:
		end_half()

func end_half() -> void:
	reset_count()
	bases = [false, false, false]
	outs = 0
	if half == 0:
		half = 1
	else:
		half = 0
		inning += 1
	if inning > max_innings:
		game_over = true
		if score[0] > score[1]:
			winner = 0
		elif score[1] > score[0]:
			winner = 1

func team_batting() -> int:
	return half
