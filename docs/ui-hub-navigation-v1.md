# Hub y navegación de Baseball Waifus

## Objetivo

El Hub es la primera capa visible del juego. Debe sentirse como un videojuego anime deportivo, no como un panel administrativo.

La arquitectura visual reutiliza los sistemas persistentes existentes y no recibe autoridad sobre el gameplay.

## Flujo

`Hub → Historia → mapa/dificultad → partido existente`

El partido continúa viviendo en `scenes/main.tscn`. El Hub no resuelve béisbol ni modifica probabilidades.

## Hub principal

El primer prototipo visual contiene:

- personaje inicial `bw001`;
- nivel/energía/monedas de la cuenta;
- comentario contextual del personaje;
- exactamente 10 comentarios de texto;
- accesos visuales a Historia, Equipo, Entrenamiento, Equipamiento, Gacha, Inventario, Historia narrativa, Eventos y Opciones;
- paneles internos sobre la misma escena;
- botón directo de continuar/jugar.

El personaje inicial usa un retrato procedural temporal basado en los datos visuales del catálogo. Es un placeholder propio y reemplazable por arte final sin tocar gameplay.

## Historia

Historia abre un panel de mapa conceptual con:

- Zona 01;
- mapas 01-10;
- ubicaciones bloqueadas;
- Demon King bloqueado;
- selector Normal / Hard / Hell.

Normal/Hard/Hell no duplican el mapa. El selector cambia el contexto de campaña.

La implementación actual conecta el botón de juego del mapa al partido existente. Los nodos individuales y las recompensas reales quedan para la integración posterior del contenido de campaña.

## Comentarios

Los comentarios viven en `scenes/hub.gd` durante el prototipo. El siguiente paso puede moverlos a datos externos cuando el sistema de diálogo crezca.

No se requiere voz. La arquitectura de audio futura puede asociar un `audio_id` a cada línea sin introducir clips de terceros.

## Responsive

El viewport actual del prototipo es 1280×720 con stretch de canvas. La composición utiliza controles escalables, pero el Hub requiere una pasada posterior de adaptación fina para resoluciones móviles estrechas.

## Reglas

- UI no decide resultados.
- Renderer no decide estadísticas.
- Comentarios no alteran gameplay.
- No se incorporan voces/arte externos sin licencia de redistribución.


## Pasada visual v1.1

La primera implementación artística utiliza:
- `assets/ui/hub_background.svg` para el ambiente del Hub;
- `assets/ui/starter_card_frame.svg` para separar el arte del personaje de su presentación;
- `assets/ui/campaign_map_background.svg` para el mapa de Historia;
- `assets/characters/generated/bw001.svg` como retrato vectorial inicial.

Se añadieron microanimaciones de hover y entrada/salida de paneles. Estas animaciones no tienen autoridad sobre gameplay.

El objetivo de esta pasada no es declarar arte final, sino establecer una base visual propia que pueda escalar hacia ilustraciones, expresiones, VFX y audio finales sin cambiar la arquitectura de personajes o campaña.
