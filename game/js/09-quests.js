"use strict";
/* ============================================================
   09-quests.js — quest progression & story beats.
   ============================================================ */

function totalLevel(){ let t=0; for(const s in state.skills) t += skillLvl(s); return t; }
function curQuest(){ return QUESTS[state.questIdx] || null; }

// ---- Quest Points (v3.32) — the RuneScape ledger ----
// Every quest weighs something (q.qp, default 1); the sum is the valley's one number for
// "how much of the story you've lived." Derived from questIdx — the chain is strictly linear,
// so completed quests are exactly QUESTS.slice(0, questIdx). No save field, no migration, and
// retroactively right for every existing save (state.questDone is write-only and was backfilled
// empty on old saves, so it is deliberately NOT the source of truth here).
function questPoints(){ let t=0; const n=Math.min(state.questIdx, QUESTS.length); for(let i=0;i<n;i++) t += QUESTS[i].qp||1; return t; }
function questPointsTotal(){ return QUESTS.reduce((t,q)=>t+(q.qp||1),0); }

// Which act the player is in — used to frame the tracker, journal, and Continue recap so the
// two-act structure is visible in casual play. Act I runs through the finale ("Wake the Valley").
const ACT_TITLES = { 1:"Act I — The Quiet Valley", 2:"Act II — The Empty Chair", 3:"Act III — The Untended" };
function actInfo(){
  const n = !state ? 1 : (state.questIdx >= ACT3_IDX ? 3 : state.questIdx > FINALE_IDX ? 2 : 1);   // v4.0: Act III opens at The Tenth Door
  return { n, title: ACT_TITLES[n] };
}

function objDone(o){
  if(o.stat)       return (state.stats[o.stat]||0) >= o.goal;
  if(o.level)      return skillLvl(o.level.skill) >= o.level.n;
  if(o.heart)      return heartsOf("maya") >= o.heart;
  if(o.heartOf)    return heartsOf(o.heartOf.id) >= o.heartOf.n;
  if(o.item)       return (state.inv[o.item]||0) >= o.n;
  if(o.totalLevel) return totalLevel() >= o.totalLevel;
  if(o.gold)       return state.gold >= o.gold;
  if(o.talk)       return !!state.rel[o.talk];
  if(o.mineDepth)  return (state.mineBest||0) >= o.mineDepth;
  if(o.flag)       return !!state.flags[o.flag];
  return false;
}
function objProgress(o){
  if(o.stat)       return [Math.min(state.stats[o.stat]||0, o.goal), o.goal];
  if(o.level)      return [Math.min(skillLvl(o.level.skill), o.level.n), o.level.n];
  if(o.heart)      return [Math.min(heartsOf("maya"), o.heart), o.heart];
  if(o.heartOf)    return [Math.min(heartsOf(o.heartOf.id), o.heartOf.n), o.heartOf.n];
  if(o.item)       return [Math.min(state.inv[o.item]||0, o.n), o.n];
  if(o.totalLevel) return [Math.min(totalLevel(), o.totalLevel), o.totalLevel];
  if(o.gold)       return [Math.min(state.gold, o.gold), o.gold];
  if(o.talk)       return [state.rel[o.talk]?1:0, 1];
  if(o.mineDepth)  return [Math.min(state.mineBest||0, o.mineDepth), o.mineDepth];
  if(o.flag)       return [state.flags[o.flag]?1:0, 1];
  return [0,1];
}

// Who the main quest needs right now — the neighbour under the gold ✦ (drawn in renderWorld).
// Report-in beats everything; otherwise an unmet {talk:} objective points at its person.
function storyMarkerNpc(){
  const q = curQuest(); if(!q) return null;
  if(state.questReady) return QUEST_GIVER_NPC[q.giver] || null;
  for(const o of q.obj) if(o.talk && !objDone(o)) return o.talk;
  return null;
}

