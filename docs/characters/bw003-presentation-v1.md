# bw003: Miu Tachibana, presentación visual v1

## Alcance

Esta revisión trabaja exclusivamente la unidad visual de **bw003 / Miu Tachibana**. No modifica gameplay, estadísticas, rareza, habilidades, progresión, IA ni economía.

## Identidad canónica

- ID: `bw003`
- Nombre: Miu Tachibana
- Rareza: SR
- Elemento: Lightning
- Posición: SS
- Especialidad: Contact
- Arquetipo visual: enérgica, urbana, rápida de lectura y técnica.
- Paleta principal: marrón cálido, amarillo eléctrico, blanco crema y piel cálida.
- Silueta: equilibrada y deportiva, diferenciada de la pitcher refinada de bw002.
- Cabello: largo, marrón cálido.
- Uniforme: blanco crema con acento amarillo.

Los datos se obtienen del catálogo canónico. La presentación no deriva estadísticas desde la apariencia.

## Estados expresivos

Se mantienen exactamente los cinco estados del contrato global:

- **neutral:** seguridad relajada y lectura del turno.
- **happy:** sonrisa abierta y energía social.
- **focused:** cejas tensas y mirada analítica.
- **surprised:** ojos amplios y reacción instantánea.
- **disappointed:** gesto contenido tras una mala lectura.

Los cinco SVG comparten composición, silueta y paleta base. Cambian únicamente el lenguaje facial y pequeños acentos de energía para que la transición sea reconocible y estable.

## Arquitectura

`CharacterArchetypeCatalog`
→ `CharacterExpressionController`
→ `BaseballCharacterCard`
→ `TextureRect`

No se crea un controlador específico para bw003.

## Rendimiento Android

- SVG propio, sin fuentes embebidas.
- Cinco texturas vectoriales por personaje para la primera capa facial.
- El card mantiene un único TextureRect de retrato.
- La expresión no crea nodos adicionales ni altera PlayerData.
- El cambio facial utiliza el tween existente en la tarjeta.

## QA

`scenes/bw003_character_presentation_test.gd` verifica:

- existencia e identidad canónica de bw003;
- construcción de PlayerData;
- existencia de los cinco SVG;
- tamaño mínimo de cada asset;
- ausencia de `<text>`;
- continuidad de paleta;
- diferenciación real entre estados;
- resolución determinista de rutas;
- compatibilidad con la API de `BaseballCharacterCard`.

## Regla de continuidad

bw003 queda limitado a su propia unidad visual hasta disponer de validación runtime Godot. No se generan assets para bw004 y no se replica el pipeline a las demás personajes en esta revisión.
