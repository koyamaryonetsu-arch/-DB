// 第37回 B: ルーレットの まど（カジノの 左下の 台）
//   玉が 止まる 数と コインの 計算は サーバー（shared/world/casino.js の 'roulette'）。ここは 見せるだけ
//   チップ（1・10・100枚）を 選んで、かけたい 所を タップ（いくつでも）→「回す」
//   十字キー・A・B: ボタンや 数字の マスを えらぶ（ui/padnav.js）。A で チップを おく・B で 閉じる
//   たての 画面（スマホ）: 円ばんが 上・数字の 表は たて ならび / よこの 画面: 円ばんが 左・表は よこ ならび
import { el } from './dom.js?v=909bdfecce1d';
import { request } from './shop.js?v=909bdfecce1d';
import { padNav } from './padnav.js?v=909bdfecce1d';
import { casinoShell, countUp, fmt, sendClose } from './casino.js?v=909bdfecce1d';
import { ROULETTE_CHIPS, ROULETTE_MAX_TOTAL, ROULETTE_MAX_SPOTS, WHEEL, numColor, BET_KINDS, betKey, betName } from '../../shared/data/roulette.js?v=909bdfecce1d';
import { coinsOf } from '../../shared/data/casino.js?v=909bdfecce1d';

const STEP = (Math.PI * 2) / WHEEL.length;
const WIDX = Object.fromEntries(WHEEL.map((n, i) => [n, i]));
const COLOR_NAME = { red: '赤', black: '黒', green: '緑' };
const SPIN_MS = 3800;
const W = 320; // 円ばんの キャンバス（ドット）

// 表の マス（v… たての 表の 行・列 / h… よこの 表の 行・列。span は いくつぶん）
function tableCells() {
  const cells = [];
  const put = (k, v, vr, vc, hr, hc, o = {}) => cells.push({ k, v, key: betKey(k, v), vr, vc, hr, hc, vrs: o.vrs || 1, vcs: o.vcs || 1, hrs: o.hrs || 1, hcs: o.hcs || 1 });
  put('num', 0, 1, 2, 1, 1, { vcs: 3, hrs: 3 });
  for (let n = 1; n <= 36; n++) {
    const row = Math.ceil(n / 3); // 1〜12
    const col = ((n - 1) % 3) + 1; // 1〜3
    put('num', n, row + 1, col + 1, 4 - col, row + 1);
  }
  for (let d = 1; d <= 3; d++) put('dozen', d, (d - 1) * 4 + 2, 1, 4, (d - 1) * 4 + 2, { vrs: 4, hcs: 4 });
  ['low', 'even', 'red', 'black', 'odd', 'high'].forEach((k, i) => put(k, null, i * 2 + 2, 5, 5, i * 2 + 2, { vrs: 2, hcs: 2 }));
  return cells;
}

