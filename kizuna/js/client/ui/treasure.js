// 宝の地図（メニューの「道具」に ならぶ・地図の 絵・ほる・見つけた 穴）
import { el, ListMenu, confirmBox, esc } from './dom.js?v=a39a58253380';
import { MAPS, tileAt } from '../../shared/maps/index.js?v=a39a58253380';
import { T } from '../../shared/tiles.js?v=a39a58253380';
import { hash2 } from '../../shared/rng.js?v=a39a58253380';
import { caveInfo, tmTitle, foundFlag, TM_THEMES } from '../../shared/data/treasure.js?v=a39a58253380';
import { treasureHintLines, fromHereLine } from '../../shared/data/treasure-hint.js?v=a39a58253380';
import { makeCanvas, ctxOf } from '../render/pixel.js?v=a39a58253380';

const CSS = `
.tmap-view { width: min(92vw, 440px); z-index: 5; background: var(--win-solid); align-items: center; gap: 0.35em; }
.tmap-view .tm-title { align-self: stretch; }
.tmap-view canvas.tm-pic { width: min(80vw, 380px); max-height: 44vh; object-fit: contain; image-rendering: pixelated; border-radius: 6px; box-shadow: 0 0 0 2px #5a3e22, 0 4px 14px rgba(0,0,0,0.5); }
.tmap-view .tm-info { align-self: stretch; white-space: pre-wrap; line-height: 1.55; }
.tmap-view .tm-hint { align-self: stretch; color: #ffd66b; }
.tmap-view .menu { align-self: stretch; }
.menu .tag.tm-new { color: #ffd66b; }
.menu .tag.tm-found { color: #8fd0ff; }
.menu .tag.tm-clear { color: var(--muted); }
@media (orientation: landscape) and (max-height: 520px) {
  .tmap-view { width: min(94vw, 720px); display: grid; grid-template-columns: auto 1fr; align-items: start; }
  .tmap-view .tm-title { grid-column: 1 / 3; }
  .tmap-view canvas.tm-pic { grid-row: 2 / 5; width: min(46vw, 340px); max-height: 60vh; }
}
`;
let cssDone = false;
function ensureCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  document.head.append(el('style', { text: CSS }));
}

const STATE = (tm) => (tm.cleared ? ['tm-clear', 'クリア'] : tm.found ? ['tm-found', '発見'] : ['tm-new', '未発見']);

// 道具の 一覧に ならべる 行
export function treasureRows(c) {
  const list = Array.isArray(c?.treasureMaps) ? c.treasureMaps : [];
  return list.map((tm) => {
    const [cls, label] = STATE(tm);
    const name = tmTitle(tm);
    return { html: `${esc(name)}<span class="tag ${cls}">${label}</span>`, label: name, value: `tm:${tm.id}`, tmap: tm.id };
  });
}

const findMap = (game, id) => (game.me?.treasureMaps || []).find((t) => t.id === id);

// どの あたりの 地図か（目じるしからの 方角と 歩数・まわりの 地形。data/treasure-hint.js）
function whereText(tm) {
  return treasureHintLines(tm).join('\n');
}

// 今いる 場所から 何の 方角へ 何歩か（同じ マップの ときだけ）
function nearHint(game, tm) {
  const f = game.field;
  if (!f?.me) return '';
  return fromHereLine(tm, f.mapId, f.me.x, f.me.y);
}

function stateText(tm) {
  const cave = caveInfo(tm.seed, tm.lv);
  if (tm.cleared) return `${cave.caveName}の主をたおした。\n（また入ることもできる）`;
  if (tm.found) return `${cave.caveName}の入り口を見つけた。\n（地下${cave.floors}階まである。いちばんおくに主がいる）`;
  return 'まだ宝の場所を見つけていない。\n宝の場所は、地面が赤く光っている。';
}

export function treasureDetail(game, id) {
  const tm = findMap(game, id);
  if (!tm) return '';
  const hint = nearHint(game, tm);
  return `${whereText(tm)}\n${stateText(tm)}${hint ? `\n${hint}` : ''}`;
}

