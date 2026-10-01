// フィールドの メニュー
import { el, ListMenu, toast, confirmBox, bar, esc } from './dom.js?v=d695815c3edd';
import { ITEMS, SLOTS, SLOT_NAMES, ITEM_SORTS, sortItemIds } from '../../shared/data/items.js?v=d695815c3edd';
import { ABILITIES, ELEMENT_NAMES, ELEMENT_ORDER, abilityRole } from '../../shared/data/abilities.js?v=d695815c3edd';
import { affinityOf, normBattleSettings, BATTLE_SPEEDS, TEXT_SPEEDS } from '../../shared/battle.js?v=d695815c3edd';
import { battleFontPref, battleDensityPref, setBattleFontPref, setBattleDensityPref, UI_FONTS, uiFontPref, setUiFontPref, uiFontFamily } from '../prefs.js?v=d695815c3edd';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, TIER_NAMES } from '../../shared/data/jobs.js?v=d695815c3edd';
import { computeStats, learnedAbilities, mpCost, penaltyFor, expForLevel, comboAllowed, comboJobNames, jobProgress, hiraProgress } from '../../shared/stats.js?v=d695815c3edd';
import { HIRAMEKI } from '../../shared/data/hirameki.js?v=d695815c3edd';
import { DUAL_TECHS, DUAL_ORDER, groupName } from '../../shared/data/dual.js?v=d695815c3edd';
import { MONSTERS } from '../../shared/data/monsters.js?v=d695815c3edd';
import { monsterDrops } from '../../shared/data/loot.js?v=d695815c3edd';
import { MONSTER_FRIENDS, RACE_NAMES, recipeHint } from '../../shared/data/companions.js?v=d695815c3edd';
import { TACTICS } from '../../shared/ai.js?v=d695815c3edd';
import { PLACES } from '../../shared/maps/overworld.js?v=d695815c3edd';
import { SEA_PLACES } from '../../shared/maps/ch2.js?v=d695815c3edd';
import { MAPS, tileAt, effectiveTile } from '../../shared/maps/index.js?v=d695815c3edd';
import { T } from '../../shared/tiles.js?v=d695815c3edd';
import { itemDetail, abilityDetail } from './info.js?v=d695815c3edd';
import { makeCanvas, ctxOf } from '../render/pixel.js?v=d695815c3edd';
import { monsterCanvas } from '../render/monsters.js?v=d695815c3edd';
import { mapIconCanvas, boardIconURL } from '../render/boards.js?v=d695815c3edd';
import { compareOne, compareTeam, whoItems } from './counter.js?v=d695815c3edd';
import { faceURL } from '../field.js?v=d695815c3edd';
import { partyRows } from './hud.js?v=d695815c3edd';
import { questMarks, subQuests, OBJECTIVE_TARGETS, whereName } from '../../shared/data/quest-targets.js?v=d695815c3edd';
import { memberTalk, talkFor } from '../../shared/data/party-talk.js?v=d695815c3edd';
import { treasureRows, treasureDetail, openTreasureMap } from './treasure.js?v=d695815c3edd';
import { themeHex } from '../render/themes.js?v=d695815c3edd';

