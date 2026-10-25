// 第2部 第6章 Step 3・4「星めぐりの古道」の 戦いの しかけ（battle-ch6.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・星座の 魔物（monsters-road.js の c6tod）… 夜だけ 強い／昼だけ 強い。たたかいの はじめに その 時間なら バフ（ずっと つづく）。
//   昼か 夜かは world/battles.js の hooks.night（リーダーの 時計）。シミュレーターは b.night
// ・星くいのよる鳥（ch6.kind 'stars'。古道 4階の 中ボス）「星くい」
//   道しるべの 星（stars.n こ。がめんに 出る）。stars.every 回 動くと、かならず「星をねらう」（前ぶれ）→ 次の 番に「星くい」
//   （星が 1つ へり、HPが 最大HPの stars.heal もどり、攻撃力と 魔力が stars.pow ばいに）。
//   しかえし: ねらっている 間に 光の 攻撃（呪文・特技・合体技。1回の 行動で 1回）を 当てると、目が くらんで 食べそこねる
//             （守りが stars.cut ばいに〈3回 行動の 間〉。stars.stun の ときは ならんでいた 行動も とりやめ・ゲージは 0 から）
//   星が ぜんぶ なくなると、ねらう かわりに「夜をまとう」（前ぶれ）→「よぞらのはばたき」（みんなに 物理の 大技。身を 守ると 半分）
// ・ふりこの魔女 ペンデュラ（ch6.kind 'pend'。古道の いちばん おく）「時のふりこ」
//   ふりこ（pend.pos。左はし -reach 〜 まん中 0 〜 右はし +reach）が、ペンデュラが 1回 動く たびに 1つ ゆれる（がめんに 出る）。
//   左の 間（pos < 0）は 味方の ゲージが pend.ally[0] ばい・ペンデュラが pend.boss[0] ばい、右の 間（pos > 0）は ally[1]・boss[1]
//   （battle.js の speedMult が c.tmul を かける）。
//   まん中に 来ると「時止め」の 前ぶれ（いちばん ゲージの たまっている 1人を ねらう）→ 次の 番に 時止め:
//   その 人の ゲージが 0 に なって、ペンデュラが pend.stop 回 動くまで（ふりこが はしから もどり始めるまで）止まる。身を 守っていると 止まらない。
//   右の はしに 来ると「大ふりこ」の 前ぶれ → 次の 番に 大ふりこ（みんなに 物理の 大技。身を 守ると 半分）
// ・知っている 人（シミュレーター。b.knowsCh6）は roadKnow（b.c6NoLight・b.c6NoGuard … しかけを 1つずつ はずして くらべる とき）
import { MONSTERS } from './data/monsters.js?v=b4e31baa770b';
import { STAR_EATER, PENDULA } from './data/monsters-road.js?v=b4e31baa770b';
import { BUFF_ACTS } from './buff-acts.js?v=b4e31baa770b';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=b4e31baa770b';
// 第2部 第6章 Step 5: カリヨン（時のかね）。battle-tokei.js（ここから よぶ）
import { setupTokei, tokeiTurnStart, tokeiEffect, tokeiPub } from './battle-tokei.js?v=b4e31baa770b';

export { STAR_EATER, PENDULA };
export const AIM = 'm6_se_aim';
export const EAT = 'm6_se_eat';
export const DARK_CHARGE = 'm6_se_dark_charge';
export const DARK = 'm6_se_dark';
export const STOP_CHARGE = 'm6_pd_stop_charge';
export const STOP = 'm6_pd_stop';
export const SWING_CHARGE = 'm6_pd_big_charge';
export const SWING = 'm6_pd_big';
// 身を 守ると 半分に なる 大技（battle-ch6.js の ふつうの オートの 守り AUTO_GUARD）
export const ROAD_BIG = [DARK, SWING];

const confOf = (m) => MONSTERS[m?.species]?.ch6 || null;
const starConf = (m) => confOf(m)?.stars || null;
const pendConf = (m) => confOf(m)?.pend || null;

// 昼か 夜か（world/battles.js の hooks.night。ない ときは b.night）
export function nightOf(b) {
  if (typeof b.hooks?.night === 'function') return !!b.hooks.night();
  return !!b.night;
}

