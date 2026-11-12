// 第2部 第8章 第2幕「よみの 青い火」の ボスの 戦いの しかけ（battle-c8a.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・ペイニックと パニクル（monsters-c8b.js の c8b.kind 'imps'。Step 3 の さいごの 中ボス。2ひきで 1組）「ばけばけ大作戦」
//   2ひきとも 生きている 間は、どちらかが 1回 動く たびに「ばけばけ」の しるし（b.c8imps.left）が 1つ へる。のこり imps.plot いかは「ひそひそ相談」:
//   その 間に どちらかに、1回の 行動で その 魔物の HP の breakAt いじょうの ダメージを 当てると、作戦が ばれて「けんか」
//   （2ひきとも 次の 番は 動けない・しるしは もどる）。しるしが なくなると「ばけばけ大がったい」（m8i_fuse。みんなに 物理の 大技。身を 守ると 半分）
//   かたほうが たおれると、のこった ほうは「パニック」: panic.turns 回 動く 間 あたふた して（何も できない）、受ける ダメージが panic.k ばい。
//   その 間に たおせないと「カンカン」（攻撃力 rage.atk ばい・はやさ rage.spd ばい）。rage.every 回 動く たびに「ひとりばけばけ」（m8i_solo）
// ・よみの王ハデロス（c8b.kind 'hades'。第2幕の さいごの ボス。2だん）
//   1だんめ（青い 炎。氷に 弱く 炎に 強い）「たましいのけいやく」: contract.every 回 動く たびに（しるし c.c8hd.left）1人に けいやくしょ（m8h_contract）。
//     ハデロスが 動く たびに その 人の HP を drain ずつ すいとり、contract.turns 回 すいとった 次の 番に「たましいを いただく」（m8h_soul。その 人は たおれる）。
//     けいやくの 間に ハデロスに 炎を 当てると（炎は あまり 効かないが）、けいやくしょが もえる（その 人は 助かる・ハデロスは あちちっと 1回 動けない）。けいやくの 間は しるしは すすまない
//   HP が p2At + 0.08 より へると、かみの毛の 炎が 赤く ちらちら（前ぶれ）。p2At より へると、次の 番に「おこったハデロス」（m8h_anger）。
//     それまで HP は p2At より 下がらない。けいやくしょは おこった 炎で もえて しまう
//   2だんめ（赤い 炎。炎に 弱く 氷に 強い。弱点が ひっくりかえる）「よみの大ふん火」: erupt.every 回 動く たびに（しるし c.c8hd.left）m8h_erupt
//     （みんなに 炎の 大技。身を 守ると 半分）。ふん火の 前ぶれ（しるし のこり 1）の 間に 氷を 当てると（氷は あまり 効かないが）、頭が ひえて ふん火が しぼむ（次の 番は 動けない・しるしは もどる）。
//     HP が erupt.p3At より へると every が erupt.p3Every に
// ・ふつうの オート（家族が「オート」に した とき）: 大技（大がったい・ひとりばけばけ・たましいを いただく〈その 人〉・大ふん火）が 自分の 次の 番より 先に
//   来る とき、HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ。b.c6Naive … しない 人）
// ・知っている 人（シミュレーター tools/sim-ch8.mjs。b.knowsCh6）:
//   小おに … 相談の 間は いちばん 大きい 1回の 攻撃を 1ぴきに 当てる（b.c8bNoPlot … しない）・パニックの 小おにを ねらう・2ひきの HP を
//     そろえて へらす（HP の 多い ほうを ねらう。b.c8bNoOrder … しない）・大がったいの 前に 身を 守る（b.c6NoGuard）
//   ハデロス … けいやくの 間は 炎を 当てる（b.c8bNoBurn）・ふん火の 前ぶれに 氷を 当てる（b.c8bNoChill）・大ふん火の 前に 身を 守る（b.c6NoGuard）
import { MONSTERS } from './data/monsters.js?v=3b960a0fc297';
import { ABILITIES } from './data/abilities.js?v=3b960a0fc297';
import { C8_PAIN, C8_PANIC, C8_HADES, HADES_BLUE, HADES_RED, RED_ACTIONS } from './data/monsters-c8b.js?v=3b960a0fc297';
import { BUFF_ACTS } from './buff-acts.js?v=3b960a0fc297';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=3b960a0fc297';
import { canUse } from './ai.js?v=3b960a0fc297';
import { AUTO_GUARD } from './battle-ch6.js?v=3b960a0fc297';
// 第2部 第8章 第3幕: マジカメック（でっかくなあれ）・初代大魔王クッパード（ギガクッパード・橋のオノ）。battle-c8c.js
import { setupC8c, c8cTurnStart, c8cEffect, c8cPlan, c8cPub, c8cDamage, c8cKill } from './battle-c8c.js?v=3b960a0fc297';

