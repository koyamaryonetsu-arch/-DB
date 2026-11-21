// 第83回 A班: 封神演義の 系統の 戦いの 画面（shared/battle-r83a.js の 作戦・強化ふうじ・先読みの策・守りの旗）
//   ・sakusenMenu … 「作戦を立てる」を えらぶと、えらべる 作戦の 一覧（今の 作戦に「今」）。えらぶと { type: 'ability', id, sakusen } を おくる
//     （YAIBA の 玉がえの メニュー〈battle-r82b.js の tamaMenu〉と おなじ 画面）
//   ・r83aMarks … 仲間の まどの 小さな 札（作戦「攻め25%」・先読み・旗）と 敵の 足もとの 札（強化ふうじ「ふうじ3」）。battle-buffs.js の unitMarks
//     家族 みんなの 画面に 出る（pub の r83aPlan・r83aSeal・r83aSaki・r83aHata）
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { SAKUSEN, sakusenSet, sakusenPct } from '../shared/battle-r83a.js?v=d4d473d565e8';

const CSS = `
.b-mem .sts .bm.sk { color: var(--sk, #ff8a5a); background: rgba(20, 20, 40, 0.55); font-weight: bold; }
.menu .sk-dot { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 2px; margin-right: 0.35em; vertical-align: -0.05em; border: 1px solid rgba(255,255,255,0.7); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r83a-plan-css')) {
  const s = document.createElement('style');
  s.id = 'r83a-plan-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 1人ぶんの 札（a … pub）。{ text, cls, color? }
export function r83aMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  const p = a.r83aPlan;
  if (p && SAKUSEN[p.kind]) out.push({ text: `${SAKUSEN[p.kind].mark}${p.pct}%`, cls: 'sk', color: SAKUSEN[p.kind].color });
  if (a.r83aSaki) out.push({ text: '先読み', cls: 'up' });
  if (a.r83aHata) out.push({ text: '旗', cls: 'up' });
  if (a.r83aSeal) out.push({ text: `ふうじ${a.r83aSeal}`, cls: 'dn' });
  return out;
}

// 作戦の 札の 色（battle-buffs.js の fillStatusRow。玉の 札と おなじ やりかた）
export function paintPlanMarks(box, a) {
  const m = r83aMarks(a).find((x) => x.cls === 'sk');
  if (!m) return;
  for (const sp of box.querySelectorAll('.bm.sk')) sp.style.setProperty('--sk', m.color);
}

// 作戦を立てる メニュー（view … client/battle.js の BattleScene、a … 自分の pub、id … 作戦を立てる 技、back … もどる）
export function sakusenMenu(view, a, id, back) {
  const set = sakusenSet(a);
  const cur = a.r83aPlan?.kind;
  const pct = Math.round(sakusenPct(a) * 100);
  const items = set.map((k) => ({
    html: `<span class="sk-dot" style="background:${SAKUSEN[k].color}"></span>${SAKUSEN[k].name}${k === cur ? '<span class="tag slv">今</span>' : ''}`,
    right: `${pct}%`,
    value: k,
  }));
  if (!items.length) return view.send({ type: 'ability', id });
  const start = Math.max(0, set.indexOf(cur));
  view.showMenu(items, (it) => view.send({ type: 'ability', id, sakusen: it.value }), back, 'どの作戦にする？', (it) => {
    if (!it) return;
    view.info(`${SAKUSEN[it.value].name}：${SAKUSEN[it.value].desc}（${pct}%）。自分がたおれるか、作戦をかえるまで、ずっと効く。`);
  }, start);
}
