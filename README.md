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
