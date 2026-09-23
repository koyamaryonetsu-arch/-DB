'use strict';
/* =====================================================================
 * main.js — title screen, boot, DOM controls, hot-reload snapshot
 * ===================================================================== */

const GAME_TITLE = 'ブレイヴ・レガシー';

const SWORD_ART = [
  '.......kk.......',
  '......kwwk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '......kwsk......',
  '..kkkkkwskkkkk..',
  '.kggggggGGGGGgk.',
  '..kkkkkbbkkkkk..',
  '......kbbk......',
  '......kbbk......',
  '......kggk......',
  '.......kk.......',
];
function makeSword() {
  const pal = { k: '#181018', w: '#f8f8ff', s: '#98a8c8', g: '#f8d038', G: '#c08818', b: '#784820' };
  const c = makeCanvas(16, SWORD_ART.length), g = c.getContext('2d');
  SWORD_ART.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  return c;
}

class TitleScene {
  constructor() {
    this.opaque = true; this.t = 0; this.stage = 'press'; this.menu = null;
    this.sword = makeSword();
    this.stars = Array.from({ length: 70 }, () => [rnd(SW), rnd(140), Math.random()]);
    this.hasSave = false;
    this.checkSaves();
  }
  async checkSaves() {
    if (CloudStore.initPromise) await Promise.race([CloudStore.initPromise, wait(90)]);
    for (let s = 1; s <= 3; s++) if (await Game.readSlot(s)) { this.hasSave = true; break; }
  }
  update() {
    this.t++;
    if (this.stage === 'press' && (Input.pressed('a') || Input.pressed('b')) && this.t > 10) {
      Sound.unlock();
      Sound.playBGM('title');
      Sound.sfx('confirm');
      this.stage = 'menu';
      this.openMenu();
    }
  }
  async openMenu() {
    for (;;) {
      await this.checkSaves();
      const items = [{ label: 'はじめから' }, { label: 'つづきから', disabled: !this.hasSave }];
      const m = new Menu({ items, x: 84, y: 150, w: 92, cancel: false, index: this.hasSave ? 1 : 0 });
      const r = await m.choose();
      m.close();
      if (r === 0) {
        await fadeOut(30);
        Sound.stopBGM(400);
        Scenes.remove(this);
        await Events.newGame();
        return;
      }
      if (r === 1) {
        const slot = await chooseSaveSlot('どの ぼうけんのしょで つづけますか？', true);
        if (!slot) continue;
        const data = await Game.readSlot(slot);
        if (!data) continue;
        await fadeOut(30);
        Scenes.remove(this);
        resumeGame(data);
        await fadeIn(30);
        return;
      }
    }
  }
  render() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#04061a'); g.addColorStop(0.55, '#16204a'); g.addColorStop(1, '#3a2a4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const [x, y, s] of this.stars) { const tw = (Math.sin(this.t / 30 + s * 20) + 1) / 2; fillRect(x, y, 1, 1, tw > 0.55 ? '#ffffff' : '#5a6aa0'); }
    // island silhouette & castle
    ctx.fillStyle = '#0b0f24';
    ctx.beginPath(); ctx.moveTo(0, 196);
    for (let x = 0; x <= SW; x += 8) ctx.lineTo(x, 188 - Math.sin(x / 40) * 8 - Math.sin(x / 13) * 2);
    ctx.lineTo(SW, SH); ctx.lineTo(0, SH); ctx.fill();
    ctx.fillStyle = '#0b0f24';
    const cx = 176;
    ctx.fillRect(cx, 160, 40, 28); ctx.fillRect(cx - 6, 150, 10, 38); ctx.fillRect(cx + 36, 150, 10, 38); ctx.fillRect(cx + 14, 142, 12, 46);
    ctx.beginPath(); ctx.moveTo(cx - 8, 150); ctx.lineTo(cx - 1, 138); ctx.lineTo(cx + 6, 150); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 34, 150); ctx.lineTo(cx + 41, 138); ctx.lineTo(cx + 48, 150); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 12, 142); ctx.lineTo(cx + 20, 126); ctx.lineTo(cx + 28, 142); ctx.fill();
    fillRect(cx + 18, 166, 3, 4, '#f8c860'); fillRect(cx + 4, 170, 2, 3, '#f8c860'); fillRect(cx + 40, 158, 2, 3, '#f8c860');
    // sea shimmer
    for (let i = 0; i < 18; i++) { const x = (i * 37 + this.t * 0.3) % SW; fillRect(Math.floor(x), 206 + (i % 4) * 7, 6, 1, '#2a3a7a'); }
    // sword emblem
    const sy = 20 + Math.sin(this.t / 50) * 2;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(this.sword, SW / 2 - 16, sy, 32, SWORD_ART.length * 2);
    ctx.globalAlpha = 1;
    // title text
    const ty = 58;
    setFont(26);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#181018';
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) ctx.fillText(GAME_TITLE, SW / 2 + dx, ty + dy);
    const tg = ctx.createLinearGradient(0, ty, 0, ty + 28);
    tg.addColorStop(0, '#fff6c0'); tg.addColorStop(0.5, '#f8d038'); tg.addColorStop(1, '#c07818');
    ctx.fillStyle = tg; ctx.fillText(GAME_TITLE, SW / 2, ty);
    drawText('〜 第一章  はじまりの島 〜', SW / 2, ty + 36, '#d8e0ff', 12, 'center');
    if (this.stage === 'press' && (this.t >> 5) % 2 === 0) drawText('A（Z / Enter）または タップで スタート', SW / 2, 160, COL.white, 11, 'center');
    drawText('Ver.0.1  第一章 たいけんばん', SW / 2, SH - 14, '#6070a0', 8, 'center');
  }
}

