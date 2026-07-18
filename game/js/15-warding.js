"use strict";
/* ============================================================
   15-warding.js — Warding, the sixth skill (v4.0 "The Tenth Door").
   The combat layer: the Undercroft's restless things, the Stave's
   settling swing, the Resolve bar and its zero-cost knockout, the
   Warden's Bell checkpoints, the crafted charms, Tom's salvage
   trickle, and the door-opening story beat.

   Cozy contract (amended for v4, AGENTS.md): nothing is ever taken —
   knockout costs ZERO (wake safe, keep everything). Creatures live
   ONLY in the Undercroft; every pre-v4 space stays hazard-free.

   Loads AFTER 13-content.js so its load-time IIFEs can see QUESTS,
   NPCDEF and NPC_RECOG. The per-frame/per-swing functions here are
   plain declarations — hoisted into the one shared global scope, so
   07-entities (drawCreature), 12-game (updateCreatures) and
   08-actions (staveSwing) resolve them at runtime regardless of order.
   Map navigation (genUndercroft / enterUndercroft / wardUp / wardDown)
   lives in 13-content.js beside the mine, because the MAPS literal
   references genUndercroft at load time.
   ============================================================ */

// ---------------- Resolve — the combat-only bar ----------------
// A place you walk to, not a stat you manage everywhere: Resolve is full on every non-combat map
// and each dawn; it drains ONLY from a restless thing's touch, in the Undercroft. Empty = a soft
// knockout (below): you wake at the door with everything. Energy (farm stamina) is untouched by combat.
function resolveMax(){ return 100 + (charmActive("Warded Charm") ? 5 : 0); }   // Warded Charm lifts the ceiling
function resolveFloor(){ return hasMastery("Warding", 99) ? 10 : 0; }          // ★ Lanternheart — Resolve never falls below 10
function inCombatMap(){ return !!(curMap && curMap.id === "undercroft"); }      // the only place Resolve matters

