"use strict";
/* ============================================================
   07-entities.js — player, NPC drawing, and the world renderer.
   Works across any map via curMap.
   ============================================================ */

let walkCycle = 0, moving = false, swingT = 0;
let renderSeason = "Spring";
let touchDir = {x:0,y:0};
// states: idle → wait (cast) → bite (the !) → reel (the minigame)
let fishing = { state:"idle", t:0, biteWin:0, bx:0, by:0,
  fish:null, fishY:0.5, fishV:0, fishTarget:0.5, fishTimer:0,
  barY:0.42, barV:0, barH:0.26, prog:0.36, diff:1, outT:0 };
let fishHold = false;                  // Space / mouse / USE held during the reel minigame
let stepTimer = 0;

function facingTile(){
  let tx = Math.floor(state.px/TILE), ty = Math.floor(state.py/TILE);
  if(state.face === "up") ty--; else if(state.face === "down") ty++;
  else if(state.face === "left") tx--; else tx++;
  return [tx, ty];
}
function triggerSwing(){ swingT = 0.26; }

// Slip the player a hair perpendicular when they're pressing straight into a corner and a small
// slide would clear the wall — the forward move was already found blocked by the caller. Probes only
// a few px out (no long-range drift), and never moves into a blocked cell.
function cornerNudge(horiz, dir, sp){
  const step = Math.min(sp, 1.4), reach = 5;
  if(horiz){
    const fx = state.px + Math.sign(dir)*sp;          // where the blocked forward move wanted to land
    for(let o = step; o <= reach; o += step) for(const s of [-1, 1])
      if(!blockedAt(fx, state.py + s*o) && !blockedAt(state.px, state.py + s*step)){
        state.py = clamp(state.py + s*step, 8, curMap.h*TILE-3); return;
      }
  } else {
    const fy = state.py + Math.sign(dir)*sp;
    for(let o = step; o <= reach; o += step) for(const s of [-1, 1])
      if(!blockedAt(state.px + s*o, fy) && !blockedAt(state.px + s*step, state.py)){
        state.px = clamp(state.px + s*step, 5, curMap.w*TILE-5); return;
      }
  }
}
function updatePlayer(dt){
  if(swingT > 0) swingT -= dt;
  if(gameMode !== "play" || paused || uiBlocking() || fishing.state !== "idle"){ moving = false; return; }

  let dx = 0, dy = 0;
  if(keys.w || keys.arrowup) dy -= 1;
  if(keys.s || keys.arrowdown) dy += 1;
  if(keys.a || keys.arrowleft) dx -= 1;
  if(keys.d || keys.arrowright) dx += 1;
  dx += touchDir.x; dy += touchDir.y;
  dx = clamp(dx,-1,1); dy = clamp(dy,-1,1);

  moving = (dx !== 0 || dy !== 0);
  if(!moving){ walkCycle = 0; return; }

  if(dy < 0) state.face = "up"; else if(dy > 0) state.face = "down";
  if(dx < 0) state.face = "left"; else if(dx > 0) state.face = "right";

  const len = Math.hypot(dx,dy) || 1;
  const sp = 68 * dt;
  const nx = state.px + dx/len*sp, ny = state.py + dy/len*sp;
  const okX = !blockedAt(nx, state.py), okY = !blockedAt(state.px, ny);
  if(okX) state.px = clamp(nx, 5, curMap.w*TILE-5);
  if(okY) state.py = clamp(ny, 8, curMap.h*TILE-3);
  // Corner nudging (Celeste's forgiveness): pressing straight into a corner, if a few-pixel slip to
  // one side would clear the wall, ease that way so you round corners and slip through gaps without
  // pixel-perfect aim. Only on a pure-axis press whose forward move was blocked; every write is
  // collision-checked, so it can never push you through a wall, and it self-terminates once clear.
  if(!okX && dx !== 0 && dy === 0) cornerNudge(true,  dx, sp);
  else if(!okY && dy !== 0 && dx === 0) cornerNudge(false, dy, sp);

  walkCycle += dt * 8;
  stepTimer -= dt;
  if(stepTimer <= 0){
    stepTimer = 0.30; playSfx("step");
    const gt = tileAt(Math.floor(state.px/TILE), Math.floor(state.py/TILE));
    if(gt===T.TILLED||gt===T.WATERED||gt===T.DIRT||gt===T.PATH||gt===T.SAND) pPuff(state.px, state.py+2, "#c7ac7a", 2);
  }

  // auto-warps (doormats, beach path)
  const w = warpAt(Math.floor(state.px/TILE), Math.floor(state.py/TILE));
  if(w && w.auto && !_traveling) doWarp(w);
}

