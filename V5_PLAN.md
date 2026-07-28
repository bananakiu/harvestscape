# Version 5 — A Life in the Valley (the plan)

> **★ Status: BUILT AND SHIPPED — all ten releases, v5.0 through v5.9, 2026-07-28/29.** Every item in
> §4's release train shipped and every owner decision in §6 is resolved (see the ★ marks there). The
> measured outcome, from the linter this version shipped in v5.0: Mining 88.5% → 60.9% dead share,
> Warding 88.5% → 59.1%, Fishing 79.0% → 56.8%. Two decisions were changed mid-build by measurement
> rather than opinion — the gem-seam rate (wrong by 6× until sampled) and the second legend's level
> (75 → 80, because 75 was already a mastery milestone). Kept as the design record behind the version.
>
> *Original status line:* roadmap, not built. Owner direction 2026-07-28 (`DEVLOG.md`): *"take a thousand-foot
> view… think about how it can be improved as a game that can be playable for a while… apply all the
> good gaming concepts… a very detailed roadmap that can span maybe two whole big versions."*
> **This is version one of two.** `V6_PLAN.md` is the second.
> **How this was produced:** an eight-lens design review of the live v4.37 code (endgame ceiling,
> mastery curve, combat depth, expression, social, economy, living world, synergy — each grading a
> canonical long-term-play concept and citing code), then an adversarial cross-check that deduped,
> screened against every existing plan, and named what all eight lenses missed. Every load-bearing
> number below was measured against the live tables, not estimated.
> **How to build from this:** the `V4_BUILD_PLAN.md` pattern — before each release, write its build
> order fresh, re-verify every symbol anchor named here, and ship one release per session in order.

---

## 0. The diagnosis in one paragraph

The game at v4.37 is **excellent at the day scale and hollow at the year scale.** The daily loop is
genuinely strong (four dailies, real weather offers, a good tracker); the story is complete
(Acts I–III); the UX just had a seven-release repair train. What's thin is everything a *committed*
player grows into: the back half of every skill ladder pays almost nothing (measured below), the two
newest systems never touch (no food restores Resolve), the wedding is a cliff (five watered tiles and
a breakfast roll — the spouse never moves in, on-screen promise notwithstanding), the cottage the
player wakes in every single day is hard-coded and regenerates nightly, and the goal ladder
literally blanks at the top (`standingGoalsHtml` returns `""` once skills/museum/crown are done).
The two-version arc answers this in order: **V5 makes the middle of the game pay — the ladder and
the home.** V6 makes the *end* of the game a place to live (`V6_PLAN.md`).

## 1. The measured case

These numbers are the spine of V5; each was extracted from the live tables this week.

**The mastery curve breaks exactly where commitment begins.** The XP curve is exponential
(`XP_TABLE`, `00-core.js`: ~`62 + (l−1)^2.18` per level), which means level bands are wildly unequal
in hours. XP-weighted:

- The band **85→99 costs 45.4% of a skill's entire 1–99 XP** — and for four of six skills
  (Mining, Woodcutting, Fishing, Warding) **level 85 is the last content unlock.** Nearly half of
  those grinds pays out one mastery line at 99. Farming/Cooking last-unlock at 90 (34.6% left).
- **Mining 50→70 is the single worst void: 19.3% of the whole climb with literally nothing in it.**
  Mining has 11 milestone levels total — the fewest nouns of any gathering skill.
- **Warding — the v4 flagship — has the thinnest ladder in the game**: six stave tiers + four
  mastery lines. `unlocksAt` has no Warding content branch at all; a Warding *level* buys almost
  nothing because v4.20 correctly moved creatures to depth-keyed `WARD_BANDS`.
- Trees/Ores/Fish share identical dead bands 55→70, 70→85, 85→99. Crops and Recipes are
  well-laddered (v3.10/v4.7/v4.8 did their job) — **do not touch them.**
- The game's own bible convicts this shape: `GAME_DESIGN_PRINCIPLES.md` §4.1 — *"single-player
  rule: never leave a dead zone"* — and v4.21's capes/crown actively invite players into the
  emptiest 45% of every ladder.

