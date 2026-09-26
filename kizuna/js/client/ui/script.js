// だいほんの さいせい（メッセージ・えらぶ・えんしゅつ）
import { el } from './dom.js?v=cb6fd0fb30e1';
import { ListMenu } from './dom.js?v=cb6fd0fb30e1';
import { openServiceUI } from './services.js?v=cb6fd0fb30e1';
import { monsterCanvas } from '../render/monsters.js?v=cb6fd0fb30e1';

const TYPE_MS = 28;

export class ScriptPlayer {
  constructor(game) {
    this.game = game;
    this.queue = [];
    this.running = false;
    this.gen = 0;
  }

  enqueue(msg) {
    this.queue.push(msg);
    if (!this.running) this.run();
  }

  async run() {
    const gen = this.gen;
    this.running = true;
    this.game.busy = true;
    while (this.queue.length) {
      const msg = this.queue.shift();
      let choice;
      for (const step of msg.steps) {
        const r = await this.step(step, msg);
        if (gen !== this.gen) return; // とちゅうで リセットされた
        if (step[0] === 'choice') choice = r;
      }
      if (!msg.spectator) this.game.net.send({ t: 'ack', runId: msg.runId, choice });
    }
    this.running = false;
    this.closeDialog();
    if (this.game.scriptEnded) this.game.endScript();
  }

  // つなぎなおした ときなど: いま とちゅうの だいほんを すてる
  reset() {
    this.gen += 1;
    this.queue = [];
    this.running = false;
    this.advance = null;
    this.closeDialog();
  }

  fill(text, msg) {
    return String(text).replaceAll('{name}', msg.who || this.game.me?.name || '');
  }

  async step(st, msg) {
    const g = this.game;
    const [op, ...a] = st;
    switch (op) {
      case 'say': return this.say(a[0] ? this.fill(a[0], msg) : null, this.fill(a[1], msg), msg.spectator);
      case 'choice': return this.choice(this.fill(a[0], msg), a[1], msg.spectator, msg.who);
      case 'fade': return g.fade(a[0] === 'out');
      case 'flash': return g.flash();
      case 'shake':
        g.field.shakeT = 700;
        g.audio.sfx('rumble');
        return wait(500);
      case 'night':
        g.field.nightOverride = a[0] ? true : null;
        return null;
      case 'bgm':
        if (a[0] === null) g.audio.stop(0.4);
        else if (a[0] === 'resume') g.audio.play(g.field.areaBgm());
        else g.audio.play(a[0]);
        g.scriptBgm = a[0];
        return null;
      case 'sfx':
        g.audio.sfx(a[0]);
        return null;
      case 'wait': return wait(a[0]);
      case 'actor':
        g.field.spawnActor(a[0], a[1]);
        return null;
      case 'move':
        return g.field.moveActor(a[0], a[1]);
      case 'face':
        g.field.faceActor(a[0], a[1]);
        return null;
      case 'remove':
        g.field.removeActor(a[0]);
        return null;
      case 'chapter': return this.chapter(a[0], a[1]);
      case 'teleport': {
        const mine = (a[4] || []).find((e) => e[0] === g.sid);
        if (mine) g.applyPos(a[0], mine[1], mine[2], a[3], mine[3]);
        return null;
      }
      case 'objective':
        // 見ている なかまは 自分の 目標は そのまま（リーダーの 目標として 出す）
        if (msg.spectator) {
          if (g.party) g.party.objective = a[0];
          g.refreshObjective();
        } else g.setObjective(a[0]);
        return null;
      case 'guestHide':
        g.field.hideGuests = !!a[0];
        return null;
      case 'hideNpc':
        g.field.scriptHidden.add(a[0]);
        return null;
      case 'chestOpen':
        return null;
      case 'showMon':
        this.showMon(a[0]);
        return null;
      case 'crest':
        return this.crest();
      case 'ui':
        if (msg.spectator) return null;
        this.closeDialog();
        return openServiceUI(g, a[0], a[1]);
      default:
        return null;
    }
  }

  // ───── メッセージ ─────
  ensureDialog() {
    if (!this.dlg) {
      this.dlg = el('div', { class: 'win dialog', role: 'dialog', 'aria-live': 'polite' });
      this.dlgSpeaker = el('div', { class: 'speaker' });
      this.dlgText = el('div', { class: 'text' });
      this.dlgMore = el('div', { class: 'more', text: '▼' });
      this.dlg.append(this.dlgSpeaker, this.dlgText, this.dlgMore);
      this.dlg.addEventListener('click', () => this.advance?.());
      // がめんの どこを タップしても すすむ（スマホで ゆびが とどきやすいように）
      this.catcher = el('div', { class: 'talk-catcher', onclick: () => this.advance?.() });
      document.getElementById('ui').append(this.catcher, this.dlg);
      document.body.classList.add('talking');
    }
    return this.dlg;
  }

