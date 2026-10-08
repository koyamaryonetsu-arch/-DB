// バトルエンジン（リアルタイム・ターン制）
//
// ・ひとりひとりに「こうどうゲージ」があり、すばやさが 高いほど はやく たまる
// ・ゲージが たまった キャラクターから コマンドを えらんで こうどうする
// ・コマンドを えらんでいる あいだも 時間は すすむ（ウェイトモードを のぞく）
// ・こうどうの えんしゅつ中は ゲージが とまる（メッセージが よめるように）
//
// サーバー（家族サーバー）でも ブラウザ（ひとりモード）でも おなじ コードが うごく

import { makeRng } from './rng.js?v=54cbd3f4befe';
import { ABILITIES, ELEMENT_ORDER, ELEMENT_NAMES } from './data/abilities.js?v=54cbd3f4befe';
import { HIRAMEKI, hiraChance, hiraRatio } from './data/hirameki.js?v=54cbd3f4befe';
import { DUAL_TECHS, dualOptions, partnerNow } from './data/dual.js?v=54cbd3f4befe';
import { MONSTERS } from './data/monsters.js?v=54cbd3f4befe';
import { ITEMS } from './data/items.js?v=54cbd3f4befe';
import { JOBS } from './data/jobs.js?v=54cbd3f4befe';
import { computeStats, learnedAbilities, penaltyFor, mpCost, weaponOk, comboAllowed, hiraAllowed, battleAbilityOk } from './stats.js?v=54cbd3f4befe';
import { decideMonster, decideAlly } from './ai.js?v=54cbd3f4befe';
import { ENEMY_RATES, strengthenEnemy } from './data/difficulty.js?v=54cbd3f4befe';
// 第4章の しかけ（まぼろしの分身・月の鏡・そうびしたまま 使う 道具）
import { setupMirage, mirageHit, mirageVanish, mirageDown, mirageSync, mirageRemake, ch4ItemCheck, ch4UseItem, mirrorSnap } from './battle-ch4.js?v=54cbd3f4befe';
// 第4章 Step 6 の 砂に もぐる（ねらえない。battle-ch4.js）
import { burrowStart, burrowWarn, burrowBlock, hiddenFrom } from './battle-ch4.js?v=54cbd3f4befe';
import { shownEquipKey } from './look-equip.js?v=54cbd3f4befe';

export const BOND_MAX = 100;
// きずなゲージの たまりやすさ（1 … はじめの 版。ちいさいほど たまりにくい）
export const BOND_GAIN = 0.35;
// 合体技の 強さ（2人の 番を 使うので、2人ぶん より 少し 強い くらい）
export const DUAL_MAGIC = 1.15; // 1体を ねらう 呪文の 合体技: 2人の 呪文の 合計 × これ
export const DUAL_SPREAD = 0.7; // 全体を ねらう 合体技は この 倍
export const DUAL_PHYS = 0.7; // 物理の 合体技の 倍率に かける 数
// 合体技の 2人の 強さの 合わせかた: 強い ほうの 強さ ＋ 弱い ほうの この わりあい（2人とも 強いほど 強い）
export const DUAL_MIX = 0.5;
// 合体技の 呪文・回復は、2人の 魔力が 高いほど ここまで 強くなる（ふつうの 呪文は 2倍まで。合体技は 2.6倍まで）
export const DUAL_SCALE_CAP = 1.6;
// 合体技に さそわれた 家族が こたえるまで まつ 時間（ミリびょう）
export const DUAL_ASK_MS = 7000;
const COMBO_WINDOW = 6000;
const LETTERS = 'ABCDEFGH';

// 合体技の 1つの こうか。呪文・回復の 強さは 2人が 出した 技から きめる（すすむほど 強くなる）
export function dualPartEffect(t, part, skills = []) {
  const eff = { ...part };
  const spread = (part.target || t.target) === 'enemies' || (part.target || t.target) === 'allies';
  if ((part.type === 'magic' || part.type === 'heal') && part.base) {
    const avg = (e) => (e.base[0] + e.base[1]) / 2;
    const src = skills.map((id) => ABILITIES[id]?.effect).filter((e) => e?.type === part.type && Array.isArray(e.base));
    if (src.length) {
      let sum = src.reduce((a, e) => a + avg(e), 0);
      if (src.length === 1) sum *= 2;
      const mid = sum * DUAL_MAGIC * (spread ? DUAL_SPREAD : 1);
      eff.base = [Math.max(1, Math.round(mid * 0.9)), Math.max(1, Math.round(mid * 1.1))];
      eff.thr = Math.min(...src.map((e) => e.thr ?? 20));
    } else {
      eff.base = part.base.map((v) => Math.round(v * 0.6));
    }
  }
  if (part.type === 'phys') eff.mult = (part.mult ?? 1) * DUAL_PHYS;
  // 呪文・回復は 2人の 魔力（回復魔力）が 高いほど、ふつうの 呪文より 先まで 強くなる
  if (part.type === 'magic' || part.type === 'heal') eff.scaleCap = DUAL_SCALE_CAP;
  return eff;
}

// ───────────── バフ・デバフの かさねがけ ─────────────
// 同じ つよさを もう一度 上げる（下げる）と 2だんかいめ（効き目が 2倍）。それより 上は かさならない（時間だけ のびる）
export const BUFF_STACK = 2;
// base … 1回ぶんの 倍率（1.3 など。下げる ときは 0.75 など）、lv … だんかい
// （大防御の ような とても 強い こうかは、2だんかいめで ふえる ぶんを ひかえめに: 上げる ときは +0.5、下げる ときは −0.25 まで）
export function stackMult(base, lv) {
  if (lv <= 1) return base;
  return base >= 1 ? Math.min(1 + (base - 1) * lv, base + 0.5) : Math.max(0.25, 1 - (1 - base) * lv, base - 0.25);
}
// map（c.buffs か c.debuffs）の st に base の こうかを かさねる。もどりち: { lv, max }（max … もう かさならなかった）
export function stackBuff(map, st, base, until) {
  const cur = map[st];
  // 前より 強い こうかなら そちらを もとに する（上げる ときは 大きい ほう、下げる ときは 小さい ほう）
  const b0 = cur?.base ?? cur?.mult;
  const keep = b0 !== undefined && (base >= 1 ? b0 >= base : b0 <= base);
  const b = keep ? b0 : base;
  const was = cur ? (cur.lv || 1) : 0;
  const lv = Math.min(BUFF_STACK, was + 1);
  map[st] = { mult: stackMult(b, lv), base: b, lv, until: Math.max(cur?.until || 0, until) };
  return { lv, max: was >= BUFF_STACK };
}

// 合体技を 出す 2人の 力を 合わせた かげ: 攻撃力・魔力・回復魔力は「強い ほう ＋ 弱い ほうの 半分」
// （2人の つよさ・かけている バフも そのまま 合わせる。強い 2人ほど 強い 合体技に なる）
export function dualProxy(c, p) {
  const proxy = Object.create(c);
  const mix = (x, y) => Math.round(Math.max(x || 0, y || 0) + Math.min(x || 0, y || 0) * DUAL_MIX);
  // 攻撃力は バフ・デバフを ふくめた 強さで 合わせる（effAtk）。合わせた あとに もう一度 かからない ように バフは けす
  proxy.atk = mix(effAtk(c), effAtk(p));
  proxy.mag = mix(c.mag, p.mag);
  proxy.healPow = mix(c.healPow, p.healPow);
  proxy.buffs = { ...c.buffs, atk: undefined };
  proxy.debuffs = { ...c.debuffs, atk: undefined };
  proxy.charge = 1;
  return proxy;
}

// 戦いの 速さ（ゲージと エフェクト）と 文字の 速さ。5だん。まんなかが ふつう（前の 版より すこし ゆっくり）
export const BATTLE_SPEEDS = [0.6, 0.75, 0.85, 1, 1.25];
export const TEXT_SPEEDS = [0.55, 0.7, 0.8, 1, 1.25];
export const DEFAULT_BATTLE_SPEED = 0.85;
export const DEFAULT_TEXT_SPEED = 0.8;
// セーブの 設定を 今の 形に（前の 版の「ふつう」1 は 新しい ふつうに）
export function normBattleSettings(bs = {}) {
  const near = (list, v, d) => (Number.isFinite(v) ? list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)) : d);
  const v2 = bs.sv === 2;
  return {
    speed: v2 ? near(BATTLE_SPEEDS, bs.speed, DEFAULT_BATTLE_SPEED) : (bs.speed && bs.speed < 1 ? 0.75 : bs.speed > 1 ? 1.25 : DEFAULT_BATTLE_SPEED),
    textSpeed: near(TEXT_SPEEDS, bs.textSpeed, DEFAULT_TEXT_SPEED),
  };
}

// 敵の 呪文・息・回復は 数が きまっているので、みかたの HP の のび（レベルでは ひかえめ）に あわせて よわめる
export function enemyFixedScale(c) {
  if (c?.side !== 'enemy' || !c.species) return 1;
  return clamp(1 - 0.016 * ((c.lv || 1) - 4), 0.7, 1);
}

// ───────────── こうどうゲージの はやさ ─────────────
// すばやさの 差は「すこしだけ」効く（すばやさ 15 と 45 で 約1.2倍。素早い 人ばかりが 動く ことに ならない）
//   ゲージが たまる 時間 = base ÷（すばやさの 倍率 × ピオリムなどの 倍率）
//   すばやさの 倍率 = (すばやさ ÷ ref) の power じょう（すばやさ 30 で 1）
//   ピオリムなどは すばやさとは べつに 倍率で かける（buff: 1.35 → 約1.25倍、0.7 → 約0.8倍）
//   head: たたかいの はじめの ゲージ（素早い 人は すこしだけ 先に 動きやすい）
//   boss: ボスの ゲージの 速さ（ボスは 2回 動いたり 強い 技が あるので すこし ゆっくり。monsters の speed で うわがき できる）
export const ATB = { base: 3300, ref: 30, power: 0.17, buff: 0.72, head: 20, headMax: 12, boss: 0.7 };

export function agiFactor(agi) {
  return Math.pow(Math.max(1, agi || 0) / ATB.ref, ATB.power);
}

// すばやさ いがいの はやさの 倍率（ピオリム・ボスの とくべつな 速さ など）
export function speedMult(c) {
  let m = c?.speed || 1;
  if (c?.buffs?.agi) m *= 1 + (c.buffs.agi.mult - 1) * ATB.buff;
  if (c?.debuffs?.agi) m *= 1 - (1 - c.debuffs.agi.mult) * ATB.buff;
  return m;
}

// ゲージが たまるまでの じかん（ミリびょう。戦いの 速さの 設定を かける まえ）
export function fillTime(agi, mult = 1) {
  return ATB.base / (agiFactor(agi) * mult);
}

// 1ミリびょうで たまる ゲージ（100で まんたん）
export function atbRate(c) {
  return 100 / fillTime(c.agi, speedMult(c));
}

