// フィールドの がめんの かざり（HP・ばしょ・もくひょう・ちず・チャット）
import { el, bar, askText, ListMenu } from './dom.js?v=521ab50e1f2b';
import { computeStats } from '../../shared/stats.js?v=521ab50e1f2b';
import { JOBS } from '../../shared/data/jobs.js?v=521ab50e1f2b';
import { jobShort } from '../../shared/job-label.js?v=521ab50e1f2b';
import { hasUnreadNews } from '../../shared/data/news.js?v=521ab50e1f2b';
import { hasPot } from '../../shared/data/alchemy.js?v=521ab50e1f2b';
import { alchemyUI } from './alchemy.js?v=521ab50e1f2b';
import { renderMiniMap, openWorldMap } from './menu.js?v=521ab50e1f2b';
import { makeCanvas } from '../render/pixel.js?v=521ab50e1f2b';
import { ClockBadge } from './clock.js?v=521ab50e1f2b';
import { powderLabel } from '../../shared/data/friend-powder.js?v=521ab50e1f2b';
import { auraLabel } from '../../shared/data/abilities-field27.js?v=521ab50e1f2b';

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
  // 第35回: 短い 職業名（モンスターは なし。shared/job-label.js）
  const jb = (to, x) => { to[to.length - 1].jb = x && !x.species && JOBS[x.job] ? jobShort(x.job, x) : ''; };
  const st = computeStats(c);
  add(people, c.name, c.level, c.hp, st.maxHp, c.mp, st.maxMp, '', false, true, 'self');
  jb(people, c);
  for (const m of p?.members || []) if (m.sid !== g.sid) { add(people, m.name, m.level, m.hp, m.maxHp, m.mp, m.maxMp, '家族', m.away, true); jb(people, m); }
  for (const s of p?.supports || []) { add(sups, s.name, s.level, s.hp, s.maxHp, s.mp, s.maxMp, s.family ? '家族サポート' : s.species ? 'モンスター' : '仲間', false, false, s.key); jb(sups, s); }
  for (const gu of p?.guests || []) { add(guests, gu.name, gu.level, gu.hp, gu.maxHp, gu.mp ?? 0, gu.maxMp || 1, 'ゲスト'); jb(guests, gu); }
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
    // 仲間の粉の のこり（ちずの 上に 小さく。data/friend-powder.js）
    this.powder = el('div', { class: 'hud-powder', hidden: true });
    // 魔物よけ（トヘロス・聖水）・魔物よせ（マモノヨセ・笛）の のこり（仲間の粉の 下。data/abilities-field27.js）
    this.aura = el('div', { class: 'hud-powder hud-aura', hidden: true });
    this.mapBox.append(this.mini, this.clock.el, this.powder, this.aura);
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
      const pw = powderLabel(this.game.me);
      if (this.powder.textContent !== pw) this.powder.textContent = pw;
      this.powder.hidden = !pw;
      const au = this.game.me?.aura;
      const al = auraLabel(au, Date.now() + (this.game.timeOffset || 0));
      if (this.aura.textContent !== al) this.aura.textContent = al;
      this.aura.hidden = !al;
      this.aura.classList.toggle('lure', au?.kind === 'lure');
      this.aura.style.top = pw ? `${this.powder.offsetHeight + 4}px` : '';
      // 第35回: まだ 読んでいない お知らせが あると メニューボタンに ●（data/news.js）
      this.btns.firstChild?.classList.toggle('has-new', hasUnreadNews(this.game.me));
      this.updatePotBtn();
    }
    const f = this.game.field;
    if (!f.map) return;
    const name = f.areaName();
    if (name !== this.lastArea) {
      this.lastArea = name;
      this.area.textContent = name;
      this.placeArea();
      this.area.classList.add('show');
      clearTimeout(this.areaT);
      this.areaT = setTimeout(() => this.area.classList.remove('show'), 2800);
    }
  }

  // 第35回: れん金がまの ボタン（大鳥・竜の ボタンと おなじ 列。持っている 人だけ。ui/alchemy.js）
  // はじめて いる ときに 作る（sky.js の ボタンの 下に ならぶ）
  updatePotBtn() {
    const g = this.game;
    const on = g.state === 'field' && hasPot(g.me);
    if (!on && !this.potBtn) return;
    if (!this.potBtn) {
      this.potBtn = el('button', { class: 'win hud-btn hud-pot', text: 'れん金', onclick: () => this.openPot() });
      this.btns.append(this.potBtn);
    }
    this.potBtn.hidden = !on;
  }

  openPot() {
    const g = this.game;
    if (g.state !== 'field' || g.busy || g.menuOpen || !hasPot(g.me)) return;
    g.audio.sfx('confirm');
    // 開いている 間は ほかの まど（「いっしょに乗る？」など）を 出さない
    g.menuOpen = true;
    alchemyUI(g).finally(() => { g.menuOpen = false; });
  }

  // 場所の なまえは 仲間の まどと かさならない ように（人数が 多い とき・たての 画面では 下へ ずらす）
  placeArea() {
    this.area.style.top = '';
    const pr = this.party.getBoundingClientRect();
    const ar = this.area.getBoundingClientRect();
    if (!pr.height || !ar.width) return;
    if (ar.left < pr.right && ar.right > pr.left && ar.top < pr.bottom) {
      const top = this.root.getBoundingClientRect().top;
      this.area.style.top = `${Math.round(pr.bottom - top + 6)}px`;
    }
  }

  renderParty() {
    const g = this.game;
    if (!g.me) return;
    this.party.innerHTML = '';
    // 家族と いっしょ（マルチ）の ときは、人が 動かしている キャラの 名前を 黄緑に。HP が へると オレンジ・赤
    const multi = (g.party?.members?.length || 1) >= 2;
    const rows = partyRows(g);
    // 5人の ときは 小さめに（フィールドが かくれない ように）
    this.party.classList.toggle('many', rows.length >= 5);
    for (const m of rows) {
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
