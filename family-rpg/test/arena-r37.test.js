// 第37回 A: サファラ闘技場（第4章クリアで 開く・ランク戦の 休みなしの 3連戦・王者・ごほうび・負けても お金は へらない・
// かけ試合・王者のかべ・家族の パーティー）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { starsOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { gainExp, expForLevel, itemCount, computeStats } from '../public/js/shared/stats.js';
import {
  ARENA_RANKS, ARENA_POS, ARENA_MAP, rankOpen, rankCleared, visibleRanks, noteClear, wallRows, mergeArena, bestRank,
  winChances, oddsOf, payout, duelRate, BET_HOUSE, ODDS_MIN, ODDS_MAX, BET_POOL,
} from '../public/js/shared/data/arena.js';
import { betDuel, betTournament, lineupChances, makeLineup, champOf, wallData } from '../public/js/shared/world/arena.js';
import { Battle } from '../public/js/shared/battle.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const uiOf = (bot, kind, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui' && st[1] === kind).map((st) => st[2]);
const allSays = (steps) => JSON.stringify(steps);
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ', flags }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });

// 選ぶ じゅんばん（だいほんの choice ごとに 1つ ずつ。なくなったら 0）
function choices(bot, list) {
  const q = [...list];
  Object.defineProperty(bot, 'choice', { configurable: true, get: () => (q.length ? q.shift() : 0), set: () => {} });
  return q;
}

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  const st = computeStats(c);
  c.hp = st.maxHp;
  c.mp = st.maxMp;
}

async function setup(seed = 1, { clear = true, name = 'ソラ', world = null } = {}) {
  const w = world || new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(w, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = w.data.characters[bot.char.id];
  for (const f of UPTO(clear ? 'c4_clear' : 'c4_letter')) c.flags[f] = true;
  boost(c, 45);
  c.gold = 1000;
  bot.s.repelUntil = 1e15;
  w.placeSession(bot.s, ARENA_MAP, ARENA_POS.desk.x + 0.5, ARENA_POS.desk.y + 0.5, 'right', true);
  w.sendSelf(bot.s);
  await bot.settle();
  return { world: w, bot, c };
}

// 戦いを すすめる: plan(ctx, i) が 'lose' なら 負け・ほかは 勝ち（味方の HP・MPを へらしてから 勝つ）。fought … 戦いの 記録
async function play(bot, { plan = () => 'win', others = [], max = 30000 } = {}) {
  const world = bot.world;
  const fought = [];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      const b = c2.battle;
      const me = b.allies.find((a) => a.controller === bot.s.id);
      fought.push({ id: c2.opts.fixed, hp: me?.hp, mp: me?.mp, maxHp: me?.maxHp, sids: c2.sids.slice() });
      const how = plan(c2, fought.length - 1);
      if (how === 'lose') {
        for (const a of b.allies) if (a.alive) b.kill(a);
      } else {
        // 味方が けがを した まま 勝つ（次の 戦いで 回復していないか たしかめる）
        for (const a of b.allies) {
          a.hp = Math.max(1, Math.floor(a.hp * 0.6));
          a.mp = Math.floor(a.mp * 0.5);
        }
        for (let k = 0; k < 20; k++) {
          const alive = b.enemies.filter((e) => e.alive);
          if (!alive.length) break;
          for (const e of alive) b.kill(e);
        }
      }
      b.checkEnd();
    }
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    const idle = (x) => !x.s.busy && !x.queue.length && !x.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      for (const o of others) o.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return fought;
    }
  }
  throw new Error('終わらない');
}
const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };

