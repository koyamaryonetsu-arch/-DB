// きずなの紋章 ― はじまり
import { Net } from './client/net.js';
import { Game } from './client/game.js';

async function boot() {
  const net = await Net.create();
  const game = new Game(net);
  game.start();
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:#05071a;padding:2em;text-align:center">よみこみに しっぱいしました。<br>ページを よみこみなおしてね。<br><small>${String(e.message || e)}</small></div>`);
});
