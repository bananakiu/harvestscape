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
import { loadGame, ROOT, CORE_FILES } from "./lib/load-game.mjs";

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
// ★ 10-ui.js is loaded so the journal-map tables (MAP_REGION, WORLD_MAP) are REACHABLE. Without it
// sb.get("MAP_REGION") is undefined and the map-coverage assertion below skips in silence — which is
// exactly what it did on its first run, reporting 3,547 green invariants while the check it had just
// been given did nothing. Fourth instance of that shape today; see check-interactions.mjs's header.
const sb = (() => {
  const f = [...CORE_FILES];
  f.splice(f.indexOf("06-weather.js") + 1, 0, "07-entities.js");
  f.splice(f.indexOf("01-data.js") + 1, 0, "03-art.js");
  f.push("10-ui.js");
  return loadGame({ files: f });
})();                                        // the CURRENT build — the thing under test
const levelFor = sb.get("levelFor");
const W = sb.get("W"), H = sb.get("H");
const SAVE_KEY = sb.get("SAVE_KEY");
const FRESH = sb.freshState();               // v6.4: the shape every migrated save must end up matching
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
  // ★ v6.4 — the general form of the line above, which existed only for Warding and so asserted
  // exactly one release's worth of the rule.
  //
  // migrateSave DOES seed new skill and tool keys correctly (two generic loops, 11-title.js ~294 and
  // ~303) — that was verified by disabling each and re-running, not by reading. But nothing asserted
  // the OUTCOME: "no demoted level" walks the save's own keys, so an absent key is neither a
  // demotion nor a NaN, and all 2,317 prior invariants would have passed with a craft missing
  // entirely. The mechanism was sound and unguarded; a refactor of either loop would have broken
  // every future craft in silence.
  //
  // Derived from freshState, so the three crafts still to come are covered the day their keys land.
  for(const sk in FRESH.skills){
    ok(s.skills && s.skills[sk] !== undefined, `skills.${sk} missing — the migration never gave this save the craft`);
    ok(Number.isFinite(s.skills && s.skills[sk]), `skills.${sk} is ${s.skills && s.skills[sk]}, not a number`);
  }
  // ★ v6.4.5 — THE TWO LADDER MIRRORS MUST AGREE.
  //
  // `unlockLadder(skill)` (01-data.js) feeds the cadence linter and the atlas. `unlocksAt(skill,lvl)`
  // (08-actions.js) feeds the in-game Skill Guide. They are mirrors of one another and they have now
  // drifted TWICE: v5.1 shipped Warding's technique ladder to the linter and not to the panel
  // (recorded at 01-data.js:3075), and v6.4 did exactly the same with Smithing's 26 forgings — the
  // linter graded 38 marks at 0.0% dead while the player was shown ten.
  //
  // A ladder the player cannot see is not a ladder, and a metric that measures a table no panel
  // renders is worse than no metric. So: for every skill, the two must produce the same count.
  {
    const unlockLadder = sb.get("unlockLadder"), unlocksAt = sb.get("unlocksAt");
    const keep = sb.get("state");
    sb.setState(Object.assign(FRESH, { flags: Object.assign({}, FRESH.flags, { staveEarned: true }) }));
    if(unlockLadder && unlocksAt) for(const sk in FRESH.skills){
      let panel = 0; for(let l = 1; l <= 99; l++) panel += unlocksAt(sk, l).length;
      const linter = unlockLadder(sk).length;
      ok(panel === linter,
        `${sk}: the Skill Guide shows ${panel} unlock(s) and the cadence linter counts ${linter} — ` +
        `unlocksAt (08-actions.js) and unlockLadder (01-data.js) are mirrors and have drifted`);
      // …and the level-up pointer must never skip a mark. nextUnlock is derived from unlocksAt as of
      // v6.4.5, so this can only fail if someone re-writes it as a third hand-kept copy. Which is
      // exactly what it was, and exactly how it came to point past nine levels of Smithing content.
      // `nextUnlock` means the first mark STRICTLY ABOVE the player's level, so from a fresh state
      // (level 1) the answer is the lowest mark greater than 1 — not marks[0], which may sit at 1.
      // (First pass asserted marks[0] and failed all ten fixtures on correct code. Worth recording:
      // the harness was wrong and the game was right, which is the failure mode that wastes a day if
      // you trust the red light without reading it.)
      const marks = unlockLadder(sk).map(u => u.lvl).sort((a, b) => a - b);
      const nextUnlock = sb.get("nextUnlock"), skillLvl = sb.get("skillLvl");
      if(nextUnlock && skillLvl && marks.length){
        const lv = skillLvl(sk);
        const want = marks.find(m => m > lv);
        const n = nextUnlock(sk);
        ok(want === undefined ? n === null : (n && n.at === want),
          `${sk}: at level ${lv} nextUnlock points at ${n ? n.at : "nothing"}, but the next real mark is ${want ?? "none"} — the pointer skips content`);
      }
    }
    sb.setState(keep || FRESH);
  }

  // ★ v6.5 — THE JOURNAL MAP MUST COVER THE WORLD.
  //
  // `MAP_REGION` (10-ui.js) folds every live map onto one board region. A map with no entry does not
  // fail loudly — it silently drops anyone standing on it off the journal map, and the place itself
  // never appears. That is how the Wrens' and Harrows' houses (v6.0), Marrow Point (v6.2) and the
  // Festival Green (v6.3) all went missing at once: four maps and, through them, six of thirteen
  // people. Total over MAPS, and every region must be a real board node.
  {
    const MAP_REGION = sb.get("MAP_REGION"), WORLD_MAP = sb.get("WORLD_MAP"), MAPS = sb.get("MAPS");
    // Not `if (…) {}`: a check that quietly does nothing when its subject is out of reach is the
    // failure mode this file keeps finding in the game. Assert reachability first, loudly.
    ok(!!MAP_REGION && !!WORLD_MAP && !!MAPS,
      "MAP_REGION / WORLD_MAP not reachable from the harness — the journal-map checks below would silently pass");
    if(MAP_REGION && WORLD_MAP && MAPS){
      const nodes = new Set(WORLD_MAP.map(n => n.id));
      for(const id in MAPS){
        ok(MAP_REGION[id] !== undefined, `MAP_REGION has no entry for the "${id}" map — it and anyone on it vanish from the journal map`);
        if(MAP_REGION[id]) ok(nodes.has(MAP_REGION[id]),
          `MAP_REGION["${id}"] = "${MAP_REGION[id]}", which is not a node on the journal map board`);
      }
    }
  }

  // ★ v6.4.4 — TABLE COMPLETENESS, the general form of two bugs shipped in one day.
  //
  // v6.4 added a seventh craft and a seventh tool, and TWO per-key tables were missed. One was caught
  // before release (SKILL_ICON — an absent entry draws `spr[undefined]`); the other shipped and was
  // found by a design review: TIER3_GEM had no `Hammer`, and the upgrade banner read "The undefined
  // is set into the handle." Both are the same defect — a table keyed by tool or by skill that a new
  // key was not added to — and neither is visible to a syntax check or to any behavioural harness,
  // because the read succeeds and yields `undefined`.
  //
  // So the tables are enumerated here, derived from freshState, and every future craft and tool is
  // covered the day its key lands. If a table legitimately does not apply to every key, it does not
  // belong in this list — say so with a comment rather than loosening the assertion.
  const perSkill = { MASTERY: 4, MASTERY_PRAISE: 4, MASTERY_NPC: 0, TRIALS: 2, SKILL_ICON: 0 };
  for(const t in perSkill){
    const tbl = sb.get(t); if(!tbl) continue;
    for(const sk in FRESH.skills){
      ok(tbl[sk] !== undefined, `${t} has no row for the ${sk} craft — a per-skill table a new craft was not added to`);
      if(perSkill[t] && tbl[sk])
        ok(Object.keys(tbl[sk]).length === perSkill[t],
           `${t}.${sk} has ${Object.keys(tbl[sk]).length} rung(s), expected ${perSkill[t]}`);
    }
  }
  const perTool = ["TOOL_ICON", "TOOL_SKILL", "TIER3_GEM"];
  for(const t of perTool){
    const tbl = sb.get(t); if(!tbl) continue;
    for(const tl in FRESH.tools)
      ok(tbl[tl] !== undefined, `${t} has no entry for the ${tl} — a per-tool table a new tool was not added to`);
  }
  for(const tl in FRESH.tools){
    ok(s.tools && s.tools[tl] !== undefined, `tools.${tl} missing — the migration never gave this save the tool`);
    ok(Number.isFinite(s.tools && s.tools[tl]), `tools.${tl} is ${s.tools && s.tools[tl]}, not a number`);
  }

  // ---- 1c. v5.6: the heart retier is not allowed to cost anyone a scene ----
  //
  // The v4.6 bug this guards: an early `hearts:8` event was written while `heartsOf` capped at 6, so
  // it was UNREACHABLE forever and nobody noticed until an audit read the table. Raising the cap to
  // 10 makes the opposite mistake possible too, so both directions are asserted — and the "already
  // seen stays seen" half is checked on the real fixture, not in the abstract.
  const HEART_EVENTS = sb.get("HEART_EVENTS") || {}, HEART_CAP = sb.get("HEART_CAP") || 6;
  const seenBefore = Object.keys(fx.save.flags || {}).filter(k => /^he_/.test(k) && fx.save.flags[k]);
  for(const k of seenBefore) ok(s.flags[k] === true, `${k} was a seen scene and the migration un-saw it`);
  const flagsUsed = new Set();
  for(const id in HEART_EVENTS) for(const ev of HEART_EVENTS[id]){
    ok(ev.hearts <= HEART_CAP, `${id}'s ${ev.hearts}♥ scene is above the cap of ${HEART_CAP} — unreachable forever (the v4.6 bug)`);
    ok(!flagsUsed.has(ev.flag), `duplicate heart-event flag ${ev.flag} — one of those scenes can never fire`);
    flagsUsed.add(ev.flag);
  }

  // ---- 1d. v6.0/v6.1: the cast bar. ★ The rule the owner's own word set ("functional characters
  // that have their own lives and their own scenes"), turned from a promise into a check.
  //
  // A new NPC who merely stands somewhere satisfies the ask on paper and fails it in play. This is
  // the definition of "fails": no birthday, no gift tastes, no arc — or, for a romance candidate,
  // marriable with nothing to say afterwards, which is precisely the broken promise v5.5 shipped to
  // repair for the spouse and which a third candidate could re-open in one line.
  const NPCDEF = sb.get("NPCDEF") || {}, BIRTHDAYS = sb.get("BIRTHDAYS") || {};
  const MARRIAGE_SCENES = sb.get("MARRIAGE_SCENES") || {}, MARRIED_SCENES = sb.get("MARRIED_SCENES") || {};
  const MARRIED_LINES = sb.get("MARRIED_LINES") || {};
  for(const id in NPCDEF){
    const d = NPCDEF[id];
    ok(!!BIRTHDAYS[id], `${id} has no birthday — the calendar can't hold them`);
    ok((d.loved || []).length > 0 && (d.liked || []).length > 0, `${id} has no gift tastes — gifting them is a coin flip`);
    ok((HEART_EVENTS[id] || []).length > 0, `${id} has no heart events — they're furniture that walks`);
    if(d.romance){
      ok(typeof MARRIAGE_SCENES[id] === "function", `${id} is romanceable with no marriage scene`);
      ok((MARRIED_SCENES[id] || []).length > 0, `${id} can be married and then has no arc — the v5.5 cliff, re-opened`);
      ok(!!MARRIED_LINES[id], `${id} can be married and then has nothing to say day to day`);
      const top = Math.max(...(HEART_EVENTS[id] || [{hearts:0}]).map(e => e.hearts));
      ok(top >= HEART_CAP, `${id}'s ladder tops out at ${top}, below the cap of ${HEART_CAP} — a candidate you can max and then exhaust`);
    }
  }

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
