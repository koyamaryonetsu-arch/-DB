import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { upgradeSave, repairChar, SAVE_VERSION } from '../public/js/shared/world/save.js';
import { exportCode, parseCode, importChar, CHAR_MAX } from '../public/js/shared/world/transfer.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { computeStats } from '../public/js/shared/stats.js';
import { handOverOldSaves, findOldSaves, NOTE_FILE } from '../server/savedir.js';
import { FileStorage } from '../server/storage.js';
import { Bot } from './helpers.js';

// むかしの 版の セーブ（職業レベル 1〜20・仲間なし・版の しるし なし）
function oldSave() {
  return {
    characters: {
      c_old: {
        id: 'c_old', name: 'ソラ', job: 'warrior', level: 9, exp: 900, gold: 321, hp: 40, mp: 5,
        look: { body: 0, hair: 1, hairColor: 2, skin: 0, color: 3 },
        jobs: { warrior: { lv: 14 }, mage: { lv: 5 } },
        equip: { weapon: 'bronze_sword', armor: 'leather_armor', shield: null, head: 'mystery_hat_from_future', acc: null },
        items: [{ id: 'herb', n: 3 }, { id: 'herb', n: 2 }, { id: 'future_potion', n: 4 }],
        keyItems: ['cave_key', 'future_key'],
        flags: { p_opening: true, p_start: true }, chests: { ow_island: true }, kills: { pururin: 30 },
        objective: '北のルミナの町へ行き、町長に会おう',
        pos: { map: 'overworld', x: 30.5, y: 100.5, dir: 'down' },
        lastPlayed: 1000,
      },
    },
    board: [{ from: 'ソラ', text: 'やあ', time: 5 }],
    createdAt: 1,
  };
}

test('セーブ: むかしの セーブを 読むと 新しい 形に なり、進み具合は そのまま', () => {
  const { data, from } = upgradeSave(oldSave());
  assert.equal(from, 1);
  assert.equal(data.version, SAVE_VERSION);
  const c = data.characters.c_old;
  assert.equal(c.level, 9);
  assert.equal(c.gold, 321);
  assert.equal(c.jobSys, 2, '職業レベルは 新しい しくみ');
  assert.equal(c.jobs.warrior.lv, 7, '14 → 7（半分）');
  assert.deepEqual(c.items.find((e) => e.id === 'herb'), { id: 'herb', n: 5 }, 'おなじ 品物は まとめる');
  assert.equal(c.equip.weapon, 'bronze_sword');
  assert.equal(c.equip.head, null, '知らない そうびは はずす');
  assert.ok(c.stash.items.some((e) => e.id === 'mystery_hat_from_future'), '…が、けさずに しまう');
  assert.ok(c.stash.items.some((e) => e.id === 'future_potion' && e.n === 4));
  assert.ok(c.stash.keyItems.includes('future_key'));
  assert.ok(c.keyItems.includes('cave_key'));
  assert.ok(computeStats(c).atk > 0);
  // なんど 読んでも おなじ
  const again = upgradeSave(JSON.parse(JSON.stringify(data))).data;
  assert.deepEqual(again.characters.c_old, c);
  assert.deepEqual(data.board, [{ from: 'ソラ', text: 'やあ', time: 5 }]);
});

test('セーブ: しまった 品物は、その 品物が ある 版で 読むと もどってくる', () => {
  const { data } = upgradeSave(oldSave());
  ITEMS.future_potion = { name: 'みらいの薬', type: 'use', price: 10 };
  try {
    const c = repairChar(data.characters.c_old);
    assert.ok(c.items.some((e) => e.id === 'future_potion' && e.n === 4));
    assert.ok(!c.stash?.items.some((e) => e.id === 'future_potion'));
  } finally {
    delete ITEMS.future_potion;
  }
});

test('セーブ: 新しい 版で 作った セーブを 読んでも、知らない 項目や 版の しるしを けさない', () => {
  const { data } = upgradeSave({ version: 99, characters: {}, board: [], newThing: { a: 1 } });
  assert.equal(data.version, 99);
  assert.deepEqual(data.newThing, { a: 1 });
  const j = upgradeSave({ version: 2, characters: { x: { id: 'x', name: 'ミナ', job: 'future_job', level: 3, jobs: {}, jobSys: 2 } } }).data.characters.x;
  assert.equal(j.job, 'warrior', '知らない 職業は いったん 戦士');
  assert.equal(j.stash.job, 'future_job', 'もとの 職業は おぼえておく');
});

