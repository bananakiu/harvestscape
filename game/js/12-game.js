"use strict";
/* ============================================================
   12-game.js — main loop & boot.
   ============================================================ */

let _last = 0, _hudAcc = 0;
function loop(ts){
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
        updateFishing(dt);
        updateWeather(dt);
        maybeSeasonalFestival();        // a festival window can open while you stand on the sand
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
    _hudAcc += dt;
    if(_hudAcc > 0.2){ _hudAcc = 0; refreshHUD(); }
  }

  requestAnimationFrame(loop);
}

function boot(){
  ctx.imageSmoothingEnabled = false;
  initTitle();
  wireTouch();
  setControlsHint();
  requestAnimationFrame(loop);
}
boot();
