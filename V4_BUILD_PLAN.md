# V4 Build Plan — implementation work orders for "The Warden's Valley"

> **Who this is for.** Any AI coding agent (Codex, Claude, Gemini, …) implementing Version 4.
> It assumes you have this repo and **no other context** — everything you need is here, in
> `V4_PLAN.md` (the design), `V4_STATE_OF_THE_GAME.md` (the baseline), and the code itself.
>
> **How to use it.**
> 1. Read `AGENTS.md` first — the standing rules (changelog discipline, commit cadence,
>    versioning, atlas snapshots) apply to every release below and are **not repeated here**.
> 2. Read `V4_PLAN.md` for design intent, then this file fully.
> 3. Implement **one release per work session**, strictly in order (§3 → §7). Each release
>    must leave the game shippable: syntax-checked, browser-verified, changelog'd, versioned,
>    atlas'd, tagged, pushed.
> 4. Line numbers below are against v3.45.0 and will drift — **anchor on the symbol names**,
>    which are exact (verified by grep 2026-07-18). If a symbol is missing, `grep -rn` it in
>    `game/js/` before assuming anything.
> 5. Every balance number in this file is a **starting bid** — run it through
>    `GAME_BALANCE_PRINCIPLES.md` (the checklist in its §"How to use this") before landing,
>    and log deviations in `CHANGELOG.md` with reasoning.

---

## 1. Locked decisions (owner-approved 2026-07-18; do not relitigate)

| # | Decision |
|---|---|
| 1 | The skill is named **Warding**; the verb is **settle** (never "kill"). Enemies are **restless things** — knotted, melancholy nature-spirits, not animals, never people. |
| 2 | The weapon is the **Stave** — the 6th entry in `TOOLS`, forged on the existing 7-tier ladder. |
| 3 | **Resolve** is a combat-space-only bar. Knockout costs **nothing** — wake at the zone entrance with everything. No fee, no loss, ever. |
| 4 | Mastery trials gate levels **50 and 75** (v4.1 ships 50; v4.3 ships 75). XP past a gate **banks**; the level lands when the trial clears. |
| 5 | **The planked door is Elias's old workroom** (shipped examine text, `EXAMINE_OBJ.olddoor`) — so canon becomes: **Elias was the last Warden**; warding lapsed when he left; Rowan sealed the wing. Act III opens with Elias choosing to take the boards down ("the boards can come down any day they choose" — this is the day). This *recontextualizes* the shipped text; never contradict it. |
| 6 | Act III total-level gates ramp **100→380** (per-chapter values in §4); tune via GBP pass, never above 400. |
| 7 | The cozy contract (AGENTS.md, amended): **nothing is ever taken**; all pre-v4 maps stay hazard-free; combat is opt-in; Act III is completable with minimal fighting (materials have non-combat trickles). |

## 2. Engine primer — the anchors every release touches

Facts verified against v3.45.0. File convention: `NN-name.js`, one shared global scope,
load order `00→01→02→03→04→05→06→07→08→09→13→10→11→14→12` (yes, 13 before 10; 12 last).

- **Skills**: no SKILLS constant — the skill set IS the keys of `state.skills` (raw
  cumulative XP), initialized in `freshState()` (`04-world.js`). XP grant: `addXP(skill,amt)`
  (`08-actions.js`) — handles multipliers, level-up banner, mastery praise (via `MASTERY`,
  `MASTERY_NPC`, `MASTERY_PRAISE` in `01-data.js`), then `checkQuests()`. Curve: `XP_TABLE`
  + `levelFor(xp)` + `xpForLevel(l)` (`00-core.js`). Accessor: `skillLvl(s)`. Total:
  `totalLevel()` (`09-quests.js`).
- **Save**: `SAVE_KEY="harvestscape_save_v2"`; only `state.farm` persists among maps.
  `migrateSave(s)` (`11-title.js`) backfills missing **top-level** fields generically from
  `freshState()` — **nested objects (like `state.skills`) need explicit backfill lines**
  (see the existing `stats`/`tools` backfills). `newDay()` (`08-actions.js`) is where
  one-day flags live (`state.flags.stormWrack` pattern) and returns the sleep-card report.
