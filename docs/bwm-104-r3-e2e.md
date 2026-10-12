# BWM-104-R3 · Full WebApp 4v4 E2E

## Scope and lineage

This test is based on BWM-105's real WebApp 4v4 implementation and preserves the PR dependency chain: BWM-104 branch `bwm-104-full-webapp-e2e` → PR #52 (`bwm-105-real-4v4-webapp`) → PR #51 (`bwm-099-normal-combat-authority-handoff`). The test does not merge either dependency and does not change `main`.

## Execution contract

The shared CDP probe is run against `webapp/index.html` with `?qa=bwm104`, using a fresh controlled browser storage profile. One generated `sessionId` is recorded at the evidence root and in action, Timing Ring, pre-combat Player Meta, post-result Player Meta, and post-reload persistence records. Evidence is written as `bwm104-full-webapp-4v4-e2e-evidence.json` plus browser screenshots and console output in artifact `bwm-104-full-webapp-4v4-evidence`.

The execution must demonstrate eight unique authoritative combatants (4+4), rendered actors sourced from those units, real canvas selection, five tactical turns in order, a physical CDP Timing Ring input correlated to the live window and actual resolver, legitimate terminal outcome and UI result, return to HOME, real document reload, restored persistent Player Meta, and no local SCRAP/ledger reward or temporary unlock persistence. Failure evidence is retained with status `FAIL_BROWSER_4V4_REAL`; it must never be reported as a pass.

## Evidence identity

The artifact JSON records the task ID, run ID/attempt, branch commit SHA through `GITHUB_SHA`, and the generated session ID. GitHub Actions may test a synthetic merge SHA for PR-triggered executions; reports must identify both that SHA and the branch HEAD separately. A green workflow alone is not acceptance evidence.

## Non-goals

No combat balance, damage, Timing Ring windows, gacha, pity, inventory authority, cryptography, payment, or backend deployment changes are authorized. T097 and the BWM-105 integration remain independent regression evidence, not substitutes for this one correlated BWM-104 run.
