# Version 6 — The Valley, Whole (the plan)

> **Status:** roadmap, not built — and **deliberately one notch less locked than `V5_PLAN.md`.**
> V6 is the second of the two versions the owner asked for (direction 2026-07-28, `DEVLOG.md`).
> Everything here is designed against the game as it will stand *after* V5; re-verify every anchor
> and re-ground the priorities against real V5 playtest signal before building v6.0. The analysis
> behind both documents is the same eight-lens review + cross-check described in `V5_PLAN.md`'s
> header; V6 takes the clusters that serve the *finished* save.

---

## 0. What V6 is

**Banner: *The Valley, Whole* — the elder game. For the save that finished everything V5 deepened:
the ladder's top opens onto something uncapped, completion becomes one number that means
everything, the year itself starts remembering, and the solved chores compress so the long tail is
graceful.**

V5 repairs the middle of the game. V6 answers the question the endgame lens proved the game
currently cannot: *what does the player who has done everything do tomorrow — and why is year 2
different from year 1?* Four programs:

1. **Below the Bottom** — the deep flagship: the two designed venues, an opt-in uncapped descent,
   weekly-seeded variance, a depth record. The combat elder game.
2. **The Ledger of the Valley** — completion telemetry: the perfection meter, the records book,
   post-99 ranks. The collector/optimizer elder game.
3. **The Turning Year** — the calendar grows: second festivals, playable festival verbs, year-aware
   recurrence. The world's elder game.
