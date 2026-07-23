"use strict";
/* ============================================================
   14-story.js — the Nine Crafts, a cutscene engine, Grandpa's
   letters, quest turn-ins helper data, and the Festival finale.
   ============================================================ */

// ===================== THE NINE CRAFTS =====================
const WINGS = [
  { id:"farming",     name:"Farming",     lit:()=> skillLvl("Farming")>=10 },
  { id:"woodcutting", name:"Woodcutting", lit:()=> skillLvl("Woodcutting")>=8 },
  { id:"mining",      name:"Mining",      lit:()=> skillLvl("Mining")>=8 },
  { id:"fishing",     name:"Fishing",     lit:()=> skillLvl("Fishing")>=8 },
  { id:"cooking",     name:"Cooking",     lit:()=> (state.stats.cooked||0)>=8 },
  { id:"ranching",    name:"Ranching",    lit:()=> state.animals.chickens.length>=1 },
  { id:"foraging",    name:"Foraging",    lit:()=> (state.stats.forage||0)>=10 },
  { id:"smithing",    name:"Smithing",    lit:()=> (state.stats.toolUpgrades||0)>=2 },
  { id:"hearth",      name:"Hearthcraft", lit:()=> !!state.flags.festivalDone },
];
function wingById(id){ return WINGS.find(w=>w.id===id); }
function wingLit(id){ const w=wingById(id); return w ? w.lit() : false; }
function wingsLit(){ return WINGS.filter(w=>w.lit()).length; }

// which NPC a quest is turned in to (givers that map to a present NPC)
const QUEST_GIVER_NPC = { "Tom":"tom", "Maya":"maya", "Elder Rowan":"rowan", "Bram":"bram" };

// ===================== THE CALENDAR =====================
// state.day is 1-based and never resets; season/year are derived from it.
function YEAR(){ return Math.floor((state.day-1)/YEAR_DAYS) + 1; }
function dayOfSeason(d){ return (((d===undefined?state.day:d)-1) % SEASON_DAYS) + 1; }
function dayOfYear(d){ return (((d===undefined?state.day:d)-1) % YEAR_DAYS) + 1; }
// absolute position within a year, so events can be compared and sorted
function yearSlot(season, day){ return SEASONS.indexOf(season)*SEASON_DAYS + day; }

function festivalOn(season, day){ return FESTIVALS.find(f => f.season===season && f.day===day) || null; }

// The night you woke the valley becomes a fixture of the calendar, kept every year after.
function anniversaryFest(){
  if(!state.flags.festivalDone || state.flags.anniversaryDay == null) return null;
  const slot = state.flags.anniversaryDay;
  return { id:"anniversary", name:"The Lantern Festival",
           season: SEASONS[Math.floor((slot-1)/SEASON_DAYS)],
           day: ((slot-1) % SEASON_DAYS) + 1,
           from:18, to:26, blurb:"The night the valley woke. Every year, on the coast." };
}
function todaysFestival(){
  const a = anniversaryFest();
  if(a && a.season===curSeason() && a.day===dayOfSeason()) return a;
  return festivalOn(curSeason(), dayOfSeason());
}
function festivalDoneThisYear(f){ return !!state.flags["did_"+f.id+"_"+YEAR()]; }
// the festival is live only inside its hours, and only once per year
function festivalNow(){
  const f = todaysFestival();
  if(!f || festivalDoneThisYear(f)) return null;
  const h = state.time/60;
  return (h >= f.from && h < f.to) ? f : null;
}

function birthdayOn(season, day){
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id]; if(b.season===season && b.day===day) return id; }
  return null;
}
function isBirthday(id){ const b = BIRTHDAYS[id]; return !!b && b.season===curSeason() && b.day===dayOfSeason(); }
function birthdayToday(){ return birthdayOn(curSeason(), dayOfSeason()); }

// The next dated thing on the calendar, wrapping into next year. Used by the HUD pill.
function nextEvent(){
  const today = yearSlot(curSeason(), dayOfSeason());
  let best = null;
  // `spent` = today's occurrence is already behind us, so count to next year's
  const consider = (slot, spent, ev) => {
    let away = slot - today;
    if(away < 0) away += YEAR_DAYS;
    if(away === 0 && spent) away = YEAR_DAYS;
    if(!best || away < best.daysAway) best = { ...ev, daysAway:away };
  };
  for(const f of FESTIVALS)
    consider(yearSlot(f.season, f.day), festivalDoneThisYear(f), { id:f.id, name:f.name, kind:"festival" });
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id];
    consider(yearSlot(b.season, b.day), !!state.flags["bday_"+id+"_"+YEAR()],
      { id, name:NPCDEF[id].name+"'s birthday", kind:"birthday" });
  }
  if(state.flags.anniversaryDay != null)
    consider(state.flags.anniversaryDay, !!state.flags["did_anniversary_"+YEAR()],
      { id:"anniversary", name:"The Lantern Festival", kind:"festival" });
  return best;
}

// ===================== CUTSCENE ENGINE =====================
let cutscene = null;
let _festLaunch = 0, _festFx = null;
function isCutscene(){ return !!cutscene; }
function cutActor(id){
  if(id === "player") return {
    get x(){ return state.px; }, set x(v){ state.px=v; },
    get y(){ return state.py; }, set y(v){ state.py=v; },
    get face(){ return state.face; }, set face(v){ state.face=v; }, isPlayer:true };
  return (curMap.npcs && curMap.npcs.find(n=>n.id===id)) || null;
}
function startCutscene(steps, onEnd){
  if(state && state.mounted && typeof dismountHorse === "function") dismountHorse(false);   // v3.22: no scene plays out on horseback
  cutscene = { steps, i:-1, onEnd, waiting:null, timer:0, move:null };
  paused = true; $("stage").classList.add("cine");
  cutNext();
}
function cutNext(){
  if(!cutscene) return;
  cutscene.i++;
  if(cutscene.i >= cutscene.steps.length){ endCutscene(); return; }
  const s = cutscene.steps[cutscene.i];
  switch(s.type){
    case "say":   showDialog(s.who||"", s.text, s.portrait||"port_valley"); cutscene.waiting="dialog"; break;
    case "wait":  cutscene.waiting="time"; cutscene.timer=s.t||1; break;
    case "move": { const a=cutActor(s.actor); if(!a){ cutNext(); break; }
      cutscene.move={ a, isPlayer:!!a.isPlayer, tx:s.x*TILE+8, ty:s.y*TILE+8, face:s.face, sp:s.sp||46 };
      cutscene.waiting="move"; break; }
    case "face":  { const a=cutActor(s.actor); if(a) a.face=s.face; cutNext(); break; }
    case "setpos":{ const a=cutActor(s.actor); if(a){ a.x=s.x*TILE+8; a.y=s.y*TILE+8; if(s.face)a.face=s.face; } cutNext(); break; }
    case "sparkle": pSparkle(s.x*TILE+8, s.y*TILE+8, s.color||"#fff6b0", s.n||12); cutNext(); break;
    case "sfx":   playSfx(s.name); cutNext(); break;
    case "banner":banner(s.big, s.small||""); cutscene.waiting="time"; cutscene.timer=s.t||2.4; break;
    // set `waiting` BEFORE the async call — if the callback ever fires synchronously it must not
    // have its own waiting-state clobbered by the assignment that follows
    case "fade":  cutscene.waiting="fadecb"; fadeTo(s.on, ()=>{ if(s.on && s.then) s.then(); cutNext(); }); break;
    case "run":   if(s.fn) s.fn(); cutNext(); break;
    case "letter":cutscene.waiting="letter"; openLetter(s.head, s.text, ()=>cutNext()); break;
    default: cutNext();
  }
}
function updateCutscene(dt){
  if(_festLaunch > 0){ _festLaunch -= dt; festivalTick(dt); }
  if(!cutscene) return;
  if(cutscene.waiting === "time"){ cutscene.timer -= dt; if(cutscene.timer<=0){ cutscene.waiting=null; cutNext(); } }
  else if(cutscene.waiting === "move"){
    const m = cutscene.move, a = m.a;
    if(!a){ cutscene.waiting=null; cutscene.move=null; cutNext(); return; }
    const dx=m.tx-a.x, dy=m.ty-a.y, d=Math.hypot(dx,dy);
    // snap on arrival OR when this frame's step would overshoot — otherwise a long frame
    // makes the actor oscillate around the target forever and the scene never advances
    if(d < 1.6 || m.sp*dt >= d){ a.x=m.tx; a.y=m.ty; if(m.face) a.face=m.face;
      if(m.isPlayer) moving=false; else a.moving=false;
      cutscene.waiting=null; cutscene.move=null; cutNext(); }
    else { const sp=m.sp*dt; a.x+=dx/d*sp; a.y+=dy/d*sp;
      a.face = Math.abs(dx)>Math.abs(dy) ? (dx<0?"left":"right") : (dy<0?"up":"down");
      if(m.isPlayer){ moving=true; walkCycle+=dt*8; } else { a.moving=true; a.walk=(a.walk||0)+dt*8; } }
  }
}
function cutsceneAdvance(){
  if(!cutscene || cutscene.waiting!=="dialog") return false;
  if(!dlg.done){ advanceDialog(); return true; }
  closeDialog(); cutscene.waiting=null; cutNext(); return true;
}
function endCutscene(){
  const cb = cutscene ? cutscene.onEnd : null;
  cutscene = null; moving = false;
  $("stage").classList.remove("cine");
  if(dlg.open) closeDialog();
  paused = false;
  if(cb) cb();
}

// ===================== DAY-ONE ARRIVAL =====================
// Maya meets you at the farm the moment you take control, then the Act I banner names the goal.
// Both are skippable (advance the dialogue), fire once ever, and only on a fresh new-game save.
function actBanner(){
  const a = actInfo();
  banner(a.title, a.n === 1
    ? "Wake the valley — relight the Nine Crafts and bring the festival home."
    : "The lanterns are lit, but one chair is still empty.");
}
function maybeArrival(){
  if(!state || state.flags.arrivalSeen || state.day !== 1 || !state.flags.npxGame){ actBanner(); return; }
  // NB: arrivalSeen is set at the END of the scene (and saved there), NOT here — otherwise a reload
  // partway through the cutscene would drop the whole arrival + Act banner for good. Until it fully
  // plays, the save keeps arrivalSeen falsy, and continueGame() replays it (see 11-title.js).
  let maya = curMap.npcs.find(n => n.id === "maya");
  const spawned = !maya;
  if(spawned){ maya = mkNpc("maya", 12*TILE, 12*TILE, {face:"left"}); curMap.npcs.push(maya); }
  startCutscene([
    { type:"wait", t:0.5 },
    { type:"setpos", actor:"maya", x:12, y:12, face:"left" },
    { type:"move", actor:"maya", x:10, y:12, face:"left", sp:42 },
    { type:"say", who:"Maya", portrait:"port_maya",
      text:"You're here — you're really here! I'm Maya. I mind the place just over the fence." },
    { type:"say", who:"Maya", portrait:"port_maya",
      text:"Welcome to Willowbrook. It's… quieter than it used to be. Your grandpa's farm has waited a long while for someone to wake it up." },
    { type:"say", who:"Maya", portrait:"port_maya",
      text:"When you've found your feet, go and see Elder Rowan — the old man up at the Guild Hall. He can tell you the rest far better than I can." },
    { type:"say", who:"Maya", portrait:"port_maya",
      text:"For now, though? That little plot below your cottage is just begging for seeds. I'll leave you to it — welcome home." },
    { type:"move", actor:"maya", x:14, y:15, face:"down", sp:46 },
    { type:"run", fn:()=>{ if(spawned && !(curHour()>=7 && curHour()<18.5)){ const k=curMap.npcs.indexOf(maya); if(k>=0) curMap.npcs.splice(k,1); } } },
    { type:"run", fn:()=>{ state.flags.arrivalSeen = true; saveGame(); } },   // only now is it "seen" — persist it
    { type:"run", fn:actBanner },
  ]);
}

