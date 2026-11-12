// 第78回 3-6: メニューの「かんたん表示」（docs/plan-r78.md の 2・docs/plan-r78-simple.md）
//   設定の「メニューの表示：くわしい／かんたん」。キャラごと（c.menuView。かんたん の 時だけ のこる）。ふだんは くわしい
//   かんたん で かくす: 覚えた技の 見方・タブ（強い じゅんの 1つの 一覧・2列）／お気に入りの 動かす／えらぶ まどの「命令の一覧に出さない」
//   のこす: 使う・お気に入りの 入／切・回復／回復以外・戦いの L/R と ブロック移動
//   かくす だけ: autoOff・cmdOff・お気に入りの 並びは さわらない（戦いの 一覧・オートの 動きは かわらない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { MENU_VIEWS, SIMPLE_NOTE, menuSimple, menuViewOf, setMenuView, simpleLearnOrder } from '../public/js/shared/menu-view.js';
import { sortByStdPower, skillStdPower } from '../public/js/shared/skill-sort.js';
import { allyFromCharacter, normBattleSettings } from '../public/js/shared/battle.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { newCharacter, gainExp, expForLevel, learnedAbilities } from '../public/js/shared/stats.js';
import { FieldMenu } from '../public/js/client/ui/menu.js';
import { Bot } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

async function hero(job = 'mage', level = 30) {
  const world = new GameWorld({ offline: true, rng: makeRng(78), rateLimit: false });
  const bot = new Bot(world, 'ミオ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = bot.s.char;
  gainExp(c, expForLevel(level) - c.exp);
  for (const j of Object.keys(JOBS).filter((k) => (JOBS[k].tier || 0) <= 1)) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 0 };
  return { world, bot, s: bot.s, c };
}

// 呪文・技の メニューの えらぶ まど（skillAsk）だけ うごかす（test/skill-menu-r72.test.js と おなじ やりかた）
function fakeMenu(me) {
  const m = Object.create(FieldMenu.prototype);
  const asked = [];
  m.game = { me, audio: { sfx: () => {} }, net: { send: () => {} } };
  m.pick = async (title, items, opts) => {
    asked.push({ title, items, opts });
    return null;
  };
  return { m, asked };
}

// ───────────── 保存（キャラごと・ふだんは くわしい） ─────────────
test('ふだんは くわしい（新しい キャラ・今の キャラ・知らない 値）', () => {
  assert.equal(menuSimple(newCharacter({ id: 'x1', name: 'ユウ', job: 'warrior' })), false);
  assert.equal(menuViewOf({}), 'full');
  assert.equal(menuViewOf(null), 'full');
  assert.equal(menuViewOf({ menuView: 'easy' }), 'full', '知らない 値は くわしい');
  assert.equal(menuViewOf({ menuView: 'simple' }), 'simple');
  assert.deepEqual(MENU_VIEWS, { full: 'くわしい', simple: 'かんたん' });
  assert.equal(SIMPLE_NOTE, 'かんたん表示（設定で変えられます）');
});

test('setMenuView: かんたん の 時だけ 項目が のこる（くわしい・知らない 値は 消す）', () => {
  const c = {};
  assert.equal(setMenuView(c, 'simple'), true);
  assert.equal(c.menuView, 'simple');
  assert.equal(setMenuView(c, 'simple'), false, 'かわらない');
  assert.equal(setMenuView(c, 'full'), true);
  assert.equal('menuView' in c, false);
  c.menuView = 'simple';
  setMenuView(c, '<script>');
  assert.equal('menuView' in c, false);
});

test('サーバーの settings: menuView を キャラに 入れる。ほかの 設定は かわらない。もう 1人の キャラは くわしい の まま', async () => {
  const { world, bot, c } = await hero('mage', 10);
  assert.equal('menuView' in c, false, '新しい キャラは くわしい（項目なし）');
  c.battleSettings = { ...(c.battleSettings || {}), wait: true, auto: true, speed: 0.6 };
  c.difficulty = { exp: 0.5 };
  const sp = normBattleSettings(c.battleSettings).speed;
  bot.send({ t: 'menu', action: 'settings', menuView: 'simple' });
  assert.equal(lastMenu(bot).ok, true);
  assert.equal(c.menuView, 'simple');
  assert.equal(c.battleSettings.wait, true);
  assert.equal(c.battleSettings.auto, true);
  assert.equal(c.battleSettings.speed, sp);
  assert.deepEqual(c.difficulty, { exp: 0.5 });
  // クライアントの 自分（self）にも のる
  const self = bot.msgs.filter((m) => m.t === 'self').pop();
  assert.equal(self.char.menuView, 'simple');
  // ほかの 設定を かえても のこる
  bot.send({ t: 'menu', action: 'settings', wait: false });
  assert.equal(c.menuView, 'simple');
  // 2人めの キャラ（おなじ 家族サーバー）は くわしい
  const bot2 = new Bot(world, 'リク');
  await bot2.login();
  await bot2.createAndPlay('warrior');
  await bot2.settle();
  assert.equal(menuSimple(bot2.s.char), false);
  // くわしい に もどすと 項目が 消える
  bot.send({ t: 'menu', action: 'settings', menuView: 'full' });
  assert.equal('menuView' in c, false);
});

