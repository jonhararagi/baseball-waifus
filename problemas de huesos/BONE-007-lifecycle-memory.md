# BONE-007 - LIFECYCLE / MEMORY LEAKS

PRIORIDAD: P1
ESTADO: OPEN

CombatRenderer crea RAF y listeners globales. Dispose existe, pero el ciclo completo de SPA debe demostrar que no deja RAF, ResizeObserver, timers ni listeners huérfanos.

Objetivo: CREATE -> MOUNT -> ACTIVE -> PAUSE/HIDE -> DISPOSE.

Target: Web y especialmente WebView/TMA movil.

Cierre: un RAF, listeners no duplicados, timers cancelados, renderer pausado cuando corresponde y estabilidad tras navegaciones repetidas.