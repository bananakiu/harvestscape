# HarvestScape — Change Log

> **This is the single, internal source of truth for every change to the game.**
> There is intentionally no separate public-facing log — this one covers everything:
> features, balance tweaks, bug fixes, UX polish, and the *design decisions* behind them.
>
> **Why this exists:** to be a complete audit trail of what we changed and *why*, so the
> whole game can be handed to another AI agent later and rebuilt — possibly in a different
> engine or a different direction — with full knowledge of the reasoning that shaped it.
> A one-line "fixed lighting" is useless for that; every entry should say **what** changed
> and **why** it was the right call.
>
> **Conventions**
> - Newest first. Group each batch under a dated heading; note the commit once known.
> - Prefer *why over what*. The diff already records what; this records intent.
> - `Added` / `Changed` / `Fixed` / `Design` / `Balance` sub-headings as useful.
> - Update this file in the *same* change as the code, then commit and push (see `AGENTS.md`).
> - **Versioning.** Every release has a semver `name` and a monotonic integer `code` (bump the
>   code each release), defined in `VERSION` (`game/js/01-data.js`). Mirror the release into the
>   in-game `CHANGELOG` array (same file, player-readable) and tag the commit `git tag v<name>`.
>   Keep `VERSION`, the in-game `CHANGELOG` array, and this file in lockstep.

---

## XP orbs — a rail of them, at top-center · 2026-07-13

Unversioned follow-up to the XP orb (`f8b028d`, released in v2.9.0), from direct owner feedback:
*"If you manage to gain several levels in several XP and different skills, those orbs should show
side by side. Maybe it's good to have it all the way at the top, like in RuneScape, not off to the
middle center left. It's weird."* Fold into the next release's player-facing notes.

### Changed
- **One orb per skill, side by side.** The single mutually-exclusive orb (training a second skill
  *stole* the orb from the first — the exact case the owner hit: catch a fish, cook it, chop home)
  is now a rail: `_xpOrbs` Map keyed by skill, each entry owning its element/canvas/badge/arc state
  and its own 3.2s fade timer, all driven by ONE shared rAF loop that starts when the first orb
  appears and cancels when the last is removed. Orbs join the rail in the order you train.
- **Rail docked top-center** (`#xpOrbs`, flex row, `left:50%` translate) — the RS placement, and
  the one strip this HUD keeps deliberately clear (clock left, gold right — the v2.5.1 de-nag freed
  it). The old spot ("right of the energy bar") read as *"off to the middle center left — weird"*:
  it sat inside the vitals cluster but anchored to nothing the eye tracks. Since the rail is
  transient (only while training), it doesn't violate the empty-top-center principle (§8.4) the
  way the old permanent event pill did.
- Per-orb everything preserved: ease-toward-fraction, level-up sweep→flash→reset with badge bump,
  and the hide guard that postpones fading while that orb's sweep/flash is in flight — now checked
  per skill, so one skill's fade never waits on another's level-up.
- Cross-session note: the rail's `index.html` half rode into `3bd2ab9` (v2.9.1) via the parallel
  session's sweep, briefly leaving HEAD with a rail div but single-orb JS (orbs silently inert —
  `$("xpOrb")` finds nothing, no crash). This commit lands the JS/CSS half and closes the gap.

*Verified in a sandbox build (the live tree had the parallel session's mid-edit `13-content.js`
throwing at load — sandbox = working tree + that session's two files at HEAD, served separately):
three orbs (Wc 7 / Fi 4 / Ck 3) railed side by side at top-center, Fishing's 4→5 sweep + badge
bump ran while Woodcutting sat untouched, Cooking faded independently, console clean.*

## v2.9.1 — "The Deep Grove" · 2026-07-12 · tag `v2.9.1`

Version code **34**. Pillar 2 of [ECONOMY_REBALANCE.md](ECONOMY_REBALANCE.md): woodcutting's mine.
The owner: *"you just run out of trees… there's no procedurally generated forest — the equivalent
of a mine where you could cut trees and gain resources."* The farm's ~44 trees (+5/night regrowth)
were a puddle next to the mine's infinite ore; pillar 3's wood-hungry tool costs need a real supply.

### Added
- **The Deep Grove** (`genGrove`, `13-content.js` + `MAPS` entry): a 44×30 forest map through the
  farm's western treeline (footpath + auto-warp + sign carved after the farm's tree scatter so
  nothing can seal it). ~370 trees regenerating **daily** via the existing `mapCache` — the same
  renewal rule as the mine, no new persistence. A worn path leads to a clearing with a campfire
  (cook your forage; the light is company), berrybushes along the way, coast-style impassable
  border with an east-gate exit.
- **Age bands, not level walls:** near the gate it's mostly young oak (72%); the middle wood turns
  pine-heavy; the old deep grove is ~75% pine/maple. Your WC level (pine 8, maple 18) decides how
  much of the forest is really *yours* yet — the venue is generous, the skill still gates the
  yield. Zero new sprites or systems: trees, paths, signs, forage all reuse existing pieces.
- First-visit hint for new players (`tip_grove`, NPX saves only).

*Verified live: farm warp + clear path; grove generated 179 oak / 119 pine / 78 maple + forage +
campfire; exit warp back; overnight regrowth confirmed (chop → clearMapCache → tree back); forest
screenshot reads dense-but-walkable; console clean. Atlas regenerated (now 10 maps).*

## v2.9.0 — "The Old Lift" · 2026-07-12 · tag `v2.9.0`

