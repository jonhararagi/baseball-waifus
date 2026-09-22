# Audio Scavenger Stack Register

Estado del stack: **INVENTARIO / CANDIDATOS / SIN PROVEEDOR FINAL**

Este documento registra tecnologías de audio que pueden estudiarse para Baseball Waifus. Ninguna de las librerías candidatas queda fijada como dependencia de producción hasta completar medición de bundle, compatibilidad móvil, licencia, pruebas de escucha y decisión final de descarte/adopción.

## Contrato estable

La presentación utilizará una interfaz desacoplada:

`AudioBridge.play(soundId, options)`

El renderer no importa librerías de audio concretas. Un adapter opcional puede recibir el `soundId` y resolverlo a un proveedor real.

### Principios

- El gameplay no depende del audio.
- Un fallo de audio nunca altera un resultado de béisbol.
- Los IDs de sonido son datos de presentación, no reglas deportivas.
- Se puede sustituir el proveedor completo sin modificar resolvers, Game State ni DTOs de gameplay.
- Un bridge sin proveedor devuelve `false` y mantiene el juego funcional.
- Los candidatos no se incorporan automáticamente al bundle final.

## Registro de candidatos

| Tecnología / fuente | Peso estimado | Sonidos previstos | Complejidad | Estado |
|---|---:|---|---|---|
| Web Audio API nativa | ~0 KB externos | Bateo, impacto, UI, ambiente neón procedural | Baja-Media | Candidato principal para prototipos auditivos |
| HTML5 Audio / `Audio()` pool | ~0 KB externos | Voces Cut-In, impactos, ambiente pregrabado | Baja | Candidato de fallback |
| ZzFX / generador PCM compacto | ~2-6 KB de código, según build | Bateo, impacto, arcade, UI | Baja | Candidato, no integrado |
| jsfxr / port compacto | ~5-15 KB de código, según implementación | SFX 8-bit/arcade, impacto | Baja-Media | Candidato, no integrado |
| Tone.js | ~50-200+ KB según versión/build | Ambiente neón, synth, transiciones | Media-Alta | En evaluación, no adoptado |
| Repositorio externo de SFX 8-bit/arcade | Variable, normalmente cientos de KB a MB según lote | Bateo, impacto, crowd, UI | Media-Alta | Solo inventario hasta verificar licencia y peso |
| Voces/Clips extraídos de anime o fan works | Variable | Voces Cut-In / esfuerzo | Alta y riesgo legal | **No incorporar** sin derechos explícitos |

### Nota sobre pesos

Los tamaños son estimaciones preliminares y no equivalen al tamaño final de producción. Antes de adoptar cualquier candidato se debe medir el archivo real que entraría en `webapp`, su compresión, dependencia transitiva y memoria en WebView/Android.

## Taxonomía de eventos

Los IDs deberán permanecer semánticos y reemplazables:

- `bat.swing`
- `bat.contact`
- `ball.impact`
- `result.strike`
- `result.foul`
- `result.out`
- `result.hit`
- `result.home_run`
- `runner.steal`
- `ui.confirm`
- `ui.navigation`
- `cutin.open`
- `cutin.close`
- `voice.comment_01` ... `voice.comment_10`
- `ambience.stadium`
- `ambience.neon`

Estos nombres son un contrato de presentación. No representan resultados ni modificadores de gameplay.

## Regla de descarte

Cuando una pila sea descartada, se marcará como `DESCARTADA` con el motivo y no se dejará ninguna importación del proveedor dentro del runtime.

Cuando una pila sea adoptada, se registrará:

1. proveedor exacto y versión;
2. licencia;
3. tamaño medido;
4. memoria aproximada;
5. plataformas validadas;
6. fallback;
7. resultados de QA;
8. assets o código eliminados de la pila anterior.

## Implementación actual

- `webapp/js/audio_bridge.js`: contrato neutral y adapter opcional.
- `webapp/js/audio_bridge_test.mjs`: prueba estructural del contrato.
- `webapp/js/combat.js`: no contiene una dependencia directa de proveedor de audio.
- `webapp/js/app.js`: puede inyectar el bridge sin fijar una tecnología concreta.

No existe todavía un motor de audio productivo, una librería externa fijada ni una colección de SFX adoptada.
