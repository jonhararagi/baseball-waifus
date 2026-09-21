# bw002: Reina Kurose, presentación visual v1

## Alcance

Esta revisión trabaja exclusivamente la unidad visual de bw002 sin modificar gameplay, estadísticas, rareza, habilidades ni progresión.

## Identidad visual canónica

- ID: bw002
- Nombre: Reina Kurose
- Rareza: SSR
- Elemento: Ice
- Posición: P
- Especialidad: Pitcher
- Arquetipo visual: refinada, técnica y controlada.
- Paleta principal: azul petróleo, azul hielo, blanco frío y piel cálida.
- Silueta: complexión atlética estilizada, proporción alta y postura controlada.
- Cabello: oscuro azul petróleo, largo y estructurado.
- Uniforme: deportivo limpio con acento azul hielo.

Estos datos derivan del catálogo canónico de personajes. La presentación no los transforma en estadísticas adicionales.

## Estados expresivos

Se producen los cinco estados establecidos por CharacterExpressionController:

- neutral: mirada estable y postura serena.
- happy: sonrisa abierta y ojos más luminosos.
- focused: cejas tensas y mirada concentrada.
- surprised: ojos abiertos y reacción inmediata.
- disappointed: mirada baja y gesto contenido.

Cada SVG conserva la misma identidad visual base y cambia solamente la lectura facial y pequeños acentos de reacción.

## Arquitectura

CharacterArchetypeCatalog
→ CharacterExpressionController
→ BaseballCharacterCard
→ TextureRect

Los assets se resuelven por ID + expresión. No se guardan en PlayerData ni en CharacterRosterStore.

## Rendimiento

- SVG propio y liviano.
- Sin fuentes embebidas ni texto dentro del SVG.
- Cinco assets por personaje como máximo para la primera capa facial.
- La tarjeta mantiene el retrato como un único TextureRect.
- El cambio de expresión reutiliza el tween existente y no reconstruye la tarjeta.

## QA

scenes/bw002_character_presentation_test.gd verifica:
- identidad canónica;
- rareza/elemento/posición/especialización;
- existencia de los cinco assets;
- tamaño mínimo de asset;
- ausencia de <text>;
- continuidad de la paleta;
- diferenciación entre estados;
- resolución determinista de rutas;
- compatibilidad con la API de BaseballCharacterCard.

## Regla de continuidad

bw002 queda como una unidad cerrada antes de comenzar bw003. No se generan expresiones masivas ni se modifica el resto del roster en esta revisión.
