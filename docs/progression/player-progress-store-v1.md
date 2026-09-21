# Player Progress Store v1

## Objetivo

Cerrar la primera autoridad local de recursos que necesitan la progresión y la monetización recompensada: energía global, materiales y energía individual de personajes.

La tienda de estado es local, versionada y offline-first. No existe servidor de economía, API ni IA.

## Límites

- Player Energy: 0–100.
- Character Energy: 0–100 por personaje.
- Materials: enteros no negativos por identificador de objeto.

El estado inicial es 100 de energía global y 100 de energía por personaje cuando todavía no existe una entrada persistida.

## Arquitectura

PlayerProgressStore es la autoridad de mutación de estos tres recursos.

La publicidad no mantiene una segunda copia del inventario:

RewardedAdService → RewardedAdPolicy → RewardedAdTransaction → PlayerProgressStore

La campaña, entrenamiento y futuros consumos deben llamar a PlayerProgressStore en lugar de crear contadores paralelos.

## Contingencias

- Save inexistente: se crea estado por defecto.
- JSON corrupto o versión incompatible: se reconstruye un estado válido.
- Energía fuera de rango: se limita a 0–100.
- Material negativo: se normaliza a 0.
- Personaje sin energía persistida: usa 100 hasta que se cree su entrada.
- Error de escritura: la operación informa save_failed y no debe presentarse como recompensa confirmada.

## Regla de diseño

La publicidad no regala equipamiento SSR/UR, personajes raros ni moneda de gacha directamente. Las recompensas publicitarias son recursos pequeños de mantenimiento/grindeo. El progreso de alto valor sigue requiriendo partidos, campaña, entrenamiento, fusión, colección o gacha según las reglas que se cierren posteriormente.

## Estado

Implementado como autoridad local de recursos y conectado mediante RewardedAdTransaction. El balance exacto de costes de partidos, entrenamiento y materiales todavía queda pendiente.
