/* シネマプロジェクト 物件管理台帳
   - データはlocalStorageに保存
   - JSONエクスポート/インポート対応
   - 9月末決算（settings.fiscalEndMonth=9）を基準に「計上期」を自動算出 */

(function () {
'use strict';

const STORAGE_KEY = 'cinemaLedger.v1';

// ============================================================ State
let state = loadState();

function defaultState() {
  return JSON.parse(JSON.stringify(window.__SEED__ || {
    people: [], customers: [], projects: [],
    settings: { fiscalEndMonth: 9, judgeProbs: {}, progressStages: [] }
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const obj = JSON.parse(raw);
    if (!obj.settings) obj.settings = {};
    if (!obj.settings.judgeProbs) obj.settings.judgeProbs = defaultState().settings.judgeProbs;
    if (!obj.settings.progressStages) obj.settings.progressStages = defaultState().settings.progressStages;
    if (!obj.settings.fiscalEndMonth) obj.settings.fiscalEndMonth = 9;
    return obj;
  } catch (e) {
    console.warn('loadState failed', e);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ============================================================ Helpers
function fmtJpy(v) {
  if (v == null || v === '' || isNaN(v)) return '';
  return Math.round(Number(v)).toLocaleString('ja-JP');
}
function fmtJpyShort(v) {
  if (!v) return '0';
  const a = Math.abs(v);
  if (a >= 1e8) return (v/1e8).toFixed(2) + '億';
  if (a >= 1e4) return Math.round(v/1e4).toLocaleString() + '万';
  return Math.round(v).toLocaleString();
}
function fmtPct(v) {
  if (v == null || v === '' || isNaN(v)) return '';
  return (Number(v) * 100).toFixed(1) + '%';
}
function toDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}
function show(toast, msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(show._t);
  show._t = setTimeout(() => { t.hidden = true; }, 1800);
}

// ============================================================ Fiscal Year
// 9月末締めの場合: 期は10月-翌年9月。期表示 = 翌年（締め年）
// 例) 2025-10-01 〜 2026-09-30 → FY2026
function fiscalYearOf(dateLike) {
  if (!dateLike) return null;
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
  if (isNaN(d)) return null;
  const endMonth = state.settings.fiscalEndMonth || 9;
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1..12
  // 締め月の翌月から新しい期。 endMonth=9 → 10月以降は y+1 期
  return (m > endMonth) ? y + 1 : y;
}
function fyLabel(fy) {
  if (!fy) return '未設定';
  return `FY${fy}（〜${fy}年${state.settings.fiscalEndMonth}月）`;
}
function fyShortLabel(fy) {
  if (!fy) return '未設定';
  return `FY${fy}`;
}

function fyForProject(p) {
  // 計上期：竣工時期目安が最優先。なければ受注時期目安。なければ提出日。
  // 受注判定 = '来期' の場合は +1期（オフセット）
  let base = p.completionTargetDate || p.orderTargetDate || p.submitDate || p.inquiryDate;
  let fy = fiscalYearOf(base);
  if (!fy) return null;
  if (p.orderJudge === '来期' && !p.completionTargetDate) {
    // 来期判定で実日付なしの場合は1期繰下げ
    fy += 1;
  }
  return fy;
}

function today() { return new Date(); }
function currentFY() { return fiscalYearOf(today()); }

// ============================================================ Calculations
function calcCostRate(p) {
  if (!p.quoteAmountCurrent || !p.materialOutsourcing) return null;
  return p.materialOutsourcing / p.quoteAmountCurrent;
}
function calcGrossProfit(p) {
  const q = p.quoteAmountCurrent;
  const m = p.materialOutsourcing;
  if (q == null || m == null) return null;
  return Math.max(0, q - m);
}
function judgeProb(j) {
  const probs = state.settings.judgeProbs || {};
  if (j in probs) return probs[j];
  return 0;
}
function calcJudgedAmount(p) {
  if (p.quoteAmountCurrent == null) return null;
  return Math.round(p.quoteAmountCurrent * judgeProb(p.orderJudge));
}

// 想定粗利 × 分配率
function allocProfit(p, personName) {
  const gross = calcGrossProfit(p);
  if (gross == null) return 0;
  const ratio = (p.allocations || {})[personName] || 0;
  return Math.round(gross * ratio);
}
function allocJudgedProfit(p, personName) {
  // 確度を加味した分配粗利
  const gross = calcGrossProfit(p);
  if (gross == null) return 0;
  const ratio = (p.allocations || {})[personName] || 0;
  return Math.round(gross * ratio * judgeProb(p.orderJudge));
}

function allocSum(p) {
  return Object.values(p.allocations || {}).reduce((a,b) => a + (Number(b)||0), 0);
}

// ============================================================ UI: Tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    render();
  });
});

// ============================================================ Header label
function renderHeader() {
  const fy = currentFY();
  document.getElementById('fyLabel').textContent =
    `今期：${fyLabel(fy)} ／ 来期：${fyLabel(fy+1)} ／ 再来期：${fyLabel(fy+2)}`;
}

// ============================================================ Project list
function renderProjectFilters() {
  const fy = currentFY();
  const fySel = document.getElementById('fProjectsFY');
  const cuSel = document.getElementById('fProjectsCustomer');
  const ldSel = document.getElementById('fProjectsLeader');
  const pgSel = document.getElementById('fProjectsProgress');
  const opts = (cur, items, all='すべて') =>
    `<option value="">${all}</option>` + items.map(v => `<option value="${v}" ${cur===v?'selected':''}>${v}</option>`).join('');
  fySel.innerHTML = opts(fySel.value, [fy, fy+1, fy+2].map(fyShortLabel));
  const customers = [...new Set(state.projects.map(p => p.customer).filter(Boolean))].sort();
  cuSel.innerHTML = opts(cuSel.value, customers);
  const leaders = state.people.filter(x => x.active).map(x => x.name);
  ldSel.innerHTML = opts(ldSel.value, leaders);
  pgSel.innerHTML = opts(pgSel.value, state.settings.progressStages);
}

function getFilteredProjects() {
  const fy = document.getElementById('fProjectsFY').value;
  const cu = document.getElementById('fProjectsCustomer').value;
  const ld = document.getElementById('fProjectsLeader').value;
  const pg = document.getElementById('fProjectsProgress').value;
  const jd = document.getElementById('fProjectsJudge').value;
  const q = (document.getElementById('fProjectsSearch').value || '').toLowerCase().trim();

  return state.projects.filter(p => {
    if (fy) {
      const f = fyForProject(p);
      if (fyShortLabel(f) !== fy) return false;
    }
    if (cu && p.customer !== cu) return false;
    if (ld && p.leader !== ld) return false;
    if (pg && p.progress !== pg) return false;
    if (jd && p.orderJudge !== jd) return false;
    if (q) {
      const t = `${p.name||''} ${p.customer||''} ${p.id||''}`.toLowerCase();
      if (!t.includes(q)) return false;
    }
    return true;
  });
}

function renderProjectsTable() {
  const list = getFilteredProjects();
  const tbody = document.querySelector('#tblProjects tbody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="muted" style="text-align:center;padding:30px;">該当する物件がありません</td></tr>`;
  } else {
    tbody.innerHTML = list.map(p => {
      const fy = fyForProject(p);
      const gross = calcGrossProfit(p);
      const judged = calcJudgedAmount(p);
      const allocs = Object.entries(p.allocations||{}).filter(([,r]) => r);
      const pillsHtml = allocs.map(([name, r]) => {
        const person = state.people.find(x => x.name === name);
        const color = person ? person.color : '#888';
        return `<span class="alloc-pill" style="background:${color}">${name} ${(r*100).toFixed(0)}%</span>`;
      }).join('');
      return `<tr data-id="${p.id}">
        <td><code>${p.id||''}</code></td>
        <td>${escapeHtml(p.customer||'')}</td>
        <td>${escapeHtml(p.name||'')}</td>
        <td>${fy ? `<span class="fy-pill">${fyShortLabel(fy)}</span>` : '<span class="muted">-</span>'}</td>
        <td>${p.orderJudge ? `<span class="badge j-${p.orderJudge}">${p.orderJudge}</span>` : ''}</td>
        <td class="num">${fmtJpy(p.quoteAmountCurrent)}</td>
        <td class="num">${fmtJpy(judged)}</td>
        <td class="num">${fmtJpy(gross)}</td>
        <td>${p.progress ? `<span class="badge progress">${p.progress}</span>` : ''}</td>
        <td>${escapeHtml(p.leader||'')}</td>
        <td><div class="alloc-pills">${pillsHtml}</div></td>
        <td><div class="row-action"><button data-edit="${p.id}">編集</button></div></td>
      </tr>`;
    }).join('');
  }

  // Summary
  const totalQuote = list.reduce((a,p) => a + (p.quoteAmountCurrent||0), 0);
  const totalJudged = list.reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
  const totalGross = list.reduce((a,p) => a + (calcGrossProfit(p)||0), 0);
  document.getElementById('projectsSummary').innerHTML = `
    <div class="chip">物件件数<b>${list.length} 件</b></div>
    <div class="chip">見積合計<b>${fmtJpyShort(totalQuote)}</b></div>
    <div class="chip">判定額合計<b>${fmtJpyShort(totalJudged)}</b></div>
    <div class="chip">想定粗利合計<b>${fmtJpyShort(totalGross)}</b></div>
  `;

  // Bind row edit buttons
  tbody.querySelectorAll('button[data-edit]').forEach(b => {
    b.addEventListener('click', () => openProjectModal(b.dataset.edit));
  });
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
}

// ============================================================ Kanban
function renderKanban() {
  const fyV = document.getElementById('fKanbanFY').value;
  const ld = document.getElementById('fKanbanLeader').value;
  const fyOpts = [currentFY(), currentFY()+1, currentFY()+2].map(fyShortLabel);
  document.getElementById('fKanbanFY').innerHTML =
    `<option value="">すべて</option>` + fyOpts.map(v => `<option ${v===fyV?'selected':''}>${v}</option>`).join('');
  const leaders = state.people.filter(x => x.active).map(x => x.name);
  document.getElementById('fKanbanLeader').innerHTML =
    `<option value="">すべて</option>` + leaders.map(v => `<option ${v===ld?'selected':''}>${v}</option>`).join('');

  const stages = state.settings.progressStages;
  const board = document.getElementById('kanbanBoard');
  const filtered = state.projects.filter(p => {
    if (fyV && fyShortLabel(fyForProject(p)) !== fyV) return false;
    if (ld && p.leader !== ld) return false;
    return true;
  });
  board.innerHTML = stages.map(stage => {
    const items = filtered.filter(p => p.progress === stage);
    const cards = items.map(p => `
      <div class="kanban-card" data-edit="${p.id}">
        <div class="ttl">${escapeHtml(p.name||'')}</div>
        <div class="sub">${escapeHtml(p.customer||'')} ／ ${escapeHtml(p.leader||'')}</div>
        <div class="sub">${fmtJpyShort(p.quoteAmountCurrent)} ／ ${fyShortLabel(fyForProject(p))}</div>
      </div>
    `).join('');
    return `<div class="kanban-col">
      <h4>${stage} <span>${items.length}</span></h4>
      ${cards || '<div class="muted" style="font-size:11px;padding:8px;">案件なし</div>'}
    </div>`;
  }).join('');
  board.querySelectorAll('.kanban-card').forEach(el => {
    el.addEventListener('click', () => openProjectModal(el.dataset.edit));
  });
}

// ============================================================ ByPerson
function renderByPerson() {
  const fyV = document.getElementById('fByPersonFY').value;
  const mode = document.getElementById('fByPersonJudgeOnly').value;
  const fyOpts = [currentFY(), currentFY()+1, currentFY()+2].map(fyShortLabel);
  document.getElementById('fByPersonFY').innerHTML =
    `<option value="">全期</option>` + fyOpts.map(v => `<option ${v===fyV?'selected':''}>${v}</option>`).join('');

  const passes = (p) => {
    if (fyV && fyShortLabel(fyForProject(p)) !== fyV) return false;
    if (mode === 'decided' && p.orderJudge !== '決定') return false;
    if (mode === 'weighted' && !['決定','◎','○','△'].includes(p.orderJudge)) return false;
    return true;
  };
  const calc = (p, name) =>
    mode === 'weighted' ? allocJudgedProfit(p, name) : allocProfit(p, name);

  // Cards per person
  const grid = document.getElementById('byPersonGrid');
  const people = state.people.filter(x => x.active);
  grid.innerHTML = people.map(person => {
    const items = state.projects.filter(p => passes(p) && (p.allocations||{})[person.name]);
    const total = items.reduce((a,p) => a + calc(p, person.name), 0);
    const count = items.length;
    return `<div class="card" style="border-left-color:${person.color}">
      <h4>${escapeHtml(person.name)} ${person.memo? `<span class="muted">(${escapeHtml(person.memo)})</span>`:''}</h4>
      <div class="big">${fmtJpyShort(total)}</div>
      <div class="sub">${count} 件 ／ ${mode==='weighted'?'確度加重 分配粗利':'分配粗利合計'}</div>
    </div>`;
  }).join('');

  // Detail table
  const rows = [];
  state.projects.filter(passes).forEach(p => {
    Object.entries(p.allocations||{}).forEach(([name, r]) => {
      if (!r) return;
      rows.push({ p, name, r });
    });
  });
  rows.sort((a,b) => calc(b.p, b.name) - calc(a.p, a.name));
  const tbody = document.querySelector('#tblByPerson tbody');
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted" style="text-align:center;padding:30px;">該当データがありません</td></tr>`;
  } else {
    tbody.innerHTML = rows.map(({p, name, r}) => {
      const gross = calcGrossProfit(p);
      const val = calc(p, name);
      const person = state.people.find(x => x.name === name);
      const color = person ? person.color : '#888';
      return `<tr>
        <td><span class="alloc-pill" style="background:${color}">${name}</span></td>
        <td>${escapeHtml(p.customer||'')}</td>
        <td><a href="#" data-edit="${p.id}">${escapeHtml(p.name||'')}</a></td>
        <td>${fyShortLabel(fyForProject(p))}</td>
        <td>${p.orderJudge?`<span class="badge j-${p.orderJudge}">${p.orderJudge}</span>`:''}</td>
        <td class="num">${fmtJpy(gross)}</td>
        <td class="num">${(r*100).toFixed(1)}%</td>
        <td class="num">${fmtJpy(val)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('a[data-edit]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openProjectModal(a.dataset.edit); });
    });
  }
}

// ============================================================ ByFY
function renderByFY() {
  const fys = [currentFY(), currentFY()+1, currentFY()+2];
  const grid = document.getElementById('byFYGrid');
  grid.innerHTML = fys.map(fy => {
    const items = state.projects.filter(p => fyForProject(p) === fy);
    const totalQuote = items.reduce((a,p) => a + (p.quoteAmountCurrent||0), 0);
    const totalJudged = items.reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
    const totalGross = items.reduce((a,p) => a + (calcGrossProfit(p)||0), 0);
    const decided = items.filter(p => p.orderJudge==='決定').reduce((a,p)=>a+(p.quoteAmountCurrent||0),0);
    return `<div class="card">
      <h4>${fyLabel(fy)}</h4>
      <div class="big">${fmtJpyShort(totalJudged)}</div>
      <div class="sub">判定額合計（${items.length}件）</div>
      <div class="row"><span>見積合計</span><span>${fmtJpyShort(totalQuote)}</span></div>
      <div class="row"><span>決定額</span><span>${fmtJpyShort(decided)}</span></div>
      <div class="row"><span>想定粗利</span><span>${fmtJpyShort(totalGross)}</span></div>
    </div>`;
  }).join('');

  // FY × Customer matrix
  const customers = [...new Set(state.projects.map(p => p.customer).filter(Boolean))].sort();
  const fyTh = document.querySelector('#tblFYCustomer thead');
  const fyTb = document.querySelector('#tblFYCustomer tbody');
  fyTh.innerHTML = `<tr><th>顧客</th>${fys.map(fy => `<th class="num">${fyShortLabel(fy)}</th>`).join('')}<th class="num">合計</th></tr>`;
  fyTb.innerHTML = customers.map(c => {
    const cells = fys.map(fy => {
      const v = state.projects
        .filter(p => p.customer === c && fyForProject(p) === fy)
        .reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
      return `<td class="num">${fmtJpyShort(v)}</td>`;
    }).join('');
    const total = state.projects
      .filter(p => p.customer === c && fys.includes(fyForProject(p)))
      .reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
    return `<tr><td>${escapeHtml(c)}</td>${cells}<td class="num"><b>${fmtJpyShort(total)}</b></td></tr>`;
  }).join('');

  // FY × Person matrix
  const people = state.people.filter(x => x.active);
  const pTh = document.querySelector('#tblFYPerson thead');
  const pTb = document.querySelector('#tblFYPerson tbody');
  pTh.innerHTML = `<tr><th>担当者</th>${fys.map(fy => `<th class="num">${fyShortLabel(fy)}</th>`).join('')}<th class="num">合計</th></tr>`;
  pTb.innerHTML = people.map(person => {
    const cells = fys.map(fy => {
      const v = state.projects
        .filter(p => fyForProject(p) === fy)
        .reduce((a,p) => a + allocProfit(p, person.name), 0);
      return `<td class="num">${fmtJpyShort(v)}</td>`;
    }).join('');
    const total = state.projects
      .filter(p => fys.includes(fyForProject(p)))
      .reduce((a,p) => a + allocProfit(p, person.name), 0);
    return `<tr><td><span class="alloc-pill" style="background:${person.color}">${person.name}</span></td>${cells}<td class="num"><b>${fmtJpyShort(total)}</b></td></tr>`;
  }).join('');
}

// ============================================================ ByCustomer
function renderByCustomer() {
  const grid = document.getElementById('byCustomerGrid');
  const groups = {};
  state.projects.forEach(p => {
    const c = p.customer || '(未設定)';
    if (!groups[c]) groups[c] = [];
    groups[c].push(p);
  });
  grid.innerHTML = Object.entries(groups).sort().map(([c, items]) => {
    const totalQuote = items.reduce((a,p) => a + (p.quoteAmountCurrent||0), 0);
    const totalJudged = items.reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
    const decided = items.filter(p => p.orderJudge==='決定').reduce((a,p)=>a+(p.quoteAmountCurrent||0),0);
    return `<div class="card">
      <h4>${escapeHtml(c)}</h4>
      <div class="big">${fmtJpyShort(totalJudged)}</div>
      <div class="sub">判定額合計（${items.length}件）</div>
      <div class="row"><span>見積合計</span><span>${fmtJpyShort(totalQuote)}</span></div>
      <div class="row"><span>決定額</span><span>${fmtJpyShort(decided)}</span></div>
    </div>`;
  }).join('');
}

// ============================================================ People master
function renderPeople() {
  const tbody = document.querySelector('#tblPeople tbody');
  tbody.innerHTML = state.people.map(person => {
    const count = state.projects.filter(p => p.leader === person.name || (p.allocations||{})[person.name]).length;
    return `<tr>
      <td><span class="alloc-pill" style="background:${person.color}">●</span></td>
      <td>${escapeHtml(person.name)}</td>
      <td>${escapeHtml(person.memo||'')}</td>
      <td>${person.active ? '✅' : '⛔'}</td>
      <td class="num">${count}</td>
      <td><div class="row-action"><button data-edit="${person.id}">編集</button></div></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('button[data-edit]').forEach(b => {
    b.addEventListener('click', () => openPersonModal(b.dataset.edit));
  });
}

// ============================================================ Customers master
function renderCustomers() {
  const tbody = document.querySelector('#tblCustomers tbody');
  tbody.innerHTML = state.customers.map(c => {
    const items = state.projects.filter(p => p.customer === c.name);
    const total = items.reduce((a,p) => a + (calcJudgedAmount(p)||0), 0);
    return `<tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.memo||'')}</td>
      <td class="num">${items.length}</td>
      <td class="num">${fmtJpy(total)}</td>
      <td><div class="row-action"><button data-edit="${c.id}">編集</button></div></td>
    </tr>`;
  }).join('');
  // datalist
  document.getElementById('customerList').innerHTML =
    state.customers.map(c => `<option value="${escapeHtml(c.name)}">`).join('');
  tbody.querySelectorAll('button[data-edit]').forEach(b => {
    b.addEventListener('click', () => openCustomerModal(b.dataset.edit));
  });
}

// ============================================================ Settings (Data tab)
function renderSettings() {
  document.getElementById('fiscalEndMonth').value = state.settings.fiscalEndMonth;
  const box = document.getElementById('judgeProbs');
  const order = ['決定','◎','○','△','来期','-'];
  box.innerHTML = `<div class="form-row">` +
    order.map(j => `<label>${j}（％）
      <input type="number" min="0" max="100" step="1" data-judge="${j}"
        value="${Math.round(((state.settings.judgeProbs[j])||0)*100)}" />
    </label>`).join('') + `</div>`;
  box.querySelectorAll('input[data-judge]').forEach(inp => {
    inp.addEventListener('change', () => {
      const j = inp.dataset.judge;
      const v = Math.max(0, Math.min(100, Number(inp.value)||0)) / 100;
      state.settings.judgeProbs[j] = v;
      saveState(); render();
      show(null, `「${j}」判定確率を ${(v*100).toFixed(0)}% に更新`);
    });
  });
}
document.getElementById('fiscalEndMonth').addEventListener('change', e => {
  state.settings.fiscalEndMonth = Number(e.target.value);
  saveState(); render();
  show(null, `決算月を ${state.settings.fiscalEndMonth} 月に変更`);
});

// ============================================================ Modals
let editingProjectId = null;
let editingPersonId = null;
let editingCustomerId = null;

function openProjectModal(id) {
  editingProjectId = id || null;
  const m = document.getElementById('projectModal');
  m.hidden = false;
  document.getElementById('projectModalTitle').textContent = id ? '物件を編集' : '物件を追加';
  document.getElementById('btnDeleteProject').hidden = !id;

  // progress options
  document.getElementById('pProgress').innerHTML =
    `<option value=""></option>` + state.settings.progressStages.map(s => `<option>${s}</option>`).join('');
  // leader options
  document.getElementById('pLeader').innerHTML =
    `<option value=""></option>` + state.people.filter(p => p.active).map(p => `<option>${p.name}</option>`).join('');

  const p = id ? state.projects.find(x => x.id === id) : {};
  document.getElementById('pId').value = p.id || '';
  document.getElementById('pCustomer').value = p.customer || '';
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pInquiryDate').value = p.inquiryDate || '';
  document.getElementById('pSubmitDate').value = p.submitDate || '';
  document.getElementById('pQuoteType').value = p.quoteType || '';
  document.getElementById('pCaseStatus').value = p.caseStatus || '';
  document.getElementById('pOrderTargetDate').value = p.orderTargetDate || '';
  document.getElementById('pCompletionTargetDate').value = p.completionTargetDate || '';
  document.getElementById('pOrderJudge').value = p.orderJudge || '';
  document.getElementById('pProgress').value = p.progress || '';
  document.getElementById('pLeader').value = p.leader || '';
  document.getElementById('pQuoteAmount').value = p.quoteAmountCurrent ?? '';
  document.getElementById('pMaterial').value = p.materialOutsourcing ?? '';
  document.getElementById('pNote').value = p.note || '';

  renderAllocList(p.allocations || {});
  updateProjectCalcs();
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.hidden = true);
}
document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeAllModals));
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
});