// ---- character drawing ----
function poseFor(cycle, mov, swinging){
  if(swinging) return 3;
  return mov ? [0,1,0,2][Math.floor(cycle)%4] : 0;
}
function drawChar(name, x, y, face, pose, yoff=0){
  const f = (face==="left"||face==="right") ? "side" : face;
  const s = spr[name+"_"+f+"_"+pose];
  if(!s) return;
  const dx = Math.round(x-8), dy = Math.round(y-21+yoff);
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y+1), 6, 2.4, 0, 0, 7); ctx.fill();
  if(face === "left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-16, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
}
function bobFor(walk, mov){
  const p = poseFor(walk, mov, false);
  return mov ? ((p===1||p===2)?-1:0) : (Math.sin(animT*2.5)>0.55?-1:0);
}
function drawPrompt(cx, cy){
  const y = cy + Math.sin(animT*4)*1.2;
  ctx.fillStyle = "rgba(20,15,10,0.85)"; ctx.fillRect(cx-5, y-6, 10, 9);
  ctx.fillStyle = "#ffce5a"; ctx.fillRect(cx-5, y-6, 10, 1);
  queueText(cx, y+1.5, "E", { color:"#ffe6a0", size:8, weight:"bold", shadow:null });
}
const INTERACT_KINDS = new Set(["campfire","stove","counter","stall","shipbin","sign","berrybush","frostberry","wrack","chest","noticeboard","fruittree","beehive",
  "ledger","railcart","boardwalk","fountain",
  "bed","ladderup","ladderdown","mineentrance","shellnode","coralnode","seaweednode","sealeddoor","desk","memorial",
  "waystone","westtrail","easttrail","deadfall","hearttree","lift","olddoor","keg","jar"]);
function facingInteractable(fx, fy){
  const w = warpAt(fx,fy); if(w && !w.auto) return true;
  const crop = curMap.crops[key(fx,fy)];
  if(crop) return crop.days >= CROPS[crop.type].days;
  const o = objAt(fx,fy);
  return !!(o && INTERACT_KINDS.has(o.kind));
}
function toolActValid(fx, fy){
  const tool = HOTBAR[slotSel] && HOTBAR[slotSel].tool;
  const tt = tileAt(fx,fy), o = objAt(fx,fy), k = key(fx,fy);
  if(tool==="Hoe")   return !o && TILLABLE.has(tt);
  if(tool==="Can")   return tt===T.TILLED;
  if(tool==="Seeds") return (tt===T.TILLED||tt===T.WATERED) && !curMap.crops[k];
  if(tool==="Axe")   return !!(o && (TREES[o.kind] || o.kind==="deadfall" || o.kind==="ancient"));
  if(tool==="Pick")  return !!(o && (ORES[o.kind] || o.kind==="gemrock" || o.kind==="crystal"));
  if(tool==="Rod")   return tt===T.WATER;
  return false;
}
function drawHeldTool(x, y, face){
  if(swingT <= 0) return;
  const tool = HOTBAR[slotSel] && HOTBAR[slotSel].tool;
  const s = spr["tool_"+TOOL_ICON[tool]]; if(!s) return;
  const p = 1 - swingT/0.26, arc = Math.sin(p*Math.PI);
  let ox = 0, oy = -6 - arc*4;
  if(face==="right") ox = 6; else if(face==="left") ox = -6; else if(face==="down") oy = -2 - arc*3;
  ctx.save(); ctx.translate(Math.round(x+ox), Math.round(y-10+oy));
  ctx.rotate((face==="left"?-1:1) * (0.6 - arc*0.9));
  ctx.drawImage(s, -8, -8); ctx.restore();
}

