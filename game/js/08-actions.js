"use strict";
/* ============================================================
   08-actions.js — tools, interactions, economy, day cycle.
   ============================================================ */

// ---- hotbar ----
const HOTBAR = [ { tool:"Hoe" }, { tool:"Can" }, { tool:"Axe" }, { tool:"Pick" }, { tool:"Rod" }, { tool:"Seeds" } ];
let slotSel = 0;
function selectSlot(i){ if(i<0||i>=HOTBAR.length) return; slotSel = i; playSfx("select"); refreshHotbar(); }

// ---- new-player tutoring: one-shot, contextual, only on a save born in the NPX era ----
function tutTip(flag, text){
  if(!state || !state.flags.npxGame || state.flags[flag]) return;
  state.flags[flag] = true;
  toast(text, "#ffe6a0"); playSfx("select");
}
// Teach each verb the first moment the player is actually positioned to use it — never on a
// timer, never twice. New-game saves only; existing saves have npxGame=false and see nothing.
function tutoringTick(){
  if(!state || !state.flags.npxGame) return;
  if(gameMode!=="play" || paused || uiBlocking() || isCutscene() || fishing.state!=="idle" || !curMap) return;
  // first-encounter tips (fire anywhere in play)
  if(curMap.outdoor && isRain() && !state.flags.tip_rain)
    tutTip("tip_rain","Rain waters your fields for free today — and the fish are rising.");
  if(curMap.id==="mine" && !state.flags.tip_mine)
    tutTip("tip_mine","Swing your Pick at the rock for ore and gems. Find a ladder to go deeper.");
  if(curMap.id==="grove" && !state.flags.tip_grove)
    tutTip("tip_grove","The Grove regrows overnight — cut what you need. Older wood grows deeper in.");
  // contextual verb hints, keyed to what you're facing with the tool in hand
  const slot = HOTBAR[slotSel]; if(!slot) return;
  const tool = slot.tool;
  const [tx,ty] = facingTile(); const tt = tileAt(tx,ty), obj = objAt(tx,ty);
  if(tool==="Hoe" && curMap.id==="farm" && TILLABLE.has(tt) && !obj && !curMap.crops[key(tx,ty)])
    tutTip("hint_hoe","This soil is ready — press SPACE to till it.");
  else if(tool==="Seeds" && (tt===T.TILLED||tt===T.WATERED) && !curMap.crops[key(tx,ty)])
    tutTip("hint_seed","SPACE plants your seed here. Press R to switch which seed.");
  else if(tool==="Can" && tt===T.TILLED)
    tutTip("hint_can","SPACE waters the soil — young crops drink every day.");
  else if(tool==="Axe" && obj && TREES[obj.kind])
    tutTip("hint_axe","Face the tree and press SPACE to chop — it trains Woodcutting.");
  else if(tool==="Pick" && obj && (ORES[obj.kind]||obj.kind==="gemrock"||obj.kind==="crystal"))
    tutTip("hint_pick","Press SPACE to mine. A better pick breaks the rock faster.");
  else if(tool==="Rod" && tt===T.WATER)
    tutTip("hint_rod","Face the water and press SPACE to cast your line.");
}
// Everything you can put in the ground: seeds you've levelled into, plus any sapling or hive
// you're actually carrying. `state.seedSel` is a crop id, "sap:<type>", or "hive".
function plantables(){
  const list = Object.keys(CROPS).filter(id => skillLvl("Farming") >= CROPS[id].lvl);
  for(const k in FRUIT_TREES) if((state.inv[FRUIT_TREES[k].name]||0) > 0) list.push("sap:"+k);
  if((state.inv["Beehive"]||0) > 0) list.push("hive");
  return list;
}
const isSapSel  = s => typeof s === "string" && s.startsWith("sap:");
const isHiveSel = s => s === "hive";
function plantableName(sel){
  if(isHiveSel(sel)) return "Beehive";
  if(isSapSel(sel)) return FRUIT_TREES[sel.slice(4)].name;
  return CROPS[sel] ? CROPS[sel].name + " Seeds" : "Seeds";
}
function plantableIcon(sel){
  if(isHiveSel(sel)) return "beehive";
  if(isSapSel(sel)) return "sapling_" + sel.slice(4);
  return "item_" + (CROPS[sel] ? CROPS[sel].name : "Turnip") + " Seeds";
}
// if you plant your last sapling, fall back to something you still have
function normalizeSeedSel(){
  const ids = plantables();
  if(!ids.includes(state.seedSel)) state.seedSel = ids[0] || "turnip";
}
function cycleSeed(){
  const ids = plantables();
  const i = ids.indexOf(state.seedSel);
  state.seedSel = ids[(i+1) % ids.length] || "turnip";
  slotSel = 5; refreshHotbar(); toast("Selected: " + plantableName(state.seedSel), "#8fd06a"); playSfx("menu");
}

// ---- skills / xp ----
const skillLvl = s => levelFor(state.skills[s]);
// a mastery is simply "you are at least this level" — no state, nothing to maintain
const hasMastery = (skill, n) => skillLvl(skill) >= n;
// the next milestone you're working toward, for the skills panel
function nextMastery(skill){
  const lv = skillLvl(skill);
  for(const n of [25,50,75,99]) if(lv < n) return { at:n, text:MASTERY[skill][n] };
  return null;
}
// the next piece of CONTENT a skill unlocks — so a level is never a blind grind toward nothing
function nextUnlock(skill){
  const lv = skillLvl(skill);
  let best = null;
  const add = (n, label) => { if(n > lv && (!best || n < best.at)) best = { at:n, label }; };
  if(skill==="Farming")     for(const k in CROPS) add(CROPS[k].lvl, CROPS[k].name);
  if(skill==="Woodcutting") for(const k in TREES) add(TREES[k].lvl, TREES[k].name);
  if(skill==="Mining")      for(const k in ORES)  add(ORES[k].lvl,  ORES[k].name);
  if(skill==="Fishing"){ FISH.forEach(f=>add(f.lvl, f.name)); LEGENDS.forEach(l=>add(l.lvl, l.name+" (legend)")); }
  if(skill==="Cooking") for(const r of RECIPES) add(r.lvl, r.name);
  return best;
}

function unlocksAt(skill, lvl){
  const u = [];
  if(skill==="Farming") for(const k in CROPS) if(CROPS[k].lvl===lvl) u.push(CROPS[k].name+" seeds");
  if(skill==="Woodcutting") for(const k in TREES) if(TREES[k].lvl===lvl) u.push(TREES[k].name);
  if(skill==="Mining") for(const k in ORES) if(ORES[k].lvl===lvl) u.push(ORES[k].name);
  if(skill==="Fishing") FISH.forEach(f=>{ if(f.lvl===lvl) u.push(f.name); });
  if(skill==="Cooking") for(const r of RECIPES) if(r.lvl===lvl) u.push(r.name);
  if(MASTERY[skill] && MASTERY[skill][lvl]) u.push("★ " + MASTERY[skill][lvl]);
  return u;
}
function addXP(skill, amt){
  if(state.inv["Grandpa's Guild Pin"]) amt = Math.round(amt * 1.1);   // keepsake luck
  // canopy charms — one worn at a time, effects deliberately tiny (the gem lesson)
  if(skill === "Woodcutting"){
    if(charmActive("Wren Feather Charm"))  amt = Math.round(amt * 1.05);
    if(charmActive("The Forester's Band")) amt = Math.round(amt * 1.08);
  }
  if(skill === "Mining" && charmActive("Amber Beetle")) amt = Math.round(amt * 1.05);
  const before = levelFor(state.skills[skill]);
  state.skills[skill] += amt;
  floatText(state.px + rand(-4,4), state.py - 22, "+"+amt+" "+skill.slice(0,4).toLowerCase(), "#9fd8ff");
  showXpOrb(skill);   // the circular level-progress ring by the energy bar (10-ui.js)
  const after = levelFor(state.skills[skill]);
  if(after > before){
    let unl = []; for(let l=before+1; l<=after; l++) unl = unl.concat(unlocksAt(skill, l));
    banner("⬆ "+skill+" Lv "+after+"!", unl.length ? ("Unlocked: "+unl.join(", ")) : "Well done.");
    playSfx("level"); pSparkle(state.px, state.py-14, "#8fd3ff", 14); refreshHotbar();
    // a neighbour notices when you cross a mastery tier — one warm line, in their own voice
    for(const tier of [25,50,75,99]) if(before < tier && after >= tier) masteryPraise(skill, tier);
  }
  checkQuests();
}
// The valley acknowledges a milestone. A toast in the relevant neighbour's voice, a beat after the
// level banner so they don't collide. Fires once per tier, naturally, as you cross it.
function masteryPraise(skill, tier){
  const id = MASTERY_NPC[skill]; const line = MASTERY_PRAISE[skill] && MASTERY_PRAISE[skill][tier];
  if(!id || !line) return;
  const name = (NPCDEF[id] && NPCDEF[id].name) || id;
  setTimeout(() => { toast(`${name}: “${line}”`, "#ffe6a0"); playSfx("heart"); }, 1700);
}

