# Baseball Waifus
## Documento Maestro de Diseño Integral v1.0

> Esta versión convierte las ideas acumuladas del proyecto en una propuesta jugable completa. Los valores numéricos son una base de implementación y balance, no números sagrados. La referencia externa sirve para estudiar patrones de diseño y arquitectura, no para copiar código, sprites, modelos, animaciones o contenido propietario.

---

## 1. Identidad del juego

**Baseball Waifus** es un juego de béisbol anime de colección y progresión RPG, centrado en partidos interactivos, construcción de equipos, entrenamiento, equipamiento, gacha y crianza genética.

La fantasía principal del jugador es:

> Encontrar jugadoras, formar un equipo, aprender a usarlas, hacerlas crecer, conseguir equipamiento, combinarlas mediante crianza y terminar creando una plantilla que juegue de la manera que el jugador quiere.

El juego toma como referencias funcionales:
- juegos de béisbol arcade y social, especialmente la estructura de turnos pitcher/bateador y el ritmo de Baseball Heroes;
- juegos de colección y crianza como Dragon City, especialmente la idea de que una unidad puede tener valor de colección y valor genético;
- RPG/gacha para rarezas, habilidades, equipamiento, banners y progresión;
- juegos anime 2D/3D para presentación, poses, reacciones, celebraciones y movimiento secundario.

No se copiarán assets, código cerrado, personajes, nombres, animaciones propietarias ni interfaces protegidas de otros juegos.

---

## 2. Público y clasificación

Todos los personajes son adultos.

La estética puede ser anime, sensual y ecchi, con variedad corporal y vestuarios temáticos. El diseño debe evitar presentar personajes menores de edad o sexualizar diseños explícitamente infantiles.

El juego puede tener:
- uniformes deportivos;
- trajes de playa;
- idol;
- bunny;
- enfermera;
- karate;
- invierno;
- verano;
- y otros temas.

La apariencia es principalmente coleccionable y expresiva. El gameplay no depende de sexualizar una posición concreta del cuerpo.

---

## 3. Bucle principal

El bucle central es:

**Conseguir → formar equipo → jugar → ganar recursos → entrenar → equipar → mejorar → criar → conseguir nuevas combinaciones → afrontar contenido más difícil.**

Un jugador típico:
1. recibe o consigue personajes;
2. arma una alineación;
3. juega mapas;
4. obtiene EXP, monedas y materiales;
5. mejora personajes y equipo;
6. usa energía y comida de forma estratégica;
7. consigue Demon Kings y fragmentos;
8. participa en banners;
9. cría descendientes;
10. crea una plantilla cada vez más personalizada.

El juego debe recompensar tanto al jugador competitivo como al coleccionista.

---

# 4. Partido

## 4.1 Estructura

Un partido estándar tiene 3 innings en contenido rápido y puede ampliarse a 5 o 9 innings en modos avanzados.

Cada mitad de inning:
- un equipo batea;
- el otro defiende;
- se intercambian los papeles.

El objetivo es conseguir más carreras.

Para el prototipo inicial se usa una versión reducida:
- 1 bateadora;
- 1 pitcher;
- campo simplificado;
- carreras;
- outs;
- Home Run.

Después se agregan corredores, defensa, robos y reglas completas.

---

## 4.2 Turno del pitcher

El pitcher dispone de una ventana corta de decisión, configurable según modo.

Valor base:
**5 segundos.**

Puede escoger entre tres lanzamientos:

### Fastball
Lanzamiento recto y rápido.

- alta velocidad;
- menor ventana de reacción;
- comportamiento predecible;
- buen lanzamiento para presionar.

### Curve
Lanzamiento con trayectoria desviada.

- menor velocidad;
- trayectoria más difícil;
- castiga timing temprano o demasiado centrado.

### Special
Lanzamiento característico de la jugadora.

Puede ser:
- sinker;
- slider;
- fork;
- cambio;
- lanzamiento elemental;
- u otra variante.

SSR siempre puede tener Special propio. Algunos SR también lo poseen.

La animación y comportamiento se separan del personaje mediante datos para permitir añadir nuevos lanzamientos sin reescribir el sistema.

---

# 5. Bateo

## 5.1 Decisión

Durante la preparación la bateadora tiene dos acciones principales:

