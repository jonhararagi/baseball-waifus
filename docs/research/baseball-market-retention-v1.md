# Investigación de mercado y diseño de personajes · v1

**Estado:** Documento de trabajo.  
**Fecha:** 2026-09-21  
**Importante:** esta revisión no pudo realizar una búsqueda web externa desde el entorno de desarrollo. Por eso no se presentan como hechos verificados las causas concretas de cierre o pérdida de popularidad de Baseball Heroes u otros títulos. Se separan hechos conocidos del diseño general, hipótesis y puntos que requieren verificación externa antes de convertirse en canon.

## 1. Baseball Heroes: qué debemos investigar sin inventar una causa

El proyecto recuerda a Baseball Heroes como referencia funcional, especialmente por su mezcla de béisbol, colección y progresión. Sin embargo, no debe registrarse todavía una frase del tipo “fracasó por X” sin una fuente primaria o análisis verificable.

Las hipótesis de producto que sí debemos auditar contra fuentes cuando haya acceso externo son:

1. **Retención:** cuánto valor nuevo recibía el jugador después de dominar el bucle básico.
2. **Profundidad de béisbol:** si la progresión/colección terminó pesando más que las decisiones propias del deporte.
3. **Economía:** inflación, costes de mejora, presión de gasto y sensación de progreso bloqueado.
4. **Gacha:** tasas, duplicados, pity, power creep y transparencia.
5. **Contenido:** frecuencia de nuevos personajes, eventos y mapas frente a la velocidad con que los jugadores agotaban el contenido.
6. **Accesibilidad:** fricción de plataformas, tiempos de carga, rendimiento y dependencia de servicios externos.
7. **Social/PvP:** valor de comunidad, competición y motivos para volver.
8. **Diferenciación:** si la fantasía de colección era suficientemente distinta de otros juegos de cartas/gacha.

Estas son preguntas de investigación, no conclusiones sobre Baseball Heroes.

## 2. Lecciones que sí se convierten en requisitos de Baseball Waifus

### El béisbol debe sobrevivir a la colección

La colección no puede sustituir al juego. Una nueva jugadora debe aportar una decisión deportiva, no únicamente un número mayor.

### Rareza no equivale a victoria

R/SR/SSR/UR debe afectar disponibilidad, potencial y opciones de construcción, pero el resolver continúa utilizando estadísticas, situación y ejecución.

### Gacha no puede ser la única fuente de diversión

El juego necesita progreso reproducible mediante partido, entrenamiento, campaña, Encanto, equipamiento y construcción de equipo. El gacha debe ampliar opciones, no convertirse en el único camino.

### El jugador debe entender por qué perdió

Los resultados importantes deben conservar:
- inputs;
- estadísticas relevantes;
- modificadores;
- seed;
- regla/version;
- resultado.

Esto coincide con la arquitectura determinista ya usada en pitching, contacto y defensa.

### El power creep debe ser lento

Las nuevas personajes deben aportar especializaciones, estilos de juego y sinergias diferentes antes que simplemente estadística superior.

### El roster necesita identidad

Una colección de 30 personajes con cambios únicamente cosméticos se vuelve intercambiable. Las personalidades, hábitos y decisiones deben crear diferencias reconocibles sin alterar la autoridad de gameplay.

## 3. Gacha: riesgos de diseño a vigilar

No se adopta ninguna tasa todavía.

Antes de implementar gacha definitivo deben existir tablas explícitas para:
- tasa por rareza;
- tasa por personaje dentro de rareza;
- pity;
- garantía;
- duplicados;
- moneda;
- tickets;
- límites diarios;
- fuentes gratuitas;
- protección contra resultados imposibles de auditar.

Reglas de diseño:
- no ocultar una manipulación adaptativa;
- no cambiar probabilidades según el jugador;
- no usar IA para decidir drops;
- permitir auditoría mediante seed/versiones;
- documentar si el pity es por banner o global;
- separar personaje obtenido de su fuerza competitiva.

## 4. Qué no hacer con Baseball Waifus

- No convertir cada SSR/UR en una protagonista de anime diferente con el mismo molde.
- No usar color de pelo + color de ojos + elemento como identidad completa.
- No copiar historias de origen de personajes populares.
- No copiar frases características.
- No copiar poderes, armas o uniformes de una obra.
- No asignar un diseño visual porque una referencia popular usa la misma combinación.
- No dejar que una referencia externa se convierta accidentalmente en canon.

## 5. Próxima investigación externa

Cuando exista acceso web adecuado, verificar por separado:
- historial de Baseball Heroes;
- plataforma y modelo comercial;
- fecha/forma de discontinuación;
- reseñas y comentarios de jugadores;
- retención/eventos si existen datos públicos;
- títulos móviles/web de béisbol con gacha;
- casos de juegos deportivos que mantuvieron comunidad;
- sistemas de pity y monetización de juegos de colección populares.

Cada afirmación debe guardarse con URL, fecha de consulta y nivel de confianza.
