// がめんの パーツを つくる どうぐ

import { kanaPad } from './kana-pad.js?v=d4d473d565e8';

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
  //   第35回: 2列・3列の リストでも、いちばん右の 列で 右・いちばん左の 列で 左 を おすと onSide（戦いの 技の タブ など）
  // fit: なまえは 1行で。入りきらない ときは 文字を 小さく して ぜんぶ 見せる（せまい ボタンの たたかいの コマンド）
  // tapConfirm: タップ（クリック）で ほかの 行を えらぶと カーソルと せつめい だけ うごく。えらんでいる 行を もう一度 おすと 決まる
  //   （戦いの 呪文・特技・道具。マウスは 先に カーソルが 合うので 1回で 決まる）
  // onLong: 行を 長おし（タッチ・マウス 0.5秒）した とき・Y（キーボードの Y・ゲームパッドの Y）を おした とき（第27回 戦いの お気に入り）。
  //   長おしでは その 行は 決まらない（はなした あとの クリックは すてる）
  // onY: Y（キーボードの Y・ゲームパッドの Y）を おした とき（長おしでは よばない。第35回 道具の ならべかえ）
  // onLR: L・R（キーボードの Q・E／PageUp・PageDown、ゲームパッドの L・R）を おした とき。-1 か 1（第69回 戦いの 技の タブ）
  // list: 第96回 一覧の まど（行が ならんで スクロール できる 物）。タップ・クリックは
  //   1回め … その 行に カーソルを 合わせる（決定しない）・同じ 行を もう1回 … 決定（2回で 決定）。
  //   設定「タップ1回で決定：ON」（ListMenu.tapOnce）の 時は 今までどおり（tapConfirm の きまり）。
  //   はい・いいえ・コマンド・的を えらぶ まど などは list なし（1回で 決定）。
  //   どちらでも、スクロールが 動いて いる 時の タップ（指で 止める）と なぞった 時は、カーソルも 決定も しない
  constructor(input, { items = [], cols = 1, onSelect, onCancel, onMove, onSide, sound, className = '', back, press = 0, start = -1, fit = false, tapConfirm = false, list = false, onLong = null, onY = null, onLR = null } = {}) {
    this.input = input;
    this.list = list;
    this.armed = -1;
    this.onLR = onLR;
    this.onY = onY;
    this.tapConfirm = tapConfirm;
    this.onLong = onLong;
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
    const self = this;
    // yKey: ゲームパッドの Y を「y」で とどける（長おしの かわり。onLong が ある ときだけ。input.js）
    // lr: ゲームパッドの L・R を「l」「r」で とどける（onLR が ある ときだけ。ほかでは L は 大鳥・竜、R は 走る。input.js）
    this.handler = { onNav: (a, rep) => this.nav(a, rep), pad: true, el: this.root, onGone: () => { this.active = false; }, get yKey() { return !!(self.onLong || self.onY); }, get lr() { return !!self.onLR; } };
    this.active = false;
    this.render();
  }

  setItems(items, keepIdx = true) {
    this.items = items;
    this.disarm();
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
          this.tap(i, e);
        },
        // 長おし（onLong の ある メニューだけ）
        // （あとから menu.onLong を 入れても 効く）
        onpointerdown: (e) => { if (this.onLong) this.longStart(e, i); },
        oncontextmenu: (e) => { if (this.onLong) e.preventDefault(); },
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

  // 第96回: 行を タップ（クリック）した とき。e … click の イベント（テストでは なし）
  tap(i, e = null) {
    const it = this.items[i];
    if (!it || it.header) return;
    // スクロールを 指で 止めた タップ・なぞった あとの タップは なにも しない
    if (tapStopped(this.root, e)) return;
    const moved = this.idx !== i;
    if (this.list && !ListMenu.tapOnce) {
      // 同じ 行を もう1回 → 決定。1回め（ちがう 行）→ カーソルを 合わせる だけ
      if (this.armed === i && !moved) {
        this.disarm();
        this.choose();
        return;
      }
      this.idx = i;
      this.armed = i;
      this.updateSel();
      if (moved) this.onMove?.(it, i);
      this.sound?.('cursor');
      if (!it.disabled) showTapHint(this);
      return;
    }
    this.idx = i;
    this.render();
    // タッチでは ホバーが ないので、タップで せつめいも かえる
    if (moved) this.onMove?.(this.items[i], i);
    if (moved && this.tapConfirm) {
      this.sound?.('cursor');
      return;
    }
    this.choose();
  }

  // 「もう一度タップで決定」を けす（決定した・キーで うごかした・まどを とじた）
  disarm() {
    this.armed = -1;
    hideTapHint(this);
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

  // 長おしを はかる（0.5秒。ゆびが 10ピクセル より うごいた・はなした・スクロールに なった ときは やめる）
  longStart(e, i) {
    if (e.button > 0 || this.items[i]?.header) return;
    clearTimeout(this.longT);
    const x0 = e.clientX, y0 = e.clientY;
    const off = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', stop);
      removeEventListener('pointercancel', stop);
    };
    const stop = () => { clearTimeout(this.longT); off(); };
    const move = (ev) => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) stop(); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', stop);
    addEventListener('pointercancel', stop);
    this.longT = setTimeout(() => {
      off();
      if (!this.active || this.pressing || !this.root.isConnected) return;
      // はなした ときの クリックは すてる（行が 決まらない・出てきた まどの 中も おさない）
      const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      const release = () => {
        removeEventListener('pointerup', release);
        removeEventListener('pointercancel', release);
        addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => removeEventListener('click', swallow, { capture: true }), 500);
      };
      addEventListener('pointerup', release);
      addEventListener('pointercancel', release);
      this.fireLong(i);
    }, ListMenu.LONG_MS);
  }

  fireLong(i = this.idx) {
    const it = this.items[i];
    if (!this.onLong || !it || it.header) return;
    if (this.idx !== i) {
      this.idx = i;
      this.updateSel();
      this.onMove?.(it, i);
    }
    this.sound?.('cursor');
    this.onLong(it, i);
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
    markProgScroll();
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
    this.disarm();
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

  // 今の 行が 画面の 行の 左はし（d=-1）・右はし（d=1）か。画面に 出ていない ときは cols で はかる
  atEdge(d, cols = this.cols) {
    if (cols <= 1 && !this.items.some((it) => it.header)) {
      // 1列（CSS で 2列・3列に 見える ものは 下の gridRows）
      const lis = [...this.root.children].filter((li) => li.classList.contains('item'));
      if (!lis[0]?.offsetParent) return true;
    }
    const rows = this.gridRows();
    const r = rows.find((row) => row.list.some((p) => p.i === this.idx));
    if (r) {
      const k = r.list.findIndex((p) => p.i === this.idx);
      return d < 0 ? k === 0 : k === r.list.length - 1;
    }
    if (cols <= 1) return true;
    const k = this.idx % cols;
    return d < 0 ? k === 0 : k === cols - 1 || this.idx === this.items.length - 1;
  }

  // 第69回: 見えている ひとまとまり（まどに 入る 行の 数 × 列の 数）ぶん 先・前へ（おなじ 列のまま。はしで とまる）
  //   スクロールが いる ときは まども その ぶん うごかす。もどりち: うごいたか
  pageTarget(d) {
    const n = this.items.length;
    if (!n || this.items.some((it) => it.header)) return this.idx;
    const cols = Math.max(1, this.visualCols());
    const rows = this.pageRows();
    const block = rows * cols;
    const col = this.idx % cols;
    let to = this.idx + d * block;
    if (to > n - 1) {
      // さいごの 行の おなじ 列（なければ さいごの 技）
      const lastRow = Math.floor((n - 1) / cols);
      to = Math.min(n - 1, lastRow * cols + col);
    } else if (to < 0) to = col;
    return to;
  }

  // まどに 入る 行の 数（1行の 高さで はかる。まだ 画面に ない ときは 1）
  pageRows() {
    const lis = [...this.root.children].filter((li) => li.classList.contains('item'));
    if (!lis[0]?.offsetParent) return 1;
    const top = lis[0].offsetTop;
    const next = lis.find((li) => li.offsetTop - top > 3);
    const pitch = next ? next.offsetTop - top : lis[0].offsetHeight;
    const h = this.root.clientHeight;
    return Math.max(1, Math.floor((h + 2) / Math.max(1, pitch)));
  }

  // 前・つぎの まとまりが あるか（スマホの ◀ ▶ を 出す。scroll: まどが スクロールする ほど 長いか）
  pageInfo() {
    const box = this.root;
    return {
      scroll: box.scrollHeight - box.clientHeight > 2,
      prev: this.pageTarget(-1) !== this.idx,
      next: this.pageTarget(1) !== this.idx,
    };
  }

  pageJump(d) {
    const to = this.pageTarget(d);
    if (to === this.idx) {
      this.sound?.('buzz');
      return false;
    }
    const box = this.root;
    const li0 = box.children[this.idx];
    const li1 = box.children[to];
    // まどを おなじ 行の かず ぶん うごかす（えらんだ 技が まどの おなじ 高さに 来る）
    markProgScroll();
    if (li0 && li1) box.scrollTop += li1.offsetTop - li0.offsetTop;
    this.disarm();
    this.idx = to;
    this.sound?.('cursor');
    this.updateSel();
    this.onMove?.(this.current, this.idx);
    return true;
  }

  nav(a) {
    const n = this.items.length;
    // 第69回: L・R（onLR が ない メニューでは なにも しない）
    if (a === 'l' || a === 'r') {
      this.onLR?.(a === 'l' ? -1 : 1);
      return;
    }
    if (!n && a !== 'b') return;
    const arrow = ['up', 'down', 'left', 'right'].includes(a);
    const hdr = arrow && this.items.some((it) => it.header);
    const cols = arrow && !hdr ? this.visualCols() : this.cols;
    const go = (i) => {
      this.disarm();
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
        if ((a === 'left' || a === 'right') && this.onSide && this.atEdge(a === 'left' ? -1 : 1)) return this.onSide(a === 'left' ? -1 : 1);
        if (a === 'left' || a === 'right') return step(a === 'left' ? -1 : 1);
        const x = rows[r].list.find((p) => p.i === this.idx).x;
        const to = rows[(r + (a === 'up' ? -1 : 1) + rows.length) % rows.length].list;
        const best = to.reduce((p, q) => (Math.abs(q.x - x) < Math.abs(p.x - x) ? q : p));
        return go(best.i);
      }
    }
    // Y: onY が あれば そちら（道具の ならべかえ）。なければ 長おしと おなじ
    if (a === 'y' && this.onY) return this.onY(this.current, this.idx);
    // 列の はしで 左右 → onSide（タブを かえる など。1列の リストは いつも はし）
    if ((a === 'left' || a === 'right') && this.onSide && this.atEdge(a === 'left' ? -1 : 1, cols)) return this.onSide(a === 'left' ? -1 : 1);
    switch (a) {
      case 'up': step(-cols); break;
      case 'down': step(cols); break;
      case 'left': if (cols > 1) step(-1); else this.onSide?.(-1); break;
      case 'right': if (cols > 1) step(1); else this.onSide?.(1); break;
      case 'a': this.choose(); break;
      case 'b': this.cancel(); break;
      case 'y': this.fireLong(); break;
      default:
    }
  }

  choose() {
    const it = this.current;
    if (!it || this.pressing) return;
    this.disarm();
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

// 長おしの 時間（ミリ秒）
ListMenu.LONG_MS = 500;

// ───────────── 第96回: タップの きまり ─────────────
// 設定「タップ1回で決定」（この 端末だけ。localStorage の kizuna_tap1。はじめは OFF ＝ 一覧は 2回で 決定）
export function tapOncePref() {
  try { return localStorage.getItem('kizuna_tap1') === '1'; } catch { return false; }
}
export function setTapOncePref(on) {
  ListMenu.tapOnce = !!on;
  try { localStorage.setItem('kizuna_tap1', on ? '1' : ''); } catch { /* */ }
}
ListMenu.tapOnce = tapOncePref();

// スクロールの ようす（どの まどが いつ スクロールしたか・指を おいた 場所）。
//   SCROLL_STOP_MS … スクロールが この ミリ秒 いないに 動いて いたら「動いて いる」（指で 止める タップ）
//   DRAG_PX … 指を おいてから はなすまでに これより 動いたら「なぞった」
export const TAP = { SCROLL_STOP_MS: 160, DRAG_PX: 12, PROG_MS: 120, last: new WeakMap(), prog: 0, down: null };
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
// プログラムで スクロールした（カーソルの 行を 見せる など）。この あと すこしの スクロールは 数えない
export function markProgScroll() { TAP.prog = now(); }
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('scroll', (ev) => {
    if (now() - TAP.prog < TAP.PROG_MS) return;
    if (ev.target && ev.target !== document) TAP.last.set(ev.target, now());
  }, { capture: true, passive: true });
  document.addEventListener('pointerdown', (ev) => {
    TAP.down = { x: ev.clientX, y: ev.clientY, t: now(), target: ev.target };
  }, { capture: true, passive: true });
}