**BAT**
Intentar batear.

**STEAL**
Intentar robo si existen corredores y la situación lo permite.

La decisión se bloquea cuando termina la ventana.

---

## 5.2 Timing

Al llegar la pelota aparece una zona de timing.

Calidades:

- Perfect
- Great
- Good
- Normal
- Bad

La posición exacta del toque produce una puntuación de timing de 0 a 100.

Base:
- Perfect: 95-100
- Great: 85-94
- Good: 70-84
- Normal: 50-69
- Bad: 0-49

Esto no determina automáticamente el resultado. Solo modifica la probabilidad final.

---

## 5.3 Resultado del contacto

Resultados posibles:

- Miss / Strike
- Foul
- Out
- Single
- Double
- Triple
- Home Run

El resultado depende de:

**Timing + Contact + Power + técnica del lanzamiento + Control del pitcher + elemento + habilidades + equipamiento + estado + pequeñas variaciones aleatorias.**

El timing del jugador tiene peso importante.

Una UR con mal timing puede fallar.
Una R con timing perfecto puede producir un resultado sorprendente.

El sistema nunca debe convertir rareza en victoria automática.

---

# 6. Fórmula base de bateo

Para una primera implementación:

**TimingScore = 0.0 a 1.0**

**ContactScore = Contact / 100**

**PitchDifficulty = 0.0 a 1.0**

**ElementModifier = -0.10 a +0.10**

**SkillModifier = suma de efectos aplicables**

**MoodModifier = -0.05 a +0.05**

La probabilidad de contacto se calcula aproximadamente como:

**ContactChance = clamp(0.20 + 0.45 × TimingScore + 0.25 × ContactScore - 0.25 × PitchDifficulty + ElementModifier + SkillModifier + MoodModifier, 0.05, 0.95)**

Después se realiza una tirada aleatoria.

Si hay contacto, Power y calidad de timing determinan distancia/calidad del batazo.

Esta fórmula es una base técnica. Se puede cambiar durante pruebas, pero cada cambio debe registrarse en la bitácora.

---

# 7. Estadísticas definitivas v1.0

Se utilizarán ocho estadísticas principales.

### Power
Aumenta distancia del batazo y posibilidad de extra bases/Home Run.

### Contact
Aumenta posibilidad de golpear correctamente la pelota.

### Speed
Aumenta velocidad de carrera y éxito de robo.

### Pitch
Aumenta calidad y presión de los lanzamientos.

### Control
Reduce errores del pitcher y hace más difícil el timing del rival.

### Defense
Aumenta posibilidad de detener o capturar batazos.

### Critical
Aumenta la posibilidad de que un contacto de alta calidad produzca un resultado excepcional.

### Stamina
Determina cuánto rendimiento conserva la jugadora durante el partido y cuánto resiste antes de necesitar descanso.

No se añade Dexterity/Technique como estadística independiente en v1.0 para evitar duplicar Contact, Speed, Control y Critical.

---

# 8. Posiciones

Plantilla estándar de 9 jugadoras:

1. Pitcher
2. Catcher
3. First Base
4. Second Base
5. Third Base
6. Shortstop
7. Left Field
8. Center Field
9. Right Field

Una jugadora puede tener:
- posición principal;
- posiciones secundarias;
- penalización si juega fuera de su especialidad.

Esto permite crear personajes flexibles sin eliminar la identidad de cada posición.

---

# 9. Especializaciones

Las especializaciones son una capa diferente a la posición.

Tipos:

### Power Hitter
Especialista en Power y Home Run.

### Contact Hitter
Especialista en Contact y consistencia.

### Runner
Especialista en Speed y robo.

### Ace Pitcher
Especialista en Pitch y Control.

### Catcher
Especialista defensivo y de control.

### Defender
Especialista en Defense.

Un personaje puede combinar una posición y una especialización.

Ejemplo:
**SSR / Shortstop / Runner-Defender.**

---

# 10. Elementos

Sistema de siete elementos:

- 🔥 Fire
- 💧 Water
- ❄️ Ice
- ⚡ Lightning
- 🌿 Nature
- 🌑 Darkness
- ✨ Light

La rueda elemental inicial será:

**Fire > Ice > Nature > Water > Fire**

