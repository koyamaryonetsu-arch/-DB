// 合体技の えんしゅつ（第26回）
//
// 1) カットイン（DOM）: 画面が 暗くなり、出す 人の 顔と 名前が ななめの 帯に ならぶ → 技の 名前が ドーンと 出る（画面が ゆれる）
//    3人技・4人技は 帯が 2本・金の わく・きらきら・「3人技！」「4人技！！」で さらに 豪華に
// 2) とどめの えんしゅつ（たたかいの え。battlefx.js の Effects）: 技ごとの 色と かたち（finale）で、画面いっぱいに
// スマホでも 重く ならない ように: DOM は transform と opacity だけ うごかす。つぶは 1回 100こ くらいまで
//
// client/battle-dual.js の dualFx から よぶ。CSS は ここで 1回だけ 入れる（style.css は さわらない）

// 技ごとの えんしゅつ: c … 色（[こい, あかるい, ひかり]）、finale … とどめの かたち、word … 画面に 出る ことば
export const DUAL_FX = {
  dt_taishoumetsu: { c: ['#6a3aff', '#ff6a3a', '#9ae6ff'], finale: 'nova', word: 'ジュワッ！' },
  dt_honoo_tatsumaki: { c: ['#c82a0a', '#ff9a3a', '#ffe07a'], finale: 'storm', word: 'ゴオオッ！' },
  dt_cross_mahouken: { c: ['#3a5ac8', '#9ad8ff', '#ffffff'], finale: 'cross', word: 'ズバッ！' },
  dt_cross_break: { c: ['#8a3a1a', '#ffd66b', '#ffffff'], finale: 'cross', word: 'ドドドドッ！' },
  dt_iyashi_wa: { c: ['#2a9a6a', '#9af0b0', '#ffffff'], finale: 'heal', word: 'ふわぁ…' },
  dt_stage: { c: ['#c83a9a', '#ffd66b', '#9ad8ff'], finale: 'stage', word: 'イエーイ！' },
  dt_tsukin_rush: { c: ['#2a6a3a', '#9af0b0', '#ffe07a'], finale: 'quake', word: 'ぎゅうぎゅう！' },
  dt_jugyo_sankan: { c: ['#3a8ac8', '#ffe07a', '#ffb0c8'], finale: 'stage', word: 'はいっ！はいっ！' },
  dt_manzai: { c: ['#c8a01a', '#fff6b0', '#ff6a6a'], finale: 'laugh', word: 'なんでやねん！' },
  dt_gomu_kame: { c: ['#1a6ac8', '#9ae6ff', '#ffffff'], finale: 'beam', word: 'びよーん！' },
  dt_bentou: { c: ['#c86a1a', '#ffe0a0', '#ff9ac8'], finale: 'heal', word: 'わすれもの！' },
  dt_hataraki: { c: ['#a01a1a', '#ff6a3a', '#fff6b0'], finale: 'quake', word: 'コラーッ！' },
  dt_gyouretsu: { c: ['#c8601a', '#ffe0a0', '#ffffff'], finale: 'heal', word: 'まいどあり！' },
  dt_zenkan: { c: ['#1a7ac8', '#9ae6ff', '#e6fbff'], finale: 'storm', word: 'ひんやり！' },
  dt_hametsu: { c: ['#3a0a5a', '#a05ae0', '#ff3a3a'], finale: 'nova', word: 'ズゴゴゴ…' },
  dt_hikari_yami: { c: ['#1a0a2a', '#ffffff', '#a05ae0'], finale: 'nova', word: 'キィィン！' },
  dt_delta: { c: ['#c8a01a', '#ffd66b', '#ffffff'], finale: 'cross', word: 'デルタ！' },
  dt_jump: { c: ['#3a9a3a', '#ffe07a', '#ffffff'], finale: 'quake', word: 'ドスーン！' },
  dt_uukanpi: { c: ['#c81a1a', '#3a8aff', '#ffffff'], finale: 'siren', word: 'ウーウー！カンカン！ピーポー！' },
  dt_oosouji: { c: ['#3a8a9a', '#e6fbff', '#ffe07a'], finale: 'storm', word: 'ピッカピカ！' },
  dt_ogori: { c: ['#c8a01a', '#ffe07a', '#ff9a3a'], finale: 'heal', word: 'カンパーイ！' },
  dt_dai_collab: { c: ['#c81a6a', '#ff9ac8', '#9ad8ff'], finale: 'stage', word: 'ドーン！' },
  dt_zenin: { c: ['#c8601a', '#ffd66b', '#ffffff'], finale: 'quake', word: '全員集合！' },
  dt_kazoku_kaigi: { c: ['#6a4a2a', '#ffe0a0', '#9ad8ff'], finale: 'laugh', word: 'ぐぅ…' },
  dt_finale: { c: ['#c8a01a', '#ffffff', '#9ad8ff'], finale: 'nova', word: 'フィナーレ！' },
};
const DEFAULT_FX = { c: ['#7a3ac8', '#ffd66b', '#ffffff'], finale: 'nova', word: '' };
export const dualFxOf = (id) => DUAL_FX[id] || DEFAULT_FX;

