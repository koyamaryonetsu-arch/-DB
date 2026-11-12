// 版つきの 読みこみ（家族サーバーと ひとりで遊ぶサイトの 両方で 使う）
// ・JS の import と index.html の 読みこみに ?v=<版> を つける
//   → ?v= つきの ファイルは ブラウザに 1年 とっておいてもらえる（2回目からは 通信 0回）
//   → 版が かわれば アドレスも かわるので、古い ファイルと 新しい ファイルが まざらない
// ・ファイルの 中みは かえない（送る 時・サイトを 作る 時に つける）
import crypto from 'node:crypto';
import { kizunaBoot } from './boot-loader.js';

// './x.js' '../y.js' の 読みこみに ?v= を つける
// （public/sw.js の stampImports と 同じ。test/load-r78.test.js で たしかめる）
export function stampImports(src, v) {
  const tag = (spec) => `${spec}?v=${v}`;
  return src
    .replace(/(\bfrom\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s+)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`);
}

// ?v= を つける JS か（vendor の 中は 外の ライブラリなので さわらない）
export const stampable = (rel) => rel.endsWith('.js') && !rel.split('/').includes('vendor') && rel !== 'sw.js';

// index.html に 版を 入れる。読みこみは kizunaBoot（server/boot-loader.js）が はじめる
// opts.sw: 登録する sw.js の アドレス（'' なら 登録しない）・opts.pack: パックを 使うか
export function stampHtml(html, v, date, opts = {}) {
  const cfg = { v, sw: opts.sw ?? 'sw.js', pack: !!opts.pack };
  const loader = String(kizunaBoot).replace(/^\s*\/\/.*$\n?/gm, '');
  const boot = `<script>
  // サイトの 版（タイトル画面に 出す）
  window.KIZUNA_VERSION = ${JSON.stringify({ v, date })};
  // 新しい 版に なった 直後など、読みこみに しっぱいしたら 1回だけ 読みこみ直す
  function kizunaBootFail() {
    try { if (sessionStorage.getItem('kizuna_reload')) return; sessionStorage.setItem('kizuna_reload', '1'); } catch (e) {}
    setTimeout(function () { location.reload(); }, 1500);
  }
  (${loader})(${JSON.stringify(cfg).replace(/</g, '\\u003c')});
</script>`;
  return html
    .replace('href="css/fonts.css"', `href="css/fonts.css?v=${v}"`)
    .replace('href="css/style.css"', `href="css/style.css?v=${v}"`)
    .replace('<script type="module" src="js/main.js"></script>', boot);
}

// 版の 文字（英数字だけ・12文字まで）
export const shortVersion = (v) => String(v).slice(0, 12).replace(/[^A-Za-z0-9]/g, '');

// 中みの ハッシュ（sha256 の 先の 20文字）
export const contentHash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 20);
