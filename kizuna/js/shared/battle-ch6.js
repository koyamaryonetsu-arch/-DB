// 第2部 第6章 Step 1・2 の ボスの たたかいの しかけ（battle.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・サンドクロック（monsters-past.js の ch6.kind 'sand'。時のほこらの いちばん 下）「砂が落ちきると…」
//   体の 中の 砂（sand.max）が、サンドクロックが 1回 動く たびに 1つ 落ちる（がめんに 砂の 目もり）。
//   砂が 0 に なると、その 番に かならず 前ぶれ「最後の砂」→ 次の 番に「大砂流」（みんなに 物理の 大技。身を 守ると 半分）。
//   大砂流の あとは 砂時計が ひっくり返って、砂は また いっぱい。
//   しかえし: 氷の 攻撃（呪文・特技・合体技。1回の 行動で 1回）を 当てると、砂が こおって sand.ice 上に もどる（落ちるのを おくらせる）。
//             前ぶれの 間に 氷を 当てると、こおった 砂が つまって 大砂流は 止まる（砂は sand.stopTo）
//   HPが sand.fastAt より へると、砂の いっぱいが sand.fast に（はやく 落ちきる）
// ・ギアドン（ch6.kind 'gear'。時のいせきの 番人の間）「まきもどし」
//   gear.every 回 動くと、かならず「時を覚える」（今の HPを おぼえる）。そこから gear.wind 回 動くと「まきもどし」で、
//   HPが おぼえた ときまで もどる（その 間に あたえた キズが なくなる）。
//   しかえし: 覚えてから まきもどすまでの 間に、雷の 攻撃を gear.need 回（1回の 行動で 1回）当てると、むねの 大歯車が こわれて
//             まきもどしは 止まる。ギアドンは よろめいて（ゲージが 0 から・ならんでいた 行動も とりやめ）、守りが gear.cut ばいに（3回 行動の 間）
//   HPが gear.fastAt より へると、時を おぼえるのが gear.fastEvery 回ごとに。ほかに 大歯車を かかげる → ギアプレス（ふつうの 前ぶれの 大技）
// ・オートの 仲間（ふつう）は、大砂流・ギアプレスが 自分の 番より 先に 来る とき、HPが へっていれば よく 身を 守る（AUTO_GUARD。氷・雷は 使い分けない）。
//   シミュレーター（tools/sim-ch6.mjs）の 知っている 人（b.knowsCh6）は ch6Plan
//   （b.c6NoIce・b.c6NoBolt・b.c6NoGuard … 知っている 人の しかけを 1つずつ はずして くらべる とき）
import { MONSTERS } from './data/monsters.js?v=f2f4be342cfa';
import { ABILITIES } from './data/abilities.js?v=f2f4be342cfa';
import { SAND_CLOCK, GEARDON } from './data/monsters-past.js?v=f2f4be342cfa';
import { BUFF_ACTS } from './buff-acts.js?v=f2f4be342cfa';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=f2f4be342cfa';
import { canUse } from './ai.js?v=f2f4be342cfa';
// 第2部 第6章 Step 3・4: 星くいのよる鳥（星くい）・ペンデュラ（時のふりこ）・星座の 魔物（昼と 夜）。battle-road.js
import { setupRoad, roadTurnStart, roadEffect, roadDamage, roadKnow, roadPub, ROAD_BIG } from './battle-road.js?v=f2f4be342cfa';

export { SAND_CLOCK, GEARDON };
export const FALL = 'm6_sc_fall';
export const FALL_CHARGE = 'm6_sc_fall_charge';
export const RECORD = 'm6_gd_record';
export const REWIND = 'm6_gd_rewind';
export const PRESS = 'm6_gd_press';
// ふつうの オートが 大技の 前に 身を 守る（HPが この わりあいより 少ない とき・この たしかさで。影の城の まぼろしと おなじ）
export const AUTO_GUARD = { hp: 0.8, chance: 0.6 };
const BIG = new Set([FALL, PRESS, ...ROAD_BIG]);
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});

const confOf = (m) => MONSTERS[m?.species]?.ch6 || null;
const sandConf = (m) => confOf(m)?.sand || null;
const gearConf = (m) => confOf(m)?.gear || null;

