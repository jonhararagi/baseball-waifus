# Streaming Bridge

Puente local de captura y tracking para Baseball Waifus.

## Flujo

Webcam → OpenCV → MediaPipe → JSON/UDP → Godot

Micrófono → sounddevice → JSON/UDP → Godot

Pantalla opcional → mss → diagnóstico

OBS opcional → obsws-python → cambio de escena/control externo

El bridge nunca resuelve gameplay. Solo publica tracking/captura y, de forma opcional, comunica acciones de OBS. OBS sigue siendo el responsable de capturar, mezclar, grabar y emitir.

## Instalación

Python 3.10+:

```text
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

## Ejecución

```text
python main.py
python main.py --no-audio --no-screen --no-obs
python main.py --record
python main.py --config config.json
```

## Diagnóstico

```text
python healthcheck.py
python -m unittest test_protocol.py test_recorder.py
```

## Grabación y replay

Con `--record` el bridge guarda cada paquete de tracking en JSONL. La grabación contiene protocolo, versión, secuencia, timestamp y datos de tracking/audio/captura.

Para reproducirla contra el avatar sin webcam:

```text
python replay.py recordings/session.jsonl
python replay.py recordings/session.jsonl --speed 0.5
python replay.py recordings/session.jsonl --speed 2.0
python replay.py recordings/session.jsonl --loop
```

Esto permite separar los bugs de cámara/tracking de los bugs de Godot o del avatar.

## Configuración

`config.json` controla cámara, FPS, smoothing, audio, captura de pantalla, OBS, grabación y host/puerto UDP de Godot.

MediaPipe es requisito para tracking real. mss, sounddevice y obsws-python son opcionales si sus funciones están desactivadas.

OBS es opt-in con `enable_obs=false` por defecto.

## Seguridad

El transporte por defecto es localhost. Godot valida protocolo, versión y secuencia y descarta paquetes viejos o inválidos.

El Web Host también valida el origen y la ventana iframe antes de aceptar mensajes del juego.

No guardar contraseñas reales de OBS en el repositorio.
