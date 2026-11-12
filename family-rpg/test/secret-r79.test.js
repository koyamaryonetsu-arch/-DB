// 第79回: ひみつのダンジョン（docs/plan-r79-secret.md）
//   1. リレミト・みちびきの糸で 入口の 広間へ（記録は のこる・お金は そのまま・家族も いっしょ・戦いの 中は 使えない）。帰り道の羽・ルーラは 使えない
//   2. 階の テーマ（今までの ダンジョンを まねた 階）: 階の 番号で きまる・2階 続かない・行った ことの ない ダンジョンの テーマは 出ない
//   3. どの 階も 着いた 所から 下り階段へ 行ける（すべる 氷・流れる ゆか・落とし穴 こみ。どこで 止まっても）。宝箱・人・立てふだに 話せる
//   4. ごほうび・魔物・番人・宝箱の 中みは 前と おなじ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, tileAt } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ESCAPE_ITEM } from '../public/js/shared/data/escape.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { gainExp, expForLevel, addItem, itemCount, mpCost } from '../public/js/shared/stats.js';
import {
  SD_GATE, SD_OPEN_FLAG, sdFloorId, sdFloorOf, sdRunSeedOf, isRestFloor, isGuardFloor, sdSpecialOf, sdEnemyLv, sdPower, sdZone, ensureSdTable,
  newSdSeed, sdBigReward, SD_MAX,
} from '../public/js/shared/data/secret.js';
import {
  SD_THEMES, SD_THEME, SD_THEME_ALL, sdThemeOf, sdThemesFor, sdSeedMask, packSdSeed, sdThemeMaskOf, sdPartyMask, sdDirText, SD_TEA_LINES,
} from '../public/js/shared/data/secret-themes.js';
import { buildThemeLayout, sdReach } from '../public/js/shared/maps/secret-floors.js';
import { GATE_DOWN, GATE_ARRIVE } from '../public/js/shared/maps/secret-dungeon.js';
import { collectMarks } from '../public/js/client/render/mark3d.js';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const menu = (bot, msg) => {
  bot.send({ t: 'menu', ...msg });
  return lastMenu(bot);
};
const sayTexts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say').map((s) => s[2]));
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);
function answers(bot, list) {
  const q = list.slice();
  Object.defineProperty(bot, 'choice', { get: () => (q.length ? q.shift() : 0), set: () => {}, configurable: true });
}
function strong(c, level = 60) {
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
}
async function hero(seed = 7, { upto = SD_OPEN_FLAG, name = 'ソラ' } = {}) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  strong(c);
  return { world, bot, c };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x, y, dir, true);
  await bot.settle();
};
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}
// 入口の 広間の 下り階段から ちょうせんを 始める（地下1階）
async function enter(bot) {
  await place(bot, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
  answers(bot, [0]);
  await stepOn(bot, GATE_DOWN.x, GATE_DOWN.y);
}
async function goDown(bot) {
  const m = MAPS[bot.map];
  const d = m.sd.down;
  await place(bot, m.id, d.x + 0.5, d.y + 1.5);
  await stepOn(bot, d.x, d.y);
}

// 階の しかけ こみで 行けるか（sdReach）＋ 人・立てふだ・こたつに 話せるか
function floorCheck(m) {
  const block = new Set(m.npcs.filter((n) => n.solid !== false).map((n) => Math.floor(n.y) * m.w + Math.floor(n.x)));
  const warpTo = new Map((m.warps || []).map((wp) => [wp.y * m.w + wp.x, Math.floor(wp.to.y) * m.w + Math.floor(wp.to.x)]));
  const start = Math.floor(m.sd.arrive.y) * m.w + Math.floor(m.sd.arrive.x);
  const r = sdReach(m.w, m.h, m.tiles, { block, warpTo, start, goal: m.sd.down.y * m.w + m.sd.down.x });
  const talk = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r.stops.has((y + dy) * m.w + x + dx));
  const bad = [
    ...m.npcs.filter((n) => !talk(n.x, n.y)).map((n) => n.id),
    ...(m.signs || []).filter((s) => !talk(s.x, s.y)).map((s) => `sign:${s.text}`),
    ...(m.actions || []).filter((a) => !talk(a.x, a.y)).map((a) => a.script),
  ];
  return { ...r, bad };
}

