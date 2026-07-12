"use strict";
/* ============================================================
   11-title.js — animated painted title scene, menu, and the
   intro letter cutscene.
   ============================================================ */

let titleMX = 0.5, titleMY = 0.5;

// ---- painted title background (drawn on the game canvas) ----
function drawTitleScene(){
  const g = ctx, t = animT;
  const par = (titleMX - 0.5);
  // sky
  const sky = g.createLinearGradient(0,0,0,150);
  sky.addColorStop(0, "#232a5e");
  sky.addColorStop(0.35, "#6a4a86");
  sky.addColorStop(0.6, "#d76a6a");
  sky.addColorStop(0.78, "#ff9a5a");
  sky.addColorStop(1, "#ffd98a");
  g.fillStyle = sky; g.fillRect(0,0,VIEW_W,120);

  // stars (top)
  g.fillStyle = "#ffffff";
  seedRR(99);
  for(let i=0;i<30;i++){ const x=rr()*320, y=rr()*60; const a=0.3+0.5*Math.sin(t*2+i);
    g.globalAlpha = clamp(a,0,1)*inv(60-y,0,60); g.fillRect(x|0,y|0,1,1); }
  g.globalAlpha = 1;

  // sun glow + disc
  const sunx = 232 - par*8, suny = 78 + Math.sin(t*0.3)*2;
  const sg = g.createRadialGradient(sunx,suny,0,sunx,suny,70);
  sg.addColorStop(0,"rgba(255,230,160,0.9)"); sg.addColorStop(0.3,"rgba(255,180,110,0.4)"); sg.addColorStop(1,"rgba(255,150,90,0)");
  g.fillStyle = sg; g.fillRect(sunx-70,suny-70,140,140);
  g.fillStyle = "#fff0c0"; g.beginPath(); g.arc(sunx,suny,11,0,7); g.fill();

  // clouds
  cloud(g, 60 + Math.sin(t*0.05)*10 - par*4, 40, "rgba(255,200,170,0.35)");
  cloud(g, 250 + Math.cos(t*0.04)*8 - par*4, 30, "rgba(255,210,180,0.28)");
  cloud(g, 150 - t*3 % 400 + 60, 55, "rgba(255,190,160,0.25)");

  // far hills
  hill(g, 104, 6, 0.03, t*0.02 - par*6, "#5a4a7a");
  hill(g, 116, 9, 0.025, 2 + t*0.015 - par*10, "#4a5a6a");
  // mid hills (green)
  hill(g, 128, 10, 0.02, 4 - par*16, "#3f6a44");
  hill(g, 140, 8, 0.03, 1 - par*22, "#356038");

  // farmhouse on the mid hill
  house(g, 196 - par*22, 118, t);

  // foreground field
  const fg = g.createLinearGradient(0,150,0,208);
  fg.addColorStop(0,"#3a6e38"); fg.addColorStop(1,"#274d28");
  g.fillStyle = fg; g.fillRect(0,148,VIEW_W,60);
  // furrow rows (perspective)
  g.strokeStyle = "rgba(20,40,20,0.4)"; g.lineWidth = 1;
  for(let i=-6;i<=6;i++){
    g.beginPath(); g.moveTo(160 + i*6, 150); g.lineTo(160 + i*40, 208); g.stroke();
  }
  // little sprouts
  g.fillStyle = "#6fb04a";
  seedRR(7);
  for(let i=0;i<26;i++){ const x=rr()*320, y=160+rr()*44; g.fillRect(x|0,y|0,1,2); g.fillRect((x-1)|0,(y+1)|0,1,1); g.fillRect((x+1)|0,(y+1)|0,1,1); }

  // fireflies / pollen
  g.fillStyle = "#fff3c0";
  for(let i=0;i<14;i++){ const x=(i*47 + t*8*(i%2?1:-1))%340-10; const y=90+Math.sin(t*1.5+i)*30+i*3%40;
    g.globalAlpha = 0.5+0.5*Math.sin(t*3+i); g.fillRect(x|0,y|0,1,1); }
  g.globalAlpha = 1;

  // birds
  g.strokeStyle = "rgba(40,30,50,0.5)"; g.lineWidth=1;
  for(let i=0;i<3;i++){ const bx=(t*14 + i*90)%380-30, by=44+i*10+Math.sin(t+i)*3;
    g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+3,by-2); g.lineTo(bx+6,by); g.stroke(); }

  // vignette
  const vg = g.createRadialGradient(160,104,60,160,104,180);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.4)");
  g.fillStyle = vg; g.fillRect(0,0,VIEW_W,VIEW_H);
}
function hill(g, baseY, amp, freq, phase, color){
  g.fillStyle = color; g.beginPath(); g.moveTo(0,VIEW_H);
  for(let x=0;x<=VIEW_W;x+=4){ g.lineTo(x, baseY + Math.sin(x*freq+phase)*amp); }
  g.lineTo(VIEW_W,VIEW_H); g.closePath(); g.fill();
}
function cloud(g, x, y, col){
  g.fillStyle = col;
  g.beginPath(); g.ellipse(x,y,16,5,0,0,7); g.fill();
  g.beginPath(); g.ellipse(x+12,y+2,11,4,0,0,7); g.fill();
  g.beginPath(); g.ellipse(x-12,y+2,10,3,0,0,7); g.fill();
}
function house(g, x, y, t){
  // body
  g.fillStyle = "#3a2c22"; g.fillRect(x,y,26,16);
  // roof
  g.fillStyle = "#2a1c16"; g.beginPath(); g.moveTo(x-3,y); g.lineTo(x+13,y-10); g.lineTo(x+29,y); g.closePath(); g.fill();
  // windows glowing (flicker)
  const fl = 0.7 + 0.3*Math.sin(t*8);
  g.fillStyle = `rgba(255,200,110,${fl})`; g.fillRect(x+4,y+4,5,5); g.fillRect(x+16,y+4,5,5);
  g.fillStyle = "#241812"; g.fillRect(x+10,y+8,6,8); // door
  // chimney smoke
  g.fillStyle = "rgba(200,200,200,0.25)";
  for(let i=0;i<4;i++){ const sy=y-12-i*6-((t*10)%6); g.beginPath(); g.arc(x+22+Math.sin(t+i)*2, sy, 2+i*0.5, 0,7); g.fill(); }
}