const MAIN = [
  { label: 'はなす', value: 'talk' },
  { label: '道具', value: 'items' },
  { label: '呪文', value: 'skills' },
  { label: 'まんたん', value: 'fullheal' },
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

// 道具の ならべかえ（この 端末に おぼえる）
function itemSortPref() {
  try { return ITEM_SORTS[localStorage.getItem('kizuna_isort')] ? localStorage.getItem('kizuna_isort') : 'got'; } catch { return 'got'; }
}
function setItemSortPref(k) {
  try { localStorage.setItem('kizuna_isort', k); } catch { /* */ }
}

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
    // ドラクエの ように: パーティー みんなの HP・MP・Lv と、所持金
    const head = el('div', { class: 'win fm-head' });
    this.headParty = el('div', { class: 'fm-party' });
    this.headGold = el('div', { class: 'fm-gold' });
    const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': 'メニューを閉じる', onclick: () => this.closeByUser() });
    head.append(this.headParty, this.headGold, closeBtn);
    document.body.classList.add('menu-open');
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
    this.headParty.innerHTML = '';
    for (const m of partyRows(this.game)) {
      this.headParty.append(el('div', { class: `fm-mem ${m.hp <= 0 ? 'dead' : ''}` },
        el('div', { class: `n ${m.hpCls}`, text: m.name }),
        el('div', { class: `v ${m.hpCls}` }, el('span', { class: 'k', text: 'H' }), `${Math.max(0, m.hp)}`),
        el('div', { class: 'v' }, el('span', { class: 'k', text: 'M' }), `${m.mp}`),
        el('div', { class: 'v lv' }, el('span', { class: 'k', text: 'Lv' }), `${m.level}`)));
    }
    this.headGold.innerHTML = '';
    this.headGold.append(el('span', { class: 'k', text: '所持金' }), el('span', { class: 'g', text: `${c.gold.toLocaleString('ja-JP')} G` }));
  }

  close() {
    this.sub?.blur();
    this.menu?.blur();
    this.root?.remove();
    this.backdrop?.remove();
    this.root = null;
    this.backdrop = null;
    this.game.menuOpen = false;
    document.body.classList.remove('menu-open');
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
    if (!this.root) return; // もう とじている（おくれて よばれた とき）
    this.menu.focus();
    this.preview(this.current);
  }

  preview(v) {
    this.current = v;
    this.main.innerHTML = '';
    const g = this.game;
    switch (v) {
      case 'items': this.main.append(this.itemsList(false)); break;
      case 'talk': this.main.append(el('div', { class: 'muted', text: '仲間と話す。次にどこへ行けばいいか、仲間がヒントをくれる。' })); break;
      case 'fullheal': this.main.append(el('div', { class: 'muted', text: 'みんなのHPを満タンにする。\n「呪文で」…回復の呪文を、MPのむだが少ない順に使う。\n「道具で」…薬草などを、むだが少ない順に使う。' })); break;
      case 'skills': this.main.append(this.skillsView(false)); break;
      case 'equip': this.main.append(this.equipView(false)); break;
      case 'status': this.main.append(this.statusView()); break;
      case 'party': this.main.append(this.partyView(false)); break;
      case 'tactics': this.main.append(this.tacticsView(false)); break;
      case 'zukan': this.main.append(this.zukanView(false)); break;
      case 'map': this.main.append(el('div', { class: 'muted', text: '探検した場所の地図を見る。（Mキーでも開ける）\n次の行き先はピンク、たのまれごとは水色、報告できるときはみどりのしるし。' })); break;
      case 'quest': this.main.append(this.questView()); break;
      case 'settings': this.main.append(this.settingsView(false)); break;
      case 'quit': {
        const where = g.net.mode !== 'offline' ? '家族サーバー' : g.net.local?.cloud?.state === 'on' ? 'claude.ai' : 'このブラウザ';
        this.main.append(el('div', { class: 'muted', text: `セーブしてタイトルにもどる。（${where}にセーブされます）` }));
        break;
      }
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
      hirameki: x.hirameki || [], skillUse: x.skillUse || {}, favorites: x.favorites || [],
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
    // 強さは「全員」を 一覧で くらべられる
    if (next === 'status') items.unshift({ label: '全員（一覧でくらべる）', value: '__all' });
    const m = this.mkSub({
      items,
      onSelect: (it) => {
        this.who = it.value === '__all' ? 'self' : it.value;
        this.sub.blur();
        this.sub = null;
        const view = it.value === '__all' ? this.allStatusView(true)
          : next === 'skills' ? this.skillsView(true, it.value) : next === 'equip' ? this.equipView(true, it.value) : this.statusView(it.value, true);
        this.focusSub(view);
      },
    });
    box.append(el('div', { class: 'small gold', text: title }), m.root);
    return box;
  }

  // パーティーに 自分 いがいの 人（家族・なかま・ゲスト）が いるか
  hasOthers() {
    const p = this.game.party;
    return !!p && ((p.members || []).length > 1 || (p.supports || []).length > 0 || (p.guests || []).length > 0);
  }

  select(v) {
    const g = this.game;
    if (['skills', 'equip'].includes(v) && this.myMates().length) return this.focusSub(this.whoView(v));
    if (v === 'status' && (this.myMates().length || this.hasOthers())) return this.focusSub(this.whoView(v));
    switch (v) {
      case 'items': return this.focusSub(this.itemsList(true));
      case 'skills': return this.focusSub(this.skillsView(true));
      case 'equip': return this.focusSub(this.equipView(true));
      case 'party': return this.focusSub(this.partyView(true));
      case 'tactics': return this.focusSub(this.tacticsView(true));
      case 'zukan': return this.focusSub(this.zukanView(true));
      case 'settings': return this.focusSub(this.settingsView(true));
      case 'talk':
        this.close();
        return partyTalk(g);
      case 'fullheal':
        this.menu.blur();
        return this.pick('どうやって満タンにする？', [{ label: '呪文で', value: 'spell' }, { label: '道具で', value: 'item' }, { label: 'やめる', value: null }]).then((mode) => {
          if (mode) g.net.send({ t: 'menu', action: 'fullHeal', mode });
          if (this.root) this.menu.focus();
        });
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
    if (!this.root) { this.sub?.blur(); return; }
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
    const mode = itemSortPref();
    const counts = new Map(c.items.map((e) => [e.id, e.n]));
    const items = sortItemIds(c.items.map((e) => e.id), mode).map((id) => ({ label: ITEMS[id].name, right: `×${counts.get(id)}`, value: id }));
    for (const k of c.keyItems) items.push({ html: `${ITEMS[k].name}<span class="tag gold">大事</span>`, value: k, key: true });
    items.push(...treasureRows(c)); // 宝の地図
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: '何も持っていない。' }));
      if (active) setTimeout(() => this.back(), 600);
      return box;
    }
    if (!active) {
      box.append(el('div', { class: 'small', text: items.map((i) => i.label || ITEMS[i.value].name).join('、') }));
      return box;
    }
    // ならべかえ（あいうえお順・種類順・手に入れた順）
    const tabs = el('div', { class: 'tabs sort-tabs' }, el('span', { class: 'small muted', text: 'ならべかえ' }),
      ...Object.entries(ITEM_SORTS).map(([k, label]) => el('button', {
        class: `btn ${k === mode ? 'on' : ''}`,
        text: label,
        onclick: () => {
          setItemSortPref(k);
          this.sfx('cursor');
          this.focusSub(this.itemsList(true));
        },
      })));
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = it ? (it.tmap ? treasureDetail(g, it.tmap) : itemDetail(it.value)) : ''; },
      onSelect: (it) => this.itemAction(it),
    });
    box.append(tabs, m.root, detail);
    return box;
  }

  async itemAction(entry) {
    const g = this.game;
    if (entry.tmap) return openTreasureMap(this, entry.tmap);
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
    tabs.append(tabBtn('list', '覚えた技'), tabBtn('fav', 'お気に入り'), tabBtn('combo', 'ひらめき'), tabBtn('dual', '合体技'));
    box.append(tabs);
    const backBtn = () => {
      if (!active) return;
      this.mkSub({ items: [{ label: 'もどる', value: 'back' }], onSelect: () => this.back() });
      box.append(this.sub.root);
    };
    if (mode === 'combo') {
      // ひらめき: 関係する 技を 何回も 使うと、使った しゅんかんに ひらめく
      const known = new Set(learned);
      const use = c.skillUse || {};
      const order = Object.keys(HIRAMEKI).sort((x, y) => (known.has(y) ? 1 : 0) - (known.has(x) ? 1 : 0));
      for (const id of order) {
        const a = ABILITIES[id];
        if (!a) continue;
        const ok = known.has(id);
        const reqs = Object.entries(HIRAMEKI[id].from).map(([k, n]) => {
          const seen = k === '@atk' || known.has(k) || use[k] > 0;
          const nm = k === '@atk' ? 'ふつうの攻撃' : seen ? ABILITIES[k]?.name : '？？？';
          return `${nm} ${seen ? Math.min(use[k] || 0, n) : '?'}/${n}回`;
        }).join('　');
        const prog = hiraProgress(c, id);
        const who = a.kind === 'combo' ? `使える職業: ${comboJobNames(id).join('・')}（とその超級職）` : `${JOBS[a.job]?.name || ''}の技（${JOBS[a.job]?.name || ''}とそこから進んだ職業でひらめく）`;
        box.append(el('div', { class: `combo-row ${ok ? '' : 'locked'}` },
          el('span', { class: 'nm', text: ok ? a.name : '？？？？' }),
          ok ? el('span', { class: 'tag good', text: 'ひらめいた' }) : prog >= 1 ? el('span', { class: 'tag gold', text: 'もうすぐ！' }) : null,
          el('div', { class: 'small', text: reqs }),
          el('div', { class: 'small gold', text: who }),
          ok ? el('div', { class: 'small muted', text: a.desc }) : null));
      }
      box.append(el('div', { class: 'detail', text: '技を使うたびに回数がふえる。書いてある回数をこえると、その技を使ったしゅんかんに、ひらめくことがある（ひらめいた技がそのまま出る）。\n掛け合わせ技は、元になった職業を合わせ持つ上級職からひらめく。神殿の「ひらめきの賢者」がヒントを教えてくれる。' }));
      backBtn();
      return box;
    }
    if (mode === 'fav') {
      // お気に入り: 戦いの 呪文・特技の いちばん 上に この じゅんで 出る
      const favs = (c.favorites || []).filter((id) => ABILITIES[id] && learned.includes(id));
      if (!favs.length) box.append(el('div', { class: 'muted', text: 'まだお気に入りはない。「覚えた技」で技を選んで「お気に入りに入れる」を選ぼう。' }));
      if (active && favs.length) {
        const m = this.mkSub({
          items: favs.map((id, i) => ({ html: `<span class="muted small">${i + 1}.</span> ${esc(ABILITIES[id].name)}`, value: id, right: ABILITIES[id].kind === 'spell' ? '呪文' : '特技' })),
          onSelect: async (it) => {
            this.sub.blur();
            const op = await this.pick(`${ABILITIES[it.value].name}`, [{ label: '▲ 上へ', value: 'up' }, { label: '▼ 下へ', value: 'down' }, { label: 'お気に入りからはずす', value: 'remove' }, { label: 'やめる', value: null }]);
            if (op) this.sendFav(c, who, it.value, op);
            setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
          },
        });
        box.append(m.root);
      } else if (favs.length) box.append(el('div', { class: 'small', text: favs.map((id) => ABILITIES[id].name).join('、') }));
      box.append(el('div', { class: 'detail', text: '戦いで呪文・特技を開くと、いちばん上の「お気に入り」の窓にこのじゅんで出る。選ぶと、上へ・下へでならびを変えられる。' }));
      backBtn();
      return box;
    }
    if (mode === 'dual') {
      // 合体技: 2人の 番を 使う 技
      for (const id of DUAL_ORDER) {
        const t = DUAL_TECHS[id];
        box.append(el('div', { class: 'combo-row' },
          el('span', { class: 'nm', text: t.name }),
          el('span', { class: 'tag gold', text: `MP ${t.mp[0]}＋${t.mp[1]}` }),
          el('div', { class: 'small', text: `${groupName(t.need[0])} ＋ ${groupName(t.need[1])}（2人で1つずつ）` }),
          el('div', { class: 'small muted', text: t.desc })));
      }
      box.append(el('div', { class: 'detail', text: '合体技は、2人の番を使う技。自分のゲージがたまった時に「合体技」から選ぶ。仲間のゲージが半分いじょうならすぐ出る。まだの時は「よやく」して、仲間のゲージが半分たまったらいっしょに出す。\nオートで戦う時にねらう合体技は「作戦」で決められる。家族のキャラと出す時は、相手の画面に「参加する？」と出る。' }));
      backBtn();
      return box;
    }
    const items = learned.map((id) => {
      const a = ABILITIES[id];
      const p = penaltyFor(c, id);
      const locked = a.kind === 'combo' && !comboAllowed(c, id);
      const elm = a.effect?.element;
      return {
        html: `${ELEMENT_NAMES[elm] ? `<span class="elem e-${elm}">${ELEMENT_NAMES[elm]}</span>` : ''}${a.name}${a.kind === 'combo' ? `<span class="tag ${locked ? 'muted' : 'gold'}">掛け合わせ${locked ? '（上級職で）' : ''}</span>` : a.hirameki ? '<span class="tag hira">ひらめき</span>' : ''}${p.penalized ? '<span class="tag warn">他</span>' : ''}`,
        right: a.effect.type === 'mahouken' ? '' : `MP${mpCost(c, id)}`,
        rightCls: p.penalized ? 'pen' : '',
        value: id,
        cls: `k-${abilityRole(a)}`,
        disabled: false,
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
      onMove: (it) => { detail.textContent = it ? `${abilityDetail(it.value, c)}\n使った回数: ${c.skillUse?.[it.value] || 0}回` : ''; },
      onSelect: async (it) => {
        const a = ABILITIES[it.value];
        const locked = a.kind === 'combo' && !comboAllowed(c, it.value);
        const fav = (c.favorites || []).includes(it.value);
        this.sub.blur();
        const act = await this.pick(a.name, [
          ...(a.field && !locked ? [{ label: '使う', value: 'use' }] : []),
          { label: fav ? 'お気に入りからはずす' : '★ お気に入りに入れる', value: fav ? 'remove' : 'add' },
          { label: 'やめる', value: null },
        ]);
        if (act === 'add' || act === 'remove') {
          this.sendFav(c, who, it.value, act);
          setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
          return;
        }
        if (act !== 'use') {
          if (this.root) this.focusSub(this.skillsView(true, who));
          return;
        }
        let ref = 'self';
        if (a.target === 'self' && c.companion) ref = 'sup:' + c.key;
        else if (a.target !== 'allies' && a.target !== 'self') ref = await this.pickTarget(`だれに${a.name}？`, a.target === 'deadAlly');
        if (ref) g.net.send({ t: 'menu', action: 'cast', id: it.value, ref, who });
        setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
      },
    });
    box.append(el('div', { class: 'small muted', text: '選ぶと「使う（フィールドで使える技）」「お気に入り」を選べる' }), m.root, detail);
    return box;
  }

  // お気に入りを サーバーに おくる（画面の キャラにも すぐ 入れる）
  sendFav(c, who, id, op) {
    const list = Array.isArray(c.favorites) ? c.favorites : (c.favorites = []);
    const i = list.indexOf(id);
    if (op === 'add' && i < 0) list.push(id);
    if (op === 'remove' && i >= 0) list.splice(i, 1);
    if ((op === 'up' || op === 'down') && i >= 0) {
      const j = op === 'up' ? i - 1 : i + 1;
      if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
    }
    this.game.net.send({ t: 'menu', action: 'favorite', who: who || 'self', id, op });
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
    // ドラクエの「さいきょう装備」: ふくろの 中で いちばん 強い ものを まとめて 装備
    if (!c.species) items.push({ label: 'さいきょう装備', value: '__best' }, ...(this.myMates().some((m) => !m.species) ? [{ label: 'みんなさいきょう装備', value: '__bestAll' }] : []));
    if (c.companion) box.append(el('div', { class: 'gold small', text: `${c.name}の装備${c.species ? '（モンスターはアクセサリーだけ）' : ''}` }));
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(stats);
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => {
        if (it.value === '__best') detail.textContent = 'ふくろの中から、攻撃力・守備力がいちばん上がる武器・よろい・たて・かぶとを装備する（アクセサリーはそのまま）';
        else if (it.value === '__bestAll') detail.textContent = '自分と仲間みんなを、ならびの順にさいきょう装備にする';
        else detail.textContent = c.equip?.[it.value] ? `E ${ITEMS[c.equip[it.value]].name}（装備している）\n${itemDetail(c.equip[it.value])}` : '';
      },
      onSelect: async (it) => {
        const slot = it.value;
        if (slot === '__best' || slot === '__bestAll') {
          g.net.send({ t: 'menu', action: 'bestEquip', who: slot === '__bestAll' ? 'all' : who });
          setTimeout(() => { if (this.root) this.focusSub(this.equipView(true, who)); }, 250);
          return;
        }
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

  // ───── つよさ（全員を 一覧で くらべる） ─────
  allStatusView(active = false) {
    const g = this.game;
    const p = g.party || {};
    const cols = [];
    const add = (x, st, kind) => cols.push({
      name: x.name, level: x.level, hp: x.hp, mp: x.mp, maxHp: st.maxHp ?? x.maxHp, maxMp: st.maxMp ?? x.maxMp, st, kind,
      face: faceURL({ look: x.look, job: x.job, eq: x.equip, mon: x.species || undefined }),
    });
    add(g.me, computeStats(g.me), JOBS[g.me.job]?.name || '');
    for (const m of this.myMates()) {
      const c = this.charOf(m.key);
      if (c) add(m, computeStats(c), m.species ? MONSTERS[m.species]?.name || '' : JOBS[m.job]?.name || '');
    }
    // 家族（パーティーの ほかの 人）と その なかま、ゲスト
    for (const m of p.members || []) if (m.sid !== g.sid && m.st) add(m, m.st, JOBS[m.job]?.name || '');
    for (const m of p.supports || []) if (m.owner !== g.me.id && m.st) add(m, m.st, m.species ? MONSTERS[m.species]?.name || '' : JOBS[m.job]?.name || '');
    for (const m of p.guests || []) if (m.st) add(m, m.st, JOBS[m.job]?.name || '');
    const rows = [
      ['レベル', (x) => x.level],
      ['HP', (x) => x.maxHp, (x) => `${Math.max(0, x.hp)}/${x.maxHp}`],
      ['MP', (x) => x.maxMp, (x) => `${Math.max(0, x.mp)}/${x.maxMp}`],
      ['力', (x) => x.st.str], ['身の守り', (x) => x.st.def], ['素早さ', (x) => x.st.agi],
      ['攻撃魔力', (x) => x.st.mag], ['回復魔力', (x) => x.st.heal],
      ['攻撃力', (x) => x.st.atk], ['守備力', (x) => x.st.dfn],
    ];
    const table = el('table', { class: 'allstat' });
    const head = el('tr', {}, el('th'));
    for (const x of cols) head.append(el('th', {}, el('img', { class: 'face', src: x.face, alt: '' }), el('div', { class: 'nm', text: x.name }), el('div', { class: 'jb', text: x.kind })));
    table.append(head);
    for (const [label, val, show] of rows) {
      const vals = cols.map(val);
      const best = cols.length > 1 ? Math.max(...vals) : null;
      const tr = el('tr', {}, el('th', { text: label }));
      cols.forEach((x, i) => tr.append(el('td', { class: vals[i] === best ? 'gold' : '', text: String(show ? show(x) : vals[i]) })));
      table.append(tr);
    }
    const box = el('div');
    box.append(el('h3', { text: '全員の強さ' }), el('div', { class: 'allstat-wrap' }, table),
      el('div', { class: 'detail', text: '黄色は、その強さが一番高い人。' }));
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
    // ならびの じゅん（リーダーが きめる。先頭ほど 敵に ねらわれやすい）
    const memRows = (p?.members || []).map((m) => row(m, `${m.sid === p.leader ? '★' : ''}${m.name}（${JOBS[m.job].name} Lv${m.level}）`, `HP ${m.hp}/${m.maxHp}`, m.sid === p.leader ? 'gold' : ''));
    const supRows = (p?.supports || []).map((s) => {
      const kind = s.species ? `${MONSTERS[s.species]?.name}${s.plus ? `＋${s.plus}` : ''} Lv${s.level}` : `${JOBS[s.job]?.name} Lv${s.level}`;
      return row(s, `${s.name}（${kind}）`, s.family ? '家族サポート' : s.species ? 'モンスター' : '仲間');
    });
    const pos = Math.max(0, Math.min(supRows.length, p?.selfPos || 0));
    rows.push(...supRows.slice(0, pos), ...memRows, ...supRows.slice(pos));
    rows.forEach((r, i) => r.firstChild.prepend(el('span', { class: 'ord', text: `${i + 1}` })));
    for (const gu of p?.guests || []) rows.push(row(gu, gu.name, 'ゲスト'));
    box.append(...rows);
    if (!active) {
      box.append(el('div', { class: 'detail', text: '遊んでいる家族をパーティーにさそえる。仲間はルミナの町の酒場で探したり入れかえたりできる。\n近くにいる仲間はいっしょに戦う。はなれている仲間も、戦っている場所へかけつけると、とちゅうから参加できる。\n「ならびを変える」で順番を変えられる（先頭ほど敵にねらわれやすい）。' }));
      return box;
    }
    const acts = [];
    if (iAmLeader && (p?.supports?.length || 0) >= 1) acts.push({ label: 'ならびを変える', value: { a: 'order' } });
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
        if (v.a === 'order') {
          this.sub.blur();
          const order = await this.pickOrder();
          if (order) g.net.send({ t: 'menu', action: 'order', order });
        } else if (v.a === 'follow') {
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

  // ドラクエの ならびかえ: 1番目から じゅんに えらぶ（人の まとまりは いっしょに うごく）
  async pickOrder() {
    const p = this.game.party;
    const people = (p?.members || []).map((m) => m.name).join('・') || this.game.me.name;
    const pool = [{ label: people, value: 'self' }, ...(p?.supports || []).map((s) => ({ label: s.name, value: s.key }))];
    const order = [];
    while (pool.length > 1) {
      const v = await this.pick(`${order.length + 1}番目はだれにする？（先頭ほど敵にねらわれやすい）`, [...pool, { label: 'やめる', value: null }]);
      if (!v) return null;
      order.push(v);
      pool.splice(pool.findIndex((x) => x.value === v), 1);
    }
    order.push(pool[0].value);
    return order;
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
      return { seen: (b.seen || 0) > 0 || (kills[sp] || 0) > 0 || friend || bred, friend, bred, kills: kills[sp] || 0, raw: b };
    };
    const box = el('div', { class: active ? 'zukan-box' : '' });
    const count = (k) => order.filter((sp) => st(sp)[k]).length;
    box.append(el('div', { class: 'small gold', text: `見つけた ${count('seen')}/${order.length}　仲間にした ${count('friend')}　配合で生んだ ${count('bred')}` }));
    if (!active) {
      box.append(el('div', { class: 'detail', text: '出会ったモンスターがのる図鑑。\n仲間にしたモンスターや、配合で生まれたモンスターも記録される。\n配合でしか生まれないモンスターもいるらしい…' }));
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
      // 属性の 得手不得手（戦いで ためした ものだけ 分かる）
      const MARK = { weak: '◎', normal: '○', resist: '△', null: '×' };
      const affRow = el('div', { class: 'small zukan-aff' }, el('span', { class: 'muted', text: '属性 ' }));
      for (const e of ELEMENT_ORDER) {
        const known = !!s.raw[`el_${e}`];
        const aff = known ? affinityOf(M.resist?.[e] ?? 1) : null;
        affRow.append(el('span', { class: `zaff ${aff || 'unk'}` }, el('span', { class: `elem e-${e}`, text: ELEMENT_NAMES[e] }), el('span', { text: known ? MARK[aff] : '？' })));
      }
      detail.append(affRow, el('div', { class: 'small muted', text: '◎弱点 ○ふつう △効きにくい ×効かない ？まだためしていない' }));
      // 落とす 物（手に 入れた ものだけ 名前が 分かる）
      const ORDER = { common: 0, rare: 1, boss: 2 };
      const drops = monsterDrops(sp).sort((p, q) => ORDER[p.kind] - ORDER[q.kind]);
      if (drops.length) {
        const KIND = { boss: 'かならず', rare: 'レア', common: 'よく' };
        const row = el('div', { class: 'small zukan-drops' }, el('span', { class: 'muted', text: '落とす物 ' }));
        for (const d of drops) {
          const known = !!s.raw[`drop_${d.item}`];
          row.append(el('span', { class: `zdrop ${d.kind} ${known ? '' : 'unk'}` }, el('span', { text: known ? ITEMS[d.item].name : '？？？' }), el('span', { class: 'tag', text: KIND[d.kind] })));
        }
        detail.append(row);
      }
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
    items.push({ label: `オートでねらう合体技：${DUAL_TECHS[bs.autoDual]?.name || 'なし'}`, value: { toggle: 'autoDual' } });
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
          g.net.send({ t: 'menu', action: 'settings', auto: !bs.auto });
        } else if (v.toggle === 'autoDual') {
          // 自分が 片方の 技を 覚えている 合体技
          this.sub.blur();
          const mine = new Set(learnedAbilities(c));
          const list = DUAL_ORDER.filter((id) => DUAL_TECHS[id].need.some((grp) => grp.some((k) => mine.has(k))))
            .map((id) => ({ label: DUAL_TECHS[id].name, value: id, right: bs.autoDual === id ? '★' : '' }));
          const t = await this.pick('オートでねらう合体技（仲間のゲージが半分たまったらいっしょに出す）', [{ label: '使わない', value: '__none' }, ...list, { label: 'やめる', value: null }]);
          if (t) g.net.send({ t: 'menu', action: 'settings', autoDual: t === '__none' ? null : t });
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
    const leader = this.game.visitingLeader?.();
    if (leader) {
      box.append(el('h3', { text: `${leader.name}の目標（いっしょに冒険中）` }), el('div', { text: this.game.party.objective || '（特になし）' }));
      box.append(el('div', { class: 'detail', text: `${leader.name}の冒険を手伝っているあいだは、自分のストーリーは進みません。\nレベル・お金・道具はそのままもらえるよ。パーティーをぬけると、自分の冒険の場所にもどります。` }));
    }
    box.append(el('h3', { text: leader ? '自分の目標' : '今の目標' }), el('div', { class: 'q-main' }, el('i', { class: 'qdot main' }), c.objective || '（特になし）'));
    const tgt = OBJECTIVE_TARGETS[c.objective || ''];
    if (tgt) box.append(el('div', { class: 'small muted', text: `行き先: ${whereName(tgt[tgt.length - 1])}（地図のピンクのしるし）` }));
    // たのまれごと（報告する 人は 地図に 水色・報告できる ときは みどり）
    const f = (k) => !!c.flags[k];
    const active = subQuests(c);
    const done = [['q_mike_done', '迷子のねこミケ'], ['q_jelly_done', 'コックの特製ゼリー'], ['q_wolf_done', 'ウルフ退治'], ['q_bottle_done', 'びんの手紙']].filter(([k]) => f(k));
    box.append(el('h3', { style: { marginTop: '0.6em' }, text: 'たのまれごと' }));
    if (!active.length && !done.length) box.append(el('div', { class: 'muted small', text: 'まだない。町の人の話を聞くと、たのまれごとが見つかることがある。' }));
    for (const q of active) {
      box.append(el('div', { class: 'kv' }, el('span', {}, el('i', { class: `qdot ${q.ready ? 'ready' : 'sub'}` }), q.name), el('span', { class: q.ready ? 'good' : 'muted', text: q.text })));
    }
    for (const [, n] of done) box.append(el('div', { class: 'kv' }, el('span', { class: 'muted', text: n }), el('span', { class: 'good', text: 'クリア！' })));
    const chests = Object.keys(c.chests || {}).length;
    const total = Object.values(MAPS).reduce((s, m) => s + m.chests.length, 0);
    box.append(el('div', { class: 'detail', text: `宝箱 ${chests}/${total}　倒した魔物 ${Object.values(c.kills || {}).reduce((s, x) => s + x, 0)}ひき` }));
    return box;
  }

  // ───── せってい ─────
  settingsView(active) {
    const g = this.game;
    const c = g.me;
    const bs = c.battleSettings || { wait: false };
    const cur = normBattleSettings(bs);
    const STEP = ['とてもゆっくり', 'ゆっくり', 'ふつう', '速い', 'とても速い'];
    const sp = STEP[BATTLE_SPEEDS.indexOf(cur.speed)] || 'ふつう';
    const tsp = STEP[TEXT_SPEEDS.indexOf(cur.textSpeed)] || 'ふつう';
    const bfs = { s: '小さい', m: 'ふつう', l: '大きい' }[battleFontPref()];
    const bden = { 1: '少なめ（大きく）', 2: 'ふつう', 3: '多め（3列）' }[battleDensityPref()];
    const vol = (v) => '■'.repeat(Math.round(v * 5)) + '□'.repeat(5 - Math.round(v * 5));
    const send = (patch) => g.net.send({ t: 'menu', action: 'settings', speed: cur.speed, textSpeed: cur.textSpeed, wait: !!bs.wait, auto: !!bs.auto, ...patch });
    const items = [
      { label: `戦いの速さ（エフェクト）：${sp}`, value: 'speed' },
      { label: `文字の速さ：${tsp}`, value: 'textSpeed' },
      { label: `戦いの文字の大きさ：${bfs}`, value: 'bfont' },
      { label: `戦いのコマンドの数：${bden}`, value: 'bdense' },
      { label: `選ぶ間は止まる（ウェイト）：${bs.wait ? 'ON' : 'OFF'}`, value: 'wait' },
      { label: `音楽：${vol(g.audio.musicVol)}`, value: 'music' },
      { label: `効果音：${vol(g.audio.sfxVol)}`, value: 'sfx' },
      { label: `文字の大きさ：${document.body.classList.contains('big-text') ? '大きい' : 'ふつう'}`, value: 'text' },
      { label: `字の形：${UI_FONTS[uiFontPref()]}`, value: 'font' },
    ];
    if (g.field.constructor.webgl2()) items.unshift({ label: `画面：${g.field.view === '3d' ? '2.5D（立体）' : '2D（ドット）'}`, value: 'view' });
    if (g.input.touch) {
      items.push({ label: `ウインドウの十字キー：${g.input.padOn ? '出す' : '出さない'}`, value: 'pad' });
      items.push({ label: `遊んでいる間は画面を消さない：${g.awakeOn ? 'ON' : 'OFF'}`, value: 'awake' });
      if (navigator.audioSession) items.push({ label: `マナーモードでも音を出す：${g.audio.silentPlay ? 'ON' : 'OFF'}`, value: 'silent' });
    }
    const box = el('div');
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', {
        class: 'detail',
        text: g.input.touch
          ? '操作: 画面の左側をさわるとそこにスティックが出る（指を動かして移動）。「走る」ボタンで走る／歩くを切りかえ。Aで話す・決定、Bでメニュー。メニューは右上の「✕ 閉じる」か、外をタップで閉じる\nメニューやお店などのウインドウは、直接タップするほかに、十字キー（▲▼◀▶）とA・Bでも選べる（「ウインドウの十字キー」で出さないこともできる）'
          : '操作: 矢印/WASDで移動、Shiftをおしながらで走る、Z/Enterで話す・決定、X/Escでメニュー・もどる、Mでマップ、Cでチャット',
      }));
      return box;
    }
    const m = this.mkSub({
      items,
      onSelect: (it) => {
        if (it.value === 'speed') {
          send({ speed: BATTLE_SPEEDS[(BATTLE_SPEEDS.indexOf(cur.speed) + 1) % BATTLE_SPEEDS.length] });
        } else if (it.value === 'textSpeed') {
          send({ textSpeed: TEXT_SPEEDS[(TEXT_SPEEDS.indexOf(cur.textSpeed) + 1) % TEXT_SPEEDS.length] });
        } else if (it.value === 'bfont') {
          setBattleFontPref({ s: 'm', m: 'l', l: 's' }[battleFontPref()]);
        } else if (it.value === 'bdense') {
          setBattleDensityPref({ 1: 2, 2: 3, 3: 1 }[battleDensityPref()]);
        } else if (it.value === 'wait') {
          send({ wait: !bs.wait });
        } else if (it.value === 'music') {
          g.audio.setVolumes((Math.round(g.audio.musicVol * 5) + 1) % 6 / 5, g.audio.sfxVol);
        } else if (it.value === 'sfx') {
          g.audio.setVolumes(g.audio.musicVol, (Math.round(g.audio.sfxVol * 5) + 1) % 6 / 5);
          g.audio.sfx('confirm');
        } else if (it.value === 'text') {
          document.body.classList.toggle('big-text');
          try { localStorage.setItem('kizuna_bigtext', document.body.classList.contains('big-text') ? '1' : ''); } catch { /* */ }
        } else if (it.value === 'font') {
          const keys = Object.keys(UI_FONTS);
          setUiFontPref(keys[(keys.indexOf(uiFontPref()) + 1) % keys.length]);
        } else if (it.value === 'view') {
          g.field.setView(g.field.view === '3d' ? '2d' : '3d', true).then((v) => {
            toast(v === '3d' ? '画面を2.5D（立体）にしました' : '画面を2D（ドット）にしました');
            if (this.root) this.focusSub(this.settingsView(true));
          });
          return;
        } else if (it.value === 'pad') {
          g.input.padOn = !g.input.padOn;
        } else if (it.value === 'awake') {
          g.awakeOn = !g.awakeOn;
        } else if (it.value === 'silent') {
          g.audio.silentPlay = !g.audio.silentPlay;
          g.audio.sfx('confirm');
        }
        setTimeout(() => { if (this.root) this.focusSub(this.settingsView(true)); }, 200);
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'ウェイトをONにすると、コマンドを選ぶ間は戦いの時間が止まる（じっくり考えたい人におすすめ）' + (g.input.touch ? '\n画面が消えると家族との通信がとぎれやすいので「画面を消さない」はONがおすすめ' : '') }));
    return box;
  }
}

