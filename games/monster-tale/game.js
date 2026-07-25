'use strict';
/* ================================================================
   まものがたり 〜よみがえりし魔王〜  ゲームエンジン
   ================================================================ */

/* ---------- ユーティリティ ---------- */
const $ = s => document.querySelector(s);
const rnd = n => Math.floor(Math.random() * n);
const rrange = (a, b) => a + rnd(b - a + 1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const SAVE_KEY = 'mamonogatari_v1';

/* ---------- ゲーム状態 ---------- */
let G = null;
let busy = false;          // イベント実行中
let B = null;              // バトル状態
let animT = 0;             // グローバルフレームカウンタ
const TESTF = { forceRecruit: false };

function defaultState() {
  return {
    mode: 'title', name: 'ユウ',
    x: 8, y: 31, dir: 0, px: 8 * 16, py: 31 * 16,
    gold: 90, steps: 0, lastTown: 'T',
    weapon: 'w0', armor: 'a0',
    items: { yakusou: 4, oyatsu: 2 },
    flags: {}, talkIdx: {},
    party: [], reserve: [],
    set: { sound: true, fast: false },
  };
}

/* ---------- メンバー ---------- */
function statsOf(m) {
  const s = SPECIES[m.sp]; const l = m.lv - 1;
  const st = {
    hp: Math.floor(s.base[0] + s.grow[0] * l), mp: Math.floor(s.base[1] + s.grow[1] * l),
    atk: Math.floor(s.base[2] + s.grow[2] * l), def: Math.floor(s.base[3] + s.grow[3] * l),
    agi: Math.floor(s.base[4] + s.grow[4] * l),
  };
  if (m.sp === 'hero') { st.atk += GEAR[G.weapon].atk; st.def += GEAR[G.armor].def; }
  return st;
}
function recalc(m) { const st = statsOf(m); m.maxhp = st.hp; m.maxmp = st.mp; m.hp = clamp(m.hp, 0, st.hp); m.mp = clamp(m.mp, 0, st.mp); }
function newMember(sp, lv) {
  const m = { sp, name: SPECIES[sp].n, lv, exp: EXPT[lv] || 0, hp: 0, mp: 0, maxhp: 0, maxmp: 0 };
  recalc(m); m.hp = m.maxhp; m.mp = m.maxmp; return m;
}
function skillsOf(m) {
  const list = SPECIES[m.sp].skills.filter(([lv]) => lv <= m.lv).map(([, id]) => id);
  if (m.sp === 'hero') HERO_SPELLS.forEach(([lv, id]) => { if (lv <= m.lv) list.push(id); });
  return list;
}
function alivePt() { return G.party.filter(m => m.hp > 0); }

/* ---------- セーブ ---------- */
function save() { try { const g = Object.assign({}, G); delete g.mode; localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, g })); } catch (e) { } }
function loadData() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 1) return d.g; } catch (e) { } return null; }
function applyLoad(g) { G = Object.assign(defaultState(), g); G.mode = 'field'; G.party.forEach(recalc); G.reserve.forEach(recalc); }

/* ---------- サウンド ---------- */
const AU = {
  ctx: null, timer: null, cur: null, state: null, def: null,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  freq(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  tone(f, dur, wave, vol, when) {
    if (!this.ctx || !G || !G.set.sound) return;
    try {
      const t = when || this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = wave; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.03);
    } catch (e) { }
  },
  bgm(id) {
    if (this.cur === id) return;
    this.stop(); if (!id || !this.ctx) { this.cur = id; return; }
    this.cur = id; this.def = BGM[id];
    const base = this.ctx.currentTime + 0.08;
    this.state = this.def.tracks.map(() => ({ i: 0, t: base }));
    this.timer = setInterval(() => {
      if (!this.ctx || !G.set.sound) return;
      const now = this.ctx.currentTime;
      this.state.forEach((st, k) => {
        const tr = this.def.tracks[k];
        while (st.t < now + 0.25) {
          const [n, len] = tr.seq[st.i]; const dur = len * this.def.step;
          if (n) this.tone(this.freq(n), dur * 0.9, tr.wave, tr.vol, st.t);
          st.t += dur; st.i = (st.i + 1) % tr.seq.length;
        }
      });
    }, 60);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; },
  jingle(id) {
    this.stop(); if (!this.ctx) return;
    let t = this.ctx.currentTime + 0.05;
    JINGLE[id].forEach(([n, len]) => { const d = len * 0.13; if (n) this.tone(this.freq(n), d * 0.95, 'square', 0.045, t); t += d; });
  },
  sfx(id) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    switch (id) {
      case 'cur': this.tone(1150, 0.035, 'square', 0.03); break;
      case 'ok': this.tone(880, 0.05, 'square', 0.035); this.tone(1320, 0.05, 'square', 0.03, t + 0.05); break;
      case 'cancel': this.tone(500, 0.06, 'square', 0.03); break;
      case 'buzz': this.tone(150, 0.1, 'sawtooth', 0.04); break;
      case 'hit': this.tone(300, 0.05, 'sawtooth', 0.06); this.tone(150, 0.08, 'sawtooth', 0.05, t + 0.04); break;
      case 'crit': this.tone(400, 0.05, 'sawtooth', 0.07); this.tone(200, 0.06, 'sawtooth', 0.06, t + 0.04); this.tone(100, 0.1, 'sawtooth', 0.06, t + 0.09); break;
      case 'spell': this.tone(600, 0.06, 'sine', 0.05); this.tone(900, 0.06, 'sine', 0.05, t + 0.06); this.tone(1350, 0.09, 'sine', 0.05, t + 0.12); break;
      case 'heal': this.tone(780, 0.07, 'triangle', 0.06); this.tone(980, 0.07, 'triangle', 0.06, t + 0.07); this.tone(1180, 0.1, 'triangle', 0.06, t + 0.14); break;
      case 'run': for (let i = 0; i < 5; i++) this.tone(300 + i * 120, 0.04, 'square', 0.03, t + i * 0.04); break;
      case 'dead': this.tone(220, 0.12, 'sawtooth', 0.05); this.tone(110, 0.2, 'sawtooth', 0.05, t + 0.1); break;
      case 'encounter': this.tone(200, 0.07, 'square', 0.05); this.tone(280, 0.07, 'square', 0.05, t + 0.07); break;
      case 'step': break;
    }
  },
};
const sfx = id => AU.sfx(id);
const bgm = id => AU.bgm(id);

