"use strict";
/* ============================================================
   08-actions.js — tools, interactions, economy, day cycle.
   ============================================================ */

ITEM_SELL["Field Salad"] = 22;

// ---- hotbar ----
const HOTBAR = [ { tool:"Hoe" }, { tool:"Can" }, { tool:"Axe" }, { tool:"Pick" }, { tool:"Rod" }, { tool:"Seeds" } ];
let slotSel = 0;
function selectSlot(i){ if(i<0||i>=HOTBAR.length) return; slotSel = i; playSfx("select"); refreshHotbar(); }
function cycleSeed(){
  const ids = Object.keys(CROPS).filter(id => skillLvl("Farming") >= CROPS[id].lvl);
  const i = ids.indexOf(state.seedSel);
  state.seedSel = ids[(i+1) % ids.length] || "turnip";
  slotSel = 5; refreshHotbar(); toast("Seeds: " + CROPS[state.seedSel].name, "#8fd06a"); playSfx("menu");
}

// ---- skills / xp ----
const skillLvl = s => levelFor(state.skills[s]);
function unlocksAt(skill, lvl){
  const u = [];
  if(skill==="Farming") for(const k in CROPS) if(CROPS[k].lvl===lvl) u.push(CROPS[k].name+" seeds");
  if(skill==="Woodcutting") for(const k in TREES) if(TREES[k].lvl===lvl) u.push(TREES[k].name);
  if(skill==="Mining") for(const k in ORES) if(ORES[k].lvl===lvl) u.push(ORES[k].name);
  if(skill==="Fishing") FISH.forEach(f=>{ if(f.lvl===lvl) u.push(f.name); });
  return u;
}
function addXP(skill, amt){
  if(state.inv["Grandpa's Guild Pin"]) amt = Math.round(amt * 1.1);   // keepsake luck
  const before = levelFor(state.skills[skill]);
  state.skills[skill] += amt;
  floatText(state.px + rand(-4,4), state.py - 22, "+"+amt+" "+skill.slice(0,4).toLowerCase(), "#9fd8ff");
  const after = levelFor(state.skills[skill]);
  if(after > before){
    let unl = []; for(let l=before+1; l<=after; l++) unl = unl.concat(unlocksAt(skill, l));
    banner("⬆ "+skill+" Lv "+after+"!", unl.length ? ("Unlocked: "+unl.join(", ")) : "Well done.");
    playSfx("level"); pSparkle(state.px, state.py-14, "#8fd3ff", 14); refreshHotbar();
  }
  checkQuests();
}

// ---- inventory ----
function give(item, n=1, quiet){ state.inv[item] = (state.inv[item]||0) + n; if(!quiet){ pItemPop(state.px, state.py-12, "item_"+item); floatText(state.px+rand(-4,4), state.py-22, "+"+n+" "+item, "#ffe08a"); } }
function take(item, n=1){ if((state.inv[item]||0) < n) return false; state.inv[item]-=n; if(state.inv[item]<=0) delete state.inv[item]; return true; }
function bump(stat, n=1){ state.stats[stat] = (state.stats[stat]||0) + n; checkQuests(); }
function near(x,y,d){ return dist2(state.px, state.py, x, y) < d; }
function spendEnergy(n){
  if(state.energy <= 0){ toast("Too tired — eat (F) or sleep.", "#ff8a7a"); playSfx("error"); return false; }
  state.energy = Math.max(0, state.energy - n); refreshHUD(); return true;
}