function renderAllocList(allocs) {
  const list = document.getElementById('allocList');
  list.innerHTML = state.people.filter(p => p.active || allocs[p.name]).map(p => {
    const v = allocs[p.name] != null ? Math.round(allocs[p.name]*1000)/10 : 0;
    return `<div class="alloc-row">
      <span class="dot" style="background:${p.color}"></span>
      <span class="name">${escapeHtml(p.name)}</span>
      <input type="number" min="0" max="100" step="0.1" data-alloc="${escapeHtml(p.name)}" value="${v}" />
      <span>%</span>
    </div>`;
  }).join('');
  list.querySelectorAll('input[data-alloc]').forEach(inp => {
    inp.addEventListener('input', updateAllocSum);
  });
  updateAllocSum();
}
function readAllocs() {
  const allocs = {};
  document.querySelectorAll('#allocList input[data-alloc]').forEach(inp => {
    const v = Number(inp.value)/100;
    if (v > 0) allocs[inp.dataset.alloc] = Math.round(v*10000)/10000;
  });
  return allocs;
}
function updateAllocSum() {
  const allocs = readAllocs();
  const sum = Object.values(allocs).reduce((a,b) => a+b, 0);
  const pct = Math.round(sum*1000)/10;
  document.getElementById('allocSum').textContent = pct;
  const w = document.getElementById('allocWarn');
  if (Math.abs(pct - 100) > 0.5 && pct !== 0) {
    w.textContent = `（合計が100%ではありません）`;
  } else {
    w.textContent = '';
  }
}

