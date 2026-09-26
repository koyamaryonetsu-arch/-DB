// フィールドの がめんの かざり（HP・ばしょ・もくひょう・ちず・チャット）
import { el, bar, askText, ListMenu } from './dom.js';
import { computeStats } from '../../shared/stats.js';
import { JOBS } from '../../shared/data/jobs.js';
import { renderMiniMap, openWorldMap } from './menu.js';
import { makeCanvas } from '../render/pixel.js';

export const STAMPS = ['よろしく！', 'ありがとう！', '行くよー！', '助けて！', '待ってて！', 'やったね！', 'おつかれさま', 'ご飯だよ〜'];

export class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('hud');
    this.party = el('div', { class: 'hud-party' });
    this.area = el('div', { class: 'win hud-area' });
    this.obj = el('div', { class: 'win hud-obj', onclick: () => this.game.openMenu('quest') });
    this.mapBox = el('div', { class: 'win hud-map', onclick: () => openWorldMap(game), title: '地図' });
    this.mini = makeCanvas(84, 84);
    this.mapBox.append(this.mini);
    this.btns = el('div', { class: 'hud-btns' },
      el('button', { class: 'win hud-btn', text: 'メニュー', onclick: () => game.openMenu() }),
      el('button', { class: 'win hud-btn', text: 'チャット', onclick: () => this.chatInput() }),
      el('button', { class: 'win hud-btn', text: 'スタンプ', onclick: () => this.stampMenu() }));
    this.chat = el('div', { class: 'hud-chat' });
    this.status = el('div', { class: 'win', style: { position: 'absolute', left: '50%', bottom: '40%', transform: 'translateX(-50%)', display: 'none' } });
    this.root.append(this.party, this.area, this.obj, this.mapBox, this.btns, this.chat, this.status);
    this.lastArea = null;
    this.miniTimer = 0;
  }

  show(on) { this.root.hidden = !on; }

  update(dt) {
    this.miniTimer -= dt;
    if (this.miniTimer <= 0) {
      this.miniTimer = 250;
      renderMiniMap(this.game, this.mini, false);
    }
    const f = this.game.field;
    if (!f.map) return;
    const name = f.areaName();
    if (name !== this.lastArea) {
      this.lastArea = name;
      this.area.textContent = name;
      this.area.classList.add('show');
      clearTimeout(this.areaT);
      this.areaT = setTimeout(() => this.area.classList.remove('show'), 2800);
    }
  }

  renderParty() {
    const g = this.game;
    const c = g.me;
    if (!c) return;
    this.party.innerHTML = '';
    const add = (name, lv, job, hp, maxHp, mp, maxMp, tag, away = false, mon = null) => {
      const box = el('div', { class: `win hud-mem ${hp <= 0 ? 'dead' : ''} ${away ? 'away' : ''}` },
        el('div', { class: 'nm' }, el('span', { text: name }), el('span', { class: 'lv', text: `${mon ? 'Lv' : JOBS[job]?.short || ''}${lv}` })),
        el('div', { class: 'small', text: away ? '通信待ち…' : `H${hp} M${mp}` }),
        bar(hp / Math.max(1, maxHp)), bar(mp / Math.max(1, maxMp), 'mp'));
      if (tag) box.title = tag;
      this.party.append(box);
    };
    const st = computeStats(c);
    add(c.name, c.level, c.job, c.hp, st.maxHp, c.mp, st.maxMp);
    const p = g.party;
    for (const m of p?.members || []) if (m.sid !== g.sid) add(m.name, m.level, m.job, m.hp, m.maxHp, m.mp, m.maxMp, '家族', m.away);
    for (const s of p?.supports || []) add(s.name, s.level, s.job, s.hp, s.maxHp, s.mp, s.maxMp, s.family ? '家族サポート' : s.species ? 'モンスター' : '仲間', false, s.species);
    for (const gu of p?.guests || []) add(gu.name, gu.level, gu.job, gu.hp, gu.maxHp, gu.mp ?? 0, gu.maxMp || 1, 'ゲスト');
  }

  // leader … さそわれて 手伝っている リーダーの 名前（その人の 目標を 出す）
  setObjective(text, leader = '') {
    this.obj.innerHTML = '';
    this.obj.append(el('b', { text: leader ? `${leader}の目標　` : '目標　' }), document.createTextNode(text || '（自由に冒険しよう）'));
  }

  addChat(from, text, stamp) {
    const line = el('div', {}, el('b', { text: from }), document.createTextNode('：' + (stamp ? `「${stamp}」` : text)));
    this.chat.append(line);
    while (this.chat.children.length > 6) this.chat.firstChild.remove();
    setTimeout(() => line.remove(), 12500);
  }

  async chatInput() {
    const g = this.game;
    if (g.busy) return;
    const text = await askText(g.input, { title: 'チャット（家族みんなに届く）', max: 80, placeholder: '今どこにいる？' });
    if (text) g.net.send({ t: 'chat', text });
  }

  stampMenu() {
    const g = this.game;
    if (this.stampBox) return;
    const back = el('div', { class: 'modal-back', style: { background: 'transparent' }, onclick: () => { g.audio.sfx('cancel'); close(); } });
    const box = el('div', { class: 'win panel stamp-panel' });
    const m = new ListMenu(g.input, {
      items: STAMPS.map((s) => ({ label: s, value: s })),
      cols: 2,
      back: '閉じる',
      sound: (x) => g.audio.sfx(x),
      onSelect: (it) => {
        g.net.send({ t: 'chat', stamp: it.value });
        close();
      },
      onCancel: () => close(),
    });
    box.append(m.root);
    document.getElementById('ui').append(back, box);
    this.stampBox = box;
    m.focus();
    const close = () => {
      m.blur();
      back.remove();
      box.remove();
      this.stampBox = null;
    };
  }

  setConnection(state) {
    if (state === 'lost') {
      this.status.style.display = '';
      this.status.textContent = '通信が切れました…つなぎ直しています';
    } else this.status.style.display = 'none';
  }
}
