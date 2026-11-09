// 第72回: 呪文・技の メニュー（家族の ねがい）
//   1. 「覚えた技からお気に入りにしても、お気に入りにならない」
//      わけ: お気に入りは 30こ までで、いっぱいの とき サーバーは だまって 入れず（返事は「入れた」）、画面の ★も つぎの 知らせで 消えた。
//      家族サーバーでは 200ミリ秒 まって 画面を つくりなおしていたので、その 間に 前の 自分（self）が とどくと ★が 消え、
//      サーバーの 新しい 自分が とどいても つくりなおさなかった。
//      → 60こ まで（shared/favorites.js）・いっぱいの ときは わけを 出す・サーバーの 返事を まってから つくりなおす
//   2. 「覚えた技を一覧で見ているとき、上部の技カテゴリは見えるようにしていて」
//      → 見方・呪文／特技・種類（職業）の タブも 上に はりつく 見出し（.sk-head）の 中へ。下の せつめいも はりつく
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { FAV_MAX, FAV_FULL_TEXT, favApply, favClean, favFull } from '../public/js/shared/favorites.js';
import { favoriteOrder } from '../public/js/shared/world/services.js';
import { allyFromCharacter } from '../public/js/shared/battle.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, learnedAbilities } from '../public/js/shared/stats.js';
import { FieldMenu } from '../public/js/client/ui/menu.js';
import { Bot } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

// たくさん 技を 覚えた キャラ（家族の ように 長く 遊んだ キャラ）
async function veteran(storage) {
  const world = new GameWorld({ offline: true, rng: makeRng(72), rateLimit: false, ...(storage ? { storage } : {}) });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  const cid = await bot.createAndPlay('mage');
  await bot.settle();
  const c = bot.s.char;
  gainExp(c, expForLevel(60) - c.exp);
  for (const j of Object.keys(JOBS).filter((k) => (JOBS[k].tier || 0) <= 2)) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 0 };
  const learned = learnedAbilities(c);
  assert.ok(learned.length > FAV_MAX + 10, `覚えた 技 ${learned.length}`);
  return { world, bot, c, cid, learned };
}

// 画面の 呪文・技の メニュー（FieldMenu）の「技を えらんだ → 小さな まど → お気に入り」の ところだけ うごかす。
//   pick（まど）は えらぶ 答えを かえす。menuCall は サーバー（Bot）に おくって 返事を かえす。
//   返事の 前に とどいた 自分（self）を 画面の キャラ（game.me）に 入れる（client/game.js と おなじ）
function fakeMenu(bot, answer) {
  const m = Object.create(FieldMenu.prototype);
  const asked = [];
  m.game = { me: bot.char, party: bot.party, audio: { sfx: () => {} }, net: { send: (msg) => bot.send(msg) } };
  m.pick = async (title, items, opts) => {
    asked.push({ title, items, opts });
    return typeof answer === 'function' ? answer(items) : answer;
  };
  m.menuCall = async (msg) => {
    bot.send(msg);
    m.game.me = bot.char;
    return lastMenu(bot);
  };
  return { m, asked };
}

