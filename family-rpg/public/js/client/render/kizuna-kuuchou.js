// 第98回 K1班: 熱と風の空調マスターの 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-kuuchou.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行 足すと 入る）。この ファイルは ほかの 絵の ファイルを import しない
// （hero-outfit.js などが kizuna-art.js を 読む ので、ぐるぐるの import に しない。必要な どうぐは 引数で もらう）
//
// 見た目: 親の 2つが 見て わかる 形
//   天才しせつ管理者 … 作業服（work。むねに 温度計の しるし・ひかる すじ）・白い ヘルメット（AR の ゴーグル）
//   烈火             … 右うでの 竜の こて（kote85 'ryu'）
//   空調             … 白い マント（うらは 赤 ＝ あたたかい 風 と つめたい 風）・オーラは 左半分 赤（熱）・右半分 水色（冷）
// 乗り物: 火竜の熱気球（小さな 火竜が ふくろの 中に 熱い 風を おくる。赤と 水色の しま）
// えんしゅつ: kuuchou_master_sig（火竜が 敵全体を あたため → 冷ぼうの 風 → かん気の 風が 仲間へ）・kizuna_ondo（ひらめき技。あつい 風と つめたい 風）
const rnd = (a, b) => a + Math.random() * (b - a);

const ID = 'kuuchou_master';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'work', main: '#2a3048', piping: '#ff7a3a', glowLine: true, mark: 'thermo98', pants: '#1a2038', cape: '#eef6ff', capeIn: '#e8401c', capeLen: 37.2, r79: true, pad79: 'silver' };
const body = { iris: '#e8603a', kote85: 'ryu', aura: 'ondo98' };
const hat = { kind: 'arhelmet', c: '#f8f8f6', line: '#ff7a3a', mark: 'chip', hides: 'top' };
const oldLook = { outfit: 'uniform', cloth: '#2a3048', hat: 'miner', hatColor: '#f8f8f6', cape: '#eef6ff' };
const aura = {
  // 左半分 赤い 熱・右半分 水色の 冷ぼう（cols2 は みぎ半分）
  ondo98: { glow: 0.55, len: 3.3, wid: 1.15, up: 1.2, gap: 2.1, flicker: 0.18, cols: [['#fff0a0', 210], ['#ffb040', 182], ['#ff6a1c', 150], ['#c8201c', 112]], cols2: [['#f4fcff', 210], ['#b8ecff', 182], ['#5ac8f0', 150], ['#2a78c8', 112]] },
};

// むねの 温度計（hero-outfit.js の emblem から。z … 大きさ・m … ふちの 色・h … { cloth, metal }）
function thermo(cv, x, y, z, m, h) {
  const r = 0.55 * z;
  // 白い 管 と 下の 赤い 玉
  cv.part({ ol: 'line' });
  cv.poly([[x - r, y - 1.9 * z], [x + r, y - 1.9 * z], [x + r, y + 0.9 * z], [x - r, y + 0.9 * z]], h.cloth('#f4f6fa'), { n: 'bevel', bw: 0.2 * z });
  cv.ell(x, y + 1.25 * z, 0.95 * z, 0.95 * z, h.cloth('#e8301c'), { bulge: 0.85 });
  // 中の 赤い 線（まん中まで）と 目もり（ふちの 色）
  cv.part({ ol: 'none', cast: false });
  cv.stroke([[x, y + 0.9 * z], [x, y - 0.6 * z]], 0.32 * z, h.cloth('#ff4a2a'), { n: [0, 0] });
  for (const t of [-1.4, -0.7, 0]) cv.stroke([[x + r, y + t * z], [x + r + 0.45 * z, y + t * z]], 0.12 * z, m || h.cloth('#ff7a3a'), { n: [0, 0] });
}

