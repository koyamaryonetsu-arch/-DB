// 第50回 N7: チャットの スタンプを 変える（data/stamps.js・client/ui/stamps.js）
// ・はじめの スタンプ（前の 8こ ＋ 4こ）・えらべる ことばの 一覧（漢字の きまり）
// ・サーバーの 変える しくみ（長すぎる・多すぎる・文字で ない・見えない 文字）
// ・セーブを 読んだ ときの 手直し・HUD の スタンプの 一覧が 自分の スタンプに なる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { repairChar } from '../public/js/shared/world/save.js';
import {
  STAMP_SLOTS, STAMP_LEN, DEFAULT_STAMPS, STAMP_PRESETS, STAMP_EDIT, stampsOf, stampMenuItems, setStamps, cleanStamps, cleanStampText,
  putStamp, dropStamp, moveStamp,
} from '../public/js/shared/data/stamps.js';
import { checkText, checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const src = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

async function setup(seed = 5) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  return { world, bot, c };
}

test('はじめの スタンプ: 前の 8こ ＋ 4こ で 12こ（どれも 12文字まで）', () => {
  assert.equal(STAMP_SLOTS, 12);
  assert.equal(STAMP_LEN, 12);
  assert.equal(DEFAULT_STAMPS.length, 12);
  assert.deepEqual(DEFAULT_STAMPS.slice(0, 8), ['よろしく！', 'ありがとう！', '行くよー！', '助けて！', '待ってて！', 'やったね！', 'おつかれさま', 'ご飯だよ〜']);
  assert.equal(new Set(DEFAULT_STAMPS).size, 12);
  for (const s of DEFAULT_STAMPS) assert.ok(s.length >= 1 && s.length <= STAMP_LEN, s);
  assert.deepEqual(stampsOf({}), [...DEFAULT_STAMPS]);
  assert.deepEqual(stampsOf(null), [...DEFAULT_STAMPS]);
  assert.deepEqual(stampsOf({ stamps: 'こわれた' }), [...DEFAULT_STAMPS]);
  // HUD の STAMPS は はじめの スタンプ
  assert.match(src('js/client/ui/hud.js'), /export const STAMPS = DEFAULT_STAMPS;/);
});

test('えらべる ことば: 40こ 以上・なかまわけ・12文字まで・使える 漢字だけ・スペースなし', () => {
  const names = STAMP_PRESETS.map((p) => p.name);
  assert.deepEqual(names, ['あいさつ', 'おねがい', '気持ち', '家族', 'ゲーム']);
  const all = STAMP_PRESETS.flatMap((p) => p.list);
  assert.ok(all.length >= 40, `${all.length}こ`);
  for (const p of STAMP_PRESETS) assert.equal(new Set(p.list).size, p.list.length, `${p.name} に 同じ ことばが ない`);
  for (const s of [...all, ...DEFAULT_STAMPS]) {
    assert.ok(s.length >= 1 && s.length <= STAMP_LEN, s);
    assert.equal(cleanStampText(s), s, s);
    assert.deepEqual(checkText(s), [], s);
  }
  // 家族の ことば
  for (const s of ['ご飯だよ〜', 'おふろ空いたよ', 'ねるよー', '宿題終わった？']) assert.ok(all.includes(s), s);
  for (const s of ['レベル上がった！', 'ボス行こう！', '宝箱あった！']) assert.ok(all.includes(s), s);
  // はじめの スタンプは どれも 一覧から 選びなおせる
  for (const s of DEFAULT_STAMPS) assert.ok(all.includes(s), s);
  // 漢字チェックの ファイルに 入っている
  const files = gameFiles().filter((f) => /\/(shared\/data|client\/ui)\/stamps\.js$/.test(f));
  assert.equal(files.length, 2, files.join('\n'));
  for (const f of files) assert.deepEqual(checkFile(f), [], f);
});

test('ことばを きれいに: 見えない 文字を けす・12文字まで・文字で ない ものは ""', () => {
  assert.equal(cleanStampText(' がんばろう！\n'), 'がんばろう！');
  assert.equal(cleanStampText('や\u0000っ\u001bた\u007f\u200bね\u202e'), 'やったね');
  assert.equal(cleanStampText('あいうえおかきくけこさしすせそ'), 'あいうえおかきくけこさし');
  assert.equal(cleanStampText('あいうえおかきくけこさ😀'), 'あいうえおかきくけこさ', '切れた 絵文字は けす');
  for (const v of [null, undefined, 3, {}, ['a'], '\n\t', '   ']) assert.equal(cleanStampText(v), '', String(v));
});