// ---- inventory ----
function give(item, n=1, quiet){
  state.inv[item] = (state.inv[item]||0) + n;
  discover(item);   // the Collection remembers everything you've ever held
  // the sprite still pops off the player for juice, but the "+N Item" text now lives in the corner
  // pickup log — off the head, so it never collides with the XP drop from the same action.
  if(!quiet){ pItemPop(state.px, state.py-12, "item_"+item); notePickup(item, n); }
  pledgeHint(item);
}
// The ledger does the remembering, the toasts do the reminding: when you gain something a
// discovered pledge still needs, one quiet nudge — at most once per item per pledge per day.
function pledgeHint(item){
  if(!state.pledges) return;
  for(const id in state.pledges){
    if(pledgeDone(id)) continue;
    const rem = pledgeRemaining(id);
    if(!rem.mats[item]) continue;
    const fk = "phint_" + id + "_" + item;
    if(state.flags[fk] === state.day) return;
    state.flags[fk] = state.day;
    toast(pledgeName(id).replace(/^t/,"T") + " still wants " + rem.mats[item] + "× " + item + ".", "#8fe8c8");
    return;
  }
}
function take(item, n=1){ if((state.inv[item]||0) < n) return false; state.inv[item]-=n; if(state.inv[item]<=0) delete state.inv[item]; return true; }
function bump(stat, n=1){ state.stats[stat] = (state.stats[stat]||0) + n; checkQuests(); }
function near(x,y,d){ return dist2(state.px, state.py, x, y) < d; }
function spendEnergy(n){
  if(state.energy <= 0){ toast("Too tired — eat (F) or sleep.", "#ff8a7a"); playSfx("error"); return false; }
  state.energy = Math.max(0, state.energy - n); refreshHUD(); return true;
}

// ============================== EXAMINE ("look", X) ==============================
// RuneScape's oldest, cheapest joy: press X to look at whatever you face. Flavour lives in the
// EXAMINE* maps (01-data.js). Everything examinable also gets quietly logged as "discovered".
const TILE_NAME  = { 0:"GRASS",1:"DIRT",2:"TILLED",3:"WATERED",4:"WATER",5:"PATH",11:"SAND",12:"FLOWERGRASS",15:"BRIDGE",16:"TALLGRASS" };
const TILE_TITLE = { GRASS:"Grass", DIRT:"Bare Earth", TILLED:"Tilled Soil", WATERED:"Watered Soil", WATER:"Water",
                     PATH:"Path", SAND:"Sand", FLOWERGRASS:"Wildflowers", TALLGRASS:"Tall Grass", BRIDGE:"Bridge" };
const OBJ_TITLE  = { bed:"Bed", campfire:"Campfire", stove:"Stove", fireplace:"Fireplace", counter:"Counter",
  stall:"Market Stall", shipbin:"Shipping Bin", sign:"Sign", noticeboard:"Noticeboard", ledger:"The Valley Ledger",
  fountain:"Fountain", boardwalk:"Boardwalk", railcart:"Minecart", memorial:"Standing Stone", berrybush:"Berry Bush",
  frostberry:"Frostberry Bush", fruittree:"Fruit Tree", beehive:"Beehive", torch:"Torch", lamp:"Lamp", lantern:"Lantern",
  crystal:"Crystal", gemrock:"Gem Rock", sealeddoor:"The Sealed Vault", wing:"Guild Wing", banner:"Guild Banner", ladder:"Ladder", lift:"The Old Lift",
  deadfall:"Deadfall", westtrail:"The Trail West", easttrail:"The Trail Back", waystone:"Waystone", hearttree:"The Heart of the Forest",
  ancient:"Ancient Tree" };
function npcAtTile(tx,ty){ if(!curMap||!curMap.npcs) return null;
  for(const n of curMap.npcs){ if(Math.floor(n.x/TILE)===tx && Math.floor(n.y/TILE)===ty) return n; } return null; }
function objLook(obj){
  const k = obj.kind;
  if(ORES[k])  return { title: ORES[k].name,  text: k==="stone" ? "Plain rock. There's better the deeper you dig." : `A vein of ${ORES[k].drop.replace(" Ore","").toLowerCase()}, waiting on a pick.` };
  if(TREES[k]) return { title: TREES[k].name + " Tree", text: `Good ${TREES[k].drop.toLowerCase()} in it, for an axe with the patience.` };
  if(k==="fruittree"){ const t=FRUIT_TREES[obj.type]; return { title: t?t.name:"Fruit Tree", text: EXAMINE_OBJ.fruittree }; }
  if(k==="ladderdown") return { title:"Ladder Down", text:"Down into the dark, one rung at a time." };
  if(k==="ladderup")   return { title:"Ladder Up",   text:"Back up toward the daylight." };
  if(k==="mineentrance") return { title:"The Old Mine", text:"The mouth of the old mine — ore and gems, and the dark that keeps them." };
  if(k==="deadfall")   return { title:"Deadfall", text:`A great trunk down across the trail, dense as iron with age. An axe and Woodcutting ${obj.lvl} would see you through.` };
  if(k==="westtrail")  return { title:"The Trail West", text:"The deadfall cleared, the old trail runs on into deeper wood." };
  if(k==="easttrail")  return { title:"The Trail Back", text:"Eastward, toward younger trees and the light of the farm." };
  if(k==="waystone"){
    const lit = obj.ws==="way1" || (state.waystones||[]).includes(obj.ws);
    return { title:"Waystone", text: lit ? "A Guild-era waystone, humming faintly green. Step between the stones, free, forever."
      : (state.pledges && state.pledges[obj.ws]) ? "Dormant, but it remembers you. Its pledge waits in your Journal."
      : "A mossy standing stone, carved in the Guild's day. It seems to be waiting for someone." };
  }
  if(k==="hearttree")  return { title:"The Heart of the Forest", text:"The oldest tree in the valley. The grove goes no deeper — nothing does." };
  if(k==="ancient"){ const sp=TREES[obj.species]; return { title:"Ancient "+(sp?sp.name:"Tree"),
    text:"An elder of the deep wood, gold threading its leaves. Twice the timber, for an axe that's earned it." }; }
  const t = EXAMINE_OBJ[k];
  if(t) return { title: OBJ_TITLE[k] || k, text: t };
  return null;
}
function examineFacing(){
  if(!curMap) return null;
  const [tx,ty] = facingTile(); const k = key(tx,ty), tt = tileAt(tx,ty), obj = objAt(tx,ty);
  const crop = curMap.crops[k];
  if(crop){ const c = CROPS[crop.type]; const ripe = crop.days >= c.days;
    return { title:c.name, text: ripe ? (EXAMINE[c.name]||"Ripe and ready.") : `A ${c.name.toLowerCase()} coming along — day ${crop.days} of ${c.days}.` }; }
  const npc = npcAtTile(tx,ty);
  if(npc){ return { title:(NPCDEF[npc.id]&&NPCDEF[npc.id].name)||npc.id, text: EXAMINE_NPC[npc.id]||"One of the valley's own." }; }
  if(obj){ const o = objLook(obj); if(o) return o; }
  const nm = TILE_NAME[tt];
  if(nm) return { title: TILE_TITLE[nm]||nm, text: EXAMINE_TILE[nm]||"" };
  return null;
}
function examine(){
  if(gameMode!=="play" || paused || uiBlocking() || fishing.state!=="idle") return;
  const e = examineFacing();
  if(e && e.text) showExamine(e.title, e.text);
  else showExamine("Hmm.", "Nothing here worth a second look.");
  playSfx("select");
}
function examineItem(name){ showExamine(name, EXAMINE[name] || "Just what it looks like."); playSfx("select"); }

