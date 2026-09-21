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
**Estado actual:** Prototipo técnico en Godot 4.x + laboratorio de personajes + puente de streaming + rig procedural interno. Godot 4.x queda adoptado como motor del prototipo y del juego actual; los adapters externos siguen siendo una capa visual opcional.

**Avance global revisado:** ≈70%.

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
- Desarrollo mediante GitHub con Godot 4.x como motor adoptado. Unity deja de ser una vía activa del prototipo salvo una decisión futura explícita.

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

- [x] Motor del prototipo: Godot 4.x.
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
| G-018 | Rig procedural articulado | Implementado en prototipo | 2026-09-20 |
| G-019 | Streaming healthcheck y dependencias opcionales | Implementado | 2026-09-20 |
| G-020 | Tracking recorder/replay JSONL | Implementado en prototipo | 2026-09-20 |
| G-021 | Validación de orden y origen de tracking/host | Implementado | 2026-09-20 |
| G-022 | Panel local de control del Streaming Bridge | Implementado en prototipo | 2026-09-20 |
| G-023 | Control de grabación desde dashboard | Implementado en prototipo | 2026-09-20 |

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


# 15. Revisión 6: Adaptador PlayerData → AvatarProfile

**Fecha:** 2026-09-20  
**Tipo:** Integración de datos / desacoplamiento visual.

### Qué se añade

Se crea `game/avatar/player_avatar_adapter.gd` para convertir una jugadora del roster (`PlayerData`) en un perfil visual (`AvatarProfile`).

El adaptador usa información que ya existe en el juego:
- especialización para seleccionar una silueta base;
- posición para detalles funcionales como gorra de pitcher;
- elemento para el acento cromático;
- id para que la generación inicial sea estable y reproducible.

También se añade al Character Creator un botón de prueba de roster que construye una jugadora SSR de demostración y la pasa por el adaptador.

### Decisión arquitectónica

No se mezclan estadísticas, probabilidades o lógica de partido dentro del renderer. `PlayerData` describe gameplay, `AvatarProfile` describe apariencia y `PlayerAvatarAdapter` hace la conversión.

Esto permite cambiar el sistema visual por un rig 2D, Live2D, VRM/Three.js o un modelo 3D sin modificar el núcleo de béisbol.

### Resultado

**Implementado:** primera ruta completa de roster → cuerpo → poses → tracking.

**Pendiente:** cargar perfiles visuales específicos desde datos persistentes del roster, sistema definitivo de cabello/ropa/equipamiento por piezas y arte final.

### Porcentaje

El avance global se mantiene en **≈27%**. La integración mejora la reutilización del prototipo, pero no representa una gran fracción del alcance total del juego.


# 16. Revisión 7: Pipeline de concept art anime + poses de béisbol

**Fecha:** 2026-09-20  
**Tipo:** Herramientas de arte / integración local / animación.

### Motivo

El prototipo ya podía dibujar un cuerpo, pero necesitaba una forma rápida de comparar diseños anime antes de crear arte final. Además, las poses disponibles no cubrían todas las acciones que el juego necesitará.

### Investigación

Se revisaron ComfyUI como backend de generación y la familia Inochi2D como opción de rigging 2D. ComfyUI expone una API local y workflows reutilizables; Inochi2D dispone de runtime 2D y binding para Godot.

También se documentaron familias de checkpoints anime candidatas, incluyendo Animagine XL, Illustrious XL, NoobAI-XL y Pony/SDXL. No se incorporaron checkpoints al repositorio y no se fijó un ranking permanente porque versiones y licencias cambian.

### Implementado

Nuevo módulo `tools/character_ai`:

- `config.json`
- `style_presets.json`
- `model_profiles.json`
- `workflow_sdxl.json`
- `prompt_builder.py`
- `comfy_client.py`
- `generate_service.py`
- `art_server.py`
- `README.md`

El Character Creator ahora tiene botón `AI ref`. Envía `AvatarProfile` al bridge local, genera una referencia mediante ComfyUI y muestra la imagen resultante dentro del editor.

También se creó `tools/run_local_tools.py`, que supervisa el Streaming Bridge y el Character AI Bridge como un conjunto.

### Lenguaje visual fijado para pruebas

El preset de Baseball Waifus busca anatomía adulta, proporciones shonen heroicas, cuerpos atléticos con formas suaves y algo más llenas, ojos expresivos, cel shading limpio, colores vivos, silueta clara y fanservice adulto moderado.

Se excluyen de forma explícita chibi, anatomía infantil y la imitación directa de la identidad visual de franquicias concretas.

### Movimiento añadido

`AnimeAvatar2D` amplía sus poses:

- Throw
- Steal
- Slide
- Out
- Defeat
- Menu Idle

Además se añade movimiento secundario procedural sencillo en cabello y nuevas señales visuales de acción.

### Regla arquitectónica

La IA de imágenes solo produce **referencias de arte**. Nunca decide stats, probabilidades, drops, gacha, crianza ni resultados del partido.

### Estado

**Implementado en código:** pipeline local de referencia anime, integración con Character Creator, nuevo conjunto de poses y launcher de herramientas.

**Pendiente:** probar ComfyUI realmente con un checkpoint local, seleccionar el checkpoint final del proyecto mediante comparación visual, crear arte de producción, rig profesional Inochi2D/Live2D y conectar piezas de ropa/equipamiento como capas independientes.

### Porcentaje global revisado

El avance global estimado pasa de **≈27% a ≈29%**. El aumento refleja una herramienta de producción más completa y una mayor parte del pipeline visual ya prototipada, pero el núcleo de economía, roster completo, campaña, gacha, crianza, contenido y backend sigue pendiente.

### Regla de continuidad

ComfyUI queda como proveedor opcional y reemplazable. El juego no depende de un modelo de generación concreto.

# 17. Revisión 8: Avatar por capas + banco de movimiento + benchmark de modelos

**Fecha:** 2026-09-20  
**Tipo:** Arquitectura visual / animación / herramientas de producción.

### Motivo

La Revisión 7 ya permitía generar referencias anime y ejecutar varias poses, pero ropa, equipamiento y acciones todavía estaban demasiado acoplados al renderer. También faltaba una prueba automática de la secuencia de movimientos.

### Implementado

Se añade:

- `game/avatar/avatar_equipment.gd`: ranuras visuales de bate, guantes, gorra, chaleco, falda y calzado.
- `game/avatar/avatar_visual_catalog.gd`: catálogo de colores y variantes visuales.
- `game/avatar/avatar_motion_controller.gd`: acciones temporales que regresan automáticamente a Idle.
- `scenes/avatar_motion_test.tscn` + `avatar_motion_test.gd`: recorrido automático de acciones de béisbol.
- `docs/avatar-visual-system.md`: contrato visual por capas.

`AvatarProfile` ahora guarda el equipamiento junto con el perfil y admite el preset corporal `shonen_soft`.

El Character Creator expone las piezas visuales y el estilo de arte `soft`, `ecchi` o `rig`.

`PlayerAvatarAdapter` asigna visualmente la silueta, acentos y equipo inicial según la especialización, posición y elemento de `PlayerData`.

### Pipeline de modelos

Se añadió un benchmark determinista para checkpoints locales de ComfyUI:

- `benchmark_models.json`
- `benchmark_models.py`

El benchmark utiliza el mismo personaje, seed, resolución, prompt y negative prompt para cada checkpoint configurado.

Familias preparadas:
- Animagine XL
- Illustrious XL
- NoobAI-XL
- Pony/SDXL

No se declara una ganadora global ni se distribuyen checkpoints. La comparación real se hará con las versiones exactas instaladas y sus licencias.

### Estilo visual actualizado

El preset corporal `shonen_soft` busca precisamente la característica solicitada para Baseball Waifus: proporciones anime heroicas, redondeadas, atléticas y algo más llenas, sin usar una copia directa de Fairy Tail ni de otra franquicia.

El preset de arte por defecto del generador pasó a `baseball_waifus_ecchi`, manteniendo controles negativos para evitar anatomía infantil, chibi y contenido sexual explícito.

### Estado

**Implementado en código:** sistema visual por capas, persistencia, equipamiento, controlador de acciones, escena de prueba automática, benchmark de checkpoints y selección de estilo desde el editor.

**Pendiente:** validación real en Godot, ejecución real de ComfyUI con los checkpoints locales, selección final mediante benchmark, arte de producción, rig 2D definitivo y conexión completa de equipamiento con el sistema de estadísticas.

### Porcentaje global revisado

El avance global estimado pasa de **≈29% a ≈31%**.

Este valor representa el alcance técnico ponderado. El juego completo sigue lejos de estar terminado porque economía, gacha, crianza, campaña completa, roster final, contenido, PvP, backend y arte de producción todavía representan una parte grande del trabajo.

### Regla de continuidad

El avatar por capas es ahora la base visual vigente. No se debe volver al renderer monolítico anterior salvo para comparar una regresión o reemplazar una capa concreta.

# 18. Revisión 9: Avatares persistentes y movimiento conectado al partido

**Fecha:** 2026-09-20
**Tipo:** Integración de roster / presentación de partido / persistencia visual.

### Motivo

La revisión 8 ya tenía cuerpo procedural, capas visuales, equipamiento, poses y una escena automática de prueba. El siguiente paso útil era comprobar que ese mismo personaje no fuera solo un laboratorio aislado, sino una parte real del partido.

No se rediseña el sistema visual por capas. Se añade una capa de integración encima.

### Implementado

- `game/avatar/avatar_roster_service.gd`
  - resuelve el perfil visual persistente de una jugadora;
  - crea el perfil desde `PlayerAvatarAdapter` solo cuando no existe;
  - permite guardar, borrar y listar perfiles por jugadora.

- `game/avatar/avatar_profile_store.gd`
  - añade perfiles identificados por `player_<id>.json`;
  - mantiene la persistencia visual separada de `PlayerData`.

- `game/avatar/avatar_match_presenter.gd`
  - instancia los avatares de batter y pitcher;
  - usa `AvatarMotionController`;
  - traduce fases y resultados del partido a poses;
  - maneja robo de base y final del partido.

- `scenes/main.gd`
  - conecta el presenter al partido;
  - el pitcher cambia de pose durante el lanzamiento;
  - el bateador entra en pose de timing;
  - los resultados activan reacciones visuales;
  - el robo dispara Steal/Run;
  - el final del partido dispara Celebrate/Defeat.

- `docs/avatar-visual-system.md`
  - documenta la frontera PlayerData → AvatarProfile;
  - documenta el nuevo presenter y el flujo de acciones.

- `README.md`
  - documenta la integración del roster visual con el partido.

### Arquitectura resultante

```
PlayerData
    ↓
AvatarRosterService
    ↓
AvatarProfile
    ↓
AnimeAvatar2D
    ↑
AvatarMatchPresenter
    ↑
Baseball match state/events
```

El presenter solamente expresa el resultado del sistema de juego visualmente. No calcula estadísticas, no decide probabilidades y no entrega recompensas.

### Estado

**Implementado en código:**
- perfil persistente por jugadora;
- cuerpo visual derivado del roster;
- avatares visibles dentro del partido;
- poses conectadas a eventos reales del partido;
- separación gameplay/visual conservada.

**Pendiente:**
- validar ejecución real en Godot con hardware;
- hacer que todos los innings, defensa y corredores tengan representación visual completa;
- conectar equipamiento visual a un sistema de estadísticas de equipo separado;
- reemplazar el renderer procedural por arte/rig de producción;
- ejecutar el benchmark con checkpoints reales instalados y elegir una configuración final.

### Investigación de modelos

Se mantiene el benchmark determinista entre familias anime candidatas. No se declara un checkpoint como “el mejor” ni como el más popular sin una comparación real de las versiones exactas instaladas. La web general no estuvo disponible durante esta revisión, así que no se presenta una afirmación de popularidad actual como hecho.

La dirección artística permanece:
- anime deportivo adulto;
- silueta redondeada y atlética;
- proporciones shonen suaves;
- fanservice/ecchi no explícito;
- sin copiar identidades visuales concretas;
- sin CLAMP/Jujutsu Kaisen;
- el preset `shonen_soft` se conserva como base para pruebas.

### Porcentaje global revisado

El avance global estimado pasa de **≈31% a ≈33%**.

