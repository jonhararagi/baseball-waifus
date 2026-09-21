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
**Estado actual:** Prototipo técnico en Godot 4.x + núcleo de béisbol defensivo + laboratorio/canon de personajes + pipeline visual 2D/3D + puente de streaming auxiliar. Godot 4.x queda adoptado como motor del prototipo y del juego actual; los adapters externos siguen siendo una capa visual opcional.

**Avance global revisado:** ≈93%.

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


# Revisión 32: Integración del modo Encanto y endurecimiento del prototipo 3D

**Fecha:** 2026-09-21
**Tipo:** Integración de UI / persistencia / corrección técnica.

### Qué se modifica

El modo Amor o Encanto pasa de lógica reutilizable a una interfaz interactiva conectada al prototipo principal:
- se añade CharmPanel;
- se puede abrir/cerrar con la tecla C;
- permite recorrer las 30 personajes;
- carga y guarda Encanto por ID;
- presenta la siguiente charla disponible;
- aplica la respuesta seleccionada mediante CharmSystem;
- consume regalos mediante CharmStateStore;
- muestra materiales restantes y límite diario.

La persistencia ahora conserva:
- Encanto por personaje;
- progreso de las 10 conversaciones por personaje;
- límite diario;
- personajes conversados ese día;
- materiales de regalos.

El prototipo 3D recibe correcciones de construcción:
- los brazos y el bate pasan a tener padres Node3D correctos;
- el controlador restablece transformaciones entre acciones;
- la búsqueda de acciones usa el diccionario de enum de forma estable;
- el adapter Player3DAvatarAdapter conserva la frontera PlayerData -> AvatarProfile -> renderer 3D.

### Archivos principales añadidos/modificados

- game/progression/charm_state_store.gd
- game/ui/charm_panel.gd
- scenes/main.gd
- game/characters/player_data.gd
- game/characters/character_archetype_catalog.gd
- game/avatar3d/player_3d_avatar_adapter.gd
- game/avatar3d/pixel_3d_baseball_character.gd
- game/avatar3d/pixel_3d_batting_controller.gd
- docs/canon/charm-and-affection-canon-v1.md
- docs/pixel-3d-gameplay.md

### Pruebas

La prueba estructural de CharmSystem sigue cubriendo:
- cap 100;
- bonus determinista;
- bonus de múltiplos de 10;
- 3 charlas diarias;
- un personaje una vez por día;
- consumo de materiales;
- 10 conversaciones y una respuesta correcta.

Se realizó además una validación estructural del catálogo JSON durante la generación, verificando que las 30 personajes tengan 10 conversaciones y cada una exactamente una respuesta correcta.

**Runtime Godot:** no ejecutado en este entorno. No se declara prueba de ejecución.

### Estado

**Implementado:** modo Encanto interactivo, persistencia por personaje, progreso de diálogos, regalos finitos, 30 x 10 conversaciones, integración en la escena principal y primer renderer 3D procedural con animación de bateo.

**Pendiente:** integración del inventario/economía general, adquisición real de materiales, integración completa del renderer 3D con todos los eventos del partido principal, modelos 3D finales y animaciones de producción.

### Porcentaje global revisado

El avance se mantiene en **≈74%**. La revisión mejora la integración y robustez del bloque, pero no se aumenta artificialmente el porcentaje porque todavía faltan economía, gacha, crianza, campaña completa, persistencia global, contenido y producción visual final.

### Regla de continuidad

El modo Encanto es una capa de progresión independiente del resultado del béisbol. La UI nunca decide estadísticas ni recompensas por sí misma.



# Revisión 33: endurecimiento defensivo y salto visual 2D/3D

**Fecha:** 2026-09-21  
**Tipo:** Corrección de integridad del partido / herramientas de arte / presentación de personajes.

### Motivo

La Revisión 29 ya había completado force outs, rundowns, recepción independiente y sliding. La Revisión 32 había dejado el renderer 3D como prototipo low-poly todavía demasiado cercano a primitivas geométricas. Además, una revisión del flujo actual detectó un problema de integridad en main.gd: BaseballGameState.apply_hit() ya actualiza el marcador, pero main.gd volvía a sumar las carreras, lo que podía duplicar el score de un hit. También el HUD podía mostrar 0 balls después de un walk porque el estado reinicia el conteo inmediatamente.

Este bloque corrige esas inconsistencias y avanza el arte sin cambiar los contratos existentes.

### Cambios de gameplay

- scenes/main.gd
  - elimina la suma duplicada de carreras después de apply_hit();
  - conserva el reset_count() en la capa de flujo después del hit;
  - registra 4 balls en current_result cuando el resultado es WALK antes de que el estado quede reiniciado a 0.

- scenes/baseball_rules_test.gd
  - añade regresión para comprobar que un Home Run suma exactamente una carrera y no duplica el score.

### Cambios de arte 2D

- tools/character_ai/generate_motion_svg_roster.py
  - nuevo generador determinista de hojas de movimiento SVG;
  - usa únicamente character_archetypes.json;
  - genera cuatro frames por personaje: IDLE, READY, SWING y RUN;
  - no inventa identidad, estadísticas ni gameplay;
  - prepara una biblioteca 2D animada reemplazable por sprites/rig final.

- scenes/character_art_motion_test.gd
- scenes/character_art_motion_test.tscn
  - recorren las 30 personajes del catálogo;
  - alternan automáticamente poses de béisbol;
  - sirven como banco visual de coherencia del roster.

- docs/character-art-production-v2.md
  - documenta la ruta 2D animada y la ruta 3D.

### Cambios de arte 3D

- game/avatar3d/pixel_3d_baseball_character.gd
  - sustituye el cuerpo basado principalmente en cajas por una figura modular con cápsulas, esferas y cilindros;
  - añade cabeza, masa de cabello, ojos, falda, brazos articulados, piernas, calzado, bate y gorra;
  - soporta ponytail/twin-tail según AvatarProfile;
  - usa materiales 3D iluminables en lugar de un render completamente plano.

- game/avatar3d/pixel_3d_match_stage.gd
  - añade iluminación de prueba;
  - permite que CONTACT reciba origen, destino y duración desde el payload de presentación.

- docs/pixel-3d-gameplay.md
  - registra la evolución del backend 3D.

- docs/canon/character-art-canon-v1.md
  - amplía el canon con la separación 2D animada / 3D estilizada.

### Decisiones arquitectónicas

1. No se crea un segundo catálogo de personajes.
2. character_archetypes.json sigue siendo la autoridad de identidad.
3. PlayerData → AvatarProfile continúa siendo la frontera común.
4. 2D y 3D son renderers intercambiables, no fuentes de gameplay.
5. Las referencias a Baseball Heroes/NIKKE se tratan como objetivos de presentación, no como assets, código o identidad visual a copiar.
6. Los errores de score se corrigen en el flujo existente sin mover autoridad desde BaseballGameState.
7. El resolver defensivo sigue siendo la autoridad para force out, rundown y recepción; esta revisión no duplica esas reglas.

### Pruebas

**Añadidas:** regresión estructural para score único después de apply_hit().

**No ejecutado:** runtime Godot. El entorno actual no dispone del binario Godot, por lo que no se declara ejecución de las escenas nuevas ni de la suite Godot.

**Validación disponible:** revisión estructural de los archivos finales del repositorio y preservación de los contratos existentes.

### Problemas encontrados y corregidos

- **Score duplicado:** apply_hit() ya mutaba score; main.gd volvía a sumar runs. Se eliminó la segunda mutación.
- **HUD de WALK:** el conteo se reinicia correctamente para continuar el siguiente turno, pero el resultado necesita conservar el valor histórico de cuatro balls. Se registra 4 en el evento visual antes del reset.
- **3D demasiado primitivo:** se amplió el mismo backend procedural, sin reemplazar AvatarProfile, el adapter ni el presenter.

### Estado

**Implementado:** endurecimiento del score del partido; corrección de visualización de WALK; generador 2D animado reproducible; preview de 30 personajes; backend 3D anime procedural enriquecido; documentación canónica actualizada.

**Pendiente:** runtime Godot; arte 2D de producción; modelos 3D de producción; rigging/clips finales; integración completa del renderer 3D con todos los eventos del partido; economía; gacha; crianza; campaña completa; persistencia global; backend/PvP.

### Porcentaje global revisado

El avance ponderado pasa de **≈74% a ≈76%**.

El aumento refleja una mejora real de integridad del núcleo y un salto del prototipo visual, pero no se considera terminado el arte de producción ni los sistemas económicos y de contenido todavía ausentes.

### Regla de continuidad

La base vigente queda:

**BaseballGameState + resolvers defensivos + presenters existentes**

y, para personajes:

**character_archetypes.json → PlayerData / AvatarProfile → 2D animado o 3D estilizado**

No crear una tercera fuente de identidad ni duplicar las reglas defensivas en el renderer.


# Revisión 34: auditoría técnica, terminología y biblia de inspiración

**Fecha:** 2026-09-21  
**Tipo:** QA estructural / corrección de términos / investigación de producto / continuidad de personajes.

### Motivo

La revisión del estado actual detectó que la documentación superior de la bitácora seguía mostrando ≈70% aunque revisiones posteriores habían llevado el avance a ≈76%. También había una responsabilidad de estado de partido que estaba mejor ubicada en BaseballGameState: apply_hit() debía limpiar el conteo por sí mismo, no depender de que la escena lo recordara.

Además, se solicitó una investigación sobre riesgos de popularidad, retención y gacha y una mini biblia para inspirar personalidades originales a partir de anime/manga sin copiar identidades.

### Correcciones técnicas

- game/baseball/game_state.gd
  - apply_hit() ahora llama a reset_count() después de resolver corredores y marcador.
  - Esto mantiene el conteo como responsabilidad del estado del partido y permite utilizar el resolver fuera de main.gd sin dejar balls/strikes antiguos.

- scenes/baseball_rules_test.gd
  - añade regresión para confirmar que un hit limpia balls y strikes.

### Documentación técnica

- docs/technical-glossary-v1.md
  - normaliza Pitch, Ball, Strike, Foul, Timing, Fielding Candidate, Force Out, Rundown, Presenter, Renderer, Resolver, Gacha, Pity y Power Creep;
  - aclara la frontera PlayerData → AvatarProfile → Renderer;
  - corrige nomenclatura: Gacha, no “garcha” en documentación técnica;
  - confirma que las rarezas vigentes son R/SR/SSR/UR;
  - evita introducir una rareza S por la expresión “S-SR”.

### Investigación de producto

- docs/research/baseball-market-retention-v1.md
  - registra una matriz de investigación sobre Baseball Heroes y juegos deportivos/gacha;
  - separa hipótesis de hechos verificables;
  - identifica retención, profundidad del béisbol, economía, gacha, contenido, accesibilidad, comunidad y diferenciación como áreas de investigación;
  - establece que no se declarará una causa concreta de fracaso sin fuente verificable.

El entorno de esta revisión no dispone de acceso web externo, por lo que no se inventaron fuentes ni se presentaron hipótesis como hechos.

### Biblia de personajes

- docs/canon/character-personality-inspiration-bible-v1.md
  - crea una fuente canónica de metodología, no una segunda fuente de identidad;
  - utiliza anime/manga populares como fuentes de estudio de rasgos;
  - extrae actitudes, defectos, virtudes y comportamientos, nunca personajes completos;
  - prohíbe copiar historia de origen, poderes, frases, relaciones, diseño o combinación visual distintiva;
  - incorpora una guardia de similitud antes de convertir una inspiración en personaje;
  - mantiene la rareza separada de la personalidad;
  - no modifica character_archetypes.json.

### Decisiones arquitectónicas

1. BaseballGameState conserva la autoridad del conteo.
2. Los presenters/renderers continúan siendo exclusivamente visuales.
3. No se agrega una nueva estadística para personalidad.
4. La personalidad será una capa de identidad/contenido separada de PlayerData estadístico.
5. Las referencias de anime/manga se convierten en ejes combinables y originales.
6. No se asignan todavía semillas de personalidad a personajes existentes para evitar contaminar el canon antes de una revisión individual.
7. La investigación de mercado queda separada de las reglas definitivas de gacha.

### Pruebas

**Añadida:** regresión estructural para limpieza del conteo después de apply_hit().

**Runtime Godot:** no ejecutado. El entorno no contiene el binario Godot.

**Investigación externa:** no verificada en web durante esta revisión; se registró explícitamente la limitación.

### Problemas encontrados

- Porcentaje superior de la bitácora desactualizado respecto de las revisiones 31–33.
- apply_hit() dependía parcialmente del flujo de escena para limpiar el conteo.
- Terminología informal podía entrar en documentación técnica.
- La expresión “S-SR” podía introducir accidentalmente una rareza inexistente.
- Faltaba una frontera documental entre inspiración de personalidad y copia de personajes.

### Estado

**Implementado:** corrección de ownership del conteo, prueba de regresión, glosario técnico, marco de investigación de producto y mini biblia canónica de inspiración de personalidad.

**Pendiente:** verificación web de fuentes sobre Baseball Heroes y juegos deportivos/gacha; cierre de fórmulas maestras; economía/gacha definitivo; asignación individual de personalidades; runtime Godot.

### Porcentaje global revisado

**≈77%.**

El aumento es pequeño porque esta revisión es principalmente de calidad, continuidad y documentación. No se contabiliza como terminado ningún sistema económico o de contenido que continúe pendiente.

### Regla de continuidad

Para nuevas personajes:

Referencia externa → rasgos abstractos → combinación original → revisión de similitud → personaje Baseball Waifus

Nunca:

personaje externo → cambio de uniforme/color → personaje Baseball Waifus.


## Revisión 35: auditoría de errores, terminología e integridad de estado

**Fecha:** 2026-09-21  
**Motivo:** continuar la auditoría técnica solicitada, concentrando el trabajo en términos ambiguos, errores de estado y prevención de errores comunes de juegos deportivos, gacha y nicho.

### Sistemas afectados
- BaseballGameState
- robo de bases
- terminología técnica
- documentación de economía/gacha
- documentación de personalidad
- QA y prevención de regresiones

### Cambios realizados
1. Se corrigió un caso de integridad en move_runner_on_steal(): una base destino ocupada ya no puede ser sobrescrita silenciosamente.
2. Se agregó un test estructural para verificar que un robo bloqueado no elimina ni reemplaza a la corredora existente.
3. Se amplió el glosario con Outcome, Invariant, State Transition, Modifier, Audit Payload, Blocked Action, Invalid State y Single Source of Truth.
4. Se documentó explícitamente el modificador actual de Potential para evitar doble aplicación futura.
5. Se registró que Lightning todavía no posee una matriz elemental definitiva.
6. Se creó docs/research/common-niche-game-failures-v1.md como bitácora preventiva de errores comunes de juegos de nicho, deportivos, de colección y gacha.
7. La investigación externa sobre Baseball Heroes sigue separada de las conclusiones: este entorno no dispone de búsqueda web verificable, por lo que no se inventó una causa de fracaso.
8. La mini biblia de personalidad sigue siendo una herramienta de inspiración abstracta. No se asignaron copias de personajes existentes al roster.

### Problemas encontrados y correcciones
- Problema: un robo exitoso hacia una base ocupada podía sobrescribir el estado existente.
- Corrección: la acción se marca como bloqueada y no modifica la base origen/destino.
- Problema documental: Potential tenía fórmula en código pero no contrato técnico explícito.
- Corrección: se incorporó al glosario.
- Problema de diseño pendiente: Lightning no tiene relaciones elementales cerradas.
- Corrección: se marcó como pendiente en lugar de inventar balance.

### Pruebas
- Se añadió un test estructural de robo bloqueado.
- Se mantuvieron los tests existentes de timing, pitch, walks, lineup, final de inning y hit.
- No se ejecutó Godot runtime en este entorno. El resultado es validación estática/estructural, no prueba end-to-end.

### Estado
Auditoría técnica y prevención de errores: mejorada y documentada.
Pendientes relevantes: fórmula definitiva de estadísticas, tabla elemental completa, integración de Encanto con roster global, gacha definitivo, economía, runtime Godot y balance estadístico.

**Avance global aproximado:** ≈78%.

## Revisión 36: endurecimiento offline-first y corrección de robo bloqueado

**Fecha:** 2026-09-21  
**Motivo:** establecer explícitamente que Baseball Waifus no dependerá de IA remota, APIs ni servicios online para el núcleo, y corregir una consecuencia detectada después de la Revisión 35.

### Cambios
- `scenes/main.gd`: un robo bloqueado por una base ocupada ya no se interpreta como robo fallido con out.
- La presentación distingue `STEAL BLOCKED` de un robo fallido real.
- Se creó `docs/architecture/offline-first-and-contingency-v1.md`.
- Se definieron contingencias para ausencia de red, assets corruptos, saves corruptos, incompatibilidad de datos, errores de animación, RNG inválido, recompensas duplicadas, soft-locks y configuración inválida.
- Se reafirma que la IA rival será local, determinista/heurística y sin LLM, API de IA o servidor de decisiones.

### Problema encontrado
La Revisión 35 protegía el estado de la base ocupada, pero el caller de `move_runner_on_steal()` seguía interpretando cualquier `success=false` como out. Eso convertía una protección de integridad en un resultado deportivo incorrecto.

### Corrección
Se separó:
- `blocked=true`: acción inválida/no aplicable, sin mutación y sin out.
- `success=false, blocked=false`: intento real de robo fallido, con out.

### Pruebas
- Se conserva la regresión de GameState para base ocupada.
- Validación estática de la nueva rama de presentación/estado.
- No se ejecutó Godot runtime en este entorno.

### Estado
Mejorada la resiliencia offline y corregida la semántica de acciones bloqueadas.

**Avance global aproximado:** ≈79%.

# Revisión 37: invariantes explícitos del estado del partido

**Fecha:** 2026-09-21  
**Motivo:** endurecer la base del núcleo de béisbol después de la auditoría de acciones bloqueadas. El siguiente riesgo estructural identificado era que BaseballGameState tenía reglas correctas en varios mutadores, pero no disponía de una validación central para detectar estados imposibles durante QA.

### Sistemas afectados
- BaseballGameState
- QA estructural del núcleo de béisbol
- pruebas de partido
- documentación de arquitectura/invariantes

### Cambios realizados
- game/baseball/game_state.gd
  - añade validate_invariants(context) como validador no mutante;
  - comprueba tamaño de bases, runners, marcador y alineaciones;
  - comprueba rangos de inning, half, outs, strikes y balls;
  - comprueba que los flags de bases coincidan con base_runners;
  - detecta player_id duplicados entre corredoras;
  - rechaza puntuaciones negativas e índices de lineup negativos;
  - comprueba coherencia básica de game_over y winner;
  - devuelve un payload auditable con valid, errors y context.
- scenes/baseball_rules_test.gd
  - añade regresiones para estado inicial válido;
  - primera base ocupada válida;
  - conteo de balls inválido;
  - corredora duplicada inválida;
  - restauración a estado válido;
  - Home Run posterior a la validación.

### Decisión arquitectónica
validate_invariants() no muta el partido y no sustituye a los resolvers ni a BaseballGameState. Es una herramienta de QA de la autoridad existente.

La validación se mantiene separada de la presentación. No se añade una segunda fuente de verdad ni se trasladan reglas a la UI.

### Problema que previene
Sin un validador central, un error futuro en un resolver podría producir una combinación como:
- flag de base distinto de su RunnerToken;
- dos runners con la misma identidad;
- conteo fuera de rango;
- score negativo;
- estado de partido terminado con runners todavía en bases.

El objetivo es detectar estas corrupciones en tests antes de que lleguen al renderer o al guardado.

### Pruebas
- Se añadieron casos estructurales para estados válidos e inválidos.
- Se revisó estáticamente la implementación final después de cada escritura.
- Runtime Godot: no ejecutado. El entorno actual no dispone del binario Godot, por lo que no se declara ejecución de la suite.

### Estado
**Implementado:** primera capa central de invariantes para BaseballGameState y regresiones asociadas.

**Pendiente:** ampliar la validación a contratos de RunnerToken, reglas de force chains y eventos de pelota; conectar el validador a una futura suite de runtime cuando exista Godot disponible; continuar con persistencia global, economía/gacha y balance del núcleo.

**Avance global aproximado:** ≈79%.

### Regla de continuidad
Antes de ampliar una mutación importante de BaseballGameState, el caso debe tener una invariante explícita o una prueba que demuestre qué estado válido produce. No crear validadores paralelos para el mismo estado.

# Revisión 38: preparación Android y publicidad recompensada offline-first

**Fecha:** 2026-09-21

## Motivo

Preparar la futura distribución de Baseball Waifus como aplicación Android y establecer una monetización de bajo impacto basada en anuncios de vídeo recompensados, sin introducir APIs, servidores, IA remota ni dependencia online en el núcleo del juego.

## Sistemas afectados

- Plataforma Android / exportación Godot.
- Monetización opcional.
- Energía global.
- Energía de personajes.
- Materiales.
- Persistencia local.
- Arquitectura offline-first.

## Cambios realizados

### Publicidad recompensada

Se creó:

- `game/monetization/rewarded_ad_policy.gd`
- `game/monetization/rewarded_ad_service.gd`
- `game/monetization/rewarded_ad_usage_store.gd`

La política establece tres categorías independientes:

1. Player Energy: +20.
2. Materials: +1 paquete de materiales.
3. Character Energy: +20.

Cada categoría dispone de un máximo de **10 recompensas por día**.

El núcleo no muestra anuncios ni depende de un proveedor externo. `RewardedAdService` funciona como contrato aislado para que una futura integración Android pueda informar disponibilidad y finalización.

### Regla de recompensa

La recompensa solo puede registrarse después de una finalización confirmada por el proveedor.

No se recompensa:

- abrir el anuncio;
- cerrar el anuncio;
- fallo del proveedor;
- ausencia de proveedor;
- categoría inválida;
- límite diario alcanzado.

El proveedor tampoco puede decidir la cantidad de recompensa.

### Persistencia

`RewardedAdUsageStore` guarda localmente:

- versión del formato;
- fecha UTC;
- contador de cada categoría.

El cambio de día reinicia los contadores de anuncios sin alterar el inventario.

### Android / Google Play

Se creó:

- `docs/android-google-play-v1.md`
- `docs/monetization/rewarded-ads-v1.md`

Se documentó:

- package ID previsto: `com.jonhararagi.baseballwaifus`;
- diferencia entre APK para QA y AAB para distribución de Google Play;
- firma de producción fuera del repositorio;
- ausencia de secretos en GitHub;
- permisos mínimos;
- Data Safety;
- clasificación de contenido;
- privacidad y consentimiento cuando corresponda;
- pruebas offline;
- pruebas de publicidad;
- necesidad de verificar los requisitos cambiantes de Play Console antes de cada release.