Y:

**Light ↔ Darkness**

Lightning funciona como elemento independiente con bonificaciones situacionales.

La ventaja elemental no produce daño RPG.

Produce modificadores deportivos:
- Contact;
- Control;
- Critical;
- Power;
- Defense;
- Speed;
según la interacción.

Ventaja fuerte:
**+8% al modificador relevante.**

Desventaja:
**-8%.**

Neutral:
**0%.**

Los valores pueden modificarse después de pruebas.

---

# 11. Habilidades

Cada personaje puede tener:

- 1 habilidad activa;
- 1 pasiva;
- 1 habilidad especial de rareza alta, según personaje.

Ejemplos:

**Home Run Queen**
Cuando el timing es Perfect, aumenta la probabilidad de Home Run.

**Quick Step**
Mejora la primera acción de robo.

**Iron Wall**
Aumenta Defense ante batazos fuertes.

**Ace Mind**
Reduce parcialmente la ventaja obtenida por Perfect Timing del rival.

**Lucky Batter**
Pequeña probabilidad de convertir un contacto Good en Great.

Las habilidades deben cambiar decisiones o probabilidades, no eliminar el gameplay.

---

# 12. Rarezas

Rarezas:

**R**
- base;
- fácil de obtener;
- útiles para comenzar;
- pueden tener valor genético.

**SR**
- mejores estadísticas;
- algunas habilidades especiales;
- algunos diseños alternativos.

**SSR**
- alto potencial;
- habilidades distintivas;
- acceso a Special Pitch o Special Skill según personaje;
- diseños y animaciones más elaborados.

**UR**
- máximo nivel de rareza inicial;
- alto potencial;
- kits especializados;
- efectos visuales y animaciones especiales.

Una UR no debe hacer inútil una R en manos de un jugador habilidoso.

---

# 13. Nivel y crecimiento

Cada personaje tiene nivel:

**1 → 100**

Cada nivel aumenta estadísticas según su Growth Profile.

Ejemplos:
- Power Growth;
- Contact Growth;
- Speed Growth;
- Pitch Growth;
- Defense Growth.

El crecimiento tiene variación limitada para que dos copias no sean siempre idénticas.

El nivel máximo puede aumentarse posteriormente mediante sistemas de evolución.

---

# 14. Potencial

Cada personaje posee un Potencial de 1 a 5 estrellas.

Afecta:
- crecimiento por entrenamiento;
- techo estadístico;
- calidad de descendencia;
- posibilidad de bonus.

El Potencial es independiente de la rareza.

Una R de 5 estrellas puede ser un excelente material genético.

---

# 15. Energía

Cada personaje tiene:

**Energy: 0-100**

Coste base:
- partido normal: 10;
- partido difícil: 15;
- Demon King: 25.

Regeneración:
- +1 cada 6 minutos.

Cuando llega a 0:
- no queda bloqueada permanentemente;
- puede seguir realizando actividades no competitivas;
- tiene rendimiento reducido en partidos hasta recuperar energía.

Consumibles:
- Energy Drink S: +20
- Energy Drink M: +50
- Energy Drink L: +100

Límite diario inicial:
**10 consumibles.**

Esto protege el diseño de abuso mediante una sola unidad extremadamente poderosa.

---

# 16. Felicidad

Estadística permanente:

**0-100**

Rangos:

- 0-19: Miserable
- 20-39: Baja
- 40-59: Normal
- 60-79: Feliz
- 80-100: Radiante

Efectos moderados:

0-19:
- -5% rendimiento.

20-39:
- -2%.

40-79:
- normal.

80-100:
- +3%.

No existe estado que bloquee al personaje.

La felicidad baja por:
- jugar demasiado;
- entrenar repetidamente;
- derrotas;
- determinados eventos.

Se recupera con:
- galletas;
- pasteles;
- comidas;
- actividades especiales.

---

# 17. Entrenamiento

El jugador selecciona:
- personaje;
- tipo de entrenamiento;
- duración.

Tipos:

### Batting
Power + Contact.

### Running
Speed + Stamina.

### Pitching
Pitch + Control.

### Defense
Defense + Reaction-derived modifiers.

### Balanced
Aumentos pequeños en varias estadísticas.

