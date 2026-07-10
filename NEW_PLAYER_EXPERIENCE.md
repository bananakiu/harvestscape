# New Player Experience — Beta Plan

*Drafted 2026-07-11 from the owner's playtest feedback (see [DEVLOG.md](DEVLOG.md), same date).
Status: **planned, not built.** Target: a beta-quality NPX in the next feature release; the
polish tier (full cutscenes, art'd prologue) stays on the roadmap.*

---

## 1. The problem

The core loop is fun and progression is good — but a casual player never learns what the
game is *about*. Three symptoms, one cause: **the story exists but is not surfaced.**

What a new player actually experiences today (traced through the code):

| Minute | What happens | What's missing |
| --- | --- | --- |
| 0 | Title → Grandpa's letter (`LETTER`, `11-title.js`). Cozy, but its only nod to the plot is one clause: "the valley's gone quiet since the Guild closed its doors." | No premise, no stakes, no mission. |
| 1 | Dropped on the farm. Banner: "First task: wake the soil." Tracker: "Till a patch of soil." | Player knows *what to press*, not *why they're here*. |
| 1–30 | Quests 1–3 are farm/shop chores. The premise (Guild, Nine Crafts, dead festival) first appears at quest #4 (`old-keeper`) via Rowan's dialogue — easily skimmed. | The "point of the game" arrives late, quietly, and skippably. |
| any | "How to Play" is ~35 lines of prose behind an optional title-screen button (`showHowto`). Mechanics like the fishing minigame, `R` seed cycling, `J` journal are learn-by-reading. | No in-game, contextual teaching. |
| mid-game | Tracker shows only the current objective. The journal lists quests flat — no acts, no arc, no "story so far." | A casual player never perceives the two-act structure or the festival goal. |

Meanwhile the story content is already strong and *finished*: Grandpa's five letters, the
nine Almanac pages, a two-act quest spine, the festival finale, the memorial. This plan adds
almost no new story — it re-paces and re-surfaces what's there.

## 2. Design goals & non-goals

**Goals** — after this ships, a brand-new player within ~10 minutes can answer:
1. *Where am I?* (Willowbrook, Grandpa's farm, a valley gone quiet)
2. *Why am I here?* (Grandpa left me the farm — and unfinished business)
3. *What's the big goal?* (wake the valley: relight the Nine Crafts, bring back the festival)
4. *What do I do right now?* (the tracker's current task, taught contextually)

**Non-goals / constraints (the cozy contract):**
- **Nothing is forced or punishing.** Every prologue beat is skippable in one input; the
  tutorial never locks the sandbox. A player who skips everything plays exactly today's game.
- **No new engine work.** Everything below reuses the existing cutscene engine
  (`14-story.js`: `say/move/banner/fade/letter/run` steps), the letter UI, toasts, and flags.
- **No cutscene art, no new maps, no voice-of-god UI.** That's the roadmap tier (§6).
- **Save-compatible.** All new state is flags added via `migrateSave`; existing saves see
  none of the day-1 material (gate everything on `state.day === 1` / `introSeen`).

## 3. Beta scope — three workstreams

### A. Exposition: a real opening (est. ~1 session)

Replace the cold open with a three-beat prologue, all skippable:

1. **Premise cards** (before the letter): 3 short narration cards over a dark/vignetted
   title scene — the valley as it was (nine crafts, lanterns on the water), the quiet years
   (Guild doors closing one craft at a time), the inheritance ("then a letter came, addressed
   to you"). Implementation: the existing `banner`/letter UI on black, or a minimal
   `startCutscene` with `say` steps and no actors. One click advances; Esc/Skip exits to beat 2.
2. **Grandpa's letter, revised.** Keep the voice, add the mission. One new paragraph stating
   it plainly: the Guild's nine crafts went dark, the festival died with them, and he's
   leaving the player the one thing he couldn't do — *wake the valley*. (The current letter's
   "The rest, you'll figure out" stays — but now "the rest" has a name.)
3. **Arrival beat.** Day 1, on gaining control: Maya is at the farm gate (she's already an
   NPC with a portrait; `setpos` + short `say` exchange, ~4 lines). She welcomes you, names
   the town and Rowan ("the old man at the Guild Hall — go and hear him out, when you're
   settled"), and points at the plot. This plants the quest-#4 premise *in minute two* without
   moving the quest itself, and gives the valley a face immediately.

Also: **name the arc.** After the arrival beat, show the act banner — `"Act I — The Quiet
Valley"`. (Act II already has a natural title: "The Empty Chair", from its comment in
`01-data.js`.)

### B. Tutorial: teach in place, not in prose (est. ~1–2 sessions)

1. **First-verb prompts.** The first time each core verb is *needed* (not on a timer), show
   a small contextual hint: facing untilled soil with the hoe → "SPACE — till"; first bite on
   the line → "SPACE — hook it, then HOLD to keep the fish in the bar"; etc. One-shot flags
   (`state.flags.hint_till`, …) so each fires exactly once, ever. Suppressed entirely once
   the first quest chain is past (never nag a returning player).
2. **Move "How to Play" into the Journal.** The title-screen wall of text becomes reference
   pages inside the Journal (`J`) — where a playing player can actually consult it. The title
   button stays but opens the same content.
3. **First-encounter tips.** One toast the first time a system appears: first rain ("rain
   waters for you — and the fish rise"), first noticeboard read, first mine entry, first
   festival morning. Same one-shot flag pattern. These carry the load the prose dump carries
   today, one sentence at a time, at the moment of relevance.

### C. Make the storyline shine through mid-game (est. ~1 session)

1. **Act-aware tracker & journal.** The quest tracker and journal header show the act label;
   story quests get grouped under "Act I / Act II" in the journal instead of a flat list.
   The finale quest ("Wake the Valley") is visible early as the act's *destination* — greyed,
   at the bottom of Act I — so the player always sees where the chain is going.
2. **"Story so far" on Continue.** On load, one line under the welcome toast naming the
   current act + task ("Act I — The Quiet Valley · Rowan is waiting at the Guild Hall").
   Cheap: `trackerData()` already has everything needed.
3. **Consider: premise sooner in the chain.** Option to swap quests #3/#4 so "The Old
   Keeper" (meet Rowan, hear the premise) lands before the 250g shop grind. Decide at build
   time by feel — the arrival beat (A3) may already fix the timing without touching the chain.

## 4. Acceptance criteria (beta)

- A fresh save answers the four questions in §2 within ~10 minutes of play.
- Every prologue beat skippable in one input; total forced time for a skipping player ≈ 0.
- No hint or tip ever fires twice, and none fire on a pre-existing save.
- Old saves load unchanged (all new flags default off via `migrateSave`).
- `new Function` syntax check passes on all touched files; verified visually in the browser
  (fresh save *and* continued save), per the repo's verification rule.

## 5. Sequencing

Ship as one release (suggested: **v2.2 "First Light"**) or three small commits in this
order — each is independently shippable:

1. **A** (exposition) — highest impact per line of code; touches `11-title.js` (letter,
   intro flow), `14-story.js` (arrival cutscene), `01-data.js` (letter text).
2. **B** (tutorial) — touches `08-actions.js` (verb-hint call sites), `10-ui.js` (journal
   pages), `01-data.js` (tip text).
3. **C** (story visibility) — touches `10-ui.js` (tracker/journal), `11-title.js` (continue
   recap).

## 6. Roadmap tier (explicitly deferred)

Later, when the core game is further along — do **not** build these in the beta:

- A true art'd prologue: painted vignettes / the title-scene farmhouse at different eras.
- An interactive first morning (walk through the cottage, find the letter on the table
  yourself) instead of the letter-first open.
- Music: a prologue sting and an Act-transition motif.
- Per-NPC introduction scenes on first meeting (beyond Maya's arrival beat).
- A "story recap" journal tab that replays unlocked letters/cutscene summaries.
- New-game options (skip prologue checkbox for repeat players — only worth it once the
  prologue is long enough to want skipping wholesale).