  // なかまに なりたそうな モンスター
  showMon(sp) {
    this.monBox?.remove();
    this.monBox = null;
    if (!sp) return;
    const src = monsterCanvas(sp, 0);
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    const k = Math.max(2, Math.min(5, Math.floor(160 / Math.max(src.width, src.height))));
    c.style.width = `${src.width * k}px`;
    c.style.height = `${src.height * k}px`;
    this.monBox = el('div', { class: 'win mon-pop' }, c);
    document.getElementById('ui').append(this.monBox);
  }

  // 紋章が ひかる
  crest() {
    const fx = document.getElementById('fx');
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    const star = (r1, r2, col) => {
      x.fillStyle = col;
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? r2 : r1;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
      }
      x.closePath();
      x.fill();
    };
    x.strokeStyle = '#ffd66b';
    x.lineWidth = 3;
    x.beginPath(); x.arc(32, 32, 27, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#fff6d0';
    x.lineWidth = 1;
    x.beginPath(); x.arc(32, 32, 23, 0, Math.PI * 2); x.stroke();
    star(20, 8, '#ffd66b');
    star(12, 5, '#ffffff');
    const box = el('div', { class: 'crest-fx' }, cv);
    fx.append(box);
    return new Promise((resolve) => setTimeout(() => { box.remove(); resolve(); }, 1800));
  }

  closeDialog() {
    this.monBox?.remove();
    this.monBox = null;
    this.dlg?.remove();
    this.catcher?.remove();
    this.dlg = null;
    this.catcher = null;
    document.body.classList.remove('talking');
  }

  say(speaker, text, spectator) {
    const g = this.game;
    const d = this.ensureDialog();
    d.classList.toggle('spectator', !!spectator);
    this.dlgSpeaker.hidden = !speaker;
    this.dlgSpeaker.textContent = speaker || '';
    this.dlgText.textContent = '';
    this.dlgMore.hidden = true;
    return new Promise((resolve) => {
      let i = 0;
      let done = false;
      const chars = [...text];
      let timer = null;
      const finishType = () => {
        clearInterval(timer);
        this.dlgText.textContent = text;
        done = true;
        this.dlgMore.hidden = false;
        if (spectator) autoTimer = setTimeout(close, 1200 + chars.length * 45);
      };
      const close = () => {
        clearTimeout(autoTimer);
        g.input.pop(h);
        this.advance = null;
        resolve();
      };
      let autoTimer = null;
      this.advance = () => {
        if (!done) finishType();
        else {
          g.audio.sfx('cursor');
          close();
        }
      };
      const h = { onNav: (act) => { if (act === 'a' || act === 'b') this.advance(); } };
      g.input.push(h);
      timer = setInterval(() => {
        i += 1;
        this.dlgText.textContent = chars.slice(0, i).join('');
        if (i % 3 === 0 && chars[i - 1] !== ' ') g.audio.sfx('talk');
        if (i >= chars.length) finishType();
      }, TYPE_MS);
    });
  }

  choice(question, options, spectator, who) {
    const g = this.game;
    if (spectator) {
      return this.say(null, `（${who}が選んでいます…）\n${question}`, true).then(() => 0);
    }
    return new Promise((resolve) => {
      const box = el('div', { class: 'win choice' });
      if (question) box.append(el('div', { class: 'q', text: question }));
      const menu = new ListMenu(g.input, {
        items: options.map((o, i) => ({ label: o, value: i })),
        sound: (s) => g.audio.sfx(s),
        back: null,
        onSelect: (it) => finish(it.value),
        onCancel: () => finish(options.length - 1),
      });
      box.append(menu.root);
      document.getElementById('ui').append(box);
      menu.focus();
      const finish = (v) => {
        menu.blur();
        box.remove();
        resolve(v);
      };
    });
  }

  chapter(title, sub) {
    const g = this.game;
    this.closeDialog();
    g.audio.play('chapter');
    const fx = document.getElementById('fx');
    const card = el('div', { class: 'chapter' }, el('div', { class: 'c1', text: title }), el('div', { class: 'c2', text: sub }));
    fx.append(card);
    return new Promise((resolve) => setTimeout(() => { card.remove(); resolve(); }, 4200));
  }
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
