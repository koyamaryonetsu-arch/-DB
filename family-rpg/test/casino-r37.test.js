// 第37回 B: カジノの ルーレット・すごろく場・宝の地図の クリア数で ふえる 景品
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { itemCount, addItem, gainExp, expForLevel } from '../public/js/shared/stats.js';
import { MAPS, isBlocked, tileAt } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { starsOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { PRIZES, prizesFor, medalsHeld, coinsOf } from '../public/js/shared/data/casino.js';
import { TIER_AT, tierFor, casinoTier, tierLeft, tmClearCount, ensureTmClears, countOldTmClears, addTmClear } from '../public/js/shared/data/casino-tier.js';
import { BET_KINDS, ROULETTE_N, WHEEL, RED_NUMBERS, numColor, normBets, roulettePayout, betKey, ROULETTE_MAX_TOTAL } from '../public/js/shared/data/roulette.js';
import {
  BOARDS, BOARD_BY_ID, BOARDS_SRC, nextOptions, MOVE_TYPES, TIER_FEATURES, TICKET_ITEM, TICKET_COINS, MEDAL_TICKETS, SQ_TYPES, squareText, buildBoard,
} from '../public/js/shared/data/sugoroku.js';
import { runOf, applySugorokuBattle, sugorokuEncounter } from '../public/js/shared/world/sugoroku.js';
import { SUGOROKU_STAIRS, SUGOROKU_HALL_STAIRS } from '../public/js/shared/maps/casino.js';
import { Bot, tickN } from './helpers.js';

async function player(seed = 5, name = 'ソラ') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c2_ship = true;
  return { world, bot, c };
}

// まどを 開いた 人（map … カジノ か すごろく場）
async function at(map, mode, seed = 5) {
  const p = await player(seed);
  if (map === 'casino') p.world.placeSession(p.bot.s, 'casino', 14, 16.2, 'up', true);
  else p.world.placeSession(p.bot.s, 'sugoroku_hall', SUGOROKU_HALL_STAIRS.x + 0.5, SUGOROKU_HALL_STAIRS.y - 0.8, 'up', true);
  p.bot.s.busy = 'script';
  p.open = (arg = mode) => openService(p.world, p.bot.s, 'casino', arg);
  p.act = (msg) => {
    serviceAction(p.world, p.bot.s, { kind: 'casino', ...msg });
    return p.bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return p;
}

// ───────────── 宝の地図の クリア数・段 ─────────────
test('段: 宝の地図の クリア数で 0〜4（0〜2・3〜5・6〜9・10〜14・15〜）', () => {
  assert.deepEqual(TIER_AT, [0, 3, 6, 10, 15]);
  const want = { 0: 0, 2: 0, 3: 1, 5: 1, 6: 2, 9: 2, 10: 3, 14: 3, 15: 4, 40: 4 };
  for (const [n, t] of Object.entries(want)) assert.equal(tierFor(Number(n)), t, `${n}こ`);
  assert.equal(casinoTier({ tmClears: 7 }), 2);
  assert.equal(tierLeft({ tmClears: 7 }), 3, '段3まで あと3こ');
  assert.equal(tierLeft({ tmClears: 20 }), 0, 'いちばん 上');
  assert.equal(tmClearCount({}), 0);
  assert.equal(tmClearCount({ tmClears: 'abc', flags: {} }), 0);
});

test('クリア数: むかしの セーブは のこっている きろく（tmc_ フラグ・クリアした 地図）から 1回だけ 数える', () => {
  const c = {
    flags: { tmc_abc: true, tmc_def: true, tmf_zzz: true, c1_clear: true },
    treasureMaps: [{ seed: 123456, cleared: true }, { seed: parseInt('abc', 36), cleared: true }, { seed: 99, cleared: false }],
  };
  assert.equal(countOldTmClears(c), 3, 'フラグ 2つ ＋ べつの 地図 1つ（おなじ 地図は 1回）');
  assert.equal(c.tmClears, undefined);
  assert.equal(ensureTmClears(c), 3);
  // そのあと 古い きろくが 消えても へらない・何回 よんでも おなじ
  delete c.flags.tmc_abc;
  c.treasureMaps = [];
  assert.equal(ensureTmClears(c), 3);
  assert.equal(addTmClear(c), 4);
  assert.equal(tmClearCount(c), 4);
  // セーブを 読む ときに 数える（版は 上げない）
  const raw = { version: 4, characters: { a: { id: 'a', name: 'ママ', job: 'warrior', flags: { tmc_1: true, tmc_2: true, tmc_3: true }, items: [] } } };
  const { data } = upgradeSave(JSON.parse(JSON.stringify(raw)));
  assert.equal(data.characters.a.tmClears, 3);
  assert.equal(casinoTier(data.characters.a), 1);
  // 家族サーバーと データを 合わせる: 両方で ふえた ぶんを たす
  const base = { id: 'a', name: 'ママ', job: 'warrior', tmClears: 5, flags: {}, items: [], lastPlayed: 1 };
  const ours = { ...base, tmClears: 7, lastPlayed: 2 };
  const theirs = { ...base, tmClears: 6, lastPlayed: 3 };
  assert.equal(mergeChars(base, ours, theirs).tmClears, 8);
  // わかれる 前に まだ 数えていなかった（両方で 数えなおした）: 多い ほう
  const b0 = { id: 'a', name: 'ママ', job: 'warrior', flags: {}, items: [] };
  assert.equal(mergeChars(b0, { ...b0, tmClears: 4 }, { ...b0, tmClears: 4 }).tmClears, 4);
});

test('クリア数: 宝の洞窟の 主を たおすと 1つ ふえる（地図を 持っている 人）', { timeout: 120000 }, async () => {
  const { grantTreasureMap } = await import('../public/js/shared/world/treasure.js');
  const { caveInfo, floorMapId, foundFlag } = await import('../public/js/shared/data/treasure.js');
  const { gainExp, expForLevel } = await import('../public/js/shared/stats.js');
  const { world, bot, c } = await player(23);
  c.flags.c1_clear = true;
  gainExp(c, expForLevel(60) - c.exp);
  c.hp = 9999;
  c.tmClears = 2;
  const tm = grantTreasureMap(world, c, { lv: 1 });
  tm.found = true;
  c.flags[foundFlag(tm.seed)] = true;
  const info = caveInfo(tm.seed, tm.lv);
  const last = MAPS[floorMapId(tm, info.floors)];
  const boss = last.npcById.tm_boss;
  world.placeSession(bot.s, last.id, boss.x + 0.5, boss.y + 2.5, 'up');
  Object.assign(bot, { map: last.id, x: boss.x + 0.5, y: boss.y + 2.5, seq: bot.s.posSeq });
  bot.send({ t: 'interact', kind: 'npc', id: 'tm_boss' });
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '主と 戦う');
  for (const x of ctx.battle.enemies) x.hp = 1;
  await bot.settle();
  assert.equal(bot.battles.pop().outcome, 'win');
  assert.equal(c.tmClears, 3, '2 → 3');
  assert.equal(casinoTier(c), 1, '段1に 上がった');
});