document.getElementById('btnAllocEqual').addEventListener('click', () => {
  const ppl = state.people.filter(p => p.active);
  if (!ppl.length) return;
  const r = 1 / ppl.length;
  const allocs = {};
  ppl.forEach(p => allocs[p.name] = Math.round(r*10000)/10000);
  renderAllocList(allocs);
});
document.getElementById('btnAllocLeader').addEventListener('click', () => {
  const leader = document.getElementById('pLeader').value;
  if (!leader) { show(null,'リーダーを選択してください'); return; }
  const allocs = readAllocs();
  const others = Object.entries(allocs).filter(([k]) => k !== leader).reduce((a,[,v]) => a+v, 0);
  allocs[leader] = Math.max(0, 1 - others);
  allocs[leader] = Math.round(allocs[leader]*10000)/10000;
  renderAllocList(allocs);
});
document.getElementById('btnAllocClear').addEventListener('click', () => {
  renderAllocList({});
});

function updateProjectCalcs() {
  const q = Number(document.getElementById('pQuoteAmount').value) || 0;
  const m = Number(document.getElementById('pMaterial').value) || 0;
  const rate = q ? (m/q) : 0;
  const gross = Math.max(0, q-m);
  const judge = document.getElementById('pOrderJudge').value;
  const judged = Math.round(q * judgeProb(judge));
  document.getElementById('pCostRate').value = q ? (rate*100).toFixed(1)+'%' : '';
  document.getElementById('pGross').value = q ? fmtJpy(gross) + ' 円' : '';
  document.getElementById('pJudgedAmount').value = q ? fmtJpy(judged) + ' 円' : '';
  // FY auto
  const dt = document.getElementById('pCompletionTargetDate').value
    || document.getElementById('pOrderTargetDate').value
    || document.getElementById('pSubmitDate').value;
  let fy = fiscalYearOf(dt);
  if (judge === '来期' && !document.getElementById('pCompletionTargetDate').value) {
    fy = fy ? fy + 1 : null;
  }
  document.getElementById('pFYAuto').value = fy ? fyLabel(fy) : '';
}
const _calcIds = ['pQuoteAmount','pMaterial','pOrderJudge','pCompletionTargetDate','pOrderTargetDate','pSubmitDate'];
document.addEventListener('input', e => { if (_calcIds.includes(e.target.id)) updateProjectCalcs(); });
document.addEventListener('change', e => { if (_calcIds.includes(e.target.id)) updateProjectCalcs(); });

