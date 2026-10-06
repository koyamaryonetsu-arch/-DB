// フィールドの メニュー
import { el, ListMenu, toast, confirmBox, bar, esc } from './dom.js?v=e75f2660bf18';
import { ITEMS, SLOTS, SLOT_NAMES, ITEM_SORTS, sortItemIds } from '../../shared/data/items.js?v=e75f2660bf18';
import { ABILITIES, ELEMENT_NAMES, ELEMENT_ORDER, abilityRole } from '../../shared/data/abilities.js?v=e75f2660bf18';
import { affinityOf, normBattleSettings, BATTLE_SPEEDS, TEXT_SPEEDS, turnSeconds } from '../../shared/battle.js?v=e75f2660bf18';
import { battleFontPref, battleDensityPref, setBattleFontPref, setBattleDensityPref, UI_FONTS, uiFontPref, setUiFontPref, uiFontFamily } from '../prefs.js?v=e75f2660bf18';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, TIER_NAMES } from '../../shared/data/jobs.js?v=e75f2660bf18';
import { computeStats, learnedAbilities, mpCost, penaltyFor, expForLevel, comboAllowed, comboJobNames, jobProgress, hiraProgress, monsterSlots, canEquipChar, MAX_LEVEL } from '../../shared/stats.js?v=e75f2660bf18';
import { HIRAMEKI } from '../../shared/data/hirameki.js?v=e75f2660bf18';
import { DUAL_TECHS, DUAL_ORDER, groupName, dualKnown } from '../../shared/data/dual.js?v=e75f2660bf18';
import { MONSTERS } from '../../shared/data/monsters.js?v=e75f2660bf18';
import { monsterDrops } from '../../shared/data/loot.js?v=e75f2660bf18';
import { MONSTER_FRIENDS, RACE_NAMES, recipeHint, joinTier } from '../../shared/data/companions.js?v=e75f2660bf18';
import { TACTICS } from '../../shared/ai.js?v=e75f2660bf18';
import { PLACES } from '../../shared/maps/overworld.js?v=e75f2660bf18';
import { SEA_PLACES } from '../../shared/maps/ch2.js?v=e75f2660bf18';
import { MAPS, tileAt, effectiveTile } from '../../shared/maps/index.js?v=e75f2660bf18';
import { T, TILE_INFO } from '../../shared/tiles.js?v=e75f2660bf18';
import { itemDetail, abilityDetail, skillBrief, gearText, targetTag, statChanges, statChangesHtml } from './info.js?v=e75f2660bf18';
import { bestEquipPlan } from '../../shared/equip-plan.js?v=e75f2660bf18';
import { makeCanvas, ctxOf } from '../render/pixel.js?v=e75f2660bf18';
import { monsterCanvas } from '../render/monsters.js?v=e75f2660bf18';
import { mapIconCanvas, boardIconURL } from '../render/boards.js?v=e75f2660bf18';
import { medalItemRow, walletView } from './casino.js?v=e75f2660bf18';
import { compareTeam, whoItems } from './counter.js?v=e75f2660bf18';
import { faceURL } from '../field.js?v=e75f2660bf18';
import { partyRows } from './hud.js?v=e75f2660bf18';
import { questMarks, subQuests, OBJECTIVE_TARGETS, whereName } from '../../shared/data/quest-targets.js?v=e75f2660bf18';
import { difficultyOf, visibleMarks, EXP_RATES, EXP_RATE_NAMES } from '../../shared/data/difficulty.js?v=e75f2660bf18';
import { memberTalk, talkFor } from '../../shared/data/party-talk.js?v=e75f2660bf18';
import { treasureRows, treasureDetail, openTreasureMap } from './treasure.js?v=e75f2660bf18';
import { themeHex } from '../render/themes.js?v=e75f2660bf18';
import { wagonMenuView, wagonHereClient, menuArrange } from './wagon.js?v=e75f2660bf18';
import { readErrLog, errLogText, clearErrLog } from '../errlog.js?v=e75f2660bf18';
import { fieldUsableAbilities } from '../../shared/fieldskills.js?v=e75f2660bf18';

// 呪文・技の タブ（左右で じゅんに かわる）
// 今使える: フィールドで 使える 技だけ（回復・ルーラ など。えらぶと すぐ 使う）
const SKILL_TABS = [['list', '覚えた技'], ['now', '今使える'], ['fav', 'お気に入り'], ['combo', 'ひらめき'], ['dual', '合体技']];

