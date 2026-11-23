// 第88回 G15班: ダイの大冒険・ドラゴンクエストの 品の 戦いの しくみ（docs/plan-r88-anime-gear.md の 4-3・4-4。設計書の「実装メモ（G15班）」）
//   ・呪文を はね返す（シャハルの鏡・天空のたての「使う」。effect { type: 'r88dq', kind: 'mirror' }）
//       使った 人に c.r88Mirror。次に 敵が その 人に 呪文を となえると、その 人の 分は はね返って となえた 敵に 当たる（1回で 消える）
//       battle.js の perform（味方が 光った 敵に となえた 時の reflectSpell の すぐ あと）が r88MirrorSpell を よぶ
//   ・動けなく する（ゴールドフェザー・き眼の力。effect { type: 'r88dq', kind: 'bind' }）… マヒ。ボスには 効かない
//   ・光魔のつえ（品の atkMp）… MPが 多いほど ふつうの 攻撃が 強い。攻撃の たびに MPが へる
//   ・ブラックロッド（品の atkMag）… 攻撃魔力が 高いほど ふつうの 攻撃が 強い
//   ・まじんのかなづち（品の atkAcc）… ふつうの 攻撃が 外れやすい（会心は 品の crit）
//   どれも 戦いの 中だけ（セーブしない）。battle.js は import しない（battle.js・battle-gearfx.js から よばれる）
import { ITEMS, baseItemId } from './data/items.js?v=b3f22aad5877';

// はね返った 呪文の 強さ（となえた 敵に 当たる。1回で たおれて しまわない ように、さいだいHPの MIRROR_CAP まで）
export const MIRROR_MULT = 1;
export const MIRROR_CAP = 0.12;
// 光魔のつえ: MP 1 ごとの 強さ（いちばん 上まで）・攻撃 1回で へる MP（さいだいMPの わりあい。少なくとも MP_MIN）
export const KOUMA_PER_MP = 1 / 300;
export const KOUMA_MAX = 0.8;
export const KOUMA_COST = 0.03;
export const KOUMA_MIN = 3;
// ブラックロッド: 攻撃魔力が MAG_FROM より 高い 分 MAG_PER ごとに 強く なる（いちばん 上まで）
export const ROD_MAG_FROM = 100;
export const ROD_MAG_PER = 600;
export const ROD_MAX = 0.5;

const foeKinds = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
// 呪文（味方の 呪文と 同じ kind。魔物の 技は「唱えた」呪文だけ。ブレスは 入らない）
export function isSpellLike(a) {
  if (!a) return false;
  if (a.kind === 'spell' || a.spellLike) return true;
  return a.kind === 'monster' && prim(a).type === 'magic' && /唱え|となえ/.test(a.cast || '');
}
const weaponOf = (c) => (c?.side === 'ally' && c.weaponId ? ITEMS[baseItemId(c.weaponId)] || ITEMS[c.weaponId] || null : null);

// ───────────── 技の 効果（battle.js の applyAbility の case 'r88dq'）─────────────
export function r88dqEffect(b, c, a, eff, ev, targets, powMult = 1) {
  if (eff.kind === 'mirror') {
    for (const t of targets.length ? targets : [c]) {
      if (!t?.alive) continue;
      t.r88Mirror = true;
      ev.lines.push(`${t.name}の前に、呪文をはね返す光のかべができた！`);
      if (!ev.upd.includes(t)) ev.upd.push(t);
    }
    return true;
  }
  if (eff.kind === 'bind') {
    for (const t of targets) {
      if (!t?.alive) continue;
      // ボス（大きな 敵）には 効かない
      if (t.boss) {
        ev.lines.push(`しかし${t.name}は大きすぎて、動きを止められない！`);
        continue;
      }
      b.tryStatus(c, t, { status: 'paralyze', chance: eff.chance ?? 0.85, turns: eff.turns || [2, 2] }, ev, powMult);
    }
    return true;
  }
  return false;
}

