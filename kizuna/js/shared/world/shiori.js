// 第78回: 冒険のしおり（docs/plan-r78-shiori.md）
//   「つぎに 何を すれば いいか」「何が のこって いるか」を 1まいで 見せる ための まとめ。
//   キャラ（c）だけを 見て 答えを 作る 純粋な 関数（c は かえない）。サーバーでも ひとりモードでも おなじ
//   （client/ui/shiori.js が g.me を わたす。サーバーは キャラを まるごと 'self' で おくって いるので、たのむ 物は ない）
//
// ネタバレの きまり（docs の 4）:
//   ・まだ 開いて いない しくみは 出さない（数にも 入れない）。先の 章で 開く 物も 入れない
//   ・ボスの 名前・物語の 先・かくれた 職業の じょうけんは 書かない。名前を 知らない 物は「？？？」
//   ・物語の 幕の 名前は、その 幕の はじまりの 文字（ゲームの 中の chapter）を 見た あとだけ
import { OBJECTIVE_TARGETS, liveTargets, whereName, subQuests } from '../data/quest-targets.js?v=e280d20a9f0b';
import { OBJECTIVE_TALK } from '../data/party-talk.js?v=e280d20a9f0b';
import { subQuestHints, availableSubQuests, subQuestStarted } from '../data/subquest-hints.js?v=e280d20a9f0b';
import { jobLine } from '../data/fq-common.js?v=e280d20a9f0b';
import { ARENA_RANKS, rankOpen, rankCleared, rankLabel, arenaOpen } from '../data/arena.js?v=e280d20a9f0b';
import { MONARENA_RANKS, MONARENA_OPEN_FLAG, monRankOpen, monRankCleared } from '../data/monarena.js?v=e280d20a9f0b';
import { tmLvCap, tmTitle } from '../data/treasure.js?v=e280d20a9f0b';
import { tmPlaceShort } from '../data/treasure-hint.js?v=e280d20a9f0b';
import { tierInfo, TIER_MAX, tmClearCount } from '../data/casino-tier.js?v=e280d20a9f0b';
import { sdRecordOf, SD_OPEN_FLAG, SD_GUARD_EVERY } from '../data/secret.js?v=e280d20a9f0b';
import { phantomBook } from '../data/phantom.js?v=e280d20a9f0b';
import { JOBS, JOB_MAX_LEVEL } from '../data/jobs.js?v=e280d20a9f0b';
import { TRIALS, trialJob, trialsCleared, trialState } from '../data/job-trials.js?v=e280d20a9f0b';
import { bestiaryOrder } from '../data/companions.js?v=e280d20a9f0b';
import { MONSTERS } from '../data/monsters.js?v=e280d20a9f0b';
import { medalsFound, medalsGiven, medalsHeld, nextMedalReward } from '../data/casino.js?v=e280d20a9f0b';
import { canLimitBreak, lbOf } from '../data/forge.js?v=e280d20a9f0b';
import { LB_MAX } from '../data/items-forge.js?v=e280d20a9f0b';
import { ITEMS } from '../data/items.js?v=e280d20a9f0b';
import { MAPS, condOk } from '../maps/index.js?v=e280d20a9f0b';
import { jobLabel } from '../job-label.js?v=e280d20a9f0b';
// 第80回 E班: ボスに 負けた 時の ヒント（今までに 出た 物。物語の だんに 出す）
import { bossHintsSeen } from '../data/boss-hints.js?v=e280d20a9f0b';
// 第88回 G4班: 作品の ガチャガチャ・七つの玉
import { GACHA_PRICE, GACHA_PITY, gachaWorks, gachaPool, gachaGot, ORB_PLACES, orbChestId, orbsFound, SEVEN_ORBS, ownsR88 } from '../data/gacha-r88.js?v=e280d20a9f0b';
import { workName } from '../data/works.js?v=e280d20a9f0b';
// 第88回 G9班: ドラゴンボール（data/shenron-r88.js）
import { DB_PLACES, dbChestId, ballsAll, ballsFound, hasRadar, wishWaitLeft, wishWaitDays, WISH_AT_FLAG, WISH_N_FLAG } from '../data/shenron-r88.js?v=e280d20a9f0b';
// 第88回 G3班: まぼろしの回廊（shared/rivals-r88.js）
import { rivalTrack, rivalRec } from '../rivals-r88.js?v=e280d20a9f0b';

const flagFn = (c) => (k) => !!c?.flags?.[k];
const npcWhere = (id) => whereName({ npc: id }) || '';

