// 第2部 第7章 第2幕「海の紋章」の ボスの 戦いの しかけ（battle-c7.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・海賊船ジョリーホック号（monsters-c7s.js の c7s.kind 'tide'。Step 3 の さいごの 中ボス）「しおの満ち引き」
//   満ち潮（c.c7tide.phase 'high'）: 船が 1回 動く たびに しるし（c.c7tide.left。はじめは tide.high）が 1つ へる。
//     しるしが 1つの ときに 船が 動くと、かならず「いっせいほうげき」（m7r_broadside。みんなに 物理の 大技。身を 守ると 半分）。
//   ほうげきの はんどうで 引き潮（'low'）に なり、船は サンゴしょうに のり上げる: tide.low 回 動く 間、たるが ころがる だけ（m7r_stuck）・
//     受ける ダメージが tide.aground ばい（「今が チャンス！」）。tide.low 回めの 行動で しおが 満ちて、うき上がる（その 番は ふつうに 動く）。
//   HP が p2At より へると 満ち潮の しるしが p2High に（ほうげきが はやく 来る）
// ・ホック船長（c7s.kind 'captain'。しずむ前の島の灯台の ボス）「板わたり」
//   every 回 動く たびに（しるし c.c7cap.left）「板わたりの号令」（m7l_plank）: 1人を 灯台から 海へ のびる 板の 先へ 歩かせる。
//   その 人は 動けない・回復も とどかない（battle-earth.js の 地われと おなじ status.rift。kind 'plank'）。
//   合体技の よやくを して いる 人が いれば その 組の 人を ねらい、組の みんなの 手を ひきはなす（ゲージは 0 から。ノクトの 地われと おなじ）。
//   船長が 動く たびに 1歩 すすみ、さいごの 1歩で かならず「ドボン！」（m7l_drop）: その 人は 海へ 落ちて 戦えなくなり、
//   大波が みんなを おそう（物理の 大技。身を 守ると 半分）。仲間が「手をのばす」と すぐ もどる（地われと おなじ コマンド）。
//   板の 上に 人が いる 間は、号令の しるしは すすまない。
//   HP が p2At より へると（2だんめ）every が p2Every に（はやく なる）。船長が たおれると 板の 上の 人は もどる
// ・ふつうの オート（家族が「オート」に した とき）: いっせいほうげきが 自分の 次の 番より 先に 来る とき、HPが へっていれば よく 身を 守る
//   （battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ。b.c6Naive … しない 人）。板の 上の 人は「手をのばす」（ai.js の reachPlan。回復の あと）
// ・知っている 人（シミュレーター tools/sim-ch7.mjs。b.knowsCh6）: いっせいほうげきの 前に 身を 守る（b.c6NoGuard … しない）／
//   のり上げて いる 間は いちばん ダメージの 大きい 攻撃（b.c7sNoFocus … しない）／板の 上の 人を 回復より 先に 助ける（b.c7sNoReach … ふつうと おなじ）／
//   合体技は 板わたりの号令の すぐ 前と、板の 上に 人が いる 間は しない（シミュレーターの dual7）
import { MONSTERS } from './data/monsters.js?v=8070ad6c27d9';
import { ABILITIES } from './data/abilities.js?v=8070ad6c27d9';
import { C7_REEF, C7_LIGHT } from './data/monsters-c7s.js?v=8070ad6c27d9';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=8070ad6c27d9';
import { canUse } from './ai.js?v=8070ad6c27d9';
import { AUTO_GUARD } from './battle-ch6.js?v=8070ad6c27d9';
import { TRAP_KINDS, REACH } from './battle-earth.js?v=8070ad6c27d9';
// 合体技の よやくの 組（ノクトの 地われと おなじ。板わたりは 組の 人を ねらって、手を ひきはなす）
import { bondTeams, breakTeam } from './battle-nocto.js?v=8070ad6c27d9';
// 第2部 第7章 第3幕: いばらの魔女マレフィナ（いばらのかべ・黒い 竜）・カイの影（かげブーメラン）。battle-c7i.js
import { setupC7i, c7iTurnStart, c7iEffect, c7iPlan, c7iPub, c7iDamage, c7iKill } from './battle-c7i.js?v=8070ad6c27d9';

