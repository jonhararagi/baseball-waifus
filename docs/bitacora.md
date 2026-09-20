# Bitácora del proyecto: Baseball Waifus

> Documento de control del desarrollo. Su objetivo es evitar repetir trabajo ya realizado, conservar las decisiones tomadas y registrar las revisiones sin borrar el historial.

## Reglas de esta bitácora

1. Todo sistema, idea estructural, prueba, revisión o decisión relevante debe registrarse aquí.
2. Una revisión está permitida cuando aporta un cambio, corrección, simplificación o nueva información. No se vuelve a diseñar desde cero algo que ya fue trabajado sin revisar primero este documento.
3. Las decisiones no definitivas se marcan como **En revisión** o **Pendiente**. No se consideran cerradas hasta confirmación.
4. Las ideas descartadas no se reutilizan como si fueran nuevas. Si vuelven a estudiarse, se registra una nueva revisión vinculada a su entrada anterior.
5. Los números de balance pueden cambiar durante las pruebas. El cambio debe quedar registrado con motivo y fecha.
6. Esta bitácora registra tanto trabajo de diseño como trabajo técnico. Una cosa discutida pero no implementada no se marcará como implementada.
7. Antes de comenzar una tarea importante se debe consultar esta bitácora para comprobar qué ya existe, qué falta y qué fue descartado.

---

## Estado general

**Proyecto:** Baseball Waifus  
**Repositorio:** `jonhararagi/baseball-waifus`  
**Rama principal:** `main`  
**Estado actual:** Prototipo técnico en Godot 4.x + laboratorio de personajes + puente de streaming. El juego completo todavía no está terminado y varias áreas siguen en diseño/implementación.

### Cómo vamos

La idea base del juego está definida a nivel conceptual:

- Juego de béisbol con personajes femeninos adultos.
- Presentación anime/ecchi.
- Jugabilidad inspirada en la estructura de juegos como Baseball Heroes.
- Colección, crianza/herencia y progresión inspiradas en la lógica de colección de Dragon City, pero con sistemas propios.
- Rarezas de personajes: **R / SR / SSR / UR**.
- Combate basado en decisiones del jugador, estadísticas, timing, elementos, habilidades y equipamiento.
- Sistema de energía.
- Sistema permanente de felicidad/ánimo/confianza.
- Entrenamiento.
- Equipamiento.
- Gacha.
- Mapas y Demon Kings.
- Herencia/crianza de personajes.
- Torneos/PvP como sistemas posteriores.
- Desarrollo previsto mediante GitHub y, para el prototipo, se ha considerado Godot como opción principal y Unity como alternativa. El motor todavía no está confirmado.

---

# 1. HECHO / DEFINIDO A NIVEL DE DISEÑO

## 1.1 Concepto central

**Estado:** Definido conceptualmente.

El jugador construye equipos de béisbol usando personajes con diferentes especialidades, elementos, estadísticas, habilidades, rarezas y equipamiento.

El juego debe combinar:
- habilidad/decisión del jugador;
- progresión RPG;
- colección;
- construcción de equipos;
- crianza/herencia;
- gacha;
- contenido PvE;
- y, posteriormente, PvP.

---

## 1.2 Especialidades de personajes

**Estado:** Definido conceptualmente.

Especialidades trabajadas:

- Power / Home Run
- Contacto / técnica
- Runner / robo de bases
- Pitcher
- Catcher / receptor
- Defensa

No se ha cerrado todavía la lista final de posiciones, roles ni estadísticas exactas.

---

## 1.3 Rarezas

**Estado:** Definido.

Rarezas principales:

- R
- SR
- SSR
- UR

Se usarán tanto en personajes como en equipamiento, aunque las reglas exactas pueden variar según el sistema.

---

## 1.4 Sistema elemental

**Estado:** Concepto definido, elementos todavía sujetos a confirmación.

Elementos propuestos durante el diseño:

- 🔥 Fuego
- 💧 Agua
- ❄️ Hielo
- ⚡ Rayo
- 🌿 Naturaleza
- 🌑 Oscuridad
- ✨ Luz

Importante: la ventaja elemental no debe convertirse simplemente en "daño RPG". Debe modificar probabilidades y resultados del béisbol.

Ejemplo trabajado:
Un bateador de Fuego contra un pitcher de Hielo podría obtener una mayor probabilidad de contacto crítico o Home Run, pero no tendría el éxito garantizado.

**Pendiente:** tabla elemental definitiva y fórmula de influencia.

---

## 1.5 Estadísticas

**Estado:** En diseño. Se ha realizado una primera propuesta, pero todavía no está cerrada.