export { C8_PAIN, C8_PANIC, C8_HADES };
export const FUSE = 'm8i_fuse';
export const QUARREL = 'm8i_quarrel';
export const PANIC = 'm8i_panic';
export const RAGE = 'm8i_rage';
export const SOLO = 'm8i_solo';
export const CONTRACT = 'm8h_contract';
export const SOUL = 'm8h_soul';
export const HOT = 'm8h_hot';
export const ANGER = 'm8h_anger';
export const ERUPT = 'm8h_erupt';
export const COOL = 'm8h_cool';
export const RED_NAME = 'おこったハデロス';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);

const confOf = (m) => MONSTERS[m?.species]?.c8b || null;
export function impsConf(m) {
  const c = confOf(m)?.imps || {};
  return {
    every: 5, plot: 2, breakAt: 0.07, ...c,
    fuse: { mult: 0.95, ignoreDef: 0.3, ...(c.fuse || {}) },
    panic: { turns: 3, k: 1.5, ...(c.panic || {}) },
    rage: { atk: 1.3, spd: 1.25, every: 3, mult: 0.85, ...(c.rage || {}) },
  };
}
export function hadesConf(m) {
  const c = confOf(m) || {};
  return {
    contract: { every: 4, turns: 2, drain: 0.12, heal: 0.008, soulHeal: 0.04, ...(c.contract || {}) },
    p2At: c.p2At ?? 0.5,
    red: { atk: 1.08, ...(c.red || {}) },
    erupt: { every: 3, p3At: 0.2, p3Every: 2, base: [380, 410], chillAt: 1, ...(c.erupt || {}) },
  };
}
const short = (m) => MONSTERS[m?.species]?.short || m?.name || '';
export const impsOf = (b) => b.enemies.filter((e) => e.c8imp);
const aliveImps = (b) => impsOf(b).filter((e) => e.alive);
export const bothUp = (b) => aliveImps(b).length >= 2;
const partnerOf = (b, c) => impsOf(b).find((e) => e !== c) || null;
const hadesOf = (b) => b.enemies.find((e) => e.c8hd && e.alive) || null;
export const formOfH = (m) => m?.c8hd?.form || 0;
// ひそひそ相談の 間か（2ひきとも 生きていて、しるしが plot いか・けんかの 間は ない）
export function plotting(b) {
  const s = b.c8imps;
  if (!s || !bothUp(b)) return false;
  if (aliveImps(b).some((e) => e.c8imp.quarrel)) return false;
  return s.left <= impsConf(aliveImps(b)[0]).plot;
}
const soloEvery = (c) => impsConf(c).rage.every;
const eruptEvery = (c) => {
  const e = hadesConf(c).erupt;
  return c.hp / c.maxHp < e.p3At ? e.p3Every : e.every;
};
// ふん火の 前ぶれ（しるし のこり 1。次の 番が ふん火）
//   （しるし のこり erupt.chillAt いか … かみの 毛が 高く もえて いる 間は 氷で ひやせる）
export const eruptSoon = (h) => !!h?.c8hd && h.c8hd.form === 2 && !h.c8hd.cool && h.c8hd.left <= hadesConf(h).erupt.chillAt;
// けいやくされて いる 人
export function bound(b, h = hadesOf(b)) {
  const id = h?.c8hd?.contract?.id;
  const x = id ? b.get(id) : null;
  return x?.alive ? x : null;
}

// ───────────── はじめ（battle-c8a.js の setupC8a の さいご）─────────────
export function setupC8b(b) {
  const lines = [];
  let imps = 0;
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'imps') {
      e.c8imp = { role: conf.role, quarrel: false, panic: 0, rage: false, left: 0 };
      imps++;
    }
    if (conf.kind === 'hades') {
      e.c8hd = { form: 1, left: hadesConf(e).contract.every, contract: null, hot: false, cool: false, flicker: false, contracts: 0, burns: 0, souls: 0, erupts: 0, cools: 0 };
      lines.push(`${e.name}「やあやあ、ようこそ、よみの国へ！ゆっくりしていきなよ。…ずーっとね！」`, '（ハデロスのかみの毛は、青い炎…！青い炎のときは、氷がよく効きそうだ…！）');
    }
  }
  if (imps) {
    const any = impsOf(b)[0];
    const ic = impsConf(any);
    b.c8imps = { left: ic.every, every: ic.every, plotAt: ic.plot, both: bothUp(b), quarrel: false, fuses: 0, quarrels: 0, panics: 0, rages: 0, solos: 0 };
    // がめんへ（pub）: 2ひきとも おなじ しるしを 見る
    for (const e of impsOf(b)) e.c8imp.s = b.c8imps;
    lines.push('ペイニック「いくぞ、パニクル！」', 'パニクル「お、おう、ペイニック！」', '（2ひきが、ひそひそ相談を始めたら、強い一撃でじゃまをしよう…！）');
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
  // 第8章 第3幕の ボス（battle-c8c.js）
  setupC8c(b);
}

