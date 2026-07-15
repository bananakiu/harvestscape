# HarvestScape Design Scorecard

## v3.23.0 "The Paddock" Re-Audit — 2026-07-14

**Overall grade: A− (held) — but the frontier has moved.**

Fresh four-pillar re-audit (Cozy base / RuneScape layer / Story+Whimsy / Presentation) + a synthesis
pass against `GAME_DESIGN_PRINCIPLES.md` and `GAME_BALANCE_PRINCIPLES.md`, reading the live v3.23 code
and the full v3.12→3.23 changelog with file-level evidence. ~12 releases shipped since the v3.11 audit
below: the Star Metal 4th tool tier, Décor, Deep Run, the mine/ore/gem rebalances + hidden stairs, the
wood rebalance, and the whole construction arc — Lumber, Sawmill, buildable Coop/Barn/Stable, and the
rideable horse.

**Verdict:** the two oldest economy holes the v3.11 audit named are **shipped-closed** — the terminal
deep resources now feed the Star Metal tool (dead-currency → input, **C→B+**) and the late-gold drought
is held shut by Décor's 300k statue + faucet-narrowing (**Interlocking Economy A−→A**). Visual Coziness
rose (**A−→A**, warmer shadows) and the Mine's expedition tension (**B→A−**, Deep Run). **But the
construction arc shipped systems-heavy and ceremony-light:** four releases added the homestead and the
horse with *no* raise-ceremony, *no* NPC recognition, *no* story — so **Whimsy slipped A→A−** — and the
RuneScape endgame still dead-ends (Mining L50–99 desert; terminal ores revert to a one-time faucet once
five tools are forged). The frontier now is **finishing what shipped, not shipping more.**

| Pillar | Dimension | v3.11 | v3.23 | Δ |
|---|---|---|---|---|
| Cozy base | Day Loop | A | **A** | — |
| Cozy base | Interlocking Economy | A− | **A** | ▲ |
| Cozy base | Pacing the Year | A | **A** | — |
| Cozy base | Cozy Contract | A+ | **A+** | — |
| RuneScape | Skill Progression | B+ | **B+** | — |
| RuneScape | Mine / Expedition | B | **A−** | ▲ |
| RuneScape | Terminal-resource loop | C | **B+** | ▲ |
| RuneScape | Bespoke vs. numeric | B− | **B** | ▲ |
| Story | Quests & Story | A− | **A−** | — |
| Story | Whimsy & Tone | A | **A−** | ▼ |
| Presentation | Visual Coziness | A− | **A** | ▲ |
| Presentation | Juice / Game Feel | B+ | **B+** | — |
| Presentation | Audio | B− | **B−** | — |
| Presentation | UI | A | **A** | — |

### Ranked priorities (next work) — muted-verifiable first (audio can't be judged while the build is muted)

1. **[M] Building ceremony + one NPC recognition line each.** The construction arc's payoff is missing:
   a raised coop/barn/stable completes with only a text line on the morning card (§5.5 ceremony + §8.2
   acknowledgment both fail while tool-upgrades/legends *do* celebrate), and not one villager mentions the
   transforming farm (§4.6 "saw your new barn!"). Banner + sparkle + shake at the site on raise; a
   proj-flag-keyed line per NPC. *Closes a Presentation HIGH and a Story MEDIUM at once.*
2. **[L] A 6th/7th deep ore tier (L70/L90) + a repeatable deep-only find.** Mining L50–99 is a 49-level
   content desert — Star Metal L50 is the last mineable noun; the top half unlocks only passives. Add deep
   veins + a repeatable geode/relic table on floors 40+ (the mine's canopy-nest analog, feeding the farm,
   not gold). Couples to #3.
3. **[M] A repeatable endgame material sink + a build recipe for the premium Beams.** The Star Metal tier
   is the ONLY consumer of Cobalt/Star Metal Shard/Silverwood/Heartwood/Starstone; once five tools are
   forged they revert to sell-only, and Heartwood/Silverwood Beam have *zero* build consumer. Ship one
   repeatable sink (premium-beam estate line / Star-Metal décor) that also eats the new #2 ores.
