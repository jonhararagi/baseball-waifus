# Rewarded Ads v1

## Objetivo

Baseball Waifus puede ofrecer anuncios de vídeo recompensados como una fuente opcional de recursos. El anuncio nunca forma parte del cálculo del partido ni de la probabilidad de gacha.

El jugador debe elegir explícitamente ver el anuncio. Cerrar, omitir, fallar o no completar el anuncio no concede recompensa.

## Categorías y límite

Cada categoría dispone de **10 usos diarios independientes**:

| Categoría | Recompensa prototipo | Límite diario |
|---|---:|---:|
| Player Energy | +20 energía global | 10 |
| Materials | +1 paquete de materiales | 10 |
| Character Energy | +20 energía de personaje | 10 |

Los valores son de balance inicial y pueden cambiar mediante revisión registrada.

El límite se almacena localmente por fecha UTC. El cambio de día reinicia únicamente los contadores de anuncios, no el inventario.

## Arquitectura

`RewardedAdService` es una interfaz/proveedor neutral.

Flujo:

```
UI
 ↓
RewardedAdService
 ↓
Proveedor Android opcional
 ↓
completed
 ↓
RewardedAdPolicy
 ↓
UsageStore
 ↓
Reward transaction
 ↓
Inventario / energía
```

El núcleo no contiene SDK de publicidad, llamadas de red ni lógica dependiente de un proveedor.

En esta fase el proveedor está deliberadamente ausente. Esto mantiene el juego completamente jugable offline y respeta la decisión arquitectónica de no introducir APIs externas en el núcleo.

La integración comercial futura debe vivir en un adaptador Android aislado. El adaptador no puede calcular recompensas ni modificar estadísticas.

## Reglas anti-error

- No recompensar una solicitud simplemente porque se inició.
- No recompensar al cerrar el anuncio.
- No permitir más de 10 recompensas por categoría y día.
- No aceptar categorías desconocidas.
- No permitir que un proveedor decida la cantidad de recompensa.
- No permitir que un anuncio altere probabilidades de partido, gacha o drops.
- Si el proveedor falla, el jugador conserva su progreso y puede continuar jugando.
- Si el anuncio no está disponible, la acción debe aparecer deshabilitada o informar claramente que no está disponible.
- Nunca bloquear el progreso principal esperando un anuncio.

## Reglas de experiencia

Los anuncios deben ser voluntarios y presentarse como intercambio claro:

**Ver anuncio → recibir recompensa indicada.**

No se deben utilizar mensajes que engañen al jugador sobre el cierre del anuncio, las recompensas o la disponibilidad.

La recompensa debe mostrarse antes de iniciar el anuncio.

## Persistencia

`rewarded_ad_usage_store.gd` guarda:

- versión del formato;
- fecha UTC;
- usos por categoría.

No se guarda información publicitaria personal.

## Monetización

La publicidad es una ayuda opcional para mantener el juego, no el sustituto del bucle de béisbol.

No se debe diseñar el balance para obligar al jugador a consumir anuncios.

La economía debe seguir siendo jugable sin publicidad.

## Estado

**Implementado:** contrato, política de recompensas y contador diario offline.

**Pendiente:** integración con un proveedor de anuncios Android compatible con la política vigente de Google Play, configuración de consentimiento/privacidad, pruebas con anuncios de prueba y validación en dispositivos físicos.

