// ゲーム ぜんたいの しんこう
import { Input } from './input.js';
import { GameAudio } from './audio.js';
import { Field } from './field.js';
import { Hud, STAMPS } from './ui/hud.js';
import { FieldMenu, openWorldMap } from './ui/menu.js';
import { ScriptPlayer, wait } from './ui/script.js';
import { BattleScene } from './battle.js';
import { showTitle, showLogin, showSelect, showCreate } from './ui/title.js';
import { toast, confirmBox, el } from './ui/dom.js';
import { MAPS } from '../shared/maps/index.js';

export class Game {
  constructor(net) {
    this.net = net;
    this.input = new Input();
    this.audio = new GameAudio();
    this.field = new Field(this);
    this.hud = new Hud(this);
    this.menu = new FieldMenu(this);
    this.script = new ScriptPlayer(this);
    this.state = 'boot';
    this.me = null;
    this.party = null;
    this.players = [];
    this.busy = false;
    this.menuOpen = false;
    this.follow = false;
    this.posSeq = 0;
    this.invulnUntil = 0;
    this.exploredTimer = 0;
    this.bgmTimer = 0;
    this.titleStars = null;
    this.input.fieldHandler = (a) => this.onFieldAction(a);
    net.on((m) => this.onMessage(m));
    net.onStatus((s) => this.hud.setConnection(s));
    try { if (localStorage.getItem('kizuna_bigtext')) document.body.classList.add('big-text'); } catch { /* */ }
  }

