// 第50回 N3: 大事な物の「すぐ使う」ボタン（時の砂時計・ミナモの星読み・星読みのしおり。data/quick-item.js）
// ・スマホ: 大鳥・竜の ボタンと おなじ 列に「砂時計」など（使える 場所に いる ときだけ）
// ・コントローラー: 設定で えらんだ ボタン（ZL・L3・R3）、キーボード: T（client/input.js の 'quick'）
// ・おすと メニューの「道具」→「使う」と おなじ（サーバーの { t: 'menu', action: 'quickUse' }）
import { el } from './dom.js?v=894e2368ad04';
import { MAPS } from '../../shared/maps/index.js?v=894e2368ad04';
import { quickItemOf, quickLabel, quickHere, quickPadOf } from '../../shared/data/quick-item.js?v=894e2368ad04';

const CSS = `
/* 大事な物の すぐ使う ボタン（client/ui/quick-item.js） */
.hud-btn.hud-quick { color: #ffe2b0; border-color: #d8a85a; }
.menu .tag.quick { color: #ffe2b0; border-color: #d8a85a; background: rgba(216, 168, 90, 0.2); }
`;

export class QuickButton {
  constructor(game) {
    this.game = game;
    if (!document.getElementById('quick-item-css')) document.head.append(el('style', { id: 'quick-item-css', text: CSS }));
    this.btn = el('button', { class: 'win hud-btn hud-quick', text: '砂時計', onclick: () => this.use() });
    this.btn.hidden = true;
    game.hud.btns.append(this.btn);
  }

  // まいフレーム（game.js の frame）
  update() {
    const g = this.game;
    const c = g.me;
    g.input.quickPad = quickPadOf(c);
    const f = g.field;
    const me = f?.me;
    const show = g.state === 'field' && !!c && !!me
      && quickHere(c, MAPS, f.mapId, me.x, me.y, { flying: !!g.sky?.flying, visiting: !!g.visitingLeader?.() });
    if (show) {
      const label = quickLabel(quickItemOf(c));
      if (this.btn.textContent !== label) this.btn.textContent = label;
    }
    if (this.btn.hidden === show) this.btn.hidden = !show;
  }

  // ボタン・コントローラー・T キー（使えない 場所でも おくる。わけは サーバーが 知らせる）
  use() {
    const g = this.game;
    if (g.state !== 'field' || g.busy || g.menuOpen || g.input.busy) return;
    g.net.send({ t: 'menu', action: 'quickUse' });
  }
}
