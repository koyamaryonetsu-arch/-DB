// 第37回 A: サファラ闘技場の きまり（ランク・開く 時・ごほうび・かけ試合・王者のかべ）。docs/plan-r37.md の A
//
// ・開く 時: 第4章クリア（c4_clear。水が もどった あと）。それまでは「大会は お休み」
// ・ランク戦: ランク1〜5（第4章の ころの 強さ）と 伝説の部 ランク6〜8（第5章の 進みで 開く）。1つ前の ランクを 勝ちぬくと 次へ
//   1つの ランクは 休みなしの 3連戦（戦いの 間に 回復しない・道具は 使える・にげられない）。3戦目は 王者
//   負けても お金は へらない（受付の 前で HP・MPが もどる）
// ・ごほうび: はじめて 勝ちぬいた 時（キャラごと）… first の 品と 小さなメダル。2回目から … repeatGold ゴールドと 小さなメダル 1まい
// ・キャラに のこす もの（なくても よい。むかしの セーブも そのまま 読める）
//   c.arena = { r: { [ランク]: { n: 勝ちぬいた 回数, at: はじめて 勝ちぬいた 時こく, with: [いっしょに いた 家族の 名前] } }, rep: 2回目からの メダルの 通し番号 }
import { SOUTH_PLACES } from '../maps/south.js?v=b006a21bc0e3';

// 第4章クリアの フラグ（maps/temple.js の CLEAR4_FLAG と おなじ）
export const ARENA_OPEN_FLAG = 'c4_clear';

// 闘技場の 中の 場所（フィールドの マス。王都サファラの 東。maps/south-rows.js の SAFARA_ROWS）
//   desk … 受付の 前（カウンターの 西）/ ring … 砂の 闘技場の まん中（ランク戦の 間）/ wall … 王者のかべ（砂の 闘技場の 北の かべ）/
//   bet … かけ試合の 係 / sign … 入口の 広間の かんばん（maps/ch4.js の SOUTH_SIGNS）
const SAF = SOUTH_PLACES.safara;
const SF = (x, y) => ({ x: SAF.x + x, y: SAF.y + y });
export const ARENA_MAP = 'south';
export const ARENA_POS = {
  desk: SF(41, 30), clerk: SF(43, 30), ring: SF(46, 30), wall: [SF(46, 24), SF(47, 24)], bet: SF(48, 28), sign: SF(40, 33),
  fans: [SF(45, 34), SF(48, 34), SF(45, 26)],
};
export const ARENA_RANKS = [
  {
    rank: 1, lv: 36, champ: '力じまんの戦士', battles: ['ar1_1', 'ar1_2', 'ar1_3'],
    first: { items: ['ar_power_bangle'], medals: 1 }, repeatGold: 600,
    hint: '大きく息をすって力をためたら、次の番に「ばくれつかぶとわり」。身を守ろう。',
  },
  {
    rank: 2, lv: 39, champ: '砂嵐三兄弟', battles: ['ar2_1', 'ar2_2', 'ar2_3'],
    first: { items: ['ar_sand_bandana'], medals: 2 }, repeatGold: 900,
    hint: '長男が口笛をふいたら、3人の合体技。弟たちを先にたおすと、合体技が弱くなる。',
  },
  {
    rank: 3, lv: 42, champ: 'ランプの大魔人', battles: ['ar3_1', 'ar3_2', 'ar3_3'],
    first: { items: ['ar_genie_cape'], medals: 2 }, repeatGold: 1200,
    hint: '体が金色に光っている間は、呪文がはね返される。武器や特技で戦おう。',
  },
  {
    rank: 4, lv: 45, champ: '太陽と月の剣士', battles: ['ar4_1', 'ar4_2', 'ar4_3'],
    first: { items: ['ar_twin_shield'], medals: 3 }, repeatGold: 1600,
    hint: '片方をたおすと、もう片方が「よみがえりのまい」。2人を同じころにたおそう。まいは大きなダメージで止められる。',
  },
  {
    rank: 5, lv: 48, champ: '闘技場の王者ガルム', battles: ['ar5_1', 'ar5_2', 'ar5_3'],
    first: { items: ['ar_champ_belt'], medals: 3 }, repeatGold: 2200,
    hint: '大剣を天にかかげ、王者の気が集まったら、次は「王者の一撃」。身を守ろう。',
  },
  {
    rank: 6, lv: 50, champ: '砂ザメの王', battles: ['ar6_1', 'ar6_2', 'ar6_3'], legend: true, needFlag: 'c5_gaia',
    lockText: '（空にうかぶ大地の、島をくらう大きな魔物をたおすと、開くらしい）',
    first: { items: ['ar_shark_charm'], medals: 3 }, repeatGold: 3500,
    hint: '砂にもぐったら、次の番まで攻撃がとどかない。砂がもり上がったら大ジャンプ。身を守ろう。',
  },
  {
    rank: 7, lv: 53, champ: '七色の魔導王', battles: ['ar7_1', 'ar7_2', 'ar7_3'], legend: true, needFlag: 'c5_nshadow',
    lockText: '（星読みの里の、思い出の迷宮のおくの影をたおすと、開くらしい）',
    first: { items: ['ar_prism_crown'], medals: 4 }, repeatGold: 4500,
    hint: 'よろいと同じ属性の攻撃は、すいこまれて回復してしまう。弱点（炎⇔氷・雷⇔風）でよろいをくだこう。',
  },
  {
    rank: 8, lv: 56, champ: '伝説のチャンピオン', battles: ['ar8_1', 'ar8_2', 'ar8_3'], legend: true, needFlag: 'c5_nocto1',
    lockText: '（大地の神殿のおくで、ある少年と戦ったあとに、開くらしい）',
    first: { items: ['ar_legend_belt', 'ar_legend_mantle'], medals: 5 }, repeatGold: 6000,
    // 第45回（ドラクエふう D1）: 大事な物「竜王のしるし」（竜王のまごの 素材配合）。まだ 持っていない・竜王のまごを 生んだ ことが ない 人に、
    //   勝ちぬいた 時（はじめて でも 2回目からでも）1回（world/arena.js の clearRewards・companions-dqm.js の dqKeyDue）
    key: 'ryuou_seal',
    hint: '剣を高くかかげたら、3人の合体技の合図。弟子を先にたおすと弱くなる。',
  },
];
export const ARENA_MAX_RANK = ARENA_RANKS.length;
export const rankInfo = (n) => ARENA_RANKS[n - 1] || null;
export const rankLabel = (n) => (rankInfo(n)?.legend ? `伝説の部・ランク${n}` : `ランク${n}`);