Version code **33**. Pillar 1 of the economy rebalance ([ECONOMY_REBALANCE.md](ECONOMY_REBALANCE.md),
from the owner's second playtest — see DEVLOG): the mine's QoL debt. This release also **cuts the
XP orb** (below, committed unversioned by the parallel UI session) into a player release.

### Added
- **The Old Lift** — a rusted lift cage stands beside the entry ladder of *every* mine floor
  (`genMine`, protected from ore-scatter and prop-sealing like the ladders). Interacting opens the
  lift panel (`renderLift`, `10-ui.js`):
  - **Riding UP is always free** — "the counterweight still works; the stops are what rusted."
    Surface from any floor in one action. The owner's "climbing 10 flights isn't economical" is gone.
  - **Every 5th floor has a restorable stop**: a one-time, permanent resource dump
    (`liftStopCost`, `01-data.js` — wood + ore + gold scaling with depth; floor 20 wants a Diamond)
    unlocks riding *down* to it forever (`state.liftStops`, saved immediately on restore).
    **Why resources, not just gold:** the costs sink wood + ore + coin together — the multi-skill
    economy (pillar 3) arriving early, and gems' first non-sell use.
  - Replaces the old **invisible** "cart checkpoint" (silent best-depth banking on entry, which the
    owner never perceived — a lesson in visible mechanics). `enterMine` now always starts at
    floor 1; `mineCheckpoint()` removed.
- **Time stands still underground** (`updateTime`, `08-actions.js`) — the Harvest Moon rule. Getting
  yanked to bed mid-vein was the playtest's least satisfying moment. Energy still drains per swing;
  that's the mine's honest limiter. (The clock resumes the moment you surface.)

### Audit note
The parallel UI session's XP-orb commit (`f8b028d`) inadvertently swept up this release's two
in-flight `08-actions.js` edits (the time-freeze and the lift interact case) — so those two changes
physically live in that commit, not this one. Documented here so the trail stays honest.

*Verified live end-to-end: lift present on floors 1 and 5 (and un-stompable by ore/prop scatter);
time frozen across 100 updateTime ticks in the mine, flowing on the farm; restore consumed exactly
500g + 20 Wood + 5 Copper Ore and persisted stop 5; floor 1's panel then offered the ride down;
panel screenshot verified; console clean. Atlas regenerated per the new standing rule.*

## The Game Atlas — the whole game on one page, generated from the data · 2026-07-12

Docs/tooling only; no game code changed. Owner's ask (DEVLOG, same date): a poster/HTML "game
kit" showing the expanse of the finished game — every mission, unlock, map, and person, "almost
like an instruction manual" — so reviewing the design no longer requires a playthrough.

### Added
- **`GAME_ATLAS.html`** — a single self-contained page: the story spine (all quests in order
  with objectives, rewards, and turn-in scripts), all six letters and nine almanac pages
  (spoiler-folded), the Nine Crafts and how each lights, the full XP curve and per-skill unlock
  ladders with mastery perks, every map and how it's reached, all six NPCs with gift tastes and
  full heart-scene scripts, courtship/marriage, the calendar/weather tables, the economy
  (crops/orchard/animals/Hunt/gems/recipes/tools/projects/demand), and a 100% checklist.
- **`tools/build-atlas.mjs`** — the generator. **Why a generator, not a document:** a
  hand-written atlas would drift from the build within one release. The script evaluates the
  *live* data files (`00-core`, `01-data`, `04-world`, `13-content`, `14-story`, `11-title`) in
  a node vm with browser stubs and renders the page from what it finds, so numbers, quests, and
  scripts are always the shipped ones. The three hand-written mappings it does contain (wing
  requirements, almanac triggers, map access notes) are assertion-guarded: if the underlying
  data changes shape, generation **throws** instead of publishing stale prose. Regenerate with
  `node tools/build-atlas.mjs` after any content change.
- Design note: dropped a `backdrop-filter` on the sticky nav — it broke headless/pane
  screenshot compositing (captured black) and a solid bar reads identically.

## XP orb — RuneScape-style level-progress ring · 2026-07-12

Unversioned feature commit (a parallel agent session is mid-flight on a large batch; leaving the
release cut — VERSION bump + in-game `CHANGELOG` mirror — to whoever cuts next, to avoid another
version-code race). **Fold this into the next release's player-facing notes.**

### Added
- **The XP orb** (`#xpOrb`, `10-ui.js` / `index.html` / `style.css`; fired from `addXP`,
  `08-actions.js`). Owner feedback, with an OSRS screenshot: *"While I'm leveling up skills, it's
  unsatisfying because I don't know the progression of my level… a progress bar of sorts…
  RuneScape does this… and an indicator for what level you are at as well."* The `+12 farm`
  floaters answer *what you earned* but never *how far along you are* — grinding poured XP into
  the dark between panel-checks. The orb is RS's hover-orb adopted into the house identity: a
  circular ring docked right of the energy bar (part of the vitals row, like RS's status globes),
  gold arc clockwise from 12 o'clock = fraction through the CURRENT level, the skill's procedural
  icon (`SKILL_ICON`/`spr`) pixel-crisp in the middle, current level in a wood-bevel badge below.
- **Behaviour:** appears on any XP gain and *eases* its arc toward the new fraction (watching it
  creep is the satisfaction); on a level-up it sweeps to full, blooms, then resets to the new
  level's remainder while the badge bumps to the new number. Fades ~3.2s after the last gain —
  training-time feedback only, never permanent HUD chrome (design bible §8.4). A hide guard
  postpones the fade while a sweep/flash is in flight so the level-up payoff is never cut off
  (found via throttled-rAF testing: wall-clock hide vs frame-driven sweep can race).
- **Rendering:** 96×96 canvas CSS-sized in em (smooth vector arc at any stage scale, dpr-friendly),
  icon drawn 3× with smoothing off; colours are the blessed roles only (gold arc `#ffce5a→#ffe6a0`,
  wood-dark disc/track, `--gold` badge). Self-driven rAF loop that starts on show and cancels on
  hide — zero cost while the orb is hidden.

Verified in-browser: orb appears beside the energy bar on gain, arc matches `xpFrac` (31.6% at
Wc 8 mid-level), level-cross 4→5 sweeps + badge-bumps to 5, orb outlives the old 3.2s cutoff while
sweeping, console clean.

## v2.8.2 — "Turned Earth" · 2026-07-12 · tag `v2.8.2`

Version code **32**. Polish batch 2. The starter plot was the survey's biggest sprite offender:
`tilled` drew full-width straight bands inside a 1px frame, so a bed of it read as **dark lumber
decking** — a brand-new player literally couldn't tell their field was soil (it looked like a
structure). Redrawn (`03-art.js`): broken/notched furrow shadows, sunlit ridge crests, scattered
clods, no frame. `watered` uses the *same* furrow layout, darkened with wet glints — watering
darkens the earth, it doesn't rearrange it. Verified with a demo bed of tilled/watered/planted
rows: reads as turned earth at a glance.

## v2.8.1 — "Lamplight" · 2026-07-12 · tag `v2.8.1`

Version code **31**. First batch of the owner's "make it just nice" polish mandate (DEVLOG
2026-07-12) — driven by a full visual survey of every surface (farm day/night, town, store, mine,
beach, panels), fixing the roughest findings, each verified by screenshot.

