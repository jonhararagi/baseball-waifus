export const ARC0_TEAM11_FIRST_TEST = Object.freeze({
  scene_id: "arc0-team11-first-test",
  participants: Object.freeze(["protagonist", "bw001", "bw003", "bw008", "azusa"]),
  choice: Object.freeze({
    prompt: "¿Qué hacemos?",
    options: Object.freeze([
      Object.freeze({ id: "A", label: "Seguir el plan de Aiko" }),
      Object.freeze({ id: "B", label: "Seguir el análisis de Nao" })
    ])
  }),
  intro: Object.freeze({
    scene_id: "arc0-team11-first-test-intro",
    dialogue_lines: Object.freeze([
      { speaker: "Azusa", character_id: "azusa", text: "Primera prueba. El objetivo está al otro lado de la zona de entrenamiento. No necesitan destruir nada: solo cruzar, tocar el marcador y volver juntas." },
      { speaker: "Aiko Hanamori", character_id: "bw001", text: "Entonces dejamos de hablar y vamos de frente. Si el recorrido es sencillo, perder tiempo buscando otra solución sería absurdo." },
      { speaker: "Miu Tachibana", character_id: "bw003", text: "O podemos usar el terreno. Hay una ruta lateral con menos obstáculos y un punto desde el que podemos cambiar de dirección." },
      { speaker: "Nao Fujimoto", character_id: "bw008", text: "La ruta lateral es más larga. Pero el marcador se activa cada treinta segundos. Hay una ventana que podemos aprovechar." },
      { speaker: "Aiko Hanamori", character_id: "bw001", text: "Treinta segundos. Perfecto. Corremos y terminamos antes de que vuelva a cerrarse." },
      { speaker: "Miu Tachibana", character_id: "bw003", text: "Eso supone que sabemos cuándo empieza la ventana. También podríamos esperar una señal y movernos en conjunto." },
      { speaker: "Nao Fujimoto", character_id: "bw008", text: "Si esperamos demasiado, perdemos la ventaja. Si corremos demasiado pronto, quedamos expuestas al cambio de posición del marcador." },
      { speaker: "Entrenador", character_id: "protagonist", text: "No necesito una respuesta perfecta. Necesito saber qué información vamos a usar para decidir." },
      { speaker: "Aiko Hanamori", character_id: "bw001", text: "Mi información es simple: si podemos hacerlo ahora, lo hacemos ahora." },
      { speaker: "Miu Tachibana", character_id: "bw003", text: "La mía también es simple: si una ruta nos da más opciones, deberíamos conservarlas." }
    ])
  }),
  branches: Object.freeze({
    A: Object.freeze({
      scene_id: "arc0-team11-first-test-result-a",
      dialogue_lines: Object.freeze([
        { speaker: "Entrenador", character_id: "protagonist", text: "Aiko, vas delante. Miu, abre el giro cuando te dé la señal. Nao, cubre el cambio y avisa si el marcador se mueve." },
        { speaker: "Aiko Hanamori", character_id: "bw001", text: "Por fin. ¡Ahora sí!" },
        { speaker: "Miu Tachibana", character_id: "bw003", text: "¡Se movió antes de lo previsto! ¡Giro ahora!" },
        { speaker: "Nao Fujimoto", character_id: "bw008", text: "La presión funcionó. Pero al acelerar perdimos la lectura del segundo punto." },
        { speaker: "Azusa", character_id: "azusa", text: "Resultado válido. Rápido, pero dejó una zona sin observar. La velocidad resolvió una parte y ocultó otra." }
      ])
    }),
    B: Object.freeze({
      scene_id: "arc0-team11-first-test-result-b",
      dialogue_lines: Object.freeze([
        { speaker: "Entrenador", character_id: "protagonist", text: "Nao, marca la ventana. Aiko, espera mi señal. Miu, conserva la ruta lateral por si el patrón cambia." },
        { speaker: "Nao Fujimoto", character_id: "bw008", text: "Ventana abierta en tres... dos... uno." },
        { speaker: "Miu Tachibana", character_id: "bw003", text: "¡Ruta lateral despejada! ¡Podemos entrar!" },
        { speaker: "Aiko Hanamori", character_id: "bw001", text: "Llegamos limpias. Pero esperar casi nos cuesta la oportunidad." },
        { speaker: "Azusa", character_id: "azusa", text: "Resultado válido. La lectura redujo el riesgo, pero el tiempo también es una variable. No confundan información con certeza." }
      ])
    })
  }),
  common: Object.freeze({
    scene_id: "arc0-team11-first-test-common",
    dialogue_lines: Object.freeze([
      { speaker: "Miu Tachibana", character_id: "bw003", text: "Entonces ninguna de las dos ideas era suficiente por sí sola." },
      { speaker: "Nao Fujimoto", character_id: "bw008", text: "Y la orden funcionó porque alguien tuvo que decidir cuándo dejar de analizar y empezar a actuar." },
      { speaker: "Aiko Hanamori", character_id: "bw001", text: "No estoy diciendo que me guste tu método. Pero sí que supiste cuándo usar el mío." },
      { speaker: "Entrenador", character_id: "protagonist", text: "Eso es lo que quiero aprender con ustedes. No ganar cada decisión. Tomar una juntos y aceptar lo que nos enseñe." }
    ])
  })
});