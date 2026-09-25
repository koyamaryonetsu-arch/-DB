// バトルエンジン（リアルタイム・ターン制）
//
// ・ひとりひとりに「こうどうゲージ」があり、すばやさが 高いほど はやく たまる
// ・ゲージが たまった キャラクターから コマンドを えらんで こうどうする
// ・コマンドを えらんでいる あいだも 時間は すすむ（ウェイトモードを のぞく）
// ・こうどうの えんしゅつ中は ゲージが とまる（メッセージが よめるように）
//
// サーバー（家族サーバー）でも ブラウザ（ひとりモード）でも おなじ コードが うごく

import { makeRng } from './rng.js';
import { ABILITIES, TEAM_COMBOS } from './data/abilities.js';
import { MONSTERS } from './data/monsters.js';
import { ITEMS } from './data/items.js';
import { computeStats, learnedAbilities, penaltyFor, mpCost, weaponOk, comboAllowed } from './stats.js';
import { decideMonster, decideAlly } from './ai.js';

export const BOND_MAX = 100;
const COMBO_WINDOW = 6000;
const LETTERS = 'ABCDEFGH';

// すばやさ → ゲージが たまるまでの じかん（ミリびょう）
// すばやさ10で 約5.8びょう、20で 4びょう、40で 2.5びょう、80で 1.4びょう
export function fillTime(agi) {
  return 128000 / (Math.max(1, agi) + 12);
}

const STATUS_NAMES = {
  sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'マヌーサ', silence: 'マホトーン', poison: '毒',
};

export class Battle {
  constructor(opts = {}) {
    this.id = opts.id || 'b' + Math.floor(Math.random() * 1e9);
    this.rng = opts.rng || makeRng();
    this.hooks = opts.hooks || {};
    this.time = 0; // たたかいの 時間（えんしゅつ中は すすまない）
    this.lock = 0;
    this.queue = [];
    this.events = [];
    this.combatants = [];
    this.over = false;
    this.result = null;
    this.pendingEnd = null;
    this.speed = opts.speed || 1;
    this.wait = !!opts.wait;
    this.canFlee = opts.canFlee !== false;
    this.boss = !!opts.boss;
    this.bg = opts.bg || 'grass';
    this.bgm = opts.bgm || 'battle';
    this.bond = Math.max(0, Math.min(BOND_MAX, opts.bond || 0));
    this.combo = { count: 0, actor: null, element: null, time: -99999 };
    this.fleeBonus = 0;
    this.bondCharge = null;
    this.gaugeTimer = 0;
    this.poisonTimer = 0;
    this.killed = [];
    this.fledEnemies = [];
    this.nextId = 1;
    this.turnCount = 0;
    this.preemptive = opts.preemptive || null;
    for (const a of opts.allies || []) this.addAlly(a);
    this.addEnemies(opts.enemies || []);
    this.initAtb();
  }

  // ───────────── さんかしゃ ─────────────
  addAlly(init) {
    const c = allyFromCharacter(init.char, init);
    c.id = 'a' + this.combatants.filter((x) => x.side === 'ally').length;
    c.slot = this.combatants.filter((x) => x.side === 'ally').length;
    this.combatants.push(c);
    return c;
  }

  // たたかいの とちゅうから なかまが かけつける
  joinAlly(init) {
    const c = this.addAlly(init);
    c.atb = this.rng.float(0, 40);
    this.emit({ t: 'msg', lines: [`${c.name}がかけつけた！`], joined: [pub(c)], dur: 900 });
    return c;
  }

  addEnemies(list) {
    // list: ['pururin', 'pururin', 'goblin']
    const counts = {};
    for (const sp of list) counts[sp] = (counts[sp] || 0) + 1;
    const used = {};
    for (const e of this.combatants) if (e.side === 'enemy') used[e.species] = (used[e.species] || 0) + 1;
    const added = [];
    for (const sp of list) {
      const m = enemyFromSpecies(sp);
      const total = (counts[sp] || 0) + (used[sp] || 0);
      const idx = used[sp] || 0;
      used[sp] = idx + 1;
      if (total > 1) {
        m.letter = LETTERS[idx % LETTERS.length];
        m.name = m.baseName + m.letter;
      }
      m.id = 'e' + (this.nextId++);
      m.slot = this.combatants.filter((x) => x.side === 'enemy').length;
      this.combatants.push(m);
      added.push(m);
    }
    // あとから きた なかまと なまえを そろえる
    for (const sp of Object.keys(used)) {
      const same = this.combatants.filter((x) => x.side === 'enemy' && x.species === sp);
      if (same.length > 1) {
        same.forEach((m, i) => {
          if (!m.letter) {
            m.letter = LETTERS[i % LETTERS.length];
            m.name = m.baseName + m.letter;
          }
        });
      }
    }
    return added;
  }

  initAtb() {
    for (const c of this.combatants) {
      c.atb = this.rng.float(0, 35) + Math.min(30, c.agi / 3);
      if (this.preemptive === 'ally' && c.side === 'ally') c.atb = 100;
      if (this.preemptive === 'enemy' && c.side === 'enemy') c.atb = 100;
      if (c.atb >= 100) c.atb = 99.9;
    }
  }

  get allies() { return this.combatants.filter((c) => c.side === 'ally'); }
  get enemies() { return this.combatants.filter((c) => c.side === 'enemy' && !c.fled); }
  aliveAllies() { return this.allies.filter((c) => c.alive); }
  aliveEnemies() { return this.enemies.filter((c) => c.alive); }
  get(id) { return this.combatants.find((c) => c.id === id); }
  humans() { return this.allies.filter((c) => c.controller && !c.auto); }

