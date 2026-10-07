// 馬車（サーバーの きまり）: もらう・乗りかえ・総入れかえ・経験値の おすそわけ・たたかいでの いれかえ
//   きまりの せつめいは data/wagon.js
import { MAPS } from '../maps/index.js?v=1f8c4e9d1fb7';
import { scaleExp } from '../data/difficulty.js?v=1f8c4e9d1fb7';
import { COMPANION_SLOTS } from '../data/companions.js?v=1f8c4e9d1fb7';
import { JOBS } from '../data/jobs.js?v=1f8c4e9d1fb7';
import { WAGON_SLOTS, WAGON_EXP_RATE, hasWagon, cleanWagon } from '../data/wagon.js?v=1f8c4e9d1fb7';
import { computeStats, fullHeal } from '../stats.js?v=1f8c4e9d1fb7';
import { pub } from '../battle.js?v=1f8c4e9d1fb7';
import {
  partyOf, companionOf, ensureCompanions, stowGear, afterRosterChange, syncParty, nameOfKey, supportInfo,
  famCopy, humanCharIds, dropMissingFam, creditSupportOwner, PARTY_MAX, BATTLE_FILL,
} from './party.js?v=1f8c4e9d1fb7';

const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });
const isFam = (k) => String(k || '').startsWith('fam:');

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

// 馬車に 乗っている 仲間 [{ key, kind, char }]（c … 馬車の もちぬし、p … その 人の パーティー）
//   家族の キャラは うつし（party.js の famCopy）。本人が パーティーに いる 人・いない 人は のぞく
export function wagonEntries(world, c, p) {
  if (!hasWagon(c)) return [];
  cleanWagon(c);
  const humans = humanCharIds(world, p);
  const out = [];
  for (const k of c.wagonKeys) {
    if (isFam(k)) {
      if (humans.has(k.slice(4))) continue;
      const ch = famCopy(world, p, c, k);
      if (ch) out.push({ key: k, kind: 'family', char: ch });
    } else {
      const e = companionOf(c, k);
      if (e) out.push(e);
    }
  }
  return out;
}

export function wagonChars(world, p) {
  return wagonEntries(world, leaderChar(world, p), p).map((e) => e.char);
}

// クライアントへ おくる 馬車の 仲間（パーティーの 仲間と おなじ 形。wagon: true）
export function wagonState(world, p) {
  const lc = leaderChar(world, p);
  if (!hasWagon(lc)) return null;
  return wagonEntries(world, lc, p).map((e) => ({ ...supportInfo({ key: e.key, owner: lc.id, kind: e.kind, char: e.char }), wagon: true }));
}

// ほかの 人の 画面に 馬車を かく しるし（リーダーで 馬車を もっている とき）
export function wagonLook(world, s) {
  const p = partyOf(world, s);
  return hasWagon(s.char) && (!p || p.leader === s.id) ? 1 : 0;
}

// 自分の 仲間か 家族の キャラか（なまえ）。知らない key は null
function memberName(world, c, key) {
  if (isFam(key)) {
    const other = world.data.characters[key.slice(4)];
    return other && other.id !== c.id ? other.name : null;
  }
  return companionOf(c, key)?.char.name || null;
}

// ───────────── 乗りかえ ─────────────
// 仲間を 馬車に 乗せる。パーティーからなら 装備は そのまま、酒場からなら 休んで 元気いっぱい
// swapKey: 馬車が いっぱいの ときに 入れかわる 馬車の 仲間（パーティーから 乗る ときは その 場所へ、酒場から 乗る ときは 酒場へ）
// 家族の キャラも 乗れる（家族の 装備は その 人の ものなので、酒場へ もどっても ふくろには しまわない）
export function toWagon(world, s, key, swapKey) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  dropMissingFam(world, c);
  const name = memberName(world, c, key);
  if (!name) return fail('見つかりません');
  if (c.wagonKeys.includes(key)) return fail(`${name}はもう馬車に乗っている`);
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
  const e = companionOf(c, key);
  if (pi < 0 && e) fullHeal(e.char);
  afterRosterChange(world, s);
  return { ok: true, name, swappedName: nameOfKey(world, c, swapped), swappedTo: swapped ? (pi >= 0 ? 'party' : 'tavern') : null, stowed };
}

