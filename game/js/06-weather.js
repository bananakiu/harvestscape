"use strict";
/* ============================================================
   06-weather.js — day/night grading, dynamic lights (indoor,
   mine & outdoor), weather and ambient life.
   ============================================================ */

const SKY_STOPS = [
  [0.00, "#0e1130"], [0.18, "#141a3a"],
  [0.22, "#5a4a70"], [0.25, "#e6be92"],
  [0.30, "#fdf3e2"], [0.50, "#ffffff"],
  [0.70, "#fff6e6"], [0.76, "#ffd39a"],
  [0.81, "#ff9a68"], [0.86, "#5a466e"],
  [0.92, "#141a3a"], [1.00, "#0e1130"],
];

function curHour(){ return (state.time/60) % 24; }
function seasonIdx(){ return Math.floor((state.day-1)/SEASON_DAYS) % 4; }
function curSeason(){ return SEASONS[seasonIdx()]; }
function nightFactor(h){
  if(h >= 6.5 && h <= 18) return 0;
  if(h > 18 && h < 20.5) return smooth(inv(h,18,20.5));
  if(h >= 20.5 || h < 5) return 1;
  if(h >= 5 && h < 6.5) return 1 - smooth(inv(h,5,6.5));
  return 0;
}

function collectLights(){
  const L = []; if(!curMap) return L;
  const flick = 0.82 + 0.18*Math.sin(animT*11) + 0.05*Math.sin(animT*23);
  for(const k in curMap.objects){
    const o = curMap.objects[k]; const [x,y] = k.split(",").map(Number);
    const cx = x*TILE+8, cy = y*TILE+8;
    switch(o.kind){
      case "campfire":  L.push({x:cx,y:cy,r:48,c:"255,150,60",i:flick}); break;
      case "torch":     L.push({x:cx,y:cy-2,r:40,c:"255,160,70",i:flick}); break;
      case "stove":     L.push({x:cx,y:cy,r:28,c:"255,150,70",i:0.8*flick}); break;
      case "fireplace": L.push({x:cx,y:cy-2,r:44,c:"255,150,70",i:flick}); break;
      case "lamp":      L.push({x:cx,y:cy-6,r:44,c:"255,225,150",i:0.95}); break;
      case "crystal":   L.push({x:cx,y:cy,r:36,c:"140,210,255",i:0.7+0.15*Math.sin(animT*4)}); break;
      case "gemrock":   L.push({x:cx,y:cy,r:20,c:"200,150,240",i:0.5}); break;
      case "sealeddoor":L.push({x:cx,y:cy-4,r:40,c:"170,220,255",i:0.8}); break;
      case "wing":      if(wingLit(o.wing)) L.push({x:cx,y:cy-2,r:26,c:"255,170,80",i:flick*0.9}); break;
      case "lantern":   L.push({x:cx,y:cy-2,r:30,c:"255,200,110",i:0.85+0.12*Math.sin(animT*3+x)}); break;
      case "stall":     L.push({x:cx,y:cy-4,r:34,c:"255,200,120",i:0.9}); break;
      case "banner":    L.push({x:cx,y:cy-6,r:24,c:"255,210,120",i:0.5}); break;
      case "waystone":  if(o.ws==="way1" || (state.waystones||[]).includes(o.ws))
                          L.push({x:cx,y:cy-4,r:36,c:"140,230,200",i:0.7+0.12*Math.sin(animT*2.2)}); break;
      case "hearttree": L.push({x:cx,y:cy-10,r:52,c:"150,240,205",i:0.55+0.1*Math.sin(animT*1.6)}); break;
      case "ancient":   L.push({x:cx,y:cy-8,r:40,c:"255,215,120",i:0.45+0.1*Math.sin(animT*1.9)}); break;
    }
  }
  // Every window in the valley glows after dark — the same procedural rule that draws them
  // (isWindowTile, 07-entities.js). This replaces two hardcoded cottage lights and is most of the
  // point of having windows: a town that looks lived-in at night. Cheap: collectLights only runs
  // when lights show, and the scan is a few thousand array reads on a 320×208 game.
  for(let wy=0; wy<curMap.h; wy++) for(let wx=0; wx<curMap.w; wx++){
    if(curMap.tiles[wy*W+wx] === T.WALL && isWindowTile(wx, wy))
      L.push({ x:wx*TILE+8, y:wy*TILE+11, r:28, c:"255,208,128", i:0.8 });
  }
  L.push({ x:state.px, y:state.py-6, r: curMap.id==="mine"?98:42,   // wide warm lantern underground; a soft warm aura up top
           c: curMap.id==="mine"?"255,215,160":"255,226,178", i: curMap.id==="mine"?1:0.55 });
  return L;
}

