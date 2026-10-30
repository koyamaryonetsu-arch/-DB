// たたかいの はじまりと おわり（ほうしゅう・ぜんめつ）
import { Battle, normBattleSettings } from '../battle.js?v=bf896afe56a6';
import { scaleExp, difficultyOf, rewardExp, rewardGold } from '../data/difficulty.js?v=bf896afe56a6';
import { POWDER, powderLeft } from '../data/friend-powder.js?v=bf896afe56a6';
import { MONSTERS } from '../data/monsters.js?v=bf896afe56a6';
import { ITEMS } from '../data/items.js?v=bf896afe56a6';
import { abilityLabel } from '../ability-label.js?v=bf896afe56a6';
import { JOBS } from '../data/jobs.js?v=bf896afe56a6';
import { FIXED_ENCOUNTERS, ZONE_BG } from '../data/encounters.js?v=bf896afe56a6';
import { gainExp, gainJobBattles, jobTrainMult, itemCount, removeItem, addItem, ownsItem, computeStats, fullHeal } from '../stats.js?v=bf896afe56a6';
// 第38回 B: 職業レベルの 上限（超級職からは 職業の試練で 上がる）・試練の 修行（その 職業の 技を 使って 勝つ）
import { jobLevelCap, trialUseCount, addTrialUses, trialName } from '../data/job-trials.js?v=bf896afe56a6';
import { befriendShare } from './recruit-share.js?v=bf896afe56a6';
import { partyOf, creditSupportOwner, growCompanion, rollBefriend, befriendChance, befriendLevel, noteSeen, noteTried, noteDrop, selfPosOf, PARTY_MAX } from './party.js?v=bf896afe56a6';
import { rollDrops, stealPick } from '../data/loot.js?v=bf896afe56a6';
import { MAPS } from '../maps/index.js?v=bf896afe56a6';
import { scaleEnemy, scaledRewardBonus } from '../data/treasure.js?v=bf896afe56a6';
import { treasureAfterBattle } from './treasure.js?v=bf896afe56a6';
import { wipeGoldLoss, bankGold } from './bank.js?v=bf896afe56a6';
import { lureOn, lureGroup } from './field27.js?v=bf896afe56a6';
import { wagonShare, wagonBattleSwap } from './wagon.js?v=bf896afe56a6';
import { growthSummary } from './growth.js?v=bf896afe56a6';
import { topLevel, battleTeamChars, expHatMult } from './perks.js?v=bf896afe56a6';
import { battleTactics } from './tactics.js?v=bf896afe56a6';
// 第6章 Step 3・4: 昼か 夜か（星座の 魔物。battle-road.js）
import { isNightFor } from './clock.js?v=bf896afe56a6';
// 第45回: お金が ふえる 魔物の 仲間（ゴールドぷるりん。data/companions-dqm.js の passive.gold）
import { MONSTER_FRIENDS } from '../data/companions.js?v=bf896afe56a6';
// 第51回 B: 家族のけいじ板（ひらめき技・合体技を はじめて 覚えた）
import { boardHirameki, boardDual } from './family-board.js?v=bf896afe56a6';
// 第51回 F: 幻の職業の 記録（自分の キャラの 戦いの 記録を 足す・条件が 見えた／なれるように なった 知らせ）
import { addFeats, phantomAfterBattle } from './phantom.js?v=bf896afe56a6';
// 第53回 B: 第6章 Step 6 の 時のまぼろし（1日1回の ★5の 素材・はじめて 勝った 時の けいじ板）
import { tokiPhantomAfter } from './tokei-phantom.js?v=bf896afe56a6';

let battleSeq = 1;

// いっしょに たたかいを はじめる きょり（がめんに うつるくらい）
export const JOIN_RADIUS = 10;
// たたかいの けっか（ボタンで 1行ずつ すすむ）を 読んでいる あいだの むてき（ミリびょう。読みおわったら 'resultDone' で みじかく なる）
// 読んでいる 人は つぎの たたかいに まきこまない（サーバーは またない。ほかの 人は そのまま あそべる）
export const RESULT_MAX_MS = 120000;
export const AFTER_RESULT_MS = 2500;
// とちゅうから さんか できる きょり（たたかっている なかまに ちかづく）
export const LATE_JOIN_RADIUS = 2.4;