// この タップは「スクロールを 止めた」か「なぞった」か（true なら 行は えらばない）。
//   root … 一覧の ul（root か その 上の まどが スクロールして いた か を 見る）
export function tapStopped(root, e) {
  const d = TAP.down;
  if (!d || !e || !root) return false;
  if (typeof e.clientX === 'number' && e.detail !== 0 && Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.DRAG_PX) return true;
  for (let n = root; n && n.nodeType === 1; n = n.parentElement) {
    const t = TAP.last.get(n);
    if (t === undefined) continue;
    // 指を おく すこし 前まで 動いて いた（止める タップ）・おいて いる 間に 動いた（なぞった）
    if (t > d.t - TAP.SCROLL_STOP_MS) return true;
  }
  return false;
}

// 「もう一度タップで決定」（えらんだ 一覧の まどの 下の はしに 小さく）
let hintEl = null;
let hintOwner = null;
let hintTimer = 0;
export const TAP_HINT = 'もう一度タップで決定';
function showTapHint(menu) {
  if (typeof document === 'undefined' || !document.body || !menu.root?.getBoundingClientRect) return;
  if (!hintEl) hintEl = el('div', { class: 'tap-hint', role: 'status', 'aria-live': 'polite', text: TAP_HINT });
  if (!hintEl.isConnected) document.body.append(hintEl);
  hintOwner = menu;
  const box = scrollerOf(menu.root) || menu.root;
  const r = box.getBoundingClientRect();
  const vh = innerHeight || r.bottom;
  hintEl.style.left = `${Math.round(r.left + r.width / 2)}px`;
  // 一覧の まどの 下の ふち（まどの 線の 上に のせる）
  hintEl.style.top = `${Math.round(Math.min(r.bottom, vh - 14))}px`;
  hintEl.classList.add('on');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hideTapHint(menu), 2600);
}
function hideTapHint(menu) {
  if (!hintEl || (menu && hintOwner && hintOwner !== menu)) return;
  hintEl.classList.remove('on');
  hintOwner = null;
}