// ───────────── 1. お気に入り ─────────────
test('お気に入りの きまり: 60こ まで・かさならない・ない 技は だめ・いっぱいの ときは 覚えていない 技を さきに すてる', () => {
  assert.equal(FAV_MAX, 60);
  assert.match(FAV_FULL_TEXT, /60こまで/);
  assert.doesNotMatch(FAV_FULL_TEXT, /\s/, '空白なし');
  assert.deepEqual(favClean(['mera', 'mera', 'no_such', 3, 'hoimi']), ['mera', 'hoimi']);
  assert.deepEqual(favApply(['mera'], 'hoimi', 'add'), { ok: true, list: ['mera', 'hoimi'] });
  assert.deepEqual(favApply(['mera', 'hoimi'], 'mera', 'add').list, ['mera', 'hoimi'], 'もう 入っている');
  assert.deepEqual(favApply(['mera', 'hoimi'], 'mera', 'remove').list, ['hoimi']);
  assert.deepEqual(favApply(['mera', 'hoimi'], 'hoimi', 'up').list, ['hoimi', 'mera']);
  assert.deepEqual(favApply(['mera', 'hoimi'], 'hoimi', 'down').list, ['mera', 'hoimi'], 'はしで とまる');
  assert.equal(favApply(['mera'], 'no_such', 'add').ok, false);
  assert.equal(favApply(['mera'], 'hoimi', 'xx').ok, false);
  const ids = Object.keys(ABILITIES);
  const full = ids.slice(0, FAV_MAX);
  // まえ（30こ）は ここで だまって すてていた
  assert.equal(favApply(ids.slice(0, 30), ids[100], 'add').ok, true, '30こ でも 入る');
  const r = favApply(full, ids[100], 'add');
  assert.equal(r.ok, false);
  assert.equal(r.full, true);
  assert.deepEqual(r.list, full, 'いっぱいの ときは かわらない');
  assert.equal(favFull(full), true);
  assert.equal(favFull(full.slice(1)), false);
  // 覚えていない 技は 数えない・いっぱいの ときに すてる
  const learned = new Set(full.slice(10));
  assert.equal(favFull(full, learned), false);
  const r2 = favApply(full, ids[100], 'add', learned);
  assert.equal(r2.ok, true);
  assert.deepEqual(r2.list, [...full.slice(10), ids[100]]);
  // ならびの まとめ（op: order）も 60こ まで
  assert.deepEqual(favoriteOrder(full, full.slice().reverse()), full.slice().reverse());
  const over = ids.slice(0, FAV_MAX + 1);
  assert.equal(favoriteOrder(over, over.slice().reverse()), null);
  // 戦いの 人の お気に入りも 60こ（shared/battle.js の allyFromCharacter）
  const a = allyFromCharacter({ name: 'x', job: 'mage', jobs: { mage: { lv: 1 } }, level: 1, hp: 10, mp: 10, equip: {}, favorites: over });
  assert.equal(a.favs.length, FAV_MAX);
});

test('覚えた技の まど → ★お気に入りに入れる: サーバーにも 画面の キャラにも 入る（30こ いっぱいでも）・はずせる・セーブに のこる', async () => {
  const saved = [];
  const { world, bot, c, cid, learned } = await veteran({ load: () => ({}), save: (d) => saved.push(JSON.parse(JSON.stringify(d))) });
  // 家族の キャラ: お気に入りが 30こ（まえの いっぱい）
  c.favorites = learned.slice(0, 30);
  world.sendSelf(bot.s);
  const id = learned[40];
  assert.ok(!bot.char.favorites.includes(id));
  // 覚えた技で えらぶ → まどで「★ お気に入りに入れる」
  const { m, asked } = fakeMenu(bot, (items) => items.find((x) => x.label === '★ お気に入りに入れる')?.value);
  const act = await m.skillAsk(m.game.me, id, { use: null });
  assert.equal(act, 'add');
  assert.equal(asked[0].title, ABILITIES[id].name);
  const did = await m.doSkillAct(m.game.me, 'self', id, act);
  assert.equal(did, 'fav', 'サーバーの 返事まで まった');
  assert.equal(lastMenu(bot).ok, true);
  assert.match(lastMenu(bot).text, /お気に入りに入れた/);
  assert.equal(c.favorites.length, 31);
  assert.ok(c.favorites.includes(id), 'サーバー');
  assert.ok(m.game.me.favorites.includes(id), '画面の キャラ（つくりなおすと ★）');
  // もう一度 えらぶと「お気に入りからはずす」
  const again = fakeMenu(bot, (items) => items.find((x) => x.value === 'remove')?.value);
  assert.equal(await again.m.skillAsk(again.m.game.me, id, { use: null }), 'remove');
  await again.m.doSkillAct(again.m.game.me, 'self', id, 'remove');
  assert.ok(!c.favorites.includes(id));
  assert.ok(!again.m.game.me.favorites.includes(id));
  // 入れなおして セーブ → 読みこみ
  await m.doSkillAct(bot.char, 'self', id, 'add');
  world.markDirty();
  world.saveNow();
  const data = saved.pop();
  assert.ok(data.characters[cid].favorites.includes(id), 'セーブに のる');
  const w2 = new GameWorld({ offline: true, rng: makeRng(73), rateLimit: false, storage: { load: () => JSON.parse(JSON.stringify(data)), save: () => {} } });
  const b2 = new Bot(w2, 'ユイ');
  await b2.login();
  b2.send({ t: 'play', id: cid });
  await b2.settle();
  assert.ok(b2.char.favorites.includes(id), '読みこんだ あとも');
});

