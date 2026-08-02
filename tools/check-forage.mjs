#!/usr/bin/env node
/* ============================================================
   check-forage.mjs — the Foraging supply harness (v6.5 "The Wild").

   Run:  node tools/check-forage.mjs
         node tools/check-forage.mjs --census    (also print the full spawn census)
   Exit: 0 every supply invariant holds · 1 one is broken · 2 the harness is broken.

   WHY. v5.3's lesson, learned the expensive way: the gem-seam rate was wrong by SIX TIMES until it
   was sampled against the live generator, because a mine floor has ~100 open tiles and not ~600. A
   number nobody sampled is a guess wearing a decimal point. Foraging is the largest content table the
   game has ever added in one release — eighteen finds, twelve preparations, four ingredient categories
   — and almost every number in it is a claim about what the valley actually offers on a given day.

   So this file samples the shipped generators rather than reasoning about them, and asserts the three
   rules the design cannot be allowed to break:

   ── R1, AVAILABILITY ────────────────────────────────────────────────────────────────────────────
   Every ingredient of every non-keepsake preparation must be obtainable on at least 40% of the days
   of EVERY season.

   This is the WEATHERS contract expressed as a test. That header states it plainly: weather never
   takes anything away, it changes what the valley OFFERS, for one day. A preparation that REQUIRES a
   fog-only mushroom breaks it — "fog offers something" quietly becomes "no fog, no craft". Measured:
   fog is 10/6/16/13% by season, and rollWeatherFor suppresses it outright on ~13 dated days a year.

   The design's answer is not to unlock the mushroom. It is WILD_CATS: a locked find is a legal
   SUBSTITUTE, never a requirement, and every category holds a floor member available on every day of
   every season. So a category slot satisfies R1 through its floor, and the rare thing is simply the
   better thing to put in the slot when you have it.

   ── R2, WINDOW ──────────────────────────────────────────────────────────────────────────────────
   A find that is an input to anything must be gatherable for at least 6 game hours a day.

   One game hour is 16 real seconds (08-actions.js: `state.time += dt * (60/16)`), so 6 h = 96 real
   seconds. The shipped precedent is shardnode at 19:00 → the 26:00 forced sleep = 7 h = 112 s. The
   design's first draft put Moonwort — the top band's only repeatable — at 21:00, which is EIGHTY
   SECONDS a day. Anything narrower than R2 is a flourish on a find that feeds nothing.

   ── R3, NO ORPHANS ──────────────────────────────────────────────────────────────────────────────
   Every wild find and every cap must be consumed by something: a preparation, a category, EDIBLE, or
   an NPC's gift tastes. This release exists partly to ADOPT the game's orphans (Seaweed, Clam,
   Frostberry, Starlight Shard, Mountain Thyme…); minting new ones while doing it would be a joke at
   its own expense.

   THE KEEPSAKE EXEMPTION is deliberate and narrow: The Valley Posy may name locked finds directly,
   because it is required by nothing, has no expiry, and is the craft's memento rather than a step on
   its ladder.
   ============================================================ */
import { loadGame, CORE_FILES } from "./lib/load-game.mjs";

const CENSUS = process.argv.includes("--census");

const files = [...CORE_FILES];
files.splice(files.indexOf("06-weather.js") + 1, 0, "07-entities.js");
const sb = loadGame({ files });

const WILD = sb.get("WILD"), PREPS = sb.get("PREPS"), CAPS = sb.get("CAPS");
const WILD_CATS = sb.get("WILD_CATS"), WILD_CAT_FLOOR = sb.get("WILD_CAT_FLOOR");
const WILD_BY_ITEM = sb.get("WILD_BY_ITEM"), WEATHER_ODDS = sb.get("WEATHER_ODDS");
const SEASONS = sb.get("SEASONS"), EDIBLE = sb.get("EDIBLE"), NPCDEF = sb.get("NPCDEF");
const MAPS = sb.get("MAPS");
if(!WILD || !PREPS || !WILD_CATS){ console.error("Foraging tables not reachable — harness broken"); process.exit(2); }

let problems = 0, checks = 0;
const fail = [];
const ok = (cond, msg) => { checks++; if(!cond) fail.push(msg); };

/* The share of days in a season on which a find is on the map at all. Season and sky gate PRESENCE;
   the hour gates whether it GIVES (R2 covers that separately). A find with neither is 1.0. */
function availability(item, season){
  const w = WILD_BY_ITEM[item];
  if(!w) return 1;                                    // a shipped item (Honey, Clam, Seaweed…) — always buyable/gatherable
  if(w.seasons && !w.seasons.includes(season)) return 0;
  if(!w.sky) return 1;
  const odds = WEATHER_ODDS[season] || {};
  const total = Object.values(odds).reduce((a, b) => a + b, 0) || 1;
  return (odds[w.sky] || 0) / total;
}
/* A category slot is as available as its BEST member — which is why the floor member exists. */
function catAvailability(cat, season){
  const c = WILD_CATS[cat]; if(!c) return 0;
  return Math.max(...c.items.map(it => availability(it, season)));
}
function windowHours(item){
  const w = WILD_BY_ITEM[item]; if(!w) return 24;
  const from = w.fromHour || 6, to = w.toHour || 26;   // the day runs 6:00 to the 26:00 forced sleep
  return Math.max(0, to - from);
}