// ===================== THE LANTERN TEST (the midpoint) =====================
// At five of nine wings, the story takes one audible breath before the finale: Rowan risks
// stringing the old lanterns across the plaza, and they HALF work. A taste of the ending with a
// flicker of doubt in it — the arc's missing middle beat (STORY_OVERHAUL.md, v3.6.0). Fires once,
// on entering the village; the two test lanterns stay up afterwards (genVillage, lanternTest flag).
function maybeLanternTest(){
  if(!state || state.flags.lanternTest || state.flags.festivalActive) return;
  if(gameMode!=="play" || paused || isCutscene() || uiBlocking() || sleeping) return;
  if(!curMap || curMap.id !== "village") return;
  if(typeof wingsLit !== "function" || wingsLit() < 5) return;
  state.flags.lanternTest = true;   // set FIRST — re-entry during the fade must not double-fire
  const temp = [];
  const ensure = (id, x, y, face) => {
    let n = curMap.npcs.find(v => v.id === id);
    if(!n){ n = mkNpc(id, x*TILE, y*TILE, {face}); curMap.npcs.push(n); temp.push(n); }
    return n;
  };
  ensure("rowan", 18, 13, "right"); ensure("tom", 22, 13, "left"); ensure("maya", 19, 12, "down");
  startCutscene([
    { type:"wait", t:0.4 },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Ah. Good — another pair of hands. Hold this end and don't ask questions yet." },
    { type:"run", fn:()=>{ curMap.objects[key(18,11)]={kind:"lantern"}; curMap.objects[key(22,11)]={kind:"lantern"}; pSparkle(20*TILE, 11*TILE, "#ffd98a", 16); playSfx("gift"); } },
    { type:"say", who:"Tom", portrait:"port_tom", text:"Five wings. I said I'd string the lanterns at five, didn't I? …I remember saying that. Years ago, to somebody." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Half the line, lit on the first try. The blue one guttered." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"…The blue one always guttered. Rosa never could fix that either." },
    { type:"wait", t:1.0 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"It's not the festival. But from the right angle… it isn't nothing, is it?" },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Not yet. But nearer than I've been in eleven years. Back to work, the lot of us." },
    { type:"run", fn:()=>{ saveGame(); const h=curHour(); for(const n of temp){ if(n.id==="maya" && h>=7 && h<18.5) continue; const i=curMap.npcs.indexOf(n); if(i>=0) curMap.npcs.splice(i,1); } } },
    { type:"banner", big:"✦ The Lantern Test", small:"Half the line lit. Nearer than in eleven years.", t:3 },
  ]);
}

// Plaza life: Tom steps out of his store for a midday stretch, giving the square a third face
// alongside Maya and Pip's daytime wandering. Because NPCs only spawn on map entry, this runs from
// the main loop (like maybeLanternTest) and mutates curMap.npcs live — adding Tom when the noon
// window opens and removing him when it closes or the coat of the day moves on. He's marked
// _plazaTom so he's never confused with the festival/lantern-test Tom, and npcRegionNow already
// reports Tom in the village, so the "where is everyone" panel stays honest.
function maybePlazaLife(){
  if(!state || gameMode!=="play" || paused || isCutscene() || uiBlocking() || sleeping) return;
  if(!curMap || curMap.id !== "village") return;
  // Stand down while the Lantern Test is pending (5 wings lit, not yet played): its cutscene stages
  // its own Tom via a find-by-id, and an ambient plaza-Tom present at that moment would be grabbed
  // and mispositioned. Suppressing him for that one-frame-to-one-day window is invisible.
  if(typeof wingsLit === "function" && wingsLit() >= 5 && !state.flags.lanternTest) return;
  const h = curHour();
  const midday = h >= 11.5 && h < 14;
  const tom = curMap.npcs.find(n => n._plazaTom);
  if(midday && !tom){
    const t = mkNpc("tom", 10*TILE, 12*TILE, { face:"down", wander:{ x0:9, y0:11, x1:12, y1:14 } });
    t._plazaTom = true; curMap.npcs.push(t);
    // announce it once a day, not on every re-entry during the window
    if(state.flags.tomPlazaDay !== state.day){ state.flags.tomPlazaDay = state.day; toast("Tom's out front of the store, taking the air.", "#e9dcc0"); }
  } else if(!midday && tom){
    const i = curMap.npcs.indexOf(tom); if(i>=0) curMap.npcs.splice(i,1);
  }
}

// ===================== GRANDPA'S LETTERS =====================
let _letterCb = null;
function openLetter(head, text, onClose){
  paused = true;
  const intro = $("intro"); intro.classList.remove("hidden");
  intro.querySelector(".lhead").textContent = head || "✒ A letter";
  const btn = $("btnLetterNext"); btn.textContent = "Continue ▸"; btn.classList.remove("show");
  _letterCb = onClose;
  typeLetter($("letterBody"), text, ()=> btn.classList.add("show"));
  btn.onclick = () => {
    intro.classList.add("hidden"); intro.onclick = null;
    const cb = _letterCb; _letterCb = null;
    if(!isCutscene()) paused = false;
    if(cb) cb();
  };
  intro.onclick = e => { if(e.target.closest("#btnLetterNext")) return; if(_letterActive) finishLetter(); };
}

const LETTER_CHEST =
"My dear grandchild,\n\n" +
"If you've opened this chest, then you've made the old place a home again — which means you're ready for the rest of it.\n\n" +
"I was the valley's Festival-Keeper, once. The ninth craft of the Guild was never a trade you could sell at Tom's counter. It was the gathering — lanterns on the water, one long table, the whole valley in one place for one night. I kept that flame.\n\n" +
"Then one winter we lost Rosa Alderman — Maya's grandmother, the finest baker Willowbrook ever had, and the truest friend I had in this world. I couldn't light the lanterns without her. 'Next year,' I said. I said it for a great many years.\n\n" +
"A valley that forgets to gather forgets how to be a valley. The Guild's doors closed one craft at a time — and it began with mine.\n\n" +
"The pin was Rosa's, then mine. It's yours now. I broke a thing by grieving too long, kiddo. You'll mend it by living well.\n\n— Grandpa";

const LETTER_ROWAN =
"Kiddo,\n\n" +
"If Rowan handed you this, then you've been down to the vault and back, and the Star Metal is in the valley's hands again. He'll pretend he isn't moved. He is.\n\n" +
"Rowan and I didn't speak the last ten years of my life. He thought I'd let the valley die out of self-pity. He was right — and I couldn't stand that he was right. Old men are fools twice: once for the grieving, once for the pride.\n\n" +
"You've a gentler way than I ever had. Use it on him.\n\n" +
"One thing left undone. Light the lanterns. Fill the table. Do the thing I couldn't.\n\n— Grandpa";

const LETTER_ROWAN_UNSENT =
"Old friend,\n\n" +
"You will not open your door to me, so I will put it under it.\n\n" +
"I called you a coward in front of the whole Guild. I have turned that hour over every night since, and it never once comes out differently: I was standing in a hall you built, wearing a pin you gave me, telling a man who had just buried the woman he loved that he owed the valley a festival.\n\n" +
"I did not know how to say I miss her too. So I said you were failing us. It was the cruellest available sentence and I reached for it because it was the only one that did not require me to weep in front of you.\n\n" +
"Rosa used to say the two of us were the same man, poured into different weather.\n\n" +
"The wings can stay dark, Aldous. Come and sit in the dark hall with me. I will not say one word about the crafts. I will not say one word at all, if that is what it takes.\n\n" +
"Only open the door.\n\n— Rowan";

const LETTER_MEMORIAL =
"ROSA ALDERMAN — who fed the valley\n" +
"ALDOUS — who lit its lanterns\n" +
"\n" +
"— and folded into the stone, in a hand you know —\n\n" +
"Kiddo,\n\n" +
"If there's a stone here, then someone finally said the thing out loud, and I'd bet the farm it was you.\n\n" +
"Here is the truth I never wrote down. The festival did not die because I was sad. It died because I was ashamed. Rosa and I planned that last one together at her kitchen table, and she went into the ground three weeks before it, and when the night came I could not walk down to that water and be the man who lit the lanterns without her.\n\n" +
"So I didn't go. And the next year it was easier not to go. And the year after that, there was nothing to not go to.\n\n" +
"Grief you can live alongside. It moves in, it eats your bread, and eventually the two of you come to an arrangement. It's the shame that shuts the doors — shame at the year you missed, and the friend you didn't answer, and the boy who walked north up the coast road because his mother was gone and nobody in this valley, myself first among them, went after him.\n\n" +
"Elias. If you are reading this beside him, then you did the one thing I was too proud and too slow to do.\n\n" +
"Don't put me on this stone alone. Put her name first. She'd have hated the fuss and she'd have stayed for all of it.\n\n" +
"Light them every year, kiddo. Even the year you don't feel like it. Especially that one.\n\n— Grandpa";

// v4.17: the Act III epilogue — Elias's "one last letter", in the register of Grandpa's. Left the morning
// after the tenth lantern is lit, warden to the warden who came after. Fired once from closeWardChapter's
// all-done branch (state.flags.wardEpilogueSeen gates it). Closes Orla's thread and hands the craft on.
const LETTER_WARDEN_EPILOGUE =
"Left on your kitchen table, in a warden's small, careful hand — the same hand as the ledger:\n\n" +
"So. It's done, and I find I don't know how to be a warden who's finished, having spent thirty years being one who never could be.\n\n" +
"I'll not make a speech of it — I've watched Rowan try and it's a long business. I'll only tell you the thing Orla told me, the day she handed me the ledger, that I was too young and too frightened to understand:\n\n" +
"A warden doesn't hold back the dark. Nobody can, and the ones who think they can are the ones the dark keeps. A warden just refuses to let a place be alone in it. That's all. You go down, you light what's gone cold, you sit with what's grieving until it can let go, and you come back up for supper so that somebody knows the way. That is the whole of the craft, and you found it on the first page, and you have never once put it down.\n\n" +
"I looked for her down there for eleven years without ever going below the fifteenth floor. You brought her up in a season. Not her body — the dark keeps that. Her NAME. Her round, walked again. The floor she died on, warm. I go to sleep now and she isn't cold and alone at the bottom of my own failure any longer; she's counted, and lit, and kept. I didn't know a person could give another person that. You did it without being asked.\n\n" +
"The ledger's yours. Keep writing the rounds — the wing will always need them, the way a hearth always needs tending, and that's not a burden, it's the good kind of forever. And when your hands are old and there's someone stubborn enough to come and fetch you all home, hand them the book, and tell them about the warden before you, and the one before her, all the way down to a frightened girl named Orla who first wrote 'go gently, mind the bells, come up for supper' inside the front cover.\n\n" +
"Come up for supper. Maya's cooking. She says you're family now, and she's right, and I'm too tired and too happy to pretend otherwise.\n\n— Elias";

const LETTER_FESTIVAL =
"My dear grandchild,\n\n" +
"I'm not there tonight — but I know exactly how it looks, because I saw it a hundred times before I let it go dark. The lanterns doubling on the black water. The Aldermans laughing. Tom giving away more than he sells. Some child eating far too much.\n\n" +
"You did the one thing I never could: you let the valley gather again. That was always the ninth craft. Not farming, not fishing — the making of a place people want to stay.\n\n" +
"Look up when the lanterns rise. That one's mine. Rosa's is the one beside it.\n\n" +
"Welcome home, kiddo. You always were.\n\n— Grandpa";

// ===================== ROWAN'S RESTORATION PROJECTS =====================
// Fund -> pending -> the next morning it exists. The farm persists, so applyProjects() must be
// idempotent (check-before-place, exactly like raiseMemorial).
// Cottage end / mine-mouth end. Each cart's landing tile is the one BELOW it, so both must be
// walkable — (12,8) is the shipping bin, which is why the cottage cart sits east of the path.
const CART_A = [14,7];   // the farm's cart end; the village end lives in genVillage (35,14)

function projectDone(id){ return !!state.flags["proj_"+id]; }
function projectPending(id){ return !!state.flags["proj_"+id+"_pending"]; }
function canFund(p){
  if(projectDone(p.id) || projectPending(p.id)) return false;
  if(state.gold < p.gold) return false;
  for(const it in p.items) if((state.inv[it]||0) < p.items[it]) return false;
  return true;
}
// v3.27 "Rowan's Workshop": the owner asked for construction introduced through a quest — through
// building the coop. The coop is the on-ramp, so the first time you raise it Rowan comes to see it and
// delivers the joinery scene the coop's own blurb promises ("Rowan will walk you through the joinery").
// Fired once from maybeBuildCeremony (not the linear quest spine — a cutscene keyed to the build event).
function coopRaiseScene(){
  return [
    { type:"sfx", name:"upgrade" },
    { type:"sparkle", x:15, y:5, color:"#ffe6a0", n:22 },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"So you've gone and raised it yourself. Let me look… Oak sills. A stone footing, level and true. The joints pegged, not nailed. Child — you've a carpenter's hands and never knew it." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"The Guild counted nine crafts, and I kept every ledger. It never counted the tenth: the making of a place that holds the weather out and the warmth in. A coop. A barn. A home. That was always the one that mattered most." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Mill your timber at the Sawmill, bring the lumber to my ledger, and we'll raise whatever the valley wants next — a barn for the herd, a stable and a horse for the coast road. The old workshop is open again, and it's yours." },
    { type:"banner", big:"🏗 The Coop is raised", small:"Rowan's Workshop is open — build on, from the Ledger.", t:2.8 },
  ];
}
// A building overwrites its footprint with walls — so it must never bury a crop or a placed object
// (the cozy contract: nothing is ever taken). Refuse to fund until the site is clear.
function buildingSiteBlocked(p){
  if(!p.site || !state.farm) return null;
  const [x0,y0,x1,y1] = p.site;
  const tiles = [];
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) tiles.push([x,y]);
  if(p.sign) tiles.push(p.sign);   // the stamp also drops a sign object here — guard it too
  for(const [x,y] of tiles){
    const k = key(x,y);
    if(state.farm.crops[k]) return "a crop is growing";
    const o = state.farm.objects[k];
    if(o && o.kind !== "sign") return o.kind==="beehive"||MACHINES[o.kind]||DECOR[o.kind]||FRUIT_TREES[o.kind]
      ? "something you placed is in the way — lift it with the axe" : "something's in the way";
  }
  return null;
}
function fundProject(id){
  const p = PROJECT_BY_ID[id];
  if(!p || !canFund(p)){ playSfx("error"); return; }
  const blocked = buildingSiteBlocked(p);
  if(blocked){ toast(`Clear the ${p.name.replace(/^The /,"").toLowerCase()} site first — ${blocked}.`, "#c98a6a"); playSfx("error"); return; }
  state.gold -= p.gold;
  for(const it in p.items) take(it, p.items[it]);
  state.flags["proj_"+id+"_pending"] = true;
  playSfx("coin"); pSparkle(state.px, state.py-14, "#ffce5a", 16);
  toast(`${p.name} — the work begins at dawn.`, "#ffce5a");
  refreshHUD(); renderProjects();
}
// Called from newDay: pending work finishes overnight. Returns the names finished.
function completeProjects(){
  const finished = [], deferred = [];
  for(const p of PROJECTS){
    if(state.flags["proj_"+p.id+"_pending"] && !state.flags["proj_"+p.id]){
      // A building stamps solid walls over its footprint. If the player planted/placed something there
      // AFTER funding (the site was clear then), DON'T bury it — leave the work pending and retry next
      // morning, exactly like put1's crop-safe placement. Nothing is ever taken from the player.
      if(p.building && buildingSiteBlocked(p)){ deferred.push(p); continue; }
      state.flags["proj_"+p.id] = true;
      delete state.flags["proj_"+p.id+"_pending"];
      finished.push(p);
    }
  }
  if(finished.length) applyProjects(state.farm);
  if(deferred.length) setTimeout(() => toast(`Clear the ${deferred[0].name.replace(/^The /,"").toLowerCase()} site — the crew can't raise it over what's there. They'll try again tomorrow.`, "#c98a6a"), 1600);
  return finished;
}
// Idempotent world changes on the PERSISTENT farm map. Safe to run on every boot and after every
// completion. v3: the fountain, boardwalk, and the village-side cart moved into genVillage (the
// village regenerates daily, so it reads state.flags directly) — the farm keeps only its cart end.
function applyProjects(farm){
  if(!farm || !state.flags) return;
  // never bury a growing crop under a solid object — the tile is re-tried each morning
  const put1 = (x,y,o) => { const k = key(x,y); if(!farm.objects[k] && !farm.crops[k]) farm.objects[k] = o; };
  if(state.flags.proj_minecart) put1(CART_A[0], CART_A[1], { kind:"railcart", to:"village" });
  if(state.flags.proj_coop) stampCoop(farm);   // v3.21: raise the coop the morning after it's funded (idempotent)
  if(state.flags.proj_barn) stampBarn(farm);   // v3.21: same for the barn
  if(state.flags.proj_stable) stampStable(farm);   // v3.22: the stable
}
// The fountain: one coin a day buys you a little goodwill somewhere in the valley.
function tossCoin(){
  if(state.flags.coinDay === state.day){
    showDialog("The Fountain","Your wish is already down there, somewhere among the others. Give it a day to work.","port_valley"); return; }
  if(state.gold < 10){ toast("You haven't a coin to spare.", "#ff8a7a"); playSfx("error"); return; }
  state.gold -= 10; state.flags.coinDay = state.day;
  const who = pick(FEST_CAST.concat(state.flags.act2Done ? ["elias"] : []));
  ensureRel(who).points += 10;
  playSfx("coin"); pSplash(20*TILE+8, 14*TILE+8, 8);   // the village fountain (genVillage plaza centre)
  pSparkle(state.px, state.py-14, "#8fd3ff", 10); refreshHUD();
  showDialog("The Fountain",
    `The coin turns once and goes under.\n\nSomehow, by evening, ${NPCDEF[who].name} will have heard you were thinking of them.`,
    "port_valley");
}

