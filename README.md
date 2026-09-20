# Baseball Waifus

Prototipo técnico jugable en Godot 4.x.

Controles:
- ESPACIO o click izquierdo: batear durante TIMING.
- S: intentar robo cuando existe corredor.

Arquitectura:
- game/characters: datos de jugadoras.
- game/baseball: pitches, simulación, estado y corredores.
- game/ai: decisiones del rival.
- game/ui: HUD.
- scenes: composición y ejecución.

El primer prototipo usa renderizado procedural para evitar depender de assets externos. Los assets con licencia compatible se incorporarán después de validar el núcleo jugable.


## Streaming + Avatar Lab

Se añadió una herramienta local de desarrollo para probar personajes como avatares anime y preparar su integración con OBS.

Arquitectura:
- `tools/streaming_bridge`: Python, OpenCV, MediaPipe, captura de webcam, medidor de audio y cliente OBS WebSocket.
- `game/streaming/tracking_receiver.gd`: receptor UDP local.
- `game/avatar/avatar_profile.gd`: datos editables del cuerpo.
- `game/avatar/anime_avatar_2d.gd`: cuerpo anime procedural y poses.
- `scenes/avatar_lab.tscn`: laboratorio independiente del partido.

El avatar puede probar Idle, Walk, Run, Bat, Pitch, Catch, Celebrate y Hit Reaction. También permite variar altura, cintura, cadera y hombros para probar rápidamente siluetas de jugadoras antes de producir arte final.

### Ejecutar el laboratorio

Abrir `scenes/avatar_lab.tscn` desde el editor de Godot.

Para tracking:
```
cd tools/streaming_bridge
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
```

OBS continúa siendo el compositor/emisor. El bridge solamente aporta tracking, telemetría de audio y control opcional de escena.
