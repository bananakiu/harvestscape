"use strict";
/* ============================================================
   04-world.js — state, MAP SYSTEM, tiles, warps, save/load.
   Only the farm map persists; interiors/mine/beach regenerate.
   ============================================================ */

const SAVE_KEY = "harvestscape_save_v2";
let curMap = null;                        // the active map's data

// object kinds you can walk over (everything else placed blocks)
const WALKABLE_OBJ = new Set(["ladder","exitmat","flower","rugdot","lantern"]);

function freshState(){
  return {
    px: 8*TILE+8, py: 12*TILE, face:"down",
    map:"farm", farm:null,
    gold:500, energy:100, day:1, time:6*60,
    inv:{ "Turnip Seeds":6, "Berry Bun":2 },
    market:{},                            // how much of each item Tom has taken today; cleared at dawn
    seedSel:"turnip",
    skills:{ Farming:0, Woodcutting:0, Mining:0, Fishing:0, Cooking:0 },
    tools:{ Hoe:0, Can:0, Axe:0, Pick:0, Rod:0 },
    rel:{},                               // per-NPC relationship { points, talkedDay, giftedDay }
    animals:{ chickens:[], cows:[] },     // each: { friend, eggDay|milkDay, petDay }
    mineDepth:0, mineBest:0,
    stats:{ legends:0, tilled:0, planted:0, watered:0, harvested:0, chopped:0, mined:0, fished:0, cooked:0, earned:0, toolUpgrades:0, sold:0, gems:0, forage:0,
            bestCropSold:0, festivals:0, requests:0 },   // bestCropSold resets each season; the Harvest Fair judges it
    questIdx:0, questDone:[], questReady:false,
    weather:"clear", forecast:null,        // forecast is rolled on the first newDay
    discovered:{ "Turnip Seeds":true, "Berry Bun":true },   // everything you've ever held — the Collection remembers
    xpCurve:3,                             // which XP table this save's XP is expressed in (see migrateSave)
    liftStops:[],                          // restored Old Lift stops (floor numbers, multiples of 5) — permanent
    wingsLit:0,                            // how many Guild wings have been CELEBRATED (see checkWings)

    flags:{ introSeen:false },
  };
}
// mark an item as "discovered" for the Collection. First time only returns true (for a little fanfare).
function discover(name){
  if(!state.discovered) state.discovered = {};
  if(state.discovered[name]) return false;
  state.discovered[name] = true; return true;
}
function ensureRel(id){ if(!state.rel[id]) state.rel[id] = { points:0, talkedDay:0, giftedDay:0 }; return state.rel[id]; }

// ---- tile access (current map) ----
const tileAt = (x,y) => (!curMap || x<0||y<0||x>=W||y>=H) ? T.VOID : curMap.tiles[y*W+x];
const setTile = (x,y,v) => { if(curMap && x>=0&&y>=0&&x<W&&y<H) curMap.tiles[y*W+x]=v; };
const objAt = (x,y) => curMap && curMap.objects[key(x,y)];
const warpAt = (x,y) => curMap && curMap.warps[key(x,y)];

// ---- map construction ----
function newMap(id){
  const def = MAPS[id];
  const m = {
    id, w:def.w, h:def.h, outdoor:!!def.outdoor,
    name:def.name||"", subtitle:def.subtitle||"", music:def.music||"day",
    bg:def.bg||"#0b0a0f",
    tiles:new Array(W*H).fill(T.VOID), objects:{}, crops:{}, npcs:[], animals:[], warps:{},
    meta:{},
  };
  def.gen(m);
  return m;
}
// transient maps are cached for the current day so re-entering shows depleted
// ore/forage (the intended daily limit); the cache is cleared each night.
let mapCache = {};
function getMap(id){
  if(id === "farm"){ if(!state.farm) state.farm = newMap("farm"); return state.farm; }
  const ck = id === "mine" ? "mine:" + (state.mineDepth||1) : id;
  if(mapCache[ck]) return mapCache[ck];
  return (mapCache[ck] = newMap(id));
}
function clearMapCache(){ mapCache = {}; }