test('お気に入りが いっぱい（60こ）: まどの「★ お気に入りに入れる」は うすく・わけを 出す。サーバーも ことわって わけを 返す', async () => {
  const { world, bot, c, learned } = await veteran();
  c.favorites = learned.slice(0, FAV_MAX);
  world.sendSelf(bot.s);
  const id = learned[FAV_MAX + 3];
  const { m, asked } = fakeMenu(bot, null);
  await m.skillAsk(m.game.me, id, { use: null });
  const add = asked[0].items.find((x) => x.value === 'add');
  assert.equal(add.disabled, true);
  assert.equal(add.label, `★ お気に入りに入れる（${FAV_MAX}こでいっぱい）`);
  assert.equal(asked[0].opts.note.text, FAV_FULL_TEXT);
  // はずす のは できる
  const fav = learned[0];
  await m.skillAsk(m.game.me, fav, { use: null });
  assert.ok(asked[1].items.some((x) => x.value === 'remove' && !x.disabled));
  // サーバー: ことわる（まえは「入れた」と 返して だまって すてていた）
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id, op: 'add' });
  assert.equal(lastMenu(bot).ok, false);
  assert.equal(lastMenu(bot).text, FAV_FULL_TEXT);
  assert.equal(c.favorites.length, FAV_MAX);
  assert.ok(!c.favorites.includes(id));
  // 覚えていない 技が まじっている ときは それを すてて 入れる
  c.favorites = [...Object.keys(ABILITIES).filter((x) => !learned.includes(x)).slice(0, 5), ...learned.slice(0, FAV_MAX - 5)];
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id, op: 'add' });
  assert.equal(lastMenu(bot).ok, true);
  assert.ok(c.favorites.includes(id));
  assert.ok(c.favorites.every((x) => learned.includes(x)));
});

test('お気に入りを かえる 所（覚えた技・回復・回復以外・お気に入り・戦い）: どこも サーバーの 返事を まってから つくりなおす・いっぱいは ことわる', () => {
  const mn = src('js/client/ui/menu.js');
  const sk = mn.slice(mn.indexOf('  skillsView(active, who'), mn.indexOf('  sendFavOrder('));
  // まえは「おくって 200ミリ秒 あとに つくりなおす」（返事を またない）
  assert.doesNotMatch(sk, /this\.doSkillAct\([^)]*\)\) return this\.reSkills\(who, 200\)/);
  assert.equal((sk.match(/await this\.doSkillAct\(c, who, it\.value, (act|op)\)/g) || []).length, 3, '回復・回復以外／お気に入り／覚えた技');
  assert.equal((sk.match(/this\.reSkills\(who, did === 'cmd' \? 200 : 0\)/g) || []).length, 3);
  const send = mn.slice(mn.indexOf('  sendFav(c, who, id, op) {'), mn.indexOf('  // ───── 第71回: 命令の 一覧に'));
  assert.ok(mn.indexOf('  sendFav(') > mn.indexOf('  skillsView('), 'ほかの テストが 見る ところ');
  assert.match(send, /favApply\(c\.favorites, id, op, new Set\(learnedAbilities\(c\)\)\)/);
  assert.match(send, /return this\.menuCall\(\{ t: 'menu', action: 'favorite', who: who \|\| 'self', id, op \}\)/);
  assert.match(send, /toast\(FAV_FULL_TEXT\)/);
  const b = src('js/client/battle.js');
  const tf = b.slice(b.indexOf('  toggleFav(a, id) {'), b.indexOf('  // keep: お気に入りを かえた ときなど'));
  assert.match(tf, /if \(on && favFull\(favs, new Set\(a\.abilities \|\| \[\]\)\)\) \{\s*toast\(FAV_FULL_TEXT\)/);
  assert.match(tf, /this\.localFavs\.set\(a\.id, prev\)/, 'サーバーが ことわったら 手もとも もどす');
  const sv = src('js/shared/world/services.js');
  assert.match(sv, /const r = favApply\(who\.favorites, id, msg\.op, new Set\(learnedAbilities\(who\)\)\);\s*if \(!r\.ok\) return reply\(false, r\.full \? FAV_FULL_TEXT : ''\);/);
  assert.doesNotMatch(sv, /favorites = list\.slice\(0, 30\)/);
});

