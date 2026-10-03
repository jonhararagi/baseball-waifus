# BONE-011 - MONETIZACION / AUTORIDAD BACKEND

PRIORIDAD: P0
ESTADO: OPEN

El cliente abre invoice y el callback puede disparar acreditacion local de Scrap o boosts.

Eso no puede ser la autoridad economica definitiva en un producto comercial.

Objetivo: separar payment result de grant authority y asegurar idempotencia, receipt, doble callback y reconexion.

Cierre: paid single grant PASS, duplicate callback rejected PASS, forged client result rejected PASS, reconnect consistent PASS.