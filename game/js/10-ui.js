"use strict";
/* ============================================================
   10-ui.js — HUD, panels, dialogue, input wiring.
   ============================================================ */

// ?touch=1 forces the on-screen controls (handy for testing, and for hybrid laptops)
const IS_TOUCH = matchMedia("(pointer:coarse)").matches || "ontouchstart" in window
              || /[?&]touch=1/.test(location.search);

// ---- open-panel tracking ----
const openPanels = new Set();
function anyPanelOpen(){ return openPanels.size > 0; }
function uiBlocking(){ return dlg.open || anyPanelOpen() || !!_panoClose; }   // v3.43: the panorama blocks like a panel (story triggers must not fire beneath it)

// ---- toasts / banner ----
function toast(msg, col){
  const box = $("toasts"); if(!box) return;
  const d = document.createElement("div"); d.className = "toast"; d.textContent = msg;
  if(col) d.style.color = col;
  box.appendChild(d);
  while(box.children.length > 5) box.removeChild(box.firstChild);
  setTimeout(() => d.remove(), 2400);
}

// The examine readout — a calm parchment line at the bottom, fades on its own. Used by the
// X-to-look verb and by tapping an item in the Backpack.
let _examineT = null;
function showExamine(title, text){
  const el = $("examineBar"); if(!el) return;
  el.innerHTML = `<span class="exTitle">${escapeHtml(title)}</span><span class="exText">${escapeHtml(text)}</span>`;
  el.classList.remove("hidden", "out"); void el.offsetWidth; el.classList.add("show");
  if(_examineT) clearTimeout(_examineT);
  _examineT = setTimeout(() => { el.classList.remove("show"); el.classList.add("out");
    setTimeout(() => { el.classList.add("hidden"); el.classList.remove("out"); }, 400); }, 4200);
}

// ---- item pickup log ---- a fading, stacking notification of what you just collected.
// Repeat pickups of the same item roll up into one entry (which pulses and its timer resets),
// so mass-harvesting reads as "+50 Corn" rather than fifty separate lines.
// Each row also carries the running TOTAL you now own of that item — a small, de-emphasized
// number on the right ("+1 Stone … 12"), so a pickup answers "and how many do I have?" at a
// glance, the way Stardew shows the stack size. The total is read straight from state.inv, which
// give() has already incremented by the time we're called, so there's no separate counter to sync.
const _pickups = new Map();          // item name -> { el, amtEl, totEl, count, timer }
function clearPickups(){ const b = $("pickups"); if(b) b.innerHTML = ""; _pickups.clear(); }
function notePickup(item, n){
  const box = $("pickups"); if(!box) return;
  const owned = (state && state.inv[item]) || n;   // total held AFTER this pickup
  let p = _pickups.get(item);
  if(p && p.el.isConnected){
    p.count += n; p.amtEl.textContent = "+" + p.count;
    if(p.totEl) p.totEl.textContent = owned;
    p.el.classList.remove("out","bump"); void p.el.offsetWidth; p.el.classList.add("bump");
  } else {
    const el = document.createElement("div"); el.className = "pickup";
    el.appendChild(mkIcon("item_" + item));
    const amt = document.createElement("span"); amt.className = "amt"; amt.textContent = "+" + n;
    const nm  = document.createElement("span"); nm.className = "pname"; nm.textContent = item;
    const tot = document.createElement("span"); tot.className = "ptot"; tot.textContent = owned;
    tot.title = "in your backpack";
    el.appendChild(amt); el.appendChild(nm); el.appendChild(tot);
    box.appendChild(el);
    p = { el, amtEl: amt, totEl: tot, count: n, timer: 0 };
    _pickups.set(item, p);
    while(box.children.length > 6) box.removeChild(box.firstChild);
  }
  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    p.el.classList.add("out");
    setTimeout(() => { p.el.remove(); if(_pickups.get(item) === p) _pickups.delete(item); }, 520);
  }, 2600);
}
function banner(big, small){
  const b = $("banner");
  b.innerHTML = `<div class="big">${big}</div>` + (small ? `<div class="small">${small}</div>` : "");
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
}

// ---- dialogue ----
const dlg = { open:false, full:"", i:0, timer:null, done:true };
function drawPortrait(name){
  const c = $("portrait"), g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.clearRect(0,0,64,64);
  const s = spr[name] || spr.port_valley;
  if(s) g.drawImage(s, 0, 0);
}
function showDialog(who, txt, portraitName){
  playSfx("menu");
  const d = $("dialog"); d.classList.remove("hidden");
  d.querySelector(".who").textContent = who;
  drawPortrait(portraitName || "port_valley");
  dlg.open = true; dlg.full = txt; dlg.i = 0; dlg.done = false;
  const el = d.querySelector(".txt"); el.textContent = "";
  clearInterval(dlg.timer);
  dlg.timer = setInterval(() => {
    dlg.i++; el.textContent = dlg.full.slice(0, dlg.i);
    if(dlg.i % 2 === 0) playSfx("blipTalk");
    if(dlg.i >= dlg.full.length){ clearInterval(dlg.timer); dlg.done = true; }
  }, 22);
}
function advanceDialog(){
  if(!dlg.open) return false;
  if(!dlg.done){ clearInterval(dlg.timer); dlg.i = dlg.full.length;
    $("dialog").querySelector(".txt").textContent = dlg.full; dlg.done = true; return true; }
  closeDialog(); return true;
}
function closeDialog(){ $("dialog").classList.add("hidden"); dlg.open = false; clearInterval(dlg.timer); playSfx("menuClose"); }

// ---- HUD ----
// The gold counter eases toward its true value each frame (via a tween on goldUI.shown) and the
// pill pulses on the way — earning 400g reads as a little count-up, not a silent number-swap.
const goldUI = { shown: 0, target: null };
function syncGold(){
  const el = $("goldVal"); if(!el || !state) return;
  if(goldUI.target === null){ goldUI.target = goldUI.shown = state.gold; }
  else if(state.gold !== goldUI.target){
    const up = state.gold > goldUI.target;
    goldUI.target = state.gold;
    retween(goldUI, "shown", state.gold, 0.5);
    const pill = $("goldPill");
    if(pill){ pill.classList.remove("earn","spend"); void pill.offsetWidth; pill.classList.add(up ? "earn" : "spend"); }
  }
  el.textContent = Math.round(goldUI.shown);
}
function refreshHUD(){
  if(!state) return;
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  const d = ((state.day-1)%SEASON_DAYS)+1;
  $("dateLine").textContent = seas + " · Day " + d + "  " + weatherInfo(state.weather).icon;
  let h = Math.floor(state.time/60)%24, m = Math.floor(state.time%60/10)*10;
  const ap = h>=12 ? "pm":"am"; let h12 = h%12; if(h12===0) h12=12;
  $("timeLine").textContent = (state.deepRun ? "⏱ " : "") + h12 + ":" + String(m).padStart(2,"0") + " " + ap;
  // gold is drawn by syncGold() each frame so it counts up (see below); don't snap it here
  const e = state.energy, bar = $("energyBar");
  bar.style.width = e + "%";
  // Warm all the way down — green → gold → deep amber. Energy is deliberately non-hazardous (you can
  // always eat or sleep), so "low" must not read as a survival-red alarm at the player (Cozy Contract
  // + palette discipline 8.1): the narrowing bar already says "low"; the tone just deepens, never reddens.
  bar.style.background = e>50 ? "linear-gradient(#b6f27a,#5aa733)"
                       : e>22 ? "linear-gradient(var(--gold-hi),var(--gold))"
                       :        "linear-gradient(var(--gold),var(--gold-d))";
  // v4.0: the Resolve bar shows only inside a combat map (the Undercroft); elsewhere it's hidden
  // and irrelevant. inCombatMap()/resolveMax() live in 15-warding.js.
  const rw = $("resolveWrap");
  if(rw){
    const combat = typeof inCombatMap === "function" && inCombatMap();
    rw.classList.toggle("hidden", !combat);
    const gb = $("btnGuard"); if(gb) gb.classList.toggle("hidden", !(combat && IS_TOUCH));   // v4.4: the touch 🛡 appears only in the Undercroft
    if(combat){
      const rmax = resolveMax(), rp = Math.max(0, Math.min(rmax, state.resolve || 0));
      const rbar = $("resolveBar"); rbar.style.width = Math.round(rp/rmax*100) + "%";
      const frac = rp/rmax;
      rbar.style.background = frac>0.5 ? "linear-gradient(#bfe4ff,#5a9ad8)"
                           : frac>0.25 ? "linear-gradient(#cfe0ff,#6a86d0)"
                           :             "linear-gradient(#dcd6ff,#8a7ad0)";   // deepens toward violet, never a red alarm
    }
  }
  refreshEventPill();
  drawClockDial();
}

// A gentle cue that only appears on the day itself or the eve of it — never a week-long countdown.
// Because every festival, the anniversary AND all five birthdays feed nextEvent() across a 112-day
// year, a 7-day window meant *something* was almost always inside it, so the pill read as permanent
// top-of-screen chrome — the "badge / nagging" the design bible (8.4) forbids. Tightening to
// today/tomorrow makes it vanish on the ~26 of 28 days when nothing's imminent; the full calendar
// still lives in the Almanac, and a one-line warm nudge is surfaced at wake (see showSleepCard).
function refreshEventPill(){
  const pill = $("eventPill"); if(!pill) return;
  const ev = nextEvent();
  if(!ev || ev.daysAway > 1){ pill.classList.add("hidden"); return; }
  const icon = ev.kind === "birthday" ? "🎂" : "✦";
  pill.textContent = ev.daysAway === 0 ? `${icon} ${ev.name} — today!`
                   : ev.daysAway === 1 ? `${icon} ${ev.name} — tomorrow`
                   : `${icon} ${ev.name} in ${ev.daysAway} days`;
  pill.classList.remove("hidden", "soon", "today");
  pill.classList.add(ev.daysAway === 0 ? "today" : "soon");
}
function drawClockDial(){
  const c = $("clockDial"); if(!c) return; const g = c.getContext("2d");
  g.clearRect(0,0,22,22);
  const h = curHour(), nf = nightFactor(h);
  g.save(); g.beginPath(); g.arc(11,13,10,Math.PI,0); g.closePath(); g.clip();
  g.fillStyle = gradHex(SKY_STOPS, h/24); g.fillRect(0,0,22,13);
  g.restore();
  g.fillStyle = "#3a2c1c"; g.fillRect(1,13,20,8);
  const dt = clamp(inv(h,6,20),0,1), ang = Math.PI - dt*Math.PI;
  const sx = 11 + Math.cos(ang)*8, sy = 13 - Math.sin(ang)*8;
  if(nf > 0.5){ g.fillStyle = "#e8ecf0"; g.beginPath(); g.arc(sx,sy,2.4,0,7); g.fill(); g.fillStyle=gradHex(SKY_STOPS,h/24); g.beginPath(); g.arc(sx+1.4,sy-0.6,2,0,7); g.fill(); }
  else { g.fillStyle = "#ffd75a"; g.beginPath(); g.arc(sx,sy,3,0,7); g.fill(); g.fillStyle="#fff0a0"; g.beginPath(); g.arc(sx,sy,1.4,0,7); g.fill(); }
  g.strokeStyle = "#00000066"; g.lineWidth=1; g.beginPath(); g.arc(11,13,10,Math.PI,0); g.stroke();
}

// ---- XP orbs ----
// The RuneScape hover-orb, adopted: circular rings that fill clockwise with your progress through
// the CURRENT level, the skill's icon in the middle and the level in a badge below. They exist
// because "+12 farm" floaters answer *what you earned* but never *how far along you are* —
// grinding felt like pouring XP into the dark. Each skill you train gets its OWN orb; train
// several in quick succession (cook the fish you just caught, chop on the way home) and the orbs
// line up SIDE BY SIDE in a rail at top-center — the RS placement, and the one spot the HUD keeps
// deliberately clear (clock left, gold right). Each orb eases its arc toward its new fraction, on
// a level-up sweeps to full, flashes, then resets to the remainder, and fades ~3s after ITS last
// gain — training-time feedback, never permanent HUD chrome (design bible 8.4).
const _xpOrbs = new Map();   // skill -> { el, cv, badge, lvl, shown, target, sweep, flash, hideT }
let _orbRaf = 0, _orbLast = 0;
function xpFrac(skill){
  const xp = state.skills[skill], lvl = levelFor(xp);
  return lvl >= 99 ? 1 : clamp(inv(xp, XP_TABLE[lvl], XP_TABLE[lvl+1]), 0, 1);
}
function showXpOrb(skill){
  const rail = $("xpOrbs"); if(!rail || !state || !(skill in state.skills)) return;
  const lvl = levelFor(state.skills[skill]), frac = xpFrac(skill);
  let o = _xpOrbs.get(skill);
  if(!o || !o.el.isConnected){
    // first gain for this skill — build its orb and slot it onto the rail
    const el = document.createElement("div"); el.className = "xpOrbItem in";
    const cv = document.createElement("canvas"); cv.width = 96; cv.height = 96;
    const badge = document.createElement("span"); badge.className = "olvl"; badge.textContent = lvl;
    el.appendChild(cv); el.appendChild(badge); rail.appendChild(el);
    o = { el, cv, badge, lvl, shown:frac, target:frac, sweep:false, flash:0, hideT:0 };
    _xpOrbs.set(skill, o);
  } else if(lvl > o.lvl){
    // levelled up — sweep the ring to full first; the tick resets it to the new remainder
    o.lvl = lvl; o.sweep = true; o.target = frac;
    o.badge.classList.remove("bump"); void o.badge.offsetWidth; o.badge.classList.add("bump");
  } else {
    o.target = frac;
  }
  o.badge.textContent = o.lvl;
  o.el.classList.remove("out");
  if(!_orbRaf){ _orbLast = performance.now(); _orbRaf = requestAnimationFrame(xpOrbTick); }
  clearTimeout(o.hideT);
  o.hideT = setTimeout(() => hideXpOrb(skill), 3200);
}
function hideXpOrb(skill){
  const o = _xpOrbs.get(skill); if(!o) return;
  // never cut off the level-up payoff — if the ring is mid-sweep (or still flashing), come back
  if(o.sweep || o.flash > 0){ o.hideT = setTimeout(() => hideXpOrb(skill), 600); return; }
  o.el.classList.add("out");
  setTimeout(() => {
    o.el.remove();
    if(_xpOrbs.get(skill) === o) _xpOrbs.delete(skill);
    if(!_xpOrbs.size && _orbRaf){ cancelAnimationFrame(_orbRaf); _orbRaf = 0; }
  }, 380);
}
function xpOrbTick(now){
  const dt = Math.min(0.05, (now - _orbLast)/1000); _orbLast = now;
  for(const [skill, o] of _xpOrbs){
    if(o.sweep){
      o.shown += dt * 2.4;                                   // fast, readable sweep to full
      if(o.shown >= 1){ o.shown = 0; o.sweep = false; o.flash = 0.5; }
    } else {
      o.shown += (o.target - o.shown) * Math.min(1, dt*6);   // ease toward the new fraction
      if(Math.abs(o.target - o.shown) < 0.002) o.shown = o.target;
    }
    if(o.flash > 0) o.flash = Math.max(0, o.flash - dt);
    drawXpOrb(skill, o);
  }
  _orbRaf = _xpOrbs.size ? requestAnimationFrame(xpOrbTick) : 0;
}
function drawXpOrb(skill, o){
  const g = o.cv.getContext("2d"); g.clearRect(0,0,96,96);
  const cx = 48, cy = 48;
  // inner disc — the same dark wood as the tracker cards
  g.beginPath(); g.arc(cx,cy,34,0,7); g.fillStyle = "rgba(30,22,15,.88)"; g.fill();
  // track ring — near-black, like the unfilled ring in RS
  g.beginPath(); g.arc(cx,cy,39,0,7); g.lineWidth = 9; g.strokeStyle = "rgba(12,9,6,.92)"; g.stroke();
  // progress arc — gold, clockwise from 12 o'clock
  if(o.shown > 0.004){
    const grad = g.createLinearGradient(0,0,0,96);
    grad.addColorStop(0,"#ffe6a0"); grad.addColorStop(1,"#ffce5a");
    g.beginPath(); g.arc(cx,cy,39,-Math.PI/2, -Math.PI/2 + o.shown*Math.PI*2);
    g.lineWidth = 9; g.lineCap = "round"; g.strokeStyle = grad; g.stroke(); g.lineCap = "butt";
  }
  // level-up flash — a soft bloom over the whole ring that decays
  if(o.flash > 0){
    g.beginPath(); g.arc(cx,cy,39,0,7); g.lineWidth = 13;
    g.strokeStyle = `rgba(255,240,190,${(o.flash*1.4).toFixed(3)})`; g.stroke();
  }
  // hairline edges keep it crisp against any backdrop
  g.lineWidth = 2; g.strokeStyle = "rgba(0,0,0,.55)";
  g.beginPath(); g.arc(cx,cy,44.5,0,7); g.stroke();
  g.beginPath(); g.arc(cx,cy,33.5,0,7); g.stroke();
  // the skill's icon, pixel-crisp at 3x, centred
  const s = spr[SKILL_ICON[skill]];
  if(s){ g.imageSmoothingEnabled = false; g.drawImage(s, cx-24, cy-24, 48, 48); }
}

