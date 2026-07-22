"use strict";
/* ============================================================
   08-actions.js — tools, interactions, economy, day cycle.
   ============================================================ */

// ---- hotbar ----
const HOTBAR = [ { tool:"Hoe" }, { tool:"Can" }, { tool:"Axe" }, { tool:"Pick" }, { tool:"Rod" }, { tool:"Seeds" } ];
let slotSel = 0;
function selectSlot(i){ if(i<0||i>=HOTBAR.length) return; slotSel = i; playSfx("select"); refreshHotbar(); }
// v4.0: the Stave is the first tool ever granted mid-game (all others ship at freshState). It rides
// its own hotbar slot APPENDED after Seeds — so Seeds keeps index 5 (the hard-coded slotSel=5) and
// nothing reindexes. Re-append on every boot when earned, and at Elias's grant. Key 7 selects it.
function ensureStaveSlot(){
  const earned = state && state.flags && state.flags.staveEarned;
  const has = HOTBAR.some(s => s.tool === "Stave");
  if(earned && !has) HOTBAR.push({ tool:"Stave" });
  else if(!earned && has){ const i = HOTBAR.findIndex(s => s.tool === "Stave"); if(i >= 0){ HOTBAR.splice(i,1); if(slotSel >= HOTBAR.length) slotSel = 0; } }
}

// ---- v3.22: the horse ----
// Press H outdoors to mount (once the Stable is built); H again — or stepping into any building —
// to dismount. Cozy contract: the horse is never lost, never hungry; it's always waiting at the stable.
function rideToggle(){
  if(gameMode!=="play" || paused) return;              // not during fades, sleep, or the title
  if(typeof isCutscene==="function" && isCutscene()) return;   // not mid-scene/festival
  if(state.mounted){ dismountHorse(true); return; }
  if(fishing.state !== "idle"){ toast("Reel your line in first — you can't ride mid-cast.", "#cbb98f"); playSfx("error"); return; }
  if(!state.flags.proj_stable){ toast("You'll want a stable first — raise one from the Ledger."); playSfx("error"); return; }
  if(!curMap || !curMap.outdoor){ toast("No room to ride in here — take it outside."); playSfx("error"); return; }
  state.mounted = true;
  toast("You swing up into the saddle. 🐎", "#e8d18a"); playSfx("select");
  pPuff(state.px, state.py+4, "#c7ac7a", 7); pRing(state.px, state.py+5, "#e8d8b8"); cam.shake = 1.6;   // v3.26: a felt mount
  refreshHUD();
}
function dismountHorse(announce){
  if(!state.mounted) return;
  state.mounted = false;
  if(announce){ toast("You hop down; your horse ambles back to the stable.", "#cbb98f"); playSfx("step");
    pPuff(state.px, state.py+4, "#c7ac7a", 6); cam.shake = 1.1; }   // v3.26: dust as you land
  refreshHUD();
}
// ---- v3.24: the raise ceremony ----
// A building the crews finished overnight deserves a real moment — but the payoff should land when the
// player actually SEES it, i.e. the first farm frame after they wake and leave the cottage. So newDay
// queues the raised buildings here, and the game loop fires the banner/sparkle/shake once they're out.
let pendingRaise = [], _lastRaiseAt = -99;
function maybeBuildCeremony(){
  if(!pendingRaise.length) return;
  if(gameMode!=="play" || paused || uiBlocking() || (typeof isCutscene==="function" && isCutscene())) return;
  if(!curMap || curMap.id !== "farm") return;   // wait until they step onto the farm and can see it
  if(animT - _lastRaiseAt < 3.2) return;         // two raised the same night: space them so each banner is seen
  _lastRaiseAt = animT;
  const p = pendingRaise.shift();
  // v3.27: the coop is the construction on-ramp — the first time it's raised, Rowan comes to see it and
  // delivers the joinery scene the coop's blurb promised (the owner's "introduce construction via the coop").
  if(p.id === "coop" && !state.flags.coopSceneSeen && typeof coopRaiseScene === "function"){
    state.flags.coopSceneSeen = true; startCutscene(coopRaiseScene()); return;
  }
  const s = p.site || [15,5,15,5];
  const cx = ((s[0]+s[2])/2)*TILE + 8, cy = ((s[1]+s[3])/2)*TILE + 8;
  banner("🏗 " + p.name.replace(/^The /,"") + " raised!", p.done);
  pSparkle(cx, cy, "#ffe6a0", 26); pSparkle(cx-14, cy+6, "#cbb98f", 12); pSparkle(cx+14, cy+6, "#cbb98f", 12);
  cam.shake = 2.6; playSfx("upgrade");
}
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
  if(curMap.id==="farm" && !state.flags.proj_coop && (state.stats.chopped||0) >= 4 && !state.flags.tip_build)
    tutTip("tip_build","Logs become lumber at a Sawmill, and lumber raises buildings. Open the Journal's Ledger to build your first Coop — then hens can move in.");
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
  else if(tool==="Pick" && obj && (ORES[obj.kind]||obj.kind==="gemrock"||obj.kind==="crystal"||obj.kind==="geode"))
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
  for(const k in MACHINES) if((state.inv[MACHINES[k].name]||0) > 0) list.push("mach:"+k);
  for(const k in DECOR) if((state.inv[DECOR[k].name]||0) > 0) list.push("decor:"+k);
  return list;
}
const isSapSel   = s => typeof s === "string" && s.startsWith("sap:");
const isHiveSel  = s => s === "hive";
const isMachSel  = s => typeof s === "string" && s.startsWith("mach:");
const isDecorSel = s => typeof s === "string" && s.startsWith("decor:");
function plantableName(sel){
  if(isHiveSel(sel)) return "Beehive";
  if(isMachSel(sel)) return MACHINES[sel.slice(5)].name;
  if(isDecorSel(sel)) return DECOR[sel.slice(6)].name;
  if(isSapSel(sel)) return FRUIT_TREES[sel.slice(4)].name;
  return CROPS[sel] ? CROPS[sel].name + " Seeds" : "Seeds";
}
function plantableIcon(sel){
  if(isHiveSel(sel)) return "beehive";
  if(isMachSel(sel)) return "item_" + MACHINES[sel.slice(5)].name;
  if(isDecorSel(sel)) return "item_" + DECOR[sel.slice(6)].name;
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
  if(skill==="Warding") for(const k in CREATURES){ if(k!=="tanglet") add(CREATURES[k].lvl, CREATURES[k].name); }   // v4.11: the restless-thing families you grow strong enough to settle
  return best;
}

