"use strict";
/* ============================================================
   05-particles.js — particles + floating text. Drawn in world
   space inside the camera transform.
   ============================================================ */

/* ---- high-resolution text overlay ----
   The world renders to a 320x208 canvas scaled up ~4x, which turns any text
   drawn on it to mush. Instead we QUEUE text (in world px) during the frame and
   stamp it crisp onto a separate canvas sized to the real display (× dpr), the
   way Stardew keeps its UI text sharp over pixel-art. */
const gtx  = document.getElementById("gtext");
const gctx = gtx.getContext("2d");
let _textScale = 1;
const _textQ = [];

// wx,wy: WORLD px (or screen px if opt.screen). size is in game px, scaled to the display.
function queueText(wx, wy, text, opt){ _textQ.push(Object.assign({ wx, wy, text }, opt)); }

function syncTextLayer(){
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = cv.clientWidth || VIEW_W, h = cv.clientHeight || VIEW_H;
  const bw = Math.round(w*dpr), bh = Math.round(h*dpr);
  if(gtx.width !== bw || gtx.height !== bh){ gtx.width = bw; gtx.height = bh; }
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);       // draw in CSS px; the buffer is dpr-dense
  _textScale = w / VIEW_W;                        // display px per game px
}

// stamp every queued string crisply. camX/camY is the world origin (cam minus shake).
function flushText(camX, camY){
  syncTextLayer();
  const S = _textScale, wCss = cv.clientWidth || VIEW_W, hCss = cv.clientHeight || VIEW_H;
  gctx.clearRect(0, 0, wCss, hCss);
  gctx.textBaseline = "alphabetic";
  for(const t of _textQ){
    const sx = (t.screen ? t.wx : t.wx - camX) * S;
    const sy = (t.screen ? t.wy : t.wy - camY) * S;
    gctx.font = `${t.weight ? t.weight+" " : ""}${(t.size||8)*S}px "VT323", monospace`;
    gctx.textAlign = t.align || "center";
    gctx.globalAlpha = t.alpha == null ? 1 : t.alpha;
    if(t.shadow !== null){
      const off = Math.max(1, S*0.45);
      gctx.fillStyle = t.shadow || "rgba(0,0,0,0.5)";
      gctx.fillText(t.text, sx + off, sy + off);
    }
    gctx.fillStyle = t.color || "#fff";
    gctx.fillText(t.text, sx, sy);
  }
  gctx.globalAlpha = 1;
  _textQ.length = 0;
}
function clearTextLayer(){ syncTextLayer(); gctx.clearRect(0, 0, gtx.width, gtx.height); _textQ.length = 0; }

function addP(p){ if(particles.length < 600) particles.push(p); }

function pPuff(x,y,color,n=6){
  for(let i=0;i<n;i++) addP({ x, y, vx:rand(-18,18), vy:rand(-26,-6), grav:40, life:0, max:rand(.3,.6),
    size:rand(1,2)|0, color, type:"rect" });
}
function pChips(x,y,color,n=7){
  for(let i=0;i<n;i++) addP({ x, y, vx:rand(-40,40), vy:rand(-60,-20), grav:180, life:0, max:rand(.4,.8),
    size:rand(1,2)|0, color, type:"rect" });
}
function pDrops(x,y,n=8){
  for(let i=0;i<n;i++) addP({ x, y:y-2, vx:rand(-30,30), vy:rand(-40,-10), grav:150, life:0, max:rand(.3,.6),
    size:1, color:"#8fd3ff", type:"rect" });
}
function pSplash(x,y,n=10){
  for(let i=0;i<n;i++) addP({ x, y, vx:rand(-35,35), vy:rand(-55,-15), grav:150, life:0, max:rand(.4,.7),
    size:1, color:chance(.5)?"#a9d8f5":"#7fbce8", type:"rect" });
}
function pSparkle(x,y,color="#fff6b0",n=8){
  pGlow(x, y, color, 8);   // a soft bloom under the stars — level-ups and gem finds feel like a find
  for(let i=0;i<n;i++) addP({ x, y, vx:rand(-22,22), vy:rand(-34,-6), grav:12, life:0, max:rand(.5,.9),
    size:rand(1,2)|0, color, type:"star" });
}
function pLeaves(x,y,color,n=5){
  for(let i=0;i<n;i++) addP({ x, y, vx:rand(-24,24), vy:rand(-30,-8), grav:22, life:0, max:rand(.8,1.4),
    size:2, color, type:"leaf", rot:rand(0,6.28), rv:rand(-4,4) });
}
function pEmber(x,y){
  addP({ x:x+rand(-2,2), y, vx:rand(-6,6), vy:rand(-22,-10), grav:-4, life:0, max:rand(.5,1),
    size:1, color:chance(.5)?"#ffcf5c":"#ff8a3a", type:"rect" });
}
function pRing(x,y,color){
  for(let i=0;i<10;i++){ const a=i/10*6.28; addP({ x, y, vx:Math.cos(a)*30, vy:Math.sin(a)*30-10, grav:10, life:0, max:.5, size:1, color, type:"rect" }); }
}
function pLantern(x,y){
  addP({ x, y, vx:rand(-4,4), vy:rand(-16,-9), grav:-2, life:0, max:rand(3.6,5.6), size:2, color:"#ffcf6a", type:"lantern", rv:rand(-1,1) });
}

