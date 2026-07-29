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

## 2026-07-29 — v6.4.1 "Hands" (code 145, tag `v6.4.1`) — the Hammer had no job

A same-day correction to v6.4, and the correction matters more than the bug.

**What was wrong.** v6.4 gave Smithing a Hammer on the standard seven tiers, **counted those six rungs
as ladder marks**, and gave the tool nothing to do. `HOTBAR` (08-actions.js:7) is a fixed six-slot
array with the Stave pushed on at index 6; the Hammer was never added to it. So the release note
saying *"the hotbar goes to eight"* was **false** — key 8 dispatched to an index that does not exist,
and the tool could not be held at all.

That means six of the thirty-eight marks were furniture. Which is precisely the rule v6.4 itself wrote
down for the three crafts still to come: *a mark must be a real noun or verb the player gets, not a
stat bump.* Broken by the release that stated it, in the same commit.

**How it was found.** Not by reading — by pressing the key. `selectSlot(7)` left `slotSel` at 0 and
the belt printed `[Hoe, Can, Axe, Pick, Rod, Seeds]`. The plan's §4 item 8 had flagged "the hotbar
stops at key 7" and the fix I made was to widen the *key string*, which was the visible half of the
problem and not the real one. Widening a dispatch to reach a slot nobody creates is not a fix.

**The fix.** Not a hammer in your hand — you do not swing a smith's hammer at a valley. The tier means
something **at the anvil**: `FORGE_ENERGY_BY_TIER = [6, 5, 4, 3, 2, 1, 0]`, Basic through Star Metal.
A better hammer takes less out of you per working, one felt step per rung, down to nothing at all.
Purely a saving, never a gate — the rule the whole craft was built on. At the top the constraint stops
being your body and becomes your materials, which is the right shape for a late crafting skill. The
Basic cost stays at 6, so no existing save pays more than it did yesterday.

The forge panel now says what your hammer is doing and what the next one would do, so the six rungs
are visible rather than merely present.

**The key string is reverted to `"1234567"`** — the Hammer is not a belt tool, and pretending it was
one was the original error.

Re-graded after the fix: Smithing **38 marks · 0.0% dead · worst band 5 (80→85) · 5 marks above L85**.
Same numbers as claimed yesterday, but now every mark is behind something the player can feel.

---

## 2026-07-29 — v6.4.2 "Hands" (code 146, tag `v6.4.2`) — every bench in the valley was broken

**A one-letter crash, live for three releases.** v6.3's Maya's-bench code opened with
`if(o.story === "mayabench")`. The local in that switch is `obj`, not `o` — so `interact()` threw
`ReferenceError: o is not defined` on the FIRST line of `case "bench"`, before any branch. Not just
Maya's bench: **every bench in the game** — Starfall Ridge, Butterbrook's meadow, the village square,
Marrow Point, the Green. Pressing E on any of them did nothing at all and logged an error the player
would never see.

Shipped in v6.3.0 and live through v6.4.0 and v6.4.1.

**Why nothing caught it.** All three harnesses stayed green, and they were right to: `check-saves`
tests migrations, `check-schedules` tests NPC placement, `check-perf` tests generation cost. None of
them press a key. Node's `new Function(src)` syntax check passes happily — `o` is a perfectly legal
identifier, it just isn't bound at runtime. This is a *runtime reference in a rarely-hit branch*,
which is the exact shape that only exercising the path can find.

**How it was found.** By trying to test something else. I was verifying the Egg Fair's venue and the
bench's three dialogue states — a path I had written and shipped without ever pressing E on it — and
the browser threw. That is the second time today the same lesson landed: in v6.4 the Hammer's key
binding was "fixed" by widening a key string without checking that a slot existed to select. Both
bugs were invisible to reading and instant under exercise.

**What was verified after the fix**, in the running game rather than by inspection:
- Maya's bench returns all three of its states — stranger, 3♥, and 3♥-with-festivals-returned.
- An ordinary bench on the ridge gives its cozy sit toast again.
- The Egg Fair is on the Green with 8 nests and all 11 of the cast; the beach is empty that day.

---

## 2026-07-29 — v6.4.3 "Hands" (code 147, tag `v6.4.3`) — the harness that presses the key

Two bugs shipped today and both were invisible to every check this repo has: **every bench in the game
dead for three releases** (v6.4.2), and **the Hammer unholdable** while its six tier-rungs were counted
as ladder content (v6.4.1). The repo had three harnesses and **not one of them pressed a key.**

`tools/check-interactions.mjs` stands the player on an adjacent tile facing every object on every map
and calls the real `interact()`, then `examine()`. **1,934 presses, 20 maps, 84 object kinds.** It
catches the class node's `new Function(src)` lint structurally cannot: a legal identifier that simply
is not bound, in a branch nothing else exercises.

### ★ It was a no-op three times before it worked

This is the part worth keeping. Each time it printed a confident *"1,864 presses… all invariants
hold"* while a **known live crash** sat in the code it claimed to be exercising. Three causes, one
shape — every one of them a top-level `let` that cannot be reached from outside the script's scope:

1. `sandbox.curMap = m` creates an unrelated property; the real `curMap` (04-world.js:8) stayed null,
   so `interact()` returned at its first guard.
2. Fixed — still clean. That same first guard reads `gameMode`, also a top-level `let`, still
   `"title"`. `load-game.mjs` now exposes a general `set(name, value)` (an `eval` inside the scope)
   rather than one named accessor discovered per failure.
3. Fixed — still clean **for every map after the cottage**. Pressing E on the bed runs `doSleep`,
   which sets `paused = true`, and `paused` is the next term in that same guard. One press silently
   disarmed the remainder of the run.

**The lesson is not "remember the bed."** It is that a harness driving real game code must **re-arm
its preconditions on every iteration**, because the code under test is entitled to change global state
— that is its job. And: *a green harness proves nothing until you have watched it go red.* All three
rounds were caught only by reintroducing the bench bug and checking. The header says to do that
whenever the file is extended.

Verified against three separate faults: the real v6.3 bench bug, an invented typo in the forge case,
and a clean build. Red, red, green.

### What it stubs, and the line it won't cross

`interact()` reaches presentation — `showDialog`, `toast`, `playSfx`, `pSparkle`, `openPanel`. Those
are stubbed: they are the renderer and the speaker, not the game. Every branch the switch takes, every
`give`/`take`, every flag write and skill check is the shipped code, per AGENTS.md's rule that a
harness testing a copy tests nothing. `07-entities.js` is loaded rather than stubbed because it
declares `fishing`, which the first guard reads — that is game state, not presentation.

---

## 2026-07-29 — v6.4.4 "Hands" (code 148, tag `v6.4.4`) — "The undefined is set into the handle"

Every tool takes a keepsake gem at tier 3 — Hoe/Opal, Can/Topaz, Axe/Emerald, Pick/Ruby, Rod/Pearl,
Stave/Sapphire. **v6.4 added a seventh tool and did not add a seventh row.** `TIER3_GEM` had no
`Hammer`, and `08-actions.js:2282` reads it **unguarded**, so buying a Gold Hammer from Tom banners:

> 🔧 Gold Hammer! — *The undefined is set into the handle. Earned across every craft.*

Found by the v6.5 design review, not by any check. Reproduced in the running game before fixing.
The Hammer now takes the **Diamond** — the one gem not yet spoken for, and the only stone a smith
would rate. The banner line is guarded as well, so a future tool without a gem degrades quietly
instead of printing `undefined`.

### The real fix: assert the class

This is the **second** table-completeness bug from v6.4's seventh craft in one day. The first
(`SKILL_ICON`, whose absence draws `spr[undefined]`) was caught before release by luck. Both are the
same defect — *a table keyed by tool or by skill that a new key was not added to* — and neither is
visible to a syntax check or to any behavioural harness, because the read **succeeds** and yields
`undefined`.

`check-saves.mjs` now enumerates them, derived from `freshState`:

- **per skill:** `MASTERY` (4 rungs), `MASTERY_PRAISE` (4), `MASTERY_NPC`, `TRIALS` (2), `SKILL_ICON`
- **per tool:** `TOOL_ICON`, `TOOL_SKILL`, `TIER3_GEM`

**3,407 invariants**, up from 2,707. Verified with teeth: removing the Hammer's gem fails the run, and
adding a `Foraging` key to `freshState().skills` immediately names all five tables it still needs —
which makes it a build checklist for v6.5 rather than a post-mortem.

---

## [Unreleased]

### Tooling — the atlas now guards what a Guild wing lights ON, not just that it has prose

