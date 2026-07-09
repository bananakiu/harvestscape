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

// ===================== CUTSCENE ENGINE =====================
let cutscene = null;
let _festLaunch = 0;
function isCutscene(){ return !!cutscene; }
function cutActor(id){
  if(id === "player") return {
    get x(){ return state.px; }, set x(v){ state.px=v; },
    get y(){ return state.py; }, set y(v){ state.py=v; },
    get face(){ return state.face; }, set face(v){ state.face=v; }, isPlayer:true };
  return (curMap.npcs && curMap.npcs.find(n=>n.id===id)) || null;
}
function startCutscene(steps, onEnd){
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
    case "fade":  fadeTo(s.on, ()=>{ if(s.on && s.then) s.then(); cutNext(); }); cutscene.waiting="fadecb"; break;
    case "run":   if(s.fn) s.fn(); cutNext(); break;
    case "letter":openLetter(s.head, s.text, ()=>cutNext()); cutscene.waiting="letter"; break;
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
    if(d < 1.6){ a.x=m.tx; a.y=m.ty; if(m.face) a.face=m.face;
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

const LETTER_FESTIVAL =
"My dear grandchild,\n\n" +
"I'm not there tonight — but I know exactly how it looks, because I saw it a hundred times before I let it go dark. The lanterns doubling on the black water. The Aldermans laughing. Tom giving away more than he sells. Some child eating far too much.\n\n" +
"You did the one thing I never could: you let the valley gather again. That was always the ninth craft. Not farming, not fishing — the making of a place people want to stay.\n\n" +
"Look up when the lanterns rise. That one's mine. Rosa's is the one beside it.\n\n" +
"Welcome home, kiddo. You always were.\n\n— Grandpa";

// ===================== THE FESTIVAL =====================
function startFestival(){
  if(state.flags.festivalDone) return;
  state.flags.festivalActive = true;
  state.time = 19.6 * 60;                 // deep dusk, so the lanterns glow
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
  const mayaLine = hh >= 5
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
  _festLaunch = 0;
  saveGame();
  toast("The valley is yours. Wander, or sleep to carry on.", "#ffce5a");
}
function festivalLaunch(dur){ _festLaunch = dur; }

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
})();
function festivalTick(dt){
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
