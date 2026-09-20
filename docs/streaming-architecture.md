# Arquitectura de Streaming y Avatar

## Objetivo

Probar personajes de Baseball Waifus como avatares anime, reutilizar exactamente el mismo perfil visual dentro del juego y permitir salida por OBS Studio sin acoplar OBS al núcleo del gameplay.

## Capas

1. Captura
   - OpenCV para webcam.
   - sounddevice para nivel de micrófono.
   - mss para captura de pantalla opcional de diagnóstico.
   - OBS sigue siendo compositor, grabador y emisor principal.

2. Tracking
   - MediaPipe Face Mesh.
   - yaw, pitch, roll, blink y mouth normalizados.
   - suavizado configurable para reducir jitter.

3. Protocolo
   - UDP localhost.
   - JSON pequeño por frame.
   - contrato versionado baseball-waifus-tracking, versión 1.
   - tracking, audio y capture viajan separados.
   - Godot invalida tracking obsoleto.

4. Avatar
   - AvatarProfile contiene los datos del personaje.
   - AnimeAvatar2D dibuja el cuerpo procedural.
   - AvatarMotionController controla poses.
   - AvatarTrajectoryController mueve jugadoras con trayectorias continuas.
   - el renderer puede reemplazarse por sprites, rig 2D, Live2D, VRM/Three.js o 3D sin cambiar el contrato de perfil.

5. Character Creator
   - scenes/character_creator.tscn.
   - presets de cuerpo y proporciones.
   - cabello, rostro, uniforme y colores.
   - seed para generación repetible.
   - guardado/carga JSON en user://baseball_waifus/characters/.

## Flujo completo

Webcam → OpenCV → MediaPipe → tracker.py → protocol.py → UDP → TrackingReceiver → AnimeAvatar2D

Micrófono → sounddevice → AudioMeter → protocol.py → UDP → Godot

Pantalla opcional → mss → diagnóstico

OBS Studio ↔ obsws-python ↔ Streaming Bridge

## Estructura del bridge

tools/streaming_bridge/main.py es el punto de ejecución.

capture.py contiene webcam, pantalla y audio.
tracker.py contiene MediaPipe y normalización facial.
protocol.py define el contrato de transporte.
obs_client.py encapsula OBS WebSocket.
config.json centraliza dispositivos, puertos, FPS y smoothing.
requirements.txt declara las dependencias abiertas utilizadas.

Godot recibe el stream mediante game/streaming/tracking_receiver.gd y no necesita conocer OpenCV, MediaPipe ni OBS.

## Sistema de diseño anime implementado

El creador actual es procedural y deliberadamente independiente de un checkpoint de IA. Ya permite fabricar jugadoras de prueba y verificar:

- proporciones y siluetas;
- poses de béisbol;
- movimiento de pitcher, bateadora, catcher, defensa y runners;
- reacción al tracking facial;
- cabello, colores y capas de uniforme;
- persistencia del perfil.

El preset shonen_soft mantiene anatomía adulta, deportiva y redondeada, con torso, caderas y muslos algo más llenos.

El módulo tools/character_ai añade concept art local mediante ComfyUI. La IA genera referencias, no decide estadísticas ni lógica.

## Rigging futuro

El perfil permanece estable mientras cambia el renderer.

Ruta 2D candidata: Inochi Creator + Inochi2D o Live2D según necesidades y licencias.
Ruta 3D candidata: VRM + Three.js.

## Estado de validación

Implementado: bridge local, tracking facial, audio, captura de pantalla opcional, protocolo versionado, receptor UDP, Character Creator, avatar procedural, movimiento y referencia de concept art.

Pendiente: validación hardware end-to-end con Godot + webcam + OBS, rig artístico de producción, Live2D/Inochi2D/VRM final, lip-sync avanzado y compositor propio.

Nota: en el entorno actual no se ejecutó Godot con cámara/micrófono/OBS, por lo que ese tramo sigue marcado como no validado en runtime.
## Hardening del bridge

El bridge admite ejecución selectiva con --no-audio, --no-screen, --no-obs y --config. healthcheck.py permite separar un problema de dependencias de un problema de hardware. MediaPipe es obligatorio para tracking. mss, sounddevice y OBS son opcionales mientras sus funciones estén apagadas. La conexión OBS es opt-in y su estado se informa explícitamente.

## Contrato de renderer actualizado

AvatarProfile con art_style=rig usa ExternalRigAvatar2D si existe rig_scene_path. Sin rig_scene_path usa AnimeBodyRig2D. Los perfiles soft/ecchi mantienen AnimeAvatar2D. AnimeBodyRig2D es un backend propio para pruebas y comparte las mismas poses, tracking y datos visuales del perfil.

## Referencias open source revisadas

- https://github.com/Inochi2D/inochi-creator
- https://github.com/Inochi2D/inochi2d
- https://github.com/pixiv/three-vrm

Licencias observadas en los repositorios consultados: BSD-2-Clause para Inochi2D/Creator y MIT para three-vrm. Live2D se mantiene solamente como adapter futuro porque su SDK no se clasifica aquí como un componente open source del runtime.


## Revisión 18: observabilidad y replay

El bridge ahora puede grabar el mismo paquete JSON que recibe Godot. La grabación usa JSONL y conserva `protocol`, `version`, `sequence`, `sent_at_ms`, `tracking`, `audio` y `capture`.

`replay.py` reproduce esas grabaciones hacia UDP con velocidad ajustable, permitiendo depurar el avatar sin webcam ni MediaPipe. Esto crea una separación explícita entre:

1. captura/tracking;
2. transporte/protocolo;
3. recepción Godot;
4. renderer/avatar.

Godot también valida protocolo, versión, objeto tracking y orden de secuencia. Los paquetes inválidos o atrasados se descartan.

El Web Host valida además que el mensaje llegue desde el iframe de Godot esperado y desde su origen exacto. Un `client_id` vacío ya no intenta inicializar el SDK de Discord.

## Revisión 19: control operativo local

La herramienta de streaming ahora incluye un panel HTTP local independiente del gameplay:

`Bridge Runtime → Control Server → Dashboard HTML`

El servidor usa la biblioteca estándar de Python, `ThreadingHTTPServer` y escucha solamente en localhost. Expone `GET /api/status`, `POST /api/record/start` y `POST /api/record/stop`.

El panel no recibe video ni audio. Solo muestra métricas y controla la grabación del protocolo JSONL.

Esto mantiene separadas las responsabilidades:

- OpenCV/MediaPipe: captura y tracking.
- Recorder: persistencia de paquetes.
- UDP: transporte al avatar.
- Control Server: operación local.
- Godot: recepción y render.
- OBS: composición y emisión.

El panel puede desactivarse con `--no-control`.


## Revisión 24: providers de tracking intercambiables

El bridge incorpora `tracking_provider.py` como frontera explícita entre captura y protocolo.

Backends actuales:
- `MediaPipeTrackingProvider`: webcam real + MediaPipe.
- `SyntheticTrackingProvider`: datos sintéticos para QA sin cámara.

Ambos entregan el mismo contrato al loop principal y no cambian `protocol.py`, UDP ni Godot.

Esto permite añadir OpenSeeFace como proveedor posterior sin crear otro bridge.
El proveedor se identifica también en `capture.tracking_provider` para diagnósticos.

La investigación externa se conserva en `docs/research/streaming_oss/`.