// カットインの 長さ（ミリびょう。たたかいの 速さ 1 の とき）: 人数が 多いほど 長く 豪華に
export const CUT_MS = { 2: 1000, 3: 1300, 4: 1600 };
export const cutMs = (n) => CUT_MS[n] || CUT_MS[2];

let cssDone = false;
function addCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.id = 'dualfx-css';
  st.textContent = `
.dfx { position: absolute; inset: 0; overflow: hidden; z-index: 5; pointer-events: none; --c0: #7a3ac8; --c1: #ffd66b; --c2: #fff; --t: 1s; }
.dfx-bg { position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, rgba(20,8,40,.55), rgba(0,0,0,.88)); animation: dfx-fade var(--t) ease-out forwards; }
.dfx-rays { position: absolute; left: 50%; top: 45%; width: 220%; aspect-ratio: 1; transform: translate(-50%,-50%);
  background: repeating-conic-gradient(from 0deg, rgba(255,214,107,.35) 0deg 5deg, transparent 5deg 13deg);
  background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--c1) 40%, transparent) 0deg 5deg, transparent 5deg 13deg);
  animation: dfx-spin var(--t) linear forwards, dfx-fade var(--t) ease-out forwards; opacity: .9; }
.dfx-band { position: absolute; left: -10%; right: -10%; top: 14%; height: 52%; transform: skewY(-7deg);
  background: var(--c0);
  background: linear-gradient(90deg, var(--c0), color-mix(in srgb, var(--c0) 55%, #000) 50%, var(--c0));
  border-top: 3px solid var(--c1); border-bottom: 3px solid var(--c1); box-shadow: 0 0 18px var(--c1);
  animation: dfx-band calc(var(--t) * .28) cubic-bezier(.2,.9,.3,1.2) both, dfx-fade var(--t) ease-out forwards; }
.dfx.n3 .dfx-band, .dfx.n4 .dfx-band { border-width: 5px; }
.dfx-band2 { position: absolute; left: -10%; right: -10%; top: 9%; height: 4%; transform: skewY(-7deg); background: var(--c1);
  animation: dfx-band calc(var(--t) * .3) .08s ease-out both, dfx-fade var(--t) ease-out forwards; }
.dfx-band2.b { top: auto; bottom: 26%; animation-delay: .14s; }
.dfx-row { position: absolute; left: 0; right: 0; top: 14%; height: 52%; display: flex; justify-content: center; align-items: center; gap: 2%; transform: skewY(-7deg); }
.dfx-p { position: relative; flex: 0 1 22%; max-width: 8.5em; height: 86%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  transform: skewX(-10deg); background: rgba(0,0,0,.3); background: linear-gradient(180deg, color-mix(in srgb, var(--c1) 35%, transparent), rgba(0,0,0,.35));
  border: 2px solid var(--c1); border-radius: 4px; box-shadow: 0 0 10px var(--c1) inset; overflow: hidden;
  animation: dfx-in calc(var(--t) * .25) cubic-bezier(.2,.9,.3,1.25) both; animation-delay: calc(var(--i) * .09s + .06s); }
.dfx-p:nth-child(even) { animation-name: dfx-in2; }
.dfx-p img { height: 74%; width: auto; image-rendering: pixelated; transform: skewX(10deg) skewY(7deg); filter: drop-shadow(0 0 6px var(--c1)); }
.dfx-p span { transform: skewX(10deg) skewY(7deg); color: #fff; font-size: var(--fs-small, .8em); font-weight: bold; text-shadow: 2px 2px 0 #000; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 0 .2em .15em; }
.dfx-title { position: absolute; left: 50%; bottom: 6%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; white-space: nowrap;
  animation: dfx-slam calc(var(--t) * .3) cubic-bezier(.3,1.4,.5,1) both; animation-delay: calc(var(--t) * .38); }
.dfx-title small { font-size: var(--fs-small, .8em); color: #fff; text-shadow: 2px 2px 0 #000; letter-spacing: .1em; }
.dfx-title b { font-size: calc(var(--fs-big, 1.3em) * 1.35); color: var(--c2); letter-spacing: .05em;
  text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 0 0 14px var(--c1), 0 0 26px var(--c0); }
.dfx.n3 .dfx-title b, .dfx.n4 .dfx-title b { font-size: calc(var(--fs-big, 1.3em) * 1.55); }
.dfx.n4 .dfx-title small { color: #ffd66b; }
.dfx-word { position: absolute; right: 4%; top: 4%; font-size: var(--fs-big, 1.3em); font-weight: bold; color: #fff; transform: rotate(8deg);
  text-shadow: 2px 2px 0 #000, 0 0 10px var(--c1); animation: dfx-word calc(var(--t) * .45) cubic-bezier(.3,1.6,.5,1) both; animation-delay: calc(var(--t) * .55); }
.dfx-flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: dfx-flash .35s ease-out both; animation-delay: calc(var(--t) * .38); }
.dfx-st { position: absolute; width: .7em; height: .7em; background: var(--c2); clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: dfx-tw .6s ease-in-out infinite alternate both; animation-delay: var(--d); opacity: 0; }
.dfx-out { animation: dfx-out .3s ease-in forwards; }
@keyframes dfx-fade { 0% { opacity: 0; } 10% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
@keyframes dfx-spin { to { transform: translate(-50%,-50%) rotate(50deg); } }
@keyframes dfx-band { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes dfx-in { from { transform: translateX(-180%) skewX(-10deg); opacity: 0; } to { transform: skewX(-10deg); opacity: 1; } }
@keyframes dfx-in2 { from { transform: translateX(180%) skewX(-10deg); opacity: 0; } to { transform: skewX(-10deg); opacity: 1; } }
@keyframes dfx-slam { from { transform: translateX(-50%) scale(2.6); opacity: 0; } 60% { opacity: 1; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes dfx-word { from { transform: rotate(8deg) scale(.2); opacity: 0; } to { transform: rotate(8deg) scale(1); opacity: 1; } }
@keyframes dfx-flash { 0% { opacity: .85; } 100% { opacity: 0; } }
@keyframes dfx-tw { from { transform: scale(.3) rotate(0deg); opacity: 0; } to { transform: scale(1.2) rotate(45deg); opacity: 1; } }
@keyframes dfx-out { to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .dfx-rays { animation: dfx-fade var(--t) ease-out forwards; } }
`;
  document.head.append(st);
}