**The two newest systems don't feed each other.** `V4_PLAN.md` §2 specced *"cooked dishes restore
it — Cooking's new consumer."* Never shipped: `eatFood` touches only `state.energy`; no code path
feeds `state.resolve` from any item; Resolve refills free at dawn/entry/exit and effectively at any
bell. The bible's §6.4 ("preparation is the real combat skill") is structurally absent — there is
nothing to prepare.

**The climax has no encounter.** `CREATURES.greatknot` is stat-frozen (hp 42 / dmg 20 / xp 360) with
no depth term — floors 10/20/30/40 host the *identical* two-move fight, and by the Star Stave it dies
in four swings. Floor 45 — the destination of Act III's finale chapter — spawns **no boss at all**:
`genUndercroft` prints "the wing ends here — for now". The emotional climax of the whole game has no
mechanical mirror.

**Married life is five tiles and a coin-flip.** `spawnMapNpcs` has no cottage case — Maya says, on
screen, *"I'm moving my sketchbooks into the cottage tonight"* (`MARRIAGE_SCENES`) and then sleeps at
the Alderman House forever. The scorecard flagged this exact broken promise at v3.32; it is still
unshipped. Hearts hard-cap at 6 (`heartsOf`), so every point past 600 evaporates — a player maxes the
entire cast in roughly two seasons, then the friendship system is inert. Tom's ladder ends at 5♥,
Pip's at 4♥.

**The cottage is a diorama.** `genCottage` hard-codes every prop and regenerates nightly (only
`state.farm` persists). `plantPermanent`'s first line refuses décor anywhere but the farm map.
Four expression channels the cozy genre lives on — home, ground, avatar, automation — are entirely
absent; the one that exists (outdoor décor, 21 pieces, cap 40, lossless pickup) is well built and
proves the appetite.

**The economy's referent problem returns at tier 11.** v4.26's Patron fix was built on its own
diagnosis — *"gold's problem was never the amount, it was the absence of a referent"* — and
`PATRON_FIXTURES` has exactly **ten** entries. Tiers 1–10 (cumulative ~954,000g) exhaust every
visible commission around day 80–110; from tier 11 the sink is unbounded but the *desire* is
bounded: gold buys a generated string. Also structural: `demandMult` is a hardcoded `return 1`, so
**every new sellable in V5/V6 is an unbraked faucet** — each content cluster needs its GBP pass at
spec time, not after (the v4.26 hand-nerf is the failure mode).

## 2. What Version 5 is

**Banner: *A Life in the Valley* — the middle of the game pays, and the valley stops being a place
you work and becomes a place you live.**

Two spines, interleaved through the release train:

- **The Ladder** (the RuneScape promise): mastery trials at 50/75, a real technique ladder for
  Warding, Mining's voids filled, the Cooking→Resolve economy, a boss ladder and the terminal
  fight, Fishing's second half begun. *No dead level, no orphaned good, no empty climax.*
- **The Home** (the Stardew promise): the spouse moves in, the cottage becomes decoratable and
  persistent, hearts go to 10 with the missing capstones, the ground takes paths.

Plus **release zero: the Strongbox** — infrastructure no lens proposed but the cross-check demanded,
because everything else stands on it (see §4, v5.0).

Deliberately **not** in V5 (these are V6): the deep venues and anything below floor 45, the
perfection ledger and records telemetry, automation (the bible's F2 orders decoration *before*
automation — v5 ships decoration, v6 may then ship ease), the child, newcomers, second festivals,
the audio identity pass.

## 3. What the player sees after V5

A player at Farming 52 crossing 50 gets a *scene*, not a line: Maya sets a trial (a cross-skill
favor on the pledge-deposit pattern), the level banks meanwhile — never regresses, saves already
past 50 auto-pass — and clearing it is a story beat that pays a real reward. Six times per save.

A warden descending eats before the descent, packs a tonic bound at the bell bench, and plays
differently at L55 than at L35 — not bigger numbers, different *verbs* (a sweep, a settling blow, a
generalized riposte). Each decade's Great Knot asks a different question, and at the bottom of the
wing there is finally something that answers Act III's finale.

A married player's spouse is *in the house* — props moved in, sketchbooks on the table, morning
lines in the kitchen, new scenes past the wedding. The cottage takes furniture from a catalog and
keeps it. Hearts climb to 10 for everyone, and Tom and Pip get the capstones the scorecard has asked
for since v3.32.

