# T090 · Combat Vertical Slice Reality Check

## Resultado ejecutivo

**Estado:** PARCIAL.

BaseWarriors: Meta-Strike ya posee una experiencia de combate de personajes 2.5D que puede ejecutarse y presentarse en browser como blockout. No es solamente infraestructura técnica.

La secuencia normal:

`FORMATION → ATTACKER_FOCUS → ACTION → IMPACT → TARGET_REACTION → COMBAT_RETURN → COMPLETE`

funciona en runtime y tiene evidencia browser remota.

El proyecto todavía no está listo para producción definitiva de arte porque los actores de soporte siguen siendo fixtures, el enemy puede seguir siendo fixture, y los assets físicos de FAR/MID/GROUND/FOREGROUND todavía no son consumidos por el renderer mediante sus `assetSlot`.

## A. Current Reality

El runtime actual construye un `CombatStage` con:

- 4 PLAYER actors;
- 1 ENEMY actor;
- profundidad FAR/MID/NEAR;
- elevación y escala;
- camera anchors;
- actor anchors;
- set pieces presentation-only;
- una ruta cinematográfica normal;
- una ruta Ultimate de QA.

La UI pública permite entrar al combate desde HOME mediante PLAY.

Browser Use sobre el sitio público observó correctamente la entrada HOME → COMBAT y la presencia de la arena/controles sin errores visibles.

## B. Gameplay

**Clasificación: REAL / PARCIAL.**

`combat_core.js` contiene resolvers reales:

- `resolveTacticalTurn()`;
- `resolveClimaxTurn()`;
- `calculateTacticalTurn()`;
- `calculateClimaxDamage()`.

El estado local conserva turno táctico, HP del jefe, energía, efectividad y fase.

La autoridad del daño/resolución no pertenece al director de presentación.

La limitación actual es arquitectónica: parte de la orquestación del gameplay sigue dentro de `CombatRenderer`, por lo que la separación PLAYER DATA → GAMEPLAY → RESULT → PRESENTATION todavía no es completamente aislada.

## C. Presentation

**Clasificación: REAL.**

`CombatPresentationDirector` controla una ruta determinista de acción normal y utiliza anchors del actor/escenario para seleccionar cámara y foco.

T077 browser QA sobre SHA `9f95c9482ed5798cab325deb260994ce63f0179a` verificó:

`HOME`
→ `COMBAT ENTRY`
→ `REAL BAT INPUT`
→ `ATTACKER FOCUS`
→ `ACTION`
→ `IMPACT`
→ `TARGET REACTION`
→ `COMBAT RETURN`
→ `PRESENTATION COMPLETE`

## D. 2.5D

**Clasificación: REAL / PARCIAL.**

El stage no es un plano 2D uniforme. Existen:

- profundidad FAR/MID/NEAR;
- posiciones diferentes;
- elevación;
- escala;
- facing;
- parallax por layer;
- camera anchors;
- actor camera anchors;
- transformaciones cinematográficas por fase.

La experiencia, por tanto, ya tiene una base real de 2.5D.

Pero las capas visuales del escenario siguen siendo blockout procedural. El renderer dibuja FAR/MID/GROUND/FOREGROUND con funciones de dibujo y no carga los PNG de producción declarados por `assetSlot`.

## E. Character Actors

**Clasificación: PARCIAL.**

El actor contract es adecuado para producción.

El actor seleccionado puede utilizar un sprite runtime real mediante `BatterRenderer`.

Los otros tres jugadores siguen siendo:

`T078_BLOCKOUT_FIXTURE`

y se dibujan como formas procedurales.

El enemigo tiene contrato propio y reacción visual, pero puede caer en fallback procedural cuando no hay sprite.

Esto significa que la arquitectura de actor está presente, mientras el contenido definitivo aún no lo está.

## F. Normal Attack

**Clasificación: REAL, con una corrección de progresión localizada.**

Browser QA público detectó que el primer `BATEAR`:

- enfocaba al atacante;
- mostraba el swing;
- mostraba un proyectil;
- mostraba impacto;
- mostraba reacción enemiga;
- regresaba a formation.

Después del ataque, el botón BATEAR quedaba deshabilitado en `TACTICAL 1/5`.

La causa fue el handler de `app.js` que volvía a deshabilitar el botón inmediatamente después de `beginTimingWindow()`.

Se corrigió únicamente el handler:

```js
if (started) {
  batButton.disabled = Boolean(renderer.isTimingWindowActive?.());
}
```

Commit:

`9f95c9482ed5798cab325deb260994ce63f0179a`

No se modificó ningún resolver de combate.

## G. Ultimate

**Clasificación: PARCIAL.**

El sistema de choreography T081/T081-B está realmente implementado como presentation checkpoint y tiene browser evidence real:

- staging;
- character focus;
- action prep;
- action;
- projectile;
- impact;
- enemy reaction;
- return;
- gameplay immutability.

Runs verificadas en el SHA correctivo:

- T081: `36985962945` → success;
- T081-B: `36985962964` → success.

