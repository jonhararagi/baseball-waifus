# Scavenger Map: fuentes y reglas de incorporación

Este documento registra las canteras externas que pueden utilizarse para descubrir ideas, efectos, patrones o assets para Baseball Waifus.
Descubrir una fuente no equivale a autorizar su incorporación al runtime.

Flujo obligatorio:
descubrimiento -> verificar autoría/licencia -> aislar -> revisar compatibilidad -> registrar procedencia -> integrar

## Fuentes

| Fuente | Uso | Licencia | Regla |
|---|---|---|---|
| Itch.io Jams | Buscar SFX, música, UI y referencias | Variable por jam/asset | Incorporar solo recursos con licencia explícita compatible |
| OpenGameArt CC0 | SFX, gráficos y recursos declarados CC0 | CC0 cuando el recurso individual lo indique | Verificar la licencia del recurso concreto; no asumir CC0 para todo el sitio |
| GitHub Gists abandonados | Estudiar snippets o técnicas | No confiable por defecto | Referencia/quarantena. No copiar sin licencia explícita |
| Repositorios TMA rusos/asiáticos | Descubrimiento de herramientas, muestras y formatos | Variable/no verificada por defecto | Solo material con licencia explícita y redistribuible; lo demás queda fuera del runtime |

## Protocolo de cuarentena

Una fuente solo puede pasar a CANDIDATA cuando se identifica autor, URL estable, licencia explícita, permiso de redistribución y archivo concreto.

Ausencia de licencia no significa dominio público. Descargar un archivo no concede automáticamente derechos de redistribución.

## Esta revisión

No se incorpora ningún asset externo desde estas canteras. El frontend mantiene SFX sintetizados y assets locales ya existentes.