// ───────────── 1. 物語（今の 部・章・幕）─────────────
// start … その 章が 始まった しるし / clear … クリアの しるし / title … 章の 名前（seen の しるしの あとだけ 出す）
// acts … 幕（start … 幕の はじまり、title … 幕の 名前、seen … その 名前を 見た しるし）
export const CHAPTERS = [
  { n: 0, part: 1, start: null, clear: 'p_attack', title: 'ホシフル村の祭り' },
  { n: 1, part: 1, start: 'p_attack', clear: 'c1_clear', title: '始まりの星' },
  { n: 2, part: 1, start: 'c2_start', clear: 'c2_clear', title: '海をわたる風' },
  { n: 3, part: 1, start: 'c3_start', clear: 'c3_clear', title: '星の竜がねむる山' },
  { n: 4, part: 1, start: 'c4_start', clear: 'c4_clear', title: '砂の海にしずむ星' },
  { n: 5, part: 1, start: 'c5_start', clear: 'c5_clear', title: '空にうかぶ大地' },
  {
    n: 6, part: 2, start: 'c6_start', clear: 'c6_clear', title: '時の砂時計',
    acts: [
      { n: 1, start: 'c6_start' },
      { n: 2, start: 'c6_tree' },
      { n: 3, start: 'c6_flow', title: '星読みの社', seen: 'c6_flow' },
      { n: 4, start: 'c6_kanata', title: '止まった時計塔', seen: 'c6_kanata' },
    ],
  },
  {
    // 章の 名前は 千年前の コガネ地方に 着いた 時の 文字で はじめて 出る
    n: 7, part: 2, start: 'c7_start', clear: 'c7_clear', title: '最初の紋章の勇者たち', titleSeen: 'c7_arrive',
    acts: [
      { n: 1, start: 'c7_start' },
      { n: 2, start: 'c7_karim', title: '海の紋章', seen: 'c7s_arrive' },
      { n: 3, start: 'c7_kai', title: 'ひとりぼっちの星', seen: 'c7i_arrive' },
    ],
  },
  {
    n: 8, part: 2, start: 'c8_start', clear: null, title: '千年の約束',
    acts: [
      { n: 1, start: 'c8_start', title: '月の王宮のうらぎり', seen: 'c8a_arrive', clear: 'c8_jafar' },
      { n: 2, start: 'c8_jafar', title: 'よみの青い火', seen: 'c8b_arrive', clear: 'c8_hades' },
      { n: 3, start: 'c8_hades', title: 'くろがねの空中ようさい', seen: 'c8c_arrive', clear: 'c8_bowser' },
      { n: 4, start: 'c8_bowser', title: '時のはざま', seen: 'c8r_arrive', clear: 'c8_solitus' },
    ],
  },
  {
    // 第90回 Z班: 第3部「ほしのね」第1章（中の 番号は 9。表示は chapterLabel で「第1章」）。幕の 名前は 題の 画面（c9_festival）の あと
    n: 9, part: 3, start: 'c9_festival', clear: null, title: 'おちてきた星の子',
    acts: [
      { n: 1, start: 'c9_festival', title: '星ふるえの夜', seen: 'c9_festival', clear: 'c9_act1' },
    ],
  },
];
const PART_NAMES = { 1: '第1部', 2: '第2部', 3: '第3部' };
// 部の はじめの 章の 中の 番号（第3部だけ 部の 中の 番号で 出す。第1・2部は 通しの 番号「第8章」の まま）
const PART_FIRST_CHAPTER = { 3: 9 };
const partOfChapter = (n) => CHAPTERS.find((C) => C.n === n)?.part || (n >= PART_FIRST_CHAPTER[3] ? 3 : 0);

// 章の 表示（0 … 序章 / 1〜8 … 第○章 / 9〜 … 第3部の 中の 番号「第1章」）
export function chapterLabel(n) {
  if (!n) return '序章';
  const first = PART_FIRST_CHAPTER[partOfChapter(n)];
  return `第${first ? n - first + 1 : n}章`;
}

// 今の 章・幕。{ part, chapter, act, label, title, actTitle, cleared }
export function storyPlace(c) {
  const f = flagFn(c);
  let ch = CHAPTERS[0];
  for (const C of CHAPTERS) if (C.start && f(C.start)) ch = C;
  let act = null;
  for (const A of ch.acts || []) if (f(A.start)) act = A;
  const cleared = act?.clear ? f(act.clear) : !!(ch.clear && f(ch.clear) && ch.n > 0);
  const chName = chapterLabel(ch.n);
  const title = !ch.titleSeen || f(ch.titleSeen) ? ch.title : '';
  const actTitle = act?.title && f(act.seen) ? act.title : '';
  const parts = [ch.n === 0 ? '' : PART_NAMES[ch.part], chName, act ? `第${act.n}幕` : ''].filter(Boolean);
  return { part: ch.n === 0 ? 0 : ch.part, chapter: ch.n, act: act?.n || 0, label: parts.join(' '), title, actTitle, cleared };
}

