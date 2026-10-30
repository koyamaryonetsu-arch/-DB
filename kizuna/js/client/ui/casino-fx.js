// 第50回 N5: カジノの 当たりの 演出（スロット・ルーレット・ポーカー・すごろく場で つかう）
//   celebrate(game, { level, title, sub }) … 画面の 上に コインの 雨・光・大きな 文字を 出す
//     level: 'tiny'（光るだけ）・'small'（当たり！ 約1びょう）・'big'（大当たり！ 約2びょう）・'jackpot'（約2.6びょう）
//   タップを じゃましない（pointer-events: none）。つぎの 勝負を はじめると stopFx() で すぐ 消える
//   casinoSfx(game, id) … カジノだけの 音（audio.js の tone・noise で その場で 作る）
import { el } from './dom.js?v=a9ce9cd0de1b';

const DUR = { tiny: 700, small: 1100, big: 2100, jackpot: 2600 };
const COINS = { tiny: 0, small: 16, big: 46, jackpot: 90 };
let cur = null;

// 当たりの 大きさ（かけた 数の 何倍 もどったか）→ level
export function winLevel(ratio, { big = 4, jackpot = 20 } = {}) {
  if (ratio >= jackpot) return 'jackpot';
  if (ratio >= big) return 'big';
  if (ratio > 1) return 'small';
  return 'tiny';
}

export function stopFx() {
  if (!cur) return;
  cur.end();
  cur = null;
}

export function celebrate(game, { level = 'small', title = '', sub = '', sound = true } = {}) {
  stopFx();
  ensureFxStyle();
  const ui = document.getElementById('ui');
  if (!ui) return;
  const dur = DUR[level] || DUR.small;
  const calm = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const cv = el('canvas', { class: 'cfx-cv' });
  const layer = el('div', { class: `cfx cfx-${level}`, 'aria-hidden': 'true' });
  if (level === 'big' || level === 'jackpot') layer.append(el('div', { class: 'cfx-flash' }));
  if (level === 'jackpot') layer.append(el('div', { class: 'cfx-rays' }));
  layer.append(cv);
  if (title) layer.append(el('div', { class: 'cfx-banner' }, el('div', { class: 'cfx-title', text: title }), sub ? el('div', { class: 'cfx-sub', text: sub }) : ''));
  layer.style.setProperty('--cfx-dur', `${dur}ms`);
  ui.append(layer);
  const panel = ui.querySelector('.casino-panel');
  const lightCls = level === 'tiny' ? '' : `cfx-lights-${level}`;
  if (panel && lightCls) panel.classList.add(lightCls);
  if (sound) playWinSound(game, level);

  // コインの 雨（キャンバス 1まい。こまかさは 画面の 大きさ そのまま・dpr は 1）
  const w = (cv.width = Math.max(1, Math.round(layer.clientWidth || innerWidth)));
  const h = (cv.height = Math.max(1, Math.round(layer.clientHeight || innerHeight)));
  const ctx = cv.getContext('2d');
  const n = calm ? Math.round(COINS[level] / 4) : COINS[level];
  const sz = Math.max(14, Math.min(28, Math.round(Math.min(w, h) / 22)));
  const ps = [];
  for (let i = 0; i < n; i++) {
    const burst = level === 'jackpot' && i % 3 === 0; // 大当たりは まん中から はじける ぶんも
    const a = Math.random() * Math.PI * 2;
    const sp = 0.35 + Math.random() * 0.55;
    ps.push(burst
      ? { x: w / 2, y: h * 0.42, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.45, t0: Math.random() * 200, spin: Math.random() * 6, vs: 0.01 + Math.random() * 0.02, s: sz * (0.8 + Math.random() * 0.5) }
      : { x: Math.random() * w, y: -sz - Math.random() * h * 0.5, vx: (Math.random() - 0.5) * 0.08, vy: 0.18 + Math.random() * 0.22, t0: Math.random() * dur * 0.35, spin: Math.random() * 6, vs: 0.006 + Math.random() * 0.012, s: sz * (0.7 + Math.random() * 0.6) });
  }
  const spark = Array.from({ length: n ? Math.round(n / 3) : 0 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.8, t0: Math.random() * dur * 0.8, s: 2 + Math.random() * 3 }));
  const sprite = coinSprite();
  const t0 = performance.now();
  let raf = 0;
  const frame = (now) => {
    const t = now - t0;
    ctx.clearRect(0, 0, w, h);
    const fade = Math.min(1, Math.max(0, (dur - t) / 350));
    ctx.globalAlpha = fade;
    for (const p of ps) {
      const tt = t - p.t0;
      if (tt < 0) continue;
      const x = p.x + p.vx * tt;
      const y = p.y + p.vy * tt + 0.00045 * tt * tt;
      if (y > h + p.s) continue;
      const sx = Math.abs(Math.cos(p.spin + tt * p.vs)); // くるくる まわる（よこはばが かわる）
      ctx.drawImage(sprite, x - (p.s * sx) / 2, y - p.s / 2, Math.max(1, p.s * sx), p.s);
    }
    // キラキラ
    ctx.fillStyle = '#fff8d0';
    for (const s of spark) {
      const k = (t - s.t0) / 400;
      if (k < 0 || k > 1) continue;
      const r = s.s * Math.sin(k * Math.PI);
      ctx.fillRect(s.x - r * 2, s.y - 0.75, r * 4, 1.5);
      ctx.fillRect(s.x - 0.75, s.y - r * 2, 1.5, r * 4);
    }
    ctx.globalAlpha = 1;
    if (t < dur) raf = requestAnimationFrame(frame);
    else me.end();
  };
  const me = {
    end() {
      cancelAnimationFrame(raf);
      layer.remove();
      if (panel && lightCls) panel.classList.remove(lightCls);
      if (cur === me) cur = null;
    },
  };
  cur = me;
  raf = requestAnimationFrame(frame);
  return me;
}

