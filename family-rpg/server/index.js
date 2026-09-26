// きずなの紋章 ― 家族サーバー
// つかいかた: node server/index.js   （Node.js 18 いじょう。start.bat / start.command からも これを 動かす）
//
// 1. 新しい 版が ないか GitHub を しらべて、あれば 更新する（update.js。セーブは そのまま）
// 2. サーバーの 本体（main.js）を 動かす
//    更新した ときは 新しい 版を べつの プロセスで 動かし、すぐに 止まったら 前の 版に もどす
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defaultDataDir } from './savedir.js';
import { checkAndUpdate, rollback } from './update.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || defaultDataDir());

function autoUpdateOn() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));
    return cfg.autoUpdate !== false;
  } catch {
    return true;
  }
}

function runChild(isRollback) {
  const started = Date.now();
  const child = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], { stdio: 'inherit', env: { ...process.env, KIZUNA_CHILD: '1' } });
  // Ctrl + C: 子どもの プロセスが セーブして 終わるのを まつ
  // （Windows は 画面の Ctrl + C が 子どもにも とどく。kill で つたえると セーブせずに 止まるので つたえない）
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.on('SIGINT', () => { if (process.platform !== 'win32') child.kill('SIGINT'); });
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  child.on('exit', (code, signal) => {
    // 新しい 版が すぐに 止まった（ポートの 取りあい〔3〕は のぞく）→ 前の 版に もどす
    if (!isRollback && code && code !== 3 && Date.now() - started < 20000) {
      console.log('\n  新しい版がうまく動かなかったので、前の版にもどします…\n');
      if (rollback({ root: ROOT, dataDir: DATA_DIR })) return runChild(true);
    }
    process.exit(code ?? (signal ? 1 : 0));
  });
}

let up = { status: 'skip' };
if (!process.env.KIZUNA_CHILD) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  up = await checkAndUpdate({ root: ROOT, dataDir: DATA_DIR, log: (t) => console.log(t), enabled: autoUpdateOn() && !process.env.DATA_DIR });
}
if (up.status === 'updated') runChild(false);
else await import('./main.js');