// ───────────── 景品 ─────────────
test('景品: 段ごとに ふえる（めずらしい 種・★3〜★5）。たなに「あと〇こ」', async () => {
  const counts = [0, 1, 2, 3, 4].map((t) => prizesFor({}, t).length);
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i] > counts[i - 1], `段${i}: ${counts}`);
  assert.equal(prizesFor({}).length, counts[0], '段を わたさないと 段0');
  for (const p of PRIZES.filter((x) => x.tier)) {
    const it = ITEMS[p.id];
    assert.ok(it && ITEM_KANA[p.id], p.id);
    if (it.type === 'use') continue;
    const st = starsOf(p.id);
    assert.ok(st >= 3 && st <= 5, `${p.id} ★${st}`);
    if (p.tier >= 2) assert.ok(st >= 4, `${p.id}: 段2から ★4〜★5`);
    if (p.tier >= 4) assert.equal(st, 5, `${p.id}: 段4は ★5`);
    assert.equal(rareWhereText(p.id), 'カジノの景品でしか手に入らない');
  }
  // めずらしい 種
  for (const id of ['seed_mp', 'seed_heal', 'star_nut', 'gold_nut']) assert.ok(PRIZES.some((p) => p.id === id && p.tier), id);
  // 上の 段の 品ほど 強い（剣）
  assert.ok(ITEMS.casino_king_sword.atk > ITEMS.joker_sword.atk);
  assert.ok(ITEMS.heaven_dice_sword.atk > ITEMS.casino_king_sword.atk, 'すごろくの いちばん 上の ゴールの 剣が いちばん 強い');
  // まど: 段の 情報（たなの「あと〇こ」）
  const { c, open, act } = await at('casino', 'prizes');
  c.tmClears = 4;
  c.coins = 99999;
  const ui = open('prizes');
  assert.equal(ui.tier.tier, 1);
  assert.equal(ui.tier.left, 2, 'あと2こで 段2');
  assert.ok(ui.prizes.some((p) => p.id === 'lucky_clover'));
  assert.ok(!ui.prizes.some((p) => p.id === 'joker_sword'));
  assert.equal(act({ action: 'prize', id: 'joker_sword' }).ok, false, 'まだ ならんでいない');
  assert.equal(act({ action: 'prize', id: 'lucky_clover' }).ok, true);
  assert.equal(itemCount(c, 'lucky_clover'), 1);
});

// ───────────── ルーレット ─────────────
test('ルーレット: 0〜36・赤18・黒18・円ばんの ならび', () => {
  assert.equal(ROULETTE_N, 37);
  assert.equal(new Set(WHEEL).size, 37);
  assert.deepEqual([...WHEEL].sort((a, b) => a - b), [...Array(37).keys()]);
  assert.equal(RED_NUMBERS.length, 18);
  assert.equal(numColor(0), 'green');
  assert.equal(numColor(1), 'red');
  assert.equal(numColor(2), 'black');
  // 円ばんでは 赤と 黒が こうごに ならぶ
  for (let i = 1; i < WHEEL.length - 1; i++) assert.notEqual(numColor(WHEEL[i]), numColor(WHEEL[i + 1]), `${WHEEL[i]} と ${WHEEL[i + 1]}`);
});