// ============================== USE TOOL (Space) ==============================
function useTool(){
  if(gameMode!=="play" || uiBlocking()) return;
  const tool = HOTBAR[slotSel].tool;
  const [tx,ty] = facingTile();
  const tt = tileAt(tx,ty), obj = objAt(tx,ty);
  const tier = state.tools[tool]||0, power = TIER_POWER[tier];
  triggerSwing();

  if(tool === "Hoe"){
    if(curMap.id !== "farm"){ toast("This isn't your land to till — crops only grow on the farm."); return; }
    if(obj || !TILLABLE.has(tt)){ if(tt!==T.TILLED && tt!==T.WATERED) toast("Can't till there."); return; }
    if(!spendEnergy(2)) return;
    setTile(tx,ty,T.TILLED); addXP("Farming",1); bump("tilled");
    pPuff(tx*TILE+8, ty*TILE+12, "#7a5734", 8); playSfx("till"); cam.shake = 1.5;
  }
  else if(tool === "Can"){
    if(!spendEnergy(1)) return;
    const radius = tier>=3 ? 1 : 0; let watered = 0;
    for(let oy=-radius; oy<=radius; oy++) for(let ox=-radius; ox<=radius; ox++){
      const x=tx+ox, y=ty+oy;
      if(tileAt(x,y)===T.TILLED){ setTile(x,y,T.WATERED); watered++; pDrops(x*TILE+8, y*TILE+8, 5); }
    }
    if(watered){ addXP("Farming", watered); bump("watered", watered); playSfx("water"); }
    else toast("Nothing to water there.");
  }
  else if(tool === "Seeds"){
    const c = CROPS[state.seedSel];
    if(skillLvl("Farming") < c.lvl){ toast(`Need Farming ${c.lvl} for ${c.name}.`, "#ff8a7a"); playSfx("error"); return; }
    if(!c.seasons.includes(curSeason())){ toast(`${c.name} only grows in ${c.seasons.join(" & ")}.`, "#ff8a7a"); playSfx("error"); return; }
    if(tt!==T.TILLED && tt!==T.WATERED){ toast("Till the soil first (Hoe)."); return; }
    if(curMap.crops[key(tx,ty)]){ toast("Something's already growing."); return; }
    if(!take(c.name+" Seeds")){ toast("No "+c.name+" seeds — buy some at Tom's.", "#ff8a7a"); playSfx("error"); return; }
    curMap.crops[key(tx,ty)] = { type:state.seedSel, days:0 };
    addXP("Farming",4); bump("planted"); playSfx("plant");
    pSparkle(tx*TILE+8, ty*TILE+10, "#8fd06a", 6); refreshHotbar();
  }
  else if(tool === "Axe"){
    if(!obj || !TREES[obj.kind]){ toast("Face a tree to chop."); return; }
    const tr = TREES[obj.kind];
    if(skillLvl("Woodcutting") < tr.lvl){ toast(`Need Woodcutting ${tr.lvl} for ${tr.name}.`, "#ff8a7a"); playSfx("error"); return; }
    if(!spendEnergy(2)) return;
    obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2; hitstop = 0.05; playSfx("chop");
    pChips(tx*TILE+8, ty*TILE+6, "#8a5f38", 5); pLeaves(tx*TILE+8, ty*TILE, TREES[obj.kind].pal[1], 4);
    if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)]; give(tr.drop, tr.n); addXP("Woodcutting", tr.xp); bump("chopped"); playSfx("get"); }
  }
  else if(tool === "Pick"){
    if(obj && (obj.kind==="gemrock" || obj.kind==="crystal")){
      if(!spendEnergy(2)) return;
      obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.4; hitstop = 0.05; playSfx("mine");
      pChips(tx*TILE+8, ty*TILE+8, "#6a6472", 5); pSparkle(tx*TILE+8, ty*TILE+8, "#c8a0f0", 4);
      if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)]; const g = pick(Object.keys(GEMS));
        give(g,1); addXP("Mining", 55); bump("mined"); bump("gems"); pSparkle(tx*TILE+8, ty*TILE+8, GEMS[g], 12); playSfx("ore"); }
      refreshHUD(); return;
    }
    if(!obj || !ORES[obj.kind]){ toast("Face a rock to mine."); return; }
    const o = ORES[obj.kind];
    if(skillLvl("Mining") < o.lvl){ toast(`Need Mining ${o.lvl} for ${o.name}.`, "#ff8a7a"); playSfx("error"); return; }
    if(!spendEnergy(2)) return;
    obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.2; hitstop = 0.05; playSfx("mine");
    pChips(tx*TILE+8, ty*TILE+8, "#9a9a9a", 5);
    if(o.gem) pSparkle(tx*TILE+8, ty*TILE+8, o.gem, 4);
    if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)]; give(o.drop,1); addXP("Mining", o.xp); bump("mined");
      pSparkle(tx*TILE+8, ty*TILE+8, o.gem||"#cfcfcf", 8); playSfx("ore"); }
  }
  else if(tool === "Rod"){
    if(tt !== T.WATER){ toast("Face the water to fish."); return; }
    if(!spendEnergy(1)) return;
    startFishing(tx,ty);
  }
  refreshHUD();
}