// ───────────── データ ─────────────
test('闘技場のデータ: 8ランク×3連戦・王者・技・品がそろっている（★の きまり・数えない 魔物）', () => {
  assert.equal(ARENA_RANKS.length, 8);
  for (const R of ARENA_RANKS) {
    assert.equal(R.battles.length, 3, `ランク${R.rank}`);
    for (const enc of R.battles) {
      const e = FIXED_ENCOUNTERS[enc];
      assert.ok(e, enc);
      assert.equal(e.canFlee, false, `${enc} にげられない`);
      assert.equal(e.loseOk, true, `${enc} 負けても お金は へらない`);
      assert.equal(e.bg, 'arena');
      for (const [sp] of e.group) {
        const m = MONSTERS[sp];
        assert.ok(m, `${enc}: ${sp}`);
        for (const a of m.actions) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      }
    }
    // 3戦目は 王者（名前のある 相手）
    assert.ok(MONSTERS[champOf(R.battles[2])]?.boss, `ランク${R.rank}の 王者`);
    for (const id of R.first.items) {
      const it = ITEMS[id];
      assert.ok(it, id);
      assert.equal(it.price, 0, `${id} 店では 売らない`);
      assert.equal(rareWhereText(id), '闘技場のごほうびでしか手に入らない');
      if (R.rank <= 4) assert.equal(starsOf(id), 3, `${id}: ランク7の ★3`);
      if (R.rank >= 6) assert.equal(starsOf(id), 5, `${id}: ★5`);
    }
    assert.ok(R.first.medals >= 1);
  }
  assert.equal(ARENA_RANKS[0].champ, '力じまんの戦士');
  assert.equal(ITEMS[ARENA_RANKS[4].first.items[0]].name, 'チャンピオンのベルト');
  assert.equal(ITEMS.ar_champ_belt.type, 'acc');
  // 伝説の部は あとの ランクほど 強い品（どれも ランク10 の ★5。ボーナスの 合計が ふえる）
  const sum = (id) => Object.values(ITEMS[id].bonus || {}).reduce((a, x) => a + x, 0) + (ITEMS[id].def || 0);
  assert.ok(sum('ar_shark_charm') < sum('ar_prism_crown') && sum('ar_prism_crown') < sum('ar_legend_belt'));
  assert.ok(ITEMS.ar_legend_mantle.def > ITEMS.ar_genie_cape.def);
  // 王者は 図鑑・魔物の 数に 入らない（数えない 形）
  assert.ok(!Object.keys(MONSTERS).includes('ar_king'));
  assert.ok(MONSTERS.ar_king.noBefriend);
  // おすすめ レベル
  assert.deepEqual(ARENA_RANKS.map((R) => R.lv), [36, 39, 42, 45, 48, 50, 53, 56]);
  assert.deepEqual(ARENA_RANKS.slice(5).map((R) => R.needFlag), ['c5_gaia', 'c5_nshadow', 'c5_nocto1']);
});

test('闘技場のことば: 新しい ファイルも 使えない漢字なし（kanji-check の gameFiles に 入っている）', () => {
  const files = gameFiles().filter((f) => /arena/.test(f));
  assert.ok(files.length >= 9, files.join('\n'));
  for (const f of files) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
});

// ───────────── 開く 時 ─────────────
test('闘技場は 第4章クリアの あとに 開く（受付・門・かんばん・戦士の ことば）。前は「お休み」', () => {
  const m = MAPS.south;
  const before = (f) => UPTO('c4_letter').includes(f);
  const after = (f) => UPTO('c4_clear').includes(f);
  const npcs = m.npcs;
  const old = npcs.find((n) => n.id === 'c4_s_arena');
  const desk = npcs.find((n) => n.id === 'arena_desk');
  assert.ok(old && desk);
  assert.deepEqual(old.show, { not: ['c4_clear'] });
  assert.deepEqual(desk.show, { all: ['c4_clear'] });
  assert.ok(STORY_SCRIPTS.has('arena_desk'), '受付は パーティー みんなで');
  // 門（砂の 闘技場への カギの とびら）
  const g = ARENA_POS;
  const gate = { x: 15 + 44, y: 84 + 33 };
  assert.ok(isBlocked(m, gate.x, gate.y, before), 'クリア前は とざされている');
  assert.ok(!isBlocked(m, gate.x, gate.y, after), 'クリアの あとは 開く');
  assert.ok(!isBlocked(m, g.ring.x, g.ring.y, after));
  // ことば: クリア前は「お休み」、あとは 大会
  const pre = ctx(Object.fromEntries(UPTO('c4_letter').map((f) => [f, true])));
  const post = ctx(Object.fromEntries(UPTO('c4_clear').map((f) => [f, true])));
  assert.ok(allSays(SCRIPTS.c4_s_arena(pre)).includes('水がもどるまで、大会はお休みだ'));
  assert.ok(allSays(SCRIPTS.c4_s_fighter(pre)).includes('早く大会が開かれないかなあ'));
  assert.ok(allSays(SCRIPTS.c4_s_fighter(post)).includes('ついに大会がはじまったぞ'));
  assert.ok(!allSays(SCRIPTS.c4_s_fighter(post)).includes('お休み'));
  assert.ok(allSays(SCRIPTS.arena_sign(post)).includes('大会、はじまりました'));
  // かんばんの マスは クリアの あとは 新しい ことば（しかけの マスが 先）
  const act = m.actionAt.get(ARENA_POS.sign.y * m.w + ARENA_POS.sign.x);
  assert.equal(act?.script, 'arena_sign');
  assert.deepEqual(act.show, { all: ['c4_clear'] });
});

