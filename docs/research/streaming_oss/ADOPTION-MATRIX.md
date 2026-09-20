# Matriz de adopción

| Capacidad | Actual | Referencia OSS | Acción |
|---|---|---|---|
| Webcam | OpenCV | MediaPipe/OpenSeeFace | Mantener |
| Face tracking | MediaPipe | OpenSeeFace como alternativa | Mantener MediaPipe + adapter futuro |
| UDP tracking | JSON/UDP | OpenSeeFace | Mantener |
| Audio | sounddevice | patrón de captura local | Mantener |
| Screen diagnostics | mss | captura modular | Mantener |
| OBS control | obsws-python | OBS WebSocket | Mantener |
| Recorder | JSONL propio | replay determinista | Mantener |
| QA | unittest + QARunner | pruebas offline | Mantener |
| Avatar 2D | procedural propio | Inochi2D | Mantener y añadir backend futuro |
| Avatar 3D | no definitivo | three-vrm | Adapter futuro |
| Desktop UI | dashboard HTML local | patrón control-plane | Mantener |
| Mobile streaming | no runtime final | TBD | Pendiente |

## Orden de implementación posterior

1. Fórmulas definitivas del béisbol.
2. Validación hardware del bridge.
3. Calibración facial y expresiones.
4. Renderer 2D artístico intercambiable.
5. Backend VRM/Three.js experimental.
6. Compositor avanzado solo si OBS deja de ser suficiente.

No se implementará un compositor propio mientras OBS cubra las necesidades.
