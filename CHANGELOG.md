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
