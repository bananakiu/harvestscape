"use strict";
/* ============================================================
   15-warding.js — Warding, the sixth skill (v4.0 "The Tenth Door").
   The combat layer: the Undercroft's restless things, the Stave's
   settling swing, the Resolve bar and its zero-cost knockout, the
   Warden's Bell checkpoints, the crafted charms, Tom's salvage
   trickle, and the door-opening story beat.

   Cozy contract (amended for v4, AGENTS.md): nothing is ever taken —
   knockout costs ZERO (wake safe, keep everything). Creatures live
   ONLY in the Undercroft; every pre-v4 space stays hazard-free.

   Loads AFTER 13-content.js so its load-time IIFEs can see QUESTS,
   NPCDEF and NPC_RECOG. The per-frame/per-swing functions here are
   plain declarations — hoisted into the one shared global scope, so
   07-entities (drawCreature), 12-game (updateCreatures) and
   08-actions (staveSwing) resolve them at runtime regardless of order.
   Map navigation (genUndercroft / enterUndercroft / wardUp / wardDown)
   lives in 13-content.js beside the mine, because the MAPS literal
   references genUndercroft at load time.
   ============================================================ */

// ---------------- Resolve — the combat-only bar ----------------
// A place you walk to, not a stat you manage everywhere: Resolve is full on every non-combat map
// and each dawn; it drains ONLY from a restless thing's touch, in the Undercroft. Empty = a soft
// knockout (below): you wake at the door with everything. Energy (farm stamina) is untouched by combat.
function resolveMax(){ return 100 + (charmActive("Warded Charm") ? 5 : 0); }   // Warded Charm lifts the ceiling
function resolveFloor(){ return hasMastery("Warding", 99) ? 10 : 0; }          // ★ Lanternheart — Resolve never falls below 10
function inCombatMap(){ return !!(curMap && curMap.id === "undercroft"); }      // the only place Resolve matters