// 金の コイン（1回だけ 作る）
let spriteCv = null;
function coinSprite() {
  if (spriteCv) return spriteCv;
  const S = 32;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.38, S * 0.32, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#fff6c0');
  g.addColorStop(0.45, '#ffd84a');
  g.addColorStop(1, '#b07a10');
  x.fillStyle = g;
  x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#8a5a08';
  x.lineWidth = 2;
  x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#8a5a08';
  x.fillRect(S / 2 - 2, 9, 4, S - 18);
  spriteCv = c;
  return c;
}

// ───────────── 音 ─────────────
function playWinSound(game, level) {
  if (level === 'jackpot') {
    game.audio.play('jackpot');
    casinoSfx(game, 'shower');
  } else if (level === 'big') casinoSfx(game, 'fanfare');
  else if (level === 'small') game.audio.sfx('win');
  else game.audio.sfx('coin');
}

export function casinoSfx(game, id) {
  const a = game.audio;
  if (!a?.ctx) return;
  const T = (...x) => a.tone(...x);
  switch (id) {
    // パパパパーン（大当たり）
    case 'fanfare':
      [523, 659, 784, 1047].forEach((f, i) => T(f, 0.09, { vol: 0.08, delay: i * 0.07, type: 'pulse' }));
      [1047, 1319, 1568].forEach((f) => T(f, 0.55, { vol: 0.05, delay: 0.3, type: 'square' }));
      T(262, 0.6, { vol: 0.14, delay: 0.3, type: 'triangle' });
      [2093, 2637, 3136, 2637, 3136, 4186].forEach((f, i) => T(f, 0.12, { vol: 0.035, delay: 0.5 + i * 0.07, type: 'sine' }));
      break;
    // ジャラジャラ（コインが ふる）
    case 'shower':
      for (let i = 0; i < 14; i++) T(1500 + Math.random() * 1400, 0.08, { vol: 0.035, delay: 0.15 + i * 0.09, type: 'triangle' });
      a.noise(1.2, { vol: 0.08, delay: 0.1, type: 'highpass', from: 5000, to: 8000 });
      break;
    // ドクン…（リーチ・玉が 止まる まえ）
    case 'heart':
      T(70, 0.12, { vol: 0.22, type: 'sine', slide: 50 });
      T(64, 0.14, { vol: 0.18, delay: 0.16, type: 'sine', slide: 44 });
      break;
    // リーチ！（キュイーン）
    case 'reach':
      T(600, 0.35, { vol: 0.07, type: 'saw', slide: 1800 });
      [1568, 1976, 2349].forEach((f, i) => T(f, 0.1, { vol: 0.05, delay: 0.3 + i * 0.06, type: 'square' }));
      break;
    // 数が 出た（ジャン！）
    case 'pop':
      T(1047, 0.18, { vol: 0.07, type: 'square' });
      T(1568, 0.25, { vol: 0.06, delay: 0.04, type: 'triangle' });
      a.noise(0.15, { vol: 0.12, type: 'highpass', from: 4000, to: 7000 });
      break;
    default:
  }
}