// ---- icons ----
function mkIcon(spriteName){
  const s = spr[spriteName];
  const c = document.createElement("canvas");
  c.width = s ? s.width : 16; c.height = s ? s.height : 16;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  if(s) g.drawImage(s,0,0);
  return c;
}

// ---- hotbar ----
function refreshHotbar(){
  const hb = $("hotbar"); if(!hb) return; hb.innerHTML = "";
  HOTBAR.forEach((slot, i) => {
    const d = document.createElement("div");
    d.className = "slot" + (i===slotSel ? " sel" : "");
    let iconName, name, tierIdx = null, count = null;
    if(slot.tool === "Seeds"){
      normalizeSeedSel();
      name = plantableName(state.seedSel);
      iconName = plantableIcon(state.seedSel);
      count = isHiveSel(state.seedSel) ? (state.inv["Beehive"]||0)
            : isSapSel(state.seedSel)  ? (state.inv[FRUIT_TREES[state.seedSel.slice(4)].name]||0)
            : (state.inv[name] || 0);
    } else {
      iconName = "tool_" + TOOL_ICON[slot.tool];
      tierIdx = state.tools[slot.tool];
      name = TOOL_TIERS[tierIdx] + " " + slot.tool;
    }
    d.appendChild(mkIcon(iconName));
    const kk = document.createElement("span"); kk.className="key"; kk.textContent = i+1; d.appendChild(kk);
    if(count !== null){ const cn = document.createElement("span"); cn.className="cnt"; cn.textContent = "×"+count; d.appendChild(cn); }
    if(tierIdx !== null && tierIdx > 0){ const tp = document.createElement("span"); tp.className="tier"; tp.textContent="◆"; tp.style.color = TIER_COL[tierIdx]; d.appendChild(tp); }
    const nm = document.createElement("span"); nm.className="slotName"; nm.textContent = name; d.appendChild(nm);
    d.onclick = () => selectSlot(i);
    hb.appendChild(d);
  });
}

// ---- quest tracker ----
function refreshQuestTracker(){
  const box = $("questTracker"); if(!box) return;
  const q = trackerData();
  let html = "";
  if(q){
    html += `<div class="qt-card"><div class="qt-act">${actInfo().title}</div><div class="qt-title">✒ ${q.title}</div>`;
    for(const o of q.objs){
      html += `<div class="qt-obj ${o.done?"done":""}">${o.done?'<span class="chk">✔</span> ':"• "}${o.text}` +
              (o.max>1 && !o.done ? ` (${o.cur}/${o.max})` : "") + `</div>`;
    }
    if(q.reportTo) html += `<div class="qt-obj" style="color:var(--gold-hi)">▸ Report to ${q.reportTo}</div>`;
    html += `</div>`;
  }
  html += boardTrackerHtml();
  box.innerHTML = html;
}
// a faint second card for today's noticeboard request — the small, skippable goal of the day
function boardTrackerHtml(){
  if(gameMode !== "play" || !state || !state.flags) return "";
  if(requestFilled()) return "";
  const r = todaysRequest(); if(!r) return "";
  const have = state.inv[r.item] || 0, ready = have >= r.qty;
  return `<div class="qt-card" style="opacity:.82"><div class="qt-title" style="color:#cbb98f">📌 Noticeboard</div>` +
    `<div class="qt-obj ${ready?"done":""}">${ready?'<span class="chk">✔</span> ':"• "}${r.qty} × ${r.item} — ${NPCDEF[r.who].name}` +
    (ready ? "" : ` (${have}/${r.qty})`) + `</div>` +
    (ready ? `<div class="qt-obj" style="color:var(--gold-hi)">▸ Take them to ${NPCDEF[r.who].name}</div>` : "") +
    `</div>`;
}

// ---- panels ----
function openPanel(id, render){
  closeAllPanels(true);
  openPanels.add(id); $(id).classList.remove("hidden");
  if(render) render();
  playSfx("menu");
}
function closePanel(id){ if(openPanels.has(id)){ openPanels.delete(id); $(id).classList.add("hidden"); playSfx("menuClose"); } }
function closeAllPanels(silent){ for(const id of Array.from(openPanels)){ openPanels.delete(id); $(id).classList.add("hidden"); } if(!silent && dlg.open) closeDialog(); }
function togglePanel(id, render){ if(openPanels.has(id)) closePanel(id); else openPanel(id, render); }

// A shared tab-strip component. Panels that page their .body (Shop, Journal) render their tab row
// into a sibling strip via this; the active tab is remembered per-panel in _panelTab, so a
// re-render (funding a pledge, switching seasons) keeps you on the same page for free.
const _panelTab = {};
function panelTabs(panelId, stripId, tabs, render){
  const strip = $(stripId); if(!strip) return tabs[0][0];
  const active = _panelTab[panelId] || (_panelTab[panelId] = tabs[0][0]);
  strip.innerHTML = tabs.map(([k,l]) => `<div class="tab ${k===active?"active":""}" data-tab="${k}">${l}</div>`).join("");
  strip.querySelectorAll(".tab").forEach(t => t.onclick = () => { _panelTab[panelId] = t.dataset.tab; playSfx("select"); render(); });
  return active;
}

// ---- Skills panel: a RuneScape-style skill grid ----
// A compact tile per skill — procedural icon + level badge + XP bar + one muted next-goal line —
// instead of the old wall of prose. The full detail (exact XP, remaining to next, earned masteries
// and the whole 25/50/75/99 table) opens on tap, one skill at a time, so the reference is all still
// there (principle 4.3) without burying the levels. Icons reuse the mkIcon/hydrateIcons sprite
// pipeline; every colour role is the pre-blessed one (level --gold, bar --blue, unlock --blue,
// mastery --gold-hi, next-mastery --ink-soft) — no new hex, no new frame.
const SKILL_ICON = { Farming:"item_Turnip", Woodcutting:"item_Wood", Mining:"item_Stone", Fishing:"item_Sardine", Cooking:"item_Berry Bun", Warding:"item_Stave" };   // v4.0
let skillSel = null;   // which skill's detail is expanded (null = grid only)
function selectSkill(s){ skillSel = (skillSel === s) ? null : s; playSfx("select"); renderSkills(); }
function skillDetailHtml(s){
  if(!s || !(s in state.skills))
    return `<div class="skillHint">Tap a skill for its XP, unlocks and mastery milestones.</div>`;
  const xp = state.skills[s], lvl = levelFor(xp);
  const next = lvl>=99 ? xp : XP_TABLE[lvl+1], remain = Math.max(0, next - xp);
  let h = `<div class="sdHead"><span class="sdName">${s}</span><span class="sdLvl">Level ${lvl}</span></div>`;
  h += `<div class="sdXp">${xp.toLocaleString()} XP` +
       (lvl>=99 ? ` · <span class="max">MAX</span>` : ` · ${remain.toLocaleString()} to Lv ${lvl+1}`) + `</div>`;
  const un = nextUnlock(s);
  if(un) h += `<div class="sdLine unlock">▸ Unlocks ${un.label} at Lv ${un.at}</div>`;
  const earned = [25,50,75,99].filter(n => lvl >= n);
  if(earned.length) h += earned.map(n => `<div class="sdLine earned">★ ${MASTERY[s][n]}</div>`).join("");
  const nx = nextMastery(s);
  if(nx) h += `<div class="sdLine next">☆ Lv ${nx.at}: ${nx.text}</div>`;
  else if(!un) h += `<div class="sdLine earned">Mastered — every craft learned.</div>`;
  return h;
}
function renderSkills(){
  const b = $("skillsPanel").querySelector(".body");
  let total = 0; for(const s in state.skills) total += levelFor(state.skills[s]);
  // v4.0: the cap is derived from the live skill count (594 with Warding), so it never drifts again.
  let html = `<div class="skillTotal">Total Level <b>${total}</b> / ${99*Object.keys(state.skills).length}</div>`;
  // v4.0 variety spark — a quiet nudge to rotate: the first few actions in each skill each day earn +50% XP.
  html += `<div class="sparkNote">✦ <b>Variety spark</b> — the first ${SPARK_CAP} actions in each skill each day earn +50% XP. Rotate to make the most of it.</div>`;
  html += `<div class="skillGrid">`;
  for(const s in state.skills){
    const xp = state.skills[s], lvl = levelFor(xp);
    const cur = XP_TABLE[lvl], next = lvl>=99?cur:XP_TABLE[lvl+1];
    const pct = lvl>=99 ? 100 : Math.floor(inv(xp,cur,next)*100);
    const un = nextUnlock(s), nx = nextMastery(s);
    const spk = SPARK_CAP - ((state.dailyXpActs && state.dailyXpActs[s]) || 0);   // sparks left today
    const goal = un ? `<span class="sgoal unlock">▸ ${un.label} · ${un.at}</span>`
               : nx ? `<span class="sgoal mast">☆ Lv ${nx.at}: ${MASTERY[s][nx.at].split(" — ")[0]}</span>`
               :      `<span class="sgoal done">★ mastered</span>`;
    const sparkBadge = spk > 0 ? `<span class="sgoal spark">✦ ${spk} spark${spk>1?"s":""} left today</span>` : "";
    html += `<div class="skillCell${s===skillSel?" sel":""}" onclick="selectSkill('${s}')">` +
      `<span class="sIcon" data-icon="${SKILL_ICON[s]}"><canvas></canvas><span class="sLvl">${lvl}</span></span>` +
      `<span class="sBody"><span class="sName">${s}</span>` +
      `<span class="xpbarWrap"><span class="xpbar" style="width:${pct}%"></span></span>` +
      goal + sparkBadge + `</span></div>`;
  }
  html += `</div><div id="skillDetail">${skillDetailHtml(skillSel)}</div>`;
  html += `<details class="skillHelp"><summary>About the XP curve</summary>` +
    `<div>Levels are paced to be savored — each takes a little more than the last, and only the final stretch to 99 is a true completionist climb. Every skill earns a mastery at 25 · 50 · 75 · 99.</div></details>`;
  b.innerHTML = html;
  hydrateIcons(b);   // draw the skill-tile icons (the old panel declared an icon map but never used it)
}
// The Backpack, Stardew-style: a visual grid of item tiles (icon + a corner stack count), sorted
// into the same category sections the Collection uses, with the examine flavour, sell/energy value
// and the charm's wear control moved onto a tap-to-open detail strip — so the bag reads at a glance
// instead of as a wall of one-line-plus-italic-paragraph rows.
let invSel = null;
function selectInvItem(it){ invSel = (invSel === it ? null : it); playSfx("select"); renderInv(); }
function invDetailHtml(it){
  if(!it || !state.inv[it]) return "";   // empty → the sticky detail bar collapses (see #invDetail:not(:empty))
  let h = `<div class="sdHead"><span class="sdName">${it}</span><span class="sdLvl">×${state.inv[it]}</span></div>`;
  const bits = [];
  if(ITEM_SELL[it]) bits.push(`${ITEM_SELL[it]}g each`);
  if(EDIBLE[it])    bits.push(`+${EDIBLE[it]} energy`);
  if(bits.length) h += `<div class="sdXp">${bits.join(" · ")}</div>`;
  if(EXAMINE[it]) h += `<div class="sdLine muted" style="font-style:italic">${escapeHtml(EXAMINE[it])}</div>`;
  if(CHARMS[it]){
    const worn = state.charm === it;
    h += `<div class="sdLine unlock">✦ ${CHARMS[it].effect}</div>`;
    h += worn ? `<button class="buy" onclick="wearCharm(null)">worn ✓ — take it off</button>`
              : `<button class="buy" onclick="wearCharm('${jsq(it)}')">wear this</button>`;
  }
  return h;
}
function renderInv(){
  const b = $("invPanel").querySelector(".body");
  const items = Object.keys(state.inv);
  if(!items.length){ invSel = null; b.innerHTML = `<div class="locked">Empty. The valley provides — go get it!</div>`; return; }
  // bucket items into the same sections the Collection uses, so the bag reads sorted like Stardew's
  const SEC = {}; MUSEUM.forEach(s => s.items().forEach(n => SEC[n] = s.name));
  const groups = {};
  for(const it of items){ const g = SEC[it] || "Satchel"; (groups[g] = groups[g] || []).push(it); }
  const secOrder = MUSEUM.map(s => s.name).filter(n => groups[n]);
  if(groups["Satchel"]) secOrder.push("Satchel");
  let html = "";
  for(const g of secOrder){
    html += `<div class="museSec">${g}</div><div class="museGrid">`;
    for(const it of groups[g]){
      const worn = state.charm === it;
      html += `<div class="museItem has invTile${it===invSel?" sel":""}${worn?" worn":""}" data-icon="item_${it}" title="${escapeHtml(it)}" onclick="selectInvItem('${jsq(it)}')">` +
        `<canvas></canvas><span class="invCount">×${state.inv[it]}</span><span>${it}</span></div>`;
    }
    html += `</div>`;
  }
  html += `<div id="invDetail">${invDetailHtml(invSel)}</div>`;
  b.innerHTML = html;
  hydrateIcons(b);
}
function wearCharm(name){
  state.charm = name;
  if(name){ toast("You put on the " + name + ".", "#8fe8c8"); playSfx("gift"); }
  else playSfx("select");
  saveGame(); renderInv();   // invSel persists (module var), so the detail strip stays open on the new state
}
// ---- The Collection: a museum of everything you've ever found, with its examine flavour ----
const MUSEUM = [
  { name:"Crops",         items:()=>Object.values(CROPS).map(c=>c.name) },
  { name:"The Orchard",   items:()=>Object.values(FRUIT_TREES).map(t=>t.fruit) },
  { name:"Fish",          items:()=>FISH.map(f=>f.name) },
  { name:"The Legends",   items:()=>LEGENDS.map(l=>l.name) },
  { name:"Gems",          items:()=>Object.keys(GEM_SELL) },
  { name:"The Shore",     items:()=>[...Object.keys(SHORE), ...Object.keys(ROADSIDE)] },   // + the coast road's forage (v3.36)
  { name:"Farm & Forage", items:()=>["Field Salad","Frostberry","Berry Bun","Honey","Egg","Large Egg","Milk","Large Milk","Cheese","Fine Cheese","Wool","Prize Fleece","Mountain Thyme","Snowdrop"] },   // Wool since v3.8; Cheese v3.33; the ridge's forage v3.43
  { name:"The Kitchen",   items:()=>RECIPES.map(r=>r.name) },
  { name:"Materials",     items:()=>["Wood","Pine Wood","Maple Wood","Willow Wood","Elder Wood","Heartwood","Silverwood",...Object.values(WOOD_TO_LUMBER),...Object.values(ORES).map(o=>o.drop)] },   // + milled lumber (v3.21); ores DERIVED from ORES (v3.37 review fix — a hand-list forgot Deepsilver the day it shipped; now the next ore can't be missed)
  { name:"The Deep",      items:()=>[...GEODE_CURIOS, "Geode Heart", "Starlight Shard"] },   // v3.28: geode curios; v3.43: the summit's splinter joins the celestial family
  { name:"The Canopy",    items:()=>Object.keys(CHARMS) },
];
// (The Collection tile grid now lives in renderCollectionHtml, the Journal's Collection tab.)
// The Journal, once a single 3-screen scroll of nine unrelated systems, is now a tabbed book —
// Quests / Map / Calendar / Ledger / Collection — the FoMT/Stardew "one clean page each" model.
// renderJournal keeps its name + zero-arg signature so the J key and the touch menu stay wired.
let _lastJournalTab = null;
function renderJournal(){
  const b = $("questPanel").querySelector(".body");
  const tab = panelTabs("questPanel", "journalTabs",
    [["quests","Quests"],["map","Map"],["calendar","Calendar"],["ledger","Ledger"],["collect","Collection"]],
    renderJournal);
  if(tab !== _lastJournalTab){ b.scrollTop = 0; _lastJournalTab = tab; }
  if(tab === "map"){ renderWorldMap(b); return; }        // draws + hydrates itself
  let html = "";
  if(tab === "quests")        html = journalQuestsHtml();
  else if(tab === "calendar") html = renderCalendarHtml();
  else if(tab === "ledger")   html = renderLedger();
  else                        html = renderCollectionHtml();
  b.innerHTML = html;
  hydrateIcons(b);
}
// Quests tab: the guild-wings progress strip, the act-grouped story spine with the finale
// pre-revealed, and Grandpa's found pages at the foot (the story lore beside the story tasks).
function journalQuestsHtml(){
  let html = "";
  const lit = wingsLit();
  html += `<div class="jq"><h3 style="color:var(--gold-hi)">🏛 Guild of Nine Crafts — ${lit}/9 wings lit</h3><div style="display:flex;flex-wrap:wrap;gap:.25em .6em;font-size:.86em;">`;
  WINGS.forEach(w => { const on = w.lit();
    html += `<span style="color:${on?"var(--gold-hi)":"var(--ink-soft)"}">${on?"◆":"◇"} ${w.name}</span>`; });
  html += `</div></div>`;
  // ★ Quest Points (v3.32) — the ledger's one number, right where the story lives
  const qpNow = questPoints(), qpAll = questPointsTotal();
  html += `<div class="jq"><h3 style="color:var(--gold-hi)">✦ Quest Points — ${qpNow}/${qpAll}</h3>` +
          `<div class="desc" style="color:var(--ink-soft)">` +
          (state.flags.qpAllTold
            ? `Every story told. The Storyteller's Banner is yours — Tom keeps it behind the counter.`
            : `Every task in the valley's book weighs a point or more. Fill the book, and Tom will have something for the teller.`) +
          `</div></div>`;
  html += `<div class="actHead">${ACT_TITLES[1]}</div>`;
  let act2Open = false, act3Open = false;
  QUESTS.forEach((q, idx) => {
    const done = idx < state.questIdx;
    const active = idx === state.questIdx;
    if(idx > state.questIdx){
      if(idx === FINALE_IDX && state.questIdx < FINALE_IDX){
        html += `<div class="jq dest"><h3>◇ ${QUESTS[FINALE_IDX].title} <span style="color:var(--ink-soft);font-size:.8em;">— where Act I is heading</span></h3>` +
                `<div class="desc">Relight the Nine Crafts and bring the Grand Festival back to the coast.</div></div>`;
      }
      return; // other future quests stay hidden
    }
    if(idx > FINALE_IDX && idx < ACT3_IDX && !act2Open){ html += `<div class="actHead">${ACT_TITLES[2]}</div>`; act2Open = true; }
    if(idx >= ACT3_IDX && !act3Open){ html += `<div class="actHead">${ACT_TITLES[3]}</div>`; act3Open = true; }   // v4.0
    html += `<div class="jq"><h3 class="${done?"done":""}">${done?"✔ ":active?"✒ ":""}${q.title} <span style="color:var(--ink-soft);font-size:.8em;">— ${q.giver}</span></h3>`;
    html += `<div class="desc">“${q.desc}”</div>`;
    q.obj.forEach(o => { const [c,m] = objProgress(o); const d = c>=m;
      html += `<div class="obj ${d?"done":""}">${d?"✔":"•"} ${o.text}${m>1?` (${c}/${m})`:""}</div>`; });
    html += `</div>`;
  });
  if(state.questIdx >= QUESTS.length) html += `<div style="text-align:center;color:var(--gold-hi);">✦ Every task complete. The valley is yours. ✦</div>`;
  if(state.flags.tenthDoorOpen && typeof renderWardLedgerJournal === "function") html += renderWardLedgerJournal();   // v4.3 Act III mirror
  html += renderPages();
  return html;
}
// Ledger tab: the valley's unfinished work, all payable from here — the Restorations pledges plus
// Rowan's civic projects, once two separate panels, now one page.
function renderLedger(){
  return `<div class="secHead">📜 The Valley Ledger</div>` + renderRestorations() + projectsRowsHtml();
}
// Collection tab: the discovery museum, promoted out of its old collapsed <details> into a full page.
function renderCollectionHtml(){
  const disc = state.discovered || {};
  let total=0, found=0, body="";
  for(const sec of MUSEUM){
    let cells = "";
    for(const it of sec.items()){
      total++;
      if(disc[it]){ found++;
        cells += `<div class="museItem has" data-icon="item_${it}" title="${escapeHtml(EXAMINE[it]||it)}"><canvas></canvas><span>${it}</span></div>`;
      } else {
        cells += `<div class="museItem locked" title="Not yet discovered"><span class="q">?</span><span>· · ·</span></div>`;
      }
    }
    body += `<div class="museSec">${sec.name}</div><div class="museGrid">${cells}</div>`;
  }
  return `<div class="secHead">🗃 The Collection — ${found}/${total} discovered</div>${body}`;
}