Estadísticas consideradas:

- Power
- Contact
- Speed
- Pitch
- Control
- Defense
- Critical
- Stamina
- Dexterity / Technique / Reaction, todavía en discusión

### Regla importante

Antes de programar se debe crear una tabla maestra que indique exactamente qué hace cada estadística. No agregar estadísticas que dupliquen funciones existentes.

**Pendiente:** lista definitiva y fórmula de cada estadística.

---

## 1.6 Sistema de bateo

**Estado:** Diseño conceptual avanzado.

Flujo trabajado:

1. El pitcher entra en preparación.
2. Tiene una ventana breve para elegir el lanzamiento.
3. El bateador decide si batear o intentar robo.
4. Si intenta robo, aparece una señal roja de advertencia.
5. El pitcher recibe una oportunidad de lanzar hacia la base correspondiente.
6. Si se batea, aparece un círculo de timing.
7. El jugador toca en el momento elegido.
8. El timing genera una calidad de contacto.
9. Estadísticas, elementos, habilidades, equipamiento y estado del personaje modifican el resultado.
10. El resultado puede ser Strike, Foul, Out, Hit o Home Run.
11. Los Hits pueden evolucionar posteriormente a Single, Double y Triple.

Calidades de timing propuestas:
- Perfect
- Great
- Good
- Normal
- Bad

**Pendiente:** fórmula matemática final.

---

## 1.7 Sistema de pitcher

**Estado:** Parcialmente definido.

Se establecieron **3 tipos de lanzamiento** como objetivo.

Ya definido:
- lanzamiento recto/básico;
- lanzamiento especial, presente en SSR y en algunos SR.

**Pendiente:** tercer tipo de lanzamiento y reglas exactas de los tres.

---

## 1.8 Filosofía de resolución del béisbol

**Estado:** Definida conceptualmente.

Las estadísticas establecen probabilidades y límites, pero las decisiones del jugador modifican el resultado.

Principio trabajado:

> Un personaje UR puede fallar si el jugador ejecuta mal la acción. Un personaje R puede conseguir un buen resultado si el timing y las circunstancias son favorables.

Se busca evitar un sistema completamente automático.

---

## 1.9 Energía

**Estado:** Definido conceptualmente.

- Personajes con energía, ejemplo trabajado: 0-100.
- Los partidos consumen energía.
- Bebidas energéticas restauran energía.
- Existe un límite diario de consumibles para evitar abusar de personajes UR/SSR.
- La energía no debería convertir al personaje en completamente inútil cuando llega a cero.

**Pendiente:** coste exacto por partido, regeneración y límite diario.

---

## 1.10 Felicidad / ánimo

**Estado:** Definido conceptualmente.

Existe un índice permanente de felicidad/ánimo/confianza.

Puede disminuir por:
- jugar;
- entrenar.

Puede recuperarse mediante:
- galletas;
- pasteles;
- otros alimentos futuros.

La felicidad debe producir efectos moderados y no hacer que el personaje sea directamente inutilizable.

**Pendiente:** nombre definitivo, fórmula y efectos.

---

## 1.11 Entrenamiento

**Estado:** Definido conceptualmente.

- El jugador puede dejar personajes entrenando durante un período.
- El entrenamiento aumenta estadísticas.
- Existe una posibilidad de obtener ganancias adicionales.

**Pendiente:** tipos de entrenamiento, duración, costes y fórmula de recompensa.

---

## 1.12 Mapas y campaña

**Estado:** Definido conceptualmente.

Cada zona tendrá:

- 10 mapas normales.
- 1 mapa de Demon King al final.

Límites de repetición:
- mapa normal: máximo 10 partidas;
- Demon King: máximo 3 partidas.

Objetivo: impedir farmear indefinidamente al jefe.

La estructura de dificultad considerada:
- Normal
- Hard
- Hell, posteriormente

Ejemplo de diseño discutido:
- Normal: Demon King obtenible como R.
- Hard: posibilidad de obtener/elevarlo a SR.

Los números de nivel, como Demon King alrededor de nivel 15 frente a personajes recomendados alrededor de nivel 20, son solamente ejemplos de balance y no están fijados.

---

## 1.13 Demon Kings

**Estado:** Definido conceptualmente.

Los Demon Kings:

- son jefes;
- son personajes jugables;
- tienen elemento;
- poseen una habilidad/ataque especial distintivo;
- pueden obtenerse en el sistema de campaña;
- pueden tener fragmentos;
- 100 fragmentos pueden servir para elevar un Demon King de R a SR, según el diseño actual;
- una habilidad especial podría heredarse mediante crianza con una probabilidad baja.