No se fijaron números de API objetivo de Google Play como constantes permanentes porque esos requisitos cambian y deben verificarse al momento de publicación.

## Decisión arquitectónica

La monetización es una capa opcional:

```
Android Ad Adapter
        ↓
RewardedAdService
        ↓
RewardedAdPolicy
        ↓
RewardedAdUsageStore
        ↓
Reward Transaction
```

Nunca:

```
Ad SDK → resultado de béisbol
Ad SDK → gacha
Ad SDK → estadísticas
Ad SDK → probabilidades
```

El juego debe continuar funcionando sin anuncios, sin red y sin proveedor.

La futura integración real de publicidad debe estar aislada como adapter de plataforma. No se introduce todavía un SDK externo porque el requisito del proyecto mantiene el núcleo sin APIs externas.

## Pruebas

Se añadieron:

- `scenes/rewarded_ad_policy_test.gd`
- `scenes/rewarded_ad_usage_store_test.gd`

Cubren:

- límite 10/10;
- independencia entre categorías;
- recompensas conocidas;
- categoría inválida;
- cambio de día;
- rechazo posterior al límite.

Se realizó revisión estática de los archivos creados.

**Runtime Godot:** no ejecutado. El entorno actual no dispone del binario Godot ni de un Android SDK configurado, por lo que no se declara generación o ejecución de APK/AAB.

## Problemas y correcciones

**Problema:** integrar directamente un proveedor de anuncios introduciría una dependencia externa incompatible con el principio offline-first del núcleo.

**Corrección:** se separó el contrato de publicidad del gameplay y se dejó el proveedor Android como adapter futuro.

**Problema:** un contador de anuncios en memoria permitiría perder o duplicar usos al cerrar la aplicación.

**Corrección:** se añadió persistencia local versionada por fecha UTC.

## Estado

**Implementado:** arquitectura de monetización recompensada, límites diarios, persistencia local, documentación Android/Google Play y tests estructurales.

**Pendiente:**
- exportación real desde Godot;
- Android SDK/JDK y Export Templates;
- firma release;
- build AAB;
- prueba en dispositivo físico;
- integración de un proveedor de anuncios real si se decide habilitar la capa comercial;
- configuración final de consentimiento, Data Safety y Play Console;
- validación de los requisitos vigentes de Google Play antes del lanzamiento.

**Avance global aproximado:** ≈80%.

## Regla de continuidad

La publicidad nunca puede convertirse en requisito para jugar un partido, avanzar en campaña o mantener una colección funcional. Debe ser una fuente opcional de recursos que ayude a sostener el proyecto sin transformar el béisbol en una máquina de anuncios.


# Revisión 39: autoridad local de progresión y transacciones de recompensas

**Fecha:** 2026-09-21

## Motivo

La arquitectura de anuncios ya tenía política y contador diario, pero todavía faltaba cerrar la frontera entre una recompensa publicitaria aceptada y el inventario real del juego. Mantener esa frontera abierta permitiría crear contadores paralelos de energía/materiales y provocar inconsistencias.

Además, el objetivo de diseño establece que los anuncios deben aportar ayuda pequeña y repetible, no entregar directamente personajes o equipamiento de alto valor.

## Sistemas afectados

- Progresión offline.
- Energía global.
- Energía individual de personajes.
- Materiales.
- Publicidad recompensada.
- Persistencia local.
- QA de transacciones.

## Cambios realizados

### PlayerProgressStore

Se creó:

- game/progression/player_progress_store.gd
- docs/progression/player-progress-store-v1.md

PlayerProgressStore se convierte en la autoridad local para:

- Player Energy: 0–100.
- Character Energy: 0–100 por personaje.
- Materials: cantidades enteras no negativas.

El estado se guarda en user://baseball_waifus/player_progress.json con formato versionado.

Contingencias implementadas:

- save inexistente → estado inicial válido;
- JSON corrupto o versión incompatible → reconstrucción segura;
- energía fuera de rango → clamp;
- materiales negativos → normalización;
- personaje sin entrada → energía inicial;
- error de escritura → resultado save_failed.

### RewardedAdTransaction

Se creó:

- game/monetization/rewarded_ad_transaction.gd
- scenes/rewarded_ad_transaction_test.gd

El flujo queda:

RewardedAdService → RewardedAdPolicy → RewardedAdTransaction → PlayerProgressStore

La transacción:

1. comprueba el límite diario;
2. obtiene la recompensa definida por la política;
3. aplica la mutación al recurso correspondiente;
4. registra el uso diario;
5. devuelve un payload auditable.

No entrega personajes, equipamiento SSR/UR ni moneda de gacha.

Las recompensas publicitarias siguen siendo recursos pequeños de mantenimiento/grindeo. El progreso de alto valor requiere los sistemas de juego correspondientes.

## Decisión de balance

Se mantiene el principio de que mirar anuncios puede aliviar el gasto diario de energía/materiales, pero no debe saltarse la progresión. Los límites de 10 usos diarios por categoría continúan separados.

La energía se limita a 100 por autoridad local, por lo que una recompensa no puede superar el máximo almacenado.

## Pruebas

Añadido test estructural para:

- +20 Player Energy;
- +1 material_bundle;
- +20 Character Energy;
- personaje requerido para Character Energy;
- límite 10/10;
- rechazo después del límite.

Runtime Godot: no ejecutado. El entorno no dispone del binario Godot ni Android SDK/JDK, por lo que esta revisión no declara pruebas de ejecución.

## Problemas encontrados y correcciones

**Problema:** la política de anuncios definía recompensas, pero todavía no existía una autoridad común de inventario.

**Corrección:** PlayerProgressStore centraliza los recursos y RewardedAdTransaction conecta la publicidad con esa autoridad.

**Problema de diseño:** una recompensa publicitaria directa de personaje/equipamiento raro reduciría la importancia de colección, fusión y progreso.

**Corrección:** las categorías publicitarias quedan restringidas a energía global, materiales y energía de personaje.

## Estado

**Implementado:** autoridad local de recursos, persistencia versionada y transacción de recompensas conectada a la política de anuncios.

**Pendiente:** costes definitivos de partidos/entrenamiento, regeneración natural de energía, economía completa, inventario de equipamiento, gacha, campaña y validación runtime.

**Avance global aproximado:** ≈81%.

## Regla de continuidad

Toda futura fuente de energía, materiales o energía de personaje debe mutar PlayerProgressStore. No crear balances paralelos en UI, anuncios, campaña o entrenamiento.


# Revisión 40: economía local, regeneración y endurecimiento del estado de béisbol

**Fecha:** 2026-09-21

## Motivo

El sistema ya tenía una autoridad local de energía/materiales y una política de anuncios, pero todavía existían fronteras abiertas que podían producir errores de estado:

- energía sin regeneración persistente;
- límites de campaña todavía separados de la entrada real a un partido;
- posibilidad de consumir energía sin una transacción de entrada completa;
- recompensas publicitarias sin una capa final que persistiera de forma atómica el uso diario;
- una debilidad en la conservación de corredores durante un force-out en segunda/tercera.

El objetivo de esta revisión es convertir estos puntos en contratos explícitos y resistentes a fallos, sin introducir IA, backend ni APIs externas.

## Sistemas afectados

- Progresión.
- Energía.
- Campaña.
- Persistencia.
- Publicidad recompensada.
- Corredores.
- Defensa.
- QA.

## Cambios implementados

### Economía

Se crearon:

- game/progression/economy_rules.gd
- game/progression/campaign_attempt_store.gd
- game/progression/campaign_entry_service.gd
- docs/progression/economy-v1.md
- scenes/progression_rules_test.gd

Costes actuales:

- Normal: 10 energía.
- Hard: 15.
- Hell: 15.
- Demon King: 25.

Límites actuales:

- Normal/Hard/Hell: 10 intentos por mapa y ciclo.
- Demon King: 3 intentos por jefe y ciclo.

La entrada al partido ahora tiene una autoridad separada de las recompensas:

actividad → validación de intento → consumo de energía → persistencia del intento → partido

Si la persistencia del intento falla, la energía se restaura desde snapshot.

Los límites de campaña no se mezclan con las tablas de recompensas.

### Regeneración

PlayerProgressStore pasó a SAVE_VERSION 2.

Player Energy y Character Energy regeneran +1 cada 6 minutos mientras están por debajo de 100.

La regeneración utiliza timestamps locales, por lo que cerrar el juego no elimina el tiempo de recuperación.

No existe overflow por encima de 100.

Se añadieron snapshots/restauración para transacciones locales.

### Publicidad recompensada

Se creó:

- game/monetization/rewarded_ad_claim_service.gd
- scenes/rewarded_ad_claim_service_test.gd

La cadena queda:

proveedor de plataforma → RewardedAdService → RewardedAdClaimService → RewardedAdTransaction → PlayerProgressStore

RewardedAdClaimService carga el contador diario persistente, verifica el límite, aplica la recompensa y guarda el uso. Si guardar el contador falla, restaura el snapshot de progresión.

La publicidad sigue limitada a:

- Player Energy;
- Materials;
- Character Energy.

No entrega directamente personajes SSR/UR, equipamiento SSR/UR ni moneda premium.

### Corrección defensiva

Se corrigió BaseballGameState.apply_force_out().

El código anterior podía eliminar o reemplazar corredores que debían conservarse cuando el force-out ocurría en segunda o tercera.

Ahora el resultado conserva correctamente la cadena de fuerza.

Se añadió una prueba con bases cargadas:

- corredor A en primera;
- corredor B en segunda;
- corredor C en tercera;
- C es puesto out en tercera;
- A avanza a segunda;
- B avanza a tercera;
- la bateadora ocupa primera.

También se valida el estado mediante validate_invariants().

## Errores potenciales analizados

### Error 1: recompensa duplicada

Controlado mediante contador diario persistente y una única autoridad de claim.

### Error 2: energía negativa

Controlado por consume_player_energy() y los límites de PlayerProgressStore.

### Error 3: energía que supera 100

Controlado por clamp y regeneración sin overflow.

### Error 4: perder regeneración al cerrar el juego

Resuelto mediante timestamps.

### Error 5: gastar energía y no poder entrar al mapa

La entrada ahora comprueba el límite antes de consumir y restaura energía si la persistencia del intento falla.

### Error 6: anuncio visto pero recompensa no persistida

El adaptador no decide el premio. El claim service persiste el uso y la mutación. Un fallo de persistencia invalida la confirmación.

### Error 7: anuncios reiniciando el progreso de campaña

Los anuncios no tienen autoridad sobre CampaignAttemptStore.

### Error 8: force-out que destruye corredores legítimos

Corregido mediante conservación explícita de la cadena de fuerza.

### Error 9: mezcla entre resultado y presentación

No se introdujo ninguna nueva autoridad visual. La economía y la defensa permanecen fuera del renderer.

## Pruebas

Se añadieron pruebas estructurales para:

- costes de partido;
- límites de campaña;
- consumo de energía;
- límite de Demon King;
- persistencia del claim publicitario;
- límite 10/10;
- conservación de la cadena de fuerza.

Runtime Godot: no ejecutado. El entorno disponible no contiene el binario de Godot ni el stack Android necesario.

No se afirma validación hardware ni ejecución de APK.

## Estado

**Implementado:**

- autoridad económica local;
- regeneración offline;
- entrada de campaña transaccional;
- contador de intentos;
- claim publicitario persistente;
- corrección de force-out;
- pruebas estructurales correspondientes.

**Pendiente:**

- entrenamiento persistente;
- inventario completo;
- monedas/Materials definitivos;
- gacha;
- pity/garantías;
- fusión;
- crianza;
- simulación estadística de balance;
- IA rival completa;
- runtime Godot;
- exportación Android real.

## Avance global aproximado

**≈83%.**

El porcentaje sigue representando alcance técnico ponderado, no porcentaje de código final.

## Regla de continuidad

Ningún sistema nuevo debe crear contadores paralelos para energía o intentos de campaña.

Toda entrada a contenido que consuma energía debe pasar por PlayerProgressStore/CampaignEntryService.

Toda recompensa publicitaria debe pasar por RewardedAdClaimService.

Toda resolución de force-out debe conservar la cadena de corredores y terminar validando invariantes cuando sea posible.



# Revisión 41: pacing de energía y mapas de grindeo

**Fecha:** 2026-09-21

## Motivo

Revisar los costes de la Revisión 40 para que fortalecer al equipo no genere un muro de energía al pasar de Normal a Hard. También faltaba formalizar los mapas clásicos de farmeo de recursos como actividades separadas de la historia.

## Sistemas afectados

- Economía de energía.
- Límites de repetición.
- Campaña.
- Mapas de grindeo.
- Progresión de personajes.
- Equipamiento.
- Amor/Encanto.

## Cambios realizados

### Costes vigentes

- Normal: **10 energía**, 10 intentos.
- Hard: **10 energía**, 10 intentos.
- Hell: **15 energía**, 10 intentos.
- Demon King: **20 energía**, 3 intentos.

La reducción de Hard de 15 → 10 es deliberada. Hard debe sentirse como el siguiente escalón de progreso y ofrecer mejores materiales/recompensas, no como una penalización de energía por haber avanzado.

Demon King baja de 25 → 20. Su diferencia principal queda en la calidad/identidad de sus recompensas y en el límite de 3 ataques.

### Mapas de grindeo

Se incorporan a la misma autoridad de entrada:

- `character_materials`: 10 energía, 10 intentos.
- `equipment`: 10 energía, 10 intentos.
- `r_cards_charm`: 10 energía, 10 intentos.

Se creó `docs/progression/farming-maps-v1.md` para documentar su propósito y pacing.

### Endurecimiento de intentos

`CampaignAttemptStore.consume_attempt()` ahora trabaja sobre una copia profunda del estado, persiste esa copia y solamente actualiza el estado recibido después de un guardado exitoso.

Esto evita que un `save_failed` deje el diccionario del caller con un intento consumido en memoria aunque el archivo no lo haya registrado.

## Pruebas

Se actualizaron las pruebas estructurales para verificar:

- Normal = 10.
- Hard = 10.
- Hell = 15.
- Demon King = 20.
- 10 intentos para Normal/Hard/Hell.
- 3 intentos para Demon King.
- mapas `character_materials`, `equipment` y `r_cards_charm` con 10 energía y 10 intentos.
- entrada Hard consume 10.
- entrada de materiales consume 10.

**Runtime Godot:** no ejecutado. El entorno actual no dispone del binario Godot, por lo que no se declara ejecución runtime.

## Estado

**Implementado:** nueva base de pacing económico y categorías de grindeo; persistencia de intentos endurecida.

**Pendiente:** tablas definitivas de recompensas por mapa, inventario completo de equipamiento, gacha, entrenamiento persistente, balance estadístico mediante simulación e integración runtime Godot.

**Avance global aproximado:** **≈83%**.

## Regla de continuidad

Los costes de entrada no deben modificarse desde la UI ni desde las tablas de recompensa. Toda actividad nueva debe registrarse en `EconomyRules` y utilizar `CampaignEntryService`.


# Revisión 42: endurecimiento de progresión y cola de entrenamiento

**Fecha:** 2026-09-21

## Motivo

Continuar la progresión después de cerrar el pacing de campaña/grindeo. Se detectó que PlayerProgressStore podía dejar cambios en memoria si un guardado fallaba. Además, las duraciones de entrenamiento ya existían en EconomyRules, pero todavía no había una cola persistente que evitara dobles reclamaciones.

## Sistemas afectados

- PlayerProgressStore.
- Entrenamiento.
- Persistencia offline.
- Economía de progresión.

## Cambios realizados

### Persistencia de PlayerProgressStore

Las mutaciones de energía/materiales ahora conservan un snapshot previo y restauran el estado en memoria si save_state() falla.

Esto mantiene la regla de que una operación con save_failed no debe aparentar haber aplicado la mutación localmente.

### Entrenamiento

Se creó:

- game/progression/training_queue_store.gd
- game/progression/training_service.gd
- scenes/training_queue_test.gd
- docs/progression/training-v1.md

La cola admite una actividad por personaje y guarda personaje, tipo, duración, timestamp de inicio y timestamp de finalización.

La reclamación es de una sola vez y se persiste antes de entregar el payload de ganancias.

### Ganancias v1

- 30m: +1 primaria.
- 2h: +2 primaria, +1 secundaria.
- 6h: +4 primaria, +2 secundaria.
- 12h: +7 primaria, +3 secundaria.
- 24h: +12 primaria, +5 secundaria.

Tipos:

- batting → Power/Contact.
- running → Speed/Stamina.
- pitching → Pitch/Control.
- defense → Defense/Critical.
- balanced → Contact/Stamina.

No se añadió un coste de energía/materiales porque esa regla no estaba cerrada previamente.

### Protección temporal

La cola detecta reloj retrocedido y bloquea la operación en vez de conceder progreso gratuito.

## Pruebas

El test estructural cubre duraciones, ganancias deterministas, inicio, rechazo de entrenamiento duplicado, entrenamiento todavía no terminado, reloj retrocedido, reclamación, ganancias de la reclamación y segunda reclamación rechazada.

**Runtime Godot:** no ejecutado. El entorno no dispone del binario Godot.

## Estado

**Implementado:** cola persistente offline y endurecimiento de mutaciones económicas.

**Pendiente:** autoridad persistente unificada del roster, aplicación atómica de las ganancias a PlayerData, inventario completo, tablas definitivas de recompensas, gacha, fusión y balance por simulación.

**Avance global aproximado:** **≈84%**.

## Regla de continuidad

El entrenamiento no debe crear una segunda fuente de verdad para estadísticas. Hasta que exista el almacenamiento persistente del roster, TrainingService entrega un payload determinista y la futura autoridad de personajes deberá aplicarlo de forma atómica.


# Revisión 43: validación de persistencia del entrenamiento

**Fecha:** 2026-09-21

## Motivo

Endurecer la cola de entrenamiento contra datos persistidos incompatibles o manipulados localmente.

## Cambio

`TrainingQueueStore` ahora valida al cargar cada registro:

- tipo de entrenamiento válido;
- duración válida;
- timestamp de inicio válido;
- timestamp de finalización no anterior al inicio;
- duración persistida exactamente igual a la duración de `EconomyRules`.

Antes de borrar una entrada completada durante `claim()`, también se valida que el payload de ganancias pueda resolverse desde las reglas actuales.

Un registro corrupto no se convierte en una recompensa ni en una reclamación parcial.

## Pruebas

Se mantiene el test estructural de cola y reclamación de la Revisión 42.

**Runtime Godot:** no ejecutado.

## Estado

**Implementado:** validación de persistencia y payload de entrenamiento.

**Avance global aproximado:** **≈84%**.

## Regla de continuidad

La cola de entrenamiento almacena intención y timestamps. Las ganancias siempre proceden de `EconomyRules`; ningún valor de ganancia se acepta directamente desde el archivo de guardado.


# Revisión 44: secondary motion corporal 3D

**Fecha:** 2026-09-21

## Motivo

El renderer 3D procedural ya disponía de cuerpo modular y estados de animación, pero las piezas corporales se comportaban como geometría rígida. Para que las jugadoras adultas tengan una presentación anime deportiva más convincente, se añade movimiento secundario amortiguado en torso/espalda, pecho, cadera/falda y muslos.

La intención es conseguir una lectura corporal dinámica, especialmente durante carrera, swing, slide y vistas de espalda o tres cuartos, sin copiar modelos o animaciones de terceros.

## Sistemas afectados

- Renderer 3D procedural.
- Animación de personajes.
- Presentación de partido.
- Pipeline visual.
- QA visual estructural.

## Cambios implementados

Se creó:

- `game/avatar3d/secondary_motion_3d.gd`
- `docs/secondary-motion-v1.md`
- `scenes/secondary_motion_test.gd`
- `scenes/secondary_motion_test.tscn`

Se modificó:

- `game/avatar3d/pixel_3d_baseball_character.gd`
- `game/avatar3d/pixel_3d_batting_controller.gd`

### Arquitectura

`Pixel3DBaseballCharacter` crea anclajes visuales independientes para:

- pecho izquierdo/derecho;
- torso;
- cadera/falda;
- muslo/pierna frontal;
- muslo/pierna trasera.

`SecondaryMotion3D` calcula una respuesta cinemática de resorte amortiguado.

El `Pixel3DBattingController` transforma cada acción en una intención de movimiento visual:

- READY;
- LOAD;
- SWING;
- FOLLOW_THROUGH;
- RUN;
- SLIDE;
- CATCH;
- THROW;
- CELEBRATE;
- DEFEAT.

El resultado se limita a presentación. No existe ninguna dependencia con `BaseballGameState`, probabilidades, estadísticas, IA o recompensas.

## Decisiones técnicas

1. Se usa spring-damping en lugar de cuerpos físicos y joints para mantener bajo el coste por personaje.
2. El movimiento secundario tiene límites de desplazamiento y rotación.
3. La capa corporal recibe intención de animación, no información de resultado.
4. Las masas de pecho usan el material del uniforme para conservar una lectura estilizada y no introducir assets adicionales.
5. La cadera se representa principalmente mediante el volumen/falda y su sway, evitando crear una segunda física de gameplay.
6. El sistema está preparado para que posteriormente un modelo de producción sustituya la geometría procedural sin cambiar el contrato de gameplay.

## Pruebas

Se añadió un test estructural que verifica:

- perfil bw001;
- creación del personaje 3D;
- existencia del componente SecondaryMotion3D;
- anclajes de pecho;
- anclaje de cadera/falda;
- anclajes de muslos;
- recepción de intención y nudge.

**Runtime Godot:** no ejecutado. El entorno disponible no contiene el binario Godot. Por tanto, esta revisión no declara validación visual runtime ni rendimiento en dispositivo.

## Problemas y correcciones

**Problema:** torso, falda y piernas eran piezas rígidas durante las acciones.

**Corrección:** se añadió una capa de movimiento secundario desacoplada del gameplay.

**Problema potencial:** usar física real por cada pieza elevaría el coste y podría producir resultados inestables entre muchos personajes.

**Corrección:** spring-damping cinemático con límites explícitos.

## Estado

**Implementado:** movimiento secundario corporal 3D y prueba estructural.

**Pendiente:** calibración visual runtime, clips de animación finales, modelos 3D de producción, materiales definitivos y prueba de rendimiento móvil.

## Avance global aproximado

**≈84%.**

El porcentaje sigue representando alcance técnico ponderado, no porcentaje de arte final.

## Regla de continuidad

