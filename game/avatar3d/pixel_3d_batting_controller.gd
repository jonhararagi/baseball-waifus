class_name Pixel3DBattingController
extends Node

enum Action { IDLE, READY, LOAD, SWING, FOLLOW_THROUGH, RUN, SLIDE, CATCH, THROW, CELEBRATE, DEFEAT }

var character: Pixel3DBaseballCharacter
var action := Action.IDLE
var elapsed := 0.0
var action_duration := 0.25
var action_id := 0

func setup(target: Pixel3DBaseballCharacter) -> void:
    character = target

func play(action_name: String) -> void:
    var value := _action_from_name(action_name)
    if value < 0:
        return
    action = value
    elapsed = 0.0
    action_id += 1

func _process(delta: float) -> void:
    if character == null:
        return
    elapsed += delta
    var t := clampf(elapsed / action_duration, 0.0, 1.0)
    _apply_action(t)
    if t >= 1.0 and action not in [Action.IDLE, Action.CELEBRATE, Action.DEFEAT]:
        action = Action.IDLE
        elapsed = 0.0

func _apply_action(t: float) -> void:
    var body := character.body_root
    if body == null:
        return
    body.rotation = Vector3.ZERO
    body.position = Vector3.ZERO
    character.bat_pivot.rotation = Vector3.ZERO
    character.front_leg.rotation = Vector3.ZERO
    character.rear_leg.rotation = Vector3.ZERO

    match action:
        Action.READY:
            character.bat_pivot.rotation_degrees.z = -18.0
        Action.LOAD:
            character.bat_pivot.rotation_degrees.z = lerpf(-18.0, -48.0, t)
            character.front_leg.rotation_degrees.z = lerpf(0.0, -10.0, t)
        Action.SWING:
            character.bat_pivot.rotation_degrees.z = lerpf(-48.0, 62.0, ease(t, 0.72))
            body.rotation_degrees.y = lerpf(0.0, 18.0, t)
        Action.FOLLOW_THROUGH:
            character.bat_pivot.rotation_degrees.z = lerpf(62.0, 92.0, t)
            body.rotation_degrees.y = lerpf(18.0, 28.0, t)
        Action.RUN:
            character.front_leg.rotation_degrees.z = sin(t * PI) * 35.0
            character.rear_leg.rotation_degrees.z = -sin(t * PI) * 35.0
        Action.SLIDE:
            body.rotation_degrees.z = lerpf(0.0, -62.0, t)
            character.front_leg.rotation_degrees.z = lerpf(0.0, 72.0, t)
        Action.CATCH:
            body.position.y = lerpf(0.0, -0.12, t)
        Action.THROW:
            character.bat_pivot.rotation_degrees.z = lerpf(0.0, -95.0, t)
        Action.CELEBRATE:
            body.rotation_degrees.y = sin(t * TAU) * 8.0
        Action.DEFEAT:
            body.rotation_degrees.z = lerpf(0.0, 20.0, t)
        Action.IDLE:
            pass

func _action_from_name(name: String) -> int:
    var normalized := name.to_upper().replace("-", "_").replace(" ", "_")
    for value in Action.values():
        if str(Action.keys()[value]) == normalized:
            return value
    return -1
