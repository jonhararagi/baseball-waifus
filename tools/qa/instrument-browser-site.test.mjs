import test from "node:test";import assert from "node:assert/strict";import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";import {tmpdir} from "node:os";import {join} from "node:path";import {spawnSync} from "node:child_process";import {fileURLToPath} from "node:url";
const script=fileURLToPath(new URL("./instrument-browser-site.mjs",import.meta.url));
function fixture(){
 const r=mkdtempSync(join(tmpdir(),"bwm101r7c2-"));mkdirSync(join(r,"js"),{recursive:true});
 writeFileSync(join(r,"js","app.js"),'import "./main.js";\n');
 writeFileSync(join(r,"js","main.js"),"export const ok=true;\n");
 writeFileSync(join(r,"js","combat_stage.js"),"  transitionTo(nextState) {\n  setActors(actors = []) {\n");
 writeFileSync(join(r,"js","combat_presentation_director.js"),"  _finishFormationActorsForReplacement() {\n  startFromPresentationEvent(event) {\n  _emitStep(reason) {\n  setStage(stage) {\n  _createRuntimeFormation() {\n  _ensureRuntimeFormation() {\n");
 writeFileSync(join(r,"js","character_formation_2d5.js"),"  populate(actors = []) {\n  attach(actor, slotIndex = 0) {\n  clear() {\n");
 writeFileSync(join(r,"js","combat.js"),'  resolveTimingInput(source = "pointer") {\n  _handleCombatPresentationStep(event) {\n');
 return r;
}
const run=r=>spawnSync(process.execPath,[script,r],{encoding:"utf8"});
test("installs and writes manifest",()=>{const r=fixture();try{const x=run(r);assert.equal(x.status,0,x.stderr);const m=JSON.parse(readFileSync(join(r,"bwm-101-r5-instrumentation-manifest.json"),"utf8"));assert.equal(m.status,"PASS");assert.equal(m.harnessVersion,"BWM-101-R7-C2");assert.equal(m.checks.length,13);assert.equal(readFileSync(join(r,"js","app.js"),"utf8").split("./qa/bwm101r5-instrumentation.js").length-1,1);const mod=readFileSync(join(r,"js","qa","bwm101r5-instrumentation.js"),"utf8");assert.match(mod,/objectRefId/);assert.match(mod,/firstDivergence/);assert.match(mod,/CombatStage.setActors/);}finally{rmSync(r,{recursive:true,force:true});}});
test("missing anchor fails",()=>{const r=fixture();try{writeFileSync(join(r,"js","combat.js"),'  resolveTimingInput(source = "pointer") {\n');const x=run(r);assert.notEqual(x.status,0);assert.match(x.stderr,/got 0/);}finally{rmSync(r,{recursive:true,force:true});}});
test("duplicate anchor fails",()=>{const r=fixture();try{writeFileSync(join(r,"js","combat.js"),'  resolveTimingInput(source = "pointer") {\n  resolveTimingInput(source = "pointer") {\n  _handleCombatPresentationStep(event) {\n');const x=run(r);assert.notEqual(x.status,0);assert.match(x.stderr,/got 2/);}finally{rmSync(r,{recursive:true,force:true});}});
test("second run does not duplicate import",()=>{const r=fixture();try{assert.equal(run(r).status,0);const before=readFileSync(join(r,"js","app.js"),"utf8"),x=run(r);assert.equal(x.status,0,x.stderr);assert.equal(readFileSync(join(r,"js","app.js"),"utf8"),before);assert.equal(before.split("./qa/bwm101r5-instrumentation.js").length-1,1);}finally{rmSync(r,{recursive:true,force:true});}});