`build-atlas.mjs` publishes a hand-written sentence for each of the nine Guild wings ("Forage 10 wild
finds"). It asserted the wing *count* and that every wing id had a sentence — but never that the
sentence still described the condition. Change `foraging` from `forage>=10` to `>=25` and the atlas
would go on publishing "Forage 10 wild finds" forever. Flagged as `V6_WORLD_AND_CRAFTS.md` §4 item 12,
and about to matter: v6.5 makes Foraging a real craft, so that wing's condition is going to move.

Each wing's `lit()` closure is now serialized as source and compared against a recorded snapshot; a
changed condition fails the build and prints both versions plus the prose to re-read. **Verified by
changing a condition and watching it fire**, then reverting — a guard that has not been seen to fail
is decoration.

Chose a source snapshot over the cleverer "every number in the closure must appear in the prose",
which has false positives the moment a condition reads `(x||0)>=8` (the 0 is an idiom) or the prose
spells a number as a word ("at least one hen").

**Two template-literal traps found while writing it**, both now documented above the extraction block:
the data-extraction code is a JS template literal, so (a) a backtick inside a comment *ends* it, and
(b) `\s` resolves to a bare `s` — a `/\s+/g` written in there silently becomes `/s+/g` and strips
every letter *s* from what it cleans. `skillLvl` came out of it as `killLvl`. The extraction now does
no string processing at all; every regex and trim happens on the consuming side in module scope.

### Checked and NOT changed

Three items from `V6_WORLD_AND_CRAFTS.md` §4 were investigated and are **not live defects** — recorded
here so the next agent does not spend the time again:

- **§4.4 "the vault map has no gate on a save that already opened it."** Correct as written: the
  sealed door spawns only while `!foundVault` (13-content.js:364) and is deleted on opening
  (08-actions.js:1418). A mirror placement showing an *opened* vault would be worse, not better — the
  mine regenerates daily, so it would appear on a different floor every morning.
- **§4.10 `m.meta.worked` is never swept.** No such field exists anywhere in the codebase.
- **§4.10 `state.marks` is uncapped.** The real field is `state.writMarks`, a single integer.

---

## 2026-07-29 — v6.4.0 "Hands" (code 144, tag `v6.4.0`) — the seventh craft, and the trap it had to avoid

The owner's second direction: *"a lot more to do. maybe there aren't enough skills. afterall, there
should be 10 crafts."* The Guild hall has named nine crafts since v1 and the game has trained six.
This is the first of the four missing ones, and `V6_WORLD_AND_CRAFTS.md` §2 makes it the **template**
the other three must copy.

### ★ The hard problem, and why a smithing skill was never added before

Every tool tier in this game is gated on the tool's **own** craft (`TOOL_SKILL` × `TIER_LEVEL`): a
Star Metal Pick needs Mining 85, a Star Metal Rod needs Fishing 85. The obvious design for a smithing
skill — *the smith makes the tools* — moves all six of those gates onto Smithing. Then **six skills
wait on a seventh**, and a player standing at Fishing 85 is told their fishing is not the problem.

So **Smithing never gates a tool. It offers a second way to pay for one.** `forgeHeadFor(tool, tier)`
lets you strike the head yourself for **45% of Tom's gold**; the tool's own craft still decides
whether you may hold the tier, and Tom's shop is untouched. Verified in the running game: at Smithing
0 with Mining 30, Tom still sells a Gold Pick and the forge refuses it; at Smithing 30 the forge makes
it for 2,250g against Tom's 5,000g. The panel's own lock text is the proof — every row reads
`🔒 Farming 10`, `🔒 Woodcutting 10`, `🔒 Mining 10`. Never `🔒 Smithing`.

Purely additive, never blocking. That is the cozy contract — *nothing is ever taken from the player* —
applied to a production skill.

### The ladder, which is the actual deliverable

Graded by `auditUnlockCadence()` against the live tables:

| skill | marks | dead XP | worst gap | marks above L85 |
|---|---|---|---|---|
| **Smithing** | **38** | **0.0%** | **none** | **5** |
| Cooking | 34 | 34.6% | 90→99 | 2 |
| Farming | 29 | 41.2% | 90→99 | 2 |
| Fishing | 26 | 56.8% | 85→99 | 1 |
| Warding | 15 | 59.1% | 85→99 | 1 |
| Woodcutting | 17 | 59.6% | 85→99 | 1 |
| Mining | 16 | 60.9% | 85→99 | 1 |

No empty band longer than **5 levels**, anywhere on the climb. Three kinds of thing fill it: six
**bars** (smelt an ore, one step behind the Mining ladder so the forge is never the bottleneck),
twenty **goods**, and the **Hammer**'s seven tiers. Every good is an input to something the game
already wants — lantern frames for the Lantern Round writ, a brazier and a bell for the Guild's wings,
nails and hinges for the projects, a plough blade for the fields.

### Fenn

She has been in the valley the whole time and the game never said so. The anvil that rings outside
Tom's store when the smithing wing lights has been there since v3, and Tom has been selling tool
upgrades he plainly does not make. Her sign says so, in different paint and a steadier hand: *"Tom
sells them. I make them."*

Her smithy is **deliberately not an interior**. A working forge is open to the air because the heat
has to go somewhere, and roofing it would have put a door and a loading screen between the player and
a verb they will use hundreds of times. It stands on the home road, which is where you are when you
have ore on you.

Four heart scenes, none romantic — this release ships a *craft*, not a second relationship arc. Her
arc is the one thing a maker cannot make: a successor. It resolves the question her own 75 trial asks
out loud — she wants ten Guild brackets that outlast her, made by somebody who will still be here.

### Mastery, and why every effect is a saving

Hot Work (25) sometimes makes a forging free; Thrift (50) sometimes returns a **bar** — never a
finished good, which would double the whole ladder's output. True Temper (75) and Master of the Fire
(99) widen those. A smith who never levels loses nothing; a smith who does spends less. Same rule as
the tool heads, one layer down.

### Fixed / found during the build

**A TDZ, for the second time in this version line.** `ITEM_SELL` was given a `...FORGE_SELL` spread
at its own definition — which sits 400 lines *above* `FORGE`. `const` does not hoist its value, so
that is a straight crash on boot. (v5.0's `LADDER_AUDIT` was the same shape.) The rule now written
into `01-data.js`: **a table may only read a table defined above it — otherwise mutate afterwards.**

**A migration scare that turned out to be a coverage gap.** `migrateSave`'s generic backfill is
shallow (`s.skills` is never undefined, so the loop does not recurse), which looked like it meant a
new craft key would never land on an existing save. It lands anyway: two *older* generic loops
already cover exactly this (11-title.js ~294 for tools, ~303 for skills) — verified by disabling each
and re-running, not by reading. The first instinct was to add a third copy, and that was wrong.

What was genuinely missing was not a mechanism but an **assertion**. All 2,317 prior save invariants
passed with `skills.Smithing` absent from every era, because "no demoted level" walks the *save's own*
keys and an absent key is neither a demotion nor a NaN. `check-saves.mjs` now asserts, per era, that
every key in `freshState().skills` and `.tools` is present and finite — derived, so the three crafts
still to come are covered the day their keys land. **2,707 invariants**, up from 2,317.

**The hotbar stopped at seven** (`"1234567"`, flagged in the plan's §4). A Hammer at index 7 would
have been unreachable by keyboard. Eight now.

### Numbers

Total level **594 → 693** (derived; nothing hardcoded). 20 maps · 13 NPCs · 26 forgings · all 2,707
save invariants hold · all schedule invariants hold across 4,003 placements · all within perf budget.

### Still owed

Three crafts to go (Foraging, Ranching, Hearthcraft) and then the valley trains ten. **Both Foraging's
and Ranching's ladders are still unwritten** and the plan's §4 marks them BLOCKERS: the stated
skeletons score 88.5% dead, identical to a bare tool-tier ladder. They get written at this shape or
they do not ship. Hearthcraft is worse — its proposed ladder *games the linter* (0.0% on paper, 39.1%
as it would actually ship) and it has no tool, so it inherits none of the six free tier marks the
others get.

---

## 2026-07-29 — v6.3.0 "The Green" (code 143, tag `v6.3.0`) — the promise the player had already paid for

Second release of the bigger-world program, and the same method as v6.2: build what the game already
promised. This one was the sharpest debt in the sweep, because **the player could already buy it**.

### The two shipped promises this map exists to keep

1. **The writ.** `WRITS[5]` is called **The Festival Green**. Its ask is real, its pay is real, and its
   completion text reads *"Trestles, canopy, and a table long enough for everybody. Maya has already
   drawn it."* A player could gather Willow Lumber, Silverwood Beam, Starfruit Sorbet and Cherry Tart,
   hand them over, and receive **a sentence about a field that did not exist**. That is the worst kind
   of debt in the list — not an unbuilt place that was merely mentioned, but one the game **took
   payment for**.
2. **Maya's 3♥ line**, shipped in v1 and never resolved: *"I saved a bench for us at the old festival
   grounds. Maybe one day there'll be a festival again. I'd like that."*

Both land here. The writ visibly rebuilds the field; the bench is under the trees on the quiet side and
says three different things depending on whether she has told you about it and whether the festivals
came back.

### The field, in two states

Before the writ: a **leaning flagpole** (still with the halyard coiled properly on the cleat, the way
you do when you expect to be back), a **cold fire-ring**, and **four bald patches of earth** where the
trestles stood. The absence is drawn rather than described — a shape in the grass reads louder than a
ruin, because a ruin says "this ended" and a worn patch says "this stopped".

After it: four trestles, a **ten-tile long table**, three canopies over it, and the flag up. The
examine on the table is the joke the writ set up — *"a table long enough for everybody" turns out to
have been a measurement*, and there are more places set than there are people in the valley.

### A festival has a venue now

For six versions every festival was on the sand, so **"is there a festival today"** and **"is the coast
dressed today"** were the same question, and `beachEvent()` answered both. Splitting them was the
load-bearing change:

- `todaysFestival()` — the calendar
- `festivalVenue()` — which map
- `beachEvent()` / `greenEvent()` — which festival dresses *that* ground (beach code untouched)

Three call sites were asking `beachEvent()` while **meaning** "is anybody free today" — Elias's coast
walk, Pip's fishing mornings, and Bram's ferry stall. Left alone, each would have answered *yes* on
Harvest Fair day and put its NPC on the beach while they were also at the Green. Fixed at the call
site, where the intent is now stated in the code rather than implied by a coincidence.

**Venue assignment is argued, not assigned.** The Luau is Bram's pot on the sand and the Star-Watch
wants the sea horizon; both stay. The Harvest Fair judges crops on trestle tables — *precisely* what
the writ builds — and an egg hunt is better in long grass than on flat sand.

### The valley turns up

v6.0 added four people (Ada and Corin Wren, Sable and Wick Harrow) and v6.1 added Thea, and **not one
of them has attended a festival since**. On Harvest Fair day the valley gathered on the sand and Corin
and Wick strolled an empty plaza. That is the owner's *"the village still feels empty"* in its purest
form — not too few people, but people who don't turn up to the things the valley does together.
**Eleven at the festival now, not six.** Nell still keeps the dairy, which is deliberate and is her
whole character.

### Fixed during the build

**A hundred invisible walls.** The hedge was written `put(m, x, y, "tree")` — and `"tree"` is not a
kind this game has (`TREES` is keyed oak/pine/maple/willow/…). `objBlocks()` treats any unknown kind as
solid, so 104 objects were placed that **drew nothing and still blocked**. Nothing threw. All three
harnesses stayed green. It was obvious the instant the map was looked at. This is the counterexample to
"the tests passed": a harness asserts what you thought to assert, and a screenshot asserts what is
there.

**Maya double-booked on the first run.** Her sketching afternoons on the Green collided with the
village plaza — caught by `check-schedules.mjs` immediately, which is what it is for. The fix is a
table (`APPOINTMENTS`) rather than one more clause in `npcIsElsewhere`, so the next character with a
somewhere-else-to-be costs a row instead of a branch. That is the whole lesson of the double-booking
class this function was created to close.

**Bare earth, not paving.** The worn patches were first laid as `T.PATH`, which is *made* paving and
read as a road cutting through the field. `T.DIRT`, one tile each, and the ghost of the long table
worn in gaps rather than a continuous strip: a line of bare spots says "something stood here", a solid
run says "this goes somewhere".

### Numbers

20 maps · slowest map gen 0.989 ms (budget 3 ms) · all 2,277 save invariants across 10 eras hold ·
all schedule invariants hold across 364 snapshots, 3,667 placements.

---

## 2026-07-29 — v6.2.0 "The Promised Coast" (code 142, tag `v6.2.0`) — the first place the game had already promised

The owner's direction: *"i want to make the game world bigger. there are too few places. we want a lot
more."* This is the first release of that program, and it deliberately starts with a place the game had
**already told the player about** rather than with an invented one.

### Why Marrow Point first

The place sweep behind `V6_WORLD_AND_CRAFTS.md` counted **72 places the game names and 45 it names *and*
locates** — against 18 it lets you stand in. Marrow Point was the most over-promised of all of them:

- a milestone on the coast road carved `MARROW POINT — 39`, since v3.36;
- **two** signposts pointing north to it;
- a ferry sign that has read **"no service"** for eight months of releases;
- a resident of the valley (Elias) whose entire backstory is that he crewed that ferry for eleven years;
- and — the detail that decided it — **a lighthouse already blinking on the horizon** in the Starfall
  Ridge panorama since v3.43.

A place with a signposted distance, a working ferry service, a named resident who worked the route, and a
light you can see from another map is not a new area. It is a **debt**. Building it needed almost no new
fiction, which is exactly why it goes first: the cheapest possible proof that the world can grow.

### What it is

A headland that **narrows as you walk east**, sixteen rows of land where it joins the coast and six at the
tip, until there is nothing left but the light. Quay and warp at the west end; the ferry-master's hut; a
mooring post; wind-bent pines only on the landward end (nothing tall survives the tip); and forage that
grows nowhere else in the valley — **sea holly** and **samphire**, the plants that live on salt.

**The first crossing is Elias's.** Not the player's alone — he is standing at the mooring, and the scene
turns on one fact the game established three versions ago and has never used:

> "That's my crossing. Thirty-nine miles, four hours in a fair sea, six in a bad one. I made it eleven
> hundred and some times and I have never once made it in this direction."

That is the whole argument for building promised places before invented ones: the scene wrote itself out of
material already on the shelf.

**The boatyard** opens on the beach at four writs done — three keels on the sand, still open at the ribs.
It is scaffolding for the coast program's later layers, placed now so the beach starts changing early.

### One light, one clock

The panorama's lighthouse blinked on `Math.floor(animT*1.2)%2`. The tower, when first built, **did not
light at all** — it was a forty-foot sprite with a painted lamp, standing dark at nine at night on a map
named for it.

Fixing that as "add a light to `collectLights`" would have produced a second, unrelated blink. Two things
that both blink are not one lighthouse. So Marrow Point Light now has a **character** — `marrowFlash()`,
Fl(2) 6s: two quick flashes, then a long dark — and *every* place that draws it reads that one function.
The pixel on the ridge and the lamp at the tip are lit by the same clock. Real lights are identified by
their rhythm rather than their brightness; giving this one a rhythm is what makes it a specific lighthouse
instead of a lamp on a stick. Both callers keep a dim baseline, so between flashes the glass still shows —
from thirty-nine miles you would still see it.

### Fixed during the build

**The point tapered to nothing.** The first taper (`narrow = 3 + (x/w)*7`) closed the land completely past
x≈36 and left the lighthouse **standing in open sea**, with 233 walkable tiles on a 46×26 map. It was
caught by *counting tiles*, not by looking at the map — the camera never happened to be pointed at the tip.
Retapered to 16 rows landward / 6 at the tip: 491 walkable tiles, 471 of them reachable from the quay by
flood-fill, with the light, the hut and the mooring all connected. **The lesson is the method:** a
generated map should be asserted about (walkable count, reachability from the entrance) and not merely
screenshotted, because a screenshot only proves the part of the map that is on screen.

### Numbers

19 maps · `marrowpoint` generates in 0.659 ms (third slowest, budget 3 ms) · all 2,277 save invariants across
10 eras hold · all schedule invariants hold across 364 snapshots.

### Still owed

The Point (Bram's headland — his 10♥ scene goes there in dialogue today) is deferred to the next coast
release; it is a second, smaller promise on the same stretch of water and wants its own beat rather than
being bolted onto this one.

---

## 2026-07-29 — v6.1.5 "Room for Ten" (code 141, tag `v6.1.5`) — making room before there is anything to put in it

Prep for the owner's ten-crafts direction, measured rather than assumed.

**The linter now derives its own skill list.** `LADDER_SKILLS` was a hardcoded array of six — so the
moment a new craft shipped, the unlock-cadence linter would have reported six clean-ish ladders and
said **nothing at all about the new one**, which is exactly the ladder most likely to have holes. It
reads `freshState().skills` now, the same source `renderSkills` and `totalLevel` already use. Four
crafts are coming; the whole point of the linter is to grade them *as they are built*.

**The Skills panel was measured against ten crafts and failed.** Simulated by adding four skills at
runtime: three columns × four rows = **432px of content in a 314px body** — the tenth craft and the
entire detail strip fell below the fold. Now `wide`, with the grid's `minmax` at 7.6em, it lays out
**four across in three rows with everything visible.**

Two things that pleasingly needed *no* work, both because earlier releases derived rather than
hardcoded:

- **The total re-targets itself.** `99 × Object.keys(state.skills).length` has been the source of
  truth since v4.0, so the panel read **"126 / 990"** the instant four skills existed — no edit.
- **v5.1's mastery trials applied automatically.** The simulated crafts immediately showed
  *"Trial waiting"* and *"held at 50 — XP still banks"*, because the trial engine iterates `TRIALS`
  and the gate lives in `skillLvl`. A new craft gets the whole bank-and-release apparatus free.

*This is what the last twenty releases of "derive, don't hardcode" buys: the expensive part of adding
four skills turns out to be the content, not the plumbing.*
## 2026-07-29 — v6.1.4 "Nothing Lost" (code 140, tag `v6.1.4`) — three prerequisites, landed before the thing that needs them

Groundwork for v6.2, done separately and first so the release that depends on it lands on solid
ground rather than carrying its own foundations. All three came out of the adversarial review.

**`WARD_MAPS` — one set, not a string in two places.** `inCombatMap()` (15-warding.js) and
`updateTime()` (08-actions.js) each hard-coded `curMap.id === "undercroft"`. Between them those two
lines decide whether Resolve drains, whether tonics tick, whether food restores Resolve, and whether
the day clock runs. v6.2 adds two more combat venues, and **missing either call site would silently
disable the entire Resolve layer in the new places, or silently switch the sun back on underground —
with no error anywhere.** Declared in `01-data.js` rather than `15-warding.js` because `08-actions.js`
loads first and must see it.

**The bell ledger reads the cap.** `ledgerPledges` had `Math.min(45, …)` next to a `WARD_FLOOR_MAX`
of 45 — two numbers that agree only by coincidence and disagree the moment anything moves the cap.
It reads the constant now, lazily (`WARD_FLOOR_MAX` lives in a file that loads *after* `01-data.js`,
and this repo has already shipped one boot-killing `const` TDZ that way, in v5.1).

**`give()` can no longer subtract.** Every reward in the game funnels through that one function, whose
entire contract is that it gives. v6.2's walk-out reward measures a haul as a before/after difference,
and a delta that came out negative or `NaN` would have *subtracted* through it. One guard —
`if(!(n > 0)) return;` — closes the class permanently. Verified: `give(x, -5)`, `give(x, NaN)` and
`give(x, 0)` all leave the stack untouched.

*None of this changes anything a player can see, which is the point of doing it as its own release:
when v6.2 goes wrong, none of these will be why.*
## 2026-07-29 — v6.1.3 "Nothing Lost" (code 139, tag `v6.1.3`) — seven persists that were silently doing nothing

### How this was found

Not by testing v6.1.3. By running an **adversarial review of a design that hasn't been built yet** —
v6.2's Long Round — with three independent agents briefed to *refute* the claim that its knockout
contract holds. All three refuted it, and the mechanical lens's headline finding turned out not to be
about v6.2 at all. It was already in the shipped game.

### The bug

```js
function saveGame(){
  if(_wipe || !state) return;
  if(isCutscene()) return;   // don't persist mid-cutscene state
```

That guard is right in general — a half-played scene is not a save-worthy state. But `cutNext`
executes a `run` step **with `cutscene` still non-null** (`14-story.js:126`). So **every
`saveGame()` written inside a cutscene has been a no-op since the guard shipped.** There were seven,
all deliberate, all committing something that had just genuinely happened:

| Where | What it was supposed to commit |
|---|---|
| `wardKnockout` (15-warding.js) | **the haul you just carried up out of the Undercroft** |
| the tenth door opening | `tenthDoorOpen` + Elias's regard |
| the day-one arrival | `arrivalSeen` |
| the reunion scene | the scene's state |
| Thea's arrival (v6.1) | her initial regard |
| a mastery trial's scene (v5.1) | that the scene has been seen |
| the festival handoff | the festival's state |

**The knockout one is the one that matters.** Its entire job is to write the game down at the moment
the lantern-bearers set you at the door — and a knockout is the one moment in the game a player is
*most* likely to stop playing. Close the tab there and everything found in the wing went with it. In
a game whose first principle is *nothing is ever taken from the player*, that is the sharpest possible
hole, and it has been open since v4.0.

**Proven empirically rather than by reading**: a scripted cutscene with one `run` step that writes a
marker and calls `saveGame()` leaves `localStorage` untouched.

### The fix

`saveGame(force)`. `force` bypasses **only** the cutscene guard — the wipe latch and the half-run
festival/turn-in guards still hold, because those describe states that genuinely must not be written.
The seven deliberate call sites pass `true`; every other caller is unchanged, so the guard still does
its real job. Verified both directions: a plain `saveGame()` inside a cutscene is still correctly
refused, a forced one lands.

### What this says about the tooling

`tools/check-saves.mjs` has 2,277 invariants and could not have caught this, because it tests
`migrateSave` against fixtures — it never runs a cutscene. `check-schedules.mjs` sweeps NPCs.
`check-perf.mjs` times generators. **A dead call site is invisible to all of them**, and would have
stayed invisible indefinitely: the code reads correctly, the intent is documented in its own comment,
and the failure is silent by construction.

It took an adversarial reader briefed to *break* something, given the actual source. That is worth
remembering as its own technique, distinct from the harnesses: **the harnesses check that the rules
hold; only a skeptic checks that the code does what its comment says.**

## 2026-07-29 — v6.1.2 "Room to Stand" (code 138, tag `v6.1.2`) — the sweep becomes a file, and finds three more things

### Why

The v6.1 and v6.1.1 changelogs both claimed a sweep was "now the standard check for any schedule
change." That check was a snippet typed into a browser console and thrown away — which is exactly the
failure `GAME_BALANCE_PRINCIPLES.md` names from v5.0: **a rule nothing measures is a rule that quietly
stops being true.**

So it is a file now: **`tools/check-schedules.mjs`**, run alongside the others. It asserts three
things, all of which are structurally invisible in a diff:

1. **Nobody is ever in two places at the same moment** — swept across every NPC × every map × 13
   hours × 28 days (364 snapshots, ~3,650 placements).
2. **Every NPC appears somewhere in the week** — a character the player can never meet is the v4.6
   unreachable-event bug in schedule form.
3. **No two wander boxes collide their name tags**, measured by *simulating* 400 steps rather than by
   comparing rectangles: two boxes can overlap on paper and never put their occupants close, and two
   can barely touch and collide constantly.

### It found three things immediately, and one of them was invisible to every other harness

**★ `06-weather.js` was missing from the node loader — and its absence was silent.** It holds
`curHour`, `seasonOf`, `isRain/isStorm/isFog` and `beachEvent`. The schedule harness surfaced it
loudly (every NPC "never spawns", 0 placements), but the consequence reaches further:

> **`check-perf.mjs` had never actually measured the mine generator.** `genMine` reads `isStorm()`
> and `isFog()` for its ore and gem weather boost; with those undefined it threw, and the harness's
> per-map `try/catch` dutifully reported it as unavailable — below the visible fold of the top-six
> list. The mine now appears at **0.421 ms**, and the all-maps total moved 3.83 → 4.32 ms because a
> real map joined the measurement rather than because anything got slower. Baseline re-recorded.

**Tom's milk run was a double-booking, and the obvious fix was the wrong one.** The store branch has
no hours — Tom is behind that counter 24/7, deliberately, so the shop always works — so sending him
to the dairy put him in two places. Closing the shop three evenings a week to fix it would have
traded a real convenience the player has always had for a flavour beat. **So Nell comes to him
instead:** same beat, her genuinely free evening hours, nothing closed. Arguably better — she visits
*him*, which inverts the assumption the scene was built on.

**v6.1.1's plaza fix was incomplete.** It tiled the four boxes edge to edge, which still lets
occupants meet along a shared border; the harness measured 18px where a single hand-run had reported
34px. There are now two clear tiles between every pair (the corridors at x20–21 and y14–15).

*The general shape of all three: a single measurement taken once by hand is an anecdote. The same
measurement taken 400 times at three hours across 18 maps is a fact.*

## 2026-07-29 — v6.1.1 "Room to Stand" (code 137, tag `v6.1.1`) — v6.1's own crowding, fixed

A regression from adding people, caught by looking rather than by a test.

`spawnMapNpcs` gave **Maya, Pip and Wick the identical wander box** (x15–25, y11–17). Fine for the two
who have shared it since v3; crowded for three. A 400-step simulation of the plaza closed the minimum
pairwise distance to **~15px — about one tile** — and the floating name tags are wider than a tile, so
three names sat on top of one another.

The plaza is **tiled** between its four people now rather than shared: Maya northwest, Pip northeast,
Wick southwest, Corin southeast by the stonework he is actually working on. Same square, same hours,
same wandering. Minimum separation after: **34px, over two tiles.** Tags clear.

*The general lesson, worth carrying into v6.5's newcomers: a wander box that comfortably holds N people
does not hold N+1. Every new NPC placed in an existing box needs the box re-cut, and the check is a
few hundred simulated steps and a minimum-distance print — the same shape as the where-is-everyone
sweep that found v6.1's double-bookings.*
## 2026-07-29 — v6.1.0 "Neighbours" (code 136, tag `v6.1.0`) — the boat comes in, and the valley starts visiting itself

### Added — Thea, and the mooring that was waiting for her

`V4_PLAN.md` left a thread hanging: **Orla's order had more than one warden, and the game never said
what happened to the rest.** Thea is the rest. Four were sent north the summer before the wing closed;
the letters stopped; she saw the tenth window lit from the water on the northern run and got off the
boat.

**★ Her arrival is staged at the ferry landing, and nothing new had to be built for it.** The coast
road has carried a mooring since v3.36 whose examine line reads:

> *"Nothing has tied up here in years. Somebody keeps the boards good anyway."*

Three versions of a dock kept ready for a boat that never comes — **and now the boat comes.** The beat
was already sitting in the geography waiting to be used, which is the best kind of content there is.
Her 10♥ scene closes it: she asked around, and it was Elias who planed those boards every spring for
eleven years, alone, for a boat he had no reason to expect.

The answer to "what happened to the other three" is deliberately **not** a tragedy: Rin married a man
in a port town, Ovan went into timber and is extremely happy, Sella died at seventy-one of being
seventy-one. *"The order didn't fall. It just stopped being what any of us did on a Tuesday. That's
how a craft dies — not a tragedy, an attendance problem."*

### The third romance candidate, and the bar she had to clear

Being romanceable means clearing **every married surface v5.5 and v5.6 built** — a candidate you can
marry and who then has nothing to say is precisely the broken promise v5.5 shipped to repair, and a
third candidate could have re-opened it in one line. So Thea has: a heart ladder to ten, her own
proposal scene (staged on the boards she arrived on — *"you've picked the spot on purpose, you
absolute article"*), morning/day/evening married dialogue pools, the post-wedding arc on `daysMarried`,
and spouse props in `genCottage`.

★ **That rule is now a harness invariant, not a habit.** `tools/check-saves.mjs` asserts, for every
NPC in the game: a birthday, gift tastes, and heart events — and for every romance candidate
additionally a marriage scene, a married arc, married dialogue pools, and a ladder that reaches the
heart cap. **2,277 invariants**, up from 1,697.

### Added — the co-location pass

The valley's people have never been in the same frame as each other. Four fixes, all schedule data:

- **Tom's milk run** — twice a week, and ★ it had to be an *evening* run. Tom is the shopkeeper and
  "never two places" is load-bearing: a store with nobody in it is a store you cannot use. So he
  walks the milk down after the shop shuts, for the twenty-year marriage the dialogue has been
  describing since v3.44 and never once shown.
- **Pip fishes beside Bram** some mornings — which Pip has wanted since v1.0 — and is correspondingly
  *not* on the plaza those mornings.
- **Sable brings Elias a tea he doesn't need** and sits with him at the pond. Their two 8♥ scenes are
  about the same eleven years; putting them in one frame says it without either having to.
- **Corin works the Guild's stonework with Rowan** two days in five, which is where the restorations
  you fund actually get built.

### Fixed — nobody is in two places at once (four bugs, one rule)

Giving two people second homes immediately put **both of them in two places at once** — Sable on the
ridge (11–16) *and* at the pond (13–16); Corin on the plaza (9–18:30) *and* inside the Guild (10–16).
Two windows written independently, in different branches, minutes apart.

Fixing those two by hand found a **third**: v5.5's spouse stands in the cottage 6–9 and 18:30–23,
while Maya also stands on the plaza 7–18:30 — **shipped four releases ago, on every single day, and
never noticed.** And a **fourth**: on festival days the entire cast is on the sand *and* at their day
jobs.

So the fix is structural rather than careful. Every branch may over-add; **one post-pass**
(`npcIsElsewhere`) strips anyone with somewhere more authoritative to be, in a stated authority order
(a festival outranks a day job; being home with your spouse outranks a day job). One rule, one place,
and it cannot drift out of sync with a schedule the way paired `if`s do.

**★ The check that found all four is now standard for any schedule change:** sweep every NPC across
every map, every few hours, for a full month, and print anyone appearing twice. Two overlapping
windows are invisible in a diff and obvious the instant you print the whole week. Result after the
fix: **308 snapshots, 2,781 placements, zero double-bookings.**

## 2026-07-29 — v6.0.0 "The Wrens and the Harrows" (code 135, tag `v6.0.0`) — two doors that were nailed shut in v3

### Why this release, and why it is v6.0 and not v6.5

**Owner direction (`DEVLOG.md`, 2026-07-29):** *"I actually want a lot more characters on the horizon
because right now the village still feels empty and it doesn't feel like there is enough stuff to do,
like there are two empty houses and stuff. So it would be good to have to fill it in with the story
and make them functional characters that have their own lives and their own scenes."*

That was the answer to a casting question ("one newcomer: returned warden or new face?"), and it
replaced the question instead of answering it. The complaint is verifiable in the source, and it is
worse than remembered — `genVillage` has raised two houses on the south lane since v3:

```js
// --- ambient neighbours on the south lane (doors are latched; they open in a later chapter) ---
m.objects[key(9,22)]  = { kind:"sign", text:"The Wrens'" };
m.objects[key(31,22)] = { kind:"sign", text:"The Harrows'" };
```

**The game has been naming two families in the village square for three versions, above doors that
don't open, behind a comment promising a chapter that never came.** Same defect class v5.5 shipped to
fix for the spouse — a promise the game makes out loud and does not keep — except this one is read
every single day on the way to the store.

**And the meta-finding that re-cut the whole train:** "not enough to do" was said *after* ten V5
releases that added a great deal to do. That is the finding, not a contradiction of it. V5 was almost
entirely **depth** — ladders, trials, the deep, the home. Depth on systems a player already engages
with does not register as "more to do"; **new surfaces do.** So people moved from fifth-of-seven to
first, and `V6_PLAN.md` §3 gained a standing constraint: *when a release could go either way, it goes
wide.*

### Added — four people, and the bar they had to clear

★ The owner's word was **"functional"**, and `V6_PLAN.md` §3.5 now states the consequence as a rule:
**a new NPC either meets the full cast bar or is not a character.** Someone who merely stands
somewhere satisfies the request on paper and fails it completely in play — and would make the village
feel *more* like a set, not less. All four have:

| | Ada Wren | Corin Wren | Sable Harrow | Wick Harrow |
|---|---|---|---|---|
| Trade | weaver | mason | herbalist | (child) |
| Home | the Wrens' | the Wrens' | the Harrows' | the Harrows' |
| Out by day | the coast dairy, 10–15 | the plaza stonework, 9–18:30 | the ridge scree, 11–16 | the village lane, 9–18 |
| Birthday | Spring 26 | Fall 11 | Winter 24 | Summer 2 |
| Hearts | 2/4/6/8/10 | 2/4/6/8/10 | 2/4/6/8/10 | 2/4/6/8/10 |

Plus gift tastes, standing dialogue that tracks the story flags, recognitions for what you build, and
two new interiors.

**The Wrens came back.** The only family in the game who left in the dark years and returned — which
is the single most useful thing a new household could be, because the valley's whole story is
repopulation and nobody had ever embodied it. Ada is blunt and warm and *sick* of everyone being
gracious about it (her 4♥ scene is the player saying "you left, Ada" out loud, because she asks them
to). Corin is the mason who has been building Rowan's restorations all along with his initials
underneath where nobody will ever see them: *"If somebody sees my mark it means the well fell down."*

**The Harrows never left.** Sable is the counterweight — she shut the door and waited it out, and her
4♥ scene is the only account in the game of what the dark years were *actually* like: *"It wasn't a
tragedy every day — it was one long Tuesday for nine years."* Her 6♥ is the forty-one made-up jars
nobody collected, and her 8♥ is the first year that number went **down**.

**Wick is why Pip stops being alone.** Pip has been the only child in the valley since v1.0, which is
quietly sad and which one line of dialogue cannot fix. Wick's 4♥: *"I was the only one? And he was
the only one? In the same village, about eight hundred paces apart."*

### Deliberate choices worth recording

- **Gift tastes are chosen to pull, not merely to exist.** Ada wants Wool and Prize Fleece — which
  `V6_PLAN.md` §1 names as near-orphans (two consumers, zero) — so v6.0 gives them a person before
  v6.6 gives them a machine. Corin wants the beams the building chain makes; Sable wants the wild
  forage nobody had a reason to keep; Wick wants small shiny things.
- **The houses are empty at noon.** Both interiors are unoccupied in the middle of the day because
  everyone is out. A house you can always walk into and find two attendants standing in is a diorama;
  the schedules are what make it a home.
- **Ada's loom is a prop, one version early.** It sits in her front room now so that when v6.6 turns
  the fibre chain on, the machine will already have been in the room for a version.
- **No new drawing routines.** Four palettes in `CHAR_SPEC` and four portraits through the existing
  generator with the existing feature vocabulary. A new face that needed new code would be a new face
  that looks like it came from a different game.

### Notes

- `build-atlas.mjs`'s `MAP_ACCESS` assertion fired on the two new maps, exactly as designed — the
  generator refuses to publish a map it has no prose for. Both are described now; the atlas reports
  **18 maps, 11 NPCs.**
- Two new keepsakes with zero sell value, on the Pocketwatch precedent: **Sable's Remedy Book** (10♥)
  and Ada's first wall hanging (6♥).
- The heart ladders use v5.6's ten tiers from the start — the cap raise three releases ago is what
  makes a brand-new character able to have an arc this long.

## 2026-07-29 — v5.9.0 "The Writ" (code 134, tag `v5.9.0`) — the missing middle rung, and the end of Version 5

### Why this release

The goal ladder has **dailies** (the noticeboard request, Nell's order, Elias's round) and then, as the
very next rung, a **festival every 28 days**. There is nothing between them — no goal sized to a few
relaxed evenings, which is exactly the size most play sessions actually are.

### Added — the Guild's writ

Eight standing bundles, cross-skill by construction like the mastery trials, each sized to ~4–7
relaxed days and each a job that visibly changes something: the village road re-lit, the Guild larder
full for the first time since it closed, Bram's three half-built hulls finished, the ridge path shored
before a bad winter takes it. Rowan keeps it — opened by **talking to him**, not by a new object,
because the Guild hall already has a ledger, a noticeboard and nine wings in it and the valley does
not need another thing to walk up to and press E on.

> **★ The framing decision, made in the plan before a line was written: the writ rotates when
> COMPLETED, never on a timer.** No expiry, no streak, no "3 days left". The living-world lens's
> anti-nagging objection (bible §8.4) is honoured **by construction** rather than by restraint —
> there is no clock to be behind, so there is nothing to feel guilty about. A player who takes a
> season over one writ has lost exactly nothing, and the panel says so in as many words.

Two things it inherits on purpose, both named in `V5_PLAN.md` as part of this release's definition of
done, and both bug classes this repo has already paid for:

- **Chest-awareness** (v4.33's `matList` / `chestNote`) — every row prints what you carry *and* what
  is sitting in the cottage chest, so an ask never looks impossible when it isn't.
- **The v4.32 HOWTO figures** — every number the panel prints is the number the deposit uses.

Pay scales linearly with writs closed (6,000g + 1,500 each), never exponentially — the lift's own
lesson, GBP §2.7. The eighth writ asks for deeper things than the first, so it pays like it.

### Added — writ marks, and the four things they buy

**★ Shipped in the same release as the marks themselves**, because v5.6 taught this lesson twice in
one afternoon: a number that buys nothing is a promise the game doesn't keep. Marks buy the **writ
set** — a Guild pennant, the writ desk, a row of little lamps lit the way the village road is lit, and
a map of the valley drawn by somebody who watched you mend it. All four are cosmetic to the last
pixel (marks may never gate anything a player needs), all four are **earned and never sold** — they
are filtered out of Tom's Cottage tab entirely — and all four slot into v5.7's interior catalog.

This is the dependency the owner's reward-channel decision came with (`V5_PLAN.md` §6.2: *"marks want
a small catalog to exist"*), and the release order honoured it: v5.7 landed the catalog, v5.9 spends
into it.

### Changed — the long-sight card names the writ first

`standingGoalsHtml` now leads with the open writ, matching the existing `.qt-obj` row shape exactly
rather than inventing a card style — it is the only standing goal in the game that fits inside a few
evenings rather than a season or a whole skill.

### Fixed on sight

The panel's action button rendered as a bare browser button: every button style in this game is scoped
`.row button`, and a `.buy` outside a `.row` inherits nothing. Caught on the first screenshot.

---

## ✦ Version 5 — "A Life in the Valley" — complete

Ten releases, v5.0 through v5.9, every item in `V5_PLAN.md` §4 shipped and every owner decision in §6
resolved and recorded.

**The Ladder** — mastery trials at 50 and 75 for all six crafts (bank-and-release, grandfathered);
the Warding technique ladder and the two Stave arts; the Cooking→Resolve economy and the tonics; the
gem seams and Read-the-seams; the boss ladder and the floor-45 terminal fight; two late legends.

**The Home** — the spouse moved in, with their things and an arc past the bouquet; hearts to ten with
Tom's and Pip's long-missing capstones; a cottage you furnish, keep and expand; the ferry, the sky and
Tom's craving; the writ.

**Measured, not asserted.** The unlock-cadence linter shipped in v5.0 and then graded every content
release that followed: **Mining 88.5% → 60.9% dead, Warding 88.5% → 59.1%, Fishing 79.0% → 56.8%.**
Two design decisions were changed mid-build *by* that measurement — the seam rate (wrong by 6× until
it was sampled) and the second legend's level (75 → 80, worth 17.9 percentage points because 75 was
already a mastery milestone). The save harness grew from 437 invariants to 1,297 and caught three real
defects; the perf budget caught two; the atlas generator caught a boot-killing TDZ.

**Next: `V6_PLAN.md`.** It is deliberately one notch less locked than V5 was, and its own header says
to re-ground it against real V5 playtest signal before building v6.0. Its five owner decisions — the
child above all — are open and should be made explicitly rather than inherited.

## 2026-07-29 — v5.8.0 "The Ferry Comes In" (code 133, tag `v5.8.0`) — the week gets a texture

### Why this release

One finding, three answers: **the valley's week is flat.** Every day offers the same shops, the same
noticeboard shape and the same sky. `V6_PLAN.md` §1 puts it plainly for the year — *"Year 2 contains
no moment year 1 didn't"* — and the same is true of the week. Week 40 holds nothing week 4 didn't.

### Added — the visiting merchant

**★ Owner decision (`V5_PLAN.md` §6.3): ~2 days a week, seeded — not a fixed weekday.** Seeded reads
as life; a fixed day reads as a schedule to plan around, and planning around a schedule is work.
Measured across a full year: **27 ferry days, 1.7 a week.** Never on a festival date — the coast
belongs to the festival, and a stall competing with a ceremony helps nobody.

Four of nine cargo lines, seeded by the day, at the coast road landing that has had a mooring "kept
good for a boat that never comes" since v3.36. He gets his own vendor id and **no sell tab** — he
isn't buying, he's passing through.

> **★ The contract line, and it governs the whole stall: nothing baseline-required is ever
> merchant-exclusive.** An expiring offer is *foregone gain*, which v3.15's Deep Run established as
> legal; a missed *necessity* would not be. Every line is a convenience, a shortcut or a curio — the
> seeds are out-of-season copies of seeds Tom sells in season, the material is one you can mine, the
> décor is cosmetic. GBP §5.2b pointed at the economy: **no number is tuned assuming the merchant.**

This stall is also `MONETIZATION.md`'s designated diegetic home, and it ships **system-first** on
purpose: by the time any brand slot is ever discussed, the stall will have been ordinary valley
furniture for a full version. The world first, the message later, and never the reverse.

### Added — rare sky events

Meteor showers, an aurora over the ridge, and the comet. Announced on the board **the evening before**
so it is something you can plan an early night around, and delivered as a **morning** — a line on the
sleep card and star-glass in the grass — rather than a night-time event you had to stay up for. The
sleep verb is how this game passes time; an event that punishes using it is a trap.

**★ Odds measured over five simulated years, not guessed.** The first pass gave 7 a year and put the
comet in the sky twice a year while its own text says *"it was last here before Rowan was born."*
Retuned to **8.2 a year — 2.0 a season** — with the comet at roughly once every five years, so the
line stays true.

### Added — Tom's Craving

One item a day at **1.5×**, announced on the board and named on the price wherever it appears. This is
the sell-side texture Tom's Demand used to provide, rebuilt **positive-only**: the retired mechanic
slid a price *down* for selling too much of one thing; this pays *more* for one thing today. Same
texture, opposite sign — and the sign is the whole point, because the owner's reason for retiring
Demand (v4.9) was that the slide read as a punishment for a good harvest.

Applied inside `baseUnitPrice`, the one function every price surface reads. v4.37's entire release was
about premiums computed in one place and displayed from another; verified here — a winter Sardine
prints `30g → 56g · winter · Tom wants this today`, and the counter pays 56.

## 2026-07-29 — v5.7.0 "Four Walls" (code 132, tag `v5.7.0`) — the room you wake in every day stops being a diorama

### Why this release

`V5_PLAN.md` marks this the version's **XL**, with a warning attached: *"if it slips, it slips whole —
do not ship a half-persistent cottage."*

The measured problem is one sentence: **`genCottage` hard-codes every prop, the cottage regenerates
nightly (only `state.farm` is in the save), and `plantPermanent`'s very first line refuses décor
anywhere but the farm.** So the one room the player wakes in every single day of the game was the one
room they could not touch. Of the four expression channels the cozy genre lives on — home, ground,
avatar, automation — the game had none; the one adjacent thing it does have (outdoor décor: 21
pieces, cap 40, lossless pickup) is well built and proves the appetite exists.

### Added — `state.home`, the persistence overlay

The cottage stays a **transient** map. That architecture is right (it is why interiors, the mine and
the coast are all cheap) and this does not change it. Instead the farm's own pattern is applied one
level up: `state.home.objects` is the player's layer, stamped over the generated room by `applyHome`
every time it is built. **The room is regenerated; the home is not.**

Placed furniture wins over a default prop on the same tile, and the default is remembered nowhere —
so moving the bookshelf is simply putting something where the bookshelf was. Nothing is lost either
way: the axe returns the piece to your bag, and clearing a tile restores whatever `genCottage` puts
there tomorrow.

Verified end to end in the browser: placed → **survives `clearMapCache()` and a full regeneration** →
picked up → returned to the bag → gone from the overlay.

### Added — fifteen pieces, and none of them do anything

Rugs, a hearthrug, a candle stand, a brass lamp, an open hearth fire, shelves, a bookcase, a side
table, a dresser, an armchair you will fall asleep in, a window bench, a wall hanging in the old
valley pattern, a potted fern, a corner desk, and a standing clock that announces the hour whether
asked or not. All procedural, all in a warmer palette than the outdoor set — indoors these sit on
lamplit floorboards, not grass.

Priced **under** the outdoor catalog at every tier, deliberately: décor is what the valley sees,
furniture is what *you* see every morning. They sit in their own **Cottage** tab at Tom's rather than
more rows under Décor, because the two answer different questions and the placed counter counts a
different set. Placement uses the **same verb** as every other placeable (choose it in the picker,
face a spot, USE) — the game already taught that gesture four times over, and a second grammar for
the same action would be a thing to learn for no reason.

### Added — Rowan builds on

Two house-expansion pledges on the Pledge Ledger: the second room (24,000g + lumber and stone) and
the long room (60,000g + silverwood, heartwood and deepsilver). The cottage's footprint is a
**function of `state.home.rooms`** — 11×9 → 15×9 → 19×11 — read at generation time, so the map simply
follows the save.

This is the expression gold sink the economy lens found missing: décor tops out at the 300,000g
statue and then coin has only the Patron, whose *desire* runs out at tier ten. A bigger house is
want-shaped — it isn't a number going up, it is more room for the things you chose.

### The tooling caught two things before a player could

1. **The atlas crashed on the first run.** The new `cottage.w` getter read `state.home` — and `state`
   is `null` at load and in every headless tool. Guarded at the save, not just the field. *Second time
   in this version the v5.0 tooling has stopped a crash before a browser saw it.*
2. **A fixture failed the migration harness.** The dense year-3 save claims level 92 in six crafts but
   is built from *current* code, so `freshState` hands it `trialsSeeded:true` and `migrateSave`
   correctly declines to grandfather it — leaving every skill clamped at 50. **That is a fixture bug,
   not a game bug**: the clamp firing on a save that claims 92 without ever passing a gate is exactly
   what a hand-edited or imported save should get. The fixture now passes its trials, like a real save
   would have.

### The number this release had to land against

`V5_PLAN.md` gated v5.7 on the v5.0 perf fixture: *"interior draw cost is measured before shipping."*
The dense fixture grew a fully dressed 19×11 cottage (24 pieces, the cap) and was re-measured:

| | p50 | avg | p95 |
|---|---|---|---|
| **Cottage** (dressed, largest room) | **0.5 ms** | 1.08 | 1.6 |
| Farm (1,179 crops + 100 objects + weather + lighting) | 2.2 ms | 3.2 | 9.5 |

`renderWorld` measured directly on the dense farm: **0.9 ms median**, and every update function
~0 ms. **The interior this release added drawn state to is the cheapest map in the game.**

★ The probe's own honesty note is now in the budget file: read **p50**, not avg/p95/worst. The probe
drives `loop()` in a tight synchronous run because the harness browser throttles rAF to ~1 fps, which
starves the browser and inflates the tail with GC. The 9.5 ms p95 is the measurement, not the game —
`renderWorld` at 0.9 ms is the honest figure, and it is the one the reporter now prints.

## 2026-07-29 — v5.6.0 "Ten Hearts" (code 131, tag `v5.6.0`) — the friendship system stops switching itself off

### Why this release, and the door it closes

**`heartsOf` clamped at 6, so every relationship point past 600 evaporated.** A player maxes the
entire cast in roughly two seasons; from then on every gift, every conversation and every shared
morning fed a number nothing read. The system turned itself off at exactly the moment the player had
succeeded at it. Tom's ladder ended at 5♥, Pip's at 4♥, and `DESIGN_SCORECARD.md` has been asking for
those two capstones since v3.32.

**★ Owner decision, taken deliberately as a one-way door** (`V5_PLAN.md` §6.4): the cap rises to
**10**, not 8 — 10 leaves room for V6's married and newcomer arcs, and *the cap may rise once and not
twice.* This release is the only chance to get that number right.

### The migration is free, by construction

Hearts are **derived** from `rel[id].points`, which was never capped — only the *reading* was. So a
save that has sat above 600 with Maya for a year simply **has** more hearts the moment it loads.
Nothing is granted, nothing is owed, nothing is migrated. The points were always there.

`heartStr` prints the full six-pip row while it can still be read at a glance and switches to `♥×8`
past that, because ten pips in a dialogue header is a wall, not a readout.

### Added — the two capstones the scorecard asked for

- **Tom, 8♥** — why he kept the shop open through nine years of eleven customers, and what it meant
  when somebody finally walked in and bought six turnip seeds. *"Somebody's planting something."*
- **Tom, 10♥** — his ledger, three generations of handwriting, the last page blank with your name on it.
- **Pip, 6♥** — he works out that he doesn't have to be the thing everyone said he'd be.
- **Pip, 8♥** — he tells his dad. Tom goes in the back and comes out with the trowel *his* father gave
  him, kept in a box for thirty years. *"Don't come, you'll make me brave and I want to do it the
  scared way."*

### Added — a late scene for the rest of the cast

Rowan (8♥) burns the list of two hundred and six names he has been reading on bad nights. Elias (8♥)
goes back to the ruin of his house on the ridge and finds a birch growing where the kitchen was, and
feels something too small to name. Nell (8♥) tells you about the year she nearly left, and the cow
that stopped her. Maya (8♥, 10♥) says yes to the tenth window and then counts the lit ones. Bram
(8♥, 10♥) names the boat, and finally says what thirty-one years alone on the water was about.

### The v4.6 guard, made structural

v4.6 shipped a `hearts:8` event while the cap was 6 — **unreachable forever**, and nobody noticed
until an audit read the table. Raising the cap makes the mirror-image mistake possible, so both
directions are now asserted in `tools/check-saves.mjs`, on every era fixture:

1. no heart event sits above `HEART_CAP` (unreachable);
2. no two events share a `flag` (one of them could never fire);
3. **any `he_*` flag that was true before migration is still true after** — a retier may never
   un-see a scene.

Structurally this cannot break anyway — every old scene is at 2–6, every new one at 8–10, and each is
latched by its own flag — but "structurally impossible" is a claim, and the harness turns it into a
check. **1,297 invariants now, up from 697.**

### Fixed — two flags that promised things

Writing the scenes produced two `state.flags` that nothing read: `tomDiscount` and `pipPlot`. A flag
that does nothing is a promise the game doesn't keep, which is the exact defect v5.5 existed to
repair, so neither shipped that way.

- **`tomDiscount` is now real** — 10% off everything Tom sells, forever, applied through **one**
  `tomPrice()` called by both the shop rows and the buy handlers. v4.37's entire release was about
  prices that disagreed with the counter; a discount applied in one place and not the other is that
  bug wearing a bow.
- **`pipPlot` is gone.** It implied a corner of your field Pip could farm — a whole feature. The scene
  didn't need it: he starts his patch behind the shop, presses six carrot seeds on you the way he
  once pressed a sapling, and the beat is complete.

## 2026-07-29 — v5.5.0 "Moved In" (code 130, tag `v5.5.0`) — the promise the wedding scene made, four versions late

### Why this release

`DESIGN_SCORECARD.md` flagged this at **v3.32** and it was still unshipped at v5.4. It is the
plainest broken promise in the game, and the game makes it out loud, in its own voice:

> **Maya, in `MARRIAGE_SCENES`, at her own wedding: *"I'm moving my sketchbooks into the cottage
> tonight."*** — and then `spawnMapNpcs` had **no cottage case at all**, so she went home to the
> Alderman House and slept there forever.

The V5 review's summary was "married life is five watered tiles and a coin-flip." Worse than the
missing content is *where* it is missing: the most emotionally loaded moment in the game was also the
point at which the relationship system stopped having anything to say.

### Added — they are in the house

A `cottage` branch in `spawnMapNpcs`: the spouse is there **mornings (6–9) and evenings (18:30–23)**,
wandering the room. Between those they are about the valley like everyone else — Maya on the plaza,
Bram on his rocks — because a spouse who stands in one room all day reads as furniture, not a person.
Same reasoning the NPC schedules have always used, finally applied to the one person who lives with you.

### Added — their things are in the house

Spouse props stamp into `genCottage`, and each one is a prop that character's own dialogue promised:
Maya's **sketchbook shelf by the window** ("that's the good light, and I'm not negotiating about it")
and her painting of the valley as it was; Bram's **rod rack**, which takes the whole wall, which he
offers to take out again, and then doesn't.

Stamped at generation rather than persisted, so it survives the nightly cottage regeneration with
zero migration. (The cottage becomes genuinely persistent in v5.7; this needs nothing from that.)

### Added — the arc continues past the bouquet

Two scenes per spouse, keyed on `daysMarried()` — **a week in**, and **a season in**.

Measured from a new `wedDay` rather than from hearts, on purpose: hearts cap at 6 until v5.6, and a
married arc that waits on a cap raise is a married arc that doesn't ship this release. Days are also
the truer unit — what makes a marriage is time in it. Saves wed before today have no `wedDay`; rather
than invent one (which would either fire both scenes at once or lock them out forever), the migration
day becomes day zero. They get the arc from here: a gift, never a loss.

The scenes sit **after** heart events and **before** the mastery trials in `talkNpc` — a marriage beat
outranks a craft errand, and a friendship beat outranks both.

### Changed — married talk knows what time it is

Four lines on an endless rotation read as a recording after about a week. Each spouse now has a
**morning / day / evening** pool of four. Deliberately three small pools rather than one big one:
variety alone doesn't fix a recording, *context* does. A line that could only be said at that hour is
worth five that could be said at any.

> *"You were talking in your sleep again. Something about turnips. I have chosen not to investigate."*
> *"Thirty-one years I ate standing up. Sitting down's better. Took me long enough."*

## 2026-07-29 — v5.4.0 "The Oldest Knot" (code 129, tag `v5.4.0`) — the climax gets its encounter, and the boss stops being one fight in four costumes

### Why this release

Two findings from the V5 review, both of them about the same thing: the game's combat set-piece got
*less* interesting exactly as the player got better.

1. **`CREATURES.greatknot` was stat-frozen** — hp 42, dmg 20, xp 360, **no depth term at all**. Floors
   10, 20, 30 and 40 hosted the identical two-move fight, and by the Star Stave it died in four swings.
2. **Floor 45 spawned nothing.** `genUndercroft` printed *"the wing ends here — for now"*. Act III's
   finale chapter names that place; ch7's dialogue calls it "the deepest knot". **The emotional climax
   of the whole game had no mechanical mirror.**

### Added — the boss ladder (floors 10 / 20 / 30 / 40)

The fix is **composition, not numbers**. Each decade keeps the slam-and-lunge base and gains one move
the wing has already taught, so every boss asks the question the preceding floors answered:

| Floor | HP | Gains |
|---|---|---|
| 10 | 42 | — the plain Knot: learn the ring and the reach |
| 20 | 78 | **sheds Tanglets when struck** (the Gloam Tangle's lesson) |
| 30 | 130 | **lobs star-bolts between slams** (the Star-Gnarl's lesson — sidestep, or turn them with Bolt-Turn at 55) |
| 40 | 190 | both at once |

Stats scale alongside, but the composition is the difficulty and the numbers only keep pace. Two
details worth recording: the bolt fires **260ms after** the slam ring rather than with it (a bolt you
cannot see because a ring is filling the screen is not a telegraph, it is a trick, and the wing does
not do tricks); and shedding is rate-limited and capped at four loose Tanglets, so a fast stave cannot
bury the room.

`knotStats()` is the one accessor for a live boss's numbers, so damage, XP and drops can never
disagree about which rung they are on.

### Added — the Oldest Knot (floor 45, the terminal fight)

240 HP, three phases, and **every move in all three is one the wing already taught** — this is a final
exam, not a new syllabus:

- **Phase 1** (above ⅔) — the plain Knot. Ring and reach.
- **Phase 2** (⅔ → ⅓) — it begins to shed. *"The Oldest Knot begins to shed. Clear the halves."*
- **Phase 3** (below ⅓) — it sheds **and** throws, and between moves it turns a guarded front toward
  you (the Hollow Warden's rule, on the last boss). Circle it, parry it open, or bring the Settling
  Blow — exactly as forty-five floors taught you.

It is the one settle in the game that **opens no stair**: there is nothing below it. Settling it sets
a permanent flag, because a finale you re-fight every morning is not a finale — the wing stays
walkable and its drops keep dropping, only the fight is done. **Retroactive by construction:** a save
that "finished" the wing years ago finds the fight waiting the next time it walks down, with no
migration at all.

### The contract, unbent

Knockout is still free. The floor-45 bell is still a checkpoint. The fight is tuned for a player who
walked in with an empty bag (GBP §5.2b, shipped last release and binding here first). It is **long,
not punishing** — the difficulty is composition and stamina, never a cost.

## 2026-07-29 — v5.3.0 "The Deep Seams" (code 128, tag `v5.3.0`) — the worst void in the game, filled, and measured on the way out

### Why this release

The game's own linter names the target every time it runs. Before today:

- **Mining 50→70 — 20 levels, 19.3% of the entire 1–99 climb, nothing in it.** The single worst void
  in the game, in the skill with the fewest milestone levels of any gathering craft (11).
- **Fishing 79.0% dead**, with a 15-level hole at 55→70 and a 10-level one at 75→85.

The ore ladder cannot fix Mining's void: `1/10/20/30/45/70/85` is the unified tier ladder six systems
key off, and V5's constraint #4 says it does not move. So the fix interleaves *between* its rungs.

### Added — four gem seams (Mining 15 / 35 / 55 / 78)

A seam is a distinct rock that yields a **specific** gem, level-gated like an ore vein — you learn
where rubies live rather than hoping a gem rock rolls one. Opal at 15, Emerald at 35, **Ruby at 55 —
planted squarely inside the 50→70 void** — and Diamond at 78, which splits the 75→85 band.

Sprites are generated **from the seam table**, so a future seam needs no new pixels; and they read
deliberately unlike a gem rock — not a boulder with a lucky glitter, but a band of the gem running
*through* the stone, so you can tell at a glance which gem it will give.

**★ The GBP pass, done at spec time — and wrong by 6× on the first try.** Gems were de-monetized
twice (v2.9.2, v3.16: spawn 0.018 → 0.002, average value ~312g → ~150g) precisely because they were
the runaway faucet, and this release must not quietly undo that. The spec assumed ~600 open tiles per
mine floor; **sampling 40 deep floors in the live generator showed ~100**, so the first rate produced
0.23 seams per floor — one every four floors, too scarce to read as an unlock at all. Retuned against
the measurement to **~0.85 per floor**: you meet a seam on most floors of a deep run, a Ruby Seam
floor is worth ~340g, and that is a rounding error beside the fishing loop this repo already clocks
at ~64,000 g/day. A seam yields **one** gem (a second only on the Mining-75 mastery roll). Its value
is the rung, not the coin.

### Added — ★ Read the seams (Mining 60)

The second thing in the 50→70 band, and deliberately a **method** unlock rather than a number: on
entering a mine floor, every seam on it shimmers once. It reveals nothing you could not find by
walking the whole floor yourself — it saves the walking, which is precisely what a veteran
prospector's eye is. Silent on a floor with no seams, because a perk that announces "nothing here"
every time is a nag.

### Added — Fishing's late waters, part 1

Two legends on the shipped `LEGENDS` engine (pure data — the cheapest high-value content in the repo,
and the *right* content for a late band: a legend is a condition to read and a morning to plan, not
another number). Both are heart-gated clues, which finally gives Bram's ladder a late payoff instead
of running out at five hearts.

- **Lantern-Jaw** (60) — estuary, fog, autumn, after eight. Carries its own light in front of it.
- **Tide-Warden** (80) — open coast, winter storm, first light. *"My father called it the Tide-Warden
  and never fished again after he saw it."*

**★ The Tide-Warden is at 80, not the plan's "~75", and that one-character decision was worth 17.9
percentage points.** Level 75 is *already* a milestone on every ladder — it is a mastery tier — so a
legend there would have added a name and moved the cadence not at all. At 80 it splits the 75→85 band
and the dead zone disappears outright. This is exactly the decision the v5.0 linter exists to make
possible: the plan proposed a number, the measurement corrected it, and the correction is visible in
the atlas.

### Fixed — the pick oracle had a hole in it since v3.28

`toolValidFor` — one predicate that drives **three** things (smart-tool's choice, the cursor tint, and
the first-time pick hint) — listed ore, gem rocks and crystals, but **not geodes**. With "Pick tools
for me" on by default since v4.27, facing a geode meant the game did not reach for your pick, which
reads as the rock simply not responding. Found while testing the seams (which had the same hole, being
new); both are in the oracle now.

### Measured effect

| Skill | Unlocks | Dead share |
|---|---|---|
| Mining | 17 → **22** | 88.5% → **60.9%** |
| Fishing | 30 → **32** | 79.0% → **56.8%** |

Mining's remaining bands are 60→70 (11.4%) and the 85→99 tail (45.4%); Fishing's are the same two.
Both are reported honestly by the linter and belong to later work — the tail is explicitly V6's
(`V6_PLAN.md` §2, the L92 transformative unlocks), and this release was scoped as *part 1* of
Fishing's late waters.

## 2026-07-29 — v5.2.0 "The Warden's Table" (code 127, tag `v5.2.0`) — Cooking gets its combat consumer, and the wing comes up for supper

### Why this release

It closes an open spec the game wrote against itself. `V4_PLAN.md` §2 promised, of Resolve:
*"cooked dishes restore it — Cooking's new consumer."* It never shipped. `eatFood` touched only
`state.energy`; **no code path in the entire game fed `state.resolve` from any item**; Resolve
refilled free at dawn, at the door, on exit and at every bell. So the bible's §6.4 — *"preparation is
the real combat skill"* — was structurally absent: there was nothing to prepare.

The two newest systems in the game had never touched. Cooking made food nobody needed underground;
Warding's drops fed only charms; and the endgame's one daily job (`WARD_ROUNDS`) asked exclusively
for things the *wing* produced, so a player deep in Act III had no reason to plant anything.

### Added — food restores Resolve, in the Undercroft only

One branch in `eatFood`, because eating is one key (F) everywhere and this should not become a second
verb to learn. Scaled off the dish's **energy** rather than its level or price — energy is already the
honest measure of how much work went into it; a Berry Bun is a snack, a Dragonfruit Parfait is an
afternoon.

`min(45, energy × 0.55)`, with Cooking-50's mastery applied **before** the cap. That ordering is the
whole of the tuning and it was wrong in the first draft: capping first let the ×1.2 lift the real
ceiling to 54, which is over half a bar. Caught in test, fixed, and the reason §5.2b's second bullet
now names it specifically.

### Added — three Warden's tonics (the join, in both directions)

Brewed at the bell bench beside the charms. **Every one spends a cooked dish AND a settling drop**,
which is the point: the kitchen gets a reason to look down the tenth door, and the wing gets a reason
to come up for supper. Brewing pays **Cooking** XP, because it *is* cooking.

| Tonic | Costs | Does |
|---|---|---|
| **Ember Broth** | Ember Grit ×3 + Fish Stew | +2 Resolve every 4s, one descent |
| **Gloamsalve** | Gloam Thread ×6 + Honey ×3 | catches the next fall, once |
| **Warden's Tea** | Warden's Ash ×3 + Apple Crumble | a wider parry window, one descent (stacks with ★ Sure Footing) |

**Gloamsalve is worth reading carefully, because it looks like a safety net and is not one.** A
knockout already costs nothing — you wake at the door with everything you carried *and found*. So
this cannot save you from a loss; there are none. What it saves is **the walk**, which on floor 38 is
the only thing a fall has ever actually cost. A convenience, spent, never something the balance leans on.

Tonics are drunk from the **bag**, not the hotbar: it is a decision you make once at the start of a
descent, and it should not compete with the swing. They last exactly one descent — cleared by a bell
ride, a knockout and dawn — because a buff that survives a night is a buff the game starts assuming.

### Added — the Guild eats

Four new `WARD_ROUNDS` entries (fish stew, six large eggs, honey for the salve, three cheese toasties
"for a boy on the second round who has never once packed a lunch, and I have decided it is my
problem") and two new `PATRON_MATS` rotations asking for cheese, wheat, crumble and honey.

Small as data; structural as design. Before this, the two systems a finished save lives on — the
daily round and the endless commission — could both be fed entirely from the deep, so the farm became
scenery the moment Act III opened. A civic work is built by people who have to be fed; the rotation
should say so.

### Added — GBP §5.2b, the named invariant

Written the day it became possible to break, and named in the code that would break it:

> **No Undercroft encounter is ever balanced assuming food, a tonic, or a charm.**

The free refills all stay. The rule exists because the moment a combat number is justified with *"they
can always drink something for it"*, the consumable stops being optional and becomes an entry fee, and
the player who didn't know is punished for not knowing. That is the exact shape `MONETIZATION.md`
refuses for boosters — *"the moment a balance change is justified with 'they can always watch a video
for it', the cozy contract is broken in spirit"* — **the same sentence, pointed inward.** §5.2b ships
with four practical tests (delete it and re-run the fight; cap below a full reset; bound the duration
to the attempt not the day; never let a consumable prevent a loss, because there are none to prevent).

### Notes

- Tonic prices sit deliberately **below** the dish that goes into them, so brewing can never launder a
  Fish Stew into more gold than the stew was worth. They are a sink; this release mints nothing.
- Three new procedural sprites (a bowl, a stoppered jar, a tin mug) and three examine lines in Elias's
  register. No asset files, as ever.
- New persisted field: `state.tonic`. Cleared in three places, all of which end a descent.

## 2026-07-29 — v5.1.0 "The Trials" (code 126, tag `v5.1.0`) — the ladder grows people on it, and Warding's levels finally buy verbs

### Why this release

`V5_PLAN.md`'s first content release, and the oldest debt in the repo: mastery trials were specced in
`V4_PLAN.md` §4.1 and deferred out of v4.1, v4.3, v4.4 and v4.5 — four times, always for the same
honest reason (they touch every skill's progression and want a release of their own).

The measurement that finally forced it is now in the build. `auditUnlockCadence` (v5.0) prints it
every release: **45.4% of every 1–99 climb sits above L85**, and Warding — the v4 flagship — had the
thinnest ladder in the game at **10 unlocks and an 88.5% dead share**. A player who commits is
climbing through silence for most of the journey. This release puts two people and five verbs into
that silence.

### Owner decisions, locked 2026-07-29

`V5_PLAN.md` §6 is now fully resolved, and the plan updated to match:

1. **Trials at 50 AND 75, live from the start** — not "75 ships dark". Shipping it dark would have
   left L75 empty in the exact band this release exists to fill, and the linter would have gone on
   reporting it every version.
2. **Heart cap → 10** (binds v5.5/v5.6; the cap may rise once and not twice).
3. **Writ rewards: gold + marks toward cosmetics** — with the dependency written down, that v5.7's
   interior catalog must exist before v5.9's marks mean anything.
4. **Merchant cadence: ~2 days/week, seeded.**

### Added — the mastery trials (12 of them, six crafts × two gates)

**The contract first, because it is why this took five releases.** A naive reading of "a trial gates
the level" takes a level, and this game does not take. So:

- **Bank, never regress.** XP accrues at full rate past the gate; the LEVEL waits. The instant the
  trial clears, every banked level lands at once with the banner it was owed. `trialCap` can only
  ever rise (50 → 75 → 99), so a clamped level can only ever go up — that property is what makes the
  whole design legal, and the harness now asserts it directly.
- **Grandfather everything.** Any save already past a gate auto-passes it, once, in `migrateSave`
  (guarded by `trialsSeeded`, placed before the generic backfill — the dead-code trap this file
  documents three times). Verified live: a save at Cooking 70 loaded with `Cooking50` marked passed,
  effective level unchanged at 70, and only the 75-trial ahead of it.
- **No timer, no failure, no expiry.** A trial can be ignored for the rest of a save; you keep the
  level you have and bank the rest.

**Every ask is cross-skill by construction** — that is the anti-rabbit-hole design (`V4_PLAN` §4),
applied to the ladder itself rather than to the story. Maya's Farming 50 wants sawn boards, iron pins
and lunch; Rowan's Mining 50 wants oak sills, maple beams and a stew that keeps in a cold gallery;
Bram's Fishing 50 wants a gaff forged and hafted. Nothing is rare-drop-gated: every item is farmable,
choppable, mineable, catchable or cookable on demand, so a trial can never become a wall of bad luck.

**Where each piece lives, and why:**

- **The ask rides the Pledge Ledger as a sixth prefix** (`trial:<Skill>:<gate>`). That buys partial
  deposits, the Journal's Restorations page, and the no-wasted-trip rule for free — the same argument
  v4.26's Patron made for not being a `PROJECTS` entry.
- **The scene fires on TALK, not on the level-up.** `addXP` runs mid-swing, mid-harvest, mid-cast;
  starting a cutscene there freezes the player to deliver good news, which reads as an interruption
  however warm the words are. The gate-crossing gets a banner and a pointer; the scene waits for you
  to walk over, exactly like a heart event — and sits *after* heart events in `talkNpc`, because a
  friendship beat is the rarer thing and must never queue behind a craft errand.
- **The Skills panel explains the hold.** A held craft shows a full gold bar (the XP genuinely IS
  past the top of that level), who is waiting, how many levels are banked, and what is still owed.
  "Banked" is only reassuring if you can see the number; a held level that doesn't explain itself is
  indistinguishable from a bug. The old "0 to Lv 51" line — literally true and completely misleading
  while a trial holds — now reads "banked past Lv 50".

### Added — the Warding technique ladder (15 / 35 / 55 / 65 / 80)

The direct answer to the linter's worst row. **The rule every rung obeys: a new INPUT or a new
OUTCOME, never a damage stat.** A "+3% stave power at 55" would have been another number; a guard
that suddenly turns star-bolts changes what you can stand in front of.

- **15 — Lantern Flare.** Settling something flares the lantern; whatever stands too close hesitates.
  Not damage — a beat of breathing room, which is what a crowd actually takes from you.
- **35 — Long Reach.** The swing's arc widens, so a crowd standing apart is caught in one sweep.
- **55 — Bolt-Turn.** A star-bolt caught on the opening beat of a Guard goes *back*, and settles the
  Star-Gnarl that fired it through the same path everything else uses. (Handled in `updateWardBolts`,
  because the guard path is deliberately source-agnostic — one check covers melee, slam, lunge and
  bolt — so only the bolt's own code knows a bolt was involved.)
- **65 — Sure Footing.** A kinder parry window (+0.10s) and a shorter recovery. The one rung that
  touches a number, deliberately an *input* one: how forgiving the timing is, never how hard you hit.
- **80 — Ward-Pulse.** A perfect parry stops being private and rings outward; everything close loses
  its footing. The highest-skill input in the game earns a bigger *consequence*.

Measured effect on the diagnosis that motivated it: **Warding 10 unlocks → 15, dead share 88.5% →
59.1%.** Still the worst ladder in the game — v5.3 and V6's L92 tail are aimed at the rest — but no
longer the one whose levels mean nothing.

### Added — the Stave arts (the Warding trials' payout)

Warding's two trials pay *combat identity* rather than materials. Set at a Warden's Bell, one at a
time, before you go down — **a stance, never a combo system** (the bible's §6.5.3: cozy combat is
read, position and timing, not an execution test). Each is a trade with no strictly-correct answer:

| Art | Trade |
|---|---|
| The plain hold | the stave as Elias gave it over — no trade |
| **The Sweep** (50) | +7 reach, ×0.7 power — for crowds, worse against anything you want settled fast |
| **The Settling Blow** (75) | −3 reach, ×1.35 power, and it goes **through** a Hollow Warden's guarded front instead of round it |

The Settling Blow is the only thing in the game that ignores that guard, which is exactly why it is
slower and narrower.

### Fixed — a `const` TDZ that would have killed the boot

v5.0 ended `01-data.js` with `const LADDER_AUDIT = auditUnlockCadence()`, evaluated at load. This
release appended a new unlock table (`WARD_TECHS`) *below* it, `unlockLadder` reached for that table,
and the game died at boot: **"Cannot access 'WARD_TECHS' before initialization"** — in a codebase
whose entire architecture is one shared script scope where load order is load-bearing.

Fixed at the root rather than by moving lines: the audit is now a **memoized function** (`ladderAudit()`),
which has no position in the file, so no table added later can ever be too late. The `?lint` print is
deferred a tick for the same reason — it reads a fully evaluated file rather than whatever happened to
be declared by the time that line was reached. Caught by the node loader (`tools/lib/load-game.mjs`)
before it ever reached a browser, which is the second time in two releases the v5.0 tooling has paid
for itself.

### Changed — the harness now guards the sharpest thing in the release

`tools/check-saves.mjs` grew the assertions that matter most here, and they check the **effective**
level (`skillLvl`) rather than the raw curve reading — a grandfathering bug would be invisible to the
raw number and total to the player:

- every gate a save is already past **is** grandfathered (or that save just lost levels);
- no gate is marked passed that the save has **not** reached;
- `trialCap` returns only a legal gate, and never sits below the effective level (a cap under the
  effective level *is* the demotion).

**697 invariants across ten fixtures, all holding** (up from 437).

### Notes

- New persisted fields: `trialsDone`, `trialsSeeded`, `stanceArt`. Per `AGENTS.md`, each arrived with
  its fixture assertion in the same change.
- A technique at 55 is genuinely behind an unpassed 50-trial, because techniques read the effective
  level. That is the gate meaning something, and nothing is lost by it — pass the trial and every
  rung lands at once.
- `staveArt()` refuses to return an art the save has not earned, so a hand-edited or imported save
  can never carry one.
- GBP §2.5's obligation was met at spec time: trial asks are materials-first (a gold-only ask is just
  a wait), sized to roughly one good afternoon in two other crafts at 50 and two at 75, and they are
  a *sink*, not a faucet — this release mints nothing.

## 2026-07-28 — v5.0.0 "The Strongbox" (code 125, tag `v5.0.0`) — the save becomes a file you own, and the game starts checking itself

### Why this release, and why it is first

This opens **Version 5, "A Life in the Valley"** (`V5_PLAN.md`), and it deliberately ships no
content at all. The V5 review's cross-check named one thing no design lens had asked for and
insisted it come before everything else: **the entire game lives in a single `localStorage` slot,
and every feature after this adds more state to it.**

Two consequences drove the whole release.

1. **The player's exposure.** A save representing a hundred hours sits one *Clear browsing data*
   away from permanent, total loss — plus browser storage eviction, a private window, a reinstall,
   a new laptop. Measured against the game's own first principle ("nothing is ever taken from the
   player"), that is the largest possible violation, and it has been true since v1.0. It is also
   the only one the player cannot avoid by playing carefully.
2. **Our exposure.** `migrateSave` has grown across 124 version codes with **zero automated
   coverage**. Its own comments document the same trap three times — *"MUST run before the generic
   backfill below, or freshState's default lands first and this becomes dead code"* — a trap this
   repo has fallen into twice (the v2.6.1 Collection seeding, the v4.31 bag grandfather). V5 adds
   more persisted state than any version before it (the cottage overlay, trials, hearts to 10). The
   coverage has to exist *before* the state does, or every later release is a gamble.

So: the save gets a door out, and the migration gets a harness. Everything else here exists to make
the next nine releases safe to build.

### Added — the Save File panel (the Strongbox itself)

`exportSaveText` / `parseSaveText` / `importSaveText` in `04-world.js`; `renderSaveManager` in
`10-ui.js`; a `savePanel` in `index.html`, reachable from **Settings** *and* the **title menu**.

Four decisions worth recording:

- **It reads raw `localStorage`, never the live `state`.** The title screen is exactly where a
  frightened player goes looking for their farm, and there `state` is `null`. Every branch of this
  feature had to work before the game starts, so nothing in it touches the running world. (This is
  also why the title placement matters more than the Settings one: after the scare, Settings is
  unreachable.)
- **A restore may never destroy what it replaces.** The displaced save is stashed in `BACKUP_KEY`
  and the panel offers to put it back — and the undo *swaps* rather than overwrites, so the undo is
  itself undoable. `wipeSave` now stashes too: "Delete Save & Restart" was the one button in the
  game that could cost a player everything, guarded by nothing but a `confirm()`.
- **A truncated paste is refused, not half-applied.** The export envelope carries an FNV-1a
  checksum over the payload — not security, a smoke alarm for the realistic failure ("select all,
  copy, email it to myself, miss the last line"). A bare `state` object is still accepted, because
  a player who pastes only the inner save should not be turned away; an envelope with a *wrong*
  checksum is not, because at that point we would be guessing.
- **`suspendSaves()` before the reload.** `beforeunload` and `visibilitychange` both call
  `saveGame` (`10-ui.js`). Without freezing writes, reloading after a restore writes the *old*
  in-memory state straight back over the newly restored one — the feature would appear to work and
  silently do nothing. This is the single sharpest edge in the release and it is now documented in
  `AGENTS.md` as a rule, not a comment.

The format is plain JSON with a self-describing envelope (`game`, `fmt`, `version`, `code`,
`exported`, `sum`, `save`) so a file found in a downloads folder in two years explains itself. A
dense year-3 save exports at ~54 KB — comfortably pasteable, which is why it stayed human-readable
JSON rather than base64.

### Added — the migration harness (`tools/check-saves.mjs` + nine era fixtures)

Ten fixtures — **nine of them generated by checking out that release's own code** (`git archive`
→ a vm → that era's `freshState`, map generator, XP table and item names) and playing a short
synthetic game in it. A hand-written fixture is a *guess* about what an old save looked like, and a
guess is precisely the thing `migrateSave` keeps getting wrong; whatever an era's own code produces
*is* that era's shape, by construction. Each fixture carries an `expect` block computed with **that
era's own `levelFor`** — the levels the player actually saw — which is what makes "a recalibration
must never demote a save" (`GAME_BALANCE_PRINCIPLES.md` §5.4) checkable instead of aspirational.

Eras chosen because a *named branch* of `migrateSave` keys off each: v2.1.0 (pre-v2.7 curve, 60×46
farm, five-tier tools), v2.6.1 (the dead-code trap), v2.9.2, v3.1.1 (pre-shrink), v3.20.0
(pre-construction), v3.36.0 (pre-`ladder6` remap), v4.0.0 (Warding), v4.31.0 (the carry cap),
v4.37.0 (the no-op case, which must stay a no-op), plus the dense stress save.

**437 invariants**, stated as claims about the *player's* experience rather than about code shape —
a refactor is free to change everything inside `migrateSave`; it is not free to cost anyone a
turnip. No demoted level; no lost item, gold, crop, animal, friendship, discovery or quest step; no
downgraded tool (the v3.37 five→seven tier insertion, where a stored `4` changed meaning from Star
Metal to Cobalt); the farm lands on the current canvas; no `NaN` and no `undefined`; `resolve` and
`iFrame` are numbers (an `undefined <= 0` is `false`, which would silently disable all combat
damage); and the Strongbox round-trips on every era.

**Idempotence is the invariant worth naming.** `migrateSave` runs on *every* load, so if it is not
a fixed point after the first pass, a save degrades a little every time it is opened. Nothing
enforced that before today.

### Fixed — the harness's first catch: the starter pine

Four fixtures failed idempotence on `.farm.objects["21,17"].hp: 6 vs 4`. `genFarm` hand-places five
starter nodes with **literal** hp values, and v4.23's tree rebalance (pine 6→4) updated the table
but not the literal — so every farm's starter pine stood at 6 hp until the next load, where the
migration's clamp knocked it to 4.

Harmless in isolation (the clamp can only ever make a tree *easier*, never restore HP the player
already knocked off — that is why it is a `Math.min`). It matters because the generator and the
table disagreed, which is exactly how the *next* rebalance ships a wrong number too. All five
starters now read from `TREES`/`ORES`, so the class of bug is gone rather than the instance.

That this surfaced within minutes of the harness existing, in code nobody suspected, is the whole
argument for the harness.

### Fixed — the title screen painted through its own panels

`.panel` is `z-index:12`; `.screen` (the title) is `20`. The Save File panel opened *underneath* the
logo and menu. `#newsPanel` already carried a bespoke `z-index:22` for this exact reason, so
`#savePanel` gets the same — but the more serious half is that the menu behind an open panel stayed
**clickable**: "New Game" (which overwrites the save, behind one `confirm()`) was live behind the
panel whose entire purpose is not losing the save. `syncTitleDim` now dims and disarms the title
menu whenever any panel is up, which fixes What's New too.

### Added — the year-3 perf fixture and budget (`tools/check-perf.mjs`)

V5's largest feature is a persistent decoratable cottage — new drawn and persisted state on the one
map the player stands in every single day — and V6 piles the Loom, the venues and the records on
top. The roadmap's requirement was that those "land against a number, not a hope."

The number, on a synthetic worst case (day 320, plot fully planted at 1,179 crops, décor at the
cap, every animal, all six ladders at 92, ~1.5M gold, every permanent unlocked):

| | measured | ceiling |
|---|---|---|
| `migrateSave` | 0.60 ms | 2 ms |
| save serialize | 0.17 ms | 1 ms |
| save size | 54 KB | 82 KB |
| export + parse | 1.9 ms | 6 ms |
| map generation, all 16 maps | 3.7 ms | 12 ms |
| frame work (in-browser, `perfProbe`) | avg 0.99 ms · p50 0.50 · p95 2.70 | p95 under 8 ms |

Budgets are ceilings with ~3× headroom, not targets: going over is a prompt to look, not an
automatic bug, and `--set` re-records when a cost is understood and accepted. The frame figure is
recorded **with its caveat attached** (driven by hand with `requestAnimationFrame` stubbed, because
the harness browser throttles rAF to ~1 fps; that measures the same work a real frame does, but not
vsync or compositing) — an unlabelled millisecond is not evidence. `perfProbe(seconds)` lives in
`12-game.js`, off by default, one null check per frame when off.

### Added — the unlock-cadence linter (`auditUnlockCadence`, `01-data.js`)

`GAME_DESIGN_PRINCIPLES.md` §4.1 says *"never leave a dead zone."* Nothing enforced it, and the V5
review had to derive the damage **by hand** — and a number nobody can re-derive is a number nobody
checks. This makes the measurement part of the build, reading the same tables the game plays from.

It reproduces the roadmap's hand-measured figures exactly, which is the best evidence both are
right: 85→99 is **45.4%** of a skill's entire 1–99 XP; Mining 50→70 is **19.3%** with nothing in it;
Woodcutting's 52→64 is 10.7%. Dead share per ladder: **Mining 88.5%, Warding 88.5%, Fishing 79.0%,
Woodcutting 59.6%, Farming 41.2%, Cooking 34.6%** — and Warding, the v4 flagship, has **10 unlocks
in total.** Crops and recipes are the two well-laddered skills; V5's content releases are aimed at
the rest, and this table is how we will know they landed.

Deliberately **not** an unconditional `console.warn`, unlike v4.23's `auditRecipeLadder`. A recipe
paying less XP than an earlier one is always a *bug*; a sparse band is *design debt* the roadmap has
already scheduled, and warning about it on every page load would print twenty lines into every
player's console. `?lint` (or `localStorage.hs_lint`) prints it for whoever is looking; the atlas
renders it every release, which is the surface that actually gets read.

### Changed — the docs stop describing a game we no longer ship

`GAME_BALANCE_PRINCIPLES.md` §2.5 and §9 documented **Tom's Demand as live**. It was retired in
v4.9 by owner call — `demandMult()` has been a hardcoded `return 1` ever since. The *player-facing*
half of that drift was caught in v4.32 (the How-to still coached spreading your sales, costing real
time to watch a number that never moves); the *agent-facing* half was not, and a balancing doc that
describes a brake the build no longer has is worse than silence — it invites the next release to
price a good as though something were holding the line.

Re-anchored: §2.5 marks the retirement, keeps the principle and the historical curve for the record,
and replaces the old rule with the one that actually binds — **every new sellable gets its own
faucet arithmetic at spec time, for both the bulk-dumper and the drip-seller, before the code**
(v4.26's Patron hand-nerf is the failure mode on record). §9 states the live rule in one line.
Checklist item 4 rewritten. §10 gains a staleness banner: the appendix is a **v3.18.0 snapshot, 70
version codes old**, with a table of the six things verified to have moved since (seven tool tiers
at `[1,10,20,30,45,70,85]`; Demand retired; v4.23 tree HP; the sixth skill; the Patron's ten
commissions at **954,000g cumulative** — verified against `patronCost` this release, matching the
roadmap's figure exactly; `BAG_CAPS`). A new graveyard entry names the failure mode itself: *the doc
that outlived its mechanic.* Rebuilding the appendix is left as open work, honestly labelled, rather
than half-done here.

`AGENTS.md` gains the checks table (they are the only automation this repo has, and an agent that
doesn't know they exist won't run them), the two non-negotiable Strongbox rules, and v5.0's status.

### Notes

- No balance number moved. No content was added or removed. A save from any version loads exactly
  as it did yesterday — verified across nine eras rather than asserted.
- `tools/lib/load-game.mjs` runs the real game files in a node vm with browser stubs. Nothing in the
  harness mocks game logic, ever: a harness that tests a copy tests nothing.
- Fixtures are committed (~250 KB total) so the checks run offline, without `git archive`, on any
  clone.

## 2026-07-26 — v4.37.0 "The Honest Panel" (code 124, tag `v4.37.0`) — nothing hidden, nothing unreadable, no wrong numbers

### Why this release

Release 2 of the UX audit's train. Five defects, all in the same family: the game had the right
information and put it somewhere the player couldn't get at it — under something else, too dim to
read, or simply wrong.

### Fixed — the Cooking level-up banner was invisible for an entire playthrough

`#banner` was `z-index:8`; `.panel` is `z-index:12`. Both are children of `#stage`, and `#stage`
creates **no stacking context** (verified: no `z-index`, no `transform`, no `filter`, `opacity:1`),
so the banner genuinely painted *behind* any open panel.

For five of the six skills that is an occasional near-miss. For Cooking it is total: `addXP("Cooking", …)`
exists at exactly two sites, `08-actions.js:1289` and `:1304`, and **both are reachable only from
buttons inside the open `cookPanel`, neither of which closes it.** So every Cooking level in the game
happened in silence — no card, no "Unlocked: …", while the other five crafts each got their moment.

`z-index:13` clears `.panel` (12) and stays under `.screen` (20), `#newsPanel` (22), `#fade` (30) and
`#sleepCard` (31). Verified live: cooked to Cooking 3 with the Kitchen open; the banner reads
"⬆ Cooking Lv 3! Unlocked: Bread" above the panel.

### Fixed — every price readout understated what Tom actually pays

`invDetailHtml` and — worse — v4.30's hover tooltip `tipBodyFor`, which is delegated over **every**
`data-icon="item_*"` surface in the game, both printed the raw `ITEM_SELL` figure. The counter pays
`baseUnitPrice()`, which layers Winter ×1.25 on fish, ★Renowned ×1.25 on dishes, and `cookedMult()`
up to ×1.18.

Measured, Winter at Cooking 70:

| item | tooltip said | counter paid |
| --- | --- | --- |
| Cooked Salmon | 336g | **462g** (+37%) |
| Salmon | 240g | 300g |
| Turnip | 35g | 35g |

The understatement fell precisely on the bonuses the player had **earned** — `baseUnitPrice`'s own
comment says the earned band exists to give "a visible reason to have done it", and the
highest-traffic surface in the game was the one hiding it.

Both surfaces now route through `sellPriceNow()`, and `sellPriceTag()` names the reason
("· winter · your cooking") so a number that moved has a stated cause rather than reading as a bug.
The tag's conditions **mirror `baseUnitPrice` exactly** — same three tests, same tables
(`FISH_NAMES`, `RECIPE_NAMES`, the `"Cooked "` prefix) — so it can never claim a premium the price
didn't apply. Verified: all three sample items now match the counter to the gold.

### Fixed — secondary text below readable contrast, and one case at 1.10:1

`--ink-soft:#6b573f` measured **2.34:1** on the panel gradient against WCAG AA's 4.5:1. It carries
`.row .sub` — literally the ingredient list, energy value and sell price of every recipe — plus
`.exline`, `.locked`, `.muted`, `.skillHelp`, `.newsDate`.

**One token could not fix this.** `.sgoal.mast` and `.wmSub` sit on the `--wood-l` (`#6b4e37`)
gradient, where `#6b573f` is **1.10:1** — not dim, invisible. Solved by ramp search: nothing dark
enough to still read as "muted" on the panel clears 4.5:1 on wood. So two tokens:

- `--ink-soft:#a08a68` — **4.84:1** on the panel
- `--ink-soft-wood:#dac8b0` — **4.65:1** on `--wood-l`, for the two wood-gradient users

`#dialog .hint` also stacked `opacity:.75` *and* a `blink` keyframe on top of the worst colour,
dropping to ~1.2:1 for half of every cycle — on the one line that tells you how to advance dialogue.
Opacity dropped; the blink stays, since the blink *is* the affordance.

### Fixed — the message lane clipped the newest row

`#msgLane` clips at `max-height:62%`, and `notePickup` appends at the bottom — so the overflow always
ate the **most recent** line, the one that just happened and the only one being waited on.
`flex-direction:column-reverse` on `#pickups` puts new rows at the top, so the clip falls on the
oldest instead. (The audit's alternative, raising `max-height` to 72%, was rejected: it puts the lane
bottom at 91% and collides with the hotbar at 87%.)

### Fixed — the examine readout covered the tool belt

`#stage.talking #examineBar{ bottom:2.6% }` is the exact offset of `#hotbar`, at a higher z-index.
Deleted rather than re-tuned, because it guarded a state that cannot legally occur: `examine()`
early-returns on `uiBlocking()`, so a readout can never be raised while a dialogue is open.
`showDialog` now clears the bar instead.

### Verified

Banner z 13 > panel 12 and < news 22, with a real Cooking level-up rendered above the open Kitchen.
All three price samples match `baseUnitPrice` to the gold, with correct premium tags. Both contrast
tokens confirmed applied and recomputed against their real backgrounds. `#pickups` computes to
`column-reverse`. The examine bar is hidden by `showDialog`. All 16 files parse; console clean.

---

## 2026-07-26 — v4.36.0 "True Pixels" (code 123, tag `v4.36.0`) — the stage stops lying about its shape

### Why this release

Found by a seven-lens UX audit of v4.31 (46 findings surveyed, 42 surviving an adversarial
verification pass). This was its top-ranked item, and it is worse than a layout nit: it silently
breaks the text layer.

### The bug

`#stage` declared an `aspect-ratio:320/208` and then clamped the derived height with
`max-height:calc(100dvh - 92px)` — **with no matching `max-width`**. Per CSS sizing, a clamp on the
derived axis simply abandons the ratio. So every viewport short enough for the clamp to bind rendered
the entire game horizontally stretched. Measured at 1280×700: **1.7105 against a target of 1.5385**,
`scaleX` 3.25 vs `scaleY` 2.923.

### Why it wasn't only cosmetic

`_textScale` (`05-particles.js:26`) is computed from **width alone**:

```js
_textScale = w / VIEW_W;                        // display px per game px
```

and `flushText` (`:33-35`) applies that one factor to **both** axes:

```js
const sx = (t.screen ? t.wx : t.wx - camX) * S;
const sy = (t.screen ? t.wy : t.wy - camY) * S;   // <-- S is a WIDTH ratio
```

That is correct only while `scaleX === scaleY`. On a stretched stage every string on the `#gtext`
overlay — NPC name tags, `+N XP` and `+Ng` floaters, the HOLD prompts — is positioned with the wrong
vertical scale, and the error grows with depth. Measured at 1280×700, a tag at world y=190 drew at
618px against a correct 555px: **62px low, and past the 608px stage bottom — off-screen entirely.**

So the practical symptom was "name tags and floaters vanish near the bottom of the view on a short
window", and nothing in the text code was wrong. The fix belongs in the CSS.

### The fix

Express the height limit as a **width** term, so the ratio is never the clamped axis:

```css
--chrome:56px;
width:min(1600px, 98vw, calc((100dvh - var(--chrome)) * 320 / 208));
aspect-ratio:320 / 208;
```

`max-height` is gone. This makes `scaleX === scaleY` structurally true at every viewport, which
retires the whole class of `_textScale` bug rather than patching one symptom.

The `@media (max-height:520px)` rule had the same defect (`max-height:96dvh`) and would have
re-broken the ratio on exactly the small screens least able to afford it; both media rules now hand
the height back through `--chrome` instead.

### Changed — the stage is much bigger, and honestly reserved

Two things were shrinking it:

- **The 1040px cap.** At 1440×900 that used **54.2%** of the viewport where far more fit.
- **A 92px chrome reservation** sized for the *two-line* controls strip that v4.32 replaced with one
  line. The strip measures **29px**. The stale figure was costing ~60px of stage height at every size.

Now `--chrome:56px` (29px of strip plus its margin, with headroom) and a 1600px cap. At 1440×900 the
stage is **1298×844 — 84.6% of the viewport**, up from 54.2%. The 1600px cap also happens to land on
exactly **5×** at 2560×1440.

**Deliberately not done:** snapping to integer multiples of 320. The audit floated it and its own
worked example was wrong — 1280×832 does *not* fit inside the old `100dvh - 92px` = 808px at
1440×900, so the suggestion would have silently re-broken the ratio it was meant to sharpen. Scaling
was already non-integer (3.25×) before this release, so nothing regresses by leaving it; a correct
ratio at every size is the larger win and it stands on its own.

### Verified

`#game.getBoundingClientRect()` measured at **seven** viewports — 1440×900, 1280×700, 1366×768,
844×390, 390×844, 2560×1440, 700×560:

| viewport | canvas | ratio | scaleX == scaleY |
| --- | --- | --- | --- |
| 1440×900 | 1298×844 | 1.5385 | ✓ (4.058) |
| 1280×700 | 991×644 | 1.5385 | ✓ (3.096) |
| 1366×768 | 1095×712 | 1.5385 | ✓ |
| 844×390 | 588×382 | 1.5385 | ✓ |
| 390×844 | 382×248 | 1.5385 | ✓ |
| 2560×1440 | 1600×1040 | 1.5385 | ✓ (5.000) |
| 700×560 | 686×446 | 1.5385 | ✓ |

Target is 1.5385 (320/208) at all seven; the pre-fix figure at 1280×700 was 1.7105. Text Y-error at
world y=190 is **0px** at every size (was 62px). No horizontal or vertical body scrollbar anywhere;
`#belowbar` fully on screen wherever it isn't hidden by its own media rule. Screenshot comparison at
1280×700 shows square tiles and an unstretched player sprite where both were visibly wide before.

---

## 2026-07-26 — v4.35.0 "Where You Left It" (code 122, tag `v4.35.0`) — the three lists v4.30 missed

### Why this release

v4.30 fixed insertion-order shuffling in the backpack and stopped there. A grep for
`Object.keys(state.inv)` found **three more player-facing lists** with the identical defect, and the
worst of them is the one where it bites hardest.

The mechanism, unchanged from v4.30's write-up: `state.inv` is iterated in key-insertion order, and
`take()` **deletes** a key when it hits zero. So spending the last of something and acquiring it again
moves its row to the bottom of the list — the exact opposite of the fixed-position muscle memory a
list like this is supposed to build.

### Fixed — Tom's sell list

This is the screen where you empty stacks *by definition*. Every visit sold something out, every
harvest put it back, and the list rearranged itself almost every time you opened it. It also carries
index-keyed quantity boxes (`sq_0`, `sq_1`, …), so a reshuffle moves which stepper belongs to which
row between visits.

Sorted **produce first, then everything else, alphabetical within each group**. Produce-first because
the "sell all produce — your materials stay put" button sits directly above the rows, and the list
should agree with the affordance it's under: what you came to sell is at the top, and the materials
that button deliberately protects are visibly separate below.

### Fixed — the machine loader and the gift picker

Same defect, same shifting order. Loading a keg empties a crop stack; gifting is a daily habit aimed
at a tile you remember. Both sorted alphabetically.

### Verified

Built a deliberately scrambled insertion order (`Wood, Salmon, Stone, Turnip, Iron Ore, Carrot,
Copper Ore, Trout, Potato`), rendered the sell list, then **sold out of two different items and
re-earned them** — the precise motion that used to move a row — and re-rendered:

```
before: Carrot Potato Salmon Trout Turnip | Copper Ore Iron Ore Stone Wood
after:  Carrot Potato Salmon Trout Turnip | Copper Ore Iron Ore Stone Wood
```

Byte-identical, produce grouped ahead of materials, alphabetical within each. Machine loader and gift
picker each confirmed sorted against their own scrambled inputs. All 16 files parse; console clean.

---

## 2026-07-26 — v4.34.0 "Said Aloud" (code 121, tag `v4.34.0`) — two things the game changed without mentioning

### Why this release

Both of these were found while verifying v4.33, and both are the same species of bug: the game knows
something the player needs, and doesn't say it.

### Fixed — the belt's sixth slot changed itself in silence

`normalizeSeedSel` (`08-actions.js`) exists to rescue a *dangling* selection: you set down your last
beehive, so `"hive"` no longer resolves in `plantables()`, and the slot has to become something valid.
Correct behaviour — but it happened without a word.

The failure that produces: place your last hive, press USE again on the next patch of open ground, and
you plant a **turnip** where you meant to place another hive. The belt is the one part of the UI the
player treats as fixed — a slot is a slot — and this is the only slot whose contents can change without
being touched. That makes it the one that has to announce itself.

One toast, and the guards matter as much as the message:

- **`gameMode === "play"`** — `beginPlay` and save-loading both normalize before the world is on screen,
  so without this a fresh game would toast at the title.
- **`was !== state.seedSel`** — a no-op call stays silent. `normalizeSeedSel` runs from `refreshHotbar`
  and from `useTool`, so it is called constantly.
- Fires **once** by construction: the selection is valid after the first call, so every later call takes
  the early return.

The message names what the slot holds *now* rather than what ran out, because that is the actionable half.

### Fixed — the noticeboard's chest blindness

v4.33 taught every materials list to mention the cottage chest; the noticeboard tracker card was still
reading `state.inv` alone. Carry 2 of 3 Field Salad with 9 more in the chest and it read a flat `(2/3)`
— a request that looks out of reach while the goods sit at home. It now adds `▸ 9 in your cottage chest`,
and **only when you're short**: once you have enough the line would be pure noise, so it's suppressed.

### Verified

- Silent on boot, silent on a no-op call, silent while the selection is still valid; announces exactly
  once on a genuine run-out, and the slot resolves to a real plantable afterwards.
- Board card checked in all three states — short with a stocked chest, short with an empty one
  (byte-identical to before), and ready (no chest line).
- All 16 files parse; console clean.

---

## 2026-07-26 — v4.33.0 "In the Chest" (code 120, tag `v4.33.0`) — the chest stops looking like a loss

### Why this release

v4.31 promised that a full pack never costs you anything — the overflow goes to the cottage chest and
a toast names it. That promise holds at the moment of pickup. It did **not** hold five minutes later,
because every "do I have the materials?" surface in the game reads `state.inv` and nothing else.

The concrete failure: mine fourteen Iron Ore with a full pack, walk to Tom's, open the shop to buy a
Keg, and read **`4 Iron Ore (0)`** in refusal-red. The ore is not gone. The game simply never mentions
where it is. That is the exact "where did it go?" the carry cap was designed never to cause, arriving
by a different door.

`state.inv` stopped being the whole answer to "do I have this?" in v4.31, and this release finishes
making the rest of the game agree.

### Changed — one material-list renderer instead of five

Five near-identical copies of `N Item (have)` existed: machines, décor and tool upgrades in
`renderShop`, recipes in `renderCooking`, and the charm bench in `renderBells` (`15-warding.js`). They
were already drifting — three rendered `N Item`, one `N× Item`, and the tool row had renamed its loop
variable to `need2` to dodge a shadow, the usual copy-paste tells.

`matList(mats, sep, mul)` replaces all five, and is where the chest annotation lives, so no surface can
be forgotten. Verified byte-identical to the old output when the chest is empty — the annotation is
purely additive, never a restyle of the existing count.

`chestQty(item)` and `chestNote(item)` are the two primitives; `chestNote` returns `""` when the chest
holds none, so appending it costs nothing on the common path.

### Changed — refusals say where the rest is

Every message that tells you that you lack something now checks the chest: the Warden's bench
(`craftWardCharm`), and all three "You don't have one." placements — machine, décor, sapling/hive.
The Ledger's chapter bundle rows likewise, since deep materials are exactly what a full pack sends home.

### Fixed — "Missing ingredients."

`cookRecipe` refused with those two words and nothing else: the problem named, the fix withheld, and
the player left to cross-reference the recipe row by hand. It now names what's short and by how much
("You need 1 more Field Salad and 1 more Carrot.") plus the chest clause. Confirmed the failure path
still consumes nothing — the check runs ahead of every `take`.

### Fixed — the planting board's silent omission

`plantables()` lists saplings, hives, machines and décor from `state.inv` only, so a stored one is not
dimmed on the board — it is **absent**, with nothing to explain the absence. Buying one cannot cause
this (all four purchase paths pass `quiet` and so bypass the cap — checked, not assumed), but storing
one can. The board now names chest-held placeables. `isPlaceableName` builds its set lazily from the
same four tables `plantables()` walks, so it cannot drift out of step with what the board can list.

### Verified

- `matList` output **byte-identical** to the five old renderers with an empty chest; the chest clause
  appears only when the chest actually holds some.
- Chest annotations render in the live shop (buy tab, tools tab) and the kitchen — counted in the
  produced HTML, not eyeballed.
- The cooking refusal names the shortfall and the chest, and **consumes nothing**.
- Placement refusals gain the note when the chest holds one, and read exactly as before when it doesn't.
- The planting board names `Beehive` and `Keg` from the chest while correctly **excluding** 400 Wood
  sitting beside them — `isPlaceableName` spot-checked across all four tables plus two negatives.
- No copies of the old renderer remain (grep for its colour ternary returns zero).
- All 16 files parse; console clean.

### Noted, not fixed

`normalizeSeedSel` silently re-points the belt's last slot when you run out of the selected placeable —
set down your last hive and the slot becomes a crop with no message. Harmless, but it is a state change
the player didn't ask for and isn't told about. Left for the UX audit's ranked pass rather than folded
in here.

---

## 2026-07-26 — v4.32.0 "The Card" (code 119, tag `v4.32.0`) — the game explains itself again

### Why this release

Two problems in the same place, both found by reading the game's own player-facing text against the
code that text describes.

### Fixed — the How-to was teaching a mechanic that had been deleted

`HOWTO_TEXT` (`01-data.js`) contained this paragraph:

> "Tom can only shift so much of one thing a day. Sell forty of the same crop and the price slides;
> bring him variety and it doesn't. Watch the price in his shop before you sell."

**Tom's Demand was retired in v4.9.** `demandMult()` has been `return 1` ever since — a hardcoded
constant. Every unit has fetched full base price for twenty-three releases, and the game's own guide
has spent all of them coaching new players to spread their sales and watch a number that cannot move.

This is worse than saying nothing. It costs the player real time, it makes the shop UI look broken
when the "sliding" price never slides, and it teaches distrust of every other thing the guide says.

Replaced with what the selling loop *actually* rewards — and the replacement was **measured against
live data before it was written**, because swapping one wrong claim for another would be no better.
My first draft said cooked dishes are worth "far more" than their ingredients and that the Cellar's
machines are "worth more again". Measurement refuted both:

| route | multiple over inputs |
| --- | --- |
| Cooking (32 recipes) | median **1.46×**, range 1.29–2.10× |
| Keg | **2.2×** (3 nights) |
| Preserves Jar | 1.6× (2 nights) |
| Cheese Press | 1.5× (1 night) |
| Noticeboard request | **1.4×** the counter, floored at 60g, never worse (`requestPay`) |

So the keg *beats* the median dish, and the press and jar are roughly level with it — "worth more
again" was simply false. The shipped text says cooking is worth about half as much again, that a keg
more than doubles a crop if you can spare three nights, and that the noticeboard pays better than the
counter for the thing you were going to sell anyway.

### Fixed — the How-to never mentioned Warding at all

Zero occurrences of Warding, Undercroft, Resolve or Guard in the entire guide. That is the sixth 1–99
skill, forty-five floors, seven creature families and the whole of Act III's story spine — shipped
across v4.0–v4.5 and never once acknowledged by the game's own explanation of itself. The pack and the
cottage chest (v4.31) were missing too. A how-to that omits two whole systems isn't a how-to; it's an
archive of an older game. Both added, including the part that matters most: **nothing in the Undercroft
can take anything from you.**

### Added — the Controls card, and why touch players had nothing

`#belowbar` was the *only* control reference in the game. Its CSS:

```css
@media (max-width:640px){ #belowbar{ display:none; } }
@media (max-height:520px){ #belowbar{ display:none; } }
```

So on a phone — the exact device whose controls are least guessable — the reference is gone. A touch
player had no way, anywhere in the game, to discover that ☰ hides Eat, Gift and Ride (v4.19's whole
touch-parity fix), or that tapping the last belt slot opens the planting board (v4.29). The features
shipped; the means of finding them did not.

The card renders **per-device from one `CONTROLS` table** (`01-data.js`) — the key column on a
keyboard, the touch column on touch, never both, because a doubled table is exactly the wall of text
this replaces. One table means a binding can no longer exist on one platform's list and not the
other's. Reachable three ways: `?` (and bare `/`), the touch menu's new ❔ entry, and Settings.

### Changed — the strip under the stage

From two lines of twenty-odd bindings to one line of six. It now carries only what's needed in the
first ten seconds plus `?` for the rest. `#belowbar` was costing 92px of vertical space to print a
reference nobody reads twice.

### Verified

- **Every touch instruction on the card was resolved against a real DOM control** — all 18 rows
  checked programmatically against `#touchMenu`'s buttons, `#touchBtns`, `#dpad` and `.pclose`.
  **Zero unresolved.** A controls card that lies is worse than no card, so this is asserted, not assumed.
- One row is deliberately omitted on touch, and that omission is checked rather than accidental:
  Tab/scroll-wheel belt cycling has **no** swipe handler (`refreshHotbar` gives each slot a plain
  `onclick`), and needs none — all six slots are on screen and tappable, which the row above already
  documents. My draft had claimed "swipe across the slots"; reading the handler refuted it before it
  shipped.
- "Hide the HUD" was initially marked unreachable on touch; Settings *does* carry a HUD toggle
  (`setHudOn`), so the card now points there rather than under-reporting a control that exists.
- The economy figures above were measured in the live build, not read off the tables by hand.
- All 16 files parse; keycap styling confirmed applied inside the panel (the `<kbd>` rule was scoped
  to `#controlsHint` only, so the card first rendered its keys as bare text); console clean.

---

## 2026-07-26 — v4.31.0 "The Shelf" (code 118, tag `v4.31.0`) — a carry limit that cannot cost you anything

### Why this release

The last unbuilt piece of the owner's UI brief: *"Feel free to have some sort of better inventory system,
maybe having the limits on inventory system as well and bag upgrades, things like that."* It was
deliberately deferred out of v4.30 and named as deferred, because it is the single most dangerous change
in the whole programme: `give()` has **76 call sites**, several of which are shop purchases that have
already deducted the gold by the time they call it, plus quest rewards, story parcels and boss drops. A
carry cap implemented carelessly is a machine for violating the one inviolable rule — *nothing is ever
taken from the player*.

So the design question was never "how do we limit the bag". It was **"what limit is provably incapable of
costing anything?"**

### Design — two decisions that make it safe

**1. It caps distinct KINDS, never stack sizes.**

The decisive reason is structural: *there is no stack model in this game.* `state.inv` is a flat
`item → count` map, and `give`/`take`/`ITEM_SELL`/`bundlePrice`/`pledgeRemaining`/`sellAllProduce` all do
plain arithmetic on that count. Introducing stacks would mean rewriting every one of those, plus a
migration for every save that ever stored a number — enormous risk for a mechanic the game doesn't need.

The supporting reason is that kinds are *what the owner actually felt*. A bag reads as clutter at forty
different names; it does not read as clutter at 900 Wood. Capping kinds targets the real complaint. So the
fiction is a pack with a limited number of pockets, each holding as much of one thing as you can carry.

**2. `give()` never refuses and never destroys — there is no failure branch to reach.**

This is the entire safety argument, and it is why the change did not require auditing all 76 call sites
individually. When a full pack meets a genuinely new kind out in the world, that kind goes to the **cottage
chest** and a toast names it. It is never dropped, never refused, never silently eaten. It is simply *at
home*. No caller can hit a "you can't have this" path, because none exists.

On top of that, the cap only applies to **world pickups** — the non-`quiet` grants (a swing, a cast, a
harvest). Every deliberate hands-on grant already passes `quiet`: shop purchases, quest rewards, story
parcels, festival prizes. Those land in your hands **even when the pack is over its limit**, because being
charged for a thing and then told to walk home for it is a worse failure than a pack that sits one kind
oversized for an afternoon. Being over cap is legal; it just means you can't pick up new kinds in the field
until you're back under.

Exempt from the count entirely: **tools, the charm you're wearing, and Grandpa's keepsakes**. Equipment is
not cargo, and a charm sitting in a chest while you're on floor 40 is exactly the kind of quiet punishment
this game does not do. All five craftable Warden charms are in `CHARMS`, so they were covered for free —
verified rather than assumed.

### Added — the pack

- `BAG_CAPS = [24, 36, 48]`, `bagCap()`, `bagExempt()`, `bagKindsIn()`, `bagKinds()`, `bagFull()` in
  `08-actions.js`, immediately above `give` so the rule sits next to the function it constrains.
- `state.bagTier` (upgrades bought) and `state.shelf` (`item → qty` at the cottage) in `freshState`.
- **One toast per kind per day** (`shelfNote`). Without it, standing in a full pack and picking five
  Mushrooms fires five identical toasts — a shelved kind never enters `state.inv`, so every subsequent
  pickup takes the overflow path again. Self-resetting on the day number, so it needs no dawn hook.

### Added — the cottage chest, given a second job

Rather than adding a new object the player must be taught about, the **existing** cottage chest — the one
that held Grandpa's second letter — becomes the shelf once that letter is out of it. A cozy piece of
furniture that had exactly one moment in the whole game now has a permanent reason to be opened.

The panel is two-sided, laid out like Stardew's: **what's in the chest** above, **what's in your pack**
below, one click to move a whole stack either way. Whole stacks only — a pocket is the unit the cap counts,
so moving 3 of your 40 Wood frees nothing and would read as a click that did nothing.

This is not decoration. A carry limit is only *fair* if the player can choose what rides along; without the
"store" side, a pack full of unsellable materials would be a soft lock on the chest.

**A shelf with anything on it always opens**, even mid-prologue, ahead of the quest gate. A pack that fills
early can never be locked behind a story beat the player hasn't reached.

### Added — bag upgrades, and the gold sink the economy was missing

Tom sells **2,500g → 36 kinds** and **12,000g → 48 kinds**. Placed on his general shelf rather than in the
Tools tab, because it is not a tool upgrade: no skill gate, no materials, pure coin. That is precisely what
makes it useful as an **early-to-mid gold sink** — 2,500g is a real ask at the moment the bag first feels
tight, and 12,000g lands where crop income starts outrunning anything else to spend it on. The tier is
stored, not the capacity, so a future rebalance of `BAG_CAPS` can never shrink a save.

### Changed — two call sites corrected

The audit of non-`quiet` `give()` calls turned up two that were mislabelled:

- **`buySalvage` (`15-warding.js`)** — `state.gold -= o.price; give(o.item, o.qty)`. The gold was already
  gone by that line. A purchase that charged you and then posted the goods to your cottage is the worst
  possible version of this feature. Now `quiet`.
- **Pip's amethyst and shell (`14-story.js`)** — gifts pressed into your hand in a cutscene. Now `quiet`;
  a child handing you her shiniest treasure does not put it in a chest across the valley.

`craftWardCharm` was checked and left alone: all five outputs are in `CHARMS`, hence already exempt.

### Changed — the limit is always visible

A carry limit the player cannot see is an ambush. The backpack now opens with
`Pack 17/24 kinds`, turning amber and naming **both** ways out when full — a roomier pack, or the chest —
rather than only reporting the problem. An emptied bag whose chest is loaded says so explicitly, because
"Empty. The valley provides" after storing everything reads as *having lost it*, which is the one
impression this entire feature exists to prevent.

### Compatibility — grandfathering, and why it runs where it does

A player eighty days in may carry far more kinds than the new starting pack holds, and the contract is
absolute: **a rule added today may never cost them anything they already have.** So `state.bagBonus` is set
**once**, at migration, to however much their current load exceeds the cap by, **plus four pockets of
headroom** so an old save doesn't start shelving its very next mushroom. It rides on top of `BAG_CAPS`
permanently.

It must run **before** `migrateSave`'s generic backfill, or `freshState`'s `bagBonus: 0` lands first and the
whole clause becomes dead code — the identical trap already documented twice in that function (the v2.6.1
Collection-seeding bug and the v2.7 XP-curve conversion). Guarded on `=== undefined`, so it is granted once
and never re-inflated on subsequent loads; a recomputing bonus would grow every time a player filled their
bag and quietly make the cap meaningless.

### Verified

Measured in-browser, not reasoned about:

- **Conservation under 5,000 randomized operations** — 85 distinct items, mixed quiet/non-quiet gives,
  random takes, stores, take-alls and bag upgrades interleaved. **Zero units lost, zero duplicated, zero
  orphan keys.** This is the proof that `give()` cannot destroy.
- The six contract cases: non-quiet new kind → chest; quiet new kind → hand, over cap; non-quiet *existing*
  kind → merges; exempt items never shelved; a shelved kind keeps accumulating; the Collection still
  records shelved finds.
- **Grandfathering at 5 / 24 / 25 / 40 / 70 kinds** — every save keeps every kind, always with exactly 4
  pockets to spare; exempt gear correctly not counted; `bagBonus` not re-inflated across a save/load
  round-trip.
- The real in-world path: full pack, mine an actual rock with the actual `useTool` — Stone lands in the
  chest, the toast names it, the Collection records it, the pack stays at 24. Free a pocket, and the next
  Stone lands in the bag.
- Toast dedupe: one per item per day, resetting each dawn.
- All four `openChest` branches (prologue-gated, prologue-with-overflow, letter-pending, post-letter).
- Shop: correct prices, no charge at max tier, no charge when broke.
- Chest round-trip: take → store → take-all, lossless; take-all at a full pack moves only what fits and
  conserves the total.
- All 16 files parse; console clean.

### Still queued from the UI brief

"One Menu" (merging the four panels behind tabs), the design-token pass, and `#belowbar`'s wall of
keybindings — which is `display:none` on phones, leaving touch players with no control reference at all.

---

## 2026-07-26 — v4.30.0 "The Pack" (code 117, tag `v4.30.0`) — the backpack stops fighting you

### Why this release

The backpack half of the owner's inventory brief. v4.29 fixed the *placeable* slot; this fixes the bag
itself. All three defects were measured by the UI audit and are felt on ordinary use.

### Added — hover tooltips

`invDetailHtml` **already assembled precisely Stardew's tooltip body** — name, ×count, `Ng each`,
`+N energy`, the charm effect, the italic `EXAMINE` flavour line — and gated the whole thing behind a
click plus a full `innerHTML` rebuild of the bag. Meanwhile every item surface in the game already carries
`data-icon`: bag tiles, shop rows, machine rows, gift rows, collection tiles.

- One `#tip` div, one **delegated** `mouseover` on `#stage`, keyed off `data-icon` starting `item_` — so it
  covers every one of those surfaces, present and future, without touching their render functions. Skill
  and tool icons are excluded (they aren't items).
- Positioned above the hovered tile and **clamped inside the stage**, flipping below when there's no room —
  a tile near an edge can never push the tip off-screen.
- Hidden on `mousedown` so a panel closing under the cursor can't strand it.
- `IS_TOUCH` returns early: tap-to-select is the right verb on touch, and a hover tip would never show.

### Fixed — the bag lost your scroll position on every click

`selectInvItem` calls `renderInv`, which rewrites the whole body — so clicking any tile in a scrolled bag
snapped you to the top, and you had to scroll back down to read what you'd just tapped. Scroll position is
now captured and restored across the rebuild.

### Fixed — tiles jumped around

Tiles were laid out in `Object.keys(state.inv)` **insertion order**, and `take()` deletes a key at zero —
so spending the last of something and re-earning it moved its tile to the *end* of its section. That is
the exact opposite of the fixed-slot muscle memory a bag exists to build. Each section is now sorted by
name.

### Verification (live build, console clean)

Spending Turnip to zero and re-earning it leaves the tile order **byte-identical**. `scrollTop` 40 survives
a tile click. Tooltip bodies assemble correctly for a fish (`Salmon ×3 · 240g · flavour`) and a charm
(`Wren Feather Charm ×1 · 120g · +5% Woodcutting XP while worn · flavour`); screenshotted rendering above
the tile with the position clamped inside the stage.

### Files

- `game/js/10-ui.js` — `tipBodyFor()` / `wireTooltips()`; `renderInv` scroll preservation + per-section sort.
- `game/js/12-game.js` — `wireTooltips()` at boot.
- `game/index.html` — `#tip`.
- `game/css/style.css` — `#tip` styling.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=158`.

### Still queued — the carry cap

The one part of the owner's inventory ask still unbuilt, and deliberately so: it is the riskiest change in
the UI programme and wants its own session. The design is settled (audit-endorsed, contract-checked):
**cap distinct KINDS, never stacks** — there is no stack model and inventing one would break
`give`/`take`/`ITEM_SELL`/`bundlePrice`/`pledgeRemaining` arithmetic everywhere; **`give()` must never
refuse and never destroy** across its 76 call sites, several of which are shop purchases with gold already
deducted, plus quest rewards, story parcels and boss drops; a new kind arriving at a full pack goes to a
**farmhouse shelf** with a toast naming it, and tools, the worn charm and story keepsakes are exempt.
Bag upgrades then become the early-to-mid gold sink: 24 kinds at start, 2,500g → 36, 12,000g → 48.

---

## 2026-07-26 — v4.29.0 "What to Plant" (code 116, tag `v4.29.0`) — the miscellaneous slot stops being a soup

### Why this release

Direct owner playtest during the UI rework (verbatim in `DEVLOG.md`): *"there's an inventory slot for
every tool, but the miscellaneous slot — I just have to cycle through a thousand options. Different seeds
that I don't even know if it's in season… all the trees are there, all the seeds are there, all of the
miscellaneous items you can place down are there. It doesn't seem natural."*

Three correct observations, and the diagnosis in the last line is right: **one slot is doing four jobs.**
Every other hotbar slot holds one tool; the sixth held a category soup of seeds, saplings, hives, machines
and décor, reachable only by pressing R until the right thing came round.

### Fixed — the ring was padded with things you cannot use

Measured: `plantables()` filtered crops by **level only, with no stock check** — while saplings, machines
and décor all required you to be carrying one. At Farming 99 the ring therefore held **all 23 crops**
regardless of whether you owned a single seed, plus up to 22 décor pieces. Turnip → Everbloom was thirty-odd
presses, each firing a toast and a menu sound.

- Crops are now filtered by **stock AND season**. Out-of-season crops can't be planted at all (`useTool`
  refuses with "only grows in X"), so leaving them in the ring meant cycling onto a selection the game
  would never accept. **Measured: a realistic Spring bag takes the ring from 23 entries to 6.**
- `plantables(true)` returns the unfiltered list, used for validation and as the never-empty fallback.

### Added — the picker board

Cycling is the wrong primary verb for a fifty-item list; a list you pick *from* should be looked at.

- New `#seedPanel` / `renderSeedPicker()`: a grid grouped into **🌱 Seeds · 🌳 Orchard & Apiary · ⚙ Workshop
  · ✿ Décor**, each cell showing the icon, the name, how many you carry, and — for seeds — either
  **"in season"** or the season it actually belongs to.
- In-season seeds sort first. Out-of-season ones are **dimmed but still choosable**: buying ahead for next
  season is a real thing to want, and the picker is a deliberate act where the ring was an accidental one.
- Opened by tapping the Seeds slot when it's already selected, or **Shift+R**; plain **R** still cycles
  (now a short, useful ring) and opens the picker when there's nothing to cycle to.

### Fixed — a deliberate off-season pick was silently reverted

`normalizeSeedSel()` validated against the *filtered* ring, so choosing a dimmed Starfruit in Spring got
clobbered back to Turnip the instant the hotbar redrew. That function exists to rescue a **dangling**
selection (you planted your last sapling, so the id no longer resolves) — not to enforce season or stock.
It now validates against `plantables(true)`. Season stays enforced at plant time, where the refusal names
the season.

### Verification (live build, console clean)

Ring 23 → **6** on a realistic Spring bag (turnip, potato, rhubarb, sap:apple, mach:keg, decor:flowerbed).
Picker renders all four groups with icons painted, 2 of 8 cells dimmed for season, and "in season" shown.
Picking sets the selection, focuses the slot and closes. **An off-season pick survives a hotbar redraw**,
still refuses to plant, and spends no seed; a **dangling** selection is still rescued (last Apple Tree
planted → falls back to turnip). Screenshotted the board.

### Files

- `game/js/08-actions.js` — `plantables(all)` stock+season filter; `normalizeSeedSel` validates against the full list; `selectPlantable` likewise.
- `game/js/10-ui.js` — `openSeedPicker` / `renderSeedPicker` / `pickPlantable`; Seeds-tile click; R and Shift+R.
- `game/index.html` — `#seedPanel`.
- `game/css/style.css` — `.seedGrid` / `.seedCell` (+ `.dim`, `.sel`).
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=156`.

### Still queued — "The Pack"

The owner asked for a full inventory overhaul; this release fixes the *placeable* half. Remaining: the
backpack itself (item positions derive from `Object.keys` insertion order, so a re-earned item jumps to
the end of its section, and `renderInv` resets scroll on every click), hover tooltips (`invDetailHtml`
already assembles exactly Stardew's tooltip body but gates it behind a click and a full innerHTML
rebuild), and the loss-proof carry cap with bag upgrades — cap distinct **kinds**, never stacks; `give()`
must never refuse and never destroy across its 76 call sites, several of which are purchases with gold
already deducted; overflow goes to a farmhouse shelf.

---

## 2026-07-26 — v4.28.0 "Two Anchors" (code 115, tag `v4.28.0`) — the UI stops overlapping itself, and the cursor stops lying

### Why this release

The second half of the owner's UI brief — *"it's all over the place. It's not nice."* v4.27 fixed the
controls; this fixes the **layout defects the audit could measure**, plus three corrections to v4.27
itself that the audit found by reading my uncommitted working tree.

### Fixed — two notification columns collided, and the newer one lost

`#toasts` (top:19%, **no z-index**) and `#pickups` (top:32%, **z-index:6**) were separately-positioned
columns on the same left edge, both growing downward. Measured at 1040×676: a 5-toast stack ran
y=128→274 while a 4-row pickup log ran y=216→432 — **57px of overlap** — and because pickups declared a
z-index and toasts didn't, **the newer, more urgent message painted underneath the older one.** With 191
`toast()` call sites and `notePickup()` firing on every item gained, a normal harvest run turned the left
third of the screen into a churning double column.

- Both now live inside one `#msgLane` flex column. Overlap is **structurally impossible** rather than a
  matter of tuned offsets — the fix that survives the next element someone adds. Verified 0px.

### Fixed — the dialogue box and examine bar were drawn on top of the hotbar

Measured: the dialogue box occupied y=474→615 against a hotbar at y=590→658 — **24.6px of overlap** at
z-index 9 vs 6, so **every conversation buried the top of every tool tile, all six key-number badges and
the tool-name label.** The examine bar was worse: it sat exactly on `.slotName`, so pressing Q to look at
something hid the name of the thing in your hand.

- New `--belt-h` token (4.2em = the tiles plus their name label). `#dialog` and `#examineBar` now offset
  from `calc(2.6% + var(--belt-h))` instead of guessing a percentage. Verified **0px** against both.
- I deliberately did **not** take the audit's suggestion to fade the hotbar out during dialogue. Once the
  box is seated above the belt the overlap is gone by construction, so fading would be motion for its own
  sake. The `.talking` class is kept only because the examine bar still wants the lower slot while a
  dialogue owns the upper one — and it is cleared in `closeDialog`, `closeAllPanels` and `beginPlay` so it
  can never strand the belt.

### Fixed — three defects in v4.27, caught by the audit reading the working tree

1. **The facing cursor lied.** It called `toolActValid`, which tests only the *held* tool — so with the
   Can in hand facing a tree it drew white ("nothing will happen here") and then smart-use chopped the
   tree anyway. It now previews smart-use and tints **gold** when the swing will reach for another tool.
2. **The wheel stole scrolling from letters.** `uiBlocking()` is `dlg.open || anyPanelOpen() ||
   _panoClose` — it does **not** cover the `#intro` overlay, which `openLetter` uses for every letter,
   journal page and epilogue. So the longest documents in the game were the hardest to scroll. New shared
   `inputBusy()` covers panels, dialogue, cutscenes **and** the letter overlay; the wheel and Tab both
   gate on it. Tab also now guards **before** `preventDefault`, which was killing keyboard focus
   navigation inside panels.
3. **Smart-use stood down exactly where it was needed most.** The "exactly one valid tool" rule bailed on
   empty tilled soil, because both the Can and Seeds match there — and that tile is the till → water →
   plant loop, i.e. most of the presses in a farming game. Replaced with a fixed preference order
   `["Axe","Pick","Rod","Hoe","Can"]`. Bare tilled soil now reaches for the **Can** (free, reversible,
   almost always what you want); **Seeds remain absent from the order entirely**, so watered soil — where
   Seeds is the only match — still stands down and planting is never inferred.

### Verification (live build, console clean)

Measured with `getBoundingClientRect` the same way the audit found the defects: toasts vs pickups **0px**,
dialogue vs hotbar **0px**, examine vs hotbar **0px**; `.talking` sets and clears correctly. Smart tool:
tree→Axe, ore→Pick, water→Rod, bare tilled→Can, **watered soil spends 0 seeds and plants 0 crops**;
explicit planting still works; opt-out respected. Screenshotted a live conversation with a full hotbar —
every slot number and the tool name stay legible.

### Files

- `game/index.html` — `#msgLane` wrapper.
- `game/css/style.css` — `--belt-h`; `#msgLane`; `#toasts`/`#pickups` de-positioned; `#dialog`/`#examineBar` offsets.
- `game/js/07-entities.js` — the honest, smart-use-previewing facing cursor.
- `game/js/08-actions.js` — `SMART_ORDER` preference-order `smartTool`.
- `game/js/10-ui.js` — `inputBusy()`; wheel/Tab gating; `.talking` on show/close dialogue; `closeAllPanels` guard.
- `game/js/11-title.js` — `beginPlay` clears a stale `.talking`.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=153`.

### Still queued from the UI audit

**"One Menu"** — 13 separate top-level panels on four different keys, where Stardew has one tabbed menu;
`panelTabs()` already exists and the Journal/Shop use it, so the merge is mostly routing. **"The Pack"** —
the inventory rework: 52 plantables behind one hotbar slot cycled by R (up to 52 keypresses to plant a
given crop), `renderInv` resetting scroll on every click, no hover tooltips despite `invDetailHtml`
already assembling exactly Stardew's tooltip body, and the loss-proof carry cap (cap distinct KINDS, never
stacks; `give()` never refuses and never destroys; overflow goes to a farmhouse shelf). **Design tokens** —
16 border-radius values, 12 border widths and 19 ad-hoc card fills across the stylesheet.

---

## 2026-07-26 — v4.27.0 "In Reach" (code 114, tag `v4.27.0`) — the controls stop fighting you

### Why this release

Owner playtest, near-verbatim: *"It's not the most comfortable UI, especially the controls… this is just
way too tedious. I have to click on tools… It's all over the place."* They asked for a Stardew-benchmarked
rework, and explicitly invited an inventory overhaul with limits and bag upgrades.

I ran a 5-lens UI audit against Stardew (controls / layout / inventory / panels / benchmark) — its full
findings are the roadmap below. **This release is the controls only**, because that is what the owner
named first and it is felt every few seconds. The layout consolidation and the inventory rework are
sequenced after it.

### Added — hold to repeat (the deepest tedium)

The audit's sharpest catch, and it is not a UI problem at all — it is an *input* problem hiding as one.
`10-ui.js` swallows OS auto-repeat (`if(e.repeat){ keys[k]=true; return; }`) and `useTool` has no
cooldown, so **every swing was a discrete press and mashing was optimal**. With `TIER_POWER` starting at 1,
a starter Axe on a Heartwood (hp 24) is **24 presses**, a Gold Vein is 12, and **The Great Knot (hp 42) is
42 mashes of Space mid-fight.** v4.24 swept the *field* verbs and left woodcutting, mining and all of
Warding as pure mashing.

- New `updateUseHold(dt)` (`08-actions.js`), called from the main loop (`12-game.js`): holding USE
  (keyboard Space, mouse, or the touch USE button) repeats the swing every `USE_REPEAT = 0.28s`.
- **Paced to the swing animation (0.26s), deliberately not faster** — holding is exactly as fast as
  flawless mashing and never faster, so this removes the wrist-ache without moving a single rate the
  balance work of v4.23-v4.26 depends on.
- **Fishing is excluded outright**: it already reads held Space as "reel", and that *is* a skill input.
  Verified a held Space during a reel changes nothing.

### Added — the mouse wheel (and Tab)

Stardew's single most-used input, and this game **had no wheel handler anywhere** — verified by grep; the
only `deltaY` in the repo was art code. The only ways to switch were the number row (which pulls your hand
off WASD) or clicking the tile, which is exactly the "I have to click on tools" complaint.

- `cycleSlot(dir)` + a `wheel` listener; `Tab` / `Shift+Tab` do the same from the keyboard.
- **Delta-accumulated, one step per event maximum.** This mattered: my first cut stepped per raw event,
  which the audit caught — a macOS trackpad emits a burst of small deltas per flick, so one gesture would
  have spun through the whole hotbar with dozens of overlapping `select` oscillators and dozens of full
  hotbar DOM rebuilds. Now a mouse notch (deltaY ~100) is exactly **one** step, a 20-event trackpad flick
  is **one** step, and the accumulator resets on a direction change and after a 250ms pause so a stale
  remainder can never make the next gesture step early.

### Added — smart tool select

Choosing a tool has no timing and no skill element — you always already know a tree wants the axe. By the
repo's own yardstick (v4.11: *"harvest has no timing/skill element, so this removes friction, not
challenge"*) that makes manual switching pure friction.

- `smartTool(tx, ty)` (`08-actions.js`): if what you're facing has **exactly one** valid tool and the tool
  in your hand would do **nothing**, USE picks it up and swings.
- `toolActValid` generalized to `toolValidFor(tool, fx, fy)` (`07-entities.js`) as the shared oracle.
- **It never overrides a deliberate choice** — it only fires when the held tool has no action at all.
- **Ambiguity means hands off.** Bare tilled soil is valid for both the Can and Seeds; watering vs planting
  is a genuine decision, so smart-use stands down and leaves it to you.
- **Opt-out in Settings** ("Pick tools for me"), stored as `state.flags.noSmartTool` so the default needs
  no migration.

**A defect the audit caught in my own first cut, worth recording:** on `T.WATERED` soil, *only* Seeds is
valid — so the "exactly one" rule resolved uniquely to **planting**, and a press meant as an axe swing
would silently spend seed and, at Can tier 3, sow **nine tiles** via the v4.24 sweep. There is no un-plant
verb anywhere in the game, and an endgame seed is 900g. Seeds are now excluded from inference entirely:
they only ever go in the ground because you said so. My own first test had asserted that behaviour as
*correct*, which is precisely why the adversarial pass exists.

**A second, quieter fix it forced:** `toolValidFor` for the Can and Seeds tested the *tile* alone, so a
tree standing on tilled soil reported the watering can as valid. Harmless when it only tinted the cursor —
but smart-use reads this oracle to count valid tools, and a phantom second answer made it stand down
exactly when it should help. Both now also require the tile to be clear.

### Verification (live build, console clean)

Smart tool: tree-with-Can → Axe, ore-with-Axe → Pick, water-with-Hoe → Rod, grass-with-Pick → Hoe;
bare tilled soil with the Axe held stays **Axe** (ambiguous); a deliberate valid pick is never overridden;
**watered soil with the Axe held spends 0 seeds and plants 0 crops**; explicit planting still works; the
Settings opt-out is respected. Wheel: 1 notch = 1 step, 3 notches = 3, a 20-event trackpad flick = 1 step,
reverse answers immediately. Hold: a Basic axe fells a 24-HP Heartwood in ~6.8 simulated seconds at the
0.28s cadence; a held Space during a fishing reel changes nothing.

### Files

- `game/js/08-actions.js` — `smartTool()`, `updateUseHold()`, the `useTool` smart-select hook.
- `game/js/07-entities.js` — `toolValidFor()` generalized; Can/Seeds now require a clear tile.
- `game/js/10-ui.js` — wheel handler with accumulation, `cycleSlot()`, Tab binding, Settings toggle.
- `game/js/12-game.js` — `updateUseHold(dt)` in the loop.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=150`.

### The rest of the UI roadmap (from the same audit)

- **"Two Anchors"** — the HUD has **six** anchors where Stardew has two, and three of them overlap in
  normal play (measured at 1040×676: a 5-toast stack collides with the pickup log for 57px, and `#toasts`
  has no z-index while `#pickups` has 6, so *newer* messages paint *under* older ones; the dialogue box
  covers the top 24.6px of the hotbar including every key badge; the examine bar sits exactly on the tool
  name; in the Undercroft the first toast lands on the Resolve bar). Plus 16 border-radius values, 12
  border widths and 19 ad-hoc rgba fills — no single design language.
- **"One Menu"** — 13 separate top-level panels on their own keys, where Stardew has one tabbed menu.
- **"The Pack"** — the inventory rework. The audit's verdict on limits, which I endorse: **cap the number
  of distinct KINDS carried, never stacks**; `give()` must **never refuse and never destroy** (76 call
  sites include shop purchases with gold already deducted, quest rewards, story parcels and boss drops);
  a new kind arriving at a full pack goes to the farmhouse trunk with a toast naming it. Also: 52
  plantables sit behind one hotbar slot cycled by R — up to 52 keypresses to plant a specific crop — and
  `renderInv` resets scroll position on every click.

---

## 2026-07-25 — v4.26.0 "The Patron" (code 113, tag `v4.26.0`) — gold reacquires a referent, and the runaway faucet comes back to the pack

### Why this release

The deepest economic finding of the fun-and-pacing audit, and the one I deliberately held until after
v4.23 so ★ Renowned's newly-reachable +25% dish premium was on the table before retuning income.

**Every gold sink in the game was one-time and finite** (~426k of gold-only content) while **one faucet was
uncapped**. I measured the faucet myself rather than trusting the audit: simulating `hookFish`'s actual
index-weighted pick over the live coast pool at Fishing 85 gives ~915g raw per cast (~988 at night), so a
40-cast day — the clock, not energy, is the real limit — cleared **~64,000 g/day cooked** against a
60-tile Everbloom field's 4,000. Gold stopped meaning anything around **day 45-60**, with ~200 days of
intended play left.

**The structure of this release is the point: the sink lands in the same release as the cut.** A faucet
trim on its own is felt as "slower" and gets reverted; a trim next to somewhere new to spend is felt as
the economy finally having a shape.

### Added — the Patron's Commissions (the first uncapped repeatable gold sink)

A **fourth prefix on the pledge system**, deliberately not a `PROJECTS` entry: `fundProject` is atomic (no
partial deposits), its done-ness is a permanent boolean, `PROJECT_BY_ID` is built once at load so a
runtime-appended entry would be dead on click, and an endless PROJECTS tier would permanently delete the
"every page of the ledger is struck through" completion beat. As a pledge it inherits partial deposits,
the Journal's Restorations UI and the no-wasted-trip rule for free.

- **`patronCost(n)` = 30,000 + 12,000(n−1) + 400(n−1)²** — linear-plus-mild-quadratic, the shape the owner
  already signed off on for the lift. n=1: 30,000 · n=5: 84,400 · n=10: 170,400 · n=20: 402,400 · n=40:
  1,106,400. **An exponential curve is explicitly rejected**: DEVLOG records the owner near-verbatim —
  *"the restorations get so insane… it's just too expensive, coins-wise"* — and the shipped fix was linear.
- **Flat material ask, rotating on `n % 6`** (20 Elder Wood · 12 Heartwood Beam · 8 Silverwood Beam ·
  10 Deepgnarl · 6 Gloamstar · 2 Starstone). Never escalating: an escalating ask makes the MATERIAL the
  binding constraint, which is exactly the defect that makes the tool ladder useless as a coin sink.
- **`pledgeDone` = `patronTier >= n`; `pledgeDiscovered` = `patronTier >= n−1`** — derived, so **zero
  migration**, and the ledger shows exactly **one open commission at a time** rather than an infinite list.
  Appears once three wings are lit (or the tier is already above zero).
- **Ten named civic works, then a generated tail** — authoring stops at ten, the sink does not.

**The two implementation traps, both handled:**
1. **Only `state.farm` persists** — village/coast regenerate daily from `mapCache`, so a fixture placed at
   runtime would silently vanish overnight. Fixtures are stamped at **map-generation time gated on
   `state.patronTier`**, the same rule `applyProjects` and the wing dressing already follow. Funding also
   calls `clearMapCache()` so the change shows *now*, not tomorrow.
2. **Lanterns are light sources** feeding `collectLights` into `drawLighting`'s additive pass, and the
   square can already hold up to a dozen (mining 2 + hearth 4 + lantern-test 2 + boardwalk 4). Only two of
   the ten rungs add light, and both **yield entirely once the square is already bright** — verified: at
   full tier the village holds 8 lights, under the budget. All fixtures reuse **existing sprites**; a
   commission tier should not need new pixels.

**No stat reward, deliberately** — v4.21 drew that line in code ("a cape is a flex, never a stat"). The
fixture, the name and the visibly warmer square are the reward.

### Balance — the deep-water faucet

- **Deep fish re-seated** (sell only): Moonperch 780→620, Glassperch 1000→760, Silvergill 1080→800, Gulf
  Sturgeon 1300→980, Coelacanth 1800→1200. **Nothing at or below the Golden Koi (620) moves**, so the
  entire early and middle loop is untouched. Anchor: the top fish must not out-value the top crop
  (Everbloom 1500, a nine-day cycle) for an eight-second action.
- **The grilled premium 1.75 → 1.40 base, plus an EARNED Cooking band** (`cookedMult()`, guarded on the
  `"Cooked "` prefix so raw fish and the legend trophies are untouched, and dishes can't double-dip with
  ★ Renowned): ×1.00/1.05/1.10/1.18 at Cooking 1/40/70/99 → net **1.40 / 1.47 / 1.54 / 1.65**. Every rung
  sits under the old flat 1.75, so this is a genuine trim *and* Cooking 99 becomes a visible reward.
- **Measured result: ~64,000 → ~38,700 g/day** at Cooking 1, rising to ~46,000 at Cooking 99. Fishing is
  still the best living in the game (~10× the farm rather than ~16×), which is the right answer for a
  skill you deliberately specialise into.
- **I did NOT charge energy on the cast**, which the audit also flagged as a hazard rather than a fix: the
  binding constraint has always been the clock (~40 casts) not energy (100 casts), so it is inert below
  Fishing 85 — and worse, `spendEnergy` returns false at 0 while `landFish` sets `caught_<id>` *before*
  `give()`, so a legend could be consumed forever with no item. That is the exact bug class v4.15 shipped
  a fix for. Recorded here so it is not re-proposed.

### Polish

- `goldUI` now renders with thousands separators — a seven-figure purse was an unreadable run of digits.

### Verification (live build, console clean)

Cost curve and rotating asks correct at n=1/2/5/10/20/40. Commissions hidden before three wings, exactly
one open at a time, `patronTier` advancing on completion (30,000g + 20 Elder Wood taken, tier 0→1), done/
discovered derived correctly. Village gains 17 objects at tier 10 with lights capped at 8; screenshotted
the commissioned square. `cookedMult` returns 1.00/1.05/1.10/1.18 at 1/40/70/99; low-tier fish unmoved;
40-cast day simulated at 38,733 / 42,785 / 45,954 g by Cooking level. Gold pill reads "1,500,000".

### Files

- `game/js/01-data.js` — `patronCost`/`PATRON_MATS`/`PATRON_WORKS`/`patronName`, the four pledge hooks, `ledgerPledges`, fish re-seat, `GRILL_MULT`; VERSION + in-game CHANGELOG.
- `game/js/13-content.js` — the village fixture stamping + light budget.
- `game/js/10-ui.js` — `completePledge` patron branch; gold separators.
- `game/js/08-actions.js` — `cookedMult()` + its use in `baseUnitPrice`.
- `game/js/04-world.js` — `patronTier` in `freshState`.
- `game/index.html` — cache-buster `?v=144`.

### Follow-up owed

`GAME_BALANCE_PRINCIPLES.md` §2.5 still documents Tom's Demand as a live saturation brake; it was retired
in v4.9 and `demandMult` is now a hard `return 1`. Every faucet figure in that doc understates current
income. It should be re-anchored to measured numbers before anyone tunes against it again.

---

## 2026-07-25 — v4.25.0 "The Long Sight" (code 112, tag `v4.25.0`) — the day gets a shape at both ends

### Why this release

Release #4 from the fun-and-pacing audit, taken ahead of "The Patron" because it is cheap, wholly
additive, and **contains a live defect that has been silently degrading the game's own signposting**.

### Fixed — the wake card was hiding its most important lines

The `#scList li` CSS animation is `.5s`, the card hid at **2700ms**, and lines were staggered at a flat
`i*0.28 + 0.3`. So line index *i* finished at `i*0.28 + 0.8`:

| lines | last line finishes | card hid at | result |
|---|---|---|---|
| 7 (quiet morning) | 2.48s | 2.7s | fine |
| 10 | **3.32s** | 2.7s | never shown |
| 12 (busy morning) | **3.88s** | 2.7s | never shown |

Index 9 and beyond **never started animating at all** (they sat at `opacity:0`), and index 8 reached only
~32%. Because the list is built in a fixed order, the lines that fell off the end were always the last
ones pushed: **the forecast, the calendar nudge, and the v4.16 story-tracker line.** "The morning names
the mission" was broken on exactly the mornings that had the most to say.

- Fix: `const step = Math.min(0.28, 1.7 / Math.max(1, lines.length - 1))` — caps the whole ramp at 1.7s,
  so the last line always finishes by ~2.5s for **any** line count. **Pixel-identical on today's quiet
  7-line morning** (6 × 0.28 = 1.68 < 1.7, so the step stays 0.28). Verified at 7/10/12/15/20 lines.

### Added — the card is skippable, and says something new

- Click, Space, Enter or E dismisses it. This **must** latch, and does: the global keydown has no
  `sleeping` branch and dispatches `"e"` to `interact()`, whose `case "bed"` guards only on `sleeping` —
  which the dismissal has just set false. Without the latch (plus `preventDefault`/`stopPropagation` on a
  **capture**-phase listener) one E press would skip the card *and instantly burn the next day*.
- Auto-dismiss raised 2700 → **3000ms** — the stagger fix needs the room, and the skip buys it back.
- **"☕ Energy restored" and "💾 Progress saved" moved into the footer hint.** They fired identically every
  morning for 250 days; that is chrome, not information. Two rows freed for things that actually differ.
- **One new line naming the day's unfilled asks** — `📋 Today: Pip's request · Nell's order · the Round`.
  One line, not four: `.scInner` has no max-height and no overflow, and four ask rows would clip on a
  mobile landscape viewport, regressing v4.19's touch-parity work. Safe to read at wake: each of those
  rolls from its own seeded `makeRng(seed + day*k)` stream and never touches `Math.random()`, so calling
  them early is roll-identical (and `todaysRequest` filters on live skill levels, so an early call is
  *more* stable, exactly as its own comment asks).

### Added — the standing-goals card, so the tracker stops rendering an empty box

Past the story and the daily Round, `trackerData()` returns null and `#questTracker` rendered a **literally
empty box** for the rest of the save. New `standingGoalsHtml()` shows the long view:

- **The craft closest to 99**, rotated daily through the *unfinished* ones. Deliberately not `day % 6`,
  which lands on an already-99 skill and prints "Farming 99 → 99"; and biased toward a craft with sparks
  left today, so the line **reinforces v4.23's rhythm** instead of parking you in whichever craft is
  deepest in the 86-98 desert. Verified: with Farming and Mining at 99, twelve consecutive days rotate
  only across the four unfinished crafts.
- **The Collection shelf closest to done**, via a new `collSectionCount(sec)` — one source of truth, so the
  HUD line and the Journal page can never drift.
- **The Crown**, counted in **levels** (`Total 521 / 594`), never raw XP: "3,488,124 XP remaining" fights
  the curve's own stated intent that the climb is paced to be savoured. Hidden once `valleyMaster` latches.
- **Only when `trackerData()` is null.** Never appended faintly beside a live card — `#questTracker` is
  ~36% of a 320×208 stage, and the v3.x event-pill lesson (tightened because "*something* was almost always
  inside the window, so it read as permanent chrome") applies precisely here.
- **Memoized, and it had to be.** `refreshQuestTracker` is called from `checkQuests`, which runs
  unconditionally at the end of **every `addXP`** — 50-200×/day beside a 60fps canvas loop. The shelf line
  alone would otherwise re-invoke all 13 `MUSEUM` `items()` closures (re-mapping CROPS/FISH/RECIPES/CHARMS
  and flat-mapping CREATURES) on every swing. Cached on a `day:discoveredCount` stamp and explicitly
  invalidated from `discover()`.

**This adds no XP, no gold, no items and no rate change** — it is a read-only projection of numbers already
stored, so there is no loop to accelerate.

### Verification (live build, console clean)

Stagger fits inside the dismiss at 7/10/12/15/20 lines and is unchanged on a quiet morning. Standing card
renders only when the tracker is null, rotates only across unfinished crafts, and memoizes. Screenshotted
in a real day-137 post-finale save: *"✦ The long sight · Fishing 95 → 99 · The Orchard 2/3 · Total 521 / 594
· the Valley's Crown"* — in the corner that was empty before.

### Files

- `game/js/10-ui.js` — stagger fix, skip latch, footer/asks lines, `standingGoalsHtml()`, `collSectionCount()`.
- `game/js/04-world.js` — `discover()` invalidates the goal cache.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=142`.

### Note on naming

The audit called this v4.26 behind "The Patron" (its v4.25). I shipped it first — it is S-effort, contains
a real defect, and The Patron's faucet cut should follow the v4.23 Cooking retune once ★ Renowned's +25%
dish premium is measurable. The Patron keeps its place as the next release, under whatever number is free.

---

## 2026-07-25 — v4.24.0 "The Morning Round" (code 111, tag `v4.24.0`) — the mature farm stops being 44 undifferentiated presses

### Why this release

Release #2 from the fun-and-pacing audit. A mature farm's morning was measured at **~44 key-presses**
before the day's actual decisions began, of which only ~21% carried any choice. The audit's framing is
the right one and I held every change to it: **remove TEDIUM, never GAMEPLAY** — the yardstick the v4.11
comment already set ("harvest has no timing or skill element, so this removes friction, not challenge").

### Changed — planting sweeps the footprint

Planting was the last core field verb still charging a per-tile tax. (v4.11's changelog claimed harvest
was the last; it was wrong — footnoting that here rather than leaving it to rot.)

- The Seeds branch (`08-actions.js`) now iterates `canTiles(tx, ty, state.tools.Can||0, state.face)`,
  filtered to tiles that are TILLED/WATERED with no crop and no object — so plant/water/harvest all share
  one footprint.
- **The ordering trap, fixed.** `canTiles` at tier ≥ 3 iterates `oy:-1..1` then `ox:-1..1`, so its index 0
  is the **diagonal up-left neighbour, not the tile you aimed at**. Hoe and Can don't care (they treat the
  set as a set) — but seeds are finite, so with one 900g Everbloom seed left an unsorted sweep would have
  planted it one tile up-left of where you pointed. The list is sorted faced-tile-first, which makes the
  low-seed case degrade to exactly today's single-tile behaviour. **Verified in-game: one seed at tier 3
  plants (10,10), the faced tile.**
- **Partial sweeps are fine** — plant what you can hold and stop, never refuse the whole sweep, the same
  way the Hoe tills what it can reach.
- **XP is deliberately NOT batched.** The variety spark counts `addXP` *calls*, not XP, so one batched
  `addXP("Farming", 4*n)` would have quietly cut planting's daily spark contribution by ~5×. Per-tile
  grant retained; `refreshHotbar()` (a full DOM rebuild) called **once** after the loop.

### Added — the footprint preview (shipped in the same change, deliberately)

There is **no un-plant verb anywhere** — `delete curMap.crops` happens only in the ripe-harvest sweep, and
the Hoe explicitly refuses tiles holding a crop. A mis-aimed sweep could therefore bury six Everbloom
seeds and lock those tiles for nine days. So the preview is a requirement of the sweep, not polish.

- In the facing-cursor block (`07-entities.js`), when the held tool is Hoe/Can/Seeds and its tier > 0 on
  the farm, every footprint tile gets a dim outline and the faced tile keeps its bright one.
- This also **retro-fixes the already-shipped invisible Hoe/Can swathe** — those have swept since v2.0
  without ever showing you where.

### Changed — same-kind collect sweeps

New `nearbyKind(tx, ty, kind, readyPredicate)` helper (`08-actions.js`): the same-kind objects in a fixed
3×3, faced tile first. Radius is **fixed at 1 and deliberately not the can tier** — an orchard has nothing
to do with your watering can.

- **Fruit trees, hives and READY machines** now collect as a cluster. Yield, XP and every per-day cap are
  per-object exactly as before; only the mashing goes. The **walk between them is untouched** — v3.35 made
  the yard a stroll on purpose, and it is the pleasant part.
- **Machine LOADS stay strictly per-object.** The sweep is guarded on `o.ready` only. `openMachineChooser`
  is the one genuine economic decision in the routine (which crop into a keg at ×2.2 over three nights vs
  a jar at ×1.6 over two), and a sweep there would silently dump the whole bag into six jars. **Verified:
  loading a keg with three empty kegs adjacent loads exactly one and spends exactly one turnip.**
- I also **rejected** the audit's own suggestion of a bin-side "collect everything" round: it voids
  `TREE_FRUIT_CAP`'s stated intent, deletes the reason you bought the horse, and makes the charming play
  strictly dominated.

### Changed — the produce press is the pet

Animals took two presses: one for the produce, one to pet. The second was **dead at steady state** —
`friend` caps at 250 and every mature flock is long since maxed.

- `petChicken` / `petCow` / `shearSheep` (`13-content.js`) now stamp `petDay` and grant the pet's +3
  alongside the produce's +8 — **exactly the +11 a diligent two-press player already got**, so nobody is
  worse off — and append `flockHearts()` to the toast.
- Verified: one press = produce + 11 friendship + `petDay` stamped; a second press the same day grants 0;
  an animal **already** petted today correctly gets only +8, never a double-dip.

### Verification (live build, console clean)

Plant sweep: tier 3 with plenty of seeds plants 9; **one seed plants the faced tile**; 4 seeds plant 4
including the faced tile; occupied tiles keep their existing crop untouched; untilled tiles are skipped;
9 tiles produce **9 spark-counting `addXP` calls**. Collect: 4 ready fruit trees + 1 unripe → gathers 10
fruit and leaves the unripe alone; 2 hives → 5 honey; ready kegs empty while a still-working neighbour is
untouched. Animals: all three species +11 on one press, no double-dip. Footprint preview screenshotted.

### Files

- `game/js/08-actions.js` — plant sweep + faced-tile sort; `nearbyKind()`; fruit/hive/machine collect sweeps.
- `game/js/07-entities.js` — the footprint preview.
- `game/js/13-content.js` — produce-press-is-the-pet in all three animal functions.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=140`.

---

## 2026-07-25 — v4.23.0 "The Even Hand" (code 110, tag `v4.23.0`) — the grind stops being lopsided and under-rewarded

### Why this release

The owner asked for a step-back evaluation: *"is this a fun, long-lasting gameplay loop with the right
amount of grind?"* I ran an 8-lens fun-and-pacing audit (57 agents, every proposal adversarially
stress-tested against the live code and the cozy contract; 48 proposals, 40 survived, 8 rejected as
contract-breaking or wrong-diagnosis) and modelled the curve independently myself.

**The answer: yes for 60-80 days, and the raw pacing is genuinely well-built.** I verified the headline
property and it holds — `inc = 62 + (L-1)^2.18` against node XP jumping 25/60/115/150/260/520/760 on the
unified 1/10/20/30/45/70/85 ladder keeps **actions-per-level flat at ~20-30 from L40 to L90.** That is the
hardest thing in this genre to get right and it is right. **The curve was not touched and must not be.**

**The real defect is that reward density collapses while action density stays flat.** The player keeps
paying ~25 actions per level while the number of *reasons* per level falls toward zero. This release
takes the three cheapest, highest-frequency instances of that — all data-table changes, on disjoint
tables, each independently revertible.

### Balance — Woodcutting cost 1.17× Mining for the same "99"

Measured end-to-end (my own model, cross-checked against the audit's): taking Woodcutting 1→99 cost
**9,449 energy / 94.5 in-game days**, against Mining's **8,108 / 81.1** — for an identical number on the
same panel. The cause was never the XP curve; it was that a tree's HP-to-XP ratio was worse than a rock's
at the middle rungs.

- **`TREES` hp only, xp untouched: pine 6→4, maple 11→8, elderwood 16→14.** Result: **8,097 energy / 81.0
  days — parity with Mining to within a rounding error (ratio 1.17 → 1.00).** Node count barely moves
  (2,084 → 1,992), so the flat actions-per-level shape survives intact.
- **Oak, willow, heartwood and silverwood are deliberately UNCHANGED.** At the tool powers you actually
  hold when they unlock, the deep woods were *already* at parity (silverwood 3 swings vs star metal 3).
  The imbalance was entirely in the middle, and that is the only place this touches.
- I rejected the audit's proposed set (oak 3→2, pine→4, maple→8, elder→14, heart 24→18, silver 30→22).
  My model says it **overcorrects to ratio 0.82** — making Woodcutting the *cheapest* skill, which just
  moves the imbalance — and a reachability-aware sweep found it introduces a **new `silver<heart`
  inversion at power 9**, a regression at the top of the ladder. Three numbers do the job cleanly.
- **Verified no new ordering inversions.** A naive all-pairs check is wrong because it compares trees at
  tool powers you cannot hold when they unlock; the reachability-aware sweep (compare only trees choppable
  at the level where you would have that power) reports the same two pre-existing inversions before and
  after (`maple<pine` at the Basic axe, `elder<willow` at high power) — neither introduced nor worsened.
- **`migrateSave` clamp** (`11-title.js`): farm trees persist as `{kind,hp}` (04-world.js:256), so an
  existing save would keep standing pines/maples/elders at the old, higher HP forever. `Math.min` — never
  assignment — so a half-chopped tree keeps its damage and this can only ever make a tree *easier*.
  (Grove and ancient trees regenerate daily from `TREES` and need nothing.)

### Balance — the Cooking ladder was strictly dominated by spamming the fry button

The full 32-recipe ladder cost **3,923 cooked dishes** to reach 99, each needing farmed or fished
ingredients and a stove trip — while `cookFish` on a Coelacanth costs **1,402 presses** with no
ingredients, no energy and no level gate. **The Lv90 crown dish paid 285 XP against a plain fry's 558.**
An optimising player never touched the ladder, which is the *only* consumer of Farming's late output.

- **`RECIPES` xp retuned for lvl ≥ 20 on a ~20-dishes-per-level curve**, every value **floored at its
  current one** so no dish ever pays less than it did yesterday (the contract applies to recalibrations
  too — GBP §5.4). Grand Feast 285→913; Dragonfruit Parfait 228→786; Rhubarb Pie 92→194; and so on down.
  Farmer's Omelette held at 50 because the curve target (45) would have been a nerf.
- **Butterbrook Reserve 150→330.** It is `lvl:0` and flag-gated on Nell's 6-heart event, so a
  levels-only pass would have silently demoted a friendship prize below a mid-ladder pie.
- **Ladder now fully monotonic** — the shipped table had five inversions where a *higher*-level dish paid
  less than one you already knew (Apple Crumble L20 = 32 under Blueberry Tart L18 = 42; Cranberry Sauce
  L36 = 40 under Cherry Tart L34 = 50). Also nudged Tomato Soup 34→38 and Apple Crumble 32→44 to close
  the last two.
- **A load-time `auditRecipeLadder()` guard** (01-data.js, after the sort) `console.warn`s if a future
  recipe ever regresses. It warns rather than throws — a bad number must never black-screen the game.
- **Result: 3,923 → 1,918 dishes, ~20 per level at every rung, and the crown dish (913) now beats the
  fry (558).** `cookFish` is deliberately NOT nerfed: it stays the cheap, low-effort path for a quiet
  evening; what the ladder buys is far fewer presses and a reason for Farming's late output to exist.

### Feature — the variety spark keeps a rhythm

The spark is the best-calibrated system in the build (I checked: it pays a steady **21-25% of a level per
skill per day at every band** from L10 to L90 — do not touch `SPARK_MULT`). But nothing rewarded actually
*rotating*: with food making energy effectively free, a focused player could simply spark all six anyway,
so "rotate to make the most of it" was advice, not a choice.

- **`sparkCap()`** (`08-actions.js`): `SPARK_CAP + 5 × min(4, breadth − 1)`, where breadth is the number
  of distinct crafts touched today. **Breadth 1 = 10 sparks — byte-identical to today, so nobody is ever
  worse off.** Breadth 2 = 15, breadth 5+ = 30.
- **Capped at 4 extra crafts**, so Warding is always a free *substitute* and never a sixth requirement —
  the Undercroft must never become a prerequisite for a full-value day.
- **Re-evaluated per grant**, so taking up a new craft at noon *reopens* budget in crafts you already
  spent. No ordering trap, no back-pay bookkeeping, no new save field (`dailyXpActs` already exists and
  resets at dawn), no migration.
- The skills panel now shows the **live** spark count the day's rhythm has bought, not a static promise.

### Verification (live build, console clean)

- **Swings per tree, measured in-game by actually chopping** with the hotbar Axe selected and mastery
  randomness excluded — Basic axe: oak 3, pine 4, maple 8, willow 8, elderwood 14, heartwood 24,
  silverwood 30 (= HP exactly). Star axe: 1/1/1/1/2/3/3. Every count matches the model.
- **Migration:** an existing save with pre-rebalance HP clamps to pine 4 / maple 8 / elder 14; a
  half-chopped maple at hp 3 **keeps its 3**; heartwood at 24 is untouched.
- **Cooking:** ladder monotonic, Grand Feast 913 > fry 558, Butterbrook Reserve 330.
- **Spark through `addXP`:** 12 grants × 100 XP — focused player gains 1,700 (10 sparked, identical to
  today), breadth-5 player gains 1,800 (all 12 sparked). Cap reads 10/10/15/30/30 at breadth 0/1/2/5/6.

### Known second-order effects (logged deliberately, not fixed here)

- Wood gold-per-energy rises (~33% on pine/maple/elder). It does **not** make wood dominant — a star-metal
  day still far out-earns it — so it ships as-is. If it ever reads hot, the lever is `ITEM_SELL`, **never**
  tree HP, which would undo the parity this release exists to create.
- Every wood *sink* (tool tiers, lift stops, waystones, bells, board timber asks) gets correspondingly
  cheaper in energy. **Do not raise those asks to compensate** — the buff would net to zero and the
  changelog would contradict itself.
- Cooking 99 becomes genuinely reachable, which turns on ★ Renowned's permanent +25% dish sell. That is a
  real gold faucet switching on, and it should inform the economy pass rather than be silently absorbed.

### Still ahead (from the same audit, ranked)

`v4.24 "The Morning Round"` (the mature farm is ~44 undifferentiated presses before the day starts) ·
`v4.25 "The Patron"` (an uncapped repeatable gold sink + trimming the fishing faucet — gold stops
mattering around day 45-60) · `v4.26 "The Long Sight"` (the tracker renders literally empty past day 120) ·
`v4.27 "The Keen Edge"` (per-swing method choice — the first real *decision* in a gathering session) ·
`v4.28 "The Long Round"` (the ~3.7M XP between the Tenth Lantern and the first Mantle is silent).

### Files

- `game/js/01-data.js` — `TREES` hp ×3; `RECIPES` xp retune + `auditRecipeLadder()`; VERSION + in-game CHANGELOG.
- `game/js/08-actions.js` — `sparkCap()` + its use in `addXP`.
- `game/js/10-ui.js` — skills-panel spark note and per-skill sparks-left now read `sparkCap()`.
- `game/js/11-title.js` — `migrateSave` tree-HP clamp.
- `game/index.html` — cache-buster `?v=137`.

---

## 2026-07-24 — v4.22.0 "The Way Down" (code 109, tag `v4.22.0`) — owner playtest: the Warden, the stair, and the shaft

### Why this release

Direct owner playtest feedback on the Undercroft (recorded verbatim in `DEVLOG.md`). Three notes, all
about how a run *feels* rather than what it costs.

### Balance — the Hollow Warden's guard now has a rhythm

> "The Hollow Wardens are a little difficult to defeat. Their shields are up for way too long, so it
> takes too long to kill them."

As shipped, `block:true` meant the guarded front was up **permanently** — it merely re-faced you on a
0.55s turn-lag. The only answers were out-circling that lag or landing a v4.4 parry: both fiddly, and
neither gave a *readable moment to attack*. The right fix isn't less HP, it's a **pattern to learn**.

- New `GUARD_HOLD` (2.4s braced) / `GUARD_REST` (1.5s open) cycle ticked in `updateCreatures`
  (`15-warding.js`). `hitCreature`'s block test now also clears on `cr.gDown`, so a frontal strike lands
  during the rest beat. Measured: the guard is **open 38% of the time**, versus never before.
- `WARD_TURN_LAG` 0.55 → **0.75**, so circling to its back is a real option rather than a race you
  usually lose.
- The shield arc **is** the tell: bright and wide while braced, dim/narrow with a gold pip while open, so
  the window is readable at a glance from anywhere on screen. A small sparkle marks the moment it sags.
- Three honest answers now (wait it out · get behind it · parry it open), and none of them punish the
  player — this makes the fight fairer, not harsher.

### Added — the stair falls out of the fighting

> "It's not exciting to look for the ladder… have the ladder randomly spawn upon killing a mob. So it's
> sort of like mining rocks, and then suddenly a ladder will appear."

The owner named the mine's model as the good one, and it is: down there the way down hides under a rock,
so *the thing you're already doing* reveals it. The Undercroft's equivalent is **settling restless
things** — so `maybeDropStair(cr)` (`15-warding.js`) now drops the stair where one comes apart.

- Escalating chance (15% → 30% → 45% …, capped 90%) so it turns up fast and never dangles on bad luck:
  **average 2.9 settles, median 3, 98% within five, worst case six** over 400 simulated floors.
- Fires **once per floor** (`meta.stairFound`, set by the knot path too), skips boss floors (the Great
  Knot's stair is the boss's to give), and dissolves the floor's now-moot stair-knot along with it.
- Calls `unstick()` — the stair lands where the creature stood, which may be where *you* are (the same
  guard v4.15 added for the boss drop).

### Polish — a way down looks like a way down

> "The ladder should be going down, not a ladder object that's going up. It doesn't make thematic sense.
> This goes for all of them — this goes for the mine as well."

Both the mine's `ladderdown` and the Undercroft's `wardladderdown` reused the upright `ladder` sprite
(rails + rungs) with a small ▼ — which reads as *climb up*. New **`stairdown`** sprite (`03-art.js`): a
black shaft cut into the floor, the near lip catching the light, and four steps receding away, each
narrower and darker than the last so the eye reads depth. `drawObject` (`07-entities.js`) now routes
**every** way down to it; `ladderup`/`wardup` keep the rungs, which is correct for a climb.

### Verification (live build, console clean)

- Guard: 38% open over an 8s cycle; a frontal hit is refused while braced (hp 16 → 16) and lands during
  the rest beat (16 → 11).
- Stair: 400-floor Monte-Carlo as above; a live floor dropped it on the 2nd settle, removed the knot, set
  `stairFound`, and twelve further settles produced **no second stair**.
- Sprite: screenshotted side-by-side in **both** the Undercroft and the mine — shaft + ▼ for down, rungs
  + ▲ for up.

### Files

- `game/js/15-warding.js` — the guard cycle + constants; `maybeDropStair`; knot path sets `stairFound`; shield arc tell.
- `game/js/03-art.js` — the `stairdown` sprite.
- `game/js/07-entities.js` — down-stairs draw as a shaft; up-ladders keep the rungs.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `DEVLOG.md` — the owner's feedback, verbatim, with the interpretation acted on.
- `game/index.html` — cache-buster `?v=135`.

---

## 2026-07-24 — v4.21.0 "The Mantle" (code 108, tag `v4.21.0`) — the prestige layer

### Why this release

The v4.14 gap audit's #11. Crossing 99 granted a real passive perk, a banner and one toast — and then
nothing to *show*. Of the bible's §4.6 four stand-ins for multiplayer prestige ("villagers comment on your
milestones, a title, a mastery cape/trophy shown off, a trophy room"), only NPC comment had ever shipped.
Meanwhile the skills panel printed **"Total Level N / 594"** while the highest `totalLevel` objective
anywhere in `QUESTS` was 100 — the number the game shows you most had no destination. And the Collection
was a 147-slot silent counter whose payoff for filling a shelf was 146 becoming 147.

### Added

- **Six skill mantles** (`DECOR`, keyed `capeSkill`) — one per craft, gated at level 99, on the proven
  Storyteller's-Banner pattern: shown in Tom's shop **locked from day one**, so the goal advertises itself
  for the whole climb, and the locked row names your exact progress ("✦ Farming 62/99"). Purely cosmetic —
  a cape is a flex, never a stat. Seven sprites generated from one drawing function with per-skill palettes
  (all art is code, so a seventh cape is one row of data).
- **The Valley's Crown** (`masterGate`) — every craft at 99, i.e. total level 594. Gated on the *ceremony
  flag*, not the raw number, so it can never be bought a moment before the valley has said so aloud.
- **`checkValleyMaster()`** (`08-actions.js`), fired from the level-up path (the capstone can only be
  crossed by a level going up) and once on `beginPlay` so a save already at 594 gets its ceremony on the
  way in rather than never. **Deliberately NOT a `QUESTS` entry:** appending one would make `curQuest()`
  non-null again for finished saves and shove the v4.16 Act III / Warden's Round tracker card aside — and
  this repo has been burned before by keying anything on the quest chain (`FINALE_IDX` exists for exactly
  that reason). A latch flag instead.
- **The Collection celebrates** — per-section `found/total` (or "✦ complete") in every shelf header, and
  `checkCollection()` banners each shelf the moment it closes, once, on a `coll_<name>` flag, with a final
  **Curator** ceremony for all of them. Hooked into `discover()` — whose return value was read by *nothing*
  until now — so the check rides its early-return and costs nothing on the common path.

### The migration trap, handled

A long save has shelves it finished seasons ago. `checkCollection()` therefore **backfills silently on its
first run** (`state.flags.collInit`): existing completions are flagged with no fanfare, and only genuinely
new completions banner thereafter. The Legends are excluded from the generic banner — Bram's Hunt Crown
already ceremonies that shelf, and two celebrations for one act reads as a bug.

### Verification (live build, console clean)

- All six mantles + the Crown exist with both object and inventory sprites.
- Gating: `buyDecor("cape_farming")` at Farming 1 refuses and takes no gold; at 99 it sells. The Crown
  refuses without `valleyMaster` and sells after the ceremony. Setting all six skills to 99 gives
  `totalLevel() === 594` and `checkValleyMaster()` latches the flag.
- Collection: a pre-completed shelf on an existing save is flagged with **0 banners fired**; a shelf one
  item short fires nothing; completing it *through `discover()`* flags it. Per-section headers render.

### Files

- `game/js/01-data.js` — six `capeSkill` mantles + `mastercrown`; VERSION + in-game CHANGELOG.
- `game/js/03-art.js` — the mantle sprite loop (`CAPE_PAL`) + the Crown.
- `game/js/08-actions.js` — `checkValleyMaster()`, hooked to the level-up path.
- `game/js/10-ui.js` — locked-row rendering for capes/crown; per-section Collection progress; `checkCollection()`.
- `game/js/13-content.js` — `buyDecor` cape/crown gates.
- `game/js/04-world.js` — `discover()` now drives `checkCollection()`.
- `game/js/11-title.js` — silent backfill + a late 594 ceremony on `beginPlay`.
- `game/index.html` — cache-buster `?v=133`.

---

## 2026-07-24 — v4.20.0 "True Ladders" (code 107, tag `v4.20.0`) — the Skill Guide tells the truth

### Why this release

The v4.14 gap audit's #7. v4.10 shipped an entire release for level-up truthfulness, and v4.12's Skill
Guide advertises itself as "built straight from `unlocksAt` (so it can never drift from the real gates)."
It drifted in **both** directions, and the drift had one root cause: `unlocksAt` was a hand-maintained
list of *some* tables rather than the actual gates.

- **Real gates were invisible.** The tool ladder is hard-enforced — `buyTool` (08-actions.js) and the shop
  both refuse below `TIER_LEVEL[t]` — yet tool tiers appeared in **no** guide and **no** level-up banner.
  The audit's "biggest single win hiding here" was Farming 20, the Iron Hoe/Can **5-tile reach**, arguably
  the most-felt upgrade in the game, listed nowhere. Same for the grove's `DEADFALL` ring gates (real,
  enforced at `genGrove`, lvl 5/12/20/30/40/52/64/78) — so a Woodcutting-51 player was told "Next: Heartwood
  at Lv 70" while the seventh ring opened one level later.
- **Phantom gates were shown, padlocked backwards.** Eight of Warding's twelve rows gated *nothing*:
  Undercroft spawns are keyed purely on **depth** (verified — `genUndercroft`'s band table is a
  `depth < N ? … : …` chain; `CREATURES[k].lvl` is read only by the guide and a cosmetic nameplate). And
  because `skillGuideHtml` padlocks on `lvl >= L`, the Great Knot (`lvl:40`) showed 🔒 **forever** to a
  player who fights one on floor 10 at roughly Warding 8 — the lock ran backwards against reality.

### Fixed

- **The tool ladder is on the ladder.** New `toolGates(skill, add)` (`08-actions.js`), shared by
  `nextUnlock` and `unlocksAt`: for each tool whose `TOOL_SKILL` matches, every tier from `TIER_LEVEL`
  with its perk text — "Iron Hoe — tills a 5-tile row". The Stave is skipped until
  `state.flags.staveEarned` (the shop hides it too).
- **`TOOL_PERK` + `toolPerk(tool, tier)` lifted into `01-data.js`.** They were *local consts inside
  `renderShop`*, which is precisely why the guide could never see them. Shop and guide now read one source.
- **Grove deadfalls listed** for Woodcutting ("the grove's fourth ring") from the live `DEADFALL` table.
- **The phantom Warding creature rows are gone** from the level-indexed guide, replaced with something
  honest: a **depth** section listing each family by the floor you first meet it, never padlocked by level.
- **`WARD_BANDS` extracted to `01-data.js`** (with `wardBandFor(depth)` / `wardFirstFloor(kind)`), out of
  the `genUndercroft` literal. `genUndercroft` now reads it, and so does the guide — **one source of truth**,
  which kills the drift class that caused this bug in the first place. `wardFirstFloor` is *derived*, so a
  future band can't leave the guide stale.

### Verification (live build, console clean)

- Band extraction is faithful: `wardBandFor` matches the old inline table at depths 1 / 17 / 44.
  `wardFirstFloor` derives wisp 1, shambler 5, embermite 10, hollowwarden 15, gloamtangle 20, deepknot 30,
  stargnarl 35.
- **Farming 20** → "Iron Hoe — tills a 5-tile row", "Iron Can — waters a 5-tile row" (was empty).
  **Woodcutting 20** → Maple + Iron Axe + "the grove's fourth ring". **Mining 45** → Cobalt Vein + Cobalt
  Pick. **Fishing 30** → Whitefin (legend) + Gold Rod. **Warding 10** → Copper Stave (a real gate).
- Sweeping L=1…99, **no creature row survives** in the Warding guide (`phantomCreatureRow: null`).
- No shop regression: `toolPerk("Hoe",2)` = "tills a 5-tile row"; the Tools tab still renders the Hoe/Can
  reach perks, the Rod line and the default "stronger, less energy".
- Screenshotted: the Warding skill card now names "Cobalt Stave" and Woodcutting names "the grove's
  se[cond] ring" — real, enforced gates where phantoms and blanks used to be.

### Files

- `game/js/01-data.js` — `TOOL_PERK`/`toolPerk`; `WARD_BANDS`/`wardBandFor`/`wardFirstFloor`; VERSION + in-game CHANGELOG.
- `game/js/08-actions.js` — `toolGates` + `ordinalRing`; `nextUnlock`/`unlocksAt` rewired (creature branch removed).
- `game/js/10-ui.js` — `renderShop` reads `toolPerk`; `skillGuideHtml` gains the Warding depth section.
- `game/js/13-content.js` — `genUndercroft` reads `wardBandFor(depth)`.
- `game/index.html` — cache-buster `?v=131`.

---

## 2026-07-24 — v4.19.0 "In Hand" (code 106, tag `v4.19.0`) — touch parity: the mobile platform blocker

### Why this release

The v4.14 gap audit's #3, and the highest-*severity* item left on the list. The game ships a viewport
meta tag, a complete `#touchUI` layer (d-pad, USE/ACT/Look/Guard/menu), and a README line advertising
mobile — but **four world verbs had exactly one call site each, and it was a keyboard key**
(verified: `cycleSeed` `10-ui.js:1732`, `eatFood` `:1733`, `giveGift` `:1734`, `rideToggle` `:1735`).

The seed one is the platform blocker. `plantables()` funnels **seeds, saplings, hives, machines AND
décor** through a single `state.seedSel`, `cycleSeed()` was the only way to change it, and
`normalizeSeedSel()` only ever falls back to `ids[0]` — the always-present `"turnip"`. So a touch player
was pinned to turnips forever: **farming stops dead on Summer Day 1** (turnip is Spring-only), and no
sapling, beehive, machine, cellar or décor piece can ever be placed. Add the missing eat/gift/ride and
that silently removes food, the entire friendship layer (and therefore marriage), and the horse.

This is a broken *advertised* capability, not a scope expansion — and the fix is purely additive input
plumbing with zero balance risk.

### Fixed — the four verbs

- **Choosing what to plant/place, from the bag** (the real fix). New `plantableFor(item)` +
  `selectPlantable(sel)` (`game/js/08-actions.js`) — the reverse of `plantableName`: given a bag item,
  which `state.seedSel` value is it (crop seed → crop id, gated on Farming level; sapling → `sap:k`;
  Beehive → `hive`; machine → `mach:k`; décor → `decor:k`; anything else → null). `invDetailHtml`
  (`10-ui.js`) renders a **"select this to plant / place"** button for any plantable you're holding,
  mirroring the charm `wear this` pattern, with a disabled "selected ✓" state when it's already in hand.
  **This is a genuine desktop QoL win too** — a maxed save has 30+ plantables, and cycling to the one you
  want was miserable on a keyboard as well.
- **Seed cycling on touch:** tapping the Seeds hotbar tile when it is *already* selected now cycles
  (`refreshHotbar`, `10-ui.js`) — the touch parity for `R`. A first tap, or any other tile, selects as before.
- **Eat / Gift / Ride:** added to `#touchMenu` (`game/index.html`) as `data-action` buttons, and
  `wireTouch` (`10-ui.js`) now branches on `dataset.action` → `eatFood()` / `giveGift()` / `rideToggle()`
  behind the same `uiBlocking()` gate the keyboard path uses. (The menu previously assumed every button
  was a `data-panel`.)

### Changed — hints name the control you actually have

`USEKEY()` / `EATHINT()` / `GIFTHINT()` (`08-actions.js`), read at call time (so the `IS_TOUCH` const in
the later-loading `10-ui.js` resolves fine). Applied to the six contextual verb hints, the seed hint
("Tap the seed slot again" vs "Press R"), the 0-energy toast (which literally instructed a phone player to
"eat (F)"), the gift-range toast, the stair-knot toast, and the Undercroft intro banner.

### Verification (live build, console clean)

- `plantableFor`: Keg→`mach:keg`, Flower Bed→`decor:flowerbed`, Apple Tree→`sap:apple`, Melon
  Seeds→`melon`, Beehive→`hive`, Wood→`null`. `selectPlantable` sets `seedSel` + focuses the Seeds slot.
- The **real rendered buttons** clicked end-to-end: Keg → `mach:keg`; "Flower Bed" (a name with a space,
  exercising the `jsq` escaping) → `decor:flowerbed`; the already-selected item renders the disabled
  "selected ✓". The button appears for plantables and **not** for junk (Wood).
- Seeds tile: first click selects (slotSel 0→5, seed unchanged), subsequent clicks cycle
  turnip→potato→wheat; a non-seed tile still just selects with no seed side-effect.
- `#touchMenu` carries `data-action` ∈ {eat,gift,ride}; `wireTouch`'s `ACTIONS` map covers all three; the
  three verb functions exist. (`IS_TOUCH` is a `const` derived from `matchMedia("(pointer:coarse)")`, so
  the touch-only branches can't be flipped at runtime in a desktop preview — the DOM/handler/key alignment
  is verified statically, and the listener attach uses the identical pattern as the working panel buttons.)

### Files

- `game/js/08-actions.js` — `plantableFor` / `selectPlantable`; `USEKEY`/`EATHINT`/`GIFTHINT`; hint strings.
- `game/js/10-ui.js` — bag "select this" button; Seeds-tile cycle; `wireTouch` action branch.
- `game/index.html` — `#touchMenu` Eat/Gift/Ride; cache-buster `?v=129`.
- `game/js/13-content.js` — Undercroft banner hint.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.

---

## 2026-07-24 — v4.18.0 "The Standing Board" (code 105, tag `v4.18.0`) — the noticeboard scales with the player

### Why this release

The v4.14 gap audit's #9, and something I'd independently flagged at the audit's very start: the village
noticeboard — the game's *only* scaling-free daily social loop — was a 20-row table whose hardest ask
gated at **level 22** (a couple of pumpkins), and `todaysRequest()` picked **uniformly** from every
*reachable* request. So a 99/99/99 farmer walking up to the board pinned by the shop door they visit daily
had a 1-in-20 chance of "Tom wants 8 Wood, 60g." The daily directed objective went stale mid-game and never
recovered. (`GAME_BALANCE_PRINCIPLES` flags the late-game board pay at ~330g against a 1,500g Everbloom
tile.)

### Added — sixteen higher-tier requests

`REQUESTS` (`game/js/01-data.js`) gains 16 entries spanning **lvl 16–90** — Corn/Cranberry/Starfruit/Melon/
Artichoke/Grape/Yam/Dragonfruit/Everbloom (Farming), Gulf Sturgeon/Coelacanth (Fishing), Gold/Cobalt/
Deepsilver Ore + Ruby (Mining) — each with an in-character line. **Appended, never inserted**, so any save's
cached `reqIdx` stays valid (it's a raw index into `REQUESTS`). Requesters stay the board's original five
(tom/pip/maya/bram/rowan) — Nell and Elias have their own daily loops (NELL_ORDERS / the Warden's Round), so
adding them here would collide.

### Changed — band-weighted daily pick

- **`requestWeight(r)`** + a weighted draw in `todaysRequest()` (`game/js/14-story.js`), replacing the
  uniform pick. Weight is smooth and **self-scaling to any player level** — `0.25 + (min(1, lvl/max(10, pl)))² × 2.5`
  — so an ask right at your mastery pulls ~4× as hard as a trivial one far below it, with no hardcoded level
  bands. Un-gated favours (eggs, shells, salad — `requestSkill` returns null) keep a steady modest weight
  (0.9) and never `NaN` (the audit's explicit gotcha). The seeded per-day RNG and the once-a-day cache are
  preserved, so the pick stays deterministic and can't reshuffle mid-morning.
- Pay is unchanged (`max(60, sell × qty × 1.4)`) — it was already a share of the item's worth, so the higher-
  value asks pay proportionally more *for free*: the reward ceiling rose with the ask ceiling without a
  separate pay-tier system.
- **`ORE_ITEMS`** (14-story.js) gains Cobalt/Deepsilver so the new deep-ore asks gate on Mining level — they
  were absent, so a Cobalt request would have read as un-gated and been offerable to a level-1 miner.

### Verification (500-day Monte-Carlo per band, in the live build)

- **Maxed (all 99):** 54% high-tier asks, top five all high-value (Dragonfruit/Coelacanth/Everbloom/Yam/
  Grape), **grind-asks (Wood/Stone/Turnip/Potato/Wheat) down to 5%** (from ~1-in-20), **avg pay 2,239g** (was
  ~330g).
- **Mid (~40):** mid-tier dominates with level-appropriate asks (Ruby/Cobalt/Melon/Gold Ore/Rhubarb), avg 956g.
- **New (level 1):** only reachable low-tier — the cozy starter favours (Field Salad/Shell/Egg/Sardine/Stone).
- Determinism holds (same day → same request); no `NaN` `reqIdx`; the live board text and the HUD board
  tracker both render the high-tier ask ("📌 Noticeboard • 1 × Coelacanth — Bram (0/1)"). Console clean.

### Files

- `game/js/01-data.js` — 16 higher-tier `REQUESTS`; VERSION + in-game CHANGELOG.
- `game/js/14-story.js` — `requestWeight()` + weighted `todaysRequest()`; `ORE_ITEMS` deep ores.
- `game/index.html` — cache-buster `?v=127`.

---

## 2026-07-24 — v4.17.0 "After the Lantern" (code 104, tag `v4.17.0`) — the world reacts to the finale

### Why this release

The v4.14 gap audit's #4: `tenthWingLit` — the flag that marks the entire Act III finale — was read in
exactly **two** places in ~12,700 lines (a light pool in 06-weather, two Guild lamps in 13-content). Not
one NPC line, letter, quest, or ceremony reacted to the biggest thing the player does in the game. Worse,
Rowan *personally says "there were always ten"* in the ch8 cutscene, yet his standing dialogue kept
insisting "Nine wings, lit" forever after — a flat self-contradiction. V4_PLAN.md's finale spec (festival
integration + a "One Last Letter" epilogue) was never built. This release is pure data/story — no new
engine — and it's the emotional payoff the whole v4 arc was walking toward.

### Added — the cast speaks to the finale

- **A `tenthWingLit` branch in `npcStory` for all seven NPCs** (`game/js/13-content.js`), ahead of the
  `festivalDone` branches (`tenthWingLit` always implies `festivalDone`). Rowan counts all ten windows and
  thanks you for the one he couldn't; Maya's painted the two wardens and hung it in the Guild; Tom's
  ordering more lanterns; Pip is scandalised; Bram remembers sitting with Elias by the water; **Nell** and
  **Elias** — who had no `npcStory` branch at all — get one. Two guards keep existing hooks primary: the
  Nell line only fires once her **daily order is filled** (so the order still surfaces first — `npcLine`
  checks it *after* `npcStory`), and the Elias line stands down at the **coastroad** (his ferry-landing
  location lines stay deliberately primary there).
- **The Act III epilogue letter** — `LETTER_WARDEN_EPILOGUE` (`game/js/14-story.js`), Elias's own "one last
  letter" in the register of Grandpa's, fired **once** from `closeWardChapter`'s all-done branch
  (`game/js/10-ui.js`, gated on `state.flags.wardEpilogueSeen`, ~5.2s after the finale banner clears so it
  reads as a quiet coda). Closes Orla's thread — "you brought her *name* up, her round walked again" — and
  hands the craft on.
- **The annual Lantern Festival gains a third last lantern** (`game/js/14-story.js` anniversary scene).
  Rowan already lights two lanterns last each year (Rosa, Grandpa); once the tenth wing is lit, Elias lights
  a third **for Orla**, spoken aloud — so the finale becomes a recurring ceremony the valley *keeps*, not a
  one-time event. Reuses the scene's existing "lanterns for the lost" motif.

### Fixed — the stale "nine-only" strings

- **Rowan's standing line** no longer says "Nine wings, lit" after he's personally lit the tenth (the key
  contradiction).
- **The Journal wing-count header** (`10-ui.js` `journalQuestsHtml`) reads "Guild of **Ten** Crafts —
  N+1/10 wings lit" with a "◆ The Warden's" entry once lit (the tenth never lived in `WINGS` — it's Act III,
  driven by the ledger — so the Journal had been under-counting what the player actually did).
- **The planked-door examine** (`08-actions.js` `objLook`) reads "a lantern burns steady… the air that
  rises is warm" instead of "cold air rises… the Undercroft, breathing."
- **The Guild interior sign** (`13-content.js` `genGuild`) updates to "Ten crafts. Ten wings…" — the guild
  map regenerates daily, so it re-reads the flag each morning.

### Verification (all in a live play state, console clean)

- npcStory: Rowan pre-tenth "Nine wings, lit" → post-tenth "Ten wings, lit…"; all seven NPCs return finale
  lines; **Nell** returns null while her order is open (order surfaces) and the finale line once filled;
  **Elias** returns null at the coastroad (location lines win) and the finale line at the Guild.
- Journal header: "Nine Crafts — 1/9" → "Ten Crafts — 2/10" + the Warden's entry. olddoor examine and the
  Guild sign both switch on the flag. Anniversary scene builds three lanterns with Orla named and Elias
  lighting hers. The epilogue letter opens in the parchment overlay (screenshotted).

### Files

- `game/js/13-content.js` — seven `npcStory` finale branches (Nell/Elias new, with guards); Guild sign.
- `game/js/14-story.js` — `LETTER_WARDEN_EPILOGUE`; the anniversary third-lantern beat.
- `game/js/10-ui.js` — epilogue-letter fire on ch8 completion; the Journal ten-wings header.
- `game/js/08-actions.js` — the olddoor `tenthWingLit` examine.
- `game/js/01-data.js` — VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=124`.

### Still ahead (from the audit)

Touch parity (#3), the Undercroft "run" (a Resolve consumable + depth slope, #6), the economy
re-measurement v4.9 deferred (#8), and the scaling noticeboard (#9). Tracked in the session roadmap task.

---

## 2026-07-24 — v4.16.0 "The Warden's Round" (code 103, tag `v4.16.0`) — the post-finale loop + deep-material sinks + Act III made visible

### Why this release

The v4.14 gap audit's headline finding: *"the game has just finished being a story and has not yet
become a place."* The moment the Tenth Lantern lights (v4.5), three things happen at once and none
were designed — (1) the on-screen next-step goes permanently blank, because Act III lives in the
Warden's Ledger rather than the `QUESTS` chain and `trackerData()` early-returned `null` past the
chain; (2) the game fires its completionist fanfare *eight chapters early* (the tenth-door turn-in
that OPENS Act III is the last `QUESTS` entry, so "Every Story Told" flashed as the act began, above
a 0/8 ledger); and (3) the entire deep-loot economy reverts to sell-only, because all eight
Undercroft drops fed exclusively one-time sinks (8 chapter bundles + 9 bells + 5 charms) that are
spent once and never again — deliberately priced *below* the surface mine, so there was no reason to
descend after the finale.

This release is the audit's #1 and #2 picks together: give the wing a permanent repeatable purpose
**and** restore the signposting the whole of Act III was missing. It's the direct answer to *"why open
the tenth door tomorrow."*

### Added — the Warden's Round (the post-finale repeatable)

- **`WARD_ROUNDS` + the daily Round** (`game/js/15-warding.js`). Once `wardChaptersAllDone()`, the
  Ledger keeps writing itself one page a day: a single deep material the wing still needs tended out
  of it (rotating across seven of the eight drops — Heartknot, the rare Great-Knot boss trophy, stays
  reserved for the top charm and the Round-Lantern rather than a daily ask), walked at the Ledger for
  **gold + Warding XP**. Structurally
  a twin of Nell's daily order and Tom's salvage — `{item, qty, xp, want, line}`, its own flag namespace
  (`roundDay`/`roundIdx`/`roundDone`), one per day, seeded off the day; `todaysWardRound()` /
  `wardRoundFilled()` / `wardRoundPay()` / `walkWardRound()`. **Filled explicitly** via a button on the
  Ledger (`renderWardLedger`'s previously-dead all-done branch), never an auto-drain on open — the
  standing UI rule that an interface must never silently spend what you carry.
  - **Balance (GBP §2.4 / §6.1):** pays `max(250, sell × qty × 1.6)` in gold — modest, always under a
    good farm day — plus Warding XP scaled by the material's depth (120 for surface Gloam Thread up to
    400 for the root-dark Gloamstar). Warding costs no energy, so the Round is sized as *a reason to
    descend*, never the dominant XP or gold faucet. Fiction: Elias's "a warden only holds the wing lit
    long enough to hand it on" — the Round is the handing-on.
- **Two repeatable monument sinks** (`DECOR`, `game/js/01-data.js` + sprites `03-art.js`), the exact
  v3.29 move that closed the same hole for the mine's terminal ore: **Settled Cairn** (4,000g +
  Deepgnarl ×10 / Snarlthread ×16 / Warden's Ash ×12 — the bulk sink) and **Warden's Round-Lantern**
  (6,000g + Gloamstar ×3 / Heartknot ×1 / Gold Ore ×10 — the capstone). Both inherit `DECOR_MAX` 40, so
  they're a genuinely repeatable home for what you settle in the dark.
- **A "The Tenth Wing" Collection section** (`MUSEUM`, `game/js/10-ui.js`), **derived from `CREATURES`**
  (`drop` + `drop2`), not hand-listed — so the day a new family is added, its spoils join the Collection
  for free (the exact lesson the v3.37 review taught when a hand-list forgot Deepsilver). Sea Aster (v4.13)
  also joins The Shore, which had never listed it.
- **The wing's finds are giftable** (`NPCDEF`, `game/js/13-content.js`): Elias — the last Warden —
  *loves* Warden's Ash and *likes* Gloam Thread / Knotwood (he knows his own wing's spoils; the ash of a
  settled hollow warden means the most); Rowan — who sealed the wing — *likes* the deep trophies
  (Heartknot, Gloamstar). Verified no substring over-match against the `includes()` gift semantics.

### Changed — Act III made visible (the audit's #2)

- **`trackerData()` synthesizes an Act III card from the Ledger** (`game/js/09-quests.js`, new
  `wardTrackerData()`). Past the `QUESTS` chain it rebuilds the same `{title, reportTo, objs}` shape the
  HUD already draws, straight from the live ledger helpers: during a chapter it lists the bundle progress
  + the expedition beat; when both are met it points back to "the Warden's Ledger" to close the page;
  after the finale it surfaces today's Round. Only engages once `tenthDoorOpen` — Acts I–II are untouched.
- **The morning wake-card and the Continue recap** (`10-ui.js` sleep card, `11-title.js` `storySoFar()`)
  dropped their `questIdx < QUESTS.length` guards so both fall through to the same synthesized source —
  three signposts restored for all of Act III in one change. The HUD tracker line reads "Close the page
  at the Warden's Ledger" rather than "Report to" for ledger cards.

### Fixed — the false endings

- **The "Every Story Told" banner** (`09-quests.js`) kept its `qpAllTold` **latch** (the Storyteller's
  Banner / quest cape stays earned — cozy contract), but the fanfare is **reworded and rescoped**: it now
  says *"The Book of Tasks, Complete"* — accurate, because the quest cape is for the QUEST book
  (Acts I–II), which genuinely IS done at the tenth-door turn-in. The grand "valley whole at last" belongs
  to Act III's own finale (the Tenth Lantern), where it already fires.
- **The Journal's "Every task complete. The valley is yours." line** (`10-ui.js` `journalQuestsHtml()`)
  now waits for `wardChaptersAllDone()` (or a save that finished the quest book without ever opening the
  door), instead of printing directly above a 0/8 open ledger the instant Act III began.

### Verification (all in a live play state, console clean)

- Tracker synthesis: mid-Act-III (ch2) HUD shows "The Old Rounds" with live bundle progress
  (Knotwood 5/20 …) + the expedition line; post-finale HUD shows "The Warden's Round · Bring 8× Gloam
  Thread to the Ledger." Screenshotted the Ledger panel rendering Today's Round with the Walk button.
- The Round: rolls a material, pays `max(250, …)` + Warding XP (the +180 vs base 120 seen in test is the
  variety spark applying, as intended), sets `roundDone`, and clears the tracker when walked.
- Monuments: both buy for gold + consume the exact deep materials, add the placeable; both sprites render.
- Collection: "The Tenth Wing" derives all eight drops from `CREATURES`; The Shore now includes Sea Aster.
- Gating: the triumphant Journal line is absent mid-Act-III, present once all chapters are closed.
- Gifts: Elias loves Warden's Ash / likes Gloam Thread + Knotwood; Rowan likes Heartknot + Gloamstar; no
  over-match (Rowan's Star Metal still *loved*; Elias doesn't match Gloamstar).

**Adversarial review pass** (4-lens diff review, each finding verified against live code) caught one real
bug, fixed before commit: `walkWardRound()` set `state.flags.roundDone` *after* its `bump()` calls, and
`bump() → checkQuests() → refreshQuestTracker()` re-rendered the new Act III corner card while `roundDone`
was still stale — so the instant a round was walked and paid, the HUD briefly re-drew it as "still needed
(0/N)", reading as "my round didn't count." `refreshHUD()` doesn't touch the tracker, so nothing corrected
it until the next stat-bumping action. Fix: set `roundDone` *before* the bumps, and call
`refreshQuestTracker()` on completion (the exact shape `tryFulfillRequest` already uses for the noticeboard).
Verified: walking a round now clears the corner card immediately. No cozy-contract impact (materials/gold/XP
were always exchanged exactly once); this was display-only.

### Files

- `game/js/15-warding.js` — `WARD_ROUNDS` + the Round helpers.
- `game/js/09-quests.js` — `wardTrackerData()` + `trackerData()` fallthrough; the reworded/rescoped cape banner.
- `game/js/10-ui.js` — Ledger all-done branch renders the Round; tracker "close the page" phrasing; sleep-card guard dropped; Journal triumph-line gating; MUSEUM "Tenth Wing" + Sea Aster.
- `game/js/11-title.js` — `storySoFar()` guard dropped.
- `game/js/01-data.js` — two `DECOR` monuments; VERSION + in-game CHANGELOG.
- `game/js/03-art.js` — the two monument sprites.
- `game/js/13-content.js` — Elias & Rowan gift entries.
- `game/index.html` — cache-buster `?v=121`.

### Still ahead (from the audit)

Touch parity (four world verbs have no touch input), the world reacting to the Tenth Lantern (NPC lines
+ an annual ceremony + the epilogue letter), the Undercroft "run" (a Resolve consumable + a depth slope),
and the economy re-measurement v4.9 deferred. Tracked in the session's roadmap task.

---

## 2026-07-24 — v4.15.0 "Nothing Lost" (code 102, tag `v4.15.0`) — four contract/safety fixes surfaced by the v4.14 gap audit

### Why this release

With the HUD bug closed, I ran a full 9-dimension audit of the live v4.14 build (73 agents,
find → adversarially-verify → synthesize; see the session workflow `w7snyvc9q`). It graded the game
**C+ overall** — "an excellent cozy engine with a completed story and no second act" — and produced a
ranked build plan (headline gap: the post-finale void + the orphaned Warding economy). That content
work is real and is queued as **v4.16.0 "The Warden's Round."**

But the audit also turned up four **defects a real player can hit today**, two of which quietly break
the game's one inviolable promise — *nothing is ever taken from the player.* Those don't wait behind a
content release. I re-verified all four against live code myself (the audit refuted 0 of 63 findings,
which warranted independent spot-checks), fixed them, and confirmed each in-browser. Shipping them
first also matters because the content release's daily-limit balance **depends on** fix #3 being in
place.

### Fixed

- **"Sell all produce" permanently destroyed the legendary fish.** `isProduce()` (08-actions.js) keyed
  off `FISH_NAMES`, which is built to *include* the five `LEGENDS` — and `legendHere()` (08-actions.js)
  gates each legend on `!state.flags["caught_"+id]`, so a legend rises **exactly once per valley** and,
  once out of your bag, can never be caught again. So v4.11's convenience button swept all five
  irreplaceable trophies to market in one click. This is the contract failing on the least-recoverable
  items in the game. Fix: a `LEGEND_NAMES` set, and `isProduce()` now excludes it — sell-all leaves
  legends (and, as before, all raw materials) untouched; a deliberate counter sale is still allowed.
  → `game/js/08-actions.js`.
- **Settling a Great Knot could entomb the player (hard soft-lock).** The boss drops the descent stair
  on the tile it rooted on (`15-warding.js`), creatures don't block movement so the player can be
  standing there, `wardladderdown` was **not** in `WALKABLE_OBJ`, and `blockedAt()` (04-world.js) tests
  the whole 8×5 hitbox against a 16px tile — so once the hitbox is inside a newly-blocking tile, no
  incremental step can ever clear it (`cornerNudge` can't escape either). The only "rescue" was being
  hit by another creature, which fails on a cleared or parried floor. And this is the boss that gates
  **Warden's Ledger chapter 2** — a story blocker. Fix: `wardup` + `wardladderdown` join the mine's
  `ladder` in `WALKABLE_OBJ`, and the boss-settle path calls `unstick()` as belt-and-braces (the same
  one-liner `drainResolve` already uses). → `game/js/04-world.js`, `game/js/15-warding.js`.
- **A free knockout re-rolled the entire valley's gatherables.** `wardKnockout()` (15-warding.js) called
  `clearMapCache()`, which wipes **all** of `mapCache` — every mine floor, grove ring and forage node in
  the world regenerates. Since a knockout costs nothing (the contract) and Resolve refills at the bell by
  the entry, this was an unlimited re-roll of the two energy-free gathering faucets, and it silently
  voided every daily limit the game has. The wipe's actual job is only to stop a boss being whittled down
  across knockouts — one key does that. Fix: `delete mapCache["undercroft:" + (state.wardDepth||1)]`
  (the exact key `getMap` builds at 04-world.js:84) instead of the world wipe. → `game/js/15-warding.js`.
- **Canopy nests handed out the forged Warden's charms for free.** The nest pools (`maybeNest`,
  08-actions.js) excluded only the Forester's Band and the Pocketwatch by name — so the five crafted
  Warding charms (Warded / Emberlight / Wardstone / Settler's / **Starward**) were eligible, and ~40% of
  charm-tier nests could hand you the +15 Starward whose intended cost is a Star-Gnarl's Gloamstar + a
  Heartknot + a Diamond. This directly contradicted the code's own comment ("forged at a Warden's Bell…
  *not* nest-found"). Fix: a `crafted:true` flag on all five charms (01-data.js), and a single
  `nestCharmPool()` helper both nest sites now read — so the two pools can never disagree again (they
  previously used *different* exclusion lists) and the next crafted charm is covered the day it's added.
  → `game/js/01-data.js`, `game/js/08-actions.js`.

### Verification

All four confirmed in a live play state (console clean): sell-all keeps a Sunfleck (legend) and a
Heartknot (material) while selling Salmon + Turnip; both Undercroft stairs report walkable; the nest
pool excludes Starward/Warded and still offers the Wren charm; and a simulated knockout drops only
`undercroft:5` from a cache holding `mine:3` / `grove:2` / `undercroft:1` / `village`.

### Files

- `game/js/08-actions.js` — `LEGEND_NAMES`, `isProduce()` legend exclusion, `nestCharmPool()` helper, both nest sites.
- `game/js/04-world.js` — `WALKABLE_OBJ` gains `wardup` + `wardladderdown`.
- `game/js/15-warding.js` — boss-settle `unstick()`; knockout wipes only the current floor.
- `game/js/01-data.js` — `crafted:true` on the five Warden charms; VERSION + in-game CHANGELOG.
- `game/index.html` — cache-buster `?v=120`.

### Follow-on (not in this release)

The audit's content plan starts with **v4.16.0 "The Warden's Round"**: a repeatable post-finale
deep-material commission, two monument sinks for the eight Warding drops, a "The Tenth Wing" Collection
section, and — critically — synthesizing the HUD quest tracker from the Warden's Ledger so Act III
stops showing a blank next-step and the game stops firing "Every Story Told" eight chapters early.

---

## 2026-07-23 — v4.14.0 "Never Stranded" (code 101, tag `v4.14.0`) — HUD-disappears bug fix

### Why this release

Owner report: "There's an issue right now with the heads-up display, it disappears when I play."

**Root cause (diagnosed, not guessed).** The HUD is only ever hidden by one path: the *Hide HUD*
toggle (`U` key, or the Settings toggle) → `setHudOn(false)`. That preference is **persisted** to
`localStorage` under `hs_hud` as `{on:false}`, and `beginPlay` honors it via `applyHud()` on every
session start. So the failure mode matches the report exactly: the moment the toggle goes off — a
deliberate press, or a stray `U` while moving — the HUD vanishes, and because the off-state is
remembered, it stays gone the next session too, with **no on-screen affordance** telling the player
how to bring it back. To a player who doesn't know `U` is the culprit, the HUD has simply
"disappeared while playing." (Every *other* HUD-touching path was audited and cleared: cutscenes
add `.cine` which only *dims* via CSS and is always removed on scene end; travel/panels/combat never
touch `HUDPREF`; and a NaN energy value can't blank the whole HUD — only the one bar.)

The cozy contract is "nothing is ever taken from the player." A HUD you can't recover violates the
spirit of that, even though it's only a display toggle. The fix is a guaranteed way back.

### Fixed

- **A permanent, always-visible restore affordance.** Added a small `#hudHint` button
  ("◔ Show HUD · U") pinned to the **bottom-left corner**, shown **only while the HUD is hidden**.
  Clicking it (or pressing `U`) calls `setHudOn(true)` and restores everything. Because the button
  lives **outside** the `#hud` element in the DOM, it is *not* itself hidden when the HUD's opacity
  goes to 0 — that was the key structural choice; a hint nested inside `#hud` would vanish with it
  and defeat the purpose.
  - `applyHud()` now also toggles the hint's visibility: `hint.classList.toggle("hidden", HUDPREF.on !== false)`
    — i.e. the hint is present exactly when the HUD is off. One function stays the single source of
    truth for "is the HUD showing," so the hint and the HUD can never disagree.
  - Wired a click handler next to the panel-close wiring in `10-ui.js`; `playSfx("select")` for feedback.
  - New `#hudHint` CSS (bottom-left, `z-index:7` so it sits above the hidden HUD, muted parchment
    styling to match the game's palette, `.hidden{display:none}`).

### Files

- `game/index.html` — `#hudHint` button added after the `#hud` div (outside it); cache-buster `?v=119`.
- `game/css/style.css` — `#hudHint` styling.
- `game/js/10-ui.js` — `applyHud()` toggles the hint; click handler restores the HUD.

---

## 2026-07-22 — v4.13.0 "Butterbrook" (code 100, tag `v4.13.0`) — owner update 2: build out Butterbrook + Nell's friendship payoff

### Why this release

Owner: "build out Butterbrook — it's empty, no reason to visit apart from relationship points; and the NPC
there has no secrets or extra things to gain from a good friendship. Update that." (v4.9 already gave the
dairy Nell's Larder shop; this adds the *reasons to explore* and the *friendship reward*.)

### Added — Butterbrook content

- **Sea Aster** — a lilac salt-meadow wildflower that grows **nowhere else**. A new forage node
  (`asternode`) scatters ~7 across the Butterbrook meadow each day (placed on grass, after the path-scrub
  so it survives, off the coast path); interact to gather **Sea Aster** (Farming XP + coin). New sprites
  (`asternode`, `item_Sea Aster`), examine text, `INTERACT_KINDS` entry. It's also Nell's *liked* gift and
  the secret ingredient below — tying forage, gift and recipe together.
- **A bench** at the water's edge — a scenic rest spot (reuses the `bench` object).

### Added — Nell's friendship arc + her secret recipe

- **Nell heart events** (2/4/6♥) in `HEART_EVENTS` — her voice at last (dry, warm, unhurried): the twenty-
  year "supply line" she calls a marriage, why she came to the coast "where a thing takes exactly as long
  as it takes," and — at 6♥ — the payoff.
- **The Butterbrook Reserve** — Nell's secret dish, a genuine **friendship-only unlock**. It's a new
  `RECIPES` entry gated on `flag:"nellRecipe"` (not a Cooking level), which **only** her 6♥ event sets. To
  support this, the recipe system gained flag-gating: `cookRecipe` refuses an unknown recipe, `renderCooking`
  hides a flag-gated recipe from the Kitchen until it's learned (no padlocked "Cooking 0" spoiler), and
  `unlocksAt`/`nextUnlock` skip flag-gated recipes so they don't appear in the new skill guide as level
  unlocks. It cooks Fine Cheese + Large Milk + 2 Sea Aster into a 1100g dish — a reward that pulls a
  well-loved cow, the Larder and the coast forage into one prize you can make nowhere else.

### Verified

In-browser: Butterbrook spawns 7 Sea Aster nodes + a bench + the Larder; the node and item sprites render,
the node is interactable and yields Sea Aster; Nell's three heart events fire in order and the 6♥ sets
`nellRecipe`; the Reserve is flag-gated (refused before the flag, cooks after), excluded from the skill
guide, sells 1100g; console clean; screenshot of the meadow.

## 2026-07-22 — v4.12.0 "The Skill Guide" (code 99, tag `v4.12.0`) — owner update 1: the full per-skill unlock guide

### Why this release

Owner request: "like RuneScape's skill pop-ups/UI that details ALL the unlocks throughout the whole
leveling system for each skill." The skills panel already showed the *next* unlock and earned masteries;
this adds the complete 1→99 ladder.

### Added — the Skill Guide (`skillGuideHtml`, 10-ui.js)

Inside each skill's detail (Skills panel → tap a skill), an expandable **"📖 Skill guide — everything <skill>
unlocks (N milestones)"** lists every level that unlocks something, in order, built **straight from
`unlocksAt`** so it can never drift from the real gates. Each row is `✔ Lv — <what>` (reached, gold) or
`🔒 Lv — <what>` (locked, dimmed), and the list scrolls inside the panel. It interleaves content and the
four mastery perks: e.g. Warding shows Gloam Wisp (1), Knot-Shambler (10), Ember Mite (20), ★ Steady Ward
(25), Hollow Warden (30), The Great Knot (40) … Star-Gnarl (85), ★ Lanternheart (99). Milestone counts:
Farming 25, Cooking 34, Fishing 22, Warding 12, etc.

### Changed — Warding gains real content unlocks

To make its guide (and the rest of the UI) meaningful, `unlocksAt` and `nextUnlock` gained a **Warding
branch** — the restless-thing families by their level (`CREATURES[k].lvl`, excluding the Tanglet split
child). Side effects: the skills panel and the level-up banner now name Warding's *next* unlock ("Unlocks
The Great Knot at Lv 40") instead of going silent, and `unlocksAt` also picked up Fishing's **legends**
(it listed only the common fish before, though `nextUnlock` already had them).

### Verified

In-browser: the guide renders per skill with correct milestone counts (Farming 25 / Cooking 34 / Fishing
22 / Warding 12) built from `unlocksAt`; Warding at Lv 35 shows 5 reached (wisp/shambler/embermite/Hollow
Warden + Steady Ward) and 7 locked (Great Knot/Gloam Tangle/Deep Knot/Star-Gnarl + masteries 50/75/99),
correctly ticked/padlocked; the panel's next-unlock line now works for Warding; console clean; screenshot.

## 2026-07-22 — v4.11.0 "Less Fuss" (code 98, tag `v4.11.0`) — daily-loop QoL: swathe harvest, crop cues, sell-all

### Why this release

The neutral (non-easier) friction-removers from the QoL/balance audit — the biggest one being that
harvesting was the *last* core field verb still charging a per-tile tax while the Hoe tills and the Can
waters in swathes. Nothing here touches challenge or the economy; it removes clicks and squinting.

### Changed — row/swathe harvesting

A ripe interact (E) now sweeps the **Can's footprint** (`canTiles(tx,ty, state.tools.Can, face)` — the
exact shape the can waters): a tier-1 can harvests a 3-wide row, tier-3+ a 3×3, tier-0 the single faced
tile (backward-compatible). Only *ripe* crops in reach are taken; unripe ones and anything outside the
footprint are left. Yields, XP and the Bountiful/Fields-of-Gold double rolls are per-crop and byte-
identical to before — harvest has no timing element, so this is pure friction removal, not challenge.

### Changed — glanceable crop cues (07-entities.js)

Replaced the lone harsh-blinking pixel with two readable, cozy tells in the same crop-draw loop: a **warm
gold sparkle that gently bobs** over any ripe crop (a real "pick me," not a strobe), and — on a still-
growing crop whose soil is dry (`TILLED`, not `WATERED`, so it won't advance overnight) — a **faint cool
droplet**. Mutually exclusive (ripe crops are always mature); the thirst tell is deliberately subtle since
the soil colour already half-says it.

### Added — "Sell all produce" (owner-flagged footgun guard baked in)

One button at the top of the sell counter sells every **crop, raw fish and cooked dish** (incl. grilled
"Cooked X") in your bag in a single press — and **never** materials: `isProduce` matches only
`CROP_NAMES ∪ FISH_NAMES ∪ RECIPE_NAMES ∪ "Cooked …"`, so wood, ore, warding drops, gems, star metal,
charms and bought foods (Berry Bun, etc.) are all left alone. Economy-neutral under flat pricing (identical
to clicking each row's "all"); still feeds the Harvest Fair's best-crop tracking. The button shows the
exact total it'll fetch.

### Verified

In-browser: a 3×3 harvest gathers 8 of 9 ripe crops (the 1 unripe + the out-of-range crop correctly left);
tier-0 can harvests a single tile (its neighbour kept); sell-all sells crops/fish/dishes (970g) and keeps
Wood/Iron Ore/Gloam Thread and Berry Bun; the gold ripe glint and thirsty droplet render (screenshot);
console clean.

## 2026-07-22 — v4.10.0 "Clear & Fair" (code 97, tag `v4.10.0`) — QoL/balance pass: clarity fixes + tightenings (audit-driven)

### Why this release

Serves the owner's "more balanced and fun, QoL, without making it too easy," and offsets v4.9's flat
pricing (which strengthened gold faucets). All four items came from a multi-agent QoL+balance audit that
tagged each with a difficultyImpact and an explicit "does this make it too easy?" check.

### Fixed — the level-up banner stops lying (correctness)

`nextUnlock` (08-actions.js) has branches for Farming/Woodcutting/Mining/Fishing/Cooking but **none for
Warding**, and the level-up banner fell back to `nextUnlock` but never to `nextMastery`. Result: at nearly
every Warding level, and for the 8–13 levels past a grind skill's last content unlock, the banner declared
**"Mastery. Nothing left to learn"** — a lie (masteries at 25/50/75/99 and deeper content were still
ahead). Fixed with a `nextMastery` fallback: when no content unlock is ahead, the banner points at the
next mastery tier ("Next: ★ Steady Ward … at Lv 25") and only says "nothing left to learn" at the true
end (L99). Restores the bible's §4.3 "always show the next unlock," which the skills panel already honored.

### Changed — numeric Energy & Resolve readouts (clarity)

`refreshHUD` now writes the value into the bar labels: **ENERGY 73**, **RESOLVE 42/100**. Two eyeballed
bars become plannable numbers ("one more till?", "one more hit?") — pure clarity, only surfacing state the
game already computes; nothing about difficulty changes.

### Balance — two honest tightenings (nothing taken)

1. **Orchard cap.** Fruit trees were the ONLY uncapped placeable (hives cap at 4, machines at their `.max`,
   décor at 40) — an unbounded passive faucet, more warranted to cap now flat pricing removed the sell-side
   brake. `ORCHARD_MAX = 30` (a full orchard), checked in `plantPermanent` before energy is spent, like the
   other caps. **Grandfathered:** it only refuses NEW plantings past the cap; existing trees are untouched.
2. **Parry-XP mill.** The v4.4 Guard granted a flat `addXP("Warding",6)` per parry with no cooldown, so a
   single safe floor-1 wisp could be re-parried forever for risk-free XP (decoupling Warding from the
   descend-deeper danger loop). Now gated by a per-creature `cr.parryXpT` (10s): each creature rewards a
   parry once per window; settling stays the real XP. Real combat XP is untouched.

### Verified

In-browser: the Warding banner points at the ★25 mastery (was "nothing left"); Farming L92 falls back to
the ★99 mastery; a real content level still shows "Unlocked: Carrot seeds"; HUD reads "ENERGY 73" /
"RESOLVE 42/100"; the 31st fruit tree is refused with the sapling kept (30 stand, grandfathered); a parry
gives XP, an immediate re-parry gives 0, and XP returns after the cooldown; console clean.

## 2026-07-22 — v4.9.0 "Worth the Trip" (code 96, tag `v4.9.0`) — commerce: Demand retired + specialty vendors (owner requests)

### Why this release

Two owner calls: (1) "remove the demand/lowering-price system for selling — it seems unnecessary at this
point," and (2) "separate out the stores so there's a reason to visit different locations; all shops sell
and buy the same things right now." The reality behind (2): there was only ever *one* vendor (Tom),
reachable identically from the store counter and the farm market stall, and no other location had a shop.

### Changed — Tom's Demand is retired

The v2.0 per-item, per-day price slide (dump 50 starfruit → keep ~half) is gone: `demandMult` is now a
no-op returning 1, so every unit sells at full base price, always. All its call sites (`nextUnitPrice`,
`bundlePrice`, `sellItem`, the sell panel) keep working untouched — they just always see a multiplier of
1 — and the now-dead "demand %" note is removed from the sell rows. The `state.market` tracking and the
overnight-halving plumbing are left dormant and harmless. **Balance note:** with no sell-side diminishing
returns, gold faucets are stronger; the follow-up balance pass adds the offsetting tightenings the QoL/
balance audit flagged (an orchard cap; the parry-XP mill fix) so this doesn't tip "too easy."

### Added — specialty vendors (owner design: "differ by what you can BUY")

The shop panel is now vendor-aware (`_shopVendor` + `SHOP_TITLES`; `renderShop` picks tabs, title and buy
stock by vendor). **Selling stays universal** — sell anything at any shop at full price — but each place
BUYS you different wares:
- **Tom's General Store** (village counter / farm stall): seeds, food, **tools** (the smith), **décor**,
  orchard/apiary, courtship, warden's salvage — the general store. (Milk moved out; see Nell.)
- **Bram's Bait & Tackle** (a new stall on the beach): **Bait** — a new consumable. While you carry it,
  `startFishing` cuts the bite-wait to 0.6× (stacking with rain / Oilskin / masteries); `landFish` uses
  one up per catch. Bought at 15g, sells for only 8g (no buy-low/sell-high loop). New `item_Bait` sprite.
- **Nell's Larder** (a new stall at the Butterbrook dairy): the cooking staples — **Milk** (moved here
  from Tom's, where it never belonged — it's *her* product), **Large Milk, Honey, Egg**.

Both new stalls reuse the existing `stall` object with a `{vendor}` tag; the interact case routes a
tagged stall straight to that vendor's shop (untagged = Tom's counter, with his turn-ins/requests/recog
intact). Stalls are placed on clear, reachable tiles (beach 13,13 · Butterbrook 3,10 — 4 walkable
neighbours each) and survive their maps' nightly regen.

### Verified

In-browser: Demand gone (50 starfruit fetch full 47,500g); each vendor shows the right title, tabs and
exclusive buy stock (Tom = seeds/tools/décor with Milk gone; Bram = Bait; Nell = Milk/Honey/Egg); selling
is universal across all three; Bait makes bites faster (0.66 vs 1.10) and is consumed on a catch; both
stalls exist, render (Bait sprite included), and are reachable; console clean; screenshot of Bram's shop.

## 2026-07-22 — v4.8.0 "Nothing Wasted" (code 95, tag `v4.8.0`) — the kitchen catches up: recipes for the orphaned goods

### Why this release

The companion to v4.7's crops, and GBP §3.5 (reward-is-an-input): every produced good should feed a
downstream loop or it reverts to a flat gold faucet. Several premium goods dead-ended at Tom's counter —
the Cheese Press's own **Cheese/Fine Cheese**, the orchard's **Apple/Cherry/Plum**, **Starfruit**, and all
**five new crops** from v4.7 had no recipe. Ten dishes close those loops.

### Added — ten recipes (`RECIPES`, `01-data.js`)

Apple Crumble (Cooking 20), Cheese Toastie (26), Cherry Tart (34), Starfruit Sorbet (38), Asparagus Quiche
(46), Plum Pudding (52), Cloudberry Preserve (58), Frostmelon Ice (64), Peony Cordial (78), Dragonfruit
Parfait (84 — closes Fine Cheese too). Each is priced at **~1.4–1.5× its ingredient cost** (verified
margins 1.42–1.57), so cooking always beats selling the raw good; the sell tracks the *ingredients* (a
Starfruit dish is dear at 1480, a Plum dish humble at 720), not strictly the unlock level. They slot into
the Cooking ladder's gaps between the existing 21 dishes, so the skill keeps teaching a new recipe the
whole climb to 90. Pure data: each auto-inherits its plate sprite (from `col`), `ITEM_SELL`, `EDIBLE`, the
Kitchen list, gifting, and the Collection.

One tidy-up: `RECIPES` is now `.sort`ed by level once at load (nothing indexes it by position), so appended
recipes display level-ordered in the Kitchen without hand-placing each into the array.

### Verified

In-browser: all ten recipes present and level-sorted (31 total); every one profitable (sell > ingredient
cost, margins 1.42–1.57); plate sprites generate; `EDIBLE`/`ITEM_SELL` registered; each cooks correctly
(ingredients consumed, dish produced) and is locked below its Cooking level.

## 2026-07-22 — v4.7.0 "A Fuller Table" (code 94, tag `v4.7.0`) — content breadth: seasonal crops + the last two charms

### Why this release

Pivoting from the story arc (Act III + Elias) to *the game itself*: the flesh-out audit's content-breadth
dimension found the crop ladder lopsided by season, and the charm set asymmetric (4 of 6 skills had a
trinket). Both are the highest daily-engagement content per line of pure data.

### Added — five season-locked crops (`CROPS`, `01-data.js`)

The Long Climb (v3.10) filled the *shared* L30–90 desert, but three seasons stayed thin: **Spring**
dead-ended at Rhubarb (L30), **Winter** had only Frostbloom (L14) and Everbloom (L90) — a 76-level hole —
and **Summer** topped at Grape (L64). Filled with: **Cloudberry** (Winter, L35), **Asparagus** (Spring,
L50), **Frostmelon** (Winter, L60), **Peony** (Spring, L75), **Dragonfruit** (Summer, L82). Each is priced
on the same g/level trend as the Long Climb (sell 540→1300, seeds ~0.63× sell) with long grow times so
daily yield (sell/days ≈ 90→163 g) interleaves cleanly with the existing curve — GBP-honest, not a faucet.
Each is pure data and auto-inherits everything a crop gets: the procedural produce+seed sprites (from
`shape`+`pal`), `ITEM_SELL`, the level-gated seed shop, the Cellar's wine+preserves, Tom's per-item demand,
gifting, the Harvest Fair, and the Collection. GBP §9 in one line: a season-exclusive crop makes each
season a rolling content unlock — Spring and Winter now are.

### Added — the last two skill charms (`CHARMS` + `addXP`)

**Heron Feather Charm** (+5% Fishing XP) and **Hearth Charm** (+5% Cooking XP) close the charm-per-skill
gap — Fishing and Cooking were the only two of six skills with no trinket to collect. They follow the exact
Wren-Feather/Amber-Beetle pattern: nest-found (they auto-join the birds'-nest pool, which draws any
undiscovered charm), modest sells (130g), one worn at a time, applied at the single `addXP` choke point.

### Verified

In-browser: all five crops carry correct on-trend fields (sell > seed), both produce and seed sprites
generate, they plant only in season (off-season planting refused, seed not consumed) and the shop lists the
seeds level-gated; both charms are in `CHARMS`/`ITEM_SELL`, apply their +5% at `addXP`, and appear in the
nest pool when undiscovered; the new crop sprites render cleanly. Screenshot confirms the produce art.

## 2026-07-22 — v4.6.0 "The Kept Chair" (code 93, tag `v4.6.0`) — deepening Elias + the valley's voice on Warding

### Why this release

The flesh-out audit's #3 pick, and the natural companion to the just-completed Act III: **Elias is now
the most load-bearing character in the game** — the last Warden, the author of the Ledger the whole spine
hangs on, Maya's father — yet he had *zero heart events and no birthday*, and the entire v4 Warding layer
drew exactly one line of village dialogue (Elias at the door). All of this is pure data into engines that
already accept any NPC id (HEART_EVENTS, BIRTHDAYS, NPC_RECOG), so it's high value at low risk.

### Added — Elias's heart-event arc (`14-story.js`)

Four scenes, the *domestic* counterpart to the Ledger's *warden* story (they run parallel and never depend
on which Act III chapter you've reached): **2♥** the koi and sitting still (the thing he taught Maya at
five, then forgot for eleven years); **4♥** he finally opens **Aldous's letter** — eleven years unread —
and lets you read it (a `letter` step; it pays off his standing NPC line about the letter he never opened,
and reveals Aldous kept a chair by the pond for him *and* set a place for you before you were born); **5♥**
he rehearses on you the apology he owes Maya; **6♥** he's said it, made his peace, tells you of **Orla**
(the warden before him — order-safe with the Ledger's reveal) and presses a **Pearl** into your hand.

Two mechanical points worth recording: (1) `heartsOf` caps at 6, so an early draft's `hearts:8` event was
**unreachable** — caught in testing, the four events were redistributed to reachable tiers 2/4/5/6. (2) The
two wing-referencing beats (5/6) presuppose you've taken up the wing, but a player can gift Elias to 5–6
hearts *before* opening the tenth door — so `heartEventFor` gained an optional per-event `req` predicate and
those two events now gate on `tenthDoorOpen` (the 2/4 domestic beats still fire regardless). Both were
flagged and fixed pre-ship (the second by an adversarial canon/tone review).

### Added — Undercroft small-talk + two birthdays

Six `NPC_RECOG` entries (`13-content.js`) give the whole cast a voice on your Warding, the same "shipped ≠
integrated" pass v3.34 did for ice-fishing and geodes — keyed off flags that already exist (`tenthDoorOpen`,
`firstKnotSettled`, `state.wardBest`): Pip (wants to see the stave), Bram (warden-to-quiet-man respect), Tom
(his line of work is safer, for the record), Maya (worry + pride, "keep it a joke"), Rowan (owns the door he
sealed), Nell (word reaches the dairy). Plus `BIRTHDAYS` for **Elias** (Fall 26) and **Nell** (Summer 24),
both clear of existing birthdays and festivals.

### Design — canon kept

A dedicated canon/tone review confirmed: Orla stays distinct from the *living* Nell (Tom's dairy wife);
Maya's mother stays unnamed (as in canon); every Elias fact aligns (Marrow Point, the eleven years, the
unopened letter, the koi); tone matches his measured, grief-touched voice. All additive — nothing taken.

### Verified

In-browser: all four Elias events fire in order at 6 hearts (2→4→5→6), the letter and Pearl both land with
no error; without `tenthDoorOpen`, only 2 and 4 are offered and 5/6 correctly wait; all six small-talk recog
gates are open; birthdays register on clear dates; console clean. Adversarial canon/tone review pre-ship.

## 2026-07-22 — v4.5.0 "The Tenth Lantern" (code 92, tag `v4.5.0`) — Act III completed: the story spine reaches the bottom

### Why this release

A high-level six-dimension audit of the whole game (run as a multi-agent workflow) ranked this the #1
thing to build, and *two independent dimensions* (story and economy) named it the single biggest gap:
V4's founding thesis is **"the story is the spine; skills level as a byproduct"** — yet the spine
dead-ended at chapter 3 / floor 15 while the *systems* already reached floor 45 with a boss and +15
charms. The deep grind had no narrative destination, and a rich, skilled player in the 220–380
total-level band had nothing to work toward. The Warden's Ledger engine shipped in v4.3 was built to be
extended by pure data — so this release is scene + bundle authoring: **five new chapters and the finale**,
carrying Act III all the way to the bottom of the wing and lighting the tenth lantern the whole valley
arc has pointed at since a farmer's letter in Act I.

### Added — Act III chapters 4–8 (the deep rounds)

Appended to `WARD_CHAPTERS` (`15-warding.js`). The arc deepens past what any single warden could keep:
- **ch4 "Past Where He Kept" (floor 20)** — you walk past floor 15, the place Elias turned back every
  seventh day for thirty years; he admits it was never his knees.
- **ch5 "The Door He Nailed" (floor 25)** — Rowan, who sealed the wing with his own hands eleven years
  ago and called it "structural," finally comes *down* the stair, because you made it warm enough.
- **ch6 "The Last Warden's Hand" (floor 30)** — you find the mark of **Orla**, the warden before Elias
  who taught him the round and never rose from it — the real reason he stopped at fifteen. (Orla is a new
  name, deliberately distinct from **Nell**, Tom's living wife at the Butterbrook dairy since v3.44 — a
  canon check during authoring caught the collision before ship.)
- **ch7 "The Deepest Dark" (floor 40)** — you settle the oldest, deepest knot, the one Orla went down
  for; Elias can't make this round, so you walk it for both of you, and come back up for supper.

Bundles are GBP-honest (every material gatherable at or below the chapter's own expedition floor:
Snarlthread f20+, Heartknot from the Great Knots, Deepgnarl f35+, Gloamstar f45) and the gold rewards
escalate 1600→3200, a sensible sink-and-reward curve that finally pays the deep grind a story.

### Added — the Tenth Lantern (the finale)

**ch8 "The Tenth Lantern" (floor 45, the bottom of the wing).** The capstone the nine-wings structure
has always implied: the Warden's craft — the tenth, uncounted for the whole game — is lit and *counted*
at last. Rowan lights the tenth door eleven years late with the valley watching; the run step sets
`state.flags.tenthWingLit`, so the cold planked `olddoor` gains a warm wing-glow for good (a new
`collectLights` case in `06-weather.js`) and the Guild hall — which has been warming a lantern-pair per
chapter via `wardWorldProps` — blazes corner to corner. Elias, who walked home from Marrow Point sure
the wing was lost, finally has "somewhere to hand it." Reward 5000g; the real payoff is the valley made
truly whole. Chapters 4–7 spread their lantern pairs down the sides of the hall (the y=3 row filled in
v4.3); lanterns are walkable decor, so no placement can trap the player.

### Design — the cozy contract, unchanged

Every chapter still asks only a bundle gathered at the player's own pace plus a floor to reach; materials
are taken only on deposit and never re-asked; there is no failure, only a round not yet walked. Nothing
is ever lost.

### Verified

Programmatic in-browser: all 8 chapters fund and close with the correct escalating rewards
(400→5000g) and advance `state.wardChapter` 1→8; the finale scene runs all 67 beats including Rowan's
walk to the door and the live door-lighting, with no error; `tenthWingLit` and every `wardLit` flag set;
the guild ends with 16 lanterns lit and the tenth door glowing; console clean. Screenshot confirms the
hall ablaze with the tenth door aglow. Adversarial multi-agent review (GBP-balance / cozy-correctness /
world-mutation placement) before ship confirmed one low-severity cosmetic bug, fixed here: the ch8 finale
ended with its *own* banner step while `closeWardChapter` also appends a generic closing banner, so the
"❖ The Tenth Lantern" card rendered twice back-to-back (ch1–7 end on a "say" step, so they never doubled).
Fixed at the engine level — `closeWardChapter` now skips the appended banner when a scene already ends on
one (verified: every chapter ch1–8 produces exactly one banner).

### Fixed — a canon collision caught during authoring

A canon pass before ship caught that the dead-warden character I'd first named **Nell** collides with the
*existing, living* **Nell** — Tom's wife and the Butterbrook dairy keeper since v3.44. Renamed the dead
warden (Elias's predecessor and teacher) to **Orla** throughout the chapters and docs; the dairy Nell is
untouched. The rest of the lore the chapters lean on was verified against canon (Marrow Point as Elias's
northern ferry town, the eleven years, Rowan sealing the tenth door).

## 2026-07-22 — v4.4.0 "Hold the Line" (code 91, tag `v4.4.0`) — the Warden's Guard (block/parry)

### Why this release (owner report)

> "There should be a guard function… right now you just have to run away from the hollow guardians.
> There should be a shield sort of click."

Correct diagnosis. Warding combat had offense (the Stave) and dodge (walk out of a telegraph), but no
*defensive* verb — so the Hollow Warden, which clangs off any strike to the front it faces, could only
be answered by circling to its back or running. That's a footrace, not a fight. This adds the missing
verb: a **guard** you can time against an incoming blow, which turns the Hollow Warden into a
bait-parry-riposte duel you can win standing still.

### Added — the Warden's Guard

A **tap** raises the Stave to brace for `GUARD_WINDOW` (0.55s). Inputs, all honouring the owner's
"shield sort of click": **Shift**, **right-click while in the Undercroft** (right-click still interacts
everywhere else — the Undercroft rarely needs it, so it's free for the shield), and a **🛡 touch button**
that appears only in the Undercroft. Costs nothing (energy-free like every Warding action since v4.2.1),
gated by a short cooldown so it can't be held — one press stops one strike.

The block resolves at the game's single damage choke point, `drainResolve(amt, srcX, srcY)` in
`15-warding.js` — every damage source (melee contact, the Great Knot's slam and lunge, the Star-Gnarl's
bolts) funnels through it, so one interception covers them all uniformly. You must **face** the source
(a front-arc dot-product test) — no 360° turtling. Timing is the skill:

- **Parry** (the strike caught in the first `GUARD_PARRY` = 0.25s of the window): **no Resolve lost**,
  the attacker **staggered** (stunned 1.5s, shoved back), and — for a Hollow Warden — its guarded front
  **knocked open** (`cr.guardOpen = 1.8s`), during which `hitCreature` skips its usual frontal clang so
  your next swing lands. A small Warding-XP nod (+6) rewards the read. Bosses shrug off the stun (like a
  struck boss elsewhere) but their blow is still fully negated.
- **Block** (a beat later, still within the window): **¾ of the blow absorbed** (`amt × 0.25`, min 1).

Feedback: a braced arc of light in the facing direction (bright on the parry beat, softer late), a
"⟡ Parry!" / "block" floater, and two new synth cues (`guardParry` a bright ting, `guardBlock` a duller
clop). A one-time toast teaches the guard the first time a Hollow Warden winds up on you (not
`npxGame`-gated, so existing saves get it too).

### Design — skillful but still cozy

The guard can only ever *prevent* Resolve loss, never cause any — nothing is taken, the knockout still
costs zero (cozy contract intact). It stays skillful rather than a safety blanket via three limits: the
**cooldown** (`GUARD_CD` 0.35s after the window), **one strike per press**, and the **facing
requirement**. It no-ops cleanly outside the Undercroft (gated on `inCombatMap()` + the Stave) and resets
on every map change; old saves get `guardT/guardCd = 0` for free from the `freshState` backfill.

### Verified

Programmatic in-browser: parry negates all Resolve loss + stuns the attacker 1.5s + sets `guardOpen`;
block absorbs exactly ¾ (5 of 20) and spends the guard; a hit from **behind** is not blocked and does
**not** waste the guard; the cooldown blocks re-raising; a boss parry negates damage without stunning
the boss; a `guardOpen` Hollow Warden takes a frontal hit (16→10) that otherwise clangs; the guard arc
renders; control-hint + touch button wired; console clean. Adversarial multi-agent review
(balance-exploit / correctness / integration) before ship — it surfaced two low-severity bugs, both
fixed in this release: (1) a parried Star-Gnarl **bolt** staggered whatever creature was nearest the
*player* rather than the Gnarl that fired it (melee was already correct — its source is the attacker's
own centre); fixed by tagging each bolt with its firer and threading it through `drainResolve`'s new
optional `attacker` param. (2) The right-click and touch guard inputs skipped the `!uiBlocking()` gate
the Shift path had, so a guard could be raised (and its arc left frozen) over an open menu; fixed by
self-gating `startGuard()` on `uiBlocking()`, covering all three inputs uniformly.

## 2026-07-22 — v4.3.0 "The Warden's Ledger" (code 90, tag `v4.3.0`) — Act III begins: the story spine

### Why this release

Version 4 shipped its *combat* first (v4.0–v4.2 — Warding, the Undercroft floors 1–45, seven creature
families, the Great Knot). That was deliberate (owner directed the combat deepening ahead of the story),
but it left the pillar the whole version is named for — **"the story is the spine; skills level as a
byproduct along the way"** — unbuilt. The Undercroft was a place to grind with no reason to. This
release gives it the reason: **Act III, told through the Warden's Ledger.**

### Added — the Warden's Ledger (Act III, chaptered)

Elias's old book of rounds, now kept by the player. It sits by the tenth door in the Guild (`wardledger`
object, `genGuild`) and drives a **self-contained chapter progression** — deliberately NOT modelled as
`QUESTS` entries. Two reasons: (1) the `questIdx` chain is a raw index, fragile to touch, and its
report-in machinery wants a fixed guild NPC the Undercroft story doesn't have; (2) an independent
`state.wardChapter` / `state.wardBundle` pair is trivially save-migratable (backfilled by `migrateSave`'s
generic loop, zero new migration code) and can't corrupt the main quest line. Data + pure helpers live in
`15-warding.js` (`WARD_CHAPTERS`, `wardChapterDef`/`wardBundleRemaining`/`wardExpeditionDone`/
`wardChapterReady`/…); the panel, deposit and close-flow in `10-ui.js`.

Each chapter asks two things at once — a cross-skill **bundle** (deposited *partially, from anywhere*, on
the proven Pledge-Ledger pattern: materials are `take()`n on deposit and remembered in `state.wardBundle`,
the ledger keeps the remainder, the player never re-carries a completed portion) **and an expedition
beat** (reach a floor / settle a Great Knot — `state.flags.firstKnotSettled`, now set in `settleCreature`).
When both are met, **Close the page** at the book: a short scene plays and the next page opens. The three
opening chapters — *Relighting the Rounds* (f5), *The Old Rounds* (f10 + a Knot), *What the Thread
Remembers* (f15) — are GBP-honest: every material a chapter asks for is gatherable at or above the floor
its own expedition names.

### Added — the wing heals where you can see it

The point of a story spine is that progress is *felt*, not read in a panel. Closing a chapter warms the
Guild: a lantern pair lights along the back wall (`wardWorldProps`, reading `state.flags.wardLit1/2/3`),
one pair per chapter — the same emotional beat as relighting the nine wings, and applied *live* to
`curMap` during the closing scene so the light catches while Elias speaks, not on the next entry. The
lanterns sit on the furniture row (y=3), where objects already block and the player never needs to stand.
Chapter 3 brings Maya down to paint the wing she used to fear — the register's "a place stops being a
wound when someone who isn't a warden wants to stand in it."

### Design — the cozy contract, kept

Nothing here can be lost. Bundles only ever take what the player chooses to set down (`contributeChapter`
caps every take at what's *owed* and what's *held*); `closeWardChapter` is guarded by `wardChapterReady`
and consumes nothing further (the materials are already in the book); there is no failure state, only a
round not yet finished. A save that dies mid-closing-scene reloads consistent (the deposit persisted, the
chapter simply hasn't advanced — re-close it).

### Verified

Programmatic in-browser: bundle deposits take *exactly* what's owed (leftovers kept), the expedition gate
honours both depth and the Knot, closing sets the world flag + places the lanterns + pays the reward +
advances + resets the bundle; chapter-2 gating requires both floor 10 and a settled Knot; the panel
renders the tally with carry-counts; the ledger sprite and both lit lantern pairs render in the Guild;
console clean. Adversarial multi-agent review (cozy-contract / save-migration / deposit-math /
integration) before ship.

## 2026-07-19 — v4.2.1 "Easy Does It" (code 89, tag `v4.2.1`) — energy fixes (owner report)

### Changed — Warding costs no energy

The Stave's swing no longer calls `spendEnergy` (owner call: "stop using energy on combat, it just
gets in the way — there's already a health bar limiting"). Resolve (drained only by a restless
thing's touch) is the combat limiter, and the v4.0.3 health bars/hitsplats already pace the fight;
an energy tax on every swing was redundant friction. Consequence: the **★ Steady Ward (25)** mastery
("some settling swings cost no energy") was now a dead perk, so it's **repurposed** — settling a
restless thing now **restores +8 Resolve** (a small self-sustain that rewards clearing a room),
implemented in `settleCreature`.

### Fixed — a missed watering can no longer drains energy

`useTool`'s **Can** branch called `spendEnergy(1)` *before* checking whether any tilled soil was in
reach, so watering empty ground (or already-watered soil) still cost energy and then toasted "Nothing
to water there." Now it filters the waterable tiles **first** and returns without spending on a miss —
matching how the Hoe, Axe, Pick and Rod already gate energy behind a valid target (owner: "much like
when you use tools but miss, it should not drain any energy"). A real water still costs 1, as before.
Verified in-browser: 5 Stave swings drain 0 energy; a Can miss drains 0, a real water drains 1; Steady
Ward restores 8 Resolve on a settle.

## 2026-07-19 — v4.2.0 "Deeper Still" (code 88, tag `v4.2.0`) — the top of the Warding ladder + ranged combat

Owner: "continue." Completing the Warding **creature ladder** — the skill now has a family at every
rung of the unified tier ladder (1/10/20/30/45/70/85), matching the tools/ores/trees. Shipped by
extending the Undercroft (floors 31–45) rather than opening the roadmap's dedicated deep venues (the
Gloam Grove ring, the Sunken Workings) — those remain, folded into a later release; noted in
`V4_PLAN.md` §5. Contract intact (§8): nothing taken, knockout free, creatures/projectiles only in
the Undercroft.

### Added — two top-tier families, one of them a first for the game

- **Deep Knot (L70, `charger`)** — telegraphs then **charges in a straight line**; if the charge
  hits a wall it **stuns itself** (a long recovery window to punish). Dodge-and-punish combat.
  *Bug caught in testing + fixed:* `moveCreature`'s `moved` flag is `true` even for a fully
  wall-blocked pure-axis charge (its other-axis check is a no-op on the standing tile), so the
  wall-stun never fired — now detected by **actual displacement** (`hypot(cr − old) < sp·0.5`).
- **Star-Gnarl (L85, `ranged`)** — **the game's first ranged enemy.** It keeps its distance (kites
  away if you crowd it, aggros from 5.5 tiles) and, after a telegraph, **lobs a slow star-bolt at
  where you stand** — sidestep it. New lightweight `wardBolts` projectile system (`00-core` array;
  `fireStarBolt`/`updateWardBolts`/`drawWardBolts` in `15-warding`): a bolt travels, drains Resolve
  on contact (respecting i-frames, still a free knockout), fizzles on a wall or after ~2.4s, carries
  its own star-light in `collectLights`, draws between particles and hitsplats, and is cleared on
  `setMap` so nothing follows you out.

### Added — the deep floors, loot & the capstone charm

Floors 31–45 (`WARD_FLOOR_MAX` 30→45) band the new families in; **Warden's Bells** at 35/40/45.
New drops **Deepgnarl** (55g) and the star-touched **Gloamstar** (85g) — both priced under same-band
gather (deepsilver ore 370). They forge the **Starward Charm** (Gloamstar + Heartknot + Diamond →
**+15 max Resolve**, the capstone), and fund the deep bells; Tom's salvage rotates Deepgnarl.

### Balance (GBP) & verify

Settle XP under the deep ore curve (deepsilver L70=1050, star metal L85=1560): Deep Knot 190,
Star-Gnarl 270. New sprites + item icons + per-family glow colours. Verified in-browser: floor-42
spawns (both new families), the Star-Gnarl firing a travelling star-bolt that hits + drains Resolve,
the Deep Knot's wall-stun + punish window, descent 1→45 clean (floor 45 dead-end), old-save
migration. Screenshot of a deep floor with both families + a star-bolt in flight.

## 2026-07-19 — v4.1.0 "The Great Knot" (code 87, tag `v4.1.0`) — the Warding skill, deepened

Owner ask: "continue building… build out the rest of the warding skill." This is the **combat
depth** of the roadmap's v4.1 (V4_BUILD_PLAN §4), shipped ahead of v4.1's *story* half. **Split
recorded** in `V4_PLAN.md` §5: v4.1.0 "The Great Knot" is the Warding-combat deepening; Act III
chapters 1–3, the Warden's Ledger UI, and mastery trials at 50 remain for a later "The Warden's
Ledger" release. Nothing here touches the cozy contract (§8): still nothing taken, knockout free,
creatures only in the Undercroft.

### Added — two new creature families (V4_BUILD_PLAN §4)

- **Hollow Warden (L30)** — a lost predecessor's echo that turns to keep its guarded *front* toward
  you; a frontal Stave strike clangs off (a grey "0" block splat) — you must circle to its side or
  back to land a hit. Slow (speed 14), tanky (hp 16). Drops **Warden's Ash**. The positional gimmick
  the plan calls for ("blocks and must be circled").
- **Gloam Tangle (L45)** — splits **once when first struck** into two **Tanglets** (the parent gives
  no loot; the halves carry it). Implemented in `hitCreature` before damage; `staveSwing` now iterates
  a `.slice()` snapshot so a split's fresh Tanglets aren't also struck by the same swing. Tanglets
  drop **Snarlthread**.

### Added — the first Great Knot (boss)

A named, rooted boss (`greatknot`, hp 42 ≈ 3× a deep creature, xp 360) guarding the descent on every
**10th floor** — on those floors it *replaces* the stairs-knot, and settling it opens the stair at
its root (`settleCreature`). Two clearly-telegraphed moves alternating (`updateGreatKnot`): a
**ground-slam** with a filling danger ring drawn at its exact radius (step outside before it lands)
and a **reaching lunge**. Immune to stun/knockback so it can't be stunlocked. A wider violet health
bar with its name always shown. Signature drop **Heartknot** (+ Warden's Ash ×3) — the core of the
top charm.

### Added — deeper Undercroft + loot sinks

- **Floors 16–30** (`WARD_FLOOR_MAX` 15→30); families band by depth like `oreTable`; **Warden's Bells**
  at 20/25/30 (`bellCost` + the ledger cap raised), each sinking the deeper drops + the deep ore/timber
  ladder (bell30 wants a Heartknot). New drops feed two new charms at the bell workbench — **Wardstone
  Charm** (Heartknot + Warden's Ash ×5 + Sapphire → **+10 max Resolve**, the top Resolve charm) and
  **Settler's Band** (Snarlthread ×6 + Gloam Thread ×12 → **+5% Warding XP**, hooked in `addXP`). Tom's
  daily salvage rotates Warden's Ash / Snarlthread too (the combat-averse trickle continues).

### Balance (GBP-checked) & art

Settle XP stays under the ore curve for the band (gold L30=435 · cobalt L45=720): Hollow Warden 74,
each Tanglet 65 (≈130 for the pair, justified by the extra work), Great Knot 360. Drop sells sit
under same-band gather (Warden's Ash 34 · Snarlthread 42 · Heartknot 130 — a rare boss trophy whose
real value is the charm, not the counter). New procedural sprites (`buildWardingArt`) for all three
creatures + Tanglet + five item icons; per-family creature glow colours in `collectLights`.

### Verified in-browser

Deep-floor spawns (floor 25 → Hollow Warden/Ember Mite/Gloam Tangle), boss floors (floor 20 → a Great
Knot on the stair spot, no normal knot), 200 AI frames clean, and each gimmick: the Tangle splits into
2 Tanglets giving the parent no loot; the Hollow Warden blocks a frontal hit (hp unchanged, "0" splat)
but takes 5 from behind; the Great Knot settle reveals the ladder + drops Heartknot + Ash ×3 + XP.
Screenshot of a floor-20 boss encounter (danger ring, boss bar, both new families with nameplates).

## 2026-07-19 — v4.0.3 "By the Numbers" (code 86, tag `v4.0.3`) — Warding combat feedback

Owner ask: "continue developing the game, especially the warding system. i want health bars and
damage hitsplats with numbers." Delivered as combat *readability & juice* — deliberately kept to
v4.0-tier polish, **not** encroaching on v4.1's reserved content (the Warden's Ledger, Act III
chapters, mastery trials, new creature families, the Great Knot).

### Added — RuneScape-style numbered hitsplats

A new lightweight `hitsplats` system (`00-core.js` array; `spawnHitsplat`/`updateHitsplats`/
`drawHitsplats` in `05-particles.js`, alongside the floaters): a small colored blob drawn on the
pixel canvas with the number stamped **crisp on the text overlay** (same trick the floaters use), so
the digits never mush at the 4× upscale. Kinds colour it — **red** a hit you deal, **violet + larger**
the settling blow that finishes a creature, **blue** the Resolve a restless thing takes off you. Fired
from `hitCreature` (the damage dealt, capped at the target's remaining HP), the stair-knot swing, and
`drainResolve` (replacing the old `−N resolve` floater). Wired: `drawHitsplats()` between
`drawParticles` and `drawFloaters` inside the camera transform (so the blob is world-space and its
number aligns); `updateHitsplats()` inside `updateParticles`. Capped at 60 and cleared on `setMap`, so
no splat piles up or bleeds onto a safe map.

### Added — creature health bars + nameplates

`drawCreature` now draws a compact health bar (green → amber → red by HP fraction) over any **engaged**
creature — one that's aggroed/attacking (`cr.state !== "idle"`) or recently struck (`cr.hpBarT`, set on
each hit, ~2.6s lifetime, decremented in `updateCreatures`). Above the bar, once you've actually hit it,
its **name · Lv** (e.g. "Knot-Shambler · Lv10"), queued crisp. Idle wanderers stay unlabelled, so the
screen only fills with combat info when there's combat.

### Added — first-descent combat tip

The very first time you enter the Undercroft (`state.flags.wardTipSeen`), a one-time banner explains the
settling swing (Space) and the Resolve bar (refills on safe ground; a knockout costs nothing) — later
descents fall through to the existing bell hint.

Verified in-browser: mid-map combat scene with two shamblers showing "Knot-Shambler · Lv10" nameplates
+ green health bars, a red "2" hitsplat on a struck creature, a blue "15" on the player, the telegraph
ring on an ember mite; and a killing blow producing the violet "settle" splat + the drop.

## 2026-07-19 — v4.0.2 "Clear View" (code 85, tag `v4.0.2`) — a HUD the player controls

### Added — dim/hide the heads-up display (owner report: the HUD blocks the map's edges & corners)

The overlay HUD (`#hud`: clock, gold, energy/Resolve bars, XP orbs, quest tracker, toasts) is drawn
over the game view, so near a map edge or corner — where the camera clamps and real map content
reaches the screen edge — it hides that content (the quest tracker's 36%-wide right column and the
31%-wide energy bar are the worst offenders). Rather than re-lay-out the HUD for everyone, this hands
the player the control they asked for:

- **Settings ▸ Heads-up display** — an On/Off toggle + a dimmer slider (20–100%), matching the v3.45
  audio rows. Dim it and the map shows *through* the HUD; switch it off for a fully unobstructed view.
- **U** toggles the HUD any time (a banner, drawn *outside* `#hud`, confirms — since the toast layer
  itself may have just been hidden). Added to the on-screen controls hint.
- The preference **persists to `localStorage` (`hs_hud`)** like the audio prefs — a display
  preference that follows the device, not the save file — and is re-applied on every play-start.

**Scoped to `#hud` only:** the hotbar, dialogue, and banners live outside it and stay fully crisp, so
dimming/hiding never costs you your selected tool or a line of story. Implemented via a CSS custom
property (`--hud-op`) rather than setting `opacity` directly, so the cutscene fade
(`#stage.cine #hud{opacity:0}`, higher specificity) still wins during scenes — verified: HUD opacity
computes to 0 mid-cutscene even with the dimmer at 100%.

Verified in-browser at a clamped map corner: baseline occlusion → 35% dim (pond/land visible through
the HUD) → full hide (map entirely clear, hotbar retained) → toggle back to the chosen dim →
persistence across a page reload.

## 2026-07-19 — v4.0.1 "Sure Footing" (code 84, tag `v4.0.1`) — collision fixes

Two "stuck in a solid" bugs, both fixed at the root with the engine's own canonical collision
test (`blockedAt`, the 4-point feet bbox) + the `unstick()` safety net, instead of ad-hoc
single-tile checks.

### Fixed

- **Knockback could wedge the player in a wall (v4.0 regression, owner report).** `drainResolve`'s
  knockback moved the player with `wardWalkable` — a *single* tile-center test — so a shove that
  landed the player at a sub-tile offset near a wall corner passed the check while the feet bbox
  actually clipped the wall, leaving them stuck. Now the knockback uses `blockedAt` (the same
  4-point bbox the player's own movement uses), axis-separated like normal movement, then calls
  `unstick()` as a guarantee. **Verified by an exhaustive in-browser sweep: 18,744 wall-adjacent
  knockback cases (sub-tile offsets × 8 angles) — the old logic stranded the player 1,525 times
  (~8%); the new logic, 0.**
- **Planting a tree/hive/machine/décor at a tile edge could trap you on it (pre-v4, long-standing).**
  Permanents are placed on the *faced* tile, but the player's feet bbox can already overlap that
  adjacent tile when standing near its edge — so a just-planted solid could make the player
  `blockedAt` and stuck. `plantPermanent`'s call site now calls `unstick()` afterward (a no-op when
  the placement was refused or the player is already clear), nudging you off the newly-solid tile.

### Why the earlier v4.0 knockback test missed this

The v4.0 combat test knocked the player from exact tile *centers*, where a 12px shove overshoots
straight into the wall tile — which both the old and new logic correctly refuse. The real fault
only appears at sub-tile offsets (the player mid-stride when hit), which the release test didn't
cover. The new sweep exercises the full offset×angle space.

## 2026-07-18 — v4.0.0 "The Tenth Door" (code 83, tag `v4.0.0`) — Version 4 begins

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

### Added — the loot economy: bells, charms, salvage

- **Warden's Bells** on floors 5/10/15 are checkpoints on the same Pledge Ledger as the Old Lift and
  the waystones — funded in cross-skill deposits (gold + settle drops + timber/ore, so warding never
  self-funds its own checkpoints), then ringable-down-to forever. The bell panel clones the lift's,
  and doubles as the **Warden's workbench** where settling drops become the two crafted charms
  (**Warded Charm** — Gloam Thread×6 + Wool + Opal → +5 max Resolve; **Emberlight Charm** — Ember
  Grit×4 → a much wider lantern), extending the v3.3 one-charm-worn system rather than adding armour.
- **Tom's warden's salvage** — the non-combat trickle (V4_PLAN §2): one warding material a day offered
  to buy in Tom's shop, an **explicit buy row with its own button** (never an auto-drain on talk —
  honouring the owner's standing UI feedback), so a combat-averse save can still finish the story,
  slower. Only appears once the tenth door is open.

### Added — Act III opener: "The Tenth Door"

- The quest (giver Elder Rowan; gated on Act II done + total level 100) appends to the linear chain as
  the first **Act III — The Untended** beat (the Journal grows a third act header). Its turn-in is a
  restrained cutscene in the "One Last Letter"/Homecoming register: Rowan finally owns nailing the
  tenth wing shut, Elias — revealed as the last Warden, welded to the shipped "Elias's old workroom"
  canon — takes his own boards down and gives the Basic Stave, reframing combat as *tending* ("you
  settle them; there's a difference, and it's the whole of the craft"). Sets `tenthDoorOpen`, and the
  door's examine + interact become the Undercroft mouth. A quiet Elias recognition line follows once
  the door's open.

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