El 33% representa avance técnico ponderado del proyecto completo. El sistema de avatar/streaming está bastante más adelantado que economía, gacha, crianza, contenido de campaña, backend y producción artística final, que siguen siendo bloques grandes.

### Regla de continuidad

El avatar por capas + roster persistente + presenter de partido pasa a ser la base vigente.

No se vuelve a diseñar desde cero. Las siguientes mejoras deben extender estas interfaces o sustituir componentes concretos con una razón registrada.

# 19. Revisión 10: Campo completo, defensores y runners visuales

**Fecha:** 2026-09-20
**Tipo:** Integración visual de gameplay / presentación del campo / continuidad del sistema de avatar.

### Motivo

La Revisión 9 conectó los avatares persistentes al duelo pitcher/batter y a algunas acciones del partido. El siguiente límite evidente era que el cuerpo seguía sin ocupar el campo completo.

La arquitectura por capas no se modifica. Se añade una segunda capa de presentación visual para posiciones defensivas y corredores.

### Implementado

- `game/avatar/baseball_field_avatar_presenter.gd`
  - catcher;
  - primera base;
  - segunda base;
  - tercera base;
  - shortstop;
  - left field;
  - center field;
  - right field;
  - tres runners visuales asociados a las bases;
  - acciones de Catch, Run, Steal, Out, Throw, Celebrate y Defeat;
  - sincronización con el estado de bases.

- `scenes/main.gd`
  - crea una alineación defensiva de demostración;
  - integra el presenter del campo;
  - sincroniza runners después de batazos;
  - sincroniza la animación del robo;
  - activa la recepción del catcher y reacciones defensivas.

- `tools/character_ai/style_presets.json`
  - refuerza la dirección corporal de Baseball Waifus;
  - añade de forma explícita silueta adulta deportiva, torso algo más lleno, caderas redondeadas, muslos más llenos y anatomía shonen suave;
  - mantiene prohibiciones contra anatomía infantil, chibi y estilos de franquicia concretos.

- `docs/avatar-visual-system.md`
  - documenta el campo completo y la separación entre presentación y lógica.

- `README.md`
  - documenta el nuevo presenter y sus acciones.

### Arquitectura actual

```
PlayerData
    ↓
AvatarRosterService
    ↓
AvatarProfile
    ↓
AnimeAvatar2D
    ↑                 ↑
AvatarMatchPresenter  BaseballFieldAvatarPresenter
    ↑                 ↑
batter/pitcher       catcher/infield/outfield/runners
    _________________/
             ↑
       partido Godot
```

Los presenters únicamente traducen estado de gameplay a presentación visual.

No modifican:
- probabilidades;
- estadísticas;
- recompensas;
- inventario;
- gacha;
- crianza.

Los runners creados específicamente para el laboratorio son temporales y no se guardan en el roster persistente.

### Estado

**Implementado:**
- cuerpo procedural reutilizable;
- perfiles persistentes por jugadora;
- pitcher y batter;
- catcher;
- infield;
- outfield;
- runners visuales;
- acciones visuales básicas del campo;
- integración con batazos, out, strike y robo.

**Pendiente:**
- roster real de ambos equipos en lugar del roster demo;
- movimiento físico continuo entre bases;
- trayectorias reales de pelota y defensores;
- defensa completa con reglas de captura;
- animaciones profesionales;
- renderer artístico/rig 2D definitivo;
- validación runtime en Godot, webcam y OBS;
- benchmark real con checkpoints locales y licencia verificada de cada recurso.

### Investigación de modelos

Se hizo una comprobación adicional mediante búsqueda de repositorios de GitHub para familias de modelos anime y tooling de rigging. Los resultados sirven como pista de ecosistema, no como ranking de calidad o popularidad.

La selección del proyecto sigue siendo comparativa y determinista:
- mismo prompt;
- misma seed;
- misma resolución;
- mismo negative prompt;
- checkpoint exacto instalado localmente;
- licencia exacta verificada antes de uso comercial.

La dirección artística continúa buscando anime deportivo adulto con cuerpos redondeados, atléticos y algo más llenos. Se mantiene fuera de la identidad visual directa de CLAMP o Jujutsu Kaisen.

### Porcentaje global revisado

El avance global estimado pasa de **≈33% a ≈35%**.

La subida corresponde a una nueva capa funcional de presentación de gameplay y a que el cuerpo ya puede evaluarse en pitcher, bateo, catcher, defensa, outfield y corredores.

No se aumenta artificialmente el porcentaje por investigación o por assets todavía no validados.

### Regla de continuidad

El sistema vigente es:

**Avatar por capas + perfil persistente + presenter de partido + presenter de campo.**

No se debe rehacer esta arquitectura para introducir el arte definitivo. El siguiente reemplazo esperado es el renderer, no el contrato de datos ni la lógica de juego.

# 20. Revisión 11: Trayectorias de avatar y equipos reutilizables

**Fecha:** 2026-09-20
**Tipo:** Animación de gameplay / estructura de roster / desacoplamiento de prototipo.

### Motivo

La Revisión 10 ya mostraba defensores y runners, pero algunas acciones cambiaban la posición de forma instantánea y el roster de prueba seguía definido dentro de `main.gd`.

Para que el cuerpo sirva realmente como banco de pruebas de jugadores, la presentación necesita movimiento continuo y los equipos deben existir como datos reutilizables.

### Implementado

- `game/avatar/avatar_trajectory_controller.gd`
  - desplazamiento lineal;
  - dash;
  - trayectoria curva;
  - movimiento con retorno automático;
  - cancelación de tween anterior por avatar.

- `game/avatar/baseball_field_avatar_presenter.gd`
  - runners se desplazan desde la base de origen hasta la base destino;
  - outfielders e infielders pueden entrar temporalmente en la trayectoria de la pelota;
  - conserva el estado visual de cada posición.

- `game/characters/baseball_team_data.gd`
  - nombre e identificación del equipo;
  - colección de jugadoras;
  - orden de bateo;
  - pitcher;
  - consultas por posición;
  - roster defensivo.

- `game/characters/demo_team_factory.gd`
  - crea equipo de jugadores y equipo rival;
  - elimina el hardcode principal del roster de `main.gd`.

- `scenes/main.gd`
  - ahora consume `BaseballTeamData`;
  - mantiene la simulación separada de la presentación visual.

### Arquitectura

```text
PlayerData
    ↓
BaseballTeamData
    ↓
AvatarRosterService
    ↓
AvatarProfile
    ↓
AnimeAvatar2D
    ↑
AvatarMatchPresenter / BaseballFieldAvatarPresenter
    ↑
AvatarTrajectoryController
    ↑
eventos del partido
```

### Dirección visual

La silueta sigue orientada a:

- personaje anime adulto;
- cuerpo atlético redondeado;
- torso y extremidades ligeramente más llenos;
- caderas y muslos redondeados;
- proporciones shonen suaves;
- fanservice ecchi de videojuego sin contenido sexual explícito.

La dirección sigue evitando la copia directa de franquicias y mantiene fuera los estilos indicados anteriormente.

### Investigación de modelos

La comprobación adicional mediante GitHub encontró infraestructura y repositorios relacionados con Illustrious XL, Animagine XL y herramientas de anime, pero no produce por sí sola una métrica fiable de popularidad mundial.

Por diseño se mantiene:

familia candidata → checkpoint exacto → benchmark idéntico → revisión de licencia → decisión local

No se introducen pesos de terceros dentro del repositorio.

### Estado

**Implementado:**
- streaming base;
- Character Creator;
- perfil persistente;
- avatar por capas;
- cuerpo `shonen_soft`;
- presenters de batter/pitcher y campo;
- catcher, infield, outfield y runners;
- trayectorias visuales;
- equipos de prueba reutilizables;
- benchmark local de checkpoints.

**Pendiente:**
- lineup real durante todo el partido;
- movimiento completo de todos los runners después de cada batazo;
- trayectoria física de la pelota como entidad compartida por gameplay y presentación;
- defensa con resolución de atrapada antes del resultado final;
- arte/rig de producción;
- runtime real de Godot + webcam + OBS;
- benchmark con checkpoints concretos instalados.

### Porcentaje global revisado

El avance global estimado pasa de **≈35% a ≈37%**.

El aumento viene de convertir la presentación visual en un sistema reutilizable de movimiento y equipos, no simplemente de añadir más dibujos.

### Regla de continuidad

La arquitectura vigente queda:

**Streaming Bridge + Avatar por capas + Roster persistente + TeamData + Match Presenter + Field Presenter + Trajectory Controller.**

El siguiente salto lógico es conectar el resultado del béisbol con una pelota y trayectorias físicas compartidas, y después migrar el renderer procedural al rig artístico definitivo.

# 21. Revisión 12: Pelota compartida y trayectoria única

**Fecha:** 2026-09-20
**Tipo:** Integración gameplay/presentación / movimiento de pelota / depuración visual.

### Motivo

La Revisión 11 dejó runners y defensores con trayectorias temporales, pero la pelota seguía siendo un dibujo interno de `main.gd`. Eso podía producir una separación entre el resultado lógico y la escena visual.

El siguiente paso fue convertir la pelota en una entidad visual independiente y compartir un evento de trayectoria entre el motor de partido y los presenters.

### Implementado

- `game/baseball/batted_ball_event.gd`
  - contrato común de resultado + trayectoria;
  - seed visual reproducible;
  - origen, destino y punto de control;
  - duración y tipo de arco;
  - clasificación de zona para el defensor.

- `game/avatar/baseball_ball_controller.gd`
  - pelota visible independiente del `main.gd`;
  - trayectoria de pitch;
  - trayectoria de batazo;
  - devolución al catcher en strike;
  - interpolación cuadrática;
  - dibujo de pelota y lectura de movimiento.

- `game/avatar/baseball_field_avatar_presenter.gd`
  - recibe el mismo `BattedBallEvent`;
  - determina qué defensor reacciona según la zona del destino;
  - usa el destino real del evento para la trayectoria visual del fielder.

- `scenes/main.gd`
  - entrega la misma trayectoria a pelota y campo;
  - elimina el antiguo círculo de pelota dibujado directamente por `main.gd`.

- `scenes/baseball_ball_test.tscn`
- `scenes/baseball_ball_test.gd`
  - prueba aislada de Pitch, Single, Double, Triple, Home Run, Foul y Out.

### Arquitectura

```text
BaseballSimulator
      ↓
resultado lógico
      ↓
BattedBallEvent
      ├──────────────→ BaseballBallController
      │                 ↓
      │              pelota
      │
      └──────────────→ BaseballFieldAvatarPresenter
                        ↓
                    defensor
```

El renderer no decide si una jugada fue hit, out o home run. Recibe el resultado ya resuelto.

### Estado

**Implementado:**
- streaming base;
- Character Creator;
- avatar por capas;
- roster persistente;
- TeamData reutilizable;
- presenters de partido y campo;
- trayectorias de jugadores;
- pelota independiente;
- evento compartido de trayectoria;
- prueba aislada de pelota.

**Pendiente:**
- defensa resuelta con captura real antes de cerrar el resultado;
- rebotes y lanzamientos posteriores de la pelota;
- movimiento completo de runners para Single/Double/Triple/Home Run;
- lineup real durante todos los innings;
- rig artístico definitivo;
- validación runtime Godot + cámara + OBS;
- benchmark de checkpoints concretos instalados.

### Porcentaje global revisado

El avance global estimado pasa de **≈37% a ≈39%**.

El incremento representa una integración real entre simulación y presentación. No se cuenta como terminado el sistema defensivo completo, porque todavía falta que la captura de pelota forme parte de la resolución de la jugada.

### Investigación de modelos

Se mantiene la búsqueda en familias anime candidatas y el benchmark local. No se declara una jerarquía de popularidad o calidad global sin datos actuales completos. Los checkpoints no se incorporan al repositorio y deben verificarse por licencia.

La dirección artística permanece en anime deportivo adulto, redondeado, atlético, con fanservice ecchi no explícito y sin copiar identidades visuales de franquicias.

### Regla de continuidad

`BattedBallEvent` pasa a ser el contrato oficial para la trayectoria visual de una pelota bateada. No se debe volver a dibujar la pelota directamente desde `main.gd` salvo una herramienta de depuración.
# 22. Revisión 13: Defensa real antes de cerrar un OUT