test('引っこしコード: くわしい（ふだん）は コードに 入らない。かんたん は 入って もどる（transfer.js は そのまま）', () => {
  const c = newCharacter({ id: 'abc123', name: 'ユウ', job: 'warrior' });
  const full = parseCode(exportCode(c, 1));
  assert.equal(full.ok, true);
  assert.equal('menuView' in full.char, false);
  const len0 = exportCode(c, 1).length;
  setMenuView(c, 'simple');
  const code = exportCode(c, 1);
  const back = parseCode(code);
  assert.equal(back.ok, true);
  assert.equal(back.char.menuView, 'simple');
  assert.ok(code.length > len0, 'かんたん の 時だけ すこし 長く なる');
  assert.ok(code.length - len0 < 30, `ふえるのは 少し（${code.length - len0}文字）`);
});

// ───────────── かくす だけ（データは かわらない） ─────────────
test('かんたん に しても autoOff・cmdOff・お気に入りの ならびは かわらない。戦いの 人も おなじ。くわしい に もどすと 元どおり', async () => {
  const { bot, c } = await hero('mage', 20);
  const learned = learnedAbilities(c).filter((id) => !ABILITIES[id].fieldOnly);
  assert.ok(learned.length >= 4);
  const [a, b, d, e] = learned;
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', id: a, op: 'off' });
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', id: b, op: 'off' });
  for (const id of [d, e, a]) bot.send({ t: 'menu', action: 'favorite', who: 'self', id, op: 'add' });
  bot.send({ t: 'menu', action: 'favorite', who: 'self', op: 'order', ids: [a, e, d] });
  const snap = () => JSON.stringify({ cmdOff: c.cmdOff, autoOff: c.autoOff, favorites: c.favorites });
  const ally = () => {
    const x = allyFromCharacter(c);
    return JSON.stringify({ cmdOff: x.cmdOff, autoOff: x.autoOff, favs: x.favs });
  };
  const before = snap();
  const allyBefore = ally();
  bot.send({ t: 'menu', action: 'settings', menuView: 'simple' });
  assert.equal(snap(), before, 'データは そのまま');
  assert.equal(ally(), allyBefore, '戦いの 一覧（cmdOff）・オート（autoOff）・★の タブ（favs）も そのまま');
  bot.send({ t: 'menu', action: 'settings', menuView: 'full' });
  assert.equal(snap(), before);
  assert.equal(ally(), allyBefore);
});

test('戦い（client/battle.js・shared/battle.js・ai.js）は かんたん表示を 見ない（L/R・ブロック移動・cmdOff は そのまま）', () => {
  for (const p of ['js/client/battle.js', 'js/shared/battle.js', 'js/shared/ai.js']) {
    assert.doesNotMatch(src(p), /menuView|menuSimple|menu-view\.js/, p);
  }
  const bt = src('js/client/battle.js');
  assert.match(bt, /onLR/);
  assert.match(bt, /cmdOff/);
});

// ───────────── えらぶ まど（skillAsk） ─────────────
test('えらぶ まど: かんたん は「使う／お気に入り／やめる」だけ。くわしい は「命令の一覧に出さない」も', async () => {
  const me = { name: 'ミオ', job: 'mage', jobs: { mage: { lv: 10, b: 0 } }, favorites: [], level: 20 };
  const id = 'mera';
  assert.ok(ABILITIES[id]);
  // くわしい
  let t = fakeMenu(me);
  await t.m.skillAsk(me, id, { use: { ok: true }, pre: [] });
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['use', 'add', 'cmd', null]);
  // かんたん
  me.menuView = 'simple';
  t = fakeMenu(me);
  await t.m.skillAsk(me, id, { use: { ok: true } });
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['use', 'add', null]);
  assert.deepEqual(t.asked[0].items.map((x) => x.label), ['使う', '★ お気に入りに入れる', 'やめる']);
  // 命令に 出さない 技でも 切りかえは 出ない（そのまま 効く ことは 書く）
  me.cmdOff = [id];
  t = fakeMenu(me);
  await t.m.skillAsk(me, id, {});
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['add', null]);
  assert.match(t.asked[0].opts.note.text, /くわしい表示で変えられる/);
  assert.deepEqual(me.cmdOff, [id]);
  // くわしい に もどすと 元どおり
  delete me.menuView;
  t = fakeMenu(me);
  await t.m.skillAsk(me, id, {});
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['add', 'cmd', null]);
  assert.equal(t.asked[0].items[1].label, '命令の一覧に出す');
});

