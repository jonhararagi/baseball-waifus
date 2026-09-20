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
python main.py --synthetic-tracking --no-audio --no-screen --no-obs --max-packets 120
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

## Panel local de control

El bridge puede iniciar un panel local en `http://127.0.0.1:8787/`.

El panel muestra tracking, FPS, sequence, audio, OBS y estado de grabación. También permite iniciar/detener la grabación JSONL sin reiniciar el bridge.

El panel escucha solo en localhost por diseño. `healthcheck.py` comprueba el puerto configurado.

Para apagarlo:

```text
python main.py --no-control
```


## Tracking sintético para QA

Para probar el bridge completo sin webcam ni MediaPipe:

```text
python main.py --synthetic-tracking --no-audio --no-screen --no-obs --no-control --max-packets 120
```

El modo sintético genera yaw, pitch, roll, blink y mouth deterministas de forma continua y utiliza exactamente el mismo protocolo UDP que el tracking real. No reemplaza MediaPipe para producción; existe para probar transporte, recorder, dashboard y receptor de avatar sin hardware.

También puede activarse en `config.json` mediante `enable_synthetic_tracking: true`.

`--max-packets N` permite ejecutar una sesión finita para automatización y CI local.
