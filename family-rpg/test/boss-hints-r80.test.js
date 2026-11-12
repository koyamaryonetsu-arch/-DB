// 第80回 E班: ボスに 負けた 時の ヒント（docs/plan-r80-hints.md。ネタバレ注意）
//   対象の ボスに 3つずつ・長さ・負けるたびに 次の ヒント・勝ったら 消える・家族で 負けた 時・ボス以外は 出ない・
//   やり直しの 行き先が 歩ける マス・引っこしコードが 長く ならない・ほかの 表を まぜられる・しおり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_HINTS, BOSS_RETRY, BOSS_HINT_WHO, mergeBossHints, bossHintAt, bossHintsSeen } from '../public/js/shared/data/boss-hints.js';
import { retrySpot, retryTrigger, hintBattle, bossLossOf } from '../public/js/shared/world/boss-hints.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FIXED_PAST } from '../public/js/shared/data/encounters-past.js';
import { FIXED_ROAD } from '../public/js/shared/data/encounters-road.js';
import { FIXED_TOKEI } from '../public/js/shared/data/encounters-tokei.js';
import { FIXED_TOKEI6 } from '../public/js/shared/data/encounters-tokei6.js';
import { FIXED_C7 } from '../public/js/shared/data/encounters-c7.js';
import { FIXED_C7S } from '../public/js/shared/data/encounters-c7s.js';
import { FIXED_C7I } from '../public/js/shared/data/encounters-c7i.js';
import { FIXED_C8A } from '../public/js/shared/data/encounters-c8a.js';
import { FIXED_C8B } from '../public/js/shared/data/encounters-c8b.js';
import { FIXED_C8C } from '../public/js/shared/data/encounters-c8c.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MAPS, canStand, isBlocked } from '../public/js/shared/maps/index.js';
import { runSteps, ScriptRun } from '../public/js/shared/world/scripts.js';
import { exportCode } from '../public/js/shared/world/transfer.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

// 第6〜8章 第3幕の ボス（boss: true・負けると 止まる 戦い）
const PART2 = { ...FIXED_PAST, ...FIXED_ROAD, ...FIXED_TOKEI, ...FIXED_TOKEI6, ...FIXED_C7, ...FIXED_C7S, ...FIXED_C7I, ...FIXED_C8A, ...FIXED_C8B, ...FIXED_C8C };
const TARGETS = Object.keys(PART2).filter((id) => PART2[id].boss && !PART2[id].loseOk);

test('対象: 第6〜8章 第3幕の ボス ぜんぶ（18）に 3つずつ。40文字 くらいまで・空白なし・ボスの 名前は 書かない', () => {
  assert.equal(TARGETS.length, 18);
  for (const id of TARGETS) {
    const h = BOSS_HINTS[id];
    assert.ok(Array.isArray(h) && h.length === 3, id);
    for (const s of h) {
      assert.ok(typeof s === 'string' && s.length >= 10 && s.length <= 45, `${id}: ${s.length}`);
      assert.ok(!/[ 　]/.test(s), `${id}: 空白`);
      // ボス（group の はじめ）の 名前は 書かない
      const name = MONSTERS[FIXED_ENCOUNTERS[id].group[0][0]]?.name || '';
      assert.ok(name && !s.includes(name), `${id}: 名前 ${name}`);
    }
    assert.notEqual(h[0], h[1]);
    assert.notEqual(h[1], h[2]);
  }
  // 表の 戦いは どれも ボスの きまった 戦い
  for (const id of Object.keys(BOSS_HINTS)) assert.ok(FIXED_ENCOUNTERS[id]?.boss && !FIXED_ENCOUNTERS[id].loseOk, id);
});

test('負けるたびに 次の ヒント（3回より あとは 3つ目）', () => {
  const h = BOSS_HINTS.c8_bowser;
  assert.equal(bossHintAt('c8_bowser', 0), '');
  assert.equal(bossHintAt('c8_bowser', 1), h[0]);
  assert.equal(bossHintAt('c8_bowser', 2), h[1]);
  assert.equal(bossHintAt('c8_bowser', 3), h[2]);
  assert.equal(bossHintAt('c8_bowser', 7), h[2]);
  assert.equal(bossHintAt('treant', 1), '');
});

test('ボス以外・負けても よい 戦い・闘技場・ヒントの ない ボスには 出さない', () => {
  assert.ok(hintBattle({ boss: true, fixed: 'c8_bowser' }));
  assert.ok(!hintBattle({ boss: false, fixed: 'c8_bowser' }));
  assert.ok(!hintBattle({ boss: true, fixed: 'c8_bowser', loseOk: true }));
  assert.ok(!hintBattle({ boss: true }));
  for (const id of ['ar1_3', 'rion_spar1', 'toki_phantom', 'treant', 'solitus', 'job_trial_1']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(!hintBattle({ boss: e.boss, fixed: id, loseOk: e.loseOk, solo: e.solo }), id);
  }
});

