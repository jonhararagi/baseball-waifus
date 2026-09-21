# Inventario, equipamiento y rewards v1

## Objetivo

Esta capa unifica los recursos de cuenta y las recompensas para que mapas, gacha, Demon Kings, anuncios y futuras fuentes de contenido no creen almacenes paralelos.

La autoridad queda separada por tipo:

- CharacterArchetypeCatalog: datos base inmutables de personajes.
- CharacterRosterStore: instancias poseídas y su progresión: nivel, estadísticas, charm, ánimo, energía y referencias de equipamiento.
- PlayerProgressStore: recursos de cuenta: energía del jugador, monedas, materiales y cantidades de equipamiento.
- EquipmentCatalog: catálogo inmutable de piezas y modificadores de gameplay.
- RewardTransactionService: coordina un payload de recompensas ya resuelto con rollback compensatorio entre PlayerProgressStore y CharacterRosterStore.

## Inventario de cuenta

PlayerProgressStore ahora persiste:

| Recurso | Autoridad | Límite |
|---|---|---:|
| Player Energy | PlayerProgressStore | 100 |
| Coins | PlayerProgressStore | 2,147,483,647 |
| Materials | PlayerProgressStore | entero no negativo |
| Equipment quantities | PlayerProgressStore | entero no negativo |

La energía del personaje no vuelve a esta tienda. Se mantiene en CharacterRosterStore.

Los campos históricos character_energy de player_progress.json se conservan solamente como compatibilidad de migración y ya no son autoridad.

## Catálogo de equipamiento

game/progression/equipment_catalog.json contiene piezas con:

- id;
- nombre;
- slot;
- rareza;
- modificadores de estadísticas;
- visual_id.

Slots v1:

- gloves;
- bats;
- caps;
- vests;
- skirts;
- shoes.

Los modificadores usan exclusivamente las ocho estadísticas existentes. No se agrega una estadística nueva para equipamiento.

La apariencia se identifica mediante visual_id y no participa en las fórmulas.

El catálogo inicial de prototipo contiene R/SR para seis slots. Esto no cierra todavía las tasas de gacha. SSR/UR siguen reservados para futuras tablas explícitas y no se inventan drops automáticos para ellos.

## RewardTransactionService

El servicio recibe recompensas ya resueltas:

RewardResolver / Gacha / Map / Demon King
                    |
          RewardTransactionService
             /               \
PlayerProgressStore     CharacterRosterStore

Categorías soportadas v1:

- coins;
- player_energy;
- materials;
- equipment;
- character_energy;
- charm;
- character.

El servicio:

1. valida todo el lote antes de mutar;
2. toma snapshots de las dos autoridades;
3. aplica recompensas en orden;
4. si una aplicación falla, restaura ambos snapshots;
5. devuelve un payload auditable con las mutaciones.

No calcula probabilidades, pity, tablas ni decisiones de IA.

## Personajes duplicados

Una recompensa character sobre un personaje ya poseído se rechaza con character_already_owned.

La conversión de duplicados a fragmentos, moneda, materiales o habilidades queda pendiente hasta que se cierre la regla de duplicados de gacha/fusión. No se genera una compensación inventada.

## Equipamiento duplicado

El inventario de equipamiento usa cantidades porque el catálogo v1 tiene modificadores fijos por item_id.

La futura capa de equipamiento equipado deberá impedir que una misma copia se asigne simultáneamente a varias personajes. Esa regla se implementará en el servicio de equipamiento, no en el renderer.

## Recompensas de mapas y gacha

Todavía no se fijan tasas completas de drops o banners. Cuando exista un resolver de drops, su salida debe ser un payload como:

[
  { category: "coins", amount: 100 },
  { category: "materials", item_id: "character_exp_small", amount: 2 },
  { category: "equipment", item_id: "gloves_r_01", amount: 1 }
]

El resolver decide qué salió. RewardTransactionService solamente valida y persiste.

Esto mantiene separadas:

- probabilidad;
- contenido;
- persistencia;
- presentación.

## Migración

PlayerProgressStore pasa de SAVE_VERSION 2 a 3.

La migración es compatible con saves anteriores porque:

- campos ausentes reciben defaults;
- materiales existentes se conservan;
- energía existente se conserva;
- el campo legacy character_energy se conserva pero deja de ser autoridad;
- coins y equipment_inventory comienzan vacíos si no existían.

No se borra automáticamente ningún save.

## Compatibilidad con rewarded ads

RewardedAdTransaction ahora utiliza RewardTransactionService.

RewardedAdClaimService toma snapshots de cuenta y roster para que un fallo al guardar el contador diario del anuncio pueda revertir también energía de personaje.

## Pendientes

- servicio formal de equipar/desequipar con consumo de copias;
- aplicación de modificadores de equipamiento a resolvers de béisbol;
- tablas definitivas de recompensas por mapa;
- tablas de gacha, pity y garantías;
- política de duplicados;
- fragmentos y evolución;
- integración del RewardResolver existente con esta autoridad;
- migración de UI que todavía cree PlayerData aislados.


### Semántica de transacción

La implementación utiliza una transacción compensatoria entre dos archivos de guardado. Se restaura el snapshot si una mutación falla. No se afirma atomicidad de sistema de archivos ante un cierre del proceso exactamente entre dos escrituras; esa protección requeriría un journal único o un contenedor de save futuro.