### Added
- **Procedural windows on every building** (`isWindowTile`, `07-entities.js`). Windows were a
  hardcoded two-tile set on the cottage; every other building in the valley was a blank-faced
  crate you couldn't tell apart. Now any upper-facade WALL tile gets a window on a fixed spacing —
  and the spacing rule `(x·5+y·3)%3===0` reproduces the cottage's original two windows *exactly*,
  so nothing moved. **At night they all glow**: `collectLights` (`06-weather.js`) scans for window
  tiles and gives each a small warm pool, replacing the two hardcoded cottage lights. The night
  town went from a dark silhouette to a village with people inside. (13 windows on the farm map.)
- **A real shoreline** (`drawSandDressing`/`drawWaterFoam`, `07-entities.js`). The coast met the
  grass and the sea in hard 90° tile edges. Now: a damp sand band + dark waterline where sand
  touches water, broken foam dashes on the water side (two-phase drift, skipped under winter ice),
  and season-tinted grass tufts creeping onto the sand. All deterministic in (x,y) — no shimmer.

### Fixed
- **Controls hint clipped off-screen on short viewports.** `#stage` could take 94dvh, pushing the
  two-line hint below the fold where centered flex clipped it mid-glyph. The stage now reserves
  hint room (`max-height: calc(100dvh − 92px)`); under 520px tall the hint hides and the game gets
  the space back (matching the existing narrow-width rule).
- **Skills panel described the old curve** ("A real RuneScape XP curve — 92 is halfway to 99") —
  false since v2.7, doubly so after v2.8. Rewritten for the repaced curve.

## v2.8.0 — "Earned" · 2026-07-12 · tag `v2.8.0`

Version code **30**. Third calibration of the XP curve, from the owner's playtest of v2.7 (see
[DEVLOG.md](DEVLOG.md) 2026-07-12): *"a little too rewarding in the beginning… slower levels in the
beginning could be useful… the first few levels won't just feel like junk levels… long progression…
a sort of mastery award in the end."* v2.7 optimized for "gentler than RS everywhere," which made
the opening trivial (a level every 1–3 actions to L10) — it fixed the late-game wall but cheapened
the start. The design goal is **pacing**, not gentleness: roughly even reward density across the
whole journey.

### Changed — the XP curve (`XP_TABLE`, `00-core.js`)
- **New shape:** `inc(L) = 62 + 1.00·(L−1)^2.18`, completionist steepening only on 95–99
  (`×(1 + 0.28·(L−94))`). Tuned in Node with era-adjusted action costs (early actions ≈ 12–26 XP,
  mid ≈ 45, late ≈ 95):
  - **Earned early levels:** L2 ≈ 3–4 actions (was ~1), L5 ≈ 4–5 per level, L10 ≈ 10 per level —
    the first levels are noticed, not skipped past.
  - **Long, steady middle:** ~24 actions/level at 25, ~70 at 50, ~145 at 80 — smooth stretch,
    no wall.
  - **Mastery award:** only 95–99 steepen; the final level alone ≈ 550 actions; 90→99 ≈ 35% of the
    total. L99 ≈ 782k XP — 1.3× v2.7's climb, still ~17× gentler than RS's 13M.
- **Level-preserving migration** (`migrateSave`, `11-title.js` + `xpCurve` save field): slower early
  thresholds would otherwise *demote* existing saves — the cozy contract forbids it. Stored XP is
  translated from the v2.7 table (kept as `XP_TABLE_V27` in `00-core.js`, used nowhere else) onto
  the new table, preserving level AND fractional progress. The conversion runs **before**
  `migrateSave`'s generic backfill — placed after it, the freshState `xpCurve:3` stamp would make
  the check dead code (the exact v2.6.1 Collection-seeding trap). Because levels are preserved
  exactly, no level banners or mastery praise can spuriously fire.

*Verified: Node sweep of 548 XP values across the full range — zero level mismatches, boundaries
exact, L99 caps; live-browser check confirms the runtime table and a real `migrateSave` call
(Cooking 25→25, Farming 10→10, XP translated to the precise new thresholds).*

## v2.7.0 — "A Fair Climb" · 2026-07-11 · tag `v2.7.0`

Version code **29**. Replaced RuneScape's XP curve with our own, per the owner's call: *"we don't
need to strictly follow RuneScape's — it's a little too grindy and punishing. Rewarding, the right
amount, a feeling of progression that gets harder over time, nothing absurd except maybe the last
part for completionists."*

### Changed — the XP curve (`XP_TABLE`, `00-core.js`)
- **Out:** the RS formula ÷4 — cost doubles every ~7 levels, so **99 = ~13,000,000 XP** and the back
  half is ~130× the first. That's the "grindy and punishing" the owner flagged.
