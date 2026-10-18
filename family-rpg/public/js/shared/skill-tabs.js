// 第35回 A: 戦いの 技えらびの タブ（効果ごと）。家族が 決めた こと（docs/idea-r35.md の L「戦いの技えらび」）
//   ・タブ: 今の職業／攻撃（1体）／攻撃（全体）／回復／強くする／弱くする・状態異常／そのほか（空の タブは 出さない）
//   ・お気に入りも 1つの タブ（★）。上の 技を 覚えても 下の 技は かくさない。技の ならびは かえない（今の じゅんの まま）
//   ・わかっている 弱点の 属性の 技に「弱点」の しるし（client/battle.js）
// ここは 画面に よらない きまり（テスト: test/ui-r35.test.js）

// ダメージを あたえる 効果
const DMG = new Set(['phys', 'magic', 'drainHp', 'drainMp', 'mahouken', 'telegraph', 'goldThrow', 'gamble', 'fixed', 'allMp', 'gather', 'destroy', 'deduce']);
// 回復（HP・MP・状態・生き返る・じわじわ）
const HEAL = new Set(['heal', 'revive', 'reviveAll', 'cure', 'mpHeal', 'regen']);
// 味方を 強くする（ちから・守り・かばう・ためる など）
const BUFF = new Set(['buff', 'charge', 'cover', 'veil', 'veilCharge', 'reflect', 'stance', 'overtime']);
// 敵を 弱くする・状態異常（行動を おくらせる・強さを 消す も ここ）
const DEBUFF = new Set(['debuff', 'status', 'dispel']);

// タブの じゅんと 名前（label: タブの 札。title: 見出しに 出す 名前）
export const SKILL_TABS = [
  { id: 'fav', label: '★', title: 'お気に入り' },
  { id: 'job', label: '今の職業', title: '今の職業' },
  { id: 'one', label: '攻撃1体', title: '攻撃（1体）' },
  { id: 'all', label: '攻撃全体', title: '攻撃（全体）' },
  { id: 'heal', label: '回復', title: '回復' },
  { id: 'buff', label: '強くする', title: '強くする' },
  { id: 'debuff', label: '弱くする', title: '弱くする・状態異常' },
  { id: 'other', label: 'そのほか', title: 'そのほか' },
];

// 敵に あたる 相手か
const FOE = new Set(['enemy', 'group', 'enemies']);

// 1つの 効果が どの 種類か（dmg・heal・buff・debuff・null）。target: その 技の 相手
function partKind(p, target) {
  const t = p?.type;
  if (!t) return null;
  if (DMG.has(t)) return 'dmg';
  if (HEAL.has(t)) return 'heal';
  if (BUFF.has(t)) return 'buff';
  if (DEBUFF.has(t)) return t === 'dispel' && !FOE.has(target) ? 'heal' : 'debuff';
  // 行動ゲージ: 味方は はやく（強くする）・敵は おそく（弱くする）
  if (t === 'atbSet') return FOE.has(target) ? 'debuff' : 'buff';
  return null;
}

// 技の 効果の タブ（'one'・'all'・'heal'・'buff'・'debuff'・'other'）。今の職業・お気に入りは 別に きめる
export function effectTab(ab) {
  const e = ab?.effect;
  if (!e) return 'other';
  const target = ab.target;
  const parts = e.type === 'multi' ? (e.parts || []) : [e];
  const kinds = parts.map((p) => partKind(p, p.target || target));
  // ダメージが あれば こうげき（敵1体 → 1体、グループ・全体・ランダムに 何回も → 全体）
  if (kinds.includes('dmg')) {
    if (target === 'enemy' && !e.random) return 'one';
    if (FOE.has(target) || e.random) return 'all';
  }
  if (kinds.includes('heal')) return 'heal';
  if (kinds.includes('buff')) return 'buff';
  if (kinds.includes('debuff')) return 'debuff';
  return 'other';
}

// 技の 属性（いくつも ある 技は ぜんぶ。物理は 入れない）
export function abilityElements(ab) {
  const e = ab?.effect;
  if (!e) return [];
  const parts = e.type === 'multi' ? (e.parts || []) : [e];
  const out = [];
  for (const p of parts) if (p?.element && p.element !== 'phys' && !out.includes(p.element)) out.push(p.element);
  return out;
}

// タブごとの 技（ids の じゅんの まま。空の タブは 出さない）
//   abs: id → 技（男の子むけの 名前 など。なければ ABILITIES）。job: 今の 職業。favs: お気に入り（その ならび）
//   もどりち: [{ id, label, title, ids }]
export function skillTabs(ids, { abs, job, favs = [] } = {}) {
  const get = (id) => abs?.(id);
  const lists = { fav: favs.filter((id) => ids.includes(id)), job: [], one: [], all: [], heal: [], buff: [], debuff: [], other: [] };
  for (const id of ids) {
    const ab = get(id);
    if (!ab) continue;
    if (job && ab.job === job) lists.job.push(id);
    lists[effectTab(ab)].push(id);
  }
  return SKILL_TABS.filter((t) => lists[t.id].length).map((t) => ({ ...t, ids: lists[t.id] }));
}

// はじめに 出す タブ: まえに 使った タブ → お気に入り → 今の職業 → さいしょ
export function startTab(tabs, last) {
  if (!tabs.length) return null;
  return (tabs.find((t) => t.id === last) || tabs.find((t) => t.id === 'fav') || tabs.find((t) => t.id === 'job') || tabs[0]).id;
}
