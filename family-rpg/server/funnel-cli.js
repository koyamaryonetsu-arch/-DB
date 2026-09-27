// 家族サーバーを 外出先からも 開ける ように する（Tailscale Funnel。スマホに アプリは いらない）
// つかいかた: node server/funnel-cli.js on   … 外出先から 開ける ように する
//            node server/funnel-cli.js off  … やめる（家の Wi-Fi だけに もどす）
// funnel-on.bat / funnel-on.command（ダブルクリック）からも よばれる
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { defaultDataDir } from './savedir.js';
import { findFunnelUrl } from './funnel.js';
import { strongEnough } from './guard.js';

const DATA_DIR = path.resolve(process.env.DATA_DIR || defaultDataDir());
let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));
} catch { /* まだ ない */ }
const PORT = Number(process.env.PORT || config.port || 3000);
const mode = process.argv[2] === 'off' ? 'off' : 'on';

const BINS = process.platform === 'win32'
  ? ['tailscale', 'C:\\Program Files\\Tailscale\\tailscale.exe']
  : ['tailscale', '/Applications/Tailscale.app/Contents/MacOS/Tailscale', '/opt/homebrew/bin/tailscale', '/usr/local/bin/tailscale'];

function runTailscale(args) {
  return new Promise((resolve) => {
    const tryAt = (i) => {
      if (i >= BINS.length) return resolve(null);
      const child = spawn(BINS[i], args, { stdio: 'inherit', windowsHide: false });
      child.on('error', () => tryAt(i + 1));
      child.on('exit', (code) => resolve(code));
    };
    tryAt(0);
  });
}

console.log('');
if (mode === 'on') {
  console.log(`  家族サーバー（ポート ${PORT}）を、外出先からも開けるようにします（Tailscale Funnel）`);
  console.log('  初めての時は、下にリンクが出ます。ブラウザで開いて「Funnel」と「HTTPS」を許可してから、もう一度このファイルを開いてね。');
  console.log('');
  const code = await runTailscale(['funnel', '--bg', String(PORT)]);
  if (code === null) {
    console.log('  Tailscale が見つかりません。https://tailscale.com/download から入れて、ログインしてね。');
  } else {
    const f = await findFunnelUrl(PORT);
    console.log('');
    if (f.url) {
      console.log('  ★ 外出先から遊ぶアドレス（家族のスマホで開く。アプリはいりません）:');
      console.log(`     ${f.url}`);
      if (!strongEnough(config.password)) {
        console.log('');
        console.log('  ※ 今の合言葉は短いので、外出先からは入れません。');
        console.log(`     ${path.join(DATA_DIR, 'config.json')} の password を 8文字以上（数字だけはだめ）に変えて、家族サーバーを再起動してね。`);
      }
    } else {
      console.log('  まだ ON になっていないようです。上のメッセージを見てね。');
    }
  }
} else {
  console.log('  外出先からのアクセスを止めます（家の Wi-Fi の中だけにもどします）');
  const code = await runTailscale(['funnel', 'reset']);
  if (code === null) console.log('  Tailscale が見つかりません。');
  else console.log('  止めました。');
}
console.log('');