// 馬車の 仲間を パーティーに 入れる（いっぱいなら swapKey の 仲間と 入れかわって、その 仲間が 馬車へ）
export function fromWagon(world, s, key, swapKey) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  dropMissingFam(world, c);
  const wi = c.wagonKeys.indexOf(key);
  const name = memberName(world, c, key);
  if (wi < 0 || !name) return fail('馬車にいません');
  let swapped = null;
  if (c.partyKeys.length < COMPANION_SLOTS && !swapKey) {
    c.wagonKeys.splice(wi, 1);
    c.partyKeys.push(key);
  } else {
    const pi = swapKey ? c.partyKeys.indexOf(swapKey) : -1;
    if (pi < 0) return fail('パーティーがいっぱいです。だれと入れかわるか選ぼう', { full: true });
    c.partyKeys[pi] = key;
    c.wagonKeys[wi] = swapKey;
    swapped = swapKey;
  }
  afterRosterChange(world, s);
  return { ok: true, name, swappedName: nameOfKey(world, c, swapped) };
}

// 馬車の 仲間に 酒場で 待っていて もらう（装備は ふくろへ。家族の キャラは そのまま）
export function wagonWait(world, s, key) {
  const c = ensureCompanions(s.char);
  const i = (c.wagonKeys || []).indexOf(key);
  if (i < 0) return fail('馬車にいません');
  c.wagonKeys.splice(i, 1);
  const stowed = stowGear(c, key);
  afterRosterChange(world, s);
  return { ok: true, name: nameOfKey(world, c, key), stowed };
}

// ───────────── 総入れかえ ─────────────
// メニュー（と 酒場）の「総入れかえ」: 1〜4番目が 戦う 仲間（自分は かならず ここ）、5〜8番目が 馬車
//   party: 'self' と 仲間の key（4つまで。'self' の 場所が 自分の ならび）  wagon: 馬車に 乗る key（4つまで）
//   今 パーティーと 馬車に いる みんなを 1回ずつ ならべる（酒場の 仲間は 入れない・へらさない）
export function arrangeWagon(world, s, msg) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  const p = partyOf(world, s);
  if (p && p.leader !== s.id) return fail('パーティーの馬車はリーダーのものです');
  if (!wagonHere(s.map)) return fail('馬車は入り口で待っている。\n（洞窟や塔の中では乗りかえられない）');
  const before = JSON.stringify([c.selfPos || 0, c.partyKeys, c.wagonKeys]);
  dropMissingFam(world, c);
  const gone = (k) => isFam(k) && !memberName(world, c, k);
  const party = Array.isArray(msg.party) ? msg.party.map(String).filter((k) => !gone(k)) : null;
  const wagon = Array.isArray(msg.wagon) ? msg.wagon.map(String).filter((k) => !gone(k)) : null;
  if (!party || !wagon) return fail('ならべかたがおかしいみたい');
  if (party.filter((k) => k === 'self').length !== 1 || wagon.includes('self')) return fail('自分はかならず1〜4番目に入るよ');
  if (party.length > 1 + COMPANION_SLOTS) return fail(`戦う仲間は自分をふくめて${1 + COMPANION_SLOTS}人まで`);
  if (wagon.length > WAGON_SLOTS) return fail(`馬車には${WAGON_SLOTS}人まで乗れます`);
  const keys = [...party.filter((k) => k !== 'self'), ...wagon];
  const now = [...c.partyKeys, ...c.wagonKeys];
  if (new Set(keys).size !== keys.length || keys.length !== now.length || keys.some((k) => !now.includes(k))) {
    return fail('仲間をみんな1回ずつならべてね');
  }
  c.selfPos = party.indexOf('self');
  c.partyKeys = party.filter((k) => k !== 'self');
  c.wagonKeys = wagon;
  if (JSON.stringify([c.selfPos, c.partyKeys, c.wagonKeys]) === before) return { ok: true, same: true, text: 'ならびはそのままにした。' };
  // パーティーの 仲間は ならびの じゅんに 入りなおす（syncParty）
  afterRosterChange(world, s);
  return { ok: true, text: '総入れかえをした！' };
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
    case 'arrange':
      return arrangeWagon(world, s, msg);
    default:
      return null;
  }
}

