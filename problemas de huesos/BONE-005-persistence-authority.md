# BONE-005 - PERSISTENCIA DUAL

PRIORIDAD: P0
ESTADO: OPEN

Existen PlayerMetaAuthority, SaveSystem/localStorage, legacy Gacha state y Telegram CloudStorage.

Objetivo: una jerarquia de autoridad inequívoca, migracion determinista y proteccion contra overwrite con estado antiguo.

Cierre: new device PASS, Cloud to local rehydration PASS, stale local cannot overwrite PASS, migration PASS.