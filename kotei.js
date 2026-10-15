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
  function rowsPerTask() { return isMaster() ? 2 : 4; }   // Excel 出力の行数（文字の行＋バーの行）
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
  function exportExcel() {
    if (!state || typeof JSZip === 'undefined') { alert('Excel出力に必要な機能が読み込まれていません。'); return; }
    const slots = slotsPer(), cols = state.days, totalCols = 1 + cols * slots, nRows = rowsPerTask();
    const cellMap = {}, merges = [], rowMeta = [];
    const setH = (r, h) => { rowMeta[r] = { h }; };
    const put = (r, c, t, s) => { cellMap[r + ':' + c] = { r, c, t, s }; };
    const S = { title: 1, meta: 2, metaVal: 3, header: 4, headerWk: 5, time: 6, name: 7, detail: 8, day: 9, night: 10, wk: 11, notes: 12, grid: 13 };

    let r = 1;
    put(r, 1, state.title || '工程表', S.title); merges.push('A' + r + ':' + colLetter(totalCols) + r); setH(r, 36); r++;
    const half = Math.max(3, Math.ceil(totalCols / 2));
    put(r, 1, '工事名', S.meta); put(r, 2, state.title || '', S.metaVal);
    put(r, half, hasCalendar() ? '着工日' : '種類', S.meta); put(r, half + 1, hasCalendar() ? fmtJp(state.start) : kindLabel(), S.metaVal); r++;
    put(r, 1, '工事内容', S.meta); put(r, 2, state.content || '', S.metaVal);
    put(r, half, hasCalendar() ? '竣工日' : '期間', S.meta); put(r, half + 1, hasCalendar() ? fmtJp(endDateIso()) : (state.days + (isMaster() ? (state.unit === 'month' ? 'ヶ月' : '週') : '日間')), S.metaVal); r++;
    put(r, 1, '施主', S.meta); put(r, 2, officialClientName(), S.metaVal); put(r, half, '作成者', S.meta); put(r, half + 1, state.author || '', S.metaVal); r++;
    put(r, 1, '施工会社', S.meta); put(r, 2, '菱熱工業株式会社', S.metaVal); r++;
    r++;

    const dateRow = r;
    put(dateRow, 1, '作業内容', S.header);
    for (let i = 0; i < cols; i++) {
      const c0 = 2 + i * slots; let label, wk = false;
      if (hasCalendar()) { const di = dayInfo(i); label = di.md + '(' + di.dowName + ')'; wk = di.isWeekend || di.isHoliday; }
      else label = periodLabel(i);
      const stl = wk ? S.headerWk : S.header;
      put(dateRow, c0, label, stl);
      for (let q = 1; q < slots; q++) put(dateRow, c0 + q, '', stl);
      if (slots > 1) merges.push(colLetter(c0) + dateRow + ':' + colLetter(c0 + slots - 1) + dateRow);
    }
    setH(dateRow, 22); r++;
    const timeRow = dateRow; // 時刻行は廃止（凍結はヘッダー行で行う）

    state.tasks.forEach((task) => {
      const base = r;
      put(base, 1, task.name, S.name); merges.push('A' + base + ':A' + (base + nRows - 1));
      for (let i = 0; i < cols; i++) {
        const wk = hasCalendar() && (dayInfo(i).isWeekend || dayInfo(i).isHoliday);
        for (let q = 0; q < slots; q++) { const c = 2 + i * slots + q; for (let rr = 0; rr < nRows; rr++) put(base + rr, c, '', wk ? S.wk : S.grid); }
      }
      state.bars.filter((b) => b.taskId === task.id).forEach((b) => {
        const night = isMaster() ? false : !!b.night;
        const detRow = base + (night ? 2 : 0), barRow = base + (night ? 3 : 1), cStart = 2 + b.startSlot;
        for (let kk = 0; kk < b.lenSlots; kk++) put(barRow, cStart + kk, '', night ? S.night : S.day);
        if (b.label) put(detRow, cStart, b.label, S.detail);
      });
      for (let rr = 0; rr < nRows; rr++) setH(base + rr, 16);
      r += nRows;
    });

    r++;
    put(r, 1, '特記事項', S.meta); put(r, 2, state.notes || '', S.notes); merges.push(colLetter(2) + r + ':' + colLetter(totalCols) + r); setH(r, 60);
    const lastRow = r;

    const byRow = {};
    Object.keys(cellMap).forEach((kk) => { const cell = cellMap[kk]; if (cell.t === '' && (cell.s === 0 || cell.s == null)) return; (byRow[cell.r] = byRow[cell.r] || []).push(cell); });
    let sheetRows = '';
    for (let rr = 1; rr <= lastRow; rr++) {
      const list = (byRow[rr] || []).sort((a, b) => a.c - b.c);
      const hAttr = rowMeta[rr] ? ' ht="' + rowMeta[rr].h + '" customHeight="1"' : '';
      let rowXml = '<row r="' + rr + '"' + hAttr + '>';
      list.forEach((cell) => {
        const ref = colLetter(cell.c) + rr, sAttr = cell.s ? ' s="' + cell.s + '"' : '';
        if (cell.t !== '') rowXml += '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(cell.t) + '</t></is></c>';
        else rowXml += '<c r="' + ref + '"' + sAttr + '/>';
      });
      rowXml += '</row>'; sheetRows += rowXml;
    }
    const mergeXml = merges.length ? '<mergeCells count="' + merges.length + '">' + merges.map((m) => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>' : '';
    const colsXml = '<cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="' + totalCols + '" width="3.2" customWidth="1"/></cols>';
    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:' + colLetter(totalCols) + lastRow + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" view="pageBreakPreview"><pane xSplit="1" ySplit="' + timeRow + '" topLeftCell="' + colLetter(2) + (timeRow + 1) + '" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' + colsXml + '<sheetData>' + sheetRows + '</sheetData>' + mergeXml +
      '<pageSetup orientation="landscape" paperSize="8" fitToWidth="1" fitToHeight="0"/></worksheet>';
    const styles = buildStyles();
    const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="工程表" sheetId="1" r:id="rId1"/></sheets></workbook>';
    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    const zip = new JSZip();
    zip.file('[Content_Types].xml', ct); zip.file('_rels/.rels', rels);
    zip.file('xl/workbook.xml', wb); zip.file('xl/_rels/workbook.xml.rels', wbRels);
    zip.file('xl/styles.xml', styles); zip.file('xl/worksheets/sheet1.xml', sheet);
    zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }).then((blob) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (state.title || '工程表').replace(/\s+/g, '_') + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
  }
  function kindLabel() { return isMaster() ? ('マスター工程（' + (state.unit === 'month' ? '月' : '週') + '）') : (state.kind === 'zero' ? 'ゼロ工程表' : '通常'); }
  function buildStyles() {
    const fonts = '<fonts count="4">' +
      '<font><sz val="11"/><name val="ＭＳ Ｐゴシック"/></font>' +
      '<font><b/><sz val="11"/><name val="ＭＳ Ｐゴシック"/></font>' +
      '<font><b/><sz val="18"/><name val="ＭＳ Ｐゴシック"/></font>' +
      '<font><b/><sz val="9"/><color rgb="FFFFFFFF"/><name val="ＭＳ Ｐゴシック"/></font></fonts>';
    const fills = '<fills count="6">' +
      '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEEF1F5"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF2F6FED"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFE23B3B"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFDEAEA"/></patternFill></fill></fills>';
    const borders = '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFCCCCCC"/></left><right style="thin"><color rgb="FFCCCCCC"/></right><top style="thin"><color rgb="FFCCCCCC"/></top><bottom style="thin"><color rgb="FFCCCCCC"/></bottom></border></borders>';
    const xf = (fontId, fillId, opts) => {
      opts = opts || {};
      const align = opts.align ? '<alignment horizontal="' + opts.align + '" vertical="' + (opts.valign || 'center') + '"' + (opts.wrap ? ' wrapText="1"' : '') + '/>' : '<alignment vertical="center"/>';
      return '<xf numFmtId="0" fontId="' + fontId + '" fillId="' + fillId + '" borderId="' + (opts.border ? 1 : 0) + '" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + align + '</xf>';
    };
    const cellXfs = '<cellXfs count="14"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      xf(2, 0, { align: 'center' }) + xf(1, 2, { align: 'center', border: 1 }) + xf(0, 0, { align: 'left', border: 1 }) +
      xf(1, 2, { align: 'center', border: 1 }) + xf(1, 5, { align: 'center', border: 1 }) + xf(0, 0, { align: 'left', border: 1 }) +
      xf(1, 0, { align: 'left', wrap: true, border: 1 }) + xf(0, 0, { align: 'left', border: 1 }) +
      xf(3, 3, { align: 'center', border: 1 }) + xf(3, 4, { align: 'center', border: 1 }) + xf(0, 5, { border: 1 }) +
      xf(0, 0, { align: 'left', wrap: true, valign: 'top', border: 1 }) + xf(0, 0, { border: 1 }) + '</cellXfs>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      fonts + fills + borders + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' + cellXfs +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  function excel() { try { exportExcel(); } catch (err) { alert('Excel出力に失敗しました：' + (err.message || err)); } }

  /* ============================================================
     公開API（書類棚 shelf.js から使う）
     ============================================================ */
  window.KOTEI = { load, getState, setTitle, render, print, excel, normalize, defaultState, summary, closePop: closeBarPop };
})();