// つよさの 画面の「約〇びょうごとに 順番が 来る」（戦いの 速さの 設定も かける）
export function turnSeconds(agi, battleSpeed = DEFAULT_BATTLE_SPEED) {
  return fillTime(agi) / 1000 / (battleSpeed || 1);
}

// ───────────── ぶきで かわる ふつうの 攻撃の 相手 ─────────────
// ムチ: えらんだ 敵の グループ（えらんだ 1体から じゅんに）。ブーメラン: 敵全体（左から じゅんに）
// 2体め いこうは ダメージが へる（会心は 1体ずつ きまる）
export const WEAPON_REACH = { whip: 'group', boomerang: 'enemies' };
export const REACH_FALLOFF = {
  whip: [1, 0.85, 0.7, 0.55, 0.45],
  boomerang: [1, 0.8, 0.65, 0.5, 0.4],
};
export function attackReach(weaponCat) {
  return WEAPON_REACH[weaponCat] || 'enemy';
}
// i 体めの ダメージの 倍率（0 から かぞえる）
export function reachFalloff(weaponCat, i) {
  const f = REACH_FALLOFF[weaponCat];
  return f ? f[Math.min(i, f.length - 1)] : 1;
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
    // ためした 属性（'まもの|属性'）。たたかいの あとで 図鑑に のこす
    this.tried = new Set();
    this.over = false;
    this.result = null;
    this.pendingEnd = null;
    this.speed = opts.speed || 1;
    this.textSpeed = opts.textSpeed || 1;
    this.wait = !!opts.wait;
    this.canFlee = opts.canFlee !== false;
    this.boss = !!opts.boss;
    // 呪文が ふうじられた 場所（第4章 Step 4 の 王家のピラミッド 2階）: みかたも 敵も 呪文が 使えない（特技・道具は 使える）
    this.noSpells = !!opts.noSpells;
    this.bg = opts.bg || 'grass';
    this.bgm = opts.bgm || 'battle';
    this.bond = Math.max(0, Math.min(BOND_MAX, opts.bond || 0));
    this.combo = { count: 0, actor: null, element: null, time: -99999 };
    this.fleeBonus = 0;
    this.bondCharge = null;
    // 合体技の さそい（家族が こたえるのを まっている もの）
    this.invites = new Map();
    this.inviteSeq = 0;
    this.gaugeTimer = 0;
    this.poisonTimer = 0;
    this.killed = [];
    this.fledEnemies = [];
    this.nextId = 1;
    this.turnCount = 0;
    // なかまが こうどうした 回数（ワンパンチで おわった たたかいは 職業の 修行が 半分。world/battles.js）
    this.allyActs = 0;
    this.preemptive = opts.preemptive || null;
    for (const a of opts.allies || []) this.addAlly(a);
    this.enemyMod = opts.enemyMod || null; // 敵の 強さを かえる（宝の洞窟）
    // 設定の「敵の強さ」（1・1.2・1.5・2倍。data/difficulty.js）。とちゅうで 来る 魔物にも かける
    this.enemyRate = ENEMY_RATES.includes(opts.enemyRate) ? opts.enemyRate : 1;
    this.addEnemies(opts.enemies || []);
    // まぼろしの分身（おなじ 魔物の 1体だけが 本物。battle-ch4.js）
    setupMirage(this);
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

  // 馬車の 仲間と 入れかわる: outId の 人は 戦いから ぬけ（fled・out）、init の 人が おなじ 場所に 入る
  // （メッセージは よびだす がわ。world/wagon.js）
  swapAlly(outId, init) {
    const t = this.get(outId);
    if (!t || t.side !== 'ally' || t.fled) return null;
    this.queue = this.queue.filter((q) => q.id !== t.id);
    Object.assign(t, { fled: true, out: true, ready: false, queued: false, defending: false, cover: null });
    const c = this.addAlly(init);
    c.slot = t.slot;
    c.atb = this.rng.float(0, 40);
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
      if (this.enemyMod) this.enemyMod(m);
      // 敵の 強さ（ハードなど）: はじめの 魔物も、仲間を呼ぶ・ボスが 呼んだ 手下も おなじ 倍率
      if (this.enemyRate > 1) strengthenEnemy(m, this.enemyRate);
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
      // はじめの ゲージ: 運しだい ＋ 素早い 人は すこしだけ 先に
      c.atb = this.rng.float(0, 35) + clamp(ATB.head * (agiFactor(effAgi(c)) - 0.8), 0, ATB.headMax);
      if (this.preemptive === 'ally' && c.side === 'ally') c.atb = 100;
      if (this.preemptive === 'enemy' && c.side === 'enemy') c.atb = 100;
      if (c.atb >= 100) c.atb = 99.9;
    }
  }

  // 馬車に もどった 人（fled）は のぞく
  get allies() { return this.combatants.filter((c) => c.side === 'ally' && !c.fled); }
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
    // 合体技の さそいは リアル時間で まつ（えんしゅつ中も へる）
    if (this.invites.size) {
      for (const inv of [...this.invites.values()]) {
        inv.remaining -= dtReal;
        if (inv.remaining <= 0) this.endInvite(inv, '時間切れ');
      }
    }
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
      this.lock -= dtReal;
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

  // えんしゅつの じかん: エフェクトは 戦いの 速さ、文字は 文字の 速さで
  pace(fxMs, lineMs, lines, min = 0) {
    return Math.round(Math.max(min / this.speed, fxMs / this.speed + (lineMs * lines) / this.textSpeed));
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
    // どく・じわじわ 回復（4びょうごと）
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
      for (const c of this.combatants) {
        if (!c.regen) continue;
        if (!c.alive || c.regen.until <= this.time) {
          c.regen = null;
          continue;
        }
        const h = Math.min(c.maxHp - c.hp, c.regen.amt);
        if (h <= 0) continue;
        c.hp += h;
        lines.push(`${c.name}のHPが${h}回復した！`);
        upd.push(pub(c));
      }
      if (lines.length) {
        this.emit({ t: 'msg', lines, upd, fx: { type: 'poison' } });
        this.lock = this.pace(500, 300, lines.length);
        this.checkEnd();
      }
    }
    // ゲージ
    for (const c of this.combatants) {
      if (!c.alive || c.fled || c.ready || c.queued || c.waitDual) continue;
      c.atb += atbRate(c) * dt;
      if (c.atb >= 100) {
        c.atb = 100;
        // 合体技を よやくして まっている 仲間が いれば、この 番で いっしょに 出す
        if (c.dualTarget && this.fireWait(this.get(c.dualTarget), c)) continue;
        this.onReady(c);
      }
    }
    // 砂に もぐった 敵の 前ぶれ「砂がもり上がった…！」（battle-ch4.js）
    burrowWarn(this, pub);
    // 合体技の よやく
    this.checkWaits();
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
    this.emit({ t: 'queued', id: c.id });
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
    if (cmd?.type === 'dualAnswer') return this.answerDual(actorId, cmd);
    // 合体技の よやくを やめる
    if (cmd?.type === 'dualCancel') {
      if (!c.waitDual) return { ok: false, reason: 'no' };
      this.endWait(c, null);
      return { ok: true };
    }
    if (!c.ready) return { ok: false, reason: 'notready' };
    const v = this.validate(c, cmd);
    if (!v.ok) return v;
    // 合体技に さそっていた ときは、とりやめて ほかの コマンドに
    if (c.inviting) {
      const inv = this.invites.get(c.inviting);
      if (inv) this.endInvite(inv, 'やめた');
    }
    if (cmd.type === 'dual') return this.startDual(c, cmd);
    if (cmd.type === 'defend') {
      c.ready = false;
      c.atb = 0;
      c.defending = true;
      this.emit({ t: 'act', id: c.id, name: '防御', lines: [`${c.name}は身を守っている。`], upd: [pub(c)], fx: { type: 'defend', actor: c.id } });
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
    if (c.auto && c.inviting) {
      const inv = this.invites.get(c.inviting);
      if (inv) this.endInvite(inv, 'やめた');
    }
    if (c.auto && c.ready) {
      c.ready = false;
      this.onReady(c);
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
        // フィールドだけの 呪文・かくれた 技（コマンドに 出す 技と おなじ きまり。stats.js の battleAbilityOk）
        if (!battleAbilityOk(c.penChar, cmd.id, c.weaponCat)) return { ok: false, reason: '戦いでは使えない' };
        if (this.noSpells && spellSealed(a)) return { ok: false, reason: SEALED_REASON };
        if (mpCost(c.penChar, cmd.id) > c.mp) return { ok: false, reason: 'MPが足りない' };
        return { ok: true };
      }
      case 'mahouken': {
        if (!c.abilities.includes('mahouken')) return { ok: false, reason: 'まだ覚えていない' };
        if (this.noSpells) return { ok: false, reason: SEALED_REASON };
        if (!comboAllowed(c.penChar, 'mahouken')) return { ok: false, reason: '今の職業では使えない' };
        const sp = ABILITIES[cmd.spell], sk = ABILITIES[cmd.skill];
        if (!sp?.attackSpell || !sk?.sword || !c.abilities.includes(cmd.spell) || !c.abilities.includes(cmd.skill)) return { ok: false, reason: 'bad' };
        if (!weaponOk({ weapon: 'blade' }, c.weaponCat)) return { ok: false, reason: '剣が必要' };
        if (mpCost(c.penChar, cmd.spell) + mpCost(c.penChar, cmd.skill) > c.mp) return { ok: false, reason: 'MPが足りない' };
        return { ok: true };
      }
      case 'item': {
        // 月の鏡・そうびしたまま 使う 道具（battle-ch4.js）
        const special = ch4ItemCheck(this, c, cmd.id);
        if (special) return special;
        const it = ITEMS[cmd.id];
        if (!it || it.type !== 'use' || !it.battle) return { ok: false, reason: '使えない' };
        if (this.hooks.hasItem && !this.hooks.hasItem(c, cmd.id)) return { ok: false, reason: '持っていない' };
        return { ok: true };
      }
      case 'bond':
        if (this.bond < BOND_MAX) return { ok: false, reason: 'きずなゲージが足りない' };
        return { ok: true };
      case 'dual': {
        const o = this.dualOptionsFor(c, null, false, true).find((x) => x.id === cmd.id && x.partner === cmd.partner);
        return o ? { ok: true } : { ok: false, reason: '合体技は出せない' };
      }
      default: return { ok: false, reason: 'bad' };
    }
  }

  // ───────────── こうどうの じっこう ─────────────
  executeNext() {
    const q = this.queue.shift();
    const c = this.get(q.id);
    if (!c || !c.alive || c.fled) {
      if (c) c.queued = false;
      if (q.cmd?.type === 'dual') this.releasePartner(q.cmd.partner);
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
    // 反撃の構えは つぎの 自分の 番で とける
    if (c.stance) {
      c.stance = null;
      ev.lines.push(`${c.name}は、反撃の構えをといた。`);
      ev.upd.push(c);
    }
    if (cmd.type === 'incapacitated') {
      this.doIncapacitated(c, ev);
    } else {
      if (c.side === 'ally') this.allyActs++;
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
          const pool = this.combatants.filter((x) => x.alive && x !== c && !x.fled && !hiddenFrom(c, x));
          cmd = { type: 'attack', target: this.rng.pick(pool)?.id, confused: true };
        }
      }
      if (!confused && cmd.type === 'ai') {
        cmd = c.side === 'enemy' ? decideMonster(this, c) : decideAlly(this, c);
      }
      // 遊び人は ときどき かってに 遊びだす（にげる・合体技の ときは まじめ）
      const goof = !confused && c.side === 'ally' && cmd.type !== 'flee' && cmd.type !== 'dual' ? (JOBS[c.job]?.passive?.goof || 0) : 0;
      if (goof && ABILITIES.js_asobu && this.rng.chance(goof)) {
        ev.name = '遊ぶ';
        ev.goof = true;
        ev.lines.push(`${c.name}は遊んでいる！`);
        this.applyAbility(c, ABILITIES.js_asobu, {}, ev, 1);
      } else this.perform(c, cmd, ev);
      this.resolveCounters(ev);
      this.tickStatus(c, 'blind', ev);
      this.tickStatus(c, 'silence', ev);
    }
    if (ev.postLines) ev.lines.push(...ev.postLines);
    delete ev.postLines;
    // 合体技が 出なかった（混乱した など）: 相手を もとに もどす
    if (q.cmd?.type === 'dual' && !ev.dual) this.releasePartner(q.cmd.partner);
    // てきが うごいたら れんけいは とぎれる
    if (c.side === 'enemy') this.combo = { count: 0, actor: null, element: null, time: -99999 };
    if (q.last || ev.forceLast) {
      c.queued = false;
      c.atb = ev.atbAfter ?? 0;
    }
    if (!ev.upd.includes(c)) ev.upd.push(c);
    ev.upd = [...new Set(ev.upd)].map((x) => (x.id ? pub(x) : x));
    ev.bond = this.bond;
    this.lock = this.pace(450, 380, ev.lines.length, 900) + (ev.extraLock || 0) / this.speed;
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
      ev.name = 'ねむり';
      ev.fx = { type: 'sleep', actor: c.id };
    } else if (c.status.paralyze) {
      const s = c.status.paralyze;
      s.turns--;
      if (s.turns <= 0) {
        delete c.status.paralyze;
        ev.lines.push(`${c.name}の体のしびれが取れた！`);
        ev.atbAfter = 60;
      } else ev.lines.push(`${c.name}は体がしびれて動けない！`);
      ev.name = 'マヒ';
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
    // 敵が みんな 砂の 中に もぐっている（ねらえない。battle-ch4.js）
    if (burrowBlock(this, c, cmd, ev)) return;
    // ためてから 出す 大技（ai.js の decideMonster が big を つける）。天才しせつ管理者が いると ダメージが へる（foreseeCut）
    if (cmd.big && c.side === 'enemy') ev.big = true;
    const cast = (tmpl, t) => tmpl.replaceAll('{a}', c.name).replaceAll('{t}', t ? t.name : '');
    switch (cmd.type) {
      case 'attack': {
        // ふつうの 攻撃も 回数を かぞえる（ひらめきの もと）
        if (c.side === 'ally' && !cmd.confused) {
          this.countUse(c, '@atk');
          const hid = this.rollHirameki(c, '@atk', cmd);
          if (hid) {
            this.doHirameki(c, hid, cmd, ev);
            break;
          }
        }
        ev.name = cmd.confused ? '混乱' : '攻撃';
        // ムチ（グループ）・ブーメラン（全体）
        const reach = cmd.confused || c.side !== 'ally' ? 'enemy' : attackReach(c.weaponCat);
        if (reach !== 'enemy') {
          this.multiAttack(c, cmd, ev, reach);
          break;
        }
        ev.lines.push(`${c.name}の攻撃！`);
        const t = this.resolveTarget(c, 'enemy', cmd.target);
        this.pushCoverMsg(ev);
        if (!t) break;
        ev.fx = { type: 'attack', actor: c.id, targets: [t.id], weapon: c.weaponCat, weaponId: c.weaponId || undefined, side: c.side };
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
      case 'dual': this.performDual(c, cmd, ev); break;
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
        // 使った 回数を かぞえて、ひらめきの チャンス（ふうじられて いない・MP が たりる とき）
        if (c.side === 'ally' && !(isSpell && (c.status.silence || this.noSpells)) && cost <= c.mp) {
          this.countUse(c, cmd.id);
          const hid = this.rollHirameki(c, cmd.id, cmd);
          if (hid) {
            this.doHirameki(c, hid, cmd, ev);
            break;
          }
        }
        ev.lines.push(cast(a.cast || `{a}は${a.name}を使った！`, firstTarget));
        this.pushCoverMsg(ev);
        if (isSpell && this.noSpells) {
          ev.lines.push('しかし呪文の力が、すいこまれてしまった！');
          ev.fx = { type: 'fizzle', actor: c.id };
          break;
        }
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

  // ムチ・ブーメランの ふつうの 攻撃（何体にも あたる。じゅんに ダメージが へる）
  multiAttack(c, cmd, ev, reach) {
    ev.lines.push(reach === 'enemies' ? `${c.name}はブーメランを投げた！` : `${c.name}はムチをふるった！`);
    const plan = this.attackPlan(c, cmd.target);
    if (!plan.length) return;
    ev.fx = { type: 'attack', actor: c.id, targets: plan.map((p) => p.t.id), weapon: c.weaponCat, weaponId: c.weaponId || undefined, side: c.side, reach };
    // 力ため・気合いためは あたる 敵 みんなに のる（ぜんぶ よけられたら のこる）
    const charge = c.charge || 1;
    let used = false;
    for (const { t, mult } of plan) {
      if (!t.alive) continue;
      c.charge = charge;
      this.physHit(c, t, { mult }, ev, 'phys');
      if (charge > 1 && c.charge === 1) used = true;
      if (c.onHit && t.alive) this.tryStatus(c, t, { status: c.onHit.status, chance: c.onHit.chance, turns: [2, 3], quiet: true }, ev, 1);
    }
    c.charge = used ? 1 : charge;
    this.afterDamage(c, ev, 'phys');
  }

  // ふつうの 攻撃で あたる 敵と ダメージの 倍率 [{ t, mult }]（ムチ＝えらんだ 敵の グループ、ブーメラン＝全体）
  attackPlan(c, wanted) {
    const reach = c.side === 'ally' ? attackReach(c.weaponCat) : 'enemy';
    const foes = this.sideOf(c, false).filter((x) => x.alive);
    let list;
    if (reach === 'enemies') list = foes;
    else {
      const t = this.peekTarget(c, 'enemy', wanted);
      list = !t ? [] : reach === 'group' ? this.groupOf(c, t) : [t];
    }
    return list.map((t, i) => ({ t, mult: reach === 'enemy' ? 1 : reachFalloff(c.weaponCat, i) }));
  }

  // t と おなじ グループ（おなじ 種類）の 敵。t が さいしょ、あとは 左から
  groupOf(c, t) {
    const same = this.sideOf(c, false).filter((x) => x.alive && x !== t && x.species && x.species === t.species);
    return [t, ...same];
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
    // 砂に もぐった 敵は ねらえない（battle-ch4.js）
    return this.combatants.filter((x) => x.side === side && !x.fled && !hiddenFrom(c, x));
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
      return this.groupOf(c, t);
    }
    const t = this.resolveTarget(c, 'enemy', cmd.target);
    return t ? [t] : [];
  }

  applyAbility(c, a, cmd, ev, powMult, givenTargets) {
    const eff = a.effect;
    const targets = givenTargets || this.targetsFor(c, a, cmd);
    this.pushCoverMsg(ev);
    ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: targets.map((t) => t.id), side: c.side, element: eff.element };
    if (!targets.length && !['callHelp', 'flee', 'nothing', 'telegraph', 'stance', 'charge', 'bondUp', 'escape', 'goldThrow', 'reviveAll', 'multi', 'mirage', 'burrow'].includes(eff.type)) {
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
            if (eff.dispel && t.alive) this.dispel(t, ev);
          }
        }
        if (eff.atbAfter) ev.atbAfter = eff.atbAfter;
        // 50-50 など: こうげきの あとで ぬすむ
        if (eff.steal && targets[0]) this.trySteal(c, targets[0], ev, eff.steal);
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
          if (eff.debuff && t.alive) this.applyDebuff(c, t, eff.debuff, ev, powMult);
          if (eff.dispel && t.alive) this.dispel(t, ev);
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
        ev.sub = sub.name;
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
        for (const t of targets) this.applyBuff(c, t, eff, ev, powMult);
        if (c.side === 'ally') this.addBond(1);
        break;
      }
      case 'debuff': {
        for (const t of targets) this.applyDebuff(c, t, eff, ev, powMult);
        break;
      }
      case 'status': {
        // also … もう1つの じょうたい いじょう（王の呪い: 毒と マヌーサ）
        for (const t of targets) {
          this.tryStatus(c, t, eff, ev, powMult);
          if (eff.also && t.alive) this.tryStatus(c, t, eff.also, ev, powMult);
        }
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
          // いくつかの こうかの 技（回復＋治す など）の とちゅうでは 言わない（回復は できているので）
          if (!any && targets.length === 1 && !ev.inMulti) ev.lines.push('しかし何も起こらなかった！');
          ev.upd.push(t);
        }
        break;
      }
      case 'charge': {
        c.charge = Math.max(c.charge || 1, eff.mult);
        // 残業: 体をけずって 力を ためる
        if (eff.hpCost && c.hp > 1) {
          const d = Math.min(c.hp - 1, Math.max(1, Math.round(c.maxHp * eff.hpCost)));
          c.hp -= d;
          ev.lines.push(`${c.name}は${d}のダメージを受けた…`);
          ev.upd.push(c);
        }
        break;
      }
      case 'atbSet': {
        // 行動ゲージを かえる（非常ブレーキ＝敵を 止める、鶴の一声＝味方が すぐ 動く）
        // 敵には chance（成功の わりあい）・sub（ゲージを へらす 量）。ボスは 効きにくく、止まりかたも 半分（ゼロには ならない）
        for (const t of targets) {
          if (!t.alive || t.fled) continue;
          // まぼろしの 分身に 当たると 消える（battle-ch4.js）
          if (mirageHit(this, c, t, ev)) continue;
          const foe = t.side !== c.side;
          if (foe && eff.chance !== undefined) {
            const ch = eff.chance * (t.resist?.atb ?? 1) * (t.boss ? 0.5 : 1) * (0.6 + 0.4 * Math.min(1, powMult));
            if (!this.rng.chance(ch)) {
              ev.lines.push(fmtLine(eff.failMsg || 'しかし{t}には効かなかった！', c, t));
              continue;
            }
          }
          let next;
          if (eff.sub !== undefined) next = Math.max(0, (t.atb || 0) - eff.sub * (foe && t.boss ? 0.5 : 1));
          else if (eff.value !== undefined) next = foe && t.boss && eff.value === 0 ? Math.max(0, (t.atb || 0) - 50) : eff.value;
          else next = Math.min(100, (t.atb || 0) + (eff.add || 0));
          if (t === c) ev.atbAfter = next;
          else if (t.side === 'enemy') {
            this.queue = this.queue.filter((q) => q.id !== t.id);
            t.queued = false;
            t.atb = next;
          } else if (!t.ready && !t.queued) t.atb = next;
          ev.lines.push(fmtLine(eff.msg || (t.side === 'enemy' ? '{t}の動きが止まった！' : '{t}はすぐに動けそうだ！'), c, t));
          ev.upd.push(t);
        }
        break;
      }
      case 'overtime': {
        // サービス残業・休日出勤（社ちく）: 自分の HPを けずって、すぐに もう一度 動く（HPは 1より へらない）。
        // HPが 1 なら もう けずれないので、つぎの 番も ふつうに まつ（ただで 何回も 動けない ように）
        const d = Math.min(c.hp - 1, Math.max(1, Math.round(c.maxHp * (eff.hpCost ?? 0.1))));
        if (d > 0) {
          c.hp -= d;
          (ev.results = ev.results || []).push({ id: c.id, dmg: d });
          ev.lines.push(`${c.name}は${d}のダメージを受けた…`);
          ev.lines.push(fmtLine(eff.msg || '{a}は、すぐに次の仕事に取りかかった！', c, c));
          ev.atbAfter = eff.atb ?? 100;
        } else ev.lines.push(`${c.name}は、もうへとへとだ…。少し休まないと動けない。`);
        ev.upd.push(c);
        break;
      }
      case 'destroy': {
        // はかい（はかい神）: 敵を けしさる（たおした ことに なる。経験値も 入る）。
        // ボスと メタルには 効かず、かわりに 大きな ダメージ（bossMult）
        for (const t of targets) {
          if (!t.alive || t.fled) continue;
          if (mirageHit(this, c, t, ev)) continue;
          if (t.boss || t.metal) {
            ev.lines.push(fmtLine(eff.bossMsg || '{t}は、はかいの力にたえた！', c, t));
            this.physHit(c, t, { mult: eff.bossMult || 2 }, ev, 'phys', powMult);
            continue;
          }
          const chance = (eff.chance ?? 0.7) * (t.resist?.destroy ?? 1) * Math.min(1, 0.6 + 0.4 * powMult);
          if (!this.rng.chance(chance)) {
            ev.lines.push(fmtLine(eff.failMsg || 'しかし{t}は、はかいの力をはねかえした！', c, t));
            continue;
          }
          const d = t.hp;
          t.hp = 0;
          ev.lines.push(fmtLine(eff.msg || '{t}は、ちりとなって消えた！', c, t));
          (ev.results = ev.results || []).push({ id: t.id, dmg: d });
          ev.lines.push(...this.kill(t, null, ev));
          ev.upd.push(t);
        }
        this.afterDamage(c, ev, 'phys');
        break;
      }
      case 'scan': {
        // 見える化（天才しせつ管理者）: 敵の 弱点と 効かない 属性が ぜんぶ わかる。
        // results の aff で 画面も おぼえ、図鑑にも のこる（tried）
        const told = new Set();
        for (const t of targets) {
          if (!t.alive || !t.species) continue;
          if (mirageHit(this, c, t, ev)) continue;
          ev.results = ev.results || [];
          for (const el of ELEMENT_ORDER) ev.results.push({ id: t.id, element: el, aff: this.noteTried(t, el), scan: true });
          if (told.has(t.species)) continue;
          told.add(t.species);
          const name = MONSTERS[t.species]?.name || t.name;
          const list = (kind) => ELEMENT_ORDER.filter((el) => affinityOf(t.resist?.[el] ?? 1) === kind).map((el) => ELEMENT_NAMES[el]);
          const weak = list('weak'), none = list('null');
          ev.lines.push(weak.length ? `${name}の弱点は、${weak.join('・')}！` : `${name}には、弱点がない…。`);
          if (none.length) ev.lines.push(`${name}には、${none.join('・')}が効かない！`);
        }
        break;
      }
      case 'banish': {
        // 回送電車・異動命令: 敵を 戦いから おいだす（ボスには 効かない）
        for (const t of targets) {
          if (!t.alive || t.fled) continue;
          if (mirageHit(this, c, t, ev)) continue;
          if (t.boss || !this.rng.chance((eff.chance ?? 0.5) * (t.resist?.banish ?? 1))) {
            ev.lines.push(fmtLine(eff.failMsg || 'しかし{t}には効かなかった！', c, t));
            continue;
          }
          t.fled = true;
          t.alive = false;
          t.queued = false;
          t.ready = false;
          this.queue = this.queue.filter((q) => q.id !== t.id);
          this.fledEnemies.push(t.species);
          ev.lines.push(fmtLine(eff.msg || '{t}はどこかへ行ってしまった！', c, t));
          if (eff.gold && this.hooks.gainGold) {
            const g = this.hooks.gainGold(c, t.species, eff.gold);
            if (g > 0) ev.lines.push(`${g}ゴールドを手に入れた！`);
          }
          ev.upd.push(t);
        }
        break;
      }
      case 'goldThrow': {
        // 銭投げ: お金を 投げて 敵全体に ダメージ（守りは 関係ない）
        const want = Math.round((eff.base || 50) + (c.lv || 1) * (eff.perLv || 10));
        const paid = this.hooks.spendGold ? this.hooks.spendGold(c, want) : 0;
        if (!paid) {
          ev.lines.push('しかしお金が足りない！');
          break;
        }
        ev.lines.push(`${paid}ゴールドを投げつけた！`);
        const each = Math.max(1, Math.round(paid * (eff.mult || 1) * (0.5 + powMult / 2)));
        for (const t of targets) if (t.alive) this.damage(c, t, t.metal ? this.rng.int(0, 1) : each, ev, {});
        this.afterDamage(c, ev, 'phys');
        break;
      }
      case 'steal': {
        if (targets[0]) this.trySteal(c, targets[0], ev, eff.chance ?? 0.6);
        break;
      }
      case 'escape': {
        // 定時ダッシュ: かならず にげられる（にげられない 戦いは だめ）
        if (!this.canFlee) {
          ev.lines.push('しかし逃げられない！');
          break;
        }
        ev.lines.push(`${c.name}たちは逃げ出した！`);
        ev.fx = { type: 'flee' };
        this.pendingEnd = { outcome: 'flee' };
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
      case 'regen': {
        // じわじわ 回復（料理の スープ など）: REGEN_MS ごとに 少しずつ。強い ほうが のこる
        for (const t of targets) {
          if (!t.alive) continue;
          const amt = this.healAmountOf(c, eff, powMult);
          const until = this.time + (eff.dur || 24) * 1000;
          if (!t.regen || t.regen.amt <= amt || t.regen.until < until) t.regen = { amt: Math.max(amt, t.regen?.amt || 0), until: Math.max(until, t.regen?.until || 0) };
          ev.lines.push(`${t.name}は、少しずつ回復する力につつまれた！`);
          ev.upd.push(t);
        }
        break;
      }
      case 'hurt': {
        // 自分たちも 少し ダメージ（炎上）。たおれない（HPは 1より へらない）
        const hurt = [];
        for (const t of targets) {
          if (!t.alive) continue;
          const d = Math.min(t.hp - 1, this.rng.int(eff.base[0], eff.base[1]));
          if (d <= 0) continue;
          t.hp -= d;
          hurt.push(t.name);
          (ev.results = ev.results || []).push({ id: t.id, dmg: d });
          ev.upd.push(t);
        }
        // ことばは 1回（「ソラとミーナも少しやけどした…」）
        if (hurt.length) ev.lines.push((eff.msg || '{t}も少しダメージを受けた…').replaceAll('{a}', c.name).replaceAll('{t}', hurt.join('と')));
        break;
      }
      case 'dispel': {
        // 敵には つよく なる こうかを けす（ツッコミ）、みかたには よわく なる こうかを けす
        for (const t of targets) {
          if (!t.alive) continue;
          if (t.side !== c.side) {
            // まぼろしの 分身なら 消えるだけ
            if (!mirageHit(this, c, t, ev)) this.dispel(t, ev, true);
          } else if (Object.keys(t.debuffs || {}).length) {
            t.debuffs = {};
            ev.lines.push(`${t.name}の弱くなっていた力が元にもどった！`);
            ev.upd.push(t);
          } else if (targets.length === 1) ev.lines.push('しかし何も起こらなかった！');
        }
        break;
      }
      case 'multi': {
        // いくつかの こうかを じゅんに（スタミナ料理＝回復＋攻撃力アップ など）。parts の target が ちがう ときは その あいて
        const hit = new Set(targets.map((t) => t.id));
        const outer = ev.inMulti;
        ev.inMulti = true;
        for (const part of eff.parts || []) {
          const ab = { ...a, effect: part, target: part.target || a.target };
          const ts = part.target && part.target !== a.target ? this.targetsFor(c, ab, cmd) : targets.filter((t) => t.alive || ['revive', 'reviveAll'].includes(part.type));
          if (!ts.length && !['bondUp', 'charge', 'goldThrow'].includes(part.type)) continue;
          this.applyAbility(c, ab, cmd, ev, powMult, ts);
          for (const t of ts) hit.add(t.id);
        }
        if (outer) ev.inMulti = outer;
        else delete ev.inMulti;
        ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [...hit], side: c.side, element: eff.parts?.[0]?.element };
        break;
      }
      case 'allMp': {
        // マダンテ: のこりの MPを ぜんぶ つかって、敵 みんなに 大きな ダメージ（守りも 属性も 関係ない）
        // paid … となえる ときに 先に はらった MP（それも 力に なる）
        const used = c.mp + (eff.paid || 0);
        c.mp = 0;
        ev.upd.push(c);
        if (used < (eff.min || 1)) {
          ev.lines.push('しかしMPが足りず、何も起こらなかった…');
          break;
        }
        ev.lines.push(`${c.name}は、のこりのMPを全て解き放った！`);
        for (const t of targets) {
          if (!t.alive) continue;
          const d = Math.max(1, Math.round(used * (eff.mult || 3) * Math.min(1.2, powMult) * this.rng.float(0.95, 1.05) * (t.metal ? 0 : 1)));
          this.damage(c, t, t.metal ? this.rng.int(0, 1) : d, ev, { element: eff.element });
        }
        this.afterDamage(c, ev, eff.element);
        break;
      }
      case 'gather': {
        // ミナデイン: 生きている 仲間から MPを 少しずつ 集めて、1体に 大きな 雷（集まった 人数ぶん 強く なる）
        let count = 0;
        for (const x of this.sideOf(c, true)) {
          if (!x.alive || x === c || x.mp < (eff.take || 10)) continue;
          x.mp -= eff.take || 10;
          count++;
          ev.upd.push(x);
        }
        if (count) ev.lines.push(`仲間${count}人の力が集まった！`);
        const more = (eff.per || 0) * count;
        const boosted = { ...eff, type: 'magic', base: [eff.base[0] + more, eff.base[1] + more] };
        for (const t of targets) this.magicHit(c, t, boosted, ev, powMult);
        this.afterDamage(c, ev, eff.element);
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
        if (mirageHit(this, c, t, ev)) break;
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
      case 'stance': {
        // 反撃の構え: つぎの 自分の 番まで、物理で こうげきして きた 相手に やりかえす（resolveCounters）
        c.stance = { kind: eff.stance || 'counter', mult: eff.mult ?? 1.3, ignoreDef: eff.ignoreDef || 0 };
        ev.fx = { type: 'stance', actor: c.id, stance: c.stance.kind };
        ev.warn = true;
        ev.lines.push('（今なぐりかかると、反撃されそうだ…！）');
        // このターンの のこりの こうどうは とりやめ（構えて まつ。みんなが 作戦を かえる じかん）
        this.queue = this.queue.filter((q) => q.id !== c.id);
        ev.forceLast = true;
        ev.atbAfter = 0;
        ev.upd.push(c);
        break;
      }
      case 'reviveAll': {
        // よみがえりの呪文（ミイラの王アンク）: たおれた なかまの 魔物（species）が みんな 生き返る
        const back = this.sideOf(c, true).filter((x) => !x.alive && !x.fled && x !== c && (!eff.species || x.species === eff.species));
        if (!back.length) {
          ev.lines.push('しかし、何も起こらなかった…。');
          break;
        }
        for (const t of back) {
          Object.assign(t, { alive: true, hp: Math.max(1, Math.round(t.maxHp * (eff.hpRatio ?? 1))), status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null, stance: null, chant: null });
          t.atb = this.rng.float(0, 30);
          // 経験値は 1回 たおした ぶんだけ（生き返った ぶんは かぞえなおす）
          const k = this.killed.lastIndexOf(t.species);
          if (k >= 0) this.killed.splice(k, 1);
          ev.upd.push(t);
        }
        ev.fx = { type: 'ability', anim: 'revive', actor: c.id, targets: back.map((t) => t.id), side: c.side, revive: true };
        ev.lines.push(`${back.map((t) => t.name).join('と')}が生き返った！`);
        break;
      }
      case 'mirage': {
        // まぼろしを 作りなおす（分身が もどり、ならびが いれかわる。battle-ch4.js）
        mirageRemake(this, c, ev);
        break;
      }
      // 砂に もぐる（つぎの 番まで ねらえない。battle-ch4.js）
      case 'burrow': burrowStart(this, c, eff, ev); break;
      case 'telegraph': {
        c.telegraph = eff.next;
        ev.fx = { type: 'telegraph', actor: c.id };
        ev.warn = true;
        // となえる 呪文（よみがえりの呪文）: つぎの 番までに 最大HPの eff.chant ぶんの ダメージで とぎれる（damage）
        if (eff.chant) {
          c.chant = { need: Math.max(1, Math.round(c.maxHp * eff.chant)), dmg: 0 };
          ev.fx.chant = true;
          ev.lines.push(`（${c.name}に大きなダメージをあたえれば、呪文を止められそうだ…！）`);
          ev.upd.push(c);
        }
        // このターンの のこりの こうどうは とりやめ（みんなが そなえる じかんを つくる）。
        // windup … つぎの 番までの ゲージを その ぶん ながく する（となえる 呪文を 止める じかん）
        this.queue = this.queue.filter((q) => q.id !== c.id);
        ev.forceLast = true;
        ev.atbAfter = -(eff.windup || 0);
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

  // ぬすむ（1体に つき 1回）
  trySteal(c, t, ev, chance = 0.6) {
    if (!t?.alive || t.side !== 'enemy') return;
    if (mirageHit(this, c, t, ev)) return;
    if (t.stolen) {
      ev.lines.push(`${t.name}はもう何も持っていない。`);
      return;
    }
    const got = this.rng.chance(chance) && this.hooks.steal ? this.hooks.steal(c, t.species) : null;
    if (got) {
      t.stolen = true;
      ev.lines.push(`${c.name}は${got}をぬすんだ！`);
    } else ev.lines.push('しかし何もぬすめなかった！');
  }

  // ───────────── ダメージ計算 ─────────────
  physHit(c, t, eff, ev, element, powMult = 1) {
    if (!t.alive) return 0;
    // まぼろしの 分身は 当たると 消える（battle-ch4.js）
    if (mirageHit(this, c, t, ev)) return 0;
    this.noteCounter(c, t, ev);
    const res = this.calcPhys(c, t, eff, powMult, element);
    ev.fx = ev.fx || { type: 'attack', actor: c.id, targets: [t.id], side: c.side };
    if (res.miss) {
      ev.lines.push(t.side === 'enemy' ? `ミス！${t.name}は素早く身をかわした！` : `${t.name}はひらりと身をかわした！`);
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, miss: true });
      return 0;
    }
    if (res.crit) ev.lines.push(c.side === 'ally' ? '会心の一撃！' : 'つうこんの一撃！');
    this.damage(c, t, res.dmg, ev, { crit: res.crit, element, nonLethal: eff.nonLethal });
    if (eff.forceCrit !== undefined || res.crit) { /* noop */ }
    return res.dmg;
  }

  // 反撃の構えの 相手を 物理で こうげきした（あたっても はずれても。1回の こうどうに 1回だけ やりかえされる）
  noteCounter(c, t, ev) {
    if (t.stance?.kind !== 'counter' || t.side === c.side) return;
    ev.counters = ev.counters || [];
    if (!ev.counters.some((k) => k.by === t.id && k.on === c.id)) ev.counters.push({ by: t.id, on: c.id });
  }

  // 反撃: こうどうの あとで まとめて やりかえす（ねむり・マヒの 間は できない）
  resolveCounters(ev) {
    const list = ev.counters;
    delete ev.counters;
    for (const { by, on } of list || []) {
      const t = this.get(by), a = this.get(on);
      if (!t?.alive || t.stance?.kind !== 'counter' || !a?.alive || t.status.sleep || t.status.paralyze) continue;
      ev.lines.push(`${t.name}の反撃！`);
      ev.counter = (ev.counter || []).concat({ actor: t.id, target: a.id });
      const res = this.calcPhys(t, a, { mult: t.stance.mult, ignoreDef: t.stance.ignoreDef });
      if (res.miss) {
        ev.lines.push(`${a.name}はひらりと身をかわした！`);
        ev.results = ev.results || [];
        ev.results.push({ id: a.id, miss: true });
        continue;
      }
      if (res.crit) ev.lines.push('つうこんの一撃！');
      this.damage(t, a, res.dmg, ev, { crit: res.crit, element: 'phys' });
    }
  }

  calcPhys(c, t, eff, powMult = 1, element = 'phys', estimate = false) {
    const acc = (eff.acc ?? 1) * (c.status.blind ? 0.4 : 1);
    const eva = (t.buffs.eva?.add || 0) + (t.flying ? 0.04 : 0) + clamp((effAgi(t) - effAgi(c)) / 500, 0, 0.1);
    const hit = clamp(0.97 * acc - eva, 0.05, 0.99);
    if (!estimate && !this.rng.chance(hit)) return { miss: true, dmg: 0 };
    let critChance = (c.side === 'enemy' ? 1 / 64 : (c.job === 'monk' ? 1 / 14 : 1 / 28)) + (eff.critBonus || 0);
    const crit = !estimate && (eff.forceCrit || this.rng.chance(critChance));
    // atkFrom: 'def' … 攻撃力と 守備力の まんなかで なぐる（ガーディアンの ようさいの一撃 など。守りが かたいほど 強い）
    const base0 = eff.atkFrom === 'def' ? (effAtk(c) + effDfn(c)) / 2 : effAtk(c);
    // HPが 少ないほど 強い（社ちく。gritMult）
    const atk = base0 * (c.charge && c.charge > 1 ? c.charge : 1) * gritMult(c);
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
    // stat: 'heal' … 回復魔力で 強く なる 光の 技（大神官の ホーリーライト など。いやし手の 攻撃）
    // 魔力は バフ・デバフ（魔力が 上がる 技）も かかる
    const pow = eff.stat === 'heal' ? (c.healPow || 0) : effMag(c);
    const scale = 1 + clamp((pow - (eff.thr ?? 20)) / 150, 0, eff.scaleCap ?? 1);
    let dmg = base * scale * powMult * enemyFixedScale(c) * gritMult(c);
    const r = eff.element ? (t.resist[eff.element] ?? 1) : 1;
    dmg *= r;
    if (t.defending) dmg *= 0.75;
    if (eff.breath && t.buffs.breath) dmg *= 0.5;
    if (!estimate) dmg *= this.comboMult(c);
    return { dmg: Math.max(0, Math.round(dmg)), resisted: r === 0 };
  }

  magicHit(c, t, eff, ev, powMult) {
    if (!t.alive) return 0;
    if (mirageHit(this, c, t, ev)) return 0;
    const res = this.calcMagic(c, t, eff, powMult);
    if (res.resisted || res.dmg === 0) {
      ev.lines.push(t.side === 'enemy' ? `しかし${t.name}には効かなかった！` : `${t.name}はダメージを受けない！`);
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, miss: true, element: eff.element, aff: this.noteTried(t, eff.element) || undefined });
      return 0;
    }
    this.damage(c, t, res.dmg, ev, { element: eff.element });
    return res.dmg;
  }

  damage(c, t, dmg, ev, info = {}) {
    ev.results = ev.results || [];
    if (mirageHit(this, c, t, ev)) return;
    // 天才しせつ管理者の 予兆保全: 敵の 大技の ダメージが 小さく なる（jobs.js の passive.foresee）
    if (ev.big && c.side === 'enemy' && t.side === 'ally' && dmg > 0) dmg = this.foreseeCut(dmg, ev);
    // 峰打ち: たおさずに HP を 1 のこす
    if (info.nonLethal && dmg >= t.hp) {
      dmg = Math.max(0, t.hp - 1);
      if (dmg <= 0) {
        ev.lines.push(`${c.name}は手かげんした。`);
        ev.results.push({ id: t.id, dmg: 0 });
        return;
      }
    }
    if (dmg <= 0) {
      ev.lines.push(t.side === 'enemy' ? `ミス！${t.name}にダメージをあたえられない！` : `ミス！${t.name}はダメージを受けない！`);
      ev.results.push({ id: t.id, dmg: 0 });
      return;
    }
    t.hp = Math.max(0, t.hp - dmg);
    if (t.shade) mirageSync(this, t);
    ev.lines.push(t.side === 'enemy' ? `${t.name}に${dmg}のダメージ！` : `${t.name}は${dmg}のダメージを受けた！`);
    // 属性の 効きぐあい（敵だけ。ためした 属性は 図鑑に のこる）
    const aff = this.noteTried(t, info.element);
    if (aff === 'weak') ev.lines.push('弱点をついた！');
    else if (aff === 'resist') ev.lines.push(`${t.name}には、あまり効いていない…`);
    ev.results.push({ id: t.id, dmg, crit: !!info.crit, element: info.element, aff: aff || undefined });
    ev.upd.push(t);
    ev.dealt = (ev.dealt || 0) + dmg;
    ev.lastTarget = t;
    if (t.side === 'ally' && dmg >= t.maxHp * 0.05) this.addBond(1);
    // 呪文を となえて いる 敵（よみがえりの呪文）: ダメージが たまると とぎれる
    if (t.chant && t.hp > 0) {
      t.chant.dmg += dmg;
      if (t.chant.dmg >= t.chant.need) {
        t.chant = null;
        t.telegraph = null;
        ev.lines.push(`${t.name}の呪文がとぎれた！`);
        ev.chantBreak = t.id;
      }
    }
    // ねむりは ダメージで おきることがある
    if (t.status.sleep && t.hp > 0 && this.rng.chance(0.5)) {
      delete t.status.sleep;
      ev.lines.push(`${t.name}は目を覚ました！`);
    }
    if (t.hp <= 0) ev.lines.push(...this.kill(t, info.element, ev));
    else if (t.boss) this.checkPhase(t, ev);
  }

  // 大技の 予兆を 見ぬく 仲間（天才しせつ管理者）が 戦っていれば、ダメージを へらす（ことばは 1回の こうどうで 1回）
  foreseeCut(dmg, ev) {
    const g = this.allies.find((x) => x.alive && JOBS[x.job]?.passive?.foresee);
    if (!g) return dmg;
    if (!ev.foreseen) {
      ev.foreseen = true;
      ev.lines.push(`${g.name}は、大技の予兆を見ぬいていた！`);
    }
    return Math.max(1, Math.round(dmg * JOBS[g.job].passive.foresee));
  }

  // 敵に 属性の 技を あてた: 効きぐあいを かえす（weak / resist / null / normal）
  noteTried(t, element) {
    if (t.side !== 'enemy' || !element || element === 'phys' || !t.species) return null;
    this.tried.add(`${t.species}|${element}`);
    return affinityOf(t.resist?.[element] ?? 1);
  }

  // element … とどめの 属性（ミイラ兵は 炎・光で とどめを さされると 起き上がれない）
  // ev … その こうどうの イベント（ボスと いっしょに くずれおちる 手下も ev.upd に のせる）
  kill(t, element = null, ev = null) {
    // まぼろしの 分身は 消えるだけ（たおした ことに ならない。battle-ch4.js）
    const vanished = mirageVanish(this, t, ev);
    if (vanished) return vanished;
    // 1回だけ 起き上がる 魔物（ミイラ兵。monsters の revive）
    const rv = t.side === 'enemy' && !t.revived ? MONSTERS[t.species]?.revive : null;
    if (rv && !(rv.not || []).includes(element)) {
      t.revived = true;
      t.hp = Math.max(1, Math.round(t.maxHp * (rv.hp ?? 0.5)));
      t.status = {};
      return [`${t.name}を倒した…と思ったら、ほうたいをまき直して起き上がった！`];
    }
    const blocked = rv && (rv.not || []).includes(element) ? [`${t.name}のほうたいが、${element === 'fire' ? 'もえつきた' : 'くずれさった'}！`] : [];
    t.alive = false;
    t.hp = 0;
    t.ready = false;
    t.queued = false;
    t.status = {};
    t.buffs = {};
    t.debuffs = {};
    t.cover = null;
    t.telegraph = null;
    t.stance = null;
    t.chant = null;
    t.regen = null;
    for (const q of this.queue) if (q.id === t.id && q.cmd?.type === 'dual') this.releasePartner(q.cmd.partner);
    this.queue = this.queue.filter((q) => q.id !== t.id);
    for (const inv of [...this.invites.values()]) if (inv.from === t.id || inv.to === t.id) this.endInvite(inv, '倒れた');
    if (t.side === 'enemy') {
      this.killed.push(t.species);
      const out = [...blocked, `${t.name}を倒した！`];
      // ボスの 力で うごいていた 手下は、ボスが たおれると いっしょに くずれおちる（ミイラの王アンクと 王のミイラ兵。monsters の minionsFall）
      const fall = MONSTERS[t.species]?.minionsFall;
      const minions = fall ? this.enemies.filter((m) => m.alive && m !== t && fall.includes(m.species)) : [];
      for (const m of minions) {
        this.kill(m);
        if (ev) ev.upd.push(m);
      }
      if (minions.length) out.push(MONSTERS[t.species].fallMsg || '手下の魔物たちも、くずれおちた！');
      // 本物が たおれると、まぼろしの 分身も 消える
      out.push(...mirageDown(this, t, ev));
      return out;
    }
    this.addBond(5);
    return [`${t.name}は死んでしまった！`];
  }

  heal(c, t, eff, ev, powMult) {
    if (!t.alive) return;
    const [mn, mx] = eff.base;
    let amt = this.rng.int(mn, mx);
    if (!eff.fixed) amt *= 1 + clamp(((c.healPow || 0) - (eff.thr ?? 20)) / 150, 0, eff.scaleCap ?? 1);
    amt = Math.round(amt * powMult * enemyFixedScale(c));
    const real = Math.min(t.maxHp - t.hp, amt);
    t.hp += real;
    ev.results = ev.results || [];
    ev.results.push({ id: t.id, heal: real });
    ev.upd.push(t);
    if (t.hp >= t.maxHp) ev.lines.push(`${t.name}のキズがすっかり回復した！`);
    else ev.lines.push(`${t.name}のHPが${real}回復した！`);
    if (c.side === 'ally' && t !== c && real > 0) this.addBond(2);
  }

  // つよく する こうか（バイキルト・スクルト など）
  // 本職で ない 技（転職ペナルティ）で 使うと、上がりかたも へる（基本職の 補助技が いつまでも いちばん 強く ならない ように）
  applyBuff(c, t, eff, ev, powMult = 1) {
    if (!t.alive) return;
    const k = Math.min(1, powMult);
    const dur = (eff.dur || 30) * 1000 * (0.5 + powMult / 2);
    const stats = eff.stats || [eff.stat];
    const mult = eff.mult >= 1 ? 1 + (eff.mult - 1) * k : eff.mult;
    // 2回目は さらに 上がる（2だんかいまで。stackBuff）
    let top = 0, maxed = true;
    for (const st of stats) {
      if (st === 'eva') {
        const lv = Math.min(BUFF_STACK, (t.buffs.eva?.lv || 0) + 1);
        if (!(t.buffs.eva?.lv >= BUFF_STACK)) maxed = false;
        t.buffs.eva = { add: Math.min(0.6, (eff.add || 0) * k * lv), lv, until: Math.max(t.buffs.eva?.until || 0, this.time + dur) };
        top = Math.max(top, lv);
      } else {
        const r = stackBuff(t.buffs, st, mult, this.time + dur);
        if (!r.max) maxed = false;
        top = Math.max(top, r.lv);
      }
    }
    const names = stats.map(statLabel).join('と');
    ev.lines.push(maxed ? `${t.name}の${names}は、もうこれ以上上がらない！` : top >= 2 ? `${t.name}の${names}がさらに上がった！` : `${t.name}の${names}が上がった！`);
    ev.upd.push(t);
  }

  // 敵の つよく なる こうかを けす（ツッコミ など）: バフと 力ため。前ぶれ・構え・呪文は けさない
  dispel(t, ev, loud = false) {
    const had = Object.keys(t.buffs || {}).length > 0 || t.charge > 1;
    if (!had) {
      if (loud) ev.lines.push(`しかし${t.name}には、消す力がなかった！`);
      return false;
    }
    t.buffs = {};
    t.charge = 1;
    ev.lines.push(`${t.name}の強くなっていた力が消えた！`);
    ev.upd.push(t);
    return true;
  }

  // じわじわ 回復の 1回ぶん（heal と おなじ 式）
  healAmountOf(c, eff, powMult = 1) {
    const [mn, mx] = eff.base || [5, 8];
    let amt = this.rng.int(mn, mx);
    if (!eff.fixed) amt *= 1 + clamp(((c.healPow || 0) - (eff.thr ?? 20)) / 150, 0, eff.scaleCap ?? 1);
    return Math.max(1, Math.round(amt * powMult * enemyFixedScale(c)));
  }

  applyDebuff(c, t, d, ev, powMult = 1) {
    if (!t.alive) return;
    if (mirageHit(this, c, t, ev)) return;
    const r = t.resist.debuff ?? 1;
    const chance = (d.chance ?? 0.9) * r * (0.6 + 0.4 * powMult) * (t.boss ? 0.7 : 1);
    if (!this.rng.chance(chance)) {
      ev.lines.push(`しかし${t.name}には効かなかった！`);
      return;
    }
    // 2回目は さらに 下がる（2だんかいまで。stackBuff）
    const sb = stackBuff(t.debuffs, d.stat, d.mult, this.time + (d.dur || 30) * 1000);
    ev.lines.push(sb.max ? `${t.name}の${statLabel(d.stat)}は、もうこれ以上下がらない！` : sb.lv >= 2 ? `${t.name}の${statLabel(d.stat)}がさらに下がった！` : `${t.name}の${statLabel(d.stat)}が下がった！`);
    ev.upd.push(t);
  }

  tryStatus(c, t, eff, ev, powMult = 1) {
    if (!t.alive) return false;
    if (mirageHit(this, c, t, ev)) return false;
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
    if (n >= 2) {
      ev.combo = n;
      ev.lines.splice(1, 0, `れんけい${n}！`);
      this.addBond(Math.min(4, n));
    }
    this.combo = { count: n, actor: c.id, element: element || 'phys', time: this.time };
  }

  addBond(n) {
    const add = n > 0 ? n * BOND_GAIN : n;
    this.bond = Math.max(0, Math.min(BOND_MAX, Math.round((this.bond + add) * 100) / 100));
  }

  // ───────────── ひらめき ─────────────
  // 技（ふつうの 攻撃は '@atk'）を 使った 回数
  countUse(c, key) {
    if (c.side !== 'ally' || !c.use || !key) return;
    c.use[key] = (c.use[key] || 0) + 1;
  }

  // 使った 技で ひらめくか（ひらめいたら その 技の id）
  rollHirameki(c, key, cmd) {
    if (c.side !== 'ally' || !c.use || c.mon || !c.penChar?.job) return null;
    for (const [id, h] of Object.entries(HIRAMEKI)) {
      if (!(key in h.from) || c.abilities.includes(id)) continue;
      const a = ABILITIES[id];
      if (!a || !hiraAllowed(c.penChar, id)) continue;
      if (a.weapon && !weaponOk(a, c.weaponCat)) continue;
      if ((a.kind === 'spell' || a.spellLike) && (c.status.silence || this.noSpells)) continue;
      if (a.effect.type === 'mahouken' && this.noSpells) continue;
      if (a.effect.type !== 'mahouken' && !this.hiraTargets(c, a, cmd)) continue;
      const chance = hiraChance(hiraRatio(c.use, h.from));
      if (chance > 0 && this.rng.chance(chance)) return id;
    }
    return null;
  }

  // ひらめいた 技の 相手（もとの 技の 相手が つかえれば そのまま）
  hiraTargets(c, a, cmd) {
    const t0 = cmd?.target ? this.get(cmd.target) : null;
    switch (a.target) {
      case 'enemy': case 'group': {
        const t = t0 && t0.side !== c.side && t0.alive && !t0.fled ? t0 : this.rng.pick(this.sideOf(c, false).filter((x) => x.alive));
        return t ? { target: t.id } : null;
      }
      case 'ally': {
        const t = t0 && t0.side === c.side && t0.alive ? t0 : this.sideOf(c, true).filter((x) => x.alive).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
        return t ? { target: t.id } : null;
      }
      case 'deadAlly': {
        const t = this.sideOf(c, true).find((x) => !x.alive);
        return t ? { target: t.id } : null;
      }
      default: return {};
    }
  }

  // ひらめいた 技を その場で 出す（はじめの 1回は MP いらず）。覚えて、たたかいの あとも 使える
  doHirameki(c, id, cmd, ev) {
    const a = ABILITIES[id];
    c.abilities = [...c.abilities, id];
    c.hiraNew = [...(c.hiraNew || []), id];
    ev.hirameki = { id, name: a.name, actor: c.id };
    ev.name = a.name;
    ev.ability = id;
    ev.lines.push(`${c.name}はひらめいた！`);
    ev.extraLock = 900;
    this.addBond(3);
    if (a.effect.type === 'mahouken') {
      const spell = ['merazoma', 'merami', 'mera', 'hyadaruko', 'hyado', 'gira', 'io', 'bagi'].find((x) => c.abilities.includes(x)) || 'mera';
      const skill = ['daichi', 'kaiha', 'kuuretsu', 'kabutowari'].find((x) => c.abilities.includes(x)) || 'daichi';
      const tc = this.hiraTargets(c, { target: 'enemy' }, cmd) || {};
      this.doMahouken(c, { spell, skill, target: tc.target }, ev, true);
      return;
    }
    const tc = this.hiraTargets(c, a, cmd) || {};
    const targets = this.targetsFor(c, a, tc);
    ev.lines.push(fmtLine(a.cast || `{a}の${a.name}！`, c, targets[0]));
    this.applyAbility(c, a, tc, ev, 1, targets);
  }

  // ───────────── 合体技 ─────────────
  // c が 今 出せる 合体技（exec: 出す しゅんかんの たしかめ。よやくした 相手も かぞえる）
  // anyGauge: 仲間の ゲージが まだでも よやく できる ものも かぞえる
  dualOptionsFor(c, others = null, exec = false, anyGauge = false) {
    if (!c || c.side !== 'ally' || c.mon) return [];
    const list = (others || this.allies.filter((x) => x !== c)).filter((x) => x.side === 'ally' && !x.mon);
    const info = (x) => ({
      id: x.id, name: x.name, alive: x.alive, abilities: x.abilities || [], mp: x.mp, atb: x.atb, ready: x.ready,
      queued: exec && x.dualWith === c.id ? false : !!x.queued,
      // ほかの 人の 合体技に 入る ことに なっている
      busy: !!x.dualWith && x.dualWith !== c.id,
      inviting: !exec && x !== c && !!(x.inviting || x.invited),
      // ほかの 人の 合体技を まっている・まって もらって いる
      waiting: x !== c && (!!x.waitDual || (!!x.dualTarget && x.dualTarget !== c.id)),
      // 呪文が ふうじられた 場所では、呪文の 合体技は 出せない（マホトーンと おなじ）
      statuses: [...Object.keys(x.status || {}), ...(this.noSpells ? ['silence'] : [])], weaponCat: x.weaponCat,
      usable: (id) => {
        const a = ABILITIES[id];
        return !!a && (a.kind !== 'combo' || comboAllowed(x.penChar, id)) && weaponOk(a, x.weaponCat);
      },
    });
    return dualOptions(info(c), list.map(info), weaponOk, { anyGauge });
  }

  // 合体技を はじめる（相手が 家族なら さそう。AI・自分の 仲間なら すぐ）
  // 相手の ゲージが まだ たまって いなければ「よやく」して まつ（たまった しゅんかんに 出す）
  startDual(c, cmd) {
    const p = this.get(cmd.partner);
    if (!partnerNow(p)) return this.waitForPartner(c, cmd);
    const ask = p.controller && !p.auto && p.controller !== c.controller;
    if (!ask) {
      this.reserveDual(c, p, cmd);
      return { ok: true };
    }
    const inv = { id: 'd' + (++this.inviteSeq), from: c.id, to: p.id, tech: cmd.id, target: cmd.target, remaining: DUAL_ASK_MS };
    this.invites.set(inv.id, inv);
    c.inviting = inv.id;
    p.invited = inv.id;
    this.emit({ t: 'dualInvite', invite: inv.id, from: c.id, to: p.id, tech: cmd.id, fromName: c.name, toName: p.name, ms: DUAL_ASK_MS });
    return { ok: true, pending: true };
  }

  // よやく: 自分の 番を とっておき、仲間の ゲージが たまったら いっしょに 出す
  waitForPartner(c, cmd) {
    const p = this.get(cmd.partner);
    c.ready = false;
    c.waitDual = { id: cmd.id, partner: p.id, target: cmd.target };
    p.dualTarget = c.id;
    const t = DUAL_TECHS[cmd.id];
    this.emit({ t: 'dualWait', id: c.id, partner: p.id, tech: cmd.id, lines: [`${c.name}は${p.name}と「${t?.name || '合体技'}」を出すため、力をためている！`] });
    return { ok: true, waiting: true };
  }

  // まっている 人を しらべる（仲間が 出られなく なった・出せなく なった・もう 番が 来ている）
  checkWaits() {
    for (const c of this.allies) {
      const w = c.waitDual;
      if (!w) continue;
      const p = this.get(w.partner);
      if (!this.waitStillOk(c, p)) continue;
      // 仲間が もう 自分の 番で コマンドを えらんでいる（ゲージが たまっている）
      if (p.ready && !p.queued) this.fireWait(c, p);
    }
  }

  // よやくが まだ 出せるか（だめなら よやくを 終わりに して false）
  waitStillOk(c, p) {
    if (!c.alive) {
      this.endWait(c, null, false);
      return false;
    }
    const st = p?.status || {};
    if (!p || !p.alive || st.sleep || st.paralyze || st.confuse) {
      this.endWait(c, `${p?.name || '仲間'}は合体技に参加できなくなった…`);
      return false;
    }
    if (!this.dualOptionsFor(c, [p], true, true).some((o) => o.id === c.waitDual.id)) {
      this.endWait(c, '合体技は出せなくなった…');
      return false;
    }
    return true;
  }

  // よやくした 合体技を 出す（相手の ゲージが たまった とき）。相手の 番を 使ったら true
  fireWait(c, p) {
    const w = c?.waitDual;
    if (!w || w.partner !== p.id || !this.waitStillOk(c, p)) return false;
    c.waitDual = null;
    p.dualTarget = null;
    c.ready = true;
    const r = this.startDual(c, { type: 'dual', id: w.id, partner: p.id, target: w.target });
    // 家族に「参加する？」と 聞いている ときは、相手の 番は ふつうに 来る（参加すると その 番を 使う）
    return !!r?.ok && !r.pending && !r.waiting;
  }

  // よやくを おわりに して、自分の 番に もどす
  endWait(c, msg, back = true) {
    const w = c.waitDual;
    c.waitDual = null;
    const p = w && this.get(w.partner);
    if (p && p.dualTarget === c.id) p.dualTarget = null;
    this.emit({ t: 'dualWaitEnd', id: c.id, lines: msg ? [msg] : [] });
    if (back && c.alive) this.onReady(c);
  }

  // 2人の 番を おさえて、合体技を 出す じゅんばんに ならべる
  reserveDual(c, p, cmd) {
    if (p.ready) {
      p.ready = false;
      this.emit({ t: 'queued', id: p.id });
    }
    p.queued = true;
    p.dualWith = c.id;
    c.inviting = null;
    this.enqueue(c, { type: 'dual', id: cmd.id, partner: p.id, target: cmd.target });
    this.emit({ t: 'queued', id: c.id, dual: cmd.id, partner: p.id });
  }

  // 合体技の 相手を もとに もどす（出せなかった とき）
  releasePartner(pid) {
    const p = this.get(pid);
    if (!p || !p.dualWith) return;
    p.dualWith = null;
    p.queued = false;
  }

  // さそわれた 家族の こたえ
  answerDual(pid, cmd) {
    const inv = this.invites.get(cmd.invite);
    if (!inv || inv.to !== pid) return { ok: false, reason: 'もう終わっている' };
    if (!cmd.ok) {
      this.endInvite(inv, 'ことわった');
      return { ok: true };
    }
    const c = this.get(inv.from), p = this.get(inv.to);
    this.invites.delete(inv.id);
    if (p) p.invited = null;
    const ok = c && c.alive && c.ready && this.dualOptionsFor(c, [p]).some((o) => o.id === inv.tech);
    if (!ok) {
      if (c) c.inviting = null;
      this.emit({ t: 'dualAnswer', invite: inv.id, ok: false, from: inv.from, to: inv.to, reason: '出せなくなった' });
      return { ok: true };
    }
    this.emit({ t: 'dualAnswer', invite: inv.id, ok: true, from: c.id, to: p.id });
    this.reserveDual(c, p, { id: inv.tech, target: inv.target });
    return { ok: true };
  }

  // さそいを おわりに する（ことわった・時間切れ・やめた）
  endInvite(inv, reason) {
    this.invites.delete(inv.id);
    const c = this.get(inv.from), p = this.get(inv.to);
    if (c && c.inviting === inv.id) c.inviting = null;
    if (p && p.invited === inv.id) p.invited = null;
    this.emit({ t: 'dualAnswer', invite: inv.id, ok: false, from: inv.from, to: inv.to, reason });
    // オートの 人は ふつうに 動く
    if (c && c.alive && c.ready && (!c.controller || c.auto)) {
      c.ready = false;
      this.onReady(c);
    } else if (c && c.alive && c.ready) this.emit({ t: 'ready', id: c.id });
  }

  // 合体技を 出す（2人の 強さを 合わせる）
  performDual(c, cmd, ev) {
    const t = DUAL_TECHS[cmd.id];
    const p = this.get(cmd.partner);
    ev.name = t?.name || '合体技';
    if (!t || !p || !p.alive || p.status.sleep || p.status.paralyze || p.status.confuse) {
      ev.lines.push(`しかし${p?.name || '仲間'}は合体技に参加できなかった！`);
      this.releasePartner(cmd.partner);
      return;
    }
    const opt = this.dualOptionsFor(c, [p], true).find((o) => o.id === cmd.id);
    if (!opt) {
      ev.lines.push('しかし合体技は出せなかった！');
      this.releasePartner(p.id);
      return;
    }
    c.mp -= opt.mp[0];
    p.mp -= opt.mp[1];
    ev.dual = { id: cmd.id, name: t.name, a: c.id, b: p.id };
    ev.lines.push(`${c.name}と${p.name}の合体技！`, `${t.name}！`);
    // 2人の 力を 合わせた かげ（強さだけ 合わせて、あとは c の まま。dualProxy）
    const proxy = dualProxy(c, p);
    const hit = new Set();
    for (const part of t.parts) {
      const eff = dualPartEffect(t, part, opt.skills);
      if (eff.elementFrom !== undefined) {
        eff.element = opt.element || undefined;
        delete eff.elementFrom;
      }
      const ab = { name: t.name, effect: eff, target: part.target || t.target, anim: t.anim };
      const targets = this.targetsFor(proxy, ab, cmd);
      this.applyAbility(proxy, ab, cmd, ev, 1, targets);
      for (const x of targets) hit.add(x.id);
    }
    ev.upd = ev.upd.map((x) => (x === proxy ? c : x));
    ev.fx = { type: 'dual', anim: t.anim, actor: c.id, partner: p.id, targets: [...hit], side: 'ally', element: opt.element || t.element };
    ev.extraLock = (ev.extraLock || 0) + 700;
    p.atb = 0;
    p.ready = false;
    this.releasePartner(p.id);
    ev.upd.push(c, p);
    this.addBond(6);
  }

  // ───────────── 魔法剣 ─────────────

  // free: ひらめいた ときの はじめの 1回（MP いらず）
  doMahouken(c, cmd, ev, free = false) {
    const sp = ABILITIES[cmd.spell], sk = ABILITIES[cmd.skill];
    const name = sp.name + sk.name;
    ev.name = name;
    ev.lines.push(`${c.name}は剣に${sp.name}を宿らせた！`);
    ev.lines.push(`${name}！`);
    if (this.noSpells) {
      ev.lines.push('しかし呪文の力が、すいこまれてしまった！');
      return;
    }
    if (c.status.silence) {
      ev.lines.push('しかし呪文はふうじこめられている！');
      return;
    }
    const cost = free ? 0 : mpCost(c.penChar, cmd.spell) + mpCost(c.penChar, cmd.skill);
    if (cost > c.mp) {
      ev.lines.push('しかしMPが足りない！');
      return;
    }
    c.mp -= cost;
    this.countUse(c, cmd.spell);
    this.countUse(c, cmd.skill);
    const t = this.resolveTarget(c, 'enemy', cmd.target);
    if (!t) return;
    this.noteCounter(c, t, ev);
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
    for (const j of joined) power += (j.atk || 0) * 0.35 + (j.mag || 0) * 0.35;
    power *= 1 + 0.1 * (n - 1);
    // 砂に もぐった 敵には とどかない（battle-ch4.js）
    const foes = this.aliveEnemies().filter((x) => !hiddenFrom(actor, x));
    if (!foes.length) ev.lines.push('しかし、敵はみんな砂の中にもぐっている！');
    let main = this.get(bc.target);
    if (!main || !foes.includes(main)) main = foes[0];
    ev.fx = { type: 'ability', anim: 'minadein', actor: bc.actor, targets: foes.map((x) => x.id), side: 'ally', element: 'bolt' };
    for (const t of foes) {
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
    this.lock = this.pace(800, 380, ev.lines.length);
    ev.dur = this.lock;
    this.emit(ev);
    this.cur = null;
    this.checkEnd();
  }

  // ───────────── どうぐ ─────────────
  useItem(c, cmd, ev) {
    // 月の鏡・そうびしたまま 使う 道具（battle-ch4.js）
    if (ch4UseItem(this, c, cmd, ev)) return;
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
        // 少し 速く なる（砂クジラ。ゲージの たまる はやさの 倍率）
        if (p.speed) t.speed = (t.speed || 1) * p.speed;
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
      noSpells: this.noSpells,
      // 月の鏡の 光（まぼろしの 分身が いる たたかいだけ。battle-ch4.js）
      mirror: mirrorSnap(this),
      // 敵の 強さ（1 … ふつう。ハードなどの ときは 画面に しるし）
      enemyRate: this.enemyRate,
      bond: this.bond,
      speed: this.speed,
      textSpeed: this.textSpeed,
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
    // たたかいの 中で さくせんを かえられる 人（キャラの id。じぶん＝その 人、なかま＝もちぬし）と「めいれいさせろ」か
    tacBy: init.tacBy !== undefined ? init.tacBy : (init.kind || 'player') === 'player' ? char.id : null,
    manualTac: !!init.manual,
    look: char.look,
    job: char.job,
    // 顔の 絵は 見た目装備で（shared/look-equip.js。強さは char.equip）
    eq: char.equip ? shownEquipKey(char) : '',
    mon: char.species || undefined,
    lv: char.level,
    maxHp: st.maxHp,
    hp: Math.max(0, Math.min(st.maxHp, char.hp ?? st.maxHp)),
    maxMp: st.maxMp,
    mp: Math.max(0, Math.min(st.maxMp, char.mp ?? st.maxMp)),
    atk: st.atk, dfn: st.dfn, agi: st.agi, mag: st.mag, healPow: st.heal,
    weaponCat: st.weaponCat,
    weaponId: char.equip?.weapon || null, // エフェクト用（ぶきごとに みためを かえる）
    // アクセサリー（そうびしたまま 使える 道具。魔神のランプ。battle-ch4.js）
    acc: char.equip?.acc || null,
    onHit: st.onHit,
    resist: { ...st.resist },
    race: char.species ? (MONSTERS[char.species]?.race || 'beast') : 'human',
    abilities,
    // オートの ときに 使わない 技（作戦の「オートで使う技」。ai.js）
    autoOff: Array.isArray(char.autoOff) ? char.autoOff.filter((id) => abilities.includes(id)) : [],
    penChar: { job: char.job, jobs: char.jobs },
    // お気に入りの 技（ならび じゅん）
    favs: char.species ? [] : (Array.isArray(char.favorites) ? char.favorites.slice(0, 30) : []),
    // 技を 使った 回数（ひらめきの もと）と、この たたかいで ひらめいた 技
    use: char.species ? null : { ...(char.skillUse || {}) },
    hiraNew: [],
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
    // こうどうゲージの とくべつな 速さ（ボスは ATB.boss。monsters の speed が あれば そちら）
    speed: m.speed || (m.boss ? ATB.boss : 1),
    actions: m.actions.slice(),
    abilities: [],
    atb: 0, ready: false, queued: false,
    buffs: {}, debuffs: {}, status: {},
    alive: true, charge: 1, telegraph: null, used: {}, recent: [],
  };
}

