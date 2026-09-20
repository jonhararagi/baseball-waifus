# Baseball Waifus

Prototipo técnico jugable en Godot 4.x.

Controles:
- ESPACIO o click izquierdo: batear durante TIMING.
- S: intentar robo cuando existe corredor.

Arquitectura:
- game/characters: datos de jugadoras.
- game/baseball: pitches, simulación, estado y corredores.
- game/ai: decisiones del rival.
- game/ui: HUD.
- scenes: composición y ejecución.

El primer prototipo usa renderizado procedural para evitar depender de assets externos. Los assets con licencia compatible se incorporarán después de validar el núcleo jugable.
