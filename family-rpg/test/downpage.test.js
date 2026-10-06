// 家族サーバーに つながらない ときの 案内: どこで 止まっているかを 見分ける
//  ・通信エラー … 家の PC まで とどいていない（電源・スリープ・Tailscale）
//  ・502〜504 … 家の PC（Tailscale Funnel）には とどいたが、家族サーバー（黒い 画面）が 動いていない
// それと、PC の スリープの 設定（powercfg の 出力）を 読む
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { downReason, DOWN_TEXT } from '../public/js/client/downreason.js';
import { parseStandbyIdle, sleepSetting, sleepWarning } from '../server/power.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// sw.js を にせの サービスワーカーの 中で 動かして、ページを 開いた ときの へんじを 見る
async function swNavigate({ host = 'kizuna.taile0000.ts.net', result }) {
  const handlers = {};
  const sandbox = {
    self: {
      location: new URL(`https://${host}/sw.js?site=${encodeURIComponent('https://example.github.io/kizuna/')}`),
      addEventListener: (ev, fn) => { handlers[ev] = fn; },
      skipWaiting() {},
      clients: { claim: () => Promise.resolve() },
    },
    fetch: () => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)),
    Response, URL,
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8'), sandbox);
  let responded = null;
  handlers.fetch({ request: { mode: 'navigate' }, respondWith: (p) => { responded = p; } });
  const res = await responded;
  return { res, text: res === result ? null : await res.text() };
}

test('止まっている 時の ページ: 家の PC まで とどかない（通信エラー）と、PC には とどくが 家族サーバーが 止まっている（502）を 見分ける', async () => {
  // 外出先の アドレス（Tailscale Funnel）で、PC まで とどかない
  const pc = await swNavigate({ result: new TypeError('Load failed') });
  assert.match(pc.text, /家のPCまで、通信がとどいていません/);
  assert.match(pc.text, /スリープしていないか/);
  assert.match(pc.text, /login\.tailscale\.com\/admin\/machines/);
  // 開いている アドレス（PC の 名前を かえると アドレスも かわる）
  assert.match(pc.text, /このページのアドレス（kizuna\.taile0000\.ts\.net）/);
  assert.match(pc.text, /example\.github\.io\/kizuna/, 'ひとりで遊ぶサイトへの ボタン');
  // PC には とどいたが、家族サーバーが 止まっている（Tailscale が 502 を 返す）
  for (const status of [502, 503, 504]) {
    const sv = await swNavigate({ result: new Response('', { status }) });
    assert.match(sv.text, /家族サーバーが動いていません/, String(status));
    assert.match(sv.text, /start\.bat/);
  }
  // この PC（localhost）で 開けない ときは、家族サーバーが 止まっている
  const local = await swNavigate({ host: 'localhost:3000', result: new TypeError('Failed to fetch') });
  assert.match(local.text, /家族サーバーが動いていません/);
  // ふつうの へんじ（404 など）は そのまま
  const ok = new Response('<html>ok</html>', { status: 200 });
  assert.equal((await swNavigate({ result: ok })).res, ok);
  const nf = new Response('見つかりません', { status: 404 });
  assert.equal((await swNavigate({ result: nf })).res, nf);
});