**Pendiente:** Demon Kings individuales, estadísticas, elementos y habilidades.

**No resuelto todavía:** equilibrio a largo plazo cuando aparezcan personajes nuevos y los Demon Kings antiguos pierdan poder relativo. No diseñar este problema hasta que sea necesario.

---

## 1.14 Recompensas de mapas

**Estado:** Definido conceptualmente.

Las victorias pueden entregar:

- EXP;
- monedas;
- materiales;
- equipamiento;
- botellas de energía;
- comida para felicidad;
- otros recursos.

Puede existir una probabilidad pequeña de conseguir consumibles especiales.

---

## 1.15 Equipamiento

**Estado:** Definido conceptualmente.

Tipos considerados:

- Guantes
- Bates
- Gorras
- Chalecos
- Faldas
- Zapatos

Rarezas:
- R
- SR
- SSR
- UR

Reglas visuales trabajadas:
- R: equipamiento/base sencillo.
- SR: principalmente cambios de color.
- SSR/UR: pueden modificar de manera importante el aspecto del personaje.

El equipamiento también modifica estadísticas.

Regla importante:
**SSR y UR de equipamiento no deberían obtenerse normalmente de los mapas; se reservan para gacha.**

**Pendiente:** estadísticas por pieza, costes de mejora y reglas de duplicados.

---

## 1.16 Gacha

**Estado:** Concepto definido, sistema incompleto.

Se contemplan banners para:
- personajes;
- equipamiento;
- trajes;
- otros objetos futuros.

**Pendiente:**
- tasas;
- pity;
- moneda;
- tickets;
- duplicados;
- garantía;
- banners;
- límites y reglas de obtención.

---

## 1.17 Trajes y apariencia

**Estado:** Concepto definido.

Ejemplos trabajados:
- Bunny
- Enfermera
- Karateka
- Idol
- Verano
- Invierno

El juego busca una estética anime/ecchi con personajes adultos y diversidad corporal.

La apariencia no debe depender obligatoriamente de la función competitiva.

---

## 1.18 Diversidad corporal y visual

**Estado:** Requisito de diseño.

Se busca variedad real entre personajes adultos:

- alturas;
- complexiones;
- busto;
- proporciones;
- tonos de piel;
- cabello;
- edades adultas visualmente diferenciadas;
- inspiraciones culturales variadas.

También se ha establecido que personajes adultos pueden tener diseños muy bajos o pequeños, siempre que sean personajes adultos dentro del juego.

La cultura/origen no debe determinar automáticamente elemento o estadísticas.

---

## 1.19 Crianza / herencia

**Estado:** Concepto avanzado, números pendientes.

Dos personajes pueden producir una hija.

La descendiente puede heredar probabilísticamente:

- elemento;
- estadísticas;
- especialización;
- potencial;
- habilidades activas;
- habilidades pasivas;
- altura;
- complexión;
- proporciones corporales;
- tono de piel;
- cabello;
- otros rasgos visuales.

La hija no debe ser una copia exacta. Puede combinar rasgos parentales y presentar variación.

Ejemplo trabajado:
Una madre SSR de Fuego con Power 85 y habilidad Home Run + un padre SR de Rayo con Speed 88 y habilidad Dash puede producir una hija con combinación de elementos/estadísticas y probabilidades de herencia de habilidades.

También se planteó que personajes R pueden conservar valor como padres genéticos aunque sean débiles competitivamente.

**Pendiente:** algoritmo de herencia y porcentajes definitivos.

---

## 1.20 Fusión / evolución por rareza

**Estado:** Idea de sistema probada conceptualmente, no cerrada.

Ejemplo discutido:
- R + R: 20% de posibilidad de convertirse en SR.
- El elemento de los padres podría tener una probabilidad favorable.
- Transiciones de rareza superiores tendrían probabilidades menores.

**Estado actual:** no convertir estos números en reglas definitivas todavía.

---

## 1.21 Modos de juego

**Estado:** Planificado.

- Historia / campaña
- Mapas
- Demon Kings
- Torneos contra IA
- PvP
- Eventos futuros

El PvP se deja para una etapa avanzada debido a:
- red;
- sincronización;
- matchmaking;
- backend;
- seguridad;
- anti-cheat.

---

# 2. ESTRUCTURA DE DESARROLLO PROPUESTA

**Estado:** Planificada.

### Fase 1: Prototipo
- campo;
- pitcher;
- bateador;
- pelota;
- timing;
- hit;
- out;
- Home Run;
- marcador.