// ───────────── 呪文を はね返す（battle.js の perform。MPを はらった あと）─────────────
//   敵が、光の かべの ある 味方に 呪文を となえた。はね返したら true（あたる ぶんも ここで あてる）
export function r88MirrorSpell(b, c, a, cmd, ev, powMult, targets) {
  if (c.side !== 'enemy' || !isSpellLike(a) || !foeKinds.has(a.target)) return false;
  const back = (targets || []).filter((t) => t?.alive && t.side !== c.side && t.r88Mirror);
  if (!back.length) return false;
  for (const t of back) t.r88Mirror = false;
  const keep = targets.filter((t) => !back.includes(t));
  if (keep.length) b.applyAbility(c, a, cmd, ev, powMult, keep);
  const t0 = back[0];
  ev.lines.push(`${t0.name}の光のかべが、呪文をはね返した！`);
  bounce(b, c, a, ev, powMult);
  const hit = new Set([...(ev.fx?.targets || []), ...back.map((t) => t.id), c.id]);
  ev.fx = { ...(ev.fx || {}), type: 'ability', anim: a.anim, actor: c.id, targets: [...hit], side: c.side, element: prim(a).element, reflect: t0.id };
  for (const t of back) if (!ev.upd.includes(t)) ev.upd.push(t);
  return true;
}
// はね返った 呪文が となえた 敵に 当たる（ダメージの 呪文は ダメージ・じょうたいの 呪文は じょうたい・ほかは 消える）
function bounce(b, c, a, ev, powMult) {
  const e = prim(a);
  if ((e.type === 'magic' || e.type === 'gather') && Array.isArray(e.base)) {
    const res = b.calcMagic(c, c, { ...e, type: 'magic', base: e.base.map((v) => Math.max(1, Math.round(v * MIRROR_MULT))) }, powMult);
    const dmg = Math.min(res.dmg, Math.max(1, Math.round(c.maxHp * MIRROR_CAP)));
    if (res.resisted || dmg <= 0) ev.lines.push(`${c.name}はダメージを受けない！`);
    else b.damage(c, c, dmg, ev, { element: e.element });
    return;
  }
  if (e.type === 'status' && e.status) {
    if (c.boss && (e.status === 'paralyze' || e.status === 'sleep')) ev.lines.push(`しかし${c.name}には効かなかった！`);
    else b.tryStatus(c, c, e, ev, powMult);
    return;
  }
  ev.lines.push('はね返った呪文は、光になって消えた。');
}

// ───────────── ふつうの 攻撃（battle-gearfx.js の attackMods・battle.js の case 'attack'）─────────────
// 強さの 倍率（光魔のつえ・ブラックロッド。ほかの 武器は 1）
export function r88dqAtkMult(c) {
  const w = weaponOf(c);
  if (!w) return 1;
  if (w.atkMp) return 1 + Math.min(KOUMA_MAX, Math.max(0, c.mp || 0) * KOUMA_PER_MP);
  if (w.atkMag) return 1 + Math.min(ROD_MAX, Math.max(0, (c.mag || 0) - ROD_MAG_FROM) / ROD_MAG_PER);
  return 1;
}
// 当たりやすさ（まじんのかなづち。ほかの 武器は undefined ＝ いつもの まま）
export function r88dqAcc(c) {
  const w = weaponOf(c);
  return w?.atkAcc || undefined;
}
// 攻撃の あと: 光魔のつえは MPが へる
export function r88dqAfterAttack(b, c, ev) {
  const w = weaponOf(c);
  if (!w?.atkMp || !(c.mp > 0)) return;
  const cost = Math.min(c.mp, Math.max(KOUMA_MIN, Math.round((c.maxMp || 0) * KOUMA_COST)));
  c.mp -= cost;
  ev.lines.push(`光魔のつえが、${c.name}のMPを${cost}すいとった！`);
  if (!ev.upd.includes(c)) ev.upd.push(c);
}