test('ゲームの 中の「家族サーバーにつながりません」: api/info を ためして、どこで 止まっているかの 文を えらぶ', async () => {
  const funnel = { protocol: 'https:', hostname: 'kizuna.taile0000.ts.net' };
  const lan = { protocol: 'http:', hostname: '192.168.1.23' };
  const reject = () => Promise.reject(new TypeError('Load failed'));
  const status = (n) => () => Promise.resolve(new Response('', { status: n }));
  assert.equal(await downReason({ fetchImpl: reject, loc: funnel }), 'pc');
  assert.equal(await downReason({ fetchImpl: status(502), loc: funnel }), 'server');
  assert.equal(await downReason({ fetchImpl: status(200), loc: funnel }), 'up');
  // 家の Wi-Fi（http）では、PC が ねているのか サーバーが 止まっているのか 見分けられない
  assert.equal(await downReason({ fetchImpl: reject, loc: lan }), 'unknown');
  assert.equal(await downReason({ fetchImpl: reject, loc: { protocol: 'https:', hostname: 'localhost' } }), 'unknown');
  // 返事が おそすぎる ときも まちつづけない
  const hang = (url, opts) => new Promise((_, rej) => opts.signal.addEventListener('abort', () => rej(new Error('abort'))));
  assert.equal(await downReason({ fetchImpl: hang, loc: funnel, timeoutMs: 50 }), 'pc');
  for (const k of ['pc', 'server', 'up', 'unknown']) assert.ok(DOWN_TEXT[k], k);
  assert.match(DOWN_TEXT.pc, /スリープ/);
  assert.match(DOWN_TEXT.pc, /「★外出先から」のアドレスと同じか/);
  assert.match(DOWN_TEXT.server, /start\.bat/);
});

const POWERCFG_EN = `Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)
  Subgroup GUID: 238c9fa8-0aad-41ed-83f4-97be242c8f20  (Sleep)
    GUID Alias: SUB_SLEEP
    Power Setting GUID: 29f6c1db-86da-48c5-9fdb-f2b67b1f44da  (Sleep after)
      GUID Alias: STANDBYIDLE
      Minimum Possible Setting: 0x00000000
      Maximum Possible Setting: 0xffffffff
      Possible Settings increment: 0x00000001
      Possible Settings units: Seconds
    Current AC Power Setting Index: 0x00000708
    Current DC Power Setting Index: 0x00000384
`;
// 日本語の Windows（文字は 読めなくても 0x… だけ 見る）
const POWERCFG_JA = `電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)
  サブグループの GUID: 238c9fa8-0aad-41ed-83f4-97be242c8f20  (スリープ)
    GUID エイリアス: SUB_SLEEP
    電源設定の GUID: 29f6c1db-86da-48c5-9fdb-f2b67b1f44da  (次の時間が経過後スリープする)
      GUID エイリアス: STANDBYIDLE
      利用可能な設定の最小値: 0x00000000
      利用可能な設定の最大値: 0xffffffff
      利用可能な設定の増分: 0x00000001
      利用可能な設定の単位: 秒
    現在の AC 電源設定のインデックス: 0x00000000
    現在の DC 電源設定のインデックス: 0x00000384
`;

test('PC の スリープの 設定: powercfg の 出力を 読んで、電源に つないでいる 時に スリープするなら 知らせる', async () => {
  assert.deepEqual(parseStandbyIdle(POWERCFG_EN), { ac: 1800, dc: 900 });
  assert.deepEqual(parseStandbyIdle(POWERCFG_JA), { ac: 0, dc: 900 });
  assert.equal(parseStandbyIdle(''), null);
  assert.equal(parseStandbyIdle('エラー'), null);
  // 30分で スリープ → 知らせる。スリープしない → 何も 出さない
  const w = sleepWarning({ ac: 1800, dc: 900 });
  assert.match(w[0], /30分たつとスリープします/);
  assert.match(w.join('\n'), /「なし」/);
  assert.match(sleepWarning({ ac: 3600, dc: 0 })[0], /1時間たつと/);
  assert.deepEqual(sleepWarning({ ac: 0, dc: 900 }), [], '電池の 時だけ スリープ（電源に つないでいれば だいじょうぶ）');
  assert.deepEqual(sleepWarning(null), []);
  // Windows だけ しらべる
  let asked = null;
  const runImpl = async (bin, args) => { asked = [bin, ...args].join(' '); return POWERCFG_EN; };
  assert.deepEqual(await sleepSetting({ platform: 'win32', runImpl }), { ac: 1800, dc: 900 });
  assert.equal(asked, 'powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE');
  assert.equal(await sleepSetting({ platform: 'linux', runImpl }), null);
  assert.equal(await sleepSetting({ platform: 'win32', runImpl: async () => null }), null);
});
