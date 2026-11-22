// 第101回 R3班: 「かんたんな 人」（しくみは わかって いるが、かんたんな 動きしか しない 人 … 子ども）の えらび方（docs/plan-sim-vs-real.md の 12）
//   本物の 流れ（tools/real-boss.mjs の HUMAN=easy）と 道具（tools/sim-ch9.mjs の ch9Run の mode 'easy'）の 両方で 同じ きまり
//   1) しくみの コマンドは 知って いる 人と 同じ（そのボスの 知って いる 人の しくみの 役 … shared/battle-c9a.js の c9aPlan〈各 幕の …Plan〉に
//      「ふだんの えらび方」として 下の 2)〜4) を わたす。前ぶれで ねらわれたら 防御・音を鳴らす・時計を投げる・うつる・てらす・皿・なぞの 答え など。
//      しくみで ねらいが 決まる 時〈皿・すいこみ口・本物・HPの 多い 方 …〉は その ねらい）
//   2) 味方の だれかが たおれて いて、生き返らせる 技か 道具を 持って いれば 使う（easy0 は しない）
//   3) 味方の HPが 4わり いか … 回復の 技（全体の 回復が あれば それ）か 回復の 道具
//   4) ほかは いちばん 強い こうげきの 技（その 敵への ダメージの 見こみが いちばん 大きい 物。全体の 技は 当たる 敵の 合計）。MP が 足りなければ「戦う」
//      ねらいは HPが いちばん 多い 敵。合体技・補助の 技・こまかい 番の 読みは しない
//   道具 … 本物の 流れでは その 人の ふくろ（b.hooks.hasItem）。道具（sim）には ふくろが ないので 使わない
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { canUse } from '../public/js/shared/ai.js';
import { c9aPlan } from '../public/js/shared/battle-c9a.js';
import { MODES9 } from './sim-ch9.mjs';

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const usable = (b, a, id) => canUse(b, a, id) && !ABILITIES[id]?.noAuto && !a.autoOff?.includes(id);
const hasItem = (b, a, id) => !!b.hooks?.hasItem && b.hooks.hasItem(a, id);
const bagOf = (b, a, pred) => Object.keys(ITEMS).filter((id) => ITEMS[id].type === 'use' && ITEMS[id].battle && pred(ITEMS[id]) && hasItem(b, a, id));
const avgBase = (e) => (Array.isArray(e?.base) ? (e.base[0] + e.base[1]) / 2 : e?.base || 0);

