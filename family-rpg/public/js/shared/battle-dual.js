// 合体技の しくみ（2人・3人・4人。battle.js の Battle から よぶ）
//
// ・出す 人（c）が 合体技を えらぶ → 仲間 みんなの ゲージが たまって いれば すぐ、まだ なら「よやく」（c.waitDual）
// ・よやく中は、仲間の ゲージが たまった しゅんかんに たしかめる。
//   ほかの 仲間が まだ なら、その 仲間は ゲージが たまった まま まつ（p.dualHold。AI・オート・自分が 動かす 仲間）。
//   家族（ほかの 人が 動かす キャラ）は まつのを おしつけない（ふつうに 番が 来て、コマンドを えらんでいる あいだは「今」）
// ・みんな そろったら、家族には「参加する？」と 聞く（2人技と おなじ。何人でも、1人でも ことわれば 出ない）
// ・強さ: 出す 人が それぞれ、その 組の 技（か ふつうの 攻撃）を 出した ときの ダメージの 合計 × DUAL_POWER[人数] × k
//   （この 敵に 当てた ときの 見つもり。守り・弱点・バフも 入る。属性は 合体技の 属性で かかる）
import { ABILITIES } from './data/abilities.js';
import { DUAL_TECHS, dualOptions, partnerNow } from './data/dual.js';
import { weaponOk, comboAllowed, penaltyFor } from './stats.js';

// 人数ごとの 強さ（別々に 1回ずつ 動いた ときの 合計の 何倍か。全体技は parts の k で 下げる）
export const DUAL_POWER = { 2: 1.8, 3: 2.2, 4: 3.0 };
// 合体技に さそわれた 家族が こたえるまで まつ 時間（ミリびょう）
export const DUAL_ASK_MS = 7000;
// 動けない じょうたい（合体技に 入れない）
const OUT = ['sleep', 'paralyze', 'confuse', 'prison'];
const cantJoin = (p) => !p || !p.alive || p.fled || OUT.some((s) => p.status?.[s]);

export const partnersOf = (cmd) => (cmd?.partners?.length ? cmd.partners : cmd?.partner ? [cmd.partner] : []);
const sameTeam = (o, ids) => o.partners.length === ids.length && ids.every((id) => o.partners.includes(id));
// 家族（ほかの 人が 動かしている キャラ）なので 聞く ひつようが ある
const needsAsk = (c, p) => !!p.controller && !p.auto && p.controller !== c.controller;
const nowOf = (p) => partnerNow({ queued: p.queued, hold: p.dualHold, ready: p.ready, atb: p.atb });

// c が 今 出せる 合体技（exec: 出す しゅんかんの たしかめ。よやくした 相手も かぞえる）
// anyGauge: 仲間の ゲージが まだでも よやく できる ものも かぞえる
export function optionsFor(b, c, others = null, exec = false, anyGauge = false) {
  if (!c || c.side !== 'ally' || c.mon) return [];
  const list = (others || b.allies.filter((x) => x !== c)).filter((x) => x && x.side === 'ally' && !x.mon);
  const info = (x) => ({
    id: x.id, name: x.name, alive: x.alive, abilities: x.abilities || [], mp: x.mp, atb: x.atb, ready: x.ready, hold: !!x.dualHold,
    queued: exec && x.dualWith === c.id ? false : !!x.queued,
    // ほかの 人の 合体技に 入る ことに なっている
    busy: !!x.dualWith && x.dualWith !== c.id,
    inviting: !exec && x !== c && !!(x.inviting || x.invited),
    // ほかの 人の 合体技を まっている・まって もらって いる
    waiting: x !== c && (!!x.waitDual || (!!x.dualTarget && x.dualTarget !== c.id)),
    // 呪文が ふうじられた 場所では、呪文の 合体技は 出せない（マホトーンと おなじ）。水のろうの 中も 出られない
    statuses: [...Object.keys(x.status || {}), ...(x.status?.prison ? ['paralyze'] : []), ...(b.noSpells ? ['silence'] : [])], weaponCat: x.weaponCat,
    usable: (id) => {
      const a = ABILITIES[id];
      return !!a && (a.kind !== 'combo' || comboAllowed(x.penChar, id)) && weaponOk(a, x.weaponCat);
    },
  });
  return dualOptions(info(c), list.map(info), weaponOk, { anyGauge });
}

