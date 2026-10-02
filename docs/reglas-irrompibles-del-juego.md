# BASEWARRIORS: META-STRIKE
## Reglas Irrompibles para el Juego

> Documento canónico de dirección creativa, visual y de presentación.
> Debe consultarse antes de introducir nuevas mecánicas, sistemas de combate, assets, cámaras, VFX o cambios de presentación.

## 1. Identidad fundamental

BaseWarriors: Meta-Strike es:

**ANIME HERO-COLLECTOR + COMBATE TÁCTICO 4V4 + IDENTIDAD BASEBALL + PRESENTACIÓN CINEMATOGRÁFICA 2.5D**

El personaje es el centro emocional del juego.

El baseball es parte de la identidad mecánica.

El combate es el espectáculo.

La colección, progresión y relación con los personajes son el vínculo de largo plazo.

La presentación visual debe hacer que cada personaje se sienta protagonista, no una unidad genérica dentro de una interfaz.

## 2. Regla visual principal: 2.5D

BaseWarriors utiliza una presentación **2.5D anime estilizada**.

No debe convertirse en un juego 3D semirrealista, un simulador de baseball, un RPG con personajes diminutos sobre un escenario ni una interfaz estática con ilustraciones decorativas.

La sensación buscada es la de un escenario con profundidad aparente construido con arte 2D, capas, cámara, perspectiva, paralaje, animaciones y VFX.

Objetivo:

**sensación de volumen sin abandonar la estética anime.**

## 3. Referencia de presentación de combate

Como referencia conceptual de puesta en escena puede estudiarse la presentación de personajes de **GODDESS OF VICTORY: NIKKE**, incluyendo la presentación de Tove: Baseball Fan.

La referencia sirve para estudiar la **gramática cinematográfica**, no para copiar diseños, personajes, modelos, animaciones, interfaz, efectos ni assets.

La idea transferible es:

**el personaje ocupa físicamente la escena y la cámara lo trata como protagonista.**

BaseWarriors debe reinterpretar esa filosofía con identidad propia:

**baseball + anime + 4V4 + 2.5D + espectáculo.**

## 4. Regla de protagonismo

Durante el combate, los personajes nunca deben sentirse como pequeños iconos colocados sobre un tablero.

La composición debe permitir percibir claramente:

- quién está atacando;
- quién está defendiendo;
- qué acción ocurre;
- quién recibió el impacto;
- qué resultado produjo;
- cómo reacciona el personaje;
- qué personalidad expresa.

Cada acción importante debe poder sentirse como una pequeña escena cinematográfica.

## 5. Composición del campo

La escena debe utilizar distancia y profundidad.

Composición conceptual:

```
FONDO / ARENA
    ↓
ENEMIGO / OBJETIVO A DISTANCIA
    ↓
PERSONAJE JUGABLE
    ↓
PARTES EN PRIMER PLANO / ARMA / VFX
    ↓
CÁMARA 2.5D
```

No todos los personajes tienen que utilizar la misma escala, posición o encuadre.

La cámara debe poder utilizar plano general, plano medio, primer plano, acercamiento, desplazamiento lateral, zoom, perspectiva y paralaje.

## 6. Regla de cámara

La cámara es parte de la presentación del combate.

No debe permanecer estática durante todos los turnos.

Patrón conceptual de una acción ofensiva:

```
PLANO DE COMBATE
    ↓
PRESENTACIÓN DEL PERSONAJE
    ↓
ACERCAMIENTO
    ↓
PREPARACIÓN
    ↓
ACCIÓN
    ↓
IMPACTO
    ↓
DESPLAZAMIENTO HACIA EL ENEMIGO
    ↓
DAÑO / REACCIÓN
    ↓
REGRESO AL PLANO DE COMBATE
```

La cámara debe comunicar la acción sin modificar las reglas del combate.

## 7. Regla de reacción del enemigo

El enemigo debe responder visualmente al resultado de la acción.

Pueden utilizarse reacción corporal, desplazamiento, hit-stop, camera shake, partículas, flashes, deformación, VFX de impacto, cambios de postura y expresiones.

La presentación debe hacer visible el resultado.

**La presentación nunca determina el resultado.**

El gameplay calcula primero. La presentación representa después.

## 8. Regla de separación entre gameplay y presentación

La arquitectura canónica es:

```
PLAYER DATA
    ↓
GAMEPLAY SYSTEMS
    ↓
BASEBALL / COMBAT RESULT
    ↓
DOMAIN EVENTS
    ↓
PRESENTATION
    ↓
UI / AVATAR / AUDIO / VFX / CAMERA
```

La presentación jamás debe decidir daño, HP, victoria, derrota, turnos, reglas tácticas, recompensas, resultados de baseball, progresión o economía.

