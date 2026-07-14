# HarvestScape — Agent Guide

Guide for any AI agent (Claude Code, Gemini CLI, Cursor, Copilot, Cline, Windsurf, Codex,
etc.) working in this repository.

Cozy procedural farming game (Stardew Valley × RuneScape). Shipped build lives in `game/`,
served on port **8643**. 100% procedural — no asset files; all art is canvas code, all
audio is WebAudio synthesis.

---

## ★ Standing rule: log every change, commit regularly

This repo keeps a **complete audit trail of every game change and the reasoning behind it**,
so the whole project can later be handed to another AI agent and rebuilt — possibly in a
different engine or direction — with full knowledge of *why* each decision was made.

**Every agent working here MUST:**

1. **Record all game changes in `CHANGELOG.md`.** This is the *single* internal log —
   there is intentionally **no separate public-facing changelog**. It covers everything:
   features, balance tweaks, bug fixes, UX polish, and the design decisions behind them.
2. **Write *why*, not just *what*.** The git diff already records what changed. The log's
   value is the intent — the problem, the options, and why this fix was the right one. A
   future agent recreating the game needs the reasoning, not a one-liner.
3. **Update the log in the same change as the code**, under the `[Unreleased]` heading; on
   commit, retitle that section with the date and commit hash.
4. **Commit and push freely and regularly** — after each coherent unit of work, not in one
   giant dump. Small, well-described commits *are* the audit trail. Don't let the working
   tree pile up, and **don't wait to be asked** — the owner has standing approval for you to
   commit and push on your own.
   - **Commit directly to `master` and push** — that is the established workflow here. No
     feature branch or PR is needed unless the owner explicitly asks for one.
   - You don't need to pause for confirmation before committing or pushing. Everything here
     is versioned and reversible (`git revert`/`git reset`), so favor shipping small commits
     over hoarding uncommitted changes.
   - The one hard requirement stays: the `CHANGELOG.md` entry ships **in the same commit** as
     the code it describes.
5. **Version every release.** The build's version lives in `VERSION` (`game/js/01-data.js`):
   a semver `name` and a monotonic integer `code`. When you cut a release, **bump both**,
   add an entry to the in-game `CHANGELOG` array (same file — the player-readable mirror that
   the "What's New" panel renders), retitle the matching `CHANGELOG.md` section from
   `[Unreleased]` to the version + date, and **tag the commit** `git tag v<name>` before
   pushing (`git push --tags`). Version code + tag are the "relevant information" every push
   must carry so the audit trail is anchored to concrete releases. Keep `VERSION`, the in-game
   `CHANGELOG` array, and `CHANGELOG.md` in lockstep — they must never disagree.