// その 仲間と その 技が 出せるか（出せる ものを かえす）
export function findOpt(b, c, id, ids, exec = false, anyGauge = false) {
  const ps = ids.map((x) => b.get(x));
  if (ps.some((p) => !p)) return null;
  return optionsFor(b, c, ps, exec, anyGauge).find((o) => o.id === id && sameTeam(o, ids)) || null;
}

// コマンドの たしかめ（battle.js の validate）
export function validateDual(b, c, cmd) {
  const ids = partnersOf(cmd);
  if (!ids.length || new Set(ids).size !== ids.length) return { ok: false, reason: '合体技は出せない' };
  return findOpt(b, c, cmd.id, ids, false, true) ? { ok: true } : { ok: false, reason: '合体技は出せない' };
}

// ほかの 仲間を まつ（ゲージは たまった まま。番は 合体技に 使う）
function hold(b, c, p) {
  p.dualTarget = c.id;
  if (p.dualHold) return;
  p.dualHold = true;
  p.atb = 100;
  p.ready = false;
  b.emit({ t: 'dualHold', id: p.id, by: c.id });
}

// まつのを やめる（ゲージは たまって いるので、すぐ 自分の 番）
function unhold(b, p) {
  if (!p.dualHold) return;
  p.dualHold = false;
  if (p.alive && !p.fled && !p.queued) {
    p.atb = 100;
    b.onReady(p);
  }
}

// 合体技を はじめる（家族が いれば さそう。AI・自分の 仲間なら すぐ）
// 仲間の ゲージが まだ たまって いなければ「よやく」して まつ（みんな たまった ときに 出す）
export function startDual(b, c, cmd) {
  const ids = partnersOf(cmd);
  const ps = ids.map((id) => b.get(id));
  if (!ps.length || ps.some((p) => !p)) return { ok: false, reason: 'no' };
  if (!ps.every(nowOf)) return waitForPartners(b, c, cmd);
  const ask = ps.filter((p) => needsAsk(c, p));
  if (!ask.length) {
    reserveDual(b, c, ps, cmd);
    return { ok: true };
  }
  // 家族の 返事を まつ あいだ、ほかの 仲間は ゲージが たまった まま まつ
  for (const p of ps) if (!ask.includes(p)) hold(b, c, p);
  const inv = {
    id: 'd' + (++b.inviteSeq), from: c.id, to: ask[0].id, asks: ask.map((p) => p.id), pending: new Set(ask.map((p) => p.id)),
    partners: ids, tech: cmd.id, target: cmd.target, remaining: DUAL_ASK_MS,
  };
  b.invites.set(inv.id, inv);
  c.inviting = inv.id;
  const names = [c.name, ...ps.map((p) => p.name)];
  for (const p of ask) {
    p.invited = inv.id;
    b.emit({ t: 'dualInvite', invite: inv.id, from: c.id, to: p.id, tech: cmd.id, fromName: c.name, toName: p.name, partners: ids, names, ms: DUAL_ASK_MS });
  }
  return { ok: true, pending: true };
}

// よやく: 自分の 番を とっておき、仲間 みんなの ゲージが たまったら いっしょに 出す
function waitForPartners(b, c, cmd) {
  const ids = partnersOf(cmd);
  const ps = ids.map((id) => b.get(id));
  c.ready = false;
  c.waitDual = { id: cmd.id, partner: ids[0], partners: ids, target: cmd.target };
  for (const p of ps) p.dualTarget = c.id;
  // もう 番が 来ている 仲間（AI・オート・自分が 動かす 仲間）は、ほかの 仲間を まつ
  for (const p of ps) if (p.ready && !p.queued && !needsAsk(c, p)) hold(b, c, p);
  const t = DUAL_TECHS[cmd.id];
  b.emit({ t: 'dualWait', id: c.id, partner: ids[0], partners: ids, tech: cmd.id, lines: [`${c.name}は${ps.map((p) => p.name).join('・')}と「${t?.name || '合体技'}」を出すため、力をためている！`] });
  return { ok: true, waiting: true };
}

