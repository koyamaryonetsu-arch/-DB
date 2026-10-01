// 馬車（サーバーの きまり）: もらう・乗りかえ・経験値の おすそわけ・たたかいでの いれかえ
//   きまりの せつめいは data/wagon.js
import { MAPS } from '../maps/index.js?v=f05b52911d0e';
import { scaleExp } from '../data/difficulty.js?v=f05b52911d0e';
import { COMPANION_SLOTS } from '../data/companions.js?v=f05b52911d0e';
import { JOBS } from '../data/jobs.js?v=f05b52911d0e';
import { WAGON_SLOTS, WAGON_EXP_RATE, hasWagon, cleanWagon } from '../data/wagon.js?v=f05b52911d0e';
import { computeStats, fullHeal, jobTrainable } from '../stats.js?v=f05b52911d0e';
import { pub } from '../battle.js?v=f05b52911d0e';
import { partyOf, companionOf, ensureCompanions, stowGear, afterRosterChange, syncParty, nameOfKey, supportInfo } from './party.js?v=f05b52911d0e';

const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });

// 馬車が 入れる マップ（フィールドだけ。洞窟・塔の 中は 入り口で 待つ）
export function wagonHere(mapId) {
  return MAPS[mapId]?.kind === 'field';
}

export function grantWagon(c) {
  if (!c) return false;
  const first = !c.wagon;
  c.wagon = true;
  cleanWagon(c);
  return first;
}

// パーティーの 馬車（リーダーの もの）の 仲間
function leaderChar(world, p) {
  return p ? world.sessions.get(p.leader)?.char || null : null;
}

export function wagonEntries(c) {
  if (!hasWagon(c)) return [];
  cleanWagon(c);
  return (c.wagonKeys || []).map((k) => companionOf(c, k)).filter(Boolean);
}

export function wagonChars(world, p) {
  return wagonEntries(leaderChar(world, p)).map((e) => e.char);
}

// クライアントへ おくる 馬車の 仲間（パーティーの 仲間と おなじ 形。wagon: true）
export function wagonState(world, p) {
  const lc = leaderChar(world, p);
  if (!hasWagon(lc)) return null;
  return wagonEntries(lc).map((e) => ({ ...supportInfo({ key: e.key, owner: lc.id, kind: e.kind, char: e.char }), wagon: true }));
}

// ほかの 人の 画面に 馬車を かく しるし（リーダーで 馬車を もっている とき）
export function wagonLook(world, s) {
  const p = partyOf(world, s);
  return hasWagon(s.char) && (!p || p.leader === s.id) ? 1 : 0;
}

// ───────────── 乗りかえ ─────────────
// 仲間を 馬車に 乗せる。パーティーからなら 装備は そのまま、酒場からなら 休んで 元気いっぱい
// swapKey: 馬車が いっぱいの ときに 入れかわる 馬車の 仲間（パーティーから 乗る ときは その 場所へ、酒場から 乗る ときは 酒場へ）
export function toWagon(world, s, key, swapKey) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  if (String(key).startsWith('fam:')) return fail('家族のキャラクターは馬車に乗れません');
  const e = companionOf(c, key);
  if (!e) return fail('見つかりません');
  if (c.wagonKeys.includes(key)) return fail(`${e.char.name}はもう馬車に乗っている`);
  const pi = c.partyKeys.indexOf(key);
  let swapped = null, stowed = [];
  if (c.wagonKeys.length >= WAGON_SLOTS) {
    const wi = swapKey ? c.wagonKeys.indexOf(swapKey) : -1;
    if (wi < 0) return fail(`馬車には${WAGON_SLOTS}人まで乗れます`, { full: true });
    if (pi >= 0) c.partyKeys[pi] = swapKey;
    else stowed = stowGear(c, swapKey);
    c.wagonKeys[wi] = key;
    swapped = swapKey;
  } else {
    if (pi >= 0) c.partyKeys.splice(pi, 1);
    c.wagonKeys.push(key);
  }
  if (pi < 0) fullHeal(e.char);
  afterRosterChange(world, s);
  return { ok: true, name: e.char.name, swappedName: nameOfKey(world, c, swapped), swappedTo: swapped ? (pi >= 0 ? 'party' : 'tavern') : null, stowed };
}

