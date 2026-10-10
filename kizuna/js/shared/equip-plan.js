// さいきょう装備の 見こみ（ドラクエ風。サーバーの 'bestEquip' と メニューの「何が 何に 変わるか」で おなじ 計算を 使う）
// ふくろの 中から、攻撃力（武器）・守備力（よろい・たて・頭）が いちばん 上がる ものを えらぶ。アクセサリーは そのまま
// 呪文が 得意な 職業（魔法使い・僧侶・賢者 など）の 武器は、攻撃魔力・回復魔力も 重く みる（やりより つえ）
import { ITEMS } from './data/items.js?v=1a19851ff61f';
import { JOBS } from './data/jobs.js?v=1a19851ff61f';
import { computeStats, canEquipChar, addItem, removeItem } from './stats.js?v=1a19851ff61f';

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

// その 部位に id を 装備した ときの 強さ（大きいほど 強い。id が null なら 外した とき）。みんなさいきょう装備と 装備を えらぶ まどの「強さ順」で 使う
//   大事な 強さ（武器は 攻撃力〈呪文の 職業は 魔力も〉、よろい・たて・頭は 守備力。アクセサリーは なし）→ 強さの 合計 の じゅんで くらべる
export function gearScore(ch, slot, id, w = weaponWeights(ch)) {
  const st = computeStats({ ...ch, equip: { ...(ch?.equip || {}), [slot]: id } });
  const main = slot === 'weapon' ? st.atk * w.atk + st.mag * w.mag + st.heal * w.heal : slot === 'acc' ? 0 : st.dfn;
  return Math.round(main * 100) * 10000 + st.str + st.def + st.agi + st.mag + st.heal + st.maxHp + st.maxMp;
}

// 1人ぶん: ch の 装備を bag から いれかえる（ch.equip と bag は かえる。変えた 部位を かえす）
function bestFor(ch, bag) {
  const changes = [];
  const w = weaponWeights(ch);
  for (const slot of BEST_SLOTS) {
    const score = (id) => gearScore(ch, slot, id, w);
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

// ───── 装備を えらぶ まど（メニューの「装備」→ 部位。client/ui/menu.js の pickGear）─────
// ならべかた: got … 入手順（ふくろの じゅん。手に 入れた じゅん）／ power … 強さ順（gearScore の 大きい じゅん）
export const GEAR_SORTS = { got: '入手順', power: '強さ順' };

// ch が その 部位に 装備できる 物（職業の 武器・よろい・たて・かぶとの きまり、魔物の しゅぞくの きまり。stats.js の canEquipChar）だけ。
// bag … ふくろ（{ items: [{ id, n }] }）、others … ほかの 人 [{ key, char }]（その 人が 装備している 物も 入れかえの 候補）
// かえす もの: [{ id, n, from: null（ふくろ）か 仲間の key, score }]。ふくろの じゅん → ほかの 人の じゅん
export function gearChoices(ch, slot, bag, others = []) {
  const w = weaponWeights(ch);
  const out = [];
  const seen = new Set();
  for (const e of bag?.items || []) {
    if (!(e?.n > 0) || ITEMS[e.id]?.type !== slot || seen.has(e.id) || !canEquipChar(ch, e.id)) continue;
    seen.add(e.id);
    out.push({ id: e.id, n: e.n, from: null, score: gearScore(ch, slot, e.id, w) });
  }
  for (const m of others || []) {
    const id = m?.char?.equip?.[slot];
    if (!id || ITEMS[id]?.type !== slot || !canEquipChar(ch, id)) continue;
    out.push({ id, n: 1, from: m.key, score: gearScore(ch, slot, id, w) });
  }
  return out;
}

// 強さ順: ふくろの 物を 強い じゅんに（いちばん 上が みんなさいきょう装備で えらぶ 物）。おなじ 強さなら 入手順。
// ほかの 人が 装備している 物は その あと（その 中も 強い じゅん）。入手順は そのまま
export function sortGearChoices(list, mode) {
  if (mode !== 'power') return list.slice();
  const strong = (a, b) => b.score - a.score;
  return [...list.filter((x) => !x.from).sort(strong), ...list.filter((x) => x.from).sort(strong)];
}
