# Baseball Waifus

Prototipo técnico modular en Godot 4.x.

## Juego

Controles del prototipo:
- ESPACIO o click izquierdo: batear durante TIMING.
- S: intentar robo cuando existe corredor.

Arquitectura:
- `game/characters`: datos de jugadoras.
- `game/baseball`: pitches, simulación, estado y corredores.
- `game/ai`: decisiones del rival.
- `game/systems`: probabilidades, drops, auditoría y anti-exploit.
- `game/avatar`: perfiles y renderizador procedural.
- `game/streaming`: receptor de tracking.
- `game/ui`: HUD.
- `scenes`: composición y ejecución.

El núcleo usa renderizado procedural para evitar depender de assets externos durante la etapa de validación.

## Character Creator

La herramienta `scenes/character_creator.tscn` funciona como un laboratorio de diseño de jugadoras.

Permite:
- presets de cuerpo;
- altura y proporciones;
- cabello;
- rostro;
- uniforme;
- colores;
- gorra;
- poses de béisbol;
- generación aleatoria;
- guardar/cargar perfiles JSON.

Para abrirla desde el editor de Godot:
1. Abrir el proyecto.
2. Abrir `scenes/character_creator.tscn`.
3. Ejecutar la escena actual con F6.

Los perfiles se guardan en:
`user://baseball_waifus/characters/`

## Streaming Bridge

Arquitectura:

**Webcam → OpenCV → MediaPipe → UDP/JSON → Godot Avatar**

**Micrófono → sounddevice → UDP/JSON → Godot**

**Pantalla opcional → mss → diagnóstico**

**OBS Studio ↔ obsws-python ↔ bridge**

El bridge no reemplaza OBS. OBS sigue siendo el responsable de capturar, mezclar, grabar y emitir.

Instalación:

```text
cd tools/streaming_bridge
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
```

Configurar `config.json` para cámara, audio, pantalla, puerto UDP, smoothing y OBS.

El tracking usa un protocolo versionado (`baseball-waifus-tracking`, v1) y `TrackingReceiver` descarta datos obsoletos.

## Licencias y referencias

La implementación procedural es propia. Las referencias externas se utilizan solo como patrones de arquitectura y se deben conservar separadas de cualquier contenido propietario.

La bitácora de desarrollo está en `docs/bitacora.md`. Cada cambio estructural importante debe registrarse allí.


## AI Character Reference Bridge

El Character Creator puede pedir una referencia visual a un ComfyUI local mediante `tools/character_ai`. Esto es opcional y no forma parte de la lógica del juego.

Ejecución conjunta de las herramientas locales:

```text
python tools/run_local_tools.py
```

La configuración del generador está en `tools/character_ai/config.json`. Debes instalar un checkpoint local compatible con ComfyUI y escribir su nombre exacto en `model`. El proyecto no incluye ni redistribuye checkpoints.

El botón `AI ref` del Character Creator envía el `AvatarProfile` actual y recibe una referencia para comparar cuerpo, cabello, uniforme y lectura visual. Las poses de gameplay siguen siendo las del renderer de Godot.


## Avatar Motion Test

La escena `scenes/avatar_motion_test.tscn` sirve para probar automáticamente el cuerpo con una secuencia de acciones de béisbol: Bat, Pitch, Throw, Catch, Steal, Slide, Out, Win y Defeat.

Abrir la escena en Godot y ejecutar con F6. `SPACE` avanza al siguiente movimiento y las teclas 1-9 disparan acciones individuales.

## Sistema visual por capas

El avatar utiliza `AvatarProfile` + `AvatarEquipment` para separar cuerpo, cabello, uniforme y equipamiento. Las piezas visuales actualmente prototipadas son bate, guantes, gorra, chaleco, falda y calzado.

El gameplay y el renderer permanecen desacoplados: el equipo visible representa datos, pero no decide sus propias estadísticas.

## Benchmark de modelos anime

`tools/character_ai/benchmark_models.py` permite comparar checkpoints locales usando una misma configuración de personaje y seed. Los checkpoints deben instalarse por separado en ComfyUI y sus licencias deben verificarse individualmente.

El repositorio prepara candidatos de familias anime XL, pero no fija un ranking permanente ni redistribuye modelos.

## Avatar roster y partido

El runtime de partido ya instancia los avatares directamente desde `PlayerData`.

