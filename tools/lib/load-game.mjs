/* ============================================================
   load-game.mjs — run the real game code in node.

   Why this exists (v5.0 "The Strongbox"): the game is 16 plain <script> files sharing one
   global scope, with no build step and no test runner. That has been a feature — it is why
   the whole thing is editable in a text editor — but it also meant `migrateSave`, the one
   function that stands between a four-season save and oblivion, grew across ~124 version
   codes with ZERO automated coverage. The only way to know a migration worked was to have an
   old save lying around and to notice, by eye, that nothing went missing.

   This module makes the game's own code callable from a node script: it evaluates the real
   files (no mocks of game logic, ever — a harness that tests a copy tests nothing) inside a
   vm with just enough browser stubs to get through load time.

   Shared by tools/check-saves.mjs and tools/check-perf.mjs. build-atlas.mjs keeps its own
   narrower loader: it only needs the DATA tables, and it must stay able to load ANCIENT
   builds from --src, so its stub set is deliberately frozen.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import url from "node:url";

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

// The load-bearing subset: everything `migrateSave`, `freshState`, `newMap` and the map
// generators transitively touch, in the index.html load order. The rendering, audio, particle,
// weather and UI files are deliberately absent — they need a real canvas, and nothing the save
// layer does calls into them. If a future migration reaches into one of those, add it here AND
// stub what it needs; do not stub the game function itself.
export const CORE_FILES = [
  "00-core.js", "01-data.js", "04-world.js", "08-actions.js",
  "09-quests.js", "13-content.js", "15-warding.js", "14-story.js", "11-title.js",
];

function makeEl(){
  const el = {
    classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
    style: { setProperty(){}, removeProperty(){} },
    dataset: {}, textContent: "", innerHTML: "", value: "", scrollTop: 0, scrollHeight: 0, clientHeight: 0,
    width: 320, height: 208,
    getContext: () => ctx2d(),
    addEventListener(){}, removeEventListener(){}, appendChild(){}, remove(){}, focus(){}, click(){},
    querySelector: () => makeEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left:0, top:0, width:1, height:1 }),
    closest: () => null, insertBefore(){}, setAttribute(){}, getAttribute: () => null,
  };
  return el;
}
// A canvas context that accepts every call and returns plausible shapes. Map generation never
// draws, but a stray art helper reached at load time must not throw.
function ctx2d(){
  const noop = () => {};
  return new Proxy({}, {
    get(t, k){
      if(k === "canvas") return makeEl();
      if(k === "measureText") return () => ({ width: 0 });
      if(k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern")
        return () => ({ addColorStop: noop });
      if(k === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      if(typeof k === "string" && k.startsWith("__")) return undefined;
      return noop;
    },
    set(){ return true; },
  });
}

export function loadGame({ files = CORE_FILES, srcDir = path.join(ROOT, "game", "js"), store = {} } = {}){
  const sandbox = {
    console,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    navigator: { userAgent: "node", maxTouchPoints: 0, clipboard: null },
    matchMedia: () => ({ matches:false, addEventListener(){} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame(){},
    setTimeout: () => 0, clearTimeout(){}, setInterval: () => 0, clearInterval(){},
    performance,
    location: { search: "", href: "http://localhost/", reload(){} },
    Blob: class { constructor(){} }, URL: { createObjectURL: () => "blob:x", revokeObjectURL(){} },
    FileReader: class { readAsText(){} },
    __store: store,
  };
  sandbox.document = {
    getElementById: () => makeEl(), createElement: () => makeEl(),
    querySelector: () => makeEl(), querySelectorAll: () => [],
    addEventListener(){}, removeEventListener(){}, body: makeEl(), hidden: false,
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = () => {};
  sandbox.globalThis = sandbox;

  const src = files
    .map(f => {
      const p = path.join(srcDir, f);
      if(!fs.existsSync(p)) throw new Error(`missing game file: ${p}`);
      return `/* ==== ${f} ==== */\n` + fs.readFileSync(p, "utf8");
    })
    .join("\n;\n")
    // `const`/`let` at script top level land in the script's LEXICAL scope, not on the global
    // object — so `sandbox.VERSION` is undefined while `sandbox.migrateSave` (a hoisted function
    // declaration) is not. This trailer closes over that scope and hands it back by name; it is
    // the same trick build-atlas.mjs uses for its data extraction.
    + `\n;globalThis.__GET = n => { try { return eval(n); } catch(e){ return undefined; } };`
    // `state` is a `let` in that same lexical scope (00-core.js:34), so a harness that wants to
    // measure the map generators — several of which read the save — needs a way in. This is it.
    + `\n;globalThis.__SETSTATE = s => { state = s; return state; };`;
  vm.runInNewContext(src, sandbox, { filename: "harvestscape.js" });
  sandbox.get = n => sandbox.__GET(n);
  sandbox.setState = s => sandbox.__SETSTATE(s);
  return sandbox;
}
