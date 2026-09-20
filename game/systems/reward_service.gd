class_name RewardService
extends RefCounted

var resolver := RewardResolver.new()
var audit := ProbabilityAudit.new()
var anti_exploit := AntiExploit.new()

func resolve_campaign(zone: int, difficulty: String, run_number: int) -> Dictionary:
	var context := anti_exploit.validate_context(zone, difficulty, "campaign")
	if not context.valid:
		return {"ok": false, "reason": "invalid_context"}
	if not anti_exploit.can_run(difficulty, run_number):
		return {"ok": false, "reason": "run_limit"}
	var table := GameTables.campaign_drop_table(zone, difficulty)
	var result := resolver.roll_drop(table)
	audit.record(table.table_id, result.item)
	return {"ok": true, "result": result}

func resolve_demon_king(zone: int, difficulty: String, run_number: int) -> Dictionary:
	var context := anti_exploit.validate_context(zone, difficulty, "demon_king")
	if not context.valid:
		return {"ok": false, "reason": "invalid_context"}
	if not anti_exploit.can_run("demon_king", run_number):
		return {"ok": false, "reason": "run_limit"}
	var table := GameTables.demon_king_fragment_table(zone, difficulty)
	var result := resolver.roll_drop(table)
	audit.record(table.table_id, result.item)
	return {"ok": true, "result": result}
