"use strict";
/* ============================================================
   12-game.js — main loop & boot.
   ============================================================ */

let _last = 0, _hudAcc = 0;

// ---- v5.0 "The Strongbox": the frame probe ----
// V5's headline features (the persistent decoratable cottage above all) add drawn objects to a map
// the player stands in every single day, and V6 adds more. "It feels fine on my machine" is not a
// budget, so this measures the real thing: the CPU cost of one whole loop pass — update + render —
// separated from the idle wait for vsync that `dt` includes.
//
// Off by default and one null-check per frame when off. Run it from the console with the dense
// year-3 save loaded (tools/fixtures/saves/dense-year3.json, restorable through the Save File panel):
//     await perfProbe(5)   →  { frames, avg, p50, p95, worst }   — all milliseconds of work
// The recorded budget and how to read it live in tools/check-perf.mjs.
let _perf = null;
function perfProbe(seconds = 5){
  _perf = { t: [], until: performance.now() + seconds * 1000 };
  return new Promise(resolve => {
    const wait = () => {
      if(_perf && performance.now() < _perf.until) return setTimeout(wait, 100);
      const t = (_perf ? _perf.t : []).slice().sort((a, b) => a - b);
      _perf = null;
      if(!t.length) return resolve({ frames: 0 });
      const at = q => t[Math.min(t.length - 1, Math.floor(q * t.length))];
      resolve({ frames: t.length, avg: +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2),
                p50: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), worst: +t[t.length-1].toFixed(2),
                map: (typeof state !== "undefined" && state) ? state.map : null });
    };
    wait();
  });
}

function loop(ts){
  const _p0 = _perf ? performance.now() : 0;
  let dt = (ts - _last) / 1000;
  if(!isFinite(dt) || dt <= 0) dt = 0.016;
  dt = Math.min(dt, 0.05);
  _last = ts;
  animT += dt;

  updateTweens(dt);

  if(gameMode === "play"){
    const frozen = hitstop > 0;
    if(hitstop > 0) hitstop = Math.max(0, hitstop - dt);
    if(!paused && !frozen){
      updatePlayer(dt);                 // handles its own ui-blocking (stops movement)
      if(!uiBlocking()){                // menus & dialogue pause the world clock
        tutoringTick();                 // contextual new-player hints (one-shot, npx saves only)
        updateTime(dt);
        updateNpcs(dt);
        updateAnimals(dt);
        updateCreatures(dt);            // v4.0 — Undercroft AI; a no-op on every map without creatures
        updateFishing(dt);
        updateUseHold(dt);                // v4.27: hold USE to keep swinging (paced to the swing animation)
        updateWeather(dt);
        maybeSeasonalFestival();        // a festival window can open while you stand on the sand
        maybeLanternTest();             // the midpoint beat fires the first time you enter the village at 5 wings
        maybePlazaLife();               // Tom steps out for a midday stretch — the plaza's third face
        maybeBuildCeremony();           // v3.24: the banner/sparkle when you step out to a newly-raised building
      }
    }
    updateParticles(dt);
    updateCutscene(dt);
  }

  // render
  if(gameMode === "title" || gameMode === "intro"){
    drawTitleScene();
    clearTextLayer();               // no world text on the title/intro screens
  } else {
    renderWorld();                  // ends by flushing all queued text to the overlay
  }

  if(gameMode === "play"){
    syncGold();                       // count the gold pill up/down every frame (tween-driven)
    _hudAcc += dt;
    if(_hudAcc > 0.2){ _hudAcc = 0; refreshHUD(); }
  }

  if(_perf) _perf.t.push(performance.now() - _p0);   // work only — the vsync wait is not ours to count
  requestAnimationFrame(loop);
}

function boot(){
  ctx.imageSmoothingEnabled = false;
  initTitle();
  wireTouch();
  wireTooltips();   // v4.30: one delegated hover tip for every data-icon surface
  setControlsHint();
  requestAnimationFrame(loop);
}
boot();