### Fase 2: Sistema de béisbol
- bases;
- corredores;
- robos;
- outs;
- strikes;
- balls;
- fouls;
- innings;
- defensa;
- tipos de lanzamiento.

### Fase 3: RPG
- personajes;
- estadísticas;
- niveles 1-100;
- elementos;
- habilidades;
- rarezas.

### Fase 4: Progresión
- energía;
- felicidad;
- entrenamiento;
- materiales;
- monedas;
- equipamiento;
- inventario.

### Fase 5: Historia
- zonas;
- 10 mapas por zona;
- Demon Kings;
- Normal/Hard;
- fragmentos;
- R/SR.

### Fase 6: Crianza
- padres;
- descendientes;
- herencia;
- probabilidades;
- elementos;
- habilidades;
- evolución.

### Fase 7: Gacha
- banners;
- tasas;
- tickets;
- gemas;
- pity;
- duplicados;
- equipamiento SSR/UR.

### Fase 8: Torneos
- equipos IA;
- dificultad;
- recompensas;
- ranking;
- temporadas.

### Fase 9: PvP
- multiplayer;
- backend;
- sincronización;
- matchmaking;
- seguridad.

### Fase 10: Contenido
- zonas nuevas;
- personajes;
- elementos;
- Demon Kings;
- trajes;
- eventos;
- equipamiento;
- animaciones;
- historia.

---

# 3. LO QUE FALTA DEFINIR

## Prioridad alta antes de programar el sistema completo

- [ ] Elegir motor: Godot / Unity.
- [ ] Cerrar estadísticas definitivas.
- [ ] Crear tabla maestra de qué hace cada estadística.
- [ ] Definir fórmula de contacto.
- [ ] Definir fórmula de defensa.
- [ ] Definir fórmula de pitcher.
- [ ] Definir los 3 tipos de lanzamiento.
- [ ] Definir sistema de strikes/balls/fouls.
- [ ] Definir innings y reglas completas del partido.
- [ ] Definir posiciones y cantidad de jugadoras en campo.
- [ ] Definir tabla elemental.
- [ ] Definir habilidades.
- [ ] Definir progresión de nivel 1-100.
- [ ] Definir entrenamiento.
- [ ] Definir energía.
- [ ] Definir felicidad.
- [ ] Definir equipamiento.
- [ ] Definir crianza/herencia.
- [ ] Definir gacha.
- [ ] Definir economía y monedas.
- [ ] Definir guardado de datos.
- [ ] Definir estructura técnica del proyecto.

## Prioridad media

- [ ] Historia inicial.
- [ ] Primeras zonas.
- [ ] Primeros Demon Kings.
- [ ] Personajes iniciales.
- [ ] Animaciones.
- [ ] UI.
- [ ] Sonido/música.
- [ ] Eventos.
- [ ] Torneos.

## Prioridad posterior

- [ ] PvP.
- [ ] Backend online.
- [ ] Anti-cheat.
- [ ] Temporadas.
- [ ] Contenido masivo.

---

# 4. PRUEBAS Y EXPERIMENTOS REALIZADOS

Esta sección distingue entre **pruebas conceptuales** y pruebas reales de código.

## Prueba conceptual: timing + estadísticas

Se probó mediante diseño la idea de que el timing del jugador modifique una probabilidad base determinada por las estadísticas.

**Resultado:** concepto conservado.

## Prueba conceptual: elemento como modificador

Se probó la idea de utilizar ventaja elemental para modificar probabilidades de béisbol en lugar de convertir el sistema en daño RPG.

**Resultado:** concepto conservado.

## Prueba conceptual: energía limitada

Se analizó el uso de energía + bebidas con límite diario para evitar abuso de personajes fuertes.

**Resultado:** concepto conservado.

## Prueba conceptual: límites de repetición

Se establecieron 10 intentos por mapa normal y 3 por Demon King.

**Resultado:** concepto conservado.

## Prueba conceptual: Demon King R → SR mediante fragmentos

Se planteó el uso de 100 fragmentos para elevar al Demon King.

**Resultado:** sistema provisional conservado.

## Prueba conceptual: herencia genética

Se probó la combinación probabilística de estadísticas, elementos, habilidades y rasgos visuales.

**Resultado:** concepto conservado, fórmula pendiente.

## Prueba técnica

El estado inicial de esta sección era "sin prototipo". Desde la Revisión 2 existe un prototipo técnico en Godot con campo, pitcher, bateadora, timing, resultados básicos, bases, carreras, marcador, robo y HUD. Desde la Revisión 3 existe además un laboratorio procedural de avatar y un bridge local de tracking.

