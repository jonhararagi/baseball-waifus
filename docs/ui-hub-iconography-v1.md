# Hub Iconography v1

## Objetivo

Eliminar la dependencia de emojis o glifos de plataforma en la navegación principal y establecer iconografía vectorial propia, consistente y reemplazable.

## Contrato

`BaseballHubMenuButton` es el botón reutilizable de navegación.
`BaseballHubMenuIcon` dibuja el símbolo funcional.

Los identificadores actuales son:

- history
- team
- training
- equipment
- gacha
- inventory
- story
- events
- options

La iconografía no modifica navegación, progreso, rewards, probabilidades ni gameplay.

## Accesibilidad y plataforma

Los títulos y subtítulos siguen siendo texto real. El icono nunca es la única fuente de significado.

No se depende de fuentes externas para representar acciones.

## Rendimiento

Los iconos son geometría 2D dibujada por el componente y no generan texturas adicionales por botón. La animación se limita a escala y estados de estilo.

Este contrato permite sustituir posteriormente un icono procedural por un SVG final sin modificar la interfaz de navegación.

## Rollout

La primera aplicación es exclusivamente el Hub principal. Las demás pantallas deben adoptar este componente en revisiones separadas para evitar propagación de regresiones.
