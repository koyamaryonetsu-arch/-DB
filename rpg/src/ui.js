'use strict';
/* =====================================================================
 * ui.js — DQ-style UI widgets
 *   message window / choice / list menus / quantity / name entry /
 *   party status windows / gold window
 * ===================================================================== */

const MSG_SPEEDS = [0.45, 0.9, 1.8, 99];

function fmtText(t) {
  const h = Game.s ? Game.hero() : null;
  return String(t).replace(/\{hero\}/g, h ? h.name : 'ゆうしゃ');
}

/* ---------- message window ---------- */
class MsgScene {
  constructor() {
    this.x = 8; this.y = 158; this.w = 240; this.h = 76;
    this.page = []; this.queue = []; this.chars = 0; this.total = 0;
    this.state = 'idle'; this.res = null; this.opts = {}; this.tick = 0;
  }
  show(text, opts = {}) {
    return new Promise(res => {
      if (this.res) { const r = this.res; this.res = null; r(); }
      const lines = wrapText(fmtText(text), this.w - 26, 12);
      const pages = [];
      for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4));
      if (!pages.length) pages.push(['']);
      this.queue = pages; this.res = res; this.opts = opts;
      this.nextPage();
    });
  }
  nextPage() {
    this.page = this.queue.shift();
    this.chars = 0;
    this.total = this.page.reduce((a, l) => a + [...l].length, 0);
    this.state = 'typing';
    if (this.opts.instant) this.chars = this.total;
  }
  finish() { this.state = 'idle'; const r = this.res; this.res = null; if (r) r(); }
  update() {
    this.tick++;
    if (this.state === 'typing') {
      if (Input.pressed('a') || Input.pressed('b')) this.chars = this.total;
      else {
        const before = Math.floor(this.chars);
        this.chars += MSG_SPEEDS[Game.settings.msgSpeed] || 0.9;
        if (Math.floor(this.chars) !== before && Math.floor(this.chars) % 2 === 0 && this.chars < this.total) Sound.sfx('text');
      }
      if (this.chars >= this.total) {
        this.chars = this.total;
        if (!this.queue.length && this.opts.wait === false) this.finish();
        else this.state = 'wait';
      }
    } else if (this.state === 'wait') {
      if (this.opts.auto && ++this.opts._t > this.opts.auto) { this.advance(); return; }
      if (Input.pressed('a') || Input.pressed('b')) this.advance();
    }
  }
  advance() {
    if (this.queue.length) this.nextPage(); else this.finish();
  }
  render() {
    drawWindow(this.x, this.y, this.w, this.h);
    let left = Math.floor(this.chars);
    for (let i = 0; i < this.page.length; i++) {
      const chars = [...this.page[i]];
      const s = chars.slice(0, Math.max(0, left)).join('');
      left -= chars.length;
      drawText(s, this.x + 13, this.y + 10 + i * 15);
    }
    if (this.state === 'wait' && !this.opts.auto && (this.tick >> 4) % 2 === 0) drawDownArrow(this.x + this.w / 2 - 3, this.y + this.h - 9);
  }
}
const Msg = {
  scene: null,
  open() {
    if (!this.scene || !Scenes.has(this.scene)) this.scene = Scenes.push(new MsgScene());
    else if (Scenes.top() !== this.scene) { Scenes.remove(this.scene); Scenes.push(this.scene); }   // bring to front
    return this.scene;
  },
  say(text, opts) { return this.open().show(text, opts); },
  close() { if (this.scene) { Scenes.remove(this.scene); this.scene = null; } },
  isOpen() { return !!this.scene && Scenes.has(this.scene); },
};
function say(text, opts) { return Msg.say(text, opts); }
function closeMsg() { Msg.close(); }

