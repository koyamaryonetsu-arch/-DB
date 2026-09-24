// キーボード・タッチ・ゲームパッドを まとめて あつかう
// ・フィールドでは input.dir（いどう）と A/B を つかう
// ・メニューでは スタックの いちばん うえの ハンドラーに up/down/left/right/a/b を とどける

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', NumpadEnter: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b',
  KeyM: 'map', KeyC: 'chat', Tab: 'menu',
};

export class Input {
  constructor() {
    this.held = new Set();
    this.stack = [];
    this.fieldHandler = null;
    this.stick = { x: 0, y: 0, active: false };
    this.pad = { prev: {}, dir: { x: 0, y: 0 }, repeat: {} };
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.bindKeys();
    this.bindTouch();
    if (this.touch) document.body.classList.add('touch');
  }

  // メニューなどが じぶんの ハンドラーを のせる
  push(h) { this.stack.push(h); return h; }
  pop(h) {
    const i = this.stack.lastIndexOf(h);
    if (i >= 0) this.stack.splice(i, 1);
  }
  get busy() { return this.stack.length > 0; }

  emit(action, repeat = false) {
    const top = this.stack[this.stack.length - 1];
    if (top) {
      top.onNav?.(action, repeat);
      return;
    }
    if (!repeat) this.fieldHandler?.(action);
  }

  get dir() {
    let x = 0, y = 0;
    if (this.held.has('left')) x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up')) y -= 1;
    if (this.held.has('down')) y += 1;
    if (this.stick.active) {
      x += this.stick.x;
      y += this.stick.y;
    }
    x += this.pad.dir.x;
    y += this.pad.dir.y;
    const m = Math.hypot(x, y);
    if (m < 0.2) return { x: 0, y: 0 };
    if (m > 1) return { x: x / m, y: y / m };
    return { x, y };
  }

  bindKeys() {
    addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.code === 'Escape') { document.activeElement.blur(); this.emit('b'); }
        return;
      }
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      const dirKey = ['up', 'down', 'left', 'right'].includes(a);
      if (dirKey) this.held.add(a);
      if (e.repeat && !dirKey) return;
      this.emit(a, e.repeat);
    });
    addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) this.held.delete(a);
    });
    addEventListener('blur', () => this.held.clear());
  }

  bindTouch() {
    const stickEl = document.getElementById('stick');
    const knob = document.getElementById('stick-knob');
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    let stickId = null;
    let origin = null;
    const R = 50;
    const field = document.getElementById('field');
    const startStick = (t) => {
      stickId = t.identifier;
      const r = stickEl.getBoundingClientRect();
      origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      // ひだりはんぶんを さわったら そこに スティックを うごかす
      if (t.clientX < innerWidth * 0.5 && Math.hypot(t.clientX - origin.x, t.clientY - origin.y) > 80) {
        origin = { x: t.clientX, y: t.clientY };
        stickEl.style.left = `${t.clientX - r.width / 2}px`;
        stickEl.style.top = `${t.clientY - r.height / 2}px`;
        stickEl.style.bottom = 'auto';
      }
      moveStick(t);
    };
    const moveStick = (t) => {
      let dx = t.clientX - origin.x, dy = t.clientY - origin.y;
      const m = Math.hypot(dx, dy);
      if (m > R) {
        dx = dx / m * R;
        dy = dy / m * R;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.stick = { x: dx / R, y: dy / R, active: true };
      // メニューでは スティックを たおすと カーソルが うごく
      if (this.busy) {
        const now = performance.now();
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        if (m > R * 0.6 && (this.stickNav !== dir || now - this.stickNavAt > 260)) {
          this.emit(dir, this.stickNav === dir);
          this.stickNav = dir;
          this.stickNavAt = now;
        } else if (m < R * 0.3) this.stickNav = null;
      }
    };
    const endStick = () => {
      stickId = null;
      knob.style.transform = '';
      this.stick = { x: 0, y: 0, active: false };
      this.stickNav = null;
      stickEl.style.left = '';
      stickEl.style.top = '';
      stickEl.style.bottom = '';
    };
    field.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (stickId === null && t.clientX < innerWidth * 0.55) startStick(t);
      }
      e.preventDefault();
    }, { passive: false });
    stickEl.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) if (stickId === null) startStick(t);
      e.preventDefault();
    }, { passive: false });
    addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) if (t.identifier === stickId) moveStick(t);
    }, { passive: true });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === stickId) endStick();
    };
    addEventListener('touchend', end);
    addEventListener('touchcancel', end);
    const bindBtn = (el, action) => {
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        el.classList.add('on');
        this.emit(action);
      }, { passive: false });
      el.addEventListener('touchend', () => el.classList.remove('on'));
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.emit(action);
      });
    };
    bindBtn(btnA, 'a');
    bindBtn(btnB, 'b');
  }

  // まいフレーム よぶ（ゲームパッド）
  update() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = [...pads].find((p) => p && p.connected);
    if (!gp) {
      this.pad.dir = { x: 0, y: 0 };
      return;
    }
    const b = (i) => !!gp.buttons[i]?.pressed;
    let x = Math.abs(gp.axes[0]) > 0.25 ? gp.axes[0] : 0;
    let y = Math.abs(gp.axes[1]) > 0.25 ? gp.axes[1] : 0;
    if (b(14)) x = -1;
    if (b(15)) x = 1;
    if (b(12)) y = -1;
    if (b(13)) y = 1;
    this.pad.dir = { x, y };
    const now = performance.now();
    const edge = (name, pressed) => {
      const was = this.pad.prev[name];
      this.pad.prev[name] = pressed;
      return pressed && !was;
    };
    if (edge('a', b(0))) this.emit('a');
    if (edge('b', b(1))) this.emit('b');
    if (edge('menu', b(9) || b(3))) this.emit(this.busy ? 'b' : 'b');
    if (edge('map', b(8))) this.emit('map');
    if (this.busy) {
      const dir = Math.abs(x) > Math.abs(y) ? (x > 0.5 ? 'right' : x < -0.5 ? 'left' : null) : (y > 0.5 ? 'down' : y < -0.5 ? 'up' : null);
      if (dir) {
        const r = this.pad.repeat;
        if (r.dir !== dir) {
          r.dir = dir;
          r.at = now + 320;
          this.emit(dir);
        } else if (now > r.at) {
          r.at = now + 110;
          this.emit(dir, true);
        }
      } else this.pad.repeat.dir = null;
    }
  }
}