// ===================== BRAM'S LEDGER: THE FIVE LEGENDS =====================
// One clue per heart. He hands them over in order, in his own time, and each writes itself into
// the Almanac. Nothing is missable — the seasons come round again.
function bramClueDue(){
  const h = heartsOf("bram");
  for(let i = 0; i < LEGENDS.length; i++){
    const l = LEGENDS[i];
    if(h >= i + 1 && !state.flags["clue_" + l.id]) return l;
  }
  return null;
}
function tellClue(l){
  state.flags["clue_" + l.id] = true;
  playSfx("quest"); pSparkle(state.px, state.py-14, l.pal[1], 12);
  showDialog("Bram   " + heartStr(heartsOf("bram")), l.clue, "port_bram");
  setTimeout(() => toast(`Bram's ledger — ${cluesKnown()}/${LEGENDS.length} legends known`, "#8fd3ff"), 700);
}
// The crown of the Hunt. Land all five legends, talk to Bram, and he gives you the one thing he
// has never given anyone: his oilskin — and with it the sea in any weather. A capability, not gold.
function startHuntCrown(){
  if(state.flags.huntCrowned) return;
  state.flags.huntCrowned = true;
  startCutscene([
    { type:"say", who:"Bram", portrait:"port_bram", text:"All five. The Sunfleck, the Moonscale, the Whitefin, the Frostjaw, and the one my father swore he saw off the pond in the storm." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"I gave you those five secrets one at a time because I wanted to see if you'd chase them, or just nod and forget. You chased them. In the fog. In the snow. Before dawn." },
    { type:"say", who:"You", portrait:"port_player", text:"You could've caught them yourself." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"Aye. I never did. Some part of me wanted to leave the valley one thing still worth getting up for. Turns out that thing was you." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"Here. My oilskin. It's kept the weather off me for thirty years. It'll keep it off you." },
    { type:"sfx", name:"level" },
    { type:"run", fn:()=>{ give("Bram's Oilskin", 1, true); pSparkle(state.px, state.py-12, "#5aa5bd", 22);
                           ensureRel("bram").points = Math.max(state.rel.bram.points, 500); } },
    { type:"banner", big:"✦ Bram's Oilskin ✦", small:"The fish come faster — and the storm is yours to fish now", t:3.4 },
    { type:"say", who:"Bram", portrait:"port_bram", text:"When it storms, don't sit at home. Take my boat. The sea knows you now. …Go on. Before I say something we'll both have to live down." },
  ], () => { saveGame(); });
}

function legendConditions(l){
  const hrs = h => { const x = Math.floor(h) % 24, ap = x >= 12 ? "pm" : "am"; let t = x % 12; if(!t) t = 12; return t + ap; };
  const where = l.where === "pond" ? "the farm pond" : "the coast";
  return `${where} · ${hrs(l.from)}–${hrs(l.to)} · ${weatherInfo(l.weather).name}` +
         (l.season ? ` · ${l.season}` : " · any season");
}

// ===================== THE VILLAGE NOTICEBOARD =====================
// One request a day, chosen from what you could plausibly have. Skippable, expires at dawn.
const WOOD_ITEMS = new Set(["Wood","Pine Wood","Maple Wood"]);
const ORE_ITEMS  = new Set(["Stone","Copper Ore","Iron Ore","Gold Ore"]);

function requestSkill(item){
  if(CROP_NAMES.has(item)) return "Farming";
  if(FISH.some(f => f.name === item)) return "Fishing";
  if(WOOD_ITEMS.has(item)) return "Woodcutting";
  if(ORE_ITEMS.has(item) || GEMS[item]) return "Mining";
  return null;                                    // eggs, shells, salad — no gate
}
// Never post a request the player has no way of filling.
function requestReachable(r){ const s = requestSkill(r.item); return !s || skillLvl(s) >= r.lvl; }
function requestPay(r){ return Math.max(60, Math.round((ITEM_SELL[r.item]||0) * r.qty * 1.4)); }

// Chosen once per day and remembered, so it can't reshuffle when your skills tick up mid-morning.
function todaysRequest(){
  if(state.flags.reqDay === state.day)
    return state.flags.reqIdx >= 0 ? REQUESTS[state.flags.reqIdx] : null;
  const pool = [];
  REQUESTS.forEach((r,i) => { if(requestReachable(r)) pool.push(i); });
  const rng = makeRng(4242 + state.day*31);
  const idx = pool.length ? pool[Math.floor(rng()*pool.length)] : -1;
  state.flags.reqDay = state.day; state.flags.reqIdx = idx;
  return idx >= 0 ? REQUESTS[idx] : null;
}
function requestFilled(){ return state.flags.reqDone === state.day; }

