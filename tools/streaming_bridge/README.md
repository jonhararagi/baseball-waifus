# Streaming Bridge

Puente local para webcam + tracking facial + audio con el laboratorio de avatar de Godot y control opcional de OBS Studio.

## Arquitectura

Webcam -> OpenCV -> MediaPipe Face Mesh -> JSON/UDP -> Godot Avatar Lab
Micrófono -> sounddevice -> medidor RMS -> JSON/UDP -> Godot
OBS Studio <-> obsws-python <-> Streaming Bridge

OBS sigue siendo el responsable de capturar, mezclar y emitir. El bridge no reemplaza OBS ni intenta transportar el video completo por UDP.

## Instalación

Python 3.10+ recomendado:

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

Después:
1. Ejecutar scenes/avatar_lab.tscn en Godot.
2. Ejecutar python main.py desde esta carpeta.
3. Activar el WebSocket Server de OBS si se quiere controlarlo.
4. Ajustar config.json para cámara, puertos o escena.

## Referencias

OpenSeeFace fue revisado como referencia de arquitectura: tracking por webcam y envío de datos por UDP. En este prototipo se usa MediaPipe directamente para mantener el bridge pequeño.

Para avatares 3D futuros se puede añadir soporte VRM con Three.js/three-vrm sin acoplarlo al sistema de datos de personaje.
