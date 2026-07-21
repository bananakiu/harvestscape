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
function resolveMax(){ return 100 + (charmActive("Warded Charm") ? 5 : 0) + (charmActive("Wardstone Charm") ? 10 : 0) + (charmActive("Starward Charm") ? 15 : 0); }   // charms lift the ceiling (one worn at a time)
function resolveFloor(){ return hasMastery("Warding", 99) ? 10 : 0; }          // ★ Lanternheart — Resolve never falls below 10
function inCombatMap(){ return !!(curMap && curMap.id === "undercroft"); }      // the only place Resolve matters

// ---------------- The restless things — spawn, tick, draw ----------------
// Melancholy nature-spirits, not animals or people. Every attack is TELEGRAPHED (a shimmer/creak,
// CREATURES[kind].tele seconds ≥ 0.5) — the bible's cozy-combat rule; you always get to react. They
// live in curMap.creatures (never curMap.objects), so no pre-v4 code touches them.
function mkCreature(kind, tx, ty, rng){
  const d = CREATURES[kind];
  const x = tx*TILE+8, y = ty*TILE+8;
  return { kind, x, y, hp: d.hp, face:"down",
           walk:0, moving:false, state:"idle", stateT:0,
           timer: 0.4 + (rng ? rng() : Math.random())*1.4,
           wvx:0, wvy:0, lvx:0, lvy:0, hurtT:0, warm:0, alive:true, homeFloor: state.wardDepth||1,
           rx:x, ry:y, phase:0, split:false, ringT:0 };   // v4.1: rx/ry = boss root; phase = boss move; split = tangle; ringT = slam ring anim
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
    cr.hpBarT = Math.max(0, (cr.hpBarT||0) - dt);   // v4.0.3: health bar/nameplate linger after a hit
    cr.ringT = Math.max(0, (cr.ringT||0) - dt);
    if(cr.moving) cr.walk += dt*6;
    cr.moving = false;
    cr.stateT -= dt;
    const pdx = state.px - cr.x, pdy = state.py - cr.y, dist = Math.hypot(pdx, pdy);

    // v4.1 the Great Knot — a rooted boss with two telegraphed moves (a ground-slam ring + a reaching lunge).
    if(d.boss){ updateGreatKnot(cr, d, dt, pdx, pdy, dist); continue; }
    // v4.1 the Hollow Warden turns to keep its guarded FRONT toward you — but SLOWLY (a turn-lag), so
    // you can circle to its side or back faster than it re-faces. Its guard (frontalHit) tests against
    // your ACTUAL position, so this lag is exactly what makes the "circle it" gimmick both real and beatable.
    if(d.block && dist < 4.5*TILE && cr.state !== "lunge"){
      cr.turnT = (cr.turnT||0) - dt;
      if(cr.turnT <= 0){ cr.face = Math.abs(pdx) > Math.abs(pdy) ? (pdx<0?"left":"right") : (pdy<0?"up":"down"); cr.turnT = 0.55; }
    }

    if(cr.state === "stunned"){ if(cr.stateT <= 0) cr.state = "idle"; continue; }
    if(cr.state === "telegraph"){
      if(!d.block) cr.face = Math.abs(pdx) > Math.abs(pdy) ? (pdx<0?"left":"right") : (pdy<0?"up":"down");   // the Warden keeps its lagged guard even winding up
      if(cr.stateT <= 0){   // wind-up done → commit, direction locked NOW (telegraphed)
        if(d.ranged){ fireStarBolt(cr); cr.state = "cooldown"; cr.stateT = 1.4; }   // v4.2 Star-Gnarl LOBS a bolt (no melee)
        else { const a = Math.atan2(pdy, pdx); cr.lvx = Math.cos(a); cr.lvy = Math.sin(a);
          cr.state = "lunge"; cr.stateT = cr.kind==="shambler" ? 0.75 : d.charger ? 0.95 : 0.4; }   // the Deep Knot charges longer + farther
      }
      continue;
    }
    if(cr.state === "lunge"){
      const sp = d.speed * (d.charger ? 3.4 : 2.3) * dt;
      const ox = cr.x, oy = cr.y;   // measure ACTUAL displacement — moveCreature's `moved` flag is true even when a pure-axis charge is wall-blocked (its other-axis check is a no-op)
      moveCreature(cr, cr.lvx*sp, cr.lvy*sp); cr.moving = true;
      if(cr.kind === "embermite") cr.warm = 1;   // leaves a fading warm patch
      if(dist < 11 && !(state.iFrame > 0)) drainResolve(d.dmg, cr.x, cr.y);   // !(x>0) is undefined-safe (undefined<=0 is false, which would disable all damage)
      if(d.charger && cr.stateT < 0.82 && Math.hypot(cr.x-ox, cr.y-oy) < sp*0.5){   // v4.2 the Deep Knot slammed a wall — STUN itself; your window to punish. The stateT gate lets the charge COMMIT for a beat first, so a wall already in front can't cheese an instant frame-1 self-stun.
        cr.state = "stunned"; cr.stateT = 1.6; cam.shake = 3; hitstop = 0.03; playSfx("staveHit"); pChips(cr.x, cr.y, d.col2, 7); continue;
      }
      if(cr.stateT <= 0){ cr.state = "cooldown"; cr.stateT = 1.1; }
      continue;
    }
    if(cr.state === "cooldown"){ wardWander(cr, d, dt); if(cr.stateT <= 0) cr.state = "idle"; continue; }

    // v4.2 the Star-Gnarl kites — it drifts AWAY if you crowd it, so its ranged game reads as ranged.
    if(d.ranged && dist < 2.2*TILE){ const a=Math.atan2(cr.y-state.py, cr.x-state.px);
      if(moveCreature(cr, Math.cos(a)*d.speed*0.9*dt, Math.sin(a)*d.speed*0.9*dt)) cr.moving = true; }
    // idle → aggro when the player lingers within reach (the ranged one reaches much farther)
    const aggro = (d.ranged ? 5.5 : cr.kind==="shambler" ? 3.5 : cr.kind==="embermite" ? 2.6 : cr.kind==="hollowwarden" ? 3.2 : cr.kind==="deepknot" ? 3.8 : 3.0) * TILE;
    if(dist < aggro){ cr.state = "telegraph"; cr.stateT = d.tele; }
    else wardWander(cr, d, dt);
  }
  if(curMap.creatures) updateWardBolts(dt);   // v4.2 the Star-Gnarl's projectiles (undercroft-only, like the creatures)
}
// The Great Knot — rooted at its spawn (the stair spot), guards quietly until you close in, then
// alternates two clearly-telegraphed moves: a ground-slam ring (step out of it) and a reaching lunge.
// Same settle verb, just a longer fight and bigger tells. Nothing here can take anything (contract).
function updateGreatKnot(cr, d, dt, pdx, pdy, dist){
  cr.face = Math.abs(pdx) > Math.abs(pdy) ? (pdx<0?"left":"right") : (pdy<0?"up":"down");
  if(dist < 6*TILE) cr.hpBarT = Math.max(cr.hpBarT||0, 0.5);   // keep the boss bar + name up while you're near
  const easeHome = () => { const hx=cr.rx-cr.x, hy=cr.ry-cr.y, hd=Math.hypot(hx,hy);
    if(hd>1){ const sp=Math.min(hd, 22*dt); moveCreature(cr, hx/hd*sp, hy/hd*sp); cr.moving=true; } };
  if(cr.state === "stunned"){ if(cr.stateT<=0) cr.state="idle"; return; }
  if(cr.state === "cooldown" || cr.state === "idle"){
    easeHome();
    if(dist > 6*TILE){ cr.stateT = 0.6; return; }        // guard quietly until approached
    if(cr.stateT <= 0){ cr.phase = cr.phase ? 0 : 1;      // alternate slam / lunge
      cr.state = cr.phase ? "tel_lunge" : "tel_slam"; cr.stateT = d.tele; }
    return;
  }
  if(cr.state === "tel_slam"){                             // the danger ring grows over the telegraph (drawn in drawCreature)
    if(cr.stateT <= 0){ cr.state="slam"; cr.stateT=0.18; } return; }
  if(cr.state === "slam"){
    if(cr.stateT <= 0){                                    // the ground gives — a ring of force
      cam.shake = 5; hitstop = 0.06; playSfx("staveHit"); pRing(cr.x, cr.y, "#8a7a5c");
      if(dist < 1.8*TILE && !(state.iFrame > 0)) drainResolve(d.dmg, cr.x, cr.y);
      cr.state="cooldown"; cr.stateT=1.4;
    } return;
  }
  if(cr.state === "tel_lunge"){
    if(cr.stateT <= 0){ const a=Math.atan2(pdy,pdx); cr.lvx=Math.cos(a); cr.lvy=Math.sin(a); cr.state="lunge"; cr.stateT=0.5; }
    return;
  }
  if(cr.state === "lunge"){
    moveCreature(cr, cr.lvx*d.speed*2.6*dt, cr.lvy*d.speed*2.6*dt); cr.moving=true;
    if(dist < 13 && !(state.iFrame > 0)) drainResolve(d.dmg, cr.x, cr.y);
    if(cr.stateT <= 0){ cr.state="cooldown"; cr.stateT=1.4; } return;
  }
}

