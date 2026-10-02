// フィールドの がめんの かざり（HP・ばしょ・もくひょう・ちず・チャット）
import { el, bar, askText, ListMenu } from './dom.js?v=50cb6b27c5a9';
import { computeStats } from '../../shared/stats.js?v=50cb6b27c5a9';
import { JOBS } from '../../shared/data/jobs.js?v=50cb6b27c5a9';
import { renderMiniMap, openWorldMap } from './menu.js?v=50cb6b27c5a9';
import { makeCanvas } from '../render/pixel.js?v=50cb6b27c5a9';
import { ClockBadge } from './clock.js?v=50cb6b27c5a9';

export const STAMPS = ['よろしく！', 'ありがとう！', '行くよー！', '助けて！', '待ってて！', 'やったね！', 'おつかれさま', 'ご飯だよ〜'];

// パーティーの ならび（じぶん → 家族 → 仲間 → ゲスト）。HUD と メニューで つかう
export function partyRows(g) {
  const c = g.me;
  if (!c) return [];
  const p = g.party;
  const people = [];
  const sups = [];
  const guests = [];
  const add = (to, name, level, hp, maxHp, mp, maxMp, tag, away = false, player = false, ref = null) => {
    const r = Math.max(0, hp) / Math.max(1, maxHp);
    const hpCls = hp <= 0 ? 'dead' : r <= 0.1 ? 'red' : r <= 0.5 ? 'orange' : '';
    to.push({ name, level, hp, maxHp, mp, maxMp, tag, away, player, hpCls, ref });
  };
  const st = computeStats(c);
  add(people, c.name, c.level, c.hp, st.maxHp, c.mp, st.maxMp, '', false, true, 'self');
  for (const m of p?.members || []) if (m.sid !== g.sid) add(people, m.name, m.level, m.hp, m.maxHp, m.mp, m.maxMp, '家族', m.away, true);
  for (const s of p?.supports || []) add(sups, s.name, s.level, s.hp, s.maxHp, s.mp, s.maxMp, s.family ? '家族サポート' : s.species ? 'モンスター' : '仲間', false, false, s.key);
  for (const gu of p?.guests || []) add(guests, gu.name, gu.level, gu.hp, gu.maxHp, gu.mp ?? 0, gu.maxMp || 1, 'ゲスト');
  // ならびかえ（リーダーが きめた じゅんばん）
  const pos = Math.max(0, Math.min(sups.length, p?.selfPos || 0));
  return [...sups.slice(0, pos), ...people, ...sups.slice(pos), ...guests];
}

export class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('hud');
    this.party = el('div', { class: 'hud-party' });
    this.area = el('div', { class: 'win hud-area' });
    this.obj = el('div', { class: 'win hud-obj', onclick: () => this.game.openMenu('quest') });
    this.mapBox = el('div', { class: 'win hud-map', onclick: () => openWorldMap(game), title: '地図' });
    this.mini = makeCanvas(84, 84);
    // 昼・夜の 時計（ちずの 左下）
    this.clock = new ClockBadge(game);
    this.mapBox.append(this.mini, this.clock.el);
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
      this.clock.update();
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
    if (!g.me) return;
    this.party.innerHTML = '';
    // 家族と いっしょ（マルチ）の ときは、人が 動かしている キャラの 名前を 黄緑に。HP が へると オレンジ・赤
    const multi = (g.party?.members?.length || 1) >= 2;
    for (const m of partyRows(g)) {
      const box = el('div', { class: `win hud-mem ${m.hp <= 0 ? 'dead' : ''} ${m.away ? 'away' : ''}` },
        el('div', { class: 'nm' }, el('span', { class: `n ${multi && m.player ? 'player' : ''} ${m.hpCls}`, text: m.name }), el('span', { class: 'lv', text: `Lv${m.level}` })),
        el('div', { class: `small hn ${m.hpCls}`, text: m.away ? '通信待ち…' : `H${Math.max(0, m.hp)} M${m.mp}` }),
        bar(Math.max(0, m.hp) / Math.max(1, m.maxHp), m.hpCls ? `hp ${m.hpCls}` : 'hp'), bar(m.mp / Math.max(1, m.maxMp), 'mp'));
      if (m.tag) box.title = m.tag;
      this.party.append(box);
    }
  }

  // leader … さそわれて 手伝っている リーダーの 名前（その人の 目標を 出す）
  setObjective(text, leader = '') {
    this.obj.innerHTML = '';
    this.obj.append(el('b', { text: leader ? `${leader}の目標　` : '目標　' }), document.createTextNode(text || '（自由に冒険できる）'));
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