export { C7_REEF, C7_LIGHT };
export const BROADSIDE = 'm7r_broadside';
export const STUCK = 'm7r_stuck';
export const PLANK = 'm7l_plank';
export const DROP = 'm7l_drop';
export const PLANK_KIND = 'plank';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});

const c7sConf = (m) => MONSTERS[m?.species]?.c7s || null;
const tideConf = (m) => ({ high: 4, low: 3, p2At: 0.5, p2High: 3, broadside: {}, aground: 1.5, ...(c7sConf(m)?.tide || {}) });
const plankConf = (m) => ({ every: 3, p2At: 0.5, p2Every: 2, steps: 1, wave: {}, ...(c7sConf(m)?.plank || {}) });
const tideP2 = (c) => c.hp / c.maxHp < tideConf(c).p2At;
const highOf = (c) => (tideP2(c) ? tideConf(c).p2High : tideConf(c).high);
const capP2 = (c) => c.hp / c.maxHp < plankConf(c).p2At;
const everyOf = (c) => (capP2(c) ? plankConf(c).p2Every : plankConf(c).every);
const shipOf = (b) => b.enemies.find((e) => e.c7tide && e.alive) || null;
const captainOf = (b) => b.enemies.find((e) => e.c7cap && e.alive) || null;
// 板の 上の 人（もどった・たおれた ときは null）
export function plankWho(b, cap) {
  const id = cap?.c7cap?.who;
  const x = id ? b.get(id) : null;
  return x?.alive && x.status?.rift?.kind === PLANK_KIND ? x : null;
}
export const aground = (m) => m?.c7tide?.phase === 'low';

// 板わたり（battle-earth.js の 地われと おなじ status.rift の ことばだけ かえる）
const PLANK_TEXT = {
  name: '板の上',
  // 板の 上の 人の 番: 動けない（自分では もどれない。船長が 動くと 1歩 すすむ・さいごの 1歩で ドボン）
  turn(b, c, ev) {
    ev.name = '板の上';
    ev.fx = { type: 'n1RiftTurn', actor: c.id, kind: PLANK_KIND };
    ev.lines.push(`${c.name}は、板の上で、足がすくんで動けない…！`);
  },
  reach(t, c, by, ev) {
    ev.c7sSave = { who: t.id, by: c.id };
    return [`${t.name}は、その手をつかんで、板の上からとびもどった！`];
  },
  free: (x) => `${x.name}は、板の上から、灯台へもどってきた！`,
};

// ───────────── はじめ（battle-c7.js の setupC7 の さいご）─────────────
export function setupC7s(b) {
  const lines = [];
  for (const e of b.enemies) {
    const conf = c7sConf(e);
    if (!conf) continue;
    if (conf.kind === 'tide') {
      const h = highOf(e);
      e.c7tide = { phase: 'high', left: h, max: h, broadsides: 0, grounds: 0 };
      lines.push(`${e.name}が、満ち潮にのって、ぐんぐん近づいてくる…！`, '（しおが満ちきると、たいほうをいっせいにうってきそうだ…！）');
    }
    if (conf.kind === 'captain') {
      TRAP_KINDS[PLANK_KIND] = PLANK_TEXT;
      e.c7cap = { left: everyOf(e), who: null, steps: 0, planks: 0, falls: 0, saves: 0 };
      lines.push('灯台のてっぺんから、海の上へ、長い板がつき出している…！', `${e.name}「ようこそ、わしの灯台へ。板わたりの用意は、できておるぞ…！」`, '（板の上に歩かされたら、仲間が「手をのばす」と助けられる…！）');
    }
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
  // 第7章 第3幕の ボス（battle-c7i.js）
  setupC7i(b);
}

// ───────────── 行動の はじめ（battle-c7.js の c7TurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c7sTurnStart(b, c, ev, stuck) {
  c7iTurnStart(b, c, ev, stuck);
  if (c.c7tide) tideTurn(b, c, ev, stuck);
  else if (c.c7cap) capTurn(b, c, ev, stuck);
}