// 物語の つぎ（目標の 文・仲間の ひとこと・場所）
export function storyNext(c) {
  const obj = String(c?.objective || '');
  const specs = OBJECTIVE_TARGETS[obj];
  const where = specs ? liveTargets(c, specs).map((s) => whereName(s)).find(Boolean) || '' : '';
  const talk = OBJECTIVE_TALK[obj];
  const hint = talk ? talk.kind || '' : '';
  // 「続きはアップデートで！」… 今は 物語の 先が ない
  const end = /アップデート/.test(obj);
  return { objective: obj, where, hint, end };
}

// ───────────── 2. のこって いる こと（しくみごとの 進みぐあい）─────────────
// 1つの しくみ: { id, name, now, total（ない ときは null）, unit, note, where, items: [{ name, where, state, right }] }
//   state … 'done'（すんだ）・'now'（とちゅう・受けている）・'open'（できる）・'wait'（まだ）・'unknown'（？？？）
const STATE_ORDER = { now: 0, open: 1, wait: 2, unknown: 3, done: 4 };
const byState = (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state];

const BOARD_WHERE = () => npcWhere('fq_board') || 'ルミナの町';

// お仕事いらい・より道（data/subquest-hints.js の 一らん。開いた 物だけ）
function questRows(c, board) {
  const f = flagFn(c);
  const ready = new Set(subQuests(c).filter((q) => q.ready).map((q) => q.name));
  return subQuestHints().filter((q) => !!q.board === board && q.open.every(f)).map((q) => {
    const done = f(q.done);
    const started = !done && subQuestStarted(c, q);
    const right = done ? 'すんだ' : ready.has(q.name) ? '報告できる' : started ? '受けている' : '受けられる';
    const can = board && q.roots && !done && !started ? (jobLine(q.roots).has(c?.job) ? '（今の職業で解決できそう）' : `（${q.job}の職業）`) : '';
    return { id: q.id, name: q.name, where: `${q.place}・${q.who}${can}`, state: done ? 'done' : started ? 'now' : 'open', right };
  });
}

function boardTrack(c) {
  const items = questRows(c, true);
  if (!items.length) return null;
  const done = items.filter((x) => x.state === 'done').length;
  return {
    id: 'board', name: 'お仕事いらい', now: done, total: items.length, unit: 'こ', where: `${BOARD_WHERE()}のお仕事いらい板`,
    note: 'はり紙を読むと、だれに会えば始まるかわかる。', items: items.sort(byState),
  };
}

function sideTrack(c) {
  const items = questRows(c, false);
  if (!items.length) return null;
  const done = items.filter((x) => x.state === 'done').length;
  return { id: 'side', name: 'より道（たのまれごと）', now: done, total: items.length, unit: 'こ', where: '', note: '町や村で、困っている人の話を聞こう。', items: items.sort(byState) };
}

// サファラ闘技場（物語で 開いた ランクだけ。王者の 名前は 出さない）
function arenaTrack(c) {
  const f = flagFn(c);
  if (!arenaOpen(f)) return null;
  const ranks = ARENA_RANKS.filter((R) => !R.needFlag || f(R.needFlag));
  const items = ranks.map((R) => {
    const done = rankCleared(c, R.rank);
    const ok = rankOpen(R.rank, f, c).ok;
    return { name: rankLabel(R.rank), where: `おすすめLv${R.lv}`, state: done ? 'done' : ok ? 'open' : 'wait', right: done ? '勝ちぬいた' : ok ? 'ちょうせんできる' : 'まだ' };
  });
  return {
    id: 'arena', name: 'サファラ闘技場', now: items.filter((x) => x.state === 'done').length, total: items.length, unit: 'ランク',
    where: `${npcWhere('arena_desk') || '王都サファラ'}の闘技場`, note: '1つのランクは3連戦。物語を進めると、上のランクが開く。', items,
  };
}

