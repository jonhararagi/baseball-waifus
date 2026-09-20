# Arquitectura móvil y plataformas embebidas

## Objetivo

Baseball Waifus debe sentirse como un juego móvil simple:

- lanzamiento automático;
- una acción principal: HIT;
- una acción contextual secundaria: STEAL;
- runners y defensa automáticos;
- texto reducido;
- botones grandes;
- vibración/haptics opcionales.

El mismo núcleo de BaseballGameState, BaseballSimulator, RunnerSystem y resolvers continúa siendo la autoridad.

## Entrada

La entrada se divide en:

- Desktop: Space, click izquierdo y S.
- Mobile: botones táctiles HIT y STEAL.
- Web embebido: botones táctiles del mismo renderer.
- Futuro gamepad: puede conectarse al mismo router.

MobileInputRouter normaliza las peticiones a swing_requested y steal_requested.

El gameplay no conoce si la acción vino de teclado, mouse o pantalla táctil.

## UX de partido

Flujo móvil:

1. el juego prepara el lanzamiento;
2. la pelota llega;
3. aparece la ventana TIMING;
4. el jugador toca HIT;
5. el juego anima el resultado;
6. las corredoras avanzan automáticamente;
7. STEAL solo aparece cuando existe corredora;
8. existe una pequeña ventana pre-pitch para decidir robo.

No se requiere un joystick ni movimiento manual del personaje.

## Android/iOS

El mismo proyecto Godot puede exportarse como aplicación nativa. Los botones táctiles viven dentro del juego y no dependen del host web.

La vibración corta usa Input.vibrate_handheld() cuando la plataforma lo permite.

## Telegram

La carpeta tools/web_host contiene una carcasa web.

La página detecta Telegram Mini Apps mediante window.Telegram.WebApp, llama a ready/expand y carga el build web de Godot en un iframe.

Godot recibe el host mediante query string:

?platform=telegram

Las peticiones de expansión/haptics se devuelven al host mediante postMessage.

Referencia de implementación:
https://github.com/TelegramMessenger/TGMiniAppsJsSDK

## Discord

El host utiliza el SDK oficial @discord/embedded-app-sdk.

Versión fijada en el proyecto: 2.5.0.

La Activity contiene el host web y este carga el build web de Godot.

Godot recibe:

?platform=discord

El SDK permanece solamente en tools/web_host. El gameplay no importa el SDK de Discord.

Referencia:
https://github.com/discord/embedded-app-sdk

## Local

El mismo tools/web_host funciona en modo local:

npm install
npm run dev

Sin Telegram ni Discord, PlatformBridge usa LOCAL.

El parámetro godot permite apuntar a otro build:

?godot=/godot/index.html

## Despliegue externo

Para Telegram o Discord se debe publicar el host web y el build web de Godot en un servidor accesible por HTTPS.

La configuración concreta de bot/Activity, dominios, client id y permisos se mantiene fuera del repositorio del juego.

## Regla

Telegram y Discord son hosts.

Godot es el juego.

Ninguna lógica crítica de béisbol debe depender del SDK de una plataforma.