// メニューの「仲間」→「馬車」（パーティー ⇄ 馬車 と 総入れかえ。馬車が いっしょの ときだけ）
export function wagonMenuAction(world, s, msg) {
  const c = ensureCompanions(s.char);
  if (!hasWagon(c)) return fail('馬車を持っていない');
  if (msg.op === 'arrange') return arrangeWagon(world, s, msg);
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
  for (const e of [...(info.roster || []), ...(info.family || [])]) if (c.wagonKeys.includes(e.key)) e.inWagon = true;
  info.wagon = { max: WAGON_SLOTS, keys: [...c.wagonKeys] };
  return info;
}

// 教会: 馬車の 仲間も 生き返らせる・毒を なおす（ref は 'wagon:key'）
export function wagonChurch(world, s, dead, poisoned, priceOf, curePrice) {
  const p = partyOf(world, s);
  for (const e of wagonEntries(world, leaderChar(world, p), p)) {
    const ch = e.char;
    if (ch.hp <= 0) dead.push({ ref: 'wagon:' + e.key, name: ch.name, price: priceOf(ch.level), wagon: true });
    else if (ch.status?.poison) poisoned.push({ ref: 'wagon:' + e.key, name: ch.name, price: curePrice, wagon: true });
  }
}

// フィールドで 回復できる 馬車の 仲間（馬車が いっしょの とき だけ。洞窟・塔の 中では 入り口で 待っている）
//   own … 自分の 仲間だけ（呪文を 唱える 人。家族の うつしは のぞく）
// 自分の 馬車の 仲間（自分が リーダーか、ひとりの とき。家族の キャラは のぞく）。みんなさいきょう装備で 使う
export function ownWagonEntries(world, s) {
  const p = partyOf(world, s);
  const lc = leaderChar(world, p) || (!p ? s.char : null);
  if (!lc || lc !== s.char) return [];
  return wagonEntries(world, lc, p).filter((e) => e.kind !== 'family');
}

export function wagonHealEntries(world, s, own = false) {
  if (!wagonHere(s.map)) return [];
  const p = partyOf(world, s);
  const lc = leaderChar(world, p) || (!p ? s.char : null);
  return wagonEntries(world, lc, p).filter((e) => !own || (lc === s.char && e.kind !== 'family'));
}

export function wagonRefChar(world, s, ref) {
  if (!ref?.startsWith('wagon:')) return null;
  const p = partyOf(world, s);
  const e = wagonEntries(world, leaderChar(world, p), p).find((x) => x.key === ref.slice(6));
  return e?.char || null;
}

