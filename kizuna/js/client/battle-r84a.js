// 第84回 A班: 幽☆遊☆白書の 系統の 戦いの 画面（shared/battle-r84a.js の れい丸の 数・仲間のために・立ち上がり）
//   ・r84aMarks … 仲間の まどの 小さな 札（のこりの れい丸「れい丸3」・仲間のために「仲間3」・立ち上がった あとの 力「本気3」）。
//     battle-buffs.js の unitMarks。家族 みんなの 画面に 出る（pub の r84aRei・r84aNakama・r84aRise）
//   ・reiTag … 技の 一覧の れい丸の 技に「丸1」「丸全部」の しるし（client/battle.js の abilityMenu）
//   ・reiBlock … れい丸が 足りない 技は うすく（えらべない）・わけ（「れい丸がもうない」など）を せつめいの 先に【】で 出す
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { reiOf, reiNeed } from '../shared/battle-r84a.js?v=92b65651df0b';

const CSS = `
.b-mem .sts .bm.rei { color: #8ad8ff; background: rgba(20, 40, 80, 0.6); font-weight: bold; }
.b-mem .sts .bm.rei.zero { color: #9aa0b8; background: rgba(20, 20, 40, 0.55); font-weight: normal; }
.menu .tag.rei { color: #8ad8ff; border-color: #5ab0f0; }
`;
if (typeof document !== 'undefined' && !document.getElementById('r84a-rei-css')) {
  const s = document.createElement('style');
  s.id = 'r84a-rei-css';
  s.textContent = CSS;
  document.head.append(s);
}

// のこりの れい丸（a … pub。れい丸を 持たない 人は null）
export const reiView = (a) => (a?.r84aRei && a.r84aRei.max > 0 ? a.r84aRei : null);

// 1人ぶんの 札（a … pub）。{ text, cls }
export function r84aMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  const r = reiView(a);
  if (r) out.push({ text: `れい丸${r.n}`, cls: r.n > 0 ? 'rei' : 'rei zero' });
  if (a.r84aNakama) out.push({ text: `仲間${a.r84aNakama}`, cls: 'up' });
  if (a.r84aRise) out.push({ text: `本気${a.r84aRise}`, cls: 'up' });
  return out;
}

// 技の 一覧の しるし（れい丸を 使わない 技は ''）
export function reiTag(ab) {
  const r = reiOf(ab);
  if (!r) return '';
  return `<span class="tag rei">${r.all ? '丸全部' : `丸${reiNeed(ab)}`}</span>`;
}

// えらべない わけ（えらべる 時は null）
export function reiBlock(a, ab) {
  const need = reiNeed(ab);
  if (!need) return null;
  const r = reiView(a);
  if (!r) return 'れい丸をうてない';
  if (r.n >= need) return null;
  return r.n <= 0 ? 'れい丸がもうない（れい力をためると、もどる）' : `れい丸が${need}発いる（のこり${r.n}発）`;
}
