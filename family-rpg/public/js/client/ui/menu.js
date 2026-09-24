// フィールドの メニュー
import { el, ListMenu, toast, confirmBox, bar } from './dom.js';
import { ITEMS, SLOTS, SLOT_NAMES } from '../../shared/data/items.js';
import { ABILITIES } from '../../shared/data/abilities.js';
import { JOBS, JOB_ORDER, jobExpForLevel } from '../../shared/data/jobs.js';
import { computeStats, learnedAbilities, canEquip, mpCost, penaltyFor, expForLevel, comboUnlocked } from '../../shared/stats.js';
import { TACTICS } from '../../shared/ai.js';
import { PLACES } from '../../shared/maps/overworld.js';
import { MAPS, tileAt } from '../../shared/maps/index.js';
import { T } from '../../shared/tiles.js';
import { itemDetail, abilityDetail, equipDiff, diffText } from './info.js';
import { makeCanvas, ctxOf } from '../render/pixel.js';

const MAIN = [
  { label: 'どうぐ', value: 'items' },
  { label: 'じゅもん', value: 'skills' },
  { label: 'そうび', value: 'equip' },
  { label: 'つよさ', value: 'status' },
  { label: 'なかま', value: 'party' },
  { label: 'さくせん', value: 'tactics' },
  { label: 'マップ', value: 'map' },
  { label: 'クエスト', value: 'quest' },
  { label: 'せってい', value: 'settings' },
  { label: 'おわる', value: 'quit' },
];

export class FieldMenu {
  constructor(game) {
    this.game = game;
  }

  get sfx() { return (x) => this.game.audio.sfx(x); }

  open() {
    const g = this.game;
    if (this.root) return;
    g.menuOpen = true;
    // そとを タップしても とじる
    this.backdrop = el('div', { class: 'modal-back', onclick: () => this.closeByUser() });
    this.root = el('div', { class: 'panel fmenu-panel' });
    const head = el('div', { class: 'win fm-head' });
    this.headL = el('span', { class: 'gold' });
    this.headR = el('span', { class: 'fm-stat' });
    const closeBtn = el('button', { class: 'btn closebtn', text: '✕ とじる', 'aria-label': 'メニューを とじる', onclick: () => this.closeByUser() });
    head.append(this.headL, this.headR, closeBtn);
    this.side = el('div', { class: 'win side' });
    this.main = el('div', { class: 'win main scroll' });
    this.root.append(head, el('div', { class: 'fmenu' }, this.side, this.main));
    document.getElementById('ui').append(this.backdrop, this.root);
    this.updateHead();
    this.menu = new ListMenu(g.input, {
      items: MAIN,
      sound: this.sfx,
      back: null,
      onMove: (it) => this.preview(it.value),
      onSelect: (it) => this.select(it.value),
      onCancel: () => this.close(),
    });
    this.side.append(this.menu.root);
    this.menu.focus();
  }

  updateHead() {
    const c = this.game.me;
    const st = computeStats(c);
    this.headL.textContent = `${c.name}　${JOBS[c.job].name} Lv${c.level}`;
    this.headR.textContent = `HP ${c.hp}/${st.maxHp}　MP ${c.mp}/${st.maxMp}　${c.gold}G`;
  }

  close() {
    this.sub?.blur();
    this.menu?.blur();
    this.root?.remove();
    this.backdrop?.remove();
    this.root = null;
    this.backdrop = null;
    this.game.menuOpen = false;
  }

  // ✕ボタン・そとを タップ（えらんでいる とちゅうの ウィンドウが あれば そちらが さき）
  closeByUser() {
    if (this.popupOpen) return;
    this.game.audio.sfx('cancel');
    this.close();
  }

  refresh() {
    if (!this.root) return;
    this.updateHead();
    if (this.current && !this.sub?.active) this.preview(this.current);
  }

  back() {
    this.sub?.blur();
    this.sub = null;
    this.menu.focus();
    this.preview(this.current);
  }

