// 第88回 M1班: 魔王の ひらめき技「天地魔闘の構え」の エフェクト（shared/battle-r88m.js。docs/plan-r88-anime-gear.md の 11・12-2）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r86a.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（文字は 出さない）。こわすぎない（黒い 画面に しない。金と 炎の 色）
//
//  r88m_tenchi  天地魔闘の構え（みかた）… 両手を 広げた かまえの 立ちすがた（金の 半円）→ 3つの 技が 順に 光る:
//               天 ＝ 手刀の 白い 光の すじ／地 ＝ 炎の つばさ（左右の おうぎ）／魔 ＝ 小さな 火の 鳥
//  r88m_hand    カラミティエンド（手刀の 反撃。client/battle-r88m.js が ev.r88mHands で 出す）… 白金の 大きな 手刀の すじ ＋ 光の はじけ
//  r88m_bird    カイザーフェニックス（かまえが とける 時の 火の 鳥。ev.r88mBird）… 下から 火の 鳥が とんで 敵で 炎の 爆発
// ・どれも 2.2びょう いないで おわる。あたる じかんは R88M_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=0d338e47b7e9';
import { flames, explosion, pal } from './axkit.js?v=0d338e47b7e9';

const rnd = (a, b) => a + Math.random() * (b - a);
const FIRE = pal('fire');

export const R88M_MOVES = ['r88m_hand', 'r88m_bird'];
export const PARTY_ANIMS_R88M = new Set(['r88m_tenchi']);
export const R88M_ANIMS = new Set([...R88M_MOVES, ...PARTY_ANIMS_R88M]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（第86回 A班と おなじ）
for (const a of PARTY_ANIMS_R88M) PARTY_ANIMS.add(a);

export const R88M_HIT = { r88m_tenchi: 240, r88m_hand: 200, r88m_bird: 560 };
export const R88M_SFX = { r88m_tenchi: 'buff', r88m_hand: 'crit', r88m_bird: 'fire' };

// 火の 鳥（axfx-g4-fine.js の g4Loto を 炎の 色で）
function bird(fx, from, to, { delay = 0, travel = 420, s = 14, life } = {}) {
  fx.add({
    kind: 'g4Loto', x: from.x, y: from.y, x0: from.x, y0: from.y, x1: to.x, y1: to.y, travel, start: 0, ease: 'in', s, pop: 140, flap: 0.35,
    color: '#ff5a10', core: '#ffe08a', glow: '#ff8a1a', edge: '#5a1000', gem: '#fff2a0', delay, life: life ?? travel + 160, seed: Math.random() * 100,
  });
}

export function playR88mFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R88M_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const me = targets[0];
  switch (anim) {
    case 'r88m_tenchi': {
      // かまえの 立ちすがた: 両手を 広げた 金の 半円（上に ひらく）と 足もとの わ
      fx.glow(me.x, me.y - 12, { color: '#fff2c0', r: 30, delay: 0, life: 900, alpha: 0.5 });
      fx.arc(me.x, me.y - 6, { r: 34, a0: -Math.PI + 0.15, a1: -0.15, w: 3, color: '#fff6d0', glow: '#ffc040', delay: 0, life: 900 });
      fx.shock(me.x, me.y + 8, { r0: 8, r1: 60, color: '#ffd060', w: 2, delay: 60, life: 700, sy: 0.3 });
      // 天: 手刀の 白い 光の すじ（右上へ）
      fx.bigCut(me.x + 18, me.y - 20, { ang: -0.9, color: '#ffffff', glow: '#fff0a0', w: 3, delay: 240, life: 360 });
      fx.sparks(me.x + 18, me.y - 20, { colors: ['#ffffff', '#fff0a0'], n: 10, speed: 110, delay: 260, life: 320, len: 6 });
      // 地: 炎の つばさ（左右に ひらく おうぎ）
      fx.fanShape(me.x - 20, me.y - 8, { r: 26, a: -Math.PI / 2 - 0.7, spread: 1.4, color: '#ff8a2a', rib: '#ffe08a', delay: 520, life: 520, ribs: 6 });
      fx.fanShape(me.x + 20, me.y - 8, { r: 26, a: -Math.PI / 2 + 0.7, spread: 1.4, color: '#ff8a2a', rib: '#ffe08a', delay: 520, life: 520, ribs: 6 });
      fx.fireUp(me.x, me.y, 6, 540);
      // 魔: 小さな 火の 鳥が 頭の 上を まわる
      bird(fx, { x: me.x - 30, y: me.y - 10 }, { x: me.x + 4, y: me.y - 40 }, { delay: 800, travel: 420, s: 9, life: 640 });
      for (let k = 0; k < 8; k++) fx.twinkle(me.x + rnd(-40, 40), me.y + rnd(-30, 6), { color: k % 2 ? '#fff2c0' : '#ffb060', size: 4, delay: 820 + k * 40, life: 460, vy: -16 });
      return true;
    }
    case 'r88m_hand': {
      // カラミティエンド: 白金の 手刀の すじ（ななめに 大きく）→ 光の はじけ
      each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#fff6d0', r: 20 * sz, delay: d, life: 260, alpha: 0.7 });
        fx.bigCut(t.x, t.y, { ang: 0.85, color: '#ffffff', glow: '#ffd060', w: 4, delay: d + 60, life: 320 });
        fx.cut(t.x + 6, t.y - 4, { ang: 0.85, len: 44 * sz, w: 2, color: '#ffffff', glow: '#ffe8a0', delay: d + 80, life: 260, speed: 90 });
        fx.impact(t.x, t.y, { r: (crit ? 22 : 16) * sz, color: '#ffffff', delay: d + 200 });
        fx.shock(t.x, t.y, { r0: 4, r1: 36 * sz, color: '#ffd060', w: 2.2, delay: d + 200, life: 320 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd060'], n: all ? 8 : 14, speed: 150, delay: d + 200, life: 340, len: 7 });
      });
      fx.hitStop(crit ? 180 : 130, 200, 1.4);
      return true;
    }
    case 'r88m_bird': {
      // カイザーフェニックス（かまえが とける 時）: 下（みかた）から 火の 鳥 → 炎の 爆発
      const from = opts.from || { x: W / 2, y: H - 22 };
      each((t, i, d) => {
        bird(fx, { x: from.x, y: from.y - 8 }, t, { delay: d, travel: 520, s: 18 * sz });
        for (let k = 0; k < 5; k++) { const u = k / 5; fx.sparks(from.x + (t.x - from.x) * u, from.y + (t.y - from.y) * u, { colors: ['#ff6a1a', '#ffc060', '#fff2a0'], n: 5, speed: 50, g: -40, delay: d + 520 * u, life: 320 }); }
        explosion(fx, t.x, t.y, { r: 22 * sz, pal: FIRE, delay: d + 560, heavy: i === 0 });
        flames(fx, t.x, Math.min(H - 4, t.y + 16), { w: 30 * sz, h: 30 * sz, n: 5, delay: d + 600, life: 700 });
      });
      fx.flashAt(140, '#fff2a0', 560);
      fx.hitStop(crit ? 200 : 140, 560, 1.4);
      return true;
    }
    default: return false;
  }
}
