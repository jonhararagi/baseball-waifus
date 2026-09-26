const STORAGE_KEY="baseball_waifus_leaderboard_v1";
function read(storage,key){try{return JSON.parse(storage?.getItem?.(key)||"[]")||[]}catch{return[]}}
export class Leaderboard{
 constructor({storage=globalThis.localStorage,cloudStorage=null,playerId="local-player",playerName="PLAYER"}={}){this.storage=storage;this.cloudStorage=cloudStorage;this.playerId=String(playerId);this.playerName=String(playerName);}
 _read(){return read(this.storage,STORAGE_KEY)}
 record({homeRuns=0,scrapEarned=0,name=this.playerName}={}){const rows=this._read();const old=rows.find(x=>x.player_id===this.playerId)||{player_id:this.playerId,home_runs:0,scrap_earned:0};const next={...old,name:String(name||old.name||"PLAYER"),home_runs:old.home_runs+Math.max(0,Number(homeRuns)||0),scrap_earned:old.scrap_earned+Math.max(0,Number(scrapEarned)||0),updated_at:new Date().toISOString()};const filtered=rows.filter(x=>x.player_id!==this.playerId);filtered.push(next);filtered.sort((a,b)=>(b.home_runs-a.home_runs)||(b.scrap_earned-a.scrap_earned));const top=filtered.slice(0,100);try{this.storage?.setItem?.(STORAGE_KEY,JSON.stringify(top));}catch{}return next;}
 getEntries(limit=20){return this._read().sort((a,b)=>(b.home_runs-a.home_runs)||(b.scrap_earned-a.scrap_earned)).slice(0,Math.max(1,limit));}
 setPlayerIdentity(playerId, playerName="PLAYER"){ if(playerId!=null && String(playerId)) this.playerId=String(playerId); if(playerName) this.playerName=String(playerName); return this.getPlayer(); }
 getPlayer(){return this._read().find(x=>x.player_id===this.playerId)||null;}
 async syncCloud(){if(!this.cloudStorage?.setItem)return false;try{await new Promise((resolve,reject)=>this.cloudStorage.setItem(STORAGE_KEY,JSON.stringify(this._read()),e=>e?reject(e):resolve()));return true;}catch{return false;}}
 render(root){if(!root)return;const rows=this.getEntries();root.innerHTML='<div class="leaderboard-list">'+rows.map((r,i)=>'<div class="leaderboard-row"><b>#'+(i+1)+'</b><span>'+String(r.name).replace(/[&<>]/g,"")+'</span><strong>⚾ '+r.home_runs+' HR</strong><em>💎 '+r.scrap_earned.toLocaleString('es-AR')+'</em></div>').join("")+'</div>';}
}
export {STORAGE_KEY};