**Validación pendiente:** no se ha ejecutado una prueba hardware end-to-end en este entorno, por lo que el código se considera implementado pero el runtime físico sigue pendiente de validar.

---

# 5. REVISIONES

## Revisión 0: creación de la bitácora

**Fecha:** 2026-09-20  
**Motivo:** establecer un registro único para impedir repeticiones vacías y conservar el historial de diseño.

**Resultado:** esta bitácora pasa a ser el documento de referencia para saber qué se hizo, qué se probó y qué queda pendiente.

---

# 6. DESCARTADO / NO VIGENTE

Esta sección debe registrar ideas que hayan sido rechazadas para evitar que vuelvan a aparecer como si fueran nuevas.

**Actualmente:** no hay una lista histórica completa de descartes porque el repositorio acaba de iniciar su documentación.

Cuando una idea sea descartada en adelante, registrar:
- qué era;
- por qué se descartó;
- fecha;
- si puede volver a revisarse;
- qué decisión la reemplazó.

---

# 7. HISTORIAL DE DECISIONES IMPORTANTES

| ID | Tema | Estado | Última revisión |
|---|---|---|---|
| G-001 | Concepto Baseball Waifus | Definido | 2026-09-20 |
| G-002 | Rarezas R/SR/SSR/UR | Definido | 2026-09-20 |
| G-003 | Elementos | En revisión | 2026-09-20 |
| G-004 | Estadísticas | En revisión | 2026-09-20 |
| G-005 | Timing de bateo | Definido conceptualmente | 2026-09-20 |
| G-006 | Tipos de lanzamiento | En desarrollo | 2026-09-20 |
| G-007 | Energía | Definido conceptualmente | 2026-09-20 |
| G-008 | Felicidad | Definido conceptualmente | 2026-09-20 |
| G-009 | Entrenamiento | Definido conceptualmente | 2026-09-20 |
| G-010 | Mapas 10 + Demon King | Definido conceptualmente | 2026-09-20 |
| G-011 | Límite Demon King 3 intentos | Definido conceptualmente | 2026-09-20 |
| G-012 | Equipamiento | Definido conceptualmente | 2026-09-20 |
| G-013 | Gacha | En desarrollo | 2026-09-20 |
| G-014 | Crianza/herencia | En desarrollo | 2026-09-20 |
| G-015 | Torneos | Planificado | 2026-09-20 |
| G-016 | PvP | Planificado, posterior | 2026-09-20 |
| G-017 | Motor | Godot 4.x adoptado para el prototipo | 2026-09-20 |

---

# 8. PROTOCOLO PARA FUTURAS REVISIONES

Cuando revisemos un sistema, no se reemplazará silenciosamente su historia.

Se debe registrar:

**ID del sistema:**  
**Número de revisión:**  
**Fecha:**  
**Qué existía antes:**  
**Qué se cambia:**  
**Por qué se cambia:**  
**Qué se probó:**  
**Resultado:**  
**Nueva decisión:**  
**Qué queda pendiente:**  

Una revisión que concluya que la versión anterior sigue siendo correcta también puede registrarse, pero no se debe volver a reconstruir todo el sistema sin motivo.

---

# 9. PRÓXIMO PASO RECOMENDADO

El siguiente bloque de trabajo debería ser **cerrar el núcleo del partido de béisbol antes de construir gacha, crianza y contenido masivo**.

Orden recomendado:

1. Estadísticas definitivas.
2. Tabla de interacción de estadísticas.
3. Pitcher y 3 lanzamientos.
4. Timing de bateo.
5. Resultado del contacto.
6. Bases, carreras y outs.
7. Robos.
8. Defensa.
9. Prototipo jugable mínimo.

Una vez que ese núcleo funcione, el resto de los sistemas podrá construirse encima sin tener que rehacer constantemente la base.


# 10. Revisión 1: Documento Maestro de Diseño Integral v1.0

**Fecha:** 2026-09-20  
**Sistema:** G-001 a G-017 y sistemas derivados  
**Motivo:** consolidar las ideas internas del proyecto con patrones de diseño externos del género y convertirlas en una especificación integral apta para iniciar implementación.

### Qué existía antes

Existían sistemas conceptuales separados para:
- partido;
- timing;
- estadísticas;
- elementos;
- energía;
- felicidad;
- entrenamiento;
- campaña;
- Demon Kings;
- equipamiento;
- gacha;
- crianza;
- fusión;
- torneos;
- PvP.

Muchos tenían números todavía provisionales.

### Qué se cambia

Se crea `docs/game-design.md` como Documento Maestro de Diseño Integral v1.0.