// ============================== USE TOOL (Space) ==============================
// Watering can coverage by tier: 0 = one tile, 1 = a 3-tile row, 2 = a 5-tile row, 3 = a 3x3 block.
// The row is perpendicular to your facing, so you sweep along a bed rather than poking at it.
function canTiles(tx, ty, tier, face){
  if(tier >= 3){ const out=[]; for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++) out.push([tx+ox, ty+oy]); return out; }
  const span = tier === 2 ? 2 : tier === 1 ? 1 : 0;
  const horiz = (face === "up" || face === "down");
  const out = [];
  for(let i=-span; i<=span; i++) out.push(horiz ? [tx+i, ty] : [tx, ty+i]);
  return out;
}

function useTool(){
  if(gameMode!=="play" || paused || uiBlocking()) return;
  const tool = HOTBAR[slotSel].tool;
  const [tx,ty] = facingTile();
  const tt = tileAt(tx,ty), obj = objAt(tx,ty);
  const tier = state.tools[tool]||0, power = TIER_POWER[tier];
  triggerSwing();

  if(tool === "Hoe"){
    if(curMap.id !== "farm"){ toast("This isn't your land to till — crops only grow on the farm."); return; }
    // A better hoe breaks more ground per swing — the tiers used to do nothing whatsoever.
    const tiles = canTiles(tx, ty, tier, state.face).filter(([x,y]) => {
      const t2 = tileAt(x,y);
      return !objAt(x,y) && TILLABLE.has(t2) && !curMap.crops[key(x,y)];
    });
    if(!tiles.length){ if(tt!==T.TILLED && tt!==T.WATERED) toast("Can't till there."); return; }
    if(!spendEnergy(2)) return;
    for(const [x,y] of tiles){ setTile(x,y,T.TILLED); pPuff(x*TILE+8, y*TILE+12, "#7a5734", 6); }
    addXP("Farming", tiles.length); bump("tilled", tiles.length);
    playSfx("till"); cam.shake = 1.5;
    queuePage(1, 600);                                       // "On Soil"
  }
  else if(tool === "Can"){
    if(!spendEnergy(1)) return;
    // A better can waters a wider swathe for the same single press — watering stays a morning
    // ritual, it just stops being a per-tile tax. Row runs perpendicular to the way you face.
    let watered = 0;
    for(const [x,y] of canTiles(tx, ty, tier, state.face)){
      if(tileAt(x,y)===T.TILLED){ setTile(x,y,T.WATERED); watered++; pDrops(x*TILE+8, y*TILE+8, 5); }
    }
    if(watered){ addXP("Farming", watered); bump("watered", watered); playSfx("water"); }
    else toast("Nothing to water there.");
  }
  else if(tool === "Seeds"){
    // a tree or a hive goes in open ground, not a furrow, and it stays there for good
    if(isSapSel(state.seedSel) || isHiveSel(state.seedSel)){ plantPermanent(tx, ty); return; }
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
    // an orchard tree or a hive can be dug up and carried off — so a misplacement is never forever
    if(obj && (obj.kind === "fruittree" || obj.kind === "beehive")){ digUp(tx, ty, obj); return; }
    // the deadfall — the grove's door west. Chopping THROUGH it is the way deeper, and the
    // door pays you: wood and XP on the fell. Its level req is the next ring's soft gate.
    if(obj && obj.kind === "deadfall"){
      if(skillLvl("Woodcutting") < obj.lvl){ toast(`Old, iron-dense wood — Woodcutting ${obj.lvl} to clear it.`, "#ff8a7a"); playSfx("error"); return; }
      if(!spendEnergy(2)) return;
      obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.4; hitstop = 0.05; playSfx("chop");
      pChips(tx*TILE+8, ty*TILE+8, "#6e4a2a", 6);
      if(obj.hp <= 0){
        curMap.objects[key(tx,ty)] = { kind:"westtrail" };       // the map is cached per ring+day, so it stays open till dawn
        give("Wood", 3 + obj.into); addXP("Woodcutting", 15 + 12*obj.into); bump("chopped");
        toast("The deadfall gives way — the trail west lies open.", "#b6f27a"); playSfx("get");
        pLeaves(tx*TILE+8, ty*TILE, "#57ad57", 8);
      }
      refreshHUD(); return;
    }
    // the Ancient tree — one per deep ring per day. An elder of the ring's rarest species:
    // double hp, double timber, double XP (and, from Phase 3, a guaranteed canopy drop).
    if(obj && obj.kind === "ancient"){
      const sp = TREES[obj.species] || TREES.elderwood;
      if(skillLvl("Woodcutting") < sp.lvl){ toast(`This elder is ${sp.name.toLowerCase()} grown old — Woodcutting ${sp.lvl} to touch it.`, "#ff8a7a"); playSfx("error"); return; }
      if(!spendEnergy(2)) return;
      obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.4; hitstop = 0.05; playSfx("chop");
      pChips(tx*TILE+8, ty*TILE+6, "#7a5a34", 5); pLeaves(tx*TILE+8, ty*TILE, "#ffd75a", 4);
      if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)];
        give(sp.drop, sp.n*2 + 1); addXP("Woodcutting", sp.xp*2); bump("chopped");
        floatText(tx*TILE+8, ty*TILE-6, "ancient timber!", "#ffd75a");
        pSparkle(tx*TILE+8, ty*TILE, "#ffd75a", 16); playSfx("get");
        maybeNest(tx, ty, true);                              // an ancient always gives its nest up
      }
      refreshHUD(); return;
    }
    if(!obj || !TREES[obj.kind]){ toast("Face a tree to chop."); return; }
    const tr = TREES[obj.kind];
    if(skillLvl("Woodcutting") < tr.lvl){ toast(`Need Woodcutting ${tr.lvl} for ${tr.name}.`, "#ff8a7a"); playSfx("error"); return; }
    const freeSwing = hasMastery("Woodcutting",25) && chance(0.20);     // ★ Easy Swing
    if(!freeSwing && !spendEnergy(2)) return;
    if(freeSwing) floatText(state.px, state.py-30, "free swing", "#b6f27a");
    let hit = power;
    if(hasMastery("Woodcutting",99) && obj.kind === "oak") hit = 99;    // ★ One Stroke
    obj.hp -= hit; obj.shakeT = 0.2; cam.shake = 2; hitstop = 0.05; playSfx("chop");
    pChips(tx*TILE+8, ty*TILE+6, "#8a5f38", 5); pLeaves(tx*TILE+8, ty*TILE, TREES[obj.kind].pal[1], 4);
    if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)];
      const charmLog = (charmActive("Acorn Ring") && chance(0.08)) || (charmActive("The Forester's Band") && chance(0.10)) ? 1 : 0;
      if(charmLog) floatText(tx*TILE+8, ty*TILE-6, "one more", "#8fe8c8");
      give(tr.drop, tr.n + (hasMastery("Woodcutting",50) ? 1 : 0) + charmLog);   // ★ Clean Fell + the ring's favour
      addXP("Woodcutting", tr.xp); bump("chopped"); playSfx("get");
      if(obj.kind === "pine") queuePage(3, 700);              // "On Pine"
      maybeNest(tx, ty, false);                               // the canopy sometimes answers
    }
  }
  else if(tool === "Pick"){
    const freeSwing = hasMastery("Mining",25) && chance(0.20);          // ★ Sure Grip
    if(obj && (obj.kind==="gemrock" || obj.kind==="crystal")){
      if(!freeSwing && !spendEnergy(2)) return;
      if(freeSwing) floatText(state.px, state.py-30, "free swing", "#b6f27a");
      obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.4; hitstop = 0.05; playSfx("mine");
      pChips(tx*TILE+8, ty*TILE+8, "#6a6472", 5); pSparkle(tx*TILE+8, ty*TILE+8, "#c8a0f0", 4);
      if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)]; const g = pickGem();
        give(g,1);
        addXP("Mining", hasMastery("Mining",75) ? 138 : 55);            // ★ Gemcutter
        bump("mined"); bump("gems"); pSparkle(tx*TILE+8, ty*TILE+8, GEMS[g], 12); playSfx("ore"); }
      refreshHUD(); return;
    }
    if(!obj || !ORES[obj.kind]){ toast("Face a rock to mine."); return; }
    const o = ORES[obj.kind];
    if(skillLvl("Mining") < o.lvl){ toast(`Need Mining ${o.lvl} for ${o.name}.`, "#ff8a7a"); playSfx("error"); return; }
    if(!freeSwing && !spendEnergy(2)) return;
    if(freeSwing) floatText(state.px, state.py-30, "free swing", "#b6f27a");
    let hit = power;
    if(hasMastery("Mining",99)) hit = Math.max(hit, Math.ceil(o.hp/2)); // ★ Stonebreaker — never >2 swings
    obj.hp -= hit; obj.shakeT = 0.2; cam.shake = 2.2; hitstop = 0.05; playSfx("mine");
    pChips(tx*TILE+8, ty*TILE+8, "#9a9a9a", 5);
    if(o.gem) pSparkle(tx*TILE+8, ty*TILE+8, o.gem, 4);
    if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)];
      const n = 1 + (hasMastery("Mining",50) && chance(0.15) ? 1 : 0);  // ★ Rich Seam
      give(o.drop, n); addXP("Mining", o.xp); bump("mined");
      pSparkle(tx*TILE+8, ty*TILE+8, o.gem||"#cfcfcf", n>1?14:8); playSfx("ore"); }
  }
  else if(tool === "Rod"){
    if(tt !== T.WATER){ toast("Face the water to fish."); return; }
    // A storm shuts the open sea, never your own pond — unless you've earned Bram's oilskin, and
    // with it his trust and his boat. Then the storm is just another kind of fishing weather.
    if(isStorm() && curMap.id === "beach" && !state.inv["Bram's Oilskin"]){
      showDialog("The Coast", "The swell is up past the rocks and the rain is coming in sideways. Bram has the boat lashed down and no intention of moving it.\n\nCome back when it blows through — the sea always gives something back.", "port_valley");
      return;
    }
    if(!spendEnergy(1)) return;
    startFishing(tx,ty);
  }
  refreshHUD();
}