document.getElementById('btnSaveProject').addEventListener('click', () => {
  const name = document.getElementById('pName').value.trim();
  if (!name) { show(null, '物件名称は必須です'); return; }
  const customerName = document.getElementById('pCustomer').value.trim();
  // Auto-add customer if missing
  if (customerName && !state.customers.find(c => c.name === customerName)) {
    state.customers.push({ id: uid('c'), name: customerName, memo: '' });
  }
  const allocs = readAllocs();
  const data = {
    id: document.getElementById('pId').value.trim() || (editingProjectId || uid('p')),
    customer: customerName,
    name,
    inquiryDate: document.getElementById('pInquiryDate').value || null,
    submitDate: document.getElementById('pSubmitDate').value || null,
    quoteType: document.getElementById('pQuoteType').value || '',
    caseStatus: document.getElementById('pCaseStatus').value || '',
    orderTargetDate: document.getElementById('pOrderTargetDate').value || null,
    completionTargetDate: document.getElementById('pCompletionTargetDate').value || null,
    orderJudge: document.getElementById('pOrderJudge').value || '',
    progress: document.getElementById('pProgress').value || '',
    leader: document.getElementById('pLeader').value || '',
    quoteAmountCurrent: numOrNull(document.getElementById('pQuoteAmount').value),
    materialOutsourcing: numOrNull(document.getElementById('pMaterial').value),
    note: document.getElementById('pNote').value || '',
    allocations: allocs,
  };
  // computed
  data.costRate = calcCostRate(data);
  data.expectedGrossProfit = calcGrossProfit(data);
  data.judgedAmountCurrent = calcJudgedAmount(data);

  if (editingProjectId) {
    const idx = state.projects.findIndex(x => x.id === editingProjectId);
    if (idx >= 0) state.projects[idx] = { ...state.projects[idx], ...data };
  } else {
    state.projects.push(data);
  }
  saveState();
  closeAllModals();
  render();
  show(null, '保存しました');
});

function numOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

document.getElementById('btnDeleteProject').addEventListener('click', () => {
  if (!editingProjectId) return;
  if (!confirm('この物件を削除します。よろしいですか？')) return;
  state.projects = state.projects.filter(p => p.id !== editingProjectId);
  saveState(); closeAllModals(); render(); show(null,'削除しました');
});

document.getElementById('btnAddProject').addEventListener('click', () => openProjectModal());

// ---------- person modal
function openPersonModal(id) {
  editingPersonId = id || null;
  const m = document.getElementById('personModal');
  m.hidden = false;
  document.getElementById('personModalTitle').textContent = id ? '担当者を編集' : '担当者を追加';
  document.getElementById('btnDeletePerson').hidden = !id;
  const p = id ? state.people.find(x => x.id === id) : { color: '#4f86f7', active: true };
  document.getElementById('prName').value = p.name || '';
  document.getElementById('prColor').value = p.color || '#4f86f7';
  document.getElementById('prMemo').value = p.memo || '';
  document.getElementById('prActive').checked = p.active !== false;
}
document.getElementById('btnAddPerson').addEventListener('click', () => openPersonModal());
document.getElementById('btnSavePerson').addEventListener('click', () => {
  const name = document.getElementById('prName').value.trim();
  if (!name) { show(null,'氏名は必須です'); return; }
  if (state.people.some(p => p.name === name && p.id !== editingPersonId)) {
    show(null,'同じ氏名の担当者が既に存在します'); return;
  }
  const data = {
    name,
    color: document.getElementById('prColor').value,
    memo: document.getElementById('prMemo').value,
    active: document.getElementById('prActive').checked,
  };
  if (editingPersonId) {
    const idx = state.people.findIndex(x => x.id === editingPersonId);
    const old = state.people[idx];
    // rename propagation in allocations / leader
    if (old.name !== name) {
      state.projects.forEach(pr => {
        if (pr.leader === old.name) pr.leader = name;
        if (pr.allocations && pr.allocations[old.name] != null) {
          pr.allocations[name] = pr.allocations[old.name];
          delete pr.allocations[old.name];
        }
      });
    }
    state.people[idx] = { ...old, ...data };
  } else {
    state.people.push({ id: uid('p'), ...data });
  }
  saveState(); closeAllModals(); render(); show(null,'保存しました');
});
document.getElementById('btnDeletePerson').addEventListener('click', () => {
  if (!editingPersonId) return;
  const person = state.people.find(x => x.id === editingPersonId);
  const used = state.projects.filter(p => p.leader === person.name || (p.allocations||{})[person.name]).length;
  let msg = `「${person.name}」を削除します。`;
  if (used > 0) msg += `\n\n${used} 件の物件で使用されています。削除すると、リーダー欄と分配率は空欄になります。`;
  if (!confirm(msg + '\n\nよろしいですか？')) return;
  state.projects.forEach(pr => {
    if (pr.leader === person.name) pr.leader = '';
    if (pr.allocations) delete pr.allocations[person.name];
  });
  state.people = state.people.filter(p => p.id !== editingPersonId);
  saveState(); closeAllModals(); render(); show(null,'削除しました');
});

