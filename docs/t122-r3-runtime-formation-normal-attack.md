# T122-R3 · Runtime Formation Normal Attack

STATUS: T122-R3V2 PARTIAL

T122-R3V2 validated the real presentation entry path in `CombatRenderer` and identified the runtime attacker source as `CombatPresentationDirector.startFromCombatResult()` normalized `result.attackerId`, with fallback to the existing selected stage actor.

Minimal presentation-only correction:
- Normal `ATTACKER_FOCUS`, `ACTION`, `COMBAT_RETURN`, and `COMPLETE` now resolve the actor from the real presentation result attacker ID instead of assuming `selectedActorId`.
- Added minimal DOM observability for attacker, focused actor, action actor, and return actor IDs.
- No combat resolver, result mapping, reward, persistence, economy, Timing Ring, victory/defeat, or T118-R changes.

T122-R3V2:
- STATUS: PARTIAL pending executable CI/browser evidence; browser endpoint returned ERR_TUNNEL_CONNECTION_FAILED
- HEAD BEFORE: 22748222c9df1a5d638bfcc6aac23d0e59ebafcb
- HEAD AFTER: cc86677e701eb511eb9936941c01d572f217e6d2
- REAL COMBAT ENTRY: PASS by source inspection
- ATTACKER SOURCE: real `CombatPresentationDirector` presentation result, `attackerId`
- ATTACKER ID: runtime `result.attackerId`, fallback existing selected actor
- FOCUSED ACTOR: runtime actor resolved from attacker ID
- ACTION ACTOR: same runtime actor
- OTHER ACTORS: no presentation state mutation by the normal handler
- RETURN: runtime attacker actor
- FORMATION RESTORED: implementation path resets attacker on COMPLETE
- TESTS: executable CI evidence pending
- BROWSER: NOT RUN / public site tunnel failure
- T118-R = BLOCKED / UNCHANGED

The prior deterministic T122-R3 fixture remains a contract test and is not treated as real-runtime closure evidence.