4. **[S] Recruit Mining/stone/gems into the building recipes.** The three buildings draw from Woodcutting
   alone (§2.3/§3.2 cross-feed unmet); only the Sawmill recruits a second skill. Pure data edit to
   `PROJECTS.items` — cheapest high-leverage fix on the board.
5. **[M] "Rowan's Workshop" — the owner-requested construction questline.** The owner asked for construction
   *introduced through a quest, specifically the coop* (DEVLOG); what shipped is a tip + a Ledger
   transaction, and the coop blurb promises "Rowan will walk you through the joinery" but Rowan never speaks
   (§4.4). Reuse the QUESTS/turn-in cutscene machinery.
6. **[M] Fix the mounted-horse composite + mount/dismount juice + an examinable horse.** The mount reads as
   "a person standing in front of a pony" (§8.1); the first-ever movement mechanic has no felt moment
   (§8.2); the idle horse has no examine (§7). *One bundle closes two Presentation gaps + a Story one.*
7. **[S] Squash-&-stretch on the player swing/land + watered crops.** The exact v3.11-named Juice gap, still
   open (§8.2) — ~10 lines that change feel, not rules.
8. **[M] A quest-point meta-currency + one bespoke-mechanic quest step.** Every objective is a numeric
   threshold/flag (§4.4); no meta-currency sums the light content (quests, legends, pages, hearts).
9. **[M] Give winter a renewable pillar** (season-gated workshop / civic build) — the construction epic only
   fills the *first* winter; §9's thin-season gap persists. ✅ **Shipped v3.31.0** — winter ice fishing:
   two winter-exclusive fish (Frostfin L15/300g pond+coast, Glassperch L48/1000g coast) gated by a new
   `FISH.season` field, so the frozen coast has a *renewable* catch that no other season gives. (A lighter,
   more cozy-native answer than a workshop/civic build — reuses the fish system whole; more winter-specific
   loops can still layer on later.)
10. **[S] Housekeeping** — migrated-save stable z-overlap (footprint-exclusion only protected fresh saves);
    7 hand-written lumber examines; palette-ramp hue audit.
11. **[M — needs audio] Audio bed** — always-on wind floor, ungate ambience, seasonal musical identity (the
    ~6-audit-stuck B−). Ranked last *only* because the build is being tested muted; promote it the moment
    audio testing resumes.

*The prior audit (v3.11) is kept below as history.*

---

# HarvestScape Design Scorecard — v3.11 Re-Audit (2026-07-14)

**Overall grade: A− (held from v2.0 — but the floor underneath rose materially)**

Re-audit of the v3.11.0 working tree against `GAME_DESIGN_PRINCIPLES.md` by four
independent pillar audits (Cozy base / Progression / Story+Whimsy / Presentation) plus a
synthesis pass, each reading the full v2.1→v3.11 changelog and the live code with
file-level evidence required. The prior graded audit was v2.0 (below, kept as history);
~24 releases shipped between them.