// ============================== INTERACT (E) ==============================
function interact(){
  if(gameMode!=="play" || uiBlocking()) return;
  const [tx,ty] = facingTile();
  const k = key(tx,ty), tt = tileAt(tx,ty), obj = objAt(tx,ty);

  // door / warp
  const w = warpAt(tx,ty);
  if(w && !w.auto){ doWarp(w); return; }

  // harvest crop
  const crop = curMap.crops[k];
  if(crop){
    const c = CROPS[crop.type];
    if(crop.days >= c.days){ delete curMap.crops[k]; setTile(tx,ty,T.TILLED);
      give(c.name,1); addXP("Farming", c.xp); bump("harvested"); pSparkle(tx*TILE+8, ty*TILE+6, c.pal[3], 12); playSfx("harvest"); }
    else toast(`${c.name}: day ${crop.days}/${c.days}${tt===T.WATERED?"":" — needs water"}`);
    return;
  }

  if(obj){
    switch(obj.kind){
      case "bed": if(curMap.id==="cottage") doSleep(); else showDialog("A Bed","Cozy — but not yours. Best sleep in your own cottage.","port_valley"); return;
      case "campfire": case "stove": cook(); return;
      case "counter": case "stall": { const r=ensureRel("tom"); if(r.talkedDay!==state.day){ r.talkedDay=state.day; r.points+=10; } checkQuests(); openShop(); return; }
      case "shipbin": toast("Shipping bin — sell your goods here.", "#e9dcc0"); openShop("sell", true); return;
      case "sign": showDialog("Weathered Sign", obj.text || "…", "port_sign"); return;
      case "berrybush": forageNode(tx,ty,obj,"Field Salad","Farming",6); return;
      case "shellnode": forageNode(tx,ty,obj, chance(0.5)?"Shell":"Clam","Fishing",8); return;
      case "seaweednode": forageNode(tx,ty,obj,"Seaweed","Fishing",6); return;
      case "coralnode": forageNode(tx,ty,obj, chance(0.12)?"Pearl":"Coral","Fishing",12); return;
      case "ladderup": mineUp(); return;
      case "ladderdown": mineDown(); return;
      case "mineentrance": enterMine(); return;
      case "sealeddoor": openVault(tx,ty); return;
      case "chest": openChest(); return;
      case "desk": showDialog("Rowan's Desk","Ledgers and a map of nine dark wings. The old keeper must be near.","port_rowan"); return;
      case "bush": toast("A tidy little bush."); return;
    }
  }

  const a = nearestAnimal(24);
  if(a){ petChicken(a); return; }
  const n = nearestNpc(28);
  if(n){ talkNpc(n.id); return; }

  toast("Nothing here. (Space uses your tool)");
}

function forageNode(x, y, obj, item, skill, xp){
  if(obj.pickedDay === state.day){ toast("Already gathered here today."); return; }
  obj.pickedDay = state.day;
  give(item,1); addXP(skill, xp); bump("forage"); playSfx("get");
  pSparkle(x*TILE+8, y*TILE+6, "#8fd06a", 6);
}

function openChest(){
  if(state.flags.letter2){ showDialog("The Chest", "Grandpa's pin rested here once. Now it's yours to carry.", "port_valley"); return; }
  if(state.questIdx < 4){ showDialog("The Chest", "The lid is stuck fast — Grandpa's doing, no doubt. Maybe once you've truly found your feet here.", "port_valley"); return; }
  state.flags.letter2 = true;
  give("Grandpa's Guild Pin", 1, true);
  openLetter("✒ A second letter, folded beneath a brass pin", LETTER_CHEST, () => {
    banner("Grandpa's Guild Pin", "A keepsake — and a little of his luck. (+10% skill XP)");
    playSfx("quest"); pSparkle(state.px, state.py-14, "#ffce5a", 12);
  });
}
function openVault(tx, ty){
  if(state.flags.foundVault){ showDialog("Sealed Vault","The vault stands open — its Star Metal already glimmers in your pack.","port_valley"); return; }
  if(skillLvl("Mining") < 20){ showDialog("Sealed Vault","Ancient Guild-work seals this door. You'd need real strength — Mining level 20 — to break it.","port_valley"); return; }
  state.flags.foundVault = true; delete curMap.objects[key(tx,ty)];
  give("Star Metal",1,true); addXP("Mining",400);
  banner("✦ Star Metal ✦","The Guild's founding gift is yours."); playSfx("quest"); pSparkle(state.px, state.py-14, "#c8ecff", 22);
  showDialog("The Vault Opens","Cold light spills out. In the hush rests a shard of Star Metal — the Guild's founding gift. Rowan will want to see this.","port_valley");
  checkQuests();
}