// ---- menu wiring ----
function initTitle(){
  gameMode = "title";
  const cont = $("btnContinue");
  if(hasSave()) cont.classList.remove("dis"); else cont.classList.add("dis");
  cont.onclick = () => { if(cont.classList.contains("dis")) return; firstGesture(); continueGame(); };
  $("btnNew").onclick = () => { firstGesture();
    if(hasSave() && !confirm("Start a new game? This will overwrite your current save.")) return;
    startNewGame(); };
  $("btnHowto").onclick = () => { firstGesture(); showHowto(); };
  const ver = $("verTag");
  if(ver){ ver.textContent = "v" + VERSION.name;
    ver.onclick = (e) => { e.stopPropagation(); firstGesture(); openPanel("newsPanel", renderNews); }; }
  updateMuteBtn();
  $("btnMute").onclick = () => { firstGesture(); setMusicEnabled(!SND.enabled); updateMuteBtn(); };
  setMusicMode("title");

  const stage = $("stage");
  stage.addEventListener("pointermove", e => {
    const r = stage.getBoundingClientRect();
    titleMX = clamp((e.clientX - r.left)/r.width, 0, 1);
    titleMY = clamp((e.clientY - r.top)/r.height, 0, 1);
  });
  // any click on the title starts audio
  $("title").addEventListener("pointerdown", firstGesture, { once:false });
}
function updateMuteBtn(){ $("btnMute").textContent = "♪ Music: " + (SND.enabled ? "On" : "Off"); }

