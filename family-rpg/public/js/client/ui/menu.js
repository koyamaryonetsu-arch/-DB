// フィールドの メニュー
import { el, ListMenu, toast, confirmBox, bar, esc } from './dom.js';
import { ITEMS, SLOTS, SLOT_NAMES } from '../../shared/data/items.js';
import { ABILITIES } from '../../shared/data/abilities.js';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, TIER_NAMES } from '../../shared/data/jobs.js';
import { computeStats, learnedAbilities, mpCost, penaltyFor, expForLevel, comboUnlocked, comboAllowed, comboJobNames, jobProgress } from '../../shared/stats.js';
import { MONSTERS } from '../../shared/data/monsters.js';
import { MONSTER_FRIENDS, RACE_NAMES, recipeHint } from '../../shared/data/companions.js';
import { TACTICS } from '../../shared/ai.js';
import { PLACES } from '../../shared/maps/overworld.js';
import { SEA_PLACES } from '../../shared/maps/ch2.js';
import { MAPS, tileAt, effectiveTile } from '../../shared/maps/index.js';
import { T } from '../../shared/tiles.js';
import { itemDetail, abilityDetail } from './info.js';
import { makeCanvas, ctxOf } from '../render/pixel.js';
import { monsterCanvas } from '../render/monsters.js';
import { mapIconCanvas, boardIconURL } from '../render/boards.js';
import { compareOne, compareTeam, whoItems } from './counter.js';
import { faceURL } from '../field.js';

const MAIN = [
  { label: '道具', value: 'items' },
  { label: '呪文', value: 'skills' },
  { label: '装備', value: 'equip' },
  { label: '強さ', value: 'status' },
  { label: '仲間', value: 'party' },
  { label: '作戦', value: 'tactics' },
  { label: '図鑑', value: 'zukan' },
  { label: 'マップ', value: 'map' },
  { label: 'クエスト', value: 'quest' },
  { label: '設定', value: 'settings' },
  { label: '終わる', value: 'quit' },
];