Toda futura física visual corporal debe permanecer en la capa de presentación. Ningún movimiento secundario puede alterar el resultado del béisbol, hitboxes, estadísticas, probabilidades, recompensas o estado de partido.


# Revisión 45: autoridad persistente única del roster

**Fecha:** 2026-09-21

## Motivo

El proyecto ya disponía de `PlayerData`, `PlayerProgressStore`, `CharmStateStore` y una cola persistente de entrenamiento, pero el estado de una personaje estaba repartido entre varias autoridades. Esto impedía conectar de forma segura entrenamiento, estadísticas, Encanto, energía y futuro equipamiento sobre la misma instancia persistente.

## Sistemas afectados

- Personajes.
- Progresión.
- Entrenamiento.
- Encanto.
- Energía.
- Equipamiento.
- Adaptación visual.
- Persistencia local.

## Implementación

Se creó:

- `game/characters/character_roster_store.gd`
- `scenes/character_roster_test.gd`
- `scenes/character_roster_test.tscn`
- `docs/progression/character-roster-authority-v1.md`

Se modificó:

- `game/characters/player_data.gd`
- `game/progression/player_progress_store.gd`
- `game/progression/training_service.gd`
- `game/progression/training_queue_store.gd`
- `game/progression/charm_state_store.gd`

## Decisión arquitectónica
La separación vigente queda:

```
CharacterArchetypeCatalog
        ↓
CharacterRosterStore
        ↓
PlayerData runtime
        ↓
Gameplay / PlayerAvatarAdapter
        ↓
Presentation
```

El catálogo define el personaje base. El roster define la instancia que posee el jugador.

El roster pasa a ser autoridad de:

- nivel;
- potential;
- estadísticas;
- Encanto;
- ánimo;
- energía de personaje;
- regeneración de energía;
- referencias de equipamiento.

`PlayerProgressStore` conserva la energía de cuenta y materiales y mantiene sus métodos de energía de personaje como compatibilidad delegada al roster.

## Entrenamiento

El entrenamiento deja de ser solamente una cola que devuelve números.

Ahora:

1. se exige que la personaje pertenezca al roster;
2. la cola conserva la tarea;
3. al finalizar se calculan las ganancias mediante `EconomyRules`;
4. `CharacterRosterStore.apply_training()` modifica y persiste las estadísticas;
5. si la aplicación falla después de retirar la tarea, se intenta restaurar la tarea original.

Se mantienen caps de estadísticas en 100 y niveles 1-100.

## Encanto

`CharmStateStore` mantiene compatibilidad con diálogos/regalos, pero el Encanto de la personaje se carga y guarda mediante el roster.

Se añadió migración de valores existentes en `player_charm` cuando una personaje todavía no existe en el roster.

## Energía

La energía de personaje se mueve al registro persistente del roster, manteniendo el intervalo vigente de 360 segundos.

La energía de cuenta continúa en `PlayerProgressStore`.

Esto evita dos valores diferentes para la misma energía de personaje.

## Equipamiento

El roster ya tiene un diccionario de referencias por slot. No se mezclan todavía estadísticas de equipamiento con la resolución del béisbol. El siguiente paso será crear el catálogo/inventario de piezas y una autoridad de transacciones que aplique sus modificadores.

## Pruebas

Se añadió una prueba estructural para:

- creación/reconstrucción de una personaje;
- persistencia de estadísticas;
- entrenamiento;
- Encanto;
- ánimo;
- referencias de equipamiento;
- consumo/restauración de energía;
- restauración del snapshot del test.

También se añadió una ruta de rollback para reclamaciones de entrenamiento.

**Runtime Godot:** no ejecutado en este entorno. No se declara validación runtime.

## Problemas encontrados

**Problema:** el entrenamiento podía completar una cola sin tener todavía una autoridad persistente capaz de aplicar las estadísticas.

**Corrección:** `TrainingService` ahora usa el roster.

**Problema:** Encanto y energía de personaje podían existir fuera del futuro roster.

**Corrección:** ambos se delegan al roster.

**Problema:** un rollback de entrenamiento necesitaba conservar los timestamps originales de la tarea.

**Corrección:** `TrainingQueueStore.claim()` devuelve el registro temporal necesario y dispone de `restore_claim()`.

## Estado

**Implementado:** autoridad persistente de instancia de personaje y conexión con entrenamiento, Encanto y energía.

**Pendiente:** inventario/equipamiento completo, transacciones de rewards, gacha y migración de cualquier UI que todavía construya `PlayerData` aislado.

## Avance global aproximado

**≈85%.**

El porcentaje representa alcance técnico ponderado y no porcentaje de contenido artístico final.

## Regla de continuidad

No crear otro store que persista nivel, estadísticas, energía, Encanto, ánimo o equipamiento de una personaje. Las futuras recompensas, gacha, fusión, crianza y entrenamiento deben escribir mediante `CharacterRosterStore` o mediante una capa transaccional que lo utilice.


# Revisión 46: Autoridad unificada de inventario, equipamiento y rewards

**Fecha:** 2026-09-21  
**Tipo:** Progresión / economía / persistencia / transacciones.

### Motivo

El roster persistente ya era la autoridad de personajes, pero la economía todavía tenía únicamente energía/materiales básicos y los rewards no tenían una transacción común para conectar mapas, gacha, Demon Kings y futuras fuentes de contenido.

La prioridad de esta revisión es evitar que cada sistema cree su propio inventario o aplique recompensas directamente.

### Implementado

- `game/progression/player_progress_store.gd`
  - pasa SAVE_VERSION de 2 a 3;
  - mantiene Player Energy;
  - añade Coins;
  - mantiene Materials;
  - añade Equipment quantities;
  - conserva character_energy histórico solamente para compatibilidad;
  - añade operaciones atómicas con snapshot y rollback ante fallo de guardado;
  - añade `add_player_energy`, `consume_player_energy`, `add_coins`, `consume_coins`, `add_material`, `consume_material`, `add_equipment` y `consume_equipment`.

- `game/progression/equipment_catalog.gd`
  - catálogo inmutable de piezas;
  - slots gloves, bats, caps, vests, skirts y shoes;
  - validación de rareza y modificadores;
  - utiliza exclusivamente las ocho estadísticas existentes.

- `game/progression/equipment_catalog.json`
  - catálogo inicial de prototipo con piezas R/SR;
  - separa `visual_id` de los modificadores de gameplay;
  - no crea todavía drops SSR/UR ni tasas de gacha.

- `game/progression/reward_transaction_service.gd`
  - autoridad única para aplicar un lote de rewards ya resuelto mediante transacción compensatoria;
  - valida antes de mutar;
  - toma snapshot de PlayerProgressStore y CharacterRosterStore;
  - aplica en orden;
  - revierte ambas autoridades si una recompensa falla;
  - no afirma atomicidad de sistema de archivos ante un cierre exactamente entre dos escrituras;
  - soporta coins, player_energy, materials, equipment, character_energy, charm y character;
  - no decide probabilidades, pity, drops ni resultados de IA.

- `game/monetization/rewarded_ad_transaction.gd`
  - deja de mutar PlayerProgressStore directamente;
  - delega en RewardTransactionService.

- `game/monetization/rewarded_ad_claim_service.gd`
  - ahora toma snapshot de roster además del snapshot de cuenta;
  - un fallo al persistir el contador diario del anuncio puede revertir también energía de personaje.

- `scenes/reward_transaction_test.gd/.tscn`
  - valida catálogo;
  - valida batch de coins/material/equipment/character;
  - valida rechazo de reward inválido sin mutación;
  - restaura snapshots al finalizar.

- `docs/progression/inventory-equipment-rewards-v1.md`
  - documenta autoridad, inventario, catálogo, transacciones, migración y pendientes.

- `docs/research/inventory-reward-architecture-v1.md`
  - registra la revisión previa de arquitectura;
  - se conserva PlayerProgressStore en lugar de crear un InventoryStore paralelo;
  - no se añadieron dependencias externas.

### Corrección adicional

`CharacterRosterStore` tenía una referencia residual a `PlayerProgressStore.ENERGY_REGEN_SECONDS` dentro de su regeneración. Se reemplazó por su propia constante para mantener la independencia de autoridades y evitar una dependencia circular innecesaria.

### Decisiones arquitectónicas

La cadena de rewards queda:

```
RewardResolver / Map / Gacha / Demon King / Ads
                    ↓
          RewardTransactionService
             ↙               ↘
PlayerProgressStore     CharacterRosterStore
```

El resolver decide qué recompensa salió. La transacción decide si el payload es válido y cómo persistirlo. Ningún renderer, UI o IA recibe autoridad sobre economía.

Los duplicados de personajes todavía se rechazan. No se inventó una conversión a fragmentos o moneda hasta cerrar esa regla.

### Pruebas

Se añadió prueba estructural `reward_transaction_test` para catálogo, lote válido, rechazo de reward inválido y restauración de snapshots.

No se ejecutó Godot runtime en este entorno. Por tanto, esta revisión no afirma ejecución real de la escena de test.

### Problemas y correcciones

1. `RewardedAdTransaction` dependía de métodos de PlayerProgressStore que no estaban implementados en la versión persistida del archivo. Se incorporaron las operaciones de cuenta necesarias.
2. La recompensa de energía de personaje podía quedar fuera del rollback de anuncios si fallaba el guardado del contador diario. Se añadió snapshot/restauración del roster.
3. El sistema necesitaba inventario de equipamiento sin crear una segunda autoridad. Se amplió PlayerProgressStore en lugar de crear InventoryStore paralelo.
4. Los modificadores de equipamiento no se mezclaron todavía con los resolvers de béisbol. Esa integración queda separada para poder cerrar primero las fórmulas maestras.

### Estado

**Implementado:** autoridad de inventario de cuenta, catálogo de equipamiento, transacción común de rewards, rollback cruzado de cuenta/roster y compatibilidad con rewarded ads.

**Pendiente:** servicio equip/desequip, aplicación de modificadores de equipamiento a gameplay, RewardResolver existente conectado a esta autoridad, tablas definitivas de drops/gacha, pity/garantías y política de duplicados.

### Porcentaje global

Avance aproximado actualizado: **≈87%**.

El porcentaje refleja la implementación de una capa importante de persistencia/economía, no significa que el juego esté terminado. Continúan pendientes partes críticas de balance, IA rival, integración completa de recompensas con contenido, equipamiento aplicado al gameplay, UI final y validación runtime/export.

### Regla de continuidad

No crear otro almacén para coins, materials, equipment quantities, level, stats, charm, mood o character energy.

Las futuras recompensas de mapas, gacha, Demon Kings, fusión y crianza deben terminar en `RewardTransactionService` y escribir en las autoridades correspondientes.


# Revisión 47: Servicio de equipamiento y puente de estadísticas de gameplay

**Fecha:** 2026-09-21  
**Motivo:** conectar el inventario de equipamiento con personajes sin crear otra autoridad y preparar su consumo por los resolvers de béisbol.

### Sistemas afectados

- Inventario de cuenta.
- CharacterRosterStore.
- Catálogo de equipamiento.
- Progresión.
- Gameplay stat access.
- Tests.

### Implementado

- `game/progression/equipment_service.gd`
  - servicio único de equipar/desequipar;
  - valida personaje y pieza;
  - consume una copia al equipar;
  - devuelve al inventario la pieza reemplazada;
  - devuelve la pieza al inventario al desequipar;
  - usa snapshots compensatorios entre cuenta y roster;
  - valida también referencias antiguas antes de reemplazarlas;
  - impide que el renderer tenga autoridad sobre inventario.

- `game/baseball/equipment_stat_adapter.gd`
  - adapter de solo lectura para gameplay;
  - calcula `base stats + equipment modifiers`;
  - utiliza exclusivamente las ocho estadísticas maestras;
  - no contiene fórmulas de béisbol ni decide resultados.

- `scenes/equipment_service_test.gd/.tscn`
  - cubre equipar, consultar modificadores, desequipar y restauración de snapshots.

- `docs/progression/inventory-equipment-rewards-v1.md`
  - documenta equip/desequip y el puente de estadísticas.

### Decisión arquitectónica

La cadena queda:

```
CharacterRosterStore
       ↓
EquipmentService
       ↓
EquipmentCatalog
       ↓
EquipmentStatAdapter
       ↓
Baseball Resolvers
```

El inventario sigue perteneciendo a `PlayerProgressStore`. Las referencias equipadas pertenecen a `CharacterRosterStore`. El catálogo es inmutable. No se crea `EquipmentInventoryStore` ni otra fuente paralela.

Los modificadores de equipamiento son estadísticas efectivas de gameplay, pero no alteran permanentemente el stat base guardado en el personaje. Esto evita que equipar/desequipar produzca inflación permanente.

### Aplicación al béisbol

El adapter queda listo para que los resolvers existentes consuman estadísticas efectivas. No se duplican las fórmulas de contacto, pitch o defensa dentro del sistema de equipamiento.

### Pruebas

Se añadió test estructural para equipamiento y rollback.

No se ejecutó Godot runtime en este entorno. No se afirma validación runtime.

### Estado

**Implementado:** autoridad de inventario, catálogo, rewards, equip/desequip y adapter de estadísticas.

**Pendiente inmediato:** integrar el adapter en los resolvers concretos de pitch/contact/defense y verificar que ninguna escena siga usando directamente estadísticas base cuando corresponda.

**Pendiente posterior:** RewardResolver de mapas/gacha, tablas explícitas de drops, pity/garantías y política de duplicados.

### Avance aproximado

**≈88%.**

El porcentaje representa avance estructural del prototipo, no un estado de juego terminado. Runtime Godot, balance final, IA rival, UI final, audio/VFX, gacha completo y export Android siguen pendientes.

### Regla de continuidad

No crear otro almacén para equipamiento. No aplicar modificadores directamente al stat base persistente. Los resolvers deben consultar estadísticas efectivas mediante el adapter.


### Corrección posterior de Revisión 47: integración del simulador

**Fecha:** 2026-09-21

Se conectó `BaseballSimulator` al `EquipmentStatAdapter` para que las fórmulas existentes de pitch y contacto utilicen estadísticas efectivas de equipamiento sin modificar los stats base persistentes.

Puntos integrados:
- control efectivo del pitcher;
- contacto efectivo de la bateadora;
- power efectivo;
- critical efectivo.

No se modificaron las fórmulas de contacto, timing, elementos ni resultados. Solamente se cambió la fuente de lectura de la estadística.

No se ejecutó Godot runtime, por lo que la integración queda registrada como código preparado para validación runtime.


# Revisión 48: integración del equipamiento en defensa y corredores

**Fecha:** 2026-09-21  
**Tipo:** Gameplay / defensa / corredores / integración de estadísticas efectivas.

## Motivo

La Revisión 47 ya conectó EquipmentStatAdapter con BaseballSimulator para Control, Contact, Power y Critical. El siguiente paso lógico era evitar que el equipamiento quedara limitado a lanzamiento y bateo.

Se integró el mismo adapter en los resolvers defensivos y de corredores existentes, sin crear nuevas estadísticas ni duplicar fórmulas.

## Sistemas afectados

- FieldingResolver.
- DefensiveRunnerResolver.
- ThrowResolver.
- EquipmentStatAdapter.
- CharacterRosterStore.
- pruebas defensivas.
- documentación defensiva.

## Cambios realizados

### FieldingResolver

Ahora acepta opcionalmente CharacterRosterStore y obtiene Defense efectiva mediante EquipmentStatAdapter.

La fórmula fielding_v2 no cambia. Únicamente cambia la entrada:

base Defense + modificadores de equipamiento → Defense efectiva → fórmula existente.

### DefensiveRunnerResolver

Ahora acepta opcionalmente CharacterRosterStore.

Para force outs y rundowns obtiene Speed efectiva del RunnerToken mediante el player_id y EquipmentStatAdapter.

Esto permite que las piezas equipadas afecten únicamente cuando el catálogo les asigne la estadística correspondiente.

La fórmula defensive_runner_v1 no cambia.

### ThrowResolver

También se conecta al adapter para que la Defense efectiva de la defensora que lanza y de la receptora participe en throw_v1.

No se modifica la probabilidad base ni la autoridad del resolver.

### Compatibilidad

Los parámetros de roster son opcionales. Los callers existentes que todavía no tengan acceso al CharacterRosterStore conservan su comportamiento anterior.

La ruta completa con equipamiento queda preparada para que los entry points del partido pasen el roster persistente cuando corresponda.

## Pruebas

Se amplió scenes/defensive_rules_test.gd para comprobar:

- una pieza de velocidad aumenta la Speed efectiva usada por DefensiveRunnerResolver;
- una pieza defensiva aumenta la Defense efectiva usada por FieldingResolver;
- la fórmula de force-out recibe la Speed efectiva;
- los snapshots de cuenta y roster se restauran al terminar.

También se mantiene la regresión existente de force chain, rundown, sliding y reception error.

**Runtime Godot:** no ejecutado. El entorno actual no dispone del binario Godot, por lo que estas pruebas quedan preparadas y revisadas estructuralmente, no ejecutadas en runtime.

## Problemas encontrados y correcciones

- El adapter anterior estaba listo para recibir un roster, pero los resolvers defensivos no tenían una ruta explícita para suministrarlo.
- Se resolvió mediante un parámetro opcional, evitando romper las llamadas existentes.
- DefensiveRunnerResolver trabaja con RunnerToken, que conserva player_id y speed. Cuando existe roster, el resolver recupera la instancia persistente y recalcula Speed efectiva mediante el adapter.
- No se modificó RunnerToken para almacenar estadísticas duplicadas ni se creó otra autoridad.

## Decisiones arquitectónicas

1. EquipmentStatAdapter sigue siendo de solo lectura.
2. CharacterRosterStore continúa siendo la autoridad de la instancia de personaje.
3. EquipmentService sigue siendo la autoridad para equipar/desequipar.
4. Los resolvers siguen siendo la autoridad de los resultados deportivos.
5. El renderer no recibe autoridad adicional.
6. No se alteran stats base persistentes al equipar.
7. No se crean estadísticas nuevas.
8. No se crean fórmulas paralelas de defensa o corredores.

## Estado

**Implementado:**
- equipamiento → Defense efectiva → FieldingResolver;
- equipamiento → Speed efectiva → DefensiveRunnerResolver;
- equipamiento → Defense efectiva → ThrowResolver;
- pruebas estructurales de integración;
- documentación defensiva actualizada.

**Pendiente inmediato:**
- revisar cualquier lectura directa de stats base restante en gameplay;
- integrar RewardTransactionService con mapas/gacha/Demon Kings una vez revisadas las tablas de recompensas.

**Pendiente posterior:**
- tablas definitivas de drops;
- gacha con pity/garantías;
- IA rival;
- balance estadístico automatizado;
- runtime Godot;
- exportación Android.

## Porcentaje global

Avance aproximado actualizado: **≈89%**.

El incremento es pequeño y corresponde a integración de un sistema ya construido dentro de más resolvers del núcleo. No implica que el juego esté terminado ni que exista validación runtime.

## Regla de continuidad

No volver a conectar equipamiento directamente desde escenas o UI. La ruta válida continúa siendo:

CharacterRosterStore → EquipmentService/EquipmentCatalog → EquipmentStatAdapter → resolver de gameplay.


### Addendum de integración de entry point

**Fecha:** 2026-09-21

Se completó la conexión desde scenes/main.gd:

- CharacterRosterStore se carga al iniciar el partido;
- el roster persistente de las jugadoras del equipo del jugador se sincroniza con los PlayerData demo;
- FieldingResolver recibe CharacterRosterStore;
- DefensiveRunnerResolver recibe CharacterRosterStore;
- ThrowResolver recibe CharacterRosterStore.

De esta forma, la ruta efectiva ya no queda únicamente disponible en los resolvers: el flujo principal del partido puede utilizarla.

Los personajes del equipo rival que no pertenezcan al roster persistente conservan sus estadísticas base, por lo que no se crea propiedad accidental de personajes rivales.\n\nLa lectura de la estadística previa al equipamiento conserva PlayerData.effective_stat(), por lo que Charm/Potential existentes no se pierden al añadir modificadores de equipamiento.

**Runtime Godot:** sigue pendiente. Esta integración fue verificada por inspección estructural del código, no mediante ejecución de Godot.


### Revisión 49 — Diversidad de personajes adultos

**Fecha:** 2026-09-21

**Motivo:** establecer explícitamente que Baseball Waifus debe representar múltiples tipos de mujeres adultas, evitando que el roster termine siendo una misma silueta/arquetipo repetida con cambios de color.

**Sistemas afectados:**
- diseño de personajes;
- pipeline visual;
- roster;
- documentación de personalidad;
- separación gameplay/visual.

**Decisiones:**
- se mantienen y amplían los arquetipos corporales existentes;
- se contemplan personajes femeninos, curvilíneos/voluptuosos, atléticos, musculosos/tomboy, altos, bajos, delgados y robustos;
- se contemplan estilos desde idols muy arregladas hasta personajes deportivos, elegantes, callejeros o desarreglados;
- se incorporan como posibilidades de diseño detalles como pecas, ojeras, maquillaje, cabello cuidado/desordenado y distintos calzados;
- se permiten personalidades y hábitos muy diferentes, incluyendo personajes introvertidos o con estilo de vida hikikomori;
- ninguna característica corporal, estética o personalidad modifica estadísticas o probabilidades por sí misma.

**Archivos creados/modificados:**
- `docs/characters/character-diversity-v1.md`
- `docs/game-design.md`

**Pruebas/revisión:**
- se inspeccionó el catálogo actual de 30 personajes;
- actualmente existen los presets corporales `power`, `athletic`, `balanced`, `slim` y `curvy`;
- se decidió conservarlos en lugar de reemplazarlos;
- no se modificaron las 30 fichas individuales porque la nueva regla no debe alterar el canon visual existente sin una revisión personaje por personaje.

**Estado:** adoptado como principio de diseño del roster. La expansión de arquetipos y asignación de variantes queda para el pipeline/personajes cuando corresponda.

**Runtime Godot:** no aplica a esta revisión documental.

**Avance aproximado:** ≈89%.


## Revisión 50: identidad narrativa, diversidad funcional y acciones de firma

**Fecha:** 2026-09-21  
**Motivo:** evitar que la diversidad del roster se convierta en simples recolores y establecer cómo una personaje puede tener una identidad deportiva y narrativa distinta sin violar la separación entre apariencia y estadísticas.

### Sistemas afectados

- catálogo de personajes;
- identidad visual;
- diseño narrativo;
- futuras habilidades;
- futuras decisiones de bateo, pitcheo, corredores y defensa.

### Decisión arquitectónica

Se mantiene la separación:

`CharacterIdentity / AvatarProfile -> presentación`

`PlayerData -> estadísticas y progresión`

