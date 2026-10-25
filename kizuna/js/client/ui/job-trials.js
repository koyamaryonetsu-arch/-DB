// 第38回 B: 職業の試練の がめん（メニューの「強さ」の 職業レベル・しょうごう、「クエスト」の 試練の とちゅう）
// きまりは shared/data/job-trials.js。試練の番人の 話は shared/world/job-trials.js
import { el } from './dom.js?v=f7adbedf412d';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL } from '../../shared/data/jobs.js?v=f7adbedf412d';
import { jobProgress } from '../../shared/stats.js?v=f7adbedf412d';
import { jobLabel } from '../../shared/job-label.js?v=f7adbedf412d';
import { trialState, trialName, jobTitle, jobTopCap, PHANTOM_NAME } from '../../shared/data/job-trials.js?v=f7adbedf412d';

// 職業レベルの 右の 字（「Lv7（あと12回）」「Lv10 ★マスター」「Lv12/15（あと40回）」「Lv15 ★上限」「Lv20 ★きわめた」）
export function jobLevelText(c, j) {
  const pg = jobProgress(c, j);
  const lv = c.jobs?.[j]?.lv || 1;
  if (!pg.done) return { text: pg.cap > JOB_MAX_LEVEL ? `Lv${lv}/${pg.cap}（あと${pg.next}回）` : `Lv${lv}（あと${pg.next}回）`, cls: lv >= JOB_MAX_LEVEL ? 'gold' : '' };
  if (lv <= JOB_MAX_LEVEL) return { text: `Lv${lv} ★マスター`, cls: 'gold' };
  return { text: lv >= jobTopCap(j) ? `Lv${lv} ★きわめた` : `Lv${lv} ★上限`, cls: 'gold' };
}

// 試練の 1行（受けている・受けられる。ない ときは null）
export function trialRow(c, j) {
  const st = trialState(c, j);
  if (st.active) {
    const name = trialName(j, st.active.n, c);
    if (st.ready) return { name, text: `${PHANTOM_NAME}と戦える！（試練の番人へ）`, ready: true };
    return { name, text: `修行 ${st.count}/${st.need}回${j === c.job ? '' : `（${jobLabel(j, c)}の時だけ）`}`, ready: false };
  }
  if (j === c.job && st.canTake) return { name: trialName(j, st.next.n, c), text: '受けられる（星の神殿の試練の番人）', ready: true };
  return null;
}

// 試練の 行（今の 職業を 先に。受けている ものと、今の 職業で 受けられる もの）
export function trialRows(c) {
  if (!c || c.species) return [];
  const jobs = [c.job, ...ALL_JOBS.filter((j) => j !== c.job && c.jobs?.[j]?.tq)];
  return jobs.map((j) => trialRow(c, j)).filter(Boolean);
}

// メニューの「強さ」: しょうごう（Lv15・20）と 試練の とちゅう
// self … 自分の キャラ（仲間は 試練を 受けられない ので しょうごうだけ）
export function trialStatusBox(c, self = true) {
  if (!c || c.species || !JOBS[c.job]) return null;
  const box = el('div', { class: 'job-trial-box', style: { marginTop: '0.4em' } });
  const t = jobTitle(c);
  if (t) box.append(el('div', { class: 'kv small' }, el('span', { class: 'k', text: 'しょうごう' }), el('span', { class: 'gold', text: t })));
  for (const r of self ? trialRows(c) : []) box.append(el('div', { class: 'kv small' }, el('span', { text: r.name }), el('span', { class: r.ready ? 'good' : 'muted', text: r.text })));
  return box.childNodes.length ? box : null;
}

// メニューの「クエスト」: 職業の試練
export function trialQuestBox(c) {
  const rows = trialRows(c);
  if (!rows.length) return null;
  const box = el('div');
  box.append(el('h3', { style: { marginTop: '0.6em' }, text: '職業の試練' }));
  for (const r of rows) box.append(el('div', { class: 'kv' }, el('span', {}, el('i', { class: `qdot ${r.ready ? 'ready' : 'sub'}` }), r.name), el('span', { class: r.ready ? 'good' : 'muted', text: r.text })));
  return box;
}
