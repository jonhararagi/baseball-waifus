# bw011 Hina Sakuragi: presentación visual v1

## Identidad canónica

La unidad consume exclusivamente la entrada canónica de `bw011` en `game/characters/character_archetypes.json`. No se crea una segunda fuente de verdad.

- Nombre: Hina Sakuragi
- Rareza: R
- Posición: C
- Elemento: Light
- Especialización: Catcher
- Potencial: 3
- Stats: Power 61, Contact 60, Speed 52, Pitch 59, Control 62, Defense 82, Critical 8, Stamina 78.
- Arquetipo: `gentle_light_catcher`
- Play identity: `sacrifice_support`
- Acción de firma: ninguna en el catálogo actual
- Skill roles: `defense`, `power_up`

## Paleta canónica

- Cabello: `#8a5a76`
- Acento Light: `#f4ed9b`
- Ojos: `#5b3b4e`
- Piel: `#f6d1b2`
- Uniforme: `#fff5ed`

La dirección visual mantiene una silueta adulta equilibrada y un rostro suave. El contraste ciruela, crema y dorado pálido identifica a Hina como catcher de elemento Light sin inferir estadísticas desde su apariencia.

## Estados de expresión

Se implementan cinco SVG independientes:

- `bw011_neutral.svg`: calma amable antes de recibir el lanzamiento.
- `bw011_happy.svg`: sonrisa cálida cuando el equipo ejecuta el plan.
- `bw011_focused.svg`: atención serena y mirada más estrecha detrás del home.
- `bw011_surprised.svg`: sorpresa clara ante una jugada inesperada.
- `bw011_disappointed.svg`: preocupación y frustración contenida después de un error.

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

La escena `scenes/bw011_character_presentation_test.tscn` valida identidad, estadísticas, skill roles, paleta, existencia, autonomía y diferenciación de los cinco SVG.

Cuando se ejecuta con `--run-qa-capture`, `VisualQAExporter` guarda:

`qa_captures/bw011_character_presentation.png`

El workflow `.github/workflows/visual_qa.yml` ejecuta Godot 4.5.1-stable en modo headless, captura la escena y publica la PNG como artifact.

**Runtime local:** no disponible en este entorno. No se registra como prueba runtime local; la validación headless real queda delegada a GitHub Actions.
