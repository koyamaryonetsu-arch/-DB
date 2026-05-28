(function () {
  'use strict';

  const STORAGE_KEY = 'tohoCasesV1';
  const HISTORY_KEY = 'tohoHistoryV1';

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

  // ---------- state ----------
  let cases = loadCases();
  let history = loadHistory();

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const modal = $('modal');
  const form = $('caseForm');
  const tbody = $('casesBody');
  const emptyMsg = $('emptyMsg');
  const caseCountEl = $('caseCount');
  const searchBox = $('searchBox');
  const statusFilter = $('statusFilter');

  // ---------- storage ----------
  function loadCases() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCases() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }

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

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

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

  function renderDatalists() {
    fillDatalist('theaterList', history.theaters);
    fillDatalist('tcPersonList', history.tcPersons);
    fillDatalist('rPersonList', history.rPersons);
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

  // ---------- date helpers ----------
  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function daysBetween(fromStr, toStr) {
    if (!fromStr || !toStr) return null;
    const a = new Date(fromStr + 'T00:00:00');
    const b = new Date(toStr + 'T00:00:00');
    if (isNaN(a) || isNaN(b)) return null;
    return Math.floor((b - a) / 86400000);
  }

  function rowColorClass(c) {
    if (c.status === '完了') return '';
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

  function fmtDate(s) {
    if (!s) return '';
    return s.replace(/-/g, '/');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- rendering ----------
  function render() {
    const q = searchBox.value.trim().toLowerCase();
    const sf = statusFilter.value;

    const filtered = cases.filter((c) => {
      if (sf && c.status !== sf) return false;
      if (!q) return true;
      const hay = [c.theater, c.tcPerson, c.rPerson, c.category, c.content, c.status]
        .map((x) => (x || '').toLowerCase()).join(' ');
      return hay.includes(q);
    });

    // Sort: newest received first, undated at the bottom
    filtered.sort((a, b) => {
      if (!a.receivedDate && !b.receivedDate) return 0;
      if (!a.receivedDate) return 1;
      if (!b.receivedDate) return -1;
      return b.receivedDate.localeCompare(a.receivedDate);
    });

    tbody.innerHTML = '';
    filtered.forEach((c) => {
      const tr = document.createElement('tr');
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;
      tr.innerHTML = `
        <td>${fmtDate(c.receivedDate)}</td>
        <td>${escapeHtml(c.theater)}</td>
        <td>${escapeHtml(c.tcPerson)}</td>
        <td>${escapeHtml(c.rPerson)}</td>
        <td>${fmtDate(c.surveyDate)}</td>
        <td>${fmtDate(c.quoteDate)}</td>
        <td>${escapeHtml(c.category)}</td>
        <td class="content-cell">${escapeHtml(c.content)}</td>
        <td><span class="status-badge status-${escapeHtml(c.status || '')}">${escapeHtml(c.status || '')}</span></td>
        <td>${fmtDate(c.workStartDate)}</td>
        <td>${fmtDate(c.workEndDate)}</td>
        <td class="row-actions">
          <button data-action="edit" data-id="${c.id}">編集</button>
          <button data-action="delete" data-id="${c.id}" class="danger">削除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    emptyMsg.classList.toggle('hidden', filtered.length > 0);
    caseCountEl.textContent = `${filtered.length} 件 / 全 ${cases.length} 件`;
  }

  // ---------- modal ----------
  function openModal(caseObj) {
    form.reset();
    $('caseId').value = '';
    if (caseObj) {
      $('modalTitle').textContent = '案件編集';
      $('caseId').value = caseObj.id;
      $('receivedDate').value = caseObj.receivedDate || '';
      $('theater').value = caseObj.theater || '';
      $('tcPerson').value = caseObj.tcPerson || '';
      $('rPerson').value = caseObj.rPerson || '';
      $('surveyDate').value = caseObj.surveyDate || '';
      $('quoteDate').value = caseObj.quoteDate || '';
      $('category').value = caseObj.category || '';
      $('status').value = caseObj.status || '受付';
      $('workStartDate').value = caseObj.workStartDate || '';
      $('workEndDate').value = caseObj.workEndDate || '';
      $('content').value = caseObj.content || '';
    } else {
      $('modalTitle').textContent = '新規案件作成';
      $('receivedDate').value = todayStr();
      $('status').value = '受付';
    }
    renderDatalists();
    modal.classList.remove('hidden');
    setTimeout(() => $('theater').focus(), 50);
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  // ---------- handlers ----------
  $('newCaseBtn').addEventListener('click', () => openModal(null));
  $('closeModal').addEventListener('click', closeModal);
  $('cancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('caseId').value || String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const data = {
      id: id,
      receivedDate: $('receivedDate').value,
      theater: $('theater').value.trim(),
      tcPerson: $('tcPerson').value.trim(),
      rPerson: $('rPerson').value.trim(),
      surveyDate: $('surveyDate').value,
      quoteDate: $('quoteDate').value,
      category: $('category').value,
      status: $('status').value,
      workStartDate: $('workStartDate').value,
      workEndDate: $('workEndDate').value,
      content: $('content').value.trim(),
      updatedAt: new Date().toISOString()
    };

    addToHistory('theaters', data.theater);
    addToHistory('tcPersons', data.tcPerson);
    addToHistory('rPersons', data.rPerson);
    saveHistory();

    const existing = cases.findIndex((c) => c.id === id);
    if (existing >= 0) {
      cases[existing] = data;
    } else {
      cases.push(data);
    }
    saveCases();
    closeModal();
    render();
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const c = cases.find((x) => x.id === id);
    if (!c) return;

    if (action === 'edit') {
      openModal(c);
    } else if (action === 'delete') {
      if (confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) {
        cases = cases.filter((x) => x.id !== id);
        saveCases();
        render();
      }
    }
  });

  searchBox.addEventListener('input', render);
  statusFilter.addEventListener('change', render);

  $('exportBtn').addEventListener('click', () => {
    const headers = ['受付日', '劇場名', 'TC担当者', 'R担当者', '調査日', '見積り提出日', '種別', '内容', 'ステータス', '作業開始日', '作業完了日'];
    const rows = cases.map((c) => [
      c.receivedDate, c.theater, c.tcPerson, c.rPerson,
      c.surveyDate, c.quoteDate, c.category, c.content,
      c.status, c.workStartDate, c.workEndDate
    ]);
    const csv = [headers, ...rows].map((row) =>
      row.map((v) => {
        const s = (v == null ? '' : String(v));
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',')
    ).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toho-cases-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ---------- init ----------
  renderDatalists();
  render();
})();
