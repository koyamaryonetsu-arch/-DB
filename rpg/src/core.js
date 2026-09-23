'use strict';
/* =====================================================================
 * core.js — engine foundation
 *   screen scaling / input (keyboard + touch pad) / scene stack /
 *   timers / fades / drawing helpers (DQ-style windows & text)
 * ===================================================================== */

const SW = 256, SH = 240, TS = 16;
const FONT = '"DotGothic16", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", monospace';
const COL = {
  white: '#f8f8f8', gray: '#98a0b0', dim: '#606878', black: '#000000',
  yellow: '#f8d838', orange: '#f89838', red: '#f05038', green: '#78e070',
  blue: '#78b8f8', outline: '#181018',
};

/* ---------- small utils ---------- */
const rnd = n => Math.floor(Math.random() * n);                 // 0..n-1
const rndInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
/* deterministic hash noise in [0,1) — used for tile art */
function hash2(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
const DIRS = ['down', 'up', 'left', 'right'];
const DXY = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };

/* ---------- screen ---------- */
const Screen = {
  canvas: null, ctx: null, px: 3,
  init() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.fit();
    window.addEventListener('resize', () => this.fit());
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.fit());
  },
  fit() {
    const wrap = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const aw = Math.max(64, wrap.clientWidth), ah = Math.max(60, wrap.clientHeight);
    const css = Math.min(aw / SW, ah / SH);          // css px per game px
    const phys = css * dpr;                           // physical px per game px
    let px, cssScale;
    if (phys >= 1 && phys - Math.floor(phys) < 0.2) { px = Math.floor(phys); cssScale = px / dpr; }
    else { px = Math.max(1, Math.ceil(phys)); cssScale = css; }
    px = Math.min(px, 8);
    this.px = px;
    if (this.canvas.width !== SW * px) { this.canvas.width = SW * px; this.canvas.height = SH * px; }
    this.canvas.style.width = Math.floor(SW * cssScale) + 'px';
    this.canvas.style.height = Math.floor(SH * cssScale) + 'px';
  },
};
let ctx = null;   // set in Engine.start (shortcut to Screen.ctx)

/* ---------- input ---------- */
const Input = (() => {
  const held = Object.create(null), edge = Object.create(null), frames = Object.create(null);
  const KEYS = {
    ArrowUp: 'up', KeyW: 'up', Numpad8: 'up',
    ArrowDown: 'down', KeyS: 'down', Numpad2: 'down',
    ArrowLeft: 'left', KeyA: 'left', Numpad4: 'left',
    ArrowRight: 'right', KeyD: 'right', Numpad6: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a', NumpadEnter: 'a', KeyJ: 'a',
    KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b', KeyC: 'b',
  };
  let lastDir = null;
  const listeners = [];
  function press(b) {
    if (!held[b]) { held[b] = true; edge[b] = true; frames[b] = 0; if (DXY[b]) lastDir = b; }
    for (const f of listeners) f(b);
  }
  function release(b) { held[b] = false; }
  function releaseAll() { for (const k in held) held[k] = false; }
  window.addEventListener('keydown', e => {
    const b = KEYS[e.code];
    if (!b) return;
    e.preventDefault();
    if (!e.repeat) press(b);
  });
  window.addEventListener('keyup', e => { const b = KEYS[e.code]; if (b) { e.preventDefault(); release(b); } });
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  return {
    held: b => !!held[b],
    pressed: b => !!edge[b],
    /* edge, or auto-repeat while held (menus) */
    repeat: b => !!edge[b] || (!!held[b] && frames[b] >= 18 && (frames[b] - 18) % 5 === 0),
    dir() {
      if (lastDir && held[lastDir]) return lastDir;
      for (const d of DIRS) if (held[d]) return d;
      return null;
    },
    consume(b) { edge[b] = false; },
    clearEdges() { for (const k in edge) edge[k] = false; },
    endFrame() {
      for (const k in edge) edge[k] = false;
      for (const k in held) if (held[k]) frames[k]++;
    },
    onPress(f) { listeners.push(f); },
    press, release, releaseAll,
  };
})();

/* on-screen touch pad (DOM) → Input */
const TouchPad = {
  init() {
    const pad = document.getElementById('dpad');
    if (pad) {
      let cur = null, pid = null;
      const setDir = d => {
        if (d === cur) return;
        if (cur) Input.release(cur);
        cur = d;
        if (d) Input.press(d);
        pad.dataset.dir = d || '';
      };
      const calc = e => {
        const r = pad.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < r.width * 0.12) return null;
        return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      };
      pad.addEventListener('pointerdown', e => {
        e.preventDefault(); pid = e.pointerId;
        try { pad.setPointerCapture(pid); } catch (_) { /* ignore */ }
        setDir(calc(e));
      });
      pad.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); setDir(calc(e)); } });
      const end = e => { if (e.pointerId === pid) { pid = null; setDir(null); } };
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
      pad.addEventListener('lostpointercapture', end);
    }
    document.querySelectorAll('[data-btn]').forEach(el => {
      const b = el.dataset.btn;
      let pid = null;
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); pid = e.pointerId;
        try { el.setPointerCapture(pid); } catch (_) { /* ignore */ }
        el.classList.add('on'); Input.press(b);
      });
      const end = e => { if (e.pointerId === pid) { pid = null; el.classList.remove('on'); Input.release(b); } };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('lostpointercapture', end);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
  },
};

