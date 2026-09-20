# Arquitectura de Streaming y Avatar

## Objetivo

Crear una herramienta local y modular para probar personajes de Baseball Waifus como avatares animados y conectarlos posteriormente a OBS Studio.

## Capas

1. Captura: OpenCV para webcam, sounddevice para nivel de audio y OBS para captura/mezcla/emisión final.
2. Tracking: MediaPipe Face Mesh. Salida normalizada: yaw, pitch, roll, blink, mouth.
3. Transporte: UDP localhost con JSON pequeño por frame.
4. Avatar: Godot 2D procedural con perfil separado del render y poses idle, walk, run, bat, pitch, catch, celebrate, hit reaction.
5. OBS: obsws-python / OBS WebSocket para control opcional de escena.

## Decisión de diseño

El personaje no depende del tracker. Recibe un contrato de datos y puede sustituirse por sprite 2D, rig 2D, Live2D, VRM/Three.js o un modelo 3D propio.

## Sistema de diseño anime implementado

Se implementó un diseñador corporal procedural 2D como primer sistema de prueba, sin assets propietarios.

Parámetros actuales:
- altura;
- ancho de hombros;
- cintura;
- cadera;
- busto;
- escala de cabeza;
- piel;
- cabello;
- uniforme;
- acento;
- estilo de cabello.

El cuerpo se dibuja con primitivas y se anima con poses. Es una base técnica, no el arte final.

## Referencias externas investigadas

OpenSeeFace documenta un patrón de tracking por webcam que transmite datos por UDP. VRM/three-vrm queda como ruta futura para una representación 3D.

## Próxima evolución

- spritesheets o rig 2D artístico;
- capas intercambiables de cabello/ropa/equipamiento;
- expresiones;
- físicas secundarias de pelo/ropa;
- importación opcional de VRM;
- integración directa del avatar con jugadores del roster.
