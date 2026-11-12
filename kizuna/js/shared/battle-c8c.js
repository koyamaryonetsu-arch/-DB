// 第2部 第8章 第3幕「くろがねの 空中ようさい」の ボスの 戦いの しかけ（battle-c8b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・マジカメック（monsters-c8c.js の c8c.kind 'kamek'。Step 5 の さいごの 中ボス。子分 2ひきと いっしょ）「でっかくなあれ」
//   マジカメックが 動く たびに しるし（c.c8km.left）が へる。のこり grow.aimAt に なると、子分 1ぴきの 足もとに 魔法じん（前ぶれ・e.c8aimed）。
//   しるしが なくなった 次の マジカメックの 番に「でっかくなあれ」（m8k_grow）… 魔法じんの 子分が「デカ〜」に なる（HP grow.hp・攻撃力 grow.atk・
//   みんなを ふみつける）。魔法じんの 上の 子分は うける ダメージ grow.soft ばい。
//   その 前に 魔法じんの 子分を たおすと、次の 番に 魔法は から回り（m8k_fizzle「あれれ？」。その 番は 何も できない）。
//   から回りした 魔法は はね返って、マジカメックが「ちびカメック」に（tiny.turns 回 動く 間 うける ダメージ tiny.k ばい）。
//   子分が summon.below ひき より へると「出てこい子分」（m8k_summon。魔法じんの 間は よばない。summon.cd 回は よばない）。
//   HP が broomAt より へると、次の 番に「ほうきに のる」（m8k_broom。魔法が grow.broomEvery 回ごとに はやく なる・ほうきアタック）
// ・初代大魔王クッパード（c8c.kind 'bowser'。第3幕の さいごの ボス。2だん）
//   1だんめ（ふつう）: pound.every 回 動く たびに（しるし c.c8bw.left）「ドッスンヒップドロップ」（m8b_pound。みんなに 物理の 大技。身を 守ると 半分）
//   HP が gigaAt + 0.07 より へると、黒い星の かけらが 光る（前ぶれ）。gigaAt より へると、次の 番に「ギガクッパード」（m8b_giga）。
//     はじめて ギガに なるまで HP は gigaAt より 下がらない
//   2だんめ（ギガ）: うける ダメージ giga.cut ばい。giga.every 回 動く たびに「ギガほのお」（m8b_gigafire。みんなに 炎の 大技。身を 守ると 半分）。
//     ギガに なると「橋のオノ」（c8_axe。HP ＝ のこりの たたく 回数）が あらわれる。オノを ぶきで たたく たびに 1 へり（呪文では 動かない）、
//     0 に なると 橋が おちて、クッパードは ふつうの 大きさに もどる（最大HP の fall の ダメージ・次の 番は 動けない「あいたたた」）。
//     もどって giga.regrow 回 動くと、また ギガに なる（オノも また あらわれる。1つ前の 番に 前ぶれ）
// ・ふつうの オート（家族が「オート」に した とき）: 大技（ドッスンヒップドロップ・ギガほのお）が 自分の 次の 番より 先に 来る とき、
//   HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。b.c6Naive … しない 人）。魔法じんにも 橋のオノにも 気づかない
// ・知っている 人（シミュレーター tools/sim-ch8.mjs。b.knowsCh6）:
//   マジカメック … 魔法じんの 子分を いちばん 大きい 1回の 攻撃で たおしに いく（b.c8cNoAim … しない）
//   クッパード … 橋のオノが ある 間は ぶきで たたく（たたく 人が 足りて いれば ほかは ふつう。b.c8cNoAxe … しない）・大技の 前に 身を 守る（b.c6NoGuard）
import { MONSTERS } from './data/monsters.js?v=fdbb525d74d6';
import { ABILITIES } from './data/abilities.js?v=fdbb525d74d6';
import { C8_KAMEK, C8_BOWSER, C8_AXE, KAMEK_KIDS, GIGA_ACTIONS, BOWSER_ACTIONS, GIGA_KID_ACTION, GIGA_NAME } from './data/monsters-c8c.js?v=fdbb525d74d6';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=fdbb525d74d6';
import { canUse } from './ai.js?v=fdbb525d74d6';
import { AUTO_GUARD } from './battle-ch6.js?v=fdbb525d74d6';