function drawLighting(camX, camY){
  const h = curHour(), nf = nightFactor(h);
  let amb, boost, showLights;
  if(!curMap || curMap.outdoor){
    amb = gradHex(SKY_STOPS, h/24);
    const st = { Summer:"#fff0d8", Fall:"#f2d8a8", Winter:"#e4edf8" }[curSeason()];
    if(st) amb = mixHex(amb, st, 0.20);
    if(state.weather === "rain") amb = mixHex(amb, "#5a6472", 0.4);
    else if(state.weather === "storm") amb = mixHex(amb, "#3a4052", 0.62);
    else if(state.weather === "fog") amb = mixHex(amb, "#b8c0cc", 0.42);
    else if(state.weather === "snow") amb = mixHex(amb, "#cad6e4", 0.32);
    // Deep night shouldn't crush the world to black — lift the floor toward a readable moonlit blue.
    if(nf > 0) amb = mixHex(amb, "#464c6a", 0.42*nf);
    const dim = { rain:0.35, storm:0.55, fog:0.30, snow:0.35 }[state.weather] || 0;
    boost = dim ? Math.max(nf, dim) : nf;
    showLights = boost > 0.02;
  } else if(curMap.id === "mine"){
    amb = "#5b5568"; boost = 1; showLights = true;      // dim but readable — you can see ore to swing at
  } else {
    amb = "#ccb89a"; boost = 0.7; showLights = true;      // cozy interior
  }

  ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = amb; ctx.fillRect(0,0,VIEW_W,VIEW_H); ctx.restore();

  if(showLights){
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for(const Lt of collectLights()){
      const sx = Lt.x - camX, sy = Lt.y - camY;
      if(sx < -70 || sx > VIEW_W+70 || sy < -70 || sy > VIEW_H+70) continue;
      const g = ctx.createRadialGradient(sx,sy,0,sx,sy,Lt.r);
      // softer core, fuller mid, quicker tail — a readable pool, not a blooming hotspot
      g.addColorStop(0,    `rgba(${Lt.c},${0.44*boost*Lt.i})`);
      g.addColorStop(0.4,  `rgba(${Lt.c},${0.34*boost*Lt.i})`);
      g.addColorStop(0.78, `rgba(${Lt.c},${0.12*boost*Lt.i})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(sx-Lt.r, sy-Lt.r, Lt.r*2, Lt.r*2);
    }
    ctx.restore();
  }

  // a soft frame — eased off underground, where the dark already does the framing
  const vigA = (curMap && curMap.id === "mine") ? 0.18 : 0.34;
  const vg = ctx.createRadialGradient(VIEW_W/2,VIEW_H/2, VIEW_H*0.45, VIEW_W/2,VIEW_H/2, VIEW_H*0.95);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,`rgba(0,0,0,${vigA})`);
  ctx.fillStyle = vg; ctx.fillRect(0,0,VIEW_W,VIEW_H);

  // Tired, not hurt. Low energy dims the edges of the world with a warm, slow, sleepy haze —
  // never the blood-red danger flash it used to be. There is nothing here to be afraid of.
  if(state.energy < 25){
    const pulse = 0.6 + 0.4*Math.sin(animT*1.4);
    const a = (1 - state.energy/25) * 0.15 * pulse;
    const rv = ctx.createRadialGradient(VIEW_W/2,VIEW_H/2, VIEW_H*0.38, VIEW_W/2,VIEW_H/2, VIEW_H*0.98);
    rv.addColorStop(0,"rgba(58,44,28,0)"); rv.addColorStop(1,`rgba(58,44,28,${a})`);
    ctx.fillStyle = rv; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  }
}

// ---- rain (outdoor only) ----
const rainDrops = [];
function ensureRain(){
  if(rainDrops.length) return;
  for(let i=0;i<90;i++) rainDrops.push({ x:Math.random()*VIEW_W, y:Math.random()*VIEW_H, len:rand(4,9), sp:rand(240,340) });
}
let _flash = 0;              // lightning: a brief white wash, never a hazard
const fogBanks = [];
function ensureFog(){
  if(fogBanks.length) return;
  for(let i=0;i<9;i++) fogBanks.push({ x:Math.random()*VIEW_W, y:rand(6,VIEW_H-16),
    w:rand(80,170), h:rand(16,34), sp:rand(3,10), a:rand(0.10,0.24) });
}
function drawWeather(){
  if(!curMap || !curMap.outdoor){ _flash = 0; return; }
  // updateWeather is skipped while paused/uiBlocking, so decay the flash here too, or a strike
  // caught mid-frame would freeze as a full-screen wash behind an open menu.
  if(paused || uiBlocking()) _flash = 0;
  if(state.weather === "rain" || state.weather === "storm"){
    ensureRain();
    const storm = state.weather === "storm";
    ctx.strokeStyle = storm ? "rgba(200,215,240,0.62)" : "rgba(180,205,230,0.5)";
    ctx.lineWidth = 1; ctx.beginPath();
    for(const d of rainDrops){ const L = storm ? d.len*1.5 : d.len;
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - (storm?5:2), d.y+L); }
    ctx.stroke();
    if(storm && _flash > 0){
      ctx.fillStyle = `rgba(220,230,255,${(_flash*0.22).toFixed(3)})`;   // a glimmer, never a whiteout
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  } else if(state.weather === "snow"){
    ensureRain();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for(const d of rainDrops){ const s = d.len>6?2:1; ctx.fillRect(d.x|0, d.y|0, s, s); }
  } else if(state.weather === "fog"){
    ensureFog();
    ctx.fillStyle = "rgba(226,232,240,0.13)";      // the whole valley goes soft
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for(const b of fogBanks){
      ctx.fillStyle = `rgba(226,232,240,${b.a.toFixed(3)})`;
      ctx.fillRect(b.x|0, b.y|0, b.w, b.h);
      ctx.fillStyle = `rgba(240,244,250,${(b.a*0.6).toFixed(3)})`;
      ctx.fillRect((b.x+8)|0, (b.y+3)|0, b.w-16, b.h-6);
    }
  }
}
function updateWeather(dt){
  if(!curMap || !curMap.outdoor){ setRainLevel(0); _flash = 0; return; }
  if(state.weather === "rain" || state.weather === "storm"){
    const storm = state.weather === "storm";
    const fall = storm ? 1.45 : 1, drift = storm ? 130 : 40;
    for(const d of rainDrops){ d.y += d.sp*fall*dt; d.x -= drift*dt;
      if(d.y > VIEW_H){ d.y = -d.len; d.x = Math.random()*VIEW_W+40; } if(d.x < -10) d.x = VIEW_W+10; }
    if(chance(dt*(storm?14:8))){ pSplash(state.px + rand(-90,90), state.py + rand(-40,60), 3); }
    if(storm){
      _flash = Math.max(0, _flash - dt*3.2);
      if(chance(dt*0.16)){ _flash = 1; playSfx("thunder"); }   // light and noise; nothing is harmed
    }
    setRainLevel(storm ? 1.6 : 1);   // a storm is louder than a drizzle, and ducks the music more
  } else if(state.weather === "fog"){
    ensureFog();
    for(const b of fogBanks){ b.x -= b.sp*dt; if(b.x + b.w < -10){ b.x = VIEW_W + 10; b.y = rand(10,VIEW_H-20); } }
    setRainLevel(0);
  } else if(state.weather === "snow"){
    ensureRain();
    for(const d of rainDrops){ d.y += d.sp*0.26*dt; d.x += Math.sin(animT*1.4 + d.y*0.12)*12*dt;
      if(d.y > VIEW_H){ d.y = -2; d.x = Math.random()*VIEW_W; } if(d.x < -6) d.x = VIEW_W; if(d.x > VIEW_W+6) d.x = 0; }
    setRainLevel(0.25);
  } else setRainLevel(0);

  const nf = nightFactor(curHour()), season = curSeason();
  if(state.weather === "clear"){
    if(nf < 0.2){
      if(chance(dt*2.2)) addP({ x: cam.x + rand(0,VIEW_W), y: cam.y + rand(0,VIEW_H), vx:rand(-6,6), vy:rand(-4,-1),
        grav:-1, life:0, max:rand(2,3.5), size:1, color: season==="Winter"?"#eaf2fb":"#fff3c0", type:"star" });
      if(chance(dt*0.28) && season!=="Winter") ambBird();
    }
    if(nf > 0.6){
      if(chance(dt*2.5) && season!=="Winter") addP({ x: cam.x + rand(0,VIEW_W), y: cam.y + rand(20,VIEW_H), vx:rand(-8,8), vy:rand(-8,4),
        grav:0, life:0, max:rand(1.5,3), size:1, color:"#c6ff8a", type:"star" });
      if(chance(dt*0.9)) ambCricket();
    }
    // autumn leaves drifting down
    if(season === "Fall" && nf < 0.5 && chance(dt*1.5)){
      addP({ x: cam.x + rand(0,VIEW_W), y: cam.y + rand(-10, VIEW_H*0.5), vx:rand(-14,6), vy:rand(6,13), grav:2,
        life:0, max:rand(2.2,3.8), size:2, color: pick(["#d0783a","#e0a048","#c04a2a","#b8683a"]), type:"leaf", rot:rand(0,6.28), rv:rand(-3,3) });
    }
  }
}

// ---- THE FORECAST ----
// state.forecast holds TOMORROW's weather. newDay promotes it into state.weather and rolls a fresh
// one, so a player can always read tomorrow off the noticeboard tonight and plan the day around it.
function seasonOf(day){ return SEASONS[Math.floor((day-1)/SEASON_DAYS) % 4]; }

// A festival or a birthday never gets stormed on, and never gets fogged out. The valley wouldn't.
function isDatedDay(day){
  const season = seasonOf(day), d = ((day-1) % SEASON_DAYS) + 1;
  if(FESTIVALS.some(f => f.season===season && f.day===d)) return true;
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id]; if(b.season===season && b.day===d) return true; }
  if(state.flags && state.flags.anniversaryDay != null
     && SEASONS.indexOf(season)*SEASON_DAYS + d === state.flags.anniversaryDay) return true;
  return false;
}

function rollWeatherFor(day){
  if(day <= 1) return "clear";                        // the first morning is always kind
  const odds = WEATHER_ODDS[seasonOf(day)] || { clear:1 };
  const fair = isDatedDay(day);
  const skip = k => fair && (k === "storm" || k === "fog");
  let total = 0;
  for(const k in odds) if(!skip(k)) total += odds[k];
  let r = Math.random() * total;
  for(const k in odds){ if(skip(k)) continue; r -= odds[k]; if(r <= 0) return k; }
  return "clear";
}

function rollForecast(){ state.forecast = rollWeatherFor(state.day + 1); }

// Called from newDay AFTER state.day has advanced: today becomes what was forecast last night.
function rollWeather(){
  state.weather = state.forecast || rollWeatherFor(state.day);
  rollForecast();
}

const weatherInfo = w => WEATHERS[w] || WEATHERS.clear;
const isStorm = () => state.weather === "storm";
const isFog   = () => state.weather === "fog";
const isRain  = () => state.weather === "rain";
const isSnow  = () => state.weather === "snow";
