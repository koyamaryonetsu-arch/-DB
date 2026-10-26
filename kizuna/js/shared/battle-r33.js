// 第33回（2026年10月）: 3年B組の担任の「学校の 仲間が いると はりきる」
//
// 担任（jobs.js の passive.classmates）が 技（呪文・特技）を 使う とき、いっしょに 戦っている 仲間のうち
// 学校の 職業（jobs.js の SCHOOL_JOBS）に 今 ついている 人 1人に つき、技の 力が classmates（0.1）ずつ 上がる（3人まで）。
// ダメージ・回復に かかる。補助の 上がりかたは 上限の まま（battle.js の applyBuff は 力が 1倍を こえても かわらない。時間だけ 少し のびる）
// battle.js の 'ability' が powMult に かける
import { JOBS, SCHOOL_JOBS } from './data/jobs.js?v=dd582b3d4c53';

export const CLASSMATES_MAX = 3;

// 学校の 仲間の 人数（自分は 数えない。たおれた・にげた 仲間も 数えない）
export function classmatesOf(b, c) {
  if (c?.side !== 'ally') return 0;
  return (b?.allies || []).filter((x) => x !== c && x.alive && !x.fled && SCHOOL_JOBS.includes(x.job)).length;
}

// 技の 力に かける 数（担任で なければ 1）
export function classmateMult(b, c) {
  const per = c?.side === 'ally' ? JOBS[c.job]?.passive?.classmates : 0;
  if (!per) return 1;
  return 1 + per * Math.min(CLASSMATES_MAX, classmatesOf(b, c));
}