test('setStamps: 1〜12こ・12文字まで・文字だけ。だめな ときは 変えない', () => {
  const c = {};
  const ng = (list, why) => {
    const before = JSON.stringify(c);
    const r = setStamps(c, list);
    assert.equal(r.ok, false, why);
    assert.equal(JSON.stringify(c), before, `${why}: 変わらない`);
  };
  ng(undefined, 'ない');
  ng('よろしく！', '一覧で ない');
  ng([], 'からっぽ');
  ng(Array(13).fill('やあ'), '13こ（多すぎる）');
  ng(['よろしく！', 5], '数');
  ng(['よろしく！', null], 'null');
  ng(['よろしく！', { s: 'x' }], 'もの');
  ng(['あいうえおかきくけこさしす'], '13文字（長すぎる）');
  ng(['x'.repeat(5000)], 'とても長い');
  ng(['\u0000\n\t'], '見えない 文字だけ');
  ng(['よろしく！', '   '], '空白だけ');

  let r = setStamps(c, ['がんばろう！', 'おふろ空いたよ']);
  assert.equal(r.ok, true);
  assert.deepEqual(c.stamps, ['がんばろう！', 'おふろ空いたよ']);
  // 見えない 文字・前後の 空白は けして 入れる
  r = setStamps(c, [' や\u0000ったね\n', 'ボス行こう！']);
  assert.equal(r.ok, true);
  assert.deepEqual(c.stamps, ['やったね', 'ボス行こう！']);
  // 12こ ちょうど・12文字 ちょうど
  r = setStamps(c, Array.from({ length: 12 }, (_, i) => `あいうえおかきくけこ${i % 10}！`));
  assert.equal(r.ok, true);
  assert.equal(c.stamps.length, 12);
  // もとどおりに したら 消す
  r = setStamps(c, [...DEFAULT_STAMPS]);
  assert.equal(r.ok, true);
  assert.equal(c.stamps, undefined);
});

test('サーバー: メニューの stamps で 変わる（自分の キャラだけ・戦いの 中は できない）', async () => {
  const { bot, c } = await setup(7);
  bot.send({ t: 'menu', action: 'stamps', list: ['ねるよー', 'がんばろう！', 'ご飯だよ〜'] });
  assert.equal(lastRes(bot).ok, true);
  assert.equal(lastRes(bot).text, '', '知らせは 出さない');
  assert.deepEqual(c.stamps, ['ねるよー', 'がんばろう！', 'ご飯だよ〜']);
  assert.deepEqual(bot.char.stamps, ['ねるよー', 'がんばろう！', 'ご飯だよ〜'], 'self で 画面にも とどく');
  // だめな 一覧は 変えない
  bot.send({ t: 'menu', action: 'stamps', list: [...Array(13)].map(() => 'やあ') });
  assert.equal(lastRes(bot).ok, false);
  bot.send({ t: 'menu', action: 'stamps', list: ['ok', 42] });
  assert.equal(lastRes(bot).ok, false);
  assert.deepEqual(c.stamps, ['ねるよー', 'がんばろう！', 'ご飯だよ〜']);
  // 戦いの 中では できない
  bot.s.busy = true;
  bot.send({ t: 'menu', action: 'stamps', list: ['あ'] });
  assert.equal(lastRes(bot).ok, false);
  bot.s.busy = false;
  assert.deepEqual(c.stamps, ['ねるよー', 'がんばろう！', 'ご飯だよ〜']);
  // チャットの スタンプは 今までどおり 12文字までの ことばなら なんでも おくれる
  bot.msgs.length = 0;
  bot.send({ t: 'chat', stamp: 'がんばろう！' });
  const chat = bot.msgs.find((m) => m.t === 'chat');
  assert.equal(chat.stamp, 'がんばろう！');
  assert.equal(chat.from, c.name);
});

