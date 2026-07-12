# Grove Depths — the plan

> **What this is.** The approved plan for turning the Deep Grove from a flat resource room into
> Woodcutting's version of the mine loop — depth rings, a skill-flavored way to descend, permanent
> waystone fast-travel funded through a no-wasted-trips pledge ledger, rarity-by-depth tree tables,
> and canopy treasure. Plus a **companion fix (Phase 4)** retrofitting the mine's Old Lift stops onto
> the same ledger, since the owner's critique of "arrive under-resourced, memorize the cost, re-trek"
> applies to the lift verbatim.
>
> **Status.** SHIPPED — all four phases released as **v3.3.0 "The Wood Remembers"** (2026-07-13,
> version code 40). This document remains as the design record; `CHANGELOG.md` v3.3.0 records
> what was actually built (faithful to this plan, with coordinates adjusted for the v3.2.0 farm
> shrink that landed mid-build).
>
> **Owner-decided calls.** Rings capped at 9 (the forest *ends*, unlike the mine). Waystones at
> rings 3 / 6 / 9 plus a free grove-mouth stone. Charms are small single-slot passives. Waystone
> funding must never waste a trip: discovery banks on touch, payment is partial-and-from-anywhere,
> the ledger does the remembering.

---

## 0. Why (read the DEVLOG entries first)

The mine is fun because it's a **loop**: descend → the loot table deepens with you → bank permanent
progress (lift stops) → the next trip starts deeper. The grove (`genGrove`, `game/js/13-content.js`)
is a **room**: one flat 44×30 map, a west-is-older tree gradient, and nothing left to want once you
can chop maple. Woodcutting is a dead skill from level 18 to 99 — `TREES` (`game/js/01-data.js`)
has only oak (1) / pine (8) / maple (18).

Constraint carried from the 2026-07-12 gem verdict: **treasure must have uses, not just sell
value**, or it becomes another economy faucet.

Cozy contract (`GAME_DESIGN_PRINCIPLES.md`): no combat, nothing taken, nothing hazardous. Depth
costs only time and energy, and the way home is always one interaction.

---

## 1. Shared system first: the Pledge Ledger

Both the grove's waystones (Phase 1) and the mine's lift stops (Phase 4) fund through this. Build
it once, generic.

**The model.** A *pledge* is a permanent restoration project with a fixed cost (gold + materials)
that the player fills **in partial deposits, from anywhere, at any time**. Three separated acts,
each banked the moment it happens:

1. **Discovery** — reaching the thing once, ever. Banks permanently. Costs nothing. The trek is
   never wasted, even empty-handed.
2. **Deposits** — from the Journal's new **Restorations** section (or standing at the thing
   itself), one *contribute* button per pledge deposits everything you're carrying that's still
   owed (gold up to the remainder, each material up to its remainder). Progress persists forever.
   Toast summarizes what was deposited and what's still owed.
3. **Completion** — the instant a pledge fills, it wakes **immediately** (banner + sparkle +
   `playSfx("upgrade")`, matching `restoreLift` at `game/js/10-ui.js`). No "come back tomorrow."

**Data.** `state.pledges = { [id]: { gPaid: 0, mats: { [item]: nPaid } } }`. A pledge id is e.g.
`"way3"`, `"way6"`, `"way9"`, `"lift5"`, `"lift10"`, … Completion is *derived* (paid ≥ cost) but
also mirrored into the existing done-arrays (`state.waystones`, `state.liftStops`) so all current
code keeps working. Registry in `01-data.js`:

```js
// PLEDGES: id → { name, sub, cost(), discovered(), onComplete() }
```

- `discovered()` decides visibility in the ledger (see per-phase rules below).
- `saveGame()` after **every** deposit — same rationale as the comment at `restoreLift`
  (`10-ui.js`): permanent purchases must never be lost to a crash.
- **Supporting touch:** when the player *gains* an item an active discovered pledge still needs,
  a quiet occasional toast ("the ring-6 waystone wants 4 more of these"). Rate-limit to once per
  item per day — helpful, never nagging.

**UI.** `renderJournal()` (`game/js/10-ui.js:447`) gains a Restorations block (style-match the
Almanac block): each discovered, unfinished pledge shows name, remaining gold/materials with the
green/red have-counts idiom used by `renderLift`/`renderCooking`, and a **contribute** button.
Completed pledges collapse to a one-line "✔ restored" row.