/* ---------- scene stack ---------- */
const Scenes = {
  list: [],
  push(s) { this.list.push(s); if (s.enter) s.enter(); return s; },
  remove(s) { const i = this.list.indexOf(s); if (i >= 0) { this.list.splice(i, 1); if (s.leave) s.leave(); } },
  top() { return this.list[this.list.length - 1]; },
  has(s) { return this.list.includes(s); },
  clear() { while (this.list.length) this.remove(this.list[this.list.length - 1]); },
  update() {
    for (const s of this.list) if (s.bgUpdate) s.bgUpdate();   // background animation
    // input goes to the topmost scene that handles updates (pure overlays are skipped)
    for (let i = this.list.length - 1; i >= 0; i--) { const s = this.list[i]; if (s.update) { s.update(); break; } }
  },
  render() {
    let start = 0;
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].opaque) { start = i; break; }
    for (let i = start; i < this.list.length; i++) { const s = this.list[i]; if (s.render && !s.hidden) s.render(); }
  },
};

/* ---------- timers & fades ---------- */
let frameCount = 0;
const Timers = {
  list: [],
  update() {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      if (--t.n <= 0) { this.list.splice(i, 1); t.res(); }
    }
  },
};
function wait(frames) { return new Promise(res => Timers.list.push({ n: Math.max(1, frames | 0), res })); }

const Fade = {
  a: 0, from: 0, to: 0, t: 0, dur: 0, color: '#000', res: null,
  get active() { return this.dur > 0; },
  update() {
    if (this.dur <= 0) return false;
    this.t++;
    this.a = this.from + (this.to - this.from) * Math.min(1, this.t / this.dur);
    if (this.t >= this.dur) { this.dur = 0; this.a = this.to; const r = this.res; this.res = null; if (r) r(); }
    return true;
  },
  render() {
    if (this.a <= 0) return;
    ctx.globalAlpha = Math.min(1, this.a);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = 1;
  },
};
function fadeTo(a, frames = 18, color) {
  return new Promise(res => {
    if (color) Fade.color = color;
    if (Fade.res) { const r = Fade.res; Fade.res = null; r(); }
    Fade.from = Fade.a; Fade.to = a; Fade.t = 0; Fade.dur = Math.max(1, frames); Fade.res = res;
  });
}
const fadeOut = (f = 18, c = '#000') => fadeTo(1, f, c);
const fadeIn = (f = 18) => fadeTo(0, f);

/* screen shake / flash effects (battle etc.) */
const FX = {
  shake: 0, shakeMag: 0, flash: 0, flashColor: '#fff',
  doShake(frames = 12, mag = 3) { this.shake = frames; this.shakeMag = mag; },
  doFlash(frames = 6, color = '#fff') { this.flash = frames; this.flashColor = color; },
  update() { if (this.shake > 0) this.shake--; if (this.flash > 0) this.flash--; },
  offset() { return this.shake > 0 ? [(rnd(3) - 1) * this.shakeMag, (rnd(3) - 1) * this.shakeMag] : [0, 0]; },
  render() {
    if (this.flash > 0) {
      ctx.globalAlpha = Math.min(0.85, this.flash / 6);
      ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, SW, SH);
      ctx.globalAlpha = 1;
    }
  },
};