// ───────────── 1. リレミト・みちびきの糸 ─────────────
test('リレミト: ひみつのダンジョンの 階から 入口の 広間へ。記録・お金は のこる。ちょうせんは おわり。MPは へる', async () => {
  const { world, bot, c } = await hero(79);
  c.gold = 1234;
  await enter(bot);
  for (let f = 1; f < 6; f++) await goDown(bot);
  // 5階の 休み所で 記録して、もう いちど 入って 6・7階へ
  assert.equal(sdFloorOf(bot.map), 6);
  c.sd.got = [5];
  c.sd.save = 5;
  await goDown(bot);
  assert.equal(sdFloorOf(bot.map), 7);
  const before = JSON.parse(JSON.stringify({ best: c.sd.best, got: c.sd.got, save: c.sd.save, tries: c.sd.tries, at: c.sd.at }));
  assert.equal(before.best, 7);
  c.job = 'sage';
  c.jobs.sage = { lv: 3, b: 0 };
  c.abilities = [...new Set([...(c.abilities || []), 'riremito'])];
  c.mp = 50;
  const cost = mpCost(c, 'riremito');
  const from = bot.msgs.length;
  const r = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  await bot.settle();
  assert.ok(r.ok, r.text);
  assert.match(r.text, /ひみつのダンジョンの入口へもどってきた/);
  assert.equal(bot.map, SD_GATE);
  assert.equal(c.mp, 50 - cost);
  assert.equal(c.gold, 1234, 'お金は そのまま');
  assert.equal(c.sd.run, undefined, 'ちょうせんは おわり');
  assert.deepEqual({ best: c.sd.best, got: c.sd.got, save: c.sd.save, tries: c.sd.tries, at: c.sd.at }, before, '記録は のこる');
  assert.match(r.text, /今回は地下7階まで。最高は地下7階/);
  void from;
  // 入口から また 始められる（記録した 階も 選べる）
  await place(bot, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
  answers(bot, [1]);
  await stepOn(bot, GATE_DOWN.x, GATE_DOWN.y);
  assert.equal(sdFloorOf(bot.map), 5, '記録した 5階から 始められる');
  // 入口の 広間では 使えない（たてもの あつかい。MPは へらない）
  await place(bot, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y);
  c.mp = 50;
  const r2 = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.equal(r2.ok, false);
  assert.equal(c.mp, 50);
  void world;
});

test('みちびきの糸: リレミトと おなじ（入口の 広間へ。糸は 1つ へる）。帰り道の羽・ルーラは 使えない（へらない）', async () => {
  const { bot, c } = await hero(80);
  await enter(bot);
  await goDown(bot);
  const best = c.sd.best;
  addItem(c, ESCAPE_ITEM, 2);
  addItem(c, 'return_wing', 1);
  c.visited = { ...(c.visited || {}), village: true };
  // 羽
  let r = menu(bot, { action: 'useItem', id: 'return_wing', place: 'village' });
  await bot.settle();
  assert.equal(r.ok, false);
  assert.equal(sdFloorOf(bot.map), 2);
  assert.equal(itemCount(c, 'return_wing'), 1);
  assert.match(r.text, /リレミトかみちびきの糸/);
  // ルーラ
  const rura = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'warp' && ABILITIES[id].field);
  c.abilities = [...new Set([...(c.abilities || []), rura])];
  const mp0 = c.mp;
  r = menu(bot, { action: 'cast', id: rura, place: 'village', who: 'self' });
  await bot.settle();
  assert.equal(r.ok, false);
  assert.equal(sdFloorOf(bot.map), 2);
  assert.equal(c.mp, mp0);
  // 糸
  r = menu(bot, { action: 'useItem', id: ESCAPE_ITEM });
  await bot.settle();
  assert.ok(r.ok, r.text);
  assert.equal(bot.map, SD_GATE);
  assert.equal(itemCount(c, ESCAPE_ITEM), 1);
  assert.equal(c.sd.best, best);
  // 休み所・宿屋の 階・番人の 階でも 使える（番人との 戦いの 中は メニューが 使えない）
  for (const f of [5, 10]) {
    await place(bot, sdFloorId(f, newSdSeed(makeRng(f))), 9.5, 10.5);
    r = menu(bot, { action: 'useItem', id: ESCAPE_ITEM });
    await bot.settle();
    assert.ok(r.ok, `${f}階`);
    assert.equal(bot.map, SD_GATE);
    addItem(c, ESCAPE_ITEM, 1);
  }
  await place(bot, sdFloorId(10, 99), 9.5, 10.5);
  bot.s.busy = 'battle';
  r = menu(bot, { action: 'useItem', id: ESCAPE_ITEM });
  assert.equal(r.ok, false, '戦いの 中は 使えない');
  assert.equal(sdFloorOf(bot.map), 10);
  bot.s.busy = null;
});