// ---- flow ----
function startNewGame(){
  state = freshState();
  state.farm = newMap("farm");
  state.flags.npxGame = true;   // this save gets the new-player experience (prologue, hints, tips)
  try { localStorage.setItem("hs_seen_version", VERSION.code); } catch(e){}  // new players start current
  startPrologue();
}
function continueGame(){
  const s = loadGame();
  if(!s){ startNewGame(); return; }
  state = s; migrateSave(state);
  beginPlay();
  toast("Welcome back to Willowbrook!", "#8fd06a");
  // If a new player reloaded mid-arrival (arrivalSeen never persisted), give them the day-one scene
  // now rather than dropping it forever; otherwise just the "story so far" recap.
  if(state.flags.npxGame && !state.flags.arrivalSeen && state.day === 1){ maybeArrival(); }
  else storySoFar();     // one line naming the act + where you're headed
  maybeShowWhatsNew();   // surface the changelog once after an update
}
// A gentle "story so far" on load, so a returning player re-enters the arc, not just the sandbox.
function storySoFar(){
  if(!state || state.questIdx >= QUESTS.length) return;
  const t = trackerData(); if(!t) return;
  const where = t.reportTo ? `Report to ${t.reportTo}` : (t.objs[0] ? t.objs[0].text : t.title);
  setTimeout(() => toast(`${actInfo().title} · ${where}`, "#e8d18a"), 1400);
}
function migrateSave(s){
  // XP-curve recalibration (v2.8): translate stored XP onto the current table LEVEL-PRESERVINGLY —
  // a repaced curve must never demote a save (the cozy contract). Runs BEFORE the generic backfill
  // below, which would otherwise stamp freshState's xpCurve and make this check dead code (the same
  // trap as the v2.6.1 Collection-seeding bug). Pre-v2.7 saves convert via the v2.7 reading of their
  // XP, which is ≥ what they last saw — a small one-time gift, never a loss.
  if((s.xpCurve||0) < 3 && s.skills){
    const lvlIn = (T,xp) => { let l=1; while(l<99 && T[l+1]<=xp) l++; return l; };
    for(const sk in s.skills){
      const xp = s.skills[sk]||0;
      const L = lvlIn(XP_TABLE_V27, xp);
      const lo = XP_TABLE_V27[L], hi = XP_TABLE_V27[Math.min(L+1,99)];
      const frac = (L>=99 || hi<=lo) ? 0 : (xp-lo)/(hi-lo);   // progress within the level, carried over
      s.skills[sk] = Math.round(XP_TABLE[L] + frac*(XP_TABLE[Math.min(L+1,99)] - XP_TABLE[L]));
    }
  }
  s.xpCurve = 3;
  const f = freshState();
  for(const k in f){ if(s[k] === undefined) s[k] = f[k]; }
  for(const k in f.stats){ if(s.stats[k] === undefined) s.stats[k] = 0; }
  for(const t of TOOLS){ if(s.tools[t] === undefined) s.tools[t] = 0; }
  if(s.skills) for(const sk in f.skills){ if(s.skills[sk] === undefined) s.skills[sk] = 0; }
  if(!s.rel) s.rel = {};
  if(!s.animals) s.animals = { chickens:[], cows:[] };
  if(!s.animals.chickens) s.animals.chickens = [];
  if(!s.animals.cows) s.animals.cows = [];      // barns arrived after the first saves
  if(!s.flags) s.flags = {};
  // The new-player experience (prologue, verb hints, tips, arrival scene) belongs only to saves
  // BORN in the NPX era. Any pre-existing save is mid-journey — mark it done so nothing fires, and
  // seed its Collection from what it already holds (the generic backfill above has already given it
  // freshState's default `discovered`, so we MERGE into that — a bare `if(!s.discovered)` never ran).
  if(s.flags.npxGame === undefined){
    s.flags.npxGame = false; s.flags.arrivalSeen = true;
    if(!s.discovered) s.discovered = {};
    for(const it in (s.inv||{})) s.discovered[it] = true;
    for(const l of LEGENDS) if(s.flags["caught_"+l.id]) s.discovered[l.name] = true;
  }
  if(!s.market) s.market = {};                 // Tom's demand arrived in v2.0
  if(!WEATHERS[s.weather]) s.weather = "clear"; // old saves may hold a weather we no longer have
  // courtship was Maya-only before v1.4
  if(s.flags.mayaConfided) s.flags.confided_maya = true;
  if(s.flags.married && !s.flags.spouse) s.flags.spouse = "maya";
  if(!s.farm) s.farm = newMap("farm");
}
function beginPlay(){
  gameMode = "play"; paused = false; sleeping = false;
  cutscene = null; $("stage").classList.remove("cine");   // never boot into a stale scene's input lock
  clearMapCache();
  $("title").classList.add("hidden"); $("intro").classList.add("hidden");
  $("hud").classList.remove("hidden"); $("hotbar").classList.remove("hidden");
  if(IS_TOUCH) $("touchUI").classList.remove("hidden");
  setMap("farm", 8*TILE+8, 12*TILE, "down");   // always wake on the farm
  refreshHUD(); refreshHotbar(); refreshQuestTracker(); setControlsHint(); clearPickups();
  // recover a stranded finale: reloaded during the handoff, OR the finale's objectives are
  // already met but the festival never fired.
  state.flags.festivalActive = false; state.flags.festivalPending = false; state.flags.seasonalActive = null;
  state.flags.reunionScene = false; state.flags.turnInPending = false;
  if(!state.forecast) rollForecast();   // day 1, and every save from before the forecast existed
  applyProjects(state.farm);    // idempotent — re-lays anything a save already paid for
  if(!state.flags.festivalDone){
    // questIdx past the finale but festivalDone unset means the handoff was interrupted
    if(state.questIdx > FINALE_IDX) setTimeout(startFestival, 800);
    else checkQuests();   // auto-fires the finale (giver "The Valley") if its objectives are met
  }
}