// まっている 人を しらべる（仲間が 出られなく なった・出せなく なった・みんなの 番が 来ている）
export function checkWaits(b) {
  for (const c of b.allies) {
    const w = c.waitDual;
    if (!w) continue;
    const ps = w.partners.map((id) => b.get(id));
    if (!waitStillOk(b, c, ps)) continue;
    // 番が 来ている 自分の 仲間・AIは まつ
    for (const p of ps) if (p.ready && !p.queued && !p.dualHold && !needsAsk(c, p)) hold(b, c, p);
    // みんなの 番が 来ている（家族は コマンドを えらんでいる あいだ）
    if (ps.every((p) => p.dualHold || (p.ready && !p.queued))) fire(b, c);
  }
}

// よやくが まだ 出せるか（だめなら よやくを 終わりに して false）
export function waitStillOk(b, c, ps) {
  if (!c.alive) {
    endWait(b, c, null, false);
    return false;
  }
  const bad = ps.find(cantJoin);
  if (bad !== undefined) {
    endWait(b, c, `${bad?.name || '仲間'}は合体技に参加できなくなった…`);
    return false;
  }
  if (!findOpt(b, c, c.waitDual.id, c.waitDual.partners, true, true)) {
    endWait(b, c, '合体技は出せなくなった…');
    return false;
  }
  return true;
}

// よやくした 合体技を 出す
function fire(b, c) {
  const w = c.waitDual;
  c.waitDual = null;
  for (const id of w.partners) {
    const p = b.get(id);
    if (p && p.dualTarget === c.id && !p.dualHold) p.dualTarget = null;
  }
  c.ready = true;
  return startDual(b, c, { type: 'dual', id: w.id, partner: w.partner, partners: w.partners, target: w.target });
}

// 仲間 p の ゲージが たまった（p.dualTarget の c が まっている）。p の 番を 合体技に 使ったら true
export function fireWait(b, c, p) {
  const w = c?.waitDual;
  if (!w || !w.partners.includes(p.id)) return false;
  const ps = w.partners.map((id) => b.get(id));
  if (!waitStillOk(b, c, ps)) return false;
  const others = ps.filter((x) => x !== p);
  if (others.every((x) => x.dualHold || (x.ready && !x.queued))) {
    const r = fire(b, c);
    // 家族に「参加する？」と 聞いている ときは、家族の 番は ふつうに 来る（参加すると その 番を 使う）。ほかの 仲間は まつ
    return !!r?.ok && ((!r.pending && !r.waiting) || !!p.dualHold);
  }
  // まだ そろって いない: ほかの 仲間を まつ（家族は まつのを おしつけない）
  if (!needsAsk(c, p)) {
    hold(b, c, p);
    return true;
  }
  return false;
}

// よやくを おわりに して、自分の 番に もどす（まっていた 仲間も 自分の 番に）
export function endWait(b, c, msg, back = true) {
  const w = c.waitDual;
  c.waitDual = null;
  for (const id of w?.partners || []) {
    const p = b.get(id);
    if (!p || p.dualTarget !== c.id) continue;
    p.dualTarget = null;
    unhold(b, p);
  }
  b.emit({ t: 'dualWaitEnd', id: c.id, partners: w?.partners || [], lines: msg ? [msg] : [] });
  if (back && c.alive) b.onReady(c);
}

