// たたかいの がめん（むかしの RPG ふう 1がめん）
import { el, esc, ListMenu, toast } from './ui/dom.js?v=b7ef3fbff3c8';
import { ABILITIES, ELEMENT_NAMES, abilityRole } from '../shared/data/abilities.js?v=b7ef3fbff3c8';
import { ITEMS } from '../shared/data/items.js?v=b7ef3fbff3c8';
import { JOBS } from '../shared/data/jobs.js?v=b7ef3fbff3c8';
import { MONSTERS } from '../shared/data/monsters.js?v=b7ef3fbff3c8';
import { mpCost, penaltyFor, weaponOk, mahoukenOptions, comboAllowed, battleAbilityOk } from '../shared/stats.js?v=b7ef3fbff3c8';
import { affinityOf, attackReach } from '../shared/battle.js?v=b7ef3fbff3c8';
import { DUAL_TECHS, dualOptions, dualKnown } from '../shared/data/dual.js?v=b7ef3fbff3c8';
import { TACTICS } from '../shared/ai.js?v=b7ef3fbff3c8';
import { faceURL } from './field.js?v=b7ef3fbff3c8';
import { monsterCanvas } from './render/monsters.js?v=b7ef3fbff3c8';
import { whiteCopy, ctxOf, makeCanvas } from './render/pixel.js?v=b7ef3fbff3c8';
import { battleBackground, Effects, BW, BH, BRES, glowSprite } from './render/battlefx.js?v=b7ef3fbff3c8';
import { enemyActKind, startEnemyAct, actPose, actColor, hitStyle, closeUp } from './render/enemyfx.js?v=b7ef3fbff3c8';
import { abilityDetail, statusNames, buffNames, targetTag } from './ui/info.js?v=b7ef3fbff3c8';
import { battleWagon, battleSwapMenu, applyBattleSwap, wagonSwapFx } from './ui/wagon.js?v=b7ef3fbff3c8';
import { ResultPager, levelUpName } from './ui/result.js?v=b7ef3fbff3c8';

// たたかいの え の こまかさ（おもい きかいで さげたら、その あいだは さげた まま）
let battleRes = BRES;

const whiteCache = new WeakMap();
function white(img, color = '#ffffff') {
  let m = whiteCache.get(img);
  if (!m) { m = {}; whiteCache.set(img, m); }
  if (!m[color]) m[color] = whiteCopy(img, color);
  return m[color];
}

// じゅもんが とどくまでの じかん（ダメージの かずは あたった ときに だす）
const HIT_DELAY = {
  fire1: 320, fire2: 360, fire3: 400, void: 340, ice1: 260, ice2: 180, minadein: 220, slash_light: 100, strash: 300,
  holy_punch: 60, mahouken: 150, fire_wave: 120, wind2: 150, blast2: 110, dark1: 120,
  bolt1: 60, bolt2: 180, gigabreak: 250, whip: 200, shuriken: 260, dragon_beam: 380, summon: 420, meteor: 480, dark_slash: 120,
  slash_heavy: 110, slash_multi: 120, hit: 20, hit_all: 20, tackle: 140, bat_swing: 110, ball: 200, train: 180, cards: 240, hearts: 420,
  coins: 380, ice_arrow: 220, holy: 160, blizzard: 350, cross_slash: 260, rock_smash: 120,
};
const SPELL_ANIMS = new Set(['fire1', 'fire2', 'fire3', 'fire_wave', 'fire_tornado', 'ice1', 'ice2', 'wind1', 'wind2', 'blast1', 'blast2', 'void', 'dark1', 'meteor']);
const ELEM_COLORS = {
  fire: ['#ff5a2a', '#ff9a3a', '#ffe07a'], ice: ['#9ae6ff', '#e6fbff', '#5ab8e8'], wind: ['#d8ffe0', '#9af0b0', '#ffffff'],
  blast: ['#ffffff', '#ffd66b', '#ff8a2a'], dark: ['#8a5ac8', '#3a2a5a', '#c8a8f0'], light: ['#ffffff', '#fff6b0', '#ffd66b'],
  bolt: ['#ffffff', '#fff6b0', '#9ad8ff'],
};

// みかたの まどに だす えんしゅつの しゅるい
function allyFxKind(anim, fx, ab) {
  const eff = ab?.effect;
  if (eff) {
    if (eff.type === 'heal' || eff.type === 'cure') return 'heal';
    if (eff.type === 'revive') return 'revive';
    if (eff.type === 'buff' || eff.type === 'bondUp') return 'up';
    if (eff.type === 'debuff') return 'down';
    if (eff.type === 'cover') return 'shield';
    if (eff.type === 'charge') return 'charge';
    if (eff.type === 'status') return eff.status === 'sleep' ? 'sleep' : eff.status === 'poison' ? 'poison' : 'dark';
  }
  const el = fx.element;
  if (/^bolt|gigabreak|dragon_beam/.test(anim) || el === 'bolt') return 'bolt';
  if (anim === 'dark_slash') return 'dark';
  if (/^fire|blast|meteor|summon/.test(anim) || el === 'fire') return 'fire';
  if (/^ice/.test(anim) || el === 'ice') return 'ice';
  if (/^wind/.test(anim) || el === 'wind') return 'wind';
  if (anim === 'dark1' || el === 'dark' || anim === 'void') return 'dark';
  if (anim === 'sleep') return 'sleep';
  if (anim === 'quake') return 'quake';
  if (anim === 'stage' || anim === 'dance' || anim === 'hearts') return 'up';
  if (/^heal|revive/.test(anim)) return anim === 'revive' ? 'revive' : 'heal';
  if (anim === 'buff' || anim === 'warcry') return 'up';
  if (anim === 'debuff') return 'down';
  if (anim === 'guard') return 'shield';
  if (anim === 'charge') return 'charge';
  return 'claw';
}

const ANIM_SFX = {
  fire1: 'fire', fire2: 'fire', fire3: 'fire', fire_wave: 'fire', fire_tornado: 'fire', ice1: 'ice', ice2: 'ice', wind1: 'wind', wind2: 'wind',
  blast1: 'blast', blast2: 'blast', void: 'void', dark1: 'dark', minadein: 'bolt', heal1: 'heal', heal2: 'heal', heal_dance: 'heal', revive: 'heal',
  buff: 'buff', debuff: 'debuff', sleep: 'sleep', dance: 'buff', breath: 'wind', quake: 'rumble', charge: 'buff', guard: 'buff',
  warcry: 'buff', tackle: 'hit', bite: 'hit',
  bolt1: 'bolt', bolt2: 'thunder', gigabreak: 'thunder', whip: 'hit', shuriken: 'miss', dragon_beam: 'void', summon: 'fire', meteor: 'blast', dark_slash: 'dark',
  bat_swing: 'bat', train: 'train', cards: 'miss', hearts: 'buff', coins: 'item', laugh: 'buff', ice_arrow: 'ice', holy: 'heal', blizzard: 'ice',
  heal_ring: 'heal', stage: 'buff', cross_slash: 'smash', rock_smash: 'smash', ball: 'miss',
  // 学校・公務員・アイドルの 技（render/battlefx-jobs.js）
  notes: 'sleep', odama: 'smash', pillow: 'hit', camera: 'sparkle', stamp: 'stamp', siren: 'warn', water: 'wind',
  fruits: 'debuff', fruits_big: 'blast', storm: 'wind', horn: 'warn', redtrain: 'train',
};

// ひらめきの 電球（ドット絵ふう）
const BULB_SVG = '<svg viewBox="0 0 16 20" width="100%" height="100%" shape-rendering="crispEdges"><path fill="#fff6b0" d="M5 1h6v1h2v2h1v5h-1v2h-1v2h-1v2H5v-2H4v-2H3V9H2V4h1V2h2z"/><path fill="#ffd66b" d="M6 3h1v1H6zM4 5h1v3H4z"/><path fill="#fffbe6" d="M6 2h4v1H6z"/><path fill="#9aa0b8" d="M5 15h6v1H5zM5 17h6v1H5z"/><path fill="#6a6f88" d="M5 16h6v1H5zM6 18h4v1H6z"/></svg>';

export class BattleScene {
  constructor(game, msg) {
    this.game = game;
    this.id = msg.snap.id;
    this.mine = msg.mine || [];
    this.readyQ = []; // コマンドを まっている じぶんの キャラ（じぶん・めいれいさせろの なかま）
    this.cur = null; // いま コマンドを えらんでいる キャラ
    this.boss = !!msg.boss;
    this.canFlee = msg.snap.canFlee;
    this.c = new Map();
    for (const c of msg.snap.combatants) this.c.set(c.id, { ...c, flash: 0, dead: !c.alive ? 1 : 0, lunge: 0 });
    // この たたかいで ためした 属性（'まもの|属性'）。図鑑に のっている ぶんと あわせて ねらう ときに 見せる
    this.tried = new Set();
    this.bond = msg.snap.bond || 0;
    // 戦いの 速さ（エフェクト）と 文字の 速さ（サーバーと おなじ あたい）
    this.fxSpeed = msg.snap.speed || 1;
    this.textSpeed = msg.snap.textSpeed || 1;
    // ウェイト: だれか（人）が コマンドを えらんでいる 間は ゲージが 止まる（サーバーと おなじ きまり）
    this.waitMode = !!msg.snap.wait;
    this.fx = new Effects();
    this.bg = battleBackground(msg.snap.bg);
    this.queue = [];
    this.showing = null;
    this.time = 0;
    this.ended = false;
    this.lock = false;
    this.build();
    this.game.audio.play(msg.snap.bgm || (this.boss ? 'boss' : 'battle'), { force: true });
    const names = this.enemyNames();
    if (msg.resume) this.say(['つなぎ直した！戦いの続きだ！']);
    else if (msg.joined) this.say([`${names}との戦いにかけつけた！`]);
    else this.say([msg.preemptive === 'ally' ? '魔物はまだこちらに気づいていない！' : msg.preemptive === 'enemy' ? '魔物たちがいきなりおそいかかってきた！' : `${names}が現れた！`]);
    // はじまった ときに もう 番が きている 自分の キャラ（つなぎ直し・かけつけ など）
    for (const id of this.mine) {
      const c = this.c.get(id);
      if (c?.ready && c.alive && !c.auto && !this.readyQ.includes(id)) this.readyQ.push(id);
    }
    if (this.readyQ.length) this.nextCommand();
  }

  enemyNames() {
    const counts = {};
    for (const c of this.c.values()) if (c.side === 'enemy') counts[c.species] = (counts[c.species] || 0) + 1;
    return Object.entries(counts).map(([sp, n]) => (n > 1 ? `${MONSTERS[sp].name}たち` : MONSTERS[sp].name)).join('と');
  }

  // じぶんの キャラ（プレイヤー）
  get primary() {
    return this.c.get(this.mine[0]);
  }

  // いま コマンドを えらんでいる キャラ（なかまの ばんなら なかま）
  get myActor() {
    return this.c.get(this.cur) || this.primary;
  }

  // つぎに コマンドを えらぶ キャラへ
  nextCommand() {
    while (this.readyQ.length) {
      const id = this.readyQ[0];
      const a = this.c.get(id);
      const stuck = (a?.status || []).some((x) => x === 'sleep' || x === 'paralyze');
      if (a && a.alive && a.ready && !a.auto && !stuck && !this.ended) {
        this.cur = id;
        this.openCommand();
        return;
      }
      this.readyQ.shift();
    }
    this.cur = null;
    if (this.menu) this.renderCmdIdle();
  }