// ============================== INTERACT (E) ==============================
function interact(){
  // `paused` covers every fade/handoff window (festival, travel, sleep) where a cutscene has not
  // started yet — without it the player can act during the ~640ms fade and get their scene clobbered
  if(gameMode!=="play" || paused || uiBlocking() || fishing.state === "reel") return;
  const [tx,ty] = facingTile();
  const k = key(tx,ty), tt = tileAt(tx,ty), obj = objAt(tx,ty);

  // door / warp
  const w = warpAt(tx,ty);
  if(w && !w.auto){ doWarp(w); return; }
  // an outdoor door with no warp behind it — a neighbour's latched house (opens in a later chapter).
  // Interior exit doors are excluded (their warp lives on the mat, and the map isn't outdoor).
  if(tt === T.DOOR && curMap.outdoor){ toast("You knock. Quiet inside — nobody's home just now.", "#cbb98f"); return; }

  // harvest crop
  const crop = curMap.crops[k];
  if(crop){
    const c = CROPS[crop.type];
    if(crop.days >= c.days){ delete curMap.crops[k]; setTile(tx,ty,T.TILLED);
      // ★ Bountiful (50) / Fields of Gold (99) — the field starts giving back
      const dbl = hasMastery("Farming",99) ? 0.20 : hasMastery("Farming",50) ? 0.10 : 0;
      const n = 1 + (dbl && chance(dbl) ? 1 : 0);
      give(c.name, n);
      if(n>1) floatText(tx*TILE+8, ty*TILE-6, "double!", "#ffd75a");
      addXP("Farming", c.xp); bump("harvested"); pSparkle(tx*TILE+8, ty*TILE+6, c.pal[3], n>1?18:12); playSfx("harvest"); }
    else toast(`${c.name}: day ${crop.days}/${c.days}${tt===T.WATERED?"":" — needs water"}`);
    return;
  }

  if(obj){
    switch(obj.kind){
      case "bed": if(curMap.id==="cottage") doSleep(); else showDialog("A Bed","Cozy — but not yours. Best sleep in your own cottage.","port_valley"); return;
      case "campfire": case "stove": cook(); return;
      case "counter": case "stall": {
        const r=ensureRel("tom"); if(r.talkedDay!==state.day){ r.talkedDay=state.day; r.points+=10; }
        checkQuests();
        // Tom stands behind the counter and can't be talked to directly, so his turn-ins
        // and his noticeboard requests both have to be reachable from here.
        if(tryTurnIn("tom")) return;
        if(tryFulfillRequest("tom")) return;
        openShop(); return;
      }
      case "shipbin": toast("Shipping bin — sell your goods here.", "#e9dcc0"); openShop("sell", true); return;
      case "sign": showDialog("Weathered Sign", obj.text || "…", "port_sign"); return;
      case "noticeboard": tutTip("tip_board","Someone in the valley wants something small each day. Bring it for coin and goodwill — never required."); showDialog("The Noticeboard", boardText(), "port_sign"); return;
      case "ledger": openProjects(); return;
      case "fountain": tossCoin(); return;
      case "boardwalk": travelTo("beach", 30*TILE+8, 3*TILE, "down"); return;
      case "railcart": {
        // v3: the Minecart Line runs BETWEEN the farm and the village — restored fast travel
        // that finally means something now the town is a real walk away.
        toast("The cart rattles down the old rails…", "#cbb98f");
        if(curMap.id === "village") travelTo("farm", CART_A[0]*TILE+8, (CART_A[1]+1)*TILE+8, "up");
        else travelTo("village", 35*TILE+8, 15*TILE+8, "up");   // land below the village cart
        return;
      }
      case "memorial": state.flags.memorialRead = true;
        openLetter("✒ Carved into the standing stone", LETTER_MEMORIAL); return;
      case "berrybush": forageNode(tx,ty,obj,"Field Salad","Farming",6); return;
      case "frostberry": forageNode(tx,ty,obj,"Frostberry","Farming",14); return;
      case "fruittree": {
        const t = FRUIT_TREES[obj.type]; if(!t) return;
        const age = obj.age || 0;
        if(age < TREE_MATURE_DAYS){
          toast(`${t.name} — ${age}/${TREE_MATURE_DAYS} days. Give it time.`, "#8fd06a"); return; }
        if(!obj.fruit){
          toast(curSeason() === t.season ? "Nothing ripe today. Tomorrow." : `A ${t.name} bears in ${t.season}.`);
          return; }
        const n = obj.fruit; obj.fruit = 0;
        give(t.fruit, n); addXP("Farming", 14*n); bump("harvested", n);
        playSfx("harvest"); pSparkle(tx*TILE+8, ty*TILE, t.pal[2], 6*n);
        return;
      }
      case "beehive": {
        if(!obj.honey){
          toast(curSeason()==="Winter" ? "The bees are wintering. Nothing until spring."
                                       : "The comb is still filling."); return; }
        const n = obj.honey; obj.honey = 0;
        give("Honey", n); addXP("Farming", 12*n); bump("harvested", n);
        playSfx("get"); pSparkle(tx*TILE+8, ty*TILE, "#e8a83a", 6*n);
        return;
      }
      case "wrack": {                                  // what the storm took, the sea returns
        if(obj.pickedDay === state.day){ toast("Only weed and sand left in this one."); return; }
        obj.pickedDay = state.day;
        const r = Math.random();
        const item = r < 0.12 ? "Pearl" : r < 0.38 ? "Coral" : r < 0.62 ? "Clam" : r < 0.86 ? "Shell" : "Seaweed";
        give(item, 1); addXP("Fishing", 22); bump("forage");
        playSfx(item==="Pearl" ? "ore" : "get");
        pSparkle(tx*TILE+8, ty*TILE+6, item==="Pearl" ? "#e8f4ff" : "#8fd06a", item==="Pearl" ? 16 : 7);
        if(item === "Pearl") floatText(state.px, state.py-30, "a pearl!", "#e8f4ff");
        return;
      }
      case "shellnode": forageNode(tx,ty,obj, chance(0.5)?"Shell":"Clam","Fishing",8); return;
      case "seaweednode": forageNode(tx,ty,obj,"Seaweed","Fishing",6); return;
      case "coralnode": forageNode(tx,ty,obj, chance(0.12)?"Pearl":"Coral","Fishing",12); return;
      case "ladderup": mineUp(); return;
      case "lift": openLift(); return;
      case "ladderdown": mineDown(); return;
      case "mineentrance": enterMine(); return;
      case "westtrail": groveDeeper(); return;
      case "easttrail": groveBack(); return;
      case "deadfall": toast(`A great deadfall seals the trail west. (Axe — Woodcutting ${obj.lvl})`, "#cbb98f"); return;
      case "waystone": useWaystone(tx,ty,obj); return;
      case "hearttree": showDialog("The Heart of the Forest",
        "The oldest tree in the valley — older than the Guild, older than the road. Its pale bark is warm under your palm, and for a moment the whole wood seems to hold its breath.\n\nSomething sleeps here. Not yet, but someday.", "port_valley"); return;
      case "sealeddoor": openVault(tx,ty); return;
      case "chest": openChest(); return;
      case "desk": showDialog("Rowan's Desk","Ledgers and a map of nine dark wings. The old keeper must be near.","port_rowan"); return;
      case "bush": toast("A tidy little bush."); return;
    }
  }

  const a = nearestAnimal(24);
  if(a){ a.species==="cow" ? petCow(a) : petChicken(a); return; }
  const n = nearestNpc(28);
  if(n){ talkNpc(n.id); return; }

  toast("Nothing here. (Space uses your tool)");
}