test('ランクの 開きかた: 1つ前を 勝ちぬくと 次へ・伝説の部は 第5章の 進みで', () => {
  const c = { flags: {} };
  const flags = new Set(UPTO('c4_clear'));
  const flag = (f) => flags.has(f);
  assert.equal(rankOpen(1, (f) => UPTO('c4_letter').includes(f), c).why, 'closed');
  assert.ok(rankOpen(1, flag, c).ok);
  assert.equal(rankOpen(2, flag, c).why, 'prev');
  for (let n = 1; n <= 5; n++) noteClear(c, n, 1000 + n);
  assert.ok(rankOpen(5, flag, c).ok);
  assert.equal(rankOpen(6, flag, c).why, 'story', 'ガイアイーターの 前は 伝説の部は 開かない');
  assert.deepEqual(visibleRanks(flag), [1, 2, 3, 4, 5, 6], 'ランク7・8は まだ 見せない');
  flags.add('c5_gaia');
  assert.ok(rankOpen(6, flag, c).ok);
  assert.equal(rankOpen(7, flag, c).why, 'story');
  flags.add('c5_nshadow');
  assert.equal(rankOpen(7, flag, c).why, 'prev');
  noteClear(c, 6, 2000);
  assert.ok(rankOpen(7, flag, c).ok);
  flags.add('c5_nocto1');
  noteClear(c, 7, 3000);
  assert.ok(rankOpen(8, flag, c).ok);
  assert.deepEqual(visibleRanks(flag), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(bestRank(c), 7);
});

// ───────────── ランク戦 ─────────────
test('ランク戦: 休みなしの 3連戦（回復しない・にげられない）→ 王者 → はじめての ごほうびは 1回だけ・2回目は ゴールドと メダル1まい', async () => {
  const { world, bot, c } = await setup(3);
  const medals0 = medalsFound(c);
  choices(bot, [0, 0, 0]); // ランク戦に出る → ランク1 → ちょうせんする
  const fought = await talk(bot, 'arena_desk');
  assert.deepEqual(fought.map((f) => f.id), ['ar1_1', 'ar1_2', 'ar1_3']);
  // 2戦目・3戦目は 前の 戦いの おわりの HP・MP の まま（回復しない）
  for (let i = 1; i < 3; i++) {
    assert.ok(fought[i].hp < fought[i].maxHp, `${i + 1}戦目は けがの まま`);
    assert.equal(fought[i].hp, Math.max(1, Math.floor(fought[i - 1].hp * 0.6)), `${i + 1}戦目の HP`);
  }
  const b1 = [...bot.msgs].filter((m) => m.t === 'battleStart');
  assert.ok(b1.every((m) => m.snap.canFlee === false), 'にげられない');
  assert.ok(rankCleared(c, 1));
  assert.equal(itemCount(c, 'ar_power_bangle'), 1);
  assert.equal(medalsFound(c), medals0 + 1);
  assert.ok(said(bot, '力じまんのうでわを手に入れた'));
  // 受付の 前に もどる
  assert.equal(bot.s.map, ARENA_MAP);
  assert.ok(Math.hypot(bot.s.x - (ARENA_POS.desk.x + 0.5), bot.s.y - (ARENA_POS.desk.y + 0.5)) < 1.6);
  // 2回目
  const gold = c.gold;
  const from = bot.msgs.length;
  choices(bot, [0, 0, 0]);
  await talk(bot, 'arena_desk');
  assert.equal(itemCount(c, 'ar_power_bangle'), 1, 'はじめての 品は 2回 もらえない');
  assert.equal(medalsFound(c), medals0 + 2, '2回目は メダル1まい');
  assert.ok(c.gold >= gold + ARENA_RANKS[0].repeatGold, '2回目は ゴールド');
  assert.ok(said(bot, '小さなメダルを1枚手に入れた', from));
  assert.equal(c.arena.r[1].n, 2);
  // ランク2が 開いた（ランク2を えらぶと 戦いが 始まる）
  choices(bot, [0, 1, 1]); // ランク2 → やめる
  const f3 = await talk(bot, 'arena_desk');
  assert.equal(f3.length, 0);
});

test('ランク戦に 負けても お金は へらない。受付の 前で HP・MPが もどる。まだ 出られない ランクは 理由を 話す', async () => {
  const { world, bot, c } = await setup(4);
  c.gold = 777;
  const from = bot.msgs.length;
  choices(bot, [0, 0, 0]);
  const fought = await talk(bot, 'arena_desk', { plan: (ctx2, i) => (i === 1 ? 'lose' : 'win') });
  assert.deepEqual(fought.map((f) => f.id), ['ar1_1', 'ar1_2'], '2戦目で 負けたら そこで おわり');
  assert.equal(c.gold - 777 >= 0, true, 'お金は へらない（1戦目の ゴールドは もらえる）');
  const goldAfter = c.gold;
  const st = computeStats(c);
  assert.equal(c.hp, st.maxHp, 'HPが もどる');
  assert.equal(c.mp, st.maxMp, 'MPが もどる');
  assert.ok(!rankCleared(c, 1));
  assert.ok(said(bot, 'お金はへっていない', from));
  assert.ok(Math.hypot(bot.s.x - (ARENA_POS.desk.x + 0.5), bot.s.y - (ARENA_POS.desk.y + 0.5)) < 1.6, '受付の 前');
  assert.ok(!bot.s.busy);
  // まだ 出られない ランク（ランク2）
  const from2 = bot.msgs.length;
  choices(bot, [0, 1]);
  const f2 = await talk(bot, 'arena_desk');
  assert.equal(f2.length, 0);
  assert.ok(said(bot, 'まずはランク1を勝ちぬくんだ', from2) || said(bot, 'まずランク1を勝ちぬくんだ', from2));
  assert.equal(c.gold, goldAfter);
});

test('闘技場は 第4章クリアの 前は 戦えない（受付は「お休み」）', async () => {
  const { bot } = await setup(5, { clear: false });
  const from = bot.msgs.length;
  const fought = await talk(bot, 'c4_s_arena');
  assert.equal(fought.length, 0);
  assert.ok(said(bot, '大会はお休みだ', from));
  // 新しい 受付は まだ いない（話しかけても 何も おきない）
  const f2 = await talk(bot, 'arena_desk');
  assert.equal(f2.length, 0);
});

test('家族の パーティー: そばに いる 家族も いっしょに 3連戦を 戦い、それぞれ ごほうびと 王者のかべに のる', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(31), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('x');
  await yui.login('x');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const P = world.data.characters[papa.char.id], Y = world.data.characters[yui.char.id];
  for (const c of [P, Y]) {
    for (const f of UPTO('c4_clear')) c.flags[f] = true;
    boost(c, 45);
  }
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  papa.s.repelUntil = yui.s.repelUntil = 1e15;
  world.placeSession(papa.s, ARENA_MAP, ARENA_POS.desk.x + 0.5, ARENA_POS.desk.y + 0.5, 'right', true);
  world.placeSession(yui.s, ARENA_MAP, ARENA_POS.desk.x - 0.5, ARENA_POS.desk.y + 0.5, 'right', true);
  await papa.settle();
  await yui.settle();
  choices(papa, [0, 0, 0]);
  papa.send({ t: 'interact', kind: 'npc', id: 'arena_desk' });
  const fought = await play(papa, { others: [yui] });
  assert.deepEqual(fought.map((f) => f.id), ['ar1_1', 'ar1_2', 'ar1_3']);
  for (const f of fought) assert.ok(f.sids.includes(yui.s.id), `${f.id}: ユイも いっしょ`);
  assert.ok(rankCleared(P, 1) && rankCleared(Y, 1));
  assert.equal(itemCount(P, 'ar_power_bangle'), 1);
  assert.equal(itemCount(Y, 'ar_power_bangle'), 1);
  // 王者のかべ: 家族サーバーでは 家族みんな
  const data = wallData(world, papa.s);
  assert.deepEqual(data.rows.map((r) => r.name).sort(), ['パパ', 'ユイ']);
  assert.deepEqual(data.rows.find((r) => r.name === 'パパ').with, ['ユイ']);
  assert.equal(data.offline, false);
  // かべを しらべると 画面に 出る
  const from = papa.msgs.length;
  world.placeSession(papa.s, ARENA_MAP, ARENA_POS.wall[0].x + 0.5, ARENA_POS.wall[0].y + 1.5, 'up', true);
  await papa.settle();
  await examine(papa, ARENA_POS.wall[0].x, ARENA_POS.wall[0].y, { others: [yui] });
  const ui = uiOf(papa, 'arenaWall', from);
  assert.equal(ui.length, 1);
  assert.equal(ui[0].rows.length, 2);
});

