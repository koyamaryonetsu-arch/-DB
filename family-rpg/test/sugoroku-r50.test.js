// 第50回 D2: すごろくを 豪華に（あたらしい マス・よい ごほうび・種は もう 出ない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { itemCount, addItem } from '../public/js/shared/stats.js';
import { starsOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import {
  BOARDS, BOARD_BY_ID, BOARDS_SRC, SQ, SQ_TYPES, TIER_FEATURES, MOVE_TYPES, WHEEL, NO_SEED, SALE_RATE, TICKET_ITEM, nextOptions, squareText,
} from '../public/js/shared/data/sugoroku.js';
import { ITEMS_SUGOROKU_R50 } from '../public/js/shared/data/items-sugoroku-r50.js';
import { runOf, applySugorokuBattle } from '../public/js/shared/world/sugoroku.js';
import { SUGOROKU_HALL_STAIRS } from '../public/js/shared/maps/casino.js';
import { Bot } from './helpers.js';

const NEW_TYPES = ['bonus', 'wheel', 'hunt', 'merchant', 'gift', 'cheer', 'hole', 'ladder'];

// すごろく場で まどを 開いた 人
async function at(seed = 5) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c2_ship = true;
  c.tmClears = 15;
  c.gold = 500000;
  world.placeSession(bot.s, 'sugoroku_hall', SUGOROKU_HALL_STAIRS.x + 0.5, SUGOROKU_HALL_STAIRS.y - 0.8, 'up', true);
  bot.s.busy = 'script';
  const open = () => openService(world, bot.s, 'casino', 'sugoroku');
  const act = (msg) => {
    serviceAction(world, bot.s, { kind: 'casino', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  open();
  return { world, bot, c, open, act };
}

// 盤を はじめて、key の マスの 1つ前から「数を選ぶさいころ」で 1マス
function starter(p, boardId) {
  const b = BOARD_BY_ID[boardId];
  addItem(p.c, TICKET_ITEM, b.tickets);
  p.c.sugoroku = { clears: {} };
  assert.equal(p.act({ action: 'sgStart', board: boardId }).ok, true);
  const dice0 = b.dice;
  return (key) => {
    const run = runOf(p.c);
    const to = b.byKey[key];
    const from = b.sq.find((s) => s.next.length === 1 && s.next[0] === to);
    assert.ok(from, `${boardId} ${key} の 1つ前`);
    run.pos = from.i;
    run.pending = null;
    run.rolls = 5;
    run.dice.pick = 1;
    b.dice = ['pick'];
    const r = p.act({ action: 'sgRoll', die: 'pick', n: 1 });
    b.dice = dice0;
    if (!dice0) delete b.dice;
    return r;
  };
}
const keyOf = (b, t) => b.sq.find((s) => s.t === t && b.sq.some((x) => x.next.length === 1 && x.next[0] === s.i))?.key;

// ───────────── 盤の データ ─────────────
test('すごろく r50: 種（seed_〜・星の木の実・黄金の木の実）は すごろくの どこにも ない', () => {
  assert.ok(NO_SEED.includes('seed_str') && NO_SEED.includes('gold_nut') && NO_SEED.includes('star_nut'));
  const json = JSON.stringify(BOARDS_SRC);
  for (const id of NO_SEED) assert.ok(!json.includes(`"${id}"`), `盤の データに ${id}`);
  assert.ok(!/"seed_/.test(json), '盤の データに seed_');
  // サーバーの しょりにも 書いていない（宝部屋の 大当たりなど）
  const src = readFileSync(new URL('../public/js/shared/world/sugoroku.js', import.meta.url), 'utf8');
  for (const id of NO_SEED) assert.ok(!src.includes(`'${id}'`), `world/sugoroku.js に ${id}`);
  // 種の かわりの 品が ある（進化の石・めずらしい 素材・すごろく券）
  const all = new Set(BOARDS.flatMap((b) => [...b.items, ...(b.chest || []), ...(b.gifts || []), ...(b.sale || []), ...(b.goal.extra || [])].map(([id]) => id)));
  for (const id of ['fire_stone', 'thunder_stone', 'star_iron', 'sugoroku_ticket', 'dragon_scale']) assert.ok(all.has(id), id);
});

test('すごろく r50: あたらしい マス（8しゅるい）を 5つの 盤に くばった。段ごとの しかけ', () => {
  for (const t of NEW_TYPES) assert.ok(SQ_TYPES.includes(t), t);
  assert.equal(new Set(Object.keys(SQ)).size, SQ_TYPES.length, 'マスの 文字は 1つずつ');
  for (const t of ['hole', 'ladder']) assert.ok(MOVE_TYPES.includes(t));
  const has = (b, t) => b.sq.some((s) => s.t === t);
  for (const b of BOARDS) {
    const kinds = NEW_TYPES.filter((t) => has(b, t));
    assert.ok(kinds.length >= 3, `${b.id}: あたらしい マス ${kinds}`);
    for (const s of b.sq) assert.ok(squareText(b, s), `${b.id} ${s.t} の 説明`);
  }
  // 段1から ルーレット・宝さがし、段2から すごろく商人、段3から 落とし穴と 地下の 道
  for (const b of BOARDS) {
    for (let t = 0; t <= b.tier; t++) for (const f of TIER_FEATURES[t]) if (NEW_TYPES.includes(f)) assert.ok(has(b, f), `${b.id} に ${f}`);
  }
  assert.ok(!has(BOARDS[0], 'wheel') && !has(BOARDS[1], 'merchant') && !has(BOARDS[2], 'hole'));
  // 地下の 道: 落とし穴 → 地下の 道の はじめ（under）→ … → はしご → 地上（under でない）
  for (const b of BOARDS.filter((x) => has(x, 'hole'))) {
    for (const h of b.sq.filter((s) => s.t === 'hole')) {
      const u = b.sq[h.to];
      assert.ok(u?.under, `${b.id} ${h.key} → 地下`);
      let i = u.i;
      for (let k = 0; k < 30 && b.sq[i].t !== 'ladder'; k++) i = b.sq[i].next[0];
      const lad = b.sq[i];
      assert.equal(lad.t, 'ladder');
      assert.ok(lad.under && !b.sq[lad.to].under, 'はしごで 地上へ');
      assert.ok(!MOVE_TYPES.includes(b.sq[lad.to].t) && b.sq[lad.to].t !== 'goal');
      // 地下は 盤の いちばん 下（地上の マスより 下の 行）
      const groundMax = Math.max(...b.sq.filter((s) => !s.under).map((s) => s.y));
      assert.ok(b.sq.filter((s) => s.under).every((s) => s.y > groundMax + 1));
    }
    // 落とし穴・はしごは 地上に ある ボスを とばさない（casino-r37 の テストでも しらべる）
    for (const s of b.sq.filter((x) => x.t === 'boss')) assert.ok(!s.under);
  }
  // ルーレットの わく
  assert.equal(WHEEL.length, 8);
  for (const w of WHEEL) assert.ok(w.t && w.g && w.w > 0);
});

test('すごろく r50: どの 盤も さいころの 回数で ゴールに とどく（ふつうの 目で）', () => {
  for (const b of BOARDS) {
    for (const sw of [0, 1]) {
      const dist = new Map([[b.start, 0]]);
      const q = [b.start];
      while (q.length) {
        const i = q.shift();
        for (const n of nextOptions(b, i, sw)) if (!dist.has(n)) { dist.set(n, dist.get(i) + 1); q.push(n); }
      }
      const d = dist.get(b.goalAt);
      assert.ok(Number.isInteger(d), `${b.id} sw=${sw}: ゴールへ 行けない`);
      assert.ok(d <= b.rolls * 3.5, `${b.id} sw=${sw}: ゴールまで ${d}マス（さいころ ${b.rolls}回）`);
    }
    // まっすぐ（a の 道）でも 6が 出つづければ とどく
    assert.ok(b.lanes[0].dirs.length <= b.rolls * 6, b.id);
  }
});

test('すごろく r50: ごほうびの 品は ぜんぶ ある。すごろくだけの 装備は 段ごとに 強く、ゴールの 景品は よくなった', () => {
  for (const b of BOARDS) {
    const lists = [b.items, b.chest || [], b.shop || [], b.sale || [], b.gifts || [], b.vault || [], b.goal.pool, b.goal.extra || [], b.goal.firstBonus || [], b.goal.stars?.pool || []];
    for (const [id, w] of lists.flat()) {
      assert.ok(ITEMS[id], `${b.id} ${id}`);
      assert.ok(w > 0, `${b.id} ${id} の おもさ・数・ねだん`);
    }
    assert.ok(ITEMS[b.goal.first] && (!b.goal.stars?.extra || ITEMS[b.goal.stars.extra]));
    for (const sp of b.giftMons || []) assert.ok(MONSTERS[sp], `${b.id} ${sp}`);
    assert.ok(b.goal.coins > 0 && b.goal.extra?.length && b.goal.firstBonus?.length, `${b.id} の ゴールの おまけ`);
    // ゴールの 景品には すごろくだけの あたらしい 装備も 入る
    assert.ok(b.goal.pool.some(([id]) => ITEMS_SUGOROKU_R50[id]), `${b.id} の ゴール`);
    if (b.tier >= 1) assert.ok((b.chest || []).some(([id]) => ITEMS_SUGOROKU_R50[id]), `${b.id} の 宝箱`);
    if (b.sale) for (const [id] of b.sale) assert.ok(ITEMS[id].type !== 'key');
  }
  // 段ごとに 3つずつ（★2・★3・★4・★5・★5）
  const want = [2, 3, 4, 5, 5];
  for (const [id, it] of Object.entries(ITEMS_SUGOROKU_R50)) {
    assert.equal(it.src, 'sugoroku');
    assert.equal(rareWhereText(id), 'すごろくでしか手に入らない');
    assert.ok(ITEM_KANA[id], `${id} の 読みがな`);
    assert.ok(it.price === 0 && it.sell > 0);
    const b = BOARDS.find((x) => x.goal.pool.some(([g]) => g === id));
    assert.ok(b, `${id} は どこかの ゴールで 出る`);
    assert.equal(starsOf(id), want[b.tier], id);
  }
  // 上の 段ほど ゴールの ゴールド・コインが 多い
  assert.ok(BOARDS.every((b, i) => !i || (b.goal.coins > BOARDS[i - 1].goal.coins && b.goal.gold > BOARDS[i - 1].goal.gold)));
});

// ───────────── サーバーの しょり ─────────────
test('すごろく r50: ボーナスチャンス → もう1回 ふれて、次の マスの ごほうびが 2倍', async () => {
  const p = await at(11);
  const step = starter(p, 'b0');
  const b = BOARD_BY_ID.b0;
  const run = runOf(p.c);
  let r = step(keyOf(b, 'bonus'));
  assert.equal(r.ok, true);
  assert.equal(runOf(p.c).rolls, 5, 'さいころを 1回 使って、1回 ふえた');
  assert.equal(r.sg.bonus, 1, 'クライアントにも 見える');
  // 次は ゴールドの マス: 2倍
  const g0 = run.gold;
  r = step('a5');
  assert.equal(b.sq[b.byKey.a5].t, 'gold');
  assert.ok(run.gold - g0 >= b.gold[0] * 2, '2倍');
  assert.match(r.ops.filter((o) => o.op === 'say').map((o) => o.text).join(), /2倍/);
  assert.equal(run.bonus, 0, '1回で おしまい');
  const g1 = run.gold;
  step('a10');
  assert.ok(run.gold - g1 <= b.gold[1], 'もう 2倍に ならない');
});

test('すごろく r50: 魔物のおみやげ・家族の応援', async () => {
  const p = await at(12);
  const step = starter(p, 'b0');
  const b = BOARD_BY_ID.b0;
  const run = runOf(p.c);
  let r = step(keyOf(b, 'gift'));
  const g = r.ops.find((o) => o.op === 'gift');
  assert.ok(g && MONSTERS[g.sp] && ITEMS[g.id], 'おみやげ');
  assert.ok(run.got[g.id] >= 1);
  assert.ok(b.giftMons.includes(g.sp));
  // 応援: ほかの キャラの 名前（いなければ すごろく場の みんな）
  const before = { rolls: 5, gold: run.gold, coins: run.coins || 0 };
  r = step(keyOf(b, 'cheer'));
  const ch = r.ops.find((o) => o.op === 'cheer');
  assert.ok(ch && ch.name);
  const said = r.ops.filter((o) => o.op === 'say').map((o) => o.text).join();
  assert.ok(run.rolls === before.rolls || run.gold > before.gold || (run.coins || 0) > before.coins || /回復/.test(said), said);
  p.world.data.characters.zz = { id: 'zz', name: 'ママ' };
  const names = new Set();
  for (let i = 0; i < 6; i++) names.add(step(keyOf(b, 'cheer')).ops.find((o) => o.op === 'cheer').name);
  assert.ok(names.has('ママ'), [...names].join());
  assert.ok(![...names].includes(p.c.name), '自分の 名前は 出ない');
});

test('すごろく r50: ルーレット・宝さがし（中みは 開けるまで ひみつ）', async () => {
  const p = await at(13);
  const step = starter(p, 'b1');
  const b = BOARD_BY_ID.b1;
  const run = runOf(p.c);
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const r = step(keyOf(b, 'wheel'));
    const w = r.ops.find((o) => o.op === 'wheel');
    assert.ok(w && WHEEL[w.pick], 'ルーレット');
    seen.add(WHEEL[w.pick].k);
    if (runOf(p.c)?.pending?.kind === 'battle') applySugorokuBattle(p.world, p.bot.s, p.c, 'flee');
    if (!runOf(p.c)) break;
  }
  assert.ok(seen.size >= 4, [...seen].join());
  // 宝さがし
  let hits = 0, empty = 0;
  for (let i = 0; i < 12; i++) {
    const r = step(keyOf(b, 'hunt'));
    assert.equal(r.sg.pending.kind, 'hunt');
    assert.deepEqual(r.sg.pending, { kind: 'hunt', n: 3 }, '中みは 見せない');
    assert.equal(p.act({ action: 'sgPick', i: 5 }).ok, false);
    const got = p.act({ action: 'sgPick', i: i % 3 });
    assert.equal(got.ok, true);
    const h = got.ops.find((o) => o.op === 'hunt');
    assert.equal(h.boxes.length, 3);
    assert.ok(h.boxes.includes('からっぽ'));
    if (h.hit) hits++; else empty++;
    assert.equal(runOf(p.c).pending, null);
    assert.equal(run.hunt, null);
  }
  assert.ok(hits > 0 && empty > 0, `${hits} ${empty}`);
});

test('すごろく r50: すごろく商人は 半額。買える', async () => {
  const p = await at(14);
  const step = starter(p, 'b2');
  const b = BOARD_BY_ID.b2;
  const r = step(keyOf(b, 'merchant'));
  const pend = r.sg.pending;
  assert.equal(pend.kind, 'shop');
  assert.equal(pend.sale, true);
  assert.equal(pend.items.length, 3);
  for (const it of pend.items) {
    const full = b.sale.find(([id]) => id === it.id)[1];
    assert.equal(it.price, Math.round(full * SALE_RATE));
    assert.equal(it.was, full);
  }
  const gold = p.c.gold;
  const id = pend.items[0].id;
  const n0 = itemCount(p.c, id);
  assert.equal(p.act({ action: 'sgShop', i: 0 }).ok, true);
  assert.equal(itemCount(p.c, id), n0 + 1);
  assert.equal(p.c.gold, gold - pend.items[0].price);
  assert.equal(p.act({ action: 'sgShop', i: -1 }).ok, true);
  assert.equal(runOf(p.c).pending, null);
});

test('すごろく r50: 落とし穴 → 地下の 道 → はしごで 地上へ', async () => {
  for (const id of ['b3', 'b4']) {
    const p = await at(15);
    const step = starter(p, id);
    const b = BOARD_BY_ID[id];
    const hole = b.sq.find((s) => s.t === 'hole');
    let r = step(hole.key);
    const run = runOf(p.c);
    assert.equal(run.pos, hole.to, `${id}: 地下へ 落ちる`);
    assert.ok(b.sq[run.pos].under);
    assert.ok(r.ops.some((o) => o.op === 'jump' && o.how === 'fall'));
    // はしごの 1つ前から 1マス → 地上へ
    const lad = b.sq.find((s) => s.t === 'ladder');
    r = step(lad.key);
    assert.equal(runOf(p.c).pos, lad.to, `${id}: はしごで 地上へ`);
    assert.ok(r.ops.some((o) => o.op === 'jump' && o.how === 'climb'));
    // はしごは 行き止まり: 大きな 目でも はしごで 止まって のぼる
    const before = b.sq.find((s) => s.next[0] === lad.i);
    run.pos = before.i;
    run.rolls = 5;
    run.pending = null;
    p.act({ action: 'sgRoll', die: 'normal' });
    const now = runOf(p.c);
    if (now && !now.pending) assert.ok(!b.sq[now.pos].under, `${id}: 地下に とり のこされない`);
  }
});

test('すごろく r50: ゴール！ はじめては とくべつな おまけ。景品の ならび（reveal）', async () => {
  const p = await at(16);
  for (const b of BOARDS) {
    const step = starter(p, b.id);
    const before = Object.fromEntries((b.goal.firstBonus || []).map(([id]) => [id, itemCount(p.c, id)]));
    const coins0 = p.c.coins || 0;
    const r = step(b.sq[b.goalAt].key);
    const over = r.ops.find((o) => o.op === 'over');
    assert.equal(over.reason, 'goal', b.id);
    assert.equal(over.first, true);
    assert.ok(itemCount(p.c, b.goal.first) >= 1);
    for (const [id, k] of b.goal.firstBonus) assert.ok(itemCount(p.c, id) >= Math.min(99, before[id] + k) - (id === TICKET_ITEM ? 99 : 0), `${b.id} ${id}`);
    assert.ok((p.c.coins || 0) > coins0, 'コインも');
    assert.ok(over.reveal.some((x) => x.tag === 'first'));
    assert.ok(over.reveal.some((x) => x.tag === 'big' && b.goal.pool.some(([id]) => id === x.id)));
    assert.ok(over.reveal.some((x) => x.tag === 'extra'));
    assert.ok(over.reveal[0].gold === b.goal.gold);
    // 2回目は ふつう
    p.c.sugoroku.clears[b.id] = 1;
    const step2 = starter(p, b.id);
    p.c.sugoroku.clears[b.id] = 1;
    const r2 = step2(b.sq[b.goalAt].key);
    const over2 = r2.ops.find((o) => o.op === 'over');
    assert.equal(over2.first, false);
    assert.ok(!over2.reveal.some((x) => x.tag === 'first'));
    for (const x of [...over.reveal, ...over2.reveal]) if (x.id) assert.ok(!NO_SEED.includes(x.id));
  }
});

test('すごろく r50: でたらめに たくさん 遊んでも 種は 手に入らない。宝部屋の 大当たりも 種でない', async () => {
  const p = await at(4343);
  const rng = makeRng(7);
  const got = new Set();
  for (const b of BOARDS) {
    for (let k = 0; k < 25; k++) {
      addItem(p.c, TICKET_ITEM, b.tickets);
      p.open();
      assert.equal(p.act({ action: 'sgStart', board: b.id }).ok, true);
      for (let n = 0; n < 300 && runOf(p.c); n++) {
        const run = runOf(p.c);
        const pend = run.pending;
        let r;
        if (!pend) {
          const dice = Object.entries(run.dice).filter(([, v]) => v > 0).map(([d]) => d);
          const die = dice.length && rng.chance(0.5) ? dice[0] : 'normal';
          r = p.act({ action: 'sgRoll', die, n: die === 'gold' ? rng.int(1, 12) : rng.int(1, 6) });
        } else if (pend.kind === 'branch' || pend.kind === 'dragon') r = p.act({ action: 'sgChoose', i: rng.int(0, pend.options.length - 1) });
        else if (pend.kind === 'vault' || pend.kind === 'hunt') {
          for (const x of run.vault || []) if (x.item) assert.ok(!NO_SEED.includes(x.item), x.item);
          r = p.act({ action: 'sgPick', i: rng.int(0, 2) });
        } else if (pend.kind === 'shop') {
          const it = pend.items[0];
          r = p.act({ action: 'sgShop', i: it && p.c.gold >= it.price && itemCount(p.c, it.id) < 99 ? 0 : -1 });
        }
        else if (pend.kind === 'battle') {
          applySugorokuBattle(p.world, p.bot.s, p.c, rng.chance(0.85) ? 'win' : 'flee');
          continue;
        }
        assert.equal(r.ok, true, `${b.id}: ${pend?.kind} ${r.text}`);
        assert.ok(r.ops.length < 60);
        for (const o of r.ops) if (o.op === 'over') for (const [id] of o.got) got.add(id);
      }
      assert.equal(runOf(p.c), null, `${b.id}: おわらない`);
    }
  }
  for (const id of NO_SEED) assert.ok(!got.has(id), `${id} が 手に入った`);
  assert.ok([...got].some((id) => ITEMS_SUGOROKU_R50[id] || ['star_iron', 'fire_stone', 'water_stone', 'thunder_stone', 'moon_stone'].includes(id)), 'よい 品も 出る');
});