  preview(v) {
    this.current = v;
    this.main.innerHTML = '';
    const g = this.game;
    switch (v) {
      case 'items': this.main.append(this.itemsList(false)); break;
      case 'skills': this.main.append(this.skillsView(false)); break;
      case 'equip': this.main.append(this.equipView(false)); break;
      case 'status': this.main.append(this.statusView()); break;
      case 'party': this.main.append(this.partyView(false)); break;
      case 'tactics': this.main.append(this.tacticsView(false)); break;
      case 'map': this.main.append(el('div', { class: 'muted', text: 'たんけんした ばしょの ちずを みる。（Mキーでも ひらけるよ）' })); break;
      case 'quest': this.main.append(this.questView()); break;
      case 'settings': this.main.append(this.settingsView(false)); break;
      case 'quit': this.main.append(el('div', { class: 'muted', text: g.net.mode === 'offline' ? 'セーブして タイトルに もどる。（このブラウザに セーブされます）' : 'セーブして タイトルに もどる。（家族サーバーに セーブされます）' })); break;
      default:
    }
  }

  select(v) {
    const g = this.game;
    switch (v) {
      case 'items': return this.focusSub(this.itemsList(true));
      case 'skills': return this.focusSub(this.skillsView(true));
      case 'equip': return this.focusSub(this.equipView(true));
      case 'party': return this.focusSub(this.partyView(true));
      case 'tactics': return this.focusSub(this.tacticsView(true));
      case 'settings': return this.focusSub(this.settingsView(true));
      case 'map':
        this.close();
        return openWorldMap(g);
      case 'quit':
        this.menu.blur();
        return confirmBox(g.input, 'セーブして タイトルに もどりますか？', 'はい', 'いいえ', this.sfx).then((ok) => {
          if (ok) {
            this.close();
            g.quitToTitle();
          } else this.menu.focus();
        });
      default:
    }
  }

  focusSub(node) {
    this.main.innerHTML = '';
    this.main.append(node);
    if (this.sub) {
      this.menu.blur();
      this.sub.focus();
    }
  }

  mkSub(opts) {
    this.sub = new ListMenu(this.game.input, { sound: this.sfx, onCancel: () => this.back(), ...opts });
    return this.sub;
  }

