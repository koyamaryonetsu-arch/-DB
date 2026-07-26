// 起動スモークテスト: ビルド済みのゲームを Chromium で開き、
// タイトル→名前入力→村→メニューまでをキー操作で進めて検証する。
// 使い方: npm run build && npm run smoke

import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const SHOT_DIR = new URL('../screenshots', import.meta.url).pathname;
mkdirSync(SHOT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer((req, res) => {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/index.html';
  const file = join(DIST, path);
  try {
    statSync(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
console.log(`serving dist on :${port}`);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}\n${(e.stack ?? '').split('\n').slice(0, 6).join('\n')}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});

async function keys(seq, delay = 260) {
  for (const k of seq) {
    await page.keyboard.press(k);
    await page.waitForTimeout(delay);
  }
}

/** フィールド移動用: キーを押しっぱなしにして1歩あるく */
async function step(key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key);
    await page.waitForTimeout(230);
    await page.keyboard.up(key);
    await page.waitForTimeout(160);
  }
}

try {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(SHOT_DIR, '01_title.png') });

  // タイトル → はじめから
  await keys(['Enter']);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(SHOT_DIR, '02_charcreate.png') });

  // 性別 → 外見 → 名前(デフォルト決定) → はじめる
  await keys(['Enter', 'Enter']); // 性別・外見
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOT_DIR, '03_name.png') });
  // 名前入力: 上キー1回で最下段の操作行へラップ → 右2回で「きめる」
  await keys(['ArrowUp', 'ArrowRight', 'ArrowRight'], 200);
  await page.keyboard.press('Enter'); // きめる → デフォルト名
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOT_DIR, '04_confirm.png') });
  await page.keyboard.press('Enter'); // はじめる
  await page.waitForTimeout(1800);
  await page.screenshot({ path: join(SHOT_DIR, '05_village_opening.png') });

  // オープニング会話を送る（選択肢はEnterで先頭を選ぶ）
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(320);
  }
  await page.screenshot({ path: join(SHOT_DIR, '06_after_dialogue.png') });

  // 戦闘（チュートリアル）をオート進行: たたかう連打
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: join(SHOT_DIR, '07_battle_progress.png') });
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(280);
  }
  await page.screenshot({ path: join(SHOT_DIR, '08_after_battle.png') });

  // 移動してみる
  await step('ArrowUp', 2);
  await step('ArrowDown', 1);
  await page.screenshot({ path: join(SHOT_DIR, '09_walk.png') });

  // メニューを開く
  await page.keyboard.press('KeyC');
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(SHOT_DIR, '10_menu.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 南門からワールドマップへ（マップ遷移+オートセーブ検証）
  await step('ArrowDown', 3);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(SHOT_DIR, '11_worldmap.png') });
  // 村へ戻る
  await step('ArrowUp', 2);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(SHOT_DIR, '12_back_village.png') });

  const fatal = errors.filter(
    (e) =>
      !e.includes('AudioContext') &&
      !e.includes('The AudioContext was not allowed') &&
      !e.includes('404') // favicon.ico
  );
  if (fatal.length > 0) {
    console.error('SMOKE FAILED: errors detected');
    for (const e of fatal) console.error(' -', e);
    process.exitCode = 1;
  } else {
    console.log('SMOKE OK: no console/page errors. Screenshots in screenshots/');
  }
} catch (err) {
  console.error('SMOKE FAILED:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