// ---- the prologue: three narration cards, all skippable, that state the premise before the
// letter states the mission. New-game only; a returning player never sees any of this.
const PROLOGUE = [
"There was a time this valley never slept.\n\nNine crafts under one roof — the Guild lit every window, and on festival nights the whole coast floated with lanterns.",
"Then, one by one, the crafts went cold. The Guild closed its doors. The lanterns stayed in their boxes.\n\nWillowbrook learned to live small, and the years went quietly by.",
"Far away, an old farmer always meant to go back and set it right.\n\nHe ran out of seasons.\n\nThen a letter came — addressed to you.",
];

// ---- intro letter ----
// The letter keeps Grandpa's voice but now names the mission plainly: the Guild went dark, the
// festival died, and waking the valley is the thing he's leaving you.
const LETTER =
"My dear grandchild,\n\n" +
"If you're reading this, the old farm is yours now. I know it doesn't look like much — the weeds have had their way, and the valley's gone quiet since the Guild closed its doors.\n\n" +
"But this soil remembers every seed I ever planted. Tend it, and it'll tend to you. Plant a little each day, water what you sow, and rest when the sun goes down.\n\n" +
"I'll not dress up the rest: Willowbrook is fading. The Guild of Nine Crafts stands dark, one craft at a time gone cold, and the Grand Festival that once lit the whole coast hasn't been held in years. I always meant to wake it back up — relight the crafts, put the lanterns back on the water. I ran out of seasons. Maybe you won't.\n\n" +
"The rest, you'll figure out — same as I did. Oh — and do say hello to Maya. She's good people.\n\n" +
"Welcome home, kiddo.\nWelcome to Willowbrook.\n            — Grandpa";

let _letterTimer = null, _letterFull = "", _letterEl = null, _letterDone = null, _letterActive = false;

// Long letters (the memorial, Grandpa's last page) overflow the frame, so the body scrolls.
// Show a fade + chevron only while there is genuinely more text below.
function updateLetterFade(){
  const el = $("letterBody"), box = $("letter"), stage = $("stage");
  if(!el || !box) return;
  // the letter is capped by the STAGE, not the viewport — a phone's stage is short even
  // when the page is tall, so measure it and tighten the chrome when there's little room
  if(stage) box.classList.toggle("tight", stage.clientHeight > 0 && stage.clientHeight < 430);
  // a hairline overflow isn't "more to read" — don't nag over 5px of leading
  const more = el.scrollHeight - el.clientHeight - el.scrollTop > 12;
  box.classList.toggle("more", more);
}
function letterAtBottom(){
  const el = $("letterBody"); if(!el) return true;
  return el.scrollHeight - el.clientHeight - el.scrollTop < 24;
}

function typeLetter(el, text, onDone){
  _letterEl = el; _letterFull = text; _letterDone = onDone; _letterActive = true;
  el.innerHTML = "";
  el.scrollTop = 0;
  let i = 0, follow = true;                       // the typewriter drags the view along with it
  clearInterval(_letterTimer);
  _letterTimer = setInterval(() => {
    i += 1;
    el.innerHTML = escapeHtml(text.slice(0,i)) + '<span class="cursor">▌</span>';
    if(follow) el.scrollTop = el.scrollHeight;    // ...unless the reader scrolls up to re-read
    else if(letterAtBottom()) follow = true;
    updateLetterFade();
    if(i % 3 === 0) playSfx("blipTalk");
    if(i >= text.length){ finishLetter(true); }
  }, 34);
  el.onscroll = () => { if(_letterActive && !letterAtBottom()) follow = false; updateLetterFade(); };
}