// ───────────── はじめ（battle-ch6.js の setupCh6）─────────────
const INTRO = {
  stars: ['星くいのよる鳥が、道しるべの星を、じっと見ている…！', '（星をねらってきたら、光を当てれば、目をくらませられるかも…！）'],
  pend: ['ペンデュラの大きなふりこが、ゆっくりとゆれ始めた…！', '（ふりこが左の間は、みんなの動きがはやくなるようだ…！）'],
};
export function setupRoad(b) {
  const lines = [];
  const seen = new Set();
  let night = null;
  for (const e of b.enemies) {
    const tod = MONSTERS[e.species]?.c6tod;
    if (tod) {
      if (night === null) night = nightOf(b);
      if ((tod.when === 'night') === night) {
        for (const [k, m] of Object.entries(tod.buff || {})) e.buffs[k] = { mult: m, lv: 1, left: Infinity };
        e.c6tod = tod.when;
        if (!seen.has(e.species)) {
          seen.add(e.species);
          lines.push(tod.msg, tod.when === 'night' ? '（夜は、力が強くなるようだ…！）' : '（昼は、力が強くなるようだ…！）');
        }
      }
    }
    const sc = starConf(e), pc = pendConf(e);
    if (sc) {
      e.stars = { left: sc.n ?? 3, max: sc.n ?? 3, count: 0, eaten: 0, fast: false };
      lines.push(...INTRO.stars);
    }
    if (pc) {
      e.pend = { pos: -(pc.reach ?? 3), dir: 1, reach: pc.reach ?? 3, target: null, frozen: [] };
      applyTimes(b, e);
      lines.push(...INTRO.pend);
    }
    setupTokei(b, e, lines);
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
}

// ───────────── 時のふりこ ─────────────
// 0 … 左・1 … 右・-1 … まん中
export const sideOf = (pos) => (pos < 0 ? 0 : pos > 0 ? 1 : -1);
// 味方と ペンデュラの ゲージの 速さ（c.tmul。時止めの 人は 0）
function applyTimes(b, boss) {
  const pc = pendConf(boss) || {};
  const s = sideOf(boss.pend.pos);
  boss.tmul = s < 0 ? 1 : (pc.boss?.[s] ?? 1);
  for (const a of b.allies) a.tmul = a.tstop > 0 ? 0 : s < 0 ? 1 : (pc.ally?.[s] ?? 1);
}

// 時止めで ねらう 人（いちばん ゲージの たまっている 人。止まっている 人は のぞく）
export function pickStop(b) {
  let best = null;
  for (const a of b.allies) {
    if (!a.alive || a.fled || a.tstop > 0) continue;
    const g = a.ready || a.queued ? 100 : a.atb;
    if (!best || g > best.g) best = { a, g };
  }
  return best?.a || null;
}

function swing(b, c, ev, stuck) {
  const p = c.pend;
  const before = sideOf(p.pos);
  p.pos += p.dir;
  if (Math.abs(p.pos) >= p.reach) {
    p.pos = Math.sign(p.pos) * p.reach;
    p.dir = -Math.sign(p.pos);
  }
  const s = sideOf(p.pos);
  // 時止めが とける（ふりこが はしに ついた）
  for (const a of b.allies) {
    if (!(a.tstop > 0)) continue;
    a.tstop--;
    if (a.tstop <= 0 || !a.alive) {
      a.tstop = 0;
      if (a.alive) ev.lines.push(`${a.name}の時が、また動き出した！`);
      ev.pdFree = (ev.pdFree || []).concat(a.id);
    }
    ev.upd.push(a);
  }
  p.frozen = b.allies.filter((a) => a.tstop > 0).map((a) => a.id);
  applyTimes(b, c);
  if (s !== before) {
    if (s === 0) ev.lines.push('ふりこが、左へゆれた！', '（みんなの動きがはやく、ペンデュラの動きがおそくなった！）');
    else if (s === 1) ev.lines.push('ふりこが、右へゆれた…！', '（ペンデュラの動きがはやく、みんなの動きがおそくなった…！）');
    else ev.lines.push('ふりこが、まん中に来た…！');
  }
  ev.pdSwing = { id: c.id, pos: p.pos, side: s };
  if (!c.telegraph && !stuck) {
    if (p.pos === 0) {
      const t = pickStop(b);
      if (t) {
        p.target = t.id;
        c.telegraph = STOP_CHARGE;
        (ev.postLines = ev.postLines || []).push(`（ペンデュラが、${t.name}をじっと見ている…！）`, `（時止めの前ぶれだ…！${t.name}は、身を守れば止まらない！）`);
        ev.pdAim = { id: c.id, target: t.id, name: t.name };
      }
    } else if (p.pos === p.reach) {
      c.telegraph = SWING_CHARGE;
      (ev.postLines = ev.postLines || []).push('（大ふりこが来る…！みんな、身を守れ！）');
      ev.pdBig = c.id;
    }
  }
  ev.upd.push(c, ...b.allies);
}

// ───────────── 行動の はじめ（battle-ch6.js の ch6TurnStart）─────────────
export function roadTurnStart(b, c, ev, cmd = null) {
  if (c.side !== 'enemy' || !c.alive) return;
  const stuck = cmd?.type === 'incapacitated';
  if (c.stars && !c.telegraph) {
    const sc = starConf(c) || {};
    if (!c.stars.fast && sc.fastEvery && c.hp / c.maxHp < (sc.fastAt ?? 0.5)) {
      c.stars.fast = true;
      ev.lines.push(`${c.name}は、おなかをすかせて、きょろきょろしている…！`, '（星をねらうのが、はやくなった！）');
    }
    c.stars.count++;
    const every = c.stars.fast ? sc.fastEvery : (sc.every ?? 4);
    if (c.stars.count >= every && !stuck) {
      c.stars.count = 0;
      c.telegraph = c.stars.left > 0 ? AIM : sc.dark === false ? null : DARK_CHARGE;
    }
    ev.upd.push(c);
  }
  // ふりこは 前ぶれの 番も ゆれる（まん中で 前ぶれ → 1つ 先で 時止め）
  if (c.pend) swing(b, c, ev, stuck);
  tokeiTurnStart(b, c, ev, stuck);
}

// ───────────── 技の こうか（battle-ch6.js の ch6Effect）─────────────
export function roadEffect(b, c, a, eff, ev) {
  if (eff.type === 'seEat') {
    starEat(b, c, ev);
    return true;
  }
  if (eff.type === 'pdStop') {
    timeStop(b, c, ev);
    return true;
  }
  return tokeiEffect(b, c, a, eff, ev);
}

// 星くい: 星が 1つ へる・HPが もどる・力が 上がる
function starEat(b, c, ev) {
  const sc = starConf(c) || {};
  const st = c.stars;
  ev.fx = { type: 'ability', anim: 'a6r_eat', actor: c.id, targets: [c.id], side: 'enemy' };
  if (!st || st.left <= 0) {
    ev.lines.push('しかし、もう星はなかった。');
    return;
  }
  st.left--;
  st.eaten++;
  const heal = Math.max(0, Math.min(c.maxHp - c.hp, Math.round(c.maxHp * (sc.heal ?? 0.1))));
  c.hp += heal;
  const pow = sc.pow ?? 1.1;
  c.atk = Math.round(c.atk * pow);
  c.mag = Math.round(c.mag * pow);
  ev.lines.push(heal > 0 ? `${c.name}のキズが${heal}なおった！` : `${c.name}は、星の光で体がかがやいた！`, `${c.name}の力が上がった！（のこりの星${st.left}/${st.max}）`);
  if (st.left <= 0) ev.lines.push('道しるべの星が、全部食べられてしまった…！', '（あたりが、まっくらになった…！）');
  (ev.results = ev.results || []).push({ id: c.id, heal });
  ev.seEat = { id: c.id, left: st.left, heal };
  ev.warn = true;
  ev.upd.push(c);
}

// 時止めで ゲージを 止める（合体技の よやくも おわり）
function freeze(b, t, n) {
  t.tstop = n;
  t.tmul = 0;
  if (t.waitDual) b.endWait(t, `${t.name}の時が止まって、合体技は出せなくなった…`, false);
  if (t.dualTarget) {
    const w = b.get(t.dualTarget);
    if (w?.waitDual) b.endWait(w, `${t.name}の時が止まって、合体技は出せなくなった…`);
  }
  b.queue = b.queue.filter((q) => q.id !== t.id || q.cmd?.type === 'dual');
  t.ready = false;
  if (!t.dualWith) t.queued = false;
  t.atb = 0;
}

function timeStop(b, c, ev) {
  const p = c.pend;
  const pc = pendConf(c) || {};
  let t = p?.target ? b.get(p.target) : null;
  if (p) p.target = null;
  if (!t || !t.alive || t.fled) t = pickStop(b);
  if (!t) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  ev.fx = { type: 'ability', anim: 'a6r_stop', actor: c.id, targets: [t.id], side: 'enemy' };
  if (t.defending) {
    ev.lines.push(`しかし、${t.name}は身を守っていた！`, '時止めを、はねかえした！');
    ev.pdGuard = t.id;
    ev.upd.push(t, c);
    return;
  }
  freeze(b, t, pc.stop ?? 2);
  if (p) p.frozen = b.allies.filter((a) => a.tstop > 0).map((a) => a.id);
  ev.lines.push(`${t.name}の時が、止まってしまった…！`, '（ふりこが、はしからもどり始めるまで、動けない…！）');
  ev.pdStop = t.id;
  ev.warn = true;
  ev.upd.push(t, c);
}

// ───────────── ダメージ（battle-ch6.js の ch6Damage）─────────────
// 星を ねらっている 間に 光を 当てると、目が くらむ（1回の 行動で 1回）。ダメージは そのまま
export function roadDamage(b, c, t, dmg, info, ev) {
  if (t.stars && t.telegraph === EAT && info.element === 'light' && !ev.seLight) {
    const sc = starConf(t) || {};
    ev.seLight = true;
    t.telegraph = null;
    // stun … よろめく（ならんでいた 行動は とりやめ・ゲージは 0 から）
    if (sc.stun) {
      if (t.queued) {
        b.queue = b.queue.filter((q) => q.id !== t.id);
        t.queued = false;
      }
      t.ready = false;
      t.atb = 0;
    }
    // ボスの 段階の ずっと つづく 弱さは そのまま
    const cut = sc.cut && !(t.debuffs.def && !Number.isFinite(t.debuffs.def.left));
    if (cut) t.debuffs.def = { mult: sc.cut, lv: 1, left: BUFF_ACTS };
    (ev.postLines = ev.postLines || []).push(`まぶしい光に、${t.name}は目がくらんだ！`, `星を食べそこねた！（のこりの星${t.stars.left}/${t.stars.max}${cut ? '・守りが下がった' : ''}）`);
    ev.seStun = t.id;
    ev.upd.push(t);
  }
  return dmg;
}

// ───────────── 知っている 人の オート（battle-ch6.js の ch6Plan から。b.knowsCh6）─────────────
// 星くいのよる鳥 … 星を ねらったら 光の 技（いちばん 大きい もの）/ よぞらのはばたきが 自分の 番より 先に 来る ときは 身を 守る
// ペンデュラ … 時止めで ねらわれた 人は 身を 守る / 大ふりこが 自分の 番より 先に 来る ときは 身を 守る
// （だれかが とても あぶない ときの 回復・生き返りは battle-ch6.js が 先に えらぶ）
export function roadKnow(b, c, boss, base, { elemHit }) {
  const mine = 100 / atbRate(c);
  const first = () => (100 - boss.atb) / atbRate(boss) <= mine;
  if (boss.stars) {
    if (boss.telegraph === EAT && !b.c6NoLight) {
      const l = elemHit(b, c, boss, 'light');
      if (l) return l;
    }
    if (boss.telegraph === DARK && !b.c6NoGuard && first()) return { type: 'defend' };
  }
  if (boss.pend) {
    if (boss.telegraph === STOP && boss.pend.target === c.id && !b.c6NoGuard) return { type: 'defend' };
    if (boss.telegraph === SWING && !b.c6NoGuard && first()) return { type: 'defend' };
  }
  return base;
}

// ───────────── がめんへ（battle-ch6.js の ch6Pub）─────────────
// 星くいのよる鳥: 星（stars・starsMax・starAim … ねらっている）/ ペンデュラ: ふりこ（pendPos・pendDir・pendReach・
//   pendTarget … 時止めで ねらっている 人・pendFrozen … 止まっている 人）
export function roadPub(c) {
  if (c.side !== 'enemy') return {};
  const o = {};
  if (c.stars) {
    o.stars = c.stars.left;
    o.starsMax = c.stars.max;
    o.starAim = c.telegraph === EAT ? 1 : 0;
  }
  if (c.pend) {
    o.pendPos = c.pend.pos;
    o.pendDir = c.pend.dir;
    o.pendReach = c.pend.reach;
    o.pendTarget = c.telegraph === STOP_CHARGE || c.telegraph === STOP ? c.pend.target : null;
    o.pendFrozen = c.pend.frozen.slice();
  }
  tokeiPub(c, o);
  return o;
}