// クライアントに みせる じょうほう
// 技の メッセージ（{a}＝使った人 {t}＝相手）
function fmtLine(tmpl, c, t) {
  return String(tmpl).replaceAll('{a}', c.name).replaceAll('{t}', t ? t.name : '');
}

// 属性の 効きぐあい（resist の かず → 弱点・効きにくい・効かない）
export function affinityOf(r) {
  if (r === 0) return 'null';
  if (r >= 1.2) return 'weak';
  if (r <= 0.8) return 'resist';
  return 'normal';
}

export function pub(c) {
  const st = Object.keys(c.status || {});
  // 2だんかいめは '+atk2' など（client/ui/info.js の buffNames で ↑↑）
  const lvTag = (b) => (b?.lv >= 2 ? '2' : '');
  const buffs = [...Object.entries(c.buffs || {}).filter(([, b]) => b).map(([k, b]) => '+' + k + lvTag(b)), ...Object.entries(c.debuffs || {}).filter(([, b]) => b).map(([k, b]) => '-' + k + lvTag(b))];
  return {
    id: c.id, side: c.side, kind: c.kind, name: c.name, species: c.species, charId: c.charId,
    controller: c.controller, auto: c.auto, look: c.look, job: c.job, eq: c.eq, mon: c.mon, lv: c.lv,
    waitDual: c.waitDual ? { id: c.waitDual.id, partner: c.waitDual.partner } : null, dualTarget: c.dualTarget || null, dualWith: c.dualWith || null,
    hp: c.hp, maxHp: c.maxHp, mp: c.mp, maxMp: c.maxMp,
    atb: Math.round(c.atb * 10) / 10, rate: atbRate(c),
    ready: !!c.ready, queued: !!c.queued, alive: !!c.alive, fled: !!c.fled, status: st, buffs,
    defending: !!c.defending, telegraph: !!c.telegraph, stance: c.stance?.kind || null, boss: !!c.boss, size: c.size, slot: c.slot,
    // じわじわ 回復が かかっている
    regen: c.regen ? true : undefined,
    // 呪文を となえて いる（よみがえりの呪文）: とぎれるまでの ダメージの たまりぐあい（0〜1）
    chant: c.chant ? Math.min(1, Math.round((c.chant.dmg / c.chant.need) * 100) / 100) : null,
    // まぼろしの 分身の いる たたかいの 本物（足もとに 小さな 影。battle-ch4.js）
    shade: !!c.shade,
    // 砂に もぐっている（ねらえない）: 1 … もぐった / 2 … 砂が もり上がった（つぎの 番に とび出す）。battle-ch4.js
    burrow: c.burrow ? (c.burrow.warned ? 2 : 1) : 0,
    // そうびしている アクセサリーと、この たたかいで もう 使ったか（魔神のランプ）
    acc: c.side === 'ally' ? c.acc || null : undefined,
    accUsed: c.side === 'ally' ? !!c.equipUsed?.length : undefined,
    abilities: c.side === 'ally' ? c.abilities : undefined,
    weaponCat: c.side === 'ally' ? c.weaponCat : undefined,
    pc: c.side === 'ally' ? c.penChar : undefined,
    favs: c.side === 'ally' ? c.favs : undefined,
    tactics: c.side === 'ally' ? (c.manualTac ? 'manual' : c.tactics) : undefined,
    tacBy: c.side === 'ally' ? c.tacBy || null : undefined,
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
export function effMag(c) {
  let v = c.mag || 0;
  if (c.buffs?.mag) v *= c.buffs.mag.mult;
  if (c.debuffs?.mag) v *= c.debuffs.mag.mult;
  return v;
}
export function effDfn(c) {
  let v = c.dfn;
  if (c.buffs?.def) v *= c.buffs.def.mult;
  if (c.debuffs?.def) v *= c.debuffs.def.mult;
  return v;
}
// HPが 少ないほど 強く なる（社ちく・ブラックきぎょうの星。jobs.js の passive.grit）
// HPが まんたんなら 1倍、HPが 0に ちかいほど 1 + grit 倍
export function gritMult(c) {
  const g = c?.side === 'ally' ? JOBS[c.job]?.passive?.grit : 0;
  if (!g || !(c.maxHp > 0)) return 1;
  return 1 + g * clamp(1 - c.hp / c.maxHp, 0, 1);
}

// 呪文が ふうじられた 場所で 使えない 技（呪文・呪文の ような 技・魔法剣）。client/battle.js の コマンドも おなじ きまり
export const SEALED_REASON = 'ここでは呪文がふうじられている！';
export function spellSealed(a) {
  return !!a && (a.kind === 'spell' || !!a.spellLike || a.effect?.type === 'mahouken');
}

function statLabel(stat) {
  return { atk: '攻撃力', def: '守備力', agi: '素早さ', mag: '魔力', eva: 'かいひりつ', breath: 'ブレスたいせい' }[stat] || stat;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function avg(arr) { return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0; }
