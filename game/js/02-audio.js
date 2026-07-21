"use strict";
/* ============================================================
   02-audio.js — 100% synthesized audio (WebAudio).
   Generative adaptive music + a library of SFX. No files.
   ============================================================ */

const SND = {
  ctx:null, master:null, musicGain:null, sfxGain:null,
  musicRev:null, musicDelay:null, sfxRev:null, sfxDelay:null,
  musicVol:0.55, sfxVol:0.8, musicOn:true, sfxOn:true,
  mode:"title", started:false, sched:null,
  step:0, nextTime:0, bar:0, lastLead:69, rain:null, rainGain:null, rainLevel:0,
};

(function loadAudioPrefs(){
  try{ const p = JSON.parse(localStorage.getItem("hs_audio")); if(p){
    if(typeof p.m==="number") SND.musicVol=p.m;
    if(typeof p.s==="number") SND.sfxVol=p.s;
    // Audio split into independent Music + Sound FX toggles. Older saves stored a single
    // {on} master flag — seed both from it, then let the newer keys override if present.
    if(typeof p.on==="boolean"){ SND.musicOn=p.on; SND.sfxOn=p.on; }
    if(typeof p.music==="boolean") SND.musicOn=p.music;
    if(typeof p.sfx==="boolean") SND.sfxOn=p.sfx;
  }}catch(e){}
})();
function saveAudioPrefs(){ try{ localStorage.setItem("hs_audio", JSON.stringify({m:SND.musicVol,s:SND.sfxVol,music:SND.musicOn,sfx:SND.sfxOn,on:SND.musicOn||SND.sfxOn})); }catch(e){} }

const midi = n => 440 * Math.pow(2, (n - 69) / 12);

function audioEnsure(){
  if(SND.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  SND.ctx = ctx;

  SND.master = ctx.createGain(); SND.master.gain.value = 0.9; SND.master.connect(ctx.destination);

  SND.musicGain = ctx.createGain(); SND.musicGain.gain.value = SND.musicOn ? SND.musicVol : 0;
  SND.musicGain.connect(SND.master);
  SND.sfxGain = ctx.createGain(); SND.sfxGain.gain.value = SND.sfxOn ? SND.sfxVol : 0;
  SND.sfxGain.connect(SND.master);

  // Per-category reverb + feedback-delay sends. CRITICAL: each bus's wet return feeds its own
  // category gain (music → musicGain, sfx → sfxGain), NOT the master. The old build shared one
  // reverb + one delay wired straight to master, so the wet tails of the generative pads & leads
  // bypassed musicGain entirely — that reverberant wash kept playing even with music "off" (the
  // "faint background music when muted" bug). Routing the returns through the category gains means
  // muting a category silences its tail too. One convolver per bus (buffers are shared).
  const revBuf = makeImpulse(2.1, 2.6);
  function makeFxBus(destGain){
    const rev = ctx.createConvolver(); rev.buffer = revBuf;
    const revGain = ctx.createGain(); revGain.gain.value = 0.28;
    rev.connect(revGain); revGain.connect(destGain);
    const delay = ctx.createDelay(); delay.delayTime.value = 0.34;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const dWet = ctx.createGain(); dWet.gain.value = 0.18;
    delay.connect(fb); fb.connect(delay); delay.connect(dWet); dWet.connect(destGain);
    return { rev, delay };
  }
  const mBus = makeFxBus(SND.musicGain); SND.musicRev = mBus.rev; SND.musicDelay = mBus.delay;
  const sBus = makeFxBus(SND.sfxGain);   SND.sfxRev  = sBus.rev;  SND.sfxDelay  = sBus.delay;

  // rain noise (silent until weather turns it up)
  const rain = ctx.createBufferSource(); rain.buffer = makeNoise(2.5); rain.loop = true;
  const rf = ctx.createBiquadFilter(); rf.type = "bandpass"; rf.frequency.value = 1400; rf.Q.value = 0.6;
  const rg = ctx.createGain(); rg.gain.value = 0;
  rain.connect(rf); rf.connect(rg); rg.connect(SND.master); rain.start();
  SND.rain = rain; SND.rainGain = rg;

  startScheduler();
}
function audioResume(){ audioEnsure(); if(SND.ctx && SND.ctx.state === "suspended") SND.ctx.resume(); }

function makeImpulse(dur, decay){
  const ctx = SND.ctx, len = ctx.sampleRate * dur, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for(let c=0;c<2;c++){ const d = buf.getChannelData(c);
    for(let i=0;i<len;i++){ d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay); } }
  return buf;
}
function makeNoise(dur){
  const ctx = SND.ctx, len = ctx.sampleRate * dur, buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0); for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
  return buf;
}