// ───────────── 乗り物: 火竜の熱気球 ─────────────
function balloonArt({ seg, poly, shade, seat, rgba }) {
  const RED = '#e8401c', BLUE = '#6ac8f0', CREAM = '#fff4e0', BAS = '#a8743a', BASD = shade('#a8743a', -0.28), ROPE = '#7a5a3a';
  const DR = '#d8301c', DRB = '#ffb040', EYE = '#1b1330';
  const FL = ['#fff0a0', '#ffb040', '#ff6a1c'];
  const BOB = [0, -1, -2];
  // ふくろ（たて長の まるい 形に 赤と 水色の しま）
  const envelope = (p, cx, cy, rx, ry, f) => {
    p.ellipse(cx + 1, cy + 1, rx, ry, shade(BLUE, -0.25));
    p.ellipse(cx, cy, rx, ry, CREAM);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const col = i % 2 ? BLUE : RED;
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) {
        const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
        const x0 = Math.round(cx - half + ((2 * half) / n) * i), x1 = Math.round(cx - half + ((2 * half) / n) * (i + 1)) - 1;
        if (x1 >= x0) p.hline(x0, x1, y, col);
      }
    }
    // 光と かげ（左上が 明るい）
    p.ellipse(cx - rx * 0.4, cy - ry * 0.45, rx * 0.22, ry * 0.18, shade(CREAM, 0.1));
    for (let y = Math.round(cy - ry * 0.2); y <= cy + ry * 0.8; y += 2) p.set(Math.round(cx + rx * 0.78), y, shade(BLUE, -0.35));
    // 下の 口（ふくろの すそ）と 中で ゆれる 炎
    poly(p, [[cx - rx * 0.45, cy + ry * 0.82], [cx + rx * 0.45, cy + ry * 0.82], [cx + rx * 0.3, cy + ry + 3], [cx - rx * 0.3, cy + ry + 3]], shade(RED, -0.2));
    p.ellipse(cx, cy + ry + 1, 2, 2.4 + (f % 3) * 0.5, FL[f % 3]);
  };
  // 小さな 火竜（かごの ふちに のって、上へ 炎を はく）
  const tiny = (p, x, y, f, s = 1) => {
    for (let i = 0; i < 5; i++) p.ellipse(x + s * (i * 1.8), y + Math.sin(i - f * 2) * 1, 2.2 - i * 0.25, 1.8 - i * 0.2, i % 2 ? shade(DR, -0.15) : DR);
    p.ellipse(x - s * 1.6, y - 1.6, 2.2, 1.8, DR);
    p.set(Math.round(x - s * 2.2), Math.round(y - 2), EYE);
    p.set(Math.round(x - s * 1), Math.round(y - 3.4), DRB);
    p.ellipse(x - s * 2.4, y - 4.2 - f * 0.4, 1, 1.6, FL[(f + 1) % 3]);
  };
  const basket = (p, x, y, w, hh) => {
    p.rect(x, y, w, hh, BAS);
    for (let j = y + 1; j < y + hh; j += 2) p.hline(x, x + w - 1, j, BASD);
    for (let i = x + 2; i < x + w; i += 3) p.vline(i, y, y + hh - 1, shade(BAS, 0.12));
    p.hline(x - 1, x + w, y, shade(BAS, 0.3));
  };
  const side = (p, f, layer) => {
    const b = BOB[f], cx = 24;
    if (layer === 'back') {
      envelope(p, cx, 15 + b, 16, 14, f);
      // つな（ふくろ → かご）
      for (const dx of [-11, -4, 4, 11]) seg(p, cx + dx * 0.9, 27 + b, cx + dx * 0.7, 46 + b, ROPE, 0.6);
      return;
    }
    basket(p, cx - 10, 46 + b, 21, 10);
    tiny(p, cx + 9, 44 + b, f, 1);
    // かごの 下の 小さな 空調の 室外機（白い 箱に まるい ファン）
    p.rect(cx - 6, 56 + b, 12, 5, '#eef0f4');
    p.ellipse(cx - 2, 58.5 + b, 1.8, 1.8, '#8a8e9a');
    p.set(cx - 2 + [1, 0, -1][f], 58 + b, '#3a3a4a');
    for (let y = 57 + b; y < 61 + b; y += 2) p.hline(cx + 1, cx + 4, y, '#a8a8b0');
  };
  const front = (p, f, layer) => {
    const b = BOB[f], cx = 20;
    if (layer === 'back') {
      envelope(p, cx, 15 + b, 16, 14, f);
      for (const dx of [-10, -3, 3, 10]) seg(p, cx + dx, 27 + b, cx + dx * 0.75, 46 + b, ROPE, 0.6);
      return;
    }
    basket(p, cx - 10, 46 + b, 20, 10);
    tiny(p, cx + 8, 44 + b, f, -1);
    p.rect(cx - 5, 56 + b, 10, 5, '#eef0f4');
    p.ellipse(cx, 58.5 + b, 1.8, 1.8, '#8a8e9a');
  };
  const back = (p, f, layer) => {
    const b = BOB[f], cx = 20;
    if (layer === 'back') {
      basket(p, cx - 10, 46 + b, 20, 10);
      tiny(p, cx - 8, 44 + b, f, 1);
      return;
    }
    // うしろ むき: ふくろが 人の 前（てまえ）に 見えない ように、上の ほうだけ
    envelope(p, cx, 12 + b, 16, 11, f);
    for (const dx of [-10, 10]) seg(p, cx + dx, 21 + b, cx + dx * 0.75, 30 + b, ROPE, 0.6);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [48, 64] : [40, 64]),
    rider: (view, f) => seat(view === 'side' ? 22 : 20, 52 + BOB[f], 26),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    // こうか: 上へ のぼる あたたかい ゆらぎ（だいだい）と、まわりの 冷たい 風（水色）
    fx(p, view, f) {
      const w = view === 'side' ? 48 : 40;
      for (let i = 0; i < 4; i++) {
        const x = 6 + ((i * 11 + f * 4) % (w - 10)), y = 40 - ((f * 5 + i * 7) % 16);
        p.set(x, y, rgba('#ffb040', 0.55));
        p.set(x, y - 1, rgba('#ffd890', 0.4));
      }
      for (let i = 0; i < 3; i++) p.hline(2 + i * 4 + f * 2, 6 + i * 4 + f * 2, 34 + i * 6, rgba('#9ae0ff', 0.6));
    },
    shadowScale: 1.1,
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['kuuchou_master_sig', 'kizuna_ondo']);
const HIT = { kuuchou_master_sig: 860, kizuna_ondo: 520 };
const SFX = { kuuchou_master_sig: 'fire', kizuna_ondo: 'ice' };
const FIRE = { color: '#e8301c', color2: '#ffd04a', w: 4.2, len: 0.4, amp: 8, freq: 2.2, fin: true };
const RED = ['#fff0a0', '#ffb040', '#ff6a1c', '#d8301c'];
const ICE = ['#ffffff', '#d8f6ff', '#8ad8ff', '#3a9ae8'];