// ───────────── 経験値の おすそわけ ─────────────
// 勝った たたかいの あとで。たたかいに 出ていない 馬車の 仲間（生きている 人）が 半分もらう
//   家族の キャラ（うつし）は、本人に とどく おすそわけが パーティーで 戦った ときの 半分（お金は なし）
//   grow(ch, exp, trains) … 仲間を そだてて メッセージを つくる（battles.js）  say(line) … メッセージ
export function wagonShare(world, ctx, { exp, trainN, grow, say }) {
  const p = world.parties.get(ctx.partyId);
  const lc = leaderChar(world, p);
  if (!hasWagon(lc) || !wagonHere(ctx.map)) return 0;
  const active = new Set(ctx.battle.allies.map((a) => ctx.actorMap[a.id]?.char).filter(Boolean));
  const list = wagonEntries(world, lc, p).filter((e) => !active.has(e.char) && e.char.hp > 0);
  // 馬車の もちぬし（リーダー）の むずかしさで へらしてから 半分
  const x = Math.floor(scaleExp(lc, exp) * WAGON_EXP_RATE);
  if (!list.length || (x <= 0 && !trainN)) return 0;
  if (x > 0 && list.some((e) => e.kind !== 'family')) say(`馬車の仲間は${x}ポイントの経験値をかくとく！`);
  for (const e of list) {
    const ch = e.char;
    if (e.kind === 'family') {
      const owner = world.data.characters[ch.ownerId];
      if (owner) creditSupportOwner(world, owner.id, Math.floor(scaleExp(owner, exp) * WAGON_EXP_RATE), 0, lc.name);
      continue;
    }
    let trains = 0;
    // 職業の 修行も 半分（はんぱは 次の 戦いに もちこす）
    if (!ch.species && trainN > 0) {
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
// 自分（プレイヤー）か 自分の 仲間（家族の キャラも）を、馬車の 仲間と 入れかえる。その 番を 使う
//   msg: { actor, cmd: { type: 'swap', out: 戦っている 人の id, key: 馬車の 仲間の key か 'self' } }
//   総入れかえ: { actor, cmd: { type: 'swap', all: [戦う 仲間の key …] } }（自分は かならず 戦う。1回で まとめて 入れかえ、番は 1回）
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
  if (cmd.all !== undefined) return swapAll(world, s, ctx, actor, cmd.all, no);
  const out = b.get(String(cmd.out || ''));
  if (!out || out.side !== 'ally' || out.fled) return no('その人は入れかえられない');
  const who = ctx.actorMap[out.id];
  const outSelf = who?.type === 'human' && who.sid === s.id;
  const outKey = ownKeyOf(ctx, c, out);
  if (!outSelf && !outKey) return no('その人は馬車に乗れない');
  if (dualBusy(out, actor)) return no('合体技の前なので入れかえられない');
  const activeChars = new Set(b.allies.map((a) => ctx.actorMap[a.id]?.char).filter(Boolean));
  const inKey = String(cmd.key || '');
  let init, map;
  if (inKey === 'self') {
    if (activeChars.has(c)) return no('もう戦っている');
    init = { char: c, kind: 'player', controller: s.id, auto: !!c.battleSettings?.auto };
    map = { type: 'human', sid: s.id, char: c };
  } else {
    const e = c.wagonKeys.includes(inKey) ? wagonEntries(world, c, p).find((x) => x.key === inKey) : null;
    if (!e) return no('馬車にいない');
    if (activeChars.has(e.char)) return no('もう戦っている');
    if (e.char.hp <= 0) return no(`${e.char.name}は死んでいる…`);
    // 自分の 代わりに 出る 仲間と「めいれいさせろ」の 仲間は、自分が コマンドを えらぶ
    ({ init, map } = joinInit(s, c, e, outSelf));
  }
  useTurn(b, actor);
  writeBack(ctx, out);
  const nc = b.swapAlly(out.id, init);
  if (!nc) return no('できません');
  ctx.actorMap[nc.id] = map;
  monsterBoost(world, ctx, nc);
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
  afterSwap(world, s, p);
  return { ok: true, id: nc.id };
}

// 総入れかえ（たたかい）: all … 戦う 仲間の key（今 戦っている 仲間と 馬車の 仲間から）。自分は そのまま 戦う
//   戦っている 仲間の 数は へらせない（あいている 場所が あれば ふやせる）。番は 1回 使う
function swapAll(world, s, ctx, actor, all, no) {
  const b = ctx.battle;
  const c = s.char;
  const p = world.parties.get(ctx.partyId);
  const meIn = b.allies.some((a) => ctx.actorMap[a.id]?.type === 'human' && ctx.actorMap[a.id].sid === s.id);
  if (!meIn) return no('自分が馬車にいる時は、ひとりずつ入れかえよう');
  if (!Array.isArray(all)) return no('ならべかたがおかしいみたい');
  const want = all.map(String);
  const seats = b.allies.filter((a) => ownKeyOf(ctx, c, a)).sort((x, y) => (x.slot ?? 0) - (y.slot ?? 0));
  const seatKeys = seats.map((a) => ctx.actorMap[a.id].key);
  const wagon = new Map(wagonEntries(world, c, p).map((e) => [e.key, e]));
  const room = Math.max(0, Math.min(COMPANION_SLOTS - c.partyKeys.length, BATTLE_FILL - b.allies.filter((a) => a.kind !== 'guest').length));
  if (new Set(want).size !== want.length || want.length < seats.length || want.length > seats.length + room) return no('ならべかたがおかしいみたい');
  for (const k of want) if (!seatKeys.includes(k) && !wagon.has(k)) return no('その仲間は選べない');
  const ins = want.filter((k) => !seatKeys.includes(k));
  const outs = seats.filter((a) => !want.includes(ctx.actorMap[a.id].key));
  if (!ins.length) return no('だれも入れかわらない');
  for (const k of ins) if (wagon.get(k).char.hp <= 0) return no(`${wagon.get(k).char.name}は死んでいる…`);
  if (outs.some((o) => dualBusy(o, actor))) return no('合体技の前なので入れかえられない');
  useTurn(b, actor);
  const pairs = [], joined = [];
  ins.forEach((k, i) => {
    const e = wagon.get(k);
    const { init, map } = joinInit(s, c, e, false);
    const out = outs[i] || null;
    let nc;
    if (out) {
      const outKey = ctx.actorMap[out.id].key;
      writeBack(ctx, out);
      nc = b.swapAlly(out.id, init);
      const pi = c.partyKeys.indexOf(outKey), wi = c.wagonKeys.indexOf(k);
      if (pi >= 0 && wi >= 0) {
        c.partyKeys[pi] = k;
        c.wagonKeys[wi] = outKey;
      }
    } else {
      // あいている 場所に 入る
      nc = b.addAlly(init);
      nc.atb = b.rng.float(0, 40);
      c.wagonKeys = c.wagonKeys.filter((x) => x !== k);
      if (!c.partyKeys.includes(k)) c.partyKeys.push(k);
    }
    if (!nc) return;
    ctx.actorMap[nc.id] = map;
    monsterBoost(world, ctx, nc);
    pairs.push({ out: out ? out.id : null, in: nc.id });
    joined.push(nc);
  });
  if (!joined.length) return no('できません');
  const lines = outs.map((o) => (o.alive ? `${o.name}は馬車にもどった。` : `${o.name}は馬車に運びこまれた。`));
  lines.push(`${joined.map((x) => x.name).join('と')}が馬車から飛び出した！`);
  b.lock = Math.max(b.lock, b.pace(500, 380, lines.length, 900));
  const upd = [...new Set([...outs, actor])].map(pub);
  b.emit({
    t: 'msg', lines, upd, joined: joined.map(pub),
    swap: { out: pairs[0].out, in: pairs[0].in, list: pairs }, fx: { type: 'wagon', actor: joined[0].id }, dur: b.lock,
  });
  afterSwap(world, s, p);
  return { ok: true, ids: joined.map((x) => x.id) };
}

// 戦っている 人が 自分の 仲間（パーティーの 仲間・家族の キャラ・自分の 代わり）なら その key
function ownKeyOf(ctx, c, a) {
  const w = ctx.actorMap[a.id];
  if (w?.type !== 'support' || w.owner !== c.id) return null;
  if (isFam(w.key)) return c.partyKeys.includes(w.key) || (c.wagonKeys || []).includes(w.key) ? w.key : null;
  return companionOf(c, w.key) ? w.key : null;
}

// 合体技の まえ（よやく・さそい）は 入れかえない
function dualBusy(out, actor) {
  return !!(out.waitDual || out.dualWith || out.dualTarget || out.invited || (out !== actor && out.inviting));
}

// 馬車から 出る 仲間の すがた（e … wagonEntries の 1人。standIn … 自分の 代わり）
function joinInit(s, c, e, standIn) {
  const tac = e.char.tactics || 'balanced';
  // 自分の 代わりに 出る 仲間と「めいれいさせろ」の 仲間は、自分が コマンドを えらぶ
  const manual = standIn || tac === 'manual';
  return {
    init: {
      char: e.char, kind: e.kind === 'monster' ? 'monster' : 'support',
      controller: manual ? s.id : null, auto: manual ? !!c.battleSettings?.auto : true,
      tactics: tac === 'manual' ? 'balanced' : tac, tacBy: c.id, manual: tac === 'manual',
    },
    map: { type: 'support', key: e.key, owner: c.id, kind: e.kind, char: e.char, manual },
  };
}

// 自分の 番を 使う
function useTurn(b, actor) {
  if (actor.inviting) {
    const inv = b.invites.get(actor.inviting);
    if (inv) b.endInvite(inv, 'やめた');
  }
  actor.ready = false;
  actor.atb = 0;
}

// モンスターマスターが いると なかまの まものが つよくなる（はじめから いる 仲間と おなじ）
function monsterBoost(world, ctx, nc) {
  if (!nc.mon) return;
  const boost = Math.max(1, ...ctx.sids.map((sid) => JOBS[world.sessions.get(sid)?.char?.job]?.passive?.monsterBoost || 1));
  if (boost > 1) {
    nc.atk = Math.round(nc.atk * boost);
    nc.dfn = Math.round(nc.dfn * boost);
  }
}

function afterSwap(world, s, p) {
  syncParty(world, p);
  world.sendParty(p);
  world.sendSelf(s);
  world.markDirty();
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
