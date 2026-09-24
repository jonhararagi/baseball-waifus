import assert from "node:assert/strict";
import { AudioManager } from "../webapp/js/audioManager.js";
const storage={data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}};
const audio=new AudioManager({storage,audioContextFactory:()=>({state:"running",currentTime:0,destination:{},createGain(){return {gain:{setValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}}},createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){}}},createBuffer(){return {getChannelData(){return []}}}})});
assert.equal(audio.getSettings().muted,false);
audio.setMuted(true); assert.equal(JSON.parse(storage.getItem("baseball_waifus_audio_v1")).muted,true);
audio.setMuted(false); audio.setVolume(.5); assert.equal(audio.getSettings().volume,.5);
assert.equal(typeof audio.playTap,"function"); assert.equal(typeof audio.playTimingResult,"function"); assert.equal(typeof audio.playGachaReveal,"function");
console.log("✅ AudioManager tests passed.");
