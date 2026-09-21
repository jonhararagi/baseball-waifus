# Mapas de grindeo v1

## Objetivo

Los mapas de grindeo son contenido PvE separado de la historia. Cada uno tiene una identidad de recurso clara para alimentar la progresión sin convertir la campaña en una lista interminable de materiales.

## Actividades iniciales

| Actividad | Energía | Intentos por ciclo | Propósito |
|---|---:|---:|---|
| Character Materials | 10 | 10 | EXP y materiales para subir personajes |
| Equipment | 10 | 10 | Materiales y equipamiento de farmeo |
| R Cards / Charm | 10 | 10 | Cartas R y materiales para Amor/Encanto |
| Normal | 10 | 10 | Progreso PvE y drops básicos |
| Hard | 10 | 10 | Mejor calidad de recompensa sin aumentar el coste |
| Hell | 15 | 10 | Contenido de dificultad superior |
| Demon King | 20 | 3 | Jefe y recompensas específicas de jefe |

## Decisión de pacing

Normal y Hard cuestan ambos **10 de energía**.

La intención es que subir de nivel y fortalecer al equipo se sienta como una recompensa por haber grindeado. Al superar el tramo Normal, el incentivo para continuar debe ser acceder a mapas Hard con mejores materiales y recompensas, no encontrarse inmediatamente con un muro de energía.

Hell conserva 15 como escalón avanzado.

Demon King cuesta **20 de energía** y mantiene **3 intentos por ciclo**. Su valor adicional debe venir de su tabla de recompensas de jefe, no de multiplicar artificialmente el coste.

## Separación de límites

Los intentos son independientes de:
- energía;
- recompensas;
- anuncios recompensados;
- resultado del partido.

Una victoria no concede intentos adicionales. Un anuncio tampoco reinicia ni aumenta el límite.

## Recompensas

Los mapas de grindeo deben entregar principalmente recursos que alimenten otros sistemas:
- Character Materials → progreso de nivel y entrenamiento.
- Equipment → piezas/materiales de equipamiento dentro de las reglas de rareza.
- R Cards / Charm → colección R y progreso de Amor/Encanto.
- Hard → mejores cantidades o calidad respecto de Normal.
- Demon King → materiales, cartas o equipamiento específico de jefe según tablas explícitas.

Los drops futuros deben usar tablas matemáticas y seeds reproducibles. Ninguna IA decide recompensas.

## Arquitectura

Las actividades reutilizan la infraestructura existente:

activity_id → CampaignEntryService → PlayerProgressStore + CampaignAttemptStore → gameplay → reward resolver

CampaignEntryService solamente autoriza la entrada. Las recompensas permanecen bajo su propia autoridad.

## Regla de continuidad

Los mapas de grindeo no deben convertirse en una segunda campaña escondida. Cada actividad debe justificar su existencia por el recurso que entrega y mantener al béisbol como el centro de la experiencia.