export { C8_KAMEK, C8_BOWSER, C8_AXE };
export const GROW = 'm8k_grow';
export const SUMMON = 'm8k_summon';
export const BROOM = 'm8k_broom';
export const FIZZLE = 'm8k_fizzle';
export const BROOM_HIT = 'm8k_broomhit';
export const POUND = 'm8b_pound';
export const GIGA = 'm8b_giga';
export const GIGAFIRE = 'm8b_gigafire';
export const FALLEN = 'm8b_fallen';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);

const confOf = (m) => MONSTERS[m?.species]?.c8c || null;
export function kamekConf(m) {
  const c = confOf(m) || {};
  return {
    grow: { every: 4, broomEvery: 3, aimAt: 2, hp: 21000, atk: 1700, def: 1.2, soft: 2, ...(c.grow || {}) },
    summon: { kids: KAMEK_KIDS, cd: 2, below: 2, hp: 1.15, ...(c.summon || {}) },
    tiny: { turns: 2, k: 2, ...(c.tiny || {}) },
    broomAt: c.broomAt ?? 0.5,
  };
}
export function bowserConf(m) {
  const c = confOf(m) || {};
  return {
    pound: { every: 3, mult: 1.0, ignoreDef: 0.3, ...(c.pound || {}) },
    gigaAt: c.gigaAt ?? 0.5,
    giga: { atk: 1.12, cut: 0.7, every: 3, base: [560, 600], regrow: 5, fall: 0.05, axeHits: 3, ...(c.giga || {}) },
  };
}
const kamekOf = (b) => b.enemies.find((e) => e.c8km && e.alive) || null;
const bowserOf = (b) => b.enemies.find((e) => e.c8bw && e.alive) || null;
export const kidsAlive = (b) => b.enemies.filter((e) => e.c8kid && e.alive);
export const aimedKid = (b) => b.enemies.find((e) => e.c8kid && e.alive && e.c8aimed) || null;
export const axeOf = (b) => b.enemies.find((e) => e.c8ax && e.alive) || null;
export const growEvery = (c) => {
  const g = kamekConf(c).grow;
  return c.c8km?.broom ? g.broomEvery : g.every;
};
export const formOfB = (m) => m?.c8bw?.form || 0;

// マジカメックの 子分（魔法で 少し じょうぶ。HP summon.hp ばい）
function kidUp(km, m) {
  m.c8kid = true;
  m.maxHp = m.hp = Math.round(m.maxHp * kamekConf(km).summon.hp);
}

// ───────────── はじめ（battle-c8b.js の setupC8b の さいご）─────────────
export function setupC8c(b) {
  const lines = [];
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'kamek') {
      e.c8km = { left: kamekConf(e).grow.every, aim: null, broom: false, summonCd: 0, tiny: 0, grows: 0, fizzles: 0, summons: 0 };
      for (const k of b.enemies) if (KAMEK_KIDS.includes(k.species)) kidUp(e, k);
      lines.push(`${e.name}「ヒッヒッヒ…大魔王さまのじゃまは、させませんぞ！」`, '（マジカメックが、子分に魔法をかけようとしたら、先にその子分をたおそう…！）');
    }
    if (conf.kind === 'bowser') {
      e.c8bw = { form: 1, left: bowserConf(e).pound.every, flicker: false, fallen: false, everGiga: false, regrow: 0, axe: null, atk0: e.atk, gigas: 0, falls: 0, pounds: 0, fires: 0 };
      lines.push(`${e.name}「ガッハッハ！ワガハイこそ、空の大魔王クッパードさまだ！」`, '（まわりは、ようさいの大橋…はしっこに、大きなオノがある…）');
    }
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
}

// ───────────── 行動の はじめ（battle-c8b.js の c8bTurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c8cTurnStart(b, c, ev, stuck) {
  if (c.c8km) kamekTurn(b, c, ev, stuck);
  else if (c.c8bw) bowserTurn(b, c, ev, stuck);
}

