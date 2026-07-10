# HarvestScape Design Scorecard — July 2026

**Overall grade: B+**

The working-tree build graded against `GAME_DESIGN_PRINCIPLES.md` — thirteen dimensions,
three independent code audits, every grade backed by file-level evidence. Economy claims
were checked arithmetically. All six DESIGN_V1.5 steps verified shipped.

**Verdict:** HarvestScape is a genuinely cozy, structurally sound Stardew-like with an
unusually strong story and a near-perfect cozy contract. Its weakest grades sit exactly
on its stated differentiator: the **RuneScape layer**. The 1–99 curve is faithfully
implemented but pays out almost nothing past level ~30, the mine is a resource faucet
rather than an expedition, and the genre's cheapest whimsy and completionism tools —
examine text and a collection log — are absent. The cozy base has earned an A; the
RuneScape soul is still mostly promise.

| Pillar | Dimension | Grade |
|---|---|---|
| Cozy base | Day Loop | A− |
| Cozy base | Interlocking Economy | B+ |
| Cozy base | Pacing the Year | A− |
| RuneScape layer | Skill Progression | **C+** |
| RuneScape layer | Quests & Story | B+ |
| RuneScape layer | Mine / Expedition | **C+** |
| RuneScape layer | Psychology | B+ |
| RuneScape layer | Whimsy & Tone | B+ |
| Presentation | Visual Coziness | A− |
| Presentation | Juice / Game Feel | B |
| Presentation | Audio | B− |
| Presentation | UI | A |
| Presentation | Cozy Contract | A |

---

## The Cozy Base

### Day Loop — A−
Ritual → project → wind-down, fully intact.
- ✓ 5.3-min day (16 real sec/game-hour, `08-actions.js:503`), hard 26:00 end; sleep card
  banks visible progress (crops grown, ready count, projects finished); menus pause time
  (`12-game.js:21` gates `updateTime` on `uiBlocking()`).
- ✓ Tiered watering (`canTiles`, `08-actions.js:64`) preserves the ritual while scaling
  it — the v1.5 Step-1 fix landed. Budget handoff correct: energy binds early, time forever.
