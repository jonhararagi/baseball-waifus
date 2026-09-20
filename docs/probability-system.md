# Sistema de tablas y probabilidades

## Objetivo

El sistema de recompensas no utiliza una IA interna. Las recompensas salen de tablas explícitas, versionadas y auditables.

Cada tabla puede depender de:
- zona/mapa;
- dificultad;
- actividad;
- objeto;
- rareza;
- evento.

La IA no decide drops ni cantidades.

## Límites

Los límites se aplican en la capa de servicio:
- mapas normales: 10 intentos;
- hard: 10;
- hell: 10;
- Demon King: 3.

La UI no puede saltarse estas reglas porque el servicio valida el contexto y el contador.

## Aleatoriedad

Cada tirada usa RandomNumberGenerator sobre pesos definidos. Los pesos se normalizan en la tirada. Una probabilidad baja no garantiza que un objeto aparezca una sola vez. Los límites y garantías son reglas independientes.

## Auditoría

ProbabilityAudit cuenta resultados por tabla para comparar frecuencia observada con la distribución esperada.

## Reproducibilidad

RewardResolver acepta una semilla fija para QA, permitiendo reproducir una secuencia de resultados durante pruebas.

## Seguridad

En una versión online, la resolución definitiva debe ejecutarse en servidor. En una versión offline, alguien con acceso al ejecutable puede modificarlo, por lo que no existe anti-cheat absoluto local.

## Estado

Implementado:
- tablas;
- pesos;
- versiones;
- resolver;
- límites;
- auditoría;
- semillas de prueba;
- servicio separado de la UI.

Pendiente:
- migrar todos los drops definitivos;
- inventario persistente;
- pity/garantías;
- firma/servidor online;
- panel de balance;
- pruebas estadísticas automatizadas.
