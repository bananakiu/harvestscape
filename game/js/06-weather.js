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
    }
  }
  if(curMap.id === "farm"){
    L.push({ x:6*TILE+8, y:5*TILE+12, r:34, c:"255,205,120", i:1 });
    L.push({ x:9*TILE+8, y:5*TILE+12, r:34, c:"255,205,120", i:1 });
  }
  L.push({ x:state.px, y:state.py-6, r: curMap.id==="mine"?68:52,
           c: curMap.id==="mine"?"255,215,160":"200,215,255", i: curMap.id==="mine"?1:0.7 });
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
    else if(state.weather === "snow") amb = mixHex(amb, "#cad6e4", 0.32);
    boost = (state.weather === "rain" || state.weather === "snow") ? Math.max(nf, 0.35) : nf;
    showLights = boost > 0.02;
  } else if(curMap.id === "mine"){
    amb = "#39344a"; boost = 1; showLights = true;
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
      g.addColorStop(0, `rgba(${Lt.c},${0.55*boost*Lt.i})`);
      g.addColorStop(0.5, `rgba(${Lt.c},${0.22*boost*Lt.i})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(sx-Lt.r, sy-Lt.r, Lt.r*2, Lt.r*2);
    }
    ctx.restore();
  }

  const vg = ctx.createRadialGradient(VIEW_W/2,VIEW_H/2, VIEW_H*0.45, VIEW_W/2,VIEW_H/2, VIEW_H*0.95);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.34)");
  ctx.fillStyle = vg; ctx.fillRect(0,0,VIEW_W,VIEW_H);

  if(state.energy < 25){
    const pulse = 0.5 + 0.5*Math.sin(animT*3);
    const a = (1 - state.energy/25) * 0.22 * pulse;
    const rv = ctx.createRadialGradient(VIEW_W/2,VIEW_H/2, VIEW_H*0.3, VIEW_W/2,VIEW_H/2, VIEW_H*0.95);
    rv.addColorStop(0,"rgba(150,10,10,0)"); rv.addColorStop(1,`rgba(150,10,10,${a})`);
    ctx.fillStyle = rv; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  }
}

// ---- rain (outdoor only) ----
const rainDrops = [];
function ensureRain(){
  if(rainDrops.length) return;
  for(let i=0;i<90;i++) rainDrops.push({ x:Math.random()*VIEW_W, y:Math.random()*VIEW_H, len:rand(4,9), sp:rand(240,340) });
}
function drawWeather(){
  if(!curMap || !curMap.outdoor) return;
  if(state.weather === "rain"){
    ensureRain();
    ctx.strokeStyle = "rgba(180,205,230,0.5)"; ctx.lineWidth = 1; ctx.beginPath();
    for(const d of rainDrops){ ctx.moveTo(d.x, d.y); ctx.lineTo(d.x-2, d.y+d.len); }
    ctx.stroke();
  } else if(state.weather === "snow"){
    ensureRain();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for(const d of rainDrops){ const s = d.len>6?2:1; ctx.fillRect(d.x|0, d.y|0, s, s); }
  }
}
function updateWeather(dt){
  if(!curMap || !curMap.outdoor){ setRainLevel(0); return; }
  if(state.weather === "rain"){
    for(const d of rainDrops){ d.y += d.sp*dt; d.x -= 40*dt;
      if(d.y > VIEW_H){ d.y = -d.len; d.x = Math.random()*VIEW_W+40; } if(d.x < -10) d.x = VIEW_W+10; }
    if(chance(dt*8)){ pSplash(state.px + rand(-90,90), state.py + rand(-40,60), 3); }
    setRainLevel(1);
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

function rollWeather(){
  const si = seasonIdx();
  const precipChance = [0.30, 0.24, 0.30, 0.42][si];
  const precip = si === 3 ? "snow" : "rain";
  state.weather = (state.day > 1 && chance(precipChance)) ? precip : "clear";
}
