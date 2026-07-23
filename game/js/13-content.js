"use strict";
/* ============================================================
   13-content.js — map registry & generators, the NPC cast,
   dialogue, relationships, and the mine.
   ============================================================ */

// ---------------- map registry ----------------
const MAPS = {
  farm:      { w:46, h:36, outdoor:true,  name:"Willowbrook Farm", music:"auto",  gen:genFarm },
  cottage:   { w:11, h:9,  name:"Your Cottage",          subtitle:"home sweet home", music:"cozy", bg:"#171009", gen:genCottage },
  coop:      { w:12, h:9,  name:"The Coop",              subtitle:"cluck, cluck",    music:"cozy", bg:"#1a1208", gen:genCoop },
  barn:      { w:14, h:10, name:"The Barn",              subtitle:"warm straw, slow breathing", music:"cozy", bg:"#1a1208", gen:genBarn },
  store:     { w:14, h:9,  name:"Tom's General Store",   subtitle:"coin for goods",   music:"cozy", bg:"#171009", gen:genStore },
  mayahouse: { w:12, h:9,  name:"The Alderman House",    subtitle:"",                 music:"cozy", bg:"#171009", gen:genMayaHouse },
  guild:     { w:17, h:11, name:"Guild of Nine Crafts",  subtitle:"once, the heart of the valley", music:"cozy", bg:"#12100b", gen:genGuild },
  mine:      { w:24, h:16, name:"The Old Mine",          subtitle:"",                 music:"mine", bg:"#050406", gen:genMine },   // v3.16: ~half the old 34×22 — smaller floors lean on descending + the checkpoints
  undercroft:{ w:24, h:16, name:"The Undercroft",        subtitle:"the tenth wing",   music:"under", bg:"#0b0a12", gen:genUndercroft },   // v4.0 — sealed under the Guild; the mine's cozy-dark cousin, but knotted with restless things
  beach:     { w:46, h:24, outdoor:true, name:"Willowbrook Coast", subtitle:"salt on the breeze", music:"beach", bg:"#2f4a63", gen:genBeach },
  coastroad: { w:46, h:26, outdoor:true, name:"The Coast Road", subtitle:"north, by the sea", music:"beach", bg:"#2f4a63", gen:genCoastRoad },   // v3.36 — WORLD_EXPANSION.md area 1
  ridge:     { w:46, h:30, outdoor:true, name:"Starfall Ridge", subtitle:"where the sky came down", music:"auto", bg:"#141824", gen:genRidge },   // v3.43 — WORLD_EXPANSION.md area 2
  butterbrook:{ w:46, h:34, outdoor:true, name:"Butterbrook", subtitle:"the coast dairy", music:"beach", bg:"#2f4a63", gen:genButterbrook },   // v3.44 — WORLD_EXPANSION.md area 3
  dairy:     { w:13, h:9,  name:"The Coast Dairy", subtitle:"cool stone, cream, and patience", music:"cozy", bg:"#171009", gen:genDairy },
  grove:     { w:44, h:30, outdoor:true, name:"The Deep Grove", subtitle:"the forest gives, and grows back", music:"auto", bg:"#0d150c", gen:genGrove },
  village:   { w:40, h:28, outdoor:true, name:"Willowbrook Village", subtitle:"the valley's beating heart", music:"auto", bg:"#101408", gen:genVillage },
};

// ---------------- interior helpers ----------------
function genRoom(m, floorTile, wallTile){
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++)
    m.tiles[y*W+x] = (x===0||y===0||x===m.w-1||y===m.h-1) ? wallTile : floorTile;
}
function exitAt(m, x, to, sx, sy){
  m.tiles[(m.h-1)*W+x] = T.DOOR;
  m.objects[key(x, m.h-2)] = { kind:"exitmat" };
  m.warps[key(x, m.h-2)] = { to, sx, sy, face:"down", auto:true };
}
const put = (m, x, y, kind, extra) => { m.objects[key(x,y)] = Object.assign({kind}, extra||{}); };

function genCottage(m){
  genRoom(m, T.IFLOOR, T.IWALL);
  m.tiles[0*W+0]=T.IWALL;
  // rug centre
  for(let y=4;y<=6;y++) for(let x=4;x<=7;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,2,2,"bed"); put(m,4,1,"painting"); put(m,8,2,"bookshelf"); put(m,9,3,"plantpot");
  put(m,2,4,"stove"); put(m,1,3,"barrel"); put(m,6,3,"table"); put(m,6,2,"chair"); put(m,7,4,"chair");
  put(m,9,6,"chest",{story:"cottagechest"}); put(m,2,6,"lamp");
  exitAt(m,5,"farm",7*TILE+8,8*TILE);
}
function genCoop(m){
  genRoom(m, T.HAY, T.IWALL);
  put(m,2,1,"nest"); put(m,4,1,"nest"); put(m,6,1,"nest"); put(m,8,1,"nest");
  put(m,9,3,"trough"); put(m,2,6,"crate"); put(m,10,6,"barrel"); put(m,1,3,"plantpot");
  put(m,10,1,"sign",{text:"Buy hens at Tom's. Each lays an egg every morning — pet them (E) to make friends."});
  exitAt(m,6,"farm", 15*TILE+8, 8*TILE);   // 2 tiles below the coop door (clear of the doorway)
}
function genBarn(m){
  genRoom(m, T.HAY, T.IWALL);
  put(m,2,1,"trough"); put(m,4,1,"trough");
  put(m,11,1,"barrel"); put(m,12,3,"crate"); put(m,1,5,"crate"); put(m,12,6,"barrel"); put(m,1,2,"plantpot");
  put(m,9,1,"sign",{text:"Cows and sheep both bed down here. Milk (E) each morning; shear a full coat (E) with shears from Tom's. A scratch behind the ears never hurts."});
  exitAt(m,7,"farm", 22*TILE+8, 8*TILE);   // 2 tiles below the barn door (x matches the door at 22)
}
function genStore(m){
  genRoom(m, T.PLANK, T.IWALL);
  // counter across the middle
  for(let x=3;x<=10;x++) put(m,x,3,"counter",{shop:true});
  put(m,2,3,"counter",{shop:true});
  put(m,4,1,"bookshelf"); put(m,7,1,"bookshelf"); put(m,10,1,"bookshelf");
  put(m,2,6,"crate"); put(m,3,6,"barrel"); put(m,11,6,"crate"); put(m,11,5,"barrel");
  put(m,12,2,"plantpot"); put(m,1,5,"crate");
  put(m,12,6,"sign",{text:"“Dusted daily.” — Tom"});
  exitAt(m,7,"village",9*TILE+8,10*TILE+8);   // just below the store door, on its path
}
function genMayaHouse(m){
  genRoom(m, T.IFLOOR, T.IWALL);
  for(let y=4;y<=6;y++) for(let x=4;x<=6;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,2,2,"bed"); put(m,8,2,"fireplace"); put(m,4,1,"painting"); put(m,9,3,"bookshelf");
  put(m,5,4,"table"); put(m,5,3,"chair"); put(m,2,5,"plantpot"); put(m,9,6,"lamp");
  put(m,3,6,"sign",{text:"Maya's sketchbook lies open — half-drawn festival lanterns."});
  exitAt(m,6,"village",30*TILE+8,10*TILE+8);   // just below Maya's door, on the east lane
}
function genGuild(m){
  genRoom(m, T.PLANK, T.IWALL);
  for(let x=1;x<m.w-1;x++) m.tiles[1*W+x]=T.IWALL;   // back wall band
  // nine craft wings, lit or dark along the back wall. (Lit wings already glow via collectLights —
  // the hall genuinely brightens with the count, no extra props needed.)
  const wingX = [3,4,6,7,8,9,11,12,13];
  WINGS.forEach((w,i) => put(m, wingX[i], 1, "wing", { wing:w.id }));
  // The planked-shut door at the far end of the back wall — the first thing that makes you ask
  // what actually happened here. Rowan won't discuss it. (It pays off in Act II.)
  put(m, 15, 1, "olddoor");
  put(m, 14, 1, "wardledger");            // v4.3 Elias's Warden's Ledger — Act III, beside the tenth door
  // Rowan's desk area
  put(m,7,3,"desk"); put(m,8,3,"desk"); put(m,6,3,"bookshelf"); put(m,10,3,"bookshelf");
  put(m,9,3,"ledger");                    // the valley's unfinished work, in Rowan's hand
  put(m,2,5,"anvil"); put(m,14,5,"bookshelf"); put(m,2,3,"plantpot"); put(m,14,3,"plantpot");
  // central carpet
  for(let y=5;y<=7;y++) for(let x=6;x<=10;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,4,7,"crate"); put(m,12,7,"barrel");
  // v4.17: the sign updates once the tenth wing is lit — the guild map regenerates daily, so it re-reads
  // the flag each morning. Before the finale it's the nine everyone counted; after, the ten there always were.
  put(m,1,7,"sign",{text: state.flags && state.flags.tenthWingLit
    ? "Ten crafts. Ten wings. All tended, all lit — the Warden's last of all. The valley is awake."
    : "Nine crafts. Nine wings. Tend them all, and the valley wakes."});
  wardWorldProps(m);                          // v4.3 the Guild warms as Warden's Ledger chapters close
  exitAt(m,8,"village",20*TILE+8,7*TILE+8);   // just below the Guild door, on its path
}
// v4.3 the visible reward of the Warden's Ledger: each closed chapter lights a lantern pair along the
// Guild's back wall — the hall waking, the same felt beat as the nine wings. Also called live (with
// curMap) from closeWardChapter so the light catches during the closing scene, not just on next entry.
// Placed on the furniture row (y=3), where objects already sit and never block the player's path.
function wardWorldProps(m){
  if(!m || m.id !== "guild" || !state.flags) return;
  const lamp = (x,y) => { if(!m.objects[key(x,y)]) m.objects[key(x,y)] = { kind:"lantern" }; };
  if(state.flags.wardLit1){ lamp(5,3);  lamp(11,3); }
  if(state.flags.wardLit2){ lamp(4,3);  lamp(12,3); }
  if(state.flags.wardLit3){ lamp(3,3);  lamp(13,3); }
  // v4.5 Act III chapters 4–7: the hall keeps warming as the wing is kept deeper (y=3 is full, so these
  // spread down the sides of the hall). The finale lights the tenth door itself — cold planked wood for
  // eleven years, now a lit wing at last (collectLights adds a warm pool at the door; see 06-weather.js).
  if(state.flags.wardLit4){ lamp(4,5);  lamp(12,5); }
  if(state.flags.wardLit5){ lamp(2,8);  lamp(14,8); }
  if(state.flags.wardLit6){ lamp(5,9);  lamp(11,9); }
  if(state.flags.wardLit7){ lamp(1,3);  lamp(15,3); }
  if(state.flags.tenthWingLit){ lamp(13,5); lamp(15,5); }   // flanking the tenth door — the tenth lantern lit for good
}

