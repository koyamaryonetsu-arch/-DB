// 第98回 K2班: 百きの大将の 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-hyakki.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ。ほかの 絵の ファイルは import しない
//
// 見た目: 親の 2つが 見て わかる 形
//   ばくりゅうはの大よう … 銀の かみ・犬の 耳（inu82）・赤い 着物と はかま（hakama）・数じゅ（beads82）・白い はおり
//   かっぱの大王         … せなかの こうら（shell 'small'）・はかまと はおりの うらの みどり・手に キュウリ（prop 'cucumber'）
//   ようかいの 大将      … 青白い おに火の オーラ（hyakki98）
// 乗り物: 百きの大みこし（カッパと 犬の ようかいが かつぐ 赤い みこし。まわりに 青白い おに火）
// えんしゅつ: hyakki_taishou_sig（ようかいの 大行列が 風に なって 敵へ → 仲間に 力）・kizuna_hyakki（ようかい大行進）
const ID = 'hyakki_taishou';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'hakama', main: '#a8142a', hakama: '#2e7a3a', sheath: '#1a1014', r82: true, beads82: true, cape: '#f2efe6', capeIn: '#2e9a3e', capeLen: 36.2 };
const body = { hair: 'inu82', hcol: 'inugin', iris: '#e8c018', shell: 'small', prop: 'cucumber', aura: 'hyakki98' };
const oldLook = { outfit: 'hakama', cloth: '#a8142a', hakama: '#2e7a3a', cape: '#f2efe6' };
const aura = {
  // 青白い おに火（ねもとは 白・さきは こい 青むらさき。ゆらぎ 大きめ）
  hyakki98: { glow: 0.55, len: 3.4, wid: 1.2, up: 1.3, gap: 2.0, flicker: 0.3, cols: [['#f4fcff', 212], ['#a8e0ff', 184], ['#5a8af0', 150], ['#3a2a9a', 112]] },
};

