# Version 6 — The Valley, Whole (the plan)

> **Status:** roadmap, not built. ★ **All five §4 owner decisions RESOLVED 2026-07-29** — the child is
> in, the Long Round pays a walk-out bonus (never a fall penalty), the deep is endless and procedural,
> the audio is the full seasonal identity, and the "one newcomer" question was superseded by a
> village-population program that **re-cut the release train** (§2, §4.1). Still **deliberately one
> notch less locked than `V5_PLAN.md`.**
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

> ★ **RE-CUT 2026-07-29** on the owner's direction (§4.1). The original order put the deep flagship
> first and people fifth of seven. The owner's stated experience of the game is *"the village still
> feels empty and it doesn't feel like there is enough stuff to do"* — said after ten V5 releases
> that added a great deal of depth. **People move to the front.** The original rationale is kept
> below the table for the record.

**Order rationale (revised).** The village program leads, because it is the thing the owner is
actually missing and because it is *breadth* — new faces and doors that open, which is what reads as
"more to do" when depth already exists. The deep flagship follows immediately (it is still the
headline feature, and still pays `V4_PLAN`'s oldest debt). Telemetry lands third — cheap, retroactive,
and it re-lights the blanked goal card. Then the calendar, then ease, then ceremony last, because a
100% ceremony can only be written once everything it counts exists.

| Release | Contents |
|---|---|
| **v6.0 "The Wrens and the Harrows"** | ★ **The two latched doors open.** Both south-lane houses have carried family names on their signs since v3 behind a comment promising "a later chapter" — this is that chapter. **Two households, four new people**, each meeting the full bar the existing cast meets (schedule, gift tastes, recognitions, festival presence, a heart ladder to 10, heart events of their own): the **Wrens**, and the **Harrows**. Interiors on the `genRoom` pattern; NPCs on `NPCDEF` + `spawnMapNpcs`; hearts on the v5.6 ten-tier ladder. **The cast goes 7 → 11 and the village stops being a set.** |
| **v6.1 "Neighbours"** | ★ **They have lives, not just presence.** The co-location pass the original plan buried in v6.5 — Tom delivers Nell's milk on Tuesdays, visibly; Pip fishes beside Bram some mornings; the new households have standing business with the old cast. Plus **the returned warden** (the original §4.2 recommendation, kept — it pays `V4_PLAN`'s dangling thread and attaches a person to the deep) as a **third romance candidate**, and **a newcomer arriving is itself an event**: the valley's repopulation becomes visible rather than asserted. |
| **v6.2 "Below the Bottom"** | The deep flagship, unchanged in content, moved back two slots. The **Gloam Grove ring** (Woodcutting ~55) and the **Sunken Workings** (Mining ~55); **the Long Round** — an opt-in descent below floor 45, ★ **endless and procedurally generated**, composition and count scaling while stats stay honest (owner decision §4.4). ★ **Scoring: a depth record PLUS a banked bonus for walking out** (owner decision §4.3) — and the contract line is absolute and unchanged: **bonus-on-exit only, never loss-on-knockout.** A knockout costs nothing carried and nothing found; walking out multiplies what you gained. Plus the weekly seed ("the wing dreams"). |
| **v6.3 "The Ledger of the Valley"** | The perfection meter ("The Valley, Whole"), the records book, the Harvest Fair judging your own record book, post-99 cape ranks. All derived from state that already exists, all retroactive, zero migration — and it permanently fixes `standingGoalsHtml` blanking at the top. |
| **v6.4 "The High Craft"** | One transformative unlock per skill at ~L92 — the greenhouse, the heartwood coppice, the assay bench, Bram's deep-sea charter (+ the third late legend), the feast table, the tenth warden's round. The 45.4% tail, at last. |
| **v6.5 "The Turning Year"** | A second festival per season, each *playable* rather than watched; year-aware recurrence keyed to story flags, married state, records set and year count. ★ **Plus the full seasonal audio identity** (owner decision §4.5) — seasonal music variants, festival themes, ambient wind/surf/rain beds. Moved here from the closing release because the second festivals are exactly what the new music has to carry. **★ The listening pass is in the definition of done and is not optional.** |
| **v6.6 "The Irrigation Ledger"** | Earned automation as visible purchasable dreams, capped so attended play always out-earns it; the Loom and the fibre chain (feeding v5.7's interior catalog its second wave); Wine and Jam into gift/order/writ tables. |
| **v6.7 "The Hundredth Light"** | ★ **The child** (owner decision §4.1) — gives, never demands, no meters, no neglect, a presence that only ever adds. Placed last on purpose: a child belongs in a house that is already furnished (v5.7), in a marriage that already has an arc (v5.5), in a village that is already full (v6.0–6.1). Plus the 100% ceremony, the founding star relit, the records of past valleys, and the polish bundle. |

<details><summary>Original order and rationale, for the record</summary>

> Order rationale: the deep flagship first (it is the headline, it double-counts against `V4_PLAN`'s
> oldest debt, and its venues host later tail unlocks); telemetry second (cheap, retroactive,
> re-lights the blanked goal card early in the version); then the calendar; then ease; people and
> ceremony close the version because they read best when everything else is alive.
>
> Original train: v6.0 Below the Bottom · v6.1 The Ledger of the Valley · v6.2 The High Craft ·
> v6.3 The Turning Year · v6.4 The Irrigation Ledger · v6.5 New Faces · v6.6 The Hundredth Light.

</details>

<details><summary>The original release table (superseded — kept because its content specs still stand)</summary>

| Release | Contents |
|---|---|
| **v6.0 "Below the Bottom"** | **The two designed venues, built at last:** the **Gloam Grove ring** opens off the grove at Woodcutting ~55 (gloam-touched trees worth more XP with Warding creatures among them — the WC×Warding fusion), the **Sunken Workings** off the deepest lift stop at Mining ~55 (flooded galleries, richer veins, deep hazards — Mining×Warding). Both on the per-day `mapCache` generation pattern (`genUndercroft`'s precedent). **The Long Round:** an opt-in descent *below floor 45* through these venues — no bells, time flows (the mine's Deep Run switch already exists), a rising **depth record** as the goal. ★ **The contract line, first line of the spec, non-negotiable:** a knockout on a Long Round costs *nothing carried and nothing found* — `V4_PLAN` §1's knockout spec ("you wake with everything you carried **and found**") binds here absolutely; the only legal stakes are the un-set record and foregone *further* gain. Any "banked on exit" reading that forfeits found items on knockout is item loss and invalid. **The weekly seed:** "the wing dreams" — one rule twist + one reward tilt per week (`makeRng` off the week number; one modifier per shipped creature gimmick, pure data) posted on the Ledger. The game's first content that changes without a release. |
| **v6.1 "The Ledger of the Valley"** | **The perfection meter** — "The Valley, Whole": a read-only Journal section listing ~12 named axes with the Collection's found/total presentation, one percentage on top. Every axis is *already stored state* (`state.discovered`, QP, hearts ×7, wings + `tenthWingLit`, waystones/liftStops/bells, patron works, capes/crown, mastery tiers, legends, almanac pages, monuments, floor reached) — derived, retroactive, zero migration, exactly the QP precedent. The standing-goals card gains a permanent final row ("❦ The valley, N% whole") **so the long-sight card never blanks again.** **The records book** — an Almanac page surfacing `state.stats` plus new per-save records (best day's earnings, biggest catch per species, deepest descent — records only ever rise). **The Harvest Fair judges your record book** — this year's entry against your own best, giving the static script yearly variance for free. **Post-99 ranks** — the cape remembers: read the XP `addXP` already banks past 99 into a small rank trim on the cape (procedural palette shift), the cheapest possible "the grind still counts" signal. |
| **v6.2 "The High Craft"** | **The tail pays: one transformative unlock per skill at ~L92** — the felt midpoint of the 45.4% band, each a noun+verb plugging into an existing engine, never a percentage: Farming — **the greenhouse** (a Rowan build; any-season beds, capped small); Woodcutting — **the heartwood coppice** (a personal grove row that regrows); Mining — **the assay bench** (choose the next floor's featured vein); Fishing — **Bram's deep-sea charter** (a boat-trip water with its own 3–4 fish — and the third late legend at ~90); Cooking — **the feast table** (cook one dish at festival scale, feeding v6.5's ceremonies); Warding — **the tenth warden's round** (a weekly elite floor variant, feeding v6.0's seed system). Two or three can pull forward into late V5 if that train runs fast; the trials plumbing (v5.1) delivers all six. |
| **v6.3 "The Turning Year"** | **A second festival per season** — four new dated days on the proven `FESTIVALS` template, each *playable* rather than watched: a real 10-minute verb (a fishing derby judged against your record book — never a losable contest; a gleaning night on the ridge; a planting day; a lantern walk). **Year-aware recurrence** — festival scenes gain variant pools keyed to story flags, married state, records set and year count (the anniversary already proved the template); NPC letters reference last year. **The calendar remembers what year it is.** |
| **v6.4 "The Irrigation Ledger"** | **Earned automation, decoration-first ordering honored.** An automation ladder as *visible purchasable dreams*, earned by high Farming + built by Rowan, never bought outright: irrigation channels (adjacent-tile watering), the well pump (a watered radius), at the top a modest sprinkler network — **capped so attended play always out-earns it** (the machine rule generalized: automation compresses chores, it never replaces play). **The Loom** — the fibre chain at last: Wool/Prize Fleece + Gloam Thread → cloth → the cottage catalog's soft goods (curtains, rugs, the wall-hanging that displays a cape) — barn output finally processes, and V5's interior catalog gets its second wave. **Wine/Jam enter gift/order/writ tables** — the artisan dead-end closed with data, not systems. |
| **v6.5 "New Faces"** | **One newcomer with a full arc** (the valley's repopulation made real — a returned warden fits `V4_PLAN`'s dangling thread), full heart ladder, schedule, recognitions, festival presence — and **a third romance candidate** if the owner wants the replay hook. **The child, if the owner says yes** (★ decision point below): giving-never-demanding, no care meters, no neglect states — a child that *adds* scenes and never subtracts anything. **NPC pairs** — the co-location pass: Tom delivers Nell's milk on Tuesdays, visibly; Pip fishes beside Bram some mornings. The twenty-year marriage the dialogue describes finally happens on screen. |
| **v6.6 "The Hundredth Light"** | **The 100% ceremony** — when the Valley, Whole meter fills: a bespoke valley-scale ceremony on the anniversary template, a permanent visible change (the founding star relit over the ridge — cosmetic, per the cape precedent), and **"the records of past valleys"** — a title-screen memorial page listing finished saves' headline numbers, the game's first acknowledgment that long-lasting play sometimes means playing again. **The audio identity pass** rides here or earlier as capacity allows: seasonal music variants, a festival theme, wind/surf/rain ambient beds — with a *listening* pass explicitly in the definition of done (the scorecard item deferred seven audits running because testing runs muted). **The polish bundle:** machine ready-state cues, the rod-and-cast pose, chimney smoke — the "farm that shows its state" set. |

</details>

## 3. Constraints carried into every V6 build

1. **The Long Round's knockout rule is the version's load-bearing sentence** (§2, v6.0) — it is the
   single riskiest proposal in either version and it was flagged by the cross-check as the one
   place a careless spec breaks the contract. Foregone further gain and an unset record are the
   only stakes that exist.
2. **Automation never beats attended play** — write the cap arithmetic into GBP when v6.4 ships,
   as v5.2 did for Resolve food.
3. **Records only rise; contests are never losable** — derby "competition" is your own record book
   plus NPC flavor rivals; no withheld reward exists anywhere in the version.
4. **The child can never be neglected** (★ now BUILT, per §4.1) — no meters, no states that read as
   your failure. It gives; it never demands.
5. ★ **A new NPC either meets the full bar or is not a character.** The owner's word was
   *"functional"*: schedule, gift tastes, recognitions, festival presence, a heart ladder to 10, and
   heart events of their own. Someone who merely stands somewhere satisfies the request on paper and
   fails it in play — and would make the village feel *more* like a set, not less.
6. ★ **V6 weights toward BREADTH.** The owner reported "not enough to do" *after* ten releases that
   added a great deal to do. Depth on systems a player already uses does not register; new doors,
   new faces and new small reasons to walk into the village do. When a release could go either way,
   it goes wide.
5. **Retroactivity is the default** — the meter, records, post-99 ranks, the terminal fight, year
   variants: every one lands fully on a save that "finished" years ago, the QP precedent
   throughout. Zero features in V6 require starting over.
6. **The tier ladder still does not move; no asset files, still** — the L92 unlocks are venues,
   builds and verbs, not new tiers; every new sprite and sound remains procedural.

## 4. Owner decision points — ★ ALL RESOLVED 2026-07-29

Taken at full scope. Three override this plan's own recommendation; that is the owner's call and is
recorded, not re-argued. Build against the **Decision** line. (`DEVLOG.md`, same date.)

1. **The child** → ★ **YES, build it.** On the contract-clean sketch: gives and never demands, no
   care meters, no neglect states, nothing that can read as your failure.
2. **The newcomer's identity** → ★ **SUPERSEDED BY A LARGER ASK.** The question was "one newcomer:
   returned warden or new face?" The answer was *a lot more characters*, because **the village feels
   empty and there isn't enough to do**. This stopped being a casting decision and became a program —
   see §4.1 and the re-cut train in §2.
3. **Long Round scoring** → ★ **Record PLUS a banked bonus for walking out.** (This plan recommended
   record-only; overridden.) **The constraint is unchanged and absolute: bonus-on-exit ONLY, never
   loss-on-knockout.** Walking out multiplies what you gained; falling costs nothing carried and
   nothing found. §3's load-bearing sentence binds exactly as written. If the distinction ever blurs
   in play, it reverts to record-only — that fallback stays on the table permanently.
4. **How deep** → ★ **ENDLESS, procedurally generated.** Composition and count scale; stats stay
   honest (no HP inflation). No fixed floor, because a fixed floor just moves "the wing ends here"
   down 45 rungs — the exact defect v5.4 shipped to fix.
5. **Audio scope** → ★ **The FULL seasonal identity.** Seasonal music variants, festival themes, and
   ambient wind/surf/rain beds. The listening pass in the definition of done was already
   non-negotiable and stays so — this has been deferred seven audits running because testing runs
   muted, which is exactly how you ship audio nobody has heard.

### 4.1 ★ The village program — the direction that re-shaped this plan

**The owner's words:** *"I actually want a lot more characters on the horizon because right now the
village still feels empty and it doesn't feel like there is enough stuff to do, like there are two
empty houses and stuff. So it would be good to have to fill it in with the story and make them
functional characters that have their own lives and their own scenes."*

**The complaint is verifiable in the source, and it is worse than remembered.** `genVillage`
(`13-content.js`) raises **two houses on the south lane with family names on their signs** — *"The
Wrens'"* and *"The Harrows'"* — with latched doors and this comment:

> `// --- ambient neighbours on the south lane (doors are latched; they open in a later chapter) ---`

**The game has named two families in the village square since v3 and promised "a later chapter" that
never came.** Same defect class v5.5 fixed for the spouse — a promise the game makes out loud and
does not keep — except this one is read every single day, on the way to the store.

Three separable asks, and collapsing them would fail the direction:

- **Population.** More people, not one person. Seven NPCs for a valley whose entire story is
  *repopulation* is a thematic contradiction the content has never resolved.
- **Function.** *"Functional characters that have their own lives and their own scenes."* The bar is
  the one the existing cast already meets: schedule, heart ladder to 10, gift tastes, recognitions,
  festival presence, heart events. **A new NPC who merely stands somewhere fails this ask while
  technically satisfying it.**
- **Breadth, not depth.** *"It doesn't feel like there is enough stuff to do"* — said **after** ten
  V5 releases that added a great deal to do. That is the finding, not a contradiction of it. V5 was
  almost entirely *depth* (ladders, trials, the deep, the home). Depth added to systems a player
  already engages with does not register as "more to do"; **new surfaces do.** V6 must weight toward
  new doors, new faces and new small reasons to walk into the village.

**Consequence for the train:** v6.5 "New Faces" was one newcomer plus an optional child, fifth of
seven, behind the deep flagship. On the owner's stated priority that ordering is wrong. The village
program is promoted to the front and expanded; §2 is re-cut below.

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