export function rouletteUI(game, data) {
  ensureRouletteStyle();
  return new Promise((resolve) => {
    const sh = casinoShell(game, { title: 'ルーレット', cls: 'roulette-panel' });
    const chips = data.chips || ROULETTE_CHIPS;
    const maxTotal = data.maxTotal || ROULETTE_MAX_TOTAL;
    let coins = data.coins ?? coinsOf(game.me);
    let chip = coins >= 10 ? 10 : 1;
    let bets = {}; // key → 枚数
    let undo = []; // おいた じゅん（とりけし 用）
    let last = null; // まえの かけ（もう一度 おなじ かけ）
    let spinning = false;
    let closed = false;
    let hit = null; // 当たった 数（表を 光らせる）
    let hitKeys = [];
    const history = [];
    sh.setCoins(coins);

    // ───── 円ばん ─────
    const cv = el('canvas', { class: 'rl-wheel', width: W, height: W });
    const ctx = cv.getContext('2d');
    const msg = el('div', { class: 'cs-msg rl-msg', text: 'チップを選んで、かけたい所をタップ！\nいくつでもかけられるよ。' });
    const histEl = el('div', { class: 'rl-hist' });
    const totalEl = el('div', { class: 'rl-total' });
    const chipBtns = chips.map((c) => el('button', { class: 'btn cs-bet rl-chip', text: `${c}枚`, onclick: () => setChip(c) }));
    const spinBtn = el('button', { class: 'btn primary cs-big rl-spin', text: '回す', onclick: () => spin() });
    const undoBtn = el('button', { class: 'btn rl-small', text: 'ひとつもどす', onclick: () => undoBet() });
    const clearBtn = el('button', { class: 'btn rl-small', text: '全部もどす', onclick: () => clearBets() });
    const againBtn = el('button', { class: 'btn rl-small', text: 'まえと同じ', onclick: () => sameAgain() });
    const help = el('div', { class: 'detail rl-help', text: `数字は36倍・赤／黒・きすう／ぐうすう・1〜18／19〜36は2倍・12ずつは3倍。\n0が出ると、0の数字いがいは、はずれ。1回に${fmt(maxTotal)}枚までかけられる。` + (game.input.touch ? '' : '\n十字キー: 選ぶ／Z: チップをおく・決定／X: 閉じる') });
    const wheelBox = el('div', { class: 'win rl-left' },
      el('div', { class: 'rl-wheelwrap' }, cv, histEl), msg,
      el('div', { class: 'cs-controls rl-chips' }, el('span', { class: 'small muted', text: 'チップ' }), ...chipBtns),
      el('div', { class: 'cs-controls rl-acts' }, spinBtn, totalEl),
      el('div', { class: 'cs-controls rl-acts2' }, undoBtn, clearBtn, againBtn));

    // ───── かける 表 ─────
    const table = el('div', { class: 'rl-table' });
    const cellEls = new Map();
    for (const c of tableCells()) {
      const color = c.k === 'num' ? numColor(c.v) : c.k === 'red' ? 'red' : c.k === 'black' ? 'black' : 'out';
      const label = el('span', { class: 'rl-lab', text: c.k === 'num' ? String(c.v) : betName(c.k, c.v) });
      const badge = el('span', { class: 'rl-badge' });
      const b = el('button', {
        class: `rl-cell rl-${color}${c.k === 'num' ? ' rl-num' : ' rl-out'}`, 'aria-label': betName(c.k, c.v),
        style: `--vr:${c.vr};--vc:${c.vc};--vrs:${c.vrs};--vcs:${c.vcs};--hr:${c.hr};--hc:${c.hc};--hrs:${c.hrs};--hcs:${c.hcs}`,
        onclick: () => place(c.key),
      }, label, badge);
      cellEls.set(c.key, { b, badge, c });
      table.append(b);
    }
    const tableBox = el('div', { class: 'win rl-right' }, table, help);
    sh.body.classList.add('rl-body');
    sh.body.append(wheelBox, tableBox);

    const total = () => Object.values(bets).reduce((a, x) => a + x, 0);
    const render = () => {
      chipBtns.forEach((b, i) => b.classList.toggle('on', chips[i] === chip));
      for (const [key, e] of cellEls) {
        const n = bets[key] || 0;
        e.badge.textContent = n ? fmt(n) : '';
        e.b.classList.toggle('bet', n > 0);
        e.b.classList.toggle('hit', hitKeys.includes(key));
        e.b.classList.toggle('won', e.c.k === 'num' && e.c.v === hit);
      }
      const t = total();
      totalEl.textContent = t ? `かけた数 ${fmt(t)}枚` : 'まだかけていない';
      spinBtn.disabled = spinning;
      undoBtn.disabled = spinning || !undo.length;
      clearBtn.disabled = spinning || !t;
      againBtn.disabled = spinning || !last || !!t;
      sh.lock(spinning);
    };
    const setChip = (c) => {
      if (spinning) return;
      chip = c;
      game.audio.sfx('cursor');
      render();
    };
    const place = (key) => {
      if (spinning) return;
      if (hit !== null) { hit = null; hitKeys = []; }
      const t = total();
      if (!bets[key] && Object.keys(bets).length >= ROULETTE_MAX_SPOTS) {
        game.audio.sfx('buzz');
        msg.textContent = `かけられるのは${ROULETTE_MAX_SPOTS}か所まで。`;
        return;
      }
      const add = Math.min(chip, maxTotal - t, coins - t);
      if (add <= 0) {
        game.audio.sfx('buzz');
        msg.textContent = coins - t <= 0 ? 'コインが足りない。\nコイン売り場（左のカウンター）で買える。' : `1回にかけられるのは${fmt(maxTotal)}枚まで。`;
        render();
        return;
      }
      bets[key] = (bets[key] || 0) + add;
      undo.push([key, add]);
      game.audio.sfx('coin');
      const p = cellEls.get(key).c;
      msg.textContent = `${betName(p.k, p.v)}に${fmt(add)}枚かけた。（${p.k === 'num' ? '36倍' : `${BET_KINDS[p.k].mult}倍`}）\n「回す」で勝負！`;
      render();
    };
    const undoBet = () => {
      const u = undo.pop();
      if (!u) return;
      bets[u[0]] -= u[1];
      if (bets[u[0]] <= 0) delete bets[u[0]];
      game.audio.sfx('cancel');
      render();
    };
    const clearBets = () => {
      bets = {};
      undo = [];
      game.audio.sfx('cancel');
      msg.textContent = 'チップを全部もどした。';
      render();
    };
    const sameAgain = () => {
      if (!last) return;
      const need = Object.values(last).reduce((a, x) => a + x, 0);
      if (need > coins) {
        game.audio.sfx('buzz');
        msg.textContent = `まえと同じかけ方には、コインが${fmt(need)}枚いる。`;
        return;
      }
      bets = { ...last };
      undo = Object.entries(bets);
      game.audio.sfx('coin');
      msg.textContent = `まえと同じに${fmt(need)}枚かけた。\n「回す」で勝負！`;
      render();
    };

    // ───── 回す ─────
    const anim = { wheel: 0, ball: -Math.PI / 2, ballR: 0, landed: 0, t0: 0, from: null, to: null, skip: false, lastTick: 0 };
    const spin = async () => {
      if (spinning || closed) return;
      const t = total();
      if (!t) {
        game.audio.sfx('buzz');
        msg.textContent = 'まず、チップをかけてね。\n数字や「赤」「黒」などをタップ！';
        return;
      }
      if (t > coins) {
        game.audio.sfx('buzz');
        msg.textContent = 'コインが足りない。';
        return;
      }
      spinning = true;
      hit = null;
      hitKeys = [];
      const placed = { ...bets };
      coins -= t;
      sh.setCoins(coins);
      msg.textContent = 'ルーレットが回る…\n玉はどこに止まるかな？';
      render();
      game.audio.sfx('confirm');
      const list = Object.entries(placed).map(([key, c]) => {
        const [k, v] = key.split(':');
        return v === undefined ? { k, c } : { k, v: Number(v), c };
      });
      const res = await request(game, { kind: 'casino', action: 'roulette', bets: list });
      if (closed) return;
      if (!res.ok || !Number.isInteger(res.n)) {
        spinning = false;
        coins = res.coins ?? coinsOf(game.me);
        sh.setCoins(coins);
        game.audio.sfx('buzz');
        msg.textContent = res.text || 'うまく回らなかった…';
        render();
        return;
      }
      // 円ばんと 玉の 動き（さいごに 当たりの 数が 上の 三角の ところへ）
      const idx = WIDX[res.n];
      const wEnd = -idx * STEP;
      let dw = wEnd - anim.wheel;
      dw = ((dw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) + Math.PI * 4;
      anim.ball = anim.wheel + anim.landed * STEP - Math.PI / 2; // 今 玉が いる ポケット
      let db = -Math.PI / 2 - anim.ball;
      db = -((((-db) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI * 8;
      Object.assign(anim, { x: 0, from: { w: anim.wheel, b: anim.ball }, to: { w: anim.wheel + dw, b: anim.ball + db }, skip: false, result: res, placed });
    };

    const finishSpin = () => {
      const res = anim.result;
      anim.to = null;
      anim.landed = WIDX[res.n];
      anim.wheel = -anim.landed * STEP;
      spinning = false;
      hit = res.n;
      hitKeys = res.hits || [];
      last = anim.placed;
      bets = {};
      undo = [];
      history.unshift(res.n);
      history.length = Math.min(history.length, 8);
      renderHistory();
      const col = COLOR_NAME[numColor(res.n)];
      if (res.win > 0) {
        msg.textContent = `${res.n}（${col}）！\nコインを${fmt(res.win)}枚手に入れた！`;
        if (res.win >= res.bet * 10) game.audio.play('jackpot');
        else game.audio.sfx('win');
        countUp(sh, coins, res.coins, () => game.audio.sfx('coin'));
      } else {
        msg.textContent = `${res.n}（${col}）…\nざんねん、はずれ。`;
        game.audio.sfx('buzz');
        sh.setCoins(res.coins);
      }
      coins = res.coins;
      render();
    };

    const renderHistory = () => {
      histEl.innerHTML = '';
      for (const n of history) histEl.append(el('span', { class: `rl-h rl-${numColor(n)}`, text: String(n) }));
    };

    // ───── 絵 ─────
    let raf = 0;
    let lastNow = performance.now();
    const tick = (now) => {
      if (closed || !sh.root.isConnected) return;
      const real = Math.min(250, now - lastNow); // おそい 画面でも おなじ 時間で 止まる
      const dt = Math.min(50, real);
      lastNow = now;
      if (anim.to) {
        // タップで はやおくり（のこりを 0.3びょうで）
        anim.x = Math.min(1, (anim.x || 0) + real / (anim.skip ? 300 : SPIN_MS));
        const x = anim.x;
        const e = 1 - (1 - x) ** 3;
        const eb = 1 - (1 - x) ** 2.4;
        anim.wheel = anim.from.w + (anim.to.w - anim.from.w) * e;
        anim.ball = anim.from.b + (anim.to.b - anim.from.b) * eb;
        anim.ballR = x < 0.7 ? 0 : (x - 0.7) / 0.3;
        // カラカラ（玉が ポケットを こえる 音）
        if (now - anim.lastTick > 60 + x * 260) {
          anim.lastTick = now;
          if (x < 0.97) game.audio.sfx('reel');
        }
        if (x >= 1) finishSpin();
      } else {
        anim.wheel += dt * 0.00025; // ゆっくり 回っている
      }
      drawWheel(ctx, anim);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    render();
    const nav = padNav(sh.root, { onB: () => close(), sound: (x) => game.audio.sfx(x), start: () => spinBtn });
    const h = {
      el: sh.root,
      onNav: (a) => {
        if (spinning) {
          if (a === 'a' && anim.to) anim.skip = true;
          return;
        }
        nav.onNav(a);
      },
    };
    game.input.push(h);
    const close = () => {
      if (closed || spinning) return;
      closed = true;
      cancelAnimationFrame(raf);
      clearInterval(sh.countTimer);
      game.input.pop(h);
      game.audio.sfx('cancel');
      sh.remove();
      sendClose(game);
      resolve();
    };
    sh.onClose = close;
    // 回っている ときに 円ばんを タップすると すぐ 止まる（見た目だけ。結果は もう きまっている）
    cv.addEventListener('click', () => { if (spinning && anim.to) anim.skip = true; });
  });
}

// 円ばんを かく（上の 三角が 当たりの 場所）
function drawWheel(ctx, a) {
  const c = W / 2;
  ctx.clearRect(0, 0, W, W);
  // そとの わく
  ctx.fillStyle = '#5a2a14';
  ctx.beginPath(); ctx.arc(c, c, 156, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a4a1e';
  ctx.beginPath(); ctx.arc(c, c, 148, 0, Math.PI * 2); ctx.fill();
  // 玉の 通る 道
  ctx.fillStyle = '#2a1408';
  ctx.beginPath(); ctx.arc(c, c, 140, 0, Math.PI * 2); ctx.fill();
  // ポケット
  const r1 = 124, r0 = 92;
  for (let i = 0; i < WHEEL.length; i++) {
    const n = WHEEL[i];
    const ang = a.wheel + i * STEP - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(ang - STEP / 2) * r0, c + Math.sin(ang - STEP / 2) * r0);
    ctx.arc(c, c, r1, ang - STEP / 2, ang + STEP / 2);
    ctx.arc(c, c, r0, ang + STEP / 2, ang - STEP / 2, true);
    ctx.closePath();
    const col = numColor(n);
    ctx.fillStyle = col === 'red' ? '#d0283a' : col === 'black' ? '#1c1c2a' : '#1f8a3a';
    ctx.fill();
    ctx.strokeStyle = '#e8c060';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.translate(c + Math.cos(ang) * 110, c + Math.sin(ang) * 110);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px DotGothic16, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 0, 0);
    ctx.restore();
  }
  // まん中
  const g = ctx.createRadialGradient(c - 20, c - 20, 10, c, c, 92);
  g.addColorStop(0, '#ffe9a0');
  g.addColorStop(0.6, '#c8902a');
  g.addColorStop(1, '#6a4010');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(c, c, 92, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(a.wheel);
  ctx.strokeStyle = '#fff4c0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46); ctx.stroke();
    ctx.fillStyle = '#fff4c0';
    ctx.beginPath(); ctx.arc(0, -46, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#e8c060';
  ctx.beginPath(); ctx.arc(c, c, 12, 0, Math.PI * 2); ctx.fill();
  // 玉（回っている 間は そとの 道・止まると ポケットの 中）
  let bx, by;
  if (a.to) {
    const r = 134 - a.ballR * 26;
    bx = c + Math.cos(a.ball) * r;
    by = c + Math.sin(a.ball) * r;
  } else {
    const ang = a.wheel + a.landed * STEP - Math.PI / 2;
    bx = c + Math.cos(ang) * 108;
    by = c + Math.sin(ang) * 108;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.arc(bx + 2, by + 2, 7, 0, Math.PI * 2); ctx.fill();
  const bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#b8b8c8');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
  // 上の 三角（当たりの しるし）
  ctx.fillStyle = '#ffd84a';
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c - 11, 2); ctx.lineTo(c + 11, 2); ctx.lineTo(c, 22); ctx.closePath();
  ctx.fill(); ctx.stroke();
}

// ───────────── 見た目 ─────────────
let styled = false;
function ensureRouletteStyle() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'roulette-style';
  st.textContent = `
.cs-body.rl-body { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.5fr); }
.rl-left { display: flex; flex-direction: column; align-items: center; gap: 0.35em; min-height: 0; overflow-y: auto; }
.rl-wheelwrap { position: relative; width: min(100%, 260px); }
.rl-wheel { display: block; width: 100%; height: auto; aspect-ratio: 1 / 1; }
.rl-hist { display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; min-height: 1.3em; margin-top: 2px; }
.rl-h { min-width: 1.6em; text-align: center; font-size: var(--fs-small); border-radius: 3px; padding: 0 0.15em; color: #fff; }
.rl-h:first-child { outline: 2px solid var(--accent); }
.rl-msg { min-height: 2.9em; font-size: 0.95em; }
.rl-chips .rl-chip { min-width: 3.6em; }
.rl-total { font-size: var(--fs-small); color: var(--accent); min-width: 7em; text-align: center; }
.rl-small { min-height: 40px; font-size: var(--fs-small); padding-left: 0.5em; padding-right: 0.5em; }
.rl-right { display: flex; flex-direction: column; gap: 0.4em; min-height: 0; overflow: auto; }
.rl-table { flex: 1 1 auto; min-height: 220px; display: grid; gap: 3px; grid-template-columns: repeat(13, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(36px, 1fr)); }
.rl-cell { grid-row: var(--hr) / span var(--hrs); grid-column: var(--hc) / span var(--hcs); position: relative; border: 1px solid rgba(255, 230, 160, 0.55);
  border-radius: 4px; color: #fff; font: inherit; font-size: 0.95em; padding: 0; min-width: 0; min-height: 0; cursor: pointer; touch-action: manipulation;
  display: flex; align-items: center; justify-content: center; }
.rl-cell.rl-red { background: #b8202f; }
.rl-cell.rl-black { background: #23233a; }
.rl-cell.rl-green { background: #17803a; }
.rl-cell.rl-out { background: #1f5a34; font-size: 0.85em; }
.rl-cell.rl-out.rl-red { background: #b8202f; }
.rl-cell.rl-out.rl-black { background: #23233a; }
.rl-cell:active { filter: brightness(1.3); }
.rl-cell.bet { box-shadow: inset 0 0 0 2px #ffd84a; }
.rl-cell.hit { box-shadow: inset 0 0 0 3px #fff; }
.rl-cell.won { animation: rl-won 0.5s steps(2) infinite; }
@keyframes rl-won { 50% { filter: brightness(1.8); } }
.rl-cell.pad-focus, .roulette-panel .btn.pad-focus { outline: 3px solid #fff; outline-offset: -1px; z-index: 1; }
.rl-badge { position: absolute; right: 1px; bottom: 1px; min-width: 1.4em; padding: 0 0.2em; border-radius: 0.7em; background: #ffd84a; color: #3a1a08;
  font-size: 0.7em; line-height: 1.35; text-align: center; font-variant-numeric: tabular-nums; }
.rl-badge:empty { display: none; }
.rl-help { margin: 0; }
@media (max-aspect-ratio: 1/1) {
  .cs-body.rl-body { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
  .rl-left { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); grid-template-rows: auto auto auto auto; align-items: center; overflow: visible; }
  .rl-wheelwrap { grid-row: 1 / span 3; width: 100%; max-width: 190px; justify-self: center; }
  .rl-msg { grid-column: 2; font-size: 0.85em; min-height: 3.6em; }
  .rl-chips { grid-column: 2; }
  .rl-acts { grid-column: 2; }
  .rl-acts2 { grid-column: 1 / span 2; }
  .rl-chips .rl-chip { min-width: 2.9em; padding-left: 0.3em; padding-right: 0.3em; }
  .rl-spin.cs-big { min-width: 5em; min-height: 46px; }
  .rl-table { grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(13, minmax(30px, 1fr)); min-height: 0; }
  .rl-cell { grid-row: var(--vr) / span var(--vrs); grid-column: var(--vc) / span var(--vcs); }
  .rl-help { font-size: 0.8em; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .cs-body.rl-body { grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.6fr); }
  .rl-left { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr); align-items: center; align-content: start; }
  .rl-wheelwrap { grid-row: 1 / span 4; width: 100%; max-width: 170px; }
  .rl-msg { grid-column: 2; font-size: 0.8em; min-height: 3.2em; }
  .rl-chips, .rl-acts, .rl-acts2 { grid-column: 2; }
  .rl-chips .rl-chip { min-width: 2.6em; min-height: 36px; padding-left: 0.2em; padding-right: 0.2em; }
  .rl-small { min-height: 34px; font-size: 0.75em; }
  .rl-spin.cs-big { min-width: 4.5em; min-height: 40px; }
  .rl-table { grid-template-rows: repeat(5, minmax(30px, 1fr)); min-height: 0; }
  .rl-help { display: none; }
}
`;
  document.head.append(st);
}