/* ---------- スプライト/タイル キャッシュ ---------- */
const SPRC = {};
function buildSprite(def) {
  const rows = def.px; const h = rows.length;
  const half = rows[0].length; const w = def.mirror ? half * 2 : half;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x2 = c.getContext('2d');
  const wc = document.createElement('canvas'); wc.width = w; wc.height = h;
  const wx = wc.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = (def.mirror && x >= half) ? (w - 1 - x) : x;
    const ch = rows[y][sx]; if (!ch || ch === '.') continue;
    const col = def.pal[ch]; if (!col) continue;
    x2.fillStyle = col; x2.fillRect(x, y, 1, 1);
    wx.fillStyle = '#ffffff'; wx.fillRect(x, y, 1, 1);
  }
  return { c, w: wc, pw: w, ph: h };
}
const TILEC = {};
function buildTiles() {
  const mk = () => { const c = document.createElement('canvas'); c.width = 16; c.height = 16; return [c, c.getContext('2d')]; };
  const speck = (x2, base, dots) => {
    x2.fillStyle = base; x2.fillRect(0, 0, 16, 16);
    dots.forEach(([px, py, col]) => { x2.fillStyle = col; x2.fillRect(px, py, 2, 1); });
  };
  const grassD = [[1, 2, '#4a9c46'], [6, 5, '#4a9c46'], [12, 3, '#4a9c46'], [3, 9, '#6cc465'], [9, 11, '#4a9c46'], [13, 13, '#6cc465'], [5, 14, '#4a9c46'], [10, 7, '#6cc465']];
  const mkBase = (base, dots) => { const [c, x2] = mk(); speck(x2, base, dots); return c; };
  const grass = () => mkBase('#58b452', grassD);
  const sand = () => mkBase('#e2cf8e', [[2, 3, '#cbb474'], [8, 6, '#cbb474'], [12, 2, '#f0e0a8'], [4, 11, '#cbb474'], [10, 13, '#f0e0a8'], [14, 9, '#cbb474']]);
  const swamp = () => mkBase('#6b5a8c', [[2, 2, '#7e6ba0'], [9, 5, '#57486f'], [13, 10, '#7e6ba0'], [5, 8, '#9a86bc'], [3, 13, '#57486f'], [11, 14, '#9a86bc']]);
  const road = () => mkBase('#cfa96b', [[3, 4, '#b8935a'], [10, 2, '#b8935a'], [6, 9, '#e2c288'], [13, 12, '#b8935a'], [2, 13, '#b8935a']]);
  const water = f => { const [c, x2] = mk(); x2.fillStyle = '#2e6ed0'; x2.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 3; i++) { const y = 2 + i * 5 + (f ? 1 : 0); const off = (i * 5 + (f ? 3 : 0)) % 8;
      x2.fillStyle = '#6aa2ee'; x2.fillRect(off, y, 4, 1); x2.fillStyle = '#2456a8'; x2.fillRect((off + 8) % 14, y + 2, 4, 1); }
    return c; };
  const over = (bc, fn) => { const x2 = bc.getContext('2d'); fn(x2); return bc; };
  const tree = x2 => { x2.fillStyle = OUTLINE; x2.fillRect(4, 1, 8, 1); x2.fillRect(2, 2, 2, 8); x2.fillRect(12, 2, 2, 8);
    x2.fillStyle = '#2e7d32'; x2.fillRect(4, 2, 8, 8); x2.fillStyle = '#48a04c'; x2.fillRect(5, 3, 3, 2); x2.fillRect(9, 5, 2, 2);
    x2.fillStyle = OUTLINE; x2.fillRect(4, 10, 8, 1); x2.fillStyle = '#7a5230'; x2.fillRect(7, 10, 3, 5); x2.fillStyle = OUTLINE; x2.fillRect(6, 10, 1, 5); x2.fillRect(10, 10, 1, 5); };
  const mtn = x2 => { x2.fillStyle = OUTLINE; x2.fillRect(7, 2, 2, 1);
    x2.fillStyle = '#8d8577'; for (let i = 0; i < 11; i++) { const w2 = 2 + i; x2.fillRect(8 - Math.ceil(w2 / 2), 3 + i, w2 + 2, 1); }
    x2.fillStyle = '#6e685c'; for (let i = 3; i < 11; i++) x2.fillRect(9 + Math.floor(i / 2), 3 + i, 2, 1);
    x2.fillStyle = '#c8c2b4'; x2.fillRect(7, 3, 2, 2); x2.fillRect(6, 5, 2, 1); };
  const house = (x2, roof) => { x2.fillStyle = OUTLINE; x2.fillRect(2, 6, 12, 1);
    x2.fillStyle = roof; for (let i = 0; i < 4; i++) x2.fillRect(7 - i - i, 2 + i, 2 + i * 4, 1); x2.fillRect(2, 6, 12, 1);
    x2.fillStyle = '#f0e2c8'; x2.fillRect(3, 7, 10, 7); x2.fillStyle = OUTLINE; x2.fillRect(2, 7, 1, 7); x2.fillRect(13, 7, 1, 7); x2.fillRect(2, 14, 12, 1);
    x2.fillStyle = '#6a4a2e'; x2.fillRect(6, 9, 4, 5); x2.fillStyle = OUTLINE; x2.fillRect(4, 9, 1, 1); x2.fillRect(11, 9, 1, 1); };
  const tent = x2 => { x2.fillStyle = '#e08838'; for (let i = 0; i < 9; i++) x2.fillRect(8 - Math.ceil(i * 0.7), 4 + i, Math.ceil(i * 1.4) + 1, 1);
    x2.fillStyle = OUTLINE; x2.fillRect(7, 3, 2, 1); x2.fillStyle = '#8a4f1e'; x2.fillRect(6, 9, 4, 4); x2.fillStyle = '#f0a858'; x2.fillRect(4, 6, 2, 6); };
  const caveArch = x2 => { x2.fillStyle = '#100c18'; x2.fillRect(5, 8, 6, 6); x2.fillRect(6, 6, 4, 2); x2.fillStyle = '#302840'; x2.fillRect(5, 7, 1, 1); x2.fillRect(10, 7, 1, 1); };
  const castle = () => { const [c, x2] = mk(); x2.fillStyle = '#38304a'; x2.fillRect(0, 0, 16, 16);
    x2.fillStyle = '#5a5468'; x2.fillRect(1, 4, 4, 11); x2.fillRect(11, 4, 4, 11); x2.fillRect(4, 7, 8, 8);
    x2.fillStyle = '#726c84'; x2.fillRect(1, 4, 1, 11); x2.fillRect(11, 4, 1, 11);
    x2.fillStyle = '#5a5468'; x2.fillRect(1, 2, 1, 2); x2.fillRect(3, 2, 1, 2); x2.fillRect(12, 2, 1, 2); x2.fillRect(14, 2, 1, 2); x2.fillRect(6, 5, 1, 2); x2.fillRect(9, 5, 1, 2); x2.fillRect(4, 5, 8, 2);
    x2.fillStyle = '#b048d0'; x2.fillRect(2, 6, 1, 2); x2.fillRect(13, 6, 1, 2);
    x2.fillStyle = '#2a1f38'; x2.fillRect(6, 10, 4, 5); x2.fillStyle = '#b048d0'; x2.fillRect(7, 8, 2, 1); return c; };
  const bridge = x2 => { x2.fillStyle = '#a07040'; x2.fillRect(0, 2, 16, 12); x2.fillStyle = '#7a5230';
    for (let i = 0; i < 4; i++) x2.fillRect(0, 4 + i * 3, 16, 1); x2.fillStyle = OUTLINE; x2.fillRect(0, 2, 16, 1); x2.fillRect(0, 13, 16, 1); };
  TILEC.g = [grass()]; TILEC.s = [sand()]; TILEC.p = [swamp()]; TILEC.r = [road()];
  TILEC.w = [water(0), water(1)];
  TILEC.f = [over(grass(), tree)]; TILEC.m = [over(grass(), mtn)];
  TILEC.T = [over(grass(), x2 => house(x2, '#c04838'))];
  TILEC.P = [over(grass(), x2 => house(x2, '#3868c0'))];
  TILEC.C = [over(grass(), tent)];
  TILEC.D = [over(over(grass(), mtn), caveArch)];
  TILEC.X = [castle()];
  TILEC.b = [over(water(0), bridge)];
  const bs = over(water(0), bridge); bs.getContext('2d').drawImage(SPRC.guard.c, 0, 0);
  TILEC.B = [bs];
}

/* ---------- 画面サイズ ---------- */
const cv = () => $('#cv');
let CTX = null;
function fit() {
  let sw;
  if (window.innerWidth > window.innerHeight * 1.35) {
    sw = Math.min(window.innerHeight * 256 / 192 * 0.96, window.innerWidth - 240, 620);
  } else {
    const padH = Math.max(170, Math.min(window.innerHeight * 0.30, 250));
    const availH = window.innerHeight - padH - 8;
    sw = Math.min(window.innerWidth, availH * 256 / 192, 620);
  }
  sw = Math.max(sw, 220);
  document.documentElement.style.setProperty('--sw', sw + 'px');
  document.documentElement.style.setProperty('--sh', (sw * 192 / 256) + 'px');
  document.documentElement.style.setProperty('--u', (sw / 256) + 'px');
}

/* ---------- UIスタック / 入力 ---------- */
const UI = {
  stack: [],
  push(h) { this.stack.push(h); },
  pop() { return this.stack.pop(); },
  top() { return this.stack[this.stack.length - 1]; },
};
function dispatch(act, data) {
  const t = UI.top();
  if (t) { t(act, data); return; }
  if (G && G.mode === 'field' && !busy) {
    if (act === 'B') runEvent(fieldMenu);
    else if (act === 'A') {
      const ch = tileAt(G.x, G.y);
      if (ch === 'T' || ch === 'P' || ch === 'C') runEvent(() => townEvent(ch));
      else if (ch === 'D') runEvent(caveEvent);
      else if (ch === 'X') runEvent(castleEvent);
    }
  }
}
const HELD = { up: false, down: false, left: false, right: false };
function bindControls() {
  document.querySelectorAll('.db').forEach(b => {
    const act = b.dataset.a; let rep = null;
    const down = e => { e.preventDefault(); AU.init(); HELD[act] = true; dispatch(act);
      clearInterval(rep); let first = true;
      rep = setInterval(() => { if (UI.top()) dispatch(act); }, first ? 240 : 240); };
    const up = e => { e.preventDefault(); HELD[act] = false; clearInterval(rep); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
  const bindAB = (id, act) => { const b = $(id); let rep = null;
    b.addEventListener('pointerdown', e => { e.preventDefault(); AU.init(); dispatch(act);
      clearInterval(rep); rep = setInterval(() => { if (UI.top()) dispatch(act); }, 260); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => clearInterval(rep))); };
  bindAB('#btnA', 'A'); bindAB('#btnB', 'B');
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', z: 'A', Z: 'A', Enter: 'A', ' ': 'A', x: 'B', X: 'B', Escape: 'B' };
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      if (e.key === 'Enter') { e.preventDefault(); const ok = $('#nameOk'); if (ok && $('#namein').classList.contains('on')) ok.dispatchEvent(new Event('pointerdown')); }
      return;
    }
    const act = KEYS[e.key]; if (!act) return; e.preventDefault(); AU.init();
    if (['up', 'down', 'left', 'right'].includes(act)) { if (!e.repeat) { HELD[act] = true; dispatch(act); } else if (UI.top()) dispatch(act); }
    else if (!e.repeat || UI.top()) dispatch(act);
  });
  window.addEventListener('keyup', e => { const act = KEYS[e.key]; if (act && HELD[act] !== undefined) HELD[act] = false; });
  $('#screen').addEventListener('pointerdown', e => {
    if (e.target.closest('.menu') || e.target.closest('#namein')) return;
    e.preventDefault(); AU.init();
    const r = cv().getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 256, y = (e.clientY - r.top) / r.height * 192;
    const t = UI.top(); if (t) t('tap', { x, y });
  });
  window.addEventListener('resize', fit);
  document.addEventListener('gesturestart', e => e.preventDefault());
}