  // ───── どうぐ ─────
  itemsList(active) {
    const g = this.game;
    const c = g.me;
    const box = el('div');
    const detail = el('div', { class: 'detail' });
    const items = c.items.map((e) => {
      const it = ITEMS[e.id];
      return { label: `${it.name}`, right: `×${e.n}`, value: e.id };
    });
    for (const k of c.keyItems) items.push({ html: `${ITEMS[k].name}<span class="tag gold">だいじ</span>`, value: k, key: true });
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: 'なにも もっていない。' }));
      if (active) setTimeout(() => this.back(), 600);
      return box;
    }
    if (!active) {
      box.append(el('div', { class: 'small', text: items.map((i) => i.label || ITEMS[i.value].name).join('、') }));
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = it ? itemDetail(it.value) : ''; },
      onSelect: (it) => this.itemAction(it),
    });
    box.append(m.root, detail);
    return box;
  }

  async itemAction(entry) {
    const g = this.game;
    const it = ITEMS[entry.value];
    if (entry.key || it.type === 'key') return;
    const acts = [];
    if (it.type === 'use' && it.field) acts.push({ label: 'つかう', value: 'use' });
    if (['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) acts.push({ label: 'そうびする', value: 'equip', disabled: !canEquip(g.me.job, entry.value) });
    acts.push({ label: 'すてる', value: 'drop' }, { label: 'やめる', value: 'cancel' });
    this.sub.blur();
    const act = await this.pick(`${it.name}を どうする？`, acts);
    if (act === 'use') {
      if (it.effect.type === 'warp') {
        const places = Object.entries(PLACES).filter(([id]) => g.me.visited?.[id] && id !== 'shrine').map(([id, p]) => ({ label: p.name, value: id }));
        const place = await this.pick('どこへ とぶ？', [...places, { label: 'やめる', value: null }]);
        if (place) {
          g.net.send({ t: 'menu', action: 'useItem', id: entry.value, place });
          this.close();
          return;
        }
      } else if (it.target === 'self') {
        g.net.send({ t: 'menu', action: 'useItem', id: entry.value, ref: 'self' });
      } else {
        const ref = await this.pickTarget(`だれに つかう？`, it.target === 'deadAlly');
        if (ref) g.net.send({ t: 'menu', action: 'useItem', id: entry.value, ref });
      }
    } else if (act === 'equip') {
      g.net.send({ t: 'menu', action: 'equip', id: entry.value });
    } else if (act === 'drop') {
      if (await confirmBox(g.input, `${it.name}を すてますか？`, 'すてる', 'やめる', this.sfx)) g.net.send({ t: 'menu', action: 'discard', id: entry.value, n: 1 });
    }
    setTimeout(() => { if (this.root) this.focusSub(this.itemsList(true)); }, 150);
  }

  pick(title, items) {
    const g = this.game;
    return new Promise((resolve) => {
      const hasCancel = items.some((i) => i.value === null || i.value === 'cancel');
      const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => { this.sfx('cancel'); done(null); } });
      const box = el('div', { class: 'win panel center-panel', style: { width: 'min(86vw, 380px)', zIndex: 5 } }, el('div', { class: 'small gold', text: title }));
      const m = new ListMenu(g.input, {
        items,
        sound: this.sfx,
        back: hasCancel ? null : 'やめる',
        onSelect: (it) => done(it.value),
        onCancel: () => done(null),
      });
      box.append(m.root);
      document.getElementById('ui').append(back, box);
      this.popupOpen = true;
      m.focus();
      const done = (v) => {
        m.blur();
        back.remove();
        box.remove();
        this.popupOpen = false;
        resolve(v);
      };
    });
  }

  partyRefs(dead = false) {
    const g = this.game;
    const p = g.party;
    const out = [];
    const st = computeStats(g.me);
    const fmt = (name, hp, maxHp, mp, maxMp) => `${name}　HP ${hp}/${maxHp}　MP ${mp}/${maxMp}`;
    out.push({ label: fmt(g.me.name, g.me.hp, st.maxHp, g.me.mp, st.maxMp), value: 'self', hp: g.me.hp });
    for (const m of p?.members || []) if (m.sid !== g.sid) out.push({ label: fmt(m.name, m.hp, m.maxHp, m.mp, m.maxMp), value: 'sid:' + m.sid, hp: m.hp });
    for (const s of p?.supports || []) out.push({ label: fmt(s.name, s.hp, s.maxHp, s.mp, s.maxMp), value: 'sup:' + s.key, hp: s.hp });
    for (const gu of p?.guests || []) out.push({ label: `${gu.name}　HP ${gu.hp}/${gu.maxHp}`, value: 'guest:' + gu.id, hp: gu.hp });
    return out.map((o) => ({ ...o, disabled: dead ? o.hp > 0 : o.hp <= 0 }));
  }

  pickTarget(title, dead = false) {
    return this.pick(title, [...this.partyRefs(dead), { label: 'やめる', value: null }]);
  }

  // ───── じゅもん・とくぎ ─────
  skillsView(active) {
    const g = this.game;
    const c = g.me;
    const box = el('div');
    const learned = learnedAbilities(c);
    const detail = el('div', { class: 'detail' });
    const tabs = el('div', { class: 'tabs' });
    let mode = this.skillMode || 'list';
    const tabBtn = (id, label) => el('button', { class: `btn ${mode === id ? 'sel' : ''}`, text: label, onclick: () => { this.skillMode = id; this.focusSub(this.skillsView(true)); } });
    tabs.append(tabBtn('list', 'おぼえた わざ'), tabBtn('combo', '掛け合わせ いちらん'));
    box.append(tabs);
    if (mode === 'combo') {
      const known = new Set(learned);
      for (const [id, a] of Object.entries(ABILITIES)) {
        if (a.kind !== 'combo') continue;
        const ok = known.has(id);
        const reqs = a.requires.map((r) => (known.has(r) ? ABILITIES[r].name : '？？？')).join(' ＋ ');
        const jl = a.reqJobLv ? `（${Object.entries(a.reqJobLv).map(([j, l]) => `${JOBS[j].name}Lv${l}`).join('')}）` : '';
        box.append(el('div', { class: `combo-row ${ok ? '' : 'locked'}` },
          el('span', { class: 'nm', text: ok ? a.name : '？？？？' }),
          el('div', { class: 'small', text: `${reqs}${jl}` }),
          ok ? el('div', { class: 'small muted', text: a.desc }) : null));
      }
      box.append(el('div', { class: 'detail', text: 'ちがう しょくぎょうで わざを おぼえると ひらめく。神殿の「ひらめきの けんじゃ」に ヒントを きいてみよう。\nみんなで つづけて こうげきすると「れんけい」、ほのお＋こおり などは「合体」に なるよ！' }));
      if (active) {
        this.mkSub({ items: [{ label: 'もどる', value: 'back' }], onSelect: () => this.back() });
        box.append(this.sub.root);
      }
      return box;
    }
    const items = learned.map((id) => {
      const a = ABILITIES[id];
      const p = penaltyFor(c, id);
      return {
        html: `${a.name}${a.kind === 'combo' ? '<span class="tag gold">掛け合わせ</span>' : ''}${p.penalized ? '<span class="tag warn">他</span>' : ''}`,
        right: a.effect.type === 'mahouken' ? '' : `MP${mpCost(c, id)}`,
        rightCls: p.penalized ? 'pen' : '',
        value: id,
        disabled: active && !a.field,
      };
    });
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: 'まだ なにも おぼえていない。' }));
      return box;
    }
    if (!active) {
      box.append(el('div', { class: 'small', text: items.map((i) => ABILITIES[i.value].name).join('、') }));
      box.append(el('div', { class: 'detail', text: '「他」は いまの しょくぎょう いがいで おぼえた わざ。MPが ふえたり、いりょくが さがったり する。' }));
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = it ? abilityDetail(it.value, c) : ''; },
      onSelect: async (it) => {
        const a = ABILITIES[it.value];
        if (!a.field) return;
        this.sub.blur();
        let ref = 'self';
        if (a.target !== 'allies' && a.target !== 'self') ref = await this.pickTarget(`だれに ${a.name}？`, a.target === 'deadAlly');
        if (ref) g.net.send({ t: 'menu', action: 'cast', id: it.value, ref });
        setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true)); }, 200);
      },
    });
    box.append(el('div', { class: 'small muted', text: 'フィールドで つかえる わざ だけ えらべるよ' }), m.root, detail);
    return box;
  }

  // ───── そうび ─────
  equipView(active) {
    const g = this.game;
    const c = g.me;
    const box = el('div');
    const detail = el('div', { class: 'detail' });
    const st = computeStats(c);
    const stats = el('div', { class: 'small', text: `こうげき ${st.atk}　しゅび ${st.dfn}　すばやさ ${st.agi}　まりょく ${st.mag}　かいふく ${st.heal}` });
    const items = SLOTS.map((s) => ({ label: `${SLOT_NAMES[s]}：${c.equip[s] ? ITEMS[c.equip[s]].name : 'なし'}`, value: s }));
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(stats);
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = c.equip[it.value] ? itemDetail(c.equip[it.value]) : ''; },
      onSelect: async (it) => {
        const slot = it.value;
        const cands = c.items.filter((e) => ITEMS[e.id]?.type === slot);
        const opts = cands.map((e) => ({
          label: `${ITEMS[e.id].name}　${canEquip(c.job, e.id) ? diffText(equipDiff(c, e.id)) : '（そうびできない）'}`,
          value: e.id,
          disabled: !canEquip(c.job, e.id),
        }));
        if (c.equip[slot]) opts.push({ label: 'はずす', value: '__off' });
        opts.push({ label: 'やめる', value: null });
        this.sub.blur();
        const pick = await this.pick(`${SLOT_NAMES[slot]}を えらぶ`, opts);
        if (pick === '__off') g.net.send({ t: 'menu', action: 'unequip', slot });
        else if (pick) g.net.send({ t: 'menu', action: 'equip', id: pick });
        setTimeout(() => { if (this.root) this.focusSub(this.equipView(true)); }, 200);
      },
    });
    box.append(m.root, stats, detail);
    return box;
  }

  // ───── つよさ ─────
  statusView() {
    const c = this.game.me;
    const st = computeStats(c);
    const box = el('div');
    const next = expForLevel(c.level + 1) - c.exp;
    box.append(el('h3', { text: `${c.name}　${JOBS[c.job].name}` }));
    const kv = (k, v, cls = '') => el('div', { class: 'kv' }, el('span', { class: 'k', text: k }), el('span', { class: cls, text: String(v) }));
    box.append(el('div', { class: 'twocol' },
      kv('レベル', c.level), kv('つぎの レベルまで', next),
      kv('HP', `${c.hp}/${st.maxHp}`), kv('MP', `${c.mp}/${st.maxMp}`),
      kv('ちから', st.str), kv('みのまもり', st.def),
      kv('すばやさ', st.agi), kv('こうげき魔力', st.mag),
      kv('かいふく魔力', st.heal), kv('ゴールド', c.gold),
      kv('こうげき力', st.atk, 'gold'), kv('しゅび力', st.dfn, 'gold')));
    const jobs = el('div', { style: { marginTop: '0.6em' } }, el('div', { class: 'gold small', text: 'しょくぎょう レベル' }));
    for (const j of JOB_ORDER) {
      const info = c.jobs[j];
      if (!info) continue;
      const nextJ = jobExpForLevel(info.lv + 1) - info.exp;
      jobs.append(el('div', { class: 'kv small' }, el('span', { class: j === c.job ? 'good' : '', text: JOBS[j].name }), el('span', { text: `Lv${info.lv}（つぎまで ${Math.max(0, nextJ)}）` })));
    }
    box.append(jobs);
    const speedNote = el('div', { class: 'detail', text: `すばやさ ${st.agi} … たたかいで やく ${(128000 / (st.agi + 12) / 1000).toFixed(1)}びょうごとに じゅんばんが くる` });
    box.append(speedNote);
    return box;
  }

  // ───── なかま ─────
  partyView(active) {
    const g = this.game;
    const p = g.party;
    const box = el('div');
    const iAmLeader = p?.leader === g.sid;
    const rows = [];
    for (const m of p?.members || []) rows.push(el('div', { class: 'kv' }, el('span', { class: m.sid === p.leader ? 'gold' : '', text: `${m.sid === p.leader ? '★' : '　'}${m.name}（${JOBS[m.job].name} Lv${m.level}）` }), el('span', { class: 'small', text: `HP ${m.hp}/${m.maxHp}` })));
    for (const s of p?.supports || []) rows.push(el('div', { class: 'kv' }, el('span', { text: `　${s.name}（${JOBS[s.job].name} Lv${s.level}）` }), el('span', { class: 'small muted', text: s.family ? 'かぞく サポート' : 'サポート' })));
    for (const gu of p?.guests || []) rows.push(el('div', { class: 'kv' }, el('span', { text: `　${gu.name}` }), el('span', { class: 'small muted', text: 'ゲスト' })));
    box.append(...rows);
    if (!active) {
      box.append(el('div', { class: 'detail', text: 'あそんでいる かぞくを パーティーに さそえるよ。サポートなかまは 酒場で やとえる。\nちかくに いる なかまは いっしょに たたかう。はなれている なかまも、たたかっている ところへ かけつけると とちゅうから さんか できるよ。' }));
      return box;
    }
    const acts = [];
    const others = (g.players || []).filter((x) => x.sid !== g.sid && x.partyId !== p?.id && !x.away);
    if (iAmLeader) for (const o of others) acts.push({ label: `${o.name}を さそう`, value: { a: 'invite', sid: o.sid } });
    if (iAmLeader) for (const s of p?.supports || []) acts.push({ label: `${s.name}と わかれる`, value: { a: 'dismiss', key: s.key } });
    if (iAmLeader) for (const m of p?.members || []) if (m.sid !== g.sid) acts.push({ label: `${m.name}を リーダーに する`, value: { a: 'leader', sid: m.sid } });
    if (!iAmLeader && p) acts.push({ label: g.follow ? 'リーダーに ついていくのを やめる' : 'リーダーに ついていく（じどう）', value: { a: 'follow' } });
    if ((p?.members.length || 1) > 1) acts.push({ label: 'パーティーを ぬける', value: { a: 'leave' } });
    if (!acts.length) acts.push({ label: '（いま あそんでいる かぞくは いないみたい）', value: null, disabled: true });
    const m = this.mkSub({
      items: acts,
      onSelect: (it) => {
        const v = it.value;
        if (!v) return;
        if (v.a === 'follow') {
          g.follow = !g.follow;
          toast(g.follow ? 'リーダーに ついていきます' : 'じぶんで あるきます');
        } else g.net.send({ t: 'party', action: v.a, sid: v.sid, key: v.key });
        setTimeout(() => { if (this.root) this.focusSub(this.partyView(true)); }, 250);
      },
    });
    box.append(el('div', { style: { marginTop: '0.5em' } }, m.root));
    return box;
  }

  // ───── さくせん ─────
  tacticsView(active) {
    const g = this.game;
    const c = g.me;
    const box = el('div');
    const bs = c.battleSettings || {};
    const tname = (t) => TACTICS[t]?.name || t;
    const items = [{ label: `${c.name}（オートの とき）：${tname(c.tactics || 'balanced')}`, value: { key: 'self' } }];
    for (const s of g.party?.supports || []) items.push({ label: `${s.name}：${tname(s.tactics)}`, value: { key: s.key } });
    items.push({ label: `たたかいの はじめから オート：${bs.auto ? 'ON' : 'OFF'}`, value: { toggle: 'auto' } });
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', { class: 'detail', text: 'サポートなかまや オートの ときの たたかいかたを きめる。' }));
      return box;
    }
    const m = this.mkSub({
      items,
      onSelect: async (it) => {
        const v = it.value;
        if (v.toggle === 'auto') {
          g.net.send({ t: 'menu', action: 'settings', speed: bs.speed || 1, wait: !!bs.wait, auto: !bs.auto });
        } else {
          this.sub.blur();
          const t = await this.pick('さくせんを えらぶ', Object.entries(TACTICS).map(([k, x]) => ({ label: x.name, value: k })));
          if (t) g.net.send({ t: 'menu', action: 'tactics', key: v.key, tactics: t, label: TACTICS[t].name });
        }
        setTimeout(() => { if (this.root) this.focusSub(this.tacticsView(true)); }, 250);
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'バッチリがんばれ: バランスよく / ガンガンいこうぜ: こうげき ちゅうしん / いのちだいじに: かいふく ちゅうしん / じゅもんせつやく: MPを つかわない' }));
    return box;
  }

  // ───── クエスト ─────
  questView() {
    const c = this.game.me;
    const box = el('div');
    box.append(el('h3', { text: 'いまの もくひょう' }), el('div', { text: c.objective || '（とくに なし）' }));
    const q = [];
    const f = (k) => !!c.flags[k];
    if (f('q_mike_start')) q.push(['まいごの ねこ ミケ', f('q_mike_done') ? 'クリア！' : f('q_mike_found') ? 'リリに ほうこくしよう' : 'ほしみの丘で さがそう']);
    if (f('q_jelly_start')) q.push(['コックの とくせいゼリー', f('q_jelly_done') ? 'クリア！' : `ぷるりんゼリー ${Math.min(3, (c.items.find((i) => i.id === 'jelly')?.n) || 0)}/3`]);
    if (f('q_wolf_start')) q.push(['ウルフ たいじ', f('q_wolf_done') ? 'クリア！' : `${Math.max(0, (c.kills?.wolf || 0) - (c.quests?.wolfBase || 0))}/5ひき`]);
    box.append(el('h3', { style: { marginTop: '0.6em' }, text: 'たのまれごと' }));
    if (!q.length) box.append(el('div', { class: 'muted small', text: 'まだ ない。町の 人に はなしかけてみよう。' }));
    for (const [n, s] of q) box.append(el('div', { class: 'kv' }, el('span', { text: n }), el('span', { class: s === 'クリア！' ? 'good' : 'muted', text: s })));
    const chests = Object.keys(c.chests || {}).length;
    const total = Object.values(MAPS).reduce((s, m) => s + m.chests.length, 0);
    box.append(el('div', { class: 'detail', text: `たからばこ ${chests}/${total}　たおした まもの ${Object.values(c.kills || {}).reduce((s, x) => s + x, 0)}ひき` }));
    return box;
  }

  // ───── せってい ─────
  settingsView(active) {
    const g = this.game;
    const c = g.me;
    const bs = c.battleSettings || { speed: 1, wait: false };
    const sp = { 0.75: 'ゆっくり', 1: 'ふつう', 1.35: 'はやい' }[bs.speed || 1];
    const vol = (v) => '■'.repeat(Math.round(v * 5)) + '□'.repeat(5 - Math.round(v * 5));
    const items = [
      { label: `たたかいの はやさ：${sp}`, value: 'speed' },
      { label: `えらぶ あいだ とまる（ウェイト）：${bs.wait ? 'ON' : 'OFF'}`, value: 'wait' },
      { label: `おんがく：${vol(g.audio.musicVol)}`, value: 'music' },
      { label: `こうかおん：${vol(g.audio.sfxVol)}`, value: 'sfx' },
      { label: `もじの おおきさ：${document.body.classList.contains('big-text') ? 'おおきい' : 'ふつう'}`, value: 'text' },
    ];
    if (g.field.constructor.webgl2()) items.unshift({ label: `がめん：${g.field.view === '3d' ? '2.5D（たちたい）' : '2D（ドット）'}`, value: 'view' });
    if (g.input.touch) {
      items.push({ label: `あそんでいる あいだ がめんを けさない：${g.awakeOn ? 'ON' : 'OFF'}`, value: 'awake' });
      if (navigator.audioSession) items.push({ label: `マナーモードでも おとを だす：${g.audio.silentPlay ? 'ON' : 'OFF'}`, value: 'silent' });
    }
    const box = el('div');
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', {
        class: 'detail',
        text: g.input.touch
          ? 'そうさ: ひだりしたの スティックで いどう、Aで はなす・けってい、Bで メニュー。メニューは みぎうえの「✕ とじる」か、そとを タップで とじる'
          : 'そうさ: やじるし/WASDで いどう、Z/Enterで はなす・けってい、X/Escで メニュー・もどる、Mで マップ、Cで チャット',
      }));
      return box;
    }
    const m = this.mkSub({
      items,
      onSelect: (it) => {
        if (it.value === 'speed') {
          const order = [0.75, 1, 1.35];
          const next = order[(order.indexOf(bs.speed || 1) + 1) % 3];
          g.net.send({ t: 'menu', action: 'settings', speed: next, wait: !!bs.wait, auto: !!bs.auto });
        } else if (it.value === 'wait') {
          g.net.send({ t: 'menu', action: 'settings', speed: bs.speed || 1, wait: !bs.wait, auto: !!bs.auto });
        } else if (it.value === 'music') {
          g.audio.setVolumes((Math.round(g.audio.musicVol * 5) + 1) % 6 / 5, g.audio.sfxVol);
        } else if (it.value === 'sfx') {
          g.audio.setVolumes(g.audio.musicVol, (Math.round(g.audio.sfxVol * 5) + 1) % 6 / 5);
          g.audio.sfx('confirm');
        } else if (it.value === 'text') {
          document.body.classList.toggle('big-text');
          try { localStorage.setItem('kizuna_bigtext', document.body.classList.contains('big-text') ? '1' : ''); } catch { /* */ }
        } else if (it.value === 'view') {
          g.field.setView(g.field.view === '3d' ? '2d' : '3d', true).then((v) => {
            toast(v === '3d' ? 'がめんを 2.5D（たちたい）に しました' : 'がめんを 2D（ドット）に しました');
            if (this.root) this.focusSub(this.settingsView(true));
          });
          return;
        } else if (it.value === 'awake') {
          g.awakeOn = !g.awakeOn;
        } else if (it.value === 'silent') {
          g.audio.silentPlay = !g.audio.silentPlay;
          g.audio.sfx('confirm');
        }
        setTimeout(() => { if (this.root) this.focusSub(this.settingsView(true)); }, 200);
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'ウェイトを ON に すると、コマンドを えらぶ あいだ たたかいの じかんが とまるよ（ちいさい こどもに おすすめ）' + (g.input.touch ? '\nがめんが きえると 家族との つうしんが とぎれやすいので「がめんを けさない」は ON が おすすめ' : '') }));
    return box;
  }
}

