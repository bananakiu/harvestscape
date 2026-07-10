# HarvestScape v1.5 — "A Reason for Every Day"
### Gameplay-loop audit & implementation plan (for Opus 4.8 to execute)

This document is the designer's pass over v1.4. Part A is the audit — what the loop actually
is, with measured numbers, and where it sags. Part B is the ranked improvement plan with
implementation detail sufficient to build from. Part C is explicit cuts and engineering
invariants that MUST be respected.

---

## PART A — AUDIT OF THE CURRENT LOOP

### A1. The measured shape of a day
- Clock: `state.time += dt*(60/16)` → **16 real seconds per game hour**. A full day
  (6:00→26:00) = **~5.3 real minutes**. This is a good length: long enough to do 2–3 things,
  short enough that "one more day" works.
- Energy: 100/day. Till 2, water 1, chop/mine 2 per swing, cast 1, planting free.
  Berry Bun = 30g → 34 energy, so once income exists **energy is never the binding
  constraint — time is.** That's the right constraint for a cozy game. No change needed.
- A typical mid-game morning: water plots → coop/barn → then ONE project (mine trip,
  fishing session, town social) → sleep. The skeleton is sound.

### A2. XP curve reality (RuneScape table ÷ 4)
| Level | XP | Meaning in-game |
|---|---|---|
| 8 | 801 | quest gates (WC/Mining) — ~1–2 focused days each. Fine. |
| 10 | 1,154 | Farming gate on quest 5 — **~8–10 days** at 12 plots. The long pole. |
| 12 | 1,584 | Fishing gate on quest 6 — **~2–3 days of nothing but fishing.** A wall. |
| 20 | 4,470 | Mining for the vault — 2–4 days of mine trips. Acceptable. |
| 25/50/75/99 | 7.8k / 101k / 486k / 13M | **currently unlock NOTHING** (see A4). |

### A3. Verdict on the three-act story
Act 1 (grief → gathering) and Act 2 (Elias) are strong and land their beats. The problem is
**the muddy middle**: quests 5–9 are "grind skill to N," and story is only delivered at
turn-ins. Days 10–25 of a playthrough have zero narrative drip. Heart events help but are
player-initiated and easily missed. **The story doesn't need more endings; it needs a middle.**

### A4. The five real problems (ranked by player pain)
1. **Watering is a tax.** Can radius >1 tile only at tier 3 (5,000g + 5 Gold Ore — endgame).
   Until then: 1 press per tile. At 24 plots that's ~45–60s of the 320s day, every day,
   zero decisions. **~15–20% of the whole game is spent re-pressing one button.**
2. **The muddy middle has no story** (A3). Grind gates with silence between turn-ins.
3. **Levels 13–98 are meaningless.** `unlocksAt()` only surfaces content unlocks, which end
   at Farming 24 / Mining 28 / Fishing 32. The RuneScape-style curve promises mastery and
   pays out nothing. 99 = 13M xp of pure vanity.
4. **No repeatable daily objective.** Once quest gates are far away, a day has chores but no
   *goal*. Nothing pulls you to town. (Festivals fixed this 8 days a year; the other 104 need
   something light.)
5. **Gold has nowhere to go late.** After tools (6.5k total) + animals (~3k) + bouquet,
   income piles up uselessly. No sink, no visible payoff.

### A5. Smaller findings
- **Cooking is a value trap.** Most dishes sell for LESS than raw ingredients:
  Berry Jam 240 vs 2 Strawberries 340; Tomato Soup 230 vs 360; Bread 110 vs 120.
  Cooking exists for energy/gifts/quest-stat, but as an economy verb it punishes the player
  who engages with it. Dishes should sell ≥ ~1.25× ingredient sum (energy + gift value on top).
- **Winter is hollow.** Zero crops (intended, Stardew-like), but nothing replaces the farming
  layer: no winter forage, no winter fishing identity. 28 days ≈ 30 real minutes of reduced game.
