#!/usr/bin/env node
/* ============================================================
   check-perf.mjs — the year-3 performance budget (v5.0 "The Strongbox").

   Run:  node tools/check-perf.mjs
         node tools/check-perf.mjs --set     (re-record the baseline after an intentional change)
   Exit: 0 within budget · 1 over budget · 2 the harness itself is broken.

   WHY. V5's largest feature is a persistent, decoratable cottage — new drawn and persisted state on
   the one map the player stands in every single day — and V6 piles more on top (the Loom's outputs,
   the venues, the records). The roadmap says those features must "land against a number, not a
   hope." This is the number.

   WHAT IT MEASURES, on the dense year-3 fixture (1,100+ crops, décor at the cap, every animal, all
   six ladders at 92 — tools/make-save-fixtures.mjs):
     · migrateSave      — runs on EVERY load, on the biggest save the game can hold
     · save serialize   — what saveGame costs at dusk, and what the Strongbox has to move
     · save size        — the export the player copies; a save that outgrows a clipboard is a
                          feature that quietly stops working
     · map generation   — every map, generated fresh: the hitch on a doorway, per map
     · Strongbox round-trip — export + checksum + parse, the cost of the panel's two buttons

   WHAT IT DOES NOT MEASURE: the frame. That needs a real canvas and a real GPU, so it lives in the
   game as `perfProbe(seconds)` (12-game.js) — load dense-year3.json through the Save File panel and
   run `await perfProbe(5)` in the console. The frame baseline is recorded below by hand, with the
   machine that measured it, because an unlabelled millisecond is not evidence.

   BUDGETS are ceilings with deliberate headroom (~3× the measured baseline), not targets. Blowing
   one is not automatically a bug — it is a prompt to look, and to re-record with --set if the cost
   is understood and accepted. Cheap to run, honest when it fails.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { loadGame, ROOT } from "./lib/load-game.mjs";

const FIXTURE = path.join(ROOT, "tools", "fixtures", "saves", "dense-year3.json");
const BUDGET_FILE = path.join(ROOT, "tools", "fixtures", "perf-budget.json");
const SET = process.argv.includes("--set");

if(!fs.existsSync(FIXTURE)){
  console.error("No dense fixture. Run: node tools/make-save-fixtures.mjs dense");
  process.exit(2);
}
const fx = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
const sb = loadGame();
const MAPS = sb.get("MAPS");

// Median of N runs: a single timing on a laptop is noise, and the mean chases the one run that
// collided with a GC.
function median(fn, runs = 7){
  const t = [];
  for(let i = 0; i < runs; i++){ const a = performance.now(); fn(); t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  return +t[t.length >> 1].toFixed(3);
}
const clone = o => JSON.parse(JSON.stringify(o));

const measured = {};
measured["migrateSave (dense)"] = median(() => sb.migrateSave(clone(fx.save)));
const migrated = clone(fx.save); sb.migrateSave(migrated);
measured["save serialize"] = median(() => JSON.stringify(migrated));
measured["save size KB"] = +(Buffer.byteLength(JSON.stringify(migrated), "utf8") / 1024).toFixed(1);

sb.__store[sb.get("SAVE_KEY")] = JSON.stringify(migrated);
measured["Strongbox export+parse"] = median(() => sb.parseSaveText(sb.exportSaveText()), 5);
measured["export size KB"] = +(Buffer.byteLength(sb.exportSaveText(), "utf8") / 1024).toFixed(1);
delete sb.__store[sb.get("SAVE_KEY")];

// Map generation, per map. `state` must be live: several generators read the save (the farm's
// funded projects, the mine's depth, the Undercroft's floor), and that read is part of the cost.
sb.setState(migrated);
const mapRows = [];
for(const id of Object.keys(MAPS)){
  try { mapRows.push([id, median(() => sb.newMap(id), 5)]); }
  catch(e){ mapRows.push([id, null, e.message]); }
}
mapRows.sort((a, b) => (b[1] || 0) - (a[1] || 0));
measured["map gen (slowest)"] = mapRows[0] && mapRows[0][1];
measured["map gen (all maps)"] = +mapRows.reduce((a, r) => a + (r[1] || 0), 0).toFixed(3);

/* ---------------- report ---------------- */
const prev = fs.existsSync(BUDGET_FILE) ? JSON.parse(fs.readFileSync(BUDGET_FILE, "utf8")) : null;
const pad = s => String(s).padEnd(24);
console.log(`Year-3 perf budget — dense fixture (${fx.note})\n`);
let over = 0;
for(const k in measured){
  const v = measured[k], cap = prev && prev.budget ? prev.budget[k] : null;
  const base = prev && prev.baseline ? prev.baseline[k] : null;
  const unit = /KB/.test(k) ? " KB" : " ms";
  let line = `  ${pad(k)} ${String(v).padStart(9)}${unit}`;
  if(base != null) line += `   baseline ${base}${unit}`;
  if(cap != null){
    line += `   budget ${cap}${unit}`;
    if(v > cap){ over++; line += "   ← OVER"; }
  }
  console.log(line);
}
console.log("\n  map generation, slowest first:");
for(const [id, ms, err] of mapRows.slice(0, 6)) console.log(`    ${pad(id)} ${err ? "n/a — " + err : ms + " ms"}`);

if(prev && prev.frame){
  const F = prev.frame;
  console.log(`\n  frame (in-browser, perfProbe — recorded by hand, ${F.measuredOn || F.on || "unknown machine"}):`);
  for(const k of ["cottage", "farm"]) if(F[k])
    console.log(`    ${k.padEnd(9)} p50 ${F[k].p50} ms · avg ${F[k].avg} ms · p95 ${F[k].p95} ms   ${F[k].note || ""}`);
  if(F.renderWorldMedian) console.log(`    renderWorld median on the dense farm: ${F.renderWorldMedian.farm} ms`);
  console.log(`    budget: p50 under ${F.budgetP95} ms (a 60fps frame is 16.7 ms; the game must leave room for the browser)`);
  if(F.caveat) console.log(`    ${F.caveat.replace(/\s+/g, " ").slice(0, 300)}`);
}

if(SET){
  const budget = {};
  for(const k in measured) budget[k] = +( /KB/.test(k) ? Math.ceil(measured[k] * 1.5) : Math.max(1, Math.ceil(measured[k] * 3)) );
  const out = Object.assign({}, prev, {
    recorded: new Date().toISOString().slice(0, 10),
    version: sb.get("VERSION").name,
    note: "baseline = what it measured; budget = the ceiling (~3× time, 1.5× size). Re-record with: node tools/check-perf.mjs --set",
    baseline: measured, budget,
  });
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(out, null, 2));
  console.log(`\nBaseline recorded → ${path.relative(ROOT, BUDGET_FILE)}`);
  process.exit(0);
}
if(!prev){
  console.log("\nNo baseline yet. Record one with: node tools/check-perf.mjs --set");
  process.exit(0);
}
console.log(`\n${over ? `${over} measurement(s) OVER BUDGET — look before shipping.` : "all within budget."}`);
process.exit(over ? 1 : 0);
