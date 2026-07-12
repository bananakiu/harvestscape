"use strict";
/* ============================================================
   09-quests.js — quest progression & story beats.
   ============================================================ */

function totalLevel(){ let t=0; for(const s in state.skills) t += skillLvl(s); return t; }
function curQuest(){ return QUESTS[state.questIdx] || null; }

// Which act the player is in — used to frame the tracker, journal, and Continue recap so the
// two-act structure is visible in casual play. Act I runs through the finale ("Wake the Valley").
const ACT_TITLES = { 1:"Act I — The Quiet Valley", 2:"Act II — The Empty Chair" };
function actInfo(){
  const n = (state && state.questIdx > FINALE_IDX) ? 2 : 1;
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
    banner("✔ " + q.title, r.gold ? ("Reward: " + r.gold + "g" + (r.msg?" · "+r.msg:"")) : (r.msg||"Nicely done."));
  }
  if(r.gold) floatText(state.px, state.py-24, "+"+r.gold+"g", "#ffce5a");
  refreshHUD();
}

// data for the on-screen tracker (current quest only)
function trackerData(){
  const q = curQuest();
  if(!q) return null;
  if(state.questReady){
    const npc = QUEST_GIVER_NPC[q.giver];
    return { title:q.title, reportTo: npc ? NPCDEF[npc].name : "", objs:[] };
  }
  return {
    title: q.title,
    objs: q.obj.map(o => { const [c,m] = objProgress(o); return { text:o.text, cur:c, max:m, done:c>=m }; }),
  };
}
