# Investigación OSS: Streaming, Tracking y Avatares

Esta carpeta conserva la investigación arquitectónica usada para ampliar el Streaming Bridge de Baseball Waifus.

Regla del proyecto: se estudian repositorios públicos como referencia de arquitectura, APIs, contratos y patrones. No se copia código ni assets de terceros al runtime del juego salvo que exista una decisión explícita de dependencia y una revisión de licencia.

## Objetivos

- captura webcam y procesamiento facial;
- transporte de tracking con baja latencia;
- control remoto de OBS;
- rigging/avatar 2D;
- avatar 3D basado en VRM;
- separación entre tracking, transporte y renderer;
- pruebas reproducibles sin hardware.

## Fuentes principales

- OBS WebSocket: https://github.com/obsproject/obs-websocket
- OpenSeeFace: https://github.com/emilianavt/OpenSeeFace
- MediaPipe: https://github.com/google-ai-edge/mediapipe
- Inochi2D runtime: https://github.com/Inochi2D/inochi2d
- Inochi Creator: https://github.com/Inochi2D/inochi-creator
- three-vrm: https://github.com/pixiv/three-vrm
- obsws-python: https://github.com/aatikturk/obsws-python

## Estado

Las referencias ya están contrastadas con el bridge actual. La siguiente capa de implementación mantiene Godot como núcleo del juego y Python como proveedor externo de tracking/captura.