// ───────────── 行動の はじめ（battle-c8a.js の c8aTurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c8bTurnStart(b, c, ev, stuck) {
  // 第8章 第3幕（battle-c8c.js）
  c8cTurnStart(b, c, ev, stuck);
  if (c.c8imp) impTurn(b, c, ev, stuck);
  else if (c.c8hd) hadesTurn(b, c, ev, stuck);
}

function impTurn(b, c, ev, stuck) {
  const me = c.c8imp;
  const s = b.c8imps;
  const ic = impsConf(c);
  if (c.telegraph || !s) return;
  // けんかの あいだ（1回 動けない）
  if (me.quarrel) {
    me.quarrel = false;
    s.quarrel = aliveImps(b).some((e) => e.c8imp.quarrel);
    if (!stuck) c.telegraph = QUARREL;
    ev.upd.push(c);
    return;
  }
  if (bothUp(b)) {
    if (s.left <= 1) {
      if (!stuck) c.telegraph = FUSE;
      ev.upd.push(...aliveImps(b));
      return;
    }
    s.left--;
    if (s.left === ic.plot) ev.lines.push('ペイニックとパニクルが、ひそひそ相談を始めた…', '（今、どちらかに強い一撃を当てれば、作戦をじゃまできそうだ…！）');
    if (s.left === 1) ev.lines.push('2ひきが、目を合わせて、にやりとわらった…！', '（次にどちらかが動くと、ばけばけ大がったい…！じゃまするか、身を守れ！）');
    ev.c8bImpLeft = { id: c.id, left: s.left, every: s.every, plot: s.left <= ic.plot };
    ev.upd.push(...aliveImps(b));
    return;
  }
  // ひとりに なった: パニック → カンカン → ひとりばけばけ
  if (me.panic > 0) {
    me.panic--;
    if (!stuck) c.telegraph = PANIC;
    if (me.panic === 0) post(ev).push(`（${c.name}が、だんだん顔を赤くしてきた…！次は、カンカンにおこるぞ！）`);
    ev.c8bPanicLeft = { id: c.id, left: me.panic };
    ev.upd.push(c);
    return;
  }
  if (!me.rage) {
    if (!stuck) c.telegraph = RAGE;
    ev.upd.push(c);
    return;
  }
  me.left = Math.min(me.left || soloEvery(c), soloEvery(c));
  if (me.left <= 1) {
    if (!stuck) c.telegraph = SOLO;
  } else {
    me.left--;
    if (me.left === 1) ev.lines.push(`${c.name}が、ぷくーっと大きくふくらみ始めた…！`, `（次に${c.name}が動くと、ひとりばけばけ…！身を守れ！）`);
    ev.c8bSoloLeft = { id: c.id, left: me.left, every: soloEvery(c) };
  }
  ev.upd.push(c);
}

function hadesTurn(b, c, ev, stuck) {
  const h = c.c8hd;
  const hc = hadesConf(c);
  if (c.telegraph) return;
  // けいやくしょが もえて あちちっ・頭が ひえた（1回 動けない）
  if (h.hot) {
    h.hot = false;
    if (!stuck) c.telegraph = HOT;
    ev.upd.push(c);
    return;
  }
  if (h.cool) {
    h.cool = false;
    if (!stuck) c.telegraph = COOL;
    ev.upd.push(c);
    return;
  }
  if (h.form === 1) {
    if (c.hp / c.maxHp < hc.p2At) {
      if (!stuck) c.telegraph = ANGER;
      ev.upd.push(c);
      return;
    }
    // けいやくの あいだ: HP を すいとる → たましいを いただく
    if (h.contract) {
      const x = bound(b, c);
      if (!x) h.contract = null;
      else if (h.contract.left <= 0) {
        if (!stuck) c.telegraph = SOUL;
        ev.upd.push(c);
        return;
      } else {
        drain(b, c, x, ev);
        ev.upd.push(c);
        return;
      }
    }
    if (h.left <= 1) {
      if (!stuck) c.telegraph = CONTRACT;
    } else {
      h.left--;
      if (h.left === 1) ev.lines.push(`${c.name}が、ふところから、まき物をとり出した…`, '（次にハデロスが動くと、たましいのけいやく…！けいやくしょは、炎でもえるはずだ！）');
      ev.c8bContractLeft = { id: c.id, left: h.left, every: hc.contract.every };
    }
    ev.upd.push(c);
    return;
  }
  // 2だんめ: よみの大ふん火まで
  h.left = Math.min(h.left, eruptEvery(c));
  if (h.left <= 1) {
    if (!stuck) c.telegraph = ERUPT;
  } else {
    h.left--;
    const ca = hadesConf(c).erupt.chillAt;
    if (h.left === ca && ca > 1) ev.lines.push(`${c.name}のかみの毛が、ぐんぐん高くなってきた…！`, '（もうすぐ、よみの大ふん火…！今のうちに、氷で頭をひやせ！）');
    if (h.left === 1) ev.lines.push(`${c.name}のかみの毛が、ごうごうと、高くもえ上がった…！`, '（次にハデロスが動くと、よみの大ふん火…！氷で頭をひやすか、身を守れ！）');
    ev.c8bEruptLeft = { id: c.id, left: h.left, every: eruptEvery(c) };
  }
  ev.upd.push(c);
}

