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
// items: [{label, right, disabled, value, cls, title, header}]  header: えらべない みだし
// back: タッチでも もどれるように リストの うえに だす ボタンの もじ（null で なし）
export class ListMenu {
  // press: えらんだ ボタンを この ミリ秒 光らせてから すすむ（どれを おしたか わかるように）
  // start: はじめに カーソルを おく ばんごう（まえに えらんだ ところ など）
  // onSide: 1れつの リストで 左右を おした とき（タブを かえる・せつめいを スクロール など）。-1 か 1
  // fit: なまえは 1行で。入りきらない ときは 文字を 小さく して ぜんぶ 見せる（せまい ボタンの たたかいの コマンド）
  constructor(input, { items = [], cols = 1, onSelect, onCancel, onMove, onSide, sound, className = '', back, press = 0, start = -1, fit = false } = {}) {
    this.input = input;
    this.fitText = fit;
    this.onSide = onSide || null;
    this.press = press;
    this.pressing = false;
    this.items = items;
    this.cols = cols;
    this.onSelect = onSelect;
    this.onCancel = onCancel;
    this.onMove = onMove;
    this.sound = sound;
    this.back = back === undefined ? (onCancel ? 'もどる' : null) : back;
    this.idx = Math.max(0, items.findIndex((i) => !i.disabled && !i.header));
    if (this.idx < 0) this.idx = 0;
    if (start >= 0 && start < items.length && !items[start].header) this.idx = start;
    this.root = el('ul', { class: `menu ${cols === 2 ? 'cols2' : ''} ${fit ? 'fit' : ''} ${className}`, role: 'listbox' });
    // pad: スマホでは 十字キーの パッドも 出す
    this.handler = { onNav: (a, rep) => this.nav(a, rep), pad: true, el: this.root, onGone: () => { this.active = false; } };
    this.active = false;
    this.render();
  }

  setItems(items, keepIdx = true) {
    this.items = items;
    if (!keepIdx || this.idx >= items.length || items[this.idx]?.header) this.idx = Math.max(0, items.findIndex((i) => !i.disabled && !i.header));
    this.render();
  }