/* ---- R1 ---- */
for(const p of PREPS){
  if(p.keepsake) continue;
  for(const k in p.ing){
    const v = p.ing[k];
    for(const season of SEASONS){
      if(v && v.cat){
        const a = catAvailability(v.cat, season);
        ok(a >= 0.40, `R1: ${p.name}'s ${v.cat} slot is only ${(a*100).toFixed(0)}% available in ${season}`);
      } else {
        const a = availability(k, season);
        ok(a >= 0.40, `R1: ${p.name} requires ${k}, only ${(a*100).toFixed(0)}% available in ${season} — a locked find may only be reached through a category`);
      }
    }
  }
}
/* ---- R2 ---- */
const isInput = new Set();
for(const p of PREPS){
  if(p.keepsake) continue;
  for(const k in p.ing){ const v = p.ing[k];
    if(v && v.cat) WILD_CATS[v.cat].items.forEach(i => isInput.add(i)); else isInput.add(k); }
}
for(const item of isInput){
  if(!WILD_BY_ITEM[item]) continue;
  const h = windowHours(item);
  ok(h >= 6, `R2: ${item} feeds a preparation but is gatherable only ${h} game hours a day (${(h*16).toFixed(0)} real seconds)`);
}
/* ---- the category floors ---- */
for(const cat in WILD_CAT_FLOOR){
  const item = WILD_CAT_FLOOR[cat], w = WILD_BY_ITEM[item];
  ok(WILD_CATS[cat] && WILD_CATS[cat].items.includes(item), `${cat}'s floor "${item}" is not a member of its own category`);
  if(w){
    ok(!w.seasons, `${cat}'s floor "${item}" has a season lock — the whole point of a floor is that it never fails`);
    ok(!w.sky,     `${cat}'s floor "${item}" has a sky lock — same`);
    ok(!w.fromHour && !w.toHour, `${cat}'s floor "${item}" has an hour gate — same`);
  }
}
/* ---- R3 ---- */
const consumed = new Set();
for(const p of PREPS) for(const k in p.ing){ const v = p.ing[k];
  if(v && v.cat) WILD_CATS[v.cat].items.forEach(i => consumed.add(i)); else consumed.add(k); }
for(const cat in WILD_CATS) WILD_CATS[cat].items.forEach(i => consumed.add(i));
for(const id in NPCDEF){ const d = NPCDEF[id];
  (d.loved||[]).forEach(i => consumed.add(i)); (d.liked||[]).forEach(i => consumed.add(i)); }
for(const w of WILD)
  ok(consumed.has(w.item) || EDIBLE[w.item], `R3: ${w.item} is an orphan — nothing eats it, prepares it, or wants it as a gift`);
for(const c of CAPS)
  ok(consumed.has(c.name) || EDIBLE[c.name], `R3: ${c.name} is an orphan`);

/* ---- the census: sampled, never reasoned ---- */
const s = sb.freshState(); s.farm = sb.newMap("farm"); sb.setState(s);
const censusRows = [];
let anySeasonEmpty = 0;
for(const season of SEASONS){
  s.day = SEASONS.indexOf(season) * 28 + 5; s.weather = "clear";
  const per = {}; let total = 0;
  for(const id in MAPS){
    let m; try { m = sb.newMap(id); } catch(e){ continue; }
    for(const k in m.objects){ const o = m.objects[k]; if(o.kind !== "wild") continue; total++; per[o.w] = (per[o.w]||0) + 1; }
  }
  censusRows.push([season, total, per]);
  if(!total) anySeasonEmpty++;
}
ok(!anySeasonEmpty, "a season spawns NO wild nodes at all — the craft is unplayable that quarter");

console.log(`Foraging supply harness — ${checks} invariants over ${WILD.length} finds, ${PREPS.length} preparations, ${Object.keys(WILD_CATS).length} categories\n`);
console.log("  spawn census (clear day 5 of each season, every map):");
for(const [season, total, per] of censusRows){
  console.log(`    ${season.padEnd(7)} ${String(total).padStart(3)} nodes   ${Object.entries(per).map(([k,v]) => k+"×"+v).join("  ")}`);
}
if(CENSUS){
  console.log("\n  availability by season (share of days the find is on the map):");
  for(const w of WILD)
    console.log(`    ${w.item.padEnd(16)} ${SEASONS.map(se => (availability(w.item,se)*100).toFixed(0).padStart(4)+"%").join(" ")}   window ${windowHours(w.item)}h`);
}

if(fail.length){
  console.log("\n✗ SUPPLY INVARIANT BROKEN:");
  for(const f of [...new Set(fail)]) console.log("    · " + f);
  console.log(`\n${new Set(fail).size} broken.`);
  process.exit(1);
}
console.log("\n✓ R1 availability — every preparation is makeable on ≥40% of the days of every season");
console.log("✓ R2 window — every find that feeds something gives for ≥6 game hours a day");
console.log("✓ R3 no orphans — every find and every cap is consumed by something");
console.log("\nall supply invariants hold.");
process.exit(0);
