"use strict";
/* ============================================================
   工程表（ガントチャート）  ―  シネマ案件管理アプリ統合版
   ・種類: 通常(日付) / ゼロ工程表(1日目…) / マスター工程(週・月)
   ・通常/ゼロ: 1日4分割（〜8時/8〜12/12〜17/17〜）・各作業2段（日中/夜間。文字はバーの上）
   ・マスター: 週 or 月単位・各作業1段
   ・空いている所をドラッグでバーを作る（ダブルクリックでも1日分）／つかんで移動（上下で日中⇔夜間）
     ／端で長さ／クリックで文字・日中⇔夜間・削除／Ctrl+クリックで複数選択
   ・戻す/進む・縮尺・特記事項・印刷・Excel出力
   ・どの工程表を開くか・保存（上書き保存／名前を付けて新規に保存）は書類棚(shelf.js)が受け持つ。
     ここは「開いている1枚」を描いて編集し、変わったら hooks.onChange で知らせるだけ
   ============================================================ */
(function () {
  const BASE_QW = 16;
  let scale = 1;
  let QW = 16, COL_W = 64, SLOTS = 4; // render時に種類・縮尺で再計算
  const $ = (s) => document.querySelector(s);

  const DEFAULT_TASKS = [
    "その他イベント", "仮設・養生", "クレーン作業", "搬出入作業", "屋上搬出入作業",
    "解体・撤去工事", "機器据付", "配管工事", "ダクト工事", "保温工事",
    "電気工事", "制御・計装工事", "ガス工事", "衛生器具設置", "試運転調整", "検査類", "片付け・清掃"
  ];
  const TASK_SUGGEST = [...new Set([...DEFAULT_TASKS,
    "墨出し", "コア抜き", "斫り工事", "防水工事", "塗装工事", "足場組立・解体", "盤更新",
    "冷媒配管", "ドレン配管", "ポンプ据付", "空調機据付", "ボイラー据付", "冷凍機据付",
    "電源切替", "系統試験", "気密試験", "水圧試験", "引渡し", "残工事・手直し", "B電気工事", "C電気工事"
  ])];

  let state = null;
  let hooks = {};

  function defaultState(init) {
    return Object.assign({
      v: 2, kind: 'date', unit: 'week',
      title: "工事名　工程表", content: "", start: isoToday(), days: 21,
      author: "", client: "", notes: "",
      tasks: DEFAULT_TASKS.map((n) => ({ id: uid(), name: n })),
      bars: []   // {id, taskId, startSlot, lenSlots, night:bool, label}
    }, init || {});
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function isoToday() { return iso(new Date()); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function addDaysIso(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }

  /* ---- 種類ごとのパラメータ ---- */
  function isMaster() { return state && state.kind === 'master'; }
  function slotsPer() { return isMaster() ? 1 : 4; }
  function hasCalendar() { return state && state.kind === 'date'; }

  /* ---- 祝日（概算・通常工程のみ使用） ---- */
  const _holCache = {};
  function holidaysOf(year) {
    if (_holCache[year]) return _holCache[year];
    const H = {};
    const k = (m, d) => year + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const nthMon = (m, n) => { const fd = new Date(year, m - 1, 1).getDay(); const first = 1 + ((1 - fd) + 7) % 7; return first + (n - 1) * 7; };
    H[k(1, 1)] = '元日'; H[k(1, nthMon(1, 2))] = '成人の日'; H[k(2, 11)] = '建国記念の日';
    if (year >= 2020) H[k(2, 23)] = '天皇誕生日'; else if (year <= 2018) H[k(12, 23)] = '天皇誕生日';
    H[k(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)))] = '春分の日';
    H[k(4, 29)] = year >= 2007 ? '昭和の日' : 'みどりの日'; H[k(5, 3)] = '憲法記念日';
    if (year >= 2007) H[k(5, 4)] = 'みどりの日'; else H[k(5, 4)] = '国民の休日';
    H[k(5, 5)] = 'こどもの日';
    if (year >= 2003) H[k(7, nthMon(7, 3))] = '海の日'; else if (year >= 1996) H[k(7, 20)] = '海の日';
    if (year >= 2016) H[k(8, 11)] = '山の日';
    if (year >= 2003) H[k(9, nthMon(9, 3))] = '敬老の日'; else if (year >= 1966) H[k(9, 15)] = '敬老の日';
    H[k(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)))] = '秋分の日';
    if (year >= 2020) H[k(10, nthMon(10, 2))] = 'スポーツの日'; else if (year >= 2000) H[k(10, nthMon(10, 2))] = '体育の日'; else if (year >= 1966) H[k(10, 10)] = '体育の日';
    H[k(11, 3)] = '文化の日'; H[k(11, 23)] = '勤労感謝の日';
    const base = Object.assign({}, H); const dn = (s) => parseISO(s).getDay();
    if (year >= 1973) {
      Object.keys(base).forEach((d) => { if (dn(d) === 0) { let nx = addDaysIso(d, 1); while (H[nx]) nx = addDaysIso(nx, 1); H[nx] = '振替休日'; } });
      for (let d = new Date(year, 0, 1); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
        const key = iso(d); if (H[key] || d.getDay() === 0) continue;
        const prev = addDaysIso(key, -1), next = addDaysIso(key, 1);
        if (H[prev] && H[next] && H[prev] !== '振替休日') H[key] = '国民の休日';
      }
    }
    _holCache[year] = H; return H;
  }
  function holidayName(date) { return holidaysOf(date.getFullYear())[iso(date)] || null; }

  const DOW = ['日', '月', '火', '水', '木', '金', '土'];
  function dayInfo(i) {
    const d = parseISO(state.start); d.setDate(d.getDate() + i);
    const dow = d.getDay(); const hol = holidayName(d);
    return { date: d, dow, dowName: DOW[dow], md: (d.getMonth() + 1) + '/' + d.getDate(), year: d.getFullYear(),
      monthStart: d.getDate() === 1 || i === 0, isWeekend: dow === 0 || dow === 6, isHoliday: !!hol, holName: hol, isToday: iso(d) === isoToday() };
  }
  function endDateIso() { return addDaysIso(state.start, Math.max(0, state.days - 1)); }
  function fmtJp(isoStr) { const d = parseISO(isoStr); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日(' + DOW[d.getDay()] + ')'; }
  function periodLabel(i) {
    if (isMaster()) return state.unit === 'month' ? ('第' + (i + 1) + 'ヶ月') : ('第' + (i + 1) + '週');
    if (state.kind === 'zero') return (i + 1) + '日目';
    return '';
  }

  /* ============================================================
     描画
     ============================================================ */
  const board = $('#viewKotei #board');
  const viewEl = document.getElementById('viewKotei');
  let selectedIds = new Set();

  function applyScaleVars() {
    SLOTS = slotsPer();
    if (isMaster()) { COL_W = Math.round((state.unit === 'month' ? 120 : 96) * scale); QW = COL_W; }
    else { QW = Math.round(BASE_QW * scale); COL_W = QW * 4; }
    if (viewEl) { viewEl.style.setProperty('--kqw', QW + 'px'); viewEl.style.setProperty('--kday', COL_W + 'px'); }
    const lvl = $('#viewKotei #kZoomLevel'); if (lvl) lvl.textContent = Math.round(scale * 100) + '%';
  }

  function render() {
    if (!state) return;
    closeBarPop();
    applyScaleVars();
    board.innerHTML = '';
    const cols = state.days, trackW = cols * COL_W;
    board.style.width = (140 + trackW) + 'px';

    // ヘッダー
    const head = el('div', 'khead');
    const corner = el('div', 'kcorner'); corner.textContent = '作業内容';
    head.appendChild(corner);
    const tl = el('div', 'ktimeline'); tl.style.width = trackW + 'px';
    for (let i = 0; i < cols; i++) {
      const day = el('div', 'kday'); day.style.width = COL_W + 'px'; day.style.flex = '0 0 ' + COL_W + 'px';
      const top = el('div', 'kday-top');
      if (hasCalendar()) {
        const di = dayInfo(i);
        if (di.monthStart) day.classList.add('month-start');
        if (di.isWeekend || di.isHoliday) day.classList.add('wknd');
        if (di.isToday) day.classList.add('today');
        const showYear = i === 0 || di.date.getDate() === 1;
        top.innerHTML = `<span class="yr">${showYear ? di.year + '年' : ''}</span><span class="md">${di.md}</span><span class="dow">${di.dowName}</span>`;
        if (di.holName) top.title = di.holName;
      } else {
        top.innerHTML = `<span class="md">${periodLabel(i)}</span>`;
      }
      day.appendChild(top);
      tl.appendChild(day);
    }
    head.appendChild(tl);
    board.appendChild(head);

    let wknd = [], todayIdx = -1;
    if (hasCalendar()) { for (let i = 0; i < cols; i++) { const di = dayInfo(i); if (di.isWeekend || di.isHoliday) wknd.push(i); if (di.isToday) todayIdx = i; } }

    const laneNights = isMaster() ? [false] : [false, true];

    state.tasks.forEach((task) => {
      const row = el('div', 'ktask');
      const lbl = el('div', 'klabel');
      const grip = el('span', 'grip'); grip.textContent = '⋮'; grip.title = 'ドラッグで並べ替え'; grip.draggable = true;
      grip.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', task.id); });
      const name = el('div', 'name'); name.textContent = task.name; name.title = 'クリックで名前を書き直す';
      name.addEventListener('click', () => editTaskName(task, name));
      const del = el('button', 'ktask-del'); del.textContent = '×'; del.title = 'この作業を削除';
      del.addEventListener('click', () => deleteTask(task));
      lbl.append(grip, name, del);
      lbl.addEventListener('dragover', (e) => e.preventDefault());
      lbl.addEventListener('drop', (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); reorderTask(id, task.id); });
      row.appendChild(lbl);

      const lanes = el('div', 'klanes'); lanes.style.width = trackW + 'px';
      wknd.forEach((i) => { const c = el('div', 'kwkcol'); c.style.left = (i * COL_W) + 'px'; c.style.width = COL_W + 'px'; lanes.appendChild(c); });
      if (todayIdx >= 0) { const c = el('div', 'ktodaycol'); c.style.left = (todayIdx * COL_W) + 'px'; c.style.width = COL_W + 'px'; lanes.appendChild(c); }
      // 縦線（実体のある要素＝印刷でも確実に出る）: 1日ごとに濃い線、1日の1/4ごとに薄い線
      addGridLines(lanes, cols, SLOTS);

      // 1作業 = 日中・夜間の2段（マスターは1段）。文字はバーの上に出す
      laneNights.forEach((night) => {
        const lane = makeLane(task.id, night, trackW);
        state.bars.filter((b) => b.taskId === task.id && (isMaster() ? true : !!b.night === night)).forEach((b) => lane.appendChild(makeBar(b)));
        lanes.appendChild(lane);
      });
      row.appendChild(lanes);
      board.appendChild(row);
    });

    // 「＋ 作業を追加」行（この画面で作業の追加ができる）
    const addRow = el('div', 'ktask ktask-addrow');
    const addBtn = el('button', 'ktask-add'); addBtn.textContent = '＋ 作業を追加';
    addBtn.addEventListener('click', addTaskInline);
    addRow.appendChild(addBtn);
    board.appendChild(addRow);

    applySelection();
  }

  function addGridLines(lanes, cols, slots) {
    for (let d = 1; d <= cols; d++) { const ln = el('div', 'kgl kgl-day'); ln.style.left = (d * COL_W) + 'px'; lanes.appendChild(ln); }
    if (slots > 1) {
      for (let d = 0; d < cols; d++) {
        for (let q = 1; q < slots; q++) { const ln = el('div', 'kgl kgl-q'); ln.style.left = (d * COL_W + q * QW) + 'px'; lanes.appendChild(ln); }
      }
    }
  }

  function deleteTask(task) {
    if (state.bars.some((b) => b.taskId === task.id) && !confirm('「' + task.name + '」とそのバーを削除します。よろしいですか？')) return;
    recordUndo(snap());
    state.bars = state.bars.filter((b) => b.taskId !== task.id);
    state.tasks = state.tasks.filter((t) => t.id !== task.id);
    changed(); render();
  }
  function addTaskInline() {
    recordUndo(snap());
    const t = { id: uid(), name: '新しい作業' };
    state.tasks.push(t);
    changed(); render();
    const names = board.querySelectorAll('.klabel .name');
    const last = names[names.length - 1]; if (last) editTaskName(t, last, true);
  }

  function makeLane(taskId, night, trackW) {
    const lane = el('div', 'klane bar' + (night ? ' night' : ' day') + (isMaster() ? ' master' : ''));
    lane.style.width = trackW + 'px';
    lane.dataset.task = taskId; lane.dataset.night = night ? '1' : '0'; lane.dataset.kind = 'bar';
    if (!isMaster()) { const tag = el('span', 'ltag'); tag.textContent = night ? '夜間' : '日中'; lane.appendChild(tag); }
    lane.addEventListener('pointerdown', (e) => onLaneDown(e, lane));
    lane.addEventListener('dblclick', (e) => onLaneDblClick(e, lane));
    return lane;
  }
  function makeBar(b) {
    const night = isMaster() ? false : !!b.night;
    const div = el('div', 'kbar ' + (night ? 'night' : 'day'));
    div.dataset.id = b.id;
    div.style.left = (b.startSlot * QW) + 'px'; div.style.width = Math.max(QW, b.lenSlots * QW) + 'px';
    div.title = (b.label || '(文字なし)') + '  [' + slotLabel(b) + ']  クリックで文字・削除';
    const lb = el('span', 'klb'); lb.textContent = b.label || '';
    const hl = el('div', 'h l'), hr = el('div', 'h r');
    div.append(lb, hl, hr);
    div.addEventListener('pointerdown', (e) => onBarDown(e, b, div));
    div.addEventListener('dblclick', (e) => { e.stopPropagation(); openBarPop(b); });
    return div;
  }
  function slotLabel(b) {
    const s = slotsPer();
    const d0 = Math.floor(b.startSlot / s), d1 = Math.floor((b.startSlot + b.lenSlots - 1) / s);
    if (isMaster()) { const u = state.unit === 'month' ? 'ヶ月' : '週'; return '第' + (d0 + 1) + u + (d0 === d1 ? '' : '〜第' + (d1 + 1) + u); }
    if (state.kind === 'zero') return (d0 + 1) + '日目' + (d0 === d1 ? '' : '〜' + (d1 + 1) + '日目');
    const a = dayInfo(Math.min(d0, state.days - 1)), c = dayInfo(Math.min(d1, state.days - 1));
    return a.md + (d0 === d1 ? '' : ' 〜 ' + c.md);
  }
  function liveUpdate(b) {
    const bd = board.querySelector('.kbar[data-id="' + b.id + '"]');
    if (bd) { bd.style.left = (b.startSlot * QW) + 'px'; bd.style.width = Math.max(QW, b.lenSlots * QW) + 'px'; }
  }

  /* ============================================================
     バー操作
     ============================================================ */
  let drag = null;
  function slotAtClientX(lane, clientX) { const r = lane.getBoundingClientRect(); return clamp(Math.floor((clientX - r.left) / QW), 0, state.days * SLOTS - 1); }
  // 空いている所をドラッグ → その長さでバーを作る（クリックだけでは作らない＝うっかり防止）
  function onLaneDown(e, lane) {
    if (e.button !== 0 || e.target.closest('.kbar')) return;
    e.preventDefault();
    if (!(e.ctrlKey || e.metaKey)) { selectedIds = new Set(); applySelection(); }
    const s = slotAtClientX(lane, e.clientX);
    const ghost = el('div', 'kghost'); ghost.style.left = (s * QW) + 'px'; ghost.style.width = QW + 'px';
    lane.appendChild(ghost);
    drag = { mode: 'new', lane, s0: s, s1: s, ghost, moved: false };
    bindDragMove();
  }
  // ダブルクリックでも1日分のバーを作れる（今までの作り方）
  function onLaneDblClick(e, lane) {
    if (e.target.closest('.kbar')) return;
    e.preventDefault();
    const before = snap();
    const day = Math.floor(slotAtClientX(lane, e.clientX) / SLOTS);
    const bar = { id: uid(), taskId: lane.dataset.task, startSlot: day * SLOTS, lenSlots: SLOTS, night: lane.dataset.night === '1', label: '' };
    state.bars.push(bar);
    recordUndo(before); changed(); render();
    selectedIds = new Set([bar.id]); applySelection(); openBarPop(bar);
  }
  function onBarDown(e, b, div) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (e.ctrlKey || e.metaKey) { if (selectedIds.has(b.id)) selectedIds.delete(b.id); else selectedIds.add(b.id); applySelection(); return; }
    if (!selectedIds.has(b.id)) { selectedIds = new Set([b.id]); applySelection(); }
    let mode = 'move';
    if (e.target.classList.contains('l')) mode = 'resize-l';
    else if (e.target.classList.contains('r')) mode = 'resize-r';
    const group = (mode === 'move') ? state.bars.filter((x) => selectedIds.has(x.id)).map((x) => ({ bar: x, origStart: x.startSlot })) : [{ bar: b, origStart: b.startSlot }];
    drag = { mode, primary: b, group, startX: e.clientX, startY: e.clientY, origLen: b.lenSlots, origStart: b.startSlot, div, moved: false, before: snap(), reassigned: false };
    bindDragMove();
  }
  function bindDragMove() { window.addEventListener('pointermove', onDragMove); window.addEventListener('pointerup', onDragUp, { once: true }); }
  function onDragMove(e) {
    if (!drag) return;
    if (drag.mode === 'new') {
      const s = slotAtClientX(drag.lane, e.clientX);
      if (s !== drag.s0) drag.moved = true;
      drag.s1 = s;
      const a = Math.min(drag.s0, s), z = Math.max(drag.s0, s);
      drag.ghost.style.left = (a * QW) + 'px'; drag.ghost.style.width = ((z - a + 1) * QW) + 'px';
      return;
    }
    const dSlots = Math.round((e.clientX - drag.startX) / QW);
    if (dSlots !== 0 || Math.abs(e.clientY - drag.startY) > 6) drag.moved = true;
    const total = state.days * SLOTS, b = drag.primary;
    if (drag.mode === 'move') { drag.group.forEach((g) => { g.bar.startSlot = clamp(g.origStart + dSlots, 0, total - g.bar.lenSlots); liveUpdate(g.bar); }); }
    else if (drag.mode === 'resize-r') { b.lenSlots = clamp(drag.origLen + dSlots, 1, total - b.startSlot); liveUpdate(b); }
    else if (drag.mode === 'resize-l') { const ns = clamp(drag.origStart + dSlots, 0, drag.origStart + drag.origLen - 1); b.lenSlots = drag.origStart + drag.origLen - ns; b.startSlot = ns; liveUpdate(b); }
  }
  function onDragUp(e) {
    window.removeEventListener('pointermove', onDragMove);
    const d = drag; drag = null;
    if (!d) return;
    if (d.mode === 'new') {
      d.ghost.remove();
      if (!d.moved) return;
      const before = snap();
      const a = Math.min(d.s0, d.s1), z = Math.max(d.s0, d.s1);
      const bar = { id: uid(), taskId: d.lane.dataset.task, startSlot: a, lenSlots: z - a + 1, night: d.lane.dataset.night === '1', label: '' };
      state.bars.push(bar);
      recordUndo(before); changed(); render();
      selectedIds = new Set([bar.id]); applySelection(); openBarPop(bar);
      return;
    }
    const b = d.primary;
    if (d.mode === 'move' && d.group.length === 1) {
      const lane = laneAtPoint(e.clientX, e.clientY);
      if (lane && (lane.dataset.task !== b.taskId || (!isMaster() && (lane.dataset.night === '1') !== !!b.night))) { b.taskId = lane.dataset.task; if (!isMaster()) b.night = lane.dataset.night === '1'; d.reassigned = true; }
    }
    const changedNow = (d.moved && (b.startSlot !== d.origStart || b.lenSlots !== d.origLen || d.group.some((g) => g.bar.startSlot !== g.origStart))) || d.reassigned;
    if (changedNow) { recordUndo(d.before); changed(); render(); return; }
    applySelection();
    if (!d.moved) openBarPop(b);   // つかんで動かさずに離した＝クリック → 文字・削除の小窓
  }
  function laneAtPoint(x, y) {
    const stack = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)]);
    for (const e2 of stack) { if (e2 && e2.classList && e2.classList.contains('klane')) return e2; }
    return null;
  }

  // ---- バーの小窓（文字・日中⇔夜間・削除） ----
  let pop = null;
  function closeBarPop() {
    if (!pop) return;
    const p = pop; pop = null;
    p.el.remove();
    document.removeEventListener('pointerdown', p.outside, true);
    const nv = (p.input.value || '').trim();
    const b = state && state.bars.find((x) => x.id === p.barId);
    if (b && nv !== (p.orig || '')) { b.label = nv; recordUndo(p.before); changed(); }
  }
  function openBarPop(b) {
    closeBarPop();
    const div = board.querySelector('.kbar[data-id="' + b.id + '"]'); if (!div) return;
    const r = div.getBoundingClientRect();
    const box = el('div', 'kbarpop');
    box.innerHTML = '<input type="text" class="kbp-in" placeholder="バーの文字（例：既設撤去）" list="taskSuggest">' +
      (isMaster() ? '' : '<button type="button" class="kbp-night"></button>') +
      '<button type="button" class="kbp-del">削除</button>';
    document.body.appendChild(box);
    const input = box.querySelector('.kbp-in'); input.value = b.label || '';
    const nb = box.querySelector('.kbp-night');
    if (nb) nb.textContent = b.night ? '🔵 日中にする' : '🔴 夜間にする';
    const w = box.offsetWidth || 360;
    box.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    box.style.top = Math.min(r.bottom + 6, window.innerHeight - 56) + 'px';
    const outside = (ev) => { if (!box.contains(ev.target)) closeBarPop(); };
    pop = { el: box, input, barId: b.id, orig: b.label || '', before: snap(), outside };
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    input.addEventListener('input', () => { const lb = board.querySelector('.kbar[data-id="' + b.id + '"] .klb'); if (lb) lb.textContent = input.value; });
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); if (ev.key === 'Escape') input.value = pop ? pop.orig : input.value; closeBarPop(); render(); } });
    if (nb) nb.addEventListener('click', () => { const before = pop.before; b.label = (input.value || '').trim(); pop.orig = b.label; closeBarPop(); b.night = !b.night; recordUndo(before); changed(); render(); selectedIds = new Set([b.id]); applySelection(); });
    box.querySelector('.kbp-del').addEventListener('click', () => { pop.input.value = pop.orig; closeBarPop(); deleteBars([b.id]); });
    input.focus(); input.select();
  }

  function deleteBars(ids) {
    if (!ids.length) return;
    recordUndo(snap());
    const set = new Set(ids);
    state.bars = state.bars.filter((x) => !set.has(x.id));
    ids.forEach((id) => selectedIds.delete(id));
    changed(); render();
  }
  function applySelection() {
    board.querySelectorAll('.kbar.sel').forEach((x) => x.classList.remove('sel'));
    selectedIds.forEach((id) => { const d = board.querySelector('.kbar[data-id="' + id + '"]'); if (d) d.classList.add('sel'); });
  }
  document.addEventListener('keydown', (e) => {
    if (!isActive()) return;
    const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size && !inField) { e.preventDefault(); deleteBars([...selectedIds]); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !inField) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y') && !inField) { e.preventDefault(); redo(); }
  });

  /* ============================================================
     戻す / 進む
     ============================================================ */
  let undoStack = [], redoStack = [];
  function snap() { return JSON.parse(JSON.stringify(state)); }
  function recordUndo(prev) { undoStack.push(prev); if (undoStack.length > 80) undoStack.shift(); redoStack = []; updateUndoButtons(); }
  function undo() { if (!undoStack.length) return; closeBarPop(); redoStack.push(snap()); state = undoStack.pop(); selectedIds = new Set(); changed(); syncToolbar(); render(); updateUndoButtons(); }
  function redo() { if (!redoStack.length) return; closeBarPop(); undoStack.push(snap()); state = redoStack.pop(); selectedIds = new Set(); changed(); syncToolbar(); render(); updateUndoButtons(); }
  function updateUndoButtons() { const u = $('#viewKotei #btnUndo'), rd = $('#viewKotei #btnRedo'); if (u) u.disabled = !undoStack.length; if (rd) rd.disabled = !redoStack.length; }
  $('#viewKotei #btnUndo').addEventListener('click', undo);
  $('#viewKotei #btnRedo').addEventListener('click', redo);

  /* ============================================================
     縮尺
     ============================================================ */
  const ZOOM_LS = 'koteiZoomV1';
  function setScale(v) { scale = clamp(Math.round(v * 100) / 100, 0.5, 2); try { localStorage.setItem(ZOOM_LS, String(scale)); } catch (e) {} render(); }
  $('#viewKotei #kZoomIn').addEventListener('click', () => setScale(scale + 0.25));
  $('#viewKotei #kZoomOut').addEventListener('click', () => setScale(scale - 0.25));
  $('#viewKotei #kZoomReset').addEventListener('click', () => setScale(1));
  (function () { try { const z = parseFloat(localStorage.getItem(ZOOM_LS)); if (z >= 0.5 && z <= 2) scale = z; } catch (e) {} })();

  /* ============================================================
     大きく表示（上の段・書類の情報を隠して、工程表を画面いっぱいに）
     ふだんも、工程表の欄は画面の下の端まで使う
     ============================================================ */
  const BIG_LS = 'koteiBigV1';
  function fitHeight() {
    const sc = $('#viewKotei #scroll'); if (!sc || !isActive()) return;
    const top = Math.round(sc.getBoundingClientRect().top + window.scrollY);
    document.documentElement.style.setProperty('--kscroll-top', top + 'px');
  }
  function setBig(on) {
    document.body.classList.toggle('kotei-big', !!on);
    const b = $('#viewKotei #kBig'); if (b) { b.textContent = on ? '✕ 元の大きさに戻す' : '⛶ 大きく表示'; b.classList.toggle('on', !!on); }
    try { localStorage.setItem(BIG_LS, on ? '1' : ''); } catch (e) {}
    requestAnimationFrame(fitHeight);
  }
  $('#viewKotei #kBig').addEventListener('click', () => setBig(!document.body.classList.contains('kotei-big')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('kotei-big') && isActive() && !pop && !document.querySelector('.sh-dlg-bg:not(.hidden)') && !(masterBg && masterBg.classList.contains('show'))) setBig(false);
  });
  window.addEventListener('resize', fitHeight);
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => fitHeight()); ['#appHeader', '#docTop', '#viewKotei .k-infobar', '#viewKotei .toolbar'].forEach((s) => { const e = document.querySelector(s); if (e) ro.observe(e); }); }

  /* ============================================================
     種類（通常 / ゼロ / マスター週 / マスター月）— 4つのボタンで切り替え
     ============================================================ */
  function kindKey() { return isMaster() ? ('master-' + (state.unit || 'week')) : state.kind; }
  function applyKindUI() {
    if (!state) return;
    document.querySelectorAll('#viewKotei #kKindSeg [data-kind]').forEach((b) => { const on = b.dataset.kind === kindKey(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    const lbl = $('#viewKotei #kDaysLbl'), unit = $('#viewKotei #kDaysUnit');
    const startCell = $('#viewKotei #startCell'), endCell = $('#viewKotei #endCell');
    if (isMaster()) { if (lbl) lbl.textContent = state.unit === 'month' ? '月数' : '週数'; if (unit) unit.textContent = state.unit === 'month' ? 'ヶ月' : '週'; startCell && startCell.classList.add('hidden'); endCell && endCell.classList.add('hidden'); }
    else if (state.kind === 'zero') { if (lbl) lbl.textContent = '日数'; if (unit) unit.textContent = '日'; startCell && startCell.classList.add('hidden'); endCell && endCell.classList.add('hidden'); }
    else { if (lbl) lbl.textContent = '工期'; if (unit) unit.textContent = '日'; startCell && startCell.classList.remove('hidden'); endCell && endCell.classList.remove('hidden'); }
  }
  $('#viewKotei #kKindSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-kind]'); if (!btn || !state || btn.dataset.kind === kindKey()) return;
    recordUndo(snap());
    const v = btn.dataset.kind;
    if (v === 'master-week') { state.kind = 'master'; state.unit = 'week'; }
    else if (v === 'master-month') { state.kind = 'master'; state.unit = 'month'; }
    else { state.kind = v; }
    if (isMaster()) state.bars.forEach((b) => { b.night = false; });
    const total = state.days * slotsPer();
    state.bars.forEach((b) => { b.startSlot = clamp(b.startSlot, 0, total - 1); b.lenSlots = clamp(b.lenSlots, 1, total - b.startSlot); });
    changed(); applyKindUI(); updateEndLabel(); render();
  });

  /* ============================================================
     作業（縦軸）編集・マスター
     ============================================================ */
  function editTaskName(task, nameEl, isNew) {
    const before = isNew ? null : snap();
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = task.name; inp.className = 'kname-in';
    inp.setAttribute('list', 'taskSuggest');
    nameEl.replaceWith(inp); inp.focus(); inp.select();
    let committed = false;
    const done = () => { if (committed) return; committed = true; const nv = inp.value.trim() || task.name; if (nv !== task.name) { if (before) recordUndo(before); task.name = nv; changed(); } render(); };
    inp.addEventListener('blur', done);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } else if (e.key === 'Escape') { inp.value = task.name; inp.blur(); } });
  }
  function reorderTask(dragId, targetId) {
    if (dragId === targetId) return;
    const arr = state.tasks; const from = arr.findIndex((t) => t.id === dragId), to = arr.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    recordUndo(snap());
    const [m] = arr.splice(from, 1); arr.splice(to, 0, m); changed(); render();
  }
  const masterBg = $('#masterBg');
  function openMaster() { buildMaster(); masterBg.classList.add('show'); }
  function buildMaster() {
    const list = $('#mlist'); list.innerHTML = '';
    state.tasks.forEach((t, i) => {
      const row = el('div', 'mrow');
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = t.name; inp.setAttribute('list', 'taskSuggest');
      inp.addEventListener('change', () => { recordUndo(snap()); t.name = inp.value.trim() || t.name; changed(); render(); });
      const up = mbtn('▲', () => move(i, -1)), dn = mbtn('▼', () => move(i, 1)), del = mbtn('✕', () => {
        if (state.bars.some((b) => b.taskId === t.id) && !confirm('この作業のバーも削除されます。よろしいですか？')) return;
        recordUndo(snap()); state.bars = state.bars.filter((b) => b.taskId !== t.id); state.tasks.splice(i, 1); changed(); render(); buildMaster();
      }); del.style.color = '#b91c1c';
      row.append(inp, up, dn, del); list.appendChild(row);
    });
    function move(i, d) { const j = i + d; if (j < 0 || j >= state.tasks.length) return; recordUndo(snap()); const a = state.tasks;[a[i], a[j]] = [a[j], a[i]]; changed(); render(); buildMaster(); }
  }
  function mbtn(txt, fn) { const b = el('button', 'ic'); b.textContent = txt; b.addEventListener('click', fn); return b; }
  $('#mAddBtn').addEventListener('click', addTask);
  $('#mAdd').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } });
  function addTask() { const v = $('#mAdd').value.trim(); if (!v) return; recordUndo(snap()); state.tasks.push({ id: uid(), name: v }); $('#mAdd').value = ''; changed(); render(); buildMaster(); }
  $('#mClose').addEventListener('click', () => masterBg.classList.remove('show'));
  $('#mRestore').addEventListener('click', () => { if (!confirm('縦軸を標準セットに戻します（バーは保持）。よろしいですか？')) return; recordUndo(snap()); state.tasks = DEFAULT_TASKS.map((n) => ({ id: uid(), name: n })); changed(); render(); buildMaster(); });
  masterBg.addEventListener('click', (e) => { if (e.target === masterBg) masterBg.classList.remove('show'); });
  $('#viewKotei #btnMaster').addEventListener('click', openMaster);

  /* ============================================================
     書類の情報・特記事項
     ============================================================ */
  function updateEndLabel() { const e = $('#viewKotei #kEnd'); if (e) e.textContent = (state && hasCalendar()) ? fmtJp(endDateIso()) : '―'; }
  let fieldBefore = null;
  function bindField(id, prop, opts) {
    opts = opts || {};
    const inp = $('#viewKotei #' + id); if (!inp) return;
    inp.addEventListener('focus', () => { fieldBefore = snap(); });
    inp.addEventListener('input', (e) => {
      if (!state) return;
      let v = e.target.value;
      if (opts.num) { v = parseInt(v, 10); if (isNaN(v) || v < 1) v = 1; if (v > 370) v = 370; }
      if (opts.date && !v) return;
      state[prop] = v;
      changed();
      if (opts.render) { render(); updateEndLabel(); }
    });
    inp.addEventListener('change', () => {
      if (opts.num) { $('#viewKotei #' + id).value = state[prop]; render(); updateEndLabel(); }
      if (fieldBefore && JSON.stringify(fieldBefore) !== JSON.stringify(state)) recordUndo(fieldBefore);
      fieldBefore = null;
    });
  }
  bindField('kContent', 'content'); bindField('kNotes', 'notes');
  bindField('start', 'start', { render: true, date: true }); bindField('days', 'days', { num: true, render: true });

  // 作成者（担当者）・客先 は案件管理のマスタから選ぶ
  function bridge() { return window.CINEMA_DB || {}; }
  function sbClient() { return (window.CINEMA_DB && window.CINEMA_DB.mode && window.CINEMA_DB.mode() === 'supabase') ? window.CINEMA_DB.client() : null; }
  let companyOfficial = {}; // 会社名 -> 正式名称（kotei側で直接取得・app.jsのキャッシュに依存しない）
  let officialLoaded = false;
  async function loadCompanyOfficial() {
    companyOfficial = {};
    const sb = sbClient();
    if (sb) {
      try { const { data } = await sb.from('companies').select('name,official_name'); (data || []).forEach((c) => { if (c.official_name) companyOfficial[c.name] = c.official_name; }); }
      catch (e) {}
    }
    try { ((bridge().companies && bridge().companies()) || []).forEach((c) => { if (c.officialName && !companyOfficial[c.name]) companyOfficial[c.name] = c.officialName; }); } catch (e) {}
    officialLoaded = true;
  }
  function officialClientName() {
    if (!state || !state.client) return '';
    if (companyOfficial[state.client]) return companyOfficial[state.client];
    try { const list = (bridge().companies && bridge().companies()) || []; const f = list.find((c) => c.name === state.client); if (f && f.officialName) return f.officialName; } catch (e) {}
    return state.client;
  }
  function fillSelect(id, items, current) {
    const sel = $('#viewKotei #' + id); if (!sel) return;
    const opts = ['（未選択）'].concat(items);
    if (current && opts.indexOf(current) < 0) opts.push(current); // 旧データ保持
    sel.innerHTML = '';
    opts.forEach((v) => { const o = document.createElement('option'); o.value = (v === '（未選択）' ? '' : v); o.textContent = v; sel.appendChild(o); });
    sel.value = current || '';
  }
  function populateMasters() {
    if (!state) return;
    let teams = [], comps = [];
    try { teams = (bridge().teams && bridge().teams()) || []; } catch (e) {}
    try { comps = ((bridge().companies && bridge().companies()) || []).map((c) => c.name); } catch (e) {}
    fillSelect('kAuthor', teams, state.author);
    fillSelect('kClient', comps, state.client);
  }
  $('#viewKotei #kAuthor').addEventListener('change', (e) => { if (!state) return; recordUndo(snap()); state.author = e.target.value; changed(); });
  $('#viewKotei #kClient').addEventListener('change', (e) => { if (!state) return; recordUndo(snap()); state.client = e.target.value; changed(); });
  $('#viewKotei #btnClear').addEventListener('click', () => { if (!state) return; if (confirm('この工程表のバーをすべて消去します。縦軸・設定は残ります。よろしいですか？\n（↶ 戻す で元に戻せます）')) { recordUndo(snap()); state.bars = []; selectedIds = new Set(); changed(); render(); } });

  /* ---- 印刷 ---- */
  function print() {
    closeBarPop();
    fillPrintHead(); document.body.classList.add('kotei-printing');
    const cleanup = () => { document.body.classList.remove('kotei-printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 50);
  }
  function fillPrintHead() {
    if (!state) return;
    const set = (id, v) => { const e = $('#viewKotei #' + id); if (e) e.textContent = v || ''; };
    const typeLabel = isMaster() ? ('マスター工程表（' + (state.unit === 'month' ? '月' : '週') + '）') : (state.kind === 'zero' ? 'ゼロ工程表' : '工事工程表');
    set('phType', typeLabel);
    set('phName', state.title); set('phContent', state.content);
    set('phStart', hasCalendar() ? fmtJp(state.start) : '―'); set('phEnd', hasCalendar() ? fmtJp(endDateIso()) : '―');
    set('phClient', officialClientName()); set('phAuthor', state.author);
  }

  /* ============================================================
     読み込み（どの工程表を開くかは書類棚が決める）
     ============================================================ */
  function normalize(o) {
    o = JSON.parse(JSON.stringify(o || {})); const old = !o.v; o.v = 2;
    o.kind = o.kind || 'date'; o.unit = o.unit || 'week';
    o.title = o.title || ''; o.content = o.content || ''; o.start = o.start || isoToday(); o.days = o.days || 21;
    o.author = o.author || ''; o.client = o.client || ''; o.notes = o.notes || '';
    delete o.versions;   // 「版」はやめた（上書き保存／名前を付けて新規に保存だけにした）
    o.tasks = (o.tasks || []).map((t) => ({ id: t.id || uid(), name: t.name || '' }));
    o.bars = (o.bars || []).map((b) => {
      let startSlot = b.startSlot | 0, lenSlots = Math.max(1, b.lenSlots | 0);
      let night = (b.night !== undefined) ? !!b.night : (b.kind === 'night');
      if (old) { startSlot *= 2; lenSlots *= 2; }
      return { id: b.id || uid(), taskId: b.taskId, startSlot, lenSlots, night, label: b.label || '' };
    });
    return o;
  }
  function syncToolbar() {
    if (!state) return;
    $('#viewKotei #kContent').value = state.content || '';
    $('#viewKotei #start').value = state.start;
    $('#viewKotei #days').value = state.days;
    $('#viewKotei #kNotes').value = state.notes || '';
    populateMasters();
    applyKindUI(); updateEndLabel();
  }
  function changed() { if (hooks.onChange && state) hooks.onChange(); }
  // 1枚を開く。h.onChange は「何か変わった」ときに呼ばれる（保存は書類棚が行う）
  function load(st, h) {
    closeBarPop();
    hooks = h || {};
    state = normalize(st || defaultState());
    selectedIds = new Set(); undoStack = []; redoStack = []; updateUndoButtons();
    syncToolbar(); render();
    let big = false; try { big = localStorage.getItem(BIG_LS) === '1'; } catch (e) {}
    setBig(big);   // 前回「大きく表示」にしていたら、そのまま大きく
    if (!officialLoaded) loadCompanyOfficial().then(() => { if (state) syncToolbar(); }).catch(() => {});
  }
  function getState() { return state ? JSON.parse(JSON.stringify(state)) : null; }
  function setTitle(t) { if (state) state.title = t; }
  // 書類棚の一覧に出す「期間」の説明
  function summary(o) {
    o = o || {};
    const k = o.kind || 'date', days = o.days || 0;
    if (k === 'master') return 'マスター工程・' + days + (o.unit === 'month' ? 'ヶ月' : '週');
    if (k === 'zero') return 'ゼロ工程表・' + days + '日';
    if (!o.start) return days + '日';
    const a = parseISO(o.start), z = parseISO(addDaysIso(o.start, Math.max(0, days - 1)));
    return (a.getMonth() + 1) + '/' + a.getDate() + '〜' + (z.getMonth() + 1) + '/' + z.getDate() + '（' + days + '日）';
  }

  /* ---- util ---- */
  function el(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function isActive() { const v = document.getElementById('viewKotei'); return v && !v.classList.contains('hidden'); }
  (function () { const dl = $('#taskSuggest'); if (dl) TASK_SUGGEST.forEach((n) => { const o = document.createElement('option'); o.value = n; dl.appendChild(o); }); })();
  $('#viewKotei #scroll').addEventListener('pointerdown', (e) => { if (e.target.id === 'scroll' || e.target.id === 'board') { selectedIds = new Set(); applySelection(); } });

  /* ============================================================
     Excel(.xlsx) 出力
     ============================================================ */
  function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  // Web の工程表と同じ線にする:
  //   1日の区切り＝太い黒線／1日の1/4＝細い薄い線／日中と夜間の間＝薄い点線／作業と作業の間＝細い灰色の線／外まわり＝太線
  //   バーの中には線を引かない（Web ではバーが線の上に乗っている）。結合したセルは全部のセルに枠を付ける（付けないと線が欠ける）
  const XL = {
    dayLine: { s: 'medium', c: 'FF333333' }, qLine: { s: 'thin', c: 'FFD3D8E0' }, laneLine: { s: 'dashed', c: 'FFC9CFD8' },
    taskLine: { s: 'thin', c: 'FF8A93A0' }, outer: { s: 'medium', c: 'FF333333' }, grid: { s: 'thin', c: 'FF9AA3AF' },
    blue: 'FF2F6FED', red: 'FFE23B3B', weekend: 'FFFDEAEA', head: 'FFEEF1F5', today: 'FFFFF6D6'
  };
  function exportExcel() {
    if (!state || typeof JSZip === 'undefined') { alert('Excel出力に必要な機能が読み込まれていません。'); return; }
    const slots = slotsPer(), cols = state.days, totalCols = 1 + cols * slots, master = isMaster();
    // ---- スタイル（必要な組み合わせだけ作る） ----
    const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = [], xfs = [];
    const idx = (arr, x) => { let i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1; } return i; };
    const fontXml = (f) => '<font>' + (f.b ? '<b/>' : '') + '<sz val="' + (f.sz || 10) + '"/>' + (f.color ? '<color rgb="' + f.color + '"/>' : '') + '<name val="ＭＳ Ｐゴシック"/><family val="3"/><charset val="128"/></font>';
    const edge = (tag, e) => e ? '<' + tag + ' style="' + e.s + '"><color rgb="' + e.c + '"/></' + tag + '>' : '<' + tag + '/>';
    idx(fonts, fontXml({})); idx(borders, '<border><left/><right/><top/><bottom/><diagonal/></border>'); xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
    const xfMap = {};
    function sid(o) {
      const key = JSON.stringify(o); if (xfMap[key] != null) return xfMap[key];
      const fontId = idx(fonts, fontXml(o.font || {}));
      const fillId = o.fill ? idx(fills, '<fill><patternFill patternType="solid"><fgColor rgb="' + o.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0;
      const bd = o.bd || {};
      const borderId = idx(borders, '<border>' + edge('left', bd.l) + edge('right', bd.r) + edge('top', bd.t) + edge('bottom', bd.b) + '<diagonal/></border>');
      const al = '<alignment horizontal="' + (o.h || 'general') + '" vertical="' + (o.v || 'center') + '"' + (o.wrap ? ' wrapText="1"' : '') + (o.shrink ? ' shrinkToFit="1"' : '') + (o.indent ? ' indent="' + o.indent + '"' : '') + '/>';
      xfs.push('<xf numFmtId="0" fontId="' + fontId + '" fillId="' + fillId + '" borderId="' + borderId + '" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + al + '</xf>');
      xfMap[key] = xfs.length - 1; return xfMap[key];
    }
    // ---- セル ----
    const cells = {}, merges = [], heights = {};
    const put = (r, c, t, st) => { cells[r + ':' + c] = { r, c, t: t == null ? '' : String(t), s: sid(st || {}) }; };
    // 結合セル: 全部のセルに、外まわりの枠を付ける
    function block(r1, c1, r2, c2, text, st, bd) {
      bd = bd || {};
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
        const b = { l: c === c1 ? bd.l : null, r: c === c2 ? bd.r : null, t: r === r1 ? bd.t : null, b: r === r2 ? bd.b : null };
        put(r, c, (r === r1 && c === c1) ? text : '', Object.assign({}, st, { bd: b }));
      }
      if (r1 !== r2 || c1 !== c2) merges.push(colLetter(c1) + r1 + ':' + colLetter(c2) + r2);
    }
    const G = XL.grid, O = XL.outer, all = (e) => ({ l: e, r: e, t: e, b: e });

    let r = 1;
    // 表題（印刷の見出しと同じ）
    const typeLabel = master ? ('マスター工程表（' + (state.unit === 'month' ? '月' : '週') + '）') : (state.kind === 'zero' ? 'ゼロ工程表' : '工事工程表');
    block(r, 1, r, totalCols, typeLabel, { font: { b: 1, sz: 18 }, h: 'center' }, { b: O }); heights[r] = 32; r++;
    block(r, 1, r, totalCols, state.title || '', { font: { b: 1, sz: 13 }, h: 'center' }); heights[r] = 22; r++;
    r++;
    // 書類の情報（ラベル／値を2組。結合して文字が切れないように）
    const half = 1 + Math.max(2, Math.floor((totalCols - 1) / 2));
    const lblW = Math.max(2, Math.min(6, Math.floor((totalCols - half) / 4)));
    const meta = [
      ['工事内容', state.content || '', hasCalendar() ? '着工日' : '種類', hasCalendar() ? fmtJp(state.start) : kindLabel()],
      ['施主', officialClientName(), hasCalendar() ? '竣工日' : '期間', hasCalendar() ? fmtJp(endDateIso()) : (state.days + (master ? (state.unit === 'month' ? 'ヶ月' : '週') : '日間'))],
      ['施工会社', '菱熱工業株式会社', '作成者', state.author || '']
    ];
    const metaTop = r;
    meta.forEach((m, i) => {
      const top = i === 0 ? O : G, bot = i === meta.length - 1 ? O : G;
      block(r, 1, r, 1, m[0], { font: { b: 1 }, fill: XL.head, h: 'center' }, { l: O, r: G, t: top, b: bot });
      block(r, 2, r, half - 1, m[1], { h: 'left', shrink: 1, indent: 1 }, { l: G, r: G, t: top, b: bot });
      block(r, half, r, half + lblW - 1, m[2], { font: { b: 1 }, fill: XL.head, h: 'center' }, { l: G, r: G, t: top, b: bot });
      block(r, half + lblW, r, totalCols, m[3], { h: 'left', shrink: 1, indent: 1 }, { l: G, r: O, t: top, b: bot });
      heights[r] = 19; r++;
    });
    // 凡例
    if (!master) { block(r, 1, r, totalCols, '', { font: { sz: 9, color: 'FF374151' }, h: 'right' }); cells[r + ':1'].rich = [['■', XL.blue], [' 青のバー＝日中　　', null], ['■', XL.red], [' 赤のバー＝夜間　　', null], ['■', 'FFF5B5B5'], [' 土日祝', null]]; heights[r] = 16; }
    r++;

    // ---- 日付の行 ----
    const dateRow = r;
    const wkOf = (i) => hasCalendar() && (dayInfo(i).isWeekend || dayInfo(i).isHoliday);
    block(r, 1, r, 1, '作業内容', { font: { b: 1 }, fill: XL.head, h: 'center' }, { l: O, r: O, t: O, b: O });
    for (let i = 0; i < cols; i++) {
      const c0 = 2 + i * slots, wk = wkOf(i);
      let label;
      if (hasCalendar()) { const di = dayInfo(i); label = di.md + '(' + di.dowName + ')'; } else label = periodLabel(i);
      block(r, c0, r, c0 + slots - 1, label, { font: { b: 1, sz: 10, color: wk ? 'FFC0392B' : null }, fill: wk ? XL.weekend : XL.head, h: 'center', shrink: 1 },
        { l: XL.dayLine, r: i === cols - 1 ? O : XL.dayLine, t: O, b: O });
    }
    heights[r] = 22; r++;

    // ---- 作業の行（1作業＝日中・夜間の2段。各段は「文字の行」と「バーの行」） ----
    const lanes = master ? [false] : [false, true];
    const rowsPer = lanes.length * 2;
    state.tasks.forEach((task, ti) => {
      const base = r, lastTask = ti === state.tasks.length - 1;
      const taskBottom = lastTask ? O : XL.taskLine;
      block(base, 1, base + rowsPer - 1, 1, task.name, { font: { b: 1, sz: 10 }, fill: 'FFF7F9FB', h: 'left', wrap: 1, indent: 1 }, { l: O, r: O, t: null, b: taskBottom });
      // 各スロットのバー（どのセルを塗るか）
      const fillAt = {};   // 'row:col' → 色
      const labels = [];
      state.bars.filter((b) => b.taskId === task.id).forEach((b) => {
        const li = master ? 0 : (b.night ? 1 : 0);
        const lblRow = base + li * 2, barRow = lblRow + 1;
        if (b.startSlot >= cols * slots) return;   // 工期を短くして、表の外に出たバーは書かない
        for (let k = 0; k < b.lenSlots && b.startSlot + k < cols * slots; k++) fillAt[barRow + ':' + (2 + b.startSlot + k)] = (!master && b.night) ? XL.red : XL.blue;
        if (b.label) labels.push({ r: lblRow, c: 2 + b.startSlot, t: b.label, night: !master && b.night });
      });
      for (let rr = 0; rr < rowsPer; rr++) {
        const row = base + rr, isBarRow = rr % 2 === 1, laneEnd = isBarRow;
        const bottom = rr === rowsPer - 1 ? taskBottom : (laneEnd ? XL.laneLine : null);
        heights[row] = isBarRow ? 10 : 14;
        for (let i = 0; i < cols; i++) {
          const wk = wkOf(i);
          for (let q = 0; q < slots; q++) {
            const c = 2 + i * slots + q;
            const lastCol = c === totalCols;
            const color = fillAt[row + ':' + c];
            // 右の線: 1日の区切りは太線、1/4 は細線。バーの中（右隣もバー）は線を引かない
            let right = q === slots - 1 ? (lastCol ? O : XL.dayLine) : XL.qLine;
            if (color && fillAt[row + ':' + (c + 1)] && !lastCol) right = null;
            put(row, c, '', { fill: color || (wk ? XL.weekend : null), bd: { l: null, r: right, t: null, b: bottom } });
          }
        }
      }
      // バーの文字（バーの上の行。文字が長くても右の空いたセルにはみ出して見える）
      labels.forEach((lb) => { const cell = cells[lb.r + ':' + lb.c]; const st = JSON.parse(JSON.stringify(xfKeyOf(cell.s))); st.font = { sz: 9, b: 1, color: lb.night ? 'FF7A1F1F' : 'FF1F2733' }; st.h = 'left'; put(lb.r, lb.c, lb.t, st); });
      r += rowsPer;
    });
    if (!state.tasks.length) r++;
    r++;
    // 特記事項
    block(r, 1, r, 1, '特記事項', { font: { b: 1 }, fill: XL.head, h: 'center' }, all(O));
    block(r, 2, r, totalCols, state.notes || '', { h: 'left', v: 'top', wrap: 1, indent: 1 }, { l: G, r: O, t: O, b: O });
    heights[r] = 54;
    const lastRow = r;
    function xfKeyOf(s) { const k = Object.keys(xfMap).find((key) => xfMap[key] === s); return k ? JSON.parse(k) : {}; }

    // ---- シートの XML ----
    const byRow = {};
    Object.keys(cells).forEach((k) => { const c = cells[k]; (byRow[c.r] = byRow[c.r] || []).push(c); });
    let sheetRows = '';
    for (let rr = 1; rr <= lastRow; rr++) {
      const list = (byRow[rr] || []).sort((a, b) => a.c - b.c);
      const hAttr = heights[rr] ? ' ht="' + heights[rr] + '" customHeight="1"' : '';
      sheetRows += '<row r="' + rr + '"' + hAttr + '>' + list.map((cell) => {
        const ref = colLetter(cell.c) + rr, sAttr = cell.s ? ' s="' + cell.s + '"' : '';
        if (cell.rich) return '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is>' + cell.rich.map(([tx, col]) => '<r><rPr><sz val="9"/>' + (col ? '<color rgb="' + col + '"/>' : '<color rgb="FF374151"/>') + '<rFont val="ＭＳ Ｐゴシック"/></rPr><t xml:space="preserve">' + xmlEsc(tx) + '</t></r>').join('') + '</is></c>';
        return cell.t !== '' ? '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(cell.t) + '</t></is></c>' : '<c r="' + ref + '"' + sAttr + '/>';
      }).join('') + '</row>';
    }
    const mergeXml = merges.length ? '<mergeCells count="' + merges.length + '">' + merges.map((m) => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>' : '';
    const slotW = master ? (state.unit === 'month' ? 12 : 10) : 2.4;
    const colsXml = '<cols><col min="1" max="1" width="20" customWidth="1"/><col min="2" max="' + totalCols + '" width="' + slotW + '" customWidth="1"/></cols>';
    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:' + colLetter(totalCols) + lastRow + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100"><pane xSplit="1" ySplit="' + dateRow + '" topLeftCell="B' + (dateRow + 1) + '" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' + colsXml + '<sheetData>' + sheetRows + '</sheetData>' + mergeXml +
      '<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>' +
      '<pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts><fills count="' + fills.length + '">' + fills.join('') + '</fills>' +
      '<borders count="' + borders.length + '">' + borders.join('') + '</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    // 印刷の時、日付の行までを毎ページの上に出す
    const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="工程表" sheetId="1" r:id="rId1"/></sheets>' +
      '<definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">\'工程表\'!$' + dateRow + ':$' + dateRow + '</definedName></definedNames></workbook>';
    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    const zip = new JSZip();
    zip.file('[Content_Types].xml', ct); zip.file('_rels/.rels', rels);
    zip.file('xl/workbook.xml', wb); zip.file('xl/_rels/workbook.xml.rels', wbRels);
    zip.file('xl/styles.xml', styles); zip.file('xl/worksheets/sheet1.xml', sheet);
    zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }).then((blob) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (state.title || '工程表').replace(/[\\/:*?"<>|\s]+/g, '_') + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
  }
  function kindLabel() { return isMaster() ? ('マスター工程（' + (state.unit === 'month' ? '月' : '週') + '）') : (state.kind === 'zero' ? 'ゼロ工程表' : '通常'); }

  function excel() { try { exportExcel(); } catch (err) { alert('Excel出力に失敗しました：' + (err.message || err)); } }

  /* ============================================================
     公開API（書類棚 shelf.js から使う）
     ============================================================ */
  // 書類棚に戻る時は「大きく表示」を解く（上の段が隠れたままにならないように。次に開くと元どおり大きく）
  function leave() { closeBarPop(); document.body.classList.remove('kotei-big'); }
  window.KOTEI = { load, getState, setTitle, render, print, excel, normalize, defaultState, summary, closePop: closeBarPop, leave };
})();
