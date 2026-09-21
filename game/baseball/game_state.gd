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
var base_runners: Array = [null, null, null]
var batting_indices := [0, 0]
var game_over := false
var winner := -1

func reset_count() -> void:
	strikes = 0
	balls = 0

func current_batter_index() -> int:
	return int(batting_indices[half])

func advance_lineup(team_index: int = -1) -> void:
	var target_team := half if team_index < 0 else team_index
	if target_team < 0 or target_team > 1:
		return
	batting_indices[target_team] = int(batting_indices[target_team]) + 1

func clear_bases() -> void:
	bases = [false, false, false]
	base_runners = [null, null, null]

func apply_ball(batter: PlayerData, team_id: String) -> Dictionary:
	balls += 1
	if balls < 4:
		return {"walk": false, "balls": balls, "forced": [], "runs": 0}
	var plan := apply_walk(batter, team_id)
	plan["walk"] = true
	plan["balls"] = 4
	return plan

func apply_walk(batter: PlayerData, team_id: String) -> Dictionary:
	var before_ids := _runner_id_snapshot()
	var plan: Array = []
	var runs := 0
	var after: Array = base_runners.duplicate()
	var batter_token := RunnerToken.from_player(batter, team_id)

	if after[0] == null:
		after[0] = batter_token
		plan.append({"kind": "batter", "runner": batter_token, "from": -1, "to": 0, "scored": false})
	else:
		if after[1] == null:
			var forced_to_second: RunnerToken = after[0]
			after[1] = forced_to_second
			after[0] = batter_token
			plan.append({"kind": "runner", "runner": forced_to_second, "from": 0, "to": 1, "scored": false})
			plan.append({"kind": "batter", "runner": batter_token, "from": -1, "to": 0, "scored": false})
		else:
			if after[2] == null:
				var forced_to_third: RunnerToken = after[1]
				after[2] = forced_to_third
				after[1] = after[0]
				after[0] = batter_token
				plan.append({"kind": "runner", "runner": forced_to_third, "from": 1, "to": 2, "scored": false})
				plan.append({"kind": "runner", "runner": after[1], "from": 0, "to": 1, "scored": false})
				plan.append({"kind": "batter", "runner": batter_token, "from": -1, "to": 0, "scored": false})
			else:
				var scoring_runner: RunnerToken = after[2]
				runs += 1
				plan.append({"kind": "runner", "runner": scoring_runner, "from": 2, "to": -1, "scored": true})
				after[2] = after[1]
				plan.append({"kind": "runner", "runner": after[1], "from": 1, "to": 2, "scored": false})
				after[1] = after[0]
				plan.append({"kind": "runner", "runner": after[0], "from": 0, "to": 1, "scored": false})
				after[0] = batter_token
				plan.append({"kind": "batter", "runner": batter_token, "from": -1, "to": 0, "scored": false})

	base_runners = after
	_refresh_base_flags()
	score[team_batting()] += runs
	reset_count()
	return {
		"runs": runs,
		"before_ids": before_ids,
		"after_ids": _runner_id_snapshot(),
		"after_runners": base_runners.duplicate(),
		"plan": plan
	}

func apply_hit(batter: PlayerData, team_id: String, hit_bases: int) -> Dictionary:
	var safe_bases := clamp(hit_bases, 1, 4)
	var before_ids := _runner_id_snapshot()
	var plan: Array = []
	var after: Array = [null, null, null]
	var runs := 0

	for source in range(3):
		var runner: RunnerToken = base_runners[source]
		if runner == null:
			continue
		var destination := source + safe_bases
		if destination >= 3:
			runs += 1
			plan.append({
				"kind": "runner",
				"runner": runner,
				"from": source,
				"to": -1,
				"scored": true
			})
		else:
			after[destination] = runner
			plan.append({
				"kind": "runner",
				"runner": runner,
				"from": source,
				"to": destination,
				"scored": false
			})

	var batter_token := RunnerToken.from_player(batter, team_id)
	if safe_bases >= 4:
		runs += 1
		plan.append({
			"kind": "batter",
			"runner": batter_token,
			"from": -1,
			"to": -1,
			"scored": true
		})
	else:
		var batter_destination := safe_bases - 1
		after[batter_destination] = batter_token
		plan.append({
			"kind": "batter",
			"runner": batter_token,
			"from": -1,
			"to": batter_destination,
			"scored": false
		})

	base_runners = after
	_refresh_base_flags()

	return {
		"runs": runs,
		"runs": runs,
		"before_ids": before_ids,
		"after_ids": _runner_id_snapshot(),
		"after_runners": base_runners.duplicate(),
		"plan": plan
	}

func remove_base_runner(index: int) -> RunnerToken:
	if index < 0 or index >= 3:
		return null
	var runner: RunnerToken = base_runners[index]
	base_runners[index] = null
	_refresh_base_flags()
	return runner

func move_runner_on_steal(from_index: int, success: bool) -> Dictionary:
	if from_index < 0 or from_index >= 3:
		return {"success": false, "from": from_index, "to": -1}

	var runner: RunnerToken = base_runners[from_index]
	if runner == null:
		return {"success": false, "from": from_index, "to": -1}

	if not success:
		base_runners[from_index] = null
		_refresh_base_flags()
		return {"success": false, "from": from_index, "to": -1, "runner": runner}

	var destination := from_index + 1
	base_runners[from_index] = null
	if destination >= 3:
		score[team_batting()] += 1
		_refresh_base_flags()
		return {"success": true, "from": from_index, "to": -1, "runner": runner, "scored": true}

	base_runners[destination] = runner
	_refresh_base_flags()
	return {"success": true, "from": from_index, "to": destination, "runner": runner, "scored": false}

func add_out() -> void:
	outs += 1
	reset_count()
	if outs >= 3:
		end_half()

func add_outs(count: int) -> void:
	var safe_count := max(count, 0)
	if safe_count <= 0:
		return
	outs += safe_count
	reset_count()
	if outs >= 3:
		end_half()

func end_half() -> void:
	reset_count()
	clear_bases()
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
		else:
			winner = -1

func team_batting() -> int:
	return half

func _refresh_base_flags() -> void:
	bases = [
		base_runners[0] != null,
		base_runners[1] != null,
		base_runners[2] != null
	]

func _runner_id_snapshot() -> Array:
	var result: Array = []
	for runner in base_runners:
		if runner == null:
			result.append("")
		else:
			result.append(str(runner.player_id))
	return result
