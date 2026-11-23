// 第86回 A班: 幻の職業 2つの 技の エフェクト（人とようかいのかけ橋・竜神の剣士。docs/plan-r86-phantom-a.md）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r85b.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない。竜の 体は 第85回 B班の うねる 竜（FINE の r85bDragon）を 色を かえて 使う
//
// 人とようかいのかけ橋（白と 赤。風は うすい みどり）
//  r86a_kaze         守りの風のきず・ためた力の返し風 … 白い 風の 刃が 3本 地を はしり、敵全体で はじける
//  r86a_onizume      おにの手のつめ・連げき・白い犬のきば … 赤い おにの手と 白い つめあと（3本）
//  r86a_mamori       きずなの守り・みんなを守るちかい（みかた）… 白と 赤の たての 光
//  r86a_kizuna       きずなの力（みかた）… 白い ようかいの 光と 赤い おにの 光が より合わさって 体に 入る
//  yokai_bridge_sig  人とようかいのきずな 1だん目（みかた）… 仲間を つつむ 白い 大きな 守りの わ・赤い 印
//  r86a_burst        人とようかいのきずな 2だん目（ためた力の 大きな 風。client/battle-r86a.js が ev.r86aBurst で 出す）
// 竜神の剣士（青い 雷と 赤い 炎）
//  r86a_futae        二色の太刀・竜神の連続切り … 青と 赤の 2本の 切りあと
//  r86a_senpu        二色のせんぷう剣・二ひきの竜のきば … 青と 赤の つむじ風が 敵全体を まわる
//  r86a_raien        雷と炎のあらし … いなずまと 火ばしらが 敵全体に
//  r86a_kokoro       竜の心（みかた）… 青い 竜と 赤い 竜が 体の まわりを まわる
//  ryujin_kenshi_sig 竜神・火竜・二重の太刀 … 青い 雷の 竜 → 赤い 火の 竜が つづけて とびこみ、十字の 大きな 切りあと
// ・どれも 2.2びょう いないで おわる。あたる じかんは R86A_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=cb02a9b15ddb';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R86A_SIGS = ['yokai_bridge_sig', 'ryujin_kenshi_sig'];
export const R86A_MOVES = ['r86a_kaze', 'r86a_onizume', 'r86a_burst', 'r86a_futae', 'r86a_senpu', 'r86a_raien'];
export const PARTY_ANIMS_R86A = new Set(['yokai_bridge_sig', 'r86a_mamori', 'r86a_kizuna', 'r86a_kokoro']);
export const R86A_ANIMS = new Set([...R86A_SIGS, ...R86A_MOVES, ...PARTY_ANIMS_R86A]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（第85回 B班と おなじ）
for (const a of PARTY_ANIMS_R86A) PARTY_ANIMS.add(a);

export const R86A_HIT = {
  yokai_bridge_sig: 300, ryujin_kenshi_sig: 760,
  r86a_kaze: 420, r86a_onizume: 300, r86a_burst: 620, r86a_futae: 340, r86a_senpu: 460, r86a_raien: 520,
  r86a_mamori: 220, r86a_kizuna: 300, r86a_kokoro: 300,
};
export const R86A_SFX = {
  yokai_bridge_sig: 'buff', ryujin_kenshi_sig: 'crit',
  r86a_kaze: 'wind', r86a_onizume: 'smash', r86a_burst: 'wind', r86a_futae: 'crit', r86a_senpu: 'wind', r86a_raien: 'bolt',
  r86a_mamori: 'buff', r86a_kizuna: 'buff', r86a_kokoro: 'buff',
};

// 竜の 色と 形（battlefx-r85b.js の r85bDragon が 読む。w … ふとさ、len … ながさ、amp・freq … うねり、fin … 背の 刃、spark … 光る 頭）
export const R86A_DRAGON = {
  bolt: { color: '#3a8aff', color2: '#fff080', w: 4.4, len: 0.42, amp: 9, freq: 2.2, spark: true },
  fire: { color: '#e8301c', color2: '#ffd04a', w: 4.4, len: 0.42, amp: 9, freq: 2.2, fin: true },
};
const BLUE = ['#ffffff', '#fff080', '#6ab8ff', '#2a6ae8'];
const RED = ['#fff0a0', '#ffb040', '#ff6a1c', '#d8301c'];
const WHITE = ['#ffffff', '#f4f0e8', '#e8e0f0', '#ffd0d0'];

function dragon(fx, look, from, to, { delay = 0, life = 800, s = 1, ph = 0 } = {}) {
  fx.add({ kind: 'r85bDragon', x: to.x, y: to.y, x0: from.x, y0: from.y, x1: to.x, y1: to.y, look, s, ph, delay, life });
}
function ringDragon(fx, look, cx, cy, { delay = 0, life = 1000, s = 0.8, rx = 26, ry = 10, ph = 0 } = {}) {
  fx.add({ kind: 'r85bDragon', x: cx, y: cy, cx, cy, rx, ry, look: { ...look, ring: true, len: 0.5 }, s, ph, delay, life });
}

export function playR86aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R86A_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const me = targets[0];
  const avgY = targets.reduce((a, t) => a + t.y, 0) / targets.length;
  // 剣の 色: 当たった 属性（炎 ＝ 赤・ほかは 青）
  const elCol = (el) => (el === 'fire' ? '#ff5a2a' : el === 'water' ? '#3aa0ff' : el === 'ice' ? '#a8e8ff' : el === 'wind' ? '#6ae0a0' : el === 'light' ? '#fff2a8' : '#5aa0ff');
  switch (anim) {
    // ───── 人とようかいのかけ橋 ─────
    case 'r86a_kaze': {
      for (let k = 0; k < 3; k++) fx.gust(W * 0.2, avgY + (k - 1) * 10, { len: W * 0.7, amp: 5, color: k === 1 ? '#ffffff' : '#c8ffd8', w: 1.6, dir: 1, delay: k * 60, life: 520 });
      each((t, i, d) => {
        fx.bigCut(t.x, t.y, { ang: 0.3 + i * 0.2, color: '#ffffff', glow: '#9af0b8', w: 3, delay: d + 300, life: 320 });
        fx.shock(t.x, t.y, { r0: 4, r1: 30 * sz, color: '#d8ffe4', w: 2, delay: d + 340, life: 360 });
        hitMark(t, d + 420, '#9af0b8', 16);
      });
      fx.hitStop(crit ? 160 : 110, 420, 1.1);
      return true;
    }
    case 'r86a_onizume': {
      each((t, i, d) => {
        fx.glow(t.x, t.y - 4, { color: '#ff3a2a', r: 22 * sz, delay: d, life: 360, alpha: 0.6 });
        for (let k = 0; k < 3; k++) fx.cut(t.x - 8 + k * 8, t.y - 4, { ang: 1.1, len: 30 * sz, w: 2, color: '#ffffff', glow: '#ff5a4a', delay: d + 120 + k * 40, life: 260, speed: 80 });
        hitMark(t, d + 300, '#ff5a4a', 18);
      });
      fx.hitStop(crit ? 180 : 120, 300, 1.2);
      return true;
    }
    case 'r86a_mamori': {
      fx.glow(me.x, me.y - 8, { color: '#ffffff', r: 26, delay: 0, life: 520, alpha: 0.6 });
      fx.shock(me.x, me.y + 4, { r0: 6, r1: 44, color: '#ff8a8a', w: 2.2, delay: 80, life: 480, sy: 0.4 });
      fx.arrows(me.x, me.y - 4, '#ffffff', true, 2, 160);
      return true;
    }
    case 'r86a_kizuna': {
      fx.swirl(me.x - 6, me.y, WHITE, { n: 16, rad: 14, h: 44, delay: 0, life: 640, size: 1.4 });
      fx.swirl(me.x + 6, me.y, ['#ffd0c0', '#ff6a4a', '#d8201c'], { n: 16, rad: 14, h: 44, delay: 80, life: 640, size: 1.4 });
      fx.glow(me.x, me.y - 6, { color: '#fff0f0', r: 24, delay: 260, life: 460, alpha: 0.7 });
      fx.arrows(me.x, me.y - 4, '#ff6a4a', true, 3, 240);
      return true;
    }
    case 'yokai_bridge_sig': {
      // 仲間を つつむ 白い 大きな 守りの わ（1だん目）
      fx.tintAt('rgba(255, 255, 255, 0.12)', 900);
      fx.shock(me.x, me.y + 6, { r0: 10, r1: 90, color: '#ffffff', w: 3, delay: 0, life: 700, sy: 0.32 });
      fx.shock(me.x, me.y + 6, { r0: 8, r1: 70, color: '#ff6a5a', w: 2, delay: 160, life: 640, sy: 0.32 });
      fx.glow(me.x, me.y - 10, { color: '#ffffff', r: 36, delay: 120, life: 700, alpha: 0.5 });
      for (let k = 0; k < 10; k++) fx.twinkle(me.x + rnd(-60, 60), me.y + rnd(-14, 8), { color: k % 2 ? '#ffffff' : '#ffb0a8', size: 5, delay: 200 + k * 40, life: 520, vy: -20 });
      return true;
    }
    case 'r86a_burst': {
      // ためた力の 大きな 風（2だん目）
      fx.tintAt('rgba(220, 255, 230, 0.18)', 1200);
      for (let k = 0; k < 5; k++) fx.gust(-10, avgY - 30 + k * 14, { len: W + 20, amp: 6, color: k % 2 ? '#ffffff' : '#b8ffd0', w: 2, dir: 1, delay: k * 50, life: 700 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 6, ['#ffffff', '#c8ffd8', '#ff8a7a'], { n: 18, rad: 16 * sz, h: 46, delay: d + 300, life: 600, size: 1.5 });
        fx.bigCut(t.x, t.y, { ang: -0.4, color: '#ffffff', glow: '#ff6a5a', w: 3.5, delay: d + 560, life: 340 });
        hitMark(t, d + 620, '#ffffff', 22);
      });
      fx.flashAt(180, '#ffffff', 600);
      fx.hitStop(crit ? 240 : 180, 620, 1.6);
      return true;
    }
    // ───── 竜神の剣士 ─────
    case 'r86a_futae': {
      each((t, i, d) => {
        const c1 = elCol(opts.els?.[0] || element);
        fx.arc(t.x, t.y, { r: 24 * sz, a0: -2.6, a1: 0.4, w: 4, color: '#ffffff', glow: '#4a9aff', delay: d, life: 280 });
        fx.arc(t.x, t.y, { r: 20 * sz, a0: 0.6, a1: 3.4, w: 4, color: '#ffffff', glow: '#ff5a2a', delay: d + 90, life: 280 });
        fx.zap(t.x - 20, t.y - 26, t.x + 4, t.y, { color: '#fff6b0', glow: '#6ab8ff', w: 1.2, delay: d + 60, life: 220 });
        fx.fireUp(t.x, t.y, 4, d + 160);
        hitMark(t, d + 340, c1, 18);
      });
      fx.hitStop(crit ? 200 : 130, 340, 1.3);
      return true;
    }
    case 'r86a_senpu': {
      each((t, i, d) => {
        fx.swirl(t.x - 4, t.y + 6, BLUE, { n: 14, rad: 14 * sz, h: 40, delay: d, life: 600, size: 1.4 });
        fx.swirl(t.x + 4, t.y + 6, RED, { n: 14, rad: 14 * sz, h: 40, delay: d + 80, life: 600, size: 1.4 });
        fx.bigCut(t.x, t.y, { ang: 0.2, color: '#ffffff', glow: elCol(element), w: 2.6, delay: d + 380, life: 300 });
        hitMark(t, d + 460, elCol(element), 14);
      });
      fx.hitStop(crit ? 160 : 110, 460, 1.1);
      return true;
    }
    case 'r86a_raien': {
      fx.tintAt('rgba(20, 10, 40, 0.3)', 1100);
      each((t, i, d) => {
        fx.zap(t.x + rnd(-6, 6), 0, t.x, t.y, { color: '#fff6b0', glow: '#6ab8ff', w: 1.8, delay: d + 100, life: 300, forks: 2 });
        fx.pillar(t.x, t.y + 8, '#ff6a1c', { w: 7 * sz, h: 50, delay: d + 300, life: 460, edge: '#ffd04a' });
        fx.fireUp(t.x, t.y, 6, d + 320);
        hitMark(t, d + 520, '#ffb040', 16);
      });
      fx.flashAt(120, '#fff8d0', 120);
      fx.hitStop(crit ? 180 : 120, 520, 1.2);
      return true;
    }
    case 'r86a_kokoro': {
      ringDragon(fx, R86A_DRAGON.bolt, me.x, me.y - 2, { life: 1000, rx: 24, ry: 10, ph: 0 });
      ringDragon(fx, R86A_DRAGON.fire, me.x, me.y + 2, { life: 1000, rx: 24, ry: 10, ph: Math.PI });
      fx.glow(me.x, me.y - 6, { color: '#e8f0ff', r: 22, delay: 300, life: 500, alpha: 0.6 });
      fx.arrows(me.x, me.y - 4, '#6ab8ff', true, 3, 260);
      return true;
    }
    case 'ryujin_kenshi_sig': {
      fx.tintAt('rgba(10, 6, 30, 0.45)', 1800);
      each((t, i, d) => {
        // 1ぴきめ: 青い 雷の 竜 → 2ひきめ: 赤い 火の 竜
        dragon(fx, R86A_DRAGON.bolt, { x: -30, y: t.y - 40 }, { x: t.x + 10, y: t.y - 4 }, { delay: d, life: 600, s: 1.15 });
        fx.zap(t.x - 10, 0, t.x, t.y, { color: '#fff6b0', glow: '#6ab8ff', w: 2, delay: d + 420, life: 280, forks: 2 });
        fx.bigCut(t.x, t.y, { ang: 0.7, color: '#ffffff', glow: '#4a9aff', w: 4, delay: d + 460, life: 320 });
        dragon(fx, R86A_DRAGON.fire, { x: W + 30, y: t.y - 40 }, { x: t.x - 10, y: t.y - 4 }, { delay: d + 360, life: 600, s: 1.15, ph: 0.5 });
        fx.fireUp(t.x, t.y, 10, d + 720);
        fx.bigCut(t.x, t.y, { ang: -0.7, color: '#ffffff', glow: '#ff5a2a', w: 4, delay: d + 740, life: 320 });
        fx.shock(t.x, t.y, { r0: 8, r1: 64 * sz, color: '#ffd04a', w: 3.5, delay: d + 760, life: 460 });
        hitMark(t, d + 760, '#ffffff', 26);
      });
      fx.flashAt(220, '#fff0e0', 760);
      fx.hitStop(crit ? 300 : 240, 760, 1.9);
      return true;
    }
    default: return false;
  }
}
