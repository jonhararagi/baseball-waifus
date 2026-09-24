function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[char]);
}
const rarityLabel = { R:"COMÚN", SR:"RARA", SSR:"ÉPICA", UR:"LEGENDARIA" };

export class RosterPanel {
  constructor({ root, getCharacters, getInventory, getActiveId, onSetActive } = {}) {
    this.root=root; this.getCharacters=getCharacters; this.getInventory=getInventory; this.getActiveId=getActiveId; this.onSetActive=onSetActive;
    this.selectedId=null;
    this.grid=root?.querySelector("#roster-panel-grid");
    this.detail=root?.querySelector("#roster-panel-detail");
    this.closeButton=root?.querySelector("#roster-panel-close");
    this.setActiveButton=root?.querySelector("#roster-panel-set-active");
    this.status=root?.querySelector("#roster-panel-status");
    this.closeButton?.addEventListener("click",()=>this.close());
    root?.addEventListener("click",(event)=>{ if(event.target===root)this.close(); });
    this.setActiveButton?.addEventListener("click",()=>this.setActive());
  }
  open(){ this.root?.removeAttribute("hidden"); requestAnimationFrame(()=>this.root?.classList.add("is-open")); this.refresh(); }
  close(){ this.root?.classList.remove("is-open"); setTimeout(()=>{if(!this.root?.classList.contains("is-open"))this.root?.setAttribute("hidden","");},180); }
  refresh(){
    const chars=this.getCharacters?.()||[], inventory=this.getInventory?.()||{}, active=this.getActiveId?.();
    if(!this.selectedId || !chars.some(c=>c.character_id===this.selectedId)) this.selectedId=active||chars.find(c=>inventory[c.character_id])?.character_id||chars[0]?.character_id||null;
    this.grid?.replaceChildren();
    for(const unit of chars) this.renderCard(unit,Boolean(inventory[unit.character_id]),unit.character_id===active);
    this.renderDetail();
  }
  renderCard(unit,unlocked,isActive){
    const canonical=unit.canonical||{}, stats=canonical.stats||{}, id=unit.character_id;
    const card=document.createElement("button"); card.type="button"; card.className="roster-unit-card"+(unlocked?"":" is-locked")+(isActive?" is-active":"");
    const art=canonical.visual?.avatar_url||canonical.visual?.card_url||canonical.visual?.card_hd_url||"";
    card.innerHTML='<div class="roster-unit-art">'+(unlocked&&art?'<img src="'+escapeText(art)+'" alt="">':'<span class="roster-lock-silhouette">?</span>')+'</div><div class="roster-unit-name">'+escapeText(canonical.display_name||id)+'</div><div class="roster-unit-meta">'+(unlocked?escapeText(rarityLabel[canonical.rarity]||canonical.rarity||"R"):"BLOQUEADA")+'</div><div class="roster-unit-mini">PWR '+Number(stats.power||0)+' · SPD '+Number(stats.speed||0)+'</div>';
    card.addEventListener("click",()=>{this.selectedId=id;this.refresh();});
    this.grid?.appendChild(card);
  }
  renderDetail(){
    const unit=(this.getCharacters?.()||[]).find(c=>c.character_id===this.selectedId); if(!unit||!this.detail)return;
    const inventory=this.getInventory?.()||{}, unlocked=Boolean(inventory[unit.character_id]), canonical=unit.canonical||{}, stats=canonical.stats||{}, active=unit.character_id===this.getActiveId?.();
    const art=canonical.visual?.card_hd_url||canonical.visual?.card_url||canonical.visual?.avatar_url||"";
    const level=Number(inventory[unit.character_id]?.level||1), rarity=rarityLabel[canonical.rarity]||canonical.rarity||"R";
    this.detail.innerHTML='<div class="roster-detail-art">'+(unlocked&&art?'<img src="'+escapeText(art)+'" alt="">':'<span class="roster-lock-silhouette large">?</span>')+'</div><div class="roster-detail-copy"><span class="gallery-kicker">'+(unlocked?"UNLOCKED WAIFU":"LOCKED WAIFU")+'</span><h3>'+escapeText(canonical.display_name||unit.character_id)+'</h3><div class="roster-detail-tags"><span>'+escapeText(rarity)+'</span><span>LV '+level+'</span><span>'+escapeText(canonical.archetype||canonical.specialization||"WAIFU")+'</span></div><div class="roster-stat-grid"><div><b>PWR</b><strong>'+Number(stats.power||0)+'</strong></div><div><b>SPD</b><strong>'+Number(stats.speed||0)+'</strong></div><div><b>CONTACT</b><strong>'+Number(stats.contact||0)+'</strong></div><div><b>EYE</b><strong>'+Number(stats.eye||0)+'</strong></div></div></div>';
    if(this.setActiveButton){this.setActiveButton.disabled=!unlocked||active;this.setActiveButton.textContent=active?"✓ ACTIVA":"ESTABLECER COMO ACTIVA";}
    if(this.status)this.status.textContent=active?"BATTER // ACTIVA":unlocked?"SELECCIONADA // LISTA":"BLOQUEADA // RECLUTA ESTA WAIFU";
  }
  async setActive(){
    if(!this.selectedId)return;
    try{await this.onSetActive?.(this.selectedId);this.refresh();if(this.status)this.status.textContent="BATTER // ACTIVA";}catch(error){if(this.status)this.status.textContent=String(error?.message||error).toUpperCase();}
  }
}