function tideTurn(b, c, ev, stuck) {
  const t = c.c7tide;
  if (c.telegraph) return;
  if (t.phase === 'high') {
    t.max = highOf(c);
    t.left = Math.min(t.left, t.max);
    if (t.left <= 1) {
      if (!stuck) c.telegraph = BROADSIDE;
    } else {
      t.left--;
      ev.lines.push(t.left > 1 ? `しおが満ちてくる…（いっせいほうげきまで、あと${t.left}）` : 'しおが、いっぱいに満ちた…！船のたいほうが、全部こちらをむいた！');
      if (t.left === 1) ev.lines.push('（次に船が動くと、いっせいほうげき…！身を守れ！）');
      ev.c7sTide = { id: c.id, phase: 'high', left: t.left, max: t.max };
    }
    ev.upd.push(c);
    return;
  }
  // 引き潮: サンゴしょうに のり上げて いる（たるが ころがる だけ）。low 回めで しおが 満ちる
  t.left--;
  if (t.left <= 0) {
    t.phase = 'high';
    t.max = highOf(c);
    t.left = t.max;
    ev.lines.push(`しおが満ちてきた！${c.name}が、サンゴしょうからうき上がった！`, `（いっせいほうげきまで、あと${t.left}）`);
    ev.c7sTide = { id: c.id, phase: 'high', left: t.left, max: t.max, float: true };
  } else {
    if (!stuck) c.telegraph = STUCK;
    ev.lines.push(`${c.name}は、サンゴしょうにのり上げたまま…（しおが満ちるまで、あと${t.left}）`);
    ev.c7sTide = { id: c.id, phase: 'low', left: t.left };
  }
  ev.upd.push(c);
}

function capTurn(b, c, ev, stuck) {
  const p = c.c7cap;
  if (c.telegraph) return;
  // 板の 上の 人（もどった・たおれた ときは もう いない）: 1歩 すすむ・さいごの 1歩で ドボン（号令の しるしは すすまない）
  const who = plankWho(b, c);
  if (!who) p.who = null;
  else {
    if (p.steps <= 1) {
      if (!stuck) c.telegraph = DROP;
    } else {
      p.steps--;
      ev.lines.push(`${who.name}は、板の先へ、1歩…（海まで、あと${p.steps}歩）`);
      if (p.steps === 1) ev.lines.push('（次に船長が動くと、海へドボン…！早く「手をのばす」！）');
      ev.c7sStep = { id: c.id, who: who.id, steps: p.steps };
      ev.warn = true;
      ev.upd.push(who);
    }
    ev.upd.push(c);
    return;
  }
  // 2だんめ: はやく なる
  p.left = Math.min(p.left, everyOf(c));
  if (p.left <= 1) {
    if (!stuck) c.telegraph = PLANK;
  } else {
    p.left--;
    if (p.left === 1) ev.lines.push(`${c.name}が、板の方を、ちらりと見た…（次に動くと、板わたりの号令！）`);
    ev.c7sCap = { id: c.id, left: p.left, every: everyOf(c) };
  }
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-c7.js の c7Effect の のこり）─────────────
export function c7sEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c7sBroadside': broadside(b, c, ev); return true;
    case 'c7sPlank': plank(b, c, ev); return true;
    case 'c7sDrop': drop(b, c, ev); return true;
    // 第7章 第3幕（battle-c7i.js）
    default: return c7iEffect(b, c, a, eff, ev);
  }
}

// いっせいほうげき（満ち潮の さいご）→ 引き潮で のり上げる
function broadside(b, c, ev) {
  const t = c.c7tide;
  const tc = tideConf(c);
  const sc = tc.broadside || {};
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a7r_broadside', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  for (const x of targets) b.physHit(c, x, { mult: sc.mult ?? 1.0, ignoreDef: sc.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  ev.c7sBroadside = { id: c.id };
  ev.warn = true;
  if (!t || !c.alive) return;
  t.phase = 'low';
  t.left = tc.low;
  t.broadsides++;
  t.grounds++;
  const post = (ev.postLines = ev.postLines || []);
  post.push(`いっせいほうげきのはんどうで、${c.name}が、サンゴしょうにのり上げた！`, `しおが引いていく…（今がチャンス！船が受けるダメージが${tc.aground}倍）`);
  ev.c7sGround = { id: c.id, left: t.left, k: tc.aground };
  ev.upd.push(c);
}

