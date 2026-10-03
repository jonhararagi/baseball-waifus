# BONE-002 - GACHA WEBAPP RUNTIME DATA

PRIORIDAD: P0
ESTADO: OPEN

gacha_controller_runtime.js solicita game_schemas_recycled.json y characters_queue.json dentro de webapp/data.

La carpeta webapp/data observada contiene waifus_config.json, por lo que el init del Gacha puede caer en OFFLINE aunque la app continue arrancando.

Objetivo: fuente canonica unica, artefacto desplegable completo, rutas correctas, pools validos y compatibilidad con Player Meta.

No rebalancear tasas ni pity dentro de esta reparacion.

Cierre: schema PASS, queue PASS, pools R/SR/SSR/UR PASS, Player Meta hydration PASS.