// Called from talkNpc, right after tryTurnIn so a story turn-in always wins.
function tryFulfillRequest(npcId){
  if(requestFilled()) return false;
  const r = todaysRequest();
  if(!r || r.who !== npcId) return false;
  if((state.inv[r.item]||0) < r.qty) return false;
  take(r.item, r.qty);
  const pay = requestPay(r);
  state.gold += pay; bump("earned", pay); bump("requests", 1);
  ensureRel(npcId).points += 25;
  state.flags.reqDone = state.day;
  playSfx("coin"); floatText(state.px, state.py-24, "+"+pay+"g", "#ffce5a");
  pSparkle(state.px, state.py-14, "#ffce5a", 12); refreshHUD(); refreshQuestTracker();
  const def = NPCDEF[npcId];
  showDialog(def.name + "   " + heartStr(heartsOf(npcId)), r.line, def.portrait);
  setTimeout(() => toast(`Board request filled — +${pay}g, +25 ♥`, "#ffce5a"), 300);
  return true;
}

// The forecast, as Tom chalks it on the board each evening.
function forecastLine(){
  const f = weatherInfo(state.forecast || "clear");
  return `${f.icon} Tomorrow: ${f.name}. ${f.offer}`;
}

// What the board itself says when you read it.
function boardText(){
  const w = weatherInfo(state.weather);
  const head = `${w.icon} Today: ${w.name}. ${w.offer}\n${forecastLine()}\n\n────────────\n\n`;
  const r = todaysRequest();
  if(!r) return head + "Nothing else pinned today. Come back tomorrow.";
  const def = NPCDEF[r.who];
  if(requestFilled()) return head + `“${r.qty} × ${r.item}” — ${def.name}\n\n…and a second hand has scrawled FILLED across it, in your handwriting.`;
  const have = state.inv[r.item] || 0;
  return head + `Wanted: ${r.qty} × ${r.item}\nAsking: ${def.name}\nPays: ${requestPay(r)}g, and their thanks.\n\n` +
    (have >= r.qty ? `You have ${have}. Go and find ${def.name}.` : `You have ${have} of ${r.qty}.`);
}

// ===================== GRANDPA'S ALMANAC =====================
// Nine torn pages, found by DOING things in the places he lived — not by hunting collectibles.
// They carry the story through the long middle of the game, where the quest chain goes quiet.
const JOURNAL_PAGES = [
  { n:1, title:"On Soil",
    text:"Spring, some year or other.\n\nThe first cut of the season and the ground still argues with me. It always does. Rosa says a field is a conversation you have once a year with something that does not speak your language and does not intend to learn it.\n\nShe is, as usual, right, and I shall not be telling her so.\n\nTurn it, water it, and let it be. The soil has never once needed my opinion." },
  { n:2, title:"On the Deep",
    text:"Third floor down, and the lamp guttering.\n\nRowan swears the old Guild cut these tunnels looking for star metal, and I swear they cut them looking for a reason not to go home. Both can be true of a man with a pick.\n\nThe deep is honest, at least. It gives you exactly what you are willing to swing for, and it never once pretends to like you.\n\nCome up before your light does. Always." },
  { n:3, title:"On Pine",
    text:"Cut the big pine on the ridge today. I was sixty-one and wept like a child, and I have no explanation I care to offer.\n\nRosa planted it the year we opened the Guild. She'd have called me a sentimental old fool and then she'd have kept a piece of it on the mantel, so I have kept a piece of it on the mantel.\n\nPine takes the water. That is what it is for. Remember that." },
  { n:4, title:"On Salmon",
    text:"The run came late this year and Bram's father sat on those rocks for eleven days waiting for it, and on the twelfth he caught more fish than his boat could carry, and he gave every one of them away.\n\nI asked him why. He looked at me as if I had asked why the tide.\n\n'They came back,' he said. 'So I gave them back.'\n\nI have thought about that sentence for thirty years." },
  { n:5, title:"On the Nine",
    text:"Five wings lit tonight. Five! I sat in the hall until the lamps burned down just to look at it.\n\nA craft is not a job, whatever Tom's ledger says. A craft is a promise that you will still be here tomorrow, doing the thing badly, until one day you are doing it well.\n\nNine promises. That was all the Guild ever was. Nine people saying: I'll be here.\n\nI meant mine. For a while, I meant mine." },
  { n:6, title:"On Rain",
    text:"Rain, and nothing to do about it, which is the finest gift the sky gives a farmer.\n\nRosa is baking. The whole house smells of it. She has flour on her wrist and she is arguing with the oven and losing, and I am sitting here writing about rain because I do not have the words for the other thing.\n\nIf you are reading this on a wet morning: don't work. Sit down. Look at whoever is in the room." },
  { n:7, title:"On Giving",
    text:"You cannot buy your way into a valley. I have watched men try.\n\nBut give a man a turnip he did not ask for, on a day he did not expect it, and you have done something a shop cannot do. It is not the turnip.\n\nTom knows this and pretends he doesn't. Rowan doesn't know it and pretends he does.\n\nGive things away, kiddo. It is the only reliable interest rate I have ever found." },
  { n:8, title:"On the Vault",
    text:"It is behind the seal, and it will still be behind the seal when I am gone, because I have not got the arm for it any more and I have not got the heart to ask Rowan.\n\nThe metal isn't the founding gift. That's the joke of it. The gift was nine fools agreeing to meet on a beach once a year.\n\nWhoever opens this door: the metal is heavy and it is not the point. Bring it up anyway. Rowan will pretend not to weep." },
  { n:9, title:"The Last Page",
    text:"My dear grandchild,\n\nThere is one thing I have not written down anywhere, and I find I can only write it on the last page of a book nobody was ever meant to finish.\n\nYour mother left this valley at nineteen and she was right to. I told her so at the gate, and then I went inside and did not come out for two days.\n\nShe wrote every month. I answered perhaps one letter in three, because I am a coward with a pen, and because every letter I did not answer was a small proof that I was still angry about something I could not name.\n\nShe was not running from me. She was running from a place that had decided to stop.\n\nAnd here you are, standing in the same kitchen, having done the one thing that would have brought her home.\n\nTell her. Don't wait as I waited. Sit down tonight and write the letter I never wrote, and put her name on it, and post it in the morning before you can talk yourself out of it.\n\nThat is the whole of my estate, kiddo. The farm is just where I kept it.\n\n— Grandpa" },
];
const PAGE_BY_N = {}; JOURNAL_PAGES.forEach(p => PAGE_BY_N[p.n] = p);

function pagesFound(){ let n=0; for(const p of JOURNAL_PAGES) if(state.flags["page_"+p.n]) n++; return n; }

// Idempotent, safe to call from any hot path — bails instantly once the page is found.
function foundPage(n){
  if(state.flags["page_"+n] || !PAGE_BY_N[n]) return false;
  const p = PAGE_BY_N[n];
  state.flags["page_"+n] = true;
  playSfx("quest"); pSparkle(state.px, state.py-14, "#e8d9a8", 14);
  openLetter("✒ A torn page — " + p.title, p.text);
  const found = pagesFound();
  setTimeout(() => toast(`Grandpa's Almanac — ${found}/9 pages`, "#e8d9a8"), 200);
  return true;
}

// A page must never interrupt a cutscene, a fade, a dialogue or the sleep card. Wait for a
// quiet moment, then hand it over. Bounded so it can never spin forever.
function queuePage(n, delay){
  if(state.flags["page_"+n] || !PAGE_BY_N[n]) return;
  let tries = 0;
  const attempt = () => {
    if(state.flags["page_"+n]) return;
    if(++tries > 120) return;                                  // ~60s of waiting, then give up quietly
    if(isCutscene() || paused || sleeping || uiBlocking() || gameMode !== "play"){ setTimeout(attempt, 500); return; }
    foundPage(n);
  };
  setTimeout(attempt, delay === undefined ? 700 : delay);
}

// Most pages hang off a repeatable act (till again, chop another pine, catch another salmon), so a
// missed delivery simply retries. The vault is one-shot — if that page ever fails to land, it would be
// gone for good. Re-offer anything whose condition is permanently satisfied, each morning.
function catchUpPages(){
  if(gameMode !== "play" || !state || !state.flags) return;
  if((state.stats.tilled||0) > 0)    queuePage(1, 300);
  if((state.mineBest||0) >= 3)       queuePage(2, 300);
  if(wingsLit() >= 5)                queuePage(5, 300);
  if(state.flags.foundVault)         queuePage(8, 300);
}

// Called at the end of setMap — the one place that knows you have arrived somewhere.
function onEnterMap(id){
  if(gameMode !== "play" || !state || !state.flags) return;
  if(id === "guild" && wingsLit() >= 5) queuePage(5, 1200);
  if(id === "mine" && (state.mineDepth||1) >= 3) queuePage(2, 1200);
}

// Page 9 is a letter under the door, the morning after you've found everything else
// and stood at the memorial. Called from the sleep handoff, never mid-scene.
function maybeLastPage(){
  if(state.flags.page_9) return;
  if(!state.flags.act2Done || !state.flags.memorialRead) return;
  for(let i=1;i<=8;i++) if(!state.flags["page_"+i]) return;
  if(isCutscene() || paused || sleeping || uiBlocking() || gameMode !== "play") return;  // try again tomorrow
  state.flags.page_9 = true;
  playSfx("quest");
  openLetter("✒ Slipped under the cottage door", PAGE_BY_N[9].text);
}

// ===================== THE FESTIVAL =====================
function startFestival(){
  if(state.flags.festivalDone || state.flags.festivalActive) return;   // idempotent
  // Never yank the player out of a scene already playing (a heart event or the proposal can be
  // triggered by the very talk that completes the finale). Wait for it to finish instead.
  if(isCutscene()){ state.flags.festivalPending = true; setTimeout(startFestival, 800); return; }
  state.flags.festivalActive = true; state.flags.festivalPending = false;
  state.time = 19.6 * 60;                 // deep dusk, so the lanterns glow
  paused = true;                          // lock control through the fade handoff
  clearMapCache();                        // force the beach to regenerate festival-dressed
  playSfx("wake");
  fadeTo(true, () => {
    setMap("beach", 23*TILE+8, 11*TILE, "up");   // festival-dressed via the flag
    paused = true;
    fadeTo(false);
    setTimeout(() => startCutscene(buildFestivalSteps(), festivalEnd), 500);
  });
}
function buildFestivalSteps(){
  const hh = heartsOf("maya");
  // she only makes the confession if your heart isn't already spoken for elsewhere
  const free = !state.flags.married || spouseId() === "maya";
  const mayaLine = (hh >= 5 && free)
    ? "I used to draw these lanterns because I couldn't picture anyone ever lighting them again. ... Now I can't picture this valley without you. I don't want to. Stay. Stay with me — for good. ♥"
    : "Rosa's recipes, Tom's coin, Bram's catch, your two hands. It took all of us to wake it. ... I'm so glad it was you who came. Truly.";
  return [
    { type:"wait", t:0.7 },
    { type:"banner", big:"✦ The Grand Festival ✦", small:"Willowbrook gathers again", t:2.6 },
    { type:"move", actor:"player", x:23, y:9, face:"up" },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan",
      text:"You came. They all came. Listen to it — the whole valley in one place, for one night. I had forgotten what that sounded like." },
    { type:"say", who:"Tom", portrait:"port_tom",
      text:"Everything on my stall's free tonight, farmer! Don't tell my accountant. I don't have an accountant. ...You could be my accountant." },
    { type:"say", who:"Bram", portrait:"port_bram",
      text:"...Hauled up something worthy of the night. Won't say how big. You'd call me a liar. Pip already did, twice." },
    { type:"say", who:"Pip", portrait:"port_pip",
      text:"I ate NINE whole things! Miss Maya says the lanterns float RIGHT up into the sky! That's magic. It's DEFINITELY magic." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan",
      text:"The ninth wing was never a craft you could forge, child. It was this. The gathering. Your grandfather kept its flame — then let it gutter. You lit it again." },
    { type:"run", fn:()=>{ state.flags.festivalDone = true; } },   // Star Metal already delivered to Rowan
    { type:"sfx", name:"quest" },
    { type:"sparkle", x:23, y:4, color:"#fff6d0", n:26 },
    { type:"banner", big:"✦ The Ninth Wing Lights ✦", small:"Hearthcraft — the craft of gathering", t:2.6 },
    { type:"move", actor:"maya", x:20, y:16, face:"down", sp:40 },
    { type:"move", actor:"player", x:22, y:16, face:"left" },
    { type:"say", who:"Maya   "+heartStr(hh), portrait:"port_maya", text: mayaLine },
    { type:"run", fn:()=>{ festivalLaunch(5); playSfx("level"); } },
    { type:"wait", t:1.4 },
    { type:"banner", big:"🏮 The Lanterns Rise 🏮", small:"", t:2.6 },
    { type:"wait", t:2.6 },
    { type:"letter", head:"✒ One last letter, tucked inside a lantern", text: LETTER_FESTIVAL },
    { type:"banner", big:"Thank you for playing ♥", small:"Willowbrook is awake — and it's yours", t:3.6 },
    { type:"wait", t:1.2 },
  ];
}
function festivalEnd(){
  state.flags.festivalActive = false;
  _festLaunch = 0; _festFx = null;
  // the finale forces the clock to dusk, so if tonight is also a seasonal festival's date it would
  // hijack control the moment the finale ends. One festival a night.
  const tonight = festivalOn(curSeason(), dayOfSeason());
  if(tonight) state.flags["did_"+tonight.id+"_"+YEAR()] = true;
  if(state.flags.anniversaryDay == null){                    // remember tonight, and keep it every year
    let slot = yearSlot(curSeason(), dayOfSeason());
    // if tonight happens to be a seasonal festival's date, keep the anniversary a day clear of it
    while(festivalOn(SEASONS[Math.floor((slot-1)/SEASON_DAYS)], ((slot-1)%SEASON_DAYS)+1))
      slot = (slot % YEAR_DAYS) + 1;
    state.flags.anniversaryDay = slot;
    state.flags["did_anniversary_"+YEAR()] = true;            // tonight WAS it — don't fire it again
  }
  saveGame();
  toast("The valley is yours. Wander, or sleep to carry on.", "#ffce5a");
}
function festivalLaunch(dur, fx){ _festLaunch = dur; _festFx = fx || "lanterns"; }

