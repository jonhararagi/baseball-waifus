# Análisis de patrones reutilizables

## 1. OBS WebSocket

Patrón aprovechado:
- OBS permanece como compositor, grabador y emisor.
- El bridge solo solicita estado y operaciones concretas.
- La lógica de gameplay no conoce OBS.

Aplicación actual:
- `obs_client.py` encapsula la conexión.
- OBS se habilita mediante configuración.
- El fallo de OBS no bloquea el transporte de tracking.

No adoptar:
- meter el renderer del avatar dentro de OBS;
- convertir OBS en dependencia del núcleo del juego.

## 2. OpenSeeFace

Patrón aprovechado:
- tracker independiente;
- salida de tracking separada de la presentación;
- transporte de baja latencia;
- posibilidad de cambiar consumidor sin cambiar el tracker.

Aplicación actual:
- `tracker.py` produce solo datos normalizados;
- `protocol.py` define el contrato;
- UDP localhost separa Python de Godot;
- `TrackingReceiver` consume el contrato sin importar OpenCV/MediaPipe.

Resultado:
- el tracker puede cambiar de MediaPipe a OpenSeeFace u otro proveedor sin tocar el renderer.

## 3. MediaPipe

Patrón aprovechado:
- landmarks faciales como entrada de alto nivel;
- normalización a señales pequeñas para el consumidor;
- procesamiento continuo orientado a realtime.

Aplicación actual:
- yaw, pitch, roll, blink y mouth;
- smoothing configurable;
- fallback sintético para QA.

Pendiente:
- landmarks adicionales para cejas, mirada y expresiones avanzadas;
- calibración por usuario.

## 4. Inochi2D

Patrón aprovechado:
- separar datos del personaje de la representación;
- runtime especializado en deformación 2D;
- editor/rigging fuera del runtime.

Aplicación al proyecto:
- `AvatarProfile` ya funciona como contrato estable.
- `ExternalRigAvatar2D` es el punto de sustitución del renderer procedural.
- Inochi2D es candidato para un backend artístico 2D, no para reemplazar el sistema de datos del juego.

## 5. three-vrm

Patrón aprovechado:
- VRM como formato de avatar;
- separación de loader/runtime;
- capacidades de humanoid, lookAt, expressions y springBone.

Aplicación prevista:
- renderer externo 3D;
- avatar 3D fuera de la lógica de partido;
- mismas señales de tracking que usa el renderer 2D.

El bridge no debe conocer huesos concretos de un modelo. Debe entregar señales semánticas.

## 6. Arquitectura consolidada

Captura -> Tracking Provider -> Tracking Contract -> Transport -> Godot Receiver -> Avatar Adapter -> Renderer

OBS queda en paralelo:

Game/Renderer -> OBS capture/composition -> Stream/Record

Esto evita una dependencia circular.

## 7. Decisión

No se crea otro bridge de streaming. El bridge actual ya cubre la frontera correcta.

La ampliación futura será por adapters:
- MediaPipe provider;
- OpenSeeFace provider;
- Inochi2D renderer;
- VRM/Three.js renderer;
- OBS controller.

El contrato común sigue siendo `baseball-waifus-tracking v1`.