`AvatarRosterService` genera y persiste un `AvatarProfile` por jugadora, mientras `AvatarMatchPresenter` traduce eventos del partido a acciones visuales. De esta forma el cuerpo probado en `Character Creator` pasa a ser el mismo cuerpo utilizado durante un partido.

La persistencia visual permanece separada de las estadísticas: cambiar pelo, proporciones, uniforme o equipamiento visual no modifica por sí mismo el resultado de una jugada.

Archivos principales:

- `game/avatar/avatar_roster_service.gd`
- `game/avatar/avatar_match_presenter.gd`
- `game/avatar/avatar_profile_store.gd`
- `scenes/main.gd`

## Avatar de campo completo

El prototipo de partido ahora muestra una formación defensiva además del pitcher y la bateadora.

`BaseballFieldAvatarPresenter` mantiene catcher, infield, outfield y tres runners visuales. Las acciones se sincronizan con eventos del partido sin tocar la resolución de probabilidades.

Esto permite usar el mismo cuerpo procedural para probar:
- posición defensiva;
- catcher y recepción;
- carrera y robo;
- reacción a hits/out;
- celebración y derrota.

El presenter es una capa de presentación y puede reemplazar posteriormente `AnimeAvatar2D` por un rig 2D o 3D sin cambiar la lógica de béisbol.

## Equipos y movimiento

El prototipo ya separa los datos de equipo en `BaseballTeamData` y `DemoTeamFactory`.

La presentación visual usa `AvatarTrajectoryController` para que runners y defensores se desplacen de forma continua en lugar de teletransportarse entre puntos.

Archivos principales:

- `game/characters/baseball_team_data.gd`
- `game/characters/demo_team_factory.gd`
- `game/avatar/avatar_trajectory_controller.gd`
- `game/avatar/baseball_field_avatar_presenter.gd`

## Pelota y trayectorias compartidas

La pelota ya tiene una representación propia mediante `BaseballBallController`.

El resultado de una jugada crea `BattedBallEvent`, y ese mismo evento se entrega a la pelota y a los defensores. Así, una jugada no tiene una trayectoria lógica por un lado y una animación inventada por otro.

La escena `scenes/baseball_ball_test.tscn` permite revisar las trayectorias de forma aislada.

Archivos principales:

- `game/baseball/batted_ball_event.gd`
- `game/avatar/baseball_ball_controller.gd`
- `scenes/baseball_ball_test.gd`
- `scenes/baseball_ball_test.tscn`
## Defensa determinista

Los batazos que todavía pueden ser capturados ya no se convierten automáticamente en `OUT`.

`BaseballSimulator` produce `FIELDING_CANDIDATE`, `BattedBallEvent` describe el punto de llegada y `FieldingResolver` calcula la captura antes de cerrar la jugada.

La resolución usa `Defense`, posicionamiento, timing y calidad de contacto con reglas versionadas. No utiliza IA.

La prueba aislada `scenes/fielding_test.tscn` permite revisar la resolución de captura fuera del partido.

## Partido completo: lineup y runners

El prototipo ahora mantiene RunnerToken para las tres bases y una alineación de nueve bateadoras por equipo.

Cada hit genera un plan real de desplazamiento para las corredoras existentes y la nueva bateadora. La presentación anima el recorrido mientras GameState conserva la resolución definitiva.

Al cambiar de mitad de entrada se actualizan automáticamente equipo bateador, bateadora, pitcher y defensa.

Escena de comprobación: scenes/match_system_test.tscn

## Defensa avanzada

FieldingResolver mantiene la captura determinista.

Ahora existen además:
- ThrowResolver para errores de lanzamiento con una consecuencia de base adicional;
- DoublePlayResolver para dobles matanzas con asistencia y putout;
- FieldingPlayEvent para la cadena defensiva;
- BaseballBallController para la trayectoria completa de rebote y lanzamiento.

El renderer no decide ningún resultado.

## Renderer y rig

AvatarRendererFactory es el punto único de entrada del renderer.

Por defecto se utiliza AnimeAvatar2D. Un AvatarProfile con art_style=rig y rig_scene_path configurado puede cargar un scene externo mediante ExternalRigAvatar2D.

Esto prepara el camino para conectar Inochi2D, Live2D o VRM/Three.js sin tocar el gameplay.

Detalles: docs/avatar-rig-integration.md