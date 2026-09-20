# Sistema de defensa y resolución posterior

## Objetivo

Un resultado que todavía puede depender de una captura no se cierra como OUT dentro de BaseballSimulator.

Flujo actual:

Timing + stats → BaseballSimulator → FIELDING_CANDIDATE → BattedBallEvent → FieldingResolver → captura, miss o doble play → ThrowResolver cuando corresponde → resultado final.

## Captura

La fórmula vigente sigue versionada como fielding_v1.

chance = 0.05 + defense_score * 0.48 + positioning_score * 0.16 + timing_score * 0.16 + ball_handling_score * 0.08 + zone_bonus

La probabilidad se limita entre 8% y 92% y utiliza RandomNumberGenerator.

## Doble play

DoublePlayResolver aplica una segunda resolución cuando:
- la atrapada fue exitosa;
- hay menos de dos outs;
- existe corredora en primera;
- la defensa pertenece al infield.

La versión vigente es double_play_v1.

Una doble matanza agrega dos outs, elimina la corredora de primera y conserva las demás corredoras.

La resolución registra assist_position, pivot_position, putout_position, chance, roll y rule_version.

La presentación visual representa la cadena fielder → pivote → 1B.

## Error de lanzamiento

Cuando una defensa falla la recogida y necesita lanzar, ThrowResolver ejecuta throw_v1.

La probabilidad de error depende de defensa de quien lanza, defensa de quien recibe y distancia del lanzamiento.

Un error de lanzamiento aumenta una base adicional en la resolución actual y produce FIELDING ERROR.

La pelota utiliza una trayectoria desviada para representar el lanzamiento erróneo.

La lógica del resultado vive en ThrowResolver. El renderer solamente ejecuta la trayectoria recibida.

## Rebotes y continuidad

FieldingPlayEvent contiene defensora, puntos de rebote, punto de recogida, receptor, arco del lanzamiento, duración, error de lanzamiento y metadatos de doble play.

BaseballBallController utiliza ese contrato para dibujar batazo → rebote(s) → recogida → lanzamiento, o batazo → recogida → pivote → 1B.

## Corredoras

BaseballGameState ahora conserva RunnerToken reales en las tres bases.

Cada token incluye player_id, display_name, team_id y speed.

Los hits producen un plan explícito de movimiento con origen, destino y corredora que anota.

Eso permite animar simultáneamente corredoras existentes, nueva bateadora, carreras anotadas y cambios de base.

## Lineup

Cada equipo mantiene una alineación de nueve bateadoras.

BaseballGameState.batting_indices guarda el siguiente turno de cada equipo.

Cuando termina un turno válido, la alineación avanza. Al cambiar de mitad de entrada se cambia automáticamente equipo bateador, bateadora, pitcher y defensa.

## Regla de arquitectura

Gameplay decide hit, outs, carreras, captura, doble play y error.

Presentation decide poses, trayectorias, animación y lectura visual.

Nunca al revés.

## Pendiente

Todavía faltan:
- lanzamiento a bases intermedias más variado;
- force outs más detallados;
- rundown;
- errores de recepción separados del error de lanzamiento;
- animación de sliding;
- backend y persistencia online;
- rig artístico definitivo;
- Live2D/Inochi2D/VRM final.