// モンスター闘技場
function monArenaTrack(c) {
  const f = flagFn(c);
  if (!f(MONARENA_OPEN_FLAG)) return null;
  const ranks = MONARENA_RANKS.filter((R) => f(R.need));
  const items = ranks.map((R) => {
    const done = monRankCleared(c, R.rank);
    const ok = monRankOpen(R.rank, f, c).ok;
    return { name: `ランク${R.rank}「${R.title}」`, where: `魔物のおすすめLv${R.lv}`, state: done ? 'done' : ok ? 'open' : 'wait', right: done ? '勝ちぬいた' : ok ? 'ちょうせんできる' : 'まだ' };
  });
  if (!items.length) return null;
  return {
    id: 'monarena', name: 'モンスター闘技場', now: items.filter((x) => x.state === 'done').length, total: items.length, unit: 'ランク',
    where: 'ルミナの町の東門を出てすぐ北の、モンスター闘技場', note: '育てた魔物4ひきで戦う3連戦。', items,
  };
}

// 宝の地図（ふかさ ＝ 持っている 地図の いちばん 高い レベル）とカジノの 段
//   第80回 C: 分母は 今 手に入る 地図の 上限（第8章クリアで 45 → 50。data/treasure.js の tmLvCap）
function tmapTrack(c) {
  const maps = Array.isArray(c?.treasureMaps) ? c.treasureMaps.filter((t) => t && Number.isFinite(t.lv)) : [];
  const clears = tmClearCount(c);
  if (!c?.flags?.tm_intro && !maps.length && !clears) return null;
  const best = Math.max(0, ...maps.map((t) => t.lv));
  const tier = tierInfo(c);
  const left = maps.filter((t) => !t.cleared).sort((a, b) => a.lv - b.lv);
  const items = left.map((t) => ({ name: tmTitle(t), where: tmPlaceShort(t), state: t.found ? 'now' : 'open', right: t.found ? '洞窟が開いた' : 'まだほっていない' }));
  const casino = tier.tier >= TIER_MAX ? `カジノの段：${tier.name}（いちばん上）` : `カジノの段：${tier.name}（つぎの段まで、あと${tier.left}まい）`;
  return {
    id: 'tmap', name: '宝の地図', now: best, total: tmLvCap(c), unit: 'Lv', where: '地図の場所で地面を調べる',
    note: `宝をほった地図：${clears}まい\n${casino}`, items,
  };
}

// ひみつのダンジョン（終わりが ない ので、つぎの 番人の 階までの 棒）
function sdTrack(c) {
  if (!c?.flags?.[SD_OPEN_FLAG]) return null;
  const r = sdRecordOf(c);
  const goal = (Math.floor(r.best / SD_GUARD_EVERY) + 1) * SD_GUARD_EVERY;
  return {
    id: 'sd', name: 'ひみつのダンジョン', now: r.best, total: goal, unit: '階', where: 'ルミナの町の南門の近く',
    note: `いちばん深い所：${r.best ? `${r.best}階` : 'まだ入っていない'}${r.save ? `\n記録した階：${r.save}階` : ''}\n10階ごとに番人がいる。`, items: [],
  };
}

// 職業（ついた ことの ある 職業だけ。まだ ついて いない 職業の 名前・なりかたは 出さない）
function jobsTrack(c) {
  const ids = Object.keys(c?.jobs || {}).filter((id) => JOBS[id]);
  if (!ids.length) return null;
  const items = ids.map((id) => {
    const lv = c.jobs[id]?.lv || 1;
    const done = lv >= JOB_MAX_LEVEL;
    return { name: jobLabel(id, c), where: id === c.job ? '今の職業' : '', state: done ? 'done' : id === c.job ? 'now' : 'open', right: done ? `マスター（Lv${lv}）` : `Lv${lv}/${JOB_MAX_LEVEL}` };
  }).sort(byState);
  return {
    id: 'jobs', name: '職業のマスター', now: items.filter((x) => x.state === 'done').length, total: items.length, unit: 'こ',
    where: `${npcWhere('priestess') || 'ルミナの町'}の神殿`, note: 'ついたことのある職業の数。マスターすると、新しい職業への道が開くことがある。', items,
  };
}