`Skill / Action Resolver -> gameplay`

La apariencia no puede inferir ni modificar Power, Contact, Speed, Pitch, Control, Defense, Critical, Stamina, rareza, probabilidades o recompensas.

Las R conservan una identidad deportiva base sin requerir una historia extensa. Las SR/SSR/UR incorporan una semilla de historia y una acción de firma. La rareza no garantiza que la acción tenga éxito.

### Implementación

Modificado:
- `game/characters/character_archetypes.json`
- `docs/game-design.md`
- `docs/bitacora.md`

Creado:
- `docs/characters/character-action-design-v1.md`

El catálogo pasó a `version: 2` y añadió `character_identity_v1` con:
- arquetipo;
- etiquetas de estilo;
- identidad de juego;
- estado de historia;
- semilla narrativa para SR/SSR/UR;
- acción de firma;
- contradicción estilística.

Las 30 identidades recibieron una combinación propia. No se modificaron sus estadísticas ni sus presets corporales existentes.

### Investigación

Se revisó vocabulario y estructura táctica de béisbol mediante búsqueda pública de GitHub y referencias de simulación. Se estudiaron, entre otras, acciones reales como:
- steal;
- pickoff;
- pitchout;
- hit-and-run;
- sacrifice bunt;
- bunt for a hit;
- squeeze play;
- sacrifice fly;
- take;
- defensive shift;
- infield playing in;
- relay/coverage.

También se inspeccionó `davidfwatson/game-simulator` y su `baseball.py` como referencia conceptual de simulación reproducible. No se copió código.

### Problemas encontrados

El catálogo visual anterior permitía demasiadas variaciones simples de pelo/color/cuerpo y no tenía un contrato explícito para diferenciar personajes por personalidad, historia y forma de jugar.

### Corrección

Se introdujo una capa de identidad separada del gameplay. La contradicción de estilo se utiliza como herramienta narrativa y como fuente para futuras habilidades, no como multiplicador oculto de estadísticas.

### Pruebas realizadas

- revisión estructural del JSON mediante parseo durante la actualización;
- comprobación de que los 30 IDs recibieran metadatos de identidad;
- revisión estática de que las estadísticas existentes se conservaran sin modificación;
- revisión de que las R no recibieran obligatoriamente una habilidad narrativa de firma;
- revisión documental de separación visual/gameplay.

**No se ejecutó Godot en runtime en este entorno**, por lo que no se registra una prueba de ejecución.

### Pendiente

- SkillResolver;
- contratos matemáticos de cada acción;
- integración con decisiones del jugador;
- integración con IA rival;
- pruebas reproducibles de acciones;
- balance de usos/cooldowns;
- historias completas de SR/SSR/UR.

### Estado

**Implementado a nivel de catálogo y diseño.** Las acciones de firma son contratos de diseño, todavía no ejecutan efectos de gameplay.

**Avance global aproximado:** ≈90%.


### Addendum de Revisión 50: prueba de catálogo

Posteriormente se añadieron:
- `scenes/character_identity_catalog_test.gd`
- `scenes/character_identity_catalog_test.tscn`

La prueba valida estructuralmente los 30 personajes, IDs únicos, presencia de estadísticas, esquema de identidad, diferencia R vs SR+, semillas narrativas y acciones de firma.

La prueba fue escrita, pero **no ejecutada en Godot runtime** en este entorno.


## Revisión 51: sistema de habilidades, buffs/debuffs y combinaciones

**Fecha:** 2026-09-21  
**Motivo:** convertir la idea de habilidades de personajes en una capa de gameplay basada en béisbol, permitiendo composiciones de equipo con atacantes, soporte, defensa y cadenas de combinación sin crear un RPG de daño ni garantizar resultados.

### Sistemas afectados

- habilidades de personajes;
- estado temporal de partido;
- resolución de contacto;
- Power;
- Contact;
- Control;
- Home Run;
- futuras decisiones de equipo;
- futura IA rival.

### Decisión arquitectónica

Se creó una capa data-driven:

`SkillResolver -> BaseballSkillState -> BaseballSimulator -> Baseball Result`

Las habilidades no modifican directamente el resultado final. Añaden modificadores temporales o condiciones que los resolvers existentes consumen.

Se mantienen las ocho estadísticas actuales. En particular, el concepto de "destreza" del pitcher se representa mediante **Control** en lugar de añadir Dexterity/Technique, porque esas estadísticas duplicarían responsabilidades existentes.

### Categorías adoptadas

- attack;
- defense;
- power_up;
- power_down;
- statistic;
- combination.

Estas categorías describen la función de una habilidad dentro del béisbol y no representan daño RPG.

### Ejemplo de combo implementado

Se documentó e implementó como referencia:

- `power_signal`: +3% Power al objetivo durante una acción;
- `pitch_pressure`: -3% Control al pitcher rival durante cuatro acciones de pitch;
- `flame_strike`: +5% Power durante una acción y +5 puntos porcentuales al modificador específico de Home Run.

Los efectos pueden acumularse. El ejemplo produce un escenario potencial de +8% Power para la bateadora objetivo si las ventanas coinciden.

**No se implementó "victoria asegurada".** El Home Run sigue dependiendo de contacto, timing, Power, Critical, dificultad del pitch, elementos, contexto y RNG. El modificador de Home Run también permanece acotado.

### Archivos creados

- `game/baseball/skill_state.gd`
- `game/baseball/skill_resolver.gd`
- `game/characters/skill_catalog.json`
- `docs/characters/skill-system-v1.md`
- `scenes/skill_system_test.gd`
- `scenes/skill_system_test.tscn`

### Archivos modificados

- `game/baseball/baseball_simulator.gd`

El simulador ahora acepta opcionalmente un `BaseballSkillState` sin romper las llamadas anteriores. Contact, Power y el modificador de Home Run pueden consumir el estado de habilidades.

### Correcciones durante implementación

1. Se detectó que el almacenamiento inicial de modificadores debía permitir múltiples efectos sobre la misma estadística. Se corrigió para permitir stacking.
2. Se corrigió el contrato de almacenamiento de condiciones de combinación para distinguir `combo_id`, objetivo y condición.
3. Se evitó introducir una estadística nueva para "destreza".
4. Se limitó el rango de modificadores para impedir que una combinación de buffs cree valores arbitrarios.
5. El sistema mantiene la separación entre decisión, modificador y resolución.

### Pruebas

Se creó un test reproducible que comprueba:
- carga del catálogo;
- presencia de las seis categorías;
- aplicación de +3% Power;
- aplicación de -3% Control;
- stacking hasta +8% Power;
- +5 puntos porcentuales de modificador de Home Run;
- duración del debuff durante cuatro acciones.

**No se ejecutó Godot runtime en este entorno.** Los tests fueron escritos y revisados estáticamente, pero no se registra una ejecución real.
### Pendiente

- asignar habilidades definitivas a personajes;
- diseñar costes/cooldowns;
- implementar las 26 acciones de firma;
- integrar defensa, robo y pitch;
- añadir interfaz de elección;
- conectar IA rival;
- ejecutar simulaciones de balance con seeds;
- comprobar distribución real de victorias y resultados.

### Estado

**Implementado como infraestructura funcional de código y catálogo; balance y contenido completo de habilidades pendientes.**

**Avance global aproximado:** ≈91%.


### Addendum de Revisión 51: roles de habilidad del roster

Se añadió `skill_roles` a las 30 identidades del catálogo. Esto permite distinguir desde diseño entre:
- attack;
- defense;
- power_up;
- power_down;
- statistic;
- combination.

Los roles son una guía de construcción de kit, no modificadores estadísticos automáticos ni una ventaja por rareza. El test de catálogo fue actualizado para exigir al menos un rol por personaje.

No se asignaron todavía valores matemáticos únicos a las 26 acciones de firma; esos efectos se implementarán contra los resolvers concretos de bateo, pitcheo, defensa y corredores para evitar habilidades que funcionen fuera de las reglas reales del béisbol.

## Revisión 52: integración de habilidades con pitcheo, defensa y corredores

**Fecha:** 2026-09-21  
**Motivo:** llevar la infraestructura de habilidades de la Revisión 51 a los resolvers reales del béisbol, evitando crear fórmulas paralelas por habilidad.

### Sistemas afectados

- BaseballSkillState
- SkillResolver
- BaseballSimulator
- FieldingResolver
- DoublePlayResolver
- DefensiveRunnerResolver
- RunnerSystem
- entry point scenes/main.gd
- catálogo de habilidades
- pruebas y documentación

### Implementación

Se amplió BaseballSkillState para almacenar dos familias de modificadores:

1. modificadores estadísticos, ya existentes;
2. modificadores de acción, destinados a resoluciones concretas como steal, fielding, double_play, defensive_cover y runner_batter_combo.

SkillResolver ahora entiende action_buff y action_debuff, manteniendo el mismo contrato data-driven.

### Pitcheo

BaseballSimulator.pitch_in_zone_probability() y resolve_pitch() aceptan opcionalmente BaseballSkillState.

Esto conecta habilidades como Pitch Down y Pitch Pressure con Control efectivo del pitcher sin modificar directamente el resultado.

Los límites de probabilidad y el RNG siguen perteneciendo al simulador.

### Defensa

FieldingResolver recibe BaseballSkillState y puede consumir Defense modificada por habilidades y el modificador de acción fielding.

DoublePlayResolver consume el modificador double_play cuando la jugada ya es elegible.

Se conserva la autoridad del resolver: una habilidad solo cambia una probabilidad acotada y nunca crea un doble play automático.

### Corredores

RunnerSystem.attempt_steal() pasó a runner_v2 y acepta un RNG externo opcional.

Ahora devuelve:
- éxito;
- probabilidad;
- roll;
- modificador aplicado;
- versión de regla.

Esto permite reproducibilidad mediante el RNG compartido del partido.

Se conectaron:

- Steal Up → acción steal;
- Pickoff Counter → acción steal;
- Defensive Cover → cobertura defensiva;
- Runner to Batter → modificador temporal de contacto tras una acción de robo exitosa.

### Entry point

scenes/main.gd mantiene un BaseballSkillState por partido y lo suministra a:

- resolución de pitch;
- resolución de contacto;
- fielding;
- corredores defensivos;
- robo.

La presentación no recibe autoridad nueva.

### Archivos modificados

- game/baseball/skill_state.gd
- game/baseball/skill_resolver.gd
- game/baseball/baseball_simulator.gd
- game/baseball/fielding_resolver.gd
- game/baseball/double_play_resolver.gd
- game/baseball/defensive_runner_resolver.gd
- game/baseball/runner_system.gd
- game/characters/skill_catalog.json
- scenes/main.gd
- scenes/skill_system_test.gd
- docs/characters/skill-system-v1.md
- docs/game-design.md
- docs/bitacora.md

### Decisiones arquitectónicas

1. No se creó una fórmula de béisbol independiente para cada habilidad.
2. Las habilidades solo aportan modificadores al resolver existente.
3. Control continúa representando precisión del pitcher. No se añadió Dexterity.
4. RunnerSystem conserva la autoridad del resultado del robo.
5. FieldingResolver y DoublePlayResolver conservan la autoridad de defensa y doble play.
6. El RNG del partido puede compartirse con el robo para reproducibilidad.
7. Runner to Batter es un enlace temporal, no una garantía de hit.
8. Los modificadores continúan limitados por BaseballSkillState.MAX_MODIFIER.

### Pruebas preparadas

Se amplió scenes/skill_system_test.gd para cubrir estructuralmente:

- Pitch Down acumulado con Pitch Pressure;
- Catch Boost;
- Steal Up;
- Double Play Setup;
- Runner to Batter;
- consumo temporal de modificadores;
- robo con RNG determinista suministrado por el partido.

No se ejecutó Godot runtime en este entorno. Por tanto, se registra como prueba escrita y revisión estática, no como ejecución real.

### Problemas encontrados y correcciones

- El sistema de habilidades original solo podía expresar buffs/debuffs estadísticos. Se añadió una segunda vía de modificadores de acción para no convertir cada habilidad en una fórmula independiente.
- RunnerSystem usaba un RNG interno, lo que dificultaba reproducir una jugada desde el RNG del partido. Se añadió un RNG opcional y se mantuvo compatibilidad con llamadas antiguas.
- DoublePlayResolver necesitaba acceso al estado temporal sin recibir autoridad de UI. Se añadió el estado como parámetro opcional.
- FieldingResolver y DefensiveRunnerResolver se ampliaron de forma compatible, manteniendo sus fórmulas y parámetros anteriores.

### Estado

**Implementado a nivel de integración de código y catálogo.**

**Pendiente:**
- UI de selección/activación de habilidades;
- costes y cooldowns;
- asignación final de skills a las 30 personajes;
- IA rival que decida cuándo usar habilidades;
- simulaciones de balance extensas;
- runtime Godot;
- validación Android.

### Avance aproximado

**≈92%.**

El incremento representa integración del sistema de habilidades con más resolvers del núcleo. No significa que el juego esté terminado ni que exista validación runtime.


### Addendum de Revisión 52: consumo de buffs estadísticos defensivos

Se ajustó la integración para que los buffs estadísticos no queden solo almacenados:

- FieldingResolver ahora aplica multiplicadores de Defense del SkillState antes de su fórmula de fielding.
- DefensiveRunnerResolver aplica multiplicadores de Speed del SkillState antes de force-out/rundown.
- ThrowResolver aplica multiplicadores de Defense del SkillState tanto a lanzadora como receptora.
- scenes/main.gd suministra SkillState también a ThrowResolver.
- skill_system_test.gd incorpora comprobaciones de Pitch Down y Catch Boost sobre las probabilidades de los resolvers reales.

La fórmula base de cada resolver no fue reemplazada. Los modificadores se aplican en la entrada de la fórmula y el resolver conserva sus límites.

**Runtime Godot:** no ejecutado.


## Revisión 53: IA rival y activación situacional de habilidades

**Fecha:** 2026-09-21
**Motivo:** convertir la infraestructura de habilidades de la Revisión 52 en decisiones de gameplay realizadas por una IA local, sin darle autoridad sobre los resultados deportivos.

### Sistemas afectados

- OpponentAI
- SkillResolver
- BaseballSkillState
- PlayerData
- CharacterArchetypeCatalog
- scenes/main.gd
- catálogo de habilidades
- pruebas de IA
- documentación de skills y diseño

### Implementación

Se creó game/baseball/opponent_ai.gd.

La IA local ahora puede:
1. seleccionar pitch entre FASTBALL, CURVE y SPECIAL;
2. considerar bolas, strikes y Control;
3. activar habilidades ofensivas cuando controla la ofensiva rival;
4. activar habilidades defensivas antes de que FieldingResolver calcule una jugada;
5. activar Steal Up cuando controla un corredor;
6. mantener cooldowns propios;
7. guardar/restaurar su estado de decisión.

La IA utiliza RandomNumberGenerator compartido cuando el partido se lo proporciona. La heurística decide la acción, pero no reemplaza los resolvers.

### Integración en el partido

scenes/main.gd conecta OpponentAI con selección de pitch, habilidades ofensivas del rival, preparación defensiva y robo de corredores rivales.

Las habilidades defensivas se aplican antes de FieldingResolver, permitiendo que Catch Boost o Double Play Setup afecten realmente la fórmula existente.

Las habilidades ofensivas se aplican antes de la resolución del pitch/contacto cuando el rival está bateando.

### Skill roles

PlayerData ahora expone skill_roles.

CharacterArchetypeCatalog.create_player() carga estos roles desde character_archetypes.json.

No se duplicó el catálogo de personajes dentro de la IA. Los roles existentes de la Revisión 51 continúan siendo la fuente de identidad funcional.

### Decisiones arquitectónicas

1. La IA decide acciones, no resultados.
2. SkillResolver continúa siendo el único punto que transforma una skill declarada en un modificador temporal.
3. OpponentAI no escribe estadísticas permanentes.
4. OpponentAI no toca rewards, gacha, energía, rareza ni economía.
5. Los cooldowns pertenecen al estado de decisión de la IA.
6. La selección de pitch permanece heurística y auditable.
7. No se añadió Dexterity ni otra estadística redundante.
8. No se creó un sistema de IA dependiente de LLM, red o backend.
9. Los resolvers existentes conservan la autoridad final.

### Archivos creados

- game/baseball/opponent_ai.gd
- scenes/opponent_ai_test.gd
- scenes/opponent_ai_test.tscn

### Archivos modificados

- game/characters/player_data.gd
- game/characters/character_archetype_catalog.gd
- scenes/main.gd
- docs/characters/skill-system-v1.md
- docs/game-design.md
- docs/bitacora.md

### Pruebas

Se creó opponent_ai_test.gd para comprobar selección de pitch válido, activación ofensiva según skill role, modificación temporal generada por una skill, activación defensiva situacional, cooldowns y snapshot/restore de la IA.

No se ejecutó Godot runtime en este entorno. Se registra como prueba escrita/revisión estática, no como prueba runtime.

### Problemas encontrados y correcciones

- No existía un OpponentAI dedicado aunque scenes/main.gd ya dependía de ese concepto. Se creó la clase faltante sin alterar la arquitectura del partido.
- PlayerData no exponía los skill_roles del catálogo. Se añadió el campo y se conectó al factory.
- La IA no debe inventar habilidades nuevas por personaje. Se reutiliza el catálogo existente y sus roles.
- La activación defensiva debía ocurrir antes de FieldingResolver. Se colocó el hook en _swing() antes de la resolución defensiva.
- El robo rival debía usar la misma entrada de RunnerSystem. Se conecta mediante Steal Up y el modificador existente.
- Los cooldowns se mantienen fuera de PlayerData para no convertir una decisión de IA en una estadística persistente del personaje.

### Estado

Implementado a nivel de código y conectado al flujo principal.

Pendiente:
- IA completa para decisiones ofensivas de bateo;
- IA completa para cobertura defensiva multi-jugadora;
- IA situacional avanzada de pickoff;
- interfaz de activación manual de habilidades para el jugador;
- cooldowns/costes definitivos;
- balance mediante miles de simulaciones;
- ejecución runtime Godot;
- validación Android.

### Avance aproximado

**≈93%.**

Este porcentaje representa avance de implementación del prototipo, no porcentaje de contenido final del videojuego.


## Revisión 54: planificación ligera previa a la jugada

**Fecha:** 2026-09-21  
**Motivo:** adaptar la IA rival al modelo operativo del juego: conocimiento explícito del béisbol + reglas/heurísticas + cálculo por evento, sin IA gráfica pesada ni cálculos continuos por segundo.

### Decisión principal

No se implementa una IA visual, neural ni un sistema que recalcula decisiones cada frame. Se crea un planificador determinista ligero que prepara los datos necesarios mientras la presentación muestra el campo, personajes, entorno y preparación del lanzamiento.

### Implementación

Se creó `game/baseball/decision_planner.gd`.

`BaseballDecisionPlanner` prepara por plate appearance:

- identidad de bateadora y pitcher;
- inning/mitad;
- outs;
- balls/strikes;
- marcador;
- ocupación de bases;
- semillas independientes para pitch, contacto, defensa y robo.

Cada canal posee un RNG determinista derivado de una semilla de la jugada. Esto permite preparar las posibilidades de una jugada sin gastar CPU en simulación continua ni depender de servicios externos.

### Integración

`scenes/main.gd` ahora prepara el contexto al iniciar el lanzamiento y obtiene RNG de los canales preparados para:

- selección de pitch;
- resolución de contacto;
- defensa;
- robo.

La IA sigue utilizando `OpponentAI` para decidir acciones. El planner no decide resultados y tampoco reemplaza `SkillResolver` ni los resolvers de béisbol.

### Modelo de timing

El cálculo no se realiza por segundo ni por frame. El flujo queda:

`preparar contexto → presentar → input del jugador → resolver → evento → animación`.

El jugador conserva autoridad sobre el timing. Un toque en el centro, una zona intermedia o un fallo de la ventana producen distintas calidades de timing y pasan por el mismo resolver de contacto.

### Ventaja técnica

Las ventanas visuales existentes ya proporcionan tiempo útil:

- preparación de pitch;
- desplazamiento de la pelota;
- entrada del timing;
- presentación de resultado.

Por ello no hace falta añadir una IA pesada para que el juego "piense". El programa calcula pequeñas estructuras de datos y semillas por evento, mientras la pantalla presenta la jugada.

### Archivos creados

- `game/baseball/decision_planner.gd`
- `scenes/decision_planner_test.gd`
- `scenes/decision_planner_test.tscn`

### Archivos modificados

- `scenes/main.gd`
- `docs/game-design.md`
- `docs/bitacora.md`

### Pruebas

Se creó una prueba estructural para comprobar que una misma semilla/contexto genera canales deterministas y separados.

No se ejecutó Godot runtime en este entorno. No se registra como prueba runtime.

### Problemas encontrados y correcciones

- La IA anterior podía interpretarse como un sistema que debía evaluar continuamente la partida. Se separó explícitamente la decisión de la IA del cálculo previo de datos.
- Se evitó utilizar la presentación como autoridad de gameplay. Las animaciones solo proporcionan una ventana natural para mostrar datos ya preparados.
- Se evitó reutilizar una única secuencia RNG para todas las fases. Pitch, contacto, defensa y robo reciben semillas independientes.
- El acceso a la semilla del planner se encapsuló mediante `set_seed()` en lugar de exponer directamente su estado interno.

### Estado

**Implementado y conectado al flujo principal a nivel de código.**

Pendiente:
- balance estadístico de los rangos de timing;
- simulaciones masivas de distribución de resultados;
- IA situacional completa de pickoff/cobertura;
- validación runtime Godot;
- validación Android.

### Avance aproximado

**≈94%.**

Este porcentaje representa avance de implementación del prototipo, no porcentaje de contenido final.

## Revisión 55: RNG acotado, táctica cuantificable y economía de equipamiento

**Fecha:** 2026-09-21  
**Motivo:** definir una separación clara entre RNG deportivo y RNG de colección, evitando que el partido se convierta en una lotería mientras se conserva la incertidumbre natural del béisbol.

### Decisión

El RNG del partido permanece, pero queda subordinado a estadísticas, timing, circunstancias, habilidades, elementos y equipamiento. El jugador puede construir ventajas matemáticas y comparar tácticas sin recibir una garantía automática.

Se crea `BaseballTacticalCalculator`, que reutiliza las fórmulas existentes para estimar contacto y comparar timings. No consume RNG ni puede cambiar el estado del partido.

### Colección

Se documenta una separación en dos capas para equipamiento:
1. Drop del mapa: decide si aparece una pieza y su rango permitido según la dificultad.
2. Roll de atributos: decide la combinación de estadísticas dentro del pool permitido por slot/template/rareza.