// その マスまで 歩けるか（かべだけ 見る）
function walkTo(map, x, y, tr) {
  const seen = new Set([y * map.w + x]);
  const q = [[x, y]];
  for (let h = 0; h < q.length; h++) {
    const [cx, cy] = q[h];
    if (cx >= tr.x && cy >= tr.y && cx < tr.x + tr.w && cy < tr.y + tr.h) return true;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      const k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(k) || isBlocked(map, nx, ny, () => false)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

test('もう一度いどむ 行き先: ボスの 台本が 始まる マスの 手前（ボスと 反対がわ）で、立てて、マスまで 歩ける', () => {
  for (const id of TARGETS) {
    assert.ok(BOSS_RETRY[id], id);
    const t = retryTrigger(id, null);
    assert.ok(t, `${id}: マスが ある`);
    const sp = retrySpot(id, t.mapId);
    assert.ok(sp, `${id}: 行き先`);
    const map = MAPS[sp.map];
    assert.ok(canStand(map, sp.x, sp.y, () => false), `${id}: 立てる`);
    const tx = Math.floor(sp.x), ty = Math.floor(sp.y), tr = t.tr;
    assert.ok(!(tx >= tr.x && ty >= tr.y && tx < tr.x + tr.w && ty < tr.y + tr.h), `${id}: マスの 外`);
    assert.ok(walkTo(map, tx, ty, tr), `${id}: マスまで 歩ける`);
    const npc = (map.npcs || []).find((n) => n.script === t.sc);
    if (npc) assert.ok((npc.y < tr.y) === (ty >= tr.y + tr.h), `${id}: ボスと 反対がわ`);
  }
  // 行き先が 分からない 戦いは null（「あとにする」だけ）
  assert.equal(retrySpot('treant', 'overworld'), null);
});

test('ほかの 表を まぜられる（第4幕は B班の data/boss-hints-c8r.js から。ない 時は そのまま）', () => {
  const id = 'c8_bowser';
  const before = BOSS_HINTS[id];
  assert.ok(!BOSS_HINTS.test_r80_boss);
  mergeBossHints({ test_r80_boss: ['あ1', 'い2', 'う3', 'え4'] }, { retry: { test_r80_boss: 'c8c_boss_event' }, who: { test_r80_boss: 'リオン' } });
  assert.deepEqual(BOSS_HINTS.test_r80_boss, ['あ1', 'い2', 'う3']);
  assert.equal(bossHintAt('test_r80_boss', 2), 'い2');
  assert.equal(BOSS_RETRY.test_r80_boss, 'c8c_boss_event');
  assert.equal(BOSS_HINT_WHO.test_r80_boss, 'リオン');
  assert.ok(retrySpot('test_r80_boss', 'c8c_fort_8f'));
  delete BOSS_HINTS.test_r80_boss;
  delete BOSS_RETRY.test_r80_boss;
  delete BOSS_HINT_WHO.test_r80_boss;
  mergeBossHints();
  assert.equal(BOSS_HINTS[id], before);
});

test('引っこしコードが 長く ならない（ふだんは 項目が ない・負けて いる 間だけ 少し）', () => {
  const c = { id: 'k1', name: 'ケン', level: 90, job: 'hero', flags: { c8_hades: true }, items: [], gold: 100 };
  const plain = exportCode(c, 1794488401253).length;
  const lost = exportCode({ ...c, bossLoss: { c8_bowser: 3 } }, 1794488401253).length;
  assert.ok(lost - plain < 60, `${lost - plain}`);
});

test('冒険のしおり: 物語の だんに 今までに 出た ヒント（勝つと 消える）', () => {
  const c = { flags: { c8_start: true, c8_hades: true }, bossLoss: { c8_bowser: 2 } };
  const st = shioriOf(c).story;
  assert.deepEqual(st.bossHints, [{ id: 'c8_bowser', n: 2, hints: BOSS_HINTS.c8_bowser.slice(0, 2) }]);
  assert.deepEqual(bossHintsSeen({ bossLoss: { c8_bowser: 9 } })[0].hints, BOSS_HINTS.c8_bowser);
  assert.deepEqual(shioriOf({ flags: {} }).story.bossHints, []);
  assert.deepEqual(bossHintsSeen({ bossLoss: { treant: 2 } }), []);
});

test('文字のきまり（使える 漢字・空白）と gameFiles', () => {
  const files = gameFiles();
  for (const f of ['public/js/shared/data/boss-hints.js', 'public/js/shared/world/boss-hints.js']) {
    const full = files.find((y) => y.endsWith(f));
    assert.ok(full, f);
    assert.deepEqual(checkFile(full), [], f);
  }
});

// ───── 遊びの 流れ（ひとりモードと 同じ GameWorld）─────
const sayTexts = (bot, from) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say'));
const choices = (bot, from) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'choice'));

// 台本が 戦いを 始めるまで まつ
async function battleOf(world) {
  for (let i = 0; i < 200 && !world.battles.size; i++) await tickN(world, 1);
  return [...world.battles.values()].pop();
}

