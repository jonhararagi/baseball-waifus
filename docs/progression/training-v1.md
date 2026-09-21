# Entrenamiento v1

## Estado

Implementado como cola persistente offline. La mutación definitiva del roster de PlayerData permanece separada porque todavía no existe una autoridad persistente única para el roster completo.

## Duraciones

| Duración | Ganancia primaria | Ganancia secundaria |
|---|---:|---:|
| 30m | +1 | +0 |
| 2h | +2 | +1 |
| 6h | +4 | +2 |
| 12h | +7 | +3 |
| 24h | +12 | +5 |

Los valores son una base de balance v1 y no dependen de rareza.

## Tipos

- batting → Power / Contact
- running → Speed / Stamina
- pitching → Pitch / Control
- defense → Defense / Critical
- balanced → Contact / Stamina

## Reglas

- Una personaje solo puede tener un entrenamiento activo.
- El entrenamiento se persiste en user://baseball_waifus/training_queue.json.
- El cierre del juego no cancela el entrenamiento.
- La finalización se determina por timestamp Unix.
- Una reclamación elimina la entrada de la cola de forma persistente antes de devolver las ganancias.
- Una segunda reclamación no puede entregar la misma recompensa.
- Un reloj retrocedido bloquea la consulta/reclamación en vez de regalar tiempo.
- Los tiempos y ganancias son deterministas.
- El entrenamiento no consume energía en v1 porque el diseño previo no había fijado un coste.

## Arquitectura

UI → TrainingService → TrainingQueueStore + EconomyRules → claim payload → roster authority

TrainingQueueStore no modifica directamente PlayerData. Esto evita crear una segunda fuente de verdad para estadísticas antes de que exista el almacenamiento persistente del roster.

## Pendiente

- Persistencia unificada de PlayerData.
- Aplicación atómica de stat_gains al personaje.
- Costes materiales/monedas si el balance futuro los requiere.
- Límite máximo de estadísticas por nivel.