/* ---------- drawing helpers ---------- */
let _font = '';
function setFont(size) {
  const f = size + 'px ' + FONT;
  if (_font !== f) { ctx.font = f; _font = f; }
}
function drawText(str, x, y, color = COL.white, size = 12, align = 'left') {
  setFont(size);
  ctx.textBaseline = 'top';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function textWidth(str, size = 12) { setFont(size); return ctx.measureText(str).width; }
function fillRect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

/* DQ-style window: black body, 1px white border inset by 2 with cut corners */
function drawWindow(x, y, w, h, border = COL.white, title = null) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = border;
  ctx.fillRect(x + 3, y + 2, w - 6, 1);
  ctx.fillRect(x + 3, y + h - 3, w - 6, 1);
  ctx.fillRect(x + 2, y + 3, 1, h - 6);
  ctx.fillRect(x + w - 3, y + 3, 1, h - 6);
  if (title) {
    const tw = textWidth(title, 12);
    const tx = x + Math.floor((w - tw) / 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(tx - 3, y, tw + 6, 5);
    drawText(title, tx, y - 4, border === COL.white ? COL.white : border, 12);
  }
}
/* ▶ cursor as pixel art (5x7) */
function drawCursor(x, y, color = COL.white) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 7);
  ctx.fillRect(x + 1, y + 1, 1, 5);
  ctx.fillRect(x + 2, y + 2, 1, 3);
  ctx.fillRect(x + 3, y + 3, 1, 1);
}
/* ▼ page prompt */
function drawDownArrow(x, y, color = COL.white) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 7, 1);
  ctx.fillRect(x + 1, y + 1, 5, 1);
  ctx.fillRect(x + 2, y + 2, 3, 1);
  ctx.fillRect(x + 3, y + 3, 1, 1);
}
function drawSprite(img, x, y, flip = false) {
  if (!img) return;
  x = Math.round(x); y = Math.round(y);
  if (!flip) { ctx.drawImage(img, x, y); return; }
  ctx.save();
  ctx.translate(x + img.width, y);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/* word wrap for Japanese text written DQ-style (phrases separated by spaces).
 * returns an array of lines that fit in maxW. Lines of a 「speech」 paragraph
 * after the first get a one-character indent. */
const NO_HEAD = '、。，．！？」』）ー…っゃゅょァィゥェォッャュョ!?.,)';
function wrapText(str, maxW, size = 12) {
  const out = [];
  for (const para of String(str).split('\n')) {
    if (para === '') { out.push(''); continue; }
    const indent = para[0] === '「' ? '　' : '';
    let line = '';
    let first = true;
    const tokens = para.split(/(\s+)/).filter(t => t.length);
    const pushLine = () => { out.push((first ? '' : indent) + line.replace(/\s+$/, '')); line = ''; first = false; };
    for (let tok of tokens) {
      const avail = maxW - (first ? 0 : textWidth(indent, size));
      if (textWidth(line + tok, size) <= avail) { line += tok; continue; }
      if (/^\s+$/.test(tok)) { pushLine(); continue; }
      if (line.trim().length && textWidth(tok, size) <= avail) { pushLine(); line = tok; continue; }
      // break long token by characters
      for (const ch of tok) {
        const av = maxW - (first ? 0 : textWidth(indent, size));
        if (textWidth(line + ch, size) > av && line.length && !NO_HEAD.includes(ch)) pushLine();
        line += ch;
      }
    }
    if (line.length || first) pushLine();
  }
  return out;
}

/* ---------- storage (localStorage + optional claude db per-user saves) ---------- */
const LocalStore = {
  get(k) { try { const v = window.localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (_) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } },
  del(k) { try { window.localStorage.removeItem(k); } catch (_) { /* ignore */ } },
};

const CloudStore = {
  db: null, uid: null, ready: false, chain: Promise.resolve(),
  async init() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      this.db = db; this.uid = uid; this.ready = true;
    } catch (_) { this.ready = false; }
  },
  ref(slot) { return this.db.doc('data/users/' + this.uid + '/save' + slot); },
  async load(slot) {
    if (!this.ready) return null;
    try { const s = await this.ref(slot).get(); return s.exists ? JSON.parse(s.data().json) : null; }
    catch (_) { return null; }
  },
  save(slot, data) {
    if (!this.ready) return Promise.resolve(false);
    const body = { json: JSON.stringify(data), at: Date.now() };
    this.chain = this.chain.then(() => this.ref(slot).set(body).then(() => true, () => false));
    return this.chain;
  },
  remove(slot) {
    if (!this.ready) return Promise.resolve();
    this.chain = this.chain.then(() => this.ref(slot).delete().catch(() => {}));
    return this.chain;
  },
};

/* ---------- main loop ---------- */
const Engine = {
  running: false, last: 0, acc: 0, onTick: null,
  start() {
    ctx = Screen.ctx;
    this.running = true;
    this.last = performance.now();
    const STEP = 1000 / 60;
    const frame = t => {
      this.acc += Math.min(120, t - this.last);
      this.last = t;
      let n = 0;
      while (this.acc >= STEP && n < 4) {
        this.tick();
        this.acc -= STEP; n++;
      }
      if (n >= 4) this.acc = 0;
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },
  tick() {
    frameCount++;
    Timers.update();
    FX.update();
    const fading = Fade.update();
    if (!fading) Scenes.update();
    if (this.onTick) this.onTick();
    Input.endFrame();
  },
  render() {
    const px = Screen.px;
    ctx.setTransform(px, 0, 0, px, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SW, SH);
    const [ox, oy] = FX.offset();
    if (ox || oy) ctx.translate(ox, oy);
    try { Scenes.render(); } catch (e) { console.error(e); }
    if (ox || oy) ctx.setTransform(px, 0, 0, px, 0, 0);
    FX.render();
    Fade.render();
  },
};
