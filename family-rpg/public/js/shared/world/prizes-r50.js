// 第50回 D3: 景品の しょり（サーバー）。カジノの 景品コーナー・メダル王・星のかけらの こうかん・景品の 道具を 使う
//
// ・NEW の しるし: キャラに 見た 品を おぼえる（c.prizeSeen = { casino: [id…], star: [id…], medal: ['55'…] }）
//   はじめて 開いた 人（まだ きろくが ない）は、この回に ふえた 品（r: 50）だけ NEW。あとは 前に 開いた ときに なかった 品が NEW
//   引っこしの 合言葉（world/transfer.js）には 入れない（なくても こまらない。NEW が 少し 多く 出る だけ）
// ・景品の 道具（data/items-prize-r50.js）: 乗り物券・よびぶえ・修行の書・経験の書（world/services.js の useItem から）
import { ITEMS } from '../data/items.js';
import { MONSTERS } from '../data/monsters.js';
import { MONSTER_FRIENDS, ROSTER_MAX, monsterLevelCap } from '../data/companions.js';
import { JOBS } from '../data/jobs.js';
import { jobLevelCap } from '../data/job-trials.js';
import { VEHICLES, cleanVehicles } from '../data/vehicles.js';
import { PRIZES, MEDAL_REWARDS, prizesFor, medalRewardOpen } from '../data/casino.js';
import { STAR_TRADES, starTradesFor } from '../data/shops.js';
import { prizeCatOf } from '../data/prizes-r50.js';
import {
  addItem, removeItem, itemCount, gainExp, gainJobBattles, expForLevel, MAX_LEVEL, newMonsterCompanion, catchUpLevel, computeStats,
} from '../stats.js';
import { ensureCompanions, ensureStorage, companionOf, addMonsterCompanion, afterRosterChange, partyOf, STORAGE_MAX } from './party.js';
import { jobLabel } from '../job-label.js';

// ───────────── NEW の しるし ─────────────
const SEEN_MAX = 400;
// 前から ある 品（はじめて 開いた 人には NEW に しない）
export const LEGACY = {
  casino: new Set(PRIZES.filter((p) => !p.r).map((p) => p.id)),
  star: new Set(STAR_TRADES.filter((t) => !t.r).map((t) => t.item)),
  medal: new Set(MEDAL_REWARDS.filter((r) => !r.r).map((r) => String(r.at))),
};
// 見た 品の きろく（まだ ない ときは null）
function seenList(c, kind) {
  const list = c?.prizeSeen && typeof c.prizeSeen === 'object' ? c.prizeSeen[kind] : null;
  return Array.isArray(list) ? new Set(list.filter((x) => typeof x === 'string')) : null;
}
// まだ 見ていない 品（ids の ならびの まま）。きろくが ない 人は 前から ある 品を 見た ことに
export function freshIds(c, kind, ids) {
  const seen = seenList(c, kind) || LEGACY[kind] || new Set();
  return ids.map(String).filter((id) => !seen.has(id));
}
// 見た ことに する（前に 見た 物も のこす。はじめての きろくは 今 ならんでいる 品だけ
//   → まだ ならんでいなかった 前からの 品も、お話が 進んで ならんだ ときに NEW に なる）
export function markSeen(c, kind, ids) {
  const seen = seenList(c, kind) || new Set();
  for (const id of ids) seen.add(String(id));
  if (!c.prizeSeen || typeof c.prizeSeen !== 'object') c.prizeSeen = {};
  c.prizeSeen[kind] = [...seen].slice(-SEEN_MAX);
}
// 開いた ときの NEW（しるしを つけてから 見た ことに する）
export function takeFresh(c, kind, ids) {
  const fresh = freshIds(c, kind, ids);
  markSeen(c, kind, ids);
  return fresh;
}

// ───────────── 景品を もらえるか ─────────────
// 乗り物券: もう その 乗り物を 持っている か、券が ふくろに ある ときは もらえない（null … もらえる）
export function prizeBlock(c, id) {
  const eff = ITEMS[id]?.effect;
  if (eff?.type === 'prizeRide') {
    if (Array.isArray(c?.vehicles) && c.vehicles.includes(eff.vehicle)) return `${VEHICLES[eff.vehicle]?.name || 'その乗り物'}は、もう持っているようです`;
    if (itemCount(c, id) > 0) return `${ITEMS[id].name}は、もう持っているようです`;
  }
  if (itemCount(c, id) >= 99) return 'それ以上は持てないようです';
  return null;
}
// 一覧に 出す「持っている」（乗り物は 持っている か 券が ある）
export function prizeHave(c, id) {
  const eff = ITEMS[id]?.effect;
  if (eff?.type === 'prizeRide') return (Array.isArray(c?.vehicles) && c.vehicles.includes(eff.vehicle)) || itemCount(c, id) > 0;
  return itemCount(c, id) > 0;
}

