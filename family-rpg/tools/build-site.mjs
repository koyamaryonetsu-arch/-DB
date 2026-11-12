// ひとりで遊ぶサイト（GitHub Pages）を つくる
// つかいかた: node tools/build-site.mjs <出力フォルダ> [版（コミットの sha など）]
//
// ・public/ を そのまま コピーする（ゲームは サーバーが なければ ひとりモードで 動く）
// ・JS の import と index.html の 読みこみに ?v=<版> を つけて、
//   サイトを 新しくした 直後に 古い ファイルと 新しい ファイルが まざらない ように する
// ・version.json（いまの 版）と .nojekyll を 書く
// ・pack-manifest.json と pack.json（Service Worker が はじめの 読みこみを 速く する ため）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// ?v= を つける しくみは 家族サーバーと 同じ もの（server/stamp.js）
import { stampImports, stampHtml, stampable, shortVersion } from '../server/stamp.js';
import { buildPack } from '../server/static.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export { stampImports, stampHtml };

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
  const short = shortVersion(v);
  fs.rmSync(out, { recursive: true, force: true });
  copyDir(src, out, (a, b) => {
    const rel = path.relative(src, a).split(path.sep).join('/');
    if (stampable(rel)) fs.writeFileSync(b, stampImports(fs.readFileSync(a, 'utf8'), short));
    // サイトでは 家族サーバーの 案内（ナビゲーション）は 出さない（sw.js?nav=off）
    else if (rel === 'index.html') fs.writeFileSync(b, stampHtml(fs.readFileSync(a, 'utf8'), short, date, { sw: 'sw.js?nav=off', pack: true }));
    else fs.copyFileSync(a, b);
  });
  fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({ v: short, sha: v, date }, null, 2));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  // まとめて 1回で 送る パック（Service Worker が 使う。中みは ?v= を つける 前の もの）
  const { manifest, pack } = buildPack(src, short);
  fs.writeFileSync(path.join(out, 'pack-manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(out, 'pack.json'), JSON.stringify(pack));
  return { out, v: short };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = path.resolve(process.argv[2] || 'dist/site');
  const r = buildSite(out, process.argv[3] || undefined, process.argv[4] || undefined);
  console.log(`site: ${r.out} (v=${r.v})`);
}