Esto permite que el equipo tenga un RNG similar al de juegos de colección RPG, mientras personajes, materiales y recursos mantienen tablas explícitas y auditables.

### Implementación

Creado:
- `game/baseball/tactical_calculator.gd`
- `scenes/tactical_calculator_test.gd`
- `scenes/tactical_calculator_test.tscn`
- `docs/progression/rng-and-tactics-v1.md`

### Pruebas

La prueba creada comprueba que Perfect/Great contextualmente produce una probabilidad de contacto mayor que timing medio y que la misma entrada devuelve el mismo cálculo. No se ejecutó Godot runtime en este entorno.

### Pendiente

La aleatoriedad de atributos de equipamiento todavía no se conecta al inventario persistente porque el inventario actual guarda cantidades de `item_id` con modificadores fijos. Para introducir piezas únicas con rolls distintos será necesario añadir una autoridad de instancias sin romper `EquipmentService` ni los saves existentes.

También quedan pendientes las tablas definitivas de drops, pity y garantías.

### Estado

**Implementado:** calculador táctico determinista y filosofía de RNG.  
**En diseño:** equipo con substats/rolls e integración persistente.

### Avance aproximado

**≈94%.**
## Revisión 56: evaluación situacional ligera y decisiones por evento

**Fecha:** 2026-09-21  
**Motivo:** refinar la Revisión 54 para que la IA rival utilice el contexto completo del turno sin convertirse en una IA gráfica pesada ni recalcular decisiones continuamente.

### Decisión arquitectónica

El conocimiento de béisbol se representa mediante reglas y cálculos deterministas en GDScript. No se utiliza red neuronal, inferencia visual ni simulación por segundo.

Cada plate appearance genera un snapshot durante una ventana natural de presentación. Ese snapshot incluye inning, mitad, marcador, balls/strikes, outs, bases, bateadora, pitcher y defensa. `BaseballSituationEvaluator` convierte esos datos en señales tácticas acotadas.

Las señales actuales incluyen diferencia Contact/Control, diferencia Power/Pitch, valor de robo, presión por strikes, oportunidad de doble play, urgencia del marcador y prioridad de habilidad.

`OpponentAI` utiliza esas señales para decidir entre BAT, STEAL y habilidades situacionales, y selecciona el pitch con el mismo RNG preparado por `BaseballDecisionPlanner`. La IA no recibe autoridad sobre probabilidades ni resultados.

### Timing y preparación

El programa no intenta predecir el resultado final antes de que el jugador actúe. Prepara contexto y canales RNG mientras se muestran campo, personajes y preparación del lanzamiento. Cuando el jugador toca el timing, el valor real entra al resolver existente.

Así, centro, zona intermedia o error de timing producen diferentes calidades sin que la presentación ni la IA inventen resultados.

### Implementación

Creado:
- `game/baseball/situation_evaluator.gd`
- `scenes/situation_evaluator_test.gd`
- `scenes/situation_evaluator_test.tscn`

Modificado:
- `game/baseball/decision_planner.gd`
- `game/baseball/opponent_ai.gd`
- `scenes/main.gd`
- `scenes/decision_planner_test.gd`
- `docs/game-design.md`
- `docs/bitacora.md`

### Pruebas

Se añadieron pruebas estructurales para el evaluador y para el snapshot situacional del planner. No se ejecutó Godot runtime en este entorno.

### Correcciones/consideraciones

La decisión de STEAL de la IA ahora pasa por `_attempt_steal()` y reutiliza `RunnerSystem`, `BaseballGameState` y el canal RNG existente, en lugar de crear una ruta especial para la IA.

El cálculo situacional es pequeño y acotado. No se ejecuta una búsqueda de estados, árbol de decisiones ni simulación Monte Carlo durante la presentación.

### Estado

**Implementado a nivel de código y conectado al flujo principal.** Pendiente: balance de heurísticas, cobertura defensiva multi-jugadora más avanzada, pickoff situacional, simulaciones masivas y ejecución runtime Godot.

### Avance aproximado

**≈95%.**

## Revisión 57: coordinador temporal por eventos y preparación sin IA pesada

**Fecha:** 2026-09-21
**Motivo:** formalizar el modelo operativo solicitado para el partido: el programa debe utilizar conocimiento explícito del béisbol y cálculos pequeños por evento, mientras las ventanas de presentación muestran campo, entorno, personajes y preparación. No se utilizará una IA gráfica pesada ni evaluación continua por segundo.

### Sistemas afectados

- flujo principal del partido;
- BaseballDecisionPlanner;
- OpponentAI;
- presentación temporal de plate appearances;
- RNG determinista por canal;
- timing del jugador.

### Implementación

Creado:
- game/baseball/match_event_scheduler.gd
- scenes/match_event_scheduler_test.gd

Modificado:
- scenes/main.gd
- docs/game-design.md
- docs/bitacora.md

BaseballMatchEventScheduler introduce eventos discretos para:
- MATCH_INTRO: presentación inicial del campo;
- PLATE_PREP: presentación y preparación de la jugada;
- ACTION_WINDOW: ventana interactiva disponible para futuras decisiones;
- RESOLUTION: transición lógica sin simulación continua;
- RESULT: presentación del resultado.

El flujo principal utiliza MATCH_INTRO al iniciar el partido y PLATE_PREP antes de cada lanzamiento. La ventana natural de presentación se convierte así en un punto de preparación de contexto, no en un bucle de IA.

### Decisiones arquitectónicas

1. La IA continúa siendo heurística y local.
2. No se añade inferencia visual, red neuronal, LLM, Monte Carlo ni búsqueda profunda.
3. No se realizan cálculos tácticos por frame. El cálculo ocurre al comenzar un evento.
4. BaseballDecisionPlanner prepara semillas separadas para pitch, contacto, defensa y robo.
5. El timing del jugador sigue siendo una entrada real y no se reemplaza por un resultado precalculado.
6. Conocer la semilla no significa conocer el resultado: el timing, las estadísticas y el estado de la jugada siguen entrando en el resolver.
7. Los resolvers conservan la autoridad sobre resultados deportivos.
8. El scheduler coordina tiempo/presentación y no modifica probabilidades ni estadísticas.
9. La ventana visual puede utilizarse para ocultar pequeñas cargas de datos y dar ritmo al partido, pero no se necesita esperar segundos para que la matemática termine.

### Corrección técnica adicional

El resultado de pitch ahora consume el canal RNG preparado por BaseballDecisionPlanner en lugar de usar directamente el RNG global del nodo principal. Esto mantiene el aislamiento determinista entre pitch, contacto, defensa y robo.

### Pruebas

Se creó una prueba estructural de BaseballMatchEventScheduler para:
- avance parcial de MATCH_INTRO;
- finalización de eventos;
- transición PLATE_PREP;
- ventana ACTION_WINDOW personalizada;
- snapshot/restore;
- señales de inicio y finalización.

También se conserva la prueba estructural existente de DecisionPlanner para comprobar semillas deterministas.

**Runtime Godot:** no ejecutado. El entorno actual no dispone de ejecución real de Godot, por lo que estas pruebas se registran como escritas/revisadas estructuralmente y no como ejecución runtime.

### Problemas encontrados y correcciones

- El flujo anterior ya tenía un retardo de PITCH_SELECT, pero estaba representado como un contador específico de escena. Se convirtió en una fase coordinada por eventos sin cambiar la autoridad de gameplay.
- El RNG de pitch estaba utilizando todavía el RNG global aunque el planner ya preparaba un canal específico. Se corrigió para utilizar el canal preparado.
- Se evitó hacer que el scheduler predecida resultados. Su función se limita a coordinar ventanas.

### Estado

**Implementado y conectado a nivel de código.**

Pendiente:
- balance de heurísticas;
- cobertura defensiva multi-jugadora avanzada;
- pickoff situacional;
- activación manual de habilidades del jugador;
- tablas definitivas de gacha/drop/equipamiento con rolls;
- simulaciones masivas de balance;
- ejecución runtime Godot;
- validación Android.

### Avance aproximado

**≈95%.**

El porcentaje representa avance estructural del prototipo y no contenido final ni validación runtime.


## Revisión 58: dirección visual, menú principal y arquitectura de navegación

**Fecha:** 2026-09-21  
**Motivo:** iniciar la capa de presentación del juego sin mezclarla con los resolvers de béisbol. Se adopta como referencia funcional la estructura de hubs anime de juegos de colección como Stella Sora y Blue Archive, sin copiar assets, código ni identidad visual.

**Decisiones:**
- El menú principal será un hub visual de juego, no un dashboard administrativo.
- Los accesos principales usarán iconos/miniaturas y abrirán paneles internos o guiarán hacia la escena correspondiente.
- Historia se representará como un mapa grande con ubicaciones seleccionables y ubicaciones bloqueadas por progreso.
- Normal / Hard / Hell serán modos visibles dentro de la navegación de campaña y no mapas duplicados.
- Se reservará un personaje inicial para comentarios tutoriales/contextuales, con hasta 10 líneas de texto sin requerir voz.
- La voz se mantiene fuera del núcleo hasta disponer de assets/licencias adecuados. No se incorporarán voces de anime tomadas de vídeos o canciones de fans sin verificar derechos de redistribución.
- Las expresiones de esfuerzo del béisbol se diseñarán como eventos de audio reemplazables. Los prototipos pueden funcionar con efectos sintéticos o placeholders propios; el gameplay no dependerá de ellos.

**Sistemas afectados:** presentación, navegación, campaña, personaje inicial, audio placeholder.

**Archivos:** diseño y estructura visual preparados como siguiente bloque de implementación; no se modifica la autoridad del gameplay.

**Pruebas:** revisión estructural del repositorio. No se ejecutó Godot runtime.

**Estado:** diseño adoptado; implementación visual completa pendiente.

**Avance aproximado:** ≈94% estructural del prototipo.


## Revisión 59: implementación del Hub, navegación y mapa de Historia

**Fecha:** 2026-09-21  
**Motivo:** convertir la dirección visual adoptada en la Revisión 58 en una primera capa jugable de presentación: Hub principal, navegación interna, mapa de Historia y personaje inicial con comentarios.

### Sistemas afectados

- presentación/UI;
- navegación;
- campaña visual;
- personaje inicial;
- integración con progreso persistente;
- entrada al partido existente.

### Archivos creados

- `scenes/hub.gd`
- `scenes/hub.tscn`
- `scenes/hub_navigation_test.gd`
- `scenes/hub_navigation_test.tscn`
- `docs/ui-hub-navigation-v1.md`

### Archivos modificados

- `project.godot`: el punto de entrada pasa al Hub; `scenes/main.tscn` conserva el partido existente y se abre desde Historia.

### Decisiones arquitectónicas

1. El Hub es una capa de presentación y navegación. No calcula resultados de béisbol.
2. `PlayerProgressStore` sigue siendo autoridad para energía/monedas y `CharacterRosterStore` para la instancia del personaje inicial.
3. `bw001` se asegura en el roster existente y se muestra como personaje inicial.
4. Se implementan exactamente 10 comentarios de texto, sin voz obligatoria.
5. Historia utiliza un único mapa conceptual con selector Normal/Hard/Hell y ubicaciones bloqueadas, evitando duplicar escenas de mapa.
6. Los paneles internos son contenedores visuales. Las reglas reales de entrenamiento, equipamiento, recompensas y progreso continúan en sus servicios existentes.
7. El retrato procedural es temporal y propio. No se agregan assets externos ni dependencias nuevas.
8. El botón de juego reutiliza el partido existente mediante `res://scenes/main.tscn`.

### Pruebas

Se creó prueba estructural para comprobar 10 comentarios, personaje inicial y ruta de escena de partido. No se ejecutó Godot runtime en este entorno.

### Problemas encontrados y correcciones

- La escena de partido existente no debe perderse al convertir el punto de entrada en Hub. Se conserva `main.tscn` y se añade una escena independiente de Hub.
- No se inventan tasas de gacha ni recompensas de campaña para llenar la interfaz. Las pantallas muestran estado pendiente cuando el sistema todavía no tiene tablas definitivas.

### Estado

**Implementado a nivel de código; runtime Godot pendiente.** El mapa, paneles y retrato son una primera capa visual reemplazable. La adaptación móvil estrecha y arte final siguen pendientes.

### Avance aproximado

**≈95% estructural del prototipo.**


### Complemento visual de Revisión 59

Se añadió `game/ui/campaign_map_view.gd` para que Historia no sea solamente texto: ahora el panel contiene una ruta visual con nodos, bloqueos y Demon King, además del selector Normal/Hard/Hell. El mapa sigue siendo presentación y emite solamente una selección de actividad; no consume energía ni decide recompensas.

**Runtime Godot:** no ejecutado.


## Revisión 60: primera pasada de arte de juego para Hub y mapa de campaña

**Fecha:** 2026-09-21  
**Motivo:** llevar el Hub y el mapa de Historia desde un prototipo predominantemente administrativo/geométrico hacia una presentación más cercana a un videojuego anime deportivo cuidado, manteniendo la arquitectura de presentación separada del gameplay.

### Sistemas afectados

- Hub principal;
- presentación de personaje;
- navegación interna;
- mapa de campaña;
- transiciones y microinteracciones;
- pipeline de assets vectoriales originales;
- pruebas estructurales de presentación.

### Archivos creados

- `assets/ui/hub_background.svg`
- `assets/ui/campaign_map_background.svg`
- `assets/ui/starter_card_frame.svg`
### Archivos modificados

- `scenes/hub.gd`
- `game/ui/campaign_map_view.gd`
- `scenes/hub_navigation_test.gd`
- `docs/game-design.md`
- `docs/ui-style-guide.md`
- `docs/bitacora.md`

### Decisiones arquitectónicas

1. Se conserva el Hub como capa de presentación y navegación, sin autoridad sobre estadísticas, probabilidades, recompensas ni resultados.
2. Se reutiliza el asset existente `assets/characters/generated/bw001.svg` como personaje inicial, ahora dentro de una tarjeta visual con marco vectorial propio.
3. El fondo del Hub y el fondo del mapa son assets SVG originales del repositorio, ligeros, reemplazables y adecuados para prototipo multiplataforma.
4. El mapa de Historia deja de depender principalmente de texto y utiliza fondo ilustrado, ruta, nodos de actividad, bloqueos y Demon King.
5. Se añaden microanimaciones de hover y transición de panel. Son exclusivamente visuales.
6. Normal / Hard / Hell continúan compartiendo el mapa.
7. No se agregan imágenes externas, voces, código de terceros ni dependencias nuevas.
8. La mejora artística se plantea progresivamente: primero composición, jerarquía, estados, transiciones y assets propios; posteriormente podrán sustituirse piezas por ilustraciones finales sin cambiar contratos de gameplay.

### Pruebas

Se amplió `scenes/hub_navigation_test.gd` para comprobar la existencia de los assets de presentación y conservar las verificaciones de 10 comentarios, personaje inicial y ruta al partido.

**Runtime Godot:** no ejecutado en este entorno. Las pruebas se consideran escritas/revisadas estructuralmente, no pruebas runtime.

### Problemas encontrados y correcciones

- El Hub original dependía de un retrato dibujado directamente por la escena. Se sustituyó por el asset vectorial existente del personaje y un marco independiente, reduciendo el acoplamiento entre arte y lógica.
- El mapa original era principalmente una colección de botones sobre un fondo plano. Se incorporó un fondo vectorial original y una ruta visual sin mover la autoridad de selección fuera del mapa.
- Se evitó introducir assets de terceros para acelerar la apariencia.

### Estado

**Implementado a nivel de código y assets de prototipo.** Pendiente: ilustraciones finales de personajes, tarjetas avanzadas por rareza, animación de personajes más rica, VFX, audio y adaptación visual fina para móviles estrechos.

### Avance aproximado

**≈96% estructural del prototipo.**

El porcentaje representa avance estructural del prototipo, no contenido artístico final ni validación runtime.


## Revisión 61: componente profesional de tarjeta de personaje y diferenciación por rareza

**Fecha:** 2026-09-21  
**Motivo:** iniciar de forma controlada la segunda fase artística solicitada: las tarjetas dejan de ser composiciones ad-hoc y pasan a un componente reutilizable con identidad visual por rareza. Se valida primero con bw001 antes de escalar al roster.

### Sistemas afectados
- presentación de colección;
- Hub;
- identidad visual de rarezas;
- microanimación de entrada;
- pruebas estructurales de UI.

### Archivos creados
- game/ui/character_card.gd
- game/ui/character_card.tscn
- scenes/character_card_presentation_test.gd
- scenes/character_card_presentation_test.tscn

### Archivos modificados
- scenes/hub.gd
- scenes/hub_navigation_test.gd
- docs/ui-style-guide.md
- docs/bitacora.md

### Decisiones arquitectónicas
1. La tarjeta recibe PlayerData y no muta progresión ni gameplay.
2. R, SR, SSR y UR tienen estilos explícitos y visualmente diferenciables.
3. El retrato se obtiene por ID y puede reemplazarse por arte final sin cambiar el componente.
4. La tarjeta muestra identidad deportiva además de rareza, posición y estadísticas resumidas.
5. Incluye un espacio opcional para comentario contextual.
6. La entrada usa únicamente escala/opacidad y no altera estado de juego.
7. Se valida primero con bw001 y no se genera todavía una implementación masiva de 30 tarjetas.
8. No se incorporan assets externos ni emojis al componente.

### Pruebas
Se añadieron comprobaciones estructurales para existencia del componente, escena, cuatro estilos de rareza, diferenciación visual y retrato de bw001.

**Runtime Godot:** no ejecutado. Las pruebas son estructurales/escritas.

### Problemas encontrados y correcciones
- La primera integración podía construir dos veces el árbol visual al combinar _ready() con setup(). Se añadió una guardia para construirlo una sola vez.
- Se detectó y corrigió la declaración ausente del slot de comentario.
- La tarjeta anterior estaba construida directamente en hub.gd. Se extrajo a un componente reutilizable.
- El comentario quedó inicialmente fuera de la tarjeta durante la integración y se corrigió con un slot interno.
- Se mantuvo fuera de esta revisión la iconografía global, el arte de las 30 personajes y las animaciones avanzadas para conservar control incremental.

### Estado
**Implementado a nivel de código y conectado al Hub.** Pendiente de validación runtime Godot y revisión visual en pantalla real.

### Avance aproximado
**≈96% estructural del prototipo.**


## Revisión 62: primera capa profesional de expresiones para bw001

**Fecha:** 2026-09-21  
**Motivo:** continuar la estrategia incremental de presentación sin multiplicar todavía el trabajo por 30. Se implementa primero el contrato de expresiones y una única personaje, bw001, para validar el flujo completo antes de escalar.

### Sistemas afectados
- presentación de tarjetas;
- retratos 2D de colección;
- Hub y comentarios del personaje inicial;
- pipeline de assets visuales;
- pruebas estructurales de UI.

### Archivos creados
- game/ui/character_expression_controller.gd
- docs/ui-character-expression-v1.md
- scenes/character_expression_test.gd
- scenes/character_expression_test.tscn
- assets/characters/expressions/bw001_neutral.svg
- assets/characters/expressions/bw001_happy.svg
- assets/characters/expressions/bw001_focused.svg
- assets/characters/expressions/bw001_surprised.svg
- assets/characters/expressions/bw001_disappointed.svg

### Archivos modificados
- game/ui/character_card.gd
- scenes/hub.gd
- docs/bitacora.md

### Decisiones arquitectónicas
1. Las expresiones son estado de presentación, no estado de gameplay.
2. CharacterExpressionController centraliza el vocabulario y el fallback de assets.
3. BaseballCharacterCard recibe la expresión como parámetro opcional para conservar compatibilidad con llamadas existentes.
4. La personaje inicial bw001 es el único personaje con assets expresivos en esta revisión.
5. Los diez comentarios existentes del Hub no se modifican; solamente reciben una asociación visual determinista.
6. Los SVG expresivos son assets propios de prototipo y pueden sustituirse por arte final sin modificar PlayerData ni los resolvers.
7. No se modifica la iconografía global ni se inicia todavía la producción artística de las otras 29 personajes.

### Pruebas
- Se creó una prueba estructural que valida los cinco estados y los cinco assets de bw001.
- Se valida que el componente de tarjeta exponga set_expression().
- Se valida que el mapeo comentario → expresión sea determinista.
- **Runtime Godot:** no ejecutado. No se declara validación visual/runtime.

### Problemas encontrados y correcciones
- El componente de tarjeta necesitaba un punto único para resolver expresiones y fallback. Se añadió CharacterExpressionController en lugar de repartir rutas entre Hub y tarjeta.
- Se evitó persistir la expresión en PlayerData, porque sería un estado puramente visual y podría contaminar la autoridad de datos del personaje.
- La implementación queda limitada a bw001 para detectar problemas antes de multiplicar assets y mantenimiento por todo el roster.

### Estado
**Implementado a nivel de código y assets de prototipo.** Conectado al Hub y a la tarjeta reutilizable. Pendiente de validación runtime Godot y revisión visual en pantalla real.

### Avance aproximado
**≈96% estructural del prototipo.** El porcentaje continúa representando estructura del software, no volumen de arte final.

# Revisión 50: Character Card de colección v1

**Fecha:** 2026-09-21  
**Tipo:** UI de colección / presentación / iconografía / animación.

## Motivo

El repositorio ya disponía de game/ui/character_card.gd, pero la tarjeta todavía tenía una presentación básica. Esta revisión mejora una sola pieza antes de multiplicarla por todo el roster.

## Sistemas afectados
- UI de colección.
- Dirección visual de rarezas.
- Iconografía elemental.
- Expresiones.
- Pipeline de retratos.
- QA estructural.

## Cambios realizados

game/ui/character_card.gd ahora incluye jerarquía visual R/SR/SSR/UR, marco de retrato, icono elemental vectorial procedural, nombre, posición, elemento, especialización, nivel, potencial, identidad de juego, ocho barras de estadísticas, comentario opcional, entrada animada y transición de expresión.

No se modifican PlayerData ni las reglas de gameplay.

game/ui/character_card.tscn se conserva como escena mínima reutilizable.

docs/ui/character-card-v1.md documenta el contrato visual.

QA: se añadieron scenes/character_card_test.gd y scenes/character_card_test.tscn.

## Decisiones arquitectónicas
1. La tarjeta lee datos existentes y no modifica gameplay.
2. Las estadísticas se representan, no se calculan.
3. La rareza modifica presentación, nunca resultado deportivo.
4. La iconografía elemental no depende de emojis.
5. Los retratos siguen pasando por CharacterExpressionController.
6. La tarjeta será reutilizada posteriormente en roster, gacha, recompensas y personaje.
7. No se generan todavía 30 retratos finales.

