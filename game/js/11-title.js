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
  startIntro();
}
function continueGame(){
  const s = loadGame();
  if(!s){ startNewGame(); return; }
  state = s; migrateSave(state);
  beginPlay();
  toast("Welcome back to Willowbrook!", "#8fd06a");
}
function migrateSave(s){
  const f = freshState();
  for(const k in f){ if(s[k] === undefined) s[k] = f[k]; }
  for(const k in f.stats){ if(s.stats[k] === undefined) s.stats[k] = 0; }
  for(const t of TOOLS){ if(s.tools[t] === undefined) s.tools[t] = 0; }
  if(s.skills) for(const sk in f.skills){ if(s.skills[sk] === undefined) s.skills[sk] = 0; }
  if(!s.rel) s.rel = {};
  if(!s.animals) s.animals = { chickens:[] };
  if(!s.farm) s.farm = newMap("farm");
}
function beginPlay(){
  gameMode = "play"; paused = false; sleeping = false;
  clearMapCache();
  $("title").classList.add("hidden"); $("intro").classList.add("hidden");
  $("hud").classList.remove("hidden"); $("hotbar").classList.remove("hidden");
  if(IS_TOUCH) $("touchUI").classList.remove("hidden");
  setMap("farm", 8*TILE+8, 12*TILE, "down");   // always wake on the farm
  refreshHUD(); refreshHotbar(); refreshQuestTracker(); setControlsHint();
  // recover a stranded finale (game was reloaded/closed during the festival handoff)
  if(state.questIdx >= QUESTS.length && !state.flags.festivalDone){
    state.flags.festivalActive = false;
    setTimeout(startFestival, 800);
  }
}

// ---- intro letter ----
const LETTER =
"My dear grandchild,\n\n" +
"If you're reading this, the old farm is yours now. I know it doesn't look like much — the weeds have had their way, and the valley's gone quiet since the Guild closed its doors.\n\n" +
"But this soil remembers every seed I ever planted. Tend it, and it'll tend to you. Plant a little each day, water what you sow, and rest when the sun goes down.\n\n" +
"The rest, you'll figure out — same as I did. Oh — and do say hello to Maya. She's good people.\n\n" +
"Welcome home, kiddo.\nWelcome to Willowbrook.\n            — Grandpa";

let _letterTimer = null, _letterFull = "", _letterEl = null, _letterDone = null, _letterActive = false;
function typeLetter(el, text, onDone){
  _letterEl = el; _letterFull = text; _letterDone = onDone; _letterActive = true;
  el.innerHTML = "";
  let i = 0;
  clearInterval(_letterTimer);
  _letterTimer = setInterval(() => {
    i += 1;
    el.innerHTML = escapeHtml(text.slice(0,i)) + '<span class="cursor">▌</span>';
    if(i % 3 === 0) playSfx("blipTalk");
    if(i >= text.length){ finishLetter(); }
  }, 34);
}
function finishLetter(){
  clearInterval(_letterTimer);
  if(_letterEl) _letterEl.innerHTML = escapeHtml(_letterFull);
  _letterActive = false;
  if(_letterDone) _letterDone();
}
function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function startIntro(){
  gameMode = "intro";
  $("title").classList.add("hidden");
  const intro = $("intro"); intro.classList.remove("hidden");
  $("intro").querySelector(".lhead").textContent = "✒ A letter, left on the kitchen table";
  const btn = $("btnLetterNext"); btn.textContent = "Continue ▸"; btn.classList.remove("show");
  typeLetter($("letterBody"), LETTER, () => btn.classList.add("show"));
  btn.onclick = () => {
    beginPlay();
    state.flags.introSeen = true;
    banner("☀ Welcome to Willowbrook", "First task: wake the soil in the plot below your cottage.");
    saveGame();
  };
  // click to skip typing
  intro.onclick = e => { if(e.target.closest("#btnLetterNext")) return; if(_letterActive) finishLetter(); };
}

function showHowto(){
  const intro = $("intro"); intro.classList.remove("hidden");
  intro.querySelector(".lhead").textContent = "✒ How to Play";
  const txt =
"Move with WASD or the arrow keys.\n\n" +
"Space uses your selected tool on the tile you face:\n" +
"• Hoe tills soil  • Watering Can waters it  • Seeds plant a crop\n" +
"• Axe chops trees  • Pick mines rock  • Rod fishes water\n\n" +
"E interacts — harvest crops, talk to folk, open doors, cook, and step inside your cottage to sleep in your bed and pass the night.\n\n" +
"Explore! Enter the shops and houses in town, descend the old mine (north) for ore and gems, and follow the south path to the coast.\n\n" +
"Sell at Tom's stall, buy seeds and upgrade tools. Every action trains a skill from 1 to 99. Follow the tasks in your Journal (J) to wake the valley.\n\n" +
"R cycles seeds · F eats food · G gifts Maya · K skills · I backpack";
  $("letterBody").innerHTML = escapeHtml(txt);
  const btn = $("btnLetterNext"); btn.textContent = "◂ Back"; btn.classList.add("show");
  btn.onclick = () => { intro.classList.add("hidden"); gameMode = "title"; };
  intro.onclick = null;
}
