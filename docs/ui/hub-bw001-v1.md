# Hub de presentación y personaje inicial v1

**Estado:** Implementado para la unidad bw001.
**Fecha:** 2026-09-21
**Alcance:** primera pieza visual del Hub de Baseball Waifus.

## Objetivo

El Hub debe sentirse como una pantalla de videojuego anime deportivo y no como un panel administrativo. La primera implementación validable se limita deliberadamente a la personaje inicial bw001, Aiko Hanamori.

## Unidad cerrada

bw001 conserva el canon del catálogo existente:

- nombre: Aiko Hanamori
- rareza: R
- elemento: Fire
- posición: 3B
- especialización: Power
- preset corporal: power
- cabello: marrón cálido
- rostro: round
- estilo de uniforme: jacket
- acento: naranja/rojo

La capa visual no cambia ninguna estadística de PlayerData.

## Presentación

La pantalla Hub incorpora:

- identidad de Baseball Waifus y temporada;
- energía y monedas desde PlayerProgressStore;
- personaje inicial persistente mediante CharacterRosterStore;
- avatar procedural existente en pose MENU_IDLE;
- retrato vectorial original de bw001;
- tarjeta de personaje con rareza, nivel, elemento, posición, Power y estadísticas secundarias;
- botón para iniciar el partido existente;
- comentario contextual de bw001;
- diez líneas de comentario almacenadas en datos, sin audio obligatorio;
- transición de entrada y microanimación de foco.

## Assets

Los assets de esta fase son originales del repositorio:

- assets/ui/characters/bw001_portrait.svg
- assets/ui/icons/icon_fire.svg
- assets/ui/icons/icon_power.svg

No se incorpora arte externo.

## Separación técnica

El flujo queda:

CharacterArchetypeCatalog -> CharacterRosterStore -> PlayerData

y, de forma independiente:

CharacterArchetypeCatalog -> AvatarRosterService -> AvatarProfile -> AvatarRendererFactory

La tarjeta consume datos de presentación y datos de progreso ya existentes. No calcula resultados deportivos ni modifica probabilidades.

## Rendimiento

La pieza utiliza:

- un único retrato SVG;
- un único avatar procedural visible;
- controles Control ligeros;
- tweens cortos sin procesos adicionales permanentes;
- sin animación por frame propia de la tarjeta.

El avatar procedural ya posee su propio ciclo de actualización. No se agrega otra simulación visual.

## Alcance de la siguiente validación

La validación real pendiente debe realizarse abriendo res://scenes/hub.tscn en Godot y comprobando:

1. resolución 1280x720;
2. recorte del retrato;
3. escala y posición del avatar;
4. comportamiento de la tarjeta;
5. transición de entrada;
6. lectura en pantalla pequeña;
7. respuesta de botones;
8. consumo de CPU durante reposo.

No se registra esa validación como realizada hasta ejecutar Godot.