const MAIN = [
  { label: 'はなす', value: 'talk' },
  { label: '道具', value: 'items' },
  { label: '呪文・技', value: 'skills' },
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
    this.trail = [];
    this.view = null;
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
    // えらんだ コマンドの 見出し（スマホの たてむきでは、コマンドの かわりに これだけ 出る。CSS の .sub-open）
    this.titleText = el('span', { class: 'fm-tt' });
    this.titleBar = el('div', { class: 'fm-title' },
      el('button', { class: 'btn fm-back', text: '← もどる', 'aria-label': 'もどる', onclick: (e) => { e.stopPropagation(); this.titleBack(); } }),
      this.titleText);
    this.side.append(this.titleBar);
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

  // コマンドを えらんで 中の 画面に 入った（true）／コマンドの 一覧に もどった（false）
  // スマホの たてむきでは 画面が かわる（コマンドの 一覧を かくして、見出しと もどる だけに）
  setSubOpen(on) {
    if (!this.root) return;
    this.root.classList.toggle('sub-open', !!on);
    if (on) this.titleText.textContent = MAIN.find((m) => m.value === this.current)?.label || '';
  }

  // 見出しの「← もどる」（Bボタンと おなじ。えらぶ まどが 出ている ときは そちらが さき）
  titleBack() {
    if (this.popupOpen) return;
    if (this.sub?.active) this.sub.cancel();
    else if (!this.menu?.active) {
      this.sfx('cancel');
      this.back();
    }
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
    // みぎの 見本を かきなおすのは、ひだりの メニューを えらんでいる ときだけ
    // （装備・強さ・仲間の 中の 画面や、えらぶ まどが 出ている ときに、自分の 見本に かわって しまわないように）
    if (this.current && this.menu?.active) this.preview(this.current);
  }

  // ───── 画面の つみかさね（もどる で 一つ前の 画面へ。カーソルと スクロールも もとどおり） ─────
  // make: 画面を つくる 関数（えらべる 画面を かえす）。this.view が 今の 画面、this.trail が 前の 画面たち
  showView(make, start = -1, top = 0) {
    this.sub?.blur();
    this.sub = null;
    this.view = make;
    this.startIdx = start;
    const node = make();
    this.startIdx = -1;
    this.focusSub(node);
    if (this.root) this.main.scrollTop = top;
  }

  // ひだりの メニューから 入る（前の 画面は わすれる）
  openView(make) {
    this.trail = [];
    this.showView(make);
  }

  // 今の 画面の 上に つぎの 画面を のせる（もどる で 今の 画面に もどれる）
  pushView(make) {
    if (this.view) this.trail.push({ make: this.view, idx: this.sub ? this.sub.idx : -1, top: this.main.scrollTop });
    this.showView(make);
  }

  // 今の 画面を つくりなおす（装備を かえた あと など。カーソルの 場所は そのまま）
  redraw() {
    if (!this.root) return;
    if (!this.view) {
      if (this.menu.active) this.preview(this.current);
      return;
    }
    this.showView(this.view, this.sub ? this.sub.idx : -1, this.main.scrollTop);
  }

  back() {
    this.sub?.blur();
    this.sub = null;
    if (!this.root) return; // もう とじている（おくれて よばれた とき）
    // 一つ前の 画面が あれば そこへ（えらんでいた 人・スクロールも もとどおり）
    const prev = this.trail?.pop();
    if (prev) return this.showView(prev.make, prev.idx, prev.top);
    this.view = null;
    this.setSubOpen(false);
    this.menu.focus();
    this.preview(this.current);
    this.main.scrollTop = 0;
  }

  preview(v) {
    this.current = v;
    this.main.innerHTML = '';
    const g = this.game;
    // 道具・呪文・技の 中みは、えらんだ ときに はじめて 出す（カーソルを あわせた だけでは せつめいだけ）
    switch (v) {
      case 'items': this.main.append(el('div', { class: 'muted', text: '持っている道具を見る。\n使う・装備する・捨てる。宝の地図もここから見る。' })); break;
      case 'talk': this.main.append(el('div', { class: 'muted', text: '仲間と話す。次にどこへ行けばいいか、仲間がヒントをくれる。' })); break;
      case 'fullheal': this.main.append(el('div', { class: 'muted', text: 'みんなのHPを満タンにする。\n「呪文で」…回復の呪文を、MPのむだが少ない順に使う。\n「道具で」…薬草などを、むだが少ない順に使う。' })); break;
      case 'skills': this.main.append(el('div', { class: 'muted', text: '覚えた呪文・技を見る。\n回復やルーラなど、ここで使える技は「今使える」からすぐ使える。お気に入りのならびも決められる。' })); break;
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

  // じぶんの なかま（酒場の なかま・モンスター。馬車の 仲間も）
  myMates() {
    const g = this.game;
    return [...(g.party?.supports || []), ...(g.party?.wagon || [])].filter((x) => x.owner === g.me.id && x.kind !== 'family');
  }

  // key の キャラ（じぶん か なかま）を メニューで つかえる かたちに
  charOf(who) {
    const g = this.game;
    if (!who || who === 'self') return g.me;
    const x = [...(g.party?.supports || []), ...(g.party?.wagon || [])].find((m) => m.key === who && m.owner === g.me.id);
    if (!x) return null;
    return {
      key: x.key, name: x.name, level: x.level, exp: x.exp || 0, job: x.job, jobs: x.jobs || {}, equip: x.equip || {}, seeds: x.seeds || {},
      species: x.species || undefined, hp: x.hp, mp: x.mp, look: x.look, tactics: x.tactics, status: {}, companion: true,
      plus: x.plus || 0, bonus: x.bonus || undefined, inherit: x.inherit || undefined,
      hirameki: x.hirameki || [], skillUse: x.skillUse || {}, favorites: x.favorites || [],
      autoOff: x.autoOff || [],
    };
  }

  // だれの？（なかまが いる ときだけ）
  whoView(next) {
    const g = this.game;
    const box = el('div');
    const mates = this.myMates();
    const title = { skills: 'だれの呪文・技？', equip: 'だれの装備？', status: 'だれの強さ？' }[next] || 'だれ？';
    const items = [{ label: `${g.me.name}（自分）`, value: 'self', face: faceURL({ look: g.me.look, job: g.me.job, eq: g.me.equip }) },
      ...mates.map((m) => ({ label: `${m.name}（${m.species ? MONSTERS[m.species]?.name : JOBS[m.job]?.name} Lv${m.level}${m.wagon ? '・馬車' : ''}）`, value: m.key, face: faceURL({ look: m.look, job: m.job, eq: m.equip, mon: m.species || undefined }) }))];
    // 強さは「全員」を 一覧で くらべられる
    if (next === 'status') items.unshift({ label: '全員（一覧でくらべる）', value: '__all' });
    // 装備は「みんなさいきょう装備」も ここ（だれかを えらぶ ときと おなじ 場所）
    if (next === 'equip' && mates.length) items.push({ label: 'みんなさいきょう装備', value: '__bestAll', cls: 'best-all' });
    const m = this.mkSub({
      items,
      // つぎの 画面は 上に のせる（もどる で この リストの おなじ 人に もどる）
      onSelect: async (it) => {
        if (it.value === '__bestAll') {
          // いきなり 変えずに「何が 何に 変わるか」を 見せてから えらぶ
          this.sub.blur();
          const done = await this.bestEquipAsk('all');
          setTimeout(() => this.redraw(), done ? 250 : 0);
          return;
        }
        this.pushView(() => (it.value === '__all' ? this.allStatusView(true)
          : next === 'skills' ? this.skillsView(true, it.value) : next === 'equip' ? this.equipView(true, it.value) : this.statusView(it.value, true)));
      },
    });
    box.append(el('div', { class: 'small gold', text: title }), m.root);
    if (next === 'equip' && mates.length) box.append(el('div', { class: 'detail', text: '「みんなさいきょう装備」…自分と仲間みんなを、ならびの順にさいきょう装備にする（何が何に変わるかを見てから決められる）' }));
    return box;
  }

  // パーティーに 自分 いがいの 人（家族・なかま・ゲスト）が いるか
  hasOthers() {
    const p = this.game.party;
    return !!p && ((p.members || []).length > 1 || (p.supports || []).length > 0 || (p.guests || []).length > 0);
  }

  select(v) {
    const g = this.game;
    this.trail = [];
    this.view = null;
    if (['skills', 'equip'].includes(v) && this.myMates().length) return this.openView(() => this.whoView(v));
    if (v === 'status' && (this.myMates().length || this.hasOthers())) return this.openView(() => this.whoView(v));
    switch (v) {
      case 'items': return this.focusSub(this.itemsList(true));
      case 'skills': return this.focusSub(this.skillsView(true));
      case 'equip': return this.openView(() => this.equipView(true));
      case 'party': return this.openView(() => this.partyView(true));
      case 'tactics': return this.openView(() => this.tacticsView(true));
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
      this.setSubOpen(true);
      this.sub.focus();
    }
  }

  mkSub(opts) {
    // 画面を つくりなおす ときは まえの カーソルの 場所から（showView の start）
    const start = this.startIdx ?? -1;
    this.startIdx = -1;
    this.sub = new ListMenu(this.game.input, { sound: this.sfx, onCancel: () => this.back(), start, ...opts });
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
    // 素材（ふしぎなかじで 使う）には しるし
    const items = sortItemIds(c.items.map((e) => e.id), mode).map((id) => ({ label: ITEMS[id].name, html: ITEMS[id].type === 'mat' ? `${esc(ITEMS[id].name)}<span class="tag mat">素材</span>` : undefined, right: `×${counts.get(id)}`, value: id }));
    for (const k of c.keyItems) items.push({ html: `${ITEMS[k].name}<span class="tag gold">大事</span>`, value: k, key: true });
    items.push(...treasureRows(c)); // 宝の地図
    const medal = medalItemRow(c);
    if (medal) items.push(medal);
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
    // じぶんの モンスターの なかま（装備できる 子の 名前を せつめいに 出す）
    const mons = this.myMates().filter((x) => x.species).map((x) => ({ name: x.name, species: x.species }));
    const m = this.mkSub({
      items,
      onMove: (it) => { detail.textContent = it ? (it.tmap ? treasureDetail(g, it.tmap) : itemDetail(it.value, mons)) : ''; },
      onSelect: (it) => this.itemAction(it),
    });
    box.append(tabs, m.root, detail);
    return box;
  }

  async itemAction(entry) {
    const g = this.game;
    if (entry.tmap) return openTreasureMap(this, entry.tmap);
    const it = ITEMS[entry.value];
    // 風の笛（大鳥フウラを 呼ぶ。sky.js）
    if (it.flute) {
      this.sub.blur();
      const act = await this.pick(`${it.name}をどうする？`, [{ label: 'ふく', value: 'use' }, { label: 'やめる', value: null }]);
      if (act === 'use') {
        this.close();
        g.sky.call();
        return;
      }
      setTimeout(() => { if (this.root) this.focusSub(this.itemsList(true)); }, 150);
      return;
    }
    if (entry.key || it.type === 'key') return;
    const acts = [];
    if (it.type === 'use' && it.field) acts.push({ label: '使う', value: 'use' });
    const team = ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type) ? compareTeam(g, entry.value) : null;
    if (team) acts.push({ label: '装備する', value: 'equip', disabled: !team.some((r) => r.can && !r.same) });
    acts.push({ label: '捨てる', value: 'drop' }, { label: 'やめる', value: 'cancel' });
    this.sub.blur();
    const act = await this.pick(`${it.name}をどうする？`, acts);
    if (act === 'use') {
      if (it.effect.type === 'warp' && MAPS[g.field?.mapId]?.noEscape) {
        // 王家のピラミッドの 中: 帰り道の羽は 使えない（行き先を えらばずに サーバーへ。わけを 出す）
        g.net.send({ t: 'menu', action: 'useItem', id: entry.value });
      } else if (it.effect.type === 'warp') {
        const place = await this.pick('どこへ飛ぶ？', [...this.warpChoices(), { label: 'やめる', value: null }]);
        if (place) {
          g.net.send({ t: 'menu', action: 'useItem', id: entry.value, place });
          this.close();
          return;
        }
      } else if (it.effect.type === 'exit') {
        // みちびきの糸: 洞窟の 中なら 入り口の 外へ（メニューを とじて 外を 見せる）
        g.net.send({ t: 'menu', action: 'useItem', id: entry.value });
        const m = MAPS[g.field?.mapId];
        if (m?.kind === 'dungeon' && !m.indoor && !m.noEscape) {
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

  // 帰り道の羽・ルーラの 行き先（行った ことの ある 町・村・港）
  // パーティーの ときは リーダーが 行った ことの ある 場所（リーダーと おなじ。サーバーの world/travel.js warpOwner）
  warpChoices() {
    const g = this.game;
    const helper = g.worldVisited && g.party && g.party.leader !== g.sid;
    const been = helper ? g.worldVisited : new Set(Object.keys(g.me.visited || {}).filter((k) => g.me.visited[k]));
    return Object.entries({ ...PLACES, ...SEA_PLACES }).filter(([id]) => been.has(id) && id !== 'shrine').map(([id, p]) => ({ label: p.name, value: id }));
  }

  // 不具合の 記録（この 端末の さいきんの もの）。コピーして 家族に 送れる
  errLogPopup() {
    const g = this.game;
    return new Promise((resolve) => {
      const text = errLogText();
      const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => done() });
      const ta = el('textarea', { class: 'errlog-text', readonly: true });
      ta.value = text || '記録はありません（不具合はおきていません）';
      const box = el('div', { class: 'win panel center-panel', style: { width: 'min(94vw, 560px)', zIndex: 5, background: 'var(--win-solid)' } },
        el('div', { class: 'small gold', text: '不具合の記録（動けなくなった時などに、家族に送ってください）' }), ta);
      const copy = () => {
        const ok = () => toast('コピーしました。LINEなどにはりつけて送れます');
        const manual = () => {
          ta.focus({ preventScroll: true });
          ta.select();
          let r = false;
          try { r = document.execCommand('copy'); } catch { /* */ }
          toast(r ? 'コピーしました。LINEなどにはりつけて送れます' : '文字を長おしして、コピーしてください');
        };
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(ok, manual);
        else manual();
      };
      const m = new ListMenu(g.input, {
        items: [{ label: 'コピーする', value: 'copy', disabled: !text }, { label: '記録を消す', value: 'clear', disabled: !text }, { label: '閉じる', value: null }],
        sound: this.sfx,
        back: null,
        onSelect: (it) => {
          if (it.value === 'copy') return copy();
          if (it.value === 'clear') {
            clearErrLog();
            toast('記録を消しました');
          }
          done();
        },
        onCancel: () => done(),
      });
      box.append(m.root);
      document.getElementById('ui').append(back, box);
      this.popupOpen = true;
      m.focus();
      const done = () => {
        m.blur();
        back.remove();
        box.remove();
        this.popupOpen = false;
        resolve();
      };
    });
  }

  // body: リストの 上に 出す 中み（さいきょう装備の 見こみ など）。その ときは えらびしを 横に ならべ、上下で 中みを スクロール
  pick(title, items, { wide = false, cls = '', body = null } = {}) {
    const g = this.game;
    return new Promise((resolve) => {
      const hasCancel = items.some((i) => i.value === null || i.value === 'cancel');
      const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => { this.sfx('cancel'); done(null); } });
      const box = el('div', { class: `win panel center-panel ${cls}`, style: { width: wide ? 'min(94vw, 560px)' : 'min(86vw, 380px)', zIndex: 5, background: 'var(--win-solid)' } }, el('div', { class: 'small gold', text: title }));
      const m = new ListMenu(g.input, {
        items,
        cols: body ? 2 : 1,
        sound: this.sfx,
        back: hasCancel ? null : 'やめる',
        onSelect: (it) => done(it.value),
        onCancel: () => done(null),
      });
      if (body) {
        const nav = m.nav.bind(m);
        m.nav = (a, rep) => {
          if (a !== 'up' && a !== 'down') return nav(a, rep);
          body.scrollTop += (a === 'up' ? -1 : 1) * Math.max(40, body.clientHeight * 0.6);
        };
        box.append(body);
      }
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
    // 馬車の 仲間（馬車が いっしょの とき。洞窟・塔の 中では 入り口で 待っている）
    if (wagonHereClient(g)) for (const w of p?.wagon || []) out.push({ label: fmt(`${w.name}（馬車）`, w.hp, w.maxHp, w.mp, w.maxMp), value: 'wagon:' + w.key, hp: w.hp });
    return out.map((o) => ({ ...o, disabled: dead ? o.hp > 0 : o.hp <= 0 }));
  }

  pickTarget(title, dead = false) {
    return this.pick(title, [...this.partyRefs(dead), { label: 'やめる', value: null }]);
  }

  // ───── じゅもん・とくぎ ─────
  // 呪文・技: 「覚えた技・今使える・お気に入り・ひらめき・合体技」の タブ。上下で えらび、左右で タブを かえる
  skillsView(active, who = 'self') {
    const g = this.game;
    const c = this.charOf(who) || g.me;
    const box = el('div', { class: 'skills-view' });
    if (c.companion) box.append(el('div', { class: 'gold small', text: `${c.name}の呪文・技　MP ${c.mp}` }));
    const learned = learnedAbilities(c);
    const detail = el('div', { class: 'detail' });
    const mode = SKILL_TABS.some(([k]) => k === this.skillMode) ? this.skillMode : 'list';
    const go = (m) => { this.skillMode = m; this.focusSub(this.skillsView(true, who)); };
    const side = (d) => {
      const i = SKILL_TABS.findIndex(([k]) => k === mode);
      this.sfx?.('cursor');
      go(SKILL_TABS[(i + d + SKILL_TABS.length) % SKILL_TABS.length][0]);
    };
    // タブは スクロールしても 上に のこる
    const head = el('div', { class: 'sk-head' },
      el('div', { class: 'tabs' }, ...SKILL_TABS.map(([id, label]) => el('button', { class: `btn ${mode === id ? 'sel' : ''}`, text: label, onclick: () => go(id) }))),
      active ? el('div', { class: 'tab-hint', text: '◀ ▶（左右）でタブを切りかえ' }) : null);
    box.append(head);
    // タブが 2行に なっても（せまい スマホ）えらんだ 行が タブの 下に かくれないように、見出しの 高さを はかる（CSS の scroll-margin-top）
    if (active && typeof ResizeObserver === 'function') {
      new ResizeObserver(() => { if (head.offsetHeight) box.style.setProperty('--sk-head-h', `${head.offsetHeight + 12}px`); }).observe(head);
    }
    // 上下で えらぶ リスト（左右で タブ）
    const list = (items, opts = {}) => {
      const m = this.mkSub({ items, onSide: side, ...opts });
      box.append(m.root);
      return m;
    };
    const backOnly = () => list([{ label: 'もどる', value: 'back' }], { onSelect: () => this.back() });
    // ひらめき・合体技: 1つずつ 上下で 見られる（えらんでも なにも しない）
    const rows = (rs) => {
      if (active && rs.length) list(rs.map((r) => ({ html: r.html, value: r.id, cls: `sk-row ${r.cls || ''}` })), { onSelect: () => {} });
      else for (const r of rs) box.append(el('div', { class: `combo-row ${r.cls || ''}`, html: r.html }));
      if (active && !rs.length) backOnly();
    };
    // 使う（ルーラは 行き先、回復などは だれに を えらんで サーバーへ）。おわったら この タブに もどる
    const useSkill = async (id) => {
      const a = ABILITIES[id];
      // ルーラ: 行き先を えらぶ（洞窟や 塔の 中では そのまま 唱えて 天井に ぶつかる）
      if (a.effect?.type === 'warp') {
        const inField = g.field.map?.kind === 'field';
        const place = inField ? await this.pick(`${a.name}：どこへ飛ぶ？`, [...this.warpChoices(), { label: 'やめる', value: null }]) : '';
        if (place !== null) {
          g.net.send({ t: 'menu', action: 'cast', id, place, who });
          if (place) { this.close(); return; }
        }
        if (this.root) this.focusSub(this.skillsView(true, who));
        return;
      }
      let ref = 'self';
      if (a.target === 'self' && c.companion) ref = 'sup:' + c.key;
      else if (a.target !== 'allies' && a.target !== 'self') ref = await this.pickTarget(`だれに${a.name}？`, a.target === 'deadAlly');
      if (ref) g.net.send({ t: 'menu', action: 'cast', id, ref, who });
      setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
    };
    if (mode === 'now') {
      // 今使える: フィールドで 使える 技だけ（shared/fieldskills.js）。MPが 足りない 技は 出すが えらべない。えらぶと すぐ 使う
      // 呪文が ふうじられた 場所（王家のピラミッド 2階）: 呪文は 出すが えらべない（特技は 使える）
      const sealed = !!g.field?.map?.noSpells;
      const now = fieldUsableAbilities(c, { mapKind: g.field?.map?.kind, noSpells: sealed });
      const why = { mp: 'MPが足りない', dead: '死んでいる', seal: '呪文がふうじられている' };
      if (!now.length) {
        box.append(el('div', { class: 'muted', text: '今ここで使える呪文・技はない。\n回復の呪文などを覚えると、ここからすぐ使える。' }));
        if (active) backOnly();
        return box;
      }
      if (!active) {
        for (const x of now) box.append(el('div', { class: 'sk-mini' }, el('span', { class: x.ok ? 'nm' : 'nm muted', text: ABILITIES[x.id].name }), el('span', { class: 'muted small', text: `　MP${x.cost}　${skillBrief(ABILITIES[x.id])}` })));
        return box;
      }
      const showNow = (it) => {
        const x = now.find((n) => n.id === it?.value);
        detail.textContent = x ? `${abilityDetail(x.id, c)}${x.ok ? '' : `\n（${why[x.why]}）`}` : '';
      };
      const m = list(now.map((x) => {
        const a = ABILITIES[x.id];
        const tt = targetTag(a);
        return {
          html: `${esc(a.name)}${tt ? `<span class="tag tgt t-${a.target}">${tt}</span>` : ''}${x.ok ? '' : `<span class="tag muted">${why[x.why]}</span>`}<span class="sk-desc">${esc(skillBrief(a))}</span>`,
          right: `MP${x.cost}`,
          rightCls: x.ok ? '' : 'dis',
          value: x.id,
          cls: `k-${abilityRole(a)} sk`,
          disabled: !x.ok,
        };
      }), {
        onMove: showNow,
        onSelect: (it) => {
          this.sub.blur();
          useSkill(it.value);
        },
      });
      showNow(m.current);
      box.append(el('div', { class: 'small muted', text: `${c.name}のMP ${c.mp}　選ぶとすぐ使う` }), detail);
      if (sealed) box.append(el('div', { class: 'small gold', text: 'ここでは呪文がふうじられている。特技と道具は使える。' }));
      return box;
    }
    if (mode === 'combo') {
      // ひらめき: 関係する 技を 何回も 使うと、使った しゅんかんに ひらめく
      const known = new Set(learned);
      const use = c.skillUse || {};
      const order = Object.keys(HIRAMEKI).filter((id) => ABILITIES[id]).sort((x, y) => (known.has(y) ? 1 : 0) - (known.has(x) ? 1 : 0));
      rows(order.map((id) => {
        const a = ABILITIES[id];
        const ok = known.has(id);
        const reqs = Object.entries(HIRAMEKI[id].from).map(([k, n]) => {
          const seen = k === '@atk' || known.has(k) || use[k] > 0;
          const nm = k === '@atk' ? 'ふつうの攻撃' : seen ? ABILITIES[k]?.name : '？？？';
          return `${nm} ${seen ? Math.min(use[k] || 0, n) : '?'}/${n}回`;
        }).join('　');
        const prog = hiraProgress(c, id);
        const whoText = a.kind === 'combo' ? `使える職業: ${comboJobNames(id).join('・')}（とその超級職）` : `${JOBS[a.job]?.name || ''}の技（${JOBS[a.job]?.name || ''}とそこから進んだ職業でひらめく）`;
        const tag = ok ? '<span class="tag good">ひらめいた</span>' : prog >= 1 ? '<span class="tag gold">もうすぐ！</span>' : '';
        return {
          id, cls: ok ? '' : 'locked',
          html: `<span class="nm">${ok ? esc(a.name) : '？？？？'}</span>${tag}<span class="ln">${esc(reqs)}</span><span class="ln gold">${esc(whoText)}</span>${ok ? `<span class="ln muted">${esc(skillBrief(a))}</span>` : ''}`,
        };
      }));
      box.append(el('div', { class: 'detail', text: '技を使うたびに回数がふえる。書いてある回数をこえると、その技を使ったしゅんかんに、ひらめくことがある（ひらめいた技がそのまま出る）。\n掛け合わせ技は、元になった職業を合わせ持つ上級職からひらめく。神殿の「ひらめきの賢者」がヒントを教えてくれる。' }));
      return box;
    }
    if (mode === 'fav') {
      // お気に入り: 戦いの 呪文・特技の いちばん 上に この じゅんで 出る
      const favs = (c.favorites || []).filter((id) => ABILITIES[id] && learned.includes(id));
      if (!favs.length) box.append(el('div', { class: 'muted', text: 'まだお気に入りはない。「覚えた技」で技を選んで「お気に入りに入れる」を選ぼう。' }));
      if (active && favs.length) {
        list(favs.map((id, i) => ({ html: `<span class="muted small">${i + 1}.</span> ${esc(ABILITIES[id].name)}<span class="sk-desc">${esc(skillBrief(ABILITIES[id]))}</span>`, value: id, right: ABILITIES[id].kind === 'spell' ? '呪文' : '特技', cls: 'sk' })), {
          onSelect: async (it) => {
            this.sub.blur();
            const op = await this.pick(`${ABILITIES[it.value].name}`, [{ label: '▲ 上へ', value: 'up' }, { label: '▼ 下へ', value: 'down' }, { label: 'お気に入りからはずす', value: 'remove' }, { label: 'やめる', value: null }]);
            if (op) this.sendFav(c, who, it.value, op);
            setTimeout(() => { if (this.root) this.focusSub(this.skillsView(true, who)); }, 200);
          },
        });
      } else if (favs.length) box.append(el('div', { class: 'small', text: favs.map((id) => ABILITIES[id].name).join('、') }));
      else if (active) backOnly();
      box.append(el('div', { class: 'detail', text: '戦いで呪文・特技を開くと、いちばん上の「お気に入り」の窓にこのじゅんで出る。選ぶと、上へ・下へでならびを変えられる。' }));
      return box;
    }
    if (mode === 'dual') {
      // 合体技: 2人の 番を 使う 技
      rows(DUAL_ORDER.map((id) => {
        const t = DUAL_TECHS[id];
        // はじめて 使う までは 効果は ひみつ
        const known = dualKnown(c, id) || dualKnown(g.me, id);
        return {
          id, cls: known ? '' : 'unknown',
          html: `<span class="nm">${esc(t.name)}</span><span class="tag gold">MP ${t.mp[0]}＋${t.mp[1]}</span>${known ? '' : '<span class="tag muted">まだ使っていない</span>'}<span class="ln">${esc(`${groupName(t.need[0])} ＋ ${groupName(t.need[1])}（2人で1つずつ）`)}</span><span class="ln muted">${known ? esc(t.desc) : '効果は？？？（一度使うとわかる）'}</span>`,
        };
      }));
      box.append(el('div', { class: 'detail', text: '合体技は、2人の番を使う技。自分のゲージがたまった時に「合体技」から選んでおく。いっしょに出す仲間のゲージがたまっていればすぐ、まだの時は「よやく」して、仲間のゲージがたまった時にいっしょに出す。\nどんな効果かは、一度使うまでわからない。家族のキャラと出す時は、相手の画面に「参加する？」と出る。' }));
      return box;
    }
    const items = learned.map((id) => {
      const a = ABILITIES[id];
      const p = penaltyFor(c, id);
      const locked = a.kind === 'combo' && !comboAllowed(c, id);
      const elm = a.effect?.element;
      // 相手の しるし（グループ・全体・全員・ランダム）
      const tt = targetTag(a);
      return {
        html: `${ELEMENT_NAMES[elm] ? `<span class="elem e-${elm}">${ELEMENT_NAMES[elm]}</span>` : ''}${esc(a.name)}${tt ? `<span class="tag tgt t-${a.effect?.random ? 'random' : a.target}">${tt}</span>` : ''}${a.kind === 'combo' ? `<span class="tag ${locked ? 'muted' : 'gold'}">掛け合わせ${locked ? '（上級職で）' : ''}</span>` : a.hirameki ? '<span class="tag hira">ひらめき</span>' : ''}${p.penalized ? '<span class="tag warn">他</span>' : ''}<span class="sk-desc">${esc(skillBrief(a))}</span>`,
        right: a.effect.type === 'mahouken' ? '' : `MP${mpCost(c, id)}`,
        rightCls: p.penalized ? 'pen' : '',
        value: id,
        cls: `k-${abilityRole(a)} sk`,
        disabled: false,
      };
    });
    if (!items.length) {
      box.append(el('div', { class: 'muted', text: 'まだ何も覚えていない。' }));
      if (active) backOnly();
      return box;
    }
    if (!active) {
      for (const id of learned.slice(0, 12)) box.append(el('div', { class: 'sk-mini' }, el('span', { class: 'nm', text: ABILITIES[id].name }), el('span', { class: 'muted small', text: `　${skillBrief(ABILITIES[id])}` })));
      if (learned.length > 12) box.append(el('div', { class: 'small muted', text: `ほか${learned.length - 12}こ` }));
      box.append(el('div', { class: 'detail', text: '「他」は今の職業以外で覚えた技。MPが増えたり、威力が下がったりする。' }));
      return box;
    }
    const showDetail = (it) => { detail.textContent = it ? `${abilityDetail(it.value, c)}\n使った回数: ${c.skillUse?.[it.value] || 0}回` : ''; };
    const m = list(items, {
      onMove: showDetail,
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
        await useSkill(it.value);
      },
    });
    showDetail(m.current);
    box.append(el('div', { class: 'small muted', text: '選ぶと「使う（フィールドで使える技）」「お気に入り」を選べる' }), detail);
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
    const mons = this.myMates().filter((x) => x.species).map((x) => ({ name: x.name, species: x.species }));
    // モンスターの なかまは しゅぞくで 装備できる 部位が きまる（ドラクエ5 ふう。今 何か 装備している 部位は 出す）
    const slots = c.species ? SLOTS.filter((sl) => monsterSlots(c.species).includes(sl) || c.equip?.[sl]) : SLOTS;
    const items = slots.map((sl) => ({ label: `${SLOT_NAMES[sl]}：${c.equip?.[sl] ? ITEMS[c.equip[sl]].name : 'なし'}`, value: sl }));
    // ドラクエの「さいきょう装備」: ふくろの 中で いちばん 強い ものを まとめて 装備
    // （「みんなさいきょう装備」は だれの装備？ の 一覧に ある。whoView）
    items.push({ label: 'さいきょう装備', value: '__best' });
    if (c.companion) box.append(el('div', { class: 'gold small', text: `${c.name}の装備` }));
    // 魔物の 装備できる 物（リストの 下に。リストが 画面から はみ出さない ように）
    const gear = c.species ? el('div', { class: 'small muted', text: `装備できる物: ${gearText(c.species)}` }) : null;
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(stats, ...(gear ? [gear] : []));
      return box;
    }
    const m = this.mkSub({
      items,
      onMove: (it) => {
        if (it.value === '__best') detail.textContent = 'ふくろの中から、攻撃力・守備力がいちばん上がる武器・よろい・たて・かぶとを選ぶ（アクセサリーはそのまま）\n何が何に変わるかを見てから、決められる';
        else detail.textContent = c.equip?.[it.value] ? `E ${ITEMS[c.equip[it.value]].name}（装備している）\n${itemDetail(c.equip[it.value], mons)}` : '';
      },
      onSelect: async (it) => {
        const slot = it.value;
        if (slot === '__best') {
          // いきなり 変えずに「何が 何に 変わるか」を 見せてから えらぶ
          this.sub.blur();
          const done = await this.bestEquipAsk(who);
          setTimeout(() => this.redraw(), done ? 250 : 0);
          return;
        }
        this.sub.blur();
        const changed = await this.pickGear(c, who, slot);
        // おなじ 部位に カーソルを おいた まま つくりなおす
        setTimeout(() => this.redraw(), changed ? 200 : 0);
      },
    });
    box.append(m.root, stats, ...(gear ? [gear] : []), detail);
    return box;
  }

  // 1つの 部位を えらぶ まど。出すのは 装備できる 物だけ（ふくろの 物と、ほかの 仲間が 装備している 物）。
  // 仲間が 装備している 物を えらぶと「装備を入れかえる？」→ はい で 入れかえ（サーバーの swapEquip）。
  // 1つの 物を 2行で: 名前 ／ 変わる 強さ（上がる ものも 下がる ものも。いつも おなじ じゅん）。変えたら true
  async pickGear(c, who, slot) {
    const g = this.game;
    const cur = c.equip?.[slot] || null;
    const before = computeStats(c);
    const changes = (id) => statChanges(before, computeStats({ ...c, equip: { ...(c.equip || {}), [slot]: id } }));
    const row = (name, tag, list) => `<span class="eq-nm">${esc(name)}${tag ? `<span class="tag eq-tag">${esc(tag)}</span>` : ''}</span><span class="eq-sc">${statChangesHtml(list)}</span>`;
    const opts = [];
    const seen = new Set();
    for (const e of g.me.items) {
      const it = ITEMS[e.id];
      if (it?.type !== slot || seen.has(e.id) || !canEquipChar(c, e.id)) continue;
      seen.add(e.id);
      opts.push({ html: row(it.name, e.n > 1 ? `×${e.n}` : '', changes(e.id)), value: e.id, cls: 'eq-opt' });
    }
    // 自分と 仲間（パーティー・馬車）が 装備している 物
    const others = this.teamChars().filter((m) => m.key !== who);
    for (const m of others) {
      const id = m.char.equip?.[slot];
      if (!id || !ITEMS[id] || !canEquipChar(c, id)) continue;
      opts.push({ html: row(ITEMS[id].name, `${m.char.name}が装備中`, changes(id)), value: `swap:${m.key}`, cls: 'eq-opt eq-swap' });
    }
    if (!opts.length) opts.push({ header: true, label: '装備できる物を持っていない', cls: 'eq-none' });
    if (cur) opts.push({ html: row('外す', '', changes(null)), value: '__off', cls: 'eq-opt' });
    opts.push({ label: 'やめる', value: null });
    const pick = await this.pick(`${c.companion ? c.name + 'の' : ''}${SLOT_NAMES[slot]}を選ぶ（今：${cur ? ITEMS[cur].name : 'なし'}）`, opts, { wide: true, cls: 'eq-pick' });
    if (!pick) return false;
    if (pick === '__off') {
      g.net.send({ t: 'menu', action: 'unequip', slot, who });
      return true;
    }
    if (pick.startsWith('swap:')) {
      const m = others.find((x) => `swap:${x.key}` === pick);
      const id = m?.char.equip?.[slot];
      if (!id) return false;
      // 相手は 自分の 今の 装備を 受けとる（装備できない ときは ふくろへ）
      const back = !!cur && canEquipChar(m.char, cur);
      const body = el('div', { class: 'eq-swap-body' },
        el('div', { text: `${c.name}：${cur ? ITEMS[cur].name : 'なし'} → ${ITEMS[id].name}` }),
        el('div', { text: `${m.char.name}：${ITEMS[id].name} → ${back ? ITEMS[cur].name : 'なし'}` }),
        ...(cur && !back ? [el('div', { class: 'muted small', text: `（${ITEMS[cur].name}は${m.char.name}には装備できないので、ふくろにしまう）` })] : []));
      const ok = await this.pick(`${m.char.name}が装備している。\n装備を入れかえる？`, [{ label: 'はい', value: 'yes' }, { label: 'いいえ', value: null }], { body, cls: 'eq-swap-pop' });
      if (ok !== 'yes') return false;
      g.net.send({ t: 'menu', action: 'swapEquip', slot, who, from: m.key });
      return true;
    }
    g.net.send({ t: 'menu', action: 'equip', id: pick, who });
    return true;
  }

  // 自分と 自分の 仲間（パーティー・馬車）。装備の 入れかえで 使う
  teamChars() {
    return [{ key: 'self', char: this.game.me }, ...this.myMates().map((x) => ({ key: x.key, char: this.charOf(x.key) })).filter((m) => m.char)];
  }

  // さいきょう装備で きめる じゅんばん（サーバーの ownTeamChars と おなじ: ならびの じゅん。馬車の 仲間は 入らない）
  bestTeam() {
    const g = this.game;
    const sups = (g.party?.supports || []).filter((x) => x.owner === g.me.id && x.kind !== 'family')
      .map((x) => ({ key: x.key, char: this.charOf(x.key) })).filter((m) => m.char);
    const pos = Math.max(0, Math.min(sups.length, Number.isInteger(g.me.selfPos) ? g.me.selfPos : 0));
    return [...sups.slice(0, pos), { key: 'self', char: g.me }, ...sups.slice(pos)];
  }

  // さいきょう装備: 何が 何に 変わるかを 見せてから「これにする／変えない」（shared/equip-plan.js）。変えたら true
  async bestEquipAsk(who) {
    const g = this.game;
    const all = who === 'all';
    const team = all ? this.bestTeam() : [{ key: who, char: this.charOf(who) || g.me }];
    const plan = bestEquipPlan(team, g.me);
    if (!plan.length) {
      await this.pick(all ? 'みんな、もういちばん強い装備をしている。\n（変わる物はない）' : `${team[0].char.name}は、もういちばん強い装備をしている。\n（変わる物はない）`, [{ label: 'もどる', value: null }]);
      return false;
    }
    const body = el('div', { class: 'bp-body scroll' });
    for (const p of plan) {
      const sec = el('div', { class: 'bp-who' }, el('div', { class: 'bp-name', text: p.name }));
      // 武器：鉄の剣 → はがねの剣
      for (const x of p.changes) {
        sec.append(el('div', { class: 'bp-ch' }, el('span', { class: 'k', text: `${SLOT_NAMES[x.slot]}：` }),
          el('span', { class: 'from', text: x.from ? ITEMS[x.from].name : 'なし' }), el('span', { class: 'ar', text: '→' }), el('span', { class: 'to', text: ITEMS[x.to].name })));
      }
      // 強さ: 上がる ものも 下がる ものも
      sec.append(el('div', { class: 'bp-st', html: statChangesHtml(statChanges(p.before, p.after)) }));
      body.append(sec);
    }
    const ok = await this.pick(all ? 'みんなをさいきょう装備にすると、こう変わる' : `${team[0].char.name}をさいきょう装備にすると、こう変わる`,
      [{ label: 'これにする', value: 'ok' }, { label: '変えない', value: null }], { wide: true, cls: 'bp-pop', body });
    if (ok !== 'ok') return false;
    g.net.send({ t: 'menu', action: 'bestEquip', who });
    return true;
  }

  // ───── つよさ ─────
  statusView(who = 'self', active = false) {
    const c = this.charOf(who) || this.game.me;
    const st = computeStats(c);
    const box = el('div');
    // レベルは 99まで（stats.js の MAX_LEVEL）
    const next = c.level >= MAX_LEVEL ? null : expForLevel(c.level + 1) - (c.exp || 0);
    const kind = c.species ? `${MONSTERS[c.species]?.name || ''}（モンスター）` : JOBS[c.job]?.name || '';
    box.append(el('h3', { text: `${c.name}　${kind}` }));
    const kv = (k, v, cls = '') => el('div', { class: 'kv' }, el('span', { class: 'k', text: k }), el('span', { class: cls, text: String(v) }));
    box.append(el('div', { class: 'twocol' },
      kv('レベル', c.level), kv('次のレベルまで', next === null ? `最大（Lv${MAX_LEVEL}）` : Math.max(0, next)),
      kv('HP', `${Math.max(0, c.hp)}/${st.maxHp}`), kv('MP', `${c.mp}/${st.maxMp}`),
      kv('力', st.str), kv('身の守り', st.def),
      kv('素早さ', st.agi), kv('攻撃魔力', st.mag),
      kv('回復魔力', st.heal), c.companion ? kv('作戦', TACTICS[c.tactics]?.name || '') : kv('ゴールド', c.gold),
      kv('攻撃力', st.atk, 'gold'), kv('守備力', st.dfn, 'gold')));
    if (c.species) {
      const f = MONSTER_FRIENDS[c.species];
      const learnList = el('div', { style: { marginTop: '0.6em' } }, el('div', { class: 'gold small', text: '覚える技（レベル）' }));
      for (const [l, id] of f?.learn || []) learnList.append(el('div', { class: `small ${c.level >= l ? 'good' : 'muted'}`, text: `Lv${l}　${ABILITIES[id]?.name || id}` }));
      box.append(learnList, el('div', { class: 'small', style: { marginTop: '0.4em' }, text: `装備できる物: ${gearText(c.species)}` }), el('div', { class: 'detail', text: f?.note || '' }));
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
      box.append(jobs, el('div', { class: 'detail', text: '1回の攻撃で終わってしまう戦いでは、職業の修行は半分しか進まない。' }));
    }
    // 素早さの 差は すこしだけ（shared/battle.js の ATB）。戦いの 速さの 設定も かける
    const bspeed = normBattleSettings(this.game.me?.battleSettings || {}).speed;
    const speedNote = el('div', { class: 'detail', text: `素早さ ${st.agi}…戦いで約${turnSeconds(st.agi, bspeed).toFixed(1)}秒ごとに順番が来る\n素早さの差は少しだけ（3倍ちがっても約1.2倍）。ピオリムなどは約1.25倍` });
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
      if (c) add(m, computeStats(c), `${m.wagon ? '馬車・' : ''}${m.species ? MONSTERS[m.species]?.name || '' : JOBS[m.job]?.name || ''}`);
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
    // 馬車（リーダーの もの。ui/wagon.js）
    if (p?.wagon) {
      rows.push(el('div', { class: 'small gold', style: { marginTop: '0.4em' }, text: `馬車（${p.wagon.length}人）` }));
      for (const w of p.wagon) rows.push(row(w, `${w.name}（${w.species ? MONSTERS[w.species]?.name : JOBS[w.job]?.name} Lv${w.level}）`, w.hp > 0 ? `HP ${w.hp}/${w.maxHp}` : '死んでいる'));
    }
    box.append(...rows);
    if (!active) {
      box.append(el('div', { class: 'detail', text: `遊んでいる家族をパーティーにさそえる。仲間はルミナの町の酒場で探したり入れかえたりできる。\n近くにいる仲間はいっしょに戦う。はなれている仲間も、戦っている場所へかけつけると、とちゅうから参加できる。\n「ならびを変える」で順番を変えられる（先頭ほど敵にねらわれやすい）。${g.me.wagon ? '\n「総入れかえ」で、戦う仲間（1〜4番目）と馬車の仲間（5〜8番目）をまとめて決められる。' : ''}` }));
      return box;
    }
    const acts = [];
    // 総入れかえ（1〜4番目が 戦う 仲間、5〜8番目が 馬車。ui/wagon.js）
    const mates = (g.me.partyKeys || []).length + (g.me.wagonKeys || []).length;
    if (g.me.wagon && (iAmLeader || !p) && mates) acts.push({ label: '総入れかえ', value: { a: 'arrange' } });
    if (iAmLeader && (p?.supports?.length || 0) >= 1) acts.push({ label: 'ならびを変える', value: { a: 'order' } });
    if (g.me.wagon) acts.push({ label: '馬車', value: { a: 'wagon' } });
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
        // 馬車: 上に のせる（もどる で この リストの「馬車」に もどる）
        if (v.a === 'wagon') return this.pushView(() => wagonMenuView(this, true));
        if (v.a === 'arrange') {
          if (!wagonHereClient(g)) {
            toast('馬車は入り口で待っている。\n（洞窟や塔の中では乗りかえられない）');
            this.sfx('buzz');
            return;
          }
          this.sub.blur();
          const r = await menuArrange(this);
          // あたらしい ならびを 上から 見せる
          if (r) setTimeout(() => { if (this.root) this.main.scrollTop = 0; }, 300);
        } else if (v.a === 'order') {
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
        // カーソルは えらんだ ところの まま
        setTimeout(() => this.redraw(), 250);
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
      box.append(el('div', { class: 'detail', text: '出会ったモンスターがのる図鑑。\n仲間にしたモンスターや、配合で生まれたモンスターも記録される。\n「仲間になりやすさ」は4段階。魔物使いやモンスターマスターがいると、もっと仲間になりやすい。\n配合でしか生まれないモンスターもいるらしい…' }));
      return box;
    }
    const detail = el('div', { class: 'detail zukan-detail' });
    const showMon = (sp) => {
      detail.innerHTML = '';
      detail.scrollTop = 0;
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
      // 配合でも 生まれる 魔物は ヒントも（ぷるりん騎士 など）
      const hint = recipeHint(sp, MONSTERS);
      // 仲間に なりやすさ（4段階。companions.js の JOIN_TIERS）。スマホでも 見えるように 名前の すぐ 下に 1行で
      const tier = M.boss ? null : joinTier(sp);
      const join = el('div', { class: 'small zukan-join' });
      if (M.breedOnly) join.append(el('span', { text: `配合で生まれる（${hint}）` }));
      else if (tier) {
        join.append(
          el('span', { class: 'muted', text: '仲間になりやすさ' }),
          el('span', { class: 'join-meter', 'aria-hidden': 'true' }, [1, 2, 3, 4].map((i) => el('i', { class: i <= tier.level ? 'on' : '' }))),
          el('span', { class: `join-t j${tier.level}`, text: tier.text }),
        );
      } else join.append(el('span', { text: '仲間にならない' }));
      if (s.friend) join.append(el('span', { class: 'good', text: '★仲間にした' }));
      if (s.bred) join.append(el('span', { class: 'good', text: '★配合で生んだ' }));
      const notes = [
        tier && hint ? `配合でも生まれる（${hint}）` : '',
        // 森の主の あとの 夢（魔物の心）より 前
        tier && !c.flags?.monster_bond ? '今はまだ、魔物は仲間にならないようだ…' : '',
      ].filter(Boolean);
      detail.append(
        el('div', { class: 'zukan-title' },
          el('span', { class: 'gold', text: `${M.name}${M.boss ? '（ボス）' : ''}` }),
          el('span', { class: 'small muted', text: `${RACE_NAMES[M.race] || ''}${M.breedOnly ? '' : `　Lv${M.lv}`}　倒した数 ${s.kills}` })),
        join,
        ...notes.map((t) => el('div', { class: 'small', text: t })),
        el('div', { class: 'small', text: M.desc || '' }),
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
      const ORDER = { common: 0, mat: 0.5, rare: 1, boss: 2 };
      const drops = monsterDrops(sp).sort((p, q) => ORDER[p.kind] - ORDER[q.kind]);
      if (drops.length) {
        const KIND = { boss: 'かならず', rare: 'レア', common: 'よく', mat: '素材' };
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
    const offN = (x) => (Array.isArray(x?.autoOff) ? x.autoOff.length : 0);
    const offTag = (x) => (offN(x) ? `（使わない技 ${offN(x)}）` : '');
    const items = [{ label: `${c.name}（オートのとき）：${tname(c.tactics || 'balanced')}${offTag(c)}`, value: { key: 'self', name: c.name } }];
    // 自分の 仲間（パーティー・馬車）
    for (const s of this.myMates()) {
      items.push({ label: `${s.name}${s.wagon ? '（馬車）' : ''}：${tname(s.tactics)}${offTag(s)}`, value: { key: s.key, name: s.name }, face: faceURL({ look: s.look, job: s.job, eq: s.equip, mon: s.species || undefined }) });
    }
    items.push({ label: `戦いの初めからオート：${bs.auto ? 'ON' : 'OFF'}`, value: { toggle: 'auto' } });
    if (!active) {
      for (const it of items) box.append(el('div', { text: it.label }));
      box.append(el('div', { class: 'detail', text: '仲間やオートのときの戦い方を決める。オートで使わない技も選べる。\n仲間を「めいれいさせろ」にすると、仲間のコマンドも自分で選べる。' }));
      return box;
    }
    const m = this.mkSub({
      items,
      onSelect: async (it) => {
        const v = it.value;
        if (v.toggle === 'auto') {
          g.net.send({ t: 'menu', action: 'settings', auto: !bs.auto });
          setTimeout(() => this.redraw(), 250);
          return;
        }
        this.sub.blur();
        // 作戦を かえる か、オートで 使う 技を えらぶ か
        const what = await this.pick(v.key === 'self' ? `${v.name}（オートのとき）` : v.name, [
          { label: '作戦を変える', value: 'tac' },
          { label: 'オートで使う技を選ぶ', value: 'skills' },
          { label: 'やめる', value: null },
        ]);
        if (what === 'skills') return this.pushView(() => this.autoSkillsView(v.key));
        if (what === 'tac') {
          const list = Object.entries(TACTICS).filter(([k]) => v.key !== 'self' || k !== 'manual').map(([k, x]) => ({ label: x.name, value: k }));
          const t = await this.pick(v.key === 'self' ? 'オートのときの作戦' : `${v.name}の作戦`, [...list, { label: 'やめる', value: null }]);
          if (t) g.net.send({ t: 'menu', action: 'tactics', key: v.key, tactics: t, label: TACTICS[t].name });
          setTimeout(() => this.redraw(), t ? 250 : 0);
          return;
        }
        this.redraw();
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'バッチリがんばれ: バランスよく / ガンガンいこうぜ: 攻撃中心 / いのちだいじに: 回復中心 / じゅもんせつやく: MPを使わない / めいれいさせろ: 自分でコマンドを選ぶ（仲間だけ）\n「オートで使う技を選ぶ」で、オートのときに使わない技を決められる。' }));
    return box;
  }

  // オートで 使う 技・使わない 技（作戦）。えらぶ たびに「使う／使わない」が かわる（サーバーの autoSkill・ai.js）
  autoSkillsView(key) {
    const g = this.game;
    const c = this.charOf(key) || g.me;
    const box = el('div');
    const off = new Set(Array.isArray(c.autoOff) ? c.autoOff : []);
    // 戦いで 使える 技だけ（ルーラなど フィールドだけの 技・きずな技は のぞく）
    const ids = learnedAbilities(c).filter((id) => {
      const a = ABILITIES[id];
      return a && !a.fieldOnly && !a.hidden && a.kind !== 'bond';
    });
    box.append(el('div', { class: 'gold small', text: `${c.name}がオートで使う技` }));
    if (!ids.length) {
      box.append(el('div', { class: 'muted', text: 'まだ技を覚えていない。' }));
      this.mkSub({ items: [{ label: 'もどる', value: 'back' }], onSelect: () => this.back() });
      box.append(this.sub.root);
      return box;
    }
    // 画面の キャラにも すぐ 入れる（サーバーの 返事を またずに 見た目を かえる）
    const setLocal = (list) => {
      const src = key === 'self' ? g.me : [...(g.party?.supports || []), ...(g.party?.wagon || [])].find((x) => x.key === key && x.owner === g.me.id);
      if (src) src.autoOff = list;
    };
    const items = [
      { label: '全部使う', value: '__all', disabled: !off.size },
      ...ids.map((id) => {
        const a = ABILITIES[id];
        const no = off.has(id);
        return {
          html: `${esc(a.name)}<span class="sk-desc">${esc(skillBrief(a))}</span>`,
          right: no ? '使わない' : '使う',
          rightCls: no ? 'dis' : 'up',
          value: id,
          cls: `k-${abilityRole(a)} sk ${no ? 'auto-off' : ''}`,
        };
      }),
    ];
    const m = this.mkSub({
      items,
      onSelect: (it) => {
        if (it.value === '__all') {
          setLocal([]);
          g.net.send({ t: 'menu', action: 'autoSkill', key, op: 'all' });
        } else {
          const no = off.has(it.value);
          const next = no ? [...off].filter((x) => x !== it.value) : [...off, it.value];
          setLocal(next);
          g.net.send({ t: 'menu', action: 'autoSkill', key, id: it.value, op: no ? 'on' : 'off' });
        }
        this.redraw();
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: '選ぶたびに「使う／使わない」が切りかわる。\n「使わない」にした技は、オートで戦うときに使わない（自分でコマンドを選ぶときは使える）。' }));
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
    box.append(el('h3', { text: leader ? '自分の目標' : '今の目標' }), el('div', { class: 'q-main' }, el('i', { class: 'qdot qmain' }), c.objective || '（特になし）'));
    const tgt = difficultyOf(c).mainMarks && OBJECTIVE_TARGETS[c.objective || ''];
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
    box.append(el('div', { class: 'detail', text: `宝箱 ${chests}/${total}　フィールドの宝箱 ${c.fieldChests || 0}こ　倒した魔物 ${Object.values(c.kills || {}).reduce((s, x) => s + x, 0)}ひき` }));
    const wallet = walletView(c);
    if (wallet) box.append(wallet);
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
    // ゲームの 難しさ（キャラごと。difficulty.js）
    const dif = difficultyOf(c);
    const sendDif = (patch) => g.net.send({ t: 'menu', action: 'settings', difficulty: patch });
    const items = [
      { header: true, label: 'ゲームの難しさ', cls: 'set-hdr' },
      { label: `目的地のしるし（メイン）：${dif.mainMarks ? '出す' : '出さない'}`, value: 'dMain' },
      { label: `目的地のしるし（たのまれごと）：${dif.subMarks ? '出す' : '出さない'}`, value: 'dSub' },
      { label: `もらえる経験値：${EXP_RATE_NAMES[dif.exp]}`, value: 'dExp' },
      { header: true, label: '画面と音・戦い', cls: 'set-hdr' },
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
    if (g.field.constructor.webgl2()) items.splice(items.findIndex((x) => x.value === 'speed'), 0, { label: `画面：${g.field.view === '3d' ? '2.5D（立体）' : '2D（ドット）'}`, value: 'view' });
    // こまった とき（動けない・画面が 止まった）。不具合の 記録は 家族に コピーして 送れる
    items.push({ header: true, label: 'こまった時', cls: 'set-hdr' },
      { label: '動けない・画面が止まった時は（立てなおす）', value: 'rescue' },
      { label: `不具合の記録（${readErrLog().length}件）`, value: 'errlog' });
    if (g.input.touch) {
      items.push({ label: `ウインドウの十字キー：${g.input.padOn ? '出す' : '出さない'}`, value: 'pad' });
      items.push({ label: `遊んでいる間は画面を消さない：${g.awakeOn ? 'ON' : 'OFF'}`, value: 'awake' });
      if (navigator.audioSession) items.push({ label: `マナーモードでも音を出す：${g.audio.silentPlay ? 'ON' : 'OFF'}`, value: 'silent' });
    }
    const box = el('div');
    if (!active) {
      for (const it of items) box.append(el('div', { class: it.header ? 'gold small' : '', text: it.label }));
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
        if (it.value === 'dMain') {
          sendDif({ mainMarks: !dif.mainMarks });
        } else if (it.value === 'dSub') {
          sendDif({ subMarks: !dif.subMarks });
        } else if (it.value === 'dExp') {
          sendDif({ exp: EXP_RATES[(EXP_RATES.indexOf(dif.exp) + 1) % EXP_RATES.length] });
        } else if (it.value === 'speed') {
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
        } else if (it.value === 'rescue') {
          this.close();
          g.rescue();
          return;
        } else if (it.value === 'errlog') {
          this.errLogPopup().then(() => { if (this.root) this.focusSub(this.settingsView(true)); });
          return;
        }
        setTimeout(() => { if (this.root) this.focusSub(this.settingsView(true)); }, 200);
      },
    });
    box.append(m.root, el('div', { class: 'detail', text: 'ゲームの難しさ: 目的地のしるしを「出さない」にすると、地図のしるしと仲間の「行き先は〇〇のほう」が出なくなる。経験値を0.75倍・0.5倍にすると、レベルが上がりにくくなる（仲間・馬車の仲間も同じ）。\nウェイトをONにすると、コマンドを選ぶ間は戦いの時間が止まる（じっくり考えたい人におすすめ）' + (g.input.touch ? '\n画面が消えると家族との通信がとぎれやすいので「画面を消さない」はONがおすすめ' : '') }));
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
      ctx.fillStyle = themeHex(MAP_COLORS[t] || TILE_INFO[t]?.mapColor || (t >= 30 && t < 70 ? '#c8bfae' : '#555'), m.theme, t);
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
  const m = visibleMarks(game.me, questMarks(game.me, f.mapId, currentObjective(game))).find((x) => x.kind === 'main');
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
  // ゲームの 難しさで 出さない しるしは かかない
  const marks = visibleMarks(game.me, questMarks(game.me, game.field.mapId, currentObjective(game)));
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
  // しるしの せつめい（ゲームの 難しさで 出さない しるしは のせない）
  const dif = difficultyOf(game.me);
  const qlg = dif.mainMarks || dif.subMarks ? el('div', { class: 'map-legend small' },
    dif.mainMarks ? el('span', { class: 'lg' }, el('i', { class: 'qdot qmain' }), '次の行き先') : null,
    dif.subMarks ? el('span', { class: 'lg' }, el('i', { class: 'qdot sub' }), 'たのまれごと') : null,
    dif.subMarks ? el('span', { class: 'lg' }, el('i', { class: 'qdot ready' }), '報告できる') : null) : null;
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