## Pruebas
Se realizó inspección estructural del código y dependencias después de la implementación.
Runtime Godot: no ejecutado porque este entorno no dispone del binario de Godot.

Durante la implementación se detectaron y corrigieron errores sintácticos del primer reemplazo, además de aislar la paleta de iconos de la clase interna.

## Estado
Implementado: primera versión rigurosa de la tarjeta de colección.
Pendiente: runtime Godot, retratos anime finales, expresiones finales y reutilización en roster/gacha/recompensas.

## Porcentaje global
≈90% estructural del prototipo. El porcentaje no significa juego terminado: arte final, balance, runtime, export Android, gacha completo, IA rival completa y contenido masivo siguen pendientes.

## Regla de continuidad
No multiplicar todavía esta implementación por las 30 personajes. Primero validar esta pieza en runtime y después construir el sistema de expresiones/retratos sobre el mismo contrato.

## Revisión 63: iconografía vectorial propia para navegación del Hub

**Fecha:** 2026-09-21  
**Motivo:** sustituir la dependencia de emojis y glifos de plataforma en la navegación principal por una capa de iconografía vectorial propia, manteniendo el Hub como presentación y sin tocar gameplay.

### Sistemas afectados
- navegación principal del Hub;
- UI compartida;
- iconografía;
- accesibilidad/legibilidad;
- pruebas estructurales.

### Archivos creados
- `game/ui/hub_menu_icon.gd`
- `game/ui/hub_menu_button.gd`
- `scenes/hub_iconography_test.gd`
- `scenes/hub_iconography_test.tscn`
- `docs/ui-hub-iconography-v1.md`

### Archivos modificados
- `scenes/hub.gd`
- `scenes/hub_navigation_test.gd`
- `docs/ui-style-guide.md`
- `docs/bitacora.md`

### Limpieza realizada
Durante la revisión se detectó un intento paralelo de crear un controlador de retrato que duplicaba la responsabilidad de `CharacterExpressionController`, ya existente y conectado a `BaseballCharacterCard`. Se eliminó ese componente y sus assets no referenciados para conservar una única autoridad de presentación de expresiones.

### Decisiones arquitectónicas
1. El Hub utiliza nueve identificadores de icono estables: history, team, training, equipment, gacha, inventory, story, events y options.
2. `BaseballHubMenuIcon` dibuja los símbolos mediante geometría 2D, sin emojis ni fuentes externas.
3. `BaseballHubMenuButton` encapsula icono, título, subtítulo, hover, focus y pressed, y emite solamente una señal de presentación/navegación.
4. El texto permanece visible en cada botón para no depender exclusivamente del icono.
5. La iconografía no tiene autoridad sobre campañas, recompensas, estadísticas, probabilidades o estados del partido.
6. Energy y Coins del encabezado pasan a texto explícito, eliminando glifos dependientes de fuente.
7. Se mantiene la estrategia incremental: esta revisión modifica solamente el Hub. No se aplica todavía el componente al resto de pantallas.
8. No se incorporan assets externos.

### Pruebas
- Se añadió prueba estructural específica para los nueve identificadores y componentes de iconografía.
- Se amplió la prueba de navegación del Hub para verificar los componentes y el asset expresivo de la personaje inicial.
- Se corrigió la prueba nueva para evitar dependencias innecesarias de métodos funcionales de Array.
- **Runtime Godot:** no ejecutado en este entorno. Las pruebas se consideran escritas/revisadas estructuralmente.

### Estado
**Implementado a nivel de código y conectado al Hub.** Pendiente de validación runtime Godot, revisión visual en pantalla real y adopción gradual en roster, historia, gacha e inventario.

### Avance aproximado
**≈96% estructural del prototipo.** El porcentaje no representa porcentaje de arte final ni de contenido terminado.

## Revisión 64: endurecimiento profesional de presentación de expresiones para bw001

**Fecha:** 2026-09-21  
**Motivo:** cerrar correctamente la primera unidad visual antes de escalarla a otra personaje. La revisión anterior ya tenía cinco expresiones y una tarjeta reutilizable, pero el cambio de expresión todavía reaparecía visualmente toda la tarjeta. Se corrige la interacción y se mejora el paquete vectorial de bw001 sin modificar gameplay.

### Sistemas afectados

- tarjeta de colección;
- retrato expresivo;
- microanimación de presentación;
- QA estructural de assets;
- documentación visual.

### Archivos modificados

- game/ui/character_card.gd
- scenes/character_expression_test.gd
- docs/ui-character-expression-v1.md
- docs/ui/character-card-v1.md
- assets/characters/generated/bw001.svg
- assets/characters/expressions/bw001_neutral.svg
- assets/characters/expressions/bw001_happy.svg
- assets/characters/expressions/bw001_focused.svg
- assets/characters/expressions/bw001_surprised.svg
- assets/characters/expressions/bw001_disappointed.svg

### Decisiones arquitectónicas

1. CharacterExpressionController conserva la autoridad única sobre IDs y rutas de expresión.
2. BaseballCharacterCard.set_expression() ya no ejecuta la animación de entrada completa de la tarjeta.
3. El cambio facial utiliza un tween localizado sobre el retrato: atenuación breve, cambio de textura en el punto medio y recuperación con una compresión mínima de escala.
4. El resto de la tarjeta permanece estable mientras cambia el estado facial.
5. La expresión continúa fuera de PlayerData y CharacterRosterStore: es exclusivamente presentación.
6. Los seis SVG de bw001 comparten una misma dirección visual, pero cada estado contiene rasgos faciales diferentes.
7. El paquete mantiene formato SVG para evitar dependencias de fuentes externas y conservar un coste de memoria pequeño.
8. No se generaron todavía assets para las otras 29 personajes.

### Pruebas

La prueba estructural de expresiones ahora comprueba:
- vocabulario cerrado de cinco estados;
- existencia de cada asset;
- tamaño mínimo razonable del archivo;
- ausencia de etiquetas <text> dependientes de fuentes;
- contenido distinto entre los cinco estados;
- mapeo determinista de comentarios;
- API set_expression() y current_expression() de la tarjeta.

**Runtime Godot:** no ejecutado. No se registra como validación visual o runtime.

### Problema encontrado

El comportamiento anterior reaplicaba la animación de entrada completa cuando cambiaba el comentario y la expresión. Eso hacía que la tarjeta pareciera reconstruirse en lugar de reaccionar.

### Corrección

Se aisló la transición al TextureRect del retrato y se añadió control de tween activo para evitar carreras visuales si llegan cambios de expresión consecutivos.

### Estado

**Implementado a nivel de código y assets.** La unidad bw001 queda preparada para escalar el mismo contrato a otras personajes después de validación runtime.

### Avance aproximado

**≈96% estructural del prototipo.**

El porcentaje sigue representando infraestructura implementada y no contenido artístico final, pruebas runtime, balance definitivo ni publicación Android.

## Revisión 65: cierre de la unidad bw001 y endurecimiento de la tarjeta existente

**Fecha:** 2026-09-21
**Motivo:** continuar la estrategia de producción de una personaje a la vez. La auditoría de continuidad confirmó que las revisiones 63-64 ya habían creado el Hub, la tarjeta reutilizable, iconografía propia y cinco expresiones de bw001. En lugar de crear otro pipeline, se conserva esa arquitectura y se corrigen solamente problemas concretos de presentación detectados por inspección estructural.

### Unidad cerrada

Solo se trabaja sobre bw001 como personaje inicial.

No se modifican:
- estadísticas canónicas del roster;
- posiciones o elementos de otras personajes;
- expresiones de las otras 29;
- resolvers de béisbol;
- economía;
- IA;
- gacha;
- recompensas.

### Correcciones

1. game/ui/character_card.gd
   - Se corrige la asignación de identity_label cuando el catálogo sí contiene character_identity.play_identity.
   - Se compacta el área del retrato y la altura de filas para que la tarjeta pueda convivir con el layout actual del Hub de 1280x720 sin depender de un panel excesivamente alto.
   - Se conserva el contrato existente de ocho estadísticas, rareza, elemento, expresiones y comentarios.
   - No se altera ninguna autoridad de gameplay.

2. scenes/hub.gd
   - Se elimina el glifo Unicode de monedas y se utiliza texto explícito COINS, evitando dependencia de fuente/plataforma.
   - La navegación, los nueve identificadores de iconografía y los diez comentarios existentes permanecen intactos.

3. scenes/character_card_test.gd
   - Se añade una aserción que verifica que bw001 presenta correctamente su identidad de juego BIG SWING THREAT.

### Auditoría de continuidad

Se detectó que una implementación paralela de tarjeta/Hub para bw001 duplicaba sistemas ya existentes. Esos archivos temporales fueron eliminados para conservar una única autoridad de presentación y evitar dos pipelines visuales para la misma función.

La arquitectura vigente sigue siendo:

CharacterArchetypeCatalog -> PlayerData / CharacterRosterStore

y, para presentación:

CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard -> Hub

### Pruebas

- Inspección estructural de hub.gd, character_card.gd, CharacterExpressionController, iconografía y mapa de campaña.
- Se añadió una aserción nueva para identidad de bw001.
- No se ejecutó Godot runtime en este entorno. La validación de recorte, escala, transición y rendimiento en pantalla sigue pendiente de abrir res://scenes/hub.tscn en Godot real.

### Estado

**bw001 queda cerrado a nivel de implementación estructural.** La siguiente acción correcta es validación runtime real del Hub antes de tocar bw002.

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no significa 96% de arte final, balance definitivo, contenido, QA runtime o publicación Android.


### Corrección posterior de Revisión 65

Durante una revisión estructural final se detectó una aserción de character_card_test.gd con indentación incorrecta. Se corrigió antes de considerar el paquete de QA listo.

**Runtime Godot:** sigue sin ejecutarse en este entorno.


## Revisión 66: segunda unidad visual cerrada, bw002 Reina Kurose

**Fecha:** 2026-09-21  
**Motivo:** continuar el pipeline de producción visual una personaje por vez. bw001 ya está cerrado estructuralmente; la siguiente unidad se construye sobre el mismo contrato sin duplicar controladores, tarjetas ni lógica de presentación.

### Alcance

Se trabajó exclusivamente sobre bw002:
- Reina Kurose;
- SSR;
- elemento Ice;
- posición P;
- especialidad Pitcher.

No se modificaron estadísticas, resolvers de béisbol, IA, economía, gacha, recompensas ni datos de otras personajes.

### Archivos creados

- assets/characters/expressions/bw002_neutral.svg
- assets/characters/expressions/bw002_happy.svg
- assets/characters/expressions/bw002_focused.svg
- assets/characters/expressions/bw002_surprised.svg
- assets/characters/expressions/bw002_disappointed.svg
- scenes/bw002_character_presentation_test.gd
- scenes/bw002_character_presentation_test.tscn
- docs/characters/bw002-presentation-v1.md

### Archivos modificados

- docs/ui-character-expression-v1.md

### Decisiones arquitectónicas

1. Se reutiliza CharacterExpressionController existente. No se crea un controlador paralelo para bw002.
2. BaseballCharacterCard continúa siendo el componente único de presentación de colección.
3. Los cinco estados faciales utilizan el mismo vocabulario cerrado: neutral, happy, focused, surprised y disappointed.
4. La identidad de bw002 se expresa mediante paleta fría, cabello azul petróleo, uniformidad visual de pitcher refinada y cambios faciales diferenciados.
5. La expresión sigue fuera de PlayerData y CharacterRosterStore.
6. Los SVG no incorporan etiquetas <text> ni dependencias de fuentes de plataforma.
7. Los cinco assets quedan separados para poder reemplazarse posteriormente por arte final raster/painted sin modificar gameplay ni el contrato de la tarjeta.
8. No se crea producción artística masiva del roster.

### QA estructural

scenes/bw002_character_presentation_test.gd verifica:
- presencia de bw002 en el catálogo;
- nombre, rareza, elemento, posición y especialidad;
- construcción de PlayerData;
- existencia de los cinco assets;
- tamaño mínimo de cada asset;
- ausencia de <text>;
- continuidad de paleta;
- diferencia entre estados;
- resolución determinista de rutas;
- compatibilidad con la API de BaseballCharacterCard.

Se verificó además mediante inspección de los cinco archivos que cada SVG supera 5 KB y conserva la paleta de identidad de bw002.

**Runtime Godot:** no ejecutado. El entorno actual no dispone del binario de Godot, por lo que no se registra validación visual o runtime.

### Estado

**bw002 queda cerrado a nivel de implementación estructural y paquete de assets.**

La siguiente unidad correcta es bw003, pero solamente después de tratar la validación runtime del Hub como un requisito de control cuando exista un entorno Godot ejecutable.

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, contenido, balance definitivo, QA runtime ni publicación Android.

## Revisión 67: tercera unidad visual cerrada, bw003 Miu Tachibana

**Fecha:** 2026-09-21  
**Motivo:** continuar la estrategia de producción visual de una personaje por vez después del cierre estructural de bw001 y bw002. Se reutiliza el mismo contrato de expresiones, tarjeta y catálogo, sin duplicar sistemas.

### Alcance
Se trabajó exclusivamente sobre bw003 / Miu Tachibana:
- rareza SR;
- elemento Lightning;
- posición SS;
- especialidad Contact.

No se modificaron estadísticas canónicas, gameplay, resolvers de béisbol, IA rival, economía, gacha, recompensas ni expresiones de las otras personajes.

### Archivos creados
- assets/characters/expressions/bw003_neutral.svg
- assets/characters/expressions/bw003_happy.svg
- assets/characters/expressions/bw003_focused.svg
- assets/characters/expressions/bw003_surprised.svg
- assets/characters/expressions/bw003_disappointed.svg
- scenes/bw003_character_presentation_test.gd
- scenes/bw003_character_presentation_test.tscn
- docs/characters/bw003-presentation-v1.md

### Decisiones arquitectónicas
1. Se reutiliza CharacterExpressionController como autoridad única de vocabulario y resolución.
2. BaseballCharacterCard continúa siendo el único componente de presentación de colección.
3. Los cinco estados siguen siendo neutral, happy, focused, surprised y disappointed.
4. La identidad visual de bw003 se diferencia mediante paleta cálida, amarillo eléctrico, silueta equilibrada y lectura facial energética/técnica.
5. Las expresiones permanecen fuera de PlayerData y CharacterRosterStore.
6. Los SVG no contienen texto ni dependen de fuentes del dispositivo.
7. Cada expresión es un asset independiente para permitir reemplazo futuro por arte final sin tocar gameplay.
8. No se produce todavía arte para bw004 ni se escala este cambio al resto del roster.

### QA estructural
Se comprobó mediante inspección del repositorio que:
- los cinco SVG existen;
- cada asset supera el tamaño mínimo usado por el pipeline;
- no contiene etiquetas `<text>`;
- las rutas siguen el contrato de CharacterExpressionController;
- existe test estructural específico y documentación.

**Runtime Godot:** no ejecutado. No se registra validación visual, FPS, memoria ni hardware Android.

### Estado
**bw003 queda cerrada a nivel de implementación estructural y paquete de assets.** La siguiente unidad correcta es bw004 después de una validación runtime real cuando exista un entorno Godot ejecutable.

### Avance aproximado
**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, contenido, QA runtime ni publicación Android.


## Revisión 68: cuarta unidad visual cerrada, bw004 Yuna Minase + captura visual headless

**Fecha:** 2026-09-21
**Motivo:** continuar la producción estricta de una personaje por vez. bw001, bw002 y bw003 ya poseen el contrato visual de expresiones; esta revisión incorpora exclusivamente bw004 y añade un pipeline reproducible de captura visual en CI.

### Alcance
- bw004 / Yuna Minase.
- Rareza SSR.
- Elemento Nature.
- Posición CF.
- Especialidad Runner.

No se modifican estadísticas, gameplay, resolvers de béisbol, IA rival, economía, gacha, recompensas ni expresiones de bw001-bw003.

### Archivos creados
- assets/characters/expressions/bw004_neutral.svg
- assets/characters/expressions/bw004_happy.svg
- assets/characters/expressions/bw004_focused.svg
- assets/characters/expressions/bw004_surprised.svg
- assets/characters/expressions/bw004_disappointed.svg
- scenes/bw004_character_presentation_test.gd
- scenes/bw004_character_presentation_test.tscn
- game/ui/visual_qa_exporter.gd
- .github/workflows/visual_qa.yml
- docs/characters/bw004-presentation-v1.md

### Decisiones arquitectónicas
1. Se reutiliza CharacterExpressionController como única autoridad de IDs y rutas.
2. BaseballCharacterCard sigue siendo la única tarjeta de colección.
3. Los cinco estados siguen siendo neutral, happy, focused, surprised y disappointed.
4. Los SVG son assets propios, sin etiquetas <text> ni fuentes externas.
5. La expresión permanece fuera de PlayerData y CharacterRosterStore.
6. La escena QA muestra bw004 mediante la tarjeta existente y una tira paralela de sus cinco expresiones.
7. VisualQAExporter se activa solamente con --run-qa-capture y guarda una captura determinista en res://qa_captures/bw004_character_presentation.png.
8. GitHub Actions publica la captura como artefacto. El workflow fija Godot 4.5.1-stable para reproducibilidad de CI.
9. Este pipeline es una herramienta de validación. No tiene autoridad sobre gameplay, resultados deportivos ni datos persistentes.

### QA
- La escena valida catálogo, identidad canónica de bw004, existencia de assets, tamaño mínimo, ausencia de texto SVG, continuidad de paleta, diferenciación de estados y API de la tarjeta.
- El workflow ejecuta Godot en modo headless, solicita la captura con --run-qa-capture, verifica que el PNG exista y lo publica mediante actions/upload-artifact@v4.
- **Runtime local:** no ejecutado en este entorno. No se registra como validación local.

### Problemas encontrados y correcciones
- El repositorio no tenía un exportador visual común ni un workflow dedicado. Se añadió sin modificar el pipeline de gameplay.
- Se evitó crear un controlador visual específico para bw004.
- La escena de QA utiliza thumbnails adicionales solamente dentro de la escena de prueba para no aumentar el coste del runtime real.

### Estado
**bw004 queda cerrada a nivel de implementación estructural, assets y pipeline de QA.** La siguiente unidad correcta es bw005, manteniendo la regla de una personaje por vez.

### Avance aproximado
**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación runtime local, publicación Android ni contenido completo.

## Revisión 69: quinta unidad visual cerrada, bw005 Sora Amamiya

**Fecha:** 2026-09-21
**Motivo:** continuar el pipeline de producción artística controlada, una personaje por vez, después del cierre de bw004 y su pipeline de captura headless.

### Alcance

Se trabajó exclusivamente sobre bw005 / Sora Amamiya:
- rareza SR;
- elemento Water;
- posición C;
- especialidad Catcher;
- preset corporal power.

No se modifican estadísticas canónicas, gameplay, resolvers de béisbol, IA rival, economía, gacha, recompensas ni expresiones de bw001-bw004.

### Archivos creados

- assets/characters/expressions/bw005_neutral.svg
- assets/characters/expressions/bw005_happy.svg
- assets/characters/expressions/bw005_focused.svg
- assets/characters/expressions/bw005_surprised.svg
- assets/characters/expressions/bw005_disappointed.svg
- scenes/bw005_character_presentation_test.gd
- scenes/bw005_character_presentation_test.tscn
- docs/characters/bw005-presentation-v1.md

### Archivos modificados

- .github/workflows/visual_qa.yml
- docs/bitacora.md

### Decisiones arquitectónicas

1. CharacterArchetypeCatalog continúa siendo la fuente de verdad de identidad canónica.
2. CharacterExpressionController mantiene la autoridad única sobre los cinco IDs expresivos y sus rutas.
3. BaseballCharacterCard continúa siendo el único componente de presentación de colección.
4. Los cinco SVG de bw005 son independientes, autónomos, sin etiquetas <text> ni dependencias de fuentes.
5. La dirección visual de Sora enfatiza Catcher/Water mediante una silueta fuerte, paleta azul petróleo y azul agua y señales visuales de protección de catcher.
6. La expresión no se guarda en PlayerData ni en CharacterRosterStore.
7. La escena de QA utiliza la tarjeta de producción y una tira paralela de los cinco estados, pero esta tira no existe en el runtime real.
8. VisualQAExporter genera la captura mediante --run-qa-capture.
9. El workflow conserva Godot 4.5.1-stable y ahora valida también bw005 en push/manual CI.
10. El PNG de bw005 es un artefacto de CI, no una fuente de verdad ni un asset de gameplay.

### QA

La escena verifica:
- identidad canónica;
- construcción de PlayerData;
- existencia de los cinco SVG;
- tamaño mínimo;
- ausencia de <text>;
- paleta canónica;
- diferencia entre los cinco estados;
- resolución determinista de rutas;
- API de BaseballCharacterCard.

La CI ejecuta:
`res://scenes/bw005_character_presentation_test.tscn -- --run-qa-capture`
y verifica que exista un PNG no vacío en `qa_captures/bw005_character_presentation.png`.

### Estado

**bw005 queda cerrado a nivel de implementación estructural, assets y pipeline CI.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.

### Corrección de Revisión 69: diferenciación efectiva de expresiones de bw005

**Fecha:** 2026-09-21

Durante la segunda pasada de QA se detectó que los cinco SVG de bw005 habían heredado inicialmente el mismo bloque facial por una sustitución textual demasiado estricta. La corrección reemplazó el bloque facial por estado mediante límites estructurales del SVG y añadió señales visuales de catcher sin alterar el contrato de presentación.

**Validación estructural posterior:** los cinco archivos mantienen la misma identidad cromática y longitud de asset, pero ahora contienen contenido SVG distinto por estado.

**Runtime Godot:** no se ejecutó localmente. La validación visual headless queda delegada al workflow CI configurado para bw005.



## Revisión 70: watchdog de cierre para VisualQAExporter

**Fecha:** 2026-09-21  
**Motivo:** corregir el bloqueo de GitHub Actions causado por procesos Godot headless que no terminaban después de generar la captura visual.

### Alcance

Se modifica exclusivamente el ciclo de vida del exportador visual y su CI. No se toca gameplay, presentación de personajes, estadísticas, resolvers, IA, economía ni persistencia.

### Cambios

- `game/ui/visual_qa_exporter.gd`
  - conserva la salida explícita `get_tree().quit(0)` después de guardar correctamente el PNG;
  - añade watchdog de **5 segundos** mediante `get_tree().create_timer(SAFETY_TIMEOUT_SECONDS)`;
  - el watchdog registra `[QA_VISUAL] Timeout alcanzado. Forzando cierre.` y termina con `get_tree().quit(1)`;
  - se añaden rutas de fallo explícitas para viewport, textura, imagen, directorio y `save_png()`;
  - se utiliza un estado `_finished` para impedir doble cierre o procesamiento posterior.