// みんなの 番を おさえて、合体技を 出す じゅんばんに ならべる
function reserveDual(b, c, ps, cmd) {
  for (const p of ps) {
    p.ready = false;
    p.queued = true;
    p.dualWith = c.id;
    p.dualHold = false;
    if (p.dualTarget === c.id) p.dualTarget = null;
    b.emit({ t: 'queued', id: p.id });
  }
  c.inviting = null;
  const ids = ps.map((p) => p.id);
  b.enqueue(c, { type: 'dual', id: cmd.id, partner: ids[0], partners: ids, target: cmd.target });
  b.emit({ t: 'queued', id: c.id, dual: cmd.id, partner: ids[0], partners: ids });
}

// 合体技の 仲間を もとに もどす（出せなかった とき）。cmd か 仲間の id
export function releasePartners(b, cmdOrId) {
  const ids = typeof cmdOrId === 'string' ? [cmdOrId] : partnersOf(cmdOrId);
  for (const id of ids) {
    const p = b.get(id);
    if (!p || !p.dualWith) continue;
    p.dualWith = null;
    p.queued = false;
  }
}

// さそわれた 家族の こたえ
export function answerDual(b, pid, cmd) {
  const inv = b.invites.get(cmd.invite);
  if (!inv || !inv.pending.has(pid)) return { ok: false, reason: 'もう終わっている' };
  if (!cmd.ok) {
    endInvite(b, inv, 'ことわった', pid);
    return { ok: true };
  }
  inv.pending.delete(pid);
  const p = b.get(pid);
  const c = b.get(inv.from);
  if (p) p.invited = null;
  // ほかの 家族の 返事を まつ（参加する 人は、ゲージが たまった まま まつ）
  if (inv.pending.size) {
    if (p && c) hold(b, c, p);
    b.emit({ t: 'dualAnswer', invite: inv.id, ok: true, partial: true, from: inv.from, to: pid });
    return { ok: true };
  }
  b.invites.delete(inv.id);
  const ps = inv.partners.map((id) => b.get(id));
  const ok = c && c.alive && c.ready && !ps.some(cantJoin) && findOpt(b, c, inv.tech, inv.partners);
  if (!ok) {
    if (c) c.inviting = null;
    for (const x of ps) if (x && c && x.dualTarget === c.id) { x.dualTarget = null; unhold(b, x); }
    b.emit({ t: 'dualAnswer', invite: inv.id, ok: false, from: inv.from, to: pid, reason: '出せなくなった' });
    return { ok: true };
  }
  b.emit({ t: 'dualAnswer', invite: inv.id, ok: true, from: c.id, to: pid });
  reserveDual(b, c, ps, { id: inv.tech, target: inv.target });
  return { ok: true };
}

// さそいを おわりに する（ことわった・時間切れ・やめた・倒れた）。by … ことわった 人
export function endInvite(b, inv, reason, by = null) {
  b.invites.delete(inv.id);
  const c = b.get(inv.from);
  if (c && c.inviting === inv.id) c.inviting = null;
  for (const id of inv.asks || [inv.to]) {
    const p = b.get(id);
    if (p && p.invited === inv.id) p.invited = null;
  }
  // まっていた 仲間は 自分の 番に
  for (const id of inv.partners || []) {
    const p = b.get(id);
    if (p && c && p.dualTarget === c.id) {
      p.dualTarget = null;
      unhold(b, p);
    }
  }
  const who = by || (reason === '時間切れ' ? [...(inv.pending || [])][0] : null) || inv.to;
  b.emit({ t: 'dualAnswer', invite: inv.id, ok: false, from: inv.from, to: who, reason });
  // オートの 人は ふつうに 動く
  if (c && c.alive && c.ready && (!c.controller || c.auto)) {
    c.ready = false;
    b.onReady(c);
  } else if (c && c.alive && c.ready) b.emit({ t: 'ready', id: c.id });
}