// ===================== STORY TURN-INS =====================
// attach cutscene/line turn-ins to the relevant quests (runtime; QUESTS already defined)
(function attachStoryTurnIns(){
  const byId = id => QUESTS.find(q => q.id === id);
  const sm = byId("star-metal");
  if(sm) sm.turnIn = { cutscene:[
    { type:"say", who:"Elder Rowan", portrait:"port_rowan",
      text:"...Star Metal. In my hands again, after all these years. Give an old man a moment, child — old men and old metal, we take our time." },
    { type:"run", fn:()=>{ take("Star Metal"); state.flags.starMetalDelivered = true; } },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan",
      text:"Your grandfather left something with me — made me swear to hand it over only when the crafts woke again. Stubborn to his last breath. Here. It's yours to read." },
    { type:"letter", head:"✒ A letter, kept all these years by Elder Rowan", text: LETTER_ROWAN },
  ] };
  const prove = byId("prove-crafts");
  if(prove) prove.turnIn = { line:"The Farming wing. The Woodcutting. The Mining. Look at them burn. You did in a season what I could not in thirty years." };
  const deep = byId("into-deep");
  if(deep) deep.turnIn = { line:"Floor five and back, lungs intact. Good. The vault runs deeper still — but you're ready for it now." };
  const coast = byId("the-coast");
  if(coast) coast.turnIn = { line:"...You'll do. The Fishing wing's yours to light. Don't let it go to your head like it did mine." };

  // ---------- ACT TWO ----------
  const home = byId("long-way-home");
  if(home) home.turnIn = { cutscene:[
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Sit. I watched you at the lanterns. You looked at the long table and you counted the chairs, didn't you. So did I. So did I." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Bram has told you. I know because Bram has been unable to look at me for a week, and Bram can out-stare a lighthouse." },
    { type:"say", who:"You", portrait:"port_player", text:"Marrow Point. Forty miles north." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Eleven years. And in eleven years not one of us walked up that road. We told ourselves we were respecting his wishes. We were sparing ourselves an awkward morning." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"I will not send you. I have no right. I am asking. Bring Elias Alderman home, and let his daughter decide what she wants to say to him." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Start with Bram. He owes that man a lantern, and he has owed it a very long time." },
    { type:"run", fn:()=>{ state.flags.act2Begun = true; } },
  ] };

  const drift = byId("driftwood");
  if(drift) drift.turnIn = { cutscene:[
    { type:"say", who:"Bram", portrait:"port_bram", text:"Twelve of wood and three of pine. …You remembered the pine. Nobody remembers the pine." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"The pine's for the little boats. The wax paper takes the flame and the pine takes the water, and between the two of them a candle crosses a bay." },
    { type:"run", fn:()=>{ take("Wood",12); take("Pine Wood",3); } },
    { type:"wait", t:0.8 },
    { type:"say", who:"Bram", portrait:"port_bram", text:"…" },
    { type:"say", who:"Bram", portrait:"port_bram", text:"My hands still know it. Eleven years and they still know it. Look at that." },
    { type:"sfx", name:"level" },
    { type:"run", fn:()=>{ state.flags.lanternsFolded = true; pSparkle(state.px, state.py-12, "#ffd75a", 16); } },
    { type:"banner", big:"🏮 Bram folds the water lanterns", small:"One of them, he sets aside", t:2.8 },
    { type:"say", who:"Bram", portrait:"port_bram", text:"This one's spare. Don't ask who it's for. …You know exactly who it's for." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"Go and tell Maya. All of it. She's owed the truth by everyone in this valley, and I'll not have her hear it from a coward twice." },
  ] };

  const road = byId("coast-road");
  if(road) road.turnIn = { cutscene: buildHomecomingSteps() };
})();

// ===================== THE HOMECOMING =====================
// The stone stands on the Festival Green, two tiles above the old sign, so you walk up and read it.
// It is FORCE-placed: raiseMemorial runs exactly once, and if anything (a winter frostberry, a crop)
// happened to be squatting on that tile, a check-before-place would set act2Done with no stone —
// leaving `memorialRead`, and therefore the last journal page, permanently unreachable.
function raiseMemorial(){
  const F = state.farm;                       // the farm persists, so the stone stays raised
  const clear = (x,y) => { const k = key(x,y); delete F.objects[k]; delete F.crops[k]; };
  clear(27,26);
  F.objects[key(27,26)] = { kind:"memorial" };
  for(const [x,y] of [[25,26],[29,26],[25,28],[29,28]]){
    const k = key(x,y);
    if(!F.objects[k] && !F.crops[k]) F.objects[k] = { kind:"lantern" };
  }
  state.flags.act2Done = true;
}

// Tiles the world reserves for story and funded work. Nothing may be scattered onto them, or the
// thing that belongs there later gets silently skipped.
const RESERVED_FARM_TILES = new Set([
  key(27,26), key(25,26), key(29,26), key(25,28), key(29,28),      // the memorial + its lanterns (Festival Green, v3.2 coords)
  key(14,7),                                                       // the farm's cart end (v3: the rest moved to the village)
]);
function isReservedFarmTile(x,y){ return RESERVED_FARM_TILES.has(key(x,y)); }

function buildHomecomingSteps(){
  return [
    { type:"say", who:"Maya", portrait:"port_maya", text:"You've been strange all week. You and Bram and Rowan, all three of you, going quiet whenever I walk in." },
    { type:"say", who:"You", portrait:"port_player", text:"Maya. Your father isn't at the city ports." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"…" },
    { type:"say", who:"Maya", portrait:"port_maya", text:"I know." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"The postmark's right and the paper's wrong. It's ferry paper. It's been ferry paper for eleven years. I stopped checking because I couldn't decide which would be worse — that he couldn't come home, or that he wouldn't." },
    { type:"say", who:"You", portrait:"port_player", text:"Come to the coast with me." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"…" },
    { type:"say", who:"Maya", portrait:"port_maya", text:"All right." },

    { type:"fade", on:true, then:()=>{
        state.flags.reunionScene = true;
        state.time = 17.6*60;
        clearMapCache();
        setMap("beach", 23*TILE+8, 13*TILE, "up");
      } },
    { type:"fade", on:false },
    { type:"wait", t:0.9 },
    { type:"banner", big:"The Coast Road", small:"Willowbrook · the north path", t:2.4 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"Bram. What have you done." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"Kept a promise to the wrong person for eleven years. …I've written to him. He wrote back the same day. Same day, Maya." },

    { type:"move", actor:"elias", x:23, y:7, face:"down", sp:26 },
    { type:"wait", t:0.8 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"…" },
    { type:"say", who:"Elias", portrait:"port_elias", text:"You've your grandmother's stance. Feet planted. Ready to be furious at a man." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"Be furious. I've had forty miles to practise standing still for it." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"Eleven years." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"Eleven years." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"You didn't come to her funeral. You didn't come to MINE — I had one, you know. A small one. Everyone stood in the rain and looked at me like I was the last Alderman left." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"I stood on the ridge. I could see the umbrellas. I told myself I'd walk down when I could do it without shaking, and then it was dark, and then it was a year." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"There isn't a good reason, Maya. I've looked for one every day of eleven years and there simply isn't one down there." },
    { type:"wait", t:1.0 },
    { type:"move", actor:"maya", x:23, y:9, face:"up", sp:22 },
    { type:"wait", t:0.6 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"…Then don't give me one." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"Just don't go back up that road." },
    { type:"sfx", name:"heart" },
    { type:"run", fn:()=>{ pSparkle(23*TILE+8, 8*TILE, "#ff9ab0", 24); playSfx("level"); } },
    { type:"wait", t:1.4 },
    { type:"say", who:"Bram", portrait:"port_bram", text:"…I've a lantern spare. Been carrying it about like a fool. It wants a name on it." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"Two names, Bram. Put my mother's first. She'd have hated the fuss." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"And Aldous beside her. He wrote to me, once. I never opened it. I think I always knew what it said, and I wasn't ready to be forgiven." },

    { type:"fade", on:true, then:()=>{
        state.flags.reunionScene = false;
        raiseMemorial();
        state.time = 19.4*60;
        clearMapCache();
        // tile-centre y, or the feet bbox reaches up into the stone's tile and unstick shoves you aside
        setMap("farm", 27*TILE+8, 27*TILE+8, "up");   // standing before the stone
      } },
    { type:"fade", on:false },
    { type:"wait", t:1.0 },
    { type:"banner", big:"The Festival Green", small:"Two names, and a lantern that stays lit", t:2.8 },
    { type:"sparkle", x:27, y:26, color:"#ffd75a", n:22 },
    { type:"wait", t:0.8 },
    { type:"letter", head:"✒ Carved into the standing stone", text: LETTER_MEMORIAL },
    { type:"run", fn:()=>{ festivalWarmth(40); ensureRel("elias").points = 200; } },
    { type:"banner", big:"♥ The Valley Remembers", small:"Read the stone any time — it keeps his letter", t:3.4 },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Nine wings and a stone. …He'd have grumbled about the expense and visited it every single morning. Go home, child. Sleep. You've done a hard, kind thing." },
    { type:"run", fn:()=>{ saveGame(); } },
  ];
}
function festivalTick(dt){
  if(_festFx === "stars"){
    // shooting stars streaking over the winter water
    if(chance(dt*1.4)){
      const sx = cam.x + rand(10, VIEW_W-10), sy = cam.y + rand(6, 46);
      const vx = rand(-90,-40), vy = rand(24, 44);
      for(let i=0;i<9;i++) addP({ x:sx - vx*i*0.006, y:sy - vy*i*0.006, vx:vx*0.35, vy:vy*0.35,
        grav:0, life:i*0.02, max:rand(.5,.9), size:1, color: i<2?"#ffffff":"#cfe6ff", type:"star" });
      if(chance(0.35)) playSfx("blipTalk");
    }
    if(chance(dt*3)) addP({ x:cam.x+rand(4,VIEW_W-4), y:cam.y+rand(4,40), vx:0, vy:0,
      grav:0, life:0, max:rand(.4,1.0), size:1, color:"#e8f0ff", type:"star" });
    return;
  }
  // drifting lanterns + occasional fireworks over the water
  if(chance(dt*7)) pLantern(cam.x + rand(20, VIEW_W-20), cam.y + VIEW_H - rand(10,40));
  if(chance(dt*1.1)){
    const fx = cam.x + rand(40, VIEW_W-40), fy = cam.y + rand(20, 70);
    const col = pick(["#ffce5a","#ff7d9c","#8fd3ff","#b6f27a","#ffffff"]);
    for(let i=0;i<14;i++){ const a=i/14*6.28; addP({ x:fx, y:fy, vx:Math.cos(a)*rand(20,42), vy:Math.sin(a)*rand(20,42),
      grav:26, life:0, max:rand(.6,1.1), size:1, color:col, type:"star" }); }
    playSfx("coin");
  }
}