// ---- the renderer ----
// Windows are procedural: any upper-facade WALL tile (a WALL with another WALL below it) gets one
// on a fixed spacing. This replaces a hardcoded two-window set that left every OTHER building in
// the valley blank-faced — and the spacing rule reproduces those two cottage windows exactly, so
// nothing moved. Windows glow at night (nf > 0.4), which is most of why they exist: a lived-in town.
function isWindowTile(x, y){
  return tileAt(x, y+1) === T.WALL && (x*5 + y*3) % 3 === 0;
}
function computeCam(shx, shy){
  const mw = curMap.w*TILE, mh = curMap.h*TILE;
  cam.x = mw <= VIEW_W ? Math.round((mw-VIEW_W)/2) : clamp(state.px - VIEW_W/2, 0, mw - VIEW_W);
  cam.y = mh <= VIEW_H ? Math.round((mh-VIEW_H)/2) : clamp(state.py - VIEW_H/2, 0, mh - VIEW_H);
}
function renderWorld(){
  if(!curMap) return;
  let shx = 0, shy = 0;
  if(cam.shake > 0){ shx = rand(-cam.shake,cam.shake); shy = rand(-cam.shake,cam.shake); cam.shake = Math.max(0, cam.shake - 30/60); }
  computeCam();

  ctx.fillStyle = curMap.bg || "#0b0a0f"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  ctx.save();
  ctx.translate(Math.round(-cam.x+shx), Math.round(-cam.y+shy));

  const x0 = Math.max(0, Math.floor(cam.x/TILE)-1), y0 = Math.max(0, Math.floor(cam.y/TILE)-1);
  const x1 = Math.min(curMap.w-1, x0 + VW + 3), y1 = Math.min(curMap.h-1, y0 + VH + 3);
  const nf = nightFactor(curHour());
  renderSeason = curSeason();

  for(let y=y0; y<=y1; y++) for(let x=x0; x<=x1; x++){
    const tt = curMap.tiles[y*W+x];
    if(tt !== T.VOID) drawGroundTile(x, y, tt, nf);
  }

  // crops
  for(const k in curMap.crops){
    const [cx,cy] = k.split(",").map(Number);
    if(cx<x0||cx>x1||cy<y0||cy>y1) continue;
    const c = curMap.crops[k], cfg = CROPS[c.type];
    let stage = Math.min(3, Math.floor(c.days / cfg.days * 3)); if(c.days >= cfg.days) stage = 3;
    const sway = Math.sin(animT*2 + cx*1.3 + cy) * (stage>=2?0.8:0.3);
    ctx.save(); ctx.translate(cx*TILE+8+sway, cy*TILE+16); ctx.drawImage(spr["crop_"+c.type+"_"+stage], -8, -16); ctx.restore();
    if(c.days >= cfg.days && Math.floor(animT*3)%2) px(ctx, cx*TILE+11, cy*TILE+1, 2, 2, "#fff6b0");
  }

  // depth-sorted entities
  const ents = [];
  for(const k in curMap.objects){
    const [ox,oy] = k.split(",").map(Number);
    if(ox<x0-1||ox>x1+1||oy<y0-1||oy>y1+2) continue;
    const o = curMap.objects[k];
    ents.push({ y: oy*TILE + 16, draw: () => drawObject(ox, oy, o, k) });
  }
  ents.push({ y: state.py, draw: () => {
    const p = poseFor(walkCycle, moving, swingT>0);
    let bob = 0;
    if(swingT<=0){ if(moving) bob = (p===1||p===2)?-1:0; else if(fishing.state==="idle") bob = Math.sin(animT*2.5)>0.55?-1:0; }
    drawChar("player", state.px, state.py, state.face, p, bob);
    drawHeldTool(state.px, state.py, state.face);
  }});
  for(const n of curMap.npcs){
    ents.push({ y: n.y, draw: () => {
      drawChar(NPCDEF[n.id].spr, n.x, n.y, n.face, poseFor(n.walk, n.moving, false), bobFor(n.walk, n.moving));
      nameTag(NPCDEF[n.id].name, n.x, n.y);
      // the story's thread: a gold ✦ bobs over whoever the main quest needs right now, so the
      // mission is never lost in the day's chores (owner: "the main mission doesn't shine through")
      if(typeof storyMarkerNpc === "function" && storyMarkerNpc() === n.id){
        const bobM = Math.sin(animT*3)*1.6;
        queueText(n.x, n.y - 30 + bobM, "✦", { color:"#ffce5a", size:12, weight:"bold" });
      }
    }});
  }
  for(const a of curMap.animals) ents.push({ y: a.y, draw: () => a.species==="cow" ? drawCow(a) : a.species==="sheep" ? drawSheep(a) : drawChicken(a) });
  ents.sort((a,b) => a.y - b.y).forEach(e => e.draw());

  // facing cursor + prompts
  if(!uiBlocking() && fishing.state==="idle" && gameMode==="play" && !isCutscene()){
    const [fx,fy] = facingTile();
    ctx.strokeStyle = toolActValid(fx,fy) ? "rgba(150,255,150,0.7)" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1; ctx.strokeRect(fx*TILE+0.5, fy*TILE+0.5, TILE-1, TILE-1);
    if(facingInteractable(fx,fy)) drawPrompt(fx*TILE+8, fy*TILE-6);
    else { const n = nearestNpc(24); if(n) drawPrompt(n.x, n.y-28);
      else { const a = nearestAnimal(20); if(a) drawPrompt(a.x, a.y-18); } }
  }

  // fishing bobber — it thrashes while something is on the line
  if(fishing.state !== "idle"){
    const fight = fishing.state === "reel" ? clamp(Math.abs(fishing.fishV)*2.2, 0, 2.5) : 0;
    const bx = fishing.bx*TILE+8 + Math.sin(animT*23)*fight;
    const by = fishing.by*TILE+8 + Math.sin(animT*5)*1.5 + fight*0.6;
    ctx.fillStyle = "#e8e8e8"; ctx.fillRect(bx-1, by-2, 2, 4);
    ctx.fillStyle = "#c03030"; ctx.fillRect(bx-1, by-2, 2, 2);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(bx, by+2, 3+Math.sin(animT*4)*1.5, 0, 7); ctx.stroke();
    if(fishing.state === "bite"){ queueText(state.px, state.py-24, "!", { color:"#ffd75a", size:13, weight:"bold" }); }
  }

  drawParticles(); drawFloaters();
  ctx.restore();

  drawLighting(cam.x - shx, cam.y - shy);
  drawWeather();
  drawReelBar();
  flushText(cam.x - shx, cam.y - shy);   // stamp all queued text crisp, matching the shaken world origin
}

