# Character Roster Authority v1

## Objetivo

`CharacterRosterStore` es la única autoridad persistente para el estado de una instancia de personaje que pertenece al jugador.

El catálogo `CharacterArchetypeCatalog` sigue siendo la fuente de datos base/inmutable del personaje. El roster guarda únicamente el estado adquirido o progresado por el jugador.

## Estado propiedad del roster

Cada personaje puede persistir:

- character_id;
- level 1-100;
- potential;
- Power;
- Contact;
- Speed;
- Pitch;
- Control;
- Defense;
- Critical;
- Stamina;
- Charm;
- mood;
- character energy;
- timestamp de regeneración de energía;
- referencias de equipamiento gameplay.

El equipamiento se guarda como referencias de item ID, no como lógica visual.

## Fuentes de datos

```
CharacterArchetypeCatalog
        ↓
CharacterRosterStore
        ↓
PlayerData runtime
        ↓
PlayerAvatarAdapter / Gameplay
```

El catálogo no cambia cuando el jugador entrena.

El roster tampoco contiene geometría, sprites, materiales ni decisiones del renderer.

## Energía

La energía de personaje se ha migrado conceptualmente desde `PlayerProgressStore` al roster.

`PlayerProgressStore` conserva la energía de cuenta y materiales. Sus métodos antiguos de energía de personaje funcionan como compatibilidad y delegan en `CharacterRosterStore`.

La regeneración continúa usando el intervalo existente de 360 segundos y no crea una segunda regla de economía.

## Encanto

El valor de Encanto ahora vive en el roster.

`CharmStateStore` permanece para compatibilidad con el sistema de diálogos y regalos, pero carga y guarda el Encanto del personaje mediante `CharacterRosterStore`.

Los valores antiguos de `charm_state.json` se migran al roster cuando un personaje se encuentra por primera vez.

## Entrenamiento

`TrainingQueueStore` conserva únicamente:

- intención;
- tipo;
- duración;
- timestamps.

Al reclamar:

```
TrainingQueueStore
      ↓
EconomyRules
      ↓
CharacterRosterStore.apply_training()
```

Si la actualización del roster falla después de retirar una tarea completada, el servicio intenta restaurar el registro original de la cola. Esto evita perder una recompensa de entrenamiento por un fallo de persistencia.

El entrenamiento no puede programarse para un personaje que no esté en el roster.

## Compatibilidad

Los sistemas existentes pueden seguir construyendo `PlayerData` desde el catálogo. Cuando un sistema necesita el estado persistente, debe pasar por el roster.

Esto mantiene la separación:

- **Archetype:** quién es el personaje de base.
- **Roster:** qué posee/progresó el jugador.
- **PlayerData:** objeto runtime.
- **AvatarProfile:** representación visual.
- **Renderer:** presentación.

## Equipamiento

La autoridad de roster almacena IDs de piezas por slot. La apariencia visual se resolverá posteriormente mediante el adapter/avatar y un catálogo de equipamiento.

No se permite que el renderer calcule estadísticas de equipamiento.

## Estado

Implementado:

- store persistente de roster;
- reconstrucción de PlayerData;
- estadísticas persistentes;
- nivel/potential;
- Encanto;
- ánimo;
- energía;
- regeneración de energía;
- referencias de equipamiento;
- aplicación transaccional de entrenamiento;
- migración de Encanto legacy;
- compatibilidad de PlayerProgressStore.

Pendiente:

- inventario único de piezas;
- catálogo de equipamiento gameplay;
- aplicación de estadísticas de equipamiento al resolver gameplay;
- migración completa de todos los sistemas que todavía crean PlayerData temporal;
- gacha/rewards que escriban mediante una autoridad de transacciones única.
