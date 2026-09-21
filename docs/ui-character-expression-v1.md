# Expresiones de personaje v1

## Objetivo

Introducir estados faciales reutilizables sin convertir la expresión en parte de PlayerData ni del gameplay. La primera validación se realiza exclusivamente con bw001, siguiendo la estrategia de producción incremental.

## Contrato

CharacterExpressionController define un vocabulario cerrado de cinco estados: neutral, happy, focused, surprised y disappointed.

- neutral: estado base de ficha.
- happy: bienvenida, recompensa o comentario positivo.
- focused: concentración competitiva.
- surprised: reacción a un evento inesperado.
- disappointed: reacción visual a un resultado desfavorable.

El controlador solamente resuelve rutas de assets y mapea contexto de presentación a expresión. No escribe estadísticas, energía, ánimo, resultados de béisbol ni progresión.

## Integración de la tarjeta

BaseballCharacterCard.set_expression() cambia únicamente el retrato mostrado. Si falta un asset, el sistema realiza fallback al retrato base del personaje.

La firma de setup() mantiene compatibilidad con llamadas existentes porque la expresión es un parámetro opcional.

## Primera personaje validada

bw001 dispone de cinco SVG vectoriales propios en assets/characters/expressions/. Cada estado tiene rasgos faciales propios y comparte una misma silueta, paleta y dirección visual. El formato vectorial evita dependencia de plataforma y mantiene el asset ligero en PC y Android.

Estos assets constituyen el primer paquete visual controlado de personaje. Pueden sustituirse por ilustraciones raster/painted posteriores sin modificar PlayerData, CharacterRosterStore, la tarjeta ni los resolvers.

## Uso en el Hub

Los diez comentarios de la personaje inicial ya existentes se mantienen intactos. El Hub asocia cada comentario a un estado facial mediante una tabla determinista. El texto y la expresión son presentación, no lógica de juego.

## Regla de escalado

No se generan expresiones para las otras 29 personajes en esta revisión. Primero se valida el contrato, fallback, legibilidad y conexión con la tarjeta usando bw001. Luego podrá repetirse el mismo pipeline personaje por personaje.

## Pruebas

scenes/character_expression_test.gd comprueba el vocabulario, existencia de los cinco assets de bw001, mapeo determinista y presencia del método de integración en la tarjeta.

Runtime Godot: no ejecutado. Las pruebas son estructurales/escritas.


## Transición de expresión

El cambio de estado ya no reconstruye ni reaparece toda la tarjeta. BaseballCharacterCard.set_expression() realiza un microcrossfade del retrato con una compresión mínima de escala y aplica el nuevo asset en el punto medio de la transición. El resto de la tarjeta permanece estable.

La expresión sigue siendo presentación pura: no se guarda en el roster, no consume recursos y no altera ningún resultado deportivo.


## Segunda personaje: bw002

La segunda unidad visual validada es bw002, Reina Kurose. Conserva el mismo contrato de cinco estados y utiliza cinco assets propios adicionales:

- assets/characters/expressions/bw002_neutral.svg
- assets/characters/expressions/bw002_happy.svg
- assets/characters/expressions/bw002_focused.svg
- assets/characters/expressions/bw002_surprised.svg
- assets/characters/expressions/bw002_disappointed.svg

La identidad visual de bw002 se diferencia de bw001 mediante una paleta fría, cabello azul petróleo, silueta de pitcher refinada y tratamiento facial más controlado. La diferencia visual no introduce ninguna estadística ni regla nueva.

QA específico: scenes/bw002_character_presentation_test.gd.

La estrategia de producción continúa siendo personaje por personaje. El controlador permanece genérico y no se crean tablas especiales por personaje.
