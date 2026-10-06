// 家族サーバーの 見なおしの ための しくみ: エラーの きろく（error-log.txt）・Tailscale の ようす・だいほんの おわりの まもり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createErrorLog, captureConsole, ERROR_LOG } from '../server/errlog.js';
import { tailscaleState, tailscaleWarning, funnelPublicDns, funnelDnsWarning, funnelNameWarning } from '../server/funnel.js';
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

test('外出先の アドレス（Funnel）が インターネットの DNS に 出ているか: 出ていない ときだけ 注意する', async () => {
  const err = (code) => Object.assign(new Error(code), { code });
  // にせの DNS（servers ごとに 答えを かえる）
  const fake = (answers) => () => {
    let key = '';
    return {
      setServers(list) { key = list[0]; },
      resolve4: async () => { const a = answers[key]?.a4; if (a instanceof Error) throw a; return a || []; },
      resolve6: async () => { const a = answers[key]?.a6; if (a instanceof Error) throw a; return a || []; },
    };
  };
  const servers = [['8.8.8.8'], ['1.1.1.1']];
  // どちらも「ない」（NXDOMAIN）→ missing
  const nx = { a4: err('ENOTFOUND'), a6: err('ENOTFOUND') };
  assert.equal(await funnelPublicDns('pc.tailabcd.ts.net', { servers, resolverFactory: fake({ '8.8.8.8': nx, '1.1.1.1': nx }) }), 'missing');
  // 片方でも 引ければ ok
  assert.equal(await funnelPublicDns('pc.tailabcd.ts.net', { servers, resolverFactory: fake({ '8.8.8.8': nx, '1.1.1.1': { a4: ['192.0.2.1'], a6: err('ENODATA') } }) }), 'ok');
  assert.equal(await funnelPublicDns('pc.tailabcd.ts.net', { servers, resolverFactory: fake({ '8.8.8.8': { a4: err('ENODATA'), a6: ['2001:db8::1'] }, '1.1.1.1': nx }) }), 'ok');
  // DNS に とどかない（家の ネットワークで ふさがれている など）→ わからない（注意しない）
  const to = { a4: err('ETIMEOUT'), a6: err('ETIMEOUT') };
  assert.equal(await funnelPublicDns('pc.tailabcd.ts.net', { servers, resolverFactory: fake({ '8.8.8.8': nx, '1.1.1.1': to }) }), 'unknown');
  assert.equal(await funnelPublicDns('', { servers, resolverFactory: fake({}) }), 'unknown');
  assert.equal(await funnelPublicDns('not a host', { servers, resolverFactory: fake({}) }), 'unknown');
  // 黒い 画面の 文
  const w = funnelDnsWarning('https://pc.tailabcd.ts.net', 'missing');
  assert.match(w[0], /https:\/\/pc\.tailabcd\.ts\.net/);
  assert.match(w[0], /インターネットに公開されていません/);
  assert.match(w.join('\n'), /funnel-on/);
  // PC に 許されている こと（tailscale status --json の Self.CapMap）から、どこが 足りないかを 書く
  const st = (self, extra = {}) => tailscaleState({ runImpl: async () => ({ out: JSON.stringify({ BackendState: 'Running', Self: self, ...extra }) }), candidates: ['tailscale'] });
  const noHttps = await st({ CapMap: { funnel: null } });
  assert.equal(noHttps.https, false);
  assert.match(funnelDnsWarning('https://pc.tailabcd.ts.net', 'missing', noHttps).join('\n'), /HTTPS（証明書）が有効になっていません/);
  const noFunnel = await st({ CapMap: { https: null, 'https://tailscale.com/cap/file-sharing': null } });
  assert.equal(noFunnel.funnel, false);
  assert.match(funnelDnsWarning('https://pc.tailabcd.ts.net', 'missing', noFunnel).join('\n'), /このPCに Funnel が許可されていません/);
  const both = await st({ CapMap: { https: null, funnel: null, 'https://tailscale.com/cap/funnel-ports?ports=443,8443,10000': null } }, { Health: ['Tailscale could not connect to the  DERP relay'] });
  assert.equal(both.https, true);
  assert.equal(both.funnel, true);
  const bw = funnelDnsWarning('https://pc.tailabcd.ts.net', 'missing', both).join('\n');
  assert.match(bw, /許可（HTTPS・Funnel）はそろっています/);
  assert.match(bw, /funnel-off → funnel-on/);
  assert.match(bw, /Tailscale からの注意: Tailscale could not connect to the DERP relay/);
  // 古い 版（Capabilities の 配列）
  const old = await st({ Capabilities: ['https', 'https://tailscale.com/cap/is-admin'] });
  assert.equal(old.https, true);
  assert.equal(old.funnel, false);
  // どちらも ない（わからない）ときは 決めつけない
  const unknown = await st({ DNSName: 'pc.tailabcd.ts.net.' });
  assert.equal(unknown.https, null);
  assert.equal(unknown.funnel, null);
  assert.doesNotMatch(funnelDnsWarning('https://pc.tailabcd.ts.net', 'missing', unknown).join('\n'), /原因：/);
  assert.deepEqual(funnelDnsWarning('https://pc.tailabcd.ts.net', 'ok'), []);
  assert.deepEqual(funnelDnsWarning('https://pc.tailabcd.ts.net', 'unknown'), []);
});

test('外出先用の 設定の アドレスが、今の PC の 名前と ちがう（Tailscale で 名前を かえた）ときに 知らせる', async () => {
  const st = await tailscaleState({ runImpl: async () => ({ out: JSON.stringify({ BackendState: 'Running', Self: { DNSName: 'Kizuna.tailabcd.ts.net.' } }) }), candidates: ['tailscale'] });
  assert.equal(st.dnsName, 'kizuna.tailabcd.ts.net', 'さいごの 点を とって 小文字に');
  const w = funnelNameWarning('https://pc.tailabcd.ts.net', st.dnsName);
  assert.match(w[0], /https:\/\/pc\.tailabcd\.ts\.net/);
  assert.match(w[0], /https:\/\/kizuna\.tailabcd\.ts\.net/);
  assert.match(w.join('\n'), /funnel-off → funnel-on/);
  assert.match(w.join('\n'), /「pc」にもどしてね（今は「kizuna」）/);
  // 同じ 名前・わからない ときは 何も 出さない
  assert.deepEqual(funnelNameWarning('https://pc.tailabcd.ts.net', 'pc.tailabcd.ts.net.'), []);
  assert.deepEqual(funnelNameWarning('https://PC.tailabcd.ts.net', 'pc.tailabcd.ts.net'), []);
  assert.deepEqual(funnelNameWarning('https://pc.tailabcd.ts.net', ''), []);
  assert.deepEqual(funnelNameWarning('', 'pc.tailabcd.ts.net'), []);
  // tailnet の 名前を かえた ときも
  assert.ok(funnelNameWarning('https://pc.tailabcd.ts.net', 'pc.happy-cat.ts.net').length > 0);
});