  dropReady(id) {
    this.readyQ = this.readyQ.filter((x) => x !== id);
    if (this.cur === id) {
      this.cur = null;
      this.closeMenus();
      this.nextCommand();
      if (!this.cur) this.renderCmdIdle();
    }
  }

  // サーバーに ことわられた: もういちど えらびなおす
  onReject() {
    const id = this.lastSent;
    const a = id && this.c.get(id);
    if (a && a.ready && !this.readyQ.includes(id)) this.readyQ.unshift(id);
    if (!this.cur) this.nextCommand();
  }

  // ───────────── がめんを つくる ─────────────
  build() {
    const root = document.getElementById('battle');
    root.innerHTML = '';
    root.hidden = false;
    this.root = root;
    this.statusEl = el('div', { class: 'b-status' });
    this.bondEl = el('div', { class: 'win b-bond' }, el('span', { text: 'きずな' }), el('div', { class: 'bb' }, el('i')));
    const top = el('div', { class: 'b-top' }, this.statusEl, this.bondEl);
    this.res = battleRes;
    this.canvas = makeCanvas(BW * this.res, BH * this.res);
    this.ctx = ctxOf(this.canvas);
    this.floatEl = el('div', { class: 'b-float' });
    this.autoBtn = el('button', { class: 'btn', text: 'オート', onclick: () => this.toggleAuto() });
    this.speedHint = el('div');
    const tools = el('div', { class: 'b-tools' }, this.autoBtn);
    this.stage = el('div', { class: 'b-stage' }, this.canvas, this.floatEl, tools);
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.cmdEl = el('div', { class: 'win b-cmd' });
    this.msgEl = el('div', { class: 'win b-msg' });
    this.msgEl.addEventListener('click', () => this.skipMsg());
    const bottom = el('div', { class: 'b-bottom' }, this.cmdEl, this.msgEl);
    root.append(top, this.stage, bottom);
    this.statusBoxes = new Map();
    this.renderStatus(true);
    this.renderCmdIdle();
    this.updateAutoBtn();
    this.resizeCanvas();
    // コマンドの なまえの 大きさも あわせなおす（ListMenu の fit）
    this.onResize = () => { this.resizeCanvas(); this.menu?.fitText && this.menu.fit(); };
    addEventListener('resize', this.onResize);
    // 文字（ウェブフォントの つづき）が とどいたら、コマンドの なまえの 大きさを あわせなおす
    this.onFonts = () => { this.menu?.fitText && this.menu.fit(); };
    document.fonts?.addEventListener?.('loadingdone', this.onFonts);
    // がめんの むきが かわった・もじが よみこまれた ときも あわせる
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => { this.resizeCanvas(); this.menu?.fitText && this.menu.fit(); });
      this.ro.observe(this.stage);
    }
  }

  // たたかいの え を できるだけ おおきく（ドットが そろうように がめんの ほんとうの ピクセルで わりきれる おおきさ）
  resizeCanvas() {
    const r = this.stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = window.devicePixelRatio || 1;
    const kmax = Math.min(r.width / BW, r.height / BH);
    let k = Math.floor(kmax * dpr) / dpr;
    // こまかい がめん（スマホ。dpr 2いじょう）で わりきると 1わり ちかく 小さく なる ときは、いっぱいに（ドットの ずれは 見えない）
    if (k < 0.5 || (dpr >= 2 && k < kmax * 0.94)) k = kmax;
    this.canvas.style.width = `${Math.round(BW * k)}px`;
    this.canvas.style.height = `${Math.round(BH * k)}px`;
    this.cssK = k;
  }

  // 馬車に もどった 人（fled・benched）と、まだ 出てきて いない 人（pending）は のぞく。まどは 場所（slot）の じゅん
  allies() { return [...this.c.values()].filter((c) => c.side === 'ally' && !c.fled && !c.benched && !c.pending).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)); }
  enemies() { return [...this.c.values()].filter((c) => c.side === 'enemy' && !c.fled); }

  renderStatus(full = false) {
    const allies = this.allies();
    if (full || this.statusBoxes.size !== allies.length || allies.some((a) => !this.statusBoxes.has(a.id))) {
      this.statusEl.innerHTML = '';
      this.statusBoxes.clear();
      // 人数（たてむきの スマホで 5人の ときは 3人＋2人の 2だんに。CSS）
      this.statusEl.dataset.n = String(allies.length);
      for (const a of allies) {
        const box = el('div', { class: 'win b-mem' });
        box.addEventListener('click', () => this.onAllyClick(a.id));
        const name = el('span', { class: 'n', text: a.name });
        const tag = el('span', { class: 'tg' });
        const lv = el('span', { class: 'lv' });
        const nm = el('div', { class: 'nm' }, el('span', { class: 'nl' }, name, tag), lv);
        const gauge = (label, kind) => {
          const bar = el('div', { class: `gb ${kind}` }, el('i'));
          const num = el('span', { class: 'gn' });
          const row = el('div', { class: `grow ${kind}` }, el('span', { class: 'gl', text: label }), bar, num);
          return { row, bar: bar.firstChild, num };
        };
        const hp = gauge('HP', 'hp');
        const mp = gauge('MP', 'mp');
        const sts = el('div', { class: 'sts' });
        const atb = el('div', { class: 'atb' }, el('i'));
        box.append(nm, hp.row, mp.row, sts, atb);
        this.statusEl.append(box);
        this.statusBoxes.set(a.id, { box, name, tag, lv, hp, mp, sts, atb: atb.firstChild, atbBox: atb });
      }
    }
    // 家族と いっしょの ときは、人が 動かしている キャラの 名前を 黄緑に
    const multi = allies.filter((a) => a.kind === 'player').length >= 2;
    for (const a of allies) {
      const s = this.statusBoxes.get(a.id);
      if (!s) continue;
      const r = a.maxHp ? Math.max(0, a.hp) / a.maxHp : 0;
      const hpCls = !a.alive ? 'dead' : r <= 0.1 ? 'red' : r <= 0.5 ? 'orange' : '';
      s.box.classList.toggle('dead', !a.alive);
      s.box.classList.toggle('me', this.mine.includes(a.id));
      s.box.classList.toggle('ready', !!a.ready && this.mine.includes(a.id));
      s.box.classList.toggle('cur', this.cur === a.id);
      // さわると さくせんを かえられる（じぶんと じぶんの なかま）
      s.box.classList.toggle('tac', this.canTactics(a));
      s.name.className = `n ${multi && a.kind === 'player' ? 'player' : ''} ${hpCls}`;
      s.lv.textContent = `Lv${a.lv}`;
      s.hp.row.className = `grow hp ${hpCls}`;
      s.hp.bar.style.width = `${Math.round(r * 100)}%`;
      s.hp.num.textContent = `${Math.max(0, a.hp)}/${a.maxHp}`;
      s.mp.bar.style.width = `${a.maxMp ? Math.round(Math.max(0, a.mp) / a.maxMp * 100) : 0}%`;
      s.mp.num.textContent = `${Math.max(0, a.mp)}/${a.maxMp}`;
      s.tag.textContent = a.auto && a.controller ? 'オート' : a.controller && a.kind !== 'player' ? '命令' : a.kind === 'support' ? '仲間' : a.kind === 'monster' ? '魔物' : a.kind === 'guest' ? 'ゲスト' : '';
      const st = [statusNames(a.status), buffNames(a.buffs)].filter(Boolean).join(' ');
      s.sts.textContent = !a.alive ? '死んでいる' : a.defending ? `防御 ${st}` : st;
    }
  }

  updateGauges() {
    for (const a of this.allies()) {
      const s = this.statusBoxes.get(a.id);
      if (!s) continue;
      const v = a.alive ? Math.min(100, a.atb) : 0;
      s.atb.style.width = `${v}%`;
      s.atbBox.classList.toggle('full', v >= 99.9);
    }
    const bb = this.bondEl.querySelector('i');
    bb.style.width = `${Math.min(100, this.bond)}%`;
    this.bondEl.classList.toggle('full', this.bond >= 100);
  }

  // ───────────── メッセージ ─────────────
  say(lines, dur = 1200) {
    this.msgEl.innerHTML = '';
    this.msgEl.classList.remove('info');
    const els = lines.map((l) => el('div', { class: 'ln', text: l }));
    const per = Math.max(90, Math.min(260 / this.textSpeed, (dur * 0.8) / Math.max(1, lines.length)));
    // まだ 出していない 行は ばしょも とらない（まどは した ぞろえ。行が おおい ときに さいしょの 行が 上に かくれない ように）
    els.forEach((e, i) => {
      if (i) e.style.display = 'none';
      this.msgEl.append(e);
      if (i) setTimeout(() => { e.style.display = ''; }, i * per);
    });
    while (this.msgEl.children.length > 7) this.msgEl.firstChild.remove();
  }

  skipMsg() {
    for (const e of this.msgEl.children) e.style.display = '';
  }

  // えらんでいる 技・道具の せつめい（上から 見せる。長くても 1行めが かくれない）
  info(text) {
    this.msgEl.innerHTML = '';
    this.msgEl.classList.remove('hasfav');
    this.msgEl.classList.add('info');
    this.msgEl.append(el('div', { class: 'ln small', text }));
  }

  // ───────────── コマンド ─────────────
  renderCmdIdle(text) {
    this.closeMenus();
    this.cmdEl.innerHTML = '';
    const a = this.primary;
    if (!a) {
      this.cmdEl.append(el('div', { class: 'wait', text: '仲間が戦っている…' }));
      return;
    }
    // 合体技の よやく中: 仲間の ゲージを まっている（やめられる）
    if (a.alive && a.waitDual) {
      const p = this.c.get(a.waitDual.partner);
      const t = DUAL_TECHS[a.waitDual.id];
      this.cmdEl.append(
        el('div', { class: 'who', text: a.name }),
        el('div', { class: 'wait', text: `${p?.name || '仲間'}のゲージがたまったら「${t?.name || '合体技'}」を出す。力をためている…` }),
        el('button', { class: 'btn dual-cancel', text: 'よやくをやめる', onclick: () => this.game.net.send({ t: 'battle', actor: a.id, cmd: { type: 'dualCancel' } }) }),
      );
      return;
    }
    this.cmdEl.append(el('div', { class: 'who', text: a.name }), el('div', { class: 'wait', text: text || (a.alive ? (a.auto ? 'オートで戦っている' : '行動ゲージがたまるのを待っている…') : '死んでしまった…') }));
  }

  closeMenus() {
    if (this.ended) this.closeTactics();
    this.menu?.blur();
    this.menu = null;
    this.targeting = null;
    this.hoverGroup = null;
  }

  openCommand() {
    const a = this.myActor;
    if (!a || !a.alive || this.ended) return;
    this.cur = a.id;
    this.renderStatus();
    this.game.audio.sfx('warn');
    // 転職した あと 今の 職業・ぶきで 使えない 技（ほかの 職業の 掛け合わせ技・剣や ムチが いる 技 など）と
    // フィールドだけの 呪文（ルーラ）は 出さない（shared/stats.js の battleAbilityOk。サーバーも おなじ きまり）。
    // MPが 足りない・呪文を ふうじられた ときは 出して えらべない だけ
    const pc = a.pc || { job: a.job, jobs: {} };
    const learned = (a.abilities || []).filter((id) => battleAbilityOk(pc, id, a.weaponCat) && (ABILITIES[id].effect?.type !== 'mahouken' || this.mahoukenOpts(a).length));
    // 今の 職業の 技を さきに（あとは おぼえた じゅん）
    const nowJob = (id) => (ABILITIES[id].job === pc.job ? 0 : 1);
    learned.sort((x, y) => nowJob(x) - nowJob(y));
    const spells = learned.filter((id) => ABILITIES[id].kind === 'spell' || ABILITIES[id].spellLike);
    const skills = learned.filter((id) => ABILITIES[id].kind === 'skill' || ABILITIES[id].kind === 'monster' || (ABILITIES[id].kind === 'combo' && !ABILITIES[id].spellLike));
    const duals = this.myDualOptions(a);
    const items = [
      { label: '戦う', value: 'attack' },
      { label: '呪文', value: 'spell', disabled: !spells.length },
      { label: '特技', value: 'skill', disabled: !skills.length },
      { label: '道具', value: 'item' },
      { label: '防御', value: 'defend' },
      { label: '逃げる', value: 'flee', disabled: !this.canFlee },
    ];
    // 馬車の 仲間と いれかえ（馬車が いっしょの とき。ui/wagon.js）
    const wagon = battleWagon(this);
    if (wagon) items.splice(items.length - 1, 0, { label: 'いれかえ', value: 'wagon', disabled: !wagon.outs.length || !wagon.ins.some((x) => x.hp > 0) });
    if (duals.length) items.splice(3, 0, { html: '<span class="dual-cmd">合体技</span>', value: 'dual', cls: 'k-dual' });
    if (this.bond >= 100) items.unshift({ html: '<span class="gold">★ミナデイン</span>', value: 'bond', cls: 'k-bond' });
    this.showMenu(items, (it) => {
      switch (it.value) {
        case 'attack': {
          // ムチは グループ、ブーメランは 敵全体（えらばない）
          const reach = attackReach(a.weaponCat);
          return this.pickFoe(reach, (t) => this.send({ type: 'attack', target: t }), reach === 'group' ? 'どのグループをねらう？' : 'だれをねらう？');
        }
        case 'spell': return this.abilityMenu(spells, 'spell');
        case 'skill': return this.abilityMenu(skills, 'skill');
        case 'dual': return this.dualMenu(this.myDualOptions(a));
        case 'item': return this.itemMenu();
        case 'defend': return this.send({ type: 'defend' });
        case 'flee': return this.send({ type: 'flee' });
        case 'bond': return this.pickEnemy((t) => this.send({ type: 'bond', target: t }), 'ミナデインでねらう相手');
        case 'wagon': return battleSwapMenu(this);
        default:
      }
    }, null, `${a.name}はどうする？`);
  }

  // keep: { off } … まえに えらんだ 行が リストの 上から 何ピクセルの ところに 見えていたか（その まま の 場所に 出す）
  showMenu(items, onSelect, onCancel, title, detailFn, start = -1, keep = null) {
    this.closeMenus();
    this.cmdEl.innerHTML = '';
    if (title) this.cmdEl.append(el('div', { class: 'who', text: title }));
    const m = new ListMenu(this.game.input, {
      items,
      sound: (x) => this.game.audio.sfx(x),
      onSelect,
      onCancel: onCancel || null,
      onMove: detailFn ? (it) => detailFn(it) : null,
      press: 130,
      start,
      fit: true,
    });
    this.cmdEl.append(m.root);
    this.menu = m;
    if (start >= 0) this.restoreScroll(m, keep);
    m.focus();
    // さくせんの まどが ひらいている 間は、キーは そちらへ（とじたら こちらに もどる）
    if (this.tac) m.blur();
    if (start >= 0 && detailFn) detailFn(items[m.idx]);
  }

  // えらんでいる 行が リストの 上から どこに 見えているか（ピクセル）
  selOffset(m = this.menu) {
    const li = m?.root.children[m.idx];
    return li ? li.getBoundingClientRect().top - m.root.getBoundingClientRect().top : null;
  }

  // まえに えらんだ 行を、その ときと おなじ 場所に（入りきらない ときは 見える ところまで）
  restoreScroll(m, keep) {
    const box = m.root;
    const li = box.children[m.idx];
    if (!li) return;
    if (keep && Number.isFinite(keep.off)) {
      const top = li.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
      box.scrollTop = Math.max(0, top - keep.off);
    }
    const r = li.getBoundingClientRect(), br = box.getBoundingClientRect();
    if (r.top < br.top || r.bottom > br.bottom) m.scrollToSel();
  }

  // まえに えらんだ 技（キャラ・ページごと。つぎの 戦いでも おぼえておく）
  lastPick(a, page) {
    try { return JSON.parse(localStorage.getItem('kizuna_bcur') || '{}')[`${a.charId || a.id}:${page}`] || null; } catch { return null; }
  }

  // その ときの リストの 見え方（えらんだ 行が 上から 何ピクセルの ところ）。もどった ときに おなじ 場所に 出す
  lastScroll(a, page) {
    try {
      const v = JSON.parse(localStorage.getItem('kizuna_bscroll') || '{}')[`${a.charId || a.id}:${page}`];
      return v && Number.isFinite(v.off) ? v : null;
    } catch { return null; }
  }

  rememberPick(a, page, value) {
    const off = this.selOffset();
    try {
      const m = JSON.parse(localStorage.getItem('kizuna_bcur') || '{}');
      m[`${a.charId || a.id}:${page}`] = value;
      localStorage.setItem('kizuna_bcur', JSON.stringify(m));
      if (off !== null) {
        const sc = JSON.parse(localStorage.getItem('kizuna_bscroll') || '{}');
        // fav: お気に入りの まどの 行か（おなじ 技が「ぜんぶ」にも ある）
        sc[`${a.charId || a.id}:${page}`] = { off: Math.round(off), fav: !!this.menu?.current?.fav };
        localStorage.setItem('kizuna_bscroll', JSON.stringify(sc));
      }
    } catch { /* */ }
  }

  // お気に入りに 入れる・はずす（サーバーに おぼえてもらう）
  toggleFav(a, id) {
    const favs = a.favs || (a.favs = []);
    const on = !favs.includes(id);
    if (on) favs.push(id);
    else favs.splice(favs.indexOf(id), 1);
    const who = String(a.charId || '').includes(':') ? String(a.charId).split(':').pop() : 'self';
    // 知らせは サーバーの 返事（menuRes）で 出る
    this.game.net.send({ t: 'menu', action: 'favorite', who, id, op: on ? 'add' : 'remove' });
  }

  // keep: お気に入りを かえた ときなど、いまの カーソルと 見え方の まま 出しなおす（{ value, off }）
  abilityMenu(ids, page = 'spell', keep = null) {
    const a = this.myActor;
    const pc = a.pc || { job: a.job, jobs: this.game.me.jobs };
    const silenced = (a.status || []).includes('silence');
    const row = (id, fav) => {
      const ab = ABILITIES[id];
      const isMk = ab.effect.type === 'mahouken';
      const cost = isMk ? 0 : mpCost(pc, id);
      const pen = penaltyFor(pc, id).penalized;
      const noMp = !isMk && cost > a.mp;
      const sil = silenced && (ab.kind === 'spell' || ab.spellLike);
      const el = ab.effect?.element;
      // 相手の しるし（グループ・全体・全員）
      const tt = targetTag(ab);
      return {
        html: `${ELEMENT_NAMES[el] ? `<span class="elem e-${el}">${ELEMENT_NAMES[el]}</span>` : ''}${ab.name}${tt ? `<span class="tag tgt t-${ab.effect?.random ? 'random' : ab.target}">${tt}</span>` : ''}${pen ? '<span class="tag warn">他</span>' : ''}${ab.hirameki || ab.kind === 'combo' ? '<span class="tag hira">閃</span>' : ''}`,
        right: isMk ? '▶' : `${cost}`,
        rightCls: pen ? 'pen' : '',
        value: id,
        cls: `k-${abilityRole(ab)}${fav ? ' fav' : ''}`,
        fav: !!fav,
        disabled: noMp || sil,
      };
    };
    // お気に入りの まど（ならびは メニューの「技」で かえられる）＋ ぜんぶ
    const favs = (a.favs || []).filter((id) => ids.includes(id));
    const items = [];
    if (favs.length) {
      items.push({ header: true, label: '★ お気に入り', cls: 'fav-h' }, ...favs.map((id) => row(id, true)));
      items.push({ header: true, label: page === 'spell' ? '呪文（ぜんぶ）' : '特技（ぜんぶ）', cls: 'all-h' });
    }
    items.push(...ids.map((id) => row(id, false)));
    // まえに えらんだ 技から はじめる（リストの 見え方も その ときの まま）
    const last = keep ? keep.value : this.lastPick(a, page);
    const view = keep || this.lastScroll(a, page);
    const find = (fav) => items.findIndex((it) => !it.header && it.value === last && (fav === undefined || !!it.fav === !!fav));
    const start = !last ? -1 : find(view?.fav) >= 0 ? find(view?.fav) : find();
    const detail = (it) => {
      if (!it || it.header) return;
      this.info(abilityDetail(it.value, pc, { brief: true }));
      const on = (a.favs || []).includes(it.value);
      this.msgEl.classList.add('hasfav');
      this.msgEl.append(el('button', {
        class: `btn favbtn ${on ? 'on' : ''}`,
        text: on ? '★お気に入り' : '☆お気に入り',
        title: on ? 'お気に入りからはずす' : 'お気に入りに入れる',
        onclick: (e) => {
          e.stopPropagation();
          const off = this.selOffset();
          this.toggleFav(a, it.value);
          this.abilityMenu(ids, page, { value: it.value, off, fav: !!this.menu?.current?.fav });
        },
      }));
    };
    this.showMenu(items, (it) => {
      const ab = ABILITIES[it.value];
      this.rememberPick(a, page, it.value);
      if (ab.effect.type === 'mahouken') return this.mahoukenMenu();
      const t = ab.target;
      const back = () => this.abilityMenu(ids, page);
      if (t === 'enemy' || t === 'group') return this.pickFoe(t, (tid) => this.send({ type: 'ability', id: it.value, target: tid }), ab.name, ab.effect?.element, back);
      if (t === 'ally' || t === 'deadAlly') return this.pickAlly((tid) => this.send({ type: 'ability', id: it.value, target: tid }), t === 'deadAlly', ab.name, back);
      return this.send({ type: 'ability', id: it.value });
    }, () => this.openCommand(), null, detail, start, view);
  }

  // 魔法剣の くみあわせ（ないときは コマンドにも 出さない）
  mahoukenOpts(a) {
    return mahoukenOptions({ ...(a.pc || this.game.me), job: a.job }, a.abilities || []);
  }

  mahoukenMenu() {
    const a = this.myActor;
    const opts = this.mahoukenOpts(a);
    const items = opts.map((o) => ({ label: o.name, right: `${o.mp}`, value: o, disabled: o.mp > a.mp || !weaponOk({ weapon: 'blade' }, a.weaponCat) }));
    if (!items.length) return toast('魔法剣にできる技がない');
    this.showMenu(items, (it) => {
      this.pickEnemy((tid) => this.send({ type: 'mahouken', spell: it.value.spell, skill: it.value.skill, target: tid }), it.value.name, ABILITIES[it.value.spell]?.effect?.element, () => this.mahoukenMenu());
    }, () => this.openCommand(), '魔法剣（呪文×剣技）', (it) => {
      if (!it) return;
      this.info(`${ABILITIES[it.value.spell].name}の力を${ABILITIES[it.value.skill].name}に宿らせる。\nMP ${it.value.mp}（剣が必要）`);
    });
  }

  itemMenu() {
    const bag = this.game.me.items.filter((e) => ITEMS[e.id]?.battle);
    if (!bag.length) {
      toast('戦いで使える道具がない');
      return this.openCommand();
    }
    const bagItems = bag.map((e) => ({ label: ITEMS[e.id].name, right: `×${e.n}`, value: e.id }));
    const a = this.myActor;
    const last = a && this.lastPick(a, 'item');
    this.showMenu(bagItems, (it) => {
      if (a) this.rememberPick(a, 'item', it.value);
      const item = ITEMS[it.value];
      if (item.target === 'self') return this.send({ type: 'item', id: it.value });
      return this.pickAlly((tid) => this.send({ type: 'item', id: it.value, target: tid }), item.target === 'deadAlly', item.name, () => this.itemMenu());
    }, () => this.openCommand(), '道具', (it) => {
      if (!it) return;
      this.info(ITEMS[it.value].desc);
    }, last ? bagItems.findIndex((x) => x.value === last) : -1, a && this.lastScroll(a, 'item'));
  }

  // その 敵に その 属性が どれくらい 効くか（ためした ことが なければ null）
  knownAffinity(e, element) {
    if (!e?.species || !element || element === 'phys') return null;
    const known = this.tried.has(`${e.species}|${element}`) || !!this.game.me?.bestiary?.[e.species]?.[`el_${element}`];
    if (!known) return null;
    return affinityOf(MONSTERS[e.species]?.resist?.[element] ?? 1);
  }

  // ねらう 敵を えらぶ（ドラクエ ふう）
  //   mode 'enemy' … 1体（おなじ 種類が いれば A・B…）/ 'group' …「ゴブリン（2ひき）」の グループ / 'enemies' … えらばない（敵全体）
  //   element: 属性の 技で ねらう とき、ためした ことの ある 敵には 効きぐあいを 出す
  //   back: もどる ボタン（えらぶ まえの メニューへ）
  pickFoe(mode, done, title = 'だれをねらう？', element = null, back = null) {
    const list = this.enemies().filter((e) => e.alive);
    if (mode === 'enemies' || !list.length) return done(undefined);
    const groups = mode === 'group' ? this.foeGroups(list) : null;
    if (groups ? groups.length === 1 : list.length === 1) return done(groups ? groups[0].lead : list[0].id);
    // 効きぐあいは 名前の 下に 小さく（名前が 2行に ならないように）
    const AFF = { weak: '弱点！', resist: '効きにくい', null: '効かない', normal: 'ふつう' };
    const affTag = (e) => {
      const aff = element ? this.knownAffinity(e, element) : null;
      return aff ? `<span class="aff-line a-${aff}">${AFF[aff]}</span>` : element && ELEMENT_NAMES[element] ? '<span class="aff-line a-unknown">？</span>' : '';
    };
    // 反撃の構えを している 敵（物理で こうげきすると 反撃される）
    const stanceTag = (es) => (es.some((e) => e.stance === 'counter') ? '<span class="aff-line a-stance">反撃の構え</span>' : '');
    const items = groups
      ? groups.map((gp) => ({ html: `${esc(gp.name)}<span class="cnt">（${gp.members.length}ひき）</span>${affTag(gp.members[0])}${stanceTag(gp.members)}`, value: gp.lead }))
      : list.map((e) => ({ html: `${esc(e.name)}${affTag(e)}${stanceTag([e])}`, value: e.id }));
    const hover = (it) => {
      this.hover = it?.value;
      this.hoverGroup = groups ? this.c.get(it?.value)?.species || null : null;
    };
    // まえに ねらった 敵（グループなら おなじ 種類）から カーソルを はじめる（この 戦いの あいだ）
    const prev = this.c.get(this.lastFoe);
    const start = !prev ? 0 : Math.max(0, groups
      ? groups.findIndex((gp) => gp.members[0].species === prev.species)
      : Math.max(list.findIndex((e) => e.id === prev.id), list.findIndex((e) => e.species === prev.species)));
    const pick = (v) => {
      if (v != null) this.lastFoe = v;
      done(v);
    };
    this.showMenu(items, (it) => pick(it.value), back || (() => this.openCommand()), title, hover, start);
    // ねらっている あいだ（showMenu の あとで。スプライトを さわっても えらべる）
    this.targeting = { side: 'enemy', mode, done: pick };
  }

  // 1体を ねらう（むかしの よびかた）
  pickEnemy(done, title = 'だれをねらう？', element = null, back = null) {
    return this.pickFoe('enemy', done, title, element, back);
  }

  // 敵の グループ（おなじ 種類。ならびは 左から）。lead: グループの いちばん 左（これを おくる）
  foeGroups(list = this.enemies().filter((e) => e.alive)) {
    const out = [];
    for (const e of list) {
      let gp = out.find((x) => x.species === e.species);
      if (!gp) out.push((gp = { species: e.species, name: MONSTERS[e.species]?.name || e.baseName || e.name, members: [], lead: e.id }));
      gp.members.push(e);
    }
    return out;
  }

  pickAlly(done, dead = false, title = 'だれに？', back = null) {
    const list = this.allies();
    this.showMenu(list.map((a) => ({ label: `${a.name}　HP${a.hp}`, value: a.id, disabled: dead ? a.alive : !a.alive })), (it) => done(it.value), back || (() => this.openCommand()), title);
    this.targeting = { side: 'ally', done, dead };
  }

  onCanvasClick(e) {
    if (!this.targeting || this.targeting.side !== 'enemy') return;
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * BW, y = (e.clientY - r.top) / r.height * BH;
    for (const m of this.layout || []) {
      if (x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h && m.c.alive) {
        this.game.audio.sfx('confirm');
        // グループを えらぶ ときは、さわった 魔物の グループ（いちばん 左を おくる）
        if (this.targeting.mode === 'group') {
          const gp = this.foeGroups().find((g) => g.species === m.c.species);
          return this.targeting.done(gp ? gp.lead : m.c.id);
        }
        return this.targeting.done(m.c.id);
      }
    }
  }

  onAllyClick(id) {
    // ねらう 仲間を えらんでいる とき いがいは、さくせんを かえる まど
    if (!this.targeting || this.targeting.side !== 'ally') return this.tacticsMenu(id);
    const a = this.c.get(id);
    if (!a || (this.targeting.dead ? a.alive : !a.alive)) return;
    this.game.audio.sfx('confirm');
    this.targeting.done(id);
  }

  send(cmd) {
    const a = this.myActor;
    if (!a) return;
    this.closeMenus();
    this.lastSent = a.id;
    this.readyQ = this.readyQ.filter((x) => x !== a.id);
    this.cur = null;
    this.game.net.send({ t: 'battle', actor: a.id, cmd });
    const partner = cmd.type === 'dual' ? this.c.get(cmd.partner) : null;
    const asking = partner && partner.controller && !partner.auto && !this.mine.includes(partner.id);
    this.renderCmdIdle(asking ? `${partner.name}の返事を待っている…` : 'コマンドを選んだ！');
    // めいれいさせろの なかまが まっていれば つづけて えらぶ
    this.nextCommand();
  }

  // オート: じぶんと「めいれいさせろ」の なかま みんな
  toggleAuto() {
    const a = this.primary;
    if (!a) return;
    const on = !a.auto;
    for (const id of this.mine) this.game.net.send({ t: 'battle', actor: id, auto: on });
  }

  updateAutoBtn() {
    const a = this.primary;
    this.autoBtn.classList.toggle('on', !!a?.auto);
    this.autoBtn.textContent = a?.auto ? 'オート中' : 'オート';
    this.autoBtn.hidden = !a;
  }

  // ───────────── サーバーからの できごと ─────────────
  onEvents(evs) {
    for (const ev of evs) {
      switch (ev.t) {
        case 'g':
          for (const [id, v] of Object.entries(ev.g)) {
            const c = this.c.get(id);
            if (c) c.atb = v;
          }
          this.bond = ev.bond;
          break;
        case 'ready': {
          const c = this.c.get(ev.id);
          if (c) { c.ready = true; c.atb = 100; c.waitDual = null; }
          if (this.mine.includes(ev.id)) {
            if (!this.readyQ.includes(ev.id)) this.readyQ.push(ev.id);
            if (!this.cur) this.nextCommand();
          }
          this.renderStatus();
          break;
        }
        case 'queued': {
          const c = this.c.get(ev.id);
          if (c) { c.ready = false; c.queued = true; c.waitDual = null; }
          if (this.mine.includes(ev.id)) this.dropReady(ev.id);
          this.renderStatus();
          break;
        }
        case 'auto': {
          const c = this.c.get(ev.id);
          if (c) c.auto = ev.auto;
          if (this.mine.includes(ev.id)) {
            this.updateAutoBtn();
            if (ev.auto) this.dropReady(ev.id);
            if (ev.auto && !this.cur) this.renderCmdIdle();
          }
          this.renderStatus();
          break;
        }
        case 'act':
        case 'msg':
          // 馬車との いれかえは すぐ まどに（メッセージは じゅんばんに）
          if (ev.swap) applyBattleSwap(this, ev);
          this.queue.push(ev);
          break;
        case 'dualInvite': {
          if (this.mine.includes(ev.to)) this.showInvite(ev);
          if (this.mine.includes(ev.from)) {
            const c = this.c.get(ev.from);
            if (c) { c.waitDual = null; c.ready = true; }
            if (!this.cur) this.renderCmdIdle(`${ev.toName}の返事を待っている…`);
          }
          break;
        }
        case 'dualWait': {
          const c = this.c.get(ev.id);
          if (c) { c.waitDual = { id: ev.tech, partner: ev.partner }; c.ready = false; }
          const p = this.c.get(ev.partner);
          if (p) p.dualTarget = ev.id;
          this.queue.push({ t: 'msg', lines: ev.lines || [], dur: 900 });
          if (this.mine.includes(ev.id)) {
            this.dropReady(ev.id);
            if (!this.cur) this.renderCmdIdle();
          }
          this.renderStatus();
          break;
        }
        case 'dualWaitEnd': {
          const c = this.c.get(ev.id);
          const pid = c?.waitDual?.partner;
          if (c) c.waitDual = null;
          if (pid && this.c.get(pid)) this.c.get(pid).dualTarget = null;
          if (ev.lines?.length && this.mine.includes(ev.id)) toast(ev.lines[0]);
          if (this.mine.includes(ev.id) && !this.cur) this.renderCmdIdle();
          this.renderStatus();
          break;
        }
        case 'dualAnswer': {
          if (this.invite?.invite === ev.invite) this.closeInvite();
          if (this.mine.includes(ev.from) && !ev.ok) {
            const who = this.c.get(ev.to)?.name || '仲間';
            const why = { 'ことわった': `${who}は参加しなかった…`, '時間切れ': `${who}から返事がなかった…`, '出せなくなった': '合体技は出せなくなった…', '倒れた': '合体技は出せなくなった…' }[ev.reason];
            if (why) toast(why);
            const c = this.c.get(ev.from);
            if (c && c.alive && c.ready && !this.readyQ.includes(ev.from)) this.readyQ.unshift(ev.from);
            if (!this.cur) this.nextCommand();
          }
          break;
        }
        case 'bondJoin': {
          const c = this.c.get(ev.id);
          if (c) this.banner(`${c.name}が力を合わせた！（${ev.count}人）`);
          this.game.audio.sfx('bond');
          break;
        }
        case 'tactics':
          this.onTactics(ev);
          break;
        case 'end':
          this.endPending = ev.outcome;
          break;
        default:
      }
    }
  }

  present(ev) {
    if (ev.t === 'act') this.plate(ev);
    // 合体技を 使ったら、自分の キャラは 効果が わかる（サーバーでも おぼえる）
    if (ev.dual?.id && [ev.dual.a, ev.dual.b].some((id) => this.mine.includes(id))) {
      const me = this.game.me;
      if (me) me.dualSeen = { ...(me.dualSeen || {}), [ev.dual.id]: 1 };
    }
    // 合体技・ひらめきは さきに 大きく 見せてから
    const pre = (ev.dual ? 820 : ev.hirameki ? 700 : 0) / this.fxSpeed;
    if (pre) {
      this.say((ev.lines || []).slice(0, ev.dual ? 2 : 1), 500);
      if (ev.dual) this.dualFx(ev);
      else this.hiramekiFx(ev);
      setTimeout(() => { if (!this.destroyed) this.presentBody(ev); }, pre);
      return;
    }
    this.presentBody(ev);
  }

  presentBody(ev) {
    const g = this.game;
    const wasTele = !!this.c.get(ev.id)?.telegraph;
    for (const u of ev.upd || []) {
      const c = this.c.get(u.id);
      if (c) Object.assign(c, u, { ready: u.ready });
      else this.c.set(u.id, { ...u, flash: 0, dead: 0, lunge: 0 });
    }
    for (const j of ev.joined || []) if (!this.c.has(j.id)) this.c.set(j.id, { ...j, flash: 0, dead: 0, lunge: 0, appear: 1 });
    if (ev.bond !== undefined) this.bond = ev.bond;
    this.say(ev.lines || [], ev.dur || 1000);
    const actor = this.c.get(ev.id);
    const fx = ev.fx || {};
    // 反撃の構え: やりかえされた 味方の ダメージは、こうげきが あたった あとで 見せる
    const counterIds = new Set((ev.counter || []).map((k) => k.target));
    const counterRes = counterIds.size ? (ev.results || []).filter((r) => counterIds.has(r.id)) : [];
    if (counterIds.size) ev.results = (ev.results || []).filter((r) => !counterIds.has(r.id));
    if (actor && this.mine.includes(actor.id) && !this.cur) this.renderCmdIdle();
    // エフェクト
    const targets = (fx.targets || []).map((id) => this.c.get(id)).filter(Boolean);
    const enemyPts = targets.filter((t) => t.side === 'enemy').map((t) => this.center(t)).filter(Boolean);
    const anim = fx.anim || (fx.type === 'attack' ? (fx.side === 'ally' ? (fx.weapon === 'claw' || fx.weapon === 'none' ? 'punch' : 'slash_heavy') : 'hit') : null);
    const crit = (ev.results || []).some((r) => r.crit);
    const fromAlly = fx.side === 'ally';
    const ab = ev.ability ? ABILITIES[ev.ability] : null;
    const tempo = this.fxTempo();
    const allyTargets = targets.filter((t) => t.side === 'ally');
    // こうどうした てきが うごく（こうげき・じゅもん・ブレス…）。lead: みかたに とどく じかん
    const lead = actor && actor.side === 'enemy' && ev.t === 'act' ? this.enemyAct(actor, fx, ab, allyTargets, wasTele) : 0;
    let hitDelay = 0;
    // ムチ（グループ）・ブーメラン（全体）: 敵ごとに あたる じかんが ちがう（id → ms）
    let perHit = null;
    if (fx.type === 'attack' && fromAlly && fx.reach && enemyPts.length) {
      const hitTs = targets.filter((t) => t.side === 'enemy' && this.center(t));
      const crits = hitTs.map((t) => (ev.results || []).some((r) => r.id === t.id && r.crit));
      const times = this.fx.weaponReach(hitTs.map((t) => this.center(t)), fx.weapon, crits, { id: fx.weaponId, mon: actor?.mon });
      perHit = new Map(hitTs.map((t, i) => [t.id, times[i]]));
      hitDelay = Math.min(...times);
      g.audio.sfx(fx.weapon === 'boomerang' ? 'wind' : 'card');
    } else if (anim && anim !== 'none' && enemyPts.length) {
      if (fx.type === 'attack' && fromAlly) {
        // ぶきごとの エフェクト（あたる じかんが かえってくる）
        hitDelay = this.fx.weaponHit(enemyPts, fx.weapon, crit, { id: fx.weaponId, mon: actor?.mon });
        if (fx.weapon === 'bat') g.audio.sfx('bat');
        else if (fx.weapon === 'axe') g.audio.sfx('smash');
      } else {
        this.fx.play(anim, enemyPts, fx.element, { crit, fromAlly });
        hitDelay = HIT_DELAY[anim] || 0;
      }
    }
    // 味方に かける 合体技（回復・ステージ）は、たたかいの 画面にも 大きく
    if (fx.type === 'dual' && anim && !enemyPts.length) this.fx.play(anim, [{ x: BW / 2, y: BH * 0.55 }], fx.element, { fromAlly: true });
    // みかたへの えんしゅつ（てきの じゅもんは たまが とんでくる）
    if (anim && anim !== 'none' && allyTargets.length) {
      const kind = allyFxKind(anim, fx, ab);
      let d = lead;
      if (!fromAlly && SPELL_ANIMS.has(anim) && !/^wind/.test(anim) && actor) {
        const from = this.center(actor);
        if (from) {
          this.fx.proj(this.allyPt(allyTargets[0]).x, BH + 8, ELEM_COLORS[fx.element] || ELEM_COLORS.dark, { from, travel: 240, delay: lead, size: 4.5 });
          d = lead + 240;
        }
      }
      if (!fromAlly && anim === 'breath') this.fx.tintAt(fx.element === 'fire' ? 'rgba(255, 120, 40, 0.16)' : 'rgba(200, 230, 255, 0.14)', 500 + lead);
      // てきの こうげきが こちらに あたる（がめんの てまえに 大きく）
      if (actor?.side === 'enemy') {
        const style = hitStyle(fx, ab, actor);
        const col = actColor('shimmy', fx, ab);
        allyTargets.forEach((t, i) => {
          const r = (ev.results || []).find((x) => x.id === t.id);
          if (!r?.miss) closeUp(this.fx, this.allyPt(t), style, (r?.dmg || 0) / (t.maxHp || 1), d + i * 60, col);
        });
      }
      allyTargets.forEach((t, i) => this.allyFx(t.id, kind, (d + (allyTargets.length > 1 ? i * 60 : 0)) / tempo));
      if (!hitDelay) hitDelay = d;
    }
    // じゅもんを となえた みかたは すこし ひかる
    if (fromAlly && actor?.side === 'ally' && ab && (ab.kind === 'spell' || ab.spellLike)) {
      this.glowStatus(actor.id, (ELEM_COLORS[fx.element] || ELEM_COLORS.light)[0]);
    }
    if (fx.type === 'poison') {
      for (const u of ev.upd || []) {
        const c = this.c.get(u.id);
        if (!c || !(c.status || []).includes('poison')) continue;
        if (c.side === 'ally') this.allyFx(c.id, 'poison');
        else {
          const pt = this.center(c);
          if (pt) this.fx.burst(pt.x, pt.y, ['#b06ae0', '#7a3aa8', '#d8a8ff'], 10, 30, { vy: -20 });
        }
      }
    }
    if (fx.type === 'telegraph') { g.audio.sfx('warn'); this.banner('！大技が来る！防御で身を守れ！', 'danger'); }
    if (fx.type === 'stance') { g.audio.sfx('warn'); this.banner('！反撃の構え！なぐると反撃される', 'danger'); }
    if (fx.type === 'bondStart') this.startBondPrompt(ev);
    if (fx.type === 'flee') g.audio.sfx('flee');
    if (fx.type === 'wagon') wagonSwapFx(this, ev);
    if (ev.combo >= 2 && !ev.dual) this.banner(`れんけい ${ev.combo}！`, 'combo');
    if (anim === 'minadein') g.audio.sfx('bolt');
    if (anim && ANIM_SFX[anim]) g.audio.sfx(ANIM_SFX[anim]);
    else if (fx.type === 'ability' && fromAlly && !ANIM_SFX[anim]) g.audio.sfx('spell');
    if (fx.anim === 'quake') {
      const q = () => { if (!this.destroyed) this.shake(500, 7); };
      if (lead) setTimeout(q, lead / tempo);
      else q();
    }
    // けっか（じゅもんは あたった ときに）。only: その 敵の ぶん だけ（ムチ・ブーメラン）
    const apply = (only = null) => {
      if (this.destroyed) return;
      let hurtAlly = false;
      for (const r of ev.results || []) {
        if (only && r.id !== only) continue;
        const t = this.c.get(r.id);
        if (!t) continue;
        if (r.aff && r.element && t.species) {
          this.tried.add(`${t.species}|${r.element}`);
          if (r.aff === 'weak' && r.dmg > 0) this.floatNum(t, '弱点！', 'weak');
        }
        if (r.dmg > 0) {
          if (t.side === 'enemy') {
            t.flash = 320;
            if (!fx.anim || fx.type === 'attack' || hitDelay) g.audio.sfx(r.crit ? 'crit' : 'hit');
          } else {
            hurtAlly = true;
            this.hitStatus(t.id, r.dmg / (t.maxHp || 1));
            g.audio.sfx(r.crit ? 'crit' : 'hurt');
          }
          this.floatNum(t, String(r.dmg), r.crit ? 'crit' : '');
        } else if (r.heal > 0) {
          this.floatNum(t, `+${r.heal}`, 'heal');
          if (t.side === 'ally') { if (!allyTargets.includes(t)) this.allyFx(t.id, 'heal'); } else this.fx.play('heal1', [this.center(t)].filter(Boolean));
        } else if (r.miss || r.dmg === 0) {
          this.floatNum(t, 'ミス', 'miss');
          g.audio.sfx('miss');
        }
      }
      // 味方が 大きな ダメージを 受けた（HPの 2わりいじょう・つうこん・ボス）: 画面が ゆれて 赤く 光る
      const bigHurt = (ev.results || []).some((r) => r.dmg > 0 && this.c.get(r.id)?.side === 'ally' && r.dmg >= (this.c.get(r.id).maxHp || 1) * 0.2);
      // いたみの 大きさで がめんが ゆれて、ふちが あかく なる
      const worst = Math.min(1, Math.max(0, ...(ev.results || []).filter((r) => r.dmg > 0 && this.c.get(r.id)?.side === 'ally').map((r) => r.dmg / (this.c.get(r.id).maxHp || 1))));
      if (hurtAlly && actor?.side === 'enemy') {
        this.fx.hitStop(120 + worst * 260, 0, 0.7 + worst * 3.5);
        this.fx.vignette('#ff2020', 460, Math.min(0.55, 0.2 + worst * 0.8));
      }
      if (hurtAlly && actor?.side === 'enemy' && (actor.boss || bigHurt || (ev.results || []).some((r) => r.crit))) {
        this.shake(bigHurt || actor.boss ? 380 : 300, 4 + worst * 8);
        this.fx.flash = 80;
        this.fx.flashColor = '#ff5a5a';
      }
      for (const c of this.c.values()) {
        if (c.side === 'enemy' && !c.alive && !c.dead && (!only || c.id === only)) {
          c.dead = 1;
          g.audio.sfx('defeat');
        }
      }
    };
    if (perHit) {
      // あたった じゅんに ダメージの かずを 出す（エフェクトの 時計で。さいごに のこりも まとめて）
      for (const [id, ms] of perHit) this.fx.at(ms, () => apply(id));
      const rest = (ev.results || []).some((r) => !perHit.has(r.id));
      this.fx.at(Math.max(...perHit.values()) + 30, () => {
        if (this.destroyed) return;
        if (rest) for (const r of ev.results || []) if (!perHit.has(r.id)) apply(r.id);
        for (const c of this.c.values()) if (c.side === 'enemy' && !c.alive && !c.dead) c.dead = 1;
      });
    } else if (hitDelay > 0) setTimeout(apply, hitDelay / tempo);
    else apply();
    if (ev.counter?.length) this.counterFx(ev.counter, counterRes, (perHit ? Math.max(...perHit.values()) : hitDelay) + 380);
    // えらんでいる とちゅうで たおれた・ねむった など
    const cur = this.cur && this.c.get(this.cur);
    if (cur && (!cur.alive || (cur.status || []).some((x) => x === 'sleep' || x === 'paralyze') || !cur.ready)) this.dropReady(cur.id);
    else if (!this.cur && this.menu && !this.targeting) this.renderCmdIdle();
    this.renderStatus();
    this.updateAutoBtn();
  }

  // ───────────── さくせん（つよさの まどを タップ） ─────────────
  // かえられるのは じぶん（オートの ときの さくせん）と じぶんの なかま（サーバーも たしかめる。world/tactics.js）
  canTactics(a) {
    const me = this.game.me?.id;
    return !!a && a.side === 'ally' && !a.fled && !!me && a.tacBy === me && !this.ended;
  }

  tacticsMenu(id) {
    const a = this.c.get(id);
    if (!this.canTactics(a) || this.destroyed) return;
    this.closeTactics();
    const self = a.kind === 'player';
    const now = a.tactics || 'balanced';
    // じぶんは「めいれいさせろ」なし（いつも じぶんで えらぶ）
    const items = Object.entries(TACTICS).filter(([k]) => !self || k !== 'manual')
      .map(([k, x]) => ({ label: x.name, value: k, right: k === now ? '今' : '', cls: k === now ? 'tac-now' : '' }));
    const m = new ListMenu(this.game.input, {
      items,
      sound: (x) => this.game.audio.sfx(x),
      start: Math.max(0, items.findIndex((it) => it.value === now)),
      back: '閉じる',
      onSelect: (it) => {
        this.closeTactics();
        if (it.value !== now) this.game.net.send({ t: 'battle', actor: id, tactics: it.value });
      },
      onCancel: () => this.closeTactics(),
    });
    const box = el('div', { class: 'win b-tactics' },
      el('div', { class: 'bt-t', text: self ? `${a.name}の作戦（オートのとき）` : `${a.name}の作戦` }), m.root);
    box.addEventListener('click', (e) => e.stopPropagation());
    // 戦いの がめん ぜんたいの まんなか（えの ところが せまい スマホでも ぜんぶ 見える）
    this.root.append(box);
    this.menu?.blur();
    m.focus();
    this.tac = { id, box, menu: m };
    this.game.audio.sfx('cursor');
  }

  closeTactics() {
    const t = this.tac;
    if (!t) return;
    this.tac = null;
    t.menu.blur();
    t.box.remove();
    if (!this.invite) this.menu?.focus();
  }

  // さくせんが かわった（サーバーから）。めいれいさせろ に なった なかまは じぶんが うごかす
  onTactics(ev) {
    const c = this.c.get(ev.id);
    if (!c) return;
    c.tactics = ev.tactics;
    c.controller = ev.controller;
    c.auto = ev.auto;
    const mine = !!ev.controller && ev.controller === this.game.sid;
    if (mine && !this.mine.includes(ev.id)) {
      this.mine.push(ev.id);
      this.mine.sort((x, y) => (this.c.get(x)?.kind === 'player' ? 0 : 1) - (this.c.get(y)?.kind === 'player' ? 0 : 1));
      if (c.ready && c.alive && !c.auto && !this.readyQ.includes(ev.id)) {
        this.readyQ.push(ev.id);
        if (!this.cur) this.nextCommand();
      }
    } else if (!mine && this.mine.includes(ev.id)) {
      this.mine = this.mine.filter((x) => x !== ev.id);
      this.dropReady(ev.id);
    }
    if (this.tac?.id === ev.id) this.closeTactics();
    this.renderStatus();
  }

  // ───────────── 合体技 ─────────────
  // 自分の キャラが 今 出せる 合体技（サーバーでも たしかめる）
  myDualOptions(a) {
    if (!a || a.mon) return [];
    const info = (x) => ({
      id: x.id, name: x.name, alive: x.alive, abilities: x.abilities || [], mp: x.mp, atb: x.atb, ready: x.ready, queued: !!x.queued,
      inviting: false, statuses: x.status || [], weaponCat: x.weaponCat,
      waiting: x.id !== a.id && (!!x.waitDual || (!!x.dualTarget && x.dualTarget !== a.id)),
      usable: (id) => {
        const ab = ABILITIES[id];
        return !!ab && (ab.kind !== 'combo' || comboAllowed(x.pc || { job: x.job, jobs: {} }, id)) && weaponOk(ab, x.weaponCat);
      },
    });
    const others = this.allies().filter((x) => x.id !== a.id && !x.mon);
    return dualOptions(info(a), others.map(info), weaponOk, { anyGauge: true });
  }

  dualMenu(opts) {
    if (!opts.length) {
      toast('今は合体技を出せる仲間がいない');
      return this.openCommand();
    }
    const role = (t) => (t.parts.some((x) => x.type === 'phys' || x.type === 'magic') ? 'dmg' : t.parts.some((x) => x.type === 'heal' || x.type === 'cure') ? 'heal' : 'sup');
    const a = this.myActor;
    const items = opts.map((o) => {
      const t = DUAL_TECHS[o.id];
      const e = o.element;
      const tt = targetTag(t.target);
      return {
        html: `${ELEMENT_NAMES[e] ? `<span class="elem e-${e}">${ELEMENT_NAMES[e]}</span>` : ''}${esc(t.name)}${tt ? `<span class="tag tgt t-${t.target}">${tt}</span>` : ''}<span class="with-line">${esc(o.partnerName)}といっしょに${o.now ? '' : '（よやく）'}</span>`,
        right: `${o.mp[0]}`, value: o, cls: `k-${role(t)}${o.now ? '' : ' later'}`,
      };
    });
    this.showMenu(items, (it) => {
      const o = it.value;
      const t = DUAL_TECHS[o.id];
      const go = (target) => this.send({ type: 'dual', id: o.id, partner: o.partner, target });
      if (t.target === 'enemy' || t.target === 'group') return this.pickFoe(t.target, (tid) => go(tid), t.name, o.element, () => this.dualMenu(this.myDualOptions(this.myActor)));
      return go();
    }, () => this.openCommand(), '合体技（2人の番を使う）', (it) => {
      if (!it) return;
      const o = it.value;
      const t = DUAL_TECHS[o.id];
      // はじめて 使う までは 効果は ひみつ。よやくは 仲間の ゲージが たまったら 出す（まどは 3行に おさめる）
      const desc = dualKnown(this.game.me, o.id) ? t.desc : '効果は？？？（一度使うとわかる）';
      const when = o.now ? '' : `\n${o.partnerName}のゲージがたまったら出す（よやく）`;
      this.info(`【合体技】${o.partnerName}と（${ABILITIES[o.skills[0]]?.name}＋${ABILITIES[o.skills[1]]?.name}）MP ${o.mp[0]}＋${o.mp[1]}\n${desc}${when}`);
    });
  }

  // 家族から 合体技に さそわれた
  showInvite(ev) {
    this.closeInvite();
    const t = DUAL_TECHS[ev.tech];
    const bar = el('div', { class: 'di-bar' }, el('i', { style: { animationDuration: `${ev.ms || 7000}ms` } }));
    const box = el('div', { class: 'win dual-invite' },
      el('div', { class: 'di-t', text: `${ev.fromName}が合体技にさそっている！` }),
      el('div', { class: 'di-n', text: `「${t?.name || '合体技'}」` }),
      el('div', { class: 'di-d', text: t && dualKnown(this.game.me, ev.tech) ? t.desc : '効果は？？？（一度使うとわかる）' }), bar);
    const answer = (ok) => {
      this.game.net.send({ t: 'battle', actor: ev.to, cmd: { type: 'dualAnswer', invite: ev.invite, ok } });
      this.closeInvite();
    };
    const m = new ListMenu(this.game.input, {
      items: [{ label: '参加する！', value: true }, { label: 'ことわる', value: false }],
      sound: (x) => this.game.audio.sfx(x),
      onSelect: (it) => answer(it.value),
      onCancel: () => answer(false),
    });
    box.append(m.root);
    this.stage.append(box);
    this.menu?.blur();
    m.focus();
    this.invite = { invite: ev.invite, box, menu: m };
    this.game.audio.sfx('dual');
  }

  closeInvite() {
    const iv = this.invite;
    if (!iv) return;
    this.invite = null;
    iv.menu.blur();
    iv.box.remove();
    this.menu?.focus();
  }

  // ───────────── だれが 何を したか ─────────────
  plate(ev) {
    const a = this.c.get(ev.id);
    if (!a || !ev.name) return;
    let cls = a.side === 'enemy' ? 'enemy' : 'ally';
    let who = a.name;
    let what = ev.sub ? `${ev.name} → ${ev.sub}` : ev.name;
    if (ev.dual) {
      cls = 'dual';
      who = `${a.name}＆${this.c.get(ev.dual.b)?.name || ''}`;
      what = ev.dual.name;
    } else if (ev.hirameki) cls = 'hira';
    const ai = a.side === 'ally' && (!a.controller || a.auto);
    this.plateEl?.remove();
    const e = el('div', { class: `b-plate ${cls}` }, el('span', { class: 'who', text: who }), ai ? el('span', { class: 'ai', text: 'オート' }) : null, el('span', { class: 'what', text: what }));
    this.stage.append(e);
    this.plateEl = e;
    clearTimeout(this.plateT);
    this.plateT = setTimeout(() => e.remove(), Math.max(1400, (ev.dur || 900) * 0.9));
    if (a.side === 'ally' && !ev.dual) this.glowStatus(a.id, ev.hirameki ? '#fff6b0' : '#9ad8ff');
  }

  // ひらめき！（電球と 大きな 文字）
  hiramekiFx(ev) {
    const h = ev.hirameki;
    this.game.audio.sfx('hirameki');
    this.fx.flash = 220;
    this.fx.flashColor = '#fff6b0';
    const s = this.statusBoxes.get(h.actor);
    if (s) {
      const bulb = el('div', { class: 'bulb', html: BULB_SVG });
      s.box.append(bulb);
      setTimeout(() => bulb.remove(), 2000);
      this.glowStatus(h.actor, '#fff6b0');
    }
    const who = this.c.get(h.actor)?.name || '';
    const cut = el('div', { class: 'b-hira' }, el('div', { class: 'h0', html: BULB_SVG }), el('div', { class: 'h1', text: `${who}はひらめいた！` }), el('div', { class: 'h2', text: h.name }));
    this.stage.append(cut);
    setTimeout(() => cut.remove(), 1700);
  }

  // 合体技の カットイン（2人の かおと 技の 名前）
  dualFx(ev) {
    const d = ev.dual;
    const a = this.c.get(d.a), b = this.c.get(d.b);
    this.game.audio.sfx('dual');
    this.fx.flash = 260;
    this.fx.flashColor = '#ffffff';
    const face = (x) => el('img', { class: 'cf', alt: '', src: x ? faceURL({ look: x.look, job: x.job, eq: x.eq, mon: x.mon }) : '' });
    const cut = el('div', { class: 'b-dual' },
      el('div', { class: 'rays' }),
      el('div', { class: 'l' }, face(a), el('span', { text: a?.name || '' })),
      el('div', { class: 'r' }, face(b), el('span', { text: b?.name || '' })),
      el('div', { class: 'nm' }, el('small', { text: '合体技' }), el('b', { text: d.name })));
    this.stage.append(cut);
    setTimeout(() => cut.remove(), 1500);
    for (const id of [d.a, d.b]) this.glowStatus(id, '#ffd66b');
  }

  center(t) {
    const m = (this.layout || []).find((l) => l.c === t || l.c.id === t.id);
    if (!m) return null;
    return { x: m.x + m.w / 2, y: m.y + m.h / 2, w: m.w, h: m.h, foot: m.y + m.h };
  }

  // みかたの いち（がめんの てまえ・したの ほう。まどの じゅんばん）
  allyPt(t) {
    const list = this.allies();
    const n = Math.max(1, list.length);
    const i = Math.max(0, list.findIndex((a) => a.id === t.id));
    return { x: BW / 2 + (i - (n - 1) / 2) * Math.min(58, (BW * 0.8) / n), y: BH - 22 };
  }

  // てきの うごき（こうげき・じゅもん・ブレス…）。へんじ: みかたに とどく じかん
  enemyAct(actor, fx, ab, allyTargets, finisher) {
    const kind = enemyActKind(fx, ab, actor);
    const pt = kind && this.center(actor);
    if (!pt) return 0;
    const to = allyTargets.map((t) => this.allyPt(t));
    return startEnemyAct(this.fx, actor, pt, kind, to, { fx, ab, finisher: finisher && kind !== 'charge' });
  }

  // おもくて カクカク する きかいでは え の こまかさを 1だんずつ さげる（3ばい → 2ばい → 1ばい）
  checkQuality(dt) {
    this.avgDt = this.avgDt ? this.avgDt * 0.9 + dt * 0.1 : 16;
    if (this.res > 1 && this.time > 2500 && this.time - (this.resAt || 0) > 1500 && this.avgDt > 38) {
      this.res = battleRes = this.res - 1;
      this.resAt = this.time;
      this.avgDt = 16;
      this.canvas.width = BW * this.res;
      this.canvas.height = BH * this.res;
    }
  }

  // たたかいの はやさ（せっていの はやさに エフェクトも あわせる）
  fxTempo() {
    // サーバーから きた「戦いの速さ（エフェクト）」（前の セーブも ならした あと の あたい）
    return Math.max(0.5, Math.min(2, this.fxSpeed || 1));
  }

  floatNum(t, text, cls) {
    let px, py;
    if (t.side === 'enemy') {
      const p = this.center(t);
      if (!p) return;
      const r = this.canvas.getBoundingClientRect();
      const sr = this.stage.getBoundingClientRect();
      px = r.left - sr.left + p.x / BW * r.width;
      py = r.top - sr.top + (p.y - 8) / BH * r.height;
      const e = el('div', { class: `dmg ${cls}`, text, style: { left: `${px}px`, top: `${py}px` } });
      this.floatEl.append(e);
      setTimeout(() => e.remove(), 1150);
    } else {
      const s = this.statusBoxes.get(t.id);
      if (!s) return;
      const e = el('div', { class: `dmg ${cls}`, text, style: { left: '50%', top: '40%' } });
      s.box.append(e);
      setTimeout(() => e.remove(), 1150);
    }
  }

  // power: HPに たいする ダメージの わりあい（大きいほど 大きく ゆれて あかく ひかる）
  hitStatus(id, power = 0) {
    const s = this.statusBoxes.get(id);
    if (!s) return;
    s.box.classList.remove('hit');
    void s.box.offsetWidth;
    s.box.classList.add('hit');
    if (power > 0 && s.box.animate) {
      const k = Math.min(1, power * 2.5);
      const px = Math.round(3 + k * 6);
      const red = `0 0 0 2px #000, 0 0 ${Math.round(8 + k * 14)}px rgba(255, 50, 50, ${(0.5 + k * 0.45).toFixed(2)})`;
      s.box.animate([
        { transform: 'translate(0, 0)', boxShadow: red },
        { transform: `translate(${-px}px, 1px)` },
        { transform: `translate(${px}px, -1px)` },
        { transform: `translate(${-Math.round(px / 2)}px, 0)` },
        { transform: 'translate(0, 0)', boxShadow: '0 0 0 2px #000' },
      ], { duration: 300 + k * 200, easing: 'ease-out' });
    }
  }

  // みかたの まどの うえの えんしゅつ（ひっかき・ほのお・こおり・かいふく・↑↓ など）
  allyFx(id, kind, delay = 0) {
    const run = () => {
      if (this.destroyed) return;
      const s = this.statusBoxes.get(id);
      if (!s) return;
      const e = el('div', { class: `afx afx-${kind}` });
      if (kind === 'up') e.textContent = '▲ ▲ ▲';
      else if (kind === 'down') e.textContent = '▼ ▼ ▼';
      else if (kind === 'sleep') e.textContent = 'Z z z';
      s.box.append(e);
      setTimeout(() => e.remove(), 950);
    };
    if (delay > 0) setTimeout(run, delay);
    else run();
  }

  // 反撃の構えの 敵が、こうげきして きた 味方に やりかえす（delay: こうげきが あたった あと）
  counterFx(list, results, delay) {
    const g = this.game;
    const tempo = this.fxTempo();
    setTimeout(() => {
      if (this.destroyed) return;
      this.banner('反撃された！', 'danger');
      list.forEach((k, i) => {
        const by = this.c.get(k.actor), t = this.c.get(k.target);
        if (!t) return;
        const r = results.find((x) => x.id === t.id);
        const lead = (by ? this.enemyAct(by, { type: 'attack' }, null, [t], false) : 0) + i * 120;
        setTimeout(() => {
          if (this.destroyed) return;
          if (!r || r.miss || !(r.dmg > 0)) {
            this.floatNum(t, 'ミス', 'miss');
            g.audio.sfx('miss');
            return;
          }
          const pow = r.dmg / (t.maxHp || 1);
          closeUp(this.fx, this.allyPt(t), 'claw', pow, 0, '#ffa22a');
          this.hitStatus(t.id, pow);
          this.floatNum(t, String(r.dmg), r.crit ? 'crit' : '');
          g.audio.sfx(r.crit ? 'crit' : 'hurt');
          this.fx.vignette('#ff2020', 460, Math.min(0.5, 0.2 + pow * 0.8));
          this.shake(320, 4 + pow * 8);
        }, lead / tempo);
      });
    }, delay / tempo);
  }

  glowStatus(id, color) {
    const s = this.statusBoxes.get(id);
    if (!s) return;
    s.box.animate([{ boxShadow: `0 0 0 2px #000, 0 0 18px ${color}` }, { boxShadow: '0 0 0 2px #000' }], { duration: 700 });
  }

  banner(text, cls = '') {
    const b = el('div', { class: `b-banner ${cls}`, text });
    this.stage.append(b);
    setTimeout(() => b.remove(), 1600);
  }

  shake(ms, px = 5) {
    const a = Math.round(px), b = Math.round(px * 0.4), c = Math.round(px * 0.6);
    this.stage.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-a}px,${b}px)` }, { transform: `translate(${a}px,${-b}px)` }, { transform: `translate(${-c}px,${Math.round(b / 2)}px)` }, { transform: 'translate(0,0)' }], { duration: ms });
  }

  // きずな技: みんなで ボタンを おす
  startBondPrompt(ev) {
    this.game.audio.sfx('bond');
    this.fx.flash = 400;
    this.fx.flashColor = '#ffe0f4';
    const a = this.primary;
    if (!a || !a.alive || a.auto || ev.id === a.id) return;
    const btn = el('button', { class: 'bondjoin', text: '★ 力を合わせる！ ★' });
    const join = () => {
      this.game.net.send({ t: 'battle', actor: a.id, cmd: { type: 'bondJoin' } });
      btn.remove();
      this.game.input.pop(h);
    };
    const h = { el: btn, onNav: (x) => { if (x === 'a') join(); } };
    btn.addEventListener('click', join);
    this.stage.append(btn);
    this.game.input.push(h);
    setTimeout(() => {
      if (btn.isConnected) {
        btn.remove();
        this.game.input.pop(h);
      }
    }, (ev.bondWindow || 3500) - 200);
  }

  // ───────────── まいフレーム ─────────────
  update(dt) {
    this.time += dt;
    this.fx.tempo = this.fxTempo();
    this.checkQuality(dt);
    // メッセージの じゅんばん
    if (this.showing) {
      this.showing.left -= dt;
      if (this.showing.left <= 0 || this.queue.length > 2) this.showing = null;
    }
    if (!this.showing && this.queue.length) {
      const ev = this.queue.shift();
      this.present(ev);
      this.showing = { left: Math.max(350, (ev.dur || 900) * 0.75) };
    }
    if (!this.showing && !this.queue.length && this.endPending && !this.ended) {
      this.ended = true;
      this.closeMenus();
    }
    // ゲージを なめらかに（ウェイトで だれかが えらんでいる 間は 1ミリも うごかさない）
    const locked = !!this.showing || this.choosingPause();
    for (const c of this.c.values()) {
      if (!c.alive || c.ready || locked) continue;
      if (c.rate && c.atb < 100) c.atb = Math.min(99.5, c.atb + c.rate * dt * (this.fxSpeed || 1) * 0.6);
      if (c.flash > 0) c.flash -= dt;
      if (c.lunge > 0) c.lunge -= dt;
    }
    for (const c of this.c.values()) {
      if (c.flash > 0) c.flash -= dt;
      if (c.lunge > 0) c.lunge -= dt;
      if (c.dead > 0 && c.dead < 2) c.dead += dt / 500;
      if (c.appear > 0) c.appear -= dt / 400;
      if (c.act && (c.act.age += dt * this.fx.tempo) >= c.act.dur) c.act = null;
    }
    this.fx.update(dt); // はやさは fx.tempo で かける
    this.updateGauges();
    this.draw();
  }

  // サーバーの「ウェイトモードで 止まっている」と おなじ かんがえかた
  choosingPause() {
    if (!this.waitMode) return false;
    for (const c of this.c.values()) if (c.side === 'ally' && c.controller && !c.auto && c.alive && c.ready) return true;
    return false;
  }

  computeLayout() {
    const list = this.enemies().filter((c) => !(c.dead >= 2));
    // え の 大きさは res（こまかさ）で わって ほんとうの 大きさに
    const sprites = list.map((c) => {
      const img = monsterCanvas(c.species, Math.floor(this.time / 420 + (c.slot || 0)) % 2);
      const r = img.res || 1;
      return { c, img, iw: img.width / r, ih: img.height / r };
    });
    let scale = 1;
    const totalW = () => sprites.reduce((s, x) => s + x.iw * scale + 6, 0);
    while (totalW() > BW - 12 && scale > 0.55) scale -= 0.05;
    let x = (BW - totalW()) / 2 + 3;
    const baseY = 124;
    return sprites.map(({ c, img, iw, ih }) => {
      const w = iw * scale, h = ih * scale;
      const out = { c, img, x, y: baseY - h, w, h };
      x += w + 6;
      return out;
    });
  }

  draw() {
    const x = this.ctx;
    x.imageSmoothingEnabled = false;
    const so = this.fx.shakeOffset;
    if (so.x || so.y) {
      x.fillStyle = '#000';
      x.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // なかみは BW×BH の まま、res ばい（ふつうは BRES）の こまかさで かく
    const R = this.res;
    // はいけいは こまかさに あわせて 1かいだけ 大きく しておく（まいかい のばすと おもい）
    if (!this.bgHi || this.bgHi.width !== BW * R) {
      this.bgHi = makeCanvas(BW * R, BH * R);
      const bx = ctxOf(this.bgHi);
      bx.drawImage(this.bg, 0, 0, BW * R, BH * R);
    }
    x.setTransform(1, 0, 0, 1, Math.round(so.x * R), Math.round(so.y * R));
    x.drawImage(this.bgHi, 0, 0);
    x.setTransform(R, 0, 0, R, so.x * R, so.y * R);
    const snap = (v) => Math.round(v * R) / R;
    this.layout = this.computeLayout();
    for (const m of this.layout) {
      const c = m.c;
      let dx = 0, dy = Math.round(Math.sin(this.time / 300 + (c.slot || 0)) * 1);
      if (c.flash > 0) dx = Math.round(Math.sin(c.flash / 20) * 2);
      const alpha = c.dead > 0 ? Math.max(0, 1 - (c.dead - 1)) : 1;
      if (c.dead > 0 && c.dead < 1.2 && Math.floor(this.time / 60) % 2) continue;
      const base = c.appear > 0 ? 1 - c.appear : c.dead > 1 ? alpha : 1;
      x.globalAlpha = base;
      // がめんより こまかい え は なめらかに ちぢめる（ドットが ぬけないように）
      x.imageSmoothingEnabled = (m.img.res || 1) > x.getTransform().a * 1.01;
      x.imageSmoothingQuality = 'high';
      // ためこみ中の ボスは あかく ひかる
      if (c.telegraph && c.alive) {
        const pulse = 0.4 + Math.sin(this.time / 90) * 0.3;
        x.globalAlpha = pulse;
        x.drawImage(white(m.img, '#ff3a3a'), snap(m.x + dx) - 2, snap(m.y + dy) - 2, m.w + 4, m.h + 4);
        x.globalAlpha = base;
      }
      // 反撃の構え: だいだいいろに ひかる（物理で こうげきすると 反撃される）
      if (c.stance && c.alive) {
        const pulse = 0.45 + Math.sin(this.time / 140) * 0.25;
        x.globalAlpha = pulse * base;
        x.drawImage(white(m.img, '#ffa22a'), snap(m.x + dx) - 2, snap(m.y + dy) - 2, m.w + 4, m.h + 4);
        x.globalAlpha = base;
      }
      // こうどうちゅうの すがた（とびこむ・ためる・はく など。あしもとを きじゅんに のびちぢみ）
      const P = c.act ? actPose(c.act) : null;
      const sx = P ? P.sx : 1, sy = P ? P.sy : 1;
      if (P) { dx += P.dx; dy += P.dy; }
      const w = m.w * sx, h = m.h * sy;
      const px = snap(m.x + m.w / 2 + dx - w / 2), py = snap(m.y + m.h + dy - h);
      if (P && P.aura && P.auraA > 0) {
        const r = Math.max(w, h) * 0.8;
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = P.auraA * 0.6 * base;
        x.drawImage(glowSprite(P.aura), px + w / 2 - r, py + h / 2 - r, r * 2, r * 2);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = P.auraA * 0.8 * base;
        x.drawImage(white(m.img, P.aura), px - 1.5, py - 1.5, w + 3, h + 3);
      }
      if (P && P.ghost) {
        // ざんぞう
        for (const [lag, ga] of [[70, 0.18], [35, 0.3]]) {
          const G = actPose(c.act, c.act.age - lag);
          const gw = m.w * G.sx, gh = m.h * G.sy;
          x.globalAlpha = ga * base;
          x.drawImage(white(m.img, '#ffffff'), m.x + m.w / 2 + dx - P.dx + G.dx - gw / 2, m.y + m.h + dy - P.dy + G.dy - gh, gw, gh);
        }
      }
      x.globalAlpha = base;
      const img = c.flash > 0 && Math.floor(c.flash / 60) % 2 === 0 ? white(m.img) : m.img;
      x.drawImage(img, px, py, w, h);
      if (P && P.white > 0) {
        x.globalAlpha = P.white * base;
        x.drawImage(white(m.img), px, py, w, h);
      }
      // ねらい（グループの ときは その グループ みんなに ▼。すこし しろく ひかる）
      const tg = this.targeting;
      const aimed = tg?.side === 'enemy' && c.alive && (tg.mode === 'group' ? !!this.hoverGroup && c.species === this.hoverGroup : this.hover === c.id);
      if (aimed) {
        x.globalAlpha = (0.16 + 0.12 * Math.sin(this.time / 110)) * base;
        x.drawImage(white(m.img), px, py, w, h);
      }
      x.imageSmoothingEnabled = false;
      x.globalAlpha = 1;
      if (aimed) {
        x.fillStyle = '#ffd66b';
        const ax = Math.round(m.x + m.w / 2);
        const ay = Math.round(m.y - 6 + Math.sin(this.time / 120) * 2);
        x.fillRect(ax - 3, ay - 3, 6, 2); x.fillRect(ax - 2, ay - 1, 4, 2); x.fillRect(ax - 1, ay + 1, 2, 2);
      }
      // 反撃の構えの しるし（頭の 上で ひらいた はさみ ＞＜ が ゆれる）
      if (c.stance && c.alive) {
        const sx0 = Math.round(m.x + m.w / 2), sy0 = Math.round(m.y - 4 + Math.sin(this.time / 160) * 1.5);
        const open = Math.floor(this.time / 280) % 2;
        x.fillStyle = '#2a1206';
        x.fillRect(sx0 - 9, sy0 - 5, 18, 10);
        x.fillStyle = '#ffb03a';
        for (const sgn of [-1, 1]) {
          // 左は ＞、右は ＜（まん中の 点が 内がわ）
          const bx = sx0 + sgn * (5 + open);
          x.fillRect(bx - 1, sy0 - 3, 2, 2); x.fillRect(bx - 1 - sgn * 2, sy0 - 1, 2, 2); x.fillRect(bx - 1, sy0 + 1, 2, 2);
        }
        x.fillStyle = '#ffe2a8';
        x.fillRect(sx0 - 1, sy0 - 1, 2, 2);
      }
      // じょうたい いじょう
      if (c.alive && (c.status || []).includes('sleep') && Math.floor(this.time / 500) % 2) {
        x.fillStyle = '#ffffff';
        x.font = '8px monospace';
        x.fillText('Z', Math.round(m.x + m.w - 6), Math.round(m.y + 4));
      }
      if (c.alive && (c.status || []).includes('confuse')) {
        x.fillStyle = '#ffe066';
        const a = this.time / 150;
        x.fillRect(Math.round(m.x + m.w / 2 + Math.cos(a) * 8), Math.round(m.y - 2 + Math.sin(a) * 2), 2, 2);
      }
    }
    this.fx.draw(x);
    x.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ───────────── おわり ─────────────
  // けっか: ボタン（タップ・クリック・Z/Enter/スペース・ゲームパッドA）を おすと 1行ずつ すすむ（ui/result.js）
  //   レベルが 上がった ときは レベルアップの きょく（よいんを のこして、つぎの 行は ボタンを まつ）
  showResult(msg) {
    return new Promise((resolve) => {
      this.closeMenus();
      const g = this.game;
      const au = g.audio;
      if (msg.outcome === 'win') au.play('victory', { force: true });
      else if (msg.outcome === 'lose') au.play('lose', { force: true });
      else au.stop(0.3);
      // ジングルの あとに たたかいの きょくに もどらない（とじたら フィールドの きょく）
      au.resumeTrack = null;
      const lines = msg.lines || [];
      if (!lines.length) return resolve();
      // うしろの まど（たたかいの メッセージ・コマンド）は からに して、けっかだけを 見せる
      this.cmdEl.innerHTML = '';
      this.msgEl.innerHTML = '';
      const pager = new ResultPager(lines);
      const list = el('div', { class: 'res-lines' });
      const more = el('div', { class: 'res-more', text: '▼' });
      const box = el('div', { class: 'win b-result scroll' }, list, more);
      this.root.append(box);
      this.resultBox = box;
      let moreT = null;
      let finished = false;
      const waitMark = () => {
        more.classList.remove('on');
        clearTimeout(moreT);
        moreT = setTimeout(() => { if (!finished) more.classList.add('on'); }, pager.waitLeft(performance.now()));
      };
      const show = (step) => {
        const row = el('div', { class: `res-${step.kind}`, text: step.line });
        list.append(row);
        box.scrollTop = box.scrollHeight;
        switch (step.kind) {
          case 'level': {
            row.classList.add('gold', 'lvup');
            // レベルアップの きょく（なりおわる まえに つぎの 人が 上がったら、きょくは そのまま きらきらだけ）
            if (au.music?.id === 'levelup') au.sfx('sparkle');
            else au.play('levelup', { force: true });
            au.resumeTrack = null;
            const who = levelUpName(step.line);
            const a = who && this.allies().find((x) => x.name === who);
            if (a) this.glowStatus(a.id, '#ffd66b');
            break;
          }
          case 'job': row.classList.add('gold'); au.sfx('key'); break;
          case 'learn': row.classList.add('good'); au.sfx('sparkle'); break;
          case 'item': row.classList.add('good'); au.sfx('item'); break;
          case 'gold': au.sfx('coin'); break;
          default:
        }
        waitMark();
      };
      const advance = () => {
        if (finished) return;
        const step = pager.advance(performance.now());
        if (!step) return;
        if (step.close) return finish();
        show(step);
      };
      const h = { el: box, onNav: (a) => { if (a === 'a' || a === 'b') advance(); } };
      // がめんの どこを さわっても すすむ
      const onTap = (e) => {
        e.preventDefault();
        advance();
      };
      this.root.addEventListener('click', onTap);
      g.input.push(h);
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(moreT);
        g.input.pop(h);
        this.root.removeEventListener('click', onTap);
        this.closeResult = null;
        resolve();
      };
      // 画面が こわされた（つぎの たたかいが はじまった など）ときも とじる
      this.closeResult = finish;
      advance();
    });
  }

  destroy() {
    this.destroyed = true;
    this.closeTactics();
    this.closeResult?.();
    this.closeMenus();
    removeEventListener('resize', this.onResize);
    document.fonts?.removeEventListener?.('loadingdone', this.onFonts);
    this.ro?.disconnect();
    this.root.innerHTML = '';
    this.root.hidden = true;
  }
}