**Fecha:** 2026-09-20
**Tipo:** Gameplay defensivo / resolución determinista / integración avatar.

### Motivo

La Revisión 12 tenía una pelota compartida y trayectorias coherentes, pero `BaseballSimulator` todavía podía decidir `OUT` antes de que una defensora interviniera.

Eso se corrige en esta revisión.

### Cambio de arquitectura

Antes:

```text
Timing → Simulator → OUT
```

Ahora:

```text
Timing + batting stats
        ↓
BaseballSimulator
        ↓
FIELDING_CANDIDATE
        ↓
BattedBallEvent
        ↓
FieldingResolver
        ↓
CAUGHT → OUT
MISS   → SINGLE
```

### Implementado

- `game/baseball/fielding_resolver.gd`
  - regla `fielding_v1`;
  - defensa efectiva;
  - distancia al punto de caída;
  - timing;
  - calidad de contacto;
  - bonus pequeño de infield;
  - RNG reproducible mediante `RandomNumberGenerator`;
  - resultado `CAUGHT` o `FIELDING MISS`;
  - trazabilidad mediante chance, roll y versión de regla.

- `game/baseball/baseball_simulator.gd`
  - sustituye los `OUT` automáticos por `FIELDING_CANDIDATE` cuando la pelota sigue siendo capturable;
  - conserva la información de calidad del contacto.

- `game/baseball/batted_ball_event.gd`
  - transporta `contact_quality` al sistema defensivo.

- `scenes/main.gd`
  - resuelve el fielding antes de llamar a `_apply_batting_result`;
  - solo después se modifica `BaseballGameState`;
  - el mismo evento de pelota sigue alimentando la presentación.

- `game/avatar/baseball_field_avatar_presenter.gd`
  - muestra la carrera hacia el punto de captura;
  - diferencia captura y error defensivo;
  - conecta la resolución con Catch, Celebrate, Hit Reaction y Throw.

- `game/ui/hud.gd`
  - muestra defensora, motivo y chance de captura.

- `docs/fielding-system.md`
  - documenta la fórmula `fielding_v1` y sus límites.

- `scenes/fielding_test.tscn` + `fielding_test.gd`
  - herramienta aislada para probar capturas sin depender del partido completo.

### Fórmula actual

```text
chance =
    0.05
  + defense_score * 0.48
  + positioning_score * 0.16
  + timing_score * 0.16
  + ball_handling_score * 0.08
  + zone_bonus
```

`chance` se limita entre 8% y 92%.

### Regla

El renderer jamás decide una captura.

El resultado defensivo pertenece al sistema de gameplay y utiliza datos explícitos y auditables.

### Estado

**Implementado:**
- candidato de batazo en juego;
- cálculo defensivo antes del OUT;
- captura o miss;
- integración visual con el mismo punto de caída;
- HUD de depuración;
- prueba aislada del resolver.

**Pendiente:**
- atrapadas de line drive y fly ball con categorías propias;
- rebotes;
- errores de lanzamiento;
- doble play;
- asistencias;
- trayectoria captura → lanzamiento → base siguiente;
- movimiento completo de runners tras todos los tipos de hit;
- lineup completo;
- arte/rig definitivo;
- runtime Godot + webcam + OBS.

### Porcentaje global revisado

El avance global estimado pasa de **≈39% a ≈41%**.

El incremento corresponde a una parte real del núcleo de béisbol, porque la defensa ahora participa en la resolución en lugar de ser únicamente una animación posterior.

### Regla de continuidad

`FieldingResolver` pasa a ser la única puerta válida para cerrar los `FIELDING_CANDIDATE`.
No se debe volver a introducir un `OUT` automático para este tipo de batazo en el renderer ni en `main.gd`.

# 23. Revisión 14: Rebotes, recogida y lanzamiento posterior

**Fecha:** 2026-09-20
**Tipo:** Secuencia defensiva / pelota compartida / herramientas de arte.

### Motivo

La Revisión 13 ya resolvía la captura antes de cerrar un OUT, pero un error defensivo terminaba visualmente en el mismo punto de llegada. El siguiente paso era representar la continuación natural de la jugada: pelota que rebota, defensora que la recoge y lanzamiento posterior a una base.

### Implementado

- game/baseball/fielding_play_event.gd
  - contrato explícito para una secuencia defensiva fallida;
  - uno o dos puntos de rebote reproducibles por seed;
  - posición de recogida;
  - base receptora del lanzamiento;
  - duración y arco del lanzamiento;
  - no decide el resultado del partido.

- game/avatar/baseball_ball_controller.gd
  - nuevo recorrido pelota → rebote → rebote opcional → lanzamiento;
  - mantiene BattedBallEvent como origen de la trayectoria;
  - un único controlador visual representa toda la pelota.

- game/avatar/baseball_field_avatar_presenter.gd
  - la defensora corre hacia el punto de caída;
  - sigue los rebotes;
  - cambia a THROW;
  - la defensora receptora realiza CATCH;
  - la animación se mantiene fuera de la lógica estadística.

- scenes/main.gd
  - genera FieldingPlayEvent cuando FieldingResolver devuelve miss;
  - el resultado lógico continúa siendo SINGLE en esta revisión;
  - el nuevo evento solo describe la continuación visual de la jugada;
  - la fase RESULT se mantiene algo más para no cortar la secuencia defensiva.

- scenes/fielding_play_test.tscn
- scenes/fielding_play_test.gd
  - prueba aislada de rebotes y lanzamiento a 1B;
  - SPACE repite;
  - R cambia el seed para inspeccionar variantes.

### Regla de continuidad

FieldingResolver sigue siendo responsable del resultado de captura.
FieldingPlayEvent solo describe qué ocurre con la pelota después de un miss.

La futura resolución de errores de lanzamiento, doble play, asistencias y outs forzados debe construirse sobre este contrato sin trasladar decisiones al renderer.

### Arte anime

- se añadió tools/character_ai/model_catalog.json;
- se corrigió tools/character_ai/prompt_builder.py;
- el prompt builder ahora construye correctamente prompts deterministas a partir de AvatarProfile y sus presets corporales;
- la dirección visual sigue siendo anime adulto deportivo, redondeado, atlético, con fanservice moderado y sin copiar CLAMP ni Jujutsu Kaisen;
- la referencia funcional de Fairy Tail se conserva únicamente como orientación de proporciones shonen redondeadas;
- se mantienen como familias candidatas para benchmark local Animagine XL, Illustrious XL, NoobAI-XL y Pony/SDXL.

### Streaming

Se consolidó docs/streaming-architecture.md con la división:

Webcam/OpenCV → MediaPipe → tracker → protocol → UDP → Godot

Micrófono/sounddevice → protocol → UDP → Godot

OBS ↔ obsws-python ↔ Streaming Bridge

La captura y el tracking siguen separados del gameplay y del renderer.

### Investigación de modelos

La búsqueda disponible fue mediante repositorios GitHub. Sirve para localizar familias y tooling, pero no constituye una métrica mundial de popularidad o calidad. No se incorporan pesos de terceros al repositorio y cada checkpoint deberá revisarse por licencia antes de uso comercial.

### Estado

**Implementado:**
- streaming bridge modular;
- tracking facial;
- audio;
- captura de pantalla opcional;
- protocolo versionado;
- Character Creator;
- cuerpo procedural shonen_soft;
- perfiles persistentes;
- movimiento de avatar;
- pelota compartida;
- fielding determinista;
- rebotes;
- recogida;
- lanzamiento posterior;
- prueba aislada de la secuencia.

**Pendiente:**
- movimiento completo de runners después de Single/Double/Triple/Home Run;
- lineup real durante todo el partido;
- errores de lanzamiento con consecuencias de gameplay;
- doble play y asistencias;
- arte/rig 2D definitivo;
- Live2D/Inochi2D/VRM;
- backend, gacha, crianza, economía y progresión;
- validación real Godot + webcam + OBS.

### Porcentaje global revisado

El avance global estimado pasa de **≈41% a ≈43%**.

El aumento representa una integración adicional del núcleo defensivo y la consolidación del laboratorio visual. No se contabiliza como completado ningún bloque que todavía requiera runtime real o backend.

### Regla de continuidad

La arquitectura vigente es:

**Streaming Bridge + AvatarProfile + AnimeAvatar2D + Match Presenter + Field Presenter + Trajectory Controller + BattedBallEvent + FieldingResolver + FieldingPlayEvent.**

No se debe rehacer el contrato del avatar para introducir el rig definitivo.


# 24. Revisión 15: Runners reales, lineup completo y defensa de segunda fase

**Fecha:** 2026-09-20
**Tipo:** Núcleo de partido / corredores / alineación / defensa avanzada / renderer.

### Motivo

El sistema ya podía mostrar rebotes y lanzamiento posterior, pero la parte lógica de los corredores seguía representada principalmente por booleanos de bases y la demostración utilizaba una bateadora fija.

Esta revisión convierte la ocupación de bases en RunnerToken, rota la alineación durante todo el partido y añade consecuencias reales para errores de lanzamiento y doble play.

### Implementado

- game/baseball/runner_token.gd
  - identidad persistente de cada corredora en base;
  - player_id, display_name, team_id y speed.

- game/baseball/game_state.gd
  - base_runners;
  - batting_indices por equipo;
  - apply_hit con plan de movimiento;
  - remove_base_runner;
  - movimiento de robo sobre RunnerToken;
  - add_outs seguro para doble play sin corromper el cambio de entrada.

- game/characters/baseball_team_data.gd
  - player_by_id;
  - lineup_size.

- game/characters/demo_team_factory.gd
  - pitcher propio para el equipo del jugador;
  - nueve bateadoras para ambos equipos;
  - DH rival para mantener una alineación simétrica.

- game/baseball/throw_resolver.gd
  - throw_v1;
  - error de lanzamiento reproducible;
  - probabilidad dependiente de defensa, receptor y distancia;
  - lanzamiento desviado.

- game/baseball/double_play_resolver.gd
  - double_play_v1;
  - elegibilidad por outs, corredor en primera y defensa de infield;
  - asistencia, pivote y putout;
  - dos outs en una sola jugada.

- game/baseball/fielding_resolver.gd
  - integra DoublePlayResolver después de una captura.

- game/baseball/fielding_play_event.gd
  - metadatos de doble play y error de lanzamiento;
  - evento válido incluso sin rebotes para una doble matanza.

- game/avatar/baseball_ball_controller.gd
  - visualización de doble play;
  - wild throw cuando el lanzamiento falla.

- game/avatar/baseball_field_avatar_presenter.gd
  - movimiento de corredoras después de cada hit;
  - avatar temporal para la nueva bateadora;
  - perfiles visuales reales de las corredoras;
  - secuencia visual de doble play;
  - continuidad de robo y eliminación.

- game/avatar/avatar_renderer_factory.gd
- game/avatar/external_rig_avatar_2d.gd
- game/avatar/avatar_render_backend.gd
- docs/avatar-rig-integration.md
  - contrato único para cambiar AnimeAvatar2D por un rig externo;
  - soporte de rig_scene_path;
  - fallback procedural;
  - punto preparado para Inochi2D, Live2D o VRM/Three.js.

- scenes/match_system_test.tscn + match_system_test.gd
  - prueba de avance de corredoras, lineup y transición de entrada.

### Flujo de partido actual

TeamData → batting_indices → batter actual → pitch → timing → result → RunnerToken/FieldingResolver → GameState → Presenter.

Al cambiar de mitad:

equipo bateador → bateadora siguiente → pitcher contrario → roster defensivo contrario.

### Arte y rig

AvatarProfile conserva el contrato de datos. El renderer procedural continúa siendo el backend estable del prototipo, pero un perfil marcado como rig puede apuntar a una escena externa mediante AvatarRendererFactory.

La dirección visual sigue siendo anime adulto deportivo, cuerpos atléticos redondeados y fanservice moderado. No se incorporan imitaciones directas de CLAMP o Jujutsu Kaisen. Fairy Tail permanece solamente como referencia funcional para proporciones shonen redondeadas.

Las familias de benchmark continúan siendo Animagine XL, Illustrious XL, NoobAI-XL y Pony/SDXL. La búsqueda disponible fue mediante GitHub y no debe interpretarse como ranking mundial actual.

### Estado