// ───────────── 地図の 絵（地形だけ。宝の 場所の しるしは 見つけるまで かかない）─────────────
const PAPER = '#ead7a8';
const INK = '#5c3f22';
function tileLook(t) {
  switch (t) {
    case T.TREE: case T.PINE: return ['#c9c58c', 'tree'];
    case T.FOREST_FLOOR: return ['#d6cf98', null];
    case T.MOUNTAIN: case T.ROCK: case T.CLIFF: case T.RUBBLE_WALL: return ['#cdae84', 'mtn'];
    case T.HILL: return ['#e1cd98', 'hill'];
    case T.WATER: case T.STEPPING: case T.BROKEN_BRIDGE: return ['#a9c3c3', 'wave'];
    case T.DEEP: case T.WHIRLPOOL: return ['#93b3b9', 'wave'];
    case T.SAND: return ['#f0e1b6', 'dot'];
    case T.DIRT: return ['#d2b27c', null];
    case T.SWAMP: return ['#baa9a2', 'dot'];
    case T.BRIDGE_H: case T.BRIDGE_V: case T.PIER: return ['#b08a58', null];
    case T.CAVE_ENTRANCE: case T.STAIRS_DOWN: return ['#6a4a30', null];
    case T.FLOWERS: case T.TOWN_FLOWERS: return ['#ecd6a8', 'dot'];
    default:
      if (t >= 30 && t < 70) return ['#c29c6a', 'house'];
      return [PAPER, null];
  }
}

export function drawTreasurePicture(canvas, tm) {
  const m = MAPS[tm.map];
  const VW = 24, VH = 17, P = 6;
  canvas.width = VW * P;
  canvas.height = VH * P;
  const x = ctxOf(canvas);
  x.fillStyle = PAPER;
  x.fillRect(0, 0, canvas.width, canvas.height);
  if (!m) return canvas;
  // 宝の 場所が まんなかに ならない ように すこし ずらす（地図ごとに きまった ずれ）
  const ox = Math.round((hash2(tm.seed, 1, 71) - 0.5) * 12), oy = Math.round((hash2(tm.seed, 2, 73) - 0.5) * 7);
  const x0 = Math.max(0, Math.min(m.w - VW, tm.x + ox - (VW >> 1)));
  const y0 = Math.max(0, Math.min(m.h - VH, tm.y + oy - (VH >> 1)));
  for (let ty = 0; ty < VH; ty++) {
    for (let tx = 0; tx < VW; tx++) {
      const mx = x0 + tx, my = y0 + ty;
      const t = tileAt(m, mx, my);
      const [base, sym] = tileLook(t);
      const px = tx * P, py = ty * P;
      x.fillStyle = base;
      x.fillRect(px, py, P, P);
      const n = hash2(mx, my, 5);
      x.fillStyle = INK;
      if (sym === 'tree' && n < 0.8) {
        // 木（すこし ずらして 手がきの ように）
        const dx = Math.floor(hash2(mx, my, 6) * 3) - 1, dy = Math.floor(hash2(mx, my, 8) * 2);
        x.globalAlpha = 0.5;
        x.fillRect(px + 2 + dx, py + dy, 2, 1);
        x.fillRect(px + 1 + dx, py + 1 + dy, 4, 2);
        x.globalAlpha = 0.7;
        x.fillRect(px + 2 + dx, py + 3 + dy, 1, 2);
      } else if (sym === 'mtn') {
        x.globalAlpha = 0.6;
        for (let k = 0; k < 3; k++) { x.fillRect(px + 2 - k, py + 1 + k, 1, 1); x.fillRect(px + 2 + k, py + 1 + k, 1, 1); }
        x.fillRect(px, py + 4, 6, 1);
      } else if (sym === 'wave' && n < 0.35) {
        x.globalAlpha = 0.4;
        x.fillRect(px + 1, py + 2, 2, 1);
        x.fillRect(px + 3, py + 3, 2, 1);
      } else if (sym === 'dot' && n < 0.4) {
        x.globalAlpha = 0.35;
        x.fillRect(px + 2, py + 2, 1, 1);
      } else if (sym === 'hill' && n < 0.3) {
        x.globalAlpha = 0.35;
        x.fillRect(px + 1, py + 3, 4, 1);
        x.fillRect(px + 2, py + 2, 2, 1);
      } else if (sym === 'house') {
        x.globalAlpha = 0.35;
        x.fillRect(px, py + 5, 6, 1);
      }
      x.globalAlpha = 1;
    }
  }
  // 見つけた 地図だけ 赤い ✕
  if (tm.found) {
    const cx = (tm.x - x0) * P + P / 2, cy = (tm.y - y0) * P + P / 2;
    x.fillStyle = '#c0281c';
    for (let k = -4; k <= 4; k++) {
      x.fillRect(cx + k - 1, cy + k - 1, 2, 2);
      x.fillRect(cx + k - 1, cy - k - 1, 2, 2);
    }
  }
  // 方角の しるし（北が 上。ヒントの「北へ」「南東へ」と あわせて 見る）
  {
    const cx = canvas.width - 10, cy = 5;
    x.globalAlpha = 0.85;
    x.fillStyle = INK;
    x.beginPath();
    x.moveTo(cx, cy);
    x.lineTo(cx + 3.5, cy + 5);
    x.lineTo(cx - 3.5, cy + 5);
    x.closePath();
    x.fill();
    x.font = 'bold 9px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'top';
    x.fillText('北', cx, cy + 6);
    x.globalAlpha = 1;
  }
  // 古い 紙の ふち（こげた ような かげ）
  const g = x.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.35, canvas.width / 2, canvas.height / 2, canvas.width * 0.62);
  g.addColorStop(0, 'rgba(120, 80, 30, 0)');
  g.addColorStop(1, 'rgba(110, 70, 25, 0.55)');
  x.fillStyle = g;
  x.fillRect(0, 0, canvas.width, canvas.height);
  x.fillStyle = 'rgba(70, 40, 15, 0.8)';
  for (let i = 0; i < canvas.width; i++) {
    x.fillRect(i, 0, 1, 1 + Math.floor(hash2(i, 0, tm.seed & 0xffff) * 3));
    x.fillRect(i, canvas.height - 1 - Math.floor(hash2(i, 1, tm.seed & 0xffff) * 3), 1, 3);
  }
  for (let j = 0; j < canvas.height; j++) {
    x.fillRect(0, j, 1 + Math.floor(hash2(0, j, tm.seed & 0xffff) * 3), 1);
    x.fillRect(canvas.width - 1 - Math.floor(hash2(1, j, tm.seed & 0xffff) * 3), j, 3, 1);
  }
  return canvas;
}