function kamekTurn(b, c, ev, stuck) {
  const k = c.c8km;
  const kc = kamekConf(c);
  if (c.telegraph) return;
  // ほうきに のる（HP が broomAt より へった）
  if (!k.broom && c.hp / c.maxHp < kc.broomAt) {
    if (!stuck) c.telegraph = BROOM;
    ev.upd.push(c);
    return;
  }
  if (k.summonCd > 0) k.summonCd--;
  // ちびカメック（魔法が はね返って ちぢんだ）の のこり
  if (k.tiny > 0) {
    k.tiny--;
    if (k.tiny === 0) post(ev).push(`${c.name}は、ポン！ともとの大きさにもどった。`);
  }
  // 魔法じんの 子分が もう いない: から回り（あれれ？）
  if (k.aim) {
    const t = b.get(k.aim);
    if (!t?.alive || t.c8giga) {
      if (!stuck) c.telegraph = FIZZLE;
      ev.upd.push(c);
      return;
    }
    // 魔法じんの 子分に「でっかくなあれ」
    if (k.left <= 1) {
      if (!stuck) c.telegraph = GROW;
      ev.upd.push(c);
      return;
    }
  }
  // 子分が へった: よぶ（魔法じんの 間は よばない）
  if (!k.aim && kidsAlive(b).length < kc.summon.below && k.summonCd <= 0) {
    if (!stuck) c.telegraph = SUMMON;
    ev.upd.push(c);
    return;
  }
  k.left = Math.min(k.left, growEvery(c));
  if (k.left > 1) k.left--;
  if (k.aim && k.left === 1) {
    const t = b.get(k.aim);
    ev.lines.push(`${t.name}の足もとの魔法じんが、強く光り出した…！`, `（次にマジカメックが動くと、${t.name}が大きくなってしまう…！）`);
  }
  if (!k.aim && k.left <= kc.grow.aimAt) {
    const pool = kidsAlive(b).filter((e) => !e.c8giga);
    if (pool.length) {
      const t = pool[b.rng.int(0, pool.length - 1)];
      k.aim = t.id;
      t.c8aimed = true;
      ev.lines.push(`${c.name}がつえをふると、${t.name}の足もとに、魔法じんがうかび上がった…！`, `（もうすぐ、${t.name}が大きくされてしまう…！先にたおせ！）`);
      ev.c8cAim = { id: c.id, who: t.id };
      ev.upd.push(t);
    } else k.left = kc.grow.aimAt + 1;
  }
  ev.c8cGrowLeft = { id: c.id, left: k.left, every: growEvery(c) };
  ev.upd.push(c);
}

function bowserTurn(b, c, ev, stuck) {
  const w = c.c8bw;
  const bc = bowserConf(c);
  if (c.telegraph) return;
  // 橋から おちて 目を まわしている（1回 動けない）
  if (w.fallen) {
    w.fallen = false;
    if (!stuck) c.telegraph = FALLEN;
    ev.upd.push(c);
    return;
  }
  if (w.form === 1) {
    // はじめて ギガに なる（HP）・もどってから また ギガに なる（行動の 数）
    if ((!w.everGiga && c.hp / c.maxHp < bc.gigaAt) || (w.regrow > 0 && w.regrow <= 1)) {
      if (!stuck) c.telegraph = GIGA;
      ev.upd.push(c);
      return;
    }
    if (w.regrow > 1) {
      w.regrow--;
      if (w.regrow === 1) ev.lines.push(`${c.name}のむねで、黒い星のかけらが、また光り出した…！`, '（次にクッパードが動くと、また、ギガクッパードになる…！）');
      ev.c8cRegrow = { id: c.id, left: w.regrow };
    }
    if (w.left <= 1) {
      if (!stuck) c.telegraph = POUND;
    } else {
      w.left--;
      if (w.left === 1) ev.lines.push(`${c.name}が、ひざをまげて、ぐっとしゃがみこんだ…！`, '（次にクッパードが動くと、ドッスンヒップドロップ…！身を守れ！）');
      ev.c8cPoundLeft = { id: c.id, left: w.left, every: bc.pound.every };
    }
    ev.upd.push(c);
    return;
  }
  // 2だんめ（ギガ）: ギガほのおまで
  if (w.left <= 1) {
    if (!stuck) c.telegraph = GIGAFIRE;
  } else {
    w.left--;
    if (w.left === 1) ev.lines.push(`${c.name}の口の中が、まっ赤にかがやき始めた…！`, '（次にギガクッパードが動くと、ギガほのお…！身を守るか、橋のオノを、ぶきでたたけ！）');
    ev.c8cFireLeft = { id: c.id, left: w.left, every: bc.giga.every };
  }
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-c8b.js の c8bEffect の のこり）─────────────
export function c8cEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c8cGrow': grow(b, c, ev); return true;
    case 'c8cFizzle': fizzle(b, c, ev); return true;
    case 'c8cSummon': summon(b, c, ev); return true;
    case 'c8cBroom': broom(b, c, ev); return true;
    case 'c8cPound': pound(b, c, ev); return true;
    case 'c8cGiga': giga(b, c, ev); return true;
    case 'c8cGigaFire': gigaFire(b, c, ev); return true;
    case 'c8cFallen': ev.c8cFallenAct = { id: c.id }; return true;
    default: return false;
  }
}