**Implementado:**
- streaming bridge modular;
- tracking facial;
- audio y captura de pantalla opcional;
- Character Creator;
- cuerpo procedural shonen_soft;
- perfiles persistentes;
- pelota compartida;
- fielding determinista;
- rebotes;
- recogida y lanzamiento;
- RunnerToken y movimiento de corredoras;
- lineup real durante el partido;
- errores de lanzamiento con consecuencia de bases;
- doble play y registro de asistencia/putout;
- adapter de renderer para futuros rigs;
- pruebas aisladas nuevas.

**Pendiente:**
- force outs y rundown detallados;
- errores de recepción independientes;
- sliding integrado al cálculo;
- arte/rig artístico definitivo;
- integración concreta Live2D/Inochi2D/VRM;
- backend, gacha, crianza, economía y progresión;
- validación real Godot + webcam + OBS.

### Porcentaje global revisado

El avance global estimado pasa de **≈43% a ≈49%**.

El incremento corresponde a la incorporación de identidad real de corredoras, rotación de alineación, defensa secundaria y un contrato de renderer intercambiable. No se considera terminado el backend ni la validación de runtime.

### Regla de continuidad

La arquitectura vigente queda:

**Streaming Bridge + AvatarProfile + Renderer Factory + Match Presenter + Field Presenter + Trajectory Controller + BattedBallEvent + RunnerToken + FieldingResolver + ThrowResolver + DoublePlayResolver + FieldingPlayEvent.**

El gameplay sigue siendo la única autoridad sobre resultados, carreras, outs y errores.
### Ajustes de cierre de Revisión 15

- el pitcher rival queda fuera de su alineación de bateo y el DH completa las nueve bateadoras;
- el robo actualiza la animación usando el estado final de las bases para evitar ranuras visuales obsoletas;
- el presenter separa la pose de resolución defensiva de la trayectoria física posterior;
- los perfiles visuales de las corredoras se recuperan desde PlayerData mediante player_id.

El porcentaje global permanece en **≈49%**.

# 25. Revisión 16: Mobile-first y plataformas embebidas

**Fecha:** 2026-09-20
**Tipo:** UX móvil / entrada táctil / Web Host / Telegram / Discord.

### Motivo

El objetivo del juego no es solamente funcionar en PC. La experiencia debe poder jugarse con controles simples en móvil y transportarse a un host web integrado en plataformas sociales.

Se adopta un diseño one-tap:

pelota → timing → HIT

y una acción contextual secundaria:

STEAL cuando existe corredora.

### Implementado

- game/input/mobile_input_router.gd
  - normaliza entrada móvil;
  - señales swing_requested y steal_requested;
  - permite mantener teclado/mouse sin cambiar el gameplay.

- game/ui/mobile_controls.gd
  - botón táctil HIT grande;
  - botón STEAL contextual;
  - hint de timing;
  - vibración corta opcional.

- scenes/mobile_controls_test.tscn + mobile_controls_test.gd
  - prueba aislada de la interfaz táctil.

- scenes/main.gd
  - integra MobileInputRouter;
  - habilita controles móviles en dispositivos pequeños/táctiles;
  - mantiene Space/click/S en desktop;
  - añade una ventana pre-pitch de 1 segundo para robo contextual.

- game/platform/platform_bridge.gd
  - hosts LOCAL, TELEGRAM y DISCORD;
  - detección por query string en Web;
  - puente mediante postMessage;
  - expansión/fullscreen y haptics.

- tools/web_host/
  - host Vite independiente del gameplay;
  - SDK oficial de Discord Embedded Apps;
  - Telegram WebApp bridge;
  - iframe para el build Web de Godot;
  - parámetro godot para seleccionar build;
  - propagación de platform=telegram o platform=discord.

- docs/mobile-platform.md
  - describe arquitectura nativa y embebida;
  - separa host de gameplay;
  - documenta el flujo local.

### Referencias de plataforma

Se revisaron los repositorios públicos oficiales de:

https://github.com/discord/embedded-app-sdk
https://github.com/TelegramMessenger/TGMiniAppsJsSDK

El paquete oficial de Discord consultado marca actualmente la versión 2.5.0 y se fija esa versión en tools/web_host/package.json.

### Arquitectura móvil

Desktop:

keyboard/mouse → MobileInputRouter → gameplay

Mobile:

touch buttons → MobileInputRouter → gameplay

Web host:

Telegram/Discord → Web Host → Godot Web iframe → PlatformBridge

El gameplay no importa SDKs de plataformas.

### Estado

**Implementado:**
- experiencia táctil principal;
- acción HIT;
- acción STEAL contextual;
- entrada unificada;
- haptics opcionales;
- host local Web;
- adaptador Telegram;
- adaptador Discord;
- separación entre plataforma y gameplay;
- prueba de controles móviles.

**Pendiente:**
- export Web real de Godot generado en el entorno;
- build Android/iOS firmado;
- configuración final de bot de Telegram;
- configuración final de Discord Activity/client id;
- despliegue HTTPS externo;
- validación real en teléfonos;
- backend online y sincronización multijugador.

### Porcentaje global revisado

El avance global estimado pasa de **≈49% a ≈53%**.

El incremento representa la incorporación completa de la capa de entrada móvil y el primer host multiplataforma Web. No se contabilizan como terminadas las exportaciones ni la validación física en dispositivos reales.

### Regla de continuidad

El núcleo permanece independiente de la plataforma:

**BaseballGameState + BaseballSimulator + RunnerSystem + resolvers + Avatar presenters**

encima de:

**MobileInputRouter + PlatformBridge + Web Host**

Telegram y Discord se consideran hosts de presentación/entorno, no fuentes de autoridad para resultados de béisbol.
## 26. Revisión 17: rig procedural anime + endurecimiento del Streaming Bridge

Fecha: 2026-09-20
Tipo: Arquitectura visual / Character Creator / streaming / pruebas.

### Motivo

Había un Character Creator funcional y un renderer procedural estable, pero el camino de rig estaba preparado solamente como contrato para un asset externo. Para poder probar de inmediato cuerpos de jugadoras y sus movimientos, se incorpora un segundo backend visual interno con articulaciones procedurales, sin cambiar AvatarProfile ni la lógica del béisbol.

En paralelo, el Streaming Bridge tenía dos problemas de mantenimiento: audio/pantalla se importaban como dependencias obligatorias aunque estuvieran desactivados, y OBS ocultaba sus fallos de conexión. Se corrigen ambos puntos y se añade un healthcheck reproducible.

### Investigación técnica realizada

Se revisaron repositorios públicos del ecosistema de avatares:

- Inochi2D/inochi-creator: editor de puppets Inochi2D; licencia BSD-2-Clause en el repositorio consultado.
- Inochi2D/inochi2d: runtime Inochi2D; licencia BSD-2-Clause en el repositorio consultado.
- pixiv/three-vrm: runtime VRM sobre Three.js; licencia MIT en el repositorio consultado.
- Live2D Cubism se mantiene como adapter futuro, no como dependencia open source del prototipo.

La implementación no copia assets ni código de esos proyectos. Se adopta su separación funcional: datos de personaje → capas/rig → runtime.

### Implementado

- game/avatar/anime_body_rig_2d.gd: segundo backend visual de AvatarRendererFactory; articulaciones virtuales de pelvis, torso, hombros, codos, manos, rodillas, pies y cabeza; locomoción procedural; poses de béisbol; tracking facial.
- game/avatar/avatar_renderer_factory.gd: art_style=rig sin rig_scene_path usa AnimeBodyRig2D; rig_scene_path continúa reservado para rigs externos; soft/ecchi mantienen AnimeAvatar2D.
- scenes/anime_body_rig_test.tscn + anime_body_rig_test.gd: prueba aislada del nuevo cuerpo, ciclo automático, cambio manual, tracking simulado y ajuste de proporciones.
- tools/streaming_bridge/main.py: argumentos --config, --no-audio, --no-screen, --no-obs; OBS opt-in; cierre limpio de recursos.
- tools/streaming_bridge/capture.py: mss y sounddevice pasan a ser opcionales cuando sus funciones están apagadas.
- tools/streaming_bridge/tracker.py: MediaPipe ausente produce error legible.
- tools/streaming_bridge/obs_client.py: expone diagnóstico de conexión.
- tools/streaming_bridge/config.json: enable_obs=false por defecto.
- tools/streaming_bridge/healthcheck.py: módulos, warnings opcionales y bind UDP.
- tools/streaming_bridge/README.md: instalación, ejecución y diagnóstico.

### Pruebas realizadas

Prueba 1, dependencias del entorno: OpenCV y NumPy disponibles; MediaPipe, mss, sounddevice y obsws-python no instalados; Godot no instalado. Por tanto el healthcheck debe marcar MediaPipe como fallo requerido y los demás como warnings opcionales cuando corresponda.

Prueba 2, revisión estática del bridge: main.py → capture.py → tracker.py → obs_client.py → protocol.py. Resultado: audio, pantalla y OBS quedan desacoplados; tracking real sigue requiriendo MediaPipe; UDP continúa en localhost por defecto.

Prueba 3, revisión de continuidad: AvatarProfile sigue siendo el contrato común y la lógica de béisbol no conoce librerías de rigging. Resultado: contrato conservado.

Prueba 4, runtime Godot: no ejecutada porque Godot no está instalado en el entorno actual.

Prueba 5, runtime físico: no ejecutada porque no hay webcam, micrófono ni instancia OBS accesibles desde este entorno.

Prueba 6, regresión de protocolo: test_protocol.py ejecutó 2 pruebas y ambas pasaron (2/2). Se validaron versión, claves tracking/audio/capture y valores por defecto seguros.

Prueba 7, healthcheck en este entorno: el bind UDP local pasó, OpenCV y NumPy están disponibles, MediaPipe falta y por eso el proceso devuelve código 2; mss, sounddevice y obsws-python aparecen como opcionales ausentes. Este resultado es esperado y confirma que el diagnóstico identifica la dependencia real que falta.

### Errores detectados y corregidos

1. capture.py podía fallar en el import global si mss o sounddevice no estaban instalados aunque esas funciones estuvieran apagadas. Corrección: imports opcionales y errores locales.
2. OBSController silenciaba las causas de fallo. Corrección: propiedad error y status() con diagnóstico.
3. main.py intentaba conectar OBS aunque no existiera escena configurada. Corrección: OBS opt-in con enable_obs=false.
4. La bitácora seguía diciendo que el motor no estaba confirmado aunque G-017 ya registraba Godot 4.x como adoptado. Corrección: estado global alineado.
5. Character Creator todavía instanciaba AnimeAvatar2D directamente y no utilizaba la nueva factory. Corrección: el creador ahora usa AvatarRendererFactory y reconstruye el renderer al cambiar entre procedural y rig.

### Decisión visual de continuidad

AvatarProfile → AnimeAvatar2D para renderer procedural existente → AnimeBodyRig2D para cuerpo articulado de prueba → ExternalRigAvatar2D para rig externo → futuras implementaciones concretas de Inochi2D / Live2D / VRM sin tocar gameplay.

### Porcentaje global revisado

El avance global estimado pasa de ≈53% a ≈58%.

El incremento representa backend visual articulado, integración de factory, prueba aislada, mayor tolerancia del bridge y diagnóstico reproducible.

No se contabilizan como terminados: rig artístico de producción; integración final Inochi2D/Live2D/VRM; exportaciones móviles/web reales; validación física; backend, economía, gacha, crianza y PvP.

### Regla de continuidad

No rehacer AvatarProfile, AnimeAvatar2D, AvatarMotionController ni AvatarTrajectoryController para obtener otro cuerpo procedural. El nuevo cuerpo ya es un backend compatible. Las próximas mejoras visuales deben extenderlo o añadir un adapter externo.

healthcheck.py pasa a ser la primera prueba obligatoria antes de investigar problemas de webcam/audio/OBS.


# 27. Revisión 18: observabilidad, replay y endurecimiento del transporte

**Fecha:** 2026-09-20
**Tipo:** Streaming / protocolo / seguridad / diagnóstico.

### Motivo

Después de la Revisión 17 el bridge ya era modular y diagnosticable, pero cualquier fallo de tracking todavía requería tener cámara y MediaPipe funcionando al mismo tiempo. Además, el receptor aceptaba cualquier JSON válido aunque no perteneciera al protocolo correcto y no distinguía paquetes viejos. El Web Host también confiaba demasiado en mensajes postMessage entrantes.