// ---------------- Star-bolts — the Star-Gnarl's ranged attack (v4.2, the first ranged restless thing) ----
// Telegraphed (the gnarl winds up, then locks your position and lobs a SLOW mote you can sidestep).
// A hit drains Resolve like a touch (still free knockout); it fizzles on a wall or after a short life.
function fireStarBolt(cr){
  const a = Math.atan2(state.py - cr.y, state.px - cr.x), sp = 60;   // slow enough to step out of
  wardBolts.push({ x:cr.x, y:cr.y-4, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:0, max:2.4, dmg: CREATURES[cr.kind].dmg });
  playSfx("staveHit"); pSparkle(cr.x, cr.y-4, "#c8b8ff", 6);
}
function updateWardBolts(dt){
  for(let i=wardBolts.length-1;i>=0;i--){ const b = wardBolts[i];
    b.life += dt; b.x += b.vx*dt; b.y += b.vy*dt;
    if(Math.hypot(b.x-state.px, b.y-(state.py-4)) < 9 && !(state.iFrame > 0)){ drainResolve(b.dmg, b.x, b.y); wardBolts.splice(i,1); continue; }
    if(b.life >= b.max || !wardWalkable(b.x, b.y)){ pSparkle(b.x, b.y, "#c8b8ff", 5); wardBolts.splice(i,1); }
  }
}
function drawWardBolts(){
  for(const b of wardBolts){ const x = Math.round(b.x), y = Math.round(b.y);
    ctx.fillStyle = "rgba(200,184,255,0.35)"; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    ctx.fillStyle = "#e8dcff"; ctx.fillRect(x-1, y-1, 2, 2);
    ctx.fillStyle = "#c8b8ff"; ctx.fillRect(x-2, y, 1, 1); ctx.fillRect(x+1, y, 1, 1); ctx.fillRect(x, y-2, 1, 1); ctx.fillRect(x, y+1, 1, 1);   // a little four-point star
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
  const cd = CREATURES[cr.kind];
  const tel = cr.state === "telegraph" || cr.state === "tel_slam" || cr.state === "tel_lunge";
  if(tel) ctx.globalAlpha = 0.55 + 0.45*Math.abs(Math.sin(animT*20));   // a bright warning shimmer
  if(cr.face === "left"){ ctx.save(); ctx.scale(-1,1); ctx.drawImage(s, -dx-w, dy); ctx.restore(); }
  else ctx.drawImage(s, dx, dy);
  ctx.globalAlpha = 1;
  if(cr.hurtT > 0){ ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, cr.hurtT*4)})`; ctx.fillRect(dx, dy, w, h); }   // hit flash
  // v4.1 the Hollow Warden's guarded front — a faint shield arc on the side it faces
  if(cd.block && ((cr.hpBarT||0) > 0 || cr.state !== "idle")){
    const fa = cr.face==="up"?-Math.PI/2 : cr.face==="down"?Math.PI/2 : cr.face==="left"?Math.PI : 0;
    ctx.strokeStyle = "rgba(180,200,240,0.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cr.x, cr.y-2, 9, fa-0.7, fa+0.7); ctx.stroke();
  }
  if(cr.state === "tel_slam"){   // v4.1 boss ground-slam — a filling DANGER ring; step outside before it lands
    const p = clamp(1 - cr.stateT/(cd.tele||0.9), 0, 1), R = 1.8*TILE;
    ctx.strokeStyle = "rgba(230,120,90,0.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cr.x, cr.y, R, 0, 7); ctx.stroke();                 // the full danger radius (faint)
    ctx.strokeStyle = `rgba(255,150,110,${0.5+0.4*p})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cr.x, cr.y, 6 + p*(R-6), 0, 7); ctx.stroke();       // the ring reaches the edge as it lands
  } else if(tel){ ctx.strokeStyle = "rgba(200,225,255,0.75)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cr.x, cr.y, 10 + Math.sin(animT*20)*2, 0, 7); ctx.stroke(); }   // telegraph ring
  // v4.0.3: a health bar over an ENGAGED creature (recently hit, or aggroed/attacking), + its name·Lv.
  // v4.1: the boss wears a wider bar and its name always shows — so combat reads at a glance.
  const engaged = (cr.hpBarT||0) > 0 || cr.state !== "idle";
  if(engaged){
    const maxhp = cd.hp, frac = clamp(cr.hp / maxhp, 0, 1);
    const bw = cd.boss ? 30 : 14, bx = Math.round(cr.x - bw/2), by = dy - (cd.boss ? 6 : 4);
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(bx-1, by-1, bw+2, 4);   // rim
    ctx.fillStyle = "#3a2a2a";          ctx.fillRect(bx, by, bw, 2);         // empty track
    ctx.fillStyle = cd.boss ? "#c86adf" : frac>0.5 ? "#6ac86a" : frac>0.25 ? "#e0b04a" : "#d0503a";
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw*frac)), 2);              // fill (boss = violet, else green→amber→red)
    if(cd.boss || (cr.hpBarT||0) > 0) queueText(cr.x, by-2, cd.name + (cd.boss ? "" : " · Lv" + cd.lvl),
      { color: cd.boss ? "#f0d0ff" : "#dbe6ff", size: cd.boss ? 8 : 7, weight: cd.boss ? "bold" : "", shadow:"rgba(0,0,0,0.6)" });
  }
}