Sin embargo, el control visible `SUPER SWING` del runtime actual no llama a esa secuencia Ultimate completa. Llama a `triggerSuperSwingDemo()` y `SuperSwingCutin`.

Resultado observado en browser:

`SUPER SWING`
→ cut-in
→ portrait / quote / speed lines
→ return

sin projectile, impact, enemy reaction ni team staging completo.

Los hooks `?qa=t081` prueban la choreography de QA, no la Ultimate player-facing.

## H. Art Pipeline

**Clasificación: PARCIALMENTE PREPARADO.**

El contrato de arte de CombatStage ya define:

- FAR;
- MIDGROUND;
- GROUND;
- FOREGROUND.

El Art Studio T090 preflight ya puede detectar disponibilidad real del source.

Pero el runtime todavía necesita una integración para que:

`assetSlot → physical stage asset → rendered stage layer`

sea real.

Por ello, un PNG final de FAR no debería introducirse todavía esperando que aparezca automáticamente en el combate.

## I. Blockers

Los bloqueadores reales encontrados son:

**1. Progresión del loop normal:** detectado y corregido en `app.js`. El fix ya pasó Combat Vertical Slice Tests y T077 browser QA.

**2. Full progression proof:** todavía no existe evidencia browser específica que demuestre de forma controlada los cinco turnos tácticos + Timing Ring/CLIMAX después del fix.

**3. Stage asset consumption:** los `assetSlot` existen, pero el renderer continúa procedural.

**4. Player-facing Ultimate:** la choreography existe en QA, pero el botón visible sigue siendo un cut-in/demo y no la secuencia completa.

**5. Production actor content:** support actors son fixtures; enemy puede ser fixture.

## J. Art Readiness

**No estamos todavía en producción definitiva de arte.**

El sistema ya está suficientemente avanzado como para justificar producción del contrato de actor, pero falta cerrar la sustitución segura:

`PLACEHOLDER ACTOR → SAME ACTOR CONTRACT → PRODUCTION WAIFU`

y, en paralelo:

`PLACEHOLDER STAGE → SAME ASSET SLOT → PRODUCTION STAGE`

El objetivo no es hacer bonito el blockout. El objetivo es comprobar que el contenido definitivo entra sin reconstruir el juego.

## Five Questions

### 1. ¿Tenemos ya el juego de combate o solamente una fase/prototipo técnico?

**Tenemos un combat game de blockout jugable/presentable, pero no un vertical slice final cerrado.**

Existe experiencia real en browser y existe un loop cinematográfico normal real. Todavía faltan integración de contenido definitivo y cierre de algunas partes del loop.

### 2. ¿Qué parte del loop CHARACTER → CAMERA → ACTION → IMPACT → REACTION funciona realmente?

**Funciona toda esa cadena para el ataque normal.**

El browser proof muestra attacker focus, swing/action, projectile, impact, target reaction y return.

### 3. ¿Qué falta para que cuatro waifus con trajes de baseball puedan convertirse en actores reales del combate?

Falta sustituir los fixtures de soporte y el fallback del enemy por assets de producción compatibles con el mismo actor contract. También falta que el stage consuma realmente FAR/MID/GROUND/FOREGROUND desde sus asset slots.

### 4. ¿Estamos preparados para producir el arte definitivo?

**Todavía no.**

La preparación del contrato sí está avanzada, pero producir los assets antes de cerrar el consumo runtime del stage y la prueba completa del loop introduciría riesgo innecesario.

### 5. ¿Cuál es el único siguiente trabajo que desbloquea más progreso?

**T091 · NORMAL COMBAT LOOP REAL PROGRESSION PROOF.**

Demostrar con browser automation el loop completo de combate sobre el runtime actual, especialmente después del fix de T090. No crear nuevas mecánicas ni nuevo stage.

## Evidencia CI / Browser

- Combat Vertical Slice Tests: Run `36985962981`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.
- T080 Character Combat Cinematic Action CI: Run `36985962962`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.
- T077 Combat Presentation Browser QA: Run `36985963000`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.
- T081 Cinematic Ultimate Choreography Browser QA: Run `36985962945`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.
- T081-B Ultimate Action Reaction Browser QA: Run `36985962964`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.
- T081 Foundation CI: Run `36985962992`, success, SHA `9f95c9482ed5798cab325deb260994ce63f0179a`.

## Scope

Archivos modificados durante la auditoría:

`webapp/js/app.js`

Documentación añadida al cierre:

`docs/t090-combat-vertical-slice-reality-check.md`

`docs/bitacora.md`

No se modificaron:

- CombatStage;
- CombatRenderer;
- combat_core;
- presentation director;
- gameplay formulas;
- tactical combat;
- Ultimate mechanics;
- projectile logic;
- impact/reaction logic;
- economía;
- gacha;
- Kytos;
- Student 4v4.

## Timer

T090 Reality Check: cerrado.

Siguiente milestone:

`T091 ≈ 1–2 h`

Objetivo:

`FORMACIÓN → 5 TACTICAL TURNS → TIMING RING / CLIMAX → RESULT → RETURN`

No se suma el timer del arte definitivo a esta estimación.