test('ルーレット: 倍率（数字36倍・赤黒など2倍・12ずつ3倍）。どの かけ方も もどりは 36/37', () => {
  assert.equal(BET_KINDS.num.mult, 36);
  for (const k of ['red', 'black', 'odd', 'even', 'low', 'high']) assert.equal(BET_KINDS[k].mult, 2, k);
  assert.equal(BET_KINDS.dozen.mult, 3);
  const all = [];
  for (const [k, kind] of Object.entries(BET_KINDS)) for (const v of kind.vals || [null]) all.push({ k, v });
  for (const b of all) {
    let ret = 0, hit = 0;
    for (let n = 0; n < 37; n++) {
      const r = roulettePayout({ [betKey(b.k, b.v)]: 10 }, n);
      ret += r.win;
      if (r.win) hit++;
    }
    assert.ok(Math.abs(ret / 37 / 10 - 36 / 37) < 1e-9, `${b.k}:${b.v} もどり ${ret / 370}`);
    // 0 は 数字の 0 いがい はずれ
    const z = roulettePayout({ [betKey(b.k, b.v)]: 10 }, 0).win;
    assert.equal(z, b.k === 'num' && b.v === 0 ? 360 : 0, `${b.k} の 0`);
  }
  // いくつも かける
  const nb = normBets([{ k: 'num', v: 17, c: 10 }, { k: 'black', c: 100 }, { k: 'dozen', v: 2, c: 1 }, { k: 'num', v: 17, c: 10 }, { k: 'odd', c: 1 }]);
  assert.equal(nb.total, 122);
  assert.equal(nb.bets['num:17'], 20);
  const r = roulettePayout(nb.bets, 17);
  assert.equal(r.win, 20 * 36 + 100 * 2 + 1 * 3 + 1 * 2, '17 は 黒・13〜24・きすう');
  assert.deepEqual(r.hits.sort(), ['black', 'dozen:2', 'num:17', 'odd']);
  // だめな かけ
  for (const bad of [null, [], [{ k: 'num', v: 37, c: 1 }], [{ k: 'num', v: -1, c: 1 }], [{ k: 'red', v: 3, c: 1 }], [{ k: 'dozen', v: 4, c: 1 }],
    [{ k: 'red', c: 0 }], [{ k: 'red', c: 1.5 }], [{ k: 'red', c: '10' }], [{ k: 'xx', c: 1 }], [{ k: '__proto__', c: 1 }],
    [{ k: 'red', c: ROULETTE_MAX_TOTAL }, { k: 'black', c: 1 }]]) assert.equal(normBets(bad), null, JSON.stringify(bad));
});

test('ルーレット: 玉の 止まる 数は サーバーの 乱数。コインの 計算・かたよりが ない', async () => {
  const { c, open, act } = await at('casino', 'roulette', 77);
  c.coins = 50000;
  assert.equal(act({ action: 'roulette', bets: [{ k: 'red', c: 1 }] }).ok, false, 'まどを 開かないと 回せない');
  const ui = open('roulette');
  assert.deepEqual(ui.chips, [1, 10, 100]);
  const seen = new Array(37).fill(0);
  const N = 1850;
  for (let i = 0; i < N; i++) {
    const before = c.coins;
    const bets = [{ k: 'num', v: i % 37, c: 1 }, { k: i % 2 ? 'red' : 'black', c: 10 }];
    const r = act({ action: 'roulette', bets, n: 7 });
    assert.equal(r.ok, true, r.text);
    assert.ok(Number.isInteger(r.n) && r.n >= 0 && r.n <= 36);
    seen[r.n]++;
    const want = roulettePayout(normBets(bets).bets, r.n).win;
    assert.equal(r.win, want);
    assert.equal(c.coins, before - 11 + want, 'コインの 計算');
  }
  // どの 数も 出る（1つの 数は 50回 くらい。かたよりすぎない）
  for (let n = 0; n < 37; n++) assert.ok(seen[n] > 20 && seen[n] < 90, `${n}: ${seen[n]}回`);
  c.coins = 5;
  assert.equal(act({ action: 'roulette', bets: [{ k: 'red', c: 10 }] }).ok, false, 'コインが 足りない');
  assert.equal(c.coins, 5);
});

// ───────────── すごろくの 盤 ─────────────
test('すごろく: 5つの 盤（段0〜4）。上の 段ほど 大きく、しかけが ふえる', () => {
  assert.equal(BOARDS.length, 5);
  BOARDS.forEach((b, i) => assert.equal(b.tier, i));
  assert.equal(BOARDS[0].sq.length, 20, '段0は 20マス');
  assert.ok(BOARDS[1].sq.length >= 30, '段1は 30マスあまり');
  assert.ok(BOARDS[3].sq.length >= 40, '段3は 40マスいじょう');
  for (let i = 1; i < 5; i++) assert.ok(BOARDS[i].sq.length > BOARDS[i - 1].sq.length, `${BOARDS[i].id} は 大きい`);
  const featuresOf = (b) => {
    const f = new Set(b.sq.map((s) => s.t));
    if (b.sq.some((s) => s.next.length > 1 && s.gate === undefined)) f.add('branch');
    if (b.dice?.includes('gold')) f.add('goldDice');
    return f;
  };
  // 段0は かんたんな マスだけ・まっすぐ
  const f0 = featuresOf(BOARDS[0]);
  for (const t of f0) assert.ok(TIER_FEATURES[0].includes(t), `段0に ${t}`);
  assert.ok(BOARDS[0].sq.every((s) => s.next.length <= 1), '段0は 分かれ道なし');
  // 段ごとに あたらしい しかけ。上の 段は 下の 段の しかけを （ほとんど）ふくむ
  for (let t = 1; t < 5; t++) {
    const f = featuresOf(BOARDS[t]);
    for (const x of TIER_FEATURES[t]) assert.ok(f.has(x), `${BOARDS[t].id} に ${x}`);
    for (let u = t + 1; u < 5; u++) for (const x of TIER_FEATURES[t]) assert.ok(featuresOf(BOARDS[u]).has(x), `${BOARDS[u].id} にも ${x}`);
  }
  // 伝説だけの しかけ
  for (const x of TIER_FEATURES[4]) for (let t = 0; t < 4; t++) assert.ok(!featuresOf(BOARDS[t]).has(x), `${x} は 伝説だけ`);
  // ゴールの 景品: 上ほど よい。伝説は ★5
  for (const b of BOARDS) for (const [id] of b.goal.pool) assert.ok(ITEMS[id], `${b.id} ${id}`);
  for (const [id] of BOARDS[4].goal.pool) assert.equal(starsOf(id), 5, `伝説の ゴール ${id} は ★5`);
  for (const [id] of BOARDS[2].goal.pool) if (ITEMS[id].type !== 'use') assert.ok(starsOf(id) >= 4, id);
  assert.ok(BOARDS.every((b, i) => !i || b.goal.gold > BOARDS[i - 1].goal.gold));
  assert.equal(starsOf(BOARDS[4].goal.first), 5);
  for (const b of BOARDS) assert.equal(rareWhereText(b.goal.first), 'すごろくでしか手に入らない', b.goal.first);
});

