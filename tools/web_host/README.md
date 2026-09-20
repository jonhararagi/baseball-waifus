# Baseball Waifus Web Host

Esta aplicación es una carcasa pequeña para ejecutar el build Web de Godot dentro de un navegador normal, Telegram Mini Apps o Discord Activities.

## Estructura

- index.html: host y viewport móvil.
- src/main.ts: detección de plataforma, iframe de Godot y bridge.
- src/style.css: viewport sin scroll.
- package.json: Vite + SDK oficial de Discord.

El build Web exportado de Godot se coloca en:

tools/web_host/godot/

## Local

Desde esta carpeta:

npm install
npm run dev

Por defecto el host carga ./godot/index.html.

Se puede cambiar con:

/?godot=/otro/build/index.html

## Telegram

El host detecta window.Telegram.WebApp y añade ?platform=telegram al iframe de Godot.

## Discord

El host acepta ?platform=discord&client_id=... y utiliza el SDK oficial de Discord Embedded Apps.

## Limitación actual

El repositorio incluye la integración de plataforma y la UX táctil, pero no contiene credenciales, configuración privada de bots/Activities ni un build Web de Godot generado automáticamente.

Eso se mantiene fuera del código fuente.