// ---------------- the mine (procedural floors) ----------------
function genMine(m){
  const depth = state.mineDepth || 1;
  const rng = makeRng(9001 + depth*137 + state.day*7);
  // walls everywhere, carve floor
  m.tiles.fill(T.MWALL);
  const floor = (x,y) => { if(x>0&&y>0&&x<m.w-1&&y<m.h-1) m.tiles[y*W+x]=T.MFLOOR; };
  // carve a rough open cavern with drunken walk from centre
  let cx = m.w>>1, cy = m.h>>1;
  for(let i=0;i<m.w*m.h*0.62;i++){
    floor(cx,cy); floor(cx+1,cy); floor(cx,cy+1);
    cx = clamp(cx + randiR(rng,-1,1), 1, m.w-2);
    cy = clamp(cy + randiR(rng,-1,1), 1, m.h-2);
  }
  // guaranteed corridors so nothing is ever boxed in
  const ux=2, uy=2, dx=m.w-3, dy=m.h-3;
  const carve = (x0,y0,x1,y1) => { let x=x0,y=y0; let guard=0;
    while((x!==x1||y!==y1) && guard++<400){ floor(x,y); floor(x,y+1); floor(x+1,y);
      if(x!==x1) x += Math.sign(x1-x); else if(y!==y1) y += Math.sign(y1-y); } floor(x1,y1); };
  carve(ux,uy, m.w>>1, m.h>>1); carve(m.w>>1, m.h>>1, dx, dy);
  floor(ux,uy); floor(ux,uy+1); floor(ux+1,uy); put(m,ux,uy,"ladderup");
  floor(dx,dy); floor(dx-1,dy); floor(dx,dy-1);   // far corner stays carved as a connectivity anchor
  // the Old Lift stands by the entry ladder on every floor — the way out is never a climb
  floor(ux+2,uy); floor(ux+2,uy+1); floor(ux+3,uy); put(m,ux+2,uy,"lift");
  // v3.19 — NO fixed ladder down. The way down is hidden under ONE rock somewhere on this floor; you
  // mine the rock field to find it (Harvest Moon / Story of Seasons). Placed + made reachable below.
  // scatter ore/gems/props on floor tiles
  const floors = [];
  for(let y=1;y<m.h-1;y++) for(let x=1;x<m.w-1;x++) if(m.tiles[y*W+x]===T.MFLOOR) floors.push([x,y]);
  // Deeper is always richer — the deep never recycles back to stone, so a fog/storm day rewards
  // pushing DOWN rather than camping a shallow floor (which used to be the perverse optimum).
  // The Long Climb (v3.10): the table keeps improving past floor 10 now, so diving deep is worth it
  // and the two new veins (Cobalt L45 / Star Metal L70) have a home — a reason to push down AND to
  // keep levelling Mining to crack what you find down there.
  // v3.16 — the ore tiers are spaced FAR deeper, so no *high*-tier vein walls off the early floors and
  // reaching the next tier is a real climb (owner: "stretch the progression, lean on the checkpoints").
  // A vein still gates on Mining level by design — a sub-10 miner can meet a copper wall down here, but
  // the floor is ~¾ stone to mine around/level on, and the lift out is always free. iron first at 5, gold 15,
  // cobalt at 25, star metal at 35 — each roughly a 5-floor band you grind to level into the next.
  // v3.17 — the shallow floors are STONE-heavy now that copper needs Mining 10: a beginner mines
  // stone here to earn that first ten levels (and stockpile it for Deep Run staircases). Higher ores
  // still first appear at iron@5 / gold@15 / cobalt@25 / star metal@35 — you SEE the next metal a few
  // floors before your Mining catches up to it, RuneScape-style.
  // v3.19 — the ore table is VALUABLE veins only now; plain stone is the separate filler (below).
  // Same depth spacing: iron first at floor 5, gold 15, cobalt 25, star metal 35 — you see the next
  // metal a few floors before your Mining catches up to it.
  // v3.38: bands re-seated on the unified ladder (cobalt 45 / deepsilver 70 / star metal 85) —
  // each deep ore arrives ~15-20 floors before its level, the same lead the shallow bands use
  // (desire ahead of ability, the grove's rule). Star metal only below floor 65 now.
  const oreTable = depth<5  ? ["copper"]
                 : depth<10 ? ["copper","copper","iron"]
                 : depth<15 ? ["copper","iron","iron"]
                 : depth<25 ? ["iron","gold","gold"]
                 : depth<35 ? ["gold","gold","cobalt"]
                 : depth<50 ? ["gold","cobalt","cobalt"]
                 : depth<65 ? ["cobalt","deepsilver","deepsilver"]
                 :            ["deepsilver","deepsilver","starmetal","starmetal"];
  // The weather above reaches down here. A storm drives the veins, and fog is when the seams
  // "read" — the old miners' word for it. Both make the stone generous, for one day only.
  const oreBoost = isStorm() ? 1.5 : 1;
  const gemBoost = isFog() ? 2.2 : isStorm() ? 1.4 : 1;
  for(const [x,y] of floors){
    if(x===ux&&y===uy || (x===ux+2&&y===uy)) continue;   // the up-ladder + the lift are sacred
    const r = rng();
    // v3.19 — valuable veins are ~3× rarer than before (and worth ~3× the XP — see ORES): a vein is a
    // real find now, not wallpaper. Plain stone is DENSE — it's the rock you dig through to hunt the
    // hidden stairs, and it feeds Deep Run staircases.
    // v3.28: the richness curve reaches deeper now — density keeps climbing to floor 40, not 20, so a
    // deep run stays a frontier (balance §6: deeper must out-pay camping), and a rare GEODE appears past
    // floor 25 — the mine's canopy-nest, a repeatable reason to dive that pays in curios, not coin.
    const oreP    = 0.03 * (1 + 0.02*Math.min(depth,40)) * oreBoost;   // ore keeps enriching to floor 40 (deeper out-pays camping)
    const gemP    = 0.002 * Math.min(depth,20) * gemBoost;             // gems stay clamped at 20 — never re-open the gem-gold faucet the economy nerfed
    const geodeP  = depth >= 25 ? 0.004 : 0;
    const rockP   = 0.24;   // plain stone filler
    if(r < geodeP){ put(m,x,y,"geode",{hp:6+Math.floor(depth/4)}); }
    else if(r < geodeP + gemP){ put(m,x,y, rng() < (0.30 + depth*0.008) ? "crystal" : "gemrock", {hp:3+Math.floor(depth/2)}); }
    else if(r < geodeP + gemP + oreP){ const k = oreTable[randiR(rng,0,oreTable.length-1)]; put(m,x,y,k,{hp:ORES[k].hp}); }
    else if(r < geodeP + gemP + oreP + rockP){ put(m,x,y,"stone",{hp:ORES.stone.hp}); }
    else if(r < geodeP + gemP + oreP + rockP + 0.03){ put(m,x,y, rng()<0.5?"rubble":"minecart"); }
    else if(r < geodeP + gemP + oreP + rockP + 0.045){ put(m,x,y,"beam"); }
  }
  // torches on some wall edges for light (never over an existing object — would trap the player)
  for(const [x,y] of floors){ if(!m.objects[key(x,y)] && rng()<0.04){ const above=m.tiles[(y-1)*W+x]; if(above===T.MWALL) put(m,x,y,"torch"); } }

  // keep the up-ladder & lift approaches clear of unclearable props (a sealed pocket stays sealed all day)
  const nbrs = (x,y) => [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
  for(const [ax,ay] of [...nbrs(ux,uy), ...nbrs(ux+2,uy)]){
    const o = m.objects[key(ax,ay)]; if(o && o.kind !== "lift" && o.kind !== "ladderup") delete m.objects[key(ax,ay)];
  }

  const minable = k => !!ORES[k] || k==="crystal" || k==="gemrock";   // a pick clears these; props don't
  const open = (x,y) => {
    if(x<1||y<1||x>=m.w-1||y>=m.h-1) return false;
    if(m.tiles[y*W+x] !== T.MFLOOR) return false;
    const o = m.objects[key(x,y)];
    return !o || WALKABLE_OBJ.has(o.kind) || minable(o.kind);   // walkable or diggable; a prop blocks
  };
  const bfsTo = (tx2,ty2) => {
    const prev = {}; prev[key(ux,uy+1)] = null; const q = [[ux,uy+1]];
    for(let h=0; h<q.length; h++){ const [x,y] = q[h];
      if(x===tx2 && y===ty2) return { prev, endK:key(x,y) };
      for(const [nx,ny] of nbrs(x,y)){ const k2 = key(nx,ny);
        if(k2 in prev || !open(nx,ny)) continue; prev[k2] = key(x,y); q.push([nx,ny]); } }
    return null;
  };
  // ---- hide the stairs down under ONE rock, and GUARANTEE you can always dig to it ----
  // Descending is a SEARCH, never a level wall: the whole route to the stairs is plain stone anyone can
  // break. The valuable veins (level-gated) are the deep's optional reward, kept OFF the guaranteed path.
  const minDist = Math.max(6, Math.floor((m.w+m.h)/4));
  let pool = floors.filter(([x,y]) => Math.abs(x-ux)+Math.abs(y-uy) >= minDist && !(x===ux+2&&y===uy));
  if(!pool.length) pool = floors.filter(([x,y]) => !(x===ux&&y===uy) && !(x===ux&&y===uy+1) && !(x===ux+2&&y===uy));
  const [sx,sy] = pool[randiR(rng, 0, pool.length-1)];
  m.tiles[sy*W+sx] = T.MFLOOR; delete m.objects[key(sx,sy)];   // clear the spot so the BFS can reach it
  let route = bfsTo(sx,sy);
  if(!route){                                    // sealed off — dig a straight tunnel from the entry to it
    let x=ux, y=uy+1, g=0;
    while((x!==sx||y!==sy) && g++<300){ m.tiles[y*W+x]=T.MFLOOR;
      const o=m.objects[key(x,y)]; if(o && !minable(o.kind) && !WALKABLE_OBJ.has(o.kind)) delete m.objects[key(x,y)];
      if(x!==sx) x += Math.sign(sx-x); else if(y!==sy) y += Math.sign(sy-y); }
    route = bfsTo(sx,sy);
  }
  // any vein/gem on the route becomes plain stone, so ANY Mining level can dig its way down
  if(route){ let k2 = route.endK; while(k2){ const o = m.objects[k2];
    if(o && minable(o.kind) && o.kind !== "stone") m.objects[k2] = { kind:"stone", hp:ORES.stone.hp };
    k2 = route.prev[k2]; } }
  put(m, sx, sy, "stone", { hp:ORES.stone.hp, stairs:true });   // THE rock that hides the way down

  // deep story vault — keep it off the stairs route (never strand a low miner)
  if(depth >= 5 && !state.flags.foundVault){
    const onPath = new Set(); if(route){ let k2 = route.endK; while(k2){ onPath.add(k2); k2 = route.prev[k2]; } }
    const cand = floors.filter(([x,y]) => !m.objects[key(x,y)] && !onPath.has(key(x,y))
      && !(x===sx&&y===sy) && Math.abs(x-ux)+Math.abs(y-uy) > 6);
    if(cand.length){ const c = cand[randiR(rng,0,cand.length-1)]; put(m, c[0], c[1], "sealeddoor", {story:"vault"}); }
  }
  m.subtitle = "Floor " + depth + "  ·  the way down is here somewhere";
  m.meta.up = {x:ux,y:uy};   // entry (diagnostic only; nothing reads meta). No fixed down-portal now — the way down hides under the stairs rock.
}

// ---------------- The Undercroft (v4.0 "The Tenth Door") — the tenth wing, procedural floors --------
// The mine's cozy-dark COUSIN: it reuses the carve/BFS skeleton, but this is a COMBAT venue, not a
// mining one. No ore veins — instead the dark is knotted with restless things (CREATURES, settled with
// the Stave), and the way down hides under a KNOT you settle (not a rock you pick). A silent Warden's
// Bell stands on every floor (the checkpoint, funded on the Pledge Ledger). Floors 1–15 in v4.0; floor
// 15 is a dead-end for now (v4.1 "The Warden's Ledger" deepens it). This lives in 13-content.js — not
// 15-warding.js — because the MAPS literal above references genUndercroft at load time (strict mode
// would throw on a forward-ref to a not-yet-parsed script). mkCreature/updateCreatures live in 15.
const WARD_FLOOR_MAX = 45;   // v4.2 bottom of the wing (v4.0=15, v4.1=30); dedicated deep venues (Gloam Grove, Sunken Workings) come later
function genUndercroft(m){
  const depth = state.wardDepth || 1;
  const rng = makeRng(4200 + depth*137 + state.day*7);   // distinct seed base (the mine uses 9001)
  m.tiles.fill(T.MWALL);
  const floor = (x,y) => { if(x>0&&y>0&&x<m.w-1&&y<m.h-1) m.tiles[y*W+x]=T.MFLOOR; };
  let cx = m.w>>1, cy = m.h>>1;
  for(let i=0;i<m.w*m.h*0.62;i++){
    floor(cx,cy); floor(cx+1,cy); floor(cx,cy+1);
    cx = clamp(cx + randiR(rng,-1,1), 1, m.w-2);
    cy = clamp(cy + randiR(rng,-1,1), 1, m.h-2);
  }
  const ux=2, uy=2, dx=m.w-3, dy=m.h-3;
  const carve = (x0,y0,x1,y1) => { let x=x0,y=y0; let guard=0;
    while((x!==x1||y!==y1) && guard++<400){ floor(x,y); floor(x,y+1); floor(x+1,y);
      if(x!==x1) x += Math.sign(x1-x); else if(y!==y1) y += Math.sign(y1-y); } floor(x1,y1); };
  carve(ux,uy, m.w>>1, m.h>>1); carve(m.w>>1, m.h>>1, dx, dy);
  floor(ux,uy); floor(ux,uy+1); floor(ux+1,uy); put(m,ux,uy,"wardup");            // the way back up toward the Guild
  floor(dx,dy); floor(dx-1,dy); floor(dx,dy-1);
  floor(ux+2,uy); floor(ux+2,uy+1); floor(ux+3,uy); put(m,ux+2,uy,"wardbell");    // the checkpoint bell — on every floor, like the lift

  const floors = [];
  for(let y=1;y<m.h-1;y++) for(let x=1;x<m.w-1;x++) if(m.tiles[y*W+x]===T.MFLOOR) floors.push([x,y]);

  // sparse old-Guild wreckage for texture + the odd wall sconce for light (never over entry/bell)
  for(const [x,y] of floors){
    if((x===ux&&y===uy) || (x===ux+2&&y===uy)) continue;
    if(m.objects[key(x,y)]) continue;
    const r = rng();
    if(r < 0.03) put(m,x,y, rng()<0.5?"rubble":"beam");
    else if(r < 0.055){ const above=m.tiles[(y-1)*W+x]; if(above===T.MWALL) put(m,x,y,"torch"); }
  }
  const nbrs = (x,y) => [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
  for(const [ax,ay] of [...nbrs(ux,uy), ...nbrs(ux+2,uy)]){
    const o = m.objects[key(ax,ay)]; if(o && o.kind !== "wardbell" && o.kind !== "wardup") delete m.objects[key(ax,ay)];
  }

  // ---- hide the stairs down under a KNOT (a settle-target), with a guaranteed WALKABLE route to it ----
  const walk = (x,y) => {
    if(x<1||y<1||x>=m.w-1||y>=m.h-1) return false;
    if(m.tiles[y*W+x] !== T.MFLOOR) return false;
    const o = m.objects[key(x,y)];
    return !o || WALKABLE_OBJ.has(o.kind);
  };
  const bfsTo = (tx2,ty2) => {
    const prev = {}; prev[key(ux,uy+1)] = null; const q = [[ux,uy+1]];
    for(let h=0; h<q.length; h++){ const [x,y] = q[h];
      if(x===tx2 && y===ty2) return { prev, endK:key(x,y) };
      for(const [nx,ny] of nbrs(x,y)){ const k2 = key(nx,ny);
        if(k2 in prev || !walk(nx,ny)) continue; prev[k2] = key(x,y); q.push([nx,ny]); } }
    return null;
  };
  let onPath = new Set();
  if(depth < WARD_FLOOR_MAX){
    const minDist = Math.max(6, Math.floor((m.w+m.h)/4));
    let pool = floors.filter(([x,y]) => Math.abs(x-ux)+Math.abs(y-uy) >= minDist && !(x===ux+2&&y===uy));
    if(!pool.length) pool = floors.filter(([x,y]) => !(x===ux&&y===uy) && !(x===ux&&y===uy+1) && !(x===ux+2&&y===uy));
    const [sx,sy] = pool[randiR(rng, 0, pool.length-1)];
    m.tiles[sy*W+sx] = T.MFLOOR; delete m.objects[key(sx,sy)];
    let route = bfsTo(sx,sy);
    if(!route){   // sealed pocket — carve a straight tunnel to it, clearing any prop in the way
      let x=ux, y=uy+1, g=0;
      while((x!==sx||y!==sy) && g++<300){ m.tiles[y*W+x]=T.MFLOOR;
        const o=m.objects[key(x,y)]; if(o && !WALKABLE_OBJ.has(o.kind)) delete m.objects[key(x,y)];
        if(x!==sx) x += Math.sign(sx-x); else if(y!==sy) y += Math.sign(sy-y); }
      route = bfsTo(sx,sy);
    }
    if(route){ let k2 = route.endK; while(k2){ onPath.add(k2); k2 = route.prev[k2]; } }
    m.meta.knot = {x:sx,y:sy};
    // v4.1: every 10th floor, a Great Knot GUARDS the descent instead of a plain knot — settling the
    // boss opens the stair at its spot (see settleCreature). Elsewhere, the ordinary stairs-knot.
    m.meta.bossFloor = (depth % 10 === 0);
    if(!m.meta.bossFloor) put(m, sx, sy, "knot", { hp: 5 + Math.floor(depth/3), stairs:true, shakeT:0 });
    m.subtitle = m.meta.bossFloor
      ? "Floor " + depth + "  ·  something old holds the way down"
      : "Floor " + depth + "  ·  something down here wants tending";
  } else {
    m.subtitle = "Floor " + depth + "  ·  the wing ends here — for now";
  }

  // ---- the restless things — kind by depth band, kept OFF the stairs route and away from the entry ----
  m.creatures = [];
  // Bands deepen like oreTable: the shallow families thin out, families 4–5 phase in past floor 15.
  const bag = depth < 5   ? ["wisp","wisp","wisp"]
            : depth < 10  ? ["wisp","wisp","shambler"]
            : depth < 15  ? ["wisp","shambler","shambler","embermite"]
            : depth < 20  ? ["shambler","embermite","embermite","hollowwarden"]
            : depth < 25  ? ["embermite","hollowwarden","hollowwarden","gloamtangle"]
            : depth < 30  ? ["hollowwarden","hollowwarden","gloamtangle","gloamtangle","embermite"]
            : depth < 35  ? ["gloamtangle","hollowwarden","deepknot","deepknot"]
            : depth < 40  ? ["deepknot","deepknot","gloamtangle","stargnarl"]
            :               ["deepknot","stargnarl","stargnarl","gloamtangle"];
  const count = 3 + Math.min(5, Math.floor(depth/3));   // 3 shallow → up to 8 deep
  const spots = floors.filter(([x,y]) => !onPath.has(key(x,y)) && !m.objects[key(x,y)]
    && Math.abs(x-ux)+Math.abs(y-uy) > 5);
  for(let i=0; i<count && spots.length; i++){
    const [x,y] = spots.splice(randiR(rng,0,spots.length-1),1)[0];
    m.creatures.push(mkCreature(bag[randiR(rng,0,bag.length-1)], x, y, rng));
  }
  // the boss sits ON the stair spot (rooted); settling it drops the ladder there
  if(m.meta.bossFloor && m.meta.knot){ m.creatures.push(mkCreature("greatknot", m.meta.knot.x, m.meta.knot.y, rng)); }
  m.meta.up = {x:ux,y:uy};
}

// ---- Undercroft navigation (twins of enterMine / mineDown / mineUp) ----
// Entered from the planked Guild door once state.flags.tenthDoorOpen (see the olddoor interact case).
function enterUndercroft(){
  state.wardDepth = 1; state.wardBest = Math.max(state.wardBest||0, 1);
  state.resolve = resolveMax();               // walk in whole
  travelTo("undercroft", 2*TILE+8, 3*TILE, "down");
  // v4.0.3: a one-time orienting beat on the very first descent — the settle verb + the Resolve bar.
  if(!state.flags.wardTipSeen){
    state.flags.wardTipSeen = true;
    setTimeout(() => banner("The Undercroft", "Face a restless thing and swing your Stave (Space) to settle it. Watch the RESOLVE bar — it fills back up on any safe ground, and a knockout costs you nothing."), 1100);
  } else if((state.wardBells||[]).length) {
    setTimeout(() => toast("A funded Warden's Bell will ring you down from the surface — or back up here.", "#bfe4ff"), 900);
  }
}
function wardDown(){
  if((state.wardDepth||1) >= WARD_FLOOR_MAX) return;   // floor 15 is the v4.0 bottom
  state.wardDepth = (state.wardDepth||1) + 1;
  state.wardBest = Math.max(state.wardBest||0, state.wardDepth);
  checkQuests(); travelTo("undercroft", 2*TILE+8, 3*TILE, "down");
  let stop = "";
  if(state.wardDepth % 5 === 0 && !(state.wardBells||[]).includes(state.wardDepth)){
    const id = "bell"+state.wardDepth, rem = pledgeRemaining(id), owed = [];
    if(state.pledges && state.pledges[id]){
      if(rem.g > 0) owed.push(rem.g+"g");
      for(const it in rem.mats) owed.push(rem.mats[it]+"× "+it);
      stop = "  ·  the bell here is " + owed.join(", ") + " short";
    } else stop = "  ·  a Warden's Bell waits here";
  }
  toast("You go down to floor " + state.wardDepth + "…" + stop, "#bfe4ff");
}
function exitUndercroft(){   // out the top, back into the Guild by the planked door — also the knockout landing
  state.resolve = resolveMax();
  travelTo("guild", 15*TILE+8, 2*TILE, "down");
}
function wardUp(){
  if((state.wardDepth||1) > 1){ state.wardDepth--; travelTo("undercroft", 2*TILE+8, 3*TILE, "down"); }
  else exitUndercroft();
}
// ---- Butterbrook (v3.44) — WORLD_EXPANSION.md area 3 ----
// Off the beach's WEST end, the coast opens south: wide shore-meadows, the brook winding to the
// sea under a plank footbridge, and the creamery alone at the far west — Tom's wife Nell, working
// the milk the barn's been shipping down since v3.24. Generous with distance: entrance east, dairy
// far west, the longest walk in the valley (the fiction implied "down the coast" — let it be felt).
// Fixed layout seed; daily seed only reshuffles the shore forage.
function genButterbrook(m){
  const layout = makeRng(1212);
  const rng = makeRng(1313 + state.day*7);
  const t = m.tiles;
  const fill = (x0,y0,x1,y1,tile) => { for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) t[y*W+x]=tile; };
  // ground: meadow north, sand, then the sea along the south (the coast's own shoreline sine)
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const shore = m.h-6 - Math.round(Math.sin(x*0.4)*1.4);
    if(y >= shore) t[y*W+x]=T.WATER;
    else if(y >= m.h-9) t[y*W+x]=T.SAND;
    else t[y*W+x] = layout()<0.12 ? T.FLOWERGRASS : T.GRASS;
  }
  // borders (top + both sides; the sea closes the south)
  for(let x=0;x<m.w;x++) t[0*W+x]=T.IWALL;
  for(let y=0;y<m.h;y++){ t[y*W+0]=T.IWALL; t[y*W+m.w-1]=T.IWALL; }
  // the brook — down from the meadow to the sea, a plank footbridge where the path crosses
  for(let y=1;y<m.h-9;y++){ const bx = 30 + Math.round(Math.sin(y*0.28)*3); t[y*W+bx]=T.WATER; t[y*W+bx+1]=T.WATER; }
  // the coast path, east→west along row 8 — over the brook it becomes bridge
  for(let x=1;x<=44;x++){ if(t[8*W+x]===T.WATER) t[8*W+x]=T.BRIDGE; else t[8*W+x]=T.PATH; }
  // east warp band back to the beach
  for(const wy of [7,8,9]){ t[wy*W+(m.w-1)]=T.PATH; m.warps[key(m.w-1,wy)] = { to:"beach", sx:2*TILE, sy:6*TILE, face:"right", auto:true }; }
  put(m, m.w-3, 7, "sign", {text:"→ Willowbrook Coast"});
  // the creamery at the far WEST — a red-roofed dairy; its door warps into the interior. The door
  // sits in the BOTTOM wall row (5,6) so it's reachable from the walkable meadow below — review
  // fix: it was in the top row (5,5) with a wall beneath, so the warp tile itself was solid and
  // the interior exit landed the player embedded in the wall (unstick masked it).
  fill(3,3,8,4, T.ROOF); fill(3,5,8,6, T.WALL); t[6*W+5]=T.DOOR;
  m.warps[key(5,6)] = { to:"dairy", sx:6*TILE+8, sy:6*TILE, face:"up" };
  put(m, 2, 6, "sign", {text:"Butterbrook Dairy — Nell, prop."});
  put(m, 8, 6, "churn");
  // keep the creamery's door approach clear, and the path itself
  for(let y=6;y<=9;y++) delete m.objects[key(5,y)];
  // meadow dressing — a few coastal trees + bushes, fixed so a landmark stays a landmark
  for(let i=0;i<8;i++){ const x=randiR(layout,3,42), y=randiR(layout,10,22);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) put(m, x, y, layout()<0.5?"pine":"bush"); }
  // daily shore forage — samphire on the sand (reuses the Coast Road's node)
  for(let i=0;i<6;i++){ const x=randiR(rng,3,43), y=m.h-9+randiR(rng,0,2);
    if(t[y*W+x]===T.SAND && !m.objects[key(x,y)]) put(m, x, y, "samphirenode"); }
  // the path may never be sealed
  for(let x=0;x<=44;x++){ const o=m.objects[key(x,8)]; if(o && !["sign","churn"].includes(o.kind)) delete m.objects[key(x,8)]; }
  // v4.9: Nell's Larder — the dairy's own shop stand, on the meadow by the creamery. Placed AFTER the
  // path-scrub above so it survives, and off row 8 so it never blocks the coast path.
  { delete m.objects[key(3,10)]; put(m, 3, 10, "stall", {vendor:"nell"}); put(m, 5, 10, "sign", {text:"Nell's Larder — milk, honey, and what a kitchen wants"}); }
  // v4.13: Sea Aster — Butterbrook's own salt-meadow wildflower (it grows nowhere else). A daily gather,
  // and the secret ingredient in Nell's Reserve. Reshuffles on the day-seed; kept on meadow grass and off
  // the coast path (row 8), placed after the path-scrub so it survives.
  for(let i=0;i<7;i++){ const ax=randiR(rng,6,40), ay=randiR(rng,10,m.h-11);
    if(t[ay*W+ax]===T.GRASS && !m.objects[key(ax,ay)]) put(m, ax, ay, "asternode"); }
  // a bench where the meadow meets the sea — somewhere to let the coast be the coast for a while
  { const bx=22, by=m.h-11; if(t[by*W+bx]===T.GRASS){ delete m.objects[key(bx,by)]; put(m, bx, by, "bench"); } }
}
function genDairy(m){
  genRoom(m, T.PLANK, T.IWALL);
  // the work of the place: presses, a churn, wheels ageing on the shelves
  put(m,2,2,"barrel"); put(m,4,2,"crate"); put(m,10,2,"crate"); put(m,11,2,"barrel");
  put(m,7,2,"churn");
  put(m,2,5,"crate"); put(m,11,5,"crate");
  put(m,9,6,"sign",{text:"“Clean milk, a cool room, and patience.” — Nell"});
  exitAt(m, 6, "butterbrook", 5*TILE+8, 7*TILE+8);   // land at the CENTRE of (5,7) — walkable meadow below the door (the +8 is the genStore convention; the tile top alone let the collision box graze the wall row above)
}