// けいやくした 人の HP を すいとる
function drain(b, c, x, ev) {
  const h = c.c8hd;
  const hc = hadesConf(c).contract;
  const amt = Math.max(1, Math.round(x.maxHp * hc.drain));
  ev.lines.push(`けいやくしょが、あやしく光った…！${x.name}のたましいが、すいとられていく…`);
  const d = Math.min(amt, Math.max(0, x.hp - 1));
  if (d > 0) b.damage(c, x, d, ev, { element: 'dark' });
  const heal = Math.round(c.maxHp * hc.heal);
  c.hp = Math.min(c.maxHp, c.hp + heal);
  h.contract.left--;
  h.contract.drains++;
  if (h.contract.left <= 0) post(ev).push(`（次にハデロスが動くと、${x.name}のたましいが、とられてしまう…！炎で、けいやくしょをもやせ！）`);
  ev.c8bDrain = { id: c.id, who: x.id, left: h.contract.left, dmg: d };
  ev.upd.push(x);
}

// ───────────── 技の こうか（battle-c8a.js の c8aEffect の のこり）─────────────
export function c8bEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c8bFuse': fuse(b, c, ev); return true;
    case 'c8bQuarrel': ev.c8bQuarrelAct = { id: c.id }; return true;
    case 'c8bPanic': ev.c8bPanicAct = { id: c.id, left: c.c8imp?.panic || 0 }; return true;
    case 'c8bRage': rage(b, c, ev); return true;
    case 'c8bSolo': solo(b, c, ev); return true;
    case 'c8bContract': contract(b, c, ev); return true;
    case 'c8bSoul': soul(b, c, ev); return true;
    case 'c8bHot': ev.c8bHot = { id: c.id }; return true;
    case 'c8bAnger': anger(b, c, ev); return true;
    case 'c8bErupt': erupt(b, c, ev); return true;
    case 'c8bCool': ev.c8bCoolAct = { id: c.id }; return true;
    // 第8章 第3幕（battle-c8c.js）
    default: return c8cEffect(b, c, a, eff, ev);
  }
}

// みんなへの 物理の 大技（身を 守ると 半分）
function physAll(b, c, mult, ignoreDef, ev) {
  const targets = b.aliveAllies();
  for (const t of targets) b.physHit(c, t, { mult, ignoreDef, acc: 1.2 }, ev, 'phys');
  return targets;
}

// ばけばけ大がったい（2ひきで 大きな おばけに ばけて、みんなに 物理の 大技）
function fuse(b, c, ev) {
  const s = b.c8imps;
  const ic = impsConf(c);
  const p = partnerOf(b, c);
  if (s) {
    s.left = s.every;
    s.fuses++;
  }
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'b8i_fuse', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  if (!p?.alive) {
    ev.lines.push('しかし、あいぼうがいない！');
    return;
  }
  ev.lines.push(`${short(c)}と${short(p)}が、ボワンとけむりにつつまれて、大きな大きなおばけにばけた！`);
  physAll(b, c, ic.fuse.mult, ic.fuse.ignoreDef, ev);
  post(ev).push('2ひきは、もとのすがたにもどった。');
  ev.c8bFuse = { id: c.id, partner: p.id };
  ev.warn = true;
  ev.upd.push(c, p);
}

