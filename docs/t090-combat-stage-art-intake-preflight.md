# T090 · CombatStage Art Intake Preflight

## Propósito

T090 agrega un preflight no destructivo para los cuatro requests físicos de producción del CombatStage 2.5D:

- `AR-T084-STAGE-BG-FAR-01`
- `AR-T085-STAGE-BG-MID-01`
- `AR-T086-STAGE-GROUND-01`
- `AR-T087-STAGE-FOREGROUND-01`

El preflight inspecciona el estado del drop zone y del source antes de ejecutar:

`REQUESTED → GENERATED → IMPORTED → VALIDATED → APPROVED`

No realiza intake, no copia archivos y no cambia estados.

## Comando

Desde la raíz del repositorio:

```bash
python tools/art_studio/art_request.py preflight-stage
```

La salida conserva un orden canónico estable y muestra:

`request_id | state | reason | supported_sources=N`

## Estados

`READY` significa que existe exactamente un source compatible, el source cumple la request y sus dimensiones mínimas, la request sigue siendo válida y el target todavía no existe.

`MISSING` significa que el drop zone no existe o que existe pero no contiene sources compatibles. `.gitkeep` no cuenta como source.

`AMBIGUOUS` significa que hay más de un source con extensión soportada. El preflight no escoge ninguno.

`INVALID` significa que existe una condición que impediría un intake seguro, por ejemplo formato incompatible, imagen inválida, dimensiones insuficientes, request inválida o target en conflicto.

Un target existente nunca produce `READY`. El preflight informa el conflicto y no sobrescribe el archivo.

## Relación con el intake físico

El preflight es una inspección previa. No reemplaza `generate`, `ingest` ni `validate`, y no modifica `discover_source()` ni la máquina de estados existente.

La condición operativa buscada para intake es:

`READY → generate → ingest → validate`

La aprobación permanece separada y fuera del alcance de T090.

## Ejemplo

Con FAR presente sin source y las otras drop zones ausentes, la salida esperada es conceptualmente:

```text
AR-T084-STAGE-BG-FAR-01 | MISSING | no supported source files | supported_sources=0
AR-T085-STAGE-BG-MID-01 | MISSING | drop zone missing | supported_sources=0
AR-T086-STAGE-GROUND-01 | MISSING | drop zone missing | supported_sources=0
AR-T087-STAGE-FOREGROUND-01 | MISSING | drop zone missing | supported_sources=0
```

El texto exacto del motivo depende de si el drop zone existe, pero el estado y el conteo son deterministas.

## Regla de no mutación

El comando:

- no cambia `art_requests.json`;
- no crea archivos de archive;
- no copia sources;
- no crea targets de producción;
- no actualiza timestamps;
- no aprueba requests;
- no modifica runtime.

El fixture `AR-T083-FIXTURE-001` pertenece al circuito de pruebas y no se considera source de producción.

T090 deja preparado el circuito para que la disponibilidad física de cada PNG determine el siguiente paso sin inventar evidencia.