// ───────────── 2. 覚えた技の 見出し ─────────────
test('覚えた技: 見方・呪文／特技・種類（職業）の タブは 上に はりつく 見出しの 中・下の せつめいも はりつく・カーソルは かくれない', () => {
  const mn = src('js/client/ui/menu.js');
  const sk = mn.slice(mn.indexOf('  skillsView(active, who'), mn.indexOf('  sendFavOrder('));
  const learnedPart = sk.slice(sk.indexOf('const pref = this.learnPref();'));
  assert.match(learnedPart, /head\.classList\.add\('lv-head'\)/);
  assert.match(learnedPart, /head\.append\(el\('div', \{ class: 'lv-bar' \}/);
  assert.match(learnedPart, /head\.append\(subBar\)/);
  assert.doesNotMatch(learnedPart, /box\.append\(el\('div', \{ class: 'lv-bar' \}/, 'まえは わくと いっしょに スクロールして 見えなくなった');
  assert.doesNotMatch(learnedPart, /box\.append\(subBar\)/);
  assert.match(learnedPart, /this\.stickInfo\(box, info\)/);
  // お気に入り（つかんでいない とき）も せつめいが 下に はりつく
  assert.match(sk, /if \(!grab\) this\.stickInfo\(box, info\)/);
  // 見出しの 高さ → カーソルの 行の scroll-margin-top（ListMenu の scrollToSel が 見る）
  assert.match(sk, /box\.style\.setProperty\('--sk-head-h', `\$\{head\.offsetHeight \+ 12\}px`\)/);
  const si = mn.slice(mn.indexOf('  stickInfo(box, info) {'), mn.indexOf('  // 第71回 E: つくりなおす'));
  assert.match(si, /box\.style\.setProperty\('--sk-info-h', `\$\{info\.offsetHeight \+ 12\}px`\)/);
  assert.match(si, /info\.style\.bottom = `\$\{-pb\}px`/);
  const css = src('css/style.css');
  assert.match(css, /\.skills-view \.sk-head \{ position: sticky; top: 0;/);
  assert.match(css, /\.skills-view \.menu \.item \{ scroll-margin-top: var\(--sk-head-h/);
  const r69 = src('js/client/ui/r69-css.js');
  assert.match(r69, /\.fav-info\.lv-info \{ position: sticky; bottom: 0;/);
  assert.match(r69, /\.skills-view\.sticky-info \.menu\.fav-grid \.item \{ scroll-margin-bottom: var\(--sk-info-h, 8\.5em\); \}/);
  assert.match(r69, /\.skills-view \.sk-head \.lv-bar \{/);
  // ListMenu: 上に はりついた 見出しの 下に かくれた 行は 見出しの 下まで スクロール
  const dom = src('js/client/ui/dom.js');
  assert.match(dom.slice(dom.indexOf('  scrollToSel() {')), /scrollMarginTop/);
});
