// さいきょう装備の 見こみ（ドラクエ風。サーバーの 'bestEquip' と メニューの「何が 何に 変わるか」で おなじ 計算を 使う）
// ふくろの 中から、攻撃力（武器）・守備力（よろい・たて・頭）が いちばん 上がる ものを えらぶ。アクセサリーは そのまま
// 呪文が 得意な 職業（魔法使い・僧侶・賢者 など）の 武器は、攻撃魔力・回復魔力も 重く みる（やりより つえ）
import { ITEMS } from './data/items.js?v=85276ba91554';
import { JOBS } from './data/jobs.js?v=85276ba91554';
import { computeStats, canEquipChar, addItem, removeItem } from './stats.js?v=85276ba91554';

export const BEST_SLOTS = ['weapon', 'armor', 'shield', 'head'];

// みんなさいきょう装備で きめる じゅんばん: 戦う 仲間（ならびの じゅん。自分は selfPos の ところ）→ 馬車の 仲間
// （1つしか ない 物は 先の 人が 使う。サーバーの ownTeamChars と メニューの bestTeam で おなじ じゅんに する）
export function bestTeamOrder(self, sups, wagon, selfPos) {
  const pos = Math.max(0, Math.min(sups.length, Number.isInteger(selfPos) ? selfPos : 0));
  return [...sups.slice(0, pos), self, ...sups.slice(pos), ...(wagon || [])];
}

// 武器で 重く みる 強さ。呪文の 職業（攻撃魔力か 回復魔力が 力より はっきり 高い）は 魔力も、それ以外は 攻撃力だけ
export function weaponWeights(ch) {
  const m = !ch?.species && JOBS[ch?.job]?.mods;
  if (!m || Math.max(m.mag, m.heal) < m.str + 0.3) return { atk: 1, mag: 0, heal: 0 };
  const top = Math.max(m.mag, m.heal);
  return { atk: 0.35, mag: m.mag / top, heal: m.heal / top };
}

// 1人ぶん: ch の 装備を bag から いれかえる（ch.equip と bag は かえる。変えた 部位を かえす）
function bestFor(ch, bag) {
  const changes = [];
  const w = weaponWeights(ch);
  for (const slot of BEST_SLOTS) {
    // 大事な 強さ（武器は 攻撃力〈呪文の 職業は 魔力も〉、ほかは 守備力）→ ほかの 強さの 合計 の じゅんで くらべる
    const main = (st) => (slot === 'weapon' ? st.atk * w.atk + st.mag * w.mag + st.heal * w.heal : st.dfn);
    const score = (id) => {
      const st = computeStats({ ...ch, equip: { ...ch.equip, [slot]: id } });
      return Math.round(main(st) * 100) * 10000 + st.str + st.def + st.agi + st.mag + st.heal + st.maxHp + st.maxMp;
    };
    const cur = ch.equip?.[slot] || null;
    let best = cur;
    let bestScore = score(cur);
    for (const e of bag.items) {
      if (e.n < 1 || ITEMS[e.id]?.type !== slot || !canEquipChar(ch, e.id)) continue;
      const sc = score(e.id);
      if (sc > bestScore) { best = e.id; bestScore = sc; }
    }
    if (!best || best === cur || !removeItem(bag, best, 1)) continue;
    // はずした 物は ふくろへ（つぎの 人が 使える）
    if (cur) addItem(bag, cur, 1);
    ch.equip[slot] = best;
    changes.push({ slot, from: cur, to: best });
  }
  return changes;
}

// team: [{ key, char }]（ならびの じゅんに きめる）。bag: ふくろ（{ items: [{ id, n }] }）
// どちらも かえない。かえす もの: 変わる 人だけ [{ key, name, changes: [{ slot, from, to }], before, after }]
//   before・after は computeStats の 結果（強さが どう 変わるか 見せる）
export function bestEquipPlan(team, bag) {
  const pool = { items: (bag?.items || []).map((e) => ({ id: e.id, n: e.n })), keyItems: [] };
  const out = [];
  for (const m of team || []) {
    if (!m?.char) continue;
    const ch = { ...m.char, equip: { ...(m.char.equip || {}) } };
    const before = computeStats(ch);
    const changes = bestFor(ch, pool);
    if (changes.length) out.push({ key: m.key, name: ch.name, changes, before, after: computeStats(ch) });
  }
  return out;
}
