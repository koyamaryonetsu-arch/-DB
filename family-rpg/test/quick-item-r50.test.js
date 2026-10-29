// 第50回 N3: 大事な物の「すぐ使う」ボタン（時の砂時計・ミナモの星読み・星読みのしおり。data/quick-item.js）
// ・どの 大事な物が すぐ使えるか・はじめて 手に 入れた ときに 自動で ボタンに なる
// ・サーバーの えらぶ（quickSet）・コントローラーの ボタン（quickPad）・使う（quickUse）の たしかめ
// ・戦いの 中では 使えない・コントローラーの ボタンの わりあて（client/input.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { addItem } from '../public/js/shared/stats.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { startFixedBattle, abortBattle } from '../public/js/shared/world/battles.js';
import { PAST_ID } from '../public/js/shared/maps/past.js';
import {
  quickUseOf, quickItemOf, quickList, quickLabel, autoQuick, quickHere, QUICK_PADS, QUICK_PAD_DEFAULT, quickPadOf, cleanQuick,
} from '../public/js/shared/data/quick-item.js';
import { Input } from '../public/js/client/input.js';
import { Bot } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

async function setup(seed, upto = null) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  if (upto) for (const f of UPTO(upto)) c.flags[f] = true;
  bot.s.repelUntil = 1e15;
  return { world, bot, c };
}

test('すぐ使える 大事な物: menuUse・hourglass の ものだけ。サーバーの 使う しくみが ある', () => {
  assert.equal(quickUseOf('toki_glass'), 'timeGlass');
  assert.equal(quickUseOf('c6s_star_reading'), 'starSight');
  assert.equal(quickUseOf('c6s_bookmark'), 'bookmark');
  for (const id of ['star_dew', 'potion', 'constructor', '__proto__', 42, null]) assert.equal(quickUseOf(id), null, String(id));
  assert.equal(quickLabel('toki_glass'), '砂時計');
  // menuUse の ある 大事な物は ぜんぶ services.js の quickUse で あつかう
  const src = readFileSync(new URL('../public/js/shared/world/services.js', import.meta.url), 'utf8');
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.type !== 'key' || !(it.menuUse || it.hourglass)) continue;
    assert.ok(src.includes(`use === '${quickUseOf(id)}'`), `${id} の 使う しくみ`);
  }
});

test('はじめて 手に 入れた 大事な物が 自動で ボタンに なる（2つめ からは かわらない・「なし」に したら そのまま）', () => {
  const c = { keyItems: [], items: [] };
  addItem(c, 'star_dew');
  assert.equal(c.quickItem, undefined, 'すぐ使えない 物では かわらない');
  addItem(c, 'toki_glass');
  assert.equal(c.quickItem, 'toki_glass');
  addItem(c, 'c6s_bookmark');
  assert.equal(c.quickItem, 'toki_glass', '2つめ からは かわらない');
  assert.deepEqual(quickList(c), ['toki_glass', 'c6s_bookmark']);
  // 前の セーブ（quickItem が ない）: 持っている はじめの 1つ
  const old = { keyItems: ['c6s_star_reading', 'toki_glass'], items: [] };
  assert.equal(quickItemOf(old), 'c6s_star_reading');
  autoQuick(old, 'c6s_bookmark');
  assert.equal(old.quickItem, 'c6s_star_reading', '今の ボタンの まま');
  // 「なし」
  const none = { keyItems: [], items: [], quickItem: '' };
  addItem(none, 'toki_glass');
  assert.equal(none.quickItem, '');
  assert.equal(quickItemOf(none), null);
  // ボタンの 物を なくした（だいほんで わたした など）: のこりの はじめの 1つ
  const lost = { keyItems: ['c6s_bookmark'], items: [], quickItem: 'toki_glass' };
  assert.equal(quickItemOf(lost), 'c6s_bookmark');
});

test('物語で 時の砂時計を もらうと ボタンに なる（だいほんの item）', async () => {
  const { bot, c } = await setup(5001);
  assert.equal(quickItemOf(c), null);
  // だいほんの ['item', 'toki_glass', 1] と おなじ addItem
  addItem(c, 'toki_glass');
  bot.world.sendSelf(bot.s);
  assert.equal(bot.char.quickItem, 'toki_glass', 'クライアントにも とどく');
});