// 相談の 間に 大きな 一撃: けんかを はじめる（2ひきとも 1回 動けない）
function quarrel(b, t, by, ev) {
  const s = b.c8imps;
  ev.c8bQuarrel = { id: t.id, by: by.id };
  s.left = s.every;
  s.quarrels++;
  s.quarrel = true;
  const imps = aliveImps(b);
  for (const e of imps) {
    e.c8imp.quarrel = true;
    if (e.telegraph === FUSE) e.telegraph = null;
  }
  const p = partnerOf(b, t);
  post(ev).push(
    `${short(t)}「いてててっ！おい、${short(p)}！ちゃんと見はってろって言っただろ！」`,
    `${short(p)}「ええっ！？ぼくのせいじゃないよ！」`,
    '2ひきは、けんかを始めた！（次の番は、2ひきとも動けない！）',
  );
  ev.upd.push(...imps);
}

// カンカン（あいぼうが たおれて パニックの あと）
function rage(b, c, ev) {
  const me = c.c8imp;
  const rc = impsConf(c).rage;
  if (!me || me.rage) return;
  me.rage = true;
  me.left = rc.every;
  c.atk = Math.round(c.atk * rc.atk);
  c.speed = (c.speed || 1) * rc.spd;
  if (b.c8imps) b.c8imps.rages++;
  ev.fx = { type: 'ability', anim: 'b8i_rage', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push(`${c.name}は、顔をまっかにして、カンカンにおこった！（攻撃力と素早さが上がった！）`);
  ev.c8bRage = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// ひとりばけばけ（カンカンの あと）
function solo(b, c, ev) {
  const me = c.c8imp;
  const rc = impsConf(c).rage;
  if (me) me.left = rc.every;
  if (b.c8imps) b.c8imps.solos++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'b8i_solo', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  ev.lines.push(`${c.name}は、大きなおばけにばけて、とびかかってきた！`);
  physAll(b, c, rc.mult, 0.3, ev);
  ev.c8bSolo = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// たましいのけいやく（1人に けいやくしょ）
function contract(b, c, ev) {
  const h = c.c8hd;
  const hc = hadesConf(c);
  if (h) h.left = hc.contract.every;
  const pool = b.aliveAllies();
  const x = pool.length ? pool[b.rng.int(0, pool.length - 1)] : null;
  ev.fx = { type: 'ability', anim: 'b8h_contract', actor: c.id, targets: x ? [x.id] : [], side: 'enemy' };
  if (!x || !h) return;
  h.contract = { id: x.id, left: hc.contract.turns, drains: 0 };
  h.contracts++;
  ev.lines.push(`${x.name}の前に、まき物のけいやくしょが、ふわりとうかんだ…！`, `けいやくしょが、${x.name}にぴたりとはりついた！`);
  post(ev).push(`（ハデロスが動くたびに、${x.name}のHPがすいとられる…！ハデロスに炎を当てれば、けいやくしょがもえるはずだ！）`);
  ev.c8bContract = { id: c.id, who: x.id, turns: hc.contract.turns };
  ev.warn = true;
  ev.upd.push(c, x);
}

// たましいを いただく（けいやくした 人が たおれる）
function soul(b, c, ev) {
  const h = c.c8hd;
  const hc = hadesConf(c).contract;
  const x = h ? bound(b, c) : null;
  if (h) {
    h.contract = null;
    h.left = hc.every;
  }
  ev.fx = { type: 'ability', anim: 'b8h_soul', actor: c.id, targets: x ? [x.id] : [], side: 'enemy' };
  if (!x) {
    ev.lines.push('しかし、けいやくした人は、もういない！');
    return;
  }
  const dmg = x.hp;
  x.hp = 0;
  ev.results = ev.results || [];
  ev.results.push({ id: x.id, dmg, element: 'dark' });
  ev.lines.push(`けいやくしょが、${x.name}のたましいを、すいこんでしまった！`, ...b.kill(x, 'dark', ev));
  c.hp = Math.min(c.maxHp, c.hp + Math.round(c.maxHp * hc.soulHeal));
  post(ev).push(`${c.name}「ごちそうさま！いやー、いいたましいだ」（ハデロスのHPが、少し回復した…）`);
  h.souls++;
  ev.c8bSoul = { id: c.id, who: x.id };
  ev.warn = true;
  ev.upd.push(c, x);
}

// おこったハデロス（2だんめ）: 赤い 炎。弱点が ひっくりかえる。けいやくしょは もえる
function anger(b, c, ev) {
  const h = c.c8hd;
  const hc = hadesConf(c);
  if (!h || h.form !== 1) return;
  h.form = 2;
  h.left = eruptEvery(c);
  h.hot = false;
  h.flicker = false;
  c.name = RED_NAME;
  c.actions = RED_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(c.atk * (hc.red.atk ?? 1));
  Object.assign(c.resist, HADES_RED);
  ev.fx = { type: 'ability', anim: 'b8h_anger', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('ハデロスのかみの毛が、ボッ！と、まっ赤な炎になって、もえ上がった！', 'ハデロスは、カンカンにおこった！');
  const x = bound(b, c);
  if (h.contract) {
    h.contract = null;
    if (x) ev.lines.push(`赤い炎で、${x.name}のけいやくしょが、もえてしまった！`);
  }
  post(ev).push('（赤い炎のハデロスは、氷があまり効かない…！今度は、炎がよく効きそうだ！）');
  ev.c8bAnger = { id: c.id, freed: x?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

// よみの大ふん火（みんなに 炎の 大技。身を 守ると 半分）
function erupt(b, c, ev) {
  const h = c.c8hd;
  if (h) {
    h.left = eruptEvery(c);
    h.erupts++;
  }
  const base = hadesConf(c).erupt.base;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'b8h_erupt', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: 'fire' };
  for (const t of targets) {
    const r = b.calcMagic(c, t, { base, thr: 99, element: 'fire' }, 1);
    let dmg = r.dmg;
    if (t.defending) dmg = Math.round(dmg * 0.67);
    if (r.resisted || dmg <= 0) {
      ev.lines.push(`${t.name}はダメージを受けない！`);
      continue;
    }
    b.damage(c, t, dmg, ev, { element: 'fire' });
  }
  ev.c8bErupt = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c8a.js の c8aDamage の はじめ。味方 → 敵 だけ）─────────────
// 小おに: パニックの 間は ダメージが ふえる・相談の 間の 大きな 一撃で けんか／
// ハデロス: けいやくの 間の 炎で けいやくしょが もえる・ふん火の 前ぶれの 氷で 頭が ひえる・おこる 前は HP が 下がりきらない
export function c8bDamage(b, c, t, dmg, info, ev) {
  // 第8章 第3幕: 橋の オノ・ギガクッパードの かたい 体・ギガに なる 前（battle-c8c.js）
  dmg = c8cDamage(b, c, t, dmg, info, ev);
  if (!(dmg > 0) || c?.side !== 'ally') return dmg;
  if (t.c8imp) {
    const ic = impsConf(t);
    if (t.c8imp.panic > 0) dmg = Math.round(dmg * ic.panic.k);
    if (plotting(b) && !ev.c8bQuarrel) {
      ev.c8bHit = ev.c8bHit || {};
      ev.c8bHit[t.id] = (ev.c8bHit[t.id] || 0) + dmg;
      if (ev.c8bHit[t.id] >= t.maxHp * ic.breakAt) quarrel(b, t, c, ev);
    }
    return dmg;
  }
  const h = t.c8hd;
  if (!h) return dmg;
  const hc = hadesConf(t);
  const el = info.element;
  if (h.form === 1 && h.contract && el === 'fire' && !ev.c8bBurn) burn(b, t, c, ev);
  if (h.form === 2 && el === 'ice' && !ev.c8bChill && eruptSoon(t)) chill(b, t, c, ev);
  if (h.form === 1) {
    const floor = Math.ceil(t.maxHp * hc.p2At - 1e-6) - 1;
    if (t.hp - dmg < floor) dmg = Math.max(0, t.hp - floor);
    // かみの毛が 赤く ちらちら（おこる 前ぶれ）
    if (!h.flicker && (t.hp - dmg) / t.maxHp < hc.p2At + 0.08) {
      h.flicker = true;
      post(ev).push(`${t.name}のかみの毛の炎が、ちらちらと赤くなってきた…！（もうすぐ、おこりそうだ…！）`);
      ev.c8bFlicker = { id: t.id };
      ev.upd.push(t);
    }
  }
  return dmg;
}

// けいやくしょが もえる（その 人は 助かる・ハデロスは あちちっ）
function burn(b, h, c, ev) {
  ev.c8bBurn = true;
  const x = bound(b, h);
  const hd = h.c8hd;
  hd.contract = null;
  hd.left = hadesConf(h).contract.every;
  hd.hot = true;
  hd.burns++;
  post(ev).push(`${c.name}の炎が、けいやくしょに、もえうつった！`, x ? `${x.name}のけいやくしょが、もえてなくなった！` : 'けいやくしょが、もえてなくなった！', `${h.name}「あちちちっ！」（ハデロスは、あわてている！）`);
  ev.c8bBurnt = { id: h.id, who: x?.id || null, by: c.id };
  ev.upd.push(h);
  if (x) ev.upd.push(x);
}

// ふん火の 前ぶれに 氷: 頭が ひえて ふん火が しぼむ
function chill(b, h, c, ev) {
  ev.c8bChill = true;
  const hd = h.c8hd;
  hd.left = eruptEvery(h);
  hd.cool = true;
  hd.cools++;
  if (h.telegraph === ERUPT) h.telegraph = null;
  post(ev).push(`${c.name}の氷で、${h.name}の頭が、ひえひえになった！`, 'よみの大ふん火が、しゅうっとしぼんだ！（次の番は動けない！）');
  ev.c8bCool = { id: h.id, by: c.id };
  ev.upd.push(h);
}

// ───────────── たおれた（battle-c8a.js の c8aKill の はじめ）─────────────
// 小おにの かたほうが たおれた: のこった ほうは パニック
export function c8bKill(b, t, ev) {
  // 第8章 第3幕: 魔法じんの 子分・橋の オノ（battle-c8c.js）
  c8cKill(b, t, ev);
  if (!t?.c8imp) return;
  const p = partnerOf(b, t);
  if (!p?.alive || p.c8imp.panic > 0 || p.c8imp.rage) return;
  const ic = impsConf(p);
  p.c8imp.panic = ic.panic.turns;
  p.c8imp.quarrel = false;
  if (p.telegraph === FUSE) p.telegraph = null;
  if (b.c8imps) {
    b.c8imps.panics++;
    b.c8imps.both = false;
    b.c8imps.quarrel = false;
  }
  if (!ev) return;
  post(ev).push(`${short(p)}「あ、あいぼうーっ！うわわわ、どうしよう、どうしよう！」`, `（${short(p)}は、あわてている！今なら、ダメージが${ic.panic.k}倍！${ic.panic.turns}回動くまでに、たおせ！）`);
  ev.c8bPanic = { id: p.id, down: t.id, turns: ic.panic.turns, k: ic.panic.k };
  ev.upd.push(p);
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
// 小おにの みんなへの 大技（大がったい・ひとりばけばけ）が c の 次の 番より 先に 来るか
export function impBigBefore(b, c) {
  const s = b.c8imps;
  const imps = aliveImps(b);
  if (!s || !imps.length) return false;
  if (imps.some((e) => e.telegraph === FUSE || e.telegraph === SOLO)) return true;
  if (imps.length >= 2) {
    if (imps.some((e) => e.c8imp.quarrel)) return false;
    return imps.reduce((n, e) => n + actsBefore(b, c, e), 0) >= s.left;
  }
  const e = imps[0];
  if (!e.c8imp.rage) return false;
  return actsBefore(b, c, e) >= (e.c8imp.left || soloEvery(e));
}
// ハデロスの 大技（たましいを いただく〈けいやくした 人〉・大ふん火）が c の 次の 番より 先に 来るか
export function hadesBigBefore(b, c, h = hadesOf(b)) {
  const hd = h?.c8hd;
  if (!hd || hd.hot || hd.cool) return false;
  if (hd.form === 1) return !!hd.contract && hd.contract.id === c.id && hd.contract.left <= 0 && actsBefore(b, c, h) >= 1;
  if (h.telegraph === ERUPT) return true;
  return actsBefore(b, c, h) >= hd.left;
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。el … その 属性だけ。{ cmd, dmg }）
function bestHit(b, c, t, el = null) {
  let best = { cmd: null, dmg: 0 };
  if (!el) {
    const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
    best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  }
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !FOES.has(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (el && e.element !== el) continue;
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
// 1体を ねらう 行動か（ねらいを かえられる）
function single(cmd) {
  if (!cmd) return false;
  if (cmd.type === 'attack') return true;
  if (cmd.type !== 'ability') return false;
  const a = ABILITIES[cmd.id];
  return a?.target === 'enemy' && ['phys', 'magic'].includes(prim(a).type);
}

// ───────────── オート（battle-c8a.js の c8aPlan の はじめ）─────────────
// 第8章 第2幕の ボスが いなければ null（ほかの ボスの 考えへ）
export function c8bPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c8bInner || c.status?.rift) return null;
  // 第8章 第3幕の ボス（マジカメック・クッパード。battle-c8c.js）
  const cp = c8cPlan(b, c, decide);
  if (cp) return cp;
  const imps = aliveImps(b);
  const h = hadesOf(b);
  if (!imps.length && !h) return null;
  const soon = imps.length ? impBigBefore(b, c) : hadesBigBefore(b, c, h);
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c8bInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c8bInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (imps.length) return impPlan(b, c, base, a, imps, soon);
  return hadesPlan(b, c, base, a, h, soon);
}

function impPlan(b, c, base, a, imps, soon) {
  // パニックの 小おにを ねらう（いちばん 大きい 1回の 攻撃）
  const pan = imps.find((e) => e.c8imp.panic > 0);
  if (pan) {
    if (a?.target === 'enemies' || a?.target === 'group') return base;
    const h = bestHit(b, c, pan);
    return h.dmg > 0 ? h.cmd : base;
  }
  // 相談の 間は、いちばん 大きい 1回の 攻撃で じゃまを する（とどく ときだけ）
  if (plotting(b) && !b.c8bNoPlot) {
    let best = null;
    for (const e of imps) {
      const h = bestHit(b, c, e);
      if (h.dmg >= e.maxHp * impsConf(e).breakAt * 0.9 && (!best || h.dmg / e.maxHp > best.dmg / best.e.maxHp)) best = { ...h, e };
    }
    if (best) return best.cmd;
  }
  // 大技の 前ぶれ（次に 小おにが 動くと 大技）が 出て いる ときだけ 身を 守る
  const warned = imps.length >= 2 ? b.c8imps.left <= 1 : (imps[0].c8imp.left || 9) <= 1;
  if (soon && warned && !b.c6NoGuard) return { type: 'defend' };
  // 2ひきの HP を そろえて へらす（HP の 多い ほうを ねらう。おなじ くらいなら はやい パニクル）→ かたほうを たおしたら、パニックの 間に もう かたほうも
  if (!b.c8bNoOrder && imps.length >= 2 && single(base)) {
    const r = (e) => e.hp / e.maxHp + (e.c8imp.role === 'panic' ? 0.05 : 0);
    const focus = imps.slice().sort((x, y) => r(y) - r(x))[0];
    if (base.target !== focus.id) {
      const h = bestHit(b, c, focus);
      if (h.cmd) return h.cmd;
    }
  }
  return base;
}

function hadesPlan(b, c, base, a, h, soon) {
  const hd = h.c8hd;
  // けいやくの 間は 炎を 当てる（けいやくしょが もえる）
  if (hd.form === 1 && hd.contract && !b.c8bNoBurn) {
    const f = bestHit(b, c, h, 'fire');
    if (f.dmg > 0) return f.cmd;
  }
  // ふん火の 前ぶれに 氷を 当てる（頭が ひえる）
  if (eruptSoon(h) && !b.c8bNoChill) {
    const i = bestHit(b, c, h, 'ice');
    if (i.dmg > 0) return i.cmd;
  }
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-c8a.js の c8aPub の さいご）─────────────
// 小おに: impLeft・impEvery（ばけばけ大がったいまで）・plot（相談）・quarrel・panicLeft・panicK・rage・soloLeft・soloEvery・impForm（2 … パニック・カンカンの え）
// ハデロス: c8hform（1 青・2 赤）・contractLeft・contractEvery・soulLeft（けいやくの のこり）・bound（けいやくした 人）・flicker・hot・cool・eruptLeft・eruptEvery
export function c8bPub(c, o) {
  // がめんは まえの ようすに 上書きで まぜる（client/battle.js の Object.assign）ので、なくなった しるしも 0・null で おくる
  // 第8章 第3幕（battle-c8c.js）
  c8cPub(c, o);
  if (c.c8imp) {
    const me = c.c8imp;
    const s = me.s;
    const show = !!s?.both && !(me.panic > 0) && !me.rage;
    o.impLeft = show ? s.left : 0;
    o.impEvery = show ? s.every : 0;
    o.plot = show && !s.quarrel && s.left <= s.plotAt ? 1 : 0;
    o.quarrel = me.quarrel ? 1 : 0;
    o.panicLeft = me.panic > 0 ? me.panic : 0;
    o.panicK = impsConf(c).panic.k;
    o.rage = me.rage ? 1 : 0;
    o.soloLeft = me.rage ? me.left : 0;
    o.soloEvery = me.rage ? soloEvery(c) : 0;
    o.impForm = me.panic > 0 || me.rage ? 2 : 1;
  }
  if (c.c8hd) {
    const h = c.c8hd;
    const blue = h.form === 1;
    o.c8hform = h.form;
    o.bound = blue && h.contract ? h.contract.id : null;
    o.soulLeft = blue && h.contract ? h.contract.left : 0;
    o.contractLeft = blue && !h.contract ? h.left : 0;
    o.contractEvery = blue && !h.contract ? hadesConf(c).contract.every : 0;
    o.flicker = blue && h.flicker ? 1 : 0;
    o.eruptLeft = blue ? 0 : h.left;
    o.eruptEvery = blue ? 0 : eruptEvery(c);
    o.hot = h.hot ? 1 : 0;
    o.cool = h.cool ? 1 : 0;
  }
}
void C8_HADES; void HADES_BLUE; void BUFF_ACTS;