  // ───────────── イベント ─────────────
  emit(ev) { this.events.push(ev); }
  flush() {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ───────────── じかんを すすめる ─────────────
  tick(dtReal) {
    if (this.over) return this.flush();
    const dt = dtReal * this.speed;
    // きずな技の ちからあわせ中（リアル時間で まつ）
    if (this.bondCharge) {
      this.bondCharge.remaining -= dtReal;
      for (const j of this.bondCharge.aiJoin) {
        if (!j.done && this.bondCharge.total - this.bondCharge.remaining >= j.at) {
          j.done = true;
          this.bondJoin(j.id);
        }
      }
      if (this.bondCharge.remaining <= 0) this.finishBond();
      return this.flush();
    }
    if (this.lock > 0) {
      this.lock -= dt;
      if (this.lock > 0) return this.flush();
      this.lock = 0;
    }
    if (this.pendingEnd) {
      this.endBattle(this.pendingEnd);
      return this.flush();
    }
    if (this.queue.length) {
      this.executeNext();
      return this.flush();
    }
    // ウェイトモード: だれかが コマンドを えらんでいる あいだは とまる
    const choosing = this.wait && this.humans().some((h) => h.alive && h.ready);
    if (!choosing) this.advance(dt);
    this.gaugeTimer += dtReal;
    if (this.gaugeTimer >= 200) {
      this.gaugeTimer = 0;
      this.emitGauges();
    }
    return this.flush();
  }

  emitGauges() {
    const g = {};
    for (const c of this.combatants) if (c.alive && !c.fled) g[c.id] = Math.round(c.atb * 10) / 10;
    this.emit({ t: 'g', g, bond: this.bond });
  }

  advance(dt) {
    this.time += dt;
    // バフ・デバフの じかんぎれ
    for (const c of this.combatants) {
      if (!c.alive) continue;
      for (const kind of ['buffs', 'debuffs']) {
        for (const [stat, b] of Object.entries(c[kind])) {
          if (b.until <= this.time) {
            delete c[kind][stat];
            if (c.side === 'ally' || stat !== 'eva') {
              this.emit({ t: 'msg', lines: [`${c.name}の${statLabel(stat)}が元にもどった。`], upd: [pub(c)] });
            }
          }
        }
      }
      if (c.cover && c.cover.until <= this.time) c.cover = null;
    }
    // どく
    this.poisonTimer += dt;
    if (this.poisonTimer >= 4000) {
      this.poisonTimer = 0;
      const lines = [];
      const upd = [];
      for (const c of this.combatants) {
        if (!c.alive || !c.status.poison) continue;
        const d = Math.max(1, Math.min(c.side === 'ally' ? 12 : 20, Math.floor(c.maxHp / 12)));
        c.hp = Math.max(0, c.hp - d);
        lines.push(c.side === 'ally' ? `${c.name}は毒で${d}のダメージを受けた！` : `${c.name}は毒で${d}のダメージ！`);
        if (c.hp <= 0) lines.push(...this.kill(c));
        upd.push(pub(c));
      }
      if (lines.length) {
        this.emit({ t: 'msg', lines, upd, fx: { type: 'poison' } });
        this.lock = 500 + 300 * lines.length;
        this.checkEnd();
      }
    }
    // ゲージ
    for (const c of this.combatants) {
      if (!c.alive || c.fled || c.ready || c.queued) continue;
      c.atb += (100 / fillTime(effAgi(c))) * dt;
      if (c.atb >= 100) {
        c.atb = 100;
        this.onReady(c);
      }
    }
  }

  onReady(c) {
    // ねむり・まひは じゅんばんが とばされる
    if (c.status.sleep || c.status.paralyze) {
      this.enqueue(c, { type: 'incapacitated' });
      return;
    }
    if (c.side === 'enemy') {
      const n = c.turns || 1;
      for (let i = 0; i < n; i++) this.enqueue(c, { type: 'ai' }, i === n - 1);
      return;
    }
    if (c.controller && !c.auto && !c.status.confuse) {
      c.ready = true;
      this.emit({ t: 'ready', id: c.id });
      return;
    }
    this.enqueue(c, { type: 'ai' });
  }

  enqueue(c, cmd, last = true) {
    c.queued = true;
    c.ready = false;
    this.queue.push({ id: c.id, cmd, last });
  }

  // プレイヤーの コマンド
  command(actorId, cmd, controller) {
    const c = this.get(actorId);
    if (!c || !c.alive || this.over) return { ok: false, reason: 'no' };
    if (controller !== undefined && c.controller !== controller) return { ok: false, reason: 'notyours' };
    if (cmd?.type === 'bondJoin') return this.bondJoin(actorId) ? { ok: true } : { ok: false };
    if (!c.ready) return { ok: false, reason: 'notready' };
    const v = this.validate(c, cmd);
    if (!v.ok) return v;
    if (cmd.type === 'defend') {
      c.ready = false;
      c.atb = 0;
      c.defending = true;
      this.emit({ t: 'act', id: c.id, lines: [`${c.name}は身を守っている。`], upd: [pub(c)], fx: { type: 'defend', actor: c.id } });
      return { ok: true };
    }
    this.enqueue(c, cmd);
    this.emit({ t: 'queued', id: c.id });
    return { ok: true };
  }

  setAuto(actorId, on) {
    const c = this.get(actorId);
    if (!c) return;
    c.auto = !!on;
    if (c.auto && c.ready) {
      c.ready = false;
      this.enqueue(c, { type: 'ai' });
    }
    this.emit({ t: 'auto', id: c.id, auto: c.auto });
  }

  // コマンドが つかえるか
  validate(c, cmd) {
    if (!cmd || !cmd.type) return { ok: false, reason: 'bad' };
    switch (cmd.type) {
      case 'attack': case 'defend': return { ok: true };
      case 'flee':
        if (!this.canFlee) return { ok: false, reason: '逃げられない！' };
        return { ok: true };
      case 'ability': {
        const a = ABILITIES[cmd.id];
        if (!a || !c.abilities.includes(cmd.id) || a.kind === 'bond') return { ok: false, reason: 'まだ覚えていない' };
        if (a.effect.type === 'mahouken') return { ok: false, reason: 'bad' };
        if (a.kind === 'combo' && !comboAllowed(c.penChar, cmd.id)) return { ok: false, reason: '今の職業では使えない' };
        if (!weaponOk(a, c.weaponCat)) return { ok: false, reason: '武器が合わない' };
        if (mpCost(c.penChar, cmd.id) > c.mp) return { ok: false, reason: 'MPが足りない' };
        return { ok: true };
      }
      case 'mahouken': {
        if (!c.abilities.includes('mahouken')) return { ok: false, reason: 'まだ覚えていない' };
        if (!comboAllowed(c.penChar, 'mahouken')) return { ok: false, reason: '今の職業では使えない' };
        const sp = ABILITIES[cmd.spell], sk = ABILITIES[cmd.skill];
        if (!sp?.attackSpell || !sk?.sword || !c.abilities.includes(cmd.spell) || !c.abilities.includes(cmd.skill)) return { ok: false, reason: 'bad' };
        if (!weaponOk({ weapon: 'blade' }, c.weaponCat)) return { ok: false, reason: '剣が必要' };
        if (mpCost(c.penChar, cmd.spell) + mpCost(c.penChar, cmd.skill) > c.mp) return { ok: false, reason: 'MPが足りない' };
        return { ok: true };
      }
      case 'item': {
        const it = ITEMS[cmd.id];
        if (!it || it.type !== 'use' || !it.battle) return { ok: false, reason: '使えない' };
        if (this.hooks.hasItem && !this.hooks.hasItem(c, cmd.id)) return { ok: false, reason: '持っていない' };
        return { ok: true };
      }
      case 'bond':
        if (this.bond < BOND_MAX) return { ok: false, reason: 'きずなゲージが足りない' };
        return { ok: true };
      default: return { ok: false, reason: 'bad' };
    }
  }

  // ───────────── こうどうの じっこう ─────────────
  executeNext() {
    const q = this.queue.shift();
    const c = this.get(q.id);
    if (!c || !c.alive || c.fled) {
      if (c) c.queued = false;
      return;
    }
    if (q.last) {
      c.queued = false;
      c.defending = false;
    }
    let cmd = q.cmd;
    // ねむりが ダメージで さめていたら ふつうに こうどうできる
    if (cmd.type === 'incapacitated' && !c.status.sleep && !c.status.paralyze) {
      if (c.controller && !c.auto) {
        c.queued = false;
        c.ready = true;
        this.emit({ t: 'ready', id: c.id });
        return;
      }
      cmd = { type: 'ai' };
    }
    const ev = { t: 'act', id: c.id, lines: [], upd: [], fx: null };
    this.cur = ev;
    this.turnCount++;
    if (cmd.type === 'incapacitated') {
      this.doIncapacitated(c, ev);
    } else {
      // こんらん
      let confused = false;
      if (c.status.confuse) {
        const s = c.status.confuse;
        s.turns--;
        if (s.turns <= 0) {
          delete c.status.confuse;
          ev.lines.push(`${c.name}は正気にもどった！`);
        } else {
          confused = true;
          ev.lines.push(`${c.name}は混乱している！`);
          const pool = this.combatants.filter((x) => x.alive && x !== c && !x.fled);
          cmd = { type: 'attack', target: this.rng.pick(pool)?.id, confused: true };
        }
      }
      if (!confused && cmd.type === 'ai') {
        cmd = c.side === 'enemy' ? decideMonster(this, c) : decideAlly(this, c);
      }
      this.perform(c, cmd, ev);
      this.tickStatus(c, 'blind', ev);
      this.tickStatus(c, 'silence', ev);
    }
    if (ev.postLines) ev.lines.push(...ev.postLines);
    delete ev.postLines;
    // てきが うごいたら れんけいは とぎれる
    if (c.side === 'enemy') this.combo = { count: 0, actor: null, element: null, time: -99999 };
    if (q.last || ev.forceLast) {
      c.queued = false;
      c.atb = ev.atbAfter ?? 0;
    }
    if (!ev.upd.includes(c)) ev.upd.push(c);
    ev.upd = [...new Set(ev.upd)].map((x) => (x.id ? pub(x) : x));
    ev.bond = this.bond;
    this.lock = Math.max(900, 450 + 380 * ev.lines.length) + (ev.extraLock || 0);
    ev.dur = this.lock;
    delete ev.extraLock;
    delete ev.atbAfter;
    this.emit(ev);
    this.cur = null;
    this.checkEnd();
  }

  doIncapacitated(c, ev) {
    if (c.status.sleep) {
      const s = c.status.sleep;
      s.turns--;
      if (s.turns <= 0) {
        delete c.status.sleep;
        ev.lines.push(`${c.name}は目を覚ました！`);
        ev.atbAfter = 60;
      } else ev.lines.push(`${c.name}はねむっている。`);
      ev.fx = { type: 'sleep', actor: c.id };
    } else if (c.status.paralyze) {
      const s = c.status.paralyze;
      s.turns--;
      if (s.turns <= 0) {
        delete c.status.paralyze;
        ev.lines.push(`${c.name}の体のしびれが取れた！`);
        ev.atbAfter = 60;
      } else ev.lines.push(`${c.name}は体がしびれて動けない！`);
      ev.fx = { type: 'paralyze', actor: c.id };
    }
  }

  tickStatus(c, st, ev) {
    const s = c.status[st];
    if (!s || !c.alive) return;
    s.turns--;
    if (s.turns <= 0) {
      delete c.status[st];
      const msg = {
        blind: `${c.name}のまぼろしが消えた！`,
        silence: `${c.name}の呪文のふういんが解けた！`,
      }[st];
      if (msg) ev.lines.push(msg);
    }
  }

  perform(c, cmd, ev) {
    const cast = (tmpl, t) => tmpl.replaceAll('{a}', c.name).replaceAll('{t}', t ? t.name : '');
    switch (cmd.type) {
      case 'attack': {
        ev.name = '攻撃';
        ev.lines.push(`${c.name}の攻撃！`);
        const t = this.resolveTarget(c, 'enemy', cmd.target);
        this.pushCoverMsg(ev);
        if (!t) break;
        ev.fx = { type: 'attack', actor: c.id, targets: [t.id], weapon: c.weaponCat, side: c.side };
        this.physHit(c, t, { mult: 1 }, ev, 'phys');
        if (c.onHit && t.alive) this.tryStatus(c, t, { status: c.onHit.status, chance: c.onHit.chance, turns: [2, 3] }, ev, 1);
        this.afterDamage(c, ev, 'phys');
        break;
      }
      case 'defend': {
        c.defending = true;
        ev.lines.push(`${c.name}は身を守っている。`);
        ev.fx = { type: 'defend', actor: c.id };
        break;
      }
      case 'flee': {
        if (!this.canFlee) {
          ev.lines.push('しかし逃げられない！');
          break;
        }
        const pa = avg(this.aliveAllies().map(effAgi));
        const ea = avg(this.aliveEnemies().map(effAgi));
        const chance = clamp(0.55 + (pa - ea) / 100 + this.fleeBonus, 0.25, 0.95);
        ev.lines.push(`${c.name}たちは逃げ出した！`);
        if (this.rng.chance(chance)) {
          ev.fx = { type: 'flee' };
          this.pendingEnd = { outcome: 'flee' };
        } else {
          this.fleeBonus += 0.12;
          ev.lines.push('しかし回りこまれてしまった！');
        }
        break;
      }
      case 'item': this.useItem(c, cmd, ev); break;
      case 'mahouken': this.doMahouken(c, cmd, ev); break;
      case 'bond': this.startBond(c, cmd, ev); break;
      case 'ability': {
        const a = ABILITIES[cmd.id];
        if (!a) break;
        ev.name = a.name;
        ev.ability = cmd.id;
        const isSpell = a.kind === 'spell' || a.spellLike;
        // MP
        const cost = c.side === 'ally' ? mpCost(c.penChar, cmd.id) : (a.kind === 'monster' ? 0 : (a.mp || 0));
        const targets = this.targetsFor(c, a, cmd);
        const firstTarget = ['enemy', 'group', 'ally', 'deadAlly'].includes(a.target) ? targets[0] : null;
        ev.lines.push(cast(a.cast || `{a}は${a.name}を使った！`, firstTarget));
        this.pushCoverMsg(ev);
        if (isSpell && c.status.silence) {
          ev.lines.push('しかし呪文はふうじこめられている！');
          ev.fx = { type: 'fizzle', actor: c.id };
          break;
        }
        if (cost > c.mp) {
          ev.lines.push('しかしMPが足りない！');
          break;
        }
        c.mp -= cost;
        if (a.weapon && c.side === 'ally' && !weaponOk(a, c.weaponCat)) {
          ev.lines.push('しかし武器が合わずうまくいかなかった！');
          break;
        }
        const pen = c.side === 'ally' ? penaltyFor(c.penChar, cmd.id) : { powMult: 1 };
        if (pen.penalized) ev.penalized = true;
        this.applyAbility(c, a, cmd, ev, pen.powMult, targets);
        break;
      }
      default:
        ev.lines.push(`${c.name}は様子を見ている。`);
    }
  }

  // ねらいの きめかた
  peekTarget(c, kind, wanted) {
    const t = this.get(wanted);
    if (kind === 'deadAlly') {
      const pool = this.sideOf(c, true).filter((x) => !x.alive && !x.fled);
      return (t && pool.includes(t)) ? t : pool[0] || null;
    }
    const foes = kind === 'ally' ? this.sideOf(c, true).filter((x) => x.alive) : this.sideOf(c, false).filter((x) => x.alive);
    if (t && foes.includes(t)) return t;
    return foes.length ? this.rng.pick(foes) : null;
  }

  resolveTarget(c, kind, wanted) {
    let t = this.peekTarget(c, kind, wanted);
    // かばう
    if (t && (kind === 'enemy' || kind === 'group') && t.side === 'ally' && c.side === 'enemy') t = this.coverRedirect(t);
    return t;
  }

  coverRedirect(t) {
    const cover = this.allies.find((x) => x.alive && x !== t && x.cover && (x.cover.target === 'all' || x.cover.target === t.id)
      && !x.status.sleep && !x.status.paralyze);
    if (cover) {
      if (this.cur) this.cur.coverMsg = `${cover.name}が${t.name}をかばった！`;
      return cover;
    }
    return t;
  }

  pushCoverMsg(ev) {
    if (ev.coverMsg) {
      ev.lines.push(ev.coverMsg);
      delete ev.coverMsg;
    }
  }

  // side: true=みかた側 false=てき側（c から みて）
  sideOf(c, same) {
    const side = same ? c.side : (c.side === 'ally' ? 'enemy' : 'ally');
    return this.combatants.filter((x) => x.side === side && !x.fled);
  }

  targetsFor(c, a, cmd) {
    const kind = a.target;
    if (kind === 'self') return [c];
    if (kind === 'allies') return this.sideOf(c, true).filter((x) => x.alive);
    if (kind === 'deadAllies') return this.sideOf(c, true).filter((x) => !x.alive && !x.fled);
    if (kind === 'enemies') return this.sideOf(c, false).filter((x) => x.alive);
    if (kind === 'ally' || kind === 'deadAlly') {
      const t = this.peekTarget(c, kind, cmd.target);
      return t ? [t] : [];
    }
    if (kind === 'group') {
      // モンスターの グループ呪文は みかた全員に
      if (c.side === 'enemy') return this.sideOf(c, false).filter((x) => x.alive);
      const t = this.peekTarget(c, 'enemy', cmd.target);
      if (!t) return [];
      return this.sideOf(c, false).filter((x) => x.alive && x.species === t.species);
    }
    const t = this.resolveTarget(c, 'enemy', cmd.target);
    return t ? [t] : [];
  }

  applyAbility(c, a, cmd, ev, powMult, givenTargets) {
    const eff = a.effect;
    const targets = givenTargets || this.targetsFor(c, a, cmd);
    this.pushCoverMsg(ev);
    ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: targets.map((t) => t.id), side: c.side, element: eff.element };
    if (!targets.length && !['callHelp', 'flee', 'nothing', 'telegraph', 'charge', 'bondUp'].includes(eff.type)) {
      ev.lines.push('しかし効果がなかった！');
      return;
    }
    switch (eff.type) {
      case 'phys': {
        const hits = eff.hits || 1;
        if (eff.random) {
          for (let i = 0; i < hits; i++) {
            const pool = this.sideOf(c, false).filter((x) => x.alive);
            if (!pool.length) break;
            this.physHit(c, this.rng.pick(pool), eff, ev, eff.element || 'phys', powMult);
          }
        } else {
          for (const t of targets) {
            for (let i = 0; i < hits; i++) {
              if (!t.alive) break;
              this.physHit(c, t, eff, ev, eff.element || 'phys', powMult);
            }
            if (eff.debuff && t.alive) this.applyDebuff(c, t, eff.debuff, ev, powMult);
            if (eff.status && t.alive) this.tryStatus(c, t, eff.status, ev, powMult);
          }
        }
        if (eff.atbAfter) ev.atbAfter = eff.atbAfter;
        // もろばぎり: じぶんも ダメージを うける
        if (eff.recoil && ev.dealt > 0 && c.alive) {
          const r = Math.max(1, Math.round(ev.dealt * eff.recoil));
          c.hp = Math.max(0, c.hp - r);
          ev.lines.push(`${c.name}も${r}のダメージを受けた！`);
          ev.results = ev.results || [];
          ev.results.push({ id: c.id, dmg: r });
          if (c.hp <= 0) ev.lines.push(...this.kill(c));
          ev.upd.push(c);
        }
        this.afterDamage(c, ev, eff.element || 'phys');
        break;
      }
      case 'magic': {
        for (const t of targets) {
          this.magicHit(c, t, eff, ev, powMult);
          if (eff.status && t.alive) this.tryStatus(c, t, eff.status, ev, powMult);
        }
        this.afterDamage(c, ev, eff.element);
        break;
      }
      case 'mpHeal': {
        for (const t of targets) {
          if (!t.alive) continue;
          const d = Math.min(t.maxMp - t.mp, this.rng.int(eff.base[0], eff.base[1]));
          t.mp += d;
          ev.lines.push(d > 0 ? `${t.name}のMPが${d}回復した！` : `${t.name}のMPは満タンだ。`);
          ev.upd.push(t);
        }
        break;
      }
      case 'random': {
        // うんめいの カード: どれか ひとつが おこる
        const pick = this.rng.pick(eff.options || []);
        const sub = ABILITIES[pick];
        if (!sub) break;
        ev.lines.push(sub.cast.replaceAll('{a}', c.name));
        this.applyAbility(c, sub, { ...cmd, target: undefined }, ev, powMult);
        break;
      }
      case 'heal': {
        for (const t of targets) this.heal(c, t, eff, ev, powMult);
        break;
      }
      case 'revive': {
        for (const t of targets) {
          if (t.alive) {
            ev.lines.push(`しかし${t.name}は死んでいない！`);
            continue;
          }
          t.alive = true;
          t.hp = Math.max(1, Math.round(t.maxHp * (eff.hpRatio || 0.25) * (0.5 + powMult / 2)));
          t.atb = 0;
          t.status = {};
          ev.lines.push(`なんと${t.name}が生き返った！`);
          ev.upd.push(t);
          this.addBond(8);
        }
        break;
      }
      case 'buff': {
        for (const t of targets) {
          if (!t.alive) continue;
          const dur = (eff.dur || 30) * 1000 * (0.5 + powMult / 2);
          const stats = eff.stats || [eff.stat];
          for (const st of stats) {
            if (st === 'eva') t.buffs.eva = { add: eff.add, until: this.time + dur };
            else t.buffs[st] = { mult: eff.mult, until: this.time + dur };
          }
          ev.lines.push(`${t.name}の${stats.map(statLabel).join('と')}が上がった！`);
          ev.upd.push(t);
        }
        if (c.side === 'ally') this.addBond(1);
        break;
      }
      case 'debuff': {
        for (const t of targets) this.applyDebuff(c, t, eff, ev, powMult);
        break;
      }
      case 'status': {
        for (const t of targets) this.tryStatus(c, t, eff, ev, powMult);
        break;
      }
      case 'cure': {
        for (const t of targets) {
          let any = false;
          for (const st of eff.statuses) {
            if (t.status[st]) {
              delete t.status[st];
              any = true;
              ev.lines.push(`${t.name}の${STATUS_NAMES[st]}が治った！`);
            }
          }
          if (!any && targets.length === 1) ev.lines.push('しかし何も起こらなかった！');
          ev.upd.push(t);
        }
        break;
      }
      case 'charge': {
        c.charge = Math.max(c.charge || 1, eff.mult);
        break;
      }
      case 'cover': {
        if (eff.all) {
          c.cover = { target: 'all', until: this.time + eff.dur * 1000 };
          if (eff.defMult) c.buffs.def = { mult: eff.defMult, until: this.time + eff.dur * 1000 };
          ev.lines.push(`${c.name}は仲間全員を守る構えだ！`);
        } else {
          const t = targets[0];
          if (t === c) {
            ev.lines.push('しかし自分をかばうことはできない！');
            break;
          }
          c.cover = { target: t.id, until: this.time + eff.dur * 1000 };
        }
        ev.upd.push(c);
        break;
      }
      case 'bondUp': {
        this.addBond(Math.round(eff.amount * powMult));
        ev.lines.push('きずなゲージが増えた！');
        break;
      }
      case 'drainHp': {
        const t = targets[0];
        const before = t.hp;
        this.physHit(c, t, { mult: eff.mult || 1 }, ev, 'phys', powMult);
        const got = before - t.hp;
        if (got > 0) {
          const h = Math.min(c.maxHp - c.hp, Math.ceil(got / 2));
          if (h > 0) {
            c.hp += h;
            ev.lines.push(`${c.name}のHPが${h}回復した！`);
          }
        }
        break;
      }
      case 'drainMp': {
        const t = targets[0];
        const d = Math.min(t.mp, this.rng.int(eff.amount[0], eff.amount[1]));
        t.mp -= d;
        ev.lines.push(d > 0 ? `${t.name}のMPが${d}減った！` : `しかし${t.name}には効かなかった！`);
        ev.upd.push(t);
        break;
      }
      case 'callHelp': {
        this.callHelp(c, eff, ev);
        break;
      }
      case 'telegraph': {
        c.telegraph = eff.next;
        ev.fx = { type: 'telegraph', actor: c.id };
        ev.warn = true;
        // このターンの のこりの こうどうは とりやめ（みんなが そなえる じかんを つくる）
        this.queue = this.queue.filter((q) => q.id !== c.id);
        ev.forceLast = true;
        ev.atbAfter = 0;
        break;
      }
      case 'flee': {
        c.fled = true;
        c.alive = false;
        this.fledEnemies.push(c.species);
        ev.fx = { type: 'enemyFlee', actor: c.id };
        ev.upd.push(c);
        break;
      }
      case 'nothing': break;
      default: break;
    }
  }