// ---------------- The Stave's swing — settle a creature, or the stair-knot ----------------
// Called from the Stave branch of useTool (08-actions.js). Generous hitbox (bible §6.5.3): any live
// creature within ~15px of the faced tile is settled; otherwise the stair-knot on that tile takes the hit.
function staveSwing(tx, ty, power){
  const fx = tx*TILE+8, fy = ty*TILE+8;
  let hitAny = false;
  // .slice(): a Gloam Tangle's split pushes new Tanglets into curMap.creatures — iterate a snapshot so
  // they aren't also struck by the same swing (they must be settled on later swings).
  if(curMap.creatures) for(const cr of curMap.creatures.slice()){
    if(cr.alive && Math.hypot(cr.x-fx, cr.y-fy) <= 15){ hitCreature(cr, power, fx, fy); hitAny = true; }
  }
  if(hitAny){ cam.shake = 2.2; hitstop = 0.05; return; }
  const o = objAt(tx,ty);
  if(o && o.kind === "knot"){
    const dealt = Math.min(power, o.hp);
    o.hp -= power; o.shakeT = 0.2; cam.shake = 2.2; hitstop = 0.05;
    playSfx("staveHit"); pChips(fx, fy, "#4a3c2c", 5);
    spawnHitsplat(fx, fy-8, dealt, o.hp<=0 ? "settle" : "hit");
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
function frontalHit(cr){   // is the PLAYER (the attacker) in the direction the Warden is facing? (its guarded front)
  const fv = cr.face==="up" ? [0,-1] : cr.face==="down" ? [0,1] : cr.face==="left" ? [-1,0] : [1,0];
  const dx = state.px - cr.x, dy = state.py - cr.y, dd = Math.hypot(dx,dy) || 1;
  return (fv[0]*dx + fv[1]*dy)/dd > 0.35;
}
function spawnTanglets(cr){   // a Gloam Tangle breaks into two smaller Tanglets (which carry the loot)
  if(!curMap.creatures) return;
  for(let i=0;i<2;i++){
    const ang = Math.random()*Math.PI*2;
    let tx = Math.floor((cr.x + Math.cos(ang)*11)/TILE), ty = Math.floor((cr.y + Math.sin(ang)*11)/TILE);
    if(!wardWalkable(tx*TILE+8, ty*TILE+8)){ tx = Math.floor(cr.x/TILE); ty = Math.floor(cr.y/TILE); }
    const t = mkCreature("tanglet", tx, ty); t.split = true; t.hpBarT = 2.2;
    curMap.creatures.push(t);
  }
}
function hitCreature(cr, power, fx, fy){
  const d = CREATURES[cr.kind];
  // Gloam Tangle — the FIRST strike splits it into two Tanglets rather than damaging it (V4_BUILD_PLAN §4).
  if(d.splits && !cr.split){
    cr.alive = false; cr.hurtT = 0.18;   // the parent becomes its halves — no loot of its own
    playSfx("staveHit"); cam.shake = 2.2; hitstop = 0.05; pSparkle(cr.x, cr.y-2, d.col, 14);
    spawnTanglets(cr); floatText(cr.x, cr.y-14, "it splits!", d.col);
    return;
  }
  // Hollow Warden — GUARDS the front it faces; a strike from where it's looking clangs off. Circle to its side/back.
  if(d.block && frontalHit(cr)){
    cr.hpBarT = 2.6; cr.hurtT = 0.05; cam.shake = 1.0; playSfx("staveHit");
    spawnHitsplat(cr.x, cr.y-10, 0, "block"); floatText(cr.x, cr.y-16, "guarded", "#9fb0d0");
    return;
  }
  const dealt = Math.min(power, cr.hp);   // splat the damage actually taken, never more than it had
  cr.hp -= power; cr.hurtT = 0.18; cr.hpBarT = 2.6;
  if(!d.boss){   // normal things stagger + get knocked back; the boss shrugs off a hit (no stunlock)
    cr.state = "stunned"; cr.stateT = 0.35;
    const a = Math.atan2(cr.y - fy, cr.x - fx);
    const nx = cr.x + Math.cos(a)*10, ny = cr.y + Math.sin(a)*10;
    if(wardWalkable(nx, cr.y)) cr.x = nx;
    if(wardWalkable(cr.x, ny)) cr.y = ny;
  }
  playSfx("staveHit"); pChips(cr.x, cr.y, d.col2, 5);
  const killed = cr.hp <= 0;
  spawnHitsplat(cr.x, cr.y - 10, dealt, killed ? "settle" : "hit");   // red hit, violet on the settling blow
  if(killed) settleCreature(cr);
}
function settleCreature(cr){
  cr.alive = false;
  const d = CREATURES[cr.kind];
  pSparkle(cr.x, cr.y-2, d.col, d.boss ? 28 : 16);
  if(d.drop) give(d.drop, d.n||1);
  if(d.drop2 && (d.boss || chance(0.5))) give(d.drop2, d.n2||1);   // the boss always yields its ash
  if(hasMastery("Warding",50) && chance(0.15) && d.drop) give(d.drop, 1);   // ★ Gloamwise — an extra material now and then
  if(hasMastery("Warding",25)) state.resolve = Math.min(resolveMax(), (state.resolve||0) + 8);   // ★ Steady Ward — a settle steadies you
  if(d.xp) addXP("Warding", d.xp); bump("warded");
  if(d.boss){
    // the Great Knot guarded the stair — settling it drops the ladder at the spot it rooted on
    curMap.objects[key(Math.floor(cr.rx/TILE), Math.floor(cr.ry/TILE))] = { kind:"wardladderdown" };
    cam.shake = 4; playSfx("bellRing"); pSparkle(cr.rx, cr.ry-4, "#ffd88a", 24);
    banner("❖ " + d.name + " settled", "The old grief comes apart, quiet at last — and the stair it guarded lies open.");
    floatText(cr.rx, cr.ry-18, "↓ the way down", "#bfe0ff");
  } else {
    playSfx("settle");
    floatText(cr.x, cr.y-16, d.name + " settled", d.col);
  }
}

// ---------------- Resolve drain + the zero-cost knockout ----------------
// The whole point of the amended contract: a knockout takes NOTHING. It fades you out, a beat of
// story, and you wake at the Guild door with every item, coin and XP intact. The only cost is the
// wasted run-depth — softened by the Warden's Bells you can ring back down to.
function drainResolve(amt, srcX, srcY){
  if(state.iFrame > 0) return;
  if(hasMastery("Warding",75)) amt = Math.round(amt * 0.7);   // ★ Unshaken — the dark's touch costs less
  const fl = resolveFloor(), before = state.resolve||0;
  state.resolve = Math.max(fl, before - amt);
  state.iFrame = 0.85;   // brief invulnerability so a swarm can't chain-drain you
  // knock the player clear — use blockedAt (the REAL player collision: the 4-point feet bbox), NOT the
  // single-tile wardWalkable, or the knockback can land the feet clipping a wall and wedge you. Axis-
  // separated like normal movement, then unstick() guarantees you're never left standing in a solid.
  const a = Math.atan2(state.py - srcY, state.px - srcX);
  const kx = state.px + Math.cos(a)*12, ky = state.py + Math.sin(a)*12;
  if(!blockedAt(kx, state.py)) state.px = kx;
  if(!blockedAt(state.px, ky)) state.py = ky;
  unstick();
  cam.shake = 3.2; hitstop = 0.04;
  pSparkle(state.px, state.py-8, "#dcd6ff", 8);
  spawnHitsplat(state.px, state.py-12, before - state.resolve, "resolve");   // v4.0.3: the Resolve ACTUALLY lost (clamped to the floor), matching the HUD bar — not the raw incoming amt
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

// ---------------- The Warden's Bell panel (checkpoints + the charm workbench) ----------------
// Cloned from the Old Lift panel (renderLift): ring UP free, ring back down to any funded bell, and
// pledge the current floor's bell on the Pledge Ledger. The bell doubles as the Warden's workbench —
// where settling drops become the two crafted charms (worn one at a time, extending the v3.3 system).
const WARD_RECIPES = [
  { out:"Warded Charm",     mats:{ "Gloam Thread":6, "Wool":1, "Opal":1 }, blurb:"+5 maximum Resolve" },
  { out:"Emberlight Charm", mats:{ "Ember Grit":4 },                       blurb:"your lantern reaches much farther" },
  // v4.1 deep charms — the top Resolve charm (needs a Great Knot's Heartknot) and a Warding-XP band.
  { out:"Wardstone Charm",  mats:{ "Heartknot":1, "Warden's Ash":5, "Sapphire":1 }, blurb:"+10 maximum Resolve" },
  { out:"Settler's Band",   mats:{ "Snarlthread":6, "Gloam Thread":12 },            blurb:"+5% Warding XP while worn" },
  // v4.2 the capstone Resolve charm — a Gloamstar set in a Heartknot, ringed with diamond.
  { out:"Starward Charm",   mats:{ "Gloamstar":1, "Heartknot":1, "Diamond":1 },     blurb:"+15 maximum Resolve" },
];
function openBells(){ openPanel("bellPanel", renderBells); }
function renderBells(){
  const b = $("bellPanel").querySelector(".body");
  const depth = state.wardDepth||1, bells = (state.wardBells||[]).slice().sort((a,b)=>a-b);
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `The Warden's bells called the lantern-bearers. Ringing UP is always free; fund a bell and it's a checkpoint forever — ring back down to it any time.</div>`;
  html += `<div class="row"><span class="lead"><span>☀ Up to the Guild</span></span><button class="buy" onclick="rideBell(0)">ring up</button></div>`;
  for(const s of bells){
    html += `<div class="row"><span class="lead"><span>Floor ${s} <span class="sub">funded bell</span></span></span>` +
      (s===depth ? `<span class="sub">you are here</span>` : `<button class="buy" onclick="rideBell(${s})">ring down</button>`) + `</div>`;
  }
  if(depth % 5 === 0 && !bells.includes(depth)){
    html += pledgeRowHtml("bell"+depth);
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">Pledge what you carry — here, or from the Journal (J), anywhere. The ledger keeps the tally.</div>`;
  } else if(depth % 5 !== 0){
    const next = Math.min(45, Math.ceil(depth/5)*5);
    if(next > depth) html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">The next Warden's Bell is on floor ${next}.</div>`;
  }
  // the workbench
  html += `<div class="desc" style="margin:.7em 0 .3em;border-top:1px solid rgba(0,0,0,.18);padding-top:.55em;">` +
    `<b style="color:var(--gold-hi)">✦ The Warden's workbench.</b> <span style="color:var(--ink-soft)">Bind what you've settled into a charm — worn one at a time, like the grove's.</span></div>`;
  for(const r of WARD_RECIPES){
    const have = (state.inv[r.out]||0);
    const matStr = Object.keys(r.mats).map(it => { const h=state.inv[it]||0, n=r.mats[it];
      return `${n} ${it} <span style="color:${h>=n?'#8fd06a':'#c98a6a'}">(${h})</span>`; }).join(" + ");
    const can = Object.keys(r.mats).every(it => (state.inv[it]||0) >= r.mats[it]);
    html += `<div class="row"><span class="lead" data-icon="item_${r.out}"><canvas></canvas><span>${r.out}${have?` <span class="sub" style="color:var(--gold-hi)">×${have}</span>`:''} ` +
      `<span class="sub">${r.blurb}<br>${matStr}</span></span></span>` +
      `<button class="buy" ${can?"":"disabled"} onclick="craftWardCharm('${r.out}')">bind</button></div>`;
  }
  b.innerHTML = html;
  if(typeof hydrateIcons === "function") hydrateIcons(b);
}
function craftWardCharm(out){
  const r = WARD_RECIPES.find(x => x.out === out); if(!r) return;
  for(const it in r.mats) if((state.inv[it]||0) < r.mats[it]){ toast("Not enough " + it + ".", "#ff8a7a"); playSfx("error"); return; }
  for(const it in r.mats) take(it, r.mats[it]);
  give(out, 1); addXP("Warding", 20);
  playSfx("upgrade"); pSparkle(state.px, state.py-12, "#bfe0ff", 16);
  toast("You bind a " + out + ". (Wear it from your Backpack.)", "#8fe8c8");
  refreshHUD(); renderBells();
}
function rideBell(target){
  closeAllPanels(); playSfx("bellRing");
  if(target === 0){ exitUndercroft(); toast("The bell rings, and the way up opens into the Guild.", "#bfe4ff"); return; }
  state.wardDepth = target;
  travelTo("undercroft", 2*TILE+8, 3*TILE, "down");
  toast("The bell rings you down to floor " + target + ".", "#bfe4ff");
}

// ---------------- Tom's "warden's salvage" — the non-combat loot trickle (V4_PLAN §2) ----------------
// So a combat-averse save can still finish the story (slower): Tom offers ONE warding material a day
// to BUY, cloned from Nell's daily order but REVERSED (Tom sells to you). Modest quantities at a fair
// markup — never a faucet that undercuts settling, just a trickle for the charm/bell sinks.
const SALVAGE_OFFERS = [
  { item:"Gloam Thread", qty:3, price:90,  want:"A trapper up the coast brought in a hank of that queer silver thread. Odd stuff. Three lengths?", line:"There you are. Whatever you're winding it into, mind your fingers." },
  { item:"Knotwood",     qty:2, price:70,  want:"Somebody left a couple of those grief-dark knots on my step. Bad luck to burn 'em, they say. Two?", line:"Off my step and onto yours. Fair trade, that." },
  { item:"Ember Grit",   qty:2, price:80,  want:"Got a pinch of that warm grit that ticks like a stove. Won't sit near the matches. Two measures?", line:"Careful — it likes to be near things. Mind what you keep it by." },
  // v4.1 deeper salvage (so a combat-shy save can still stock the deep charm/bell asks)
  { item:"Warden's Ash", qty:2, price:100, want:"A pedlar traded me a twist of pale ash that won't go cold. Gives me the shivers. Two twists?", line:"Take it, take it. I'll sleep better with it off the shelf." },
  { item:"Snarlthread",  qty:2, price:110, want:"Bought a coil of thread that keeps re-knotting itself in the drawer. Unnatural. Two coils?", line:"Keep it wound tight. That's my only advice on the matter." },
  { item:"Deepgnarl",    qty:1, price:120, want:"A miner traded me a knuckle of wood gone near to stone. Cold as a well-bottom. Just the one — that's all I'd take.", line:"There. And I'll not be handling another." },
];
function todaysSalvage(){
  if(state.flags.salvageDay === state.day) return state.flags.salvageIdx >= 0 ? SALVAGE_OFFERS[state.flags.salvageIdx] : null;
  const rng = makeRng(5150 + state.day*31);
  state.flags.salvageDay = state.day;
  state.flags.salvageIdx = state.flags.tenthDoorOpen ? Math.floor(rng() * SALVAGE_OFFERS.length) : -1;   // only once the door's open
  return state.flags.salvageIdx >= 0 ? SALVAGE_OFFERS[state.flags.salvageIdx] : null;
}
// An EXPLICIT buy (a row in Tom's shop with its own button) — never an auto-drain on talk, per the
// owner's standing UI feedback that interfaces must not silently spend everything you carry.
function buySalvage(){
  const o = todaysSalvage(); if(!o) return;
  if(state.flags.salvageDone === state.day){ toast("Tom's already parted with today's salvage.", "#cbb98f"); return; }
  if(state.gold < o.price){ toast("Not enough coin for that.", "#ff8a7a"); playSfx("error"); return; }
  state.gold -= o.price; give(o.item, o.qty); state.flags.salvageDone = state.day;
  playSfx("coin"); pSparkle(state.px, state.py-12, "#ffce5a", 10);
  toast("Bought " + o.qty + "× " + o.item + " — " + o.price + "g.", "#ffce5a");
  refreshHUD(); if(typeof renderShop === "function") renderShop();
}

// ---------------- Act III opener: "The Tenth Door" turn-in scene (Elias takes the boards down) --------
// Attached here (not in 01-data) because it needs QUESTS + NPCDEF + mkNpc, all defined by the time this
// file loads. Matches the "One Last Letter" / Homecoming temperature: quiet, earned, restrained. Rowan
// owns the sealing guilt; Elias — the last Warden — takes his own boards down and hands over the Basic
// Stave, reframing combat as tending ("you settle it — there's a difference, and it matters"). Sets
// state.flags.tenthDoorOpen, which turns the planked door into the Undercroft mouth (olddoor interact).
(function attachTenthDoor(){
  const q = QUESTS.find(x => x.id === "tenth-door");
  if(!q) return;
  const ensure = (id, x, y, face) => { let n = curMap.npcs.find(v => v.id === id);
    if(!n){ n = mkNpc(id, x*TILE, y*TILE, {face}); curMap.npcs.push(n); } return n; };
  q.turnIn = { cutscene: [
    { type:"run", fn:()=>{ ensure("rowan", 8, 4, "up"); ensure("elias", 9, 7, "up"); } },
    { type:"wait", t:0.4 },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"You've the run of the whole valley now, and there's one door in it I've never let you near. It's past time I told you why." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"There were ten wings, not nine. The tenth was the Warden's — the craft of tending what grows where nobody's looking. When the Guild went dark, I nailed that one shut with my own hands. I called it grief. Some of it was grief." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"The rest was that I couldn't bear to keep it, and couldn't bear to lose it. So I hid it. Eleven years." },
    { type:"move", actor:"elias", x:13, y:4, face:"up", sp:30 },
    { type:"wait", t:0.5 },
    { type:"say", who:"Elias", portrait:"port_elias", text:"You never lost it, Rowan. You left it for the one person stubborn enough to come and fetch all of us home. …It was my workroom, you know. The last Warden's." },
    { type:"say", who:"Elias", portrait:"port_elias", text:"I told you once the boards could come down any day they chose. Turns out the day chose you." },
    { type:"run", fn:()=>{ pSparkle(15*TILE+8, 1*TILE+8, "#bfe4ff", 22); playSfx("door"); if(typeof cam!=="undefined") cam.shake = 2; } },
    { type:"wait", t:0.7 },
    { type:"say", who:"Elias", portrait:"port_elias", text:"There. Feel that cold coming up? That's the Undercroft breathing. Eleven years untended — and things have knotted themselves out of everything nobody minded. Wisps. Shamblers. Little grieving knots of the dark." },
    { type:"say", who:"You", portrait:"port_player", text:"…Do I fight them?" },
    { type:"say", who:"Elias", portrait:"port_elias", text:"No. You settle them. There's a difference, and it's the whole of the craft. You don't raise a hand against the dark down there — you tend it back into what it was, and it comes apart almost grateful. Here. This was mine." },
    { type:"run", fn:()=>{ give("Stave", 1, true); state.tools.Stave = 0; state.flags.staveEarned = true;
        if(typeof ensureStaveSlot === "function") ensureStaveSlot();
        playSfx("gift"); pSparkle(state.px, state.py-14, "#bfe4ff", 16); if(typeof refreshHotbar==="function") refreshHotbar(); } },
    { type:"say", who:"Elias", portrait:"port_elias", text:"A warden's Stave. Basic and worn — Tom can forge you a truer one when your hands have learned it. And there are bells down there. Ring one and the lantern-bearers will always find you. Nothing in that dark is worth losing yourself over. Nothing ever will be." },
    { type:"say", who:"Elder Rowan", portrait:"port_rowan", text:"Ten wings, then. …We'll light the last one properly one day, when it's earned. Go gently, child. And come back up for supper — both of you." },
    { type:"run", fn:()=>{ state.flags.tenthDoorOpen = true; ensureRel("elias").points = Math.max(ensureRel("elias").points||0, 120); saveGame(); } },
    { type:"banner", big:"❖ The Tenth Door", small:"The Warden's wing is open. Step through it in the Guild.", t:3.4 },
  ] };
  // A quiet recognition once the door's open — Elias, warden to warden, if you meet him topside.
  if(typeof NPC_RECOG !== "undefined") NPC_RECOG.push({
    npc:"elias", flag:"tenthDoorOpen", ack:"ack_elias_warden",
    line:"Still going down there, are you? Good. It's less lonely, the tending, when somebody minds it. …Mind the bells. That's all I ask." });
})();
