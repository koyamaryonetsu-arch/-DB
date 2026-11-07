// 第67回 A班: モンスター闘技場の チーム選び（画面を 使わない きまりだけ。テストでも 読む。画面は ui/monarena.js）
//
// status（B班の svc kind:'monarena' action:'status' の へんじ）:
//   { ranks: [{ rank, name, open, cleared, lv, hint }], team: [key…]（前回）, reg: [key…]（登録）,
//     monsters: [{ key, name, species, level, hp, mp, atk, def, agi, where: 'party'|'wagon'|'storage' }],
//     family: [{ charId, name, reg: [{ species, name, level }] }] }
export const TEAM_MAX = 4;

export const WHERE_LABEL = { party: 'パーティー', wagon: '馬車', storage: 'あずかり所', tavern: '酒場' };
export const whereLabel = (w) => WHERE_LABEL[w] || '';

const num = (v) => (Number.isFinite(+v) ? +v : 0);

// 強さの 目安（おまかせ・ならべる 時）。HP は 大きい 数なので 少し 小さく 見る
export function monPower(m) {
  if (!m) return 0;
  return num(m.hp) * 0.5 + num(m.mp) * 0.15 + num(m.atk) * 1.4 + num(m.def) + num(m.agi) * 0.9 + num(m.level) * 2;
}

// 持っている 魔物だけ・同じ 魔物は 1回・4ひきまで
export function normTeam(keys, monsters) {
  const have = new Set((monsters || []).map((m) => m.key));
  const out = [];
  for (const k of Array.isArray(keys) ? keys : []) {
    if (have.has(k) && !out.includes(k)) out.push(k);
    if (out.length >= TEAM_MAX) break;
  }
  return out;
}

// 強い 順（同じ 強さなら レベル・名前の 順。いつも 同じ ならび）
export function sortStrong(monsters) {
  return [...(monsters || [])].sort((a, b) => monPower(b) - monPower(a) || num(b.level) - num(a.level) || String(a.name).localeCompare(String(b.name)) || String(a.key).localeCompare(String(b.key)));
}

// おまかせ（強い 順に 4ひき）
export function autoTeam(monsters) {
  return sortStrong(monsters).slice(0, TEAM_MAX).map((m) => m.key);
}

// 1回で 選ぶ: 'last'（前回の チーム）/ 'reg'（登録チーム）/ 'auto'（おまかせ）
export function presetTeam(kind, st) {
  const mons = st?.monsters || [];
  if (kind === 'last') return normTeam(st?.team, mons);
  if (kind === 'reg') return normTeam(st?.reg, mons);
  if (kind === 'auto') return autoTeam(mons);
  return [];
}

// はじめに 出す チーム。戦う 時は 前回 → 登録 → おまかせ、登録する 時は 登録 → 前回 → おまかせ
export function initialTeam(st, purpose = 'fight') {
  const order = purpose === 'reg' ? ['reg', 'last', 'auto'] : ['last', 'reg', 'auto'];
  for (const k of order) {
    const t = presetTeam(k, st);
    if (t.length) return t;
  }
  return [];
}

// i ばんめの わくに key を 入れる。もう チームに いれば 入れかえ（i が あいている わくなら うしろに つめる）
export function placeInSlot(team, i, key) {
  const t = [...team];
  const j = t.indexOf(key);
  if (j >= 0) {
    if (i >= t.length) {
      t.splice(j, 1);
      t.push(key);
    } else [t[i], t[j]] = [t[j], t[i]];
    return t;
  }
  if (i >= t.length) {
    if (t.length < TEAM_MAX) t.push(key);
  } else t[i] = key;
  return t;
}
export const removeAt = (team, i) => team.filter((_, k) => k !== i);
export function moveUp(team, i) {
  if (i <= 0 || i >= team.length) return [...team];
  const t = [...team];
  [t[i - 1], t[i]] = [t[i], t[i - 1]];
  return t;
}
export const sameTeam = (a, b) => a.length === b.length && a.every((k, i) => k === b[i]);

// ランクの 一覧の 1行（ひらいている・勝った・まだ）
export function rankState(r) {
  if (!r?.open) return 'locked';
  return r.cleared ? 'cleared' : 'open';
}
export const rankName = (r) => r?.name || `ランク${r?.rank ?? ''}`;

// 家族の 登録チーム（自分の ほかで、1ぴき いじょう 登録している 人）
export function familyRows(st, myId) {
  return (st?.family || []).filter((f) => f && f.charId !== myId && Array.isArray(f.reg) && f.reg.length);
}

// チームの 数字（レベルの 平均など）
export function teamStats(keys, monsters) {
  const by = new Map((monsters || []).map((m) => [m.key, m]));
  const list = keys.map((k) => by.get(k)).filter(Boolean);
  const lv = list.length ? Math.round(list.reduce((s, m) => s + num(m.level), 0) / list.length) : 0;
  return { list, n: list.length, avgLv: lv, power: Math.round(list.reduce((s, m) => s + monPower(m), 0)) };
}
export const avgLevel = (reg) => (reg?.length ? Math.round(reg.reduce((s, m) => s + num(m.level), 0) / reg.length) : 0);
