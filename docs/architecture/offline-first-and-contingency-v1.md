# Arquitectura offline y planes de contingencia v1

**Fecha:** 2026-09-21

Baseball Waifus se diseña como un juego **offline-first**. El núcleo del juego no debe depender de una API, servidor, IA remota, cuenta externa ni conexión permanente para producir una experiencia completa.

## Principios

1. **El partido funciona sin red.** Gameplay, resolvers, IA rival, timing, recompensas locales y presentación deben ejecutarse en Godot sin servicios externos.
2. **La IA rival es algoritmo local.** Toma decisiones mediante reglas, prioridades, heurísticas y seeds. No se utilizarán LLMs, APIs de IA ni servicios remotos para decidir acciones.
3. **El gacha es determinista y auditable.** Las tablas, pity, garantías y seeds pertenecen al cliente/local save cuando el modo sea offline. No existe un servidor oculto que cambie probabilidades.
4. **Los guardados son parte del producto.** Una partida perdida por corrupción local es un fallo de experiencia, no una característica.
5. **La presentación es degradable.** Si falta un asset, animación o efecto, el evento debe poder representarse mediante un fallback visual sin modificar el resultado.
6. **El contenido no debe requerir descarga dinámica.** La campaña base, roster inicial, reglas y recursos necesarios deben poder distribuirse dentro del juego.

## Planes de contingencia

### A. No hay internet
No mostrar errores de conexión para funciones que no necesitan red. El jugador debe poder iniciar partido, entrenar, revisar roster y utilizar el contenido local.

### B. Asset ausente o corrupto
El renderer utiliza un avatar/placeholder seguro y registra el problema. Nunca genera un resultado alternativo de gameplay.

### C. Guardado corrupto
Mantener un esquema de versionado del save y, cuando se implemente el guardado global, conservar una copia de respaldo local rotativa antes de sobrescribir el archivo principal. Si el save principal falla, restaurar el último snapshot válido.

### D. Versión de datos incompatible
Migraciones explícitas por versión. Nunca interpretar silenciosamente campos desconocidos como valores de gameplay.

### E. Error de animación
El evento lógico se completa aunque la animación falle. El presenter debe poder saltar a un estado final seguro.

### F. RNG o seed inválido
Utilizar una seed válida generada localmente. En tests, exigir seed explícita y reproducible.

### G. Recompensa duplicada
Asignación mediante una única autoridad de recompensa y un identificador de transacción/evento local. El renderer no concede objetos.

### H. Soft-lock de partido
Toda fase del partido debe tener una transición de escape segura. Ningún input visual debe ser requisito único para avanzar el GameState.

### I. Error de configuración
Las tablas de reglas deben tener validación estructural antes de iniciar una partida de prueba. Valores fuera de rango deben rechazarse o limitarse de manera explícita.

## Qué NO se implementará como dependencia del núcleo

- API de IA.
- LLM.
- servidor de decisiones.
- backend obligatorio.
- autenticación online obligatoria.
- economía remota obligatoria.
- streaming.
- webcam/tracking.
- dependencia de OBS/VTuber/Live2D.

## Contrato de calidad

Cada sistema nuevo debe responder:

- ¿Funciona sin internet?
- ¿Qué ocurre si el asset falta?
- ¿Qué ocurre si el save está corrupto?
- ¿Qué ocurre si el evento se reproduce dos veces?
- ¿Qué ocurre si el RNG produce un extremo?
- ¿Puede el jugador continuar si una animación falla?
- ¿Puede QA reproducir el caso con una seed?
- ¿Existe una única autoridad de mutación?

El objetivo no es que nunca ocurra un error. El objetivo es que un error aislado no destruya la partida ni convierta el estado en algo imposible.
