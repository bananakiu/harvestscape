# World Expansion — the plan

> **What this is.** The plan for growing HarvestScape's geography, in the mold of
> `GROVE_DEPTHS.md`: three new areas, sequenced, each shipping in one release with its own
> renewable verb. Owner's call (DEVLOG, 2026-07-16): *"the world feels small — start planning
> to build out more areas."*
>
> **Status.** Area 1 (The Coast Road) **SHIPPED in v3.36.0**; areas 2–3 planned.
> Line references are against v3.35.0.

---

## 0. Why

The dialogue has been writing cheques the map can't cash. The story sends the player "forty
miles up the coast" (14-story.js:716) toward a north path that doesn't exist; Trout is "a
speckled river fish" living in a pond behind an apologetic comment (01-data.js:531); Tom's
wife runs a dairy "down the coast" invoked five times and drawn never; the mountain that
"learns your name" (01-data.js:1093) has no above-ground presence; and Elias's ridge — eleven
years of watching the umbrellas (14-story.js:1009) — is a line, not a place. The world feels
small because the fiction is bigger than the map. The fix is to build where the fiction
already points.

The world graph today (11 maps, 4 outdoor):

```
              grove(rings 1-9) ⇄ farm ⇄ village ⇄ beach
                                  │        │
                       cottage/coop/barn   store/mayahouse/guild/mine(∞ floors)
   fast travel: minecart farm⇄village · boardwalk · Old Lift (pledges) · waystones (pledges)
```

