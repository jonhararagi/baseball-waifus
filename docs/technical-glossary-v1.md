# Glosario técnico y terminología oficial · Baseball Waifus v1

**Fecha:** 2026-09-21

Este documento normaliza términos para que código, documentación, UI y diseño no utilicen palabras distintas para la misma responsabilidad.

## Béisbol

| Término oficial | Significado en el proyecto |
|---|---|
| Pitch / lanzamiento | Acción del pitcher. El juego conserva tres tipos: FASTBALL, CURVE y SPECIAL. |
| Ball | Lanzamiento fuera de zona que cuenta como bola. Cuatro producen WALK. |
| Strike | Strike llamado o fallo de contacto según la regla correspondiente. |
| Foul | Batazo fuera de juego. Con dos strikes conserva el conteo en dos strikes. |
| Timing | Calidad de ejecución del bateo: PERFECT, GREAT, GOOD, NORMAL, BAD. |
| Contact | Probabilidad de conectar correctamente el lanzamiento. No significa automáticamente hit. |
| BattedBallEvent | Contrato de presentación de una pelota bateada ya resuelta por gameplay. |
| Single / Double / Triple / Home Run | Hits de 1, 2, 3 y 4 bases. |
| Fielding Candidate | Batazo que requiere resolución defensiva antes de decidir hit/out. |
| Fielding Error | Error defensivo de recepción o lanzamiento que cambia el resultado. |
| Force Out | Out producido por una obligación de avanzar del corredor. |
| Rundown | Situación en la que una corredora queda atrapada entre bases durante una acción defensiva. |
| Steal | Intento de avanzar una base antes/durante el lanzamiento. |
| Slide | Técnica visual y resolución asociada a llegar a una base durante una jugada. |
| Double Play | Dos outs producidos dentro de una misma secuencia defensiva. |

## Arquitectura

| Término | Uso |
|---|---|
| GameState | Estado autoritativo del partido: inning, outs, conteo, bases, runners, marcador y finalización. |
| Resolver | Sistema que convierte entradas de gameplay en un resultado determinista/probabilístico auditable. Ej.: FieldingResolver. |
| Event / evento | Datos del resultado que pueden consumir varios sistemas de presentación. |
| Presenter | Traduce eventos resueltos a movimiento/presentación sin decidir el resultado. |
| Renderer | Dibuja o anima una representación visual. No tiene autoridad sobre gameplay. |
| AvatarProfile | Contrato visual común derivado de PlayerData. |
| PlayerData | Datos de gameplay/progresión de una jugadora. |
| Archetype Catalog | Fuente de identidad base del roster. |
| Seed | Semilla utilizada para reproducir una secuencia pseudoaleatoria. |
| Rule Version | Identificador de la versión de una fórmula o resolver. |

## Colección y economía

| Término | Uso |
|---|---|
| Gacha | Sistema de obtención probabilística de personajes/equipamiento. |
| Pity | Contador/regla de garantía progresiva de un banner. Todavía pendiente de implementación. |
| Duplicate | Obtención repetida de una entidad ya poseída. Reglas pendientes. |
| Power Creep | Aumento progresivo de fuerza de contenido nuevo respecto del antiguo. Es un riesgo de balance, no una estadística. |
| Rarity | Rareza. El proyecto actual usa R, SR, SSR y UR. |
| Potential | Valor de potencial presente en PlayerData. Su fórmula exacta como modificador de gameplay todavía debe documentarse antes de convertirla en regla definitiva. |

## Corrección de nomenclatura

- **Gacha**, no “garcha”, en documentación técnica.
- **Bateadora**, **pitcher**, **corredora**, **defensora** y **catcher** son los términos de gameplay en español; los identificadores de código permanecen en inglés cuando ya están establecidos.
- **S** no es una rareza vigente. El catálogo oficial actual es **R / SR / SSR / UR**. Cualquier mención futura a “S-SR” debe interpretarse como una petición de personalidad para personajes **SR/SSR**, no como una nueva rareza, hasta que exista una decisión explícita que agregue S.
- **Renderer no resuelve** y **resolver no anima**.
- **Presentación no modifica estadísticas**.

## Regla de nombres de código

Los nuevos sistemas deben preferir nombres explícitos como:

`FieldingResolver`
`BaseballGameState`
`BattedBallEvent`
`AvatarProfile`
`CharmSystem`

Evitar nombres genéricos como `Manager`, `Helper`, `Controller2` o `SystemFinal` cuando oculten responsabilidades distintas.