/* ---- the reel-in minigame overlay (screen space, so it ignores the camera) ---- */
function drawReelBar(){
  if(fishing.state !== "reel" || !fishing.fish) return;
  const F = fishing;
  const x = VIEW_W - 44, y = 30, w = 16, h = 140;

  ctx.fillStyle = "rgba(18,14,11,0.86)"; ctx.fillRect(x-7, y-11, w+30, h+18);
  ctx.strokeStyle = "#8a6647"; ctx.lineWidth = 1;
  ctx.strokeRect(x-6.5, y-10.5, w+29, h+17);

  const water = ctx.createLinearGradient(0, y, 0, y+h);
  water.addColorStop(0, "#3f7096"); water.addColorStop(1, "#1a3350");
  ctx.fillStyle = water; ctx.fillRect(x, y, w, h);

  // the stretch of line you're holding
  const bY = y + F.barY*h, bH = F.barH*h;
  const inside = F.fishY >= F.barY && F.fishY <= F.barY + F.barH;
  ctx.fillStyle   = inside ? "rgba(150,235,120,0.42)" : "rgba(150,235,120,0.18)";
  ctx.fillRect(x, bY, w, bH);
  ctx.strokeStyle = inside ? "#c6ff8a" : "#6f9460";
  ctx.strokeRect(x+0.5, bY+0.5, w-1, bH-1);

  const s = spr["item_" + F.fish.name];
  if(s) ctx.drawImage(s, Math.round(x + w/2 - 8), Math.round(y + F.fishY*h - 8));

  // tension meter — empty it and the fish is gone
  const mx = x + w + 4, ph = F.prog*h;
  ctx.fillStyle = "#241a14"; ctx.fillRect(mx, y, 6, h);
  ctx.fillStyle = F.prog > 0.66 ? "#8fd06a" : F.prog > 0.3 ? "#ffce5a" : "#ff7d7a";
  ctx.fillRect(mx, y + h - ph, 6, ph);
  ctx.strokeStyle = "#8a6647"; ctx.strokeRect(mx+0.5, y+0.5, 5, h-1);

  queueText(x + w/2, y - 2, "HOLD", { color:(keys[" "] || fishHold) ? "#ffe6a0" : "#8a7a66", size:9, weight:"bold", screen:true });
}