function unlocksAt(skill, lvl){
  const u = [];
  if(skill==="Farming") for(const k in CROPS) if(CROPS[k].lvl===lvl) u.push(CROPS[k].name+" seeds");
  if(skill==="Woodcutting") for(const k in TREES) if(TREES[k].lvl===lvl) u.push(TREES[k].name);
  if(skill==="Mining") for(const k in ORES) if(ORES[k].lvl===lvl) u.push(ORES[k].name);
  if(skill==="Fishing"){ FISH.forEach(f=>{ if(f.lvl===lvl) u.push(f.name); }); LEGENDS.forEach(l=>{ if(l.lvl===lvl) u.push(l.name+" (legend)"); }); }
  if(skill==="Cooking") for(const r of RECIPES) if(r.lvl===lvl) u.push(r.name);
  if(skill==="Warding") for(const k in CREATURES){ if(k!=="tanglet" && CREATURES[k].lvl===lvl) u.push(CREATURES[k].name); }   // v4.11
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
  if(skill === "Fishing" && charmActive("Heron Feather Charm")) amt = Math.round(amt * 1.05);   // v4.7 the Fishing XP charm
  if(skill === "Cooking" && charmActive("Hearth Charm")) amt = Math.round(amt * 1.05);   // v4.7 the Cooking XP charm
  if(skill === "Farming" && charmActive("Grandpa's Pocketwatch")) amt = Math.round(amt * 1.05);   // his time, well spent (v3.32)
  if(skill === "Warding" && charmActive("Settler's Band")) amt = Math.round(amt * 1.05);   // v4.1 the deep-warding XP charm
  // v4.0 variety spark (V4_PLAN §4) — the first SPARK_CAP grants in a skill each day earn +50% XP.
  // Reward-shaped and never a tax: rotating skills is visibly optimal; single-skill focus is still free.
  // addXP is the single choke point for ALL skill XP (Farming through Warding), so this covers combat too.
  if(!state.dailyXpActs) state.dailyXpActs = {};
  if((state.dailyXpActs[skill] || 0) < SPARK_CAP){
    const firstToday = !state.dailyXpActs[skill];
    state.dailyXpActs[skill] = (state.dailyXpActs[skill] || 0) + 1;
    amt = Math.round(amt * SPARK_MULT);
    pSparkle(state.px + rand(-3,3), state.py - 16, "#9fe0ff", 6);   // a distinct cold-blue spark on a boosted grant
    if(firstToday) toast("✦ Variety spark — " + skill + " earns bonus XP for a while today.", "#9fe0ff");
  }
  const before = levelFor(state.skills[skill]);
  state.skills[skill] += amt;
  floatText(state.px + rand(-4,4), state.py - 22, "+"+amt+" "+skill.slice(0,4).toLowerCase(), "#9fd8ff");
  showXpOrb(skill);   // the circular level-progress ring by the energy bar (10-ui.js)
  const after = levelFor(state.skills[skill]);
  if(after > before){
    let unl = []; for(let l=before+1; l<=after; l++) unl = unl.concat(unlocksAt(skill, l));
    // §4.3 "always show the next unlock" — at the level-up moment too, not only in the panel: when
    // this level unlocked nothing, point at what's still ahead so the grind always has a destination.
    const nu = unl.length ? null : nextUnlock(skill);
    // v4.9 fix: when no CONTENT unlock is ahead, fall back to the next MASTERY tier before declaring
    // "nothing left to learn". This stops the banner lying — at nearly every Warding level (nextUnlock
    // has no Warding branch) and on grind skills for the 13+ levels past their last content unlock.
    const nm = (!unl.length && !nu) ? nextMastery(skill) : null;
    banner("⬆ "+skill+" Lv "+after+"!",
      unl.length ? ("Unlocked: "+unl.join(", "))
      : nu       ? ("Next: "+nu.label+" at Lv "+nu.at)
      : nm       ? ("Next: ★ "+nm.text+" at Lv "+nm.at)
      :            "Mastery. Nothing left to learn — only to perfect.");
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
const OBJ_TITLE  = { geode:"Geode", bed:"Bed", campfire:"Campfire", stove:"Stove", fireplace:"Fireplace", counter:"Counter",
  stall:"Market Stall", shipbin:"Shipping Bin", sign:"Sign", noticeboard:"Noticeboard", ledger:"The Valley Ledger",
  fountain:"Fountain", boardwalk:"Boardwalk", railcart:"Minecart", memorial:"Standing Stone", berrybush:"Berry Bush",
  frostberry:"Frostberry Bush", fruittree:"Fruit Tree", beehive:"Beehive", torch:"Torch", lamp:"Lamp", lantern:"Lantern",
  crystal:"Crystal", gemrock:"Gem Rock", sealeddoor:"The Sealed Vault", wing:"Guild Wing", banner:"Guild Banner", ladder:"Ladder", lift:"The Old Lift", olddoor:"A Planked Door", keg:"Keg", jar:"Preserves Jar", sawmill:"Sawmill", press:"Cheese Press", bench:"Bench", plantpot:"Flower Planter",
  milestone:"The Milestone", shrine:"Roadside Shrine", mooring:"The Ferry Landing", samphirenode:"Samphire", hollynode:"Sea Holly",
  cairn:"The Cairn", crater:"The Crater Dell", shardnode:"Starlight", thymenode:"Mountain Thyme", snowdropnode:"Snowdrops",
  churn:"The Butter Churn",
  deadfall:"Deadfall", westtrail:"The Trail West", easttrail:"The Trail Back", waystone:"Waystone", hearttree:"The Heart of the Forest",
  ancient:"Ancient Tree",
  knot:"The Stair-Knot", wardbell:"The Warden's Bell", wardup:"Worn Steps", wardladderdown:"The Deeper Stair", wardledger:"The Warden's Ledger" };   // v4.0 Undercroft; wardledger v4.3
for(const k in DECOR) OBJ_TITLE[k] = DECOR[k].name;   // décor pieces (v3.13) examine under their proper name
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
  if(k==="olddoor" && state.flags.tenthDoorOpen)   // v4.0: once Elias took the boards down
    return { title:"The Tenth Door", text:"The boards are down and stacked to one side. Cold air rises from a stair going down into the dark — the Undercroft, breathing. Step in when you're ready." };
  const t = EXAMINE_OBJ[k];
  if(t) return { title: OBJ_TITLE[k] || k, text: t };
  return null;
}
// v3.26: your horse gets a name the first time you look at it, and a rotating deadpan word.
const HORSE_NAMES = ["Biscuit","Clover","Marble","Pumpkin","Dandelion","Rusty","Willow","Juniper","Chestnut","Pepper"];
function horseLook(tx, ty){
  if(!state.flags.proj_stable) return null;
  const atStall = curMap && curMap.id==="farm" && ty===6 && (tx===29 || tx===30);   // facing it in the open stall
  if(!state.mounted && !atStall) return null;
  if(!state.flags.horseName) state.flags.horseName = HORSE_NAMES[Math.abs(state.day*7 + 13) % HORSE_NAMES.length];
  const nm = state.flags.horseName;
  const lines = state.mounted ? [
    nm + " plods along, unbothered by any of your plans.",
    "From up here the whole valley looks small and yours. " + nm + " disagrees — " + nm + " is thinking about grass.",
    nm + " snorts. You choose to read it as agreement.",
  ] : [
    nm + " stands in the stall, tail flicking, waiting for you to have an idea.",
    nm + " watches you with the calm certainty of an animal who knows breakfast is coming.",
    "Your horse, " + nm + " — good coat, kind eye, strong opinions about carrots.",
  ];
  return { title: nm, text: lines[Math.abs(Math.floor(animT/2)) % lines.length] };
}
// v3.35: the flock, examined — the horseLook treatment for every named animal. Radius test
// against the facing tile's centre (animals wander in pixels, so tile-equality would be flaky).
// Lines rise with the bond: a stranger, a friend, family (the 180 Large-produce tier).
function animalLook(tx, ty){
  if(!curMap || !curMap.animals || !curMap.animals.length) return null;
  // tile-equality, not a radius (review fix): a radius wider than a half-tile let a hen on the
  // NEIGHBOURING tile hijack the examine of the object the player was actually facing.
  let best = null;
  for(const a of curMap.animals){ if(Math.floor(a.x/TILE) === tx && Math.floor(a.y/TILE) === ty){ best = a; break; } }
  if(!best) return null;
  const c = best.ref, nm = c.name || "the " + (best.species === "chicken" ? "hen" : best.species);
  const tier = (c.friend||0) >= 180 ? 2 : (c.friend||0) >= 80 ? 1 : 0;
  const L = {
    chicken: [
      [nm + " regards you sideways, the way hens do. You are, at best, tolerated.",
       nm + " is deeply absorbed in a patch of ground that contains nothing."],
      [nm + " trots a few steps your way before remembering to play it cool.",
       nm + " has opinions about the weather and delivers them all at once."],
      [nm + " settles down next to your boot like it's the best seat in the valley.",
       "Wherever you stand, " + nm + " ends up underfoot. This is love, hen-shaped."],
    ],
    cow: [
      [nm + " chews, and considers you the way she considers most things: slowly.",
       nm + " is exactly where she was an hour ago, and content about it."],
      [nm + " swings her big head toward you when you speak. She's listening. Probably.",
       nm + " leans a little your way, like a ship coming gently about."],
      [nm + " rests her chin on the rail and waits for you, every morning, at the same spot.",
       "The best pail in the valley, and " + nm + " gives it like it's nothing. It isn't nothing."],
    ],
    sheep: [
      [nm + " blinks at you from somewhere deep inside her wool.",
       nm + " is mostly coat at this point. Somewhere in there, a sheep."],
      [nm + " follows you along the fence line, pretending it's a coincidence.",
       nm + " has learned the sound of your boots and looks up before you're even close."],
      [nm + " leans her whole warm weight against your leg and stays there.",
       "Prize wool grows on a happy sheep, and " + nm + " may be the happiest in the valley."],
    ],
  };
  const lines = L[best.species][tier];
  return { title: nm + "  " + flockHearts(c), text: lines[Math.abs(Math.floor(animT/2)) % lines.length] };
}
function examineFacing(){
  if(!curMap) return null;
  const [tx,ty] = facingTile(); const k = key(tx,ty), tt = tileAt(tx,ty), obj = objAt(tx,ty);
  const crop = curMap.crops[k];
  if(crop){ const c = CROPS[crop.type]; const ripe = crop.days >= c.days;
    return { title:c.name, text: ripe ? (EXAMINE[c.name]||"Ripe and ready.") : `A ${c.name.toLowerCase()} coming along — day ${crop.days} of ${c.days}.` }; }
  const npc = npcAtTile(tx,ty);
  if(npc){ return { title:(NPCDEF[npc.id]&&NPCDEF[npc.id].name)||npc.id, text: EXAMINE_NPC[npc.id]||"One of the valley's own." }; }
  const an = animalLook(tx, ty);   // v3.35: the flock speaks before the furniture does
  if(an) return an;
  if(obj){ const o = objLook(obj); if(o) return o; }
  const h = horseLook(tx, ty);   // v3.26: the horse (stall or saddle) before falling through to the bare tile
  if(h) return h;
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
  if(state.mounted){ toast("Hop down first — press H to dismount.", "#cbb98f"); return; }   // v3.22: no working from the saddle
  const tool = HOTBAR[slotSel].tool;
  const [tx,ty] = facingTile();
  const tt = tileAt(tx,ty), obj = objAt(tx,ty);
  const tier = state.tools[tool]||0, power = TIER_POWER[tier];
  triggerSwing();

  if(tool === "Hoe"){
    if(curMap.id !== "farm"){ toast("This isn't your land to till — crops only grow on the farm."); return; }
    // ★ One Last Letter (v3.32): grandpa's riddle — "under the sign that bears our name, a single
    // step below it" = the farm sign at (3,8), so the dig is (3,9). Fires on the SWING at the spot,
    // deliberately ignoring tile state: an already-tilled tile isn't in TILLABLE and a growing crop
    // blocks tilling, so gating on a successful till could soft-block the story. The swing itself
    // finds the box. Quest-active guard so an early swing there is just a till (nothing to find
    // until the letter has told you to look). The hit test covers the hoe's WHOLE swing (a wide
    // tier's canTiles row/block can break the riddle tile while facing a neighbour — the right
    // answer must never read as a miss) and the player's own feet (standing on the spot and
    // swinging at the sign is the most literal reading of the riddle; honor it).
    const lq = curQuest();
    if(lq && lq.id === "one-last-letter" && !state.flags.keepsakeFound &&
       (canTiles(tx, ty, tier, state.face).some(([x,y]) => x === 3 && y === 9) ||
        (Math.floor(state.px/TILE) === 3 && Math.floor(state.py/TILE) === 9))){
      state.flags.keepsakeFound = true;
      give("Grandpa's Pocketwatch", 1, true);
      pSparkle(3*TILE+8, 9*TILE+4, "#ffd75a", 22); playSfx("legend"); cam.shake = 2;   // always at the dig spot, whatever tile the swing centred on
      showDialog("Grandpa's Letter", "Your hoe rings against a little tin box. Inside, wrapped in waxed paper: his pocketwatch — still ticking. On the lid, scratched small: “Time was never the thing to save. Days are. Spend them here.”", null);
      checkQuests();   // the find is the turn-in — the sender is gone, and that's the point
      return;
    }
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
    // A better can waters a wider swathe for the same single press — watering stays a morning
    // ritual, it just stops being a per-tile tax. Row runs perpendicular to the way you face.
    // v4.2.1 (owner call): a MISS (no tilled soil in reach) costs no energy — check first, then spend,
    // like the Hoe/Axe/Pick already do. Energy used to drain even when there was nothing to water.
    const wet = canTiles(tx, ty, tier, state.face).filter(([x,y]) => tileAt(x,y) === T.TILLED);
    if(!wet.length){ toast("Nothing to water there."); return; }
    if(!spendEnergy(1)) return;
    for(const [x,y] of wet){ setTile(x,y,T.WATERED); pDrops(x*TILE+8, y*TILE+8, 5);
      const cr = curMap.crops[key(x,y)]; if(cr) cr.wt = animT;   // v3.25: the crop drinks — a little stretch-pop (drawCrops reads .wt)
    }
    addXP("Farming", wet.length); bump("watered", wet.length); playSfx("water");
  }
  else if(tool === "Seeds"){
    // a tree or a hive goes in open ground, not a furrow, and it stays there for good
    // unstick() after: a permanent is SOLID, and the faced tile can be one the player's feet bbox
    // already overlaps (standing near a tile edge) — so a just-planted tree could trap you. unstick()
    // nudges you off the newly-solid tile, and no-ops when the placement was refused or you're clear.
    if(isSapSel(state.seedSel) || isHiveSel(state.seedSel) || isMachSel(state.seedSel) || isDecorSel(state.seedSel)){ plantPermanent(tx, ty); unstick(); return; }
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
    if(obj && (obj.kind === "fruittree" || obj.kind === "beehive" || MACHINES[obj.kind] || DECOR[obj.kind])){ digUp(tx, ty, obj); return; }
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
    if(obj && (obj.kind==="gemrock" || obj.kind==="crystal" || obj.kind==="geode")){
      if(!freeSwing && !spendEnergy(2)) return;
      if(freeSwing) floatText(state.px, state.py-30, "free swing", "#b6f27a");
      obj.hp -= power; obj.shakeT = 0.2; cam.shake = 2.4; hitstop = 0.05; playSfx("mine");
      pChips(tx*TILE+8, ty*TILE+8, "#6a6472", 5); pSparkle(tx*TILE+8, ty*TILE+8, obj.kind==="geode"?"#c8b8ff":"#c8a0f0", 4);
      if(obj.hp <= 0){ delete curMap.objects[key(tx,ty)];
        if(obj.kind==="geode"){ crackGeode(tx, ty); addXP("Mining", 90); bump("mined"); }
        else { const g = pickGem(); give(g,1);
          addXP("Mining", hasMastery("Mining",75) ? 138 : 55);            // ★ Gemcutter
          bump("mined"); bump("gems"); pSparkle(tx*TILE+8, ty*TILE+8, GEMS[g], 12); playSfx("ore"); } }
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
    if(obj.hp <= 0){
      const wasStairs = obj.stairs;
      const n = 1 + (hasMastery("Mining",50) && chance(0.15) ? 1 : 0);  // ★ Rich Seam
      give(o.drop, n); addXP("Mining", o.xp); bump("mined");
      // v3.18 — the star gem comes only off a Star Metal vein: same celestial deposit as the metal.
      // Rare because the vein itself is gated (Mining 85, floor 65+ since v3.38 — was 50/35+, then
      // 60/45+), and it's what the ultimate tools want. The 0.30 roll is per-vein, so the
      // shard:Starstone RATIO (the number that actually tunes the Star tier) is unchanged however
      // deep the band sits.
      if(o === ORES.starmetal && chance(0.30)){ give("Starstone", 1);
        pSparkle(tx*TILE+8, ty*TILE+8, GEMS.Starstone, 16); floatText(state.px, state.py-30, "✦ a Starstone!", "#c8b8ff"); }
      if(wasStairs){   // v3.19 — this plain rock hid the way down; break it and the shaft opens
        curMap.objects[key(tx,ty)] = { kind:"ladderdown" };
        toast("The rock crumbles away over a black shaft — the way down!", "#cbb98f");
        playSfx("upgrade"); pSparkle(tx*TILE+8, ty*TILE+8, "#c8d0e0", 16); floatText(state.px, state.py-34, "↓ found the stairs", "#a9b0c0");
      } else {
        delete curMap.objects[key(tx,ty)];
        pSparkle(tx*TILE+8, ty*TILE+8, o.gem||"#cfcfcf", n>1?14:8); playSfx("ore");
      }
    }
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
  else if(tool === "Stave"){
    // v4.2 Warding costs NO energy (owner call). Resolve — drained only by a restless thing's touch —
    // is the combat limiter, and the health bars already pace a fight; an energy tax on every swing
    // just got in the way. staveSwing (15-warding.js) settles a creature in reach or breaks the
    // stair-knot; it no-ops harmlessly outside the Undercroft (nothing to hit up top).
    if(!state.flags.staveEarned){ toast("You don't carry a warden's tool yet.", "#cbb98f"); return; }
    staveSwing(tx, ty, power);
    refreshHUD(); return;
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

  // harvest crop — v4.11: a ripe interact now SWEEPS the Can's footprint (canTiles), gathering every ripe
  // crop in reach in one press. Harvesting was the last core field verb still charging a per-tile tax while
  // the Hoe tills and the Can waters in swathes. Yields/XP are byte-identical (harvest has no timing/skill
  // element), so this removes friction, not challenge. Tier-0 Can = just the faced tile (backward-compatible).
  const crop = curMap.crops[k];
  if(crop){
    const c = CROPS[crop.type];
    if(crop.days >= c.days){
      const dbl = hasMastery("Farming",99) ? 0.20 : hasMastery("Farming",50) ? 0.10 : 0;   // ★ Bountiful (50) / Fields of Gold (99)
      let picked = 0, dblAny = false;
      for(const [hx,hy] of canTiles(tx, ty, state.tools.Can||0, state.face)){
        const cr = curMap.crops[key(hx,hy)]; if(!cr) continue;
        const cc = CROPS[cr.type]; if(cr.days < cc.days) continue;   // only the RIPE crops in the swathe
        delete curMap.crops[key(hx,hy)]; setTile(hx,hy,T.TILLED);
        const n = 1 + (dbl && chance(dbl) ? 1 : 0); if(n>1) dblAny = true;
        give(cc.name, n); addXP("Farming", cc.xp); bump("harvested");
        pSparkle(hx*TILE+8, hy*TILE+6, cc.pal[3], n>1?18:12); picked++;
      }
      if(dblAny) floatText(tx*TILE+8, ty*TILE-6, "double!", "#ffd75a");
      if(picked) playSfx("harvest");
    }
    else toast(`${c.name}: day ${crop.days}/${c.days}${tt===T.WATERED?"":" — needs water"}`);
    return;
  }

  if(obj){
    switch(obj.kind){
      case "bed": if(curMap.id==="cottage") doSleep(); else showDialog("A Bed","Cozy — but not yours. Best sleep in your own cottage.","port_valley"); return;
      case "campfire": case "stove": cook(); return;
      case "counter": case "stall": {
        // v4.9 specialty vendors: a stand tagged with a vendor opens that vendor's shop directly
        // (Bram's Bait & Tackle on the coast, Nell's Larder at the dairy). Untagged = Tom's counter.
        if(obj.vendor === "bram" || obj.vendor === "nell"){ openShop(null, false, obj.vendor); return; }
        const r=ensureRel("tom"); if(r.talkedDay!==state.day){ r.talkedDay=state.day; r.points+=10; }
        checkQuests();
        // Tom stands behind the counter and can't be talked to directly, so his turn-ins
        // and his noticeboard requests both have to be reachable from here.
        if(tryTurnIn("tom")) return;
        if(tryFulfillRequest("tom")) return;
        // v3.24: Tom's the shopkeeper — you reach him at the counter, not as a walkable NPC, so his
        // "fine coop you raised!" nod has to fire from here or it never plays.
        const recTom = pendingRecog("tom");
        if(recTom){ showDialog(NPCDEF.tom.name + "   " + heartStr(heartsOf("tom")), recTom, NPCDEF.tom.portrait); return; }
        openShop(); return;
      }
      case "shipbin": toast("Shipping bin — sell your goods here.", "#e9dcc0"); openShop("sell", true); return;
      case "sign": showDialog("Weathered Sign", obj.text || "…", "port_sign"); return;
      case "noticeboard": tutTip("tip_board","Someone in the valley wants something small each day. Bring it for coin and goodwill — never required."); showDialog("The Noticeboard", boardText(), "port_sign"); return;
      case "ledger": openProjects(); return;
      case "wardledger":   // v4.3 the Warden's Ledger — Act III. Latched shut until the tenth door gives.
        if(!state.flags.tenthDoorOpen){ showDialog("The Warden's Ledger", "A heavy book, still latched, that no one will explain. It smells of cold stone and old lantern-oil. Not yet — not until the tenth door gives.", "port_sign"); return; }
        openWardLedger(); return;
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
      case "bench": {   // a small cozy beat: sit, and the square lives around you for a moment
        const lines = [
          "You sit a while. Someone's kept the lamps trimmed and the square swept.",
          "You rest on the warm wood and watch the valley go about its day.",
          "A moment on the bench. The fountain's murmur, a door somewhere, the wind." ];
        toast(pick(lines), "#e9dcc0"); playSfx("select"); return;
      }
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
      case "keg": case "jar": case "press": {
        const M = MACHINES[obj.kind];
        if(obj.ready){                                        // collect the finished product
          const prod = M.product(obj.item);
          give(prod, 1); addXP("Farming", 14); bump("harvested");
          delete obj.item; delete obj.days; delete obj.ready;
          playSfx("get"); pSparkle(tx*TILE+8, ty*TILE, "#ffd98a", 10);
          return;
        }
        if(obj.item){                                         // still working
          toast(`The ${obj.item.toLowerCase()} needs ${M.days - obj.days} more ${M.days-obj.days===1?"night":"nights"}.`, "#cbb98f");
          return;
        }
        // empty (v3.40 owner sweep): ONE acceptable thing in the bag still loads instantly — the
        // old one-button reflex where a menu is pure friction — but with a choice to make, the
        // chooser opens ("I can't pick the wood I want… there's no selector anywhere").
        const cands = Object.keys(state.inv).filter(it => (state.inv[it]||0) > 0 && M.accepts(it));
        if(!cands.length){ toast("It wants " + M.wants + "."); playSfx("error"); return; }
        if(cands.length === 1){ loadMachineWith(obj.kind, tx, ty, cands[0]); return; }
        openMachineChooser(obj.kind, tx, ty);
        return;
      }
      case "sawmill": {
        const M = MACHINES.sawmill;
        if(obj.ready){                                        // collect the milled boards (the whole batch)
          const n = obj.qty || 1;
          give(M.product(obj.item), n); addXP("Woodcutting", 8);
          delete obj.item; delete obj.qty; delete obj.days; delete obj.ready;
          playSfx("get"); pSparkle(tx*TILE+8, ty*TILE, "#e0d3ac", 10);
          // v3.27 "First Timber": the carpentry theme, introduced the moment you hold your first board
          if(!state.flags.firstTimber){ state.flags.firstTimber = true;
            showDialog("First Timber", "You lift the first fresh-cut board off the bed, still warm from the blade. Elder Rowan's words come back to you: “Timber's only a tree that's decided what it wants to become. Your part is to agree with it.”\n\nBring lumber to the Ledger, and raise what the valley needs.", "port_rowan"); }
          return;
        }
        if(obj.item){                                         // still milling
          const left = M.days - obj.days;
          toast(`Milling ${obj.qty} ${obj.item.toLowerCase()} — ${left} more ${left===1?"night":"nights"}.`, "#cbb98f");
          return;
        }
        // empty (v3.40 owner sweep): one species in the bag mills instantly; more than one opens
        // the chooser — the owner's sawmill complaint verbatim ("I can't pick the wood I want").
        const woods = Object.keys(state.inv).filter(it => (state.inv[it]||0) > 0 && WOOD_NAMES.has(it));
        if(!woods.length){ toast("It wants raw logs — chop a tree and bring the wood."); playSfx("error"); return; }
        if(woods.length === 1){ loadMachineWith("sawmill", tx, ty, woods[0]); return; }
        openMachineChooser("sawmill", tx, ty);
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
      case "samphirenode": forageNode(tx,ty,obj,"Samphire","Fishing",8); return;   // v3.36: the road's tideline forage
      case "hollynode": forageNode(tx,ty,obj,"Sea Holly","Fishing",6); return;
      case "thymenode": forageNode(tx,ty,obj,"Mountain Thyme","Farming",7); return;   // v3.43: the ridge's alpine forage
      case "snowdropnode": forageNode(tx,ty,obj,"Snowdrop","Farming",6); return;
      case "shardnode": {
        // v3.43 star-gleaning — the first activity gated by clock and sky, not tool tier. The
        // shards only spawn on clear days (genRidge) and only give themselves up after dusk;
        // by daylight they're just pale glints in the scree, and the node says so, warmly.
        const h = state.time/60;
        if(h < 19 && h >= 6){ toast("A pale glint in the scree — but starlight only lets go after dusk.", "#cbb98f"); return; }
        // the star-metal bonus rolls ONLY on a fresh glean — behind the same per-day dedupe as the
        // shard itself, or repeat-pressing a picked node could farm the roll all night. 3% (review
        // rebalance): the trickle is the treat, never a second income stream.
        const fresh = obj.pickedDay !== state.day;
        if(fresh && chance(0.03)){ give("Star Metal Shard", 1); pSparkle(tx*TILE+8, ty*TILE, "#d8b0ff", 18); playSfx("legend");
          floatText(state.px, state.py-30, "✦ star metal!", "#c8a8ff"); }
        forageNode(tx,ty,obj,"Starlight Shard","Mining",14);   // forage-class XP (review rebalance: 90 ungated out-leveled the mine's whole early curve)
        return;
      }
      case "crater": showDialog("The Crater Dell", "A bowl of broken scree, older than the Guild, its rim softened by a hundred winters. This is where it came down — the star whose metal built nine crafts and one long story.\n\nThe stone underfoot is fused smooth. On clear nights, they say, the summit still catches splinters of the old light.", null); return;
      case "cairn": openPanorama(); return;
      case "churn": showDialog("The Butter Churn", "You give the plunger a few turns out of habit. Somewhere under the cream, butter is deciding whether to happen. Nell says the trick is to stop asking it to.\n\n(The dairy's work is Nell's; you just like the sound it makes.)", null); return;
      case "milestone": showDialog("The Milestone", "A squat granite post, older than the Guild, its face worn soft by forty-odd years of salt wind. The carving is still plain enough:\n\nMARROW POINT — 39\n\nThe road runs on north past the landing, thin and patient, until the headland takes it out of sight. Thirty-nine miles. Elias walked it in eleven years; his father sailed it in a day.", null); return;
      case "shrine": showDialog("The Roadside Shrine", "A knee-high stone hollow with a shelf, kept by nobody and tended by everyone — travellers leave what they can spare and take what they need. Today there's a smooth pebble, a dried flower, and half a biscuit, hard as the milestone.\n\nYou tidy the shelf a little. The wind approves.", null); return;
      case "mooring": showDialog("The Ferry Landing", "Grey planks, salt-silvered, solid underfoot — somebody keeps the boards good even though nothing has tied up here in years. The mooring post still wears a loop of rope, spliced and re-spliced.\n\nThe water slaps the pilings, patient as a clock. A ferry could dock here tomorrow, if a ferry were ever minded to.", null); return;
      case "ladderup": mineUp(); return;
      case "lift": openLift(); return;
      case "ladderdown": mineDown(); return;
      case "mineentrance": enterMine(); return;
      case "wardup": wardUp(); return;                 // v4.0 Undercroft — up a floor / out to the Guild
      case "wardbell": openBells(); return;            // the Warden's Bell checkpoint panel
      case "wardladderdown": wardDown(); return;       // the settled knot's stair
      case "knot": toast("A knot of the dark, wound round the stair. Settle it with your Stave (Space).", "#bfe4ff"); return;
      case "westtrail": groveDeeper(); return;
      case "easttrail": groveBack(); return;
      case "deadfall": toast(`A great deadfall seals the trail west. (Axe — Woodcutting ${obj.lvl})`, "#cbb98f"); return;
      case "waystone": useWaystone(tx,ty,obj); return;
      case "hearttree": showDialog("The Heart of the Forest",
        "The oldest tree in the valley — older than the Guild, older than the road. Its pale bark is warm under your palm, and for a moment the whole wood seems to hold its breath.\n\nSomething sleeps here. Not yet, but someday.", "port_valley"); return;
      case "sealeddoor": openVault(tx,ty); return;
      case "olddoor": {
        // The first planted question (STORY_OVERHAUL.md): a door someone nailed shut years ago.
        // Rowan deflects until Act II has told you why; afterwards it reads as quiet closure.
        // v4.0: once Elias has taken the boards down (The Tenth Door), the door IS the Undercroft mouth.
        if(state.flags.tenthDoorOpen){ enterUndercroft(); return; }
        if(state.flags.knowsElias)
          showDialog("A door, planked shut",
            "Elias's old workroom. Rowan never had the heart to open it, and now there's no need — the boards can come down any day they choose. There's no hurry left in it.",
            "port_valley");
        else
          showDialog("Elder Rowan",
            "“Not that one.” Rowan doesn't look up from his desk. “Not yet.”\n\nThe boards are old, but the nails… the nails look newer than the dust says they should.",
            "port_rowan");
        return;
      }
      case "chest": openChest(); return;
      case "desk": showDialog("Rowan's Desk","Ledgers and a map of nine dark wings. The old keeper must be near.","port_rowan"); return;
      case "bush": toast("A tidy little bush."); return;
    }
  }

  const a = nearestAnimal(24);
  if(a){ a.species==="cow" ? petCow(a) : a.species==="sheep" ? shearSheep(a) : petChicken(a); return; }
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

// ---- v3.28 geodes: the mine's answer to the grove's canopy nests ----
// A rare deep-floor nodule that cracks into a curio for the shelf (mostly), a gem grown in the dark
// (sometimes), a rare Geode Heart, or — one in twenty-five — a Starstone. Collection first, coin a
// distant second, so the deep pays in wonder without becoming a gold faucet.
// v3.40: the one loader every path shares — the instant single-option load AND the chooser's
// pick both land here. Re-validates the machine (the world can change while a panel is open).
function loadMachineWith(kind, tx, ty, item){
  const obj = objAt(tx, ty), M = MACHINES[kind];
  if(!obj || obj.kind !== kind || obj.item || !M) return;                    // moved, loaded, or gone
  if((state.inv[item]||0) <= 0 || !M.accepts(item)) return;                  // spent or never valid
  if(kind === "sawmill"){
    const n = Math.min(state.inv[item], M.batch);
    take(item, n);
    obj.item = item; obj.qty = n; obj.days = 0; obj.ready = false;
    toast(`The sawmill takes ${n} ${item.toLowerCase()} — ${WOOD_TO_LUMBER[item].toLowerCase()} by morning.`, "#cbb98f");
  } else {
    take(item);
    obj.item = item; obj.days = 0; obj.ready = false;
    toast(`The ${M.name.toLowerCase()} takes your ${item.toLowerCase()}. ${M.days} ${M.days===1?"night":"nights"}.`, "#cbb98f");
  }
  playSfx("plant"); pPuff(tx*TILE+8, ty*TILE+4, "#cbb98f", 5);
}

function crackGeode(tx, ty){
  state.flags.crackedGeode = true;   // v3.34: Pip has OPINIONS about treasure inside rocks (NPC_RECOG)
  playSfx("get"); pSparkle(tx*TILE+8, ty*TILE+8, "#c8b8ff", 16); pChips(tx*TILE+8, ty*TILE+8, "#8a8278", 6);
  const r = Math.random();
  if(r < 0.56){ const s = pick(GEODE_CURIOS); give(s, 1);
    banner("💎 The geode splits open", s + " — one for the shelf."); }
  else if(r < 0.86){ const g = pickGem(); give(g, 1); pSparkle(tx*TILE+8, ty*TILE+8, GEMS[g], 12);
    banner("💎 The geode splits open", "A " + g.toLowerCase() + ", grown in the dark."); }
  else if(r < 0.96){ give("Geode Heart", 1);
    banner("💠 The geode splits open", "A Geode Heart — hollow, its whole inside crystal. A rare thing."); }
  else { give("Starstone", 1); pSparkle(tx*TILE+8, ty*TILE+8, "#c8b8ff", 20); playSfx("quest");
    banner("✦ The geode splits open", "A Starstone, deep in the rock — the rarest fallen light."); }
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
    // the Band and the Pocketwatch (v3.32) have their own stories — never from a nest
    const unowned = Object.keys(CHARMS).filter(c => c !== "The Forester's Band" && c !== "Grandpa's Pocketwatch" && !state.discovered[c]);
    if(!unowned.length){ give("Berry Bun", 2); toast("A nest tumbles down — berries, baked hard by the sun.", "#cbb98f"); return; }   // every charm already found
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
  if((state.inv["Bait"]||0) > 0) fishing.t *= 0.6;            // v4.9: fresh bait from Bram brings them in quicker (consumed on a catch — see landFish)
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
// which water you're standing at. On the Coast Road (v3.36) the Gullwater splits in two: the
// channel up north is "river"; the mouth, the sand, and the dock are "estuary" — the brackish
// stretch where the sea-run overlap lives. The player's own row decides (you fish the bank
// you stand on), with the split at y14 — the sand line.
const waterHere = () =>
  curMap.id === "beach" ? "coast" :
  curMap.id === "coastroad" ? (Math.floor(state.py/TILE) >= 14 ? "estuary" : "river") :
  "pond";
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
  // season-gated fish (the winter ice-fishing catches, v3.31) only enter the pool in their season;
  // weather-gated fish (the Rainrunner, v3.36) only in their weather. Everything else is always in.
  const seas = curSeason();
  let pool = names.map(n => FISH.find(x => x.name === n)).filter(f => f && f.lvl <= lvl &&
    (!f.season || f.season === seas) && (!f.weather || f.weather === state.weather));
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
  if((state.inv["Bait"]||0) > 0) take("Bait");   // v4.9: a catch uses up one bait (the buff in startFishing reads inv.Bait)
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
  if(f.season) state.flags["first_"+f.name] = true;   // v3.34: the season-gated catches get remembered — Bram has words for each (NPC_RECOG)
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
  if(typeof _panoClose === "function" && _panoClose) _panoClose();   // v3.43: the 26:00 turn-in must never play out UNDER the panorama (review fix)
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
  state.dailyXpActs = {};              // v4.0: a new day re-lights every skill's variety spark
  state.resolve = resolveMax();        // v4.0: Resolve is whole again each morning (it's never a persisted worry)
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
  const cellared = tendCellar(farm);// the kegs and jars age their loads one night
  const built = completeProjects(); // Rowan's crews worked through the night
  pendingRaise = pendingRaise.concat(built.filter(p => p.building));   // v3.24: a raised building earns a ceremony when you next step onto the farm
  applyProjects(farm);              // re-try any placement a crop was sitting on yesterday
  rollWeather();                    // today becomes what was forecast last night; tomorrow is re-rolled
  // Rain waters your fields. Snow does not — the ground is frozen, and the Almanac says so plainly.
  if(state.weather === "rain"){ for(let i=0;i<W*H;i++) if(farm.tiles[i]===T.TILLED) farm.tiles[i]=T.WATERED; }
  state.flags.stormWrack = wasStorm;   // one day only; the beach regenerates nightly
  state.deepRun = false;               // a new dawn ends any deep run — you always wake home, haul intact
  saveGame();
  return { grew, ready, cellared, rain: state.weather === "rain", withered, season: seasonChanged ? newSeason : null,
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
  } else if(MACHINES[obj.kind]){
    if(obj.item) give(obj.item, obj.qty || 1);      // nothing is ever taken: the whole load comes back out
    give(MACHINES[obj.kind].name, 1, true);
    toast(`You heft the ${MACHINES[obj.kind].name.toLowerCase()}${obj.item ? " — its load comes back out unspoiled" : ""}.`, "#cbb98f");
  } else if(DECOR[obj.kind]){
    give(DECOR[obj.kind].name, 1, true);
    toast(`You pack up the ${DECOR[obj.kind].name.toLowerCase()} to set somewhere new.`, "#cbb98f");
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
  const mach = isMachSel(state.seedSel) ? state.seedSel.slice(5) : null;   // "mach:keg" / "mach:jar"
  if(mach){
    const M = MACHINES[mach];
    if(Object.values(curMap.objects).filter(o => o.kind === mach).length >= M.max){
      const plural = M.name.toLowerCase() + (M.name.endsWith("s") ? "es" : "s");   // v3.33: "presses", not "presss"
      toast(`${M.max} ${plural} is plenty for one cellar.`); playSfx("error"); return; }
    if((state.inv[M.name]||0) < 1){ toast("You don't have one."); playSfx("error"); return; }
    if(!spendEnergy(2)) return;
    take(M.name);
    curMap.objects[key(tx,ty)] = { kind:mach };   // empty until you load it (interact with its input in your bag)
    setTile(tx,ty, T.GRASS);
    toast(`The ${M.name.toLowerCase()} is set. Bring it ${M.wants || "something grown"}.`, "#cbb98f");   // v3.33: the machine says what it eats
    addXP("Farming", 20); playSfx("plant");
    pSparkle(tx*TILE+8, ty*TILE+8, "#cbb98f", 10);
    normalizeSeedSel(); refreshHotbar(); refreshHUD();
    return;
  }
  const dec = isDecorSel(state.seedSel) ? state.seedSel.slice(6) : null;   // "decor:flowerbed"
  if(dec){
    const D = DECOR[dec];
    if(Object.values(curMap.objects).filter(o => DECOR[o.kind]).length >= DECOR_MAX){
      toast(`Your homestead is beautifully full (${DECOR_MAX} pieces).`); playSfx("error"); return; }
    if((state.inv[D.name]||0) < 1){ toast("You don't have one."); playSfx("error"); return; }
    if(!spendEnergy(2)) return;
    take(D.name);
    curMap.objects[key(tx,ty)] = { kind:dec };   // kind is the DECOR key; spr[kind] draws it
    state.flags["placed_"+dec] = true;   // v3.34: the neighbours notice what you raise (NPC_RECOG keys off these; backfilled in migrateSave)
    setTile(tx,ty, T.GRASS);
    toast(`The ${D.name.toLowerCase()} looks right at home.`, "#cbb98f"); playSfx("plant");
    pSparkle(tx*TILE+8, ty*TILE+8, "#ffe6a0", 8);
    normalizeSeedSel(); refreshHotbar(); refreshHUD();
    return;
  }
  const sap = hive ? null : FRUIT_TREES[state.seedSel.slice(4)];
  if(!hive && !sap){ toast("Nothing to plant."); playSfx("error"); return; }
  if(sap && Object.values(curMap.objects).filter(o => o.kind === "fruittree").length >= ORCHARD_MAX){   // v4.9 orchard cap (grandfathered; refuse BEFORE spending energy, like the hive/machine caps)
    toast(`${ORCHARD_MAX} fruit trees is a full orchard.`); playSfx("error"); return; }
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
// the Cellar works while you sleep: every loaded keg/jar ages one night; done means ready.
function tendCellar(farm){
  let readied = 0;
  for(const k0 in farm.objects){
    const o = farm.objects[k0];
    const M = MACHINES[o.kind];
    if(!M || !o.item || o.ready) continue;
    o.days = (o.days||0) + 1;
    if(o.days >= M.days){ o.ready = true; readied++; }
  }
  return readied;
}

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
    // v3.22: the Stable's build footprint sits on this ridge band — never drop ore on it, or a
    // respawned rock would block funding (or defer the just-funded raise, since this runs before
    // completeProjects in newDay). Keeps the headline build always fundable.
    if(onStableSite(x,y)) continue;
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS)&&!m.objects[k]){
      const r=rng(), kind=r<.68?"stone":r<.9?"copper":"iron"; m.objects[k]={kind,hp:ORES[kind].hp};   // v3.17: matches genFarm — stone-heavy, no surface gold
    }
  }
}
// The Stable's footprint (+ its sign tile) — kept clear of the nightly ore respawn so the build is
// never spuriously blocked. Reads the site straight from PROJECTS so it can't drift.
function onStableSite(x,y){
  const p = PROJECT_BY_ID.stable; if(!p || !p.site) return false;
  const s = p.site;
  if(x>=s[0] && x<=s[2] && y>=s[1] && y<=s[3]) return true;
  return p.sign && x===p.sign[0] && y===p.sign[1];
}
function updateTime(dt){
  if(gameMode!=="play" || paused) return;
  // The Harvest Moon rule: time stands still underground — you can't see the sun, and getting
  // yanked to bed mid-vein was the least satisfying moment in the game (owner playtest,
  // 2026-07-12). Energy still drains per swing; that's the mine's honest limiter.
  // EXCEPTION (v3.15): during an opt-in Deep Run, time flows — that's the whole expedition. The
  // day ending just sends you home with your haul (doSleep below), so it costs a run, never items.
  if(curMap && curMap.id === "mine" && !state.deepRun) return;
  if(curMap && curMap.id === "undercroft") return;   // v4.0: the Undercroft is always timeless — a settling run is never raced by the sun (there's no Deep Run here in v4.0)
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

// v4.11 "sell all produce" — collapses the end-of-day click-fest into one button. Deliberately sells ONLY
// produce (crops, raw fish, and cooked dishes incl. grilled "Cooked X"), NEVER materials — so it can't
// footgun away the Wood/ore/warding-drops/gems/star-metal you're saving for tools, bells, charms or
// projects. Economy-neutral under flat pricing (identical to clicking each row's "all").
function isProduce(item){ return CROP_NAMES.has(item) || FISH_NAMES.has(item) || RECIPE_NAMES.has(item) || item.indexOf("Cooked ") === 0; }
function produceValue(){ let g = 0; for(const it of Object.keys(state.inv)) if(isProduce(it) && ITEM_SELL[it] && state.inv[it] > 0) g += bundlePrice(it, state.inv[it]); return g; }
function sellAllProduce(){
  let gain = 0, count = 0, best = state.stats.bestCropSold || 0, bestName = null;
  for(const it of Object.keys(state.inv)){
    if(!isProduce(it) || !ITEM_SELL[it]) continue;
    const n = state.inv[it] || 0; if(n <= 0) continue;
    gain += bundlePrice(it, n); count += n; take(it, n);
    if(CROP_NAMES.has(it) && (ITEM_SELL[it]||0) > best){ best = ITEM_SELL[it]; bestName = it; }   // still feeds the Harvest Fair
  }
  if(!count){ toast("Nothing to sell — no crops, fish or cooked dishes on you."); playSfx("error"); return; }
  state.gold += gain; bump("earned", gain); bump("sold", count);
  if(bestName){ state.stats.bestCropSold = best; state.flags.bestCropName = bestName; }
  toast(`Sold ${count} — crops, fish & dishes (+${gain}g). Materials kept.`, "#ffce5a");
  playSfx("sell"); refreshHUD(); renderShop();
}

const TOM_GLUT = [
  "Tom: “I can't shift this many {item}, farmer. Bring me something else tomorrow.”",
  "Tom: “Another {item}. My window looks like a {item} museum.”",
  "Tom: “I'll take it, but the price is the price. Nobody in this valley wants more {item} today.”",
  "Tom: “You know what sells? Variety. Ask anyone. Ask me. I just said it.”",
];
// v3.41 (owner, extending the v3.40 sweep to buying): both take an optional count, clamped to
// what the purse can cover — ask for 20 with coin for 12 and you get 12, said plainly, one toast.
function buySeed(id, n){
  const c = CROPS[id]; if(state.gold < c.seed) return;
  n = Math.max(1, Math.min(n||1, Math.floor(state.gold / c.seed)));
  state.gold -= c.seed * n; give(c.name+" Seeds", n, true);
  toast("Bought " + (n>1 ? n+"× " : "") + c.name+" Seeds", "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop(); refreshHotbar();
}
function buyFood(item, cost, n){
  if(state.gold < cost) return;
  n = Math.max(1, Math.min(n||1, Math.floor(state.gold / cost)));
  state.gold -= cost * n; give(item, n, true);
  toast("Bought " + (n>1 ? n+"× " : "") + item, "#8fd06a"); playSfx("coin"); refreshHUD(); renderShop();
}
function buyTool(tool){
  const cur = state.tools[tool]; if(cur>=MAX_TIER) return;
  const need = TIER_LEVEL[cur+1], sk = TOOL_SKILL[tool];
  if(skillLvl(sk) < need){   // v3.17 — skill gates the upgrade, not just the materials
    toast(`You need ${sk} ${need} to handle a ${TOOL_TIERS[cur+1]} ${tool}.`, "#ff8a7a"); playSfx("error"); return; }
  const c = toolCost(tool, cur+1);
  if(state.gold < c.g || !Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it])) return;
  state.gold -= c.g;
  for(const it in c.mats) take(it, c.mats[it]);
  state.tools[tool] = cur+1; bump("toolUpgrades");
  const sub = cur+1===MAX_TIER ? "Forged from the deep floors and the heart of the grove. There is no finer tool in the valley."
            : cur+1===3        ? "The "+TIER3_GEM[tool]+" is set into the handle. Earned across every craft."
            :                    "Faster, stronger, cozier.";
  banner("🔧 "+TOOL_TIERS[cur+1]+" "+tool+"!", sub);
  playSfx("upgrade"); pSparkle(state.px, state.py-14, cur+1===MAX_TIER ? "#bfe4ff" : "#ffce5a", 14); refreshHUD(); renderShop(); refreshHotbar();
}