function play(fx, anim, targets, element, opts = {}, W = 256) {
  if (!ANIMS.has(anim) || !targets?.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const avgY = targets.reduce((a, t) => a + t.y, 0) / targets.length;
  switch (anim) {
    case 'kuuchou_master_sig': {
      // 1) 火竜が 敵全体を あたためる（赤い ゆらぎ）→ 2) 冷ぼうの 風（水色の 風・氷の かけら）→ 3) かん気の 風が 仲間へ（みどりの すじ）
      fx.tintAt('rgba(255, 120, 40, 0.16)', 520);
      each((t, i, d) => {
        fx.add({ kind: 'r85bDragon', x: t.x, y: t.y, x0: -30, y0: t.y - 36, x1: t.x + 6, y1: t.y - 4, look: FIRE, s: 0.9, ph: i * 0.6, delay: d, life: 560 });
        fx.fireUp(t.x, t.y, 6, d + 300);
        hitMark(t, d + 420, '#ffb040', 16);
      });
      fx.tintAt('rgba(140, 220, 255, 0.2)', 700);
      for (let k = 0; k < 4; k++) fx.gust(W + 10, avgY - 24 + k * 14, { len: W * 0.85, amp: 4, color: k % 2 ? '#ffffff' : '#9ae0ff', w: 1.6, dir: -1, delay: 520 + k * 50, life: 560 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 6, ICE, { n: 14, rad: 14 * sz, h: 38, delay: d + 640, life: 520, size: 1.3 });
        fx.shock(t.x, t.y, { r0: 6, r1: 40 * sz, color: '#c8f0ff', w: 2.4, delay: d + 760, life: 400 });
        hitMark(t, d + 860, '#8ad8ff', 20);
      });
      fx.flashAt(140, '#e8f8ff', 860);
      fx.hitStop(crit ? 240 : 180, 860, 1.5);
      return true;
    }
    case 'kizuna_ondo': {
      each((t, i, d) => {
        fx.swirl(t.x - 5, t.y + 6, RED, { n: 12, rad: 12 * sz, h: 36, delay: d, life: 460, size: 1.3 });
        fx.fireUp(t.x, t.y, 5, d + 120);
        fx.swirl(t.x + 5, t.y + 6, ICE, { n: 12, rad: 12 * sz, h: 36, delay: d + 240, life: 460, size: 1.3 });
        fx.shock(t.x, t.y, { r0: 4, r1: 30 * sz, color: '#ffffff', w: 2, delay: d + 460, life: 320 });
        hitMark(t, d + 520, rnd(0, 1) < 0.5 ? '#ffb040' : '#8ad8ff', 18);
      });
      fx.hitStop(crit ? 180 : 120, 520, 1.2);
      return true;
    }
    default: return false;
  }
}

export const KUUCHOU_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: { thermo98: thermo },
  vehicle: { id: 'netsukikyu', art: balloonArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};
