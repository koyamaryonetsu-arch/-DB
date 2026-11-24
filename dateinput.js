/* 日付の入力（2026-11-20）: アプリの日付欄を全部そろえる
 *  ・打っても 📅 で選んでもよい
 *  ・全角の数字は半角に（２０２６０１０９ → 2026/1/9（金））
 *  ・見せ方は「2026/1/9（金）」（0 を付けない・曜日つき）
 *  ・年を省いた時（1/9・0109・109）は「今日以降で一番近い日」。過去の日は年まで打つ
 *  使い方:
 *   - <input class="smart-date"> … 打った文字を離れた時に「2026/1/9（金）」に直す。右に 📅 を付ける（一覧のセルの中で直す狭い欄は 📅 なし・打つだけ）
 *   - <input type="date"> … 値（YYYY-MM-DD）はそのまま。前に打てる欄を出し、日付の欄は 📅 だけにする
 *   - window.DATEIN.parse(文字) → 'YYYY-MM-DD' / ''（空）/ null（日付でない）、window.DATEIN.fmt('YYYY-MM-DD') → '2026/1/9（金）'
 */
(function () {
  'use strict';
  const DOW = '日月火水木金土';
  const pad = (n) => String(n).padStart(2, '0');
  function today0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function valid(y, mo, d) {
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  // 年を省いた時: 今日以降で一番近い日（今日も入る）
  function future(mo, d) {
    const t = today0(); let y = t.getFullYear();
    let iso = valid(y, mo, d);
    if (iso && new Date(y, mo - 1, d) < t) iso = valid(y + 1, mo, d) || valid(y + 2, mo, d);   // 2/29 は次のうるう年まで見ない（その時は null）
    if (!iso) { iso = valid(y + 1, mo, d); }
    return iso;
  }
  function norm(s) {
    s = String(s == null ? '' : s);
    try { s = s.normalize('NFKC'); } catch (e) {}
    return s.replace(/[（(][日月火水木金土][)）]/g, '').replace(/[\s　]/g, '').replace(/[－ー―‐−]/g, '-').replace(/[／]/g, '/').trim();
  }
  function parse(input) {
    const s = norm(input);
    if (!s) return '';
    let m;
    if ((m = s.match(/^(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})日?$/))) return valid(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return valid(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/))) return valid(2000 + +m[1], +m[2], +m[3]);   // 26/1/9
    if ((m = s.match(/^(\d{2})(\d{2})(\d{2})$/))) return valid(2000 + +m[1], +m[2], +m[3]);                     // 260109
    if ((m = s.match(/^(\d{1,2})[\/\-.月](\d{1,2})日?$/))) return future(+m[1], +m[2]);
    if ((m = s.match(/^(\d{2})(\d{2})$/))) return future(+m[1], +m[2]);
    if ((m = s.match(/^(\d)(\d{2})$/))) return future(+m[1], +m[2]);
    return null;
  }
  function fmt(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(iso || '');
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return `${+m[1]}/${+m[2]}/${+m[3]}（${DOW[dt.getDay()]}）`;
  }
  window.DATEIN = { parse, fmt };

  const VALUE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  // 📅 を押した時に出すカレンダー（2026-11-24〜 アプリの中のカレンダー。iPhone などで端末の日付の欄が開かない・数字が崩れるため、端末の欄は使わない）
  let CAL = null;
  function closeCal() {
    if (!CAL) return;
    CAL.box.remove(); document.removeEventListener('pointerdown', CAL.outside, true); document.removeEventListener('keydown', CAL.key, true);
    window.removeEventListener('resize', CAL.place); CAL = null;
  }
  function isoOf(dt) { return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`; }
  function openCal(anchor, iso, onPick) {
    closeCal();
    const sel = /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso : '';
    const base = sel ? new Date(+sel.slice(0, 4), +sel.slice(5, 7) - 1, 1) : new Date(today0().getFullYear(), today0().getMonth(), 1);
    let y = base.getFullYear(), m = base.getMonth();
    const box = document.createElement('div'); box.className = 'di-cal-pop'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'カレンダー');
    const tIso = isoOf(today0());
    const draw = () => {
      const first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay());
      let cells = '';
      for (let i = 0; i < 42; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), di = isoOf(d);
        if (i === 35 && d.getMonth() !== m) break;   // 5週で足りる月は6週目を出さない
        cells += `<button type="button" class="di-day${d.getMonth() !== m ? ' out' : ''}${di === tIso ? ' today' : ''}${di === sel ? ' sel' : ''}${d.getDay() === 0 ? ' sun' : d.getDay() === 6 ? ' sat' : ''}" data-d="${di}">${d.getDate()}</button>`;
      }
      box.innerHTML = `<div class="di-cal-h"><button type="button" data-nav="-12" title="前の年">«</button><button type="button" data-nav="-1" title="前の月">‹</button>
        <b>${y}年${m + 1}月</b><button type="button" data-nav="1" title="次の月">›</button><button type="button" data-nav="12" title="次の年">»</button></div>
        <div class="di-cal-w">${[...DOW].map((w, i) => `<span class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</span>`).join('')}</div>
        <div class="di-cal-g">${cells}</div>
        <div class="di-cal-f"><button type="button" data-act="today">今日</button><button type="button" data-act="clear">消す</button><button type="button" data-act="close">閉じる</button></div>`;
    };
    draw();
    document.body.appendChild(box);
    const place = () => {
      const r = anchor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, w = box.offsetWidth, h = box.offsetHeight;
      let left = Math.min(Math.max(8, r.right - w), vw - w - 8), top = r.bottom + 6;
      if (top + h > vh - 8) top = Math.max(8, r.top - h - 6);
      box.style.left = Math.max(8, left) + 'px'; box.style.top = top + 'px';
    };
    place();
    box.addEventListener('pointerdown', (e) => e.preventDefault());   // 押しても、打つ欄から離れない
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.nav) { const k = +b.dataset.nav; const d = new Date(y, m + k, 1); y = d.getFullYear(); m = d.getMonth(); draw(); place(); return; }
      if (b.dataset.d) { closeCal(); onPick(b.dataset.d); return; }
      if (b.dataset.act === 'today') { closeCal(); onPick(tIso); return; }
      if (b.dataset.act === 'clear') { closeCal(); onPick(''); return; }
      closeCal();
    });
    const outside = (e) => { if (!box.contains(e.target) && e.target !== anchor) closeCal(); };
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCal(); } };
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', key, true); window.addEventListener('resize', place);
    CAL = { box, outside, key, place };
  }
  function pickerFor(onPick, getIso) {
    const wrap = document.createElement('span'); wrap.className = 'di-pick';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'di-cal'; btn.textContent = '📅'; btn.title = 'カレンダーで選ぶ'; btn.tabIndex = -1;
    // 前の作り（隠した type=date の欄）は、値を入れる時の受け口として残す（押しても開かない・見えない）
    const hid = document.createElement('input'); hid.type = 'date'; hid.className = 'di-hidden'; hid.tabIndex = -1; hid.setAttribute('aria-hidden', 'true'); hid.dataset.diSkip = '1';
    wrap.appendChild(btn); wrap.appendChild(hid);
    btn.addEventListener('mousedown', (e) => e.preventDefault());   // 欄から離れない（表の中で直している時に閉じない）
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (CAL && CAL.anchor === btn) { closeCal(); return; }
      openCal(btn, getIso() || '', onPick); if (CAL) CAL.anchor = btn;
    });
    ['input', 'change'].forEach((t) => hid.addEventListener(t, (e) => { e.stopPropagation(); if (t === 'change' || hid.value) onPick(hid.value); }));
    return wrap;
  }
  // 打つ欄（.smart-date）
  function enhanceSmart(el) {
    if (el.dataset.diDone) return; el.dataset.diDone = '1';
    const tidy = () => { const iso = parse(el.value); if (iso) VALUE.set.call(el, fmt(iso)); };
    el.addEventListener('blur', tidy);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) tidy(); });
    // 一覧のセルの中で直す欄（とても狭い）は 📅 を付けない（押すと欄から離れて閉じてしまう）。打つだけ。📅 は ✎ の編集パネルで
    if (el.readOnly || el.disabled || el.classList.contains('inline-edit')) return;
    const p = pickerFor((iso) => {
      VALUE.set.call(el, iso ? fmt(iso) : '');
      el.classList.remove('invalid');
      fire(el, 'input'); fire(el, 'change');
    }, () => parse(el.value) || '');
    // 欄と 📅 を1つの箱に入れて、横に並べる（欄の幅は今までどおり）
    const wrap = document.createElement('span'); wrap.className = 'di-wrap';
    el.parentNode.insertBefore(wrap, el); wrap.appendChild(el); wrap.appendChild(p);
    el.classList.add('di-has-pick');
  }
  // 選ぶだけの欄（type=date）: 前に打てる欄を出す。値の出し入れは今までどおり type=date の欄で
  function enhanceNative(el) {
    if (el.dataset.diDone || el.dataset.diSkip) return; el.dataset.diDone = '1';
    const tx = document.createElement('input'); tx.type = 'text'; tx.inputMode = 'numeric';
    tx.className = 'di-text ' + String(el.className || '').replace(/\btask-due-input\b/, '').trim();
    tx.placeholder = el.getAttribute('placeholder') || '例 1/9';
    tx.title = el.title || '日付（打つか 📅 で選ぶ）'; tx.disabled = el.disabled; tx.readOnly = el.readOnly;
    if (el.getAttribute('aria-label')) tx.setAttribute('aria-label', el.getAttribute('aria-label'));
    const show = () => { VALUE.set.call(tx, el.value ? fmt(VALUE.get.call(el)) : ''); tx.classList.remove('invalid'); };
    // プログラムで値を入れた時も、打つ欄に出す
    Object.defineProperty(el, 'value', { configurable: true, get() { return VALUE.get.call(el); }, set(v) { VALUE.set.call(el, v); show(); } });
    const commit = () => {
      const raw = tx.value.trim();
      const iso = parse(raw);
      if (iso === null) { tx.classList.add('invalid'); tx.title = '日付として読めません（例: 1/9・0109・2026/1/9）'; return; }
      tx.classList.remove('invalid');
      if (iso === VALUE.get.call(el)) { show(); return; }
      VALUE.set.call(el, iso); show(); fire(el, 'input'); fire(el, 'change');
    };
    ['input', 'change'].forEach((t) => tx.addEventListener(t, (e) => e.stopPropagation()));   // 打っている途中は、元の欄の動きを起こさない
    tx.addEventListener('blur', commit);
    tx.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); commit(); } });
    el.addEventListener('change', show); el.addEventListener('input', show);
    el.classList.add('di-native'); el.tabIndex = -1;
    const box = document.createElement('span'); box.className = 'di-box';
    el.parentNode.insertBefore(box, el);
    box.appendChild(tx);
    box.appendChild(pickerFor((iso) => { if (iso !== VALUE.get.call(el)) { VALUE.set.call(el, iso); show(); fire(el, 'input'); fire(el, 'change'); } }, () => VALUE.get.call(el)));
    box.appendChild(el);
    show();
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('input.smart-date')) enhanceSmart(root);
    if (root.matches && root.matches('input[type="date"]')) enhanceNative(root);
    root.querySelectorAll('input.smart-date').forEach(enhanceSmart);
    root.querySelectorAll('input[type="date"]').forEach(enhanceNative);
  }
  function start() {
    scan(document.body);
    new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); }))).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
