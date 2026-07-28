# HarvestScape — Agent Guide

Guide for any AI agent (Claude Code, Gemini CLI, Cursor, Copilot, Cline, Windsurf, Codex,
etc.) working in this repository.

Cozy procedural farming game (Stardew Valley × RuneScape). Shipped build lives in `game/`,
served on port **8643**. 100% procedural — no asset files; all art is canvas code, all
audio is WebAudio synthesis.

---

## ★ Standing rule: log every change, commit regularly

This repo keeps a **complete audit trail of every game change and the reasoning behind it**,
so the whole project can later be handed to another AI agent and rebuilt — possibly in a
different engine or direction — with full knowledge of *why* each decision was made.

**Every agent working here MUST:**

1. **Record all game changes in `CHANGELOG.md`.** This is the *single* internal log —
   there is intentionally **no separate public-facing changelog**. It covers everything:
   features, balance tweaks, bug fixes, UX polish, and the design decisions behind them.
2. **Write *why*, not just *what*.** The git diff already records what changed. The log's
   value is the intent — the problem, the options, and why this fix was the right one. A
   future agent recreating the game needs the reasoning, not a one-liner.
3. **Update the log in the same change as the code**, under the `[Unreleased]` heading; on
   commit, retitle that section with the date and commit hash.
4. **Commit and push freely and regularly** — after each coherent unit of work, not in one
   giant dump. Small, well-described commits *are* the audit trail. Don't let the working
   tree pile up, and **don't wait to be asked** — the owner has standing approval for you to
   commit and push on your own.
   - **Commit directly to `master` and push** — that is the established workflow here. No
     feature branch or PR is needed unless the owner explicitly asks for one.
   - You don't need to pause for confirmation before committing or pushing. Everything here
     is versioned and reversible (`git revert`/`git reset`), so favor shipping small commits
     over hoarding uncommitted changes.
   - The one hard requirement stays: the `CHANGELOG.md` entry ships **in the same commit** as
     the code it describes.
5. **Version every release.** The build's version lives in `VERSION` (`game/js/01-data.js`):
   a semver `name` and a monotonic integer `code`. When you cut a release, **bump both**,
   add an entry to the in-game `CHANGELOG` array (same file — the player-readable mirror that
   the "What's New" panel renders), retitle the matching `CHANGELOG.md` section from
   `[Unreleased]` to the version + date, and **tag the commit** `git tag v<name>` before
   pushing (`git push --tags`). Version code + tag are the "relevant information" every push
   must carry so the audit trail is anchored to concrete releases. Keep `VERSION`, the in-game
   `CHANGELOG` array, and `CHANGELOG.md` in lockstep — they must never disagree.
