# Baseball Waifus - Canon de Encanto y Afinidad v1

**Estado:** CANÓNICO
**Fecha:** 2026-09-21

## 1. Propósito

"Amor o Encanto" es un sistema de afinidad opcional de colección. Su función es recompensar la interacción con las personajes sin convertirla en un multiplicador infinito de poder.

El valor de Encanto es independiente de la rareza. Una R y una UR utilizan las mismas reglas de afinidad.

## 2. Encanto

- Rango: 0-100.
- Cada punto de Encanto aumenta 1 punto una estadística primaria predeterminada.
- La estadística primaria depende de la especialización y no utiliza azar.
- Cada 10 puntos de Encanto añade +1 a tres estadísticas secundarias predeterminadas por posición.
- Las estadísticas de gameplay permanecen limitadas a 100 después de aplicar el bonus de Encanto.
- El bonus de Encanto no modifica rareza, elementos, posiciones ni resultados directamente.

Mapa primario:
- Power -> Power
- Contact -> Contact
- Runner -> Speed
- Pitcher -> Pitch
- Catcher -> Defense
- Defender -> Defense

Las tres estadísticas secundarias se seleccionan de forma determinista por posición. El catálogo técnico está en game/progression/charm_system.gd.

## 3. Regla anti-inflación

El Encanto no crea una segunda estadística oculta que reemplace a las estadísticas de béisbol. Se aplica como bonus determinista antes del límite de 100.

Por ejemplo, una jugadora con Power 60 y Encanto 100 obtiene como máximo Power 100 por esta vía. No puede superar el límite de 100.

## 4. Regalos

Los regalos consumen materiales finitos almacenados en el estado de afinidad.

Valores actuales:
- Chocolate: +2
- Favorite Snack: +4
- Bouquet: +7
- Keepsake: +10
- Special Gift: +15

Stock inicial del prototipo:
- Chocolate: 20
- Favorite Snack: 10
- Bouquet: 5
- Keepsake: 3
- Special Gift: 1

Los materiales no se regeneran automáticamente. Futuras fuentes de materiales deberán registrarse en economía/recompensas y usar el mismo inventario, no crear una moneda paralela.

## 5. Charlas

Cada día:
- máximo 3 personajes con los que se puede conversar;
- una misma personaje solo puede recibir una charla ese día;
- el estado se guarda en user://baseball_waifus/charm_state.json.

Cada personaje tiene 10 conversaciones.

Cada conversación ofrece 3 respuestas:
- una respuesta correcta: +20 Encanto;
- dos respuestas incorrectas: +3 Encanto cada una.

La respuesta correcta está vinculada a información que el jugador puede conocer observando la ficha, perfil o contenido del personaje. No se elige al azar.

El catálogo actual contiene 10 conversaciones para cada uno de los 30 personajes.

## 6. Arquitectura

PlayerData -> CharmSystem -> stat bonus

PlayerData -> CharmDialogueCatalog -> elección del jugador -> CharmStateStore -> persistencia

La UI solo presenta opciones y resultados. No calcula el premio.

## 7. Estado de producción

**Implementado:** reglas 0-100, bonus determinista, materiales finitos, límite diario de charlas, persistencia local, 300 conversaciones estructuradas y pruebas.

**Pendiente:** conectar el menú de Encanto a la UI principal, integrar la adquisición de materiales con el futuro sistema económico y balancear fuentes de materiales cuando economía/gacha estén implementados.
