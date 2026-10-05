# BONE-009 — Authority Map & Multi-Runtime Contract

Checkpoint: BONE-009-CLOSE-001
Base: ed2daed8c3b544c7688cbafb2c6da7d48c014505
Scope: authority boundaries only. No gameplay/balance changes.

## Canonical product authority

PLAYER DATA → WEB GAMEPLAY AUTHORITY → COMBAT RESULT → DOMAIN EVENTS → REWARD AUTHORITY → PERSISTENCE → PRESENTATION

For the current Web/TMA product path, the executable authority seam is:
webapp/js/combat_runtime_controller.js
→ webapp/js/combat_session_authority.js
→ webapp/js/combat_core.js

Rewards leave gameplay through webapp/js/reward_pipeline.js, which requires a server reward-authority proof from webapp/js/reward_authority.js. A local combat result alone cannot grant a production reward.

## Runtime map

| Runtime | Entrypoint | Gameplay logic | Result resolution | Productive? | Authority? | Role |
|---|---|---|---|---|---|---|
| Web/TMA | webapp/index.html / app.js | CombatRuntimeController + CombatSessionAuthority + combat_core.js | Web Combat Session Authority | YES, current Web/TMA product | YES | Current product gameplay authority |
| Godot | scenes/main.tscn / scenes/main.gd | game/baseball/*, game/characters/*, related systems | Godot gameplay resolvers; RewardService resolves local prototype rewards | NO simultaneous Web production authority | NO for current Web/TMA product | Native/future product runtime and existing prototype |
| Kytos slice | webapp/js/kytos_combat_vertical_slice.js | Kytos boss vertical-slice rules | resolveKytosHit / timing helpers | NO | NO | Lab/demo vertical slice |
| Student 4v4 slice | webapp/js/student_4v4_orchestrator.js + battle state | Four role inputs and battle state | Student result → existing COMBAT_RESULT adapter | NO | NO | Lab/demo competitive slice |
| Top-level labs/ | Not present | N/A | N/A | NO | NO | No separate top-level lab runtime exists |

## Important distinction

Godot contains real gameplay and reward-resolution code because it is the adopted native/prototype runtime. That is NOT treated as a second simultaneous production authority for the current Web/TMA product. The Web reward pipeline and Godot reward services are separate runtime boundaries; neither imports/calls the other's authority path.

Kytos and Student 4v4 can create slice results, but they are not reward authorities. Their results do not cross the reward pipeline without the same server attestation required by the product path.

## Contract

1. Web authority: the current Web/TMA product resolves gameplay through the single Web combat authority chain.
2. Godot boundary: Godot remains an independent native/future runtime. It must not be introduced as a second resolver for the same Web/TMA production match.
3. Kytos boundary: Kytos is a boss-combat lab/demo. Its local result is not a production reward authority.
4. Student 4v4 boundary: Student 4v4 is a role-based lab/demo. Its adapter can describe a combat result but cannot grant production rewards.
5. Reward boundary: production reward application requires SERVER_COMBAT_ATTESTATION_V1; a runtime-local victory is insufficient.
6. No cross-runtime authority bridge: no Web module imports Godot code, and no Godot module invokes the Web reward pipeline.

## Evidence

The deterministic contract test webapp/js/bone009_multi_runtime_contract_test.mjs proves:
- Web runtime controller owns a CombatSessionAuthority instance.
- Kytos and Student 4v4 outputs are rejected by the reward pipeline without server authority proof.
- Kytos/Student slice modules are not connected to reward-authority modules.
- Godot remains a separate runtime tree and is not wired into the Web reward pipeline.

This document is the canonical BONE-009 authority map. It does not declare BONE-004 solved.