- **Entities**: NPCs `mkNpc(...)` + `spawnMapNpcs(m)` / animals `spawnAnimals(m)`
  (`13-content.js`), rebuilt on every `setMap`; updated by `updateNpcs(dt)` /
  `updateAnimals(dt)` called from `loop()` (`12-game.js`). Rendering: `renderWorld()`
  (`07-entities.js`) depth-sorts an `ents[]` of `{y, draw()}`. Movement AI = timed random
  wander + leash (`home:{x,y,r}`); no pathfinding.
- **Actions**: `useTool()` (swing; branches per tool from `HOTBAR[slotSel].tool`) and
  `interact()` (`08-actions.js`). Tool damage = `TIER_POWER[state.tools[tool]]` =
  `[1,2,3,5,7,9,11]`; reach via `canTiles(tx,ty,tier,face)`; energy via `spendEnergy(n)`
  (2/swing); feel via `triggerSwing()` + `cam.shake` + `hitstop`. Object "combat" already
  exists as durability: `obj.hp -= power; if(obj.hp<=0){drops; addXP;}` — creatures reuse
  this grammar. Tool data: `TOOLS`, `TOOL_ICON`, `TOOL_SKILL`, `TIER_LEVEL=[1,10,20,30,45,70,85]`,
  `TIER_COST`/`toolCost`, `TIER3_GEM`, `TIER_COL`, `MAX_TIER=6` (`01-data.js`).
