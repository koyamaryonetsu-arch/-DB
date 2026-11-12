// 第67回 B: モンスター闘技場の 戦い（人は 戦わない。自分の 魔物 1〜4ひき だけ）。docs/plan-r67-monster-arena.md
//
// ・みかたの がわ … ふつうの 戦いと おなじ（魔物の 仲間。作戦で うごく・「めいれいさせろ」なら もちぬしが コマンドを えらぶ）
// ・相手の がわ（ランク戦）… ふつうの 魔物（data/monsters.js。強さは レベルに あわせる）
// ・相手の がわ（家族の 登録チーム・C班の その場の 対戦）… 家族の 魔物の 仲間を「敵の がわ」に 入れる（foe）。
//   敵の がわでも 仲間と おなじ 作戦の AI（ai.js の decideAlly を、敵と みかたを 入れかえた 目で 使う）・おなじ 強さの きまり
//   （会心の 出やすさ・呪文と 回復の 強さ・魔物の 技の MP・グループの 技）で 戦う
//
// C班（その場の 対戦）も 使う もの:
//   MonArenaBattle … Battle の 子。opts.foes（敵の がわに 入れる 魔物の 仲間の キャラ）を 受けとる
//   monFighterChar(char, { level }) … 戦う ための 写し（level を わたすと その レベルで 強さを 計算しなおす・HP と MP は 満タン）
//   monAllyInit(char, { controller, auto, tactics, owner }) … みかたの がわの 入れ方（Battle の allies に わたす）
//   addMonFoe(battle, char, { controller, auto, tactics, owner, name }) … 敵の がわに 1ぴき 入れる（controller を わたすと その 人が コマンドを えらぶ）
//   monSnapshot(entry) / snapChar(snap, ownerId) … 登録チームの 写し（もちぬしが 遊んで いなくても 戦える）
import { Battle, allyFromCharacter, enemyFixedScale, agiFactor, effAgi, ATB, attackReach, reachFalloff } from './battle.js?v=a1c844b80134';
import { decideAlly, TACTICS } from './ai.js?v=a1c844b80134';
import { MONSTERS } from './data/monsters.js?v=a1c844b80134';
import { ABILITIES } from './data/abilities.js?v=a1c844b80134';
import { fullHeal, mpCost, computeStats } from './stats.js?v=a1c844b80134';
import { SNAP_KEYS } from './data/monarena.js?v=a1c844b80134';
import { scaleEnemy } from './data/treasure.js?v=a1c844b80134';

export { SNAP_KEYS };

// レベルを そろえる 対戦の レベル（みんな この レベルで 強さを 計算しなおす）
export const MON_EVEN_LV = 50;
// みかたの がわの 会心の 出やすさ（battle.js の calcPhys: 敵 1/64・みかた 1/28）。敵の がわの 魔物の 仲間にも おなじ だけ
const ALLY_CRIT = 1 / 28 - 1 / 64;
// れんけいの 時間（battle.js の COMBO_WINDOW と おなじ）
const COMBO_WINDOW = 6000;
const NO_COMBO = () => ({ count: 0, actor: null, element: null, time: -99999 });

const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

// 戦う ための 写し（もとの キャラは かえない）。level … その レベルに する（レベルを そろえる 対戦）
export function monFighterChar(char, { level = null, heal = true } = {}) {
  const c = clone(char);
  if (Number.isFinite(level) && level > 0) c.level = Math.floor(level);
  c.status = {};
  if (heal) fullHeal(c);
  return c;
}

// みかたの がわの 入れ方（Battle の allies）。tactics 'manual'（めいれいさせろ）は controller の 人が えらぶ
export function monAllyInit(char, { controller = null, auto = true, owner = null } = {}) {
  const tac = char.tactics || 'balanced';
  const manual = tac === 'manual';
  return {
    char, kind: 'monster',
    controller: manual ? controller : null, auto: manual && controller ? !!auto : true,
    tactics: manual ? 'balanced' : tac, tacBy: owner, manual,
  };
}