// キャンバスの 字（設定の「字の形」に あわせる。まだ 読みこんで いない 字は 読みこんでおく）
function canvasFont(px, text) {
  const fam = uiFontFamily();
  const f = `${px}px ${fam}, sans-serif`;
  try { document.fonts?.load(f, text).catch(() => {}); } catch { /* */ }
  return f;
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
      ctx.fillStyle = themeHex(MAP_COLORS[t] || (t >= 30 && t < 70 ? '#c8bfae' : '#555'), m.theme, t);
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
      ctx.font = canvasFont(Math.max(10, pxPer * 4), p.name);
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
  drawQuestMarks(game, ctx, canvas, x0, y0, pxPer, full);
  for (const o of f.others.values()) dot(o.x, o.y, o.partyId === game.party?.id ? '#ffd66b' : '#8fd0ff', full ? 3 : 2);
  const blink = Math.floor(performance.now() / 300) % 2;
  dot(f.me.x, f.me.y, blink ? '#ff5a5a' : '#ffffff', full ? 3 : 2);
}

// 仲間会話（はなす）: 仲間が 1人ずつ 今の 目標の ヒントを 話す。さいごに 行き先の 方角
const DIR8 = ['東', '南東', '南', '南西', '西', '北西', '北', '北東'];
export function questDirection(game) {
  const f = game.field;
  const m = questMarks(game.me, f.mapId, currentObjective(game)).find((x) => x.kind === 'main');
  if (!m) return '';
  const dx = m.x + 0.5 - f.me.x, dy = m.y + 0.5 - f.me.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return m.via ? '次の行き先へは、すぐそこの出入り口から行ける。' : '次の行き先は、すぐ近くだ。';
  const i = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  const where = `ここから${DIR8[i]}${dist > 40 ? 'のずっと先' : 'のほう'}`;
  return m.via ? `次の行き先へは、${where}にある出入り口から行ける。` : `次の行き先は、${where}。`;
}
export async function partyTalk(game) {
  const g = game;
  const obj = currentObjective(g);
  const p = g.party;
  const speakers = [];
  for (const s of p?.supports || []) speakers.push(memberTalk({ key: s.key, name: s.name, species: s.species }, obj));
  for (const gu of p?.guests || []) speakers.push(memberTalk({ key: gu.id, name: gu.name }, obj));
  g.audio.sfx('confirm');
  if (!speakers.length) await g.script.say(g.me.name, talkFor(obj, 'self'));
  for (const sp of speakers.slice(0, 4)) await g.script.say(sp.mon ? '' : sp.name, sp.text);
  const dir = questDirection(g);
  if (dir) await g.script.say('', `――${dir}`);
  g.script.closeDialog();
}