function nameTag(text, x, y){
  queueText(x, y-24, text, { color:"#ffe6a0", size:8 });
}
function drawChicken(a){
  const frame = a.moving ? (Math.floor(a.walk)%2) : (Math.floor(animT*2)%2);
  const s = spr["chicken_"+frame];
  const bob = (a.moving && (Math.floor(a.walk)%2)) ? -1 : 0;
  const dx = Math.round(a.x-8), dy = Math.round(a.y-13+bob);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(a.x, a.y+1, 4, 1.5, 0, 0, 7); ctx.fill();
  if(a.face==="left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-16, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
  if(a.ref.eggDay !== state.day){                       // egg-ready sparkle
    const ey = a.y-17 + Math.sin(animT*4);
    ctx.fillStyle = "#fff6e0"; ctx.fillRect(a.x-1, ey, 2, 3); ctx.fillStyle = "#e0d4bc"; ctx.fillRect(a.x-1, ey+2, 2, 1);
  }
}

function drawCow(a){
  const frame = a.moving ? (Math.floor(a.walk)%2) : 0;
  const s = spr["cow_"+frame];
  const bob = (!a.moving && Math.sin(animT*1.6) > 0.7) ? -1 : 0;   // slow, sleepy breathing
  const dx = Math.round(a.x-10), dy = Math.round(a.y-15+bob);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(a.x, a.y+1, 7, 2, 0, 0, 7); ctx.fill();
  if(a.face==="left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-20, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
  if(a.ref.milkDay !== state.day){                      // milk-ready hint
    const my = a.y-20 + Math.sin(animT*4);
    ctx.fillStyle = "#f4f8fb"; ctx.fillRect(a.x-2, my, 4, 5);
    ctx.fillStyle = "#5a9ad0"; ctx.fillRect(a.x-2, my+3, 4, 1);
    ctx.fillStyle = "#e8e8e8"; ctx.fillRect(a.x-1, my-1, 2, 1);
  }
}
// a near-clone of drawCow — same anchors and calm breathing bob; a fleece puff floats when the
// coat is ready to shear (woolReady, 13-content.js), so the pull to visit is visible from afar.
function drawSheep(a){
  const frame = a.moving ? (Math.floor(a.walk)%2) : 0;
  const s = spr["sheep_"+frame];
  const bob = (!a.moving && Math.sin(animT*1.6) > 0.7) ? -1 : 0;
  const dx = Math.round(a.x-10), dy = Math.round(a.y-15+bob);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(a.x, a.y+1, 7, 2, 0, 0, 7); ctx.fill();
  if(a.face==="left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-20, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
  if(typeof woolReady === "function" && woolReady(a.ref)){   // wool-ready hint: a little fleece puff
    const wy = a.y-20 + Math.sin(animT*4);
    ctx.fillStyle = "#f6f6fa"; ctx.fillRect(a.x-2, wy, 4, 4);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(a.x-1, wy-1, 2, 1);
    ctx.fillStyle = "#dcdce4"; ctx.fillRect(a.x-2, wy+3, 4, 1);
  }
}

// Shoreline dressing: the coast used to meet the grass and the sea in hard 90° tile edges. These
// overlays read the four neighbours and soften the seams — wet sand along the waterline, a broken
// foam line on the water side, grass tufts creeping onto the sand. All deterministic in (x,y) so
// the shore doesn't shimmer; only the foam breathes (a slow two-phase shift).
function shorelineEdges(x, y, pred){
  return { n:pred(tileAt(x,y-1)), s:pred(tileAt(x,y+1)), w:pred(tileAt(x-1,y)), e:pred(tileAt(x+1,y)) };
}
const GRASS_LIKE = new Set([T.GRASS, T.FLOWERGRASS, T.TALLGRASS]);
const FRINGE_GREEN = { Spring:"#5aa54e", Summer:"#4f9a44", Fall:"#93913f", Winter:"#d7dfe4" };
function drawSandDressing(x, y, bx, by){
  const wet = shorelineEdges(x, y, t => t===T.WATER);
  if(wet.n || wet.s || wet.w || wet.e){
    ctx.fillStyle = "#c4ab74";                                     // damp band
    if(wet.n) ctx.fillRect(bx, by, TILE, 3);
    if(wet.s) ctx.fillRect(bx, by+TILE-3, TILE, 3);
    if(wet.w) ctx.fillRect(bx, by, 3, TILE);
    if(wet.e) ctx.fillRect(bx+TILE-3, by, 3, TILE);
    ctx.fillStyle = "#a98f60";                                     // the dark waterline itself
    if(wet.n) ctx.fillRect(bx, by, TILE, 1);
    if(wet.s) ctx.fillRect(bx, by+TILE-1, TILE, 1);
    if(wet.w) ctx.fillRect(bx, by, 1, TILE);
    if(wet.e) ctx.fillRect(bx+TILE-1, by, 1, TILE);
  }
  const gr = shorelineEdges(x, y, t => GRASS_LIKE.has(t));
  if(gr.n || gr.s || gr.w || gr.e){
    ctx.fillStyle = FRINGE_GREEN[renderSeason] || FRINGE_GREEN.Spring;
    const h = (x*31 + y*17) & 7;                                   // stagger tufts per tile
    for(let i=0;i<3;i++){
      const o = 2 + ((h+i*5) % 11);                                // 2..12 along the edge
      if(gr.n) ctx.fillRect(bx+o, by,        2, 1+((h+i)&1));
      if(gr.s) ctx.fillRect(bx+o, by+TILE-2+((h+i)&1), 2, 2-((h+i)&1));
      if(gr.w) ctx.fillRect(bx,        by+o, 1+((h+i)&1), 2);
      if(gr.e) ctx.fillRect(bx+TILE-2+((h+i)&1), by+o, 2-((h+i)&1), 2);
    }
  }
}
function drawWaterFoam(x, y, bx, by){
  if(renderSeason === "Winter") return;                            // frozen — the ice overlay owns the look
  const sh = shorelineEdges(x, y, t => t===T.SAND || GRASS_LIKE.has(t));
  if(!(sh.n || sh.s || sh.w || sh.e)) return;
  const phase = (Math.floor(animT*1.25) + x + y) & 1;              // slow breath, offset per tile
  ctx.fillStyle = "rgba(226,242,244,0.85)";
  const h = (x*13 + y*29) & 3;
  for(let i=0;i<3;i++){
    const o = 1 + ((h + i*5 + phase*2) % 12);                      // broken dashes, drifting slightly
    if(sh.n) ctx.fillRect(bx+o, by,        3, 1);
    if(sh.s) ctx.fillRect(bx+o, by+TILE-1, 3, 1);
    if(sh.w) ctx.fillRect(bx,        by+o, 1, 3);
    if(sh.e) ctx.fillRect(bx+TILE-1, by+o, 1, 3);
  }
}

function drawGroundTile(x, y, tt, nf){
  const bx = x*TILE, by = y*TILE;
  switch(tt){
    case T.GRASS: { const gv=(x*7+y*13)&3; ctx.drawImage(spr["grass_"+renderSeason+gv], bx, by); break; }
    case T.FLOWERGRASS: ctx.drawImage(spr["flowergrass_"+renderSeason], bx, by); break;
    case T.TALLGRASS: ctx.drawImage(spr["tallgrass_"+renderSeason], bx, by); break;
    case T.DIRT: ctx.drawImage(spr.dirt, bx, by); break;
    case T.TILLED: ctx.drawImage(spr.tilled, bx, by); break;
    case T.WATERED: ctx.drawImage(spr.watered, bx, by); break;
    case T.WATER: { const f=(Math.floor(animT*3)+((x+y)%3))%3; ctx.drawImage(spr["water"+f], bx, by);
      if(renderSeason==="Winter") ctx.drawImage(spr.ice, bx, by);
      drawWaterFoam(x, y, bx, by); break; }
    case T.SAND: ctx.drawImage(spr.sand, bx, by); drawSandDressing(x, y, bx, by); break;
    case T.PATH: { const pv=(x*5+y*3)&1; ctx.drawImage(spr["path"+pv], bx, by); break; }
    case T.BRIDGE: ctx.drawImage(spr.bridge, bx, by); break;
    case T.WALL: { if(isWindowTile(x,y)) ctx.drawImage(nf>0.4 ? spr.wall_win_lit : spr.wall_win, bx, by);
      else ctx.drawImage(spr.wall, bx, by); break; }
    case T.ROOF: ctx.drawImage(tileAt(x,y-1)!==T.ROOF ? spr.roof_top : spr.roof, bx, by); break;
    case T.DOOR: ctx.drawImage(spr.door, bx, by); break;
    case T.FLOOR: ctx.drawImage(spr.floor, bx, by); break;
    case T.RUG: ctx.drawImage(spr.rug, bx, by); break;
    case T.CARPET: ctx.drawImage(spr.carpet, bx, by); break;
    case T.PLANK: ctx.drawImage(spr.plank, bx, by); break;
    case T.HAY: ctx.drawImage(spr.coopfloor, bx, by); break;
    case T.IFLOOR: ctx.drawImage(spr.ifloor, bx, by); break;
    case T.IWALL: ctx.drawImage(tileAt(x,y-1)!==T.IWALL ? spr.iwall_top : spr.iwall, bx, by); break;
    case T.MFLOOR: { ctx.drawImage(((x*3+y*5)&3)===0 ? spr.mfloor2 : spr.mfloor, bx, by); break; }
    case T.MWALL: ctx.drawImage(spr.mwall, bx, by); break;
    case T.LADDER: ctx.drawImage(spr.ladder, bx, by); break;
    case T.BED: ctx.drawImage(spr.floor, bx, by); ctx.drawImage(spr.bed, bx, by); break;
    default: break;
  }
}

const TALL = new Set(["oak","pine","maple","bookshelf","lamp","fireplace","banner","sealeddoor","palm","mineentrance","lift","olddoor"]);
function drawObject(ox, oy, o, k){
  const bx = ox*TILE, by = oy*TILE;
  let sway = 0;
  if(o.shakeT > 0){ o.shakeT -= 1/60; sway = Math.sin(animT*60)*1.6; }

  if(TREES[o.kind]){
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(bx+8, by+15, 7, 2.6, 0, 0, 7); ctx.fill();
    const tsway = Math.sin(animT*1.3 + ox*1.7)*0.6 + sway;
    ctx.drawImage(spr[o.kind+"_"+renderSeason] || spr[o.kind], Math.round(bx-2+tsway), by-16); return;
  }
  if(ORES[o.kind]){
    const cracked = o.hp <= Math.ceil(ORES[o.kind].hp/2);
    ctx.drawImage(spr[cracked ? o.kind+"_cracked" : o.kind], Math.round(bx+sway), by); return;
  }
  if(o.kind==="gemrock" || o.kind==="crystal"){
    ctx.drawImage(spr[o.kind], Math.round(bx+sway), by);
    if(chance(0.04)) pSparkle(bx+8, by+7, o.kind==="crystal"?"#8fd3ff":"#c8a0f0", 2); return;
  }
  if(o.kind==="campfire"){ const f=Math.floor(animT*8)%2; ctx.drawImage(spr["campfire"+f], bx, by-1); if(chance(0.3)) pEmber(bx+8, by+4); return; }
  if(o.kind==="torch"){ ctx.drawImage(spr.torch, bx, by); if(chance(0.25)) pEmber(bx+8, by+3); return; }
  if(o.kind==="wing"){ const lit = wingLit(o.wing); ctx.drawImage(lit ? spr.wingsconce_lit : spr.wingsconce_dark, bx, by);
    if(lit && chance(0.12)) pEmber(bx+8, by+3); return; }
  // an orchard tree tells you its age and its season at a glance
  if(o.kind==="fruittree"){
    const t = FRUIT_TREES[o.type]; if(!t) return;
    const age = o.age||0;
    let s;
    if(age < 8) s = spr["sapling_"+o.type];
    else if(age < TREE_MATURE_DAYS) s = spr["tree_"+o.type+"_young"];
    else if(renderSeason === "Winter") s = spr["tree_"+o.type+"_bare"];
    else if(o.fruit > 0) s = spr["tree_"+o.type+"_full"];
    else s = spr["tree_"+o.type+"_young"];
    if(!s) return;
    if(s.height > 16){ ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(bx+8, by+15, 6, 2.2, 0, 0, 7); ctx.fill(); }
    ctx.drawImage(s, Math.round(bx+sway), by-(s.height-16));
    if(o.fruit > 0 && chance(0.02)) pSparkle(bx+8, by-6, t.pal[2], 1);
    return;
  }
  if(o.kind==="beehive"){
    const s = spr.beehive;
    ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(bx+8, by+15, 5, 2, 0, 0, 7); ctx.fill();
    ctx.drawImage(s, bx, by-(s.height-16));
    if(o.honey > 0 && chance(0.04)) pSparkle(bx+8, by-4, "#ffd75a", 1);
    if(chance(0.05)){ const a = animT*3 + bx;                     // a bee, doing its rounds
      ctx.fillStyle="#ffd75a"; ctx.fillRect(bx+8+Math.cos(a)*7|0, by-2+Math.sin(a*1.7)*5|0, 1, 1); }
    return;
  }
  if(o.kind==="memorial"){ ctx.drawImage(spr.memorial, bx, by-4); if(chance(0.03)) pEmber(bx+2, by+8); return; }
  if(o.kind==="lantern"){ ctx.drawImage(spr.lantern, bx, by); if(chance(0.05)) pEmber(bx+8, by+6); return; }
  if(o.kind==="stove" || o.kind==="fireplace"){ const s=spr[o.kind]; ctx.drawImage(s, bx, by-(s.height-16)); if(chance(0.12)) pEmber(bx+8, by+ (o.kind==="fireplace"?-2:4)); return; }
  if(o.kind==="stall"){ ctx.drawImage(spr.stall, bx-4, by-8); return; }
  if(o.kind==="ladderup" || o.kind==="ladderdown"){
    ctx.drawImage(spr.ladder, bx, by);
    queueText(bx+8, by+9, o.kind==="ladderup"?"▲":"▼", { color:"#ffce5a", size:8 });
    return;
  }
  if(o.kind==="waystone"){
    const lit = o.ws==="way1" || (state.waystones||[]).includes(o.ws);
    const s = spr[lit ? "waystone_lit" : "waystone"];
    ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(bx+8, by+15, 6, 2.2, 0, 0, 7); ctx.fill();
    ctx.drawImage(s, bx, by-(s.height-16));
    if(lit && chance(0.04)) pSparkle(bx+8, by, "#8fe8c8", 1);
    return;
  }
  if(o.kind==="hearttree" && chance(0.03)) pSparkle(bx+8+((Math.random()*10)|0)-5, by-10, "#8fe8c8", 1);
  if(o.kind==="ancient" && chance(0.03)) pSparkle(bx+8+((Math.random()*10)|0)-5, by-8, "#ffd75a", 1);
  const s = spr[o.kind]; if(!s) return;
  const dw = s.width, dh = s.height;
  if(dh > 16){ ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(bx+8, by+15, 6, 2.2, 0, 0, 7); ctx.fill(); }
  ctx.drawImage(s, Math.round(bx-(dw-16)/2+sway), by-(dh-16));
}
