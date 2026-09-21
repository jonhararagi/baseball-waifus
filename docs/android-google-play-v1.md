# Android / Google Play v1

## Objetivo

Preparar Baseball Waifus para distribución como aplicación Android mediante Godot 4.x sin convertir el núcleo en un servicio online.

El proyecto debe poder jugarse sin conexión. La conexión solo puede utilizarse por capas opcionales de plataforma, como publicidad recompensada, si se incorpora un proveedor posteriormente.

## Arquitectura de exportación

Objetivo de aplicación:

- Nombre: Baseball Waifus
- Package ID previsto: `com.jonhararagi.baseballwaifus`
- Motor: Godot 4.x
- Renderer móvil: GL Compatibility, ya configurado en `project.godot`
- Distribución final recomendada: Android App Bundle (AAB) para Google Play
- APK: útil para pruebas/sideloading y QA interno; no debe confundirse con el paquete de publicación principal de Play.

No se añade todavía una firma de producción ni una clave privada al repositorio.

## Seguridad de firma

La clave de firma de producción debe existir fuera de GitHub.

Nunca subir:

- keystore;
- passwords;
- tokens;
- certificados privados;
- credenciales de publicidad;
- archivos de configuración que contengan secretos.

Para CI futuro, los secretos deben inyectarse desde el entorno seguro del proveedor de CI, nunca desde el código.

## Android básico

Antes de generar una build de release se debe configurar en Godot:

1. Android SDK/Build Tools compatibles con la versión de Godot usada.
2. JDK compatible con esa versión de Godot.
3. Export Templates de Android.
4. Package ID estable.
5. Version name y version code.
6. Keystore de release.
7. Iconos y recursos de launcher.
8. Orientación y resolución móvil.
9. Permisos mínimos.

La aplicación no debe solicitar permisos que no sean necesarios para una función real del juego.

## Google Play

Las reglas exactas de Play Console, incluyendo API objetivo mínima, requisitos de SDK, formularios y políticas de anuncios, deben verificarse en la documentación oficial inmediatamente antes de cada publicación. Esos valores cambian con el tiempo y no deben congelarse como una constante de gameplay.

Checklist de publicación:

- cuenta de desarrollador verificada;
- App Content completado;
- Data Safety completado de acuerdo con los SDK realmente incluidos;
- política de privacidad publicada y accesible si la configuración/SDK utilizado la requiere;
- clasificación de contenido completada;
- declaración de publicidad cuando corresponda;
- target API vigente para la fecha de publicación;
- AAB firmado correctamente;
- version code incrementado;
- pruebas internas cerradas antes de producción;
- dispositivo físico Android probado;
- comportamiento offline comprobado;
- restauración de partidas comprobada;
- anuncios de prueba comprobados antes de anuncios reales.

## Publicidad recompensada

La publicidad no debe instalarse directamente en el gameplay.

El flujo previsto es:

```
Android Ad Adapter
      ↓
RewardedAdService
      ↓
RewardedAdPolicy
      ↓
RewardedAdUsageStore
      ↓
Reward Transaction
```

El proveedor de anuncios puede informar disponibilidad y finalización, pero no puede decidir:

- cantidad de energía;
- cantidad de materiales;
- estadísticas;
- recompensas de gacha;
- resultados de partidos.

La recompensa se define localmente por las reglas del juego.

## Consentimiento y privacidad

Si se integra un SDK publicitario real, se debe revisar exactamente qué datos recoge ese SDK y completar las declaraciones correspondientes de Google Play.

Cuando la jurisdicción requiera consentimiento para publicidad personalizada, debe implementarse mediante el mecanismo adecuado del proveedor antes de solicitar anuncios personalizados.

El juego debe ofrecer una ruta funcional para continuar jugando aunque el jugador no otorgue consentimiento para publicidad personalizada, cuando corresponda.

No utilizar publicidad dirigida a menores. Todos los personajes del juego son adultos, pero la clasificación y configuración de audiencia de la aplicación deben seguir las reglas reales de Play Console.

## Pruebas

No declarar una build Android como probada hasta disponer de un entorno Godot + Android SDK y ejecutar realmente:

- instalación;
- primer arranque;
- cambio de orientación si está permitido;
- guardado/carga;
- cierre forzado;
- reanudación;
- pérdida de conectividad;
- ausencia de proveedor de anuncios;
- anuncio completado;
- anuncio cerrado;
- límite 10/10;
- cambio de día;
- recompensas persistentes;
- actualización desde una versión anterior.

## Estado

**Preparación implementada:** arquitectura Android documentada, separación del proveedor publicitario y reglas de seguridad definidas.

**Pendiente:** exportación física Android, firma release, configuración final de Play Console y proveedor de anuncios.

**Nota de verificación:** este documento no fija números cambiantes de Google Play. Deben verificarse en la documentación oficial de Google Play antes de cada release.