// ---- Starfall Ridge (v3.43) — WORLD_EXPANSION.md area 2 ----
// The mountain above the mine, finally above ground: switchbacks from the tree line through the
// scree to a snow-pale summit — the crater dell where the Guild's founding star fell, a wind-worn
// bench at the cliff edge, and a cairn that opens the panorama (the game showing its own
// geography from the one spot the fiction promised). By day: alpine forage. On CLEAR nights the
// summit gleams with Starlight Shards — the first activity gated by clock and sky, not tool tier.
// Layout on a fixed seed (landmarks never move); forage and starlight reshuffle with the day.
function genRidge(m){
  const layout = makeRng(999);                    // fixed: trail, crater, cairn, bench never move
  const rng = makeRng(111 + state.day*7);         // daily: forage + shard scatter
  const t = m.tiles;
  // three bands rising north: tree-line grass → scree → the pale summit
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    if(y >= 20)      t[y*W+x] = layout()<0.10 ? T.FLOWERGRASS : T.GRASS;   // the tree line
    else if(y >= 9)  t[y*W+x] = T.DIRT;                                    // the scree
    else             t[y*W+x] = T.SAND;                                    // the summit, snow-pale
  }
  // borders — walled all around except the south trailhead band back to the village
  for(let x=0;x<m.w;x++){ t[0*W+x]=T.IWALL; t[(m.h-1)*W+x]=T.IWALL; }
  for(let y=0;y<m.h;y++){ t[y*W+0]=T.IWALL; t[y*W+m.w-1]=T.IWALL; }
  // the switchbacks: one honest zigzag from the trailhead to the crater's lip
  const leg = (x0,x1,y) => { for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++) t[y*W+x]=T.PATH; };
  const rise = (x,y0,y1) => { for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++) t[y*W+x]=T.PATH; };
  rise(37,25,29); leg(10,37,25); rise(10,20,25); leg(10,36,20); rise(36,14,20); leg(12,36,14); rise(12,8,14); leg(12,22,8);
  for(const wy of [28,29]){ for(const wx of [36,37,38]){ t[wy*W+wx]=T.PATH; if(wy===29) m.warps[key(wx,29)] = { to:"village", sx:37*TILE, sy:2*TILE, face:"down", auto:true }; } }
  put(m, 34, 27, "sign", {text:"↓ Willowbrook Village"});
  put(m, 34, 24, "sign", {text:"⛰ The switchbacks — mind your footing (gently; nothing here bites)"});
  // the crater dell: a ring of scree on the summit, the star's old bed at its heart
  for(let y=3;y<=7;y++) for(let x=24;x<=32;x++){ if(Math.hypot(x-28,y-5)<=2.6) t[y*W+x]=T.DIRT; }
  put(m, 28, 5, "crater");
  // the cairn at the cliff edge — the panorama — and the wind-worn bench beside it
  put(m, 8, 4, "cairn"); put(m, 5, 4, "bench");
  put(m, 10, 6, "sign", {text:"The valley, from above — the cairn marks the view"});
  // the tree line: pines below, a few hardy ones straggling up the scree
  for(let i=0;i<14;i++){ const x=randiR(layout,2,43), y=randiR(layout,21,27);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) put(m, x, y, "pine"); }
  for(let i=0;i<4;i++){ const x=randiR(layout,2,43), y=randiR(layout,15,19);
    if(t[y*W+x]===T.DIRT && !m.objects[key(x,y)]) put(m, x, y, "pine"); }
  // scree stone — the mountain gives what mountains give (minable, the farm-ridge rule)
  for(let i=0;i<8;i++){ const x=randiR(layout,2,43), y=randiR(layout,10,19);
    if(t[y*W+x]===T.DIRT && !m.objects[key(x,y)]) m.objects[key(x,y)] = { kind:"stone", hp:ORES.stone.hp }; }
  // daily forage: thyme on the scree, snowdrops on the summit's edge. Nothing may land within a
  // tile of the cairn (review fix: two nodes plus the cairn could wall off one summit tile for a
  // day — cosmetic, but a sealed tile is a sealed tile).
  const nearCairn = (x,y) => Math.abs(x-8) <= 2 && Math.abs(y-4) <= 2;
  for(let i=0;i<5;i++){ const x=randiR(rng,2,43), y=randiR(rng,10,19);
    if(t[y*W+x]===T.DIRT && !m.objects[key(x,y)]) put(m, x, y, "thymenode"); }
  for(let i=0;i<4;i++){ const x=randiR(rng,2,43), y=randiR(rng,3,8);
    if(t[y*W+x]===T.SAND && !m.objects[key(x,y)] && !nearCairn(x,y)) put(m, x, y, "snowdropnode"); }
  // CLEAR days only: starlight falls on the summit overnight — gleanable after dusk (see interact)
  if(state.weather === "clear"){
    for(let i=0;i<10;i++){ const x=randiR(rng,2,43), y=randiR(rng,2,8);
      if(t[y*W+x]===T.SAND && !m.objects[key(x,y)] && !nearCairn(x,y)) put(m, x, y, "shardnode"); }
  }
  // keep the trail itself clear — a switchback you can't walk is a wall
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++)
    if(t[y*W+x]===T.PATH && m.objects[key(x,y)] && !["sign"].includes(m.objects[key(x,y)].kind)) delete m.objects[key(x,y)];
}

// ---- The Coast Road (v3.36) — WORLD_EXPANSION.md area 1 ----
// The shoreline continuing east of the beach: the road along the headland, the Gullwater river
// cutting down to its estuary, the old plank ford, and the ferry landing where the road to
// Marrow Point leaves the map (drawn continuing — the forty miles STAY forty miles). Daily regen
// via mapCache like the beach: the LAYOUT is a fixed seed so the road never moves; only the
// forage nodes reshuffle with the day.
function genCoastRoad(m){
  const layout = makeRng(777);                    // fixed: road, river, landing never move
  const rng = makeRng(888 + state.day*13);        // daily: forage + driftwood reshuffle
  const t = m.tiles;
  // ground: headland grass, then sand, then the sea along the south (the beach's own shoreline sine)
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const shore = m.h-7 - Math.round(Math.sin(x*0.45)*1.3);
    if(y >= shore) t[y*W+x]=T.WATER;
    else if(y >= m.h-10) t[y*W+x]=T.SAND;
    else t[y*W+x] = layout()<0.10 ? T.FLOWERGRASS : T.GRASS;
  }
  // borders: top + east walled; west walled except the road band (the way back to the beach)
  for(let x=0;x<m.w;x++) t[0*W+x]=T.IWALL;
  for(let y=0;y<m.h;y++){ t[y*W+0]=T.IWALL; t[y*W+m.w-1]=T.IWALL; }
  // the road: one honest line of packed earth from the beach to the landing
  for(let x=0;x<=44;x++) t[8*W+x]=T.PATH;
  for(const wy of [7,8,9]){ t[wy*W+0]=T.PATH; m.warps[key(0,wy)] = { to:"beach", sx:43*TILE, sy:6*TILE+8, face:"left", auto:true }; }
  put(m, 2, 7, "sign", {text:"← Willowbrook Coast"});
  // the Gullwater: down from the hills, under the ford, out to the sea — the estuary
  for(let y=1;y<m.h;y++){ for(const gx of [27,28,29]) if(t[y*W+gx]!==T.IWALL) t[y*W+gx]=T.WATER; }
  for(let y=m.h-10;y<m.h;y++){ for(const gx of [26,30]) if(t[y*W+gx]===T.SAND) t[y*W+gx]=T.WATER; }   // the mouth widens
  for(const gx of [27,28,29]) t[8*W+gx]=T.BRIDGE;   // the old plank ford carries the road over
  put(m, 25, 7, "sign", {text:"The Gullwater — mind the boards"});
  // the ferry landing: a grey plank dock into the sea, kept good for a boat that never comes (yet)
  for(let y=15;y<=19;y++) for(let x=39;x<=41;x++) t[y*W+x]=T.WOOD;
  put(m, 40, 19, "mooring");
  put(m, 37, 14, "sign", {text:"FERRY — Marrow Pt. · no service"});
  // the milestone at the road's east end — the road is drawn continuing past it into the wall
  put(m, 43, 7, "milestone");
  // the roadside shrine, halfway along
  put(m, 14, 7, "shrine");
  // headland trees (fixed layout — a landmark tree is a landmark)
  for(let i=0;i<10;i++){ const x=randiR(layout,3,42), y=randiR(layout,2,6);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) put(m, x, y, layout()<0.5?"pine":"oak"); }
  for(let i=0;i<6;i++){ const x=randiR(layout,3,24), y=randiR(layout,10,13);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) put(m, x, y, "bush"); }
  // daily forage: samphire on the sand, sea holly on the headland
  for(let i=0;i<7;i++){ const x=randiR(rng,3,43), y=m.h-10+randiR(rng,0,2);
    if(t[y*W+x]===T.SAND && !m.objects[key(x,y)]) put(m, x, y, "samphirenode"); }
  for(let i=0;i<5;i++){ const x=randiR(rng,3,43), y=randiR(rng,2,6);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) put(m, x, y, "hollynode"); }
  for(let i=0;i<4;i++){ const x=randiR(rng,3,43), y=m.h-10;
    if(t[y*W+x]===T.SAND && !m.objects[key(x,y)]) put(m, x, y, "driftwood"); }
  // keep the road and the ford approach clear of everything above
  for(let x=0;x<=44;x++) for(const wy of [7,8,9]) if(m.objects[key(x,wy)] && !["sign","milestone","shrine"].includes(m.objects[key(x,wy)].kind)) delete m.objects[key(x,wy)];
}
function doWarp(w){
  if(!w) return;
  if(w.mine){ enterMine(); return; }
  // entering the grove from outside always starts at Ring 1 (mirrors enterMine) — waystones,
  // not a stale groveRing, are how you skip the walk
  if(w.to === "grove" && state.map !== "grove") state.groveRing = 1;
  // walking onto the coast during a festival window: let the festival do the fade, not the warp
  if(w.to === "beach" && !isCutscene() && !state.flags.festivalActive && !state.flags.festivalPending){
    const f = festivalNow();
    if(f){ startSeasonalFestival(f); return; }
  }
  travelTo(w.to, w.sx, w.sy, w.face);
}
// You bank a checkpoint every fifth floor. Re-entering the mine drops you at the deepest one you've
// reached, so a good weather day pays off in a real dive instead of a re-trek from the top.
// Entry is always floor 1 now — the Old Lift beside the ladder is how you skip floors, and unlike
// the old invisible "cart checkpoint" (which banked your best-depth silently and no player ever
// noticed), restored lift stops are a thing you SEE, paid for, and keep forever.
function enterMine(){
  state.mineDepth = 1;
  state.deepRun = false;   // every fresh descent from the surface starts timeless; opt into a run at the lift
  travelTo("mine", 2*TILE+8, 3*TILE, "down");
  if((state.liftStops||[]).length) setTimeout(() => toast("The Old Lift hums beside the ladder — ride it to any restored stop.", "#a9b0c0"), 900);
}
function mineDown(){ state.mineDepth = (state.mineDepth||1) + 1; state.mineBest = Math.max(state.mineBest||0, state.mineDepth);
  checkQuests(); travelTo("mine", 2*TILE+8, 3*TILE, "down");
  // the toasts do the reminding, the ledger does the remembering: a part-funded stop says
  // exactly what it's still short (Grove Depths Phase 4)
  let stop = "";
  if(state.mineDepth % 5 === 0 && !(state.liftStops||[]).includes(state.mineDepth)){
    const id = "lift"+state.mineDepth;
    if(state.pledges && state.pledges[id]){
      const rem = pledgeRemaining(id), owed = [];
      if(rem.g > 0) owed.push(rem.g+"g");
      for(const it in rem.mats) owed.push(rem.mats[it]+"× "+it);
      stop = "  ·  the lift stop here is "+owed.join(", ")+" short";
    } else stop = "  ·  a lift stop waits here";
  }
  toast("You climb down to floor "+state.mineDepth+"…"+stop, "#a9b0c0"); }
