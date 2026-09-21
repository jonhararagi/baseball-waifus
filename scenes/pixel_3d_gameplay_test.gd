extends Node3D

var stage: Pixel3DMatchStage

func _ready() -> void:
    stage = Pixel3DMatchStage.new()
    add_child(stage)
    stage.play_batting_sequence()
