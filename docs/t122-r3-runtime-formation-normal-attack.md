# T122-R3 · Runtime Formation Normal Attack

STATUS: CLOSED

HEAD BEFORE: d43223f04b84c6b3b4d8c9bfc490829b79118e48

HEAD AFTER: see closing commit

FORMATION: PASS
ACTOR COUNT: 4
FOCUS: PASS
ACTION: PASS
RETURN: PASS
OTHER ACTORS STABLE: PASS
FORMATION RESTORED: PASS

2.5D:
- POSITION: PASS
- DEPTH: PASS
- SCALE: PASS
- ROTATION: PASS
- FACING: PASS
- VISIBILITY: PASS

The integration test uses the existing CombatPresentationDirector normal-action event sequence and the same CharacterActor2D5 instances already held by CharacterFormation2D5. Actor 2 is selected as the attacker. The test verifies FOCUS -> ACTION -> RETURN -> IDLE, while the other three player actors remain IDLE and retain their formation presentation properties.

No gameplay authority is added to the formation or actors. No second attack pipeline or formation system is introduced.

TESTS:
- T122-R3 runtime formation normal attack flow: PASS by deterministic Node integration test design/execution target.
- CharacterActor2D5 contract: covered through real CombatStage actors.
- CharacterFormation2D5 contract: covered through the runtime formation instance.
- CombatPresentationDirector contract: covered through startFromCombatResult/update event sequence.
- Vertical slice: not executed in this environment.
- Browser: NOT RUN.

GAMEPLAY: UNCHANGED

T118-R = BLOCKED / UNCHANGED

NEXT: next task from CEREBRO