Every outdoor edge except three is walled: farm-north, beach-north, beach-west, village-NE
(the mine's ridge). Those are exactly where the three areas attach.

---

## 1. The shape

**One rule decided everything: the river exists once.** Three of the four candidates claimed
river fishing as their core verb. A river drawn on three maps is three ponds; a river drawn
once, with a mouth on the sea, is geography. The Coast Road gets it — it cashes the single
biggest cheque (Act II's north path), and its estuary is the only spot where "sea-run" Salmon
and Bram's "something comes up the stream" (01-data.js:560) can both be literally true.

**Vista ownership follows the fiction.** Elias watched the umbrellas from *the ridge* — and
genVillage already calls the mine's NE corner the ridge. Starfall Ridge gets his bench and
the panorama; the Coast Road keeps the ferry landing and the milestone.

**Build order:**

1. **The Coast Road** — biggest fiction cheque, the river verb, cheapest (pure beach-model
   reuse: daily regen, forage nodes, one new waterHere case, no new NPC).
2. **Starfall Ridge** — the only genuinely *new* verb in the set (night/weather-gated
   star-gleaning), and a different direction: up, not along.
3. **Butterbrook** — the dairy cheque, deliberately last: it needs a new named NPC, and
   v3.34/3.35 raised the bar on what an inhabitant must be. Its stolen river verb is replaced
   by the milk round. The Coast Road's ferry (layer v2) seeds her arrival in the fiction first.

The Millbrook ("Upriver") is cut — see §5.

---

## 2. Area 1 — The Coast Road (map id `coastroad`)

**Design.** A tall outdoor map (40×36) climbing north from the beach: the road winds up a
grassy headland, the Gullwater river cuts under an old plank ford and spills to the sea at an
estuary, and the road ends at a weathered ferry landing with a milestone: **MARROW POINT — 39**.
The road is drawn continuing north past the impassable landing; the forty miles stay forty
miles. You come here to river-fish, forage the roadside daily, and — post-Act II — sometimes
find Elias at the landing, looking the other way for once.

**Core verb: river fishing.** New `"river"` context in `waterHere()` (08-actions.js:946),
estuary tile band returns `"estuary"`. Table: Trout rehomed (kept in the pond table too for
one release — log why), Grayling/Chub for Fishing 30–60, sea-run Salmon at the estuary 60+,
and a storm-day rarity via a one-day `newDay` flag (the `stormWrack` pattern,
08-actions.js:1151) cashing Bram's clue verbatim. Secondary: roadside forage nodes on the
beach model (daily seed + `pickedDay` dedupe, 13-content.js:517-519).

**v1 build sketch (one release):**
- `MAPS` entry (13-content.js:8-20): 40×36, outdoor, `music:"auto"`, headland-green bg.
  Daily regen via `mapCache` — zero persistence work. `genCoastRoad` seeds
  `makeRng(base + state.day*prime)`; road/ford/landing on a **fixed** layout seed
  (village's `makeRng(444)` pattern), only nodes reshuffled daily.
- Warps: beach north band x∈20–26, y∈{0,1} `auto` → coastroad south edge; matching return
  band. **doWarp fix required first:** the beach festival intercept (13-content.js:238)
  currently fires on *any* entry to beach — scope it to the village→beach direction or
  north-entry players teleport into a cutscene. `genBeach` clears wrack/palms from the new
  band (the clear-the-approach convention) and the band must not collide with Elias's Act II
  scripted entry at (23,3).
- Registration: `MAP_REGION` + `WORLD_MAP` + a `grid-template-areas` row (style.css:495-502);
  `MAP_ACCESS` prose or the atlas build throws (tools/build-atlas.mjs:139); `tip_coastroad`.
- Set dressing with `EXAMINE_OBJ` text: ford, milestone, landing, the roadside shrine.
- Post-`act2Done` Elias occasionally at the landing: one `spawnMapNpcs` branch
  (13-content.js:735) + `npcRegionNow` case (10-ui.js:587).
- Balance gate: river fish prices/XP and the +tier question (beach grants +1 at
  08-actions.js:967 — river should **not**; differentiate by species) pass
  `GAME_BALANCE_PRINCIPLES` review before numbers land.

**Later layers.** v2: the ferry docks — every N days (or pledge-restored, reusing
contributePledge, 10-ui.js:968-1007) Elias's old ferry ties up and brings a rotating visitor:
the "gentleman from the coast" (01-data.js:837), Tom's wife up with cheese cultures (seeding
Area 3), post from the player's mother. v3: a board-request strand around the ferry + a
seasonal salmon-run week. Marrow Point stays off-map forever, deliberately.

**Owner decisions (2026-07-16).** (a) Ferry cadence: **calendar-fixed visits** — the owner
wants a calendar-driven mechanic to exist in the game (distinct from the pledge pattern); the
v2 ferry docks on fixed calendar days. (b) The storm rarity stays a *cousin* of Stormrider
(weather-gated regular fish), not the legend itself. (c) Ride-through: mount preserved —
default kept.

---

## 3. Area 2 — Starfall Ridge (map id `ridge`)

**Design.** A 46×36 outdoor map of switchbacks climbing from the tree line through scree to
a snow-dusted summit above the mine: the crater dell where the Guild's founding star fell
(13-content.js:597, 701), and a wind-worn bench at the cliff edge — Elias's bench. The cairn
opens a single static procedural panorama of everything below: farm smoke, village, the
umbrellas, the coast road running north to a far blinking light. The game finally shows the
geography its story narrates, from the one spot the fiction promised.

**Core verb: star-gleaning.** Clear-night one-day flag `state.flags.starfall` set in `newDay`
(stormWrack pattern); shards spawn on summit scree from the daily seed, picked once each
(`pickedDay`), gleaned with the pickaxe for Mining XP + Star Shards, rare Star Metal fragment
at the table's bottom. First activity gated by clock and sky rather than tool tier. By day:
alpine foraging (mountain thyme, snowdrops, eagle feathers, crystal outcrops).

**v1 build sketch:** `MAPS` entry (alpine bg `#0a0c12`); `genRidge` with fixed-seed trail +
daily node seed (hand-shaped switchbacks — no BFS-praying); trailhead warp band in village NE
beside the mine mouth (careful diff: mineentrance at 33,3 and story triggers at
14-story.js:206,239 crowd that corner) + return band; 4–5 alpine forage items + EXAMINE text;
starfall flag + shard nodes + Star Shard item; the cairn panorama as **one static canvas
painting keyed to hour/weather** — bounded, never a live second camera; standard
MAP_REGION/WORLD_MAP/CSS/MAP_ACCESS/tip wiring.

**Later layers.** (a) Old Lift summit stop — "the lift once ran to the summit workings" —
pure `rideLift`/`liftStops`/pledge reuse (10-ui.js:877-1007), tying mountain-above to
mine-below in one system. (b) Rowan quest "Where the Star Fell": crater dig, Star Metal
fragment → Guild keepsake or capstone tool. (c) Post-Act II Elias bench scene. (d) Telescope +
constellation journal pages. (e) A thin "summit" music mode (02-audio.js:114-165).

**Balance + design gates.** Shards must not out-earn deep floors (bonus tier, not
replacement faucet); shards spawn at dusk and persist all night so staying up is a treat,
never a DPS requirement against the sleep loop. Wind and snow are dressing only — no cold, no
stamina drain, ever.

**Owner decisions (2026-07-16).** (a) Star Metal fragments are **sellable** at v1 — no
crafting gate pending the Rowan chain. (b) Panorama budget still open — default: one
screenshot-iterated scene, hour-tinted.

---

## 4. Area 3 — Butterbrook (map id `butterbrook` + small `dairy` interior)

**Design.** Off the beach's west end, the coast opens south: wide shore-meadows, dune grass,
a rideable coast path, the brook winding to the sea, and the creamery's red roof alone at the
far end — Tom's wife, finally named and rendered, working the milk the barn has been
"shipping down" since v3.24. The map is generous with nothing: the longest ride in the game,
entrance and creamery at opposite corners, so the distance the dialogue implied survives
contact.

**Core verb: the milk round** (river fishing lives on the Coast Road; the brook here is
dressing and fiction-connective tissue). She buys dairy goods at a rotating daily premium
order — one order/day, seeded off `state.day` — paying gold + Ranching XP, closing the
barn→coast→cheese circle. Extends the v3.33 dairy chain.

**v1 build sketch:** `MAPS` entry (46×36 outdoor) + `genButterbrook` + small `dairy` interior
(genRoom/exitAt helpers, cozy music); beach **west** band warp (x=0, y≈mid-sand) + return —
genBeach clears the approach; her `spawnMapNpcs` branch (creamery by day, meadow evenings) +
`npcRegionNow`; daily order UI on the shop-dialogue model; standard registration set. Ships
her heartless-but-voiced: vendor dialogue must carry personality alone, to the v3.34/3.35
inhabitants bar — this is the release's real cost and the reason it goes last.

**Later layers.** Heart events + Pip-visits-Mum festival appearance (13-content.js:665);
the cheese cellar (age Cheese → Aged Cheese on the keg discipline); Bram's boat as a
pledge-funded ferry beach⇄Butterbrook.

**Owner decisions (2026-07-16).** (a) **Her name is Nell** (owner delegated; "Hazel" was
rejected — it's already in ANIMAL_NAMES, and the dairy keeper must never share a name with a
cow). (b) Hearts at v1 still open — default: deferred, voice-first. (c) Signage discipline
stands: north = Marrow Point / Act II, south = Butterbrook.

---

## 5. Not planned

- **The Millbrook / "Upriver"** — cut: its river duplicates the Coast Road's (the one-river
  rule) and its overlook duplicates Starfall's panorama; the Old Mill/Flour idea is good and
  can attach to an existing map later without new geography.
- **Mapping Marrow Point** — never: it is Act II's engine; walkable would deflate "forty miles."
- **A live second camera / parallax vistas** — engine mismatch; vistas are static paintings.
- **Interconnecting warps between the new areas** (ridge→coastroad shortcut, etc.) — each
  area attaches to the existing spine only; shortcuts are future pledge material, not v1.
- **Any hazard dressing** (river current, cliff falls, cold) — cozy contract, non-negotiable.

## 6. Constraints carried into every build

- **Cozy contract:** no combat, nothing taken, nothing hazardous. Water is pure water; the
  ford is always crossable; the way home is always one interaction.
- **Engine:** tile arrays are fixed-stride 46×36 (00-core.js:16) — all sizes fit inside it.
  Outdoor maps get horse, sky-gradient lighting, weather, and birds free (06-weather.js:66-121,
  07-entities.js:63). All three areas use daily `mapCache` regen — no `migrateSave` work at v1
  beyond the two one-day flags. Every area needs the full registration set (MAPS, MAP_REGION,
  WORLD_MAP, style.css grid row, MAP_ACCESS, atlas regen, tip) or the atlas build throws.
- **Balance:** no fish price, XP value, or shard yield lands without a
  `GAME_BALANCE_PRINCIPLES` pass; the beach and the deep mine stay the incumbents to beat.
- **Verify visually:** every new map ships with in-browser screenshots of dawn/noon/night and
  one rain pass — additive light glares easily.
