// 家族サーバーの 見はり役（server/index.js から 使う）
// ・本体（main.js）を べつの プロセスで 動かす。思いがけない エラーで 止まったら、自動で もう一度 動かす
//   （前は 止まっても 黒い 画面が 開いた ままで、動いている ように 見えて いた）
// ・Ctrl + C などの ふつうの 終わり（コード 0）・ポートの 取りあい（コード 3）では もう一度 動かさない
// ・新しい 版を 入れた ばかりで、起動の とちゅうで 止まった ときは 前の 版に もどす（update.js の rollback）
// ・起動の とちゅうで 何回も 止まる ときは あきらめる（黒い 画面に 理由を 出す）
// ・本体は 起動できたら { t: 'ready' } を 送ってくる（来ない 古い 版は 20秒 動いたら 起動できた ことに する）
import { fork } from 'node:child_process';

export const EXIT_PORT_IN_USE = 3;
const READY_AFTER_MS = 20000;
const CRASH_WINDOW_MS = 10 * 60 * 1000;

export function supervise({
  script,
  env = process.env,
  justUpdated = false, // 新しい 版を 入れた ばかり
  rollback = null, // () => boolean（前の 版に もどせたら true）。ない ときは 止まった コードで 終わる（前の 版の 見はり役が もどす）
  log = (t) => console.log(t),
  note = () => {}, // error-log.txt に 書く
  exit = (code) => process.exit(code),
  restartMs = 1500,
  slowRestartMs = 30000, // 10分で 5回 いじょう 止まった ときの まち時間
  maxStartFails = 3,
  logHint = '',
  signals = process,
  platform = process.platform,
} = {}) {
  let child = null;
  let stopping = false;
  let ready = false;
  let startedAt = 0;
  let startFails = 0;
  let restarts = 0;
  let crashes = [];
  let updated = justUpdated;
  let timer = null;

  const isReady = () => ready || Date.now() - startedAt >= READY_AFTER_MS;

  function start() {
    timer = null;
    if (stopping) return exit(0);
    ready = false;
    startedAt = Date.now();
    let c;
    try {
      c = fork(script, [], {
        env: { ...env, KIZUNA_SUPERVISED: '1', KIZUNA_RESTARTS: String(restarts) },
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      });
    } catch (e) {
      log(`\n  家族サーバーを動かせませんでした: ${e.message}\n`);
      return onExit(1, null, null);
    }
    child = c;
    let done = false;
    c.on('message', (m) => {
      if (m && m.t === 'ready' && child === c) {
        ready = true;
        startFails = 0;
        // 新しい 版が 動いた（このあと 止まっても、前の 版には もどさない）
        updated = false;
      }
    });
    c.on('error', (e) => {
      if (done) return;
      done = true;
      log(`\n  家族サーバーを動かせませんでした: ${e.message}\n`);
      onExit(1, null, c);
    });
    c.on('exit', (code, signal) => {
      if (done) return;
      done = true;
      onExit(code, signal, c);
    });
  }

  function onExit(code, signal, c) {
    if (c && child !== c) return;
    child = null;
    if (stopping) return exit(code ?? 0);
    if (code === 0) return exit(0);
    if (code === EXIT_PORT_IN_USE) return exit(EXIT_PORT_IN_USE);
    const why = signal ? `signal ${signal}` : `code ${code}`;
    if (!isReady()) {
      if (updated) {
        updated = false;
        if (rollback) {
          log('\n  新しい版がうまく動かなかったので、前の版にもどします…\n');
          note(`新しい版が起動のとちゅうで止まりました（${why}）。前の版にもどします`);
          if (rollback()) return start();
        }
        return exit(code || 1);
      }
      startFails++;
      if (startFails >= maxStartFails) {
        log(`\n  ★ 家族サーバーを動かせませんでした（${why}）。上のエラーを見てね${logHint}\n`);
        note(`家族サーバーを動かせませんでした（${why}。${maxStartFails}回続けて起動のとちゅうで止まりました）`);
        return exit(code || 1);
      }
    } else {
      startFails = 0;
    }
    restarts++;
    const now = Date.now();
    crashes = crashes.filter((t) => now - t < CRASH_WINDOW_MS);
    crashes.push(now);
    const wait = crashes.length >= 5 ? slowRestartMs : restartMs;
    log(`\n  ★ 家族サーバーが止まったので、自動でもう一度動かします（${restarts}回目）${logHint}\n`);
    note(`家族サーバーが止まりました（${why}）。もう一度動かします（${restarts}回目）`);
    timer = setTimeout(start, wait);
  }

  // Ctrl + C など: 本体が セーブして 終わるのを まつ（もう一度 動かさない）
  // Windows は 黒い 画面の Ctrl + C・画面を とじる が 本体にも とどく。kill で つたえると セーブせずに 止まるので つたえない
  function onSignal(sig) {
    if (stopping && sig === 'SIGINT' && child) {
      // 2回目の Ctrl + C: すぐに 止める
      try { child.kill('SIGKILL'); } catch { /* */ }
      return;
    }
    stopping = true;
    if (!child) {
      if (timer) clearTimeout(timer);
      return exit(0);
    }
    if (platform !== 'win32') {
      try { child.kill(sig); } catch { /* */ }
    }
  }
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    signals.removeAllListeners?.(sig);
    signals.on(sig, () => onSignal(sig));
  }

  start();
  return {
    get child() { return child; },
    get restarts() { return restarts; },
  };
}
