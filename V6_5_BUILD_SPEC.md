<!--
  V6_5_BUILD_SPEC.md — the build order for v6.5 "The Wild" (Foraging).

  PROVENANCE. Produced 2026-07-29 by an orchestrated design pass on the v6.4.3 tree: four parallel
  surveys of the shipped code, three independent ladder designs from different angles (place-first,
  season-first, verb-first), each judged by three lenses (ladder math / cozy contract / buildability),
  then a synthesis attacked by three adversaries. 21 agents, ~3.5M tokens.

  WHY IT READS THE WAY IT DOES. The verb-first design won (40.7 vs 37.7 / 37.3) and the synthesis
  built on it was REFUTED by two of the three adversaries — one fatal, one serious. What is below is
  rev 2: every finding resolved, plus four defects the adversaries missed. Two of those were fatal and
  are worth knowing before reading:

    · THE SEDGEWAY DOES NOT EXIST. Six of eighteen finds targeted a map that appears nowhere in the
      repo. It is CUT; the wetland is a ground rule (tiles adjacent to water) rather than a place.
    · THE RUIN DOES NOT EXIST EITHER. It is BUILT — and it pays off Elias's shipped 8♥ line about
      the birch growing where his kitchen was.

  Five defects it found in ALREADY-SHIPPED code were fixed before this file landed: the Hammer's
  missing TIER3_GEM row (v6.4.4), and unlocksAt/nextUnlock never learning about Smithing (v6.4.5).

  READ §0 FIRST. It is the fix ledger, and it records which adversary findings were UPHELD, which
  were overstated, and the two numbers the draft got wrong. Build from §2 onward; do not re-derive.
-->

# v6.5 "The Wild" — Corrected Build Spec (rev 2)

**Status:** every fatal and serious finding from the three adversaries is resolved below, plus **four defects none of them caught** (§0.2). Every number in this document was computed or sampled against the live tables through `tools/lib/load-game.mjs` on the v6.4.3 tree (code 147) — none is quoted from the draft.