### Implementado

- tools/streaming_bridge/protocol.py
  - nombre y versión explícitos del protocolo;
  - sequence monotónica;
  - sent_at_ms;
  - validate_payload;
  - encode_payload.

- tools/streaming_bridge/recorder.py
  - grabación JSONL;
  - lectura reproducible;
  - errores de JSON reportados con número de línea.

- tools/streaming_bridge/replay.py
  - reproducción offline hacia UDP;
  - velocidad configurable;
  - modo loop;
  - validación de cada payload antes de enviarlo.

- tools/streaming_bridge/main.py
  - opción --record;
  - configuración enable_recording y record_path;
  - contador sequence;
  - timestamp por paquete;
  - cierre limpio del recorder.

- game/streaming/tracking_receiver.gd
  - valida protocol/version/tracking/sequence;
  - descarta paquetes fuera de orden;
  - mantiene invalid_packets para diagnóstico.

- tools/web_host/src/main.ts
  - acepta postMessage solamente desde el iframe de Godot esperado;
  - valida origin;
  - valida estructura básica del mensaje;
  - Discord exige client_id antes de inicializar SDK.

- tools/streaming_bridge/test_protocol.py
  - 4 pruebas de regresión.

- tools/streaming_bridge/test_recorder.py
  - round-trip JSONL;
  - detección de JSON inválido.

### Pruebas y validación

La suite de protocolo fue ampliada de 2 a 4 casos: payload válido, defaults seguros, versión incorrecta y tracking ausente.

Se añadió una suite separada para recorder con round-trip y entrada corrupta.

No se ejecutó runtime Godot/web porque el entorno sigue sin Godot ni build Web ejecutable.
Se ejecutó una regresión aislada de los módulos Python nuevos (`protocol.py` + `recorder.py`): 5/5 pruebas pasaron y `py_compile` no reportó errores. Esta prueba usa exactamente el código de la revisión para validar sintaxis y comportamiento básico fuera del hardware.
No se ejecutó la ruta física de webcam/MediaPipe/OBS porque esas dependencias y hardware no están disponibles aquí.

### Error de implementación durante la revisión

El primer intento de escritura de la revisión chocó con GitHub Contents API porque se usó create_file sobre archivos que ya existían y requerían SHA. Se corrigió usando update_file. No se perdió código funcional ni se produjo un archivo duplicado.

### Decisión de continuidad

El sistema de streaming queda dividido en:

**Capture → Tracker → Protocol → Recorder/UDP → Godot Receiver → Avatar Renderer**

La grabación/replay pasa a ser la vía recomendada para depurar el renderer sin involucrar hardware.

### Porcentaje global revisado

El avance global estimado pasa de **≈58% a ≈61%**.

El aumento representa observabilidad y depuración reproducible del streaming, validación estricta del transporte y endurecimiento del host embebido.

No se contabilizan como terminados: runtime real Godot, webcam, MediaPipe, OBS, export Web, rig artístico final, backend, economía, gacha, crianza y PvP.

### Regla de continuidad

No crear otro sistema de replay o logging para tracking mientras JSONL + `replay.py` cubran las pruebas. Los futuros formatos de grabación deben mantener el protocolo versionado o introducir una nueva revisión del contrato.


# 28. Revisión 19: panel local de control y operación del Streaming Bridge

**Fecha:** 2026-09-20
**Tipo:** Herramienta de streaming / interfaz local / observabilidad.

### Motivo

El bridge ya podía capturar, trackear, enviar, grabar y reproducir tracking, pero todavía requería manejar todo mediante consola. Para acercarlo al patrón operativo de herramientas de streaming reales se añade una interfaz local separada del gameplay.

### Implementado

- tools/streaming_bridge/control_server.py
  - servidor HTTP con ThreadingHTTPServer;
  - escucha solamente en localhost;
  - GET /api/status;
  - POST /api/record/start;
  - POST /api/record/stop;
  - dashboard servido desde el mismo proceso.

- tools/streaming_bridge/dashboard.html
  - estado de tracking;
  - FPS;
  - sequence;
  - audio;
  - OBS;
  - grabación;
  - contador de paquetes;
  - botones para iniciar/detener grabación;
  - diagnóstico JSON en tiempo real.

- tools/streaming_bridge/main.py
  - --no-control;
  - servidor de control integrado;
  - callbacks seguros para iniciar/detener recorder;
  - lock para acceso concurrente al recorder;
  - caché de estado de OBS;
  - URL del dashboard mostrada en consola;
  - compatibilidad con --record y control desde UI.

- tools/streaming_bridge/config.json
  - enable_control_server;
  - control_host=127.0.0.1;
  - control_port=8787.

- tools/streaming_bridge/healthcheck.py
  - comprobación adicional del puerto del panel.

### Seguridad

El servidor rechaza hosts distintos de localhost para evitar convertir accidentalmente el panel en un servicio de red expuesto.

El dashboard no recibe video ni audio. Solo consulta estado y controla grabación.

### Prueba realizada

Se creó y ejecutó una regresión independiente del servidor HTTP con Python:
- GET /api/status: PASS;
- POST /api/record/start: PASS;
- POST /api/record/stop: PASS;
- compilación con py_compile: PASS.

La prueba valida el comportamiento básico del servidor sin requerir cámara, MediaPipe, OBS ni Godot.

### Error detectado y corregido

Durante la integración del panel se detectó que la ruta de grabación iniciada con --record podía quedar preparada pero no reflejada en el nuevo controlador. Se corrigió para que el recorder sea compartido entre el loop principal y el servidor mediante lock.

También se detectó que consultar OBS directamente desde cada petición podía introducir latencia si OBS estaba apagado. Se añadió caché de estado con actualización periódica de 2 segundos.

### Diseño de personaje y rig

No se creó un segundo Character Creator. La Revisión 17 ya estableció el sistema:
AvatarProfile → AnimeAvatar2D / AnimeBodyRig2D / ExternalRigAvatar2D.

El panel nuevo queda completamente separado del sistema visual y no modifica el contrato de avatar.

### Porcentaje global revisado

El avance global estimado pasa de **≈61% a ≈63%**.

El incremento representa una capa operativa real para el streaming, control de grabación y observabilidad local.

No se contabilizan como terminados:
- runtime real Godot;
- webcam + MediaPipe;
- OBS físico;
- export Web/Android/iOS;
- rig artístico final;
- backend;
- economía;
- gacha;
- crianza;
- PvP.

### Regla de continuidad

No crear otra interfaz de control para el bridge mientras `dashboard.html` + `control_server.py` cubran la operación local. Cualquier evolución de UI debe ampliar este panel o migrarlo de forma explícita, no duplicarlo.


# 29. Revisión 20: observabilidad de sesión y health endpoint

**Fecha:** 2026-09-20  
**Tipo:** Streaming / observabilidad / pruebas de regresión / documentación.

### Qué existía antes

La Revisión 19 dejó operativo el panel local con estado básico, control de grabación y protección localhost. La arquitectura de captura, tracking, protocolo, recorder/replay y avatar ya estaba cerrada como baseline de prototipo.

### Qué se cambia

Se amplía la observabilidad sin crear otro sistema de control:

- `tools/streaming_bridge/main.py`
  - uptime de la sesión;
  - paquetes enviados;
  - timestamp del último frame con tracking activo;
  - edad calculada del último tracking;
  - campo `service` para identificar la instancia del bridge.

- `tools/streaming_bridge/control_server.py`
  - nuevo `GET /api/health`;
  - respuesta ligera para comprobar que el proceso está vivo sin descargar todo el diagnóstico.

- `tools/streaming_bridge/dashboard.html`
  - muestra edad del tracking;
  - paquetes enviados;
  - uptime;
  - conserva el diagnóstico JSON completo.

- `tools/streaming_bridge/test_control_server.py`
  - cobertura del nuevo endpoint de health;
  - comprobación de métricas básicas del status.

- `README.md`
  - documenta el dashboard y sus endpoints actuales.

### Por qué

La herramienta ya tenía recorder/replay y un panel, pero todavía era difícil distinguir rápidamente entre "el bridge está vivo", "está enviando", y "el tracking está fresco". Las métricas nuevas separan esas tres situaciones y sirven como diagnóstico antes de culpar al renderer o a Godot.

### Seguridad

No cambia la frontera de seguridad. El servidor sigue limitado a `127.0.0.1`/localhost y no expone webcam, micrófono ni contenido de vídeo.

### Pruebas nuevas

La regresión del servidor debe comprobar:

1. `GET /api/status` devuelve servicio y contador de paquetes.
2. `GET /api/health` devuelve estado del proceso.
3. `POST /api/record/start` y `POST /api/record/stop` siguen funcionando.

La validación de runtime físico continúa pendiente porque este entorno no dispone de Godot ejecutable, webcam, micrófono, MediaPipe ni OBS físico.

### Error detectado durante la revisión

La primera propuesta de cambio intentó reconstruir archivos completos desde memoria, lo que no era necesario y aumentaba el riesgo de perder historia. Se descartó ese enfoque y se aplicó una modificación quirúrgica sobre los archivos actuales usando sus versiones reales del repositorio. No se modifica el contrato del avatar ni se duplica el Character Creator.

### Estado después de la revisión

**Implementado:** observabilidad de sesión, health endpoint, dashboard enriquecido y tests del panel.

**No validado todavía:** runtime real con Godot + webcam + MediaPipe + OBS; exportaciones de plataforma; rig artístico definitivo.

### Porcentaje global revisado

El avance global estimado pasa de **≈63% a ≈64%**.

El aumento es deliberadamente pequeño: esta revisión mejora una capa operativa ya existente, no crea una nueva gran área del juego.

### Regla de continuidad

No crear un segundo dashboard ni un segundo healthcheck del bridge. `control_server.py` + `dashboard.html` + `healthcheck.py` quedan como la superficie de diagnóstico vigente.

El sistema de personaje sigue siendo:

**AvatarProfile → AnimeAvatar2D / AnimeBodyRig2D / ExternalRigAvatar2D**

y no debe rehacerse para resolver problemas de streaming.


# 30. Revisión 21: regresión integrada offline del Streaming Bridge

**Fecha:** 2026-09-20  
**Tipo:** Streaming / integración / pruebas automatizadas.

### Qué existía antes

Las revisiones 18 a 20 ya cubrían protocolo versionado, recorder/replay, receptor Godot, panel local, health endpoint y métricas de sesión. Las pruebas estaban separadas por módulo.

### Qué se cambia

Se añade:

- `tools/streaming_bridge/test_streaming_pipeline.py`
  - crea payloads de tracking válidos;
  - los persiste mediante `TrackingRecorder`;
  - los recupera mediante `read_recording`;
  - los reproduce con `replay.send_recording`;
  - recibe los datagramas en un socket UDP local;
  - vuelve a validar protocolo y versión;
  - comprueba orden de sequence;
  - comprueba que un recording con versión incorrecta sea rechazado.

También se documenta en `README.md` la ejecución de toda la suite offline con `unittest discover`.

### Por qué

Las pruebas unitarias podían demostrar que cada módulo funcionaba de forma aislada, pero no garantizaban que el contrato entre módulos siguiera intacto. Esta prueba cruza las fronteras principales sin necesitar hardware.

### Prueba realizada

En un entorno aislado sin cámara, MediaPipe, OBS ni Godot:

- pipeline protocolo → recorder → replay → UDP: **PASS**;
- rechazo de versión incompatible durante replay: **PASS**;
- resultado: **2/2 pruebas de integración**.

La ejecución confirmó que los paquetes llegan por UDP, conservan su sequence y siguen siendo válidos después de serializar, guardar, leer y reproducir.

### Observación del entorno

El entorno de ejecución produjo advertencias internas del runtime de herramientas durante el arranque de Python, pero esas advertencias no afectaron la prueba. El proceso de prueba terminó con código 0 y ambos casos pasaron.

### Errores o riesgos detectados

No apareció un error funcional en el pipeline integrado.

La validación sigue siendo offline: no demuestra todavía que MediaPipe produzca tracking correcto, que Godot procese el paquete en runtime, ni que OBS mantenga una sesión física estable.

### Estado después de la revisión

**Implementado:**
- prueba de integración del pipeline de streaming;
- validación UDP offline;
- validación de rechazo de protocolo durante replay;
- documentación del comando de regresión.

