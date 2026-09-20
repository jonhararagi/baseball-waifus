# Character AI Bridge

Puente local entre el Character Creator de Baseball Waifus y una instalación local de ComfyUI.

## Arquitectura

El juego no contiene un modelo de IA ni depende de un checkpoint concreto.

El Character Creator genera una descripción estructurada del personaje. El bridge convierte ese perfil en un prompt y envía un workflow a ComfyUI. El resultado vuelve al editor como referencia visual.

Esto permite cambiar de checkpoint sin cambiar Godot ni los datos del roster.

## Backend

ComfyUI se usa como backend de generación porque expone una API local y trabaja con workflows reutilizables. El renderer procedural de Godot sigue siendo el fallback.

## Modelos

El proyecto no redistribuye checkpoints. El config acepta cualquier modelo compatible con el workflow. Puede utilizar familias anime XL habituales, siempre que el usuario tenga una copia legal y compruebe la licencia concreta del checkpoint o LoRA.

## Preset visual del juego

- anatomía anime adulta;
- proporciones shonen heroicas;
- cuerpos atléticos con formas suaves y algo más llenas;
- ojos expresivos;
- cel shading limpio;
- colores vivos;
- siluetas legibles;
- uniformes deportivos;
- fanservice adulto moderado;
- diseño de personaje de videojuego.

Se evita deliberadamente chibi, anatomía infantil y copiar la identidad visual de una franquicia concreta.

## Ejecución

1. Ejecutar ComfyUI localmente.
2. Instalar el checkpoint elegido en ComfyUI.
3. Verificar manualmente el workflow.
4. Ejecutar el bridge de Baseball Waifus.
5. Ejecutar el Character Creator.

Endpoint local: POST http://127.0.0.1:8766/generate

## Estado

Implementado como módulo opcional. No sustituye el renderer procedural y no es necesario para jugar.