function resumeGame(data) {
  Game.load(data);
  Field = new FieldScene();
  Scenes.clear();
  Scenes.push(Field);
  const s = Game.s;
  Field.load(s.map, s.x, s.y, s.dir);
}

/* ---------- DOM controls (mute / help) ---------- */
const UIControls = {
  init() {
    const mute = document.getElementById('btn-mute');
    if (mute) {
      mute.addEventListener('click', () => {
        Sound.unlock();
        Game.settings.muted = !Game.settings.muted;
        Sound.setMuted(Game.settings.muted);
        Game.saveSettings();
        this.syncMute();
      });
    }
    this.syncMute();
    const help = document.getElementById('btn-help'), panel = document.getElementById('help');
    if (help && panel) {
      help.addEventListener('click', () => { panel.hidden = !panel.hidden; help.setAttribute('aria-expanded', String(!panel.hidden)); });
    }
    const pad = document.getElementById('btn-pad'), controls = document.getElementById('controls');
    if (pad && controls) {
      let forced = null;
      try { forced = window.localStorage.getItem('bl_pad'); } catch (_) { /* ignore */ }
      const apply = () => {
        const show = forced === '1' || (forced !== '0' && window.matchMedia('(pointer: coarse)').matches);
        controls.hidden = !show;
        document.getElementById('app').classList.toggle('pad', show);
        pad.setAttribute('aria-pressed', String(show));
        requestAnimationFrame(() => Screen.fit());
      };
      apply();
      pad.addEventListener('click', () => {
        forced = controls.hidden ? '1' : '0';
        try { window.localStorage.setItem('bl_pad', forced); } catch (_) { /* ignore */ }
        apply();
      });
    }
    // focus canvas so keys work inside frames
    const cv = document.getElementById('screen');
    cv.addEventListener('pointerdown', () => {
      cv.focus({ preventScroll: true });
      Sound.unlock();
      const top = Scenes.top();
      if (top instanceof TitleScene && top.stage === 'press') { Input.press('a'); setTimeout(() => Input.release('a'), 60); }
    });
  },
  syncMute() {
    const mute = document.getElementById('btn-mute');
    if (!mute) return;
    mute.setAttribute('aria-pressed', String(!Game.settings.muted));
    mute.querySelector('.lbl').textContent = Game.settings.muted ? 'おと OFF' : 'おと ON';
    mute.classList.toggle('off', !!Game.settings.muted);
  },
};

/* ---------- boot ---------- */
function boot(hotData) {
  Screen.init();
  TouchPad.init();
  Game.loadSettings();
  Sound.setVolume(Game.settings.volume);
  Sound.setMuted(!!Game.settings.muted);
  UIControls.init();
  Input.onPress(() => Sound.unlock());
  CloudStore.initPromise = CloudStore.init();
  Engine.onTick = () => { if (Game.s && Field && Scenes.has(Field)) Game.s.playTime += 1 / 60; };
  Engine.start();
  if (hotData && hotData.save) {
    try { resumeGame(hotData.save); return; } catch (e) { console.error(e); }
  }
  Scenes.push(new TitleScene());
  if (document.fonts && document.fonts.load) document.fonts.load('12px "DotGothic16"').catch(() => {});
}

(function start() {
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') {
    try { hot.snapshot(() => ({ save: Game.s && Field && Scenes.has(Field) ? Game.snapshot() : null })); } catch (_) { /* ignore */ }
  }
  if (hot && typeof hot.ready === 'function') hot.ready(d => boot(d || {}));
  else boot((hot && hot.data) || {});
})();
