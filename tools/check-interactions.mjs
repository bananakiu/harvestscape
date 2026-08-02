#!/usr/bin/env node
/* ============================================================
   check-interactions.mjs — the harness that PRESSES THE KEY (v6.4.3).

   Run:  node tools/check-interactions.mjs
         node tools/check-interactions.mjs --verbose    (print every kind it exercised)
   Exit: 0 every interactable responds without throwing · 1 something threw · 2 the harness is broken.

   WHY THIS EXISTS, and it exists because of two bugs shipped on the same day.

   The repo had three harnesses and **not one of them pressed a key**. check-saves tests migrations,
   check-schedules tests NPC placement, check-perf tests generation cost. All three were green, and
   correctly so, while:

     · **Every bench in the game was dead** (v6.3.0 → v6.4.1). `case "bench"` opened with
       `if(o.story === …)` and the local in that switch is `obj`. `interact()` threw a ReferenceError
       on the first line of the case, before any branch — on the ridge, at Butterbrook, on the village
       square, at Marrow Point, on the Green. Three releases.
     · **The Hammer could not be held** (v6.4.0). The fix for "the hotbar stops at key 7" widened the
       key STRING from "1234567" to "12345678" without checking that anything creates an eighth slot.
       `HOTBAR` is a fixed six-entry array. Key 8 dispatched to an index that does not exist.

   Both were invisible to every existing check and instant the moment the path was exercised. Node's
   `new Function(src)` lint cannot help: `o` is a perfectly legal identifier, it simply is not bound.
   A runtime reference in a rarely-hit branch is exactly the shape only exercise finds.

   WHAT IT DOES
     For every map, for every object on it, it puts the player on an adjacent walkable tile facing
     that object and calls the REAL `interact()`. Then it does the same for `examine()`. Anything that
     throws is a failure, reported with the map, the tile, the object kind and the stack.

   ★ IT WAS A NO-OP THREE TIMES BEFORE IT WORKED, and that is the most useful thing in this file.

   Each time it reported a confident clean sweep — "1,864 presses across 20 maps, all invariants
   hold" — while a KNOWN live crash sat in the code it claimed to be exercising. Three different
   causes, one shape:

     1. `sandbox.curMap = m` creates an unrelated property. `curMap` is a top-level `let` in
        04-world.js, so the real binding stayed null and interact() returned at its first guard.
     2. Fixed that, still clean: interact()'s FIRST guard also reads `gameMode`, another top-level
        `let`, still "title". (load-game.mjs now exposes `set(name, value)` for the whole class,
        rather than one named accessor per variable discovered one failure at a time.)
     3. Fixed that, still clean for every map after the cottage: pressing E on the bed runs doSleep,
        which sets `paused = true` — and `paused` is the very next term in that same guard. One press
        silently disarmed the rest of the run.

   The lesson is not "remember the bed". It is that **a harness driving real game code must re-arm
   its preconditions on every iteration**, because the code under test is entitled to change global
   state — that is what it is for. And it is that a green harness proves nothing until you have
   watched it go red: every one of those three rounds was caught only by reintroducing the bench bug
   and checking. Do that whenever you extend this file.

   WHAT IT STUBS, and the line it will not cross
     `interact()` reaches presentation — showDialog, toast, playSfx, pSparkle, banner, openPanel. Those
     are stubbed, because they are the renderer and the speaker, not the game. AGENTS.md's rule is
     "never mock game logic in a harness; a harness that tests a copy tests nothing" — so every branch
     the switch takes, every give/take, every flag write, every skill check is the shipped code. If a
     stub ever needs to return something a branch DECIDES on, that is the signal to stop stubbing and
     load the real file instead.
   ============================================================ */
import { loadGame, CORE_FILES } from "./lib/load-game.mjs";

const VERBOSE = process.argv.includes("--verbose");

/* CORE_FILES plus 03-art and 07-entities.
     · 07-entities declares `fishing` (line 11), which interact()'s very first guard reads. Stubbing it
       would be mocking game state, not presentation — so the real file loads.
     · 03-art must come first: 07-entities calls mkSpr helpers at load time.
   10-ui is deliberately NOT loaded (it wants a real DOM); its dozen entry points are stubbed below,
   and every one of them is a renderer or a speaker, never a decision. */
const FILES = (() => {
  const f = [...CORE_FILES];
  const at = (name, after) => { if (f.includes(name)) return; f.splice(f.indexOf(after) + 1, 0, name); };
  at("03-art.js", "01-data.js");
  at("07-entities.js", "06-weather.js");
  return f;
})();

const sb = loadGame({ files: FILES });