// ---- The Valley of Willowbrook: a schematic town map (Journal → Map tab) ----
// Owner asked for "a map of the whole city with an indicator of where you are." Drawn as CSS grid
// boxes (not the pixel canvas) so region labels stay crisp and NPC dots can be procedural portraits.
// The layout mirrors the real warp cardinals: grove W of the farm, village E, guild N of the plaza,
// mine on the NE ridge, coast S. Regions are static; the you-are-here marker and the neighbour dots
// are derived live from state.map and the day's clock.
const WORLD_MAP = [
  { id:"grove",   area:"grove",   label:"The Deep Grove",     sub:"forest & rings" },
  { id:"farm",    area:"farm",    label:"Willowbrook Farm",   sub:"home · coop · barn" },
  { id:"village", area:"village", label:"Willowbrook Village",sub:"plaza · store · Alderman" },
  { id:"guild",   area:"guild",   label:"Guild of Nine Crafts",sub:"the valley's heart" },
  { id:"mine",    area:"mine",    label:"The Old Mine",       sub:"ore & gems" },
  { id:"coast",   area:"coast",   label:"Willowbrook Coast",  sub:"fishing & festivals" },
  { id:"coastroad", area:"coastroad", label:"The Coast Road", sub:"the Gullwater · the landing" },   // v3.36
  { id:"ridge",     area:"ridge",     label:"Starfall Ridge",  sub:"the summit · the view" },         // v3.43
  { id:"butterbrook", area:"butterbrook", label:"Butterbrook", sub:"the coast dairy · Nell" },          // v3.44
];
// every live map id folds onto one of the nine board regions
const MAP_REGION = { farm:"farm", cottage:"farm", coop:"farm", barn:"farm",
  village:"village", store:"village", mayahouse:"village", guild:"guild", undercroft:"guild",   // v4.0: the tenth door is inside the Guild
  mine:"mine", beach:"coast", grove:"grove", coastroad:"coastroad", ridge:"ridge",
  butterbrook:"butterbrook", dairy:"butterbrook" };
// Where each neighbour is right now — inferred read-only from the spawn schedule (spawnMapNpcs,
// 13-content.js). Live NPC entities only exist on the loaded map, so the map reconstructs their
// whereabouts from the same clock rules rather than reading entities off other maps.
function npcRegionNow(id){
  const h = (typeof curHour === "function") ? curHour() : 12;
  if(typeof beachEvent === "function" && beachEvent() && id !== "nell") return "coast";   // a festival gathers everyone on the sand — except Nell, who keeps the dairy (review fix: she was never in the festival cast, so the blanket "coast" put a false dot on her)
  switch(id){
    case "tom":   return "village";
    case "rowan": return "guild";
    case "bram":  return "coast";
    case "maya":  return "village";
    case "pip":   return "village";
    case "elias": return (state.flags && state.flags.act2Done && h >= 7 && h < 19)
      ? (state.day % 4 === 0 ? "coastroad" : "farm") : null;   // v3.36: fourth days he walks to the landing
    case "nell":  return (h >= 7 && h < 22) ? "butterbrook" : null;   // v3.44: dairy 7–18:30, meadow 18:30–22, home after — matches spawnMapNpcs exactly (review fix)
  }
  return null;
}
function renderWorldMap(b){
  const cur = MAP_REGION[state.map] || "farm";
  const byRegion = {};
  for(const id in NPCDEF){ const r = npcRegionNow(id); if(r){ (byRegion[r] = byRegion[r] || []).push(id); } }
  let nodes = "";
  for(const n of WORLD_MAP){
    const here = n.id === cur;
    const dots = (byRegion[n.id] || []).map(id => spr[NPCDEF[id].portrait]
      ? `<span class="wmNpc" data-icon="${NPCDEF[id].portrait}" title="${escapeHtml(NPCDEF[id].name)} is here"><canvas></canvas></span>` : "").join("");
    nodes += `<div class="wmNode${here?" here":""}" style="grid-area:${n.area}">` +
      `<span class="wmName">${n.label}</span><span class="wmSub">${n.sub}</span>` +
      (here ? `<span class="wmYou">✦ you are here</span>` : "") +
      (dots ? `<span class="wmNpcs">${dots}</span>` : "") + `</div>`;
  }
  const where = (MAPS[state.map] || {}).name || "the valley";
  b.innerHTML = `<div class="wmBoard">${nodes}</div>` +
    `<div class="wmFoot">You're in <b>${escapeHtml(where)}</b>. The faces show where the valley folk are about now.</div>`;
  hydrateIcons(b);
}

// ---- Grandpa's torn pages: found by living, re-readable forever ----
function renderPages(){
  const n = pagesFound();
  let h = `<div class="jq"><h3 style="color:#e8d9a8">📜 Grandpa's Pages — ${n}/9 found</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">Torn pages, tucked where he left them. You find them by doing what he did.</div>`;
  for(const p of JOURNAL_PAGES){
    const got = !!state.flags["page_"+p.n];
    if(p.n === 9 && !got){ h += `<div class="obj" style="color:var(--ink-soft)">· · ·</div>`; continue; }
    h += got
      ? `<div class="obj" style="color:var(--parch);cursor:pointer" onclick="rereadPage(${p.n})">✔ ${p.title} <span style="color:var(--ink-soft);font-size:.8em;">— read again</span></div>`
      : `<div class="obj" style="color:var(--ink-soft)">· · ·</div>`;
  }
  h += `</div>`;
  return h;
}
function rereadPage(n){
  const p = PAGE_BY_N[n]; if(!p || !state.flags["page_"+n]) return;
  closeAllPanels();
  openLetter(n===9 ? "✒ Slipped under the cottage door" : "✒ A torn page — " + p.title, p.text);
}

// ---- the almanac: what's coming, and what you've already seen this year ----
// Calendar tab: the flat year-long almanac list is now a Harvest Moon month grid — a 7×4 board of
// the selected season's 28 days, festivals and birthdays marked in place so you can read "what's on
// THIS season" at a glance, with the sky at the top and Bram's legend ledger below.
let calSeason = null;
function selectCalSeason(s){ calSeason = s; playSfx("select"); renderJournal(); }
function renderCalendarHtml(){
  if(calSeason === null) calSeason = curSeason();
  const wNow = weatherInfo(state.weather), wNext = weatherInfo(state.forecast || "clear");
  // ---- the sky ----
  let h = `<div class="skyRow">` +
    `<span class="skyChip" style="border-color:${wNow.tone}"><b style="color:${wNow.tone}">${wNow.icon} Today</b> ${wNow.name}</span>` +
    `<span class="skyChip" style="border-color:${wNext.tone}"><b style="color:${wNext.tone}">${wNext.icon} Tomorrow</b> ${wNext.name}</span></div>`;
  h += `<div class="desc muted" style="margin:.1em 0 .5em;font-size:.82em;">${wNow.offer}</div>`;
  // ---- season selector ----
  h += `<div class="tabs calTabs">` + SEASONS.map(s =>
    `<div class="tab ${s===calSeason?"active":""}" onclick="selectCalSeason('${s}')">${s}</div>`).join("") + `</div>`;
  // ---- index this season's marked days ----
  const ev = {};
  const put = (day, cls, glyph, name, blurb, done) => { ev[day] = { cls, glyph, name, blurb, done }; };
  for(const f of FESTIVALS) if(f.season === calSeason) put(f.day, "fest", "✦", f.name, f.blurb, festivalDoneThisYear(f));
  if(state.flags.anniversaryDay != null){
    const aS = SEASONS[Math.floor((state.flags.anniversaryDay-1)/SEASON_DAYS)];
    const aD = ((state.flags.anniversaryDay-1) % SEASON_DAYS) + 1;
    if(aS === calSeason) put(aD, "fest", "🏮", "The Lantern Festival", "The night the valley woke. Every year, on the coast.", !!state.flags["did_anniversary_"+YEAR()]);
  }
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id]; if(b.season === calSeason)
    put(b.day, "bday", "🎂", NPCDEF[id].name + "'s birthday", "Bring a gift they love — it counts for far more today.", !!state.flags["bday_"+id+"_"+YEAR()]); }
  const todaySlot = yearSlot(curSeason(), dayOfSeason());
  // ---- the 28-day grid ----
  h += `<div class="calGrid">`;
  for(let d=1; d<=SEASON_DAYS; d++){
    const e = ev[d], isToday = yearSlot(calSeason, d) === todaySlot;
    let cls = "calCell";
    if(e){ cls += " mark " + e.cls; if(e.done) cls += " done"; }
    if(isToday) cls += " today";
    h += `<div class="${cls}"${e?` title="${escapeHtml(e.name)}"`:""}><span class="calNum">${d}</span>${e?`<span class="calDot">${e.glyph}</span>`:""}</div>`;
  }
  h += `</div>`;
  // ---- what's on, this season ----
  const days = Object.keys(ev).map(Number).sort((a,b)=>a-b);
  if(days.length){
    h += `<div class="secHead" style="margin-top:.6em;">${calSeason} · Year ${YEAR()}</div>`;
    for(const d of days){ const e = ev[d];
      h += `<div class="obj ${e.done?"done":""}"><b style="color:${e.cls==="bday"?"var(--rose)":"var(--gold-hi)"}">${e.glyph} ${e.name}</b>` +
        `<span class="muted" style="font-size:.85em;"> — ${calSeason} ${d}${e.done?" · done this year":""}</span>` +
        (e.blurb?`<div class="muted" style="font-size:.82em;margin-left:1.1em;">${e.blurb}</div>`:"") + `</div>`;
    }
  } else h += `<div class="desc muted" style="text-align:center;">A quiet season — nothing on the calendar.</div>`;
  return h + bramLedgerHtml();
}
// Bram's ledger of the five legendary fish — kept from the old almanac, now under the Calendar tab.
function bramLedgerHtml(){
  const allLanded = legendsCaught() >= LEGENDS.length;
  let h = `<div class="jq" style="margin-top:.7em;"><h3 style="color:var(--blue)">🎣 Bram's Ledger — ${legendsCaught()}/${LEGENDS.length} landed</h3>`;
  h += allLanded
    ? `<div class="desc" style="margin-bottom:.3em;color:var(--gold-hi)">All five landed. ${state.flags.huntCrowned ? "Bram's oilskin is yours — the fish come faster, and the storm is yours to fish." : "Go and see Bram."}</div>`
    : `<div class="desc" style="margin-bottom:.3em;">Five fish that rise only when everything lines up. Bram tells you one for every heart.</div>`;
  for(const l of LEGENDS){
    const caught = !!state.flags["caught_"+l.id], known = !!state.flags["clue_"+l.id];
    if(!known){ h += `<div class="obj" style="color:var(--ink-soft)">· · ·<span style="font-size:.82em;"> — Bram hasn't told you about this one yet</span></div>`; continue; }
    h += `<div class="obj" style="color:${caught?"var(--gold-hi)":"var(--parch)"}">${caught?"✔":"○"} ${l.name}` +
      `<div style="color:var(--ink-soft);font-size:.82em;margin-left:1.1em;">${legendConditions(l)}</div></div>`;
  }
  h += `</div>`;
  return h;
}

