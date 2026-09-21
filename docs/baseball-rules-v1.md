# Baseball Waifus: reglas de partido v1 del prototipo

Fecha de revisión: 2026-09-21

Este documento concreta para el prototipo las reglas de conteo y flujo de turno ya previstas en `docs/game-design.md`.

## Conteo

- Ball: suma una bola.
- 4 balls: walk/base on balls.
- Strike: suma un strike.
- 3 strikes: out y termina el turno.
- Foul: suma strike solamente con menos de 2 strikes.
- Foul con 2 strikes: mantiene 2 strikes.
- Hit válido: reinicia balls/strikes.
- Out: reinicia balls/strikes.
- Si termina la ventana de timing sin swing, se registra un strike llamado.

## Pitch

Se conservan los tres pitches existentes:

| Pitch | Difficulty | Zone bias | Speed |
|---|---:|---:|---:|
| Fastball | 0.25 | 0.90 | 1.35 |
| Curve | 0.42 | 0.82 | 0.95 |
| Special | 0.52 | 0.78 | 1.10 |

La probabilidad de zona es:

`zone_chance = clamp(zone_bias + (Control_effective / 100 - 0.50) * 0.18, 0.65, 0.96)`

Un lanzamiento fuera de zona produce `BALL` antes de abrir el timing.

## Walk

Al cuarto ball se fuerza la cadena desde primera:

- primera libre: la bateadora ocupa primera;
- primera ocupada: la corredora va a segunda;
- primera y segunda ocupadas: ambas avanzan;
- bases llenas: la corredora de tercera anota y las demás avanzan.

El walk reinicia el conteo y avanza la alineación del equipo bateador.

## Alineación e innings

Cada equipo mantiene su índice de bateo por separado. El tercer out puede cambiar inmediatamente `half`, pero el índice que avanza sigue siendo el del equipo que estaba bateando.

El prototipo usa 3 innings. Cada mitad termina con 3 outs y limpia bases/conteo.

## Arquitectura

`BaseballSimulator` resuelve pitch y contacto. `BaseballGameState` mantiene conteo, bases, carreras, lineup e innings. Presentación y HUD solo representan resultados.

## QA

`scenes/baseball_rules_test.gd` cubre timing, límites de zona, walks y avance correcto del lineup. La prueba está preparada para Godot; no se declara ejecución runtime cuando el binario de Godot no está disponible.