- **In:** a smooth power ramp `inc(L) = 26 + 0.30·(L−1)^2.4`, with a light completionist steepening on
  the final four levels (`×(1 + 0.30·(L−95))` for L ≥ 96). Properties, all Node-verified against the
  real file:
  - **Gentler than RS at *every* level** (new ÷ old ranges 0.04–0.67) — it is never grindier than the
    old curve anywhere, and far gentler late.
  - **Rewarding early:** a level every ~1–3 actions through L10, ~25 actions to L15.
  - **A real middle:** ~117 actions to L25 (first mastery), ~1,160 to L50.
  - **Steadily harder, gentle overall:** **L99 ≈ 584k XP (~22× gentler than RS)**; `ratio L99/L50 ≈
    10×` (RS was 129×); 90→99 is ~a third of the total climb, not half.
  - **Completionist tail, not a wall:** only 96–99 get the bump (L99's single level ≈ 880 actions);
    the ramp into it is smooth, not a brick.
- **Existing saves:** because every threshold is ≤ the old one, a veteran's stored XP now reads as a
  **higher** level (e.g. old-L50 XP → L60, old-L30 → L33) — levels only rise or hold, never fall, so
  it's a one-time gift, not a loss (the cozy contract). No retroactive banner spam: leveling is
  computed lazily via `levelFor`, and the next `addXP` sees the new level as its "before".
- Everything downstream is derived (`levelFor`, `xpForLevel`, `skillLvl`, mastery, content gates,
  `totalLevel`) — no hardcoded thresholds, so the whole progression layer just tracks the new curve.

*Verification: the XP table is math with no visual surface, so it's Node-verified end-to-end (the real
file's table reproduced and asserted: monotonic, `L50=52233`, `L99=584240`, clamps at 99, veteran-XP
maps upward). No browser needed; the skills panel renders the new thresholds automatically.*

## v2.6.1 — "Second Look" · 2026-07-11 · tag `v2.6.1`

Version code **28**. Fixes for **all four findings** from an adversarial regression review of this
session's six releases (a workflow: 5 dimension auditors → per-finding independent verifiers;
4 reported, 4 confirmed, 0 refuted). A runtime smoke test independently caught the first.

### Fixed
- **Collection seeding for old saves was dead code** (`migrateSave`, `11-title.js`). `freshState()`
  now returns a non-empty default `discovered` (2 starter items), so the generic
  `for(const k in f)` backfill set `s.discovered` *before* the `if(!s.discovered){…}` seeding block —
  which then saw a truthy object and skipped. Veteran saves showed only 2 items in the Collection.
  Fixed by folding the inv/legend seeding into the `npxGame === undefined` (pre-existing-save) branch
  so it **merges** into the defaulted object. Node-verified: a mock old save now seeds inventory +
  caught legends, leaves uncaught legends locked, keeps NPX suppressed.
- **The "Skip intro" button was invisible and unclickable** (`startPrologue`, `11-title.js`). It's a
  `.mbtn` inside `#letter`, which CSS renders `visibility:hidden` until it also has `.show` — the code
  only removed `hidden` (clears `display:none`), never added `.show`. So the advertised escape hatch
  was present-but-invisible the whole prologue (my earlier test "passed" only because `.click()`
  bypasses visibility). Now adds/removes `.show` alongside `hidden`.
- **The day-one arrival + Act banner were lost on a mid-scene reload** (`startIntro`/`maybeArrival`).
  `saveGame()` ran *before* `maybeArrival` set `arrivalSeen`, and the cutscene never persisted it, so a
  reload during Maya's greeting dropped the scene forever (continueGame never replayed it). Now
  `arrivalSeen` is set + saved **at the end** of the scene, and `continueGame` replays the arrival if a
  new-player day-1 save reloaded before it finished.
- **The Collection listed "Wool", which has no source** (`MUSEUM`, `10-ui.js`) — no sheep, no shear,
  no `give("Wool")` anywhere — so its cell could never unlock and 100% completion was impossible.
  Removed Wool from the "Farm & Forage" section (the item/sprite/examine stay, harmless, for a future
  sheep).

Verification note: the migrateSave fix is Node-verified; the other three are CSS/logic-verified (the
browser preview was asleep overnight, so no screenshots — the mechanisms are simple and deterministic).

## v2.6.0 — "Journeyman" · 2026-07-11 · tag `v2.6.0`

Version code **27**. The scorecard's standing priority #2 — "pay out the other four curves." Two of
the flagged gaps closed: Cooking's empty progression and the total absence of milestone recognition.

### Added
- **Cooking is now a real 1→40 curve.** Every recipe carries a `lvl` (`RECIPES`, `01-data.js`) and
  unlocks as your Cooking level climbs — Fried Egg/Baked Potato at 1, up through Fish Stew (32),
  Cranberry Sauce (36), Frostbloom Tea (40). `cookRecipe()` refuses a too-high recipe; the Kitchen
  shows locked ones as "🔒 learned at Cooking N"; grilling raw fish stays ungated as the entry-level
  trainer. **Why:** the scorecard's "Cooking has zero gated recipes" — it unlocked *nothing*, so the
  skill was a flat grind. Now `nextUnlock("Cooking")` returns the next dish, so the skills panel and
  level-up banner point somewhere (they returned `null` for Cooking before).
- **The valley notices your mastery.** Crossing a mastery tier (25/50/75/99) in any skill now draws a
  warm one-line toast from the neighbour who cares most about that craft — Maya (Farming), Tom
  (Woodcutting), Rowan (Mining), Bram (Fishing), Pip (Cooking) — each in their established voice
  (`MASTERY_NPC` / `MASTERY_PRAISE`, `01-data.js`; `masteryPraise()` fired from `addXP` on the
  crossing, a beat after the level banner). **Why:** the scorecard's "zero NPC recognition of
  milestones" — the 1–99 grind passed every mastery in silence. Fires once, naturally, as you cross.

