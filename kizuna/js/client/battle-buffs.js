// 第38回 C: 戦いの 画面の バフ・デバフ・じわじわ回復の しるし（だれに 何が かかっているか・あと 何回か）
//   ・仲間の まど（.b-mem .sts）… 「攻↑3」「守↓↓2」「回復4」「かばう2」の 小さな 札（ui/info.js の buffMarks）
//   ・敵 … すがたの 足もとに 小さな 札（キャンバスに かく。数が 多い ときは 入るだけ ＋「…」）
//   数は のこりの 行動の 回数（かかった 人が 行動するたびに 1 へる）。ずっと つづく ものは 数なし
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（r35-css.js と おなじ やりかた）
//   .tag.slv … 技の レベルの 札（メニューの「呪文・技」・戦いの 技の 一覧。Lv5 は .max で 金色）
import { el } from './ui/dom.js?v=6f0cf3958911';
import { buffMarks, regenMark, statusNames } from './ui/info.js?v=6f0cf3958911';

const CSS = `
.b-mem .sts .bm { display: inline-block; font-size: 0.92em; line-height: 1.15; padding: 0 0.25em; margin: 0 0.2em 0.1em 0; border-radius: 4px; white-space: nowrap; border: 1px solid currentColor; }
.b-mem .sts .bm.up { color: #ffd66b; background: rgba(255, 170, 40, 0.16); }
.b-mem .sts .bm.dn { color: #9ec4ff; background: rgba(80, 120, 255, 0.18); }
.b-mem .sts .bm.rg { color: #8ff0a8; background: rgba(60, 200, 110, 0.16); }
.b-mem .sts .bm.cv { color: #e8c8ff; background: rgba(170, 110, 255, 0.16); }
.b-mem .sts .st { margin-right: 0.3em; }
.menu .tag.slv { color: #8ff0a8; font-size: 0.62em; }
.menu .tag.slv.max { color: #ffd66b; }
@media (max-aspect-ratio: 1/1) {
  .b-mem .sts .bm { font-size: 0.86em; padding: 0 0.15em; margin-right: 0.12em; }
}
@media (orientation: landscape) and (max-height: 500px) {
  .b-mem .sts .bm { font-size: 0.86em; padding: 0 0.15em; margin-right: 0.12em; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('r38-buff-css')) {
  const s = document.createElement('style');
  s.id = 'r38-buff-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 1人ぶんの 札（{ text, cls }）。a … pub（buffs・buffLeft・regen・covering・coverLeft）
export function unitMarks(a) {
  const out = buffMarks(a.buffs, a.buffLeft).map((m) => ({ text: m.text, cls: m.up ? 'up' : 'dn' }));
  if (a.regen) out.push({ text: regenMark(a.regen), cls: 'rg' });
  if (a.covering && a.side === 'ally') out.push({ text: `かばう${Number.isFinite(a.coverLeft) ? a.coverLeft : ''}`, cls: 'cv' });
  return out;
}

// 仲間の まどの じょうたいの 行（client/battle.js の renderStatus）
export function fillStatusRow(box, a) {
  box.replaceChildren();
  if (!a.alive) {
    box.textContent = '死んでいる';
    return;
  }
  const st = [a.defending ? '防御' : '', statusNames(a.status)].filter(Boolean).join(' ');
  if (st) box.append(el('span', { class: 'st', text: st }));
  for (const m of unitMarks(a)) box.append(el('span', { class: `bm ${m.cls}`, text: m.text }));
}

// 敵の 足もとの 札（x … キャンバス〈BW×BH の 大きさで かく〉、m … computeLayout の 1体、bottom … かいて よい 下の はし）
const COLORS = { up: ['#3a2406', '#ffd66b'], dn: ['#0c1a3a', '#9ec4ff'], rg: ['#0a2a16', '#8ff0a8'], cv: ['#22103a', '#e8c8ff'] };
export function drawEnemyMarks(x, m, c, bottom) {
  if (!c.alive || c.dead > 0 || c.burrow) return;
  const marks = unitMarks(c);
  if (!marks.length) return;
  x.save();
  // エフェクトが のこした かきかたの 設定（光・かげ・文字の よせ方）を もとに もどす
  x.globalCompositeOperation = 'source-over';
  x.shadowBlur = 0;
  x.shadowColor = 'transparent';
  x.filter = 'none';
  x.textAlign = 'left';
  x.imageSmoothingEnabled = true;
  x.font = 'bold 7px "M PLUS 1p", "KizunaDot", sans-serif';
  x.textBaseline = 'middle';
  const h = 8, gap = 1.5;
  const widths = marks.map((k) => Math.ceil(x.measureText(k.text).width) + 3);
  // 1行に 入る ぶんだけ（すがたの はば ＋ すこし）で 2行まで。入らない ときは「…」
  const room = Math.max(m.w + 10, 34);
  const rows = [[]];
  let used = 0, shown = 0;
  for (let i = 0; i < marks.length; i++) {
    if (rows[rows.length - 1].length && used + widths[i] > room) {
      if (rows.length >= 2) break;
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(i);
    used += widths[i] + gap;
    shown++;
  }
  const more = shown < marks.length;
  const top = Math.min(bottom - h * rows.length - gap * (rows.length - 1), Math.round(m.y + m.h + 1.5));
  rows.forEach((row, r) => {
    const last = r === rows.length - 1;
    const total = row.reduce((sum, i) => sum + widths[i] + gap, 0) - gap + (last && more ? 7 : 0);
    let px = Math.round(m.x + m.w / 2 - total / 2);
    const py = top + r * (h + gap);
    for (const i of row) {
      const [bg, fg] = COLORS[marks[i].cls] || COLORS.up;
      x.globalAlpha = 0.85;
      x.fillStyle = bg;
      x.fillRect(px, py, widths[i], h);
      x.globalAlpha = 1;
      x.strokeStyle = fg;
      x.lineWidth = 0.6;
      x.strokeRect(px + 0.3, py + 0.3, widths[i] - 0.6, h - 0.6);
      x.fillStyle = fg;
      x.fillText(marks[i].text, px + 1.5, py + h / 2 + 0.3);
      px += widths[i] + gap;
    }
    if (last && more) {
      x.fillStyle = '#ffffff';
      x.fillText('…', px, py + h / 2);
    }
  });
  x.restore();
}