// ---- core note voice ----
function note(freq, t, dur, opt={}){
  if(!SND.ctx) return;
  const ctx = SND.ctx;
  const o = ctx.createOscillator();
  o.type = opt.type || "triangle";
  o.frequency.setValueAtTime(freq, t);
  if(opt.detune) o.detune.value = opt.detune;
  if(opt.glide) o.frequency.exponentialRampToValueAtTime(opt.glide, t + dur);
  const g = ctx.createGain();
  const peak = opt.gain ?? 0.3;
  const atk = opt.atk ?? 0.01, rel = opt.rel ?? Math.min(0.4, dur*0.9);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + atk);
  g.gain.setValueAtTime(peak, t + Math.max(atk, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if(opt.filter){ const f = ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value = opt.filter; node.connect(f); node = f; }
  node.connect(g);
  const dest = opt.dest || SND.musicGain;
  g.connect(dest);
  // send the wet signal to the SAME category's bus as the dry, so a muted gain kills the tail too
  const toSfx = dest === SND.sfxGain;
  if(opt.rev) g.connect(toSfx ? SND.sfxRev : SND.musicRev);
  if(opt.delay) g.connect(toSfx ? SND.sfxDelay : SND.musicDelay);
  o.start(t); o.stop(t + dur + 0.05);
}

// ---------------------------------------------------------------
//  GENERATIVE MUSIC
// ---------------------------------------------------------------
// progression: pad chord tones + bass root (MIDI)
const PROG_DAY = [
  { pad:[60,64,67], bass:36 },  // C
  { pad:[55,59,62], bass:31+12 }, // G (43)
  { pad:[57,60,64], bass:33+12 }, // Am (45)
  { pad:[53,57,60], bass:29+12 }, // F (41)
];
const PROG_NIGHT = [
  { pad:[57,60,64], bass:45 },  // Am
  { pad:[53,57,60], bass:41 },  // F
  { pad:[60,64,67], bass:48 },  // C
  { pad:[55,59,62], bass:43 },  // G
];
const PENT = [60,62,64,67,69,72,74,76];  // C major pentatonic-ish
const PROG_COZY  = [ {pad:[57,60,64],bass:45}, {pad:[53,57,60],bass:41}, {pad:[55,59,62],bass:43}, {pad:[52,55,59],bass:40} ]; // Am F G Em
const PROG_MINE  = [ {pad:[57,60,64],bass:45}, {pad:[50,53,57],bass:38}, {pad:[55,58,62],bass:43}, {pad:[57,60,64],bass:45} ]; // Am Dm G Am
const PROG_BEACH = [ {pad:[60,64,67],bass:36}, {pad:[57,60,64],bass:45}, {pad:[53,57,60],bass:41}, {pad:[55,59,62],bass:43} ]; // C Am F G
const PROG_UNDER = [ {pad:[57,60,63],bass:45}, {pad:[56,59,62],bass:44}, {pad:[53,56,60],bass:41}, {pad:[57,60,63],bass:45} ]; // v4.0: Am Ab F Am — minor, close, uneasy but not frightening — the tenth wing
function progFor(){ switch(SND.mode){ case "night":return PROG_NIGHT; case "cozy":return PROG_COZY; case "mine":return PROG_MINE; case "under":return PROG_UNDER; case "beach":return PROG_BEACH; default:return PROG_DAY; } }

function startScheduler(){
  if(SND.sched) return;
  SND.step = 0; SND.bar = 0; SND.nextTime = SND.ctx.currentTime + 0.1;
  SND.sched = setInterval(scheduler, 25);
}
function tempo(){ return {night:66, title:80, cozy:74, mine:58, under:52, beach:92}[SND.mode] || 86; }   // v4.0: the Undercroft is the slowest, most spacious theme

function scheduler(){
  if(!SND.ctx) return;
  const spb = 60 / tempo();          // seconds per beat
  const stepDur = spb / 4;           // 16th notes
  while(SND.nextTime < SND.ctx.currentTime + 0.12){
    playStep(SND.step, SND.nextTime, stepDur);
    SND.nextTime += stepDur;
    SND.step = (SND.step + 1) % 16;
    if(SND.step === 0) SND.bar = (SND.bar + 1) % 4;
  }
}

function playStep(step, t, stepDur){
  const mode = SND.mode;
  const dark = (mode === "night" || mode === "mine" || mode === "under");   // v4.0: the Undercroft reads dark, like the mine
  const bright = (mode === "day" || mode === "title" || mode === "beach");
  const prog = progFor();
  const ch = prog[SND.bar];
  const beat = step % 4 === 0;

  // pad — swell at bar start
  if(step === 0){
    const pv = dark ? 0.05 : 0.07;
    ch.pad.forEach(m => note(midi(m + (dark?-12:0)), t, stepDur*15, { type:"triangle", gain:pv, atk:0.4, rel:1.2, filter:dark?820:1600, rev:true }));
  }
  // bass
  if(step === 0 || step === 8){
    note(midi(ch.bass - 12), t, stepDur*6, { type:"sine", gain: dark?0.15:0.2, atk:0.02, rel:0.3, filter:500 });
  }
  // gentle pluck (bright modes)
  if(bright && (step === 4 || step === 12)){
    note(midi(ch.pad[1] + 12), t, stepDur*3, { type:"triangle", gain:0.05, atk:0.005, rel:0.3, filter:2400, delay:true });
  }
  // lead melody
  const leadChance = mode==="mine"?0.08 : mode==="night"?0.12 : mode==="cozy"?0.18 : mode==="title"?0.34 : mode==="beach"?0.30 : 0.26;
  if((step % 2 === 0) && Math.random() < leadChance){
    let idx = PENT.indexOf(SND.lastLead); if(idx < 0) idx = 3;
    idx = clamp(idx + randi(-2,2), 0, PENT.length-1);
    let m = PENT[idx]; SND.lastLead = m; if(dark) m -= 12;
    note(midi(m), t, stepDur*(beat?3.5:2.2), { type: mode==="mine"?"sine":"triangle", gain: dark?0.07:0.11, atk:0.01, rel:0.4, filter: mode==="mine"?1600:3000, rev:true, delay:!dark });
  }
  // sparkle
  if(step === 6 && Math.random() < (dark?0.15:0.1)){
    note(midi(pick(PENT)+12), t, stepDur*4, { type:"sine", gain:0.045, atk:0.01, rel:0.6, rev:true, delay:true });
  }
}

function setMusicMode(m){
  if(SND.mode === m) return;
  SND.mode = m;
}
// How much to duck the music for *audible* weather (1 = no duck). Rain rides the Sound FX bus,
// so with SFX off the weather is silent and there's nothing to make room for — don't duck. This
// is the single source of truth for the duck, so the slider/toggle setters honour it too (they
// used to write the raw musicVol, which un-ducked the music whenever the world clock was paused).
function currentDuck(){
  const v = SND.rainLevel;
  if(!SND.sfxOn || v <= 0) return 1;
  return v >= 1.3 ? 0.58 : 0.76;   // a storm ducks more than a drizzle
}
function setRainLevel(v){ // 0 = dry, 1 = rain, ~1.6 = storm
  SND.rainLevel = v;   // remembered so toggling Sound FX back on can restore the current weather
  // rain is an environmental sound effect — it rides the Sound FX toggle, not Music
  if(SND.rainGain) SND.rainGain.gain.setTargetAtTime(Math.min(v,1.8) * 0.075 * (SND.sfxOn?1:0), SND.ctx.currentTime, 0.8);
  // duck the music so audible weather has room to breathe
  if(SND.musicGain && SND.musicOn) SND.musicGain.gain.setTargetAtTime(SND.musicVol * currentDuck(), SND.ctx.currentTime, 0.9);
}
function setMusicOn(on){
  SND.musicOn = on; saveAudioPrefs();
  if(!SND.ctx) return;
  SND.musicGain.gain.setTargetAtTime(on ? SND.musicVol * currentDuck() : 0, SND.ctx.currentTime, 0.2);
}
function setSfxOn(on){
  SND.sfxOn = on; saveAudioPrefs();
  if(!SND.ctx) return;
  // quicker ramp up (0.03s) so the "select" confirmation blip lands at full level, not mid-fade
  SND.sfxGain.gain.setTargetAtTime(on?SND.sfxVol:0, SND.ctx.currentTime, on ? 0.03 : 0.2);
  // rain rides the SFX bus (via master), so restore/kill it to match the current weather at once
  if(SND.rainGain) SND.rainGain.gain.setTargetAtTime(Math.min(SND.rainLevel,1.8) * 0.075 * (on?1:0), SND.ctx.currentTime, 0.3);
  // toggling SFX changes whether the weather ducks music — re-apply the duck now
  if(SND.musicGain && SND.musicOn) SND.musicGain.gain.setTargetAtTime(SND.musicVol * currentDuck(), SND.ctx.currentTime, 0.3);
}
function setMusicVol(v){ SND.musicVol=v; saveAudioPrefs(); if(SND.ctx&&SND.musicOn) SND.musicGain.gain.setTargetAtTime(v * currentDuck(), SND.ctx.currentTime, 0.1); }
function setSfxVol(v){ SND.sfxVol=v; saveAudioPrefs(); if(SND.ctx&&SND.sfxOn) SND.sfxGain.gain.setTargetAtTime(v, SND.ctx.currentTime, 0.1); }

// ---------------------------------------------------------------
//  SOUND EFFECTS
// ---------------------------------------------------------------
function burst(t, dur, opt={}){ // filtered noise burst
  if(!SND.ctx) return;
  const ctx = SND.ctx, src = ctx.createBufferSource(); src.buffer = makeNoise(dur+0.05);
  const f = ctx.createBiquadFilter(); f.type = opt.ftype || "bandpass";
  f.frequency.setValueAtTime(opt.freq||1000, t);
  if(opt.sweep) f.frequency.exponentialRampToValueAtTime(opt.sweep, t+dur);
  f.Q.value = opt.q ?? 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(opt.gain??0.3, t+ (opt.atk??0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  src.connect(f); f.connect(g); g.connect(opt.dest||SND.sfxGain);
  // route the wet send to match the dry dest (all callers are SFX today; mirrors note() so a
  // future music-dest burst can't re-introduce the wet-bypass class this change fixed)
  if(opt.rev) g.connect((opt.dest||SND.sfxGain) === SND.sfxGain ? SND.sfxRev : SND.musicRev);
  src.start(t); src.stop(t+dur+0.05);
}
function blip(freq, t, dur, type, gain, opt={}){
  note(freq, t, dur, { type:type||"square", gain:gain??0.18, atk:0.004, rel:dur*0.7, dest:SND.sfxGain, ...opt });
}

// a little pitch jitter so repeated tool strikes never sound like a machine gun
const dj = f => f * (1 + rand(-0.1, 0.1));
const SFX = {
  step(){ const t=T0(); burst(t,0.09,{freq:dj(280),sweep:130,ftype:"lowpass",q:1,gain:0.09}); },
  till(){ const t=T0(); burst(t,0.16,{freq:dj(520),sweep:180,ftype:"lowpass",q:1.2,gain:0.28}); blip(dj(90),t,0.14,"triangle",0.14,{glide:60}); },
  water(){ const t=T0(); burst(t,0.28,{freq:1200,sweep:2600,ftype:"bandpass",q:0.7,gain:0.16}); for(let i=0;i<3;i++) blip(700+i*180, t+0.04+i*0.05, 0.08,"sine",0.06,{glide:400}); },
  plant(){ const t=T0(); blip(430,t,0.12,"triangle",0.16,{glide:660,rev:true}); },
  harvest(){ const t=T0(); [0,4,7,12].forEach((s,i)=> blip(midi(67+s),t+i*0.045,0.16,"triangle",0.13,{rev:true,delay:true})); },
  chop(){ const t=T0(); burst(t,0.12,{freq:dj(400),sweep:120,ftype:"lowpass",q:2,gain:0.3}); blip(dj(150),t,0.1,"square",0.14,{glide:70}); },
  mine(){ const t=T0(); blip(dj(1200),t,0.06,"square",0.14,{glide:1600}); burst(t,0.1,{freq:dj(2600),sweep:900,ftype:"highpass",q:1,gain:0.12}); },
  // a soft wooden latch — travelTo() has been calling this the whole time and it never existed
  door(){ const t=T0(); burst(t,0.13,{freq:220,sweep:80,ftype:"lowpass",q:1.4,gain:0.15}); blip(120,t+0.02,0.11,"sine",0.09,{glide:70}); },
  ore(){ const t=T0(); [72,76,79].forEach((m,i)=>blip(midi(m),t+i*0.05,0.14,"sine",0.11,{rev:true})); },
  get(){ const t=T0(); blip(midi(76),t,0.09,"sine",0.12,{}); blip(midi(83),t+0.07,0.12,"sine",0.1,{rev:true}); },
  coin(){ const t=T0(); blip(1400,t,0.06,"square",0.1,{glide:1900}); blip(1900,t+0.05,0.08,"square",0.09,{glide:2500,rev:true}); },
  sell(){ const t=T0(); [0,5,9].forEach((s,i)=>blip(1300+s*90,t+i*0.05,0.09,"square",0.09,{})); },
  level(){ const t=T0(); [60,64,67,72,76].forEach((m,i)=>blip(midi(m),t+i*0.09,0.3,"triangle",0.16,{rev:true,delay:true})); },
  quest(){ const t=T0(); [67,71,74,79].forEach((m,i)=>blip(midi(m),t+i*0.11,0.35,"triangle",0.15,{rev:true,delay:true})); },
  menu(){ const t=T0(); blip(660,t,0.05,"square",0.09,{}); },
  menuClose(){ const t=T0(); blip(440,t,0.05,"square",0.08,{glide:330}); },
  blipTalk(){ const t=T0(); blip(520+rand(-40,40),t,0.04,"square",0.05,{}); },
  gift(){ const t=T0(); [72,76,81,84].forEach((m,i)=>blip(midi(m),t+i*0.06,0.2,"sine",0.11,{rev:true})); },
  heart(){ const t=T0(); blip(midi(72),t,0.15,"sine",0.12,{glide:midi(79),rev:true}); },
  error(){ const t=T0(); blip(200,t,0.14,"square",0.12,{glide:120}); },
  sleep(){ const t=T0(); note(midi(72),t,1.4,{type:"sine",gain:0.14,atk:0.05,rel:1.2,glide:midi(48),dest:SND.sfxGain,rev:true}); },
  wake(){ const t=T0(); [55,60,64,67].forEach((m,i)=>blip(midi(m),t+i*0.12,0.4,"triangle",0.12,{rev:true,delay:true})); },
  splash(){ const t=T0(); burst(t,0.22,{freq:900,sweep:2400,ftype:"bandpass",q:0.6,gain:0.16}); },
  catch(){ const t=T0(); [64,69,72,76].forEach((m,i)=>blip(midi(m),t+i*0.06,0.18,"triangle",0.13,{rev:true})); },
  bite(){ const t=T0(); blip(880,t,0.08,"square",0.14,{}); blip(1100,t+0.09,0.08,"square",0.12,{}); },
  escape(){ const t=T0(); blip(560,t,0.22,"triangle",0.12,{glide:150}); burst(t+0.05,0.3,{freq:1400,sweep:400,ftype:"bandpass",q:0.8,gain:0.1}); },
  // a distant roll — low, long, and entirely harmless
  thunder(){ const t=T0()+rand(0.1,0.5);
    burst(t, 1.5, {freq:180, sweep:40, ftype:"lowpass", q:0.6, gain:0.16});
    burst(t+0.18, 1.1, {freq:90, sweep:30, ftype:"lowpass", q:0.5, gain:0.11});
    blip(52, t+0.05, 0.9, "triangle", 0.07, {glide:30}); },
  select(){ const t=T0(); blip(587,t,0.05,"square",0.08,{}); },
  upgrade(){ const t=T0(); [55,62,67,74,79].forEach((m,i)=>blip(midi(m),t+i*0.07,0.28,"triangle",0.14,{rev:true,delay:true})); },
  // the legendary catch — grander and longer than a level-up: a rising seven-note flourish over a
  // low sustained fifth, so landing a legend never sounds like just another level.
  legend(){ const t=T0();
    [60,64,67,72,76,79,84].forEach((m,i)=>blip(midi(m),t+i*0.085,0.5,"triangle",0.15,{rev:true,delay:true}));
    [48,55].forEach(m=>note(midi(m),t,1.1,{type:"sine",gain:0.09,atk:0.02,rel:0.9,dest:SND.sfxGain,rev:true})); },
  // v4.0 Warding — a woody thunk with a faint tonal ring; a settle is a soft descending bell; a
  // knockout is a gentle glide down (never a death sting); the bell is the tenth door's threshold.
  staveHit(){ const t=T0(); burst(t,0.1,{freq:dj(320),sweep:100,ftype:"lowpass",q:2,gain:0.24}); blip(dj(180),t,0.12,"triangle",0.13,{glide:90,rev:true}); },
  settle(){ const t=T0(); [67,64,60,57].forEach((m,i)=>blip(midi(m),t+i*0.07,0.24,"sine",0.11,{rev:true})); },
  knockout(){ const t=T0(); note(midi(64),t,1.2,{type:"sine",gain:0.12,atk:0.03,rel:1.0,glide:midi(43),dest:SND.sfxGain,rev:true}); burst(t+0.1,0.5,{freq:180,sweep:60,ftype:"lowpass",q:0.6,gain:0.09}); },
  bellRing(){ const t=T0(); [72,79,84].forEach((m,i)=>blip(midi(m),t+i*0.12,0.7,"sine",0.12,{rev:true,delay:true})); },
  // v4.4 The Warden's Guard — a parry is a bright two-note ting (Stave-on-dark, the strike turned aside);
  // a plain block is a duller wooden clop (the blow caught, but felt).
  guardParry(){ const t=T0(); blip(midi(84),t,0.11,"triangle",0.15,{rev:true}); blip(midi(91),t+0.02,0.2,"sine",0.11,{rev:true,delay:true}); },
  guardBlock(){ const t=T0(); burst(t,0.09,{freq:210,sweep:-40,ftype:"lowpass",q:1,gain:0.18}); blip(dj(150),t,0.09,"triangle",0.09,{rev:true}); },
};
function T0(){ return SND.ctx ? SND.ctx.currentTime + 0.001 : 0; }
function playSfx(name){ if(SND.sfxOn && SND.ctx && SFX[name]) SFX[name](); }

// ambient nature layer (called sparsely from the weather system) — birdsong/crickets are SFX
function ambBird(){ if(!SND.sfxOn || !SND.ctx) return; const t=T0(); const base=1500+Math.random()*700;
  for(let i=0;i<3;i++) blip(base + i*160*(Math.random()<.5?1:-1), t+i*0.06, 0.05, "sine", 0.028, {rev:true}); }
function ambCricket(){ if(!SND.sfxOn || !SND.ctx) return; const t=T0();
  for(let i=0;i<3;i++) blip(4400, t+i*0.035, 0.02, "square", 0.012, {}); }