Duraciones:
- 30 min;
- 2 h;
- 6 h;
- 12 h;
- 24 h.

Al finalizar:
- XP;
- aumento estadístico;
- pequeña posibilidad de bonus.

El bonus depende del Potencial.

El entrenamiento no requiere que el jugador permanezca conectado.

---

# 18. Equipamiento

Cada personaje dispone de seis ranuras:

- Bat
- Gloves
- Cap
- Vest
- Skirt
- Shoes

Cada pieza tiene:
- rareza;
- nivel;
- estadísticas;
- apariencia.

Rarezas:
R / SR / SSR / UR.

SR puede ser principalmente una variante visual/color.
SSR y UR pueden cambiar mucho el aspecto.

Ejemplos:

**Power Bat**
+Power

**Precision Gloves**
+Contact

**Runner Shoes**
+Speed

**Ace Cap**
+Pitch

**Guardian Vest**
+Defense

**Lucky Skirt**
+Critical

Los nombres son temáticos y pueden cambiar.

---

# 19. Mejora de equipo

El equipo sube de nivel mediante:
- monedas;
- materiales;
- duplicados opcionales.

Máximo inicial:
**20 niveles.**

Cada 5 niveles puede aparecer un pequeño bonus aleatorio dentro de límites controlados.

SSR/UR no deberían convertirse en una lotería imposible de mejorar.

---

# 20. Gacha

Banners separados:

### Character Banner
Personajes.

### Equipment Banner
Equipo.

### Costume Banner
Trajes.

### Event Banner
Contenido temporal.

Monedas:
- Gems;
- Tickets;
- monedas normales.

Pity inicial:
**100 tiradas.**

A partir del pity:
- garantía de rareza alta según banner.

La probabilidad exacta de R/SR/SSR/UR se deja como parámetro configurable para balance y economía.

La gacha debe tener:
- historial;
- tasas visibles;
- contador de pity;
- confirmación antes de gastar;
- protección ante compras accidentales.

---

# 21. Duplicados

Los duplicados no deben ser inútiles.

Un duplicado puede convertirse en:

**Character Shards**

Los shards permiten:
- aumentar potencial;
- desbloquear límites;
- mejorar habilidades;
- desbloquear arte/animación.

Debe existir un límite para evitar que pagar repetidamente convierta directamente la rareza en poder infinito.

---

# 22. Campaña

La campaña se divide en zonas.

Cada zona:

**10 mapas normales + 1 Demon King.**

Cada mapa normal:
**10 intentos máximos por ciclo.**

Demon King:
**3 intentos máximos por ciclo.**

Esto limita el farmeo directo.

Cada zona puede tener:
- Normal;
- Hard;
- Hell.

El mapa final de cada zona introduce un Demon King.

---

# 23. Demon Kings

Los Demon Kings cumplen dos funciones:
- jefe de campaña;
- personaje jugable.

Cada uno posee:
- elemento;
- especialización;
- habilidad única;
- diseño propio;
- animación especial;
- fragmentos.

Ejemplo conceptual:

**Demon King Flame**
- Fire
- Power Hitter
- habilidad: Inferno Swing

**Demon King Frost**
- Ice
- Ace Pitcher
- habilidad: Frozen Curve

**Demon King Shadow**
- Darkness
- Runner
- habilidad: Shadow Steal

Los nombres definitivos se diseñarán como contenido, no como sistema.

---

# 24. Fragmentos

Los Demon Kings pueden entregar fragmentos con probabilidad baja.

**100 fragmentos = despertar de R a SR**, según la regla base.

Los fragmentos adicionales pueden utilizarse posteriormente para:
- habilidades;
- potencial;
- límites;
- cosméticos especiales.

La obtención debe ser lenta pero predecible.

El jugador debe poder calcular aproximadamente cuánto progreso obtiene por ciclo.

---

# 25. Recompensas

Los mapas entregan una combinación de:

- EXP;
- monedas;
- materiales;
- equipo común;
- comida;
- energía;
- shards;
- fragmentos de Demon King;
- tickets ocasionales.

SSR/UR equipment no aparece normalmente como drop directo de mapas.

Esto mantiene una separación entre:
**progreso jugando** y **colección premium**.

---

# 26. Crianza

La crianza es uno de los sistemas principales.

