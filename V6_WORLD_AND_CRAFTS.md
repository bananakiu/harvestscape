# The World & the Crafts — the expansion plan

> **Status:** plan, not built. Produced 2026-07-29 from two owner directions given minutes apart:
> *"i want to make the game world bigger. there are too few places. we want a lot more"* and
> *"a lot more to do. maybe there aren't enough skills. afterall, there should be 10 crafts"*
> (`DEVLOG.md`, same date).
>
> **How this was produced:** a three-surface sweep of every shipped string in the game (examine text
> and signs; all dialogue, heart events and scenes; letters, almanac pages, quests and the design
> docs), four parallel craft designs, one weave, and two independent verifiers. ~2.3M tokens.
> **Both verifiers returned FIX_FIRST** — their findings are §4, and they are build constraints, not
> suggestions.

---

## 0. The two findings, verified against the code

**The world is seven places.** 18 maps, but nine are one-room interiors and two are procedural
single screens. The places you can actually walk around in: farm, village, beach, coast road, ridge,
Butterbrook, grove.

**The Guild is nine crafts and the game trains five.** `WINGS` (`14-story.js:8`) names nine craft
wings; `freshState().skills` lists six skills, one of which (Warding) is the tenth wing. So
**Ranching, Foraging, Smithing and Hearthcraft** are crafts the game names, lights a window for, and
never lets the player practise — each lit by a one-time threshold (*own one hen · forage ten things ·
upgrade tools twice · hold the festival*) and meaningless forever after.

Each already has mechanics doing nothing for it: Ranching has animals, petting, friendship and Large
produce; Foraging has `state.stats.forage` and four wild-gather maps; Smithing has the seven-tier
tool ladder, the `toolUpgrades` stat and a forge; Hearthcraft has the festivals.

★ **The Guild of Nine Crafts is the premise of the entire story.** Building these is not inventing
content — it is paying a debt the premise has carried since v1.0.

---

## 1. ★ The method: build what the game already promised

Proven three times now (v6.0's two households; v6.1's ferry mooring; this sweep). **The game's fiction
is consistently more generous than its mechanics.** A promised place arrives with its fiction
pre-written, its existence already justified, and usually its art half-described. An invented place
has to earn both from scratch.

The sweep found **72 places the game names but will not let you visit — 45 of them named *and*
located.** That is not a content gap to be filled by imagination; it is a backlog.

### The five sharpest, and why

1. **Marrow Point** — the most pre-written place in the game. A milestone the player can examine
   carved `MARROW POINT — 39`; **two** signposts; a resident (Elias worked its ferry for eleven
   years); a ferry route that now genuinely runs (v5.8's trader, v6.1's Thea); and — the detail that
   settles it — **a working lighthouse that already renders**, blinking every 600ms in the ridge
   panorama (`10-ui.js:1450`). The atlas's own prose closes the case: *"The road runs on north; the
   map never will."*
2. **The Festival Green** — ★ the sharpest instance of the pattern in the whole game. A **sign** has
   stood on the player's own farm meadow since v3 reading *"Festival Green"* (`04-world.js:296`), a
   shipped writ (v5.9) buys it trestles and a canopy, and **no festival has ever been held there** —
   every one stages on the beach.
3. **Elias's ruined house on the ridge** — on a map that already exists and is walkable, described
   down to the roof, the kitchen and the birch growing in it. Elias is the only named resident in the
   game with no interior at all.
4. **The Guild kitchen and larder** — Pip's shipped Cooking-50 trial has the player *build the
   furniture for a room that does not exist*; a shipped writ stocks a larder that does not exist.
5. **The Point** — Bram's 10♥ capstone **takes you there in dialogue** and the game cannot show it.
   The reverse-panorama is already written: the ridge cairn shows the valley from above; the point
   shows it from the water.

### The located backlog (43 unique)