// ───────────── ぜんたいマップ ─────────────
const MAP_COLORS = {
  [T.GRASS]: '#5bab4b', [T.FLOWERS]: '#79c663', [T.TALLGRASS]: '#4a953f', [T.DIRT]: '#caa367', [T.SAND]: '#ead79c', [T.WATER]: '#3c80d6',
  [T.DEEP]: '#2a58a8', [T.TREE]: '#2f7a36', [T.PINE]: '#2a6a3a', [T.MOUNTAIN]: '#8f8270', [T.HILL]: '#6cb558', [T.ROCK]: '#8f8270',
  [T.BRIDGE_H]: '#a8733e', [T.BROKEN_BRIDGE]: '#3c80d6', [T.SWAMP]: '#6a4a7a', [T.FOREST_FLOOR]: '#3f7d3a', [T.STEPPING]: '#8a9ab8',
  [T.CAVE_FLOOR]: '#6a5a4a', [T.CAVE_WALL]: '#1d1714', [T.CAVE_WATER]: '#1f3f6e', [T.BOSS_FLOOR]: '#5a4870',
};

export function renderMiniMap(game, canvas, full = false) {
  const f = game.field;
  const m = f.map;
  if (!m) return;
  const ctx = ctxOf(canvas);
  const pxPer = full ? Math.max(2, Math.min(5, Math.floor(Math.min(innerWidth * 0.86 / m.w, innerHeight * 0.72 / m.h)))) : 2;
  let x0 = 0, y0 = 0, w = m.w, h = m.h;
  if (!full) {
    w = Math.floor(canvas.width / pxPer);
    h = Math.floor(canvas.height / pxPer);
    x0 = Math.floor(f.me.x - w / 2);
    y0 = Math.floor(f.me.y - h / 2);
  } else {
    canvas.width = m.w * pxPer;
    canvas.height = m.h * pxPer;
  }
  ctx.fillStyle = '#0a0b1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = x0 + x, my = y0 + y;
      if (mx < 0 || my < 0 || mx >= m.w || my >= m.h) continue;
      if (!f.isExplored(mx, my)) continue;
      const t = tileAt(m, mx, my);
      ctx.fillStyle = MAP_COLORS[t] || (t >= 30 && t < 70 ? '#c8bfae' : '#555');
      ctx.fillRect(x * pxPer, y * pxPer, pxPer, pxPer);
    }
  }
  const dot = (x, y, c, r = 2) => {
    ctx.fillStyle = '#000';
    ctx.fillRect((x - x0) * pxPer - r - 1, (y - y0) * pxPer - r - 1, r * 2 + 2, r * 2 + 2);
    ctx.fillStyle = c;
    ctx.fillRect((x - x0) * pxPer - r, (y - y0) * pxPer - r, r * 2, r * 2);
  };
  if (m.id === 'overworld') {
    for (const [id, p] of Object.entries(PLACES)) {
      if (!f.isExplored(p.x + Math.floor(p.w / 2), p.y + Math.floor(p.h / 2))) continue;
      if (full) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, pxPer * 4)}px KizunaDot, sans-serif`;
        ctx.fillText(p.name, (p.x - x0) * pxPer, (p.y - y0) * pxPer - 3);
      }
    }
  }
  for (const o of f.others.values()) dot(o.x, o.y, o.partyId === game.party?.id ? '#ffd66b' : '#8fd0ff', full ? 3 : 2);
  const blink = Math.floor(performance.now() / 300) % 2;
  dot(f.me.x, f.me.y, blink ? '#ff5a5a' : '#ffffff', full ? 3 : 2);
}

export function openWorldMap(game) {
  if (document.querySelector('.worldmap')) return;
  const back = el('div', { class: 'modal-back' });
  const box = el('div', { class: 'win panel center-panel worldmap', style: { width: 'auto', maxWidth: '96vw' } });
  const cv = makeCanvas(10, 10);
  const head = el('div', { class: 'wm-head' }, el('span', { class: 'gold', text: game.field.map.name }),
    el('button', { class: 'btn closebtn', text: '✕ とじる', 'aria-label': 'ちずを とじる' }));
  box.append(head, cv, el('div', { class: 'small muted', text: `あかい てん: じぶん　きいろ: パーティー　あお: かぞく　（${game.input.touch ? 'タップで とじる' : 'B/Xで とじる'}）` }));
  document.getElementById('ui').append(back, box);
  renderMiniMap(game, cv, true);
  const iv = setInterval(() => renderMiniMap(game, cv, true), 400);
  const h = { onNav: (a) => { if (a === 'b' || a === 'a' || a === 'map') close(); } };
  const close = () => {
    clearInterval(iv);
    game.input.pop(h);
    back.remove();
    box.remove();
    game.audio.sfx('cancel');
  };
  box.addEventListener('click', close);
  back.addEventListener('click', close);
  game.input.push(h);
}
