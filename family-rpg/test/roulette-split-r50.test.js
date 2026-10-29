// 第50回 N5: ルーレットの 数と 数の 間（スプリット 18倍）・4つの 数の 角（コーナー 9倍）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BET_KINDS, SPLIT_VALS, CORNER_VALS, betKey, parseBetKey, betName, betNums, normBets, roulettePayout,
  ROULETTE_MAX_TOTAL, ROULETTE_MAX_SPOTS,
} from '../public/js/shared/data/roulette.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { Bot } from './helpers.js';

// 表の 場所（3列×12行。1・2・3 が 1行め）
const pos = (n) => ({ row: Math.ceil(n / 3), col: ((n - 1) % 3) + 1 });

test('間: 表で となりあう 2つの 数（よこ 24・たて 33。0 は なし）', () => {
  assert.equal(BET_KINDS.split.mult, 18);
  assert.equal(SPLIT_VALS.length, 57);
  assert.equal(new Set(SPLIT_VALS).size, 57);
  for (const v of SPLIT_VALS) {
    const [a, b] = v.split('-').map(Number);
    assert.ok(a >= 1 && b <= 36 && a < b, v);
    const pa = pos(a), pb = pos(b);
    const d = Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col);
    assert.equal(d, 1, `${v} は となり`);
  }
  // となりあう 組は ぜんぶ ある
  let all = 0;
  for (let a = 1; a <= 36; a++) for (let b = a + 1; b <= 36; b++) {
    const pa = pos(a), pb = pos(b);
    if (Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col) === 1) { all++; assert.ok(SPLIT_VALS.includes(`${a}-${b}`), `${a}-${b}`); }
  }
  assert.equal(all, 57);
  // 3 と 4（行の はしと つぎの 行の はし）は となりではない
  assert.ok(!SPLIT_VALS.includes('3-4'));
});

test('角: 2×2 の 4つの 数（22こ）', () => {
  assert.equal(BET_KINDS.corner.mult, 9);
  assert.equal(CORNER_VALS.length, 22);
  for (const v of CORNER_VALS) {
    const ns = v.split('-').map(Number);
    assert.equal(ns.length, 4);
    const ps = ns.map(pos);
    const rows = new Set(ps.map((p) => p.row)), cols = new Set(ps.map((p) => p.col));
    assert.equal(rows.size, 2, v);
    assert.equal(cols.size, 2, v);
    assert.equal(Math.abs([...rows][0] - [...rows][1]), 1, v);
    assert.equal(Math.abs([...cols][0] - [...cols][1]), 1, v);
  }
  assert.ok(CORNER_VALS.includes('1-2-4-5') && CORNER_VALS.includes('32-33-35-36'));
  assert.ok(!CORNER_VALS.includes('3-4-6-7'));
});

test('間・角の 名前・キー・数', () => {
  assert.equal(betKey('split', '17-20'), 'split:17-20');
  assert.deepEqual(parseBetKey('split:17-20'), { k: 'split', v: '17-20' });
  assert.deepEqual(parseBetKey('corner:13-14-16-17'), { k: 'corner', v: '13-14-16-17' });
  assert.equal(parseBetKey('split:17-21'), null);
  assert.equal(parseBetKey('split:3-4'), null);
  assert.equal(parseBetKey('corner:1-2'), null);
  assert.deepEqual(parseBetKey('num:17'), { k: 'num', v: 17 });
  assert.equal(betName('split', '17-20'), '17・20');
  assert.deepEqual(betNums('corner', '1-2-4-5'), [1, 2, 4, 5]);
  assert.deepEqual(betNums('num', 7), [7]);
  assert.deepEqual(betNums('red', null), []);
});

test('間・角の もどり: 当たりの 数だけ 当たる・0 は はずれ', () => {
  for (const v of SPLIT_VALS) {
    const ns = v.split('-').map(Number);
    for (let n = 0; n <= 36; n++) {
      const r = roulettePayout({ [betKey('split', v)]: 10 }, n);
      assert.equal(r.win, ns.includes(n) ? 180 : 0, `${v} に ${n}`);
      assert.deepEqual(r.hits, ns.includes(n) ? [`split:${v}`] : []);
    }
  }
  for (const v of CORNER_VALS) {
    const ns = v.split('-').map(Number);
    for (let n = 0; n <= 36; n++) assert.equal(roulettePayout({ [betKey('corner', v)]: 10 }, n).win, ns.includes(n) ? 90 : 0, `${v} に ${n}`);
  }
  // いっしょに かける
  const nb = normBets([{ k: 'num', v: 17, c: 10 }, { k: 'split', v: '17-20', c: 10 }, { k: 'corner', v: '13-14-16-17', c: 10 }, { k: 'split', v: '8-9', c: 5 }, { k: 'black', c: 1 }]);
  assert.equal(nb.total, 36);
  const r = roulettePayout(nb.bets, 17);
  assert.equal(r.win, 360 + 180 + 90 + 2);
  assert.deepEqual(r.hits.sort(), ['black', 'corner:13-14-16-17', 'num:17', 'split:17-20']);
});