// カットインを 出す。stage … たたかいの 画面の 要素、people … [{ name, face }]、tempo … たたかいの 速さ
// もどりち: カットインの 長さ（ミリびょう）
export function playDualCutin(stage, { id, name, people, tempo = 1, el }) {
  addCss();
  const n = Math.max(2, Math.min(4, people.length));
  const fx = dualFxOf(id);
  const ms = cutMs(n) / tempo;
  const label = n >= 4 ? `${n}人の合体技！！` : n === 3 ? `${n}人の合体技！` : '合体技';
  const root = el('div', { class: `dfx n${n}` });
  root.style.setProperty('--c0', fx.c[0]);
  root.style.setProperty('--c1', fx.c[1]);
  root.style.setProperty('--c2', fx.c[2]);
  root.style.setProperty('--t', `${Math.round(ms + 400 / tempo)}ms`);
  const row = el('div', { class: 'dfx-row' }, ...people.map((p, i) => {
    const box = el('div', { class: 'dfx-p' }, el('img', { alt: '', src: p.face || '' }), el('span', { text: p.name || '' }));
    box.style.setProperty('--i', i);
    return box;
  }));
  root.append(el('div', { class: 'dfx-bg' }), el('div', { class: 'dfx-rays' }));
  if (n >= 3) root.append(el('div', { class: 'dfx-band2' }), el('div', { class: 'dfx-band2 b' }));
  root.append(el('div', { class: 'dfx-band' }), row, el('div', { class: 'dfx-flash' }),
    el('div', { class: 'dfx-title' }, el('small', { text: label }), el('b', { text: name })));
  if (fx.word) root.append(el('div', { class: 'dfx-word', text: fx.word }));
  // 3人・4人技は きらきら（数は すくなめ）
  if (n >= 3) {
    for (let k = 0; k < 4 + (n - 3) * 4; k++) {
      const s = el('i', { class: 'dfx-st' });
      s.style.left = `${8 + ((k * 37) % 84)}%`;
      s.style.top = `${6 + ((k * 53) % 70)}%`;
      s.style.setProperty('--d', `${(k % 5) * 0.12 + 0.2}s`);
      root.append(s);
    }
  }
  stage.append(root);
  setTimeout(() => root.classList.add('dfx-out'), ms + 100 / tempo);
  setTimeout(() => root.remove(), ms + 450 / tempo);
  return ms;
}