| Place | Named at | The shipped text that promises it |
|---|---|---|
| **Marrow Point** | `game/js/14-story.js:1239` | Bram: "He isn't at the ports. Hasn't been, not once in eleven years. He's at Marrow Point — forty miles up the coast — working a ferry for a man half … |
| **Elias's old house on the ridge — the ruin with the birch** | `game/js/14-story.js:1387` | Elias (8♥): "…I went to the house. My old one, on the ridge. First time in eleven years." / "It's a ruin. Roof's gone. There's a birch growing where t… |
| **The Guild's nine (now ten) craft wings — as places rathe** | `game/js/14-story.js:8` | Rowan: "I am Rowan — last keeper of the Guild of Nine Crafts. Look around: nine wings, all gone dark." (13-content.js:1153)  ·  Rowan: "I walk the who… |
| **The Guild larder** | `game/js/01-data.js:1179` | Writ 'The Guild Larder': "The hall feeds whoever turns up, and lately that is rather a lot of people." / done: "The Guild larder is full for the first… |
| **The Guild kitchen (and its long table)** | `game/js/01-data.js:2860` | Pip (Cooking trial 50, 'The Long Table'): "Because the Guild kitchen has no table. It has a plank. On two barrels. It's an insult." / ask: "Pip wants … |
| **Sable's back room — the shelf of forty-one uncollected j** | `game/js/14-story.js:1519` | Sable (6♥): "There's a shelf in the back you've not seen. Come on then." / "Every one of these is somebody's. Made up, labelled, never collected. Fort… |
| **Ada's mother's room, and her small loom with the unfinis** | `game/js/14-story.js:1465` | Ada (8♥): "I went and stood in my mother's room. First time. Eleven years and I'd been sleeping two doors down from it and not going in." / "There's a… |
| **Nell's cool room (the ageing cellar under the creamery)** | `game/js/14-story.js:1323` | Nell: "A good cheese only wants three things: clean milk, a cool room, and patience. Two of those I can supply. The patience is on you." (13-content.j… |
| **Bram's boat — the new hull named after you — and the wat** | `game/js/14-story.js:1421` | Bram (8♥): "The new one. She's finished. And I've not painted the name on yet because I've been arguing with myself about it for a fortnight." / "…It'… |
| **The open water past the ferry landing — Bram's lost fish** | `game/js/01-data.js:2852` | Bram (Fishing trial 75, 'The Long Water'): "There's water out past the ferry landing I've not fished in eleven years, and it is not because I got old.… |
| **The Boatyard** | `game/js/01-data.js:1187` | Writ 'The Boatyard': "Bram has three hulls half-built and a shortage of everything that finishes a hull." / done: "Three boats, finished, on the sand.… |
| **Tom's mill (his saw, his mill bed) — and the smith who w** | `game/js/01-data.js:2812` | Tom (Woodcutting trial 50, 'The Sawyer's Bargain'): "Before you go swinging at anything bigger, we're fixing my saw, because you BROKE my saw." / "Cop… |
| **Rosa's seed vault, and the cold-room under the barn** | `game/js/01-data.js:2803` | Maya (Farming trial 75, 'The Seed Vault'): "Rosa kept a seed vault — every strain she ever grew, labelled, cold, patient. It rotted out the winter aft… |
| **The grove's east ring, and the west ring Grandad Alder f** | `game/js/01-data.js:2819` | Tom (Woodcutting trial 75, 'The Standing Grove'): "Frame the grove's east ring — heartwood posts, so the young trees come up straight instead of leani… |
| **Pip's plot behind the shop** | `game/js/14-story.js:1371` | Pip (8♥): "So anyway I have a trowel now and I'm going to be SO GOOD at this. I'm starting behind the shop. Mum says the light's wrong there. Mum is W… |
| **The old well** | `game/js/01-data.js:1936` | Patron commission 6, in the funded-works list the panel prints by name: "the old well's winch" |
| **Tom's back room** | `game/js/14-story.js:1369` | Pip (8♥): "He didn't even say anything for AGES. And then he went in the back and came out with a trowel. HIS trowel. From when HE was little. He'd ke… |
| **Orla's bench and the warden's workroom, down in the wing** | `game/js/15-warding.js:865` | Warden's Ledger request: "Six good eggs for the bench, if your hens can spare them. Orla kept a pan down here. I never had the heart to move it." / do… |
| **The north lane (village)** | `game/js/14-story.js:1490` | Corin (6♥): "The wall along the north lane was leaning when we left, and I thought about it in another town for eleven years." / "…It's straight now. … |
| **Elias's old house, on Starfall Ridge** | `game/js/14-story.js:1387` | "…I went to the house. My old one, on the ridge. First time in eleven years." / "It's a ruin. Roof's gone. There's a birch growing where the kitchen w… |
| **The Guild kitchen** | `game/js/01-data.js:2862` | "Which we CAN'T. Because the Guild kitchen has no table. It has a plank. On two barrels. It's an insult." / "Maple top, copper pans hung over it, and … |
| **The Point (the headland beyond the coast)** | `game/js/14-story.js:1425` | "Out past the point, where I've not taken anyone. Sit still and don't talk for a minute. …Right. Now look back." / "That's the whole valley from the w… |
| **The Festival Green** | `game/js/04-world.js:296` | obj[key(27,28)] = { kind:"sign", text:"Festival Green" };  ·  and the writ: "The Green wants proper trestles and a canopy before the next festival, no… |
| **The village's north lane** | `game/js/14-story.js:1490` | "That's her reason. Mine's smaller. The wall along the north lane was leaning when we left, and I thought about it in another town for eleven years." |
| **Rosa's seed vault — the cold-room under the barn** | `game/js/01-data.js:2803` | "A cold-room under the barn: silverwood framing, cobalt fittings, and something sweet on the shelf to prove it keeps." / "Rosa kept a seed vault — eve… |
| **The Sealed Vault (the deep mine's chamber)** | `game/js/01-data.js:2510` | "The deep vault, shut and waiting on the Star-Metal."  ·  Grandpa: "It is behind the seal, and it will still be behind the seal when I am gone… Whoeve… |
| **The Gullwater's upper river and the hills it comes down ** | `game/js/13-content.js:675` | sign: "The Gullwater — mind the boards"  ·  "Grayling: The lady of the stream — a sail of a fin, violet in the right light. The Gullwater's pride." |
| **Whatever sleeps at the Heart of the Forest** | `game/js/08-actions.js:1211` | "The oldest tree in the valley — older than the Guild, older than the road. Its pale bark is warm under your palm, and for a moment the whole wood see… |
| **The Stable's interior** | `game/js/04-world.js:201` | // v3.22: the Stable — an open-fronted stall, no interior (the horse is summoned with H, not entered).  ·  m.objects[key(32,6)] = { kind:"sign", text:… |
| **The Gloam Grove (a gloam-touched tenth grove ring)** | `V4_PLAN.md:98 (also V4_PLAN.md` | V4_PLAN §2: "v4.x: the **Gloam-touched grove ring** (a 10th ring past the waystones)"  ·  V6_PLAN: "the **Gloam Grove ring** opens off the grove at Wo… |
| **The Sunken Workings** | `V4_PLAN.md:98 (also V4_PLAN.md` | V4_PLAN §2: "**the Sunken Workings** (behind the deepest lift stop — finally a reason the lift goes that far)"  ·  V6_PLAN: "the **Sunken Workings** o… |
| **The nine (now ten) craft WINGS of the Guild** | `game/js/13-content.js:190-192 ` | The Guild's own sign: "Nine crafts. Nine wings. Tend them all, and the valley wakes." (after the finale: "Ten crafts. Ten wings. All tended, all lit —… |
| **The seed vault (a cold-room under the barn)** | `game/js/01-data.js:2801-2807` | Maya, Farming-75 trial: ask: "A cold-room under the barn: silverwood framing, cobalt fittings, and something sweet on the shelf to prove it keeps." / … |
| **The grove's east ring and Grandad Alder's west ring** | `game/js/01-data.js:2818-2823` | Tom, Woodcutting-75 trial: "Don't cut anything. Frame the grove's east ring — heartwood posts, so the young trees come up straight instead of leaning … |
| **The water out past the ferry landing / out past the poin** | `game/js/01-data.js:2850-2856 (` | Bram, Fishing-75 trial: "There's water out past the ferry landing I've not fished in eleven years, and it is not because I got old." / "It's because t… |
| **The north lane (Willowbrook Village)** | `game/js/14-story.js:1490-1491` | Corin Wren, 6♥: "The wall along the north lane was leaning when we left, and I thought about it in another town for eleven years." / "…It's straight n… |
| **The cool room / the cheese cellar at Butterbrook** | `game/js/13-content.js:1193 (al` | Nell's order line: "Straight to the cool room with these. In a month they'll be somebody's Sunday."  ·  the dairy sign: "'Clean milk, a cool room, and… |
| **The old well (Willowbrook plaza)** | `game/js/01-data.js:1936` | PATRON_WORKS[5] = "the old well's winch" — a named civic commission the player funds from Rowan's ledger |
| **Marrow Point's light (the lighthouse)** | `game/js/01-data.js:335 (also 1` | CHANGELOG v3.43: "...and far up the coast, if you watch a moment, a light blinking at Marrow Point."  ·  the panorama code: "Marrow Point's light, far… |
| **Whatever is under the Heart of the Forest** | `game/js/08-actions.js:1210-121` | Examining the hearttree: "The oldest tree in the valley — older than the Guild, older than the road. Its pale bark is warm under your palm, and for a … |
| **Below the bottom of the wing — 'the valley's own roots'** | `game/js/15-warding.js:1078 (al` | Warden's Ledger ch8: "The bottom of the wing. Floor forty-five — nothing below it but the valley's own roots."  ·  source comment: `const WARD_FLOOR_M… |
| **The Millbrook / 'Upriver', and the Old Mill** | `WORLD_EXPANSION.md:190-192` | WORLD_EXPANSION §5 Not planned: "**The Millbrook / \"Upriver\"** — cut: its river duplicates the Coast Road's (the one-river rule) and its overlook du… |
| **The Collections / museum wing in the Guild** | `DESIGN_REVIEW.md:168` | DESIGN_REVIEW v1.4 roadmap: "Collections/museum wing in the Guild (donate one of everything)" |

Plus 19 *named* and 8 *alluded* (the city ports, the coast cities, the northern run, the town three
coasts north, the valley's burial ground, the player's mother). Those are fiction that should
probably stay off-map — a valley whose horizon is fully walkable stops having a horizon.

---

## 2. The four crafts

Each is a full 1–99 skill with mastery at 25/50/75/99, a caring NPC, a cape at 99, and trials at 50
and 75 on v5.1's shipped engine. Total level goes **594 → 990** (derived; `checkValleyMaster` and the
crown re-target themselves).

- **Ranching** — animals become a craft: coat quality, breeding, herding, pasture. Wants **new
  grazing ground**.
- **Foraging** — the craft most obviously served by new places. Wants **wild country**.
- **Smithing** — ★ **the best ladder the graders have seen in this game: 0.0% dead, 31 marks, largest
  band 5 levels.** It is the template the other three must copy. The design's hard problem, solved
  explicitly: today a Star Metal Pick is gated on *Mining* 85, and moving that gate to Smithing would
  make six skills wait on a seventh.
- **Hearthcraft** — the hardest. Its ladder **games the linter**: 0.0% on paper, bought by keeping
  every empty band at exactly 5–7 levels, one under the 8-level threshold. See §4.

---

## 3. The release train

Sequenced so each release ships alone, and **so that no skill key ever lands before its own tables**
(§4, blocker 2).

| Release | Contents |
|---|---|
| **The Promised Coast** | Marrow Point + the Point + the boatyard — the coast road's north end opens at last, on the ferry that already runs. |
| **The Green** | The Festival Green becomes real: festivals move to the sign that has stood since v3. |
| **Hands (Smithing)** | The template craft, with the forge and Fenn the smith. |
| **The Wild (Foraging)** | The craft + the wild places it needs: the upper Gullwater, the ruin on the ridge, the hollow. |
| **The Flock (Ranching)** | The craft + pasture. |
| **The Hearth** | Hearthcraft, the Guild kitchen and larder, the rooms behind the hall. |
| **Rooms** | The remaining interiors: Sable's back room, Ada's mother's room, Nell's cool room, Tom's back room, the stable, Thea's cell, the north lane. |

---

## 4. ★ Build constraints — the verifiers' findings, applied

These are not suggestions. Both verifiers returned **FIX_FIRST**; these are why.

### Blockers

1. **Ranching's and Foraging's ladders do not exist yet.** The weave said "ship the supplied ladders
   unchanged" and never inlined them, so they are **ungradeable** — and the skeletons that *are*
   stated score **88.5% dead**, identical to a bare tool-tier ladder. Write both tables at Smithing's
   detail before either release is cut.
2. **★ A skill key must NEVER land before its own tables.** `nextMastery` (`08-actions.js:234`) does
   `MASTERY[skill][n]` — adding a key to `freshState().skills` without a matching `MASTERY` row
   **hard-crashes the Skills panel**. Every craft's `MASTERY`, `MASTERY_PRAISE`, `MASTERY_NPC`,
   `TRIALS` and `SKILL_ICON` rows ship in the same commit as its key, or not at all.
3. **The `ground:` pledge prefix would write `NaN` into `state.liftStops`.** `pledgeCost`
   (`01-data.js:1955`) has no `ground` branch, so it falls through to the `lift` parse. A new prefix
   needs all five branches plus `completePledge`, exactly like `trial:` and `room` did.
4. **The vault map has no gate on a save that already opened it.** `genMine` places the sealed door
   only while `!foundVault`; the mirror placement (when it *is* true) does not exist.

### Serious

5. **Hearthcraft games the linter.** 0.0% on paper, **39.1% as it actually ships** — every empty band
   sits at exactly 5–7 levels, one under `LADDER_GAP_WARN`. It has no tool, so it inherits none of the
   six free `TIER_LEVEL` marks the others get, and needs *more* authored rungs than they do, not
   fewer. **Hold every ladder to Smithing's shape (~30 marks, max band 5, 3+ marks above L85), not to
   the linter's threshold** — which Hearthcraft proves is passable while half-dead.
6. **Missing mastery rungs**: Smithing has no ★ at 75, Hearthcraft none at 25. C3 requires all four.
7. **Six of the eight trials are unwritten.** Foraging specifies neither; Ranching names both only as
   venues. All eight need the shipped `TRIALS` row shape and a GBP cost pass.
8. **The hotbar stops at key 7** (`10-ui.js:2628`, `"1234567"`). A Crook, Trug and Hammer appended at
   indices 7–8 are unreachable by keyboard.
9. **`DRAW_ANIMAL` would be a boot-killing TDZ** if declared where the plan implies — `drawChicken`
   and friends live in `07-entities.js`. Name the owning file for every new table.
10. **Uncapped persists**: `m.meta.worked` and `state.marks` are never swept, against a save-size
    budget with only 1.5× headroom. Add a dawn sweep and a hard cap.
11. **The crown grandfather is misplaced** — `s.flags` is not guaranteed to exist that early in
    `migrateSave`.
12. **`WING_REQ` does not throw** when a wing's requirement changes — the atlas only asserts the wing
    *count*. Re-wording it is a manual edit no harness catches.

### Measured headroom

`map gen (all maps)` is **4.43 ms against a 13 ms budget**; slowest single map 1.01 ms. Many new maps
are affordable — but **`map gen (slowest)`, not the sum, is the gate**, and every map-shipping release
re-records with `node tools/check-perf.mjs --set`.

---

## 5. What this plan does not answer

**Whether any of it is fun.** Sixteen releases have shipped since anyone played this game, and both
directions behind this plan were formed on v4.37 — before the trials, the tonics, the boss ladder, the
cottage, the ten-heart cast, the writ, or the four new neighbours existed. The sweep's findings are
structural and verifiable; *"does Ranching feel like a craft or like chores with a number attached"*
is not, and no harness in this repo can answer it.
