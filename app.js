(function () {
  'use strict';

  const STORAGE_KEY = 'tohoCasesV1';
  const HISTORY_KEY = 'tohoHistoryV1';
  const AUTH_KEY = 'tohoAuthV1';

  const COMPANIES = ['TOHOシネマズ', '109シネマズ', 'ユナイテッドシネマ', '佐々木興業'];
  const CATEGORIES = ['新規工事', '修理', 'メンテナンス', '点検', '改修', 'その他'];
  const STATUSES = ['受付', '調査中', '見積り提出済', '作業中', '完了', '保留', '請求済', '入金済'];
  const PRIVILEGED_DOMAIN = 'ryonetsu.com';

  const DEFAULT_THEATERS = [
    'TOHOシネマズ 日本橋', 'TOHOシネマズ 日比谷', 'TOHOシネマズ シャンテ',
    'TOHOシネマズ 新宿', 'TOHOシネマズ 六本木ヒルズ', 'TOHOシネマズ 渋谷',
    'TOHOシネマズ 上野', 'TOHOシネマズ 池袋', 'TOHOシネマズ 西新井',
    'TOHOシネマズ 錦糸町楽天地', 'TOHOシネマズ 立川立飛', 'TOHOシネマズ 府中',
    'TOHOシネマズ 南大沢', 'TOHOシネマズ 八王子', 'TOHOシネマズ 海老名',
    'TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ 川崎', 'TOHOシネマズ 上大岡',
    'TOHOシネマズ 横浜みなとみらい', 'TOHOシネマズ ららぽーと船橋',
    'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ 流山おおたかの森',
    'TOHOシネマズ 柏', 'TOHOシネマズ 浦和美園', 'TOHOシネマズ 上尾',
    'TOHOシネマズ 川越マイン', 'TOHOシネマズ ららぽーと富士見',
    'TOHOシネマズ 仙台', 'TOHOシネマズ 名取', 'TOHOシネマズ 宇都宮',
    'TOHOシネマズ 宇都宮インターパーク', 'TOHOシネマズ 高崎',
    'TOHOシネマズ 太田', 'TOHOシネマズ 日立', 'TOHOシネマズ 水戸内原',
    'TOHOシネマズ ひたちなか', 'TOHOシネマズ 札幌', 'TOHOシネマズ すすきの',
    'TOHOシネマズ 名古屋ベイシティ', 'TOHOシネマズ 名古屋', 'TOHOシネマズ 鈴鹿',
    'TOHOシネマズ 岡崎', 'TOHOシネマズ 赤池', 'TOHOシネマズ 津島',
    'TOHOシネマズ 二条', 'TOHOシネマズ なんば', 'TOHOシネマズ なんば別館',
    'TOHOシネマズ 梅田', 'TOHOシネマズ 西宮OS', 'TOHOシネマズ くずはモール',
    'TOHOシネマズ 鳳', 'TOHOシネマズ 泉北', 'TOHOシネマズ 伊丹',
    'TOHOシネマズ 岸和田', 'TOHOシネマズ ららぽーと甲子園',
    'TOHOシネマズ 緑井', 'TOHOシネマズ 広島', 'TOHOシネマズ 高松',
    'TOHOシネマズ 岡南', 'TOHOシネマズ 倉敷', 'TOHOシネマズ 防府',
    'TOHOシネマズ 福岡キャナルシティ', 'TOHOシネマズ ららぽーと福岡',
    'TOHOシネマズ 直方', 'TOHOシネマズ トリアス久山', 'TOHOシネマズ 天神',
    'TOHOシネマズ 長崎', 'TOHOシネマズ 久留米', 'TOHOシネマズ 熊本サクラマチ',
    'TOHOシネマズ はませんアイランド', 'TOHOシネマズ 鹿児島', 'TOHOシネマズ 沖縄ライカム',
    'TOHOシネマズ ファボーレ富山'
  ];

  // Editable field config used by inline-edit and table render
  const EDITABLE_FIELDS = {
    company:        { type: 'select',   options: COMPANIES, privilegedOnly: true },
    theater:        { type: 'datalist', listId: 'theaterList' },
    receivedDate:   { type: 'date' },
    tcPerson:       { type: 'datalist', listId: 'tcPersonList' },
    rPerson:        { type: 'datalist', listId: 'rPersonList' },
    category:       { type: 'select',   options: [''].concat(CATEGORIES) },
    content:        { type: 'textarea' },
    surveyDate:     { type: 'date' },
    quoteDate:      { type: 'date' },
    workStartDate:  { type: 'date' },
    workEndDate:    { type: 'date' },
    invoiceDate:    { type: 'date' },
    paymentDate:    { type: 'date' },
    status:         { type: 'select',   options: STATUSES }
  };

  let cases = loadCases();
  let history = loadHistory();
  let currentUser = loadAuth();

  const $ = (id) => document.getElementById(id);
  const loginScreen = $('loginScreen');
  const appShell = $('appShell');
  const modal = $('modal');
  const form = $('caseForm');
  const tbody = $('casesBody');
  const emptyMsg = $('emptyMsg');
  const caseCountEl = $('caseCount');
  const searchBox = $('searchBox');
  const statusFilter = $('statusFilter');
  const companyFilter = $('companyFilter');
  const companySelect = $('company');

  function loadCases() {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { arr = []; }
    arr.forEach((c) => {
      if (!c.company) c.company = 'TOHOシネマズ';
      if (c.invoiceDate === undefined) c.invoiceDate = '';
      if (c.paymentDate === undefined) c.paymentDate = '';
    });
    return arr;
  }
  function saveCases() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); }

  function loadHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
      return {
        theaters: stored.theaters && stored.theaters.length ? stored.theaters : DEFAULT_THEATERS.slice(),
        tcPersons: stored.tcPersons || [],
        rPersons: stored.rPersons || []
      };
    } catch (e) {
      return { theaters: DEFAULT_THEATERS.slice(), tcPersons: [], rPersons: [] };
    }
  }
  function saveHistory() { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

  function addToHistory(key, value) {
    if (!value) return;
    const v = String(value).trim();
    if (!v) return;
    const list = history[key];
    const idx = list.indexOf(v);
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(v);
    if (list.length > 200) list.length = 200;
  }

  function fillDatalist(id, items) {
    const dl = $(id);
    dl.innerHTML = '';
    items.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      dl.appendChild(opt);
    });
  }
  function renderDatalists() {
    fillDatalist('theaterList', history.theaters);
    fillDatalist('tcPersonList', history.tcPersons);
    fillDatalist('rPersonList', history.rPersons);
  }

  function loadAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; }
  }
  function saveAuth(user) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
  function clearAuth() { localStorage.removeItem(AUTH_KEY); }
  function isPrivileged(user) { return !!(user && user.domain === PRIVILEGED_DOMAIN); }

  function attemptLogin(email, password) {
    const e = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return { ok: false, msg: 'メールアドレスの形式が正しくありません。' };
    }
    const local = e.split('@')[0];
    const domain = e.split('@')[1];
    if (!local) return { ok: false, msg: 'メールアドレスが不正です。' };
    if ((password || '').toLowerCase() !== local.toLowerCase()) {
      return { ok: false, msg: 'パスワードが正しくありません。' };
    }
    return { ok: true, user: { email: e, domain: domain, loginAt: new Date().toISOString() } };
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function daysBetween(a, b) {
    if (!a || !b) return null;
    const x = new Date(a + 'T00:00:00'), y = new Date(b + 'T00:00:00');
    if (isNaN(x) || isNaN(y)) return null;
    return Math.floor((y - x) / 86400000);
  }
  function fmtDate(s) { return s ? s.replace(/-/g, '/') : ''; }

  function rowColorClass(c) {
    if (c.status === '完了' || c.status === '入金済') return '';
    const today = todayStr();
    if (c.surveyDate) {
      const d = daysBetween(c.surveyDate, c.quoteDate || today);
      if (d !== null && d >= 3) return 'row-red';
    }
    if (c.receivedDate) {
      const d = daysBetween(c.receivedDate, c.surveyDate || today);
      if (d !== null && d >= 3) return 'row-yellow';
    }
    return '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getFilteredCases() {
    const q = searchBox.value.trim().toLowerCase();
    const sf = statusFilter.value;
    const cf = isPrivileged(currentUser) ? companyFilter.value : 'TOHOシネマズ';

    return cases.filter((c) => {
      if (cf && c.company !== cf) return false;
      if (sf && c.status !== sf) return false;
      if (!q) return true;
      const hay = [c.company, c.theater, c.tcPerson, c.rPerson, c.category, c.content, c.status,
        c.receivedDate, c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate]
        .map((x) => (x || '').toLowerCase()).join(' ');
      return hay.includes(q);
    }).sort((a, b) => {
      if (!a.receivedDate && !b.receivedDate) return 0;
      if (!a.receivedDate) return 1;
      if (!b.receivedDate) return -1;
      return b.receivedDate.localeCompare(a.receivedDate);
    });
  }

  // Render an editable td
  function editableTd(c, field, displayHtml) {
    const cfg = EDITABLE_FIELDS[field];
    const canEdit = !(cfg.privilegedOnly && !isPrivileged(currentUser));
    const cls = canEdit ? 'editable' : '';
    const empty = !c[field] ? 'empty' : '';
    return `<td class="${cls} ${empty}" data-field="${field}" data-case-id="${escapeHtml(c.id)}">${displayHtml}</td>`;
  }

  function render() {
    const filtered = getFilteredCases();
    tbody.innerHTML = '';
    filtered.forEach((c) => {
      const tr = document.createElement('tr');
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;

      const companyHtml = c.company
        ? `<span class="company-tag company-${escapeHtml(c.company)}">${escapeHtml(c.company)}</span>`
        : '';
      const statusHtml = c.status
        ? `<span class="status-badge status-${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>`
        : '';

      tr.innerHTML = `
        ${editableTd(c, 'company', companyHtml)}
        ${editableTd(c, 'theater', escapeHtml(c.theater))}
        ${editableTd(c, 'receivedDate', fmtDate(c.receivedDate))}
        ${editableTd(c, 'tcPerson', escapeHtml(c.tcPerson))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'category', escapeHtml(c.category))}
        <td class="editable content-cell ${c.content ? '' : 'empty'}" data-field="content" data-case-id="${escapeHtml(c.id)}">${escapeHtml(c.content)}</td>
        ${editableTd(c, 'surveyDate', fmtDate(c.surveyDate))}
        ${editableTd(c, 'quoteDate', fmtDate(c.quoteDate))}
        ${editableTd(c, 'workStartDate', fmtDate(c.workStartDate))}
        ${editableTd(c, 'workEndDate', fmtDate(c.workEndDate))}
        ${editableTd(c, 'invoiceDate', fmtDate(c.invoiceDate))}
        ${editableTd(c, 'paymentDate', fmtDate(c.paymentDate))}
        ${editableTd(c, 'status', statusHtml)}
        <td class="row-actions">
          <button data-action="edit" data-id="${escapeHtml(c.id)}">編集</button>
          <button data-action="delete" data-id="${escapeHtml(c.id)}" class="danger">削除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    emptyMsg.classList.toggle('hidden', filtered.length > 0);
    const totalVisible = isPrivileged(currentUser)
      ? cases.length
      : cases.filter((c) => c.company === 'TOHOシネマズ').length;
    caseCountEl.textContent = `${filtered.length} 件 / 全 ${totalVisible} 件`;
  }

  // ---------- inline edit ----------
  function startInlineEdit(td, c, field) {
    if (td.querySelector('.inline-edit')) return;
    const cfg = EDITABLE_FIELDS[field];
    if (!cfg) return;
    if (cfg.privilegedOnly && !isPrivileged(currentUser)) return;

    const oldVal = c[field] || '';
    let el;
    switch (cfg.type) {
      case 'date':
        el = document.createElement('input');
        el.type = 'date';
        break;
      case 'select':
        el = document.createElement('select');
        cfg.options.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt === '' ? '(未選択)' : opt;
          el.appendChild(o);
        });
        break;
      case 'datalist':
        el = document.createElement('input');
        el.type = 'text';
        el.setAttribute('list', cfg.listId);
        break;
      case 'textarea':
        el = document.createElement('textarea');
        el.rows = 2;
        break;
      default:
        el = document.createElement('input');
        el.type = 'text';
    }
    el.className = 'inline-edit';
    el.value = oldVal;
    td.innerHTML = '';
    td.appendChild(el);
    el.focus();
    if (el.select) try { el.select(); } catch (e) {}

    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const newVal = (typeof el.value === 'string') ? el.value.trim() : el.value;
      if (newVal !== oldVal) {
        c[field] = newVal;
        c.updatedAt = new Date().toISOString();
        if (field === 'theater') addToHistory('theaters', newVal);
        if (field === 'tcPerson') addToHistory('tcPersons', newVal);
        if (field === 'rPerson') addToHistory('rPersons', newVal);
        saveHistory();
        saveCases();
      }
      render();
    };
    const cancel = () => { if (done) return; done = true; render(); };

    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cfg.type !== 'textarea') {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });
  }

  // ---------- modal (new / edit) ----------
  function openModal(caseObj, mode) {
    form.reset();
    $('caseId').value = '';
    const realMode = mode || 'full';
    const isSimple = realMode === 'simple';

    document.querySelectorAll('[data-mode="full"]').forEach((el) => {
      el.classList.toggle('hidden', isSimple);
    });

    if (isPrivileged(currentUser)) {
      companySelect.disabled = false;
    } else {
      companySelect.value = 'TOHOシネマズ';
      companySelect.disabled = true;
    }

    if (caseObj) {
      $('modalTitle').textContent = '案件編集';
      $('caseId').value = caseObj.id;
      $('company').value = caseObj.company || 'TOHOシネマズ';
      $('theater').value = caseObj.theater || '';
      $('receivedDate').value = caseObj.receivedDate || '';
      $('tcPerson').value = caseObj.tcPerson || '';
      $('rPerson').value = caseObj.rPerson || '';
      $('category').value = caseObj.category || '';
      $('content').value = caseObj.content || '';
      $('surveyDate').value = caseObj.surveyDate || '';
      $('quoteDate').value = caseObj.quoteDate || '';
      $('workStartDate').value = caseObj.workStartDate || '';
      $('workEndDate').value = caseObj.workEndDate || '';
      $('invoiceDate').value = caseObj.invoiceDate || '';
      $('paymentDate').value = caseObj.paymentDate || '';
      $('status').value = caseObj.status || '受付';
    } else {
      $('modalTitle').textContent = isSimple ? '簡易登録' : '新規案件登録';
      $('company').value = 'TOHOシネマズ';
      $('receivedDate').value = todayStr();
      $('status').value = '受付';
    }
    renderDatalists();
    modal.classList.remove('hidden');
    setTimeout(() => $('company').focus(), 50);
  }
  function closeModal() { modal.classList.add('hidden'); }

  function downloadCSV(filename, rows) {
    const csv = rows.map((row) =>
      row.map((v) => {
        const s = (v == null ? '' : String(v));
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',')
    ).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportFiltered() {
    const filtered = getFilteredCases();
    if (filtered.length === 0) {
      alert('現在の絞り込み条件に一致する案件がありません。');
      return;
    }
    const headers = ['会社', '劇場名', '受付日', 'TC担当者', 'R担当者', '種別', '内容',
      '調査日', '見積り提出日', '作業開始日', '作業完了日', '請求書発行日', '入金日', 'ステータス'];
    const rows = [headers].concat(filtered.map((c) => [
      c.company, c.theater, c.receivedDate, c.tcPerson, c.rPerson, c.category, c.content,
      c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate, c.status
    ]));
    downloadCSV(`cinema-cases-${todayStr()}.csv`, rows);
  }

  function showLogin() {
    appShell.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    setTimeout(() => $('loginEmail').focus(), 50);
  }
  function showApp() {
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    applyUserScope();
    render();
  }
  function applyUserScope() {
    $('userEmail').textContent = currentUser.email;
    const privileged = isPrivileged(currentUser);
    $('appTitle').textContent = privileged ? 'シネマ案件管理' : 'TOHOシネマズ 案件管理';
    companyFilter.classList.toggle('hidden', !privileged);
    document.querySelectorAll('.col-company').forEach((el) => {
      el.classList.toggle('hidden', !privileged);
    });
  }

  // ---------- handlers ----------
  $('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const res = attemptLogin($('loginEmail').value, $('loginPassword').value);
    const errEl = $('loginError');
    if (!res.ok) {
      errEl.textContent = res.msg;
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    currentUser = res.user;
    saveAuth(currentUser);
    $('loginPassword').value = '';
    showApp();
  });

  $('logoutBtn').addEventListener('click', () => {
    clearAuth();
    currentUser = null;
    showLogin();
  });

  $('newCaseBtn').addEventListener('click', () => openModal(null, 'full'));
  $('quickCaseBtn').addEventListener('click', () => openModal(null, 'simple'));
  $('closeModal').addEventListener('click', closeModal);
  $('cancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('caseId').value || String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const company = isPrivileged(currentUser) ? $('company').value : 'TOHOシネマズ';
    const data = {
      id: id,
      company: company,
      theater: $('theater').value.trim(),
      receivedDate: $('receivedDate').value,
      tcPerson: $('tcPerson').value.trim(),
      rPerson: $('rPerson').value.trim(),
      category: $('category').value,
      content: $('content').value.trim(),
      surveyDate: $('surveyDate').value,
      quoteDate: $('quoteDate').value,
      workStartDate: $('workStartDate').value,
      workEndDate: $('workEndDate').value,
      invoiceDate: $('invoiceDate').value,
      paymentDate: $('paymentDate').value,
      status: $('status').value || '受付',
      updatedAt: new Date().toISOString()
    };

    addToHistory('theaters', data.theater);
    addToHistory('tcPersons', data.tcPerson);
    addToHistory('rPersons', data.rPerson);
    saveHistory();

    const existing = cases.findIndex((c) => c.id === id);
    if (existing >= 0) cases[existing] = data;
    else cases.push(data);
    saveCases();
    closeModal();
    render();
  });

  // Combined click handler: action buttons + inline edit
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const c = cases.find((x) => x.id === id);
      if (!c) return;
      if (action === 'edit') {
        openModal(c, 'full');
      } else if (action === 'delete') {
        if (confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) {
          cases = cases.filter((x) => x.id !== id);
          saveCases();
          render();
        }
      }
      return;
    }
    const td = e.target.closest('td.editable');
    if (!td) return;
    const field = td.dataset.field;
    const caseId = td.dataset.caseId;
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    startInlineEdit(td, c, field);
  });

  searchBox.addEventListener('input', render);
  statusFilter.addEventListener('change', render);
  companyFilter.addEventListener('change', render);
  $('exportBtn').addEventListener('click', exportFiltered);

  renderDatalists();
  if (currentUser) {
    showApp();
  } else {
    showLogin();
  }
})();