// ===================== SEASONAL FESTIVALS =====================
// Recurring, year-keyed, and hosted on the existing beach grounds — never by mutating the farm.
const FEST_CAST = ["maya","tom","rowan","bram","pip"];

function maybeSeasonalFestival(){
  if(!curMap || curMap.id !== "beach") return;
  if(isCutscene() || sleeping) return;
  if(state.flags.seasonalActive || state.flags.festivalActive || state.flags.festivalPending) return;
  const f = festivalNow();
  if(f) startSeasonalFestival(f);
}

function startSeasonalFestival(f){
  if(state.flags.seasonalActive || state.flags.festivalActive || state.flags.festivalPending) return;
  if(isCutscene() || festivalDoneThisYear(f)) return;
  state.flags.seasonalActive = f.id;
  paused = true;
  clearMapCache();                                  // regenerate the coast, dressed for this festival
  playSfx("wake");
  fadeTo(true, () => {
    setMap("beach", 23*TILE+8, 12*TILE, "up");
    paused = true; fadeTo(false);
    setTimeout(() => startCutscene(buildSeasonalSteps(f), () => endSeasonalFestival(f)), 500);
  });
}

function endSeasonalFestival(f){
  state.flags["did_"+f.id+"_"+YEAR()] = true;
  state.flags.seasonalActive = null;
  _festFx = null; _festLaunch = 0;
  bump("festivals", 1);
  saveGame();
  toast("Stay as long as you like. The sand keeps the festival till dusk.", "#ffce5a");
}

// everyone who showed up warms to you a little
function festivalWarmth(n){
  for(const id of FEST_CAST) ensureRel(id).points += n;
  if(state.flags.act2Done) ensureRel("elias").points += n;
}

function buildSeasonalSteps(f){
  const open = [
    { type:"wait", t:0.6 },
    { type:"banner", big:"✦ "+f.name+" ✦", small:"Year "+YEAR()+" · Willowbrook gathers", t:2.4 },
    { type:"move", actor:"player", x:23, y:9, face:"up" },
  ];
  const close = [
    { type:"run", fn:()=>{ festivalWarmth(30); playSfx("quest"); } },
    { type:"sparkle", x:23, y:5, color:"#fff6d0", n:18 },
    { type:"banner", big:"♥ +30 with everyone who came", small:"Showing up is the whole craft", t:2.4 },
  ];
  return open.concat(FESTIVAL_SCENES[f.id]()).concat(close);
}

const FESTIVAL_SCENES = {
  // ---------- SPRING: the Egg Fair ----------
  eggfair: () => {
    const hens = state.animals.chickens.length;
    const steps = [
      { type:"say", who:"Pip", portrait:"port_pip", text:"YOU CAME! Okay okay okay — the rules. I hid eggs. In the sand. ALL of them. Even I don't know where they all are anymore." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"He hid forty. Forty, at first light. I have watched that child dig since dawn and I have never been more tired." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Gran ran this one. She'd hide one gold-painted egg and never tell anyone where. Some years nobody found it at all." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"I found it. Once. Nineteen years old and I have not stopped mentioning it since." },
    ];
    if(hens > 0) steps.push(
      { type:"say", who:"Pip", portrait:"port_pip", text:`Wait — you keep ${hens===1?"a hen":"HENS"}! Real ones! Do they know they're in a competition? Do they know they're LOSING?` });
    steps.push(
      { type:"say", who:"Bram", portrait:"port_bram", text:"…Found six. Wasn't looking. They were simply where I was standing." },
      { type:"sfx", name:"get" },
      { type:"run", fn:()=>{ give("Egg", 4, true); give("Large Egg", 1, true); pSparkle(state.px, state.py-12, "#fff6d0", 14); } },
      { type:"banner", big:"🥚 Four eggs and a big one", small:"Pip insists you had 'a very good technique'", t:2.4 },
      { type:"say", who:"Pip", portrait:"port_pip", text:"You're SO good at this. Next year I'm hiding them in the WATER. …Mum says no. Next year I'm hiding them in the water." });
    return steps;
  },

  // ---------- SUMMER: the Luau ----------
  luau: () => {
    // any fish you're carrying can go in the pot — that's the whole verb
    const fish = FISH.map(f=>f.name).find(n => (state.inv[n]||0) > 0);
    const steps = [
      { type:"say", who:"Bram", portrait:"port_bram", text:"Pot's on. Been on since four. It wants fish, and the valley's brought me driftwood, two turnips and a great deal of opinion." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"A turnip is a legitimate contribution to a soup, Bram." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"It is not." },
    ];
    if(fish){
      steps.push(
        { type:"say", who:"You", portrait:"port_player", text:`…Will a ${fish} do?` },
        { type:"say", who:"Bram", portrait:"port_bram", text:"…" },
        { type:"say", who:"Bram", portrait:"port_bram", text:"That'll do." },
        { type:"sfx", name:"level" },
        { type:"run", fn:()=>{ take(fish); state.energy = 100;
            const bonus = Math.round((ITEM_SELL[fish]||30) * 2.5);
            state.gold += bonus; floatText(state.px, state.py-24, "+"+bonus+"g", "#ffce5a");
            ensureRel("bram").points += 60; pSparkle(state.px, state.py-12, "#8fd3ff", 16); refreshHUD(); } },
        { type:"banner", big:"🍲 The pot is magnificent", small:"Bram will deny being pleased", t:2.6 },
        { type:"say", who:"Pip", portrait:"port_pip", text:"I had FOUR bowls. Bram says that's not a record. Bram is WRONG, I asked him what the record was and he said 'four'." },
        { type:"say", who:"Maya", portrait:"port_maya", text:"He's been stirring that pot for six hours and smiling at it for one. Look at him. Don't let him see you looking." },
        { type:"say", who:"Bram", portrait:"port_bram", text:"I can hear you." });
    } else {
      steps.push(
        { type:"say", who:"Bram", portrait:"port_bram", text:"…You came empty-handed. To a soup." },
        { type:"say", who:"Tom", portrait:"port_tom", text:"I'll put a loaf in. Nobody panic. Nobody tell the chowder." },
        { type:"run", fn:()=>{ state.energy = 100; give("Bread", 1, true); refreshHUD(); } },
        { type:"say", who:"Bram", portrait:"port_bram", text:"It's thin. It's a thin soup. …It's still a good evening." },
        { type:"say", who:"Maya", portrait:"port_maya", text:"Bring him a fish next year. Any fish. He'll pretend it doesn't matter and then talk about it until winter." },
        { type:"banner", big:"🍲 A thin, happy soup", small:"Bring Bram a fish next Summer 14", t:2.6 });
    }
    return steps;
  },

  // ---------- FALL: the Harvest Fair ----------
  harvest: () => {
    const best = state.stats.bestCropSold || 0, name = state.flags.bestCropName || "";
    const prize = best >= 800 ? 1500 : best >= 300 ? 800 : best >= 100 ? 400 : best > 0 ? 150 : 0;
    const steps = [
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"The Harvest Fair. Every grower in the valley lays their finest on this table and pretends not to mind the judging." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"And I am the judge, because I'm the only one who's weighed everything you've all sold me since Fall began. The books do not lie. The books ADORE me." },
    ];
    if(!best) steps.push(
      { type:"say", who:"Tom", portrait:"port_tom", text:"…You sold me nothing this season, farmer. Nothing! Not one crop! What have you been DOING?" },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Bring him something next year. He'll act like it's a chore and then put a ribbon on it." },
      { type:"banner", big:"🎗 No entry this year", small:"Sell your best Fall crop to Tom before Fall 22", t:2.8 });
    else steps.push(
      { type:"say", who:"Tom", portrait:"port_tom", text:`And the finest thing to cross my counter this Fall was — a ${name}. Yours. Of course it was yours.` },
      { type:"say", who:"Maya", portrait:"port_maya", text:"I sketched it before he weighed it. It really was lovely." },
      { type:"sfx", name:"level" },
      { type:"run", fn:()=>{ state.gold += prize; floatText(state.px, state.py-24, "+"+prize+"g", "#ffce5a");
          pSparkle(state.px, state.py-12, "#ffce5a", 16); refreshHUD(); } },
      { type:"banner", big: prize>=1500 ? "🏆 The Grand Ribbon" : prize>=800 ? "🎖 First Prize" : "🎗 A Fine Showing",
        small: name+" · +"+prize+"g", t:2.8 },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Your grandfather won this fair eleven times. He kept every ribbon in a drawer and told everyone he'd thrown them away." });
    steps.push(
      { type:"say", who:"Pip", portrait:"port_pip", text:"Can I eat the exhibits? …Can I eat the exhibits NOW?" });
    return steps;
  },

  // ---------- THE ANNIVERSARY: the Lantern Festival, kept ----------
  anniversary: () => {
    const y = YEAR();
    const yrs = y - 1;
    const steps = [
      { type:"run", fn:()=>{ festivalLaunch(24, "lanterns"); } },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan",
        text: yrs === 1
          ? "One year. One single year since we stood on this sand and I thought I was watching the last good night of my life."
          : `${yrs} years, now. I have stopped being surprised by it. That is the finest compliment I can pay a thing.` },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Free stall again. It's tradition now. I've stopped pretending it hurts me — I've been putting money aside for it since Spring, like a lunatic." },
      { type:"say", who:"Pip", portrait:"port_pip", text:"I've seen a REAL one now. Loads of them! I tell the new kids about it and they don't believe the bit about the fish-juggling and honestly, fair." },
    ];

    if(state.flags.act2Done) steps.push(
      { type:"say", who:"Elias", portrait:"port_elias", text:"I stood on that ridge for eleven years and never once came down to this." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"…It's better from down here. It's much better from down here." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Don't cry, Papa. If you cry I'll cry, and Bram will have to look at the sea and pretend to check the weather." });

    const sp = spouseId();
    if(sp === "maya") steps.push(
      { type:"move", actor:"maya", x:22, y:9, face:"right", sp:34 },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Every year I think I'll be used to it. Every year the first lantern goes up and I'm eight years old again, holding Gran's hand." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Only now I'm holding yours. …Don't say anything clever. Just stand here with me. ♥" });
    else if(sp === "bram") steps.push(
      { type:"move", actor:"bram", x:22, y:9, face:"right", sp:34 },
      { type:"say", who:"Bram", portrait:"port_bram", text:"Folded eighty of them this year. Eighty. My hands ache and I'd do a hundred." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"…Come here. No, closer. I've a whole speech and I'm not going to say any of it, so you'll have to make do with the standing. ♥" });
    else steps.push(
      { type:"say", who:"Maya", portrait:"port_maya", text:"Look at them all. Look at what you started, just by turning up and refusing to leave." });

    // v4.17: once the tenth wing is lit, the anniversary gains a THIRD last lantern — for Orla, the warden
    // lost in the deep. The ceremony that already lights the lost each year now keeps her too, so the finale
    // has a recurring beat and Orla's name is spoken aloud every festival. Elias lights it, if he's come down.
    const tenth = !!state.flags.tenthWingLit;
    steps.push(
      { type:"wait", t:1.0 },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:(tenth?"Three":"Two")+" lanterns go out last. They always will, as long as I'm the one lighting them." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"One for Rosa Alderman, who fed this valley. And one for a stubborn old fool who couldn't light them without her — and who left us a grandchild who could." });
    if(tenth) steps.push(
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"And one more, now — the newest and the oldest. Elias. Will you?" },
      { type:"say", who:"Elias", portrait:"port_elias", text:"…For Orla. Warden before me, who went down into the dark so the rest of us could keep the light, and stayed there thirty years while I hadn't the courage to bring her up." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"You're counted now, old teacher. Tenth lantern, tenth wing, tenth craft — and a pair of hands to keep it that never lets the dark have anyone again. Rest. The round is walked." });
    steps.push(
      { type:"sfx", name:"level" },
      { type:"sparkle", x:23, y:4, color:"#fff6d0", n:26 },
      { type:"wait", t:1.6 },
      { type:"banner", big:"🏮 Year "+y+" · The Lanterns Rise 🏮", small:"Light them every year. Especially the year you don't feel like it.", t:3.4 },
      { type:"run", fn:()=>{ state.gold += 500; refreshHUD(); } },
    );
    return steps;
  },

  // ---------- WINTER: the Star-Watch ----------
  starwatch: () => [
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"The coldest night of the year, and the clearest. That is not a coincidence — that is a bargain. Sit down, child. Look up." },
    { type:"run", fn:()=>{ festivalLaunch(30, "stars"); } },
    { type:"wait", t:1.6 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"There. Did you see it? …There's another." },
    { type:"say", who:"Pip", portrait:"port_pip", text:"I wished for a dog. I'm ALLOWED to say it, that rule is for birthdays, everyone KNOWS that." },
    { type:"say", who:"Tom", portrait:"port_tom", text:"I wished for nothing at all. Everything I'd have asked for is standing on this beach, eating my inventory." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"…" },
    { type:"say", who:"Bram", portrait:"port_bram", text:"I never wished. Twenty years, I never once wished. Seemed like tempting the sea." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"…I wished tonight." },
    { type:"wait", t:1.0 },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Rosa used to say the stars are just the valley's lanterns, gone up so far they forgot to come down." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"She said it every single year. It was never once less true." },
    { type:"sfx", name:"heart" },
    { type:"wait", t:1.2 },
    { type:"run", fn:()=>{ state.energy = 100; give("Diamond", 1, true); } },
    { type:"banner", big:"✦ A star fell close tonight", small:"Pip swears he saw where it landed", t:2.8 },
  ],
};