// ───────────── はじめ（battle.js の constructor）─────────────
const INTRO = {
  sand: ['サンドクロックの体の中で、砂がさらさらと落ち始めた…！', '（砂が落ちきると、何かが起こりそうだ…！）'],
  gear: ['ギアドンのむねの大歯車が、ギリギリと回っている…！', '（あの歯車、雷に弱そうだ…）'],
};
export function setupCh6(b) {
  const kinds = new Set();
  for (const e of b.enemies) {
    const sc = sandConf(e), gc = gearConf(e);
    if (sc) e.sand = { lv: sc.max ?? 6, max: sc.max ?? 6, fast: false };
    if (gc) e.gear = { count: 0, rec: null, left: 0, hits: 0, fast: false };
    if (sc || gc) kinds.add(confOf(e).kind);
  }
  for (const k of kinds) if (INTRO[k]) b.emit({ t: 'msg', lines: INTRO[k].slice(), dur: 1300 });
  setupRoad(b);
}

// ───────────── 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）─────────────
//   scEmpty … 砂が 落ちきった（前ぶれで ない。ふだんは ch6TurnStart が 前ぶれを 出す）/ gdIdle … まきもどしの 間でも 前ぶれでも ない
export function ch6Cond(b, m, cond) {
  if (cond === 'scEmpty') return !!m.sand && m.sand.lv <= 0 && !m.telegraph;
  if (cond === 'gdIdle') return !m.gear?.rec && !m.telegraph;
  return null;
}

// ───────────── 行動の はじめ（battle-ch5.js の towerTurnStart から）─────────────
// 砂が 落ちる・まきもどしまでの 数・時を おぼえる 数（動けない 番も 数える。前ぶれの 番は 数えない）
export function ch6TurnStart(b, c, ev, cmd = null) {
  if (c.side !== 'enemy' || !c.alive) return;
  const stuck = cmd?.type === 'incapacitated';
  if (c.sand && !c.telegraph) {
    const sc = sandConf(c) || {};
    // HPが へると、砂の いっぱいが へる（はやく 落ちきる）
    if (!c.sand.fast && sc.fast && c.hp / c.maxHp < (sc.fastAt ?? 0.5)) {
      c.sand.fast = true;
      c.sand.max = sc.fast;
      c.sand.lv = Math.min(c.sand.lv, c.sand.max);
      ev.lines.push(`${c.name}のガラスの首が、広がった…！`, '（砂の落ちるのが、はやくなった！）');
    }
    if (c.sand.lv > 0) {
      c.sand.lv--;
      const { lv, max } = c.sand;
      ev.lines.push(lv > 0 ? `${c.name}の砂が、さらさらと落ちていく…（砂${lv}/${max}）` : `${c.name}の砂が、落ちきった…！（砂0/${max}）`);
      if (lv === 1) ev.lines.push('（あと1つで、砂が落ちきる…！氷でこおらせれば、もどせるかも…！）');
      ev.scSand = { id: c.id, lv, max };
    }
    // 砂が 落ちきった: この 番は かならず 前ぶれ（ai.js の decideMonster が telegraph を 出す。動けない 番は 次の 番に）
    if (c.sand.lv <= 0 && !stuck) c.telegraph = FALL_CHARGE;
    ev.upd.push(c);
  }
  if (c.gear && !c.telegraph) {
    const gc = gearConf(c) || {};
    if (!c.gear.fast && gc.fastEvery && c.hp / c.maxHp < (gc.fastAt ?? 0.4)) c.gear.fast = true;
    if (c.gear.rec !== null) {
      c.gear.left--;
      if (c.gear.left <= 0) {
        if (!stuck) c.telegraph = REWIND;
      } else ev.lines.push(`${c.name}のぜんまいが、ギリギリとまかれていく…（まきもどしまで、あと${c.gear.left}）`);
      ev.gdWind = { id: c.id, left: Math.max(0, c.gear.left) };
    } else {
      c.gear.count++;
      const every = c.gear.fast ? gc.fastEvery : (gc.every ?? 4);
      if (c.gear.count >= every && !stuck) c.telegraph = RECORD;
    }
    ev.upd.push(c);
  }
  roadTurnStart(b, c, ev, cmd);
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function ch6Effect(b, c, a, eff, ev, targets = []) {
  switch (eff.type) {
    case 'scFall': sandFall(b, c, eff, ev); return true;
    case 'gdRecord': record(b, c, ev); return true;
    case 'gdRewind': rewind(b, c, ev); return true;
    default: return roadEffect(b, c, a, eff, ev, targets);
  }
}

// 大砂流（みんなに 物理の 大技。身を 守ると 半分）。おわると 砂時計が ひっくり返って 砂は いっぱい
function sandFall(b, c, eff, ev) {
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a6_fall', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) {
    b.physHit(c, t, { mult: eff.mult ?? 1.5, ignoreDef: eff.ignoreDef ?? 0.4, acc: 1.2 }, ev, 'phys');
    if (eff.debuff && t.alive) b.applyDebuff(c, t, eff.debuff, ev);
  }
  if (c.sand) {
    c.sand.lv = c.sand.max;
    (ev.postLines = ev.postLines || []).push(`${c.name}は、くるりとひっくり返った！`, `（砂がまた、いっぱいになった…　砂${c.sand.lv}/${c.sand.max}）`);
  }
  ev.scFall = c.id;
  ev.warn = true;
  ev.upd.push(c);
}