// いっしょに たたかう 人（おなじ マップの ちかくに いて、ほかの ことを していない パーティーの 人）
export function battleSessions(world, s) {
  const p = partyOf(world, s);
  const out = [s];
  for (const sid of p?.members || []) {
    if (sid === s.id) continue;
    const m = world.sessions.get(sid);
    // 大鳥で 空を とんでいる 人・たたかいの けっかを 読んでいる 人は まきこまれない（travel.js）
    if (!m || !m.inWorld || m.busy || m.away || m.flying || m.map !== s.map || readingResult(m)) continue;
    if (Math.hypot(m.x - s.x, m.y - s.y) > JOIN_RADIUS) continue;
    out.push(m);
  }
  return out;
}

// たたかっている なかまの ところへ かけつけて さんかする（ふつうの たたかいも、ボス・物語の たたかいも。
//   第34回: 会話の 時に そばに いなかった 人・会話の タイミングが ずれた 人も、あとから かけつけられる）
export function joinBattle(world, s, targetSid) {
  if (s.busy || s.away || s.flying || !s.inWorld) return { ok: false };
  const t = world.sessions.get(targetSid);
  if (!t || t === s || t.busy !== 'battle' || t.partyId !== s.partyId || t.map !== s.map) return { ok: false };
  const ctx = world.battles.get(t.battleId);
  if (!ctx || ctx.battle.over || ctx.battle.pendingEnd) return { ok: false };
  if (Math.hypot(t.x - s.x, t.y - s.y) > LATE_JOIN_RADIUS) return { ok: false };
  if (ctx.sids.includes(s.id)) return { ok: false };
  // 1人で 戦う きまった 戦い（リオンの けいこ。encounters の solo）には 入れない
  if (ctx.opts.solo) return { ok: false, reason: 'これは1人で戦うけいこだ…' };
  // プレイヤーは 5人まで いっしょに 戦える（world/party.js の PARTY_MAX）
  if (ctx.battle.allies.filter((a) => a.kind !== 'guest').length >= PARTY_MAX) return { ok: false, reason: '戦いの場所がいっぱいだ…' };
  const a = ctx.battle.joinAlly({ char: s.char, kind: 'player', controller: s.id, auto: !!s.char.battleSettings?.auto });
  ctx.actorMap[a.id] = { type: 'human', sid: s.id, char: s.char };
  noteSeen(s.char, [...new Set(ctx.battle.combatants.filter((x) => x.side === 'enemy').map((x) => x.species))]);
  ctx.sids.push(s.id);
  s.busy = 'battle';
  s.battleId = ctx.id;
  s.moving = false;
  // じぶんの なかまで「めいれいさせろ」の なかまは、かけつけた じぶんが うごかす
  for (const ally of ctx.battle.allies) {
    const who = ctx.actorMap[ally.id];
    if (who?.type === 'support' && who.owner === s.charId && who.manual && !ally.controller) {
      ally.controller = s.id;
      ctx.battle.setAuto(ally.id, !!s.char.battleSettings?.auto);
    }
  }
  world.send(s, { t: 'battleStart', snap: ctx.battle.snapshot(), mine: mineOf(ctx, s.id), boss: !!ctx.opts.boss, story: !!ctx.opts.fixed, joined: true });
  world.broadcastPositions = true;
  return { ok: true };
}

// たたかいの けっかを まだ 読んでいるか
export function readingResult(s) {
  return !!s.reading && s.invuln > 0;
}

// けっかを 読みおわった（クライアントから）: ここから すこしだけ むてき
export function resultDone(world, s) {
  if (!s.reading) return;
  s.reading = false;
  s.invuln = Math.min(s.invuln, AFTER_RESULT_MS);
}

// 敵の 強さ（設定の「敵の強さ」。data/difficulty.js）: パーティーでは リーダーの 設定（ものがたりと おなじ）。ひとりなら 自分の 設定
export function enemyRateFor(world, party, sessions) {
  const leader = (party && world.sessions.get(party.leader)) || sessions?.[0];
  return difficultyOf(leader?.char).enemy;
}

// その 人が うごかす キャラ（じぶん＋「めいれいさせろ」の なかま）。じぶんが さいしょ
export function mineOf(ctx, sid) {
  const out = ctx.battle.allies.filter((a) => a.controller === sid);
  out.sort((x, y) => (x.kind === 'player' ? 0 : 1) - (y.kind === 'player' ? 0 : 1));
  return out.map((a) => a.id);
}

