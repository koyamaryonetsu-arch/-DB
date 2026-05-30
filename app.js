(function () {
  'use strict';

  const STORAGE_KEY = 'tohoCasesV1';
  const HISTORY_KEY = 'tohoHistoryV1';
  const AUTH_KEY = 'tohoAuthV1';
  const TEAM_KEY = 'tohoTeamV1';
  const COMPANY_KEY = 'tohoCompaniesV1';

  // 会社（顧客）と劇場名表示用の略称。name=正式名 / abbr=略称
  const DEFAULT_COMPANIES = [
    { name: 'TOHOシネマズ',       abbr: 'TOHO' },
    { name: '109シネマズ',        abbr: '109' },
    { name: 'ユナイテッドシネマ', abbr: 'UC' },
    { name: '佐々木興業',         abbr: 'CS' },
    { name: 'コロナワールド',     abbr: 'コロナ' },
    { name: 'MOVIX',              abbr: 'MV' },
    { name: 'イオンシネマズ',     abbr: 'イオン' }
  ];
  const CATEGORIES = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'その他'];
  // 色判定を除外するカテゴリ
  const NO_COLOR_CATEGORIES = new Set(['更新案件', 'その他']);
  const DEFAULT_MARGIN_RATE = 20;
  // 経営集計のデフォルトチームと配分ルール
  const DEFAULT_TEAM = ['小山', '細萱', '大和', '山口', '金子', '若山', '伊藤', '藤村', '山本'];
  const EXCLUDED_FROM_BASE = '山本'; // 一律5%対象外
  const SMALL_CASE_THRESHOLD = 3000000;
  const BASE_RATE = 5; // %
  const PRIVILEGED_DOMAIN = 'ryonetsu.com';

  // 役割別ラベル: 受注者(ryonetsu) ↔ 発注者(TOHO)
  const ROLE_STATUS = {
    ryo:  { '見積り提出済': '見積り提出済', '請求済': '請求済',          '入金済': '入金済' },
    toho: { '見積り提出済': '見積り受領済', '請求済': '請求書受領済',    '入金済': '支払済' }
  };
  const STATUS_FILTER_OPTIONS_RYO  = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済'];
  const STATUS_FILTER_OPTIONS_TOHO = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済']; // values unchanged; labels swap

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

  const EDITABLE_FIELDS = {
    company:        { type: 'select',   dynamicOptions: 'company', privilegedOnly: true },
    theater:        { type: 'datalist', listId: 'theaterList' },
    receivedDate:   { type: 'date' },
    tcPerson:       { type: 'datalist', listId: 'tcPersonList' },
    rPerson:        { type: 'datalist', listId: 'rPersonList' },
    category:       { type: 'select',   options: [''].concat(CATEGORIES) },
    content:        { type: 'popup' },
    surveyDate:     { type: 'date' },
    certNumber:     { type: 'text',     tohoOnly: true },
    estimateName:   { type: 'text' },
    estimateAmount: { type: 'number' },
    quoteDate:      { type: 'date' },
    workStartDate:  { type: 'date' },
    workEndDate:    { type: 'date' },
    invoiceDate:    { type: 'date' },
    paymentDate:    { type: 'date' },
    memo:           { type: 'textarea', privilegedOnly: true }
  };

  let cases = loadCases();
  let history = loadHistory();
  let companies = loadCompanies();
  let currentUser = loadAuth();
  let sortState = { field: null, direction: 'asc' };
  let contentEditCaseId = null;
  let aggMode = false;          // A集計表示モードか
  let NORMAL_THEAD_HTML = '';   // 通常モードのthead復元用

  const $ = (id) => document.getElementById(id);

  // ---------- storage ----------
  function loadCases() {
    let arr = [];
    let needResave = false;
    try {
      arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      if (!Array.isArray(arr)) { arr = []; needResave = true; }
    } catch (e) { arr = []; needResave = true; console.warn('案件データのJSONが破損していたため空で復旧'); }
    if (needResave) try { localStorage.setItem(STORAGE_KEY, '[]'); } catch (e) {}
    arr.forEach((c) => {
      if (!c.company) c.company = 'TOHOシネマズ';
      if (c.invoiceDate === undefined) c.invoiceDate = '';
      if (c.paymentDate === undefined) c.paymentDate = '';
      if (c.estimateName === undefined) c.estimateName = '';
      if (c.estimateAmount === undefined) c.estimateAmount = '';
      if (c.memo === undefined) c.memo = '';
      if (c.certNumber === undefined) c.certNumber = '';
      if (c.marginRate === undefined || c.marginRate === null || c.marginRate === '') c.marginRate = DEFAULT_MARGIN_RATE;
      if (!c.allocations || typeof c.allocations !== 'object') c.allocations = {};
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

  // ---------- 会社（顧客）マスタ ----------
  function loadCompanies() {
    try {
      const stored = JSON.parse(localStorage.getItem(COMPANY_KEY));
      if (Array.isArray(stored) && stored.length > 0) {
        // 旧データ救済: 略称が無ければ正式名で補完
        return stored.map((c) => ({ name: c.name, abbr: c.abbr || c.name }));
      }
    } catch (e) {}
    return DEFAULT_COMPANIES.map((c) => ({ name: c.name, abbr: c.abbr }));
  }
  function saveCompanies(list) { localStorage.setItem(COMPANY_KEY, JSON.stringify(list)); }
  function companyNames() { return companies.map((c) => c.name); }
  function companyAbbr(name) {
    const found = companies.find((c) => c.name === name);
    return found ? found.abbr : (name || '');
  }
  // CSSクラスに安全な文字列化（スペース・記号を_に）
  function safeClass(s) {
    return String(s || '').replace(/[^A-Za-z0-9_぀-ゟ゠-ヿ一-鿿]/g, '_');
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
  function fillDatalist(id, items) {
    const dl = $(id); dl.innerHTML = '';
    items.forEach((v) => { const o = document.createElement('option'); o.value = v; dl.appendChild(o); });
  }
  function renderDatalists() {
    fillDatalist('theaterList', history.theaters);
    fillDatalist('tcPersonList', history.tcPersons);
    fillDatalist('rPersonList', history.rPersons);
  }
  // 会社セレクト（モーダル/フィルタ）を会社マスタから再構築
  function populateCompanySelects() {
    const sel = $('company');
    const prevSel = sel.value;
    sel.innerHTML = companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (prevSel && companyNames().indexOf(prevSel) !== -1) sel.value = prevSel;

    const filter = $('companyFilter');
    const prevFilter = filter.value;
    filter.innerHTML = '<option value="">全会社</option>' +
      companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}（${escapeHtml(companyAbbr(n))}）</option>`).join('');
    if (prevFilter && (prevFilter === '' || companyNames().indexOf(prevFilter) !== -1)) filter.value = prevFilter;
  }
  function addCompany() {
    const name = prompt('追加する顧客（会社）の正式名称を入力してください');
    if (!name || !name.trim()) return;
    const nm = name.trim();
    if (companyNames().indexOf(nm) !== -1) { alert('既に登録されています: ' + nm); return; }
    const abbrInput = prompt('一覧表示用の略称（短縮名）を入力してください', nm.slice(0, 4));
    const abbr = (abbrInput && abbrInput.trim()) ? abbrInput.trim() : nm;
    companies.push({ name: nm, abbr: abbr });
    saveCompanies(companies);
    populateCompanySelects();
    $('company').value = nm;
  }

  // ---------- auth ----------
  // ---------- team ----------
  function loadTeam() {
    try {
      const t = JSON.parse(localStorage.getItem(TEAM_KEY));
      return Array.isArray(t) && t.length > 0 ? t : DEFAULT_TEAM.slice();
    } catch (e) { return DEFAULT_TEAM.slice(); }
  }
  function saveTeam(team) { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); }

  function defaultAllocations(c, team) {
    const amount = Number(c.estimateAmount) || 0;
    const result = {};
    team.forEach((m) => { result[m] = 0; });
    if (amount > 0 && amount < SMALL_CASE_THRESHOLD) {
      const eligible = team.filter((m) => m !== EXCLUDED_FROM_BASE);
      eligible.forEach((m) => { result[m] = BASE_RATE; });
      const base = eligible.length * BASE_RATE;
      // チームが大きい(>20人)場合は5%ずつで既に100%超 → 残差0以下にしない
      const residual = Math.max(0, 100 - base);
      // R担当者 名前が team に含まれていれば残差を加算
      if (c.rPerson && team.indexOf(c.rPerson) !== -1) {
        result[c.rPerson] = (result[c.rPerson] || 0) + residual;
      }
      // team外なら残差は未配分 → sumが100未満になりNG表示
    }
    return result;
  }
  // 表示用: チームメンバー分を返す。未知メンバーのデータは破壊せず保持される(stored側)
  function getAllocations(c, team) {
    const stored = c.allocations || {};
    const hasAny = Object.keys(stored).some((k) => Number(stored[k]) > 0);
    if (hasAny) {
      const result = {};
      team.forEach((m) => { result[m] = Number(stored[m]) || 0; });
      return result;
    }
    return defaultAllocations(c, team);
  }
  function sumAllocations(alloc) {
    return Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  function loadAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; } }
  function saveAuth(user) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
  function clearAuth() { localStorage.removeItem(AUTH_KEY); }
  function isPrivileged(user) { return !!(user && user.domain === PRIVILEGED_DOMAIN); }
  function attemptLogin(email, password) {
    const e = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, msg: 'メールアドレスの形式が正しくありません。' };
    const local = e.split('@')[0];
    const domain = e.split('@')[1];
    if (!local) return { ok: false, msg: 'メールアドレスが不正です。' };
    if ((password || '').toLowerCase() !== local.toLowerCase()) return { ok: false, msg: 'パスワードが正しくありません。' };
    return { ok: true, user: { email: e, domain: domain, loginAt: new Date().toISOString() } };
  }

  // ---------- date helpers ----------
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
  function lastDayOfMonth(yearMonth) {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m, 0);
    return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // MM/DD 形式で表示（テーブル用）
  function fmtDateShort(s) {
    if (!s) return '';
    const p = s.split('-');
    if (p.length === 3) return `${p[1]}/${p[2]}`;
    return s;
  }
  // YYYY/MM/DD 形式（編集中表示・モーダル用）
  function fmtDateFull(s) {
    if (!s) return '';
    return s.replace(/-/g, '/');
  }
  // 各種入力を YYYY-MM-DD に正規化
  // 例: 528 / 0528 / 5/28 / 5-28 / 20260528 / 2026/5/28 / 2026-5-28
  function parseSmartDate(input) {
    if (input == null) return '';
    const s = String(input).trim().replace(/\s/g, '');
    if (!s) return '';
    const cy = new Date().getFullYear();
    let m;
    // YYYY/MM/DD / YYYY-MM-DD / YYYY.MM.DD
    m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) return validISO(+m[1], +m[2], +m[3]);
    // YYYYMMDD (8桁)
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return validISO(+m[1], +m[2], +m[3]);
    // MM/DD / M/D / MM-DD
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    // MMDD (4桁)
    m = s.match(/^(\d{2})(\d{2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    // MDD (3桁) → M-DD
    m = s.match(/^(\d{1})(\d{2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    return null;
  }
  function validISO(y, mo, d) {
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // ---------- status auto-derive ----------
  // メモに「保留」が含まれるか。ただし明示的な否定/解除文言は除外
  // 例: 保留 / 保留中 / 要保留対応 → 保留扱い
  //     保留しない / 保留解除 / 保留中止 / 保留終了 / 保留不要 → 通常扱い
  function memoHasHold(memo) {
    if (!memo) return false;
    if (!/保留/.test(memo)) return false;
    if (/保留(?:しない|しません|解除|中止|終了|不要|なし|無し)/.test(memo)) return false;
    return true;
  }
  function deriveStatus(c) {
    // メモに「保留」と記入されていたら最優先で 保留
    if (memoHasHold(c.memo)) return '保留';
    const today = todayStr();
    if (c.paymentDate)  return '入金済';
    if (c.invoiceDate)  return '請求済';
    if (c.workEndDate)  return '完了';
    if (c.workStartDate && c.workStartDate <= today) return '作業中';
    if (c.quoteDate && c.quoteDate <= today)         return '見積り提出済';
    if (c.surveyDate && c.surveyDate <= today)       return '見積り中';
    return '受付';
  }
  function statusDisplayLabel(code) {
    const map = isPrivileged(currentUser) ? ROLE_STATUS.ryo : ROLE_STATUS.toho;
    return map[code] || code;
  }

  function rowColorClass(c) {
    if (NO_COLOR_CATEGORIES.has(c.category)) return '';
    if (deriveStatus(c) === '保留') return '';
    if (c.quoteDate) return '';
    const today = todayStr();
    if (c.surveyDate) {
      const dRed = daysBetween(c.surveyDate, today);
      if (dRed !== null && dRed >= 3) return 'row-red';
      const dYellow = daysBetween(c.receivedDate, c.surveyDate);
      if (dYellow !== null && dYellow >= 3) return 'row-yellow';
      return '';
    }
    if (c.receivedDate) {
      const d = daysBetween(c.receivedDate, today);
      if (d !== null && d >= 3) return 'row-yellow';
    }
    return '';
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtAmount(n) {
    if (n === '' || n == null) return '';
    const num = Number(n);
    if (isNaN(num)) return escapeHtml(n);
    return '¥' + num.toLocaleString('ja-JP');
  }
  function fmtPercent(n) {
    if (n === '' || n == null) return '';
    const num = Number(n);
    if (isNaN(num)) return escapeHtml(n);
    // 整数なら整数表示、小数なら1桁
    return (num % 1 === 0 ? num : num.toFixed(1)) + '%';
  }

  // ---------- sort ----------
  function getSortValue(c, field) {
    if (field === 'status') return deriveStatus(c);
    if (field === 'estimateAmount') {
      const n = Number(c.estimateAmount);
      return isNaN(n) ? -Infinity : n;
    }
    return c[field] != null ? c[field] : '';
  }
  function sortCases(arr) {
    if (!sortState.field) {
      return arr.sort((a, b) => {
        const av = a.receivedDate || '', bv = b.receivedDate || '';
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        return bv.localeCompare(av);
      });
    }
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      const av = getSortValue(a, sortState.field), bv = getSortValue(b, sortState.field);
      const aE = (av === '' || av == null), bE = (bv === '' || bv == null);
      if (aE && bE) return 0;
      if (aE) return 1;
      if (bE) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'ja') * dir;
    });
  }
  function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (sortState.field === th.dataset.sort) {
        th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  // ---------- filter ----------
  function getFilteredCases() {
    const q = $('searchBox').value.trim().toLowerCase();
    const sf = $('statusFilter').value;
    const cf = isPrivileged(currentUser) ? $('companyFilter').value : 'TOHOシネマズ';
    const filtered = cases.filter((c) => {
      if (cf && c.company !== cf) return false;
      if (sf && deriveStatus(c) !== sf) return false;
      if (!q) return true;
      const hayArr = [c.company, c.theater, c.tcPerson, c.rPerson, c.category, c.content,
        c.certNumber, c.estimateName, String(c.estimateAmount || ''),
        c.receivedDate, c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate,
        deriveStatus(c), statusDisplayLabel(deriveStatus(c))];
      // memo は ryonetsu ユーザーのみ検索対象（情報漏洩防止）
      if (isPrivileged(currentUser)) hayArr.push(c.memo);
      const hay = hayArr.map((x) => (x || '').toString().toLowerCase()).join(' ');
      return hay.includes(q);
    });
    return sortCases(filtered);
  }

  function editableTd(c, field, displayHtml, extraClass) {
    const cfg = EDITABLE_FIELDS[field];
    const canEdit = !(cfg.privilegedOnly && !isPrivileged(currentUser))
                  && !(cfg.tohoOnly && c.company !== 'TOHOシネマズ');
    const cls = (canEdit ? 'editable' : '') + (c[field] ? '' : ' empty') + (extraClass ? ' ' + extraClass : '');
    return `<td class="${cls}" data-field="${field}" data-case-id="${escapeHtml(c.id)}">${displayHtml}</td>`;
  }

  function render() {
    const filtered = getFilteredCases();
    const tbody = $('casesBody');
    tbody.innerHTML = '';
    const isToho = !isPrivileged(currentUser);
    filtered.forEach((c) => {
      const tr = document.createElement('tr');
      tr.dataset.caseId = c.id;
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;
      const statusCode = deriveStatus(c);
      const statusLabel = statusDisplayLabel(statusCode);
      const companyHtml = c.company ? `<span class="company-tag company-${safeClass(c.company)}" title="${escapeHtml(c.company)}">${escapeHtml(companyAbbr(c.company))}</span>` : '';
      const statusHtml = `<span class="status-badge status-${escapeHtml(statusCode)}">${escapeHtml(statusLabel)}</span>`;
      const isTohoCo = c.company === 'TOHOシネマズ';
      const certHtml = isTohoCo
        ? editableTd(c, 'certNumber', escapeHtml(c.certNumber))
        : `<td class="toho-empty">—</td>`;

      tr.innerHTML = `
        ${editableTd(c, 'company', companyHtml, 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(c.theater))}
        ${editableTd(c, 'receivedDate', fmtDateShort(c.receivedDate))}
        ${editableTd(c, 'tcPerson', escapeHtml(c.tcPerson))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'category', escapeHtml(c.category))}
        ${editableTd(c, 'content', escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'surveyDate', fmtDateShort(c.surveyDate))}
        ${certHtml}
        ${editableTd(c, 'estimateName', escapeHtml(c.estimateName))}
        ${editableTd(c, 'estimateAmount', fmtAmount(c.estimateAmount))}
        ${editableTd(c, 'quoteDate', fmtDateShort(c.quoteDate))}
        ${editableTd(c, 'workStartDate', fmtDateShort(c.workStartDate))}
        ${editableTd(c, 'workEndDate', fmtDateShort(c.workEndDate))}
        ${editableTd(c, 'invoiceDate', fmtDateShort(c.invoiceDate))}
        ${editableTd(c, 'paymentDate', fmtDateShort(c.paymentDate))}
        <td>${statusHtml}</td>
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
        <td class="row-actions">
          <button data-action="edit" data-id="${escapeHtml(c.id)}">編集</button>
          <button data-action="delete" data-id="${escapeHtml(c.id)}" class="danger">削除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    $('emptyMsg').classList.toggle('hidden', filtered.length > 0);
    const totalVisible = isPrivileged(currentUser) ? cases.length : cases.filter((c) => c.company === 'TOHOシネマズ').length;
    $('caseCount').textContent = `${filtered.length} 件 / 全 ${totalVisible} 件`;
    updateSortIndicators();
  }

  // ---------- inline edit ----------
  function startInlineEdit(td, c, field) {
    if (td.querySelector('.inline-edit')) return;
    const cfg = EDITABLE_FIELDS[field];
    if (!cfg) return;
    if (cfg.privilegedOnly && !isPrivileged(currentUser)) return;
    if (cfg.tohoOnly && c.company !== 'TOHOシネマズ') return;
    if (cfg.type === 'popup') { openContentModal(c); return; }

    const oldVal = c[field] != null ? c[field] : '';
    let el;
    switch (cfg.type) {
      case 'date':
        el = document.createElement('input');
        el.type = 'text';
        el.inputMode = 'numeric';
        el.placeholder = 'YYYY/MM/DD ・ MM/DD ・ 528 もOK';
        break;
      case 'number':
        el = document.createElement('input'); el.type = 'number'; el.min = '0'; el.step = '1'; break;
      case 'select': {
        el = document.createElement('select');
        const opts = cfg.dynamicOptions === 'company' ? companyNames() : cfg.options;
        opts.forEach((opt) => { const o = document.createElement('option'); o.value = opt; o.textContent = opt === '' ? '(未選択)' : opt; el.appendChild(o); });
        break;
      }
      case 'datalist': el = document.createElement('input'); el.type = 'text'; el.setAttribute('list', cfg.listId); break;
      case 'textarea': el = document.createElement('textarea'); el.rows = 2; break;
      default:         el = document.createElement('input'); el.type = 'text';
    }
    el.className = 'inline-edit' + (cfg.type === 'date' ? ' smart-date' : '');
    // 日付セルは編集中は YYYY/MM/DD で表示
    el.value = cfg.type === 'date' ? fmtDateFull(oldVal) : oldVal;
    td.innerHTML = '';
    td.appendChild(el);
    el.focus();
    if (el.select) try { el.select(); } catch (e) {}

    let done = false;
    let reEditing = false; // 不正日付で再入力中（重複起動防止）
    const commit = () => {
      if (done || reEditing) return;
      let newVal = el.value;
      if (typeof newVal === 'string') newVal = newVal.trim();

      if (cfg.type === 'date' && newVal !== '') {
        const parsed = parseSmartDate(newVal);
        if (parsed === null) {
          // 不正な日付は破棄せず、編集状態を維持して再入力させる（中断は Esc）
          reEditing = true;
          alert('日付として認識できません: ' + newVal + '\n例: 5/28 / 0528 / 2026/5/28');
          setTimeout(() => {
            reEditing = false;
            el.focus();
            if (el.select) try { el.select(); } catch (e) {}
          }, 0);
          return;
        }
        newVal = parsed;
      }
      done = true;
      if (cfg.type === 'number') newVal = (newVal === '' ? '' : Number(newVal));

      if (String(newVal) !== String(oldVal)) {
        c[field] = newVal;
        c.updatedAt = new Date().toISOString();
        let histChanged = false;
        if (field === 'theater') { addToHistory('theaters', newVal); histChanged = true; }
        if (field === 'tcPerson') { addToHistory('tcPersons', newVal); histChanged = true; }
        if (field === 'rPerson') { addToHistory('rPersons', newVal); histChanged = true; }
        if (histChanged) saveHistory();
        saveCases();
      }
      render();
    };
    const cancel = () => { if (done) return; done = true; render(); };

    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cfg.type !== 'textarea') { e.preventDefault(); el.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
  }

  // ---------- modal (new / edit) ----------
  function updateTohoVisibility() {
    const isToho = $('company').value === 'TOHOシネマズ';
    document.querySelectorAll('.toho-only-field').forEach((el) => el.classList.toggle('hidden', !isToho));
  }
  function setDateField(id, iso) { $(id).value = fmtDateFull(iso); }
  function readDateField(id, label) {
    const raw = $(id).value.trim();
    if (raw === '') return '';
    const parsed = parseSmartDate(raw);
    if (parsed === null) {
      alert(`${label}の日付が認識できません: ${raw}\n例: 5/28 / 0528 / 2026/5/28`);
      $(id).focus();
      $(id).classList.add('invalid');
      return undefined;
    }
    $(id).classList.remove('invalid');
    return parsed;
  }
  function openModal(caseObj, mode) {
    const form = $('caseForm');
    form.reset();
    document.querySelectorAll('.smart-date').forEach(el => el.classList.remove('invalid'));
    $('caseId').value = '';
    const realMode = mode || 'full';
    const isSimple = realMode === 'simple';
    document.querySelectorAll('[data-mode="full"]').forEach((el) => el.classList.toggle('hidden', isSimple));

    if (isPrivileged(currentUser)) {
      $('company').disabled = false;
    } else {
      $('company').value = 'TOHOシネマズ';
      $('company').disabled = true;
    }

    if (caseObj) {
      $('modalTitle').textContent = '案件編集';
      $('caseId').value = caseObj.id;
      $('company').value = caseObj.company || 'TOHOシネマズ';
      $('theater').value = caseObj.theater || '';
      setDateField('receivedDate', caseObj.receivedDate);
      $('tcPerson').value = caseObj.tcPerson || '';
      $('rPerson').value = caseObj.rPerson || '';
      $('category').value = caseObj.category || '';
      $('content').value = caseObj.content || '';
      setDateField('surveyDate', caseObj.surveyDate);
      $('certNumber').value = caseObj.certNumber || '';
      $('estimateName').value = caseObj.estimateName || '';
      $('estimateAmount').value = caseObj.estimateAmount || '';
      setDateField('quoteDate', caseObj.quoteDate);
      setDateField('workStartDate', caseObj.workStartDate);
      setDateField('workEndDate', caseObj.workEndDate);
      setDateField('invoiceDate', caseObj.invoiceDate);
      setDateField('paymentDate', caseObj.paymentDate);
      $('memo').value = caseObj.memo || '';
    } else {
      $('modalTitle').textContent = isSimple ? '簡易登録' : '新規案件登録';
      $('company').value = 'TOHOシネマズ';
      setDateField('receivedDate', todayStr());
    }
    updateTohoVisibility();
    renderDatalists();
    populateCompanySelects();
    if (caseObj) $('company').value = caseObj.company || companyNames()[0];
    else if (!isPrivileged(currentUser)) $('company').value = 'TOHOシネマズ';
    $('modal').classList.remove('hidden');
    setTimeout(() => $('company').focus(), 50);
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  // ---------- content popup ----------
  function openContentModal(c) {
    contentEditCaseId = c.id;
    $('contentEditor').value = c.content || '';
    $('contentModal').classList.remove('hidden');
    setTimeout(() => $('contentEditor').focus(), 50);
  }
  function closeContentModal() { $('contentModal').classList.add('hidden'); contentEditCaseId = null; }
  function saveContentFromModal() {
    if (!contentEditCaseId) return;
    const c = cases.find((x) => x.id === contentEditCaseId);
    if (c) {
      const newVal = $('contentEditor').value.trim();
      if (newVal !== (c.content || '')) {
        c.content = newVal;
        c.updatedAt = new Date().toISOString();
        saveCases();
        render();
      }
    }
    closeContentModal();
  }

  // ---------- CSV export ----------
  function downloadCSV(filename, rows) {
    const csv = rows.map((row) =>
      row.map((v) => {
        const s = (v == null ? '' : String(v));
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',')
    ).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function exportFiltered() {
    const filtered = getFilteredCases();
    if (filtered.length === 0) { alert('現在の絞り込み条件に一致する案件がありません。'); return; }
    const includesMemo = isPrivileged(currentUser);
    const isToho = !includesMemo;
    const headers = ['会社', '劇場名', '受付日', 'TC担当者', 'R担当者', '種別', '内容',
      '調査日', '認証番号', '見積り名', '見積り金額',
      isToho ? '見積り受領日' : '見積り提出日',
      '作業開始日', '作業完了日',
      isToho ? '請求書受領日' : '請求書発行日',
      isToho ? '支払日' : '入金日',
      'ステータス'];
    if (includesMemo) headers.push('メモ');
    const rows = [headers].concat(filtered.map((c) => {
      const row = [c.company, c.theater, c.receivedDate, c.tcPerson, c.rPerson, c.category, c.content,
        c.surveyDate, c.company === 'TOHOシネマズ' ? c.certNumber : '',
        c.estimateName, c.estimateAmount,
        c.quoteDate, c.workStartDate, c.workEndDate,
        c.invoiceDate, c.paymentDate, statusDisplayLabel(deriveStatus(c))];
      if (includesMemo) row.push(c.memo);
      return row;
    }));
    downloadCSV(`cinema-cases-${todayStr()}.csv`, rows);
  }

  // ---------- invoice generation (JSZip preserves drawings/VML/seals) ----------
  function base64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function xmlEscape(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function setCellInline(xml, ref, value) {
    const escaped = xmlEscape(value);
    const re = new RegExp(`<c r="${ref}"([^/]*?)(/>|>[\\s\\S]*?</c>)`);
    // セルが見つからなければ黙って空欄を作らず、明確にエラーにする（テンプレ変更検知）
    if (!re.test(xml)) throw new Error(`テンプレートのセル ${ref} が見つかりません（書式が変わった可能性）`);
    return xml.replace(re, (_, attrs) => {
      const a = attrs.replace(/\s+t="[^"]*"/, '');
      return `<c r="${ref}"${a} t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`;
    });
  }
  function setCellNumber(xml, ref, num) {
    const safe = Number.isFinite(num) ? num : 0;
    const re = new RegExp(`<c r="${ref}"([^/]*?)(/>|>[\\s\\S]*?</c>)`);
    if (!re.test(xml)) throw new Error(`テンプレートのセル ${ref} が見つかりません（書式が変わった可能性）`);
    return xml.replace(re, (_, attrs) => {
      const a = attrs.replace(/\s+t="[^"]*"/, '');
      return `<c r="${ref}"${a}><v>${safe}</v></c>`;
    });
  }
  async function buildInvoiceXlsx(c) {
    const zip = await JSZip.loadAsync(base64ToArrayBuffer(window.TEMPLATE_INVOICE_B64));
    let sheet = await zip.file('xl/worksheets/sheet2.xml').async('string');
    sheet = setCellInline(sheet, 'A21', fmtDateFull(c.workEndDate));
    sheet = setCellInline(sheet, 'D21', `${c.theater} ${c.estimateName}`);
    sheet = setCellNumber(sheet, 'AK21', Number(c.estimateAmount) || 0);
    sheet = setCellInline(sheet, 'B6', c.company);
    zip.file('xl/worksheets/sheet2.xml', sheet);
    let styles = await zip.file('xl/styles.xml').async('string');
    styles = styles.replace(/FFFF0000/g, 'FF000000');
    zip.file('xl/styles.xml', styles);
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }
  async function buildCompletionXlsx(c) {
    const zip = await JSZip.loadAsync(base64ToArrayBuffer(window.TEMPLATE_COMPLETION_B64));
    let sheet = await zip.file('xl/worksheets/sheet2.xml').async('string');
    sheet = setCellInline(sheet, 'H14', `${c.theater} ${c.estimateName}`);
    sheet = setCellInline(sheet, 'H17', `${c.theater}（住所を手動でご記入ください）`);
    sheet = setCellNumber(sheet, 'H20', Number(c.estimateAmount) || 0);
    sheet = setCellInline(sheet, 'H23', fmtDateFull(c.workStartDate));
    sheet = setCellInline(sheet, 'S23', fmtDateFull(c.workEndDate));
    sheet = setCellInline(sheet, 'H26', fmtDateFull(c.workStartDate));
    sheet = setCellInline(sheet, 'H29', fmtDateFull(c.workEndDate));
    if (c.company !== 'TOHOシネマズ') {
      sheet = setCellInline(sheet, 'B7', `${c.company}株式会社　御中`);
    }
    zip.file('xl/worksheets/sheet2.xml', sheet);
    let styles = await zip.file('xl/styles.xml').async('string');
    styles = styles.replace(/FFFF0000/g, 'FF000000');
    zip.file('xl/styles.xml', styles);
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }
  function casesMatchingMonth(yearMonth) {
    if (!yearMonth) return [];
    return getFilteredCases().filter((c) => {
      if (!c.workEndDate) return false;
      if (!c.estimateName || c.estimateAmount === '' || c.estimateAmount == null) return false;
      return c.workEndDate.slice(0, 7) === yearMonth;
    });
  }
  function updateInvoicePreview() {
    const month = $('invoiceMonth').value;
    const list = $('invoicePreviewList');
    const empty = $('invoicePreviewEmpty');
    const count = $('invoicePreviewCount');
    list.innerHTML = '';
    const matches = casesMatchingMonth(month);
    count.textContent = `(${matches.length} 件)`;
    if (matches.length === 0) {
      empty.classList.remove('hidden');
      $('invoiceGenerateBtn').disabled = true;
    } else {
      empty.classList.add('hidden');
      $('invoiceGenerateBtn').disabled = false;
      matches.forEach((c) => {
        const li = document.createElement('li');
        li.innerHTML = `${escapeHtml(c.theater)} ／ ${escapeHtml(c.estimateName)} <span class="case-amount">${fmtAmount(c.estimateAmount)}</span>`;
        list.appendChild(li);
      });
    }
  }
  function openInvoiceModal() {
    const month = currentMonth();
    $('invoiceMonth').value = month;
    $('invoiceIssueDate').value = fmtDateFull(lastDayOfMonth(month));
    updateInvoicePreview();
    $('invoiceModal').classList.remove('hidden');
  }
  function closeInvoiceModal() { $('invoiceModal').classList.add('hidden'); }
  function safeFilename(s) { return String(s || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_'); }
  async function generateInvoices() {
    const month = $('invoiceMonth').value;
    const issueIso = parseSmartDate($('invoiceIssueDate').value);
    if (!month || !issueIso) { alert('発行月と発行日を指定してください。'); return; }
    const matches = casesMatchingMonth(month);
    if (matches.length === 0) { alert('対象の案件がありません。'); return; }
    if (typeof JSZip === 'undefined') { alert('JSZipライブラリの読み込みに失敗しました。'); return; }
    $('invoiceGenerateBtn').disabled = true;
    $('invoiceGenerateBtn').textContent = '生成中...';
    try {
      // 1) まずZIPを完全に生成（途中で失敗してもデータには触れない）
      const zip = new JSZip();
      for (const c of matches) {
        const invBlob = await buildInvoiceXlsx(c);
        const comBlob = await buildCompletionXlsx(c);
        const tag = `${safeFilename(c.theater)}_${safeFilename(c.estimateName)}`;
        zip.file(`請求書_${tag}.xlsx`, invBlob);
        zip.file(`完了届_${tag}.xlsx`, comBlob);
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      // 2) ここまで来たら成功確定。請求書発行日を全件まとめて更新→保存
      const nowIso = new Date().toISOString();
      matches.forEach((c) => { c.invoiceDate = issueIso; c.updatedAt = nowIso; });
      saveCases();
      // 3) ダウンロード
      triggerDownload(blob, `請求書セット_${month}.zip`);
      closeInvoiceModal();
      render();
      alert(`${matches.length} 件生成し、請求書発行日を ${fmtDateFull(issueIso)} に更新しました。`);
    } catch (err) {
      console.error(err);
      alert('生成中にエラー: ' + (err.message || err));
    } finally {
      $('invoiceGenerateBtn').disabled = false;
      $('invoiceGenerateBtn').textContent = '発行（ZIPダウンロード）';
    }
  }

  // ---------- A集計 (粗利配分・メインテーブル切替) ----------
  // 会計年度（菱熱: 10月〜翌9月）。受付日の年度開始年を返す
  function fiscalYearOf(dateStr) {
    if (!dateStr) return null;
    const [y, m] = dateStr.split('-').map(Number);
    if (!y || !m) return null;
    return m >= 10 ? y : y - 1;
  }
  function fiscalYearLabel(fy) {
    return `${fy}年度（${fy}/10〜${fy + 1}/9）`;
  }
  function currentFiscalYear() {
    const d = new Date();
    return (d.getMonth() + 1) >= 10 ? d.getFullYear() : d.getFullYear() - 1;
  }
  // 見込み / 実績 / 予想 の区分（完了日の有無のみで判定）
  function aggSection(c) {
    if (!c.workEndDate) return 'mikomi';            // 見込み: 作業完了日が未入力
    return c.workEndDate <= todayStr() ? 'jisseki'  // 実績: 完了日が本日以前
                                       : 'yosou';   // 予想: 完了日が本日以降
  }
  const SECTION_DEF = {
    mikomi:  { label: '見込み', cls: 'section-mikomi', badge: 'badge-mikomi' },
    jisseki: { label: '実績',   cls: 'section-jisseki', badge: 'badge-jisseki' },
    yosou:   { label: '予想',   cls: 'section-yosou', badge: 'badge-yosou' }
  };

  function caseProfit(c) {
    const amt = Number(c.estimateAmount) || 0;
    const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
    return amt * rate / 100;
  }

  // 選択年度＋既存フィルタ後、金額>0 の案件
  function aggTargetCases() {
    const fy = $('aggFY') && $('aggFY').value;
    return getFilteredCases().filter((c) => {
      if ((Number(c.estimateAmount) || 0) <= 0) return false;
      if (!fy || fy === 'all') return true;
      return String(fiscalYearOf(c.receivedDate)) === String(fy);
    });
  }

  // 年度プルダウンを（データに存在する年度＋今年度で）構築
  function populateFiscalYears() {
    const sel = $('aggFY');
    const prev = sel.value;
    const years = new Set();
    years.add(currentFiscalYear());
    cases.forEach((c) => { const fy = fiscalYearOf(c.receivedDate); if (fy != null) years.add(fy); });
    const sorted = Array.from(years).sort((a, b) => b - a);
    sel.innerHTML = '<option value="all">全年度</option>' +
      sorted.map((y) => `<option value="${y}">${fiscalYearLabel(y)}</option>`).join('');
    // デフォルトは今年度
    sel.value = (prev && [...sel.options].some(o => o.value === prev)) ? prev : String(currentFiscalYear());
  }

  function renderAggTable() {
    const table = $('casesTable');
    const thead = table.querySelector('thead');
    const team = loadTeam();
    const targets = aggTargetCases();

    // ===== ヘッダ行 =====
    const headerCells = `
      <th>劇場名</th>
      <th>見積り名</th>
      <th>見積り金額</th>
      <th>配分集計</th>
      <th>粗利率</th>
      ${team.map((m) => `<th class="agg-member" data-member="${escapeHtml(m)}">${escapeHtml(m)}<button class="agg-rm-member" data-member="${escapeHtml(m)}" title="削除">×</button></th>`).join('')}`;

    // ===== 区分別 集計行（見込み/実績/予想） =====
    const sections = ['mikomi', 'jisseki', 'yosou'];
    const sectionTotals = {};
    sections.forEach((s) => {
      sectionTotals[s] = { count: 0, amount: 0, profit: 0, members: {} };
      team.forEach((m) => { sectionTotals[s].members[m] = 0; });
    });
    targets.forEach((c) => {
      const s = aggSection(c);
      const amt = Number(c.estimateAmount) || 0;
      const profit = caseProfit(c);
      const alloc = getAllocations(c, team);
      sectionTotals[s].count++;
      sectionTotals[s].amount += amt;
      sectionTotals[s].profit += profit;
      team.forEach((m) => { sectionTotals[s].members[m] += profit * (Number(alloc[m]) || 0) / 100; });
    });

    const summaryRows = sections.map((s) => {
      const t = sectionTotals[s];
      const def = SECTION_DEF[s];
      return `<tr class="agg-summary-row ${def.cls}">
        <th class="agg-sec-label" colspan="2">${def.label}　${t.count}件</th>
        <th>${fmtAmount(t.amount)}</th>
        <th>粗利A→</th>
        <th>${fmtAmount(t.profit)}</th>
        ${team.map((m) => `<th>${fmtAmount(t.members[m])}</th>`).join('')}
      </tr>`;
    }).join('');

    thead.innerHTML = `<tr id="aggHeaderRow">${headerCells}</tr>${summaryRows}`;

    // ===== 案件行（区分順 → 受付日順） =====
    const order = { mikomi: 0, jisseki: 1, yosou: 2 };
    const sorted = targets.slice().sort((a, b) => {
      const sa = order[aggSection(a)], sb = order[aggSection(b)];
      if (sa !== sb) return sa - sb;
      return (b.receivedDate || '').localeCompare(a.receivedDate || '');
    });

    const tbody = $('casesBody');
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${5 + team.length}" class="agg-empty">対象案件がありません。</td></tr>`;
    } else {
      tbody.innerHTML = sorted.map((c) => {
        const amt = Number(c.estimateAmount) || 0;
        const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
        const alloc = getAllocations(c, team);
        const sum = sumAllocations(alloc);
        const okClass = Math.abs(sum - 100) < 0.01 ? 'ok' : 'ng';
        const okText = okClass === 'ok' ? '✓OK' : '✗NG';
        const sec = SECTION_DEF[aggSection(c)];
        return `<tr data-case-id="${escapeHtml(c.id)}">
          <td class="agg-case-name"><span class="agg-section-badge ${sec.badge}">${sec.label}</span>${escapeHtml(c.theater)}</td>
          <td>${escapeHtml(c.estimateName || '-')}</td>
          <td class="agg-amount">${fmtAmount(amt)}</td>
          <td class="agg-sum ${okClass}">${sum.toFixed(1)}% ${okText}</td>
          <td><input type="number" data-field="marginRate" min="0" max="100" step="0.1" value="${rate}" class="agg-input agg-rate"></td>
          ${team.map((m) => `<td><input type="number" data-member="${escapeHtml(m)}" min="0" max="100" step="1" value="${alloc[m] || 0}" class="agg-input"></td>`).join('')}
        </tr>`;
      }).join('');
    }
    $('caseCount').textContent = `A集計: ${targets.length} 件`;
  }

  function enterAggMode() {
    aggMode = true;
    document.body.classList.add('agg-active');
    $('casesTable').classList.add('agg-mode');
    $('aggBar').classList.remove('hidden');
    $('emptyMsg').classList.add('hidden');
    $('aggBtn').textContent = '✕ A集計を閉じる';
    populateFiscalYears();
    renderAggTable();
  }
  function exitAggMode() {
    aggMode = false;
    document.body.classList.remove('agg-active');
    $('casesTable').classList.remove('agg-mode');
    $('aggBar').classList.add('hidden');
    $('aggBtn').textContent = '📊 A集計';
    // thead を通常モードに復元
    $('casesTable').querySelector('thead').innerHTML = NORMAL_THEAD_HTML;
    render();
  }
  function toggleAggMode() { if (aggMode) exitAggMode(); else enterAggMode(); }

  function refresh() { if (aggMode) renderAggTable(); else render(); }

  // 配分 / 粗利率 の手動編集
  function handleAggInput(e) {
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('agg-input')) return;
    const tr = inp.closest('tr');
    if (!tr) return;
    const c = cases.find((x) => x.id === tr.dataset.caseId);
    if (!c) return;
    const team = loadTeam();
    // 既存の配分データを破壊しないように、デフォルトをマージで初期化
    if (!c.allocations || typeof c.allocations !== 'object') c.allocations = {};
    const hasAny = Object.keys(c.allocations).some((k) => Number(c.allocations[k]) > 0);
    if (!hasAny) {
      const def = defaultAllocations(c, team);
      Object.keys(def).forEach((k) => { if (!(k in c.allocations)) c.allocations[k] = def[k]; });
    }
    if (inp.dataset.field === 'marginRate') {
      const v = Number(inp.value);
      c.marginRate = isNaN(v) ? DEFAULT_MARGIN_RATE : v;
    } else if (inp.dataset.member) {
      const v = Number(inp.value);
      c.allocations[inp.dataset.member] = isNaN(v) ? 0 : v;
    }
    c.updatedAt = new Date().toISOString();
    saveCases();
    renderAggTable();
  }
  function addTeamMember() {
    const name = prompt('追加する担当者名を入力してください');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const team = loadTeam();
    if (team.indexOf(trimmed) !== -1) { alert('既に登録されています: ' + trimmed); return; }
    team.push(trimmed);
    saveTeam(team);
    renderAggTable();
  }
  function removeTeamMember(name) {
    if (!confirm(`担当者「${name}」を削除しますか？\n（各案件の配分データは保持され、再追加すれば復元されます）`)) return;
    saveTeam(loadTeam().filter((m) => m !== name));
    renderAggTable();
  }
  function redistributeSmallCases() {
    if (!confirm('300万円未満の案件すべての配分を初期ルールで再計算します。\n（チームメンバーの配分のみ上書き、削除済みメンバーのデータは保持）')) return;
    const team = loadTeam();
    cases.forEach((c) => {
      const amt = Number(c.estimateAmount) || 0;
      if (amt > 0 && amt < SMALL_CASE_THRESHOLD) {
        // 削除済みメンバーの保管値を残しつつ、現チームの配分のみ初期化
        const def = defaultAllocations(c, team);
        c.allocations = Object.assign({}, c.allocations || {}, def);
        c.updatedAt = new Date().toISOString();
      }
    });
    saveCases();
    renderAggTable();
  }
  function exportAggregation() {
    const team = loadTeam();
    const targets = aggTargetCases();
    if (targets.length === 0) { alert('対象案件がありません。'); return; }
    const rows = [['区分', '劇場名', '見積り名', '見積り金額', '配分計(%)', '判定', '粗利率(%)', '粗利A'].concat(team)];
    const sections = ['mikomi', 'jisseki', 'yosou'];
    const order = { mikomi: 0, jisseki: 1, yosou: 2 };
    const sectionTotals = {};
    sections.forEach((s) => { sectionTotals[s] = { count: 0, amount: 0, profit: 0, members: {} }; team.forEach((m) => sectionTotals[s].members[m] = 0); });
    targets.slice().sort((a, b) => order[aggSection(a)] - order[aggSection(b)]).forEach((c) => {
      const s = aggSection(c);
      const amt = Number(c.estimateAmount) || 0;
      const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
      const profit = caseProfit(c);
      const alloc = getAllocations(c, team);
      const sum = sumAllocations(alloc);
      sectionTotals[s].count++; sectionTotals[s].amount += amt; sectionTotals[s].profit += profit;
      team.forEach((m) => sectionTotals[s].members[m] += profit * (Number(alloc[m]) || 0) / 100);
      rows.push([SECTION_DEF[s].label, c.theater, c.estimateName || '-', amt, sum.toFixed(1),
        Math.abs(sum - 100) < 0.01 ? 'OK' : 'NG', rate, Math.round(profit)]
        .concat(team.map((m) => Number(alloc[m]) || 0)));
    });
    // 区分別 集計行
    sections.forEach((s) => {
      const t = sectionTotals[s];
      rows.push([`【${SECTION_DEF[s].label} 集計】`, t.count + '件', '', t.amount, '', '', '', Math.round(t.profit)]
        .concat(team.map((m) => Math.round(t.members[m]))));
    });
    downloadCSV(`A集計_${todayStr()}.csv`, rows);
  }

  // ---------- screens ----------
  function showLogin() {
    $('appShell').classList.add('hidden');
    $('loginScreen').classList.remove('hidden');
    setTimeout(() => $('loginEmail').focus(), 50);
  }
  function showApp() {
    $('loginScreen').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    // A集計モードのまま再ログイン等した場合は通常表示へ戻す
    if (aggMode) exitAggMode();
    applyUserScope();
    render();
  }
  function applyUserScope() {
    $('userEmail').textContent = currentUser.email;
    const privileged = isPrivileged(currentUser);
    document.body.classList.toggle('user-privileged', privileged);
    document.body.classList.toggle('user-toho', !privileged);
    $('appTitle').textContent = privileged ? 'シネマ案件管理' : 'TOHOシネマズ 案件管理';
    $('companyFilter').classList.toggle('hidden', !privileged);
    // status filter のラベル差し替え（受発注で呼称が変わる項目のみ）
    $('statusFilter').querySelectorAll('option').forEach(opt => {
      const map = privileged ? ROLE_STATUS.ryo : ROLE_STATUS.toho;
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
  }

  // ---------- handlers ----------
  $('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const res = attemptLogin($('loginEmail').value, $('loginPassword').value);
    const errEl = $('loginError');
    if (!res.ok) { errEl.textContent = res.msg; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    currentUser = res.user; saveAuth(currentUser); $('loginPassword').value = '';
    showApp();
  });

  $('logoutBtn').addEventListener('click', () => {
    // 開いているモーダル/A集計モードを全部クリーンに閉じてからログアウト
    if (aggMode) exitAggMode();
    if (!$('modal').classList.contains('hidden')) closeModal();
    if (!$('invoiceModal').classList.contains('hidden')) closeInvoiceModal();
    if (!$('contentModal').classList.contains('hidden')) closeContentModal();
    clearAuth();
    currentUser = null;
    showLogin();
  });
  $('newCaseBtn').addEventListener('click', () => openModal(null, 'full'));
  $('quickCaseBtn').addEventListener('click', () => openModal(null, 'simple'));
  $('closeModal').addEventListener('click', closeModal);
  $('cancelBtn').addEventListener('click', closeModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
  $('company').addEventListener('change', updateTohoVisibility);
  $('addCompanyBtn').addEventListener('click', addCompany);

  $('invoiceBtn').addEventListener('click', openInvoiceModal);
  $('closeInvoiceModal').addEventListener('click', closeInvoiceModal);
  $('invoiceCancelBtn').addEventListener('click', closeInvoiceModal);
  $('invoiceModal').addEventListener('click', (e) => { if (e.target === $('invoiceModal')) closeInvoiceModal(); });
  $('invoiceMonth').addEventListener('change', () => {
    $('invoiceIssueDate').value = fmtDateFull(lastDayOfMonth($('invoiceMonth').value));
    updateInvoicePreview();
  });
  $('invoiceGenerateBtn').addEventListener('click', generateInvoices);

  $('closeContentModal').addEventListener('click', closeContentModal);
  $('contentCancelBtn').addEventListener('click', closeContentModal);
  $('contentSaveBtn').addEventListener('click', saveContentFromModal);
  $('contentModal').addEventListener('click', (e) => { if (e.target === $('contentModal')) closeContentModal(); });

  $('aggBtn').addEventListener('click', toggleAggMode);
  $('aggExitBtn').addEventListener('click', exitAggMode);
  $('aggExportBtn').addEventListener('click', exportAggregation);
  $('aggFY').addEventListener('change', renderAggTable);
  $('aggAddMemberBtn').addEventListener('click', addTeamMember);
  $('aggRedistributeBtn').addEventListener('click', redistributeSmallCases);
  // A集計の入力（配分%・粗利率）変更
  $('casesBody').addEventListener('change', (e) => { if (aggMode) handleAggInput(e); });
  // A集計ヘッダの担当者削除（thead に委譲）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (!aggMode) return;
    const rm = e.target.closest('.agg-rm-member');
    if (rm) { e.stopPropagation(); removeTeamMember(rm.dataset.member); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // 最後に開いたものを優先的に閉じる
    if (!$('contentModal').classList.contains('hidden')) { closeContentModal(); return; }
    if (!$('invoiceModal').classList.contains('hidden')) { closeInvoiceModal(); return; }
    if (!$('modal').classList.contains('hidden')) { closeModal(); return; }
  });

  // フォーム保存時に日付を一括パース＆バリデーション
  $('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const isToho = !isPrivileged(currentUser);
    const dateLabels = {
      receivedDate: '受付日',
      surveyDate: '調査日',
      quoteDate: isToho ? '見積り受領日' : '見積り提出日',
      workStartDate: '作業開始日',
      workEndDate: '作業完了日',
      invoiceDate: isToho ? '請求書受領日' : '請求書発行日',
      paymentDate: isToho ? '支払日' : '入金日'
    };
    const parsedDates = {};
    for (const f in dateLabels) {
      const v = readDateField(f, dateLabels[f]);
      if (v === undefined) return; // バリデーション失敗
      parsedDates[f] = v;
    }
    const id = $('caseId').value || String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const company = isPrivileged(currentUser) ? $('company').value : 'TOHOシネマズ';
    const amountRaw = $('estimateAmount').value;
    const data = {
      id: id, company: company,
      theater: $('theater').value.trim(),
      receivedDate: parsedDates.receivedDate,
      tcPerson: $('tcPerson').value.trim(),
      rPerson: $('rPerson').value.trim(),
      category: $('category').value,
      content: $('content').value.trim(),
      surveyDate: parsedDates.surveyDate,
      // 認証番号は保存値として保持（表示・編集はTOHOのときだけ）。会社を切替えても消えないようにする
      certNumber: $('certNumber').value.trim(),
      estimateName: $('estimateName').value.trim(),
      estimateAmount: amountRaw === '' ? '' : Number(amountRaw),
      quoteDate: parsedDates.quoteDate,
      workStartDate: parsedDates.workStartDate,
      workEndDate: parsedDates.workEndDate,
      invoiceDate: parsedDates.invoiceDate,
      paymentDate: parsedDates.paymentDate,
      memo: $('memo').value.trim(),
      updatedAt: new Date().toISOString()
    };
    addToHistory('theaters', data.theater);
    addToHistory('tcPersons', data.tcPerson);
    addToHistory('rPersons', data.rPerson);
    saveHistory();
    const existing = cases.findIndex((c) => c.id === id);
    if (existing >= 0) cases[existing] = data; else cases.push(data);
    saveCases();
    closeModal();
    render();
  });

  $('casesBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) {
      const id = btn.dataset.id;
      const c = cases.find((x) => x.id === id);
      if (!c) return;
      if (btn.dataset.action === 'edit') openModal(c, 'full');
      else if (btn.dataset.action === 'delete') {
        if (confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) {
          cases = cases.filter((x) => x.id !== id);
          saveCases(); render();
        }
      }
      return;
    }
    const td = e.target.closest('td.editable');
    if (!td) return;
    const c = cases.find((x) => x.id === td.dataset.caseId);
    if (!c) return;
    startInlineEdit(td, c, td.dataset.field);
  });

  // ソートは thead に委譲（A集計モードでthead差替えしても生き続ける）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (aggMode) return; // A集計モードではソート無効
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const field = th.dataset.sort;
    if (sortState.field === field) {
      if (sortState.direction === 'asc') sortState.direction = 'desc';
      else { sortState.field = null; sortState.direction = 'asc'; }
    } else {
      sortState.field = field;
      sortState.direction = 'asc';
    }
    render();
  });

  $('searchBox').addEventListener('input', refresh);
  $('statusFilter').addEventListener('change', refresh);
  $('companyFilter').addEventListener('change', refresh);
  $('exportBtn').addEventListener('click', exportFiltered);

  // 通常モードのthead HTMLを保存（A集計から戻す用）
  NORMAL_THEAD_HTML = $('casesTable').querySelector('thead').innerHTML;

  renderDatalists();
  populateCompanySelects();
  if (currentUser) showApp(); else showLogin();
})();
