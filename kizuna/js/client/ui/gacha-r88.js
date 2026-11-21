// 第88回 G4班: 作品の ガチャガチャの 画面（サーバーは shared/world/gacha-r88.js。svc kind:'gacha'）
//   作品を えらぶ（今 品が ある 作品だけ）→「1回 〇〇ゴールド。回す？」→ カプセルが 出て 開く（短い えんしゅつ）→ 品 →
//   「もう1回 回す？」。第88回 G6班: まだ 持って いない 品だけが 出る（まどに「のこり △こ」）。ぜんぶ そろった 作品は 回せない
import { el } from './dom.js?v=f7068908c0e8';
import { Counter, itemInfo } from './counter.js?v=f7068908c0e8';
import { request } from './shop.js?v=f7068908c0e8';
import { rareNameHtml } from './rarity.js?v=f7068908c0e8';

const CSS = `
.gacha-panel .gc-sum { display: flex; flex-direction: column; gap: 0.35em; }
.gacha-panel .gc-row { display: flex; justify-content: space-between; gap: 0.5em; }
.gacha-panel .gc-list { display: flex; flex-direction: column; gap: 0.15em; margin-top: 0.3em; }
.gacha-panel .gc-it { display: flex; justify-content: space-between; gap: 0.4em; font-size: var(--fs-small); }
.gacha-panel .gc-it.no { color: var(--muted); }
.gacha-panel .gc-stage { position: relative; height: 9em; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.gacha-panel .gc-cap { position: relative; width: 4.6em; height: 4.6em; animation: gc-drop 0.45s cubic-bezier(.3,1.6,.6,1) both; }
.gacha-panel .gc-half { position: absolute; left: 0; width: 100%; height: 50%; border: 3px solid #2a1a3a; box-sizing: border-box; }
.gacha-panel .gc-top { top: 0; border-radius: 2.3em 2.3em 0 0; background: var(--gc, #e8505a); border-bottom-width: 1.5px; }
.gacha-panel .gc-bot { bottom: 0; border-radius: 0 0 2.3em 2.3em; background: #f4f2fa; border-top-width: 1.5px; }
.gacha-panel .gc-cap.open .gc-top { animation: gc-up 0.4s ease-out 0.05s forwards; }
.gacha-panel .gc-cap.open .gc-bot { animation: gc-down 0.4s ease-out 0.05s forwards; }
.gacha-panel .gc-shine { position: absolute; inset: 0; margin: auto; width: 1em; height: 1em; border-radius: 50%; opacity: 0; background: radial-gradient(circle, #fff 0%, var(--gc, #ffd66b) 45%, transparent 70%); }
.gacha-panel .gc-cap.open .gc-shine { animation: gc-shine 0.5s ease-out 0.1s forwards; }
.gacha-panel .gc-cap.mei { --gc: #f2c14e; }
.gacha-panel .gc-cap.fu { --gc: #5aa8e8; }
.gacha-panel .gc-stage { flex-direction: column; height: 100%; min-height: 9em; gap: 0.6em; }
.gacha-panel .gc-name { opacity: 0; font-size: 1.2em; transition: opacity 0.3s; }
.gacha-panel .gc-name.on { opacity: 1; }
.gacha-panel .gc-tag { font-size: var(--fs-small); margin-left: 0.3em; color: var(--muted); }
.gacha-panel .gc-tag.mei { color: #f2c14e; }
@keyframes gc-drop { from { transform: translateY(-6em) rotate(-40deg); } to { transform: translateY(0) rotate(0); } }
@keyframes gc-up { to { transform: translateY(-1.6em) rotate(-25deg); opacity: 0; } }
@keyframes gc-down { to { transform: translateY(1.6em) rotate(15deg); opacity: 0; } }
@keyframes gc-shine { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(6); } 100% { opacity: 0; transform: scale(8); } }
@media (prefers-reduced-motion: reduce) { .gacha-panel .gc-cap, .gacha-panel .gc-cap * { animation-duration: 0.01s !important; } }
`;
let styled = false;
function styles() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'gacha-r88-css', text: CSS }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 右の まど: その 作品の 品（持って いない 品は「？？？」）
function workBox(view, w) {
  const box = el('div', { class: 'gc-sum' });
  box.append(el('div', { class: 'gc-row' }, el('span', { class: 'gold', text: w ? w.name : 'ガチャガチャ' }), el('span', { class: 'gold', text: `1回 ${view.price}G` })));
  box.append(el('div', { class: 'small', text: `名品（★4）が出るのは${view.rate}%。\n${view.pity}回つづけて名品が出ないと、次はかならず名品。\nまだ持っていない品だけが出る（同じ品は出ない）。` }));
  if (!w) return box;
  box.append(el('div', { class: 'gc-row small' }, el('span', { text: `持っている品 ${w.got}/${w.total}` }),
    el('span', { class: w.done ? 'gold' : '', text: w.done ? '全部そろった！' : `のこり${w.rest}こ` })));
  if (!w.done && w.left !== null) box.append(el('div', { class: 'small muted', text: `名品かくていまで、あと${w.left}回` }));
  const list = el('div', { class: 'gc-list' });
  for (const it of w.items) {
    list.append(el('div', { class: `gc-it ${it.own ? '' : 'no'}`, html: `<span>${it.own ? rareNameHtml(it.id) : '？？？'}</span><span class="gc-tag ${it.mei ? 'mei' : ''}">${it.mei ? '名品' : 'ふつう'}</span>` }));
  }
  box.append(list);
  return box;
}