// 馬車の 仲間を パーティーに 入れる（いっぱいなら swapKey の 仲間と 入れかわって、その 仲間が 馬車へ）
export function fromWagon(world, s, key, swapKey) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  const wi = c.wagonKeys.indexOf(key);
  const e = companionOf(c, key);
  if (wi < 0 || !e) return fail('馬車にいません');
  let swapped = null;
  if (c.partyKeys.length < COMPANION_SLOTS && !swapKey) {
    c.wagonKeys.splice(wi, 1);
    c.partyKeys.push(key);
  } else {
    const pi = swapKey ? c.partyKeys.indexOf(swapKey) : -1;
    if (pi < 0) return fail('パーティーがいっぱいです。だれと入れかわるか選ぼう', { full: true });
    if (String(swapKey).startsWith('fam:')) return fail('家族のキャラクターは馬車に乗れません');
    c.partyKeys[pi] = key;
    c.wagonKeys[wi] = swapKey;
    swapped = swapKey;
  }
  afterRosterChange(world, s);
  return { ok: true, name: e.char.name, swappedName: nameOfKey(world, c, swapped) };
}

// 馬車の 仲間に 酒場で 待っていて もらう（装備は ふくろへ）
export function wagonWait(world, s, key) {
  const c = ensureCompanions(s.char);
  const i = (c.wagonKeys || []).indexOf(key);
  if (i < 0) return fail('馬車にいません');
  c.wagonKeys.splice(i, 1);
  const stowed = stowGear(c, key);
  afterRosterChange(world, s);
  return { ok: true, name: nameOfKey(world, c, key), stowed };
}

const stowText = (list) => (list?.length ? `\n（装備していた${list.slice(0, 3).join('・')}${list.length > 3 ? 'など' : ''}はふくろにしまった）` : '');

function toWagonText(r) {
  if (!r.ok) return '';
  if (r.swappedTo === 'party') return `${r.name}は馬車に乗った。\n${r.swappedName}が馬車からおりて、パーティーに入った！`;
  if (r.swappedTo === 'tavern') return `${r.name}は馬車に乗った。\n${r.swappedName}は酒場で待っている。${stowText(r.stowed)}`;
  return `${r.name}は馬車に乗った。`;
}

function fromWagonText(r) {
  if (!r.ok) return '';
  return `${r.name}が馬車からおりて、パーティーに入った！${r.swappedName ? `\n${r.swappedName}は馬車に乗った。` : ''}`;
}

// 酒場の 乗りかえ（services.js の 酒場から）。知らない action なら null
export function wagonTavernAction(world, s, msg) {
  const key = String(msg.key || '');
  const swap = msg.swap ? String(msg.swap) : null;
  switch (msg.action) {
    case 'toWagon': {
      const r = toWagon(world, s, key, swap);
      return { ...r, text: toWagonText(r) };
    }
    case 'fromWagon': {
      const r = fromWagon(world, s, key, swap);
      return { ...r, text: fromWagonText(r) };
    }
    case 'wagonWait': {
      const r = wagonWait(world, s, key);
      return { ...r, text: r.ok ? `${r.name}は馬車をおりて、酒場で待っている。${stowText(r.stowed)}` : '' };
    }
    default:
      return null;
  }
}

// メニューの「仲間」→「馬車」（パーティー ⇄ 馬車 だけ。馬車が いっしょの ときだけ）
export function wagonMenuAction(world, s, msg) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  const p = partyOf(world, s);
  if (p && p.leader !== s.id) return fail('パーティーの馬車はリーダーのものです');
  if (!wagonHere(s.map)) return fail('馬車は入り口で待っている。\n（洞窟や塔の中では乗りかえられない）');
  const key = String(msg.key || '');
  const other = msg.with ? String(msg.with) : null;
  if (msg.op === 'in') {
    if (!c.partyKeys.includes(key)) return fail('パーティーにいません');
    const r = toWagon(world, s, key, other);
    return { ...r, text: toWagonText(r) };
  }
  if (msg.op === 'out') {
    const r = fromWagon(world, s, key, other);
    return { ...r, text: fromWagonText(r) };
  }
  return fail('');
}

// 酒場の じょうほうに 馬車を たす
export function wagonTavernInfo(c, info) {
  if (!hasWagon(c)) return info;
  cleanWagon(c);
  for (const e of info.roster || []) if (c.wagonKeys.includes(e.key)) e.inWagon = true;
  info.wagon = { max: WAGON_SLOTS, keys: [...c.wagonKeys] };
  return info;
}

