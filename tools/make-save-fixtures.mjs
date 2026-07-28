#!/usr/bin/env node
/* ============================================================
   make-save-fixtures.mjs — build the migration harness's era fixtures.

   Run:  node tools/make-save-fixtures.mjs            (regenerate all)
         node tools/make-save-fixtures.mjs v3.21.0    (one era)
   Out:  tools/fixtures/saves/<tag>.json  (committed — the harness reads these, not git)

   WHY THIS IS NOT HAND-WRITTEN. A fixture invented by hand is a guess about what an old save
   looked like, and a guess is exactly the thing `migrateSave` keeps getting wrong (three separate
   comments in 11-title.js document the same trap: a migration that ran too late became dead code
   because freshState's default had already been stamped in). So each fixture is built by
   CHECKING OUT THAT RELEASE'S OWN CODE and playing a short synthetic game in it: the era's
   freshState, the era's map generator, the era's XP table, the era's item names. Whatever shape
   that produces IS the era's shape, by construction.

   Each fixture also carries an `expect` block, computed with the ERA's OWN levelFor — the levels
   the player actually saw. That is what makes "a migration must never demote anyone" checkable
   instead of aspirational.

   Fixtures are committed so the harness runs anywhere, offline, without git archive.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { loadGame, ROOT } from "./lib/load-game.mjs";

const OUT = path.join(ROOT, "tools", "fixtures", "saves");

// The eras worth keeping, each chosen because a NAMED migration branch in migrateSave keys off it.
// (Adding an era is cheap: add a row, rerun. Removing one deletes coverage — don't.)
const ERAS = [
  { tag:"v2.1.0",  note:"pre-v2.7 XP curve, 60×46 town-on-farm map, pre-Collection, pre-NPX, pre-construction, tools at the OLD 5-tier index" },
  { tag:"v2.6.1",  note:"the Collection-seeding era — the save that proved a migration placed after the generic backfill is dead code" },
  { tag:"v2.9.2",  note:"last of v2: post-XP-recalibration (xpCurve 3), still the pre-v3 world split" },
  { tag:"v3.1.1",  note:"the open 60×46 farm, one release before the v3.2 shrink rebuilds the map coordinate by coordinate" },
  { tag:"v3.20.0", note:"pre-construction: coop and barn baked into the farm, so bornUnbuilt must grant both" },
  { tag:"v3.36.0", note:"pre-v3.37 tool ladder: tools[t]===4 still means STAR METAL and must remap to 6, not stay Cobalt" },
  { tag:"v4.0.0",  note:"Warding arrives — the sixth skill, Resolve, the Undercroft" },
  { tag:"v4.31.0", note:"the carry cap lands: bagBonus must grandfather a hoarding save" },
  { tag:"v4.37.0", note:"the release immediately before v5.0 — the no-op case, which must stay a no-op" },
];

// The load order we can evaluate headlessly, filtered per era to what that release actually had.
const WANT = ["00-core.js","01-data.js","04-world.js","08-actions.js","09-quests.js",
              "13-content.js","15-warding.js","14-story.js","11-title.js"];

function checkout(tag){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `hs-${tag}-`));
  const tar = execFileSync("git", ["archive", tag, "game/js"], { cwd: ROOT, maxBuffer: 1 << 28 });
  execFileSync("tar", ["-x", "-C", dir], { input: tar });
  return path.join(dir, "game", "js");
}

// A short synthetic life, played through whatever API the era exposes. Everything here is
// defensive: an era that lacks a system simply doesn't get that part of the save, which is the
// point — the fixture must not contain fields its era never had.
function playEra(sb, tag){
  const get = sb.get;
  const s = sb.freshState();
  s.farm = sb.newMap("farm");

  const XP = get("XP_TABLE");
  const levelFor = get("levelFor") || (xp => { let l=1; while(l<99 && XP[l+1]<=xp) l++; return l; });
  // Deliberately uneven levels across the ladder, including one past the point where the two XP
  // curves diverge most, so a level-preserving translation has something to prove.
  const TARGET = { Farming:41, Woodcutting:27, Mining:13, Fishing:58, Cooking:8, Warding:22 };
  for(const sk in s.skills){ if(TARGET[sk]) s.skills[sk] = XP[TARGET[sk]] + 3; }

  s.gold = 74_310;
  s.day = 214;                       // year 2, deep enough that seasonal state matters
  s.time = 13 * 60;
  s.energy = 62;

  // Inventory: real item names from the era's own tables, so nothing here is invented.
  const CROPS = get("CROPS") || {};
  const cropNames = Object.values(CROPS).map(c => c.name).filter(Boolean);
  const FISH = get("FISH") || [];
  s.inv = Object.assign({}, s.inv);
  cropNames.slice(0, 6).forEach((n, i) => { s.inv[n] = 3 + i * 7; });
  (FISH.slice(0, 3) || []).forEach((f, i) => { s.inv[f.name] = 2 + i; });
  s.inv["Wood"] = 240; s.inv["Stone"] = 118;

  // Tools. On a pre-v3.37 save, index 4 IS Star Metal — the exact value the ladder6 remap exists
  // to rescue. On a modern save, 4 is Cobalt and must be left alone.
  for(const t in s.tools) s.tools[t] = 4;

  // A worked farm: crops mid-growth, some watered. Written through the era's own tile constants.
  const T = get("T"), key = get("key"), W = get("W");
  // NB the crop shape is the game's own: { type:<CROPS key>, days:<n> }. Wateredness lives on the
  // TILE (T.WATERED), not on the crop. Getting this wrong once produced fixtures the renderer
  // crashed on — a fixture that can't be played isn't evidence of anything.
  if(T && key && s.farm && s.farm.tiles){
    const seed = Object.keys(CROPS)[0], span = CROPS[seed].days || 4;
    let placed = 0;
    for(let y = 10; y < 16 && placed < 18; y++){
      for(let x = 6; x < 12 && placed < 18; x++){
        const k = key(x, y);
        if(s.farm.objects[k] || s.farm.warps[k]) continue;
        s.farm.tiles[y * W + x] = (placed % 3) ? T.TILLED : T.WATERED;
        s.farm.crops[k] = { type: seed, days: placed % (span + 1) };
        placed++;
      }
    }
  }
  // Animals, relationships, discoveries, flags — the fields most likely to be quietly dropped.
  if(s.animals){
    if(s.animals.chickens) s.animals.chickens.push({ friend: 180, eggDay: 3, petDay: 2 }, { friend: 40, eggDay: 1, petDay: 0 });
    if(s.animals.cows) s.animals.cows.push({ friend: 260, milkDay: 4, petDay: 3 });
    if(s.animals.sheep) s.animals.sheep.push({ friend: 90, woolDay: 2, petDay: 1 });
  }
  const NPCDEF = get("NPCDEF");
  const ids = NPCDEF ? (Array.isArray(NPCDEF) ? NPCDEF.map(n => n.id) : Object.keys(NPCDEF)) : ["maya","tom","rowan"];
  s.rel = {};
  ids.slice(0, 5).forEach((id, i) => { s.rel[id] = { points: 120 + i * 90, talkedDay: 210, giftedDay: 209 }; });
  s.discovered = Object.assign({}, s.discovered);
  for(const n of Object.keys(s.inv)) s.discovered[n] = true;
  s.questIdx = 4; s.questDone = [0,1,2,3];
  s.flags = Object.assign({}, s.flags, { introSeen:true, act1Done:true, confided_maya:true });
  if(s.stats){ s.stats.harvested = 640; s.stats.earned = 210_000; s.stats.sold = 480; }
  if("mineBest" in s) s.mineBest = 22;
  if("wardBest" in s) s.wardBest = 12;

  // What the player SAW, in this era's own terms. The harness asserts none of it is ever lost.
  const expect = {
    levels: Object.fromEntries(Object.keys(s.skills).map(k => [k, levelFor(s.skills[k])])),
    gold: s.gold, day: s.day,
    inv: Object.assign({}, s.inv),
    tools: Object.assign({}, s.tools),
    crops: Object.keys(s.farm.crops || {}).length,
    rel: Object.fromEntries(Object.entries(s.rel).map(([k, v]) => [k, v.points])),
    discovered: Object.keys(s.discovered).length,
    questIdx: s.questIdx,
    animals: s.animals ? { chickens:(s.animals.chickens||[]).length, cows:(s.animals.cows||[]).length, sheep:(s.animals.sheep||[]).length } : null,
    // Star-tier tools are the one value whose MEANING changed between eras (v3.37 inserted two
    // tiers). Pre-v3.37, 4 meant Star Metal; the harness reads this to know which claim to make.
    toolIndexEra: (get("TOOL_TIERS") || []).length >= 7 ? "seven" : "five",
  };
  return { save: s, expect };
}

function build(era){
  const dir = checkout(era.tag);
  const files = WANT.filter(f => fs.existsSync(path.join(dir, f)));
  const sb = loadGame({ files, srcDir: dir });
  const { save, expect } = playEra(sb, era.tag);
  const fixture = {
    era: era.tag,
    version: (sb.get("VERSION") || {}).name || era.tag.slice(1),
    code: (sb.get("VERSION") || {}).code || null,
    note: era.note,
    generated: "by tools/make-save-fixtures.mjs from this tag's own code",
    expect, save,
  };
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, era.tag + ".json");
  fs.writeFileSync(out, JSON.stringify(fixture, null, 1));
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`  ${era.tag.padEnd(9)} v${fixture.version} · ${files.length} files · ${Object.keys(expect.levels).length} skills · ${kb} KB`);
}

/* ---------------- the year-3 stress fixture ----------------
   Not an era snapshot — a forward-looking WORST CASE, built from the CURRENT code. Every V5 and V6
   feature that adds drawn or persisted state (the decoratable cottage above all) has to land against
   a measured number rather than "it felt fine on my machine", and the honest measurement is a save
   two-and-a-bit years deep: the plot fully planted, décor at the cap, every animal, deep progress in
   every ladder, a bulging Collection. Read by tools/check-perf.mjs, and restorable through the Save
   File panel if you want to walk around inside it. */