// ───── 強さ ─────
// その 人が 技 id を この 敵に ふつうに 出した ときの ダメージ（見つもり。属性は のぞく）
export function skillEstimate(b, m, id, tg, ignoreDef = 0) {
  const a = ABILITIES[id];
  const e = a?.effect;
  if (!e) return 0;
  const pen = m.penChar ? penaltyFor(m.penChar, id).powMult : 1;
  let best = 0;
  for (const p of e.type === 'multi' ? e.parts || [] : [e]) {
    if (p.type === 'phys') {
      const eff = { ...p, element: undefined, ignoreDef: Math.max(p.ignoreDef || 0, ignoreDef) };
      best = Math.max(best, b.calcPhys(m, tg, eff, pen, 'phys', true).dmg * (p.random ? 1 : p.hits || 1));
    } else if (p.type === 'magic' && Array.isArray(p.base)) {
      best = Math.max(best, b.calcMagic(m, tg, { ...p, element: undefined }, pen, true).dmg);
    }
  }
  return best;
}

// 合体技に 入った 人の ぶん: list の 技で いちばん 強い もの（なければ ふつうの 攻撃）
export function memberPower(b, m, list, tg, ignoreDef = 0) {
  let best = b.calcPhys(m, tg, { mult: 1, ignoreDef }, 1, 'phys', true).dmg;
  const set = new Set(list);
  for (const id of m.abilities || []) {
    if (!set.has(id) || !weaponOk(ABILITIES[id], m.weaponCat)) continue;
    best = Math.max(best, skillEstimate(b, m, id, tg, ignoreDef));
  }
  return best;
}

// 合体技に 入った 人の 回復の 力: その 組の 回復の 技で いちばん 強い もの（1人ぶん）
function memberHeal(m, list) {
  let best = 0;
  const set = new Set(list);
  for (const id of m.abilities || []) {
    if (!set.has(id)) continue;
    const e = ABILITIES[id]?.effect;
    for (const p of e?.type === 'multi' ? e.parts || [] : [e]) {
      if (p?.type !== 'heal' || !Array.isArray(p.base)) continue;
      const scale = p.fixed ? 1 : 1 + Math.max(0, Math.min(1, ((m.healPow || 0) - (p.thr ?? 20)) / 150));
      best = Math.max(best, ((p.base[0] + p.base[1]) / 2) * scale);
    }
  }
  return best;
}

// 合体技の ダメージ（敵 1体ぶんの 見つもり）: 出す 人 それぞれが ふつうに 出せる いちばん 強い 技（か ふつうの 攻撃）の 合計 × DUAL_POWER × k
// （組の 技に かぎらない。「2人が 1回ずつ 動く」より はっきり 強く なる ように）
export function dualPower(b, members, tg, part, n) {
  let sum = 0;
  for (const m of members) sum += memberPower(b, m, m.abilities || [], tg, part.ignoreDef || 0);
  return sum * DUAL_POWER[n] * (part.k ?? 1);
}