### Fixed
- **Skills-panel XP bars were rendering empty** — as bare inline `<span>`s the fill ignored
  width/height and collapsed to 0×0, so only the black track showed. Made `.xpbarWrap`/`.xpbar`
  `display:block` with a small min-width (working-tree fix, folded in here since it's the same
  skills surface this release makes point somewhere).

Verified in-browser: at Cooking 1, 11 of 13 recipes show locked with their level; `nextUnlock`
returns Bread@3; crossing Cooking 24→25 shows the mastery banner *and* Pip's praise toast; console
clean. Tagged `v2.6.0`.

## v2.5.1 — "Homely" · 2026-07-11 · tag `v2.5.1`

Version code **26**. A cozy-contract UI polish pass that landed in the working tree (HUD, event
cue, energy, pickup, touch) — versioned and documented here so the audit trail stays complete.

### Changed
- **The event pill stops nagging.** It used to show anything within 7 days — but across a 112-day
  year of festivals + anniversary + five birthdays, *something* was almost always inside that
  window, so the cue read as permanent top-bar chrome (the "badge/nagging" the design bible §8.4
  forbids). Now it appears only on the day itself or its eve; the full calendar still lives in the
  Almanac, and the day/eve nudge is surfaced once, warmly, on the evening **sleep card** instead.
  The clock + pill were regrouped into a left `#hudTopLeft` cluster so the pill never claims center.
- **Low energy warms, never reddens.** The energy bar now runs green → gold → deep amber instead of
  green → gold → survival-red. Energy is deliberately non-hazardous (you can always eat or sleep),
  so "low" must not read as a danger alarm aimed at the player (Cozy Contract + palette §8.1) — the
  narrowing bar already says "low"; only the tone deepens.
- **Pickup notices show the running total** you now hold of each item (read straight from
  `state.inv`), the way Stardew shows a stack size — small and dim on the right so it never competes
  with the `+N` gain.

### Added
- **Touch examine.** A 🔍 button in the touch controls calls `examine()` — touch parity for the
  Q/X look verb from v2.3, so the examine feature works on phones too. (Examine's primary key is now
  **Q**, WASD-native; X stays as an alias.)

## v2.5.0 — "The Collection" · 2026-07-11 · tag `v2.5.0`

Version code **25**. A discovery museum — the completionism the scorecard's Psychology dimension
asked for ("log covers 5 items; crops/gems/dishes still unlogged"). Pairs with v2.3's examine text.

### Added
- **The Collection**, a collapsible museum in the Journal (`renderMuseum()`, `10-ui.js`): nine
  sections (Crops, Orchard, Fish, Legends, Gems, Shore, Farm & Forage, Kitchen, Materials, 64
  entries) drawn from the existing data tables. Discovered entries show their pixel icon, name, and
  examine line on hover; undiscovered show a `?` silhouette. A `X/64 discovered` counter in the
  summary.
- **Discovery tracking.** `state.discovered` (new save field) is stamped by a one-line `discover()`
  in `give()` — everything you ever hold is remembered, even after you sell it. `migrateSave` seeds
  it from an existing save's inventory + caught legends, so returning players don't start empty;
  new games seed the two starting items.

Verified in-browser: giving 12 varied items lights their cells (13/64), icons hydrate, locked cells
show silhouettes. Console clean. Tagged `v2.5.0`.

## v2.4.0 — "With Feeling" · 2026-07-11 · tag `v2.4.0`

Version code **24**. A game-feel pass that finally wires the dormant tween system (the scorecard's
Juice grade sat at **B** with the tween registry having *no call sites*, "two audits running").

### Added / Changed
- **Gold count-up.** The gold pill eases toward its true value each frame (`syncGold()` in
  `10-ui.js`, driven by a tween on `goldUI.shown`) and pulses — `earn` (scale-up + brighten) or
  `spend` (dip) — so a 400g sale reads as a little count-up, not a silent number swap. Added
  `retween()` (`00-core.js`) so a sale mid-count restarts cleanly instead of two tweens fighting.
- **Item-pop flourish.** `pItemPop` now arcs gently (lower gravity, a beat of apex hang) and the
  icon **scale-pops** in `drawParticles` (0.3 → 1.25 → 1.0 on an ease) — the "gotcha" juice the
  scorecard asked for, on every harvest/mine/forage.
- **A bespoke legendary-catch fanfare** (`SFX.legend`, `02-audio.js`): a rising seven-note flourish
  over a low sustained fifth — grander and longer than a level-up, which the legend catch used to
  borrow. Landing a legend now also throws the **trophy in an apex pop**, and its screen shake is
  **contained** (3 → 2), fixing the scorecard's "exceeds the shake budget" note.

Audio note: the other P4 items (rain/storm music ducking, ±10% tool detune via `dj`) were already
in place from v2.1 — verified, not re-done. Verified in-browser: gold eases both directions with
the right pulse, `retween` leaves one clean tween, console clean. Tagged `v2.4.0`.

## v2.3.0 — "A Word on Everything" · 2026-07-11 · tag `v2.3.0`

Version code **23**. Examine text — the scorecard's most-repeated free win ("the #1 free channel,
two audits running"). RuneScape's oldest joy, adapted to the cozy voice.

### Added
- **Press X to examine.** A `examineFacing()` resolver (`08-actions.js`) reads whatever you face —
  crop (with a growth line if unripe), NPC, object, or tile — and shows a one-line flavour readout
  in a calm parchment bar (`#examineBar`, `showExamine()` in `10-ui.js`) that fades on its own.
  Objects resolve through named lookups (ore veins, trees, fruit trees, ladders, the mine mouth,
  the sealed vault) with a title map + graceful fallback, so nothing examinable comes up blank.