function mineUp(){
  if((state.mineDepth||1) > 1){ state.mineDepth--; travelTo("mine", 2*TILE+8, 3*TILE, "down"); }
  else { state.deepRun = false; travelTo("village", 33*TILE+8, 4*TILE+8, "down"); }   // out the mine mouth — any run ends
}

// ---------------- the beach ----------------
// ---------------- the village ----------------
// v3's world split: the town moved off the farm and became its own, larger place — a plaza,
// the three story buildings, ambient neighbour houses, and the mine + coast hanging off it
// (town as the hub). Regenerated daily like the beach, so project results are laid from
// state.flags here rather than by applyProjects (which owns only the persistent farm map).
function genVillage(m){
  const rng = makeRng(444);                     // the village doesn't rearrange — it's home
  const t = m.tiles;
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const n = rng();
    t[y*W+x] = n<0.06 ? T.FLOWERGRASS : n<0.09 ? T.TALLGRASS : T.GRASS;
  }
  const set2=(x,y,v)=>{ t[y*W+x]=v; };
  const rect2=(x0,y0,x1,y1,v)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set2(x,y,v); };
  // the plaza and its roads. Layout rule (v3.1.1): every door sits ON a path, and no road ever
  // runs under a building — the old north path went straight through the Guild's footprint,
  // which buried the mine mouth behind its roof.
  rect2(14,10,26,18,T.PATH);
  for(let x=0;x<=14;x++) set2(x,14,T.PATH);          // west road — to the farm
  for(let y=7;y<=9;y++)  set2(20,y,T.PATH);          // Guild door → plaza
  for(let y=10;y<=13;y++) set2(9,y,T.PATH);          // store door → west road
  for(let x=27;x<=33;x++) set2(x,11,T.PATH);         // east lane — to Maya's door and the mine (row 11: the plaza's corner lamp sits on 10)
  set2(30,10,T.PATH);                                // stub up to Maya's door
  for(let y=4;y<=10;y++) set2(33,y,T.PATH);          // mine path — up the ridge, clear of every roof
  for(let y=18;y<=27;y++) set2(20,y,T.PATH);         // south path — to the coast
  rect2(19,25,21,27,T.PATH);                         // the coast path fans out at the map's edge
  for(let x=6;x<=34;x++) set2(x,24,T.PATH);          // south lane — the neighbours' street
  set2(6,23,T.PATH); set2(34,23,T.PATH);             // stubs to the neighbours' doors
  // west: the road home. A 3-tall warp band — hugging the map edge must still catch it.
  for(const y of [13,14,15]) m.warps[key(0,y)] = { to:"farm", sx:43*TILE, sy:15*TILE+8, face:"left", auto:true };
  m.objects[key(2,13)] = { kind:"sign", text:"← Willowbrook Farm" };
  // northeast: the Old Mine (moved off the Guild's back in v3.1.1 — its mouth is on open ridge now)
  m.objects[key(33,3)] = { kind:"mineentrance" };
  m.warps[key(33,4)] = { to:"mine", sx:0, sy:0, face:"down", auto:false, mine:true };
  m.objects[key(31,4)] = { kind:"sign", text:"⛏ The Old Mine" };
  // v3.43: the ridge trail climbs on past the mine mouth — the north edge opens at x36-38
  // (clear of the entrance at 33,3 and the festival-window story triggers that crowd it)
  for(const wx of [36,37,38]){ set2(wx,0,T.PATH); set2(wx,1,T.PATH); set2(wx,2,T.PATH); set2(wx,3,T.PATH);
    m.warps[key(wx,0)] = { to:"ridge", sx:37*TILE, sy:27*TILE, face:"up", auto:true }; }
  m.objects[key(35,2)] = { kind:"sign", text:"⛰ Starfall Ridge — the switchbacks" };
  // south: the coast. A 3×2 warp pad — walking along the very bottom of the map counts too.
  for(const x of [19,20,21]) for(const y of [26,27])
    m.warps[key(x,y)] = { to:"beach", sx:30*TILE+8, sy:3*TILE, face:"down", auto:true };
  m.objects[key(17,26)] = { kind:"sign", text:"↓ To the Coast" };
  // --- the story buildings ---
  // Tom's General Store (west of the plaza)
  rect2(7,6,12,7,T.ROOF); rect2(7,8,12,9,T.WALL); set2(9,9,T.DOOR);
  m.warps[key(9,9)] = { to:"store", sx:7*TILE+8, sy:6*TILE, face:"up" };
  m.objects[key(6,9)] = { kind:"sign", text:"Tom's General Store" };
  m.objects[key(7,10)] = { kind:"noticeboard" };
  // The Aldermans' (Maya's, east of the plaza)
  rect2(28,6,32,7,T.ROOF); rect2(28,8,32,9,T.WALL); set2(30,9,T.DOOR);
  m.warps[key(30,9)] = { to:"mayahouse", sx:6*TILE+8, sy:6*TILE, face:"up" };
  m.objects[key(27,9)] = { kind:"sign", text:"The Aldermans'" };
  // Guild of Nine Crafts (north of the plaza, the biggest roof in the valley; door centred)
  rect2(13,2,27,3,T.ROOF); rect2(13,4,27,6,T.WALL); set2(20,6,T.DOOR);
  m.warps[key(20,6)] = { to:"guild", sx:8*TILE+8, sy:8*TILE, face:"up" };
  m.objects[key(28,6)] = { kind:"sign", text:"Guild of Nine Crafts" };
  // --- ambient neighbours on the south lane (doors are latched; they open in a later chapter) ---
  rect2(4,19,8,20,T.ROOF); rect2(4,21,8,22,T.WALL); set2(6,22,T.DOOR);
  m.objects[key(9,22)] = { kind:"sign", text:"The Wrens'" };
  rect2(32,19,36,20,T.ROOF); rect2(32,21,36,22,T.WALL); set2(34,22,T.DOOR);
  m.objects[key(31,22)] = { kind:"sign", text:"The Harrows'" };
  // --- plaza dressing ---
  for(const [lx,ly] of [[14,10],[26,10],[14,18],[26,18]]) m.objects[key(lx,ly)] = { kind:"lamp" };
  // benches + planters on the plaza's north/south edge rows (y10/y18) — verified clear of the
  // arteries, the door approaches, and the Maya/Pip wander box (x15-24, y11-16), so nothing gets
  // walled in. putIf skips any tile already claimed by wing/project dressing.
  const putIf0 = (x,y,o) => { if(!m.objects[key(x,y)]) m.objects[key(x,y)] = o; };
  putIf0(16,10,{kind:"bench"}); putIf0(24,10,{kind:"bench"});
  putIf0(16,18,{kind:"plantpot"}); putIf0(24,18,{kind:"plantpot"});
  for(let i=0;i<8;i++){ const x=randiR(rng,2,m.w-3), y=randiR(rng,2,m.h-3);
    if(t[y*W+x]===T.GRASS && !m.objects[key(x,y)]) t[y*W+x]=T.FLOWERGRASS; }
  // --- Rowan's projects, as they stand ---
  if(state.flags && state.flags.proj_fountain) m.objects[key(20,14)] = { kind:"fountain" };
  if(state.flags && state.flags.proj_boardwalk){
    m.objects[key(21,25)] = { kind:"boardwalk" };
    for(const [x,y] of [[18,24],[22,24],[18,26],[22,26]]) if(!m.objects[key(x,y)]) m.objects[key(x,y)] = { kind:"lantern" };
  }
  if(state.flags && state.flags.proj_minecart) m.objects[key(35,14)] = { kind:"railcart", to:"farm" };

  // --- WHAT THE VALLEY LOST: the wings heal the village, visibly (STORY_OVERHAUL.md) ---
  // Each lit Guild wing lays its mark on the town, so the story's progress bar is the PLACE
  // waking up — not a panel. The village regenerates daily, so this is stateless and live.
  const putIf = (cond, x, y, o) => { if(cond && !m.objects[key(x,y)]) m.objects[key(x,y)] = o; };
  putIf(wingLit("farming"),  11,12, { kind:"stall" });                  // market stall by Tom's
  putIf(wingLit("farming"),  12,13, { kind:"crate" });
  putIf(wingLit("woodcutting"), 5,13, { kind:"crate" });                // fresh timber on the west road
  putIf(wingLit("woodcutting"), 7,15, { kind:"beam" });
  putIf(wingLit("mining"),   32,5,  { kind:"lantern" });                // the mine path, lit at last
  putIf(wingLit("mining"),   34,8,  { kind:"lantern" });
  putIf(wingLit("fishing"),  19,23, { kind:"barrel" });                 // the day's catch, coast path
  putIf(wingLit("fishing"),  21,23, { kind:"barrel" });
  putIf(wingLit("cooking"),  24,16, { kind:"campfire" });               // a communal cook-fire on the plaza
  putIf(wingLit("ranching"),  5,23, { kind:"trough" });                 // hay by the Wrens'
  putIf(wingLit("foraging"),  3,15, { kind:"berrybush" });              // the lanes fruit again
  putIf(wingLit("foraging"), 36,12, { kind:"berrybush" });
  putIf(wingLit("smithing"),  7,11, { kind:"anvil" });                  // an anvil rings outside the store
  if(wingLit("hearth")) for(const [x,y] of [[16,11],[24,11],[16,17],[24,17]])
    putIf(true, x, y, { kind:"lantern" });                              // lanterns strung across the plaza
  // the Lantern Test's two survivors stay up after the midpoint scene (14-story.js)
  if(state.flags && state.flags.lanternTest){
    putIf(true, 18,11, { kind:"lantern" }); putIf(true, 22,11, { kind:"lantern" });
  }
  // …and until three wings are lit, the shuttered years still show
  const lit = wingsLit();
  if(lit < 3){
    putIf(true, 5,23, { kind:"rubble" }); putIf(true, 33,23, { kind:"rubble" });
    m.objects[key(9,22)]  = { kind:"sign", text:"The Wrens' (shuttered)" };
    m.objects[key(31,22)] = { kind:"sign", text:"The Harrows' (shuttered)" };
  }
}

// ---------------- the Deep Grove ----------------
// Woodcutting's mine, for real now (Grove Depths, GROVE_DEPTHS.md): nine RINGS of forest, each
// a map generated per ring+day the way mine floors generate per depth+day. West is always
// deeper. A deadfall seals each ring's west trail — you chop through it (see useTool's Axe
// branch), and it regrows overnight with the forest. Waystones on rings 1/3/6/9 persist once
// awakened (the Pledge Ledger, 01-data.js) and step you between funded rings for free.
// Unlike the mine, the grove ENDS: ring 9 is the Heart of the Forest.
function genGrove(m){
  const ring = clamp(state.groveRing||1, 1, GROVE_RINGS);
  const rng = makeRng(777 + ring*131 + state.day*23);   // the forest rearranges itself each night
  const t = m.tiles;
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const n = rng();
    t[y*W+x] = n<0.07 ? T.FLOWERGRASS : n<0.13 ? T.TALLGRASS : T.GRASS;
  }
  // impassable border, like the coast — the forest simply thickens past walking
  for(let x=0;x<m.w;x++){ t[0*W+x]=T.IWALL; t[(m.h-1)*W+x]=T.IWALL; }
  for(let y=0;y<m.h;y++){ t[y*W+0]=T.IWALL; t[y*W+m.w-1]=T.IWALL; }

  // ---- east side: the way back (shallower) ----
  if(ring === 1){
    // ring 1 keeps the farm gate, the footpath, and the campfire clearing
    t[15*W+(m.w-1)] = T.DOOR;
    m.warps[key(m.w-2, 15)] = { to:"farm", sx:3*TILE+8, sy:26*TILE, face:"right", auto:true };   // the farm's treeline footpath (row 26 since the v3.2 shrink)
    for(let x=11;x<=m.w-2;x++) t[15*W+x]=T.PATH;
    m.objects[key(m.w-4,13)] = { kind:"sign", text:"→ Back to the Farm" };
    m.objects[key(11,14)] = { kind:"campfire" };
    // the mouth stone — the one waystone that never slept
    m.objects[key(m.w-7,13)] = { kind:"waystone", ws:"way1" };
  } else {
    // an open trail east, back toward the light (E to walk it — never blocked, never a cost)
    for(let x=m.w-5;x<=m.w-2;x++) t[15*W+x]=T.PATH;
    m.objects[key(m.w-2,15)] = { kind:"easttrail" };
  }

  // ---- west side: the way deeper ----
  if(ring < GROVE_RINGS){
    for(let x=1;x<=4;x++) t[15*W+x]=T.PATH;
    const d = DEADFALL[ring+1];
    m.objects[key(1,15)] = { kind:"deadfall", into:ring+1, lvl:d.lvl, hp:d.hp };
  } else {
    // the Heart of the Forest — the grove ends somewhere, unlike the mine
    for(let x=1;x<=8;x++) t[15*W+x]=T.PATH;
    m.objects[key(4,14)] = { kind:"hearttree" };
  }

  // ---- the ring's waystone (dormant until its pledge is filled) ----
  const wsId = { 3:"way3", 6:"way6", 9:"way9" }[ring];
  if(wsId) m.objects[key(10,13)] = { kind:"waystone", ws:wsId };

  // trees — the mix ages with the ring (Phase 2 brings the full rarity tables; for now the
  // three species shift the way the old west-gradient did, but per RING, so depth means it)
  for(let y=1;y<m.h-1;y++) for(let x=1;x<m.w-1;x++){
    // the crossing band (deadfall → east trail) stays tree-free on every ring — the grove's
    // version of the mine's guaranteed corridor, minus the BFS: a high-level tree must never
    // wall a low-level player off the trail west.
    if(Math.abs(y-15)<=1) continue;
    if(ring===1 && Math.hypot(x-11,y-14) < 3.2) continue;        // the campfire clearing
    if(wsId && Math.hypot(x-10,y-13) < 2.6) continue;            // the waystone's clearing
    if(ring===1 && Math.hypot(x-(m.w-7),y-13) < 2.4) continue;   // the mouth stone's clearing
    if(ring===GROVE_RINGS && Math.hypot(x-4,y-14) < 4.0) continue; // the Heart's hush
    if(t[y*W+x]!==T.GRASS && t[y*W+x]!==T.FLOWERGRASS && t[y*W+x]!==T.TALLGRASS) continue;
    if(m.objects[key(x,y)]) continue;
    if(rng() >= 0.34 + ring*0.008) continue;                     // old wood stands a little denser
    const kind = pickRingTree(ring, rng());                      // the rarity tables (01-data.js)
    m.objects[key(x,y)] = { kind, hp:TREES[kind].hp };
  }
  // one Ancient tree per deep ring per day — the ring's rarest species, grown old and golden
  if(ring >= ANCIENT_MIN_RING){
    const sp = ringTopSpecies(ring);
    for(let i=0;i<80;i++){
      const x=randiR(rng,4,m.w-8), y=randiR(rng,3,m.h-4);
      if(Math.abs(y-15)<=2) continue;                            // never on or crowding the band
      const g=t[y*W+x];
      if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS) && !m.objects[key(x,y)]){
        m.objects[key(x,y)] = { kind:"ancient", species:sp, hp:TREES[sp].hp*2 };
        break;
      }
    }
  }
  // the Grove Arbor (Rowan's project): lantern-posts along ring 1's footpath
  if(ring === 1 && state.flags && state.flags.proj_arbor){
    for(let x=13;x<=m.w-4;x+=4) if(!m.objects[key(x,14)]) m.objects[key(x,14)] = { kind:"lantern" };
  }
  // undergrowth to forage on the way
  let bushes=0;
  for(let i=0;i<60 && bushes<7;i++){
    const x=randiR(rng,2,m.w-3), y=randiR(rng,2,m.h-3);
    if(Math.abs(y-15)<=1) continue;                              // never on the crossing band
    const g=t[y*W+x];
    if((g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS) && !m.objects[key(x,y)]){ m.objects[key(x,y)]={kind: rng()<0.6?"berrybush":"bush"}; bushes++; }
  }
  m.subtitle = "Ring " + ring +
    (ring===GROVE_RINGS ? "  ·  the Heart of the Forest" : ring>=5 ? "  ·  the wood grows old here" : "");
}

