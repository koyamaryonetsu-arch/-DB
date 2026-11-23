// 第98回 K4班: 等価交かんの大魔道士の 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-touka.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ
// （ほかの 絵の ファイル〈hero-outfit.js など〉を import しない。乗り物の 絵の vehicle-r85a.js は import して よい ＝ 何も 読まない ファイル）
//
// 見た目: 親の 2つが 見て わかる 形
//   ドラまた               … 旅の 魔道士の 服（travel。肩あて・マント）と 頭の バンダナ
//   真理のとびらをひらく者 … 赤い 服と 白い マント（の 色）・はがねの 右うで（mech33）・青い れん成じん（circle33）・金の 目
//   オーラ                 … 赤い 魔力の 炎
// 乗り物: れん成ごちそう車（ごちそうの 荷車の 車りんに れん成じん・足もとに 光る 大きな れん成じん）
// えんしゅつ: touka_madoushi_sig（足もとに れん成じん → とびらが ひらく → 赤い 大ばくはつ）・kizuna_rensei（ひらめき技。炎の 柱）
import { feastCartArt } from './vehicle-r85a.js?v=cb02a9b15ddb';

const ID = 'touka_madoushi';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'travel', main: '#c8302a', cloak: '#f2eee2', r85a: 1.0, r85aLayers: 2 };
const body = { iris: '#d89a1a', mech33: true, circle33: '#3a8ae8', aura: 'touka98' };
const hat = { kind: 'headband', c: '#d89a1a' };
const oldLook = { outfit: 'traveler', cloth: '#c8302a', hat: 'headband', hatColor: '#d89a1a', cape: '#f2eee2' };
const aura = {
  // 赤い 魔力の 炎（ねもとは 金色・さきは こい赤）
  touka98: { glow: 0.55, len: 3.3, wid: 1.15, up: 1.2, gap: 2.1, flicker: 0.2, cols: [['#fff4d0', 210], ['#ffd06a', 182], ['#e8502a', 150], ['#8a1418', 112]] },
};

// ───────────── 乗り物: れん成ごちそう車 ─────────────
function renseiCartArt(kit) {
  const base = feastCartArt(kit);
  const { seg, rgba } = kit;
  const GOLD = '#f2c14e', BLUE = '#5ab8ff', STONE = '#9a9690', STONED = '#6a6660';
  // 車りんの れん成じん（わと 三角。f で 回る）
  const circle = (p, cx, cy, r, f) => {
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      p.set(Math.round(cx + Math.cos(t) * (r + 0.6)), Math.round(cy + Math.sin(t) * (r + 0.6)), GOLD);
    }
    const a0 = (f * Math.PI * 2) / 9;
    const pt = (k) => [cx + Math.cos(a0 + (k * Math.PI * 2) / 3) * (r - 1.6), cy + Math.sin(a0 + (k * Math.PI * 2) / 3) * (r - 1.6)];
    for (let k = 0; k < 3; k++) seg(p, ...pt(k), ...pt(k + 1), BLUE, 1);
  };
  // 石の いた（れん成で 作った 荷台の よこ）
  const stones = (p, x0, x1, y) => {
    for (let x = x0; x <= x1; x++) for (let j = 0; j < 3; j++) p.set(x, y + j, (x - x0) % 6 === 0 || j === 2 ? STONED : STONE);
  };
  return {
    ...base,
    paint(p, view, f, layer) {
      base.paint(p, view, f, layer);
      if (view === 'side' && layer === 'front') {
        stones(p, 34, 56, 37);
        circle(p, 44, 44, 6, f);
      } else if (view === 'side' && layer === 'back') {
        circle(p, 47, 44, 5.6, f);
      } else if (view === 'front' && layer === 'back') {
        for (const s of [-1, 1]) circle(p, 18 + s * 12, 43, 4.5, f);
      } else if (view === 'back' && layer === 'front') {
        for (const s of [-1, 1]) circle(p, 18 + s * 12, 44, 4.5, f);
        stones(p, 8, 28, 36);
      }
    },
    // こうか: 足もとで 光る 大きな れん成じん（青い 2つの わ。コマで 光る 所が 回る）と、のぼる 光の つぶ
    fx(p, view, f) {
      const [w, h] = base.size(view);
      const cx = w / 2, cy = h - 3, rx = w / 2 - 3, ry = 2.6;
      for (let a = 0; a < 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        const lit = (a + f * 5) % 12 < 4;
        p.set(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), rgba(lit ? '#e0f4ff' : BLUE, lit ? 0.85 : 0.5));
        p.set(Math.round(cx + Math.cos(t) * (rx - 4)), Math.round(cy + Math.sin(t) * (ry - 1)), rgba(BLUE, 0.35));
      }
      for (let i = 0; i < 4; i++) {
        const x = 4 + ((i * 13 + f * 4) % (w - 8)), y = h - 8 - ((i * 5 + f * 6) % 20);
        p.set(x, y, rgba(i % 2 ? GOLD : BLUE, 0.7));
      }
    },
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['touka_madoushi_sig', 'kizuna_rensei']);
const HIT = { touka_madoushi_sig: 900, kizuna_rensei: 480 };
const SFX = { touka_madoushi_sig: 'blast', kizuna_rensei: 'fire' };
const CIRCLE = ['#ffffff', '#bfe6ff', '#5ab8ff', '#2a6ad8'];
const BOOM = ['#fff4d0', '#ffd06a', '#e8502a', '#8a1418'];

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
  switch (anim) {
    case 'touka_madoushi_sig': {
      // 1) 敵の 足もとに 青い れん成じん（わが 2つ）→ 2) まん中が 白く ひらく（とびら）→ 3) 赤い 大ばくはつ
      fx.tintAt('rgba(30, 10, 10, 0.45)', 1900);
      each((t, i, d) => {
        fx.ring(t.x, t.y + 10, CIRCLE[2], 4, d, 520, 40 * sz);
        fx.ring(t.x, t.y + 10, CIRCLE[1], 3, d + 120, 480, 26 * sz);
        fx.converge(t.x, t.y, { colors: CIRCLE, n: 14, r: 40 * sz, delay: d + 260, life: 260, size: 1.2 });
        fx.add({ kind: 'orb', x: t.x, y: t.y, color: '#ffffff', r: 16 * sz, life: 300, delay: d + 520 });
        fx.shock(t.x, t.y, { r0: 8, r1: 70 * sz, color: '#ffd06a', w: 3.4, delay: d + 760, life: 460 });
        fx.burst(t.x, t.y, BOOM, 22, 150, { delay: d + 780 });
        fx.fireUp(t.x, t.y, 8, d + 800);
        hitMark(t, d + 900, '#e8502a', 26);
      });
      fx.flashAt(crit ? 220 : 170, '#fff0d8', 880);
      fx.hitStop(crit ? 320 : 260, 900, 1.9);
      return true;
    }
    case 'kizuna_rensei': {
      each((t, i, d) => {
        fx.ring(t.x, t.y + 10, CIRCLE[2], 3, d, 380, 24 * sz);
        fx.fireUp(t.x, t.y, 6, d + 240);
        fx.burst(t.x, t.y, BOOM, 12, 110, { delay: d + 360 });
        hitMark(t, d + 480, '#e8502a', 18);
      });
      fx.hitStop(crit ? 180 : 120, 480, 1.3);
      return true;
    }
    default: return false;
  }
}

export const TOUKA_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: {},
  vehicle: { id: 'rensei_gochisou', art: renseiCartArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};