/* ---------- ウィンドウ ---------- */
function showMsgWin() { $('#msgwin').classList.add('on'); }
function hideMsgWin() { $('#msgwin').classList.remove('on'); $('#msgtext').textContent = ''; }
function say(text, opts = {}) {
  return new Promise(res => {
    showMsgWin();
    const mt = $('#msgtext'), cur = $('#msgcur');
    mt.textContent = ''; cur.style.display = 'none';
    const speed = G.set.fast ? 11 : 24;
    let i = 0, typed = false, finished = false, autoT = null;
    const timer = setInterval(() => { i++; mt.textContent = text.slice(0, i); if (i >= text.length) doneTyping(); }, speed);
    function doneTyping() {
      if (typed) return; typed = true; clearInterval(timer); mt.textContent = text;
      cur.style.display = 'block';
      if (opts.auto) autoT = setTimeout(finish, opts.wait || 620);
    }
    function finish() {
      if (finished) return; finished = true;
      clearTimeout(autoT); clearInterval(timer); UI.pop(); cur.style.display = 'none';
      res();
    }
    UI.push(act => {
      if (act === 'A' || act === 'tap' || act === 'B') { if (!typed) doneTyping(); else finish(); }
    });
  });
}
function menuWin(items, opts = {}) {
  return new Promise(res => {
    const win = el('div', 'win menu ' + (opts.cls || ''));
    if (opts.title) win.appendChild(el('div', 'wtitle', '')).textContent = opts.title;
    const list = el('div', 'wlist'); win.appendChild(list);
    let idx = opts.idx || 0;
    if (items[idx] && items[idx].dis) idx = Math.max(0, items.findIndex(it => !it.dis));
    const rows = items.map((it, i) => {
      const r = el('div', 'row' + (it.dis ? ' dis' : ''));
      const c = el('span', 'cur', '▶'); const lab = el('span', 'lab'); lab.textContent = it.t;
      r.appendChild(c); r.appendChild(lab);
      if (it.r !== undefined) { const rv = el('span', 'rval'); rv.textContent = it.r; r.appendChild(rv); }
      r.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init();
        if (it.dis) { sfx('buzz'); return; } idx = i; paint(); choose(); });
      list.appendChild(r); return r;
    });
    const paint = () => rows.forEach((r, i) => r.classList.toggle('sel', i === idx));
    const move = d => { if (!items.length) return; let n = idx;
      for (let k = 0; k < items.length; k++) { n = (n + d + items.length) % items.length; if (!items[n].dis) break; }
      idx = n; sfx('cur'); paint(); };
    const choose = () => { const it = items[idx]; if (!it || it.dis) { sfx('buzz'); return; } sfx('ok'); close(it.v !== undefined ? it.v : idx); };
    const close = v => { UI.pop(); win.remove(); res(v); };
    UI.push(act => {
      if (act === 'up') move(-1); else if (act === 'down') move(1);
      else if (act === 'A') choose();
      else if (act === 'B') { if (opts.cancel === false) { sfx('buzz'); } else { sfx('cancel'); close(-1); } }
    });
    paint(); $('#menus').appendChild(win);
  });
}
async function askYN(q, opts = {}) {
  if (q) await say(q);
  const v = await menuWin([{ t: 'はい' }, { t: 'いいえ' }], { cls: 'yn', idx: opts.idx || 0 });
  return v === 0;
}
function infoWin(html, cls) { const w = el('div', 'win ' + (cls || 'stat'), html); $('#menus').appendChild(w); return w; }
function waitAB() { return new Promise(res => { UI.push(act => { if (act === 'A' || act === 'B' || act === 'tap') { UI.pop(); res(); } }); }); }