// ずかんの ならび: ふつうの まもの（つよさじゅん）→ はいごう だけの まもの → ボス
function zukanOrder() {
  const all = Object.keys(MONSTERS);
  const normal = all.filter((sp) => !MONSTERS[sp].boss && !MONSTERS[sp].breedOnly).sort((a, b) => (MONSTERS[a].lv || 0) - (MONSTERS[b].lv || 0));
  return [...normal, ...all.filter((sp) => MONSTERS[sp].breedOnly), ...all.filter((sp) => MONSTERS[sp].boss)];
}

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
    const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': 'メニューを閉じる', onclick: () => this.closeByUser() });
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
      case 'zukan': this.main.append(this.zukanView(false)); break;
      case 'map': this.main.append(el('div', { class: 'muted', text: '探検した場所の地図を見る。（Mキーでも開けるよ）' })); break;
      case 'quest': this.main.append(this.questView()); break;
      case 'settings': this.main.append(this.settingsView(false)); break;
      case 'quit': this.main.append(el('div', { class: 'muted', text: g.net.mode === 'offline' ? 'セーブしてタイトルにもどる。（このブラウザにセーブされます）' : 'セーブしてタイトルにもどる。（家族サーバーにセーブされます）' })); break;
      default:
    }
  }

  // じぶんの なかま（酒場の なかま・モンスター）
  myMates() {
    const g = this.game;
    return (g.party?.supports || []).filter((x) => x.owner === g.me.id && x.kind !== 'family');
  }

  // key の キャラ（じぶん か なかま）を メニューで つかえる かたちに
  charOf(who) {
    const g = this.game;
    if (!who || who === 'self') return g.me;
    const x = (g.party?.supports || []).find((m) => m.key === who && m.owner === g.me.id);
    if (!x) return null;
    return {
      key: x.key, name: x.name, level: x.level, exp: x.exp || 0, job: x.job, jobs: x.jobs || {}, equip: x.equip || {}, seeds: x.seeds || {},
      species: x.species || undefined, hp: x.hp, mp: x.mp, look: x.look, tactics: x.tactics, status: {}, companion: true,
      plus: x.plus || 0, bonus: x.bonus || undefined, inherit: x.inherit || undefined,
    };
  }

  // だれの？（なかまが いる ときだけ）
  whoView(next) {
    const g = this.game;
    const box = el('div');
    const mates = this.myMates();
    const title = { skills: 'だれの呪文？', equip: 'だれの装備？', status: 'だれの強さ？' }[next] || 'だれ？';
    const items = [{ label: `${g.me.name}（自分）`, value: 'self', face: faceURL({ look: g.me.look, job: g.me.job, eq: g.me.equip }) },
      ...mates.map((m) => ({ label: `${m.name}（${m.species ? MONSTERS[m.species]?.name : JOBS[m.job]?.name} Lv${m.level}）`, value: m.key, face: faceURL({ look: m.look, job: m.job, eq: m.equip, mon: m.species || undefined }) }))];
    const m = this.mkSub({
      items,
      onSelect: (it) => {
        this.who = it.value;
        this.sub.blur();
        this.sub = null;
        const view = next === 'skills' ? this.skillsView(true, it.value) : next === 'equip' ? this.equipView(true, it.value) : this.statusView(it.value, true);
        this.focusSub(view);
      },
    });
    box.append(el('div', { class: 'small gold', text: title }), m.root);
    return box;
  }

  select(v) {
    const g = this.game;
    if (['skills', 'equip', 'status'].includes(v) && this.myMates().length) return this.focusSub(this.whoView(v));
    switch (v) {
      case 'items': return this.focusSub(this.itemsList(true));
      case 'skills': return this.focusSub(this.skillsView(true));
      case 'equip': return this.focusSub(this.equipView(true));
      case 'party': return this.focusSub(this.partyView(true));
      case 'tactics': return this.focusSub(this.tacticsView(true));
      case 'zukan': return this.focusSub(this.zukanView(true));
      case 'settings': return this.focusSub(this.settingsView(true));
      case 'map':
        this.close();
        return openWorldMap(g);
      case 'quit':
        this.menu.blur();
        return confirmBox(g.input, 'セーブしてタイトルにもどりますか？', 'はい', 'いいえ', this.sfx).then((ok) => {
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
    for (const k of c.keyItems) items.push({ html: `${ITEMS[k].name}<span class="tag gold">大事</span>`, value: k, key: true });
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: '何も持っていない。' }));
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
    if (it.type === 'use' && it.field) acts.push({ label: '使う', value: 'use' });
    const team = ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type) ? compareTeam(g, entry.value) : null;
    if (team) acts.push({ label: '装備する', value: 'equip', disabled: !team.some((r) => r.can && !r.same) });
    acts.push({ label: '捨てる', value: 'drop' }, { label: 'やめる', value: 'cancel' });
    this.sub.blur();
    const act = await this.pick(`${it.name}をどうする？`, acts);
    if (act === 'use') {
      if (it.effect.type === 'warp') {
        const places = Object.entries({ ...PLACES, ...SEA_PLACES }).filter(([id]) => g.me.visited?.[id] && id !== 'shrine').map(([id, p]) => ({ label: p.name, value: id }));
        const place = await this.pick('どこへ飛ぶ？', [...places, { label: 'やめる', value: null }]);
        if (place) {
          g.net.send({ t: 'menu', action: 'useItem', id: entry.value, place });
          this.close();
          return;
        }
      } else if (it.target === 'self') {
        g.net.send({ t: 'menu', action: 'useItem', id: entry.value, ref: 'self' });
      } else {
        const ref = await this.pickTarget(`だれに使う？`, it.target === 'deadAlly');
        if (ref) g.net.send({ t: 'menu', action: 'useItem', id: entry.value, ref });
      }
    } else if (act === 'equip') {
      // ドラクエと おなじ:「だれが 装備する？」（みんなの 強さが どう かわるか いっしょに 出す）
      const who = team.length === 1 ? 'self'
        : await this.pick(`だれが${it.name}を装備する？`, [...whoItems(team), { label: 'やめる', value: null }], { wide: true });
      if (who) g.net.send({ t: 'menu', action: 'equip', id: entry.value, who });
    } else if (act === 'drop') {
      if (await confirmBox(g.input, `${it.name}を捨てますか？`, '捨てる', 'やめる', this.sfx)) g.net.send({ t: 'menu', action: 'discard', id: entry.value, n: 1 });
    }
    setTimeout(() => { if (this.root) this.focusSub(this.itemsList(true)); }, 150);
  }

  pick(title, items, { wide = false } = {}) {
    const g = this.game;
    return new Promise((resolve) => {
      const hasCancel = items.some((i) => i.value === null || i.value === 'cancel');
      const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => { this.sfx('cancel'); done(null); } });
      const box = el('div', { class: 'win panel center-panel', style: { width: wide ? 'min(94vw, 560px)' : 'min(86vw, 380px)', zIndex: 5, background: 'var(--win-solid)' } }, el('div', { class: 'small gold', text: title }));
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
  skillsView(active, who = 'self') {
    const g = this.game;
    const c = this.charOf(who) || g.me;
    const box = el('div');
    if (c.companion) box.append(el('div', { class: 'gold small', text: `${c.name}の技　MP ${c.mp}` }));
    const learned = learnedAbilities(c);
    const detail = el('div', { class: 'detail' });
    const tabs = el('div', { class: 'tabs' });
    let mode = this.skillMode || 'list';
    const tabBtn = (id, label) => el('button', { class: `btn ${mode === id ? 'sel' : ''}`, text: label, onclick: () => { this.skillMode = id; this.focusSub(this.skillsView(true, who)); } });
    tabs.append(tabBtn('list', '覚えた技'), tabBtn('combo', '掛け合わせ一覧'));
    box.append(tabs);
    if (mode === 'combo') {
      const known = new Set(learned);
      for (const [id, a] of Object.entries(ABILITIES)) {
        if (a.kind !== 'combo') continue;
        const ok = known.has(id);
        const reqs = a.requires.map((r) => (known.has(r) ? ABILITIES[r].name : '？？？')).join(' ＋ ');
        const jl = a.reqJobLv ? `（${Object.entries(a.reqJobLv).map(([j, l]) => `${JOBS[j].name}Lv${l}`).join('')}）` : '';
        const usable = ok && comboAllowed(c, id);
        box.append(el('div', { class: `combo-row ${ok ? '' : 'locked'}` },
          el('span', { class: 'nm', text: ok ? a.name : '？？？？' }),
          ok ? el('span', { class: `tag ${usable ? 'good' : 'warn'}`, text: usable ? '使える' : '今は使えない' }) : null,
          el('div', { class: 'small', text: `${reqs}${jl}` }),
          el('div', { class: 'small gold', text: `使える職業: ${comboJobNames(id).join('・')}（とその超級職）` }),
          ok ? el('div', { class: 'small muted', text: a.desc }) : null));
      }
      box.append(el('div', { class: 'detail', text: 'ちがう職業で技を覚えるとひらめく。使えるのは、元になった職業を合わせ持つ上級職以上だけ（例えば魔法剣は魔法戦士）。\n神殿の「ひらめきの賢者」にヒントを聞いてみよう。みんなで続けて攻撃すると「れんけい」、炎＋氷などは「合体」になるよ！' }));
      if (active) {
        this.mkSub({ items: [{ label: 'もどる', value: 'back' }], onSelect: () => this.back() });
        box.append(this.sub.root);
      }
      return box;
    }
    const items = learned.map((id) => {
      const a = ABILITIES[id];
      const p = penaltyFor(c, id);
      const locked = a.kind === 'combo' && !comboAllowed(c, id);
      return {
        html: `${a.name}${a.kind === 'combo' ? `<span class="tag ${locked ? 'muted' : 'gold'}">掛け合わせ${locked ? '（上級職で）' : ''}</span>` : ''}${p.penalized ? '<span class="tag warn">他</span>' : ''}`,
        right: a.effect.type === 'mahouken' ? '' : `MP${mpCost(c, id)}`,
        rightCls: p.penalized ? 'pen' : '',
        value: id,
        disabled: active && (!a.field || locked),
      };
    });
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: 'まだ何も覚えていない。' }));
      return box;
    }
    if (!active) {
      box.append(el('div', { class: 'small', text: items.map((i) => ABILITIES[i.value].name).join('、') }));
      box.append(el('div', { class: 'detail', text: '「他」は今の職業以外で覚えた技。MPが増えたり、威力が下がったりする。' }));
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
        if (a.target === 'self' && c.companion) ref = 'sup:' + c.key;
        else if (a.target !== 'allies' && a.target !== 'self') ref = await this.pickTarget(`だれに${a.name}？`, a.target === 'deadAlly');
        if (ref) g.net.send({ t: 'menu', action: 'cast', id: it.value, ref, who });
        setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
      },
    });
    box.append(el('div', { class: 'small muted', text: 'フィールドで使える技だけ選べるよ' }), m.root, detail);
    return box;
  }

  // ───── そうび ─────
  equipView(active, who = 'self') {
    const g = this.game;
    const c = this.charOf(who) || g.me;
    const box = el('div');
    const detail = el('div', { class: 'detail' });
    const st = computeStats(c);
    const stats = el('div', { class: 'small', text: `攻撃 ${st.atk}　守備 ${st.dfn}　素早さ ${st.agi}　魔力 ${st.mag}　回復 ${st.heal}` });
    const slots = c.species ? ['acc'] : SLOTS;
    const items = slots.map((sl) => ({ label: `${SLOT_NAMES[sl]}：${c.equip?.[sl] ? ITEMS[c.equip[sl]].name : 'なし'}`, value: sl }));
    if (c.companion) box.append(el('div', { class: 'gold small', text: `${c.name}の装備${c.species ? '（モンスターはアクセサリーだけ）' : ''}` }));
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(stats);
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = c.equip?.[it.value] ? `E ${ITEMS[c.equip[it.value]].name}（装備している）\n${itemDetail(c.equip[it.value])}` : ''; },
      onSelect: async (it) => {
        const slot = it.value;
        const cands = g.me.items.filter((e) => ITEMS[e.id]?.type === slot);
        // お店と おなじ 見せかた（攻撃力 52→66 ↑14）
        const opts = cands.map((e) => {
          const r = compareOne({ key: who, name: c.name, char: c }, e.id);
          if (!r.can) return { label: ITEMS[e.id].name, right: '装備できない', value: e.id, disabled: true };
          const d = r.main.d;
          return {
            label: ITEMS[e.id].name, value: e.id,
            right: `${r.main.n} ${r.main.b}→${r.main.a} ${d > 0 ? `↑${d}` : d < 0 ? `↓${-d}` : '＝'}`,
            rightCls: d > 0 ? 'up' : d < 0 ? 'down' : '',
          };
        });
        if (c.equip?.[slot]) opts.push({ label: '外す', value: '__off' });
        opts.push({ label: 'やめる', value: null });
        this.sub.blur();
        const pick = await this.pick(`${c.companion ? c.name + 'の' : ''}${SLOT_NAMES[slot]}を選ぶ`, opts);
        if (pick === '__off') g.net.send({ t: 'menu', action: 'unequip', slot, who });
        else if (pick) g.net.send({ t: 'menu', action: 'equip', id: pick, who });
        setTimeout(() => { if (this.root) this.focusSub(this.equipView(true, who)); }, 200);
      },
    });
    box.append(m.root, stats, detail);
    return box;
  }

  // ───── つよさ ─────
  statusView(who = 'self', active = false) {
    const c = this.charOf(who) || this.game.me;
    const st = computeStats(c);
    const box = el('div');
    const next = expForLevel(c.level + 1) - (c.exp || 0);
    const kind = c.species ? `${MONSTERS[c.species]?.name || ''}（モンスター）` : JOBS[c.job]?.name || '';
    box.append(el('h3', { text: `${c.name}　${kind}` }));
    const kv = (k, v, cls = '') => el('div', { class: 'kv' }, el('span', { class: 'k', text: k }), el('span', { class: cls, text: String(v) }));
    box.append(el('div', { class: 'twocol' },
      kv('レベル', c.level), kv('次のレベルまで', Math.max(0, next)),
      kv('HP', `${Math.max(0, c.hp)}/${st.maxHp}`), kv('MP', `${c.mp}/${st.maxMp}`),
      kv('力', st.str), kv('身の守り', st.def),
      kv('素早さ', st.agi), kv('攻撃魔力', st.mag),
      kv('回復魔力', st.heal), c.companion ? kv('作戦', TACTICS[c.tactics]?.name || '') : kv('ゴールド', c.gold),
      kv('攻撃力', st.atk, 'gold'), kv('守備力', st.dfn, 'gold')));
    if (c.species) {
      const f = MONSTER_FRIENDS[c.species];
      const learnList = el('div', { style: { marginTop: '0.6em' } }, el('div', { class: 'gold small', text: '覚える技（レベル）' }));
      for (const [l, id] of f?.learn || []) learnList.append(el('div', { class: `small ${c.level >= l ? 'good' : 'muted'}`, text: `Lv${l}　${ABILITIES[id]?.name || id}` }));
      box.append(learnList, el('div', { class: 'detail', text: f?.note || '' }));
    } else {
      const jobs = el('div', { style: { marginTop: '0.6em' } }, el('div', { class: 'gold small', text: '職業レベル（勝った戦いの数で上がる）' }));
      for (const j of ALL_JOBS) {
        const info = c.jobs?.[j];
        if (!info) continue;
        const pg = jobProgress(c, j);
        jobs.append(el('div', { class: 'kv small' },
          el('span', { class: j === c.job ? 'good' : '', text: `${JOBS[j].name}${JOBS[j].tier ? `（${TIER_NAMES[JOBS[j].tier]}）` : ''}` }),
          el('span', { class: pg.done ? 'gold' : '', text: pg.done ? `Lv${JOB_MAX_LEVEL} ★マスター` : `Lv${info.lv}（あと${pg.next}回）` })));
      }
      box.append(jobs, el('div', { class: 'detail', text: '自分よりレベルが5以上低い敵との戦いは、職業の修行にならないよ。' }));
    }
    const speedNote = el('div', { class: 'detail', text: `素早さ ${st.agi}…戦いで約${(128000 / (st.agi + 12) / 1000).toFixed(1)}秒ごとに順番が来る` });
    box.append(speedNote);
    if (active) {
      this.mkSub({ items: [{ label: 'もどる', value: 'back' }], onSelect: () => this.back() });
      box.append(this.sub.root);
    }
    return box;
  }

  // ───── なかま ─────
  partyView(active) {
    const g = this.game;
    const p = g.party;
    const box = el('div');
    const iAmLeader = p?.leader === g.sid;
    const rows = [];
    const face = (x) => el('img', { class: 'face', src: faceURL({ look: x.look, job: x.job, eq: x.equip, mon: x.species || undefined }), alt: '' });
    const row = (x, name, tag, cls = '') => el('div', { class: 'kv party-row' }, el('span', { class: cls }, face(x), name), el('span', { class: 'small muted', text: tag }));
    for (const m of p?.members || []) rows.push(row(m, `${m.sid === p.leader ? '★' : ''}${m.name}（${JOBS[m.job].name} Lv${m.level}）`, `HP ${m.hp}/${m.maxHp}`, m.sid === p.leader ? 'gold' : ''));
    for (const s of p?.supports || []) {
      const kind = s.species ? `${MONSTERS[s.species]?.name}${s.plus ? `＋${s.plus}` : ''} Lv${s.level}` : `${JOBS[s.job]?.name} Lv${s.level}`;
      rows.push(row(s, `${s.name}（${kind}）`, s.family ? '家族サポート' : s.species ? 'モンスター' : '仲間'));
    }
    for (const gu of p?.guests || []) rows.push(row(gu, gu.name, 'ゲスト'));
    box.append(...rows);
    if (!active) {
      box.append(el('div', { class: 'detail', text: '遊んでいる家族をパーティーにさそえるよ。仲間はルミナの町の酒場で探したり入れかえたりできる。\n近くにいる仲間はいっしょに戦う。はなれている仲間も、戦っているところへかけつけると、とちゅうから参加できるよ。' }));
      return box;
    }
    const acts = [];
    const others = (g.players || []).filter((x) => x.sid !== g.sid && x.partyId !== p?.id && !x.away);
    if (iAmLeader) for (const o of others) acts.push({ label: `${o.name}をさそう`, value: { a: 'invite', sid: o.sid } });
    if (iAmLeader) for (const s of p?.supports || []) acts.push({ label: `${s.name}に酒場で待っていてもらう`, value: { a: 'dismiss', key: s.key, name: s.name } });
    if (iAmLeader) for (const m of p?.members || []) if (m.sid !== g.sid) acts.push({ label: `${m.name}をリーダーにする`, value: { a: 'leader', sid: m.sid } });
    if (!iAmLeader && p) acts.push({ label: g.follow ? 'リーダーについていくのをやめる' : 'リーダーについていく（自動）', value: { a: 'follow' } });
    if ((p?.members.length || 1) > 1) acts.push({ label: 'パーティーをぬける', value: { a: 'leave' } });
    if (!acts.length) acts.push({ label: '（今遊んでいる家族はいないみたい）', value: null, disabled: true });
    const m = this.mkSub({
      items: acts,
      onSelect: async (it) => {
        const v = it.value;
        if (!v) return;
        if (v.a === 'follow') {
          g.follow = !g.follow;
          toast(g.follow ? 'リーダーについていきます' : '自分で歩きます');
        } else if (v.a === 'dismiss') {
          this.sub.blur();
          const ok = await confirmBox(g.input, `${v.name}にルミナの町の酒場で待っていてもらう？\n（酒場でまた連れていけるよ）`, 'はい', 'いいえ', this.sfx);
          if (ok) g.net.send({ t: 'party', action: 'dismiss', key: v.key });
        } else g.net.send({ t: 'party', action: v.a, sid: v.sid, key: v.key });
        setTimeout(() => { if (this.root) this.focusSub(this.partyView(true)); }, 250);
      },
    });
    box.append(el('div', { style: { marginTop: '0.5em' } }, m.root));
    return box;
  }

  // ───── ずかん ─────
  zukanView(active) {
    const c = this.game.me;
    const bs = c.bestiary || {};
    const kills = c.kills || {};
    const order = zukanOrder();
    const st = (sp) => {
      const b = bs[sp] || {};
      const friend = (b.friend || 0) > 0;
      const bred = (b.bred || 0) > 0;
      return { seen: (b.seen || 0) > 0 || (kills[sp] || 0) > 0 || friend || bred, friend, bred, kills: kills[sp] || 0 };
    };
    const box = el('div', { class: active ? 'zukan-box' : '' });
    const count = (k) => order.filter((sp) => st(sp)[k]).length;
    box.append(el('div', { class: 'small gold', text: `見つけた ${count('seen')}/${order.length}　仲間にした ${count('friend')}　配合で生んだ ${count('bred')}` }));
    if (!active) {
      box.append(el('div', { class: 'detail', text: '出会ったモンスターがのる図鑑。\n仲間にしたモンスターや、配合で生まれたモンスターも記録されるよ。\n配合でしか生まれないモンスターもいるらしい…' }));
      return box;
    }
    const detail = el('div', { class: 'detail zukan-detail' });
    const showMon = (sp) => {
      detail.innerHTML = '';
      const M = MONSTERS[sp];
      if (!M) return;
      const s = st(sp);
      const src = monsterCanvas(sp, 0);
      const cv = makeCanvas(src.width, src.height);
      const x = ctxOf(cv);
      x.drawImage(src, 0, 0);
      if (!s.seen) {
        // まだ であって いない: かげだけ
        x.globalCompositeOperation = 'source-in';
        x.fillStyle = '#2a2440';
        x.fillRect(0, 0, cv.width, cv.height);
      }
      cv.className = 'zukan-mon';
      detail.append(cv);
      if (!s.seen) {
        detail.append(el('div', { class: 'gold', text: '？？？' }));
        if (M.breedOnly) detail.append(el('div', { class: 'small', text: `配合で生まれるらしい…\nヒント: ${recipeHint(sp, MONSTERS)}` }));
        else detail.append(el('div', { class: 'small muted', text: M.boss ? 'どこかにいる大きな魔物…' : 'まだ出会っていない' }));
        return;
      }
      const fr = MONSTER_FRIENDS[sp];
      const how = M.breedOnly ? `配合で生まれる（${recipeHint(sp, MONSTERS)}）` : fr && fr.rate > 0 ? '倒すと仲間になることがある' : '仲間にならない';
      detail.append(
        el('div', { class: 'gold', text: `${M.name}${M.boss ? '（ボス）' : ''}` }),
        el('div', { class: 'small muted', text: `${RACE_NAMES[M.race] || ''}${M.breedOnly ? '' : `　Lv${M.lv}`}　倒した数 ${s.kills}` }),
        el('div', { class: 'small', text: M.desc || '' }),
        el('div', { class: 'small', text: `${how}${s.friend ? '　★仲間にした' : ''}${s.bred ? '　★配合で生んだ' : ''}` }),
      );
    };
    const m = this.mkSub({
      items: order.map((sp, i) => {
        const s = st(sp);
        const M = MONSTERS[sp];
        return {
          html: `<span class="muted small">No.${String(i + 1).padStart(2, '0')}</span> ${s.seen ? esc(M.name) : '？？？'}`,
          right: [s.friend ? '仲間' : '', s.bred ? '配合' : ''].filter(Boolean).join('・') || (M.boss && s.seen ? 'ボス' : ''),
          rightCls: s.friend || s.bred ? 'good' : '',
          value: sp,
          cls: s.seen ? '' : 'muted',
        };
      }),
      onMove: (it) => showMon(it.value),
    });
    box.append(detail, el('div', { class: 'zukan-list scroll' }, m.root));
    return box;
  }

  // ───── さくせん ─────
  tacticsView(active) {
    const g = this.game;
    const c = g.me;
    const box = el('div');
    const bs = c.battleSettings || {};
    const tname = (t) => TACTICS[t]?.name || t;
    const items = [{ label: `${c.name}（オートのとき）：${tname(c.tactics || 'balanced')}`, value: { key: 'self' } }];
    for (const s of g.party?.supports || []) {
      if (s.owner !== c.id) continue;
      items.push({ label: `${s.name}：${tname(s.tactics)}`, value: { key: s.key, name: s.name }, face: faceURL({ look: s.look, job: s.job, eq: s.equip, mon: s.species || undefined }) });
    }
    items.push({ label: `戦いの初めからオート：${bs.auto ? 'ON' : 'OFF'}`, value: { toggle: 'auto' } });
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', { class: 'detail', text: '仲間やオートのときの戦い方を決める。\n仲間を「めいれいさせろ」にすると、仲間のコマンドも自分で選べる。' }));
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
          const list = Object.entries(TACTICS).filter(([k]) => v.key !== 'self' || k !== 'manual').map(([k, x]) => ({ label: x.name, value: k }));
          const t = await this.pick(v.key === 'self' ? 'オートのときの作戦' : `${v.name}の作戦`, [...list, { label: 'やめる', value: null }]);
          if (t) g.net.send({ t: 'menu', action: 'tactics', key: v.key, tactics: t, label: TACTICS[t].name });
        }
        setTimeout(() => { if (this.root) this.focusSub(this.tacticsView(true)); }, 250);
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'バッチリがんばれ: バランスよく / ガンガンいこうぜ: 攻撃中心 / いのちだいじに: 回復中心 / じゅもんせつやく: MPを使わない / めいれいさせろ: 自分でコマンドを選ぶ（仲間だけ）' }));
    return box;
  }

  // ───── クエスト ─────
  questView() {
    const c = this.game.me;
    const box = el('div');
    box.append(el('h3', { text: '今の目標' }), el('div', { text: c.objective || '（特になし）' }));
    const q = [];
    const f = (k) => !!c.flags[k];
    if (f('q_mike_start')) q.push(['迷子のねこミケ', f('q_mike_done') ? 'クリア！' : f('q_mike_found') ? 'リリに報告しよう' : '星見の丘で探そう']);
    if (f('q_jelly_start')) q.push(['コックの特製ゼリー', f('q_jelly_done') ? 'クリア！' : `ぷるりんゼリー ${Math.min(3, (c.items.find((i) => i.id === 'jelly')?.n) || 0)}/3`]);
    if (f('q_wolf_start')) q.push(['ウルフ退治', f('q_wolf_done') ? 'クリア！' : `${Math.max(0, (c.kills?.wolf || 0) - (c.quests?.wolfBase || 0))}/5ひき`]);
    box.append(el('h3', { style: { marginTop: '0.6em' }, text: 'たのまれごと' }));
    if (!q.length) box.append(el('div', { class: 'muted small', text: 'まだない。町の人に話しかけてみよう。' }));
    for (const [n, s] of q) box.append(el('div', { class: 'kv' }, el('span', { text: n }), el('span', { class: s === 'クリア！' ? 'good' : 'muted', text: s })));
    const chests = Object.keys(c.chests || {}).length;
    const total = Object.values(MAPS).reduce((s, m) => s + m.chests.length, 0);
    box.append(el('div', { class: 'detail', text: `宝箱 ${chests}/${total}　倒した魔物 ${Object.values(c.kills || {}).reduce((s, x) => s + x, 0)}ひき` }));
    return box;
  }

  // ───── せってい ─────
  settingsView(active) {
    const g = this.game;
    const c = g.me;
    const bs = c.battleSettings || { speed: 1, wait: false };
    const sp = { 0.75: 'ゆっくり', 1: 'ふつう', 1.35: '速い' }[bs.speed || 1];
    const vol = (v) => '■'.repeat(Math.round(v * 5)) + '□'.repeat(5 - Math.round(v * 5));
    const items = [
      { label: `戦いの速さ：${sp}`, value: 'speed' },
      { label: `選ぶ間は止まる（ウェイト）：${bs.wait ? 'ON' : 'OFF'}`, value: 'wait' },
      { label: `音楽：${vol(g.audio.musicVol)}`, value: 'music' },
      { label: `効果音：${vol(g.audio.sfxVol)}`, value: 'sfx' },
      { label: `文字の大きさ：${document.body.classList.contains('big-text') ? '大きい' : 'ふつう'}`, value: 'text' },
    ];
    if (g.field.constructor.webgl2()) items.unshift({ label: `画面：${g.field.view === '3d' ? '2.5D（立体）' : '2D（ドット）'}`, value: 'view' });
    if (g.input.touch) {
      items.push({ label: `遊んでいる間は画面を消さない：${g.awakeOn ? 'ON' : 'OFF'}`, value: 'awake' });
      if (navigator.audioSession) items.push({ label: `マナーモードでも音を出す：${g.audio.silentPlay ? 'ON' : 'OFF'}`, value: 'silent' });
    }
    const box = el('div');
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', {
        class: 'detail',
        text: g.input.touch
          ? '操作: 画面の左側をさわるとそこにスティックが出るよ（指を動かして移動）。「走る」ボタンで走る／歩くを切りかえ。Aで話す・決定、Bでメニュー。メニューは右上の「✕ 閉じる」か、外をタップで閉じる'
          : '操作: 矢印/WASDで移動、Shiftをおしながらで走る、Z/Enterで話す・決定、X/Escでメニュー・もどる、Mでマップ、Cでチャット',
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
            toast(v === '3d' ? '画面を2.5D（立体）にしました' : '画面を2D（ドット）にしました');
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
    box.append(m.root, el('div', { class: 'detail', text: 'ウェイトをONにすると、コマンドを選ぶ間は戦いの時間が止まるよ（小さい子どもにおすすめ）' + (g.input.touch ? '\n画面が消えると家族との通信がとぎれやすいので「画面を消さない」はONがおすすめ' : '') }));
    return box;
  }
}

