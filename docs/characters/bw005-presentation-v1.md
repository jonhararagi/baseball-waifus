# bw005: Sora Amamiya, presentación visual v1

## Identidad canónica

- ID: `bw005`
- Nombre: Sora Amamiya
- Rareza: SR
- Elemento: Water
- Posición: C
- Especialidad: Catcher
- Potencial base: 4
- Estadísticas canónicas: se leen exclusivamente desde `game/characters/character_archetypes.json`
- Preset corporal: power
- Silueta: fuerte, protectora, de presencia física marcada
- Cabello: largo azul petróleo
- Uniforme: blanco frío con acento azul
- Ojos: azul profundo
- Arquetipo: commanding_water_catcher
- Identidad de juego: risk_manager
- Acción de firma: pitchout_read

La implementación visual no deriva estadísticas ni reglas de gameplay. La identidad se documenta para QA y dirección artística, pero la fuente de verdad continúa siendo el catálogo canónico.

## Dirección visual

Sora debe leerse como una catcher de presencia física y control emocional. La silueta utiliza el preset `power` existente, pero el retrato introduce señales propias del puesto de catcher: protección de torso/hombros, postura estable y mirada atenta.

La paleta se restringe a:
- cabello #263f78;
- acento Water/Catcher #3b82f6;
- ojos #243457;
- piel #e7b28e;
- uniforme #eff8ff.

## Expresiones

Se implementan exactamente los cinco estados globales:
- neutral;
- happy;
- focused;
- surprised;
- disappointed.

Cada uno es un SVG autónomo sin `<text>` ni fuentes embebidas. Los cambios se producen mediante `CharacterExpressionController` y `BaseballCharacterCard`.

## Rendimiento

- assets vectoriales propios y ligeros;
- sin dependencias externas;
- un único retrato activo en la tarjeta real;
- la tira de cinco retratos existe solamente en la escena QA;
- no se crean nodos de gameplay ni se escribe PlayerData;
- la futura sustitución por PNG/WebP/atlas no requiere cambiar el contrato visual.

## QA

`scenes/bw005_character_presentation_test.gd` valida catálogo, identidad, rutas, peso mínimo del SVG, ausencia de `<text>`, paleta y diferenciación entre estados.

`scenes/bw005_character_presentation_test.tscn` incorpora `VisualQAExporter` y genera:

`res://qa_captures/bw005_character_presentation.png`

La ejecución CI se realiza mediante `.github/workflows/visual_qa.yml`.
