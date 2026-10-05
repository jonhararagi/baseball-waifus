# BONE-010 - TELEGRAM BRIDGE DUPLICATION

PRIORIDAD: P1
ESTADO: CLOSED

Existen TelegramBridge, TelegramNativeBridge e initializeTelegramNativeShell().

Objetivo: un contrato de plataforma para identity, CloudStorage, haptics, BackButton, theme, lifecycle e invoices.

Cierre: single platform contract PASS, Web fallback PASS, TMA fallback PASS, no duplicated authority PASS.

## BONE-010-CLOSE-001

La autoridad única de plataforma Telegram es `webapp/js/api.js::TelegramBridge`. App, haptics, shop, sharing e identidad consumen el bridge. `TelegramNativeBridge` e `initializeTelegramNativeShell()` fueron eliminados del flujo productivo y `webapp/js/telegramBridge.js` fue eliminado. CloudStorage conserva el fallback de BONE-002: navegador normal sin capacidad; runtime nativo con capacidad; métodos no soportados quedan como fallback del consumidor. Las superficies Telegram parciales son tolerantes.

BONE-002 permanece CLOSED. BONE-009 permanece CLOSED. BONE-004 permanece OPEN/BLOCKED.
