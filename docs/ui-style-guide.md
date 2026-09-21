# Guía visual de interfaz: Baseball Waifus

## Objetivo

La interfaz del juego debe leerse como un videojuego anime deportivo, no como una herramienta administrativa.

La información crítica siempre aparece primero:
1. estado de la jugada;
2. acción disponible;
3. timing;
4. marcador y cuenta;
5. contexto de jugadoras;
6. información secundaria.

## Lenguaje visual

- Fondo oscuro azul-violeta para separar la interfaz del campo.
- Dorado para momentos de premio, timing y elementos importantes.
- Rosa para acciones de bateo y estados de peligro.
- Azul claro para información técnica y estado neutral.
- Verde para estados activos, éxito y conexión.
- Bordes redondeados y sombras suaves.
- Texto grande para acciones que se pueden tocar.
- Etiquetas pequeñas para información secundaria.

## HUD del partido

El HUD actual utiliza:
- marcador superior;
- inning y mitad;
- outs, strikes y balls;
- bases;
- bateadora y pitcher;
- mensaje contextual;
- rail visual de timing;
- tarjeta de resultado.

El campo no debe taparse innecesariamente. El HUD utiliza transparencias y franjas periféricas.

## Controles móviles

Los controles deben:
- ocupar zonas grandes;
- tener jerarquía clara;
- evitar texto técnico;
- mostrar BATEAR y ROBAR como acciones directas;
- responder visualmente al estado disabled/enabled;
- mantener vibración háptica cuando la plataforma la soporte.

## Panel de streaming

El Control Center usa el mismo lenguaje visual, pero puede mostrar más información porque es una herramienta de desarrollo.

Debe mostrar inmediatamente:
- tracking activo;
- proveedor;
- edad del frame;
- FPS;
- OBS;
- grabación;
- destino Godot;
- QA.

Las acciones de grabación y QA están separadas visualmente de los diagnósticos.

## Assets

assets/ui/baseball_waifus_icon.svg es un asset vectorial original del repositorio. Se utiliza como icono reutilizable sin depender de imágenes externas.

Las futuras imágenes provenientes de terceros deben conservarse fuera del runtime hasta verificar su licencia y derechos de redistribución.

## Regla de continuidad

Las nuevas pantallas deben reutilizar el lenguaje visual existente antes de crear un estilo independiente. Los sistemas funcionales y contratos de gameplay no deben depender del aspecto visual.