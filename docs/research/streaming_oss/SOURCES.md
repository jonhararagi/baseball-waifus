# Fuentes OSS revisadas

Fecha de revisión: 2026-09-20.

| Proyecto | Repositorio | Licencia observada | Utilidad para Baseball Waifus | Decisión |
|---|---|---|---|---|
| OBS WebSocket | https://github.com/obsproject/obs-websocket | GPL-2.0 | Control remoto de OBS y modelo de requests/events | Usar como protocolo de integración, no copiar código |
| OpenSeeFace | https://github.com/emilianavt/OpenSeeFace | BSD-2-Clause | Tracking facial realtime, landmarks, transporte UDP y desacoplamiento tracker/cliente | Referencia arquitectónica; MediaPipe sigue siendo el tracker actual |
| MediaPipe | https://github.com/google-ai-edge/mediapipe | Revisar licencia del componente/versionado antes de redistribuir | Pipeline de visión y Face Mesh/landmarks | Dependencia actual del bridge |
| Inochi2D | https://github.com/Inochi2D/inochi2d | BSD-2-Clause | Runtime 2D, deformación y animación de personajes VTuber | Adapter futuro, no reemplaza AvatarProfile |
| Inochi Creator | https://github.com/Inochi2D/inochi-creator | BSD-2-Clause | Creación y rigging de modelos 2D | Herramienta externa futura |
| three-vrm | https://github.com/pixiv/three-vrm | MIT | VRM sobre Three.js, humanoid, lookAt, expressions, springBone y constraints | Backend 3D futuro |
| obsws-python | https://github.com/aatikturk/obsws-python | Verificar licencia del release instalado antes de redistribuir | Cliente Python para OBS WebSocket 5.x | Dependencia opcional actual |

## Notas de licencia

No se debe asumir que "open source" equivale a "puedo copiar cualquier archivo al juego". Las licencias y los textos de los releases concretos deben verificarse antes de redistribuir código, binaries, modelos o assets.

La arquitectura del proyecto usa estas referencias sin incrustar sus fuentes.