test('王者のかべ: 上の ランクの 人が 上・ひとりの サイトでは 自分の キャラ・記録は まとめても へらない', () => {
  const chars = {
    a: { id: 'a', name: 'ママ', flags: {} },
    b: { id: 'b', name: 'ユイ', flags: {} },
    c: { id: 'c', name: 'ソラ', flags: {} },
    d: { id: 'd', name: 'スラ', species: 'pururin' },
  };
  noteClear(chars.a, 1, 100);
  noteClear(chars.b, 1, 50);
  noteClear(chars.b, 2, 60, ['ママ']);
  const rows = wallRows(chars);
  assert.deepEqual(rows.map((r) => r.name), ['ユイ', 'ママ']);
  assert.deepEqual(rows[0].ranks.slice(0, 3), [1, 1, 0]);
  assert.deepEqual(rows[0].with, ['ママ']);
  // まとめる（べつべつの 場所で 勝ちぬいた）
  const base = { r: { 1: { n: 1, at: 100 } }, rep: 0 };
  const ours = { r: { 1: { n: 2, at: 100 } }, rep: 1 };
  const theirs = { r: { 1: { n: 3, at: 100 }, 2: { n: 1, at: 300 } }, rep: 2, bets: 3 };
  const m = mergeArena(base, ours, theirs);
  assert.equal(m.r[1].n, 4);
  assert.equal(m.r[2].n, 1);
  assert.equal(m.rep, 2);
  assert.equal(m.bets, 3);
});

