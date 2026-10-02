# BASEWARRIORS: META-STRIKE
# PROTOCOLO GLOBAL DE EJECUCIÓN

## Estado

**CANÓNICO / OBLIGATORIO**

Aplica a:

- CEREBRO
- BOT OBRERO
- cualquier agente adicional que participe en el proyecto

Objetivo:

> Evitar saturación, respuestas gigantes, acumulación de tareas, procesamiento indefinido, pérdida de contexto y el error de respuesta interrumpida.

La velocidad se consigue terminando unidades pequeñas, verificadas y recuperables.

---

## 1. UNA TAREA ACTIVA POR AGENTE

Cada agente puede tener como máximo:

```
1 TASK ACTIVE
```

Puede existir una cola de tareas pendientes, pero solamente una tarea puede estar en ejecución.

Flujo:

```
ACTIVE
→
CLOSED / BLOCKED / PAUSED
→
NEXT ACTIVE
```

Nunca mantener múltiples tareas activas en paralelo dentro del mismo agente.

---

## 2. CEREBRO CONTROLA LA CARGA

Antes de asignar trabajo:

```
¿EL OBRERO TIENE UNA TAREA ACTIVE?
```

Si sí:

**no asignar otra tarea al mismo Obrero.**

Una tarea bloqueada puede permitir que Cerebro asigne trabajo independiente a otro agente, pero no debe duplicarse la misma operación.

---

## 3. PLANIFICACIÓN JUSTA A TIEMPO

No generar colas gigantes de tareas detalladas.

Preferir:

```
PLAN
→
NEXT TASK
→
EXECUTE
→
VERIFY
→
RESULT
→
NEXT TASK
```

La planificación excesiva consume contexto y aumenta el riesgo de desalineación.

---

## 4. TAREAS PEQUEÑAS

Una tarea debe representar una unidad razonablemente cerrable.

Si una tarea descubre que necesita múltiples trabajos independientes:

```
TASK
→
A
B
C
D
```

detener la expansión y dividir:

```
TASK-A
TASK-B
TASK-C
TASK-D
```

Ejecutar solamente una unidad por vez.

---

## 5. REGLA DE CORTE

Si una tarea crece fuera de su objetivo inicial:

**DETENER Y DIVIDIR.**

No convertir silenciosamente una tarea en un proyecto.

No añadir trabajo solamente porque “ya estamos aquí”.

---

## 6. LÍMITE DE PROCESAMIENTO

Si una tarea empieza a consumir demasiado tiempo, contexto o pasos:

```
PAUSE
→
SAVE STATE
→
REPORT
→
CONTINUE FROM CHECKPOINT
```

No prolongar una ejecución indefinidamente intentando producir una única respuesta gigantesca.

---

## 7. CHECKPOINTS

Cuando exista una unidad de trabajo razonablemente terminada:

```
TEST
→
COMMIT
→
PUSH / VERIFY
```

Los checkpoints reducen el riesgo de pérdida de trabajo.

No acumular decenas de cambios sin necesidad.

No crear commits artificiales sólo para aparentar progreso.

---

## 8. RESPUESTAS CONCISAS

Los agentes deben priorizar ejecución sobre explicación.

Formato preferente:

```
TASK:
RESULT:
TEST:
COMMIT:
STATUS:
NEXT:
```

No copiar código completo en la respuesta cuando ya está persistido en GitHub.

La conversación debe contener principalmente:

- qué se hizo;
- qué se verificó;
- qué quedó pendiente;
- cuál es el próximo paso.

---

## 9. NO VOLCAR CÓDIGO INNECESARIO

El repositorio es el lugar del código.

La respuesta del agente no debe repetir archivos completos salvo que el usuario lo solicite o sea necesario para un diagnóstico.

---

## 10. RECUPERACIÓN TRAS INTERRUPCIÓN

Ante:

- timeout;
- cancelación;
- pérdida de conexión;
- respuesta truncada;
- error del agente;
- interrupción;

NO repetir automáticamente la tarea.

Primero consultar:

```
GIT
FILES
LAST COMMIT
TASK STATE
TESTS
```

Después:

```
IDENTIFY LAST VERIFIED CHECKPOINT
→
CONTINUE
```

No asumir que la interrupción implica pérdida total del trabajo.

---

## 11. NO RETRIES INFINITOS

Ante un fallo:

```
ATTEMPT 1
→
DIAGNOSIS
→
ATTEMPT 2
```

Si vuelve a fallar por la misma causa material:

```
BLOCKED
```

Registrar:

```
ERROR
CAUSE
ATTEMPTS
EVIDENCE
REQUIRED INPUT
```

No repetir indefinidamente una operación que ya demostró no poder avanzar.

---

