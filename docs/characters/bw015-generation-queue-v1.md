# bw015 Momo Hoshino: generación visual y estructura de presentación v1

## Identidad integrada

La unidad activa de generación es bw015:

- Nombre: Momo Hoshino
- Adult: true
- Rareza: SSR
- Posición: DH
- Elemento: Fire
- Especialización: Power
- Potencial: 5
- Stats: Power 71, Contact 70, Speed 54, Pitch 66, Control 78, Defense 68, Critical 15, Stamina 83.
- Arquetipo: warm_curvy_power_hitter
- Play identity: clutch_contact
- Acción de firma: sacrifice_fly_focus
- Skill roles: attack, support

El rol support se conserva como clasificación de identidad de la unidad. No introduce todavía una categoría ejecutable nueva dentro de SkillResolver; cualquier efecto futuro deberá recibir su propio contrato, fórmula y prueba.

## Dirección visual

La cola artística utiliza:

- cuerpo: curvy_power;
- altura: 0.98;
- rostro: warm;
- piel: #e8b18f;
- cabello: #b85a3f, medio y ondulado;
- uniforme: classic_baseball;
- uniforme: #fff0dd;
- acento Fire: #e4572e;
- ojos: #633022.

La cola de generación conserva estos descriptors exactamente. El catálogo runtime mantiene los campos geométricos que ya consume el renderer existente, evitando romper compatibilidad por introducir presets visuales que todavía no están implementados como parámetros de malla.

## Generación de retratos

pollinations contiene un prompt base, un negative prompt y cinco estados:

- neutral;
- happy;
- focused;
- surprised;
- disappointed.

La regla es preservar identidad, silueta y paleta entre variantes. No se incrusta texto, logotipos ni marcas de agua.

## Sprite y animación

Se definió un sprite de referencia de 128x128 y un rig 2D por capas:

MomoHoshino_Rig

Capas:

head_neutral, hair_wavy_back, hair_wavy_front, torso_curvy, arm_left_bat_grip, arm_right_bat_grip, legs_power_stance, baseball_bat_fire.

Animaciones previstas:

- idle_breathing;
- batting_ready_loop;
- power_swing_execution;
- base_run_sprint.

Estos datos son presentación y pipeline artístico. No modifican resolvers, RNG, IA rival, recompensas ni estadísticas.

## Arquitectura

La autoridad de gameplay continúa separada de la generación:

CharacterArchetypeCatalog -> PlayerData -> Gameplay Systems

y la cadena de presentación:

CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard

data/characters_queue.json es una cola de generación, no una segunda autoridad de gameplay.

## QA

scenes/bw015_generation_queue_test.tscn valida:

- esquema;
- identidad adulta;
- rareza, posición, elemento y especialización;
- los ocho stats;
- identidad y acción de firma;
- cinco expresiones;
- seguridad del prompt;
- estructura pixel-art;
- estructura del rig;
- ausencia de URLs externas;
- sincronización entre la cola y el catálogo canónico.

No se ejecuta runtime localmente desde este entorno. El test está preparado para ejecución headless en Godot 4.x.