test('セーブを 読んだ ときの 手直し（repairChar）: のこる・こわれた ものは なおす', async () => {
  const { world, c } = await setup(9);
  c.stamps = ['ねるよー', 'がんばろう！'];
  const back = repairChar(JSON.parse(JSON.stringify(c)), c.id);
  assert.deepEqual(back.stamps, ['ねるよー', 'がんばろう！'], 'セーブして 読んでも のこる');
  // サーバーの セーブにも 入る
  assert.deepEqual(JSON.parse(JSON.stringify(world.data)).characters[c.id].stamps, ['ねるよー', 'がんばろう！']);

  const fix = (stamps) => { const x = { stamps }; cleanStamps(x); return x.stamps; };
  assert.deepEqual(fix(['あ\nい', 5, '', 'うえお']), ['あい', 'うえお'], '文字で ない・からっぽは すてる');
  assert.equal(fix(Array(30).fill('やあ')).length, 12, '13こめ からは すてる');
  assert.deepEqual(fix(['あいうえおかきくけこさしすせそ']), ['あいうえおかきくけこさし']);
  assert.equal(fix('こわれた'), undefined);
  assert.equal(fix([]), undefined);
  assert.equal(fix([1, null]), undefined);
  assert.equal(fix([...DEFAULT_STAMPS]), undefined, 'もとどおりなら のこさない');
  const none = {};
  cleanStamps(none);
  assert.ok(!('stamps' in none), 'ない ときは ないまま');
  // 何回 なおしても おなじ
  const x = repairChar({ name: 'ミナ', stamps: ['や\u0000あ', 'ねるよー'] }, 'x1');
  const y = repairChar(JSON.parse(JSON.stringify(x)), 'x1');
  assert.deepEqual(y.stamps, ['やあ', 'ねるよー']);
  // ひきつぎの 合言葉には 入れない
  assert.doesNotMatch(readFileSync(new URL('../public/js/shared/world/transfer.js', import.meta.url), 'utf8'), /stamps/);
});

test('HUD の スタンプの 一覧: 自分の スタンプ ＋「スタンプを変える」', () => {
  const items = stampMenuItems({ stamps: ['ねるよー', 'がんばろう！'] });
  assert.deepEqual(items.map((i) => i.label), ['ねるよー', 'がんばろう！', 'スタンプを変える']);
  assert.deepEqual(items.map((i) => i.value), ['ねるよー', 'がんばろう！', STAMP_EDIT]);
  const def = stampMenuItems({});
  assert.equal(def.length, 13);
  assert.deepEqual(def.slice(0, 12).map((i) => i.value), [...DEFAULT_STAMPS]);
  const hud = src('js/client/ui/hud.js');
  assert.match(hud, /items: stampMenuItems\(g\.me\)/);
  assert.match(hud, /if \(it\.value === STAMP_EDIT\) return openStampEditor\(g\)/);
  assert.doesNotMatch(hud, /STAMPS\.map/);
  // 設定からも 開ける
  const menu = src('js/client/ui/menu.js');
  assert.match(menu, /\{ label: 'チャットのスタンプを変える', value: 'stamps' \}/);
  assert.match(menu, /openStampEditor\(g\)\.then\(\(\) => again\(idx\)\)/);
  // えらぶ まどは サーバーへ 一覧を おくる
  assert.match(src('js/client/ui/stamps.js'), /g\.net\.send\(\{ t: 'menu', action: 'stamps', list: next \}\)/);
});

test('えらぶ まどの 手直し: 入れる・はずす・前へ／うしろへ', () => {
  const l = ['あ', 'い', 'う'];
  assert.deepEqual(putStamp(l, 1, 'ねるよー'), ['あ', 'ねるよー', 'う']);
  assert.deepEqual(putStamp(l, 3, 'え'), ['あ', 'い', 'う', 'え'], 'あきに 入れる');
  assert.deepEqual(putStamp(l, 1, '\n'), l, 'からっぽは 入れない');
  assert.equal(putStamp(Array(12).fill('x'), 12, 'y').length, 12, '12こ より ふやさない');
  assert.deepEqual(dropStamp(l, 0), ['い', 'う']);
  assert.deepEqual(dropStamp(['あ'], 0), ['あ'], '1つは のこす');
  assert.deepEqual(moveStamp(l, 1, -1), ['い', 'あ', 'う']);
  assert.deepEqual(moveStamp(l, 1, 1), ['あ', 'う', 'い']);
  assert.deepEqual(moveStamp(l, 0, -1), l);
  assert.deepEqual(moveStamp(l, 2, 1), l);
  assert.deepEqual(l, ['あ', 'い', 'う'], 'もとの 一覧は かえない');
});