// でっかくなあれ（魔法じんの 子分が デカ〜に なる）
function grow(b, c, ev) {
  const k = c.c8km;
  const t = k?.aim ? b.get(k.aim) : null;
  if (k) {
    k.aim = null;
    k.left = growEvery(c);
  }
  if (!t?.alive || t.c8giga) return fizzle(b, c, ev);
  t.c8aimed = false;
  const g = kamekConf(c).grow;
  t.c8giga = true;
  t.name = `デカ${t.name}`;
  t.maxHp = Math.max(t.maxHp, g.hp);
  t.hp = t.maxHp;
  t.atk = Math.max(t.atk, g.atk);
  t.dfn = Math.round(t.dfn * g.def);
  t.actions = [{ ...GIGA_KID_ACTION }, ...t.actions];
  if (k) k.grows++;
  ev.fx = { type: 'ability', anim: 'c8k_grow', actor: c.id, targets: [t.id], side: 'enemy' };
  ev.lines.push('魔法じんが、ピカーッと光った！', `${t.name.slice(2)}が、むくむくむく…と、大きくなった！`);
  post(ev).push(`（${t.name}のHPと攻撃力が、とても上がった…！）`);
  ev.c8cGrow = { id: c.id, who: t.id };
  ev.warn = true;
  ev.upd.push(c, t);
}