test('お気に入りの タブの まど: かんたん は「動かす」を 出さない（はずす は のこる）。くわしい は 前の とおり', async () => {
  const me = { name: 'ミオ', job: 'mage', jobs: { mage: { lv: 10, b: 0 } }, favorites: ['mera'], level: 20 };
  const pre = [{ label: '動かす', value: 'move' }];
  let t = fakeMenu(me);
  await t.m.skillAsk(me, 'mera', { pre });
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['move', 'remove', 'cmd', null]);
  me.menuView = 'simple';
  t = fakeMenu(me);
  await t.m.skillAsk(me, 'mera', { pre });
  assert.deepEqual(t.asked[0].items.map((x) => x.value), ['remove', null]);
  assert.deepEqual(me.favorites, ['mera']);
});

test('仲間の 呪文・技の 画面は 自分（主人公）の 設定に したがう', async () => {
  const me = { name: 'ミオ', menuView: 'simple', favorites: [] };
  const mate = { name: 'ミナ', companion: true, favorites: [] };
  const t = fakeMenu(me);
  await t.m.skillAsk(mate, 'mera', {});
  assert.equal(t.asked[0].items.some((x) => x.value === 'cmd'), false);
});

// ───────────── 覚えた技: 強い じゅんの 1つの 一覧 ─────────────
test('simpleLearnOrder: ダメージ・回復の ある 技が 強い じゅん → そのほか（MPの 多い じゅん）。くわしい（弱い じゅん）と おなじ 技', async () => {
  const { c } = await hero('mage', 40);
  const learned = learnedAbilities(c);
  const order = simpleLearnOrder(learned);
  assert.deepEqual([...order].sort(), [...learned].sort(), '技は へらない・ふえない');
  const pows = order.map(skillStdPower);
  const n = pows.filter((p) => p > 0).length;
  assert.ok(n >= 3);
  for (let i = 0; i < n; i++) assert.ok(pows[i] > 0, 'ダメージ・回復の ある 技が さき');
  for (let i = 1; i < n; i++) assert.ok(pows[i - 1] >= pows[i], `強い じゅん ${i}`);
  for (let i = n; i < order.length; i++) assert.equal(pows[i], 0);
  for (let i = n + 1; i < order.length; i++) assert.ok((ABILITIES[order[i - 1]].mp || 0) >= (ABILITIES[order[i]].mp || 0));
  // くわしい の 中の じゅん（弱い じゅん）は かわらない
  assert.equal(sortByStdPower(learned)[0], order[n - 1]);
  assert.deepEqual(simpleLearnOrder([]), []);
  assert.deepEqual(simpleLearnOrder(['no_such', 'mera']), ['mera', 'no_such']);
});

test('メニューの 画面（menu.js）: かんたん で かくす 物・のこす 物', () => {
  const mn = src('js/client/ui/menu.js');
  const sk = mn.slice(mn.indexOf('  skillsView(active, who'), mn.indexOf('  sendFavOrder('));
  // 自分の キャラの 設定（仲間の 画面も おなじ）
  assert.match(sk, /const simple = menuSimple\(g\.me\)/);
  // すみの ひとこと
  assert.match(sk, /class: 'simple-note', text: SIMPLE_NOTE/);
  // 覚えた技: 見方・タブ・L/R・Y を 出さない。1つの 一覧（強い じゅん）・2列
  assert.match(sk, /simple \? \[\{ key: 'simple'[^\n]*simpleLearnOrder\(learned\)/);
  assert.match(sk, /const cols = !simple && battleDensityPref\(\) === 3 \? 3 : 2/);
  assert.match(sk, /if \(!simple\) head\.append\(el\('div', \{ class: 'lv-bar' \}/);
  assert.match(sk, /\.\.\.\(simple \? \{\} : \{\s*onLR:/);
  // お気に入り: 動かす は skillAsk が 出さない（上の テスト）
  const ask = mn.slice(mn.indexOf('  skillAsk(c, id'), mn.indexOf('  doSkillAct('));
  assert.match(ask, /if \(!simple\) items\.push\(\.\.\.pre\)/);
  assert.match(ask, /if \(!simple && this\.cmdHideable\(a\)\)/);
  // 回復・回復以外の タブ・使う は そのまま（SKILL_TABS は かわらない）
  assert.match(mn, /const SKILL_TABS = \[\['list', '覚えた技'\], \['heal', '回復'\], \['other', '回復以外'\], \['fav', 'お気に入り'\]/);
  // 設定の 行
  const st = mn.slice(mn.indexOf('  settingsView(active)'), mn.indexOf('  pickExpRate('));
  assert.match(st, /メニューの表示：\$\{MENU_VIEWS\[menuViewOf\(c\)\]\}/);
  assert.match(st, /action: 'settings', menuView: next/);
});