// 闘技場が 開いているか（flag … もちぬしの 世界の フラグ）
export const arenaOpen = (flag) => !!flag(ARENA_OPEN_FLAG);

// キャラの 記録（ない ときは 空。こわれた データも 空に）
export function arenaRecord(c) {
  const a = c?.arena && typeof c.arena === 'object' ? c.arena : {};
  const r = a.r && typeof a.r === 'object' ? a.r : {};
  return { r, rep: Number.isFinite(a.rep) ? a.rep : 0 };
}
export const rankCleared = (c, n) => (arenaRecord(c).r[n]?.n || 0) > 0;
// いちばん 上の 勝ちぬいた ランク（0 … まだ）
export function bestRank(c) {
  let best = 0;
  for (const R of ARENA_RANKS) if (rankCleared(c, R.rank)) best = R.rank;
  return best;
}

// その ランクに 出られるか（flag … もちぬしの 世界の フラグ / c … もちぬしの キャラ）
//   { ok, why } … why: 'closed'（闘技場が お休み）・'prev'（1つ前を まだ 勝ちぬいていない）・'story'（伝説の部の 物語が まだ）
export function rankOpen(n, flag, c) {
  const R = rankInfo(n);
  if (!R) return { ok: false, why: 'none' };
  if (!arenaOpen(flag)) return { ok: false, why: 'closed' };
  if (R.needFlag && !flag(R.needFlag)) return { ok: false, why: 'story' };
  if (n > 1 && !rankCleared(c, n - 1)) return { ok: false, why: 'prev' };
  return { ok: true };
}
// 見える ランク（伝説の部は 物語が 開いた ランクまで。その 先は 名前も 出さない）
export function visibleRanks(flag) {
  return ARENA_RANKS.filter((R) => !R.needFlag || flag(R.needFlag) || R.rank === 6).map((R) => R.rank);
}

// 勝ちぬいた ことを のこす。はじめて なら true
export function noteClear(c, n, now, withNames = []) {
  const a = arenaRecord(c);
  const prev = a.r[n];
  const first = !(prev?.n > 0);
  const r = { ...a.r, [n]: first ? { n: 1, at: now, with: withNames.slice(0, 5) } : { ...prev, n: (prev.n || 0) + 1 } };
  c.arena = { ...(c.arena && typeof c.arena === 'object' ? c.arena : {}), r, rep: a.rep };
  return first;
}
// 2回目からの 小さなメダルの 通し番号（medalSpots の id。world/arena.js）
export function nextRepeatMedal(c) {
  const a = arenaRecord(c);
  const rep = a.rep + 1;
  c.arena = { ...(c.arena && typeof c.arena === 'object' ? c.arena : {}), r: a.r, rep };
  return `arena_rep_${rep}`;
}
export const firstMedalId = (n, i) => `arena_r${n}_${i}`;