// ===================== HEART EVENTS =====================
// Short scripted scenes, triggered when you talk to an NPC at a new heart tier.
const HEART_EVENTS = {
  maya: [
    { hearts:2, flag:"he_maya_2", steps:[
      { type:"say", who:"Maya", portrait:"port_maya", text:"Oh — hey. Can I show you something? I don't usually show people this." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"My sketchbook. The valley the way it was — the festival, the lanterns doubled on the black water, the long table. I was small, but I remember the light." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Grandma Rosa baked for the whole valley that night. Then she was gone… and it just never happened again. I keep drawing it anyway. Silly, right?" },
      { type:"say", who:"You", portrait:"port_player", text:"…Not silly at all. — Who's this, at the end of the table? The one that's… scribbled out?" },
      { type:"say", who:"Maya", portrait:"port_maya", text:"…Nobody. The pencil slipped." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"…Thank you. For listening. Most people change the subject." },
    ]},
    { hearts:4, flag:"he_maya_4", steps:[
      { type:"say", who:"Maya", portrait:"port_maya", text:"You're always working. Come here — just for a minute. Watch the water with me." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Papa fished the Golden Koi right here at dusk. He said the valley talks to you, if you're quiet enough to hear it." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"For years it only said sad things. Lately… it's been saying your name. …Forget I said that." },
      { type:"run", fn:()=>{ give("Field Salad",1,true); } },
      { type:"say", who:"Maya", portrait:"port_maya", text:"Here — I packed you lunch. Now go, before I say something I can't take back." },
    ]},
    { hearts:6, flag:"he_maya_6", steps:[
      { type:"say", who:"Maya", portrait:"port_maya", text:"Can I be honest? When you first turned up, I told myself not to hope. This valley taught me that lesson well." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"But you woke it up. The fields, the Guild, the folk drifting home… and me. You woke me up too." },
      { type:"say", who:"Maya", portrait:"port_maya", text:"I won't say the rest yet. But I wanted you to know it's there, waiting. …Okay. That's — that's quite enough of that." },
      { type:"run", fn:()=>{ state.flags.mayaConfided = true; state.flags.confided_maya = true; } },
      { type:"banner", big:"♥ Maya, 6 hearts", small:"There's a bouquet at Tom's, if you're ready.", t:2.6 },
    ]},
  ],
  tom: [
    { hearts:3, flag:"he_tom_3", steps:[
      { type:"say", who:"Tom", portrait:"port_tom", text:"Between us? I overstock on purpose. A full shop looks like a busy town. Busy towns don't close." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"When the Guild shut and folks left for the coast cities, I kept the lights on out of pure stubbornness. Sold to nobody for years." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Then you turn up hauling crops and ore like it's nothing. First real customer I've had in a decade. …Don't make it weird. Here." },
      { type:"run", fn:()=>{ give("Berry Bun",2,true); } },
    ]},
    { hearts:5, flag:"he_tom_5", steps:[
      { type:"say", who:"Tom", portrait:"port_tom", text:"See this ledger? Don't read it. …Fine. Read it." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Every name in this valley's in there, and every one's got a line through it. Bram, that winter the boats couldn't go out. Rowan's coal, four years running. Half the folk who left still owe me and I struck them out too." },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Your grandfather's on page one. Biggest debt in the book. He came in the spring after Rosa died and bought seed he never planted, just so I'd have a sale that week." },
      { type:"say", who:"You", portrait:"port_player", text:"…Tom. How much did he owe you?" },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Nothing. Never did. Take it — his credit, and it's yours now. Don't argue with a shopkeeper about his own books." },
      { type:"run", fn:()=>{ state.gold += 400; floatText(state.px, state.py-24, "+400g", "#ffce5a"); playSfx("coin"); refreshHUD(); } },
      { type:"say", who:"Tom", portrait:"port_tom", text:"Now get out of my shop before I get sentimental in front of the turnips." },
    ]},
  ],
  rowan: [
    { hearts:4, flag:"he_rowan_4", steps:[
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"You remind me of him, you know. Your grandfather. The same stubborn kindness." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"We didn't speak the last ten years of his life. I called him a coward for letting the festival die. He called me a fossil for clinging to it. We were both right." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Grief made a fool of a good man; pride made one of me. Don't wait as long as we did to say the thing, child. Whoever it is you're not saying it to." },
    ]},
    { hearts:6, flag:"he_rowan_6", steps:[
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Sit. There's a thing in this desk I've moved from drawer to drawer for eleven years, and I am too old to keep carrying it." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"I wrote it the winter he stopped answering his door. I never sent it. Every year I told myself I'd walk it up the hill in the spring." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"He's past reading it. You're not. Go on." },
      { type:"letter", head:"✒ A letter Rowan never sent", text: LETTER_ROWAN_UNSENT },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"…Well. That's that." },
      { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Keep it. It was always going to end up in his family's hands. It simply took the long way round." },
      { type:"sfx", name:"heart" },
    ]},
  ],
  bram: [
    { hearts:3, flag:"he_bram_3", steps:[
      { type:"say", who:"Bram", portrait:"port_bram", text:"…Still here. Most folk get bored of a quiet man and wander off. Sit, if you like. The fish don't mind company." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"My family made the water lanterns. Every year. Waxed paper, a little wood boat, a candle. The whole coast would glow. …My hands still remember the folds." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"If the festival ever comes back… I'll make them again. Don't go telling folk I said I'd enjoy it." },
    ]},
    { hearts:5, flag:"he_bram_5", steps:[
      { type:"say", who:"Bram", portrait:"port_bram", text:"You've heard Maya speak of her father. Elias. Off at the city ports, she says. Writes when he remembers." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"He isn't at the ports. Hasn't been, not once in eleven years. He's at Marrow Point — forty miles up the coast — working a ferry for a man half his age." },
      { type:"say", who:"You", portrait:"port_player", text:"…You've seen him." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"Twice. He posts his letters from the port town so the mark's right. He asked me not to tell her. I gave my word, and I have kept it, and it has sat on my chest like a stone every day since." },
      { type:"say", who:"You", portrait:"port_player", text:"Why would he stay away?" },
      { type:"say", who:"Bram", portrait:"port_bram", text:"He left the week they buried his mother. Couldn't say why, not even to himself. And every year he didn't come back made coming back harder." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"That's all shame is, in the end. Arithmetic." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"…I've told you now. I'm tired of keeping it. Do what you're going to do." },
      { type:"run", fn:()=>{ state.flags.knowsElias = true; } },
    ]},
    { hearts:6, flag:"he_bram_6", steps:[
      { type:"say", who:"Bram", portrait:"port_bram", text:"Tide's out. Sit a while. …No, don't fish. Just sit." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"I've had a great deal of quiet in my life. Chose most of it. It stopped being a choice somewhere along the way and just became the shape of me." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"Then you started turning up. Saying nothing. Sitting badly on cold rocks. And the quiet went from a thing I kept to a thing I share." },
      { type:"say", who:"Bram", portrait:"port_bram", text:"I'm no good at the next part. I've watched folk in this valley say what they mean far too late — Rowan, your grandfather, me. So: I'd like you to know where I stand. That's all." },
      { type:"run", fn:()=>{ state.flags.confided_bram = true; } },
      { type:"banner", big:"♥ Bram, 6 hearts", small:"There's a bouquet at Tom's, if you're ready.", t:2.6 },
      { type:"say", who:"Bram", portrait:"port_bram", text:"…That's the most I've said in a year. Go on. Catch something." },
    ]},
  ],
  pip: [
    { hearts:2, flag:"he_pip_2", steps:[
      { type:"say", who:"Pip", portrait:"port_pip", text:"You're my BEST friend now, okay? I decided. You don't get a vote." },
      { type:"say", who:"Pip", portrait:"port_pip", text:"Best friends share treasure. So — here. My SHINIEST one. I found it myself! Rowan says it's an amethyst but I call him 'Gary.'" },
      { type:"run", fn:()=>{ give("Amethyst",1); } },
      { type:"say", who:"Pip", portrait:"port_pip", text:"Take good care of Gary. If you ever sell him… I'll KNOW." },
    ]},
    { hearts:4, flag:"he_pip_4", steps:[
      { type:"say", who:"Pip", portrait:"port_pip", text:"Can I tell you a secret? I've never actually SEEN a festival. Not once. I just know all about them." },
      { type:"say", who:"Pip", portrait:"port_pip", text:"Mum describes it every single year. The lanterns. The long table. A man who juggled fish — FISH! And I nod like I remember, 'cause it makes her happy." },
      { type:"say", who:"Pip", portrait:"port_pip", text:"…Do you think I'll get to see one? A real one? With the lanterns and everything?" },
      { type:"say", who:"You", portrait:"port_player", text:"I'm working on it." },
      { type:"say", who:"Pip", portrait:"port_pip", text:"THAT'S WHAT I TOLD MUM YOU'D SAY. Here, take a shell. It's for luck. It's very lucky. Probably." },
      { type:"run", fn:()=>{ give("Shell",1); } },
    ]},
  ],
  // v4.6 Elias, the last Warden — the man behind the Ledger. His HEART arc is the DOMESTIC story (the
  // koi, Aldous's unopened letter, the eleven years, peace with Maya) that runs parallel to the Ledger's
  // WARDEN story, and is order-safe with it: it never depends on which Act III chapter you've reached, and
  // it introduces Orla (the warden before him, lost in the deep) gently, working whether or not the Ledger
  // has already named her. He's reachable at the pond by day / the coast on his fourth days (act2Done).
  elias: [
    { hearts:2, flag:"he_elias_2", steps:[
      { type:"say", who:"Elias", portrait:"port_elias", text:"Sit a moment, if you've one to spare. No — don't cast. Just watch the water. …There. See how the koi come up once it goes still? They won't rise for a man in a hurry. Never have." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"Maya was five when I taught her that. Sit still enough and the valley shows you things. Then I spent eleven years too far off and too busy to take my own advice." },
      { type:"say", who:"You", portrait:"port_player", text:"You're taking it now." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"I'm taking it now. …It helps, having someone to be still beside. That's a smaller thing to give than you'd think, and a far harder one to find. Thank you for it." },
    ]},
    { hearts:4, flag:"he_elias_4", steps:[
      { type:"say", who:"Elias", portrait:"port_elias", text:"I told you once your grandfather wrote to me. Eleven years ago. I never opened it — carried it every mile since, unread, like a stone I hadn't the right to set down." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"…I opened it last night. I think because you would have. You open every shut door in this valley, sooner or later. Here. Read it. Aldous wouldn't mind — he never minded much, your grandfather." },
      { type:"letter", head:"✒ Aldous's letter to Elias — eleven years late", text:"“Elias — I know why you went, and I'll not say one word against it. Grief walks a man where it walks him, and there's no arguing with its feet.\n\nBut the chair by the pond is still yours. The koi still rise of an evening. And one day my grandchild will have this farm and not a soul left to show them the valley's quiet ways.\n\nCome home when you can bear to. There's no clock on it — only a chair, and a friend keeping it warm. — A.”" },
      { type:"say", who:"Elias", portrait:"port_elias", text:"He kept the chair. All that time. …And you're the grandchild he meant — he was setting a place for you before you were old enough to know the word for it. Go on, now. I need a moment with the water." },
    ]},
    { hearts:5, flag:"he_elias_5", req:()=>!!state.flags.tenthDoorOpen, steps:[
      { type:"say", who:"Elias", portrait:"port_elias", text:"May I say a thing aloud that I've not managed to say to Maya yet? It comes easier, rehearsing it on you first. If you'll allow an old man his rehearsal." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"I left when she needed me, and I stayed gone eleven years, and no ferry-work forty miles north was ever worth one supper I missed. She forgave me before I'd earned a scrap of it. Children do that. It's the cruelest kind thing they do." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"You gave me a way back that wasn't just walking through the door with my hat in my hands. A wing to tend. A reason to be of use. A table with my daughter at it. That's not a small thing you handed me. That's the whole of a life, given back." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"…Right. That's the rehearsal done. Now I've only to say it to her. Wish me the courage — you've plenty to spare, and I find I'm short." },
    ]},
    { hearts:6, flag:"he_elias_6", req:()=>!!state.flags.tenthDoorOpen, steps:[
      { type:"say", who:"Elias", portrait:"port_elias", text:"I said it to Maya. All of it. She cried, and then she laughed at me for needing eleven years and a stranger's example to manage four sentences. She gets that tongue from her mother." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"There was a warden before me — Orla. She taught me the rounds. If you walk the wing deep enough you'll find her name kept in the stone; perhaps you already have. I'd rather you heard it from me than only from the dark: she was the best of us, the dark took her, and it was never her failing that it did." },
      { type:"say", who:"Elias", portrait:"port_elias", text:"You've done what she'd have wanted and I never could — kept the wing lit AND come up for supper every single night you went down. Here. For the koi you'll never quite catch. A warden ought to own one beautiful, useless thing." },
      { type:"run", fn:()=>{ give("Pearl", 1, true); } },
      { type:"say", who:"Elias", portrait:"port_elias", text:"Now go home, warden. There's a valley out there with every one of its chairs filled at last — and one of them, these eleven years, was always being kept for you." },
    ]},
  ],
  // v4.13 (owner update 2) Nell, the Butterbrook dairy — her friendship was a dead end (no events, no
  // payoff). This arc gives her a voice and a real reward: her SECRET recipe, the Butterbrook Reserve,
  // taught at 6♥ (sets state.flags.nellRecipe — the one way to learn it). Dry, warm, unhurried — her voice.
  nell: [
    { hearts:2, flag:"he_nell_2", steps:[
      { type:"say", who:"Nell", portrait:"port_nell", text:"You keep turning up down here. Most folk make the walk once, see it's just cows and cheese and a great deal of quiet, and never come back. …I find I'm glad you're not most folk." },
      { type:"say", who:"Nell", portrait:"port_nell", text:"Tom and I have run it the same twenty years — him up the valley behind his counter, me down here behind mine. Folk call it a great romance. It's mostly a supply line. …Though he does tuck a note in the churn with the morning milk, some days. Twenty years. The man cannot help himself." },
      { type:"run", fn:()=>{ give("Cheese", 2, true); } },
      { type:"say", who:"Nell", portrait:"port_nell", text:"Here — off the shelf, on the house. A friend of the dairy eats well. Go on, before I change my mind and charge you." },
    ]},
    { hearts:4, flag:"he_nell_4", steps:[
      { type:"say", who:"Nell", portrait:"port_nell", text:"Can I tell you the thing about cheese nobody's got the patience to hear? It isn't the milk, and it isn't the cool room. It's the WAITING. A good wheel wants a month you can't hurry, in a dark you can't cheat. Every year I swear I'll sell the young stuff quicker. Every year I let it sit." },
      { type:"say", who:"Nell", portrait:"port_nell", text:"…I think that's why I came down to the coast, truth be told. Everything up the valley moved so fast after the Guild went dark — folk leaving, or grieving, or both at once. Down here a thing takes exactly as long as it takes. I found I could breathe again." },
      { type:"say", who:"Nell", portrait:"port_nell", text:"You've a bit of that in you, I think. You wake things slowly and let them keep. …Ah, listen to me go on. Take some fleece for the road — the sheep shan't miss it." },
      { type:"run", fn:()=>{ give("Wool", 2, true); } },
    ]},
    { hearts:6, flag:"he_nell_6", steps:[
      { type:"say", who:"Nell", portrait:"port_nell", text:"Right. Come round the back of the churn a moment. I'm going to show you a thing I've shown exactly two souls in twenty years — and one of them was Tom, and he only wanted to know if it'd sell." },
      { type:"say", who:"Nell", portrait:"port_nell", text:"The Butterbrook Reserve. My own. You take the finest cheese you've got, and the richest pail — a well-loved cow's, none of your thin stuff — and then you go out to the salt meadow and pick the sea asters. The lilac ones. They grow nowhere else in the valley, and they make the whole wheel taste the way the coast smells of an evening." },
      { type:"run", fn:()=>{ state.flags.nellRecipe = true; playSfx("upgrade"); pSparkle(state.px, state.py-12, "#f0e0a8", 16); } },
      { type:"say", who:"Nell", portrait:"port_nell", text:"There. It's yours. Cook it at any stove — you'll find it written in your book now. …And don't go handing the recipe round. Sell the CHEESE, gladly, at a dear price. But the how of it stays between friends. Which is what we are, you and I. Took you long enough to walk down here and earn it." },
      { type:"banner", big:"♥ Nell, 6 hearts", small:"She taught you the Butterbrook Reserve — her secret dish. Gather Sea Asters on the meadow to make it.", t:3.4 },
    ]},
  ],
};
function heartEventFor(id){
  const evs = HEART_EVENTS[id]; if(!evs) return null;
  const h = heartsOf(id);
  // an event may carry a `req` predicate — a story precondition beyond the heart tier (v4.6: Elias's
  // wing-referencing beats wait for the tenth door to be open, even if you gifted him to 5–6 hearts first).
  for(const ev of evs){ if(h >= ev.hearts && !state.flags[ev.flag]){ if(ev.req && !ev.req()) continue; return ev; } }
  return null;
}

// ===================== MARRIAGE =====================
// Courtship is data-driven: any NPCDEF entry with romance:true and a confided_<id> flag
// can be proposed to with the Willowbrook Bouquet. One marriage per save.
function spouseId(){ return state.flags.spouse || (state.flags.married ? "maya" : null); }
function spouseName(){ const s = spouseId(); return s && NPCDEF[s] ? NPCDEF[s].name : "Your spouse"; }
function anyConfided(){ return Object.keys(NPCDEF).some(id => NPCDEF[id].romance && state.flags["confided_"+id]); }
function wed(id){
  state.flags.married = true; state.flags.spouse = id;
  ensureRel(id).points = Math.max(state.rel[id].points, 600);
  pSparkle(state.px, state.py-10, "#ff9ab0", 20);
}

const MARRIAGE_SCENES = {
  maya: () => [
    { type:"say", who:"You",  portrait:"port_player", text:"Maya. I brought you something." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"…That's a Willowbrook bouquet. You know what it means here. You know exactly what it means." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"I spent so long not letting myself want things — this valley taught me not to. Then you walked in and made the whole of it worth wanting again." },
    { type:"say", who:"Maya", portrait:"port_maya", text:"So — yes. Whatever the question is, and I'm quite sure I know it: yes. A thousand times over. ♥" },
    { type:"sfx", name:"level" },
    { type:"run", fn:()=>wed("maya") },
    { type:"banner", big:"♥ You and Maya are wed ♥", small:"Willowbrook has a wedding to celebrate", t:3.4 },
    { type:"say", who:"Maya", portrait:"port_maya", text:"I'm moving my sketchbooks into the cottage tonight. …Try not to look so pleased with yourself. It's insufferable. ♥" },
  ],
  bram: () => [
    { type:"say", who:"You",  portrait:"port_player", text:"Bram. This is for you." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"…" },
    { type:"say", who:"Bram", portrait:"port_bram", text:"That's a Willowbrook bouquet. In my hands. On my rocks." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"I have rehearsed a great many quiet, dignified answers to this, over a great many mornings, and every one of them has just gone straight out to sea." },
    { type:"say", who:"Bram", portrait:"port_bram", text:"Yes. Plainly. Yes, and gladly, and for the rest of it. ♥" },
    { type:"sfx", name:"level" },
    { type:"run", fn:()=>wed("bram") },
    { type:"banner", big:"♥ You and Bram are wed ♥", small:"Willowbrook has a wedding to celebrate", t:3.4 },
    { type:"say", who:"Bram", portrait:"port_bram", text:"I'll bring the boat round to your side of the valley. …And I'll talk more. A bit more. Don't hold me to a number. ♥" },
  ],
};

function startMarriage(id){
  if(state.flags.married || !(state.inv["Bouquet"]||0)) return;
  if(!NPCDEF[id] || !NPCDEF[id].romance || !state.flags["confided_"+id]) return;
  const mk = MARRIAGE_SCENES[id]; if(!mk) return;   // validate everything BEFORE consuming the bouquet
  take("Bouquet");
  startCutscene(mk(), ()=>{ saveGame(); });
}
