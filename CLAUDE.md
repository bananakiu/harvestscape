# HarvestScape — Agent Guide

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
4. **Commit and push regularly** — after each coherent unit of work, not in one giant dump.
   Small, well-described commits *are* the audit trail. Don't let the working tree pile up.
   - Branch first if on a protected branch; otherwise commit to the working branch.
   - Only commit/push when it won't surprise the user, or when they've asked you to.

Treat the changelog as non-optional deliverable output, the same as the code itself.

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
- `GAME_DESIGN_PRINCIPLES.md` — the design bible; the yardstick audits grade against.
- `DESIGN_SCORECARD.md` — latest graded audit of the build vs. the principles.
- `README.md`, `GAME_SCOPE.md`, `DESIGN_REVIEW.md`, `DESIGN_V1.5.md`, `ROADMAP_V2.html` —
  scope and planning history.