// ---- Rowan's ledger: the valley's unfinished work ----
// Rowan's guild-desk ledger and the Journal's Restorations were two names for one idea — funding the
// valley's unfinished work — under two panels. They're now one Ledger tab. The desk opens the Journal
// there; renderProjects() survives only as a re-render shim for fundProject() (in 14-story.js, which
// this session must not edit).
function openProjects(){ _panelTab["questPanel"] = "ledger"; openPanel("questPanel", renderJournal); }
function renderProjects(){ if(openPanels.has("questPanel") && _panelTab["questPanel"] === "ledger") renderJournal(); }
function projectRowHtml(p){
  const done = projectDone(p.id), pending = projectPending(p.id);
  const cost = Object.entries(p.items).map(([it,n]) =>
    `<span style="color:${(state.inv[it]||0)>=n?"var(--parch)":"#c98a6a"}">${n}× ${it}</span>`).join(" · ");
  const goldOk = state.gold >= p.gold;
  let html = `<div class="row"><span class="lead"><span>` +
    `<span style="display:block;color:${done?"var(--gold-hi)":"var(--parch)"}">${done?"✔ ":pending?"🔨 ":""}${p.name}</span>` +
    `<span class="sub" style="display:block;margin:.1em 0;">${done ? p.done : pending ? "The work begins at dawn." : p.blurb}</span>` +
    (done||pending ? "" : `<span class="sub" style="display:block;">${cost}</span>`) +
    `</span></span>`;
  html += done || pending
    ? `<span><span class="price" style="color:var(--gold-hi)">${done?"built":"pending"}</span></span>`
    : `<span><span class="price" style="color:${goldOk?"var(--gold-hi)":"#c98a6a"}">${p.gold}g</span> ` +
      `<button class="buy" ${canFund(p)?"":"disabled"} onclick="fundProject('${p.id}')">fund</button></span>`;
  return html + `</div>`;
}
function projectsRowsHtml(){
  const builds = PROJECTS.filter(p => p.building), civic = PROJECTS.filter(p => !p.building);
  // Farm construction (v3.21) — your own buildings, milled from lumber, raised by morning
  let html = `<div class="secHead">🏗 Farm Construction</div>`;
  html += `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">Mill your logs at the Sawmill, bring the lumber here, and Rowan will help you raise it.</div>`;
  html += builds.map(projectRowHtml).join("");
  // Rowan's civic restorations — coin turned back into the valley
  html += `<div class="secHead" style="margin-top:.7em;">🔨 Rowan's Restorations</div>`;
  html += `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">“Coin is only stored work, child. Spend it and the valley remembers.” — Rowan</div>`;
  html += civic.map(projectRowHtml).join("");
  if(!PROJECTS.filter(p=>!projectDone(p.id)).length)
    html += `<div style="margin-top:.4em;text-align:center;color:var(--gold-hi);">✦ Every page of the ledger is struck through. ✦</div>`;
  return html;
}

// ---- shop ----
function openShop(tab, silent){ _panelTab["shopPanel"] = tab || "sell"; openPanel("shopPanel", renderShop);
  if(!silent) toast(pick(TOM_GREET), "#e9dcc0"); }