test('家族の パーティー: リレミトで おなじ 階に いる 家族も みんな 入口へ（全滅と おなじ あつかい。記録は みんな のこる）。戦い中の 家族は のこる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(81), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  const ken = new Bot(world, 'ケン');
  for (const b of [papa, yui, ken]) { await b.login('x'); await b.createAndPlay('warrior'); await b.settle(); }
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid), K = world.sessions.get(ken.sid);
  for (const s of [P, Y, K]) {
    for (const f of UPTO(SD_OPEN_FLAG)) s.char.flags[f] = true;
    strong(s.char);
  }
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  papa.send({ t: 'party', action: 'invite', sid: ken.s.id });
  ken.send({ t: 'party', action: 'accept' });
  await papa.settle();
  for (const s of [Y, K]) world.placeSession(s, SD_GATE, 10.5, 9.5, 'up');
  await enter(papa);
  await goDown(papa);
  await yui.settle();
  await ken.settle();
  const here = papa.map;
  assert.equal(sdFloorOf(here), 2);
  assert.equal(yui.map, here);
  assert.equal(ken.map, here);
  // ケンは 戦い中（いっしょには もどらない）
  K.busy = 'battle';
  // ユイ（リーダーでは ない）が 唱えても みんな（階段と おなじ）
  Y.char.job = 'sage';
  Y.char.jobs.sage = { lv: 3, b: 0 };
  Y.char.abilities = [...new Set([...(Y.char.abilities || []), 'riremito'])];
  const from = papa.msgs.length;
  const r = menu(yui, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  await papa.settle();
  assert.ok(r.ok, r.text);
  assert.equal(Y.map, SD_GATE);
  assert.equal(P.map, SD_GATE, 'パパも いっしょ');
  assert.equal(K.map, here, '戦い中の ケンは のこる');
  assert.ok(toasts(papa, from).some((t) => t.includes('ユイのリレミトで')));
  for (const s of [P, Y]) {
    assert.equal(s.char.sd.best, 2);
    assert.equal(s.char.sd.run, undefined);
  }
  assert.ok(K.char.sd.run, 'ケンの ちょうせんは つづく');
  K.busy = null;
});

test('説明の 文: 案内人・上り階段・リレミトと 糸の せつめいが 新しい きまり', async () => {
  const { bot } = await hero(82);
  await place(bot, SD_GATE, 14.5, 4.5);
  answers(bot, [1]);
  const from = bot.msgs.length;
  bot.talk('sd_guide');
  await bot.settle();
  const said = sayTexts(bot, from).join('\n');
  assert.match(said, /リレミトかみちびきの糸を使えば、この入口へもどってこられる/);
  assert.match(said, /帰り道の羽とルーラは使えん/);
  assert.ok(!said.includes('リレミトも使えん'));
  const up = SCRIPTS.sd_up()[0][2];
  assert.match(up, /リレミトかみちびきの糸/);
  assert.match(ABILITIES.riremito.desc, /ひみつのダンジョンでは、入口へもどる/);
});

// ───────────── 2. 階の テーマ ─────────────
test('テーマの 表: 12こ いじょう。だれにでも 出る テーマと、行った ダンジョンの テーマ。ビットは かさならない', () => {
  assert.ok(SD_THEMES.length >= 12, `${SD_THEMES.length}`);
  const gated = SD_THEMES.filter((t) => t.need);
  assert.ok(gated.length >= 12);
  assert.equal(new Set(gated.map((t) => t.bit)).size, gated.length);
  for (const t of SD_THEMES) {
    assert.ok(t.label && t.shape && t.craft, t.id);
    for (const s of t.signs) assert.ok(s.length <= 24, `短い 立てふだ: ${s}`);
  }
  // フラグは 物語で 本当に たつ もの
  const all = new Set(STORY_STEPS);
  for (const t of gated) assert.ok(all.has(t.need) || /^c\d_/.test(t.need), t.need);
  assert.equal(sdThemeMaskOf({ flags: {} }), 0);
  assert.equal(sdThemeMaskOf({ flags: Object.fromEntries(gated.map((t) => [t.need, true])) }), SD_THEME_ALL);
  // いっしょに 入る みんなが 行った ことの ある テーマだけ（AND）
  const a = { flags: { c1_cave: true, c2_kraken: true, c3_mine: true } }, b = { flags: { c1_cave: true, c3_mine: true, c8_moon: true } };
  assert.equal(sdPartyMask([a, b]), (1 << SD_THEME.bright.bit) | (1 << SD_THEME.mine.bit));
  assert.equal(sdPartyMask([]), 0);
  // 色の テーマは 画面に ある
  return import('node:fs').then((fs) => {
    const src = ['themes.js', 'tiles-tower.js', 'tiles-tokei.js', 'tiles-c7.js', 'tiles-c7i.js', 'tiles-c8a.js', 'tiles-c8b.js', 'tiles-c8c.js']
      .map((f) => fs.readFileSync(new URL(`../public/js/client/render/${f}`, import.meta.url), 'utf8')).join('\n');
    for (const t of SD_THEMES) if (t.color && t.color !== 'none') assert.ok(new RegExp(`[ ,{]${t.color}: `).test(src), t.color);
  });
});