- ✗ No overwork consequence at 26:00 (collapse is free — BtN's late-wake refinement absent).
- ✗ Tool upgrades are instant purchases; "delay as redirection" (§5.4) unused.

### Interlocking Economy — B+
The spine interlocks; the late game still leaks.
- ✓ Interlock test passes: ore → tool tiers (`TIER_COST`) → watering width / axe power /
  fishing bar height. Mining output literally changes farming capacity.
- ✓ F10 fixed: all cooking chains ≥1.25× (Bread 1.33×, Jam 1.29×, Fish Stew 1.31×,
  Pumpkin Soup 1.39×). Arbitrage guarded deliberately (`01-data.js:91`).
- ✓ ~55k gold of tiered capability sinks: tools 32.5k + 75 ore, animals, projects
  (`PROJECTS`, `01-data.js:130`) each buying a visible capability.
- ✗ No artisan machine layer at all — the §3.3 "30h→300h multiplier" is one cooking verb.
- ✗ First hen (300g) and cow (600g) are speculative purchases; §3.4 "gift the first
  machine" unmet.
- ✗ No absurd vanity sink; post-project gold has no destination — v1.5 problem #5 solved
  for year 1 only. Gems near-terminal.

### Pacing the Year — A−
The calendar pulls; winter finally has an identity.
- ✓ Noticeboard is a textbook daily objective: day-seeded, skill-filtered, pays 1.4× sell
  + 25 hearts, expires penalty-free, rendered as a *faint* card — proposes, never assigns.
- ✓ Nine Guild wings (`WINGS`, `14-story.js:8`) = real community-center board with
  cross-system criteria; no specialist finishes it alone.
- ✓ Journal pages (9, triggered by doing things in places, with `catchUpPages()` net) fix
  the v1.5 "muddy middle." Winter shipped: Frostbloom, frostberry forage, winter fish
  +25%, Star-Watch festival. The player-dated anniversary Lantern Festival is genuinely
  original.
- ✗ One festival per season (rubric band: 2–4); winter still thinnest (no winter-only verb).
- ✗ Wing-lighting pays story but no per-wing capability; year 2+ calendar is sparse.

---

## The RuneScape Layer

### Skill Progression — C+ (lowest grade on the board)
The curve is honest; the payout isn't.
- ✓ Real OSRS formula ÷4 (`00-core.js:89-92`); masteries at 25/50/75/99 are true verbs
  ("Clean Fell," "Deep Caller") wired into ~12 mechanical call sites.
- ✓ Farming onboarding density excellent: unlock every 2 levels to 24.
- ✗ Content unlocks end at Farming 24 / Mining 28 / Fishing 32 / WC 18; **Cooking has
  zero level-gated recipes**. Levels 29–49, 51–74, 76–98 change nothing observable —
  three ~24-level deserts per skill (F9 violation). ÷4 with a 99 cap violates the ~1/20
  magnitude rule (mastery 50 ≈ 101k XP against a Turnip's 12 XP).
- ✗ Level-up banner never shows the *next* unlock (§4.3); skills panel shows next mastery
  but not next content unlock.
- ✗ No NPC recognition of skill milestones (§4.6); no cap ceremony beyond the banner.

### Quests & Story — B+
A-tier prose, C-tier quest structure.
- ✓ 14 handcrafted quests + Act 2, zero kill-quests, bespoke turn-in dialogue/cutscenes.
  Grandpa's letters, Rowan's unsent letter, the memorial, the Elias homecoming are the
  strongest asset in the repo.
- ✓ Guild Pin (+10% XP while carried, permanent, daily-use, `08-actions.js:38`) is a
  textbook Barrows-gloves reward.
- ✗ Mid-chain objectives are naked grind gates ("Reach Farming 10," "Reach total level
  60") — the cozy equivalent of kill-ten-boars.
- ✗ No quest-point aggregation; most quest rewards are gold + consumables that terminate
  chains (§3.5).
- ✗ Main chain is sincere-sentimental rather than OSRS-absurd; whimsy lives in the
  noticeboard/festivals instead.

### Mine / Expedition — C+
A resource faucet, not an expedition.
- ✓ Loot feeds the farm (§6.1/§6.6 fully satisfied); 26:00 clock; short sessions; fully
  optional; per-day floor seeds give mild variety.
- ✗ **No checkpoints** — `enterMine()` hard-resets to floor 1 every entry
  (`13-content.js:195`); `mineBest` persists only as a quest stat. Depth never banks;
  the rubric calls checkpointed depth "the single most load-bearing coziness mechanic
  in the genre."
- ✗ No second risk clock (no HP/hazard — nothing to push luck against except bedtime),
  no opt-in high-variance tier, no consumable sinks (bombs/staircases).
- ✗ Ore table recycles "stone" at depth 7+ — no reason to go deep.

### Psychology — B+
Variance is clean; completionism is missing.
- ✓ **Every random roll audited is bonus-only**: double harvests, free swings, second
  plates, perfect-catch doubles, gift bonuses. Withering is telegraphed foregone-gains.
  Pass on §5.2.
- ✓ Goal ladder holds — quest tracker + noticeboard (today), event pill (week), Almanac
  calendar / wings 9/9 / next-mastery (season/year) — until post-story, where only
  megamastery grinds remain.
- ✓ Endpoint & ceremony excellent: staged finale ("Willowbrook is awake, and it's
  yours"), Act 2 second ending, page 9 coda. Permission-to-feel-done granted.
- ✗ **No item collection log, museum, or achievement diaries** — the rubric's biggest
  named completionist tool, absent. (Almanac "· · ·" entries are the right instinct.)

### Whimsy & Tone — B+
The voice is there; the cheapest channel is unused.
- ✓ Committed motifs: Gary the amethyst (heart event → noticeboard → "if you ever sell
  him… I'll KNOW"), turnips, lanterns. 20 hand-written OSRS-quality noticeboard lines.
  Bram's "…" running gag.
- ✓ Five annual festivals, 2–4 min, cosmetic/small rewards, absence never punished —
  near-perfect §7 compliance.
- ✗ **Zero examine text** on items/objects — the rubric's #1 free whimsy channel.
- ✗ Tone skews warm-sentimental over deadpan-absurd (a choice, but noted).

---

## Presentation & Feel

### Visual Coziness — A−
Warm-light-in-cool-dark, fully realized.
- ✓ `SKY_STOPS` day/night lerp exactly per doc (dawn pink-gold → dusk orange-purple →
  deep blue `#0e1130`, never black) with warm lights punched through (`collectLights()`).
- ✓ Seasonal recolor real (`GRASS_PAL`, `TREE_FOLIAGE`); tile hashing (4 grass variants);
  idle life: crop/tree sway, fireflies, pollen motes, drifting leaves, cow breathing.
- ✗ `shade()` (`03-art.js:14`) is value-only — violates the #1 hue-shift ramp rule.
- ✗ Hundreds of inline ad-hoc hex; no named central palette. No in-game chimney smoke or
  butterflies.

### Juice / Game Feel — B
The skeleton is right; the springs are missing.
- ✓ 50 ms hit-pause on chop/mine; restrained 1.5–2.4 px shake; rich particle catalogue;
  item-get arc + sparkle + warm floatText + two-note chime; permanence (tilled/watered
  persists); fishing engineered unlosable.
- ✗ **`tween()`/`easeOutBack` (00-core.js:94-106) are built and never called** — dead
  code. No squash-stretch, no tool wind-up, no apex-hang/vacuum on item-get, no input
  buffering.
- ✗ **Forbidden juice**: pulsing red low-energy vignette (`06-weather.js:94-99`) — the
  doc prescribes gray-out/gentle sag, never red-at-the-player.

### Audio — B−
Impressive synth engine, missing the cozy signatures.
- ✓ Fully generative music (pads/bass/pluck/pentatonic walk, convolver reverb), six modes
  with distinct tempi; ~30 soft SFX; error is a soft low glide, no buzzers; birds by day
  (silenced in winter), crickets at night.
- ✗ Rain mixed *under* music (0.09 vs 0.55) — never replaces it (the doc's single
  strongest cozy audio signal). No seasonal musical identity. No silence-as-rest.
- ✗ No pitch randomization on the most-repeated verbs (till/water/chop/mine/harvest/step
  are pitch-identical every trigger); footsteps not material-aware.
- ✗ Bug: `playSfx("door")` (`04-world.js:103`) references a nonexistent SFX — every
  building/map transition is silent.

### UI — A
Would pass the rubric verbatim.
- ✓ Correct bevel light source (inset top highlight + dark drop), parchment letters with
  ruled lines and −0.6° rotation, dark-brown-on-cream ink, typewriter everywhere (always
  skippable), menus genuinely pause the world, minimal HUD, event pill self-removes after
  its 7-day window — no nagging badges. Full touch fallback.

### Cozy Contract — A
Safety + Abundance + Softness, honored.
- ✓ No combat, no death; staying up past 2am costs nothing; zero energy only blocks with
  a gentle toast; all randomness upward; noticeboard "never required, gone by dawn";
  saves on sleep/`beforeunload`/tab-hide; withering telegraphed at purchase and reported
  softly (🥀).
- ✗ The single contract rub: the pulsing red low-energy vignette (see Juice).

---

## Cozy-per-Line-of-Code Checklist (§8.5) — 3 full / 5 partial / 2 missing

| # | Technique | Status | What's left |
|---|---|---|---|
| 1 | Day/night tint + warm window lights | ✅ Full | — |
| 2 | Rain visuals + audio replacing music | 🟡 Partial | Duck music under rain |
| 3 | Item-get arc + sparkle + chime | 🟡 Partial | Apex hang + vacuum-to-player |
| 4 | Hue-shifted ramps + tile hashing | 🟡 Partial | `shade()` hue rotation |
| 5 | Ambient bird/wind/cricket bed | 🟡 Partial | Continuous wind floor |
| 6 | Squash-stretch + eased tweens | ❌ Missing | Wire the existing tween system |
| 7 | Grass sway + smoke + butterflies | 🟡 Partial | In-game smoke, butterflies |
| 8 | SFX pitch random + material footsteps | ❌ Missing | ±10% detune, surface steps |
| 9 | Wooden bevel UI + soft sounds | ✅ Full | — |
| 10 | Micro hit-pause + tree-shake | ✅ Full | — |

---

## Ranked Priorities

1. **Make the curve pay out** *(progression · high impact)* — Rescale XP toward the ~1/20
   rule (or cap at 50 with 25/35/50 masteries), seed a noun/verb unlock every ≤5 levels
   per skill (Cooking recipes are free inventory), show the *next* unlock on every
   level-up and in the skills panel, give NPCs one line per mastery tier (Rowan is the
   obvious voice). Fixes the lowest grade on the board.
2. **Turn the mine into an expedition** *(high impact)* — Persist depth as an entry-point
   choice (ladder menu every 5 floors), extend the ore/gem table past depth 7, add one
   opt-in push-your-luck lever (unstable shaft: energy for floors). Converts the faucet
   into the genre's most load-bearing coziness mechanic.
3. **Collection log + examine text** *(pure data · cheapest wins)* — An "Almanac of
   Things" (every crop/fish/gem/dish/forage, empty silhouettes, tiered ranks)
   re-monetizes all existing content; a one-line `EXAMINE = {}` table in 01-data.js is
   the cheapest whimsy multiplier in the codebase. Both respect the v1.5 "texture, not
   surface area" rule.
4. **One audio pass** *(~30 lines in 02-audio.js)* — ±10% detune on tool/step SFX, duck
   `musicGain` toward ~0.15 inside `setRainLevel`, add a low continuous wind floor, add
   the missing `door` SFX. Three checklist items in one file.
5. **Wire the dead tween system; retire the red vignette** *(feel · small)* — Apex-hang +
   ease-in vacuum on `pItemPop`, squash on watered crops, ease-out-back on hotbar
   selection — machinery already exists in 00-core.js. Replace the red pulse with
   gray-blue desaturation + soft low tone.
6. **Close the economy's tail** *(medium)* — One absurd vanity sink (golden statue of
   Grandpa, ~25k+), a small infinite decor catalogue, gift the first hen via a quest
   reward, add one artisan machine (cheese churn / preserves pot) as a project payoff.

---

*Method: three independent auditors each read GAME_DESIGN_PRINCIPLES.md as rubric, then
the working-tree source. Grades require file-level evidence. Credit where due: all six
DESIGN_V1.5 steps are verifiably shipped; the remaining gaps are the ones v1.5 explicitly
deferred — plus the progression payout problem it only half-fixed.*