// Ring travel — the grove's mineDown/mineUp. Deeper spawns you by the east trail of the new
// ring; back spawns you by the west trail of the shallower one. checkQuests on descent so
// future quests can hook "reach ring N" the way mine quests hook depth.
function groveDeeper(){
  state.groveRing = Math.min(GROVE_RINGS, (state.groveRing||1)+1);
  state.groveBest = Math.max(state.groveBest||0, state.groveRing);
  checkQuests();
  travelTo("grove", (44-4)*TILE, 15*TILE+8, "left");
  toast("Deeper into the wood — Ring "+state.groveRing+"…", "#8fd06a");
}
function groveBack(){
  if((state.groveRing||1) > 1){ state.groveRing--; travelTo("grove", 5*TILE, 15*TILE+8, "right"); }
}

function genBeach(m){
  const rng = makeRng(555 + state.day*17);   // the tide rearranges the sand every night
  const t = m.tiles;
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const shore = m.h-6 - Math.round(Math.sin(x*0.5)*1.3);
    if(y >= shore) t[y*W+x]=T.WATER;
    else if(y >= m.h-9) t[y*W+x]=T.SAND;
    else t[y*W+x] = rng()<0.12 ? T.FLOWERGRASS : T.GRASS;
  }
  // border so you can't wander off the sides/top (except the exit)
  for(let x=0;x<m.w;x++) t[0*W+x]=T.IWALL;
  for(let y=0;y<m.h;y++){ t[y*W+0]=T.IWALL; t[y*W+m.w-1]=T.IWALL; }
  // exit back to the village — at x=30, where the village path drops you off. It used to sit at
  // the top CENTRE, which put the festival stage (rows 4, x21-25) squarely between the door and
  // the sand: you arrived 7 tiles east of it and had to detour around the stage to leave.
  const ex = 30;
  t[0*W+ex]=T.DOOR;
  m.warps[key(ex, 1)] = { to:"village", sx:20*TILE+8, sy:26*TILE, face:"up", auto:true };
  put(m, ex-2, 1, "sign", {text:"↑ Back to the village"});
  // v3.36: the east edge opens onto the Coast Road — the shoreline continues (WORLD_EXPANSION.md).
  // The sign sits at x = m.w-3 (43) deliberately: the palm loop below reaches only to m.w-4, so
  // the landmark can never be overwritten by a palm and flicker out for a day (review fix).
  for(const wy of [5,6,7]){ t[wy*W+(m.w-1)]=T.PATH; m.warps[key(m.w-1, wy)] = { to:"coastroad", sx:2*TILE, sy:8*TILE, face:"right", auto:true }; }
  put(m, m.w-3, 5, "sign", {text:"→ The Coast Road · Marrow Pt. 39 mi"});
  // v3.44: the WEST edge opens south to Butterbrook, the coast dairy (WORLD_EXPANSION.md area 3)
  for(const wy of [5,6,7]){ t[wy*W+0]=T.PATH; m.warps[key(0, wy)] = { to:"butterbrook", sx:43*TILE, sy:8*TILE, face:"left", auto:true }; }
  put(m, 2, 5, "sign", {text:"← Butterbrook · the coast dairy"});
  // palms + driftwood
  for(let i=0;i<8;i++){ const x=randiR(rng,3,m.w-4), y=randiR(rng,3,m.h-12); if(t[y*W+x]===T.GRASS||t[y*W+x]===T.SAND) put(m,x,y,"palm"); }
  for(let y=1;y<=5;y++) delete m.objects[key(ex,y)];   // a palm must never seal the village door's approach
  for(let y=4;y<=8;y++) for(let x=m.w-4;x<m.w;x++) if(m.objects[key(x,y)] && m.objects[key(x,y)].kind==="palm") delete m.objects[key(x,y)];   // …nor the road east
  for(let i=0;i<5;i++){ const x=randiR(rng,3,m.w-4), y=m.h-9; put(m,x,y,"driftwood"); }
  // v4.9: Bram's Bait & Tackle — a plank stand up on the grass where the coast folk gather (the coast's
  // own shop). Fixed spot; clear whatever the tide left so a palm never buries it for a day.
  { const bx=13, by=m.h-11; delete m.objects[key(bx,by)]; put(m, bx, by, "stall", {vendor:"bram"}); put(m, bx-2, by, "sign", {text:"Bram's Bait & Tackle"}); }
  // forage nodes near the tideline
  for(let i=0;i<14;i++){ const x=randiR(rng,3,m.w-4), y=m.h-9+randiR(rng,0,1);
    if(t[y*W+x]===T.SAND){ const r=rng(); put(m,x,y, r<0.4?"shellnode":r<0.7?"seaweednode":r<0.9?"coralnode":"starfish"); } }
  // the morning after a storm, the sea gives it back — today only, and the map regenerates at dawn
  if(state.flags.stormWrack){
    let laid = 0;
    for(let i=0;i<40 && laid<8;i++){ const x=randiR(rng,3,m.w-4), y=m.h-10+randiR(rng,0,3);
      if(y>0 && y<m.h && t[y*W+x]===T.SAND && !m.objects[key(x,y)]){ put(m,x,y,"wrack"); laid++; } }
  }
  // festival stage (finale grounds)
  for(let x=(m.w>>1)-2;x<=(m.w>>1)+2;x++) put(m,x,4,"stage");
  put(m,(m.w>>1)+4,4,"banner"); put(m,(m.w>>1)-4,4,"banner");
  // festival dressing — strung lanterns everywhere
  const ev = beachEvent();
  if(ev){
    for(let x=3;x<m.w-3;x+=2) put(m,x,2,"lantern");
    for(let i=0;i<12;i++){ const x=randiR(rng,3,m.w-4), y=randiR(rng,6,m.h-11); if(!m.objects[key(x,y)]) put(m,x,y,"lantern"); }
    put(m,(m.w>>1)-1,3,"banner"); put(m,(m.w>>1)+1,3,"banner");
    // Each festival dresses its own grounds. Keep clear of where the cast and the player stand,
    // and stay in rows 5-11 so the dressing is actually on camera during the scene.
    const mid = m.w>>1;
    const taken = new Set([key(23,6),key(18,8),key(28,8),key(14,9),key(31,10),key(17,11),key(23,9),key(23,12)]);
    const dress = (x,y,kind) => { if(!taken.has(key(x,y))) put(m,x,y,kind); };
    if(ev === "luau"){
      dress(mid, 7, "campfire"); dress(mid-3, 7, "barrel"); dress(mid+3, 7, "crate");
    } else if(ev === "eggfair"){
      for(const [x,y] of [[19,10],[21,11],[25,10],[27,11],[16,10],[30,11],[20,7],[26,7]]) dress(x,y,"nest");
    } else if(ev === "harvest"){
      for(const x of [mid-3, mid-1, mid+1, mid+3]) dress(x, 6, "crate");
      dress(mid-2, 7, "barrel"); dress(mid+2, 7, "barrel");
    } else if(ev === "starwatch" || ev === "anniversary"){
      for(const x of [16,19,22,26,29,32]) dress(x, 11, "lantern");
    }
  }
}
// Which festival, if any, dresses the coast today. Also drives the NPC gathering.
function beachEvent(){
  if(state.flags.festivalActive) return "finale";
  const f = todaysFestival();
  return f ? f.id : null;
}

// ======================================================================
//  NPC CAST
// ======================================================================
const NPCDEF = {
  maya:  { name:"Maya",        portrait:"port_maya",  spr:"maya",  romance:true,
           loved:["Strawberry","Golden Koi","Diamond","Pearl"], liked:["Cooked","Starfruit","Carrot","Coral","Grape"] },
  tom:   { name:"Tom",         portrait:"port_tom",   spr:"tom",
           loved:["Pumpkin","Gold Ore"], liked:["Wood","Copper Ore","Iron Ore","Silverwood","Heartwood"] },   // single-word woods need naming (includes() is case-sensitive; "Silverwood" ⊅ "Wood")
  rowan: { name:"Elder Rowan", portrait:"port_rowan", spr:"rowan",
           loved:["Star Metal","Diamond"], liked:["Emerald","Ruby","Starfruit","Guild Seal","Cobalt Ore","Heartknot","Gloamstar"] },   // "Star Metal" already covers the Shard; v4.16 the deep trophies of the wing he sealed
  bram:  { name:"Bram",        portrait:"port_bram",  spr:"bram",  romance:true,
           loved:["Golden Koi","Pearl","Coelacanth"], liked:["Salmon","Coral","Cooked Salmon","Gulf Sturgeon"] },
  pip:   { name:"Pip",         portrait:"port_pip",   spr:"pip",
           loved:["Opal","Berry Bun"], liked:["Shell","Starfruit","Topaz","Wool","Melon"] },   // Opal for Gary's friend (Amethyst is Gary himself now)
  nell:  { name:"Nell",        portrait:"port_nell",  spr:"nell",
           loved:["Fine Cheese","Cheese","Prize Fleece"], liked:["Sea Aster","Milk","Wool","Honey","Large Egg","Berry Bun"] },   // Tom's wife, the coast dairy (v3.44); Sea Aster v4.13 — "Cheese" covers Fine Cheese; "Milk" covers Large Milk; "Egg" avoided (would eat plain Egg too — Large Egg is the treat)
  elias: { name:"Elias",       portrait:"port_elias", spr:"elias",
           loved:["Golden Koi","Pearl","Prize Fleece","Warden's Ash"], liked:["Trout","Salmon","Coral","Cooked","Wool","Gloam Thread","Knotwood"] },   // v4.16 the last Warden knows his own wing's spoils; ash of a settled hollow warden means the most
};

