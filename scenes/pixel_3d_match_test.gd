extends Node3D

var batter: Pixel3DBaseballCharacter
var controller: Pixel3DBattingController
var timer := 0.0
var sequence := ["READY", "LOAD", "SWING", "FOLLOW_THROUGH", "RUN", "SLIDE", "CATCH", "THROW", "CELEBRATE", "DEFEAT"]
var index := 0

func _ready() -> void:
    var profile := CharacterArchetypeCatalog.create_avatar("bw001")
    batter = Pixel3DBaseballCharacter.new()
    add_child(batter)
    batter.setup(profile)
    controller = Pixel3DBattingController.new()
    add_child(controller)
    controller.setup(batter)

func _process(delta: float) -> void:
    timer += delta
    if timer >= 0.6:
        timer = 0.0
        controller.play(sequence[index])
        index = (index + 1) % sequence.size()