// ---------------- The restless things — spawn, tick, draw ----------------
// Melancholy nature-spirits, not animals or people. Every attack is TELEGRAPHED (a shimmer/creak,
// CREATURES[kind].tele seconds ≥ 0.5) — the bible's cozy-combat rule; you always get to react. They
// live in curMap.creatures (never curMap.objects), so no pre-v4 code touches them.
function mkCreature(kind, tx, ty, rng){
  const d = CREATURES[kind];
  return { kind, x: tx*TILE+8, y: ty*TILE+8, hp: d.hp, face:"down",
           walk:0, moving:false, state:"idle", stateT:0,
           timer: 0.4 + (rng ? rng() : Math.random())*1.4,
           wvx:0, wvy:0, lvx:0, lvy:0, hurtT:0, warm:0, alive:true, homeFloor: state.wardDepth||1 };
}
function wardWalkable(x, y){   // pixel coords → is this a standable Undercroft floor tile
  if(!curMap) return false;
  const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
  if(tx<1 || ty<1 || tx>=curMap.w-1 || ty>=curMap.h-1) return false;
  if(curMap.tiles[ty*W+tx] !== T.MFLOOR) return false;
  const o = curMap.objects[key(tx,ty)];
  return !o || WALKABLE_OBJ.has(o.kind);
}
function moveCreature(cr, dx, dy){
  let moved = false;
  if(wardWalkable(cr.x+dx, cr.y)){ cr.x += dx; moved = true; }
  if(wardWalkable(cr.x, cr.y+dy)){ cr.y += dy; moved = true; }
  if(Math.abs(dx) > Math.abs(dy)) cr.face = dx<0?"left":"right";
  else if(dy !== 0)               cr.face = dy<0?"up":"down";
  return moved;
}
function wardWander(cr, d, dt){
  cr.timer -= dt;
  if(cr.timer <= 0){
    cr.timer = 0.8 + Math.random()*1.6;
    let a = Math.random()*Math.PI*2;
    if(cr.kind === "wisp" && Math.hypot(state.px-cr.x, state.py-cr.y) < 5*TILE)
      a = Math.atan2(cr.y-state.py, cr.x-state.px) + (Math.random()-0.5);   // shy: drift away from the lantern
    cr.wvx = Math.cos(a); cr.wvy = Math.sin(a);
  }
  const sp = d.speed * (cr.kind==="embermite" ? 1.15 : 0.6) * dt;
  if(moveCreature(cr, cr.wvx*sp, cr.wvy*sp)) cr.moving = true;
  else cr.timer = 0;   // walked into a wall — repick next tick
}
function updateCreatures(dt){
  if(!curMap || !curMap.creatures) return;   // no-op everywhere but the Undercroft
  if(state.iFrame > 0) state.iFrame = Math.max(0, state.iFrame - dt);
  for(const cr of curMap.creatures){
    if(!cr.alive) continue;
    const d = CREATURES[cr.kind];
    cr.hurtT = Math.max(0, (cr.hurtT||0) - dt);
    cr.warm  = Math.max(0, (cr.warm||0) - dt*0.6);
    if(cr.moving) cr.walk += dt*6;
    cr.moving = false;
    cr.stateT -= dt;
    const pdx = state.px - cr.x, pdy = state.py - cr.y, dist = Math.hypot(pdx, pdy);

    if(cr.state === "stunned"){ if(cr.stateT <= 0) cr.state = "idle"; continue; }
    if(cr.state === "telegraph"){
      cr.face = Math.abs(pdx) > Math.abs(pdy) ? (pdx<0?"left":"right") : (pdy<0?"up":"down");
      if(cr.stateT <= 0){   // wind-up done → commit a lunge, direction locked NOW (telegraphed)
        const a = Math.atan2(pdy, pdx); cr.lvx = Math.cos(a); cr.lvy = Math.sin(a);
        cr.state = "lunge"; cr.stateT = cr.kind==="shambler" ? 0.75 : 0.4;
      }
      continue;
    }
    if(cr.state === "lunge"){
      const sp = d.speed * 2.3 * dt;
      moveCreature(cr, cr.lvx*sp, cr.lvy*sp); cr.moving = true;
      if(cr.kind === "embermite") cr.warm = 1;   // leaves a fading warm patch
      if(dist < 11 && state.iFrame <= 0) drainResolve(d.dmg, cr.x, cr.y);
      if(cr.stateT <= 0){ cr.state = "cooldown"; cr.stateT = 1.1; }
      continue;
    }
    if(cr.state === "cooldown"){ wardWander(cr, d, dt); if(cr.stateT <= 0) cr.state = "idle"; continue; }

    // idle → aggro when the player lingers within reach
    const aggro = (cr.kind==="shambler" ? 3.5 : cr.kind==="embermite" ? 2.6 : 3.0) * TILE;
    if(dist < aggro){ cr.state = "telegraph"; cr.stateT = d.tele; }
    else wardWander(cr, d, dt);
  }
}
function drawCreature(cr){
  if(!cr.alive) return;
  const frame = cr.moving ? (Math.floor(cr.walk)%2) : (Math.floor(animT*2)%2);
  const s = spr[cr.kind+"_"+frame]; if(!s) return;
  const w = s.width, h = s.height;
  const bob = cr.kind==="wisp" ? Math.round(Math.sin(animT*3 + cr.x)*1.5)
            : (cr.moving && (Math.floor(cr.walk)%2) ? -1 : 0);
  const dx = Math.round(cr.x - w/2), dy = Math.round(cr.y - h + 2 + bob);
  if(cr.kind !== "wisp"){ ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(cr.x, cr.y+1, w*0.32, 2, 0, 0, 7); ctx.fill(); }
  const tel = cr.state === "telegraph";
  if(tel) ctx.globalAlpha = 0.55 + 0.45*Math.abs(Math.sin(animT*20));   // a bright warning shimmer
  if(cr.face === "left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-w, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
  ctx.globalAlpha = 1;
  if(cr.hurtT > 0){ ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, cr.hurtT*4)})`; ctx.fillRect(dx, dy, w, h); }   // hit flash
  if(tel){ ctx.strokeStyle = "rgba(200,225,255,0.75)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cr.x, cr.y, 10 + Math.sin(animT*20)*2, 0, 7); ctx.stroke(); }   // telegraph ring
}

// ---------------- The Stave's swing — settle a creature, or the stair-knot ----------------
// Called from the Stave branch of useTool (08-actions.js). Generous hitbox (bible §6.5.3): any live
// creature within ~15px of the faced tile is settled; otherwise the stair-knot on that tile takes the hit.
function staveSwing(tx, ty, power){
  const fx = tx*TILE+8, fy = ty*TILE+8;
  let hitAny = false;
  if(curMap.creatures) for(const cr of curMap.creatures){
    if(cr.alive && Math.hypot(cr.x-fx, cr.y-fy) <= 15){ hitCreature(cr, power, fx, fy); hitAny = true; }
  }
  if(hitAny){ cam.shake = 2.2; hitstop = 0.05; return; }
  const o = objAt(tx,ty);
  if(o && o.kind === "knot"){
    o.hp -= power; o.shakeT = 0.2; cam.shake = 2.2; hitstop = 0.05;
    playSfx("staveHit"); pChips(fx, fy, "#4a3c2c", 5);
    if(o.hp <= 0){
      curMap.objects[key(tx,ty)] = { kind:"wardladderdown" };
      addXP("Warding", 12);   // loosening the knot is itself a settle
      playSfx("settle"); pSparkle(fx, fy, "#bfe0ff", 16);
      toast("The knot loosens and falls away — a stair drops into deeper dark.", "#bfe0ff");
      floatText(state.px, state.py-30, "↓ the way down", "#bfe0ff");
    }
    return;
  }
  playSfx("staveHit");   // a soft whiff — the swing still sounds
}
function hitCreature(cr, power, fx, fy){
  cr.hp -= power; cr.hurtT = 0.18; cr.state = "stunned"; cr.stateT = 0.35;
  const a = Math.atan2(cr.y - fy, cr.x - fx);   // knock it ~a tile back off the strike
  const nx = cr.x + Math.cos(a)*10, ny = cr.y + Math.sin(a)*10;
  if(wardWalkable(nx, cr.y)) cr.x = nx;
  if(wardWalkable(cr.x, ny)) cr.y = ny;
  playSfx("staveHit"); pChips(cr.x, cr.y, CREATURES[cr.kind].col2, 5);
  if(cr.hp <= 0) settleCreature(cr);
}
function settleCreature(cr){
  cr.alive = false;
  const d = CREATURES[cr.kind];
  pSparkle(cr.x, cr.y-2, d.col, 16);
  give(d.drop, d.n||1);
  if(d.drop2 && chance(0.5)) give(d.drop2, d.n2||1);
  if(hasMastery("Warding",50) && chance(0.15)) give(d.drop, 1);   // ★ Gloamwise — an extra material now and then
  addXP("Warding", d.xp); bump("warded");
  playSfx("settle");
  floatText(cr.x, cr.y-16, d.name + " settled", d.col);
}

// ---------------- Resolve drain + the zero-cost knockout ----------------
// The whole point of the amended contract: a knockout takes NOTHING. It fades you out, a beat of
// story, and you wake at the Guild door with every item, coin and XP intact. The only cost is the
// wasted run-depth — softened by the Warden's Bells you can ring back down to.
function drainResolve(amt, srcX, srcY){
  if(state.iFrame > 0) return;
  if(hasMastery("Warding",75)) amt = Math.round(amt * 0.7);   // ★ Unshaken — the dark's touch costs less
  const fl = resolveFloor();
  state.resolve = Math.max(fl, (state.resolve||0) - amt);
  state.iFrame = 0.85;   // brief invulnerability so a swarm can't chain-drain you
  const a = Math.atan2(state.py - srcY, state.px - srcX);   // knock the player clear
  const kx = state.px + Math.cos(a)*12, ky = state.py + Math.sin(a)*12;
  if(wardWalkable(kx, state.py)) state.px = kx;
  if(wardWalkable(state.px, ky)) state.py = ky;
  cam.shake = 3.2; hitstop = 0.04;
  pSparkle(state.px, state.py-8, "#dcd6ff", 8);
  floatText(state.px, state.py-24, "−" + amt + " resolve", "#cfc4ff");
  refreshHUD();
  if(state.resolve <= fl && fl === 0) wardKnockout();
}
let _wardKOing = false;   // transient guard (module-level, resets on page load) against a double knockout
function wardKnockout(){
  if(_wardKOing) return;
  _wardKOing = true;
  bump("knockouts");
  playSfx("knockout");
  // Snapshot for the contract test / audit: knockout must diff inventory+gold+XP to zero.
  startCutscene([
    { type:"fade", on:true, then:()=>{ state.resolve = resolveMax(); clearMapCache(); setMap("guild", 15*TILE+8, 2*TILE, "down"); } },
    { type:"wait", t:0.5 },
    { type:"fade", on:false },
    { type:"say", who:"", portrait:"port_valley", text:"The lantern-bearers found you before the dark had a chance to. They always do — that is the whole reason for the bells." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Back at the door, and everything you carried is still yours — down to the last coin. Sit a while. The Undercroft keeps; it has kept for eleven years." },
    { type:"run", fn:()=>{ _wardKOing = false; state.resolve = resolveMax(); saveGame(); } },
  ]);
}