function makeBattle(world, sessions, party, enemies, opts) {
  const leader = world.sessions.get(party.leader) || sessions[0];
  const settings = leader.char.battleSettings || {};
  const allies = [];
  const actorMap = {};
  const entries = []; // ならびの じゅん（先頭ほど 敵に ねらわれやすい）
  // なかま: さくせんが「めいれいさせろ」なら もちぬしが コマンドを えらぶ（もちぬしが いない ときは AI）
  // 第53回: 1人で 戦う（opts.solo。リオンの けいこ）… 仲間・ゲストは 入らない
  const sups = (opts.solo ? [] : party.supports).map((sup) => {
    const tac = sup.char.tactics || 'balanced';
    const owner = tac === 'manual' ? sessions.find((m) => m.charId === sup.owner) : null;
    return {
      map: { type: 'support', key: sup.key, owner: sup.owner, kind: sup.kind, char: sup.char, manual: tac === 'manual' },
      ally: {
        char: sup.char, kind: sup.kind === 'monster' ? 'monster' : 'support',
        controller: owner ? owner.id : null, auto: owner ? !!owner.char.battleSettings?.auto : true,
        tactics: tac === 'manual' ? 'balanced' : tac, tacBy: sup.owner, manual: tac === 'manual',
      },
    };
  });
  const humans = sessions.map((m) => ({
    map: { type: 'human', sid: m.id, char: m.char },
    ally: { char: m.char, kind: 'player', controller: m.id, auto: !!m.char.battleSettings?.auto },
  }));
  const pos = Math.max(0, Math.min(sups.length, selfPosOf(world, party)));
  entries.push(...sups.slice(0, pos), ...humans, ...sups.slice(pos));
  for (const e of entries) allies.push(e.ally);
  const guests = opts.solo ? [] : party.guests;
  for (const g of guests) allies.push({ char: g.char, kind: 'guest', auto: true, tactics: g.char.tactics });
  const b = new Battle({
    id: 'b' + (battleSeq++),
    rng: world.rng,
    allies,
    enemies,
    ...normBattleSettings(settings),
    wait: !!settings.wait,
    canFlee: opts.canFlee !== false,
    boss: !!opts.boss,
    // 呪文が ふうじられた マップ（王家のピラミッド 2階）
    noSpells: !!MAPS[sessions[0]?.map]?.noSpells,
    bg: opts.bg,
    bgm: opts.bgm,
    preemptive: opts.preemptive || null,
    // 宝の洞窟: 魔物を 地図の レベルに あわせて 強くする（ひみつのダンジョンの 深い 階は enemyPow 倍）
    // 第40回: 宝の洞窟は その レベルの ふつうの 魔物と おなじ 強さ（enemyCurve。data/tm-curve.js）
    enemyMod: opts.enemyLv ? (m) => scaleEnemy(m, opts.enemyLv, opts.enemyPow, { curve: !!opts.enemyCurve }) : null,
    // 敵の 強さ（ハード 1.2倍 など）。リーダーの 設定。宝の洞窟の 強さの 上に かける（ほうしゅうは かわらない）
    enemyRate: enemyRateFor(world, party, sessions),
    hooks: {
      // リーダー（物語の もちぬし）の フラグ（第5章 Step 9 の ノクト〈本気〉: 思い出の かけら・ピピの 手紙で ことばが かわる。battle-final.js）
      leaderFlag: (id) => !!leader?.char?.flags?.[id],
      // 第6章 Step 3・4: 昼か 夜か（星座の 魔物は 夜だけ 強い／昼だけ 強い。battle-road.js）
      night: () => isNightFor(world, leader),
      hasItem: (actor, id) => {
        const m = actor.controller && world.sessions.get(actor.controller);
        return m ? itemCount(m.char, id) > 0 : false;
      },
      consumeItem: (actor, id) => {
        const m = actor.controller && world.sessions.get(actor.controller);
        if (!m) return false;
        const ok = removeItem(m.char, id, 1);
        if (ok) world.sendSelf(m);
        return ok;
      },
      // 銭投げ: 持っている お金から はらう（たりなければ あるだけ）
      spendGold: (actor, want) => {
        const m = actor.controller && world.sessions.get(actor.controller);
        if (!m || !(m.char.gold > 0)) return 0;
        const paid = Math.min(m.char.gold, Math.max(1, Math.round(want)));
        m.char.gold -= paid;
        world.sendSelf(m);
        return paid;
      },
      // 大型買収: おいだした 敵の お金を もらう
      gainGold: (actor, species, mult = 1) => {
        const m = (actor.controller && world.sessions.get(actor.controller)) || sessions[0];
        const g = rewardGold(Math.round((MONSTERS[species]?.gold || 0) * mult));
        if (!m || g <= 0) return 0;
        m.char.gold = Math.min(9999999, m.char.gold + g);
        world.sendSelf(m);
        return g;
      },
      // 盗塁・お宝さがし: 敵の 持ち物を ぬすむ
      steal: (actor, species) => {
        const m = (actor.controller && world.sessions.get(actor.controller)) || sessions[0];
        const id = m ? stealPick(species, world.rng) : null;
        if (!id) return null;
        addItem(m.char, id, 1);
        noteDrop(m.char, species, id);
        world.sendSelf(m);
        return ITEMS[id].name;
      },
    },
  });
  // 第38回 B: 戦いを 作った すぐ あとの しかけ（職業の試練の 師しょうのまぼろし。world/job-trials.js）
  if (opts.setup) opts.setup(b);
  // だれが どの キャラか
  let i = 0;
  for (const e of entries) actorMap[b.allies[i++].id] = e.map;
  for (const g of guests) actorMap[b.allies[i++].id] = { type: 'guest', id: g.id, char: g.char };
  // モンスターマスターが いると なかまの まものが つよくなる
  const boost = Math.max(1, ...sessions.map((m) => JOBS[m.char.job]?.passive?.monsterBoost || 1));
  if (boost > 1) {
    for (const a of b.allies) if (a.mon) { a.atk = Math.round(a.atk * boost); a.dfn = Math.round(a.dfn * boost); }
  }
  // ずかん: みた まもの
  const seen = [...new Set(enemies)];
  for (const m of sessions) noteSeen(m.char, seen);
  const ctx = { id: b.id, battle: b, sids: sessions.map((m) => m.id), partyId: party.id, map: sessions[0].map, actorMap, opts };
  world.battles.set(ctx.id, ctx);
  for (const m of sessions) {
    m.busy = 'battle';
    m.battleId = ctx.id;
    world.send(m, { t: 'battleStart', snap: b.snapshot(), mine: mineOf(ctx, m.id), boss: !!opts.boss, story: !!opts.fixed, preemptive: opts.preemptive || null });
  }
  world.broadcastPositions = true;
  return ctx;
}