// 魔法の から回り（魔法じんの 子分が もう いない）: 魔法が はね返って、マジカメックが ちぢむ（tiny.turns 回 動く 間 うける ダメージ tiny.k ばい）
function fizzle(b, c, ev) {
  const k = c.c8km;
  const tc = kamekConf(c).tiny;
  if (k) {
    k.aim = null;
    k.left = growEvery(c);
    k.fizzles++;
    k.tiny = tc.turns + 1;
  }
  for (const e of b.enemies) e.c8aimed = false;
  ev.fx = { type: 'ability', anim: 'c8k_fizzle', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('しかし、魔法をかける子分が、もういない！', '魔法がはね返って、マジカメックが、ちっちゃくなった！');
  post(ev).push(`（ちびカメックは、ダメージが${tc.k}倍！今のうちに攻撃だ！）`);
  ev.c8cFizzle = { id: c.id, k: tc.k };
  ev.upd.push(c);
}

// 出てこい子分（子分を 2ひきまで よぶ）
function summon(b, c, ev) {
  const k = c.c8km;
  const kc = kamekConf(c);
  if (k) {
    k.summonCd = kc.summon.cd;
    k.summons++;
  }
  const alive = kidsAlive(b);
  const room = Math.min(2 - alive.length, 7 - b.aliveEnemies().length);
  ev.fx = { type: 'ability', anim: 'c8k_summon', actor: c.id, targets: [c.id], side: 'enemy' };
  if (room <= 0) {
    ev.lines.push('しかし、だれも来なかった！');
    return;
  }
  const want = kc.summon.kids.filter((sp) => !alive.some((e) => e.species === sp));
  const list = [...want, ...kc.summon.kids].slice(0, room);
  const added = b.addEnemies(list);
  for (const m of added) {
    kidUp(c, m);
    m.atb = b.rng.float(0, 30);
  }
  ev.lines.push(added.length > 1 ? `${added.map((m) => m.name).join('と')}が、とびこんできた！` : `${added[0].name}が、とびこんできた！`);
  ev.joined = (ev.joined || []).concat(added.map(pub));
  ev.c8cSummon = { id: c.id, who: added.map((m) => m.id) };
  ev.upd.push(c);
}

// ほうきに のる（魔法が はやく なる・ほうきアタック）
function broom(b, c, ev) {
  const k = c.c8km;
  if (!k || k.broom) return;
  k.broom = true;
  k.left = Math.min(k.left, growEvery(c));
  c.actions = [{ w: 3, id: BROOM_HIT, cond: `notRecent:${BROOM_HIT}` }, ...c.actions];
  ev.fx = { type: 'ability', anim: 'c8k_broom', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push(`${c.name}は、ほうきにのって、空へまい上がった！`);
  post(ev).push('（でっかくなあれの魔法が、速くなった…！魔法じんに気をつけろ！）');
  ev.c8cBroom = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// みんなへの 物理の 大技（身を 守ると 半分）
function physAll(b, c, mult, ignoreDef, ev) {
  const targets = b.aliveAllies();
  for (const t of targets) b.physHit(c, t, { mult, ignoreDef, acc: 1.2 }, ev, 'phys');
  return targets;
}

// ドッスンヒップドロップ
function pound(b, c, ev) {
  const w = c.c8bw;
  const pc = bowserConf(c).pound;
  if (w) {
    w.left = pc.every;
    w.pounds++;
  }
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c8w_pound', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  ev.lines.push(`${c.name}が、ドッスーン！と、おしりからおちてきた！`, '橋が、ぐらぐらとゆれた！');
  physAll(b, c, pc.mult, pc.ignoreDef, ev);
  ev.c8cPound = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// ギガクッパード（2だんめ）: 大きく なる・橋の オノが あらわれる
function giga(b, c, ev) {
  const w = c.c8bw;
  const gc = bowserConf(c).giga;
  if (!w || w.form === 2) return;
  w.form = 2;
  w.everGiga = true;
  w.regrow = 0;
  w.flicker = false;
  w.left = gc.every;
  w.gigas++;
  c.name = GIGA_NAME;
  c.actions = GIGA_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(w.atk0 * gc.atk);
  ev.fx = { type: 'ability', anim: 'c8w_giga', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('黒い星のかけらが、ぎらりと光った…！', 'クッパードの体が、ぐんぐんぐんぐん大きくなった！', 'ギガクッパードがあらわれた！');
  // 橋の オノ（はじめは 新しく・2回目からは また あらわれる）
  let axe = w.axe ? b.get(w.axe) : null;
  if (axe) {
    Object.assign(axe, { alive: true, hp: axe.maxHp, ready: false, queued: false, status: {}, buffs: {}, debuffs: {}, telegraph: null });
    axe.atb = 0;
  } else if (b.aliveEnemies().length < 7) {
    [axe] = b.addEnemies([C8_AXE]);
    axe.maxHp = axe.hp = gc.axeHits;
    axe.c8ax = { by: c.id };
    axe.atb = 0;
    w.axe = axe.id;
    ev.joined = (ev.joined || []).concat([pub(axe)]);
  }
  if (axe) {
    post(ev).push(`（ギガクッパードは、かたくて、ダメージが通りにくい…！でも、橋のはしに、大きなオノがある…！ぶきで${gc.axeHits}回たたけば、橋がおちるかも…！）`);
    ev.upd.push(axe);
  }
  ev.c8cGiga = { id: c.id, axe: axe?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

// ギガほのお（みんなに 炎の 大技。身を 守ると 半分）
function gigaFire(b, c, ev) {
  const w = c.c8bw;
  const gc = bowserConf(c).giga;
  if (w) {
    w.left = gc.every;
    w.fires++;
  }
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c8w_gigafire', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: 'fire' };
  for (const t of targets) {
    const r = b.calcMagic(c, t, { base: gc.base, thr: 99, element: 'fire' }, 1);
    let dmg = r.dmg;
    if (t.defending) dmg = Math.round(dmg * 0.67);
    if (r.resisted || dmg <= 0) {
      ev.lines.push(`${t.name}はダメージを受けない！`);
      continue;
    }
    b.damage(c, t, dmg, ev, { element: 'fire' });
  }
  ev.c8cGigaFire = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// 橋が おちる（オノを たたききった）: ギガクッパードは 下へ おちて ふつうの 大きさに もどる
function fall(b, h, by, ev) {
  const w = h.c8bw;
  const bc = bowserConf(h);
  w.form = 1;
  w.fallen = true;
  w.falls++;
  w.regrow = bc.giga.regrow;
  w.left = bc.pound.every;
  h.name = MONSTERS[h.species].name;
  h.actions = BOWSER_ACTIONS.map((x) => ({ ...x }));
  h.atk = w.atk0;
  if (h.telegraph) h.telegraph = null;
  b.queue = b.queue.filter((q) => q.id !== h.id);
  h.queued = false;
  const d = Math.max(0, Math.min(h.hp - 1, Math.round(h.maxHp * bc.giga.fall)));
  h.hp -= d;
  if (!ev) return;
  ev.results = ev.results || [];
  if (d > 0) ev.results.push({ id: h.id, dmg: d });
  post(ev).push('ガラガラガラ…！橋が、くずれおちた！', `${MONSTERS[h.species].short || h.name}「うおおおおっ！？」`, `${h.name}は、下へおちて、もとの大きさにもどった！${d > 0 ? `（${d}のダメージ！）` : ''}`, '（クッパードは、目を回している！今のうちに攻撃だ！）');
  ev.c8cFall = { id: h.id, by: by?.id || null, dmg: d };
  ev.upd.push(h);
}

// ───────────── ダメージ（battle-c8b.js の c8bDamage の はじめ。味方 → 敵 だけ）─────────────
// 橋の オノ: ぶきで たたくと 1 へる（呪文では 動かない）／ギガクッパード: うける ダメージ cut ばい／はじめて ギガに なる 前は HP が 下がりきらない
export function c8cDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally') return dmg;
  // 魔法じんの 上の 子分は、魔法を うける じゅんびで 体が やわらかい（ダメージ grow.soft ばい）
  if (t.c8kid && t.c8aimed) {
    const km = kamekOf(b);
    dmg = Math.round(dmg * (km ? kamekConf(km).grow.soft : 1.5));
    if (!ev.c8cSoft) {
      ev.c8cSoft = true;
      post(ev).push(`（魔法じんの上の${t.name}は、ぐにゃぐにゃして、ダメージが大きい！）`);
    }
    return dmg;
  }
  if (t.c8ax) {
    if (!info.phys) {
      if (!ev.c8cAxeMagic) {
        ev.c8cAxeMagic = true;
        post(ev).push('（橋のオノは、呪文では動かない…！ぶきでたたこう！）');
      }
      return 0;
    }
    const left = t.hp - 1;
    ev.c8cAxeHit = { id: t.id, left };
    if (left > 0) post(ev).push(`橋のオノが、ぐらりとかたむいた！（あと${left}回！）`);
    return 1;
  }
  // ちびカメック: ダメージ tiny.k ばい
  if (t.c8km?.tiny > 0) return Math.round(dmg * kamekConf(t).tiny.k);
  const w = t.c8bw;
  if (!w) return dmg;
  const bc = bowserConf(t);
  if (w.form === 2) {
    dmg = Math.max(1, Math.round(dmg * bc.giga.cut));
    if (!ev.c8cCut) {
      ev.c8cCut = true;
      post(ev).push('ギガクッパードの体は、かたくて、ダメージが通りにくい…！');
    }
    return dmg;
  }
  if (!w.everGiga) {
    const floor = Math.ceil(t.maxHp * bc.gigaAt - 1e-6) - 1;
    if (t.hp - dmg < floor) dmg = Math.max(0, t.hp - floor);
    // 黒い星の かけらが 光る（ギガに なる 前ぶれ）
    if (!w.flicker && (t.hp - dmg) / t.maxHp < bc.gigaAt + 0.07) {
      w.flicker = true;
      post(ev).push(`${t.name}のむねで、黒い星のかけらが、あやしく光り始めた…！（もうすぐ、何かが起こりそうだ…！）`);
      ev.c8cFlicker = { id: t.id };
      ev.upd.push(t);
    }
  }
  return dmg;
}

// ───────────── たおれた（battle-c8b.js の c8bKill の はじめ）─────────────
// 魔法じんの 子分が たおれた・橋の オノが たおれた（橋が おちる）
export function c8cKill(b, t, ev) {
  if (t?.c8kid && t.c8aimed) {
    t.c8aimed = false;
    if (ev) {
      post(ev).push('魔法じんが、すうっと消えた！（でっかくなあれの魔法は、から回りするはずだ！）');
      ev.c8cAimGone = { id: t.id };
    }
  }
  if (t?.c8ax) {
    const h = bowserOf(b);
    if (h?.c8bw?.form === 2) fall(b, h, null, ev);
  }
}

// ───────────── 大技が 近いか ─────────────
// その 敵が c の 次の 番までに 何回 動くか
function actsBefore(b, c, e) {
  if (!e?.alive) return 0;
  const re = atbRate(e);
  if (!(re > 0)) return 0;
  const mine = 100 / atbRate(c);
  const t0 = e.ready || e.queued ? 0 : (100 - e.atb) / re;
  if (t0 > mine) return 0;
  return 1 + Math.floor((mine - t0) / (100 / re));
}
// クッパードの 大技（ドッスンヒップドロップ・ギガほのお）が c の 次の 番より 先に 来るか
export function bowserBigBefore(b, c, h = bowserOf(b)) {
  const w = h?.c8bw;
  if (!w || w.fallen) return false;
  if (h.telegraph === POUND || h.telegraph === GIGAFIRE) return true;
  if (h.telegraph) return false;
  if (w.form === 1 && ((!w.everGiga && h.hp / h.maxHp < bowserConf(h).gigaAt) || (w.regrow > 0 && w.regrow <= 1))) return false;
  return actsBefore(b, c, h) >= w.left;
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。{ cmd, dmg }）
function bestHit(b, c, t) {
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || a.target !== 'enemy' || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element || 'phys', true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    if (dmg > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best;
}

// ───────────── オート（battle-c8b.js の c8bPlan の はじめ）─────────────
// 第8章 第3幕の ボスが いなければ null（ほかの ボスの 考えへ）
export function c8cPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c8cInner || c.status?.rift) return null;
  const km = kamekOf(b);
  const h = bowserOf(b);
  if (!km && !h) return null;
  const soon = h ? bowserBigBefore(b, c, h) : false;
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c8cInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c8cInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (km) {
    // 魔法じんの 子分を たおしに いく（全体の 攻撃なら そのまま）
    const t = aimedKid(b);
    if (t && !b.c8cNoAim) {
      if (a && FOES.has(a.target) && a.target !== 'enemy' && ['phys', 'magic'].includes(prim(a).type)) return base;
      const hit = bestHit(b, c, t);
      if (hit.dmg > 0) return hit.cmd;
    }
    return base;
  }
  // 橋の オノを ぶきで たたく（ほかの 人の たたく 番が 足りて いる ときは ふつう）
  const axe = axeOf(b);
  if (axe && !b.c8cNoAxe) {
    const coming = b.queue.filter((q) => q.cmd?.type === 'attack' && q.cmd.target === axe.id).length;
    if (coming < axe.hp) return { type: 'attack', target: axe.id };
  }
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-c8b.js の c8bPub の さいご）─────────────
// マジカメック: kmForm（1 ふつう・2 ほうき）・growLeft・growEvery（でっかくなあれまで）／子分: aimed（魔法じん）・giga（デカ）
// クッパード: bwForm（1 ふつう・2 ギガ）・poundLeft・poundEvery・fireLeft・fireEvery・flicker・regrowLeft・fallen／橋の オノ: axeLeft・axeMax
export function c8cPub(c, o) {
  // がめんは まえの ようすに 上書きで まぜる（client/battle.js の Object.assign）ので、なくなった しるしも 0 で おくる
  if (c.c8km) {
    const k = c.c8km;
    o.kmForm = k.broom ? 2 : 1;
    o.growLeft = k.aim ? 1 : k.left;
    o.growEvery = growEvery(c);
    o.tiny = k.tiny > 0 ? 1 : 0;
    o.tinyK = kamekConf(c).tiny.k;
  }
  if (c.c8kid) {
    o.aimed = c.c8aimed ? 1 : 0;
    o.giga = c.c8giga ? 1 : 0;
  }
  if (c.c8bw) {
    const w = c.c8bw;
    const bc = bowserConf(c);
    const g = w.form === 2;
    o.bwForm = w.form;
    o.poundLeft = g ? 0 : w.left;
    o.poundEvery = g ? 0 : bc.pound.every;
    o.fireLeft = g ? w.left : 0;
    o.fireEvery = g ? bc.giga.every : 0;
    o.flicker = !g && !w.everGiga && w.flicker ? 1 : 0;
    o.regrowLeft = !g && w.regrow > 0 ? w.regrow : 0;
    o.fallen = w.fallen ? 1 : 0;
  }
  if (c.c8ax) {
    o.axeLeft = c.alive ? c.hp : 0;
    o.axeMax = c.maxHp;
  }
}
void C8_KAMEK; void C8_BOWSER;
