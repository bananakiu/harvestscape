# Version 4 — The Warden's Valley (the plan)

> **What this is.** The roadmap for HarvestScape's next major version, green-lit as a
> *planning* exercise 2026-07-18 (DEVLOG): combat enters the game as a new skill, the main
> storyline grows into the long spine the skills hang off, and breadth pacing keeps players
> out of single-skill rabbit holes. Baseline: `V4_STATE_OF_THE_GAME.md` (v3.45.0).
> **Status: PLANNED, nothing built.** The owner reviews this before any build-out.

---

## 0. The three moves

Everything in v4 is one of these:

1. **Combat becomes the sixth skill** — built to the bible's §6 expedition spec: cozy,
   opt-in, loot-feeds-everything, knockout-not-death. It unlocks the danger-tiered spaces
   the world currently can't have.
2. **The story becomes the spine** — a third act structured like Stardew's Community Center:
   a year-long, chaptered restoration that *asks for the whole game* (crops, fish, ore,
   timber, dishes, hearts, and now combat), so skills level as a byproduct of chasing the
   story instead of the story ending before the skills begin.
3. **Breadth is paced, not policed** — mastery trials, chapter bundles, and a daily variety
   spark extend the multi-resource-gate pattern the owner already endorses. Encourage and
   gate; never penalize.

The amended contract (AGENTS.md): combat exists, **but nothing is ever taken from the
player** — no item/gold/level loss, no destroyed property, defeat is a soft knockout, and
every v1–v3 space stays exactly as safe as it is today. Danger is a place you walk to.

---

## 1. What the game looks like after v4 — the player's view

*The brief the owner asked for: "write up some instructions on what the game will look like."*

You still wake in the cottage, water the turnips, pet Sir Cluckington. But the Guild's
planked back door — the one Rowan would never talk about — is open, and behind it a stair
goes down into the **Undercroft**: the tenth wing, the Warden's wing, sealed the night the
Guild went dark. The valley's eleven quiet years weren't only grief; the Wardens kept
something *tended*, and for eleven years nobody has.

Below the valley (and later, out past it) lies **the Gloam**: soft-spoken cozy-dark spaces —
mist-lit hollows, sunken guild workings, a blighted grove ring — inhabited by **restless
things** (wisps, knot-shamblers, ember mites; not animals, never people). You don't kill
them; you **settle** them — a swing of a forged warden's tool bursts them into the materials
they're knotted from. Settling grants **Warding XP** (the new 1–99 skill), and warding
materials feed every other loop: new charms, new machine recipes, tool trim tiers, chapter
bundles.

A **run** works like a Deep Run: opt-in, time frozen, a **Resolve** bar (combat-only; energy
is untouched) that hits drop and cooked food restores. Resolve empty → the lantern-bearers
carry you out — you wake at the Undercroft door with everything you carried and found.
Checkpoints bank depth on the Pledge Ledger, exactly like the Old Lift.

Meanwhile the **Warden's Ledger** in the Undercroft drives the year: eight chapters, each a
bundle of asks across many skills plus one expedition beat, each ending in a scene that
physically changes the valley (the §3.4 healing-engine pattern). The morning card, the quest
markers, and Rowan keep the thread in hand. You reach for Farming 45 because chapter five
wants Everbloom for the warding salve — not because a number was next.

Skill panels grow **mastery trials** at 50 and 75: to push past, the craft's caring NPC asks
one cross-skill favor (Bram won't teach the deep casts until you've smithed him a proper
gaff). A **variety spark** makes the first few actions in each skill each day glow with bonus
XP. Rabbit-holing still works if you insist — but the game now visibly pays you to rotate,
and the top of every ladder has a person and a story on it.

---

## 2. Warding — the combat skill (design)

**Name.** "Combat" is the mechanic; **Warding** is the craft — fits the Guild fiction, the
cozy register, and the settle-don't-slay verb. (Owner may rename; see §6.)

- **Skill #6, 1–99, shared XP curve.** Total-level cap rises 495 → **594**. XP from settling
  restless things; creature tiers on the unified ladder (1/10/20/30/45/70/85) so zone depth
  reads like ore depth.