function floatText(x,y,text,color="#fff"){
  // never stamp two fresh floaters on the same spot — nudge a new one clear of any just-spawned one
  for(const f of floaters){ if(f.life < 0.4 && Math.abs(f.x-x) < 28 && Math.abs(f.y-y) < 11){ y -= 12; } }
  floaters.push({ x, y, text, color, life:0, max:1.1, vy:-18 });
}
// a soft additive bloom — a warm glow that expands and fades. The cozy alternative to a hard flash.
function pGlow(x, y, color="#ffe6a0", r=9){
  addP({ x, y, vx:0, vy:0, grav:0, life:0, max:.42, size:r, color, type:"glow" });
}
// an item icon that leaps out and arcs up (harvest/gather payoff). The design bible calls the
// item-get loop the emotional core of a farming game, so it's the one place to over-invest: the
// icon pops and hangs, a warm glow blooms behind it, and a few gold stars spark off on collect.
function pItemPop(x, y, spriteName){
  if(!spr[spriteName]) return;
  pGlow(x, y - 2, "#ffe6a0", 9);
  addP({ x, y, vx:rand(-10,10), vy:-42, grav:96, life:0, max:1.0, size:16, color:"#fff", type:"icon", spriteName });
  for(let i=0;i<5;i++) addP({ x:x+rand(-4,4), y:y+rand(-4,2), vx:rand(-26,26), vy:rand(-46,-16),
    grav:34, life:0, max:rand(.35,.6), size:1, color:chance(.5)?"#fff6b0":"#ffd86a", type:"star" });
}

function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i]; p.life += dt;
    if(p.life >= p.max){ particles.splice(i,1); continue; }
    p.vy += (p.grav||0)*dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(p.rv) p.rot += p.rv*dt;
  }
  for(let i=floaters.length-1;i>=0;i--){
    const f = floaters[i]; f.life += dt; f.y += f.vy*dt; f.vy *= (1 - dt*1.5);
    if(f.life >= f.max) floaters.splice(i,1);
  }
}

function drawParticles(){
  for(const p of particles){
    const k = 1 - p.life/p.max;
    ctx.globalAlpha = clamp(k+.15, 0, 1);
    ctx.fillStyle = p.color;
    if(p.type==="glow"){
      // a soft additive bloom that swells then fades — warm, never a harsh flash (cozy contract)
      const t = p.life/p.max, rad = p.size*(0.55 + t*0.85);
      ctx.globalAlpha = (1-t)*(1-t)*0.5;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      continue;
    }
    if(p.type==="lantern"){
      ctx.fillStyle = "rgba(255,185,90,0.22)"; ctx.fillRect((p.x-2)|0, (p.y-2)|0, 5, 5);
      ctx.fillStyle = "#ffd98a"; ctx.fillRect((p.x-1)|0, (p.y-1)|0, 2, 3);
      ctx.fillStyle = "#fff2c0"; ctx.fillRect(p.x|0, (p.y-1)|0, 1, 1);
    } else if(p.type==="icon"){
      const s = spr[p.spriteName];
      if(s){
        // pop in fast (0.3 → 1.25), then ease back to 1 — a satisfying little "gotcha" flourish
        const sc = p.life < 0.13 ? lerp(0.3, 1.25, easeOutCubic(p.life/0.13))
                                 : lerp(1.25, 1.0, clamp((p.life-0.13)/0.22, 0, 1));
        ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.scale(sc, sc);
        ctx.drawImage(s, -8, -8); ctx.restore();
      }
    } else if(p.type==="star"){
      const s = p.size + (k>.5?1:0);
      ctx.fillRect(p.x-.5, p.y-s/2, 1, s); ctx.fillRect(p.x-s/2, p.y-.5, s, 1);
    } else if(p.type==="leaf"){
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillRect(-1,-1,3,2); ctx.restore();
    } else {
      ctx.fillRect(p.x|0, p.y|0, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(){
  // queued to the high-res overlay so "+1 Corn" reads crisp, not upscaled from 320px
  for(const f of floaters){
    const k = f.life/f.max;
    const alpha = k < .8 ? 1 : 1 - (k-.8)/.2;
    queueText(f.x, f.y, f.text, { color:f.color, size:9, weight:"bold", alpha });
  }
}
