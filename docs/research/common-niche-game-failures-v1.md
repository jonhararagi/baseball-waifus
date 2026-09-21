# Errores comunes y errores históricos de juegos de nicho · Baseball Waifus

**Fecha:** 2026-09-21  
**Estado:** Documento de prevención de diseño y arquitectura.  
**Alcance:** patrones generales de videojuegos de nicho, deportivos, de colección y gacha. No atribuye causalidad a un juego concreto sin una fuente verificable.

## 1. La colección se come al deporte
El personaje, la rareza y el número de poder pueden terminar importando más que la decisión deportiva.
**Prevención:** el partido debe seguir siendo jugable sin gacha; timing, pitch, corredores y defensa deben producir decisiones reales; la rareza no resuelve automáticamente una jugada.

## 2. Rareza = victoria
Cada nueva rareza invalida a la anterior y R/SR pasan a sentirse descartables.
**Prevención:** introducir especializaciones antes que aumentos lineales, conservar utilidad situacional de personajes antiguos y medir poder efectivo, no solo rareza.

## 3. Tasas de gacha opacas
El jugador no puede saber qué probabilidades tuvo realmente un resultado.
**Prevención:** tasas, pity, garantías y duplicados explícitos; seed y rule version para QA; ninguna IA decide drops.

## 4. Duplicados sin propósito
Una repetición produce poco o ningún valor.
**Prevención:** definir antes del gacha si el duplicado se convierte en fragmentos, evolución, habilidad, moneda u otro recurso.

## 5. Progreso bloqueado artificialmente
El jugador necesita gastar o esperar para continuar aunque ya domine el gameplay.
**Prevención:** rutas gratuitas de progreso y separación entre límites de repetición y recompensas.

## 6. Treadmill de contenido
Se añaden personajes, mapas o skins continuamente sin ampliar decisiones.
**Prevención:** cada pieza importante debe aportar diferencia jugable, estratégica, narrativa o de construcción de equipo.

## 7. Resultado deportivo inexplicable
Aparece HIT/OUT sin que el jugador entienda qué factores participaron.
**Prevención:** conservar acción, estadísticas relevantes, timing, modificadores, resultado y versión de regla.

## 8. RNG imposible de reproducir
Un fallo no puede repetirse porque cada ejecución usa una secuencia distinta.
**Prevención:** seeds deterministas en tests y rule versions en resolvers.

## 9. Presentación con autoridad de gameplay
Una animación o renderer decide que una corredora avanzó porque eso es lo que se ve.
**Prevención:** Gameplay → Result → Event → Presentation.

## 10. Estados imposibles
Dos sistemas modifican bases, outs o conteo sin una autoridad única.
**Prevención:** BaseballGameState es la autoridad del partido y los resolvers devuelven planes/resultados.

## 11. Doble aplicación de un resultado
Resolver y escena aplican ambos el mismo run, hit, EXP o recompensa.
**Prevención:** un resultado tiene un único dueño de mutación.

## 12. Roster y arte acoplados
El modelo visual contiene estadísticas o gameplay depende de archivos de arte.
**Prevención:** PlayerData → PlayerAvatarAdapter → AvatarProfile → Renderer.

## 13. Clones de referencias populares
Se copian diseño, personalidad, origen y función de un personaje conocido.
**Prevención:** usar ejes abstractos y recombinarlos. La mini biblia de personalidad es normativa para este proceso.

## 14. Color como sustituto de carácter
Cambiar pelo, ojos o elemento se considera suficiente para crear una nueva identidad.
**Prevención:** personalidad, hábitos, preferencias, forma de competir y reacción al fracaso deben diferenciar a los personajes.

## 15. Demasiados sistemas antes del bucle divertido
Gacha, crafting, afinidad, skins y árboles aparecen antes de que el partido funcione.
**Prevención:** el partido mantiene máxima prioridad.

## 16. Producción de live-service insostenible
La cadencia exige más arte, balance y programación de lo que el proyecto puede mantener.
**Prevención:** contenido modular y reutilizable.

## 17. Onboarding sobrecargado
Se explican rareza, elementos, energía, habilidades, equipo, gacha y béisbol de una sola vez.
**Prevención:** enseñar pitch → timing → contacto → bases → defensa y después colección/progresión.

## 18. UI bonita pero ilegible
El HUD oculta inning, outs, count o corredores.
**Prevención:** marcador, inning, outs, balls/strikes y bases tienen prioridad visual.

## 19. Balance solo por promedio
Se ajusta una estadística global sin comprobar situaciones extremas.
**Prevención:** probar extremos de timing, posición, rareza, elemento, stamina y estado de bases.

## 20. Animación que oculta la causa del fracaso
El espectáculo hace difícil distinguir si falló el jugador, una estadística o la defensa.
**Prevención:** cada evento importante debe conservar un payload explicable y auditable.

## 21. Checklist antes de agregar una mecánica
1. ¿Mejora el béisbol o solo agrega números?
2. ¿Tiene autoridad de estado única?
3. ¿Puede reproducirse con seed?
4. ¿Tiene regla/version explícita?
5. ¿Puede explicarse al jugador?
6. ¿Puede probarse sin renderer?
7. ¿Aumenta power creep?
8. ¿Hace perder valor innecesariamente a personajes anteriores?
9. ¿Depende obligatoriamente del gacha?
10. ¿Aumenta demasiado la carga diaria?
11. ¿Puede mantenerse con la producción prevista?
12. ¿Respeta PlayerData → Gameplay → Events → Presentation?

## 22. Errores detectados en la auditoría actual

### Robo hacia una base ocupada
move_runner_on_steal podía sobrescribir silenciosamente al corredor de la base destino. Esto violaba la integridad del estado.
**Corrección:** una base destino ocupada produce una acción bloqueada y no sobrescribe datos.

### Potential sin contrato suficientemente documentado
PlayerData.effective_stat() aplica 0.85 + 0.03 × potential. El rango actual produce un modificador pequeño, pero el contrato no estaba documentado.
**Estado:** documentado, sin convertirlo en una nueva regla de balance.

### Tabla elemental incompleta
La tabla actual tiene relaciones para Fire, Water, Ice, Nature, Light y Darkness. Lightning todavía no tiene matriz explícita.
**Estado:** pendiente, sin inventar balance.

### Persistencia de Encanto separada del roster global
CharmStateStore persiste Encanto por ID, pero la interfaz puede construir un PlayerData nuevo desde el catálogo.
**Estado:** persistencia del valor existe; integración con roster global sigue pendiente.

### Force Out y estados inválidos
apply_force_out presupone que el resolver identificó correctamente la corredora forzada.
**Estado:** mantener la responsabilidad en el resolver y añadir invariantes/tests al ampliar la cadena defensiva.

## 23. Regla de mantenimiento
Toda investigación futura sobre un error de otro juego debe registrar patrón, evidencia/fuente si existe, riesgo, impacto posible en Baseball Waifus, regla preventiva y estado.
No registrar rumores como hechos.