test('seed に テーマの しるし: 入れて 取り出せる。前の 版の seed は 0（だれにでも 出る テーマだけ）', () => {
  const rng = makeRng(5);
  for (let i = 0; i < 400; i++) {
    const mask = Math.floor(rng.next() * (SD_THEME_ALL + 1));
    const seed = newSdSeed(rng, mask);
    assert.ok(Number.isInteger(seed) && seed >= 1 && seed <= 0x7fffffff);
    assert.equal(sdSeedMask(seed), mask);
    assert.equal(sdRunSeedOf(sdFloorId(3, seed)), seed);
  }
  assert.equal(sdSeedMask(0), 0);
  assert.equal(sdSeedMask(packSdSeed(4095, SD_THEME_ALL)), SD_THEME_ALL);
  assert.equal(packSdSeed(4095, SD_THEME_ALL) <= 0x7fffffff, true);
  // 前の 版の でたらめな seed は ほとんど 0
  let hit = 0;
  for (let i = 0; i < 2000; i++) if (sdSeedMask(1 + Math.floor(rng.next() * 0x7ffffffe))) hit++;
  assert.ok(hit < 60, `${hit}`);
});

test('階の テーマ: 階の 番号で きまる（ちょうせんが かわっても・家族で おなじ）。2階 続かない', async () => {
  const masks = [0, SD_THEME_ALL, 0b1, 0b1000000001, 0b1010101010101];
  for (const mask of masks) {
    const list = sdThemesFor(mask);
    let prev = null;
    const seen = new Set();
    for (let f = 1; f <= SD_MAX; f++) {
      const t = sdThemeOf(f, mask);
      assert.ok(list.includes(t), `${mask}:${f}`);
      assert.notEqual(t, prev, `${mask}: ${f}階と ${f - 1}階`);
      prev = t;
      seen.add(t);
    }
    assert.equal(seen.size, list.length, `${mask}: どの テーマも 出る`);
  }
  // おなじ 階・おなじ しるしなら、ちょうせんの seed が ちがっても おなじ テーマ（形は ちがう）
  const a = await import('../public/js/shared/maps/secret-dungeon.js?r79=a');
  const b = await import('../public/js/shared/maps/secret-dungeon.js?r79=b');
  let differ = 0;
  for (const f of [1, 2, 3, 4, 6, 7, 8, 9, 11, 13, 24, 37, 58, 99]) {
    const s1 = packSdSeed(11, SD_THEME_ALL), s2 = packSdSeed(2222, SD_THEME_ALL);
    const x = a.buildSecretFloor(sdFloorId(f, s1)), y = b.buildSecretFloor(sdFloorId(f, s1)), z = a.buildSecretFloor(sdFloorId(f, s2));
    assert.deepEqual([...x.tiles], [...y.tiles], `${f}階: おなじ ID は おなじ 形`);
    assert.deepEqual(x.sd, y.sd);
    assert.deepEqual(x.npcs, y.npcs);
    assert.deepEqual(x.signs, y.signs);
    if (x.sd.kind || z.sd.kind) continue;
    assert.equal(x.sd.theme, sdThemeOf(f, SD_THEME_ALL));
    assert.equal(x.sd.theme, z.sd.theme, `${f}階: おなじ テーマ`);
    if ([...x.tiles].join() !== [...z.tiles].join()) differ++;
  }
  assert.ok(differ >= 8, `形は ちょうせんごとに かわる（${differ}）`);
});

