import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CombatRuntimeController } from "./combat_runtime_controller.js";
import { CombatSessionAuthority } from "./combat_session_authority.js";
import { createCombatState, resolveKytosHit, KYTOS_PHASE } from "./kytos_combat_vertical_slice.js";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4BufferInput } from "./student_4v4_buffer_input.js";
import { Student4v4HealerInput } from "./student_4v4_healer_input.js";
import { Student4v4DebufferInput } from "./student_4v4_debuffer_input.js";
import { Student4v4BatterInput } from "./student_4v4_batter_input.js";
import { student4v4ResultToCombatResult } from "./student_4v4_combat_adapter.js";
import { applyCombatRewardPipeline } from "./reward_pipeline.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.join(here, name), "utf8");

const runtime = new CombatRuntimeController();
assert.ok(runtime.authority instanceof CombatSessionAuthority, "Web runtime must own CombatSessionAuthority");
assert.equal(typeof runtime.startSession, "function");
assert.equal(typeof runtime.resolveTacticalTurn, "function");
assert.equal(typeof runtime.resolveClimaxTurn, "function");
console.log("AUTHORITY_MAP_WEB = PASS_STATIC");

const rewardAuthoritySource = read("reward_authority.js");
const rewardPipelineSource = read("reward_pipeline.js");
const kytosSource = read("kytos_combat_vertical_slice.js");
const studentSource = read("student_4v4_combat_adapter.js");

assert.match(rewardPipelineSource, /assertRewardAuthorityMatchesCombatResult/);
assert.match(rewardPipelineSource, /from "\.\/reward_authority\.js"/);
assert.doesNotMatch(kytosSource, /reward_pipeline|reward_authority|applyCombatRewardPipeline/);
assert.doesNotMatch(studentSource, /reward_pipeline|reward_authority|applyCombatRewardPipeline/);
assert.match(rewardAuthoritySource, /SERVER_COMBAT_ATTESTATION_V1/);
console.log("LABS_NON_AUTHORITATIVE = PASS_STATIC");

const kytosBase = createCombatState({ kytosMaxHp: 10 });
const kytosVictory = resolveKytosHit(
  { ...kytosBase, batter: { ...kytosBase.batter, storedEnergy: 100 } },
  { timingAccuracy: 1 }
);
assert.equal(kytosVictory.phase, KYTOS_PHASE.VICTORY);

const battle = new Student4v4BattleState({ seed: "BONE-009-CONTRACT", battleId: "bone009-student" });
const inputs = {
  BUFFER: new Student4v4BufferInput({ battle, clock: () => 1000 }),
  HEALER: new Student4v4HealerInput({ battle, clock: () => 1000 }),
  DEBUFFER: new Student4v4DebufferInput({ battle, clock: () => 1000 }),
  BATTER: new Student4v4BatterInput({ battle, clock: () => 1000 })
};
const submitCurrent = () => {
  const state = battle.getCurrentRoleGame().getState();
  switch (battle.currentPhase) {
    case "BUFFER":
      return inputs.BUFFER.submitLane(state.current_note.lane, state.current_note.target_ms);
    case "HEALER":
      return inputs.HEALER.submitThreat({
        threatId: state.current_threat.id,
        zone: state.current_threat.zone,
        timestampMs: state.current_threat.target_ms
      });
    case "DEBUFFER":
      return inputs.DEBUFFER.submitTarget({
        targetId: state.current_target.id,
        targetType: state.current_target.type,
        position: { x: state.current_target.x, y: state.current_target.y },
        timestampMs: state.current_target.target_ms
      });
    case "BATTER":
      return inputs.BATTER.submitSwing({
        opportunityId: state.current_opportunity.id,
        timestampMs: state.current_opportunity.target_ms
      });
    default:
      throw new Error("UNEXPECTED_PHASE:" + battle.currentPhase);
  }
};
while (battle.currentPhase !== "RESOLUTION") {
  const active = inputs[battle.currentPhase];
  active.start();
  while (battle.currentPhase === active.battle.currentPhase) submitCurrent();
}
const resolved = battle.resolve();
const studentCombatResult = student4v4ResultToCombatResult(resolved.student4v4Result);

assert.throws(
  () => applyCombatRewardPipeline({ combatResult: studentCombatResult, authority: {}, persistenceAdapter: {} }),
  /REWARD_AUTHORITY|proof/i
);
assert.throws(
  () => applyCombatRewardPipeline({
    combatResult: {
      type: "COMBAT_RESULT",
      battleId: "battle:bone009-kytos",
      playerId: "bone009-player",
      matchId: "bone009-kytos",
      turnId: "turn-1",
      outcome: "VICTORY",
      result: "KYTOS_DEFEATED",
      source: "kytos-lab"
    },
    authority: {},
    persistenceAdapter: {}
  }),
  /REWARD_AUTHORITY|proof/i
);
console.log("WEB/GODOT_CONTRACT = PASS_STATIC");
console.log("BONE-009 MULTI-RUNTIME CONTRACT = PASS_STATIC");