// 時を覚える（今の HP）
function record(b, c, ev) {
  const gc = gearConf(c) || {};
  if (!c.gear) return;
  Object.assign(c.gear, { rec: c.hp, left: gc.wind ?? 3, hits: 0, count: 0 });
  const need = gc.need ?? 2;
  ev.lines.push(`（${c.name}は、今の体を時の中に覚えた…！）`, `（雷の攻撃を${need}回当てれば、歯車を止められそうだ…！）`);
  ev.fx = { type: 'ability', anim: 'a6_record', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.gdRecord = { id: c.id, need };
  ev.warn = true;
  ev.upd.push(c);
}

// まきもどし: HPが おぼえた ときまで もどる（弱く なる 力も 消える）
function rewind(b, c, ev) {
  if (!c.gear) return;
  const rec = c.gear.rec;
  Object.assign(c.gear, { rec: null, left: 0, hits: 0, count: 0 });
  ev.fx = { type: 'ability', anim: 'a6_rewind_big', actor: c.id, targets: [c.id], side: 'enemy' };
  if (rec === null) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  const heal = Math.max(0, Math.min(c.maxHp, rec) - c.hp);
  c.hp += heal;
  c.debuffs = {};
  ev.lines.push(heal > 0 ? `時がまきもどって、${c.name}のキズが${heal}もとにもどった！` : `時がまきもどった！…しかし、${c.name}のキズは、ふえていなかった。`);
  (ev.results = ev.results || []).push({ id: c.id, heal });
  ev.gdRewind = { id: c.id, heal };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle.js の damage。phantomDamage の あと）─────────────
// 氷で 砂が こおる・雷で 大歯車が こわれる（どちらも 1回の 行動で 1回）。ダメージは そのまま
export function ch6Damage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0 || t.side !== 'enemy' || c.side !== 'ally' || !t.alive) return dmg;
  if (t.sand && info.element === 'ice' && !ev.scIce) {
    const sc = sandConf(t) || {};
    const post = (ev.postLines = ev.postLines || []);
    ev.scIce = true;
    if (t.telegraph === FALL) {
      t.telegraph = null;
      t.sand.lv = Math.max(t.sand.lv, Math.min(t.sand.max, sc.stopTo ?? 2));
      post.push('こおった砂が、ガラスの首につまった！', `大砂流は、止まった！（砂${t.sand.lv}/${t.sand.max}）`);
      ev.scStop = t.id;
    } else if (t.sand.lv < t.sand.max) {
      t.sand.lv = Math.min(t.sand.max, t.sand.lv + (sc.ice ?? 1));
      post.push(`氷で砂がこおって、上にもどった！（砂${t.sand.lv}/${t.sand.max}）`);
      ev.scBack = { id: t.id, lv: t.sand.lv };
    }
    ev.upd.push(t);
  }
  if (t.gear?.rec !== null && t.gear?.rec !== undefined && info.element === 'bolt' && !ev.gdBolt) {
    const gc = gearConf(t) || {};
    const post = (ev.postLines = ev.postLines || []);
    ev.gdBolt = true;
    t.gear.hits++;
    const need = gc.need ?? 2;
    if (t.gear.hits >= need) {
      Object.assign(t.gear, { rec: null, left: 0, hits: 0, count: 0 });
      // よろめく: ならんでいた 行動は とりやめ・ゲージは 0 から・守りが 下がる（3回 行動の 間）
      if (t.queued) {
        b.queue = b.queue.filter((q) => q.id !== t.id);
        t.queued = false;
      }
      t.ready = false;
      t.atb = 0;
      t.debuffs.def = { mult: gc.cut ?? 0.75, lv: 1, left: BUFF_ACTS };
      post.push('雷で、むねの大歯車がショートした！', '大歯車がくだけて、まきもどしは止まった！', `${t.name}は、ぐらりとよろめいた！（守りが下がった）`);
      ev.gdBreak = t.id;
    } else {
      post.push(`雷で、大歯車に火花がちった！（あと${need - t.gear.hits}回）`);
      ev.gdSpark = { id: t.id, left: need - t.gear.hits };
    }
    ev.upd.push(t);
  }
  return roadDamage(b, c, t, dmg, info, ev);
}

