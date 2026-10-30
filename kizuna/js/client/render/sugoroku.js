// 第37回 B: すごろくの 盤の 絵（マス・道・こま・さいころ）
//   盤の 形は shared/data/sugoroku.js。こまの 場所・さいころの 目は サーバーが きめる（ここは 見せるだけ）
//   マスが 画面に 入りきらない 大きな 盤は、こまを 追いかけて 動く（「盤ぜんたい」で ぜんぶ 見る）
// 第50回 D2: 豪華に した
//   ・3Dの さいころが ころころ はねる・こまが ぴょんと 1マスずつ（かげ・ほこり）・カメラが こまを 追って 少し 近づく
//   ・止まった マスの えんしゅつ（金貨・宝箱・わな・ワープの うず・回復の きらきら・星・戦いの ひかり）
//   ・盤ごとの 背景と かざり（草原・砂ばく・空・黄金・伝説）・地下の 道の ほらあな・のこりの 回数と ゴールまでの マス
//   ・ルーレット・竜に 乗って 飛ぶ・落とし穴・はしご・ゴールの 花火と 紙ふぶき
//   ・speed … タップ／A で 3倍の 早さ（ui/sugoroku.js）。時間は ぜんぶ vt（早さを かけた 時間）で すすむ
import { monsterCanvas } from './monsters.js?v=a9ce9cd0de1b';
import { nextOptions } from '../../shared/data/sugoroku.js?v=a9ce9cd0de1b';
import { drawDie3D, dieOrient, rotAxis, mul3, Sparks, drawWheel, firework, rocket, confetti } from './sugoroku-fx.js?v=a9ce9cd0de1b';
import { drawTile, drawIcon, drawBackdrop, drawProps, drawCave, roundRect } from './sugoroku-deco.js?v=a9ce9cd0de1b';

const FONT = "'KizunaDot', 'DotGothic16', monospace";

// マスの 色と しるし
export const SQ_LOOK = {
  start: { c: '#3a6ad0', t: 'スタート', small: true },
  goal: { c: '#e0a818', t: 'ゴール', small: true },
  none: { c: '#7a7a8e', t: '・' },
  gold: { c: '#d8a828', t: 'G' },
  item: { c: '#3a9a5a', t: '道具', small: true },
  inn: { c: '#d85a8a', t: '宿' },
  trap: { c: '#6a2aa0', t: '！' },
  fwd: { c: '#2a8ad8', t: '→' },
  back: { c: '#b85a2a', t: '←' },
  warp: { c: '#18a8b0', t: '◎' },
  event: { c: '#8a5ad8', t: '？' },
  battle: { c: '#c02a2a', t: '戦' },
  chest: { c: '#9a6020', t: '宝' },
  switch: { c: '#4a4a5a', t: '切' },
  dice: { c: '#e8e8f0', t: '' },
  slot: { c: '#d8307a', t: '7' },
  boss: { c: '#4a0818', t: 'ボス', small: true },
  vault: { c: '#c89018', t: '宝部屋', small: true },
  shop: { c: '#1a7a7a', t: '店' },
  star: { c: '#e8c838', t: '★' },
  dragon: { c: '#1f6a3a', t: '竜' },
  sand: { c: '#b89858', t: '砂' },
  // 第50回 D2
  bonus: { c: '#e04a9a', t: '×2' },
  wheel: { c: '#3a2a6a', t: '回' },
  hunt: { c: '#7a4a1a', t: '？' },
  merchant: { c: '#2a8a6a', t: '商' },
  gift: { c: '#5aa8c8', t: '品' },
  cheer: { c: '#f08aa8', t: '応' },
  hole: { c: '#5a4a3a', t: '穴' },
  ladder: { c: '#6a4a2a', t: '上' },
};

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// さいころの はね（[はじめ, おわり, 高さ]）
const BOUNCE = [[0, 0.42, 1], [0.42, 0.68, 0.42], [0.68, 0.86, 0.16], [0.86, 1, 0]];