// ───── 出す ─────
export function performDual(b, c, cmd, ev) {
  const t = DUAL_TECHS[cmd.id];
  const ids = partnersOf(cmd);
  const ps = ids.map((id) => b.get(id));
  ev.name = t?.name || '合体技';
  const bad = ps.find(cantJoin);
  if (!t || !ps.length || bad !== undefined) {
    ev.lines.push(`しかし${bad?.name || '仲間'}は合体技に参加できなかった！`);
    releasePartners(b, cmd);
    return;
  }
  const opt = findOpt(b, c, cmd.id, ids, true);
  if (!opt) {
    ev.lines.push('しかし合体技は出せなかった！');
    releasePartners(b, cmd);
    return;
  }
  const team = opt.partners.map((id) => b.get(id));
  const members = [c, ...team];
  c.mp -= opt.mp[0];
  team.forEach((p, i) => { p.mp -= opt.mp[i + 1]; });
  const n = members.length;
  ev.dual = { id: cmd.id, name: t.name, a: c.id, b: team[0].id, m: members.map((x) => x.id), n };
  ev.lines.push(`${members.map((x) => x.name).join('と')}の合体技！`, `${t.name}！`);
  // 組の じゅんの 人と、その 人の 組（強さの 見つもりに 使う）
  const byGroup = opt.who.map((id) => b.get(id));
  const groups = byGroup.map((m) => t.need[opt.who.indexOf(m.id)]);
  const hit = new Set();
  for (const part of t.parts) {
    if (part.say) ev.lines.push(part.say);
    const scope = part.target || t.target;
    if (part.type === 'power') {
      const element = part.elementFrom !== undefined ? opt.element || undefined : part.element;
      powerHit(b, c, byGroup, part, scope, element, cmd, ev, hit, n);
    } else if (part.type === 'heal') {
      const sum = byGroup.reduce((s, m, i) => s + memberHeal(m, groups[i]), 0);
      for (const x of b.targetsFor(c, { target: scope === 'enemies' || scope === 'enemy' ? 'allies' : scope }, cmd)) {
        const amt = Math.max(1, Math.round(x.maxHp * (part.pct || 0) + sum * DUAL_POWER[n] * (part.k ?? 0)));
        b.heal(c, x, { base: [amt, Math.round(amt * 1.06)], fixed: true }, ev, 1);
        hit.add(x.id);
      }
    } else if (part.type === 'revive') {
      const dead = b.targetsFor(c, { target: 'deadAllies' }, cmd);
      if (dead.length) b.applyAbility(c, { name: t.name, effect: { type: 'revive', hpRatio: part.pct || 0.3 }, target: 'deadAllies', anim: t.anim }, cmd, ev, 1, dead);
      for (const x of dead) hit.add(x.id);
    } else {
      const eff = { ...part };
      delete eff.say;
      delete eff.target;
      const ab = { name: t.name, effect: eff, target: scope, anim: t.anim };
      const targets = b.targetsFor(c, ab, cmd);
      ev.inMulti = true;
      b.applyAbility(c, ab, cmd, ev, 1, targets);
      delete ev.inMulti;
      for (const x of targets) hit.add(x.id);
    }
  }
  ev.fx = { type: 'dual', anim: t.anim, actor: c.id, partner: team[0].id, members: ev.dual.m, targets: [...hit], side: 'ally', element: opt.element || t.element, size: n };
  ev.extraLock = (ev.extraLock || 0) + 700 + 300 * (n - 2);
  for (const p of team) {
    p.atb = 0;
    p.ready = false;
  }
  releasePartners(b, cmd);
  ev.upd.push(c, ...team);
  b.addBond(6 + 3 * (n - 2));
}

// 合体技の ダメージを 当てる（hits 回に 分けて）
function powerHit(b, c, byGroup, part, scope, element, cmd, ev, hit, n) {
  const targets = b.targetsFor(c, { target: scope }, cmd);
  if (!targets.length) {
    ev.lines.push('しかし効果がなかった！');
    return;
  }
  for (const tg of targets) {
    if (!tg.alive) continue;
    hit.add(tg.id);
    if (part.kind === 'phys') b.noteCounter(c, tg, ev);
    const r = element && element !== 'phys' ? tg.resist?.[element] ?? 1 : 1;
    if (r === 0) {
      ev.lines.push(`しかし${tg.name}には効かなかった！`);
      (ev.results = ev.results || []).push({ id: tg.id, miss: true, element, aff: b.noteTried(tg, element) || undefined });
      continue;
    }
    let d = dualPower(b, byGroup, tg, part, n) * r * b.rng.float(0.92, 1.08);
    if (tg.metal) d = b.rng.int(1, n + 1);
    const hits = Math.max(1, part.hits || 1);
    const each = Math.max(1, Math.round(d / hits));
    for (let h = 0; h < hits && tg.alive; h++) b.damage(c, tg, tg.metal && h > 0 ? 0 : each, ev, { element: element || 'phys' });
    if (part.dispel && tg.alive) b.dispel(tg, ev);
    if (part.status && tg.alive) b.tryStatus(c, tg, part.status, ev, 1);
    if (part.debuff && tg.alive) b.applyDebuff(c, tg, part.debuff, ev, 1);
  }
  b.afterDamage(c, ev, element || 'phys');
}