  // ───────────── ダメージ計算 ─────────────
  physHit(c, t, eff, ev, element, powMult = 1) {
    if (!t.alive) return 0;
    const res = this.calcPhys(c, t, eff, powMult, element);
    ev.fx = ev.fx || { type: 'attack', actor: c.id, targets: [t.id], side: c.side };
    if (res.miss) {
      ev.lines.push(t.side === 'enemy' ? `ミス！${t.name}は素早く身をかわした！` : `${t.name}はひらりと身をかわした！`);
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, miss: true });
      return 0;
    }
    if (res.crit) ev.lines.push(c.side === 'ally' ? '会心の一撃！' : 'つうこんの一撃！');
    this.damage(c, t, res.dmg, ev, { crit: res.crit, element });
    if (eff.forceCrit !== undefined || res.crit) { /* noop */ }
    return res.dmg;
  }

  calcPhys(c, t, eff, powMult = 1, element = 'phys', estimate = false) {
    const acc = (eff.acc ?? 1) * (c.status.blind ? 0.4 : 1);
    const eva = (t.buffs.eva?.add || 0) + (t.flying ? 0.04 : 0) + clamp((effAgi(t) - effAgi(c)) / 500, 0, 0.1);
    const hit = clamp(0.97 * acc - eva, 0.05, 0.99);
    if (!estimate && !this.rng.chance(hit)) return { miss: true, dmg: 0 };
    let critChance = (c.side === 'enemy' ? 1 / 64 : (c.job === 'monk' ? 1 / 14 : 1 / 28)) + (eff.critBonus || 0);
    const crit = !estimate && (eff.forceCrit || this.rng.chance(critChance));
    const atk = effAtk(c) * (c.charge && c.charge > 1 ? c.charge : 1);
    if (!estimate && c.charge > 1) c.charge = 1;
    let dmg;
    if (crit) {
      dmg = atk * (estimate ? 1 : this.rng.float(0.95, 1.05));
    } else {
      const dfn = effDfn(t) * (t.metal ? 1 : (1 - (eff.ignoreDef || 0)));
      const base = atk / 2 - dfn / 4;
      if (base < 1) dmg = estimate ? 0.5 : this.rng.int(0, 1);
      else dmg = base * (estimate ? 1 : this.rng.float(0.875, 1.125));
    }
    dmg *= (eff.mult ?? 1) * powMult;
    if (eff.vsRace?.[t.race]) dmg *= eff.vsRace[t.race];
    if (eff.vsElement) for (const [el, m] of Object.entries(eff.vsElement)) if ((t.resist[el] ?? 1) < 1) dmg *= m;
    if (element && element !== 'phys') dmg *= t.resist[element] ?? 1;
    if (t.defending) dmg *= 0.5;
    if (t.metal && !crit) dmg = estimate ? 0.5 : this.rng.int(0, 1);
    if (!estimate) dmg *= this.comboMult(c);
    const final = Math.max(0, Math.round(dmg));
    return { dmg: final, crit, hit };
  }

  calcMagic(c, t, eff, powMult = 1, estimate = false) {
    const [mn, mx] = eff.base;
    const base = estimate ? (mn + mx) / 2 : this.rng.int(mn, mx);
    const scale = 1 + clamp(((c.mag || 0) - (eff.thr ?? 20)) / 150, 0, 1);
    let dmg = base * scale * powMult;
    const r = eff.element ? (t.resist[eff.element] ?? 1) : 1;
    dmg *= r;
    if (t.defending) dmg *= 0.75;
    if (eff.breath && t.buffs.breath) dmg *= 0.5;
    if (!estimate) dmg *= this.comboMult(c);
    return { dmg: Math.max(0, Math.round(dmg)), resisted: r === 0 };
  }

  magicHit(c, t, eff, ev, powMult) {
    if (!t.alive) return 0;
    const res = this.calcMagic(c, t, eff, powMult);
    if (res.resisted || res.dmg === 0) {
      ev.lines.push(t.side === 'enemy' ? `しかし${t.name}には効かなかった！` : `${t.name}はダメージを受けない！`);
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, miss: true });
      return 0;
    }
    this.damage(c, t, res.dmg, ev, { element: eff.element });
    return res.dmg;
  }

  damage(c, t, dmg, ev, info = {}) {
    ev.results = ev.results || [];
    if (dmg <= 0) {
      ev.lines.push(t.side === 'enemy' ? `ミス！${t.name}にダメージをあたえられない！` : `ミス！${t.name}はダメージを受けない！`);
      ev.results.push({ id: t.id, dmg: 0 });
      return;
    }
    t.hp = Math.max(0, t.hp - dmg);
    ev.lines.push(t.side === 'enemy' ? `${t.name}に${dmg}のダメージ！` : `${t.name}は${dmg}のダメージを受けた！`);
    ev.results.push({ id: t.id, dmg, crit: !!info.crit, element: info.element });
    ev.upd.push(t);
    ev.dealt = (ev.dealt || 0) + dmg;
    ev.lastTarget = t;
    if (t.side === 'ally' && dmg >= t.maxHp * 0.05) this.addBond(1);
    // ねむりは ダメージで おきることがある
    if (t.status.sleep && t.hp > 0 && this.rng.chance(0.5)) {
      delete t.status.sleep;
      ev.lines.push(`${t.name}は目を覚ました！`);
    }
    if (t.hp <= 0) ev.lines.push(...this.kill(t));
    else if (t.boss) this.checkPhase(t, ev);
  }

  kill(t) {
    t.alive = false;
    t.hp = 0;
    t.ready = false;
    t.queued = false;
    t.status = {};
    t.buffs = {};
    t.debuffs = {};
    t.cover = null;
    t.telegraph = null;
    this.queue = this.queue.filter((q) => q.id !== t.id);
    if (t.side === 'enemy') {
      this.killed.push(t.species);
      return [`${t.name}を倒した！`];
    }
    this.addBond(5);
    return [`${t.name}は死んでしまった！`];
  }

  heal(c, t, eff, ev, powMult) {
    if (!t.alive) return;
    const [mn, mx] = eff.base;
    let amt = this.rng.int(mn, mx);
    if (!eff.fixed) amt *= 1 + clamp(((c.healPow || 0) - (eff.thr ?? 20)) / 150, 0, 1);
    amt = Math.round(amt * powMult);
    const real = Math.min(t.maxHp - t.hp, amt);
    t.hp += real;
    ev.results = ev.results || [];
    ev.results.push({ id: t.id, heal: real });
    ev.upd.push(t);
    if (t.hp >= t.maxHp) ev.lines.push(`${t.name}のキズがすっかり回復した！`);
    else ev.lines.push(`${t.name}のHPが${real}回復した！`);
    if (c.side === 'ally' && t !== c && real > 0) this.addBond(2);
  }

  applyDebuff(c, t, d, ev, powMult = 1) {
    if (!t.alive) return;
    const r = t.resist.debuff ?? 1;
    const chance = (d.chance ?? 0.9) * r * (0.6 + 0.4 * powMult) * (t.boss ? 0.7 : 1);
    if (!this.rng.chance(chance)) {
      ev.lines.push(`しかし${t.name}には効かなかった！`);
      return;
    }
    t.debuffs[d.stat] = { mult: d.mult, until: this.time + (d.dur || 30) * 1000 };
    ev.lines.push(`${t.name}の${statLabel(d.stat)}が下がった！`);
    ev.upd.push(t);
  }

  tryStatus(c, t, eff, ev, powMult = 1) {
    if (!t.alive) return false;
    const st = eff.status;
    const r = t.resist[st] ?? 1;
    const chance = (eff.chance ?? 0.5) * r * (0.6 + 0.4 * powMult);
    if (t.status[st] || !this.rng.chance(chance)) {
      if (!eff.quiet && ev.lines.length < 12) ev.lines.push(`しかし${t.name}には効かなかった！`);
      return false;
    }
    const turns = eff.turns ? this.rng.int(eff.turns[0], eff.turns[1]) : 3;
    t.status[st] = { turns };
    const msg = {
      sleep: `${t.name}はねむってしまった！`,
      paralyze: `${t.name}は体がしびれて動けなくなった！`,
      confuse: `${t.name}は混乱した！`,
      blind: `${t.name}はまぼろしに包まれた！`,
      silence: `${t.name}の呪文がふうじこめられた！`,
      poison: `${t.name}は毒におかされた！`,
    }[st];
    ev.lines.push(msg);
    ev.upd.push(t);
    if (t.ready && (st === 'sleep' || st === 'paralyze')) {
      t.ready = false;
      t.atb = 0;
    }
    return true;
  }

  // ───────────── れんけい・合体 ─────────────
  comboMult(c) {
    if (c.side !== 'ally' || !this.cur) return 1;
    if (this.cur.comboCount === undefined) {
      const k = this.combo;
      const chain = k.actor && k.actor !== c.id && this.time - k.time <= COMBO_WINDOW;
      this.cur.comboCount = chain ? k.count + 1 : 1;
    }
    const n = this.cur.comboCount;
    // 2れんけい=1.1ばい、3=1.15、4=1.2、5いじょう=1.25
    return n >= 2 ? Math.min(1.25, 1.05 + 0.05 * (n - 1)) : 1;
  }

  afterDamage(c, ev, element) {
    if (c.side === 'enemy') {
      this.combo = { count: 0, actor: null, element: null, time: -99999 };
      return;
    }
    if (!ev.dealt) return;
    this.addBond(1);
    const n = ev.comboCount || 1;
    const prev = this.combo;
    if (n >= 2) {
      ev.combo = n;
      ev.lines.splice(1, 0, `れんけい${n}！`);
      this.addBond(Math.min(4, n));
      // 合体（ぞくせいの くみあわせ）
      const el = element || 'phys';
      const tc = TEAM_COMBOS.find((x) => (x.a === prev.element && x.b === el) || (x.b === prev.element && x.a === el));
      if (tc && prev.element !== el) {
        ev.lines.push(`合体！${tc.name}！`, tc.desc);
        ev.team = tc.name;
        const bonus = Math.max(1, Math.round(ev.dealt * tc.mult));
        const targets = tc.all ? this.aliveEnemies() : (ev.lastTarget?.alive ? [ev.lastTarget] : this.aliveEnemies().slice(0, 1));
        for (const t of targets) {
          const r = tc.element === 'void' ? Math.max(0.5, Math.min(1, t.resist.void ?? 1)) : (t.resist[tc.element] ?? 1);
          let d = Math.round(bonus * r * (tc.all ? 0.8 : 1));
          if (t.metal) d = this.rng.int(0, 1);
          if (d > 0) this.damage(c, t, d, ev, { element: tc.element });
        }
        ev.fx = { ...(ev.fx || {}), team: tc.name, teamElement: tc.element };
        this.addBond(3);
        ev.extraLock = 500;
      }
    }
    this.combo = { count: n, actor: c.id, element: element || 'phys', time: this.time };
  }

  addBond(n) {
    this.bond = Math.max(0, Math.min(BOND_MAX, this.bond + n));
  }

  // ───────────── 魔法剣 ─────────────
  doMahouken(c, cmd, ev) {
    const sp = ABILITIES[cmd.spell], sk = ABILITIES[cmd.skill];
    const name = sp.name + sk.name;
    ev.name = name;
    ev.lines.push(`${c.name}は剣に${sp.name}を宿らせた！`);
    ev.lines.push(`${name}！`);
    if (c.status.silence) {
      ev.lines.push('しかし呪文はふうじこめられている！');
      return;
    }
    const cost = mpCost(c.penChar, cmd.spell) + mpCost(c.penChar, cmd.skill);
    if (cost > c.mp) {
      ev.lines.push('しかしMPが足りない！');
      return;
    }
    c.mp -= cost;
    const t = this.resolveTarget(c, 'enemy', cmd.target);
    if (!t) return;
    const spPen = penaltyFor(c.penChar, cmd.spell).powMult;
    const skPen = penaltyFor(c.penChar, cmd.skill).powMult;
    ev.fx = { type: 'ability', anim: 'mahouken', actor: c.id, targets: [t.id], side: 'ally', element: sp.effect.element };
    const skEff = { ...sk.effect, element: sp.effect.element };
    const res = this.calcPhys(c, t, skEff, skPen, sp.effect.element);
    if (res.miss) {
      ev.lines.push(`ミス！${t.name}は素早く身をかわした！`);
    } else {
      const magic = this.calcMagic(c, t, sp.effect, spPen);
      const total = Math.round(res.dmg + magic.dmg * 0.6);
      if (res.crit) ev.lines.push('会心の一撃！');
      this.damage(c, t, t.metal && !res.crit ? this.rng.int(0, 1) : total, ev, { crit: res.crit, element: sp.effect.element });
    }
    if (skEff.atbAfter) ev.atbAfter = skEff.atbAfter;
    this.afterDamage(c, ev, sp.effect.element);
  }

  // ───────────── きずな技（ミナデイン） ─────────────
  startBond(c, cmd, ev) {
    if (this.bond < BOND_MAX) {
      ev.lines.push('しかしきずなゲージが足りない！');
      return;
    }
    const target = this.peekTarget(c, 'enemy', cmd.target);
    if (!target) return;
    this.bond = 0;
    ev.lines.push(`${c.name}はきずなの紋章を高くかかげた！`, 'みんな、力を合わせて！');
    ev.fx = { type: 'bondStart', actor: c.id };
    const total = 3500;
    const aiJoin = this.aliveAllies()
      .filter((x) => x !== c && (!x.controller || x.auto))
      .map((x) => ({ id: x.id, at: this.rng.int(500, 2200), done: false }));
    this.bondCharge = { actor: c.id, target: target.id, joined: new Set([c.id]), remaining: total, total, aiJoin };
    ev.bondWindow = total;
    ev.extraLock = 0;
  }

  bondJoin(id) {
    const bc = this.bondCharge;
    const c = this.get(id);
    if (!bc || !c || !c.alive || bc.joined.has(id)) return false;
    bc.joined.add(id);
    this.emit({ t: 'bondJoin', id, count: bc.joined.size });
    return true;
  }

  finishBond() {
    const bc = this.bondCharge;
    this.bondCharge = null;
    const actor = this.get(bc.actor);
    const ev = { t: 'act', id: bc.actor, lines: [], upd: [], name: 'ミナデイン' };
    this.cur = ev;
    const joined = [...bc.joined].map((id) => this.get(id)).filter((x) => x && x.alive);
    const n = joined.length;
    ev.lines.push(n >= 4 ? 'みんなの心が一つになった！' : `${n}人の力が一つになった！`);
    ev.lines.push('ミナデイン！！');
    let power = 0;
    for (const j of joined) power += j.atk * 0.35 + j.mag * 0.35 + j.lv * 2;
    power *= 1 + 0.15 * (n - 1);
    let main = this.get(bc.target);
    if (!main || !main.alive) main = this.aliveEnemies()[0];
    ev.fx = { type: 'ability', anim: 'minadein', actor: bc.actor, targets: this.aliveEnemies().map((x) => x.id), side: 'ally', element: 'bolt' };
    for (const t of this.aliveEnemies()) {
      let d = power * (t === main ? 1 : 0.5) * this.rng.float(0.95, 1.05);
      if (t.metal) d = this.rng.int(1, 3);
      this.damage(actor, t, Math.round(d), ev, { element: 'bolt' });
    }
    for (const j of joined) {
      if (j !== actor) j.atb = 0;
      if (j.ready) j.ready = false;
      this.queue = this.queue.filter((q) => q.id !== j.id);
      j.queued = false;
      ev.upd.push(j);
    }
    actor.atb = 0;
    if (ev.postLines) ev.lines.push(...ev.postLines);
    delete ev.postLines;
    ev.upd = [...new Set(ev.upd)].map(pub);
    ev.bond = this.bond;
    this.lock = 800 + 380 * ev.lines.length;
    ev.dur = this.lock;
    this.emit(ev);
    this.cur = null;
    this.checkEnd();
  }

  // ───────────── どうぐ ─────────────
  useItem(c, cmd, ev) {
    const it = ITEMS[cmd.id];
    ev.name = it.name;
    ev.lines.push(`${c.name}は${it.name}を使った！`);
    if (this.hooks.consumeItem && !this.hooks.consumeItem(c, cmd.id)) {
      ev.lines.push('しかし道具が見つからなかった！');
      return;
    }
    const eff = it.effect;
    const pseudo = { target: it.target };
    const targets = this.targetsFor(c, pseudo, cmd);
    ev.fx = { type: 'item', actor: c.id, targets: targets.map((t) => t.id), side: 'ally', anim: eff.type === 'heal' ? 'heal1' : 'item' };
    switch (eff.type) {
      case 'heal': for (const t of targets) this.heal(c, t, eff, ev, 1); break;
      case 'cure': this.applyAbility(c, { effect: eff, target: it.target, anim: 'heal1' }, cmd, ev, 1); break;
      case 'revive': this.applyAbility(c, { effect: eff, target: 'deadAlly', anim: 'revive' }, cmd, ev, 1); break;
      case 'mpHeal': {
        for (const t of targets) {
          const d = Math.min(t.maxMp - t.mp, this.rng.int(eff.base[0], eff.base[1]));
          t.mp += d;
          ev.lines.push(`${t.name}のMPが${d}回復した！`);
          ev.upd.push(t);
        }
        break;
      }
      case 'escape': {
        if (!this.canFlee) {
          ev.lines.push('しかし逃げられない！');
          break;
        }
        ev.lines.push('辺りがけむりに包まれた！', 'うまく逃げ切れた！');
        ev.fx = { type: 'flee' };
        this.pendingEnd = { outcome: 'flee' };
        break;
      }
      default: ev.lines.push('しかし何も起こらなかった！');
    }
  }

  // ───────────── なかまを よぶ ─────────────
  callHelp(c, eff, ev) {
    const count = eff.count || 1;
    const room = 7 - this.aliveEnemies().length;
    const sp = eff.species || c.species;
    if (room <= 0 || (!eff.count && !this.rng.chance(0.55))) {
      ev.lines.push('しかし何も来なかった！');
      return;
    }
    const n = Math.min(room, count);
    const added = this.addEnemies(Array(n).fill(sp));
    for (const m of added) m.atb = this.rng.float(0, 30);
    ev.lines.push(n > 1 ? `${MONSTERS[sp].name}が${n}ひき現れた！` : `${added[0].name}が現れた！`);
    ev.joined = added.map(pub);
    c.helpCalls = (c.helpCalls || 0) + 1;
  }

  // ───────────── ボスの だんかい ─────────────
  checkPhase(t, ev) {
    const phases = MONSTERS[t.species]?.phases || [];
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      if (t.phaseDone?.[i]) continue;
      if (t.hp / t.maxHp < p.hpBelow) {
        t.phaseDone = t.phaseDone || {};
        t.phaseDone[i] = true;
        ev.phaseLines = (ev.phaseLines || []).concat(p.msg || []);
        if (p.buff?.atk) t.buffs.atk = { mult: p.buff.atk, until: Infinity };
        if (p.debuff?.def) t.debuffs.def = { mult: p.debuff.def, until: Infinity };
        if (p.turns) t.turns = p.turns;
        if (p.addActions) t.actions = t.actions.concat(p.addActions);
        if (p.summon) {
          const room = 7 - this.aliveEnemies().length;
          const list = p.summon.slice(0, Math.max(0, room));
          if (list.length) {
            const added = this.addEnemies(list);
            for (const m of added) m.atb = this.rng.float(0, 40);
            ev.joined = (ev.joined || []).concat(added.map(pub));
            ev.phaseLines.push(`${MONSTERS[list[0]].name}が${list.length}ひき現れた！`);
          }
        }
        ev.phase = true;
      }
    }
    if (ev.phaseLines && !ev.phaseQueued) {
      ev.phaseQueued = true;
      // メッセージの さいごに つける
      const lines = ev.phaseLines;
      ev.postLines = (ev.postLines || []).concat(lines);
    }
  }

  // ───────────── しょうはい ─────────────
  checkEnd() {
    if (this.pendingEnd || this.over) return;
    if (!this.aliveEnemies().length) {
      this.pendingEnd = { outcome: 'win' };
    } else if (!this.aliveAllies().length) {
      this.pendingEnd = { outcome: 'lose' };
    }
    if (this.pendingEnd) this.queue = [];
  }

  endBattle(res) {
    this.over = true;
    this.pendingEnd = null;
    this.result = {
      outcome: res.outcome,
      killed: this.killed.slice(),
      fled: this.fledEnemies.slice(),
      bond: this.bond,
      allies: this.allies.map((a) => ({ id: a.id, charId: a.charId, hp: a.hp, mp: a.mp, alive: a.alive, poison: !!a.status.poison })),
    };
    this.emit({ t: 'end', outcome: res.outcome });
  }

  // ───────────── クライアントへ おくる じょうほう ─────────────
  snapshot() {
    return {
      id: this.id,
      bg: this.bg,
      bgm: this.bgm,
      boss: this.boss,
      canFlee: this.canFlee,
      bond: this.bond,
      speed: this.speed,
      wait: this.wait,
      combatants: this.combatants.filter((c) => !c.fled).map(pub),
    };
  }
}