// place the player on a map (instant). travelTo() adds the fade.
function setMap(id, sx, sy, face){
  curMap = getMap(id);
  state.map = id;
  if(sx !== undefined){ state.px = sx; state.py = sy; }
  if(face) state.face = face;
  spawnMapNpcs(curMap);
  spawnAnimals(curMap);
  unstick();                    // never let the player spawn wedged in a wall/door
  endFishing();                 // no bobber left floating on a map you've left
  if(typeof onEnterMap === "function") onEnterMap(id);
  rainDrops.length = 0;
  setMusicMode(mapMusicMode(curMap));
  if(curMap.name) banner(curMap.name, curMap.subtitle);
  refreshHUD();
}
// If the player lands inside a solid (door/wall/furniture), nudge to the nearest free spot.
function unstick(){
  if(!curMap || !blockedAt(state.px, state.py)) return;
  const cx = Math.floor(state.px/TILE), cy = Math.floor(state.py/TILE);
  for(let r=1; r<=8; r++){
    for(let dy=-r; dy<=r; dy++) for(let dx=-r; dx<=r; dx++){
      if(Math.abs(dx)!==r && Math.abs(dy)!==r) continue;   // ring only
      const tx = cx+dx, ty = cy+dy;
      if(tx<0||ty<0||tx>=curMap.w||ty>=curMap.h) continue;
      const nx = tx*TILE+8, ny = ty*TILE+8;
      if(!blockedAt(nx, ny)){ state.px = nx; state.py = ny; return; }
    }
  }
}
function mapMusicMode(m){
  if(m.music === "auto") return nightFactor(curHour())>0.55 ? "night" : "day";
  return m.music;
}

// fade → switch → fade back
let _traveling = false;
function travelTo(id, sx, sy, face){
  if(_traveling) return;
  _traveling = true; paused = true; playSfx("door");
  fadeTo(true, () => {
    setMap(id, sx, sy, face);
    fadeTo(false);
    paused = false; _traveling = false;
  });
}

// ---- collision ----
function isSolidTile(x,y){ return SOLID.has(tileAt(x,y)); }
function objBlocks(o){ return o && !WALKABLE_OBJ.has(o.kind); }
function blockedAt(pxx, pyy){
  const pts = [[pxx-4,pyy-2],[pxx+4,pyy-2],[pxx-4,pyy+3],[pxx+4,pyy+3]];
  for(const [cx,cy] of pts){
    const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
    if(isSolidTile(tx,ty)) return true;
    if(objBlocks(curMap.objects[key(tx,ty)])) return true;
  }
  return false;
}
function randiR(rng,a,b){ return a + Math.floor(rng()*(b-a+1)); }