// `natural` = the text finished typing on its own. If the reader SKIPPED it, drop them back to
// the top so they can actually read the thing they just revealed.
function finishLetter(natural){
  clearInterval(_letterTimer);
  const wasActive = _letterActive;
  if(_letterEl){
    _letterEl.innerHTML = escapeHtml(_letterFull);
    if(wasActive && !natural) _letterEl.scrollTop = 0;
  }
  _letterActive = false;
  updateLetterFade();
  requestAnimationFrame(updateLetterFade);   // once more after layout settles
  if(_letterDone) _letterDone();
}
function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// Three narration cards over a darkened title, one click each. A persistent "Skip intro"
// jumps straight to the letter — no beat is ever forced (the cozy contract).
function startPrologue(){
  gameMode = "intro";
  $("title").classList.add("hidden");
  const intro = $("intro"); intro.classList.remove("hidden"); intro.classList.add("prologue");
  const btn = $("btnLetterNext"), skip = $("btnSkipIntro");
  let i = 0;
  const showCard = () => {
    intro.querySelector(".lhead").textContent = "✦ Willowbrook";
    btn.textContent = (i < PROLOGUE.length - 1) ? "▸" : "The letter ▸";
    btn.classList.remove("show");
    typeLetter($("letterBody"), PROLOGUE[i], () => btn.classList.add("show"));
  };
  // NB: #letter .mbtn is visibility:hidden until it also has `.show` — so the skip button needs BOTH
  // `hidden` removed (clears display:none) AND `.show` added, or it renders present-but-invisible.
  const hideSkip = () => { if(skip){ skip.classList.add("hidden"); skip.classList.remove("show"); } };
  const toLetter = () => { intro.classList.remove("prologue"); hideSkip(); startIntro(); };
  const advance = () => {
    if(_letterActive){ finishLetter(); return; }   // first click just finishes the type-on
    i++;
    if(i >= PROLOGUE.length){ toLetter(); return; }
    showCard();
  };
  btn.onclick = advance;
  if(skip){ skip.classList.remove("hidden"); skip.classList.add("show"); skip.onclick = e => { e.stopPropagation(); toLetter(); }; }
  intro.onclick = e => { if(e.target.closest("#btnLetterNext") || e.target.closest("#btnSkipIntro")) return; advance(); };
  showCard();
}

function startIntro(){
  gameMode = "intro";
  $("title").classList.add("hidden");
  const intro = $("intro"); intro.classList.remove("hidden");
  $("intro").querySelector(".lhead").textContent = "✒ A letter, left on the kitchen table";
  const btn = $("btnLetterNext"); btn.textContent = "Continue ▸"; btn.classList.remove("show");
  const skip = $("btnSkipIntro"); if(skip){ skip.classList.add("hidden"); skip.classList.remove("show"); }
  typeLetter($("letterBody"), LETTER, () => btn.classList.add("show"));
  btn.onclick = () => {
    beginPlay();
    state.flags.introSeen = true;
    saveGame();
    maybeArrival();   // Maya greets you at the farm, then the Act I banner (both skippable)
  };
  // click to skip typing
  intro.onclick = e => { if(e.target.closest("#btnLetterNext")) return; if(_letterActive) finishLetter(); };
}

function showHowto(){
  const intro = $("intro"); intro.classList.remove("hidden");
  intro.querySelector(".lhead").textContent = "✒ How to Play";
  const body = $("letterBody");
  body.innerHTML = escapeHtml(HOWTO_TEXT);
  body.scrollTop = 0;                                  // no typewriter here — set the fade by hand
  body.onscroll = updateLetterFade;
  requestAnimationFrame(updateLetterFade);
  const btn = $("btnLetterNext"); btn.textContent = "◂ Back"; btn.classList.add("show");
  btn.onclick = () => { intro.classList.add("hidden"); gameMode = "title"; };
  intro.onclick = null;
}
// the frame is a % of the stage, so a resize changes what fits
window.addEventListener("resize", () => { if(!$("intro").classList.contains("hidden")) updateLetterFade(); });
