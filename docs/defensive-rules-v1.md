# Baseball Waifus: defensa avanzada v1

Fecha: 2026-09-21

Este documento amplía fielding_v1 sin mover la autoridad del resultado fuera de los resolvers.

## Recepción

Una captura defensiva ya resuelta como exitosa pasa por una segunda comprobación de recepción.

`reception_chance = clamp(0.025 + (1 - defense_score) * 0.07 + contact_quality * 0.035 + distance_score * 0.025, 0.02, 0.14)`

Una recepción fallida produce `FIELDING ERROR` y evita crear una secuencia de lanzamiento posterior. La probabilidad permanece baja y depende de datos del juego, no de la rareza.

## Force out

Cuando hay corredora en primera y la defensora es de infield, pitcher o catcher, puede intentarse un force out en segunda.

`force_chance = clamp(0.30 + defense_score * 0.34 - runner_speed / 500 + infield_bonus, 0.22, 0.84)`

Si tiene éxito:
- la corredora de primera queda out;
- la bateadora ocupa primera;
- se suma un out;
- el resultado es `FORCE OUT`.

El doble play existente conserva prioridad cuando su propio resolver determina una doble matanza.

## Rundown

Después de una captura limpia, una corredora existente puede quedar expuesta durante la transferencia. El prototipo modela este caso con una probabilidad baja y reproducible.

Si se inicia un rundown:
- la corredora objetivo se identifica explícitamente;
- se calcula una oportunidad de salvación mediante sliding;
- un slide exitoso produce `SAFE`;
- un tag exitoso produce `RUNDOWN OUT`.

Es una abstracción de gameplay para el prototipo. No pretende simular cada paso físico del rundown todavía.

## Sliding

El movimiento de corredoras utiliza la pose `SLIDE` ya existente en `AnimeAvatar2D`.

El estilo se determina por Speed:
- Speed >= 78: `HEADFIRST`;
- inferior: `FEET_FIRST`.

La animación solo representa el resultado. El resolver calcula primero si el slide salva a la corredora.

## Contrato

`DefensiveRunnerResolver` devuelve metadatos de gameplay:
- resultado;
- corredora afectada;
- base;
- chance;
- roll;
- tipo de slide;
- resultado del slide;
- versión de regla.

`BaseballFieldAvatarPresenter` consume esos datos y anima la jugada.

No se agregan estadísticas nuevas.

## Pruebas

`scenes/defensive_rules_test.gd` cubre:
- límites de force out;
- presencia y tipo de sliding;
- aparición de rundown mediante seeds deterministas;
- recepción fallida como `FIELDING ERROR`.

La prueba está preparada para Godot 4.x. No se declara ejecución runtime si el binario no está disponible.
