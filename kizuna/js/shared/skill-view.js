// 第71回 E: メニューの「覚えた技」の 見方（家族の ねがい「一覧だと見づらすぎる」。docs/plan-r69-skill-menu.md）
//   2つの 見方を 切りかえる（client/ui/menu.js の skillsView。Y か 画面の ボタン）
//   ・種類で見る: 呪文・特技 に わけて、その 中を 戦いの 技えらびと おなじ 種類（今の職業・攻撃1体・攻撃全体・回復・強くする・弱くする・そのほか）
//   ・職業で見る: 覚えた 職業ごと（今の 職業が 先、あとは 職業の じゅん）。ひらめき・魔物の 技などは「そのほか」
//   どちらも 中は 弱い じゅん（shared/skill-sort.js）。空の タブは 出さない。タブは L・R（Q・E）で じゅんに かえる
// ここは 画面に よらない きまり（テスト: test/skill-menu-r71.test.js）
import { ALL_JOBS, JOBS } from './data/jobs.js?v=9a5805f1f322';
import { jobAbilities } from './stats.js?v=9a5805f1f322';
import { skillTabs } from './skill-tabs.js?v=9a5805f1f322';
import { sortByStdPower, favSection } from './skill-sort.js?v=9a5805f1f322';
import { jobLabel } from './job-label.js?v=9a5805f1f322';

export const LEARN_VIEWS = { kind: '種類で見る', job: '職業で見る' };
export const LEARN_SECS = [['spell', '呪文'], ['skill', '特技']];

// 種類で見る: [{ key: 'spell:one', sec: 'spell', id, label, title, ids }]。呪文の タブが 先、つぎに 特技
//   abs: id → 技（男の子むけの 名前 など）。job: 今の 職業（「今の職業」の タブ）。★お気に入りの タブは 出さない（「お気に入り」の タブが ある）
export function learnedKindTabs(ids, { abs, job } = {}) {
  const sorted = sortByStdPower(ids);
  const secOf = (id) => favSection(abs(id)) || 'skill';
  return LEARN_SECS.flatMap(([k]) => skillTabs(sorted.filter((id) => secOf(id) === k), { abs, job })
    .filter((t) => t.id !== 'fav')
    .map((t) => ({ ...t, sec: k, key: `${k}:${t.id}` })));
}

// 職業で見る: [{ key: 'job:mage', id: 'mage', label, ids }]。今の 職業 → 職業の じゅん（ALL_JOBS）→ そのほか
//   1つの 技を いくつもの 職業で 覚えた ときは 先の タブだけに 出す
export function learnedJobTabs(char, ids) {
  const sorted = sortByStdPower(ids);
  const tabs = [];
  const owner = new Map();
  if (!char?.species) {
    const has = (j) => JOBS[j] && char?.jobs?.[j];
    const order = [char?.job, ...ALL_JOBS.filter((j) => j !== char?.job)].filter(has);
    for (const j of order) for (const id of jobAbilities(char, j)) if (!owner.has(id)) owner.set(id, j);
    for (const j of order) {
      const list = sorted.filter((id) => owner.get(id) === j);
      if (list.length) tabs.push({ key: `job:${j}`, id: j, label: jobLabel(j, char) || j, title: j === char.job ? '今の職業' : '', ids: list });
    }
  }
  const rest = sorted.filter((id) => !owner.has(id));
  if (rest.length) tabs.push({ key: 'job:other', id: 'other', label: 'そのほか', title: char?.species ? '' : 'ひらめき・ほかの技', ids: rest });
  return tabs;
}

// 前に 見た タブ（なければ 1つめ）。kind の 見方で 前の タブが ない ときは おなじ 呪文・特技の 1つめ
export function pickLearnTab(tabs, last) {
  if (!tabs.length) return null;
  const hit = tabs.find((t) => t.key === last);
  if (hit) return hit;
  const sec = String(last || '').split(':')[0];
  return tabs.find((t) => t.sec && t.sec === sec) || tabs[0];
}

// L・R: となりの タブ（はしから はしへ まわる）
export function nextLearnTab(tabs, key, d) {
  if (!tabs.length) return null;
  const i = Math.max(0, tabs.findIndex((t) => t.key === key));
  return tabs[(i + d + tabs.length) % tabs.length];
}
