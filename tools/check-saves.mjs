#!/usr/bin/env node
/* ============================================================
   check-saves.mjs — the migration harness (v5.0 "The Strongbox").

   Run:  node tools/check-saves.mjs            (all fixtures)
         node tools/check-saves.mjs v3.20.0    (one era)
   Exit: 0 all invariants hold · 1 something regressed · 2 the harness itself is broken.

   WHAT THIS DEFENDS. `migrateSave` (11-title.js) is the single function standing between an old
   save and the current build. It has grown across ~124 version codes, it contains at least four
   ordering hazards documented in its own comments ("MUST run before the generic backfill, or this
   becomes dead code" — a trap the repo has fallen into twice), and until this file it had no
   automated coverage whatsoever. V5 adds more persisted state than any version before it, so the
   coverage has to exist BEFORE the state does — which is why this ships in v5.0 and not later.

   WHAT IT ASSERTS, on every era fixture (see tools/make-save-fixtures.mjs):
     · no demoted level        — the cozy contract's hardest line: a recalibration may never
                                 cost a player a level they already saw
     · no lost item, gold, crop, animal, friend, discovery, or quest step
     · no downgraded tool      — the v3.37 five→seven tier remap, which silently turned Star
                                 Metal into Cobalt if it ever ran twice or never
     · no NaN and no undefined anywhere in the migrated save
     · idempotence             — migrateSave runs on EVERY load; if it isn't a fixed point after
                                 the first pass, a save degrades a little every time it is opened
     · the Strongbox round-trip — export → parse → identical save, on every era

   These are stated as claims about the PLAYER's experience, not about code shape, on purpose.
   A refactor is free to change everything in migrateSave; it is not free to cost anyone a turnip.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { loadGame, ROOT } from "./lib/load-game.mjs";

const DIR = path.join(ROOT, "tools", "fixtures", "saves");
const only = process.argv[2];

if(!fs.existsSync(DIR)){
  console.error("No fixtures. Run: node tools/make-save-fixtures.mjs");
  process.exit(2);
}
const files = fs.readdirSync(DIR).filter(f => f.endsWith(".json"))
  .filter(f => !only || f === only + ".json")
  .sort((a, b) => a.localeCompare(b, "en", { numeric:true }));
if(!files.length){ console.error(`no fixture matched: ${only}`); process.exit(2); }

const clone = o => JSON.parse(JSON.stringify(o));

// Deep scan for the two values that turn a save into a black screen three days later: NaN (any
// arithmetic on an undefined field) and undefined (a key the backfill missed). Returns paths.
function scanBadNumbers(o, at = "state", out = [], seen = new Set()){
  if(o === null) return out;
  if(typeof o === "number"){ if(!Number.isFinite(o)) out.push(`${at} = ${o}`); return out; }
  if(typeof o !== "object") return out;
  if(seen.has(o)){ out.push(`${at} is a cycle (unsaveable)`); return out; }
  seen.add(o);
  if(Array.isArray(o)){ o.forEach((v, i) => { if(v === undefined) out.push(`${at}[${i}] = undefined`); else scanBadNumbers(v, `${at}[${i}]`, out, seen); }); return out; }
  for(const k in o){
    if(o[k] === undefined){ out.push(`${at}.${k} = undefined`); continue; }
    scanBadNumbers(o[k], `${at}.${k}`, out, seen);
  }
  return out;
}
// Structural equality that reports the FIRST difference by path — "not idempotent" is useless
// without knowing which field moved on the second pass.
function firstDiff(a, b, at = ""){
  if(a === b) return null;
  if(typeof a !== typeof b) return `${at || "root"}: ${typeof a} vs ${typeof b}`;
  if(typeof a !== "object" || a === null || b === null) return `${at || "root"}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
  const ka = Object.keys(a), kb = Object.keys(b);
  for(const k of ka){ if(!(k in b)) return `${at}.${k}: present vs missing`; const d = firstDiff(a[k], b[k], `${at}.${k}`); if(d) return d; }
  for(const k of kb) if(!(k in a)) return `${at}.${k}: missing vs present`;
  return null;
}

let failures = 0, checks = 0;
const sb = loadGame();                       // the CURRENT build — the thing under test
const levelFor = sb.get("levelFor");
const W = sb.get("W"), H = sb.get("H");
const SAVE_KEY = sb.get("SAVE_KEY");
const store = sb.__store;

console.log(`Migration harness — ${files.length} era fixture(s) against v${sb.get("VERSION").name} (code ${sb.get("VERSION").code})\n`);

for(const file of files){
  const fx = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  const problems = [], notes = [];
  const ok = (cond, msg) => { checks++; if(!cond) problems.push(msg); };

  const s = clone(fx.save);
  try { sb.migrateSave(s); }
  catch(e){
    console.log(`✗ ${fx.era.padEnd(9)} migrateSave THREW: ${e.message}`);
    failures++; continue;
  }
  const E = fx.expect;

  // ---- 1. never demote a level (the contract's hardest line) ----
  //
  // v5.1 made this the sharpest assertion in the file. The mastery trials CLAMP a skill's effective
  // level at 50 (then 75) until that craft's trial is cleared — which, applied naively to an existing
  // save, would silently take levels off every long-standing player in the game. `migrateSave`
  // grandfathers instead: every gate a save is already past is marked passed on load. So the level
  // checked here is the EFFECTIVE one (`skillLvl`, what the game actually treats you as), not the raw
  // curve reading — because a grandfathering bug would be invisible to the raw number and total to
  // the player.
  sb.setState(s);   // skillLvl/trialCap read the live `state`
  for(const sk in E.levels){
    const was = E.levels[sk], now = sb.get("skillLvl")(sk), raw = levelFor(s.skills[sk] || 0);
    ok(now >= was, `${sk} demoted: was Lv${was}, now Lv${now} (raw ${raw}) — a mastery gate was applied retroactively`);
    if(now > was) notes.push(`${sk} rose ${was}→${now} (documented one-time gift of the v2.8 curve translation)`);
  }
  // ---- 1b. the trials specifically: grandfathered, and holding nothing they already had ----
  const TRIAL_GATES = sb.get("TRIAL_GATES") || [], TRIALS = sb.get("TRIALS") || {};
  ok(s.trialsSeeded === true, "trialsSeeded not set — an old save would be re-grandfathered on every load");
  ok(Array.isArray(s.trialsDone), "trialsDone missing or not an array");
  for(const sk in TRIALS){
    const raw = levelFor(s.skills[sk] || 0);
    for(const g of TRIAL_GATES){
      if(raw >= g) ok((s.trialsDone || []).includes(sk + g),
        `${sk} was already Lv${raw} (past ${g}) but its ${g}-trial was not grandfathered — that save just lost levels`);
      else ok(!(s.trialsDone || []).includes(sk + g),
        `${sk} is only Lv${raw} but its ${g}-trial is marked passed — a gate was skipped`);
    }
  }
  // The cap is what the clamp reads, so it has to be one of the three legal values and never below
  // the level the player is standing on — a cap under the effective level would BE the demotion.
  for(const sk in TRIALS){
    const capNow = sb.get("trialCap")(sk);
    ok([50, 75, 99].includes(capNow), `${sk}: trialCap returned ${capNow}, which is not a gate`);
    ok(capNow >= sb.get("skillLvl")(sk), `${sk}: cap ${capNow} sits below the effective level — that is a demotion`);
  }
  ok(s.skills && s.skills.Warding !== undefined, "skills.Warding missing — a pre-v4 save must gain the sixth skill");

  // ---- 2. never lose anything held ----
  for(const item in E.inv){
    const now = (s.inv || {})[item], shelved = (s.shelf || {})[item] || 0;
    ok((now || 0) + shelved >= E.inv[item], `lost ${item}: had ${E.inv[item]}, now ${now || 0}${shelved ? ` (+${shelved} shelved)` : ""}`);
  }
  ok(s.gold === E.gold, `gold changed: ${E.gold} → ${s.gold}`);
  ok(s.day === E.day, `day changed: ${E.day} → ${s.day}`);
  ok(s.questIdx === E.questIdx, `questIdx moved: ${E.questIdx} → ${s.questIdx}`);
  const cropsNow = Object.keys((s.farm && s.farm.crops) || {}).length;
  ok(cropsNow >= E.crops, `crops lost in the farm rebuild: ${E.crops} → ${cropsNow}`);
  for(const id in E.rel) ok(((s.rel || {})[id] || {}).points >= E.rel[id], `${id}'s regard fell: ${E.rel[id]} → ${((s.rel||{})[id]||{}).points}`);
  ok(Object.keys(s.discovered || {}).length >= E.discovered, `the Collection shrank: ${E.discovered} → ${Object.keys(s.discovered||{}).length}`);
  if(E.animals) for(const kind in E.animals)
    ok(((s.animals || {})[kind] || []).length >= E.animals[kind], `${kind} lost: ${E.animals[kind]} → ${((s.animals||{})[kind]||[]).length}`);

  // ---- 3. never downgrade a tool (the v3.37 five→seven tier remap) ----
  for(const t in E.tools){
    const was = E.tools[t], now = (s.tools || {})[t];
    if(E.toolIndexEra === "five" && was === 4)
      ok(now === 6, `${t} lost its Star Metal head: pre-v3.37 index 4 must remap to 6, got ${now}`);
    else
      ok(now >= was, `${t} downgraded: tier ${was} → ${now}`);
  }

  // ---- 4. the farm lands on the current canvas ----
  ok(s.farm && Array.isArray(s.farm.tiles) && s.farm.tiles.length === W * H,
     `farm is not on the current canvas: expected ${W}×${H}=${W*H} tiles, got ${s.farm && s.farm.tiles && s.farm.tiles.length}`);

  // ---- 5. no NaN, no undefined ----
  const bad = scanBadNumbers(s);
  ok(bad.length === 0, `unsaveable values: ${bad.slice(0, 5).join("; ")}${bad.length > 5 ? ` (+${bad.length-5} more)` : ""}`);
  ok(typeof s.resolve === "number" && typeof s.iFrame === "number",
     "resolve/iFrame must be numbers before combat (undefined<=0 is false, which silently disables all damage)");

  // ---- 6. idempotence — migrateSave runs on EVERY load ----
  const twice = clone(s);
  try { sb.migrateSave(twice); } catch(e){ problems.push(`second migrateSave threw: ${e.message}`); }
  const diff = firstDiff(s, twice);
  // farm.animals is deliberately re-cleared each load (stale wrapper entities), so an empty-array
  // reset is not drift; anything else is.
  ok(!diff, `migrateSave is not idempotent — ${diff}. A save would degrade a little on every load.`);

  // ---- 7. the Strongbox round-trip, on every era ----
  try{
    store[SAVE_KEY] = JSON.stringify(s);
    const txt = sb.exportSaveText();
    const parsed = sb.parseSaveText(txt);
    ok(parsed.ok, `export/import rejected its own file: ${parsed.err}`);
    if(parsed.ok) ok(!firstDiff(parsed.save, s), `export/import changed the save: ${firstDiff(parsed.save, s)}`);
    ok(!sb.parseSaveText(txt.slice(0, txt.length - 200)).ok, "a truncated export was accepted");
  }catch(e){ problems.push(`Strongbox round-trip threw: ${e.message}`); }
  delete store[SAVE_KEY];

  if(problems.length){
    failures++;
    console.log(`✗ ${fx.era.padEnd(9)} ${fx.note}`);
    for(const p of problems) console.log(`    · ${p}`);
  } else {
    console.log(`✓ ${fx.era.padEnd(9)} ${fx.note}`);
    for(const n of notes) console.log(`    note: ${n}`);
  }
}

console.log(`\n${checks} invariants checked across ${files.length} era(s) — ${failures ? `${failures} FIXTURE(S) FAILED` : "all held"}.`);
process.exit(failures ? 1 : 0);
