class_name AvatarProfile
extends Resource

@export var display_name := "Baseball Waifu"

@export_range(0.75, 1.25, 0.01) var height := 1.0
@export_range(0.75, 1.30, 0.01) var shoulder_width := 1.0
@export_range(0.70, 1.35, 0.01) var waist_width := 0.90
@export_range(0.70, 1.45, 0.01) var hip_width := 1.0
@export_range(0.70, 1.45, 0.01) var bust := 1.0
@export_range(0.80, 1.20, 0.01) var head_scale := 1.0

@export_enum("slim", "balanced", "athletic", "curvy", "power") var body_preset := "balanced"
@export_enum("long", "short", "bob", "ponytail", "twin_tail") var hair_style := "long"
@export_enum("standard", "sporty", "jacket", "sleeveless") var uniform_style := "standard"
@export_enum("soft", "sharp", "round") var face_style := "soft"

@export var skin := Color("#e7b08f")
@export var hair := Color("#5b3a29")
@export var hair_accent := Color("#8a5a3b")
@export var uniform := Color("#f3f0df")
@export var accent := Color("#e58b32")
@export var eye := Color("#49352d")
@export var blush := Color("#e8958d")
@export var accessory := Color("#f6d35f")
@export var show_cap := false

func apply_body_preset(name: String) -> void:
	body_preset = name
	match name:
		"slim":
			shoulder_width = 0.90
			waist_width = 0.78
			hip_width = 0.92
			bust = 0.82
		"balanced":
			shoulder_width = 1.00
			waist_width = 0.90
			hip_width = 1.00
			bust = 1.00
		"athletic":
			shoulder_width = 1.10
			waist_width = 0.95
			hip_width = 1.02
			bust = 0.92
		"curvy":
			shoulder_width = 0.98
			waist_width = 0.82
			hip_width = 1.18
			bust = 1.16
		"power":
			shoulder_width = 1.18
			waist_width = 1.02
			hip_width = 1.10
			bust = 1.08

func randomize_profile(seed_value: int = 0) -> void:
	var rng := RandomNumberGenerator.new()
	if seed_value == 0:
		rng.randomize()
	else:
		rng.seed = seed_value
	var presets := ["slim", "balanced", "athletic", "curvy", "power"]
	apply_body_preset(presets[rng.randi_range(0, presets.size() - 1)])
	height = snapped(rng.randf_range(0.82, 1.20), 0.01)
	head_scale = snapped(rng.randf_range(0.90, 1.10), 0.01)
	hair_style = ["long", "short", "bob", "ponytail", "twin_tail"][rng.randi_range(0, 4)]
	uniform_style = ["standard", "sporty", "jacket", "sleeveless"][rng.randi_range(0, 3)]
	face_style = ["soft", "sharp", "round"][rng.randi_range(0, 2)]
	var palettes := [
		{"skin": "#e7b08f", "hair": "#5b3a29", "accent": "#e58b32", "eye": "#49352d"},
		{"skin": "#f2c8a7", "hair": "#2f3a73", "accent": "#6fa8dc", "eye": "#274e9b"},
		{"skin": "#c98762", "hair": "#33261f", "accent": "#c95d7a", "eye": "#3b1f2b"},
		{"skin": "#f0d6c0", "hair": "#6b7b45", "accent": "#d6c04e", "eye": "#45542f"}
	]
	var palette: Dictionary = palettes[rng.randi_range(0, palettes.size() - 1)]
	skin = Color(palette["skin"])
	hair = Color(palette["hair"])
	hair_accent = hair.lightened(0.22)
	uniform = Color("#f3f0df")
	accent = Color(palette["accent"])
	eye = Color(palette["eye"])
	accessory = accent.lightened(0.35)
	show_cap = rng.randf() > 0.65

func to_dictionary() -> Dictionary:
	return {
		"display_name": display_name,
		"height": height,
		"shoulder_width": shoulder_width,
		"waist_width": waist_width,
		"hip_width": hip_width,
		"bust": bust,
		"head_scale": head_scale,
		"body_preset": body_preset,
		"hair_style": hair_style,
		"uniform_style": uniform_style,
		"face_style": face_style,
		"skin": skin.to_html(false),
		"hair": hair.to_html(false),
		"hair_accent": hair_accent.to_html(false),
		"uniform": uniform.to_html(false),
		"accent": accent.to_html(false),
		"eye": eye.to_html(false),
		"blush": blush.to_html(false),
		"accessory": accessory.to_html(false),
		"show_cap": show_cap
	}

static func from_dictionary(data: Dictionary) -> AvatarProfile:
	var p := AvatarProfile.new()
	p.display_name = str(data.get("display_name", p.display_name))
	p.height = float(data.get("height", p.height))
	p.shoulder_width = float(data.get("shoulder_width", p.shoulder_width))
	p.waist_width = float(data.get("waist_width", p.waist_width))
	p.hip_width = float(data.get("hip_width", p.hip_width))
	p.bust = float(data.get("bust", p.bust))
	p.head_scale = float(data.get("head_scale", p.head_scale))
	p.body_preset = str(data.get("body_preset", p.body_preset))
	p.hair_style = str(data.get("hair_style", p.hair_style))
	p.uniform_style = str(data.get("uniform_style", p.uniform_style))
	p.face_style = str(data.get("face_style", p.face_style))
	p.skin = Color.from_string(str(data.get("skin", p.skin.to_html(false))), p.skin)
	p.hair = Color.from_string(str(data.get("hair", p.hair.to_html(false))), p.hair)
	p.hair_accent = Color.from_string(str(data.get("hair_accent", p.hair_accent.to_html(false))), p.hair_accent)
	p.uniform = Color.from_string(str(data.get("uniform", p.uniform.to_html(false))), p.uniform)
	p.accent = Color.from_string(str(data.get("accent", p.accent.to_html(false))), p.accent)
	p.eye = Color.from_string(str(data.get("eye", p.eye.to_html(false))), p.eye)
	p.blush = Color.from_string(str(data.get("blush", p.blush.to_html(false))), p.blush)
	p.accessory = Color.from_string(str(data.get("accessory", p.accessory.to_html(false))), p.accessory)
	p.show_cap = bool(data.get("show_cap", p.show_cap))
	return p

func clone_profile() -> AvatarProfile:
	return AvatarProfile.from_dictionary(to_dictionary())