export function startFieldBattle(world, s, sym) {
  const party = partyOf(world, s);
  const sessions = battleSessions(world, s);
  sym.busy = true;
  const zone = sym.zone;
  // うしろから ふれたら せんせいこうげき、おいかけられて ぶつかったら ふいうち
  let preemptive = null;
  const r = world.rng.next();
  if (sym.state !== 'chase' && r < 0.12) preemptive = 'ally';
  else if (sym.state === 'chase' && r < 0.06) preemptive = 'enemy';
  // 魔物よせ（マモノヨセ・魔物よせの笛）: 強めの 組が 出やすい（world/field27.js の lureGroup）
  if (sessions.some((m) => lureOn(m, world.now()))) sym.group = lureGroup(world, sym);
  const ctx = makeBattle(world, sessions, party, sym.group, {
    bg: ZONE_BG[sym.table] || (MAPS[s.map].kind === 'dungeon' ? 'cave' : 'grass'),
    bgm: sym.table === 'rare' ? 'battle' : 'battle',
    canFlee: true,
    preemptive,
    symbolId: sym.id,
    mapId: s.map,
    enemyLv: MAPS[s.map].enemyLv,
    enemyPow: MAPS[s.map].enemyPow,
    enemyCurve: !!MAPS[s.map].enemyCurve,
  });
  return ctx;
}

// ストーリーの たたかい（まけると だいほんが とまる）
// extra … makeBattle に わたす ほかの もの（第38回 B: setup … 戦いを 作った すぐ あとの しかけ。world/job-trials.js）
// 第53回: enc.solo … はじめた 人 1人だけで 戦う（リオンの けいこ）/ enc.pick(now) … その 日の 敵の むれ（時のまぼろし）
export function startFixedBattle(world, initiator, participants, encId, extra = {}) {
  const enc = FIXED_ENCOUNTERS[encId];
  const party = partyOf(world, initiator);
  const sessions = (enc.solo ? [initiator] : participants).filter((m) => m && m.inWorld);
  const enemies = [];
  const group = typeof enc.pick === 'function' ? enc.pick(world.now()) : enc.group;
  for (const [sp, mn] of group) for (let i = 0; i < mn; i++) enemies.push(sp);
  return new Promise((resolve) => {
    for (const m of sessions) m.busy = null; // だいほんの あいだは busy='script' だが たたかいに きりかえる
    const ctx = makeBattle(world, sessions, party, enemies, { bg: enc.bg, bgm: enc.bgm, canFlee: enc.canFlee, boss: enc.boss, fixed: encId, enemyLv: enc.enemyLv, enemyPow: enc.enemyPow, enemyCurve: !!enc.enemyCurve, loseOk: !!enc.loseOk, solo: !!enc.solo, ...extra });
    ctx.resolve = resolve;
  });
}