  render() {
    this.root.innerHTML = '';
    this.items.forEach((it, i) => {
      if (it.header) {
        this.root.append(el('li', { class: `hdr ${it.cls || ''}`, role: 'presentation', text: it.label }));
        return;
      }
      const li = el('li', {
        class: `item ${i === this.idx ? 'sel' : ''} ${it.disabled ? 'dis' : ''} ${it.cls || ''}`,
        role: 'option',
        title: it.title || null,
        onclick: (e) => {
          e.stopPropagation();
          const moved = this.idx !== i;
          this.idx = i;
          this.render();
          // タッチでは ホバーが ないので、タップで せつめいも かえる
          if (moved) this.onMove?.(this.items[i], i);
          this.choose();
        },
        // マウスを 本当に うごかした ときだけ カーソルを あわせる
        // （まどが マウスの 下に 出てきた だけで「いいえ」などに かわらないように）
        onmousemove: (e) => {
          if (!e.movementX && !e.movementY) return;
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
      if (it.face) {
        lab.classList.add('wf');
        lab.prepend(el('img', { class: 'face', src: it.face, alt: '' }));
      }
      li.append(lab);
      if (it.right !== undefined && it.right !== null && it.right !== '') li.append(el('span', { class: `r ${it.rightCls || ''}`, text: it.right }));
      this.root.append(li);
    });
    // さいごに つけるが、みためは いちばん うえ（CSS の order）。ばんごうが ずれないように
    if (this.back && this.onCancel) {
      this.root.append(el('li', {
        class: 'backchip',
        role: 'button',
        'aria-label': this.back,
        text: this.back === '閉じる' ? '✕ 閉じる' : `← ${this.back}`,
        onclick: (e) => {
          e.stopPropagation();
          this.cancel();
        },
      }));
    }
    this.scrollToSel();
    // 画面に 出てから はかる（まだ ならんで いない ときは 0 なので つぎの コマで）。
    // 文字（ウェブフォント）の よみこみが おわったら もう一度（はばが かわる）
    if (this.fitText) {
      requestAnimationFrame(() => this.fit());
      document.fonts?.ready?.then(() => this.fit());
    }
  }

  // 入りきらない なまえの 文字を 小さく（いちばん 小さくて 0.6 ばい）。
  // scrollWidth は 1ピクセル みまんの はみ出しを 見のがすので、中みの はばを 小数まで はかる
  fit() {
    const range = document.createRange();
    for (const lab of this.root.querySelectorAll('.item > .l')) {
      lab.style.fontSize = '';
      const box = lab.clientWidth;
      if (!box) continue;
      const need = () => { range.selectNodeContents(lab); return range.getBoundingClientRect().width; };
      let k = 1;
      while (need() > box - 0.5 && k > 0.6) {
        k -= 0.05;
        lab.style.fontSize = `${k.toFixed(2)}em`;
      }
    }
  }

  cancel() {
    if (!this.onCancel) return;
    this.sound?.('cancel');
    this.onCancel();
  }

  updateSel() {
    [...this.root.children].forEach((li, i) => li.classList.toggle('sel', i === this.idx));
    this.scrollToSel();
  }

  scrollToSel() {
    const li = this.root.children[this.idx];
    if (!li || !li.scrollIntoView) return;
    // 上に 固定した 見出し（タブなど）が ある ときは、CSS の scroll-margin-top の ぶん 下に 出す
    // （ブラウザの nearest は 見出しの 下に かくれた 行を「見えている」と みなして うごかない）
    let mt = parseFloat(getComputedStyle(li).scrollMarginTop) || 0;
    // 上に はりつく「← もどる」（.backchip が position: sticky の とき）の 下にも かくれないように。
    // お店の 品物を 下から 上へ えらぶと、行が もどるの 下に もぐって 見えなかった
    const chip = this.root.lastElementChild;
    const sticky = chip?.classList.contains('backchip') && getComputedStyle(chip).position === 'sticky' ? chip : null;
    if (mt > 0 || sticky) {
      let sc = li.parentElement;
      while (sc && !(sc.scrollHeight > sc.clientHeight && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      if (sc) {
        const top0 = sc.getBoundingClientRect().top + sc.clientTop;
        if (sticky) {
          // もどるの 下はし（下の すきまと かげ の ぶんも すこし あける）
          const cs = getComputedStyle(sticky);
          const gap = Math.max(parseFloat(cs.marginBottom) || 0, (parseFloat(cs.fontSize) || 16) * 0.4);
          mt = Math.max(mt, sticky.getBoundingClientRect().bottom - top0 + gap);
        }
        const top = li.getBoundingClientRect().top - top0;
        if (top < mt) {
          sc.scrollTop += top - mt;
          return;
        }
      }
    }
    li.scrollIntoView({ block: 'nearest' });
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

  // 画面で ならんでいる 列の 数（CSS で 2列・3列に している メニューも 十字キーで みたまま うごく）
  visualCols() {
    if (this.cols > 1) return this.cols;
    const lis = [...this.root.children].filter((li) => li.classList.contains('item'));
    if (lis.length < 2 || !lis[0].offsetParent) return 1;
    const top = lis[0].offsetTop;
    let n = 0;
    for (const li of lis) {
      if (Math.abs(li.offsetTop - top) > 3) break;
      n++;
    }
    return Math.max(1, n);
  }

  // 見出しの ある メニュー（たたかいの お気に入り＋ぜんぶ など）の 画面の ならび。
  // 見出しは 1行 まるごと つかうので「何こ ずつ」では うごけない。行（たかさ）ごとに まとめる
  gridRows() {
    const lis = [...this.root.children];
    const rows = [];
    this.items.forEach((it, i) => {
      const li = lis[i];
      if (it.header || !li?.offsetParent) return;
      const row = rows.find((r) => Math.abs(r.y - li.offsetTop) <= 3);
      const p = { i, x: li.offsetLeft + li.offsetWidth / 2 };
      if (row) row.list.push(p);
      else rows.push({ y: li.offsetTop, list: [p] });
    });
    rows.sort((p, q) => p.y - q.y);
    for (const r of rows) r.list.sort((p, q) => p.x - q.x);
    return rows;
  }

  nav(a) {
    const n = this.items.length;
    if (!n && a !== 'b') return;
    const arrow = ['up', 'down', 'left', 'right'].includes(a);
    const hdr = arrow && this.items.some((it) => it.header);
    const cols = arrow && !hdr ? this.visualCols() : this.cols;
    const go = (i) => {
      this.idx = i;
      this.sound?.('cursor');
      this.updateSel();
      this.onMove?.(this.current, this.idx);
    };
    const step = (d) => {
      let i = this.idx;
      for (let k = 0; k < n; k++) {
        i = (i + d + n) % n;
        if (!this.items[i].header) break;
      }
      go(i);
    };
    // 見出しの ある 2列・3列の メニュー: 上下は となりの 行の いちばん ちかい 場所へ、左右は となりへ（見出しは とばす）
    if (hdr) {
      const rows = this.gridRows();
      const r = rows.findIndex((row) => row.list.some((p) => p.i === this.idx));
      if (r >= 0 && rows.some((row) => row.list.length > 1)) {
        if (a === 'left' || a === 'right') return step(a === 'left' ? -1 : 1);
        const x = rows[r].list.find((p) => p.i === this.idx).x;
        const to = rows[(r + (a === 'up' ? -1 : 1) + rows.length) % rows.length].list;
        const best = to.reduce((p, q) => (Math.abs(q.x - x) < Math.abs(p.x - x) ? q : p));
        return go(best.i);
      }
    }
    switch (a) {
      case 'up': step(-cols); break;
      case 'down': step(cols); break;
      case 'left': if (cols > 1) step(-1); else this.onSide?.(-1); break;
      case 'right': if (cols > 1) step(1); else this.onSide?.(1); break;
      case 'a': this.choose(); break;
      case 'b': this.cancel(); break;
      default:
    }
  }

  choose() {
    const it = this.current;
    if (!it || this.pressing) return;
    if (it.disabled) {
      this.sound?.('buzz');
      return;
    }
    this.sound?.('confirm');
    if (!this.press) {
      this.onSelect?.(it, this.idx);
      return;
    }
    const idx = this.idx;
    const li = this.root.children[idx];
    li?.classList.add('press');
    this.pressing = true;
    setTimeout(() => {
      this.pressing = false;
      li?.classList.remove('press');
      // とじられた メニュー（たたかいが おわった など）では なにも しない
      if (this.active) this.onSelect?.(it, idx);
    }, this.press);
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
    // そとを タップしたら キーボードを しまうだけ（かいた もじは きえない）
    const back = el('div', { class: 'modal-back', onclick: () => field.blur() });
    const field = el('input', { class: 'textin', type: 'text', maxlength: String(max), placeholder, value: initial, inputmode: numeric ? 'numeric' : null, autocomplete: 'off', enterkeyhint: 'done' });
    const done = (v) => {
      input.pop(h);
      back.remove();
      box.remove();
      resolve(v);
    };
    const ok = el('button', { class: 'btn primary', text: '決定', onclick: () => done(field.value.trim()) });
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
    const back = el('div', { class: 'modal-back', onclick: () => finish(false) });
    const menu = new ListMenu(input, {
      items: [{ label: yes, value: true }, { label: no, value: false }],
      sound,
      back: null,
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