function forageNode(x, y, obj, item, skill, xp){
  if(obj.pickedDay === state.day){ toast("Already gathered here today."); return; }
  obj.pickedDay = state.day;
  let n = isRain() ? 2 : 1;                       // rain swells everything that grows wild — today only
  if(charmActive("Moss Locket") && chance(0.2)){ n++; floatText(x*TILE+8, y*TILE-10, "the moss approves", "#8fe8c8"); }
  give(item, n); addXP(skill, xp); bump("forage", n); playSfx("get");
  if(isRain() && n > 1) floatText(x*TILE+8, y*TILE-4, "the rain was kind", "#8fd3ff");
  pSparkle(x*TILE+8, y*TILE+6, "#8fd06a", n>1 ? 10 : 6);
}

// ---- canopy nests (Grove Depths Phase 3) ----
// Felling a grove tree sometimes shakes a nest loose — RS's birds' nests, in forest language.
// Tiers: seeds/food (most), a charm (uncommon), a fruit sapling (rare), and once per valley,
// the old Forester's Band. Ancients always drop one, never from the common tier.
function maybeNest(tx, ty, guaranteed){
  if(curMap.id !== "grove") return;
  const ring = state.groveRing || 1;
  if(!guaranteed && Math.random() >= nestChance(ring)) return;
  // weighted tier roll — deeper rings tilt away from the common tier
  const w = [
    ["common", guaranteed ? 0 : 78 - ring*2],
    ["charm",  16 + ring*1.5],
    ["rare",   5 + ring*0.5],
    ["band",   state.flags.foundBand ? 0 : 0.4],
  ];
  let t = 0; for(const [,x] of w) t += x;
  let r = Math.random()*t, tier = "common";
  for(const [k,x] of w){ if((r -= x) < 0){ tier = k; break; } }
  // the band and charms fall through sensibly when already owned
  if(tier === "band" && state.flags.foundBand) tier = "charm";
  if(tier === "charm"){
    const unowned = Object.keys(CHARMS).filter(c => c !== "The Forester's Band" && !state.discovered[c]);
    if(!unowned.length) tier = "rare";
  }
  playSfx("get"); pLeaves(tx*TILE+8, ty*TILE-4, "#8a9a5a", 8);
  if(tier === "common"){
    if(chance(0.6)){
      const seasonal = Object.values(CROPS).filter(c => c.seasons.includes(curSeason()));
      const c = seasonal[Math.floor(Math.random()*seasonal.length)];
      if(c){ give(c.name+" Seeds", 3); toast("A nest tumbles down — someone was hoarding seeds.", "#cbb98f"); }
    } else { give("Berry Bun", 2); toast("A nest tumbles down — berries, baked hard by the sun. Pip would approve.", "#cbb98f"); }
    return;
  }
  if(tier === "charm"){
    const unowned = Object.keys(CHARMS).filter(c => c !== "The Forester's Band" && !state.discovered[c]);
    const c = unowned[Math.floor(Math.random()*unowned.length)];
    give(c, 1);
    banner("🪺 Something glints in the nest", c + " — " + CHARMS[c].effect + ". Wear it from your Backpack (I).");
    playSfx("quest"); pSparkle(tx*TILE+8, ty*TILE-6, "#8fe8c8", 14);
    return;
  }
  if(tier === "rare"){
    const keys = Object.keys(FRUIT_TREES), k = keys[Math.floor(Math.random()*keys.length)];
    give(FRUIT_TREES[k].name, 1);
    banner("🪺 A living nest", "A " + FRUIT_TREES[k].name.toLowerCase() + " sapling, canopy-grown. The orchard just got bigger.");
    playSfx("quest"); pSparkle(tx*TILE+8, ty*TILE-6, "#8fd06a", 14);
    return;
  }
  // the band — once, ever
  state.flags.foundBand = true;
  give("The Forester's Band", 1, true);
  banner("✦ The Forester's Band ✦", "The old forester's ring, kept safe by generations of wrens. The whole wood remembers.");
  playSfx("legend"); pSparkle(tx*TILE+8, ty*TILE-6, "#ffd75a", 24);
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
  queuePage(8, 1600);                                          // "On the Vault"
  checkQuests();
}

// ---- waystones ----
// Touching a dormant stone DISCOVERS it — permanently, for free, before any cost talk. The trek
// is banked the moment you arrive (the owner's no-wasted-trips rule); paying happens whenever,
// from wherever, through the Pledge Ledger.
function useWaystone(tx, ty, obj){
  const id = obj.ws;
  if(!pledgeDone(id) && !(state.pledges && state.pledges[id])){
    if(!state.pledges) state.pledges = {};
    state.pledges[id] = { gPaid:0, mats:{} };
    playSfx("quest"); pSparkle(tx*TILE+8, ty*TILE, "#8fe8c8", 14);
    banner("❖ The stone remembers you", "Its pledge is in your Journal — fund it from anywhere, a little at a time.");
    saveGame();
  }
  openWaystone(id);
}

// ---- cooking ----
function cook(){ openCooking(); }
function cookRecipe(i){
  const r = RECIPES[i]; if(!r) return;
  if(skillLvl("Cooking") < r.lvl){ toast(`Need Cooking ${r.lvl} to make ${r.name}.`, "#ff8a7a"); playSfx("error"); return; }
  if(!Object.keys(r.ing).every(it => (state.inv[it]||0) >= r.ing[it])){ toast("Missing ingredients."); playSfx("error"); return; }
  for(const it in r.ing) take(it, r.ing[it]);
  const n = 1 + (hasMastery("Cooking",25) && chance(0.15) ? 1 : 0);   // ★ Second Helping
  give(r.name, n, true); addXP("Cooking", r.xp); bump("cooked");
  toast(n>1 ? `Cooked ${r.name} — and a second plate!` : "Cooked "+r.name+"!", "#ffce5a");
  playSfx("get"); pSparkle(state.px, state.py-14, r.col, n>1?14:8);
  renderCooking(); refreshHUD();
}
// ★ Hearth Warmth (50) — a cooked dish goes further
const RECIPE_NAMES = new Set(RECIPES.map(r => r.name));
function foodEnergy(item){
  let e = EDIBLE[item] || 0;
  if(hasMastery("Cooking",50) && (RECIPE_NAMES.has(item) || item.startsWith("Cooked "))) e = Math.round(e * 1.2);
  return e;
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
  const e = foodEnergy(item);
  take(item); state.energy = Math.min(100, state.energy + e);
  floatText(state.px, state.py-18, "+"+e+" energy", "#b6f27a");
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
  if(hasMastery("Fishing",25)) fishing.t *= 0.75;              // ★ Still Water
  if(isRain()) fishing.t *= 0.6;                               // rain brings them up
  if(state.inv["Bram's Oilskin"]) fishing.t *= 0.7;           // the master's touch — the fish come to you
  playSfx("splash"); pSplash(tx*TILE+8, ty*TILE+8, 8); toast("Cast… wait for the !");
}
function updateFishing(dt){
  if(fishing.state === "idle") return;
  if(fishing.state === "wait"){ fishing.t -= dt;
    if(fishing.t <= 0){ fishing.state = "bite"; fishing.biteWin = 0.8 + state.tools.Rod*0.15; playSfx("bite"); } }
  else if(fishing.state === "bite"){ fishing.biteWin -= dt;
    if(fishing.biteWin <= 0){ endFishing(); toast("It got away…", "#ff8a7a"); } }
  else if(fishing.state === "reel") updateReel(dt);
}
function reelOrCatch(){
  if(fishing.state === "bite") hookFish();
  else if(fishing.state === "wait"){ endFishing(); toast("Reeled in early."); }
}
function endFishing(){ fishing.state = "idle"; fishing.fish = null; fishHold = false; setReelUI(false); }

