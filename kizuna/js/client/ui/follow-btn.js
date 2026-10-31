// 第58回: マルチプレイで リーダーに ついていく（自動追跡）の ボタン
// ・家族と パーティーを くんでいて、自分が リーダーで ない ときだけ、フィールドの ボタンの 列に「自動追跡」
// ・おすと オン・オフ（メニューの「仲間」の「リーダーについていく」と おなじ。game.follow）
import { el, toast } from './dom.js?v=a5c15ff5e061';

// 自動追跡の ボタンの 見た目
const CSS = `
.hud-btn.hud-follow { color: #cfd8ff; border-color: #7a8ad8; }
.hud-btn.hud-follow.on { color: #10203a; background: #9fe0ff; border-color: #ffffff; font-weight: bold; }
`;

export const followShown = (g) => g.state === 'field' && !!g.party && (g.party.members?.length || 0) > 1 && g.party.leader !== g.sid;
export const followLabel = (on) => (on ? '自動追跡：オン' : '自動追跡：オフ');

export class FollowButton {
  constructor(game) {
    this.game = game;
    if (!document.getElementById('follow-btn-css')) document.head.append(el('style', { id: 'follow-btn-css', text: CSS }));
    this.btn = el('button', { class: 'win hud-btn hud-follow', text: followLabel(false), onclick: () => this.toggle() });
    this.btn.hidden = true;
    game.hud.btns.append(this.btn);
  }

  // まいフレーム（game.js の frame）
  update() {
    const g = this.game;
    const show = followShown(g);
    if (show) {
      const on = !!g.follow;
      const label = followLabel(on);
      if (this.btn.textContent !== label) this.btn.textContent = label;
      this.btn.classList.toggle('on', on);
    }
    if (this.btn.hidden === show) this.btn.hidden = !show;
  }

  toggle() {
    const g = this.game;
    if (!followShown(g) || g.busy || g.menuOpen) return;
    g.follow = !g.follow;
    g.audio?.sfx?.(g.follow ? 'confirm' : 'cancel');
    toast(g.follow ? 'リーダーについていきます（自動追跡：オン）' : '自分で歩きます（自動追跡：オフ）');
    this.update();
  }
}
