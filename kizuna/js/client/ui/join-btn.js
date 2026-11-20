// 第89回: 家族の ボス・物語の 戦いに「戦いに入る」ボタン
// 家族の 声:「ボス戦も、フィールド戦と同じように接近すれば参加できるハズだったのにできないことがありました。」
// ・同じ パーティーの 家族が ボス・物語の 戦い（サーバーの party.fights。world.js の partyFights）を して いて、
//   自分が 入って いない 間、フィールドの ボタンの 列（「自動追跡」と 同じ ならび）に「⚔ ○○の戦いに入る」
// ・おすと どこに いても（べつの マップ・だいほんで 運ばれた 先でも）その 戦いに 入る（サーバーの joinBattle の remote）
// ・会話・地図を えらぶ・お店の 間も ボタンは 出た まま。おすと「終わったら入れる」と 知らせる
// ・ことわられた 時は サーバーが わけを 知らせる（world.js の joinBattle）
import { el, toast } from './dom.js?v=6f2d42a85ac3';
import { JOIN_COOLDOWN_MS } from '../../shared/join-rule.js?v=6f2d42a85ac3';

const CSS = `
.hud-btn.hud-join { color: #ffe9a8; border-color: #e0a040; background: rgba(90, 40, 10, 0.88); font-weight: bold; }
`;

// 入れる 戦い（自分が 入って いない もの。いちばん 前の 1つ）
export function joinTarget(g) {
  if (g.state !== 'field' || !g.party || (g.party.members?.length || 0) < 2) return null;
  const list = Array.isArray(g.party.fights) ? g.party.fights : [];
  return list.find((f) => f && f.sid && f.sid !== g.sid && !(f.sids || []).includes(g.sid)) || null;
}
export const joinLabel = (f) => `⚔ ${f.name}の戦いに入る`;

export class JoinButton {
  constructor(game) {
    this.game = game;
    if (!document.getElementById('join-btn-css')) document.head.append(el('style', { id: 'join-btn-css', text: CSS }));
    this.btn = el('button', { class: 'win hud-btn hud-join', text: '', onclick: () => this.press() });
    this.btn.hidden = true;
    this.at = 0;
    game.hud.btns.append(this.btn); // いちばん 前は メニューの ボタン（hud.js が 知らせの ● を つける）
  }

  // まいフレーム（game.js の frame）
  update() {
    const f = joinTarget(this.game);
    if (f) {
      const label = joinLabel(f);
      if (this.btn.textContent !== label) this.btn.textContent = label;
    }
    if (this.btn.hidden === !!f) this.btn.hidden = !f;
  }

  press() {
    const g = this.game;
    const f = joinTarget(g);
    if (!f) return;
    // 会話・地図を えらぶ・お店の とちゅう: ボタンは 出た まま。終わったら おせる
    if (g.busy || g.menuOpen || g.input?.busy) {
      g.audio?.sfx?.('buzz');
      toast('今は入れない。\n会話などが終わったら、もう一度おしてね');
      return;
    }
    const now = performance.now();
    if (now - this.at < JOIN_COOLDOWN_MS) return;
    this.at = now;
    g.audio?.sfx?.('confirm');
    g.net.send({ t: 'joinBattle', sid: f.sid, remote: true });
  }
}