// The bite is hooked: pick the fish, then open the reel-in minigame.
// which water you're standing at
const waterHere = () => curMap.id === "beach" ? "coast" : "pond";
// the raw clock hour, 6..26 — night wraps past midnight, which is why we don't use curHour()
const fishHour = () => state.time / 60;

// A legend rises only when everything lines up: the right water, the right hours, the right
// weather, the right season — and only until you've landed it once.
function legendHere(){
  const where = waterHere(), h = fishHour(), season = curSeason(), lvl = skillLvl("Fishing");
  return LEGENDS.find(l =>
    !state.flags["caught_" + l.id] &&
    l.where === where &&
    h >= l.from && h < l.to &&
    l.weather === state.weather &&
    (l.season === null || l.season === season) &&
    lvl >= l.lvl - 4                       // a little grace, so a clue is never a dead end
  ) || null;
}
const isLegend = f => !!(f && f.id && LEGEND_BY_ID[f.id]);

function hookFish(){
  const lvl = skillLvl("Fishing");
  const coastBonus = curMap.id === "beach" ? 1 : 0;      // better fish on the coast

  // ---- the hunt ----
  const L = legendHere();
  if(L && chance(L.chance)){
    fishing.state = "reel"; fishing.fish = L;
    fishing.barH  = 0.19 + state.tools.Rod*0.035;
    if(hasMastery("Fishing",50)) fishing.barH *= 1.15;
    fishing.barY  = 0.40; fishing.barV = 0;
    fishing.fishY = 0.50; fishing.fishV = 0; fishing.fishTarget = 0.5; fishing.fishTimer = 0;
    fishing.prog  = REEL.start; fishing.outT = 0;
    fishing.diff  = fishDiff(L);
    fishHold = false; setReelUI(true);
    playSfx("level"); cam.shake = 3;
    toast(`Something enormous. Hold on.`, "#ffd75a");
    return;
  }

  // ---- the ordinary catch: the pond and the coast hold different fish ----
  const names = WATER[waterHere()] || WATER.coast;
  let pool = names.map(n => FISH.find(x => x.name === n)).filter(f => f && f.lvl <= lvl);
  if(!pool.length) pool = [FISH[0]];
  pool.sort((a,b) => a.sell - b.sell);
  const night = fishHour() >= 20 || fishHour() < 6 ? 0.7 : 0;   // the big ones move after dark
  let idx = Math.min(pool.length-1, Math.floor(Math.random()*pool.length + Math.random()*(1.3+coastBonus+night)));
  let f = pool[idx] || pool[0];
  // ★ Deep Caller (99) — the deep sometimes sends up something better
  if(hasMastery("Fishing",99) && chance(0.25)){
    const better = pool.filter(x => x.sell > f.sell).sort((a,b)=>a.sell-b.sell)[0];
    if(better) f = better;
  }

  fishing.state = "reel"; fishing.fish = f;
  fishing.barH  = 0.19 + state.tools.Rod*0.035;   // a better rod grips more of the line
  if(hasMastery("Fishing",50)) fishing.barH *= 1.15;           // ★ Steady Hand
  fishing.barY  = 0.40; fishing.barV = 0;
  fishing.fishY = 0.50; fishing.fishV = 0; fishing.fishTarget = 0.5; fishing.fishTimer = 0;
  fishing.prog  = REEL.start; fishing.outT = 0;
  fishing.diff  = fishDiff(f);                    // rarer fish fight harder
  fishHold = false; setReelUI(true);
  playSfx("bite"); toast("Hooked! Hold to reel — keep it in the green.", "#8fd3ff");
}

/* The fight is a tug of war between a heavy bar and a darting fish:
   the bar has real inertia (you overshoot), the fish turns on a dime. */
const REEL = { barDrag:0.02, fishDrag:0.001, pull:4.2, sink:3.4,
               swim:6.0, dart:1.0, fill:0.28, drain:0.24, start:0.32, perfectT:0.8,
               diffBase:0.55, diffPer:0.019, tire:0.045, tireFloor:0.45 };
// A fish must never out-swim the bar outright, or the fight is unwinnable. The bar's terminal
// speed is pull/-ln(barDrag) = 1.074; a fish's is swim*diff/-ln(fishDrag). Anything above
// diff 1.236 can never be caught, so the clamp is a hard guard on the data, not a suggestion.
const DIFF_MAX = 1.20;
const fishDiff = f => Math.min(DIFF_MAX, REEL.diffBase + f.lvl*REEL.diffPer);

function updateReel(dt){
  const F = fishing;
  dt = Math.min(dt, 0.05);                        // a hitched frame shouldn't cost you the fish
  const bDrag = Math.pow(REEL.barDrag,  dt);      // frame-rate independent damping
  const fDrag = Math.pow(REEL.fishDrag, dt);

  F.diff = Math.max(F.diff*(1 - REEL.tire*dt), REEL.tireFloor);   // it tires as the fight drags on

  // the fish picks its own depths, and sometimes bolts for them
  F.fishTimer -= dt;
  if(F.fishTimer <= 0){
    F.fishTimer  = rand(0.25, 0.80) / F.diff;
    F.fishTarget = rand(0.06, 0.94);
    if(chance(0.35*F.diff)) F.fishV += Math.sign(F.fishTarget - F.fishY) * REEL.dart * F.diff;
  }
  F.fishV += Math.sign(F.fishTarget - F.fishY) * REEL.swim * F.diff * dt;
  F.fishV *= fDrag;
  F.fishY  = clamp(F.fishY + F.fishV*dt, 0.02, 0.98);
  if(F.fishY <= 0.02 || F.fishY >= 0.98) F.fishV *= -0.4;

  // your catch bar rises while you hold and sinks when you let go
  F.barV += (keys[" "] || fishHold ? -REEL.pull : REEL.sink) * dt;
  F.barV *= bDrag;
  F.barY += F.barV * dt;
  const maxY = 1 - F.barH;
  if(F.barY < 0){    F.barY = 0;    F.barV *= -0.25; }
  if(F.barY > maxY){ F.barY = maxY; F.barV *= -0.25; }

  const inside = F.fishY >= F.barY && F.fishY <= F.barY + F.barH;
  if(!inside) F.outT += dt;                       // a clean fight barely loses the fish at all
  F.prog += (inside ? REEL.fill : -REEL.drain) * dt;

  if(F.prog >= 1) landFish();
  else if(F.prog <= 0){ endFishing(); toast("The line went slack… it's gone.", "#ff8a7a"); playSfx("escape"); }
}

function landFish(){
  const f = fishing.fish;
  const tol = REEL.perfectT * (hasMastery("Fishing",75) ? 2 : 1);   // ★ Angler's Eye
  const perfect = fishing.outT < tol;
  const legend = isLegend(f);
  endFishing();

  if(legend){
    state.flags["caught_" + f.id] = true;
    bump("legends", 1);
    give(f.name, 1); bump("fished");
    addXP("Fishing", f.xp);
    playSfx("legend"); pSparkle(state.px, state.py-16, f.pal[1], 30); cam.shake = 2;   // bespoke fanfare, contained shake
    pItemPop(state.px, state.py-14, "item_"+f.name);   // the trophy leaps off the line with an apex pop
    banner("✦ " + f.name + " ✦", "You've landed a legend. Bram will want to hear about this.");
    setTimeout(() => toast(`${legendsCaught()}/${LEGENDS.length} legends — the Almanac remembers.`, "#ffd75a"), 900);
    return;
  }

  give(f.name, 1); bump("fished");
  addXP("Fishing", f.xp + (perfect ? Math.round(f.xp*0.5) : 0));
  if(perfect){ give(f.name, 1); floatText(state.px, state.py-30, "PERFECT!", "#ffd75a"); }
  if(curMap.id === "beach" && chance(0.15)) give(pick(["Shell","Coral","Seaweed"]), 1);
  playSfx("catch"); pSparkle(state.px, state.py-16, "#8fd3ff", perfect ? 18 : 10);
  if(f.name === "Salmon") queuePage(4, 900);                  // "On Salmon"
}
function legendsCaught(){ return LEGENDS.filter(l => state.flags["caught_"+l.id]).length; }
function cluesKnown(){ return LEGENDS.filter(l => state.flags["clue_"+l.id]).length; }

