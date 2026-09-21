# bw009 Rika Moriyama: presentación visual v1

## Identidad canónica

La unidad consume exclusivamente la entrada canónica de `bw009` en `game/characters/character_archetypes.json`.

- Nombre: Rika Moriyama
- Rareza: SR
- Posición: LF
- Elemento: Nature
- Especialización: Runner
- Potencial: 4
- Stats: Power 59, Contact 70, Speed 90, Pitch 50, Control 60, Defense 77, Critical 9, Stamina 75.
- Arquetipo: `earthy_runner_prankster`
- Play identity: `first_to_third_pressure`
- Acción de firma: `lead_feint`
- Skill roles: `power_up`, `statistic`

## Dirección visual

Rika se presenta como una corredora adulta atlética, de estilo práctico y ligeramente juguetón. La paleta conserva exactamente la autoridad del catálogo:

- cabello: `#5a7044`
- acento Nature: `#4cae5f`
- ojos: `#344124`
- piel: `#c98c68`
- uniforme: `#f4f1da`

La ilustración vectorial utiliza un encuadre de busto/medio cuerpo, cabello largo verde oliva con cola lateral, uniforme deportivo claro y acentos Nature. Los detalles gráficos de velocidad y la postura se limitan a presentación y no representan un resultado de gameplay.

## Estados de expresión

Se implementan cinco assets independientes:

- `bw009_neutral.svg`: reposo atento.
- `bw009_happy.svg`: sonrisa abierta y energía positiva.
- `bw009_focused.svg`: mirada concentrada previa a una carrera.
- `bw009_surprised.svg`: sorpresa ante un cambio inesperado.
- `bw009_disappointed.svg`: frustración contenida después de una jugada desfavorable.

La diferencia entre estados está dibujada dentro de cada SVG. No se depende de texto, fuentes, imágenes raster externas ni referencias remotas.

## Contrato de presentación

La ruta se conserva:

`CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`

El controlador resuelve el asset por personaje y estado. La tarjeta solo presenta los datos y reproduce la transición visual. Ningún estado expresivo escribe en PlayerData, estadísticas, IA, RNG, economía o resultado de béisbol.

## Rendimiento y Android

- SVG autónomo.
- Sin `<text>`.
- Sin fuentes embebidas.
- Sin imágenes externas.
- Sin scripts dentro del SVG.
- Uso limitado de gradientes, trazados y formas simples.
- Tamaño lógico 512x768, apropiado para retratos de colección que posteriormente pueden rasterizarse a resolución objetivo.

## Visual QA

La escena `scenes/bw009_character_presentation_test.tscn` valida identidad canónica, paleta, stats, skill roles, acción de firma, los cinco paths y la diferenciación de contenido de los SVG.

Cuando se ejecuta con `--run-qa-capture`, `VisualQAExporter` guarda:

`qa_captures/bw009_character_presentation.png`

El workflow CI utiliza Godot 4.5.1-stable en headless y publica la captura como artifact.
