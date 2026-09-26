// きずなの紋章 ― はじまり
import { Net } from './client/net.js';
import { Game } from './client/game.js';
import { readLinkHash } from './client/links.js';
import { syncOnSite, confirmAskedServer } from './client/ui/syncui.js';

async function boot() {
  // 「連れていく」リンクで 開いた とき（#kizuna=…&server=…）
  readLinkHash();
  const net = await Net.create();
  const game = new Game(net);
  game.start();
  // ひとりで遊ぶサイト: 家族サーバーから とどいた データを 合わせる（#sync=…）
  if (net.mode !== 'server') {
    syncOnSite(game).catch((e) => console.error(e)).finally(() => confirmAskedServer(game));
  }
  // 読みこみ直しの しるしを 消す（ひとりで遊ぶサイトを 新しくした 直後の ため）
  try { sessionStorage.removeItem('kizuna_reload'); } catch { /* */ }
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:#05071a;padding:2em;text-align:center">読みこみに失敗しました。<br>ページを読みこみ直してね。<br><small>${String(e.message || e)}</small></div>`);
});