// ---- cooking ----
function cook(){ openCooking(); }
function cookRecipe(i){
  const r = RECIPES[i]; if(!r) return;
  if(!Object.keys(r.ing).every(it => (state.inv[it]||0) >= r.ing[it])){ toast("Missing ingredients."); playSfx("error"); return; }
  for(const it in r.ing) take(it, r.ing[it]);
  give(r.name, 1, true); addXP("Cooking", r.xp); bump("cooked");
  toast("Cooked "+r.name+"!", "#ffce5a"); playSfx("get"); pSparkle(state.px, state.py-14, r.col, 8);
  renderCooking(); refreshHUD();
}
function cookFish(name){
  if((state.inv[name]||0) <= 0) return;
  const f = FISH.find(x => x.name === name);
  take(name); give("Cooked "+name); addXP("Cooking", Math.floor(f.xp*0.9)); bump("cooked");
  toast("Cooked "+name, "#ffce5a"); playSfx("get"); renderCooking(); refreshHUD();
}

// ---- eating ----
function eatFood(){
  const item = Object.keys(EDIBLE).find(i => state.inv[i] > 0);
  if(!item){ toast("No food! Buy a Berry Bun or cook a fish.", "#ff8a7a"); playSfx("error"); return; }
  if(state.energy >= 100){ toast("You're full of energy already — save it for later.", "#b6f27a"); return; }
  take(item); state.energy = Math.min(100, state.energy + EDIBLE[item]);
  floatText(state.px, state.py-18, "+"+EDIBLE[item]+" energy", "#b6f27a");
  toast("Ate "+item, "#b6f27a"); playSfx("get"); refreshHUD(); refreshHotbar();
}

// ---- gift (G) — nearest NPC ----
function giveGift(){
  const n = nearestNpc(30);
  if(!n){ toast("Stand next to someone to give a gift (G)."); return; }
  giftNpc(n.id);
}

// ---- fishing ----
function startFishing(tx,ty){
  fishing.state = "wait"; fishing.bx = tx; fishing.by = ty;
  const rodTier = state.tools.Rod;
  fishing.t = 1.1 + Math.random()*(3.2 - rodTier*0.5);
  playSfx("splash"); pSplash(tx*TILE+8, ty*TILE+8, 8); toast("Cast… wait for the !");
}
function updateFishing(dt){
  if(fishing.state === "idle") return;
  if(fishing.state === "wait"){ fishing.t -= dt;
    if(fishing.t <= 0){ fishing.state = "bite"; fishing.biteWin = 0.8 + state.tools.Rod*0.15; playSfx("bite"); } }
  else if(fishing.state === "bite"){ fishing.biteWin -= dt;
    if(fishing.biteWin <= 0){ fishing.state = "idle"; toast("It got away…", "#ff8a7a"); } }
}
function reelOrCatch(){
  if(fishing.state === "bite") catchFish();
  else if(fishing.state === "wait"){ fishing.state = "idle"; toast("Reeled in early."); }
}
function catchFish(){
  const lvl = skillLvl("Fishing");
  const coastBonus = curMap.id === "beach" ? 1 : 0;      // better fish on the coast
  const pool = FISH.filter(f => f.lvl <= lvl);
  let idx = Math.min(pool.length-1, Math.floor(Math.random()*pool.length + Math.random()*(1.3+coastBonus)));
  const f = pool[idx] || FISH[0];
  give(f.name,1); addXP("Fishing", f.xp); bump("fished");
  // occasional shore bonus
  if(curMap.id==="beach" && chance(0.15)){ const b=pick(["Shell","Coral","Seaweed"]); give(b,1); }
  fishing.state = "idle"; playSfx("catch"); pSparkle(state.px, state.py-16, "#8fd3ff", 10);
}