// 職業の 試練（超級職より 上の 職業だけ。物語で まだ 受けられない 試練は 数に 入れない）
function trialsTrack(c) {
  const ids = Object.keys(c?.jobs || {}).filter((id) => JOBS[id] && trialJob(id));
  if (!ids.length) return null;
  const f = flagFn(c);
  const per = TRIALS.filter((T) => !T.flag || f(T.flag)).length;
  const items = ids.map((id) => {
    const n = Math.min(per, trialsCleared(id, c.jobs[id]));
    const st = trialState(c, id);
    const right = n >= per ? `${n}/${per}すんだ` : st.active ? `${st.active.name}のとちゅう` : st.canTake ? `${st.next.name}を受けられる` : `${n}/${per}`;
    return { name: jobLabel(id, c), where: st.why === 'lv' ? `職業Lv${st.next.needLv}で受けられる` : '', state: n >= per ? 'done' : st.active ? 'now' : st.canTake ? 'open' : 'wait', right };
  }).sort(byState);
  return {
    id: 'trials', name: '職業の試練', now: ids.reduce((s, id) => s + Math.min(per, trialsCleared(id, c.jobs[id])), 0), total: ids.length * per, unit: 'こ',
    where: `${npcWhere('trial_keeper') || 'ルミナの町'}の試練の番人`, note: '試練をこえると、職業レベルの上限が上がる。', items,
  };
}

// 幻の職業（名前を 知らない 物は ？？？。条件は 幻の書で）
function phantomTrack(c) {
  const rows = phantomBook(c);
  if (!rows.some((r) => r.known)) return null;
  const items = rows.map((r) => (r.known
    ? { name: r.name, where: '', state: r.got ? 'done' : r.ready ? 'open' : 'now', right: r.got ? 'なった' : r.ready ? 'なれる！' : `条件${r.conds.filter((x) => x.done).length}/${r.conds.length}` }
    : { name: '？？？', where: '', state: 'unknown', right: '' })).sort(byState);
  return {
    id: 'phantom', name: '幻の職業', now: rows.filter((r) => r.got).length, total: rows.length, unit: 'こ',
    where: `${npcWhere('priestess') || 'ルミナの町'}の神殿`, note: 'くわしい条件は、メニューの「幻の書」で見られる。', items,
  };
}

// 限界とっぱ（上限まで きたえた 装備。持っている 物と 装備している 物）
function ownedGear(c) {
  const ids = [...(c?.items || []).map((e) => e?.id), ...Object.values(c?.equip || {})].filter((id) => ITEMS[id]);
  return [...new Set(ids)];
}
function limitTrack(c) {
  const list = ownedGear(c).filter((id) => lbOf(id) > 0 || canLimitBreak(id, c));
  if (!list.length) return null;
  const items = list.map((id) => {
    const k = lbOf(id);
    return { name: ITEMS[id].name, where: '', state: k >= LB_MAX ? 'done' : canLimitBreak(id, c) ? 'open' : 'now', right: `★${k}/${LB_MAX}` };
  }).sort(byState);
  return {
    id: 'limit', name: '限界とっぱ', now: list.reduce((s, id) => s + lbOf(id), 0), total: list.length * LB_MAX, unit: '★',
    where: `${npcWhere('town_smith') || 'ルミナの町'}のかじ屋・れん金がま`, note: '上限まできたえた装備を、さらに★3まで強くできる。', items,
  };
}

// 魔物ずかん（メニューの 図鑑と おなじ 数え方）・仲間・配合
function zukanTrack(c) {
  const order = bestiaryOrder(MONSTERS);
  const bs = c?.bestiary || {};
  const kills = c?.kills || {};
  let seen = 0, friend = 0, bred = 0;
  for (const sp of order) {
    const b = bs[sp] || {};
    const fr = (b.friend || 0) > 0;
    const br = (b.bred || 0) > 0;
    if ((b.seen || 0) > 0 || (kills[sp] || 0) > 0 || fr || br) seen++;
    if (fr) friend++;
    if (br) bred++;
  }
  return {
    id: 'zukan', name: '魔物図鑑', now: seen, total: order.length, unit: 'しゅ', where: 'メニューの「図鑑」',
    note: `仲間にした魔物：${friend}しゅ\n配合で生んだ魔物：${bred}しゅ`, items: [],
    extra: [{ name: '仲間にした魔物', right: `${friend}しゅ` }, { name: '配合で生んだ魔物', right: `${bred}しゅ` }],
  };
}

// 小さなメダル（メダル王の つぎの ごほうびまで）
function medalTrack(c) {
  const found = medalsFound(c);
  if (!found) return null;
  const given = medalsGiven(c);
  const held = medalsHeld(c);
  const next = nextMedalReward(c);
  return {
    id: 'medal', name: '小さなメダル', now: given + held, total: next ? next.at : given + held, unit: 'まい', where: npcWhere('medal_king') || 'メダル王の城',
    note: `見つけたメダル：${found}まい\nメダル王にわたした：${given}まい\n${next ? `つぎのごほうびは${next.at}まいで` : '今もらえるごほうびは、全部もらった'}`, items: [],
  };
}