// ───────────── 十字キーで スクロール（第50回） ─────────────
// えらぶ 行が「もどる」だけの 長い 画面（強さの くわしい 画面・全員の 強さ）を、コントローラーの 上下・左右で 動かす。
// menu の 上下 → ys（たての まど）、左右 → xs（よこに はみ出す 表）。関数でも よい（その ときの まどを かえす）。
// スクロールできない ときは いつもの うごき
export function padScroll(menu, { ys = null, xs = null } = {}) {
  const nav = menu.nav.bind(menu);
  menu.nav = (a, rep) => {
    const d = { up: -1, down: 1, left: -1, right: 1 }[a];
    const tate = a === 'up' || a === 'down';
    const t = tate ? ys : xs;
    const box = typeof t === 'function' ? t() : t;
    if (d && box && scrollStep(box, tate, d, rep)) return;
    return nav(a, rep);
  };
  return menu;
}

// 1回ぶん スクロール（tate: たて・d: -1 か 1・rep: おしっぱなしの くりかえし）。スクロールできる まど なら true
export function scrollStep(box, tate, d, rep = false) {
  const max = tate ? box.scrollHeight - box.clientHeight : box.scrollWidth - box.clientWidth;
  if (!(max > 1)) return false;
  const k = tate ? 'scrollTop' : 'scrollLeft';
  markProgScroll();
  const step = Math.max(40, (tate ? box.clientHeight : box.clientWidth) * (rep ? 0.25 : 0.4));
  box[k] = Math.max(0, Math.min(max, (box[k] || 0) + d * step));
  return true;
}

