// 職業の タグと 合体技の 一覧（第35回）。職業を ふやす ときに、作ってある 職業との 兼ね合いを 見る
// つかいかた:
//   node tools/job-tags.mjs          … タグごとの 職業と、そのタグの 合体技
//   node tools/job-tags.mjs jobs     … 職業ごとの タグと、入れる 合体技の 数（少ない じゅん）
//   node tools/job-tags.mjs duals    … 合体技の 全部の 表（README の 開発メモ よう。Markdown）
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { TAGS, TAG_ORDER, tagName, jobsWithTag } from '../public/js/shared/data/job-tags.js';
import { DUAL_TECHS, DUAL_ORDER, ANY_GROUPS, MONSTER_ALLY, groupJobs, groupTags, dualSize, dualNeedText, dualNeedLabel } from '../public/js/shared/data/dual.js';

const mode = process.argv[2] || 'tags';
const open = (g) => ANY_GROUPS.has(g) || g === MONSTER_ALLY;
// その 職業が 入れる 合体技（「だれでも」の 組は 数えない）
const dualsOf = (j) => DUAL_ORDER.filter((id) => DUAL_TECHS[id].need.some((g) => !open(g) && groupJobs(g).has(j)));

if (mode === 'jobs') {
  const rows = ALL_JOBS.map((j) => ({ j, n: dualsOf(j).length })).sort((a, b) => a.n - b.n);
  for (const { j, n } of rows) console.log(`${String(n).padStart(3)}  ${JOBS[j].name}（${JOBS[j].tags.map(tagName).join('・')}）`);
} else if (mode === 'duals') {
  console.log('| 合体技 | 人数 | 組 |');
  console.log('|---|---|---|');
  for (const id of DUAL_ORDER) console.log(`| ${DUAL_TECHS[id].name} | ${dualSize(id)}人 | ${dualNeedLabel(id).replace('必要な', '')}：${dualNeedText(id)} |`);
} else {
  for (const t of TAG_ORDER) {
    const techs = DUAL_ORDER.filter((id) => DUAL_TECHS[id].need.some((g) => groupTags(g).includes(t))).map((id) => DUAL_TECHS[id].name);
    console.log(`■ ${tagName(t)}（${TAGS[t].desc}）`);
    console.log(`  職業 ${jobsWithTag(t).length}: ${jobsWithTag(t).map((j) => JOBS[j].name).join('・')}`);
    console.log(`  合体技 ${techs.length}: ${techs.join('・')}`);
  }
}