Se seleccionan dos padres adultos.

Resultado:
**una hija adulta jugable una vez que entra al roster.**

La descendencia combina datos de ambos padres.

Puede heredar:

- elemento;
- posición;
- especialización;
- estadísticas base;
- crecimiento;
- Potencial;
- habilidades;
- altura;
- complexión;
- tono de piel;
- cabello;
- rasgos visuales.

La descendiente nunca debe ser una copia obligatoria.

---

# 27. Herencia estadística

Para cada estadística:

**ChildBase = promedio ponderado de los padres + variación genética**

Por defecto:
- Padre A: 45%
- Padre B: 45%
- Mutación/variación: 10%

La variación está limitada.

El Potencial de los padres modifica el techo de la descendiente.

---

# 28. Herencia elemental

Probabilidad inicial:

- elemento del padre A: 40%;
- elemento del padre B: 40%;
- elemento relacionado: 15%;
- elemento raro/variación: 5%.

Las reglas pueden cambiar según combinaciones especiales.

Ejemplo:
Fire + Water puede producir:
- Fire;
- Water;
- Nature;
- Lightning en una probabilidad pequeña.

Esto crea descubrimiento sin convertir la crianza en una tabla completamente predecible.

---

# 29. Herencia de habilidades

Las habilidades tienen una probabilidad independiente.

Una habilidad de los padres puede heredarse.

Las habilidades extremadamente fuertes tienen menor probabilidad.

Esto permite crear líneas genéticas.

Ejemplo:

Padre:
**Home Run Queen**

Madre:
**Quick Step**

La hija podría recibir:
- una;
- la otra;
- ninguna;
- una variante.

El sistema debe impedir que se acumulen infinitamente habilidades sin límites.

---

# 30. Fusión

La fusión permite consumir duplicados o personajes determinados para intentar aumentar rareza.

Regla inicial:

**R + R → 20% de posibilidad de SR.**

Para rarezas superiores, las probabilidades disminuyen.

La fusión no elimina el sistema de crianza.

Diferencia:

**Fusión = progreso directo.**

**Crianza = creación de una nueva línea genética.**

---

# 31. Economía

Monedas principales:

### Coins
Uso:
- entrenamiento;
- mejora de equipo;
- mantenimiento;
- sistemas normales.

### Gems
Uso:
- gacha;
- algunos cosméticos;
- servicios especiales.

### Materials
Uso:
- evolución;
- mejora;
- crafting.

### Tickets
Uso:
- gacha específico.

### Shards
Progreso de personajes.

### Food
Felicidad.

### Energy Drinks
Energía.

La economía debe mantener categorías separadas para que cada actividad tenga una recompensa útil.

---

# 32. Modos

## Campaign
Contenido principal PvE.

## Demon King
Jefes y colección.

## Tournament
Competiciones contra equipos IA.

## Challenge
Reglas especiales:
- límite de rareza;
- elemento obligatorio;
- posiciones;
- tiempo;
- condiciones de victoria.

## Event
Contenido temporal.

## PvP
Sistema posterior.

---

# 33. Torneos

Los torneos enfrentan equipos IA.

Cada torneo tiene:
- bracket;
- dificultad;
- recompensas;
- reglas.

Ejemplos:
- solo SR;
- Fire only;
- no UR;
- Speed Cup;
- Power Cup.

Esto da utilidad a personajes que no serían parte del equipo principal.

---

# 34. PvP

Se implementará después del núcleo PvE.

Requisitos:
- servidor;
- matchmaking;
- sincronización;
- validación de acciones;
- anti-cheat;
- reconexión;
- ranking;
- temporadas.

El servidor debe validar resultados importantes.

El cliente no puede decidir unilateralmente:
- resultado del golpe;
- resultado del robo;
- recompensa;
- gacha;
- estadísticas finales.

---

# 35. Presentación visual

Arquitectura de personaje:

**Character**
- Skeleton
- Body
- Hair
- Clothing
- Equipment
- Animation Controller
- Secondary Motion

Animaciones base:

- Idle
- Walk
- Run
- Batting
- Pitching
- Catching
- Throwing
- Sliding
- Stealing
- Getting Out
- Hit Reaction
- Victory
- Defeat
- Menu Idle

