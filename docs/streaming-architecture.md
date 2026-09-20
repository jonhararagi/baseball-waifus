# Arquitectura de Streaming y Avatar

## Objetivo

Probar personajes de Baseball Waifus como avatares anime, reutilizar exactamente el mismo perfil visual dentro del juego y permitir una futura salida por OBS Studio sin acoplar OBS al núcleo del gameplay.

## Capas

1. **Captura**
   - `OpenCV` para webcam.
   - `sounddevice` para nivel de micrófono.
   - `mss` para captura de pantalla opcional de diagnóstico.
   - OBS continúa siendo el compositor, grabador y emisor principal.

2. **Tracking**
   - `MediaPipe Face Mesh`.
   - Salida normalizada: `yaw`, `pitch`, `roll`, `blink`, `mouth`.
   - Suavizado EMA configurable para reducir jitter.

3. **Protocolo**
   - UDP localhost.
   - JSON pequeño por frame.
   - Contrato versionado `baseball-waifus-tracking`, versión 1.
   - Se separan `tracking`, `audio` y `capture`.
   - El receptor Godot invalida el tracking cuando el stream queda obsoleto.

4. **Avatar**
   - `AvatarProfile` contiene los datos del personaje.
   - `AnimeAvatar2D` dibuja el cuerpo procedural.
   - Las poses son reutilizables: Idle, Walk, Run, Bat, Pitch, Catch, Celebrate, Hit Reaction.
   - El renderizador puede reemplazarse por sprites, rig 2D, Live2D, VRM/Three.js o un modelo 3D sin cambiar el perfil.

5. **Character Creator**
   - `scenes/character_creator.tscn`.
   - Presets de cuerpo: slim, balanced, athletic, curvy, power.
   - Cabello: long, short, bob, ponytail, twin_tail.
   - Uniforme: standard, sporty, jacket, sleeveless.
   - Rostro: soft, sharp, round.
   - Sliders de proporciones.
   - Selectores de color de piel, cabello, acento y ojos.
   - Gorra activable.
   - Generación aleatoria mediante seed.
   - Guardado/carga de perfiles JSON en `user://baseball_waifus/characters/`.

## Flujo

**Webcam → OpenCV → MediaPipe → tracker.py → protocol.py → UDP → TrackingReceiver → AnimeAvatar2D**

**Micrófono → sounddevice → AudioMeter → protocol.py → UDP → Godot**

**Pantalla opcional → mss → diagnóstico de resolución/captura**

**OBS Studio ↔ obsws-python ↔ Streaming Bridge**

OBS no recibe ni depende del protocolo de avatar para renderizar el juego. El bridge aporta tracking/telemetría y control opcional de escena.

## Sistema de diseño anime implementado

El creador actual es deliberadamente procedural. No intenta competir todavía con un pipeline artístico profesional de Live2D o VRM.

La finalidad de esta etapa es poder fabricar rápidamente "jugadoras de prueba" y comprobar:

- proporciones;
- siluetas;
- posiciones;
- poses de béisbol;
- reacción al tracking;
- lectura visual de uniformes;
- intercambio de cabello y colores;
- persistencia de datos.

El perfil está desacoplado del renderer para que una misma jugadora pueda pasar después a arte 2D definitivo, rigging o 3D.

## Investigación externa

Se revisaron patrones públicos de OpenSeeFace e Inochi2D como referencias de arquitectura. No se copió código ni assets de esos proyectos.

La ruta 3D futura puede apoyarse en VRM/Three.js cuando el juego necesite modelos 3D. La ruta 2D puede evolucionar a un rig artístico o Live2D si las licencias y necesidades de producción lo justifican.

## Estado

**Implementado:** bridge local, tracking facial, audio, captura de pantalla opcional, protocolo versionado, receptor UDP y creador anime procedural.

**Pendiente:** validación hardware end-to-end, rig artístico definitivo, Live2D/VRM, físicas secundarias, lip-sync avanzado, expresiones completas, compositor propio, grabación y conexión final con el roster.