test('サーバー: quickSet・quickPad の たしかめ', async () => {
  const { bot, c } = await setup(5002);
  const set = (id) => { bot.send({ t: 'menu', action: 'quickSet', id }); return lastRes(bot); };
  const pad = (b) => { bot.send({ t: 'menu', action: 'quickPad', pad: b }); return lastRes(bot); };
  // 持っていない
  assert.equal(set('toki_glass').ok, false);
  c.keyItems.push('star_dew', 'toki_glass', 'c6s_bookmark');
  // すぐ使えない 大事な物・へんな ID
  for (const id of ['star_dew', 'potion', 'constructor', 123, { a: 1 }, 'c6s_star_reading']) {
    assert.equal(set(id).ok, false, String(id));
  }
  assert.equal(c.quickItem, undefined);
  assert.equal(set('c6s_bookmark').ok, true);
  assert.equal(c.quickItem, 'c6s_bookmark');
  assert.equal(quickItemOf(bot.char), 'c6s_bookmark', 'クライアントにも');
  assert.equal(set('').ok, true);
  assert.equal(quickItemOf(c), null, 'なし');
  bot.send({ t: 'menu', action: 'quickUse' });
  assert.equal(lastRes(bot).ok, false);
  assert.match(lastRes(bot).text, /すぐ使う大事な物がない/);
  assert.equal(set('toki_glass').ok, true);
  // コントローラーの ボタン
  assert.equal(quickPadOf(c), QUICK_PAD_DEFAULT);
  for (const b of [0, 1, 2, 3, 4, 5, 7, 8, 9, 12, 99, '6', null]) assert.equal(pad(b).ok, false, String(b));
  assert.equal(pad(10).ok, true);
  assert.equal(c.quickPad, 10);
  assert.equal(pad(-1).ok, true);
  assert.equal(quickPadOf(c), -1, 'なし');
  assert.equal(pad(6).ok, true);
  assert.equal(c.quickPad, undefined, 'ZL（ふつう）は のこさない');
});

test('quickUse: メニューの「使う」と おなじ（時の砂時計で 千年前へ）。戦いの 中では 使えない', async () => {
  const { world, bot, c } = await setup(5003, 'c6_past');
  addItem(c, 'toki_glass');
  const hx = PLACES.shrine.x + 5, hy = PLACES.shrine.y + 7;
  world.placeSession(bot.s, 'overworld', hx + 0.5, hy + 0.5, 'up', true);
  await bot.settle();
  // 戦いの 中
  const enc = 'treant';
  startFixedBattle(world, bot.s, [bot.s], enc);
  assert.equal(bot.s.busy, 'battle');
  bot.send({ t: 'menu', action: 'quickUse' });
  assert.equal(lastRes(bot).ok, false, '戦いの 中は だめ');
  assert.equal(bot.s.map, 'overworld');
  // 戦いを おえる（にげた ことに する）
  for (const ctx of [...world.battles.values()]) abortBattle(world, ctx);
  await bot.settle();
  // 物語の 戦いは おわると だいほんに もどる（ここでは だいほんが ないので もどす）
  assert.equal(bot.s.busy, 'script');
  bot.send({ t: 'menu', action: 'quickUse' });
  assert.equal(lastRes(bot).ok, false, 'だいほんの 中も だめ');
  bot.s.busy = null;
  // 戦いの あと: 使える
  bot.send({ t: 'menu', action: 'quickUse' });
  await bot.settle();
  assert.equal(bot.s.map, PAST_ID, '千年前へ');
  assert.ok(bot.msgs.some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'timeShift')), '砂の うず');
  // 空の 上・町の 中では サーバーが わけを 知らせる（メニューと おなじ）
  bot.s.flying = true;
  bot.send({ t: 'menu', action: 'quickUse' });
  assert.equal(lastRes(bot).ok, false);
  assert.match(lastRes(bot).text, /空の上/);
  bot.s.flying = false;
});