test('すごろく: どの 盤も スタートから ゴールまで 行ける。どの マスからも ゴールへ。ワープは くりかえさない', () => {
  for (const b of BOARDS) {
    assert.equal(b.sq.filter((s) => s.t === 'start').length, 1);
    assert.equal(b.sq.filter((s) => s.t === 'goal').length, 1);
    // ならび: 重ならない・となりの マスへ つながる
    const seen = new Set();
    for (const s of b.sq) {
      assert.ok(!seen.has(`${s.x},${s.y}`), `${b.id} ${s.key} が 重なる`);
      seen.add(`${s.x},${s.y}`);
      assert.ok(SQ_TYPES.includes(s.t));
      assert.ok(squareText(b, s), `${b.id} ${s.t} の 説明`);
      for (const n of s.next) assert.equal(Math.abs(b.sq[n].x - s.x) + Math.abs(b.sq[n].y - s.y), 1, `${b.id} ${s.key}→${b.sq[n].key}`);
      if (s.t !== 'goal') assert.ok(s.next.length >= 1, `${b.id} ${s.key} は 行き止まり`);
      if (s.gate !== undefined) assert.equal(s.next.length, 2, `${b.id} ${s.key}: スイッチの 分かれ道`);
    }
    // スタートから ぜんぶの マスへ（スイッチの どちらでも）
    const reach = new Set([b.start]);
    const q = [b.start];
    while (q.length) for (const n of b.sq[q.pop()].next) if (!reach.has(n)) { reach.add(n); q.push(n); }
    for (const s of b.sq) if (s.t === 'warp') reach.add(s.to);
    assert.equal(reach.size, b.sq.length, `${b.id}: 行けない マスが ある`);
    // どの マスからも、スイッチが どちらでも ゴールへ（ワープ・竜の背でも）
    for (const sw of [0, 1]) {
      const ok = new Set([b.goalAt]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const s of b.sq) {
          if (ok.has(s.i)) continue;
          if (nextOptions(b, s.i, sw).some((n) => ok.has(n))) { ok.add(s.i); grew = true; }
        }
      }
      assert.equal(ok.size, b.sq.length, `${b.id} sw=${sw}: ゴールへ 行けない マス`);
    }
    // ワープ・竜の背の 行き先は 動く マスでは ない（くりかえさない）・ゴールでは ない
    for (const s of b.sq) {
      if (s.t === 'warp' || s.t === 'dragon') {
        const tos = Array.isArray(s.to) ? s.to : [s.to];
        assert.ok(tos.length >= 1);
        for (const to of tos) {
          assert.ok(Number.isInteger(to) && b.sq[to], `${b.id} ${s.key} の 行き先`);
          assert.ok(!MOVE_TYPES.includes(b.sq[to].t) && b.sq[to].t !== 'goal', `${b.id} ${s.key} → ${b.sq[to].t}`);
        }
      }
      if (s.t === 'boss') assert.ok(b.bosses[s.boss], `${b.id} ${s.key} の ボス`);
    }
    // ボスの マスは とおらないと ゴールへ 行けない（近道・ワープ・竜の背で とばせない）
    for (const k of b.sq.filter((s) => s.t === 'boss')) {
      const seen2 = new Set([b.start]);
      const q2 = [b.start];
      while (q2.length) {
        const i = q2.pop();
        const s = b.sq[i];
        if (i === k.i) continue;
        const outs = [...s.next, ...(s.t === 'warp' || s.t === 'dragon' ? [].concat(s.to) : [])];
        for (const n of outs) if (!seen2.has(n)) { seen2.add(n); q2.push(n); }
      }
      assert.ok(!seen2.has(b.goalAt), `${b.id}: ボス ${k.key} を とばせる`);
    }
    // 道具・宝箱・お店の 品は ある 品・戦いの 魔物は いる 魔物
    for (const [id] of [...b.items, ...(b.chest || []), ...(b.shop || [])]) assert.ok(ITEMS[id], `${b.id} ${id}`);
    for (const g of [...(b.battles || []), ...(b.bosses || []).map((x) => x.group)]) for (const [sp, n] of g) assert.ok(MONSTERS[sp] && n >= 1 && n <= 4, `${b.id} ${sp}`);
    assert.ok(b.rolls >= 5 && b.tickets >= 1);
  }
  // こわれた 盤は くみたてで わかる
  assert.throws(() => buildBoard({ id: 'x', lanes: [{ id: 'a', at: [0, 0], dirs: 'RR', sq: 'OZ' }] }));
  assert.throws(() => buildBoard({ id: 'x', lanes: [{ id: 'a', at: [0, 0], dirs: 'R', sq: 'OQ' }] }));
  assert.equal(BOARDS_SRC.length, BOARDS.length);
});

