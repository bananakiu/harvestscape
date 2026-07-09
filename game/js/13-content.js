"use strict";
/* ============================================================
   13-content.js — map registry & generators, the NPC cast,
   dialogue, relationships, and the mine.
   ============================================================ */

// ---------------- map registry ----------------
const MAPS = {
  farm:      { w:60, h:46, outdoor:true,  name:"Willowbrook Farm", music:"auto",  gen:genFarm },
  cottage:   { w:11, h:9,  name:"Your Cottage",          subtitle:"home sweet home", music:"cozy", bg:"#171009", gen:genCottage },
  coop:      { w:12, h:9,  name:"The Coop",              subtitle:"cluck, cluck",    music:"cozy", bg:"#1a1208", gen:genCoop },
  store:     { w:14, h:9,  name:"Tom's General Store",   subtitle:"coin for goods",   music:"cozy", bg:"#171009", gen:genStore },
  mayahouse: { w:12, h:9,  name:"The Alderman House",    subtitle:"",                 music:"cozy", bg:"#171009", gen:genMayaHouse },
  guild:     { w:17, h:11, name:"Guild of Nine Crafts",  subtitle:"once, the heart of the valley", music:"cozy", bg:"#12100b", gen:genGuild },
  mine:      { w:34, h:22, name:"The Old Mine",          subtitle:"",                 music:"mine", bg:"#050406", gen:genMine },
  beach:     { w:46, h:24, outdoor:true, name:"Willowbrook Coast", subtitle:"salt on the breeze", music:"beach", bg:"#2f4a63", gen:genBeach },
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
function genStore(m){
  genRoom(m, T.PLANK, T.IWALL);
  // counter across the middle
  for(let x=3;x<=10;x++) put(m,x,3,"counter",{shop:true});
  put(m,2,3,"counter",{shop:true});
  put(m,4,1,"bookshelf"); put(m,7,1,"bookshelf"); put(m,10,1,"bookshelf");
  put(m,2,6,"crate"); put(m,3,6,"barrel"); put(m,11,6,"crate"); put(m,11,5,"barrel");
  put(m,12,2,"plantpot"); put(m,1,5,"crate");
  put(m,12,6,"sign",{text:"“Dusted daily.” — Tom"});
  exitAt(m,7,"farm",46*TILE+8,15*TILE);   // 2 tiles below the store door
}
function genMayaHouse(m){
  genRoom(m, T.IFLOOR, T.IWALL);
  for(let y=4;y<=6;y++) for(let x=4;x<=6;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,2,2,"bed"); put(m,8,2,"fireplace"); put(m,4,1,"painting"); put(m,9,3,"bookshelf");
  put(m,5,4,"table"); put(m,5,3,"chair"); put(m,2,5,"plantpot"); put(m,9,6,"lamp");
  put(m,3,6,"sign",{text:"Maya's sketchbook lies open — half-drawn festival lanterns."});
  exitAt(m,6,"farm",53*TILE+8,15*TILE);   // 2 tiles below Maya's door
}
function genGuild(m){
  genRoom(m, T.PLANK, T.IWALL);
  for(let x=1;x<m.w-1;x++) m.tiles[1*W+x]=T.IWALL;   // back wall band
  // nine craft wings, lit or dark along the back wall
  const wingX = [3,4,6,7,8,9,11,12,13];
  WINGS.forEach((w,i) => put(m, wingX[i], 1, "wing", { wing:w.id }));
  // Rowan's desk area
  put(m,7,3,"desk"); put(m,8,3,"desk"); put(m,6,3,"bookshelf"); put(m,10,3,"bookshelf");
  put(m,2,5,"anvil"); put(m,14,5,"bookshelf"); put(m,2,3,"plantpot"); put(m,14,3,"plantpot");
  // central carpet
  for(let y=5;y<=7;y++) for(let x=6;x<=10;x++) m.tiles[y*W+x]=T.CARPET;
  put(m,4,7,"crate"); put(m,12,7,"barrel");
  put(m,1,7,"sign",{text:"Nine crafts. Nine wings. Tend them all, and the valley wakes."});
  exitAt(m,8,"farm",36*TILE+8,11*TILE);
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
  // scatter ore/gems/props on floor tiles
  const floors = [];
  for(let y=1;y<m.h-1;y++) for(let x=1;x<m.w-1;x++) if(m.tiles[y*W+x]===T.MFLOOR) floors.push([x,y]);
  const oreTable = depth<3 ? ["stone","copper","copper","iron"]
                 : depth<6 ? ["copper","iron","iron","gold"]
                 : ["iron","gold","gold","stone"];
  let placed=0;
  for(const [x,y] of floors){
    if(x===ux&&y===uy || x===dx&&y===dy) continue;
    const r = rng();
    if(r < 0.10){ const k = oreTable[randiR(rng,0,oreTable.length-1)]; put(m,x,y,k,{hp:ORES[k].hp}); placed++; }
    else if(r < 0.10 + 0.018*Math.min(depth,6)){ put(m,x,y, rng()<0.35?"crystal":"gemrock", {hp:3+Math.floor(depth/2)}); }
    else if(r < 0.135){ put(m,x,y, rng()<0.5?"rubble":"minecart"); }
    else if(r < 0.15){ put(m,x,y,"beam"); }
  }
  // torches on some wall edges for light (never over an existing object — would trap the player)
  for(const [x,y] of floors){ if(!m.objects[key(x,y)] && rng()<0.04){ const above=m.tiles[(y-1)*W+x]; if(above===T.MWALL) put(m,x,y,"torch"); } }
  // deep story vault
  if(depth >= 5 && !state.flags.foundVault){ put(m, dx-2, dy, "sealeddoor", {story:"vault"}); }
  m.subtitle = "Floor " + depth + (depth>=5?"  ·  something glimmers below":"");
  m.meta.up = {x:ux,y:uy}; m.meta.down = {x:dx,y:dy};
}
function doWarp(w){ if(!w) return; if(w.mine) enterMine(); else travelTo(w.to, w.sx, w.sy, w.face); }
function enterMine(){ state.mineDepth = 1; travelTo("mine", 2*TILE+8, 3*TILE, "down"); }
function mineDown(){ state.mineDepth = (state.mineDepth||1) + 1; state.mineBest = Math.max(state.mineBest||0, state.mineDepth);
  checkQuests(); travelTo("mine", 2*TILE+8, 3*TILE, "down"); toast("You climb down to floor "+state.mineDepth+"…","#a9b0c0"); }
function mineUp(){
  if((state.mineDepth||1) > 1){ state.mineDepth--; travelTo("mine", 2*TILE+8, 3*TILE, "down"); }
  else { travelTo("farm", 50*TILE+8, 6*TILE, "down"); }
}

// ---------------- the beach ----------------
function genBeach(m){
  const rng = makeRng(555);
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
  // exit back to farm (top centre)
  t[0*W+ (m.w>>1)]=T.DOOR;
  m.warps[key(m.w>>1, 1)] = { to:"farm", sx:30*TILE+8, sy:42*TILE, face:"up", auto:true };
  put(m, (m.w>>1)-2, 1, "sign", {text:"↑ Back to the valley"});
  // palms + driftwood
  for(let i=0;i<8;i++){ const x=randiR(rng,3,m.w-4), y=randiR(rng,3,m.h-12); if(t[y*W+x]===T.GRASS||t[y*W+x]===T.SAND) put(m,x,y,"palm"); }
  for(let i=0;i<5;i++){ const x=randiR(rng,3,m.w-4), y=m.h-9; put(m,x,y,"driftwood"); }
  // forage nodes near the tideline
  for(let i=0;i<14;i++){ const x=randiR(rng,3,m.w-4), y=m.h-9+randiR(rng,0,1);
    if(t[y*W+x]===T.SAND){ const r=rng(); put(m,x,y, r<0.4?"shellnode":r<0.7?"seaweednode":r<0.9?"coralnode":"starfish"); } }
  // festival stage (finale grounds)
  for(let x=(m.w>>1)-2;x<=(m.w>>1)+2;x++) put(m,x,4,"stage");
  put(m,(m.w>>1)+4,4,"banner"); put(m,(m.w>>1)-4,4,"banner");
  // festival dressing — strung lanterns everywhere
  if(state.flags.festivalActive){
    for(let x=3;x<m.w-3;x+=2) put(m,x,2,"lantern");
    for(let i=0;i<12;i++){ const x=randiR(rng,3,m.w-4), y=randiR(rng,6,m.h-11); if(!m.objects[key(x,y)]) put(m,x,y,"lantern"); }
    put(m,(m.w>>1)-1,3,"banner"); put(m,(m.w>>1)+1,3,"banner");
  }
}

// ======================================================================
//  NPC CAST
// ======================================================================
const NPCDEF = {
  maya:  { name:"Maya",        portrait:"port_maya",  spr:"maya",  romance:true,
           loved:["Strawberry","Golden Koi","Diamond","Pearl"], liked:["Cooked","Starfruit","Carrot","Coral"] },
  tom:   { name:"Tom",         portrait:"port_tom",   spr:"tom",
           loved:["Pumpkin","Gold Ore"], liked:["Wood","Copper Ore","Iron Ore"] },
  rowan: { name:"Elder Rowan", portrait:"port_rowan", spr:"rowan",
           loved:["Star Metal","Diamond"], liked:["Emerald","Ruby","Starfruit","Guild Seal"] },
  bram:  { name:"Bram",        portrait:"port_bram",  spr:"bram",
           loved:["Golden Koi","Pearl"], liked:["Salmon","Coral","Cooked Salmon"] },
  pip:   { name:"Pip",         portrait:"port_pip",   spr:"pip",
           loved:["Amethyst","Berry Bun"], liked:["Shell","Starfruit","Topaz"] },
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
};
function npcStory(id){
  const near = state.questIdx >= QUESTS.length - 2;   // festival-prep phase
  if(id==="tom"){
    if(state.flags.festivalDone) return "Best festival in twenty years — and I'm counting the year the cake caught fire.";
    if(near) return "Whole town's whispering 'festival' again. I've ordered lanterns I can't afford. Don't you dare not pull this off.";
  } else if(id==="maya"){
    if(state.flags.festivalDone) return "The lanterns are still drifting out past the point somewhere. I hope they never quite land. ♥";
    if(near) return "I finished the sketchbook — every lantern, down to the last. It's the first thing I've drawn that I think might actually happen.";
    if(state.flags.starMetalDelivered) return "You brought the Star Metal up? Gran used to say it caught the festival light better than anything. ...You've got that look. Something's turning.";
  } else if(id==="rowan"){
    if(state.flags.festivalDone) return "Nine wings, lit. I was certain I'd die in the dark of this hall. Thank you, child — truly.";
  } else if(id==="bram"){
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
  if(id==="rowan" && state.flags.foundVault) idx = Math.min(3, arr.length-1);
  return arr[idx];
}

// ---- placement per map & time ----
function mkNpc(id, x, y, opt={}){ return { id, x, y, face:opt.face||"down", walk:0, moving:false,
  wander:opt.wander||null, timer:0, dir:{x:0,y:0} }; }
function spawnMapNpcs(m){
  m.npcs = [];
  const h = curHour();
  if(m.id==="farm"){
    if(h>=7 && h<18.5) m.npcs.push(mkNpc("maya", 31*TILE, 36*TILE, {wander:{x0:25,y0:32,x1:41,y1:39}}));
    if(h>=8 && h<19)   m.npcs.push(mkNpc("pip",  34*TILE, 24*TILE, {wander:{x0:31,y0:18,x1:44,y1:28}}));
  } else if(m.id==="store"){ m.npcs.push(mkNpc("tom", 7*TILE+8, 2*TILE+8, {face:"down"})); }
  else if(m.id==="mayahouse"){ if(h>=18.5 || h<7) m.npcs.push(mkNpc("maya", 6*TILE, 4*TILE, {face:"down"})); }
  else if(m.id==="guild"){ m.npcs.push(mkNpc("rowan", 8*TILE+8, 5*TILE, {face:"down"})); }
  else if(m.id==="beach"){
    if(state.flags.festivalActive){
      m.npcs.push(mkNpc("rowan", 23*TILE+8, 6*TILE, {face:"down"}));
      m.npcs.push(mkNpc("tom",   18*TILE, 8*TILE, {face:"down"}));
      m.npcs.push(mkNpc("maya",  28*TILE, 8*TILE, {face:"down"}));
      m.npcs.push(mkNpc("bram",  14*TILE, 9*TILE, {face:"right"}));
      m.npcs.push(mkNpc("pip",   31*TILE, 10*TILE, {face:"left", wander:{x0:28,y0:8,x1:34,y1:13}}));
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
      m.animals.push({ ref:c, x:(3 + (i%4)*2)*TILE+8, y:(4 + Math.floor(i/4))*TILE+8,
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
      const sp=15*dt, nx=a.x+a.dir.x*sp, ny=a.y+a.dir.y*sp, bx=Math.floor(nx/TILE), by=Math.floor(ny/TILE);
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

// ---- relationships ----
function heartsOf(id){ const r=state.rel[id]; return r ? Math.min(6, Math.floor(r.points/100)) : 0; }
function heartStr(h){ let s=""; for(let i=0;i<6;i++) s += i<h ? "♥":"♡"; return s; }
function talkNpc(id){
  const r = ensureRel(id), def = NPCDEF[id];
  if(r.talkedDay !== state.day){ r.talkedDay = state.day; r.points += 15;
    floatText(state.px, state.py-24, "+15 ♥", "#ff7d9c"); playSfx("heart"); checkQuests(); }
  if(tryTurnIn(id)) return;
  showDialog(def.name + "   " + heartStr(heartsOf(id)), npcLine(id, heartsOf(id)), def.portrait);
}
function giftPref(def, item){
  return def.loved.some(x => item.includes(x)) ? "loved" : def.liked.some(x => item.includes(x)) ? "liked" : "";
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
  const pts = pref==="loved" ? 90 : pref==="liked" ? 55 : 28;
  r.points += pts; floatText(state.px, state.py-24, "+"+pts+" ♥", "#ff7d9c"); playSfx("gift"); checkQuests();
  pSparkle(state.px, state.py-14, "#ff9ab0", 10);
  closePanel("giftPanel");
  showDialog(def.name+"   "+heartStr(heartsOf(id)),
    pref==="loved" ? `A ${item}?! My very favorite. You remembered — thank you!` :
    pref==="liked" ? `Ooh, ${item} — I do like these. That's thoughtful of you.` :
                     `Aw, a ${item}? That's sweet. Thank you.`, def.portrait);
}