/* ---------- パーティHUD ---------- */
function hudShow() { $('#hud').classList.add('on'); updateParty(); }
function hudHide() { $('#hud').classList.remove('on'); }
function updateParty(selIdx = -1) {
  const h = $('#hud'); if (!h.classList.contains('on')) return;
  h.innerHTML = '';
  G.party.forEach((m, i) => {
    const chip = el('div', 'chip' + (i === selIdx ? ' sel' : '') + (m.hp <= 0 ? ' dead' : ''));
    const st = m._b || {};
    chip.appendChild(el('div', 'cname', '')).textContent = m.name + (st.slp ? '💤' : st.poi ? '☠' : '');
    const hp = el('div', 'chp' + (m.hp <= m.maxhp / 4 ? ' low' : ''), ''); hp.textContent = 'HP ' + m.hp + '/' + m.maxhp;
    chip.appendChild(hp);
    chip.appendChild(el('div', 'cmp', '')).textContent = 'MP ' + m.mp;
    h.appendChild(chip);
  });
}
function shake() { const s = $('#screen'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
function flashWhite() { const f = $('#fade'); f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); }

/* ---------- マップ ---------- */
function tileAt(x, y) { if (x < 0 || y < 0 || x >= MW || y >= MH) return 'w'; return WORLD[y][x]; }
function passable(x, y) {
  const t = tileAt(x, y);
  if (t === 'w' || t === 'm') return false;
  if (t === 'B' && !G.flags.bridge) return 'bridge';
  return true;
}
function zoneAt(x, y) {
  for (const z of ZONES) { const [x1, y1, x2, y2] = z.r; if (x >= x1 && x <= x2 && y >= y1 && y <= y2) return z.t; }
  return 't1';
}
let stepsSince = 99;
const ENC_RATE = { g: 0.10, f: 0.12, s: 0.11, p: 0.13 };

/* ---------- フィールドループ ---------- */
let moveQ = null; // {tx,ty}
function fieldTick() {
  if (!G || G.mode !== 'field') return;
  if (moveQ) {
    const tx = moveQ.tx * 16, ty = moveQ.ty * 16;
    G.px += Math.sign(tx - G.px) * 2; G.py += Math.sign(ty - G.py) * 2;
    if (G.px === tx && G.py === ty) { G.x = moveQ.tx; G.y = moveQ.ty; moveQ = null; onStep(); }
    return;
  }
  if (busy || UI.top()) return;
  let dx = 0, dy = 0;
  if (HELD.up) { dy = -1; G.dir = 1; } else if (HELD.down) { dy = 1; G.dir = 0; }
  else if (HELD.left) { dx = -1; G.dir = 2; } else if (HELD.right) { dx = 1; G.dir = 3; }
  if (!dx && !dy) return;
  const nx = G.x + dx, ny = G.y + dy;
  const p = passable(nx, ny);
  if (p === 'bridge') { runEvent(bridgeEvent); return; }
  if (!p) return;
  moveQ = { tx: nx, ty: ny };
}
function onStep() {
  G.steps++; stepsSince++;
  const t = tileAt(G.x, G.y);
  if (t === 'T' || t === 'P' || t === 'C') { runEvent(() => townEvent(t)); return; }
  if (t === 'D') { runEvent(caveEvent); return; }
  if (t === 'X') { runEvent(castleEvent); return; }
  if (ENC_RATE[t] && stepsSince > 3 && Math.random() < ENC_RATE[t]) {
    stepsSince = 0;
    const z = zoneAt(G.x, G.y);
    runEvent(async () => {
      const r = await battle(makeTroop(z), { bg: ZONE_BG[z] });
      if (r === 'lose') await gameOver();
    });
  }
  if (G.steps % 30 === 0) save();
}
function runEvent(fn) {
  if (busy) return; busy = true;
  Promise.resolve().then(fn).catch(e => console.error(e)).finally(() => { busy = false; });
}

/* ---------- 描画 ---------- */
function render() {
  animT++;
  const x2 = CTX; if (!x2) return;
  x2.imageSmoothingEnabled = false;
  if (!G || G.mode === 'title') drawTitle(x2);
  else if (G.mode === 'battle') drawBattle(x2);
  else drawField(x2);
  requestAnimationFrame(render);
}
function drawField(x2) {
  const camX = clamp(G.px - 120, 0, MW * 16 - 256), camY = clamp(G.py - 88, 0, MH * 16 - 192);
  const wf = Math.floor(animT / 32) % 2;
  const x0 = Math.floor(camX / 16), y0 = Math.floor(camY / 16);
  for (let ty = y0; ty <= y0 + 12; ty++) for (let tx = x0; tx <= x0 + 16; tx++) {
    let ch = tileAt(tx, ty);
    if (ch === 'B' && G.flags.bridge) ch = 'b';
    const frames = TILEC[ch] || TILEC.g;
    x2.drawImage(frames[ch === 'w' ? wf : 0], tx * 16 - camX, ty * 16 - camY);
  }
  // 主人公
  let spr, flip = false;
  const wf2 = moveQ ? Math.floor(animT / 8) % 2 : 0;
  if (G.dir === 0) { spr = SPRC.heroD; flip = wf2 === 1; }
  else if (G.dir === 1) { spr = SPRC.heroU; flip = wf2 === 1; }
  else { spr = wf2 ? SPRC.heroS2 : SPRC.heroS1; flip = G.dir === 2; }
  const hx = G.px - camX, hy = G.py - camY - 2;
  x2.save();
  if (flip) { x2.translate(hx + 16, hy); x2.scale(-1, 1); x2.drawImage(spr.c, 0, 0); }
  else x2.drawImage(spr.c, hx, hy);
  x2.restore();
}
const BATTLE_BG = {
  plain: ['#8ec9e8', '#cfe8f4', '#4d9c48', '#58b452'],
  forest: ['#7ab8d8', '#c8e0d8', '#2e6d32', '#3a8140'],
  desert: ['#98c4e0', '#e8dcc0', '#c4a86a', '#d8c084'],
  swamp: ['#4a3a68', '#7a6898', '#4f3f6e', '#5d4b80'],
  cave: ['#241c30', '#38294a', '#4a3828', '#5a452f'],
  dark: ['#180f28', '#301a48', '#28203c', '#342a4e'],
};
function drawBattle(x2) {
  const [c1, c2, g1, g2] = BATTLE_BG[B.bg] || BATTLE_BG.plain;
  const gr = x2.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  x2.fillStyle = gr; x2.fillRect(0, 0, 256, 132);
  x2.fillStyle = g1; x2.fillRect(0, 118, 256, 74);
  x2.fillStyle = g2;
  x2.beginPath(); x2.ellipse(128, 128, 118, 22, 0, 0, Math.PI * 2); x2.fill();
  B.es.forEach((e, i) => {
    if (!e.alive) return;
    const spr = SPRC[SPECIES[e.sp].spr];
    const sc = e.scale;
    const bob = Math.round(Math.sin(animT / 18 + i * 1.7) * 1.5);
    const w = spr.pw * sc, h = spr.ph * sc;
    const dx = e.cx - w / 2, dy = e.baseY - h + bob;
    x2.drawImage(e.flash > 0 && (e.flash % 2 === 0) ? spr.w : spr.c, dx, dy, w, h);
    if (e.flash > 0) e.flash--;
    if (B.sel === i) {
      x2.fillStyle = '#f0c860';
      const ax = e.cx, ay = dy - 8 + Math.round(Math.sin(animT / 6) * 1.5);
      x2.beginPath(); x2.moveTo(ax - 5, ay); x2.lineTo(ax + 5, ay); x2.lineTo(ax, ay + 6); x2.fill();
    }
  });
  B.popups = B.popups.filter(p => p.t > 0);
  B.popups.forEach(p => {
    p.t--; p.y -= 0.7;
    x2.font = 'bold 11px monospace'; x2.textAlign = 'center';
    x2.fillStyle = '#1a1626'; x2.fillText(p.txt, p.x + 1, p.y + 1);
    x2.fillStyle = p.col; x2.fillText(p.txt, p.x, p.y);
  });
}
function drawTitle(x2) {
  const gr = x2.createLinearGradient(0, 0, 0, 192);
  gr.addColorStop(0, '#0b0d20'); gr.addColorStop(0.6, '#1c1440'); gr.addColorStop(1, '#302050');
  x2.fillStyle = gr; x2.fillRect(0, 0, 256, 192);
  for (let i = 0; i < 40; i++) { const sx = (i * 53) % 256, sy = (i * 37) % 110; x2.fillStyle = (i + Math.floor(animT / 40)) % 3 ? '#4a4470' : '#8a84c0'; x2.fillRect(sx, sy, 1, 1); }
  const m = SPRC.maou; const sc = 3;
  x2.drawImage(m.c, 128 - m.pw * sc / 2, 12, m.pw * sc, m.ph * sc);
  x2.textAlign = 'center';
  x2.font = 'bold 30px "Hiragino Kaku Gothic ProN", sans-serif';
  x2.fillStyle = '#1a1626'; x2.fillText('まものがたり', 130, 118);
  x2.fillStyle = '#f0c860'; x2.fillText('まものがたり', 128, 116);
  x2.font = 'bold 11px "Hiragino Kaku Gothic ProN", sans-serif';
  x2.fillStyle = '#d8d4f0'; x2.fillText('〜よみがえりし魔王〜', 128, 134);
  const marchers = ['heroD', 'puni', 'kino', 'bat', 'drak'];
  marchers.forEach((id, i) => {
    const s = SPRC[id]; const mx = 60 + i * 30, my = 152 + Math.round(Math.sin(animT / 14 + i) * 2);
    x2.drawImage(s.c, mx, my);
  });
}

/* ---------- トループ生成 ---------- */
function makeTroop(zone, forceN) {
  const tbl = ENC[zone]; const roll = rnd(100);
  let n = forceN || (roll < 35 ? 1 : roll < 80 ? 2 : 3);
  const troop = [];
  for (let i = 0; i < n; i++) {
    const tw = tbl.reduce((s, e) => s + e[3], 0); let r = rnd(tw);
    for (const [sp, l1, l2, w] of tbl) { r -= w; if (r < 0) { troop.push({ sp, lv: rrange(l1, l2) }); break; } }
  }
  troop.sort((a, b) => a.sp < b.sp ? -1 : 1);
  return troop;
}

/* ---------- バトル ---------- */
function mkEnemy(t, i, troop) {
  const s = SPECIES[t.sp]; const l = t.lv - 1;
  const dup = troop.filter(x => x.sp === t.sp).length > 1;
  const nth = troop.slice(0, i).filter(x => x.sp === t.sp).length;
  return {
    sp: t.sp, lv: t.lv, name: s.n + (dup ? 'ＡＢＣ'[nth] : ''),
    hp: Math.floor(s.base[0] + s.grow[0] * l), maxhp: Math.floor(s.base[0] + s.grow[0] * l),
    atk: Math.floor(s.base[2] + s.grow[2] * l), def: Math.floor(s.base[3] + s.grow[3] * l),
    agi: Math.floor(s.base[4] + s.grow[4] * l),
    alive: true, fled: false, slp: 0, poi: false, flash: 0,
    scale: s.big ? 4 : s.boss ? 4 : 3, cx: 0, baseY: 0,
  };
}
function layoutEnemies() {
  const n = B.es.length;
  const xs = n === 1 ? [128] : n === 2 ? [88, 168] : [58, 128, 198];
  B.es.forEach((e, i) => { e.cx = xs[i]; e.baseY = 126; });
}
async function battle(troop, opt = {}) {
  const prevMode = G.mode; G.mode = 'battle';
  B = { es: troop.map((t, i) => mkEnemy(t, i, troop)), bg: opt.bg || 'plain', boss: !!opt.boss, treat: false, sel: -1, popups: [], phase: 1 };
  layoutEnemies();
  G.party.forEach(m => m._b = { slp: 0, poi: false, def: false });
  sfx('encounter'); flashWhite(); await wait(260);
  bgm(opt.boss ? 'boss' : 'battle');
  hudShow();
  const names = [...new Set(B.es.map(e => SPECIES[e.sp].n))];
  await say(names.join('と ') + 'が あらわれた！', { auto: true, wait: 750 });
  let result = null;
  while (!result) {
    const input = await inputPhase();
    result = await resolvePhase(input);
  }
  if (result === 'win') await victoryFlow();
  if (result !== 'lose') {
    G.party.forEach(m => m._b = null);
    hudHide(); hideMsgWin(); B = null;
    G.mode = prevMode === 'battle' ? 'field' : prevMode;
    bgm('field'); save();
  }
  return result;
}
async function inputPhase() {
  const alive = alivePt();
  const acts = [];
  let i = 0;
  while (i < alive.length) {
    const m = alive[i];
    if (m._b.slp) { acts.push({ m, type: 'sleep' }); i++; continue; }
    updateParty(G.party.indexOf(m));
    const cmds = [
      { t: 'たたかう', v: 'atk' },
      { t: 'とくぎ', v: 'skill', dis: !skillsOf(m).length },
      { t: 'ぼうぎょ', v: 'def' },
      { t: 'どうぐ', v: 'item' },
      { t: 'にげる', v: 'run', dis: B.boss },
    ];
    const c = await menuWin(cmds, { cls: 'cmd', title: m.name, cancel: i > 0 });
    if (c === -1) { i--; acts.pop(); continue; }
    if (c === 'atk') {
      const t = await pickEnemy(); if (t === null) continue;
      acts.push({ m, type: 'atk', t }); i++;
    } else if (c === 'skill') {
      const sk = await pickSkill(m, true); if (!sk) continue;
      const def2 = SKILLS[sk];
      let t = null;
      if (def2.tgt === 'one') { t = await pickEnemy(); if (t === null) continue; }
      else if (def2.tgt === 'ally') { t = await pickAlly(def2.kind); if (t === null) continue; }
      acts.push({ m, type: 'skill', sk, t }); i++;
    } else if (c === 'def') { acts.push({ m, type: 'def' }); i++; }
    else if (c === 'item') {
      const r = await pickItemBattle(); if (!r) continue;
      acts.push(Object.assign({ m, type: 'item' }, r)); i++;
    } else if (c === 'run') return { run: true };
  }
  updateParty();
  return { acts };
}
function pickEnemy() {
  return new Promise(res => {
    const targets = B.es.map((e, i) => ({ e, i })).filter(o => o.e.alive);
    let k = 0; B.sel = targets[0].i;
    const done = v => { B.sel = -1; UI.pop(); res(v); };
    UI.push((act, data) => {
      if (act === 'left' || act === 'up') { k = (k - 1 + targets.length) % targets.length; B.sel = targets[k].i; sfx('cur'); }
      else if (act === 'right' || act === 'down') { k = (k + 1) % targets.length; B.sel = targets[k].i; sfx('cur'); }
      else if (act === 'A') { sfx('ok'); done(targets[k].i); }
      else if (act === 'B') { sfx('cancel'); done(null); }
      else if (act === 'tap' && data) {
        let best = 0, bd = 1e9;
        targets.forEach((o, j) => { const d = Math.abs(o.e.cx - data.x); if (d < bd) { bd = d; best = j; } });
        k = best; B.sel = targets[k].i; sfx('ok'); done(targets[k].i);
      }
    });
  });
}
async function pickSkill(m, inBattle) {
  const list = skillsOf(m);
  const items = list.map(id => {
    const s = SKILLS[id];
    const usable = m.mp >= s.mp && (inBattle || s.kind === 'heal' || s.kind === 'revive');
    return { t: s.n, r: s.mp + 'MP', v: id, dis: !usable };
  });
  if (!items.length) return null;
  const v = await menuWin(items, { cls: 'cmd sub', title: 'とくぎ' });
  return v === -1 ? null : v;
}
async function pickAlly(kind) {
  const items = G.party.map((m, i) => ({
    t: m.name, r: 'HP' + m.hp, v: i,
    dis: kind === 'revive' ? m.hp > 0 : m.hp <= 0,
  }));
  if (items.every(it => it.dis)) { await say('つかえる あいてが いない！'); return null; }
  const v = await menuWin(items, { cls: 'cmd sub', title: 'だれに？' });
  return v === -1 ? null : v;
}
async function pickItemBattle() {
  const ids = Object.keys(G.items).filter(id => G.items[id] > 0 && ITEMS[id]);
  if (!ids.length) { await say('どうぐを もっていない！'); return null; }
  const v = await menuWin(ids.map(id => ({ t: ITEMS[id].n, r: '×' + G.items[id], v: id })), { cls: 'cmd sub', title: 'どうぐ' });
  if (v === -1) return null;
  const def = ITEMS[v];
  if (def.treat) return { it: v };
  const kind = def.revive ? 'revive' : 'heal';
  const t = await pickAlly(kind); if (t === null) return null;
  return { it: v, t };
}

/* --- ダメージ計算 --- */
function physDmg(atk, def, mult = 1) {
  const base = (atk * mult) / 2 - def / 4;
  if (base < 1) return rnd(2);
  return Math.max(0, Math.floor(base * (0.875 + Math.random() * 0.25)));
}
function popup(e, txt, col) { B.popups.push({ x: e.cx, y: e.baseY - e.scale * 8, txt: String(txt), col: col || '#ffffff', t: 40 }); }

async function dmgToEnemy(e, d, opts = {}) {
  e.hp -= d; e.flash = 8; popup(e, d, opts.col);
  sfx(opts.crit ? 'crit' : 'hit');
  await say(e.name + 'に ' + d + 'の ダメージ！', { auto: true, wait: 460 });
  if (e.slp && d > 0 && Math.random() < 0.5) { e.slp = 0; await say(e.name + 'は めを さました！', { auto: true, wait: 400 }); }
  if (e.hp <= 0) { e.alive = false; sfx('dead'); await say(e.name + 'を たおした！', { auto: true, wait: 500 }); }
}
async function dmgToAlly(m, d) {
  m.hp = Math.max(0, m.hp - d); shake(); sfx('hit'); updateParty();
  await say(m.name + 'は ' + d + 'の ダメージを うけた！', { auto: true, wait: 460 });
  if (m._b.slp && d > 0 && Math.random() < 0.5) { m._b.slp = 0; await say(m.name + 'は めを さました！', { auto: true, wait: 400 }); }
  if (m.hp <= 0) { m._b.slp = 0; m._b.poi = false; sfx('dead'); updateParty(); await say(m.name + 'は たおれてしまった！', { auto: true, wait: 550 }); }
}
function aliveEnemies() { return B.es.filter(e => e.alive); }
function battleOver() {
  if (!aliveEnemies().length) return 'win';
  if (!alivePt().length) return 'lose';
  return null;
}

async function resolvePhase(input) {
  if (input.run) {
    const heroAgi = statsOf(G.party[0]).agi;
    const eAgi = Math.max(...B.es.map(e => e.agi));
    const ok = Math.random() < clamp(0.55 + (heroAgi - eAgi) * 0.012, 0.35, 0.92);
    if (ok) { sfx('run'); await say('うまく にげきった！', { auto: true, wait: 600 }); return 'run'; }
    await say('しかし まわりこまれて しまった！', { auto: true, wait: 600 });
    const r = await enemiesAct(aliveEnemies());
    if (r) return r;
    return await endOfRound();
  }
  // 行動順: すばやさ×乱数
  const order = [];
  input.acts.forEach(a => order.push({ pri: statsOf(a.m).agi * (0.8 + Math.random() * 0.4), a }));
  aliveEnemies().forEach(e => {
    order.push({ pri: e.agi * (0.8 + Math.random() * 0.4), a: { e, type: 'ai' } });
    if (e.sp === 'maou' && B.phase === 2) order.push({ pri: e.agi * 0.6 * (0.8 + Math.random() * 0.4), a: { e, type: 'ai' } });
  });
  order.sort((x, y) => y.pri - x.pri);
  for (const { a } of order) {
    let r = battleOver(); if (r) return r;
    if (a.type === 'ai') { if (!a.e.alive) continue; r = await enemyAct(a.e); }
    else { if (a.m.hp <= 0) continue; r = await allyAct(a); }
    if (r) return r;
  }
  return await endOfRound();
}
async function allyAct(a) {
  const m = a.m; const st = statsOf(m);
  if (m._b.slp) {
    if (Math.random() < 0.5) { m._b.slp = 0; updateParty(); await say(m.name + 'は めを さました！', { auto: true, wait: 450 }); }
    else { await say(m.name + 'は ぐっすり ねむっている…', { auto: true, wait: 450 }); return battleOver(); }
    return battleOver();
  }
  if (a.type === 'def') { m._b.def = true; await say(m.name + 'は みを まもっている。', { auto: true, wait: 420 }); return battleOver(); }
  if (a.type === 'atk') {
    let e = B.es[a.t]; if (!e.alive) e = aliveEnemies()[0]; if (!e) return battleOver();
    await say(m.name + 'の こうげき！', { auto: true, wait: 380 });
    if (Math.random() < 1 / 24) { await say('かいしんの いちげき！！', { auto: true, wait: 420 }); await dmgToEnemy(e, Math.max(1, Math.floor(st.atk * (0.9 + Math.random() * 0.2))), { crit: true, col: '#f0c860' }); }
    else if (Math.random() < 1 / 28) { sfx('buzz'); await say('ミス！ ' + e.name + 'に かわされた！', { auto: true, wait: 450 }); }
    else {
      const d = SPECIES[e.sp].metal ? rnd(2) : physDmg(st.atk, e.def);
      await dmgToEnemy(e, d);
    }
    return battleOver();
  }
  if (a.type === 'skill') return await doSkill(m, st, a.sk, a.t);
  if (a.type === 'item') {
    const def = ITEMS[a.it];
    if (G.items[a.it] <= 0) { await say('しかし ' + def.n + 'は もう なかった！', { auto: true, wait: 450 }); return battleOver(); }
    if (def.treat) {
      G.items[a.it]--; B.treat = true; sfx('ok');
      await say(m.name + 'は まもののおやつを なげた！ まものたちが ちらちら こちらを みている…', { auto: true, wait: 900 });
      return battleOver();
    }
    G.items[a.it]--;
    await useItemOn(a.it, G.party[a.t]);
    return battleOver();
  }
  return battleOver();
}
async function doSkill(m, st, skId, t) {
  const sk = SKILLS[skId];
  if (m.mp < sk.mp) { await say('MPが たりない！', { auto: true, wait: 420 }); return battleOver(); }
  m.mp -= sk.mp; updateParty();
  await say(m.name + 'は ' + sk.n + 'を つかった！', { auto: true, wait: 450 });
  const targets = sk.tgt === 'all' ? aliveEnemies() : null;
  if (sk.kind === 'phys' || sk.kind === 'drain') {
    sfx('hit');
    const hits = sk.hits || 1;
    if (targets) { for (const e of targets) { const d = SPECIES[e.sp].metal ? rnd(2) : physDmg(st.atk, e.def, sk.mult); await dmgToEnemy(e, d); if (battleOver()) break; } }
    else {
      let e = B.es[t]; if (!e || !e.alive) e = aliveEnemies()[0]; if (!e) return battleOver();
      for (let h = 0; h < hits && e.alive; h++) {
        const d = SPECIES[e.sp].metal ? rnd(2) : physDmg(st.atk, e.def, sk.mult);
        await dmgToEnemy(e, d);
        if (sk.kind === 'drain' && d > 0 && m.hp > 0) { m.hp = Math.min(m.maxhp, m.hp + Math.ceil(d / 2)); updateParty(); await say(m.name + 'は HPを ' + Math.ceil(d / 2) + ' すいとった！', { auto: true, wait: 450 }); }
      }
      if (sk.poison && e.alive && !SPECIES[e.sp].boss && Math.random() < sk.poison) { e.poi = true; await say(e.name + 'は どくに おかされた！', { auto: true, wait: 450 }); }
    }
    return battleOver();
  }
  if (sk.kind === 'mag' || sk.kind === 'breath') {
    sfx('spell');
    const list = targets || [B.es[t] && B.es[t].alive ? B.es[t] : aliveEnemies()[0]];
    for (const e of list) { if (!e) continue;
      const d = SPECIES[e.sp].metal ? rnd(2) : rrange(sk.pow[0], sk.pow[1]);
      await dmgToEnemy(e, d, { col: '#ffb060' });
      if (battleOver()) break;
    }
    return battleOver();
  }
  if (sk.kind === 'sleep') {
    sfx('spell');
    for (const e of aliveEnemies()) {
      const ch = SPECIES[e.sp].boss ? 0.15 : 0.5;
      if (Math.random() < ch) { e.slp = rrange(2, 3); await say(e.name + 'は ねむってしまった！', { auto: true, wait: 450 }); }
      else await say(e.name + 'には きかなかった！', { auto: true, wait: 450 });
    }
    return battleOver();
  }
  if (sk.kind === 'heal') {
    const tm = G.party[t]; sfx('heal');
    const v = rrange(sk.pow[0], sk.pow[1]);
    tm.hp = Math.min(tm.maxhp, tm.hp + v); updateParty();
    await say(tm.name + 'の HPが ' + v + ' かいふくした！', { auto: true, wait: 500 });
    return battleOver();
  }
  if (sk.kind === 'revive') {
    const tm = G.party[t]; sfx('heal');
    if (tm.hp > 0) { await say('しかし なにも おこらなかった。', { auto: true, wait: 450 }); return battleOver(); }
    tm.hp = Math.max(1, Math.floor(tm.maxhp * sk.pow)); updateParty();
    await say(tm.name + 'が いきかえった！', { auto: true, wait: 550 });
    return battleOver();
  }
  return battleOver();
}
async function enemiesAct(list) { for (const e of list) { if (!e.alive) continue; const r = await enemyAct(e); if (r) return r; } return null; }
async function enemyAct(e) {
  if (e.slp) {
    if (Math.random() < 0.5) { e.slp = 0; await say(e.name + 'は めを さました！', { auto: true, wait: 420 }); }
    else { await say(e.name + 'は ねむっている…', { auto: true, wait: 420 }); return battleOver(); }
    return battleOver();
  }
  const s = SPECIES[e.sp];
  const ai = (e.sp === 'maou' && B.phase === 2 && s.ai2) ? s.ai2 : s.ai;
  const tw = ai.reduce((sum, a) => sum + a[1], 0); let r = rnd(tw); let act = 'atk';
  for (const [id, w] of ai) { r -= w; if (r < 0) { act = id; break; } }
  const targets = alivePt();
  const pick = () => targets[rnd(targets.length)];
  if (act === 'atk') {
    const m = pick();
    await say(e.name + 'の こうげき！', { auto: true, wait: 400 });
    if (Math.random() < 1 / 26) { await say('つうこんの いちげき！！', { auto: true, wait: 450 }); await dmgToAlly(m, Math.max(1, Math.floor(e.atk * (0.9 + Math.random() * 0.2)))); }
    else {
      const st = statsOf(m);
      let d = physDmg(e.atk, st.def * (m._b.def ? 2 : 1));
      await dmgToAlly(m, d);
    }
  } else if (act === 'flee') {
    sfx('run'); e.alive = false; e.fled = true;
    await say(e.name + 'は にげだした！', { auto: true, wait: 500 });
  } else {
    const sk = SKILLS[act];
    await say(e.name + 'は ' + sk.n + 'を つかった！', { auto: true, wait: 450 });
    if (sk.kind === 'sleep') {
      sfx('spell');
      for (const m of targets) {
        if (Math.random() < 0.4) { m._b.slp = rrange(2, 3); updateParty(); await say(m.name + 'は ねむってしまった！', { auto: true, wait: 450 }); }
        else await say(m.name + 'には きかなかった！', { auto: true, wait: 420 });
      }
    } else if (sk.kind === 'mag' || sk.kind === 'breath') {
      sfx('spell');
      const list = sk.tgt === 'all' ? targets.slice() : [pick()];
      for (const m of list) {
        let d = rrange(sk.pow[0], sk.pow[1]); if (m._b.def) d = Math.floor(d / 2);
        await dmgToAlly(m, d);
        if (battleOver()) break;
      }
    } else {
      const m = pick(); const st = statsOf(m);
      const hits = sk.hits || 1;
      for (let h = 0; h < hits && m.hp > 0; h++) {
        const d = physDmg(e.atk, st.def * (m._b.def ? 2 : 1), sk.mult || 1);
        await dmgToAlly(m, d);
      }
      if (sk.poison && Math.random() < sk.poison) { const m2 = pick(); if (m2.hp > 0 && !m2._b.poi) { m2._b.poi = true; updateParty(); await say(m2.name + 'は どくに おかされた！', { auto: true, wait: 450 }); } }
    }
  }
  // 魔王フェーズ2
  const maou = B.es.find(x => x.sp === 'maou');
  if (maou && maou.alive && B.phase === 1 && maou.hp <= maou.maxhp * 0.45) {
    B.phase = 2; maou.atk += 6;
    await say('ゾルデ『おのれ…！ みせてやろう しんの ちからを！』', {});
  }
  return battleOver();
}
async function endOfRound() {
  // 魔王フェーズチェック(味方の攻撃後)
  const maou = B.es.find(x => x.sp === 'maou');
  if (maou && maou.alive && B.phase === 1 && maou.hp <= maou.maxhp * 0.45) {
    B.phase = 2; maou.atk += 6;
    await say('ゾルデ『おのれ…！ みせてやろう しんの ちからを！』', {});
  }
  for (const e of aliveEnemies()) {
    if (e.poi) { const d = Math.max(2, Math.floor(e.maxhp / 8)); popup(e, d, '#c080f0'); e.hp -= d;
      await say(e.name + 'は どくの ダメージを うけた！', { auto: true, wait: 420 });
      if (e.hp <= 0) { e.alive = false; sfx('dead'); await say(e.name + 'を たおした！', { auto: true, wait: 480 }); } }
  }
  for (const m of alivePt()) {
    if (m._b.poi) { const d = Math.max(2, Math.floor(m.maxhp / 10)); m.hp = Math.max(1, m.hp - d); updateParty();
      await say(m.name + 'は どくで くるしい…', { auto: true, wait: 420 }); }
    if (m._b.slp > 0) m._b.slp--;
  }
  for (const e of aliveEnemies()) if (e.slp > 0) e.slp--;
  return battleOver();
}
async function victoryFlow() {
  bgm(null); AU.jingle('victory');
  const defeated = B.es.filter(e => !e.alive && !e.fled);
  await say('まものたちを やっつけた！');
  const exp = defeated.reduce((s, e) => s + SPECIES[e.sp].exp, 0);
  const gold = defeated.reduce((s, e) => s + SPECIES[e.sp].gold, 0);
  if (exp || gold) {
    G.gold += gold;
    await say('けいけんち ' + exp + 'ポイント と ' + gold + 'ゴールドを てにいれた！');
    for (const m of alivePt()) await gainExp(m, exp);
  }
  // なかま勧誘
  if (!B.boss) {
    const cands = defeated.filter(e => SPECIES[e.sp].rec > 0);
    const room = G.party.length < 4 || G.reserve.length < 12;
    if (cands.length && room) {
      const e = cands[rnd(cands.length)];
      let rate = SPECIES[e.sp].rec * (B.treat ? 2 : 1);
      if (TESTF.forceRecruit) { rate = 1; TESTF.forceRecruit = false; }
      if (Math.random() < rate) {
        AU.jingle('recruit');
        await say(SPECIES[e.sp].n + 'が むくっと おきあがり つぶらな ひとみで こちらを みている…！');
        if (await askYN('なかまに してあげますか？')) {
          const nm = newMember(e.sp, e.lv);
          if (G.party.length < 4) { G.party.push(nm); await say(nm.name + 'は なかまに くわわった！'); }
          else { G.reserve.push(nm); await say(nm.name + 'は なかまに くわわり ほこらへ むかった！(メニューの「なかま」で いれかえできる)'); }
          updateParty();
        } else {
          await say(SPECIES[e.sp].n + 'は さみしそうに さっていった…');
        }
      }
    }
  }
}
async function gainExp(m, exp) {
  m.exp += exp;
  while (m.lv < MAXLV && m.exp >= EXPT[m.lv + 1]) {
    m.lv++;
    const before = { hp: m.maxhp, mp: m.maxmp };
    recalc(m);
    m.hp = Math.min(m.maxhp, m.hp + (m.maxhp - before.hp));
    m.mp = Math.min(m.maxmp, m.mp + (m.maxmp - before.mp));
    AU.jingle('levelup'); updateParty();
    await say(m.name + 'は レベル' + m.lv + 'に あがった！');
    const learned = SPECIES[m.sp].skills.filter(([lv]) => lv === m.lv).map(([, id]) => id);
    if (m.sp === 'hero') HERO_SPELLS.forEach(([lv, id]) => { if (lv === m.lv) learned.push(id); });
    for (const id of learned) await say(m.name + 'は ' + SKILLS[id].n + 'を おぼえた！');
  }
}

/* ---------- 全滅 ---------- */
async function gameOver() {
  AU.jingle('gameover');
  await say(G.name + 'は めのまえが まっくらに なった…');
  G.party.forEach(m => { m._b = null; m.hp = m.maxhp; m.mp = m.maxmp; });
  G.reserve.forEach(m => { m.hp = m.maxhp; m.mp = m.maxmp; });
  G.gold = Math.floor(G.gold / 2);
  const town = TOWNS[G.lastTown] || TOWNS.T;
  G.x = town.pos[0]; G.y = town.pos[1] + 1; G.px = G.x * 16; G.py = G.y * 16; G.dir = 0;
  hudHide(); hideMsgWin(); B = null; G.mode = 'field'; bgm('field');
  await say('…めが さめると ' + town.n + 'の ちかくだった。(しょじきんが はんぶんに なってしまった)');
  save();
}

/* ---------- フィールドイベント ---------- */
async function bridgeEvent() {
  await say('はしの ばんにん ガーディアンが たちふさがった！');
  const r = await battle([{ sp: 'guard', lv: 1 }], { boss: true, bg: 'plain' });
  if (r === 'lose') { await gameOver(); return; }
  if (r === 'win') {
    G.flags.bridge = true; save();
    await say('ばんにんを うちやぶった！ ひがしへの はしが とおれるように なった！');
  }
}
async function townEvent(id) {
  const t = TOWNS[id]; G.lastTown = id; save();
  hudShow(); updateParty();
  while (true) {
    const c = await menuWin([
      { t: 'はなす', v: 'talk' },
      { t: 'やどや (' + t.inn + 'G)', v: 'inn' },
      { t: 'おみせ', v: 'shop' },
      { t: 'そとへ でる', v: 'out' },
    ], { cls: 'town', title: t.n + '  もちきん ' + G.gold + 'G' });
    if (c === 'out' || c === -1) break;
    if (c === 'talk') {
      const k = (G.talkIdx[id] || 0) % t.talks.length;
      G.talkIdx[id] = k + 1;
      await say(t.talks[k]);
    } else if (c === 'inn') {
      if (G.gold < t.inn) { await say('やどだい ' + t.inn + 'Gが たりないよ。'); continue; }
      if (!(await askYN('ひとばん ' + t.inn + 'Gだけど とまっていくかい？'))) continue;
      G.gold -= t.inn;
      AU.jingle('inn'); flashWhite(); await wait(400);
      G.party.concat(G.reserve).forEach(m => { m.hp = m.maxhp; m.mp = m.maxmp; });
      updateParty(); save();
      await say('ぐっすり ねむって げんき かいふく！ HPと MPが ぜんかいふくした！');
    } else if (c === 'shop') {
      await shopFlow(t);
    }
  }
  hudHide(); hideMsgWin();
}
async function shopFlow(t) {
  while (true) {
    const items = t.shop.map(id => {
      const def = ITEMS[id] || GEAR[id];
      const owned = (GEAR[id] && (G.weapon === id || G.armor === id));
      return { t: def.n + (owned ? '(そうびちゅう)' : ''), r: def.price + 'G', v: id, dis: owned };
    });
    items.push({ t: 'やめる', v: 'q' });
    const v = await menuWin(items, { cls: 'town', title: 'おみせ  もちきん ' + G.gold + 'G' });
    if (v === 'q' || v === -1) break;
    const def = ITEMS[v] || GEAR[v];
    if (ITEMS[v] && ITEMS[v].info) await say(def.n + '： ' + ITEMS[v].info, { auto: true, wait: 900 });
    if (!(await askYN(def.n + 'を ' + def.price + 'Gで かいますか？'))) continue;
    if (G.gold < def.price) { await say('おかねが たりないよ！'); continue; }
    if (GEAR[v]) {
      const isW = v[0] === 'w';
      const oldId = isW ? G.weapon : G.armor;
      const old = GEAR[oldId];
      const refund = Math.floor(old.price / 2);
      G.gold += refund - def.price;
      if (isW) G.weapon = v; else G.armor = v;
      G.party[0] && recalc(G.party[0]);
      sfx('ok');
      await say(def.n + 'を そうびした！(' + old.n + 'は ' + refund + 'Gで ひきとってもらった)');
    } else {
      if ((G.items[v] || 0) >= 9) { await say('これいじょう もてないよ！'); continue; }
      G.gold -= def.price; G.items[v] = (G.items[v] || 0) + 1;
      sfx('ok');
      await say(def.n + 'を てにいれた！');
    }
    save();
  }
}
async function caveEvent() {
  if (G.flags.cave) { await say('どうくつは ひっそりと しずまりかえっている。おたからは もう ない。'); return; }
  await say('ほのおのどうくつを みつけた！ なかから あつい かぜが ふきつけてくる…');
  if (!(await askYN('どうくつに はいりますか？'))) return;
  await say('どうくつの おくへ すすむと まものたちが おそいかかってきた！');
  let r = await battle([{ sp: 'liza', lv: 8 }, { sp: 'wisp', lv: 8 }], { bg: 'cave' });
  if (r === 'lose') { await gameOver(); return; }
  if (r !== 'win') return;
  await say('さいおくの おおひろまに きょだいな あかい りゅうが とぐろを まいている…！');
  await say('ドラゴロード『ワシの たからを とりにきたか…こんがり やいて くれるわ！』');
  r = await battle([{ sp: 'dlord', lv: 1 }], { boss: true, bg: 'cave' });
  if (r === 'lose') { await gameOver(); return; }
  if (r !== 'win') return;
  G.flags.cave = true; G.flags.key = true;
  await say('たからばこを あけた！「ほのおのつるぎ」と「じゃのカギ」を てにいれた！');
  if (GEAR[G.weapon].atk < GEAR.w3.atk) {
    G.weapon = 'w3'; recalc(G.party[0]);
    await say(G.name + 'は ほのおのつるぎを そうびした！');
  }
  await say('じゃのカギ… ほくせいの まおうじょうの とびらを あける カギだ！');
  save();
}
async function castleEvent() {
  if (G.flags.clear) { await say('しろは しずまりかえっている。せかいには へいわな じかんが ながれている…。'); return; }
  if (!G.flags.key) { await say('まおうじょうの おおきな とびらは かたく とざされている。(「じゃのカギ」が ひつようだ)'); return; }
  await say('じゃのカギを つかった！ とびらが ゴゴゴ…と ひらいていく…');
  if (!(await askYN('まおうじょうに のりこみますか？'))) return;
  await say('たまのまに すわる かげが ゆっくりと たちあがる…');
  await say('ゾルデ『よくぞ ここまで きたな にんげんよ。まものを なかまにする ちから…おもしろい。だが ここで おわりだ！』');
  const r = await battle([{ sp: 'maou', lv: 1 }], { boss: true, bg: 'dark' });
  if (r === 'lose') { await gameOver(); return; }
  if (r !== 'win') return;
  await ending();
}
async function ending() {
  bgm(null); AU.jingle('victory');
  await say('まおうゾルデは ひかりに つつまれ ほろびさった！');
  await say('せかいに おだやかな あさが もどっていく…。');
  await say('まものと こころを かよわせる ゆうしゃ ' + G.name + '。その ぼうけんは いつまでも かたりつがれることだろう。');
  const cnt = G.party.length - 1 + G.reserve.length;
  await say('【ぼうけんのきろく】 レベル:' + G.party[0].lv + '　なかまにした まもの:' + cnt + 'ひき　あるいた かず:' + G.steps + 'ほ');
  await say('〜 THE END 〜　あそんでくれて ありがとう！');
  await say('※このあとも じゆうに ぼうけんできます。メタルぷにを なかまに してみるのも いいかも…？');
  G.flags.clear = true; save(); bgm('field');
}

/* ---------- フィールドメニュー ---------- */
async function fieldMenu() {
  hudShow(); updateParty(); sfx('ok');
  while (true) {
    const c = await menuWin([
      { t: 'つよさ', v: 'st' }, { t: 'じゅもん', v: 'sp' }, { t: 'どうぐ', v: 'it' },
      { t: 'なかま', v: 'pt' }, { t: 'セーブ', v: 'sv' }, { t: 'せってい', v: 'cf' },
      { t: 'とじる', v: 'q' },
    ], { cls: 'fmenu', title: 'メニュー  ' + G.gold + 'G' });
    if (c === 'q' || c === -1) break;
    if (c === 'st') await statusFlow();
    else if (c === 'sp') await fieldSpellFlow();
    else if (c === 'it') await fieldItemFlow();
    else if (c === 'pt') await partyFlow();
    else if (c === 'sv') { save(); await say('ぼうけんのしょに きろくした！'); }
    else if (c === 'cf') await configFlow();
  }
  hudHide(); hideMsgWin();
}
async function statusFlow() {
  while (true) {
    const v = await menuWin(G.party.map((m, i) => ({ t: m.name, r: 'Lv' + m.lv, v: i })), { cls: 'fmenu', title: 'つよさ' });
    if (v === -1) break;
    const m = G.party[v]; const st = statsOf(m);
    const sks = skillsOf(m).map(id => SKILLS[id].n).join('、') || 'なし';
    const next = m.lv >= MAXLV ? '--' : (EXPT[m.lv + 1] - m.exp);
    let html = '<div class="srow"><b>' + m.name + '</b>　Lv' + m.lv + '</div>' +
      '<div class="srow">HP ' + m.hp + '/' + m.maxhp + '　MP ' + m.mp + '/' + m.maxmp + '</div>' +
      '<div class="srow">こうげき ' + st.atk + '　ぼうぎょ ' + st.def + '　すばやさ ' + st.agi + '</div>' +
      '<div class="srow">EXP ' + m.exp + '　つぎまで ' + next + '</div>' +
      '<div class="srow">とくぎ: ' + sks + '</div>';
    if (m.sp === 'hero') html += '<div class="srow">そうび: ' + GEAR[G.weapon].n + ' / ' + GEAR[G.armor].n + '</div>';
    const w = infoWin(html, 'stat');
    await waitAB(); w.remove();
  }
}
async function fieldSpellFlow() {
  const casters = G.party.filter(m => m.hp > 0 && skillsOf(m).some(id => ['heal', 'revive'].includes(SKILLS[id].kind)));
  if (!casters.length) { await say('フィールドで つかえる じゅもんを だれも しらない。'); return; }
  const ci = await menuWin(casters.map((m, i) => ({ t: m.name, r: 'MP' + m.mp, v: i })), { cls: 'fmenu', title: 'だれの じゅもん？' });
  if (ci === -1) return;
  const m = casters[ci];
  const sk = await pickSkill(m, false); if (!sk) return;
  const def = SKILLS[sk];
  const t = await pickAlly(def.kind); if (t === null) return;
  m.mp -= def.mp;
  const tm = G.party[t]; sfx('heal');
  if (def.kind === 'heal') { const v = rrange(def.pow[0], def.pow[1]); tm.hp = Math.min(tm.maxhp, tm.hp + v); await say(tm.name + 'の HPが ' + v + ' かいふくした！'); }
  else { tm.hp = Math.max(1, Math.floor(tm.maxhp * def.pow)); await say(tm.name + 'が いきかえった！'); }
  updateParty(); save();
}
async function fieldItemFlow() {
  while (true) {
    const ids = Object.keys(G.items).filter(id => G.items[id] > 0 && ITEMS[id]);
    const rows = ids.map(id => ({ t: ITEMS[id].n, r: '×' + G.items[id], v: id }));
    if (G.flags.key) rows.push({ t: 'じゃのカギ', r: 'だいじ', v: 'key' });
    if (!rows.length) { await say('どうぐを なにも もっていない。'); return; }
    const v = await menuWin(rows, { cls: 'fmenu', title: 'どうぐ' });
    if (v === -1) break;
    if (v === 'key') { await say('まおうじょうの とびらを あける ふしぎな カギ。'); continue; }
    const def = ITEMS[v];
    if (def.treat) { await say('せんとうちゅうに つかうと まものが なかまに なりやすくなる おやつ。'); continue; }
    const kind = def.revive ? 'revive' : 'heal';
    const t = await pickAlly(kind); if (t === null) continue;
    G.items[v]--;
    await useItemOn(v, G.party[t]);
    save();
  }
}
async function useItemOn(id, tm) {
  const def = ITEMS[id];
  if (def.heal) { sfx('heal'); const v = rrange(def.heal[0], def.heal[1]); tm.hp = Math.min(tm.maxhp, tm.hp + v); updateParty(); await say(tm.name + 'の HPが ' + v + ' かいふくした！', { auto: true, wait: 600 }); }
  else if (def.mp) { sfx('heal'); tm.mp = Math.min(tm.maxmp, tm.mp + def.mp); updateParty(); await say(tm.name + 'の MPが ' + def.mp + ' かいふくした！', { auto: true, wait: 600 }); }
  else if (def.revive) {
    if (tm.hp > 0) { await say('しかし なにも おこらなかった。', { auto: true, wait: 500 }); return; }
    sfx('heal'); tm.hp = Math.max(1, Math.floor(tm.maxhp * def.revive)); updateParty();
    await say(tm.name + 'が いきかえった！', { auto: true, wait: 600 });
  }
}
async function partyFlow() {
  while (true) {
    const rows = [];
    G.party.forEach((m, i) => { if (i > 0) rows.push({ t: m.name, r: 'Lv' + m.lv + ' たい', v: ['a', i] }); });
    G.reserve.forEach((m, i) => rows.push({ t: m.name, r: 'Lv' + m.lv + ' ほこら', v: ['r', i] }));
    if (!rows.length) { await say('まだ まものの なかまが いない。まものを たおすと なかまに なることが あるよ！'); return; }
    const v = await menuWin(rows, { cls: 'fmenu', title: 'なかま (たい ' + G.party.length + '/4)' });
    if (v === -1) break;
    const [where, idx] = v;
    const m = where === 'a' ? G.party[idx] : G.reserve[idx];
    const acts = where === 'a'
      ? [{ t: 'ほこらに あずける', v: 'store', dis: G.reserve.length >= 12 }, { t: 'にがす', v: 'bye' }, { t: 'もどる', v: 'q' }]
      : [{ t: 'パーティに いれる', v: 'join', dis: G.party.length >= 4 }, { t: 'にがす', v: 'bye' }, { t: 'もどる', v: 'q' }];
    const a = await menuWin(acts, { cls: 'fmenu sub2', title: m.name + ' Lv' + m.lv });
    if (a === 'q' || a === -1) continue;
    if (a === 'store') { G.party.splice(idx, 1); G.reserve.push(m); sfx('ok'); await say(m.name + 'を ほこらに あずけた。'); }
    else if (a === 'join') { G.reserve.splice(idx, 1); G.party.push(m); sfx('ok'); await say(m.name + 'は パーティに くわわった！'); }
    else if (a === 'bye') {
      if (await askYN('ほんとうに ' + m.name + 'と おわかれしますか？', { idx: 1 })) {
        if (where === 'a') G.party.splice(idx, 1); else G.reserve.splice(idx, 1);
        await say(m.name + 'は もりへ かえっていった。げんきでね！');
      }
    }
    updateParty(); save();
  }
}
async function configFlow() {
  while (true) {
    const c = await menuWin([
      { t: 'サウンド', r: G.set.sound ? 'ON' : 'OFF', v: 's' },
      { t: 'メッセージそくど', r: G.set.fast ? 'はやい' : 'ふつう', v: 'f' },
      { t: 'さいしょから やりなおす', v: 'reset' },
      { t: 'もどる', v: 'q' },
    ], { cls: 'fmenu', title: 'せってい' });
    if (c === 'q' || c === -1) break;
    if (c === 's') { G.set.sound = !G.set.sound; if (!G.set.sound) AU.stop(); else bgm('field'); save(); }
    else if (c === 'f') { G.set.fast = !G.set.fast; save(); }
    else if (c === 'reset') {
      if (await askYN('ぼうけんのしょを けして さいしょから はじめますか？', { idx: 1 })) {
        if (await askYN('ほんとうに いいですか？ (もとには もどせません)', { idx: 1 })) {
          try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
          location.reload(); return;
        }
      }
    }
  }
}

/* ---------- タイトル・オープニング ---------- */
function naming() {
  return new Promise(res => {
    const ni = $('#namein'); ni.classList.add('on');
    const input = $('#nameInput'); input.value = 'ユウ';
    setTimeout(() => { try { input.focus(); input.select(); } catch (e) { } }, 60);
    const ok = () => {
      let v = (input.value || '').trim().slice(0, 6);
      if (!v) v = 'ユウ';
      ni.classList.remove('on');
      $('#nameOk').removeEventListener('pointerdown', ok);
      res(v);
    };
    $('#nameOk').addEventListener('pointerdown', ok);
  });
}
async function opening() {
  await say('むかしむかし。ふういんされていた まおうゾルデが よみがえり せかいは まもので あふれてしまった。');
  await say('しかし ' + G.name + 'には ふしぎな ちからが あった。たたかった まものと こころを かよわせ なかまに する ちからが…！');
  await say('まものたちと ちからをあわせ ほくせいの まおうじょうに ねむる ゾルデを うちたおすのだ！');
  await say('そうさほうほう: 十じキーで いどう / Aボタンで けってい・しらべる / Bボタンで メニュー。むらの ひとの はなしも きいてみよう！');
}
async function titleFlow() {
  G = defaultState(); G.mode = 'title';
  while (true) {
    const has = !!loadData();
    const c = await menuWin([
      { t: 'はじめから', v: 'new' },
      { t: 'つづきから', v: 'cont', dis: !has },
    ], { cls: 'title', cancel: false, idx: has ? 1 : 0 });
    if (c === 'cont') {
      const d = loadData(); if (!d) continue;
      applyLoad(d); bgm('field');
      await say('ぼうけんのしょを よみこんだ！ つづきから スタート！', { auto: true, wait: 800 });
      break;
    }
    if (c === 'new') {
      const nm = await naming();
      G = defaultState(); G.name = nm;
      const hero = newMember('hero', 1); hero.name = nm;
      G.party = [hero];
      G.mode = 'field'; bgm('field');
      await opening();
      save();
      break;
    }
  }
}

/* ---------- 起動 ---------- */
function boot() {
  Object.keys(SPR).forEach(id => SPRC[id] = buildSprite(SPR[id]));
  buildTiles();
  CTX = cv().getContext('2d');
  fit(); bindControls();
  render();
  const loop = () => { fieldTick(); setTimeout(loop, 16); };
  loop();
  runEvent(titleFlow);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ---------- テスト用フック ---------- */
window.__test = {
  G: () => G, mode: () => G && G.mode, busy: () => busy, ui: () => UI.stack.length,
  dispatch, save, TESTF,
  startBattle(zone, n) { runEvent(async () => { await battle(makeTroop(zone || 't1', n), { bg: ZONE_BG[zone || 't1'] }); }); },
  boss(sp) { runEvent(async () => { const r = await battle([{ sp, lv: 1 }], { boss: true, bg: 'dark' }); if (r === 'lose') await gameOver(); }); },
  buff(lv) { const h = G.party[0]; h.lv = lv || 20; h.exp = EXPT[h.lv]; recalc(h); h.hp = h.maxhp; h.mp = h.maxmp; updateParty(); },
  addMonster(sp, lv) { if (G.party.length < 4) G.party.push(newMember(sp, lv || 10)); updateParty(); },
  give(id, n) { G.items[id] = (G.items[id] || 0) + (n || 1); },
  warp(x, y) { G.x = x; G.y = y; G.px = x * 16; G.py = y * 16; },
  fullMap() {
    const c = document.createElement('canvas'); c.width = MW * 16; c.height = MH * 16;
    const x2 = c.getContext('2d');
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const ch = tileAt(x, y); x2.drawImage((TILEC[ch] || TILEC.g)[0], x * 16, y * 16);
    }
    return c.toDataURL();
  },
};
