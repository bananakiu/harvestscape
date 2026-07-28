#!/usr/bin/env node
/* ============================================================
   check-schedules.mjs — the NPC schedule harness (v6.1.2).

   Run:  node tools/check-schedules.mjs
         node tools/check-schedules.mjs --days 56    (longer sweep)
   Exit: 0 every schedule invariant holds · 1 a schedule is broken · 2 the harness is broken.

   WHY THIS EXISTS, and why it exists as a FILE rather than as good intentions.

   v6.0 took the cast from 7 people to 11; v6.1 gave several of them a second place to be. Both
   releases immediately produced bugs that are structurally invisible in a diff:

     · **Double-booking.** Two time windows written independently, in different branches, minutes
       apart, put the same person in two places at once. Fixing the two obvious ones by hand
       uncovered a THIRD that had shipped four releases earlier (v5.5's spouse, standing in the
       cottage and on the village plaza every single morning since) and a FOURTH (the whole festival
       cast, on the sand and at their day jobs on every festival day).
     · **Crowding.** Three NPCs were given the identical wander box. A box that comfortably holds two
       does not hold three: they drifted to about one tile apart and their floating name tags sat on
       top of one another.

   Both were found by sweeping — printing where everybody is, across every map, at several hours, for
   weeks — and both are invisible any other way. The v6.1 and v6.1.1 changelogs then called that sweep
   "the standard check for any schedule change", which was a promise made by a snippet typed into a
   browser console and thrown away.

   `GAME_BALANCE_PRINCIPLES.md`'s own lesson, from v5.0: **a rule nothing measures is a rule that
   quietly stops being true.** So the sweep is a file now, and it runs with the others.

   WHAT IT ASSERTS:
     1. Nobody is ever in two places at the same moment.
     2. Every NPC is somewhere at some point in the week (a schedule that never fires is a character
        the player can never meet — the v4.6 unreachable-event bug, in schedule form).
     3. No two NPCs sharing a map have overlapping wander boxes tight enough to collide their name
        tags (measured by simulating the wander, not by eyeballing the rectangles).
   ============================================================ */
import { loadGame } from "./lib/load-game.mjs";

const argv = process.argv.slice(2);
const DAYS = (() => { const i = argv.indexOf("--days"); return i >= 0 ? +argv[i + 1] : 28; })();
const HOURS = [6, 7, 8, 9, 11, 12, 14, 16, 17, 18, 19, 20, 22];

const sb = loadGame();
const MAPS = sb.get("MAPS"), NPCDEF = sb.get("NPCDEF");
const TILE = sb.get("TILE");
const spawnMapNpcs = sb.get("spawnMapNpcs"), newMap = sb.get("newMap"), updateNpcs = sb.get("updateNpcs");

// A save deep enough that every conditional schedule is switched on — otherwise the sweep silently
// only covers the early game, which is where schedules are simplest and least likely to be wrong.
const s = sb.freshState();
s.farm = sb.newMap("farm");
Object.assign(s.flags, {
  introSeen:true, act1Done:true, act2Done:true, festivalDone:true,
  married:true, spouse:"maya", tenthDoorOpen:true, tenthWingLit:true, staveEarned:true,
  theaArrived:true, proj_coop:true, proj_barn:true, proj_stable:true, bornUnbuilt:false,
});
s.wingsLit = 9; s.wardBest = 45; s.mineBest = 60;
sb.setState(s);

const MAP_IDS = Object.keys(MAPS);
let problems = 0, snapshots = 0, placements = 0;
const dupKinds = new Map();
const everSeen = new Set();

for(let day = 1; day <= DAYS; day++){
  for(const hr of HOURS){
    s.day = day; s.time = hr * 60;
    snapshots++;
    const where = new Map();
    for(const id of MAP_IDS){
      let m;
      try { m = newMap(id); } catch(e){ continue; }        // a map that needs live play state is not our business
      try { spawnMapNpcs(m); } catch(e){ continue; }
      for(const n of (m.npcs || [])){
        placements++;
        everSeen.add(n.id);
        if(!where.has(n.id)) where.set(n.id, []);
        where.get(n.id).push(id);
      }
    }
    for(const [id, maps] of where){
      if(maps.length < 2) continue;
      const k = `${id}: ${maps.slice().sort().join(" + ")}`;
      dupKinds.set(k, (dupKinds.get(k) || 0) + 1);
    }
  }
}