test('セーブ: むかしの セーブの まま 家族サーバーを 動かしても 遊べる', async () => {
  const saved = [];
  const storage = { load: () => oldSave(), save: (d) => saved.push(JSON.parse(JSON.stringify(d))) };
  const world = new GameWorld({ offline: true, rng: makeRng(3), rateLimit: false, storage });
  assert.equal(world.saveUpgradedFrom, 1);
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  bot.send({ t: 'play', id: 'c_old' });
  await bot.settle();
  assert.equal(bot.char.name, 'ソラ');
  assert.equal(bot.char.level, 9);
  assert.equal(bot.map, 'overworld');
  world.markDirty();
  world.saveNow();
  const last = saved.pop();
  assert.equal(last.version, SAVE_VERSION);
  assert.ok(last.characters.c_old.stash.items.length, 'しまった ものも セーブに のこる');
});

test('セーブ: むかしの 形の ファイルは、新しい 形に する まえに バックアップ', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-st-'));
  fs.writeFileSync(path.join(dir, 'save.json'), JSON.stringify(oldSave()));
  const st = new FileStorage(dir);
  st.load();
  st.load();
  const bk = fs.readdirSync(path.join(dir, 'backups')).filter((f) => f.startsWith(`save-before-v${SAVE_VERSION}`));
  assert.equal(bk.length, 1, 'バックアップは 1回だけ');
});

// ───────────── アプリの フォルダの 外に セーブ・むかしの セーブの ひっこし ─────────────
function makeApp(dir, save, config) {
  fs.mkdirSync(path.join(dir, 'server'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'server', 'index.js'), '// app');
  fs.writeFileSync(path.join(dir, 'public', 'index.html'), '<!doctype html>');
  if (save || config) fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  if (save) fs.writeFileSync(path.join(dir, 'data', 'save.json'), JSON.stringify(save));
  if (config) fs.writeFileSync(path.join(dir, 'data', 'config.json'), JSON.stringify(config));
}

test('セーブの場所: 新しい ZIP を べつの フォルダに ひらいても、前の セーブを ひっこす', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-home-'));
  const dl = path.join(home, 'Downloads');
  const oldApp = path.join(dl, '-DB-claude-elegant-bell-al2f1w', 'family-rpg');
  const newApp = path.join(dl, '-DB-claude-elegant-bell-al2f1w (1)', 'family-rpg');
  makeApp(oldApp, oldSave(), { password: '1234', port: 3000 });
  makeApp(newApp);
  const dataDir = path.join(home, 'kizuna-save');
  assert.deepEqual(findOldSaves(newApp, { home }), [path.join(oldApp, 'data')]);

  const r = handOverOldSaves({ root: newApp, dataDir, home });
  assert.deepEqual(r.moved, ['ソラ']);
  assert.equal(r.config, true, '合言葉も ひきつぐ');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8')).password, '1234');
  const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8'));
  assert.equal(saved.characters.c_old.level, 9);
  assert.ok(fs.existsSync(path.join(oldApp, 'data', NOTE_FILE)), '前の フォルダに メモ');
  assert.ok(fs.existsSync(path.join(oldApp, 'data', 'save.json')), '前の セーブは けさない');

  // もう いちど 起動しても なにも かわらない
  assert.deepEqual(handOverOldSaves({ root: newApp, dataDir, home }).moved, []);

  // 前の 版を また 起動して 遊んだ → 次に 新しい 版を 起動すると 進んだ ぶんが うつる
  const cur = JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8'));
  cur.characters.c_old.lastPlayed = 2000;
  fs.writeFileSync(path.join(dataDir, 'save.json'), JSON.stringify(cur));
  const replay = oldSave();
  replay.characters.c_old.level = 12;
  replay.characters.c_old.lastPlayed = 3000;
  fs.writeFileSync(path.join(oldApp, 'data', 'save.json'), JSON.stringify(replay));
  const r2 = handOverOldSaves({ root: newApp, dataDir, home });
  assert.deepEqual(r2.moved, ['ソラ']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8')).characters.c_old.level, 12);
  assert.ok(fs.readdirSync(path.join(dataDir, 'backups')).some((f) => f.startsWith('save-before-handover')), 'うつす まえに バックアップ');

  // こちらで 後に 遊んでいたら 上書きしない
  const mine = JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8'));
  mine.characters.c_old.level = 15;
  mine.characters.c_old.lastPlayed = 9000;
  fs.writeFileSync(path.join(dataDir, 'save.json'), JSON.stringify(mine));
  assert.deepEqual(handOverOldSaves({ root: newApp, dataDir, home }).moved, []);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8')).characters.c_old.level, 15);

  // こちらで 消した キャラは、次に 起動しても もどってこない
  const del = JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8'));
  delete del.characters.c_old;
  fs.writeFileSync(path.join(dataDir, 'save.json'), JSON.stringify(del));
  assert.deepEqual(handOverOldSaves({ root: newApp, dataDir, home }).moved, []);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8')).characters.c_old, undefined);
});