// 教会: 馬車の 仲間も 生き返らせる・毒を なおす（ref は 'wagon:key'）
export function wagonChurch(world, s, dead, poisoned, priceOf, curePrice) {
  const p = partyOf(world, s);
  for (const e of wagonEntries(leaderChar(world, p))) {
    const ch = e.char;
    if (ch.hp <= 0) dead.push({ ref: 'wagon:' + e.key, name: ch.name, price: priceOf(ch.level), wagon: true });
    else if (ch.status?.poison) poisoned.push({ ref: 'wagon:' + e.key, name: ch.name, price: curePrice, wagon: true });
  }
}

export function wagonRefChar(world, s, ref) {
  if (!ref?.startsWith('wagon:')) return null;
  const e = wagonEntries(leaderChar(world, partyOf(world, s))).find((x) => x.key === ref.slice(6));
  return e?.char || null;
}

// ───────────── 経験値の おすそわけ ─────────────
// 勝った たたかいの あとで。たたかいに 出ていない 馬車の 仲間（生きている 人）が 半分もらう
//   grow(ch, exp, trains) … 仲間を そだてて メッセージを つくる（battles.js）  say(line) … メッセージ
export function wagonShare(world, ctx, { exp, trainN, maxEnemyLv, grow, say }) {
  const p = world.parties.get(ctx.partyId);
  const lc = leaderChar(world, p);
  if (!hasWagon(lc) || !wagonHere(ctx.map)) return 0;
  const active = new Set(ctx.battle.allies.map((a) => ctx.actorMap[a.id]?.char).filter(Boolean));
  const list = wagonEntries(lc).filter((e) => !active.has(e.char) && e.char.hp > 0);
  // 馬車の もちぬし（リーダー）の むずかしさで へらしてから 半分
  const x = Math.floor(scaleExp(lc, exp) * WAGON_EXP_RATE);
  if (!list.length || (x <= 0 && !trainN)) return 0;
  if (x > 0) say(`馬車の仲間は${x}ポイントの経験値をかくとく！`);
  for (const e of list) {
    const ch = e.char;
    let trains = 0;
    // 職業の 修行も 半分（はんぱは 次の 戦いに もちこす）
    if (!ch.species && trainN > 0 && jobTrainable(ch, maxEnemyLv)) {
      const carry = (ch.wagonTrain || 0) + trainN * WAGON_EXP_RATE;
      trains = Math.floor(carry);
      ch.wagonTrain = carry - trains;
      if (!ch.wagonTrain) delete ch.wagonTrain;
    }
    grow(ch, x, trains);
  }
  return list.length;
}

