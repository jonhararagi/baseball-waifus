class_name ProbabilityAudit
extends RefCounted

var counters: Dictionary = {}
var expected: Dictionary = {}

func record(table_id: String, outcome: String) -> void:
	if not counters.has(table_id):
		counters[table_id] = {}
	counters[table_id][outcome] = int(counters[table_id].get(outcome, 0)) + 1

func set_expected(table_id: String, distribution: Dictionary) -> void:
	expected[table_id] = distribution.duplicate(true)

func snapshot() -> Dictionary:
	var report := {}
	for table_id in counters.keys():
		var total := 0
		for n in counters[table_id].values():
			total += int(n)
		var rows := {}
		for outcome in counters[table_id].keys():
			var observed := float(counters[table_id][outcome]) / max(total, 1)
			rows[outcome] = {
				"count": counters[table_id][outcome],
				"observed": observed,
				"expected": float(expected.get(table_id, {}).get(outcome, -1.0))
			}
		report[table_id] = {"total": total, "outcomes": rows}
	return report
