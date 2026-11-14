// 第82回 B班: YAIBA の 系統の 戦いの 画面（shared/battle-r82b.js の 玉がえ）
//   ・tamaMenu … 「玉がえ」を えらぶと、持てる 玉の 一覧（今の 玉に「今」）。えらぶと { type: 'ability', id, tama } を おくる
//   ・r82bMarks … 仲間の まどの 小さな 札（今の 玉「雷玉」・きょだい化「きょだい3」・雷神の守り「雷守3」。battle-buffs.js の unitMarks）
//     家族 みんなの 画面に 出る（pub の tama・kyodai・raiGuard）
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { TAMA, tamaSet, tamaOf } from '../shared/battle-r82b.js';
import { ELEMENT_NAMES } from '../shared/data/abilities.js';

const CSS = `
.b-mem .sts .bm.tm { color: var(--tm, #ffe040); background: rgba(20, 20, 40, 0.55); font-weight: bold; }
.b-mem .sts .bm.ky { color: #ffd84a; background: rgba(255, 200, 40, 0.18); }
.menu .tama-dot { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 50%; margin-right: 0.35em; vertical-align: -0.05em; border: 1px solid rgba(255,255,255,0.7); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r82b-tama-css')) {
  const s = document.createElement('style');
  s.id = 'r82b-tama-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 仲間の まどの 札（a … pub）。{ text, cls, color? }
export function r82bMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  const el = a.tama;
  if (el && TAMA[el]) out.push({ text: `${TAMA[el].mark}玉`, cls: 'tm', color: TAMA[el].color });
  if (a.kyodai) out.push({ text: `きょだい${a.kyodai}`, cls: 'ky' });
  if (a.raiGuard) out.push({ text: `雷守${a.raiGuard}`, cls: 'up' });
  return out;
}

// 玉がえの メニュー（view … client/battle.js の BattleView、a … 自分の pub、id … 玉がえの 技、back … もどる）
export function tamaMenu(view, a, id, back) {
  const set = tamaSet(a);
  const cur = tamaOf(a);
  const items = set.map((el) => ({
    html: `<span class="tama-dot" style="background:${TAMA[el].color}"></span>${TAMA[el].name}${el === cur ? '<span class="tag slv">今</span>' : ''}`,
    right: ELEMENT_NAMES[el],
    value: el,
  }));
  if (!items.length) return view.send({ type: 'ability', id });
  const start = Math.max(0, set.indexOf(cur));
  view.showMenu(items, (it) => view.send({ type: 'ability', id, tama: it.value }), back, 'どの玉をはめる？', (it) => {
    if (!it) return;
    view.info(`${TAMA[it.value].name}をはめると、この系統の剣の技が${ELEMENT_NAMES[it.value]}の属性になる。`);
  }, start);
}