// ============================== DAY CYCLE ==============================
let sleeping = false;
function doSleep(){
  if(sleeping) return;
  sleeping = true; paused = true; playSfx("sleep");
  fadeTo(true, () => {
    const summary = newDay();
    if(!curMap || curMap.id !== "cottage") setMap("cottage", 5*TILE+8, 6*TILE, "down");  // always wake at home
    showSleepCard(summary);
  });
}
function newDay(){
  const farm = state.farm, wasRain = state.weather === "rain";
  let grew = 0, ready = 0;
  for(const k in farm.crops){
    const [cx,cy] = k.split(",").map(Number);
    const c = farm.crops[k], cfg = CROPS[c.type];
    if((farm.tiles[cy*W+cx]===T.WATERED || wasRain) && c.days < cfg.days){ c.days++; grew++; if(c.days>=cfg.days) ready++; }
  }
  for(let i=0;i<W*H;i++) if(farm.tiles[i]===T.WATERED) farm.tiles[i]=T.TILLED;
  respawnNodes(farm);
  clearMapCache();                  // beach/mine refresh once per day
  const oldSeason = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  state.day++; state.time = 6*60; state.energy = 100;
  const newSeason = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  let withered = 0, seasonChanged = newSeason !== oldSeason;
  if(seasonChanged){
    for(const k in farm.crops){ if(!CROPS[farm.crops[k].type].seasons.includes(newSeason)){ delete farm.crops[k]; withered++; } }
  }
  rollWeather();
  if(state.weather === "rain"){ for(let i=0;i<W*H;i++) if(farm.tiles[i]===T.TILLED) farm.tiles[i]=T.WATERED; }
  saveGame();
  return { grew, ready, rain: state.weather === "rain", withered, season: seasonChanged ? newSeason : null };
}
function respawnNodes(m){
  const rng = Math.random;
  const trees = Object.values(m.objects).filter(o=>TREES[o.kind]).length;
  const rocks = Object.values(m.objects).filter(o=>ORES[o.kind]).length;
  for(let i=0;i<5 && trees+i<44;i++){
    const x=2+Math.floor(rng()*20), y=27+Math.floor(rng()*16), k=key(x,y), g=m.tiles[y*W+x];
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]&&!m.crops[k]){
      const r=rng(), kind=r<.55?"oak":r<.82?"pine":"maple"; m.objects[k]={kind,hp:TREES[kind].hp};
    }
  }
  for(let i=0;i<4 && rocks+i<24;i++){
    const x=26+Math.floor(rng()*23), y=1+Math.floor(rng()*4), k=key(x,y), g=m.tiles[y*W+x];
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]){
      const r=rng(), kind=r<.4?"stone":r<.75?"copper":r<.92?"iron":"gold"; m.objects[k]={kind,hp:ORES[kind].hp};
    }
  }
}
function updateTime(dt){
  if(gameMode!=="play" || paused) return;
  state.time += dt * (60/16);
  if(curMap && curMap.music === "auto"){ const h = state.time/60; setMusicMode(nightFactor(h)>0.55 ? "night" : "day"); }
  if(state.time >= 26*60){ toast("You stayed up far too late…", "#ff8a7a"); doSleep(); }
}

// ============================== ECONOMY ==============================
function sellItem(item, n){
  n = Math.min(n, state.inv[item]||0); if(n<=0) return;
  take(item, n); const gain = (ITEM_SELL[item]||0)*n;
  state.gold += gain; bump("earned", gain); bump("sold", n);
  toast(`Sold ${n} ${item} (+${gain}g)`, "#ffce5a"); playSfx("sell"); refreshHUD(); renderShop();
}
function buySeed(id){
  const c = CROPS[id]; if(state.gold < c.seed) return;
  state.gold -= c.seed; give(c.name+" Seeds",1,true); toast("Bought "+c.name+" Seeds", "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop(); refreshHotbar();
}
function buyFood(item, cost){
  if(state.gold < cost) return;
  state.gold -= cost; give(item,1,true); toast("Bought "+item, "#8fd06a"); playSfx("coin"); refreshHUD(); renderShop();
}
function buyTool(tool){
  const cur = state.tools[tool]; if(cur>=3) return;
  const c = TIER_COST[cur+1];
  if(state.gold < c.g || (state.inv[c.ore]||0) < c.n) return;
  state.gold -= c.g; take(c.ore, c.n); state.tools[tool] = cur+1; bump("toolUpgrades");
  banner("🔧 "+TOOL_TIERS[cur+1]+" "+tool+"!", "Faster, stronger, cozier.");
  playSfx("upgrade"); pSparkle(state.px, state.py-14, "#ffce5a", 12); refreshHUD(); renderShop(); refreshHotbar();
}