**Migration.** `migrateSave` (`game/js/11-title.js:161`): init `state.pledges = {}` and
`state.waystones = []` when absent. Existing `state.liftStops` entries stay authoritative
(already restored — no pledge needed).

---

## 2. Phase 1 — Rings, deadfalls, waystones

### Rings

The Deep Grove becomes a chain of **9 discrete maps** ("rings"), generated per `depth + day`
exactly like mine floors (`genMine` seeds `makeRng(9001 + depth*137 + state.day*7)`; grove rings
use the existing grove seed family: `makeRng(777 + ring*131 + state.day*23)`).

- `state.groveRing` (transient, like `mineDepth`) and `state.groveBest` (persistent, like
  `mineBest`) via `migrateSave`.
- Entry from the farm treeline is **always Ring 1** (mirrors `enterMine`, `13-content.js`).
- Keep the current map size (44×30), the campfire clearing on Ring 1, the forage bushes on every
  ring, and the nightly reshuffle. `genGrove` becomes `genGrove(m)` reading `state.groveRing` the
  way `genMine` reads `state.mineDepth`; the mapCache key must include the ring (copy whatever
  `mine` does — it caches per depth+day).
- Subtitle per ring, mine-style: `"Ring " + n` + a flavor tail (`"the wood grows old here"` past
  ring 5). Ring 9 is **the Heart of the Forest** — smaller, reverent, one story-shaped landmark
  (a great mother tree; interaction/content deferred to the story workstream — plant the object
  and a flag, like the mine's `sealeddoor` vault at `13-content.js`).

### Deadfalls — how you go deeper

At the west edge of each ring (1–8), the forest is sealed by a **deadfall** — a great fallen
trunk. You chop *through* it: it's a choppable object with an HP pool and a Woodcutting level
requirement, handled in the same code path as trees in `08-actions.js` (level gate → swings →
fell). **The door pays you:** felling it gives XP and a pile of the ring's common wood.

| Into ring | WC req | HP (tunable) | Notes |
|---|---|---|---|
| 2 | 5 | 10 | first taste of the loop |
| 3 | 12 | 14 | waystone ring |
| 4 | 20 | 18 | |
| 5 | 30 | 24 | willow country begins |
| 6 | 40 | 30 | waystone ring |
| 7 | 52 | 38 | heartwood country begins |
| 8 | 64 | 46 | |
| 9 | 78 | 56 | the Heart — endgame gate |

- The WC requirement is the ring's *soft level gate* — deep spawn tables can assume the level.
- A felled deadfall stays open **for the day** (map cache) and regrows overnight, consistent with
  "the forest rearranges itself each night." Waystones are what persist.
- Passage layout mirrors the mine's sacred-ladder rules (`genMine`, `13-content.js`): the
  deadfall's approach must never be sealed by props; reuse/adapt the BFS reachability guard.

### Waystones

Mossy carved standing stones from the Guild's era. **Grove mouth** (Ring 1, by the entrance) is
already awake — free. Dormant stones stand at fixed, generous spots on **rings 3, 6, 9**.

- **Discovery:** press E on a dormant stone → "the stone remembers you" → pledge `way3`/`way6`/
  `way9` becomes visible in the ledger, permanently.
- **Funding:** through the Pledge Ledger (§1) — remotely in installments, or by contributing
  while standing at the stone (same button, same code).
- **Riding:** standing at any awake stone opens a panel listing all awake stones (clone the
  `openLift`/`renderLift`/`rideLift` shape, `10-ui.js`). Stepping between stones is free.
  Grove mouth is always in the list, so **home is always one interaction from any funded ring** —
  the forest's "riding up is free."
- **Costs** (tunable; cross-economy on purpose — the grove's stones want *ore*, the mine's lift
  wants *wood*, so the two deep venues feed each other):
  - `way3`: 800g · 10 Copper Ore · 5 Iron Ore
  - `way6`: 2500g · 10 Iron Ore · 5 Gold Ore
  - `way9`: 6000g · 10 Gold Ore · 1 Ruby (the lift's deep stop takes the Diamond — differentiate)

### Phase 1 acceptance

- Enter grove → Ring 1; chop the deadfall → Ring 2; `groveBest` updates; quest hook `checkQuests()`
  fires on descent like `mineDown` does.
- Touch ring-3 stone empty-handed → it appears in the Journal ledger with full cost shown.
  Deposit partial from the farm → remainder shown. Fill it → instant wake, panel now teleports.
- Sleep → rings reshuffle, deadfalls regrow, waystones stay awake, pledge progress intact.
- Reload an old save → `migrateSave` adds the new fields, nothing else changes.

---

## 3. Phase 2 — New trees, rarity by depth, and sinks

Three new species fill the 18→99 desert (numbers tunable at build; follow the existing
`TREES` scaling — oak 3hp/25xp, pine 6/60, maple 11/115):

| Tree | WC lvl | hp | xp | Found from | Role |
|---|---|---|---|---|---|
| Willow | 30 | 8 | 150 | Ring 3+ | the fast-XP tree — quick chop, low sell (RS willow feel) |
| Elderwood | 45 | 16 | 260 | Ring 5+ | premium timber — the thing high-tier sinks ask for |
| Heartwood | 70 | 24 | 520 | Ring 7+ | the yew/magic analog — sparse spawns, an *event* |

- **Ring spawn tables** replace `genGrove`'s x-position bands, exactly like `genMine`'s depth-keyed
  `oreTable` (`13-content.js`): shallow rings oak/pine, middle rings phase in maple/willow, deep
  rings phase commons out. Every ring keeps *some* choppable tree at its gate's WC level.
- **One Ancient tree per ring 5+** (one per day, glowing — reuse the lighting system for a soft
  pulse): bonus yield + a guaranteed canopy drop (Phase 3). The grove's "something glimmers below."
- **Sinks ship in the same phase or the wood is noise.** Minimum: tier-3/4 tool costs and
  `liftStopCost` (`01-data.js`) updated to ask for the new woods where maple currently repeats;
  waystone costs above; at least one Rowan village project wanting Elderwood. Price sell values
  *below* trend (the gem lesson — `01-data.js` GEM_SELL comment).
- **Art:** new tree palettes in the `TREES` entries; canopy silhouettes per species in `03-art.js`
  following the existing oak/pine/maple draw code. Verify visually per the repo rule.
- **Atlas:** new species/objects will trip `tools/build-atlas.mjs`'s hand-written mappings —
  update the generator, regenerate, commit together.

### Phase 2 acceptance

- WC 25 player in ring 3 sees willows they can't chop yet (locked toast, same idiom as
  `08-actions.js` tree gate) — desire ahead of ability.
- Skill guide (`10-ui.js` unlock lists, keyed off `TREES`) picks up the new species automatically.
- No new wood is sell-optimal compared to its gathering time vs. existing money-makers.

---

## 4. Phase 3 — Canopy treasure (the birds' nest system)

On any tree felled (not deadfalls), a small chance **something falls from the canopy** — a nest.
Base ~4%, scaling gently with ring; storm/fog boost it like the mine's gem boost
(`genMine`, `13-content.js`). Weighted table, deeper rings roll better:

1. **Common — most nests:** seeds, a sapling, a berry cache. Feeds farming.
2. **Uncommon — charms:** small trinkets (Wren-Feather Charm, Carved Acorn Ring, …). **One
   equipped at a time** in a single charm slot (`state.charm`), piggybacking the keepsake pattern
   (Grandpa's Pin, `01-data.js` — "+10% XP while carried"). Effects deliberately tiny: +5% WC
   XP, occasional extra forage, a warmer lantern radius. Modest sell prices. 4–6 charms total.
3. **Rare — unlocks:** a recipe page, a fruit-tree sapling variant, or a scrap of *the old
   forester's journal* — an Almanac-page-shaped hook the story workstream can claim later
   (`renderPages`, `10-ui.js`).
4. **Event-rare:** one signature keepsake, the grove's Diamond. Exists to be a story someone
   tells; near-zero weight.

Nest opening is immediate (no key/kiln friction): felling → "a nest tumbles down!" → contents
toast + sparkle. The Ancient tree (Phase 2) guarantees a roll at one tier better than common.

### Phase 3 acceptance

- 30 minutes of chopping yields several common nests, maybe one charm; the charm slot renders in
  the backpack UI; equipping/swapping works; effects apply and are visible somewhere honest
  (skills panel or charm tooltip).
- Economy check: nest EV per hour < the same hour's wood value — treasure is seasoning, not the meal.

---

## 5. Phase 4 — Companion fix: the Old Lift on the Pledge Ledger

**The owner's waystone critique applies verbatim to the existing mine lift stops** (pay-in-full
while standing at the stop; cost lives in the player's memory between trips). Retrofit them onto
§1. This phase is deliberately self-contained — an agent can ship it without touching any grove
code, before or after Phases 2–3 (it only *requires* §1's ledger, built in Phase 1).

### Current behavior (anchors)

- `state.liftStops` — permanent restored stops (`04-world.js:32`).
- `liftStopCost(n)` — costs every 5th floor, doubling past 20 (`01-data.js:497`).
- `openLift`/`renderLift`/`rideLift`/`restoreLift` — panel + all-or-nothing restore
  (`10-ui.js:687-733`).
- `mineDown` toasts "a lift stop waits here" on unrestored multiples of 5 (`13-content.js:225`).
- `state.mineBest` — deepest floor ever reached (`13-content.js:223`).

### The fix

1. **Discovery is derived, free, and retroactive:** a lift-stop pledge `lift<n>` is *discovered*
   iff `state.mineBest >= n`. No new discovery state, no touch required — landing on the floor
   *is* reaching it. `migrateSave` backfills automatically for old saves (any multiple of 5
   ≤ `mineBest` shows in the ledger). Cap what the ledger *lists* at the next undiscovered stop
   past `mineBest` — don't render an infinite doubling series.
2. **`restoreLift` becomes a contribute:** the panel row at an unrestored stop keeps its place
   but routes through the shared pledge deposit (partial OK, shows remainder with the existing
   green/red idiom). The disabled-until-affordable button goes away — you can always contribute
   *something*.
3. **Remote funding:** the same `lift<n>` pledges appear in the Journal's Restorations section —
   deposit from the farm, the village, anywhere.
4. **Completion unchanged in effect:** on fill, push `n` into `state.liftStops` (so `renderLift`,
   `enterMine`'s hum-toast, and everything else keep working untouched), banner + sparkle +
   `saveGame()` — same celebration `restoreLift` does today.
5. **Copy pass:** `mineDown`'s "a lift stop waits here" gains a second variant once discovered
   but part-funded: "the floor-10 stop is 3 iron short." The ledger does the remembering; the
   toasts do the reminding.

### Phase 4 acceptance

- Old save with `mineBest=17`, `liftStops=[5]`: ledger shows floor-10 and floor-15 pledges
  (floor 5 collapsed as restored), nothing past 20 until reached.
- Deposit part of floor-10's cost from the farm; ride to floor 10; contribute the rest at the
  lift; stop wakes instantly; `liftStops` now `[5,10]`; reload-safe.
- No behavior change for stops already in `liftStops`.

---

## 6. Save fields (all via `migrateSave`, `11-title.js:161`)

| Field | Type | Persistence | Phase |
|---|---|---|---|
| `state.groveRing` | int | transient (reset to 1 on entry) | 1 |
| `state.groveBest` | int | permanent | 1 |
| `state.pledges` | `{id:{gPaid,mats}}` | permanent | 1 |
| `state.waystones` | `["way3",…]` awake stones | permanent | 1 |
| `state.charm` | string\|null equipped charm | permanent | 3 |
| (nest unlock flags) | `state.flags.*` | permanent | 3 |
| `state.liftStops` | *(existing — unchanged)* | permanent | 4 |

---

## 7. Per-phase shipping ritual (repo standing rules — non-negotiable)

For **each** phase: syntax-check every touched `game/js/*.js` via `new Function(src)` in node →
bump the `?v=` cache-buster in `game/index.html` → verify in the browser on port 8643 with
screenshots (lighting/UI changes especially) and a clean console → `CHANGELOG.md` entry under
`[Unreleased]` with the *why* → regenerate `GAME_ATLAS.html` when content changes (update the
generator's hand-written mappings for new objects/species) → commit code + changelog + atlas
together, push to master. Cut a versioned release (VERSION bump, in-game CHANGELOG array, tag,
atlas snapshot) per phase or per coherent pair, per `AGENTS.md` §5–6.