/* ---- presentation stubs: the speaker and the screen, never a decision ---- */
const spoke = [];
const STUBS = {
  showDialog: (t, body) => spoke.push({ how: "dialog", t, body }),
  toast: (m) => spoke.push({ how: "toast", m }),
  banner: (a, b) => spoke.push({ how: "banner", a, b }),
  floatText: () => {},
  playSfx: () => {}, playMusic: () => {}, stopMusic: () => {},
  pSparkle: () => {}, pEmber: () => {}, pPoof: () => {}, pSplash: () => {}, pLeaf: () => {},
  refreshHUD: () => {}, refreshHotbar: () => {}, refreshInv: () => {},
  openPanel: (id) => spoke.push({ how: "panel", id }), closePanel: () => {}, closeAllPanels: () => {},
  renderForge: () => {}, renderCooking: () => {}, renderShop: () => {}, renderInv: () => {},
  openForge: () => spoke.push({ how: "panel", id: "forgePanel" }),
  openCooking: () => spoke.push({ how: "panel", id: "cookPanel" }),
  openShop: () => spoke.push({ how: "panel", id: "shopPanel" }),
  openProjects: () => spoke.push({ how: "panel", id: "ledger" }),
  openWardLedger: () => spoke.push({ how: "panel", id: "wardLedger" }),
  openSeedPicker: () => {}, openMachine: () => {}, openGift: () => {}, openWrit: () => {},
  openLetter: (t) => spoke.push({ how: "letter", t }),
  queuePage: () => {}, tutTip: () => {}, syncTitleDim: () => {},
  startCutscene: () => spoke.push({ how: "cutscene" }),
  uiBlocking: () => false, inputBusy: () => false,
  hydrateIcons: () => {}, paintPanelIcons: () => {},
  saveGame: () => {}, suspendSaves: () => {},
  showExamine: (t, body) => spoke.push({ how: "examine", t, body }),
  pItemPop: () => {}, pDust: () => {}, pChip: () => {}, pRipple: () => {}, pHeart: () => {},
  screenShake: () => {}, flash: () => {}, setMap: () => {}, doWarp: () => {}, travelTo: () => {},
  bumpQuestToast: () => {}, checkQuests: () => {},
  notePickup: () => {}, fadeTo: (on, then) => { if (typeof then === "function") then(); },
  showXpOrb: () => {}, showSleepCard: () => {}, showLevelUp: () => {}, celebrateWing: () => {},
  openSaveFile: () => {}, openWhatsNew: () => {}, openAlmanac: () => {},
  refreshQuestTracker: () => {}, refreshJournal: () => {}, updateQuestUI: () => {},
  openRack: () => spoke.push({ how: "panel", id: "rackPanel" }),
  renderRack: () => {}, readTheGround: () => false,   // v6.5 — both live in 10-ui, which this harness does not load
  openLift: () => spoke.push({ how: "panel", id: "lift" }),
  openPanorama: () => spoke.push({ how: "panel", id: "panorama" }),
  openWaystone: () => spoke.push({ how: "panel", id: "waystone" }),
};
for (const k in STUBS) if (typeof sb[k] !== "function") sb[k] = STUBS[k];
// Some of these DO exist in a loaded file and would try to touch a DOM. Override the known ones.
for (const k of ["showDialog", "toast", "banner", "playSfx", "pSparkle", "refreshHUD", "openPanel",
                 "startCutscene", "queuePage", "openLetter", "floatText", "saveGame",
                 "showExamine", "pItemPop", "setMap", "doWarp", "travelTo",
                 "notePickup", "fadeTo", "showXpOrb", "showSleepCard", "showLevelUp", "refreshQuestTracker",
                 "openLift", "openPanorama", "openWaystone", "openRack", "renderRack", "readTheGround"]) sb[k] = STUBS[k];
// IS_TOUCH is a const in 10-ui.js (which we do not load) read by the shared USEKEY path. It is a
// device fact, not a decision the game makes — desktop is the honest default for a harness.
try { sb.set("IS_TOUCH", false); } catch (e) { sb.IS_TOUCH = false; }

const MAPS = sb.get("MAPS"), TILE = sb.get("TILE"), W = sb.get("W"), T = sb.get("T");
const newMap = sb.get("newMap"), key = sb.get("key");
const interact = sb.get("interact"), examine = sb.get("examine");
if (typeof interact !== "function") { console.error("interact() not reachable — harness broken"); process.exit(2); }

/* A save deep enough that gated branches are ON — a shallow save exercises the "not yet" arm of every
   `if` and proves nothing about the arm that has the content in it. */
const s = sb.freshState();
s.farm = newMap("farm");
Object.assign(s.flags, {
  introSeen: true, act1Done: true, act2Done: true, festivalDone: true, marrowOpen: true,
  tenthDoorOpen: true, tenthWingLit: true, staveEarned: true, theaArrived: true, foundVault: true,
  proj_coop: true, proj_barn: true, proj_stable: true, memorialRead: true,
});
s.wingsLit = 9; s.wardBest = 45; s.mineBest = 60; s.writDone = 6; s.gold = 500000;
for (const k in s.skills) s.skills[k] = sb.get("XP_TABLE")[60];
for (const k in s.tools) s.tools[k] = 3;
s.day = 12; s.time = 12 * 60;
sb.setState(s);
// ★ interact()'s FIRST guard is `if(gameMode!=="play" || paused || uiBlocking() || …) return;`.
// gameMode is another top-level `let`, so without this the whole sweep returns at line one and
// reports a clean pass it never performed — which is exactly what it did, twice, before this line
// existed. Asserted, not assumed.
if (sb.set("gameMode", "play") !== "play") { console.error("could not enter play mode — harness broken"); process.exit(2); }
if (sb.set("paused", false) !== false)     { console.error("could not unpause — harness broken"); process.exit(2); }