// ───────────── 乗り物: 百きの大みこし ─────────────
function mikoshiArt({ seg, poly, shade, seat, rgba, twinkle }) {
  const RED = '#c81c2a', REDD = shade(RED, -0.3), GOLD = '#f2c14e', GOLDD = shade(GOLD, -0.3), POLE = '#8a5a2a', POLED = shade(POLE, -0.3);
  const KAP = '#4ab84a', KAPD = shade(KAP, -0.25), PLATE = '#f4f8f0', BEAK = '#f2c430';
  const DOG = '#f8f6f0', DOGD = shade(DOG, -0.2), PINK = '#f0b0b8', EYE = '#1b1330', ONI = ['#f4fcff', '#a8e0ff', '#5a8af0'];
  const BOB = [0, -1, 0];
  const STEP = [[-2, 2], [0, 0], [2, -2]];
  // かつぐ カッパ（よこ）: 足・からだ・こうら・頭の お皿・くちばし
  const kappa = (p, x, g, f, k, s = 1) => {
    const [a, b] = STEP[(f + k) % 3];
    seg(p, x - 1, g - 6, x - 1 + a, g, KAPD, 1.6);
    seg(p, x + 1, g - 6, x + 1 + b, g, KAPD, 1.6);
    p.ellipse(x, g - 9, 3.2, 3.8, KAP);
    p.ellipse(x - s * 2.6, g - 9, 1.6, 2.6, '#6a7a3a');
    p.ellipse(x, g - 15, 3, 2.8, KAP);
    p.ellipse(x, g - 17.4, 2.2, 0.9, PLATE);
    p.hline(Math.round(x + s * 2), Math.round(x + s * 3.6), Math.round(g - 14.5), BEAK);
    p.set(Math.round(x + s * 1.4), Math.round(g - 15.6), EYE);
    // 手を 上げて ぼうを ささえる
    seg(p, x + s * 0.5, g - 11, x + s * 1.5, g - 19, KAPD, 1.2);
  };
  // かつぐ 犬の ようかい（よこ）: 白い 毛・とがった 耳
  const dog = (p, x, g, f, k, s = 1) => {
    const [a, b] = STEP[(f + k) % 3];
    seg(p, x - 1, g - 6, x - 1 + a, g, DOGD, 1.7);
    seg(p, x + 1, g - 6, x + 1 + b, g, DOGD, 1.7);
    p.ellipse(x, g - 9.5, 3.4, 4, DOG);
    p.ellipse(x, g - 15.5, 3, 2.8, DOG);
    poly(p, [[x - 2.6, g - 16.5], [x - 0.6, g - 16.5], [x - 2, g - 21]], DOG);
    poly(p, [[x + 0.6, g - 16.5], [x + 2.6, g - 16.5], [x + 2, g - 21]], DOG);
    p.set(Math.round(x - 1.6), Math.round(g - 18), PINK);
    p.set(Math.round(x + 1.6), Math.round(g - 18), PINK);
    p.set(Math.round(x + s * 1.2), Math.round(g - 16), '#e8a818');
    p.set(Math.round(x + s * 3), Math.round(g - 15), EYE);
    seg(p, x - s * 0.5, g - 11, x + s * 0.8, g - 19, DOGD, 1.2);
  };
  // みこしの 台（赤い 箱・金の ふち・まえの もよう）
  const base = (p, x, y, w, h) => {
    p.rect(x, y, w, h, RED);
    p.hline(x, x + w - 1, y, GOLD);
    p.hline(x, x + w - 1, y + h - 1, GOLDD);
    for (let i = x + 3; i < x + w - 2; i += 5) {
      p.vline(i, y + 2, y + h - 3, REDD);
      p.set(i + 2, y + Math.round(h / 2), GOLD);
    }
    // まん中に 金の まるい かざり（犬の きば の 形）
    const cx = x + Math.round(w / 2), cy = y + Math.round(h / 2);
    p.ellipse(cx, cy, 2.6, 2.2, GOLD);
    poly(p, [[cx - 1.4, cy - 0.5], [cx + 1.4, cy - 0.5], [cx, cy + 2.6]], '#ffffff');
  };
  // 手すりの はしら（金の 玉が 上に つく）と 小さな はた
  const post = (p, x, y0, y1, f, flag) => {
    p.vline(x, y0, y1, REDD);
    p.ellipse(x, y0 - 1, 1.3, 1.3, GOLD);
    if (flag) {
      const w = [0, 1, 0.5][f];
      poly(p, [[x, y0 - 2], [x + 5, y0 - 1 + w], [x, y0 + 2]], '#f4f2ea');
      p.set(x + 2, y0, RED);
    }
  };
  const pole = (p, x0, x1, y) => {
    p.hline(x0, x1, y, POLE);
    p.hline(x0, x1, y + 1, POLED);
  };
  const side = (p, f, layer) => {
    const b = BOB[f], g = 58;
    if (layer === 'back') {
      // おくの 手すりと はた・おくの かつぎ手（少し 小さく 暗く 見える 所に）
      for (const x of [12, 44]) post(p, x, 22 + b, 32 + b, f, x === 44);
      p.hline(12, 44, 25 + b, REDD);
      dog(p, 20, g - 2, f, 1, -1);
      kappa(p, 38, g - 2, f, 2, -1);
      return;
    }
    pole(p, 2, 54, 39 + b);
    base(p, 9, 32 + b, 38, 8);
    // てまえの 手すり（下の ほうだけ。乗る 人の こしの 前）
    p.hline(9, 46, 31 + b, GOLD);
    for (const x of [9, 46]) post(p, x, 27 + b, 31 + b, f, false);
    kappa(p, 8, g, f, 0, -1);
    dog(p, 28, g, f, 2, -1);
    kappa(p, 48, g, f, 1, -1);
  };
  const front = (p, f, layer) => {
    const b = BOB[f], g = 58, cx = 22;
    if (layer === 'back') {
      for (const x of [cx - 14, cx + 14]) post(p, x, 21 + b, 31 + b, f, x > cx);
      p.hline(cx - 14, cx + 14, 24 + b, REDD);
      return;
    }
    // ぼう 2本（まえから は たての 点）
    for (const x of [cx - 12, cx + 12]) {
      p.ellipse(x, 39 + b, 1.6, 1.6, POLE);
      p.set(x, 39 + b, POLED);
    }
    base(p, cx - 15, 31 + b, 30, 8);
    p.hline(cx - 15, cx + 14, 30 + b, GOLD);
    kappa(p, cx - 12, g, f, 0, 1);
    dog(p, cx + 12, g, f, 1, -1);
  };
  const back = (p, f, layer) => {
    const b = BOB[f], g = 58, cx = 22;
    if (layer === 'back') {
      base(p, cx - 15, 31 + b, 30, 8);
      kappa(p, cx + 12, g, f, 2, -1);
      dog(p, cx - 12, g, f, 0, 1);
      return;
    }
    p.hline(cx - 15, cx + 14, 30 + b, GOLD);
    for (const x of [cx - 15, cx + 14]) post(p, x, 22 + b, 30 + b, f, x > cx);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [56, 60] : [44, 60]),
    rider: (view, f) => seat(view === 'side' ? 28 : 22, 32 + BOB[f], 26),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    // こうか: まわりに ゆれる 青白い おに火・足もとの 小さな 風
    fx(p, view, f) {
      const w = view === 'side' ? 56 : 44;
      for (let i = 0; i < 4; i++) {
        const x = 4 + ((i * 13 + f * 3) % (w - 8)), y = 8 + ((i * 9 + f * 4) % 18);
        p.set(x, y, rgba(ONI[0], 0.8));
        p.set(x, y + 1, rgba(ONI[1], 0.6));
        p.set(x - 1, y + 1, rgba(ONI[2], 0.45));
        p.set(x + 1, y + 1, rgba(ONI[2], 0.45));
        p.set(x, y + 2, rgba(ONI[2], 0.35));
      }
      twinkle(p, 6 + ((f * 17) % (w - 12)), 4 + f * 2, rgba('#ffffff', 0.6));
      for (let i = 0; i < 2; i++) p.hline(2 + i * 6 + f * 3, 6 + i * 6 + f * 3, 56 + i, rgba('#d8f0ff', 0.5));
    },
    shadowScale: 1.15,
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['hyakki_taishou_sig', 'kizuna_hyakki']);
const HIT = { hyakki_taishou_sig: 800, kizuna_hyakki: 480 };
const SFX = { hyakki_taishou_sig: 'wind', kizuna_hyakki: 'wind' };
const ONIBI = ['#ffffff', '#a8e0ff', '#5a8af0', '#3a2a9a'];
const KAPPA = ['#ffffff', '#9ae06a', '#4ab84a', '#2e7a3a'];

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
    case 'hyakki_taishou_sig': {
      // 1) 夜の 色・青白い おに火が ならぶ → 2) ようかいの 行列（みどり と 白の うず）が 風に なって 敵へ → 3) 敵ごとに 当たる
      fx.tintAt('rgba(20, 16, 60, 0.42)', 1500);
      for (let k = 0; k < 7; k++) fx.swirl(W * 0.06 + k * W * 0.05, 70 + (k % 3) * 14, k % 2 ? KAPPA : ONIBI, { n: 6, rad: 5, h: 16, delay: k * 50, life: 420, size: 1.1 });
      for (let k = 0; k < 4; k++) fx.gust(-10, avgY - 22 + k * 14, { len: W * 0.85, amp: 5, color: k % 2 ? '#d8f0ff' : '#9ae06a', w: 1.8, dir: 1, delay: 300 + k * 60, life: 560 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 6, ONIBI, { n: 12, rad: 12 * sz, h: 34, delay: d + 520, life: 480, size: 1.2 });
        fx.shock(t.x, t.y, { r0: 6, r1: 46 * sz, color: '#a8e0ff', w: 2.6, delay: d + 640, life: 420 });
        hitMark(t, d + 800, '#5a8af0', 20);
      });
      fx.flashAt(160, '#e8f4ff', 800);
      fx.hitStop(crit ? 240 : 180, 800, 1.5);
      return true;
    }
    case 'kizuna_hyakki': {
      for (let k = 0; k < 3; k++) fx.gust(-10, avgY - 16 + k * 14, { len: W * 0.8, amp: 4, color: k % 2 ? '#ffffff' : '#9ae06a', w: 1.6, dir: 1, delay: k * 50, life: 460 });
      each((t, i, d) => {
        fx.swirl(t.x - 4, t.y + 6, KAPPA, { n: 10, rad: 10 * sz, h: 30, delay: d + 200, life: 420, size: 1.2 });
        fx.swirl(t.x + 4, t.y + 6, ONIBI, { n: 10, rad: 10 * sz, h: 30, delay: d + 300, life: 420, size: 1.2 });
        hitMark(t, d + 480, '#9ae06a', 18);
      });
      fx.hitStop(crit ? 180 : 120, 480, 1.2);
      return true;
    }
    default: return false;
  }
}

export const HYAKKI_ART = {
  id: ID,
  outfit, body, oldLook, aura,
  emblems: {},
  vehicle: { id: 'hyakki_mikoshi', art: mikoshiArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};
