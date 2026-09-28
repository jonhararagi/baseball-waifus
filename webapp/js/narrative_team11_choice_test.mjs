import assert from "node:assert/strict";
import { NARRATIVE_STATE } from "./narrative_runtime.js";
import { Team11ChoicePresentation } from "./narrative_team11_choice_presentation.js";
import { ARC0_TEAM11_FIRST_TEST } from "./narrative_arc0_team11_choice.js";

const rosterIds = new Set(["bw001", "bw003", "bw008"]);
const allLines = [
  ...ARC0_TEAM11_FIRST_TEST.intro.dialogue_lines,
  ...ARC0_TEAM11_FIRST_TEST.branches.A.dialogue_lines,
  ...ARC0_TEAM11_FIRST_TEST.branches.B.dialogue_lines,
  ...ARC0_TEAM11_FIRST_TEST.common.dialogue_lines
];

for (const id of rosterIds) {
  assert.equal(allLines.some((line) => line.character_id === id), true);
}
assert.deepEqual(ARC0_TEAM11_FIRST_TEST.participants, [
  "protagonist", "bw001", "bw003", "bw008", "azusa"
]);
assert.equal(ARC0_TEAM11_FIRST_TEST.intro.dialogue_lines.length, 10);
assert.equal(ARC0_TEAM11_FIRST_TEST.branches.A.dialogue_lines.length, 5);
assert.equal(ARC0_TEAM11_FIRST_TEST.branches.B.dialogue_lines.length, 5);
assert.equal(ARC0_TEAM11_FIRST_TEST.common.dialogue_lines.length, 4);

function advanceUntilChoice(presentation) {
  presentation.start();
  while (!presentation.getChoiceState().visible) presentation.advance();
  return presentation.getChoiceState();
}

function runChoice(choiceId) {
  const presentation = new Team11ChoicePresentation();
  const choiceState = advanceUntilChoice(presentation);

  assert.equal(choiceState.visible, true);
  assert.deepEqual(choiceState.options.map((option) => option.id), ["A", "B"]);

  const selected = presentation.choose(choiceId);
  assert.equal(selected.state, NARRATIVE_STATE.PLAYING);
  assert.equal(presentation.selectedChoice, choiceId);

  const branchFirstLine = presentation.runtime.getCurrentLine();
  assert.equal(branchFirstLine.character_id, "protagonist");
  assert.equal(branchFirstLine.text.includes(choiceId === "A" ? "Aiko" : "Nao"), true);

  while (!presentation.isFinished()) presentation.advance();

  assert.equal(presentation.runtime.getState().state, NARRATIVE_STATE.COMPLETED);
  assert.equal(presentation.phase, "COMMON");
  assert.equal(presentation.isFinished(), true);
  assert.equal(
    presentation.runtime.getCurrentLine().text,
    ARC0_TEAM11_FIRST_TEST.common.dialogue_lines.at(-1).text
  );
  return { presentation, branchFirstLine };
}

const optionA = runChoice("A");
assert.equal(optionA.presentation.selectedChoice, "A");

const optionB = runChoice("B");
assert.equal(optionB.presentation.selectedChoice, "B");

assert.notEqual(
  ARC0_TEAM11_FIRST_TEST.branches.A.dialogue_lines[0].text,
  ARC0_TEAM11_FIRST_TEST.branches.B.dialogue_lines[0].text
);
assert.notEqual(optionA.branchFirstLine.text, optionB.branchFirstLine.text);

const deterministicA1 = runChoice("A").branchFirstLine.text;
const deterministicA2 = runChoice("A").branchFirstLine.text;
const deterministicB1 = runChoice("B").branchFirstLine.text;
const deterministicB2 = runChoice("B").branchFirstLine.text;
assert.equal(deterministicA1, deterministicA2);
assert.equal(deterministicB1, deterministicB2);

const skipPresentation = new Team11ChoicePresentation();
advanceUntilChoice(skipPresentation);
skipPresentation.skip();
assert.equal(skipPresentation.phase, "SKIPPED");
assert.equal(skipPresentation.runtime.getState().state, NARRATIVE_STATE.SKIPPED);
assert.equal(skipPresentation.isFinished(), true);
const skippedState = skipPresentation.runtime.getState();
skipPresentation.advance();
assert.deepEqual(skipPresentation.runtime.getState(), skippedState);

console.log("narrative_team11_choice_test: ok");