La cámara, animación, avatar, audio y VFX representan hechos del dominio. No crean esos hechos.

## 9. Regla del personaje

Cada personaje debe sentirse como un individuo.

La presentación debe poder comunicar:

- personalidad;
- identidad;
- estilo;
- energía;
- actitud;
- rol;
- forma de atacar;
- forma de reaccionar;
- relación con el jugador.

Dos personajes con la misma función mecánica no deben sentirse visualmente intercambiables.

## 10. Regla del baseball

El baseball no es una decoración.

Debe permanecer reconocible dentro del lenguaje de combate.

Bateo, lanzamiento, pelota, swing, timing, posiciones, campo y lenguaje deportivo deben integrarse con la fantasía de combate.

Aunque la escala sea espectacular y los enemigos sean fantásticos, el jugador debe reconocer:

**esto sigue siendo baseball.**

## 11. Regla del espectáculo

Los ataques importantes pueden sentirse exagerados y anime.

Se permiten cámaras agresivas, impactos grandes, energía, líneas de velocidad, partículas, flashes, poses heroicas y VFX cinematográficos.

Pero el espectáculo nunca debe destruir la legibilidad.

El jugador siempre debe entender:

**quién hizo qué, contra quién y con qué resultado.**

## 12. Regla de profundidad 2.5D

La profundidad puede construirse mediante capas:

```
FONDO
↓
ESCENARIO
↓
ENEMIGO
↓
PERSONAJE
↓
PARTES DEL PERSONAJE
↓
ARMA / BATE
↓
VFX
↓
CÁMARA
```

La sensación tridimensional no requiere obligatoriamente un modelo 3D completo.

Se priorizan parallax, escala, perspectiva, separación de planos, entradas y salidas, movimiento de cámara y composición cinematográfica.

## 13. Regla de producción artística

Un asset de personaje es producción real solamente después de:

```
SOURCE
→ PHYSICAL FILE
→ VALIDATION
→ INTEGRATION
→ APPROVAL
→ RUNTIME PROOF
→ CI / DEPLOY PROOF
```

Thumbnail, preview, screenshot, SVG temporal, imagen de referencia o recurso visible en una plataforma externa no equivalen automáticamente a un asset de producción.

## 14. Regla de evolución

Cuando una implementación existente funciona:

**se mejora, no se reemplaza innecesariamente.**

Proceso:

```
INSPECT
→ REUSE
→ EXTEND
→ VALIDATE
```

No:

```
REBUILD
→ DUPLICATE
→ BREAK EXISTING FLOW
```

## 15. Regla de compatibilidad

La evolución visual nunca debe romper:

- combate táctico de 5 turnos;
- Timing Ring;
- progresión;
- colección;
- personajes;
- gacha;
- save state;
- eventos;
- economía;
- Telegram Mini App;
- Web;
- futura compatibilidad Windows;
- futura compatibilidad Android.

La capa visual debe poder evolucionar independientemente de las reglas fundamentales del juego.

## 16. Regla de personalidad

El juego debe mantener un equilibrio entre:

**épico + anime + tecnológico + deportivo + divertido + atractivo**

Los personajes pueden ser carismáticos, tiernos, absurdos, competitivos o intensos.

La estética puede incluir fanservice moderado cuando corresponda al personaje, sin convertir la identidad del juego en contenido sexual explícito.

El personaje debe seguir siendo un personaje primero.

## 17. Regla de presentación del combate

La experiencia ideal debe producir:

```
QUIERO CONTROLAR A ESTE PERSONAJE
        ↓
ESTÁ EN ESTE CAMPO
        ↓
ESTÁ ENFRENTANDO A ESE ENEMIGO
        ↓
REALIZA ESTA ACCIÓN
        ↓
VEO EL IMPACTO
        ↓
VEO LA REACCIÓN
        ↓
QUIERO VOLVER A USARLA
```

La presentación debe reforzar:

**PERSONAJE → ACCIÓN → RESULTADO → EMOCIÓN**

## 18. Regla suprema

BaseWarriors: Meta-Strike no debe convertirse en una copia de otro juego.

Puede estudiar referencias externas para aprender composición, ritmo y presentación, pero debe reconstruir esas ideas dentro de una identidad propia.

La fórmula permanente es:

**BASEBALL + ANIME + 4V4 + COLECCIÓN + TÁCTICA + 2.5D + ESPECTÁCULO**

El objetivo no es solamente tener personajes bonitos dentro del combate.

El objetivo es que el jugador vea un personaje y piense:

> **Quiero jugar con ella.**

Y cuando comienza el combate:

> **Quiero volver a verla hacer esto.**