6. **Snapshot the atlas with every release.** After bumping `VERSION`, run
   `node tools/build-atlas.mjs` and commit its output **in the release commit**: it refreshes
   `GAME_ATLAS.html` AND writes `atlas/v<version>.html` — the permanent record of the game's
   state at that release (the owner's per-version reference; see `atlas/index.html`). A past
   release can be backfilled with `--src` (see the header of `tools/build-atlas.mjs`).

Treat the changelog as non-optional deliverable output, the same as the code itself.

**Keep the README current.** Whenever the repo's structure or capabilities change, update
`README.md` (and this `AGENTS.md`) in the *same* change, so the docs never drift from the code.

---

## Running & verifying

- **Serve:** `python3 -m http.server 8643 --directory game` (see `.claude/launch.json`,
  config name `harvestscape`). Open `game/index.html`.
- **No build step.** Edit a JS file, bump the `?v=` cache-buster in `game/index.html`
  (all `<script>`/CSS tags share one version), reload.
- **Syntax-check before reload:** run each `game/js/*.js` through `new Function(src)` in
  node — a fast lint that catches parse errors across the shared-global setup.
- **Verify visually.** Changes to rendering/lighting/UI must be confirmed in the browser
  (screenshot the relevant scene), not just reasoned about. Check the console is clean of
  *game* errors (extension noise like MetaMask is unrelated).

## Architecture (the parts that constrain every change)

- **15 plain `<script>` files, one shared global scope.** No modules/bundler/libraries.
  Load order is load-bearing: `00-core` → `01-data` → `02-audio` → `03-art` → `04-world`
  → `05-particles` → `06-weather` → `07-entities` → `08-actions` → `09-quests` →
  `13-content` → `10-ui` → `11-title` → `14-story` → `12-game`. Function declarations hoist,
  so cross-file calls resolve at runtime — but data/const initialization order still matters.
- **Rendering:** internal 320×208 canvas, `imageSmoothingEnabled=false`, CSS-upscaled ~4×
  (`image-rendering:pixelated`). High-fidelity text draws to a separate device-resolution
  `#gtext` overlay (`05-particles.js`), *not* the pixel canvas — keep game text crisp there.
- **Lighting:** `drawLighting` in `06-weather.js` — multiply (ambient) + `lighter` (light
  pools from `collectLights`) + vignette. Ambient is per-context (outdoor sky gradient /
  mine / interior). Tune with a screenshot open; additive light glares easily.
- **Persistence:** only `state.farm` persists (localStorage). Interiors/mine/beach
  regenerate daily from `mapCache` (cleared nightly). Add new save fields via `migrateSave`.

## Design identity — do not break without explicit reason

- **No combat, ever. Nothing is ever taken from the player.** The mine, storms, and low
  energy are all deliberately non-hazardous. This is the cozy contract; protect it.
- **Stardew base × RuneScape skill grind (1–99).** The recurring design tension (tracked in
  the audits) is keeping the RuneScape progression layer as rich as the cozy farming base.

## Reference docs

- `CHANGELOG.md` — the audit trail (start here for history / intent).
- `DEVLOG.md` — the owner's playtest feedback and direction calls, near-verbatim. When the
  owner gives play feedback, record it there (raw signal + interpretation), then link the
  plan/changelog work it produces.
- `GAME_ATLAS.html` — the whole game on one page, generated from live game data by
  `node tools/build-atlas.mjs`. **Regenerate it whenever game content changes** (quests, crops,
  NPCs, recipes, maps…) and commit it with the change; the generator throws if its few
  hand-written mappings go stale.
- `atlas/` — one atlas snapshot per release (`v<version>.html` + an index), written
  automatically by every generator run. Never edit these by hand; they are the historical
  record of the game's state version by version.
- `GROVE_DEPTHS.md` — the Grove Depths plan (depth rings, waystones on a pledge ledger, tree
  rarity, canopy treasure, + the mine lift's ledger retrofit). **Shipped in v3.3.0** — kept as
  the design record behind that release.
- `NEW_PLAYER_EXPERIENCE.md` — the onboarding beta plan (shipped in v2.2.0; polish tier still
  on the roadmap).
- `GAME_DESIGN_PRINCIPLES.md` — the design bible; the yardstick audits grade against.
- `GAME_BALANCE_PRINCIPLES.md` — the balancing playbook: distilled, evidence-anchored rules for
  gold / XP / progression, plus a runnable checklist, a failure-mode graveyard, and a live
  reference-numbers appendix. **Read this before changing any economy, XP, or tier number** — it
  operationalizes the bible's economy/progression sections with anchors from our own rebalances.
- `DESIGN_SCORECARD.md` — latest graded audit of the build vs. the principles.
- `README.md`, `GAME_SCOPE.md`, `DESIGN_REVIEW.md`, `DESIGN_V1.5.md`, `ROADMAP_V2.html` —
  scope and planning history.

## Skills / specialist roles

There are currently **no repo-local skills or slash-commands** defined (`.claude/` holds only
`launch.json`). If a `.claude/skills/` directory is added later, mirror it at the neutral path
`skills/` (a symlink) and list each skill here — name, when to use it, and its entry file — so
non-native agents can read the skill's Markdown and adopt the role manually (auto-triggering is
tool-specific; the knowledge is plain Markdown).

## Cross-agent setup

`AGENTS.md` is the **canonical, single source of truth** for agent instructions. Every
tool-specific instruction filename is a **symlink** pointing at it, so no agent gets different
behavior:

| Symlink | Tool |
| --- | --- |
| `CLAUDE.md` | Claude Code |
| `GEMINI.md` | Gemini CLI |
| `.cursorrules` | Cursor (legacy) |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.clinerules` | Cline |
| `.windsurfrules` | Windsurf |

ChatGPT / Codex already read `AGENTS.md` directly. **To onboard a new tool:** add a symlink for
its expected filename pointing at `AGENTS.md` (`ln -s AGENTS.md <NAME>`; for nested targets use a
relative path, e.g. `ln -s ../AGENTS.md .github/copilot-instructions.md`).

**Windows / filesystem caveat:** symlinks require a Unix-y filesystem and
`git config core.symlinks true` (the default on macOS/Linux). If your platform doesn't resolve
the symlinks (e.g. a Windows checkout without symlink support), **open `AGENTS.md` directly** —
it is the real file; the others only point to it.