// The Guild's heartbeat: celebrate the moment a wing crosses to lit, instead of letting the
// story's central progress bar tick over silently inside a panel. state.wingsLit remembers how
// many were already celebrated (backfilled for old saves in migrateSave — no retro fanfare).
const WING_LINES = [
  "Rowan: “The %s wing… lit. I'd all but stopped believing.”",
  "Rowan: “%s, awake again. The hall remembers, you know.”",
  "Rowan: “Another window burning in the Guild tonight — %s. Thank you.”",
];
function checkWings(){
  if(!state || typeof wingsLit !== "function") return;
  const now = wingsLit();
  if(now <= (state.wingsLit||0)){ state.wingsLit = now; return; }
  const newly = WINGS.filter(w => w.lit()).slice(state.wingsLit||0);
  for(const w of newly){
    const line = WING_LINES[(state.wingsLit||0) % WING_LINES.length].replace("%s", w.name);
    banner("✦ The " + w.name + " wing glows again", (state.wingsLit+1) + " of 9 crafts relit.");
    setTimeout(() => { toast(line, "#ffe6a0"); playSfx("quest"); }, 1600);
    state.wingsLit = (state.wingsLit||0) + 1;
  }
}

let _questGuard = false;
function checkQuests(){
  if(_questGuard) return;             // avoid re-entrancy from give()/bump()
  _questGuard = true;
  checkWings();                       // wing-lighting rides the same triggers as quest progress
  let safety = 0;
  while(state.questIdx < QUESTS.length && !state.questReady){
    const q = QUESTS[state.questIdx];
    if(q.obj.every(objDone)){
      const npc = QUEST_GIVER_NPC[q.giver];
      if(npc){                        // quest with a real giver — wait for the player to report in
        state.questReady = true;
        setTimeout(() => toast("▸ Report to " + NPCDEF[npc].name + " — " + q.title, "#ffce5a"), 300);
        break;
      }
      advanceQuest(q);                // letters / "the valley" auto-complete
      if(safety++ > 12) break;
    } else break;
  }
  // ★ the last page of the ledger (v3.32) — once every quest in the book is done, Tom unlocks
  // the Storyteller's Banner (the quest cape). Flag, not a QP compare: cozy contract says the
  // banner stays earned even if later releases append more quests to the book.
  if(!state.flags.qpAllTold && state.questIdx >= QUESTS.length){
    state.flags.qpAllTold = true;   // latch — the quest cape stays earned no matter what (cozy contract)
    // v4.16: but the QUESTS chain now finishes at the tenth-door turn-in, which is the exact moment Act III
    // OPENS. Firing "Every Story Told" here announced the whole story was over as its longest act began.
    // The quest cape is for the QUEST book (Acts I–II) and is genuinely complete now — so say THAT. The
    // grand "the valley whole" fanfare belongs to Act III's own finale (the Tenth Lantern), where it fires.
    setTimeout(() => { banner("✦ The Book of Tasks, Complete ✦", questPoints() + " Quest Points — every quest in the valley's book is told. Tom has kept the Storyteller's Banner for you.");
      playSfx("legend"); }, 3600);   // let the final quest's own banner (3.2s) finish first
  }
  _questGuard = false;
  refreshQuestTracker();
}
function advanceQuest(q){
  completeQuest(q);
  state.questDone.push(q.id);
  state.questIdx++;
  state.questReady = false;
  if(state.questIdx < QUESTS.length){
    const nq = QUESTS[state.questIdx];
    setTimeout(() => toast("✒ New task: " + nq.title, "#ffce5a"), 900);
  }
  refreshQuestTracker();
}
// called when the player talks to an NPC — completes a ready quest given by them
function tryTurnIn(npcId){
  const q = QUESTS[state.questIdx];
  if(!q || !state.questReady || QUEST_GIVER_NPC[q.giver] !== npcId) return false;
  // questIdx advances now, but the turn-in cutscene that sets the NEXT quest's prerequisite flag
  // doesn't start for another ~250ms. A save landing in that gap (tab close) would strand the
  // chain on an unsatisfiable objective — so refuse to persist until the scene is actually running.
  state.flags.turnInPending = true;
  advanceQuest(q);
  const def = NPCDEF[npcId];
  if(q.turnIn && q.turnIn.cutscene){
    setTimeout(() => { state.flags.turnInPending = false; startCutscene(q.turnIn.cutscene); }, 250);
  } else {
    const line = (q.turnIn && q.turnIn.line) || (q.reward && q.reward.msg) || "Well done — thank you.";
    setTimeout(() => { state.flags.turnInPending = false;
      showDialog(def.name + "   " + heartStr(heartsOf(npcId)), line, def.portrait); }, 200);
  }
  return true;
}

