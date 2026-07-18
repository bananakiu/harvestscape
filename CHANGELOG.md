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

## [Unreleased] — v4.0.0 "The Tenth Door" (Version 4 begins)

The first release of Version 4, built to `V4_BUILD_PLAN.md` §3. Combat enters the game — but
as a **cozy, opt-in sixth craft**, not a punishment layer. The amended contract holds absolutely:
**nothing is ever taken from the player** (knockout costs zero), creatures live **only** in the
new Undercroft, and every pre-v4 space stays exactly as hazard-free as it was. Scope is v4.0 only
(the Ledger, chapters, and mastery trials are v4.1+); the variety spark is the one v4.1-adjacent
thing that ships here on purpose, to set the tone early.

### Added — Warding, the sixth 1–99 skill (foundation)

- **Warding** joins Farming/Woodcutting/Mining/Fishing/Cooking as a full skill on the shared XP
  curve. Total-level cap rises 495 → **594**; the skills panel now derives its denominator from the
  live skill count (`99 × Object.keys(state.skills).length`) so it can never drift again — the one
  place a `*5` was hard-coded.
- **The Stave** — the Warden's tool — is the sixth tool on the wall. It rides the *same* 7-tier
  ore+wood ladder as every other tool (V4_PLAN §2: "Warding gear = the sixth line on the tool
  wall"), so all the tier-indexed cost/power/colour tables cover it unchanged; only `TOOL_SKILL`
  (→Warding) and a tier-3 gem (Sapphire, mirroring the Rod's Pearl) are Stave-specific. Unlike the
  five starting tools it is **not** granted at freshState — Elias gives the Basic Stave in the door
  scene (`state.flags.staveEarned`), and only then does it appear in the bag, on the hotbar (a 7th
  slot appended after Seeds so nothing reindexes — key 7), and on Tom's upgrade wall.
- **Mastery** (25/50/75/99) in Elias's quiet, self-aware voice — capstone **Lanternheart** floors
  Resolve at 10 so a master is effectively un-knock-out-able. `MASTERY_NPC.Warding = "elias"` (the
  last Warden is the one who cares about the tenth craft).
- Save migration: `state.skills.Warding`, `state.tools.Stave`, and the new combat fields
  (`resolve`, `wardDepth`/`wardBest`, `wardBells`, `dailyXpActs`, `stats.warded`/`knockouts`) all
  backfill onto pre-v4 saves through the existing generic + per-collection loops in `migrateSave`;
  an explicit belt-and-suspenders line seats Warding, and Resolve always loads full.

### Added — the variety spark (the anti-rabbit-hole nudge, V4_PLAN §4)

The first **10 actions in each skill each day** earn **+50% XP** with a distinct cold-blue sparkle
and a one-time toast per skill per day; the skills panel shows how many sparks each skill has left.
Hooked at `addXP`, the single choke point for *all* skill XP (so it covers Warding automatically),
and reset each dawn in `newDay`. **Reward-shaped, never punitive** (GBP §5.3): rotating between
crafts is now visibly optimal, but single-skill focus is still allowed and never taxed — this
replaces any XP-penalty/daily-cap idea, which would break the contract.

### Added — the Undercroft (the tenth wing) + the combat loop

- **The Undercroft** — floors 1–15 of cozy-dark procedural cavern behind the planked Guild door,
  cloned from the mine's carve/BFS skeleton but re-purposed: no ore, and the way down hides under a
  **knot** you *settle* with the Stave (not a rock you pick). Its own bluer ambient (`#4a4560`),
  dark bg, a wide lantern pool (r≈90), its own slow uneasy music mode (`PROG_UNDER`, ~52 bpm), and
  vignette softened like the mine. **Time stands still** underground, like the mine. Floor 15 is a
  dead-end for now (v4.1 deepens it). It is the *only* hazardous space in the valley — reached only
  by deliberately walking through the tenth door.
- **The restless things** — three creature families, melancholy not menacing, each with **one
  telegraphed attack** (a shimmer/creak ≥0.5s before it lands — you always get to react): the
  drifting **Gloam Wisp** (shies from your lantern, then lunges), the slow **Knot-Shambler** (roots,
  then charges straight), and the quick **Ember Mite** (skitters, dashes, leaves a fading warm
  patch). Baked as 2-frame sprites, composited with dynamic telegraph/hurt tints; they depth-sort
  with everything else and carry their own cold light. AI is entity-on-the-tick-loop only — no
  physics, no pathfinding beyond the wander/aggro/telegraph/lunge/cooldown states.
- **The Stave's swing** settles a creature in a generous hitbox or breaks the stair-knot; damage is
  the tool's tier power (the existing `TIER_POWER` model), the swing costs 2 energy like the Axe/Pick
  (★ Steady Ward sometimes free), and a settle drops materials + Warding XP + a soft bell.
- **Resolve + the zero-cost knockout** — a combat-only bar (HUD-shown *only* in the Undercroft),
  full on every safe map and each dawn, drained only by a restless thing's touch (with ~0.85s
  i-frames + knockback so a swarm can't chain-drain you). Empty → a soft knockout: fade, two lines
  of story, and you wake at the Guild door with **every item, coin and XP intact** — the only cost
  is the wasted run-depth, softened by the bells. ★ Lanternheart (99) floors Resolve at 10, so a
  master is effectively un-knock-out-able. This is the amended contract made literal.

### Design notes / conservative calls (logged per §8)

- **Creature & drop balance are the build plan's starting bids, passed through GBP and kept.**
  Settle XP (wisp 14 @L1 · shambler 30 @L10 · embermite 46 @L20) sits *under* the ore-XP curve for
  the band (copper L10=78, iron L20=186) on purpose: settling is a frequent, low-hp action, so
  per-settle XP must stay under mining a vein per unit time (GBP §3.4). Drop sells (Gloam Thread 18 ·
  Knotwood 24 · Ember Grit 30) are priced *low* — the Undercroft is gated behind Act II + total-100,
  so a settler always has iron/gold (68/165g) to out-earn these many times over; their real value is
  as crafting materials (charms, bell pledges), so resale is a floor, never the point (GBP §2.4).
- **Charm recipe uses `Wool`, not `Fleece`.** V4_BUILD_PLAN §3.5 names "Fleece" for the Warded
  Charm, but no item by that name exists — the sheep good is `Wool` (Prize Fleece is the rare
  variant / a loved gift). Used `Wool` as the obtainable, on-theme ingredient.

## 2026-07-18 (later) — V4 build plan: implementation work orders for any coding agent

### Design — `V4_BUILD_PLAN.md` (new): the plan becomes executable

The owner approved `V4_PLAN.md` and asked for a build plan another AI coding agent (Codex,
Opus, etc.) could implement cold. The new doc is written as self-contained work orders:

- **Locked decisions (§1)** — the plan's §6 recommendations are now decisions (Warding /
  settle verb / Stave weapon / zero-cost knockout / trials at 50+75 / gate ramp 100→380),
  so an implementing agent never has to guess intent. Notably, **decision 5 resolved
  itself**: a code read found the planked Guild door's shipped post-Act-II examine already
  canonizes it as *Elias's old workroom* — so the lore locks as "Elias was the last
  Warden," which welds Act II to Act III instead of fighting the shipped text. (The
  door-opening scene is Elias taking his own boards down — the examine's "any day they
  choose," kept literally.)
- **Engine primer (§2)** — every integration anchor an implementer needs, verified by grep
  against v3.45.0 *symbol names* (not line numbers, which drift): the skills engine has no
  SKILLS constant (the set is `state.skills`' keys, so adding Warding is one `freshState`
  line + one **explicit nested `migrateSave` backfill** — the generic backfill only covers
  top-level fields, a trap called out in bold), `addXP`/`levelFor`/`TIER_POWER`, the
  `genMine`/lift/pledge machinery the Undercroft clones, the full new-map registration
  set, cutscene step types, dark-zone lighting branches, and the release plumbing.
- **Per-release specs (§3–§7)** — v4.0 in file-level detail (creature table with starting
  hp/XP/drops, Resolve semantics, knockout invariant with an explicit
  diff-inventory-before/after test, the Stave as `TOOLS[5]`, Warden's Bell checkpoints on
  the pledge pattern, variety spark in `addXP`); v4.1–v4.4 at task level with
  definition-of-done gates. Design details deliberately NOT restated from `V4_PLAN.md` are
  cross-referenced, not duplicated — one source of truth per fact.
- **Standing constraints (§8)** — contract test per release (grep the diff for anything
  that takes), hazard containment to the three combat maps, GBP pass on every number, and
  a blocked/deviation protocol (conservative call + changelog reasoning + DEVLOG question,
  never silently override a locked decision).

Also: `V4_PLAN.md` §6.5 marked resolved; `AGENTS.md`/`README.md` doc lists gained the
build plan (flagged as *the* entry point for building v4). Still docs-only — no game code.

## 2026-07-18 — Version 4 planning (docs only, no game code)

### Design — Version 4 planned: combat green-lit, the story becomes the spine

The owner's 2026-07-18 direction call (recorded near-verbatim in `DEVLOG.md`) sets the next
major version: the main storyline is too thin and over too early, single-skill rabbit-holing
is under-checked, and — the historic part — **the "no combat, ever" clause of the cozy
contract is rescinded**. Combat is wanted Stardew-style: present, fun, a new skill, a content
unlock engine — while "nothing is ever taken from the player" survives untouched.

Why this shape and not others:

- **`V4_STATE_OF_THE_GAME.md` (new)** — the assessment the owner asked to "save first."
  Key quantification driving everything else: the Act I finale gates on total level 60 of a
  possible 495, so the narrative resolves with ~88% of the progression system still ahead
  and no story pull on any of it. Also names the assets v4 inherits (the bible's §6 cozy-
  combat spec, the pledge/bundle machinery, the 9-wings-vs-5-skills fiction gap, unspent
  story hooks) so the plan builds instead of rebuilding.
- **`V4_PLAN.md` (new)** — "The Warden's Valley": (1) **Warding**, the sixth 1–99 skill —
  settle restless Gloam-things in opt-in spaces (the Undercroft beneath the Guild's planked
  door), Resolve bar + zero-cost knockout, gear forged on the existing 7-tier ore+wood
  ladder, loot as material fuel never a faucet; (2) **Act III "The Untended"** — 8 chapters
  across a full year on Community-Center-style bundles via the pledge machinery, total-level
  gates ramping ~100→380 so the story now outlasts the mid-game; (3) **breadth engine** —
  cross-skill mastery trials at 50/75 (banked levels, never lost XP) + a daily variety
  spark, extending the owner-endorsed multi-resource-gate pattern instead of inventing
  penalties. Release train v4.0–v4.4, six owner decision points, constraints per build.
- **`AGENTS.md` design identity amended** — "No combat, ever" replaced by the surviving
  core ("nothing is ever taken") + the Stardew-cozy combat terms + story-as-spine; the
  reference-docs list gains both v4 docs and marks `WORLD_EXPANSION.md` shipped (it still
  said "PLANNED" — README had the same staleness, also fixed).
- **`DEVLOG.md`** — the direction call recorded with interpretation, per convention.

Deliberately *not* done: any game code, version bump, or atlas regen — this is a planning
change set; the owner reviews `V4_PLAN.md` (esp. its §6 decision points) before build-out.

## v3.45.0 — "Quietude" · 2026-07-18 · tag `v3.45.0`

Audio: real mute + split Music / Sound FX. (Note: the `10-ui.js` settings-panel half of this
change was swept into the v3.44.0 commit `0d5b257` by a concurrent session before this was cut,
which left that commit briefly referencing `setMusicOn` before `02-audio.js` defined it; this
release lands the rest and makes the tip consistent again.)

Owner report: *"when the music is turned off, there's still light background music in the
background — I want music fully off when it's off"*, plus a request for **separate toggles for
background music and sound effects**.

**Fixed — the "faint music when muted" leak (the real bug).** The generative music was never
fully silenced by the mute. Cause was in the WebAudio routing (`02-audio.js`): there was a single
shared reverb and a single feedback delay, and both were wired **straight to `master`**. Every music
voice (`note()`) sent its *wet* signal directly into those busses, so the wet path **bypassed
`musicGain` entirely**. Turning music "off" set `musicGain → 0`, which killed the *dry* pads/leads —
but their reverb and delay tails kept ringing out through master. Because the music is continuous,
that reverberant wash was constant: exactly the "light background music" that was still audible.
The pluck/lead/pad/sparkle voices all use `rev`/`delay`, so the leak was always present.

Fix: **per-category effect busses.** Music and SFX now each own a reverb + delay send whose wet
return feeds *its own* category gain (`musicRev`/`musicDelay` → `musicGain`, `sfxRev`/`sfxDelay` →
`sfxGain`) instead of master. `note()`/`burst()` route the wet send to the same bus as the dry
signal. Now a muted category silences its tail too. Verified in-browser with an analyser on the
master bus: with music off (SFX isolated off), output RMS falls to ~0.00002 (≈ −93 dBFS, i.e.
true silence) after the tails decay — previously it stayed near the music's own level.

*Why busses and not "just also zero the shared rev/delay on mute":* the rev/delay are shared by
SFX too. Zeroing the shared bus on music-mute would wrongly kill SFX reverb (and vice-versa). Two
independent busses is what makes the two toggles below actually independent. Minor bonus: SFX
reverb now scales with the SFX volume slider (it used to bypass `sfxGain`), which is more correct.

**Added — independent Music and Sound FX toggles.** The old model had a single `SND.enabled` flag
gating everything — mislabeled "♪ Music" on the title and "Audio On/Off" in Settings, but really a
master switch. Split into `SND.musicOn` and `SND.sfxOn`, each with its own on/off control:
- **Settings panel:** the single "Audio" row is replaced by an On/Off toggle on *each* of the
  existing Music and Sound FX rows (green when on, greyed when off), beside their volume sliders.
- **Title screen** "♪ Music" button and the **`m`** hotkey now toggle **music only** (matching
  their label), leaving SFX alone.
- **Environmental audio** (rain, birdsong, crickets) is categorized as Sound FX, so it follows the
  SFX toggle; rain's level is remembered (`SND.rainLevel`) so toggling SFX back on restores the
  current weather immediately. Music ducking under storms still keys off `musicOn`.

**Weather-duck follow-up (adversarial review).** Making Sound FX independent exposed two duck
interactions, both fixed via a single `currentDuck()` helper that is now the sole source of truth
for the storm duck: (1) with **SFX off**, rain is silent, so the music no longer ducks for weather
you can't hear — previously it stayed ducked ~42–58% for the whole storm; (2) the volume slider and
the music toggle now *honour* the active duck instead of writing the raw `musicVol` — previously,
dragging the slider or toggling music **while the world clock was paused** (a panel/dialogue open,
so `updateWeather` isn't re-ducking each frame) snapped the music back to full over the storm until
you unpaused. Also hardened `burst()` to route its reverb send by `dest` like `note()` does, so a
future music-dest burst can't re-introduce the wet-bypass class this change removed. Verified with a
master-bus analyser: storm+SFX-on settles music to 0.324 (≈0.58×), storm+SFX-off to 0.545 (full),
slider/toggle-while-paused hold the duck, and music-off is still true silence.

**Save compatibility.** Prefs (`hs_audio`) now persist `{music, sfx}` booleans; a legacy single
`{on}` flag is migrated to both (verified: old `{on:false}` → both toggles off, volumes carried).
An `on: music||sfx` key is still written for graceful downgrade to older builds.

Touched: `game/js/02-audio.js` (routing + state + toggle API), `game/js/10-ui.js` (Settings UI +
`m` hotkey), `game/js/11-title.js` (title mute button). No `VERSION` bump here — folds into the
next cut. Syntax-checked; in-browser verified (mute silence, toggle independence, migration, clean
console).

---

## v3.44.0 — "Butterbrook" · 2026-07-17 · tag `v3.44.0`

`WORLD_EXPANSION.md` area 3, the last of the three — and the release the plan called the hardest,
because it needed the valley's **first new NPC since launch**. That inhabitant is **Nell**.

**The map.** West off the beach, the coast opens south to `butterbrook` (46×34): shore-meadows,
the brook winding to the sea under a plank footbridge, and the creamery alone at the far western
end — deliberately the longest walk in the valley, because the fiction always said the dairy was
"down the coast". The beach grows a west warp band mirroring the v3.36 east one; the creamery
door opens into a small `dairy` interior (13×9). Both regenerate daily via `mapCache`.

**Nell** — Tom's wife, the coast dairy the barn's shipped its milk to for twenty years, invoked
in five lines of dialogue since v3.24 and drawn *never* until now. Built to the bar v3.34/3.35
set for inhabitants: a hand-drawn portrait and overworld sprite (a new `kerchief` portrait
feature — sandy hair under a red headscarf, so she reads distinct from the whole cast at 16px),
`CHAR_SPEC` colours, `EXAMINE_NPC`, and five heart-tiered idle lines with her own voice (Tom's
dry humour, the volume turned down). Voice-first; heart events are a later layer.

**The milk round — closing the dairy loop.** Nell keeps a **daily order** (the noticeboard's
pattern, her own flag namespace, dairy goods only): she asks for the day's item — milk, cheese,
wool, the good big eggs — and pays a **premium over Tom's counter** (1.6× vs the board's 1.4×),
plus Farming practice and hearts, once a day. Talk to her and she tells you today's ask; bring it
and it fills on the spot. Your barn makes the milk, your press makes the cheese (v3.33), and now
there's someone down the coast glad of both — the loop the whole chain was reaching for.

**Review found 3 issues, all fixed pre-ship** — all in Nell's schedule/geometry, none in the
economy or the writing:
- The creamery door was in the *top* wall row with a wall beneath it, so the interior exit warp
  landed the player *inside* the wall — only `unstick()` saved it, popping them out one tile
  askew. The door moved to the reachable bottom row and the exit lands at the centre of the
  walkable meadow tile below it (verified: `collisionEmbedded: false`, steps clear in every
  direction).
- Nell wandered the meadow at 1am (the old `h < 7`); she now keeps proper hours — creamery
  7:00–18:30, meadow 18:30–22:00, home abed after — and `npcRegionNow` matches exactly, so the
  world-map dot never disagrees with where she's standing.
- On festival days the blanket "everyone's at the coast" rule put a *false* Nell dot on the
  beach (she's not in the festival cast); she's now excluded, keeping her true dairy location.

Verified in-browser (muted): the map geometry (creamery/brook/bridge/path/sea/churn), the beach
west band (east still → Coast Road), the door→dairy→back warp loop landing clean, Nell's fixed
schedule + matching map dot + festival exclusion, the order transaction (Fine Cheese ×2 → 800g,
+12 Farming XP, +25 hearts, no double-dip, can't-fill-empty, idle-line-after-fill), the portrait
+ overworld sprite with the kerchief (screenshotted), the map in context, atlas (15 maps /
7 NPCs), clean console.

---

## v3.43.0 — "Starfall Ridge" · 2026-07-17 · tag `v3.43.0`

**The world grows upward** — `WORLD_EXPANSION.md` area 2, and the sequel v3.42's violet
starlight set up: now there's a place it falls.

**The map.** `ridge`, 46×30 outdoor, up the switchbacks past the mine mouth (the village's
north edge opens at x36–38, clear of the entrance and its story triggers): tree-line pines,
the dirt scree, and a snow-pale summit holding the **crater dell** where the Guild's founding
star came down (fused smooth, a last violet gleam at the bottom), a **wind-worn bench** at the
cliff edge, and the **cairn**. Fixed layout seed — landmarks never move; forage reshuffles daily.

**Star-gleaning — the first activity gated by clock and sky, not tool tier.** On CLEAR days
(only) the summit spawns ~10 Starlight Shard nodes; they refuse daylight with a warm line and
glean after dusk for Mining 90 XP and a 120g curio — with a **6% chance of true Star Metal**
per fresh node, deliberately behind the same per-day dedupe as the shard itself (caught in
dev: rolling the bonus before the dedupe would have let repeat-pressing farm the 6% all
night — verified closed with a 50-press hammer test). By day: mountain thyme and snowdrops
(Farming forage), and honest scree stone.

**The panorama.** The cairn opens a full-screen procedural painting of the whole valley at the
game's native 320×208 — sky by the hour (dawn/day/dusk/night, sun or moon and stars), the
grove's dark mass, the farm with its chimney smoke and one lit window after dark, the village
and the Guild, the umbrellas on the sand, the Gullwater winding to the sea, the coast road
running north — and, blinking at the far edge, **Marrow Point's light**. Weather paints over
everything (rain streaks, fog haze, snow). One static scene, never a live second camera; click
or any key climbs down.

**Balance — rewritten by its own review.** The glean launched at 120g + Mining 90 XP per node,
ungated: two verifiers independently proved that made the summit a **~1.4k-gold, 900-XP nightly
printer available from day 2** — bigger than the v2.0 starfruit printer the balance playbook
records nerfing, and a Mining 1→9-in-one-night leveling bypass. Both re-simulated the shipped
generator byte-for-byte (real RNG, 1000 days) to size it: mean 8.55 nodes/clear night, not the
nominal 10. Shipped numbers: **Starlight Shard 42g** (top of the ungated-forage band — the
beach's own ~350g/day envelope is the precedent), **Mining 14 XP** (forage-class), star-metal
trickle at **3%**. Time-averaged across weather, the summit now adds ~250g/day of dead-hours
income plus the trickle — a treat with a real prize inside, not a second economy.

**The rest of the review (7 findings, all fixed pre-ship):** the panorama's one-shot key
listener dangled after click-close and would silently swallow one future keypress (proper
removeEventListener on every close path); the panorama was invisible to `uiBlocking()` so the
26:00 forced sleep could play out *underneath* the opaque overlay (it now blocks like a panel
AND `doSleep` force-closes it); the Marrow Point light never actually blinked (painted once —
now a slow repaint interval, cleared on close); a ~0.2%-of-days RNG alignment could wall off
one summit tile beside the cairn (nodes now keep their distance); and a self-caught exploit
from dev: the star-metal roll originally sat before the per-day dedupe, so repeat-pressing a
picked node could farm it (verified closed with a 50-press hammer test).

Verified in-browser (muted): trailhead both directions with the mine intact, full geometry,
node counts, rain-day = no shards, the day-refusal line, fresh gleans at the new numbers
(42g/14 XP), the cairn-box clear across 125 day-seeds, panorama open/close lifecycle (blocks
while open, no swallowed keys after, sleep closes it), the dusk panorama + night summit
screenshots, atlas (13 maps), clean console.

---

## v3.42.0 — "Starlight" · 2026-07-17 · tag `v3.42.0`

Owner art call (DEVLOG): deepsilver and star metal "look too alike… make the star one better —
maybe it glows more; perhaps a little bit of purple."

**The problem.** Both ores wore pale silver-blue (`#9ab0c8` vs `#a8c8e8`) — at 16px in a dark
corridor, twins. **The fix moves only the star** (the gap should come from one side): star metal
goes **violet** (`gem #d8b0ff / col #b088e8`) — the Starstone's own family, which the fiction
already claims ("the star gem comes off the same celestial deposit") — with three changes that
compound:
- The vein sprite gains **white-hot cores** in every fleck plus two extra flecks (a special case
  in the otherwise-generic `buildRocks`).
- The vein **casts a light**: a `starmetal` case in `collectLights` — r22, violet, breathing on a
  slow sine — so the deep floors literally glow where the star fell. ("Glows more", made literal.)
- The shard item (`oreCols`) and the Star tool-tier colour (`TIER_COL[6]`) follow the vein to
  violet — the old ice-blue tier colour sat one hue off deepsilver's, the same near-collision.

Verified in-browser (muted): side-by-side vein + item sprites screenshotted (clearly distinct),
`collectLights` emits the violet pool for a placed vein, clean console.

---

## v3.41.0 — "Provisions" · 2026-07-17 · tag `v3.41.0`

Owner follow-up to the v3.40 sweep: *"should apply the same ui for buying stuff too… also,
should display how many you have of each item (similar ui to selling) even when buying."*

**Steppers on the buy side.** Seeds, food, and saplings — everything bought in multiples —
gain the same `[−] [box] [+] [buy]` cluster (one shared `qtyCtl()` helper renders it). The
purchase functions (`buySeed`/`buyFood`/`buySapling`) take an optional count and **clamp to
the purse**: ask for 20 with coin for 12 and you get 12, one toast, said plainly. Call-site
audit: the three new onclicks are the only callers, so the widened arities break nothing.
One-of-a-kind rows (hive, machines, bouquet) deliberately keep single buy — a stepper on a
capped or gift-gated item would be a lie.

**Owned badges everywhere.** Every buy row now shows `×N` held — seeds in the bag, buns in
the pack, hives and machines waiting to be placed (the décor tab already had "×N in bag") —
so you never buy blind. Locked seed rows show the badge too, but no stepper.

Verified in-browser (muted): the ×7 badge, buying 10 seeds exact, the clamp edge (999
requested with 95g → exactly 3 bought, 5g change), hive/machine badges, a 3-sapling
purchase, screenshot of the tab (owned + locked rows), clean console. Review scope:
this is a pattern-extension of the just-reviewed v3.40 widgets (same input guard, same
stepper, same escaping); the fresh surface — the three clamps and call-site arity — was
verified behaviorally and by grep above.

---

## v3.40.0 — "The Quartermaster" · 2026-07-17 · tag `v3.40.0`

Owner UX call (DEVLOG): a **quantity-controls sweep** — "give the option to modify the
quantity… this goes for a lot of the interfaces so do a sweep."

**The diagnosis.** The game's "one button, no menus" cozy reflex had quietly become "no
control" at every surface where quantities matter: pledges drained everything on hand in one
click; machines auto-picked their input with "no selector icon or UI anywhere"; the sell tab
hid the owned count exactly when the demand note appeared, and sold one-or-all only.

**1 — Selling (the owner's explicit design).** Every sell row now carries
`[−] [number box] [+] [sell] [all · total]` — clickable arrows around a real `<input>`, sell
exactly N, or the lot. The owned `×N` is ALWAYS visible; the demand note *appends* instead of
replacing it (it used to hide "how much do I have left" mid-selloff, the worst moment). One
supporting fix with teeth: **the global keydown handler now ignores events targeting
INPUT/TEXTAREA** — typing "3" in a quantity box must never select hotbar slot 3.

**2 — The machine chooser.** A new `machPanel` (the gift panel's pattern): when a sawmill,
keg, jar, or press is empty and you carry **more than one** thing it accepts, a picker opens —
icon, count, and what each input becomes (`Pine Wood ×12 → 10 Pine Lumber`). With exactly one
valid input it loads instantly — the old one-button reflex kept where a menu is pure friction.
Both paths land in one shared `loadMachineWith()` that **re-validates** (machine still there,
still empty, item still held/valid) because the world can change while a panel is open.
`MACHINES.sawmill` gains the `accepts` field the v3.33 refactor gave everyone else — the
chooser asks every machine the same question.

**3 — Pledge portions.** `contributePledge(id, frac)`: **[a little]** (10% of the *total* cost
per resource, min 1), **[half]**, **[all]** (the old behaviour, and the default for every old
call site). Chunks are portions of the total, not the remainder, so "a little" stays a
consistent step however far along the pledge is. Applies to every ledger — lift stops and
waystones alike.

**Review findings (3, fixed pre-ship):** the input keydown guard swallowed **Escape** while a
quantity box had focus, leaving the primary close key silently dead (Escape now *blurs* the box;
the next Escape closes the panel as ever); the chooser priced products as `input × mult`, showing
Fine Cheese at 248g when it sells for 250 (it now shows the product's real `ITEM_SELL` price);
and the atlas step hadn't yet run at review time.

Verified in-browser (muted): stepper math, sell-N and the ×25-with-demand-35% display
(screenshotted), the two-woods chooser → pine picked → 10 milled, the single-option instant
load, "Fine Cheese (250g)" exact, Escape-blur behavior, pledge chunks to the gold piece
(900g/6 elder/1 ore/1 diamond on a 10% click), 'all' completing, clean console.

---

## v3.39.0 — "The Counterweight" · 2026-07-17 · tag `v3.39.0`

Owner balance call (DEVLOG): *"The costs of saving the minecart elevators are crazy… too
expensive, coins-wise especially. It just doesn't make it worth it."*

**The diagnosis.** The Old Lift's stop costs past floor 20 doubled every 5 floors —
`6000 × 2^((n-20)/5)`: floor 50 = **384,000g**, floor 65 = **3,072,000g** — a prestige tail
written (v3.15/v3.20 era) when nothing below floor 45 mattered. v3.38 moved deepsilver to floor
50+ and star metal below 65, turning the exponential into a wall across the game's main road.
The owner's "coins-wise especially" points at the gold term, and the code agrees: past floor 20
the *materials* plateaued while the *gold* exploded.

**The fix.**
- Floors 5–20 unchanged (500/1,500/3,000/6,000g — never the complaint).
- Past 20 the gold climbs **linearly**: +3,000g per stop — 9k at 25 … 24k at 50 … 33k at 65.
  Each stop is a few good late-game days; the whole shaft 5→65 sums to ~189k, roughly HALF of
  one old floor-50 stop. A long-arc project, not a fantasy.
- The deepest stops (45+) sink the deep tier's own neighbours — **Heartwood 25 + Cobalt Ore 10**
  — instead of a fourth identical helping of elder + gold ore. Still exactly one Diamond (gems
  keep their life beyond Tom's counter).
- **The settlement fix:** `contributePledge` now checks funded-ness FIRST. The old order tried
  to take a deposit before checking, so a pledge left over-funded by this very price cut would
  toast "nothing on you that it still needs" forever and never complete. Now an over-funded
  ledger settles the moment you visit the stop, no deposit needed. (Deposits already made above
  the new price aren't refunded — nothing is taken, and the ledger completes in your favor.)

Verified in-browser (muted): the full cost table floors 5→65 (24,000g at 50; 33,000g at 65;
heartwood/cobalt shift exactly at 45), the over-funded-pledge settlement with empty pockets,
and the normal deposit path regression. Clean console.

---

## v3.38.0 — "One Ladder" · 2026-07-17 · tag `v3.38.0`

Owner balance call (DEVLOG, same day as v3.37): *"match the tiers of the rocks with the tiers
of the trees (so higher requirements where possible)."*

**The diagnosis.** After v3.37 the two gathering ladders disagreed — rocks 1/10/20/30/40/50/60,
trees 1/8/18/30/45/70/85 — and the disagreement hid a mirror image of the exact bug v3.37 fixed:
the Star **axe** (tool gate WC 60) required silverwood that takes **WC 85** to chop. v3.37
straightened the ore side; the tree side was still backwards.

**The fix — one ladder, two skills.** Both ladders (and the tool tiers) now sit on
**1 / 10 / 20 / 30 / 45 / 70 / 85** — the *higher* of the two old values at every rung, per the
owner's parenthetical. Rung for rung: oak↔stone, pine↔copper, maple↔iron, willow↔gold,
elderwood↔cobalt, heartwood↔deepsilver, silverwood↔star metal.
- Trees: pine 8→10, maple 18→20 (the rest already sat on the unified rungs).
- Rocks: cobalt 45, deepsilver 70, star metal 85. XP/hp untouched — only gates moved.
- `TIER_LEVEL` → [1,10,20,30,45,70,85]: **no tool anywhere asks for an ore or wood above its own
  level, in either skill.** No index shift this time → no migration; forged tools untouched.
- Mine bands re-seat: deepsilver from floor 50, star metal below 65 — each arriving ~15-20 floors
  before its level, the shallow bands' own lead ("desire ahead of ability", the grove's rule —
  whose invariant survives the tree raises: ring 3's gate 12 still covers pine@10, ring 4's
  gate 20 covers maple@20).

A side effect worth naming: this quietly delivers the v3.32 audit's **#4** ("Mining 50–99 is a
desert") — the signature skill now has live targets at 45, 70, and 85, exactly like the axe.

Verified in-browser (muted): both ladders + tool gates read back unified, upgrade transactions
at the new gates, depth bands, ring-invariant spot-check, clean console.

---

## v3.37.0 — "The Long Ladder" · 2026-07-17 · tag `v3.37.0`

Owner balance call (DEVLOG 2026-07-17): *"the path to the star tools is too difficult, there
should be 1-2 tiers more before that… kinda unreasonable to need silverwood for the upgrade
right after gold tools."*

**The diagnosis.** The ladder was base → Copper (10) → Iron (20) → Gold (30) → Star Metal (40),
and the Star rung demanded the whole endgame at once — silverwood beams, heartwood, a Starstone,
and star metal itself, *an L50 ore feeding an L40 tool* (backwards). One step after Gold's
5,000g + maple, the price of everything.

**The fix — two rungs and a re-seat, on the existing symmetry.** The ore ladder's own rule
("a new ore every 10 levels") extends cleanly:
- **Cobalt tools at L40** — the ore existed since v3.17 as a sink-only material; now it forges.
  7,500g + Cobalt Ore 6 + **Willow Wood 60** (mid woods — the exact fix for the owner's
  silverwood complaint).
- **Deepsilver at L50** — a NEW ore (veins from floor 35, L50 to mine, XP 1050 / sell 370, both
  interpolated on the v3.19 curve between Cobalt and the shard). Tools: 10,000g + Deepsilver
  Ore 6 + Elder Wood 50.
- **Star Metal moves to L60**, its ore to L60 and floors 45+ — the crown's cost is UNCHANGED;
  what changed is that it now sits at the top of stairs instead of across a chasm. Each tier's
  signature ore is minable exactly at that tier's own level, the whole way up.
- `TIER_POWER` extends [.., 7, 9, 11]: old Star owners land on 11 — a small buff, never a nerf.

**The migration that matters.** Tier indices shifted, so a pre-v3.37 save's `tools[t] === 4`
means *Star Metal*, which is now index 6 — unremapped, every veteran's star tools would silently
read as Cobalt (a downgrade; the cozy contract forbids it). `migrateSave` remaps 4→6 once,
guarded by `flags.ladder6`; `startNewGame` stamps the flag so a post-v3.37 save's legitimate
Cobalt tools are never touched. Verified: remap, guard, and idempotency.

Everything else was already generic: `canTiles` uses `tier >= 3`, vein/item sprites build from
`ORES`, the shop iterates the arrays. The two non-generic spots — the shop's `HOE_PERK`/
`CAN_PERK` arrays (would have printed "undefined" for the new rungs) — were extended.

**Review findings (3, all fixed pre-ship):** the Collection's "Materials" hand-list omitted the
one collectible this release adds (Deepsilver Ore invisible in the museum AND mis-bucketed in
the bag) — the ore sublist is now **derived from `ORES`** so the next ore can't be forgotten;
the atlas generator's heading said "Tools — four tiers each" over a seven-row table — now
derived from `TOOL_TIERS.length`; and the Starstone drop-rate comment still cited the old
"(Mining 50, floor 35+)" gate — updated, with a note that the 0.30 per-vein roll keeps the
shard:Starstone *ratio* (the number that actually tunes the Star tier) invariant under the
deeper band.

Verified in-browser (muted): the full climb Gold→Cobalt→Deepsilver→Star with exact mats/gold
per rung, skill gates, the remap in all three cases, depth bands at 38/48/60 (no star metal
above floor 45), shop rendering all seven rungs, deepsilver sprites, the derived museum list
(in ladder order, no duplicates), "Tools — 7 tiers each" in the regenerated atlas, clean console.

---

## v3.36.0 — "The Coast Road" · 2026-07-16 · tag `v3.36.0`

**The world grows** — `WORLD_EXPANSION.md` area 1, the first new map since the Grove Depths
(v3.3), and the owner's direction call made real: build where the fiction already points.

**The map.** `coastroad`, 46×26 outdoor, east along the shore from the beach: the headland,
the packed-earth road, and the **Gullwater** — the valley's first river — coming down under a
plank ford to its estuary. At the road's end: the weathered ferry landing (grey plank dock,
mooring post), a roadside shrine, and the milestone: **MARROW POINT — 39**. The road is drawn
running on past the boundary; Act II's forty miles stay forty miles, permanently — the landing
is where the map *chooses* to stop, and the milestone says why.

**Generation discipline (the beach model, split seeds):** the *layout* (road, river, ford,
landing, trees) sits on a fixed seed — landmarks never move — while the forage nodes reshuffle
on a daily seed. Daily regen via `mapCache`; zero persistence work, zero migrateSave.

**River fishing.** `waterHere()` learns two new contexts on this map — the channel is
`"river"`, the mouth and shore are `"estuary"` (split at the player's row: you fish the bank
you stand on). New fish on the existing value curve: **Chub** (L8/85g), **Grayling**
(L35/680g — between Koi and Moonperch), and the **Rainrunner** (L25/550g) — the Stormrider's
*cousin*, a regular fish gated `weather:"storm"` exactly as the winter fish are season-gated
(the pool filter grew one clause). Trout is rehomed to the river its examine always claimed,
kept in the pond table too so no save's routine breaks mid-season. The estuary carries the
salmon run and the Gulf Sturgeon. The beach's +1 pool bonus deliberately does NOT apply here —
the river differentiates by species, not tier.

**The rest.** Daily roadside forage (samphire on the tideline, sea holly on the headland — both
priced inside the shore curve, both in the Collection); landmark examines with real stories in
them; and **Elias walks up every fourth day** to stand at the landing he sailed from, with four
location-specific lines that beat his heart-tier dialogue while he's there (the farm-pond spawn
yields those days, so he's never in two places).

**Registration** (everything the atlas throws without): MAPS, MAP_REGION + a seventh world-map
region, WORLD_MAP node, the CSS grid gains a `coastroad` cell, MAP_ACCESS prose, sprites ×7.

**Adversarial review found 4 issues; all fixed pre-ship:**
- **A duplicated east-band block in genBeach** — an artifact of an interrupted session turn:
  the band edit landed twice, shipping TWO adjacent Coast Road signs with mismatched mileage
  strings. Merged to one block. (Process note: after any interrupted turn, re-read the region
  you were editing before resuming — the first half may already be on disk.)
- **The palm loop could eat the sign** — `put()` has no occupancy guard and the palm range
  covers (42,5); a verifier re-simulated the exact RNG stream over 400 days and named the ten
  days the landmark would have flickered out. The surviving sign sits at x=43 — one column past
  the palm loop's reach — with a comment saying exactly why.
- **Elias double-booked on festival dates** — the Star-Watch lands on a `%4` day *every year*
  (YEAR_DAYS ≡ 0 mod 4, so festival residues are permanent), putting him in the beach cast and
  at the landing simultaneously. The landing spawn now yields to `beachEvent()` — a festival
  always outranks the landing, matching how the world map already resolves it.
- **The river pool was empty below Fishing 8** — every other water has a level-1 anchor; without
  one, a beginner's every cast fell through to the pre-existing `FISH[0]` fallback and the
  flagship river handed out sea Sardines. The Gullwater now has its **Minnow** (L1, 18g —
  "barely a mouthful, endlessly pleased with itself").

Verified in-browser (muted): full geometry spot-checks (road/ford/river/sea/dock/landmarks/
warps both directions/road-clear sweep), both fishing contexts by position, the storm gate
(Rainrunner in the storm pool only), Elias's fourth-day spawn + landing lines + festival
stand-down, exactly one sign at (43,5) across all ten flagged palm-collision day-seeds, the
Minnow anchoring the level-1 river pool, atlas regen (12 maps), clean console, and screenshots
of the ford and the landing.

---

## Planning — `WORLD_EXPANSION.md`, the world-expansion plan · 2026-07-16

Docs-only; no game change, no version bump, no atlas regen. Adds `WORLD_EXPANSION.md` and links
it from `README.md`/`AGENTS.md`; the owner's feedback is recorded in `DEVLOG.md`.

**Why.** Owner direction call: *"the world feels small too, maybe we should start planning to
build out more areas in the game."* The diagnosis (from a code-grounded scout of the map graph +
every place the fiction references): ~18 releases of content have deepened the same 11 maps while
the dialogue kept referencing places that don't exist — Act II's coast road north and Elias's
"forty miles", Tom's wife's dairy "down the coast" (five invocations), the river the Trout
examine claims, the mountain above the mine. The world feels small because the fiction is bigger
than the map.

**The plan.** Four independent area designs (north/south/river/mountain angles), judged and
merged into three, sequenced by fiction-cheque size × build cost, each one-release-scoped with a
file-level build sketch against the engine's real cost model (MAPS entry, gen fn, warp bands, the
per-map-id switches, atlas registration):
1. **The Coast Road** — the Gullwater river (fishing's new `river`/`estuary` contexts), the ford,
   and the ferry landing with its MARROW POINT — 39 milestone. Marrow Point itself stays off-map
   forever — walkable would deflate "forty miles".
2. **Starfall Ridge** — the mountain above the mine; star-gleaning on clear nights (the first
   clock-and-sky-gated activity), alpine forage, and the panorama the story keeps narrating.
3. **Butterbrook** — the coast dairy and its keeper (the game's first new NPC since launch),
   the milk round closing the v3.33 dairy chain. Deliberately last: inhabitants are now the bar.

Key synthesis rule: **the river exists once** — three candidates independently claimed river
fishing; a river drawn on three maps is three ponds, drawn once with a mouth on the sea it's
geography. The fourth candidate (Millbrook/Upriver) was cut for exactly that duplication.

Open questions for the owner are listed per area in the plan (ferry cadence, the dairy keeper's
name, panorama budget, hearts-at-v1).

---

## v3.35.0 — "The Flock" · 2026-07-16 · tag `v3.35.0`

The v3.32 re-audit's **#2 priority** — "the most-touched living things are the least written."
The barn animals the player pets every morning had no names, no voice, no visible friendship.

**Names.** `ANIMAL_NAMES` pool (24, no overlap with `HORSE_NAMES`); `nameAnimal()` assigns at
purchase, deterministically (day + flock size — no reroll save-scumming). The first hen a farm
*ever* gets is **Sir Cluckington** — Pip's coop-raise line ("I'm gonna name one Sir Cluckington")
was two releases of foreshadowing, now paid off at the shop counter. `migrateSave` names every
existing animal (hen #1 becomes Sir Cluckington retroactively — he was Sir Cluckington all along).

**The bond, visible.** `flockHearts(c)` renders 5 hearts at 50 friend apiece — chosen so the
invisible `friend >= 180` Large-produce threshold sits at ~3½ hearts: the hearts a player watches
grow ARE the road to the good pail. Pet toasts now carry name + hearts; examining an animal (Q)
gets the horseLook treatment — 3 species × 3 friendship tiers of lines (stranger → friend →
family). And the first time an animal gives its best (Large Egg / Large Milk / Prize Fleece), a
one-time firstTimber-style beat names the mechanic — backfilled off `discovered[]` so veterans
don't get it on their four-hundredth egg.

**The fair-weather yard.** On clear, non-winter days `spawnAnimals` gains a farm branch: the
flock spawns in the grass strip in front of its buildings as the *same wrappers* as indoors — so
petting, the day's egg/pail/coat, the E-prompt, and the draw loop all work in the open air with
zero new code (they were already generic over `curMap.animals`). The one real addition is a
`home` + leash on each yard wrapper (`updateAnimals` steers homeward past 40px) — interiors have
walls; the open farm needed a reason a hen never ends up in the crop rows. Rain, storms, fog,
snow, and the whole of winter keep everyone in. `migrateSave` clears any yard wrappers that got
serialized into `state.farm` (they're rebuilt on every map entry — nothing may pet a detached
copy).

**Adversarial review found 5 issues; all fixed pre-ship.** The one for the ages: **Sir
Cluckington would have spawned entombed in the minecart** — chicken #0's preferred yard tile
(14,7) is exactly `CART_A`, the railcart's tile on any save with the minecart line funded, and an
animal spawned at a blocked tile's centre can never step out (the move check tests the destination
tile; every sub-pixel step from a centre lands on the same tile). The update's marquee animal,
frozen walk-animating inside a minecart you could ride *through* him. Fixes:
- **`freeSpot` probe at spawn** — every yard stamp scans neighbours if its preferred tile is
  occupied (railcart, player kegs/décor — 11 of the 14 tiles were plantable) and stays in for the
  day if nothing nearby is free.
- **Leash pocket fix** — the homeward override ran every frame, making the blocked-step reroll
  dead code; a verifier *simulated it* and froze the hen against the coop wall in 166/200 trials.
  The homeward step now probes ahead (diagonal → x-only → y-only) and yields to the wander's
  reroll when all three are blocked.
- **Examine is tile-precise** — the radius-14 test let a hen on a *neighbouring* tile hijack the
  shipping bin's Q-examine; now the animal must occupy the faced tile.
- **Prompt honesty** — facing an unripe crop, the E-prompt could point at a passing hen while E
  answered the crop; the prompt now respects interact()'s crop-first order.

Verified in-browser (muted): naming (first-hen guarantee, distinct pool picks), yard spawn +
rain/winter gating, leashed wander + pocket recovery, the railcart/keg dodge (hen → (15,7), cow →
(21,7), both mobile), pet toasts with hearts, all three examine tiers + tile-equality both ways,
first-Large firing once, backfill (names + firstLargeProduce + stale-wrapper clear), and a
screenshot of the yard alive — hens scratching by the coop (egg-ready glow), cow and sheep by the
barn.

---

## v3.34.0 — "Small Talk" · 2026-07-16 · tag `v3.34.0`

The v3.32 re-audit's **#3 priority** — the "shipped ≠ integrated" defect class. Ice fishing,
geodes, and the star monuments all *worked* and no NPC ever said a word about any of them. This
is the pure-text fix: seven recognition beats on channels that already exist.

**The lines.** Bram gets three: a winter-fishing *tip* (the first winter talk once Fishing ≥ 10 —
pointing at the Frostfin and "something clearer than the ice itself"), and reactions to the first
Frostfin and first Glassperch landed. Pip gets two: urgent questions about treasure inside rocks
(and one worry about Gary), and begging a turn at the Great Telescope. Rowan reads the star
obelisk against the founders' vault; Maya has watched the crystal spire glow from the meadow.

**The plumbing (small, deliberate):**
- `pendingRecog` entries may now omit `flag` and gate purely on `when()` — the ice tip is
  condition-shaped (a season + a skill), not event-shaped, and inventing a fake flag for it
  would've been worse. Existing entries unchanged (`!r.flag || state.flags[r.flag]`).
- Three flag setters: `landFish` stamps `first_<name>` for season-gated fish (the legend branch
  returns before it, so Frostjaw-the-legend correctly doesn't collide), `crackGeode` stamps
  `crackedGeode`, décor placement stamps `placed_<kind>` generically (future décor recognitions
  are one data entry away).
- **`migrateSave` backfills all of it** — `discovered[]` already remembers every item ever held,
  and the farm's objects record what stands, so a save that caught the fish or raised the
  monuments *before* v3.34 earns its lines on the next visit. Integration debts should be paid
  retroactively, not only forward.

**Review finding (fixed pre-ship):** the ice tip's `when()` gated only on season+skill, so a
player who'd already caught the winter fish (any pre-v3.34 save, or anyone whose first Bram talk
after a catch landed off-season) would get the *discovery* tip **after** the congratulations —
Bram introducing fish he'd already toasted. The tip now also stands down once either
`first_<fish>` flag is set: a discovery beat delivered late reads as the character forgetting.

Verified in-browser (muted): all seven lines fire once on their flags/when and never repeat, the
tip's season+skill gate **and** its stand-down after a catch, backfill precision
(Glassperch-discovered sets its flag, Frostfin absent stays absent, a curio sets crackedGeode),
clean console.

---

## v3.33.0 — "The Dairy" · 2026-07-16 · tag `v3.33.0`

The v3.32 re-audit's **#1 priority**: the Cheese Press, closing the barn's dead-end produce
(§3.5 — Milk and Large Milk were the last goods with no processing chain) and §3.4's
"gift the first machine" rule in one release.

**The machine.** `MACHINES.press` — Milk→Cheese (135g), Large Milk→Fine Cheese (250g), one
night, max 2. Both wheels are ×1.5 on the keg discipline (processed goods earn their margin
from the wait). One night — the fastest per-night rate in the cellar — is deliberate: unlike
crops, the input is capped by cow count, so the press can't be scaled into a faucet the way a
keg wall can. Cost is **Oak Lumber 6 + Iron Ore 2 + 1,100g** — built from *milled* lumber so
the sawmill chain feeds it (the cross-skill rule the buildings follow).

**The refactor that made it possible.** The keg/jar/sawmill all took "anything grown" via one
global `machineLoadable()`. A milk machine broke that assumption, so each `MACHINES` entry now
declares `accepts(n)` + `wants` (its own error line); the shared interact branch became
`case "keg": case "jar": case "press":` reading `M.accepts`/`M.wants`. `machineLoadable`
survives as the growable predicate keg/jar delegate to. Everything else — placement, lifting
(`digUp`), the nightly `tendCellar` tick, the shop row, the hotbar — was already generic over
`MACHINES` and needed zero changes (verified, not assumed).

**The gift.** Tom's v3.24 barn-recognition line ("my wife down the coast will be thrilled for
the milk trade") gets paid off: a second `NPC_RECOG` entry on the same `proj_barn` flag —
first-unacked-wins, so the promise and the parcel land as two separate visits — carries a new
`give:` field, and `pendingRecog` now hands the item over with the line. The first press is
the dairy's gift; more are on Tom's shelf after that.

**Adversarial review found 9 issues; all fixed pre-ship.** The instructive ones:
- **The economy one:** Cheese at 135g vs Tom's 120g shop Milk was the game's *first*
  buy-low-sell-high loop from a shop staple (+15g/press/night, riskless) — a direct violation of
  the balance playbook's "craft only from player-gathered inputs" rule. Shop Milk is now **160g**
  (still there for cooking; pressing bought milk is now a 25g loss). Farm milk keeps the honest
  ×1.5.
- **The promise ones:** the shop listed the press unconditionally, making the release note
  ("your first press is a gift; more on his shelf after that") false for anyone who opened the
  shop first — the row and `buyMachine` are now gated on `ack_tom_press`. And the gift itself
  now carries a `when:` guard (a `NPC_RECOG` entry can wait for its moment) so a surplus press
  can never be forced on an owner.
- **The integration ones:** `INTERACT_KINDS` (the floating "E" cue), `OBJ_TITLE`, and
  `EXAMINE_OBJ` all hardcode kinds — the press was missing from every one (a placed press
  examined as *grass*). All added; the sawmill's identical pre-existing `EXAMINE_OBJ`/`OBJ_TITLE`
  gap fixed in passing. Plus three text bugs: the placement toast said "bring it something
  grown" (now uses the machine's own `wants`), "1 nights" (singular fixed), and
  "2 cheese presss" (plural now says *presses*).

Verified in-browser (muted): wants-toast with no milk, best-pail selection (Large Milk over
Milk), overnight → Fine Cheese collect, plain Milk → Cheese, Tom's gift (line + press + ack,
skipped for owners, fires for non-owners), shop hidden-then-shown around the gift, blocked
pre-gift purchase, keg regression (still takes Turnip, never Milk), generic `tendCellar` tick
confirmed in code, placement/load/cap toast wording, all four sprites screenshotted, museum
entries, clean console. (Cache-buster went to v=71 — bumped twice this release since files
changed again after the first bump; the number's job is to change, not to match the version code.)

*Dev-save note:* the localStorage test save on the dev machine was clobbered during
verification (the game's unload-save raced two snapshot restores; the third attempt wrote a
stale `undefined`). It was a throwaway day-1 test save — rebuilt fresh via `startNewGame()`.
Lesson recorded for future sessions: neutralize `saveGame` *before* restoring a snapshot.

---

## Design re-audit — v3.32 scorecard refresh · 2026-07-16

Docs-only; no game change, no version bump, no atlas regen. Fresh four-pillar graded audit
(Cozy base / Progression / Story+Whimsy / Presentation, four independent auditors + a synthesis
pass) of the v3.32.0 build against `GAME_DESIGN_PRINCIPLES.md` and `GAME_BALANCE_PRINCIPLES.md`,
written into `DESIGN_SCORECARD.md` above the v3.23 section (kept as history).

**Why now.** The v3.23 audit's 11-item ranked list is exhausted — #1 and #3–#10 shipped across
v3.24→v3.32, #2 shipped by half (geodes, but no L70/L90 ore), #11 remains audio-deferred. The
audit→build→re-audit loop needs a fresh ranked list to aim the next arc.

**Headline:** overall **A− held** (fourth audit running), floor materially higher. The new
cross-pillar thesis: *the most-touched living things are the least written* — nameless barn
animals with dead-end produce, Elias with no heart events, a banner-only wedding, Mining's
49-level back-half desert, and three new systems (ice fishing, geodes, monuments) that work
mechanically but that no NPC ever mentions ("shipped ≠ integrated" — a new defect class the next
arc should close). Twelve ranked priorities follow in the scorecard; #1 is the Cheese Press dairy
chain, #2 naming the flock, #3 the voiceless-systems text pass.

---

## v3.32.0 — "The Storyteller" · 2026-07-16 · tag `v3.32.0`

Design-audit priority **#8**: a quest-point meta-currency + one bespoke-mechanic quest step.
Three pieces that land as one feature — Quest Points, Grandpa's last riddle, and the quest cape.

**Why.** Two audit findings (§4.4): every quest objective in the game is a numeric threshold or a
flag someone else sets — nothing asks the *player* to solve anything — and nothing sums the light
content into a chase-able meta-goal the way RuneScape's Quest Points do. The fix is deliberately
RuneScape-shaped, since that's the game's stated progression identity.

**1 — Quest Points.** Every `QUESTS` entry gains a `qp` weight (errands 1, capstones 2–3, the
finale 4; **26 total** across 15 quests). The critical design call: `questPoints()` **derives the
sum from `state.questIdx`** — the chain is strictly linear, so completed quests are exactly
`QUESTS.slice(0, questIdx)`. No new save field, no migration, and retroactively correct for every
existing save. (`state.questDone` was deliberately rejected as the source of truth: it's
write-only, and old saves had it backfilled *empty* by migrateSave's generic loop, which would
have zeroed a veteran's ledger.) Completion now banners `✦ +N QP` first — the ledger is felt at
every turn-in, not discovered in a panel — and the Journal's Quests tab carries a
`✦ Quest Points — X/26` header in the existing wings-strip style.

**2 — One Last Letter (the bespoke step).** A 15th quest, **appended, never inserted** —
`questIdx` is a raw index, so a mid-chain insert corrupts every save. Grandpa's last envelope
holds a *riddle* ("under the sign that bears our name — a single step below it"), pointing at the
farm sign genFarm always stamps at (3,8): the player must read the world and **dig at (3,9) with
the hoe**. Mechanics that matter:
- The hook sits at the top of the Hoe branch and fires **on the swing at the spot, ignoring tile
  state** — an already-tilled tile isn't in `TILLABLE` and a growing crop blocks tilling, so
  gating on a successful till could soft-block the story (cozy contract).
- The objective flag `keepsakeFound` is brand new, so a finished save can't instant-complete the
  quest (the scout flagged this exact trap: `checkQuests` auto-advances NPC-less givers the moment
  objectives pass).
- The giver is "Grandpa's Letter" (not in `QUEST_GIVER_NPC`), so **the find is the turn-in** — no
  report-in; the sender is gone, and that's the point.
- The keepsake is **Grandpa's Pocketwatch**, a charm (+5% Farming XP in `addXP`, the established
  Wren-Feather pattern; `sell:0` once-per-valley like the Forester's Band). It's excluded from the
  canopy-nest charm pool (its story is the dig), and that pool got an empty-pool fallback while I
  was there (pre-existing edge: all charms discovered → `give(undefined)`).

**3 — The quest cape.** `DECOR.storybanner` ("Storyteller's Banner", 500g — the cape-vendor nod)
gated by `flags.qpAllTold`, which `checkQuests` sets once `questIdx >= QUESTS.length`. A flag, not
a QP compare, on purpose: if later releases append more quests, the banner **stays earned** —
nothing is ever taken. In Tom's décor tab it renders **locked, not hidden** (🔒 + Tom's refusal
line + live `✦ X/26 Quest Points`): a quest cape you can't see isn't worth chasing. `buyDecor`
carries the same guard server-side.

**Review findings (adversarial pass), both fixed before ship:**
- The dig hook originally keyed on `facingTile()` alone — but a tier-1+ hoe's `canTiles` sweep
  can *till the riddle tile while facing a neighbour* (the right answer reading as a miss), and
  standing ON (3,9) targets the sign and toasts "Can't till there." The hit test now covers the
  hoe's whole swing area **and** the player's own feet — the correct answer can never feel wrong.
- The banner's bespoke examine line was dead code: the v3.13 décor IIFE stamps
  `EXAMINE[name] = blurb` for every DECOR entry *after* the literal. The line now assigns after
  that loop (the v3.30 lumber pattern), so the owner reads the earned line, not the shop tease.

Verified in-browser (muted): the full dig cascade in one swing (flag → pocketwatch → auto-complete
→ 26/26 → qpAllTold → grandpa's dialog + `✦ +2 QP` float, screenshotted), the two review scenarios
(wide-sweep + standing-on-spot) firing and two negatives (far swing; quest inactive) not, charm XP
105 vs 100, locked row + guard block at 8/26, unlock + purchase at 26/26, journal header in both
states, both sprites, nest exclusion, clean console. Files: 01-data (qp ×15, quest, charm, décor,
EXAMINE, VERSION, in-game CHANGELOG), 09-quests (questPoints/questPointsTotal, QP banner,
qpAllTold), 08-actions (dig hook, addXP charm, nest pool), 10-ui (journal header, locked shop row),
13-content (buyDecor guard), 03-art (pocketwatch + banner sprites).

---

## v3.31.0 — "Ice Fishing" · 2026-07-16 · tag `v3.31.0`

Winter's renewable pillar (design-audit priority **#9**). Two winter-exclusive fish —
**Frostfin** (L15, 300g, pond + coast) and **Glassperch** (L48, 1000g, coast only).

**Why.** Winter is the one structurally thin season. Farming stops (crops not in
`season.includes("Winter")` are cleared at the turn), the orchard drops its fruit, and the
apiary yields nothing (`hiveYield` returns 0 in winter). What's left — fishing, mining,
woodcutting — all works in winter but is *identical* to every other season, so winter had no
renewable reason that was *its own*. The four-pillar re-audit flagged this: winter needs a
season-specific loop, not just "the other seasons, minus farming."

There *is* a winter catch already — the legend **Frostjaw** — but a legend is a one-and-done
trophy (`caught_<id>` flag), not a loop. So the gap is specifically a **renewable** winter pull.

**The fix — winter ice fishing.** Fishing is the natural cozy fit for a frozen coast, and the
fish system already auto-inherits everything a new catch needs. Two fish were the smallest change
that turns winter fishing from "same as summer" into "the only time these bite":

- **Data:** `FISH` gains a `season` field (legends already had one; regular fish never did). Two
  entries carry `season:"Winter"`; every existing fish has no `season` and stays always-eligible.
- **Gate:** one clause in `hookFish`'s pool builder — `(!f.season || f.season === curSeason())` —
  so a season-gated fish only enters the pool in its season. `WATER.pond`/`WATER.coast` list the
  new fish; the season filter does the actual gating (verified: winter coast has both, summer coast
  has neither, pond winter gets Frostfin only since Glassperch is coast-only, and the L48 Glassperch
  stays level-gated out for a low-level angler even in winter).
- **Everything else is free.** Sprites (`drawFish` + palette), the Cooked variant, `ITEM_SELL`
  (raw + ×1.75 cooked), `EDIBLE` (22 + lvl), `EXAMINE` flavor (raw + cooked, hand-written), the
  Almanac, Tom's per-item demand pricing, gifting, and the Collection "Fish" category all pick the
  new fish up with no extra wiring — the same reason the v3.10 deep-water fish were cheap to add.

**Balance.** Season-gated means a 28-day window per year, so a modest premium is the reward for
casting through the cold, not a faucet. Frostfin (300g @ L15) sits just above Salmon (240 @ L20);
Glassperch (1000g @ L48) sits between Moonperch (780 @ L40) and Silvergill (1080 @ L55) — squarely
on the existing fishing value curve, not above it. No new gold sink or income spike; winter simply
gains two catches to complete and a reason to keep a rod on the frozen coast.

**Cozy contract.** Untouched — nothing hazardous, nothing taken; just two more fish to find, and
only when the water skins over with ice.

Files: `game/js/01-data.js` (FISH ×2 + `season`, WATER pools, EXAMINE ×4, VERSION, in-game
CHANGELOG), `game/js/08-actions.js` (season clause in `hookFish`). Verified in-browser (muted):
season gate across seasons + levels, all auto-integrations, and both sprites (+ cooked) rendering.

---

## Reference docs — `GAME_BALANCE_PRINCIPLES.md`, the balancing playbook · 2026-07-14

Docs-only; no game change, no version bump, no atlas regen. Adds one new reference doc,
`GAME_BALANCE_PRINCIPLES.md`, and links it from `README.md` and `AGENTS.md`.

**Why.** The reasoning behind every gold / XP / progression decision is *recorded* — spread
across 35 releases of this changelog, the owner's verdicts in `DEVLOG.md`, the graded audits,
the plan docs (`ECONOMY_REBALANCE.md`, `GROVE_DEPTHS.md`), and terse comments in `01-data.js`.
But it was never *distilled*: an agent about to change a number had to re-derive the whole
history to avoid repeating a mistake we already made and fixed. The genre's hardest problem —
balancing a Harvest Moon / Stardew economy against a RuneScape 1–99 grind — deserves a single
prescriptive playbook, not a scavenger hunt.

**What it is.** A principle-first companion to `GAME_DESIGN_PRINCIPLES.md` that *operationalizes*
its economy/progression/psychology sections rather than restating them. Every principle carries a
real anchor from our own history (the "one faucet, one key" collapse → the split-key fix; the v2.7
XP overshoot → v2.8 "early levels must be earned"; the gem faucet nerfed to a treat; "a waystone
must never waste the trip"; "an ore must never out-value a common gem"). It ends with a runnable
**balancing checklist**, a **failure-mode graveyard**, a **one-lesson-per-release timeline**, and a
**live reference-numbers appendix** (the XP curve, crop g/day trend, tool-tier ladder, `GEM_SELL`,
ore/wood ladders, `DEMAND` constants, mine spawn coefficients).

**How it was built & checked.** Distilled from the full audit trail via a fan-out review of every
source doc plus the code/comments (157 balancing decisions extracted), synthesized, then run through
an adversarial critique pass. Every *current-state* number in the appendix was verified against the
live code (`XP_TABLE` `inc()`, `TIER_COST`/`TIER_LEVEL`, `GEM_SELL`/`GEM_WEIGHTS`, `DEMAND`, `DECOR`,
`WOOL_REGROW`, `DIFF_MAX`, `genMine` coefficients, the 30% Starstone roll) before shipping, so the
doc's ladders are the numbers of record, not a paraphrase that can drift.

## v3.30.0 — "Loose Ends" · 2026-07-14 · tag `v3.30.0`

Version code **67**. The v3.23 re-audit's **#10** — small verifiable tails, batched.

- **Bespoke lumber examines (`01-data.js`).** The seven milled boards shared one templated examine line
  (`"Milled from <x> — squared, stacked…"`), a tone step-down from the raw woods' hand-written flavor
  (§7). Replaced with seven distinct lines — honest oak, pale quick pine, close-grained maple, springy
  cheap willow, dark elder from the deep grove, stubborn heartwood, luminous silverwood.
- **Migrated-save stable z-overlap (`11-title.js` `migrateSave`, fix).** The v3.28 `onStableSite`
  respawn-exclusion stops *new* ridge rocks landing on the stable footprint, but a save whose stable was
  built *before* that fix could already have a rock sitting on the footprint, drawing over the stable's
  back wall (§8.1). `migrateSave` now clears any ore object whose tile falls in the stable's `site` rect
  (the wall tile stays), so the stable stands clean on load. Verified directly: footprint rocks cleared,
  off-site rocks untouched.

(The re-audit's third #10 item — a hue audit of a few hand-authored shadow ramps against the v3.14
hue-shifted `shade()` — is deferred: it needs per-ramp art judgment, not a mechanical sweep, and is
lower-value than the remaining structural items.)

Verified in-browser (muted): all seven lumber examines are distinct and non-templated; the `migrateSave`
ore-clear removes footprint rocks and keeps off-site ones; console clean. (No separate review agent — the
change is a set of examine strings plus one guarded, directly-verified rect loop.)

## v3.29.0 — "Starfall" · 2026-07-14 · tag `v3.29.0`

Version code **66**. Closes the v3.23 re-audit's **#3** — the terminal-resource dead-end. The Star Metal
tool tier was the *only* consumer of Cobalt / Star Metal Shard / Silverwood / Heartwood / Starstone, and
the Heartwood/Silverwood **Beams** the Sawmill makes had *zero* build recipe — so once the tools were
forged, the deepest ores, woods, and beams reverted to sell-only, re-breaking §3.5 (rewards are inputs).
This gives them a **repeatable** downstream sink, together with the v3.28 geode this completes the mine's
endgame loop.

### The star tier — prestige monuments from the deep (`01-data.js` `DECOR`, `13-content.js`, `10-ui.js`, `03-art.js`)
- Three new décor pieces in Tom's catalogue, each **costed in terminal materials** as well as coin:
  - **Crystal Spire** — 6,000g + 4 Geode Heart + 10 Gold Ore (a sink for v3.28's rare geode prize).
  - **Star Metal Obelisk** — 8,000g + 4 Star Metal Shard + 6 **Silverwood Beam**.
  - **Great Telescope** — 12,000g + 8 Cobalt Ore + 6 **Heartwood Beam** + 1 Starstone.
- Between them they consume every terminal material the tools left stranded *plus* both orphaned Beams,
  and they're **repeatable** — placed like any décor up to the `DECOR_MAX` cap — so the deep keeps paying
  forward instead of dead-ending. The décor system gained an optional `mats:{}` field: `buyDecor` now
  checks materials (after gold, before any deduction — a failed buy takes nothing) and `take()`s them on
  purchase; the shop shows the per-material requirement colored by what you hold. Existing gold-only décor
  is unchanged (`D.mats` absent → same as before).
- Cozy/exploit-safe: the monuments are pure prestige — never entered in `ITEM_SELL`, so there's no
  buy-with-materials-then-sell-for-gold laundering loop; the axe lifts them back like any décor (no
  material is ever destroyed).

### Verification
In-browser (muted): the three star pieces show the correct gold + material costs; `buyDecor` **refuses**
the obelisk without its Star Metal Shard / Silverwood Beam and, once granted, buys it and **consumes 4
Shard + 6 Beam**; all six sprites (placed + carried) register; the three monuments render distinctly
on the farm (screenshot — a violet crystal spire, a pale star-metal obelisk, a brass telescope); console
clean. Focused adversarial review (buyDecor atomicity / no-sell-exploit / load-order / sprite bounds /
render).

## v3.28.0 — "Geodes" · 2026-07-14 · tag `v3.28.0`

Version code **65**. First half of the v3.23 re-audit's **#2** (the RuneScape endgame dead-end): Mining
L50–99 is a 49-level content desert — Star Metal Vein L50 is the last mineable noun and the deep mine had
no *repeatable* treasure feeding the farm the way the grove's canopy nests do. This adds that treasure
(and softens the richness clamp so deep runs finally out-pay camping, balance §6), cozily and *without*
re-opening the gem/gold faucet the economy spent v3.16–3.20 nerfing.

### The geode — the mine's canopy nest (`13-content.js`, `08-actions.js`)
- Past **floor 25**, a rare **geode** sits among the stone (`geodeP = 0.004`, ~0.25/floor). Crack it with
  the Pick and it splits open — `crackGeode`: **56% a mineral curio** (Amber / Obsidian / Trilobite /
  Quartz Cluster), **30% a gem** (via the existing cheap-weighted `pickGem`), **10% a rare Geode Heart**,
  **4% a Starstone**. It's the mine's answer to the grove's nests — Collection first, coin a distant
  second, so the deep pays in *wonder* rather than becoming a gold faucet (curios sell 26–90g and never
  out-earn a worked field; the gem/Starstone tail is bounded by how rare geodes are). Mined through the
  gemrock branch (hp `6 + depth/4`), so it depletes and cracks exactly once.

### The Deep — a new Collection page (`01-data.js`, `10-ui.js`, `03-art.js`)
- Five new curios with hand-written examine flavor and pixel sprites (amber with a gnat, black obsidian, a
  trilobite fossil, a quartz cluster, a crystal-lined Geode Heart), grouped under a new **"The Deep"**
  Collection category between Materials and The Canopy — a completionist reason to keep diving.

### Deeper is richer (`13-content.js`)
- The **ore** density clamp moved from `min(depth,20)` to `min(depth,40)`, so a run keeps enriching with
  ore all the way to floor 40 instead of plateauing at 20 — the frontier finally out-pays shallow camping
  (§6), the exact gap the re-audit flagged for the Mine. **Gem** density was deliberately left clamped at
  `min(depth,20)`: doubling it at floor 40 would re-open the gem-gold faucet the economy spent v3.16–3.20
  nerfing (the one number the pre-ship review flagged to eyeball), so deep runs get richer in *material*,
  not in *coin*.

### Verification & a caught bug
In-browser (muted): geodes spawn only past floor 25 (5 over 20 floors at depth 30; **0** on shallow floors);
`crackGeode` runs over 200 cracks without error and drops curios; all six sprites register; **the "The
Deep" Collection page renders with all five curio sprites** (screenshot); examine reads for the geode and
each curio; console clean. **A load-order (TDZ) bug was caught and fixed pre-ship:** the curios' `EXAMINE`
lines were first written at line ~537, *before* `const EXAMINE` (line ~1089) — a runtime crash that broke
everything after it in `01-data.js` and that `new Function` syntax-checks can't see (CLAUDE.md: "const
initialization order still matters"). Moved them below the declaration; the game now initializes fully
(`CROPS`/`RECIPES`/`EXAMINE` all present). Focused adversarial review (load-order sweep / crack-mine
correctness / balance of the clamp + faucet / regression).

## v3.27.0 — "Rowan's Workshop" · 2026-07-14 · tag `v3.27.0`

Version code **64**. Closes the v3.23 re-audit's **#5** and the *original* owner request the construction
arc had quietly dropped: *"the introduction to construction could be through a quest, specifically through
building the chicken coop."* What shipped in v3.21 was a tip + a Ledger transaction — and the coop's own
blurb writes a cheque ("Rowan will walk you through the joinery") the game never cashed (§4.4). This gives
construction a voice, **without touching the fragile linear `QUESTS` spine** — two beats keyed to build
events, reusing the existing `startCutscene` machinery.

### The joinery scene (`14-story.js` `coopRaiseScene`, `08-actions.js`)
- The **first time you raise the coop**, Elder Rowan comes to see it: a short cutscene (sfx → a sparkle
  over the new roof → three of his lines → the raise banner) where he reads the oak sills and stone footing,
  tells you the making of a home was the *tenth craft the Guild never counted*, and declares his workshop
  open — build on from the Ledger. It's hooked in `maybeBuildCeremony` (`p.id==="coop" &&
  !state.flags.coopSceneSeen`), so it replaces the plain banner for the coop's first raise and fires once;
  the barn and stable keep the v3.24 banner ceremony. Because it fires from the raise queue, it lands the
  same safe moment the ceremony does — on the farm, after the sleep card — never mid-fade (guarded by
  `paused` + `curMap.id==="farm"`). `startCutscene` sets `paused`, so the loop can't re-enter it. Existing
  saves that already built the coop simply never queue it (it's an on-ramp for new builders).

### First Timber (`08-actions.js` Sawmill collect)
- The **first board you ever mill** comes with a one-time reflection in Rowan's voice — timber as "a tree
  that's decided what it wants to become" — a small welcome to the carpenter's trade that points you to the
  Ledger. Gated on `state.flags.firstTimber`; the lumber is given first, so the beat never eats the reward.

### Verification
In-browser (muted): the coop-raise scene fires once (Elder Rowan portrait + cinematic letterbox +
sparkle over the coop — screenshot), sets `coopSceneSeen`, and a second coop / the barn fall back to the
banner; First Timber fires once; console clean. Focused adversarial review (cutscene-from-loop re-entrancy /
timing & existing-save behaviour / scene well-formedness / First-Timber gate / regression).

## v3.26.0 — "In the Saddle" · 2026-07-14 · tag `v3.26.0`

Version code **63**. Closes the v3.23 re-audit's **#6** — three horse gaps in one bundle: the mounted
composite read as "a rider floating above a pony" (§8.1), the game's first movement mechanic had no felt
moment (§8.2), and the idle horse had no examine, reopening the "#1 free whimsy channel" on the
most-looked-at new object (§7).

### A properly tacked horse (`03-art.js`)
- `horse_side/down/up` redrawn with a **saddle blanket + saddle leather seat + stirrup**, a beefier
  barrel, and four staggered legs. The saddle seat sits exactly where the rider lands (rider `bob -= 8`),
  so mounted now reads as *riding* — the rider straddles the horse instead of standing in front of it —
  and the v3.23 idle stall horse now reads as *tacked up, waiting*. Same canvas sizes; the left-flip mirror
  and mounted alignment are unchanged.

### A felt mount/dismount (`08-actions.js`)
- Swinging up now kicks a dust `pPuff` + a `pRing` + `cam.shake=1.6`; hopping down does the same, lighter.
  The dust is gated behind the *announced* dismount only — the silent auto-dismount `setMap` fires when you
  ride into a building never spawns particles or shake mid-fade.

### An examinable, named horse (`08-actions.js`)
- Examine your horse — in the open stall (facing it) or from the saddle — and it gets a name the first time
  (Biscuit, Clover, Pumpkin…, set once in `state.flags.horseName`), plus a rotating deadpan line about its
  frank opinions on grass and carrots. `horseLook` is checked in `examineFacing` **after** the crop/NPC/object
  checks and before the bare-tile fallback, so it only speaks for the stall horse or for empty ground while
  mounted — examining a tree or a neighbour from horseback still shows the tree or the neighbour.

### Verification
In-browser (muted): the mounted side-view shows the rider seated on a saddled horse (screenshot); examine
returns the named horse both mounted and at the stall ("Biscuit…"); mount fires dust + ring + `cam.shake`,
dismount fires dust + shade, neither errors; console clean. Focused adversarial review (horseLook gating /
mount-juice silent-dismount safety / sprite bounds / regression).

## v3.25.0 — "Spring in the Step" · 2026-07-14 · tag `v3.25.0`

Version code **62**. Closes the v3.23 re-audit's **#7** — the exact Juice gap the *v3.11* audit already
named and no release had touched: the game's only scale-overshoot was the item-pop icon; player motion
was integer-bob only and crops merely swayed. §8.2 explicitly lists *watered crops* as a squash-&-stretch
site. This is pure *feel* — no rule, timing, or balance change.

### Watered-crop stretch-pop (`07-entities.js` `drawCrops`, `08-actions.js` Can)
- The frame a growing crop drinks, it gives a quick happy stretch — a gulp up and a bounce back. When the
  Can waters a tilled tile that holds a crop, the crop is stamped `cr.wt = animT`; `drawCrops` then eases a
  `ctx.scale(0.85→1 width, 1.28→1 height)` over ~0.45 s (`e = 1-(1-kk)²`), **anchored at the base** (the
  translate sits at the crop's foot) so the roots stay planted and only the leaves spring. `.wt` is a
  transient session-relative stamp: a value carried over from a prior session (large vs the fresh small
  `animT`) simply fails the `kk ∈ [0,1)` guard — no pop, no NaN, nothing to migrate.

### Player swing impact-squash (`07-entities.js` player entity)
- The swing lands with a little weight now: while `swingT > 0` the player `drawChar` is wrapped in a
  `ctx.scale(1, sqy)` anchored at the feet, `sqy` dipping to ~0.88 at mid-swing (`sin` ease) and back to 1
  — a subtle compress on the impact. Player-only (keyed off the global `swingT`, applied solely in the
  player entity block, so NPCs/animals never squash); can't collide with the mounted-horse draw since tool
  use is blocked from the saddle.

### Verification
In-browser (muted): a staged row of turnips watered across the pop window renders the stretch gradient
(freshest = tallest), the swing squash path runs, `.wt` stamps on watering; no render errors on any path;
console clean. Focused adversarial review (ctx save/restore balance · NPC isolation · `.wt` persistence ·
transform anchoring) — save/restore, isolation, and anchoring all verified clean; it caught one real
(cosmetic) defect, fixed:
- **Phantom cross-session pop (fixed).** `cr.wt` rides along in `saveGame`'s `JSON.stringify(state)`, and
  since `animT` resets to 0 each load and climbs, a stored `wt` would eventually be *swept through* the
  `[0,1)` window — replaying the drink-pop ~`wt` seconds into a later session with no watering. Fixed the
  way `s.mounted` already is: `migrateSave` strips `wt` from every `farm.crops` entry on load, and
  `drawCrops` deletes it the moment the pop completes (`kk ≥ 1`), so it's never persisted or replayed.
  Verified: a finished-pop stamp is deleted, a fresh one kept, and no loaded crop carries a stale `wt`.

## v3.24.0 — "Raising the Roof" · 2026-07-14 · tag `v3.24.0`

Version code **61**. First release of the **"finish what shipped"** arc the v3.23 re-audit named: the
construction epic (v3.21–23) added the homestead and the horse but landed *systems-heavy and
ceremony-light* — a raised building completed with only a text line on the morning card, no villager
ever mentioned the transforming farm, and the buildings drew from Woodcutting alone. This closes the
audit's **#1** (a Presentation HIGH + a Story MEDIUM) and **#4** (cross-skill interlock) together.

### The raise ceremony — the payoff moment the arc was missing (`08-actions.js`, `12-game.js`)
- A building the crews finish overnight now gets a real moment, fired the instant you **see** it: a
  `pendingRaise` queue is filled in `newDay` (`built.filter(p => p.building)`), and a new
  `maybeBuildCeremony()` in the game loop holds until you've dismissed the sleep card and stepped onto
  the farm (you wake in the cottage interior, so its `curMap.id !== "farm"` guard defers it), then fires
  `banner("🏗 <Building> raised!", <done line>)` + a triple `pSparkle` burst over the structure's site +
  `cam.shake` + the upgrade sting. The bible's ceremony (§5.5) and acknowledgment (§8.2) tests, which
  tool-upgrades and legends already passed, now pass on the biggest builds too.
- Why a queue rather than firing in `newDay`: the raise happens overnight, but the *feeling* should
  land when the farm is in view — not behind the sleep-card overlay. The queue is a module var (not
  persisted), guarded by `paused`/`uiBlocking()`/`isCutscene()`, so it can't fire mid-transition,
  double-fire, or be lost (it waits patiently if you linger in the village).

### The valley notices — one-time NPC recognition (`13-content.js`)
- `NPC_RECOG`: the first time you talk to a villager after you've built something, they *notice* — one
  warm, one-time line each (§4.6 "saw your new barn!"): Tom on the coop (hens to sell) and the barn
  (dairy trade), Pip already naming a chicken, Rowan on the carpentry in your hands, Maya on seeing you
  ride past. Checked in `npcLine` **after** `npcStory` (an active story beat always speaks first) and
  gated by an `ack_*` flag so it fires exactly once, then falls back to the normal per-heart lines. On a
  migrated save that already has buildings, it plays as a nice retroactive nod the next time you visit.

### Buildings draw on more than the axe (`01-data.js` `PROJECTS`)
- Cross-skill interlock (GBP §2.3 / GDP §3.2), escalating with the build: **Coop +8 Stone** (a footing),
  **Barn +20 Stone +4 Iron Ore** (footings + nails), **Stable +24 Stone +6 Iron Ore +1 Emerald**
  (fittings + a gem set in the gate-post). Pure data — `fundProject`/`canFund`/the Ledger/the atlas all
  handle arbitrary item maps. Stone is abundant so the Coop stays an early build; the ore/gem escalation
  mirrors the oak→pine→maple lumber ladder and makes the homestead crave your mining as well as your
  woodcutting, honoring the v3.20 wood-nerf's "make gathering matter to spend."

### Verification
In-browser (muted): version 3.24.0; the three buildings show the new cross-skill costs in the Ledger and
the atlas; the ceremony fires on the farm (`banner` element takes class `show` with "🏗 <Building>
raised!" + the done line, sparkles render over the site, `cam.shake` set, `pendingRaise` consumed 1→0);
console clean. Focused adversarial review (ceremony lifecycle / NPC-recognition timing /
economy-soft-lock / regression) — verdict clean on the ceremony, economy, and soft-lock, and it caught
that the recognition lines were reachability-broken as first written, fixed before shipping:
- **Recognition reliability (medium, fixed).** The recognition check lived in `npcLine`, but `npcLine` is
  reached only after `npcStory`, whose unconditional plaza/festival filler swallowed it — and Tom, the NPC
  the notes lead with, is only reachable via the store *counter* object (`openShop`), never `npcLine` at
  all. So most of the promised nods never fired. Refactored into a `pendingRecog(id)` helper called from
  **`talkNpc`** (before the generic line, after story turn-ins/heart-events so those still win) *and* from
  **Tom's counter path** (his "fine coop you raised!" line now fires when you visit his store). Verified:
  all five nods resolve; `npcLine` no longer double-handles them; each fires exactly once.
- **Two buildings, one banner (low, fixed).** Funding coop + barn the same day queued two ceremonies that
  fired on consecutive frames, so the first "raised!" banner was clobbered before it could be read. Added a
  ~3.2 s cooldown (via `animT`) between raises so each banner lands.

## v3.23.0 — "The Paddock" · 2026-07-14 · tag `v3.23.0`

Version code **60**. A small polish pass on v3.22 — the gap I flagged shipping "The Stable": the stable
stood empty until you pressed **H**, so you never actually *saw* the horse the release was about.

**Your horse, visible by the stable (`07-entities.js`, `renderWorld`).** A single **render-only** entity
draws an idle horse standing in the stable's open stall whenever `curMap.id==="farm" &&
state.flags.proj_stable && !state.mounted` — with a slow "breath" bob (`Math.sin(animT*1.3)`). It reuses
the same `drawHorse` used for the ridden mount (side sprite facing left, into the farm). Press **H** near it
to ride out; dismount and it's back at the stall — which is exactly what the "ambles back to the stable"
dismount line already promises.

**Why render-only, not a world object.** Two real advantages over placing a `{kind:"horse"}` object:
(1) **Save-robust** — it shows immediately for any save that built the stable back in v3.22, with *no*
migration to add a horse object to an already-persisted `state.farm` (a v3.22 stable has no horse object).
(2) **No new surface** — no collision/`WALKABLE_OBJ`, no `INTERACT_KINDS`, no phantom "E" prompt hovering
over an invisible horse while mounted, no add/remove-on-mount bookkeeping. The `!state.mounted` guard makes
show/hide automatic: verified `drawHorse` is called **exactly once** whether idle or ridden — never a
double horse. The horse is non-blocking (you can walk past it, like the coop/barn animals), and y-sorts
into the entity list so the player passing in front draws over it.

Mounting is unchanged (still **H**, per the control hint and the stable's build blurb). E-to-mount by
walking up to the horse is a possible future touch, but it would reintroduce the world-object surface this
release deliberately avoids.

**Verification.** In-browser (audio muted throughout, per the owner's standing request): the idle horse
renders by the stable (screenshot); it disappears when mounted (the ridden horse draws instead — 1 draw
call in each state, never 2); the "What's New" panel shows v3.23.0; console clean. Single focused
adversarial review (position/guard/z-order/exception safety).

## v3.22.0 — "The Stable" · 2026-07-14 · tag `v3.22.0`

Version code **59**. Owner-directed, the capstone of the construction arc: *"an area to have a horse
for faster travel, just like in Harvest Moon."* Confirmed as a rideable mount (vs. point-to-point fast
travel). This is the game's **first-ever movement-speed mechanic** — until now the player has moved at a
single flat 68 px/s everywhere, with no mount, sprint, or terrain modifier.

### The Stable (a new building — no save migration)
- A third construction project (`PROJECTS`, `building:true`): **3,000g + 20 Oak + 16 Pine + 12 Maple
  Lumber + 40 Wood**, raised through the Ledger's "Farm Construction" panel exactly like the coop/barn,
  via a shared idempotent `stampStable(m)` (roof + back wall + sign; an *open-fronted* stall, no interior
  to enter — the horse is summoned, not stabled-and-entered). Because the stable **never existed before**,
  no migration is needed: `proj_stable` defaults unset for every save, so new and old alike must build it
  (contrast the coop/barn, which needed the `bornUnbuilt` discriminator because they used to be free).
- Site guard reused: the tightened `site`/`sign` footprint feeds the same `buildingSiteBlocked` +
  build-time re-check, so raising the stable never buries a crop either.

### The horse (`08-actions.js`, `07-entities.js`, `04-world.js`, `10-ui.js`)
- **`state.mounted`** — a transient flag (in `freshState`; force-reset to `false` in `migrateSave`, since
  you're never mid-ride on load). **Press `H`** (`rideToggle`) out in the open to mount once the stable is
  built; `H` again to dismount. Guards: no stable → nudge to the Ledger; indoors → "take it outside."
- **Faster travel:** `updatePlayer`'s lone speed constant becomes `state.mounted ? 118 : 68` (~1.75×).
- **Cozy contract, kept whole:** the horse is *summoned*, not a world object that can be lost or stranded
  on a daily-regenerating map — dismount anywhere and "your horse ambles back to the stable." Stepping into
  any non-outdoor map **auto-dismounts** at the door (`setMap`), so you never ride through an interior.
  Tool use is blocked from the saddle (`useTool` early-returns with a "hop down (H)" hint) — no invisible
  tool-swings. Nothing is ever taken; the horse is never hungry.
- **Art:** three procedural horse sprites — `horse_side` (mirrored for left), `horse_down`, `horse_up` — a
  warm bay coat with dark mane/tail/hooves. The rider is drawn lifted onto the horse's back
  (`drawHorse` beneath `drawChar`, rider `bob -= 8`), the horse's body/legs showing below. Tuned in-browser
  across all four facings (the first pass had the rider occluding the mount entirely — a pure z/lift issue,
  not a missing sprite).
- **Discoverability:** the control hint gains **Ride `H`**, and the stable's build blurb + `done` message
  tell you to press `H`.

### Verification
In-browser (audio muted throughout, per the owner's request): the Stable stamps correctly and gates behind
`proj_stable`; `rideToggle` mounts/dismounts; entering the cottage auto-dismounts; speed reads 118 mounted
/ 68 afoot; `useTool` is blocked mounted; the riding sprite renders in all facings (screenshots); console
clean. Note: the preview tab's rAF loop is suspended while backgrounded, so frames were forced via
`renderWorld()` for capture — an artifact of the harness, not the game.

**Adversarial review (three lenses) + fixes.** The review confirmed the `mounted` lifecycle and the
no-migration stable are sound, and caught one real defect plus polish, all fixed:
- **Stable site on the ore-respawn ridge (medium, fixed).** The stable's footprint (x28-31, y3-5) is the
  first building placed on the surface ore band (`respawnNodes` repopulates x26-43, y1-4), and that runs
  *before* `completeProjects` in `newDay` — so an overnight-respawned rock could block funding, or defer a
  just-funded raise ("the work begins at dawn" … then "clear the site"). Fixed by excluding the stable
  footprint from the ore respawn (`onStableSite`, reading the site straight from `PROJECTS` so it can't
  drift) — the headline build is now always fundable. (Coop/barn sit west of x26 and never hit this.)
- **`rideToggle` guards (low/nit, fixed).** Mounting was gated only by `uiBlocking()`, which is false during
  the inline fishing minigame and other non-panel states — so you could mount mid-cast, and cutscene/paused
  windows weren't covered. `rideToggle` now early-returns on `gameMode!=="play" || paused`, on an active
  cutscene, and refuses to mount while a line is out (mirroring `useTool`'s from-the-saddle block).
- **Cutscenes dismount you (nit, fixed).** `startCutscene` now dismounts first, so a festival or story scene
  never plays out on horseback. Plus a defensive `state &&` on the `setMap` auto-dismount (boot-safety).

## v3.21.0 — "The Sawmill" · 2026-07-14 · tag `v3.21.0`

Version code **58**. Owner-directed: a Harvest Moon-style construction system — mill wood into typed
lumber, and build farm structures from it, introduced through raising the chicken coop.

> "I want a construction system similar to Harvest Moon, where you could turn wood into lumber, and
> it will be different lumber types… you'll need different types of lumber to construct different
> things. The introduction to this construction could be through … building the chicken coop. This
> way, you could have a chicken coop and eventually a barn, and then an area to have a horse."

This is the first of the construction arc (Sawmill + Lumber + Coop + Barn here; the Stable + horse
follow). The owner chose **"start empty, build all"** — new farms begin as open land and are built up.

**Two facts from the codebase map shaped the design.** (1) The game *already* had 7 named wood
species (Oak→`Wood`, Pine, Maple, Willow, Elder, Heartwood, Silverwood), so "different lumber types"
map straight onto them — no new taxonomy invented. (2) The Coop and Barn *already existed*, hard-coded
into `genFarm` from day one — so "building the coop" required turning existing free structures into
built ones (with care for existing saves).

### Lumber (`01-data.js`, `03-art.js`)
- **`WOOD_TO_LUMBER`** maps each raw species to a board: Oak Lumber, Pine Lumber, Maple Lumber,
  Willow Lumber, Elder Lumber, and the premium **Heartwood Beam** / **Silverwood Beam**. `WOOD_NAMES`
  and `LUMBER_NAMES` sets back it.
- **Lumber sells for exactly its raw wood's value** — deliberately *no* value-add. Milling-to-sell
  only burns a night for the same coin, so there's no wood money loop (the whole point of v3.20's
  wood nerf); lumber is a thing you make to *build*. Over-milled boards still sell back at cost, so a
  mistake is never a loss (cozy contract). Sprites: a stack of squared boards tinted per species,
  distinct from the round raw log.

### The Sawmill (`01-data.js` `MACHINES`, `08-actions.js`, `07-entities.js`)
- A new artisan machine, cloned from the Cellar pattern but adapted: it takes **wood** (not crops),
  mills a **batch** (up to `batch:10` logs of the species you carry the most of → that many boards)
  in a single night (`days:1`), and its output feeds construction. 1,200g + 30 Wood + 3 Iron Ore,
  `max:3`.
- The generic MACHINES plumbing carries it for free — placement (`plantPermanent`), lift
  (`digUp`, extended to return `obj.qty` boards), nightly tending (`tendCellar`), hotbar selection,
  and the shop buy-row all treat it like any machine. Only the **load/collect interact** is
  specialized (`case "sawmill"`): it stores `obj.item` + `obj.qty`, and keg/jar keep their own case
  (still crops-only), so the two never interfere. The morning summary line was generalized from
  "cellar batches finished aging" to "workshop batches finished overnight" to cover milled lumber.

### Buildings become built (`01-data.js`, `04-world.js`, `14-story.js`, `10-ui.js`, `13-content.js`)
- The Coop and Barn are now **PROJECTS entries tagged `building:true`** with a `site` rectangle. They
  reuse the proven, idempotent Restoration-Projects funding machinery (`fundProject` →
  `proj_<id>_pending` → overnight `completeProjects` → `applyProjects`). `genFarm` draws each only when
  `state.flags.proj_coop` / `proj_barn` is set, via shared idempotent **`stampCoop(m)` / `stampBarn(m)`**
  (the same tiles/door/warp/sign as before, factored out). `applyProjects` stamps them the morning
  after funding.
- **Coop**: 500g + 12 Oak Lumber + 15 Wood (the gentle on-ramp — all from oak, choppable at
  Woodcutting 1, teaching the chop→mill→build loop). **Barn**: 1,800g + 18 Oak + 14 Pine + 8 Maple
  Lumber + 30 Wood (stouter framing, varied lumber — "different lumber for different things").
- **Cozy site guard** (`buildingSiteBlocked`): funding is refused if a crop or a placed object sits on
  the building's footprint, with a message telling you to clear it — so raising a building can never
  bury (take) something you made. Crops harvest in time, so it's a delay, never a lock.
- **Animals gate on their building**: `buyChicken` needs `proj_coop`, `buyCow`/`buySheep` need
  `proj_barn`, each with a message pointing to the Ledger.
- **Ledger UI** (`projectsRowsHtml`) now renders a distinct **"🏗 Farm Construction"** section
  (buildings) above **"🔨 Rowan's Restorations"** (civic), sharing one `projectRowHtml` row builder.

### Save migration — the `bornUnbuilt` discriminator (`11-title.js`)
The hard part: on reload, `migrateSave` can't tell "pre-v3.21 save (had a free coop)" from "new v3.21
game (coop not built yet)" by `proj_coop` being absent alone — both lack it. Mirroring the existing
`npxGame` era-flag pattern: **`startNewGame` stamps `state.flags.bornUnbuilt = true`** (this save was
born in the construction era, farm empty). `migrateSave` then does
`if(s.flags.bornUnbuilt === undefined){ bornUnbuilt=false; proj_coop=true; proj_barn=true; }` — so a
**pre-v3.21 save keeps both buildings** (already baked into its persisted `state.farm`), while a
**new-era save is skipped** (it must actually build them, and a save/reload can't gift a free coop).
`freshState` deliberately carries none of these flags, so the discriminator never goes stale under the
generic backfill (the "dead-code trap" the migrate comments repeatedly warn about).

### Discovery nudge (`08-actions.js`)
A one-shot `tutTip` (new-player saves only) fires once you've chopped ≥4 wood, pointing to the
Sawmill→lumber→Ledger loop — so construction is discoverable without a forced quest interrupting the
linear story chain. The animal-shop gates and the Ledger's own "Farm Construction" copy reinforce it.

### Verification
In-browser against a real save: migration granted `proj_coop`/`proj_barn` and kept both door warps;
a fresh mock `genFarm` with the flags off produced **no** coop/barn door (empty new farm);
`stampCoop`/`stampBarn` raised them; `tendCellar` milled Pine Wood → Pine Lumber overnight;
`buildingSiteBlocked` caught a crop on the coop site and cleared after; `buyChicken` refused without a
coop; the Ledger rendered both the built and the fundable views (screenshots); the Sawmill sprite
renders in-world; console clean.

**Adversarial review (three lenses) + fixes.** The review confirmed the `bornUnbuilt` migration is
sound (no old-save strand, no free-coop gift via save/reload), then caught one real cozy-contract hole
and several polish items, all fixed before shipping:
- **The fund→build window (medium, fixed).** `buildingSiteBlocked` guarded only *fund* time. A player
  could fund the coop on clear grass, then plant a crop (or place a machine) on the footprint that same
  day; the overnight `stampCoop`/`stampBarn` would wall it over, permanently burying the crop — a
  "nothing is ever taken" violation. Fix: `completeProjects` now **re-checks the site at build time**;
  if it's re-occupied it leaves the project pending (doesn't stamp) and toasts the player to clear it,
  retrying next morning — mirroring `put1`'s crop-safe "retry each morning" idempotence. Verified: a
  crop on the site defers the build and survives; a clear site builds.
- **Site over-reservation (low, fixed).** The building `site` rects included the sign's column, which
  for the barn sat in the nightly ridge-rock respawn zone — a regrown rock there could spuriously block
  funding. Tightened `site` to the exact structure rect plus an explicit `sign` tile, so only tiles the
  stamp actually writes are guarded.
- **Lumber Collection entry (low), a clearer "lift it with the axe" refusal for placed objects (nit),
  and a stale `applyBuildings()` comment (nit)** — all fixed.

## v3.20.0 — "Timber" · 2026-07-14 · tag `v3.20.0`

Version code **57**. Owner-directed wood-economy rebalance — the first, self-contained step of a
larger construction/lumber feature. The owner's words:

> "Wood is too easy to maintain, so let us change things. Make it so that the things that require
> wood are … five times more, and that they cost three times less [i.e. wood sells for ⅓] … so
> that they just don't make you too much money."

**The problem.** Woodcutting has a *renewable* venue — the Deep Grove regenerates ~370 trees every
night, plus the farm's nightly top-up — so wood supply is effectively infinite (v2.9.1, §2.2 of the
balance playbook). With wood also freely *sellable*, chop-and-sell had become one of the game's
laziest incomes, and the wood-hungry sinks the v2.9.2 rebalance introduced were trivial to satisfy.
The playbook's standing rule is *"wood value must never outrun the money crops"* and *"a gathering
skill that also out-earns farming breaks the intended hierarchy"* (§2.4, §3.4). Wood had drifted
toward being a soft money-printer.

**The fix — two levers, opposite directions (`01-data.js`).**
- **Sell values ÷3** across the whole timber ladder (`ITEM_SELL`): Wood 12→4, Pine Wood 28→9,
  Maple Wood 52→17, Willow Wood 34→11, Elder Wood 95→32, Heartwood 210→70, Silverwood 340→113. The
  ladder's *shape* is preserved uniformly, so the one deliberate anomaly survives intact: Willow
  (11g, a level-30 tree) still seats *below* level-18 Maple (17g) — the fast-XP camp that trains the
  skill without printing money. Woodcutting's reward is now honestly the **XP and the timber**, not
  the coin — exactly as Willow was always designed to be.
- **Requirements ×5** on everything you *build, craft, or upgrade* with wood, so a log is a real
  material cost instead of a rounding error:
  - Tool tiers (`TIER_COST`): Copper 10→50 Wood, Iron 10→50 Pine Wood, Gold 10→50 Maple Wood,
    Star Metal 8→40 Silverwood + 4→20 Heartwood. *(Note: `buyTool` charges `TIER_COST` **per tool**,
    so a completionist's full 5-tool set multiplies these again — the Star Metal tier becomes a
    genuine endgame timber grind. Called out so it can be dialed back if it bites too hard; the rest
    of the ×5 stands on its own.)*
  - Cellar machines (`MACHINES`): Keg 8→40 Pine Wood, Preserves Jar 6→30 Wood.
  - Old Lift restoration (`liftStopCost`): stop 5 20→100 Wood, stop 10 15→75 Pine Wood, stop 15
    10→50 Maple Wood, stop 20+ 12→60 Elder Wood (paid in deposits via the Pledge Ledger, so a big
    number is fine).
  - Rowan's Restoration Projects (`PROJECTS`): Minecart 30→150 Wood; Boardwalk 40→200 Wood +
    10→50 Pine Wood; Grove Arbor 10→50 Elder Wood + 15→75 Willow Wood.

**Scoping decision — what was deliberately *not* ×5'd.** Two wood sinks are small, non-construction
touches where ×5 would only add tedium without serving the "too much money" goal, and the ÷3 sell
already right-sizes their payout:
- **Noticeboard requests** ("bring Tom 8 Wood") — a *daily favour*, and its gold reward is
  `max(60, round(sell·qty·1.4))`, so the ÷3 sell already cut its payout to a third. Leaving the
  quantity at 8 keeps a daily errand from becoming a 40-log chore.
- **The one-time `driftwood` Act II story quest** (12 Wood + 3 Pine Wood) — a fixed narrative beat;
  ×5 would risk stalling the story behind a grind. Left as authored.

**Why supply still holds.** These numbers are large but the grove is infinite by design — a full
day's chopping still clears them. The change makes wood *matter to spend*, not *scarce to obtain*:
you gather the same wood, it just no longer converts to easy coin and it buys fewer things per log.
This is the deliberate groundwork for the construction/lumber system next — wood had to become a
precious material before it could become typed lumber and raised buildings.

**Docs in lockstep.** `GAME_BALANCE_PRINCIPLES.md` §2.4 (wood-ladder anchor), §4.4 (Star Metal tier),
§10.3 (tree table sell column), §10.5 (tool-tier costs), §10.7 (lift-stop table) all updated to the
new numbers of record.

**Verification.** Syntax-checked; every consuming call reads its number from the table at call time
(no consuming-code change needed, confirmed by the sink map); in-browser confirmation that
`ITEM_SELL` and every cost table now report the new values and the shop renders them; adversarial
review; console clean.

## v3.19.0 — "The Way Down" · 2026-07-14 · tag `v3.19.0`

Version code **56**. Owner-directed, two coupled changes to how the mine plays:

> "Instead of having a ladder appear at the corner of the level, we wanted it to be randomly
> under a rock, just one per floor, so that players are encouraged to mine all the rocks until
> they finally find the ladder for the level… similar to Harvest Moon and Sword of Val."
>
> "I want to make ores a little rarer, maybe by a factor of three, and because of that we should
> increase their XP gain as well, so that it feels more rewarding to mine. There should be
> generally more plain rocks without ore in the mines."

### The hidden stairs (`13-content.js`, `genMine` + `08-actions.js`, mining depletion)

- **The corner ladder-down is gone.** Every floor now hides its descent under **one** rock — a
  plain `stone` rock flagged `{stairs:true}`, dropped on a random floor tile at least `minDist`
  (`max(6, (w+h)/4)` ≈ 10 on the 24×16 floor) from the entry. Break it and it doesn't just vanish
  like ordinary stone: it places a `ladderdown` in its spot, toasts *"The rock crumbles away over a
  black shaft — the way down!"*, sparkles, and plays the upgrade sting. Then you press **E** on the
  revealed ladder to descend, exactly as before. The floor's subtitle reads *"the way down is here
  somewhere"* so the intent is legible from the first step.
- **Why this shape.** The genre reference (Harvest Moon / Story of Seasons / Sword of Val) makes a
  floor a *small search*, not a corridor to an exit. It also gives the "swing at everything" loop a
  real point: you're not grinding stone for its own sake, you're *looking for the door*. Pairs
  perfectly with the rarer-ore change below — the plain grey stone you break searching for the
  stairs is the same stone that now dominates a floor, so the two changes reinforce each other
  instead of fighting.
- **The cozy-contract guarantee (the hard part).** Descending must never become a level wall: a
  Mining-1 beginner has to be able to reach the stairs no matter what the RNG rolls. So after the
  stairs tile is chosen, `genMine` runs a BFS from the spawn `(ux,uy+1)` to it (floor / walkable
  props / mineable rock all count as passable); if it's sealed off, it **digs a straight tunnel**
  from the entry, clearing blocking props; then **every mineable node on the resulting route is
  converted to plain `stone`** — so whatever the path passes through, a green miner can always break
  it. The valuable (level-gated) veins are kept *off* the guaranteed path; they're the deep's
  optional reward, never a gate on the exit. Stress-tested: **0 failures across 600 floors**
  (depth 1–50 × 12 days), exactly one stairs rock each, always reachable digging only stone.
- **The Deep Run staircase still bypasses the search** (drops three floors and regenerates) — intended;
  the hidden stairs are the *default* mine's loop, the paid Pack Staircase is the express lane.

### Ore ~3× rarer, ~3× the XP; dense plain stone (`13-content.js` spawn, `01-data.js` `ORES`)

- **Spawn mix rebalanced.** Plain `stone` now dominates a floor (`rockP` ≈ 0.24) while valuable
  veins are ~3× scarcer (`oreP` ≈ 0.03 × depth scaling). A copper vein reads as a *find* again
  instead of wallpaper, and there's always plenty of stone to swing at while you search for the
  stairs — the two changes are the same change, really.
- **XP raised ~3× to match** so mining feels *more* rewarding, not slower, despite fewer strikes:
  copper **26 → 78**, iron **62 → 186**, gold **145 → 435**, cobalt **240 → 720**, star metal
  **520 → 1560**. Plain stone drops **12 → 8** (you break a lot more of it now; it shouldn't
  become a stealth XP faucet). Net: you swing more and strike ore less, but each ore strike counts
  for three, so per-vein reward goes up while per-floor grind stays honest. Follows the balance
  playbook's rule that scarcity and reward move together.

### Hardening (from the pre-ship adversarial review)

- Fallback stairs-pool branch now also excludes the **spawn tile** `(ux,uy+1)` (was excluding only
  the up-ladder and lift), so a future shrink of the mine map can never drop the stairs rock onto
  the player's spawn. Latent-only on the shipped 24×16 floor (the primary pool never empties), fixed
  anyway to keep the invariant true by construction.
- `m.meta.down` removed (kept `m.meta.up` as a diagnostic). It was a write-only vestige of the old
  fixed down-ladder; leaving a field named `down` pointing at an *unbroken* stone rock was a trap for
  a future agent who might trust it as a walkable portal. Nothing reads either field (verified by grep).

### Verification

- Three-lens adversarial workflow (connectivity/soft-lock · reveal-mechanic correctness ·
  regression/economy), each finding independently refutation-checked: **zero real defects**, two
  nits (both fixed above). Connectivity confirmed by the 600-floor stress test; the reveal→descend
  path live-tested in-browser (stairs rock breaks in 2 swings → `ladderdown` appears → **E** drops
  to the next floor, which re-hides a fresh stairs); console clean.

## v3.18.0 — "A Handful of Stars" · 2026-07-14 · tag `v3.18.0`

Version code **55**. Owner-directed: make the gems read like RuneScape's — a recognizable ladder —
and add a rare, story-tied top gem in the Onyx/Zenyte mold, kin to the star metal.

### Changed / Added (`01-data.js` unless noted)
- **Gem ladder → the RuneScape shape**: `GEMS`/`GEM_SELL`/`GEM_WEIGHTS` are now **Opal (60) ·
  Topaz (100) · Sapphire (160) · Emerald (240) · Ruby (340) · Diamond (520)**, humblest to grandest,
  weighted so Opal is common and a Diamond is an event. (Values stay low — gems are a treat, not the
  economy, and they're 5× rarer since v3.16.)
- **The Starstone** — a super-rare, star-themed, story-tied gem (the Onyx equivalent, 1800g). It is
  **not** in the ordinary gem-rock pool; it drops **~30% off a Star Metal vein only** (Mining 50,
  floor 35+ — same fallen deposit as the metal), and it is now **required to forge the Star Metal
  tools** (`TIER_COST[4]` gains `Starstone:1`), so the rarest gem crowns the finest tools. Reliably
  attainable — mining the 4 shards a tool needs already gives ~76% odds of a Starstone.
- **Gary is preserved.** Amethyst is no longer randomly mined or a museum gem, but it stays fully in
  the game as Pip's keepsake: its sprite, a Gary-flavored examine, the 2-heart gift scene
  (`give("Amethyst")` unchanged), and a kept 75g value so old Amethysts remain sellable. Pip's
  noticeboard request and gift-love shift to **Opal** ("a friend for Gary"), and the Gold Hoe's
  signature gem moves Amethyst → Opal.
- Examine lines for Opal, Sapphire, and the Starstone; the museum Gems row grows 5 → 7.

### Save compat
Data-only — no migration needed and none added: pre-v3.18 Amethysts stay sellable (`ITEM_SELL`),
the Collection recomputes its total live (no cached count, no completion reward to mis-fire), and no
new top-level state field. An old save's discovered-Amethyst flag is simply never re-listed.

### Review-driven
A focused adversarial pass **cleared all five risk areas with code evidence** (save migration, Gary
integrity, Starstone obtainability-vs-requirement — no chicken-and-egg, economy ordering, correctness)
— zero real defects. Its one nit (a stale "rarest gem (480)" comment on the shard price) is fixed.

*Verified live: `pickGem` rolls Opal→Diamond only (no Starstone/Amethyst); Starstone drops ~28% off
Star Metal veins and 0 off gem rocks; the Star Metal tool requires it; Gary sellable/examinable with
his sprite; Pip requests + loves Opal; the museum shows 7 distinct gem sprites; console clean. Atlas
snapshot v3.18.0.*

## v3.17.0 — "The Miner's Ladder" · 2026-07-14 · tag `v3.17.0`

Version code **54**. Owner-directed: make tiering RuneScape-clean (memorable, every-10-levels) and
**gate tool upgrades behind skill, not just materials** — hoarding ore shouldn't buy you an OP tool
you haven't earned the level to swing.

### Changed
- **Ore Mining ladder → every 10 levels** (`ORES`, `01-data.js`): stone 1, **copper 10** (was 1),
  **iron 20** (was 12), **gold 30** (was 28), **cobalt 40** (was 45), **star metal 50** (was 70).
  Stone XP 8→12 so the grind up to copper isn't a slog. You now start on stone and earn your way up.
- **Tool tiers gate on the tool's own skill** (`TOOL_SKILL` + `TIER_LEVEL=[1,10,20,30,40]`,
  `01-data.js`; enforced in `buyTool`, `08-actions.js`; shown + disabled in the shop, `10-ui.js`):
  Copper needs the skill at **10**, Iron **20**, Gold **30**, Star Metal **40**. Pick→Mining,
  Axe→Woodcutting, Hoe/Can→Farming, Rod→Fishing. The shop row reads e.g. "needs Woodcutting 20" in
  red until met. Materials + coin still apply on top — an upgrade is *earned across crafts*.
- **Stone everywhere early** so a Mining-1 beginner always has something to mine: the surface ore
  ridge is now ~⅔ stone with no surface gold (`genFarm` **and** the daily `respawnNodes`), and the
  shallow mine floors are stone-heavy (`genMine`: floors 1–4 are ¾ stone). Higher metals still first
  *appear* at iron@floor5 / gold@15 / cobalt@25 / star metal@35 — you see the next tier a few floors
  before your level catches up, RuneScape-style.

### Review-driven
A focused adversarial pass cleared the big risks (no soft-lock; `master-tools`'s "3 tool upgrades"
is a late quest reached with several skills already past 10 and the stat cumulative; every gating
skill is trainable to 10 on its *basic* tool — no chicken-and-egg; buyTool/shop indexing correct).
It caught two real **stale-level** misses, both fixed: the daily **`respawnNodes`** still used the
pre-v3.17 ridge mix (refilling the surface with unmineable veins + gold) — synced to `genFarm`; and
two **noticeboard `REQUESTS`** (Copper Ore, Iron Ore) still gated at the old mining levels — bumped
to 10 / 20 so the board never asks for ore you can't yet mine.

*Verified live: ore ladder 10/20/30/40/50; buyTool refuses below the level even with materials+coin
and allows at level; shop shows "needs <skill> <lvl>" and disables; a Mining-1 player mines ~75% of
shallow veins (stone); daily ridge respawns stone-heavy, no gold; noticeboard reachability correct at
Mining 5/10/20; `nextUnlock` reads the new levels; console clean. Atlas v3.17.0. Numbers are the
owner's spec — tune-friendly in one place each.*

## v3.16.0 — "The Long Dark" · 2026-07-14 · tag `v3.16.0`

Version code **53**. An owner-directed mine rebalance: the descent was too short and money too easy
(gems were a "quick money" faucet that made upgrades trivial). This stretches the whole climb and
makes the deep the reward. All changes are in `genMine` + the mine's `MAPS` entry (`13-content.js`);
the mine regenerates daily, so it applies immediately with no migration.

### Changed
- **Each floor is ~half the size** — `34×22 → 24×16` (area 748 → 384). Floors are quicker to work,
  so you descend more often and lean on the every-5-floors lift checkpoints, instead of exhausting
  one big cavern.
- **Ore tiers spaced far deeper** — the depth→ore table was rebuilt so a vein you can't yet mine
  never walls off floor 3 (the owner's specific complaint), and each metal is a real climb: **iron
  first at floor 5, gold at 15, cobalt at 25, star metal at 35** — roughly a 10-floor band each,
  gated by *both* depth and Mining level. Floors 1–4 are stone + copper (beginner-passable; the
  stone also feeds Deep Run staircases).
- **Gems ×5 rarer** — spawn probability `0.010 → 0.002`. They were a too-easy money shortcut. Rarity
  still climbs with depth (now scaling to floor 20, not capped at floor 6), so a deep run stays
  sparkly and the deep floors reward the committed — but you can no longer farm gems in the shallows,
  so a Diamond is an event again and every tool upgrade is earned. (Combined with the half-size
  floors, that's about **5× fewer gems per unit of playtime**.)
- **Per-floor variety / depth reward** — ore density now rises gently with depth (`0.10 → ~0.16`
  by floor 20) and gem rocks lean toward the prettier "crystal" variant the deeper you go, so
  pushing down visibly pays off.

### Verified
Simulated `genMine` across depths 1–50 × many days: floor 384 tiles vs 748; **no gold before floor
15, iron from floor 5, gold@15, cobalt@25, star metal@35** confirmed; gem count ~0.4/floor shallow
vs the old ~4–5. **Connectivity stress-tested (600 floors, depths 1–50): 0 failures** — the
down-ladder and lift are always reachable by mining through veins, and the up-ladder/lift are always
reachable so a player is never stranded (unclearable props never seal the path). In-browser: the
smaller floor renders clean and readable, gems glow, ladders reachable; console clean. Atlas v3.16.0.

*Numbers are the owner's spec (half size, ×5 gems, iron@5/gold@15) — tune-friendly if playtest wants
the bands wider or the gem floor higher.*

## v3.15.0 — "The Deep Run" · 2026-07-14 · tag `v3.15.0`

Version code **52**. The fresh audit's **#2 priority** (owner-greenlit): the mine froze time in v2.9
to be cozy, but that removed *every* trace of §6 expedition tension — push-your-luck, a time clock, a
prep/consumable layer. This restores all three **without touching the cozy contract**, because it's
opt-in and nothing is ever taken.

### Added — an opt-in **Deep Run**
- **A toggle in the Old Lift panel** sets `state.deepRun`. Only then does time flow underground
  (`updateTime`, `08-actions.js`); the default mine stays timeless. Time-of-day flowing is the whole
  expedition — and when 2am arrives the *existing* `doSleep` simply fades you home with your **entire
  haul** (the contract's "nothing is taken" — the only cost is the depth you didn't reach).
- **Staircases** (`STAIR_STONE=25`, `STAIR_DROP=3`): packed from bulk **Stone** at the lift — a real
  sink for the valley's most worthless rock (3g) — and "taken" to plunge three floors instantly, so
  you can pioneer the rich deep floors (v3.10's Cobalt/Star Metal, gems) before the clock runs out.
- The lift-panel framing spells out the safety ("sunrise sends you home with everything you've
  found"); a **⏱ marker on the clock** shows a run is live (the mine clock is otherwise frozen); a
  new-record toast celebrates reaching a personal-best depth.

### Cozy-contract & boundaries
Nothing is ever taken — verified by the review's dedicated cozy lens (no loss, no trap, no non-opt-in
time flow). `deepRun` clears at every boundary: `enterMine` (fresh surface entry = timeless),
`mineUp` out the mouth, `rideLift(0)` to the surface, `newDay`, and `beginPlay`'s reset block. A new
top-level `state.deepRun` needs no migration (undefined → falsy → timeless).

### Review-driven
A 3-lens adversarial pass (cozy-contract / time-edges / exploit-persist) cleared it with **zero
critical/high/medium** findings. Its three low/nits are fixed: `beginPlay` now clears a mid-run
tab-switch save's stale `deepRun` (so the ⏱ badge can't linger on the surface); `takeStairs` calls
`checkQuests()` like `mineDown` (so a depth objective credits on arrival); and the record milestone
uses a `toast` instead of a `banner` (which `setMap`'s map banner would have overwritten mid-fade).

*Verified live: timeless by default / flows on a run / off-mine time untouched; 2am fades home with
the haul intact; staircase pack (25 Stone→1) and descend (−1→+3 floors) with a record toast;
Staircase not sellable; every run-boundary clears the flag; the ⏱ clock cue; the lift panel renders;
console clean. Atlas snapshot v3.15.0.*

## v3.14.0 — "Warmer Shadows" · 2026-07-14 · tag `v3.14.0`

Version code **51**. The fresh audit's **#6 priority** — "two cheap high-propagation fixes" — that
between them nudge the two dimensions each has been pinned on: Visual Coziness (A−, since v1.5) and
the last stuck piece of Skill Progression.

### Changed
- **`shade()` now hue-shifts** (`03-art.js`), the §8.1 "#1 pixel-art rule" the audit flagged as
  unimplemented since v1.5. Instead of pure value scaling (`r*f, g*f, b*f` — which reads muddy), it
  rotates hue as it goes: **shadows lean cool/blue, highlights lean warm/gold.** One function, ~37
  call sites across the whole procedural atlas, so every tree, sprite, and object gets a little depth
  for free. Conservative magnitudes (clamped; ~10–14 units at typical `f`), verified non-degrading on
  the day and night farm. *(A whole-atlas shading tweak — worth an owner eyeball; easy to tune in the
  one function if a sprite reads off.)*
- **The level-up banner previews the next unlock** (`addXP`, `08-actions.js`). When a level-up
  happens to unlock nothing that level, the banner used to just say "Well done."; it now reads
  "Next: <thing> at Lv <n>" via the existing `nextUnlock()`, so §4.3's "always show the next unlock"
  is satisfied at the level-up *moment*, not only in the skills panel. At the very top it reads
  "Mastery. Nothing left to learn — only to perfect."

*Verified live: shade() hue-shift renders clean on day + night farm (no muddiness, no clipping);
the next-unlock banner resolves correctly (e.g. Farming L27 → "Rhubarb at Lv 30"); console clean.
Atlas snapshot v3.14.0.*

## v3.13.0 — "Homestead" · 2026-07-14 · tag `v3.13.0`

Version code **50**. The fresh v3.11 audit's **#3 priority** and the Interlocking Economy's oldest
hole (§3.6): late-game coin had nowhere to go once Rowan's ~20k of projects were funded — and The
Long Climb's faucets (Grand Feast 5400g, Coelacanth, deep ore) *widened* the drought. Décor is the
sink, and a beloved cozy-genre feature in its own right: dress the farm.

### Added — a **Décor catalogue** (`DECOR`, `01-data.js`; new "Décor" tab at Tom's)
- Nine placeable, purely-cosmetic pieces from a **350g Flower Bed** to a deliberately absurd
  **300,000g Golden Statue of you** (the Golden-Clock flex — coin as pure status): Garden Bench,
  Stone Lantern, Bird Bath, Topiary, Sundial, Wishing Well, Grand Fountain between them.
- **Reuses the hive/machine placement path** end to end: `buyDecor` → the item enters your bag →
  select it like a seed (`isDecorSel`) → set it on the farm with USE (`plantPermanent`'s new `dec`
  branch, farm-only, capped at `DECOR_MAX=40`) → the **axe lifts it back** (`digUp`), so nothing is
  ever lost (cozy contract). Each piece has a world sprite + a backpack icon; tall pieces
  bottom-anchor through `drawObject`'s generic path.
- Décor is **not sellable or giftable** (never enters `ITEM_SELL`), so the coin is a genuine sink —
  you can move a statue but never refund it.

### Save compat
None needed — décor lives in `state.inv` + `state.farm.objects`, both already persisted; no new
top-level state. (Verified the v3.2 farm-shrink migration guard skips décor-shaped saves, so placed
pieces are never silently swept.)

### Review-driven
A focused adversarial pass cleared the economy (no refund exploit), persistence, placement guards
(farm-only, occupied/doorway/reserved refusals inherited), kind-collisions, and tall-sprite anchoring.
Its one LOW finding — placed pieces examined under their raw key ("goldenstatue") because `OBJ_TITLE`
lacked décor names — is fixed (populated in 08-actions.js, where that map lives; doing it in
01-data.js would have thrown at load, since `OBJ_TITLE` isn't defined yet during that file's IIFE).

*Verified live: buy all nine (gold deducts exactly, 319,850g sunk); place (consumes item, blocks
movement); axe lifts back to bag; `DECOR_MAX` cap; not sellable; examine title correct; the Décor
tab and in-world sprites (well/fountain/statue) render cleanly; game loads with no load-order error;
console clean. Atlas snapshot v3.13.0.*

## v3.12.0 — "Star Metal" · 2026-07-14 · tag `v3.12.0`

Version code **49**. The **#1 ranked priority** from the fresh v3.11 design audit (and a gap the
v3.10 adversarial review flagged independently): The Long Climb added Cobalt Ore, Star Metal Shard,
Silverwood, and Heartwood, but nothing *consumed* them — tool tiers stopped at Gold and the Cellar
takes only crops. They were pure faucet, breaking principle §3.5 ("rewards must be inputs"). This
gives them a downstream loop.

### Added — a 4th tool tier, **Star Metal** (`TOOL_TIERS`/`TIER_POWER`/`TIER_COST`, `01-data.js`)
- Every tool now upgrades one rung past Gold to **Star Metal (power 7, up from Gold's 5)** for
  **12,000g + 4 Star Metal Shard + 8 Cobalt Ore + 8 Silverwood + 4 Heartwood** — consuming *all
  four* of The Long Climb's terminal deep resources in one recipe. It's a **transformative unlock**
  (§4.2), not a same-verb bump: only a master miner *and* woodcutter can even gather the materials,
  so the ultimate tool is an achievement across the two deepest grinds.
- A bespoke upgrade banner ("Forged from the deep floors and the heart of the grove — there is no
  finer tool in the valley") and the tier's own pale star-metal blue in the shop and hotbar ◆.

### Changed
- Introduced `MAX_TIER = TOOL_TIERS.length - 1`, replacing the three hardcoded "max tier = 3" bounds
  (`buyTool`, the level-up banner, the shop's "maxed" row) so the cap now follows the data — a future
  tier needs no bound-hunting. Every other tier-indexed read (`TIER_POWER[tier]`, the hotbar tint,
  the 3×3 area at `tier>=3`) was already safe with the extended 5-element arrays.

### Save compat
None needed — `state.tools[tool]` was already 0–3; tier 4 is just a newly reachable value. Old saves
with maxed-Gold tools simply gain one more upgrade to buy.

*Verified live: Gold→Star Metal upgrade consumes all four deep materials + 12,000g; power reads 7;
the tier caps at 4 (no 5th); the shop shows the Star Metal upgrade rows with per-material affordability
and "★ maxed" for finished tools; hotbar tier tint correct; screenshot of the tools tab; console clean.
Addresses design-scorecard priority #1. Atlas snapshot v3.12.0.*

## v3.11.0 — "Second Helpings" · 2026-07-14 · tag `v3.11.0`

Version code **48**. The companion to v3.10 and the last skill desert: Cooking's recipe ladder
stopped at Frostbloom Tea (L40), so L41–99 (the back 60% of the climb) taught no new dishes. This
fills it — and the new recipes eat exactly the crops and deep-sea fish The Long Climb just added,
so the two releases close a loop: grow/catch the new content, then cook it.

### Added — eight late recipes (`RECIPES`, `01-data.js`), pure data; each auto-inherits its plate
sprite (from `col`), `ITEM_SELL`, `EDIBLE`, the Kitchen collection slot, and the skills-panel
next-unlock. Priced on the series' existing ~1.4× profit-over-ingredients line (Tom's per-dish
demand still caps the daily take):
- **Rhubarb Pie** (L44) · **Melon Sorbet** (L48) · **Stuffed Artichoke** (L54) · **Grape Tart**
  (L60) · **Harvest Roast** (L68, Yam) · **Fisherman's Pie** (L74, Salmon + Yam) · **Everbloom
  Cordial** (L82, the winter flower bottled) · **Grand Feast** (L90) — the crown dish, needing
  Gulf Sturgeon + Yam + Everbloom, i.e. mastery in Fishing, Farming *and* Cooking at once. The
  "mastery award in the end" the owner asked for, now spread across three skills' peaks.
- Examine lines for all eight; Cooking's content ceiling moves L40 → L90.

*Verified live: every dish cooks and consumes its ingredients; the level gate blocks (Cooking 40
can't make the L44 pie) and shows 🔒 in the kitchen; every dish is profitable (sell > raw
ingredients); sprite/sell/EDIBLE/Kitchen-museum/examine/next-unlock all auto-derived; console clean.
Small pure-data addendum to the adversarially-reviewed v3.10, reusing that release's fully-exercised
recipe system. Atlas snapshot v3.11.0.*

## v3.10.0 — "The Long Climb" · 2026-07-14 · tag `v3.10.0`

Version code **47**. The game's deepest, longest-standing design gap — the one the docs name as
its core tension: *keeping the RuneScape 1–99 grind as rich as the cozy base.* A 5-agent skill
audit measured it precisely and it was stark: **every skill hit its content ceiling in the first
quarter, then ground 60–75 levels on passive perks alone.** Farming's last crop was Starfruit at
L24; Mining's last vein Gold at L28; Fishing's last catch at L34; Cooking at L40. Three-quarters of
each 1–99 climb unlocked *nothing new*. This fills the four gathering deserts.

### Added — new content up the whole ladder (all data-driven; every item auto-inherits its sprite,
sell price, Cellar wine/jam, Tom's per-item demand, gifting, examine, the Collection, and the
skills-panel "next unlock" — the systems already generalize over CROPS/FISH/ORES/TREES)
- **Farming — six late crops** across all four seasons: Rhubarb (L30, Spring), Melon (L40, Summer),
  Artichoke (L52, Fall), Grape (L64, Summer/Fall), Yam (L78, Fall), and **Everbloom (L90, Winter)** —
  giving Winter a second crop and the ladder a near-cap rung. One per step across the old L25–99
  dead zone. (`CROPS`, `01-data.js`.)
- **Fishing — four deep-water fish** off the open sea (`WATER.coast`), held back by the existing
  `f.lvl` filter: Moonperch (L40), Silvergill (L55), Gulf Sturgeon (L70), and **Coelacanth (L85), a
  living-fossil trophy** — refilling the game's single longest desert (the v2.0 scorecard's
  "Fishing 35–98"). (`FISH`, `01-data.js`.)
- **Mining — two deep veins**: Cobalt (L45) and Star Metal (L70), spawning on extended `oreTable`
  depth branches (floor 15+/25+), so diving deep *and* levelling both finally pay. A low miner
  facing one gets the honest "come back stronger" gate. (`ORES` + `genMine`, `13-content.js`.)
- **Woodcutting — Silverwood** (L85), the deepest grove ring's rarest timber (`RING_TREES[9]`), so
  the axe has a live target past Heartwood (L70) — the skills panel no longer reads "nothing left
  to unlock" for the last 30 levels.
- ~50 supporting touches: `ITEM_SELL` for the new drops, museum **Materials** slots for the ores/wood
  (obtainable-source + collection-slot in the *same change*, per the v3.8 rule), examine lines for
  all 13 items + seeds/cooked variants, and thematic gift ties (Rowan ← Star Metal Shard/Cobalt,
  Bram ← Coelacanth/Gulf Sturgeon, Pip ← Melon, Maya ← Grape, Tom ← Silverwood).

### Review-driven (a 3-lens adversarial pass ran before commit — regression cleared the code as
crash-free and save-safe: oreTable indexing recomputes per call, RING_TREES sums to 1, museum items
all obtainable, no new save state. These `low` findings were fixed)
- **Silverwood's gift tie was dead** — the comment claimed `"Silverwood".includes("Wood")` covered
  it, but `includes` is case-sensitive and that's `false`. Added Silverwood (and Heartwood, which
  had the same latent gap) to Tom's likes explicitly.
- **Star Metal Shard (600g) out-sold Diamond (480g)** — an ore beating the rarest gem undercut the
  "gems are a treat" framing (the 2026-07-12 nerf). Trimmed to **450g**, just under Diamond.
- **The top deep fish ran hot** — Coelacanth 2200→**1800**, Gulf Sturgeon 1500→**1300**, so a coast
  camp doesn't out-earn a tended farm. *(Backlog, out of scope: raw and cooked fish are independent
  demand pools; a shared pool would tighten the endgame further.)*

*Verified live end-to-end: all 13 items plant/mine/catch/chop correctly; every sprite auto-generates
(zero `undefined`); level gates enforce and message cleanly; Cellar products, Collection (74→87
slots), examine, and gifts all interlock; old saves load unchanged (data-only). Collection screenshot
shows the new crops/fish rendering distinctly; console clean. Atlas snapshot v3.10.0.*

## v3.9.0 — "Plaza Life" · 2026-07-14 · tag `v3.9.0`

Version code **46**. The village plaza was a well-built stage with almost no life on it — the
world-split (v3.0) and healing pass (v3.4) filled it with buildings and dressing, but by day it
held only Maya and Pip wandering. This adds ambient life. Built from the same 5-agent subsystem map
as v3.8 and hardened by a focused adversarial review (four findings, all fixed before commit).

### Added
- **Benches & flower planters** (`bench` sprite in `03-art.js`; placed in `genVillage`): a worn
  garden bench you can sit on for a small cozy beat (a rotating flavor line, no mechanic — the
  "sit and watch the valley" moment the genre lives on), plus planters. Placed on the plaza's
  north/south edge rows (verified clear of every artery, door approach, and the Maya/Pip wander
  box, so nothing gets walled in). Both examinable, both with a proper title (the review caught
  that a bench read as lowercase "bench" and planters fell through to the tile name).
- **Tom steps outside at midday** (`maybePlazaLife`, `14-story.js`, ticked from the main loop like
  `maybeLanternTest`): an ambient plaza-Tom appears in the square from ~11:30–14:00 and is removed
  live when the window closes — NPCs otherwise only spawn on map entry, so this mutates
  `curMap.npcs` directly. Talking to him gives a lighter, social Tom ("the counter can mind itself
  for ten minutes"), gated to the village map and placed *after* the story beats so it never
  preempts the festival cue or the "slipped name" hook. `npcRegionNow` already reports Tom in the
  village, so the whereabouts panel stays honest.

### Review-driven hardening (a focused adversarial pass ran before commit)
- **The Lantern Test keeps its staging.** The v3.6 midpoint scene stages its own Tom by find-by-id;
  a wandering plaza-Tom present at that exact moment would be grabbed and left standing across the
  square. `maybePlazaLife` now stands down while the Lantern Test is *pending* (5 wings lit, scene
  not yet played) — invisible (the scene fires within a frame-to-a-day), and the collision is gone.
- **Tom no longer spawns on the market stall.** His midday spot moved off (11,12) — the tile the
  Farming wing's stall claims — to (10,12) with a tighter roam box, so facing him always talks
  instead of opening the shop.

*Verified live: benches/planters placed and off the wander box; Tom appears only 11:30–14:00,
removed after, re-added on re-entry, suppressed while the Lantern Test is pending and resuming
after; social line gated correctly with story beats keeping priority; examine titles/text; screenshot
of the lively square (Tom + Maya + Pip); `npcRegionNow` consistent; console clean. Atlas v3.9.0.*

## v3.8.0 — "The Flock" · 2026-07-14 · tag `v3.8.0`

Version code **45**. Sheep & wool — restoring the last orphaned item to the Collection with an
honest source, and the design scorecard's long-standing "sheep+wool" backlog line. Built from a
5-agent parallel subsystem map and hardened by a 3-lens adversarial review (see below).

### Added
- **Sheep, the barn's third resident** (`13-content.js`: `buySheep`, `shearSheep`, `woolReady`,
  spawn branch; `07-entities.js`: `drawSheep` + 3-way draw dispatch; `08-actions.js`: 3-way pet
  dispatch; `03-art.js`: `sheep_0/1` sprites). 500g at Tom's, up to 4, **sharing the barn** with
  cows (placed on a distinct tile base so no two animals ever spawn stacked — no new map, so the
  atlas/MAP_ACCESS is untouched). Collected the cozy one-button way (E), never a tool-swing.
- **Shears** (`buyShears`, `state.flags.hasShears`) — a **one-time 250g** convenience at Tom's,
  never consumed (the cozy contract: nothing wears out). A gentle gold sink the economy audits
  keep asking for. Gates only the *gathering* of wool, not petting.
- **Wool regrows on a cadence, not daily** (`WOOL_REGROW = 3`): a coat is worth 120g and takes a
  few days to grow back, so a flock rewards a relaxed "visit whenever" rhythm instead of a daily
  raid — deliberately lower gold/day than cows, redeemed by needing no daily attention.
- **Wool rejoins the Collection.** It shipped as a priced, sprited, described item years ago but
  was pulled from the museum in v2.6.1 because nothing could produce it (it would cap completion
  one short). The sheep make it real; `10-ui.js:476` adds it back (the inverse of the v2.6.1 fix,
  landed in the *same change* as its source, exactly as that fix's comment warned it must be).

### Review-driven (a 3-lens adversarial pass ran before commit — correctness/regression cleared
the code as crash-free and save-safe; these are the design findings it surfaced, all fixed here)
- **Friendship is no longer dead state.** A cherished sheep (friend ≥ 180) grows a **Prize Fleece**
  (220g, its own sprite/examine/Collection slot) on a 50% shear roll — mirroring the Large Milk/Egg
  tier, so the +8/shear friendship climb finally has a ceiling worth chasing (~40 days to reach it
  on the 3-day cadence — a proper long-game payoff for the cozy base's slowest animal).
- **Wool is no longer terminal.** Pip *likes* Wool and Elias — the ferryman home from eleven cold
  years at sea — *loves* a Prize Fleece (and likes plain Wool), so the new material connects to the
  relationship layer instead of dead-ending at Tom's counter.
- **A full-coated sheep is never un-pettable.** The first cut of `shearSheep` returned early when the
  coat was ready but you owned no shears, soft-blocking the pet branch and buzzing an *error* sound
  on every E press. Restructured so anything short of a real shear falls through to a warm pet (a
  "get shears from Tom's" *nudge*, not an error), consistent with cows and hens.

### Save compat
`state.animals.sheep` added to `freshState` and seeded in `migrateSave` (`11-title.js`) — old saves
have `s.animals` but no `sheep` key, so the generic backfill can't graft it; the explicit guard does
(the v2.6.1 dead-code trap, avoided). Every consumer independently guards with `(…||[])`.

*Verified live end-to-end (twice — before and after the review fixes): buy gates, one-time shears,
non-overlapping barn spawn beside cows, 3-day coat grow-in, shearing, the shears gate, Prize Fleece
at friend ≥ 180, the pettable-no-buzz fix, gift wiring, both wool items in the Collection, old-save
migration, screenshots of the flock and the shop; console clean.*

## v3.7.0 — "The Cellar" · 2026-07-14 · tag `v3.7.0`

Version code **44**. Artisan machines — the design scorecard's oldest unfilled economy gap, and
the natural next system after Tempered Tools: crops needed a *second life* beyond Tom's counter
and the kitchen. Also cuts the parallel session's unversioned **game-feel pass** (level-up halo,
tactile menu presses, corner nudging) into a player release.

### Added
- **Kegs and Preserves Jars** (`MACHINES`, `01-data.js`): bought at Tom's for wood + ore + coin
  (the Tempered Tools rule — 900g + 8 Pine Wood + 2 Iron Ore / 550g + 6 Wood + 2 Copper Ore),
  placed like hives (`plantPermanent`, farm-only, capped 4/6), worked overnight by `tendCellar`
  in `newDay`. **Keg: any growable → its Wine, 3 nights, 2.2×. Jar: → its Jam, 2 nights, 1.6×.**
- **Why those multipliers:** machines trade *time* for value at zero energy, so they must sit
  under the kitchen's dishes (which cost ingredients + attention) — and every product is its own
  item name, so **Tom's Demand gluts per product**: forty identical jams saturate exactly like
  forty starfruit. No infinite-money lever.
- **One-button cozy:** an empty machine takes the best growable in your bag (toast names it); a
  working one tells you the nights left; a ready one hands over the product (+14 Farming). The
  axe lifts a machine and **returns its load unspoiled** — nothing is ever taken (the contract).
- **Generated everything:** sell prices, examine lines ("Three days in the barrel, and the
  strawberry learned patience."), and tinted item sprites (bottle/crock per growable's palette)
  are generated for every crop and orchard fruit — ~50 products from ~30 lines of generation,
  and any future crop gets its wine and jam for free.
- Sleep card reports finished batches ("🍶 2 cellar batches finished aging").

*Verified live end-to-end: buy refused without materials, consumed them when present; placement
capped and farm-only; keg auto-picked Strawberry over Turnip; jar ready night 2, keg night 3;
collected Strawberry Wine (374g = 2.2×170) + Turnip Jam (56g = 1.6×35); axe returned a loaded
keg's Turnip; collect-moment screenshot (icons popping, orb ticking); console clean.*

## Engine migration — Godot chosen; a spike de-risks the procedural port · 2026-07-14

Not a game change — a **direction call** and the proof-of-concept behind it, logged here because
this file's whole reason for existing is to let the game be rebuilt "possibly in a different
engine" with the *reasoning* intact. Owner wants to take HarvestScape past the browser to
**Steam/desktop + iOS/Android**, with room for engine-level headroom (perf, effects, tooling).
Consoles are explicitly *not* a target, and the port is a **fresh rebuild of the same concept**,
not a line-by-line translation.

### Decision — Godot 4 (GDScript), not Unity
- **The game's shape fits Godot, not Unity.** HarvestScape is a 2D, 320×208 pixel-art, tile game
  that is *100% code* — every sprite is canvas drawing in `03-art.js`, every sound is a WebAudio
  graph in `02-audio.js`, no asset files anywhere. Godot's 2D pipeline, `TileMap`, and
  pixel-perfect camera are first-class; Unity's 2D is bolted onto a 3D engine. GDScript is
  Python-ish and the JS logic (tile arrays, state machines, `dt` loop) maps almost directly;
  Unity's C#-only path adds MonoBehaviour/prefab/serialization ceremony between us and the logic.
- **No licence, no account, no runtime fee** (Godot is MIT) vs. Unity's account + licensing baggage.
- **The one thing Unity wins — official console ports — is off the table**, so it buys us nothing.
- **This machine settled it too.** Apple M4 / 16 GB / macOS 26.1 but only **~14 GB free disk**.
  Godot's whole toolchain is < 3 GB; Unity Hub + an Editor + iOS/Android modules is 25–40 GB and
  *would not fit* without clearing space first. Xcode 26.3 is already installed for iOS signing.
- **GDScript over the C#/.NET Godot build:** lighter on the tight disk and cleaner mobile/web export.

### Spike — `godot-spike/` (proves the parts that don't port trivially)
The asset pipeline that usually kills a port is a non-issue here (there are no assets); the risk is
the opposite — the two most distinctive systems have *no native equivalent to drop into*. The spike
rebuilds a slice of each in-engine, keeping the "no asset files" identity:
- **Procedural pixel-art** — `main.gd` ports `03-art.js`'s `px()` + seeded-scatter rng to
  `Image`/`ImageTexture`, generating grass tiles, tilled soil, and a crop's three growth stages at
  runtime. Confirmed by screenshot (`spike_frame.png`, a native **320×208** buffer, crisp nearest-
  neighbour) — so the exact procedural approach survives, no baking to PNG required.
- **Synthesized audio** — an "item-get" arpeggio built as raw samples and pushed into
  `AudioStreamGenerator` (11,907 samples, no error), proving the WebAudio-graph model in
  `02-audio.js` has a home in Godot's audio API.
- **Machine + toolchain** — Godot 4.7 installed via Homebrew cask, runs native on the M4 (Metal /
  Forward+), builds and runs headless from the CLI. Verified end-to-end on 2026-07-14.

Result: the three unknowns (procedural art, synth audio, pixel-perfect render on this hardware) are
green. Next step when the port begins in earnest is a proper `MIGRATION.md` phasing plan; the spike
lives on as the reference for how the tricky subsystems translate.

---

## Juice & game feel — the item-get loop, tactile menus, the level-up "ta-da" · 2026-07-13

Unversioned presentation pass (a parallel session owns the version cut + data files; **fold into
the next release's player notes**). Target: the one design grade every audit parked at **B** while
the rest climbed to A. Kept strictly inside the cozy contract (§8.2) — warm additive glows, never a
red/harsh flash, no perpetual pulsing — and scope-locked to `05-particles.js` + `style.css` so the
concurrent session's action code (`08-actions.js`) was never touched; the juice lives in the
feedback *primitives*, so it propagates to every call-site automatically.

### Added
- **Over-invested in the item-get loop** (the bible's "emotional core of a farming game"). A
  collected item used to only scale-pop; now every collect blooms a soft warm **glow** behind the
  icon and sparks off a few gold **stars** (`96e0cc8`: a new additive-`lighter` `pGlow` particle + a
  star burst in `pItemPop`). `pSparkle` gained the same bloom, so level-ups and
  gem finds — which already call it from the action sites — feel like a *find*, with zero edits to
  `08-actions.js`.
- **A warm halo behind the level-up banner** (`de7bfbe`) — a `#banner.show::before` radial that
  flares on arrival and settles, giving the RuneScape level-up its "ta-da" without a flash.
- **Tactile menu presses** (`96e0cc8`) — `:active` translate + hover-brighten across the redesigned
  tabs, inventory/collection/skill tiles, calendar day cells and close buttons, so every tappable
  thing answers the press.
- **Corner nudging — Celeste's movement forgiveness** (`updatePlayer` / new `cornerNudge`,
  `07-entities.js`). Press straight into the edge of a wall or object and, if a few-pixel slip to one
  side would clear it, you now ease that way and round the corner instead of catching — the cozy
  "the game quietly conspires to help you succeed." Deliberately narrow (probes only ~5px, so it
  rescues genuine corner-catches without ever drifting on a flat wall) and defensive (every write is
  collision-checked). Accel/decel was still left out on purpose — instant response suits a top-down
  farmer; forgiveness, not floatiness, was the goal.

*Note: shake, hit-pause and per-object sway already existed at the action sites and were left as-is;
this pass filled the gaps the bible flags (item-get sparkle, everything-that-appears juice, movement
forgiveness). The one edit outside the UI files — corner nudging in the shared `07-entities.js` — was
made while that file was idle (~15h) and committed narrowly. Verified live: item-get bloom + sparkle
on collect; banner halo via a forced-static frame (the pane throttles the 3.2s animation); corner
nudge fuzz-tested across 5,128 start-cells × 4 directions × 40 frames with zero wall-penetrations /
teleports / NaNs (max 1.13px/frame), and its slip-toward-the-gap logic unit-proven on synthetic
walls (down/up/side openings nudge correctly; a flat wall does not); console clean.*

## UI/UX sweep — tabbed Journal, a town map, a tile Backpack, a month calendar · 2026-07-13

Unversioned menu-UI sweep (a parallel session owns the version cut + data files; **fold this into
the next release's player notes**). Owner ask: *"do a sweep of the entire UI/UX… the journal in
particular, and the inventory, is particularly bad… so messy. Draw from Harvest Moon / Friends of
Mineral Town / Stardew — a map of the whole city with where you are, and a more visual tile
inventory."* Grounded in a 4-lens design panel (FoMT / Stardew / world-map / info-architecture).
Scope-locked to `10-ui.js` + `css/style.css` + `index.html` throughout; committed narrowly (never
`-A`) so the concurrent session's data-file work was never swept in.

### Changed
- **Journal: one 3.4-screen scroll → a tabbed book** (`93abee9`). renderJournal concatenated nine
  systems (guild wings, pledge ledger, story quests, Grandpa's pages, sky+calendar+birthdays+Bram's
  ledger, the Collection, how-to) into one endless `.body` scroll. Now a FoMT/Stardew tabbed panel —
  **Quests / Map / Calendar / Ledger / Collection** — one clean page each. A shared `panelTabs()`
  factory (active tab remembered per panel in `_panelTab`, so a re-render keeps your page) backs it;
  the Shop was ported onto the same factory (zero visual change) to prove it. renderJournal kept its
  name + zero-arg signature so the **J** key and touch menu stayed wired.
- **NEW world map** (`93abee9`) — the owner's "map of the whole city with where you are."
  `renderWorldMap` draws a schematic Willowbrook as CSS grid boxes laid out by the real warp
  cardinals (grove W, village E, guild N, mine NE, coast S), a pulsing gold **"you are here"** keyed
  off `state.map`, and live neighbour **portraits** inferred read-only from the spawn schedule
  (`npcRegionNow`, a clock-driven reconstruction — live NPC entities only exist on the loaded map).
  100% procedural, no assets. Mounted as the **Map** tab (no new keybinding; the keymap is full).
- **Backpack: flat list → visual tile bag** (`04e87c5`). renderInv was one item per row, each
  dragging an italic examine paragraph (~6 of 15 items on screen). Rebuilt on the `.museItem` tile
  grammar: a grid of icon tiles with a corner **stack-count** badge, bucketed into the Collection's
  category sections (Crops / Fish / Gems / Materials / Forage…) so the bag reads sorted like
  Stardew's. Examine flavour, sell/energy value and the **charm wear/unwear** control moved onto a
  **sticky detail footer** that's always in view when an item is selected and collapses when none is.
- **Calendar: flat almanac → Harvest Moon month grid** (`35b7dda`). A 7×4 board of the selected
  season's 28 days with festivals (✦) and birthdays (🎂) marked in place and **today ringed**, a
  season selector, the sky as two chips, a "what's on" list, and Bram's legend ledger kept below.
- **Merged the two duplicate ledgers** (`35b7dda`). Rowan's guild-desk "Valley Ledger" panel and the
  Journal's "Restorations" were two names/panels/funding-UIs for one idea. Now one **Ledger** tab
  (pledges + Rowan's projects); the guild desk opens the Journal there; `renderProjects()` survives
  only as a re-render shim for `fundProject()` (in `14-story.js`, off-limits to this session).
  Retired the standalone `#projPanel`.
- **How-to-Play** left the Journal for a Settings "Read the guide" row (opens the guide as a
  parchment letter), and the Collection was promoted out of its collapsed `<details>` into a full
  tab page — finishing the declutter.

### Housekeeping
- Removed dead renderers/CSS left by the above (`renderMuseum`, `renderAlmanac`, the `.museum`/
  `.howto` `<details>` styles); added shared `.secHead`/`.muted` in-body vocabulary.

*Verified live throughout (real tab clicks + close button, every other panel re-checked for
regressions, the Help letter, map you-are-here tracking `state.map`, charm wear, calendar marks):
console clean at each commit.*

## v3.6.0 — "The Lantern Test" · 2026-07-13 · tag `v3.6.0`

Version code **43**. Story overhaul 3/3 ([STORY_OVERHAUL.md](STORY_OVERHAUL.md)): the arc was
opening → long grind → finale, with no middle beat. Now, at **five of nine wings**, entering the
village fires one scene (`maybeLanternTest`, `14-story.js`, ticked from the main loop beside
`maybeSeasonalFestival`): Rowan strings the old lanterns across the plaza and **half the line
lights** — a taste of the finale, years early, with a flicker of doubt in it ("The blue one always
guttered. Rosa never could fix that either."). Tom half-remembers a promise; Maya names the
feeling; Rowan closes it: *"Not yet. But nearer than I've been in eleven years."* The **two
lanterns that lit stay up** (`lanternTest` flag; laid by `genVillage` so they survive the daily
regen and merge cleanly with Hearthcraft's full string later). Actors are staged temporarily and
cleaned up after (the day-1 arrival pattern); the flag is set before the scene starts so re-entry
during the fade can't double-fire, and saved at scene end. *(The pitch's Star-Metal choice stays
deferred — it wants a choice UI the dialogue system doesn't have; noted in the plan doc.)*

*Verified live: fires exactly once at 5 wings with Rowan/Tom/Maya staged; plays through; both
lanterns persist across `clearMapCache` regen; no refire; console clean.*

## v3.5.0 — "Neighbours" · 2026-07-13 · tag `v3.5.0`

Version code **42**. Story overhaul 2/3 ([STORY_OVERHAUL.md](STORY_OVERHAUL.md)): the
quests were **systemic gates in quest costumes** — "Reach Farming 10", "Upgrade tools 3 times" —
systems asking for numbers, not people asking for help. A pure writing pass over `QUESTS`
(`01-data.js`): descriptions become the giver speaking ("Anyone can hold a seal. Show me the
crafts still live in someone's hands…"), objectives keep their exact mechanics but carry the ask
("Show him a farmer's hands — Farming 10" — the number stays visible; the design bible's
numbers-must-be-honest rule holds), and completion messages thank you like a neighbour ("Rowan
stands at the wall a long moment. Three wings, flickering. 'Well,' he says. 'Well.'"). Six quests
rewritten (meet-tom, prove-crafts, the-coast, into-deep, master-tools, wake-valley's level line);
the letter quests and Act II were already written in voice and stand untouched. **Zero balance
change** — every objective check is byte-identical.

*Verified live: journal renders the new text (giver voice + honest numbers), console clean.*

## v3.4.0 — "What the Valley Lost" · 2026-07-13 · tag `v3.4.0`

Version code **41**. First release of the story overhaul ([STORY_OVERHAUL.md](STORY_OVERHAUL.md),
from the owner's verdict: *"the story kind of falls flat"*). Attacks the two biggest of the five
diagnosed causes: the Guild's darkness was a **checklist, not a felt absence**, and **Act I never
seeded a question** for Act II's reveal to answer.

### Added — healing is physical
- **Every lit wing lays its mark on the village** (`genVillage`, reading `wingLit()` live — the
  village regenerates daily, so zero new persistence): Farming → market stall + crate by Tom's ·
  Woodcutting → fresh timber on the west road · Mining → lanterns up the mine path · Fishing →
  the day's catch barreled by the coast path · Cooking → a communal cook-fire on the plaza ·
  Ranching → a trough by the Wrens' · Foraging → berrybushes on the lanes · Smithing → an anvil
  outside the store · Hearthcraft → lanterns strung across the plaza. The story's progress bar is
  now the *place waking up*. (The Guild hall already brightens per lit wing via `collectLights` —
  interior props were tried and rejected: they'd block the row players stand on to face the wings.)
- **The shuttered years show first:** under three lit wings, rubble sits by the ambient houses and
  their signs read "(shuttered)" — the healing engine needs a *before*.

### Added — three planted questions (paying off EXISTING Act II lore; no new plot)
- **A planked-shut door** in the Guild's back wall (`olddoor`: new sprite, examine text, E-prompt).
  Rowan, without looking up: *"Not that one. Not yet."* — and the examine line does the real work:
  *"The dust is old; the nails aren't."* After Act II names Elias, it reads as quiet closure.
- **Maya's sketchbook** (existing 2-heart scene) gains a scribbled-out fourth figure at the
  festival table: *"…Nobody. The pencil slipped."*
- **Tom's unfinished name** — once, after meeting Rowan (`hook_tomSlip`, suppressed once
  `knowsElias`): *"Him and El— …and everyone else, back in the day. Anyway! Coin for goods!"*

*Verified live: 0 wings → rubble ×2 + shuttered signs and no healing props; 6 wings → stall,
barrels ×2, cook-fire, bushes ×2, mine-path lanterns, rubble gone, signs healed; olddoor present
with both dialogue phases (deflection pre-, workroom reveal post-knowsElias); Tom's slip fires
exactly once; Maya's scene carries the hook; healed-plaza screenshot (during which the test state
organically triggered Grandpa's "On the Nine" page — the story systems compose); console clean.*

## v3.3.0 — "The Wood Remembers" · 2026-07-13 · tag `v3.3.0`

Version code **40**. Grove Depths ships whole — all four phases of [GROVE_DEPTHS.md](GROVE_DEPTHS.md), built from the owner's 2026-07-13 verdict (DEVLOG): *"the forest… is not dynamic enough. It's not fun. The mine has levels, progression, and save points."* The grove is now the axe's mine — and the mine's own lift stops learn the grove's no-wasted-trips lesson right back.

### Phase 1: rings, deadfalls, waystones, the Pledge Ledger

Implements Phase 1 of [GROVE_DEPTHS.md](GROVE_DEPTHS.md) (owner-approved plan; DEVLOG 2026-07-13:
the grove is *"not dynamic enough… not fun"* — it had a venue but no loop, while the mine had
levels, progression, and save points).

### Added
- **The Deep Grove is nine rings deep.** `genGrove` now generates per `ring+day` exactly the way
  `genMine` generates per `depth+day` (`state.groveRing`/`state.groveBest` mirror
  `mineDepth`/`mineBest`; grove map-cache key is `grove:<ring>`). West is always deeper; entering
  from the farm always starts at Ring 1 (`doWarp` resets, mirroring `enterMine`). The mix of
  oak/pine/maple ages per ring instead of per x-position, so depth — not walking distance —
  decides what wood you're in. Ring 9 is **the Heart of the Forest**: the grove *ends* (unlike
  the mine) at a story-shaped ancient tree, planted now, paid off in a later chapter.
- **Deadfalls: the door west is itself woodcutting.** Each ring's west trail is sealed by a great
  fallen trunk with an HP pool and a Woodcutting requirement (`DEADFALL` table, 01-data.js —
  WC 5 into ring 2 up to WC 78 into ring 9). You chop *through* it and the door pays you (wood +
  XP). Felled deadfalls stay open for the day (map cache) and regrow overnight — waystones, not
  deadfalls, are the permanent progress. Design: the gate into depth is the skill being trained,
  not a staircase, and the WC requirement makes each ring's level assumption safe for future
  spawn tables (Phase 2). The crossing band (y≈15) stays prop-free on every ring — the grove's
  version of the mine's guaranteed-corridor rule, so a high-level tree can never wall a
  low-level player off the trail.
- **Waystones + the Pledge Ledger.** Guild-era standing stones on rings 1/3/6/9. The mouth stone
  never slept; the rest wake through the new **Pledge Ledger** (01-data.js), built to the owner's
  no-wasted-trips rule (DEVLOG): *touching* a dormant stone banks its discovery permanently and
  free; its cost is a pledge filled **in partial deposits, from anywhere** — at the stone or from
  a new ❖ Restorations section of the Journal — and the ledger, never the player, remembers the
  remainder. A filled pledge wakes the stone INSTANTLY (a "come back tomorrow" would be the same
  frustration smaller). Awake stones teleport between each other free, so home is always one
  interaction from any funded ring. Costs sink ORE + gold (the grove's stones want ore the way
  the mine's lift wants wood — the two deep venues feed each other); the deep stone takes a Ruby
  (the Diamond already belongs to the deep lift stop). Quiet pickup-toast nudges (once per item
  per pledge per day) when you gain something a discovered pledge still needs.
  The ledger's ids/helpers are generic (`lift5`… resolve already) so Phase 4 can put the Old
  Lift's stops on the same system without touching the core.
- Art: deadfall, dormant/lit waystone (teal runes + cool green light pool after dark, tuned
  against the additive-glare warning in AGENTS.md), west/east trailheads, the Heart tree
  (pale bark, faint glow). All procedural, generic bottom-aligned draw path; lit-check special
  case in `drawObject`.

### Verified
Full loop in-browser (worktree build, port 8645): ring-1 gen; deadfall chop (level gate, 4 swings
at tier 2, wood+XP payout, westtrail replacement); ring 2/3 descent with subtitle banners; dormant
stone discovery banner + pledge record; at-stone partial contribute (800g + 6 Copper + 2 Iron
banked, remainder shown); remote Journal contribute completing the pledge (instant wake banner);
riding way1 ⇄ way3; night light pools; console clean.

### Phase 2: three new trees, rarity-by-depth, and sinks

Phase 2 of [GROVE_DEPTHS.md](GROVE_DEPTHS.md) — the fix for Woodcutting's 18→99 desert (three
species can't carry a 99-level skill).

### Added
- **Willow (WC 30), Elderwood (WC 45), Heartwood (WC 70)** join `TREES`, each with a distinct
  silhouette (weeping strands / silver-blue evergreen / pale trunk with glints), seasonal
  foliage (willow sleeps bare in winter; elderwood is evergreen; heartwood never sleeps), and
  wood item icons. Willow is the fast-XP tree — quick chop (8 hp), *deliberately cheap* wood
  (34g, well under the g-per-level trend) so the RS willow-camp playstyle trains the skill
  without printing money. Elderwood is the premium timber sinks ask for. Heartwood (24 hp,
  520 xp, 210g) is the slow rare event wood.
- **Rarity by depth, for real:** `RING_TREES` (01-data.js) gives each ring a weighted species
  table — ring 1 is 70% oak; ring 9 has no oak or pine at all and is 30% heartwood. Every ring
  keeps at least one species at/under its own gate level, so no ring is uniformly unchoppable
  on arrival; everything above your level standing right there is the point (desire ahead of
  ability). The skill guide picks the new species up automatically (it iterates `TREES`).
- **The Ancient tree:** one per ring 5+ per day — an elder of the ring's rarest species, gold
  in its leaves and a soft gold light after dark. Double hp, double XP, `n*2+1` timber, and
  (Phase 3) a guaranteed canopy drop. The grove's "something glimmers below."
- **Sinks shipped with the wood** (new resources with nowhere to go are inventory noise):
  the floor-20+ lift stops now want **Elder Wood 12** (was a second helping of maple) — the
  deep venues feed each other; and Rowan gained **The Grove Arbor** (4000g + Elder Wood 10 +
  Willow Wood 15) — lantern-posts along ring 1's footpath, lit after dark. Waystone costs
  (Phase 1) already sink ore + gold + a Ruby.

### Verified
Ring 7 in-browser: species mix reads old (elderwood/willow dominant, heartwood present, no
oak), one ancient heartwood spawned; felling it paid 5 Heartwood + 1040 XP exactly; willow
strand silhouette and heartwood pale trunks render distinctly; console clean.

### Phase 3: canopy nests and charms

Phase 3 of [GROVE_DEPTHS.md](GROVE_DEPTHS.md) — the birds'-nest reward layer the owner asked for
("jewelry, rings, trinkets, or unlocks"), built under the gem-lesson constraint: treasure has
USES, not resale value.

### Added
- **Canopy nests.** Felling any grove tree has a ~4.5% chance (deeper rings a touch kinder; fog
  ×1.6 / storm ×1.3 — the canopy answers the weather like the mine's seams) of shaking a nest
  loose. Ancient trees ALWAYS drop one, and theirs skips the common tier. Tiers: seasonal seeds
  or berry buns (most — the grove feeds the farm, not the wallet); a **charm** (uncommon); a
  fruit-tree sapling (rare — canopy-grown orchard stock); and once per valley, **The Forester's
  Band** (event-rare, RS's Diamond-moment in forest language).
- **Charms: the single-slot keepsake system.** Six trinkets (`CHARMS`, 01-data.js), each a tiny
  passive: Wren Feather (+5% WC XP), Acorn Ring (an extra log now and then), Moss Locket (forage
  sometimes doubles), Amber Beetle (+5% Mining XP), Lantern Charm (a little more light), and the
  Band (+8% WC XP + extra-log chance). Exactly ONE worn at a time (`state.charm`, a wear/worn ✓
  button in the Backpack) — the single slot is the power-creep governor, per the plan's owner
  call. Sell prices modest on purpose; each charm drops once per save (rolls check the
  Collection), so a nest charm is an event, not a stack.
- The Collection gains "The Canopy" (charms) and the three new woods under Materials.

### Verified
In-browser: guaranteed nest (ancient path) rolled a charm; wear/worn toggle renders in the
Backpack with icons and effect text; XP multipliers measured exact (+5% WC with Wren worn,
Mining unaffected; swap to Beetle flips it); single-slot swap works; console clean.

### Phase 4: the Old Lift joins the Pledge Ledger

Phase 4 of [GROVE_DEPTHS.md](GROVE_DEPTHS.md) — the owner's waystone critique applied verbatim
to the mine: the old lift-stop flow (pay in full, standing at the stop) wasted the trek when you
arrived under-resourced and made you memorize costs between trips.

### Changed
- **Lift stops now fund like waystones.** Discovery is *derived*: `mineBest ≥ n` means you once
  stood on floor n, so every such stop appears in the Journal's Restorations ledger — including
  **retroactively on old saves, with zero migration** (listing stops at `mineBest`, so the
  doubling series past 20 never renders to infinity). Deposits are partial and payable anywhere
  (Journal or at the lift); the panel's all-or-nothing "restore" button (disabled until you
  carried everything at once) is replaced by the ledger's contribute row, which always accepts
  *something*. Completion still lands in `state.liftStops`, so ride logic, `enterMine`'s
  hum-toast, and existing saves are untouched. `restoreLift` deleted — one funding path now.
- `mineDown`'s landing toast now reads the ledger: an untouched stop says "a lift stop waits
  here"; a part-funded one says exactly what it's short ("the lift stop here is 600g, 6× Pine
  Wood short"). The ledger remembers; the toasts remind.

### Verified
Acceptance case from the plan, in-browser: save with `mineBest=17`, `liftStops=[5]` → ledger
lists floors 5 (restored) / 10 / 15, nothing past 20; remote partial deposit from the farm
(900g + 9 pine + 2 iron); rode to floor 10; contributed the remainder at the lift; stop woke
instantly and the panel re-rendered to "restored stop · you are here"; `liftStops=[5,10]`;
pledge record cleaned up.

---
---

## v3.2.0 — "The Near Fence" · 2026-07-13 · tag `v3.2.0`

Version code **39**. The farm shrinks: 60×46 → **46×36** (~40% less area). The owner (DEVLOG,
this date): *"Because the farm is separated from the rest of the village, it's now too big…
a lot of empty space because everything was moved around. Just shrink the farm a bit."* v3.0
called the vacated town ground "more farmable space — a feature"; in play it was dead walking.
The companion ask — a build-out/expansion mechanism — is **deliberately not built**: it's on the
roadmap as *Land Deeds* (VALLEY_V3.md, deferred list), per the owner's "not right now".

### Changed
- **The farm is 46×36** (`W`/`H` in `00-core.js`, `MAPS.farm`, `genFarm`). Design of the cut:
  everything **north of the treeline keeps its exact coordinates** (cottage, coop, barn, starter
  plot, shipbin, campfire, cart end, lane y=15, ore ridge) — the farm you learned stays the farm
  you know; the **east half goes** (the old town footprint: the road now exits at x=45, band
  y14–16, sign at (43,14)); the **south block moves up 8 rows** (forest scatter y19–34, meadow
  y24–32, Festival Green sign (27,28), memorial (27,26) + lanterns, grove footpath row 26 with
  its 2×3 warp pad at x0–1/y25–27); the **east pond** (Elias's) comes in from the town edge to
  the meadow at (38,25) — he fishes at (32,25) now; the **west pond** rises to (9,30) inside the
  tightened woods. ~1300 open farmable tiles remain — the middle band is field, not void.
  - **Note for the Grove Depths branch (merge point):** the grove's return warp must target the
    farm at `sx:3*TILE+8, sy:26*TILE` (footpath row 26); the farm-side pad is x0–1, y25–27.
    Already updated in `genGrove` here.
- Every consumer of the old coordinates moved with it: `respawnNodes` daily bands (frostberries
  y17–33/x2–43, tree regrowth y19–34, ridge rocks x26–43, `08-actions.js`), Elias's spawn
  (`13-content.js`), the village's west-road warp target (x=43), `raiseMemorial` +
  `RESERVED_FARM_TILES` + the homecoming cutscene's farm placement (`14-story.js`).
- `W`/`H` (the global tile stride) shrink with it, which is safe because the farm was the widest
  and tallest map; the new floor is the beach (46 wide) and the farm itself (36 tall) — noted in
  the `00-core.js` comment so the next resize checks it.

### Save migration (the shrink can't be coordinate-for-coordinate — so it's per-item)
One rebuild block in `migrateSave` now **subsumes** the v3 world-split rebuild and the v3.1.1
warp-band backfill (a full regeneration lays current warps by construction; both old blocks
removed). Trigger: any saved farm whose `w/h` differ from the canvas or that lacks the `(45,15)`
road warp — this catches pre-v3, v3.0–v3.1.1, all of them, reading the old map at **its own
stride** (`old.w`, 60). Carry-over: every crop, orchard tree (age+fruit), and hive (honey) tries
its exact old coordinates first — valid for the whole kept region — and anything that sat on
vanished or now-occupied ground **settles on the nearest open ground** (ring search; respects
objects, water, reserved story tiles, doorway approaches). Nothing the player made is dropped;
the one concession is bare tilled-but-empty soil outside the new fence (free to re-till). If
`act2Done`, the standing stone is re-raised on the new Green rather than copied — it's map
furniture, not player property. `loadGame` accepts any self-consistent legacy size instead of
hard-rejecting non-current tile counts (which would have silently discarded every old save).

### Fixed
- **Night window glow read tiles at the wrong stride** (`collectLights`, `06-weather.js`): every
  map's tile array is stored at the *global* stride `W` (`newMap` allocates `W*H`; all reads and
  writes index `y*W+x`), but the window-light scan indexed `y*curMap.w+x`. On any map narrower
  than `W` — the village (40), every interior — rows past the first were read from the wrong
  offsets, so windows glowed on the wrong tiles or not at all. Harmless on the farm only because
  the farm happened to be exactly `W` wide. Found while auditing every consumer of the farm's
  dimensions ahead of the farm-shrink work. (Shipped ahead of the release as its own commit.)

*Verified live: fresh farm generates 46×36 with all paths, warps, signs, and both ponds placed
(scripted tile/warp assertions, zero issues); a fabricated v3.1.1-era 60×46 save migrated with —
kept-region crop and watered soil at their exact tiles, out-of-fence crop (50,20)→(44,20) and
hive (52,33)→(44,33) settled with growth/honey intact, old-south crop (10,40)→(10,34), memorial +
4 lanterns re-raised at the new Green, old (59,x) warps gone, day/gold untouched; live warp
round-trips farm⇄village and farm⇄grove land on the right tiles; Elias fishes at (32,25);
screenshots of the farmstead and the Green; console clean.*

---

## v3.1.1 — "Doors & Roads" · 2026-07-13 · tag `v3.1.1`

Version code **38**. The v3.0 world-split left a layer of mapping debt the owner hit all at once
(DEVLOG, this date): *"when I exit the building… I get teleported into the previous location of
Tom Shop"*, *"the mine is behind the roof of the Nine Crafts Guild"*, *"buildings that don't have
doors… doors don't match up with the pathways"*, and the beach warp that could be circumvented
along the map's bottom edge. One patch, five root causes:

### Fixed
- **Interior exits pointed at the pre-v3 farm** (`genStore`/`genMayaHouse`/`genGuild`,
  `13-content.js`): when the town became its own map in v3.0, the three story interiors kept
  their old `exitAt(…,"farm",…)` targets — the farm tiles where the buildings *used* to stand.
  Walking out of Tom's dropped you on an empty farm road. Each now exits to `"village"` one tile
  below its own door. Same class of bug in `mineUp()`/`rideLift()`: surfacing from the mine
  landed you at village (20,3) — a tile v3.0's Guild *roof* sits on (`unstick()` then shoved you
  somewhere arbitrary). The barn exit was also off by one column (spawned at x21, door at x22).
- **The mine was buried under the Guild** (`genVillage`): the north path (x=20) and the mine
  warp at (20,2) were laid down first, then the Guild rect (x13–27, y2–7) was drawn *over* them —
  the warp tile sat under a solid roof tile, unreachable, and the mine mouth at (20,1) rendered
  behind the Guild's roofline. The mouth now stands on open ridge at the village's northeast
  (entrance (33,3), warp (33,4)) with its own path down to the plaza's east lane. The layout rule
  is written into the generator as a comment: **every door sits on a path; no road runs under a
  building.**
- **Single-tile edge warps could be walked around** (village⇄beach, farm⇄village, farm⇄grove):
  each crossing was one warp tile on an open map edge, so hugging the rim slid past it — the
  owner's "I have to walk up a tile from the bottom of the map". All are now multi-tile bands
  (3×2 pad at the coast path's mouth, 3-tall band on the farm/village road, 2×3 pad at the grove
  footpath). The farm map *persists* in saves, so `migrateSave` adds the farm-side bands to
  existing saves (additive + idempotent, keyed on the absence of `key(59,14)`), mirroring the v3
  farm-rebuild precedent; the other maps regenerate daily and pick theirs up for free.
- **Beach arrival/exit mismatch** (`genBeach`): entering the coast spawned you at x=30 but the
  exit door sat at the top *centre* (x=23) — directly behind the festival stage (row 4, x21–25),
  so leaving meant detouring around the stage to a door you never arrived through. The door, its
  warp, and the sign moved to x=30, matching every arrival (village warp, boardwalk fast-travel),
  with the approach column kept clear of random palms.

### Added / Changed
- **Every village door now meets a path** (`genVillage`): the Guild's door is centred under its
  roof (x=20) with a walk down to the plaza; Tom's door connects to the west road; Maya's door
  has a stub onto a new east lane (row 11 — the plaza's corner lamp owns (26,10)) that continues
  to the mine path. The coast path fans out 3-wide at the map edge onto the new warp pad.
- **The ambient houses have doors now** (the owner: "buildings that don't have doors"): the
  Wrens' and the Harrows' each got a DOOR tile, a path stub, and a south lane (y=24) linking
  them to the coast path. Their doors are latched — a new generic interaction in `interact()`
  (`08-actions.js`) answers E on any outdoor warp-less DOOR tile with "You knock. Quiet inside —
  nobody's home just now." — preserving "their doors open in a later chapter" while killing the
  fake-facade feel. (Interior exit doors are excluded: their warp lives on the exit mat and
  interiors aren't `outdoor`.)
- `.claude/launch.json`: the dev server honours the harness-assigned `PORT` (`autoPort`) so two
  sessions can preview simultaneously; port 8643 stays the default when free.

Verified in-browser end-to-end: enter/exit round-trips for all three story buildings land at
their own doors; mine enter/exit and lift-to-surface land at the new mouth; walking the village's
bottom edge now catches the coast warp; the beach exit is a straight walk up from arrival; the
knock line fires on the Wrens' door; console clean; save migration exercised by stripping the
new warps and re-running `migrateSave`.

---

## v3.1.0 — "The Thread" · 2026-07-13 · tag `v3.1.0`

Version code **37**. The story-visibility pass ([VALLEY_V3.md](VALLEY_V3.md) part 2) — the owner:
*"it's kind of hard to see the point of the story… the main mission doesn't shine through."* The
act-aware journal (v2.2) framed the story; these three make the *world* point at it.

### Added
- **Quest markers** (`storyMarkerNpc()`, `09-quests.js`; drawn in the NPC loop, `07-entities.js`):
  a gold ✦ bobs over whoever the main quest needs — the giver awaiting your report, or the person
  behind an unmet `{talk:}` objective. Crisp on the text overlay, gone when no one's needed.
- **Wings light out loud** (`checkWings()`, riding `checkQuests`' triggers): crossing a wing's
  threshold now fires a banner ("✦ The Farming wing glows again — 1 of 9 crafts relit"), a warm
  line from Rowan (three rotating voices), and the quest jingle. The story's central progress bar
  used to tick over *silently inside a panel*. New save field `state.wingsLit` counts celebrated
  wings; `migrateSave` seeds it to the already-lit count **before** the generic backfill (the
  v2.6.1 dead-code trap, dodged again) so old saves get no retro fanfare burst.
- **The morning names the mission**: the sleep card's last story line points at the next step
  ("✒ Tom is waiting to hear from you" / "✒ The story waits: Coin & Company").

*Verified live: marker null on the letter quest, "tom" on Coin & Company, ✦ visible over Tom in
the store (screenshot); Farming→10 fired the wing banner and advanced wingsLit 0→1; a mock old
save with two lit wings seeded to 2 with no fanfare; morning line renders; console clean.*

## v3.0.0 — "The Valley Opens" · 2026-07-13 · tag `v3.0.0`

Version code **36**. The world split — the owner's deferred 2026-07-12 item, green-lit today
(DEVLOG; plan in [VALLEY_V3.md](VALLEY_V3.md)): *"maybe the farm is just a farm, and you move out
of the farm to a different map to get to the village… build the village out… it's too small."*

### Added
- **Willowbrook Village** (`genVillage`, `13-content.js`; 40×28, regenerated daily like the beach):
  a paved plaza with corner lamps (they glow at night via the window/lamp lighting), Tom's store +
  noticeboard, the Aldermans' (Maya's), the Guild hall with the biggest roof in the valley, two
  ambient neighbour houses (windowed facades; "their doors open in a later chapter"), flowerbeds —
  and **the mine off its north ridge, the coast down its south path**. Town is the hub now.
  Maya and Pip stroll the plaza by day (they used to stand in your field).
- **The farm is purely a farm.** Town buildings, the mine mouth, and the beach path left the farm
  map; what they left behind is open land (more farmable space — a feature, not a loss). The east
  road auto-warps to the village, both ways, signed.

### Changed
- **Rowan's projects rewired:** the Town Fountain and Coast Boardwalk now build in the *village*
  (laid by `genVillage` from `state.flags`, since the village regenerates daily; `applyProjects`
  keeps owning only the persistent farm map); the **Minecart Line runs farm ⇄ village** — real
  fast travel that finally means something at this distance.
- Mine surface exits (ladder from floor 1, the lift's Surface ride) land on the village ridge;
  the beach's exit sign reads "Back to the village"; How-to-Play and quest prose updated.

### Save migration (the cozy contract, applied to a map)
Old saves have the town baked into their persistent farm tiles. On load, a farm without the
village road is rebuilt, and the player's own work carries over **coordinate-for-coordinate**:
every crop (its tile re-tilled/re-watered), every worked field tile, every orchard tree (age and
fruit intact) and hive. Valid by construction — no kept landmark moved, and nothing could ever be
planted inside the old town. Nothing the player made is lost.

*Verified live: farm has the road and no town remnants; village has all six warps
(store/Maya/Guild/mine/beach/farm), 4 lamps, noticeboard, signs; store round-trip with Tom;
beach exits to the village; Maya+Pip on the plaza at noon; a fabricated pre-v3 save migrated with
crop+watered tile, worked field, fruited cherry tree, and hive all intact and the town gone;
plaza screenshot; console clean.*

## The Atlas Archive — one snapshot per release, all history backfilled · 2026-07-13

Docs/tooling only; no game code changed. Owner's ask (DEVLOG, same date): keep an atlas *per
released version* as a permanent reference for the state of the game.

### Added
- **`atlas/` archive.** Every `tools/build-atlas.mjs` run now writes `atlas/v<version>.html`
  (named from the build's own `VERSION`) alongside the root `GAME_ATLAS.html`, and rebuilds
  `atlas/index.html` (newest first). **Why a side effect, not a step:** a snapshot that has to
  be remembered gets skipped; one that happens whenever the atlas is regenerated cannot be.
  The release checklist in `AGENTS.md` (step 6) makes the regen part of cutting a release.
- **Retro mode (`--src <gameJsDir>`)** for backfilling past releases from `git archive`:
  assertions downgrade to warnings (the past can't be edited to satisfy them), missing data
  degrades per-section instead of failing (extraction wraps every constant except `VERSION`
  in a try/eval guard), and the footer marks the page retro-generated. Used it to **backfill
  all 15 tags, v2.1.0 → v2.9.2** — the archive now shows the game's history at a glance
  (v2.1.0's skills page still shows the original 13M-XP RuneScape curve; the tenth map appears
  in v2.9.1).
- Robustness that also protects the future: one broken section no longer sinks the whole page
  on retro runs, and the skills ladder renders without mastery data (which only exists from
  v2.6.0).

## v2.9.2 — "Tempered Tools" · 2026-07-13 · tag `v2.9.2`

Version code **35**. Pillar 3 of [ECONOMY_REBALANCE.md](ECONOMY_REBALANCE.md) — the one that
actually breaks the "mine → gold → everything" chain the owner flagged. Also cuts the **XP-orb
rail** (next section, unversioned) into a player release. All three pillars are now shipped.

### Balance
- **Multi-resource tool upgrades** (`TIER_COST`+`toolCost()`, `01-data.js`; `buyTool`; shop UI
  shows each material with your count): Copper = 300g + 5 Copper Ore + **10 Wood**; Iron = 1,200g +
  5 Iron Ore + **10 Pine Wood** (WC 8); Gold = 5,000g + 5 Gold Ore + **10 Maple Wood** (WC 18) +
  a **signature gem** set into the handle — Hoe Amethyst · Can Topaz · Axe Emerald · Pick Ruby ·
  **Rod Pearl** (the beach's prize, pulling a third skill in). **Why:** tool tiers were gold + one
  ore, so mine money bought everything and a gold axe trivialized woodcutting as a *purchase*.
  Now every tier needs Mining AND Woodcutting progress; the top tier is an achievement across
  crafts. (The Grove, shipped one release earlier, is deliberately what makes the wood costs fair.)
- **The gem faucet turned down to a treat:** spawn coefficient 0.018 → **0.010** (gems were as
  common as ore at depth 6+ — 10.8% vs 10%); payout now **weighted** (`pickGem`: Am 4 · To 3 ·
  Em 2 · Ru 1.5 · Di 0.5) instead of uniform; prices trimmed 120/160/280/360/640 →
  **75/110/190/260/480**. Net: average gem ≈ **150g** (was ~312g) at roughly half the drop rate —
  a ~75% cut to the runaway faucet — while gems gain non-sell uses the same series (tier-3 tools,
  deep lift stops), so finding one still sings.

*Verified live: 10,000g + 10 Copper Ore alone REFUSED the Axe upgrade (the owner's exact exploit);
+10 Wood bought it and consumed the wood; Gold Pick refused without a Ruby, bought with one;
8,000-sample gem distribution 36/27/19/14/4.5% averaging exactly 150g; console clean.*

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