// ───────────── ぜんたいマップ ─────────────
const MAP_COLORS = {
  [T.GRASS]: '#5bab4b', [T.FLOWERS]: '#79c663', [T.TALLGRASS]: '#4a953f', [T.DIRT]: '#caa367', [T.SAND]: '#ead79c', [T.WATER]: '#3c80d6',
  [T.DEEP]: '#2a58a8', [T.TREE]: '#2f7a36', [T.PINE]: '#2a6a3a', [T.MOUNTAIN]: '#8f8270', [T.HILL]: '#6cb558', [T.ROCK]: '#8f8270',
  [T.BRIDGE_H]: '#a8733e', [T.BROKEN_BRIDGE]: '#3c80d6', [T.SWAMP]: '#6a4a7a', [T.FOREST_FLOOR]: '#3f7d3a', [T.STEPPING]: '#8a9ab8',
  [T.CAVE_FLOOR]: '#6a5a4a', [T.CAVE_WALL]: '#1d1714', [T.CAVE_WATER]: '#1f3f6e', [T.BOSS_FLOOR]: '#5a4870',
  [T.PIER]: '#a8733e', [T.WHIRLPOOL]: '#9a8ad8',
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
      const t = m.gates.length ? effectiveTile(m, mx, my, (fl) => f.gateFlag(fl)) : tileAt(m, mx, my);
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
  // ばしょの なまえ（行ったことが ある ところ だけ）
  const labels = m.id === 'overworld' ? Object.values(PLACES) : m.labels || [];
  if (full) {
    for (const p of labels) {
      if (!f.isExplored(p.x + Math.floor(p.w / 2), p.y + Math.floor(p.h / 2))) continue;
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(10, pxPer * 4)}px KizunaDot, sans-serif`;
      ctx.fillText(p.name, Math.max(2, (p.x - x0) * pxPer), Math.max(12, (p.y - y0) * pxPer - 3));
    }
  }
  // お店の しるし（行ったことが ある ところ だけ）
  for (const b of m.boards || []) {
    if (!f.isExplored(b.x, b.y)) continue;
    const ic = mapIconCanvas(b.kind);
    const px = Math.round((b.x + 0.5 - x0) * pxPer - ic.width / 2), py = Math.round((b.y + 0.5 - y0) * pxPer - ic.height / 2);
    if (px + ic.width < 0 || py + ic.height < 0 || px > canvas.width || py > canvas.height) continue;
    ctx.drawImage(ic, px, py);
  }
  for (const o of f.others.values()) dot(o.x, o.y, o.partyId === game.party?.id ? '#ffd66b' : '#8fd0ff', full ? 3 : 2);
  const blink = Math.floor(performance.now() / 300) % 2;
  dot(f.me.x, f.me.y, blink ? '#ff5a5a' : '#ffffff', full ? 3 : 2);
}

// 地図の しるしの せつめい（行ったことが ある お店 だけ）
function mapLegend(game) {
  const f = game.field;
  const seen = new Map();
  for (const b of f.map.boards || []) if (f.isExplored(b.x, b.y) && !seen.has(b.kind)) seen.set(b.kind, b.name);
  if (!seen.size) return null;
  const box = el('div', { class: 'map-legend small' });
  for (const [kind, name] of seen) box.append(el('span', { class: 'lg' }, el('img', { src: boardIconURL(kind), alt: '' }), name));
  return box;
}

export function openWorldMap(game) {
  if (document.querySelector('.worldmap')) return;
  const back = el('div', { class: 'modal-back' });
  const box = el('div', { class: 'win panel center-panel worldmap', style: { width: 'auto', maxWidth: '96vw' } });
  const cv = makeCanvas(10, 10);
  const head = el('div', { class: 'wm-head' }, el('span', { class: 'gold', text: game.field.map.name }),
    el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '地図を閉じる' }));
  box.append(head, cv, mapLegend(game), el('div', { class: 'small muted', text: `赤い点: 自分　黄色: パーティー　青: 家族　（${game.input.touch ? 'タップで閉じる' : 'B/Xで閉じる'}）` }));
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