export function battleTick(world, ctx, dt) {
  const evs = ctx.battle.tick(dt);
  if (evs.length) {
    markDuals(world, ctx, evs);
    for (const sid of ctx.sids) {
      const m = world.sessions.get(sid);
      if (m) world.send(m, { t: 'battleEv', id: ctx.id, evs });
    }
  }
  if (ctx.battle.over) finishBattle(world, ctx);
}

// たたかいが こわれて すすまない（まいフレーム エラー）: にげた ことに して みんなを フィールドへ もどす
// （物語の たたかいは だいほんが そこで おわる。もう一度 話しかければ やりなおせる）
export function abortBattle(world, ctx) {
  try {
    if (!ctx.battle.over) ctx.battle.endBattle({ outcome: 'flee' });
    finishBattle(world, ctx);
    return;
  } catch (e) {
    console.error('battle abort error', e);
  }
  // さいごの 手だて: たたかいを けして「たたかい中」の しるしを とく
  world.battles.delete(ctx.id);
  for (const sid of ctx.sids) {
    const m = world.sessions.get(sid);
    if (!m || m.battleId !== ctx.id) continue;
    m.busy = ctx.resolve ? 'script' : null;
    m.battleId = null;
    m.reading = false;
    m.invuln = 3000;
    world.send(m, { t: 'battleEnd', id: ctx.id, outcome: 'flee', lines: [], levelUp: false, story: !!ctx.resolve });
    world.sendSelf(m);
  }
  if (ctx.resolve) ctx.resolve('flee');
}

// 合体技は 一度 使うと 効果が わかる（出した 人 みんなの もちぬしの キャラに char.dualSeen）
function markDuals(world, ctx, evs) {
  for (const ev of evs) {
    const d = ev.dual;
    if (!d?.id) continue;
    const fresh = [];
    for (const id of d.m || [d.a, d.b]) {
      const who = ctx.actorMap[id];
      const ch = who?.type === 'human' ? who.char : who?.type === 'support' ? world.data.characters[who.owner] : null;
      if (ch && !ch.dualSeen?.[d.id]) {
        ch.dualSeen = { ...(ch.dualSeen || {}), [d.id]: 1 };
        if (!fresh.includes(ch)) fresh.push(ch);
      }
    }
    // 第51回 B: はじめて 使った 家族を けいじ板に（1回の 合体技で 1こ）
    if (fresh.length) boardDual(world, fresh, d.id);
  }
}

export function battleCommand(world, s, msg) {
  const ctx = world.battles.get(s.battleId);
  if (!ctx) return;
  const b = ctx.battle;
  if (msg.auto !== undefined) {
    const a = b.get(msg.actor);
    if (a && a.controller === s.id) {
      b.setAuto(msg.actor, !!msg.auto);
      if (a.kind === 'player') s.char.battleSettings = { ...(s.char.battleSettings || {}), auto: !!msg.auto };
    }
    return;
  }
  // 馬車の 仲間と いれかえ（world/wagon.js）
  if (msg.cmd?.type === 'swap') return wagonBattleSwap(world, s, ctx, msg);
  // なかまの さくせんを かえる（world/tactics.js）
  if (msg.tactics !== undefined) return battleTactics(world, s, ctx, msg);
  const r = b.command(msg.actor, msg.cmd, s.id);
  if (!r.ok) world.send(s, { t: 'battleRej', reason: r.reason || 'できません' });
}

// サーバーから プレイヤーが ぬけたとき
export function battleLeave(world, s) {
  const ctx = world.battles.get(s.battleId);
  if (!ctx) return;
  for (const a of ctx.battle.allies) if (a.controller === s.id) ctx.battle.setAuto(a.id, true);
}

