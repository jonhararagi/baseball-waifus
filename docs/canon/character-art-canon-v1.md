# Baseball Waifus · Canon de Arte de Personajes v1

**Estado:** CANÓNICO  
**Fecha de consolidación:** 2026-09-21  
**Fuente primaria de identidad:** `game/characters/character_archetypes.json`

Este documento consolida las decisiones de arte registradas durante las revisiones 26, 27 y 29. Su objetivo es que futuras sesiones no vuelvan a interpretar como nuevas decisiones aquellas que ya fueron establecidas.

## 1. Autoridad y continuidad

El orden de autoridad es:

1. `game/characters/character_archetypes.json`
2. `game/characters/character_archetype_catalog.gd` y `AvatarProfile` para la representación técnica.
3. Este documento para dirección artística y reglas de producción.
4. `docs/baseball-waifus-visual-guide.md` como referencia visual general.
5. Assets generados en `assets/characters/generated/` como prototipos reemplazables.

Una ilustración nunca puede modificar gameplay.

Las siguientes propiedades pertenecen al catálogo de personaje y no deben inferirse de una imagen:
- nombre;
- rareza;
- elemento;
- posición;
- especialización;
- estadísticas;
- potencial.

## 2. Roster canónico

El roster inicial contiene **30 personajes adultos** con IDs `bw001` a `bw030`.

El catálogo contiene:
- rarezas R / SR / SSR / UR;
- siete elementos;
- posiciones del roster;
- seis especializaciones;
- ocho estadísticas;
- presets corporales;
- rostro;
- piel;
- cabello;
- uniforme;
- ojos;
- color de acento.

La distribución y valores concretos se mantienen exclusivamente en el JSON. No duplicarlos en documentación artística para evitar divergencias.

## 3. Regla de variantes

Las plantillas base permanecen estables.

Una variante visual de un personaje solo puede modificar:

1. `hair_color`
2. `hair_style`
3. `body_scale`

La escala corporal global está limitada a **0.94–1.06**.

Una variante no puede alterar:
- rostro base;
- tono de piel;
- uniforme base;
- rareza;
- elemento;
- posición;
- especialización;
- estadísticas;
- potencial.

## 4. Lenguaje visual canónico

La dirección debe mantener:

- mujeres adultas;
- anime deportivo original;
- siluetas legibles de jugadoras de béisbol;
- diversidad corporal entre personajes;
- variedad de alturas y complexiones;
- cabello y colores diferenciados;
- cel shading limpio;
- colores vivos;
- expresiones claramente diferenciables;
- uniformes deportivos;
- presentación orientada a colección.

Debe evitarse:
- proporción chibi;
- apariencia infantil;
- diseños que contradigan la condición adulta;
- convertir la rareza en una regla visual rígida;
- utilizar una ilustración accidental como nueva identidad canónica.

La estética puede incorporar vestuarios temáticos para personajes adultos, pero la apariencia no determina sus estadísticas ni su rendimiento.

## 5. Guía visual

`assets/art_reference/baseball_waifus_visual_guide.svg` es el ancla visual general del proyecto.

La lámina define lenguaje, no identidades individuales.

Los diseños espontáneos que aparezcan en ella no son automáticamente personajes canónicos.

## 6. Pipeline canónico

El flujo oficial es:

`CharacterArchetypeCatalog → PlayerData / AvatarProfile → variante autorizada → prompt → generación → revisión de asset → renderer`

La generación artística es una capa de producción de contenido. No participa en la resolución del béisbol.

Para prototipos reproducibles:

`game/characters/character_archetypes.json → tools/character_ai/generate_svg_roster.py → assets/characters/generated/`

El inventario de assets está en:

`assets/characters/generated/manifest.json`

## 7. Assets actualmente generados

Los 30 IDs del roster tienen un SVG procedural de prototipo en:

`assets/characters/generated/bw001.svg` ... `bw030.svg`

Estos archivos son **arte de prototipo**, no el arte anime final.

Su propósito es:
- dar un asset visual a cada entrada del roster;
- permitir pruebas de carga/render;
- mantener el pipeline libre de dependencias externas;
- permitir reemplazo posterior por PNG, WebP, sprite sheet o rig 2D compatible.

No deben editarse manualmente para cambiar datos del personaje.

## 8. Herramienta reproducible

`tools/character_ai/generate_svg_roster.py` genera los 30 SVG desde el catálogo.

La herramienta no inventa estadísticas ni identidad. Solo transforma datos visuales existentes en un recurso vectorial.

Los futuros generadores de retratos deben conservar esta misma separación:
- datos del personaje primero;
- arte después.

## 9. Generación de arte anime

El arte final puede producirse mediante herramientas de generación compatibles con el proyecto, además de herramientas auxiliares propias para prompts, validación y organización.

El pipeline debe conservar:
- identidad tomada del JSON;
- restricciones de variantes;
- condición adulta;
- coherencia visual del roster;
- separación entre gameplay y arte.

No se incorpora automáticamente al repositorio arte de terceros ni recursos con derechos inciertos.

Cuando un proveedor/modelo tenga condiciones específicas de uso o redistribución, estas deben comprobarse antes de marcar el asset como producción.

## 10. Estado de producción

**Canónico y hecho:**
- roster base de 30;
- dirección visual general;
- reglas de variantes;
- pipeline de generación;
- manifest de assets;
- 30 assets SVG de prototipo.

**En desarrollo:**
- retratos anime individuales de producción;
- expresiones;
- poses específicas de béisbol;
- sprites/rig final;
- animaciones particulares;
- iconografía de roster;
- arte final de uniformes y equipamiento.

**Pendiente:**
- selección de assets finales redistribuibles;
- integración visual completa del roster en todas las pantallas;
- revisión de consistencia final personaje por personaje.

## 11. Historial consolidado

### Revisión 26
Se creó el roster de 30 personajes y el pipeline de arte basado en `character_archetypes.json`.

### Revisión 27
Se estableció la lámina `baseball_waifus_visual_guide.svg` como ancla visual general, sin convertir sus accidentes visuales en canon.

### Revisión 29
Se incorporaron 30 SVG procedurales de prototipo, el generador reproducible y su manifest.

Este documento consolida esas decisiones. Las entradas originales de `docs/bitacora.md` se conservan como historial y no deben eliminarse.

## 12. Regla final de continuidad

Si una futura idea artística contradice este documento o `character_archetypes.json`, debe tratarse como **propuesta**, no como canon, hasta que se registre una revisión explícita.

Nunca crear un segundo catálogo de personajes ni una segunda fuente de verdad visual.


## 13. Separación 2D de ficha y modelo 3D de gameplay

A partir de esta revisión se establece una frontera visual adicional:

- El arte 2D plano de colección se utiliza para **fichas, cartas, roster, inventario y pantallas de personaje**.
- Ese arte 2D no representa el modelo corporal utilizado durante el partido.
- El gameplay de campo utiliza un **modelo 3D pixel/low-poly procedural** preparado para animación.
- El modelo 3D recibe el mismo PlayerData y AvatarProfile, por lo que conserva identidad, proporciones y equipamiento sin duplicar la lógica de gameplay.
- Pitch, swing, follow-through, catch, throw, run, slide, celebration y defeat se representan mediante el controlador 3D.
- El cambio de renderer 2D a 3D no modifica estadísticas, probabilidades, resultados ni eventos del partido.

Pipeline visual actualizado:

PlayerData -> PlayerAvatarAdapter -> AvatarProfile -> { 2D Card Renderer | Pixel 3D Gameplay Renderer }

El arte 2D y el modelo 3D son dos representaciones del mismo personaje, no dos fuentes de identidad.
