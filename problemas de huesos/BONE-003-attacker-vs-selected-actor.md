# BONE-003 - ATTACKER ID VS SELECTED ACTOR

PRIORIDAD: P0
ESTADO: OPEN

Riesgo: CombatPresentationDirector usa result.attackerId, mientras partes del render de CombatStage siguen usando selectedActorId para identificar al heroe visual.

Puede producirse una secuencia donde la camara y el estado enfocan PLAYER-03 pero el render principal dibuja PLAYER-01.

Objetivo: una unica resolucion de actor durante una accion: COMBAT RESULT -> attackerId -> runtime actor -> presentation -> render.

selectedActorId solo puede ser fallback explicito o seleccion de roster fuera de una secuencia ya resuelta.

Cierre: source PASS, focused actor PASS, action actor PASS, camera actor PASS, render actor PASS, return PASS.