function renderShop(){
  const b = $("shopPanel").querySelector(".body");
  const shopTab = panelTabs("shopPanel", "shopTabs", [["sell","Sell"],["buy","Seeds & Food"],["tools","Tools"],["decor","Décor"]], renderShop);
  let html = "";
  if(shopTab === "sell"){
    const sellables = Object.keys(state.inv).filter(i => ITEM_SELL[i]);
    if(!sellables.length) html += `<div class="locked">Nothing to sell yet — go harvest, chop, mine or fish!</div>`;
    sellables.forEach((i, idx) => {
      // Tom's demand: show what the NEXT one fetches, and say so plainly when it has slipped.
      // v3.40 (owner sweep): the owned count is ALWAYS visible — the demand note used to REPLACE
      // it, hiding "how much do I have left" at the exact moment (mid-selloff) it matters most.
      const now = nextUnitPrice(i), base = Math.round(baseUnitPrice(i)), lvl = demandLevel(i);
      const dipped = now < base;
      const note = `<span class="sub">×${state.inv[i]}</span>` + (dipped
        ? ` <span class="sub" style="color:#c98a6a">demand ${Math.round(lvl*100)}% · ${soldToday(i)} sold today</span>` : "");
      const priceHtml = dipped
        ? `<span class="price" style="color:#c98a6a">${now}g</span> <span class="sub" style="text-decoration:line-through;opacity:.55">${base}g</span>`
        : `<span class="price">${now}g</span>`;
      // "all" shows the blended total it will actually fetch, not just the next unit's price
      const allTotal = bundlePrice(i, state.inv[i]);
      // v3.40: the owner's quantity controls — clickable ± arrows around a real number box,
      // "sell" for that many, "all" for the lot. The box id is index-based (names carry spaces).
      const qid = "sq_" + idx;
      html += `<div class="row"><span class="lead" data-icon="item_${i}"><canvas></canvas><span>${i} ${note}</span></span>` +
        `<span>${priceHtml} ` +
        `<button onclick="stepQty('${qid}',-1)">−</button>` +
        `<input type="number" class="qty" id="${qid}" value="1" min="1" max="${state.inv[i]}" onclick="this.select()">` +
        `<button onclick="stepQty('${qid}',1)">+</button> ` +
        `<button onclick="sellQty('${jsq(i)}','${qid}')">sell</button> ` +
        `<button onclick="sellItem('${jsq(i)}',${state.inv[i]})" title="${allTotal}g for all ${state.inv[i]}">all · ${allTotal}g</button></span></div>`;
    });
  } else if(shopTab === "buy"){
    // v4.0: Tom's daily "warden's salvage" — the non-combat trickle for warding materials (V4_PLAN §2),
    // an EXPLICIT buy row (own button), never an auto-drain. Only once the tenth door is open.
    { const o = (typeof todaysSalvage === "function") ? todaysSalvage() : null;
      if(o){ const bought = state.flags.salvageDone === state.day, owned = state.inv[o.item]||0;
        html += `<div class="row"><span class="lead" data-icon="item_${o.item}"><canvas></canvas><span style="color:var(--gold-hi)">✦ Warden's Salvage — ${o.qty}× ${o.item}${owned?` <span class="sub">×${owned}</span>`:''} <span class="sub">${o.want}</span></span></span>` +
          `<span><span class="price">${o.price}g</span> <button class="buy" ${(!bought && state.gold>=o.price)?"":"disabled"} onclick="buySalvage()">${bought?"gone today":"buy"}</button></span></div>`;
      } }
    // v3.41 (owner, extending the sweep): buy rows show WHAT YOU ALREADY HOLD (×N, same badge as
    // selling) and take a quantity — steppers on everything bought in multiples (seeds, food,
    // saplings); one-of-a-kind rows (hive, machines, bouquet) keep single buy but gain the badge.
    let bidx = 0;
    for(const id in CROPS){ const c = CROPS[id]; const ok = skillLvl("Farming") >= c.lvl;
      const inSeason = c.seasons.includes(curSeason());
      const owned = state.inv[c.name+" Seeds"]||0;
      const sub = ok ? `${c.seasons.join("/")} · ${c.days}d · ${c.sell}g${inSeason?"":" · <span style='color:#c98a6a'>off-season</span>"}` : `🔒 Farming ${c.lvl}`;
      const qid = "bq_" + (bidx++);
      html += `<div class="row ${ok?"":"locked"}"><span class="lead" data-icon="item_${c.name} Seeds"><canvas></canvas>` +
        `<span>${c.name} Seeds <span class="sub">×${owned}</span> <span class="sub">${sub}</span></span></span>` +
        `<span><span class="price">${c.seed}g</span> ${ok ? qtyCtl(qid, Math.floor(state.gold/c.seed)) : ""} ` +
        `<button class="buy" ${ok&&state.gold>=c.seed?"":"disabled"} onclick="buySeed('${id}',qv('${qid}'))">buy</button></span></div>`;
    }
    const foodRow = (item, cost, sub) => {
      const qid = "bq_" + (bidx++);
      return `<div class="row"><span class="lead" data-icon="item_${item}"><canvas></canvas><span>${item} <span class="sub">×${state.inv[item]||0}</span> <span class="sub">${sub}</span></span></span>` +
        `<span><span class="price">${cost}g</span> ${qtyCtl(qid, Math.floor(state.gold/cost))} ` +
        `<button class="buy" ${state.gold>=cost?"":"disabled"} onclick="buyFood('${jsq(item)}',${cost},qv('${qid}'))">buy</button></span></div>`;
    };
    html += foodRow("Berry Bun", 30, "+34 energy");
    html += foodRow("Field Salad", 24, "+26 energy");
    html += foodRow("Milk", 160, "fresh from the coast dairy · for cooking");
    if(anyConfided() && !state.flags.married){
      const hasBq = (state.inv["Bouquet"]||0)>0;
      html += `<h2 style="font-size:1em;color:var(--rose);margin:.4em 0 .2em;">COURTSHIP</h2>`;
      html += `<div class="row"><span class="lead" data-icon="item_Bouquet"><canvas></canvas><span>Willowbrook Bouquet <span class="sub">${hasBq?"you have one — give it to your beloved":"give it to the one who has your heart"}</span></span></span><span><span class="price">500g</span> <button class="buy" ${state.gold>=500&&!hasBq?"":"disabled"} onclick="buyBouquet()">buy</button></span></div>`;
    }
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">ORCHARD &amp; APIARY</h2>`;
    for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k];
      const qid = "bq_" + (bidx++);
      html += `<div class="row"><span class="lead" data-icon="item_${t.fruit}"><canvas></canvas><span>${t.name} <span class="sub">×${state.inv[t.name]||0}</span> ` +
        `<span class="sub">${t.blurb} · ${t.sell}g a fruit</span></span></span>` +
        `<span><span class="price">${t.cost}g</span> ${qtyCtl(qid, Math.floor(state.gold/t.cost))} ` +
        `<button class="buy" ${state.gold>=t.cost?"":"disabled"} onclick="buySapling('${jsq(k)}',qv('${qid}'))">buy</button></span></div>`;
    }
    html += `<div class="row"><span class="lead" data-icon="item_Honey"><canvas></canvas><span>Beehive <span class="sub">×${state.inv["Beehive"]||0}</span> ` +
      `<span class="sub">honey every morning · more where more is in bloom</span></span></span>` +
      `<span><span class="price">${HIVE_COST}g</span> <button class="buy" ${state.gold>=HIVE_COST?"":"disabled"} onclick="buyHive()">buy</button></span></div>`;
    // the Cellar: machines that give a crop a second life (wood + ore + coin, like every good tool)
    for(const mk in MACHINES){
      const M = MACHINES[mk];
      // v3.33: the press only reaches the shelf AFTER the dairy's gift — "your first press is a
      // gift; more are on his shelf after that" must be true, not just printed (§3.4).
      if(mk === "press" && !state.flags.ack_tom_press) continue;
      const matStr = Object.keys(M.cost.mats).map(it => { const have=state.inv[it]||0, need=M.cost.mats[it];
        return `${need} ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(" + ");
      const can = state.gold >= M.cost.g && Object.keys(M.cost.mats).every(it => (state.inv[it]||0) >= M.cost.mats[it]);
      html += `<div class="row"><span class="lead" data-icon="item_${M.name}"><canvas></canvas><span>${M.name} <span class="sub">×${state.inv[M.name]||0}</span> ` +
        `<span class="sub">${M.blurb}<br>${M.cost.g}g + ${matStr}</span></span></span>` +
        `<span><button class="buy" ${can?"":"disabled"} onclick="buyMachine('${mk}')">buy</button></span></div>`;
    }

    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">RANCH</h2>`;
    const hens = state.animals.chickens.length;
    html += `<div class="row"><span class="lead" data-icon="item_Egg"><canvas></canvas><span>Chicken <span class="sub">lays an egg daily · lives in your coop · ${hens}/6 hens</span></span></span><span><span class="price">300g</span> <button class="buy" ${state.gold>=300&&hens<6?"":"disabled"} onclick="buyChicken()">buy</button></span></div>`;
    const cows = (state.animals.cows||[]).length;
    html += `<div class="row"><span class="lead" data-icon="item_Milk"><canvas></canvas><span>Cow <span class="sub">milk her every morning · lives in your barn · ${cows}/4 cows</span></span></span><span><span class="price">600g</span> <button class="buy" ${state.gold>=600&&cows<4?"":"disabled"} onclick="buyCow()">buy</button></span></div>`;
    const sheep = (state.animals.sheep||[]).length;
    html += `<div class="row"><span class="lead" data-icon="item_Wool"><canvas></canvas><span>Sheep <span class="sub">shear a full coat every few days · shares the barn · ${sheep}/${SHEEP_MAX} sheep</span></span></span><span><span class="price">${SHEEP_COST}g</span> <button class="buy" ${state.gold>=SHEEP_COST&&sheep<SHEEP_MAX?"":"disabled"} onclick="buySheep()">buy</button></span></div>`;
    html += `<div class="row"><span class="lead" data-icon="item_Shears"><canvas></canvas><span>Shears <span class="sub">${state.flags.hasShears?"you own a pair — shear any sheep with E":"gather wool from your sheep · one and done"}</span></span></span><span><span class="price">${SHEARS_COST}g</span> <button class="buy" ${!state.flags.hasShears&&state.gold>=SHEARS_COST?"":"disabled"} onclick="buyShears()">${state.flags.hasShears?"owned":"buy"}</button></span></div>`;
  } else if(shopTab === "decor"){
    const placed = (state.farm ? Object.values(state.farm.objects) : []).filter(o => DECOR[o.kind]).length;
    html += `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">Pieces to make the farm yours — buy one, then set it down like a hive (select it, press USE on open ground; the axe lifts it again). Purely for the joy of it. <span style="color:var(--gold-hi)">${placed}/${DECOR_MAX} placed.</span></div>`;
    for(const k in DECOR){
      const D = DECOR[k], own = state.inv[D.name]||0, vanity = D.cost >= 100000;
      // The Storyteller's Banner (v3.32) shows LOCKED, not hidden — a quest cape you can't see
      // isn't worth chasing. The row itself is the advertisement.
      const qpLocked = D.qpGate && !state.flags.qpAllTold;
      const matsOk = !D.mats || Object.keys(D.mats).every(it => (state.inv[it]||0) >= D.mats[it]);   // v3.29
      const matStr = D.mats ? "<br>" + Object.keys(D.mats).map(it => { const have=state.inv[it]||0, need=D.mats[it];
        return `${need} ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(" + ") : "";
      const blurb = qpLocked ? `“Not for sale — not to you, not yet. Finish every task the valley's book ever asks, and we'll talk.” <span style="color:var(--gold-hi)">✦ ${questPoints()}/${questPointsTotal()} Quest Points</span>` : D.blurb;
      html += `<div class="row"><span class="lead" data-icon="item_${D.name}"><canvas></canvas><span style="${vanity||D.qpGate?`color:${'#ffd75a'}`:''}">${qpLocked?"🔒 ":""}${D.name}${own?` <span class="sub" style="color:var(--gold-hi)">×${own} in bag</span>`:''} <span class="sub">${blurb}${matStr}</span></span></span>` +
        `<span><span class="price">${D.cost.toLocaleString()}g</span> <button class="buy" ${state.gold>=D.cost&&matsOk&&!qpLocked?"":"disabled"} onclick="buyDecor('${k}')">${qpLocked?"locked":"buy"}</button></span></div>`;
    }
  } else {
    for(const tool of TOOLS){
      if(tool === "Stave" && !state.flags.staveEarned) continue;   // v4.0: the Stave only appears on the wall once Elias has given it
      const cur = state.tools[tool];
      if(cur >= MAX_TIER){ html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur]}">${TOOL_TIERS[cur]} ${tool} ★ <span class="sub">maxed</span></span></span></div>`; continue; }
      const c = toolCost(tool, cur+1);
      const need = TIER_LEVEL[cur+1], sk = TOOL_SKILL[tool], haveLvl = skillLvl(sk) >= need;
      const can = haveLvl && state.gold>=c.g && Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it]);
      const CAN_PERK = ["", "waters a 3-tile row", "waters a 5-tile row", "waters 3×3", "waters 3×3, next to no energy", "waters 3×3, harder steel", "waters 3×3, the star's own temper"];   // v3.37: +2 rungs
      const HOE_PERK = ["", "tills a 3-tile row", "tills a 5-tile row", "tills 3×3", "tills 3×3, next to no energy", "tills 3×3, harder steel", "tills 3×3, the star's own temper"];
      const perk = tool==="Can" ? CAN_PERK[cur+1] : tool==="Hoe" ? HOE_PERK[cur+1]
                 : tool==="Rod" ? "faster bites, steadier reel" : "stronger, less energy";
      const matStr = Object.keys(c.mats).map(it => { const have=state.inv[it]||0, need2=c.mats[it];
        return `${need2} ${it} <span style="color:${have>=need2?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(" + ");
      const lvlStr = `<span style="color:${haveLvl?'#8fd06a':'#c98a6a'}">needs ${sk} ${need}</span>`;
      html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur+1]}">${TOOL_TIERS[cur+1]} ${tool}</span> ` +
        `<span class="sub">${lvlStr} · ${c.g}g + ${matStr}<br>${perk}</span></span>` +
        `<button class="buy" ${can?"":"disabled"} onclick="buyTool('${tool}')">upgrade</button></div>`;
    }
  }
  b.innerHTML = html;
  hydrateIcons(b);
}
function jsq(s){ return s.replace(/'/g,"\\'"); }

// ---- gift picker ----
function openGiftPicker(id, items){
  $("giftHead").textContent = "GIVE " + NPCDEF[id].name.toUpperCase();
  openPanel("giftPanel", () => renderGift(id, items));
}
// ---- v3.43: the cairn panorama — the game's own geography, painted from the one spot the
// fiction promised. A single static scene keyed to hour + weather (never a live second camera),
// drawn at the game's native 320×208 and upscaled pixelated like everything else. ----
let _panoClose = null;   // live close handle — uiBlocking() and doSleep() check/clear it (review fixes)
function openPanorama(){
  if(_panoClose){ _panoClose(); return; }   // second press on the cairn climbs down
  const wrap = document.createElement("div");
  wrap.id = "panorama";
  Object.assign(wrap.style, { position:"absolute", inset:"0", zIndex:"60", background:"#000", cursor:"pointer" });
  const cv = document.createElement("canvas"); cv.width = 320; cv.height = 208;
  Object.assign(cv.style, { width:"100%", height:"100%", imageRendering:"pixelated" });
  wrap.appendChild(cv);
  $("stage") ? $("stage").appendChild(wrap) : document.body.appendChild(wrap);
  const g = cv.getContext("2d");
  paintPanorama(g);
  // the Marrow Point light really blinks (review fix: one paint froze the animT sample) —
  // a slow repaint while open, cleared on EVERY close path below
  const tick = setInterval(() => paintPanorama(g), 600);
  const onKey = e => { e.stopPropagation(); e.preventDefault(); close(); };
  const close = () => { clearInterval(tick); document.removeEventListener("keydown", onKey, true); wrap.remove(); _panoClose = null; };
  _panoClose = close;
  wrap.onclick = close;
  // one keypress also climbs down — captured ahead of the game's own handler, and properly
  // REMOVED on click-close too (review fix: the once-listener used to dangle and silently
  // swallow one future keypress at some random later moment)
  document.addEventListener("keydown", onKey, { capture:true });
  playSfx("menu");
}
function paintPanorama(g){
  const h = state.time/60, night = (h >= 20 || h < 5.5), dusk = (h >= 17.5 && h < 20), dawn = (h >= 5.5 && h < 8);
  g.imageSmoothingEnabled = false;
  // the sky — the hour picks the palette
  const sky = g.createLinearGradient(0,0,0,120);
  if(night){ sky.addColorStop(0,"#0a0c1e"); sky.addColorStop(1,"#1c2340"); }
  else if(dusk){ sky.addColorStop(0,"#3a3560"); sky.addColorStop(1,"#d8784a"); }
  else if(dawn){ sky.addColorStop(0,"#4a5a8a"); sky.addColorStop(1,"#e8a86a"); }
  else { sky.addColorStop(0,"#6aa0d8"); sky.addColorStop(1,"#b8d8ee"); }
  g.fillStyle = sky; g.fillRect(0,0,320,120);
  // stars / sun / moon
  if(night){ g.fillStyle="#e8ecff"; for(let i=0;i<70;i++){ const x=(i*47)%320, y=(i*31)%95; g.fillRect(x,y,1,1); }
    g.fillStyle="#f4f0e0"; g.beginPath(); g.arc(258,30,9,0,7); g.fill(); g.fillStyle= "#1c2340"; g.beginPath(); g.arc(262,27,8,0,7); g.fill(); }
  else { g.fillStyle = dusk||dawn ? "#ffd88a" : "#fff2c0"; g.beginPath(); g.arc(dusk?60:250, dusk?95:35, 11, 0, 7); g.fill(); }
  // far hills, two silhouettes deep
  g.fillStyle = night ? "#131a2e" : dusk ? "#4a3a55" : "#5a7a9a";
  g.beginPath(); g.moveTo(0,105); for(let x=0;x<=320;x+=16) g.lineTo(x, 95 + Math.sin(x*0.05)*7); g.lineTo(320,120); g.lineTo(0,120); g.fill();
  g.fillStyle = night ? "#0e1424" : dusk ? "#3a2e46" : "#46617e";
  g.beginPath(); g.moveTo(0,115); for(let x=0;x<=320;x+=16) g.lineTo(x, 108 + Math.cos(x*0.04)*6); g.lineTo(320,125); g.lineTo(0,125); g.fill();
  // the valley floor
  g.fillStyle = night ? "#16241a" : "#4a7a3e"; g.fillRect(0,118,320,90);
  // the sea, along the south — a band across the bottom
  g.fillStyle = night ? "#101c30" : "#2f5a7e"; g.fillRect(0,178,320,30);
  g.fillStyle = night ? "#1a2a44" : "#4a7aa0"; for(let x=0;x<320;x+=22) g.fillRect(x+((state.day*3)%11),182+((x/22)%3),9,1);
  // the grove, a dark mass to the west (left)
  g.fillStyle = night ? "#0c1810" : "#2c4a28"; g.fillRect(0,120,66,52);
  for(let i=0;i<26;i++){ const x=(i*13)%62, y=124+(i*17)%42; g.fillStyle = night ? "#122414" : "#39602f"; g.fillRect(x,y,5,4); }
  // the farm — fields, the cottage, a thread of chimney smoke
  g.fillStyle = night ? "#233020" : "#7aa04e"; g.fillRect(84,132,42,26);
  g.fillStyle = night ? "#1c281a" : "#68904a"; for(let i=0;i<5;i++) g.fillRect(84,134+i*5,42,2);
  g.fillStyle="#5a3f28"; g.fillRect(96,124,12,8); g.fillStyle="#7a5636"; g.fillRect(94,122,16,3);
  g.fillStyle = night ? "#ffd88a" : "#3a2c1c"; g.fillRect(99,127,2,2);   // one lit window after dark
  g.fillStyle="rgba(220,220,220,0.5)"; for(let i=0;i<4;i++) g.fillRect(106, 116-i*4, 2, 2);
  // the village + the guild on its rise
  for(let i=0;i<6;i++){ const x=150+i*11, y=140+(i%2)*6; g.fillStyle="#5a3f28"; g.fillRect(x,y,9,7); g.fillStyle="#7a5636"; g.fillRect(x-1,y-2,11,3);
    if(night){ g.fillStyle="#ffd88a"; g.fillRect(x+3,y+3,2,2); } }
  g.fillStyle="#6a4e32"; g.fillRect(176,126,16,10); g.fillStyle="#8a6647"; g.fillRect(174,123,20,4);   // the guild
  // the coast: umbrellas on the sand
  for(let i=0;i<5;i++){ g.fillStyle=["#c94f4f","#4f7ac9","#c9a44a","#4fa06a","#b06ac9"][i]; g.fillRect(140+i*14,172,6,2); g.fillStyle="#e8dcc0"; g.fillRect(142+i*14,174,2,2); }
  // the Gullwater, down from the hills to the sea — and the coast road running north (right)
  g.fillStyle = night ? "#1a2a44" : "#4a7aa0"; for(let y=120;y<178;y+=2) g.fillRect(236 + Math.round(Math.sin(y*0.12)*4), y, 3, 2);
  g.fillStyle = night ? "#3a3226" : "#b8a06a"; for(let y=126;y<176;y+=2) g.fillRect(262 + Math.round((176-y)*0.4), y, 3, 2);
  // Marrow Point's light, far up the coast — a blink you can just make out
  if(Math.floor(animT*1.2)%2===0){ g.fillStyle="#ffe6a0"; g.fillRect(312,121,2,2); g.fillStyle="rgba(255,230,160,0.35)"; g.fillRect(310,119,6,6); }
  // weather over everything
  if(isRain() || isStorm()){ g.fillStyle="rgba(140,170,210,0.25)"; for(let i=0;i<90;i++){ const x=(i*37)%320, y=(i*53)%200; g.fillRect(x,y,1,4); } }
  if(isFog()){ g.fillStyle="rgba(200,205,215,0.35)"; g.fillRect(0,100,320,108); }
  if(isSnow()){ g.fillStyle="rgba(240,244,250,0.8)"; for(let i=0;i<60;i++){ const x=(i*41)%320, y=(i*61)%200; g.fillRect(x,y,1,1); } }
  // the caption, on the pixel canvas like a postcard
  g.fillStyle="rgba(0,0,0,0.55)"; g.fillRect(0,196,320,12);
  g.fillStyle="#e9dcc0"; g.font="8px monospace"; g.textAlign="center";
  g.fillText("The valley, from Starfall Ridge. (click to climb down)", 160, 204);
  g.textAlign="left";
}

// ---- v3.40 quantity controls (owner sweep: "give the option to modify the quantity") ----
function stepQty(qid, d){
  const el = $(qid); if(!el) return;
  const max = parseInt(el.max, 10) || 1;
  el.value = Math.max(1, Math.min(max, (parseInt(el.value, 10) || 1) + d));
}
function sellQty(item, qid){
  const el = $(qid);
  const n = Math.max(1, Math.min((state.inv[item]||0), parseInt(el && el.value, 10) || 1));
  sellItem(item, n);
}
// v3.41: read a quantity box for the BUY side (the purchase fns clamp to the purse themselves)
function qv(qid){ const el = $(qid); return Math.max(1, parseInt(el && el.value, 10) || 1); }
// one stepper cluster, shared by every buy row that sells in multiples
function qtyCtl(qid, max){
  return `<button onclick="stepQty('${qid}',-1)">−</button>` +
    `<input type="number" class="qty" id="${qid}" value="1" min="1" max="${Math.max(1,max)}" onclick="this.select()">` +
    `<button onclick="stepQty('${qid}',1)">+</button>`;
}
// The machine chooser — the gift panel's pattern for the cellar. interact() opens it whenever a
// machine is empty and you carry MORE than one thing it accepts; one acceptable thing still loads
// instantly (the old one-button reflex kept where a menu would be pure friction).
function openMachineChooser(kind, tx, ty){
  const M = MACHINES[kind];
  $("machHead").textContent = "LOAD THE " + M.name.toUpperCase();
  openPanel("machPanel", () => renderMachineChooser(kind, tx, ty));
}
function renderMachineChooser(kind, tx, ty){
  const M = MACHINES[kind], b = $("machPanel").querySelector(".body");
  const items = Object.keys(state.inv).filter(it => (state.inv[it]||0) > 0 && M.accepts(it));
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Pick what goes in.` +
    (kind === "sawmill" ? ` The mill takes up to ${M.batch} of one species.` : ` One at a time; ${M.days} ${M.days===1?"night":"nights"} each.`) + `</div>`;
  items.forEach(it => {
    const prod = M.product(it);
    const sub = kind === "sawmill"
      ? `×${state.inv[it]} → ${Math.min(state.inv[it], M.batch)} ${prod}`
      : `×${state.inv[it]} → ${prod} (${ITEM_SELL[prod]||0}g)`;   // the PRODUCT's real price (review fix: mult-math showed Fine Cheese at 248g; it sells for 250)
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas><span>${it} <span class="sub">${sub}</span></span></span>` +
      `<button onclick="machChoose('${jsq(kind)}',${tx},${ty},'${jsq(it)}')">load</button></div>`;
  });
  if(!items.length) html += `<div class="locked">Nothing in your bag that it takes.</div>`;
  b.innerHTML = html; hydrateIcons(b);
}
function machChoose(kind, tx, ty, item){
  closePanel("machPanel");
  loadMachineWith(kind, tx, ty, item);   // 08-actions.js — the one loader both paths share
}

function renderGift(id, items){
  const def = NPCDEF[id], b = $("giftPanel").querySelector(".body");
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Pick something from your bag. One gift per day.</div>`;
  items.forEach(it => {
    const pref = giftPref(def, it);
    const tag = pref==="loved" ? `<span class="pref loved">♥ loves</span>` : pref==="liked" ? `<span class="pref liked">likes</span>` : "";
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas><span>${it} <span class="sub">×${state.inv[it]}</span> ${tag}</span></span>` +
      `<button onclick="giftNpcItem('${jsq(id)}','${jsq(it)}')">give</button></div>`;
  });
  b.innerHTML = html; hydrateIcons(b);
}