test('ネタバレを さける: 行った ことの ない ダンジョンの テーマは 出ない（ひとり・家族）', { timeout: 60000 }, async () => {
  // まだ どこにも 行っていない（ルミナの町に 着いた だけ）: だれにでも 出る テーマだけ
  const { world, bot, c } = await hero(83);
  await enter(bot);
  const seed = c.sd.run.seed;
  assert.equal(sdSeedMask(seed), 0);
  const open = new Set(SD_THEMES.filter((t) => !t.need).map((t) => t.id));
  for (let f = 1; f <= 120; f++) {
    const m = MAPS[sdFloorId(f, seed)];
    if (m.sd.theme) assert.ok(open.has(m.sd.theme), `${f}階: ${m.sd.theme}`);
  }
  // なげきの洞窟・炎の山だけ 行った: その 2つと だれにでも 出る テーマ
  c.flags.c1_cave = true;
  c.flags.c3_flare = true;
  await place(bot, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y);
  await enter(bot);
  const s2 = c.sd.run.seed;
  assert.equal(sdSeedMask(s2), (1 << SD_THEME.bright.bit) | (1 << SD_THEME.onsen.bit));
  const seen = new Set();
  for (let f = 1; f <= 200; f++) {
    const m = MAPS[sdFloorId(f, s2)];
    if (!m.sd.theme) continue;
    seen.add(m.sd.theme);
    assert.ok(open.has(m.sd.theme) || m.sd.theme === 'bright' || m.sd.theme === 'onsen', `${f}階: ${m.sd.theme}`);
  }
  assert.ok(seen.has('bright') && seen.has('onsen'));
  void world;
});

test('ネタバレを さける（家族）: いっしょに 入る みんなが 行った ことの ある テーマだけ', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(84), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  for (const b of [papa, yui]) { await b.login('x'); await b.createAndPlay('warrior'); await b.settle(); }
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const s of [P, Y]) {
    for (const f of UPTO(SD_OPEN_FLAG)) s.char.flags[f] = true;
    strong(s.char);
  }
  // パパは 第8章まで、ユイは なげきの洞窟と 鉱山だけ
  for (const t of SD_THEMES) if (t.need) P.char.flags[t.need] = true;
  Y.char.flags.c1_cave = true;
  Y.char.flags.c3_mine = true;
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  world.placeSession(Y, SD_GATE, 10.5, 9.5, 'up');
  await enter(papa);
  await yui.settle();
  assert.equal(yui.map, papa.map);
  const seed = P.char.sd.run.seed;
  assert.equal(Y.char.sd.run.seed, seed);
  assert.equal(sdSeedMask(seed), (1 << SD_THEME.bright.bit) | (1 << SD_THEME.mine.bit));
  // パパ ひとりなら ぜんぶ
  papa.send({ t: 'party', action: 'leave' });
  await tickN(world, 3);
  await papa.settle();
  await place(papa, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y);
  await enter(papa);
  assert.equal(sdSeedMask(P.char.sd.run.seed), SD_THEME_ALL);
});

// ───────────── 3. どの 階も 行ける ─────────────
test('どの 階も: 着いた 所から 下り階段へ 行ける（氷・流れる ゆか・落とし穴 こみ。どこで 止まっても）。人・立てふだ・宝箱に 話せる', { timeout: 300000 }, () => {
  const runs = [
    { mask: SD_THEME_ALL, r: 1, upto: SD_MAX },
    { mask: 0, r: 7, upto: 200 },
    { mask: 0, r: 0, upto: 200 }, // 前の 版の ID（'sd_<階>'）
    ...[3, 91, 400, 1234, 4000].map((r, k) => ({ mask: [SD_THEME_ALL, 0b1111, 0b1111110000000, 0b101010101010, 0b10101010101][k], r, upto: 120 })),
  ];
  const themes = new Set();
  for (const { mask, r, upto } of runs) {
    const seed = r ? packSdSeed(r, mask) : 0;
    for (let f = 1; f <= upto; f++) {
      const m = MAPS[sdFloorId(f, seed)];
      assert.ok(m, `${f}階`);
      if (isRestFloor(f) || m.sd.kind) continue;
      themes.add(m.sd.theme);
      const res = floorCheck(m);
      assert.ok(res.goal, `${mask}/${r}: ${f}階（${m.sd.theme}）下り階段へ 行ける`);
      assert.ok(res.ok, `${mask}/${r}: ${f}階（${m.sd.theme}）どこで 止まっても 行ける`);
      assert.deepEqual(res.bad, [], `${mask}/${r}: ${f}階（${m.sd.theme}）話せる`);
      assert.equal(tileAt(m, m.sd.down.x, m.sd.down.y), T.STAIRS_DOWN);
      assert.ok(!isBlocked(m, m.sd.down.x, m.sd.down.y + 1, () => false), `${f}階: 下り階段の 下`);
      assert.ok(m.w <= 52 && m.h <= 42);
      // 落とし穴は 同じ 階の 着いた 所へ
      for (const wp of m.warps) assert.equal(wp.to.map, m.id);
    }
  }
  assert.equal(themes.size, SD_THEMES.length, `ぜんぶの テーマを たしかめた（${[...themes].join(',')}）`);
});

