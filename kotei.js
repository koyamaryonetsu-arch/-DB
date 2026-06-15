"use strict";
/* ============================================================
   工程表（ガントチャート）  ―  シネマ案件管理アプリ統合版
   ・別IIFEで app.js と名前空間を分離（$ は querySelector）
   ・保存先は Supabase の koutei テーブル（現場ごとに独立・全員共有）
   ・?local=1 のときは localStorage にフォールバック
   ・window.KOTEI.open() で起動（app.js の「📋 工程表」ボタンから呼ぶ）
   ============================================================ */
(function () {
  const DAY_W = 56, HALF = 28, SLOTS_PER_DAY = 2;
  const $ = (s) => document.querySelector(s);

  /* ---- 標準の設備工事 作業セット ---- */
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
  const COLORS = ["#2f6fed", "#e23b3b", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2", "#64748b", "#db2777"];

  /* ---- 状態 ---- */
  let state = null;

  function defaultState() {
    return {
      title: "工事名　工程表",
      start: isoToday(),
      days: 21,
      tasks: DEFAULT_TASKS.map((n) => ({ id: uid(), name: n })),
      bars: []   // {id, taskId, startSlot, lenSlots, kind:'day'|'night', color:null|hex, label}
    };
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function uuid() {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 'kxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  function isoToday() { return iso(new Date()); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }

  /* ============================================================
     日本の祝日（1980-2099 概算・振替休日・国民の休日対応）
     ============================================================ */
  const _holCache = {};
  function holidaysOf(year) {
    if (_holCache[year]) return _holCache[year];
    const H = {};
    const k = (m, d) => year + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const nthMon = (m, n) => { const fd = new Date(year, m - 1, 1).getDay(); const first = 1 + ((1 - fd) + 7) % 7; return first + (n - 1) * 7; };
    H[k(1, 1)] = '元日';
    H[k(1, nthMon(1, 2))] = '成人の日';
    H[k(2, 11)] = '建国記念の日';
    if (year >= 2020) H[k(2, 23)] = '天皇誕生日'; else if (year <= 2018) H[k(12, 23)] = '天皇誕生日';
    const ver = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    H[k(3, ver)] = '春分の日';
    H[k(4, 29)] = year >= 2007 ? '昭和の日' : 'みどりの日';
    H[k(5, 3)] = '憲法記念日';
    if (year >= 2007) H[k(5, 4)] = 'みどりの日'; else H[k(5, 4)] = '国民の休日';
    H[k(5, 5)] = 'こどもの日';
    if (year >= 2003) H[k(7, nthMon(7, 3))] = '海の日'; else if (year >= 1996) H[k(7, 20)] = '海の日';
    if (year >= 2016) H[k(8, 11)] = '山の日';
    if (year >= 2003) H[k(9, nthMon(9, 3))] = '敬老の日'; else if (year >= 1966) H[k(9, 15)] = '敬老の日';
    const aut = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    H[k(9, aut)] = '秋分の日';
    if (year >= 2020) H[k(10, nthMon(10, 2))] = 'スポーツの日'; else if (year >= 2000) H[k(10, nthMon(10, 2))] = '体育の日'; else if (year >= 1966) H[k(10, 10)] = '体育の日';
    H[k(11, 3)] = '文化の日';
    H[k(11, 23)] = '勤労感謝の日';

    const base = Object.assign({}, H);
    const dn = (s) => parseISO(s).getDay();
    const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
    if (year >= 1973) {
      Object.keys(base).forEach((d) => {
        if (dn(d) === 0) {
          let nx = addDays(d, 1);
          while (H[nx]) nx = addDays(nx, 1);
          H[nx] = '振替休日';
        }
      });
      const start = new Date(year, 0, 1), end = new Date(year, 11, 31);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = iso(d);
        if (H[key]) continue;
        if (d.getDay() === 0) continue;
        const prev = addDays(key, -1), next = addDays(key, 1);
        if (H[prev] && H[next] && H[prev] !== '振替休日') H[key] = '国民の休日';
      }
    }
    _holCache[year] = H;
    return H;
  }
  function holidayName(date) { return holidaysOf(date.getFullYear())[iso(date)] || null; }

  /* ============================================================
     日付情報
     ============================================================ */
  const DOW = ['日', '月', '火', '水', '木', '金', '土'];
  function dayInfo(i) {
    const d = parseISO(state.start); d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const hol = holidayName(d);
    return {
      date: d, dow, dowName: DOW[dow],
      md: (d.getMonth() + 1) + '/' + d.getDate(),
      year: d.getFullYear(),
      monthStart: d.getDate() === 1 || i === 0,
      isWeekend: dow === 0 || dow === 6,
      isHoliday: !!hol, holName: hol,
      isToday: iso(d) === isoToday()
    };
  }

  /* ============================================================
     描画
     ============================================================ */
  const board = $('#viewKotei #board');
  let selectedBar = null;

  function render() {
    if (!state) return;
    board.innerHTML = '';
    const total = state.days;
    const trackW = total * DAY_W;

    const corner = el('div', 'corner'); corner.innerHTML = '作業内容<br><span style="font-size:10px;color:#8a93a0">／日付・曜日</span>';
    board.appendChild(corner);

    const tl = el('div', 'timeline'); tl.style.width = trackW + 'px';
    for (let i = 0; i < total; i++) {
      const di = dayInfo(i);
      const h = el('div', 'dhead');
      if (di.monthStart) h.classList.add('month-start');
      if (di.isWeekend || di.isHoliday) h.classList.add('wknd');
      if (di.isToday) h.classList.add('today');
      const showYear = i === 0 || di.date.getDate() === 1;
      h.innerHTML = `<div class="yr">${showYear ? di.year + '年' : '&nbsp;'}</div><div class="md">${di.md}</div><div class="dow">${di.dowName}</div>`;
      if (di.holName) h.title = di.holName;
      tl.appendChild(h);
    }
    board.appendChild(tl);

    const wknd = []; for (let i = 0; i < total; i++) { const di = dayInfo(i); if (di.isWeekend || di.isHoliday) wknd.push(i); }
    let todayIdx = -1; for (let i = 0; i < total; i++) { if (dayInfo(i).isToday) { todayIdx = i; break; } }

    state.tasks.forEach((task) => {
      const lbl = el('div', 'rlabel');
      const grip = el('span', 'grip'); grip.textContent = '⋮'; grip.title = 'ドラッグで並べ替え'; grip.draggable = true;
      grip.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', task.id); });
      const name = el('div', 'name'); name.textContent = task.name; name.title = 'クリックで名称編集';
      name.addEventListener('click', () => editTaskName(task, name));
      const dn = el('div', 'dn'); dn.innerHTML = '<span>日中</span><span>夜間</span>';
      lbl.append(grip, name, dn);
      lbl.addEventListener('dragover', (e) => e.preventDefault());
      lbl.addEventListener('drop', (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); reorderTask(id, task.id); });
      board.appendChild(lbl);

      const track = el('div', 'track'); track.style.width = trackW + 'px'; track.dataset.taskId = task.id;
      track.appendChild(el('div', 'midline'));
      wknd.forEach((i) => { const c = el('div', 'wkcol'); c.style.left = (i * DAY_W) + 'px'; track.appendChild(c); });
      if (todayIdx >= 0) { const c = el('div', 'todaycol'); c.style.left = (todayIdx * DAY_W) + 'px'; track.appendChild(c); }

      state.bars.filter((b) => b.taskId === task.id).forEach((b) => track.appendChild(makeBar(b)));

      track.addEventListener('pointerdown', (e) => onTrackDown(e, task, track));
      board.appendChild(track);
    });

    applySelection();
  }

  function makeBar(b) {
    const div = el('div', 'bar ' + (b.kind === 'night' ? 'night' : 'day'));
    div.dataset.id = b.id;
    div.style.left = (b.startSlot * HALF) + 'px';
    div.style.width = Math.max(HALF, b.lenSlots * HALF) + 'px';
    if (b.color) div.style.background = b.color;
    const lab = el('span', 'lab'); lab.textContent = b.label || '';
    div.title = (b.label || '(無題)') + '  [' + slotLabel(b) + ']';
    const hl = el('div', 'h l'), hr = el('div', 'h r');
    div.append(lab, hl, hr);
    div.addEventListener('pointerdown', (e) => onBarDown(e, b, div));
    div.addEventListener('dblclick', (e) => { e.stopPropagation(); toggleKind(b); });
    return div;
  }
  function slotLabel(b) {
    const d0 = Math.floor(b.startSlot / 2), d1 = Math.floor((b.startSlot + b.lenSlots - 1) / 2);
    const a = dayInfo(d0), c = dayInfo(Math.min(d1, state.days - 1));
    return a.md + (d0 === d1 ? '' : ' 〜 ' + c.md);
  }

  /* ============================================================
     バー操作（移動・伸縮・コピー）
     ============================================================ */
  let drag = null;
  function slotAtClientX(track, clientX) {
    const r = track.getBoundingClientRect();
    return clamp(Math.round((clientX - r.left) / HALF), 0, state.days * SLOTS_PER_DAY);
  }
  function onTrackDown(e, task, track) {
    if (e.target.classList.contains('bar') || e.target.classList.contains('h')) return;
    e.preventDefault();
    const r = track.getBoundingClientRect();
    const startSlot = slotAtClientX(track, e.clientX);
    const kind = (e.clientY - r.top) < (track.clientHeight / 2) ? 'day' : 'night';
    const bar = { id: uid(), taskId: task.id, startSlot: Math.min(startSlot, state.days * 2 - 1), lenSlots: 2, kind, color: null, label: '' };
    state.bars.push(bar);
    render();
    const div = board.querySelector('.bar[data-id="' + bar.id + '"]');
    drag = { mode: 'create', bar, track, startX: e.clientX, origStart: bar.startSlot, origLen: 0, div, moved: false };
    bindDragMove();
    selectBar(bar);
  }
  function onBarDown(e, b, div) {
    e.preventDefault(); e.stopPropagation();
    const track = div.parentElement;
    selectBar(b);
    let mode = 'move';
    if (e.target.classList.contains('l')) mode = 'resize-l';
    else if (e.target.classList.contains('r')) mode = 'resize-r';
    drag = { mode, bar: b, track, startX: e.clientX, origStart: b.startSlot, origLen: b.lenSlots, div, moved: false, copy: false };
    if (mode === 'move' && (e.ctrlKey || e.metaKey)) {
      const nb = { ...b, id: uid() };
      state.bars.push(nb);
      render();
      drag.bar = nb; drag.copy = true;
      drag.div = board.querySelector('.bar[data-id="' + nb.id + '"]');
      drag.div.classList.add('copying');
      selectBar(nb);
    }
    bindDragMove();
  }
  function bindDragMove() {
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp, { once: true });
  }
  function onDragMove(e) {
    if (!drag) return;
    const dSlots = Math.round((e.clientX - drag.startX) / HALF);
    if (dSlots !== 0) drag.moved = true;
    const total = state.days * SLOTS_PER_DAY;
    const b = drag.bar;
    if (drag.mode === 'move') {
      b.startSlot = clamp(drag.origStart + dSlots, 0, total - b.lenSlots);
    } else if (drag.mode === 'resize-r' || drag.mode === 'create') {
      b.lenSlots = clamp(drag.origLen + dSlots, 1, total - b.startSlot);
    } else if (drag.mode === 'resize-l') {
      const ns = clamp(drag.origStart + dSlots, 0, drag.origStart + drag.origLen - 1);
      b.lenSlots = drag.origStart + drag.origLen - ns; b.startSlot = ns;
    }
    drag.div.style.left = (b.startSlot * HALF) + 'px';
    drag.div.style.width = Math.max(HALF, b.lenSlots * HALF) + 'px';
  }
  function onDragUp() {
    window.removeEventListener('pointermove', onDragMove);
    if (drag) {
      if (drag.mode === 'create') {
        if (!drag.moved) drag.bar.lenSlots = 2;
        save(); render(); applySelection();
      } else if (drag.moved) {
        save(); render(); applySelection();
      }
    }
    drag = null;
  }
  function toggleKind(b) {
    b.kind = b.kind === 'night' ? 'day' : 'night';
    b.color = null;
    save(); render(); selectBar(b);
  }

  /* ============================================================
     選択 / プロパティパネル
     ============================================================ */
  const panel = $('#viewKotei #panel');
  function selectBar(b) { selectedBar = b; applySelection(); openPanel(); }
  function applySelection() {
    board.parentElement.parentElement.querySelectorAll('.bar.sel').forEach((x) => x.classList.remove('sel'));
    if (selectedBar) {
      const d = board.querySelector('.bar[data-id="' + selectedBar.id + '"]');
      if (d) d.classList.add('sel');
    }
  }
  function openPanel() {
    if (!selectedBar) { panel.classList.remove('show'); return; }
    panel.classList.add('show');
    $('#viewKotei #pLabel').value = selectedBar.label || '';
    $('#viewKotei #pKind').querySelectorAll('button').forEach((btn) => btn.classList.toggle('on', btn.dataset.kind === selectedBar.kind));
    buildSwatches();
  }
  function buildSwatches() {
    const wrap = $('#viewKotei #pColors'); wrap.innerHTML = '';
    COLORS.forEach((c) => {
      const s = el('div', 'swatch'); s.style.background = c;
      if (c.toLowerCase() === (selectedBar.color || '').toLowerCase()) s.classList.add('on');
      s.addEventListener('click', () => { selectedBar.color = c; save(); render(); selectBar(selectedBar); });
      wrap.appendChild(s);
    });
    const def = el('div', 'swatch'); def.textContent = '既'; def.style.cssText += 'display:flex;align-items:center;justify-content:center;font-size:10px;color:#445;background:#eef1f5;';
    if (!selectedBar.color) def.classList.add('on');
    def.title = '既定色（日中=青/夜間=赤）';
    def.addEventListener('click', () => { selectedBar.color = null; save(); render(); selectBar(selectedBar); });
    wrap.appendChild(def);
  }
  $('#viewKotei #pLabel').addEventListener('input', (e) => { if (selectedBar) { selectedBar.label = e.target.value; const d = board.querySelector('.bar[data-id="' + selectedBar.id + '"] .lab'); if (d) d.textContent = e.target.value; save(); } });
  $('#viewKotei #pLabel').addEventListener('change', () => render());
  $('#viewKotei #pKind').addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn || !selectedBar) return; selectedBar.kind = btn.dataset.kind; selectedBar.color = null; save(); render(); selectBar(selectedBar); });
  $('#viewKotei #pDelete').addEventListener('click', () => { if (!selectedBar) return; state.bars = state.bars.filter((x) => x.id !== selectedBar.id); selectedBar = null; panel.classList.remove('show'); save(); render(); });
  $('#viewKotei #pClose').addEventListener('click', () => { selectedBar = null; panel.classList.remove('show'); applySelection(); });
  document.addEventListener('keydown', (e) => {
    if (!isActive()) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBar && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      state.bars = state.bars.filter((x) => x.id !== selectedBar.id); selectedBar = null; panel.classList.remove('show'); save(); render();
    }
  });

  /* ============================================================
     作業（縦軸）編集・マスター
     ============================================================ */
  function editTaskName(task, nameEl) {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = task.name; inp.style.cssText = 'width:100%;border:1px solid #9db4f0;border-radius:5px;padding:3px 4px;font-family:inherit;font-size:13px;';
    inp.setAttribute('list', 'taskSuggest');
    nameEl.replaceWith(inp); inp.focus(); inp.select();
    const done = () => { task.name = inp.value.trim() || task.name; save(); render(); };
    inp.addEventListener('blur', done);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  }
  function reorderTask(dragId, targetId) {
    if (dragId === targetId) return;
    const arr = state.tasks; const from = arr.findIndex((t) => t.id === dragId), to = arr.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const [m] = arr.splice(from, 1); arr.splice(to, 0, m); save(); render();
  }

  const masterBg = $('#viewKotei #masterBg');
  function openMaster() { buildMaster(); masterBg.classList.add('show'); }
  function buildMaster() {
    const list = $('#viewKotei #mlist'); list.innerHTML = '';
    state.tasks.forEach((t, i) => {
      const row = el('div', 'mrow');
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = t.name; inp.setAttribute('list', 'taskSuggest');
      inp.addEventListener('change', () => { t.name = inp.value.trim() || t.name; save(); render(); });
      const up = mbtn('▲', () => move(i, -1)), dn = mbtn('▼', () => move(i, 1)), del = mbtn('✕', () => {
        if (state.bars.some((b) => b.taskId === t.id) && !confirm('この作業のバーも削除されます。よろしいですか？')) return;
        state.bars = state.bars.filter((b) => b.taskId !== t.id);
        state.tasks.splice(i, 1); save(); render(); buildMaster();
      }); del.style.color = '#b91c1c';
      row.append(inp, up, dn, del); list.appendChild(row);
    });
    function move(i, d) { const j = i + d; if (j < 0 || j >= state.tasks.length) return; const a = state.tasks;[a[i], a[j]] = [a[j], a[i]]; save(); render(); buildMaster(); }
  }
  function mbtn(txt, fn) { const b = el('button', 'ic'); b.textContent = txt; b.addEventListener('click', fn); return b; }
  $('#viewKotei #mAddBtn').addEventListener('click', addTask);
  $('#viewKotei #mAdd').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } });
  function addTask() { const v = $('#viewKotei #mAdd').value.trim(); if (!v) return; state.tasks.push({ id: uid(), name: v }); $('#viewKotei #mAdd').value = ''; save(); render(); buildMaster(); }
  $('#viewKotei #mClose').addEventListener('click', () => masterBg.classList.remove('show'));
  $('#viewKotei #mRestore').addEventListener('click', () => { if (!confirm('縦軸を標準セットに戻します（バーは保持）。よろしいですか？')) return; state.tasks = DEFAULT_TASKS.map((n) => ({ id: uid(), name: n })); save(); render(); buildMaster(); });
  masterBg.addEventListener('click', (e) => { if (e.target === masterBg) masterBg.classList.remove('show'); });
  $('#viewKotei #btnMaster').addEventListener('click', openMaster);

  /* ============================================================
     ツールバー（タイトル・開始日・日数・印刷・消去）
     ============================================================ */
  $('#viewKotei #title').addEventListener('input', (e) => { if (!state) return; state.title = e.target.value; updateDocName(currentId, state.title); save(); });
  $('#viewKotei #start').addEventListener('change', (e) => { if (!state) return; state.start = e.target.value || isoToday(); save(); render(); });
  $('#viewKotei #days').addEventListener('change', (e) => { if (!state) return; let v = parseInt(e.target.value, 10); if (isNaN(v) || v < 1) v = 1; if (v > 370) v = 370; state.days = v; e.target.value = v; save(); render(); });
  $('#viewKotei #btnPrint').addEventListener('click', () => window.print());
  $('#viewKotei #btnClear').addEventListener('click', () => { if (!state) return; if (confirm('この工程表のバーをすべて消去します。縦軸・設定は残ります。よろしいですか？')) { state.bars = []; selectedBar = null; panel.classList.remove('show'); save(); render(); } });

  /* ============================================================
     保存・読込（Supabase koutei テーブル / local フォールバック）
     現場（工程表）ごとに独立したドキュメントを複数管理
     ============================================================ */
  const DOCS_LS = 'koutei_docs_v1';
  const CUR_LS = 'koteiCurrentV1';
  let currentId = null;
  let docs = [];          // [{id, name}]
  let saveTimer = null;

  function sbClient() {
    return (window.CINEMA_DB && window.CINEMA_DB.mode && window.CINEMA_DB.mode() === 'supabase') ? window.CINEMA_DB.client() : null;
  }
  function lsDocs() { try { return JSON.parse(localStorage.getItem(DOCS_LS)) || {}; } catch (e) { return {}; } }
  function lsSetDocs(o) { try { localStorage.setItem(DOCS_LS, JSON.stringify(o)); } catch (e) {} }

  function normalize(o) {
    o = o || {};
    o.title = o.title || ''; o.start = o.start || isoToday(); o.days = o.days || 21;
    o.tasks = (o.tasks || []).map((t) => ({ id: t.id || uid(), name: t.name || '' }));
    o.bars = (o.bars || []).map((b) => ({ id: b.id || uid(), taskId: b.taskId, startSlot: b.startSlot | 0, lenSlots: Math.max(1, b.lenSlots | 0), kind: b.kind === 'night' ? 'night' : 'day', color: b.color || null, label: b.label || '' }));
    return o;
  }

  async function loadList() {
    const sb = sbClient();
    if (sb) {
      const { data, error } = await sb.from('koutei').select('id,name,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({ id: r.id, name: r.name || '工程表' }));
    }
    const all = lsDocs();
    return Object.keys(all).map((id) => ({ id, name: all[id].name || '工程表' }));
  }
  async function loadDoc(id) {
    const sb = sbClient();
    if (sb) {
      const { data, error } = await sb.from('koutei').select('*').eq('id', id).single();
      if (error) throw error;
      return normalize(data && data.data);
    }
    const all = lsDocs(); const d = all[id]; return d ? normalize(d.data) : defaultState();
  }
  async function createDoc(st) {
    const sb = sbClient();
    if (sb) {
      const { data, error } = await sb.from('koutei').insert({ name: st.title || '工程表', data: st }).select('id').single();
      if (error) throw error;
      return data.id;
    }
    const id = uuid(); const all = lsDocs(); all[id] = { name: st.title || '工程表', data: st }; lsSetDocs(all); return id;
  }
  async function removeDocRemote(id) {
    const sb = sbClient();
    if (sb) { const { error } = await sb.from('koutei').delete().eq('id', id); if (error) throw error; return; }
    const all = lsDocs(); delete all[id]; lsSetDocs(all);
  }

  // 現在のドキュメントを保存（Supabaseは負荷軽減のためデバウンス）
  function save() {
    if (!currentId || !state) return;
    if (!sbClient()) {
      const all = lsDocs(); all[currentId] = { name: state.title || '工程表', data: state }; lsSetDocs(all); return;
    }
    clearTimeout(saveTimer);
    const snapshot = JSON.parse(JSON.stringify(state));
    saveTimer = setTimeout(() => {
      const sb = sbClient(); if (!sb) return;
      sb.from('koutei').update({ name: snapshot.title || '工程表', data: snapshot }).eq('id', currentId)
        .then(({ error }) => { if (error) console.error('工程表の保存に失敗しました', error); });
    }, 600);
  }

  function updateDocName(id, name) {
    const d = docs.find((x) => x.id === id); if (d) { d.name = name || '工程表'; }
    const opt = $('#viewKotei #kSelect') && $('#viewKotei #kSelect').querySelector('option[value="' + id + '"]');
    if (opt) opt.textContent = name || '(無題)';
  }

  function refreshSelect() {
    const sel = $('#viewKotei #kSelect'); if (!sel) return;
    sel.innerHTML = '';
    docs.forEach((d) => {
      const o = document.createElement('option'); o.value = d.id; o.textContent = d.name || '(無題)';
      sel.appendChild(o);
    });
    if (currentId) sel.value = currentId;
  }

  function syncToolbar() {
    if (!state) return;
    $('#viewKotei #title').value = state.title;
    $('#viewKotei #start').value = state.start;
    $('#viewKotei #days').value = state.days;
  }

  async function switchTo(id) {
    state = await loadDoc(id);
    currentId = id;
    try { localStorage.setItem(CUR_LS, id); } catch (e) {}
    selectedBar = null; panel.classList.remove('show');
    refreshSelect(); syncToolbar(); render();
  }

  $('#viewKotei #kSelect').addEventListener('change', (e) => { switchTo(e.target.value); });
  $('#viewKotei #kNew').addEventListener('click', async () => {
    const nm = prompt('新しい工程表（現場）の名前を入力してください。', '新しい現場　工程表');
    if (nm === null) return;
    const st = defaultState(); st.title = nm.trim() || '工事名　工程表';
    try {
      const id = await createDoc(st);
      docs.unshift({ id, name: st.title });
      await switchTo(id);
    } catch (err) { alert('新規作成に失敗しました：' + (err.message || err)); }
  });
  $('#viewKotei #kDelete').addEventListener('click', async () => {
    if (!currentId) return;
    const cur = docs.find((d) => d.id === currentId);
    if (!confirm('「' + (cur ? cur.name : '') + '」を削除します。元に戻せません。よろしいですか？')) return;
    try {
      await removeDocRemote(currentId);
      docs = docs.filter((d) => d.id !== currentId);
      if (docs.length) {
        await switchTo(docs[0].id);
      } else {
        const st = defaultState();
        const id = await createDoc(st);
        docs = [{ id, name: st.title }];
        await switchTo(id);
      }
    } catch (err) { alert('削除に失敗しました：' + (err.message || err)); }
  });

  /* ---- util ---- */
  function el(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function isActive() { const v = document.getElementById('viewKotei'); return v && !v.classList.contains('hidden'); }

  /* ---- datalist ---- */
  (function () { const dl = $('#viewKotei #taskSuggest'); if (dl) TASK_SUGGEST.forEach((n) => { const o = document.createElement('option'); o.value = n; dl.appendChild(o); }); })();

  $('#viewKotei #scroll').addEventListener('pointerdown', (e) => { if (e.target.id === 'scroll' || e.target.id === 'board') { selectedBar = null; panel.classList.remove('show'); applySelection(); } });

  /* ============================================================
     公開API：app.js の「📋 工程表」ボタンから open() を呼ぶ
     ============================================================ */
  let opening = false;
  async function open() {
    if (opening) return;
    opening = true;
    try {
      docs = await loadList();
      let id = null;
      try { id = localStorage.getItem(CUR_LS); } catch (e) {}
      if (!docs.find((d) => d.id === id)) id = docs.length ? docs[0].id : null;
      if (!id) {
        const st = defaultState();
        id = await createDoc(st);
        docs = [{ id, name: st.title }];
      }
      await switchTo(id);
    } catch (err) {
      // 取得失敗時はローカルの初期状態で表示（保存は次回成功時）
      console.error('工程表の読み込みに失敗しました', err);
      if (!state) { state = defaultState(); refreshSelect(); syncToolbar(); render(); }
    } finally {
      opening = false;
    }
  }

  window.KOTEI = { open, render };
})();