// ---- The Old Lift: ride between the surface and any restored stop; restore this floor's stop ----
function openLift(){ openPanel("liftPanel", renderLift); }
function renderLift(){
  const b = $("liftPanel").querySelector(".body");
  const depth = state.mineDepth||1, stops = (state.liftStops||[]).slice().sort((a,b)=>a-b);
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `The counterweight still works — riding UP is free. The deeper stops rusted shut; restore one and it's yours forever.</div>`;
  html += `<div class="row"><span class="lead"><span>☀ The Surface</span></span>` +
    `<button class="buy" onclick="rideLift(0)">ride</button></div>`;
  for(const s of stops){
    html += `<div class="row"><span class="lead"><span>Floor ${s} <span class="sub">restored stop</span></span></span>` +
      (s===depth ? `<span class="sub">you are here</span>` : `<button class="buy" onclick="rideLift(${s})">ride</button>`) + `</div>`;
  }
  if(depth % 5 === 0 && !stops.includes(depth)){
    // Grove Depths Phase 4: the stop funds through the Pledge Ledger — partial deposits, here
    // or from the Journal, and arriving under-resourced is never a wasted trip. The old
    // all-or-nothing "restore" button (disabled until you carried everything at once) is gone.
    html += pledgeRowHtml("lift"+depth);
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">Pledge what you carry — here, or from the Journal (J), anywhere. The ledger keeps the tally.</div>`;
  } else if(depth % 5 !== 0){
    const next = Math.ceil(depth/5)*5;
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">The next restorable stop is at floor ${next}.</div>`;
  }
  // --- The Deep Run (v3.15): opt-in time pressure + a Stone sink, all cozy-safe ---
  const dr = !!state.deepRun, stone = state.inv["Stone"]||0, stairs = state.inv["Staircase"]||0;
  html += `<div class="desc" style="margin:.7em 0 .3em;border-top:1px solid rgba(0,0,0,.18);padding-top:.55em;">` +
    `<b style="color:var(--gold-hi)">⛏ The Deep Run.</b> <span style="color:var(--ink-soft)">` +
    (dr ? "The clock is running. Go as deep as you dare — sunrise sends you home with everything you've found."
        : "Set the clock moving and race the dark for the rich deep floors. Nothing is ever lost — you just come home.") +
    `</span></div>`;
  html += `<div class="row"><span class="lead"><span>${dr ? "⏱ On a run — time is moving" : "☾ Timeless dig"}</span></span>` +
    `<button class="buy" onclick="toggleDeepRun()">${dr ? "stand down" : "begin a run"}</button></div>`;
  html += `<div class="row"><span class="lead"><span>Pack a Staircase <span class="sub">${STAIR_STONE} Stone → drop ${STAIR_DROP} floors · you hold ${stairs}</span></span></span>` +
    `<button class="buy" ${stone>=STAIR_STONE?"":"disabled"} onclick="packStaircase()">pack (${stone} stone)</button></div>`;
  if(stairs > 0) html += `<div class="row"><span class="lead"><span>Take a Staircase down <span class="sub">−1 Staircase · plunge ${STAIR_DROP} floors deeper</span></span></span>` +
    `<button class="buy" onclick="takeStairs()">descend</button></div>`;
  b.innerHTML = html;
}
function toggleDeepRun(){
  state.deepRun = !state.deepRun;
  if(state.deepRun) toast("The Deep Run begins — the clock is moving now. Get deep, then get out.", "#ffcf6a");
  else toast("You stand down. Underground, time holds still again.", "#a9b0c0");
  playSfx("select"); renderLift();
}
function packStaircase(){
  if((state.inv["Stone"]||0) < STAIR_STONE){ playSfx("error"); return; }
  take("Stone", STAIR_STONE); give("Staircase", 1, true);
  toast("A staircase, folded and ready. That's what all that stone was for.", "#cbb98f");
  playSfx("upgrade"); refreshHUD(); renderLift();
}
function takeStairs(){
  if((state.inv["Staircase"]||0) < 1){ playSfx("error"); return; }
  take("Staircase", 1);
  const prevBest = state.mineBest||0;
  state.mineDepth = (state.mineDepth||1) + STAIR_DROP;
  state.mineBest = Math.max(prevBest, state.mineDepth);
  checkQuests();   // credit a "reach floor N" objective on arrival, exactly as mineDown does
  closeAllPanels(); playSfx("door");
  travelTo("mine", 2*TILE+8, 3*TILE, "down");   // one regen straight to the new floor
  // toast, not banner: setMap fires its own "The Old Mine / Floor N" banner as the fade lands, and
  // would overwrite a banner set here — a toast queues and survives the transition (as mineDown's does)
  const newRecord = state.mineDepth > prevBest && state.mineDepth >= 10;
  toast(newRecord ? `⛏ Floor ${state.mineDepth} — deeper than the valley's been in years. The dark gives up richer things down here.`
                  : `Down ${STAIR_DROP} floors in a clatter of planks — floor ${state.mineDepth}.`,
        newRecord ? "#ffcf6a" : "#a9b0c0");
}
function rideLift(target){
  closeAllPanels();
  playSfx("door");
  if(target === 0){ state.deepRun = false; travelTo("village", 33*TILE+8, 4*TILE+8, "down"); toast("The lift rattles up into the daylight.", "#cbb98f"); return; }
  state.mineDepth = target;
  travelTo("mine", 2*TILE+8, 3*TILE, "down");
  toast(`The lift lowers you to floor ${target}.`, "#a9b0c0");
}
// restoreLift (the all-or-nothing at-the-stop purchase) is gone — lift stops fund through
// contributePledge like everything else on the ledger. completePledge still lands the stop in
// state.liftStops, so ride logic and old saves are untouched.

// ---- The Pledge Ledger (waystones now; the Old Lift joins it in Phase 4) ----
// One contribute button per pledge: it deposits EVERYTHING you're carrying that's still owed
// (gold up to the remainder, each material up to its remainder). Partial progress persists
// forever; the ledger — never the player — remembers what's left.
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function pledgeRowHtml(id){
  const rem = pledgeRemaining(id), bits = [];
  if(rem.g > 0) bits.push(`${rem.g}g <span style="color:${state.gold>=rem.g?'#8fd06a':'#c98a6a'}">(${state.gold})</span>`);
  for(const it in rem.mats){ const have = state.inv[it]||0;
    bits.push(`${rem.mats[it]}× ${it} <span style="color:${have>=rem.mats[it]?'#8fd06a':'#c98a6a'}">(${have})</span>`); }
  const canAny = (rem.g > 0 && state.gold > 0) || Object.keys(rem.mats).some(it => (state.inv[it]||0) > 0);
  // v3.40 (owner sweep): portions, not a drain — "when you click pledge it automatically just
  // drains your cash… and all the resources". A little = 10% of the total cost per resource,
  // half = 50%, all = the old behaviour, each still capped by what's owed and what you hold.
  return `<div class="row"><span class="lead"><span>${cap(pledgeName(id))} <span class="sub">owed: ${bits.join(", ")}</span></span></span>` +
    `<span><button ${canAny?"":"disabled"} onclick="contributePledge('${id}',0.1)">a little</button> ` +
    `<button ${canAny?"":"disabled"} onclick="contributePledge('${id}',0.5)">half</button> ` +
    `<button class="buy" ${canAny?"":"disabled"} onclick="contributePledge('${id}',1)">all</button></span></div>`;
}
function contributePledge(id, frac){
  if(pledgeDone(id)) return;
  // v3.39: complete-first — if a past cost REDUCTION (the lift rebalance) left this pledge already
  // over-funded, land it now; the old order demanded one more deposit the ledger didn't need, and
  // a player with empty pockets got "nothing it still needs" forever instead of their stop.
  if(pledgeFunded(id)){ completePledge(id); return; }
  // v3.40: frac portions the deposit — each resource gives at most ceil(frac × its TOTAL cost)
  // this click (a consistent chunk however far along the pledge is), still capped by what's owed
  // and held. frac 1 (or omitted — every old call site) is the original everything-you-have.
  frac = frac || 1;
  const total = pledgeCost(id) || { g:0, mats:{} };
  const chunk = v => frac >= 1 ? Infinity : Math.max(1, Math.ceil(v * frac));
  const rem = pledgeRemaining(id);
  if(!state.pledges) state.pledges = {};
  const p = state.pledges[id] || (state.pledges[id] = { gPaid:0, mats:{} });
  const gave = [];
  const dg = Math.min(state.gold, rem.g, chunk(total.g));
  if(dg > 0){ state.gold -= dg; p.gPaid = (p.gPaid||0) + dg; gave.push(dg + "g"); }
  for(const it in rem.mats){
    const d = Math.min(state.inv[it]||0, rem.mats[it], chunk(total.mats[it]||rem.mats[it]));
    if(d > 0 && take(it, d)){ if(!p.mats) p.mats = {}; p.mats[it] = (p.mats[it]||0) + d; gave.push(d + "× " + it); }
  }
  if(!gave.length){ toast("Nothing on you that it still needs.", "#c98a6a"); playSfx("error"); return; }
  if(pledgeFunded(id)) completePledge(id);
  else {
    const r2 = pledgeRemaining(id), owed = [];
    if(r2.g > 0) owed.push(r2.g + "g");
    for(const it in r2.mats) owed.push(r2.mats[it] + "× " + it);
    toast("Pledged " + gave.join(", ") + ".  Still owed: " + owed.join(", "), "#8fe8c8");
    playSfx("coin");
  }
  saveGame();   // pledge progress is permanent — never lose a deposit to a crash
  refreshHUD(); refreshPledgeViews();
}
// A filled pledge wakes INSTANTLY — "come back tomorrow" would be the trip-wasting frustration
// this system exists to kill, in a smaller size.
function completePledge(id){
  if(state.pledges) delete state.pledges[id];   // done-ness lives in waystones/liftStops/wardBells
  if(id.startsWith("way")){
    if(!state.waystones) state.waystones = [];
    if(!state.waystones.includes(id)) state.waystones.push(id);
    banner("❖ Waystone awakened", cap(pledgeName(id)) + " hums with green light. Step between the stones — free, forever.");
  } else if(id.startsWith("bell")){   // v4.0 Warden's Bell
    const n = parseInt(id.slice(4), 10);
    if(!state.wardBells) state.wardBells = [];
    if(!state.wardBells.includes(n)) state.wardBells.push(n);
    banner("❖ Warden's Bell rung", "Floor " + n + " answers now — ring back down to it any time, for good.");
    playSfx("bellRing"); pSparkle(state.px, state.py-12, "#bfe4ff", 18); saveGame(); return;
  } else {
    const n = parseInt(id.slice(4), 10);
    if(!state.liftStops.includes(n)) state.liftStops.push(n);
    banner("⚙ Lift stop restored", "Floor " + n + " is on the line now — for good.");
  }
  playSfx("upgrade"); pSparkle(state.px, state.py-12, "#8fe8c8", 18);
  saveGame();
}
function refreshPledgeViews(){
  if(openPanels.has("questPanel")) renderJournal();
  if(openPanels.has("wayPanel"))   renderWaystone();
  if(openPanels.has("liftPanel"))  renderLift();
}
// The Journal's Restorations block — the ledger itself, readable and payable from anywhere.
function renderRestorations(){
  const ids = ledgerPledges();
  if(!ids.length) return "";
  let h = `<div class="jq"><h3 style="color:#8fe8c8">❖ Restorations — ${ids.filter(pledgeDone).length}/${ids.length} funded</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">Old Guild works you've found. Pledge what you carry, whenever — the ledger keeps the tally.</div>`;
  for(const id of ids){
    if(pledgeDone(id)){ h += `<div class="obj done">✔ ${cap(pledgeName(id))} — restored</div>`; continue; }
    h += pledgeRowHtml(id);
  }
  h += `</div>`;
  return h;
}