// 目標の しるし: ピンク＝次の 行き先、水色＝たのまれごと、みどり＝報告できる。
// 小さい 地図の 外に ある ときは ふちに 矢じるし
const QUEST_COLORS = { main: '#ff5fd2', sub: '#5fd8ff', subReady: '#7dff8a' };
export function currentObjective(game) {
  return game.visitingLeader?.() ? game.party?.objective : game.me?.objective;
}
function drawQuestMarks(game, ctx, canvas, x0, y0, pxPer, full) {
  const marks = questMarks(game.me, game.field.mapId, currentObjective(game));
  const t = performance.now();
  const pulse = 0.5 + 0.5 * Math.sin(t / 220);
  // 下から メインが いちばん うえに なるように
  marks.sort((a, b) => (b.kind === 'main') - (a.kind === 'main'));
  for (const m of marks.reverse()) {
    const col = QUEST_COLORS[m.kind];
    let px = (m.x + 0.5 - x0) * pxPer, py = (m.y + 0.5 - y0) * pxPer;
    const r = full ? Math.max(5, pxPer * 1.6) : 4;
    const out = px < r || py < r || px > canvas.width - r || py > canvas.height - r;
    if (out) {
      if (full) continue;
      // ふちの 矢じるし（中心から その 向きへ）
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const ang = Math.atan2(py - cy, px - cx);
      const k = Math.min((cx - 5) / Math.max(1e-6, Math.abs(Math.cos(ang))), (cy - 5) / Math.max(1e-6, Math.abs(Math.sin(ang))));
      px = cx + Math.cos(ang) * k;
      py = cy + Math.sin(ang) * k;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-3, -3.5); ctx.lineTo(-3, 3.5); ctx.closePath(); ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(px, py);
    if (m.kind === 'main') {
      // ひし形（ドラクエの 目的地の ように 光る）
      ctx.globalAlpha = 0.35 + 0.4 * pulse;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r * (1.5 + 0.5 * pulse), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(0, -r - 1.5); ctx.lineTo(r + 1.5, 0); ctx.lineTo(0, r + 1.5); ctx.lineTo(-r - 1.5, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85 + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
      if (full && m.kind === 'subReady') {
        ctx.fillStyle = '#000';
        ctx.font = canvasFont(Math.max(9, r * 1.5), '!');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0.5);
      }
    }
    ctx.restore();
    if (full) {
      const label = m.via ? `${m.label}（この先）` : m.label;
      ctx.font = canvasFont(Math.max(10, pxPer * 3.4), label);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = col;
      const tx = Math.min(canvas.width - ctx.measureText(label).width - 2, Math.max(2, px + r + 3));
      const ty = Math.max(12, py - r - 2);
      ctx.strokeText(label, tx, ty);
      ctx.fillText(label, tx, ty);
    }
  }
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
  const qlg = el('div', { class: 'map-legend small' },
    el('span', { class: 'lg' }, el('i', { class: 'qdot main' }), '次の行き先'),
    el('span', { class: 'lg' }, el('i', { class: 'qdot sub' }), 'たのまれごと'),
    el('span', { class: 'lg' }, el('i', { class: 'qdot ready' }), '報告できる'));
  box.append(...[head, cv, qlg, mapLegend(game)].filter(Boolean), el('div', { class: 'small muted', text: `赤い点: 自分　黄色: パーティー　青: 家族　（${game.input.touch ? 'タップで閉じる' : 'B/Xで閉じる'}）` }));
  document.getElementById('ui').append(back, box);
  renderMiniMap(game, cv, true);
  const iv = setInterval(() => renderMiniMap(game, cv, true), 400);
  const h = { el: box, onNav: (a) => { if (a === 'b' || a === 'a' || a === 'map') close(); } };
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