Secondary Motion:
- cabello;
- ropa;
- accesorios;
- elementos cosméticos.

La animación corporal se implementa como parte del lenguaje visual del juego, no mediante animar manualmente cada pequeño movimiento.

---

# 36. Arquitectura técnica

Motor candidato principal:
**Godot 4.x**

Alternativa:
**Unity**

Para el primer prototipo se recomienda una arquitectura desacoplada:

**Data**
- characters;
- skills;
- elements;
- equipment;
- maps.

**Systems**
- baseball;
- battle;
- progression;
- breeding;
- gacha;
- inventory.

**Presentation**
- UI;
- animations;
- VFX;
- audio.

El gameplay no debe depender directamente de sprites concretos.

---

# 37. Datos

Ejemplo conceptual de personaje:

```json
{
  "id": "char_001",
  "name": "Example",
  "rarity": "SSR",
  "element": "fire",
  "position": "shortstop",
  "specialization": "power",
  "level": 1,
  "potential": 5,
  "stats": {
    "power": 72,
    "contact": 61,
    "speed": 48,
    "pitch": 20,
    "control": 25,
    "defense": 64,
    "critical": 55,
    "stamina": 70
  },
  "skills": [
    "home_run_queen"
  ]
}
```

Los números de personajes concretos se diseñan después.

---

# 38. Guardado

El guardado debe registrar:

- roster;
- personajes;
- niveles;
- EXP;
- potencial;
- shards;
- equipo;
- inventario;
- monedas;
- gems;
- tickets;
- energía;
- felicidad;
- progreso de campaña;
- fragmentos;
- historial de gacha;
- padres/descendencia.

En prototipo local:
**JSON o recurso equivalente.**

En versión online:
**servidor + base de datos.**

---

# 39. Anti-exploit

Desde el principio:

- semillas aleatorias controladas;
- resultados sensibles calculados en servidor en versión online;
- validación de inventario;
- validación de monedas;
- protección contra duplicación;
- logs de transacciones;
- cooldowns;
- límites diarios.

Esto importa especialmente para:
- gacha;
- crianza;
- recompensas;
- PvP.

---

# 40. Estructura del repositorio

```
baseball-waifus/
├── README.md
├── LICENSE
├── project.godot
├── game/
│   ├── baseball/
│   ├── combat/
│   ├── characters/
│   ├── breeding/
│   ├── gacha/
│   ├── equipment/
│   ├── progression/
│   ├── campaign/
│   └── tournaments/
├── data/
│   ├── characters/
│   ├── elements/
│   ├── skills/
│   ├── equipment/
│   └── maps/
├── scenes/
│   ├── menus/
│   ├── match/
│   ├── characters/
│   └── campaign/
├── assets/
│   ├── characters/
│   ├── animations/
│   ├── equipment/
│   ├── ui/
│   ├── vfx/
│   └── audio/
└── docs/
    ├── bitacora.md
    ├── game-design.md
    ├── technical-design.md
    └── roadmap.md
```

---

# 41. Qué se reutiliza del exterior

La regla del proyecto es:

**Estudiar sistemas, reutilizar software compatible con su licencia y crear contenido propio.**

Fuentes útiles para investigación:
- GitHub: código y arquitecturas con licencia compatible;
- Godot Asset Library: addons y herramientas;
- itch.io: assets y prototipos con licencia;
- OpenGameArt: assets abiertos;
- Mixamo: animaciones cuando la licencia de uso sea compatible;
- VRoid Studio/VRoid Hub: modelos y flujos de personajes bajo sus condiciones;
- Sketchfab: modelos con licencias explícitas;
- Unity Asset Store si se opta por Unity.

Antes de incorporar cualquier recurso:
1. registrar URL;
2. registrar autor;
3. registrar licencia;
4. comprobar uso comercial;
5. comprobar modificación;
6. comprobar redistribución;
7. guardar versión;
8. anotar exactamente qué parte se usa.

---

# 42. Qué NO se copia

No se incorporará directamente:
- código propietario;
- sprites extraídos;
- modelos extraídos;
- animaciones extraídas;
- sonidos extraídos;
- datos internos;
- personajes;
- nombres protegidos;
- UI copiada pixel por pixel;
- archivos obtenidos mediante extracción no autorizada.

