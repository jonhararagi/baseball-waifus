# BONE-006 - CONCURRENCIA ROSTER / INVENTARIO / RECOMPENSA

PRIORIDAD: P0
ESTADO: OPEN

Riesgo: una recompensa terminal y una mutacion de roster/inventario pueden competir y dejar snapshots incoherentes, duplicaciones o referencias invalidas.

Objetivo: version o revision de estado, validacion y aplicacion atomica/secuencial.

Casos: reward mientras cambia roster, venta/fusion simultanea, doble evento, dos tabs, cambio de dispositivo.

Cierre: concurrent reward PASS, roster mutation PASS, no duplicate PASS, no lost update PASS.