/* ---------- generic list menu (stays on the stack until close()) ---------- */
class Menu {
  constructor(o) {
    this.items = (o.items || []).map(it => (typeof it === 'string' ? { label: it } : it));
    this.cols = o.cols || 1;
    this.x = o.x ?? 8; this.y = o.y ?? 8;
    this.lineH = o.lineH || 15;
    this.title = o.title || null;
    this.cancel = o.cancel !== false;
    this.index = clamp(o.index || 0, 0, Math.max(0, this.items.length - 1));
    this.onChange = o.onChange || null;
    this.rowsVisible = o.rows || Math.ceil(this.items.length / this.cols) || 1;
    this.topRow = 0;
    const maxLabel = Math.max(24, ...this.items.map(it => textWidth(it.label, 12) + (it.right ? textWidth(it.right, 12) + 12 : 0)));
    this.w = o.w || Math.min(SW - this.x - 4, Math.ceil(maxLabel * this.cols + 16 * this.cols + 12));
    this.h = o.h || this.rowsVisible * this.lineH + 16;
    this.active = false; this.res = null; this.tick = 0;
    this.border = o.border || COL.white;
    this.ensureVisible();
  }
  get rowsTotal() { return Math.ceil(this.items.length / this.cols); }
  ensureVisible() {
    const r = Math.floor(this.index / this.cols);
    if (r < this.topRow) this.topRow = r;
    if (r >= this.topRow + this.rowsVisible) this.topRow = r - this.rowsVisible + 1;
  }
  choose() {
    if (!Scenes.has(this)) Scenes.push(this);
    this.active = true;
    if (this.onChange) this.onChange(this.index, this.items[this.index]);
    return new Promise(res => { this.res = res; });
  }
  close() { this.active = false; Scenes.remove(this); }
  resolve(v) { this.active = false; const r = this.res; this.res = null; if (r) r(v); }
  move(d) {
    const n = this.items.length;
    if (!n) return;
    let i = this.index;
    if (d === 'up') i -= this.cols; else if (d === 'down') i += this.cols;
    else if (d === 'left') { if (this.cols === 1) return; i -= 1; } else if (d === 'right') { if (this.cols === 1) return; i += 1; }
    if (d === 'up' || d === 'down') {
      if (i < 0) { i = (this.rowsTotal - 1) * this.cols + (this.index % this.cols); if (i >= n) i -= this.cols; }
      else if (i >= n) i = this.index % this.cols;
    } else i = (i + n) % n;
    if (i !== this.index) { this.index = i; this.ensureVisible(); Sound.sfx('cursor'); if (this.onChange) this.onChange(i, this.items[i]); }
  }
  update() {
    this.tick++;
    if (!this.active) return;
    for (const d of DIRS) if (Input.repeat(d)) { this.move(d); break; }
    if (Input.pressed('a')) {
      const it = this.items[this.index];
      if (!it || it.disabled) { Sound.sfx('buzz'); return; }
      Sound.sfx('confirm');
      this.resolve(this.index);
    } else if (Input.pressed('b') && this.cancel) {
      Sound.sfx('cancel');
      this.resolve(-1);
    }
  }
  render() {
    drawWindow(this.x, this.y, this.w, this.h, this.border, this.title);
    const colW = (this.w - 12) / this.cols;
    for (let r = 0; r < this.rowsVisible; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = (this.topRow + r) * this.cols + c;
        const it = this.items[i];
        if (!it) continue;
        const x = this.x + 8 + c * colW, y = this.y + 9 + r * this.lineH;
        drawText(it.label, x + 9, y, it.disabled ? COL.dim : (it.color || COL.white));
        if (it.right) drawText(it.right, this.x + (c + 1) * colW, y, it.disabled ? COL.dim : COL.white, 12, 'right');
        if (i === this.index && (!this.active || (this.tick >> 3) % 4 !== 3)) drawCursor(x, y + 2, this.active ? COL.white : COL.gray);
      }
    }
    if (this.topRow > 0) drawTriangleUp(this.x + this.w / 2 - 3, this.y + 3);
    if (this.topRow + this.rowsVisible < this.rowsTotal && (this.tick >> 4) % 2 === 0) drawDownArrow(this.x + this.w / 2 - 3, this.y + this.h - 7);
  }
}
function drawTriangleUp(x, y) { fillRect(x + 3, y, 1, 1, COL.white); fillRect(x + 2, y + 1, 3, 1, COL.white); fillRect(x + 1, y + 2, 5, 1, COL.white); }

/* one-shot choice: pushes a menu, resolves index (-1 cancel), removes itself */
async function choose(items, opts = {}) {
  const m = new Menu(Object.assign({ x: 180, y: 110 }, opts, { items }));
  if (opts.x == null) m.x = SW - m.w - 8;
  if (opts.y == null) m.y = 154 - m.h;
  const r = await m.choose();
  m.close();
  return r;
}
async function yesno(q, opts = {}) {
  if (q) await say(q, { wait: false });
  const r = await choose(['はい', 'いいえ'], opts);
  return r === 0;
}