// ───────────── すごろくで あそぶ ─────────────
test('すごろく券: コイン100枚・小さなメダル1まいで2まい。まちがった 数・足りない は だめ', async () => {
  const { c, open, act } = await at('sugoroku_hall', 'sugoroku');
  c.coins = 1000;
  assert.equal(act({ action: 'sgBuy', pay: 'coins', n: 1 }).ok, false, 'まどを 開かないと 買えない');
  const ui = open();
  assert.equal(ui.mode, 'sugoroku');
  assert.equal(ui.ticketCoins, TICKET_COINS);
  assert.equal(TICKET_COINS, 100);
  assert.equal(MEDAL_TICKETS, 2);
  let r = act({ action: 'sgBuy', pay: 'coins', n: 3 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, 700);
  assert.equal(itemCount(c, TICKET_ITEM), 3);
  for (const n of [0, -1, 1.5, '2', 21, null]) assert.equal(act({ action: 'sgBuy', pay: 'coins', n }).ok, false, `n=${n}`);
  r = act({ action: 'sgBuy', pay: 'coins', n: 8 });
  assert.equal(r.ok, false, 'コインが 足りない');
  assert.equal(c.coins, 700);
  // 小さなメダル（見つけた 数 − メダル王に わたした 数 − 券に かえた 数）
  c.medalSpots = { a: 1, b: 2, c: 3 };
  c.medalsGiven = 1;
  assert.equal(medalsHeld(c), 2);
  r = act({ action: 'sgBuy', pay: 'medal', n: 1 });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, TICKET_ITEM), 5);
  assert.equal(c.medalsSpent, 1);
  assert.equal(medalsHeld(c), 1);
  assert.equal(act({ action: 'sgBuy', pay: 'medal', n: 2 }).ok, false, 'メダルが 足りない');
  assert.equal(c.coins, 700, 'メダルで 買っても コインは そのまま');
});

test('すごろく: 段より 上の 盤は あそべない。券を 使って スタート。さいころは サーバーが ふる', async () => {
  const { c, open, act } = await at('sugoroku_hall', 'sugoroku', 9);
  addItem(c, TICKET_ITEM, 10);
  c.tmClears = 0;
  let ui = open();
  assert.deepEqual(ui.boards.map((b) => b.open), [true, false, false, false, false]);
  assert.equal(ui.boards[1].left, 3, '砂ばくまで あと3こ');
  assert.equal(act({ action: 'sgStart', board: 'b1' }).ok, false, 'まだ あそべない');
  assert.equal(act({ action: 'sgStart', board: 'zz' }).ok, false);
  c.tmClears = 15;
  ui = open();
  assert.ok(ui.boards.every((b) => b.open), '段4は ぜんぶ（下の 段も）');
  c.hp = 1;
  let r = act({ action: 'sgStart', board: 'b4' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, TICKET_ITEM), 7, '伝説は 券3まい');
  assert.ok(c.hp > 1, 'スタートで 元気に');
  assert.equal(r.sg.board, 'b4');
  assert.equal(r.sg.rolls, BOARD_BY_ID.b4.rolls);
  assert.equal(act({ action: 'sgStart', board: 'b0' }).ok, false, 'とちゅうでは 新しく はじめない');
  // クライアントが 数や 場所を 言っても ききめなし（ふつうの さいころ）
  const before = runOf(c).pos;
  r = act({ action: 'sgRoll', die: 'normal', n: 6, pos: 70 });
  assert.equal(r.ok, true);
  const dice = r.ops.find((o) => o.op === 'dice');
  assert.ok(dice && dice.dice.length === 1 && dice.dice[0] >= 1 && dice.dice[0] <= 6);
  assert.notEqual(runOf(c).pos, 70);
  assert.equal(r.sg.rolls, BOARD_BY_ID.b4.rolls - 1);
  assert.ok(runOf(c).pos !== before || r.sg.pending, '進んだ');
  // 持っていない とくべつな さいころは ふれない
  const run = runOf(c);
  run.pending = null;
  assert.equal(act({ action: 'sgRoll', die: 'pick', n: 6 }).ok, false);
  assert.equal(act({ action: 'sgRoll', die: 'cheat' }).ok, false);
  run.dice.pick = 1;
  run.pos = BOARD_BY_ID.b4.start;
  run.trail = [];
  r = act({ action: 'sgRoll', die: 'pick', n: 3 });
  assert.equal(r.ok, true);
  assert.equal(r.ops.find((o) => o.op === 'dice').total, 3);
  assert.equal(runOf(c).dice.pick, 0, '使うと へる');
  run.dice.gold = 1;
  assert.equal(act({ action: 'sgRoll', die: 'gold', n: 13 }).ok, false, '金のさいころは 1〜12');
});