**Verdict:** the letter holds at **A−**, but that understates the work — **six dimensions
rose and none fell**, and the two weaknesses the v2.0 audit named as the game's core
tension are both substantially healed: the skill-content deserts (Skill Progression
**B−→B+**) and the flat story (Quests & Story **B+→A−**). What keeps it at A− rather than A
is that four *structural* gaps no release has touched now stand out clearly against the
higher floor: the audio bed (**B−**, unmoved ~5 audits), the mine's lost expedition tension
(§6.2–6.4 structurally gone since the underground clock was frozen in v2.9), the late-game
gold-sink drought (§3.6, *widened* by v3.10/3.11's new high-value faucets), and value-only
`shade()` (§8.1's #1 rule, capped since v1.5).

| Pillar | Dimension | v2.0 | v3.11 | Δ |
|---|---|---|---|---|
| Cozy base | Day Loop | A | **A** | — |
| Cozy base | Interlocking Economy | A− | **A−** | — |
| Cozy base | Pacing the Year | A | **A** | — |
| RuneScape layer | Skill Progression | B− | **B+** | ▲ |
| RuneScape layer | Quests & Story | B+ | **A−** | ▲ |
| RuneScape layer | Mine / Expedition | B− | **B** | ▲ |
| RuneScape layer | Whimsy & Tone | A− | **A** | ▲ |
| Presentation | Visual Coziness | A− | **A−** | — |
| Presentation | Juice / Game Feel | B | **B+** | ▲ |
| Presentation | Audio | B− | **B−** | — |
| Presentation | UI | A | **A** | — |
| Presentation | Cozy Contract | A | **A+** | ▲ |

*(Psychology folded into its neighbours this pass; it tracks A−, lifted by the Collection,
mastery praise, and the goal-ladder work.)*

## What rose, and the evidence
- **Skill Progression B−→B+** — v3.10 "The Long Climb" + v3.11 "Second Helpings" filled the
  content deserts the v2.0 audit flagged: 6 late crops (L30–90), 4 deep fish (L40–85), 8
  recipes (L44–90), and Cooking went from *zero* gated recipes to a full 1→90 ladder.
  `nextUnlock()` now renders on every skill tile; mastery praise speaks at 25/50/75/99. Held
  under A− by Mining's residual 28→45→70 gaps and the level-up banner still not previewing
  the next unlock.
- **Quests & Story B+→A−** — the v3.4–3.6 overhaul attacked all five DEVLOG "falls flat"
  causes: healing is now *physical* (the village rebuilds per lit wing, with a rubble
  "before"), Act I seeds questions (the planked door, Maya's scribbled-out figure, Tom's
  slipped "El—"), the quest rewrite gave gates a human voice, and the Lantern Test is a real
  midpoint. Under A by: every objective is still a numeric threshold (zero bespoke-mechanic
  quests, §4.4), no quest-point meta-currency, and a linear arc with no player choice.
- **Mine B−→B** — depth banking is visible, paid, permanent (the Old Lift's pledge ledger);
  shallow-camping is no longer optimal. Under B+ by the lost expedition tension (below).
- **Whimsy A−→A** — the "#1 free whimsy channel," examine text, is fully closed: ~130 items
  + objects + NPCs + tiles, all voiced.
- **Juice B→B+** — the dormant tween system is wired (gold count-up, item-pop bloom/apex-hang),
  plus corner-nudging. Under A− by missing squash-&-stretch on watered crops / player.
- **Cozy Contract A→A+** — the two v2.0 holds retired (red danger vignette → warm sleepy haze;
  lightning wash capped), and every new system is contract-exemplary.

## Ranked priorities (next work)
1. **[M] Give the terminal deep resources a downstream loop** — Cobalt Ore, Star Metal Shard,
   Silverwood, Heartwood are *sell-only* (tool tiers stop at Gold; `machineLoadable` excludes
   ore/wood), so v3.10's Mining/Woodcutting ladders are pure faucet, breaking §3.5
   reward-is-an-input. One change closes the most goals at once: a **Star-Metal tool tier (4th)
   + a craft/smith sink for the rare timbers** makes the new veins a real payoff, adds a §4.2
   *transformative* late unlock (not another same-verb bump), and re-tunes cross-feed
   (§3.1/3.2). *(Flagged independently by the v3.10 adversarial review too.)*
2. **[M] Restore the mine's expedition tension the cozy way** — freezing the clock underground
   (v2.9) removed §6.2's only risk clock, so push-your-luck (§6.3) and consumable-prep (§6.4)
   are structurally gone. Add an **opt-in "deep run" mode where time flows**, with a
   **staircase craftable from bulk Stone** (a real sink for the near-dead 3g resource) — a
   Skull-Cavern loop that never touches the timeless default mine.
3. **[M] Close the §3.6 gold-sink drought** — PROJECTS is ~20k one-time; there's no infinite
   decor catalogue and no absurd vanity sink, while v3.10/3.11 widened the faucet (Grand Feast
   5400g). Ship a **placeable decor/furniture catalogue** (reuse the hive/machine placement
   path) + **one deliberately absurd vanity buy**.
4. **[M] The one-file audio pass** — Audio is the only presentation dimension stuck (~5 audits)
   and the cheapest grade-mover: an **always-on ambient bed** (a low-gain "wind" node + ungate
   birds/crickets from clear-only) fills §8.3's open hole; **season-keying the scale/timbre**
   and letting the pad drop out for silence-as-rest lifts it a full grade.
5. **[L] Make the story spine adventures, not turn-ins** — 1–2 flagship quests with a real
   bespoke step (item combination / hidden location), a **quest-point tally** aggregating the
   light content, and one **2-option choice fork** (the deferred Star-Metal choice) — pushes
   the story's peaks from A− toward A and finally gives narrative autonomy.
6. **[S] Two cheap high-propagation fixes** — rewrite `shade()` to **hue-shift** (darken +
   rotate toward blue on shade, warm on highlight; §8.1's #1 rule, propagates through all
   procedural art) and **preview the next unlock in the level-up banner** (`nextUnlock()`
   already exists; completes §4.3).

---

# HarvestScape Design Scorecard — v2.0 Re-Audit (July 2026)  *(historical)*

**Overall grade: A− (was B+)**

Re-audit of the working tree after the v2.0 update ("A Day Worth Staying Up For"),
graded against `GAME_DESIGN_PRINCIPLES.md` by three independent code audits. Each
auditor read the July 10 baseline scorecard and graded deltas explicitly. Economy
claims checked arithmetically. Previous scorecard: git `97f2b8a`.

**Verdict:** v2.0 is a real design leap — **five dimensions rose, none fell**. The
diagnosis (sleep-skip as dominant strategy) was correct, the four features genuinely
interlock, and the Hunt is the first feature that is simultaneously progression
content, a collection log, relationship payoff, and whimsy delivery — the RuneScape
soul the last audit called "mostly promise" now has a working proof of concept. Two
things keep it from an A: **Tom's Demand is mis-tuned** (its own constants let a
drip-seller keep ~96% of the old monoculture income, and the 0.55 floor makes a
50-plum orchard the new passive meta), and **the presentation debts are now two audits
old** — zero of eight previous findings fixed.

| Pillar | Dimension | v1.5 | v2.0 | Δ |
|---|---|---|---|---|
| Cozy base | Day Loop | A− | **A** | ▲ |
| Cozy base | Interlocking Economy | B+ | **A−** | ▲ |
| Cozy base | Pacing the Year | A− | **A** | ▲ |
| RuneScape layer | Skill Progression | C+ | **B−** | ▲ |
| RuneScape layer | Quests & Story | B+ | **B+** | — |
| RuneScape layer | Mine / Expedition | C+ | **B−** | ▲ |
| RuneScape layer | Psychology | B+ | **A−** | ▲ |
| RuneScape layer | Whimsy & Tone | B+ | **A−** | ▲ |
| Presentation | Visual Coziness | A− | **A−** | — |
| Presentation | Juice / Game Feel | B | **B** | — |
| Presentation | Audio | B− | **B−** | — |
| Presentation | UI | A | **A** | — |
| Presentation | Cozy Contract | A | **A** | — |

---

## What v2 verifiably shipped

All four roadmap features + both fixes confirmed in code:
- **Tom's Demand** — `DEMAND`/`demandMult()` (`01-data.js:239-245`), applied in
  `sellItem()` (`08-actions.js:776-804`), reset in `newDay()`; honest shop UI shows
  demand %, next-unit price, strikethrough (`10-ui.js:356-367`); save migration in place.
- **Forecast, five weathers** — `rollForecast()`/`rollWeather()` (`06-weather.js:196-229`),
  tomorrow rolled tonight and posted on the noticeboard, Almanac "The Sky," and the
  sleep card. Festivals/birthdays can never storm or fog (`isDatedDay`); day 1 always clear.
- **Weather offerings** — storm: coast closed (`08-actions.js:195-198`), mine
  `oreBoost 1.5`, next-morning beach wrack; rain: double forage, bite time ×0.6,
  auto-water; fog: `gemBoost 2.2`. "Weather never takes anything from you" stated in
  code comments and honored by the code.
- **The Hunt** — five legendary fish (`LEGENDS`, `01-data.js:105-126`) at Fishing
  14/22/26/30/34 with a 4-level grace ("a clue is never a dead end"); one clue per
  Bram heart (`bramClueDue()`/`tellClue()`, `14-story.js:299-312`), auto-written into
  Bram's Ledger in the Almanac.
- **Orchard & Apiary** — saplings (28-day maturity, fruit cap 3), hives keyed to
  flowering tiles within radius 4 (`hiveYield`, `08-actions.js:646-717`); flowers
  unsellable; trees movable via `digUp`.
- **Hoe row-tilling by tier** (`canTiles` routing, `08-actions.js:109-117`);
  **honest snow** (only rain waters, `08-actions.js:607`, stated in UI).

## The headline fix, checked arithmetically

Demand as coded: units 1–6 full price, then `max(0.55, 0.96^(k−5))`. The 10th unit
pays **85%** (roadmap claimed ~70%); the floor lands at unit 21 (roadmap: 40).

- **Dump-selling** 50 starfruit: 65.9% of full price → ~1,100g/day net (was ~3,125g). Fixed.
- **Drip-selling** 6/day from a stockpile (no spoilage, daily reset, value-blind free
  allowance): full price forever → the monoculture keeps **~96%** of its old income
  for one shop visit a day. Not fixed.
- **New passive layer:** mature plums cost zero energy/seeds; at the 0.55 floor,
  50 plum trees out-earn the old starfruit meta with less daily work — exactly what
  the `FRUIT_TREES` comment says must never happen. (The code comment at
  `01-data.js:237` — "loses about two thirds" — is inverted; the dumper *keeps* two thirds.)

Sleep-skip overall: substantially improved. On ~40–55% of days the sky posts a
today-only project, and night legends (20:00–26:00) literally reward staying up. Clear
days (45–62% odds) remain thin, and the drip/orchard floor keeps low-effort income
competitive.

---

## Dimension notes (deltas only — see git 97f2b8a for the v1.5 baseline)

### Day Loop A− → A
Forecast is a textbook go-to-bed-wanting-tomorrow device; the sky now proposes the
day's project. New morning verbs all cozily capped (fruit 3, honey 3, wrack one-day) —
no chore inflation. Unchanged: free 26:00 overwork, instant tool upgrades, thin clear days.

### Interlocking Economy B+ → A−
New interlocks are real: crop placement changes hive capacity (§3.1 pass), sky couples
to mine/fishing/forage, ~70k g of new sinks. Capped below A by the drip loophole +
0.55 floor, §3.4 violated again (first sapling 850–1,300g and hive 700g are
speculative purchases), still no artisan machines, no vanity sink, gems near-terminal.

### Pacing the Year A− → A
Per-season weather tables, four season legends + one storm legend, season fruits as
planting puzzles. Remaining: 1 festival/season (band 2–4); hives and trees both go
dark in winter, deepening its thinness; snow's posted offer mostly re-advertises
winter-season content (a "numbers must be honest" rub).

### Skill Progression C+ → B−
Fishing now has an unlock every 3–5 levels to 34 — the best curve in the game, proving
the pattern. Unchanged: Cooking has zero gated recipes; Farming/Mining/WC deserts;
next content unlock still never shown (`addXP` banners only what just unlocked;
`renderSkills` shows next mastery only); zero NPC recognition of milestones. New
problem: Fishing 35–98 is now the longest desert, spotlighted by its own checklist.

### Quests & Story B+ (held)
The Hunt's delivery is exactly right — clues through relationship, in Bram's voice,
nothing missable. Held because: legends are sellable trophies, not permanent
capabilities (Barrows-gloves test failed; Guild Pin still the only pass); 5/5 legends
pays nothing — no capstone scene; grind-gate objectives and missing quest-point
aggregation unchanged.

### Mine / Expedition C+ → B−
Weather reaches underground: storm ore ×1.5, fog gems ×2.2, with the forecast making
§6.4 "picking a good day" real; storm closing the coast is textbook lateral
redirection. Still unfixed (overhaul was an acknowledged cut): `enterMine()` resets to
floor 1; stone recycles past depth 7 — so on fog days shallow camping is optimal,
**inverting** the boost's incentive; no second risk clock, no consumable sinks.

### Psychology B+ → A−
Bram's Ledger is the empty-silhouette collection log verbatim ("· · · — Bram hasn't
told you about this one yet"), with X/5 counter and condition lines. Goal ladder now
passes at every horizon (weather offer + forecast + request on the board). Demand is
deterministic, inspectable, floored, daily-reset — foregone gains only. Soft spots:
log covers 5 items (crops/gems/dishes still unlogged); legend bites (34–40%/bite)
lack a pity floor on rare windows.

### Whimsy & Tone B+ → A−
Whimsy now attached to systems, not just scenes: five weather personalities, Bram's
clue monologues (best deadpan in the repo), `TOM_GLUT` ("My window looks like a
starfruit museum"). Still zero examine text — the #1 free channel, two audits running.

### Presentation (all held)
- **Visual A−:** weather grades are the best new work (fog banks, snow drift, storm
  tint — never black, lamps stay lit). `shade()` still value-only and now propagated
  into ~62 lines of new art. New borderline item: lightning wash at 50% alpha
  (`06-weather.js:132-134`) — cap ~0.25 or vignette-shape it. Thunder SFX, by
  contrast, is exemplary ("a distant roll, entirely harmless").
- **Juice B:** zero movement; tween system enters its second audit with no call
  sites; the legendary catch borrows the level-up jingle and exceeds the shake budget.
- **Audio B−:** rain still never ducks music (missed in the one update where it was
  cheapest — storm caps at the same 0.09 as drizzle); no pitch variation on tools;
  the `door` SFX bug now silences more transitions than before. Fog days going quiet
  (birdsong gated to clear) is a nice accidental hush.
- **UI A:** forecast surfaced in exactly the right three places. Thin spot: "sell
  all" previews only the next unit's price, not the blended total.
- **Cozy Contract A:** the new systems are contract-exemplary. Held from A+ only by
  the surviving red vignette and the lightning wash.

## Cozy-per-Line-of-Code Checklist — 3 full / 5 partial / 2 missing (unchanged)

Items 1, 9, 10 full; 2, 3, 4, 5, 7 partial (5 and 7 marginally improved via
thunder/snow-bed/fog-hush and hive bees/orchard sway); 6 and 8 still missing.

## Ranked Priorities

1. **Retune Tom's Demand to match its own prose** *(constants patch)* — persist
   saturation overnight with partial recovery (halve `state.market` at dawn instead
   of clearing), lower the floor toward ~0.25–0.35, value-scale the free allowance,
   show the blended total on "sell all." One patch closes the drip loophole and the
   plum-orchard passive layer.
2. **Pay out the other four curves** *(carried over; Fishing proves the pattern)* —
   level-gate 8–10 recipes, show the next content unlock on level-up and in the
   skills panel, one NPC line per mastery tier.
3. **Bank mine depth** *(fixes v2's inverted incentive)* — ladder-entry every 5
   floors + extend the ore/gem table past depth 7 so fog/storm days pull players down.
4. **The one-file audio pass** *(~30 lines, two audits owed)* — duck music under
   rain/storm, ±10% tool/step detune, wind floor, define `door`.
5. **Finish the weather board; gift the first sapling** — one real today-only
   offering each for snow and clear; route the first hive/sapling through Rowan or
   the noticeboard (§3.4).
6. **Crown the Hunt** — a 5/5 capstone scene with Bram paying a permanent keepsake
   (not gold); bespoke legend fanfare + apex-hang item-pop (wire the dormant tween
   system); retire the red vignette while in the file.

---

*Method: three independent auditors, GAME_DESIGN_PRINCIPLES.md as rubric, file-level
evidence required, deltas graded against the July 10 baseline (git `97f2b8a`). The
design thinking behind v2 — diagnose the dominant strategy, fix incentives before
adding content, cut features that re-introduce chores — is exactly what the
principles doc prescribes. The remaining work is a numbers pass the design already
implies, plus the presentation debts that predate both audits.*

---

## Progress since this audit (v2.1 → v2.6.1, 2026-07-11)

Every one of the six ranked priorities above has now shipped, plus the owner's playtest
verdict and the two-audits-old presentation debts. Map (see `CHANGELOG.md` for detail):

1. **Tom's Demand** → **v2.1** — overnight halving, floor 0.35, value-scaled allowance, blended sell-all. ✅
2. **Pay out the four curves** → **partial**: next-unlock shown on level-up + skills panel (v2.1);
   **Cooking level-gated 1→40** and **one NPC line per mastery tier** (v2.6). *Remaining:* the
   Farming/Mining/Woodcutting *content* deserts between mastery tiers (perks fill them; no new gated items).
3. **Bank mine depth** → **v2.1** — checkpoint every 5 floors, deeper ore table. ✅
4. **Audio pass** → **v2.1** (rain/storm ducking, ±10% tool detune, `door` sfx) + **v2.4** (bespoke legend fanfare). ✅
5. **Weather board + first sapling** → **v2.1** (Pip gifts the first sapling) + **v2.5.1** (event pill
   de-nagged to day/eve, warm nudge moved to the sleep card). ✅
6. **Crown the Hunt** → **v2.1** (5/5 → Bram's Oilskin keepsake) + **v2.4** (bespoke fanfare, apex-pop,
   tween system wired; red vignette retired earlier). ✅

**Beyond the audit, also shipped this session:**
- **Examine text** (the "#1 free whimsy channel, two audits running") — press Q/X, 129 lines (**v2.3**).
- **The Collection** — a discovery museum, the completionism the Psychology dimension asked for (**v2.5**).
- **New Player Experience** — the owner's first-playtest #1 (prologue, mission letter, Maya arrival,
  act-aware journal, contextual hints); see `DEVLOG.md` / `NEW_PLAYER_EXPERIENCE.md` (**v2.2**).
- **Cozy-contract UI polish** — non-red low-energy bar, de-nagged calendar cue, pickup totals, touch
  examine (**v2.5.1**). **Regression review** of the session → 4 confirmed bugs fixed (**v2.6.1**).

**New top-of-backlog (recommended for the next session):**
1. **Farming/Mining/Woodcutting content between tiers** — the last of the "deserts": a new gated
   crop/tree/ore or a small mid-level unlock so those curves pay content, not just perks.
2. **Artisan machines** — a keg/preserves-jar that turns a crop into a higher-value good over a day
   (the Economy's "still no artisan machines" gap; interlocks with farming + Tom's variety demand).
3. **A vanity / cosmetic gold sink** — late-game coin still has few homes past Rowan's projects.
4. **Sheep + Wool** — restore Wool to the Collection with a real source (a sheep in the barn), which
   v2.6.1 removed as unobtainable.
5. **Mine-as-expedition depth** — a reason to go deep (a deep-only find / gentle goal), strictly within
   the no-combat cozy contract.