**Pendiente:**
- ejecución de suite con dependencias físicas reales;
- runtime Godot + TrackingReceiver;
- webcam + MediaPipe;
- OBS físico;
- exportaciones Web/Android/iOS;
- rig artístico final.

### Porcentaje global revisado

El avance global **permanece en ≈64%**.

No se aumenta artificialmente el porcentaje por una mejora de pruebas. La revisión aumenta confianza en una parte existente de la arquitectura, pero no añade un bloque grande del producto final.

### Regla de continuidad

El pipeline vigente queda:

**Capture → Tracker → Protocol → Recorder/Replay/UDP → Godot Receiver → Avatar Renderer**

No crear otra cadena de transporte para pruebas. Las pruebas nuevas deben apoyarse en este contrato o registrar explícitamente una revisión de protocolo.


# 31. Revisión 22: tracking sintético y ejecución finita del bridge

**Fecha:** 2026-09-20  
**Tipo:** Streaming / QA offline / automatización.

### Motivo

El pipeline ya podía probarse mediante JSONL + replay, pero el proceso principal todavía exigía webcam y MediaPipe para ejecutar el bridge completo. Eso dejaba un hueco entre las pruebas unitarias y el proceso real.

### Implementado

- `tools/streaming_bridge/synthetic_tracker.py`
  - generador sintético de yaw, pitch, roll, blink y mouth;
  - smoothing compatible con el tracker real;
  - sequence de frames sintéticos;
  - salida con el mismo contrato de tracking.

- `tools/streaming_bridge/main.py`
  - `--synthetic-tracking`;
  - `--max-packets N`;
  - soporte de `enable_synthetic_tracking`;
  - el modo sintético evita abrir webcam y no importa MediaPipe como fuente de datos;
  - el UDP, recorder, control server y protocolo siguen siendo los mismos.

- `tools/streaming_bridge/test_synthetic_tracker.py`
  - valida forma y rangos del tracking;
  - valida incremento de frame index.

- `tools/streaming_bridge/config.json`
  - `enable_synthetic_tracking=false` por defecto.

- `tools/streaming_bridge/README.md`
  - documenta el modo de QA y ejecución finita.

### Decisión

El modo sintético es exclusivamente una herramienta de validación. No modifica el camino de producción:

**Webcam → OpenCV → MediaPipe → Tracker**

Sigue siendo el camino real.

El modo alternativo es:

**SyntheticTracker → Protocol → Recorder/UDP → Godot**

### Pruebas

Se validó el módulo sintético de forma aislada con dos casos:
- shape/rangos de tracking: PASS;
- secuencia de frames: PASS.

Resultado: **2/2 PASS**.

La ejecución finita del proceso principal queda disponible para automatización posterior mediante `--max-packets`.

### Error / limitación detectada

Durante la revisión no se detectó un fallo funcional nuevo. La limitación de runtime real permanece: este entorno no dispone de cámara, MediaPipe ejecutable, Godot ni OBS físico.

El modo sintético no debe confundirse con una validación de la precisión facial de MediaPipe.

### Porcentaje

El avance global **permanece en ≈64%**. Se mejora considerablemente la verificabilidad del 64% existente sin completar una nueva gran sección del producto.

### Regla de continuidad

No crear otro simulador facial para pruebas. `synthetic_tracker.py` queda como fuente sintética oficial del Streaming Bridge.

El renderer y el sistema de personajes siguen sin cambios:

**AvatarProfile → AnimeAvatar2D / AnimeBodyRig2D / ExternalRigAvatar2D**


# 32. Revisión 23: QA operativo desde el dashboard

**Fecha:** 2026-09-20  
**Tipo:** Streaming / tooling / observabilidad / QA.

### Motivo

La Revisión 22 permitió ejecutar el bridge con tracking sintético y la Revisión 21 añadió una regresión integrada offline. Faltaba una forma de ejecutar esa suite desde la misma superficie operativa que ya controla la grabación.

### Implementado

- `tools/streaming_bridge/qa_runner.py`
  - ejecuta `python -m unittest discover -p "test_*.py"`;
  - trabajo en segundo plano;
  - límite de tiempo configurable;
  - conserva código de salida y últimas líneas de salida;
  - evita ejecuciones simultáneas.

- `tools/streaming_bridge/control_server.py`
  - `POST /api/qa/run`;
  - `GET /api/qa/status`.

- `tools/streaming_bridge/dashboard.html`
  - botón Ejecutar QA;
  - estado PASS/FAIL;
  - salida de la última ejecución.

- `tools/streaming_bridge/main.py`
  - integra QARunner sin modificar captura, tracking ni transporte.

- `tools/streaming_bridge/test_control_server.py`
  - regression de status/run del QA.

- `tools/streaming_bridge/test_qa_runner.py`
  - verifica ejecución exitosa y bloqueo de una segunda ejecución concurrente.

- `tools/streaming_bridge/config.json`
  - `qa_timeout_seconds=120`.

### Seguridad

El QA se controla exclusivamente por el servidor localhost existente. No se crea otro servidor y no se expone a Internet.

### Pruebas

Se añadió cobertura para:
- ejecución exitosa del runner;
- prevención de ejecución simultánea;
- endpoint status;
- endpoint run.

La prueba de integración de QA puede ejecutarse en el mismo entorno Python del bridge. La validación física de Godot, webcam, MediaPipe y OBS sigue separada y pendiente.

### Error/riesgo

Ejecutar comandos del sistema desde una interfaz HTTP sería inseguro si el panel aceptara conexiones externas o parámetros arbitrarios. Por eso el endpoint no recibe comandos ni argumentos del usuario: ejecuta exclusivamente la suite fija del proyecto y solo escucha localhost.

### Estado

**Implementado:** superficie única de observabilidad + grabación + QA.

**Pendiente:** runtime físico y exportaciones.

### Porcentaje

El avance global **permanece en ≈64%**. Esta revisión consolida el tooling ya existente y no suma una gran fracción del producto final.

### Regla de continuidad

No crear un segundo ejecutor de pruebas ni otra interfaz de QA. El pipeline operativo vigente es:

**Dashboard → Control Server → QARunner → unittest suite**

El sistema de personajes permanece sin cambios:
**AvatarProfile → AnimeAvatar2D / AnimeBodyRig2D / ExternalRigAvatar2D**


### Corrección de Revisión 23-A: deadlock del QARunner

Durante la validación aislada del nuevo ejecutor apareció un problema real: `start()` tomaba `_lock` y después llamaba a `status()`, que intentaba tomar el mismo lock. Con `threading.Lock` eso producía un deadlock.

La corrección fue:

- cambiar el lock interno del QARunner a `threading.RLock`;
- sustituir `subprocess.run` por `Popen + communicate` para poder terminar el proceso si el bridge se cierra;
- añadir referencia interna al proceso activo;
- matar el proceso cuando `close()` se ejecuta durante una prueba activa.

### Prueba de corrección

Se ejecutó una prueba aislada con una suite `unittest` real creada temporalmente:

- QARunner inicia: PASS;
- subprocess termina: PASS;
- exit code 0: PASS;
- `passed=true`: PASS;
- salida de unittest capturada: PASS.

Resultado: **PASS**.

La primera prueba manual anterior falló por un error del arnés temporal de prueba, que intentaba usar una variable fuera de su alcance. Ese fallo no pertenecía al QARunner. Se corrigió el arnés y la validación real del runner pasó.

### Estado de continuidad

QARunner queda como único ejecutor de QA del Streaming Bridge. No crear otra capa de ejecución de tests mientras este runner y la suite `test_*.py` cubran la necesidad.

El porcentaje global permanece en **≈64%**.


# 24. Revisión 24: auditoría OSS y frontera de providers de tracking

**Fecha:** 2026-09-20  
**Tipo:** Investigación externa / refactor arquitectónico / documentación.

### Motivo

Se realizó una auditoría específica del Streaming Bridge para comprobar si hacía falta crear otra aplicación o duplicar componentes ya existentes.

Resultado: el bridge actual ya contiene las cuatro piezas solicitadas:
- captura webcam;
- captura audio y diagnóstico de pantalla;
- puente de tracking hacia Godot;
- integración opcional con OBS;
- ejecución principal unificada.

No se crea otro bridge.

### Investigación OSS

Se revisaron repositorios públicos relacionados con:
- OBS WebSocket;
- OpenSeeFace;
- MediaPipe;
- Inochi2D;
- Inochi Creator;
- three-vrm;
- obsws-python.

La investigación quedó archivada en:
`docs/research/streaming_oss/`

Archivos:
- `README.md`
- `SOURCES.md`
- `ANALYSIS.md`
- `ADOPTION-MATRIX.md`

### Decisiones derivadas

1. OBS permanece como compositor/streamer externo.
2. El tracking sigue separado del transporte.
3. El contrato `baseball-waifus-tracking v1` no cambia.
4. `AvatarProfile` continúa siendo la frontera de datos visuales.
5. Se añade `tracking_provider.py` para permitir proveedores intercambiables.

### Implementado

- `MediaPipeTrackingProvider`
- `SyntheticTrackingProvider`
- `create_tracking_provider()`
- identificación del proveedor en el payload de diagnóstico;
- tests unitarios del factory;
- documentación de la arquitectura;
- documentación de fuentes OSS y decisiones de adopción.

### Licencias

Se evitó copiar código de terceros al repositorio.
OBS WebSocket fue identificado como GPL-2.0; por tanto se usa como referencia/protocolo de integración, no como fuente para incrustar código en Baseball Waifus.
OpenSeeFace e Inochi2D fueron identificados con BSD-2-Clause en los metadatos revisados.
three-vrm fue identificado con MIT en los metadatos revisados.

Para cualquier futura dependencia redistribuida se debe verificar la licencia del release concreto y sus archivos incluidos.

### Resultado

La arquitectura queda preparada para:

`Capture → Tracking Provider → Tracking Contract → UDP → Godot Receiver → Avatar Renderer`

con OBS en paralelo como compositor.

No se crea ningún segundo dashboard, recorder, replay, QA runner ni character creator.

### Porcentaje

El avance global permanece en **≈64%**.
La revisión mejora la modularidad de tooling, pero no aumenta significativamente el alcance funcional del juego porque el próximo gran bloque sigue siendo el núcleo definitivo de béisbol.

### Estado de pruebas

El código nuevo cuenta con pruebas unitarias del factory y del proveedor sintético. No se ejecutó todavía una suite completa sobre un checkout local del repositorio en este entorno.

La validación hardware end-to-end con Godot + cámara + micrófono + OBS sigue pendiente.


# 25. Revisión 25: interfaz visual de producto para juego y streaming

**Fecha:** 2026-09-21  
**Tipo:** UI/UX / Godot / panel operativo / assets vectoriales.

### Motivo

La arquitectura de streaming ya estaba modularizada, pero la presentación visual seguía teniendo aspecto de prototipo técnico. El juego necesita una interfaz intuitiva y vistosa, especialmente en móvil, sin mezclar la lógica de gameplay con la capa visual.

### Implementado

#### HUD de partido

Se rediseña `game/ui/hud.gd` para usar una jerarquía visual clara:

- marcador de ambos equipos;
- inning y mitad;
- outs;
- strikes y balls;
- bases;
- bateadora y pitcher;
- pitch actual;
- mensaje contextual;
- resultado destacado;
- indicador de timing.

Se incorpora `game/ui/hud_visual.gd` como capa de dibujo procedural para:
- paneles;
- franjas transparentes;
- rail de timing;
- zona PERFECT/GREAT;
- marcador visual de estado;
- énfasis temporal de resultados.

La lógica de partido sigue separada del renderer de UI.

#### Controles móviles

`game/ui/mobile_controls.gd` se actualiza para:
- botones grandes;
- estados visuales enabled/disabled;
- acciones BATEAR y ROBAR;
- tipografía de mayor lectura;
- icono vectorial;
- vibración háptica existente.

#### Estilo reutilizable

Se añade `game/ui/ui_theme.gd` para centralizar:
- paneles redondeados;
- bordes;
- sombras;
- estilos de botones.

#### Panel de streaming

`tools/streaming_bridge/dashboard.html` pasa a un Control Center visual con:
- tarjetas de estado;
- proveedor de tracking;
- latencia;
- FPS;
- OBS;
- grabación;
- destino Godot;
- acciones rápidas;
- QA;
- diagnóstico JSON.