// ダンジョンの 宝箱（宝箱を 1つでも 開けた ダンジョンだけ。開ける 前の ダンジョンは 数えない）
function chestGroups(c) {
  const f = flagFn(c);
  const opened = c?.chests || {};
  const groups = new Map();
  for (const m of Object.values(MAPS)) {
    if (m.kind !== 'dungeon' || !m.chests?.length) continue;
    const key = String(m.name || m.id).split('　')[0];
    const g = groups.get(key) || { name: key, total: 0, open: 0 };
    for (const ch of m.chests) {
      if (!condOk(ch.show, f) && !opened[ch.id]) continue;
      g.total++;
      if (opened[ch.id]) g.open++;
    }
    groups.set(key, g);
  }
  return [...groups.values()].filter((g) => g.open > 0 && g.total > 0);
}
function chestTrack(c) {
  const groups = chestGroups(c);
  if (!groups.length) return null;
  const items = groups.map((g) => ({ name: g.name, where: '', state: g.open >= g.total ? 'done' : 'now', right: g.open >= g.total ? '全部開けた' : `あと${g.total - g.open}こ` })).sort(byState);
  return {
    id: 'chest', name: 'ダンジョンの宝箱', now: groups.reduce((s, g) => s + g.open, 0), total: groups.reduce((s, g) => s + g.total, 0), unit: 'こ',
    where: '', note: '宝箱を1つでも開けたダンジョンの数。', items,
  };
}

// 第88回 G4班: 作品の ガチャガチャ（店の 人に 話した あと）・七つの玉（うわさを 聞くか 1つ 見つけた あと。data/gacha-r88.js）
function gachaTrack(c) {
  if (!c?.flags?.r88_gacha_seen) return null;
  const items = gachaWorks().map((w) => {
    const n = gachaPool(w).all.length, got = gachaGot(c, w);
    return { name: workName(w), where: '', state: got >= n ? 'done' : 'now', right: got >= n ? '全部そろった' : `${got}/${n}（のこり${n - got}こ）` };
  }).sort(byState);
  return {
    id: 'gacha', name: '作品のガチャガチャ', now: items.filter((x) => x.state === 'done').length, total: items.length, unit: '作品', where: 'ルミナの町・王都サファラ',
    note: `1回${GACHA_PRICE}ゴールド。まだ持っていない作品の品が1つ出る（同じ品は出ない）。\n${GACHA_PITY}回つづけて名品が出ないと、次はかならず名品。`, items,
  };
}
function orbTrack(c) {
  const n = orbsFound(c);
  if (!n && !c?.flags?.r88_orb_heard) return null;
  const items = ORB_PLACES.map((p) => (c?.chests?.[orbChestId(p)]
    ? { name: ITEMS[p.item]?.name || p.item, where: '', state: 'done', right: '見つけた' }
    : { name: '？？？', where: '', state: 'unknown', right: '' })).sort(byState);
  return {
    id: 'orbs', name: '七つの玉', now: n, total: ORB_PLACES.length, unit: 'つ', where: npcWhere('r88_gacha_keeper_0') || 'ルミナの町',
    note: '世界のあちこちに1つずつねむる玉。\nガチャガチャ屋が、うわさを1つずつ教えてくれる。\n7つそろえて山の上のほこらへ。', items,
  };
}

// 第78回 3-10: 家族ミッション（家族サーバーの 世界の 側の 数。ctx.missions … サーバーの 返事 world/missions.js の missionView。ひとりモードでは 出さない）
function missionTrack(c, ctx) {
  const m = ctx?.missions;
  if (!m || m.offline || !m.week) return null;
  const list = m.week.list || [];
  return {
    id: 'mission', name: '家族ミッション', now: list.filter((x) => x.done).length, total: list.length, unit: 'つ', where: 'メニューの「家族ミッション」',
    note: `今週のミッション（のこり${m.week.days}日）。\n家族サーバーで、2人いじょうがいっしょに遊ぶと進む。`,
    items: list.map((x) => ({ name: x.text, right: x.done ? '達成！' : `${x.now}/${x.need}`, state: x.done ? 'done' : 'now' })),
  };
}

