# Character Identity and Baseball Actions v1

**Estado:** Diseño adoptado para el roster; las acciones de firma quedan como contratos de gameplay pendientes de implementación.
**Fecha:** 2026-09-21

## 1. Regla central

La apariencia no determina las estadísticas.

El cuerpo, color de piel, cabello, peinado, busto, altura, ropa, maquillaje, pecas, calzado, nivel de arreglo personal o estilo corporal pertenecen al perfil visual. No pueden ser usados por un resolver para inferir Power, Contact, Speed, Pitch, Control, Defense, Critical, Stamina, rareza, recompensas o probabilidades.

La personalidad tampoco concede estadísticas implícitas.

La separación queda:

`CharacterIdentity/AvatarProfile -> presentación`

`PlayerData -> estadísticas y progresión`

`Skill/Action Resolver -> reglas de gameplay`

Una personaje puede parecer musculosa y tener un Power moderado. Una personaje voluptuosa puede ser una excelente corredora. Una chica pequeña puede tener gran Power. La explicación está en su historia, entrenamiento, especialidad y valores de PlayerData, no en su silueta.

## 2. Rareza y profundidad de personaje

### R

Las R son jugadoras normales del roster. Deben tener identidad visual y una forma reconocible de jugar, pero no necesitan una historia de personaje extensa ni una habilidad de firma obligatoria.

Su valor puede venir de:
- estadísticas útiles;
- posición;
- elemento;
- especialización;
- compatibilidad de equipo;
- crianza/herencia futura.

### SR

Las SR deben empezar a sentirse como personajes, no como una R recoloreada.

Cada SR debe tener:
- estilo visual propio;
- personalidad/hábitos;
- pequeño arco o historia de fondo;
- una contradicción interesante;
- al menos una acción de firma;
- una razón narrativa para que esa acción exista.

### SSR / UR

Mantienen la regla anterior y pueden desarrollar:
- historias más extensas;
- acciones de firma más complejas;
- relaciones con otras personajes;
- habilidades activas/pasivas;
- identidad de equipo más fuerte.

La rareza no convierte automáticamente una acción en éxito. Una habilidad de UR puede fallar si el contexto, la decisión o el timing son malos.

## 3. Qué significa "acción que contradice su estilo"

La contradicción no es una penalización.

Es una herramienta narrativa para evitar personajes planos.

Ejemplos:

- una bateadora de Power que decide sacrificar su turno para avanzar una corredora;
- una tomboy musculosa que gana una jugada mediante posicionamiento y engaño;
- una idol perfectamente arreglada que toma una decisión improvisada de baserunning;
- una chica introvertida/hikikomori que se vuelve extremadamente agresiva al correr bases;
- una pitcher refinada que provoca deliberadamente una mala decisión del rival;
- una catcher dominante que debe ceder el control y confiar en su pitcher.

La contradicción hace que el personaje tenga una segunda capa. No cambia automáticamente sus estadísticas.

## 4. Acciones de béisbol estudiadas

La investigación de reglas y estrategia consultada para este diseño identifica tácticas reales como:
- steal;
- pickoff;
- pitchout;
- hit-and-run;
- sacrifice bunt;
- bunt for a hit;
- squeeze play;
- sacrifice fly;
- tomar un lanzamiento deliberadamente en ciertos conteos;
- defensive shift;
- infield playing in;
- ajustes de cobertura y relevo.

Estas acciones son útiles como vocabulario de habilidades porque ya existen dentro del lenguaje táctico del béisbol. No deben implementarse como ataques RPG ni como nuevos tipos permanentes de lanzamiento.

Referencia de código estudiada:
- `davidfwatson/game-simulator`, archivo `baseball.py`: se revisó como referencia de separación entre perfil de bateo, aleatoriedad reproducible y simulación de pelota. No se copió código.
- La búsqueda pública también permitió contrastar vocabulario táctico de béisbol, pero no se incorporó código externo al proyecto.

## 5. Catálogo de acciones de firma actual