// dialogue by heart tier (index clamps); some react to progress
const NPC_LINES = {
  maya: [
    "Oh! You must be the one who took over the old farm. I'm Maya Alderman. It's... good to have someone here again. The valley's been so quiet.",
    "The pond's lovely at dusk. My father, Elias, used to catch Golden Koi there — before the Guild closed and the work dried up. He's off at the city ports now. Writes when he remembers.",
    "You've been working so hard — I can see it. The fields look alive again. Like the whole valley's waking up.",
    "I keep a sketchbook of how the festival used to look. Lanterns everywhere, music on the coast... Maybe, someday.",
    "Honestly? The days feel warmer when you wander by. Don't you dare tell Tom I said that. ♥",
    "You did all this. From weeds and dust, you made a home. I'm so glad you stayed — and that I'm here, with you. ♥",
  ],
  tom: [
    "Welcome, welcome! Coin for goods, goods for coin — that's the Tom guarantee. Counter's right here.",
    "Bring me your best crops and ore. I ship 'em down the coast — my wife runs the dairy there, sends the milk back up. Circle of life, farm-style.",
    "Rowan up at the Guild's been mumbling about you. In a good way! Mostly.",
    "You're single-handedly reviving this town's economy, you know that? I might frame your first turnip.",
  ],
  rowan: [
    "Ah. A new hand on old soil. I am Rowan — last keeper of the Guild of Nine Crafts. Look around: nine wings, all gone dark.",
    "The Guild once bound this valley together — farmers, miners, fishers, cooks, all under one roof. Then folk drifted away.",
    "Prove the crafts still live in the valley — grow, mine, fish, cook — and the wings will light again. I have watched for someone like you.",
    "Deep in the old mine there's a sealed vault. Star Metal, we called it — the Guild's founding gift. If it still glimmers, the festival can return.",
    "You've done what I could not: woken the crafts one by one. The Grand Festival is ours to reclaim. Bring the coast alight.",
  ],
  bram: [
    "Careful on the rocks. Name's Bram — I fish this coast dawn to dusk. Quieter company than people, fish.",
    "Salmon run strong here after rain. And if you're patient... folk say a Golden Koi slips in from the pond some evenings.",
    "Rowan wants the old festival back. Bah. ...Though I'll admit the lanterns on the water were something to see.",
    "You've got the touch, farmer. When the festival comes, I'll haul the biggest catch this coast has seen. Promise.",
  ],
  pip: [
    "You're the new farmer! My dad's Tom — he runs the store. Mum runs the dairy down the coast, that's where the milk comes from! Are the crops magic? Can I have one? What's your favorite rock?",
    "I found a shiny purple stone once! Rowan called it an amethyst. I keep it under my pillow.",
    "When the festival happens I'm gonna eat SO much. Miss Maya's making lanterns. Bram says he'll catch a whale. That's not real though. Right?",
  ],
  elias: [
    "So you're the one. Aldous's grandchild. …He wrote to me once, you know. Eleven years ago. I never opened it. I have it still.",
    "The koi are back in this pond. They went years without showing. Maya says they never left — I simply wasn't here to see them.",
    "I sit here most mornings now. My daughter brings me tea and pretends it's for the walk. Neither of us mentions the years. We will, one day.",
    "Eleven years is a long time to be forty miles away. …Thank you for coming and getting me. I'd have never come on my own.",
  ],
  // v3.44 Nell — Tom's wife, the coast dairy the barn ships its milk to. Warm, dry, unhurried;
  // Tom's humour with the volume turned down. These are her idle lines (heart-tiered); when she
  // has a standing order open, npcLine speaks the order instead (see the nell branch below).
  nell: [
    "So you're the one Tom won't stop going on about. The farm that woke up. I run the dairy down here — half your milk ends up in my presses, you know. Pleased to finally put a face to the pails.",
    "Tom sends the milk down, I send the cheese back up. Been that way twenty years. He tells folk it's romance. It's mostly logistics.",
    "A good cheese only wants three things: clean milk, a cool room, and patience. Two of those I can supply. The patience is on you.",
    "The meadow's kind in the evenings. I come out here when the presses are set and just… let the coast be the coast for a while.",
    "You've been good to us — good milk, and better company. Tom picked well, staying in that valley. So did I, coming down to this one.",
  ],
};
// ---- Nell's daily order (v3.44) — the buy-from-player that closes the barn → coast → cheese
// loop the v3.24/v3.33 dairy chain opened. Modelled on the noticeboard (todaysRequest), her own
// flag namespace, dairy goods only, paid at a premium + Farming XP + hearts. Rotates by the day. ----
const NELL_ORDERS = [
  { item:"Milk",        qty:5, want:"I'm short on plain milk for the morning rounds.",     line:"Five good pails — that'll see the village through breakfast. Bless you." },
  { item:"Large Milk",  qty:3, want:"I need the rich stuff — a well-loved cow's milk.",     line:"Now THAT is milk. This becomes something worth the wait. Thank you." },
  { item:"Cheese",      qty:3, want:"The shelf's bare — I could use some wheels to age.",   line:"Straight to the cool room with these. In a month they'll be somebody's Sunday." },
  { item:"Fine Cheese", qty:2, want:"A buyer up the coast asked for my very best.",         line:"Fine cheese for fine folk. You've made me look good, and I don't forget it." },
  { item:"Wool",        qty:4, want:"The dairy gets cold of an evening — I'm carding wool.", line:"Warm hands make good cheese. This'll keep the whole crew's fingers working." },
  { item:"Large Egg",   qty:3, want:"I'm baking — the good big eggs, if you've any.",        line:"Custards tonight, then. Come by tomorrow and there might be a bowl spare." },
];
function todaysNellOrder(){
  if(state.flags.nellDay === state.day) return state.flags.nellIdx >= 0 ? NELL_ORDERS[state.flags.nellIdx] : null;
  const rng = makeRng(7373 + state.day*29);
  const idx = Math.floor(rng() * NELL_ORDERS.length);
  state.flags.nellDay = state.day; state.flags.nellIdx = idx;
  return NELL_ORDERS[idx];
}
function nellOrderFilled(){ return state.flags.nellDone === state.day; }
function tryNellOrder(){
  if(nellOrderFilled()) return false;
  const o = todaysNellOrder();
  if(!o || (state.inv[o.item]||0) < o.qty) return false;
  take(o.item, o.qty);
  const pay = Math.max(90, Math.round((ITEM_SELL[o.item]||0) * o.qty * 1.6));   // a premium over Tom's counter — she pays for the trip
  state.gold += pay; bump("earned", pay); bump("requests", 1);
  addXP("Farming", 6 * o.qty);   // dairy goods feed Farming, the only skill the cheese chain pays (no Ranching skill exists)
  ensureRel("nell").points += 25;
  state.flags.nellDone = state.day;
  playSfx("coin"); floatText(state.px, state.py-24, "+"+pay+"g", "#ffce5a"); pSparkle(state.px, state.py-14, "#ffce5a", 12); refreshHUD();
  showDialog("Nell   " + heartStr(heartsOf("nell")), o.line + "\n\n(+" + pay + "g · +25 ♥)", NPCDEF.nell.portrait);
  setTimeout(() => toast(`Dairy order filled — +${pay}g, +25 ♥`, "#ffce5a"), 300);
  return true;
}
function npcStory(id){
  // festival-prep phase = the two quests before the finale. Anchored to FINALE_IDX, not QUESTS.length,
  // so appending Act Two (or anything else) can never shift this window out from under the writing.
  const near = state.questIdx >= FINALE_IDX-1 && state.questIdx <= FINALE_IDX && !state.flags.festivalDone;
  if(id==="tom"){
    // v4.17: once the tenth wing is lit, the whole cast speaks to the finale — ahead of the festival line
    // (tenthWingLit always implies festivalDone). Tom the shopkeep counts it in lanterns and custom.
    if(state.flags.tenthWingLit) return pick([
      "Ten crafts lit now, and a tenth lantern on the water come festival night. I've had to order MORE lanterns. I'm not complaining. I'm absolutely complaining. Bring me your coin.",
      "That tenth wing you woke — folk come from up the coast just to stand in the Guild and look at it lit. Good for business, good for the soul. Mostly business." ]);
    if(state.flags.festivalDone) return "Best festival in twenty years — and I'm counting the year the cake caught fire.";
    if(near) return "Whole town's whispering 'festival' again. I've ordered lanterns I can't afford. Don't you dare not pull this off.";
    // the slipped name (STORY_OVERHAUL.md hook 3): once, after you've met Rowan, before Act II names it
    if(state.questIdx >= 4 && !state.flags.hook_tomSlip && !state.flags.knowsElias){
      state.flags.hook_tomSlip = true;
      return "So you've met old Rowan! Hard man to know, that one. Him and El— …and everyone else, back in the day. Anyway! Coin for goods, that's the Tom guarantee.";
    }
    // out on the plaza at midday (the _plazaTom maybePlazaLife spawns) — a lighter, social Tom, but
    // only AFTER the story beats above have had their say, so nothing important is ever preempted
    if(curMap && curMap.id === "village") return pick([
      "Ah, the fresh air! Counter can mind itself for ten minutes. Don't tell the ledger.",
      "Good day for it. Maya's got young Pip chasing pigeons round the fountain again.",
      "It's nice — folk in the square. Wasn't always. Feels like the valley's remembering how." ]);
  } else if(id==="maya"){
    if(spouseId()==="maya") return pick([
      "Morning, love — I watered the east rows before you woke. Don't you dare argue about it. ♥",
      "Our valley. Ours. I still say it out loud sometimes, just to believe it's real. ♥",
      "Home before dark tonight? I'm trying Gran's recipe again. Bring your appetite. ♥",
      "I left something on the table for you. No, I won't say what. Go look. ♥" ]);
    if(state.flags.married) return pick([
      "You and Bram, then. …Good. Truly. He's been alone on those rocks long enough.",
      "He smiled at me in the market. Bram. Smiled. Whatever you've done to that man, keep doing it." ]);
    if(state.flags.tenthWingLit) return pick([
      "I painted the tenth wing the night it caught — warden and warden in the lantern-light, Papa insufferable, you filthy from the deep. It's the best thing I've ever done, and it hangs in the Guild now. Go and look at yourself lit up. ♥",
      "The whole hall's burning now — ten windows, all of them. I grew up sure that was just a story Gran told to get me to sleep. You went and made it a place I can paint from life." ]);
    if(state.flags.festivalDone) return "The lanterns are still drifting out past the point somewhere. I hope they never quite land. ♥";
    // the turn-in sets starMetalDelivered *after* questIdx has already advanced into `near`,
    // so give this line the one quest it belongs to, and let the sketchbook line have the last.
    if(state.flags.starMetalDelivered && state.questIdx === FINALE_IDX-1)
      return "You brought the Star Metal up? Gran used to say it caught the festival light better than anything. ...You've got that look. Something's turning.";
    if(near) return "I finished the sketchbook — every lantern, down to the last. It's the first thing I've drawn that I think might actually happen.";
  } else if(id==="rowan"){
    // v4.17: Rowan SAYS "there were always ten" in the ch8 finale — his standing line must stop insisting
    // "nine wings" the moment the tenth is lit, or he flatly contradicts himself.
    if(state.flags.tenthWingLit) return pick([
      "Ten wings, lit. I spent eleven years calling it nine because I hadn't the heart to count the one I'd sealed. You counted it for me — and lit it. I'll not run out of ways to be grateful, though I'll wear out your patience finding them.",
      "I walk the whole Guild of an evening now, window to window, all ten. I stop longest at the tenth. …I nailed that door shut with these hands. You opened it with yours. That is the difference between us — and it is the finest difference a man could hope to be on the wrong side of." ]);
    if(state.flags.festivalDone) return "Nine wings, lit. I was certain I'd die in the dark of this hall. Thank you, child — truly.";
  } else if(id==="bram"){
    if(spouseId()==="bram") return pick([
      "Watered your east rows before the tide turned. Don't thank me. …You may thank me a little. ♥",
      "Caught two. Ate one. The other's on your kitchen table, and it's the bigger one. ♥",
      "Folk keep congratulating me. I keep saying nothing. But I'm not unhappy about it. ♥",
      "Come down to the rocks tonight. Bring nothing. Just sit badly, the way you do. ♥" ]);
    if(state.flags.married) return pick([
      "Maya's good. She's been good a long while and nobody noticed. You did. …That's the whole of my opinion on it.",
      "Aye, I heard. Congratulations. …That's it. That's the speech." ]);
    if(state.flags.tenthWingLit) return "...Elias came down to the rocks the night the tenth wing lit. Didn't say much. Neither did I. We watched the water a while. Some things you settle by sitting next to them — he taught me that, though he'd not recall teaching it.";
    if(state.flags.festivalDone) return "...The lanterns looked well on the water. That's all I'll say. That's all.";
    if(near) return "Rowan wants his festival on my coast — where we sent good folk out to sea. ...Talk to Maya. I've said my piece.";
  } else if(id==="pip"){
    if(state.flags.tenthWingLit) return pick([
      "You lit the TENTH WING! Rowan says there's TEN crafts now, not nine, which means my whole LIFE the number was WRONG and nobody TOLD me. I'm not upset. I'm a LITTLE upset. Can I hold the warden's stick now? You're basically DONE!",
      "Mum says the man from the ridge — Mister Elias — SMILES now. He didn't used to. She says it's because of you and the tenth door. I think it's the cheese. I didn't say that to her." ]);
    if(near) return "IS IT FESTIVAL YET. Is it?? Mum's bringing cheese from the dairy. I'm gonna eat ALL of it. Don't tell her.";
  } else if(id==="nell"){
    // v4.17: Nell (living dairy keeper, Tom's wife) sees the finale in Elias — not in the wing itself.
    // Guarded on nellOrderFilled() so her standing daily order still surfaces first when it's open
    // (npcLine checks the order AFTER npcStory, so returning null here lets the order line through).
    if(state.flags.tenthWingLit && nellOrderFilled()) return "Elias came by the dairy this week — first time in an age he's walked the coast road just for the walking. Stood at the rail a long while and said the wing was warm, corner to corner. Whatever you did down in that dark, love, it let a tired man set something down at last. Bless you for it.";
  } else if(id==="elias"){
    // v4.17: the last Warden, the emotional centre of Act III — peace, and the craft handed on. Orla is
    // his predecessor/teacher, lost in the deep (see WARD_CHAPTERS ch6/ch7); the tenth wing is now lit.
    // Guarded off the coastroad, where his location-specific ferry-landing lines are deliberately primary.
    if(state.flags.tenthWingLit && !(curMap && curMap.id === "coastroad")) return pick([
      "The wing's lit and counted, and I've slept the night through for the first time since Orla went down. …I keep the ledger open on the kitchen table now, to a blank page. Not because it's owed — because it's yours to write in, and I like seeing your hand next to hers.",
      "Thirty years I held that wing lit alone and told myself alone was the craft. It isn't. The craft is having someone to hand it to. You gave an old warden the one thing his own teacher never got. …Go gently down there. Come up for supper. That's still the whole of it.",
      "Orla would have liked you — I'll wear the words out saying so. She settled like she meant it, and so do you, and the wing knows the difference. It leans toward the pair of you now, warm as a kept hearth." ]);
  }
  return null;
}
// v3.24: the first time you talk to a villager after you've raised something, they NOTICE — one warm,
// one-time line each (§4.6 "saw your new barn!"). After the ack flag is set they fall back to normal lines.
const NPC_RECOG = [
  { npc:"tom",   flag:"proj_coop",   ack:"ack_tom_coop",     line:"Say — that's a fine coop you raised! Means I can start selling you hens now. Folk'll have fresh eggs on the table again." },
  { npc:"pip",   flag:"proj_coop",   ack:"ack_pip_coop",     line:"You built a COOP! Are there chickens yet?? Can I name one? I'm gonna name one Sir Cluckington and he'll be the BRAVEST hen!" },
  { npc:"tom",   flag:"proj_barn",   ack:"ack_tom_barn",     line:"A whole barn now, cows and sheep both — you're running a proper farm. My wife down the coast will be thrilled for the milk trade." },
  // v3.33: the milk-trade line above gets paid off — the FIRST Cheese Press arrives as a gift from
  // the dairy down the coast (§3.4: the first machine of a chain should be given, not sold). Listed
  // AFTER the barn line and sharing its flag, so the two land as separate visits: the promise, then
  // the parcel. give: makes pendingRecog hand the item over with the line.
  { npc:"tom",   flag:"proj_barn",   ack:"ack_tom_press",    give:"Cheese Press",
    when: () => (state.inv["Cheese Press"]||0) === 0 && !(state.farm && Object.values(state.farm.objects).some(o => o.kind === "press")),   // never force a surplus press
    line:"That milk trade I mentioned? My wife sent one of her old presses up from the dairy — says any farm that supplies her milk ought to be making its own cheese. It's yours. Set it down like a hive." },
  // ---- v3.34 "Small Talk": the voiceless systems get a voice ----
  // The v3.32 audit's new defect class — "shipped ≠ integrated": ice fishing, geodes, and the
  // star monuments all worked, and no NPC ever said a word about any of them. These entries ride
  // the channels that already exist. Flags: first_<fish> set in landFish, crackedGeode in
  // crackGeode, placed_<decor> at décor placement — all backfilled for old saves in migrateSave.
  { npc:"bram",  ack:"ack_bram_icetip",                       // no flag — fires the first winter talk once the rod arm is real
    // …and stands down forever once the player has already found the ice fish themselves (either
    // one) — a discovery tip delivered after the congratulations would read as Bram forgetting.
    when: () => curSeason() === "Winter" && skillLvl("Fishing") >= 10 && !state.flags.first_Frostfin && !state.flags.first_Glassperch,
    line:"Water's gone hard. Good. Most folk put the rod away come the freeze — but there's fish that only rise through ice. Frostfin, off the pond and the coast. And out past the breakers… something clearer than the ice itself. Dress warm." },
  { npc:"bram",  flag:"first_Frostfin",   ack:"ack_bram_frostfin",
    line:"A Frostfin, was it. Most quit casting when the water hardens. The fish notice who stays. …So do I." },
  { npc:"bram",  flag:"first_Glassperch", ack:"ack_bram_glassperch",
    line:"…That's a Glassperch you landed. Eleven winters I fished this coast before my first. Don't you dare tell me how long it took you — let an old man keep one thing." },
  { npc:"pip",   flag:"crackedGeode",     ack:"ack_pip_geode",
    line:"You cracked open a ROCK and there was TREASURE inside?! …Wait. Do you think Gary has treasure inside him? …No. NO. Some rocks are friends, not presents. But can I see yours again??" },
  { npc:"pip",   flag:"placed_observatory", ack:"ack_pip_scope",
    line:"You have a TELESCOPE! A real actually-REAL one! Rowan said the Guild had one and I thought it was a made-up story! Can I look through it?? I want to find the hole where your star fell out!" },
  { npc:"rowan", flag:"placed_starobelisk", ack:"ack_rowan_obelisk",
    line:"Star metal, raised in a farmer's yard where anyone may walk up and lay a hand on it. The founders locked theirs in a vault. Yours catches the sunrise. …I think you have the right of it." },
  { npc:"maya",  flag:"placed_crystalspire", ack:"ack_maya_spire",
    line:"I could see it from the meadow last night — your spire, glowing like the mine came up for air. I sat in the grass and watched it a long while. I hope that's alright. ♥" },
  { npc:"rowan", flag:"proj_stable", ack:"ack_rowan_stable", line:"You framed a stable with your own milled beams, stone footing and all. The old carpentry lives in your hands, it seems. That was the tenth craft, though the Guild never counted it. Ride well." },
  { npc:"maya",  flag:"proj_stable", ack:"ack_maya_stable",  line:"I saw you ride past this morning — you looked so free, mane and all. The valley feels bigger and smaller at once now. Take me along the coast road someday? ♥" },
  // v4.6 "Small Talk" for the Undercroft — the whole v4 Warding layer (the tenth door, the Stave, the
  // dark under the Guild) finally registers with the cast, the same pass v3.34 did for ice-fishing and
  // geodes. Keyed off flags/milestones that already exist: tenthDoorOpen, firstKnotSettled, state.wardBest.
  { npc:"pip",   flag:"tenthDoorOpen", ack:"ack_pip_warden",   line:"There's a TENTH door?! Rowan always said nine wings. Miss Maya says you SETTLE the things down there instead of fighting them, which is boring — but she ALSO said you carry a magic warden's stick, which is extremely NOT boring. Can I see the stick? Please? I'll trade you Gary." },
  { npc:"bram",  flag:"tenthDoorOpen", ack:"ack_bram_warden",  line:"Hear you go down under the Guild now. Quiet work, tending what nobody else watches. …I fish a coast nobody thinks to thank. I know the shape of that. Good on you, farmer. Somebody ought to mind the dark, same as somebody ought to mind the sea." },
  { npc:"tom",   ack:"ack_tom_knot",   when:() => !!state.flags.firstKnotSettled,   line:"So Elias hands you a warden's stave and down you go into the cold under the Guild to settle things that grew out of old grief. …I sell hoes and seed packets, friend. We are NOT in the same line of work, and I'd like it on the record that mine is considerably safer." },
  { npc:"maya",  ack:"ack_maya_deep",  when:() => (state.wardBest||0) >= 10,        line:"Papa told me how deep you've been going. …I won't ask you to stop — I know what that wing means to him, and I'm starting to know what it means to you. Just ring the bells. Come up for supper. You two keep saying it like a joke, and I need it to stay a joke." },
  { npc:"rowan", ack:"ack_rowan_deep", when:() => (state.wardBest||0) >= 20,        line:"Twenty floors, and further. …I nailed that door shut because I couldn't bear how far down it went — and you walk into it like a body off to trim the lanterns. Which is precisely what a warden is, and precisely what I never had the nerve to be. I was only ever the fool with the hammer." },
  { npc:"nell",  ack:"ack_nell_warden",when:() => (state.wardBest||0) >= 25,        line:"Word travels even down to the dairy — the farm that woke the valley goes into the tenth wing now. …Mind yourself in that dark. The valley's short enough of good hands without losing the best of them to a hole in the ground. Come by for cheese when you're up in the light, would you." },
];
// Returns a one-time recognition line for `id` (and marks it said), or null. Called from talkNpc AND
// Tom's counter path — deliberately NOT from npcLine, so it can never be swallowed by npcStory's
// unconditional plaza/festival filler (Tom in the store is only reachable via the counter object, and
// plaza-Tom/Rowan/Maya would otherwise get their story-filler line first). Story turn-ins and heart
// events already return earlier in talkNpc, so this can't preempt anything quest-critical.
function pendingRecog(id){
  for(const r of NPC_RECOG){ if(r.npc===id && (!r.flag || state.flags[r.flag]) && !state.flags[r.ack]){   // v3.34: flag optional — a `when`-only entry (Bram's ice tip) gates itself
    if(r.when && !r.when()) continue;                       // v3.33: an entry can wait for its moment (or never come — the press gift skips owners)
    state.flags[r.ack] = true;
    if(r.give){ give(r.give, 1, true); playSfx("gift"); pSparkle(state.px, state.py-14, "#ffe6a0", 12); }   // v3.33: a recognition can carry a parcel
    return r.line; } }
  return null;
}
function npcLine(id, h){
  const st = npcStory(id); if(st) return st;   // an active story beat always speaks first
  // v3.36: Elias at the ferry landing speaks to WHERE he is — the place he sailed from,
  // faced at last from the shore side. Location beats heart-tier here, deliberately.
  if(id === "elias" && curMap && curMap.id === "coastroad") return pick([
    "Thirty-nine miles. I used to do it before lunch. …The boards are still good. I check them, time to time.",
    "From the water, this landing is the first thing you see of home. I looked at it eleven years from the wrong side.",
    "A boat could dock here tomorrow, you know. Wouldn't take much. A rope. A reason.",
    "Bram thinks I come up here to be sad. I come up here because the wind's honest. …And to be a little sad.",
  ]);
  // v3.44: when Nell has a standing order you haven't filled, she names it (so the order is
  // discoverable just by talking) — order beats heart-tier, like Elias's landing. Filled or
  // empty-handed, she falls through to her warm idle lines below.
  if(id === "nell" && !nellOrderFilled()){
    const o = todaysNellOrder();
    if(o) return `${o.want} Bring me ${o.qty} ${o.item} and there's good coin in it — more than Tom would give you, and my thanks besides.`;
  }
  const arr = NPC_LINES[id] || ["…"];
  let idx = Math.min(arr.length-1, h);
  if(id === "rowan"){
    // he points at the vault while it's still sealed, and must never regress to that hint afterwards
    if(state.flags.foundVault) idx = Math.max(idx, 4);
    else if(state.questIdx >= 7) idx = 3;
  }
  return arr[Math.min(idx, arr.length-1)];
}

