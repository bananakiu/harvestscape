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