// ───────────── かけ試合 ─────────────
test('かけ試合の 計算: 優勝の わりあいは あわせて 1・オッズは 強さから（店の とりぶん）・はらいもどし', () => {
  const pw = [[0.5, 0.8, 0.6, 0.7], [0.2, 0.5, 0.3, 0.4], [0.4, 0.7, 0.5, 0.9], [0.3, 0.6, 0.1, 0.5]];
  const ch = winChances(pw);
  assert.ok(Math.abs(ch.reduce((s, x) => s + x, 0) - 1) < 1e-9);
  assert.ok(ch[0] > ch[1]);
  assert.equal(oddsOf(0.5), Math.floor(((1 - BET_HOUSE) / 0.5) * 10) / 10);
  assert.equal(oddsOf(0.99), ODDS_MIN);
  assert.equal(oddsOf(0.0001), ODDS_MAX);
  assert.ok(oddsOf(0.1) > oddsOf(0.3), '弱い（勝ちにくい）ほど オッズが 高い');
  assert.equal(payout(100, 3.4, true), 340);
  assert.equal(payout(1000, 1.1, true), 1100);
  assert.equal(payout(1000, 5, false), 0);
  assert.equal(duelRate(0, 14), 1 / 16);
  // 期待値は 1より 小さい（店の とりぶん）
  for (const x of [0.05, 0.2, 0.5, 0.8]) assert.ok(oddsOf(x) * x <= 1);
});

test('かけ試合: 本物の 戦いの しくみで 1対1（どちらでも 勝てる・同じ 魔物どうしは だいたい 五分）とトーナメント', () => {
  const rng = makeRng(77);
  assert.ok(BET_POOL.every((sp) => MONSTERS[sp]));
  let w0 = 0;
  for (let i = 0; i < 40; i++) {
    const d = betDuel(rng, 'golem', 'golem', { log: false });
    assert.ok(d.winner === 0 || d.winner === 1);
    if (d.winner === 0) w0++;
  }
  assert.ok(w0 >= 10 && w0 <= 30, `同じ 魔物どうし ${w0}/40`);
  // 強い 方が よく 勝つ（キングぷるりん 対 ばくだんの ような 強い 竜）
  let strong = 0;
  for (let i = 0; i < 20; i++) if (betDuel(rng, 'water_dragon', 'king_pururin', { log: false }).winner === 0) strong++;
  const ch = lineupChances(['water_dragon', 'king_pururin', 'golem', 'yeti'], makeRng(5));
  assert.ok(ch[0] > ch[1], 'オッズも 強い ほうが 低い');
  assert.ok(strong >= 10);
  const lineup = makeLineup(rng);
  assert.equal(new Set(lineup).size, 4);
  const t = betTournament(rng, lineup);
  assert.equal(t.bouts.length, 3);
  assert.ok(t.bouts[2].final);
  assert.ok([t.bouts[0].winner, t.bouts[1].winner].includes(t.champ));
  for (const bt of t.bouts) {
    assert.ok(bt.lines.length > 0 && bt.lines.length <= 7, '短い 戦いの ようす');
    assert.ok(bt.lines.every((l) => typeof l.text === 'string' && l.hp.length === 2));
  }
});