// その 敵（たち）への ダメージの 見こみ（shared/battle-c9a.js の bestHit と 同じ 計算）
function dmgOn(b, a, e, t) {
  if (e.type === 'phys') {
    const r = b.calcPhys(a, t, e, 1, e.element || 'phys', true);
    return r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
  }
  if (e.type === 'magic') return b.calcMagic(a, t, e, 1, true).dmg;
  return 0;
}
// 2)〜4) ふだんの えらび方（revive … 生き返らせるか）
export function easyBase(b, a, { revive = true } = {}) {
  const foes = b.aliveEnemies();
  const top = foes.slice().sort((x, y) => y.hp - x.hp)[0];
  const abil = (a.abilities || []).filter((id) => ABILITIES[id] && usable(b, a, id));
  // 2) 生き返らせる
  const dead = b.allies.filter((x) => !x.alive && !x.fled && x.kind !== 'guest');
  if (revive && dead.length) {
    const revs = abil.filter((id) => ['revive', 'reviveAll'].includes(prim(ABILITIES[id]).type));
    const all = revs.find((id) => ABILITIES[id].target === 'deadAllies');
    if (all && dead.length >= 2) return { type: 'ability', id: all };
    const one = revs.filter((id) => ABILITIES[id].target === 'deadAlly').sort((x, y) => (prim(ABILITIES[y]).hpRatio || 0) - (prim(ABILITIES[x]).hpRatio || 0))[0];
    if (one) return { type: 'ability', id: one, target: dead[0].id };
    if (all) return { type: 'ability', id: all };
    const it = bagOf(b, a, (x) => x.effect?.type === 'revive')[0];
    if (it) return { type: 'item', id: it, target: dead[0].id };
  }
  // 3) 回復（HP 4わり いか）
  const low = b.aliveAllies().filter((x) => x.kind !== 'guest' && x.hp <= x.maxHp * 0.4).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  if (low.length) {
    const heals = abil.filter((id) => prim(ABILITIES[id]).type === 'heal' && ['ally', 'allies', 'self'].includes(ABILITIES[id].target));
    const all = heals.filter((id) => ABILITIES[id].target === 'allies').sort((x, y) => avgBase(prim(ABILITIES[y])) - avgBase(prim(ABILITIES[x])))[0];
    if (all) return { type: 'ability', id: all };
    const one = heals.filter((id) => ABILITIES[id].target === 'ally' || low[0] === a).sort((x, y) => avgBase(prim(ABILITIES[y])) - avgBase(prim(ABILITIES[x])))[0];
    if (one) return ABILITIES[one].target === 'ally' ? { type: 'ability', id: one, target: low[0].id } : { type: 'ability', id: one };
    const it = bagOf(b, a, (x) => x.effect?.type === 'heal' && x.target === 'ally').sort((x, y) => avgBase(ITEMS[y].effect) - avgBase(ITEMS[x].effect))[0];
    if (it) return { type: 'item', id: it, target: low[0].id };
  }
  if (!top) return { type: 'defend' };
  // 4) いちばん 強い こうげきの 技（なければ「戦う」）
  let best = null;
  for (const id of abil) {
    const ab = ABILITIES[id];
    if (ab.kind === 'combo' || !['enemy', 'enemies', 'group'].includes(ab.target)) continue;
    const e = prim(ab);
    if (!['phys', 'magic'].includes(e.type)) continue;
    const ts = ab.target === 'enemy' ? [top] : ab.target === 'group' ? b.groupOf(a, top) : foes;
    const dmg = ts.reduce((s, t) => s + dmgOn(b, a, e, t), 0);
    if (dmg > 0 && (!best || dmg > best.dmg)) best = { dmg, cmd: { type: 'ability', id, ...(ab.target === 'enemies' ? {} : { target: top.id }) } };
  }
  const r0 = b.calcPhys(a, top, { mult: 1 }, 1, 'phys', true);
  if (best && best.dmg > r0.dmg * r0.hit) return best.cmd;
  return { type: 'attack', target: top.id };
}
// 1)〜4): しくみの ある ボスでは 知って いる 人の しくみの 役（ふだんの えらび方は easyBase）
export function easyCmd(b, a, { revive = true } = {}) {
  const base = (bb, c) => easyBase(bb, c, { revive });
  const k0 = a.knows9;
  a.knows9 = 'know';
  try {
    const cmd = c9aPlan(b, a, base);
    if (cmd && cmd.type !== 'ai') return cmd;
  } finally {
    a.knows9 = k0;
  }
  return base(b, a);
}

// 道具（tools/sim-ch9.mjs の ch9Run）の やり方 'easy'・'easy0'（Object.keys(MODES9) には 出さない … 前の 道具の 回し方を かえない）
function easyAct(revive) {
  return (b, a) => {
    const cmd = easyCmd(b, a, { revive });
    if (b.command(a.id, cmd, a.controller)?.ok) return true;
    const top = b.aliveEnemies().slice().sort((x, y) => y.hp - x.hp)[0];
    if (top && b.command(a.id, { type: 'attack', target: top.id }, a.controller)?.ok) return true;
    return !!b.command(a.id, { type: 'defend' }, a.controller)?.ok;
  };
}
for (const [k, revive, label] of [['easy', true, 'かんたんな人'], ['easy0', false, 'かんたん(蘇生なし)']]) {
  if (!MODES9[k]) Object.defineProperty(MODES9, k, { value: { label, know: true, act: easyAct(revive) }, enumerable: false });
}
