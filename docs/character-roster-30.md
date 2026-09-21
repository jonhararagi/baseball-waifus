# Roster base de 30 personajes

El proyecto fija una primera biblioteca de 30 plantillas adultas reutilizables. La identidad base de cada plantilla queda separada de sus variaciones visuales.

Cada plantilla conserva:
- rareza;
- elemento;
- posición;
- especialización;
- potencial;
- estadísticas;
- rostro;
- tono de piel;
- uniforme;
- color de acento;
- ojos;
- silueta corporal base.

Las únicas variaciones permitidas por el sistema de variantes son:
1. color de cabello;
2. peinado;
3. escala corporal global entre 0.94 y 1.06.

Esto permite producir múltiples personajes visuales sin crear una nueva estructura de gameplay para cada variante.

## Distribución inicial

- 2 UR
- 10 SSR
- 14 SR
- 4 R

## Regla de diseño

Los 30 personajes son adultos y el arte debe mantener:
- anatomía adulta;
- proporciones deportivas;
- silueta legible;
- variedad corporal;
- identidad anime original;
- uniforme de béisbol;
- ausencia de rasgos infantiles/chibi.

## Fuente de datos

La fuente técnica de verdad es:

game/characters/character_archetypes.json

El factory:

game/characters/character_archetype_catalog.gd

genera PlayerData y AvatarProfile sin mezclar gameplay y presentación.

## Uso de variantes

Ejemplo conceptual:

CharacterArchetypeCatalog.create_avatar("bw014", {"hair_color":"#d95f7b","hair_style":"ponytail","body_scale":1.03})

La variante no puede cambiar elemento, posición, estadísticas, rostro, uniforme ni equipamiento.