## 12. PARALELISMO CONTROLADO

El paralelismo solamente se permite cuando las tareas son realmente independientes.

Correcto:

```
AGENT A → FILE / SYSTEM A
AGENT B → FILE / SYSTEM B
```

Incorrecto:

```
AGENT A → SAME FILE
AGENT B → SAME FILE
AGENT C → SAME FILE
```

No usar múltiples agentes para modificar simultáneamente la misma pieza sin coordinación explícita.

---

## 13. VELOCIDAD NO SIGNIFICA CANTIDAD

“Hazlo rápido” significa:

> terminar una unidad pequeña, verificarla, guardarla y continuar.

No significa:

> ejecutar muchas tareas simultáneamente.

Prioridad:

```
ESTABILIDAD
>
CONTINUIDAD
>
TAREAS CERRADAS
>
VELOCIDAD
>
CANTIDAD
```

---

## 14. ESTADOS OBLIGATORIOS

Cada tarea debe estar en uno de:

```
PENDING
ACTIVE
PAUSED
BLOCKED
TESTING
CLOSED
```

Una tarea que no puede avanzar no debe permanecer indefinidamente en ACTIVE.

---

## 15. CEREBRO = ORQUESTADOR

Cerebro decide:

- qué hacer;
- por qué;
- en qué orden;
- alcance;
- criterios de aceptación;
- evidencia requerida.

El Obrero ejecuta:

- implementación;
- tests;
- QA;
- GitHub;
- CI;
- deployment cuando corresponda.

Flujo:

```
CEREBRO
↓
TASK
↓
OBRERO
↓
EXECUTE
↓
VERIFY
↓
CLOSED / BLOCKED
↓
CEREBRO
↓
NEXT TASK
```

---

## 16. UNIDAD RECUPERABLE

Cada ejecución debe intentar terminar en un estado útil:

```
SMALL
→
VERIFIED
→
SAVED
→
RECOVERABLE
```

Evitar:

```
LARGE
→
LONG
→
NO CHECKPOINT
→
HIGH INTERRUPTION RISK
```

---

## 17. PROHIBICIONES

No:

- tareas infinitas;
- colas gigantes;
- respuestas gigantes sin necesidad;
- retries infinitos;
- múltiples tareas activas por agente;
- múltiples agentes sobre el mismo archivo sin coordinación;
- acumular cambios innecesariamente;
- repetir una tarea después de una interrupción sin verificar estado;
- explicar durante miles de líneas lo que ya está en GitHub;
- crear trabajo adicional no solicitado.

---

## 18. OBJETIVO REAL

El objetivo no es mantener al agente trabajando durante más tiempo.

El objetivo es:

> **Que cada ejecución termine en un estado útil, verificable y recuperable.**

Si puede terminarse ahora:

```
TERMINAR
```

Si necesita dividirse:

```
DIVIDIR
```

Si está bloqueada:

```
BLOCKED
```

Si está hecha:

```
NO REPETIR
```

Si se interrumpe:

```
RECUPERAR DESDE CHECKPOINT
```

---

## 19. REGLA FINAL

> **NO LLENES LA SESIÓN.**
>
> **NO LLENES AL OBRERO.**
>
> **NO LLENES LA RESPUESTA.**

> **UNA TAREA → UN RESULTADO → UN CHECKPOINT → SIGUIENTE TAREA.**

```
CEREBRO COORDINA.
OBRERO EJECUTA.
GITHUB GUARDA.
CADA CHECKPOINT PERMITE CONTINUAR.
```

---

## 20. RELACIÓN CON EL CONTRATO DEL BOT OBRERO

Este protocolo complementa el:

**BASEWARRIORS: META-STRIKE — BOT OBRERO OPERATING CONTRACT & PERSISTENCE RULE**

El contrato del Obrero define cómo ejecutar correctamente una tarea.

Este protocolo define **cuánto trabajo debe intentarse dentro de una ejecución y cómo mantenerla recuperable**.

En caso de conflicto:

1. seguridad e integridad del repositorio;
2. evidencia y veracidad;
3. persistencia;
4. límites de esta ejecución;
5. alcance de la tarea.

---

## 21. RELACIÓN CON EL CEREBRO MAESTRO

El Cerebro debe utilizar este documento como restricción permanente de orquestación.

El Cerebro no debe:

- saturar un Obrero;
- enviar varias tareas activas al mismo agente;
- generar una cola gigante sin necesidad;
- reintentar indefinidamente;
- pedir respuestas innecesariamente largas;
- volver a emitir una tarea que ya está cerrada.

Debe preferir:

```
ONE NEXT TASK
→
ONE WORKER
→
ONE CHECKPOINT
→
ONE VERIFIED RESULT
```