async function fight(world, bots, id, outcome) {
  const lead = bots[0];
  runSteps(world, lead.s, [['battle', id]]);
  const ctx = await battleOf(world);
  assert.ok(ctx, '戦いが 始まった');
  for (const b of bots.slice(1)) if (!ctx.sids.includes(b.s.id)) assert.fail('家族も いっしょ');
  if (outcome === 'lose') for (const a of ctx.battle.allies) { a.hp = 0; a.alive = false; }
  else for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 6; i++) for (const b of bots) await b.settle(4000);
}

function placeNearBoss(world, bot, id) {
  const sp = retrySpot(id, retryTrigger(id, null).mapId);
  world.placeSession(bot.s, sp.map, sp.x, sp.y, 'up', true);
  return sp;
}

test('ひとり: 負ける → ヒント1（トキネ）と「もう一度いどむ」→ ボスの 手前へ → 負ける → ヒント2 → 勝つ → 数が 消える。お金の 決まりは かわらない', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(80), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  const id = 'c8_bowser';
  const sp = placeNearBoss(world, ken, id);
  await ken.settle();
  ken.s.char.gold = 1000;
  ken.choice = 0;
  let from = ken.msgs.length;
  await fight(world, [ken], id, 'lose');
  assert.equal(bossLossOf(ken.s.char, id), 1);
  assert.equal(ken.s.char.gold, 500, '全滅の お金の 決まりは そのまま');
  let says = sayTexts(ken, from);
  assert.ok(says.some((s) => s[1] === 'トキネ' && s[2] === BOSS_HINTS[id][0]), 'ヒント1');
  assert.equal(choices(ken, from).length, 1);
  assert.deepEqual(choices(ken, from)[0][2], ['もう一度いどむ', 'あとにする']);
  // もう一度いどむ → ボスの 手前
  assert.equal(ken.s.map, sp.map);
  assert.ok(Math.hypot(ken.s.x - sp.x, ken.s.y - sp.y) < 0.01);
  // もう 1回 負ける → ヒント2（あとにする → その場の まま）
  ken.choice = 1;
  from = ken.msgs.length;
  await fight(world, [ken], id, 'lose');
  assert.equal(bossLossOf(ken.s.char, id), 2);
  says = sayTexts(ken, from);
  assert.ok(says.some((s) => s[2] === BOSS_HINTS[id][1]), 'ヒント2');
  assert.ok(!says.some((s) => s[2] === BOSS_HINTS[id][0]));
  assert.notEqual(ken.s.map, sp.map, 'あとにする … いのりの場所の まま');
  assert.equal(shioriOf(ken.s.char).story.bossHints[0].hints.length, 2);
  // 勝つ → 数が 消える（項目も ない）
  placeNearBoss(world, ken, id);
  await ken.settle();
  from = ken.msgs.length;
  await fight(world, [ken], id, 'win');
  assert.equal(ken.s.char.bossLoss, undefined);
  assert.ok(!sayTexts(ken, from).some((s) => BOSS_HINTS[id].includes(s[2])));
});

test('家族: いっしょに 負けると 2人とも 数える・2人とも ヒントが 出る・えらぶのは リーダー・もう一度は 2人とも', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(81), rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login();
  await papa.createAndPlay('warrior');
  await yui.login();
  await yui.createAndPlay('priest');
  await papa.settle();
  await yui.settle();
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  const id = 'c7_shadow';
  const sp = placeNearBoss(world, papa, id);
  world.placeSession(yui.s, sp.map, sp.x + 1, sp.y, 'up', true);
  await papa.settle();
  await yui.settle();
  papa.choice = 0;
  const fp = papa.msgs.length, fy = yui.msgs.length;
  const lead = papa;
  // 物語の 台本と 同じく、家族も 台本に 入る
  new ScriptRun(world, papa.s, [papa.s, yui.s], [['battle', id]], {}).start();
  const ctx = await battleOf(world);
  const sids = ctx.sids;
  const both = sids.includes(yui.s.id);
  for (const a of ctx.battle.allies) { a.hp = 0; a.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 6; i++) { await papa.settle(4000); await yui.settle(4000); }
  assert.equal(bossLossOf(papa.s.char, id), 1);
  assert.ok(sayTexts(papa, fp).some((s) => s[2] === BOSS_HINTS[id][0]));
  assert.equal(choices(papa, fp).length, 1, 'リーダーが えらぶ');
  assert.equal(papa.s.map, sp.map);
  assert.ok(both, 'ユイも 戦った');
  {
    assert.equal(bossLossOf(yui.s.char, id), 1, 'ユイも 数える');
    assert.ok(sayTexts(yui, fy).some((s) => s[2] === BOSS_HINTS[id][0]), 'ユイの 画面にも');
    assert.equal(choices(yui, fy).length, 0, 'ユイは えらばない');
    assert.equal(yui.s.map, sp.map, 'ユイも いっしょに もどる');
  }
});
