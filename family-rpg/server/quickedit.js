// Windows の 黒い 画面の「簡易編集モード」を 切る（server/index.js が 起動の はじめに よぶ）
// （前は index.js の 下の ほうに 書いていて、よぶ 時に まだ 用意が できていなかった＝Windows だけ 起動できなかった。
//   べつの ファイルに して、import した 時には かならず 用意が できている ように した）
import { spawnSync } from 'node:child_process';

// Windows の 黒い 画面は、中を クリックすると 文字を えらぶ モード（簡易編集）に なって、そこで 止まる。
// この 画面だけ 簡易編集を 切る（PowerShell で コンソールの 設定を かえる。できなくても 気に しない）
export const QUICK_EDIT_PS = [
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
// opts … テスト用（platform・isTTY・spawn を かえられる）。どんな 時も 例外を 外へ 出さない（起動を 止めない）
export function disableQuickEdit({ platform = process.platform, isTTY = process.stdin.isTTY, spawn = spawnSync } = {}) {
  if (platform !== 'win32' || !isTTY) return false;
  // 文字の うけわたしで こわれない ように、UTF-16LE の base64 で わたす
  const enc = Buffer.from(QUICK_EDIT_PS, 'utf16le').toString('base64');
  try {
    spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], { stdio: 'inherit', timeout: 15000, windowsHide: false });
    return true;
  } catch { return false; }
}