- **Fishing gate slightly too steep** (quest 6 needs Fishing 12 = 1,584 xp ≈ 2–3 days of only
  fishing, and it's mandatory). 10 (1,154) preserves the beat at ~2/3 the grind.
- Walking friction farm↔mine↔beach is real but acceptable until late game; solved as a
  *reward* (restoration projects), not a free feature.

### A6. What is already good — do not touch
Fishing reel minigame; festival/calendar cadence; heart-event pacing; energy economy; day
length; the finale + Act 2 writing; procedural art pipeline; save migration discipline.

---

## PART B — THE v1.5 PLAN (build in this order)

Each step leaves the game playable and testable. Every step ends with its acceptance evals
run in-browser (same harness style as v1.4: stub `fadeTo`/`setTimeout` for scenes, cache-bust,
`location.replace`).

---

### STEP 1 — Watering that scales (S)
**Design.** Watering stays a morning ritual but stops being a tax. Tier perks:
- Can tier 0 (Basic): 1 tile. Tier 1 (Copper): waters the faced tile + the two beside it
  (a 3-tile row, perpendicular to facing). Tier 2 (Iron): 5-tile row. Tier 3 (Gold): 3×3 (unchanged).
- Farming 25 mastery (Step 4) adds retention: each watered tile has a 25% chance to stay
  watered overnight.

**Implementation.** `08-actions.js` Can branch: replace the current `radius = tier>=3 ? 1 : 0`
block. Compute the tile set from `state.face`: for row sizes use the axis perpendicular to
facing (facing up/down → row spans x-1..x+1; facing left/right → spans y-1..y+1). Keep 1
energy per press regardless (that's the point). Update the shop perk text in `10-ui.js`
(`TIER_COST` row: "waters a row" / "waters a wide row" / "waters 3×3").
**Acceptance.** Eval: set tier 1, face up at a 3-wide tilled row → one `useTool()` waters 3
tiles, `state.stats.watered` +3, 1 energy spent. Tier 2 → 5. Tier 3 → 9 in a 3×3.

---

### STEP 2 — Grandpa's Journal Pages (M) — *the muddy-middle story*
**Design.** Nine torn pages from Grandpa's festival almanac, hidden in the *places* he lived
in, discovered by playing (not by clicking a collectible). Each page is 60–120 words in his
letter voice, tied to that place, drip-feeding the backstory that currently only exists at
the bookends: Rosa, the last festival, why he bought seed he never planted, the lantern folds,
young Rowan, Elias as a boy. The final page unlocks only after all eight others and reading
the memorial (post-Act-2), and is his goodbye to the *player's parent* — the one relationship
the game has never mentioned. That's the emotional payload v1.5 adds.

**Triggers (data-driven, one flag each `page_<n>`):**
1. First till of soil (stat tilled==1 already fires — hook `bump("tilled")` path)
2. First time reaching mine floor 3
3. First pine chopped
4. First Salmon caught
5. Entering the guild with ≥5 wings lit
6. First rainy-day wake-up (`newDay` returns rain)
7. First gift to any NPC
8. Opening the vault (foundVault)
9. All 8 + `act2Done` + reading the memorial once → next morning letter "under the door"

**Implementation.** New data block `JOURNAL_PAGES` in `14-story.js` (id, title, text, hook
description). A single helper `foundPage(n)` → sets flag, `openLetter("✒ A torn page — "+title, text)`,
toast + sfx "quest". Call sites: the 8 hooks above are all one-line inserts at existing sites
(`useTool` till branch, `mineDown`, Axe branch on pine, `landFish`, guild `setMap`/interact,
`newDay` return handling in `showSleepCard` or `doSleep` chain, `giftNpcItem`, `openVault`).
Guard each with `if(!state.flags.page_N && <condition>) foundPage(N)`. Journal panel
(`renderJournal` in `10-ui.js`): add a "📜 Grandpa's Almanac — n/9 pages" section listing
found page titles (unfound = "· · ·"). Page 9 delivery: in `beginPlay` or `newDay`, if
conditions met and `!page_9`, queue `openLetter` after the sleep card closes.
**Acceptance.** Eval: fresh state → trigger each hook → flag set, letter opened once, never
re-fires; journal shows n/9; page 9 only fires when 1–8 + act2Done + memorialRead are all true.

---

### STEP 3 — The Village Noticeboard (M) — *a goal for every day*
**Design.** A noticeboard beside Tom's door. Each day it posts **one request** from a villager:
"Bram needs 2 Bass — 130g and his thanks." Deliver by talking to that NPC with the items
(auto-detected, like turn-ins). Pays ~1.4× sell value + 25 heart points + a one-line flavor
response. Skippable, expires at sleep, no penalty. Requests draw from a hand-written pool of
~20 (item, qty, giver, flavor line), filtered by what the player can plausibly obtain
(item's skill level ≤ player level + 2), seeded by `state.day` so save-scumming doesn't reroll.

**Implementation.** `01-data.js`: `REQUESTS` pool. `14-story.js` or `13-content.js`:
`todaysRequest()` (seeded pick via existing `makeRng(day)`), `requestDone` flag per day
(`state.flags.req_<day>`), `tryFulfillRequest(npcId)` called from `talkNpc` right after
`tryTurnIn` (same pattern: check items, `take()`, pay, heart points, `showDialog` flavor).
Farm map: add `noticeboard` object near the store door in `genFarm` (+ small sprite in
`03-art.js`, reuse sign frame with pinned papers); `interact()` case shows today's request
and its status. Quest tracker: when unfulfilled, show a second faint line "▸ board: 2 Bass
for Bram". **Do not** let it collide with `questReady` turn-ins: `tryTurnIn` first, then
`tryFulfillRequest`.
**Acceptance.** Eval: day N shows a stable request across re-reads; giving the items to the
right NPC pays gold+hearts once; next day rerolls; a level-1 save never receives a
Golden-Koi-tier request.

---

### STEP 4 — Mastery milestones at 25 / 50 / 75 / 99 (M) — *make the curve honest*
**Design.** Each skill pays out at four milestones. Small, passive, felt:
- **Farming**: 25 = watered tiles 25% chance to stay wet overnight · 50 = 10% double harvest ·
  75 = crops grow +1 day faster when their whole row is watered → simplify: 15% chance a crop
  advances 2 days · 99 = "Fields of Gold" — harvest sparkle + double harvest chance to 20%.
- **Woodcutting**: 25 = 20% no-energy swing · 50 = +1 wood per tree · 75 = trees respawn
  +2/night on the farm · 99 = one-swing oaks.
- **Mining**: 25 = 20% no-energy swing · 50 = 15% double ore · 75 = gems +50% gem xp ·
  99 = veins never need >2 swings.
- **Fishing**: 25 = bite wait −25% · 50 = catch bar +15% taller · 75 = perfect window
  (`REEL.perfectT`) doubled · 99 = every fish rolls once for upgrade to next tier fish.
- **Cooking**: 25 = 15% double dish · 50 = dishes +20% energy · 75 = cooked gifts count as
  loved for everyone who "likes Cooked" · 99 = dishes sell +25%.
- At 99: golden tool tint (procedural recolor of the tool sprite) + a banner + a Rowan line.

**Implementation.** `01-data.js`: `MASTERY = { Farming:{25:"…",50:"…"}, … }` descriptions;
helper `hasMastery(skill, n)` = `skillLvl(skill) >= n` (in `08-actions.js`). Apply at the
~10 existing call sites (Can branch, harvest branch, Axe/Pick energy+drops, `startFishing`
wait calc, `hookFish` barH, `landFish` perfect check, `cookRecipe`, `sellItem` for Cooking-99,
`respawnNodes`). `addXP`'s level-up banner already lists unlocks — extend `unlocksAt` to
include mastery descriptions at those levels. Skills panel (`renderSkills`): show next
milestone under each bar.
**Acceptance.** Eval per skill: set xp just below/above each threshold and assert the
mechanical delta (e.g. Farming 50: run 200 harvests, double-rate ≈ 10%; Fishing 75:
`REEL.perfectT` doubled in `landFish`'s check).

---

### STEP 5 — Rowan's Restoration Projects (L) — *gold sinks with visible payoff*
**Design.** A ledger on Rowan's desk lists three valley projects. Fund them (gold + materials),
and after the next sleep they exist in the world:
1. **The Minecart Line** — 8,000g + 20 Iron Ore + 30 Wood. A minecart by the farm's north path
   and one at the mine entrance: instant two-way travel (uses `travelTo`).
2. **The Coast Boardwalk** — 5,000g + 40 Wood + 10 Pine Wood. A walkway on the farm's south
   edge: farm↔beach spawn moves adjacent (halves the walk), plus 4 lanterns that light it.
3. **The Town Fountain** — 3,000g + 10 Stone + 2 Emerald. Cosmetic centerpiece near the store;
   tossing a coin (E, 10g) once/day gives +10 hearts with a random villager ("word of your
   wish gets around"). Pip has lines about it.
Each completion = a short banner + Rowan line + permanent `state.flags.proj_<id>`.

**Implementation.** `01-data.js`: `PROJECTS` (id, name, cost{gold, items}, blurb).
`10-ui.js`: `openProjects()` panel listing status/fund buttons (reuse shop row markup),
opened from a new `ledger` object at Rowan's desk (`genGuild` + `interact()` case).
Funding: validate, deduct, set `proj_<id>_pending`; `newDay()` converts pending→done with a
sleep-card line ("🔨 The minecart line is finished"). World changes in `genFarm`/`genMine`
entrance/`genBeach` gated on the flags (farm persists — so for the FARM apply objects via a
`applyProjects(state.farm)` called from `migrateSave`/`beginPlay`, idempotent like
`raiseMemorial`). Minecart `interact()` case → `travelTo` the other end.
**Acceptance.** Eval: fund each → after `newDay()` flag set, objects exist exactly once
(re-entry/migration idempotent), minecart round-trips farm↔mine, fountain pays hearts
once/day, gold sinks total ≈ 16k.

---

### STEP 6 — Economy & season patch (S)
1. **Cooking rebalance** (`01-data.js` RECIPES sell values): every dish ≥ 1.25× ingredient
   sell sum. New values: Berry Jam 240→430, Tomato Soup 230→460, Bread 110→160, Corn Bread
   220→400, Blueberry Tart 320→490, Cranberry Sauce 300→710? — cap at 1.35× to avoid an
   arbitrage loop with buyable Milk/Eggs: **rule: 1.25–1.35× ingredient sum, verify none of
   the buyable-input dishes (Fried Egg, Omelette, Pumpkin Soup) exceed input *buy* cost.**
2. **Fishing gate**: quest "the-coast" Fishing 12 → 10 (`01-data.js`).
3. **Winter layer**: (a) winter forage on the farm — `frostberry` bush objects scattered by
   `newDay` in winter (reuse forage node pattern, sell 40, EDIBLE 20); (b) winter fishing
   identity — fish sell +25% in winter ("the cold firms the flesh", apply in `sellItem`);
   (c) one winter crop: **Frostbloom** (lvl 14, 6 days, seed 180, sell 330, pal icy blues) —
   added to CROPS with `seasons:["Winter"]`; sprite comes free from the existing generator.
**Acceptance.** Eval: recipe margins all ≥1.25× and ≤1.35×; coast quest gate reads 10;
winter day spawns frostberry bushes ≤ cap; Frostbloom plantable only in winter; fish sale
in winter pays 1.25×.

---

### STEP 7 — Regression + review pass (always last)
- Re-run the standard suite: all maps × all festival dates generate/render/spawn-unblocked;
  mine reachability (200 floors); save/load round-trip incl. every new flag
  (`page_*`, `req_*`, `proj_*`); v1.3 and v1.4 saves migrate (`migrateSave` must backfill —
  new stats/flags default safely since flags are truthy-checked, but `applyProjects` must run).
- Full quest chain 0→14 through real turn-ins; a festival day; a request fulfillment; one
  project build.
- Bump title to v1.5; update How-to-Play (noticeboard + almanac pages line); cache-bust.
- Run an adversarial review workflow over the diff (same 3-lens verify pattern as v1.4) and
  fix confirmed findings. Budget for the two classic failure modes: **story windows keyed to
  mutable indices** and **flags consumed before their scene plays**.

---

## PART C — CUTS AND INVARIANTS

**Explicitly cut (do not build):** sprinklers/fertilizer/quality suffixes (v1.4 decision
stands), NPC schedules, children, combat, greenhouse, more marriage candidates, multiplayer
anything, new maps. v1.5 adds *texture*, not surface area.

**Engineering invariants (hard-won — violate none):**
1. 15 classic scripts, one global scope; no modules. New data in `01-data.js`, story/scenes in
   `14-story.js`, world hooks in `13-content.js`.
2. `interact()`/`useTool()` guard on `paused`; `talkNpc` bails on
   `festivalPending || festivalActive || seasonalActive`. New interactions inherit this.
3. Never key story windows to `QUESTS.length` — use `FINALE_IDX` or flags.
4. Flags that gate scenes are set when the scene *starts*, and `turnInPending` blocks saves
   in handoff gaps. Any new "advance then narrate" flow needs the same guard.
5. Only `state.farm` persists. World changes must be re-applied idempotently
   (`raiseMemorial` pattern) — check-before-place, and re-apply in `beginPlay`/`migrateSave`.
6. Cutscene `move` steps must snap on overshoot; `fade`/`letter` set `cutscene.waiting`
   *before* the async call.
7. Spawns at tile centre (`*TILE+8`), ≥2 tiles clear of doors; `unstick()` is the net, not
   the plan. Doorways/ladder approaches must never be blocked by scatter (repair passes exist —
   extend them for new objects like the noticeboard/minecart).
8. After edits: `node` syntax-check all files, bump `?v=` cache-busters, reload via
   `location.replace(...bust=Date.now())`, verify with in-browser evals + a screenshot,
   check console for errors, and leave the preview on a clean title.
9. Test harness: stub `fadeTo` + `setTimeout` for synchronous scene runs; clear
   `particles`/`floaters` before screenshots; `openShop()` starts on the sell tab.
10. Add every new persistent field to `migrateSave` thinking about BOTH v1.3 and v1.4 saves.

**Suggested effort split for the executor:** Steps 1+6 first (cheap, immediately felt),
then 2, 3, 4, 5, 7. Steps are independent except 4's Farming-25 retention referenced in
Step 1's design (ship Step 1 without it; Step 4 adds it).