export class SgBoardView {
  constructor(canvas, board, { sprite } = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.sprite = sprite; // (dir, frame) => キャンバス
    this.run = null;
    this.tok = { x: 0, y: 0, hop: 0, dir: 'down', alpha: 1, scale: 1, rot: 0, lift: 0, squash: 0 };
    this.cam = { x: board.w / 2, y: board.h / 2, init: false };
    this.zoom = 1;
    this.zoomTo = 1;
    this.mode = 'follow';
    this.hl = []; // 光らせる マス（分かれ道・竜の背）
    this.dice = null;
    this.wheel = null;
    this.banner = null;
    this.flash = null;
    this.shake = null;
    this.riding = false; // 竜に 乗って いる
    this.party = false; // ゴールの 紙ふぶき
    this.sp = new Sparks();
    this.speed = 1;
    this.vt = 0;
    this.last = 0;
    this.anims = [];
    this.dpr = 1;
    this.size = { w: 300, h: 300 };
    this.alive = true;
    this.hud = { rolls: null, pulse: -9999 };
    // マスの ある 所・地下の マス・ゴールまでの マス数（スイッチ 0／1）
    this.occ = new Set(board.sq.map((s) => `${s.x},${s.y}`));
    this.under = board.sq.filter((s) => s.under);
    this.dist = [0, 1].map((sw) => goalDist(board, sw));
    this.fit();
    const loop = (now) => {
      if (!this.alive) return;
      if (!this.cv.isConnected) { this.destroy(); return; }
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => this.fit());
      this.ro.observe(this.cv.parentElement || this.cv);
    }
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    // まっている うごきは ぜんぶ おわらせる（まどを とじても 止まらない）
    for (const a of this.anims.splice(0)) { try { a.fn?.(1); } catch { /* */ } a.resolve(); }
  }

  fit() {
    const box = this.cv.parentElement || this.cv;
    const w = Math.max(120, box.clientWidth || 300), h = Math.max(120, box.clientHeight || 300);
    const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    // 大きさが かわらない ときは さわらない（キャンバスが 消えて ちらつく）
    if (w === this.size.w && h === this.size.h && dpr === this.dpr && this.cv.width) return;
    this.dpr = dpr;
    this.size = { w, h };
    this.cv.width = Math.round(w * this.dpr);
    this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = `${w}px`;
    this.cv.style.height = `${h}px`;
    // すぐ かきなおす（ResizeObserver は 絵を かいた あとに よばれる）
    if (this.alive && this.last) this.draw(this.last);
  }

  // ───── 時間（早おくりできる）─────
  frame(now) {
    const dt = this.last ? Math.min(80, now - this.last) : 16;
    this.last = now;
    const vdt = dt * this.speed;
    this.vt += vdt;
    for (const a of this.anims.slice()) {
      const k = a.dur > 0 ? clamp((this.vt - a.t0) / a.dur, 0, 1) : 1;
      a.fn?.(k);
      if (k >= 1) this.endAnim(a);
    }
    this.sp.update(vdt);
    if (this.party && Math.random() < dt / 260) confetti(this.sp, this.size.w, 3);
    this.zoom = lerp(this.zoom, this.zoomTo, 0.08);
    this.draw(now);
  }

  endAnim(a) {
    const i = this.anims.indexOf(a);
    if (i < 0) return;
    this.anims.splice(i, 1);
    clearTimeout(a.timer);
    a.resolve();
  }

  // dur（ミリ秒・早さ 1 の とき）かけて fn(0 → 1)。画面が ねむって いても おわる ように 本当の 時間でも まつ
  anim(dur, fn = null) {
    if (!this.alive) { fn?.(1); return Promise.resolve(); }
    return new Promise((resolve) => {
      const a = { t0: this.vt, dur, fn, resolve };
      a.timer = setTimeout(() => { fn?.(1); this.endAnim(a); }, dur / Math.max(1, this.speed) + 700);
      this.anims.push(a);
    });
  }
  sleep(ms) { return this.anim(ms); }

  // マスの 大きさ（ぜんぶ 入る なら ぜんぶ。入らない なら こまを 追いかける）
  cell() {
    const b = this.board;
    const { w, h } = this.size;
    const all = Math.min(w / (b.w + 0.5), h / (b.h + 0.5));
    if (this.mode === 'all') return all;
    // 入りきる 盤でも スマホでは 少し 大きく（こまを 追う）
    const base = all >= 34 ? clamp(all, 46, 72) : Math.max(40, Math.min(52, all * 1.6));
    return base * this.zoom;
  }

  setRun(run, { snap = false } = {}) {
    if (run && this.hud.rolls !== null && run.rolls !== this.hud.rolls) this.hud.pulse = this.vt;
    this.run = run;
    if (!run) return;
    this.hud.rolls = run.rolls;
    if (snap || this.tok.i === undefined) this.place(run.pos);
  }

  place(i) {
    const s = this.board.sq[i];
    if (!s) return;
    this.tok.i = i;
    this.tok.x = s.x;
    this.tok.y = s.y;
  }

  // ───── こま ─────
  // 1マスずつ ぴょんぴょん（onStep(n) … n 歩め）
  async moveAlong(path, onStep) {
    if (this.mode !== 'all') this.zoomTo = 1.15;
    let n = 0;
    for (const i of path) {
      const s = this.board.sq[i];
      if (!s) continue;
      const fx = this.tok.x, fy = this.tok.y;
      // となりで ない（地下から もどる など）: ふっと 消えて あらわれる
      if (Math.abs(s.x - fx) + Math.abs(s.y - fy) > 1.01) {
        await this.anim(140, (k) => { this.tok.alpha = 1 - k; });
        this.place(i);
        await this.anim(140, (k) => { this.tok.alpha = k; });
        continue;
      }
      this.tok.dir = s.x > fx ? 'right' : s.x < fx ? 'left' : s.y < fy ? 'up' : 'down';
      await this.anim(165, (k) => {
        const e = k < 1 ? k * k * (3 - 2 * k) : 1;
        this.tok.x = lerp(fx, s.x, e);
        this.tok.y = lerp(fy, s.y, e);
        this.tok.hop = Math.sin(k * Math.PI);
      });
      this.tok.hop = 0;
      this.tok.i = i;
      this.tok.squash = 1;
      this.dust(2);
      onStep?.(n++);
      await this.sleep(30);
    }
    this.dust(5);
    this.tok.dir = 'down';
    this.zoomTo = 1;
  }

  dust(n = 3) {
    const { x, y } = this.tok;
    for (let k = 0; k < n; k++) {
      const t = Math.random() * Math.PI * 2;
      this.sp.add({ x: x + 0.5 + Math.cos(t) * 0.15, y: y + 0.66, vx: Math.cos(t) * 0.6, vy: -0.25 - Math.random() * 0.3, g: 0.6, max: 380, size: 0.07, color: 'rgba(255,250,235,0.7)', kind: 'dust' });
    }
  }

  // ワープ・竜の背・落とし穴・はしご（how: warp・dragon・fall・climb）
  async jumpTo(i, how = 'warp') {
    const s = this.board.sq[i];
    if (!s) return;
    const t = this.tok;
    if (how === 'dragon') {
      const fx = t.x, fy = t.y;
      this.riding = true;
      this.zoomTo = this.mode === 'all' ? 1 : 0.9;
      t.dir = s.x >= fx ? 'right' : 'left';
      await this.anim(1150, (k) => {
        const e = k * k * (3 - 2 * k);
        t.x = lerp(fx, s.x, e);
        t.y = lerp(fy, s.y, e);
        t.lift = -Math.sin(k * Math.PI) * 2.2;
        if (Math.random() < 0.4) this.sp.add({ x: t.x + 0.5, y: t.y + 0.5 + t.lift, vx: (Math.random() - 0.5) * 0.4, vy: 0.2, max: 500, size: 0.08, color: '#fff6a0', kind: 'spark', vr: 5 });
      });
      t.lift = 0;
      this.riding = false;
      this.place(i);
      this.zoomTo = 1;
      this.dust(6);
      this.burst('star');
      return;
    }
    if (how === 'fall') {
      this.burst('dustbig');
      await this.anim(380, (k) => { t.scale = 1 - k * 0.8; t.lift = k * 0.3; t.alpha = 1 - k; });
      this.place(i);
      t.lift = -3;
      t.scale = 1;
      await this.sleep(260);
      await this.anim(360, (k) => { t.alpha = Math.min(1, k * 3); t.lift = -3 * (1 - k * k); });
      t.lift = 0;
      t.squash = 1.6;
      this.dust(8);
      this.quake(260, 4);
      return;
    }
    if (how === 'climb') {
      await this.anim(320, (k) => { t.lift = -k * 0.9; t.alpha = 1 - k; });
      this.place(i);
      t.lift = 0.7;
      await this.sleep(220);
      await this.anim(320, (k) => { t.lift = 0.7 * (1 - k); t.alpha = k; });
      t.lift = 0;
      this.burst('heal');
      return;
    }
    // ワープ: うずに すいこまれて、むこうで あらわれる
    this.burst('warp');
    await this.anim(330, (k) => { t.scale = 1 - k; t.rot = k * Math.PI * 3; t.alpha = 1 - k * 0.6; });
    this.place(i);
    await this.sleep(240);
    this.burst('warp');
    await this.anim(330, (k) => { t.scale = k; t.rot = (1 - k) * Math.PI * 3; t.alpha = 0.4 + k * 0.6; });
    t.scale = 1; t.rot = 0; t.alpha = 1;
  }

  // ───── 3Dの さいころ ─────
  // sfx(name, arg) … 音（ui が わたす）
  async rollDice(faces, max = 6, sfx = null) {
    const list = faces.map((v, j) => {
      const ax = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      const l = Math.hypot(...ax) || 1;
      return { v, axis: ax.map((x) => x / l), spin: Math.PI * (5 + Math.random() * 2), off: j - (faces.length - 1) / 2, dly: j * 0.06 };
    });
    this.dice = { list, k: 0, done: false, max };
    sfx?.('sg_throw');
    let seg = 0;
    await this.anim(980, (k) => {
      this.dice.k = k;
      const s2 = BOUNCE.findIndex(([a, b]) => k >= a && k < b);
      if (s2 > seg && s2 > 0) { seg = s2; sfx?.('sg_bounce', seg - 1); }
    });
    this.dice.done = true;
    this.dice.t1 = this.vt;
    sfx?.('sg_dice_stop');
    const tot = faces.reduce((a, x) => a + x, 0);
    const { w, h } = this.size;
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      this.sp.add({ screen: true, x: w / 2 + Math.cos(t) * 30, y: h * 0.5 + Math.sin(t) * 20, vx: Math.cos(t) * 140, vy: Math.sin(t) * 140 - 40, g: 120, max: 600, size: 4, color: '#fff6a0', kind: 'spark', vr: 6 });
    }
    void tot;
    await this.sleep(520);
  }

  hideDice() { this.dice = null; }

  // ───── ルーレット ─────
  // segs … わくの 文字 / pick … 止まる わく（サーバーが きめた）/ sfx(name, arg)
  async spinWheel(segs, pick, sfx = null) {
    const n = segs.length, step = (Math.PI * 2) / n;
    const end = Math.PI * 2 * 4 + ((n - pick) % n) * step + (Math.random() - 0.5) * step * 0.5;
    this.wheel = { segs, ang: 0, hi: -1, pop: 0 };
    await this.anim(220, (k) => { this.wheel.pop = k; });
    let lastSeg = 0;
    await this.anim(1750, (k) => {
      this.wheel.ang = end * easeOut(k);
      const sg = Math.floor((this.wheel.ang + step / 2) / step);
      if (sg !== lastSeg) { lastSeg = sg; sfx?.('sg_tick', sg); }
    });
    this.wheel.hi = pick;
    sfx?.('sg_wheel_stop');
    await this.sleep(650);
    await this.anim(180, (k) => { if (this.wheel) this.wheel.pop = 1 - k; });
    this.wheel = null;
  }

  // ───── えんしゅつ ─────
  // kind: coins・chest・item・trap・buzz・warp・heal・star・battle・jackpot・bonus・switch・cheer・merchant・dustbig
  burst(kind, opt = {}) {
    const x = this.tok.x + 0.5, y = this.tok.y + 0.5;
    const sp = this.sp;
    const R = () => Math.random();
    switch (kind) {
      case 'coins':
        for (let i = 0; i < 12; i++) sp.add({ x, y: y - 0.1, vx: (R() - 0.5) * 2.4, vy: -2.4 - R() * 1.6, g: 7, max: 900, size: 0.13, kind: 'coin', vr: 10 + R() * 8 });
        sp.add({ x, y: y - 0.7, vy: -0.6, max: 900, size: 0.42, kind: 'text', text: opt.text || '＋G', color: '#ffe070' });
        break;
      case 'merchant':
        for (let i = 0; i < 6; i++) sp.add({ x, y: y - 0.1, vx: (R() - 0.5) * 1.6, vy: -2 - R(), g: 6, max: 800, size: 0.11, kind: 'coin', vr: 10 });
        sp.add({ x, y: y - 0.8, vy: -0.4, max: 1100, size: 0.38, kind: 'text', text: '半額！', color: '#ffe84a', stroke: '#8a1a1a' });
        break;
      case 'chest':
        sp.add({ x: x + 0.55, y: y + 0.1, max: 1400, size: 0.6, kind: 'chest' });
        for (let i = 0; i < 10; i++) sp.add({ x: x + (R() - 0.5) * 0.5, y: y - 0.6, vx: (R() - 0.5) * 1.5, vy: -1.5 - R() * 1.5, g: 2, max: 1000, size: 0.09, color: '#fff6a0', kind: 'spark', vr: 6 });
        break;
      case 'item':
        for (let i = 0; i < 8; i++) sp.add({ x: x + (R() - 0.5) * 0.6, y, vx: 0, vy: -0.8 - R(), max: 800, size: 0.08, color: '#c8ffd8', kind: 'spark', vr: 5 });
        sp.add({ x, y: y - 0.2, max: 600, size: 0.8, color: 'rgba(200,255,220,0.8)', kind: 'ring' });
        break;
      case 'trap':
        sp.add({ x, y: y + 0.25, max: 800, size: 0.32, kind: 'spikes' });
        this.quake(320, 6);
        this.flashScreen('rgba(255,40,40,0.35)', 260);
        break;
      case 'buzz':
        for (let i = 0; i < 5; i++) sp.add({ x: x + (R() - 0.5) * 0.4, y: y - 0.3, vx: (R() - 0.5) * 0.6, vy: -0.4, max: 700, size: 0.12, color: 'rgba(120,120,140,0.6)', kind: 'dust' });
        this.quake(200, 3);
        break;
      case 'warp':
        for (let i = 0; i < 3; i++) sp.add({ x, y, max: 600 + i * 120, size: 0.7, color: ['#5af0ff', '#c88aff', '#ffffff'][i], kind: 'swirl', vr: 9 + i * 2 });
        for (let i = 0; i < 10; i++) {
          const t = R() * Math.PI * 2;
          sp.add({ x: x + Math.cos(t) * 0.8, y: y + Math.sin(t) * 0.8, vx: -Math.cos(t) * 1.4, vy: -Math.sin(t) * 1.4, max: 550, size: 0.07, color: '#a8f8ff', kind: 'spark', vr: 6 });
        }
        break;
      case 'heal':
        for (let i = 0; i < 12; i++) sp.add({ x: x + (R() - 0.5) * 0.8, y: y + 0.2, vy: -0.9 - R() * 0.8, max: 1000, size: 0.08 + R() * 0.05, color: i % 3 ? '#a8ffb8' : '#ffffff', kind: i % 4 ? 'spark' : 'plus', vr: 3 });
        sp.add({ x, y: y + 0.1, max: 700, size: 0.9, color: 'rgba(160,255,190,0.8)', kind: 'ring' });
        break;
      case 'star':
        for (let i = 0; i < 14; i++) {
          const t = (i / 14) * Math.PI * 2;
          sp.add({ x, y: y - 0.2, vx: Math.cos(t) * 2.2, vy: Math.sin(t) * 2.2, drag: 0.05, max: 800, size: 0.12, color: i % 2 ? '#ffe84a' : '#ffffff', kind: 'star', vr: 4 });
        }
        break;
      case 'battle':
        this.flashScreen('rgba(255,255,255,0.8)', 220);
        this.quake(300, 5);
        sp.add({ x, y: y - 0.6, max: 900, size: 0.5, kind: 'text', text: '戦い！', color: '#ff6a5a', stroke: '#2a0808' });
        for (let i = 0; i < 8; i++) {
          const t = (i / 8) * Math.PI * 2;
          sp.add({ x, y, vx: Math.cos(t) * 3, vy: Math.sin(t) * 3, drag: 0.08, max: 450, size: 0.1, color: '#ffb84a', kind: 'spark', vr: 8 });
        }
        break;
      case 'jackpot':
        sp.add({ x, y: y - 0.3, max: 1200, size: 1.6, color: 'rgba(255,240,150,0.9)', kind: 'rays', vr: 1.5 });
        for (let i = 0; i < 18; i++) sp.add({ x, y: y - 0.2, vx: (R() - 0.5) * 3, vy: -2.5 - R() * 2, g: 6, max: 1100, size: 0.13, kind: i % 2 ? 'coin' : 'star', color: '#ffe84a', vr: 10 });
        this.flashScreen('rgba(255,240,160,0.5)', 300);
        break;
      case 'bonus':
        this.showBanner('ボーナスチャンス！', '#ffe84a', '#a81a5a');
        sp.add({ x, y: y - 0.7, vy: -0.3, max: 1300, size: 0.6, kind: 'text', text: '×2', color: '#fff6a0', stroke: '#a81a5a' });
        for (let i = 0; i < 16; i++) {
          const t = (i / 16) * Math.PI * 2;
          sp.add({ x, y, vx: Math.cos(t) * 2.6, vy: Math.sin(t) * 2.6, drag: 0.06, max: 900, size: 0.1, color: ['#ff8ae8', '#ffe84a', '#8ae8ff'][i % 3], kind: 'star', vr: 6 });
        }
        break;
      case 'cheer':
        for (let i = 0; i < 9; i++) sp.add({ x: x + (R() - 0.5) * 0.9, y: y - 0.2, vx: (R() - 0.5) * 0.5, vy: -1 - R() * 0.8, max: 1200, size: 0.1 + R() * 0.05, color: i % 2 ? '#ff6a8a' : '#ffb0c8', kind: 'heart' });
        if (opt.name) sp.add({ x, y: y - 1.0, vy: -0.25, max: 1700, size: 0.3, kind: 'text', text: `${opt.name}のおうえん！`, color: '#ffffff', stroke: '#c0285a' });
        break;
      case 'gift':
        if (opt.sp) {
          const img = monsterCanvas(opt.sp, 0, 32);
          if (img) sp.add({ x: x + 0.85, y: y + 0.3, max: 1800, size: 0.5, kind: 'img', img });
        }
        for (let i = 0; i < 5; i++) sp.add({ x: x + 0.85, y: y - 0.4, vx: (R() - 0.5) * 0.6, vy: -0.7, max: 1000, size: 0.09, color: '#ff8ab0', kind: 'heart' });
        break;
      case 'switch':
        sp.add({ x, y, max: 500, size: 1.2, color: 'rgba(255,255,160,0.9)', kind: 'ring' });
        this.quake(150, 2);
        break;
      case 'dustbig':
        for (let i = 0; i < 10; i++) sp.add({ x: x + (R() - 0.5) * 0.8, y: y + 0.2, vx: (R() - 0.5) * 1.2, vy: -0.5 - R() * 0.5, g: 1, max: 600, size: 0.1, color: 'rgba(160,120,80,0.7)', kind: 'dust' });
        break;
      default:
    }
  }

  quake(ms, amp) { this.shake = { t0: this.vt, dur: ms, amp }; }
  flashScreen(col, ms) { this.flash = { col, t0: this.vt, dur: ms }; }
  showBanner(text, color = '#ffe84a', stroke = '#5a2a08') { this.banner = { text, color, stroke, t0: this.vt, dur: 1500 }; }

  // ゴール！（花火・紙ふぶき）
  celebrate() {
    const { w, h } = this.size;
    this.showBanner('ゴール！', '#ffe84a', '#a8281a');
    this.banner.dur = 2600;
    this.party = true;
    confetti(this.sp, w, 60);
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.alive) return;
        const x = w * (0.15 + Math.random() * 0.7);
        rocket(this.sp, x, h, h * (0.15 + Math.random() * 0.25), (fx, fy) => { firework(this.sp, fx, fy, 0.8 + Math.random() * 0.5); this.onPop?.(); });
      }, i * 380);
    }
  }

  // 画面の 点 → マス（タップで 分かれ道を 選ぶ）
  squareAt(px, py) {
    const { ox, oy, c } = this.view || {};
    if (!c) return null;
    const gx = (px - ox) / c, gy = (py - oy) / c;
    return this.board.sq.find((s) => Math.abs(s.x + 0.5 - gx) < 0.5 && Math.abs(s.y + 0.5 - gy) < 0.5) || null;
  }

  // ゴールまでの マス（いちばん 近い 道）
  goalLeft() {
    const r = this.run;
    if (!r) return null;
    // こまの いる マス（うごいて いる とちゅうも）
    const d = this.dist[r.sw ? 1 : 0][this.tok.i ?? r.pos];
    return Number.isFinite(d) ? d : null;
  }

  draw(now) {
    const { ctx } = this;
    const b = this.board;
    const { w, h } = this.size;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // カメラ（マスの 目で こまを 追う。入りきる なら まん中）
    const c = this.cell();
    const half = (view) => view / (2 * c) - 0.3;
    const want = (n, view, t) => (n * c <= view ? n / 2 : clamp(t, half(view), n - half(view)));
    const wx = want(b.w, w, this.tok.x + 0.5), wy = want(b.h, h, this.tok.y + 0.5 + Math.min(0, this.tok.lift) * 0.5);
    if (!this.cam.init) { this.cam.x = wx; this.cam.y = wy; this.cam.init = true; }
    this.cam.x = lerp(this.cam.x, wx, 0.14);
    this.cam.y = lerp(this.cam.y, wy, 0.14);
    let ox = w / 2 - this.cam.x * c, oy = h / 2 - this.cam.y * c;
    if (this.shake) {
      const k = (this.vt - this.shake.t0) / this.shake.dur;
      if (k >= 1) this.shake = null;
      else { ox += (Math.random() - 0.5) * this.shake.amp * 2 * (1 - k); oy += (Math.random() - 0.5) * this.shake.amp * 2 * (1 - k); }
    }
    this.view = { ox, oy, c };
    drawBackdrop(ctx, w, h, now, b.theme, ox, oy);
    drawProps(ctx, b, this.occ, ox, oy, c, now, w, h);
    drawCave(ctx, this.under, ox, oy, c, now);
    const run = this.run;
    const sw = run?.sw || 0;
    const cx = (s) => ox + (s.x + 0.5) * c, cy = (s) => oy + (s.y + 0.5) * c;
    // 道（ふちどり → 道 → まん中の 点線）
    ctx.lineCap = 'round';
    const roads = [];
    for (const s of b.sq) {
      s.next.forEach((n, k) => {
        let closed = false;
        if (s.gate !== undefined && s.next.length > 1) closed = k !== ((s.gate === 1) === !!sw ? 1 : 0);
        roads.push([s, b.sq[n], closed]);
      });
    }
    for (const pass of [0, 1, 2]) {
      for (const [s, t, closed] of roads) {
        if (closed && pass !== 1) continue;
        ctx.setLineDash(pass === 2 ? [c * 0.08, c * 0.14] : closed ? [c * 0.12, c * 0.12] : []);
        ctx.strokeStyle = pass === 0 ? 'rgba(60,30,10,0.45)' : pass === 2 ? 'rgba(255,255,255,0.55)' : closed ? 'rgba(40,20,20,0.45)' : s.under ? '#a88a6a' : 'rgba(255,244,214,0.95)';
        ctx.lineWidth = pass === 0 ? c * 0.34 : pass === 1 ? c * 0.24 : Math.max(1.5, c * 0.04);
        ctx.beginPath();
        ctx.moveTo(cx(s), cy(s));
        ctx.lineTo(cx(t), cy(t));
        ctx.stroke();
        if (closed && pass === 1) {
          ctx.setLineDash([]);
          const mx = (cx(s) + cx(t)) / 2, my = (cy(s) + cy(t)) / 2;
          ctx.strokeStyle = '#ff5a4a';
          ctx.lineWidth = Math.max(2, c * 0.08);
          const r = c * 0.13;
          ctx.beginPath();
          ctx.moveTo(mx - r, my - r); ctx.lineTo(mx + r, my + r);
          ctx.moveTo(mx + r, my - r); ctx.lineTo(mx - r, my + r);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
    // マス
    const pulse = 0.5 + 0.5 * Math.sin(now / 160);
    for (const s of b.sq) {
      const L = SQ_LOOK[s.t] || SQ_LOOK.none;
      const x = ox + s.x * c, y = oy + s.y * c;
      if (x < -c || y < -c || x > w + c || y > h + c) continue;
      const pad = c * 0.07, sz = c - pad * 2;
      const done = (s.t === 'star' && run?.stars?.includes(s.i)) || (s.t === 'boss' && run?.bosses?.includes(s.boss));
      drawTile(ctx, s, x, y, c, L, { done, now, under: s.under });
      if (s.t === 'dice') drawDieFace(ctx, x + c / 2, y + c / 2, sz * 0.62, 5, '#fff', '#2a2a3a');
      else if (s.t === 'boss' && !done) {
        const sp = b.bosses?.[s.boss]?.group?.[0]?.[0];
        const img = sp ? monsterCanvas(sp, Math.floor(now / 400) % 2, 24) : null;
        if (img) {
          const k = (sz * 0.86) / Math.max(img.width, img.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, x + c / 2 - (img.width * k) / 2, y + c / 2 - (img.height * k) / 2, img.width * k, img.height * k);
        }
      } else if (done || !drawIcon(ctx, s.t, x + c / 2, y + c / 2, sz, now, s)) {
        let t = L.t;
        if ((s.t === 'fwd' || s.t === 'back') && s.n) t = s.t === 'fwd' ? `→${s.n}` : `${s.n}←`;
        ctx.fillStyle = s.t === 'star' && !done ? '#7a4a08' : s.t === 'goal' || s.t === 'gold' || s.t === 'sand' ? '#3a2208' : '#fff';
        const fs = L.small || t.length > 1 ? Math.max(9, sz * (t.length >= 3 ? 0.27 : 0.36)) : sz * 0.56;
        ctx.font = `${Math.round(fs)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, x + c / 2, y + c / 2 + 1);
      }
      // 分かれ道・竜の背の 行き先
      const k = this.hl.indexOf(s.i);
      if (k >= 0) {
        ctx.strokeStyle = `rgba(255,255,140,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 4;
        roundRect(ctx, x + pad - 3, y + pad - 3, sz + 6, sz + 6, c * 0.2);
        ctx.stroke();
        ctx.fillStyle = '#ffe84a';
        ctx.beginPath();
        ctx.arc(x + c - pad - 2, y + pad + 2, c * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1a08';
        ctx.font = `${Math.round(c * 0.24)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(k + 1), x + c - pad - 2, y + pad + 3);
      }
    }
    const toPx = (gx, gy) => [ox + gx * c, oy + gy * c];
    this.drawToken(ctx, ox, oy, c, now);
    this.sp.draw(ctx, toPx, c, false);
    this.drawHud(ctx, w, h, now);
    // 画面の えんしゅつ
    if (this.wheel) {
      const r = Math.min(w, h) * 0.34 * (0.3 + 0.7 * easeOut(this.wheel.pop));
      ctx.fillStyle = `rgba(0,0,0,${0.35 * this.wheel.pop})`;
      ctx.fillRect(0, 0, w, h);
      drawWheel(ctx, w / 2, h * 0.52, r, this.wheel.segs, this.wheel.ang, this.wheel.hi, now);
    }
    if (this.dice) this.drawDice(ctx, w, h);
    this.sp.draw(ctx, toPx, c, true);
    if (this.banner) {
      const k = (this.vt - this.banner.t0) / this.banner.dur;
      if (k >= 1) this.banner = null;
      else {
        const pop = k < 0.12 ? 0.4 + (k / 0.12) * 0.8 : k < 0.2 ? 1.2 - ((k - 0.12) / 0.08) * 0.2 : 1;
        ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
        const fs = Math.min((w * 0.86) / this.banner.text.length, h * 0.14) * pop;
        ctx.font = `${Math.round(fs)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, fs * 0.14);
        ctx.strokeStyle = this.banner.stroke;
        const by = h * 0.3 + Math.sin(now / 200) * 3;
        ctx.strokeText(this.banner.text, w / 2, by);
        ctx.fillStyle = this.banner.color;
        ctx.fillText(this.banner.text, w / 2, by);
        ctx.globalAlpha = 1;
      }
    }
    if (this.flash) {
      const k = (this.vt - this.flash.t0) / this.flash.dur;
      if (k >= 1) this.flash = null;
      else {
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = this.flash.col;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawToken(ctx, ox, oy, c, now) {
    const t = this.tok;
    if (!this.sprite || t.i === undefined) return;
    const img = this.sprite(t.dir, t.hop > 0 || this.riding ? 1 : 0);
    if (!img) return;
    const gx = ox + (t.x + 0.5) * c, gy = oy + (t.y + 0.62) * c;
    const air = t.hop * 0.42 + Math.max(0, -t.lift);
    ctx.globalAlpha = t.alpha;
    // かげ（高いと 小さく うすく）
    ctx.fillStyle = `rgba(0,0,0,${0.32 / (1 + air)})`;
    ctx.beginPath();
    ctx.ellipse(gx, gy, (c * 0.28) / (1 + air * 0.5), (c * 0.09) / (1 + air * 0.5), 0, 0, Math.PI * 2);
    ctx.fill();
    // 足もとの わ（自分の こま）
    if (!this.riding && t.lift === 0) {
      ctx.strokeStyle = `rgba(255,240,120,${0.35 + 0.25 * Math.sin(now / 250)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(gx, gy, c * 0.32, c * 0.11, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    t.squash = Math.max(0, t.squash - 0.12);
    const sq = Math.sin(t.squash * 1.2) * 0.12;
    const hgt = c * 1.05 * t.scale;
    const k = hgt / img.height;
    const iw = img.width * k * (1 + sq), ih = img.height * k * (1 - sq);
    const by = gy - air * c + Math.sin(now / 300) * 1.2;
    ctx.save();
    ctx.translate(gx, by);
    if (this.riding) {
      // 竜の 上に 乗る
      ctx.save();
      ctx.translate(0, -c * 0.05);
      drawDragonUnder(ctx, c * 0.62, this.vt, t.dir === 'left');
      ctx.restore();
      ctx.translate(0, -c * 0.18);
    }
    if (t.rot) ctx.rotate(t.rot);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -iw / 2, -ih, iw, ih);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // のこりの 回数・ゴールまで・ボーナス（盤の 上に）
  drawHud(ctx, w, h, now) {
    const run = this.run;
    if (!run) return;
    const fs = Math.max(11, Math.min(16, w / 26));
    const pk = clamp((this.vt - this.hud.pulse) / 600, 0, 1);
    const pop = pk < 1 ? 1 + Math.sin(pk * Math.PI) * 0.25 : 1;
    // のこり（さいころ）
    const ph = fs * 2.3;
    ctx.font = `${Math.round(fs * 0.8)}px ${FONT}`;
    const w1 = ctx.measureText('のこり').width;
    ctx.font = `${Math.round(fs * 1.5)}px ${FONT}`;
    const w2 = ctx.measureText(String(run.rolls)).width;
    ctx.font = `${Math.round(fs * 0.8)}px ${FONT}`;
    const w3 = ctx.measureText('回').width;
    const pw = ph * 0.95 + w1 + w2 + w3 + fs * 1.4;
    ctx.fillStyle = 'rgba(20,12,40,0.72)';
    roundRect(ctx, 6, 6, pw, ph, ph / 2);
    ctx.fill();
    ctx.strokeStyle = run.rolls <= 2 ? `rgba(255,120,120,${0.6 + 0.4 * Math.sin(now / 150)})` : 'rgba(255,230,150,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawDieFace(ctx, 6 + ph / 2, 6 + ph / 2, ph * 0.62, Math.max(1, Math.min(6, run.rolls || 1)), '#fff', '#d0202a');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let tx = 6 + ph * 0.95;
    ctx.fillStyle = '#e8e0ff';
    ctx.fillText('のこり', tx, 6 + ph / 2);
    tx += w1 + fs * 0.3;
    ctx.font = `${Math.round(fs * 1.5 * pop)}px ${FONT}`;
    ctx.fillStyle = run.rolls <= 2 ? '#ff9a8a' : '#ffe84a';
    ctx.fillText(`${run.rolls}`, tx, 6 + ph / 2 + 1);
    tx += w2 + fs * 0.3;
    ctx.font = `${Math.round(fs * 0.8)}px ${FONT}`;
    ctx.fillStyle = '#e8e0ff';
    ctx.fillText('回', tx, 6 + ph / 2);
    // ゴールまで
    const left = this.goalLeft();
    if (left !== null) {
      const txt = left === 0 ? 'ゴール！' : `ゴールまで${left}マス`;
      ctx.font = `${Math.round(fs * 0.85)}px ${FONT}`;
      const tw = ctx.measureText(txt).width + fs * 1.4;
      ctx.fillStyle = 'rgba(20,12,40,0.72)';
      roundRect(ctx, w - tw - 6, 6, tw, fs * 1.8, fs * 0.9);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(txt, w - tw / 2 - 6, 6 + fs * 0.9 + 1);
    }
    // ボーナス
    if (run.bonus) {
      const a = 0.75 + 0.25 * Math.sin(now / 120);
      ctx.font = `${Math.round(fs * 0.9)}px ${FONT}`;
      const txt = '×2 ボーナス中';
      const tw = ctx.measureText(txt).width + fs * 1.2;
      ctx.fillStyle = `rgba(224,74,154,${a})`;
      roundRect(ctx, 6, 10 + ph, tw, fs * 1.7, fs * 0.85);
      ctx.fill();
      ctx.fillStyle = '#fff6a0';
      ctx.textAlign = 'center';
      ctx.fillText(txt, 6 + tw / 2, 10 + ph + fs * 0.85 + 1);
    }
  }

  drawDice(ctx, w, h) {
    const d = this.dice;
    const ds = Math.min(w, h) * (d.list.length > 1 ? 0.2 : 0.24);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);
    const ground = h * 0.56;
    for (const it of d.list) {
      const k = clamp((d.k - it.dly) / (1 - it.dly), 0, 1);
      const fxp = w / 2 + it.off * ds * 1.45;
      const x = lerp(fxp - w * 0.42, fxp, easeOut(Math.min(1, k / 0.8)));
      let hh = 0;
      const seg = BOUNCE.find(([a, b]) => k >= a && k < b);
      if (seg && seg[2] > 0) {
        const u = (k - seg[0]) / (seg[1] - seg[0]);
        const u2 = seg[0] === 0 ? 0.3 + 0.7 * u : u;
        hh = seg[2] * 4 * u2 * (1 - u2);
      }
      const y = ground - hh * ds * 1.8;
      const base = d.max > 6 ? dieOrient(1) : dieOrient(it.v);
      const rot = d.done ? base : mul3(base, rotAxis(it.axis, it.spin * (1 - easeOut(k))));
      // かげ
      ctx.fillStyle = `rgba(0,0,0,${0.4 / (1 + hh * 2)})`;
      ctx.beginPath();
      ctx.ellipse(x, ground + ds * 0.62, ds * 0.6 / (1 + hh), ds * 0.16 / (1 + hh), 0, 0, Math.PI * 2);
      ctx.fill();
      const v = it.v;
      const label = d.max > 6 ? (slot) => (slot === 1 ? v : ((v + slot * 5) % 12) + 1) : null;
      const glow = d.done ? clamp(1 - (this.vt - d.t1) / 500, 0, 1) : 0;
      drawDie3D(ctx, x, y, ds, rot, { gold: d.max > 6, label, glow });
    }
    if (d.done) {
      const tot = d.list.reduce((a, x) => a + x.v, 0);
      const k = clamp((this.vt - d.t1) / 250, 0, 1);
      const fs = ds * 0.55 * (0.6 + 0.4 * easeOut(k)) * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.4 : 1);
      ctx.font = `${Math.round(fs)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(4, fs * 0.16);
      ctx.strokeStyle = '#2a1408';
      const txt = d.list.length > 1 ? `${d.list.map((x) => x.v).join('＋')}＝${tot}` : `${tot}！`;
      ctx.strokeText(txt, w / 2, ground + ds * 1.25);
      ctx.fillStyle = '#ffe84a';
      ctx.fillText(txt, w / 2, ground + ds * 1.25);
    }
  }
}

// 竜（こまの 下）
function drawDragonUnder(ctx, sz, t, flip) {
  ctx.save();
  if (flip) ctx.scale(-1, 1);
  const flap = Math.sin(t / 90);
  ctx.lineWidth = Math.max(1, sz * 0.05);
  ctx.strokeStyle = '#0a3a1a';
  for (const s of [1, -1]) {
    ctx.fillStyle = s > 0 ? '#1f7a44' : '#3aba6a';
    ctx.beginPath();
    ctx.moveTo(-sz * 0.1, -sz * 0.05);
    ctx.quadraticCurveTo(-sz * 0.5, -sz * (0.6 + flap * 0.5), -sz * 1.0, -sz * (0.45 + flap * 0.6));
    ctx.lineTo(-sz * 0.55, -sz * 0.02);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#2a9a5a';
  ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.7, sz * 0.26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-sz * 0.6, 0); ctx.quadraticCurveTo(-sz * 1.05, sz * 0.2, -sz * 1.25, -sz * 0.12); ctx.lineTo(-sz * 0.55, -sz * 0.1); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(sz * 0.8, -sz * 0.16, sz * 0.26, sz * 0.18, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe84a';
  ctx.beginPath(); ctx.arc(sz * 0.88, -sz * 0.21, sz * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ゴールまでの マス数（スイッチ sw のとき。落とし穴・はしごは 0マスで とぶ）
function goalDist(b, sw) {
  const d = b.sq.map(() => Infinity);
  d[b.goalAt] = 0;
  for (let it = 0; it < b.sq.length + 2; it++) {
    let ch = false;
    for (const s of b.sq) {
      let best = d[s.i];
      if ((s.t === 'hole' || s.t === 'ladder') && Number.isInteger(s.to)) best = Math.min(best, d[s.to] + (s.t === 'hole' ? 1 : 0));
      if (s.t !== 'ladder') for (const n of nextOptions(b, s.i, sw)) best = Math.min(best, d[n] + 1);
      if (best < d[s.i]) { d[s.i] = best; ch = true; }
    }
    if (!ch) break;
  }
  return d;
}

// さいころの 目（7より 大きい 数は 数字）
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
export function drawDieFace(ctx, cx, cy, size, n, face = '#fff', pip = '#c0202a') {
  roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.18);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.stroke();
  if (PIPS[n]) {
    for (const [dx, dy] of PIPS[n]) {
      ctx.fillStyle = n === 1 ? pip : '#1a1a2a';
      ctx.beginPath();
      ctx.arc(cx + dx * size * 0.26, cy + dy * size * 0.26, size * (n === 1 ? 0.13 : 0.085), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#1a1a2a';
    ctx.font = `${Math.round(size * 0.55)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), cx, cy + 1);
  }
}

// さいころの 絵（ボタンに つかう 小さな 画像）
const dieCache = new Map();
export function dieURL(n = 5, gold = false) {
  const key = `${n}:${gold}`;
  if (dieCache.has(key)) return dieCache.get(key);
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas');
  cv.width = 40;
  cv.height = 40;
  drawDieFace(cv.getContext('2d'), 20, 20, 34, n, gold ? '#ffd84a' : '#fff');
  const u = cv.toDataURL();
  dieCache.set(key, u);
  return u;
}
