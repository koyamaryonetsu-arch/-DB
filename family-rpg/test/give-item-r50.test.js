// 第50回 N6: 家族に 道具を あげる（world/gift.js・メニューの「家族にあげる」）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { itemCount, addItem } from '../public/js/shared/stats.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { giftTargets, giftNewsText, GIFT_STACK_MAX } from '../public/js/shared/world/gift.js';
import { tavernNewsText } from '../public/js/shared/world/recruit-share.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const KEY = Object.keys(ITEMS).find((id) => ITEMS[id].type === 'key');
const UNIQUE = Object.keys(ITEMS).find((id) => ITEMS[id].unique);
const WEAPON = Object.keys(ITEMS).find((id) => ITEMS[id].type === 'weapon' && !ITEMS[id].unique);

// 家族サーバー（offline でない）に n人。saved … セーブされた データ
async function family(names = ['パパ', 'ユイ'], { offline = false } = {}) {
  const store = { saved: null };
  const storage = { load: () => null, save: (d) => { store.saved = clone(d); } };
  const world = new GameWorld({ offline, storage, rng: makeRng(50), checkPassword: () => true, rateLimit: false });
  const bots = [];
  for (const [i, name] of names.entries()) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay(['warrior', 'mage', 'priest'][i % 3]);
    await b.settle();
    bots.push(b);
  }
  const chars = bots.map((b) => world.data.characters[b.char.id]);
  // はじめの 薬草などは のぞく（数を わかりやすく）
  for (const c of chars) c.items = [];
  return { world, bots, chars, store };
}

const res = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const give = (bot, id, to, n = 1) => {
  bot.send({ t: 'menu', action: 'gift', id, to, n });
  return res(bot);
};

test('道具を 家族に あげる（数も。あげた 人は へり、もらった 人は ふえる。知らせ）', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  addItem(papa, 'herb', 5);
  const before = itemCount(yui, 'herb');
  const r = give(bots[0], 'herb', yui.id, 3);
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /ユイに薬草を3こあげた！/);
  assert.equal(itemCount(papa, 'herb'), 2);
  assert.equal(itemCount(yui, 'herb'), before + 3);
  // もらった 人に その 場で 知らせ・新しい ふくろ
  const toast = bots[1].msgs.filter((m) => m.t === 'toast').pop();
  assert.match(toast.text, /パパから薬草を3こもらった！/);
  assert.equal(itemCount(bots[1].char, 'herb'), before + 3);
  // 1こなら「〇〇から△△をもらった！」
  assert.equal(give(bots[0], 'herb', yui.id, 1).ok, true);
  assert.match(bots[1].msgs.filter((m) => m.t === 'toast').pop().text, /^パパから薬草をもらった！$/);
  // 全部 あげると ふくろから 消える
  assert.equal(give(bots[0], 'herb', yui.id, 1).ok, true);
  assert.ok(!papa.items.some((e) => e.id === 'herb'));
});

test('装備品も あげられる（装備している 物は だめ）', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  addItem(papa, WEAPON, 1);
  assert.equal(give(bots[0], WEAPON, yui.id, 1).ok, true);
  assert.equal(itemCount(yui, WEAPON), 1);
  // 装備している ぶき（ふくろには ない）
  const worn = papa.equip.weapon;
  assert.ok(worn, '装備している ぶきが ある');
  papa.items = [];
  const yuiHad = itemCount(yui, worn);
  const r = give(bots[0], worn, yui.id, 1);
  assert.equal(r.ok, false);
  assert.match(r.text, /装備している/);
  assert.equal(papa.equip.weapon, worn);
  assert.equal(itemCount(yui, worn), yuiHad);
});

test('大事な物・1人1つの 品は あげられない', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  addItem(papa, KEY, 1);
  const r = give(bots[0], KEY, yui.id, 1);
  assert.equal(r.ok, false);
  assert.match(r.text, /大事な物はあげられない/);
  assert.ok(papa.keyItems.includes(KEY));
  assert.ok(!yui.keyItems.includes(KEY));
  addItem(papa, UNIQUE, 1);
  const u = give(bots[0], UNIQUE, yui.id, 1);
  assert.equal(u.ok, false);
  assert.equal(itemCount(papa, UNIQUE), 1);
  assert.equal(itemCount(yui, UNIQUE), 0);
});

test('相手の ふくろが いっぱいなら やめる（何も へらない）', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  addItem(papa, 'herb', 5);
  yui.items = yui.items.filter((e) => e.id !== 'herb');
  addItem(yui, 'herb', GIFT_STACK_MAX - 2);
  const r = give(bots[0], 'herb', yui.id, 3);
  assert.equal(r.ok, false);
  assert.match(r.text, /もう薬草が入らない/);
  assert.equal(itemCount(papa, 'herb'), 5);
  assert.equal(itemCount(yui, 'herb'), GIFT_STACK_MAX - 2);
  // ちょうど いっぱいまでは あげられる
  assert.equal(give(bots[0], 'herb', yui.id, 2).ok, true);
  assert.equal(itemCount(yui, 'herb'), GIFT_STACK_MAX);
});

