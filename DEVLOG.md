# HarvestScape — Developer Log

> **What this is.** The owner's playtest feedback, personal impressions, and direction calls —
> the *human* side of the audit trail. `CHANGELOG.md` records what we changed and why at the
> implementation level; this file records what it *felt like to play* and where the owner wants
> the game to go. Entries here often become plans (see the docs they link to), and those plans
> become changelog entries once built.
>
> **Conventions**
> - Newest first, dated headings.
> - Record feedback close to verbatim first, then the interpretation we acted on — so a future
>   agent can re-derive the decisions from the raw signal, not just our reading of it.
> - Link each entry to the plan/changelog work it produced, once it exists.

---

## 2026-07-13 (late evening, cont.) — Green light on the plan docs; the lift gets the same fix

**Owner:** *"Go ahead and write a fix as well, like a planned fix for AI to do for the mine,
with the same sort of waypoint system."*

**Interpretation.** The Grove Depths revisions (pledge-ledger waystones) are accepted, and the
follow-up we flagged — that the mine's lift stops have the exact same pay-in-full-on-the-spot
UX tax — is promoted from "possible follow-up" to a planned, spec'd fix an AI agent can execute.
Both get written down now; build still waits for the word.

**Produced:** [GROVE_DEPTHS.md](GROVE_DEPTHS.md) — the full executable plan: Phases 1–3 (rings +
deadfalls + waystone pledge ledger; new trees + rarity-by-depth + sinks; canopy treasure +
charms) and Phase 4, the self-contained Old Lift retrofit onto the same Pledge Ledger
(discovery derived retroactively from `mineBest`, partial deposits from anywhere, completion
mirrors into `state.liftStops` so existing code is untouched).

---

## 2026-07-13 (late evening, cont.) — "the town is built very poorly": exits, doors, and the buried mine

**Owner (near-verbatim):**

> There's a major bug that needs fixing. When I exit the building, let's say Tom Shop, I get
> teleported into the previous location of Tom Shop, so there are some issues with the mapping
> here. I wanted to fix all the bugs related to that, as well as the entrance/exit, let's say,
> to the beach. I always notice that I could go to the bottom of the map and circumvent the
> active tiles that transport me to the beach, so it gets awkward. I have to walk up a tile
> from the bottom of the map to hit that active tile that transports me to the beach.
>
> The town is also built very poorly. Let's say there are buildings that don't have doors.
> Some doors don't match up with the pathways, and the mine is behind the roof of the Nine
> Crafts Guild, which blocks the entrance.

**Interpretation.** All of this is v3.0 world-split debt: the town moved off the farm, but the
*interiors* of the three story buildings still warped back to the farm at the buildings' pre-v3
coordinates (the "previous location of Tom Shop" — exactly right), the village was laid out with
the Guild drawn on top of the old north path (burying the mine warp under its roof), and the
single-tile edge warps could be walked around along the map rim. Fixed as v3.1.1 "Doors & Roads"
(see CHANGELOG.md): every interior exits to its own village door, the mine mouth moved to open
ground on the northeast ridge, every door got a connecting path, the ambient houses got real
(latched) doors, and all map-edge crossings became multi-tile bands.

---

## 2026-07-13 (late evening, cont.) — Grove Depths plan review: waystones must never waste the trip

**Owner (near-verbatim), reviewing the Grove Depths pitch:**

> Okay, this is good, except that it will be quite frustrating to reach a waypoint and not
> have the resources to build it. So, I want some other alternative system that still costs
> you something. You still have to earn it; you still have to earn the rights to use the
> waypoint. It shouldn't be an in-the-moment situation where you reach the waypoint, and you
> don't have the resources. Then, you have to do it all over again, and you don't even
> remember what resources you need. Things like that.
>
> The rest of the proposal looks good, so we could do that.

**Interpretation.** The lift-stop pattern (pay the full cost while standing at the stop) has a
hidden UX tax the owner won't accept in the grove: the *trip* and the *payment* are coupled, so
arriving under-resourced wastes the trek, and the cost lives only in the player's memory between
trips. The fix isn't to remove the cost ("you still have to earn it") — it's to decouple
discovery from payment: reaching a stone must bank something permanent by itself, and paying
must be possible later, from anywhere, in partial amounts, with the ledger doing the
remembering. Note this critique applies verbatim to the mine's lift stops too — flagged as a
possible follow-up retrofit, not in Grove Depths scope.

**Direction call.** Rest of the plan approved as pitched (rings capped ~9, waystones every 3
rings, charms as small single-slot passives — our recommended picks stand). Revise the waystone
system per the above, present revisions before building.