- `scenes/visual_qa_exporter_test.gd`
  - valida estructuralmente el contrato de terminación 0/1, el timeout de 5 s y la conexión del timer.
- `scenes/visual_qa_exporter_test.tscn`
  - escena dedicada para ejecutar el contrato de QA con Godot headless.
- `.github/workflows/visual_qa.yml`
  - añade el test de contrato del exportador;
  - limita los procesos Godot headless de CI a 15 s como segunda barrera si el motor no llega a ejecutar el watchdog;
  - conserva Godot 4.5.1-stable y las capturas de bw004/bw005.

### Decisiones arquitectónicas

1. El éxito de captura siempre termina con código 0 inmediatamente después de `save_png()`.
2. Cualquier fallo del exportador termina con código 1 de forma explícita.
3. El watchdog de 5 s empieza únicamente cuando se solicita `--run-qa-capture`.
4. La protección de 15 s en shell es una barrera CI adicional para fallos anteriores al arranque efectivo del nodo exportador.
5. VisualQAExporter continúa siendo una herramienta de validación y no adquiere autoridad sobre gameplay.

### Pruebas

- Inspección estructural de `VisualQAExporter` y del workflow existente.
- Se añadió un test de contrato para verificar timeout, código de salida exitoso y código de salida de error.
- Se añadió límite de proceso de 15 s en ambos jobs de captura.
- **Runtime Godot:** no se ejecutó localmente en este entorno. La verificación runtime final queda delegada a GitHub Actions.

### Estado

**Corrección implementada a nivel de código y CI.** El exportador ya posee una ruta normal de cierre y un watchdog explícito para evitar jobs atascados indefinidamente.

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android ni contenido completo.


## Revisión 71: cierre administrativo de bw005 y traspaso al pipeline bw006

**Fecha:** 2026-09-21
**Motivo:** cerrar formalmente la unidad bw005 después de la corrección del ciclo de vida de VisualQAExporter y establecer que cualquier nueva unidad de personaje se trabaja en un único commit consolidado.

### Estado de bw005

- bw005 / Sora Amamiya queda cerrada.
- Los cinco SVG, la escena de presentación, la documentación y la integración CI ya estaban presentes en la unidad anterior.
- La corrección de VisualQAExporter quedó incorporada en los commits 3bacfaa y 4e9ff044.
- No quedan cambios funcionales pendientes de bw005 que justifiquen otra modificación de sus assets o escena.

### Regla de commits adoptada

A partir de esta unidad, cada personaje se entrega mediante **un único commit consolidado** que contiene sus SVG, escena de presentación, test, documentación y cambios de CI estrictamente necesarios para esa unidad.

No se reescribe el historial anterior para evitar alterar commits ya publicados.

### Estado

**bw005 cerrado. Próxima unidad: bw006.**


## Revisión 72: sexta unidad visual consolidada, bw006 Akari Shimizu

**Fecha:** 2026-09-21
**Motivo:** continuar el pipeline artístico una personaje por vez, después del cierre formal de bw005, utilizando un único commit consolidado para la unidad.

### Alcance

Se trabajó exclusivamente sobre bw006 / Akari Shimizu:
- rareza SR;
- elemento Lightning;
- posición 1B;
- especialidad Defender;
- identidad visual muscular/tomboy y primera base;
- cinco estados expresivos independientes.

No se modifican estadísticas canónicas, resolvers de béisbol, IA rival, economía, gacha, recompensas ni personajes anteriores.

### Archivos creados

- assets/characters/expressions/bw006_neutral.svg
- assets/characters/expressions/bw006_happy.svg
- assets/characters/expressions/bw006_focused.svg
- assets/characters/expressions/bw006_surprised.svg
- assets/characters/expressions/bw006_disappointed.svg
- scenes/bw006_character_presentation_test.gd
- scenes/bw006_character_presentation_test.tscn
- docs/characters/bw006-presentation-v1.md

### Archivo modificado

- .github/workflows/visual_qa.yml
- docs/bitacora.md

### Decisiones arquitectónicas

1. `CharacterArchetypeCatalog` continúa como fuente canónica de identidad.
2. `CharacterExpressionController` mantiene la resolución única de las cinco expresiones.
3. `BaseballCharacterCard` continúa siendo la tarjeta de colección única.
4. No se crea ningún controlador o tarjeta específica de bw006.
5. Los cinco SVG son originales, autónomos, ligeros y no contienen `<text>` ni dependencias de fuentes externas.
6. La paleta sigue la identidad canónica del catálogo: cabello `#2f313f`, piel `#c88b68`, acento Lightning `#f6d447` y ojos `#302b38`.
7. La escena de QA usa la misma tarjeta de producción y el mismo `VisualQAExporter` existente.
8. CI genera `qa_captures/bw006_character_presentation.png` con Godot 4.5.1-stable y límite externo de 15 s.
9. Los estados expresivos son exclusivamente de presentación y nunca modifican gameplay.
10. La unidad bw006 se entrega en un único commit consolidado, agrupando arte vectorial, escena, documentación y CI.

### Validación

El test estructural verifica identidad, stats clave, existencia y autonomía de los cinco SVG, ausencia de `<text>`, continuidad de paleta, diferenciación de contenido, rutas deterministas y compatibilidad con la API de `BaseballCharacterCard`.

El workflow de CI añade el job específico de bw006 y mantiene la barrera de 15 s, delegando la captura PNG al `VisualQAExporter` compartido.

**Runtime local:** no ejecutado en este entorno. La ejecución headless se realizará mediante GitHub Actions al detectar el nuevo commit.

### Estado

**bw006 implementado a nivel estructural y listo para validación headless en CI.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android ni contenido completo.


### Corrección QA de Revisión 72

La primera ejecución headless de CI detectó dos problemas de tipado/inspección en `scenes/bw006_character_presentation_test.gd`: la escena dependía de que `BaseballCharacterCard` estuviera registrado como tipo global durante el parseo y consultaba `has_method()` sobre el recurso Script en lugar de una instancia.

Se corrigió el test para:
- tipar la referencia como `Control` y conservar la instancia real de `BaseballCharacterCard` mediante preload;
- invocar `setup()` y `set_expression()` mediante `call()` después de validar que la instancia expone la API esperada;
- mantener la arquitectura `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard` sin crear una segunda implementación.

El fallo fue detectado por GitHub Actions antes de declarar bw006 terminado. Esta corrección forma parte del mismo cierre lógico de bw006; no se modifica el gameplay.


### Segunda corrección QA de bw006

La siguiente ejecución CI mostró que el parser headless tampoco resolvía llamadas estáticas a `CharacterArchetypeCatalog` a través del alias `Catalog`. El contrato de producción no está en duda; el problema pertenece exclusivamente a la escena de prueba.

Se reemplazaron esas llamadas por `Catalog.call(...)`, manteniendo el test dependiente de la misma `CharacterArchetypeCatalog` y evitando crear wrappers o lógica paralela. La escena conserva la validación de identidad, PlayerData y tarjeta de presentación.

Este ajuste se integra en el mismo commit consolidado de bw006 antes del cierre de la unidad.


### Tercera corrección QA de bw006

La siguiente ejecución confirmó que el alias preloaded tampoco debía invocarse dinámicamente desde la escena de prueba. La escena ahora utiliza directamente la clase global existente `CharacterArchetypeCatalog`, igual que el resto de los stores y sistemas del proyecto.

Con esto el test vuelve a depender de la autoridad canónica real y mantiene la cadena de presentación sin duplicaciones.


### Cuarta corrección QA de bw006

La validación headless mostró que el ejecutor de la escena aislada no registra `CharacterArchetypeCatalog` como clase global durante el parseo de este test, aunque el catálogo funciona como autoridad del proyecto. Para no modificar el catálogo existente ni crear una implementación paralela, la escena ahora tipa su preload como `Script` y accede únicamente a sus métodos estáticos mediante `CatalogScript.call(...)`.

Esto conserva la dependencia real del catálogo y elimina la dependencia del registro global del parser de la escena QA.


### Corrección final de compilación y precarga CI de bw006

Las ejecuciones headless posteriores permitieron aislar el problema restante en la infraestructura compartida de presentación. Godot 4.5.1 no podía inferir dos variables de `BaseballCharacterCard` durante la carga aislada y el runner no calentaba la caché de `class_name` antes de abrir las escenas de presentación.

Se corrigió dentro del mismo commit consolidado de bw006:
- `game/ui/character_card.gd`: `radius` queda tipado como `float` y el panel como `StyleBoxFlat`.
- `.github/workflows/visual_qa.yml`: cada job de personaje realiza una importación headless del proyecto mediante el editor antes de ejecutar la escena de QA.

No se modifican estadísticas, catálogo canónico, expresiones, gameplay ni la arquitectura de presentación.


### Correcciones de compilación compartida detectadas por CI en bw006

La validación headless encontró tres puntos previos al arte final de la unidad:
- `scenes/hub.gd`: tipado explícito de la lectura del bloque visual del personaje inicial para evitar que Godot 4.5.1 trate la inferencia desde Variant como error.
- `scenes/bw005_character_presentation_test.gd`: eliminación de llamadas estáticas inválidas a `has_method()` y validación sobre la instancia real de la tarjeta.
- `game/characters/character_archetype_catalog.gd`: conversión explícita de los roles de habilidad provenientes de JSON hacia `Array[String]` de `PlayerData`.

Son correcciones de robustez del pipeline existente. No modifican estadísticas ni reglas de béisbol, y se integran en el mismo commit consolidado de bw006.


### QA de regresión compartida para cerrar bw006

CI detectó errores preexistentes en sistemas compartidos que impedían que las unidades visuales anteriores llegaran a su captura: persistencia con firmas incoherentes, inferencias Variant en UI de campaña/Hub y tests bw004/bw005 que inspeccionaban `has_method()` sobre el Script en lugar de una instancia.

Se corrigieron de forma conservadora:
- `PlayerProgressStore`: `restore_snapshot` utiliza el escritor interno ya existente.
- `CharacterRosterStore`: se separa el escritor interno de `save_state` para permitir snapshots candidatos sin romper la autoridad de persistencia.
- `BaseballCampaignMapView` y `BaseballHubMenuIcon`: tipado explícito de valores inferidos desde Variant.
- Tests de presentación bw004/bw005: validación de API sobre la instancia de tarjeta.

Las correcciones no cambian reglas deportivas, economía ni identidad de personajes; permiten que el pipeline visual realmente pueda validar bw006 como unidad aislada y mantener regresión de las unidades anteriores.


### Corrección de persistencia detectada durante QA de regresión

CI confirmó que `CharacterRosterStore` ya había migrado sus mutaciones a snapshots candidatos, pero el helper `_write_state` no había quedado materializado en la versión consolidada. Se añadió explícitamente como escritor interno y `save_state()` conserva su función pública sin argumentos.

Esto corrige el contrato existente sin cambiar la autoridad del roster ni su formato de guardado.


### Corrección final del cierre de captura headless

GitHub Actions mostró que las escenas bw004/bw005/bw006 podían completar toda la validación estructural pero quedar hasta el timeout cuando `RenderingServer.frame_post_draw` no emitía en el contexto headless.

Se amplía `VisualQAExporter` sin eliminar su contrato anterior:
- espera de asentamiento + dos frames de proceso;
- intento directo de captura desde el viewport;
- fallback a `RenderingServer.frame_post_draw` cuando la textura todavía no está disponible;
- watchdog de 5 s y códigos de salida 0/1 intactos.

La captura continúa siendo una herramienta de presentación y nunca toca gameplay.

## Revisión 59: Unidad visual bw007 (Kira Kurosawa)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Completar la siguiente unidad controlada del pipeline visual después de bw006 sin alterar el catálogo canónico ni la infraestructura compartida de expresiones, tarjetas o captura headless.

### Identidad canónica bloqueada

La unidad utiliza exclusivamente el registro existente de `bw007` en `game/characters/character_archetypes.json`:

- **Nombre:** Kira Kurosawa
- **Rareza:** SSR
- **Posición:** RF
- **Elemento:** Darkness
- **Especialización:** Power
- **Potencial:** 5
- **Stats:** Power 76, Contact 69, Speed 57, Pitch 54, Control 67, Defense 61, Critical 16, Stamina 74.
- **Paleta:** cabello `#3b1e49`, acento `#8b5cf6`, ojos `#3c2148`, piel `#e1aa8d`, uniforme `#f1e8ff`.

No se crea una segunda fuente de verdad. El test bloquea cualquier deriva del catálogo.

### Implementado

- cinco SVG de expresión independientes bajo `assets/characters/expressions/`;
- `scenes/bw007_character_presentation_test.gd`;
- `scenes/bw007_character_presentation_test.tscn`;
- extensión de `.github/workflows/visual_qa.yml` con job headless `bw007-visual-qa`.

### Decisiones de producción visual

1. SVG autónomo, sin `<text>`, fuentes embebidas ni referencias externas.
2. Los cinco estados tienen cambios faciales específicos y se valida que sus contenidos sean distintos.
3. La dirección visual expresa a Kira como bateadora Power adulta, dramática y segura, con cabello largo oscuro púrpura, acento violeta y chaqueta deportiva.
4. El flujo permanece `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
5. No se modifican estadísticas, RNG, equipamiento ni resolvers de béisbol.

### QA

La escena comprueba identidad, stats, roles, paleta, existencia y unicidad de los cinco assets, ausencia de `<text>` y resolución de paths. CI genera `qa_captures/bw007_character_presentation.png` con Godot 4.5.1-stable y lo publica como artifact.

**Runtime local:** no disponible en este entorno. La ejecución headless queda delegada al workflow de GitHub Actions activado por el push a `main`.

### Estado

**Implementado y conectado.** bw007 queda cerrado como unidad del pipeline visual a nivel de código, assets vectoriales, escena y CI.

### Avance aproximado

**≈95% estructural del prototipo.**

## Revisión 60: Unidad visual bw008 (Nao Fujimoto)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Completar bw008 como la siguiente unidad controlada después de bw007, trabajando una personaje a la vez para evitar propagar errores de arte, catálogo, expresión o CI a todo el roster.

### Identidad canónica bloqueada

La unidad utiliza exclusivamente el registro existente de `bw008` en `game/characters/character_archetypes.json`:

- **Nombre:** Nao Fujimoto
- **Rareza:** SR
- **Posición:** 2B
- **Elemento:** Water
- **Especialización:** Contact
- **Potencial:** 3
- **Stats:** Power 57, Contact 82, Speed 74, Pitch 48, Control 57, Defense 70, Critical 12, Stamina 68.
- **Identidad:** `quiet_blue_contact_analyst`
- **Play identity:** `contact_manipulator`
- **Acción de firma:** `count_probe`
- **Paleta canónica:** cabello `#4b79a6`, acento `#3b82f6`, ojos `#284761`, piel `#f1c6aa`, uniforme `#eef7ff`.

No se crea una segunda fuente de verdad y no se modifican los atributos canónicos existentes.

### Implementado

- cinco SVG autónomos: `bw008_neutral.svg`, `bw008_happy.svg`, `bw008_focused.svg`, `bw008_surprised.svg`, `bw008_disappointed.svg`;
- `scenes/bw008_character_presentation_test.gd`;
- `scenes/bw008_character_presentation_test.tscn`;
- job `bw008-visual-qa` en `.github/workflows/visual_qa.yml`.

### Decisiones de producción visual

1. El flujo permanece estrictamente `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
2. Cada SVG es vectorial, autónomo, sin `<text>`, sin fuentes embebidas y sin referencias externas.
3. Los cinco estados comparten identidad visual pero contienen cambios faciales explícitos para evitar retratos duplicados.
4. La dirección visual de Nao prioriza una presentación adulta, sobria y analítica, coherente con su arquetipo de contacto y perfil académico.
5. La expresión es presentation-only. No escribe en PlayerData, progresión, RNG, equipamiento ni resolvers de béisbol.
6. Los assets están dimensionados para reutilizarse en Android/PC y pueden sustituirse por arte final sin cambiar contratos de gameplay.

### QA y CI

La escena valida identidad, estadísticas, skill roles, acción de firma, paleta, existencia y unicidad de los cinco assets, ausencia de `<text>` y resolución de los cinco paths de `CharacterExpressionController`.

El workflow ejecutará Godot 4.5.1-stable en headless, lanzará la escena con `--run-qa-capture`, comprobará que `qa_captures/bw008_character_presentation.png` sea no vacío y publicará la captura como artifact.

**Runtime local:** no disponible en este entorno. La captura runtime real queda delegada a GitHub Actions; no se marca como prueba local.

### Estado

**Implementado y conectado a nivel de código, assets y CI.** La unidad bw008 queda cerrada bajo el commit consolidado de esta revisión.

### Avance aproximado

**≈95% estructural del prototipo.**

## Revisión 61: Unidad visual bw009 (Rika Moriyama)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Continuar el pipeline artístico de una personaje por vez después del cierre de bw008. La unidad se mantiene aislada para detectar cualquier problema de asset, expresión, escena o CI antes de multiplicarlo al resto del roster.

### Identidad canónica bloqueada

La unidad utiliza exclusivamente el registro existente de `bw009` en `game/characters/character_archetypes.json`:

- **Nombre:** Rika Moriyama
- **Rareza:** SR
- **Posición:** LF
- **Elemento:** Nature
- **Especialización:** Runner
- **Potencial:** 4
- **Stats:** Power 59, Contact 70, Speed 90, Pitch 50, Control 60, Defense 77, Critical 9, Stamina 75.
- **Identidad:** `earthy_runner_prankster`
- **Play identity:** `first_to_third_pressure`
- **Acción de firma:** `lead_feint`
- **Skill roles:** `power_up`, `statistic`
- **Paleta canónica:** cabello `#5a7044`, acento `#4cae5f`, ojos `#344124`, piel `#c98c68`, uniforme `#f4f1da`.

No se crea una segunda fuente de verdad y no se modifican los atributos canónicos del catálogo.

### Implementado

- `assets/characters/expressions/bw009_neutral.svg`
- `assets/characters/expressions/bw009_happy.svg`
- `assets/characters/expressions/bw009_focused.svg`
- `assets/characters/expressions/bw009_surprised.svg`
- `assets/characters/expressions/bw009_disappointed.svg`
- `scenes/bw009_character_presentation_test.gd`
- `scenes/bw009_character_presentation_test.tscn`
- `docs/characters/bw009-presentation-v1.md`
- extensión de `.github/workflows/visual_qa.yml` con job `bw009-visual-qa`.

### Decisiones de producción visual

1. La cadena permanece estrictamente `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
2. Los cinco SVG son independientes, vectoriales, autónomos y no contienen `<text>`, fuentes embebidas ni referencias externas.
3. Las expresiones tienen modificaciones faciales explícitas y se valida que sus contenidos no sean idénticos.
4. La dirección visual de Rika enfatiza su identidad de corredora atlética, estilo casual y actitud juguetona sin inferir estadísticas desde el aspecto.
5. La expresión es presentation-only y nunca modifica PlayerData, progresión, equipamiento, RNG, IA ni resultados deportivos.
6. Los assets están diseñados para su reutilización posterior en Android y PC; el backend vectorial puede reemplazarse por arte final sin tocar gameplay.
7. Todo el desarrollo de bw009 queda agrupado en un único commit consolidado.

### QA y CI

La escena valida identidad, stats, skill roles, acción de firma, paleta, existencia y diferenciación de los cinco SVG, ausencia de `<text>` y resolución de paths mediante `CharacterExpressionController`.

El workflow ejecutará Godot 4.5.1-stable en headless, lanzará `bw009_character_presentation_test.tscn` con `--run-qa-capture`, comprobará que `qa_captures/bw009_character_presentation.png` sea no vacío y publicará la captura como artifact.

**Runtime local:** no ejecutado en este entorno. La validación runtime headless queda delegada a GitHub Actions.

### Estado

**Implementado a nivel estructural, assets, escena, documentación y CI. Pendiente de la ejecución runtime headless de GitHub Actions.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.



## Revisión 62: Unidad visual bw010 (Mei Kanzaki)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Continuar el pipeline artístico de una personaje por vez después del cierre consolidado de bw009. La unidad se mantiene aislada para detectar errores de identidad, expresión, assets, escena o CI antes de propagarlos al resto del roster.

### Identidad canónica bloqueada

La unidad reutiliza exclusivamente el registro existente de `bw010` en `game/characters/character_archetypes.json`:

- **Nombre:** Mei Kanzaki
- **Rareza:** SSR
- **Posición:** DH
- **Elemento:** Lightning
- **Especialización:** Pitcher
- **Potencial:** 5
- **Stats:** Power 49, Contact 56, Speed 61, Pitch 79, Control 84, Defense 65, Critical 14, Stamina 82.
- **Identidad:** `lightning_precision_pitcher`
- **Play identity:** `count_trap`
- **Acción de firma:** `count_trap`
- **Skill roles:** `power_down`, `combination`
- **Paleta canónica:** cabello `#60406e`, acento `#f6d447`, ojos `#473153`, piel `#efc2a0`, uniforme `#f5efff`.

No se crea una segunda fuente de verdad y no se modifican los atributos del catálogo.

### Implementado

- `assets/characters/expressions/bw010_neutral.svg`
- `assets/characters/expressions/bw010_happy.svg`
- `assets/characters/expressions/bw010_focused.svg`
- `assets/characters/expressions/bw010_surprised.svg`
- `assets/characters/expressions/bw010_disappointed.svg`
- `scenes/bw010_character_presentation_test.gd`
- `scenes/bw010_character_presentation_test.tscn`
- `docs/characters/bw010-presentation-v1.md`
- job `bw010-visual-qa` en `.github/workflows/visual_qa.yml`.

### Decisiones de producción visual