// ============================== DAY CYCLE ==============================
let sleeping = false;
function doSleep(){
  if(sleeping || isCutscene() || state.flags.festivalActive || state.flags.festivalPending || state.flags.seasonalActive) return;
  sleeping = true; paused = true; playSfx("sleep");
  fadeTo(true, () => {
    const summary = newDay();
    if(!curMap || curMap.id !== "cottage") setMap("cottage", 5*TILE+8, 6*TILE, "down");  // always wake at home
    showSleepCard(summary);
  });
}
function newDay(){
  const farm = state.farm, wasRain = state.weather === "rain";
  const wasStorm = state.weather === "storm";      // the sea gives it back the morning after
  // married: your spouse tends a few crops overnight (and sometimes leaves breakfast)
  let spouseTended = 0;
  if(state.flags.married){
    for(const k in farm.crops){ const [cx,cy] = k.split(",").map(Number);
      if(farm.tiles[cy*W+cx]===T.TILLED && spouseTended < 5){ farm.tiles[cy*W+cx]=T.WATERED; spouseTended++; } }
    if(chance(0.4)) give(pick(spouseId()==="bram"
      ? ["Cooked Salmon","Cooked Bass","Fish Stew","Cooked Trout"]
      : ["Berry Bun","Field Salad","Bread","Fried Egg"]), 1, true);
  }
  let grew = 0, ready = 0;
  const surge = hasMastery("Farming",75);            // ★ Green Thumb — sometimes two days in one night
  for(const k in farm.crops){
    const [cx,cy] = k.split(",").map(Number);
    const c = farm.crops[k], cfg = CROPS[c.type];
    if((farm.tiles[cy*W+cx]===T.WATERED || wasRain) && c.days < cfg.days){
      c.days++; grew++;
      if(surge && chance(0.15) && c.days < cfg.days) c.days++;
      if(c.days>=cfg.days) ready++;
    }
  }
  // ★ Deep Roots (25) — some watered soil holds its water through the night
  const roots = hasMastery("Farming",25);
  for(let i=0;i<W*H;i++) if(farm.tiles[i]===T.WATERED && !(roots && chance(0.25))) farm.tiles[i]=T.TILLED;
  clearMapCache();                  // beach/mine refresh once per day
  const oldSeason = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  state.day++; state.time = 6*60; state.energy = 100;
  // Tom's shelves half-empty overnight — the glut recovers, but not all at once, so you can't
  // sell out a hoard by dumping and then fully reset with a night's sleep.
  for(const it in state.market){
    const left = Math.floor(state.market[it] * DEMAND.overnight);
    if(left > 0) state.market[it] = left; else delete state.market[it];
  }
  const newSeason = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  let withered = 0, seasonChanged = newSeason !== oldSeason;
  if(seasonChanged){
    for(const k in farm.crops){ if(!CROPS[farm.crops[k].type].seasons.includes(newSeason)){ delete farm.crops[k]; withered++; } }
    state.stats.bestCropSold = 0; state.flags.bestCropName = "";   // a fresh field for the Harvest Fair
  }
  respawnNodes(farm);               // after the day rolls, so it sees the season you wake into
  const orchard = tendOrchard(farm);// trees age; the ones in season set fruit; the hives fill
  const built = completeProjects(); // Rowan's crews worked through the night
  applyProjects(farm);              // re-try any placement a crop was sitting on yesterday
  rollWeather();                    // today becomes what was forecast last night; tomorrow is re-rolled
  // Rain waters your fields. Snow does not — the ground is frozen, and the Almanac says so plainly.
  if(state.weather === "rain"){ for(let i=0;i<W*H;i++) if(farm.tiles[i]===T.TILLED) farm.tiles[i]=T.WATERED; }
  state.flags.stormWrack = wasStorm;   // one day only; the beach regenerates nightly
  saveGame();
  return { grew, ready, rain: state.weather === "rain", withered, season: seasonChanged ? newSeason : null,
           spouse: spouseTended, built, weather: state.weather, forecast: state.forecast, wrack: wasStorm,
           fruited: orchard.fruited, honeyed: orchard.honeyed };
}
// true if (tx,ty) is a door tile or one of the two tiles below it — the walkable approach a
// solid, permanent object must never occupy (mirrors genFarm's own doorway-clearing pass).
function nearDoorway(tx, ty){
  if(!curMap) return false;
  for(const wk in curMap.warps){
    const [dx,dy] = wk.split(",").map(Number);
    if(tx === dx && (ty === dy || ty === dy+1 || ty === dy+2)) return true;
  }
  return false;
}

// Dig up a tree or hive with the Axe. You get the item back (a sapling loses its growth — that's
// the cost of moving it), and any ripe fruit or honey still on it drops into your pack.
function digUp(tx, ty, obj){
  if(!spendEnergy(2)) return;
  if(obj.kind === "beehive"){
    if(obj.honey > 0){ give("Honey", obj.honey); }
    give("Beehive", 1, true);
    toast("You lift the hive. The bees will settle wherever you set it down.", "#e8a83a");
  } else {
    const t = FRUIT_TREES[obj.type];
    if(obj.fruit > 0 && t){ give(t.fruit, obj.fruit); }
    give(t ? t.name : "Cherry Tree", 1, true);
    toast(obj.age >= TREE_MATURE_DAYS
      ? "You dig the tree up. Replanting it means starting the season's wait again."
      : "You dig the young sapling up to move it.", "#8fd06a");
  }
  delete curMap.objects[key(tx,ty)];
  playSfx("chop"); pChips(tx*TILE+8, ty*TILE+6, "#8a5f38", 6);
  normalizeSeedSel(); refreshHotbar(); refreshHUD();
}

// ---- the orchard and the apiary ----
function plantPermanent(tx, ty){
  if(curMap.id !== "farm"){ toast("This isn't your land — plant it on the farm."); return; }
  const tt = tileAt(tx,ty);
  if(!TILLABLE.has(tt) && tt !== T.TILLED){ toast("Needs open ground."); playSfx("error"); return; }
  if(objAt(tx,ty) || curMap.crops[key(tx,ty)]){ toast("Something's already there."); playSfx("error"); return; }
  if(typeof isReservedFarmTile === "function" && isReservedFarmTile(tx,ty)){
    toast("Not there — the valley has plans for that spot."); playSfx("error"); return; }
  // a tree or hive is permanent and solid, so it must never wall off a door
  if(nearDoorway(tx,ty)){ toast("Too close to a doorway — plant it out in the open."); playSfx("error"); return; }

  // every refusal happens BEFORE the energy is spent
  const hive = isHiveSel(state.seedSel);
  if(hive && Object.values(curMap.objects).filter(o => o.kind === "beehive").length >= HIVE_MAX){
    toast("Four hives is all the valley's flowers can carry."); playSfx("error"); return; }
  const sap = hive ? null : FRUIT_TREES[state.seedSel.slice(4)];
  if(!hive && !sap){ toast("Nothing to plant."); playSfx("error"); return; }
  if((state.inv[hive ? "Beehive" : sap.name] || 0) < 1){ toast("You don't have one."); playSfx("error"); return; }
  if(!spendEnergy(2)) return;

  if(hive){
    take("Beehive");
    curMap.objects[key(tx,ty)] = { kind:"beehive", honey:0 };
    setTile(tx,ty, T.GRASS);
    toast("The hive is set. Bees like flowers — the more nearby, the more honey.", "#e8a83a");
  } else {
    take(sap.name);
    curMap.objects[key(tx,ty)] = { kind:"fruittree", type:state.seedSel.slice(4), age:0, fruit:0 };
    setTile(tx,ty, T.GRASS);
    toast(`${sap.name} planted. It'll be a season before it bears.`, "#8fd06a");
  }
  addXP("Farming", 20); playSfx("plant");
  pSparkle(tx*TILE+8, ty*TILE+8, "#8fd06a", 10);
  normalizeSeedSel(); refreshHotbar(); refreshHUD();
}