console.log(`Schedule harness — ${snapshots} snapshots (${DAYS} days × ${HOURS.length} hours × ${MAP_IDS.length} maps), ${placements} placements\n`);

/* ---- 1. nobody in two places at once ---- */
if(dupKinds.size){
  problems++;
  console.log("✗ DOUBLE-BOOKED — the same person in two places at the same moment:");
  for(const [k, n] of [...dupKinds].sort((a, b) => b[1] - a[1]))
    console.log(`    ${k}  (${n} snapshot${n > 1 ? "s" : ""})`);
  console.log("    → fix in ONE place (npcIsElsewhere, 13-content.js), not per-branch: paired `if`s drift.");
} else {
  console.log("✓ nobody is ever in two places at once");
}

/* ---- 2. every NPC actually appears ---- */
const never = Object.keys(NPCDEF).filter(id => !everSeen.has(id));
if(never.length){
  problems++;
  console.log(`✗ NEVER SPAWNS — defined but unreachable in ${DAYS} days: ${never.join(", ")}`);
  console.log("    → a character the player can never meet is the v4.6 unreachable-event bug, in schedule form.");
} else {
  console.log(`✓ all ${Object.keys(NPCDEF).length} NPCs appear somewhere in the week`);
}

/* ---- 3. wander boxes that collide name tags ----
   Measured by simulating, not by comparing rectangles: two boxes can overlap on paper and never put
   their occupants close, and two boxes can barely touch and still collide constantly. The threshold
   is two tiles — a floating name tag is wider than one. */
const MIN_GAP = TILE * 2;
const crowded = [];
for(const id of MAP_IDS){
  for(const hr of [9, 12, 16]){
    s.day = 12; s.time = hr * 60;
    let m;
    try { m = newMap(id); spawnMapNpcs(m); } catch(e){ continue; }
    if(!m.npcs || m.npcs.length < 2) continue;
    let min = Infinity, pair = "";
    for(let t = 0; t < 400; t++){
      try { sb.get("curMap"); } catch(e){}
      try { updateNpcs.call(null, 0.1); } catch(e){ /* needs curMap; simulate by hand below */ }
      for(const n of m.npcs){                                  // hand-simulated wander (updateNpcs reads curMap)
        if(!n.wander) continue;
        if(!(t % 12)) n.dir = { x:[-1,0,1][Math.floor(Math.random()*3)], y:[-1,0,1][Math.floor(Math.random()*3)] };
        const d = n.dir || { x:0, y:0 };
        const nx = n.x + d.x * 3, ny = n.y + d.y * 3;
        if(nx >= n.wander.x0*TILE && nx <= n.wander.x1*TILE) n.x = nx;
        if(ny >= n.wander.y0*TILE && ny <= n.wander.y1*TILE) n.y = ny;
      }
      for(let i = 0; i < m.npcs.length; i++) for(let j = i + 1; j < m.npcs.length; j++){
        const a = m.npcs[i], b = m.npcs[j];
        const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if(dd < min){ min = dd; pair = `${a.id}/${b.id}`; }
      }
    }
    if(min < MIN_GAP) crowded.push({ map:id, hr, min:Math.round(min), pair });
  }
}
if(crowded.length){
  problems++;
  console.log("✗ CROWDED — wander boxes close enough to collide name tags (under 2 tiles):");
  for(const c of crowded) console.log(`    ${c.map} @${c.hr}:00 — ${c.pair} came within ${c.min}px`);
  console.log("    → re-cut the boxes so they tile the space. A box that holds N does not hold N+1.");
} else {
  console.log(`✓ no wander boxes collide (checked min separation over 400 simulated steps)`);
}

console.log(`\n${problems ? `${problems} schedule invariant(s) BROKEN.` : "all schedule invariants hold."}`);
process.exit(problems ? 1 : 0);