// 板わたりの号令: 1人を 板の 先へ（もう だれかが 板の 上・のこりが 2人より 少ない ときは できない）
function plank(b, c, ev) {
  const p = c.c7cap;
  if (p) p.left = everyOf(c);
  const free = b.aliveAllies().filter((x) => !x.status?.rift);
  if (!p || plankWho(b, c) || free.length < 2) {
    ev.lines.push('しかし、だれも板の上に乗せられなかった！');
    return;
  }
  // 合体技の よやくの 組の 人を ねらう（手を ひきはなす）
  const teams = bondTeams(b);
  const team = teams.flatMap((tm) => tm.members).filter((x) => free.includes(x));
  const t = b.rng.pick(team.length ? team : free);
  const torn = teams.filter((tm) => tm.members.includes(t));
  trapPlank(b, t, c);
  for (const tm of torn) {
    breakTeam(b, tm, ev);
    ev.lines.push(`${tm.members.map((x) => x.name).join('と')}の、つながろうとしていた手が、ひきはなされた！`);
  }
  if (torn.length) ev.n1Torn = torn.length;
  p.who = t.id;
  p.steps = plankConf(c).steps;
  p.planks++;
  ev.fx = { type: 'ability', anim: 'a7l_plank', actor: c.id, targets: [t.id], side: 'enemy' };
  ev.lines.push(`${t.name}は、かぎにひっかけられて、板の上へ歩かされた！`, `（動けない！回復もとどかない…！海まで、あと${p.steps}歩）`);
  (ev.postLines = ev.postLines || []).push(p.steps <= 1 ? '（次に船長が動くと、海へドボン…！すぐに「手をのばす」！）' : '（仲間が「手をのばす」と、すぐに助けられる！）');
  ev.c7sPlank = { id: c.id, who: t.id, steps: p.steps };
  ev.warn = true;
  ev.upd.push(t, c);
}

// 動けなく する（battle-earth.js の trap と おなじ。ならんで いた 行動・合体技の よやく・さそいも とりやめ）
function trapPlank(b, t, by) {
  t.status.rift = { turns: 99, by: by.id, kind: PLANK_KIND };
  for (const q of b.queue) if (q.id === t.id && q.cmd?.type === 'dual') b.releasePartners(q.cmd);
  b.queue = b.queue.filter((q) => q.id !== t.id);
  if (t.waitDual) b.endWait(t, null, false);
  for (const inv of [...b.invites.values()]) if (inv.from === t.id || inv.to === t.id || inv.partners?.includes(t.id)) b.endInvite(inv, '動けない');
  Object.assign(t, { ready: false, queued: false, defending: false, cover: null, atb: 0 });
}

