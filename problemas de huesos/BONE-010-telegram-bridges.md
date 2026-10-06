# BONE-010 - TELEGRAM BRIDGE DUPLICATION

PRIORIDAD: P1
ESTADO: CLOSED

Existen TelegramBridge, TelegramNativeBridge e initializeTelegramNativeShell().

Objetivo: un contrato de plataforma para identity, CloudStorage, haptics, BackButton, theme, lifecycle e invoices.

Cierre: single platform contract PASS, Web fallback PASS, TMA fallback PASS, no duplicated authority PASS.

## BONE-010-CLOSE-001

La autoridad única de plataforma Telegram es `webapp/js/api.js::TelegramBridge`. App, haptics, shop, sharing e identidad consumen el bridge. `TelegramNativeBridge` e `initializeTelegramNativeShell()` fueron eliminados del flujo productivo y `webapp/js/telegramBridge.js` fue eliminado. CloudStorage conserva el fallback de BONE-002: navegador normal sin capacidad; runtime nativo con capacidad; métodos no soportados quedan como fallback del consumidor. Las superficies Telegram parciales son tolerantes.

BONE-002 permanece CLOSED. BONE-009 permanece CLOSED. BONE-004 permanece OPEN/BLOCKED.

## BONE-010-CLOSE-001 DIAGNOSTIC

El contrato estático y la suite Gacha/Player Meta están en verde. La validación Chromium del workflow Telegram Mini App sigue en ejecución en el job 111765510265, actualmente detenida en BONE-001 Native Chromium Validation; por ello no se declara BONE-010 CLOSED ni se inventa browser PASS.

Este diagnóstico quedó superado por el checkpoint final BONE-010-CLOSE-002. La evidencia Chromium posterior corresponde al `main` actual y permite cerrar formalmente este Bone.

## BONE-010-CLOSE-002 · FINAL

Fecha:
2026-10-06

MAIN:
a87764930754accf2e7bae045f92ad385c997cba

WORKFLOW:
37405698991

JOB:
112082662374

RESULT:
PASS

BONE-001 Chromium:
PASS_REAL

BONE-002 Chromium:
PASS_REAL

BONE-003 Chromium:
PASS_REAL

BONE-004 Chromium:
PASS_REAL

TelegramBridge:
PASS_STATIC

Single platform bridge:
PASS_STATIC

Duplicated bridge authority:
ABSENT / PASS_STATIC

Browser/runtime regression:
PASS_REAL

Service Worker stale bridge reference:
REMOVED

BONE-002:
CLOSED / unchanged

BONE-009:
CLOSED / unchanged

BONE-004:
OPEN / BLOCKED / unchanged

BONE-011:
OPEN / unchanged

CLOSURE BASIS:

The static platform contract confirms `webapp/js/api.js::TelegramBridge` as the single Telegram platform bridge, covering identity, start_param, theme, haptics, BackButton, CloudStorage fallback, browser-like fallback, Telegram sharing and Telegram links.

The Chromium workflow `37405698991`, job `112082662374`, checked out exactly `a87764930754accf2e7bae045f92ad385c997cba` and completed successfully. Its BONE-010 static checks passed and its browser/runtime regression chain passed for BONE-001 through BONE-004.

The current `main` search contains no references to `TelegramNativeBridge`, `initializeTelegramNativeShell`, or `telegramBridge.js`.

The repair commit `a87764930754accf2e7bae045f92ad385c997cba` removed the stale `./js/telegramBridge.js` Service Worker precache reference and added deterministic CDP evaluation timeout handling. This final documentation checkpoint does not modify runtime code.

BONE-010 is CLOSED on the basis of existing reproducible evidence. No new browser probe or workflow execution is part of this checkpoint.