A ferry arrives some mornings with a merchant whose stock rotates weekly. Some nights the sky does
something rare. The Guild's weekly writ asks for a cross-skill bundle — and rotates when *done*,
never when a timer shames you.

## 4. The release train

Order rationale: infrastructure first (everything after adds persisted state); then the two
highest-reach ladder releases (trials fire six times per save; the Resolve economy touches every
story-following player); the home block in the middle (the XL of the version); market/sky rhythm
late (pure data, low risk, good palate cleansers); the writ last (it wants the trials' reward
plumbing to exist).

| Release | Contents |
|---|---|
| **v5.0 "The Strongbox"** | **Infrastructure, before any state-heavy feature.** (1) **Save export/import** — a Copy/Download save button on the title screen and Settings, plus paste-to-restore. The entire game lives in ONE localStorage slot; browser eviction or a cleared cache is *total permanent loss* — the largest cozy-contract violation possible, sitting one browser setting away. (2) **The migration harness** — `tools/check-saves.mjs` + fixture saves from each era (v2.x, v3.x, v4.0, v4.31, current) run through `migrateSave` in node, asserting invariants (no lost items, no demoted levels, no NaN). `migrateSave` has grown for ~124 version codes with zero automated coverage, and V5 adds more persisted state than any version before it. (3) **The year-3 fixture** — a synthetic dense save (full farm, 40 décor, all animals, deep progress) + a measured frame/`newDay` budget, so the expression features land against a number, not a hope. (4) **The ladder linter** — load-time `auditUnlockCadence()` beside v4.23's `auditRecipeLadder`: warn on any ≥8-level unlock gap, print each ladder's XP-weighted dead share, surface it in the atlas. (5) **Docs debt:** re-anchor `GAME_BALANCE_PRINCIPLES.md` §2.5/§9/§10 (it still documents Tom's Demand as live; the *player-facing* half was fixed in v4.32, the agent-facing doc was not) + refresh the stale `AGENTS.md` backlog (Fishing/Cooking charms and orphan recipes shipped in v4.7/v4.8 — verified). |
| **v5.1 "The Trials"** | **Mastery trials at 50 and 75, all six skills** — the thrice-deferred top of the backlog, exactly per `V4_PLAN.md`'s locked spec: crossing the gate triggers a one-time scene from the craft's caring NPC (`MASTERY_NPC` already maps all six), asks a cross-skill favor on the Pledge-Ledger deposit pattern, **XP banks while the level holds — never regresses — and any save already past the gate auto-passes.** Plus **the Stave arts**: Warding's 50/75 trials pay *combat identity* — 2–3 learnable arts (Sweep: wider arc, lower power; Settling Blow: hold-to-charge, ignores a Warden's guard; the riposte generalized) selected as a stance at the bell, never a combo system (bible §6.5.3). Plus **the Warding technique ladder** at ~L15/35/55/65/80 (lantern-flare slow, two-target sweep, bolt-parry, ward-pulse) so the game's newest 1–99 skill stops being the one whose levels mean the least — each a new input or outcome, *never* a damage stat; the tier ladder (1/10/20/30/45/70/85) does not move. |
| **v5.2 "The Warden's Table"** | **The Cooking→Resolve economy — closing v4's own open spec.** (1) Eating inside the Undercroft restores Resolve, tiered by dish level (a `resolve` branch in `eatFood` when on a combat map; F already works everywhere). (2) Two or three **Warden's tonics** bound at the bell bench, combining cooked dishes with settling drops (Ember Broth: Ember Grit + a soup → regen for one floor; Gloamsalve: Gloam Thread + honey → next knockout auto-saved once) — Cooking finally *consumes* a Warding drop and vice versa. (3) **The named invariant, written into GBP the day this ships:** *no Undercroft encounter is ever balanced assuming food.* The free bell refill stays; the baseline IS the balanced game (the same rule `MONETIZATION.md` lives by, pointed inward). (4) **The Guild eats too:** `WARD_ROUNDS` and `PATRON_MATS` gain farm/kitchen/fish entries so the endgame rotations finally ask the farm for something. |
| **v5.3 "The Deep Seams"** | **Mining's two voids filled** — dedicated gem veins interleaved *between* the sacred ore rungs (Opal Seam ~15, Emerald ~35, **Ruby ~55 — landing inside the 19.3% void**, Diamond ~78), procedural rock sprites from the existing gem pipeline, drop rates set by a GBP pass at spec time (gems already have sinks; keep them scarce). One prospecting perk ~L60 ("read the seams": vein locations shimmer on entering a floor) as a method unlock. **Fishing's late waters, part 1:** two late legends at ~60/75 on the pure-data `LEGENDS` engine (conditions + a Bram clue each — the cheapest high-value content in the repo), heart-gated clues giving Bram's ladder a late payoff. |
| **v5.4 "The Oldest Knot"** | **The boss ladder** — depth-variant Great Knots reusing shipped mechanics as escalating movesets (floor 20 sheds Tanglets when struck; floor 30 lobs star-bolts between slams; floor 40 chains both), each decade examining the answer the preceding floors taught. **The terminal fight** — one bespoke multi-phase encounter on floor 45, the "oldest knot" ch7's dialogue already names: the mechanical mirror of the tenth-lantern finale, every telegraph in the game's vocabulary, knockout still free. **Retroactive for finished saves** — the bottom floor simply gains the fight. |
| **v5.5 "Moved In"** | **The post-marriage cliff, repaired.** A marriage branch in `spawnMapNpcs`: the spouse is present in the cottage mornings/evenings on a simple schedule, spouse props stamp into `genCottage` (the sketchbooks, Bram's rod rack — the promise kept, visibly), morning/evening married dialogue pools (not the current 4 rotating lines), and **two new married heart-tier scenes per candidate** — the arc continues past the bouquet. The anniversary beat reads the deeper state. |
| **v5.6 "Ten Hearts"** | **The heart cap rises 6→10** — banked points already exist, so long-tenured saves *gain* hearts on load (granted, never owed: the cozy way to raise a cap). New scenes: **Tom's 6♥+8♥ and Pip's 6♥+8♥ capstones** (the scorecard's open ask), one late scene each for the rest of the cast at 8♥, marriage candidates' new tiers folding into v5.5's married arc. **Hard guard from v4.6's unreachable-event bug: the retier must never re-gate a seen scene or make a reached tier unreachable — write the migration test into the v5.0 harness first.** |
| **v5.7 "Four Walls"** | **The cottage becomes yours.** A `state.home` persistence overlay (the farm-objects pattern applied to the cottage map: placed items win over `genCottage` defaults), an **interior catalog** (~15 procedural pieces at launch: rugs, lamps, shelves, curtains, the Loom's outputs arrive in V6), placement/pickup on the existing hive/décor verbs, and **house-expansion pledges** (Rowan builds: a second room, a cellar door) as the expression gold sink the economy lens found missing. The v5.0 perf fixture gates this: interior draw cost is measured before shipping. ★ This is the version's XL; if it slips, it slips whole — do not ship a half-persistent cottage. |
| **v5.8 "The Ferry Comes In"** | **The visiting merchant** — some mornings the ferry is in (seeded like `todaysRequest`, ~2 days/week), with a small rotating stock: rare seeds out of season, one deep material, one décor piece not in Tom's catalog, a curio. **Nothing baseline-required is ever merchant-exclusive** (expiring offers are foregone gain — legal; a missed *necessity* would not be). This stall is also `MONETIZATION.md`'s designated diegetic home, built system-first, brand-slot later. **Tom's Craving** — a positive-only daily rotation (one item Tom pays 1.5× for today, announced on the board) restoring sell-side *texture* without resurrecting Demand's penalty shape. **Rare sky events** — the cross-check's best impact-per-effort singleton: meteor showers, an aurora, a comet week (seeded, ~2–3/season, announced by NPC line the evening before), each a small gatherable or buff morning. Week 40 finally holds a morning week 4 never had. |
| **v5.9 "The Writ"** | **The weekly writ** — the missing middle rung of the goal ladder (dailies exist; the next rung up is the once-per-28-days festival). One rotating Guild bundle on the pledge pattern (5th prefix), sized to ~4–7 relaxed days, cross-skill by construction, scaled by the `requestWeight` idiom. **The framing decision, made deliberately: the writ rotates when *completed*, never on a timer.** No expiry, no streak, no shame — the living-world lens's anti-nagging objection is honored by construction (bible §8.4). Pays gold plus writ marks toward cosmetics/records. **Chest-awareness (v4.33's `matList`) and the v4.32 HOWTO figures are part of this release's definition of done** — every new bundle surface inherits both or the old bug classes return. |

## 5. Constraints carried into every V5 build

1. **The cozy contract, per feature:** trials are bank-and-release with auto-pass grandfathering
   (`V4_PLAN` locked it; the v5.0 harness enforces it). The heart retier never un-sees a scene.
   Tonics are buffs, never requirements. Merchant stock is never a withheld necessity. Records and
   writs only ever accumulate.
2. **The baseline is the balanced game** — the Resolve-food invariant goes into GBP as a named rule
   the day v5.2 ships. Same sentence, both directions: no encounter tuned assuming food, no
   economy number tuned assuming the merchant.
3. **Every new sellable gets a GBP pass at spec time.** `demandMult` is 1; there is no systemic
   brake. Gems, tonics, writ rewards, merchant stock — each release's build plan carries its
   faucet arithmetic before code is written.
4. **The tier ladder does not move.** 1/10/20/30/45/70/85 is load-bearing across six systems.
   Everything in V5 interleaves *between* rungs.
5. **No asset files.** Every new sprite named here (gem rocks, spouse props, furniture, the ferry)
   is canvas-procedural through the existing `03-art.js` pipelines.
6. **Docs in lockstep** — changelog reasoning per release as ever; v4.32's measured HOWTO figures
   re-verified whenever an economy number moves.

## 6. Owner decision points — ★ ALL RESOLVED 2026-07-28/29

Every one of these is now locked. Build against the **Decision** line, not the discussion.

1. **Trials at 50 only, or 50+75?** → ★ **DECIDED: both, live from the start.** Not "75 ships dark" —
   the owner took the full ladder. 12 trial scenes per save, one engine, 75's asks drawn from deeper
   content. *Rationale for the record:* shipping 75 dark would have left L75 as one more empty rung
   in the exact band V5 exists to fill, and the linter would have gone on reporting it.
   **Built in v5.1.**
2. **The writ's reward channel** → ★ **DECIDED: gold + writ marks toward cosmetics** (the
   recommendation). Carries a dependency to hold in view: marks are worthless until a catalog exists,
   so **v5.7's interior list must land before v5.9's writ**, which the release order already does.
3. **Merchant cadence** → ★ **DECIDED: ~2 days/week, seeded** like `todaysRequest` (the
   recommendation) — seeded reads as life, a fixed day reads as a schedule to plan around. (The
   `MONETIZATION.md` brand slot stays a separate, later decision; the stall ships system-first.)
4. **Heart cap 10 vs. 8** → ★ **DECIDED: 10.** The one-way door, taken deliberately: it leaves room
   for V6's married and newcomer arcs, and the cap may not rise twice. **This binds v5.5 as well as
   v5.6** — married scenes are written into the 10-tier ladder, not retrofitted onto it later.
5. **Save export UI placement** → ★ **RESOLVED by shipping:** v5.0 put it on the title screen *and*
   in Settings, as recommended.

### Decisions this leaves open

None for V5. `V6_PLAN.md` §4 still holds five — the child (yes/no), the newcomer's identity, Long
Round scoring, how deep "below the bottom" goes, and audio scope — and they are deliberately not due
until V5 has produced playtest signal. The child is the only tonal commitment among them and should
be made explicitly by the owner rather than inherited from a roadmap.

## 7. What V5 explicitly leaves for V6

The deep program (venues below 45, the Long Round, weekly seeds, the depth record), the perfection
ledger and all records telemetry, the L92 transformative tail unlocks, automation and the Loom,
avatar identity, the audio pass, year-aware festivals and the second festival per season, newcomers
and the child, and the replay touch. See `V6_PLAN.md` — V5 builds the floors V6 stands on: the
trials plumbing carries V6's tail unlocks, the cottage overlay carries the Loom's outputs, the
records the writ pays into become the ledger V6 formalizes.