// ───────────── つくる ─────────────
export function allyFromCharacter(char, init = {}) {
  const st = computeStats(char);
  const abilities = init.abilities || learnedAbilities(char);
  return {
    side: 'ally',
    kind: init.kind || 'player',
    name: char.name,
    charId: char.id,
    controller: init.controller || null,
    auto: !!init.auto,
    tactics: init.tactics || char.tactics || 'balanced',
    look: char.look,
    job: char.job,
    eq: char.equip ? [char.equip.weapon || '', char.equip.armor || '', char.equip.shield || '', char.equip.head || ''].join(',') : '',
    mon: char.species || undefined,
    lv: char.level,
    maxHp: st.maxHp,
    hp: Math.max(0, Math.min(st.maxHp, char.hp ?? st.maxHp)),
    maxMp: st.maxMp,
    mp: Math.max(0, Math.min(st.maxMp, char.mp ?? st.maxMp)),
    atk: st.atk, dfn: st.dfn, agi: st.agi, mag: st.mag, healPow: st.heal,
    weaponCat: st.weaponCat,
    onHit: st.onHit,
    resist: { ...st.resist },
    race: char.species ? (MONSTERS[char.species]?.race || 'beast') : 'human',
    abilities,
    penChar: { job: char.job, jobs: char.jobs },
    atb: 0, ready: false, queued: false,
    buffs: {}, debuffs: {}, status: char.status?.poison ? { poison: { turns: 99 } } : {},
    alive: (char.hp ?? 1) > 0,
    charge: 1,
    cover: null,
  };
}

