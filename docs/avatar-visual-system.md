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