4. **Ease and Voice** — earned automation, the Loom, the avatar, the audio identity, the polish
   bundle. The *comfort* elder game — legal only now, because V5 shipped decoration first
   (the bible's F2 ordering: expression before automation, or automation hollows the day).

## 1. The measured case (what V5 will not have fixed)

- **The goal ladder still terminates.** `standingGoalsHtml` returns `""` once skills, museum and
  `valleyMaster` complete — the long-sight card blanks precisely for the most devoted save. Above
  Valley Master (total 594) there is nothing. The patron sink runs forever but its *referent* dies
  at tier 10 (`PATRON_FIXTURES` has ten entries; ~954,000g exhausts them by day ~80–110).
- **The optimizer has no telemetry.** `state.stats` holds ~19 lifetime counters read by nothing but
  wing thresholds and one tip gate. No records surface anywhere: no best day, no biggest catch, no
  deepest descent. The Harvest Fair judges a static threshold (`bestCropSold ≥ 800`) an endgame
  farmer auto-wins identically every year.
- **`addXP` already banks post-99 XP silently** — an invisible surplus sitting in every long save,
  waiting to be read. (Verified: the cap clamps the *level*, not the accrual.)
- **The Undercroft ends.** `WARD_FLOOR_MAX = 45`, bells every 5 floors are permanent free
  checkpoints, creature stats never scale, the wing is timeless. Post-finale combat is one daily
  fetch. The two spatial-variety venues `V4_PLAN` promised — the Gloam Grove ring and the Sunken
  Workings — remain unbuilt, and they land exactly on Woodcutting's 52→64 and Mining's 50→70 voids.
- **45.4% of every 1–99 climb sits above L85**, and after V5 the gathering skills still have no
  content there (V5 fills the *middle*; the tail is V6's).
- **Year 2 contains no moment year 1 didn't.** Twelve fixed dated days per 112-day year; festival
  scenes verbatim-identical every year except the anniversary; zero rare events of any kind.
- **The watering verb never compresses.** No automation exists; the bible's own chore test demands
  removal-of-friction be "a visible purchasable dream," and nothing advertises one.
- **Wool/Prize Fleece are near-orphans** (two consumers / zero), the fibre chain has no processing
  step, and Wine/Jam appear in zero gift lists, orders, or bundles — the artisan chain dead-ends.

## 2. The release train

Order rationale: the deep flagship first (it is the headline, it double-counts against `V4_PLAN`'s
oldest debt, and its venues host later tail unlocks); telemetry second (cheap, retroactive,
re-lights the blanked goal card early in the version); then the calendar; then ease; people and
ceremony close the version because they read best when everything else is alive.

| Release | Contents |
|---|---|
| **v6.0 "Below the Bottom"** | **The two designed venues, built at last:** the **Gloam Grove ring** opens off the grove at Woodcutting ~55 (gloam-touched trees worth more XP with Warding creatures among them — the WC×Warding fusion), the **Sunken Workings** off the deepest lift stop at Mining ~55 (flooded galleries, richer veins, deep hazards — Mining×Warding). Both on the per-day `mapCache` generation pattern (`genUndercroft`'s precedent). **The Long Round:** an opt-in descent *below floor 45* through these venues — no bells, time flows (the mine's Deep Run switch already exists), a rising **depth record** as the goal. ★ **The contract line, first line of the spec, non-negotiable:** a knockout on a Long Round costs *nothing carried and nothing found* — `V4_PLAN` §1's knockout spec ("you wake with everything you carried **and found**") binds here absolutely; the only legal stakes are the un-set record and foregone *further* gain. Any "banked on exit" reading that forfeits found items on knockout is item loss and invalid. **The weekly seed:** "the wing dreams" — one rule twist + one reward tilt per week (`makeRng` off the week number; one modifier per shipped creature gimmick, pure data) posted on the Ledger. The game's first content that changes without a release. |
| **v6.1 "The Ledger of the Valley"** | **The perfection meter** — "The Valley, Whole": a read-only Journal section listing ~12 named axes with the Collection's found/total presentation, one percentage on top. Every axis is *already stored state* (`state.discovered`, QP, hearts ×7, wings + `tenthWingLit`, waystones/liftStops/bells, patron works, capes/crown, mastery tiers, legends, almanac pages, monuments, floor reached) — derived, retroactive, zero migration, exactly the QP precedent. The standing-goals card gains a permanent final row ("❦ The valley, N% whole") **so the long-sight card never blanks again.** **The records book** — an Almanac page surfacing `state.stats` plus new per-save records (best day's earnings, biggest catch per species, deepest descent — records only ever rise). **The Harvest Fair judges your record book** — this year's entry against your own best, giving the static script yearly variance for free. **Post-99 ranks** — the cape remembers: read the XP `addXP` already banks past 99 into a small rank trim on the cape (procedural palette shift), the cheapest possible "the grind still counts" signal. |
| **v6.2 "The High Craft"** | **The tail pays: one transformative unlock per skill at ~L92** — the felt midpoint of the 45.4% band, each a noun+verb plugging into an existing engine, never a percentage: Farming — **the greenhouse** (a Rowan build; any-season beds, capped small); Woodcutting — **the heartwood coppice** (a personal grove row that regrows); Mining — **the assay bench** (choose the next floor's featured vein); Fishing — **Bram's deep-sea charter** (a boat-trip water with its own 3–4 fish — and the third late legend at ~90); Cooking — **the feast table** (cook one dish at festival scale, feeding v6.5's ceremonies); Warding — **the tenth warden's round** (a weekly elite floor variant, feeding v6.0's seed system). Two or three can pull forward into late V5 if that train runs fast; the trials plumbing (v5.1) delivers all six. |
| **v6.3 "The Turning Year"** | **A second festival per season** — four new dated days on the proven `FESTIVALS` template, each *playable* rather than watched: a real 10-minute verb (a fishing derby judged against your record book — never a losable contest; a gleaning night on the ridge; a planting day; a lantern walk). **Year-aware recurrence** — festival scenes gain variant pools keyed to story flags, married state, records set and year count (the anniversary already proved the template); NPC letters reference last year. **The calendar remembers what year it is.** |
| **v6.4 "The Irrigation Ledger"** | **Earned automation, decoration-first ordering honored.** An automation ladder as *visible purchasable dreams*, earned by high Farming + built by Rowan, never bought outright: irrigation channels (adjacent-tile watering), the well pump (a watered radius), at the top a modest sprinkler network — **capped so attended play always out-earns it** (the machine rule generalized: automation compresses chores, it never replaces play). **The Loom** — the fibre chain at last: Wool/Prize Fleece + Gloam Thread → cloth → the cottage catalog's soft goods (curtains, rugs, the wall-hanging that displays a cape) — barn output finally processes, and V5's interior catalog gets its second wave. **Wine/Jam enter gift/order/writ tables** — the artisan dead-end closed with data, not systems. |
| **v6.5 "New Faces"** | **One newcomer with a full arc** (the valley's repopulation made real — a returned warden fits `V4_PLAN`'s dangling thread), full heart ladder, schedule, recognitions, festival presence — and **a third romance candidate** if the owner wants the replay hook. **The child, if the owner says yes** (★ decision point below): giving-never-demanding, no care meters, no neglect states — a child that *adds* scenes and never subtracts anything. **NPC pairs** — the co-location pass: Tom delivers Nell's milk on Tuesdays, visibly; Pip fishes beside Bram some mornings. The twenty-year marriage the dialogue describes finally happens on screen. |
| **v6.6 "The Hundredth Light"** | **The 100% ceremony** — when the Valley, Whole meter fills: a bespoke valley-scale ceremony on the anniversary template, a permanent visible change (the founding star relit over the ridge — cosmetic, per the cape precedent), and **"the records of past valleys"** — a title-screen memorial page listing finished saves' headline numbers, the game's first acknowledgment that long-lasting play sometimes means playing again. **The audio identity pass** rides here or earlier as capacity allows: seasonal music variants, a festival theme, wind/surf/rain ambient beds — with a *listening* pass explicitly in the definition of done (the scorecard item deferred seven audits running because testing runs muted). **The polish bundle:** machine ready-state cues, the rod-and-cast pose, chimney smoke — the "farm that shows its state" set. |

## 3. Constraints carried into every V6 build

1. **The Long Round's knockout rule is the version's load-bearing sentence** (§2, v6.0) — it is the
   single riskiest proposal in either version and it was flagged by the cross-check as the one
   place a careless spec breaks the contract. Foregone further gain and an unset record are the
   only stakes that exist.
2. **Automation never beats attended play** — write the cap arithmetic into GBP when v6.4 ships,
   as v5.2 did for Resolve food.
3. **Records only rise; contests are never losable** — derby "competition" is your own record book
   plus NPC flavor rivals; no withheld reward exists anywhere in the version.
4. **The child (if built) can never be neglected** — no meters, no states that read as your
   failure. It gives; it never demands.
5. **Retroactivity is the default** — the meter, records, post-99 ranks, the terminal fight, year
   variants: every one lands fully on a save that "finished" years ago, the QP precedent
   throughout. Zero features in V6 require starting over.
6. **The tier ladder still does not move; no asset files, still** — the L92 unlocks are venues,
   builds and verbs, not new tiers; every new sprite and sound remains procedural.

## 4. Owner decision points (before building v6.0)

1. **The child: yes or no.** The sketch is contract-clean, but it is a tonal commitment the owner
   should make explicitly, not inherit from a roadmap.
2. **The newcomer's identity** — the returned warden (recommended; pays `V4_PLAN`'s dangling
   thread) vs. a wholly new face; and whether they are the third romance candidate.
3. **Long Round scoring** — depth-record only (recommended: pure, unlosable) vs. a banked-bonus
   multiplier for walking out (legal *only* as bonus-on-exit, never loss-on-knockout — if this
   distinction ever feels blurry in playtest, ship record-only).
4. **How deep "below the bottom" goes** — endless with soft-scaling composition (recommended;
   composition and count scale, stats stay honest) vs. a fixed second wing (floors 46–90).
5. **Audio scope** — the full seasonal identity vs. festival themes + ambient beds only. The
   listening pass is non-negotiable either way; the scope is.

## 5. The sequencing truth between the two versions

V5's floors carry V6: the trials plumbing (v5.1) delivers the L92 unlocks; the cottage overlay
(v5.7) receives the Loom; the writ's marks (v5.9) become ledger entries; the merchant stall (v5.8)
is where `MONETIZATION.md`'s brand slot eventually lives, if the owner green-lights it — by then
the stall will have been ordinary valley furniture for a full version, which is exactly the right
order: the world first, the message later, and never the reverse.

And the four structural items v5.0 ships — save export, the migration harness, the perf fixture,
the honest docs — are what make every ambition in this file safe to build. If V6 ever has to be
cut to three releases, cut from the bottom of §2; if it has to be cut to one, ship v6.0 and v6.1:
an uncapped descent and one number that means everything are, between them, the elder game.
