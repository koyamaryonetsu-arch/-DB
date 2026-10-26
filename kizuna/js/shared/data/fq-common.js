// お仕事いらい板の たのまれごとで 使う どうぐ（第39回 C の sidequests-family.js から 分けた。第41回）
// ・職業の 系統（jobLine）・その 系統の 人（lineMember）・いない 時の ヒント（need）・乗り物を もらう（vehicleSteps）
// ・sidequests-family.js（はじめの 5つ）と sidequests-work.js（第41回の 6つ）の どちらも ここを 使う
import { JOBS, jobAncestry } from './jobs.js?v=754c2ad0d696';
import { FAMILY_VEHICLES } from './vehicles-family.js?v=754c2ad0d696';

export const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
export const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───────────── 職業の 系統 ─────────────
// roots の どれかから 転職で つながる 職業（roots も 入る。新しい 職業が ふえても 合う）
const lineCache = new Map();
export function jobLine(roots) {
  const key = roots.join(',');
  if (lineCache.has(key)) return lineCache.get(key);
  const set = new Set();
  for (const id of Object.keys(JOBS)) if (roots.some((r) => jobAncestry(id).has(r))) set.add(id);
  lineCache.set(key, set);
  return set;
}
// 系統の 職業の 名前（基本職 → 上級職 → 超級職 → その先 の じゅん）
export function jobLineNames(roots) {
  return [...jobLine(roots)].sort((a, b) => (JOBS[a].tier || 0) - (JOBS[b].tier || 0)).map((id) => JOBS[id].name);
}
// chars … いっしょに 戦う 人の キャラ。その 系統の 人（魔物の 仲間は 職業が ないので 数えない）
export function lineMember(chars, roots) {
  const line = jobLine(roots);
  return (chars || []).find((c) => c && !c.species && line.has(c.job)) || null;
}
export function partyHasLine(chars, roots) {
  return !!lineMember(chars, roots);
}
const partyOfCtx = (x) => (x.partyChars ? x.partyChars() : [x.c].filter(Boolean));
export const proOf = (x, q) => lineMember(partyOfCtx(x), q.roots);

// いない 時の ヒント（系統の 名前は 4つまで）
export function needText(q) {
  const names = jobLineNames(q.roots);
  const list = names.slice(0, 4).join('・') + (names.length > 4 ? ' など' : '');
  return [`${q.job}の人が、パーティーにいてくれたら…。`, `（${list}の人と、いっしょに来よう。\n酒場の仲間や、家族の仲間でもいいよ）`];
}
export const need = (q) => N(...needText(q));

// 乗り物を もらう（パーティーの みんな。もう 持っていたら そのまま）
export function vehicleSteps(id) {
  const v = FAMILY_VEHICLES[id];
  return [
    ['call', (run) => {
      for (const m of run.everyone) {
        const c = m.char;
        if (!Array.isArray(c.vehicles)) c.vehicles = [];
        if (!c.vehicles.includes(id)) c.vehicles.push(id);
      }
      run.world.markDirty();
      run.say(`${run.who()}は${v.name}をもらった！\n（メニューの「乗り物」で、走る時に乗れる）`);
    }],
    ['sfx', 'key'],
  ];
}

// クエストの 画面の どうぐ（いくつ すんだか・まだの 1つめ）
export const cnt = (f, list) => list.filter((k) => f(k)).length;
export const firstMissing = (f, list) => list.findIndex((k) => !f(k));