// 第96回: せつめいの らん（高さが きまって いて 中だけ スクロール）に つづきが ある 時は「▼」（CSS の .more）。
//   中みを かえた あと・スクロールした 時に よぶ（はじめの 1回で スクロールの 見はりも つける）
export function moreMark(box) {
  if (!box?.classList) return;
  const f = () => box.classList.toggle('more', box.scrollHeight - box.clientHeight - box.scrollTop > 2);
  if (!box.moreBound && box.addEventListener) {
    box.moreBound = true;
    box.addEventListener('scroll', f, { passive: true });
  }
  f();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(f);
}

// el を ふくむ いちばん ちかい たてに スクロールする まど（なければ null）
export function scrollerOf(node) {
  for (let e = node; e && e !== document.body; e = e.parentElement) {
    if (e.scrollHeight > e.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(e).overflowY)) return e;
  }
  return null;
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
    // コントローラーが つながって いる ときは そうさの ヒント（第50回）
    let pad = false;
    try { pad = [...(globalThis.navigator?.getGamepads?.() || [])].some((p) => p?.connected); } catch { /* */ }
    // 第62回: コントローラーの ときは 文字ばん（ui/kana-pad.js）。十字キーで えらんで A で 入れる（タップでも おせる）
    const sound = (x) => { try { globalThis.__game?.audio?.sfx?.(x); } catch { /* */ } };
    const kp = pad ? kanaPad(field, { max, numeric, onDone: (v) => done(v), sound }) : null;
    const box = el('div', { class: `win panel center-panel ${kp ? 'has-kpad' : ''}` },
      el('h2', { text: title }),
      field,
      kp ? el('div', { class: 'small muted', style: { marginTop: '0.3em' }, text: 'コントローラー：十字キーで選んでAで入れる・Bで1字けす' }) : null,
      kp ? kp.root : null,
      kp ? null : el('div', { class: 'row end', style: { marginTop: '0.6em' } }, cancel, ok));
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) done(field.value.trim());
      if (e.key === 'Escape') done(null);
    });
    // コントローラー: A で 決定（書いて いなければ はじめの 文字の まま）・B で やめる。
    // キーボードは 文字を 書く ので、ここには こない（input.js。Enter・Esc は 上の keydown）
    const h = { onNav: (a) => {
      if (kp) {
        // 書いている（キーボード）時の A・B は 今までどおり。文字ばんの 時は 文字ばんへ
        if (document.activeElement !== field || !['a', 'b'].includes(a)) { kp.nav(a); return; }
      }
      if (a === 'a') done(field.value.trim()); else if (a === 'b') done(null);
    } };
    input.push(h);
    ui.append(back, box);
    // 文字ばんの 時は 文字の 入力に しない（スマホの キーボードが 出て 文字ばんが かくれない ように）
    if (!kp) setTimeout(() => field.focus(), 30);
  });
}

// たしかめる まど。ほかの ポップアップ（宝の地図・道具の まど など。z-index 4〜7）の 上から 開く ことが あるので、
// いつも いちばん 前に 出す（第40回: 宝の地図の「地図を捨てる」で、たしかめる まどが うしろに かくれていた）
export const CONFIRM_Z = 20;
export function confirmBox(input, text, yes = 'はい', no = 'いいえ', sound) {
  return new Promise((resolve) => {
    const ui = document.getElementById('ui');
    const back = el('div', { class: 'modal-back', style: { zIndex: CONFIRM_Z }, onclick: () => finish(false) });
    const menu = new ListMenu(input, {
      items: [{ label: yes, value: true }, { label: no, value: false }],
      sound,
      back: null,
      onSelect: (it) => finish(it.value),
      onCancel: () => finish(false),
    });
    const box = el('div', { class: 'win panel center-panel', style: { width: 'min(90vw, 520px)', zIndex: CONFIRM_Z + 1, background: 'var(--win-solid)' } }, el('div', { style: { whiteSpace: 'pre-line', marginBottom: '0.5em' }, text }), menu.root);
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
