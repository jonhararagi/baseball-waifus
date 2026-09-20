class_name AvatarProfile
extends Resource

@export var display_name := "Baseball Waifu"
@export_range(0.75, 1.25, 0.01) var height := 1.0
@export_range(0.75, 1.30, 0.01) var shoulder_width := 1.0
@export_range(0.70, 1.35, 0.01) var waist_width := 0.90
@export_range(0.70, 1.45, 0.01) var hip_width := 1.0
@export_range(0.70, 1.45, 0.01) var bust := 1.0
@export_range(0.80, 1.20, 0.01) var head_scale := 1.0
@export var skin := Color("#e7b08f")
@export var hair := Color("#5b3a29")
@export var hair_accent := Color("#8a5a3b")
@export var uniform := Color("#f3f0df")
@export var accent := Color("#e58b32")
@export var eye := Color("#49352d")
@export var hair_style := "long"

func clone_profile() -> AvatarProfile:
	var p := AvatarProfile.new()
	for property in ["display_name", "height", "shoulder_width", "waist_width", "hip_width", "bust", "head_scale", "skin", "hair", "hair_accent", "uniform", "accent", "eye", "hair_style"]:
		p.set(property, get(property))
	return p
