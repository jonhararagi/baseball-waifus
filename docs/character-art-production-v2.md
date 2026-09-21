# Baseball Waifus · Producción visual 2D/3D v2

## Objetivo

El proyecto mantiene dos presentaciones del mismo personaje:

- **2D animado:** fichas, roster, colección y escenas de presentación. El renderer procedural `AnimeAvatar2D` ya dispone de locomoción y poses de béisbol.
- **3D anime estilizado:** gameplay de campo. El backend procedural `Pixel3DBaseballCharacter` representa ahora cabeza, cabello, ojos, uniforme, falda, brazos articulados, piernas, calzado, bate y gorra cuando corresponde.

Ambos consumen `AvatarProfile`. Ninguno tiene autoridad sobre gameplay.

## Generación 2D

`tools/character_ai/generate_svg_roster.py` produce los retratos SVG base.

`tools/character_ai/generate_motion_svg_roster.py` produce, de forma determinista, una hoja SVG de cuatro frames por personaje:

1. IDLE
2. READY
3. SWING
4. RUN

La fuente sigue siendo exclusivamente:

`game/characters/character_archetypes.json`

Esto permite crear una biblioteca inicial consistente sin depender de un checkpoint externo. Las hojas son arte de prototipo y pueden sustituirse posteriormente por PNG/WebP, sprite sheets o un rig 2D profesional.

## Presentación 2D

`scenes/character_art_motion_test.tscn` recorre los 30 personajes del catálogo y alterna automáticamente poses de béisbol. Sirve como banco visual de coherencia del roster.

La escena no modifica `PlayerData`, estadísticas, rareza ni probabilidades.

## Generación 3D

El modelo procedural 3D usa geometría propia de Godot:

- cápsulas para extremidades;
- esfera para cabeza;
- masa de cabello;
- ojos separados;
- cono/cilindro para uniforme/falda y bate;
- calzado;
- gorra;
- ponytail/twin-tail cuando el perfil lo solicita.

La iluminación del stage se mantiene en la capa de presentación. Los payloads de trayectoria pueden proporcionar origen, destino y duración de una pelota.

## Estilo

La dirección visual busca anime deportivo adulto, siluetas heroicas legibles, anatomía estilizada, variedad corporal, cabello diferenciado, uniformes deportivos y expresiones claras.

Las referencias a otros juegos sirven únicamente para estudiar objetivos de presentación. No se copian personajes, modelos, texturas, rigs ni código propietario.

## Flujo

`character_archetypes.json`
→ `CharacterArchetypeCatalog`
→ `PlayerData / AvatarProfile`
→ `{ 2D animated renderer | 3D gameplay renderer }`

La generación de arte queda fuera de la resolución del béisbol.

## Estado

Hecho:
- roster de 30;
- SVG base;
- generador 2D de motion sheets;
- preview animado de los 30;
- backend 3D procedural enriquecido;
- iluminación de prueba;
- contrato común `AvatarProfile`.

Pendiente:
- retratos anime de producción;
- expresiones y poses individuales de alta calidad;
- sprite/rig final;
- modelos 3D con materiales/texturas de producción;
- rigging y clips de producción;
- integración visual completa del renderer 3D con todos los eventos del partido;
- revisión final de licencias para cualquier asset externo.
