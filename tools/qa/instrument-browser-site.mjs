#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
const version="BWM-101-R7-C2", site=resolve(process.argv[2]||"site");
const appPath=join(site,"js","app.js"), manifestPath=join(site,"bwm-101-r5-instrumentation-manifest.json"), outputModule=join(site,"js","qa","bwm101r5-instrumentation.js");
const sourceModule=readFileSync(new URL("./bwm101r5-instrumentation.js",import.meta.url),"utf8");
const targets=[
{path:"js/combat_stage.js",anchor:"  transitionTo(nextState) {"},
{path:"js/combat_stage.js",anchor:"  setActors(actors = []) {"},
{path:"js/combat_presentation_director.js",anchor:"  _finishFormationActorsForReplacement() {"},
{path:"js/combat_presentation_director.js",anchor:"  startFromPresentationEvent(event) {"},
{path:"js/combat_presentation_director.js",anchor:"  _emitStep(reason) {"},
{path:"js/combat_presentation_director.js",anchor:"  setStage(stage) {"},
{path:"js/combat_presentation_director.js",anchor:"  _createRuntimeFormation() {"},
{path:"js/combat_presentation_director.js",anchor:"  _ensureRuntimeFormation() {"},
{path:"js/character_formation_2d5.js",anchor:"  populate(actors = []) {"},
{path:"js/character_formation_2d5.js",anchor:"  attach(actor, slotIndex = 0) {"},
{path:"js/character_formation_2d5.js",anchor:"  clear() {"},
{path:"js/combat.js",anchor:"  beginTimingWindow() {"},
{path:"js/combat.js",anchor:'  resolveTimingInput(source = "pointer") {'},
{path:"js/combat.js",anchor:"  _handleCombatPresentationStep(event) {"}
];
const sha=s=>createHash("sha256").update(s,"utf8").digest("hex");
function fail(m){throw new Error("BWM101R5 HARNESS ERROR: "+m);}
if(!existsSync(site)||!existsSync(appPath))fail("site/app.js not found: "+site);
if(existsSync(manifestPath)){
 const m=JSON.parse(readFileSync(manifestPath,"utf8")), app=readFileSync(appPath,"utf8");
 if(m.harnessVersion!==version||app.split("./qa/bwm101r5-instrumentation.js").length-1!==1||!existsSync(outputModule))fail("manifest/import inconsistent; use clean site");
 console.log(JSON.stringify({prefix:"[BWM101R5]",status:"ALREADY_INSTRUMENTED",manifest:manifestPath}));process.exit(0);
}
const originalApp=readFileSync(appPath,"utf8"), originals={}, checks=[];
for(const t of targets){const p=join(site,t.path);if(!existsSync(p))fail("target missing: "+t.path);const c=readFileSync(p,"utf8"),n=c.split(t.anchor).length-1;checks.push({path:t.path,anchor:t.anchor,matches:n,passed:n===1});if(n!==1)fail("anchor must match exactly once in "+t.path+"; got "+n);originals[t.path]=sha(c);}
if(originalApp.includes("bwm101r5-instrumentation.js"))fail("import exists without manifest; use clean site");
const at=originalApp.search(/^import\s/m);if(at<0)fail("app.js has no ES module import");
const instrumented=originalApp.slice(0,at)+'import "./qa/bwm101r5-instrumentation.js";\n'+originalApp.slice(at);
mkdirSync(dirname(outputModule),{recursive:true});writeFileSync(outputModule,sourceModule,"utf8");writeFileSync(appPath,instrumented,"utf8");
const manifest={harnessVersion:version,createdAt:new Date().toISOString(),siteRoot:site,sourceFiles:Object.fromEntries(Object.entries(originals).map(([path,sha256])=>[path,{sha256,status:"ANCHORS_VALIDATED"}])),app:{path:"js/app.js",originalSha256:sha(originalApp),instrumentedSha256:sha(instrumented),importCount:1},instrumentation:{path:"js/qa/bwm101r5-instrumentation.js",sha256:sha(sourceModule)},checks,status:"PASS"};
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n","utf8");console.log(JSON.stringify({prefix:"[BWM101R5]",status:"PASS",manifest:manifestPath,checks:checks.length}));