// ---------- customer modal
function openCustomerModal(id) {
  editingCustomerId = id || null;
  const m = document.getElementById('customerModal');
  m.hidden = false;
  document.getElementById('customerModalTitle').textContent = id ? '顧客を編集' : '顧客を追加';
  document.getElementById('btnDeleteCustomer').hidden = !id;
  const c = id ? state.customers.find(x => x.id === id) : {};
  document.getElementById('cuName').value = c.name || '';
  document.getElementById('cuMemo').value = c.memo || '';
}
document.getElementById('btnAddCustomer').addEventListener('click', () => openCustomerModal());
document.getElementById('btnSaveCustomer').addEventListener('click', () => {
  const name = document.getElementById('cuName').value.trim();
  if (!name) { show(null,'顧客名は必須です'); return; }
  if (state.customers.some(c => c.name === name && c.id !== editingCustomerId)) {
    show(null,'同名の顧客が既に存在します'); return;
  }
  const data = {
    name,
    memo: document.getElementById('cuMemo').value,
  };
  if (editingCustomerId) {
    const idx = state.customers.findIndex(x => x.id === editingCustomerId);
    const old = state.customers[idx];
    if (old.name !== name) {
      state.projects.forEach(p => { if (p.customer === old.name) p.customer = name; });
    }
    state.customers[idx] = { ...old, ...data };
  } else {
    state.customers.push({ id: uid('c'), ...data });
  }
  saveState(); closeAllModals(); render(); show(null,'保存しました');
});
document.getElementById('btnDeleteCustomer').addEventListener('click', () => {
  if (!editingCustomerId) return;
  const cust = state.customers.find(x => x.id === editingCustomerId);
  const used = state.projects.filter(p => p.customer === cust.name).length;
  let msg = `「${cust.name}」を削除します。`;
  if (used > 0) msg += `\n\n${used} 件の物件で使用されています。削除すると、物件の顧客欄は空欄になります。`;
  if (!confirm(msg + '\n\nよろしいですか？')) return;
  state.projects.forEach(p => { if (p.customer === cust.name) p.customer = ''; });
  state.customers = state.customers.filter(c => c.id !== editingCustomerId);
  saveState(); closeAllModals(); render(); show(null,'削除しました');
});

