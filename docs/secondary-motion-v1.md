# Secondary Motion 3D v1

## Objetivo

Dar al renderer 3D procedural de Baseball Waifus una sensación corporal más viva durante idle, carrera, swing, slide, lanzamiento y celebración, manteniendo toda la física fuera del gameplay.

La referencia visual buscada es un anime deportivo 3D con silueta adulta marcada y lectura clara desde frente, lateral y espalda. No se copia ningún modelo, animación o asset de terceros.

## Arquitectura

`Pixel3DBaseballCharacter` construye anclajes visuales para:

- torso/espalda;
- pecho;
- cadera/falda;
- muslos;
- piernas.

`SecondaryMotion3D` aplica un modelo de resorte amortiguado a esos anclajes.

Flujo:

`Baseball Event → Animation Controller → Motion Intent → SecondaryMotion3D → visual nodes`

No existe flujo inverso.

## Modelo de movimiento

La capa utiliza:

- stiffness;
- damping;
- desplazamiento máximo;
- rotación máxima;
- respuesta al movimiento;
- oscilación respiratoria muy pequeña en idle.

La intención de movimiento procede de la animación actual, no del resultado del partido.

Durante:

- **RUN:** las caderas y muslos tienen contramovimiento ligero y el torso estabiliza la silueta.
- **SWING:** el torso rota primero y las masas secundarias siguen con retraso.
- **SLIDE:** el cuerpo recibe un desplazamiento descendente/longitudinal controlado.
- **THROW:** el torso y la parte superior acompañan el giro.
- **CELEBRATE:** existe oscilación suave.
- **IDLE:** solo respiración y asentamiento.

## Pecho, cadera, muslos y espalda

El cuerpo procedural separa visualmente dos masas de pecho bajo el uniforme para permitir una deformación secundaria independiente y sutil.

La falda funciona como capa visual de cadera y recibe mayor desplazamiento lateral que el torso.

Los muslos reciben una fracción de la respuesta del resorte para evitar que parezcan piezas rígidas durante la carrera.

El torso representa la cadena pecho/espalda y recibe una respuesta más amortiguada, evitando vibraciones excesivas.

## Rendimiento

No se utilizan cuerpos físicos, joints ni simulación rígida por personaje. La solución es cinemática y basada en resortes, adecuada para muchos personajes simultáneos y para móvil.

## Límites

Esta capa:

- no modifica estadísticas;
- no modifica hitboxes;
- no decide resultados;
- no modifica física de la pelota;
- no altera corredores;
- no participa en probabilidades;
- no modifica recompensas.

Es exclusivamente presentación.

## Estado

Implementado en el prototipo:

- componente `SecondaryMotion3D`;
- anclajes corporales;
- intención por acción;
- movimiento amortiguado;
- integración con el personaje 3D procedural.

Pendiente:

- validación runtime en Godot;
- ajuste fino de parámetros mediante captura de gameplay;
- clips de animación de producción;
- reemplazo del cuerpo procedural por arte/modelos finales.