1. La cadena permanece estrictamente `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
2. Los cinco SVG son independientes, vectoriales, autónomos y no contienen `<text>`, fuentes embebidas ni referencias externas.
3. Las cinco expresiones modifican geometría facial de forma explícita y el test exige que sus contenidos sean distintos.
4. La dirección visual presenta a Mei como pitcher técnica adulta, con silueta delgada, rasgos definidos y contraste violeta/dorado coherente con Lightning.
5. La expresión es presentation-only y nunca modifica PlayerData, progresión, equipamiento, RNG, IA ni resultados deportivos.
6. Los assets se mantienen ligeros y reemplazables por arte final posterior sin cambiar contratos de gameplay.
7. Todo el desarrollo de bw010 queda agrupado en un único commit consolidado.

### QA y CI

La escena valida identidad, estadísticas, skill roles, acción de firma, paleta, existencia, autonomía y diferenciación de los cinco SVG, además de la resolución de paths mediante `CharacterExpressionController`.

El workflow ejecuta Godot 4.5.1-stable en headless, lanza `bw010_character_presentation_test.tscn` con `--run-qa-capture`, comprueba que `qa_captures/bw010_character_presentation.png` sea no vacío y publica la captura como artifact.

**Runtime local:** no disponible en este entorno debido a la ausencia de Godot instalado y a que la máquina de trabajo no tiene resolución DNS para descargar el binario. No se marca como prueba runtime local. La validación runtime real queda delegada al job de GitHub Actions.

### Estado

**Implementado a nivel estructural, assets, escena, documentación y CI. Pendiente de la ejecución runtime headless de GitHub Actions.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.


## Revisión 63: Unidad visual bw011 (Hina Sakuragi)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Continuar el pipeline artístico de una personaje por vez después del cierre consolidado de bw010. La unidad se mantiene aislada para detectar errores de identidad, expresión, assets, escena o CI antes de propagarlos al resto del roster.

### Identidad canónica bloqueada

La unidad reutiliza exclusivamente el registro existente de `bw011` en `game/characters/character_archetypes.json`:

- **Nombre:** Hina Sakuragi
- **Rareza:** R
- **Posición:** C
- **Elemento:** Light
- **Especialización:** Catcher
- **Potencial:** 3
- **Stats:** Power 61, Contact 60, Speed 52, Pitch 59, Control 62, Defense 82, Critical 8, Stamina 78.
- **Identidad:** `gentle_light_catcher`
- **Play identity:** `sacrifice_support`
- **Acción de firma:** ninguna en el catálogo actual
- **Skill roles:** `defense`, `power_up`
- **Paleta canónica:** cabello `#8a5a76`, acento `#f4ed9b`, ojos `#5b3b4e`, piel `#f6d1b2`, uniforme `#fff5ed`.

No se crea una segunda fuente de verdad y no se modifican los atributos del catálogo.

### Implementado

- `assets/characters/expressions/bw011_neutral.svg`
- `assets/characters/expressions/bw011_happy.svg`
- `assets/characters/expressions/bw011_focused.svg`
- `assets/characters/expressions/bw011_surprised.svg`
- `assets/characters/expressions/bw011_disappointed.svg`
- `scenes/bw011_character_presentation_test.gd`
- `scenes/bw011_character_presentation_test.tscn`
- `docs/characters/bw011-presentation-v1.md`
- job `bw011-visual-qa` en `.github/workflows/visual_qa.yml`.

### Decisiones de producción visual

1. La cadena permanece estrictamente `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
2. Los cinco SVG son independientes, vectoriales, autónomos y no contienen `<text>`, fuentes embebidas ni referencias externas.
3. Las cinco expresiones modifican geometría facial explícita y el test exige que los contenidos sean distintos.
4. La dirección visual presenta a Hina como catcher adulta de imagen amable, pulcra y luminosa, usando ciruela, crema y dorado pálido como lenguaje visual.
5. La presentación no convierte su apariencia amable en una ventaja estadística. Los efectos visuales permanecen presentation-only.
6. Los assets tienen ViewBox 512x768, formas simples y pueden reemplazarse posteriormente por arte final sin modificar contratos de gameplay.
7. Para reducir ejecuciones duplicadas de CI, el workflow de Visual QA queda restringido a `push` sobre `main`, manteniendo `workflow_dispatch` para ejecución manual.
8. Todo el desarrollo de bw011 queda consolidado al integrar la rama mediante squash merge en `main`.

### Validación estructural

Se inspeccionaron los cinco SVG antes de integrar la unidad:
- tamaños entre 5159 y 5439 caracteres;
- inicio XML y cierre SVG válidos a nivel de texto;
- ausencia de `<text>`;
- ausencia de `href=`;
- ausencia de `url(http`;
- presencia completa de la paleta canónica;
- los cinco contenidos son distintos.

También se creó la escena de prueba con `VisualQAExporter` y el job headless de GitHub Actions para producir `qa_captures/bw011_character_presentation.png`.

**Runtime local:** no ejecutado en este entorno. La captura runtime real queda delegada al workflow de GitHub Actions en `main`.

### Problemas y correcciones

- El pipeline anterior ejecutaba Visual QA en cualquier rama mediante `push`. Se añadió un filtro de rama para que los pushes automáticos se ejecuten únicamente en `main`, reduciendo ejecuciones duplicadas durante unidades visuales futuras.
- No se modificaron `CharacterExpressionController`, `BaseballCharacterCard` ni el catálogo, porque sus contratos existentes son suficientes para bw011.

### Estado

**Implementado a nivel de assets, escena, documentación y CI; listo para integración consolidada.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.


## Revisión 64: Unidad visual bw012 (Sayu Kisaragi)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico 2D / presentación de colección / Visual QA.

### Motivo

Continuar el pipeline artístico de una personaje por vez después del cierre consolidado de bw011. La unidad mantiene el control de alcance: identidad canónica, cinco expresiones vectoriales, escena de presentación, documentación y CI. No se modifica gameplay ni la fuente de verdad del roster.

### Identidad canónica bloqueada

La unidad reutiliza exclusivamente el registro existente de `bw012` en `game/characters/character_archetypes.json`:

- **Nombre:** Sayu Kisaragi
- **Rareza:** SR
- **Posición:** SS
- **Elemento:** Nature
- **Especialización:** Defender
- **Potencial:** 4
- **Stats:** Power 58, Contact 67, Speed 70, Pitch 52, Control 59, Defense 84, Critical 11, Stamina 80.
- **Identidad:** `quiet_nature_defender`
- **Play identity:** `coverage_anchor`
- **Acción de firma:** `coverage_switch`
- **Skill roles:** `defense`, `combination`
- **Paleta canónica:** cabello `#31513f`, acento `#4cae5f`, ojos `#22392a`, piel `#d59a78`, uniforme `#eef7e4`.

No se crea una segunda fuente de verdad y no se modifican los atributos del catálogo.

### Implementado

- `assets/characters/expressions/bw012_neutral.svg`
- `assets/characters/expressions/bw012_happy.svg`
- `assets/characters/expressions/bw012_focused.svg`
- `assets/characters/expressions/bw012_surprised.svg`
- `assets/characters/expressions/bw012_disappointed.svg`
- `scenes/bw012_character_presentation_test.gd`
- `scenes/bw012_character_presentation_test.tscn`
- `docs/characters/bw012-presentation-v1.md`
- job `bw012-visual-qa` en `.github/workflows/visual_qa.yml`.

### Decisiones de producción visual

1. La cadena permanece estrictamente `CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`.
2. Los cinco SVG son independientes, vectoriales, autónomos y no contienen nodos `<text>`, fuentes embebidas ni referencias externas.
3. Las cinco expresiones modifican geometría facial explícita y el test exige que sus contenidos sean distintos.
4. La dirección visual presenta a Sayu como defensora adulta reservada y práctica, con verdes de bosque y crema vegetal coherentes con Nature.
5. La expresión es presentation-only y nunca modifica PlayerData, progresión, equipamiento, RNG, IA ni resultados deportivos.
6. Los assets mantienen ViewBox 512x768, formas vectoriales simples y una estructura reemplazable por arte final sin cambiar contratos de gameplay.
7. El job de Visual QA se dispara por cambios relevantes en `main` y permanece disponible mediante `workflow_dispatch`.
8. Todo el desarrollo de bw012 se integrará mediante **squash** para que la unidad quede registrada en un único commit final de `main`.

### Validación estructural

Los cinco SVG se diseñaron con:
- cabecera XML y raíz SVG válida;
- ausencia de `<text>`;
- ausencia de `href=`, `xlink:href` y recursos HTTP;
- presencia completa de la paleta canónica;
- cinco contenidos independientes y distintos;
- tamaño aproximado de producción de varios KB, adecuado para vector art ligero.

La escena verifica además identidad canónica, stats, rareza, posición, elemento, especialización, skill roles, acción de firma, resolución de los cinco paths de expresión y diferenciación del contenido.

### Runtime y CI

La escena queda preparada para `VisualQAExporter` con `--run-qa-capture`, produciendo:

`qa_captures/bw012_character_presentation.png`

El job `bw012-visual-qa` instala Godot `4.5.1-stable`, realiza import headless, ejecuta la escena con `--run-qa-capture`, verifica que la PNG no esté vacía y la publica como artifact.

**Runtime local:** no disponible en este entorno. No se registra como ejecución local. La validación runtime real será la del workflow de GitHub Actions tras el squash merge en `main`.

### Problemas y correcciones

- No fue necesario modificar `CharacterArchetypeCatalog`, `CharacterExpressionController` ni `BaseballCharacterCard`: sus contratos existentes cubren bw012 sin crear duplicación.
- Se mantiene el principio de una unidad por vez para que cualquier fallo quede contenido antes de propagarse a las siguientes personajes.

### Estado

**Implementado a nivel de assets, escena, documentación y CI; pendiente únicamente la ejecución runtime headless sobre `main`.**

### Avance aproximado

**≈96% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.


## Revisión 65: Cola de generación visual bw013 (Kaede Arakawa)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico data-first / preparación de generación remota.

### Motivo

Mantener el pipeline visual de una personaje por vez, trasladando la definición de generación a una estructura JSON ligera para que el workflow remoto pueda producir assets sin duplicar lógica de Godot ni crear una segunda fuente de verdad.

### Implementado

- `data/characters_queue.json`
- Registro único de `bw013` con identidad canónica, estadísticas, paleta, dirección visual y prompts para Pollinations.ai.
- Cinco variantes de expresión: neutral, happy, focused, surprised y disappointed.
- Negative prompt y restricciones de consistencia para preservar identidad, paleta y silueta.

### Decisiones

1. La fuente canónica continúa siendo `game/characters/character_archetypes.json`.
2. `data/characters_queue.json` funciona únicamente como cola de generación, no como autoridad de gameplay.
3. No se añadió GDScript específico para bw013 porque los controladores y tarjetas existentes cubren la unidad.
4. La generación remota debe conservar identidad adulta, paleta, silueta y ausencia de texto/branding incrustado.
5. No se ejecutó generación ni runtime de Godot en este entorno.

### Estado

**Preparación de datos completada; generación visual remota pendiente de ejecución por el workflow correspondiente.**

### Avance aproximado

**≈96% estructural del prototipo.**


## Revisión 66: Unidad de generación visual bw015 (Momo Hoshino)

**Fecha:** 2026-09-21  
**Tipo:** Pipeline artístico data-first / preparación de generación / QA estructural.

### Motivo

Integrar de forma controlada la siguiente unidad del pipeline, una sola personaje por vez, utilizando la estructura completa proporcionada para bw015 sin alterar resolvers de béisbol ni crear una segunda autoridad de gameplay.

### Identidad canónica

- Nombre: Momo Hoshino.
- Adult: true.
- Rareza: SSR.
- Posición: DH.
- Elemento: Fire.
- Especialización: Power.
- Potencial: 5.
- Stats: Power 71, Contact 70, Speed 54, Pitch 66, Control 78, Defense 68, Critical 15, Stamina 83.
- Arquetipo: warm_curvy_power_hitter.
- Play identity: clutch_contact.
- Acción de firma: sacrifice_fly_focus.
- Skill roles: attack, support.

support se registra como rol de identidad para bw015, no como categoría ejecutable nueva de SkillResolver. La implementación futura de cualquier efecto de soporte deberá introducir un contrato y balance propios.

### Archivos creados o modificados

- data/characters_queue.json
- game/characters/character_archetypes.json
- scenes/bw015_generation_queue_test.gd
- scenes/bw015_generation_queue_test.tscn
- docs/characters/bw015-generation-queue-v1.md

### Estructura artística integrada

La cola contiene:

- prompt base y negative prompt para generación del retrato;
- cinco expresiones;
- sprite de referencia 128x128;
- sistema 2D por capas MomoHoshino_Rig;
- cuatro animaciones previstas.

La capa de generación utiliza los descriptors curvy_power, medium_wavy y classic_baseball sin convertirlos automáticamente en nuevos presets del renderer runtime.

### Decisiones arquitectónicas

1. data/characters_queue.json continúa siendo cola de generación y no autoridad de gameplay.
2. CharacterArchetypeCatalog sigue siendo la fuente canónica de atributos jugables.
3. La cadena de presentación no cambia: CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard.
4. No se agregan SVG ni arte final en esta revisión porque la estructura recibida define datos de generación, sprite y rig, no assets finales.
5. No se modifica la lógica de béisbol, RNG, IA, economía, progreso ni recompensas.
6. La unidad sigue siendo aislada para detectar errores antes de multiplicarlos por el resto del roster.

### Pruebas

Se creó una prueba headless estructural para validar:

- esquema de cola;
- identidad y estadísticas;
- paleta;
- cinco prompts de expresión;
- estructura del generador de sprite;
- partes del rig;
- animaciones;
- ausencia de URLs externas;
- sincronización entre cola y catálogo.

Runtime local: no ejecutado en este entorno. La prueba queda preparada para Godot 4.x headless/CI.

### Problemas encontrados y correcciones

- El catálogo previo de bw015 ya contenía la identidad y estadísticas principales, pero usaba etiquetas de estilo y roles de skill anteriores. Se alineó con la nueva definición.
- El renderer existente utiliza parámetros geométricos ya consolidados. Para evitar una regresión, curvy_power, medium_wavy y classic_baseball quedan como descriptores de generación en la cola, mientras los campos runtime conservan presets compatibles.
- No se introdujo una categoría support en el SkillResolver sin una mecánica concreta, evitando ampliar el sistema únicamente por una etiqueta.

### Estado

**Implementación de estructura completa completada; generación de assets finales y animación runtime de bw015 quedan como etapas posteriores del pipeline.**

### Avance aproximado
**≈97% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.

## Revisión 67: Lote de cola visual bw016-bw020

**Fecha:** 2026-09-21
**Tipo:** Pipeline artístico data-first / generación por lote / QA estructural / CI.

### Motivo

Acelerar la preparación de la línea visual mediante un lote controlado de cinco unidades, manteniendo la autoridad canónica en `game/characters/character_archetypes.json` y sin modificar la cadena de presentación ni el gameplay.

### Unidades

- **bw016 Fuyuki Aono:** SR, P, Ice, pitcher, `reserved_ice_pitcher`, paleta azul hielo/cian.
- **bw017 Yuzu Takahashi:** R, 2B, Light, contact, `golden_light_contact_worker`, paleta crema/oro.
- **bw018 Koharu Nishiki:** SR, LF, Nature, defender, `green_field_guardian`, paleta verde bosque/crema, pecas como rasgo visual.
- **bw019 Chika Raikou:** SSR, RF, Lightning, power, `electric_athletic_brawler`, paleta grafito/blanco/oro eléctrico.
- **bw020 Shiori Amane:** SR, SS, Darkness, contact, `dark_quiet_contact_ghost`, paleta ciruela/lavanda.

Los atributos, estadísticas, identidad y paleta se sincronizan directamente desde el catálogo canónico. No se crea una segunda fuente de verdad.

### Implementado

- Extensión de `data/characters_queue.json` con `batch_units` para bw016-bw020.
- `schema_version: 1` independiente por unidad.
- Prompt base y negative prompt por personaje.
- Cinco expresiones de Pollinations por personaje: neutral, happy, focused, surprised, disappointed.
- Configuración de sprite pixel-art 128x128 con fondo transparente.
- Capas de animación 2D por corte con cuatro animaciones base por unidad.
- `scenes/bw016_bw020_generation_queue_test.gd`
- `scenes/bw016_bw020_generation_queue_test.tscn`
- job `bw016-020-generation-queue-qa` en `.github/workflows/visual_qa.yml`.
- El trigger de Visual QA también contempla la escena de prueba del lote.

### Decisiones arquitectónicas

1. `CharacterArchetypeCatalog` continúa siendo la autoridad de atributos de gameplay.
2. `data/characters_queue.json` es exclusivamente cola de generación visual.
3. No se modifican `CharacterExpressionController`, `BaseballCharacterCard` ni resolvers deportivos.
4. Los prompts fuerzan personaje femenino adulto y bloquean términos de menor de edad.
5. No se incrustan URLs, recursos externos ni branding dentro de la cola.
6. El lote utiliza una única escena de QA para validar las cinco unidades, evitando duplicar lógica de test.
7. La integración final en `main` se realiza mediante squash para conservar un commit consolidado del lote.

### Pruebas

La prueba estructural valida:
- cinco unidades exactas y únicas;
- `schema_version` 1;
- sincronización con catálogo canónico;
- ocho estadísticas;
- identidad, acción de firma y skill roles;
- paletas hexadecimales;
- cinco expresiones por unidad;
- configuración 128x128;
- rig y capas de animación;
- ausencia de URLs remotas.

**Runtime local:** no ejecutado en este entorno. La validación runtime queda delegada al workflow de GitHub Actions.

### Problemas y correcciones

La cola anterior era un único objeto de unidad (`bw015`). En lugar de convertirla a un nuevo formato raíz y romper el test existente, se añadió `batch_units` como extensión compatible con la estructura previa.

### Estado

**Implementación de datos, QA estructural y CI completados en la rama de trabajo. Pendiente de squash merge y ejecución real de GitHub Actions sobre `main`.**

### Avance aproximado

**≈97% estructural del prototipo.** Este porcentaje no representa porcentaje de arte final, balance definitivo, validación Android local ni contenido completo.


## Revisión 73: Telegram Mini App frontend y pipeline de GitHub Pages

**Fecha:** 2026-09-21  
**Tipo:** Distribución web opcional / frontend / CI/CD / contratos de transporte.

### Motivo

Se instala la primera capa de Telegram Mini App solicitada sin convertirla en una segunda autoridad de gameplay. La TMA funciona como cliente de presentación y transporte; Godot y los servicios autoritativos siguen siendo la fuente del resultado deportivo, progreso y economía.

### Implementado

Frontend:
- webapp/index.html
- webapp/css/style.css
- webapp/js/app.js
- webapp/js/combat.js
- webapp/js/api.js

Assets:
- assets/production/sprites/.gitkeep
- assets/production/cards/.gitkeep

CI/CD:
- .github/workflows/deploy-pages.yml

Documentación:
- docs/game-design/WAIFUMON_RULES.md

### Arquitectura

El flujo web queda:

CombatInitDTO / TurnResultDTO
→ API client / Telegram bridge
→ CombatRenderer Canvas 2D
→ UI y Cut-In

El renderer utiliza requestAnimationFrame, limita el device pixel ratio para controlar memoria gráfica y mantiene un AssetBank que precarga sprites y retratos declarados por manifest o DTO.

El cliente puede solicitar acciones BAT y STEAL, pero nunca calcula su resultado. La API transmite la acción y el servidor autoritativo debe responder con TurnResultDTO.

La integración Telegram utiliza el SDK oficial cargado en index.html. initDataUnsafe se utiliza únicamente para presentación; la documentación establece que la identidad privilegiada debe verificarse del lado servidor antes de cualquier operación sensible.

### GitHub Pages

El workflow valida los cinco archivos de frontend, valida la existencia de los directorios de producción y comprueba sintaxis JavaScript mediante Node.

Como los assets de producción viven fuera de webapp/, el workflow construye un sitio temporal que copia webapp/ y después incorpora assets/production/ bajo el mismo árbol publicado. También genera manifest.json con los sprites y cards encontrados, de modo que el renderer pueda precargarlos sin depender de un listado manual del navegador.

### Monetización y referidos

WAIFUMON_RULES.md documenta Telegram Stars como canal de pago opcional y exige verificación, idempotencia y concesión de entitlements en el backend. También define referidos como atribución validada por servidor y no como una orden de recompensa controlada por el cliente.

No se crea en esta revisión un backend de pagos, verificación de Telegram, servicio de referidos ni nueva economía paralela.

### Decisiones arquitectónicas

1. La TMA es opcional y no reemplaza el cliente Godot.
2. El frontend no decide resultados deportivos, recompensas, rarity, pity, energía ni pagos.
3. No se añade una base de datos web local que compita con PlayerProgressStore o CharacterRosterStore.
4. La ruta de assets se normaliza en el artefacto de Pages para que el mismo renderer funcione con una manifestación de producción.
5. Se evita depender de emojis como iconografía funcional.
6. No se incorporan voces, assets externos ni librerías propietarias adicionales.

### QA

Se añadió validación automática de estructura y sintaxis JavaScript al workflow de Pages. La validación está preparada para ejecutarse en GitHub Actions tras el push a main.

Runtime del frontend dentro de Telegram: no ejecutado localmente en este entorno. Runtime Godot: sin cambios y no ejecutado.

### Problemas encontrados y correcciones

- El requisito de publicar únicamente webapp/ habría dejado fuera los assets que viven en assets/production/. Se corrigió mediante un paso de staging del sitio antes de upload-pages-artifact.
- El frontend necesitaba una forma reproducible de descubrir assets sin acceso a listado de directorios del navegador. Se resolvió con manifest.json generado por CI y descriptores de assets dentro de los DTO.
- La monetización podía crear una segunda autoridad económica. Se bloqueó explícitamente la concesión client-side y se dejó el backend futuro como único responsable de verificar y entregar entitlements.

### Estado

**Implementado a nivel de frontend, contrato de transporte y CI/CD. Backend Telegram/Stars/referidos pendiente de una fase posterior y deberá conservar la autoridad existente del juego.**

### Avance aproximado

**≈96% estructural del prototipo.** El porcentaje continúa representando estructura implementada y no porcentaje de contenido final, runtime móvil, arte final completo, backend comercial ni publicación efectiva en Telegram.

### Addendum de Revisión 73: contrato DTO en CI

Se añadió webapp/js/contract_test.mjs y el workflow de GitHub Pages ahora ejecuta una prueba Node que acepta un CombatInitDTO válido, acepta un TurnResultDTO válido y rechaza estructuras inválidas.

El frontend conserva la misma frontera de autoridad: el test valida solamente contratos de transporte y no modifica gameplay.

**Runtime local:** no ejecutado. La validación queda preparada para GitHub Actions mediante Node en el job de despliegue.

### Corrección de producción de Revisión 73: cancelación de requests

webapp/js/api.js sustituye el timeout basado solamente en Promise.race por AbortController. Las peticiones de inicialización y turnos ahora cancelan la solicitud HTTP cuando vence el timeout, evitando requests huérfanas y reduciendo consumo innecesario en Android/WebView.

No cambia el contrato DTO ni la autoridad del combate.

