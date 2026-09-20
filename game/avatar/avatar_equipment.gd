class_name AvatarEquipment
extends Resource

@export_enum("bat_basic", "bat_power", "bat_precision", "bat_shadow") var bat_style := "bat_basic"
@export_enum("glove_basic", "glove_gold", "glove_precision", "glove_guardian") var gloves_style := "glove_basic"
@export_enum("cap_none", "cap_classic", "cap_visored", "cap_special") var cap_style := "cap_none"
@export_enum("vest_basic", "vest_power", "vest_guardian", "vest_light") var vest_style := "vest_basic"
@export_enum("skirt_basic", "skirt_pleated", "skirt_sport", "skirt_special") var skirt_style := "skirt_basic"
@export_enum("shoes_basic", "shoes_runner", "shoes_power", "shoes_ace") var shoes_style := "shoes_basic"

func to_dictionary() -> Dictionary:
	return {
		"bat_style": bat_style,
		"gloves_style": gloves_style,
		"cap_style": cap_style,
		"vest_style": vest_style,
		"skirt_style": skirt_style,
		"shoes_style": shoes_style
	}

static func from_dictionary(data: Dictionary) -> AvatarEquipment:
	var e := AvatarEquipment.new()
	e.bat_style = str(data.get("bat_style", e.bat_style))
	e.gloves_style = str(data.get("gloves_style", e.gloves_style))
	e.cap_style = str(data.get("cap_style", e.cap_style))
	e.vest_style = str(data.get("vest_style", e.vest_style))
	e.skirt_style = str(data.get("skirt_style", e.skirt_style))
	e.shoes_style = str(data.get("shoes_style", e.shoes_style))
	return e