# Avatar Visual System

El personaje visual está dividido en capas para que el mismo cuerpo pueda tener muchas jugadoras, uniformes y equipamientos.

## Capas

1. Cuerpo y proporciones.
2. Uniforme base.
3. Chaleco.
4. Falda.
5. Guantes.
6. Calzado.
7. Cabello.
8. Rostro.
9. Gorra/accesorio.
10. Bate y objetos de acción.

AvatarProfile contiene apariencia y AvatarEquipment contiene piezas equipables. AnimeAvatar2D es actualmente el renderer procedural, pero la interfaz queda preparada para un renderer artístico posterior.

## Animaciones

AvatarMotionController permite acciones temporales:

- Bat
- Pitch
- Throw
- Catch
- Steal
- Slide
- Out
- Celebrate
- Defeat

Cada acción puede volver automáticamente a Idle, lo que facilita conectarlas a eventos del partido.

## Regla

El equipamiento visual no debe modificar directamente estadísticas desde el renderer. El gameplay seguirá calculando sus bonificaciones en los sistemas de equipo/probabilidad. El avatar solo representa el resultado visual.

## Integración con Character Creator

El editor de personajes expone actualmente las seis ranuras visuales de `AvatarEquipment` y el preset corporal `shonen_soft` para probar siluetas redondeadas de anime deportivo sin depender de un asset definitivo.

## Verificación de modelos

La selección del checkpoint no se considera cerrada hasta ejecutar `benchmark_models.py` con las opciones locales. La comparación debe usar el mismo seed, prompt, resolución y negative prompt.

## Roster persistente

AvatarRosterService es la frontera entre gameplay y apariencia persistente.

- `PlayerData` sigue siendo exclusivamente datos de juego.
- `PlayerAvatarAdapter` crea la apariencia inicial a partir de especialización, posición y elemento.
- `AvatarProfileStore` guarda los perfiles en `user://baseball_waifus/characters/`.
- Los perfiles asociados a jugadoras usan archivos `player_<id>.json`.
- Si existe un perfil guardado, el runtime lo reutiliza en lugar de regenerar el cuerpo.

Esto permite cambiar la forma visual de una jugadora sin alterar sus estadísticas.

## Avatar dentro del partido

`AvatarMatchPresenter` conecta los eventos del partido con `AvatarMotionController`.

Flujo actual:

`PlayerData → AvatarRosterService → AvatarProfile → AnimeAvatar2D`

y durante el partido:

`PITCH_SELECT → Pitcher pose`
`PITCHING → Pitcher pose`
`TIMING → Batter pose`
`hit/result → reacción correspondiente`
`steal → Steal/Run`
`game over → Celebrate/Defeat`

El presenter es una capa de presentación. No calcula probabilidades, no cambia estadísticas y no decide recompensas.

## Estado de producción

El cuerpo procedural ya funciona como banco de pruebas para jugadores reales del roster y sus acciones. El siguiente reemplazo natural sigue siendo el renderer artístico, no otro rediseño de la arquitectura de datos.

## Presentación completa del campo

BaseballFieldAvatarPresenter amplía el uso del cuerpo procedural desde el duelo pitcher/batter a la representación visual del campo.

La distribución prototipada es:

- C: catcher
- 1B: primera base
- 2B: segunda base
- 3B: tercera base
- SS: shortstop
- LF: left field
- CF: center field
- RF: right field
- P: continúa gestionado por AvatarMatchPresenter

El presenter también mantiene tres avatares temporales para los runners de primera, segunda y tercera base.

### Eventos visuales

- lanzamiento: catcher adopta Catch;
- hit: los fielders reaccionan según la magnitud del batazo;
- out/strike: batería defensiva celebra;
- robo: runner ejecuta Steal/Run o Out;
- fin de partido: la formación defensiva celebra o entra en estado de derrota.

Los runners del laboratorio son temporales y no se escriben en la persistencia del roster.

La capa sigue siendo puramente visual: no resuelve la jugada, no calcula probabilidades y no modifica BaseballGameState.

## Trayectorias de movimiento

AvatarTrajectoryController añade movimiento temporal a las acciones del campo.

Funciones actuales:

- `move_to`: desplaza un avatar a una posición destino;
- `dash_to`: desplazamiento rápido;
- `move_and_return`: carrera hacia una zona y regreso a la posición defensiva;
- trayectoria curva opcional mediante una interpolación cuadrática.

Se utiliza especialmente para:

- runners durante un robo;
- outfielders persiguiendo un batazo;
- infielders entrando a la línea de la pelota.

El movimiento es presentación pura. El resultado de la jugada ya fue calculado por el motor de béisbol.

## Datos de equipo

`BaseballTeamData` separa el concepto de equipo del `main.gd`.

Cada equipo puede almacenar:

- identificación y nombre;
- lista de `PlayerData`;
- orden de bateo;
- pitcher;
- consulta por posición;
- roster defensivo.

`DemoTeamFactory` crea equipos de demostración reproducibles para las pruebas.

La finalidad es que el Character Creator pueda pasar posteriormente de personajes de laboratorio a equipos completos sin reescribir el presenter visual.

## Pelota compartida entre gameplay y presentación

`BattedBallEvent` se convierte en el contrato visual común para una pelota bateada.

El motor de béisbol decide primero el resultado. Después se crea un evento con:

- resultado;
- timing;
- seed visual reproducible;
- origen;
- destino;
- punto de control;
- duración;
- tipo de trayectoria.

El mismo evento se entrega a:

`BaseballBallController` → dibuja y anima la pelota.

`BaseballFieldAvatarPresenter` → decide qué defensor reacciona y hacia qué punto se mueve.

Esto evita que el renderer invente una trayectoria diferente a la que está mostrando el gameplay.

## Prueba aislada de pelota

`scenes/baseball_ball_test.tscn` ejecuta una secuencia de Pitch, Single, Double, Triple, Home Run, Foul y Out sin iniciar un partido completo.

Sirve para depurar velocidad, arco, destino y lectura visual de las acciones antes de introducir arte final.


## Secondary Motion 3D

El renderer 3D incorpora `SecondaryMotion3D` como una capa independiente de presentación. El objetivo visual es una silueta adulta de anime deportivo con movimiento corporal perceptible desde frente, lateral, espalda y tres cuartos.

La capa aplica respuesta amortiguada a:

- torso/espalda;
- pecho;
- cadera/falda;
- muslos;
- piernas.

Las acciones de partido generan una intención de movimiento y el componente calcula el seguimiento secundario. La física visual nunca participa en gameplay.

Referencia visual: se busca una presencia corporal estilizada y dinámica propia del anime deportivo moderno, incluyendo una lectura atractiva de la silueta trasera, sin copiar modelos, rigs o animaciones propietarios.