test('相手が いない・自分・へんな 数・持っていない 数は だめ', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  addItem(papa, 'herb', 5);
  const snap = () => [itemCount(papa, 'herb'), itemCount(yui, 'herb')];
  const start = snap();
  for (const to of ['nobody', '__proto__', 'constructor', '', null, 123]) {
    const r = give(bots[0], 'herb', to, 1);
    assert.equal(r.ok, false, String(to));
  }
  assert.match(give(bots[0], 'herb', 'nobody', 1).text, /見つからない/);
  assert.match(give(bots[0], 'herb', papa.id, 1).text, /自分にはあげられない/);
  for (const n of [0, -1, -99, 1.5, 100, 1e9, Infinity, NaN, '3', null, {}]) {
    const r = give(bots[0], 'herb', yui.id, n);
    assert.equal(r.ok, false, String(n));
  }
  assert.match(give(bots[0], 'herb', yui.id, 6).text, /5こしか持っていない/);
  assert.equal(give(bots[0], 'no_such_item', yui.id, 1).ok, false);
  assert.equal(give(bots[0], 'toString', yui.id, 1).ok, false);
  assert.deepEqual(snap(), start);
});

test('遊んでいない 家族にも あげられる（セーブに のこり、つぎに 入った 時に 知らせ）', async () => {
  const { world, bots, chars, store } = await family(['パパ', 'ユイ', 'ケン']);
  const [papa, yui] = chars;
  bots[1].send({ t: 'quit' });
  // 一覧: 自分は 出ない。遊んでいるか
  const list = giftTargets(world, bots[0].s);
  assert.deepEqual(list.map((x) => x.name), ['ユイ', 'ケン']);
  assert.equal(list.find((x) => x.name === 'ユイ').online, false);
  assert.equal(list.find((x) => x.name === 'ケン').online, true);
  bots[0].send({ t: 'menu', action: 'giftList' });
  assert.deepEqual(res(bots[0]).family.map((x) => x.id), list.map((x) => x.id));

  addItem(papa, 'herb', 4);
  const had = itemCount(yui, 'herb');
  assert.equal(give(bots[0], 'herb', yui.id, 4).ok, true);
  assert.equal(itemCount(yui, 'herb'), had + 4);
  assert.equal(yui.tavernNews.length, 1);
  // セーブ → 読みなおしても のこっている
  world.saveNow();
  const up = upgradeSave(store.saved).data;
  assert.equal(itemCount(up.characters[yui.id], 'herb'), had + 4);
  assert.equal(itemCount(up.characters[papa.id], 'herb'), 0);
  assert.equal(up.characters[yui.id].tavernNews[0].gift, true);
  // ユイが 入ると 知らせ
  bots[1].send({ t: 'play', id: yui.id });
  const enter = bots[1].msgs.filter((m) => m.t === 'enter').pop();
  assert.ok(enter.tavernNews.some((t) => /パパから薬草が4こ.*とどいていた！/.test(t)), enter.tavernNews.join('|'));
  assert.equal(yui.tavernNews, undefined);
});

test('スマホで 遊んだ ぶんと 合わせても もらった 物は のこる（merge.js）', async () => {
  const { bots, chars } = await family();
  const [papa, yui] = chars;
  const base = clone(yui);
  // スマホで ユイが 薬草を 1こ 使った
  const phone = clone(yui);
  addItem(phone, 'herb', 1);
  phone.items = phone.items.map((e) => (e.id === 'herb' ? { ...e, n: e.n - 1 } : e)).filter((e) => e.n > 0);
  addItem(papa, 'herb', 3);
  assert.equal(give(bots[0], 'herb', yui.id, 3).ok, true);
  const merged = mergeChars(base, yui, phone);
  assert.equal(itemCount(merged, 'herb'), itemCount(base, 'herb') + 3);
});

test('ひとりで遊ぶ（offline）時は あげられない・一覧も 空', async () => {
  const { world, bots, chars } = await family(['パパ', 'ユイ'], { offline: true });
  const [papa, yui] = chars;
  addItem(papa, 'herb', 2);
  assert.deepEqual(giftTargets(world, bots[0].s), []);
  const r = give(bots[0], 'herb', yui.id, 1);
  assert.equal(r.ok, false);
  assert.equal(itemCount(papa, 'herb'), 2);
});

test('知らせの 文・ゲームの 文字', () => {
  assert.equal(giftNewsText({ item: 'herb', n: 1, from: 'ママ' }, true), 'ママから薬草をもらった！');
  assert.match(tavernNewsText({ gift: true, item: 'herb', n: 2, from: 'ママ' }), /^ママから薬草が2ことどいていた！/);
  for (const f of ['public/js/shared/world/gift.js', 'public/js/client/ui/gift.js']) {
    const probs = checkFile(new URL(`../${f}`, import.meta.url).pathname);
    assert.deepEqual(probs, [], f);
  }
});
