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

bw001 dispone de cinco SVG propios en assets/characters/expressions/. Los assets son una primera pasada vectorial de prototipo, no arte final. El pipeline permite sustituirlos por ilustraciones finales manteniendo el mismo contrato de IDs.

## Uso en el Hub

Los diez comentarios de la personaje inicial ya existentes se mantienen intactos. El Hub asocia cada comentario a un estado facial mediante una tabla determinista. El texto y la expresión son presentación, no lógica de juego.

## Regla de escalado

No se generan expresiones para las otras 29 personajes en esta revisión. Primero se valida el contrato, fallback, legibilidad y conexión con la tarjeta usando bw001. Luego podrá repetirse el mismo pipeline personaje por personaje.

## Pruebas

scenes/character_expression_test.gd comprueba el vocabulario, existencia de los cinco assets de bw001, mapeo determinista y presencia del método de integración en la tarjeta.

Runtime Godot: no ejecutado. Las pruebas son estructurales/escritas.