function finishBattle(world, ctx) {
  world.battles.delete(ctx.id);
  const b = ctx.battle;
  const res = b.result;
  const party = world.parties.get(ctx.partyId);
  const sessions = ctx.sids.map((sid) => world.sessions.get(sid)).filter(Boolean);
  // HP・MPを もどす
  for (const a of b.allies) {
    const who = ctx.actorMap[a.id];
    const ch = who?.char;
    if (!ch) continue;
    ch.hp = a.alive ? a.hp : 0;
    ch.mp = a.mp;
    ch.status = a.status.poison && a.alive ? { poison: true } : {};
  }
  // 技を 使った 回数と、ひらめいた 技を のこす（自分・自分の 仲間。家族の キャラと ゲストは のこさない）
  const hiraLines = [];
  // 第38回 B: 職業の試練の 修行（自分の キャラが 今の 職業の 技を この 戦いで 使った 回数。勝った ときに たす）
  const trialUse = new Map();
  for (const a of b.allies) {
    const who = ctx.actorMap[a.id];
    const ch = who?.char;
    if (!ch || !a.use || who.type === 'guest' || who.kind === 'family') continue;
    if (who.type === 'human') trialUse.set(ch, trialUseCount(ch.job, ch.skillUse, a.use));
    if (who.type === 'human') addFeats(ch, a.feat);
    ch.skillUse = { ...a.use };
    if (a.hiraNew?.length) {
      ch.hirameki = [...new Set([...(Array.isArray(ch.hirameki) ? ch.hirameki : []), ...a.hiraNew])];
      for (const id of a.hiraNew) hiraLines.push(`★ ${ch.name}は「${abilityLabel(id, ch)}」をひらめいた！（これからも使える）`);
      boardHirameki(world, ch, a.hiraNew);
    }
  }

  const outcome = res.outcome;
  const perSession = {};
  let befriend = null;
  if (outcome === 'win') {
    let exp = 0, gold = 0;
    for (const sp of res.killed) {
      const m = MONSTERS[sp];
      exp += m.exp;
      gold += m.gold;
    }
    const bonus = scaledRewardBonus(b); // 強くした 魔物の ぶん
    exp += bonus.exp;
    gold += bonus.gold;
    // 海賊・会社員など: お金が ふえる 職業が いると ゴールドが ふえる
    //   第45回: ゴールドぷるりん（魔物の 仲間）も（いちばん 大きい 倍率だけ）
    const goldMult = Math.max(1, ...Object.values(ctx.actorMap).map((w) => JOBS[w?.char?.job]?.passive?.gold || MONSTER_FRIENDS[w?.char?.species]?.passive?.gold || 1));
    // きほんの 倍率（経験値 0.6・お金 0.7。data/difficulty.js。設定の「もらえる経験値」は この あとの scaleExp）
    exp = rewardExp(exp);
    gold = rewardGold(Math.round(gold * goldMult));
    // 職業の しゅぎょう: かった たたかい 1かい（ボスは 3かいぶん）。
    // ワンパンチ（なかまの 1回めの こうどうで おわった たたかい）は 半分。なかま・馬車の なかまも おなじ
    const oneBlow = (b.allyActs || 0) <= 1;
    const trainN = (b.boss ? 3 : 1) * jobTrainMult(oneBlow);
    const leaderName = sessions[0]?.char.name || '';
    // しあわせのぼうし: その 戦いの パーティー（馬車も ふくむ）で いちばん レベルが 高い 人には 効かない（world/perks.js）
    // （レベルが 上がる 前に きめる）
    const top = topLevel(battleTeamChars(world, ctx));
    const hat = (ch) => expHatMult(ch, top);
    // レベルアップの まとめ（world/growth.js）: 人ごとの 行・★の 知らせ
    const own = {};
    for (const m of sessions) {
      const c = m.char;
      // ゲームの むずかしさ（設定）で 経験値が へる（difficulty.js）
      const hm = hat(c);
      const myExp = scaleExp(c, exp) * hm;
      const lines = [];
      lines.push(res.killed.length ? '魔物たちをやっつけた！' : '戦いに勝った！');
      if (myExp > 0) lines.push(`${c.name}は${myExp}ポイントの経験値をかくとく！${hm > 1 ? '（しあわせのぼうしで2倍）' : ''}`);
      if (gold > 0) lines.push(`${gold}ゴールドを手に入れた！`);
      c.gold = Math.min(9999999, c.gold + gold);
      for (const sp of res.killed) c.kills[sp] = (c.kills[sp] || 0) + 1;
      // ドロップ（1体から 1つまで。ボスは かならず。loot.js）
      const drops = [];
      for (const sp of res.killed) {
        for (const id of rollDrops(sp, world.rng, { map: ctx.map })) {
          if (ITEMS[id].unique && ownsItem(c, id)) continue; // ボスの 品は 1人 1つ
          addItem(c, id, 1);
          noteDrop(c, sp, id);
          drops.push(id);
          // 1つ 1行（第31回: 「手に入れた！」の 行は はぶく。けっかの まどで 緑の 字）
          lines.push(`${MONSTERS[sp].name}は${ITEMS[id].name}を持っていた！`);
        }
      }
      const ups = gainExp(c, myExp);
      let jups = [];
      if (JOBS[c.job] && (c.jobs[c.job]?.lv || 1) < jobLevelCap(c, c.job)) {
        jups = gainJobBattles(c, trainN);
        if (oneBlow) lines.push('（一撃で終わったので、職業の修行は半分）');
      }
      // 職業の試練の 修行（data/job-trials.js）
      const tu = addTrialUses(c, c.job, trialUse.get(c) || 0);
      if (tu) {
        lines.push(`（${trialName(c.job, tu.trial.n, c)}：修行 ${tu.to}/${tu.need}回）`);
        if (tu.done) lines.push(`★ ${c.name}は${trialName(c.job, tu.trial.n, c)}の修行をやりとげた！\n（ルミナの町の神殿の、試練の番人に話そう）`);
      }
      own[m.id] = growthSummary(c.name, ups, jups, c, { self: true });
      perSession[m.id] = { lines, levelUp: ups.length > 0, jobUp: jups.length > 0, drops };
    }
    // なかま: たたかいに でた なかまだけ そだつ。家族の キャラには おれいが とどく
    const compRows = [], compNotes = [], expLines = [];
    const grow = (ch, x, trains) => {
      const { ups, jups } = growCompanion(ch, x * hat(ch), trains);
      const g = growthSummary(ch.name, ups, jups, ch);
      compRows.push(...g.lines);
      compNotes.push(...g.notes);
    };
    for (const a of b.allies) {
      const who = ctx.actorMap[a.id];
      if (who?.type !== 'support' || !who.char) continue;
      if (who.kind === 'family') {
        if (who.char.ownerId) creditSupportOwner(world, who.char.ownerId, scaleExp(world.data.characters[who.char.ownerId], exp) * hat(who.char), gold, leaderName);
        continue;
      }
      const trains = !who.char.species ? trainN : 0;
      // 仲間は もちぬしの むずかしさ
      grow(who.char, scaleExp(world.data.characters[who.owner], exp), trains);
    }
    // 馬車の 仲間（フィールドは 同じ・洞窟などは 半分。world/wagon.js）
    wagonShare(world, ctx, { exp, trainN, grow, mult: hat, say: (l) => expLines.push(l) });
    // 1画面に まとめる: 経験値・お金・ドロップ → レベルアップ（自分 → いっしょに 戦った 家族 → 仲間・馬車）→ ★の 知らせ
    for (const m of sessions) {
      const L = perSession[m.id].lines;
      L.push(...expLines);
      const rows = [...own[m.id].lines];
      for (const o of sessions) if (o !== m) rows.push(...own[o.id].lines);
      rows.push(...compRows);
      L.push(...rows, ...own[m.id].notes, ...compNotes);
      perSession[m.id].levelUp = rows.length > 0;
    }
    // まものが なかまに なりたがる（ふつうの たたかい だけ。ひみつのダンジョンの 中では ならない: map.noBefriend）
    if (!ctx.resolve && !b.boss && res.killed.length && !MAPS[ctx.map]?.noBefriend) {
      const target = sessions.find((m) => m.id === party?.leader) || sessions[0];
      // まもの使い・モンスターマスターが いると なかまに なりやすい
      let mult = Math.max(1, ...b.allies.map((a) => JOBS[a.job]?.passive?.befriend || 1));
      // 仲間の粉（data/friend-powder.js）: いっしょに 戦った だれかが 使っていれば 2倍。使った 人 みんな のこりが 1回 へる
      // （仲間に なれる 魔物が いた 戦い だけ 数える）
      const can = !!target?.char?.flags?.monster_bond && res.killed.some((x) => befriendChance(target.char, x) > 0);
      const powdered = can ? sessions.filter((m) => powderLeft(m.char) > 0) : [];
      if (powdered.length) mult *= POWDER.mult;
      const info = {};
      const sp = target && rollBefriend(world, target.char, res.killed, mult, info);
      if (sp) befriend = { s: target, species: sp, level: befriendLevel(target.char, sp) };
      for (const m of powdered) {
        m.char.befriendBoost = powderLeft(m.char) - 1;
        if (!m.char.befriendBoost) delete m.char.befriendBoost;
        perSession[m.id]?.lines.push(m.char.befriendBoost ? `（仲間の粉の力：のこり${m.char.befriendBoost}回）` : '（仲間の粉の力が消えた）');
      }
      // 仲間が いっぱいで 入れなかった（だまって 消えると「仲間に ならない」と 思うので 知らせる）
      if (info.full && perSession[target.id]) perSession[target.id].lines.push(`${MONSTERS[info.full].name}が仲間になりたそうにしていたが、仲間がいっぱいだ…`, '（酒場でだれかと別れると、また仲間になる）');
    }
    // 家族の パーティー: いっしょに 戦った 家族の 酒場にも（「はい」の とき。world/recruit-share.js）
    if (befriend) befriend.share = befriendShare(sessions, befriend.s);
  } else if (outcome === 'lose') {
    // ほんとうの 全滅: それぞれ 自分の 持っている お金が 半分に（預かり所の お金は へらない）
    // 負けても 物語が すすむ 戦い（encounters の loseOk）では へらない
    for (const m of sessions) {
      if (ctx.opts.loseOk) {
        perSession[m.id] = { lines: [`${m.char.name}たちは力つきた…`] };
        continue;
      }
      // ひみつのダンジョンの 中では お金は へらない（入口の 広間で 目を覚ます。world/secret.js）
      if (MAPS[ctx.map]?.sd) {
        perSession[m.id] = { lines: [`${m.char.name}たちは全滅してしまった…`, 'ひみつのダンジョンでは、お金はへらない。'] };
        continue;
      }
      const lines = [`${m.char.name}たちは全滅してしまった…`];
      const g = wipeGoldLoss(m.char);
      let note = '';
      if (g.lost > 0) {
        note = `所持金が半分になってしまった…${bankGold(m.char) > 0 ? '\n（預かり所のお金は無事だ）' : ''}`;
        lines.push(`所持金が半分になってしまった…（${g.before}G→${g.after}G）`);
      }
      perSession[m.id] = { lines, wipeNote: note };
    }
  } else if (outcome === 'flee') {
    for (const m of sessions) perSession[m.id] = { lines: [] };
  }

  if (hiraLines.length) for (const m of sessions) (perSession[m.id] = perSession[m.id] || { lines: [] }).lines.push(...hiraLines);
  // 宝の地図を 拾う（第1章クリアの あと）
  treasureAfterBattle(world, ctx, sessions, perSession);
  // 第51回 F: 幻の職業の 条件が 見えた・なれるように なった（1回だけ。掲示板にも。world/phantom.js）
  for (const m of sessions) {
    const pn = phantomAfterBattle(world, m.char);
    if (pn.length) (perSession[m.id] = perSession[m.id] || { lines: [] }).lines.push(...pn);
  }
  // 第53回 B: 時のまぼろし（止まった時の間）に 勝った: 1日1回の 素材・はじめての 勝ちは けいじ板へ（world/tokei-phantom.js）
  tokiPhantomAfter(world, ctx, sessions, perSession, outcome);

  // シンボル
  if (ctx.opts.symbolId) {
    const ms = world.mapStates.get(ctx.opts.mapId);
    const sym = ms?.symbols.get(ctx.opts.symbolId);
    if (sym) {
      if (outcome === 'win') ms.symbols.delete(sym.id);
      else {
        sym.busy = false;
        sym.stun = 3000;
      }
    }
  }
  for (const m of sessions) {
    m.busy = ctx.resolve ? 'script' : null;
    m.battleId = null;
    // 第44回: レベルが 上がって 進化を まっている 仲間は、けっかを 読みおわった あとで たずねる（world.js の tick・world/evolve.js）
    m.evoCheck = true;
    const r = perSession[m.id] || { lines: [] };
    // けっかの まどを 読んでいる あいだは むてき（読みおわると AFTER_RESULT_MS だけ のこる）
    m.reading = r.lines.length > 0;
    m.invuln = m.reading ? RESULT_MAX_MS : 3000;
    world.send(m, { t: 'battleEnd', id: ctx.id, outcome, lines: r.lines, levelUp: !!r.levelUp, story: !!ctx.resolve });
  }
  if (outcome === 'lose') {
    // 負けても よい 戦いは その場で 立ち上がって 物語の つづきへ
    if (ctx.opts.loseOk) for (const m of sessions) fullHeal(m.char);
    else for (const m of sessions) world.respawn(m, perSession[m.id]?.wipeNote);
    for (const a of b.allies) {
      const who = ctx.actorMap[a.id];
      if (who && who.type !== 'human' && who.char) fullHeal(who.char);
    }
  }
  // ずかん: ためした 属性を おぼえる（いっしょに たたかった 人 みんな）
  for (const m of sessions) noteTried(m.char, ctx.battle.tried);
  for (const m of sessions) world.sendSelf(m);
  if (party) world.sendParty(party);
  world.markDirty();
  if (ctx.resolve) ctx.resolve(outcome);
  if (befriend && world.sessions.has(befriend.s.id) && !befriend.s.away) world.offerBefriend(befriend.s, befriend.species, befriend.level, befriend.share);
}

