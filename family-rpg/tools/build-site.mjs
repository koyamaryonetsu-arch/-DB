// ひとりで遊ぶサイト（GitHub Pages）を つくる
// つかいかた: node tools/build-site.mjs <出力フォルダ> [版（コミットの sha など）]
//
// ・public/ を そのまま コピーする（ゲームは サーバーが なければ ひとりモードで 動く）
// ・JS の import と index.html の 読みこみに ?v=<版> を つけて、
//   サイトを 新しくした 直後に 古い ファイルと 新しい ファイルが まざらない ように する
// ・version.json（いまの 版）と .nojekyll を 書く
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// './x.js' '../y.js' の 読みこみに ?v= を つける
export function stampImports(src, v) {
  const tag = (spec) => `${spec}?v=${v}`;
  return src
    .replace(/(\bfrom\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s+)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`);
}

export function stampHtml(html, v, date) {
  const boot = `<script>
  // サイトの 版（タイトル画面に 出す）
  window.KIZUNA_VERSION = ${JSON.stringify({ v, date })};
  // 新しい 版に なった 直後など、読みこみに しっぱいしたら 1回だけ 読みこみ直す
  function kizunaBootFail() {
    try { if (sessionStorage.getItem('kizuna_reload')) return; sessionStorage.setItem('kizuna_reload', '1'); } catch (e) {}
    setTimeout(function () { location.reload(); }, 1500);
  }
</script>
<script type="module" src="js/main.js?v=${v}" onerror="kizunaBootFail()"></script>`;
  return html
    .replace('href="css/style.css"', `href="css/style.css?v=${v}"`)
    .replace('<script type="module" src="js/main.js"></script>', boot);
}

function copyDir(from, to, onFile) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b, onFile);
    else if (e.isFile()) onFile(a, b);
  }
}

export function buildSite(out, v = String(Date.now()), date = new Date().toISOString()) {
  const src = path.join(ROOT, 'public');
  const short = String(v).slice(0, 12).replace(/[^A-Za-z0-9]/g, '');
  fs.rmSync(out, { recursive: true, force: true });
  copyDir(src, out, (a, b) => {
    if (a.endsWith('.js') && !a.includes(`${path.sep}vendor${path.sep}`)) fs.writeFileSync(b, stampImports(fs.readFileSync(a, 'utf8'), short));
    else if (path.relative(src, a) === 'index.html') fs.writeFileSync(b, stampHtml(fs.readFileSync(a, 'utf8'), short, date));
    else fs.copyFileSync(a, b);
  });
  fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({ v: short, sha: v, date }, null, 2));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  return { out, v: short };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = path.resolve(process.argv[2] || 'dist/site');
  const r = buildSite(out, process.argv[3] || undefined, process.argv[4] || undefined);
  console.log(`site: ${r.out} (v=${r.v})`);
}
