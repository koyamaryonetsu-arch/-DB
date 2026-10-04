// さいきょう装備の 見こみ（ドラクエ風。サーバーの 'bestEquip' と メニューの「何が 何に 変わるか」で おなじ 計算を 使う）
// ふくろの 中から、攻撃力（武器）・守備力（よろい・たて・頭）が いちばん 上がる ものを えらぶ。アクセサリーは そのまま
import { ITEMS } from './data/items.js?v=e388712b9c60';
import { computeStats, canEquipChar, addItem, removeItem } from './stats.js?v=e388712b9c60';

export const BEST_SLOTS = ['weapon', 'armor', 'shield', 'head'];

// 1人ぶん: ch の 装備を bag から いれかえる（ch.equip と bag は かえる。変えた 部位を かえす）
function bestFor(ch, bag) {
  const changes = [];
  for (const slot of BEST_SLOTS) {
    const key = slot === 'weapon' ? 'atk' : 'dfn';
    // 大事な 強さ（攻撃力・守備力）→ ほかの 強さの 合計 の じゅんで くらべる
    const score = (id) => {
      const st = computeStats({ ...ch, equip: { ...ch.equip, [slot]: id } });
      return st[key] * 10000 + st.str + st.def + st.agi + st.mag + st.heal + st.maxHp + st.maxMp;
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
