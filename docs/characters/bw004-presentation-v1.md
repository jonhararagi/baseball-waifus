# bw004: Yuna Minase, presentación visual v1

## Alcance

Esta revisión trabaja exclusivamente la unidad visual de bw004 / Yuna Minase. No modifica estadísticas canónicas, gameplay, resolvers, IA rival, economía, recompensas ni gacha.

## Identidad canónica

- ID: bw004
- Nombre: Yuna Minase
- Rareza: SSR
- Elemento: Nature
- Posición: CF
- Especialidad: Runner
- Arquetipo visual: atlética, exterior, alegre, orientada a velocidad.
- Paleta principal: verde bosque, verde hoja, blanco crema y piel cálida.
- Cabello: largo verde profundo.
- Silueta: atlética y ligera.
- Uniforme: base crema con acento verde.

La presentación obtiene los datos del catálogo canónico. La apariencia no deriva estadísticas ni probabilidades.

## Estados expresivos

Se mantienen exactamente los cinco estados del contrato global:

- neutral: seguridad relajada.
- happy: energía social y alegría abierta.
- focused: concentración competitiva antes de arrancar.
- surprised: reacción instantánea ante una situación inesperada.
- disappointed: frustración contenida después de una mala lectura.

Cada estado es un SVG independiente y sin texto embebido. Esto conserva el contrato de CharacterExpressionController y permite sustituir posteriormente cada retrato por arte final sin tocar gameplay.

## Arquitectura

CharacterArchetypeCatalog
→ CharacterExpressionController
→ BaseballCharacterCard
→ TextureRect

La escena de QA reutiliza la misma tarjeta y además muestra los cinco estados en paralelo para detectar rápidamente diferencias de assets.

## QA visual headless

La escena scenes/bw004_character_presentation_test.tscn ejecuta aserciones de datos y assets.

game/ui/visual_qa_exporter.gd se activa únicamente con --run-qa-capture, espera a que la escena se estabilice y captura el viewport a:

res://qa_captures/bw004_character_presentation.png

El workflow CI correspondiente publica esa captura como artefacto.

## Rendimiento Android

- SVG propio y compacto, sin fuentes embebidas.
- Cinco assets independientes para el contrato facial.
- Un único TextureRect en la tarjeta principal.
- Los thumbnails de QA existen solamente dentro de la escena de prueba.
- La expresión no escribe PlayerData ni crea nodos de gameplay.
- La arquitectura permite reemplazar SVG por texturas importadas comprimidas cuando se produzca el arte final Android.

## Criterio de continuidad

bw004 se produce de forma aislada. No se generan assets de bw005 ni se modifica el pipeline global de las otras 29 personajes en esta revisión.