function buildDense(){
  const sb = loadGame();
  const get = sb.get;
  const s = sb.freshState();
  s.farm = sb.newMap("farm");
  const T = get("T"), key = get("key"), W = get("W"), H = get("H");
  const XP = get("XP_TABLE"), CROPS = get("CROPS"), DECOR = get("DECOR") || {};
  const TILLABLE = get("TILLABLE");

  s.day = 2 * 112 + 96;              // day 320 — deep in year 3 (a year is 112 days), late fall
  s.gold = 1_480_000;                // past the tenth patron fixture — the endgame wallet
  for(const sk in s.skills) s.skills[sk] = XP[92];
  for(const t in s.tools) s.tools[t] = get("MAX_TIER");
  s.bagTier = (get("BAG_CAPS") || [0]).length - 1;

  // The plot, fully worked: every tillable tile that is free carries a growing crop.
  const cropKeys = Object.keys(CROPS);
  let n = 0;
  for(let y = 1; y < H - 1; y++) for(let x = 1; x < W - 1; x++){
    const k = key(x, y);
    if(s.farm.objects[k] || s.farm.crops[k] || s.farm.warps[k]) continue;
    if(!TILLABLE.has(s.farm.tiles[y * W + x])) continue;
    s.farm.tiles[y * W + x] = (n % 2) ? T.WATERED : T.TILLED;
    const type = cropKeys[n % cropKeys.length];
    s.farm.crops[k] = { type, days: n % ((CROPS[type].days || 4) + 1) };   // the game's own crop shape
    n++;
  }
  // Décor at the cap, hives, orchard — the objects a busy farm actually draws.
  const decorKinds = Object.keys(DECOR);
  let placed = 0;
  for(let y = 2; y < H - 2 && placed < 40; y += 2) for(let x = 2; x < W - 2 && placed < 40; x += 3){
    const k = key(x, y);
    if(s.farm.objects[k] || s.farm.crops[k] || s.farm.warps[k]) continue;
    s.farm.objects[k] = { kind: decorKinds[placed % decorKinds.length] };
    s.flags["placed_" + decorKinds[placed % decorKinds.length]] = true;
    placed++;
  }
  // Every animal the buildings hold, every one well-loved.
  const fill = (arr, k, cnt) => { for(let i = 0; i < cnt; i++) arr.push({ friend: 400, [k]: 1, petDay: s.day - 1, name: "Fixture " + i }); };
  fill(s.animals.chickens, "eggDay", 6); fill(s.animals.cows, "milkDay", 4); fill(s.animals.sheep, "woolDay", 4);

  // A full bag and a full chest, a maxed Collection, every friend at the cap, all the permanents.
  const names = new Set();
  for(const k in CROPS) names.add(CROPS[k].name);
  for(const f of get("FISH") || []) names.add(f.name);
  for(const r of get("RECIPES") || []) names.add(r.name);
  for(const k in get("ORES") || {}) names.add(get("ORES")[k].drop);
  let i = 0;
  for(const nm of names){ s.discovered[nm] = true; (i++ % 3 ? s.inv : s.shelf)[nm] = 99; }
  const NPCDEF = get("NPCDEF");
  for(const id of (NPCDEF ? (Array.isArray(NPCDEF) ? NPCDEF.map(x => x.id) : Object.keys(NPCDEF)) : []))
    s.rel[id] = { points: 600, talkedDay: s.day, giftedDay: s.day };
  s.liftStops = [5,10,15,20,25,30,35,40,45];
  s.waystones = ["way1","way3","way6","way9"];
  s.wardBells = [5,10,15,20,25,30,35,40,45];
  s.mineBest = 120; s.wardBest = 45; s.groveBest = 9; s.wardChapter = 8; s.patronTier = 12;
  s.questIdx = (get("QUESTS") || []).length;
  s.questDone = (get("QUESTS") || []).map((_, j) => j);
  Object.assign(s.flags, { introSeen:true, act1Done:true, act2Done:true, festivalDone:true,
    married:true, spouse:"maya", tenthDoorOpen:true, tenthWingLit:true, staveEarned:true,
    proj_coop:true, proj_barn:true, proj_stable:true, bornUnbuilt:false, ladder6:true, npxGame:false, arrivalSeen:true });
  for(const st in s.stats) s.stats[st] = 5000;

  const out = path.join(OUT, "dense-year3.json");
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(out, JSON.stringify({
    era: "dense-year3",
    version: sb.get("VERSION").name, code: sb.get("VERSION").code,
    note: "synthetic worst case: year 3, plot fully planted, décor at the cap, every animal, all six skills at 92, deep permanents",
    generated: "by tools/make-save-fixtures.mjs from the CURRENT build (not an era snapshot)",
    expect: { levels: Object.fromEntries(Object.keys(s.skills).map(k => [k, 92])), gold: s.gold, day: s.day,
              inv: {}, tools: Object.assign({}, s.tools), crops: Object.keys(s.farm.crops).length,
              rel: Object.fromEntries(Object.entries(s.rel).map(([k, v]) => [k, v.points])),
              discovered: Object.keys(s.discovered).length, questIdx: s.questIdx,
              animals: { chickens:6, cows:4, sheep:4 }, toolIndexEra: "seven" },
    save: s,
  }, null, 1));
  console.log(`  dense-year3  ${Object.keys(s.farm.crops).length} crops · ${Object.keys(s.farm.objects).length} farm objects · ` +
              `${Object.keys(s.inv).length} carried kinds · ${(fs.statSync(out).size/1024).toFixed(0)} KB`);
}

const only = process.argv[2];
if(only === "dense"){ console.log("Building the year-3 stress fixture:"); buildDense(); process.exit(0); }
const list = only ? ERAS.filter(e => e.tag === only) : ERAS;
if(!list.length){ console.error(`no such era: ${only}\nknown: ${ERAS.map(e => e.tag).join(", ")}`); process.exit(2); }
console.log(`Building ${list.length} save fixture(s) from their own releases' code:`);
for(const era of list){
  try { build(era); }
  catch(e){ console.error(`  ${era.tag}: FAILED — ${e.message}`); process.exitCode = 1; }
}
if(!only){ try { buildDense(); } catch(e){ console.error(`  dense-year3: FAILED — ${e.message}`); process.exitCode = 1; } }