  start() {
    this.state = 'title';
    showTitle(this);
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(50, t - last);
      last = t;
      try {
        this.frame(dt);
      } catch (e) {
        console.error(e);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // テスト・デバッグ用
    window.__game = this;
  }

  afterTitle() {
    if (this.net.mode === 'server') {
      this.state = 'login';
      if (this.welcomed) this.onWelcomeReady();
      else showLogin(this);
    } else {
      this.state = 'select';
      this.net.send({ t: 'hello' });
    }
  }

  // ───────────── まいフレーム ─────────────
  frame(dt) {
    this.input.update();
    const inField = this.state === 'field';
    document.getElementById('touch').hidden = !(inField && this.input.touch && !this.menuOpen);
    if (inField) {
      const canMove = !this.busy && !this.menuOpen && !this.input.busy;
      this.field.update(dt, { dir: this.input.dir, canMove });
      this.field.render();
      this.hud.update(dt);
      this.bgmTimer -= dt;
      if (this.bgmTimer <= 0 && !this.busy) {
        this.bgmTimer = 600;
        this.audio.play(this.field.areaBgm());
      }
      this.exploredTimer -= dt;
      if (this.exploredTimer <= 0 && this.field.exploredDirty) {
        this.exploredTimer = 12000;
        this.field.exploredDirty = false;
        this.net.send({ t: 'explored', map: this.field.mapId, data: this.field.exploredB64() });
      }
    } else if (this.state === 'battle') {
      this.battle?.update(dt);
    } else {
      this.drawTitleBg(dt);
    }
  }

  drawTitleBg(dt) {
    const f = this.field;
    const x = f.ctx;
    const W = f.vw, H = f.vh;
    if (!this.titleStars || this.titleStars.w !== W) {
      this.titleStars = { w: W, list: Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.75, p: Math.random() * 6, s: Math.random() < 0.15 ? 2 : 1 })), t: 0, shoot: null };
    }
    const st = this.titleStars;
    st.t += dt;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05071a');
    g.addColorStop(0.7, '#1a1a52');
    g.addColorStop(1, '#3a2a6a');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (const s of st.list) {
      const tw = (Math.sin(st.t / 500 + s.p) + 1) / 2;
      x.fillStyle = tw > 0.6 ? '#ffffff' : '#9aa8ff';
      x.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
    if (!st.shoot && Math.random() < dt / 2500) st.shoot = { x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.3, a: 0 };
    if (st.shoot) {
      st.shoot.a += dt;
      const k = st.shoot.a / 700;
      x.fillStyle = '#fff6d8';
      for (let i = 0; i < 12; i++) x.fillRect(Math.round(st.shoot.x - (k * 120) + i * 2), Math.round(st.shoot.y + (k * 60) - i), 1, 1);
      if (k > 1) st.shoot = null;
    }
    // やまと むらの かげ
    x.fillStyle = '#0c0a24';
    for (let px = 0; px < W; px++) {
      const h = 20 + Math.abs(Math.sin(px * 0.02) * 26) + Math.abs(Math.sin(px * 0.07) * 8);
      x.fillRect(px, H - h, 1, h);
    }
    x.fillStyle = '#ffd66b';
    for (let i = 0; i < 6; i++) x.fillRect(Math.round(W * (0.15 + i * 0.13)), H - 14 - (i % 2) * 4, 2, 2);
  }

  // ───────────── ボタン ─────────────
  onFieldAction(a) {
    if (this.state !== 'field' || this.busy || this.menuOpen) return;
    if (a === 'a') this.field.interact();
    else if (a === 'b' || a === 'menu') this.openMenu();
    else if (a === 'map') openWorldMap(this);
    else if (a === 'chat') this.hud.chatInput();
  }

  openMenu(section) {
    if (this.state !== 'field' || this.busy || this.menuOpen) return;
    this.audio.sfx('confirm');
    this.menu.open();
    if (section) {
      const idx = ['items', 'skills', 'equip', 'status', 'party', 'tactics', 'map', 'quest', 'settings', 'quit'].indexOf(section);
      if (idx >= 0) {
        this.menu.menu.idx = idx;
        this.menu.menu.updateSel();
        this.menu.preview(section);
      }
    }
  }

  // ───────────── えんしゅつ ─────────────
  fade(out) {
    const c = document.getElementById('curtain');
    c.classList.remove('flash');
    c.classList.toggle('on', out);
    return wait(480);
  }

  async flash() {
    const c = document.getElementById('curtain');
    const was = c.classList.contains('on');
    c.classList.add('flash', 'on');
    await wait(140);
    c.classList.remove('on');
    await wait(140);
    c.classList.remove('flash');
    if (was) c.classList.add('on');
  }

  applyPos(map, x, y, dir, seq) {
    if (seq !== undefined) this.posSeq = seq;
    const changed = this.field.mapId !== map;
    this.field.setMap(map, x, y, dir);
    this.field.lastSent = { x, y, moving: false };
    if (changed) {
      this.audio.sfx('stairs');
      this.hud.lastArea = null;
    }
  }

  setObjective(text) {
    if (this.me) this.me.objective = text;
    this.hud.setObjective(text);
  }

  async quitToTitle() {
    this.net.send({ t: 'quit' });
    this.leaveField();
    this.state = 'select';
  }

  leaveField() {
    this.field.clearLabels();
    this.hud.show(false);
    document.getElementById('ui').innerHTML = '';
    this.me = null;
  }

  waitBattleClosed() {
    if (this.state !== 'battle' && !this.battleClosing) return Promise.resolve();
    return new Promise((r) => { this.battleWaiters = (this.battleWaiters || []).concat(r); });
  }

  // ───────────── メッセージ ─────────────
  async onMessage(m) {
    switch (m.t) {
      case '_open':
        if (this.pwSent || this.me) {
          let pw = '';
          try { pw = localStorage.getItem('kizuna_pw') || ''; } catch { /* */ }
          this.net.send({ t: 'hello', pw });
        }
        break;
      case '_close':
        break;
      case 'welcome':
        this.welcomed = true;
        this.chars = m.chars;
        this.timeOffset = (m.serverTime || Date.now()) - Date.now();
        this.pwSent = true;
        if (this.me && this.lastCharId) {
          this.net.send({ t: 'play', id: this.lastCharId });
          return;
        }
        if (this.state === 'login' || this.state === 'select') this.onWelcomeReady();
        break;
      case 'helloFail':
        try { localStorage.removeItem('kizuna_pw'); } catch { /* */ }
        if (this.state !== 'title') showLogin(this, m.reason);
        break;
      case 'chars':
        this.chars = m.chars;
        if (this.state === 'select' && !this.pendingPlay && !document.querySelector('.create')) showSelect(this, m.chars);
        break;
      case 'charCreated':
        if (this.pendingPlay) {
          this.pendingPlay = false;
          this.net.send({ t: 'play', id: m.id });
        }
        break;
      case 'enter': return this.onEnter(m);
      case 'self': {
        const prevJob = this.me?.job;
        this.me = m.char;
        this.hud.renderParty();
        this.menu.refresh();
        if (prevJob && prevJob !== m.char.job) this.hud.renderParty();
        break;
      }
      case 'party':
        this.party = m.party;
        this.hud.renderParty();
        this.menu.refresh();
        break;
      case 'players':
        this.players = m.players;
        break;
      case 'setPos':
        this.applyPos(m.map, m.x, m.y, m.dir, m.seq);
        break;
      case 'snap':
        this.field.onSnap(m);
        break;
      case 'script':
        this.scriptEnded = false;
        await this.waitBattleClosed();
        this.script.enqueue(m);
        break;
      case 'scriptEnd':
        await this.waitBattleClosed();
        this.scriptEnded = true;
        if (!this.script.running) this.endScript();
        break;
      case 'svcRes':
        if (this.svcWaiter) {
          const w = this.svcWaiter;
          this.svcWaiter = null;
          w(m);
        }
        break;
      case 'menuRes':
        if (m.text) toast(m.text);
        this.audio.sfx(m.ok ? 'confirm' : 'buzz');
        break;
      case 'battleStart': return this.onBattleStart(m);
      case 'battleEv':
        this.battle?.onEvents(m.evs);
        break;
      case 'battleRej':
        toast(m.reason);
        this.audio.sfx('buzz');
        if (this.battle?.myActor?.ready) this.battle.openCommand();
        break;
      case 'battleEnd': return this.onBattleEnd(m);
      case 'invite': {
        // たたかいや かいわの あいだは おわるまで まつ
        for (let i = 0; i < 600 && (this.state !== 'field' || this.busy || this.menuOpen); i++) await wait(200);
        if (this.state !== 'field') break;
        this.audio.sfx('join');
        const ok = await confirmBox(this.input, `${m.from}から パーティーの おさそいが きた！\nいっしょに ぼうけんする？`, 'はいる！', 'いまは いい', (x) => this.audio.sfx(x));
        this.net.send({ t: 'party', action: ok ? 'accept' : 'decline' });
        break;
      }
      case 'toast':
        toast(m.text);
        break;
      case 'chat':
        this.hud.addChat(m.from, m.text, m.stamp);
        if (this.state === 'field') this.field.bubble(m.sid === this.sid ? this.sid : m.sid, m.stamp || m.text);
        this.audio.sfx('stamp');
        break;
      case 'joined':
        toast(`${m.name}が ぼうけんに やってきた！`);
        break;
      case 'left':
        toast(`${m.name}が ひとやすみ している`);
        break;
      case 'kicked':
        toast(m.text, 6000);
        this.leaveField();
        this.state = 'select';
        this.net.send({ t: 'hello', pw: (() => { try { return localStorage.getItem('kizuna_pw') || ''; } catch { return ''; } })() });
        break;
      case 'error':
        toast(m.text);
        this.audio.sfx('buzz');
        if (this.state === 'select' && this.pendingPlay) {
          this.pendingPlay = false;
          showCreate(this);
        }
        break;
      default:
    }
  }

  endScript() {
    this.busy = false;
    this.scriptBgm = null;
    this.field.nightOverride = null;
    this.field.hideGuests = false;
  }

  onWelcomeReady() {
    this.state = 'select';
    showSelect(this, this.chars || []);
  }

  onEnter(m) {
    document.getElementById('ui').innerHTML = '';
    this.me = m.char;
    this.sid = m.sid;
    this.lastCharId = m.char.id;
    this.party = m.party;
    this.players = m.players || [];
    this.posSeq = 0;
    this.busy = false;
    this.state = 'field';
    this.field.setMap(m.map, m.x, m.y, m.dir);
    this.hud.show(true);
    this.hud.renderParty();
    this.hud.setObjective(m.char.objective);
    this.audio.play(this.field.areaBgm());
    for (const log of m.supportLog || []) {
      toast(`${log.helper}の ぼうけんを ${log.count}かい てつだって\nけいけんち ${log.exp}と ${log.gold}ゴールドを もらった！${log.level ? `\nレベルが ${log.level}に あがった！` : ''}`, 6000);
    }
    if (this.net.mode === 'offline' && !this.saveWarned) {
      this.saveWarned = true;
      import('./offline.js').then(({ offlineStorage }) => {
        offlineStorage.load();
        if (!offlineStorage.ok) toast('このブラウザでは セーブが できないかもしれません', 5000);
      });
    }
  }

  async onBattleStart(m) {
    this.menu.close();
    this.closeFieldUI();
    this.audio.sfx('encounter');
    this.state = 'battle-intro';
    await this.flash();
    this.hud.show(false);
    this.field.clearLabels();
    this.state = 'battle';
    this.battle = new BattleScene(this, m);
  }

  closeFieldUI() {
    for (const p of document.querySelectorAll('#ui .panel, #ui .modal-back')) {
      if (!p.classList.contains('dialog')) p.remove();
    }
    this.input.stack.length = 0;
  }

  async onBattleEnd(m) {
    const b = this.battle;
    if (!b) return;
    this.battleClosing = true;
    // のこりの えんしゅつを まつ
    for (let i = 0; i < 100 && (b.queue.length || b.showing); i++) await wait(100);
    await wait(300);
    await b.showResult(m);
    await this.fade(true);
    b.destroy();
    this.battle = null;
    this.state = 'field';
    this.hud.show(true);
    this.invulnUntil = performance.now() + 2500;
    this.audio.play(this.scriptBgm && this.scriptBgm !== 'resume' ? this.scriptBgm : this.field.areaBgm(), { force: true });
    await this.fade(false);
    this.battleClosing = false;
    const ws = this.battleWaiters || [];
    this.battleWaiters = [];
    for (const w of ws) w();
  }
}