// 敵の がわに 魔物の 仲間を 1ぴき 入れる（Battle の 中みを 直接 足す。戦いが はじまる 前に）
export function addMonFoe(b, char, { controller = null, auto = true, owner = null, name = null } = {}) {
  const tac = char.tactics && TACTICS[char.tactics] && char.tactics !== 'manual' ? char.tactics : 'balanced';
  const c = allyFromCharacter(char, { kind: 'monster', controller, auto: controller ? !!auto : true, tactics: tac, tacBy: owner });
  const sp = c.mon || char.species;
  Object.assign(c, {
    side: 'enemy', foe: true, species: sp, baseName: name || c.name, name: name || c.name, letter: '',
    size: MONSTERS[sp]?.size || MONSTERS[char.species]?.size, boss: false, metal: false, flying: false,
    turns: 1, speed: 1, actions: [], used: {}, recent: [], telegraph: null,
    // 1回だけ 起き上がる しゅぞく（ミイラ兵 など。monsters の revive）は 敵の がわでも 起き上がらない（みかたと おなじ）
    revived: true,
    crit: (c.crit || 0) + ALLY_CRIT,
    // ひらめき・技の 回数は 敵の がわでは 数えない
    use: null, hiraNew: [],
  });
  c.id = 'e' + (b.nextId++);
  c.slot = b.combatants.filter((x) => x.side === 'enemy').length;
  c.atb = b.rng.float(0, 35) + Math.max(0, Math.min(ATB.headMax, ATB.head * (agiFactor(effAgi(c)) - 0.8)));
  if (c.atb >= 100) c.atb = 99.9;
  b.combatants.push(c);
  return c;
}