test('かけ試合の 係: かけた ゴールドが へり、当たれば ゴールド×オッズ（画面に 組み合わせと 戦いの ようす）', async () => {
  const { world, bot, c } = await setup(9);
  world.placeSession(bot.s, ARENA_MAP, ARENA_POS.bet.x - 0.5, ARENA_POS.bet.y + 0.5, 'right', true);
  await bot.settle();
  let sawHit = false, sawMiss = false;
  for (let k = 0; k < 8 && !(sawHit && sawMiss); k++) {
    c.gold = 5000;
    const from = bot.msgs.length;
    // かけ試合をする → 1ばん → 100G → やめる
    choices(bot, [0, k % 4, 1, 1]);
    await talk(bot, 'arena_bet');
    const card = uiOf(bot, 'arenaCard', from)[0];
    const bout = uiOf(bot, 'arenaBout', from)[0];
    assert.ok(card && bout, '画面');
    assert.equal(card.card.length, 4);
    assert.equal(bout.bet, 100);
    const odds = card.card[k % 4].odds;
    if (bout.champ === bout.pick) {
      sawHit = true;
      assert.equal(c.gold, 5000 - 100 + Math.floor(100 * odds));
      assert.equal(bout.win, Math.floor(100 * odds));
    } else {
      sawMiss = true;
      assert.equal(c.gold, 4900);
    }
  }
  assert.ok(sawMiss || sawHit);
  assert.ok((c.arena?.bets || 0) >= 1);
  // お金が 足りない
  c.gold = 5;
  const from = bot.msgs.length;
  choices(bot, [0, 0]);
  await talk(bot, 'arena_bet');
  assert.ok(said(bot, 'ゴールドが足りない', from));
  assert.equal(c.gold, 5);
});

// ───────────── 王者の しかけ ─────────────
function chainBattle(enc, seed = 1) {
  const e = FIXED_ENCOUNTERS[enc];
  return new Battle({ rng: makeRng(seed), allies: [], enemies: e.group.flatMap(([sp, n]) => Array(n).fill(sp)), canFlee: false, boss: true });
}
test('王者の しかけ: 合体技は 生きている 組の 数で 強さが かわり、1人では くずれる・よろいは 同じ 属性を すいこむ・弱点で くだける', async () => {
  const { arenaCond, arenaEffect, arenaDamage, teamAlive } = await import('../public/js/shared/battle-arena.js');
  const b = chainBattle('ar2_3');
  const [p1, p2, p3] = b.enemies;
  assert.equal(teamAlive(b, p1).length, 3);
  assert.equal(arenaCond(b, p1, 'arTeam2'), true);
  p2.alive = false;
  p3.alive = false;
  assert.equal(arenaCond(b, p1, 'arTeam2'), false, '1人では 合図しない');
  const ev = { lines: [], upd: [] };
  arenaEffect(b, p1, ABILITIES.m_ar2_combo, ABILITIES.m_ar2_combo.effect, ev, []);
  assert.ok(ev.arBroken, '1人だけでは くずれる');
  // よろい
  const b2 = chainBattle('ar7_3');
  const pr = b2.enemies[0];
  assert.ok(pr.arArmor, 'はじめから よろいを まとう');
  const el = pr.arArmor;
  const weak = MONSTERS.ar_prism.arena.armor.weak[el];
  pr.hp = 1000;
  const ev2 = { lines: [], upd: [], results: [] };
  const fake = { side: 'ally', name: 'まほう' };
  assert.equal(arenaDamage(b2, fake, pr, 300, { element: el }, ev2), null, 'すいこむ');
  assert.ok(pr.hp > 1000, 'HPが ふえる');
  assert.equal(arenaDamage(b2, fake, pr, 300, { element: 'phys' }, ev2), 300, '物理は そのまま');
  const d = arenaDamage(b2, fake, pr, 300, { element: weak }, ev2);
  assert.ok(d > 300, '弱点');
  assert.equal(pr.arArmor, null, 'よろいが くだける');
  assert.equal(arenaCond(b2, pr, 'arNoArmor'), false, 'すぐには また まとわない');
  pr.used.attack = 5;
  assert.equal(arenaCond(b2, pr, 'arNoArmor'), true, 'しばらくして また まとう');
});
