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
