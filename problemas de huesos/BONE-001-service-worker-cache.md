# BONE-001 - SERVICE WORKER / CACHE / VERSIONING

PRIORIDAD: P0
ESTADO: OPEN

Riesgo confirmado: el Service Worker observado usa cache v16_capibara_core y su limpieza busca el prefijo baseball-waifus-.

Impacto: clientes con codigo viejo despues de deploy, modulos mezclados y bugs que parecen aleatorios en Web y TMA.

Objetivo: versionado unico, invalidacion fiable, bootstrap version check y estrategia de reload controlado.

Cierre: cache nueva PASS, purge antigua PASS, bootstrap consistency PASS, regression Web/TMA PASS.