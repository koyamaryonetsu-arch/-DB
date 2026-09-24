// がめんの パーツを つくる どうぐ

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) {
    if (k === null || k === undefined || k === false) continue;
    e.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return e;
}

export const $ = (s, r = document) => r.querySelector(s);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ───────────── えらぶ メニュー ─────────────
// items: [{label, right, disabled, value, cls, title}]
export class ListMenu {
  constructor(input, { items = [], cols = 1, onSelect, onCancel, onMove, sound, className = '' } = {}) {
    this.input = input;
    this.items = items;
    this.cols = cols;
    this.onSelect = onSelect;
    this.onCancel = onCancel;
    this.onMove = onMove;
    this.sound = sound;
    this.idx = Math.max(0, items.findIndex((i) => !i.disabled));
    if (this.idx < 0) this.idx = 0;
    this.root = el('ul', { class: `menu ${cols === 2 ? 'cols2' : ''} ${className}`, role: 'listbox' });
    this.handler = { onNav: (a, rep) => this.nav(a, rep) };
    this.active = false;
    this.render();
  }

  setItems(items, keepIdx = true) {
    this.items = items;
    if (!keepIdx || this.idx >= items.length) this.idx = Math.max(0, items.findIndex((i) => !i.disabled));
    this.render();
  }

  render() {
    this.root.innerHTML = '';
    this.items.forEach((it, i) => {
      const li = el('li', {
        class: `item ${i === this.idx ? 'sel' : ''} ${it.disabled ? 'dis' : ''} ${it.cls || ''}`,
        role: 'option',
        title: it.title || null,
        onclick: (e) => {
          e.stopPropagation();
          this.idx = i;
          this.render();
          this.choose();
        },
        onmouseenter: () => {
          if (this.idx !== i) {
            this.idx = i;
            this.updateSel();
            this.onMove?.(this.items[i], i);
          }
        },
      });
      const lab = el('span', { class: 'l' });
      if (it.html) lab.innerHTML = it.html;
      else lab.textContent = it.label;
      li.append(lab);
      if (it.right !== undefined && it.right !== null && it.right !== '') li.append(el('span', { class: `r ${it.rightCls || ''}`, text: it.right }));
      this.root.append(li);
    });
    this.scrollToSel();
  }

  updateSel() {
    [...this.root.children].forEach((li, i) => li.classList.toggle('sel', i === this.idx));
    this.scrollToSel();
  }

  scrollToSel() {
    const li = this.root.children[this.idx];
    if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
  }

  get current() { return this.items[this.idx]; }

  focus() {
    if (!this.active) {
      this.input.push(this.handler);
      this.active = true;
    }
    this.onMove?.(this.current, this.idx);
  }

  blur() {
    if (this.active) {
      this.input.pop(this.handler);
      this.active = false;
    }
  }

  nav(a) {
    const n = this.items.length;
    if (!n && a !== 'b') return;
    const step = (d) => {
      let i = this.idx;
      for (let k = 0; k < n; k++) {
        i = (i + d + n) % n;
        if (!this.items[i].disabled || true) break;
      }
      this.idx = i;
      this.sound?.('cursor');
      this.updateSel();
      this.onMove?.(this.current, this.idx);
    };
    switch (a) {
      case 'up': step(-this.cols); break;
      case 'down': step(this.cols); break;
      case 'left': if (this.cols > 1) step(-1); break;
      case 'right': if (this.cols > 1) step(1); break;
      case 'a': this.choose(); break;
      case 'b':
        if (this.onCancel) {
          this.sound?.('cancel');
          this.onCancel();
        }
        break;
      default:
    }
  }

  choose() {
    const it = this.current;
    if (!it) return;
    if (it.disabled) {
      this.sound?.('buzz');
      return;
    }
    this.sound?.('confirm');
    this.onSelect?.(it, this.idx);
  }
}

// ───────────── おしらせ ─────────────
export function toast(text, ms = 3200) {
  const box = document.getElementById('toast');
  const t = el('div', { class: 'win t', text });
  box.append(t);
  setTimeout(() => t.remove(), ms);
}

// ───────────── かくにん・もじにゅうりょく ─────────────
export function askText(input, { title, placeholder = '', max = 40, initial = '', numeric = false } = {}) {
  return new Promise((resolve) => {
    const ui = document.getElementById('ui');
    const back = el('div', { class: 'modal-back' });
    const field = el('input', { class: 'textin', type: 'text', maxlength: String(max), placeholder, value: initial, inputmode: numeric ? 'numeric' : null, autocomplete: 'off', enterkeyhint: 'done' });
    const done = (v) => {
      input.pop(h);
      back.remove();
      box.remove();
      resolve(v);
    };
    const ok = el('button', { class: 'btn primary', text: 'けってい', onclick: () => done(field.value.trim()) });
    const cancel = el('button', { class: 'btn', text: 'やめる', onclick: () => done(null) });
    const box = el('div', { class: 'win panel center-panel' },
      el('h2', { text: title }),
      field,
      el('div', { class: 'row end', style: { marginTop: '0.6em' } }, cancel, ok));
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) done(field.value.trim());
      if (e.key === 'Escape') done(null);
    });
    const h = { onNav: (a) => { if (a === 'b') done(null); } };
    input.push(h);
    ui.append(back, box);
    setTimeout(() => field.focus(), 30);
  });
}

export function confirmBox(input, text, yes = 'はい', no = 'いいえ', sound) {
  return new Promise((resolve) => {
    const ui = document.getElementById('ui');
    const back = el('div', { class: 'modal-back' });
    const menu = new ListMenu(input, {
      items: [{ label: yes, value: true }, { label: no, value: false }],
      sound,
      onSelect: (it) => finish(it.value),
      onCancel: () => finish(false),
    });
    const box = el('div', { class: 'win panel center-panel', style: { width: 'min(90vw, 520px)' } }, el('div', { style: { whiteSpace: 'pre-line', marginBottom: '0.5em' }, text }), menu.root);
    const finish = (v) => {
      menu.blur();
      back.remove();
      box.remove();
      resolve(v);
    };
    ui.append(back, box);
    menu.focus();
  });
}

// ゲージの バー
export function bar(ratio, cls = '') {
  const r = Math.max(0, Math.min(1, ratio || 0));
  return el('div', { class: `bar ${cls} ${r < 0.26 && !cls.includes('mp') ? 'low' : ''}` }, el('i', { style: { width: `${Math.round(r * 100)}%` } }));
}
