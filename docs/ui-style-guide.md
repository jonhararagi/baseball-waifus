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

## Presentación del Hub v1.1

El Hub incorpora una composición por capas:
- fondo vectorial original de estadio;
- barra superior de identidad;
- tarjeta principal de personaje;
- marco de rareza/identidad reutilizable;
- accesos de navegación como tarjetas táctiles;
- paneles internos con entrada/salida animada.

El mapa de campaña incorpora fondo vectorial original, ruta de progreso, nodos de actividad, estados bloqueados y tarjeta de Demon King. Las microanimaciones de hover son únicamente presentación y no modifican estado de gameplay.

La dirección artística busca cuidado perceptible antes que volumen artificial: cada asset puede reemplazarse posteriormente por ilustración final manteniendo los mismos contratos de datos.


## Tarjetas de personaje v1.0

La tarjeta de personaje es un componente reutilizable (game/ui/character_card.gd) y no una composición específica del Hub.

La rareza tiene una identidad visual explícita y separada:
- R: marco gris/plata, contraste sobrio.
- SR: azul claro.
- SSR: violeta.
- UR: dorado.

La rareza cambia presentación, no estadísticas ni resultados de béisbol.

Cada tarjeta presenta:
- retrato reemplazable;
- rareza;
- posición;
- elemento;
- especialización;
- identidad de juego;
- estadísticas resumidas;
- espacio opcional para comentario contextual.

El retrato se carga desde el ID de personaje y puede sustituirse posteriormente por arte final sin cambiar el contrato del componente.

La entrada de la tarjeta utiliza una microanimación de opacidad y escala. Es presentación pura y no modifica PlayerData, probabilidades ni estado de partido.

Regla de producción: primero se valida la tarjeta y su jerarquía visual con un personaje; después se escala al resto del roster. No se crean 30 variantes de UI manualmente.


## Tarjetas de personaje v1.0

La tarjeta de personaje es un componente reutilizable (game/ui/character_card.gd) y no una composición específica del Hub.

La rareza tiene una identidad visual explícita: R gris/plata, SR azul claro, SSR violeta y UR dorado. La rareza cambia presentación, no estadísticas ni resultados de béisbol.

Cada tarjeta presenta retrato reemplazable, rareza, posición, elemento, especialización, identidad de juego, estadísticas resumidas y espacio opcional para comentario contextual.

El retrato se carga desde el ID de personaje y puede sustituirse por arte final sin cambiar el contrato del componente. La entrada utiliza una microanimación de opacidad y escala, exclusivamente visual.

Regla de producción: primero se valida la tarjeta con un personaje; después se escala al roster. No se crean 30 variantes manuales.