const TRACKS = [missionTrack, boardTrack, sideTrack, arenaTrack, monArenaTrack, tmapTrack, sdTrack, limitTrack, phantomTrack, jobsTrack, trialsTrack, zukanTrack, medalTrack, chestTrack, gachaTrack, orbTrack];
export const TRACK_IDS = ['mission', 'board', 'side', 'arena', 'monarena', 'tmap', 'sd', 'limit', 'phantom', 'jobs', 'trials', 'zukan', 'medal', 'chest', 'gacha', 'orbs'];
// 第88回 G3班: まぼろしの回廊（職業の 試練の つぎ）
TRACKS.splice(TRACKS.indexOf(trialsTrack) + 1, 0, rivalTrack);
TRACK_IDS.splice(TRACK_IDS.indexOf('trials') + 1, 0, 'rival');
// 第88回 G9班: ドラゴンボール（七つの玉の つぎ）
TRACKS.splice(TRACKS.indexOf(orbTrack) + 1, 0, dballTrack);
TRACK_IDS.splice(TRACK_IDS.indexOf('orbs') + 1, 0, 'dballs');

export function shioriTracks(c, ctx = {}) {
  const out = [];
  for (const fn of TRACKS) {
    const t = fn(c || {}, ctx || {});
    if (t) out.push(t);
  }
  return out;
}

// ───────────── 3. おすすめ（3つまで。物語 1つ と より道）─────────────
// { kind: 'story' | 'side', text, where, go（えらんだ ときに 開く しくみの id）}
export const REC_MAX = 3;
function sideRecs(c, tracks) {
  const f = flagFn(c);
  const T = Object.fromEntries(tracks.map((t) => [t.id, t]));
  const out = [];
  const push = (go, text, where) => { if (!out.some((r) => r.go === go)) out.push({ kind: 'side', text, where, go }); };
  // 1. 報告できる たのまれごと
  const boardNames = new Set(subQuestHints().filter((q) => q.board).map((q) => q.name));
  const ready = subQuests(c).find((q) => q.ready);
  if (ready) push(boardNames.has(ready.name) ? 'board' : 'side', `たのまれごと「${ready.name}」を報告できます`, npcWhere(ready.who));
  // 2. 幻の職業に なれる
  const ph = T.phantom?.items.find((x) => x.state === 'open');
  if (ph) push('phantom', `幻の職業「${ph.name}」になれます`, T.phantom.where);
  // 3. メダル王の ごほうび
  if (T.medal && T.medal.now >= T.medal.total && nextMedalReward(c)) push('medal', 'メダル王から、ごほうびがもらえます', T.medal.where);
  // 4. 職業の 試練（今の 職業）
  const st = c?.job && JOBS[c.job] ? trialState(c, c.job) : null;
  if (st?.ready) push('trials', `${jobLabel(c.job, c)}の${st.active.name}で、師しょうのまぼろしと戦えます`, T.trials?.where || '');
  else if (st?.canTake) push('trials', `${jobLabel(c.job, c)}の${st.next.name}を受けられます`, T.trials?.where || '');
  // 4.5 第88回 G3班: まぼろしの回廊で ちょうせん できる ライバル
  const rv = T.rival ? rivalRec(c) : null;
  if (rv) push('rival', rv.text, rv.where);
  // 5. 闘技場の つぎの ランク
  const ar = T.arena?.items.find((x) => x.state === 'open');
  if (ar) push('arena', `サファラ闘技場の${ar.name}に、ちょうせんできます`, T.arena.where);
  const mr = T.monarena?.items.find((x) => x.state === 'open');
  if (mr) push('monarena', `モンスター闘技場の${mr.name}に、ちょうせんできます`, T.monarena.where);
  // 6. 受けられる お仕事いらい・より道
  const avail = availableSubQuests(c);
  const board = avail.filter((q) => q.board);
  if (board.length) {
    const mine = board.filter((q) => q.roots && jobLine(q.roots).has(c?.job)).length;
    push('board', `受けられるお仕事いらいが${board.length}つあります${mine ? `（今の職業で解決できそうなのが${mine}つ）` : ''}`, T.board?.where || BOARD_WHERE());
  }
  const side = avail.filter((q) => !q.board);
  if (side.length) push('side', `困っている人が${side.length}人います`, side[0].place);
  // 7. 限界とっぱ できる 装備
  const lb = T.limit?.items.filter((x) => x.state === 'open').length || 0;
  if (lb) push('limit', `限界とっぱできる装備が${lb}こあります`, T.limit.where);
  // 8. まだ ほって いない 宝の地図
  if (T.tmap?.items.length) push('tmap', `まだ宝をほっていない地図が${T.tmap.items.length}まいあります`, T.tmap.items[0].where);
  // 9. 今の 職業が もう 上がらない（試練も ない）
  const cur = c?.jobs?.[c?.job];
  if (cur && (cur.lv || 1) >= JOB_MAX_LEVEL && (!st || st.why === 'tier' || st.all)) push('jobs', `${jobLabel(c.job, c)}はマスターずみ。神殿で、ほかの職業にもなってみよう`, T.jobs?.where || '');
  // 10. 宝箱の のこり
  const ch = T.chest?.items.find((x) => x.state === 'now');
  if (ch) push('chest', `${ch.name}に、まだ開けていない宝箱があります`, ch.name);
  // 第88回 G4班: 七つの玉が ぜんぶ 見つかった（まだ 竜神の玉に かえて いない）
  if (T.orbs && SEVEN_ORBS.every((id) => ownsR88(c, id))) push('orbs', '七つの玉がそろいました。山の上のほこらへ行ってみよう', '');
  // 第88回 G9班: ドラゴンボールが 7つ そろった（神龍の さいだんへ）
  if (T.dballs && ballsAll(c)) push('dballs', 'ドラゴンボールが7つそろいました。星見の丘のさいだんへ行ってみよう', '星見の丘');
  // 11. ひみつのダンジョン
  if (T.sd && f(SD_OPEN_FLAG)) push('sd', `ひみつのダンジョンの${T.sd.total}階をめざそう`, T.sd.where);
  return out;
}