function completeQuest(q){
  const r = q.reward || {};
  if(r.gold){ state.gold += r.gold; }
  if(r.items) for(const it in r.items) give(it, r.items[it], true);
  playSfx("quest");
  pSparkle(state.px, state.py-14, "#ffce5a", 16);

  if(q.finale){
    banner("✦ The Valley is Ready ✦", "Night falls on the coast…");
    paused = true; state.flags.festivalPending = true;   // lock control through the ~2s handoff
    setTimeout(startFestival, 1100);
  } else {
    // the QP leads the reward line (v3.32) — the ledger should be FELT at every completion,
    // not discovered later in a panel. (The finale keeps its own banner; its 4 QP still count.)
    const qp = q.qp || 1;
    banner("✔ " + q.title, "✦ +" + qp + " QP" + (r.gold ? " · " + r.gold + "g" : "") + (r.msg ? " · " + r.msg : ""));
  }
  if(r.gold) floatText(state.px, state.py-24, "+"+r.gold+"g", "#ffce5a");
  floatText(state.px, state.py-34, "✦ +" + (q.qp||1) + " QP", "#e8d18a");
  refreshHUD();
}

// data for the on-screen tracker (current quest only)
function trackerData(){
  const q = curQuest();
  if(!q) return wardTrackerData();   // v4.16: past the QUESTS chain, Act III lives in the Warden's Ledger
  if(state.questReady){
    const npc = QUEST_GIVER_NPC[q.giver];
    return { title:q.title, reportTo: npc ? NPCDEF[npc].name : "", objs:[] };
  }
  return {
    title: q.title,
    objs: q.obj.map(o => { const [c,m] = objProgress(o); return { text:o.text, cur:c, max:m, done:c>=m }; }),
  };
}
// v4.16 — Act III's on-screen next-step, SYNTHESIZED from the Warden's Ledger. Act III is deliberately
// NOT in the QUESTS chain (15-warding.js explains why: the ledger is self-contained), so the whole of it
// used to leave trackerData() returning null — the HUD card, the morning line and the Continue recap all
// went blank for three releases of content. This rebuilds the same {title, reportTo, objs} shape the HUD
// already knows how to draw, straight from the live ledger helpers. Only engages once the tenth door is
// open; before that (Acts I–II, or a save that never went down) it returns null exactly as before.
function wardTrackerData(){
  if(typeof wardChaptersAllDone !== "function" || !state.flags.tenthDoorOpen) return null;
  if(wardChaptersAllDone()){
    // finale done: point at the standing Round if today's page isn't walked yet, else nothing pressing.
    if(typeof todaysWardRound === "function"){
      const o = todaysWardRound();
      if(o && !wardRoundFilled()){
        const have = state.inv[o.item]||0;
        return { title:"The Warden's Round", reportTo:"", ledger:true,
          objs:[{ text:`Bring ${o.qty}× ${o.item} to the Ledger`, cur:Math.min(have,o.qty), max:o.qty, done:have>=o.qty }] };
      }
    }
    return null;
  }
  const def = wardChapterDef(); if(!def) return null;
  if(wardChapterReady(def))   // both halves met — send them to the book to close the page
    return { title:def.title, reportTo:"the Warden's Ledger", ledger:true, objs:[] };
  const objs = [];
  const rem = wardBundleRemaining(), paid = state.wardBundle||{};
  for(const it in def.bundle){
    const need = def.bundle[it], got = need - (rem[it]||0);
    objs.push({ text:it, cur:Math.min(got,need), max:need, done:!rem[it] });
  }
  objs.push({ text:def.expedition.text, cur:wardExpeditionDone(def)?1:0, max:1, done:wardExpeditionDone(def) });
  return { title:def.title, reportTo:"", ledger:true, objs };
}