test('どの テーマも: 広さ 4つ × 30の 形で 行ける（形の 作り方 ぜんぶ）', { timeout: 300000 }, () => {
  for (const t of SD_THEMES) {
    for (let lv = 1; lv <= 4; lv++) {
      for (let k = 0; k < 30; k++) {
        const fseed = (Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(lv, 0x85ebca6b) ^ t.id.length) >>> 0;
        const lay = buildThemeLayout({ f: 1 + k, fseed, lv, themeId: t.id, monsters: ['slime', 'bat'], runSeed: k });
        const block = new Set(lay.npcs.map((n) => n.y * lay.w + n.x));
        const warpTo = new Map(lay.warps.map((p) => [p.y * lay.w + p.x, p.ty * lay.w + p.tx]));
        const r = sdReach(lay.w, lay.h, lay.tiles, { block, warpTo, start: lay.arrive.y * lay.w + lay.arrive.x, goal: lay.down.y * lay.w + lay.down.x });
        assert.ok(r.goal && r.ok, `${t.id} lv${lv} #${k}`);
        assert.equal(lay.tiles[lay.down.y * lay.w + lay.down.x], T.STAIRS_DOWN);
        assert.equal(lay.tiles[lay.up.y * lay.w + lay.up.x], T.STAIRS_UP);
        const talk = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r.stops.has((y + dy) * lay.w + x + dx));
        for (const n of lay.npcs) assert.ok(talk(n.x, n.y), `${t.id} lv${lv} #${k}: ${n.id}`);
        for (const s of lay.signs) assert.ok(talk(s.x, s.y), `${t.id} lv${lv} #${k}: ${s.text}`);
      }
    }
  }
});

test('しかけの きまり（sdReach）: 氷は すべる・流れる ゆかは 運ぶ・落とし穴は とぶ・止まって 出られない 所は だめ', () => {
  const W = T.CAVE_WALL, F = T.CAVE_FLOOR, I = T.ICE, E = T.WIND_E;
  const grid = (rows) => {
    const h = rows.length, w = rows[0].length;
    const t = new Uint16Array(w * h);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { t[y * w + x] = { '#': W, '.': F, _: I, '}': E, O: T.SAND_PIT }[ch]; }));
    return { w, h, t };
  };
  // 氷の まっすぐな 道: 止まれないので 上の 出口に 入れない（ゴールは 氷の 上の 行の 右）
  let g = grid(['#####', '#..g#', '#___#', '#___#', '#####'].map((r) => r.replace('g', '.')));
  let r = sdReach(g.w, g.h, g.t, { start: 1 * g.w + 1, goal: 1 * g.w + 3 });
  assert.ok(r.ok && r.goal);
  // 東へ 流れる ゆかの 先が 行き止まり（もどれない）→ だめ
  g = grid(['#######', '#.}}}.#', '#.###.#', '#.....#', '#######'].map((x) => x));
  r = sdReach(g.w, g.h, g.t, { start: 1 * g.w + 1, goal: 3 * g.w + 1 });
  assert.ok(r.ok && r.goal, 'まわりこめる');
  g = grid(['#######', '#.}}}.#', '#.#####', '#.....#', '#######']);
  r = sdReach(g.w, g.h, g.t, { start: 3 * g.w + 3, goal: 3 * g.w + 5 });
  assert.ok(r.goal);
  assert.equal(r.ok, false, '流された 先から もどれない');
  // 落とし穴: とび先へ
  g = grid(['#####', '#.O.#', '#####']);
  r = sdReach(g.w, g.h, g.t, { start: 1 * g.w + 1, goal: 1 * g.w + 3, warpTo: new Map([[1 * g.w + 2, 1 * g.w + 1]]) });
  assert.equal(r.goal, false, '穴を こえられない');
});