- **Mine pattern** (the Undercroft's template): `genMine(m)` (`13-content.js`) — drunken-walk
  carve, seed `makeRng(9001 + depth*137 + state.day*7)`, stairs hidden under one rock
  (`stairs:true` → Pick branch converts to `ladderdown`), `state.mineDepth`/`mineBest`,
  `enterMine()`/`mineDown()`/`mineUp()`, Deep Run time-freeze (`state.deepRun`), Old Lift
  (`openLift`/`rideLift`/`state.liftStops`) funded by the **Pledge Ledger**:
  `state.pledges[id]={gPaid,mats:{}}`, `pledgeCost/Paid/Remaining/Funded/Done`,
  `contributePledge(id,frac)`, `completePledge(id)` (`01-data.js` + `10-ui.js`).
- **New map registration set** (all required or the atlas build throws): `MAPS` entry
  (`{w,h,outdoor?,name,subtitle?,music,bg?,gen}`), `MAP_REGION` + `WORLD_MAP` (`10-ui.js`),
  `.wmBoard` grid-template-areas row (`css/style.css`), warps via `m.warps[key(x,y)]` +
  `doWarp`, daily regen free via `getMap`/`clearMapCache`, `mapMusicMode`. Regenerate
  `GAME_ATLAS.html` (`node tools/build-atlas.mjs`) — it throws on unmapped content.
- **Quests/story**: linear `QUESTS` array (`01-data.js`) driven by `state.questIdx` +
  `checkQuests()`/`tryTurnIn` (`09-quests.js`); objective shapes: `{stat,goal}`,
  `{level:{skill,n}}`, `{heartOf:{id,n}}`, `{item,n}`, `{totalLevel:n}`, `{gold:n}`,
  `{talk:id}`, `{mineDepth:n}`, `{flag:name}`. Quest Points derive from `questIdx` (no save
  field — appending quests auto-extends `questPointsTotal()` and the Storyteller's Banner).
  Cutscenes: `startCutscene(steps,onEnd)` (`14-story.js`), step types
  `say/wait/move/face/setpos/sparkle/sfx/banner/fade/run/letter`; banks `HEART_EVENTS`
  (`{npcId:[{hearts,flag,steps}]}`), `FESTIVAL_SCENES`, `NPC_RECOG`
  (`{npc,flag?,ack,line,when?,give?}` served by `pendingRecog`). Wings: `WINGS`/`wingLit`/
  `checkWings`.
- **Lighting a dark zone**: `drawLighting` (`06-weather.js`) — add a `curMap.id` branch
  (mine is `amb="#5b5568"`, multiply); `collectLights()` — add a player-lantern radius case
  (mine: `r≈98,i:1`) and per-object glows. Verify with screenshots; additive light glares.
- **Audio**: music mode = `PROG_<X>` chord array + cases in `progFor()`/`tempo()`, selected
  by `MAPS[id].music`; SFX = method on `SFX` object using `blip/burst/note`, played via
  `playSfx("name")` (`02-audio.js`).
- **UI**: panels = hidden `div.panel` in `index.html` + `openPanel("xPanel",renderX)`;
  `toast`, `banner`, `showSleepCard`, `refreshHUD`, `refreshQuestTracker` (`10-ui.js`).
- **Release plumbing**: bump the single `?v=` cache-buster in `game/index.html` (CSS + all
  scripts share it), bump `VERSION` name+code and append the in-game `CHANGELOG` array
  (`01-data.js`), retitle the `CHANGELOG.md` section, `node tools/build-atlas.mjs`, tag.
- **Testing gotchas** (hard-won): neutralize `saveGame` before console-driven test mutations
  (unload-save race can corrupt the real save); if behavior looks impossible, suspect
  mixed-version script caching and re-bump `?v=`; test with audio muted; close panels before
  screenshotting scenes.

---

## 3. v4.0 "The Tenth Door" — Warding foundation

**Goal:** the sixth skill exists end-to-end: a dark venue, three creature families, the
Stave, Resolve + knockout, loot with sinks, the door-opening story beat, the variety spark.

### 3.1 New file + data

- Create **`game/js/15-warding.js`**; add its script tag between `13-content.js` and
  `10-ui.js` in `index.html` (it references MAPS/gen helpers; UI references it later).
  All *data* goes in `01-data.js` per house style; logic/AI/render in `15-warding.js`.
- **Skill**: add `Warding:0` to `freshState()`'s `state.skills` AND an explicit nested
  backfill in `migrateSave` (`if(s.skills && s.skills.Warding===undefined) s.skills.Warding=0;`)
  — the generic top-level backfill will NOT reach it. Add `SKILL_ICON.Warding` (suggest 🔔
  or 🕯), `MASTERY.Warding` perks (25: +1 Resolve regen tick after settling · 50: staves
  knock back further · 75: settled things drop +1 material chance · 99 "Lanternheart":
  Resolve cannot drop below 10 — name the perk warmly), `MASTERY_NPC.Warding = "elias"`,
  and four `MASTERY_PRAISE` lines in Elias's voice.
- **Audit every 5-skill assumption**: grep for `99*5`, `/495`, hardcoded skill lists, the
  skills panel layout, and the marketing line in `01-data.js` (~line 302) that says
  "no combat" — reword to match v4 ("…and the warding of the quiet dark", or similar).
  `for(const s in state.skills)` sites pick Warding up automatically — verify each renders
  sanely (skills panel, total level, save recap).

### 3.2 The Stave (weapon-as-tool)

- Append `"Stave"` to `TOOLS`; add `TOOL_ICON.Stave`, `TOOL_SKILL.Stave="Warding"`; extend
  `TIER_COST`/`toolCost` with a Stave column priced like the Rod's; reuse `TIER_LEVEL`,
  `TIER_POWER` (= damage), `TIER_COL`, `TIER3_GEM`. `state.tools` gets `Stave` via the
  existing explicit `tools` backfill in `migrateSave` — verify, don't assume.
- Add a HOTBAR slot for the Stave; it appears only once owned. The basic Stave is **given,
  not bought** — Elias hands you his own in the door-opening scene (§3.6); upgrades forge
  at Tom's like every tool (multi-resource bills per the unified ladder).
- `useTool()` gains a `Stave` branch: resolves via `canTiles` against creatures on the
  current map (see §3.4), costs `spendEnergy(2)`, `triggerSwing()`.

### 3.3 The Undercroft (map)

- `MAPS.undercroft = {w:24,h:16,name:"The Undercroft",subtitle:"the tenth wing",music:"under",bg:"#0b0a12",gen:genUndercroft}`
  — procedural floors cloned from the `genMine` pattern with its own seed constant, tracked
  by `state.underDepth`/`state.underBest` (add to `freshState`; generic backfill covers
  these — they're top-level). Floors 1–15 in v4.0.
- **Entry**: the guild's `olddoor` object. Extend its `interact()` branch: once
  `state.flags.tenthDoorOpen`, it warps down (`enterUndercroft()` mirroring `enterMine()`).
  Time is **frozen** underground exactly like the mine (reuse the `deepRun` gating logic —
  decide with the mine's code in front of you whether Undercroft joins the mine's rule or
  is always-frozen; log the choice).
- Stairs-down hidden under a **knot** (a settle-target, not a rock): settling the floor's
  Great-rooted knot reveals `ladderdown` — same grammar as `stairs:true`, different verb.
- **Checkpoints**: every 5th floor, a **Warden's Bell** — a pledge target on the lift
  pattern (`pledgeCost` ids `"bell5"`, `"bell10"`, `"bell15"`; costs in gold + mats
  including new drops), rung to warp between restored bells and the door. Reuse
  `contributePledge`/`completePledge` + a `renderBells` panel cloned from `renderLift`;
  completed bells go in a new top-level `state.bells=[]`.
- **Lighting**: `drawLighting` branch for `undercroft` — ambient `#4a4560` (dimmer, bluer
  than mine), `showLights=true`; player lantern `r≈90`; wisps and bells emit small light
  pools via `collectLights`. **Screenshot dawn-equivalent, mid-run, and knockout fade.**
- **Registration set** (§2) in full, including a `WORLD_MAP` node + grid area + `MAP_REGION`,
  or the atlas generator throws.

### 3.4 Creatures + combat loop (in `15-warding.js`)

- **`CREATURES` table** (`01-data.js`), v4.0 families:

| id | name | lvl | hp | contact (Resolve) | behavior gimmick | XP | drops |
|---|---|---|---|---|---|---|---|
| wisp | Gloam Wisp | 1 | 3 | −10 | drifts; flees light; lunges after a 0.6s shimmer telegraph | 14 | Gloam Thread |
| shambler | Knot-Shambler | 10 | 8 | −15 | slow walker; charges in a straight line after a root-creak telegraph | 30 | Knotwood, Gloam Thread |
| embermite | Ember Mite | 20 | 6 | −15 | skitters; leaves a brief warm patch you shouldn't stand in | 46 | Ember Grit |

  XP is per-settle and must sit on the ore-XP curve for the same level band (GBP §3.3-3.4
  pass required). Floors band creature levels like `oreTable` bands ores.
- **Entity shape** (extends the animal pattern): `{kind, x,y, dir, timer, walk, face, hp,
  state:"idle"|"telegraph"|"lunge"|"stunned", stateT, homeFloor}` stored in `m.creatures`,
  spawned by `genUndercroft`, updated by `updateCreatures(dt)` — **wire the call into
  `loop()` in `12-game.js`** next to `updateNpcs`. Render by pushing into `ents[]` in
  `renderWorld()`; draw fns `drawWisp/drawShambler/drawEmbermite` in `15-warding.js`
  following `03-art.js` procedural style (they are knots of the world's own materials —
  bark, thread, ember — with soft glow, sad eyes optional; **melancholy, not menacing**).
- **Hit resolution**: Stave branch finds creatures within `canTiles` reach → `hp -= power`,
  knockback ~1 tile, `hitstop=0.05`, `cam.shake`, hit SFX. `hp<=0` → **settle**: burst
  into `pSparkle` + material drops via `give()`, `addXP("Warding", xp)`, settle SFX (a low
  warm bell, not a death sound). Telegraphed attacks ONLY — every hit the player takes must
  have been announced ≥0.5s prior (bible §6.5.3).
- **Resolve**: `state.resolve` (add to `freshState`, start/max 100). Drains only from
  creature contact (with ~0.8s i-frames + knockback on the player); regens to full on any
  map that has no creatures; HUD bar (clone the energy bar) rendered **only** inside combat
  maps. Cooked dishes (`EDIBLE`) restore Resolve in combat maps at ~2× their energy value —
  Cooking's new consumer.
- **Knockout**: `resolve<=0` → `fadeTo`, a two-line cutscene ("Lantern-bearers found you…"),
  `setpos` to the Undercroft door, Resolve 50, **inventory/gold/XP untouched** (write a
  test: knock out with a full inventory, diff `state.inv` before/after). Track
  `state.stats.knockouts` for future NPC_RECOG lines.

### 3.5 Loot economy

- New items: **Gloam Thread, Knotwood, Ember Grit** (+ `EXAMINE` flavor each). `ITEM_SELL`
  prices LOW (thread 18g, knotwood 24g, grit 30g — below every same-band gather item;
  settling must never out-earn mining, GBP §2.4).
- v4.0 sinks so drops are never sell-only: 2 charm recipes (e.g. **Warded Charm**: Gloam
  Thread ×6 + Fleece + Opal → +5 max Resolve; **Emberlight Charm**: Ember Grit ×4 + lantern
  glow radius +8) extending the existing 7-charm system; Warden's Bell pledges (§3.3) eat
  Knotwood. Chapter bundles (v4.1) become the main sink.
- **Non-combat trickle** (bible §6.5.2): Tom stocks a rotating 1/day "warden's salvage"
  buy-offer (one drop type, small qty, modest price) so combat-averse saves can buy what
  chapters need. Cheap: clone the Nell daily-order pattern in reverse.

### 3.6 The story beat + variety spark

- **Append one quest, "The Tenth Door"** (`QUESTS`): giver Rowan, requires
  `{flag:<Act II completion flag — grep 14-story.js for the homecoming's flag name>}` +
  `{totalLevel:100}`. Turn-in cutscene at the Guild: Elias takes the boards down himself
  (locked decision #5 — reuse his portrait; Rowan's line owns the guilt of the sealing;
  Elias gives the basic Stave and one line that reframes eleven ferry years as the last
  warding). Sets `tenthDoorOpen`. Write it in the repo's register — read the "One Last
  Letter" and Homecoming scenes first and match their temperature.
- **Variety spark**: `state.dailyXpActs = {}` (reset in `newDay`); in `addXP`, the first
  **10 grants per skill per day** get ×1.5 XP + a distinct sparkle + a one-time-per-day
  toast on the first spark per skill. Show remaining sparks subtly in the skills panel.
  This ships in v4.0 to set the breadth tone before trials arrive.

### 3.7 Audio + acceptance

- Music mode `"under"`: sparse, low, warm-dark (write `PROG_UNDER`, register in
  `progFor`/`tempo`). SFX: `staveHit`, `settle` (low bell), `knockout` (soft descending),
  `bellRing`.
- **Definition of done**: syntax check all files (`new Function(src)` in node); a full
  playtest loop in-browser — open door via quest, descend 10 floors, settle all 3 families,
  get knocked out (verify nothing lost), ring a funded bell, forge Stave tier 2, watch the
  variety spark fire; screenshots of the Undercroft (lit/creatures/knockout fade); console
  clean; old save migrates (load a pre-v4 save, confirm Warding appears at 0 and nothing
  else shifted). Release per AGENTS.md rules (version bump to **v4.0.0**, code +1, in-game
  changelog entry, atlas, tag).

---

## 4. v4.1 "The Warden's Ledger" — Act III chapters 1–3 + trials at 50

- **`CHAPTERS` data** (`01-data.js`): 8 entries
  `{id, title, gate:{totalLevel, flag?, season?}, bundle:{g?, mats:{item:n}}, expedition:{underDepth?|settle:{kind,n}|named:id}, scene:[steps], world:fn}`.
  Gates: totalLevel **100/140/180/220/260/300/340/380**; each chapter's bundle spans ≥4
  skills' outputs (crops, fish, dishes, ore, timber, warding drops — on-curve quantities,
  GBP-checked). The **Warden's Ledger** is a Guild-interior book object + panel driving it:
  render on the `pledgeRowHtml` pattern, deposits via `contributePledge`-style partial
  funding (new `state.chapterPledges` mirroring `state.pledges`), completion fires the
  chapter scene + a `world:` mutation (the healing-engine pattern — each chapter visibly
  changes a map's gen, like `wingLit` does).
- **Chapters 1–3 content** (write to the repo's bar; scenes use existing cast):
  1. *"Taking Down the Boards"* — the Undercroft antechamber becomes a tended room
     (world: lit gallery in the guild gen).
  2. *"The Old Rounds"* — re-walk Elias's warding route; first **Great Knot** (named boss:
     3× hp, two telegraphed moves, same verb) at underDepth 10.
  3. *"What the Thread Remembers"* — Maya paints the dark; her scene; world: the sealed
     wing's windows glow at night from outside.
  Ship as appended `QUESTS` entries (chapter = quest whose objectives include the bundle
  flag + expedition) so the tracker/markers/QP machinery works unmodified.
- **Mastery trials at 50** (all six skills): `TRIALS` data
  `{skill, giver, asks:[objective shapes], flag}`. Mechanic: introduce
  `effLevel(s) = min(skillLvl(s), trialCap(s))` where the cap is 50 until that skill's
  trial flag — use `effLevel` at every gate/unlock/UI site (audit all `skillLvl` call
  sites; XP keeps accruing; on trial completion the banked levels land with one big
  celebration banner). Every trial is a cross-skill ask in the giver's voice (Rowan's
  Mining trial wants heartwood props + a cooked meal; Bram's Fishing trial wants a smithed
  gaff). NPC_RECOG lines when a banked-level burst lands.
- **Undercroft deepens**: floors 16–30, families 4–5 (**Hollow Warden** L30 — a lost
  predecessor's echo, blocks and must be circled; **Gloam Tangle** L45 — splits once when
  struck), banded like `oreTable`.
- **Done**: chapters 1–3 playable start-to-finish on a fresh save (console-accelerated),
  trial gating verified at 50 (XP banks, level waits, burst lands), old save migrates,
  bundle numbers GBP-passed, atlas regen, release **v4.1.0**.

## 5. v4.2 "The Gloam Grove" — ring 10, chapters 4–5, the returned Warden

- **Ring 10** past the grove's ring 9: gen off `genGrove`'s pattern, Woodcutting × Warding
  venue (gloam-choked deadfalls need axe THEN settling the knot inside; creatures: grove
  variants of shambler/tangle). Registration set + waystone `way10` pledge.
- **Chapters 4–5**: ch4 gates on **Star-Watch festival** attendance (season gate — the
  calendar as character); ch5 introduces **the returned Warden** — the single new NPC
  (owner cap): full inhabitant checklist to the v3.35 bar: `NPCDEF` + portrait + `mkNpc`
  spawns + schedule branch + gifts/birthday + hearts + `NPC_RECOG` entries + a confide
  scene. She un-shutters one of the two shuttered village houses (world mutation).
- Charm/gear top tiers consuming Star-band mats + drops; Stave tiers 5–6 recipes verified
  against the unified ladder.
- **Done**: ring 10 verified in all weathers (screenshots), new NPC walks/talks/gifts,
  chapters 4–5 complete, release **v4.2.0**.

## 6. v4.3 "The Sunken Workings" — behind the deepest lift, chapters 6–7, trials at 75

- **Sunken Workings**: entered from mine floor 65's restored lift stop (finally paying off
  the deep lift) — Mining × Warding venue; creatures L70–85 (**Deep Knot**, **Star-Gnarl**);
  star-band drops. Registration set; bells continue.
- **Chapters 6–7**: ch6 needs a spring-dawn moment; ch7 is Rowan's chapter — the full truth
  of the sealing, played against the Homecoming's temperature, second Great Knot.
- **Trials at 75** on the v4.1 machinery (`trialCap` returns 75 post-50-trial); review v4.1
  telemetry-of-feel first — if 50-trials played as walls, ship 75 as *invitations*
  (optional, perk-bearing) and log the deviation prominently.
- **Done**: full run floor-65 → Workings verified; chapters 6–7; release **v4.3.0**.

## 7. v4.4 "The Tenth Lantern" — the finale + the sweep

- **Chapter 8**: gates totalLevel 380 + all bells + hearts; the last Great Knot settles into
  a **founding-star shard**; finale scene at the Grand Festival — the tenth lantern joins
  the launch (extend `FESTIVAL_SCENES` + the anniversary scene). Epilogue in the "One Last
  Letter" register: Elias's workroom desk, one letter, one keepsake. Storyteller's Banner
  totals update automatically via QP derivation — verify.
- **The sweep**: full-arc balance pass (days-to-total-380 modeled at normal play; bundle
  and XP retunes as needed, level-preserving per GBP §5.4); resync
  `GAME_BALANCE_PRINCIPLES.md` §10 appendix with ALL v4 numbers; `DESIGN_SCORECARD`-style
  self-audit appended to the changelog; update `README.md` + `AGENTS.md` doc lists
  (V4_PLAN → "SHIPPED").
- **Done**: a fresh save can play v1→v4 start to finish; release **v4.4.0**.

---

## 8. Standing constraints (checked at every release)

1. **Contract test**: grep your diff for anything that removes items/gold/XP/levels or
   damages player property — if found, redesign. Knockout diffs `state.inv` clean.
2. **No hazard leaks**: creatures exist ONLY on `undercroft`, `grove` ring 10, and
   `sunkenworks`. Never on farm/village/beach/coastroad/ridge/butterbrook/grove 1–9/mine.
3. **Every number passes GBP** before landing; drops price below same-band gather income;
   settle XP on the ore curve.
4. **Every release is playable and shipped solo** — never leave the tree mid-feature;
   AGENTS.md rules (changelog-with-why in the same commit, version+atlas+tag) are part of
   "done", not extra.
5. **Verify visually** — dark zones especially (additive glare); console clean of game
   errors; old-save migration tested every release.
6. **When blocked or deviating**: make the conservative call, log it in `CHANGELOG.md`
   under the release with reasoning, and leave an owner question in `DEVLOG.md` — never
   silently change a locked decision (§1).
