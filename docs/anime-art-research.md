# Investigación de arte anime y rigging

## Arquitectura elegida

Se mantienen separadas tres responsabilidades:

1. generación de referencias visuales;
2. cuerpo/runtime del juego;
3. rigging 2D/3D final.

Decisión vigente:

- ComfyUI: backend local opcional para concept art.
- AvatarProfile + AnimeAvatar2D: cuerpo/runtime estable para gameplay y pruebas.
- Inochi2D: candidato para rig 2D definitivo.
- VRM/Three.js: candidato para pipeline 3D futuro.

Esto evita que una decisión estética del generador rompa la lógica del jugador.

## Sistema de diseño implementado

El proyecto ya tiene un sistema procedural reutilizable que permite probar cuerpos y movimiento sin depender de assets externos:

- AvatarProfile guarda proporciones, cabello, rostro, uniforme y estilo.
- AnimeAvatar2D dibuja cuerpo, cabeza, cabello y equipamiento por capas.
- AvatarMotionController controla acciones de béisbol.
- AvatarTrajectoryController mueve jugadoras con trayectorias continuas.
- Character Creator permite editar y guardar perfiles.
- Avatar Motion Test prueba Bat, Pitch, Throw, Catch, Steal, Slide, Out, Win y Defeat.
- Fielding Play Test prueba ahora rebote, recogida y lanzamiento a primera.

El preset visual de referencia se mantiene como shonen_soft: adulto, deportivo, redondeado, con torso, caderas y muslos algo más llenos, sin anatomía infantil ni estética chibi.

## Familias de modelos candidatas

| Familia | Uso | Encaje con el proyecto |
|---|---|---|
| Animagine XL | referencias de personajes anime y hojas de diseño | bueno para establecer una base anime consistente |
| Illustrious XL | detalle anime, anatomía y variación de personaje | candidato fuerte para A/B de arte |
| NoobAI-XL | anime moderno y control por prompts/LoRA | candidato secundario |
| Pony/SDXL | ecosistema amplio de estilización anime | referencia secundaria, con revisión de licencia más estricta |

La búsqueda realizada mediante repositorios de GitHub sirve para localizar el ecosistema, no para declarar un ganador de popularidad o calidad. La web general no está disponible en esta sesión, así que no presento este inventario como ranking global actual.

## Pipeline de benchmark

tools/character_ai/benchmark_models.py usa:

- mismo perfil;
- misma seed base;
- mismo preset;
- checkpoint exacto instalado localmente;
- salida separada por modelo.

tools/character_ai/model_catalog.json centraliza las familias candidatas y las reglas de no redistribuir pesos.

Antes de usar un checkpoint en un producto comercial se debe comprobar su licencia exacta, versión, condiciones de uso y las licencias de sus LoRA o embeddings.

## Dirección visual de Baseball Waifus

Objetivo:

- anime adulto;
- shonen deportivo;
- cuerpos atléticos pero redondeados;
- proporciones heroicas;
- piernas y caderas con más volumen;
- expresividad alta;
- cel shading limpio;
- colores vivos;
- uniforme de béisbol reconocible;
- fanservice adulto moderado;
- siluetas legibles a escala de partido.

No se incorporan:

- CLAMP;
- Jujutsu Kaisen;
- chibi/super-deformed;
- anatomía infantil;
- imitación directa de una franquicia;
- fotorealismo como estilo base.

La referencia de Fairy Tail se trata como una dirección funcional de proporciones shonen redondeadas, no como una copia del estilo gráfico.

## Próximo salto de arte

Cuando llegue el arte/rig definitivo, se conserva el mismo AvatarProfile como contrato. El renderer procedural se reemplaza por un adaptador de rig, no se reescribe el gameplay.

## Herramientas abiertas de rigging

- ComfyUI para concept art local.
- Inochi Creator e Inochi2D para un camino 2D abierto.
- VRM/Three.js como camino 3D.

Fuentes de ecosistema consultadas:

- https://github.com/Comfy-Org/ComfyUI
- https://github.com/Inochi2D/inochi-creator
- https://github.com/Inochi2D/inochi2d

## Regla de licencias

El repositorio no redistribuye checkpoints, LoRA, modelos VRM ni arte de terceros.
## Revisión 17: sistema de cuerpo articulado

La investigación de rigging se aterriza en un backend que puede funcionar sin assets externos.

AnimeBodyRig2D usa el mismo AvatarProfile y construye una figura anime adulta mediante puntos articulares virtuales: pelvis, torso, cuello/cabeza, hombros, codos, manos, rodillas y pies.

Las extremidades se calculan desde la pose y la fase de locomoción. El resultado no pretende ser el arte final, sino un maniquí de gameplay con lectura de silueta y movimiento suficiente para validar altura y proporciones, carrera, robo, deslizamiento, bateo, lanzamiento, recepción, reacción y tracking facial.

Inochi2D aporta un camino 2D abierto y compatible con una futura arquitectura de puppet. three-vrm ofrece una ruta web/3D separada. En lugar de acoplar el juego a cualquiera de ellos ahora, el proyecto adopta una interfaz visual neutral y prueba primero el comportamiento con un cuerpo propio.

Licencias revisadas: Inochi Creator BSD-2-Clause; Inochi2D BSD-2-Clause; three-vrm MIT. La implementación de Baseball Waifus no redistribuye código ni assets de terceros consultados.

Ahora existen tres niveles útiles: procedural simple, procedural articulado y rig externo. El segundo nivel queda marcado como implementado en prototipo y no debe rediseñarse como un nuevo sistema mientras no aparezca una necesidad funcional concreta.
