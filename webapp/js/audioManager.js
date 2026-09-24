import { AudioEngine } from "./audio_engine.js";
export class AudioManager extends AudioEngine{
 playTap(){return this.play("ui.confirm");}
 playTimingResult(grade){const g=String(grade||"").toUpperCase();return this.play(g==="GREAT"?"result.perfect":g==="HIT"?"result.hit":"result.miss");}
 playGachaReveal(rarity){const r=String(rarity||"R").toLowerCase();return this.play("gacha.reveal_"+(["r","sr","ssr","ur"].includes(r)?r:"r"));}
 startBGM(){return this.resume();}
 stopBGM(){return this.suspend();}
 get muted(){return this.getSettings().muted;}
 get volume(){return this.getSettings().volume;}
}
export { STORAGE_KEY as AUDIO_STORAGE_KEY } from "./audio_engine.js";