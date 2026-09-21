# Economy v1

## Authority

PlayerProgressStore owns energy and material resources. CampaignAttemptStore owns campaign attempt counters. CampaignEntryService is the local transaction gate that consumes both without mixing rewards into entry logic.

## Match costs

| Activity | Player Energy | Attempts |
|---|---:|---:|
| Normal | 10 | 10 per map/cycle |
| Hard | 15 | 10 per map/cycle |
| Hell | 15 | 10 per map/cycle |
| Demon King | 25 | 3 per boss/cycle |

These are the current baseline values from the master design. They are explicit parameters, not hidden scaling.

## Energy regeneration

Player and persisted character energy regenerate at +1 every 6 minutes while below 100. Regeneration is calculated from Unix timestamps, so closing the game does not discard elapsed recovery time.

Energy does not accumulate above 100.

## Atomic entry

Before a match begins:

1. validate activity type;
2. validate the map/boss attempt limit;
3. snapshot progression;
4. consume player energy;
5. persist the attempt;
6. rollback energy if attempt persistence fails.

Rewards are deliberately outside this transaction. A failed match entry cannot spend an attempt and then secretly compensate through a reward table.

## Campaign cycle

Attempt counters are keyed by activity ID and a content cycle identifier. A content update can explicitly start a new cycle. The attempt store does not silently reset every day because the master design defined these limits as per cycle, not as a hidden daily reset.

## Contingencies

- Missing save → defaults.
- Corrupt/incompatible progression → sanitized defaults.
- Full energy → no overflow.
- Missing character energy entry → 100 initial energy.
- Insufficient energy → match cannot begin.
- Attempt limit reached → match cannot begin.
- Attempt persistence failure → energy rollback.
- Reward failure → must not alter the entry ledger.
- Game closed during regeneration → elapsed time is recovered from timestamps.
- Clock moves backwards → no negative regeneration is granted.

## Rewarded ads

Rewarded ads may restore small amounts of energy/materials through the existing provider-neutral claim service. They do not reset campaign attempts and cannot grant SSR/UR characters or equipment directly.

## Balance warning

The current costs are implementation baselines, not a claim that the final pacing is balanced. They must be measured with deterministic simulations and player-flow tests before release.