// 敵の がわの 魔物から 見た 戦い（敵と みかたを 入れかえる。tools の かけ試合〈world/arena.js の betDuel〉と おなじ やり方）
function foeView(b) {
  return new Proxy(b, {
    get(t, k) {
      if (k === 'aliveAllies') return () => t.aliveEnemies();
      if (k === 'aliveEnemies') return () => t.aliveAllies();
      if (k === 'allies') return t.enemies;
      if (k === 'enemies') return t.allies;
      // 戦いの 重さの みつもり（ai.js の fightWeight）は 敵の がわの ぶんを べつに おぼえる
      if (k === '_fightW') return t._fightWFoe;
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
    set(t, k, v) {
      if (k === '_fightW') t._fightWFoe = v;
      else t[k] = v;
      return true;
    },
  });
}

export class MonArenaBattle extends Battle {
  // opts.foes … 敵の がわに 入れる 魔物の 仲間（[{ char, controller, auto, owner, name }]）。opts.enemies（ふつうの 魔物）と いっしょでも よい
  constructor(opts = {}) {
    super(opts);
    this.monArena = true;
    // 敵の がわの 魔物の 仲間の れんけい（みかたの this.combo と べつに 数える）
    this.foeCombo = NO_COMBO();
    const foes = opts.foes || [];
    // 名前が かさなる とき（みかたと 同じ 名前・敵どうし 同じ 名前）は A・B を つける
    const taken = new Set(this.allies.map((a) => a.name));
    const count = {};
    for (const f of foes) count[f.char.name] = (count[f.char.name] || 0) + 1;
    const seen = {};
    for (const f of foes) {
      const nm = f.char.name;
      let name = nm;
      if (count[nm] > 1 || taken.has(nm)) {
        const i = seen[nm] = (seen[nm] ?? -1) + 1;
        name = nm + 'ABCDEFGH'[i % 8];
      }
      addMonFoe(this, f.char, { ...f, name });
    }
  }

  onReady(c) {
    if (!c.foe) return super.onReady(c);
    // ねむり などは ふつうと おなじ（番が とばされる）
    if (c.status.sleep || c.status.paralyze || c.status.prison || c.status.rift) return super.onReady(c);
    // 人が うごかす 敵の がわ（C班の その場の 対戦）: コマンドを まつ
    if (c.controller && !c.auto && !c.status.confuse) {
      c.ready = true;
      this.emit({ t: 'ready', id: c.id });
      return;
    }
    this.enqueue(c, { type: 'ai' });
  }

  command(actorId, cmd, controller) {
    const c = this.get(actorId);
    if (c?.foe && cmd && typeof cmd === 'object') cmd = { ...cmd, foeManual: true };
    return super.command(actorId, cmd, controller);
  }

  // 作戦の AI（敵の がわ）
  foeDecide(c) {
    return decideAlly(foeView(this), c);
  }

  perform(c, cmd, ev) {
    if (c.foe && !cmd.confused) {
      // battle.js の executeNext は 敵の がわの 'ai' を decideMonster に わたす（actions が ないので「攻撃」）。ここで 作戦の AI に かえる
      if (!cmd.foeManual && cmd.type === 'attack') cmd = this.foeDecide(c);
      // ムチ・ブーメランの ふつうの 攻撃（何体にも あたる。みかたと おなじ）
      if (cmd.type === 'attack' && attackReach(c.weaponCat) !== 'enemy') {
        ev.name = '攻撃';
        this.multiAttack(c, cmd, ev, attackReach(c.weaponCat));
        return undefined;
      }
      // 魔物の 技（kind 'monster'）は 敵だと MP が いらない。みかたと おなじ MP を はらう
      if (cmd.type === 'ability') {
        const a = ABILITIES[cmd.id];
        if (a && a.kind === 'monster') {
          const cost = mpCost(c.penChar, cmd.id);
          if (cost > c.mp) cmd = { type: 'attack', target: cmd.target };
          else c.mp -= cost;
        }
      }
    }
    return super.perform(c, cmd, ev);
  }

  attackPlan(c, wanted) {
    if (!c?.foe) return super.attackPlan(c, wanted);
    const reach = attackReach(c.weaponCat);
    const foes = this.sideOf(c, false).filter((x) => x.alive);
    let list;
    if (reach === 'enemies') list = foes;
    else {
      const t = this.peekTarget(c, 'enemy', wanted);
      list = !t ? [] : reach === 'group' ? [t, ...foes.filter((x) => x !== t && x.mon && x.mon === t.mon)] : [t];
    }
    return list.map((t, i) => ({ t, mult: reach === 'enemy' ? 1 : reachFalloff(c.weaponCat, i) }));
  }

  // れんけい: 敵の がわの 魔物の 仲間も みかたと おなじ きまり（つづけて 攻撃すると 強く なる。相手の がわが 攻撃すると とぎれる）
  comboMult(c) {
    if (!c?.foe) return super.comboMult(c);
    if (!this.cur) return 1;
    if (this.cur.comboCount === undefined) {
      const k = this.foeCombo;
      const chain = k.actor && k.actor !== c.id && this.time - k.time <= COMBO_WINDOW;
      this.cur.comboCount = chain ? k.count + 1 : 1;
    }
    const n = this.cur.comboCount;
    return n >= 2 ? Math.min(1.25, 1.05 + 0.05 * (n - 1)) : 1;
  }

  afterDamage(c, ev, element) {
    if (!c?.foe) {
      if (c?.side === 'ally' && ev.dealt) this.foeCombo = NO_COMBO();
      return super.afterDamage(c, ev, element);
    }
    this.combo = NO_COMBO();
    if (!ev.dealt) return;
    const n = ev.comboCount || 1;
    if (n >= 2) {
      ev.combo = n;
      ev.lines.splice(1, 0, `れんけい${n}！`);
    }
    this.foeCombo = { count: n, actor: c.id, element: element || 'phys', time: this.time };
  }

  // グループの 技: 敵の がわの 魔物の 仲間も、みかたと おなじく「えらんだ 相手の グループ」だけ
  targetsFor(c, a, cmd) {
    if (c.foe && a.target === 'group') {
      const t = this.peekTarget(c, 'enemy', cmd.target);
      if (!t) return [];
      const same = this.sideOf(c, false).filter((x) => x.alive && x !== t && x.mon && x.mon === t.mon);
      return [t, ...same];
    }
    return super.targetsFor(c, a, cmd);
  }

  // 呪文・息・回復の 強さ: 敵の 魔物の 弱め（enemyFixedScale）を 魔物の 仲間には かけない
  calcMagic(c, t, eff, powMult = 1, estimate = false) {
    return super.calcMagic(c, t, eff, c?.foe ? powMult / enemyFixedScale(c) : powMult, estimate);
  }

  heal(c, t, eff, ev, powMult = 1) {
    return super.heal(c, t, eff, ev, c?.foe ? powMult / enemyFixedScale(c) : powMult);
  }

  healAmountOf(c, eff, powMult = 1) {
    return super.healAmountOf(c, eff, c?.foe ? powMult / enemyFixedScale(c) : powMult);
  }
}

// ランク戦の 1戦の 相手（data/monarena.js の MONARENA_RANKS の R・fight … 0〜2）。
//   相手は ランクの 相手の レベル（foeLv。ない ときは lv）に そろえる（宝の洞窟と おなじ のび）。3戦目の 王者は champLv だけ 上の レベルと champPow 倍の 強さ
export function monRankFight(R, fight) {
  const enemies = (R?.fights?.[fight] || []).slice();
  const champ = fight === 2 ? enemies[0] || null : null;
  const L = R.foeLv || R.lv;
  const enemyMod = (m) => scaleEnemy(m, L + (m.species === champ ? R.champLv || 0 : 0), m.species === champ ? R.champPow || 1 : 1, { curve: true });
  return { enemies, enemyMod, champ };
}

// ───────────── 登録チームの 写し ─────────────
// 仲間・あずかり中の 魔物 { key, kind: 'monster', species, char } から（強さの 計算に いる ものだけ）
export function monSnapshot(entry) {
  const ch = entry?.char;
  if (!ch || !ch.species || !MONSTERS[ch.species]) return null;
  const out = { key: String(entry.key) };
  for (const k of SNAP_KEYS) if (ch[k] !== undefined && ch[k] !== null) out[k] = clone(ch[k]);
  out.level = Math.max(1, Math.floor(Number(ch.level) || 1));
  out.name = String(ch.name || MONSTERS[ch.species].name).slice(0, 12);
  return out;
}

// 写しから 戦える キャラに（HP と MP は 満タン。level … レベルを そろえる 時）
export function snapChar(snap, ownerId = '', { level = null } = {}) {
  if (!snap?.species || !MONSTERS[snap.species]) return null;
  const c = {
    id: `snap:${ownerId}:${snap.key}`, look: null, job: null, jobs: {},
    equip: { weapon: null, armor: null, shield: null, head: null, acc: null },
    items: [], seeds: {}, status: {}, flags: {}, tactics: 'balanced', exp: 0,
  };
  for (const k of SNAP_KEYS) if (snap[k] !== undefined) c[k] = clone(snap[k]);
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null, ...(c.equip && typeof c.equip === 'object' ? c.equip : {}) };
  c.level = Math.max(1, Math.floor(Number(level) || Number(c.level) || 1));
  c.name = String(c.name || MONSTERS[c.species].name);
  fullHeal(c);
  return c;
}

// 1ぴきの 強さ（受付の 画面の 一覧。HP・MP は 満タンの 時）
export function monStatRow(char) {
  const st = computeStats(char);
  return { hp: st.maxHp, mp: st.maxMp, atk: st.atk, def: st.dfn, agi: st.agi };
}
