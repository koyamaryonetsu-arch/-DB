// フィールドの がめんの かざり（HP・ばしょ・もくひょう・ちず・チャット）
import { el, bar, askText, ListMenu } from './dom.js';
import { computeStats } from '../../shared/stats.js';
import { JOBS } from '../../shared/data/jobs.js';
import { renderMiniMap, openWorldMap } from './menu.js';
import { makeCanvas } from '../render/pixel.js';

export const STAMPS = ['よろしく！', 'ありがとう！', 'いくよー！', 'たすけて！', 'まってて！', 'やったね！', 'おつかれさま', 'ごはんだよ〜'];

export class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('hud');
    this.party = el('div', { class: 'hud-party' });
    this.area = el('div', { class: 'win hud-area' });
    this.obj = el('div', { class: 'win hud-obj', onclick: () => this.game.openMenu('quest') });
    this.mapBox = el('div', { class: 'win hud-map', onclick: () => openWorldMap(game), title: 'ちず' });
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
    const add = (name, lv, job, hp, maxHp, mp, maxMp, tag, away = false) => {
      const box = el('div', { class: `win hud-mem ${hp <= 0 ? 'dead' : ''} ${away ? 'away' : ''}` },
        el('div', { class: 'nm' }, el('span', { text: name }), el('span', { class: 'lv', text: `${JOBS[job]?.name?.slice(0, 2) || ''}${lv}` })),
        el('div', { class: 'small', text: away ? 'つうしんまち…' : `H${hp} M${mp}` }),
        bar(hp / Math.max(1, maxHp)), bar(mp / Math.max(1, maxMp), 'mp'));
      if (tag) box.title = tag;
      this.party.append(box);
    };
    const st = computeStats(c);
    add(c.name, c.level, c.job, c.hp, st.maxHp, c.mp, st.maxMp);
    const p = g.party;
    for (const m of p?.members || []) if (m.sid !== g.sid) add(m.name, m.level, m.job, m.hp, m.maxHp, m.mp, m.maxMp, 'かぞく', m.away);
    for (const s of p?.supports || []) add(s.name, s.level, s.job, s.hp, s.maxHp, s.mp, s.maxMp, 'サポート');
    for (const gu of p?.guests || []) add(gu.name, gu.level, gu.job, gu.hp, gu.maxHp, 0, 1, 'ゲスト');
  }

  setObjective(text) {
    this.obj.innerHTML = '';
    this.obj.append(el('b', { text: 'もくひょう　' }), document.createTextNode(text || '（じゆうに ぼうけんしよう）'));
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
    const text = await askText(g.input, { title: 'チャット（かぞく みんなに とどく）', max: 80, placeholder: 'いま どこに いる？' });
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
      back: 'とじる',
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
      this.status.textContent = 'つうしんが きれました… つなぎなおしています';
    } else this.status.style.display = 'none';
  }
}