- **The verb.** One button, tool-swing timing, telegraphed enemy moves, generous hitboxes,
  knockback (bible §6.5.3). 4–5 creature families per zone max, one gimmick each. No
  combos, no dodge-roll — depth lives in the *run*, not the swing.
- **Resolve, not health.** A combat-space-only bar. Hits drain it; cooked dishes restore it
  (Cooking's new consumer). Empty = knockout: wake at the entrance, **nothing lost, no fee**
  (stricter than Stardew — our contract). The priced choice is the wasted run-depth, which
  checkpoints already soften.
- **Gear routes through the existing economy (bible §6.6).** Warden's tools (the weapon) are
  **forged, tier-for-tier, on the same 7-tier ore+wood ladder as the other tools** — same
  bill shape (skill level + ore + timber + gold + gems at the top). Warding gear = the sixth
  line on the tool wall. Wearables: warded charms (fleece + lumber + gems + warding drops)
  extend the v3.3 charm system rather than adding an armor doctrine.
- **Loot is fuel, never a faucet (bible §6.1).** Drops are *materials* (gloam thread, ember
  grit, knot-heartwood…) consumed by chapter bundles, charm recipes, new machine recipes,
  and monument tiers. Modest sell prices under `GAME_BALANCE_PRINCIPLES` §2.4 — settling
  must never out-earn the money crop.
- **No forced combat (bible §6.5.2).** Chapters need warding *materials*, and every warding
  material has a slow non-combat trickle (a rotating buy-order at the Undercroft, storm
  wrack, geodes) so a combat-averse save can still finish the story, slower.
- **Where it lives.** v4.0: the **Undercroft** (procedural floors under the Guild, mine
  pattern). v4.x: the **Gloam-touched grove ring** (a 10th ring past the waystones) and
  **the Sunken Workings** (behind the deepest lift stop — finally a reason the lift goes
  that far). The farm, village, all shipped outdoor maps: never.

## 3. Act III — "The Untended" (the long story)

**Premise (uses only planted hooks).** The Guild didn't just grieve shut — the Warden's
wing was sealed, and its work stopped. The Gloam is what grows where warding lapsed: not an
enemy army, an *untended garden*. Act III is the valley learning to tend it again — the same
restoration fantasy as Acts I–II, pointed down instead of out. (The planked door's post-Act-II
"closure" examine must be re-read before writing chapter 1 — the reveal must recontextualize
it, not contradict it. Flagged in §6.)

**Structure: 8 chapters across a full in-game year**, driven by the **Warden's Ledger**
(pledge-machinery reuse — partial deposits, celebration per beat, banner + bell per chapter):

- Each chapter = **one bundle + one expedition + one scene.** The bundle asks for 4–6 things
  across ≥4 skills (on-curve amounts, GBP-checked); the expedition is a scripted run beat
  (reach depth N, settle a named Great Knot — the "boss," same verb, more telegraph); the
  scene pays off in the world (a lit gallery, a cleansed spring, a returned NPC memory).
- **Gates ramp with the year:** chapters gate on total level ~**100 / 140 / 180 / 220 / 260
  / 300 / 340 / 380** (tunable), plus hearts and one seasonal moment each (chapter 4 needs
  the Star-Watch; chapter 6 a spring dawn) so the arc *cannot* be rushed in a month and the
  calendar stays a character.
- **The finale** lights the tenth lantern at the Grand Festival — the festival the player
  already revived gains its missing light, and the annual anniversary scene updates.
  Epilogue in the "One Last Letter" register, not a bigger fireworks show.
- **Cast load-bearing, not decorative:** Rowan carries the guilt of the sealing; Elias knew
  (his ferry carried the last Wardens); one chapter is Maya painting the dark; Nell's dairy
  and Pip get one chapter beat each. New NPCs: at most **one** (a returned Warden — the
  shuttered houses finally un-shutter), to the v3.35 inhabitants bar.

**Why this fixes P1:** the story now *ends after* the mid-game instead of before it — the
last chapter's gates sit around total 380/594 with the trials (below) pulling the 50s–70s
bands of every skill. Skills become the way you answer the story's asks.

## 4. The breadth engine (anti-rabbit-hole)

Three mechanisms, all reward-shaped, none punitive (GBP §5.3 stands):

1. **Mastery trials at 50 and 75.** Advancing a skill past 50 (and again past 75) requires a
   one-time trial from its caring NPC — and every trial is a *cross-skill* ask (Rowan's
   Mining 50 trial wants heartwood props and a cooked miner's meal). XP still accrues past
   the gate but the level waits until the trial clears (banked, RuneScape-style, never
   lost). This is the owner's multi-resource-upgrade pattern applied to the ladder itself.
2. **Chapter bundles + total-level gates** (§3) — the story is structurally incapable of
   being fed by one skill.
3. **The variety spark.** First ~10 actions per skill per day grant +50% XP with a sparkle.
   Rotation becomes visibly optimal; focus is still allowed and never taxed. (Replaces any
   XP-penalty/daily-cap idea — those violate the contract.)

## 5. The release train

v4 is an era, shipped in the repo's normal small releases; each lands with changelog, atlas,
GBP numbers, and visual verification. Order chosen so every release is playable and the
story never ships ahead of the systems it asks for.

| Release | Contents |
|---|---|
| **v4.0 "The Tenth Door"** | Warding skill + Resolve + knockout; the Undercroft (floors 1–15, 3 creature families); warden's tool tiers 1–3; first loot materials + sinks; door-opening intro quest. The variety spark ships here (small, sets the tone early). |
| **v4.1 "The Warden's Ledger"** | Act III chapters 1–3 + the Ledger UI; mastery trials at 50 (all six skills); Undercroft deepens (families 4–5, first Great Knot). |
| **v4.2 "The Gloam Grove"** | 10th grove ring (Woodcutting × Warding venue); chapters 4–5; charm/gear top tiers; the returned-Warden NPC. |
| **v4.3 "The Sunken Workings"** | Behind the deepest lift stop (Mining × Warding); chapters 6–7; trials at 75. |
| **v4.4 "The Tenth Lantern"** | Chapter 8 finale + festival integration + epilogue; balance sweep of the whole arc; GBP appendix resync. |

Deliberately **not** in v4: new geography beyond the three combat venues (WORLD_EXPANSION's
later layers stay a separate track), a seventh skill, mapping Marrow Point (never), any
Godot work (separate track), multiplayer-anything.

## 6. Owner decision points (before building v4.0)

1. **The skill's name** — *Warding* (recommended) vs. plain *Combat* vs. *Slaying*.
2. **Tone of the enemies** — recommended: knotted/restless nature-things, melancholy not
   menacing. Alternative: classic slimes-and-bats. Sets the art + audio direction.
3. **Resolve strictness** — recommended zero-cost knockout; Stardew-style small capped fee
   is the alternative if runs feel consequence-free in playtest.
4. **Mastery-trial gates: 50/75 (recommended) or 50 only** — 75-trials risk feeling like a
   second wall in the same climb; can be deferred to v4.3 data.
5. **The planked door's shipped "closure" examine** — RESOLVED 2026-07-18: the live text
   canonizes the door as *Elias's old workroom* ("the boards can come down any day they
   choose"), so Elias becomes the last Warden and Act III opens with him taking the boards
   down. See `V4_BUILD_PLAN.md` §1 (locked decision 5).
6. **Act III total-level gate curve** — the 100→380 ramp above is a starting bid; sign off
   after a GBP pass models real days-to-total at normal play.

## 7. Constraints carried into every v4 build

- **Contract:** nothing taken, ever — knockout costs nothing; all pre-v4 spaces stay
  hazard-free; combat is opt-in and story-completable-around.
- **Engine:** same 15-file no-build architecture; Undercroft floors on the mine's
  procedural pattern; Resolve/Warding via `migrateSave`; enemies are entities on the
  existing tick/render loop (07-entities.js) — no physics, no pathfinding beyond the
  horse/NPC patterns.
- **Balance:** every number (creature XP, drop prices, bundle sizes, gate curve) passes
  `GAME_BALANCE_PRINCIPLES` before landing; loot priced below the money crop; the appendix
  resyncs in v4.4 at the latest.
- **Fiction:** only planted hooks; Marrow Point stays 39 miles away; new NPCs ≤ 1.
- **Verify visually**, including the new dark-space lighting (additive glare risk is
  highest exactly where the Gloam lives).