6. **Snapshot the atlas with every release.** After bumping `VERSION`, run
   `node tools/build-atlas.mjs` and commit its output **in the release commit**: it refreshes
   `GAME_ATLAS.html` AND writes `atlas/v<version>.html` — the permanent record of the game's
   state at that release (the owner's per-version reference; see `atlas/index.html`). A past
   release can be backfilled with `--src` (see the header of `tools/build-atlas.mjs`).

Treat the changelog as non-optional deliverable output, the same as the code itself.

**Keep the README current.** Whenever the repo's structure or capabilities change, update
`README.md` (and this `AGENTS.md`) in the *same* change, so the docs never drift from the code.

---

## Running & verifying

- **Serve:** `python3 -m http.server 8643 --directory game` (see `.claude/launch.json`,
  config name `harvestscape`). Open `game/index.html`.
- **No build step.** Edit a JS file, bump the `?v=` cache-buster in `game/index.html`
  (all `<script>`/CSS tags share one version), reload.
- **Syntax-check before reload:** run each `game/js/*.js` through `new Function(src)` in
  node — a fast lint that catches parse errors across the shared-global setup.
- **Verify visually.** Changes to rendering/lighting/UI must be confirmed in the browser
  (screenshot the relevant scene), not just reasoned about. Check the console is clean of
  *game* errors (extension noise like MetaMask is unrelated).

### ★ The checks (v5.0 "The Strongbox") — run these, they are fast and they are the only automation

The game has no test runner and no build step, deliberately. These four node scripts are what
stands in for one. **Run the save harness after ANY change to `migrateSave`, `freshState`, or a
persisted field, and the perf check after anything that adds drawn or stored state.**

| Command | What it proves |
| --- | --- |
| `node tools/check-saves.mjs` | Nine era fixtures (v2.1 → v4.37) plus the dense stress save go through the CURRENT `migrateSave`: no demoted level, no lost item/gold/crop/animal/friend/discovery, no downgraded tool, no NaN, **idempotent** (it runs on every load), and the save export/import round-trips. |
| `node tools/check-perf.mjs` | The year-3 budget: `migrateSave`, save serialize, save size, map generation, export round-trip — against recorded ceilings in `tools/fixtures/perf-budget.json`. `--set` re-records after an intentional change. |
| `node tools/make-save-fixtures.mjs` | Rebuilds the fixtures. Each era fixture is generated by checking out **that release's own code** and playing a short synthetic game in it — never hand-written, because a hand-written fixture is a guess about the past. |
| `node tools/build-atlas.mjs` | The atlas (already required every content change). Now also renders the **unlock-cadence table** — every ≥8-level band that unlocks nothing, XP-weighted. |

In the browser: `?lint` prints the unlock-cadence audit to the console (silent otherwise — every gap
it reports today is real and scheduled, and players' consoles are not a backlog). `await perfProbe(5)`
measures real frame work; load `tools/fixtures/saves/dense-year3.json` through the **Save File** panel
first if you want the honest worst case.

`tools/lib/load-game.mjs` runs the real game files in a node vm with browser stubs — that is how the
harness calls `migrateSave` without mocking it. Never mock game logic in a harness; a harness that
tests a copy tests nothing.

## Architecture (the parts that constrain every change)

- **16 plain `<script>` files, one shared global scope.** No modules/bundler/libraries.
  Load order is load-bearing: `00-core` → `01-data` → `02-audio` → `03-art` → `04-world`
  → `05-particles` → `06-weather` → `07-entities` → `08-actions` → `09-quests` →
  `13-content` → `15-warding` → `10-ui` → `11-title` → `14-story` → `12-game`. Function
  declarations hoist, so cross-file calls resolve at runtime — but data/const initialization
  order still matters. (`15-warding.js` is the v4.0 combat layer; it loads right after
  `13-content` so its load-time IIFEs can see `QUESTS`/`NPCDEF`/`NPC_RECOG`, while
  `genUndercroft` + the map-nav twins live in `13-content` because `MAPS` references them.)
- **Rendering:** internal 320×208 canvas, `imageSmoothingEnabled=false`, CSS-upscaled ~4×
  (`image-rendering:pixelated`). High-fidelity text draws to a separate device-resolution
  `#gtext` overlay (`05-particles.js`), *not* the pixel canvas — keep game text crisp there.
- **Lighting:** `drawLighting` in `06-weather.js` — multiply (ambient) + `lighter` (light
  pools from `collectLights`) + vignette. Ambient is per-context (outdoor sky gradient /
  mine / interior). Tune with a screenshot open; additive light glares easily.
- **Persistence:** only `state.farm` persists (localStorage). Interiors/mine/beach
  regenerate daily from `mapCache` (cleared nightly). Add new save fields via `migrateSave`.
  ★ **v5.0:** that one localStorage slot is now also exportable — `exportSaveText` /
  `parseSaveText` / `importSaveText` in `04-world.js`, surfaced by the **Save File** panel
  (Settings *and* the title menu). Two rules that are not optional: **(a)** call `suspendSaves()`
  before any `location.reload()` that follows a restore — `beforeunload` and `visibilitychange`
  both call `saveGame`, so the stale in-memory state would be written straight back over the
  restored one; **(b)** anything that replaces or deletes a save stashes it in `BACKUP_KEY` first
  (`wipeSave` does too), because the panel promises an undo and the contract does not do exceptions.
  Adding a persisted field? Add a fixture assertion in `tools/check-saves.mjs` in the same change.

## Design identity — do not break without explicit reason

- **Nothing is ever taken from the player.** No permanent loss — no item loss, no gold loss,
  no level loss, no destroyed property, ever. This is the surviving core of the cozy contract.
- **Combat exists (v4 direction, owner call 2026-07-18) but is Stardew-cozy, not punishing.**
  The original "no combat, ever" clause was rescinded by the owner for Version 4 — combat is a
  new 1–99 skill and a content unlock engine (see `V4_PLAN.md`). Defeat is a soft knockout
  (wake up safe, nothing lost), never death; the farm, village, and all v1–v3 spaces stay
  hazard-free — combat lives only in spaces the player deliberately enters.
- **Stardew base × RuneScape skill grind (1–99).** The recurring design tension (tracked in
  the audits) is keeping the RuneScape progression layer as rich as the cozy farming base.
- **The story is the spine (v4 direction).** The long main quest should be what the player
  builds toward; skills level as a byproduct along the way — not the other way around.

## Reference docs

- `CHANGELOG.md` — the audit trail (start here for history / intent).
- `DEVLOG.md` — the owner's playtest feedback and direction calls, near-verbatim. When the
  owner gives play feedback, record it there (raw signal + interpretation), then link the
  plan/changelog work it produces.
- `GAME_ATLAS.html` — the whole game on one page, generated from live game data by
  `node tools/build-atlas.mjs`. **Regenerate it whenever game content changes** (quests, crops,
  NPCs, recipes, maps…) and commit it with the change; the generator throws if its few
  hand-written mappings go stale.
- `atlas/` — one atlas snapshot per release (`v<version>.html` + an index), written
  automatically by every generator run. Never edit these by hand; they are the historical
  record of the game's state version by version.
- `GROVE_DEPTHS.md` — the Grove Depths plan (depth rings, waystones on a pledge ledger, tree
  rarity, canopy treasure, + the mine lift's ledger retrofit). **Shipped in v3.3.0** — kept as
  the design record behind that release.
- `WORLD_EXPANSION.md` — the world-expansion plan (owner call 2026-07-16: "the world feels
  small"): three new areas sequenced by fiction-cheque size — the Coast Road (river + ferry
  landing), Starfall Ridge (star-gleaning + the panorama), Butterbrook (the coast dairy).
  **All three SHIPPED** (v3.36 / v3.43 / v3.44); the per-area later layers remain roadmap.
- `V4_STATE_OF_THE_GAME.md` — the v3.45.0 baseline assessment: full systems inventory
  (verified against live code) + the three-problem diagnosis (thin story, rabbit-holing,
  no-combat content ceiling) that motivates Version 4.
- `V4_PLAN.md` — **the Version 4 roadmap ("The Warden's Valley"):** Warding (combat) as the
  sixth 1–99 skill per the bible's §6 expedition spec, the year-long chaptered Act III driven
  by the Warden's Ledger, mastery trials + variety spark for breadth pacing, and the v4.0–v4.4
  release train. **v4.0 "The Tenth Door" SHIPPED** (Warding + the Undercroft floors 1–15 + the
  three creature families + Resolve/knockout + the Stave + bells/charms + the door-opening quest
  + the variety spark). **v4.1.0 "The Great Knot"** + **v4.2.0 "Deeper Still" SHIPPED** — the Warding
  *combat* deepening (owner-directed, ahead of the story): the Undercroft now runs floors 1–45 with a
  creature family at every rung of the ladder (1/10/20/30/45/70/85 — wisp/shambler/embermite/Hollow
  Warden/Gloam Tangle/Deep Knot/Star-Gnarl), the first Great Knot boss every 10th floor, the game's
  first ranged enemy + projectile system, deep loot + charms up to the +15 Starward + bells to 45.
  **v4.3.0 "The Warden's Ledger" SHIPPED** — Act III's story spine at last: the Warden's Ledger chapter
  engine (a book by the tenth door; `state.wardChapter`/`wardBundle`, deliberately independent of the
  fragile `questIdx` chain), Act III chapters 1–3 (cross-skill bundles deposited partially on the
  Pledge-Ledger pattern + Undercroft expedition beats), the close-flow with the Guild warming a lantern
  pair per chapter, and Maya's descent. **v4.4.0 "Hold the Line" SHIPPED** — the Warden's Guard, a
  block/parry for Undercroft combat (owner report: the Hollow Warden could only be run from): a timed
  guard (Shift / right-click in the Undercroft / touch 🛡) that parries a facing blow — perfect timing
  negates all Resolve loss, staggers the attacker, and knocks a Hollow Warden's guarded front open for a
  riposte; a late guard blocks ¾. Free, cooldown-gated, one-hit-per-press, no-ops outside the Undercroft.
  **v4.5.0 "The Tenth Lantern" SHIPPED — Act III is COMPLETE.** The Warden's Ledger now runs all 8
  chapters to the bottom of the wing (floor 45): ch4–7 (past where Elias kept / Rowan comes down to the
  wing he sealed / the last warden Orla's name / the deepest knot) + the finale (ch8 "The Tenth Lantern"
  — the tenth craft lit and counted, Rowan lights the tenth door, the Guild hall blazes, `tenthWingLit`
  glows the olddoor for good). Pure data into the v4.3 chapter engine; GBP-honest deep bundles.
  **v4.6.0 "The Kept Chair" SHIPPED** — deepened Elias (the Act III centerpiece): a 4-scene HEART_EVENTS
  arc (koi / Aldous's unopened letter / a rehearsed apology to Maya / peace + a Pearl; the wing-referencing
  5♥+6♥ beats gate on `tenthDoorOpen` via a new per-event `req` predicate in `heartEventFor`) + Undercroft
  small-talk (6 NPC_RECOG lines so the cast reacts to Warding) + birthdays for Elias (Fall 26) & Nell
  (Summer 24). Pure data; caught in test that `heartsOf` caps at 6 (an early `hearts:8` event was
  unreachable → retiered 2/4/5/6).
  Still remaining from v4 — **now absorbed into the V5/V6 roadmap** (see `V5_PLAN.md` / `V6_PLAN.md`):
  mastery trials at 50/75 (→ v5.1; bank-and-release + grandfathering are locked constraints) and the
  dedicated deep venues (Gloam Grove ring, Sunken Workings → v6.0). ★ Stale-backlog correction
  (verified 2026-07-28): three items formerly listed here ALREADY SHIPPED — seasonal crop gaps (v4.7),
  Fishing/Cooking charms (v4.7: Heron Feather + Hearth Charm), recipes for orphaned goods (v4.8) — and
  the repeatable gold sink is closed by the Patron (v4.26) + bag tiers (v4.31). Cottage decoration → v5.7.
  Read `V4_PLAN.md` (and its §6 owner decisions) before building anything Act-III-shaped.
- `V4_BUILD_PLAN.md` — **the implementation work orders for v4**, written to be executed
  cold by any coding agent: locked decisions, verified engine anchors (symbol names, data
  shapes, integration points), and per-release specs with schemas, starting balance
  numbers, and definition-of-done. **This is the entry point for building each v4 release** —
  one release per session, strictly in order (v4.0 done; start the next unbuilt release's §).
- `V5_PLAN.md` — **the Version 5 roadmap ("A Life in the Valley")**, first of the two-version arc the
  owner directed 2026-07-28 ("a very detailed roadmap that can span maybe two whole big versions").
  Produced by an eight-lens design review of v4.37 + adversarial cross-check; every load-bearing number
  measured against the live tables (headline: 45.4% of every 1–99 climb sits above L85, and for four of
  six skills L85 is the LAST unlock; Mining 50→70 alone is 19.3% of the climb with nothing in it).
  Two spines — the Ladder (trials at 50/75, Warding techniques, Cooking→Resolve, boss ladder + the
  missing floor-45 terminal fight, gem veins) and the Home (spouse move-in, heart cap 6→10 + Tom/Pip
  capstones, the persistent decoratable cottage, ferry merchant + rare sky events, the weekly writ).
  ★ v5.0 "The Strongbox" ships infrastructure FIRST: save export/import (one localStorage slot = total
  loss one cleared cache away — the largest possible contract violation), a migration fixture harness,
  the year-3 perf fixture, the unlock-cadence linter, and the GBP §2.5/§9/§10 re-anchor.
  **v5.0 SHIPPED** (2026-07-28) — all five items, plus the harness's first catch (a stale literal HP on
  the farm's starter pine, missed by v4.23's rebalance) and a title-screen z-order/click-through fix the
  new panel exposed. **v5.1 "The Trials" SHIPPED** (2026-07-29) — the mastery trials at 50 AND 75 for all
  six crafts (bank-and-release, grandfathered, cross-skill asks on the Pledge Ledger's sixth prefix,
  the scene fired on TALK not on the level-up), the Warding technique ladder at 15/35/55/65/80 (every
  rung a new input or outcome, never a damage stat — Warding's dead share 88.5% → 59.1%, unlocks
  10 → 15), and the two Stave arts set at a bell. ★ **Owner decisions in `V5_PLAN.md` §6 are ALL
  RESOLVED** — build against them, don't re-litigate: trials at 50+75 live, heart cap → **10** (binds
  v5.5 as well as v5.6), writ pays gold + marks toward cosmetics (so v5.7's catalog must precede v5.9),
  merchant ~2 days/week seeded. **v5.2 "The Warden's Table" SHIPPED** — food restores Resolve in the Undercroft, three tonics that each
  spend a cooked dish AND a settling drop, the Guild's rounds and the Patron's commissions finally ask
  the farm for something, and GBP gained **§5.2b** ("the baseline IS the balanced game — never tune an
  encounter around a consumable"), which every later consumable and the v5.8 merchant inherit verbatim.
  **v5.3 "The Deep Seams" SHIPPED** — four level-gated gem seams (15/35/55/78, the Ruby inside Mining's
  worst void), "Read the seams" at 60, and two late legends; Mining 88.5% → 60.9% dead, Fishing 79.0% →
  56.8%. ★ Two lessons: the seam rate was wrong by 6× until it was SAMPLED against the live generator
  (a mine floor has ~100 open tiles, not ~600), and the second legend moved 75 → 80 because 75 is
  already a mastery milestone — the linter turned both into one-line fixes. **v5.4 "The Oldest Knot" SHIPPED** — the boss ladder (floors 10/20/30/40 each gain one move the wing
  already taught) and the floor-45 terminal fight Act III's finale had been naming with nothing behind
  it. **v5.5 "Moved In" SHIPPED** — the spouse
  is in the cottage mornings and evenings, their props stamp into `genCottage`, two post-wedding scenes
  on `daysMarried()`, and time-of-day married dialogue pools. **v5.6 "Ten Hearts" SHIPPED** — the cap rises 6→10
  (free by construction: hearts are DERIVED from uncapped `rel.points`, only the reading was clamped),
  Tom's and Pip's capstones, a late scene for the whole cast, and the v4.6 unreachable-event guard made
  structural in the harness. **v5.7 "Four Walls" SHIPPED** — the version's XL, whole: `state.home` is the cottage's persistence
  overlay (the room regenerates, the home does not), fifteen procedural furniture pieces in their own
  shop tab, lossless pickup, and two house-expansion pledges that grow the map (11×9 → 15×9 → 19×11 via
  a `MAPS.cottage` getter — ★ which must guard `state` itself being null, as the atlas found on its
  first run). Measured: the dressed cottage is the CHEAPEST map in the game (p50 0.5ms vs the farm's
  2.2ms). **v5.8 "The Ferry Comes In" SHIPPED** — the
  seeded visiting merchant (1.7 days/week measured), rare sky events (8.2/year, 2.0/season measured over
  five simulated years), and Tom's Craving (the retired Demand's texture with the sign flipped).
  ★ The stall is `MONETIZATION.md`'s diegetic home and ships SYSTEM-FIRST on purpose. **v5.9 "The Writ" SHIPPED — ✦ VERSION 5 IS COMPLETE.**
  Eight cross-skill standing bundles that rotate **when completed, never on a timer** (no expiry, no
  streak, nothing to be behind), plus writ marks and the four cosmetics they buy — shipped in the SAME
  release as the marks, because v5.6 taught that a number buying nothing is a promise the game doesn't
  keep. ★ **All ten V5 releases are built (v5.0–v5.9); every §4 item shipped and every §6 decision is
  resolved and recorded in `V5_PLAN.md`.** The linter graded the version's own work: Mining 88.5% →
  60.9% dead, Warding 88.5% → 59.1%, Fishing 79.0% → 56.8%.
  **Next: `V6_PLAN.md`** — but read its header first. It is deliberately one notch less locked than V5
  was and says to re-ground against real V5 playtest signal before building v6.0, and its five owner
  decisions (the child above all) are OPEN. Do not inherit them from the roadmap; ask. Build it the
  `V4_BUILD_PLAN.md` way — write that release's build order fresh, re-verify every symbol anchor
  `V5_PLAN.md` names, one release per session, strictly in order.
  ★ Two load-order lessons from v5.1, both worth carrying: (1) a `const X = f()` evaluated at load in
  `01-data.js` breaks the moment a later release appends a table `f` reads — the audit is a memoized
  function now, and anything similar should be too; (2) `skillLvl` is THE accessor for a skill's
  effective level and the only place the mastery gate lives — `levelFor(xp)` stays a pure curve
  reading for migrations and the harness. Don't reach past `skillLvl` for a gate.
- `V6_PLAN.md` — **the Version 6 roadmap ("The Valley, Whole")**, the elder game; deliberately one notch
  less locked (re-ground after V5 ships). Four programs: Below the Bottom (the two designed deep venues
  + the opt-in Long Round below floor 45 + weekly seeds + a depth record — ★ its knockout rule is the
  load-bearing sentence: nothing carried and nothing FOUND is ever lost; only the un-set record and
  foregone further gain are legal stakes), the Ledger of the Valley (perfection meter + records book +
  post-99 cape ranks — all derived, all retroactive; fixes standingGoalsHtml blanking at the top), the
  Turning Year (second festivals, playable verbs, year-aware recurrence), and Ease & Voice (earned
  automation AFTER decoration per the bible's F2, the Loom fibre chain, newcomer + optional child,
  the 100% ceremony, the audio-identity pass).
- `MONETIZATION.md` — **inward monetization** (owner direction 2026-07-28): turn the rewarded-ad slot
  inwards so it shows our OWN brands (H&Y et al) rather than an ad network's — product video, store
  visits and social engagement in exchange for temporary in-game boosters. ★ The rule that governs it:
  the baseline IS the balanced game and is never tuned around boosters; the moment a balance change is
  justified with "they can always watch a video for it", the cozy contract is broken in spirit. Also
  records the constraints that decide what is buildable at all (incentivized ratings are prohibited
  outright; incentivized likes/shares generally violate social platform terms; video-of-our-own-content
  and store visits are the safe core) and the deliberate carve-out to the no-asset-files rule (brand
  media is CONTENT, not game art — the game itself stays procedural). Roadmap, not built.
- `NEW_PLAYER_EXPERIENCE.md` — the onboarding beta plan (shipped in v2.2.0; polish tier still
  on the roadmap).
- `GAME_DESIGN_PRINCIPLES.md` — the design bible; the yardstick audits grade against.
- `GAME_BALANCE_PRINCIPLES.md` — the balancing playbook: distilled, evidence-anchored rules for
  gold / XP / progression, plus a runnable checklist, a failure-mode graveyard, and a live
  reference-numbers appendix. **Read this before changing any economy, XP, or tier number** — it
  operationalizes the bible's economy/progression sections with anchors from our own rebalances.
- `DESIGN_SCORECARD.md` — latest graded audit of the build vs. the principles.
- `README.md`, `GAME_SCOPE.md`, `DESIGN_REVIEW.md`, `DESIGN_V1.5.md`, `ROADMAP_V2.html` —
  scope and planning history.

## Skills / specialist roles

There are currently **no repo-local skills or slash-commands** defined (`.claude/` holds only
`launch.json`). If a `.claude/skills/` directory is added later, mirror it at the neutral path
`skills/` (a symlink) and list each skill here — name, when to use it, and its entry file — so
non-native agents can read the skill's Markdown and adopt the role manually (auto-triggering is
tool-specific; the knowledge is plain Markdown).

## Cross-agent setup

`AGENTS.md` is the **canonical, single source of truth** for agent instructions. Every
tool-specific instruction filename is a **symlink** pointing at it, so no agent gets different
behavior:

| Symlink | Tool |
| --- | --- |
| `CLAUDE.md` | Claude Code |
| `GEMINI.md` | Gemini CLI |
| `.cursorrules` | Cursor (legacy) |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.clinerules` | Cline |
| `.windsurfrules` | Windsurf |

ChatGPT / Codex already read `AGENTS.md` directly. **To onboard a new tool:** add a symlink for
its expected filename pointing at `AGENTS.md` (`ln -s AGENTS.md <NAME>`; for nested targets use a
relative path, e.g. `ln -s ../AGENTS.md .github/copilot-instructions.md`).

**Windows / filesystem caveat:** symlinks require a Unix-y filesystem and
`git config core.symlinks true` (the default on macOS/Linux). If your platform doesn't resolve
the symlinks (e.g. a Windows checkout without symlink support), **open `AGENTS.md` directly** —
it is the real file; the others only point to it.