test('HUD の ボタンを 出す 場所（quickHere）', () => {
  const c = { keyItems: ['toki_glass'], items: [], guests: [] };
  const hx = PLACES.shrine.x + 5, hy = PLACES.shrine.y + 7;
  assert.ok(MAPS.overworld.timePair);
  assert.equal(quickHere(c, MAPS, 'overworld', hx + 0.5, hy + 0.5), true);
  assert.equal(quickHere(c, MAPS, 'overworld', hx + 0.5, hy + 0.5, { flying: true }), false, '空の 上');
  assert.equal(quickHere(c, MAPS, 'overworld', hx + 0.5, hy + 0.5, { visiting: true }), false, 'リーダーの 冒険の 手伝い');
  const v = PLACES.village;
  assert.equal(quickHere(c, MAPS, 'overworld', v.x + v.w / 2, v.y + v.h / 2), false, '村の 中');
  assert.ok(!MAPS.cave_b1.timePair);
  assert.equal(quickHere(c, MAPS, 'cave_b1', 5, 5), false, '時の組が ない');
  assert.equal(quickHere({ ...c, quickItem: '' }, MAPS, 'overworld', hx, hy), false, 'なし');
  // しおり: 時計塔の 中だけ
  const tk = Object.values(MAPS).find((m) => m.tkFloor != null);
  const bm = { keyItems: ['c6s_bookmark'], items: [] };
  assert.equal(quickHere(bm, MAPS, tk.id, 5, 5), true);
  assert.equal(quickHere(bm, MAPS, 'overworld', hx, hy), false);
  // 星読み: ミナモが いっしょ
  const st = { keyItems: ['c6s_star_reading'], items: [], guests: [] };
  assert.equal(quickHere(st, MAPS, 'overworld', hx, hy), false);
  assert.equal(quickHere({ ...st, guests: ['minamo'] }, MAPS, 'overworld', hx, hy), true);
});

test('セーブの 手直し（cleanQuick・repairChar）', () => {
  const c = { keyItems: ['toki_glass'], items: [], quickItem: 'nope', quickPad: 4 };
  cleanQuick(c);
  assert.equal(c.quickItem, undefined);
  assert.equal(c.quickPad, undefined);
  const d = { keyItems: ['toki_glass'], items: [], quickItem: '', quickPad: 11 };
  cleanQuick(d);
  assert.equal(d.quickItem, '');
  assert.equal(d.quickPad, 11);
  assert.equal(typeof repairChar, 'function');
});

test('コントローラー: えらんだ ボタンで quick（ZL・L3・R3・なし）。ほかの ボタンと かさならない', () => {
  const used = [0, 1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 15];
  for (const p of QUICK_PADS) assert.ok(!used.includes(p.b), p.name);
  assert.equal(QUICK_PADS.find((p) => p.b === QUICK_PAD_DEFAULT).name, 'ZL（LT）');
  const pressed = new Set();
  const gp = { connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ get pressed() { return pressed.has(i); } })) };
  const had = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [gp] }, configurable: true, writable: true });
  try {
    const fake = { pad: { prev: {}, dir: { x: 0, y: 0 }, repeat: {}, run: false }, stack: [], busy: false, quickPad: 6, out: [], emit(a) { this.out.push(a); } };
    const press = (b) => {
      pressed.clear();
      if (b !== null) pressed.add(b);
      Input.prototype.update.call(fake);
    };
    press(6);
    assert.deepEqual(fake.out, ['quick'], 'ZL');
    press(6);
    assert.deepEqual(fake.out, ['quick'], 'おしっぱなしは 1回');
    press(null);
    fake.quickPad = 11;
    press(6);
    assert.deepEqual(fake.out, ['quick'], 'ZL では なくなった');
    press(null);
    press(11);
    assert.deepEqual(fake.out, ['quick', 'quick'], 'R3');
    press(null);
    fake.quickPad = -1;
    for (const b of [6, 10, 11]) { press(b); press(null); }
    assert.deepEqual(fake.out, ['quick', 'quick'], 'なし');
    press(4);
    assert.deepEqual(fake.out, ['quick', 'quick', 'ride'], 'L は 今までどおり');
  } finally {
    if (had) Object.defineProperty(globalThis, 'navigator', had);
    else delete globalThis.navigator;
  }
  // キーボードの T
  const src = readFileSync(new URL('../public/js/client/input.js', import.meta.url), 'utf8');
  assert.match(src, /KeyT: 'quick'/);
});