// カプセルが 出て 開く（1秒ほど）
async function capsule(ct, got) {
  const cap = el('div', { class: `gc-cap ${got.tier === 'mei' ? 'mei' : 'fu'}` }, el('div', { class: 'gc-shine' }), el('div', { class: 'gc-half gc-top' }), el('div', { class: 'gc-half gc-bot' }));
  const name = el('div', { class: 'gc-name', html: rareNameHtml(got.id) });
  ct.list(el('div', { class: 'gc-stage' }, cap, name));
  ct.game.audio.sfx('cursor');
  await sleep(520);
  if (ct.closed) return;
  cap.classList.add('open');
  ct.game.audio.sfx(got.tier === 'mei' ? 'sparkle' : 'item');
  await sleep(420);
  name.classList.add('on');
}

export async function gachaUI(game, data) {
  styles();
  const ct = new Counter(game, { title: 'ガチャガチャ', keeper: data.keeper || 'ガチャガチャ屋', cls: 'gacha-panel' });
  let view = data;
  let line = 'どの作品のガチャガチャを回す？';
  let last = 0;
  const workOf = (id) => view.works.find((w) => w.id === id);
  while (!ct.closed) {
    ct.info(workBox(view, view.works[last] || null));
    await ct.say(line);
    const items = view.works.map((w) => ({ label: w.name, value: w.id, right: w.done ? 'そろった！' : `のこり${w.rest}こ`, rightCls: w.done ? 'gold' : 'muted' }));
    items.push({ label: 'やめる', value: 'exit' });
    const cmd = await ct.pick(items, { back: null, start: last, onMove: (it) => { if (it) ct.info(workBox(view, workOf(it.value))); } });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    last = Math.max(0, items.findIndex((x) => x.value === cmd.value));
    const id = cmd.value;
    if (workOf(id)?.done) {
      await ct.say(`${workOf(id).name}の品は、全部そろった！\nもう回さなくてもだいじょうぶだよ。`);
      await ct.tap(2000);
      line = 'ほかの作品にする？';
      continue;
    }
    // 回す（もう1回 … を くりかえす）
    let ask = `${workOf(id).name}のガチャガチャだね。\n1回${view.price}ゴールドだよ。回す？`;
    while (!ct.closed) {
      ct.list(workBox(view, workOf(id)));
      ct.info(null);
      if ((game.me.gold || 0) < view.price) {
        await ct.say(`お金が足りないみたいだね。\n1回${view.price}ゴールドだよ。`);
        await ct.tap(2000);
        break;
      }
      const yes = await ct.ask(ask);
      if (ct.closed) return;
      if (yes !== 0) break;
      const res = await request(game, { kind: 'gacha', action: 'spin', work: id });
      if (res.gacha) view = res.gacha;
      ct.updGold();
      if (!res.ok || !res.got) {
        await ct.say(res.text || 'おや？うまく回らなかったみたい。');
        await ct.tap(2000);
        break;
      }
      ct.info(null);
      await capsule(ct, res.got);
      if (ct.closed) return;
      const box = itemInfo(game, res.got.id) || el('div');
      box.prepend(el('div', { class: 'gc-row' }, el('span', { class: res.got.tier === 'mei' ? 'gold' : '', text: res.got.tier === 'mei' ? '名品が出た！' : 'ふつうの品' }),
        el('span', { class: 'small muted', text: res.got.rest ? `NEW・のこり${res.got.rest}こ` : 'NEW・全部そろった！' })));
      ct.info(box);
      await ct.say(res.text, { narr: true });
      await ct.tap(3000);
      if (workOf(id)?.done) {
        await ct.say(`やったね！${workOf(id).name}の品が、全部そろった！`);
        await ct.tap(2400);
        break;
      }
      ask = 'もう1回回す？';
    }
    line = 'ほかの作品も回してみる？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またおいでね！');
  await ct.tap(1200);
  ct.close();
}