export function shioriRecs(c, tracks = shioriTracks(c)) {
  const next = storyNext(c);
  const out = [];
  if (next.objective && !next.end) {
    out.push({ kind: 'story', text: next.where ? `物語のつぎの場所は「${next.where}」です` : '物語のつぎの目標があります', where: next.where, go: 'story' });
  }
  for (const r of sideRecs(c, tracks)) {
    if (out.length >= REC_MAX) break;
    out.push(r);
  }
  return out;
}

// ───────────── まとめ ─────────────
// ctx.missions … 家族ミッション（client/ui/missions.js が サーバーに 聞いた 物。なければ 出さない）
export function shioriOf(c, ctx = {}) {
  const ch = c || {};
  const tracks = shioriTracks(ch, ctx);
  return { story: { ...storyPlace(ch), ...storyNext(ch), bossHints: bossHintsSeen(ch) }, tracks, recs: shioriRecs(ch, tracks) };
}

// 1行の 数（「12/32」）。total が ない ときは now だけ
export function trackCount(t) {
  if (t.unit === 'Lv') return `Lv${t.now}/${t.total}`;
  if (t.unit === '階') return `${t.now}階`;
  return t.total === null || t.total === undefined ? `${t.now}${t.unit}` : `${t.now}/${t.total}`;
}
// 棒の 長さ（0〜1）
export function trackRate(t) {
  if (!t.total) return 0;
  return Math.max(0, Math.min(1, t.now / t.total));
}

// 第88回 G9班: ドラゴンボール（1つ 見つけるか、ドラゴンレーダーを 持つか、ねがった ことが ある 時から）
//   ドラゴンレーダーを 持って いると、まだの 玉の 地方が わかる。ねがいの あとは、また 集められるまでの 日数
function dballTrack(c, ctx) {
  const n = ballsFound(c);
  const radar = hasRadar(c);
  const wished = Number(c?.flags?.[WISH_N_FLAG]) || 0;
  if (!n && !radar && !wished) return null;
  const items = DB_PLACES.map((p) => (c?.chests?.[dbChestId(p)]
    ? { name: ITEMS[p.item]?.name || p.item, where: p.where, state: 'done', right: '見つけた' }
    : { name: '？？？', where: radar ? p.area : '', state: 'unknown', right: radar ? 'レーダーに反応' : '' })).sort(byState);
  const wait = c?.flags?.[WISH_AT_FLAG] ? wishWaitLeft(c, ctx?.now || Date.now()) : 0;
  const note = [
    '世界のダンジョンの宝箱に、1つずつねむる7つの玉。',
    radar ? 'ドラゴンレーダーで、まだの玉の地方がわかる。' : 'ドラゴンレーダーがあれば、玉の地方がわかる。',
    '7つそろえて星見の丘のさいだんへ。ねがいを1つかなえてもらえる。',
    ...(wished ? [`これまでのねがい ${wished}回。`] : []),
    ...(wait > 0 ? [`玉は石になってねむっている。また集められるのは、${wishWaitDays(wait)}日くらいあと。`] : []),
  ].join('\n');
  return { id: 'dballs', name: 'ドラゴンボール', now: n, total: DB_PLACES.length, unit: 'つ', where: '星見の丘', note, items };
}