// ───────────── 知っている 人の オート（battle-ch5.js の towerPlan から。b.knowsCh6）─────────────
// サンドクロック … 大砂流の 前ぶれ: 氷の 技が あれば 氷（止める）・なければ 身を 守る / 砂が のこり 2つ いかなら 氷で もどす
// ギアドン … 時を 覚えている 間は 雷の 技（大歯車を こわす）/ ギアプレスが 自分の 番より 先に 来る ときは 身を 守る
// （だれかが とても あぶない ときの 回復・生き返りは そのまま）
export function ch6Plan(b, c, decide) {
  if (c.side !== 'ally' || b.c6Inner) return null;
  const boss = b.aliveEnemies().find((e) => confOf(e));
  if (!boss) return null;
  const mine = 100 / atbRate(c);
  // ふつうの オート（家族が「オート」に した とき）も、大砂流・ギアプレスが 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  //   （b.c6Naive … シミュレーターで これも しない 人）
  if (!b.knowsCh6) {
    if (b.c6Naive || !BIG.has(boss.telegraph) || (100 - boss.atb) / atbRate(boss) > mine) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c6Inner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c6Inner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (boss.stars || boss.pend) return roadKnow(b, c, boss, base, { elemHit });
  if (boss.sand) {
    if (boss.telegraph === FALL) {
      const ice = b.c6NoIce ? null : elemHit(b, c, boss, 'ice');
      if (ice) return ice;
      if (!b.c6NoGuard) return { type: 'defend' };
    }
    if (!b.c6NoIce && boss.sand.lv <= 1) {
      const ice = elemHit(b, c, boss, 'ice');
      if (ice) return ice;
    }
  }
  if (boss.gear) {
    if (boss.telegraph === PRESS && !b.c6NoGuard && (100 - boss.atb) / atbRate(boss) <= mine) return { type: 'defend' };
    if (boss.gear.rec !== null && !b.c6NoBolt) {
      const bolt = elemHit(b, c, boss, 'bolt');
      if (bolt) return bolt;
    }
  }
  return base;
}

// その 属性の 技で いちばん ダメージの 大きい もの（なければ null）
export function elemHit(b, c, t, el) {
  let best = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !FOES.has(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (e.element !== el) continue;
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, el, true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    if (!best || dmg > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best?.cmd || null;
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
// 敵: 砂（sand・sandMax）・まきもどし（gearRec … 覚えている・gearLeft … まきもどしまで・gearHits … 当てた 雷・gearNeed）
export function ch6Pub(c) {
  if (c.side !== 'enemy') return {};
  const o = roadPub(c);
  if (c.sand) {
    o.sand = c.sand.lv;
    o.sandMax = c.sand.max;
  }
  if (c.gear) {
    o.gearRec = c.gear.rec !== null ? 1 : 0;
    o.gearLeft = c.gear.left;
    o.gearHits = c.gear.hits;
    o.gearNeed = gearConf(c)?.need ?? 2;
  }
  return o;
}
