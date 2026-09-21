# Investigación: autoridad de inventario y rewards v1

## Alcance

Se revisó la arquitectura existente del repositorio antes de crear una nueva capa. El objetivo fue evitar un segundo almacén paralelo.

## Referencia técnica

Godot Engine:
- repositorio: godotengine/godot
- licencia: MIT
- utilidad: patrones de Resource, RefCounted, serialización local y separación entre datos y presentación.
- patrón estudiado: datos persistentes separados de nodos visuales.
- decisión: mantener Godot/GDScript como núcleo; no introducir un backend para inventario.

## Decisión interna

No se añadió una librería externa. El problema era de autoridad de datos del propio proyecto, por lo que una dependencia no aporta una ventaja real.

Se conserva PlayerProgressStore como autoridad de cuenta porque ya era responsable de energía y materiales. Se amplía en lugar de crear InventoryStore paralelo.

CharacterRosterStore continúa siendo autoridad de instancias de personajes.

RewardTransactionService se añade como capa de transacción, no como otro almacén.

## Licencia

No se incorporan assets ni código de terceros.
