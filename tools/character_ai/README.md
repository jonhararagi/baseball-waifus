# Character AI Bridge

Puente local entre el Character Creator de Baseball Waifus y una instalación local de ComfyUI.

## Arquitectura

El juego no contiene un modelo de IA ni depende de un checkpoint concreto.

El Character Creator genera una descripción estructurada del personaje. El bridge convierte ese perfil en un prompt y envía un workflow a ComfyUI. El resultado vuelve al editor como referencia visual.

Esto permite cambiar de checkpoint sin cambiar Godot ni los datos del roster.

## Backend

ComfyUI se usa como backend de generación porque expone una API local y trabaja con workflows reutilizables. El renderer procedural de Godot sigue siendo el fallback.

## Modelos

El proyecto no redistribuye checkpoints. El config acepta cualquier modelo compatible con el workflow.

Familias preparadas para comparación:
- Animagine XL
- Illustrious XL
- NoobAI-XL
- Pony/SDXL

No se asigna un ranking fijo dentro del código. El benchmark utiliza el mismo personaje, seed, resolución, prompt y negative prompt, y deja la evaluación visual para comprobar consistencia, anatomía, legibilidad y adecuación al estilo del juego.

## Benchmark

1. Instalar localmente los checkpoints que quieras comparar.
2. Editar `benchmark_models.json` con sus nombres exactos.
3. Ejecutar ComfyUI.
4. Ejecutar `python benchmark_models.py`.
5. Comparar los resultados de `generated/benchmark/`.

El benchmark no descarga modelos y no los redistribuye.

## Estilo de Baseball Waifus

- anime adulto;
- proporciones shonen redondeadas;
- cuerpos atléticos con formas suaves y algo más llenas;
- ojos expresivos;
- cel shading limpio;
- colores vivos;
- siluetas legibles;
- uniformes deportivos;
- fanservice adulto moderado.

Se evita chibi, anatomía infantil, fotorealismo y la imitación directa de una franquicia.

## Ejecución

Ejecutar el bridge:

`python art_server.py`

Endpoint local:

`POST http://127.0.0.1:8766/generate`

## Licencias

Cada checkpoint y LoRA debe verificarse individualmente para uso comercial y redistribución. El repositorio solo contiene código y metadatos propios.