// ───────────── カジノの 景品コーナー（world/casino.js の casinoOpen から）─────────────
export function casinoPrizeShelf(c, tier) {
  const prizes = prizesFor(c.flags, tier);
  const fresh = takeFresh(c, 'casino', prizes.map((p) => p.id));
  return { prizes, fresh, cats: Object.fromEntries(prizes.map((p) => [p.id, prizeCatOf(ITEMS[p.id])])) };
}

// ───────────── メダル王（world/casino.js の medalInfo から）─────────────
// locked … お話が 進むと もらえる（need の フラグが まだ）
export function medalRewardRows(c) {
  const got = c.medalRewards && typeof c.medalRewards === 'object' ? c.medalRewards : {};
  return MEDAL_REWARDS.map((r) => ({ at: r.at, items: r.items, got: !!got[r.at], ...(medalRewardOpen(c.flags, r) ? {} : { locked: true }) }));
}
export function medalFresh(c) {
  return takeFresh(c, 'medal', MEDAL_REWARDS.filter((r) => medalRewardOpen(c.flags, r)).map((r) => r.at));
}

// ───────────── 星のかけらの こうかん（world/services.js の starTrade）─────────────
export function starTradeInfo(world, s) {
  const c = s.char;
  const trades = starTradesFor(c.flags);
  const fresh = takeFresh(c, 'star', trades.map((t) => t.item));
  world.markDirty();
  return {
    trades, fresh, more: trades.length < STAR_TRADES.length,
    cats: Object.fromEntries(trades.map((t) => [t.item, prizeCatOf(ITEMS[t.item])])),
  };
}
// msg.item … こうかんする 品（前の 画面は msg.index … 今 ならんでいる 一覧の 何番め）
export function starTradeAction(world, s, msg, reply) {
  const c = s.char;
  const list = starTradesFor(c.flags);
  const tr = typeof msg.item === 'string' ? list.find((t) => t.item === msg.item) : list[msg.index];
  if (!tr || !ITEMS[tr.item]) return reply(false, '');
  if (itemCount(c, 'star_shard') < tr.shards) return reply(false, '星のかけらが足りないねえ');
  const block = prizeBlock(c, tr.item);
  if (block) return reply(false, block);
  removeItem(c, 'star_shard', tr.shards);
  addItem(c, tr.item, 1);
  return reply(true, `星のかけら${tr.shards}個と${ITEMS[tr.item].name}をこうかんした！`, { got: tr.item });
}

// ───────────── 景品の 道具を 使う（world/services.js の useItem）─────────────
export const PRIZE_USE = new Set(['prizeRide', 'prizeMonster', 'jobBook', 'expBook']);

// 本を 読ませて よい 人: 自分・自分の 仲間（酒場・パーティー・馬車）・いっしょの パーティーの 家族（本人）
function bookTargetOk(world, s, t) {
  const c = s.char;
  if (!t) return false;
  if (t === c) return true;
  if ((c.companions || []).some((e) => e.char === t)) return true;
  const p = partyOf(world, s);
  return !!p?.members.some((sid) => world.sessions.get(sid)?.char === t);
}