test('セーブの場所: ZIP を うえから ひらいた（アプリの 中の data）ときも ひっこす。ホームは のぞかない', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-home-'));
  const app = path.join(home, 'games', 'family-rpg');
  makeApp(app, oldSave());
  const dataDir = path.join(home, 'kizuna-save');
  assert.deepEqual(handOverOldSaves({ root: app, dataDir, home }).moved, ['ソラ']);
  // ホームの すぐ 下に ある べつの コピーは さがさない（ほかの フォルダを のぞかない）
  const home2 = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-home-'));
  makeApp(path.join(home2, 'other', 'x', 'family-rpg'), oldSave());
  const app2 = path.join(home2, 'family-rpg');
  makeApp(app2);
  assert.deepEqual(findOldSaves(app2, { home: home2 }), []);
});

test('セーブの場所: Windows の「すべて展開」（フォルダが 2重）や、べつの 場所に ひらいた ときも 見つける', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-home-'));
  const X = '-DB-claude-elegant-bell-al2f1w';
  const oldApp = path.join(home, 'Downloads', X, X, 'family-rpg');
  makeApp(oldApp, oldSave());
  const newApp = path.join(home, 'Downloads', `${X} (1)`, X, 'family-rpg');
  makeApp(newApp);
  assert.deepEqual(findOldSaves(newApp, { home }), [path.join(oldApp, 'data')]);
  // デスクトップに ひらいた 新しい 版からも、ダウンロードの 前の 版を 見つける
  const deskApp = path.join(home, 'Desktop', X, 'family-rpg');
  makeApp(deskApp);
  assert.deepEqual(findOldSaves(deskApp, { home }), [path.join(oldApp, 'data')]);
  assert.deepEqual(handOverOldSaves({ root: deskApp, dataDir: path.join(home, 'kizuna-save'), home }).moved, ['ソラ']);
});

test('家族サーバー: セーブは ホームの kizuna-save に 作られる', { timeout: 30000 }, async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-home-'));
  const port = 3990 + Math.floor(Math.random() * 9);
  const env = { ...process.env, HOME: home, USERPROFILE: home, PORT: String(port), HOST: '127.0.0.1' };
  delete env.DATA_DIR;
  const proc = spawn(process.execPath, ['server/index.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('server did not start')), 8000);
      proc.stdout.on('data', (d) => {
        out += String(d);
        if (out.includes('終わるときは')) { clearTimeout(t); resolve(); }
      });
      proc.on('exit', (c) => reject(new Error('exit ' + c)));
    });
  } finally {
    proc.kill('SIGINT');
    await new Promise((r) => proc.on('exit', r));
  }
  assert.ok(out.includes('セーブの場所'), out);
  assert.ok(out.includes(path.join(home, 'kizuna-save')), out);
  assert.ok(fs.existsSync(path.join(home, 'kizuna-save', 'config.json')));
});

// ───────────── 引っこしコード ─────────────
test('引っこしコード: 書き出して 読みこめる。切れた コードは 読まない', () => {
  const c = upgradeSave(oldSave()).data.characters.c_old;
  const code = exportCode(c);
  assert.ok(code.startsWith('KIZUNA-1-'));
  const r = parseCode(`  ${code.slice(0, 40)}\n${code.slice(40)}  `);
  assert.equal(r.ok, true, '改行や すきまが 入っても 読める');
  assert.equal(r.char.name, 'ソラ');
  assert.equal(r.char.level, 9);
  assert.equal(parseCode(code.slice(0, -10)).ok, false, 'とちゅうで 切れた コード');
  assert.equal(parseCode('hello').ok, false);
  assert.equal(parseCode('').ok, false);
});