Se fijan como baseline de diseño:
- 8 estadísticas principales;
- 3 tipos de lanzamiento;
- 5 niveles de timing;
- 9 posiciones;
- 6 especializaciones;
- 7 elementos;
- niveles 1-100;
- potencial 1-5;
- energía 0-100;
- felicidad 0-100;
- 6 ranuras de equipo;
- campaña de 10 mapas + Demon King;
- límites de 10 intentos normales y 3 de Demon King;
- crianza probabilística;
- fusión R+R como sistema separado de crianza;
- torneos antes de PvP;
- arquitectura de datos desacoplada de la presentación.

### Resultado

**Diseño integral disponible para comenzar el prototipo.**

Los valores numéricos se consideran baseline de prueba, no balance definitivo. Cualquier cambio posterior debe registrarse como nueva revisión.

### Trabajo externo

Se estableció formalmente que los recursos externos pueden utilizarse para:
- estudiar arquitectura;
- reutilizar código con licencia compatible;
- reutilizar assets con licencia compatible;
- estudiar animación y flujos de producción.

No se copiarán recursos propietarios de Baseball Heroes u otros juegos.

### Importante

La implementación técnica sigue siendo **0% implementada como juego completo**. El documento de diseño no debe confundirse con código funcional.

### Próxima revisión recomendada

Implementar el prototipo mínimo:
**pitcher → lanzamiento → timing → contacto → hit/out/Home Run → marcador.**


# 11. Revisión 2: Primer esqueleto técnico ejecutable

**Fecha:** 2026-09-20  
**Tipo:** Implementación técnica.

Se creó el primer esqueleto modular del juego en Godot 4.x.

Archivos principales:
- `project.godot`
- `scenes/main.tscn`
- `scenes/main.gd`
- `game/characters/player_data.gd`
- `game/baseball/pitch.gd`
- `game/baseball/baseball_simulator.gd`
- `game/baseball/game_state.gd`
- `game/baseball/runner_system.gd`
- `game/ai/opponent_ai.gd`
- `game/ui/hud.gd`

### Implementado

- campo procedural;
- pitcher y bateadora de demostración;
- tres tipos de pitch;
- desplazamiento de pelota;
- minijuego de timing;
- cálculo de probabilidad de contacto;
- elementos Fire/Ice con modificador;
- Single/Double/Triple/Home Run;
- Strike/Foul/Out;
- bases;
- carreras;
- outs;
- innings;
- marcador;
- intento de robo;
- IA básica de selección de lanzamiento;
- HUD;
- controles de teclado y mouse;
- arquitectura modular separada.

### Correcciones realizadas durante la implementación

- Se reemplazaron rangos implícitos por `range(3)` en el estado del partido.
- Se simplificó el mapa de inputs para utilizar eventos directos de Godot y evitar dependencias innecesarias del formato del proyecto.

### Estado técnico

**Implementado:** núcleo inicial de prototipo.  
**No implementado:** juego completo, roster, gacha, crianza, economía, campaña completa, assets finales, animaciones finales, audio, backend y PvP.

La próxima revisión debe probar el proyecto en una instalación real de Godot y corregir cualquier error de ejecución antes de añadir sistemas secundarios.


# 12. Revisión 3: Herramienta de Streaming + Anime Avatar Lab

**Fecha:** 2026-09-20  
**Tipo:** Implementación técnica y ampliación de arquitectura.

### Motivo

El proyecto necesitaba una ruta práctica para probar el cuerpo, las poses y el movimiento de las jugadoras antes de invertir en sprites, rig 2D, Live2D o modelos 3D definitivos. También se incorporó una base de streaming que pueda convivir con OBS sin convertir OBS en una dependencia del núcleo del juego.

### Investigación realizada

Se revisaron proyectos y patrones públicos de tracking/avatar. OpenSeeFace fue especialmente útil como referencia porque documenta tracking facial por webcam con transporte UDP y una arquitectura desacoplada. También se identificó VRM/three-vrm como ruta futura para avatares 3D.

Decisión: no copiar código ni assets de terceros. Para el primer prototipo se implementa un avatar 2D procedural propio y un contrato de tracking pequeño.

### Implementado

- `game/avatar/avatar_profile.gd`
  - perfil editable de personaje;
  - altura;
  - hombros;
  - cintura;
  - cadera;
  - busto;
  - cabeza;
  - colores;
  - cabello.

- `game/avatar/anime_avatar_2d.gd`
  - cuerpo anime procedural;
  - cabeza, cabello, ojos, ropa, brazos y piernas;
  - movimiento Idle/Walk/Run;
  - poses Bat/Pitch/Catch;
  - Celebrate y Hit Reaction;
  - respuesta a yaw, roll, blink y mouth provenientes del tracking.