No cambian los endpoints ni la frontera de seguridad localhost.

#### Asset visual

Se añade `assets/ui/baseball_waifus_icon.svg`, un asset vectorial original y pequeño para reutilizar en UI sin depender de imágenes externas.

#### Documentación visual

Se añade `docs/ui-style-guide.md` con el lenguaje visual que deberán reutilizar futuras pantallas.

### Decisión arquitectónica

La UI no decide gameplay.

Flujo:

`Gameplay State → Presentación/HUD → Input visual`

El renderer visual no altera:
- estadísticas;
- probabilidades;
- recompensas;
- resultados;
- roster.

### Investigación visual

Se mantiene la política de utilizar referencias externas solo como patrón de diseño. No se incorporan imágenes de Canva, PixAI, Danbooru u otros repositorios de terceros sin revisar primero derechos y licencia.

Para assets funcionales de interfaz se prefiere SVG propio mientras el arte final del juego no esté cerrado.

### Estado

**Implementado:** HUD visual, controles móviles estilizados, panel de streaming renovado, asset SVG propio y guía visual.

**Pendiente:** arte de producción, retratos finales, iconografía completa, efectos VFX, animaciones de UI, pantallas de roster/gacha/inventario y adaptación visual completa del menú principal.

### Pruebas

No se ejecutó todavía Godot en este entorno para validar visualmente el HUD y los controles en runtime.

Se verificó mediante lectura del repositorio que:
- los nuevos archivos están separados de la lógica de partido;
- el panel conserva sus endpoints existentes;
- el bridge añade el proveedor de tracking al estado sin cambiar el protocolo de transporte.

### Porcentaje

El avance global permanece en **≈64%**.

La revisión mejora la calidad y coherencia de la presentación, pero no cuenta como gran aumento funcional del producto.

### Regla de continuidad

No crear un segundo sistema de estilos para el mismo juego. Las futuras pantallas deben reutilizar `ui_theme.gd`, `ui-style-guide.md` y el lenguaje visual del HUD antes de añadir componentes nuevos.



# 26. Revisión 26: roster base de 30 personajes y pipeline de arte

**Fecha:** 2026-09-21  
**Tipo:** Personajes / datos / avatar / herramientas de arte.

### Motivo

El proyecto necesitaba una biblioteca inicial de personajes suficientemente grande para que el juego dejara de depender de personajes demo genéricos. La decisión fue crear 30 plantillas reutilizables en lugar de 30 sistemas visuales independientes.

### Implementado

- `game/characters/character_archetypes.json`
  - 30 personajes adultos;
  - IDs únicos;
  - rareza;
  - elemento;
  - posición;
  - especialización;
  - potencial;
  - ocho estadísticas;
  - silueta corporal base;
  - rostro;
  - piel;
  - cabello;
  - uniforme;
  - color de acento;
  - ojos.

- `game/characters/character_archetype_catalog.gd`
  - fuente común para convertir una plantilla en PlayerData;
  - creación de AvatarProfile;
  - aplicación controlada de variantes.

- `game/characters/demo_team_factory.gd`
  - equipos demo conectados al catálogo real de personajes en lugar de nombres genéricos independientes.

- `tools/character_ai/roster_prompt_builder.py`
  - crea prompts de arte directamente desde el mismo catálogo;
  - mantiene la identidad de gameplay separada de la imagen.

- `tools/character_ai/validate_roster.py`
  - valida cantidad;
  - IDs únicos;
  - rarezas;
  - presets;
  - restricciones de variantes.

- `docs/character-roster-30.md`
  - documentación de la biblioteca inicial.

- `docs/character-art-pipeline.md`
  - proceso para generar referencias y reemplazarlas posteriormente por arte definitivo.

### Regla de variantes

Las plantillas mantienen fija su identidad base.

Una variante solo puede cambiar:

1. color de cabello;
2. peinado;
3. escala corporal global entre 0.94 y 1.06.

La variante no modifica:
- rareza;
- estadísticas;
- elemento;
- posición;
- especialización;
- rostro;
- uniforme;
- equipamiento.

### Distribución actual

- 4 R
- 14 SR
- 10 SSR
- 2 UR

### Cobertura

El catálogo contiene los siete elementos definidos y las posiciones:
- P
- C
- 1B
- 2B
- 3B
- SS
- LF
- CF
- RF
- DH

### Validación estructural

La comprobación realizada sobre el catálogo confirmó:
- 30 entradas;
- 30 IDs únicos;
- reglas de variante coherentes;
- siete elementos presentes;
- diez posiciones cubiertas.

Esto es validación de datos del repositorio, no una prueba de runtime de Godot.

### Arte

Se prepara la generación de una hoja de roster consistente para usarla como referencia visual inicial. La ilustración generada no se considera automáticamente arte de producción ni se redistribuye como asset definitivo sin revisar las condiciones de licencia del generador/modelo.

### Estado

**Implementado:** catálogo de 30 personajes, factory de gameplay/avatar, conexión con equipos demo, restricciones de variantes, validador y pipeline de prompts.

**Pendiente:** retratos individuales definitivos, sprites/rig final, animaciones particulares por personaje, habilidades únicas completas y persistencia final del roster del jugador.

### Porcentaje

El avance global permanece en **≈64%**. Los personajes forman una nueva biblioteca de contenido prototípico, pero todavía no representan el roster final completo ni sus sistemas de progresión/gacha/crianza.

### Regla de continuidad

No crear un segundo catálogo de personajes. `character_archetypes.json` queda como fuente de verdad para la primera biblioteca y futuras herramientas de arte.

# 27. Revisión 27: guía visual inicial de Baseball Waifus

**Fecha:** 2026-09-21  
**Tipo:** Arte / dirección visual / documentación.

### Motivo

Se seleccionó la primera hoja de concept art generada para el proyecto como referencia visual común del universo **Baseball Waifus**. La intención es conservar una identidad artística compartida mientras se producen las ilustraciones individuales del roster.

### Implementado

- `assets/art_reference/baseball_waifus_visual_guide.svg`
  - referencia visual autocontenida para el repositorio;
  - conserva la composición general de la hoja generada;
  - marcada como referencia y no como fuente de identidad de personajes.

- `docs/baseball-waifus-visual-guide.md`
  - documenta el propósito de la referencia;
  - conecta la imagen con el pipeline de arte;
  - establece qué datos continúan viniendo del catálogo JSON.

### Decisión de continuidad

La imagen **no convierte sus nombres o diseños accidentales en canon**.

La fuente de verdad continúa siendo:
`game/characters/character_archetypes.json`

El arte sirve para fijar:
- lenguaje anime/deportivo;
- presentación de colección;
- variedad visual;
- colorido;
- proporciones adultas;
- sensación general del roster.

Gameplay, estadísticas, posiciones, elementos, rarezas y variantes siguen separados del arte.

### Relación con el pipeline

El flujo queda:

**CharacterArchetypeCatalog → AvatarProfile → variante → prompt → referencia visual → arte final**

La lámina funciona como referencia de coherencia antes de generar los retratos individuales.

### Pruebas

- Se verificó que el asset visual quedó registrado dentro de `assets/art_reference/`.
- Se añadió documentación específica enlazando la referencia.
- Se verificó que la actualización no modifica la lógica de gameplay ni el catálogo de personajes.

Esta comprobación es estructural del repositorio; no constituye una prueba de runtime de Godot.

### Estado

**Implementado:** primera guía visual persistente para Baseball Waifus.

**Pendiente:** producción de retratos individuales, sprites/rig final, poses específicas, animaciones particulares y arte definitivo redistribuible.

### Porcentaje

El avance global permanece en **≈64%**. La revisión fija una referencia artística para el contenido, pero no completa los sistemas de arte final ni el roster definitivo.

### Regla de continuidad

No crear una segunda identidad visual independiente para el juego. Las futuras ilustraciones deben tomar esta guía como punto de partida y seguir reutilizando el pipeline de arte y el catálogo existente.



# 28. Revisión 28: conteo completo del turno, balls, walks e innings del prototipo

**Fecha:** 2026-09-21
**Tipo:** Núcleo de béisbol / reglas de partido / QA Godot.

### Motivo

Las revisiones anteriores ya tenían pitcher, timing, contacto, bases, corredores, defensa, doble play y lineup, pero el flujo de lanzamiento no producía `BALL`, no existía resolución de cuatro bolas y el cambio de entrada podía avanzar accidentalmente la alineación del equipo contrario después del tercer out.

Este bloque completa el siguiente paso funcional del núcleo sin reemplazar los resolvers existentes.

### Implementado

- `game/baseball/pitch.gd`
  - conserva Fastball, Curve y Special;
  - añade `zone_bias` auditable por tipo de lanzamiento.

- `game/baseball/baseball_simulator.gd`
  - añade `resolve_pitch()`;
  - añade `pitch_in_zone_probability()`;
  - versiona la regla como `pitch_v1`;
  - conserva la fórmula de contacto existente y la etiqueta como `contact_v1`.

- `game/baseball/game_state.gd`
  - añade conteo de balls;
  - añade resolución de walk;
  - fuerza correctamente las corredoras con cadena desde primera;
  - conserva RunnerToken y el plan de movimiento;
  - devuelve `after_runners` para que la presentación utilice el estado real;
  - permite avanzar la alineación de un equipo específico;
  - corrige el caso del tercer out para que avance la alineación del equipo que estaba bateando;
  - en el último inning evita iniciar la mitad inferior si el equipo local ya está arriba.

- `scenes/main.gd`
  - resuelve si el pitch está dentro/fuera de zona antes del timing;
  - registra `BALL`;
  - registra walk al cuarto ball;
  - añade strike llamado si termina la ventana de timing;
  - mantiene foul con dos strikes sin sumar un tercer strike;
  - usa el índice del equipo bateador original cuando un out cambia `half`;
  - no envía un ball normal al flujo de animación de walk.

- `docs/baseball-rules-v1.md`
  - documenta las reglas concretas de esta revisión.

- `scenes/baseball_rules_test.gd`
- `scenes/baseball_rules_test.tscn`
  - pruebas de timing;
  - límites de zona;
  - walk con bases llenas;
  - walk con primera libre;
  - continuidad de lineup después del tercer out.

### Problemas encontrados

1. El simulador trataba todo lanzamiento fallido de contacto como `STRIKE`, por lo que `balls` nunca podía crecer.
2. El tercer out podía cambiar `half` antes de ejecutar `advance_lineup()`, haciendo que el índice avanzado perteneciera al equipo equivocado.
3. `main.gd` ya esperaba un campo `after_runners` para animar el movimiento posterior al batazo, pero `BaseballGameState.apply_hit()` no lo exponía. El contrato fue completado en el estado, sin duplicar lógica en el renderer.
4. El nuevo flujo de ball no debe invocar `animate_hit()` como si fuera un walk cuando todavía no hay cuatro bolas.

### Pruebas

La nueva prueba de Godot queda preparada para ejecución con:
`scenes/baseball_rules_test.tscn`

Cubre:
- etiquetas Perfect/Great/Good/Normal/Bad;
- límites de probabilidad de zona;
- walk con bases llenas;
- walk con primera libre;
- avance del lineup del equipo original después del tercer out;
- cierre del partido cuando el equipo local ya lidera tras la parte alta del último inning.

**No se declara ejecución runtime de Godot en esta revisión:** el entorno utilizado para la revisión no tiene el binario de Godot disponible.

Sí se realizó validación estructural mediante lectura de las versiones finales del repositorio después de cada escritura. La prueba runtime queda pendiente para un entorno con Godot 4.x.

### Estado

**Implementado:** conteo base, balls, walks, strikes, fouls, timing con timeout, pitch-zone resolver, transición de innings y protección del índice de lineup.

**Pendiente:** force outs detallados, rundowns, errores de recepción separados, sliding integrado al cálculo, stamina efectiva durante el partido, fórmula defensiva final de producción, runtime Godot, balance estadístico automatizado y modos de 5/9 innings.

### Porcentaje global revisado

El avance global estimado pasa de **≈64% a ≈67%**.

El aumento corresponde a completar una pieza real del bucle principal de béisbol. No se contabilizan como terminados los sistemas secundarios que todavía están únicamente diseñados.

### Regla de continuidad