// ---- The Warden's Ledger (v4.3): Act III's hub, the book by the tenth door ----
// The deposit flow mirrors the Pledge Ledger (partial funding, the tally lives in the book);
// the close flow plays the chapter's scene, warms the Guild, and turns the page. Data + the
// pure state helpers (wardChapterDef/wardBundleRemaining/…) live in 15-warding.js.
function openWardLedger(){
  // First read is a discovery: Elias's note in the front cover, then the panel.
  if(!state.flags.wardLedgerSeen){
    state.flags.wardLedgerSeen = true; saveGame();
    openLetter("❖ The Warden's Ledger", WARD_LEDGER_INTRO, () => openPanel("wardLedgerPanel", renderWardLedger));
    return;
  }
  openPanel("wardLedgerPanel", renderWardLedger);
}
function renderWardLedger(){
  const b = $("wardLedgerPanel").querySelector(".body");
  if(wardChaptersAllDone()){
    b.innerHTML = `<div class="desc" style="margin-bottom:.5em;">Every page you set out to keep is kept. The wing is warm from the tenth door to the deep stair — tended, and staying tended, because you come back to it.</div>` +
      WARD_CHAPTERS.map(c => `<div class="obj done">✔ ${c.title}</div>`).join("");
    return;
  }
  const def = wardChapterDef(), idx = state.wardChapter||0;
  let h = `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">Elias's book, kept in your hand now.  ·  Chapter ${idx+1} of ${WARD_CHAPTERS.length}</div>`;
  h += `<div class="jq"><h3 style="color:#bfe4ff">❖ ${def.title}</h3><div class="desc">“${def.blurb}”</div>`;
  // the bundle — deposit what you carry, a portion or all (the ledger keeps the remainder)
  if(wardBundleFunded()){
    h += `<div class="obj done">✔ The bundle is gathered — every material set down.</div>`;
  } else {
    for(const it in def.bundle){
      const need = def.bundle[it], paid = (state.wardBundle||{})[it]||0, have = state.inv[it]||0, got = paid >= need;
      h += `<div class="obj ${got?"done":""}">${got?"✔":"•"} ${it} ${Math.min(paid,need)}/${need}` +
           (got ? "" : ` <span class="sub">(carrying ${have})</span>`) + `</div>`;
    }
    const canAny = Object.keys(wardBundleRemaining()).some(it => (state.inv[it]||0) > 0);
    h += `<div class="row"><span class="lead"><span class="sub">Set down what you carry — the ledger keeps the tally.</span></span>` +
      `<span><button ${canAny?"":"disabled"} onclick="contributeChapter(0.5)">half</button> ` +
      `<button class="buy" ${canAny?"":"disabled"} onclick="contributeChapter(1)">all</button></span></div>`;
  }
  // the expedition beat
  const expDone = wardExpeditionDone(def);
  h += `<div class="obj ${expDone?"done":""}">${expDone?"✔":"•"} ${def.expedition.text}</div></div>`;
  // close the chapter, once both are met
  if(wardChapterReady(def)){
    h += `<div class="row"><span class="lead"><span style="color:var(--gold-hi)">The round is walked and the bundle set down.</span></span>` +
      `<span><button class="buy" onclick="closeWardChapter()">Close the page</button></span></div>`;
  } else {
    h += `<div class="desc" style="color:var(--ink-soft);margin-top:.3em;">Gather the bundle and walk the round — then come back and close the page here.</div>`;
  }
  b.innerHTML = h;
}
// Deposit toward the current chapter's bundle. frac 0.5 = half of each material's TOTAL this click,
// 1 = everything you carry that's still owed. Materials are TAKEN now and remembered in state.wardBundle
// (never lost — closing the chapter doesn't ask for them again; they're already in the book).
function contributeChapter(frac){
  const def = wardChapterDef(); if(!def || wardBundleFunded()) return;
  frac = frac || 1;
  const chunk = v => frac >= 1 ? Infinity : Math.max(1, Math.ceil(v * frac));
  const rem = wardBundleRemaining();
  if(!state.wardBundle) state.wardBundle = {};
  const gave = [];
  for(const it in rem){
    const d = Math.min(state.inv[it]||0, rem[it], chunk(def.bundle[it]||rem[it]));
    if(d > 0 && take(it, d)){ state.wardBundle[it] = (state.wardBundle[it]||0) + d; gave.push(d + "× " + it); }
  }
  if(!gave.length){ toast("Nothing on you the ledger still needs.", "#c98a6a"); playSfx("error"); return; }
  const r2 = wardBundleRemaining(), owed = [];
  for(const it in r2) owed.push(r2[it] + "× " + it);
  if(!owed.length) toast("Set down " + gave.join(", ") + ".  The bundle's complete.", "#8fe8c8");
  else toast("Set down " + gave.join(", ") + ".  Still wanted: " + owed.join(", "), "#8fe8c8");
  playSfx("coin");
  saveGame(); refreshHUD();
  if(openPanels.has("wardLedgerPanel")) renderWardLedger();
}
// Close the current chapter: the Guild warms (a lantern pair lights, live), the scene plays,
// then the reward lands and the page turns. Guarded so it can only fire when genuinely ready.
function closeWardChapter(){
  const def = wardChapterDef(); if(!def || !wardChapterReady(def)) return;
  closeAllPanels(true);
  const ensure = (id, x, y, face) => { let n = curMap.npcs.find(v => v.id === id);
    if(!n){ n = mkNpc(id, x*TILE, y*TILE, {face}); curMap.npcs.push(n); } return n; };
  const scene = def.scene(ensure);
  const steps = [
    { type:"run", fn:()=>{
        if(def.world){ state.flags[def.world] = true; if(typeof wardWorldProps === "function") wardWorldProps(curMap); }
        pSparkle(state.px, state.py-12, "#ffd88a", 18); playSfx("upgrade"); } },
    ...scene,
  ];
  // Append the closing card — UNLESS the scene already ends on its own banner (the ch8 finale does),
  // or the two would render the same "❖ <title>" headline back-to-back (v4.5 review fix).
  if(!(scene.length && scene[scene.length-1].type === "banner"))
    steps.push({ type:"banner", big:"❖ " + def.title, small:def.done || "A page closes in the Warden's Ledger.", t:3.0 });
  startCutscene(steps, () => {
    const r = def.reward || {};
    if(r.gold){ state.gold += r.gold; floatText(state.px, state.py-24, "+" + r.gold + "g", "#ffce5a"); }
    if(r.items) for(const it in r.items) give(it, r.items[it], true);
    state.wardChapter = (state.wardChapter||0) + 1;
    state.wardBundle = {};
    playSfx("quest"); saveGame(); refreshHUD();
    if(wardChaptersAllDone()) setTimeout(() => banner("❖ The Warden's Ledger", "Every page kept. The wing is warm the whole way down — and it will stay so, because you tend it."), 1200);
  });
}
// The Journal's read-only mirror of the ledger — so Act III's arc is visible in J, like the quests.
function renderWardLedgerJournal(){
  const n = Math.min(state.wardChapter||0, WARD_CHAPTERS.length);
  let h = `<div class="jq"><h3 style="color:#bfe4ff">❖ The Warden's Ledger <span style="color:var(--ink-soft);font-size:.8em;">— Act III · kept for Elias</span></h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">The book by the tenth door. ${n}/${WARD_CHAPTERS.length} pages closed — the Guild warms with each one.</div>`;
  WARD_CHAPTERS.forEach((c, i) => {
    const done = (state.wardChapter||0) > i, active = (state.wardChapter||0) === i;
    if(!done && !active) return;   // pages you haven't reached stay unwritten
    h += `<div class="obj ${done?"done":""}">${done?"✔":"✒"} ${c.title}</div>`;
  });
  h += `</div>`;
  return h;
}

// ---- Waystones: the panel at the stone ----
const WAY_LABEL = { way1:"The Grove Mouth  ·  Ring 1", way3:"The Third Ring", way6:"The Sixth Ring", way9:"The Heart  ·  Ring 9" };
let wayAtId = null;   // which stone the player is standing at
function openWaystone(id){ wayAtId = id; openPanel("wayPanel", renderWaystone); }
function renderWaystone(){
  const b = $("wayPanel").querySelector(".body");
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `Guild-era stones, keyed to one another. An awake stone carries you to any other awake stone — free, forever.</div>`;
  if(wayAtId && !pledgeDone(wayAtId)){
    html += pledgeRowHtml(wayAtId);
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">This stone remembers you. Pledge here, or from the Journal (J) — anywhere, any time, a little at a time.</div>`;
  } else {
    for(const id of ["way1","way3","way6","way9"]){
      if(!pledgeDone(id)) continue;
      const here = id === wayAtId;
      html += `<div class="row"><span class="lead"><span>${WAY_LABEL[id]}</span></span>` +
        (here ? `<span class="sub">you are here</span>` : `<button class="buy" onclick="rideWaystone('${id}')">step</button>`) + `</div>`;
    }
    const dormant = ["way3","way6","way9"].filter(id => pledgeDiscovered(id) && !pledgeDone(id));
    for(const id of dormant) html += `<div class="row locked"><span class="lead"><span>${WAY_LABEL[id]} <span class="sub">dormant — pledge in the Journal</span></span></span></div>`;
  }
  b.innerHTML = html;
}
function rideWaystone(id){
  const ring = WAYSTONE_RING[id];
  closeAllPanels();
  if(state.map === "grove" && (state.groveRing||1) === ring) return;
  state.groveRing = ring;
  state.groveBest = Math.max(state.groveBest||0, ring);
  playSfx("door");
  const sx = (id === "way1" ? 44-7 : 10) * TILE + 8;
  travelTo("grove", sx, 14*TILE+8, "up");
  toast("The stones trade places with the world — Ring " + ring + ".", "#8fe8c8");
}