- `game/streaming/tracking_receiver.gd`
  - receptor UDP local en 127.0.0.1:8765;
  - convierte JSON de tracking en datos para el avatar.

- `scenes/avatar_lab.tscn` + `scenes/avatar_lab.gd`
  - laboratorio independiente;
  - controles para cambiar poses;
  - controles para modificar proporciones corporales durante la prueba.

- `tools/streaming_bridge`
  - OpenCV para webcam;
  - MediaPipe Face Mesh para tracking facial;
  - sounddevice para nivel de audio;
  - mss como módulo de captura de pantalla disponible para la herramienta;
  - obsws-python para control opcional de OBS WebSocket;
  - transporte JSON/UDP hacia Godot;
  - configuración externa en `config.json`.

### Estado de esta revisión

**Implementado en código:** arquitectura base del streaming y primer cuerpo anime funcional como prototipo.

**No implementado todavía:** captura de video/audio dentro de OBS mediante el bridge, rig artístico final, Live2D, VRM/Three.js, físicas secundarias de pelo/ropa, lip-sync avanzado, expresiones completas, compositor propio, grabación, escenas automáticas y sistema final de creación de personajes.

### Importante sobre pruebas

Los archivos fueron incorporados al repositorio, pero en este entorno no existe una instalación de Godot, cámara, micrófono u OBS ejecutándose para hacer una prueba de hardware end-to-end. Por tanto, esta revisión se marca como **código implementado, validación de runtime pendiente**, no como integración hardware ya verificada.

### Porcentaje de trabajo

Estimación de avance global del proyecto, contando diseño + implementación real y ponderando los sistemas todavía ausentes:

**≈ 24% completado.**

El porcentaje no significa que el 24% del código final exista. Significa que aproximadamente una cuarta parte del alcance técnico previsto ya tiene especificación consolidada o prototipo funcional. El núcleo de partido y el primer laboratorio de avatar están ahora mucho más adelantados que economía, contenido, arte final, crianza, gacha, torneos y PvP.

### Próximo bloque

1. Validar el Avatar Lab en Godot.
2. Validar el bridge con webcam y MediaPipe.
3. Conectar una jugadora real del roster al `AvatarProfile`.
4. Separar capas de cabello/ropa/equipamiento.
5. Añadir un rig 2D artístico intercambiable.
6. Después, evaluar VRM/Three.js o Live2D como backend visual opcional.
7. Volver al núcleo de béisbol para completar defensa, balls, fouls, innings y roster.


# 13. Revisión 4: Motor de probabilidades sin IA

**Fecha:** 2026-09-20  
**Tipo:** Arquitectura de sistemas / anti-exploit / economía.

### Decisión

Se descarta la necesidad de una IA interna para decidir recompensas, drops o probabilidades. El proyecto utilizará tablas de probabilidades explícitas, versionadas y auditables.

La razón es de control: una tabla puede expresar exactamente qué puede caer en cada zona, dificultad, objeto o actividad. La IA no tendrá autoridad para inventar o alterar resultados.

### Implementado

- ProbabilityTable: pesos y normalización.
- DropTable: tablas identificadas y versionadas.
- RewardResolver: tiradas aleatorias reproducibles mediante seed para QA.
- GameTables: primeras tablas para campaña, fragmentos de Demon King y fusión.
- ProbabilityAudit: conteo de resultados y comparación contra distribución esperada.
- AntiExploit: límites de ejecuciones por actividad.
- RewardService: única capa que resuelve recompensas y valida contexto.
- Documento de arquitectura de probabilidades.

### Regla fundamental

Un mapa no obtiene sus recompensas mediante una IA. Obtiene sus recompensas mediante una tabla asociada al contexto.

Ejemplo conceptual:

zona + dificultad + actividad + objeto -> tabla -> tirada -> resultado

Los límites se verifican antes de la tirada. Por diseño actual:
- Normal: 10 ejecuciones;
- Hard: 10;
- Hell: 10;
- Demon King: 3.

### Protección contra el problema planteado

No se confía en que una IA se comporte correctamente para evitar una explotación. La cantidad de ejecuciones y las tablas están separadas.

Tampoco se utiliza una simple probabilidad global para todos los mapas. Cada tabla puede tener pesos diferentes.

### Estado

**Implementado:** infraestructura base.

**Pendiente:** completar las tablas definitivas de todo el juego, definir todos los pools de objetos, pity/garantías, inventario persistente, panel de balance y pruebas estadísticas automáticas.