const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((x) => parseInt(x + x, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
};

// とどめの えんしゅつ（たたかいの え）。fx … Effects、pts … ねらう ところ（敵 か 味方の まん中）、n … 人数
// W・H … たたかいの えの 大きさ。もどりち: なし
export function playDualFinale(fx, id, pts, n, W, H) {
  const t = dualFxOf(id);
  const [c0, c1, c2] = t.c;
  const cols = [c1, c2, '#ffffff'];
  const big = 1 + (n - 2) * 0.35;
  const center = pts.length ? { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length } : { x: W / 2, y: H * 0.5 };
  // どの 技も: 画面の 色・光・ゆれ
  fx.tintAt(rgba(c0, 0.22 + 0.04 * n), 700 + 150 * n);
  fx.flashAt(140 + 40 * n, c2, 0);
  fx.hitStop(220 + 90 * n, 60, 1.1 + 0.35 * (n - 2));
  fx.vignette?.(c1, 600 + 120 * n, 0.35 + 0.05 * n);
  switch (t.finale) {
    case 'nova': {
      // 光が あつまって、大きく はじける
      fx.converge(center.x, center.y, { colors: cols, n: 14 + 4 * n, r: 46 * big, life: 320 });
      for (let k = 0; k < n; k++) fx.ring(center.x, center.y, k % 2 ? c1 : c2, 3 + k, 300 + k * 90, 420, 50 + 26 * k * big);
      fx.glow(center.x, center.y, { color: c1, r: 40 * big, delay: 280, life: 520 });
      fx.pillar(center.x, center.y + 30, c1, { w: 10 + 4 * n, h: H, delay: 300, life: 600, edge: c2 });
      fx.speedLines(center.x, center.y, { color: c2, n: 18 + 4 * n, delay: 300, life: 360, r1: 130 });
      fx.burst(center.x, center.y, cols, 18 + 6 * n, 120 + 30 * n, { delay: 320 });
      break;
    }
    case 'storm': {
      // うずまきが 画面を よこぎる
      for (let k = 0; k < 3 + n; k++) fx.gust(-20, 18 + k * ((H - 36) / (2 + n)), { len: W + 40, amp: 6, color: k % 2 ? c1 : c2, w: 1.4, delay: k * 50, life: 520 });
      pts.forEach((p, i) => {
        fx.swirl(p.x, p.y + 10, cols, { n: 12 + 3 * n, rad: 20 * big, h: 60 * big, delay: 120 + i * 60, life: 700 });
        fx.shock(p.x, p.y, { r1: 34 * big, color: c1, delay: 200 + i * 60 });
      });
      break;
    }
    case 'cross': {
      // 大きな ✕ と 三角（3人）・十字（4人）の 光の すじ
      const r = 44 * big;
      fx.bigCut?.(center.x, center.y, { ang: 0.7, color: c2, glow: c1, w: 3 + n, delay: 80, life: 340 });
      fx.bigCut?.(center.x, center.y, { ang: -0.7, color: c2, glow: c1, w: 3 + n, delay: 180, life: 340 });
      if (n >= 3) fx.bigCut?.(center.x, center.y, { ang: 0, color: c2, glow: c1, w: 3 + n, delay: 280, life: 340 });
      if (n >= 4) fx.bigCut?.(center.x, center.y, { ang: Math.PI / 2, color: c2, glow: c1, w: 3 + n, delay: 360, life: 340 });
      fx.ring(center.x, center.y, c1, 4, 300, 420, r * 1.4);
      fx.sparks(center.x, center.y, { colors: cols, n: 16 + 6 * n, speed: 150, spread: Math.PI * 2, delay: 300 });
      break;
    }
    case 'beam': {
      // 下から 大きな ビーム
      fx.pillar?.(center.x, center.y + 20, c1, { w: 18, h: H, delay: 120, life: 620, edge: c2 });
      fx.speedLines(center.x, center.y, { color: c2, n: 22, delay: 140, life: 420, r1: 140 });
      fx.burst(center.x, center.y, cols, 30, 160, { delay: 300 });
      break;
    }
    case 'quake': {
      // ドスン！地面が われて ゆれる
      const foot = Math.min(H - 6, center.y + 22);
      fx.crack(W / 2, foot, { n: 6 + n, len: 40 * big, hi: c1, delay: 120 });
      for (let k = 0; k < n + 1; k++) fx.shock(W * (0.2 + 0.6 * (k / Math.max(1, n))), foot, { r1: 46 * big, sy: 0.38, color: c1, w: 2, delay: 140 + k * 70 });
      pts.forEach((p, i) => fx.debris(p.x, p.y + 10, ['#8a6a4a', '#c8a07a', c1], 8 + 2 * n, 160 + i * 50, 110 + 20 * n));
      fx.hitStop(260 + 80 * n, 150, 1.6 + 0.3 * (n - 2));
      break;
    }
    case 'heal': {
      // あたたかい 光が 下から のぼる
      fx.ring(W / 2, H * 0.62, c1, 4, 60, 520, 90 * big);
      fx.ring(W / 2, H * 0.62, c2, 3, 220, 520, 120 * big);
      for (let k = 0; k < 14 + 6 * n; k++) fx.twinkle(W * (0.08 + 0.84 * Math.random()), H * (0.55 + 0.4 * Math.random()), { color: k % 2 ? c1 : c2, size: 3 + Math.random() * 3, vy: -30 - Math.random() * 30, delay: k * 25, life: 700 });
      fx.glow(W / 2, H * 0.7, { color: c1, r: 60 * big, delay: 120, life: 700, alpha: 0.7 });
      break;
    }
    case 'stage': {
      // スポットライトと 紙ふぶき
      for (let k = 0; k < 3 + (n >= 4 ? 2 : 0); k++) fx.add({ kind: 'spot', x: 40 + k * ((W - 80) / Math.max(1, 2 + (n >= 4 ? 2 : 0))), y: H, color: [c1, c2, '#ffe066', '#ff8ac8', '#9ad1ff'][k % 5], life: 900, delay: k * 70 });
      for (let k = 0; k < 18 + 6 * n; k++) fx.petal(W * Math.random(), -6 - Math.random() * 20, { color: [c1, c2, '#ffe066', '#9ad1ff'][k % 4], vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 40, delay: k * 20, life: 1100 });
      for (let k = 0; k < n; k++) fx.star(W * (0.2 + 0.6 * (k / Math.max(1, n - 1))), H * 0.3, c2, 14, 200 + k * 90, 360);
      break;
    }
    case 'laugh': {
      // ドッと わらう（あちこちで はじける）
      for (let k = 0; k < 6 + 2 * n; k++) {
        const x = W * (0.1 + 0.8 * Math.random()), y = H * (0.15 + 0.5 * Math.random());
        fx.star(x, y, k % 2 ? c1 : c2, 10 + Math.random() * 6, k * 60, 300);
        fx.burst(x, y, cols, 6, 70, { delay: k * 60 });
      }
      break;
    }
    case 'siren': {
      // 赤と 青の 光が かわりばんこに
      for (let k = 0; k < 6; k++) fx.flashAt(90, k % 2 ? '#3a6aff' : '#ff2a2a', k * 140);
      fx.ring(W / 2, H * 0.62, '#ffffff', 4, 200, 600, 120);
      for (let k = 0; k < 20; k++) fx.twinkle(W * Math.random(), H * (0.5 + 0.45 * Math.random()), { color: k % 2 ? '#ff6a6a' : '#9ad8ff', size: 4, vy: -40, delay: 200 + k * 25, life: 700 });
      break;
    }
    default:
      fx.burst(center.x, center.y, cols, 24, 120, { delay: 200 });
  }
}