| ID | Personaje | Idea |
|---|---|---|
| tempo_freeze | Reina Kurose | Alterar el ritmo esperado del turno sin crear un cuarto pitch. |
| hit_and_run_signal | Miu Tachibana | Coordinar carrera y contacto para abrir un hueco. |
| delayed_steal | Yuna Minase | Esperar una señal defensiva antes de robar. |
| pitchout_read | Sora Amamiya | Leer el intento de robo y responder con pitchout. |
| defensive_shift_bait | Akari Shimizu | Usar posicionamiento para inducir una decisión ofensiva. |
| disciplined_take | Kira Kurosawa | Rechazar el swing en una situación donde todos esperan agresión. |
| count_probe | Nao Fujimoto | Usar el turno para estudiar patrones del pitcher. |
| lead_feint | Rika Moriyama | Amagar avance para alterar la defensa. |
| count_trap | Mei Kanzaki | Encadenar decisiones para provocar un conteo incómodo. |
| coverage_switch | Sayu Kisaragi | Cambiar la responsabilidad defensiva según la trayectoria. |
| sacrifice_bunt | Kaede Arakawa | Renunciar a una oportunidad de poder para fabricar avance. |
| drag_bunt | Rin Asakura | Convertir velocidad en amenaza de toque. |
| sacrifice_fly_focus | Momo Hoshino | Priorizar profundidad suficiente para permitir tag-up. |
| pickoff_check | Fuyuki Aono | Castigar una ventaja excesiva del corredor. |
| relay_chain | Koharu Nishiki | Convertir recuperación y asistencia en una cadena defensiva. |
| hit_and_run_brawl | Chika Raikou | Jugar una acción coordinada pese a su estilo frontal. |
| delayed_steal_read | Shiori Amane | Robar cuando la defensa deja de prestar atención. |
| drawn_in_infield | Ayame Tsukino | Acercar la defensa al plato para proteger una carrera. |
| aggressive_extra_base | Towa Amami | Buscar una base extra con lectura instantánea. |
| pressure_sequence | Nene Kagetsu | Cambiar intensidad sin añadir nuevos tipos de pitch. |
| fundamental_double_play | Itsuki Kogane | Priorizar ejecución limpia de una doble matanza. |
| squeeze_play | Ema Kuroyuri | Coordinar toque y corredor para intentar traer la carrera. |
| two_strike_foul_control | Hotaru Kazehaya | Alargar un turno con dos strikes sin regalarlo. |
| team_first_hit | Aria Solis | Sacrificar protagonismo para fabricar una carrera. |
| silent_steal | Sena Yoru | Convertir observación y silencio en una salida agresiva. |
| catcher_read | Kagari Homura | Ceder control cuando la lectura exige confiar en la pitcher. |

Las R actuales no reciben una acción de firma narrativa obligatoria: Aiko Hanamori, Hina Sakuragi, Yuzu Takahashi y Noa Mizuno conservan un perfil deportivo base y podrán recibir historia cuando el contenido narrativo las necesite.

## 6. Contrato técnico de una acción de firma

Una acción futura debe expresar como mínimo:

- `action_id`
- `owner_character_id`
- `phase`: pitch, batting, baserunning o defense
- `trigger`
- `player_choice`
- `context_requirements`
- `base_effect`
- `failure_condition`
- `cooldown_or_usage_rule`, si corresponde
- `audit_reason`

El resolver debe recibir el estado del béisbol y la decisión. No debe consultar el aspecto visual.

## 7. Prohibiciones

No convertir:
- musculatura -> Power automático;
- cuerpo curvilíneo -> Stamina automática;
- baja estatura -> Speed baja;
- cabello oscuro -> Darkness;
- personalidad tímida -> Defense;
- rareza -> éxito garantizado.

Tampoco crear una colección de "30 tomboys con distinto pelo". El arquetipo debe definir una combinación de silueta, vestuario, hábitos, personalidad, posición, especialización y manera de jugar.

## 8. Estado

Implementado en catálogo:
- `character_identity_v1`;
- arquetipo de estilo;
- etiquetas de estilo;
- identidad de juego;
- estado de historia;
- semilla narrativa para SR/SSR/UR;
- acción de firma.

Pendiente:
- SkillResolver;
- efectos matemáticos;
- interfaz para elegir acciones;
- integración con IA rival;
- pruebas de cada acción;
- balance de cooldown/uso.