// how much a hive makes tomorrow: one comb, plus more where there's more in bloom.
// Flowering ground and berry bushes both count — and a flower tile is a tile you didn't farm.
function hiveYield(farm, hx, hy){
  if(curSeason() === "Winter") return 0;                  // the bees are wintering
  let flowers = 0;
  for(let y=hy-HIVE_RADIUS; y<=hy+HIVE_RADIUS; y++)
    for(let x=hx-HIVE_RADIUS; x<=hx+HIVE_RADIUS; x++){
      if(x<0||y<0||x>=W||y>=H) continue;
      if(farm.tiles[y*W+x] === T.FLOWERGRASS) flowers++;
      const c = farm.crops[key(x,y)];
      if(c && CROPS[c.type] && CROPS[c.type].shape === "bush") flowers++;
    }
  // one comb always; a second and third only for a genuinely flower-rich spot. Reaching the cap
  // across four hives would take ~120 flowering tiles — tiles you chose not to farm.
  return 1 + (flowers >= 14 ? 1 : 0) + (flowers >= 30 ? 1 : 0);
}

// runs each night, after the season has rolled
function tendOrchard(farm){
  let fruited = 0, honeyed = 0;
  for(const k0 in farm.objects){
    const o = farm.objects[k0];
    if(o.kind === "fruittree"){
      o.age = (o.age||0) + 1;
      const t = FRUIT_TREES[o.type];
      if(t && o.age >= TREE_MATURE_DAYS && curSeason() === t.season && (o.fruit||0) < TREE_FRUIT_CAP){
        o.fruit = (o.fruit||0) + 1; fruited++;
      }
    } else if(o.kind === "beehive"){
      const [x,y] = k0.split(",").map(Number);
      const y2 = hiveYield(farm, x, y);
      if(y2 > 0 && (o.honey||0) < HIVE_CAP){ o.honey = Math.min(HIVE_CAP, (o.honey||0) + y2); honeyed++; }
    }
  }
  return { fruited, honeyed };
}

function respawnNodes(m){
  const rng = Math.random;
  const trees = Object.values(m.objects).filter(o=>TREES[o.kind]).length;
  const rocks = Object.values(m.objects).filter(o=>ORES[o.kind]).length;

  // Winter takes the crops, so the valley gives frostberries instead. They melt away in spring.
  const winter = curSeason() === "Winter";
  if(!winter){ for(const k in m.objects) if(m.objects[k].kind === "frostberry") delete m.objects[k]; }
  else {
    const bushes = Object.values(m.objects).filter(o=>o.kind==="frostberry").length;
    for(let i=0;i<3 && bushes+i<10;i++){
      const x=2+Math.floor(rng()*42), y=17+Math.floor(rng()*17), k=key(x,y), g=m.tiles[y*W+x];
      if(isReservedFarmTile(x,y)) continue;    // the memorial (and its lanterns) live in this band
      if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]&&!m.crops[k]) m.objects[k]={kind:"frostberry"};
    }
  }
  const regrow = 5 + (hasMastery("Woodcutting",75) ? 2 : 0);   // ★ Steward
  for(let i=0;i<regrow && trees+i<44;i++){
    const x=2+Math.floor(rng()*20), y=19+Math.floor(rng()*16), k=key(x,y), g=m.tiles[y*W+x];
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]&&!m.crops[k]){
      const r=rng(), kind=r<.55?"oak":r<.82?"pine":"maple"; m.objects[k]={kind,hp:TREES[kind].hp};
    }
  }
  for(let i=0;i<4 && rocks+i<24;i++){
    const x=26+Math.floor(rng()*18), y=1+Math.floor(rng()*4), k=key(x,y), g=m.tiles[y*W+x];
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]){
      const r=rng(), kind=r<.4?"stone":r<.75?"copper":r<.92?"iron":"gold"; m.objects[k]={kind,hp:ORES[kind].hp};
    }
  }
}
function updateTime(dt){
  if(gameMode!=="play" || paused) return;
  // The Harvest Moon rule: time stands still underground — you can't see the sun, and getting
  // yanked to bed mid-vein was the least satisfying moment in the game (owner playtest,
  // 2026-07-12). Energy still drains per swing; that's the mine's honest limiter.
  if(curMap && curMap.id === "mine") return;
  state.time += dt * (60/16);
  if(curMap && curMap.music === "auto"){ const h = state.time/60; setMusicMode(nightFactor(h)>0.55 ? "night" : "day"); }
  if(state.time >= 26*60){ toast("You stayed up far too late…", "#ff8a7a"); doSleep(); }
}

// ============================== ECONOMY ==============================
const FISH_NAMES = new Set(FISH.map(f => f.name)
  .concat(FISH.map(f => "Cooked "+f.name))
  .concat(LEGENDS.map(l => l.name)));

// what one unit of `item` is worth right now, before demand — season and mastery bonuses included
function baseUnitPrice(item){
  let p = ITEM_SELL[item] || 0;
  // the cold firms the flesh — winter fish fetch a premium, which is what a winter is for
  if(curSeason()==="Winter" && FISH_NAMES.has(item)) p *= 1.25;
  // ★ Renowned (Cooking 99) — your name on a dish is worth something
  if(hasMastery("Cooking",99) && RECIPE_NAMES.has(item)) p *= 1.25;
  return p;
}
function soldToday(item){ return (state.market && state.market[item]) || 0; }
// the price Tom will pay for the very next one
function nextUnitPrice(item){ return Math.round(baseUnitPrice(item) * demandMult(item, soldToday(item))); }
// 0..1 — how saturated Tom is on this item today (for the shop UI)
function demandLevel(item){ return demandMult(item, soldToday(item)); }
// what selling `n` of `item` right now would ACTUALLY fetch, blended across the sliding price
function bundlePrice(item, n){
  const base = baseUnitPrice(item), already = soldToday(item);
  let g = 0; for(let k = 0; k < n; k++) g += base * demandMult(item, already + k);
  return Math.round(g);
}

function sellItem(item, n){
  n = Math.min(n, state.inv[item]||0); if(n<=0) return;
  take(item, n);
  if(!state.market) state.market = {};

  const base = baseUnitPrice(item);
  const already = soldToday(item);
  let gain = 0;
  for(let k = 0; k < n; k++) gain += base * demandMult(item, already + k);
  gain = Math.round(gain);
  state.market[item] = already + n;

  const full = Math.round(base * n);
  const discounted = gain < full;

  state.gold += gain; bump("earned", gain); bump("sold", n);
  // the Harvest Fair judges the finest crop you brought to market this season (on merit, not on price)
  if(CROP_NAMES.has(item) && (ITEM_SELL[item]||0) > (state.stats.bestCropSold||0)){
    state.stats.bestCropSold = ITEM_SELL[item];
    state.flags.bestCropName = item;
  }
  const winterFish = curSeason()==="Winter" && FISH_NAMES.has(item);
  let note = winterFish ? " · winter price" : "";
  if(discounted) note += ` · ${Math.round(gain/full*100)}% — the market's full of ${item}`;
  toast(`Sold ${n} ${item} (+${gain}g)` + note, discounted ? "#e0b46a" : "#ffce5a");
  if(discounted && soldToday(item) >= demandFree(item) + 12 && chance(0.4)) setTimeout(() =>
    toast(pick(TOM_GLUT).replace(/\{item\}/g, item), "#e9dcc0"), 700);
  playSfx("sell"); refreshHUD(); renderShop();
}

const TOM_GLUT = [
  "Tom: “I can't shift this many {item}, farmer. Bring me something else tomorrow.”",
  "Tom: “Another {item}. My window looks like a {item} museum.”",
  "Tom: “I'll take it, but the price is the price. Nobody in this valley wants more {item} today.”",
  "Tom: “You know what sells? Variety. Ask anyone. Ask me. I just said it.”",
];
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
  const c = toolCost(tool, cur+1);
  if(state.gold < c.g || !Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it])) return;
  state.gold -= c.g;
  for(const it in c.mats) take(it, c.mats[it]);
  state.tools[tool] = cur+1; bump("toolUpgrades");
  banner("🔧 "+TOOL_TIERS[cur+1]+" "+tool+"!", cur+1===3 ? "The "+TIER3_GEM[tool]+" is set into the handle. Earned across every craft." : "Faster, stronger, cozier.");
  playSfx("upgrade"); pSparkle(state.px, state.py-14, "#ffce5a", 12); refreshHUD(); renderShop(); refreshHotbar();
}