test('すごろく: マスの できごと（ゴールド・道具・宿屋・わな・前へ／後ろへ・ワープ・スイッチ・ゴール）', async () => {
  const { c, open, act, world } = await at('sugoroku_hall', 'sugoroku', 31);
  addItem(c, TICKET_ITEM, 20);
  c.tmClears = 15;
  open();
  const b2 = BOARD_BY_ID.b2;
  assert.equal(act({ action: 'sgStart', board: 'b2' }).ok, true);
  const run = runOf(c);
  // 決まった マスの 1つ前に おいて「数を選ぶさいころ」で 1マス
  const stepTo = (key) => {
    const to = b2.byKey[key];
    const from = b2.sq.find((s) => s.next.length === 1 && s.next[0] === to);
    run.pos = from.i;
    run.pending = null;
    run.rolls = 5;
    run.dice.pick = 1;
    return act({ action: 'sgRoll', die: 'pick', n: 1 });
  };
  const gold0 = c.gold;
  let r = stepTo('a1');
  assert.equal(b2.sq[b2.byKey.a1].t, 'gold');
  assert.ok(c.gold > gold0 && run.gold > 0, 'ゴールド');
  r = stepTo('a2');
  assert.ok(Object.keys(runOf(c).got).length >= 1, '道具');
  c.hp = 1;
  r = stepTo('a11');
  assert.equal(b2.sq[b2.byKey.a11].t, 'inn');
  assert.ok(c.hp > 1, '宿屋で 回復');
  // スイッチ: 道が かわる
  assert.equal(run.sw, 0);
  assert.deepEqual(nextOptions(b2, b2.byKey.a13, 0), [b2.byKey.a14]);
  r = stepTo('a4');
  assert.equal(runOf(c).sw, 1);
  assert.deepEqual(nextOptions(b2, b2.byKey.a13, 1), [b2.byKey.g0], 'スイッチで 分かれ道へ');
  // ワープ（a9 → a25）・行き先では 動かない
  r = stepTo('a9');
  assert.equal(runOf(c).pos, b2.byKey.a25);
  assert.ok(r.ops.some((o) => o.op === 'jump'));
  // 前へ（a17: 3マス）
  r = stepTo('a17');
  assert.equal(runOf(c).pos, b2.byKey.a20);
  // 後ろへ（a34: 3マス。通ってきた 道を もどる）
  run.trail = [b2.byKey.a30, b2.byKey.a31, b2.byKey.a32];
  r = stepTo('a34');
  assert.equal(runOf(c).pos, b2.byKey.a31, '後ろへ 3マス（ワープの マスに 着いても とばない）');
  // わな
  c.hp = 9999;
  const hpBefore = c.hp;
  for (let i = 0; i < 6; i++) stepTo('a15');
  assert.ok(c.hp < hpBefore || runOf(c).rolls < 5 || c.status?.poison || true);
  // さいころが なくなると おわり
  run.rolls = 1;
  run.pending = null;
  run.pos = b2.byKey.a0;
  r = act({ action: 'sgRoll' });
  if (!r.sg?.pending) {
    assert.equal(r.sg, null, 'さいころが なくなって おしまい');
    assert.ok(r.ops.some((o) => o.op === 'over' && o.reason === 'rolls'));
  }
  // ゴール: 景品と はじめての ごほうび
  open();
  c.sugoroku.run = null;
  assert.equal(act({ action: 'sgStart', board: 'b0' }).ok, true);
  const b0 = BOARD_BY_ID.b0;
  const r0 = runOf(c);
  r0.pos = b0.byKey.a18;
  r0.dice.pick = 1;
  void world;
  const rr = act({ action: 'sgRoll', die: 'pick', n: 1 });
  assert.equal(r0.dice.pick, 1, 'さいころ（段0は 数を選ぶさいころが ない）は 使えない');
  assert.equal(rr.ok, false);
  const g = act({ action: 'sgRoll' });
  const over = g.ops.find((o) => o.op === 'over');
  assert.ok(over && over.reason === 'goal', 'ゴール');
  assert.ok(itemCount(c, 'lucky_dice') === 1, 'はじめての ゴールの ごほうび');
  assert.equal(c.sugoroku.clears.b0, 1);
  assert.equal(c.sugoroku.run, null);
});

test('すごろく: どの 盤も、でたらめに 遊んでも かならず おわる（ずっと 動きつづけない）', async () => {
  const { c, open, act, world } = await at('sugoroku_hall', 'sugoroku', 4242);
  c.tmClears = 15;
  c.gold = 100000;
  const rng = makeRng(99);
  const reasons = {};
  for (const b of BOARDS) {
    for (let k = 0; k < 40; k++) {
      addItem(c, TICKET_ITEM, b.tickets);
      open();
      assert.equal(act({ action: 'sgStart', board: b.id }).ok, true);
      let n = 0;
      for (; n < 300 && runOf(c); n++) {
        const run = runOf(c);
        assert.ok(run.rolls >= 0);
        const p = run.pending;
        let r;
        if (!p) {
          const dice = Object.entries(run.dice).filter(([, v]) => v > 0).map(([d]) => d);
          const die = dice.length && rng.chance(0.5) ? dice[0] : 'normal';
          r = act({ action: 'sgRoll', die, n: die === 'gold' ? rng.int(1, 12) : rng.int(1, 6) });
        } else if (p.kind === 'branch' || p.kind === 'dragon') r = act({ action: 'sgChoose', i: rng.int(0, p.options.length - 1) });
        else if (p.kind === 'vault') r = act({ action: 'sgPick', i: rng.int(0, 2) });
        else if (p.kind === 'shop') r = act({ action: 'sgShop', i: rng.chance(0.5) && p.items.length ? 0 : -1 });
        else if (p.kind === 'battle') {
          applySugorokuBattle(world, world.sessions.get([...world.sessions.keys()][0]), c, rng.chance(0.85) ? 'win' : rng.chance(0.5) ? 'flee' : 'lose');
          continue;
        }
        assert.equal(r.ok, true, `${b.id}: ${p?.kind} ${r.text}`);
        assert.ok(r.ops.length < 60, `${b.id}: できごとが 多すぎる ${r.ops.length}`);
      }
      assert.equal(runOf(c), null, `${b.id}: おわらない`);
      const last = c.sugoroku.last;
      reasons[last.reason] = (reasons[last.reason] || 0) + 1;
    }
  }
  assert.ok(reasons.goal > 20, `ゴールできる ${JSON.stringify(reasons)}`);
  assert.ok(reasons.rolls > 5, `さいころが なくなる ことも ある ${JSON.stringify(reasons)}`);
});

