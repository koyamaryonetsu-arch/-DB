// 第86回 A班: 幻の職業 2つの 戦いの 画面（shared/battle-r86a.js）
//   ・r86aMarks … 仲間の まどの 小さな 札（「ためた力850」・「きずな3」・「みんなを守る」）。battle-buffs.js の unitMarks。
//     家族 みんなの 画面に 出る（pub の r86aTame・r86aKizuna・r86aGuard）
//   ・r86aPresent … 人とようかいのきずなの 2だん目（ためた力の 大きな 風。ev.r86aBurst）・力を ためた 人の まどが 光る・
//     かけ橋が 自動で かばった・竜神の剣士の 剣が よく 効く 方で 当たった（バナー）
//   ・竜神の剣士の 玉がえ・火竜をよぶ は YAIBA・烈火と おなじ メニュー（client/battle-r82b.js の tamaMenu・battle-r85b.js の ryuMenu）。
//     shared/battle-r86a.js を 読みこむと 竜神の剣士の 玉（雷・水・氷・風・竜神）が tamaSet に 入る
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { R86A_JOBS } from '../shared/battle-r86a.js?v=2a2abae0c26c';
import { ELEMENT_NAMES } from '../shared/data/abilities.js?v=2a2abae0c26c';

const CSS = `
.b-mem .sts .bm.tame86 { color: #fff4f0; background: rgba(220, 40, 40, 0.35); font-weight: bold; }
.b-mem .sts .bm.kizuna86 { color: #ffffff; background: rgba(255, 255, 255, 0.2); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r86a-css')) {
  const s = document.createElement('style');
  s.id = 'r86a-css';
  s.textContent = CSS;
  document.head.append(s);
}
export const R86A_CLIENT_JOBS = R86A_JOBS;

// 1人ぶんの 札（a … pub）。{ text, cls }
export function r86aMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  if (a.r86aTame > 0) out.push({ text: `ためた力${a.r86aTame}`, cls: 'tame86' });
  if (a.r86aKizuna) out.push({ text: `きずな${a.r86aKizuna}`, cls: 'kizuna86' });
  if (a.r86aGuard) out.push({ text: 'みんなを守る', cls: 'up' });
  return out;
}

// 行動の えんしゅつ（client/battle.js の 行動の ところから。hitDelay … 当たる まで）
export function r86aPresent(view, ev, hitDelay = 0) {
  const g = view.game;
  // 人とようかいのきずな 2だん目: ためた力の 大きな 風（行動の はじめに 出る）
  const bu = ev.r86aBurst;
  if (bu?.targets?.length) {
    const pts = bu.targets.map((id) => view.c.get(id)).filter(Boolean).map((c) => view.center(c)).filter(Boolean);
    if (pts.length) view.fx.play('r86a_burst', pts, 'wind', { fromAlly: true });
    view.banner(bu.tame > 0 ? `ためた力${bu.tame}を、風にして返した！` : 'きずなの風！', 'combo');
    g.audio.sfx('crit');
  }
  if (ev.r86aSigSet) view.banner('みんなを守る！（次の番に風で返す）', 'combo');
  // 力を ためた 人の まどが 赤く 光る
  for (const id of Object.keys(ev.r86aStored || {})) view.fx.at(Math.max(0, hitDelay), () => { if (!view.destroyed) view.glowStatus(id, '#ff6a5a'); });
  const by = ev.r86aCover?.by || ev.r86aCovers?.[0]?.by;
  if (by) {
    const who = view.c.get(by)?.name || '';
    view.fx.at(Math.max(0, hitDelay - 120), () => { if (!view.destroyed) view.banner(`${who}が、仲間をかばった！`, 'combo'); });
  }
  // 竜神の剣士の 剣: 2つの 属性で 切った
  const els = ev.r86aDual?.els;
  const uniq = [...new Set(els || [])];
  if (uniq.length > 1) {
    view.fx.at(Math.max(0, hitDelay - 60), () => { if (!view.destroyed) view.banner(`${uniq.map((el) => ELEMENT_NAMES[el]).join('と')}の刀！`, 'combo'); });
  }
}
