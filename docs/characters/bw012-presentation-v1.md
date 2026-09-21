# bw012 Sayu Kisaragi: presentación visual v1

## Identidad canónica

La unidad consume exclusivamente la entrada canónica de `bw012` en `game/characters/character_archetypes.json`. No se crea una segunda fuente de verdad ni se modifican sus atributos.

- Nombre: Sayu Kisaragi
- Rareza: SR
- Posición: SS
- Elemento: Nature
- Especialización: Defender
- Potencial: 4
- Stats: Power 58, Contact 67, Speed 70, Pitch 52, Control 59, Defense 84, Critical 11, Stamina 80.
- Arquetipo: `quiet_nature_defender`
- Play identity: `coverage_anchor`
- Acción de firma: `coverage_switch`
- Skill roles: `defense`, `combination`

## Paleta canónica

- Cabello: `#31513f`
- Acento Nature: `#4cae5f`
- Ojos: `#22392a`
- Piel: `#d59a78`
- Uniforme: `#eef7e4`

La dirección visual presenta a Sayu como una defensora adulta reservada y práctica. El lenguaje visual usa verdes de bosque, crema vegetal y un acento vivo para distinguir Nature sin convertir el elemento en un sistema de daño ni derivar estadísticas de la apariencia.

## Estados de expresión

Se implementan cinco SVG independientes:

- `bw012_neutral.svg`: calma reservada antes de la siguiente jugada.
- `bw012_happy.svg`: sonrisa abierta después de una cobertura bien ejecutada.
- `bw012_focused.svg`: mirada estrecha y postura facial firme al leer una situación defensiva.
- `bw012_surprised.svg`: reacción clara ante un cambio inesperado de cobertura.
- `bw012_disappointed.svg`: frustración contenida tras llegar tarde o perder una cobertura.

Cada estado contiene geometría facial propia. No se reutiliza una textura raster ni se altera el gameplay para representar una emoción.

## Arquitectura de presentación

La cadena de autoridad permanece:

`CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`

`CharacterArchetypeCatalog` aporta identidad y datos canónicos. `CharacterExpressionController` resuelve exclusivamente la ruta de retrato según personaje y expresión. `BaseballCharacterCard` presenta los datos y ejecuta las transiciones visuales.

Ninguno de los tres componentes puede modificar estadísticas, RNG, economía, IA, equipamiento o resultado del partido.

## Rendimiento y Android

- SVG autónomo.
- Sin `<text>`.
- Sin fuentes embebidas.
- Sin `http://`, `https://`, `href` ni recursos externos.
- Trazados y formas simples, sin scripts.
- ViewBox fijo de 512x768.
- Los assets pueden rasterizarse posteriormente en una resolución objetivo sin modificar el contrato de presentación.

## Visual QA

La escena `scenes/bw012_character_presentation_test.tscn` valida identidad, estadísticas, skill roles, acción de firma, paleta, existencia, autonomía y diferenciación de los cinco SVG.

Cuando se ejecuta con `--run-qa-capture`, `VisualQAExporter` guarda:

`qa_captures/bw012_character_presentation.png`

El workflow `.github/workflows/visual_qa.yml` ejecuta Godot 4.5.1-stable en modo headless, captura la escena y publica la PNG como artifact.

**Runtime local:** no está disponible en el entorno de edición actual; la validación runtime real se realiza mediante el job de GitHub Actions activado sobre `main`.
