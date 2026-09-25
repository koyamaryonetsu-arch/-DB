// たたかいの がめん（むかしの RPG ふう 1がめん）
import { el, ListMenu, toast } from './ui/dom.js';
import { ABILITIES } from '../shared/data/abilities.js';
import { ITEMS } from '../shared/data/items.js';
import { JOBS } from '../shared/data/jobs.js';
import { MONSTERS } from '../shared/data/monsters.js';
import { mpCost, penaltyFor, weaponOk, mahoukenOptions } from '../shared/stats.js';
import { monsterCanvas } from './render/monsters.js';
import { whiteCopy, ctxOf, makeCanvas } from './render/pixel.js';
import { battleBackground, Effects, BW, BH } from './render/battlefx.js';
import { abilityDetail, statusNames, buffNames } from './ui/info.js';

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
};
const SPELL_ANIMS = new Set(['fire1', 'fire2', 'fire3', 'fire_wave', 'fire_tornado', 'ice1', 'ice2', 'wind1', 'wind2', 'blast1', 'blast2', 'void', 'dark1']);
const ELEM_COLORS = {
  fire: ['#ff5a2a', '#ff9a3a', '#ffe07a'], ice: ['#9ae6ff', '#e6fbff', '#5ab8e8'], wind: ['#d8ffe0', '#9af0b0', '#ffffff'],
  blast: ['#ffffff', '#ffd66b', '#ff8a2a'], dark: ['#8a5ac8', '#3a2a5a', '#c8a8f0'], light: ['#ffffff', '#fff6b0', '#ffd66b'],
};
const TEAM_ANIM = { void: 'void', fire: 'fire_tornado', ice: 'ice2', blast: 'blast2', wind: 'wind2' };

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
  if (/^fire|blast/.test(anim) || el === 'fire') return 'fire';
  if (/^ice/.test(anim) || el === 'ice') return 'ice';
  if (/^wind/.test(anim) || el === 'wind') return 'wind';
  if (anim === 'dark1' || el === 'dark' || anim === 'void') return 'dark';
  if (anim === 'sleep') return 'sleep';
  if (anim === 'quake') return 'quake';
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
};

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
    this.bond = msg.snap.bond || 0;
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
    if (msg.resume) this.say(['つなぎなおした！ たたかいの つづきだ！']);
    else if (msg.joined) this.say([`${names}との たたかいに かけつけた！`]);
    else this.say([msg.preemptive === 'ally' ? 'まものは まだ こちらに きづいていない！' : msg.preemptive === 'enemy' ? 'まものたちが いきなり おそいかかってきた！' : `${names}が あらわれた！`]);
  }

  enemyNames() {
    const counts = {};
    for (const c of this.c.values()) if (c.side === 'enemy') counts[c.species] = (counts[c.species] || 0) + 1;
    return Object.entries(counts).map(([sp, n]) => (n > 1 ? `${MONSTERS[sp].name}たち` : MONSTERS[sp].name)).join('と ');
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
    this.canvas = makeCanvas(BW, BH);
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
    this.onResize = () => this.resizeCanvas();
    addEventListener('resize', this.onResize);
    // がめんの むきが かわった・もじが よみこまれた ときも あわせる
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.resizeCanvas());
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
    if (k < 0.5) k = kmax;
    this.canvas.style.width = `${Math.round(BW * k)}px`;
    this.canvas.style.height = `${Math.round(BH * k)}px`;
    this.cssK = k;
  }

  allies() { return [...this.c.values()].filter((c) => c.side === 'ally'); }
  enemies() { return [...this.c.values()].filter((c) => c.side === 'enemy' && !c.fled); }

  renderStatus(full = false) {
    const allies = this.allies();
    if (full || this.statusBoxes.size !== allies.length) {
      this.statusEl.innerHTML = '';
      this.statusBoxes.clear();
      for (const a of allies) {
        const box = el('div', { class: 'win b-mem' });
        box.addEventListener('click', () => this.onAllyClick(a.id));
        const nm = el('div', { class: 'nm' }, el('span', { text: a.name }), el('span', { class: 'job', text: `${a.mon ? 'Lv' : JOBS[a.job]?.name?.slice(0, 2) || ''}${a.lv}` }));
        const hpmp = el('div', { class: 'hpmp' });
        const sts = el('div', { class: 'sts' });
        const atb = el('div', { class: 'atb' }, el('i'));
        box.append(nm, hpmp, sts, atb);
        this.statusEl.append(box);
        this.statusBoxes.set(a.id, { box, hpmp, sts, atb: atb.firstChild, atbBox: atb });
      }
    }
    for (const a of allies) {
      const s = this.statusBoxes.get(a.id);
      if (!s) continue;
      s.box.classList.toggle('dead', !a.alive);
      s.box.classList.toggle('low', a.alive && a.hp / a.maxHp < 0.26);
      s.box.classList.toggle('me', this.mine.includes(a.id));
      s.box.classList.toggle('ready', !!a.ready && this.mine.includes(a.id));
      s.box.classList.toggle('cur', this.cur === a.id);
      s.hpmp.innerHTML = '';
      s.hpmp.append(el('span', { class: 'h', text: `HP${a.hp}` }), el('span', { class: 'mpc', text: `MP${a.mp}` }));
      const st = [statusNames(a.status), buffNames(a.buffs)].filter(Boolean).join(' ');
      s.sts.textContent = !a.alive ? 'しに' : a.defending ? `ぼうぎょ ${st}` : (st || (a.auto && a.controller ? 'オート' : a.controller && a.kind !== 'player' ? 'めいれい' : a.kind === 'support' ? 'なかま' : a.kind === 'monster' ? 'まもの' : a.kind === 'guest' ? 'ゲスト' : ''));
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
    const els = lines.map((l) => el('div', { class: 'ln', text: l }));
    const per = Math.max(90, Math.min(280, (dur * 0.7) / Math.max(1, lines.length)));
    els.forEach((e, i) => {
      e.style.visibility = 'hidden';
      this.msgEl.append(e);
      setTimeout(() => { e.style.visibility = ''; }, i * per);
    });
    while (this.msgEl.children.length > 7) this.msgEl.firstChild.remove();
  }

  skipMsg() {
    for (const e of this.msgEl.children) e.style.visibility = '';
  }

  // ───────────── コマンド ─────────────
  renderCmdIdle(text) {
    this.closeMenus();
    this.cmdEl.innerHTML = '';
    const a = this.primary;
    if (!a) {
      this.cmdEl.append(el('div', { class: 'wait', text: 'なかまが たたかっている…' }));
      return;
    }
    this.cmdEl.append(el('div', { class: 'who', text: a.name }), el('div', { class: 'wait', text: text || (a.alive ? (a.auto ? 'オートで たたかっている' : 'こうどうゲージが たまるのを まっている…') : 'しんでしまった…') }));
  }

  closeMenus() {
    this.menu?.blur();
    this.menu = null;
    this.targeting = null;
  }

  openCommand() {
    const a = this.myActor;
    if (!a || !a.alive || this.ended) return;
    this.cur = a.id;
    this.renderStatus();
    this.game.audio.sfx('warn');
    const learned = a.abilities || [];
    const spells = learned.filter((id) => ABILITIES[id] && (ABILITIES[id].kind === 'spell' || ABILITIES[id].spellLike));
    const skills = learned.filter((id) => ABILITIES[id] && (ABILITIES[id].kind === 'skill' || ABILITIES[id].kind === 'monster' || (ABILITIES[id].kind === 'combo' && !ABILITIES[id].spellLike)));
    const items = [
      { label: 'たたかう', value: 'attack' },
      { label: 'じゅもん', value: 'spell', disabled: !spells.length },
      { label: 'とくぎ', value: 'skill', disabled: !skills.length },
      { label: 'どうぐ', value: 'item' },
      { label: 'ぼうぎょ', value: 'defend' },
      { label: 'にげる', value: 'flee', disabled: !this.canFlee },
    ];
    if (this.bond >= 100) items.unshift({ html: '<span class="gold">★ きずな（ミナデイン）</span>', value: 'bond' });
    this.showMenu(items, (it) => {
      switch (it.value) {
        case 'attack': return this.pickEnemy((t) => this.send({ type: 'attack', target: t }));
        case 'spell': return this.abilityMenu(spells);
        case 'skill': return this.abilityMenu(skills);
        case 'item': return this.itemMenu();
        case 'defend': return this.send({ type: 'defend' });
        case 'flee': return this.send({ type: 'flee' });
        case 'bond': return this.pickEnemy((t) => this.send({ type: 'bond', target: t }), 'ミナデインで ねらう あいて');
        default:
      }
    }, null, `${a.name}は どうする？`);
  }

  showMenu(items, onSelect, onCancel, title, detailFn) {
    this.closeMenus();
    this.cmdEl.innerHTML = '';
    if (title) this.cmdEl.append(el('div', { class: 'who', text: title }));
    const m = new ListMenu(this.game.input, {
      items,
      sound: (x) => this.game.audio.sfx(x),
      onSelect,
      onCancel: onCancel || null,
      onMove: detailFn ? (it) => detailFn(it) : null,
    });
    this.cmdEl.append(m.root);
    this.menu = m;
    m.focus();
  }

  abilityMenu(ids) {
    const a = this.myActor;
    const pc = a.pc || { job: a.job, jobs: this.game.me.jobs };
    const silenced = (a.status || []).includes('silence');
    const items = ids.map((id) => {
      const ab = ABILITIES[id];
      const isMk = ab.effect.type === 'mahouken';
      const cost = isMk ? 0 : mpCost(pc, id);
      const pen = penaltyFor(pc, id).penalized;
      const noMp = !isMk && cost > a.mp;
      const noWeapon = !weaponOk(ab, a.weaponCat);
      const sil = silenced && (ab.kind === 'spell' || ab.spellLike);
      return {
        html: `${ab.name}${pen ? '<span class="tag warn">他</span>' : ''}`,
        right: isMk ? '▶' : `${cost}`,
        rightCls: pen ? 'pen' : '',
        value: id,
        disabled: noMp || noWeapon || sil,
      };
    });
    this.showMenu(items, (it) => {
      const ab = ABILITIES[it.value];
      if (ab.effect.type === 'mahouken') return this.mahoukenMenu();
      const t = ab.target;
      if (t === 'enemy' || t === 'group') return this.pickEnemy((tid) => this.send({ type: 'ability', id: it.value, target: tid }), ab.name);
      if (t === 'ally' || t === 'deadAlly') return this.pickAlly((tid) => this.send({ type: 'ability', id: it.value, target: tid }), t === 'deadAlly', ab.name);
      return this.send({ type: 'ability', id: it.value });
    }, () => this.openCommand(), null, (it) => {
      if (!it) return;
      this.msgEl.innerHTML = '';
      this.msgEl.append(el('div', { class: 'ln small', text: abilityDetail(it.value, pc) }));
    });
  }

  mahoukenMenu() {
    const a = this.myActor;
    const opts = mahoukenOptions({ ...(a.pc || this.game.me), job: a.job }, a.abilities);
    const items = opts.map((o) => ({ label: o.name, right: `${o.mp}`, value: o, disabled: o.mp > a.mp || !weaponOk({ weapon: 'blade' }, a.weaponCat) }));
    if (!items.length) return toast('まほうけんに できる わざが ない');
    this.showMenu(items, (it) => {
      this.pickEnemy((tid) => this.send({ type: 'mahouken', spell: it.value.spell, skill: it.value.skill, target: tid }), it.value.name);
    }, () => this.openCommand(), 'まほうけん（じゅもん×けんわざ）', (it) => {
      if (!it) return;
      this.msgEl.innerHTML = '';
      this.msgEl.append(el('div', { class: 'ln small', text: `${ABILITIES[it.value.spell].name}の ちからを ${ABILITIES[it.value.skill].name}に やどらせる。\nMP ${it.value.mp}（けんが ひつよう）` }));
    });
  }

  itemMenu() {
    const bag = this.game.me.items.filter((e) => ITEMS[e.id]?.battle);
    if (!bag.length) {
      toast('たたかいで つかえる どうぐが ない');
      return this.openCommand();
    }
    this.showMenu(bag.map((e) => ({ label: ITEMS[e.id].name, right: `×${e.n}`, value: e.id })), (it) => {
      const item = ITEMS[it.value];
      if (item.target === 'self') return this.send({ type: 'item', id: it.value });
      return this.pickAlly((tid) => this.send({ type: 'item', id: it.value, target: tid }), item.target === 'deadAlly', item.name);
    }, () => this.openCommand(), 'どうぐ', (it) => {
      if (!it) return;
      this.msgEl.innerHTML = '';
      this.msgEl.append(el('div', { class: 'ln small', text: ITEMS[it.value].desc }));
    });
  }

  pickEnemy(done, title = 'だれを ねらう？') {
    const list = this.enemies().filter((e) => e.alive);
    if (list.length === 1) return done(list[0].id);
    this.targeting = { side: 'enemy', done };
    this.showMenu(list.map((e) => ({ label: e.name, value: e.id })), (it) => done(it.value), () => this.openCommand(), title, (it) => { this.hover = it?.value; });
  }

  pickAlly(done, dead = false, title = 'だれに？') {
    const list = this.allies();
    this.targeting = { side: 'ally', done, dead };
    this.showMenu(list.map((a) => ({ label: `${a.name}　HP${a.hp}`, value: a.id, disabled: dead ? a.alive : !a.alive })), (it) => done(it.value), () => this.openCommand(), title);
  }

  onCanvasClick(e) {
    if (!this.targeting || this.targeting.side !== 'enemy') return;
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * BW, y = (e.clientY - r.top) / r.height * BH;
    for (const m of this.layout || []) {
      if (x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h && m.c.alive) {
        this.game.audio.sfx('confirm');
        return this.targeting.done(m.c.id);
      }
    }
  }

  onAllyClick(id) {
    if (!this.targeting || this.targeting.side !== 'ally') return;
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
    this.renderCmdIdle('コマンドを えらんだ！');
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
          if (c) { c.ready = true; c.atb = 100; }
          if (this.mine.includes(ev.id)) {
            if (!this.readyQ.includes(ev.id)) this.readyQ.push(ev.id);
            if (!this.cur) this.nextCommand();
          }
          this.renderStatus();
          break;
        }
        case 'queued': {
          const c = this.c.get(ev.id);
          if (c) c.ready = false;
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
          this.queue.push(ev);
          break;
        case 'bondJoin': {
          const c = this.c.get(ev.id);
          if (c) this.banner(`${c.name}が ちからを あわせた！（${ev.count}人）`);
          this.game.audio.sfx('bond');
          break;
        }
        case 'end':
          this.endPending = ev.outcome;
          break;
        default:
      }
    }
  }

  present(ev) {
    const g = this.game;
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
    // こうどうした ひと
    if (actor && actor.side === 'enemy' && ev.t === 'act') actor.lunge = 260;
    if (actor && this.mine.includes(actor.id) && !this.cur) this.renderCmdIdle();
    // エフェクト
    const targets = (fx.targets || []).map((id) => this.c.get(id)).filter(Boolean);
    const enemyPts = targets.filter((t) => t.side === 'enemy').map((t) => this.center(t)).filter(Boolean);
    const anim = fx.anim || (fx.type === 'attack' ? (fx.side === 'ally' ? (fx.weapon === 'claw' || fx.weapon === 'none' ? 'punch' : 'slash_heavy') : 'hit') : null);
    const crit = (ev.results || []).some((r) => r.crit);
    const fromAlly = fx.side === 'ally';
    const ab = ev.ability ? ABILITIES[ev.ability] : null;
    let hitDelay = 0;
    if (anim && enemyPts.length) {
      if (fx.type === 'attack' && fromAlly) this.fx.weaponHit(enemyPts, fx.weapon, crit);
      else this.fx.play(anim, enemyPts, fx.element, { crit, fromAlly });
      hitDelay = HIT_DELAY[anim] || 0;
    }
    // みかたへの えんしゅつ（てきの じゅもんは たまが とんでくる）
    const allyTargets = targets.filter((t) => t.side === 'ally');
    if (anim && anim !== 'none' && allyTargets.length) {
      const kind = allyFxKind(anim, fx, ab);
      let d = 0;
      if (!fromAlly && SPELL_ANIMS.has(anim) && actor) {
        const from = this.center(actor);
        if (from) {
          this.fx.proj(BW / 2, BH + 8, ELEM_COLORS[fx.element] || ELEM_COLORS.dark, { from, travel: 260 });
          d = 260;
        }
      }
      if (!fromAlly && anim === 'breath') this.fx.tintAt(fx.element === 'fire' ? 'rgba(255, 120, 40, 0.28)' : 'rgba(200, 230, 255, 0.25)', 500);
      allyTargets.forEach((t, i) => this.allyFx(t.id, kind, d + (allyTargets.length > 1 ? i * 60 : 0)));
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
    if (fx.type === 'telegraph') { g.audio.sfx('warn'); this.banner('！ おおわざが くる ！ ぼうぎょ しよう！', 'danger'); }
    if (fx.type === 'bondStart') this.startBondPrompt(ev);
    if (fx.type === 'flee') g.audio.sfx('flee');
    if (fx.team) {
      this.banner(`合体！ ${fx.team}！`);
      const ta = TEAM_ANIM[fx.teamElement];
      if (ta && enemyPts.length) setTimeout(() => { if (!this.destroyed) this.fx.play(ta, enemyPts, fx.teamElement, { fromAlly: false }); }, 250);
    } else if (ev.combo >= 2) this.banner(`れんけい ${ev.combo}！`, 'combo');
    if (anim === 'minadein') g.audio.sfx('bolt');
    if (anim && ANIM_SFX[anim]) g.audio.sfx(ANIM_SFX[anim]);
    else if (fx.type === 'ability' && fromAlly && !ANIM_SFX[anim]) g.audio.sfx('spell');
    if (fx.anim === 'quake') this.shake(500);
    // けっか（じゅもんは あたった ときに）
    const apply = () => {
      if (this.destroyed) return;
      let hurtAlly = false;
      for (const r of ev.results || []) {
        const t = this.c.get(r.id);
        if (!t) continue;
        if (r.dmg > 0) {
          if (t.side === 'enemy') {
            t.flash = 320;
            if (!fx.anim || fx.type === 'attack' || hitDelay) g.audio.sfx(r.crit ? 'crit' : 'hit');
          } else {
            hurtAlly = true;
            this.hitStatus(t.id);
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
      if (hurtAlly && actor?.side === 'enemy' && (actor.boss || (ev.results || []).some((r) => r.crit))) {
        this.shake(350);
        if ((ev.results || []).some((r) => r.crit)) { this.fx.flash = 160; this.fx.flashColor = '#ff6a6a'; }
      }
      for (const c of this.c.values()) {
        if (c.side === 'enemy' && !c.alive && !c.dead) {
          c.dead = 1;
          g.audio.sfx('defeat');
        }
      }
    };
    if (hitDelay > 0) setTimeout(apply, hitDelay);
    else apply();
    // えらんでいる とちゅうで たおれた・ねむった など
    const cur = this.cur && this.c.get(this.cur);
    if (cur && (!cur.alive || (cur.status || []).some((x) => x === 'sleep' || x === 'paralyze') || !cur.ready)) this.dropReady(cur.id);
    else if (!this.cur && this.menu && !this.targeting) this.renderCmdIdle();
    this.renderStatus();
    this.updateAutoBtn();
  }

  center(t) {
    const m = (this.layout || []).find((l) => l.c === t || l.c.id === t.id);
    if (!m) return null;
    return { x: m.x + m.w / 2, y: m.y + m.h / 2 };
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

  hitStatus(id) {
    const s = this.statusBoxes.get(id);
    if (!s) return;
    s.box.classList.remove('hit');
    void s.box.offsetWidth;
    s.box.classList.add('hit');
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

  shake(ms) {
    this.stage.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,2px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'translate(-3px,1px)' }, { transform: 'translate(0,0)' }], { duration: ms });
  }

  // きずな技: みんなで ボタンを おす
  startBondPrompt(ev) {
    this.game.audio.sfx('bond');
    this.fx.flash = 400;
    this.fx.flashColor = '#ffe0f4';
    const a = this.primary;
    if (!a || !a.alive || a.auto || ev.id === a.id) return;
    const btn = el('button', { class: 'bondjoin', text: '★ ちからを あわせる！ ★' });
    const join = () => {
      this.game.net.send({ t: 'battle', actor: a.id, cmd: { type: 'bondJoin' } });
      btn.remove();
      this.game.input.pop(h);
    };
    const h = { onNav: (x) => { if (x === 'a') join(); } };
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
    // ゲージを なめらかに
    const locked = !!this.showing;
    for (const c of this.c.values()) {
      if (!c.alive || c.ready || locked) continue;
      if (c.rate && c.atb < 100) c.atb = Math.min(99.5, c.atb + c.rate * dt * (this.game.me.battleSettings?.speed || 1) * 0.6);
      if (c.flash > 0) c.flash -= dt;
      if (c.lunge > 0) c.lunge -= dt;
    }
    for (const c of this.c.values()) {
      if (c.flash > 0) c.flash -= dt;
      if (c.lunge > 0) c.lunge -= dt;
      if (c.dead > 0 && c.dead < 2) c.dead += dt / 500;
      if (c.appear > 0) c.appear -= dt / 400;
    }
    this.fx.update(dt);
    this.updateGauges();
    this.draw();
  }

  computeLayout() {
    const list = this.enemies().filter((c) => !(c.dead >= 2));
    const sprites = list.map((c) => ({ c, img: monsterCanvas(c.species, Math.floor(this.time / 420 + (c.slot || 0)) % 2) }));
    let scale = 1;
    const totalW = () => sprites.reduce((s, x) => s + x.img.width * scale + 6, 0);
    while (totalW() > BW - 12 && scale > 0.55) scale -= 0.05;
    let x = (BW - totalW()) / 2 + 3;
    const baseY = 124;
    return sprites.map(({ c, img }) => {
      const w = img.width * scale, h = img.height * scale;
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
      x.fillRect(0, 0, BW, BH);
    }
    x.setTransform(1, 0, 0, 1, so.x, so.y);
    x.drawImage(this.bg, 0, 0);
    this.layout = this.computeLayout();
    for (const m of this.layout) {
      const c = m.c;
      let dx = 0, dy = Math.round(Math.sin(this.time / 300 + (c.slot || 0)) * 1);
      if (c.lunge > 0) { dy += 4; }
      if (c.flash > 0) dx = Math.round(Math.sin(c.flash / 20) * 2);
      const alpha = c.dead > 0 ? Math.max(0, 1 - (c.dead - 1)) : 1;
      if (c.dead > 0 && c.dead < 1.2 && Math.floor(this.time / 60) % 2) continue;
      x.globalAlpha = c.dead > 1 ? alpha : 1;
      if (c.appear > 0) x.globalAlpha = 1 - c.appear;
      // ためこみ中の ボスは あかく ひかる
      if (c.telegraph && c.alive) {
        const pulse = 0.4 + Math.sin(this.time / 90) * 0.3;
        x.globalAlpha = pulse;
        x.drawImage(white(m.img, '#ff3a3a'), Math.round(m.x + dx) - 2, Math.round(m.y + dy) - 2, Math.round(m.w) + 4, Math.round(m.h) + 4);
        x.globalAlpha = 1;
      }
      const img = c.flash > 0 && Math.floor(c.flash / 60) % 2 === 0 ? white(m.img) : m.img;
      const lunge = c.lunge > 0 ? 1.08 : 1;
      const w = m.w * lunge, h = m.h * lunge;
      x.drawImage(img, Math.round(m.x + dx - (w - m.w) / 2), Math.round(m.y + dy - (h - m.h)), Math.round(w), Math.round(h));
      x.globalAlpha = 1;
      // ねらい
      if (this.targeting?.side === 'enemy' && this.hover === c.id && c.alive) {
        x.fillStyle = '#ffd66b';
        const ax = Math.round(m.x + m.w / 2);
        const ay = Math.round(m.y - 6 + Math.sin(this.time / 120) * 2);
        x.fillRect(ax - 3, ay - 3, 6, 2); x.fillRect(ax - 2, ay - 1, 4, 2); x.fillRect(ax - 1, ay + 1, 2, 2);
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
  showResult(msg) {
    return new Promise((resolve) => {
      this.closeMenus();
      const g = this.game;
      if (msg.outcome === 'win') g.audio.play('victory');
      else if (msg.outcome === 'lose') g.audio.play('lose');
      else g.audio.stop(0.3);
      const lines = msg.lines || [];
      if (!lines.length) return resolve();
      const box = el('div', { class: 'win b-result scroll' });
      this.root.append(box);
      let i = 0;
      const next = () => {
        if (i >= lines.length) {
          finish();
          return;
        }
        const line = lines[i++];
        box.append(el('div', { text: line }));
        box.scrollTop = box.scrollHeight;
        if (line.includes('レベルが')) {
          g.audio.play('levelup', { force: true });
          box.lastChild.classList.add('gold');
        }
        if (line.includes('ひらめいた') || line.includes('おぼえた')) {
          box.lastChild.classList.add('good');
          g.audio.sfx('sparkle');
        }
      };
      let timer = setInterval(next, 420);
      next();
      const h = {
        onNav: (a) => {
          if (a !== 'a' && a !== 'b') return;
          if (i < lines.length) {
            while (i < lines.length) next();
          } else finish();
        },
      };
      box.addEventListener('click', () => h.onNav('a'));
      g.input.push(h);
      const finish = () => {
        clearInterval(timer);
        g.input.pop(h);
        resolve();
      };
      // じどうで とじる（スペクテーターの とき など）
      setTimeout(() => { if (i >= lines.length) finish(); }, 15000);
    });
  }

  destroy() {
    this.destroyed = true;
    this.closeMenus();
    removeEventListener('resize', this.onResize);
    this.ro?.disconnect();
    this.root.innerHTML = '';
    this.root.hidden = true;
  }
}