// ============================================================ Data export/import
document.getElementById('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `cinema-ledger-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('fileImport').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const text = await f.text();
    const obj = JSON.parse(text);
    if (!obj.projects || !obj.people) throw new Error('形式が不正です');
    if (!confirm('現在のデータを上書きします。よろしいですか？')) return;
    state = obj;
    if (!state.settings) state.settings = defaultState().settings;
    saveState(); render(); show(null,'インポート完了');
  } catch (err) {
    alert('インポートに失敗しました: ' + err.message);
  } finally {
    e.target.value = '';
  }
});
document.getElementById('btnSeed').addEventListener('click', () => {
  if (!confirm('現在のデータを破棄してサンプルデータを読込みます。よろしいですか？')) return;
  state = defaultState();
  saveState(); render(); show(null,'サンプルデータを読込しました');
});
document.getElementById('btnReset').addEventListener('click', () => {
  if (!confirm('すべてのデータを削除します。本当によろしいですか？')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { people: [], customers: [], projects: [],
            settings: { fiscalEndMonth: 9,
              judgeProbs: defaultState().settings.judgeProbs,
              progressStages: defaultState().settings.progressStages } };
  saveState(); render(); show(null,'リセット完了');
});

// ============================================================ Render
function render() {
  renderHeader();
  renderProjectFilters();
  renderProjectsTable();
  renderKanban();
  renderByPerson();
  renderByFY();
  renderByCustomer();
  renderPeople();
  renderCustomers();
  renderSettings();
}

// Filter change listeners
['fProjectsFY','fProjectsCustomer','fProjectsLeader','fProjectsProgress','fProjectsJudge','fProjectsSearch']
  .forEach(id => document.getElementById(id).addEventListener('input', renderProjectsTable));
['fKanbanFY','fKanbanLeader'].forEach(id => document.getElementById(id).addEventListener('input', renderKanban));
['fByPersonFY','fByPersonJudgeOnly'].forEach(id => document.getElementById(id).addEventListener('input', renderByPerson));

render();

})();