/* ---------- small info windows ---------- */
function drawGoldWindow(x = 176, y = 8) {
  const g = Game.s.gold;
  drawWindow(x, y, 72, 26);
  drawText('G', x + 10, y + 7, COL.yellow);
  drawText(String(g), x + 64, y + 7, COL.white, 12, 'right');
}
class InfoScene {    // generic drawable overlay (used for gold windows, descriptions)
  constructor(draw) { this.draw = draw; }
  render() { this.draw(); }
}
function pushInfo(draw) { return Scenes.push(new InfoScene(draw)); }

/* party status windows, DQ style: name on the top border */
function statusBorder(m) {
  if (m.hp <= 0) return COL.red;
  if (m.hp < m.mhp / 4) return COL.orange;
  return COL.white;
}
function drawPartyStatus(y = 6, members = Game.party, highlight = -1) {
  const n = members.length;
  const w = 62, gap = 2, total = n * w + (n - 1) * gap;
  let x = Math.floor((SW - total) / 2);
  members.forEach((m, i) => {
    const bc = statusBorder(m);
    const hl = i === highlight;
    drawWindow(x, y, w, 56, hl ? COL.yellow : bc);
    // name on border
    const nw = textWidth(m.name, 12);
    fillRect(x + 6, y, nw + 6, 5, '#000');
    drawText(m.name, x + 9, y - 3, hl ? COL.yellow : bc);
    const col = m.hp <= 0 ? COL.red : bc === COL.orange ? COL.orange : COL.white;
    drawText('H', x + 8, y + 10, col);
    drawText(String(m.hp), x + w - 8, y + 10, col, 12, 'right');
    drawText('M', x + 8, y + 24, col);
    drawText(String(m.mp), x + w - 8, y + 24, col, 12, 'right');
    drawText(JOBS[m.job].short + ':', x + 8, y + 38, col);
    drawText(String(m.level), x + w - 8, y + 38, col, 12, 'right');
    if (m.status && m.status.poison && m.hp > 0) fillRect(x + w - 10, y + 5, 3, 3, '#b060e0');
    x += w + gap;
  });
}

/* ---------- quantity chooser (shops) ---------- */
function chooseQty(max, unit, x = 120, y = 90) {
  return new Promise(res => {
    const sc = {
      n: 1, tick: 0,
      update() {
        this.tick++;
        if (Input.repeat('up') || Input.repeat('right')) { this.n = this.n >= max ? 1 : this.n + 1; Sound.sfx('cursor'); }
        if (Input.repeat('down') || Input.repeat('left')) { this.n = this.n <= 1 ? max : this.n - 1; Sound.sfx('cursor'); }
        if (Input.pressed('a')) { Sound.sfx('confirm'); Scenes.remove(this); res(this.n); }
        else if (Input.pressed('b')) { Sound.sfx('cancel'); Scenes.remove(this); res(0); }
      },
      render() {
        drawWindow(x, y, 128, 42);
        drawText('×', x + 12, y + 9); drawText(String(this.n).padStart(2, ' '), x + 44, y + 9, COL.white, 12, 'right');
        if ((this.tick >> 3) % 4 !== 3) { drawTriangleUp(x + 52, y + 7); drawDownArrow(x + 52, y + 17); }
        drawText((unit * this.n) + ' G', x + 118, y + 9, COL.yellow, 12, 'right');
        drawText('↑↓で かず', x + 12, y + 25, COL.gray);
      },
    };
    Scenes.push(sc);
  });
}

