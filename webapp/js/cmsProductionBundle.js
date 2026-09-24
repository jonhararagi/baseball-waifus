const STORAGE_KEY="baseball_waifus_cms_manifest_v1";
const TYPES=Object.freeze(["AVATAR_ROSTRO","CARTA_GACHA_R","CARTA_GACHA_UR","BACKGROUND_HUD","CUT_IN_EYES"]);
const EXT=/\.(png|jpe?g|webp|avif|gif|svg)$/i;
function clean(v){return String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/\.[^.]+$/,"").replace(/[^a-zA-Z0-9]+/g," ").trim();}
function inferType(name){
 const n=clean(name).toLowerCase();
 if(/cut|eye|ojos|eyes/.test(n)) return "CUT_IN_EYES";
 if(/background|bg|fondo|hud/.test(n)) return "BACKGROUND_HUD";
 if(/ur|legend|legendaria|gacha.*ur/.test(n)) return "CARTA_GACHA_UR";
 if(/r|common|comun|gacha/.test(n)) return "CARTA_GACHA_R";
 return "AVATAR_ROSTRO";
}
function inferCharacter(name){
 const n=clean(name).toLowerCase();
 const known=["cari","cami","sunna","chie","scarlet","chloe","fenrir","roxie"];
 return known.find(x=>n.includes(x))||clean(name).split(/\s+/)[0].toLowerCase()||"unknown";
}
export function inferAssetDescriptor(fileOrName){
 const name=typeof fileOrName==="string"?fileOrName:String(fileOrName?.name||"asset");
 const type=inferType(name);
 return {id:inferCharacter(name)+"_"+type.toLowerCase(),character_id:inferCharacter(name),asset_type:type,source_name:String(name),mime:String(fileOrName?.type||"").toLowerCase()};
}
export class CMSProductionBundle{
 constructor({storage=globalThis.localStorage,storageKey=STORAGE_KEY}={}){this.storage=storage;this.storageKey=storageKey;this.manifest=this._load();}
 _load(){try{return JSON.parse(this.storage?.getItem?.(this.storageKey)||"null")||this.emptyManifest()}catch{return this.emptyManifest()}}
 emptyManifest(){return {version:1,project:"team-problemas-de-capibara",generated_at:null,assets:{}}}
 processFiles(files){
  const list=Array.from(files||[]).filter(f=>f&&EXT.test(String(f.name||"")));
  for(const file of list){const d=inferAssetDescriptor(file);const url=typeof URL!=="undefined"&&URL.createObjectURL?URL.createObjectURL(file):"";this.manifest.assets[d.character_id]??={};this.manifest.assets[d.character_id][d.asset_type]={...d,url};}
  this.manifest.generated_at=new Date().toISOString();this.persist();return this.getManifest();
 }
 processDescriptors(descriptors=[]){for(const d of descriptors){const x={...d,asset_type:TYPES.includes(d.asset_type)?d.asset_type:inferType(d.source_name||d.name),character_id:d.character_id||inferCharacter(d.source_name||d.name)};this.manifest.assets[x.character_id]??={};this.manifest.assets[x.character_id][x.asset_type]=x;}this.manifest.generated_at=new Date().toISOString();this.persist();return this.getManifest();}
 getManifest(){return JSON.parse(JSON.stringify(this.manifest))}
 persist(){try{this.storage?.setItem?.(this.storageKey,JSON.stringify(this.manifest));}catch{}return this.getManifest()}
 reset(){this.manifest=this.emptyManifest();this.persist();return this.getManifest()}
 toJson(pretty=true){return JSON.stringify(this.manifest,null,pretty?2:0)}
 download(filename="manifest.json"){if(typeof document==="undefined")return false;const blob=new Blob([this.toJson()],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);return true}
}
export {STORAGE_KEY,TYPES};