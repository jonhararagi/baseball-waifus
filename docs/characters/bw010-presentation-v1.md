# bw010 Mei Kanzaki: presentación visual v1

## Identidad canónica

La unidad consume exclusivamente la entrada canónica de `bw010` en `game/characters/character_archetypes.json`. No se crea una segunda fuente de verdad.

- Nombre: Mei Kanzaki
- Rareza: SSR
- Posición: DH
- Elemento: Lightning
- Especialización: Pitcher
- Potencial: 5
- Stats: Power 49, Contact 56, Speed 61, Pitch 79, Control 84, Defense 65, Critical 14, Stamina 82.
- Arquetipo: `lightning_precision_pitcher`
- Play identity: `count_trap`
- Acción de firma: `count_trap`
- Skill roles: `power_down`, `combination`

## Paleta canónica

- Cabello: `#60406e`
- Acento Lightning: `#f6d447`
- Ojos: `#473153`
- Piel: `#efc2a0`
- Uniforme: `#f5efff`

La presentación usa una silueta adulta delgada y un rostro de rasgos definidos. El lenguaje visual combina violeta profundo con dorado eléctrico para reforzar su identidad de pitcher técnico sin convertir la apariencia en una estadística.

## Estados de expresión

Se implementan cinco SVG independientes:

- `bw010_neutral.svg`: concentración serena antes del lanzamiento.
- `bw010_happy.svg`: satisfacción contenida cuando el plan funciona.
- `bw010_focused.svg`: máxima atención, mirada estrecha y postura visual más tensa.
- `bw010_surprised.svg`: reacción clara ante un resultado inesperado.
- `bw010_disappointed.svg`: frustración controlada después de que el plan falla.

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

La escena `scenes/bw010_character_presentation_test.tscn` valida identidad, estadísticas, skill roles, acción de firma, paleta, existencia, autonomía y diferenciación de los cinco SVG.

Cuando se ejecuta con `--run-qa-capture`, `VisualQAExporter` guarda:

`qa_captures/bw010_character_presentation.png`

El workflow `.github/workflows/visual_qa.yml` ejecuta Godot 4.5.1-stable en modo headless, captura la escena y publica la PNG como artifact.

**Runtime local:** no disponible en este entorno. No se registra como prueba runtime local; la validación headless real queda delegada a GitHub Actions.