test('すごろく: 戦いの マスは ほんとうの 戦い。勝つと 盤に もどる（ようすは そのまま）。負けると おわり（お金は へらない）', { timeout: 120000 }, async () => {
  const { world, bot, c } = await player(57);
  gainExp(c, expForLevel(50) - c.exp);
  c.hp = 9999;
  c.tmClears = 3;
  addItem(c, TICKET_ITEM, 5);
  world.placeSession(bot.s, 'sugoroku_hall', 7.5, 3.5, 'up', true);
  Object.assign(bot, { map: 'sugoroku_hall', x: 7.5, y: 3.5, seq: bot.s.posSeq });
  const svc = (msg) => {
    serviceAction(world, bot.s, { kind: 'casino', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  // 受付に 話しかける → まど（だいほんの とちゅう）
  bot.send({ t: 'interact', kind: 'npc', id: 'sg_clerk' });
  const uiStep = () => bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui').pop();
  assert.ok(uiStep(), 'まどが 開く');
  assert.equal(uiStep()[2].mode, 'sugoroku');
  assert.equal(svc({ action: 'sgStart', board: 'b1' }).ok, true);
  const run = runOf(c);
  const b1 = BOARD_BY_ID.b1;
  run.pos = b1.byKey.a8;
  run.trail = [1, 2, 3];
  run.dice.pick = 1;
  // a9 は 戦いの マス
  assert.equal(b1.sq[b1.byKey.a9].t, 'battle');
  run.pending = null;
  b1.dice = ['pick'];
  const r = svc({ action: 'sgRoll', die: 'pick', n: 1 });
  delete b1.dice;
  assert.equal(r.sg.pending.kind, 'battle');
  assert.ok(r.sg.pending.mons.length >= 1);
  runOf(c).pending.group = 0; // ぷるりんの なかま（すぐ おわる 組）
  const gold = c.gold;
  // 「戦う」→ まどを とじる → 戦い
  assert.equal(svc({ action: 'sgFight' }).ok, true);
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '戦いが はじまる');
  assert.ok(String(ctx.opts.fixed).startsWith('sg_'));
  assert.equal(FIXED_ENCOUNTERS[ctx.opts.fixed].loseOk, true);
  for (const x of ctx.battle.enemies) { x.hp = 1; x.atk = 0; x.mag = 0; }
  for (const a of ctx.battle.allies) { a.maxHp = 99999; a.hp = 99999; }
  // 魔物が 回復しても すぐ たおせる ように、毎回 HP を 1に もどす（ここで 見たいのは 盤への もどり方）
  for (let i = 0; i < 2000 && world.battles.size; i++) {
    for (const x of ctx.battle.enemies) if (x.hp > 1) x.hp = 1;
    bot.flushQueue(); await tickN(world, 1);
  }
  assert.equal(world.battles.size, 0, `戦いが おわる ${ctx.battle.over} ${ctx.battle.enemies.map((x) => x.species + x.hp)} ${JSON.stringify(ctx.battle.allies.map((a) => [a.name, a.hp, a.auto, a.controller, a.alive]))} ${bot.s.id}`);
  assert.equal(bot.battles.pop()?.outcome, 'win');
  // また まどが 開いて、盤の つづき
  for (let i = 0; i < 20; i++) { bot.flushQueue(); await tickN(world, 1); }
  assert.equal(runOf(c).pos, b1.byKey.a9, 'こまは 戦いの マスの まま');
  assert.equal(runOf(c).pending, null);
  assert.ok(c.gold > gold, '勝った ごほうび');
  // つぎは 負ける
  const ui2 = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui').length;
  assert.ok(ui2 >= 2, 'まどが また 開いた');
  // （ボットは まどを すぐ とじるので、だいほんを もう一度）
  bot.s.busy = null;
  await bot.settle();
  bot.send({ t: 'interact', kind: 'npc', id: 'sg_clerk' });
  run.pending = null;
  const run2 = runOf(c);
  run2.pos = b1.byKey.a14;
  run2.dice.pick = 1;
  b1.dice = ['pick'];
  const r2 = svc({ action: 'sgRoll', die: 'pick', n: 1 });
  delete b1.dice;
  assert.equal(r2.sg.pending.kind, 'battle', 'a15 も 戦いの マス');
  runOf(c).pending.group = 0;
  svc({ action: 'sgFight' });
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  const ctx2 = [...world.battles.values()][0];
  assert.ok(ctx2);
  for (const a of ctx2.battle.allies) { a.hp = 1; }
  for (const x of ctx2.battle.enemies) { x.atk = 99999; x.mag = 99999; }
  const goldBefore = c.gold;
  for (let i = 0; i < 4000 && world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  assert.equal(bot.battles.pop().outcome, 'lose');
  await bot.settle();
  assert.equal(runOf(c), null, '負けると すごろくは おわり');
  assert.equal(c.sugoroku.last.reason, 'lose');
  assert.equal(c.gold, goldBefore, 'お金は へらない');
  assert.ok(c.hp > 0, 'その場で 元気に');
  assert.equal(bot.s.map, 'sugoroku_hall', 'すごろく場に いる（教会へ もどされない）');
});

test('すごろく: ねむって・つなぎなおしても つづきから（とちゅうの ようすは サーバーと セーブに のこる）', async () => {
  const { world, c, open, act, bot } = await at('sugoroku_hall', 'sugoroku', 13);
  c.tmClears = 6;
  addItem(c, TICKET_ITEM, 4);
  open();
  assert.equal(act({ action: 'sgStart', board: 'b2' }).ok, true);
  for (let i = 0; i < 3; i++) {
    const p = runOf(c).pending;
    if (p?.kind === 'branch') act({ action: 'sgChoose', i: 0 });
    else if (!p) act({ action: 'sgRoll' });
  }
  const snap = JSON.parse(JSON.stringify(runOf(c)));
  // セーブして 読みなおしても のこる
  const { data } = upgradeSave(JSON.parse(JSON.stringify(world.data)));
  assert.deepEqual(data.characters[c.id].sugoroku.run, snap);
  // ログアウトして もう一度（ひとりで遊ぶサイトと おなじ）
  world.leaveWorld(bot.s);
  const bot2 = new Bot(world, 'ソラ');
  await bot2.login();
  bot2.send({ t: 'play', id: c.id });
  await bot2.settle();
  const c2 = world.data.characters[c.id];
  assert.deepEqual(JSON.parse(JSON.stringify(runOf(c2))), snap, 'つづきから');
  world.placeSession(bot2.s, 'sugoroku_hall', 7.5, 3.5, 'up', true);
  bot2.s.busy = 'script';
  const ui = openService(world, bot2.s, 'casino', 'sugoroku');
  assert.equal(ui.run.board, 'b2');
  assert.equal(ui.run.pos, snap.pos);
  assert.equal(ui.run.rolls, snap.rolls);
  // 宝部屋の 中みは クライアントに 見せない
  runOf(c2).pending = { kind: 'vault' };
  runOf(c2).vault = [{ item: 'gold_nut' }, { gold: 5 }, { item: 'herb' }];
  const ui2 = openService(world, bot2.s, 'casino', 'sugoroku');
  assert.deepEqual(ui2.run.pending, { kind: 'vault', n: 3 });
  assert.ok(!JSON.stringify(ui2).includes('gold_nut'));
});

test('すごろく場: カジノの 階だんから 行ける。人と かんばん・ルーレットの 台', () => {
  const casino = MAPS.casino;
  assert.equal(tileAt(casino, SUGOROKU_STAIRS.x, SUGOROKU_STAIRS.y), T.STAIRS_DOWN);
  assert.equal(casino.warpAt.get(SUGOROKU_STAIRS.y * casino.w + SUGOROKU_STAIRS.x).to.map, 'sugoroku_hall');
  const hall = MAPS.sugoroku_hall;
  assert.ok(hall);
  assert.equal(tileAt(hall, SUGOROKU_HALL_STAIRS.x, SUGOROKU_HALL_STAIRS.y), T.STAIRS_UP);
  const back = hall.warpAt.get(SUGOROKU_HALL_STAIRS.y * hall.w + SUGOROKU_HALL_STAIRS.x).to;
  assert.equal(back.map, 'casino');
  assert.ok(!isBlocked(casino, Math.floor(back.x), Math.floor(back.y), () => false), 'もどった 所は 歩ける');
  const arrive = casino.warpAt.get(SUGOROKU_STAIRS.y * casino.w + SUGOROKU_STAIRS.x).to;
  assert.ok(!isBlocked(hall, Math.floor(arrive.x), Math.floor(arrive.y), () => false), '着いた 所は 歩ける');
  for (const n of hall.npcs) assert.ok(SCRIPTS[n.script], n.id);
  assert.ok(casino.npcById.c_croupier && SCRIPTS.casino_roulette);
  assert.deepEqual(SCRIPTS.casino_roulette(), [['casino', 'roulette']]);
  assert.ok(hall.zoneAt(3, 3).startsWith('safe'), '魔物は 出ない');
  for (const sg of hall.signs) assert.equal(tileAt(hall, sg.x, sg.y), T.SIGN);
  for (const sg of casino.signs) assert.equal(tileAt(casino, sg.x, sg.y), T.SIGN);
  // ルーレットの 台の 前（いす）から 話せる
  const d = casino.npcById.c_croupier;
  assert.equal(tileAt(casino, Math.floor(d.x), Math.floor(d.y) + 1), T.COUNTER);
  assert.ok(!isBlocked(casino, Math.floor(d.x), Math.floor(d.y) + 2, () => false));
  // 名人の 話: 段に 合わせて
  const lines = SCRIPTS.sugoroku_master({ c: { tmClears: 4 }, name: 'ソラ' }).map((s) => s[2]).join('\n');
  assert.match(lines, /あと2こ/);
  assert.match(lines, /空のすごろく/);
});

test('すごろく: 2人が それぞれ じぶんの すごろく（家族は 同じ すごろく場で べつべつに）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(88), rateLimit: false });
  const mk = async (name) => {
    const bot = new Bot(world, name);
    await bot.login();
    await bot.createAndPlay('warrior');
    await bot.settle();
    const c = world.data.characters[bot.char.id];
    c.tmClears = 15;
    addItem(c, TICKET_ITEM, 5);
    world.placeSession(bot.s, 'sugoroku_hall', 7.5, 3.5, 'up', true);
    bot.s.busy = 'script';
    openService(world, bot.s, 'casino', 'sugoroku');
    const act = (msg) => { serviceAction(world, bot.s, { kind: 'casino', ...msg }); return bot.msgs.filter((m) => m.t === 'svcRes').pop(); };
    return { bot, c, act };
  };
  const a = await mk('パパ');
  const b = await mk('ユイ');
  assert.equal(a.act({ action: 'sgStart', board: 'b0' }).ok, true);
  assert.equal(b.act({ action: 'sgStart', board: 'b3' }).ok, true);
  a.act({ action: 'sgRoll' });
  assert.equal(runOf(a.c).board, 'b0');
  assert.equal(runOf(b.c).board, 'b3');
  assert.equal(runOf(b.c).turn, 0, 'ほかの 人の さいころで 動かない');
  assert.equal(coinsOf(a.c), 0);
});
