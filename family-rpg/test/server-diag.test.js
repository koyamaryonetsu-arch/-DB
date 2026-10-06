// 家族サーバーの 見なおしの ための しくみ: エラーの きろく（error-log.txt）・Tailscale の ようす・だいほんの おわりの まもり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createErrorLog, captureConsole, ERROR_LOG } from '../server/errlog.js';
import { tailscaleState, tailscaleWarning } from '../server/funnel.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

test('エラーの きろく: ファイルに 書く。おなじ エラーは 1分に 1回だけ（何回 あったかも 書く）', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-err-'));
  let t = Date.parse('2026-10-06T12:00:00');
  const log = createErrorLog(dir, { now: () => t, version: '2026-10-06' });
  assert.equal(log.file, path.join(dir, ERROR_LOG));
  assert.equal(log.write(['tick error', new Error('こわれた')]), true);
  assert.equal(log.write(['tick error', new Error('こわれた')]), false, '1分 いないの おなじ エラーは 画面に 出さない');
  assert.equal(log.write(['tick error', new Error('こわれた')]), false);
  assert.equal(log.write(['message error', new Error('べつ')]), true, 'ちがう エラーは 出す');
  t += 61000;
  assert.equal(log.write(['tick error', new Error('こわれた')]), true);
  log.note('家族サーバーが止まりました（code 1）');
  const text = fs.readFileSync(log.file, 'utf8');
  assert.equal(text.match(/tick error Error: こわれた/g).length, 2);
  assert.match(text, /ほかに同じエラーが2回/);
  assert.match(text, /\(2026-10-06\)/);
  assert.match(text, /家族サーバーが止まりました/);
  assert.match(text, /at /, 'どこで おきたかも 書く');
});

test('エラーの きろく: 大きく なったら error-log.old.txt に うつす。console.error も きろくする', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-err-'));
  const log = createErrorLog(dir, { maxBytes: 300, gapMs: 0 });
  for (let i = 0; i < 10; i++) log.write([`error ${i} ${'x'.repeat(50)}`]);
  assert.ok(fs.existsSync(path.join(dir, 'error-log.old.txt')));
  assert.ok(fs.statSync(log.file).size < 400);
  const printed = [];
  const fake = { error: (...a) => printed.push(a.join(' ')), warn: (...a) => printed.push(a.join(' ')) };
  const log2 = createErrorLog(fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-err-')));
  captureConsole(log2, fake);
  fake.error('message error', 'A');
  fake.error('message error', 'A');
  fake.warn('[クライアントのエラー]', 'パパ', 'frame', 'x is undefined');
  assert.deepEqual(printed, ['message error A', '[クライアントのエラー] パパ frame x is undefined']);
  assert.match(fs.readFileSync(log2.file, 'utf8'), /クライアントのエラー/);
  // 書けない 場所でも 止まらない
  const bad = createErrorLog(path.join(dir, 'no', 'such', 'dir'));
  assert.equal(bad.write(['x']), true);
});

test('Tailscale の ようす: ログインが 切れた・OFF・動いていない・期限が ちかい ときに 注意を 出す', async () => {
  const now = Date.parse('2026-10-06T00:00:00Z');
  const json = (o) => async () => ({ out: JSON.stringify(o) });
  const st = (o) => tailscaleState({ runImpl: json(o), candidates: ['tailscale'] });
  // 入っていない
  const none = await tailscaleState({ runImpl: async () => ({ notFound: true }), candidates: ['a', 'b'] });
  assert.equal(none.installed, false);
  assert.deepEqual(tailscaleWarning(none, now), []);
  // ふつう（期限なし）
  const ok = await st({ BackendState: 'Running', Self: { Online: true } });
  assert.deepEqual(tailscaleWarning(ok, now), []);
  // 期限は まだ 先
  assert.deepEqual(tailscaleWarning(await st({ BackendState: 'Running', Self: { KeyExpiry: '2027-03-01T00:00:00Z' } }), now), []);
  // 期限が 2週間 いない
  const soon = tailscaleWarning(await st({ BackendState: 'Running', Self: { KeyExpiry: '2026-10-12T00:00:00Z' } }), now);
  assert.match(soon[0], /期限は10月12日までです/);
  assert.match(soon[1], /Disable key expiry/);
  // 期限が 0001年（期限なしの あらわし方）でも 注意しない
  assert.deepEqual(tailscaleWarning(await st({ BackendState: 'Running', Self: { KeyExpiry: '0001-01-01T00:00:00Z' } }), now), []);
  // ログインが 切れた・期限切れ
  assert.match(tailscaleWarning(await st({ BackendState: 'NeedsLogin' }), now)[0], /ログインが切れています/);
  assert.match(tailscaleWarning(await st({ BackendState: 'Running', Self: { Expired: true } }), now)[0], /ログインが切れています/);
  // OFF
  assert.match(tailscaleWarning(await st({ BackendState: 'Stopped' }), now)[0], /OFF です/);
  // コマンドは あるが 動いていない（JSON が 出ない）
  const down = await tailscaleState({ runImpl: async () => ({ out: '', failed: true }), candidates: ['tailscale'] });
  assert.equal(down.state, 'NoDaemon');
  assert.match(tailscaleWarning(down, now)[0], /動いていないようです/);
  // 家の Wi-Fi からは 遊べる ことも 書く
  assert.match(tailscaleWarning(down, now).join('\n'), /家のWi-Fiからは、いつも通り遊べます/);
});

test('だいほん: おわりの かたづけで エラーが 出ても、動けなく ならない（サーバーも 止まらない）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const s = bot.s;
  const errors = [];
  const origError = console.error;
  console.error = (...a) => errors.push(a);
  const rejections = [];
  const onRej = (e) => rejections.push(e);
  process.on('unhandledRejection', onRej);
  // おわりの かたづけ（sendSelf）が エラーに なる
  const origSendSelf = world.sendSelf;
  world.sendSelf = () => { throw new Error('こわれた sendSelf'); };
  try {
    const run = runSteps(world, s, [['say', null, 'こんにちは']]);
    assert.equal(s.busy, 'script');
    // 画面の がわの「つぎへ」（Bot が うけとった だいほんに へんじを する）
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setImmediate(r));
      bot.flushQueue();
    }
    assert.equal(s.busy, null, '動ける');
    assert.equal(s.runId, null);
    assert.ok(!world.runs.has(run.id));
    assert.ok(errors.some((a) => a[0] === 'script finish error'), 'きろくは する');
    assert.equal(rejections.length, 0, 'Promise の エラーが 外に 出ない');
  } finally {
    world.sendSelf = origSendSelf;
    console.error = origError;
    process.off('unhandledRejection', onRej);
  }
});