- **The Backpack is now a museum.** Every item shows its examine line beneath its name — the
  collection flavour the Psychology dimension asked for, at the point you already look.
- **129 hand-tuned flavour lines** (`EXAMINE` / `EXAMINE_OBJ` / `EXAMINE_NPC` / `EXAMINE_TILE`,
  `01-data.js`): 86 items, 27 objects, 6 neighbours, 10 tiles. *How they were written:* a
  parallel multi-agent workflow drafted each category in the game's voice (Tom's huckster cheer,
  Bram's deadpan, Maya's warmth), then a single tone-editor pass unified voice, length, and lore —
  then hand-checked against the item tables so every key matches.

Controls hint updated (`Examine X`). Verified in-browser: X on grass/ore/tree/NPC, the readout
bar, and the per-item Backpack lines all render; console clean. Desktop verb for now — a touch
affordance can follow. Tagged `v2.3.0`; `master` per the standing workflow.

## v2.2.0 — "First Light" · 2026-07-11 · tag `v2.2.0`

Version code **22**. The New Player Experience beta — the fix for the owner's first playtest
verdict (see [DEVLOG.md](DEVLOG.md), 2026-07-11): *fun core, cold open.* Built to the plan in
[NEW_PLAYER_EXPERIENCE.md](NEW_PLAYER_EXPERIENCE.md). **Almost no new story — this re-paces and
re-surfaces what already existed.** Every beat is skippable, and none of it touches a pre-existing
save (gated on `state.flags.npxGame`, set only at new-game start; `migrateSave` marks old saves
`npxGame:false, arrivalSeen:true` so nothing fires for them).

### Added — A. Exposition (`11-title.js`, `14-story.js`)
- **A three-card prologue before the letter.** Narration over a darkened title scene — the valley
  as it was, the quiet years, the inheritance — establishing the premise the game never stated.
  Fully skippable (a persistent "Skip intro ⏭" jumps straight to the letter). *Why cards, not a
  cutscene:* pre-`beginPlay` there is no `curMap` for actors, so this reuses the letter/typewriter
  UI with a `.prologue` dark style — zero new engine work, per the plan's non-goals.
- **Grandpa's letter now names the mission.** One added paragraph: the Guild of Nine Crafts went
  dark, the Grand Festival died, and waking the valley is what he's leaving you. The premise used
  to first appear at quest #4 (Rowan), easily skimmed; now it's in minute one.
- **A day-one arrival scene.** Maya walks up at the farm the moment you take control, welcomes
  you, names Willowbrook and Elder Rowan ("go and hear him out"), and points at the plot —
  planting quest #4's premise in minute two without moving the quest. Reuses the existing cutscene
  engine (`startCutscene` say/move steps). Then an **Act I banner** names the goal.

### Added — B. Tutorial (`08-actions.js`, `12-game.js`, `10-ui.js`, `01-data.js`)
- **Contextual first-verb hints.** `tutoringTick()` (run each frame in free play) shows a one-time
  hint the moment you're first positioned to use a verb — face bare soil with the Hoe → "press
  SPACE to till"; face water with the Rod → "cast your line"; etc. Never on a timer, never twice
  (`state.flags.hint_*`), never on an old save.
- **First-encounter tips** — first rain, first mine floor, first noticeboard read — one sentence at
  the moment of relevance, carrying the load the title-screen prose dump used to.
- **How to Play moved in-world.** The reference text is now one shared `HOWTO_TEXT` constant
  (`01-data.js`) rendered both on the title *and* inside the Journal (a collapsible section), where
  a playing player can actually consult it.

