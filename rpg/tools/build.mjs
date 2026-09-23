// Bundles index.html + src/*.js + src/style.css into single-file outputs.
//   node tools/build.mjs [artifactOut]
//   -> dist/brave-legacy.html          standalone page (double-click to play offline)
//   -> <artifactOut> (optional)        body-only fragment for publishing as a claude.ai Artifact
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const block = html.match(/<!-- build:js -->([\s\S]*?)<!-- \/build:js -->/);
if (!block) throw new Error('build:js block not found');
const files = [...block[1].matchAll(/src="([^"]+)"/g)].map(m => m[1]);
const js = files.map(f => `/* ---- ${f} ---- */\n` + readFileSync(join(root, f), 'utf8')).join('\n;\n').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');

const full = html
  .replace(/<link rel="stylesheet" href="src\/style\.css">/, () => `<style>\n${css}</style>`)
  .replace(block[0], () => `<script>\n${js}\n</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/brave-legacy.html'), full);

const out = process.argv[2];
if (out) {
  const title = full.match(/<title>[\s\S]*?<\/title>/)[0];
  const links = [...full.matchAll(/<link [^>]*fonts\.(googleapis|gstatic)[^>]*>/g)].map(m => m[0]).join('\n');
  const style = full.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = full.match(/<body>([\s\S]*)<\/body>/)[1];
  writeFileSync(out, `${title}\n${links}\n${style}\n${body}`);
}
console.log(`built ${files.length} scripts, ${(full.length / 1024).toFixed(1)} KB`);
