// 第78回: 冒険のしおり（docs/plan-r78-shiori.md）
//   「つぎに 何を すれば いいか」「何が のこって いるか」を 1まいで 見せる ための まとめ。
//   キャラ（c）だけを 見て 答えを 作る 純粋な 関数（c は かえない）。サーバーでも ひとりモードでも おなじ
//   （client/ui/shiori.js が g.me を わたす。サーバーは キャラを まるごと 'self' で おくって いるので、たのむ 物は ない）
//
// ネタバレの きまり（docs の 4）:
//   ・まだ 開いて いない しくみは 出さない（数にも 入れない）。先の 章で 開く 物も 入れない
//   ・ボスの 名前・物語の 先・かくれた 職業の じょうけんは 書かない。名前を 知らない 物は「？？？」
//   ・物語の 幕の 名前は、その 幕の はじまりの 文字（ゲームの 中の chapter）を 見た あとだけ
import { OBJECTIVE_TARGETS, liveTargets, whereName, subQuests } from '../data/quest-targets.js?v=bfc4e5f50af2';
import { OBJECTIVE_TALK } from '../data/party-talk.js?v=bfc4e5f50af2';
import { subQuestHints, availableSubQuests, subQuestStarted } from '../data/subquest-hints.js?v=bfc4e5f50af2';
import { jobLine } from '../data/fq-common.js?v=bfc4e5f50af2';
import { ARENA_RANKS, rankOpen, rankCleared, rankLabel, arenaOpen } from '../data/arena.js?v=bfc4e5f50af2';
import { MONARENA_RANKS, MONARENA_OPEN_FLAG, monRankOpen, monRankCleared } from '../data/monarena.js?v=bfc4e5f50af2';
import { TM_LV_MAX, tmTitle } from '../data/treasure.js?v=bfc4e5f50af2';
import { tmPlaceShort } from '../data/treasure-hint.js?v=bfc4e5f50af2';
import { tierInfo, TIER_MAX, tmClearCount } from '../data/casino-tier.js?v=bfc4e5f50af2';
import { sdRecordOf, SD_OPEN_FLAG, SD_GUARD_EVERY } from '../data/secret.js?v=bfc4e5f50af2';
import { phantomBook } from '../data/phantom.js?v=bfc4e5f50af2';
import { JOBS, JOB_MAX_LEVEL } from '../data/jobs.js?v=bfc4e5f50af2';
import { TRIALS, trialJob, trialsCleared, trialState } from '../data/job-trials.js?v=bfc4e5f50af2';
import { bestiaryOrder } from '../data/companions.js?v=bfc4e5f50af2';
import { MONSTERS } from '../data/monsters.js?v=bfc4e5f50af2';
import { medalsFound, medalsGiven, medalsHeld, nextMedalReward } from '../data/casino.js?v=bfc4e5f50af2';
import { canLimitBreak, lbOf } from '../data/forge.js?v=bfc4e5f50af2';
import { LB_MAX } from '../data/items-forge.js?v=bfc4e5f50af2';
import { ITEMS } from '../data/items.js?v=bfc4e5f50af2';
import { MAPS, condOk } from '../maps/index.js?v=bfc4e5f50af2';
import { jobLabel } from '../job-label.js?v=bfc4e5f50af2';

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
    ],
  },
];
const PART_NAMES = { 1: '第1部', 2: '第2部' };

// 今の 章・幕。{ part, chapter, act, label, title, actTitle, cleared }
export function storyPlace(c) {
  const f = flagFn(c);
  let ch = CHAPTERS[0];
  for (const C of CHAPTERS) if (C.start && f(C.start)) ch = C;
  let act = null;
  for (const A of ch.acts || []) if (f(A.start)) act = A;
  const cleared = act?.clear ? f(act.clear) : !!(ch.clear && f(ch.clear) && ch.n > 0);
  const chName = ch.n === 0 ? '序章' : `第${ch.n}章`;
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
    id: 'tmap', name: '宝の地図', now: best, total: TM_LV_MAX, unit: 'Lv', where: '地図の場所で地面を調べる',
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

const TRACKS = [boardTrack, sideTrack, arenaTrack, monArenaTrack, tmapTrack, sdTrack, limitTrack, phantomTrack, jobsTrack, trialsTrack, zukanTrack, medalTrack, chestTrack];
export const TRACK_IDS = ['board', 'side', 'arena', 'monarena', 'tmap', 'sd', 'limit', 'phantom', 'jobs', 'trials', 'zukan', 'medal', 'chest'];

export function shioriTracks(c) {
  const out = [];
  for (const fn of TRACKS) {
    const t = fn(c || {});
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
export function shioriOf(c) {
  const ch = c || {};
  const tracks = shioriTracks(ch);
  return { story: { ...storyPlace(ch), ...storyNext(ch) }, tracks, recs: shioriRecs(ch, tracks) };
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