// ───────────── たたかいの「いれかえ」 ─────────────
// 自分（プレイヤー）か 自分の 仲間を、馬車の 仲間と 入れかえる。その 番を 使う
//   msg: { actor, cmd: { type: 'swap', out: 戦っている 人の id, key: 馬車の 仲間の key か 'self' } }
// 仲間どうしの 入れかえは、戦いの あとも そのまま（パーティーと 馬車の ならびが 入れかわる）。
// 自分が 馬車に 乗った ときの 代わりの 仲間は、戦いの あとで 馬車に もどる
export function wagonBattleSwap(world, s, ctx, msg) {
  const b = ctx.battle;
  const no = (reason) => {
    world.send(s, { t: 'battleRej', reason });
    return fail(reason);
  };
  const c = ensureCompanions(s.char);
  const p = world.parties.get(ctx.partyId);
  if (!hasWagon(c)) return no('馬車がない');
  if (!p || p.leader !== s.id) return no('馬車はリーダーだけが使える');
  if (!wagonHere(ctx.map)) return no('馬車は入り口で待っている！');
  if (b.over || b.pendingEnd || b.bondCharge) return no('今は入れかえられない');
  const actor = b.get(msg.actor);
  if (!actor || actor.side !== 'ally' || actor.fled || !actor.alive || actor.controller !== s.id) return no('できません');
  if (!actor.ready) return no('まだ順番が来ていない');
  const cmd = msg.cmd || {};
  const out = b.get(String(cmd.out || ''));
  if (!out || out.side !== 'ally' || out.fled) return no('その人は入れかえられない');
  const who = ctx.actorMap[out.id];
  const outSelf = who?.type === 'human' && who.sid === s.id;
  const outKey = who?.type === 'support' && who.owner === c.id && who.kind !== 'family' && companionOf(c, who.key) ? who.key : null;
  if (!outSelf && !outKey) return no('その人は馬車に乗れない');
  if (out.waitDual || out.dualWith || out.dualTarget || out.invited || (out !== actor && out.inviting)) return no('合体技の前なので入れかえられない');
  const activeChars = new Set(b.allies.map((a) => ctx.actorMap[a.id]?.char).filter(Boolean));
  const inKey = String(cmd.key || '');
  let init, map;
  if (inKey === 'self') {
    if (activeChars.has(c)) return no('もう戦っている');
    init = { char: c, kind: 'player', controller: s.id, auto: !!c.battleSettings?.auto };
    map = { type: 'human', sid: s.id, char: c };
  } else {
    const e = c.wagonKeys.includes(inKey) ? companionOf(c, inKey) : null;
    if (!e) return no('馬車にいない');
    if (activeChars.has(e.char)) return no('もう戦っている');
    if (e.char.hp <= 0) return no(`${e.char.name}は死んでいる…`);
    const tac = e.char.tactics || 'balanced';
    // 自分の 代わりに 出る 仲間と「めいれいさせろ」の 仲間は、自分が コマンドを えらぶ
    const manual = outSelf || tac === 'manual';
    init = {
      char: e.char, kind: e.kind === 'monster' ? 'monster' : 'support',
      controller: manual ? s.id : null, auto: manual ? !!c.battleSettings?.auto : true,
      tactics: tac === 'manual' ? 'balanced' : tac,
    };
    map = { type: 'support', key: e.key, owner: c.id, kind: e.kind, char: e.char, manual };
  }
  // 自分の 番を 使う
  if (actor.inviting) {
    const inv = b.invites.get(actor.inviting);
    if (inv) b.endInvite(inv, 'やめた');
  }
  actor.ready = false;
  actor.atb = 0;
  writeBack(ctx, out);
  const nc = b.swapAlly(out.id, init);
  if (!nc) return no('できません');
  ctx.actorMap[nc.id] = map;
  // モンスターマスターが いると なかまの まものが つよくなる（はじめから いる 仲間と おなじ）
  if (nc.mon) {
    const boost = Math.max(1, ...ctx.sids.map((sid) => JOBS[world.sessions.get(sid)?.char?.job]?.passive?.monsterBoost || 1));
    if (boost > 1) { nc.atk = Math.round(nc.atk * boost); nc.dfn = Math.round(nc.dfn * boost); }
  }
  // パーティーと 馬車の ならび
  const standIn = ctx.wagonStandIn || null;
  if (outSelf) ctx.wagonStandIn = inKey;
  else if (outKey === standIn) ctx.wagonStandIn = inKey === 'self' ? null : inKey;
  else {
    const back = inKey === 'self' ? standIn : inKey;
    const pi = c.partyKeys.indexOf(outKey), wi = c.wagonKeys.indexOf(back);
    if (pi >= 0 && wi >= 0) {
      c.partyKeys[pi] = back;
      c.wagonKeys[wi] = outKey;
    }
    if (inKey === 'self') ctx.wagonStandIn = null;
  }
  const lines = [
    out.alive ? `${out.name}は馬車にもどった。` : `${out.name}は馬車に運びこまれた。`,
    `${nc.name}が馬車から飛び出した！`,
  ];
  b.lock = Math.max(b.lock, b.pace(500, 380, lines.length, 900));
  const upd = [...new Set([out, actor])].map(pub);
  b.emit({ t: 'msg', lines, upd, joined: [pub(nc)], swap: { out: out.id, in: nc.id }, fx: { type: 'wagon', actor: nc.id }, dur: b.lock });
  syncParty(world, p);
  world.sendParty(p);
  world.sendSelf(s);
  world.markDirty();
  return { ok: true, id: nc.id };
}

// たたかいから ぬける 人の HP・MP など（finishBattle と おなじ）
function writeBack(ctx, a) {
  const who = ctx.actorMap[a.id];
  const ch = who?.char;
  if (!ch) return;
  ch.hp = a.alive ? a.hp : 0;
  ch.mp = a.mp;
  ch.status = a.status?.poison && a.alive ? { poison: true } : {};
  if (a.use && who.type !== 'guest' && who.kind !== 'family') {
    ch.skillUse = { ...a.use };
    if (a.hiraNew?.length) ch.hirameki = [...new Set([...(Array.isArray(ch.hirameki) ? ch.hirameki : []), ...a.hiraNew])];
  }
  if (!Number.isFinite(ch.hp)) ch.hp = computeStats(ch).maxHp;
}
