// 起動できなかった 時の たすけ（start.bat・start.command が、index.js が エラーで 止まった 時に よぶ）
// index.js を 通らずに、GitHub に 直った 新しい 版が ないか しらべて、あれば 入れる（セーブは そのまま）。
// 終わりの コード: 0 … 新しい 版を 入れた（もう一度 index.js を 動かす）／1 … 入れなかった
// （index.js に まちがいが あると、自動更新まで たどりつけず、ずっと 起動できない。それを ふせぐ ため。
//   このファイルは update.js と savedir.js だけを 使う）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultDataDir } from './savedir.js';
import { checkAndUpdate } from './update.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || defaultDataDir());

function autoUpdateOn() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8')).autoUpdate !== false;
  } catch {
    return true;
  }
}

export async function rescue({ root = ROOT, dataDir = DATA_DIR, log = (t) => console.log(t), update = checkAndUpdate, enabled = autoUpdateOn() } = {}) {
  log('');
  log('  サーバーが エラーで 止まりました。直った 新しい 版が ないか、しらべています…');
  let up;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    up = await update({ root, dataDir, log, enabled: enabled && !process.env.DATA_DIR });
  } catch {
    up = { status: 'error' };
  }
  if (up?.status === 'updated') {
    log('  ★ 新しい 版を 入れました。もう一度 起動します。');
    return 0;
  }
  log('  新しい 版は ありませんでした（または しらべられませんでした）。');
  log('  この 画面を 写真に とって、Claude に 見せてください。セーブは 消えていません。');
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await rescue();
}