test('引っこしコード: 新しい キャラは くわわり、おなじ キャラは 後に 遊んだ ほうに なる', () => {
  const src = upgradeSave(oldSave()).data.characters.c_old;
  const data = upgradeSave({ version: 2, characters: {} }).data;
  let r = importChar(data, src);
  assert.equal(r.mode, 'new');
  assert.equal(data.characters.c_old.name, 'ソラ');
  // もう いる → コードの ほうが 古い なら そのまま
  r = importChar(data, { ...src, level: 3, lastPlayed: 10 });
  assert.equal(r.mode, 'kept');
  assert.equal(data.characters.c_old.level, 9);
  // コードの ほうが 新しい なら 入れかえ
  r = importChar(data, { ...src, level: 20, lastPlayed: 99999 });
  assert.equal(r.mode, 'updated');
  assert.equal(data.characters.c_old.level, 20);
  // ちがう キャラで おなじ 名前 → うしろに 数字
  r = importChar(data, { ...src, id: 'c_other' });
  assert.equal(r.mode, 'new');
  assert.equal(r.name, 'ソラ2');
  // 12人まで
  for (let i = 0; i < CHAR_MAX; i++) importChar(data, { ...src, id: `c${i}`, name: `キャラ${i}` });
  assert.equal(Object.keys(data.characters).length, CHAR_MAX);
  assert.equal(importChar(data, { ...src, id: 'c_full', name: 'いっぱい' }).ok, false);
  // 遊んでいる さいちゅうは 入れかえない
  assert.equal(importChar(data, { ...src, lastPlayed: 999999 }, { online: () => true }).ok, false);
});

test('引っこしコード: おかしな コードでも こわれない', async () => {
  const src = upgradeSave(oldSave()).data.characters.c_old;
  // ID が '__proto__' の コードは 読まない
  const evil = exportCode({ ...src, id: '__proto__' });
  assert.equal(parseCode(evil).ok, false);
  const data = upgradeSave({ version: 2, characters: {} }).data;
  assert.equal(importChar(data, { ...src, id: 'constructor' }).ok, false);
  assert.equal(Object.getPrototypeOf(data.characters), Object.prototype);
  // 'constructor' という 職業・品物、知らない マップでも 遊べる
  const odd = parseCode(exportCode({ ...src, id: 'c_odd', job: 'constructor', items: [{ id: 'toString', n: 2 }], pos: { map: 'constructor', x: 1, y: 1 } }));
  assert.equal(odd.ok, true);
  assert.equal(odd.char.job, 'warrior');
  assert.ok(!odd.char.items.some((e) => e.id === 'toString'));
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  bot.send({ t: 'importChar', code: exportCode({ ...odd.char, pos: { map: 'overworld', x: 99999, y: -5 } }) });
  assert.equal(bot.msgs.filter((m) => m.t === 'importResult').pop().ok, true);
  bot.send({ t: 'play', id: 'c_odd' });
  await bot.settle();
  assert.equal(bot.map, 'overworld');
  assert.ok(bot.x > 0 && bot.x < 9999 && bot.y > 0, 'マップの 外なら はじまりの 場所');
});

test('引っこしコード: ひとりモードで 遊んだ キャラを 家族サーバーに 連れてきて いっしょに 遊べる', async () => {
  // ひとりモード（ブラウザ）
  const solo = new GameWorld({ offline: true, rng: makeRng(11), rateLimit: false });
  const kid = new Bot(solo, 'ユイ');
  await kid.login();
  await kid.createAndPlay('mage');
  await kid.settle();
  const cs = solo.data.characters[kid.char.id];
  cs.level = 8;
  cs.gold = 777;
  kid.send({ t: 'quit' });
  kid.send({ t: 'exportChar', id: cs.id });
  const code = kid.msgs.filter((m) => m.t === 'exportCode').pop().code;
  assert.ok(code);

  // 家族サーバー
  const fam = new GameWorld({ offline: false, rng: makeRng(12), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(fam, 'パパ');
  await papa.login('ほし');
  await papa.createAndPlay('warrior');
  await papa.settle();
  const yui = new Bot(fam, 'ユイ');
  await yui.login('ほし');
  yui.send({ t: 'importChar', code });
  const res = yui.msgs.filter((m) => m.t === 'importResult').pop();
  assert.equal(res.ok, true, res.text);
  assert.equal(res.mode, 'new');
  const moved = fam.data.characters[cs.id];
  assert.equal(moved.level, 8);
  assert.equal(moved.gold, 777);
  yui.send({ t: 'play', id: cs.id });
  await yui.settle();
  assert.equal(yui.char.name, 'ユイ');
  // パパの パーティーに さそって いっしょに
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  assert.ok(yui.msgs.some((m) => m.t === 'invite'));
  yui.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2, 'パーティーを くめた');
  assert.equal(yui.party.members.length, 2);
});
