import { STUDENT_4V4_RESULT_TYPE } from "./student_4v4_orchestrator.js";

export function buildStudent4v4PresentationModel(result) {
  if (!result || result.type !== STUDENT_4V4_RESULT_TYPE) {
    throw new TypeError("buildStudent4v4PresentationModel requires a STUDENT_4V4_RESULT");
  }

  return Object.freeze({
    title: "STUDENT 4V4",
    roles: Object.freeze([
      Object.freeze({ role: "BUFFER", contribution: result.energyContribution, success: result.bufferResult.success }),
      Object.freeze({ role: "HEALER", contribution: result.protectionContribution, success: result.healerResult.success }),
      Object.freeze({ role: "DEBUFFER", contribution: result.disruptionContribution, success: result.debufferResult.success }),
      Object.freeze({ role: "BATTER", contribution: result.impactContribution, success: result.batterResult.success })
    ]),
    combinedScore: result.combinedScore,
    combinedAccuracy: result.combinedAccuracy,
    success: result.success,
    deterministic: result.deterministic,
    resolutionOrder: result.resolution_order
  });
}