### Added — C. Story visibility (`09-quests.js`, `10-ui.js`, `11-title.js`)
- **Act-aware tracker & journal.** `actInfo()` derives the act from `questIdx` (Act I through the
  finale, Act II after). The quest tracker shows the act label; the Journal groups quests under
  "Act I — The Quiet Valley" / "Act II — The Empty Chair", and reveals the finale ("Wake the
  Valley") *greyed, early*, as the destination — so the player always sees where the chain leads.
- **"Story so far" on Continue.** A returning player gets one line naming their act and next step
  ("Act I — The Quiet Valley · Report to …"), re-entering the arc, not just the sandbox.

Verified on a fresh save in-browser: prologue → mission letter → Maya arrival → Act I banner →
contextual till hint → act-grouped Journal with the finale shown as the destination. Console clean.
Old saves skip all of it. `master` per the standing workflow; tagged `v2.2.0`.

## Docs — playtest feedback loop + NPX plan · 2026-07-11

No game code changed. First owner playtest verdict after v2.1.0: the core loop is fun, but a
casual player never learns the game's premise or mission — no exposition, no in-game tutorial,
and the two-act storyline doesn't surface during normal play. The story *content* already
exists (letters, quest spine, finale); the gap is pacing and surfacing.

- **Added `DEVLOG.md`** — a developer log for the owner's playtest feedback and direction
  calls, recorded near-verbatim. **Why a separate file:** `CHANGELOG.md` records implementation
  decisions; the raw human signal that *caused* them was previously lost to chat history. A
  future agent should be able to re-derive our decisions from the owner's actual words.
- **Added `NEW_PLAYER_EXPERIENCE.md`** — the planned (deliberately not yet built) onboarding
  beta: (A) a skippable three-beat prologue + revised Grandpa letter that states the mission,
  (B) contextual first-verb hints and first-encounter tips replacing the title-screen prose
  dump, (C) act-aware tracker/journal so the storyline shows through mid-game. Constraints
  locked in the doc: everything skippable (cozy contract), no new engine work, save-compatible
  via `migrateSave` flags. **Why plan-first:** owner's explicit call — beta scope now,
  cutscene polish deferred to the roadmap until the core game is further along.
- `README.md` / `AGENTS.md` reference-doc lists updated to match (standing rule: docs move
  in the same change).

## v2.1.0 — "Clear Skies" · 2026-07-11 · tag `v2.1.0`

Version code **21**. A readability & release-infrastructure release — the night and mine now
read clearly, in-game text is crisp, and the project gained real version codes plus an in-game
changelog. The sub-sections below fold in work that was drafted separately.

### Added — versioning & in-game change log
- **Version codes + an in-game "What's New" panel.** Single source of truth
  `VERSION = { name:"2.1.0", code:21, codename:"Clear Skies", date }` in `game/js/01-data.js`,
  shown on the title footer (clickable) and in Settings. A `CHANGELOG` array — the
  player-readable mirror of this file — renders in a new `#newsPanel`, with a one-time
  auto-popup when a returning player opens a build newer than they last saw (`hs_seen_version`
  in localStorage, gated by `VERSION.code`). **Why:** players should see what changed, and
  every push now carries a version code + git tag, anchoring this audit trail to concrete
  releases. Keep `VERSION`, the in-game `CHANGELOG` array, and this file in lockstep.

### Project & agent infrastructure
- **Loosened the commit/push rule to standing pre-approval.** The old rule 4 hedged — "only
  commit/push when it won't surprise the user, or when they've asked you to" — which made
  agents pile up uncommitted work waiting for a go-ahead. The owner has now given **standing
  approval to commit and push freely**, directly to `master`, without pausing to ask.
  **Why:** everything here is versioned and reversible (`git revert`/`git reset`), so the
  cost of an unwanted commit is trivial while the cost of an uncommitted working tree — lost
  audit-trail granularity — is real. The one hard invariant is unchanged: the `CHANGELOG.md`
  entry ships in the same commit as the code. Updated in `AGENTS.md` so every agent inherits
  the new default.

- **Made the AI-agent instruction setup tool-agnostic.** Previously the only guide was
  `CLAUDE.md`, which meant any non-Claude agent (Gemini CLI, Cursor, Copilot, Cline,
  Windsurf, Codex) would either get *no* project instructions or need a divergent copy —
  a silent way for a future rebuild agent to miss the standing rules (changelog discipline,
  the cozy no-combat contract, the load-order constraints). **Why this way:** rather than
  maintain N parallel files that drift, there is now **one canonical `AGENTS.md`** (the
  neutral cross-tool standard) and every tool's expected filename is a **symlink** to it —
  `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.clinerules`, `.windsurfrules`, and
  `.github/copilot-instructions.md`. Single source of truth, zero drift, every agent reads
  identical guidance. `CLAUDE.md`'s content moved verbatim into `AGENTS.md` (nothing
  dropped); added a "Cross-agent setup" section (symlink map + how to onboard a new tool),
  a Windows/`core.symlinks` caveat, a "keep the README current" rule, and a skills
  placeholder for when `.claude/skills/` is added.

### Changed — lighting & readability

Player-facing complaints about visibility, resolved with the Stardew philosophy that a
cozy night should be *readably dim*, not black-with-a-spotlight.

- **Night lighting overhaul (glare → clarity).** The surface at night was near-black
  (ambient `#11163a`, ~9% brightness) with the player emitting a big cold-blue additive
  "searchlight" (`200,215,255`, r52) that bloomed into glare over the void. Three fixes,
  all in `game/js/06-weather.js` `drawLighting`/`collectLights`:
  1. **Lifted the night ambient floor** toward moonlit blue `#464c6a`, scaled by
     `nightFactor` so dusk eases in gently. The whole valley is now dimly readable — soil
     rows, fences, trees all visible — which also removes the extreme contrast that made
     any light look like a harsh spotlight. *This is the real clarity win.* Outdoor-only.
  2. **Turned the player's surface light into a warm lantern aura** (`255,226,178`, r42,
     i0.55) instead of a cold blue searchlight. Reads as "carrying a lantern," not glare.
  3. **Reshaped the light gradient** (3 stops → 4: softer `0.44` core, fuller `0.34` mid,
     quicker tail) so lights are *defined pools* that don't white out detail underneath.
     Applied globally; verified it did not dim the mine or interiors.
- **Mine lighting (was too dark to play).** Ambient `#39344a`→`#5b5568`, vignette eased
  to `0.18` underground, player torch radius `68`→`98`. Ore/crystals/gems are now legible
  while the far corners stay dark and atmospheric. *Design intent: dim but readable — you
  can always see the ore you came down to swing at.*

### Added
- **High-fidelity text overlay** (`game/js/05-particles.js`, `#gtext` canvas in
  `index.html`). Floaters, prompts (`E`, `!`, ladder arrows), and name tags were drawn on
  the 320px internal canvas and upscaled ~4×, so all game text looked mushy. They now draw
  to a separate device-resolution overlay and render crisp, à la Stardew's high-fidelity
  UI text over pixel-art world. `queueText`/`flushText`/`syncTextLayer` API.
- **Pickup log** (`game/js/10-ui.js` `notePickup`, `#pickups` in `index.html`/CSS). A
  fading, roll-up notification in the corner when items are collected. *Why:* satisfying
  collection feedback, and it fixed the item-text/XP-text overlap (`+2 Wood` colliding with
  `+25 wood` into garbled `+252 woodd`). Item name moved out of the world floater into the
  log; floaters got anti-overlap nudging.

### Design
- **Design scorecard re-audit** (`DESIGN_SCORECARD.md`): re-graded the v2.0 build against
  `GAME_DESIGN_PRINCIPLES.md`, **B+ → A−**, reflecting the economy, depth, and story work
  that shipped since the original audit.

---

## v1.4 – v2.0 — "A Day Worth Living" · 2026-07-10 · commit `5e52483`

Three design iterations shipped together. Core problem diagnosed by a grounding pass that
measured the actual loop: **sleep-skip was the dominant strategy and starfruit was a
passive ~3,100g/day money printer** — the day had no reason to be *lived*. These features
give the day texture and make presence matter.

