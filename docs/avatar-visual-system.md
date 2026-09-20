# Avatar Visual System

El personaje visual está dividido en capas para que el mismo cuerpo pueda tener muchas jugadoras, uniformes y equipamientos.

## Capas

1. Cuerpo y proporciones.
2. Uniforme base.
3. Chaleco.
4. Falda.
5. Guantes.
6. Calzado.
7. Cabello.
8. Rostro.
9. Gorra/accesorio.
10. Bate y objetos de acción.

AvatarProfile contiene apariencia y AvatarEquipment contiene piezas equipables. AnimeAvatar2D es actualmente el renderer procedural, pero la interfaz queda preparada para un renderer artístico posterior.

## Animaciones

AvatarMotionController permite acciones temporales:

- Bat
- Pitch
- Throw
- Catch
- Steal
- Slide
- Out
- Celebrate
- Defeat

Cada acción puede volver automáticamente a Idle, lo que facilita conectarlas a eventos del partido.

## Regla

El equipamiento visual no debe modificar directamente estadísticas desde el renderer. El gameplay seguirá calculando sus bonificaciones en los sistemas de equipo/probabilidad. El avatar solo representa el resultado visual.

## Integración con Character Creator

El editor de personajes expone actualmente las seis ranuras visuales de `AvatarEquipment` y el preset corporal `shonen_soft` para probar siluetas redondeadas de anime deportivo sin depender de un asset definitivo.

## Verificación de modelos

La selección del checkpoint no se considera cerrada hasta ejecutar `benchmark_models.py` con las opciones locales. La comparación debe usar el mismo seed, prompt, resolución y negative prompt.
