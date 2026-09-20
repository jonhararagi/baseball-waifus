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

En Linux/macOS cambia la orden de activación de la venv según tu shell.

## Ejecución

```text
python main.py
python main.py --no-audio --no-screen --no-obs
python main.py --config config.json
```

Antes de conectar hardware:

```text
python healthcheck.py
```

## Configuración

config.json controla cámara, FPS, smoothing, audio, captura de pantalla, OBS y host/puerto UDP de Godot.

MediaPipe es requisito para tracking real. mss, sounddevice y obsws-python son opcionales si sus funciones están desactivadas.

OBS es opt-in con enable_obs=false por defecto. Los errores de conexión se muestran en el diagnóstico del proceso.

## Seguridad

El transporte por defecto es localhost. No se expone el tracking facial a Internet.

No guardar contraseñas reales de OBS en el repositorio.

## Referencias de arquitectura

OpenSeeFace se conserva como referencia histórica de tracking por webcam y transporte UDP. El prototipo utiliza MediaPipe directamente.

Para avatares externos, el contrato actual deja una ruta futura para Inochi2D, Live2D o VRM/Three.js sin mezclar SDKs con el gameplay.