// ───────────── 見た目 ─────────────
let styled = false;
function ensureFxStyle() {
  if (styled) return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'casino-fx-style';
  st.textContent = `
#ui > .cfx { position: absolute; inset: 0; z-index: 90; pointer-events: none !important; overflow: hidden; }
.cfx-cv { position: absolute; inset: 0; width: 100%; height: 100%; }
.cfx-flash { position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, rgba(255, 250, 220, 0.95), rgba(255, 216, 74, 0.45) 45%, rgba(255, 216, 74, 0) 75%);
  animation: cfx-flash 0.55s ease-out forwards; }
@keyframes cfx-flash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
.cfx-rays { position: absolute; left: 50%; top: 42%; width: 160vmax; height: 160vmax; margin: -80vmax 0 0 -80vmax; opacity: 0.35;
  background: repeating-conic-gradient(rgba(255, 230, 120, 0.55) 0deg 8deg, rgba(255, 230, 120, 0) 8deg 20deg);
  animation: cfx-rays var(--cfx-dur) linear forwards; }
@keyframes cfx-rays { 0% { transform: rotate(0) scale(0.3); opacity: 0; } 15% { opacity: 0.4; } 80% { opacity: 0.35; } 100% { transform: rotate(70deg) scale(1); opacity: 0; } }
.cfx-banner { position: absolute; left: 0; right: 0; top: 34%; display: flex; flex-direction: column; align-items: center; gap: 0.2em; text-align: center;
  animation: cfx-banner var(--cfx-dur) cubic-bezier(.2, 1.4, .4, 1) forwards; }
.cfx-title { font-size: clamp(30px, 9vmin, 76px); line-height: 1.1; color: #fff3a8; padding: 0 0.3em; white-space: nowrap;
  text-shadow: 0 0 6px #ff9a1a, 0 0 18px #ff6a00, 3px 3px 0 #6a1a00, -2px -2px 0 #6a1a00, 2px -2px 0 #6a1a00, -2px 2px 0 #6a1a00; }
.cfx-sub { font-size: clamp(15px, 3.6vmin, 28px); color: #fff; padding: 0.1em 0.8em; border-radius: 1em; background: rgba(40, 10, 50, 0.75); border: 2px solid #ffd84a; white-space: nowrap; }
.cfx-small .cfx-title { font-size: clamp(24px, 6.5vmin, 52px); }
.cfx-jackpot .cfx-title { animation: cfx-rainbow 0.45s steps(1) infinite; font-size: clamp(32px, 10.5vmin, 90px); }
@keyframes cfx-rainbow { 0% { color: #fff3a8; } 25% { color: #ffb0e0; } 50% { color: #b0f4ff; } 75% { color: #c8ffb0; } }
@keyframes cfx-banner { 0% { transform: scale(0.2); opacity: 0; } 14% { transform: scale(1.12); opacity: 1; } 22% { transform: scale(1); } 82% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.06) translateY(-12px); opacity: 0; } }
.casino-panel.cfx-lights-small { animation: cfx-glow 0.3s steps(2) 3; }
.casino-panel.cfx-lights-big { animation: cfx-glow 0.24s steps(2) 8; }
.casino-panel.cfx-lights-jackpot { animation: cfx-glow-j 0.36s steps(3) 7; }
@keyframes cfx-glow { 0% { box-shadow: 0 0 0 3px #ffd84a, 0 0 22px 6px rgba(255, 216, 74, 0.8); } 100% { box-shadow: 0 0 0 3px #ff5a7a, 0 0 22px 6px rgba(255, 90, 122, 0.6); } }
@keyframes cfx-glow-j { 0% { box-shadow: 0 0 0 4px #ffd84a, 0 0 30px 10px rgba(255, 216, 74, 0.9); } 33% { box-shadow: 0 0 0 4px #5ae0ff, 0 0 30px 10px rgba(90, 224, 255, 0.8); }
  66% { box-shadow: 0 0 0 4px #ff5ad8, 0 0 30px 10px rgba(255, 90, 216, 0.8); } }
@media (prefers-reduced-motion: reduce) { .cfx-rays { display: none; } .cfx-jackpot .cfx-title { animation: none; } }
`;
  document.head.append(st);
}
