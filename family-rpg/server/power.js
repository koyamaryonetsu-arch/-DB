// PC の スリープの 設定（Windows）
// ・電源に つないでいる 時に、さわらないで しばらく たつと スリープする 設定だと、家族サーバーも Tailscale も 止まる
//   （外出先から 遊んでいる 時は、だれも PC を さわらないので スリープしやすい）
// ・powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE を 読む だけ（設定は かえない）。
//   言葉は Windows の 言語で かわるので、さいごの 2つの「0x…」（AC・DC の 秒）だけを 見る
import { execFile } from 'node:child_process';

// もどりち: { ac, dc }（秒。0 は スリープしない）／ 読めない ときは null
export function parseStandbyIdle(text) {
  const hex = String(text || '').match(/0x[0-9a-fA-F]+/g) || [];
  if (hex.length < 2) return null;
  const ac = parseInt(hex[hex.length - 2], 16);
  const dc = parseInt(hex[hex.length - 1], 16);
  return Number.isFinite(ac) && Number.isFinite(dc) ? { ac, dc } : null;
}

function run(bin, args, ms = 5000) {
  return new Promise((resolve) => {
    try {
      execFile(bin, args, { timeout: ms, windowsHide: true, encoding: 'latin1' }, (err, stdout) => resolve(err ? null : String(stdout || '')));
    } catch {
      resolve(null);
    }
  });
}

// もどりち: { ac, dc } ／ Windows では ない・読めない ときは null
export async function sleepSetting({ platform = process.platform, runImpl = run } = {}) {
  if (platform !== 'win32') return null;
  const out = await runImpl('powercfg', ['/query', 'SCHEME_CURRENT', 'SUB_SLEEP', 'STANDBYIDLE']);
  return out === null ? null : parseStandbyIdle(out);
}

// 黒い 画面に 出す 文（電源に つないでいる 時に スリープしない 設定なら []）
export function sleepWarning(st) {
  if (!st || !(st.ac > 0)) return [];
  const min = Math.max(1, Math.round(st.ac / 60));
  const when = min >= 60 && min % 60 === 0 ? `${min / 60}時間` : `${min}分`;
  return [
    `★ このPCは、さわらないで${when}たつとスリープします（電源につないでいる時）。`,
    '   スリープ中は、家のWi-Fiからも外出先からもつながりません（外から遊ぶ時は、だれもPCをさわらないのでスリープしやすい）。',
    '   家族サーバーを動かしておく時は、Windows の「設定」→「システム」→「電源（電源とバッテリー）」→「画面とスリープ」で、',
    '   電源に接続時のスリープを「なし」にしてね（画面は消えてもだいじょうぶ）。',
  ];
}