/* ---------- name entry (kana board) ---------- */
const KANA_PAGES = [
  { name: 'ひらがな', rows: ['あいうえおはひふへほ', 'かきくけこまみむめも', 'さしすせそやゆよ゛゜', 'たちつてとらりるれろ', 'なにぬねのわをんー！', 'ぁぃぅぇぉっゃゅょ・'] },
  { name: 'カタカナ', rows: ['アイウエオハヒフヘホ', 'カキクケコマミムメモ', 'サシスセソヤユヨ゛゜', 'タチツテトラリルレロ', 'ナニヌネノワヲンー！', 'ァィゥェォッャュョ・'] },
  { name: 'ABC', rows: ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ.-!?', 'abcdefghij', 'klmnopqrst', 'uvwxyz0123'] },
];
const DAKU = {
  'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご', 'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ', 'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど', 'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ', 'う': 'ゔ',
  'カ': 'ガ', 'キ': 'ギ', 'ク': 'グ', 'ケ': 'ゲ', 'コ': 'ゴ', 'サ': 'ザ', 'シ': 'ジ', 'ス': 'ズ', 'セ': 'ゼ', 'ソ': 'ゾ', 'タ': 'ダ', 'チ': 'ヂ', 'ツ': 'ヅ', 'テ': 'デ', 'ト': 'ド', 'ハ': 'バ', 'ヒ': 'ビ', 'フ': 'ブ', 'ヘ': 'ベ', 'ホ': 'ボ', 'ウ': 'ヴ',
};
const HANDAKU = { 'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ', 'ハ': 'パ', 'ヒ': 'ピ', 'フ': 'プ', 'ヘ': 'ペ', 'ホ': 'ポ' };
function nameEntry(prompt, initial = '', maxLen = 4) {
  return new Promise(res => {
    const cmds = ['もじ', 'けす', 'おわる'];
    const sc = {
      page: 0, cx: 0, cy: 0, name: [...initial], tick: 0,
      rows() { return KANA_PAGES[this.page].rows; },
      update() {
        this.tick++;
        const R = this.rows().length;
        if (Input.repeat('up')) { this.cy = (this.cy + R) % (R + 1); Sound.sfx('cursor'); }
        if (Input.repeat('down')) { this.cy = (this.cy + 1) % (R + 1); Sound.sfx('cursor'); }
        const W = this.cy === R ? cmds.length : 10;
        if (this.cy === R && this.cx >= W) this.cx = W - 1;
        if (Input.repeat('left')) { this.cx = (this.cx + W - 1) % W; Sound.sfx('cursor'); }
        if (Input.repeat('right')) { this.cx = (this.cx + 1) % W; Sound.sfx('cursor'); }
        if (Input.pressed('b')) { if (this.name.length) { this.name.pop(); Sound.sfx('cancel'); } else Sound.sfx('buzz'); return; }
        if (!Input.pressed('a')) return;
        if (this.cy === R) {
          const c = cmds[this.cx];
          if (c === 'もじ') { this.page = (this.page + 1) % KANA_PAGES.length; Sound.sfx('confirm'); }
          else if (c === 'けす') { if (this.name.length) { this.name.pop(); Sound.sfx('cancel'); } }
          else if (c === 'おわる') {
            if (!this.name.length) { Sound.sfx('buzz'); return; }
            Sound.sfx('confirm'); Scenes.remove(this); res(this.name.join(''));
          }
          return;
        }
        const ch = this.rows()[this.cy][this.cx];
        if (ch === '゛' || ch === '゜') {
          const last = this.name[this.name.length - 1];
          const map = ch === '゛' ? DAKU : HANDAKU;
          if (last && map[last]) { this.name[this.name.length - 1] = map[last]; Sound.sfx('confirm'); } else Sound.sfx('buzz');
          return;
        }
        if (this.name.length >= maxLen) { Sound.sfx('buzz'); return; }
        this.name.push(ch); Sound.sfx('confirm');
      },
      render() {
        fillRect(0, 0, SW, SH, '#000');
        drawWindow(16, 8, 224, 44);
        drawText(prompt, 28, 16, COL.white);
        const slots = maxLen;
        for (let i = 0; i < slots; i++) {
          const x = 92 + i * 18;
          drawText(this.name[i] || '', x, 32, COL.white);
          fillRect(x, 45, 13, 1, i === this.name.length && (this.tick >> 4) % 2 ? COL.white : COL.gray);
        }
        drawWindow(16, 58, 224, 150, COL.white, KANA_PAGES[this.page].name);
        const rows = this.rows();
        rows.forEach((row, y) => {
          [...row].forEach((ch, x) => {
            const px = 34 + x * 20, py = 72 + y * 19;
            drawText(ch, px, py);
            if (this.cy === y && this.cx === x && (this.tick >> 3) % 4 !== 3) drawCursor(px - 8, py + 2);
          });
        });
        cmds.forEach((c, i) => {
          const px = 40 + i * 64, py = 72 + rows.length * 19 + 4;
          drawText(c, px, py, c === 'おわる' ? COL.yellow : COL.white);
          if (this.cy === rows.length && this.cx === i && (this.tick >> 3) % 4 !== 3) drawCursor(px - 8, py + 2);
        });
        drawText('A:けってい  B:1もじ けす', 40, 216, COL.gray);
      },
    };
    Scenes.push(sc);
  });
}

/* ---------- description line window ---------- */
function drawHelp(text, y = 202) {
  drawWindow(8, y, 240, 32);
  drawText(text, 20, y + 10, COL.white);
}
