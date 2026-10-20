// きずなの紋章 ― 家族サーバー
// つかいかた: node server/index.js   （Node.js 18 いじょう。start.bat / start.command からも これを 動かす）
//
// 1. 新しい 版が ないか GitHub を しらべて、あれば 更新する（update.js。セーブは そのまま）
// 2. サーバーの 本体（main.js）を べつの プロセスで 動かして 見はる（supervisor.js）
//    ・思いがけない エラーで 止まったら、自動で もう一度 動かす
//    ・更新した ばかりの 新しい 版が 起動の とちゅうで 止まったら、前の 版に もどす
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { defaultDataDir } from './savedir.js';
import { checkAndUpdate, rollback, markExecutables } from './update.js';
import { supervise } from './supervisor.js';
import { createErrorLog } from './errlog.js';

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

// 前の 版の 自動更新から 動かされた（KIZUNA_CHILD）: 更新は もう すんでいる。
// 本体が 起動の とちゅうで 止まったら、止まった コードで 終わる（前の 版の 見はり役が 前の 版に もどす）
const fromOldUpdater = !!process.env.KIZUNA_CHILD;

// 前の 版の 自動更新で 入った funnel-on.command なども、ダブルクリックで 動く ように
markExecutables(ROOT);
// Windows: 黒い 画面の「簡易編集モード」を 切る（中を クリックしても 止まらない ように）
disableQuickEdit();
fs.mkdirSync(DATA_DIR, { recursive: true });
let up = { status: 'skip' };
if (!fromOldUpdater) {
  up = await checkAndUpdate({ root: ROOT, dataDir: DATA_DIR, log: (t) => console.log(t), enabled: autoUpdateOn() && !process.env.DATA_DIR });
}
const errlog = createErrorLog(DATA_DIR);
const env = { ...process.env };
delete env.KIZUNA_CHILD;
supervise({
  script: path.join(ROOT, 'server', 'main.js'),
  env,
  justUpdated: up.status === 'updated' || fromOldUpdater,
  rollback: up.status === 'updated' ? () => rollback({ root: ROOT, dataDir: DATA_DIR }) : null,
  note: (t) => errlog.note(t),
  logHint: `（くわしくは ${errlog.file}）`,
});

// Windows の 黒い 画面は、中を クリックすると 文字を えらぶ モード（簡易編集）に なって、そこで 止まる。
// この 画面だけ 簡易編集を 切る（PowerShell で コンソールの 設定を かえる。できなくても 気に しない）
const QUICK_EDIT_PS = [
  '$s = @"',
  '[DllImport("kernel32.dll")] public static extern IntPtr GetStdHandle(int h);',
  '[DllImport("kernel32.dll")] public static extern bool GetConsoleMode(IntPtr h, out uint m);',
  '[DllImport("kernel32.dll")] public static extern bool SetConsoleMode(IntPtr h, uint m);',
  '"@',
  '$k = Add-Type -MemberDefinition $s -Name QE -Namespace Kizuna -PassThru',
  '$h = $k::GetStdHandle(-10)',
  '$m = [uint32]0',
  'if ($k::GetConsoleMode($h, [ref]$m)) { [void]$k::SetConsoleMode($h, (($m -band (-bnot 0x40)) -bor 0x80)) }',
].join('\r\n');
function disableQuickEdit() {
  if (process.platform !== 'win32' || !process.stdin.isTTY) return;
  // 文字の うけわたしで こわれない ように、UTF-16LE の base64 で わたす
  const enc = Buffer.from(QUICK_EDIT_PS, 'utf16le').toString('base64');
  try {
    spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], { stdio: 'inherit', timeout: 15000, windowsHide: false });
  } catch { /* */ }
}