### Revisión contabilizada

La revisión 4 reemplaza la idea de una IA decisora de recompensas por un sistema explícito de reglas. No se debe volver a diseñar este punto desde cero salvo que se cambie deliberadamente la arquitectura.


# 14. Revisión 5: Character Creator + Streaming Bridge endurecido

**Fecha:** 2026-09-20  
**Tipo:** Implementación técnica / herramientas de producción.

### Motivo

La primera versión del Avatar Lab servía para demostrar que era posible dibujar y mover un cuerpo anime, pero todavía no funcionaba como una herramienta reutilizable de creación de jugadoras. El bridge de streaming también necesitaba un contrato de datos más explícito y tolerancia a dispositivos ausentes.

### Qué existía antes

- AvatarProfile con proporciones básicas.
- AnimeAvatar2D procedural con varias poses.
- TrackingReceiver UDP simple.
- Bridge Python con OpenCV, MediaPipe, audio y OBS.
- Avatar Lab manual.

### Qué se cambia

Se introduce una capa de datos de personaje visual más completa y un diseñador independiente:

- game/avatar/avatar_profile.gd
  - presets de cuerpo;
  - estilos de cabello;
  - estilos de uniforme;
  - formas de rostro;
  - colores;
  - gorra;
  - serialización JSON;
  - generación aleatoria con seed.

- game/avatar/avatar_profile_store.gd
  - guardado/carga de perfiles;
  - carpeta user://baseball_waifus/characters/.

- scenes/character_creator.tscn
- scenes/character_creator.gd
  - sliders de cuerpo;
  - selectores;
  - colores;
  - poses;
  - generar;
  - guardar/cargar;
  - reset.

- game/avatar/anime_avatar_2d.gd
  - render procedural de cabello, rostro, gorra, uniforme y silueta;
  - lectura del tracking facial;
  - reutilización de poses.

- tools/streaming_bridge/protocol.py
  - protocolo baseball-waifus-tracking v1;
  - separación de tracking/audio/capture.

- tools/streaming_bridge/tracker.py
  - suavizado configurable para reducir jitter.

- tools/streaming_bridge/capture.py
  - webcam validable;
  - audio tolerante a fallos;
  - captura de pantalla opcional.

- tools/streaming_bridge/main.py
  - pipeline unificado;
  - configuración externa;
  - diagnóstico opcional de pantalla;
  - limpieza segura de recursos.

- game/streaming/tracking_receiver.gd
  - compatibilidad con el envoltorio de protocolo;
  - timeout de tracking obsoleto;
  - señales tracking_updated y tracking_lost.

- documentación actualizada en README.md y docs/streaming-architecture.md.

### Investigación externa

Para la elección de arquitectura se consultaron repositorios públicos de referencia y documentación disponible en GitHub, especialmente patrones de OpenSeeFace e Inochi2D. No se incorporó código ni assets de esos proyectos.

### Resultado

Ahora existe una cadena coherente:

**Diseñador → AvatarProfile → Renderer procedural → TrackingReceiver → Streaming Bridge → OBS**

La misma estructura de perfil puede utilizarse posteriormente para reemplazar el dibujo procedural por un rig artístico 2D, Live2D, VRM/Three.js o un modelo propio.

### Estado

**Implementado en código:** Character Creator, persistencia de perfiles, poses, tracking versionado, smoothing, audio/screen capture modular y manejo de tracking obsoleto.

**Pendiente:** prueba real con Godot + webcam + micrófono + OBS, arte final, rig 2D profesional, Live2D/VRM y conexión definitiva con el roster del juego.

### Porcentaje global revisado

Conservando la misma métrica aproximada utilizada en la Revisión 3 y contabilizando el nuevo bloque técnico, el avance global estimado pasa de **≈24% a ≈27%**.

El 27% no significa que el 27% de los assets finales estén terminados. Representa el avance ponderado del alcance técnico conocido: diseño maestro consolidado, prototipo de béisbol, sistema explícito de probabilidades, herramientas de avatar/streaming y una parte todavía pequeña de progresión/contenido.

### Regla de continuidad

La herramienta de diseño de personajes y el bridge ya no deben rediseñarse desde cero. Las próximas revisiones deben ampliar estas capas o reemplazar componentes concretos con una razón registrada.

### Próximo bloque recomendado

1. Validar runtime del Character Creator y Streaming Bridge en hardware real.
2. Conectar AvatarProfile con datos reales de PlayerData.
3. Completar el núcleo de béisbol pendiente.
4. Expandir el motor central de probabilidades para economía, gacha, crianza, entrenamiento y equipamiento.