// ---- placement per map & time ----
function mkNpc(id, x, y, opt={}){ return { id, x, y, face:opt.face||"down", walk:0, moving:false,
  wander:opt.wander||null, timer:0, dir:{x:0,y:0} }; }
function spawnMapNpcs(m){
  m.npcs = [];
  const h = curHour();
  if(m.id==="farm"){
    // v3: the neighbours stroll their own plaza now, not your field. The farm keeps only Elias —
    // he came home, and he fishes the pond his daughter grew up beside. Every fourth day (v3.36)
    // he walks the coast road instead, to stand at the landing he sailed from — see below.
    if(state.flags.act2Done && h>=7 && h<19 && state.day % 4 !== 0) m.npcs.push(mkNpc("elias", 32*TILE, 25*TILE, {face:"right"}));
  } else if(m.id==="coastroad"){
    // v3.36: the ferryman at the ferry landing, looking the other way for once — north, toward
    // the town he finally left. Same hours as his pond days; only the fourth days — and never on
    // a festival date (review fix: the beach cast includes him all day on those dates, and the
    // Star-Watch lands on a %4 day EVERY year; a festival always outranks the landing).
    if(state.flags.act2Done && h>=7 && h<19 && state.day % 4 === 0 && !beachEvent()) m.npcs.push(mkNpc("elias", 40*TILE, 16*TILE, {face:"down"}));
  } else if(m.id==="butterbrook"){
    // v3.44: of an evening (18:30–22:00) Nell walks the meadow; by day she's inside the creamery
    // (below, Tom's shopkeeper model — never two places), and after 22:00 she's home abed like
    // every other neighbour (review fix: the old `h<7` had her wandering the meadow at 1am, which
    // both looked odd and disagreed with the world-map dot).
    if(h>=18.5 && h<22) m.npcs.push(mkNpc("nell", 16*TILE, 14*TILE, {wander:{x0:12,y0:11,x1:24,y1:18}}));
  } else if(m.id==="dairy"){
    if(h>=7 && h<18.5) m.npcs.push(mkNpc("nell", 6*TILE+8, 3*TILE, {face:"down"}));
  } else if(m.id==="village"){
    if(h>=7 && h<18.5) m.npcs.push(mkNpc("maya", 24*TILE, 12*TILE, {wander:{x0:15,y0:11,x1:25,y1:17}}));
    if(h>=8 && h<19)   m.npcs.push(mkNpc("pip",  17*TILE, 16*TILE, {wander:{x0:15,y0:11,x1:25,y1:17}}));
  } else if(m.id==="store"){ m.npcs.push(mkNpc("tom", 7*TILE+8, 2*TILE+8, {face:"down"})); }
  else if(m.id==="mayahouse"){ if(h>=18.5 || h<7) m.npcs.push(mkNpc("maya", 6*TILE, 4*TILE, {face:"down"})); }
  else if(m.id==="guild"){ m.npcs.push(mkNpc("rowan", 8*TILE+8, 5*TILE, {face:"down"})); }
  else if(m.id==="beach"){
    if(state.flags.reunionScene){              // staged cast for the homecoming cutscene
      m.npcs.push(mkNpc("bram",  13*TILE, 11*TILE, {face:"right"}));
      m.npcs.push(mkNpc("maya",  22*TILE, 11*TILE, {face:"down"}));
      m.npcs.push(mkNpc("elias", 23*TILE+8, 3*TILE, {face:"down"}));   // walking down the coast path
    } else if(beachEvent()){                   // on a festival day the whole valley is on the sand
      m.npcs.push(mkNpc("rowan", 23*TILE+8, 6*TILE, {face:"down"}));
      m.npcs.push(mkNpc("tom",   18*TILE, 8*TILE, {face:"down"}));
      m.npcs.push(mkNpc("maya",  28*TILE, 8*TILE, {face:"down"}));
      m.npcs.push(mkNpc("bram",  14*TILE, 9*TILE, {face:"right"}));
      m.npcs.push(mkNpc("pip",   31*TILE, 10*TILE, {face:"left", wander:{x0:28,y0:8,x1:34,y1:13}}));
      if(state.flags.act2Done) m.npcs.push(mkNpc("elias", 17*TILE, 11*TILE, {face:"right"}));
    } else {
      m.npcs.push(mkNpc("bram", 9*TILE, (m.h-9)*TILE, {face:"down"}));
    }
  }
}
function updateNpcs(dt){
  if(!curMap) return;
  for(const n of curMap.npcs){
    if(!n.wander){ n.moving=false; continue; }
    n.timer -= dt;
    if(n.timer <= 0){ n.timer = rand(1.2,3.0);
      n.dir = chance(0.4) ? {x:0,y:0} : { x:[-1,0,1][randi(0,2)], y:[-1,0,1][randi(0,2)] }; }
    n.moving = (n.dir.x||n.dir.y)!==0;
    if(n.moving){
      const sp=22*dt, nx=n.x+n.dir.x*sp, ny=n.y+n.dir.y*sp;
      const w=n.wander;
      if(nx>w.x0*TILE&&nx<w.x1*TILE&&ny>w.y0*TILE&&ny<w.y1*TILE && !isSolidTile(Math.floor(nx/TILE),Math.floor(ny/TILE)) && !objBlocks(objAt(Math.floor(nx/TILE),Math.floor(ny/TILE)))){ n.x=nx; n.y=ny; }
      else n.timer=0;
      if(n.dir.y<0)n.face="up"; else if(n.dir.y>0)n.face="down"; else if(n.dir.x<0)n.face="left"; else if(n.dir.x>0)n.face="right";
      n.walk += dt*7;
    } else n.walk=0;
  }
}
function nearestNpc(range){
  if(!curMap) return null; let best=null, bd=range;
  for(const n of curMap.npcs){ const d=dist2(state.px,state.py,n.x,n.y); if(d<bd){ bd=d; best=n; } }
  return best;
}

// ---- animals (chickens) ----
// v3.35 "The Flock": every animal has a NAME (assigned at purchase; backfilled for old saves in
// migrateSave). The very first hen a farm ever gets is Sir Cluckington — paying off Pip's coop
// line, two releases of foreshadowing finally cashed. Names live on the persistent record.
const ANIMAL_NAMES = ["Clementine","Butterscotch","Petal","Waddles","Dot","Mabel","Hazel","Poppy",
  "Tansy","Bluebell","Nutmeg","Ginger","Olive","Primrose","Bess","Daisy","Snowdrop","Bramble",
  "Fern","Pippa","Thistle","Marigold","Cocoa","Puddle"];   // (no overlap with HORSE_NAMES)
