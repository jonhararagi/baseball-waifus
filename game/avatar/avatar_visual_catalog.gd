class_name AvatarVisualCatalog
extends RefCounted

static func clothing_color(base: Color, style: String) -> Color:
	match style:
		"vest_power", "skirt_special":
			return base.lightened(0.10)
		"vest_guardian", "skirt_pleated":
			return base.darkened(0.08)
		"vest_light", "skirt_sport":
			return base.lightened(0.18)
		_:
			return base

static func footwear_color(accent: Color, style: String) -> Color:
	match style:
		"shoes_runner":
			return accent.lightened(0.12)
		"shoes_power":
			return accent.darkened(0.12)
		"shoes_ace":
			return Color("#d8d4cf")
		_:
			return Color("#302a32")

static func bat_color(accent: Color, style: String) -> Color:
	match style:
		"bat_power":
			return Color("#a86432")
		"bat_precision":
			return Color("#d0d0d0")
		"bat_shadow":
			return Color("#40364f")
		_:
			return Color("#8b5a2b")