// ---- kitchen ----
function openCooking(){ openPanel("cookPanel", renderCooking); }
function renderCooking(){
  const b = $("cookPanel").querySelector(".body");
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Cook for energy, coin, and to delight the valley. Trains Cooking.</div>`;
  const rawFish = FISH.filter(f => (state.inv[f.name]||0) > 0);
  if(rawFish.length){
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.2em 0;">GRILL</h2>`;
    rawFish.forEach(f => {
      html += `<div class="row"><span class="lead" data-icon="item_${f.name}"><canvas></canvas><span>Cook ${f.name} <span class="sub">→ Cooked ${f.name}</span></span></span>` +
        `<button onclick="cookFish('${jsq(f.name)}')">cook</button></div>`;
    });
  }
  html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">RECIPES</h2>`;
  RECIPES.forEach((r,i) => {
    const lvlOk = skillLvl("Cooking") >= r.lvl;
    if(!lvlOk){
      html += `<div class="row locked"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
        `<span>${r.name} <span class="sub">🔒 learned at Cooking ${r.lvl}</span></span></span>` +
        `<button disabled>cook</button></div>`;
      return;
    }
    const can = Object.keys(r.ing).every(it => (state.inv[it]||0) >= r.ing[it]);
    const ingStr = Object.keys(r.ing).map(it => { const have=state.inv[it]||0, need=r.ing[it];
      return `${need}× ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(", ");
    html += `<div class="row ${can?'':'locked'}"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
      `<span>${r.name} <span class="sub">${ingStr} · +${r.energy}e · sells ${r.sell}g</span></span></span>` +
      `<button ${can?'':'disabled'} onclick="cookRecipe(${i})">cook</button></div>`;
  });
  b.innerHTML = html; hydrateIcons(b);
}
function hydrateIcons(root){
  root.querySelectorAll("[data-icon]").forEach(el => {
    const c = el.querySelector("canvas"); if(!c) return;
    const s = spr[el.dataset.icon]; if(!s) return;
    c.width = s.width; c.height = s.height; c.getContext("2d").drawImage(s,0,0);
  });
}

// ---- settings ----
// ---- HUD visibility preference (v4.0.2) ----
// The overlay HUD (clock, gold, energy/Resolve bars, XP orbs, quest tracker, toasts) sits over the
// game view, so near a map edge or corner — where the camera clamps and real map content reaches the
// screen edge — it hides that content. This lets the player DIM it (see the map through it) or HIDE it
// entirely, from Settings or the U key. A display preference, persisted to localStorage like audio —
// not in the save file, so it follows the device, not the farm. Governs #hud's --hud-op custom
// property only; the hotbar, dialogue and banners live outside #hud and stay fully crisp.
const HUDPREF = { on:true, opacity:1 };
(function loadHudPrefs(){
  try{ const p = JSON.parse(localStorage.getItem("hs_hud")); if(p){
    if(typeof p.on === "boolean") HUDPREF.on = p.on;
    if(typeof p.op === "number") HUDPREF.opacity = clamp(p.op, 0, 1);
  }}catch(e){}
})();
function saveHudPrefs(){ try{ localStorage.setItem("hs_hud", JSON.stringify({ on:HUDPREF.on, op:HUDPREF.opacity })); }catch(e){} }
function applyHud(){ const h = $("hud"); if(h) h.style.setProperty("--hud-op", HUDPREF.on ? HUDPREF.opacity : 0); }
function setHudOn(on){ HUDPREF.on = on; saveHudPrefs(); applyHud(); }
function setHudOpacity(v){ HUDPREF.opacity = clamp(v, 0, 1); HUDPREF.on = true; saveHudPrefs(); applyHud(); }   // dragging the dimmer implies you want it shown
function toggleHud(){
  HUDPREF.on = !HUDPREF.on; saveHudPrefs(); applyHud();
  // the confirmation can't live in #hud (we may have just hidden it), so use the banner — it's outside #hud.
  banner(HUDPREF.on ? "◔ HUD shown" : "◔ HUD hidden", "Toggle with U · or Settings ▸ Heads-up display");
  playSfx("select");
}
function renderSettings(){
  const b = $("settingsPanel").querySelector(".body");
  b.innerHTML =
    `<div class="setRow"><span>Music</span>` +
      `<button class="dangerBtn" id="setMusicOn" style="min-width:3em;background:${SND.musicOn?"#3d5a2e":"#332e2b"};border-color:${SND.musicOn?"#6a8f52":"#544d48"};color:${SND.musicOn?"#eaffd8":"#a89f98"};">${SND.musicOn?"On":"Off"}</button>` +
      `<input type="range" id="setMusic" min="0" max="100" value="${Math.round(SND.musicVol*100)}">` +
      `<span class="val">${Math.round(SND.musicVol*100)}</span></div>` +
    `<div class="setRow"><span>Sound FX</span>` +
      `<button class="dangerBtn" id="setSfxOn" style="min-width:3em;background:${SND.sfxOn?"#3d5a2e":"#332e2b"};border-color:${SND.sfxOn?"#6a8f52":"#544d48"};color:${SND.sfxOn?"#eaffd8":"#a89f98"};">${SND.sfxOn?"On":"Off"}</button>` +
      `<input type="range" id="setSfx" min="0" max="100" value="${Math.round(SND.sfxVol*100)}">` +
      `<span class="val">${Math.round(SND.sfxVol*100)}</span></div>` +
    // v4.0.2: Heads-up display — On/Off toggle + a dimmer, so the HUD never has to block the map's
    // edges & corners. Slider floors at 20% (fully hidden is the toggle's / the U key's job).
    `<div class="setRow"><span>Heads-up display</span>` +
      `<button class="dangerBtn" id="setHudOn" style="min-width:3em;background:${HUDPREF.on?"#3d5a2e":"#332e2b"};border-color:${HUDPREF.on?"#6a8f52":"#544d48"};color:${HUDPREF.on?"#eaffd8":"#a89f98"};">${HUDPREF.on?"On":"Off"}</button>` +
      `<input type="range" id="setHud" min="20" max="100" value="${Math.round(HUDPREF.opacity*100)}">` +
      `<span class="val">${Math.round(HUDPREF.opacity*100)}</span></div>` +
    `<div class="setRow"><span></span><span style="color:var(--ink-soft);font-size:.8em;">Dim or hide the on-screen display so it doesn't cover the map. Toggle any time with <b>U</b>.</span></div>` +
    `<div class="setRow"><span>How to play</span><button class="dangerBtn" id="setHelp" style="background:#3a4a30;border-color:#6a8f52;color:#eaffd8;">Read the guide</button></div>` +
    `<div class="setRow"><span>Save</span><span style="color:var(--ink-soft);font-size:.85em;">auto-saves each night</span></div>` +
    `<div class="setRow"><span>Version</span><button class="dangerBtn" id="setNews" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">v${VERSION.name} — What's New</button></div>` +
    `<div class="setRow"><span>Danger zone</span><button class="dangerBtn" id="setWipe">Delete Save &amp; Restart</button></div>` +
    `<div style="margin-top:.5em;color:var(--ink-soft);font-size:.82em;text-align:center;">Harvestscape v${VERSION.name} — a tiny cozy world, made in code.</div>`;
  const mus = $("setMusic"), sfx = $("setSfx");
  mus.oninput = () => { setMusicVol(mus.value/100); mus.nextElementSibling.textContent = mus.value; };
  sfx.oninput = () => { setSfxVol(sfx.value/100); sfx.nextElementSibling.textContent = sfx.value; };
  sfx.onchange = () => playSfx("select");
  $("setMusicOn").onclick = () => { setMusicOn(!SND.musicOn); renderSettings(); };
  $("setSfxOn").onclick = () => { setSfxOn(!SND.sfxOn); if(SND.sfxOn) playSfx("select"); renderSettings(); };
  const hud = $("setHud");
  hud.oninput = () => { setHudOpacity(hud.value/100); hud.nextElementSibling.textContent = hud.value; };
  $("setHudOn").onclick = () => { setHudOn(!HUDPREF.on); playSfx("select"); renderSettings(); };
  $("setHelp").onclick = () => { closeAllPanels(); openLetter("❔ How to Play", HOWTO_TEXT); };
  $("setNews").onclick = () => openPanel("newsPanel", renderNews);
  $("setWipe").onclick = () => { if(confirm("Delete your save and restart from the title?")){ wipeSave(); location.reload(); } };
}

// The "What's New" / version-history panel — the player-facing mirror of CHANGELOG.md.
function renderNews(){
  const b = $("newsPanel").querySelector(".body");
  const TAG = { new:["NEW","#8fd06a"], change:["CHANGED","#e0b04a"], balance:["BALANCE","#6ab0d0"],
                polish:["POLISH","#c090d0"], fix:["FIX","#d08a6a"] };
  let html = `<div class="newsHead">Harvestscape v${VERSION.name}${VERSION.codename ? ` · “${escapeHtml(VERSION.codename)}”` : ""}</div>`;
  for(const rel of CHANGELOG){
    html += `<div class="newsRel"><span class="newsVer">v${rel.v}</span>` +
            `<span class="newsName">${escapeHtml(rel.name || "")}</span>` +
            `<span class="newsDate">${escapeHtml(rel.date || "")}</span></div>`;
    html += `<ul class="newsList">`;
    for(const n of (rel.notes || [])){
      const [lbl, col] = TAG[n.t] || [String(n.t).toUpperCase(), "#b9a98a"];
      html += `<li><span class="newsTag" style="background:${col};">${lbl}</span><span>${escapeHtml(n.s)}</span></li>`;
    }
    html += `</ul>`;
  }
  b.innerHTML = html;
  b.scrollTop = 0;
}
// Show What's New automatically the first time a player opens a build newer than they've seen.
function maybeShowWhatsNew(){
  let seen = 0;
  try { seen = +(localStorage.getItem("hs_seen_version") || 0); } catch(e){}
  if(seen && seen < VERSION.code){ openPanel("newsPanel", renderNews); }
  try { localStorage.setItem("hs_seen_version", VERSION.code); } catch(e){}
}

// ---- fade / sleep ----
function fadeTo(on, cb){ const f = $("fade"); if(on) f.classList.add("on"); else f.classList.remove("on"); if(cb) setTimeout(cb, 640); }
function showSleepCard(s){
  const card = $("sleepCard"); card.classList.remove("hidden");
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4], d = ((state.day-1)%SEASON_DAYS)+1;
  const seasonIcon = { Spring:"🌸", Summer:"☀", Fall:"🍂", Winter:"❄" };
  $("scTitle").textContent = (s.season ? seasonIcon[s.season]+" " : "") + seas + " · Day " + d;
  const w = weatherInfo(s.weather || state.weather);
  $("scSub").textContent = s.season ? `${s.season} has come to Willowbrook.` : w.line;
  const list = $("scList"); list.innerHTML = "";
  const lines = [];
  if(s.wrack) lines.push(`🐚 The storm has thrown wrack up the beach`);
  lines.push(`${w.icon} ${w.offer}`);
  if(s.fruited) lines.push(`🍎 ${s.fruited} tree${s.fruited>1?"s":""} bore fruit`);
  if(s.honeyed) lines.push(`🍯 ${s.honeyed} hive${s.honeyed>1?"s":""} filled with honey`);
  if(s.cellared) lines.push(`🛠 ${s.cellared} workshop batch${s.cellared>1?"es":""} finished overnight`);
  if(s.grew) lines.push(`🌱 ${s.grew} crop${s.grew>1?"s":""} grew overnight`);
  if(s.ready) lines.push(`✔ ${s.ready} ready to harvest`);
  if(s.withered) lines.push(`🥀 ${s.withered} crop${s.withered>1?"s":""} withered with the season`);
  if(s.spouse) lines.push(`💕 ${spouseName()} watered ${s.spouse} crop${s.spouse>1?"s":""} for you`);
  if(s.built) for(const p of s.built) lines.push(`🔨 ${p.done}`);
  if(s.forecast) lines.push(`${weatherInfo(s.forecast).icon} Tomorrow: ${weatherInfo(s.forecast).name}`);
  // The calendar cue that used to nag from the top bar all week now lands here, once, warmly — and
  // only when it's actually the day or its eve. A friendly invitation, never an obligation.
  const ev = (typeof nextEvent === "function") ? nextEvent() : null;
  if(ev && ev.daysAway <= 1){
    const icon = ev.kind === "birthday" ? "🎂" : "✦";
    if(ev.daysAway === 0)
      lines.push(ev.kind === "birthday"
        ? `${icon} ${ev.name} is today — a small gift means a lot`
        : `${icon} ${ev.name} is today, down on the coast`);
    else
      lines.push(`${icon} ${ev.name} is tomorrow`);
  }
  // the morning names the mission — every day starts with the story's thread in hand
  if(state.questIdx < QUESTS.length){
    const t = trackerData();
    if(t) lines.push(t.reportTo ? `✒ ${t.reportTo} is waiting to hear from you` : `✒ The story waits: ${t.title}`);
  }
  lines.push("☕ Energy restored");
  lines.push("💾 Progress saved");
  lines.forEach((t,i) => { const li = document.createElement("li"); li.textContent = t; li.style.animationDelay = (i*0.28+0.3)+"s"; list.appendChild(li); });
  playSfx("wake");
  setTimeout(() => {
    card.classList.add("hidden");
    sleeping = false;
    // never unpause into an active cutscene/festival (belt-and-suspenders with doSleep's guard)
    if(!isCutscene() && !state.flags.festivalActive){ fadeTo(false); paused = false; }
    refreshHUD(); refreshHotbar(); refreshQuestTracker();
    if(s.rain) queuePage(6, 800);                              // "On Rain"
    catchUpPages();                                            // re-offer any page that never landed
    setTimeout(maybeLastPage, 1400);                           // the letter under the door
  }, 2700);
}

// ---- controls hint ----
function setControlsHint(){
  // Line 1 = left-hand world verbs (all reachable without leaving WASD); line 2 = right-hand menus.
  $("controlsHint").innerHTML =
    `<b>Move</b> <kbd>WASD</kbd> · <b>Use tool</b> <kbd>Space</kbd> · <b>Interact / harvest / talk</b> <kbd>E</kbd> · <b>Examine</b> <kbd>Q</kbd> · <b>Cycle seeds</b> <kbd>R</kbd> · <b>Eat</b> <kbd>F</kbd> · <b>Gift Maya</b> <kbd>G</kbd> · <b>Guard</b> <kbd>Shift</kbd> <span style="opacity:.7">(in the Undercroft)</span><br>` +
    `<b>Skills</b> <kbd>K</kbd> · <b>Backpack</b> <kbd>I</kbd> · <b>Journal</b> <kbd>J</kbd> · <b>Ride</b> <kbd>H</kbd> · <b>Hide HUD</b> <kbd>U</kbd> · slots <kbd>1</kbd>–<kbd>6</kbd> · Enter buildings, the mine &amp; the coast · <b>Sleep</b> in your bed indoors`;
}

// ---- INPUT ----
function firstGesture(){ audioResume(); }
document.addEventListener("keydown", e => {
  // v3.40: typing in a quantity box must never drive the game (hotbar digits, tool keys, WASD) —
  // but Escape BLURS the box (review fix: swallowing it left the primary close key silently dead
  // while a box had focus; blur first, and the next Escape closes the panel as ever).
  if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")){
    if(e.key === "Escape") e.target.blur();
    return;
  }
  const k = e.key.toLowerCase();
  firstGesture();
  if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if(gameMode === "intro"){
    if(letterScrollKey(k)){ e.preventDefault(); return; }
    if(k===" " || k==="enter" || k==="e"){ e.preventDefault();
      if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } }
    return;
  }
  if(gameMode === "title"){
    // if the How-to-Play overlay is up, let Enter dismiss it, not launch the game
    if(!$("intro").classList.contains("hidden")){
      if(letterScrollKey(k)){ e.preventDefault(); return; }
      if(k==="enter" || k==="e" || k===" "){ e.preventDefault(); $("btnLetterNext").click(); }
      return;
    }
    if(k==="enter"){ e.preventDefault(); if(hasSave()) continueGame(); else startNewGame(); }
    return;
  }
  // a letter overlay (used mid-game) takes priority
  if(!$("intro").classList.contains("hidden")){
    if(letterScrollKey(k)){ e.preventDefault(); return; }
    if(k==="e" || k===" " || k==="enter"){ e.preventDefault();
      if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } }
    return;
  }
  // cutscenes take priority
  if(isCutscene()){ if(k==="e" || k===" " || k==="enter"){ e.preventDefault(); cutsceneAdvance(); } return; }
  if(e.repeat){ keys[k] = true; return; }
  keys[k] = true;

  // Verb-key layout convention: LEFT hand (on WASD) owns the world verbs — E interact, Space use,
  // Q examine, R seeds, F eat, G gift — and the RIGHT hand owns the menus (K/I/J/P, slots 1–6). Any
  // NEW verb should land on a spare left-hand finger (Q/ring, Tab/pinky, or a Space-modifier) rather
  // than a fifth key under the index finger. Examine used to live only on X (bottom row, two rows
  // under S) which pulled the whole hand off the movement keys — Q sits directly above A and keeps it.
  if(k === "e"){ if(advanceDialog()) return; if(anyPanelOpen()){ closeAllPanels(); return; } interact(); }
  else if(k === " "){
    if(fishing.state === "reel"){ /* held — updateReel reads keys[" "] */ }
    else if(fishing.state !== "idle") reelOrCatch();
    else if(!uiBlocking()) useTool();
  }
  else if(k === "k") togglePanel("skillsPanel", renderSkills);
  else if(k === "i") togglePanel("invPanel", renderInv);
  else if(k === "j") togglePanel("questPanel", renderJournal);
  else if(k === "p" || k === "o") togglePanel("settingsPanel", renderSettings);
  else if(k === "r"){ if(!uiBlocking()) cycleSeed(); }
  else if(k === "f"){ if(!uiBlocking()) eatFood(); }
  else if(k === "g"){ if(!uiBlocking()) giveGift(); }
  else if(k === "h"){ if(!uiBlocking()) rideToggle(); }   // v3.22: mount/dismount the horse
  else if(k === "q" || k === "x"){ examine(); }   // Q is the WASD-native primary; X kept as a legacy alias
  else if(k === "m"){ setMusicOn(!SND.musicOn); toast("Music "+(SND.musicOn?"on":"off")); }
  else if(k === "u"){ if(!uiBlocking()) toggleHud(); }   // v4.0.2: dim/hide the HUD off the map's edges & corners
  else if(k === "shift"){ if(!uiBlocking()) startGuard(); }   // v4.4: raise the Warden's Guard (also right-click in the Undercroft / the touch 🛡)
  else if(k === "escape"){ if(dlg.open) closeDialog(); else closeAllPanels(); }
  else if("1234567".includes(k)) selectSlot(+k-1);   // v4.0: 7th slot is the Stave (only present once earned)
});
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener("blur", () => { for(const kk in keys) keys[kk] = false; fishHold = false; });

// the quest tracker sits where the reel bar draws, so fade it out while you fight a fish
function setReelUI(on){ $("stage").classList.toggle("reeling", !!on); }

// mouse on canvas
cv.addEventListener("mousedown", e => {
  firstGesture();
  if(gameMode !== "play") return;
  e.preventDefault();
  if(!$("intro").classList.contains("hidden")) return;   // letter handles its own clicks
  if(isCutscene()){ cutsceneAdvance(); return; }
  if(e.button === 2){ if(inCombatMap()){ startGuard(); return; } interact(); return; }   // v4.4: right-click is the "shield click" in the Undercroft; interact everywhere else
  if(fishing.state === "reel") fishHold = true;          // held, not tapped
  else if(fishing.state !== "idle") reelOrCatch();
  else if(!uiBlocking()) useTool();
});
window.addEventListener("mouseup", () => { fishHold = false; });
cv.addEventListener("contextmenu", e => e.preventDefault());

// panel close buttons
document.querySelectorAll(".pclose").forEach(btn => {
  btn.onclick = () => { const p = btn.closest(".panel"); if(p) closePanel(p.id); };
});

// touch controls
function wireTouch(){
  if(!IS_TOUCH){ $("touchUI").classList.add("hidden"); return; }
  const setDir = (dir, on) => {
    const v = on ? 1 : 0;
    if(dir==="up") touchDir.y = on?-1:0;
    if(dir==="down") touchDir.y = on?1:0;
    if(dir==="left") touchDir.x = on?-1:0;
    if(dir==="right") touchDir.x = on?1:0;
  };
  $("dpad").querySelectorAll("button").forEach(btn => {
    const dir = btn.dataset.dir;
    const down = e => { e.preventDefault(); firstGesture(); setDir(dir,true); };
    const up = e => { e.preventDefault(); setDir(dir,false); };
    btn.addEventListener("pointerdown", down); btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up); btn.addEventListener("pointercancel", up);
  });
  const useBtn = $("btnUse");
  useBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(fishing.state === "reel") fishHold = true;        // hold USE to reel the fish in
    else if(fishing.state !== "idle") reelOrCatch();
    else if(!uiBlocking()) useTool(); });
  ["pointerup","pointerleave","pointercancel"].forEach(ev =>
    useBtn.addEventListener(ev, e => { e.preventDefault(); fishHold = false; }));
  $("btnAct").addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(!$("intro").classList.contains("hidden")){ if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } return; }
    if(isCutscene()){ cutsceneAdvance(); return; }
    closeTouchMenu();
    if(!advanceDialog()){ if(anyPanelOpen()) closeAllPanels(); else interact(); } });

  // the Look (examine) button — the touch parity for Q/X. examine() self-guards, so no extra checks.
  const lookBtn = $("btnLook");
  if(lookBtn) lookBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture(); examine(); });

  // v4.4 the Guard button — touch parity for Shift / right-click. startGuard() self-gates (Undercroft + Stave).
  const guardBtn = $("btnGuard");
  if(guardBtn) guardBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture(); startGuard(); });

  // Backpack / Journal / Skills / Settings have no key on a touch device — give them a menu.
  const RENDER = { invPanel:renderInv, questPanel:renderJournal, skillsPanel:renderSkills, settingsPanel:renderSettings };
  $("btnMenu").addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(isCutscene() || fishing.state === "reel") return;
    const m = $("touchMenu"); const opening = m.classList.contains("hidden");
    if(opening && anyPanelOpen()) closeAllPanels();
    m.classList.toggle("hidden"); playSfx(opening ? "menu" : "menuClose"); });
  $("touchMenu").querySelectorAll("button").forEach(b => {
    b.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
      closeTouchMenu(); const id = b.dataset.panel; togglePanel(id, RENDER[id]); });
  });
}
function closeTouchMenu(){ const m = $("touchMenu"); if(m) m.classList.add("hidden"); }

// Arrows / PageUp / PageDown / Home / End scroll a long letter instead of skipping it.
// Returns true when the key was consumed.
function letterScrollKey(k){
  const el = $("letterBody");
  if(!el || $("intro").classList.contains("hidden")) return false;
  const page = Math.max(40, el.clientHeight - 24);
  switch(k){
    case "arrowdown": el.scrollTop += 40; break;
    case "arrowup":   el.scrollTop -= 40; break;
    case "pagedown":  el.scrollTop += page; break;
    case "pageup":    el.scrollTop -= page; break;
    case "home":      el.scrollTop = 0; break;
    case "end":       el.scrollTop = el.scrollHeight; break;
    default: return false;
  }
  updateLetterFade();
  return true;
}

window.addEventListener("beforeunload", saveGame);
document.addEventListener("visibilitychange", () => { if(document.hidden && state) saveGame(); });