export function usePrizeItem(world, s, id, target, reply) {
  const c = s.char;
  const it = ITEMS[id];
  const eff = it.effect;
  const used = `${c.name}は${it.name}を使った！`;
  switch (eff.type) {
    case 'prizeRide': {
      const v = VEHICLES[eff.vehicle];
      if (!v || c.species) return reply(false, '今は使えない');
      cleanVehicles(c);
      if (c.vehicles.includes(eff.vehicle)) return reply(false, `${v.name}は、もう持っている。`);
      removeItem(c, id, 1);
      c.vehicles.push(eff.vehicle);
      return reply(true, `${used}\n${v.name}を手に入れた！\n（メニューの「乗り物」で選ぶと、走る時に乗れる）`);
    }
    case 'prizeMonster': {
      const r = grantPrizeMonster(world, s, eff.species);
      if (!r.ok) return reply(false, r.reason || '今は使えない');
      removeItem(c, id, 1);
      const where = { party: 'パーティーに加わった！', wagon: '馬車に乗った！', tavern: '酒場で待っている。', storage: '仲間がいっぱいなので、魔物あずかり所で待っている。' }[r.where];
      return reply(true, `${c.name}は${it.name}をふいた！\n${MONSTERS[eff.species].name}がやってきた！\n${r.name}が仲間になった！\n${r.name}は${where}`);
    }
    case 'jobBook': {
      if (!bookTargetOk(world, s, target)) return reply(false, 'その人には使えない');
      if (target.species || !JOBS[target.job]) return reply(false, `${target.name}は職業の修行ができない`);
      const jn = jobLabel(target.job, target);
      if ((target.jobs?.[target.job]?.lv || 1) >= jobLevelCap(target, target.job)) return reply(false, `${target.name}の${jn}は、これ以上修行できない`);
      removeItem(c, id, 1);
      const ups = gainJobBattles(target, eff.n);
      const lines = [`${used}`, `${target.name}の${jn}の修行が${eff.n}回分すすんだ！`];
      if (ups.length) lines.push(`${jn}のレベルが${ups[ups.length - 1].lv}になった！`);
      if (ups.some((u) => u.learned?.length)) lines.push(`${target.name}は新しい技を覚えた！`);
      return reply(true, lines.join('\n'));
    }
    case 'expBook': {
      if (!bookTargetOk(world, s, target)) return reply(false, 'その人には使えない');
      const cap = target.species ? monsterLevelCap(target, MONSTERS, MAX_LEVEL) : MAX_LEVEL;
      if ((target.level || 1) >= cap) return reply(false, `${target.name}は、これ以上レベルが上がらない`);
      const lv = target.level || 1;
      const exp = Math.max(1, Math.ceil((expForLevel(lv + 1) - expForLevel(lv)) * eff.k));
      removeItem(c, id, 1);
      // 追いつき（3倍）は 本には かけない
      const keep = target.catchUp;
      delete target.catchUp;
      const ups = gainExp(target, exp);
      if (keep !== undefined && keep > (target.level || 1)) target.catchUp = keep;
      const lines = [used, `${target.name}は${exp}ポイントの経験値をかくとく！`];
      if (ups.length) lines.push(`${target.name}はレベル${target.level}になった！`);
      return reply(true, lines.join('\n'));
    }
    default:
      return reply(false, '今は使えない');
  }
}

// ───────────── めずらしい 魔物を 仲間に（よびぶえ）─────────────
// 仲間に 空きが あれば 酒場（パーティー・馬車に 空きが あれば そこ）。仲間が いっぱい（40）なら 魔物あずかり所。どちらも いっぱいなら だめ
// レベル1 で 来る。主人公の レベルの 3/4 までは 経験値 3倍（配合の 子と おなじ 追いつき）
export function grantPrizeMonster(world, s, species) {
  const c = ensureStorage(ensureCompanions(s.char));
  if (!MONSTERS[species] || !MONSTER_FRIENDS[species]) return { ok: false, reason: '' };
  const catchUp = catchUpLevel(c, c);
  if (c.companions.length < ROSTER_MAX) {
    const r = addMonsterCompanion(world, s, species, 1);
    if (!r.ok) return r;
    const e = companionOf(c, r.key);
    if (e && catchUp > 1) e.char.catchUp = catchUp;
    return { ok: true, key: r.key, name: r.name, where: r.joined ? r.where : 'tavern' };
  }
  if (c.storage.length >= STORAGE_MAX) {
    return { ok: false, full: true, reason: `仲間も魔物あずかり所もいっぱいです（${ROSTER_MAX}・${STORAGE_MAX}）。\n酒場でだれかと別れてから使おう` };
  }
  while ([...c.companions, ...c.storage].some((e) => e.key === `m${c.monsterSeq}`)) c.monsterSeq++;
  const key = 'm' + (c.monsterSeq++);
  const ch = newMonsterCompanion({ id: `${c.id}:${key}`, name: prizeMonsterName(c, species), species, level: 1 });
  if (catchUp > 1) ch.catchUp = catchUp;
  const st = computeStats(ch);
  ch.hp = st.maxHp;
  ch.mp = st.maxMp;
  c.storage.push({ key, kind: 'monster', species, char: ch });
  c.bestiary = c.bestiary || {};
  const b = c.bestiary[species] || (c.bestiary[species] = {});
  b.friend = (b.friend || 0) + 1;
  afterRosterChange(world, s);
  return { ok: true, key, name: ch.name, where: 'storage' };
}

// 名前（仲間・あずかり中の 魔物と かさならない もの。world/party.js の monsterName と おなじ きまり）
function prizeMonsterName(c, species) {
  const used = new Set([...c.companions, ...(c.storage || [])].map((e) => e.char.name));
  for (const n of MONSTER_FRIENDS[species]?.names || []) if (!used.has(n)) return n;
  const base = MONSTERS[species]?.name || '魔物';
  for (let i = 2; i < 99; i++) if (!used.has(`${base}${i}`.slice(0, 8))) return `${base}${i}`.slice(0, 8);
  return base;
}
