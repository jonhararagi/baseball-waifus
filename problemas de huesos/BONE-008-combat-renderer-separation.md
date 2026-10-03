# BONE-008 - COMBAT RENDERER / GAMEPLAY SEPARATION

PRIORIDAD: P1
ESTADO: OPEN

CombatRenderer aun concentra gameplay, tactical/climax state, timing input, camera, render, VFX, audio y presentation.

Objetivo: PLAYER DATA -> GAMEPLAY -> COMBAT RESULT -> DOMAIN EVENT -> PRESENTATION -> RENDER.

No reconstruir combat.js de golpe.

Cierre: presentation, camera y VFX no pueden modificar damage, result, victory/defeat, reward o persistence.