export function enemyFromSpecies(sp) {
  const m = MONSTERS[sp];
  if (!m) throw new Error('unknown monster ' + sp);
  return {
    side: 'enemy', kind: 'monster', species: sp,
    name: m.name, baseName: m.name, letter: '',
    lv: m.lv, maxHp: m.hp, hp: m.hp, maxMp: m.mp || 0, mp: m.mp || 0,
    atk: m.str, dfn: m.def, agi: m.agi, mag: m.mag || 0, healPow: m.mag || 0,
    resist: { ...(m.resist || {}) }, race: m.race, metal: !!m.metal, flying: !!m.flying, boss: !!m.boss,
    turns: m.turns || 1, size: m.size,
    actions: m.actions.slice(),
    abilities: [],
    atb: 0, ready: false, queued: false,
    buffs: {}, debuffs: {}, status: {},
    alive: true, charge: 1, telegraph: null, used: {}, recent: [],
  };
}

// クライアントに みせる じょうほう
export function pub(c) {
  const st = Object.keys(c.status || {});
  const buffs = [...Object.keys(c.buffs || {}).map((k) => '+' + k), ...Object.keys(c.debuffs || {}).map((k) => '-' + k)];
  return {
    id: c.id, side: c.side, kind: c.kind, name: c.name, species: c.species, charId: c.charId,
    controller: c.controller, auto: c.auto, look: c.look, job: c.job, eq: c.eq, mon: c.mon, lv: c.lv,
    hp: c.hp, maxHp: c.maxHp, mp: c.mp, maxMp: c.maxMp,
    atb: Math.round(c.atb * 10) / 10, rate: 100 / fillTime(effAgi(c)),
    ready: !!c.ready, alive: !!c.alive, fled: !!c.fled, status: st, buffs,
    defending: !!c.defending, telegraph: !!c.telegraph, boss: !!c.boss, size: c.size, slot: c.slot,
    abilities: c.side === 'ally' ? c.abilities : undefined,
    weaponCat: c.side === 'ally' ? c.weaponCat : undefined,
    pc: c.side === 'ally' ? c.penChar : undefined,
    covering: c.cover ? c.cover.target : null,
  };
}

// ───────────── こうかを かけた あとの つよさ ─────────────
export function effAgi(c) {
  let v = c.agi;
  if (c.buffs?.agi) v *= c.buffs.agi.mult;
  if (c.debuffs?.agi) v *= c.debuffs.agi.mult;
  return v;
}
export function effAtk(c) {
  let v = c.atk;
  if (c.buffs?.atk) v *= c.buffs.atk.mult;
  if (c.debuffs?.atk) v *= c.debuffs.atk.mult;
  return v;
}
export function effDfn(c) {
  let v = c.dfn;
  if (c.buffs?.def) v *= c.buffs.def.mult;
  if (c.debuffs?.def) v *= c.debuffs.def.mult;
  return v;
}

function statLabel(stat) {
  return { atk: '攻撃力', def: '守備力', agi: '素早さ', eva: 'かいひりつ', breath: 'ブレスたいせい' }[stat] || stat;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function avg(arr) { return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0; }
