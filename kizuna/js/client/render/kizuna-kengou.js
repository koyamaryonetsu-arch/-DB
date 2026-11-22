// 第98回 K2班: 天下無そうの剣ごうの 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-kengou.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ
//   （乗り物の 竜は 第85回 B班の dragonArt を 色を かえて 使う。vehicle-r85b.js は kizuna-art.js を 読まないので ぐるぐるに ならない）
//
// 見た目: 親の 2つが 見て わかる 形
//   飛天御剣流けい承者 … 赤い 着物と 白い はかま・白い 重い マント（mantle29）・赤い かみ・ほおの 十字（rurouni・cross）
//   竜神けんのサムライ … 金色の はちまき（headband）・さやは 金・マントの うらは 竜神の みどり・ぱちぱちの 雷（spark）
//   7つの 玉           … オーラは 雷の 金 と 竜神の 青みどり（tama98）
// 乗り物: 七つ玉の天かける竜（白と 青の 竜。まわりを 7色の 玉が 回る・さくらの 花びら）
// えんしゅつ: tenka_kengou_sig（7色の 玉の 切りつけ → 白い もう 一太刀）・kizuna_issen（ひらめき技。神速の 白い 風）
import { dragonArt } from './vehicle-r85b.js?v=9619c3d748be';

const ID = 'tenka_kengou';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'hakama', main: '#c42a3a', hakama: '#ece8e0', sheath: '#c8a040', r29: true, cape: '#f2f0ea', capeIn: '#2aa878', capeLen: 36.8, mantle29: true };
const body = { hair: 'rurouni', hcol: 'rurouni', iris: '#2aa878', cross: true, spark: true, aura: 'tama98' };
const hat = { kind: 'headband', c: '#f2c430' };
const oldLook = { outfit: 'hakama', cloth: '#c42a3a', hakama: '#ece8e0', cape: '#f2f0ea', hat: 'headband', hatColor: '#f2c430' };
const aura = {
  // 左半分 雷の 金・右半分 竜神の 青みどり
  tama98: { glow: 0.55, len: 3.3, wid: 1.1, up: 1.2, gap: 2.1, flicker: 0.2, cols: [['#fffbe0', 212], ['#ffe040', 184], ['#f2a020', 150], ['#a86a10', 112]], cols2: [['#f0fff8', 212], ['#a8f0d8', 184], ['#2aa878', 150], ['#1a5a8a', 112]] },
};

// 7つの 玉の 色（雷・火・水・氷・風・金・竜神。shared/battle-r82b.js の TAMA と おなじ）
const BALLS = ['#ffe040', '#ff6a2a', '#3aa0ff', '#a8e8ff', '#6ae0a0', '#ffc830', '#fff2a8'];

// ───────────── 乗り物: 七つ玉の天かける竜 ─────────────
function skyDragonArt(kit) {
  const base = dragonArt(kit, { body: '#eef2f8', belly: '#6ac8f0', mane: '#2a8ac8', horn: '#ffd04a' });
  const { rgba, twinkle } = kit;
  return {
    ...base,
    // こうか: まわりを 回る 7つの 玉（コマで 回る）と、さくらの 花びら
    fx(p, view, f) {
      const [w, h] = base.size(view);
      const cx = w / 2, cy = h * 0.55, rx = w * 0.42, ry = h * 0.16;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + f * 0.6;
        const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
        p.set(x, y, rgba(BALLS[i], 0.95));
        p.set(x + 1, y, rgba(BALLS[i], 0.7));
        p.set(x, y + 1, rgba(BALLS[i], 0.7));
        p.set(x + 1, y + 1, rgba('#ffffff', 0.5));
      }
      for (let i = 0; i < 3; i++) p.set(3 + ((i * 17 + f * 6) % (w - 6)), 4 + ((i * 11 + f * 5) % (h - 10)), rgba('#ffb0c8', 0.85));
      twinkle(p, 4 + ((f * 13) % (w - 8)), 6 + f * 3, rgba('#ffffff', 0.6));
    },
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['tenka_kengou_sig', 'kizuna_issen']);
const HIT = { tenka_kengou_sig: 760, kizuna_issen: 380 };
const SFX = { tenka_kengou_sig: 'slash', kizuna_issen: 'slash' };

function play(fx, anim, targets, element, opts = {}, W = 256) {
  if (!ANIMS.has(anim) || !targets?.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 320, len: 7 });
  };
  switch (anim) {
    case 'tenka_kengou_sig': {
      // 7色の 玉の 光が つぎつぎに 切りつけ → さいごに 白い 神速の もう 一太刀
      fx.tintAt('rgba(10, 20, 40, 0.36)', 1300);
      each((t, i, d) => {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          fx.impact(t.x + Math.cos(a) * 9 * sz, t.y + Math.sin(a) * 7 * sz, { r: 9 * sz, color: BALLS[k], delay: d + k * 70 });
          fx.sparks(t.x, t.y, { colors: [BALLS[k], '#ffffff'], n: 5, speed: 160, delay: d + k * 70, life: 260, len: 8 });
        }
        fx.gust(t.x - 40, t.y - 6, { len: 80, amp: 1, color: '#ffffff', w: 2.4, dir: 1, delay: d + 600, life: 240 });
        fx.shock(t.x, t.y, { r0: 4, r1: 44 * sz, color: '#ffffff', w: 2.6, delay: d + 680, life: 360 });
        hitMark(t, d + 760, '#fff2a8', 22);
      });
      fx.flashAt(140, '#ffffff', 760);
      fx.hitStop(crit ? 240 : 170, 760, 1.5);
      return true;
    }
    case 'kizuna_issen': {
      each((t, i, d) => {
        fx.gust(t.x - 50, t.y - 4, { len: 100, amp: 2, color: '#ffffff', w: 2, dir: 1, delay: d, life: 260 });
        fx.impact(t.x, t.y, { r: 12 * sz, color: BALLS[i % 7], delay: d + 160 });
        hitMark(t, d + 380, '#6ae0a0', 16);
      });
      fx.hitStop(crit ? 160 : 110, 380, 1.2);
      return true;
    }
    default: return false;
  }
}

export const KENGOU_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: {},
  vehicle: { id: 'tenkakeru_ryu', art: skyDragonArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};