/* ---- the sweep ---- */
const problems = [];
const kindsSeen = new Map();
let pressed = 0, mapsDone = 0;

const isSolid = (m, x, y) => {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  const t = m.tiles[y * W + x];
  return t === T.WATER || t === T.IWALL || t === T.WALL || t === T.ROOF || t === T.VOID || t === T.MWALL;
};

for (const id of Object.keys(MAPS)) {
  let m;
  try { m = newMap(id); } catch (e) { continue; }          // a map needing live play state is not our business
  mapsDone++;
  sb.setState(s);
  // ★ curMap is a `let` in 04-world.js's lexical scope. Assigning sb.curMap creates an unrelated
  // global and leaves the real binding null — interact() then returns at its first guard and this
  // whole harness becomes a no-op that reports a sweep it never performed. It WAS written that way
  // first, and passed with a known live crash in the code. setCurMap goes through the accessor
  // load-game.mjs exposes for exactly this.
  sb.setCurMap(m);
  if (sb.getCurMap() !== m) { console.error("setCurMap did not take — harness broken"); process.exit(2); }

  for (const k in m.objects) {
    const o = m.objects[k];
    const [ox, oy] = k.split(",").map(Number);
    // stand on an adjacent walkable tile, facing the object
    const spots = [[ox, oy + 1, "up"], [ox, oy - 1, "down"], [ox - 1, oy, "right"], [ox + 1, oy, "left"]];
    const spot = spots.find(([x, y]) => !isSolid(m, x, y) && !m.objects[key(x, y)]);
    if (!spot) continue;
    const [px, py, face] = spot;
    s.map = id; s.px = px * TILE + 8; s.py = py * TILE + 8; s.face = face;

    for (const [verb, fn] of [["interact", interact], ["examine", examine]]) {
      if (typeof fn !== "function") continue;
      // ★ RE-ARM EVERY PRESS, not once at the top. Interacting with the cottage bed runs doSleep,
      // which sets `paused = true` — and interact()'s first guard is `if(… || paused …) return`. So
      // one press on a bed silently killed every press on every map after the cottage, and the
      // harness went right on reporting a clean sweep. That is the THIRD time this file has looked
      // green while doing nothing (see the header). The lesson is not "remember the bed": it is that
      // a harness driving real game code must restore the preconditions it depends on, every time,
      // because the code under test is entitled to change global state — that is its job.
      sb.set("gameMode", "play"); sb.set("paused", false);
      pressed++;
      kindsSeen.set(o.kind, (kindsSeen.get(o.kind) || 0) + 1);
      try { fn(); }
      catch (e) {
        problems.push({ map: id, tile: k, kind: o.kind, verb, err: e.message,
                        at: (e.stack || "").split("\n")[1]?.trim() || "" });
      }
    }
  }
}

console.log(`Interaction harness — ${pressed} presses across ${mapsDone} maps, ${kindsSeen.size} object kinds\n`);

if (VERBOSE) {
  const rows = [...kindsSeen].sort((a, b) => b[1] - a[1]);
  for (const [k, n] of rows) console.log(`    ${k.padEnd(18)} ${n}`);
  console.log("");
}

if (problems.length) {
  // group: one broken kind usually shows up on every map that has it
  const byKind = new Map();
  for (const p of problems) {
    const kk = `${p.kind} · ${p.verb} · ${p.err}`;
    if (!byKind.has(kk)) byKind.set(kk, []);
    byKind.get(kk).push(`${p.map}(${p.tile})`);
  }
  console.log("✗ THREW — an interactable the player can reach raises an error:");
  for (const [kk, where] of byKind) {
    console.log(`    ${kk}`);
    console.log(`      on ${where.length} tile(s): ${where.slice(0, 6).join(", ")}${where.length > 6 ? " …" : ""}`);
    const first = problems.find(p => `${p.kind} · ${p.verb} · ${p.err}` === kk);
    if (first.at) console.log(`      ${first.at}`);
  }
  console.log("\n    → this is the class node's syntax check cannot see: a legal identifier that is not bound.");
  console.log(`\n${byKind.size} interaction(s) BROKEN.`);
  process.exit(1);
}

console.log(`✓ every reachable interactable responds without throwing`);
console.log(`✓ ${kindsSeen.size} distinct object kinds exercised (run with --verbose to list them)`);
console.log("\nall interaction invariants hold.");
process.exit(0);