**Headline (recomputed from the corrected table, §2):** **45 marks · largest empty band 4 levels · 5 marks above L85 · 0.00% dead XP.** Authored-only (the 10 engine-given marks stripped): **35 marks, max band 6, tail 3, 0.00% dead** — where Smithing, the template, scores **28 / 8 / 2 / 15.89%** (verified: my reproduction of the authored-only filter returns Smithing 28/8/2/15.89%, byte-matching the draft's claim, so the test is well-defined).

**Measured cost of the ladder:** **~100 in-game days of dedicated play, 1 → 99** — against Woodcutting's 81.0 and Mining's 81.1 (v4.23's recorded parity). Deliberately the slowest ladder in the game, because it is the only one that costs no energy. Segments: 1→50 = 44 days · 50→75 = 26 · 75→85 = 13 · **85→99 = 19**.

---

## 0. The fix ledger

### 0.1 The six findings — verdicts

| # | Finding | Verdict | What changed |
|---|---|---|---|
| 1 | `sparkCap()` breadth inflation | **UPHELD, magnitude overstated** | The mechanism is real and verified (`08-actions.js:227-229`, `:310-313`). But the adversary's "~2.5×-of-maximum widening" is wrong: the term is `5 * Math.min(4, breadth-1)`, so the **ceiling does not move at all** — 30 sparks was already reachable pre-v6.5 with five crafts, each bought with one cheap press. What v6.5 would have changed is the *number of distinct player choices* needed to reach a given cap, which is precisely what v4.23 designed against ("rotate is a choice, not advice"). **Fix in §4.1: `addXP` gains a third parameter; the co-credit earns XP but writes no `dailyXpActs` key and takes no spark.** Definition of done: *every existing press produces byte-identical spark behaviour*. |
| 2 | §3 is not a complete landing checklist; `nextMastery` crashes | **UPHELD in full** | Verified: `nextMastery` (`08-actions.js:234-238`) indexes `MASTERY[skill][n]` unguarded. `"wild"` absent from `INTERACT_KINDS` (`07-entities.js:126`). And the Hammer's `TIER3_GEM` bug is **live today**: `08-actions.js:2282` reads `TIER3_GEM[tool]` with no guard and `TIER3_GEM` (`01-data.js:1908`) has no `Hammer` key — buying a Gold Hammer prints "The **undefined** is set into the handle." **§3.6 is now a 14-row landing checklist; §4.6 fixes the Hammer guard.** |
| 3 | Weather/season sole-sourcing breaks the WEATHERS contract | **UPHELD in full** | Seven violations confirmed. **Fixed structurally, not row by row: §3.4 introduces four ingredient CATEGORIES, each with at least one always-available member.** A locked find becomes a legal *substitute*, never a *requirement* — the WEATHERS contract expressed as a mechanic. Plus two quantified rules (§3.5) a harness can check. |
| 4 | Moonwort's 80-second window | **UPHELD on the arithmetic** | Verified: `state.time += dt * (60/16)` (`08-actions.js:2110`) = 16 real seconds per game hour; forced sleep at 26:00. 21:00 → 80 s. The shipped precedent (`shardnode`, `:1229`) opens at 19:00 = 112 s. **Moonwort moves to 19:00.** The related complaint — that the top band had one repeatable source — is also upheld and fixed: **§2 puts a repeatable preparation at L91 (Moonwort Cordial)**, and the measured 85→99 is now 19 days. |
| 5 | No spawn counts anywhere | **UPHELD** | **Every WILD row now carries per-map counts (§3.3) and the whole census was sampled, not reasoned (§6).** |
| 6 | The release mints as many orphans as it adopts | **UPHELD** | Five finds had no sink. **All eighteen now have one** (§3.4's categories + `EDIBLE` + two gift-taste additions), and §7 step 11 makes it a harness assertion rather than an intention. |

### 0.2 Four defects the adversaries missed — all fatal

| # | Defect | Evidence | Fix |
|---|---|---|---|
| **A** | **The Sedgeway does not exist.** Six of eighteen WILD rows target `maps:["sedge"]`. `grep -rn "Sedge"` over the whole repo returns **nothing** — no map, no generator, no warp, no fiction. The draft silently assumed a new outdoor map it never specified building. | `MAPS` (`13-content.js:8-49`) has 21 entries, 9 outdoor: farm, beach, coastroad, marrowpoint, ridge, butterbrook, grove, village, green. | **The Sedgeway is CUT. The wetland is a GROUND RULE, not a map** (§5.1): `wet` = any walkable tile orthogonally adjacent to `T.WATER`. Measured free wet tiles per map today: **butterbrook 95 · marrowpoint 85 · coastroad 71 · farm 44 · beach 38**; ridge/grove/village/green have **zero**. The fiction is already written — the **Gullwater** estuary runs through the coast road with a plank ford and its own sign (`13-content.js` `genCoastRoad`), and the Coast Boardwalk pledge has promised to "plank the marsh path" since v3 (`01-data.js:1621`). |
| **B** | **The Ruin does not exist either.** `ruin:true` gates three finds against geometry that was never built. | Elias's 8♥ scene (`14-story.js:1459-1461`) is the *only* place it exists: "my old one, on the ridge… a birch growing where the kitchen was". | **The Ruin is BUILT** (§5.2) — a stamped landmark in `genRidge`, ~20 lines. It is the one new *place* in the release and it pays off a shipped 8♥ line. Only **two** finds depend on it (Hearth Nettle, Birch Sap), and neither is a hard requirement for anything. |
| **C** | **The grove is one map with nine RINGS**, so `maps:["grove"]` means *per ring*. A nine-ring walk multiplies every grove count by up to 9. | `genGrove` (`13-content.js:1088`) reads `state.groveRing`; `GROVE_RINGS = 9`. | §3.3 states grove counts are **per ring**, restricts general grove spawns to **rings 1–3**, and §7 step 9 requires the nine-ring walk sampled as the throughput worst case. |
| **D** | **The bag.** The release adds **33 item kinds** to a game whose own stress fixture already carries **53 kinds against a top cap of 48**. | Measured: `tools/fixtures/saves/dense-year3.json` → `invKinds 53, bagTier 2`; `BAG_CAPS = [24,36,48]` (`08-actions.js:441`). | §4.7: nothing is lost (`give()` never refuses; overflow goes to the cottage shelf), the eleven preparations are the designed sink, and the **Trug joins `BAG_FREE`** ("equipment is not cargo"). A fourth bag tier is named as a v6.6 candidate with the measured number attached — it is **not** smuggled into this release. |

### 0.3 Two numbers the draft got wrong, and the adversary inherited one

- The draft's legacy-node figure (**24,304 XP/yr = Foraging 34 = 3.11%**) is a **clear-day-only** total. Adversary 5 recomputed it as 24,192 / L33 / 3.09% — reproducing the *method*, and so inheriting the error. **The weather-weighted year is 20,170 XP = Foraging 31 = 2.58% of the 782,287 climb** (sampled: 9 outdoor maps × 28 days × every sky, weighted by `WEATHER_ODDS`; `shardnode` spawns on clear days only, which the clear-day method silently over-counts). The dated-day fair-weather rule (`06-weather.js:250-259`) pushes ~13 days/yr toward clear and lifts this ~2%; the level does not change. **The honest headline stands and gets stronger: the legacy nodes are a floor around L20–L25 and cannot carry the ladder past the low thirties even under impossible play.**
- Adversary 4's "Heart's Ivy = 81 days for the last three levels" was arithmetically right about the draft but is moot: the corrected top band has four sources, and 96→99 is **4 days**.

---

## 1. The territory answer, as an implementable rule

### 1.1 The eleven existing nodes — one parameter, one line

`forageNode` (`game/js/08-actions.js:1291`) gains **one parameter and one line**. Note the fifth argument on the new `addXP` call — that is fix #1, and it is not optional:

```js
function forageNode(x, y, obj, item, skill, xp, fxp){
  if(obj.pickedDay === state.day){ toast("Already gathered here today."); return; }
  obj.pickedDay = state.day;
  let n = isRain() ? 2 : 1;
  if(charmActive("Moss Locket") && chance(0.2)){ n++; floatText(x*TILE+8, y*TILE-10, "the moss approves", "#8fe8c8"); }
  give(item, n); addXP(skill, xp); bump("forage", n); playSfx("get");
  // ★ v6.5 — the CO-CREDIT. `secondary:true` is load-bearing, not decoration: it keeps this grant out
  // of state.dailyXpActs, so it neither sparks nor widens sparkCap()'s breadth term. Without it, one
  // free berrybush press would raise the variety-spark cap for EVERY craft in the game (see §4.1).
  if(fxp && skill !== "Foraging") addXP("Foraging", fxp, { secondary:true });
  if(isRain() && n > 1) floatText(x*TILE+8, y*TILE-4, "the rain was kind", "#8fd3ff");
  pSparkle(x*TILE+8, y*TILE+6, "#8fd06a", n>1 ? 10 : 6);
}
```

The eleven call sites keep their **first six arguments byte-identical** and append a seventh literal — a one-token diff per line, verifiable by eye:

| call site (`08-actions.js`) | existing grant — **unchanged** | new 7th arg (`fxp`) |
|---|---|---|
| `case "berrybush"` :1111 | `"Farming", 6` | `3` |
| `case "frostberry"` :1112 | `"Farming", 14` | `5` |
| `case "shellnode"` :1218 | `"Fishing", 8` | `3` |
| `case "seaweednode"` :1219 | `"Fishing", 6` | `2` |
| `case "coralnode"` :1220 | `"Fishing", 12` | `4` |
| `case "samphirenode"` :1221 | `"Fishing", 8` | `3` |
| `case "asternode"` :1222 | `"Farming", 10` | `4` |
| `case "hollynode"` :1223 | `"Fishing", 6` | `2` |
| `case "thymenode"` :1224 | `"Farming", 7` | `3` |
| `case "snowdropnode"` :1225 | `"Farming", 6` | `2` |
| `case "shardnode"` :1238 | `"Mining", 14` | `5` |

Plus **one** line in `case "wrack"` (`:1207-1216`), which does not route through `forageNode`: after `addXP("Fishing", 22); bump("forage");` add `addXP("Foraging", 6, { secondary:true });`. Storm wrack is beachcombing; leaving it out would make it the only wild gather in the game that does not train the craft. **Canopy nests are deliberately excluded** — climbing a tree is Woodcutting's verb and the nest already pays it.

Consequences, stated so they are built rather than discovered:

- **No node changes hands.** A Farming-40 player picking berrybushes still receives Farming 6 per press, at the same rate, forever, and now also 3 Foraging. No existing XP curve moves by one point.
- **No node gains a level gate.** All eleven stay level-1 and free. The one clock gate (`shardnode` before 19:00) is untouched.
- **No existing press changes its spark behaviour.** With `secondary:true`, a berrybush press still writes exactly `{Farming}` into `dailyXpActs` — breadth 1, cap 10, byte-identical to v6.4.3. This is the release's single hardest acceptance criterion (§7 step 3).
- **`bump("forage", n)` is untouched.** Three surfaces read that counter, and §1.3 depends on it.

### 1.2 The dual-credit arithmetic, measured

Sampled, not reasoned: every outdoor map generated headlessly for all 28 days of each season under every legal sky, node kinds counted, weighted by `WEATHER_ODDS`.

- **A complete clear-day valley sweep pays 216 Foraging XP in Spring** (66 nodes: ridge 59 · beach 40 · butterbrook 39 · marrowpoint 24 · coastroad 20 · grove 18 · farm 12 · green 4). Summer 209 · Fall 201 · Winter 173.
- **A full weather-weighted year of that — visiting all nine outdoor maps every single day and picking every node — is 20,170 XP = Foraging 31 = 2.58% of the climb.**

No daily cap is added. The honest limiter is the day clock and your legs, and Foraging stays the game's one free gathering verb. **Nothing above L37 in §2 is reachable without new content.**

### 1.3 The back-credit (`forageSeeded`)

Warding and Smithing started every save at 0 honestly — there was no verb before. Foraging's verb has existed since v1.0.0 and `state.stats.forage` has been counting it. Starting a year-3 forager at Foraging 1 is technically not a demotion and emotionally a theft.

`forageSeeded` is a **top-level boolean**, not a `flags` key — `s.flags` is not guaranteed to exist that early in `migrateSave` (verified: `if(!s.flags) s.flags = {}` lands ~80 lines later), and `trialsSeeded` is the proven shape.

- `freshState()` gains `forageSeeded:true` (a save born with the craft never seeds), `skills.Foraging:0`, `tools.Trug:0`.
- `migrateSave` (`game/js/11-title.js`), **immediately after the `trialsSeeded` block at ~line 219 and BEFORE `const f = freshState()`**:

```js
// v6.5 "The Wild": Foraging's VERB has existed since v1.0.0 and state.stats.forage has counted it
// the whole time. A veteran forager may not be told they have never foraged. Seeded ONCE, capped,
// monotone, and idempotent (this runs on every load).
// ★ Must create the key itself: the generic skills backfill (~line 296) has not run yet.
if(s.forageSeeded === undefined){
  if(!s.skills) s.skills = {};
  const seed = Math.min(((s.stats && s.stats.forage) || 0) * 3, XP_TABLE[15]);
  s.skills.Foraging = Math.max(s.skills.Foraging || 0, seed);
  s.forageSeeded = true;
}
```

Sized against the real curve: `XP_TABLE[15] = 2,417` = **0.31%** of the climb; ×3 is the operative term below **806** lifetime forages, the cap above it. A 200-forage save seeds to **Foraging 7**. **Verified against the shipped fixtures:** `dense-year3` (`stats.forage = 5000`) seeds to the cap, exactly Foraging 15; all nine era fixtures carry `stats.forage = 0` and seed to 0 — **assert the no-op case too**, so the branch's false arm is covered.

### 1.4 The Guild's foraging wing — an OR, never a swap

`game/js/14-story.js:15`:

```js
{ id:"foraging", name:"Foraging", lit:()=> skillLvl("Foraging")>=8 || (state.stats.forage||0)>=10 },
```

The arithmetic that makes the OR mandatory: 10 forages seeds 30 XP (level 1); `XP_TABLE[8] = 625` needs 209 forages at ×3. A plain swap would put out a lantern an existing save had already earned. **This is visible content, not bookkeeping** — `wingLit("foraging")` fruits the village lane hedges (`13-content.js:1027-1028, 1059`).

`build-atlas.mjs`'s `WING_LIT` source snapshot **will fire on this edit** — that is what it is for. Re-record it and re-word `WING_REQ.foraging` in the same commit: `"Forage 10 wild finds"` → **`"Reach Foraging 8 — or gather 10 wild finds"`**.

### 1.5 The proof-by-lock-text

After this release, **no row in any panel in the game may read `🔒 Foraging` except Foraging's own content.** No shipped recipe, noticeboard request, pledge, trial, tool tier, quest, writ or project gains a Foraging level gate or a Foraging ingredient. Every new preparation feeds only new consumers. Verify by pressing, not by reading (v6.4's method).

**Clarification the draft lacked:** this forbids *gating*, not *adopting*. Putting a shipped item (Seaweed, Snowdrop, Mountain Thyme…) into a **new** recipe is adoption and is required (§3.4); putting a **new** item into a **shipped** recipe or writ is gating and is forbidden.

---

## 2. The complete marks table

`◈` art · `◇` wild find · `✚` preparation · `▣` Trug tier · `★` mastery

| lvl | kind | name | note |
|---|---|---|---|
| 1 | ◇ | **Nettle** | Hedgerow everywhere (farm margin, village verges, coast road). All four seasons — level 1 must work in whatever season the player is standing in. |
| 3 | ◇ | **Wood Sorrel** | Grove floor, **all seasons** (Spring/Summer abundance). ★ *Changed:* the draft locked it to Spring/Summer while its own Sorrel Vinegar consumed five of them — the first sole-source violation in the file. |
| 5 | ◈ | **Reading the Ground** | E on open ground with no object. The place names what it grows in this season and this sky; the nearest ungathered node glimmers. Sits at 5, not 1, so the first hour is still hands and eyes. |
| 7 | ◇ | **Pignut** | Grove + ridge tree line, all seasons. Edible (+14). |
| 8 | ◈ | **The Gatherer's Almanac** | New Journal tab: the year-wheel. Every find you have gathered inked into its season, weather and ground; unfound ones are silhouettes showing only the season. Ships early because a season-keyed craft is illegible without it — **the record IS the tutorial**. **Zero new save fields:** it reads `state.discovered`, which already persists and which `migrateSave` already back-fills from inventory. |
| 10 | ▣ | **Copper-Banded Trug** | `TIER_LEVEL[1]`. A read reaches three tiles. |
| 12 | ◇ | **Unnamed Cap** | Grove, all seasons; **twice as many the morning after rain**. Deliberately two rungs before the book that names it. ★ *Changed:* `afterRain` was a presence gate; rain is now abundance. Rain already means "the valley offers more" everywhere else in the game. |
| 14 | ◈ | **Cuttings** | A gather sometimes yields a Wild Cutting; plant it on farm grass and a permanent wild node takes there. The farm is the one map that persists (`04-world.js:102`), so its hedgerow is the only place the per-day dedupe has ever meant anything. |
| 16 | ✚ | **Dried Herbs** | ★ The **first sink Mountain Thyme has ever had** — its examine line calls it "half the flavour of the valley in a pinch" and no recipe used it. |
| 17 | ◇ | **Bogbean** | Wet ground, all seasons. |
| 20 | ▣ | **Iron-Rimmed Trug** | `TIER_LEVEL[2]`. A read reaches five tiles. |
| 21 | ✚ | **Nettle Cord** | ★ **Seaweed's first use in the game** — the survey called it the purest orphan in the build. |
| 22 | ◇ | **Reedmace Down** | Wet ground, all seasons. Fibre. |
| 25 | ★ | **Light Hands** | A gathered node sometimes gives again the same day (the press leaves `pickedDay` unset). Distinct from rain, which multiplies one press, and the Moss Locket, which adds one. |
| 26 | ✚ | **Sorrel Vinegar** | ★ **Clam's first sink.** Uses a `green` category slot — which also adopts Mountain Thyme, Samphire, Watercress and Hearth Nettle. |
| 27 | ◇ | **Hearth Nettle** | **The Ruin on the ridge only** (§5.2). Spring/Summer/Fall. Grows where a hearth was — the biome of abandonment the valley otherwise has none of. |
| 28 | ◈ | **The Cap Book** | An Unnamed Cap can be named — at the rack or in the field — into Brown Cap, Kingcap or Witch's Butter. ★ **Retroactive by construction**: every cap carried home before you could read them still converts. |
| 30 | ▣ | **Gilt Trug** | `TIER_LEVEL[3]`. A read carries the whole screen. **No `TIER3_GEM` row** — a basket has nowhere to set a stone. (The Hammer's precedent is cited as *a bug to fix*, not as cover; see §4.6.) |
| 31 | ✚ | **Cap Powder** | `fungus` category slot — Grey Cap and Tinder Bracket earn their keep here without ever being required. |
| 32 | ◇ | **Elderflower** | Grove, on and near elderwood. All seasons, **twice as many late Spring–Summer**. Ties forage to the tree table without touching Woodcutting's gates. |
| 36 | ✚ | **Elderflower Cordial** | Edible +40. `bloom` slot. Sable loves it, which is the point of her. |
| 37 | ◇ | **Watercress** | Wet ground on running water (coast road, Butterbrook). All seasons, Spring/Fall abundance. Edible +16. |
| 41 | ✚ | **Frostberry Preserve** | ★ **Frostberry's first sink.** A *terminal* good — edible, sellable, an input to nothing — which is precisely why a Winter-only ingredient is legal here (§3.5). |
| 42 | ◇ | **Birch Sap** | Tapped from the birch in the Ruin's kitchen. **Spring only** — the thaw. Edible +22, and **Elias loves it**. |
| 45 | ▣ | **Cobalt-Pinned Trug** | `TIER_LEVEL[4]`. A read carries the whole screen **and names the season's next arrival**. |
| 47 | ✚ | **Rush Basket** | |
| 48 | ◇ | **Grey Cap** | Grove + wet ground. **FOG only** — legal, because it is a `fungus` category member and required by nothing. |
| 50 | ★ | **Sharp Eye** | Every read also names one thing you have never gathered, wherever in the valley it grows. |
| 53 | ◇ | **Tinder Bracket** | Dead oak and pine trunks, grove + ridge. **WINTER only.** Foraging is the one craft that makes winter richer than summer. `fungus` member; **Fenn loves it** (a smith wants tinder). |
| 57 | ✚ | **Marsh Bitters** | `marsh` slot. |
| 58 | ◇ | **Marsh Mallow** | Wet ground. **Summer only** — legal; `marsh` and `bloom` member. |
| 62 | ◈ | **Trail-sign** | Gathering marks the trail: every other ungathered node **on the whole map** glimmers once. Turns a circuit from a memorised route into something the valley tells you. |
| 64 | ◇ | **Sundew** | Wettest ground, all seasons (Summer/Fall abundance), **before 12:00**. ★ *Changed:* the draft's 10:00 gate is a 64-second window and Sundew is the Tincture's named star; 12:00 is six game hours, the §3.5 floor. |
| 67 | ✚ | **Sable's Steep** | ★ **Sea Holly's first non-gift use.** |
| 70 | ▣ | **Deepsilver-Bound Trug** | `TIER_LEVEL[5]`. A read also names what this ground last gave you. |
| 73 | ◇ | **Mistletoe** | Grove **ring ≥ 6**, in the crown of old oaks. **Winter.** (Sable's 99 praise names it.) |
| 75 | ★ | **Deft Hands** | A preparation at the rack sometimes returns one of its ingredients. Thrift's shape, transposed — a **saving**, never a gate. |
| 79 | ◇ | **Frost Fern** | Ridge summit. **Winter, after snow.** |
| 82 | ✚ | **Sundew Tincture** | ★ **Starlight Shard's first mechanical sink.** |
| 85 | ▣ | **Star-Bound Trug** | `TIER_LEVEL[6]`. A read names **tomorrow's** offer as well as today's (reads `state.forecast`, published the night before by `rollForecast` — so the read is a plan, never a lottery). |
| 88 | ◇ | **Moonwort** | Ridge summit. All seasons, **after 19:00** — the shipped `shardnode` window exactly (112 real seconds). ★ *Changed:* was 21:00 (80 s) **and** clear-only. |
| 91 | ✚ | **Moonwort Cordial** | ★ **New, and the reason the top band is content and not a queue.** A repeatable preparation above L85 — the shape Smithing uses to make its last fourteen levels survivable (Star Fitting 88, Sun-Bell 90, The Long Chain 94, Starward Anvil 97). |
| 93 | ◈ | **The Long Walk** | The Almanac gains a valley page: for every outdoor map, what can be found there **today**, given season, sky and hour. Fully derived from `WILD` — no live map state, no new save field. |
| 96 | ◇ ✚ | **Heart's Ivy** · **The Valley Posy** | The grove's ring 9, on the Heart of the Forest itself: one node, once a day, all seasons — and the craft's keepsake, made from it. Required by nothing. *(One rung, two entries; the linter counts levels, so the mark total is unchanged.)* |
| 99 | ★ | **The Valley Knows You** | A wild find is put out for you by the cottage door each morning, chosen from what is in season. |

### Computed from exactly that table

```
marks:          45   (18 wild + 12 preparations + 5 arts + 6 Trug tiers + 4 masteries)
largest gap:     4   (at 32→36, 37→41, 53→57, 58→62, 75→79)
marks above L85: 5   (88, 91, 93, 96, 99 — the band that is 45.43% of the 1-99 climb)
dead XP:      0.00%  (LADDER_GAP_WARN = 8; no pair reaches it, so `gaps` is empty)
tail:            0
```

**The authored-only test** (strip the 10 engine-given marks — the 6 `TIER_LEVEL` rungs and the 4 `MASTERY` rungs — because those are free to any craft and mask a thin spine):

```
Foraging authored-only: 35 marks · max gap 6 · tail 3 · 0.00% dead
Smithing authored-only: 28 marks · max gap 8 · tail 2 · 15.89% dead   ← the template FAILS its own linter here
```

Add this test to `tools/build-atlas.mjs` as a standing check (§7 step 12). It is the single best argument for this design and the single best argument for having the test. *(For reference, the same filter over the rest of the game: Warding 5/20/19/**100%** · Mining 12/10/14/80.8% · Farming 23/11/9/77.5% · Fishing 21/10/14/76.2% · Woodcutting 13/12/14/73.1% · Cooking 30/6/9/34.6%.)*

---

## 3. The exact data to write

All new tables live in **`game/js/01-data.js`**, placed **below `EXAMINE`'s neighbours in the data block but above `unlockLadder`** — concretely, after `FORGE`'s `Object.assign(ITEM_SELL, …)` at **`01-data.js:1861`** and before `TOOLS` at `:1863`. The file's own rule applies, and it has bitten twice: *a table may only read a table defined above it — otherwise mutate afterwards.* `ITEM_SELL` is declared at `:1386`, `EDIBLE` at `:1411`.

### 3.1 The four categories (fix for fatals 3 and 6, in one mechanism)

```js
// ★ v6.5 — INGREDIENT CATEGORIES. The load-bearing idea of this release's economy.
//
// The WEATHERS header (01-data.js:1636) states the contract: weather never takes anything away; it
// changes what the valley OFFERS, for one day. A preparation that REQUIRES a fog-only mushroom breaks
// that contract — it turns "fog offers something" into "no fog, no craft". Measured: fog is 10/6/16/13%
// by season and rollWeatherFor suppresses it entirely on ~13 dated days a year.
//
// The fix is not to un-lock the mushroom. It is to make a locked find a legal SUBSTITUTE rather than a
// requirement. Every category below contains at least one member available on EVERY day of EVERY season,
// so no preparation can ever be blocked — and the rare, locked, place-specific finds are simply the
// better thing to put in the slot when you have it. Weather changes what you offer the rack; never
// whether the rack works.
//
// Second effect, deliberate: categories ADOPT shipped orphans structurally. Mountain Thyme, Samphire,
// Snowdrop, Sea Aster and Sea Holly all become ingredients here without one shipped recipe changing.
const WILD_CATS = {
  green:  { label:"leaf",   items:["Wood Sorrel","Watercress","Hearth Nettle","Mountain Thyme","Samphire"] },
  fungus: { label:"cap",    items:["Unnamed Cap","Brown Cap","Kingcap","Witch's Butter","Grey Cap","Tinder Bracket"] },
  marsh:  { label:"marsh",  items:["Bogbean","Reedmace Down","Marsh Mallow","Sundew"] },
  bloom:  { label:"bloom",  items:["Snowdrop","Sea Aster","Sea Holly","Elderflower","Marsh Mallow"] },
};
// The always-available member of each category. Asserted by the harness (§7 step 10) — a category whose
// unlocked member is later given a season is a broken contract with no visible symptom.
const WILD_CAT_FLOOR = { green:"Wood Sorrel", fungus:"Unnamed Cap", marsh:"Bogbean", bloom:"Snowdrop" };
```

**Pricing rule for a category slot:** a preparation's `sell` is derived from the **cheapest legal composition**, so a premium ingredient is a choice a player makes with what they have, never a loss the game forces. The rack panel sorts a category's members cheapest-first and shows what you actually hold.

### 3.2 `WILD` — the eighteen new finds

`form` selects the sprite shape; `col` tints it (the `FORGE` pattern, `03-art.js:1457` — parameterised shape functions, not one-off art). `maps` is a whitelist; `ground` accepts tile names **plus the pseudo-ground `"WET"`** (§5.1). `seasons: null` means all four. `abundant` lists conditions that **double or 1.5× the count** — never gate it. `n` is per-map spawn attempts per day; on `grove` it is **per ring**.

```js
const WILD = [
  // id        item              lvl  xp   sell  form      col        where / when                                   n
  { id:"nettle",   item:"Nettle",        lvl:1,  xp:6,   sell:10,  form:"herb",    col:"#4e7a3c",
    maps:{farm:5, village:4, coastroad:3}, ground:["GRASS","TALLGRASS","FLOWERGRASS"], seasons:null },
  { id:"sorrel",   item:"Wood Sorrel",   lvl:3,  xp:9,   sell:16,  form:"leaf",    col:"#7cc45a",
    maps:{grove:6}, rings:[1,3], ground:["GRASS","TALLGRASS"], seasons:null, abundant:{seasons:["Spring","Summer"], x:1.5} },
  { id:"pignut",   item:"Pignut",        lvl:7,  xp:13,  sell:24,  form:"cluster", col:"#b89a68",
    maps:{grove:4, ridge:3}, rings:[1,3], ground:["GRASS"], seasons:null },
  { id:"unncap",   item:"Unnamed Cap",   lvl:12, xp:19,  sell:30,  form:"cap",     col:"#a89078",
    maps:{grove:4}, rings:[1,3], ground:["GRASS","TALLGRASS"], seasons:null, abundant:{afterRain:true, x:2} },
  { id:"bogbean",  item:"Bogbean",       lvl:17, xp:26,  sell:42,  form:"flower",  col:"#d8dcc8",
    maps:{coastroad:3, butterbrook:3, farm:1}, ground:["WET"], seasons:null },
  { id:"reedmace", item:"Reedmace Down", lvl:22, xp:36,  sell:52,  form:"reed",    col:"#8a6a3a",
    maps:{coastroad:3, butterbrook:2, marrowpoint:2}, ground:["WET"], seasons:null },
  { id:"hnettle",  item:"Hearth Nettle", lvl:27, xp:48,  sell:66,  form:"herb",    col:"#6a7a4a",
    maps:{ridge:4}, ruin:true, ground:["GRASS","DIRT"], seasons:["Spring","Summer","Fall"] },
  { id:"elderfl",  item:"Elderflower",   lvl:32, xp:64,  sell:82,  form:"flower",  col:"#f0f0e0",
    maps:{grove:3}, rings:[1,3], nearTree:"elderwood", ground:["GRASS","TALLGRASS"], seasons:null,
    abundant:{seasons:["Spring","Summer"], x:2} },
  { id:"cress",    item:"Watercress",    lvl:37, xp:86,  sell:100, form:"leaf",    col:"#3ec878",
    maps:{coastroad:3, butterbrook:2}, ground:["WET"], seasons:null, abundant:{seasons:["Spring","Fall"], x:1.5} },
  { id:"birchsap", item:"Birch Sap",     lvl:42, xp:115, sell:125, form:"tap",     col:"#e8dcc0",
    maps:{ridge:1}, ruin:true, birch:true, ground:["GRASS","DIRT"], seasons:["Spring"] },
  { id:"greycap",  item:"Grey Cap",      lvl:48, xp:155, sell:160, form:"cap",     col:"#8f9aa6",
    maps:{grove:4, coastroad:2, butterbrook:1}, rings:[1,3], ground:["GRASS","TALLGRASS","WET"], seasons:null, sky:"fog" },
  { id:"bracket",  item:"Tinder Bracket",lvl:53, xp:195, sell:190, form:"bracket", col:"#a06a3a",
    maps:{grove:4, ridge:3}, rings:[1,3], deadTrunk:true, ground:["GRASS","DIRT"], seasons:["Winter"] },
  { id:"mallow",   item:"Marsh Mallow",  lvl:58, xp:245, sell:220, form:"flower",  col:"#e8b8c8",
    maps:{butterbrook:3, coastroad:2}, ground:["WET"], seasons:["Summer"] },
  { id:"sundew",   item:"Sundew",        lvl:64, xp:310, sell:265, form:"herb",    col:"#e05a6a",
    maps:{butterbrook:2, coastroad:1, marrowpoint:1}, ground:["WET"], seasons:null, toHour:12,
    abundant:{seasons:["Summer","Fall"], x:1.5} },
  { id:"mistle",   item:"Mistletoe",     lvl:73, xp:430, sell:330, form:"cluster", col:"#c8dcb0",
    maps:{grove:3}, rings:[6,9], ground:["GRASS"], seasons:["Winter"] },
  { id:"frostfern",item:"Frost Fern",    lvl:79, xp:540, sell:380, form:"leaf",    col:"#bfe4ff",
    maps:{ridge:4}, summit:true, ground:["SAND","DIRT"], seasons:["Winter"], sky:"snow" },
  { id:"moonwort", item:"Moonwort",      lvl:88, xp:740, sell:430, form:"flower",  col:"#d8c8ff",
    maps:{ridge:5}, summit:true, ground:["SAND","DIRT"], seasons:null, fromHour:19 },
  { id:"heartivy", item:"Heart's Ivy",   lvl:96, xp:1050,sell:560, form:"leaf",    col:"#9ae0c8",
    maps:{grove:1}, rings:[9,9], heartTree:true, ground:["GRASS"], seasons:null, cap:1 },
];
const WILD_BY_ID   = (() => { const m = {}; for(const w of WILD) m[w.id]   = w; return m; })();
const WILD_BY_ITEM = (() => { const m = {}; for(const w of WILD) m[w.item] = w; return m; })();
```

**Pricing rule, and it is a rule, not a vibe:** foraging costs **no energy**, so a wild find's gold and XP must sit **under** the same-level ore or fish. Verified against the live tables: Watercress L37 sells 100 against Gold Ore L30's 165 · Grey Cap L48 = 160 against Cobalt L45's 300 · Sundew L64 = 265 against Deepsilver L70's 370 · **Moonwort L88 = 430 against Star Metal L85's 450** · Heart's Ivy L96 = 560 against Coelacanth L85's 1200. XP likewise: Copper Vein L10 pays 78 for one energy-costing swing; Unnamed Cap L12 pays 19 for a free press. Star Metal Vein L85 pays 1,560; Moonwort L88 pays 740.

### 3.3 The three caps, and the cutting

Not `WILD` rows — they are conversions, and their marks belong to the Cap Book, not to themselves.

```js
const CAPS = [
  { name:"Brown Cap",      w:0.62, sell:38,  col:"#a07850" },
  { name:"Kingcap",        w:0.30, sell:95,  col:"#d8a83a" },
  { name:"Witch's Butter", w:0.08, sell:210, col:"#e8c85a" },
];
```
Plus one item, `"Wild Cutting"` (sell 26), the output of the Cuttings art.

### 3.4 `PREPS` — the Drying Rack's twelve

```js
// ★ The rack. Modelled on FORGE, not on MACHINES: MACHINES is load-one-item-and-wait; a preparation
// takes several ingredients and gives one thing back, which is the forge's shape. The PANEL is a direct
// copy of the v6.4 forge panel (10-ui.js:2063 openForge / renderForge) with SMELT/FORGE replaced by
// DRY/STEEP. An `ing` entry may be a plain count OR {cat:"…", n:…} — see WILD_CATS above.
const PREPS = [
  { name:"Dried Herbs",         lvl:16, ing:{"Mountain Thyme":3, "Nettle":2},                                sell:280,  xp:38,   col:"#8a9a5a" },
  { name:"Nettle Cord",         lvl:21, ing:{"Nettle":6, "Seaweed":2},                                       sell:160,  xp:58,   col:"#7a6a4a" },
  { name:"Sorrel Vinegar",      lvl:26, ing:{ green:{cat:"green",n:5}, "Clam":2 },                            sell:280,  xp:86,   col:"#c8d86a" },
  { name:"Cap Powder",          lvl:31, ing:{ fungus:{cat:"fungus",n:3}, "Dried Herbs":1 },                   sell:670,  xp:125,  col:"#b89878" },
  { name:"Elderflower Cordial", lvl:36, ing:{ bloom:{cat:"bloom",n:5}, "Honey":1 },                           sell:520,  xp:180,  col:"#f0e8b0", steep:true },
  { name:"Frostberry Preserve", lvl:41, ing:{"Frostberry":6, "Honey":2},                                     sell:790,  xp:250,  col:"#a8c8e8", steep:true },
  { name:"Rush Basket",         lvl:47, ing:{"Reedmace Down":4, "Nettle Cord":2},                            sell:950,  xp:335,  col:"#c8a86a" },
  { name:"Marsh Bitters",       lvl:57, ing:{ marsh:{cat:"marsh",n:4}, "Dried Herbs":1 },                     sell:810,  xp:480,  col:"#6a8a5a", steep:true },
  { name:"Sable's Steep",       lvl:67, ing:{ fungus:{cat:"fungus",n:3}, "Elderflower Cordial":1, "Sea Holly":2 }, sell:1240, xp:670, col:"#9ab0a0", steep:true },
  { name:"Sundew Tincture",     lvl:82, ing:{"Sundew":3, "Marsh Bitters":1, "Starlight Shard":2},            sell:3040, xp:1020, col:"#e07a8a", steep:true },
  { name:"Moonwort Cordial",    lvl:91, ing:{"Moonwort":2, "Elderflower Cordial":1, "Honey":2},              sell:2840, xp:1500, col:"#d8c8ff", steep:true },
  { name:"The Valley Posy",     lvl:96, ing:{"Heart's Ivy":1, "Frost Fern":2, "Mistletoe":1, "Moonwort":1, "Snowdrop":4 },
                                                                                                             sell:4020, xp:2200, col:"#e8d8f0", keepsake:true },
];
const PREP_BY_NAME = (() => { const m = {}; for(const p of PREPS) m[p.name] = p; return m; })();
Object.assign(ITEM_SELL, (() => { const m = {};
  for(const w of WILD)  m[w.item] = w.sell;
  for(const c of CAPS)  m[c.name] = c.sell;
  for(const p of PREPS) m[p.name] = p.sell;
  m["Wild Cutting"] = 26; return m; })());
Object.assign(EDIBLE, { "Pignut":14, "Watercress":16, "Brown Cap":18, "Birch Sap":22,
                        "Elderflower Cordial":40, "Frostberry Preserve":38 });
```

Processing premium is **×1.8 on the cheapest legal input composition** throughout — inside the cellar's shipped band (jar ×1.6, press ×1.5, keg ×2.2). **★ Before shipping, sample gold-per-day at L50/L75/L99 against GBP's reference appendix and the Patron/writ sinks. If it clears the Smithing or Fishing reference, cut the multiplier to ×1.5 — still inside the shipped band — rather than nerfing any single row.**

**★ Orphans adopted, by name, in one release:** Seaweed (Nettle Cord) · Clam (Sorrel Vinegar) · Frostberry (Frostberry Preserve) · Starlight Shard (Sundew Tincture) · Mountain Thyme (Dried Herbs + `green`) · Samphire (`green`) · Sea Holly (Sable's Steep + `bloom`) · Snowdrop and Sea Aster (`bloom`) · Honey gains a third and fourth sink.

**★ Orphans created: zero.** Every one of the eighteen finds has a mechanical sink — the ten in categories, plus Nettle (Cord), Reedmace (Basket), Pignut/Birch Sap (edible + gift), Elderflower (Cordial + `bloom`), Frost Fern/Mistletoe/Heart's Ivy (Posy), Moonwort (Cordial + Posy). §7 step 11 asserts this rather than trusting it.

### 3.5 The two supply rules a harness can check

> **R1 — Availability.** Every ingredient of every non-keepsake preparation must be obtainable on **≥ 40% of the days of every season**. *Measured against `WEATHER_ODDS`: clear passes (.55/.62/.48/.45); fog fails (.10/.06/.16/.13); snow fails (0/0/0/.42); any single-season lock fails.* A locked find satisfies R1 **only** through a category whose `WILD_CAT_FLOOR` member is unlocked.
>
> **R2 — Window.** A find that is an input to anything must be gatherable for **≥ 6 game hours** a day. *One game hour = 16 real seconds (`08-actions.js:2110`), so 6 h = 96 real seconds. The shipped precedent is `shardnode` at 19:00 → 26:00 = 7 h = 112 s.* Anything narrower is a flourish on a find that feeds nothing.
>
> **Keepsake exemption:** The Valley Posy may name locked finds directly, because it is required by nothing, has no expiry, and is the craft's memento rather than a step on its ladder.

Applying R1/R2 to the corrected table: the only hard locks that survive on *inputs* are `fungus`/`bloom`/`marsh` members (all covered by an unlocked floor), Frostberry (terminal good), and Starlight Shard (clear sky ≥ .45 every season, 7 h window — passes both).

### 3.6 The landing checklist — everything else a skill key needs

A skill key that lands without these is not incomplete, it is a **crash**. `nextMastery` (`08-actions.js:234-238`) indexes `MASTERY[skill][n]` with no guard, and the skills panel calls it on every render.

| # | Table | File · anchor | What lands |
|---|---|---|---|
| 1 | `freshState()` | `04-world.js:24` region | `skills.Foraging:0`, `tools.Trug:0`, `forageSeeded:true` |
| 2 | `MASTERY.Foraging` | `01-data.js:1688` | 25 "Light Hands" · 50 "Sharp Eye" · 75 "Deft Hands" · 99 "The Valley Knows You" — **all four, or the panel throws** |
| 3 | `MASTERY_NPC.Foraging` | `01-data.js:648` | `"sable"` — Sable Harrow, whose shipped `liked` list is already Sea Aster / Sea Holly / Mountain Thyme / Snowdrop / Samphire (`13-content.js:1346`). She is the valley's forager by taste and has been since v6.0. `MASTERY_NPC` must stay a bijection over crafts (`14-story.js:1833`). |
| 4 | `MASTERY_PRAISE.Foraging` | `01-data.js:649` | four lines; the 99 line names Mistletoe |
| 5 | `TRIALS.Foraging` | `01-data.js:2923` | 50 + 75, cross-skill, on the Pledge-Ledger pattern, **nothing rare-drop-gated** (the table's own header rule). `tools/check-saves.mjs` iterates `for(const sk in TRIALS)` asserting grandfathering per key — a missing entry silently drops that assertion. |
| 6 | `SKILL_ICON.Foraging` | `10-ui.js:574` | `"item_Nettle"` |
| 7 | `TOOLS` | `01-data.js:1863` | append `"Trug"` |
| 8 | `TOOL_ICON.Trug` | `01-data.js:1864` | `"trug"` |
| 9 | `TOOL_SKILL.Trug` | `01-data.js:1886` | `"Foraging"` |
| 10 | `TOOL_PERK.Trug` | `01-data.js:1891` | seven-element array (index 0 empty). The Trug's six tier marks are the only ones this craft gets free, and v6.4.1's correction — *a mark must be behind something the player can feel* — means all six must buy something. There is no `FORGE_ENERGY_BY_TIER` equivalent (the craft commits to costing zero energy forever), so the Read's **reach and contents are all the Trug has**: `["", "a read reaches three tiles", "a read reaches five tiles", "a read carries the whole screen", "a read carries the whole screen, and names the season's next arrival", "a read also names what this ground last gave you", "a read names tomorrow's offer as well as today's"]` |
| 11 | `TIER3_GEM` | `01-data.js:1908` | **no Trug row** — and §4.6 fixes the unguarded read that makes this a bug today |
| 12 | `INTERACT_KINDS` | `07-entities.js:126-137` | add `"wild"` — without it `facingInteractable` returns false and **no [E] prompt draws over any of the eighteen nodes** |
| 13 | `OBJ_NAME` | `08-actions.js:523-530` | `wild:"Wild Growth"` (the examine/read label) |
| 14 | `EXAMINE` | `01-data.js:2432` | one line per new item — 33 entries |
| 15 | Collection groups | `10-ui.js:814-817` | a new `"The Wild"` group over `WILD`+`CAPS`+`PREPS` |
| 16 | Item art | `03-art.js` (`FORGE` pattern at `:1457`) | 8 parameterised `form` shape functions × `col`, one `mkSpr("item_"+name, …)` per item, plus `tool_trug` and `obj_wild_<form>` |

---

## 4. The engine changes

### 4.1 `addXP` gains a secondary mode — the fix for fatal #1

```js
// v6.5: `opt.secondary` marks a grant the player did not choose — today, only Foraging's co-credit on
// the eleven legacy nodes. A secondary grant pays FULL XP, fires level-ups and trial gates normally, and
// is otherwise invisible: it writes no state.dailyXpActs key, so it neither consumes a spark nor widens
// sparkCap()'s breadth term. Without this, one free level-1 berrybush press would raise the variety-spark
// cap for EVERY craft in the game for the whole day — a game-wide XP buff bought with nothing.
function addXP(skill, amt, opt){
  … charm and keepsake multipliers unchanged …
  if(!(opt && opt.secondary)){
    if(!state.dailyXpActs) state.dailyXpActs = {};
    if((state.dailyXpActs[skill] || 0) < sparkCap()){ … unchanged … }
  }
  … level-up, trial gates, banners: all unchanged …
}
```

`sparkCap()` itself is **not touched.** Foraging's own primary grants (WILD nodes, the rack) spark and count toward breadth like any craft — which is correct, and which is *also* worth stating plainly: **Foraging becomes the cheapest breadth key in the game** (zero energy, level 1, no tool). The ceiling does not move (`min(4, breadth-1)` was already reachable), but reaching it gets easier. That is a buff, legal under the cozy contract, and it goes in the changelog as a buff rather than being discovered later.

### 4.2 The `wild` object kind

One kind carries all eighteen rows; `obj.w` is the id. One `case "wild"` in `interact()`, routing through the existing `forageNode` with `skill:"Foraging"` and `fxp` omitted. `pickedDay` semantics, rain doubling, the Moss Locket and Light Hands all come free from that function.

### 4.3 The spawn pass

One shared helper called from every outdoor generator after its own forage pass, so eighteen finds cost nine call sites and not eighteen generators:

```js
function spawnWild(m, mapId){
  const season = seasonOf(state.day), ring = (mapId === "grove") ? clamp(state.groveRing||1,1,GROVE_RINGS) : 0;
  const rng = makeRng(4242 + state.day*31 + mapId.length*7);
  for(const w of WILD){
    const n = w.maps[mapId]; if(!n) continue;
    if(w.rings && (ring < w.rings[0] || ring > w.rings[1])) continue;
    if(w.seasons && !w.seasons.includes(season)) continue;
    if(w.sky && state.weather !== w.sky) continue;
    let count = n;
    if(w.abundant && wildAbundant(w)) count = Math.round(count * w.abundant.x);
    if(w.cap) count = Math.min(count, w.cap);
    … place `count` attempts on tiles matching w.ground (see §5.1 for "WET"),
       honouring ruin/summit/birch/deadTrunk/nearTree/heartTree anchors,
       skipping occupied tiles exactly as the shipped forage passes do …
  }
}
```

Hour gates (`fromHour`/`toHour`) are **not** spawn conditions — the node is on the map all day and the interact tells you warmly when it will give, exactly as `shardnode` does (`08-actions.js:1229`, "starlight only lets go after dusk"). This matters: a node that vanishes by day cannot be learned.

### 4.4 The rack

New object kind `"rack"`, placed in the cottage and buildable on the farm. Panel = `renderForge` (`10-ui.js:2064`) with SMELT/FORGE → DRY/STEEP, plus category-slot resolution (show members you hold, cheapest first).

### 4.5 The Cuttings art and persistence

A planted cutting writes a `{kind:"wild", w:…, planted:true}` object into `state.farm.objects`. **No new save field:** the farm map object *is* the save (`04-world.js:102`). `planted:true` exists so any future farm respawn pass skips it. Adding objects to `state.farm` grows the serialized save — re-run `node tools/check-perf.mjs` and re-record if the budget moves for a legitimate reason.

### 4.6 The Hammer's tier-3 banner — a live bug this release must not inherit

`08-actions.js:2282` reads `TIER3_GEM[tool]` with no guard; `TIER3_GEM` has no `Hammer` key. **Buying a Gold Hammer prints "The undefined is set into the handle." today, in v6.4.3.** The Trug would hit the same path. Fix the guard, do not copy the precedent:

```js
const sub = cur+1===MAX_TIER ? "Forged from the deep floors and the heart of the grove. …"
          : (cur+1===3 && TIER3_GEM[tool]) ? "The "+TIER3_GEM[tool]+" is set into the handle. Earned across every craft."
          : "Faster, stronger, cozier.";
```

### 4.7 The bag

**Measured pressure:** the release adds 33 kinds; `dense-year3` already carries **53 kinds at `bagTier 2` (cap 48)**. Nothing is lost — `give()` never refuses and overflow goes to the cottage shelf (`08-actions.js:435-478`) — and the twelve preparations are the designed sink that turns eighteen raw finds into stock. Two things ship: **`"Trug"` joins `BAG_FREE`** (equipment is not cargo), and the release notes record the measured number so a fourth bag tier is a v6.6 decision made on evidence rather than a reflex bolted onto this one.

---

## 5. The places

### 5.1 `WET` — the wetland, without a new map

The Sedgeway is cut (§0.2 A). `"WET"` in a `ground` list means: **a walkable tile orthogonally adjacent to `T.WATER`.** Measured free wet tiles per outdoor map today (day 5, clear, no objects on them):

| map | free wet tiles |
|---|---|
| butterbrook | 95 |
| marrowpoint | 85 |
| coastroad | 71 |
| farm | 44 |
| beach | 38 |
| ridge · grove · village · green | 0 |

The fiction is already written and needs no invention: the **Gullwater** estuary runs north–south through the coast road under a plank ford, with its own sign and its own fish (Grayling, "the Gullwater's pride"), and the Coast Boardwalk pledge has promised to "plank the marsh path" since v3. Six finds live on that ground and the valley gains a biome for the price of one predicate.

### 5.2 The Ruin — the one new place

Stamped into `genRidge`: a roofless rectangle of `T.WALL` with a gap where the door was, `T.DIRT` inside where the floor was, one `{kind:"birch"}` prop where the kitchen was, and a `sign`. Hearth Nettle grows on the dirt (Spring/Summer/Fall); the birch is tapped in Spring for Birch Sap. **It is not choppable** — no `TREES` row, no Woodcutting XP, so §1.5 holds absolutely.

This is `V6_WORLD_AND_CRAFTS.md`'s method applied for the price of twenty lines: Elias's 8♥ scene has described this exact place — "It's a ruin. Roof's gone. There's a birch growing where the kitchen was, and it's a good birch" — since v5.6, and the ridge has never had it. Add one recognition line so he notices you have been.

---

## 6. The measured census — sample, do not reason

**v5.3's lesson, applied before the numbers were written rather than after:** the gem-seam rate was wrong by **6×** until it was sampled against the live generator, because a mine floor has ~100 open tiles and not ~600. Everything below was generated headlessly through `tools/lib/load-game.mjs`, not estimated.

**Legacy nodes, clear day 5, per map** (the base for §1.2): farm 4 berrybush · grove 6 berrybush · ridge 5 thyme + 2 snowdrop + 8 shardnode · beach 5 coral + 4 seaweed + 4 shell · coastroad 4 samphire + 4 holly · marrowpoint 3 holly + 1 samphire + 1 shell + 3 coral · butterbrook 5 samphire + 6 aster · green 1 aster · village 0. **`shardnode` spawns on clear days only** — the fact that makes the clear-day method over-count.

**Free ground available for new spawns** (day 5, clear): grassy free — farm 1340 · grove 761 (ring 1) · butterbrook 923 · village 712 · beach 598 · green 555 · coastroad 547 · ridge 321 · marrowpoint 279. Wet as tabled in §5.1. Every proposed `n` in §3.2 sits two orders of magnitude inside its ground budget; the counts are a **design choice**, not a capacity limit.

**Throughput model** (the numbers behind the headline; the model is 20 lines and must be committed with the release so a later balance pass re-runs it rather than re-deriving it): weather- and season-weighted average nodes per day per find, plus realistic rack throughput per band.

| level | XP/day |
|---|---|
| 1 | 72 |
| 10 | 217 |
| 25 | 1,264 |
| 50 | 5,636 |
| 75 | 10,743 |
| 85 | 13,520 |
| 88 | 17,220 |
| 96 | 22,020 |

→ **1→99 = 100 days · 1→50 = 44 · 50→75 = 26 · 75→85 = 13 · 85→99 = 19 · 88→99 = 15.**

**★ The one sample still owed at build time:** grove counts are **per ring** (§0.2 C). The model assumes an average sweep touches ~2 rings. A player who walks all nine multiplies every grove find by up to 9. **Sample the nine-ring walk as the worst case and, if it breaks the curve, drop `rings:[1,3]` to `rings:[1,2]` rather than cutting XP** — the fix belongs in geography, not in the reward.

---

## 7. Build order and definition of done

1. **`01-data.js` data block** — `WILD_CATS`, `WILD_CAT_FLOOR`, `WILD`, `CAPS`, `PREPS`, the two `Object.assign`s, `EXAMINE` rows. Placed after `01-data.js:1861`, before `TOOLS`. Lint each file through `new Function(src)` in node.
2. **The landing checklist (§3.6), all sixteen rows, in the same commit.** Open the skills panel before writing another line — a missing `MASTERY.Foraging` is a TypeError, not a gap.
3. **`addXP`'s `opt.secondary` + the twelve call-site edits (§1.1, §4.1).** *Acceptance: instrument `state.dailyXpActs` and confirm a berrybush press yields exactly `{Farming:1}` — byte-identical to v6.4.3. This is the release's hardest criterion; check it by pressing.*
4. **`migrateSave` + `freshState` (§1.3).** `node tools/check-saves.mjs` — assert the seed on `dense-year3` (exactly Foraging 15), the **no-op** on all nine era fixtures (`stats.forage = 0` → Foraging 0), idempotency, and monotonicity.
5. **The Guild wing OR (§1.4)** + `WING_REQ` rewording + `WING_LIT` snapshot re-record.
6. **Places:** `WET` predicate (§5.1), the Ruin stamp (§5.2), `spawnWild` wired into the nine outdoor generators.
7. **The `wild` kind:** `INTERACT_KINDS`, `interact()`, `examine()`, `OBJ_NAME`, art. Then `node tools/check-interactions.mjs` — and **watch it go red first** by breaking one branch deliberately, per that file's own standing instruction.
8. **The arts** (Reading the Ground · Almanac · Cuttings · Cap Book · Trail-sign · The Long Walk) and **the rack** (§4.4).
9. **Sample the nine-ring grove walk** (§6) and tune `rings`, not XP.
10. **New harness check — supply:** for every non-keepsake preparation, resolve each ingredient (including category members) and assert R1 (≥40% of days in every season) and R2 (≥6 game hours). Assert every `WILD_CAT_FLOOR` member carries no `seasons`, no `sky`, and no hour gate.
11. **New harness check — no orphans:** every `WILD` item and every `CAPS` name must appear in at least one of `PREPS` ingredients, `WILD_CATS`, `EDIBLE`, or an NPC `loved`/`liked` list. Fail loudly with the item name.
12. **New atlas check — authored-only cadence** (§2), printed for every skill.
13. `node tools/check-perf.mjs` (the Cuttings grow `state.farm`) · `node tools/check-schedules.mjs` (unaffected, run it anyway) · `?lint` in the browser.
14. **Release:** `VERSION` → `{ name:"6.5.0", code:148, codename:"The Wild" }` · in-game `CHANGELOG` array · `CHANGELOG.md` retitle · `?v=` bump in `index.html` · `node tools/build-atlas.mjs` (writes `GAME_ATLAS.html` **and** `atlas/v6.5.0.html`) · `git tag v6.5.0` · push with tags.

**The changelog must carry, as numbers and not as claims:** the measured legacy-node year (20,170 XP = L31 = 2.58%) and the correction of the draft's 24,304 · the full node census · the 100-day 1→99 and its five segments · 45/4/5/0.00% and the authored-only 35/6/3/0.00% against Smithing's 28/8/2/15.89% · the sparkCap decision and its byte-identical acceptance test · the measured bag pressure (33 added kinds against a stress fixture already at 53/48) · and the Hammer's tier-3 banner fix, which is a v6.4 bug this release found rather than a v6.5 feature.