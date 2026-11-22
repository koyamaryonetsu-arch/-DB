// 第98回 K4班: 元ヤンのけいじの 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-keiji.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ
// （ほかの 絵の ファイル〈hero-outfit.js など〉を import しない。乗り物の 絵の vehicle-r84a.js は import して よい ＝ 何も 読まない ファイル）
//
// 見た目: 親の 2つが 見て わかる 形
//   トリプルフェイス … こい色の スーツと ネクタイ・むなもとの 星の バッジ（pin）・せなかの マント
//   魔界の王の子     … むらさきの スーツの 色・青い れい気の オーラ
//   元ヤン           … リーゼント（hair 'slick'。うら飯ゆう助と おなじ かみがた）
// 乗り物: パトランプのれい界鳥（青い れい界の 鳥に、警察の ぼうしと 赤い パトランプ・はらに 白い すじ）
// えんしゅつ: motoyan_keiji_sig（青い れい丸 → 当たると 光の わっか〈てじょう〉が しまる）・kizuna_seoi（ひらめき技。せおいなげ）
import { birdArt } from './vehicle-r84a.js?v=8f07681fe7a2';

const ID = 'motoyan_keiji';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'suit', main: '#2e2a5a', tie: '#2a9ad8', vest: '#1a1430', pin: true, cape: '#1a1430', capeLen: 35.4 };
const body = { hair: 'slick', iris: '#2a5ab8', aura: 'rei98' };
const oldLook = { outfit: 'suit', cloth: '#2e2a5a', tie: '#2a9ad8', cape: '#1a1430' };
const aura = {
  // 青い れい気（ねもとは 白・さきは こい青。魔界の王の子の むらさきを 少し まぜる）
  rei98: { glow: 0.55, len: 3.2, wid: 1.1, up: 1.15, gap: 2.1, flicker: 0.2, cols: [['#f4fbff', 210], ['#9ad8ff', 182], ['#3a8ae8', 150], ['#3a2a8a', 112]] },
};