## 2026-07-13 (late evening) — The forest verdict: "cool, but not dynamic enough. Not fun."

**Owner (near-verbatim):**

> The system on the forest is cool. It's a resource space, but it's not dynamic enough. It's
> not fun. The mine itself has levels, progression, and save points. If we could integrate
> some sort of system like that, that's semantically exciting. It'll also be good to have
> treasures or something — in the same way that when you cut logs in RuneScape, you might get
> birds' nests with jewelry, rings, trinkets, or unlocks.
>
> It'll be interesting to have those sorts of reward mechanisms and maybe a way to crawl
> deeper into the forest instead of just having a blank space where you can collect wood.
> That way, you could also slowly make the trees have a rarity system, where in the lower
> levels only the common trees are there, and in deeper levels the higher-level trees are
> there. It's also sort of like an elevator system, but maybe some other system to make sure
> that you could go deeper into the grove faster.
>
> I don't know. Help me figure this out. Before you build it out, just plan it first so that
> we could go through it.

**Interpretation.** The Deep Grove (v2.x) gave the axe a *venue* but not a *game*. The mine is
fun because it has a loop — descend, risk nothing but time/energy, bank progress at lift stops,
and the loot table deepens with you. The grove is one flat room with a west-is-older gradient;
once you can chop maple (WC 18) there is nothing left to want, and Woodcutting is a dead skill
from 18 to 99. Four asks, all of them the mine's loop translated into forest language: (1) depth
levels with progression, (2) permanent save/skip points ("like the elevator, but maybe some
other system" — i.e. same function, different fiction), (3) rarity-by-depth tree tables, (4) a
birds'-nest-style treasure drop on chopping. Constraint carried over from the 2026-07-12 gem
verdict: treasure must have *uses*, not just sell value, or it becomes another economy faucet.

**Direction call.** Plan first, build later — owner wants to review the plan before any code.

**Produced:** the Grove Depths plan (pitched in chat this session; plan doc + build on
green-light).

**Owner:** *"What will you build next, and are there any major improvements you want in the story?
The story kind of falls flat a bit, in my opinion."*

**Interpretation + our diagnosis (five named causes, full pitch in chat, plan doc to follow on
green-light):** (1) the Guild's darkness is a checklist, not a felt absence — nothing in the world
visibly *lacks* or *heals*; (2) Act I never seeds a question, so the Act II reveal answers something
the player never asked; (3) quest objectives are systemic gates wearing quest costumes ("reach total
level 60"), not people asking for help; (4) NPCs never talk to *each other* outside set pieces, so
the valley reads as spokes around the player, not a web; (5) no midpoint event and no player choice —
the arc is opening → long grind → finale. Direction proposed: make healing physical (per-wing world
changes), plant the mystery early, humanize the gates, let the valley talk, add a midpoint lantern
night. v3.1's markers/celebrations fixed *visibility* of the story; this is about the story itself.

## 2026-07-13 (later) — Green light: build the world split and the story pass

**Owner:** *"Okay, let's go ahead and continue building those two things."* — i.e. the two items
deliberately deferred from the 2026-07-12 playtest: (1) the world split ("maybe the farm is just a
farm, and you move out of the farm to a different map to get to the village… build the village out
a little more and spread it out — it's too small") and (2) story visibility ("it's kind of hard to
see the point of the story… the main mission doesn't shine through").

**Direction locked.** Built as the v3.0 arc, plan in [VALLEY_V3.md](VALLEY_V3.md):
- **v3.0.0 "The Valley Opens"** — the farm map becomes pure farm (town removed → more open land);
  a new, larger **village map** with plaza, fountain, lamps, extra houses, and the mine/beach
  attached to it (town as the hub); a road links farm ⇄ village. Existing saves migrate
  layout-preservingly (crops, orchards, hives, tilled fields carried over).
- **v3.1.0 "The Thread"** — story beats you can't miss: quest markers over the relevant neighbour's
  head, a small celebration when a Guild wing lights, and the morning card naming the story's next
  step. The act framing (v2.2) finally gets a world big enough to read in.

## 2026-07-13 — Atlas per release: keep a reference of the game's state at every version

**Owner feedback (near-verbatim):**

> Make sure to generate a version of this for every version, or at least every major version,
> that gets released so that we have a reference for what the state of the game is.

**Interpretation.** The atlas shouldn't only answer "what is the game now" — it should answer
"what was the game at v2.4" without archaeology through the changelog. One snapshot per release,
kept forever, becomes the design-history record: you can watch the XP curve, the map count, and
the economy change release by release.

**Direction call (ours).** Made the generator self-archiving: every run writes
`atlas/v<version>.html` (named from the build's own `VERSION`) plus an auto-rebuilt
`atlas/index.html`, and the release checklist in `AGENTS.md` now includes the regen step — so
snapshots happen as a side effect of releasing, not as a thing to remember. Added `--src` retro
mode (soft assertions, graceful degradation for data that didn't exist yet) and backfilled all
15 existing tags, v2.1.0 → v2.9.2. The archive already reads as history: v2.1.0's atlas shows
the 13M-XP RuneScape curve, v2.9.1's grows the tenth map (the Deep Grove).

**Produced:** `atlas/` (15 snapshots + index), generator upgrade. See `CHANGELOG.md`, same date.

## 2026-07-12 (later still) — Owner asks for a Game Atlas: see the whole game without playing it

**Owner feedback (near-verbatim):**

> Apart from a dev log, I would like a sort of poster, presentation, or HTML file that just
> shows the expanse of the game: what the whole game looks like, so that I don't need to play
> through it every time to see what the game is like when completed. For example: a skill tree —
> how many things are unlocked, missions, every mission laid out, maps that you can unlock, and
> people you can meet, almost like an instruction manual for the entire game. A storyline,
> basically some game kit that I could just explore so that I see the game without having to
> test it each time. Build that.

**Interpretation.** The owner needs a *reviewable artifact* of the finished game — the whole
design surface (story, quests, unlocks, maps, people, calendar, economy, completion) on one
page, explorable without a playthrough. This is a designer's tool as much as a manual: it makes
"is the game big/coherent enough?" answerable at a glance, and it makes future feedback cheaper
because the owner can point at the atlas instead of grinding to the relevant content.

**Direction call (ours).** Built as a *generator* (`tools/build-atlas.mjs`), not a hand-written
page — it evaluates the live game data files and emits `GAME_ATLAS.html`, so the atlas can never
drift from the build; regenerate after any content change. Spoilers folded behind toggles so it
still works as a player-facing manual.

**Produced:** `GAME_ATLAS.html` + `tools/build-atlas.mjs`. See `CHANGELOG.md`, same date.

## 2026-07-12 (later) — Second playtest: mine traversal, busted gold economy, frozen time, a forest, and the story getting lost

**Owner feedback (condensed, preserving the words that matter):**

> When going up the mine there should be a quick exit option… and I want a checkpoint system just
> like in Stardew Valley where there's an elevator… some sort of mechanism to unlock the elevator —
> maybe a resource dump where you pay a certain amount to unlock it to a certain floor… right now
> you don't save progress in the mine, plus when you're on level 10 and want to go up you climb 10
> flights of stairs — that's just not economical.
>
> Gold is kind of busted right now… it's so easy to make money by mining gems and selling them, and
> suddenly you could order a full set of chickens, full set of cows, upgrade all your tools right
> away… once you find a way to make so much money, progression elsewhere becomes broken and useless…
> I have a gold axe that just cuts through every tree right away… right now it's mining and gold and
> then you unlock everything else. The gems are just too easy to get.
>
> You quickly run out of time while mining. I would like time to pause while you're in the mine,
> just like in Harvest Moon… suddenly you fall asleep — it doesn't provide satisfying gameplay.
>
> One of the problems is with woodcutting; you just run out of trees. There's no procedurally
> generated forest — the equivalent of a mine where you could cut trees and gain resources…
> Perhaps we could gate tool upgrades with several resources… a certain type of wood to upgrade
> your axe and your pickaxe, ensuring you won't just max out mining — you have to work on your
> woodcutting as well. This way you're forced to explore the rest of the game.
>
> [Not to implement now:] The world still feels kind of small… maybe the farm is just a farm, and
> you move to a different map to get to the village… build the village out and spread it out.
>
> In general it's kind of hard to see the point of the story. I get kind of lost. There are a lot
> of fetch quests… while I level these things up, the main mission doesn't shine through.
>
> Feel free to spin up sub-agents… but I want you to plan this out as a whole first to make sure
> the game is still fun and progression is balanced.

**Interpretation — one root problem, several symptoms.** The economy has a single dominant faucet
(mine gems + gold ore) and gold is a universal key (tools, animals, saplings). So mining trivially
unlocks everything, tool tiers are purchases rather than achievements, and the other skills become
decoration. The mine itself also has QoL debt (no lift, no quick exit, the clock punishes being
underground). And woodcutting lacks its "mine" — a renewable place to practice the skill.

**Direction locked (built as v2.9.x):** (1) mine QoL — quick exit + a restore-the-old-lift
checkpoint system paid in resources, and time frozen underground; (2) a procedural, daily-
regenerating forest map for woodcutting; (3) multi-resource tool upgrades (wood + ore + gold, gems
for top tiers) + gem faucet/price nerf, so every tool tier requires multiple skills. **Recorded for
the roadmap, not built now:** the world split / bigger village (owner's explicit deferral) and a
story-visibility pass beyond what fits here — the deep fix (the story walking through the world)
belongs with the world expansion. Full design: `ECONOMY_REBALANCE.md`.

## 2026-07-12 — Progression verdict: v2.7 curve overshot; early levels must be earned

**Owner feedback (near-verbatim):**

> I think it was a little too rewarding in the beginning. It doesn't have to mirror RuneScape's
> XP curve; it just has to feel the right amount of rewarding.
>
> Actually having slower levels in the beginning could be useful, allowing us to enjoy the game
> and progress at a healthy pace. This way, the first few levels won't just feel like junk
> levels. They don't need to follow RuneScape's XP curve in any way; it's just the idea of
> having a long progression that helps, followed by a sort of mastery award in the end, you know?
>
> So, I just want you to fix the gameplay experience regarding the progression system and spend
> time addressing everything else this game has issues with, like the UI, sprites, or anything
> else. Make it just nice. Take your time.

**Interpretation.** Two directives:

1. **The v2.7 curve fixed the wrong end.** v2.7 ("A Fair Climb") was tuned to be gentler than RS
   *everywhere*, which made the opening trivial — a level every 1–3 actions to L10. That cheapens
   the very levels a new player feels first: they become "junk levels" that arrive before they're
   noticed. What the owner actually wants isn't "gentle" — it's **paced**: early levels slow enough
   to be *earned* and savored, a long steady climb (the RS *idea* of long progression, minus its
   punishing math), and a genuine completionist crown at the end. Reward density should feel
   roughly even across the journey, not front-loaded.
2. **A general quality pass** — UI, sprites, "anything else… make it just nice." Open-ended polish
   mandate: play the build, find what's rough, fix it, verify visually.

**Produced:** v2.8.0 curve retune (level-preserving for existing saves — the cozy contract means a
recalibration must never demote anyone), then a rolling polish pass. See `CHANGELOG.md`.

## 2026-07-11 — First full playtest verdict: fun core, cold open

**Owner feedback (near-verbatim):**

> It's actually quite fun now. Just needs a better new player experience. The core gameplay
> progression is pretty good.
>
> But when I casually play, I don't experience the main storyline. I don't know what the main
> point / mission is. There should be like an overall plot to this that shines through more.
> Can't just drop the player into the game right away. There should be an exposition to the
> story, then some tutorials.
>
> It doesn't have to be super built out right now — an initial beta version of it could be
> planned and built out first. Cutscenes and other details can be in the roadmap further down
> the road, when the core parts of the game are better built.

**Interpretation.** Three distinct complaints, all about *exposure*, not content:

1. **No exposition.** The game opens on Grandpa's letter and drops you on the farm. The
   letter is warm but never states the premise (the Guild went dark, the festival died, the
   valley is waiting to be woken) or the mission (relight the Nine Crafts, bring the
   festival back). The premise currently arrives at quest #4 — *if* you read Rowan's lines.
2. **No tutorial.** "How to Play" is an optional wall of text on the title screen. Nothing
   in-game teaches the verbs contextually.
3. **The main storyline doesn't shine through in casual play.** The tracker shows only the
   current small task ("Till a patch of soil") with no arc framing — a casual player never
   sees that they're inside an act structure that ends with lanterns on the water.

Notably the story *content* already exists and is strong (Grandpa's letters, the two-act
quest spine, the festival finale, the Almanac pages). The fix is pacing and surfacing, not
writing more story.

**Direction call.** Plan first, build later. Beta scope only — full cutscenes and polish go
on the roadmap for after the core game is further along.

**Produced:** [NEW_PLAYER_EXPERIENCE.md](NEW_PLAYER_EXPERIENCE.md) — the beta NPX plan.

**Built:** **v2.2.0 "First Light"** (2026-07-11) — all three workstreams shipped to beta
(prologue + mission letter + Maya arrival; contextual verb hints + tips + in-Journal how-to;
act-aware tracker/journal + Continue recap). See `CHANGELOG.md`. The roadmap tier (§6 of the
plan — art'd prologue, per-NPC intros, music stings) stays deferred, per the owner's call.
