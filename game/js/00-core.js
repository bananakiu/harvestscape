"use strict";
/* ============================================================
   00-core.js — constants, canvas, math/color helpers, XP curve,
   and shared mutable globals. Loaded first.
   ============================================================ */

// ---- canvas ----
const cv  = document.getElementById("game");
const ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;

const VIEW_W = 320, VIEW_H = 208;      // logical pixels; CSS scales up
const TILE = 16;
const VW = VIEW_W / TILE;              // 20 tiles wide
const VH = VIEW_H / TILE;              // 13 tiles tall
const W = 46, H = 36;                  // tile-array stride/height for EVERY map — must stay ≥ the
                                       // widest (beach, 46) and tallest (farm, 36) map. Also the
                                       // farm's own size since v3.2's shrink.

// ---- tile ids ----
const T = {
  GRASS:0, DIRT:1, TILLED:2, WATERED:3, WATER:4, PATH:5,
  WALL:6, ROOF:7, FLOOR:8, BED:9, RUG:10, SAND:11, FLOWERGRASS:12,
  DOOR:13, WOOD:14, BRIDGE:15, TALLGRASS:16,
  // interiors & mine
  IWALL:17, IFLOOR:18, MFLOOR:19, MWALL:20, LADDER:21, VOID:22, CARPET:23, PLANK:24, HAY:25,
};
// tiles that block walking
const SOLID = new Set([T.WATER, T.WALL, T.ROOF, T.BED, T.DOOR, T.IWALL, T.MWALL, T.VOID]);
// tiles that count as "ground" you can till
const TILLABLE = new Set([T.GRASS, T.DIRT, T.FLOWERGRASS, T.TALLGRASS]);

// ---- shared mutable globals (assigned later) ----
let state = null;                      // the save-able game state
let cam = { x: 0, y: 0, shake: 0 };    // camera in world pixels
let animT = 0;                         // seconds since boot (for animation)
let gameTimeScale = 1;
let gameMode = "title";                // "title" | "intro" | "play"
let paused = false;
let hitstop = 0;                       // brief freeze on impacts (juice)
const keys = {};                       // held keys
let particles = [];                    // particle list
let floaters = [];                     // floating text list
let hitsplats = [];                    // v4.0.3: RuneScape-style damage splats (blob + number) — Warding combat
let wardBolts = [];                    // v4.2: the Star-Gnarl's ranged star-bolts (Undercroft-only)
let lights = [];                       // per-frame dynamic light requests

// ---- math ----
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const inv   = (v, a, b) => (v - a) / (b - a);
const smooth = t => t * t * (3 - 2 * t);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const easeOutBack = t => { const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); };
const key = (x, y) => x + "," + y;
const dist2 = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rand = (a=1, b) => b === undefined ? Math.random()*a : a + Math.random()*(b-a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const chance = p => Math.random() < p;

// deterministic seeded rng (mulberry32)
function makeRng(seed){
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- color helpers (hex string math for lighting/day-night) ----
function hexToRgb(h){ h = h.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join("");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
function rgbToHex(r,g,b){ return "#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join(""); }
function mixHex(a, b, t){
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0],B[0],t), lerp(A[1],B[1],t), lerp(A[2],B[2],t));
}
// pick along a stop list [[t,color],...]
function gradHex(stops, t){
  t = clamp(t, 0, 1);
  for(let i=0;i<stops.length-1;i++){
    const [t0,c0]=stops[i], [t1,c1]=stops[i+1];
    if(t <= t1) return mixHex(c0, c1, inv(t, t0, t1));
  }
  return stops[stops.length-1][1];
}

// ---- XP table (levels 1..99) — HarvestScape's own curve, third calibration ----
// The design brief (owner, 2026-07-12): early levels must be EARNED — slow enough to be noticed
// and enjoyed, never "junk levels" that arrive before you look up; then a long, steady climb (the
// RuneScape *idea* of long progression without its punishing math); and a genuine completionist
// crown at the very end. The v2.7 curve was gentler-than-RS everywhere, which made the opening
// trivial (a level every 1–3 actions to L10) — it fixed the late-game wall but cheapened the start.
// This curve paces reward density roughly evenly across the whole journey:
//   · L2 lands after ~3–4 early actions, L10 after ~50 — the first morning teaches, day one rewards.
//   · Mid-game stretches smoothly (~25 actions/level at 25, ~70 at 50, ~150 at 80).
//   · Only levels 95–99 steepen (the final level alone ≈ 550 actions) — the mastery award.
//   · L99 ≈ 782k XP total: ~17× gentler than RS's 13M, but 1.3× longer than v2.7's climb.
// Existing saves are converted LEVEL-PRESERVINGLY in migrateSave (via XP_TABLE_V27 below) — a
// recalibration must never demote anyone (the cozy contract). `XP_TABLE[L]` = total XP for level L.
const XP_TABLE = [0, 0];
(function(){
  for(let l=2; l<=99; l++){
    let inc = 62 + 1.00*Math.pow(l-1, 2.18);  // smooth, always-increasing per-level cost
    if(l >= 95) inc *= 1 + 0.28*(l-94);        // the completionist crown: only the last five steepen
    XP_TABLE.push(Math.round(XP_TABLE[l-1] + inc));
  }
})();
// The v2.7 curve, kept ONLY so migrateSave can translate a save's stored XP onto the new table
// without changing the level the player last saw. Not used anywhere else.
const XP_TABLE_V27 = [0, 0];
(function(){
  for(let l=2; l<=99; l++){
    let inc = 26 + 0.30*Math.pow(l-1, 2.4);
    if(l >= 96) inc *= 1 + 0.30*(l-95);
    XP_TABLE_V27.push(Math.round(XP_TABLE_V27[l-1] + inc));
  }
})();
const levelFor = xp => { let l = 1; while(l < 99 && XP_TABLE[l+1] <= xp) l++; return l; };
const xpForLevel = l => XP_TABLE[clamp(l,1,99)];

// ---- tiny tween registry (updated each frame in game loop) ----
const tweens = [];
function tween(obj, prop, to, dur, ease = easeOutCubic, onDone){
  tweens.push({ obj, prop, from: obj[prop], to, t: 0, dur, ease, onDone });
}
// retween: replace any in-flight tween on the same obj+prop, so rapid re-triggers (a gold
// count-up interrupted by another sale) restart cleanly instead of two tweens fighting.
function retween(obj, prop, to, dur, ease = easeOutCubic, onDone){
  for(let i = tweens.length - 1; i >= 0; i--){ if(tweens[i].obj === obj && tweens[i].prop === prop) tweens.splice(i, 1); }
  tween(obj, prop, to, dur, ease, onDone);
}
function updateTweens(dt){
  for(let i = tweens.length - 1; i >= 0; i--){
    const w = tweens[i]; w.t += dt;
    const k = clamp(w.t / w.dur, 0, 1);
    w.obj[w.prop] = lerp(w.from, w.to, w.ease(k));
    if(k >= 1){ if(w.onDone) w.onDone(); tweens.splice(i, 1); }
  }
}

// ---- dom shortcut ----
const $ = id => document.getElementById(id);