### v2.0 — systems that reward showing up
- **Tom's Demand (market saturation).** Selling many of one item the same day drives its
  price down (`DEMAND` decay/floor, value-scaled free allowance, overnight recovery). Kills
  the monocrop-printer; rewards diversified farming. *(Later retuned — see Scorecard P1.)*
- **Hoe tiers + honest snow.** Bigger hoes till in shapes; winter snow actually blocks
  tilling until cleared, so the season reads as a real constraint.
- **Forecast + the Day's Offering.** A readable weather forecast and a rotating daily
  request give a reason to plan tomorrow and check in today.
- **The Hunt.** Fishing gained *places, hours, and 5 legendary fish* with real conditions —
  turning fishing from a slot machine into an expedition. Capstone reward: Bram's Oilskin.
- **Orchard + Apiary.** Fruit trees and beehives: slow, permanent, tend-over-time income
  that rewards commitment to a plot rather than churn.

### v1.5 — the valley fills in (6 steps)
- Watering-can tiers + an economy/season balance patch.
- **Grandpa's Journal Pages** (9) — collectible lore that threads the story.
- **Village Noticeboard** — standing requests from townsfolk.
- **Mastery milestones** at skill 25/50/75/99 — payoff across the long 1–99 curve.
- **Rowan's Restoration Projects** — spend resources to restore the valley (the Ledger).

### v1.4 — audit fixes + Act Two story
- Fixes from three parallel code audits; synthesized design spec built out.
- **Act Two** narrative added (`game/js/14-story.js`, +864 lines): heart events, capstones.

### Fixed (in this commit)
- **Mine ladder softlock:** ~1.3% of floors walled off the down-ladder. Added BFS
  reachability repair + an approach guard in `genMine`.
- **Door-approach softlock:** permanent trees could wall off the cottage door. Added a
  `nearDoorway` guard and `digUp` (Axe removes trees/hives).
- **Lightning flash freeze:** `_flash` froze behind menus; now decays while paused/blocked,
  alpha capped low (a glimmer, never a whiteout).

---

## Scorecard fixes — 2026-07-10 (folded into `5e52483` / polish pass)

Implementing Fable 5's `DESIGN_SCORECARD.md` feedback, ranked P1–P6.
- **P1 — Retune Tom's Demand.** The first cut left a drip-seller at ~96% price and had an
  inverted comment. Fixed: value-scaled free allowance, overnight halving (drip → ~79%),
  floor `0.35`, blended sell-all pricing.
- **P2 — Show next unlock.** Skills panel now previews the next unlock at each level.
- **P3 — Bank mine depth + deepen ore.** Checkpoint every 5 floors; ore table richens with
  depth and drops stone past floor 6 — the mine feels like a descent, not a flat faucet.
- **P4 — Audio pass + lightning cap.** SFX polish; lightning alpha capped at `0.22`.
- **P5 — Gift first sapling.** Pip gifts the player their first fruit-tree sapling.
- **P6 — Crown the Hunt.** 5/5 legendary capstone rewards Bram's Oilskin (storm fishing).
- Also fixed in passing: missing `door` SFX (silent travel); `TOM_GLUT` `{item}` only
  replaced the first of two placeholders (→ global regex); fish above ~lvl 36 were
  mathematically uncatchable (`DIFF_MAX` hard-clamped to `1.20`).

---

## Design & reference docs

- **2026-07-10 · `97f2b8a`** — `DESIGN_SCORECARD.md`: Fable 5's audit of the build against
  the principles doc (original grade **B+**).
- **2026-07-10 · `3ad3a70`** — `GAME_DESIGN_PRINCIPLES.md`: the design bible — cozy
  contract, RuneScape-layer goals, tone rules. The yardstick every audit grades against.
- Also in-tree (uncommitted planning at various points): `DESIGN_V1.5.md`,
  `ROADMAP_V2.html`, `DESIGN_REVIEW.md`, `GAME_SCOPE.md`.

---

## v1.0 — Initial build · 2026-07-09 · commit `ec19013`

The whole game, from scratch, 100% procedural — no asset files of any kind.

### Architecture (load-bearing context for any future rebuild)
- **15 plain `<script>` files sharing one global scope.** No modules, no build step, no
  libraries. Load order matters (`00-core` → `14-story` → `12-game`); cross-file calls
  resolve at runtime because function declarations hoist. See `game/index.html`.
- **All art is canvas pixel art** drawn in code (`game/js/03-art.js`, `px()` rects,
  `mkSpr`). **All audio is WebAudio synthesis** (`game/js/02-audio.js`). Nothing is loaded
  from disk — the game is self-contained JS.
- **Rendering:** internal 320×208 canvas, `imageSmoothingEnabled=false`, CSS-upscaled ~4×
  with `image-rendering:pixelated`. Camera transform in `renderWorld`; lighting composited
  via multiply (ambient) + `lighter` (lights) + vignette passes in `drawLighting`.
- **Persistence:** only `state.farm` persists (localStorage); interiors/mine/beach
  regenerate daily from `mapCache` (cleared nightly). `migrateSave` backfills new fields.

### Design identity (do not break without cause)
- **No combat, ever.** Cozy tone — *nothing is ever taken from the player.* The mine, the
  storms, low energy: all non-hazardous by deliberate design.
- **Stardew Valley × RuneScape:** the cozy farming base plus a real 1–99 skill grind. The
  standing tension the audits track is keeping the RuneScape layer as rich as the cozy base.

### Core systems at v1.0
- Farming (till/plant/water/harvest), fishing, mining, foraging.
- Skills with a 1–99 curve; NPCs, gifting, dialogue, quests/journal.
- Day/night cycle, weather, four seasons, festivals, birthdays.
