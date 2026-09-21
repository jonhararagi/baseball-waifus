# Sistema de habilidades de béisbol v1

## Propósito

Las habilidades son modificadores y decisiones de béisbol, no ataques RPG que infligen daño.

Categorías:
- **attack**: modifica la resolución ofensiva concreta.
- **defense**: modifica una resolución defensiva.
- **power_up**: mejora temporalmente una estadística o condición favorable.
- **power_down**: reduce temporalmente una estadística o condición rival.
- **statistic**: modifica una estadística durante una ventana definida.
- **combination**: prepara o consume una condición producida por otra jugadora.

## Regla de balance

Una habilidad nunca puede convertir por sí sola una jugada en victoria asegurada.

Los modificadores se aplican antes del resolver que decide el resultado. El resolver mantiene sus límites de probabilidad y el RNG determinista cuando se proporciona una seed.

Las mejoras porcentuales de estadísticas son multiplicadores de la estadística efectiva. Por ejemplo:

`Power 80 × 1.03 = 82.4`

No significa `+3 puntos`.

Los modificadores de probabilidad que representen una posibilidad concreta se expresan como puntos porcentuales y también tienen límites.

## Ejemplo de combo

Secuencia:

1. Jugadora 1 usa `power_signal` sobre la bateadora 3.
2. La bateadora 2 usa `pitch_pressure` sobre la pitcher rival.
3. La bateadora 3 utiliza `flame_strike`.
4. La resolución de bateo recibe el estado de habilidades.
5. La Power efectiva de la bateadora 3 incorpora +3% y +5%, por lo que sus multiplicadores se acumulan hasta +8% durante la ventana definida.
6. La Control de la pitcher rival queda en -3% durante cuatro acciones de pitch.
7. `flame_strike` añade +5 puntos porcentuales al modificador específico de Home Run.
8. El timing, Contact, dificultad del pitch, elementos, Critical y RNG siguen participando.

Por tanto, el combo puede fabricar una situación muy favorable, pero **no asegura Home Run ni victoria**.

## Por qué no usar "destreza" nueva

El sistema actual no añade Dexterity/Technique/Reaction. Para el ejemplo del power down, "destreza" se representa mediante **Control**, porque Control ya representa precisión y consistencia del pitcher. Añadir otra estadística solo para una habilidad duplicaría responsabilidades.

## Duración

Los modificadores tienen `duration_actions`.

Ejemplo:
- +3% Power con duración 1: afecta la próxima resolución aplicable.
- -3% Control con duración 4: sobrevive cuatro consumos de acción.

El consumidor del estado de partido debe llamar a `consume_action()` después de cada acción relevante. La capa de presentación nunca modifica el contador.

## Combinaciones

Una habilidad de combinación puede:
- preparar una condición;
- comprobar una condición producida por otra jugadora;
- añadir un modificador específico;
- fallar si la secuencia no se cumple.

Esto permite equipos que funcionen como cadenas de decisiones en vez de cinco atacantes independientes.

## Principio de construcción de equipos

El jugador debe decidir entre:
- acumulación de atacantes;
- balance ofensivo/defensivo;
- soporte;
- control del pitcher;
- velocidad y presión de bases;
- composiciones de combo.

Una composición de cinco personajes ofensivos puede producir mucho potencial, pero carecer de defensa, recuperación, control o preparación. Las habilidades de soporte permiten que una jugadora tenga valor aunque no sea la bateadora que termina la jugada.

## Arquitectura

`SkillResolver -> BaseballSkillState -> BaseballSimulator -> Baseball Result`

La UI solo solicita la acción.

El avatar solo representa el evento.

La IA rival podrá elegir habilidades y acciones mediante reglas situacionales, pero nunca podrá modificar los modificadores fuera de este resolver.

## Estado actual

Implementado:
- estado temporal de habilidades;
- stacking de modificadores;
- buffs/debuffs estadísticos;
- duración por acciones;
- modificadores específicos de resultado;
- condiciones de combinación;
- catálogo JSON;
- integración opcional con Contact, Power y resolución de Home Run;
- test estructural/determinista.

Pendiente:
- interfaz de selección;
- costes/energía de habilidad;
- cooldown definitivo;
- asignación final de skills a cada personaje;
- efectos de las 26 acciones de firma;
- IA rival;
- balance de números mediante simulaciones extensas.
