# HarvestScape — Godot migration spike

A throwaway proof-of-concept, **not** the port itself. It de-risks the three subsystems that do
*not* translate trivially from the shipped vanilla-JS canvas build (`../game/`) to Godot 4.

Why these three: the asset pipeline that usually sinks a game port is a non-issue here — the game
has **zero asset files**. The risk is the opposite: the game's most distinctive systems (its
procedural art and synthesized audio) have no native engine feature to drop into, so they must be
rebuilt in code. This spike proves that rebuild is tractable while keeping the "100% procedural,
no files" identity intact.

| Risk | Shipped build | Proven here (`main.gd`) |
| --- | --- | --- |
| Procedural pixel-art | `03-art.js` — `px()` + seeded scatter onto offscreen canvases | Same approach on `Image`/`ImageTexture`: grass, soil, 3 crop stages |
| Pixel-perfect 320×208 | `00-core.js` canvas + CSS upscale, nearest-neighbour | `project.godot` viewport stretch; `spike_frame.png` is a native 320×208 buffer |
| Synthesized audio | `02-audio.js` — WebAudio node graph | Raw samples pushed into `AudioStreamGenerator` |

## Run it

Requires Godot 4.x (installed via `brew install --cask godot`; tested on 4.7).

```sh
godot --headless --import --path .   # one-time import
godot --path .                        # draws the scene, plays a blip, screenshots, quits
```

It writes `spike_frame.png` (the 320×208 render) and prints proof lines for the audio and render
passes. `.godot/` (import cache) and `spike_frame.png` are generated and git-ignored.

## Decision recorded

Engine choice (Godot 4 + GDScript over Unity) and the full reasoning live in
[`../CHANGELOG.md`](../CHANGELOG.md) under **2026-07-14**. The real port, when it starts, gets its
own `MIGRATION.md` phasing plan; this directory stays as the reference for how the tricky
subsystems translate.