// ドボン！: 板の 上の 人は 海へ（戦えなくなる。生き返りの 呪文・道具で もどる）→ 大波が みんなを おそう
function drop(b, c, ev) {
  const p = c.c7cap;
  const who = plankWho(b, c);
  if (!p || !who) {
    ev.lines.push('しかし、板の上には、もうだれもいない！');
    return;
  }
  p.who = null;
  p.steps = 0;
  p.falls++;
  delete who.status.rift;
  ev.lines.push(`${who.name}は、板の先から、海へドボン！`, ...b.kill(who, null, ev));
  const wc = plankConf(c).wave || {};
  const targets = b.aliveAllies().filter((x) => !x.status?.rift);
  ev.fx = { type: 'ability', anim: 'a7l_drop', actor: c.id, targets: [who.id, ...targets.map((x) => x.id)], side: 'enemy' };
  ev.lines.push('ザッブーン！大波が、灯台のてっぺんまでおしよせた！');
  for (const x of targets) b.physHit(c, x, { mult: wc.mult ?? 1.0, ignoreDef: wc.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  ev.c7sFall = { id: c.id, who: who.id };
  ev.warn = true;
  ev.upd.push(who, c);
}

// ───────────── ダメージ（battle-c7.js の c7Damage。味方 → 敵 だけ）─────────────
// のり上げた 船は 受ける ダメージが aground ばい
export function c7sDamage(b, c, t, dmg, info, ev) {
  if (dmg > 0 && aground(t)) return Math.round(dmg * tideConf(t).aground);
  // 第7章 第3幕: いばらのかべの 間の 魔女・変身の 前の 魔女（battle-c7i.js）
  return c7iDamage(b, c, t, dmg, info, ev);
}

// ───────────── たおれた（battle-c7.js の c7Kill の はじめ）─────────────
// 船長が たおれた ときの 板の 上の 人は battle-earth.js の earthKill が もどす（文は PLANK_TEXT.free）
export function c7sKill(b, t, ev) {
  if (t.c7cap) t.c7cap.who = null;
  // 第7章 第3幕: いばらのかべが くずれた（battle-c7i.js）
  c7iKill(b, t, ev);
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
// いっせいほうげきが c の 次の 番より 先に 来るか
export function broadsideBefore(b, c, ship = shipOf(b)) {
  if (!ship?.c7tide || ship.c7tide.phase !== 'high') return false;
  if (ship.telegraph === BROADSIDE) return true;
  return actsBefore(b, c, ship) >= ship.c7tide.left;
}
// 板の 上の 人が c の 次の 番より 先に 海へ 落ちるか（ドボンの 大波が 来るか）
export function fallBefore(b, c, cap = captainOf(b)) {
  if (!cap?.c7cap || !plankWho(b, cap)) return false;
  if (cap.telegraph === DROP) return true;
  return actsBefore(b, c, cap) >= Math.max(1, cap.c7cap.steps);
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。{ cmd, dmg }）
function bestHit(b, c, t) {
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !FOES.has(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
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

// ───────────── オート（battle-c7.js の c7Plan の はじめ）─────────────
// 第7章 第2幕の ボスが いなければ null（ほかの ボスの 考えへ）
export function c7sPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c7sInner || c.status?.rift) return null;
  // 第7章 第3幕の ボス（マレフィナ・カイの影。battle-c7i.js）
  const ip = c7iPlan(b, c, decide);
  if (ip) return ip;
  const ship = shipOf(b);
  const cap = captainOf(b);
  if (!ship && !cap) return null;
  // ふつうの オート: ほうげきが 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る（板わたりは ai.js の reachPlan）
  if (!b.knowsCh6) {
    if (b.c6Naive || !ship || !broadsideBefore(b, c, ship)) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c7sInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c7sInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (ship) {
    if (broadsideBefore(b, c, ship) && !b.c6NoGuard) return { type: 'defend' };
    // のり上げて いる 間は いちばん 大きい 攻撃（回復・補助より 先。HPが へっている 人が いる ときは ふだんの 行動）
    if (aground(ship) && !b.c7sNoFocus && !b.allies.some((x) => !x.fled && x.alive && x.hp / x.maxHp < 0.5)) {
      const h = bestHit(b, c, ship);
      if (h.dmg > 0) return h.cmd;
    }
    return base;
  }
  // ホック船長: 板の 上の 人を 回復より 先に 助ける（とても あぶない 人の 回復・生き返りは 上で そのまま）
  const who = plankWho(b, cap);
  if (who && who !== c && !b.c7sNoReach) return { type: REACH, target: who.id };
  return base;
}

// ───────────── がめんへ（battle-c7.js の c7Pub の さいご）─────────────
// ジョリーホック号: tide（1 満ち潮・2 のり上げ）・tideLeft・tideMax・aground（ダメージの ばい）
// ホック船長: capLeft・capEvery（板わたりまで）・plankWho（板の 上の 人の id）・plankSteps（海まで）・plankMax・p2
export function c7sPub(c, o) {
  // 第7章 第3幕（battle-c7i.js）
  c7iPub(c, o);
  if (c.c7tide) {
    o.c7tide = c.c7tide.phase === 'low' ? 2 : 1;
    o.c7tideLeft = c.c7tide.left;
    o.c7tideMax = c.c7tide.phase === 'low' ? tideConf(c).low : c.c7tide.max;
    if (c.c7tide.phase === 'low') o.aground = tideConf(c).aground;
  }
  if (c.c7cap) {
    o.capLeft = c.c7cap.left;
    o.capEvery = everyOf(c);
    o.plankWho = c.c7cap.who || null;
    o.plankSteps = c.c7cap.who ? c.c7cap.steps : 0;
    o.plankMax = plankConf(c).steps;
    if (capP2(c)) o.p2 = 1;
  }
}