// べつべつの 場所で 遊んだ 記録を まとめる（world/merge.js。勝ちぬいた 回数は 両方で ふえた ぶんを たす・はじめての 時こくは 早い ほう）
export function mergeArena(b, a, t) {
  if (!a && !t) return undefined;
  const A = arenaRecord({ arena: a }), T = arenaRecord({ arena: t }), B = arenaRecord({ arena: b });
  const r = {};
  for (const k of new Set([...Object.keys(A.r), ...Object.keys(T.r)])) {
    const x = A.r[k], y = T.r[k], z = B.r[k];
    const n = Math.max(x?.n || 0, y?.n || 0, (x?.n || 0) + (y?.n || 0) - (z?.n || 0));
    if (!(n > 0)) continue;
    const ats = [x?.at, y?.at].filter(Number.isFinite);
    const first = x?.n > 0 && (!(y?.n > 0) || (x.at ?? 9e15) <= (y.at ?? 9e15)) ? x : y;
    r[k] = { n, at: ats.length ? Math.min(...ats) : undefined, with: Array.isArray(first?.with) ? first.with.slice(0, 5) : [] };
  }
  const out = { r, rep: Math.max(A.rep, T.rep) };
  // かけ試合の 回数・当てた 回数（両方で ふえた ぶんを たす）
  for (const k of ['bets', 'betWins']) {
    const v = Math.max(0, (a?.[k] || 0) + (t?.[k] || 0) - (b?.[k] || 0));
    if (v) out[k] = v;
  }
  return out;
}

// ───────────── 王者のかべ ─────────────
// characters … 家族サーバーなら 家族みんな、ひとりの サイトなら 自分の キャラたち。上の ランクを 勝ちぬいた 人が 上
export function wallRows(characters, limit = 30) {
  const rows = [];
  for (const c of Object.values(characters || {})) {
    if (!c || c.species) continue;
    const best = bestRank(c);
    if (!best) continue;
    const rec = arenaRecord(c).r;
    rows.push({
      id: c.id, name: c.name, best, at: rec[best]?.at, with: rec[best]?.with || [],
      ranks: ARENA_RANKS.map((R) => rec[R.rank]?.n || 0),
    });
  }
  rows.sort((x, y) => y.best - x.best || (x.at ?? 9e15) - (y.at ?? 9e15) || (x.name < y.name ? -1 : 1));
  return rows.slice(0, limit);
}

// ───────────── かけ試合（モンスター格闘場）─────────────
// 4ひきが 1回戦（1 対 2・3 対 4）→ 決勝。戦いは 本物の 戦いの しくみで（world/arena.js の betDuel）。
// オッズは 強さ（本物の 1対1を ODDS_TRIES 回 ためした 勝つ わりあい）から
// 魔物は BET_POOL から 4ひき（同じ 魔物は 出ない）。みんな BET_LV まで 強く する（同じ レベルで 魔物の ちがいが 強さに なる）
export const BET_LV = 30;
export const BET_POOL = [
  'king_pururin', 'golem', 'chibi_dragon', 'star_panther', 'demon_knight', 'yeti', 'ice_golem', 'kiba_walrus',
  'fire_hound', 'obsidian_knight', 'star_wyvern', 'frost_drake', 'scorpion_soldier', 'sandstone_golem', 'lamp_genie', 'sand_shark',
  'castle_armor', 'water_dragon', 'pegasus', 'bone_dragon', 'gargoyle', 'fairy_dragon', 'headless', 'gold_golem',
];
export const BET_AMOUNTS = [10, 100, 500, 1000, 5000];
// 1回戦の 組み合わせ（ならびの 番号）
export const BET_PAIRS = [[0, 1], [2, 3]];
// 店の とりぶん（オッズ = (1 - HOUSE) ÷ 勝つ わりあい）
export const BET_HOUSE = 0.12;
export const ODDS_MIN = 1.1;
export const ODDS_MAX = 50;

// 強さを はかる 回数（1対1を 何回 ためして 勝つ わりあいを 出すか。world/arena.js の lineupOdds）
export const ODDS_TRIES = 14;
// ためした けっか → 勝つ わりあい（少ない 回数でも 0・1 に ならない ように、1回ずつ 足して ならす）
export const duelRate = (wins, tries) => (wins + 1) / (tries + 2);
// 4ひきの 優勝の わりあい（1回戦 0-1・2-3、決勝は のこった 2ひき。決勝の 前に HPは もどる）
//   pw[i][j] … i が j に 勝つ わりあい（pw[j][i] = 1 - pw[i][j]）
export function winChances(pw) {
  const p = (i, j) => pw[i][j];
  const semi = [p(0, 1), 1 - p(0, 1), p(2, 3), 1 - p(2, 3)];
  return pw.map((_, i) => {
    const others = i < 2 ? [2, 3] : [0, 1];
    return semi[i] * others.reduce((s, j) => s + semi[j] * p(i, j), 0);
  });
}
// オッズ（0.1 きざみ。下は ODDS_MIN・上は ODDS_MAX）
export function oddsOf(chance) {
  const raw = (1 - BET_HOUSE) / Math.max(0.0001, chance);
  return Math.max(ODDS_MIN, Math.min(ODDS_MAX, Math.floor(raw * 10) / 10));
}
// はらいもどし（当たり … かけた お金 × オッズ。はずれ … 0）
export const payout = (bet, odds, hit) => (hit ? Math.floor(bet * odds) : 0);