// ───────────── 乗り物: パトランプのれい界鳥 ─────────────
function patrolBirdArt(kit) {
  const base = birdArt(kit);
  const { seg, poly, rgba } = kit;
  const CAP = '#1e2848', BRIM = '#12182e', GOLD = '#f2c14e', LAMP = '#e8282a', LAMPL = '#ff9a8a', STRIPE = '#ffffff';
  const BOB = [0, -1.5, -0.5];
  // 警察の ぼうしと パトランプ（x, y … 頭の てっぺん。dir … くちばしの 向き〈-1 左・0 正面〉）
  const cap = (p, x, y, dir, f) => {
    poly(p, [[x - 5, y + 1], [x + 5, y + 1], [x + 4, y - 3], [x - 4, y - 3]], CAP);
    p.hline(Math.round(x - 4), Math.round(x + 3), Math.round(y - 3), '#2e3a62');
    if (dir) seg(p, x + dir * 4, y + 1, x + dir * 8, y + 2, BRIM, 1.4);
    else p.hline(Math.round(x - 5), Math.round(x + 4), Math.round(y + 1), BRIM);
    p.set(Math.round(x), Math.round(y - 1), GOLD);
    // ランプ（コマで 光る 所が かわる）
    p.ellipse(x, y - 5, 2.2, 1.8, LAMP);
    p.set(Math.round(x - 1 + (f % 3)), Math.round(y - 6), LAMPL);
    p.hline(Math.round(x - 2), Math.round(x + 2), Math.round(y - 3.4), '#8a8e98');
  };
  return {
    ...base,
    paint(p, view, f, layer) {
      base.paint(p, view, f, layer);
      const by = 30 + BOB[f];
      if (view === 'side' && layer === 'front') {
        // はらの 白い すじ（パトカーの もよう）と 頭の ぼうし
        for (let x = 24; x <= 48; x++) p.set(x, Math.round(by + 1 + (x > 44 ? 1 : 0)), STRIPE);
        for (let x = 26; x <= 46; x += 4) p.set(x, Math.round(by + 2), '#2a6ad8');
        cap(p, 18, by - 14, -1, f);
      } else if (view === 'front' && layer === 'front') {
        const hy = by + 1;
        for (let x = 20; x <= 36; x++) p.set(x, Math.round(by + 8), STRIPE);
        cap(p, 28, hy - 6, 0, f);
      } else if (view === 'back' && layer === 'back') {
        cap(p, 28, by - 13, 0, f);
      } else if (view === 'back' && layer === 'front') {
        for (let x = 18; x <= 38; x++) p.set(x, Math.round(by + 5), STRIPE);
      }
    },
    // こうか: 赤と 青に まわる ランプの 光・うしろに 青い れい気の つぶ
    fx(p, view, f) {
      const [w, h] = base.size(view);
      const by = 30 + BOB[f];
      const [lx, ly] = view === 'side' ? [18, by - 19] : view === 'front' ? [28, by - 10] : [28, by - 18];
      const col = f === 1 ? '#3a8aff' : '#ff3a3a';
      for (let r = 3; r <= 5; r++) {
        p.set(Math.round(lx - r), Math.round(ly), rgba(col, 0.55 - r * 0.06));
        p.set(Math.round(lx + r), Math.round(ly), rgba(f === 2 ? '#3a8aff' : col, 0.55 - r * 0.06));
        p.set(Math.round(lx), Math.round(ly - r + 1), rgba(col, 0.4));
      }
      for (let i = 0; i < 4; i++) {
        const x = view === 'side' ? w - 6 - ((i * 5 + f * 3) % 16) : 6 + ((i * 13 + f * 5) % (w - 12));
        const y = h - 14 - ((i * 7 + f * 4) % 18);
        p.set(x, y, rgba('#9ad8ff', 0.75));
        p.set(x + 1, y, rgba('#5ab8ff', 0.45));
      }
    },
    shadowScale: 1.5,
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['motoyan_keiji_sig', 'kizuna_seoi']);
const HIT = { motoyan_keiji_sig: 620, kizuna_seoi: 420 };
const SFX = { motoyan_keiji_sig: 'void', kizuna_seoi: 'smash' };
const REI = ['#ffffff', '#bfe6ff', '#5ab8ff', '#2a7ae8'];

function play(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!ANIMS.has(anim) || !targets?.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const x0 = W / 2, y0 = H - 8;
  switch (anim) {
    case 'motoyan_keiji_sig': {
      // 指先に 青い 光 → 太い れい丸 → 当たると 光の わっか（てじょう）が 2つ しまる・赤と 青の ランプの 光
      fx.tintAt('rgba(8, 12, 40, 0.45)', 1500);
      fx.glow(x0, y0, { color: REI[2], r: 30, life: 380, grow: 0.8 });
      fx.converge(x0, y0, { colors: REI, n: 16, r: 46, life: 220, size: 1.2 });
      each((t, i, d) => {
        fx.add({ kind: 'kame', x0, y0, x: t.x, y: t.y, w: 18, glow: REI[3], life: 520, delay: 240 + d, add: true });
        fx.add({ kind: 'orb', x: t.x, y: t.y, color: REI[1], r: 28, life: 460, delay: 360 + d });
        // てじょう: 光の わっかが 外から しまる（2つ）
        fx.shock(t.x - 6, t.y + 2, { r0: 30, r1: 7, color: '#e8f4ff', w: 2.6, delay: 480 + d, life: 300 });
        fx.shock(t.x + 6, t.y + 2, { r0: 30, r1: 7, color: '#e8f4ff', w: 2.6, delay: 540 + d, life: 300 });
        fx.sparks(t.x, t.y, { colors: ['#ff3a3a', '#3a8aff'], n: 12, speed: 90, delay: 600 + d, life: 420, len: 5 });
        hitMark(t, 620 + d, '#5ab8ff', 24);
      });
      fx.flashAt(crit ? 140 : 100, '#e0f0ff', 600);
      fx.hitStop(crit ? 300 : 240, 620, 1.7);
      return true;
    }
    case 'kizuna_seoi': {
      // 下から 上へ 大きく 回して、地面に たたきつける
      each((t, i, d) => {
        fx.speedLines(t.x, t.y, { delay: d + 120, r1: 80, color: '#e0f0ff' });
        fx.shock(t.x, t.y + 10, { r0: 6, r1: 48 * sz, color: '#d8c8a8', w: 3, delay: d + 380, life: 380 });
        fx.burst(t.x, t.y + 10, ['#ffffff', '#d8c8a8', '#a89878'], 14, 110, { delay: d + 400 });
        hitMark(t, d + 420, '#5ab8ff', 20);
      });
      fx.hitStop(crit ? 220 : 160, 420, 1.5);
      return true;
    }
    default: return false;
  }
}

export const KEIJI_ART = {
  id: ID,
  outfit, body, oldLook, aura,
  emblems: {},
  vehicle: { id: 'patolamp_bird', art: patrolBirdArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};