// ───────────── 地図を 見る（ほる・捨てる）─────────────
export function openTreasureMap(menu, id) {
  const g = menu.game;
  const tm = findMap(g, id);
  if (!tm) return;
  ensureCss();
  menu.sub?.blur();
  const cave = caveInfo(tm.seed, tm.lv);
  const back = el('div', { class: 'modal-back', style: { zIndex: 4 } });
  const box = el('div', { class: 'win panel center-panel tmap-view' });
  const pic = drawTreasurePicture(makeCanvas(10, 10), tm);
  pic.classList.add('tm-pic');
  const hint = nearHint(g, tm);
  box.append(
    el('div', { class: 'gold tm-title', text: `${tmTitle(tm)}　（${TM_THEMES[cave.theme].label}の洞窟）` }),
    pic,
    el('div', { class: 'small tm-info', text: `${whereText(tm)}\n${stateText(tm)}` }),
    ...(hint ? [el('div', { class: 'small tm-hint', text: hint })] : []),
  );
  const done = (next) => {
    lm.blur();
    back.remove();
    box.remove();
    menu.popupOpen = false;
    if (next === 'close') menu.close();
    else setTimeout(() => { if (menu.root) menu.focusSub(menu.itemsList(true)); }, next === 'drop' ? 150 : 0);
  };
  const lm = new ListMenu(g.input, {
    items: [
      { label: tm.found ? '洞窟に入る（この場所を調べる）' : 'ほる（この場所を調べる）', value: 'dig' },
      { label: '地図を捨てる', value: 'drop' },
      { label: '閉じる', value: null },
    ],
    sound: menu.sfx,
    back: null,
    onCancel: () => done(),
    onSelect: async (it) => {
      if (it.value === 'dig') {
        g.net.send({ t: 'menu', action: 'tmap', op: 'dig', id: tm.id });
        return done('close');
      }
      if (it.value === 'drop') {
        lm.blur();
        const ok = await confirmBox(g.input, `${tmTitle(tm)}を捨てますか？\n（捨てた地図はもどってこない）`, '捨てる', 'やめる', menu.sfx);
        if (ok) {
          g.net.send({ t: 'menu', action: 'tmap', op: 'discard', id: tm.id });
          return done('drop');
        }
        lm.focus();
        return;
      }
      done();
    },
  });
  box.append(lm.root);
  back.addEventListener('click', () => { menu.sfx('cancel'); done(); });
  document.getElementById('ui').append(back, box);
  menu.popupOpen = true;
  lm.focus();
}

// ───────────── 見つけた 地図の 場所に 穴（自分の 地図だけ。フラグで 出る）─────────────
let gateSig = '';
export function syncTreasureGates(game) {
  const list = (game?.me?.treasureMaps || []).filter((t) => t.found && MAPS[t.map]);
  const sig = list.map((t) => `${t.map}:${t.x}:${t.y}:${t.seed}`).join('|');
  if (sig === gateSig) return;
  gateSig = sig;
  for (const id of ['overworld', 'sea']) {
    const m = MAPS[id];
    if (!m) continue;
    m.gates = m.gates.filter((gt) => !gt.tm);
    m.gateAt = undefined;
  }
  for (const t of list) {
    const m = MAPS[t.map];
    const closed = tileAt(m, t.x, t.y);
    if (closed === T.STAIRS_DOWN) continue;
    m.gates.push({ x: t.x, y: t.y, closed, open: T.STAIRS_DOWN, flag: foundFlag(t.seed), tm: true });
  }
}