function nameAnimal(){
  const all = [...state.animals.chickens, ...(state.animals.cows||[]), ...(state.animals.sheep||[])];
  const used = new Set(all.map(a => a.name).filter(Boolean));
  const start = (state.day*3 + used.size*7) % ANIMAL_NAMES.length;   // deterministic, no reroll savescumming
  for(let i=0; i<ANIMAL_NAMES.length; i++){ const n = ANIMAL_NAMES[(start+i)%ANIMAL_NAMES.length]; if(!used.has(n)) return n; }
  return "Little One";
}
// The bond, visible: 5 hearts at 50 friend apiece (cap 250) — the Large-produce threshold (180)
// sits at ~3½ hearts, so the hearts a player watches grow ARE the road to the good pail.
function flockHearts(c){ const h = Math.min(5, Math.floor((c.friend||0)/50)); let s = ""; for(let i=0;i<5;i++) s += i<h ? "♥" : "♡"; return s; }
function spawnAnimals(m){
  m.animals = [];
  if(m.id === "coop"){
    state.animals.chickens.forEach((c,i) => {
      m.animals.push({ ref:c, species:"chicken", speed:15, x:(3 + (i%4)*2)*TILE+8, y:(4 + Math.floor(i/4))*TILE+8,
        dir:{x:0,y:0}, timer:0, walk:0, moving:false, face: i%2?"left":"right" });
    });
  } else if(m.id === "barn"){
    (state.animals.cows||[]).forEach((c,i) => {
      m.animals.push({ ref:c, species:"cow", speed:7, x:(3 + (i%2)*5)*TILE+8, y:(4 + Math.floor(i/2)*3)*TILE+8,
        dir:{x:0,y:0}, timer:0, walk:0, moving:false, face: i%2?"left":"right" });
    });
    // sheep share the barn — placed on a distinct tile base (6,4)(10,4)(6,7)(10,7) that dodges the
    // four cow tiles and every barn prop, so no two animals ever spawn stacked
    (state.animals.sheep||[]).forEach((c,i) => {
      m.animals.push({ ref:c, species:"sheep", speed:9, x:(6 + (i%2)*4)*TILE+8, y:(4 + Math.floor(i/2)*3)*TILE+8,
        dir:{x:0,y:0}, timer:0, walk:0, moving:false, face: i%2?"left":"right" });
    });
  } else if(m.id === "farm" && state.weather === "clear" && curSeason() !== "Winter"){
    // v3.35: the fair-weather yard. On clear (non-winter) days the flock takes the grass strip in
    // front of its buildings — the SAME wrappers as indoors, so petting and the day's egg/milk/wool
    // work in the open air (a chore made a stroll). A home+leash on each wrapper (see updateAnimals)
    // keeps the wander near the buildings; nothing is saved beyond what already persists — this
    // whole cast list is rebuilt on every map entry, exactly like the coop's.
    // Every stamp goes through freeSpot (review fix): the preferred tile can be OCCUPIED — the
    // minecart line's railcart sits at (14,7), the first hen's slot, and any of these grass tiles
    // can hold a player's keg or décor. An animal spawned at a blocked tile's centre can never
    // step out (the move check tests the destination tile, and every sub-pixel step from a centre
    // lands on the same tile) — so probe neighbours, and if nothing near is free, stay in today.
    const freeSpot = (tx,ty) => {
      for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[2,0],[-2,0],[0,-1]]){
        const x = tx+dx, y = ty+dy, o = m.objects[key(x,y)];
        if(!SOLID.has(m.tiles[y*W+x]) && !objBlocks(o)) return { x:x*TILE+8, y:y*TILE+8 };
      }
      return null;
    };
    const yard = [];
    const stamp = (c, species, speed, tx, ty) => { const p = freeSpot(tx,ty); if(p) yard.push({ ref:c, species, speed, x:p.x, y:p.y }); };
    if(state.flags.proj_coop) state.animals.chickens.forEach((c,i) => stamp(c, "chicken", 15, 14 + (i%4), 7 + Math.floor(i/4)));
    if(state.flags.proj_barn){
      (state.animals.cows||[]).forEach((c,i) => stamp(c, "cow", 7, 20 + (i%2)*3, 7 + Math.floor(i/2)));
      (state.animals.sheep||[]).forEach((c,i) => stamp(c, "sheep", 9, 24 + (i%2)*2, 7 + Math.floor(i/2)));
    }
    yard.forEach((a,i) => m.animals.push(Object.assign(a, { dir:{x:0,y:0}, timer:0, walk:0, moving:false,
      face: i%2?"left":"right", home:{ x:a.x, y:a.y, r:40 } })));
  }
}
function updateAnimals(dt){
  if(!curMap || !curMap.animals.length) return;
  for(const a of curMap.animals){
    a.timer -= dt;
    if(a.timer <= 0){ a.timer = rand(0.8,2.4); a.dir = chance(0.5)?{x:0,y:0}:{x:[-1,0,1][randi(0,2)],y:[-1,0,1][randi(0,2)]}; }
    // v3.35: yard animals carry a home+leash — past the radius, the next step is homeward.
    // Interiors have walls; the open farm needs this so a hen never ends up in the crop rows.
    // The homeward step probes half a tile ahead and falls back diagonal → x-only → y-only;
    // if all three are blocked (a wall pocket), the wander's own reroll stands for this cycle —
    // overriding it every frame made the blocked-step recovery dead code and pinned animals
    // marching in place against the coop wall (review fix).
    if(a.home && Math.hypot(a.x-a.home.x, a.y-a.home.y) > (a.home.r||40)){
      const hx = Math.sign(a.home.x-a.x), hy = Math.sign(a.home.y-a.y);
      for(const d of [{x:hx,y:hy},{x:hx,y:0},{x:0,y:hy}]){
        if(!d.x && !d.y) continue;
        const px2 = Math.floor((a.x+d.x*8)/TILE), py2 = Math.floor((a.y+d.y*8)/TILE);
        if(!isSolidTile(px2,py2) && !objBlocks(objAt(px2,py2))){ a.dir = d; break; }
      }
    }
    a.moving = (a.dir.x||a.dir.y)!==0;
    if(a.moving){
      const sp=(a.speed||15)*dt, nx=a.x+a.dir.x*sp, ny=a.y+a.dir.y*sp, bx=Math.floor(nx/TILE), by=Math.floor(ny/TILE);
      if(!isSolidTile(bx,by) && !objBlocks(objAt(bx,by))){ a.x=nx; a.y=ny; } else a.timer=0;
      if(a.dir.x<0) a.face="left"; else if(a.dir.x>0) a.face="right";
      a.walk += dt*8;
    } else a.walk=0;
  }
}
function nearestAnimal(range){
  if(!curMap || !curMap.animals.length) return null; let best=null, bd=range;
  for(const a of curMap.animals){ const d=dist2(state.px,state.py,a.x,a.y); if(d<bd){ bd=d; best=a; } }
  return best;
}
function petChicken(a){
  const c = a.ref, nm = c.name || "the hen";
  if(c.eggDay !== state.day){ c.eggDay = state.day; const large = c.friend>=180 && chance(0.5);
    give(large?"Large Egg":"Egg", 1); c.friend = Math.min(250, c.friend+8);
    playSfx("get"); pSparkle(a.x, a.y-8, "#fff6d0", 6); floatText(a.x, a.y-14, "+egg", "#ffe08a");
    maybeFirstLarge(large); }
  else if(c.petDay !== state.day){ c.petDay = state.day; c.friend = Math.min(250, c.friend+3);
    toast(`You pet ${nm}. ${flockHearts(c)}`, "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-8, "#ff9ab0", 4); }
  else toast(`${nm} has had enough fuss for today.`);
}
// v3.35: the friend>=180 threshold used to be entirely invisible — the first time an animal gives
// its best, the moment gets a beat that names the mechanic (the firstTimber pattern).
function maybeFirstLarge(large){
  if(!large || state.flags.firstLargeProduce) return;
  state.flags.firstLargeProduce = true;
  showDialog("The Best She Has",
    "A larger, richer gift than any morning before — and she watches you take it, easy and unbothered. Somewhere in all those mornings you stopped being the farmer and started being family.\n\n(A well-loved animal — hearts most of the way full — gives its best about half the time.)", null);
}
function buyChicken(){
  if(!state.flags.proj_coop){ toast("You'll want a coop first — raise one from the Ledger (Rowan can help)."); playSfx("error"); return; }
  if(state.animals.chickens.length >= 6){ toast("Your coop is full (6 hens)."); return; }
  if(state.gold < 300){ toast("Not enough coin (300g)."); playSfx("error"); return; }
  state.gold -= 300;
  // the first hen a farm EVER gets is Sir Cluckington — Pip called it at the coop-raise (NPC_RECOG)
  const nm = state.animals.chickens.length === 0 ? "Sir Cluckington" : nameAnimal();
  state.animals.chickens.push({ friend:0, eggDay:0, petDay:0, name:nm });
  toast(nm === "Sir Cluckington" ? "Sir Cluckington joins the coop! 🐔 Pip will be beside himself." : `${nm} joins the coop! 🐔`, "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop();
}

// ---- cows ----
function petCow(a){
  const c = a.ref, nm = c.name || "the cow";
  if(c.milkDay !== state.day){
    c.milkDay = state.day;
    const large = c.friend >= 180 && chance(0.5);
    give(large ? "Large Milk" : "Milk", 1);
    c.friend = Math.min(250, c.friend + 8);
    playSfx("get"); pSparkle(a.x, a.y-10, "#eaf4fb", 7); floatText(a.x, a.y-16, large?"+big milk":"+milk", "#dfeaf2");
    maybeFirstLarge(large);
  } else if(c.petDay !== state.day){
    c.petDay = state.day; c.friend = Math.min(250, c.friend + 3);
    toast(`${nm} leans into your hand. ${flockHearts(c)}`, "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-10, "#ff9ab0", 4);
  } else toast(`${nm} has been milked and fussed over already today.`);
}
function buyCow(){
  if(!state.flags.proj_barn){ toast("You'll need a barn first — raise one from the Ledger."); playSfx("error"); return; }
  if(!state.animals.cows) state.animals.cows = [];
  if(state.animals.cows.length >= 4){ toast("Your barn is full (4 cows)."); return; }
  if(state.gold < 600){ toast("Not enough coin (600g)."); playSfx("error"); return; }
  state.gold -= 600;
  const nm = nameAnimal();
  state.animals.cows.push({ friend:0, milkDay:0, petDay:0, name:nm });
  toast(`${nm} ambles into the barn. 🐄`, "#8fd06a"); playSfx("coin"); refreshHUD(); renderShop();
}

// ---- sheep ----
// A coat is ready WOOL_REGROW days after the last shearing (woolDay stamps the last shear). Unlike
// milk/eggs (daily), wool takes its time — a coat's worth waiting for, and it keeps a flock from
// out-earning the field. New sheep grow their first coat over the same span (buySheep stamps today).
function woolReady(c){ return (state.day - (c.woolDay||0)) >= WOOL_REGROW; }
function shearSheep(a){
  const c = a.ref;
  // A full coat + shears is the payoff; a truly cherished sheep (friend>=180) grows a Prize Fleece,
  // mirroring the Large Milk/Egg tier so a sheep's friendship is never dead state.
  const nm = c.name || "the sheep";
  if(woolReady(c) && state.flags.hasShears){
    c.woolDay = state.day;
    const prize = c.friend >= 180 && chance(0.5);
    give(prize ? "Prize Fleece" : "Wool", 1);
    c.friend = Math.min(250, c.friend + 8);
    playSfx("get"); pSparkle(a.x, a.y-10, "#f6f6fa", prize?10:7);
    floatText(a.x, a.y-16, prize?"+prize fleece":"+wool", prize?"#ffe6a0":"#e8e8ee");
    maybeFirstLarge(prize);
    return;
  }
  // Anything else falls through to a friendly pet — a full-coated sheep is never un-pettable, and
  // the "get shears" nudge is a warm hint, not an error buzz on every press (review fix, v3.8).
  if(c.petDay !== state.day){
    c.petDay = state.day; c.friend = Math.min(250, c.friend + 3);
    const nudge = woolReady(c) && !state.flags.hasShears
      ? `${nm}'s coat is full — shears from Tom's would gather it. She leans into your hand anyway. ${flockHearts(c)}`
      : `${nm} leans into your hand. ${flockHearts(c)}`;
    toast(nudge, "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-10, "#ff9ab0", 4);
  } else toast(`${nm} has had plenty of fuss today.`);
}
function buySheep(){
  if(!state.flags.proj_barn){ toast("You'll need a barn first — raise one from the Ledger."); playSfx("error"); return; }
  if(!state.animals.sheep) state.animals.sheep = [];
  if(state.animals.sheep.length >= SHEEP_MAX){ toast(`Your barn's flock is full (${SHEEP_MAX} sheep).`); return; }
  if(state.gold < SHEEP_COST){ toast(`Not enough coin (${SHEEP_COST}g).`); playSfx("error"); return; }
  state.gold -= SHEEP_COST;
  // stamp woolDay=today so the first coat grows over WOOL_REGROW days, the same as every coat after
  const nm = nameAnimal();
  state.animals.sheep.push({ friend:0, woolDay:state.day, petDay:0, name:nm });
  toast(`${nm} trots into the barn. 🐑  Her coat will want a few days to grow.`, "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop();
}
function buyShears(){
  if(state.flags.hasShears){ toast("You've already a good pair of shears."); return; }
  if(state.gold < SHEARS_COST){ toast(`Not enough coin (${SHEARS_COST}g).`); playSfx("error"); return; }
  state.gold -= SHEARS_COST; state.flags.hasShears = true; give("Shears", 1, true);
  toast("A fine pair of shears. Now the wool is yours for the gathering.", "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop();
}
function buySapling(k, n){
  const t = FRUIT_TREES[k]; if(!t) return;
  if(state.gold < t.cost){ toast(`Not enough coin (${t.cost}g).`); playSfx("error"); return; }
  n = Math.max(1, Math.min(n||1, Math.floor(state.gold / t.cost)));   // v3.41: buy several, clamped to the purse
  state.gold -= t.cost * n; give(t.name, n, true);
  toast(`${n>1 ? n+"× " : "A "}${t.name}${n>1?"s":""}. Press R to select it, then plant it on open grass.`, "#8fd06a");
  playSfx("coin"); refreshHUD(); refreshHotbar(); renderShop();
}
function buyHive(){
  if(state.gold < HIVE_COST){ toast(`Not enough coin (${HIVE_COST}g).`); playSfx("error"); return; }
  state.gold -= HIVE_COST; give("Beehive", 1, true);
  toast("A hive. Set it where the flowers are — the bees will do the rest.", "#e8a83a");
  playSfx("coin"); refreshHUD(); refreshHotbar(); renderShop();
}

// the Cellar's machines cost wood + ore + coin, like every good tool since Tempered Tools
function buyMachine(mk){
  const M = MACHINES[mk]; if(!M) return;
  if(mk === "press" && !state.flags.ack_tom_press){ playSfx("error"); return; }   // v3.33: the first press is the dairy's gift, never a purchase
  if(state.gold < M.cost.g || !Object.keys(M.cost.mats).every(it => (state.inv[it]||0) >= M.cost.mats[it])){
    playSfx("error"); return; }
  state.gold -= M.cost.g;
  for(const it in M.cost.mats) take(it, M.cost.mats[it]);
  give(M.name, 1, true);
  toast(`One ${M.name.toLowerCase()}, ready for the yard. Select it like a seed and set it down.`, "#cbb98f");
  playSfx("coin"); refreshHUD(); refreshHotbar(); renderShop();
}

// décor: a pure coin sink (§3.6). Buy a cosmetic piece; select it like a seed and set it on the farm.
function buyDecor(dk){
  const D = DECOR[dk]; if(!D) return;
  if(D.qpGate && !state.flags.qpAllTold){ toast("Tom keeps that one for whoever finishes the valley's whole book of tasks."); playSfx("error"); return; }   // v3.32: the quest cape
  if(state.gold < D.cost){ toast(`Not enough coin (${D.cost.toLocaleString()}g).`); playSfx("error"); return; }
  if(D.mats && !Object.keys(D.mats).every(it => (state.inv[it]||0) >= D.mats[it])){
    toast("You're short on materials for that one — the deep's finest doesn't come cheap."); playSfx("error"); return; }   // v3.29
  state.gold -= D.cost;
  if(D.mats) for(const it in D.mats) take(it, D.mats[it]);   // v3.29: the star tier eats terminal materials
  give(D.name, 1, true);
  toast(D.cost >= 100000 ? "A solid-gold you. The valley will never let you hear the end of it. ✦"
                         : `One ${D.name.toLowerCase()}. Select it like a seed and set it where it belongs.`, "#ffe6a0");
  playSfx("coin"); refreshHUD(); refreshHotbar(); renderShop();
}

function buyBouquet(){
  if(state.gold < 500 || (state.inv["Bouquet"]||0) > 0){ return; }
  state.gold -= 500; give("Bouquet",1,true);
  toast("A Willowbrook bouquet — you know who it's for. 💐", "#ff9ab0"); playSfx("coin"); refreshHUD(); renderShop();
}

// ---- relationships ----
function heartsOf(id){ const r=state.rel[id]; return r ? Math.min(6, Math.floor(r.points/100)) : 0; }
function heartStr(h){ let s=""; for(let i=0;i<6;i++) s += i<h ? "♥":"♡"; return s; }
function talkNpc(id){
  const r = ensureRel(id), def = NPCDEF[id];
  if(r.talkedDay !== state.day){ r.talkedDay = state.day; r.points += 15;
    floatText(state.px, state.py-24, "+15 ♥", "#ff7d9c"); playSfx("heart"); checkQuests(); }
  // that checkQuests() may have just tripped the finale — don't open a scene a festival would eat
  if(state.flags.festivalPending || state.flags.festivalActive || state.flags.seasonalActive) return;
  if(tryTurnIn(id)) return;
  // the bouquet only means something to someone who has already told you where they stand
  if(def.romance && state.flags["confided_"+id] && !state.flags.married && (state.inv["Bouquet"]||0) > 0){
    startMarriage(id); return; }
  const ev = heartEventFor(id);
  if(ev){ state.flags[ev.flag] = true; startCutscene(ev.steps); return; }
  // Bram gives up one legend for every heart. It's a secret, not a wiki page.
  if(id === "bram"){
    const c = bramClueDue(); if(c){ tellClue(c); return; }
    // land all five and the Hunt is crowned — Bram hands over his own oilskin
    if(legendsCaught() >= LEGENDS.length && !state.flags.huntCrowned){ startHuntCrown(); return; }
  }
  // Pip presses your first fruit tree on you — the orchard, learned hands-on before you'd buy one blind.
  if(id === "pip" && !state.flags.gotFirstSapling && heartsOf("pip") >= 2){
    state.flags.gotFirstSapling = true;
    give("Apple Tree", 1, true);
    playSfx("gift"); pSparkle(state.px, state.py-14, "#d0403a", 12);
    showDialog("Pip   " + heartStr(heartsOf("pip")),
      "I grew it from a PIP! Get it — a pip! That's my name AND the thing inside an apple. Best joke ever, nobody agrees.\n\n" +
      "Plant it on grass — tap R till you've got it, then Space. It takes ALL season, and then it makes apples FOREVER. Mum knows everything about trees.",
      "port_pip");
    return;
  }
  if(id === "nell" && tryNellOrder()) return;  // v3.44: her standing dairy order fills the moment you can meet it
  if(tryFulfillRequest(id)) return;           // scripted scenes always outrank the noticeboard
  const rec = pendingRecog(id);               // v3.24: "saw your new barn!" — a one-time nod, before the filler line
  if(rec){ showDialog(def.name + "   " + heartStr(heartsOf(id)), rec, def.portrait); return; }
  showDialog(def.name + "   " + heartStr(heartsOf(id)), npcLine(id, heartsOf(id)), def.portrait);
}
function giftPref(def, item){
  const loved = def.loved.some(x => item.includes(x));
  const liked = def.liked.some(x => item.includes(x));
  // ★ Comfort Food (Cooking 75) — anything off your stove is treasured by those who like cooking.
  // Note the plain `liked` test can't see recipe dishes: "Fried Egg" doesn't contain "Cooked".
  if(!loved && def.liked.includes("Cooked") && hasMastery("Cooking",75)
     && (RECIPE_NAMES.has(item) || item.startsWith("Cooked "))) return "loved";
  return loved ? "loved" : liked ? "liked" : "";
}
function giftNpc(id){
  const r = ensureRel(id), def = NPCDEF[id];
  if(r.giftedDay === state.day){ showDialog(def.name+"   "+heartStr(heartsOf(id)), "You already gave me something today — you're too kind. Save the rest for tomorrow. ♥", def.portrait); return; }
  const giftables = Object.keys(state.inv).filter(i => ITEM_SELL[i] && ITEM_SELL[i]>0 && !i.endsWith("Seeds"));
  if(!giftables.length){ toast("Nothing to give — crops, fish, gems and cooked food work."); return; }
  openGiftPicker(id, giftables);
}
function giftNpcItem(id, item){
  const r = ensureRel(id), def = NPCDEF[id];
  if(r.giftedDay === state.day || !state.inv[item]) return;
  r.giftedDay = state.day; take(item);
  const pref = giftPref(def, item);
  const bday = isBirthday(id);
  let pts = pref==="loved" ? 90 : pref==="liked" ? 55 : 28;
  if(bday){ pts *= 3; state.flags["bday_"+id+"_"+YEAR()] = true; }   // showing up on the day matters
  r.points += pts; floatText(state.px, state.py-24, "+"+pts+" ♥", "#ff7d9c");
  playSfx(bday ? "level" : "gift"); checkQuests();
  pSparkle(state.px, state.py-14, "#ff9ab0", bday ? 20 : 10);
  closePanel("giftPanel");
  const line = bday ? BIRTHDAY_LINES[id] || `On my birthday? Oh — you remembered. Thank you. ♥`
    : pref==="loved" ? `A ${item}?! My very favorite. You remembered — thank you!`
    : pref==="liked" ? `Ooh, ${item} — I do like these. That's thoughtful of you.`
    :                  `Aw, a ${item}? That's sweet. Thank you.`;
  showDialog(def.name+"   "+heartStr(heartsOf(id)) + (bday ? "   🎂" : ""), line, def.portrait);
  queuePage(7, 1500);                                          // "On Giving"
}

const BIRTHDAY_LINES = {
  maya: "You remembered. Nobody's remembered since Gran. …I'm not crying, the wind's up. Thank you. ♥",
  tom:  "My birthday! And a gift! Do you know how long it's been since — no, never mind, this is a happy day. Marked in the ledger. In ink. ♥",
  rowan:"Eighty-one years and a present. …When you get to my age, child, it isn't the gift. It's that someone counted the days. ♥",
  bram: "…You knew the date. I never told you the date. …Maya told you, didn't she. …Thank you. Truly. ♥",
  pip:  "IT'S MY BIRTHDAY AND YOU KNEW! Mum said nobody outside a family remembers. Mum is WRONG. Best day. BEST DAY. ♥",
};
