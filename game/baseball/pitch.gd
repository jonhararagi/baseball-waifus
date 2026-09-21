class_name Pitch
extends RefCounted

enum Type { FASTBALL, CURVE, SPECIAL }

var type: Type
var name := ""
var speed := 1.0
var difficulty := 0.25
var break_amount := 0.0
var zone_bias := 0.86

static func create(t: Type) -> Pitch:
	var p := Pitch.new()
	p.type = t
	match t:
		Type.FASTBALL:
			p.name = "Fastball"
			p.speed = 1.35
			p.difficulty = 0.25
			p.zone_bias = 0.90
		Type.CURVE:
			p.name = "Curve"
			p.speed = 0.95
			p.difficulty = 0.42
			p.break_amount = 0.16
			p.zone_bias = 0.82
		Type.SPECIAL:
			p.name = "Special"
			p.speed = 1.10
			p.difficulty = 0.52
			p.break_amount = 0.08
			p.zone_bias = 0.78
	return p