La referencia de Baseball Heroes sirve para estudiar el flujo del género.

La referencia de Dragon City sirve para estudiar colección y crianza.

El producto final tendrá identidad propia.

---

# 43. Progresión del jugador

Ruta normal:

**Inicio**
- recibe personajes básicos;
- aprende bateo;
- completa primera zona.

**Primer crecimiento**
- desbloquea entrenamiento;
- equipo;
- felicidad;
- primeras habilidades.

**Medio juego**
- SR/SSR;
- Demon Kings;
- crianza;
- torneos.

**Endgame**
- UR;
- líneas genéticas;
- equipo optimizado;
- desafíos;
- rankings;
- eventos.

El juego debe permitir que un jugador que no gaste dinero pueda progresar mediante juego y planificación, aunque los sistemas premium aceleren la colección.

---

# 44. Primera experiencia

El tutorial debe durar aproximadamente 5-10 minutos.

Orden:

1. Presentación.
2. Elegir bateadora.
3. Aprender timing.
4. Conseguir primer Hit.
5. Aprender Home Run.
6. Aprender defensa.
7. Ganar primera partida.
8. Obtener recompensa.
9. Entrenar.
10. Equipar.
11. Desbloquear primer banner/tutorial de colección.

No mostrar veinte sistemas simultáneamente.

---

# 45. Primer contenido

Propuesta de lanzamiento prototipo:

**6 personajes**
- 1 R Power
- 1 R Runner
- 1 R Defender
- 1 SR Pitcher
- 1 SR Contact
- 1 SSR protagonista

**1 zona**
- 10 mapas;
- 1 Demon King.

**1 sistema elemental reducido**
- Fire;
- Water;
- Ice.

Después se amplía a los siete elementos.

Esto permite probar el juego sin crear cien personajes antes de saber si el bateo funciona.

---

# 46. Objetivo del prototipo

El primer prototipo no necesita:
- gacha;
- crianza;
- PvP;
- tienda;
- cien personajes.

Necesita:

**Pitch → timing → hit → defensa → carrera → puntuación → victoria/derrota.**

Si esto es divertido, los sistemas secundarios tienen una base sólida.

---

# 47. Orden real de implementación

### Sprint 0
- proyecto Godot;
- escena principal;
- control básico;
- repositorio.

### Sprint 1
- campo;
- pitcher;
- bateadora;
- pelota.

### Sprint 2
- ventana de pitch;
- selección de lanzamiento;
- timing.

### Sprint 3
- cálculo de contacto;
- Hit;
- Out;
- Home Run.

### Sprint 4
- bases;
- carreras;
- innings;
- marcador.

### Sprint 5
- defensa;
- foul;
- strike;
- ball.

### Sprint 6
- estadísticas;
- personajes;
- niveles.

### Sprint 7
- elementos;
- habilidades.

### Sprint 8
- energía;
- felicidad;
- entrenamiento.

### Sprint 9
- equipamiento;
- inventario.

### Sprint 10
- campaña;
- Demon King;
- fragmentos.

### Sprint 11
- crianza.

### Sprint 12
- gacha.

### Sprint 13
- torneos.

### Sprint 14
- pulido;
- UI;
- audio;
- animaciones.

### Sprint 15+
- PvP;
- backend;
- eventos;
- contenido.

---

# 48. Principios que no se deben romper

1. **El jugador debe jugar el béisbol.**
2. **Las estadísticas modifican probabilidades, no sustituyen al jugador.**
3. **La rareza no garantiza una victoria.**
4. **Los personajes R pueden conservar valor.**
5. **La crianza debe producir descubrimiento, no clones.**
6. **La apariencia y el gameplay deben estar desacoplados.**
7. **Los sistemas nuevos deben reutilizar infraestructura existente.**
8. **No rehacer un sistema sin registrar por qué se revisa.**
9. **No marcar como implementado algo que solamente está diseñado.**
10. **Toda incorporación externa debe pasar por una comprobación de licencia.**

---

# 48.1 Implementación vigente del conteo del prototipo

La especificación de partido v1 ya tiene una primera implementación funcional en Godot:

- los tres pitches conservan sus tipos existentes;
- el pitch puede resolverse como `BALL` antes del timing;
- 4 balls producen walk;
- 3 strikes producen out;
- un foul con 2 strikes no suma un tercer strike;
- la ventana de timing termina en strike llamado si no hay swing;
- el lineup avanza sobre el equipo que estaba bateando aunque el tercer out cambie la mitad del inning;
- el prototipo usa 3 innings.

Las reglas concretas y sus versiones están documentadas en `docs/baseball-rules-v1.md`.


---

# 49. Estado de esta versión

Esta es la **versión integral de diseño v1.0**.

Está suficientemente definida para comenzar el desarrollo del prototipo, pero los números de balance deben considerarse parámetros de prueba.

La siguiente implementación no debe intentar construir todo el juego de una vez.

El objetivo inmediato es demostrar:

**"¿Es divertido lanzar, leer el lanzamiento, calcular el timing, golpear y correr?"**

Si la respuesta es sí, todo el ecosistema de personajes, gacha, crianza y progresión puede crecer encima de ese núcleo.



## Implementación defensiva avanzada del prototipo (2026-09-21)

La defensa ahora separa captura, recepción y acciones posteriores de corredoras. `FieldingResolver` puede producir un error de recepción independiente; `DoublePlayResolver` conserva prioridad para doble matanza; `DefensiveRunnerResolver` maneja force out, rundown y sliding; `BaseballGameState` aplica los cambios a RunnerToken y bases.

El flujo es:

`BattedBallEvent → FieldingResolver → Reception/DoublePlay/DefensiveRunnerResolver → BaseballGameState → Presenter`

El renderer utiliza la pose `SLIDE` ya existente y nunca determina el resultado. Las fórmulas y límites están en `docs/defensive-rules-v1.md`.


## Sistema de Amor o Encanto v1

El juego incorpora un sistema opcional de afinidad de colección llamado **Amor o Encanto**.

Reglas cerradas para el prototipo:

- Encanto: 0-100.
- Cada punto de Encanto añade +1 a una estadística primaria determinista de la personaje.
- La estadística primaria depende de su especialización.
- Cada 10 puntos añade +1 a tres estadísticas secundarias determinadas por posición.
- Las estadísticas de gameplay tienen máximo 100 después de aplicar estos bonus.
- No existe azar para decidir qué estadística recibe el bonus.
- Los regalos consumen materiales finitos.
- Las charlas tienen límite global de 3 personajes por día y una charla máxima por personaje al día.
- Cada personaje dispone de 10 conversaciones con 3 respuestas.
- Una respuesta correcta entrega +20 Encanto y las otras dos +3 Encanto.
- La respuesta correcta se basa en información de la ficha/perfil del personaje.

La implementación vive en game/progression/charm_system.gd y game/progression/charm_state_store.gd. La persistencia local se realiza en user://baseball_waifus/charm_state.json.

## Separación visual de colección y gameplay

El arte 2D plano queda reservado para fichas/cartas y presentación de colección. El gameplay adopta un renderer 3D pixel/low-poly independiente, conectado al mismo PlayerData/AvatarProfile. La resolución del béisbol permanece completamente fuera de ambos renderers.## 3A. Diversidad del roster

El roster debe representar una variedad amplia de mujeres adultas, no una colección de recolores del mismo arquetipo.

Se contemplan diferencias de silueta y presentación, incluyendo cuerpos femeninos, curvilíneos/voluptuosos, atléticos, musculosos/tomboy, altos, bajos, delgados y robustos. También deben existir diferencias de estilo, desde idols muy arregladas hasta deportistas prácticas, personajes elegantes, callejeras o deliberadamente desarregladas.

La personalidad y los hábitos también deben variar: extrovertidas, tímidas, competitivas, tranquilas, bromistas, disciplinadas, perezosas, intelectuales, otaku, introvertidas y personajes con hábitos de aislamiento o estilo de vida hikikomori.

Detalles como pecas, ojeras, maquillaje, cabello cuidado o desordenado, accesorios y calzado ayudan a que las personajes sean reconocibles.

Estas características son visuales o de personalidad. No otorgan estadísticas implícitas ni modifican probabilidades. Una tomboy musculosa no recibe Power automáticamente y una idol no recibe una ventaja por su apariencia.

La especificación detallada queda en `docs/characters/character-diversity-v1.md`.

---