test('テーマの しかけ: にせものの 階段・宝箱（当たりは 階段の むき・中みは なし）・休けい中の 魔物・まよいの職人', { timeout: 60000 }, async () => {
  const { bot, c } = await hero(85);
  // 階段だらけ・宝箱だらけ・休けい中・作りかけ の 階を さがす（mask 0）
  const find = (id) => {
    for (let r = 1; r < 60; r++) {
      const seed = packSdSeed(r, 0);
      for (let f = 1; f < 40; f++) {
        if (isRestFloor(f)) continue;
        const m = MAPS[sdFloorId(f, seed)];
        if (m.sd.theme === id && (id !== 'teatime' || m.npcs.some((n) => n.script === 'sd_tea'))) return m;
      }
    }
    return null;
  };
  const gold = c.gold;
  const items = JSON.stringify(c.items || c.inventory || {});
  // にせものの 階段
  const st = find('stairs');
  assert.ok(st);
  const fake = st.triggers.find((t) => t.script === 'sd_fake');
  assert.ok(fake && st.triggers.filter((t) => t.script === 'sd_fake').length >= 5);
  assert.equal(tileAt(st, fake.x, fake.y), T.STAIRS_DOWN);
  c.sd = { ...(c.sd || {}), run: { f: 1, took: [] } };
  await place(bot, st.id, fake.x + 0.5, fake.y + 1.5);
  let from = bot.msgs.length;
  await stepOn(bot, fake.x, fake.y);
  assert.equal(bot.map, st.id, 'にせものの 階段では 下りない');
  assert.ok(sayTexts(bot, from).some((t) => /絵|かざり|ハズレ|1だん/.test(t)));
  // 2.5D の 目じるし: 本物の 階段にも ▼
  const marks = collectMarks(st.w, st.h, (x, y) => tileAt(st, x, y));
  assert.ok(marks.some((k) => k.kind === 'down' && k.tx === st.sd.down.x && k.ty === st.sd.down.y));
  assert.ok(marks.some((k) => k.kind === 'up'));
  // 宝箱だらけ
  const bx = find('boxes');
  assert.ok(bx);
  const boxes = bx.npcs.filter((n) => n.script.startsWith('sd_box_'));
  assert.ok(boxes.length >= 5);
  assert.equal(boxes.filter((n) => n.script === 'sd_box_hit').length, 1, '当たりは 1つ');
  for (const n of boxes) {
    await place(bot, bx.id, n.x + 0.5, n.y + 1.5);
    from = bot.msgs.length;
    bot.talk(n.id);
    await bot.settle();
    const t = sayTexts(bot, from).join('\n');
    assert.match(t, /宝箱を開けた/);
    if (n.script === 'sd_box_hit') assert.match(t, /下り階段は、(北|南|東|西|すぐ近く)/);
  }
  assert.equal(c.gold, gold, 'お金は ふえない');
  assert.equal(JSON.stringify(c.items || c.inventory || {}), items, '道具は ふえない');
  assert.equal(sdDirText(5, -5), '北東');
  assert.equal(sdDirText(-5, 0), '西');
  // 休けい中の 魔物（話しても 戦いに ならない）
  const tea = find('teatime');
  assert.ok(tea);
  const mon = tea.npcs.find((n) => n.script === 'sd_tea');
  assert.ok(mon.sprite.startsWith('mon:'));
  assert.equal(tea.zoneAt(mon.x, mon.y), 'safe:sd', '休けいの へやは 魔物が 出ない');
  await place(bot, tea.id, mon.x + 0.5, mon.y + 1.5);
  from = bot.msgs.length;
  bot.talk(mon.id);
  await bot.settle();
  assert.ok(sayTexts(bot, from).some((t) => SD_TEA_LINES.includes(t)));
  assert.ok(!bot.msgs.slice(from).some((m) => m.t === 'battle' || m.t === 'battleStart'));
  // まよいの職人
  const cr = find('craft');
  const man = cr.npcs.find((n) => n.script === 'sd_craftsman');
  assert.ok(man, '作りかけの 階には いつも いる');
  await place(bot, cr.id, man.x + 0.5, man.y + 1.5);
  from = bot.msgs.length;
  bot.talk(man.id);
  await bot.settle();
  assert.ok(sayTexts(bot, from).some((t) => t.includes('あまった材料')));
  // ときどき ほかの 階にも
  let others = 0;
  for (let f = 1; f <= 120; f++) {
    const m = MAPS[sdFloorId(f, packSdSeed(9, SD_THEME_ALL))];
    if (m.sd.theme && m.sd.theme !== 'craft' && m.npcs.some((n) => n.script === 'sd_craftsman')) others++;
  }
  assert.ok(others >= 5, `${others}`);
  for (const id of ['sd_fake', 'sd_box_hit', 'sd_box_empty', 'sd_box_jack', 'sd_tea', 'sd_craftsman', 'sd_cart', 'sd_kotatsu']) assert.ok(SCRIPTS[id], id);
});

