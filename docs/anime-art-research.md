# Investigación de arte anime y rigging

## Arquitectura elegida

Se evaluó separar tres responsabilidades:

1. generación de referencias visuales;
2. cuerpo/runtime del juego;
3. rigging 2D/3D final.

Decisión:

- ComfyUI: backend opcional para concept art local.
- AvatarProfile + AnimeAvatar2D: backend estable para gameplay y pruebas.
- Inochi2D: candidato futuro para rigging 2D de alta calidad.
- VRM/Three.js: candidato futuro para pipeline 3D.

## Familias de modelos candidatas

| Familia | Uso previsto | Nota |
|---|---|---|
| Animagine XL | personajes anime y hojas de diseño | candidato conocido del ecosistema SDXL; comprobar checkpoint/licencia concreta |
| Illustrious XL | anime detallado y variaciones de personaje | candidato para comparar anatomía, cabello y vestuario |
| NoobAI-XL | anime moderno y gran control mediante ecosistema de prompts/LoRA | candidato para pruebas A/B |
| Pony/SDXL | personajes estilizados con amplio ecosistema de LoRA | útil como prueba secundaria; comprobar licencia y términos de cada recurso |

Esta tabla no pretende ser un ranking actual de popularidad o calidad. El rendimiento de los modelos y sus licencias cambian, y la selección final debe hacerse con los checkpoints concretos instalados.

## Estilo de Baseball Waifus

El objetivo visual se define por características, no por copiar una franquicia:

- anime adulto;
- proporciones shonen heroicas;
- anatomía redondeada y algo más llena;
- cuerpos atléticos;
- ojos expresivos;
- cel shading limpio;
- colores vivos;
- siluetas claras;
- fanservice adulto moderado;
- uniformes deportivos;
- lectura de videojuego de colección.

Se excluyen deliberadamente:
- chibi o super-deformed;
- anatomía infantil;
- fotorealismo;
- estética sombría/horror como lenguaje dominante;
- imitación directa de la identidad visual de una obra concreta.

## Herramientas abiertas investigadas

- ComfyUI: motor nodal con API local y workflows reutilizables.
- Inochi Creator: editor open source para rigs Inochi2D.
- Inochi2D: runtime de deformación 2D y binding para Godot mediante GDExtension.

Fuentes GitHub consultadas:
- https://github.com/Comfy-Org/ComfyUI
- https://github.com/Inochi2D/inochi-creator
- https://github.com/Inochi2D/inochi2d

## Regla de licencias

El repositorio no redistribuye checkpoints, LoRA, modelos VRM ni arte de terceros. Antes de incorporar cualquier recurso se debe comprobar la licencia exacta del archivo utilizado y registrar autor, versión, uso comercial y redistribución.