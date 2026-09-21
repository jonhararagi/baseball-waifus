# Filosofía de RNG y táctica v1

## Objetivo

Baseball Waifus debe tener **RNG donde aporte incertidumbre de colección y variedad**, pero no utilizar azar para ocultar la lógica del béisbol.

> El jugador debe poder mejorar sus posibilidades mediante decisiones, estadísticas, habilidades, equipamiento y timing. El RNG debe resolver incertidumbre residual, no reemplazar la habilidad del jugador.

## RNG del partido

El partido utiliza variación aleatoria normal para un juego deportivo. No se pretende eliminar el RNG del béisbol.

El RNG aparece en:
- zona del lanzamiento;
- resolución de contacto;
- calidad/distancia del batazo;
- defensa;
- robo;
- rebotes y errores cuando corresponda.

Pero cada tirada está acotada por el estado del partido y las estadísticas.

Por ejemplo:
`mejor timing + mayor Contact + ventaja elemental + skill + equipo`
debe producir una situación más favorable que:
`mal timing + bajo Contact + desventaja + sin preparación`

La primera situación **no garantiza** hit. La segunda **no obliga** a fallar.

## Táctica cuantificable

El jugador debe poder razonar:

> Este pitcher tiene Control alto. Si uso una habilidad que reduzca Control, equipo un bate de Contact y espero un timing Great o Perfect, mi probabilidad de contacto mejora.

Para permitir esta lectura se añade `BaseballTacticalCalculator`.

El calculador:
- usa las mismas fórmulas de gameplay;
- calcula estadísticas efectivas;
- muestra probabilidades acotadas;
- compara escenarios;
- no consume RNG;
- no decide el resultado;
- no modifica el estado del partido.

Es una herramienta de cálculo, no una segunda autoridad de gameplay.

## RNG de colección

La colección se divide en dos familias.

### Personajes

Gacha explícito: rareza, tablas de probabilidad, pity, garantías, banners y seed reproducible para QA. El jugador debe conocer las probabilidades antes de gastar recursos.

### Equipamiento

El equipo se divide en dos capas:

1. **Drop del mapa:** determina si aparece una pieza y el rango de rareza permitido por el mapa. La pantalla «Materiales que salen aquí» muestra el conjunto posible.

2. **Roll de atributos:** una pieza obtenida puede tener una combinación de estadísticas. El jugador no controla directamente el roll. Los resultados están acotados por slot, template y rareza.

Un bate puede, por ejemplo, terminar con `Power + Defense` cuando el jugador buscaba `Power + Contact`. Eso crea variedad de construcción sin convertir cualquier estadística en válida para cualquier objeto.

## Normal / Hard / Hell

La dificultad debe modificar la calidad esperada de la fuente, no esconder información.

Ejemplo conceptual: Normal permite pools R/SR con menor calidad media; Hard aumenta el peso hacia SR y mejores rolls; Hell permite pools superiores y rolls de mayor calidad; Demon King usa tabla especial de jefe. Las tasas concretas quedan pendientes hasta crear la tabla formal de drops.

## Energía y grindeo

La energía funciona como recurso de ritmo: espera para regenerar, recompensas de actividades, recompensas diarias/semanales y anuncios recompensados limitados.

Los anuncios no deben crear equipamiento SSR/UR directamente ni alterar las probabilidades del RNG.

El grindeo debe ofrecer progreso aunque el roll no sea perfecto. Una pieza imperfecta debe poder utilizarse, reciclarse cuando exista ese sistema, alimentar una mejora futura o servir en otro personaje.

## Regla anti-RNG injusto

No se implementará RNG secreto que altere el resultado según cuánto haya gastado el jugador, IA que manipule drops, pity oculto, probabilidades dinámicas no documentadas, dificultad que cambie silenciosamente la tasa de premio ni equipamiento que solo sea útil si coincide con una combinación extremadamente rara.

Todo RNG de economía/colección deberá salir de una tabla auditable y, cuando sea posible, de una seed reproducible.

## Estado

La arquitectura táctica ya tiene un calculador determinista.

La capa de equipamiento aleatorio queda diseñada pero no se convierte todavía en inventario de instancias hasta cerrar formato de instancia, cantidad de substats, rangos, rarezas SSR/UR, reciclaje de piezas y pity/garantías de equipo.