// ======================================================================
//  FARM MAP GENERATOR (the persistent overworld)
// ======================================================================
function genFarm(m){
  const rng = makeRng(1337);
  const t = m.tiles; t.fill(T.GRASS);
  const set = (x,y,v) => { if(x>=0&&y>=0&&x<m.w&&y<m.h) t[y*W+x]=v; };
  const get = (x,y) => t[y*W+x];
  const rect = (x0,y0,x1,y1,v) => { for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set(x,y,v); };
  const obj = m.objects;
  const canPlace = (x,y) => { const g=get(x,y); return (g===T.GRASS||g===T.FLOWERGRASS||g===T.TALLGRASS) && !obj[key(x,y)]; };
  const place = (x,y,kind,extra) => { if(canPlace(x,y)) obj[key(x,y)] = Object.assign({kind}, extra||{}); };
  const door = (x,y,to,sx,sy) => { set(x,y,T.DOOR); m.warps[key(x,y)] = {to, sx, sy, face:"down"}; };

  // grass variety
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){ const n=rng();
    if(n<0.05) set(x,y,T.FLOWERGRASS); else if(n<0.08) set(x,y,T.TALLGRASS); }

  // ponds (kept clear of buildings & paths). v3.2 shrink: the east pond (Elias's) moved in from
  // the old town's edge to the meadow; the west pond sits a little higher in the tightened woods.
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const d1 = Math.hypot((x-38)/4.6,(y-25)/3.8), d2 = Math.hypot((x-9)/4.0,(y-30)/3.0);
    if(d1<1||d2<1) set(x,y,T.WATER); else if(d1<1.22||d2<1.25) set(x,y,T.SAND);
  }

  // --- cottage (farm home) ---
  rect(5,3,10,4,T.ROOF); rect(5,5,10,6,T.WALL);
  door(7,6,"cottage", 5*TILE+8, 6*TILE);   // enter your home (spawn a tile above the mat)
  set(8,6,T.WALL);

  // starter plot
  rect(6,9,11,11,T.TILLED);

  // --- chicken coop ---
  rect(14,4,17,4,T.ROOF); rect(14,5,17,6,T.WALL); door(15,6,"coop", 6*TILE+8, 6*TILE); set(16,5,T.WALL);
  obj[key(18,6)] = { kind:"sign", text:"The Coop" };

  // --- barn ---
  rect(20,3,25,4,T.ROOF); rect(20,5,25,6,T.WALL); door(22,6,"barn", 7*TILE+8, 7*TILE);
  set(21,5,T.WALL); set(23,5,T.WALL);
  obj[key(26,6)] = { kind:"sign", text:"The Barn" };

  // paths — the farm's lane runs from the buildings out to the east road (the way to the village)
  for(let x=9;x<=45;x++) set(x,15,T.PATH);
  for(let y=6;y<=15;y++) set(13,y,T.PATH);
  for(let y=15;y<=28;y++) set(30,y,T.PATH);

  // --- the road to the village (v3: the town moved off the farm and became its own map) ---
  // a 3-tall warp band: hugging the map edge above or below the road must still catch it
  for(const wy of [14,15,16]) m.warps[key(45,wy)] = { to:"village", sx:2*TILE, sy:14*TILE+8, face:"right", auto:true };
  obj[key(43,14)] = { kind:"sign", text:"→ The Village" };

  // farm props
  obj[key(12,8)] = { kind:"shipbin" };
  obj[key(4,9)]  = { kind:"campfire" };
  obj[key(3,8)]  = { kind:"sign", text:"Willowbrook Farm" };
  place(2,12,"bush"); place(15,11,"bush"); place(3,13,"berrybush");

  // forest (southwest)
  for(let i=0;i<40;i++){ const x=randiR(rng,2,22), y=randiR(rng,19,34);
    const r=rng(), kind=r<0.55?"oak":r<0.82?"pine":"maple"; place(x,y,kind,{hp:TREES[kind].hp}); }
  for(let i=0;i<10;i++) place(randiR(rng,2,22),randiR(rng,19,34), rng()<0.5?"bush":"berrybush");
  // --- the Deep Grove (west, through the treeline) ---
  // a footpath out of the little forest into woodcutting's real venue; carved AFTER the tree
  // scatter so nothing can seal it (objects on the path rows are cleared).
  for(let x=1;x<=6;x++) set(x,26,T.PATH);
  for(let x=0;x<=6;x++) for(let dy=-1;dy<=1;dy++) delete obj[key(x,26+dy)];
  // a 2×3 warp pad: walking the map's west edge past the footpath must still catch it
  for(const wx of [0,1]) for(const wy of [25,26,27])
    m.warps[key(wx,wy)] = { to:"grove", sx:(44-3)*TILE, sy:15*TILE, face:"left", auto:true };
  obj[key(5,25)] = { kind:"sign", text:"← The Deep Grove" };

  // ore ridge (north) — early mining above ground
  for(let i=0;i<24;i++){ const x=randiR(rng,26,43), y=randiR(rng,1,4);
    const r=rng(), kind=r<0.4?"stone":r<0.75?"copper":r<0.92?"iron":"gold"; place(x,y,kind,{hp:ORES[kind].hp}); }
  place(17,12,"oak",{hp:3}); place(19,13,"oak",{hp:3}); place(21,17,"pine",{hp:6});
  place(23,17,"copper",{hp:4}); place(25,18,"stone",{hp:2});

  // meadow (south) — flowery, where folk stroll
  for(let y=24;y<=32;y++) for(let x=24;x<=42;x++){ if(get(x,y)===T.GRASS && rng()<0.35) set(x,y,T.FLOWERGRASS); }
  obj[key(27,28)] = { kind:"sign", text:"Festival Green" };

  // scatter must never wall off a doorway
  for(const wk in m.warps){ const [dx,dy] = wk.split(",").map(Number);
    delete obj[key(dx,dy+1)]; delete obj[key(dx,dy+2)]; }
}

// ---- save / load (only the farm map + meta persist) ----
let _wipe = false;
function saveGame(){
  if(_wipe || !state) return;
  if(typeof isCutscene === "function" && isCutscene()) return;   // don't persist mid-cutscene state
  if(state.flags && state.flags.festivalActive && !state.flags.festivalDone) return;  // don't persist a half-run festival
  if(state.flags && state.flags.seasonalActive) return;                                // nor a half-run seasonal one
  if(state.flags && state.flags.turnInPending) return;                                 // nor a quest advanced but not yet narrated
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
}
function loadGame(){
  try{ const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    // accept the current canvas OR any self-consistent older one (e.g. the pre-v3.2 60×46 farm) —
    // migrateSave rebuilds legacy farms onto the current layout.
    if(s && s.farm && s.farm.tiles &&
       (s.farm.tiles.length === W*H || s.farm.tiles.length === (s.farm.w||0)*(s.farm.h||0))) return s;
  }catch(e){}
  return null;
}
function hasSave(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } }
function wipeSave(){ _wipe = true; try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