El flujo vigente queda:

**Pitch → zona → Ball o Timing → contacto → FieldingResolver si corresponde → GameState → eventos/presentación**

No crear otro sistema paralelo de conteo. `BaseballGameState` es la autoridad del conteo, bases, carreras, lineup e innings.


# 29. Revisión 29: force outs, rundowns, recepción y sliding

**Fecha:** 2026-09-21  
**Tipo:** Núcleo de béisbol / defensa avanzada / corredores / presentación.

### Motivo

La Revisión 28 dejó pendientes explícitos del núcleo defensivo: force outs/rundowns, errores de recepción y sliding. Este bloque se implementa antes de avanzar a economía, gacha o crianza.

### Implementado

- `game/baseball/defensive_runner_resolver.gd`
  - resolución independiente de force out;
  - rundown ocasional y reproducible;
  - resolución de sliding;
  - metadatos de chance, roll, corredora y versión de regla.

- `game/baseball/fielding_resolver.gd`
  - añade `reception_v1`;
  - una captura exitosa puede fallar durante la recepción;
  - una recepción fallida produce `FIELDING ERROR`;
  - una recepción fallida no genera automáticamente un lanzamiento posterior.

- `game/baseball/game_state.gd`
  - `apply_force_out`;
  - `apply_rundown_out`;
  - actualización coherente de RunnerToken, bases y conteo.

- `scenes/main.gd`
  - integra DefensiveRunnerResolver después de FieldingResolver;
  - separa double play, force out, rundown y recepción;
  - aplica primero el resultado lógico y después lo presenta.

- `game/avatar/baseball_field_avatar_presenter.gd`
  - presenta force out;
  - presenta rundown;
  - utiliza la pose SLIDE existente;
  - sincroniza las bases desde el estado final.

- `docs/defensive-rules-v1.md`
  - fórmulas y contratos documentados.

- `scenes/defensive_rules_test.gd` + `defensive_rules_test.tscn`
  - regresión para force out;
  - sliding;
  - rundown mediante seeds;
  - recepción como error defensivo.

### Decisiones arquitectónicas

1. No se agrega una estadística nueva. Speed y Defense cubren las funciones necesarias.
2. DoublePlayResolver conserva prioridad sobre la resolución individual de corredores.
3. ReceptionError es una fase separada de la captura y del lanzamiento.
4. El renderer no decide si una corredora llega safe o queda out.
5. Sliding reutiliza la pose SLIDE ya existente, evitando duplicar el sistema de animación.

### Problemas encontrados y correcciones

- La recepción fallida inicialmente podía caer en la ruta de lanzamiento posterior. Se separó por `reason == "FIELDING MISS"`.
- La resolución de force out necesita conservar el equipo bateador original incluso cuando un out cambia de mitad. `main.gd` ya captura `batting_team_index` antes de mutar el estado.
- El estado visual de runners se sincroniza después de la jugada para evitar que una corredora eliminada permanezca en una base visualmente ocupada.

### Pruebas

Pruebas estructurales añadidas:
- límites de force out;
- tipo de slide;
- rundown encontrado con seeds deterministas;
- recepción error encontrado con seeds deterministas.

**Runtime Godot:** pendiente. Este entorno no dispone del binario Godot, por lo que no se declara ejecución runtime.

### Estado

**Implementado:** bloque lógico de force outs, rundown, recepción independiente y sliding integrado a presentación.

**Pendiente:** rundown físico paso a paso, tag plays más detalladas, force chains completos en todas las configuraciones, integración avanzada de errores de lanzamiento y validación runtime.

### Arte de personajes

La biblioteca de 30 personajes continúa usando `character_archetypes.json` como fuente de verdad. Se mantiene el pipeline:

`CharacterArchetypeCatalog → AvatarProfile → prompt → arte → renderer`

Se prepara además una salida vectorial procedural por personaje como arte de prototipo intercambiable, sin alterar gameplay ni estadísticas.

### Porcentaje global revisado

El avance global estimado pasa de **≈67% a ≈70%**.

El aumento representa completar una capa pendiente del núcleo defensivo. No se cuentan como terminados runtime Godot, arte de producción, economía, gacha, crianza, backend ni PvP.

### Regla de continuidad

El núcleo defensivo vigente queda:

**FieldingResolver → Reception → DoublePlayResolver / DefensiveRunnerResolver → GameState → Presentation**

No duplicar estas decisiones en `main.gd`, renderer, UI o animaciones.


# 30. Revisión 30: consolidación canónica del arte de personajes

**Fecha:** 2026-09-21  
**Tipo:** Arte / continuidad / documentación / pipeline de contenido.

### Motivo

Las revisiones 26, 27 y 29 ya habían establecido el roster de 30 personajes, la guía visual y los assets SVG de prototipo, pero la información artística permanecía distribuida entre varias páginas. Se consolida ahora en un único documento canónico para evitar reinterpretaciones o duplicación futura.

### Implementado

- `docs/canon/character-art-canon-v1.md`
  - consolida las decisiones artísticas de las revisiones 26, 27 y 29;
  - define autoridad de datos;
  - fija reglas de variantes;
  - fija lenguaje visual;
  - documenta la guía visual;
  - documenta los 30 assets SVG;
  - establece estado Canónico / En desarrollo / Pendiente;
  - conserva explícitamente la separación entre arte y gameplay.

- `docs/character-art-pipeline.md`
  - enlaza el documento canónico y conserva las instrucciones operativas.

- `docs/baseball-waifus-visual-guide.md`
  - enlaza el canon consolidado y mantiene su función de referencia visual.

### Decisiones canónicas consolidadas

1. `game/characters/character_archetypes.json` continúa siendo la fuente de verdad de identidad y datos del roster.
2. El roster inicial tiene 30 personajes adultos, `bw001`–`bw030`.
3. Las variantes solo pueden cambiar color de cabello, peinado y escala corporal global 0.94–1.06.
4. La guía visual establece lenguaje artístico, no nombres ni estadísticas.
5. Los SVG generados son prototipos reemplazables, no arte anime final.
6. La generación artística nunca modifica PlayerData ni decide gameplay.
7. No se crea un segundo catálogo ni una segunda fuente de verdad.

### Arte generado

Los 30 assets procedurales ya existentes quedan formalmente registrados como prototipos de roster en el canon.

El pipeline reproducible queda:

`character_archetypes.json → generate_svg_roster.py → assets/characters/generated/`

El manifest correspondiente es:

`assets/characters/generated/manifest.json`

### Pruebas

Validación estructural del repositorio:
- documento canónico creado;
- pipeline enlazado;
- guía visual enlazada;
- manifest de assets conservado;
- historial de revisiones 26, 27 y 29 conservado.

**Runtime Godot:** no ejecutado en este entorno.

### Estado

**Implementado:** consolidación documental del canon artístico y trazabilidad del pipeline.

**En desarrollo:** retratos anime individuales, poses, expresiones, sprites/rig final y arte final de equipamiento.

### Porcentaje

El porcentaje global se mantiene en **≈70%**. Esta revisión mejora continuidad y trazabilidad, pero no se contabiliza como un gran bloque de gameplay.

### Regla de continuidad

A partir de esta revisión, cualquier trabajo artístico debe comenzar leyendo:

`docs/canon/character-art-canon-v1.md`

y utilizar `character_archetypes.json` como autoridad de identidad.

Las revisiones históricas no se borran.


# Revisión 31: Amor o Encanto + separación 2D/3D de arte

**Fecha:** 2026-09-21
**Tipo:** Sistema de progresión social / contenido / arquitectura visual / prototipo 3D.

### Motivo

El núcleo defensivo y la consolidación del canon artístico ya estaban implementados. El siguiente bloque añadido es una capa de interacción de colección que no debe alterar la resolución del béisbol, junto con la primera implementación del modelo 3D de gameplay para que el arte 2D de cartas no termine funcionando como sustituto del personaje en el campo.

### Qué se implementa

Sistema Amor o Encanto:
- Encanto 0-100.
- Bonus primario determinista de +1 por cada punto de Encanto.
- Cada 10 puntos: +1 a tres estadísticas secundarias deterministas por posición.
- Límite de estadísticas de gameplay en 100 tras aplicar el bonus.
- Cinco tipos de regalos con cantidades finitas.
- Persistencia local del estado.
- Máximo de 3 personajes conversados por día.
- Una charla diaria por personaje.
- 10 conversaciones por cada uno de los 30 personajes.
- Tres respuestas por conversación.
- Respuesta correcta: +20 Encanto.
- Respuesta incorrecta: +3 Encanto.
- Catálogo generado desde la identidad existente del roster, sin inventar personajes ni estadísticas.

Archivos principales:
- game/progression/charm_system.gd
- game/progression/charm_state_store.gd
- game/progression/charm_dialogue_catalog.gd
- game/progression/charm_dialogues.json
- game/progression/charm_rules_test.gd
- scenes/charm_rules_test.tscn
- docs/canon/charm-and-affection-canon-v1.md

Modelo 3D de gameplay:
- game/avatar3d/pixel_3d_baseball_character.gd
- game/avatar3d/pixel_3d_batting_controller.gd
- game/avatar3d/pixel_3d_ball_presenter.gd
- game/avatar3d/pixel_3d_match_stage.gd
- game/avatar3d/player_3d_avatar_adapter.gd
- scenes/pixel_3d_match_test.tscn
- scenes/pixel_3d_gameplay_test.tscn

El modelo es procedural low-poly/pixel-friendly, sin assets externos. El controlador representa READY, LOAD, SWING, FOLLOW_THROUGH, RUN, SLIDE, CATCH, THROW, CELEBRATE y DEFEAT. La pelota utiliza una trayectoria de presentación independiente.

### Decisiones arquitectónicas

1. PlayerData sigue siendo la fuente de gameplay.
2. CharmSystem calcula bonus de afinidad, nunca el renderer.
3. CharmStateStore conserva límites diarios y materiales.
4. CharmDialogueCatalog conserva el contenido de preguntas y respuestas.
5. La UI futura solo presentará opciones y resultados.
6. El arte 2D plano queda reservado para fichas/cartas/colección.
7. El modelo 3D pixel/low-poly se reserva para gameplay y animación.
8. Ambos renderers consumen AvatarProfile y no pueden modificar resultados de béisbol.
9. No se incorpora streaming, webcam, OBS ni tracking al flujo de este bloque.

### Pruebas

**Pruebas estructurales implementadas:**
- Encanto no supera 100.
- Bonus primario y secundarios son deterministas.
- Bonus secundario aparece al alcanzar cada múltiplo de 10.
- Límite diario de 3 charlas.
- Un personaje no puede recibir dos charlas el mismo día.
- Stock de regalos se consume y no puede quedar negativo.
- El catálogo contiene 10 conversaciones y exactamente una respuesta correcta por conversación.

**Runtime:** no se ejecutó Godot en este entorno. Las escenas de test están preparadas, pero no se declara una validación runtime.

### Problemas/correcciones

La primera generación del catálogo de diálogos podía producir respuestas duplicadas en preguntas de posición/rareza. El catálogo fue regenerado para garantizar exactamente una respuesta correcta por pregunta.

El controlador 3D podía conservar desplazamientos de una pose anterior. Se añadió reinicio explícito de transformaciones antes de cada frame de acción.

### Estado

**Implementado:** sistema de Encanto funcional a nivel de lógica y persistencia local, contenido inicial para las 30 personajes, integración con PlayerData, pruebas estructurales, pipeline 3D procedural y animaciones principales.

**Pendiente:** menú/UI de Encanto, integración con inventario/economía futura, fuentes de materiales, guardado global de PlayerData, integración completa del renderer 3D con el partido principal, modelos 3D finales por personaje, rig/sprites de producción, animaciones de producción, audio/VFX finales y validación runtime en Godot.

### Porcentaje global revisado

El avance ponderado pasa de **≈70% a ≈74%**. El incremento refleja un bloque funcional nuevo de progresión social y el primer renderer 3D de gameplay, sin considerar como terminados los sistemas económicos, gacha, crianza, campaña completa ni el arte de producción final.

### Regla de continuidad

No se vuelve a usar el arte 2D de carta como modelo de campo. Las futuras mejoras visuales deben extender la bifurcación Card Renderer / Pixel 3D Gameplay Renderer y conservar PlayerData/AvatarProfile como fuente común.