test('どの かけ方も もどりは 36/37', () => {
  for (const [k, kind] of Object.entries(BET_KINDS)) {
    for (const v of kind.vals || [null]) {
      let ret = 0;
      for (let n = 0; n <= 36; n++) ret += roulettePayout({ [betKey(k, v)]: 1 }, n).win;
      assert.ok(Math.abs(ret / 37 - 36 / 37) < 1e-9, `${k}:${v} もどり ${ret}/37`);
    }
  }
});

test('normBets: 間・角の だめな かけと かぎり', () => {
  for (const bad of [
    [{ k: 'split', v: '3-4', c: 1 }], [{ k: 'split', v: '0-1', c: 1 }], [{ k: 'split', v: '20-17', c: 1 }], [{ k: 'split', v: 17, c: 1 }],
    [{ k: 'split', c: 1 }], [{ k: 'corner', v: '1-2-4', c: 1 }], [{ k: 'corner', v: '3-4-6-7', c: 1 }], [{ k: 'corner', v: 1, c: 1 }],
    [{ k: 'split', v: '1-2', c: 0 }], [{ k: 'split', v: '1-2', c: ROULETTE_MAX_TOTAL + 1 }],
    [{ k: 'split', v: '1-2', c: ROULETTE_MAX_TOTAL }, { k: 'corner', v: '1-2-4-5', c: 1 }],
  ]) assert.equal(normBets(bad), null, JSON.stringify(bad));
  // 40か所まで
  const many = SPLIT_VALS.slice(0, ROULETTE_MAX_SPOTS).map((v) => ({ k: 'split', v, c: 1 }));
  assert.equal(normBets(many).total, ROULETTE_MAX_SPOTS);
  assert.equal(normBets([...many, { k: 'corner', v: CORNER_VALS[0], c: 1 }]), null, '41か所は だめ');
  // おなじ 所は まとめる
  const nb = normBets([{ k: 'corner', v: '1-2-4-5', c: 3 }, { k: 'corner', v: '1-2-4-5', c: 4 }]);
  assert.deepEqual(nb.bets, { 'corner:1-2-4-5': 7 });
});

test('サーバー: 間・角に かけて 回せる（コインの 計算・あたった 場所）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(50), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c2_ship = true;
  world.placeSession(bot.s, 'casino', 14, 16.2, 'up', true);
  bot.s.busy = 'script';
  openService(world, bot.s, 'casino', 'roulette');
  const act = (msg) => {
    serviceAction(world, bot.s, { kind: 'casino', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  c.coins = 10000;
  let hitSplit = 0, hitCorner = 0;
  for (let i = 0; i < 300; i++) {
    const before = c.coins;
    const bets = [{ k: 'split', v: SPLIT_VALS[i % SPLIT_VALS.length], c: 2 }, { k: 'corner', v: CORNER_VALS[i % CORNER_VALS.length], c: 3 }];
    const r = act({ action: 'roulette', bets });
    assert.equal(r.ok, true, r.text);
    const want = roulettePayout(normBets(bets).bets, r.n);
    assert.equal(r.win, want.win);
    assert.deepEqual(r.hits, want.hits);
    assert.equal(c.coins, before - 5 + want.win);
    if (r.hits.some((h) => h.startsWith('split:'))) hitSplit++;
    if (r.hits.some((h) => h.startsWith('corner:'))) hitCorner++;
  }
  assert.ok(hitSplit > 3 && hitCorner > 10, `間 ${hitSplit}回・角 ${hitCorner}回`);
  assert.equal(act({ action: 'roulette', bets: [{ k: 'split', v: '3-4', c: 1 }] }).ok, false, 'となりでない 間は だめ');
});
