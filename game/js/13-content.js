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
  beach:     { w:46, h:24, outdoor:true, name:"Willowbrook Coast", subtitle:"salt on the breeze", music:"beach", bg:"#2f4a63", gen:genBeach },
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
  // Rowan's desk area
  put(m,7,3,"desk"); put(m,8,3,"desk"); put(m,6,3,"bookshelf"); put(m,10,3,"bookshelf");
  put(m,9,3,"ledger");                    // the valley's unfinished work, in Rowan's hand
  put(m,2,5,"anvil"); put(m,14,5,"bookshelf"); put(m,2,3,"plantpot"); put(m,14,3,"plantpot");
  // central carpet
  for(let y=5;y<=7;y++) for(let x=6;x<=10;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,4,7,"crate"); put(m,12,7,"barrel");
  put(m,1,7,"sign",{text:"Nine crafts. Nine wings. Tend them all, and the valley wakes."});
  exitAt(m,8,"village",20*TILE+8,7*TILE+8);   // just below the Guild door, on its path
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
  floor(dx,dy); floor(dx-1,dy); floor(dx,dy-1); put(m,dx,dy,"ladderdown");
  // the Old Lift stands by the entry ladder on every floor — the way out is never a climb
  floor(ux+2,uy); floor(ux+2,uy+1); floor(ux+3,uy); put(m,ux+2,uy,"lift");
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
  const oreTable = depth<5  ? ["stone","stone","stone","copper"]
                 : depth<10 ? ["stone","stone","copper","iron"]
                 : depth<15 ? ["stone","copper","iron","iron"]
                 : depth<25 ? ["copper","iron","gold","gold"]
                 : depth<35 ? ["iron","gold","gold","cobalt"]
                 : depth<45 ? ["gold","gold","cobalt","cobalt","starmetal"]
                 :            ["gold","cobalt","cobalt","starmetal","starmetal"];
  // The weather above reaches down here. A storm drives the veins, and fog is when the seams
  // "read" — the old miners' word for it. Both make the stone generous, for one day only.
  const oreBoost = isStorm() ? 1.5 : 1;
  const gemBoost = isFog() ? 2.2 : isStorm() ? 1.4 : 1;
  let placed=0;
  for(const [x,y] of floors){
    if(x===ux&&y===uy || x===dx&&y===dy || (x===ux+2&&y===uy)) continue;   // ladders + the lift are sacred
    const r = rng();
    // ore gets a little denser the deeper you push — part of why depth is worth it now
    const oreP = (0.10 + 0.003*Math.min(depth,20)) * oreBoost;
    // v3.16 — gems ×5 rarer (0.010→0.002): they were the "quick money" faucet that made upgrades
    // trivial (owner). Rarity still climbs with depth (now to floor 20, not capped at 6) so a deep
    // run stays sparkly and a Diamond is a genuine event — but you can't farm them shallow anymore.
    const gemP = 0.002 * Math.min(depth,20) * gemBoost;
    if(r < oreP){ const k = oreTable[randiR(rng,0,oreTable.length-1)]; put(m,x,y,k,{hp:ORES[k].hp}); placed++; }
    else if(r < oreP + gemP){ put(m,x,y, rng() < (0.30 + depth*0.008) ? "crystal" : "gemrock", {hp:3+Math.floor(depth/2)}); }
    else if(r < oreP + gemP + 0.035){ put(m,x,y, rng()<0.5?"rubble":"minecart"); }
    else if(r < oreP + gemP + 0.05){ put(m,x,y,"beam"); }
  }
  // torches on some wall edges for light (never over an existing object — would trap the player)
  for(const [x,y] of floors){ if(!m.objects[key(x,y)] && rng()<0.04){ const above=m.tiles[(y-1)*W+x]; if(above===T.MWALL) put(m,x,y,"torch"); } }

  // ---- both ladders must stay reachable ----
  // A ladder tile is solid (you press E from beside it), so what has to stay clear is its APPROACH.
  // Unclearable props (rubble/minecart/beam) could otherwise seal a ladder pocket, and since the mine
  // is cached per depth+day, a sealed floor stays sealed all day.
  const nbrs = (x,y) => [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
  for(const [ax,ay] of [...nbrs(ux,uy), ...nbrs(dx,dy), ...nbrs(ux+2,uy)]){
    const o = m.objects[key(ax,ay)]; if(o && o.kind !== "lift" && o.kind !== "ladderup" && o.kind !== "ladderdown") delete m.objects[key(ax,ay)];
  }

  const minable = k => !!ORES[k] || k==="crystal" || k==="gemrock";   // a pick clears these
  const open = (x,y,thruProps) => {
    if(x<1||y<1||x>=m.w-1||y>=m.h-1) return false;
    if(m.tiles[y*W+x] !== T.MFLOOR) return false;
    const o = m.objects[key(x,y)];
    if(!o || WALKABLE_OBJ.has(o.kind) || minable(o.kind)) return true;
    return !!thruProps;
  };
  // BFS from the spawn to any tile touching the down-ladder
  const pathDown = thruProps => {
    const prev = {}; prev[key(ux,uy+1)] = null;
    const q = [[ux,uy+1]];
    for(let h=0; h<q.length; h++){
      const [x,y] = q[h];
      if(Math.abs(x-dx)+Math.abs(y-dy) === 1) return { prev, endK:key(x,y) };
      for(const [nx,ny] of nbrs(x,y)){
        const k2 = key(nx,ny);
        if(k2 in prev || !open(nx,ny,thruProps)) continue;
        prev[k2] = key(x,y); q.push([nx,ny]);
      }
    }
    return null;
  };
  if(!pathDown(false)){                       // sealed — dig the props out along a forced route
    const r = pathDown(true);
    if(r){ let k2 = r.endK;
      while(k2){ const o = m.objects[k2];
        if(o && !WALKABLE_OBJ.has(o.kind) && !minable(o.kind)) delete m.objects[k2];
        k2 = r.prev[k2]; } }
  }

  // deep story vault — never sit it on the only corridor down, or a low-Mining player is stranded
  if(depth >= 5 && !state.flags.foundVault){
    const r = pathDown(false), onPath = new Set();
    if(r){ let k2 = r.endK; while(k2){ onPath.add(k2); k2 = r.prev[k2]; } }
    let vx = dx-2, vy = dy;
    if(onPath.has(key(vx,vy)) || m.objects[key(vx,vy)] || m.tiles[vy*W+vx] !== T.MFLOOR){
      const cand = floors.filter(([x,y]) => !m.objects[key(x,y)] && !onPath.has(key(x,y))
        && Math.abs(x-ux)+Math.abs(y-uy) > 6 && Math.abs(x-dx)+Math.abs(y-dy) > 1);
      if(cand.length){ const c = cand[randiR(rng,0,cand.length-1)]; vx=c[0]; vy=c[1]; }
    }
    put(m, vx, vy, "sealeddoor", {story:"vault"});
  }
  m.subtitle = "Floor " + depth + (depth>=5?"  ·  something glimmers below":"");
  m.meta.up = {x:ux,y:uy}; m.meta.down = {x:dx,y:dy};
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
  // palms + driftwood
  for(let i=0;i<8;i++){ const x=randiR(rng,3,m.w-4), y=randiR(rng,3,m.h-12); if(t[y*W+x]===T.GRASS||t[y*W+x]===T.SAND) put(m,x,y,"palm"); }
  for(let y=1;y<=5;y++) delete m.objects[key(ex,y)];   // a palm must never seal the village door's approach
  for(let i=0;i<5;i++){ const x=randiR(rng,3,m.w-4), y=m.h-9; put(m,x,y,"driftwood"); }
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
           loved:["Star Metal","Diamond"], liked:["Emerald","Ruby","Starfruit","Guild Seal","Cobalt Ore"] },   // "Star Metal" already covers the Shard
  bram:  { name:"Bram",        portrait:"port_bram",  spr:"bram",  romance:true,
           loved:["Golden Koi","Pearl","Coelacanth"], liked:["Salmon","Coral","Cooked Salmon","Gulf Sturgeon"] },
  pip:   { name:"Pip",         portrait:"port_pip",   spr:"pip",
           loved:["Amethyst","Berry Bun"], liked:["Shell","Starfruit","Topaz","Wool","Melon"] },
  elias: { name:"Elias",       portrait:"port_elias", spr:"elias",
           loved:["Golden Koi","Pearl","Prize Fleece"], liked:["Trout","Salmon","Coral","Cooked","Wool"] },
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
};
function npcStory(id){
  // festival-prep phase = the two quests before the finale. Anchored to FINALE_IDX, not QUESTS.length,
  // so appending Act Two (or anything else) can never shift this window out from under the writing.
  const near = state.questIdx >= FINALE_IDX-1 && state.questIdx <= FINALE_IDX && !state.flags.festivalDone;
  if(id==="tom"){
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
    if(state.flags.festivalDone) return "The lanterns are still drifting out past the point somewhere. I hope they never quite land. ♥";
    // the turn-in sets starMetalDelivered *after* questIdx has already advanced into `near`,
    // so give this line the one quest it belongs to, and let the sketchbook line have the last.
    if(state.flags.starMetalDelivered && state.questIdx === FINALE_IDX-1)
      return "You brought the Star Metal up? Gran used to say it caught the festival light better than anything. ...You've got that look. Something's turning.";
    if(near) return "I finished the sketchbook — every lantern, down to the last. It's the first thing I've drawn that I think might actually happen.";
  } else if(id==="rowan"){
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
    if(state.flags.festivalDone) return "...The lanterns looked well on the water. That's all I'll say. That's all.";
    if(near) return "Rowan wants his festival on my coast — where we sent good folk out to sea. ...Talk to Maya. I've said my piece.";
  } else if(id==="pip"){
    if(near) return "IS IT FESTIVAL YET. Is it?? Mum's bringing cheese from the dairy. I'm gonna eat ALL of it. Don't tell her.";
  }
  return null;
}
function npcLine(id, h){
  const st = npcStory(id); if(st) return st;
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
    // he came home, and he fishes the pond his daughter grew up beside.
    if(state.flags.act2Done && h>=7 && h<19) m.npcs.push(mkNpc("elias", 32*TILE, 25*TILE, {face:"right"}));
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
  }
}
function updateAnimals(dt){
  if(!curMap || !curMap.animals.length) return;
  for(const a of curMap.animals){
    a.timer -= dt;
    if(a.timer <= 0){ a.timer = rand(0.8,2.4); a.dir = chance(0.5)?{x:0,y:0}:{x:[-1,0,1][randi(0,2)],y:[-1,0,1][randi(0,2)]}; }
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
  const c = a.ref;
  if(c.eggDay !== state.day){ c.eggDay = state.day; const large = c.friend>=180 && chance(0.5);
    give(large?"Large Egg":"Egg", 1); c.friend = Math.min(250, c.friend+8);
    playSfx("get"); pSparkle(a.x, a.y-8, "#fff6d0", 6); floatText(a.x, a.y-14, "+egg", "#ffe08a"); }
  else if(c.petDay !== state.day){ c.petDay = state.day; c.friend = Math.min(250, c.friend+3);
    toast("You pet the hen. ♥", "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-8, "#ff9ab0", 4); }
  else toast("This hen has had enough fuss for today.");
}
function buyChicken(){
  if(state.animals.chickens.length >= 6){ toast("Your coop is full (6 hens)."); return; }
  if(state.gold < 300){ toast("Not enough coin (300g)."); playSfx("error"); return; }
  state.gold -= 300; state.animals.chickens.push({ friend:0, eggDay:0, petDay:0 });
  toast("A new hen joins the coop! 🐔", "#8fd06a"); playSfx("coin"); refreshHUD(); renderShop();
}

// ---- cows ----
function petCow(a){
  const c = a.ref;
  if(c.milkDay !== state.day){
    c.milkDay = state.day;
    const large = c.friend >= 180 && chance(0.5);
    give(large ? "Large Milk" : "Milk", 1);
    c.friend = Math.min(250, c.friend + 8);
    playSfx("get"); pSparkle(a.x, a.y-10, "#eaf4fb", 7); floatText(a.x, a.y-16, large?"+big milk":"+milk", "#dfeaf2");
  } else if(c.petDay !== state.day){
    c.petDay = state.day; c.friend = Math.min(250, c.friend + 3);
    toast("She leans into your hand. ♥", "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-10, "#ff9ab0", 4);
  } else toast("She's been milked and fussed over already today.");
}
function buyCow(){
  if(!state.animals.cows) state.animals.cows = [];
  if(state.animals.cows.length >= 4){ toast("Your barn is full (4 cows)."); return; }
  if(state.gold < 600){ toast("Not enough coin (600g)."); playSfx("error"); return; }
  state.gold -= 600; state.animals.cows.push({ friend:0, milkDay:0, petDay:0 });
  toast("A cow ambles into the barn. 🐄", "#8fd06a"); playSfx("coin"); refreshHUD(); renderShop();
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
  if(woolReady(c) && state.flags.hasShears){
    c.woolDay = state.day;
    const prize = c.friend >= 180 && chance(0.5);
    give(prize ? "Prize Fleece" : "Wool", 1);
    c.friend = Math.min(250, c.friend + 8);
    playSfx("get"); pSparkle(a.x, a.y-10, "#f6f6fa", prize?10:7);
    floatText(a.x, a.y-16, prize?"+prize fleece":"+wool", prize?"#ffe6a0":"#e8e8ee");
    return;
  }
  // Anything else falls through to a friendly pet — a full-coated sheep is never un-pettable, and
  // the "get shears" nudge is a warm hint, not an error buzz on every press (review fix, v3.8).
  if(c.petDay !== state.day){
    c.petDay = state.day; c.friend = Math.min(250, c.friend + 3);
    const nudge = woolReady(c) && !state.flags.hasShears
      ? "Her coat's full — shears from Tom's would gather it. She leans into your hand anyway. ♥"
      : "The sheep leans into your hand. ♥";
    toast(nudge, "#ff7d9c"); playSfx("heart"); pSparkle(a.x, a.y-10, "#ff9ab0", 4);
  } else toast("This one's had plenty of fuss today.");
}
function buySheep(){
  if(!state.animals.sheep) state.animals.sheep = [];
  if(state.animals.sheep.length >= SHEEP_MAX){ toast(`Your barn's flock is full (${SHEEP_MAX} sheep).`); return; }
  if(state.gold < SHEEP_COST){ toast(`Not enough coin (${SHEEP_COST}g).`); playSfx("error"); return; }
  state.gold -= SHEEP_COST;
  // stamp woolDay=today so the first coat grows over WOOL_REGROW days, the same as every coat after
  state.animals.sheep.push({ friend:0, woolDay:state.day, petDay:0 });
  toast("A sheep trots into the barn. 🐑  Its coat will want a few days to grow.", "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop();
}
function buyShears(){
  if(state.flags.hasShears){ toast("You've already a good pair of shears."); return; }
  if(state.gold < SHEARS_COST){ toast(`Not enough coin (${SHEARS_COST}g).`); playSfx("error"); return; }
  state.gold -= SHEARS_COST; state.flags.hasShears = true; give("Shears", 1, true);
  toast("A fine pair of shears. Now the wool is yours for the gathering.", "#8fd06a");
  playSfx("coin"); refreshHUD(); renderShop();
}
function buySapling(k){
  const t = FRUIT_TREES[k]; if(!t) return;
  if(state.gold < t.cost){ toast(`Not enough coin (${t.cost}g).`); playSfx("error"); return; }
  state.gold -= t.cost; give(t.name, 1, true);
  toast(`A ${t.name}. Press R to select it, then plant it on open grass.`, "#8fd06a");
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
  if(state.gold < D.cost){ toast(`Not enough coin (${D.cost.toLocaleString()}g).`); playSfx("error"); return; }
  state.gold -= D.cost; give(D.name, 1, true);
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
  if(tryFulfillRequest(id)) return;           // scripted scenes always outrank the noticeboard
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
