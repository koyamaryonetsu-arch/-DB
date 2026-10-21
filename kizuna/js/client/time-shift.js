// 時の砂時計で 時代を 切りかえる ときの 砂の うず（第6章。だいほんの ['timeShift', 'in'|'out', 動く 人の ID, 'past'|'present']）
// ・in … 画面の まわりから 砂色の 光の つぶが うずを まいて あつまり、画面を おおう（0.9びょう）。おおった まま 待つ
// ・out … うずが ほどけて、新しい 時代の 画面が 見える（0.7びょう）
// 2D でも 2.5D でも、画面の いちばん 上（#fx）に かさねる キャンバスなので おなじ ように 見える
// 動く 人（ids）に 自分が いない ときは 何も しない（家族が「ひとりで」時を こえた ときの、のこった 人の 画面）

const COLORS = {
  past: { base: [196, 150, 82], hi: [255, 228, 160], dark: [92, 60, 26] },
  present: { base: [176, 196, 220], hi: [250, 246, 220], dark: [60, 70, 110] },
};
let layer = null;

function ensureLayer() {
  if (layer && layer.canvas.isConnected) return layer;
  const host = document.getElementById('fx') || document.body;
  const canvas = document.createElement('canvas');
  canvas.className = 'time-shift';
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 });
  host.append(canvas);
  layer = { canvas, ctx: canvas.getContext('2d'), level: 0, era: 'past', seed: Math.random() * 1000 };
  return layer;
}

// level … 0（見えない）〜 1（画面を おおう）。t … ミリびょう
export function drawSwirl(L, level, t) {
  const c = L.canvas;
  const w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight;
  const k = Math.min(2, devicePixelRatio || 1);
  if (c.width !== Math.round(w * k) || c.height !== Math.round(h * k)) { c.width = Math.round(w * k); c.height = Math.round(h * k); }
  const x = L.ctx;
  x.setTransform(k, 0, 0, k, 0, 0);
  x.clearRect(0, 0, w, h);
  if (level <= 0.001) return;
  const C = COLORS[L.era] || COLORS.past;
  const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`;
  const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
  // うずの 中心へ むかって こく なる まく
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, rgba(C.hi, Math.min(1, level * 1.1)));
  g.addColorStop(0.55, rgba(C.base, Math.min(1, level * 0.95)));
  g.addColorStop(1, rgba(C.dark, Math.min(1, level * 0.9)));
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  // 砂の つぶ（6本の うでの うず。まわりながら 中へ）
  const n = 260;
  for (let i = 0; i < n; i++) {
    const arm = i % 6;
    const f = (i * 0.6180339) % 1;
    const rr = R * (1.15 - level * 0.85) * (0.12 + f * 0.95);
    const ang = arm * (Math.PI / 3) + f * 5.2 + t / 380 + L.seed;
    const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr * 0.92;
    const s = 1.5 + (i % 4);
    x.fillStyle = rgba(i % 3 ? C.hi : C.base, Math.min(1, 0.35 + level * 0.65));
    x.fillRect(Math.round(px), Math.round(py), s, s);
  }
  // まん中の 砂時計の 光
  if (level > 0.5) {
    const a = (level - 0.5) * 2;
    x.fillStyle = rgba([255, 255, 240], a * 0.9);
    const s = 10 + a * 8;
    x.beginPath();
    x.moveTo(cx - s, cy - s * 1.4); x.lineTo(cx + s, cy - s * 1.4); x.lineTo(cx, cy);
    x.lineTo(cx + s, cy + s * 1.4); x.lineTo(cx - s, cy + s * 1.4); x.lineTo(cx, cy);
    x.closePath();
    x.fill();
  }
}

function animate(L, from, to, ms) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      L.level = from + (to - from) * e;
      drawSwirl(L, L.level, now);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

// だいほんの 1つの えんしゅつ（client/ui/script.js）
export async function timeShiftFx(game, phase, ids = null, era = 'past') {
  if (Array.isArray(ids) && game?.sid && !ids.includes(game.sid)) return;
  const L = ensureLayer();
  if (phase === 'in') {
    L.era = era === 'present' ? 'present' : 'past';
    game?.audio?.sfx('wind');
    await animate(L, L.level, 1, 900);
    return;
  }
  L.era = era === 'present' ? 'present' : 'past';
  game?.audio?.sfx('sparkle');
  await animate(L, Math.max(L.level, 1), 0, 700);
  L.canvas.remove();
  layer = null;
}

// とちゅうで 切れた ときなど（だいほんを すてた とき）に うずを 消す
export function clearTimeShift() {
  if (layer?.canvas) layer.canvas.remove();
  layer = null;
}