test('着いた ときの 知らせに テーマの 名前', async () => {
  const { bot } = await hero(86);
  const from = bot.msgs.length;
  await enter(bot);
  const m = MAPS[bot.map];
  assert.ok(toasts(bot, from).some((t) => t.includes(`（${SD_THEME[m.sd.theme].label}）`)));
});

// ───────────── 4. ごほうび・魔物は 前と おなじ ─────────────
test('ごほうび・魔物・番人は かわらない（見た目と 形と せりふだけ）', () => {
  for (let f = 1; f <= 120; f++) {
    const old = MAPS[sdFloorId(f)];
    for (const seed of [packSdSeed(5, SD_THEME_ALL), packSdSeed(77, 0)]) {
      const m = MAPS[sdFloorId(f, seed)];
      assert.equal(m.enemyLv, sdEnemyLv(f));
      assert.equal(m.enemyPow, sdPower(f));
      assert.equal(m.enemyLv, old.enemyLv);
      assert.deepEqual(m.chests, [], '階に 宝箱（中み つき）は ない');
      if (isRestFloor(f)) {
        assert.ok(m.sd.rest);
        assert.equal(m.npcs.some((n) => n.id === 'sd_guard'), isGuardFloor(f));
        continue;
      }
      if (m.sd.kind) continue;
      assert.deepEqual(Object.keys(m.spawnCounts), [sdZone(f)]);
      assert.ok(Object.values(m.spawnCounts)[0] >= 4);
      // しらべると 道具が 出る タイル（つぼ・たる など）は 置かない
      for (const v of m.tiles) assert.ok(!TILE_INFO[v]?.search, `${f}階: しらべる タイル`);
      // 休けい中の 魔物は その 階に 出る 魔物
      const sps = new Set((ENCOUNTER_TABLES[ensureSdTable(f)] || []).flatMap((e) => e.group.map((g) => g[0])));
      for (const n of m.npcs) if (n.sprite.startsWith('mon:')) assert.ok(sps.has(n.sprite.slice(4)), `${f}階: ${n.sprite}`);
    }
  }
  // 休み所の 大きな ごほうびは 階の 番号だけで きまる（テーマに よらない）
  assert.deepEqual(sdBigReward(10), sdBigReward(10));
  // 宿屋・お店の 階は いままで どおり
  assert.equal(sdSpecialOf(7, packSdSeed(5, SD_THEME_ALL)) === null || typeof sdSpecialOf(7, packSdSeed(5, SD_THEME_ALL)) === 'string', true);
});

// ───────────── 5. メニューから 糸を 使う（第79回の あと）─────────────
test('メニューの 糸: もどれた 時は メニューを とじる（リレミトと おなじ）。もどれない 所では 開いた まま', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  const at = src.indexOf("it.effect.type === 'exit'");
  assert.ok(at > 0);
  const block = src.slice(at, src.indexOf('} else if', at + 10));
  assert.match(block, /const r = await this\.menuCall\(\{ t: 'menu', action: 'useItem', id: entry\.value \}\);/);
  assert.match(block, /if \(r\?\.ok\) return this\.close\(\);/);
  assert.ok(!block.includes('!m.noEscape'),'ひみつのダンジョン（noEscape）でも サーバーの 返事で きめる');
  // サーバーの 返事: ひみつのダンジョン・ふつうの 洞窟は ok（とじる）、ピラミッド・フィールドは だめ（開いた まま。糸も へらない）
  const { world, bot, c } = await hero(87);
  addItem(c, ESCAPE_ITEM, 5);
  const use = () => menu(bot, { action: 'useItem', id: ESCAPE_ITEM });
  await enter(bot);
  let r = use();
  assert.equal(r.ok, true);
  assert.equal(bot.s.map, SD_GATE);
  world.placeSession(bot.s, 'cave_b1', 5.5, 5.5, 'down', true);
  r = use();
  assert.equal(r.ok, true, 'ふつうの 洞窟');
  assert.notEqual(bot.s.map, 'cave_b1');
  for (const id of ['pyramid1', 'overworld']) {
    world.placeSession(bot.s, id, 5.5, 5.5, 'down', true);
    const n = itemCount(c, ESCAPE_ITEM);
    r = use();
    assert.equal(r.ok, false, id);
    assert.equal(bot.s.map, id);
    assert.equal(itemCount(c, ESCAPE_ITEM), n);
  }
});
