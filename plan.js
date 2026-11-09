"use strict";
/* ============================================================
   工事予定表（シネマチームの年間工事計画）。window.PLAN
   ・Excel と同じ操作: マスを押して打つ（Enter/Tab/矢印で移動・F2 かダブルクリックで直す・Esc でやめる）、
     ドラッグ／Shift で範囲を選ぶ、Ctrl+C / Ctrl+X / Ctrl+V（Excel との間でも）、Delete で消す、Ctrl+Z / Ctrl+Y、
     行の追加・削除・移動、列幅を変える、左の列と見出しは固定
   ・右の棒: 1か月を6マス（約5日ずつ）。色を選んでドラッグで塗る（赤＝受注見込み・橙＝設計（計画・準備）・黄＝施工（工事））
     「受注見込み」「設計 期間」「施工 期間」の列は棒から出す（列に「5〜6月」と打っても棒が塗られる）
   ・案件から入れた行は案件と連動（案件名＝見積り名・金額・粗利率・担当＝R担当・施工の期間＝工事の開始日〜完了日）。
     どちらで直しても同じになる。予定表だけの行も自由に書ける
   ・表（シート）は年度ごとに分けられる（下のタブ）。Excel で出す・Excel から読む・A3 横で印刷
   ・保存: Supabase（work_plans / work_plan_rows・自動保存・ほかの人の変更もすぐ届く）。?local=1 の時は localStorage
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DB = () => window.CINEMA_DB || {};
  const call = (fn, dflt, ...a) => { try { const f = DB()[fn]; return f ? f(...a) : dflt; } catch (e) { return dflt; } };
  const sbc = () => (DB().mode && DB().mode() === 'supabase') ? DB().client() : null;
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
  const pad = (n) => String(n).padStart(2, '0');
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const nowIso = () => new Date().toISOString();
  const norm = (s) => String(s || '').replace(/[\s　]/g, '').toLowerCase();
  const userName = () => call('userEmail', '').split('@')[0] || '';
  const LS = { plans: 'workPlansV1', rows: 'workPlanRowsV1', colw: 'workPlanColWV1', plan: 'workPlanCurV1', compact: 'workPlanCompactV1' };
  const COLORS = { r: { label: '受注見込み', short: '受注', css: 'pl-r', rgb: 'FF0000' }, o: { label: '設計（計画・準備）', short: '設計', css: 'pl-o', rgb: 'FFC000' }, y: { label: '施工（工事）', short: '施工', css: 'pl-y', rgb: 'FFFF00' } };
  const DONE = ['完了', '入金済', '請求済', '取り下げ', '失注'];
  const ONHAND = ['作業中', '対応済み', '日程調整中', '客先対応中'];
  // 左の列。link＝案件とつながる行で案件の項目を使う（直すと案件も直る）。derived＝棒から出す。calc＝式
  const COLS = [
    { k: 'stage', label: '区分', w: 64, hint: '手持ち／受注予定' },
    { k: 'theater', label: '劇場', w: 86 },
    { k: 'name', label: '案件名', w: 200, link: 'estimateName' },
    { k: 'amount', label: '金額（税抜）', w: 104, num: true, link: 'estimateAmount' },
    { k: 'margin_rate', label: '粗利率%', w: 58, num: true, link: 'marginRate' },
    { k: 'profit', label: '粗利額', w: 96, calc: true },
    { k: 'person', label: '担当', w: 58, link: 'rPerson' },
    { k: 'order', label: '受注見込み', w: 76, derived: 'r' },
    { k: 'design_person', label: '設計 担当', w: 64 },
    { k: 'design', label: '設計 期間', w: 92, derived: 'o' },
    { k: 'build_person', label: '施工 担当', w: 64 },
    { k: 'build', label: '施工 期間', w: 92, derived: 'y' },
    { k: 'partner', label: 'パートナー', w: 82 },
    { k: 'note', label: '特記事項', w: 180 }
  ];
  const FROZEN = 3;           // 左から何列を固定するか（区分・劇場・案件名）
  // 最初は「案件名・金額・粗利・担当・受注見込み・設計・施工」がすぐ分かる列だけ。細かい列はボタンで出す
const COMPACT_HIDE = ['stage', 'margin_rate', 'partner', 'note'];

  /* ============================================================
     保存先
     ============================================================ */
  let missing = false, checked = false;
  const api = {
    async probe() {
      const sb = sbc();
      if (!sb) { checked = true; missing = false; return true; }
      const { error } = await sb.from('work_plans').select('id').limit(1);
      checked = true; missing = !!error; return !missing;
    },
    async plans() {
      const sb = sbc();
      if (!sb) return lsGet(LS.plans, []).filter((p) => !p.deleted_at);
      const { data, error } = await sb.from('work_plans').select('*').is('deleted_at', null).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async rows(planId) {
      const sb = sbc();
      if (!sb) return lsGet(LS.rows, []).filter((r) => r.plan_id === planId);
      const { data, error } = await sb.from('work_plan_rows').select('*').eq('plan_id', planId).order('sort_order', { ascending: true }).limit(5000);
      if (error) throw error;
      return data || [];
    },
    async insertPlan(p) {
      const sb = sbc();
      if (!sb) { const all = lsGet(LS.plans, []); const r = Object.assign({ id: uuid(), created_at: nowIso(), updated_at: nowIso() }, p); all.push(r); lsSet(LS.plans, all); return r; }
      const { data, error } = await sb.from('work_plans').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    async updatePlan(id, patch) {
      patch = Object.assign({}, patch, { updated_at: nowIso() });
      const sb = sbc();
      if (!sb) { const all = lsGet(LS.plans, []); const r = all.find((x) => x.id === id); if (r) Object.assign(r, patch); lsSet(LS.plans, all); return; }
      const { error } = await sb.from('work_plans').update(patch).eq('id', id);
      if (error) throw error;
    },
    async insertRows(rows) {
      if (!rows.length) return [];
      const sb = sbc();
      if (!sb) { const all = lsGet(LS.rows, []); rows.forEach((r) => all.push(Object.assign({ created_at: nowIso(), updated_at: nowIso() }, r))); lsSet(LS.rows, all); return rows; }
      const { data, error } = await sb.from('work_plan_rows').insert(rows).select();
      if (error) throw error;
      return data || [];
    },
    async updateRow(id, patch) {
      patch = fillText(Object.assign({}, patch, { updated_at: nowIso(), updated_by: userName() }));
      const sb = sbc();
      if (!sb) { const all = lsGet(LS.rows, []); const r = all.find((x) => x.id === id); if (r) Object.assign(r, patch); lsSet(LS.rows, all); return; }
      const { error } = await sb.from('work_plan_rows').update(patch).eq('id', id);
      if (error) throw error;
    },
    async deleteRows(ids) {
      if (!ids.length) return;
      const sb = sbc();
      if (!sb) { lsSet(LS.rows, lsGet(LS.rows, []).filter((x) => !ids.includes(x.id))); return; }
      const { error } = await sb.from('work_plan_rows').delete().in('id', ids);
      if (error) throw error;
    }
  };

  /* ============================================================
     状態
     ============================================================ */
  const S = {
    open: false, plans: [], plan: null, rows: [], view: [],
    sel: null,            // { r0, c0, r1, c1 } 表示している行・列の番号
    act: null,            // { r, c } いま選んでいるマス
    edit: null,           // 直している最中 { r, c, input }
    tool: 'select',       // select / r / o / y / erase
    undo: [], redo: [],
    colw: lsGet(LS.colw, {}),
    compact: lsGet(LS.compact, true) !== false,
    dirty: {},            // 保存待ち { rowId: patch }
    timer: null, channel: null, cases: new Map()
  };

  /* ---------- 月とマス ---------- */
  const dim = (y, m) => new Date(y, m, 0).getDate();   // m: 1-12
  function months() {
    const p = S.plan; if (!p) return [];
    const [y0, m0] = String(p.start_month).slice(0, 7).split('-').map(Number);
    const out = [];
    for (let i = 0; i < (p.months || 18); i++) { const d = new Date(y0, m0 - 1 + i, 1); out.push({ y: d.getFullYear(), m: d.getMonth() + 1, key: d.getFullYear() + '-' + pad(d.getMonth() + 1) }); }
    return out;
  }
  const slotsN = () => (S.plan && S.plan.slots) || 6;
  function slotKeys() { const n = slotsN(); const out = []; months().forEach((mo) => { for (let k = 1; k <= n; k++) out.push(mo.key + '-' + k); }); return out; }
  function slotOfDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3], n = slotsN(), D = dim(y, mo);
    let k = 1; for (let i = 1; i <= n; i++) { if (d <= Math.floor(i * D / n)) { k = i; break; } }
    return m[1] + '-' + m[2] + '-' + k;
  }
  function slotStart(key) { const [y, m, k] = key.split('-').map(Number); return y + '-' + pad(m) + '-' + pad(Math.floor((k - 1) * dim(y, m) / slotsN()) + 1); }
  function slotEnd(key) { const [y, m, k] = key.split('-').map(Number); return y + '-' + pad(m) + '-' + pad(Math.floor(k * dim(y, m) / slotsN())); }

  /* ---------- 案件とのつながり ---------- */
  function refreshCases() { S.cases = new Map(call('casesFull', []).map((c) => [String(c.id), c])); }
  const caseOf = (row) => (row && row.case_id ? S.cases.get(String(row.case_id)) : null);
  const short = (n) => call('shortTheater', n, n) || n;
  // 行の棒（つながる行の黄色は案件の工事の開始日〜完了日から）
  function barsOf(row) {
    const b = Object.assign({}, row.bars || {});
    const c = caseOf(row);
    if (c && (c.workStartDate || c.workEndDate)) {
      Object.keys(b).forEach((k) => { if (b[k] === 'y') delete b[k]; });
      const from = slotOfDate(c.workStartDate || c.workEndDate), to = slotOfDate(c.workEndDate || c.workStartDate);
      // マスの名前「YYYY-MM-k」は文字の順＝日付の順（表の範囲の外から始まる・終わる工事も、範囲の中だけ塗る）
      if (from && to) slotKeys().forEach((k) => { if (k >= from && k <= to) b[k] = 'y'; });
    }
    return b;
  }
  function rangeOf(bars, color) {
    const ks = slotKeys().filter((k) => bars[k] === color);
    return ks.length ? [ks[0], ks[ks.length - 1]] : null;
  }
  function fmtMonthRange(r, single) {
    if (!r) return '';
    const [a, b] = r.map((k) => k.split('-').slice(0, 2).map(Number));
    if (single || (a[0] === b[0] && a[1] === b[1])) return a[0] + '/' + a[1] + '月';
    if (a[0] === b[0]) return a[0] + '/' + a[1] + '〜' + b[1] + '月';
    return a[0] + '/' + a[1] + '〜' + b[0] + '/' + b[1] + '月';
  }
  // 表示する値
  function valueOf(row, col) {
    if (row.row_type === 'group') {
      if (col.k === 'name') return row.group_name || '';
      if (col.k === 'amount' || col.k === 'profit') return groupSum(row, col.k);
      return '';
    }
    const c = caseOf(row);
    switch (col.k) {
      case 'theater': return c ? short(c.theater) : row.theater;
      case 'name': return c ? (c.estimateName || String(c.content || '').slice(0, 40)) : row.name;
      case 'amount': return c ? numOrNull(c.estimateAmount) : numOrNull(row.amount);
      case 'margin_rate': return c ? numOrNull(c.marginRate) : numOrNull(row.margin_rate);
      case 'profit': { const a = valueOf(row, COLS[3]), m = valueOf(row, COLS[4]); return a == null ? null : Math.round(a * (m == null ? 0 : m) / 100); }
      case 'person': return c ? (c.rPerson || '') : row.person;
      case 'order': return fmtMonthRange(rangeOf(barsOf(row), 'r'), true);
      case 'design': return fmtMonthRange(rangeOf(barsOf(row), 'o'));
      case 'build': return fmtMonthRange(rangeOf(barsOf(row), 'y'));
      default: return row[col.k] == null ? '' : row[col.k];
    }
  }
  const numOrNull = (v) => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
  function groupSum(gRow, k) {
    const i = S.view.indexOf(gRow); let sum = 0, any = false;
    for (let j = i + 1; j < S.view.length && S.view[j].row_type !== 'group'; j++) {
      const v = valueOf(S.view[j], COLS.find((c) => c.k === k)); if (v != null) { sum += v; any = true; }
    }
    return any ? sum : null;
  }
  const fmtNum = (v, col) => v == null || v === '' ? '' : (col.k === 'margin_rate' ? String(v) : Number(v).toLocaleString('ja-JP'));
  const isLinked = (row) => !!(row && row.case_id);
  const editable = (row, col) => {
    if (!row || !col) return false;
    if (row.row_type === 'group') return col.k === 'name';
    if (col.calc) return false;
    if (col.k === 'theater' && caseOf(row)) return false;
    return true;
  };

  /* ============================================================
     開く・閉じる
     ============================================================ */
  async function open() {
    S.open = true;
    const v = $('planView'); v.classList.remove('hidden');
    v.innerHTML = '<div class="pl-loading">読み込み中…</div>';
    if (!checked) await api.probe();
    if (missing) { v.innerHTML = '<div class="mode-panel"><div class="tm-body"><div class="empty-msg">⚠ 工事予定表の表がまだありません。SETUP_WORK_PLAN.sql を Supabase で1回実行してください。</div></div></div>'; return; }
    refreshCases();
    try { S.plans = await api.plans(); } catch (e) { v.innerHTML = '<div class="empty-msg">読み込めませんでした: ' + esc(e.message || e) + '</div>'; return; }
    if (!S.plans.length) {
      const d = new Date(); const fy = d.getMonth() + 1 >= 10 ? d.getFullYear() : d.getFullYear() - 1;
      S.plans = [await api.insertPlan({ title: fy + '年度', start_month: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-01', months: 18, slots: 6, sort_order: 0, created_by: userName() })];
    }
    const want = lsGet(LS.plan, null);
    await selectPlan((S.plans.find((p) => p.id === want) || S.plans[S.plans.length - 1]).id);
    window.addEventListener('cinema-cases-changed', onCasesChanged);
  }
  function close() {
    flush();
    S.open = false; cancelEdit(); unsubscribe();
    window.removeEventListener('cinema-cases-changed', onCasesChanged);
    const v = $('planView'); if (v) { v.classList.add('hidden'); v.innerHTML = ''; }
    closeOverlay();
  }
  async function selectPlan(id) {
    flush();
    S.plan = S.plans.find((p) => p.id === id); lsSet(LS.plan, id);
    S.undo = []; S.redo = []; S.sel = null; S.act = null;
    S.rows = (await api.rows(id)).sort((a, b) => a.sort_order - b.sort_order);
    buildView(); renderAll(); subscribe();
  }
  function buildView() { S.view = S.rows.slice().sort((a, b) => a.sort_order - b.sort_order); }
  function onCasesChanged() { if (!S.open) return; refreshCases(); renderBody(); }

  /* ---------- リアルタイム（ほかの人の変更） ---------- */
  function subscribe() {
    unsubscribe();
    const sb = sbc(); if (!sb || !S.plan) return;
    try {
      S.channel = sb.channel('work-plan-' + S.plan.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_plan_rows', filter: 'plan_id=eq.' + S.plan.id }, (p) => {
          if (p.eventType === 'DELETE') { const id = p.old && p.old.id; S.rows = S.rows.filter((r) => r.id !== id); }
          else if (p.new) {
            const i = S.rows.findIndex((r) => r.id === p.new.id);
            const mine = S.dirty[p.new.id] || {};
            const merged = Object.assign({}, p.new, mine);   // 自分がまだ保存していない分は残す
            if (i >= 0) S.rows[i] = merged; else S.rows.push(merged);
          }
          buildView(); if (!S.edit) renderBody();
        }).subscribe();
    } catch (e) { console.warn('工事予定表のリアルタイム購読に失敗', e); }
  }
  function unsubscribe() { const sb = sbc(); if (S.channel && sb) { try { sb.removeChannel(S.channel); } catch (e) {} } S.channel = null; }

  /* ============================================================
     描く
     ============================================================ */
  const visibleCols = () => COLS.filter((c) => !(S.compact && COMPACT_HIDE.includes(c.k)));
  const colW = (c) => S.colw[c.k] || c.w;
  function renderAll() {
    const v = $('planView');
    const tabs = S.plans.map((p) => `<button type="button" class="pl-sheet${p.id === S.plan.id ? ' on' : ''}" data-plan="${esc(p.id)}" title="ダブルクリックで名前・期間を変える">${esc(p.title || '無題')}</button>`).join('');
    v.innerHTML = `
      <div class="pl-wrap">
        <div class="pl-head">
          <h2>🗓 工事予定表</h2>
          <div class="pl-tools">
            <span class="pl-group"><button type="button" data-act="add-case" class="primary">＋ 案件から入れる</button><button type="button" data-act="add-row">＋ 行</button><button type="button" data-act="add-group">＋ 見出し</button><button type="button" data-act="del-row">行を消す</button><button type="button" data-act="up" title="選んだ行を上へ（Alt+↑）">↑</button><button type="button" data-act="down" title="選んだ行を下へ（Alt+↓）">↓</button></span>
            <span class="pl-group pl-paint" role="group" aria-label="棒の色">棒:
              <button type="button" data-tool="select" class="${S.tool === 'select' ? 'on' : ''}" title="選ぶ（塗らない）">⬚ 選ぶ</button>
              ${Object.keys(COLORS).map((k) => `<button type="button" data-tool="${k}" class="${S.tool === k ? 'on' : ''}" title="${COLORS[k].label}を塗る（ドラッグ）"><i class="pl-sw ${COLORS[k].css}"></i>${COLORS[k].short}</button>`).join('')}
              <button type="button" data-tool="erase" class="${S.tool === 'erase' ? 'on' : ''}" title="棒を消す（ドラッグ）">⌫ 消す</button>
            </span>
            <span class="pl-group"><button type="button" data-act="undo" title="元に戻す（Ctrl+Z）">↶</button><button type="button" data-act="redo" title="やり直し（Ctrl+Y）">↷</button></span>
            <span class="pl-group"><button type="button" data-act="compact" title="区分・粗利率・パートナー・特記事項の列を${S.compact ? '出す' : '隠す'}">${S.compact ? '＋ 細かい列を出す' : '− 細かい列を隠す'}</button><button type="button" data-act="xlsx">⬇ Excel で出す</button><label class="pl-file">⬆ Excel から読む<input type="file" id="plImport" accept=".xlsx" hidden></label><button type="button" data-act="print">🖨 A3 横で印刷</button></span>
          </div>
        </div>
        <div class="pl-legend"><span><i class="pl-sw pl-r"></i>受注見込み</span><span><i class="pl-sw pl-o"></i>設計（計画・準備）</span><span><i class="pl-sw pl-y"></i>施工（工事）</span><span class="pl-sum" id="plSum"></span><span class="pl-linked-mark">🔗＝案件とつながる行（案件名・金額・粗利率・担当・施工の期間は案件と同じ。どちらで直しても同じになる）</span></div>
        <div class="pl-grid" id="plGrid" aria-label="工事予定表"></div>
        <textarea id="plKey" class="pl-key" aria-label="選んだマスの入力" autocomplete="off" spellcheck="false"></textarea>
        <div class="pl-foot"><div class="pl-sheets">${tabs}<button type="button" class="pl-sheet-add" data-act="add-plan" title="新しい表（年度）">＋</button></div><div class="pl-status" id="plStatus"></div></div>
      </div>`;
    renderBody();
  }
  function renderBody() {
    const g = $('plGrid'); if (!g) return;
    const sx = g.scrollLeft, sy = g.scrollTop;
    const cols = visibleCols(), mos = months(), n = slotsN(), keys = slotKeys();
    let left = 36; const lefts = [];
    cols.forEach((c, i) => { lefts.push(i < FROZEN ? left : null); if (i < FROZEN) left += colW(c); });
    const fz = (i) => (lefts[i] != null ? ` style="left:${lefts[i]}px"` : '');
    const totals = { onhand: 0, plan: 0, profit: 0, all: 0 };
    S.view.forEach((r) => { if (r.row_type === 'group') return; const a = valueOf(r, COLS[3]) || 0; totals.all += a; totals.profit += valueOf(r, COLS[5]) || 0; if (r.stage === '手持ち') totals.onhand += a; else if (r.stage === '受注予定') totals.plan += a; });
    const yen = (v) => v ? Number(v).toLocaleString('ja-JP') : '0';
    const head1 = `<tr class="pl-h1"><th class="pl-rh pl-fz" style="left:0" rowspan="2"></th>${cols.map((c, i) => `<th rowspan="2" class="pl-ch${i < FROZEN ? ' pl-fz' : ''}${c.num || c.calc ? ' num' : ''}" data-c="${i}" style="${lefts[i] != null ? `left:${lefts[i]}px;` : ''}width:${colW(c)}px;min-width:${colW(c)}px">${esc(c.label)}<span class="pl-rs" data-rs="${c.k}"></span></th>`).join('')}${mos.map((mo, i) => `<th colspan="${n}" class="pl-mo${mo.m === 1 || i === 0 ? ' pl-yr' : ''}">${mo.m === 1 || i === 0 ? `<b>${mo.y}</b>/` : ''}${mo.m}月</th>`).join('')}</tr>
      <tr class="pl-h2">${keys.map((k) => `<th class="pl-sl${k.endsWith('-1') ? ' pl-mb' : ''}"></th>`).join('')}</tr>
      <tr class="pl-tot"><th class="pl-rh pl-fz" style="left:0">計</th>${cols.map((c, i) => `<th class="${i < FROZEN ? 'pl-fz' : ''}${c.num || c.calc ? ' num' : ''}"${fz(i)}>${c.k === 'name' ? '合計' : c.k === 'amount' ? yen(totals.all) : c.k === 'profit' ? yen(totals.profit) : ''}</th>`).join('')}<th colspan="${keys.length}"></th></tr>`;
    const body = S.view.map((row, r) => {
      const b = row.row_type === 'group' ? {} : barsOf(row);
      const c = caseOf(row);
      const missingCase = row.case_id && !c;
      const tds = cols.map((col, i) => {
        const v = valueOf(row, col);
        const txt = (col.num || col.calc) ? fmtNum(v, col) : v;
        const ro = !editable(row, col);
        const cls = [i < FROZEN ? 'pl-fz' : '', col.num || col.calc ? 'num' : '', ro ? 'ro' : '', col.derived ? 'pl-der' : '', (col.link && c) ? 'pl-ln' : ''].filter(Boolean).join(' ');
        const pre = (col.k === 'name' && row.row_type !== 'group' && row.case_id) ? `<span class="pl-link" title="${missingCase ? '案件が見つかりません（消されたか、見られない案件）' : '案件とつながる行'}">${missingCase ? '⚠' : '🔗'}</span>` : '';
        return `<td class="${cls}" data-r="${r}" data-c="${i}"${fz(i)}>${pre}${esc(txt)}</td>`;
      }).join('');
      const gc = row.row_type === 'group' ? keys.map((k) => `<td class="pl-g${k.endsWith('-1') ? ' pl-mb' : ''}"></td>`).join('')
        : keys.map((k, j) => `<td class="pl-s${k.endsWith('-1') ? ' pl-mb' : ''}${b[k] ? ' ' + COLORS[b[k]].css : ''}" data-r="${r}" data-c="${cols.length + j}"></td>`).join('');
      return `<tr class="${row.row_type === 'group' ? 'pl-grp' : ''}${missingCase ? ' pl-miss' : ''}" data-row="${esc(row.id)}"><th class="pl-rh pl-fz" style="left:0" data-r="${r}">${r + 1}</th>${tds}${gc}</tr>`;
    }).join('');
    g.innerHTML = `<table class="pl-tbl" id="plTbl"><colgroup><col style="width:36px">${cols.map((c) => `<col style="width:${colW(c)}px">`).join('')}${keys.map(() => '<col class="pl-scol">').join('')}</colgroup><thead>${head1}</thead><tbody>${body}</tbody></table>
      ${S.view.length ? '' : '<div class="pl-empty">まだ行がありません。「＋ 案件から入れる」で案件を選ぶか、「＋ 行」で書き始めてください。</div>'}`;
    g.scrollLeft = sx; g.scrollTop = sy;
    const sm = $('plSum'); if (sm) sm.textContent = `合計 ${yen(totals.all)}（手持ち ${yen(totals.onhand)} ／ 受注予定 ${yen(totals.plan)}）　粗利 ${yen(totals.profit)}`;
    if (!g.dataset.sc) { g.dataset.sc = '1'; g.addEventListener('scroll', () => { if (S.edit) commitEdit(); else placeKey(); }); }
    paintSel(); status(); placeKey();
  }
  const ncols = () => visibleCols().length + slotKeys().length;
  const colAt = (i) => visibleCols()[i];
  const isSlot = (i) => i >= visibleCols().length;
  const slotKeyAt = (i) => slotKeys()[i - visibleCols().length];
  function cellEl(r, c) { const tb = document.querySelector('#plTbl tbody'); if (!tb) return null; const tr = tb.children[r]; return tr ? tr.querySelector(`[data-c="${c}"]`) : null; }
  let selEls = [];
  function paintSel() {
    selEls.forEach((e) => e.classList.remove('sel', 'act')); selEls = [];
    if (!S.sel) return;
    const r0 = Math.min(S.sel.r0, S.sel.r1), r1 = Math.max(S.sel.r0, S.sel.r1), c0 = Math.min(S.sel.c0, S.sel.c1), c1 = Math.max(S.sel.c0, S.sel.c1);
    const tb = document.querySelector('#plTbl tbody'); if (!tb) return;
    for (let r = r0; r <= r1; r++) {
      const tr = tb.children[r]; if (!tr) continue;
      for (let c = c0; c <= c1; c++) { const e = tr.querySelector(`[data-c="${c}"]`); if (e) { e.classList.add('sel'); selEls.push(e); } }
    }
    if (S.act) { const e = cellEl(S.act.r, S.act.c); if (e) { e.classList.add('act'); selEls.push(e); } }
  }
  function status() {
    const el = $('plStatus'); if (!el) return;
    if (!S.act) { el.textContent = ''; return; }
    const row = S.view[S.act.r]; if (!row) { el.textContent = ''; return; }
    const col = colAt(S.act.c);
    const who = row.updated_by ? `最後に直した人: ${row.updated_by}　${String(row.updated_at || '').slice(0, 16).replace('T', ' ')}` : '';
    const what = isSlot(S.act.c) ? (() => { const k = slotKeyAt(S.act.c); return `${k.split('-')[0]}/${+k.split('-')[1]}月 ${k.split('-')[2]}マス目（${slotStart(k).slice(5).replace('-', '/')}〜${slotEnd(k).slice(5).replace('-', '/')}）`; })() : (col ? col.label + (col.link && caseOf(row) ? '（案件と連動）' : col.derived ? '（棒から出す。「5〜6月」のように打つと棒も塗る）' : col.hint ? '（' + col.hint + '）' : '') : '');
    el.textContent = [what, who].filter(Boolean).join('　｜　');
  }
  function scrollIntoCell(r, c) {
    const e = cellEl(r, c), g = $('plGrid'); if (!e || !g) return;
    const fzw = visibleCols().slice(0, FROZEN).reduce((s, x) => s + colW(x), 36);
    const er = e.getBoundingClientRect(), gr = g.getBoundingClientRect();
    if (!e.classList.contains('pl-fz')) {
      if (er.left < gr.left + fzw) g.scrollLeft -= (gr.left + fzw - er.left) + 4;
      else if (er.right > gr.right) g.scrollLeft += (er.right - gr.right) + 4;
    }
    const hh = (g.querySelector('thead') || {}).offsetHeight || 60;
    if (er.top < gr.top + hh) g.scrollTop -= (gr.top + hh - er.top) + 2;
    else if (er.bottom > gr.bottom) g.scrollTop += (er.bottom - gr.bottom) + 2;
  }
  function setAct(r, c, extend) {
    r = Math.max(0, Math.min(S.view.length - 1, r)); c = Math.max(0, Math.min(ncols() - 1, c));
    if (!S.view.length) { S.act = null; S.sel = null; paintSel(); return; }
    if (extend && S.sel) { S.sel.r1 = r; S.sel.c1 = c; } else { S.sel = { r0: r, c0: c, r1: r, c1: c }; }
    S.act = extend && S.act ? S.act : { r, c };
    if (!extend) S.act = { r, c };
    paintSel(); scrollIntoCell(r, c); status();
  }
  const selRows = () => { if (!S.sel) return []; const a = Math.min(S.sel.r0, S.sel.r1), b = Math.max(S.sel.r0, S.sel.r1); return S.view.slice(a, b + 1); };

  /* ============================================================
     値を入れる（1か所にまとめる。元に戻せるよう記録する）
     ============================================================ */
  function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/[０-９．，]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0)).replace(/[,\s円¥￥%％]/g, '');
    if (!s) return null;
    let mul = 1;
    if (/億$/.test(s)) { mul = 1e8; s = s.replace(/億$/, ''); } else if (/万$/.test(s)) { mul = 1e4; s = s.replace(/万$/, ''); } else if (/千$/.test(s)) { mul = 1e3; s = s.replace(/千$/, ''); }
    const m = /^(\d+)億(\d+)万?$/.exec(s); if (m) return Number(m[1]) * 1e8 + Number(m[2]) * 1e4;
    const n = Number(s); return isFinite(n) ? Math.round(n * mul * 100) / 100 : NaN;
  }
  // 「4月」「2026/4」「26/4」「5〜6月」「2026/11〜2027/2」→ [始めの月, 終わりの月]（表の範囲の中で探す）
  function parseMonths(s) {
    s = String(s || '').trim().replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0)).replace(/[年]/g, '/').replace(/月/g, '').replace(/\s/g, '');
    if (!s) return [];
    const parts = s.split(/[〜~～\-－から]+/).filter(Boolean);
    const mos = months();
    const find = (p, after) => {
      const m = /^(?:(\d{2,4})\/)?(\d{1,2})$/.exec(p); if (!m) return null;
      let y = m[1] ? Number(m[1].length === 2 ? '20' + m[1] : m[1]) : null; const mo = Number(m[2]);
      if (!(mo >= 1 && mo <= 12)) return null;
      const cand = mos.filter((x) => x.m === mo && (y == null || x.y === y) && (!after || x.key >= after));
      return cand.length ? cand[0].key : null;
    };
    const a = find(parts[0]); if (!a) return null;
    const b = parts[1] ? find(parts[1].includes('/') ? parts[1] : parts[1], a) : a;
    if (!b) return null;
    return [a, b];
  }
  // 1つの変更をまとめて行う。ops: [{row, patch}]（patch の key は行の列名・bars）と、案件の変更 [{caseId, patch}]
  function apply(change, record) {
    const inv = { rows: [], cases: [] };
    (change.rows || []).forEach(({ id, patch }) => {
      const row = S.rows.find((r) => r.id === id); if (!row) return;
      const before = {}; Object.keys(patch).forEach((k) => { before[k] = row[k] === undefined ? null : JSON.parse(JSON.stringify(row[k])); });
      inv.rows.push({ id, patch: before });
      Object.assign(row, JSON.parse(JSON.stringify(patch)));
      S.dirty[id] = Object.assign(S.dirty[id] || {}, patch);
    });
    (change.cases || []).forEach(({ caseId, patch }) => {
      const c = S.cases.get(String(caseId)); if (!c) return;
      const before = {}; Object.keys(patch).forEach((k) => { before[k] = c[k] === undefined ? '' : c[k]; });
      inv.cases.push({ caseId, patch: before });
      Object.assign(c, patch);
      call('updateCase', null, caseId, patch);
    });
    if (change.inserts) { change.inserts.forEach((r) => S.rows.push(r)); api.insertRows(change.inserts.map(dbRow)).catch(fail); inv.deletes = change.inserts.map((r) => r.id); }
    if (change.deletes) { const gone = S.rows.filter((r) => change.deletes.includes(r.id)); S.rows = S.rows.filter((r) => !change.deletes.includes(r.id)); change.deletes.forEach((id) => delete S.dirty[id]); api.deleteRows(change.deletes).catch(fail); inv.inserts = gone.map((r) => JSON.parse(JSON.stringify(r))); }
    if (record !== false) { S.undo.push({ fwd: change, inv }); if (S.undo.length > 200) S.undo.shift(); S.redo = []; }
    buildView(); schedule(); renderBody();
    return inv;
  }
  // DB へ送る形。文字の列は空（null）にできないので、無い項目は '' で埋める（まとめて保存する時、1行でも欠けると全部が失敗するため）
  const TEXT_KEYS = ['row_type', 'group_name', 'stage', 'theater', 'name', 'person', 'design_person', 'build_person', 'partner', 'note', 'updated_by'];
  const fillText = (o) => { TEXT_KEYS.forEach((k) => { if (k in o && (o[k] === null || o[k] === undefined)) o[k] = k === 'row_type' ? 'item' : ''; }); if ('bars' in o && !o.bars) o.bars = {}; return o; };
  const dbRow = (r) => {
    const o = {};
    ['id', 'plan_id', 'sort_order', 'row_type', 'case_id', 'group_name', 'stage', 'theater', 'name', 'amount', 'margin_rate', 'person', 'design_person', 'build_person', 'partner', 'note', 'bars', 'updated_by'].forEach((k) => { o[k] = r[k] === undefined ? null : r[k]; });
    if (o.case_id === '') o.case_id = null;
    return fillText(o);
  };
  function undo() { const u = S.undo.pop(); if (!u) return; const inv2 = apply(u.inv, false); S.redo.push({ fwd: u.inv, inv: inv2 }); }
  function redo() { const u = S.redo.pop(); if (!u) return; const inv2 = apply(u.inv, false); S.undo.push({ fwd: u.inv, inv: inv2 }); }
  function schedule() { clearTimeout(S.timer); S.timer = setTimeout(flush, 500); }
  function flush() {
    clearTimeout(S.timer);
    const d = S.dirty; S.dirty = {};
    Object.keys(d).forEach((id) => { if (S.rows.some((r) => r.id === id)) api.updateRow(id, d[id]).catch(fail); });
  }
  function fail(e) { console.error(e); say('保存に失敗しました: ' + (e && e.message ? e.message : e) + '\n画面を読み込み直すと最新に戻ります。'); }

  // 1つのマスに文字を入れた時の変更を作る
  function changeFor(row, col, text, ch) {
    ch = ch || { rows: [], cases: [] };
    if (!editable(row, col)) return ch;
    const c = caseOf(row);
    const put = (patch) => { const ex = ch.rows.find((x) => x.id === row.id); if (ex) Object.assign(ex.patch, patch); else ch.rows.push({ id: row.id, patch }); };
    const putCase = (patch) => { const ex = ch.cases.find((x) => x.caseId === row.case_id); if (ex) Object.assign(ex.patch, patch); else ch.cases.push({ caseId: row.case_id, patch }); };
    if (row.row_type === 'group') { put({ group_name: String(text).trim() }); return ch; }
    if (col.num) {
      const n = parseNum(text);
      if (Number.isNaN(n)) { say(`「${text}」は数字として読めません。例: 30000000 ／ 3000万 ／ 2.69億`); return ch; }
      if (c && col.link) { putCase({ [col.link]: n == null ? '' : n }); put({ [col.k]: n }); }
      else put({ [col.k]: n });
      return ch;
    }
    if (col.derived) {
      const color = col.derived;
      const r = parseMonths(text);
      if (r === null) { say(`「${text}」は月として読めません。例: 4月 ／ 2026/4 ／ 5〜6月 ／ 2026/11〜2027/2（表の範囲の月）`); return ch; }
      const cur = (ch._work && ch._work[row.id]) || barsOf(row);
      paintChange(row, slotKeys().filter((k) => cur[k] === color), 'erase', ch);
      if (r.length) {
        const keys = color === 'r' ? [r[0] + '-1'] : slotKeys().filter((k) => { const mk = k.slice(0, 7); return mk >= r[0] && mk <= r[1]; });
        paintChange(row, keys, color, ch);
      }
      return ch;
    }
    const v = String(text == null ? '' : text).replace(/\r/g, '');
    if (c && col.link) { putCase({ [col.link]: v.trim() }); put({ [col.k]: v.trim() }); }
    else put({ [col.k]: col.k === 'note' ? v : v.trim() });
    return ch;
  }
  // 棒のマスを塗る（範囲）。つながる行の黄色は案件の工事の開始日・完了日にする
  function paintChange(row, keysToSet, color, ch) {
    ch = ch || { rows: [], cases: [] };
    if (!row || row.row_type === 'group') return ch;
    ch._work = ch._work || {};
    const work = ch._work[row.id] || (ch._work[row.id] = barsOf(row));   // 画面に見えている色（黄色も）
    keysToSet.forEach((k) => { if (color === 'erase' || !color) delete work[k]; else work[k] = color; });
    const c = caseOf(row);
    const store = Object.assign({}, work);
    if (c) {
      // つながる行の黄色は、案件の工事の開始日・完了日として持つ（予定表の中には持たない）
      const ys = slotKeys().filter((k) => work[k] === 'y');
      Object.keys(store).forEach((k) => { if (store[k] === 'y') delete store[k]; });
      const before = { workStartDate: c.workStartDate || '', workEndDate: c.workEndDate || '' };
      let patch = ys.length ? { workStartDate: slotStart(ys[0]), workEndDate: slotEnd(ys[ys.length - 1]) } : { workStartDate: '', workEndDate: '' };
      // 開始日・完了日が同じマスの中なら、案件の日付はそのまま（マスより細かい日付を消さない）
      if (ys.length && before.workStartDate && slotOfDate(before.workStartDate) === ys[0]) patch.workStartDate = before.workStartDate;
      if (ys.length && before.workEndDate && slotOfDate(before.workEndDate) === ys[ys.length - 1]) patch.workEndDate = before.workEndDate;
      const exc = ch.cases.find((x) => x.caseId === row.case_id);
      if (exc) Object.assign(exc.patch, patch);
      else if (patch.workStartDate !== before.workStartDate || patch.workEndDate !== before.workEndDate) ch.cases.push({ caseId: row.case_id, patch });
    }
    const ex = ch.rows.find((x) => x.id === row.id);
    if (ex) ex.patch.bars = store; else ch.rows.push({ id: row.id, patch: { bars: store } });
    return ch;
  }

  /* ============================================================
     直す（マスの上に入力欄を出す）
     ============================================================ */
  // 選んだマスの上に、いつも見えない入力欄（#plKey）を置いておく。
  // 打ち始めると（日本語の変換が始まっても）その欄がそのまま「直す欄」になる＝Excel と同じく選んですぐ打てる
  const keyEl = () => $('plKey');
  function placeKey() {
    const k = keyEl(); if (!k || !S.act) return;
    const td = cellEl(S.act.r, S.act.c), wrap = k.parentElement; if (!td || !wrap) return;
    const wr = wrap.getBoundingClientRect(), tr = td.getBoundingClientRect();
    k.style.left = (tr.left - wr.left) + 'px'; k.style.top = (tr.top - wr.top) + 'px';
    if (!S.edit) { k.style.width = tr.width + 'px'; k.style.height = tr.height + 'px'; }
  }
  function focusKey() { const k = keyEl(); if (!k || S.edit) return; placeKey(); if (document.activeElement !== k) k.focus({ preventScroll: true }); }
  // mode: 'type'＝打ち始めた（中身は空から。押したキー・変換中の文字はそのまま入る）／'keep'＝F2・ダブルクリック（今の中身から）
  function startEdit(mode) {
    if (!S.act || S.edit) return false;
    const row = S.view[S.act.r], col = colAt(S.act.c);
    if (isSlot(S.act.c)) return false;
    if (!editable(row, col)) { if (col && col.k === 'theater' && caseOf(row)) say('この行の劇場は案件の劇場です。劇場を変える時は案件を開いて直してください。'); return false; }
    const td = cellEl(S.act.r, S.act.c), k = keyEl(); if (!td || !k) return false;
    const raw = (() => { const v = valueOf(row, col); return v == null ? '' : String(v); })();
    placeKey();
    const tr = td.getBoundingClientRect();
    const wide = col.k === 'note' || col.k === 'name';
    k.style.width = Math.max(tr.width, wide ? 280 : tr.width) + 'px';
    k.style.height = (wide ? Math.max(tr.height, 46) : tr.height) + 'px';
    k.classList.add('on');
    S.edit = { r: S.act.r, c: S.act.c, input: k, orig: raw, typed: mode === 'type' };
    if (mode === 'type') k.value = '';
    else { k.value = raw; k.focus({ preventScroll: true }); try { k.setSelectionRange(k.value.length, k.value.length); } catch (e) {} }
    return true;
  }
  function endEditUi() { const k = keyEl(); if (!k) return; k.classList.remove('on'); k.value = ''; }
  function commitEdit() {
    const ed = S.edit; if (!ed) return;
    S.edit = null;
    const v = ed.input.value; endEditUi();
    if (v !== ed.orig && !(ed.typed && v === '')) { const row = S.view[ed.r], col = colAt(ed.c); const ch = changeFor(row, col, v); if (ch.rows.length || ch.cases.length) apply(ch); }
    focusKey();
  }
  function cancelEdit() { if (!S.edit) return; S.edit = null; endEditUi(); }
  function move(dr, dc) { if (!S.act) return; setAct(S.act.r + dr, S.act.c + dc); }

  /* ---------- コピー・貼り付け・消す ---------- */
  function selText() {
    if (!S.sel) return '';
    const r0 = Math.min(S.sel.r0, S.sel.r1), r1 = Math.max(S.sel.r0, S.sel.r1), c0 = Math.min(S.sel.c0, S.sel.c1), c1 = Math.max(S.sel.c0, S.sel.c1);
    const lines = [];
    for (let r = r0; r <= r1; r++) {
      const row = S.view[r]; const cells = [];
      const b = row && row.row_type !== 'group' ? barsOf(row) : {};
      for (let c = c0; c <= c1; c++) {
        if (isSlot(c)) cells.push(b[slotKeyAt(c)] || '');
        else { const col = colAt(c); const v = valueOf(row, col); cells.push(v == null ? '' : (/[\t\n"]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v))); }
      }
      lines.push(cells.join('\t'));
    }
    return lines.join('\r\n');
  }
  function parseTsv(t) {
    const rows = []; let row = [], cell = '', q = false;
    t = String(t || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"' && cell === '') q = true;
      else if (ch === '\t') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell); rows.push(row);
    return rows;
  }
  function paste(text) {
    if (!S.act) return;
    const data = parseTsv(text); if (!data.length) return;
    const ch = { rows: [], cases: [], inserts: [] };
    // 足りない行は足す（Excel から長い表を貼った時）
    const need = S.act.r + data.length - S.view.length;
    let extra = [];
    if (need > 0) extra = newRows(need, S.view.length - 1);
    const all = S.view.concat(extra);
    data.forEach((cells, i) => {
      const row = all[S.act.r + i]; if (!row) return;
      const slotSet = {};
      cells.forEach((v, j) => {
        const c = S.act.c + j; if (c >= ncols()) return;
        if (isSlot(c)) { const k = slotKeyAt(c); const col = String(v).trim().toLowerCase(); slotSet[k] = COLORS[col] ? col : (col ? 'y' : null); }
        else if (extra.includes(row)) { const col = colAt(c); if (!col.calc && !col.derived) Object.assign(row, { [col.k]: col.num ? numOrNull(parseNum(v)) : v }); }
        else changeFor(row, colAt(c), v, ch);
      });
      const ks = Object.keys(slotSet);
      if (ks.length && !extra.includes(row)) {
        ['r', 'o', 'y', null].forEach((color) => { const these = ks.filter((k) => slotSet[k] === color); if (these.length) paintChange(row, these, color || 'erase', ch); });
      } else if (ks.length) { row.bars = {}; ks.forEach((k) => { if (slotSet[k]) row.bars[k] = slotSet[k]; }); }
    });
    if (extra.length) ch.inserts = extra;
    apply(ch);
    S.sel = { r0: S.act.r, c0: S.act.c, r1: Math.min(S.view.length - 1, S.act.r + data.length - 1), c1: Math.min(ncols() - 1, S.act.c + data[0].length - 1) };
    paintSel();
  }
  function clearSel() {
    if (!S.sel) return;
    const r0 = Math.min(S.sel.r0, S.sel.r1), r1 = Math.max(S.sel.r0, S.sel.r1), c0 = Math.min(S.sel.c0, S.sel.c1), c1 = Math.max(S.sel.c0, S.sel.c1);
    const ch = { rows: [], cases: [] };
    for (let r = r0; r <= r1; r++) {
      const row = S.view[r];
      const ks = [];
      for (let c = c0; c <= c1; c++) { if (isSlot(c)) ks.push(slotKeyAt(c)); else if (editable(row, colAt(c))) changeFor(row, colAt(c), '', ch); }
      if (ks.length) paintChange(row, ks, 'erase', ch);
    }
    if (ch.rows.length || ch.cases.length) apply(ch);
  }

  /* ---------- 行 ---------- */
  function newRows(n, afterIndex, base) {
    const after = S.view[afterIndex], next = S.view[afterIndex + 1];
    const a = after ? after.sort_order : 0, b = next ? next.sort_order : a + (n + 1) * 1000;
    const out = [];
    for (let i = 1; i <= n; i++) out.push(Object.assign({ id: uuid(), plan_id: S.plan.id, sort_order: a + (b - a) * i / (n + 1), row_type: 'item', case_id: null, group_name: '', stage: '', theater: '', name: '', amount: null, margin_rate: null, person: '', design_person: '', build_person: '', partner: '', note: '', bars: {}, updated_by: userName() }, base || {}));
    return out;
  }
  function addRow(group) {
    const at = S.sel ? Math.max(S.sel.r0, S.sel.r1) : S.view.length - 1;
    const rows = newRows(1, at, group ? { row_type: 'group', group_name: '見出し' } : {});
    apply({ inserts: rows });
    const i = S.view.findIndex((r) => r.id === rows[0].id); setAct(i, visibleCols().findIndex((c) => c.k === 'name'));   // 案件名（見出しは見出しの名前）から打ち始める
  }
  async function delRows() {
    const rows = selRows(); if (!rows.length) { say('消す行を選んでください（左の番号を押すと行を選べます）。'); return; }
    const linked = rows.filter((r) => r.case_id).length;
    if (!(await ask(`選んだ ${rows.length} 行を消しますか？${linked ? `\n（案件とつながる行が ${linked} 行あります。予定表から外すだけで、案件は消えません）` : ''}\n消したあとも「↶ 元に戻す」で戻せます。`, { ok: '行を消す', danger: true }))) return;
    apply({ deletes: rows.map((r) => r.id) });
    setAct(Math.min(S.act ? S.act.r : 0, S.view.length - 1), S.act ? S.act.c : 0);
    focusKey();
  }
  function moveRows(d) {
    const rows = selRows(); if (!rows.length) return;
    const i0 = S.view.indexOf(rows[0]), i1 = S.view.indexOf(rows[rows.length - 1]);
    const tgt = d < 0 ? i0 - 1 : i1 + 1; if (tgt < 0 || tgt >= S.view.length) return;
    const other = S.view[tgt];
    // 動かす行と、となりの行の並び順を入れかえる
    const order = S.view.map((r) => r.sort_order);
    const seq = S.view.slice();
    seq.splice(tgt, 1); seq.splice(d < 0 ? i1 : i0, 0, other);
    const ch = { rows: [] };
    seq.forEach((r, i) => { if (r.sort_order !== order[i]) ch.rows.push({ id: r.id, patch: { sort_order: order[i] } }); });
    apply(ch);
    S.sel.r0 += d; S.sel.r1 += d; S.act.r += d; paintSel(); status();
  }

  /* ---------- 案件から入れる ---------- */
  function pickCases() {
    closeOverlay(); refreshCases();
    const inPlan = new Set(S.rows.filter((r) => r.case_id).map((r) => String(r.case_id)));
    let showDone = false;
    const ov = document.createElement('div');
    ov.className = 'pl-ov'; ov.id = 'plPick';
    ov.innerHTML = `<div class="pl-dlg"><div class="pl-dlg-h">＋ 案件から入れる<button type="button" class="close-btn" data-x>×</button></div>
      <div class="pl-dlg-b"><div class="pl-pick-bar"><input type="search" class="tm-input" id="plPickQ" placeholder="🔍 劇場名・案件名・担当で探す"><label><input type="checkbox" id="plPickDone"> 完了した案件も出す</label><span id="plPickN"></span></div>
      <div class="pl-pick-list" id="plPickList"></div></div>
      <div class="pl-dlg-f"><span class="pl-hint">チェックした案件を、会社ごとの見出しの下に入れます（見出しが無ければ作ります）。案件とつながるので、どちらで直しても同じになります。</span><button type="button" class="primary" data-ok>入れる</button><button type="button" data-x>やめる</button></div></div>`;
    document.body.appendChild(ov);
    const sel = new Set();
    const draw = () => {
      const q = norm(ov.querySelector('#plPickQ').value);
      const list = Array.from(S.cases.values()).filter((c) => (showDone || !DONE.includes(c.status)) && (!q || norm([c.theater, short(c.theater), c.estimateName, c.content, c.rPerson, c.company].join(' ')).includes(q)))
        .sort((a, b) => (Number(b.estimateAmount) || 0) - (Number(a.estimateAmount) || 0));
      ov.querySelector('#plPickList').innerHTML = list.length ? `<table class="pl-pick"><thead><tr><th></th><th>会社</th><th>劇場</th><th>案件名（見積り名）</th><th class="num">金額（税抜）</th><th>状態</th><th>担当</th></tr></thead><tbody>${list.slice(0, 400).map((c) => {
        const id = String(c.id), done = inPlan.has(id);
        return `<tr class="${done ? 'in' : ''}"><td><input type="checkbox" data-id="${esc(id)}" ${done ? 'disabled title="もう入っています"' : ''} ${sel.has(id) ? 'checked' : ''}></td><td>${esc(c.company)}</td><td>${esc(short(c.theater))}</td><td>${esc(c.estimateName || String(c.content || '').slice(0, 40))}${done ? ' <small>（入っています）</small>' : ''}</td><td class="num">${c.estimateAmount ? Number(c.estimateAmount).toLocaleString('ja-JP') : ''}</td><td>${esc(c.status || '')}</td><td>${esc(c.rPerson || '')}</td></tr>`;
      }).join('')}</tbody></table>` : '<p class="empty-msg">合う案件がありません。</p>';
      ov.querySelector('#plPickN').textContent = sel.size ? `${sel.size} 件を選んでいます` : '';
    };
    draw();
    ov.querySelector('#plPickQ').addEventListener('input', draw);
    ov.querySelector('#plPickDone').addEventListener('change', (e) => { showDone = e.target.checked; draw(); });
    ov.addEventListener('change', (e) => { if (e.target.dataset.id) { if (e.target.checked) sel.add(e.target.dataset.id); else sel.delete(e.target.dataset.id); ov.querySelector('#plPickN').textContent = sel.size ? `${sel.size} 件を選んでいます` : ''; } });
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]')) { closeOverlay(); return; }
      if (e.target.closest('[data-ok]')) {
        if (!sel.size) { say('入れる案件にチェックを入れてください。'); return; }
        addCases(Array.from(sel).map((id) => S.cases.get(id)).filter(Boolean)); closeOverlay(); focusKey();
      }
    });
    setTimeout(() => ov.querySelector('#plPickQ').focus(), 0);
  }
  function groupNameOf(company) { const c = call('companies', []).find((x) => x.name === company); return (c && c.name) || company || 'その他'; }
  function addCases(list) {
    const inserts = [];
    const view = S.view.slice();
    list.forEach((c) => {
      const gname = groupNameOf(c.company);
      let gi = view.findIndex((r) => r.row_type === 'group' && norm(r.group_name) === norm(gname));
      if (gi < 0) {
        const last = view.length ? view[view.length - 1].sort_order : 0;
        const g = { id: uuid(), plan_id: S.plan.id, sort_order: last + 1000, row_type: 'group', case_id: null, group_name: gname, stage: '', theater: '', name: '', amount: null, margin_rate: null, person: '', design_person: '', build_person: '', partner: '', note: '', bars: {}, updated_by: userName() };
        view.push(g); inserts.push(g); gi = view.length - 1;
      }
      let end = gi; while (end + 1 < view.length && view[end + 1].row_type !== 'group') end++;
      const a = view[end].sort_order, b = view[end + 1] ? view[end + 1].sort_order : a + 1000;
      const row = { id: uuid(), plan_id: S.plan.id, sort_order: (a + b) / 2, row_type: 'item', case_id: String(c.id), group_name: '', stage: ONHAND.includes(c.status) ? '手持ち' : '受注予定', theater: c.theater || '', name: c.estimateName || '', amount: numOrNull(c.estimateAmount), margin_rate: numOrNull(c.marginRate), person: c.rPerson || '', design_person: '', build_person: '', partner: '', note: '', bars: {}, updated_by: userName() };
      view.splice(end + 1, 0, row); inserts.push(row);
    });
    apply({ inserts });
    toast(`${list.length} 件の案件を入れました`);
  }

  /* ---------- 表（シート） ---------- */
  async function planDialog(p) {
    closeOverlay();
    const isNew = !p;
    const d = new Date();
    p = p || { title: (d.getMonth() + 1 >= 10 ? d.getFullYear() : d.getFullYear() - 1) + 1 + '年度', start_month: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-01', months: 18, slots: 6 };
    const ov = document.createElement('div');
    ov.className = 'pl-ov'; ov.id = 'plPlan';
    ov.innerHTML = `<div class="pl-dlg pl-dlg-s"><div class="pl-dlg-h">${isNew ? '＋ 新しい表（年度）' : '表の名前・期間'}<button type="button" class="close-btn" data-x>×</button></div>
      <div class="pl-dlg-b pl-form">
        <label>名前 <input type="text" class="tm-input" id="plPTitle" value="${esc(p.title)}"></label>
        <label>左端の月 <input type="month" class="tm-input" id="plPStart" value="${esc(String(p.start_month).slice(0, 7))}"></label>
        <label>月の数 <input type="number" class="tm-input" id="plPMonths" min="3" max="36" value="${esc(p.months || 18)}"></label>
        ${isNew && S.plan ? `<label class="pl-chk"><input type="checkbox" id="plPCopy" checked> 今の表「${esc(S.plan.title)}」の行（見出し・案件）を写して始める</label>` : ''}
      </div>
      <div class="pl-dlg-f">${!isNew && S.plans.length > 1 ? '<button type="button" class="danger" data-del style="margin-right:auto">この表を消す</button>' : ''}<button type="button" class="primary" data-ok>${isNew ? '作る' : '保存'}</button><button type="button" data-x>やめる</button></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]')) { closeOverlay(); return; }
      if (e.target.closest('[data-del]')) {
        if (!(await ask(`表「${p.title}」を消しますか？（中の行も見えなくなります）`, { ok: '消す', danger: true }))) return;
        await api.updatePlan(p.id, { deleted_at: nowIso() }); S.plans = S.plans.filter((x) => x.id !== p.id); closeOverlay(); await selectPlan(S.plans[0].id); return;
      }
      if (!e.target.closest('[data-ok]')) return;
      const vals = { title: ov.querySelector('#plPTitle').value.trim() || '無題', start_month: (ov.querySelector('#plPStart').value || String(p.start_month).slice(0, 7)) + '-01', months: Math.max(3, Math.min(36, Number(ov.querySelector('#plPMonths').value) || 18)) };
      try {
        if (isNew) {
          const np = await api.insertPlan(Object.assign({ slots: 6, sort_order: S.plans.length, created_by: userName() }, vals));
          if (ov.querySelector('#plPCopy') && ov.querySelector('#plPCopy').checked) {
            const copy = S.rows.map((r) => Object.assign(dbRow(r), { id: uuid(), plan_id: np.id, bars: {} }));   // 棒は新しい年度で塗り直す
            await api.insertRows(copy);
          }
          S.plans.push(np); closeOverlay(); await selectPlan(np.id);
        } else {
          await api.updatePlan(p.id, vals); Object.assign(p, vals); closeOverlay(); renderAll();
        }
      } catch (err) { say('保存に失敗しました: ' + (err.message || err)); }
    });
  }

  /* ============================================================
     Excel（同じ形で出す・読む）
     ============================================================ */
  const fileSafe = (s) => String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_');
  function buildXlsx() {
    const wb = XLSXW.book();
    const cols = COLS, keys = slotKeys(), mos = months(), n = slotsN();
    const sh = wb.sheet(S.plan.title || '工事予定表', { cols: [6].concat(cols.map((c) => Math.max(6, Math.round(c.w / 7)))).concat(keys.map(() => 2.2)).concat([0.5]), freeze: 'E5', landscape: true, grid: false, tab: '1F4E79' });
    const H = { font: { b: true, color: 'FFFFFF' }, fill: '1F4E79', border: 'all', h: 'center', wrap: true };
    const B = { border: 'all', v: 'top', wrap: true };
    const N = { border: 'all', h: 'right', fmt: '#,##0' };
    const G = { border: 'all', font: { b: true }, fill: 'DDEBF7' };
    const GN = { border: 'all', font: { b: true }, fill: 'DDEBF7', h: 'right', fmt: '#,##0' };
    const L = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const AM = L(1 + 3), RT = L(1 + 4), PF = L(1 + 5);
    sh.set('A1', { v: `工事予定表　${S.plan.title}`, st: { font: { b: true, sz: 14 } } });
    sh.set('A2', { v: `出力 ${new Date().toLocaleString('ja-JP')}　赤＝受注見込み・橙＝設計（計画・準備）・黄＝施工（工事）　🔗＝案件とつながる行（右端の列は行の目印。消さないでください）`, st: { font: { color: '666666' } } });
    sh.set([3, 0], { v: 'No', st: H }); sh.merge('A3:A4');
    cols.forEach((c, i) => { sh.set([3, i + 1], { v: c.label, st: H }); sh.set([4, i + 1], { st: H }); sh.merge(`${L(i + 1)}3:${L(i + 1)}4`); });
    let ci = cols.length + 1;
    mos.forEach((mo) => { sh.set([3, ci], { v: `${mo.y}/${mo.m}月`, st: H }); for (let k = 0; k < n; k++) sh.set([4, ci + k], { v: '', st: H }); sh.merge(`${L(ci)}3:${L(ci + n - 1)}3`); ci += n; });
    const idCol = ci; sh.set([3, idCol], { v: '行ID', st: { font: { color: 'BBBBBB', sz: 8 } } });
    const fills = {}; Object.keys(COLORS).forEach((k) => { fills[k] = { fill: COLORS[k].rgb, border: { l: 'hair', r: 'hair', t: 'hair', b: 'hair' }, bc: 'BFBFBF' }; });
    const thin = { border: { l: 'hair', r: 'hair', t: 'hair', b: 'hair' }, bc: 'D9D9D9' };
    let r = 5; const groupRows = [], itemRows = [];
    S.view.forEach((row, idx) => {
      if (row.row_type === 'group') {
        groupRows.push(r);
        sh.set([r, 0], { v: '', st: G });
        cols.forEach((c, i) => sh.set([r, i + 1], { v: i === 2 ? row.group_name : '', st: c.num || c.calc ? GN : G }));
      } else {
        itemRows.push(r);
        sh.set([r, 0], { v: idx + 1, st: Object.assign({}, B, { h: 'center' }) });
        cols.forEach((c, i) => {
          if (c.k === 'profit') { const a = valueOf(row, cols[3]), m = valueOf(row, cols[4]); sh.set([r, i + 1], { f: `IF(${AM}${r}="","",${AM}${r}*N(${RT}${r})/100)`, v: a == null ? '' : Math.round(a * (m || 0) / 100), st: N }); return; }
          let v = valueOf(row, c);
          if (c.k === 'name' && row.case_id) v = '🔗' + (v || '');
          sh.set([r, i + 1], { v: v == null ? '' : v, st: c.num ? Object.assign({}, N, c.k === 'margin_rate' ? { fmt: '0.0' } : {}) : B });
        });
        const b = barsOf(row);
        keys.forEach((k, j) => sh.set([r, cols.length + 1 + j], { v: '', st: b[k] ? fills[b[k]] : thin }));
      }
      sh.set([r, idCol], { v: row.id, st: { font: { color: 'BBBBBB', sz: 6 } } });
      r++;
    });
    // 見出し行の小計（次の見出しまで）・合計
    groupRows.forEach((gr, i) => { const end = (groupRows[i + 1] || r) - 1; if (end > gr) { sh.set(`${AM}${gr}`, { f: `SUM(${AM}${gr + 1}:${AM}${end})`, v: 0, st: GN }); sh.set(`${PF}${gr}`, { f: `SUM(${PF}${gr + 1}:${PF}${end})`, v: 0, st: GN }); } });
    const T = { border: 'all', font: { b: true }, fill: 'FFF2CC' };
    sh.set([r, 3], { v: '合計', st: T });
    const sumOf = (col) => itemRows.length ? itemRows.map((x) => `${col}${x}`).join(',') : '0';
    sh.set(`${AM}${r}`, { f: `SUM(${sumOf(AM)})`, v: 0, st: Object.assign({}, T, { h: 'right', fmt: '#,##0' }) });
    sh.set(`${PF}${r}`, { f: `SUM(${sumOf(PF)})`, v: 0, st: Object.assign({}, T, { h: 'right', fmt: '#,##0' }) });
    return wb;
  }
  async function exportXlsx() {
    if (!window.XLSXW) { say('Excel を作る部品が読み込まれていません'); return; }
    flush();
    const blob = await buildXlsx().blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const d = new Date(); a.download = `工事予定表_${fileSafe(S.plan.title)}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.xlsx`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  // この画面で出した形の Excel を読む（行IDで行を見つけて直す。行IDの無い行は新しい行として足す）
  async function importXlsx(file) {
    if (typeof JSZip === 'undefined') { say('Excel を読む部品（JSZip）がありません'); return; }
    let zip; try { zip = await JSZip.loadAsync(await file.arrayBuffer()); } catch (e) { say('Excel を開けませんでした（.xlsx だけ読めます）'); return; }
    const P = new DOMParser();
    const xml = async (p) => { const f = zip.file(p); return f ? P.parseFromString(await f.async('string'), 'application/xml') : null; };
    const ss = await xml('xl/sharedStrings.xml');
    const strings = ss ? Array.from(ss.getElementsByTagName('si')).map((si) => Array.from(si.getElementsByTagName('t')).map((t) => t.textContent).join('')) : [];
    const st = await xml('xl/styles.xml');
    const fillRgb = st ? Array.from(st.getElementsByTagName('fills')[0].getElementsByTagName('fill')).map((f) => { const fg = f.getElementsByTagName('fgColor')[0]; return fg ? String(fg.getAttribute('rgb') || '').slice(-6).toUpperCase() : ''; }) : [];
    const xfFill = st ? Array.from(st.getElementsByTagName('cellXfs')[0].getElementsByTagName('xf')).map((x) => Number(x.getAttribute('fillId') || 0)) : [];
    const sheet = await xml('xl/worksheets/sheet1.xml'); if (!sheet) { say('シートが見つかりません'); return; }
    const grid = {};
    const colN = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
    Array.from(sheet.getElementsByTagName('c')).forEach((c) => {
      const ref = c.getAttribute('r'); const r = Number(ref.replace(/[A-Z]+/g, '')); const ci = colN(ref);
      const t = c.getAttribute('t'); const v = c.getElementsByTagName('v')[0]; const is = c.getElementsByTagName('is')[0];
      let val = '';
      if (t === 's' && v) val = strings[Number(v.textContent)] || ''; else if (t === 'inlineStr' && is) val = Array.from(is.getElementsByTagName('t')).map((x) => x.textContent).join(''); else if (v) val = v.textContent;
      const s = Number(c.getAttribute('s') || 0); const rgb = fillRgb[xfFill[s]] || '';
      (grid[r] = grid[r] || {})[ci] = { val, rgb };
    });
    // 見出しの行を探す
    const hr = Object.keys(grid).map(Number).find((r) => Object.values(grid[r]).some((x) => x.val === '案件名'));
    if (!hr) { say('「案件名」の見出しが見つかりません。この画面の「⬇ Excel で出す」で出した Excel を読んでください。'); return; }
    const head = {}; Object.keys(grid[hr]).forEach((ci) => { head[grid[hr][ci].val] = Number(ci); });
    const idCi = head['行ID']; const firstSlot = COLS.length + 1;
    const keys = slotKeys(); const rgb2c = {}; Object.keys(COLORS).forEach((k) => { rgb2c[COLORS[k].rgb] = k; });
    const ch = { rows: [], cases: [], inserts: [] }; let upd = 0, add = 0;
    Object.keys(grid).map(Number).filter((r) => r > hr + 1).sort((a, b) => a - b).forEach((r) => {
      const g = grid[r]; const id = idCi != null && g[idCi] ? g[idCi].val : '';
      const nameCell = g[head['案件名']] ? g[head['案件名']].val : '';
      if (!id && !nameCell) return;
      if (g[3] && g[3].val === '合計') return;
      const row = id ? S.rows.find((x) => x.id === id) : null;
      const bars = {}; keys.forEach((k, j) => { const cell = g[firstSlot + j]; const col = cell && rgb2c[cell.rgb]; if (col) bars[k] = col; });
      if (row) {
        if (row.row_type === 'group') { if (nameCell && nameCell !== row.group_name) { ch.rows.push({ id: row.id, patch: { group_name: nameCell } }); upd++; } return; }
        let changed = false;
        COLS.forEach((c) => {
          if (c.calc || c.derived) return; const ci = head[c.label]; if (ci == null) return;
          let v = g[ci] ? g[ci].val : ''; if (c.k === 'name') v = v.replace(/^🔗/, '');
          const cur = valueOf(row, c);
          const same = c.num ? (numOrNull(v) === (cur == null ? null : Number(cur))) : String(v) === String(cur == null ? '' : cur);
          if (!same && editable(row, c)) { changeFor(row, c, v, ch); changed = true; }
        });
        const cur = barsOf(row);
        const diff = keys.filter((k) => (cur[k] || '') !== (bars[k] || ''));
        if (diff.length) { ['r', 'o', 'y'].forEach((col) => { const set = diff.filter((k) => bars[k] === col); if (set.length) paintChange(row, set, col, ch); }); const er = diff.filter((k) => !bars[k]); if (er.length) paintChange(row, er, 'erase', ch); changed = true; }
        if (changed) upd++;
      } else {
        const nr = newRows(1, S.view.length - 1 + ch.inserts.length)[0];
        nr.sort_order = (S.view.length ? S.view[S.view.length - 1].sort_order : 0) + 1000 * (ch.inserts.length + 1);
        COLS.forEach((c) => { if (c.calc || c.derived) return; const ci = head[c.label]; if (ci == null || !g[ci]) return; nr[c.k] = c.num ? numOrNull(g[ci].val) : g[ci].val; });
        nr.bars = bars; ch.inserts.push(nr); add++;
      }
    });
    if (!upd && !add) { say('Excel と今の表に違いはありませんでした。'); return; }
    if (!(await ask(`Excel の内容で、${upd} 行を直し、${add} 行を足します。よろしいですか？\n（Excel に無い行は消しません。案件とつながる行を直すと案件も直ります。「↶ 元に戻す」で戻せます）`, { ok: '読み込む' }))) return;
    apply(ch);
    toast(`Excel から ${upd} 行を直し、${add} 行を足しました`);
  }

  /* ---------- 印刷（A3 横） ---------- */
  function printPlan() {
    flush(); cancelEdit();
    const tbl = $('plTbl'); if (!tbl) return;
    document.body.classList.add('pl-printing');
    const pageW = 1530;   // A3 横（余白 8mm）を 96dpi で
    const w = tbl.scrollWidth; const z = Math.min(1, pageW / w);
    tbl.style.zoom = z;
    const done = () => { document.body.classList.remove('pl-printing'); tbl.style.zoom = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { window.print(); setTimeout(done, 500); }, 50);
  }

  /* ============================================================
     画面の操作
     ============================================================ */
  let drag = null;
  document.addEventListener('mousedown', (e) => {
    if (!S.open) return;
    const g = $('plGrid'); if (!g || !g.contains(e.target)) return;
    if (e.target === keyEl()) return;
    const rs = e.target.closest('.pl-rs');
    if (rs) { e.preventDefault(); const th = rs.parentElement; const k = rs.dataset.rs; const x0 = e.clientX, w0 = th.getBoundingClientRect().width; drag = { kind: 'resize', k, x0, w0 }; return; }
    const rh = e.target.closest('th.pl-rh[data-r]');
    if (rh) { e.preventDefault(); if (S.edit) commitEdit(); const r = Number(rh.dataset.r); if (e.shiftKey && S.sel) { S.sel.r1 = r; S.sel.c0 = 0; S.sel.c1 = ncols() - 1; } else { S.sel = { r0: r, c0: 0, r1: r, c1: ncols() - 1 }; S.act = { r, c: 1 }; } paintSel(); status(); drag = { kind: 'rows', r0: S.sel.r0 }; focusKey(); return; }
    const td = e.target.closest('td[data-c]'); if (!td) return;
    e.preventDefault();
    if (S.edit) commitEdit();
    const r = Number(td.dataset.r), c = Number(td.dataset.c);
    if (isSlot(c) && S.tool !== 'select') {
      const row = S.view[r]; if (!row || row.row_type === 'group') return;
      drag = { kind: 'paint', r, c0: c, c1: c }; previewPaint(); setAct(r, c); focusKey(); return;
    }
    if (e.shiftKey && S.act) { setAct(r, c, true); focusKey(); return; }
    setAct(r, c); focusKey(); drag = { kind: 'select' };
  });
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    if (drag.kind === 'resize') { const w = Math.max(40, Math.round(drag.w0 + e.clientX - drag.x0)); S.colw[drag.k] = w; const th = document.querySelector(`.pl-rs[data-rs="${drag.k}"]`); if (th) { th.parentElement.style.width = w + 'px'; th.parentElement.style.minWidth = w + 'px'; } return; }
    const td = document.elementFromPoint(e.clientX, e.clientY); const cell = td && td.closest && td.closest('td[data-c], th.pl-rh[data-r]'); if (!cell) return;
    const r = Number(cell.dataset.r);
    if (drag.kind === 'rows') { if (!isNaN(r)) { S.sel.r1 = r; paintSel(); } return; }
    const c = Number(cell.dataset.c); if (isNaN(c)) return;
    if (drag.kind === 'paint') { if (isSlot(c)) { drag.c1 = c; previewPaint(); } return; }
    if (drag.kind === 'select') { S.sel.r1 = r; S.sel.c1 = c; paintSel(); }
  });
  document.addEventListener('mouseup', () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === 'resize') { lsSet(LS.colw, S.colw); renderBody(); return; }
    if (d.kind === 'paint') {
      const row = S.view[d.r]; const a = Math.min(d.c0, d.c1), b = Math.max(d.c0, d.c1);
      const ks = []; for (let c = a; c <= b; c++) ks.push(slotKeyAt(c));
      document.querySelectorAll('.pl-pv').forEach((x) => x.classList.remove('pl-pv', 'pl-pv-erase', 'pl-pv-r', 'pl-pv-o', 'pl-pv-y'));
      apply(paintChange(row, ks, S.tool === 'erase' ? 'erase' : S.tool));
    }
  });
  function previewPaint() {
    document.querySelectorAll('.pl-pv').forEach((x) => x.classList.remove('pl-pv', 'pl-pv-erase', 'pl-pv-r', 'pl-pv-o', 'pl-pv-y'));
    const a = Math.min(drag.c0, drag.c1), b = Math.max(drag.c0, drag.c1);
    for (let c = a; c <= b; c++) { const e = cellEl(drag.r, c); if (e) e.classList.add('pl-pv', 'pl-pv-' + (S.tool === 'erase' ? 'erase' : S.tool)); }
  }
  document.addEventListener('dblclick', (e) => {
    if (!S.open) return;
    const td = e.target.closest && e.target.closest('#plGrid td[data-c]');
    if (td && !isSlot(Number(td.dataset.c))) { startEdit('keep'); return; }
    const sheet = e.target.closest && e.target.closest('.pl-sheet[data-plan]');
    if (sheet) planDialog(S.plans.find((p) => p.id === sheet.dataset.plan));
  });
  document.addEventListener('click', (e) => {
    if (!S.open) return;
    const v = $('planView'); if (!v || !v.contains(e.target)) return;
    const b = e.target.closest('[data-act], [data-tool], .pl-sheet[data-plan]'); if (!b) return;
    if (b.dataset.tool) { S.tool = b.dataset.tool; v.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('on', x.dataset.tool === S.tool)); $('plGrid').classList.toggle('pl-painting', S.tool !== 'select'); return; }
    if (b.dataset.plan) { if (b.dataset.plan !== S.plan.id) selectPlan(b.dataset.plan); return; }
    const a = b.dataset.act;
    if (a === 'add-case') pickCases();
    else if (a === 'add-row') addRow(false);
    else if (a === 'add-group') addRow(true);
    else if (a === 'del-row') delRows();
    else if (a === 'up') moveRows(-1);
    else if (a === 'down') moveRows(1);
    else if (a === 'undo') undo();
    else if (a === 'redo') redo();
    else if (a === 'compact') { S.compact = !S.compact; lsSet(LS.compact, S.compact); S.sel = null; S.act = null; renderAll(); }
    else if (a === 'xlsx') exportXlsx().catch((err) => say('Excel を作れませんでした: ' + (err.message || err)));
    else if (a === 'print') printPlan();
    else if (a === 'add-plan') planDialog(null);
    // ボタンを押したあとも、続けて打てるように選んだマスへ戻す
    if (['add-row', 'add-group', 'up', 'down', 'undo', 'redo'].indexOf(a) !== -1) focusKey();
  });
  document.addEventListener('change', (e) => {
    if (!S.open || e.target.id !== 'plImport') return;
    const f = e.target.files && e.target.files[0]; const inp = e.target;
    if (f) importXlsx(f).catch((err) => say('読み込めませんでした: ' + (err.message || err))).finally(() => { inp.value = ''; });
  });
  document.addEventListener('keydown', (e) => {
    if (!S.open) return;
    const k = keyEl(); if (!k || e.target !== k) return;
    if (document.querySelector('.pl-ov, .kt-ask-ov')) return;
    const key = e.key, ctrl = e.ctrlKey || e.metaKey;
    // ---- 直している最中 ----
    if (S.edit) {
      if (e.isComposing || key === 'Process') return;                // 日本語の変換中は何もしない
      const multi = (colAt(S.edit.c) || {}).k === 'note' || (colAt(S.edit.c) || {}).k === 'name';
      if (key === 'Enter' && e.altKey) { if (multi) { e.preventDefault(); const p = k.selectionStart; k.value = k.value.slice(0, p) + '\n' + k.value.slice(k.selectionEnd); k.setSelectionRange(p + 1, p + 1); } return; }
      if (key === 'Enter') { e.preventDefault(); commitEdit(); move(e.shiftKey ? -1 : 1, 0); focusKey(); return; }
      if (key === 'Tab') { e.preventDefault(); commitEdit(); move(0, e.shiftKey ? -1 : 1); focusKey(); return; }
      if (key === 'Escape') { e.preventDefault(); cancelEdit(); focusKey(); return; }
      if ((key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight') && S.edit.typed && !multi) {
        e.preventDefault(); commitEdit(); move(key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0, key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0); focusKey(); return;
      }
      return;
    }
    // ---- マスを選んでいる時（Excel と同じ） ----
    if (ctrl && (key === 'z' || key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (ctrl && (key === 'y' || key === 'Y')) { e.preventDefault(); redo(); return; }
    if (ctrl && (key === 'c' || key === 'x' || key === 'C' || key === 'X')) {
      // 入力欄に選んだ範囲の文字を入れて選んでおく（ブラウザが必ずコピーするように）。中身は下の copy/cut で入れ直す
      if (S.sel) { k.value = selText() || ' '; k.select(); setTimeout(() => { if (!S.edit) k.value = ''; }, 0); }
      return;
    }
    if (ctrl && (key === 'v' || key === 'V')) return;   // 貼り付けは下の paste で
    if (!S.act) { if (S.view.length && /^(Arrow|Enter|Tab)/.test(key)) { e.preventDefault(); setAct(0, 2); focusKey(); } return; }
    if (e.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) { e.preventDefault(); moveRows(key === 'ArrowUp' ? -1 : 1); focusKey(); return; }
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();
      const dr = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0, dc = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
      if (e.shiftKey) setAct(S.sel.r1 + dr, S.sel.c1 + dc, true);
      else if (ctrl) setAct(dr ? (dr < 0 ? 0 : S.view.length - 1) : S.act.r, dc ? (dc < 0 ? 0 : ncols() - 1) : S.act.c);
      else move(dr, dc);
      focusKey(); return;
    }
    if (key === 'Enter') { e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); focusKey(); return; }
    if (key === 'Tab') { e.preventDefault(); move(0, e.shiftKey ? -1 : 1); focusKey(); return; }
    if (key === 'F2') { e.preventDefault(); startEdit('keep'); return; }
    if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); clearSel(); return; }
    if (key === 'Home') { e.preventDefault(); setAct(ctrl ? 0 : S.act.r, 0); focusKey(); return; }
    if (key === 'End') { e.preventDefault(); setAct(ctrl ? S.view.length - 1 : S.act.r, ncols() - 1); focusKey(); return; }
    if (ctrl && (key === 'a' || key === 'A')) { e.preventDefault(); S.sel = { r0: 0, c0: 0, r1: S.view.length - 1, c1: ncols() - 1 }; paintSel(); return; }
    // 棒のマスで r / o / y を押すとその色で塗る（選んだ範囲）
    if (!ctrl && isSlot(S.act.c)) { if (/^[roy]$/i.test(key)) { e.preventDefault(); paintKeys(key.toLowerCase()); } else if (key.length === 1 || key === 'Process') e.preventDefault(); return; }
    // 文字のキー・日本語の変換の始まり → そのマスを直し始める（キーは止めない＝そのまま入る）
    if (!ctrl && !e.altKey && (key.length === 1 || key === 'Process' || e.isComposing)) { if (!startEdit('type')) e.preventDefault(); return; }
  });
  // 直している最中にほかの所を押したら、直した内容を入れる（Excel と同じ）
  document.addEventListener('focusout', (e) => { if (S.open && e.target === keyEl() && S.edit) { const ed = S.edit; setTimeout(() => { if (S.edit === ed && document.activeElement !== keyEl()) commitEdit(); }, 0); } });
  // キー無しで文字が入った時（スマホ・変換の確定など）も直し始める
  document.addEventListener('compositionstart', (e) => { if (S.open && e.target === keyEl() && !S.edit) startEdit('type'); });
  document.addEventListener('input', (e) => { if (S.open && e.target === keyEl() && !S.edit) { const v = keyEl().value; if (startEdit('type')) keyEl().value = v; else keyEl().value = ''; } });
  function paintKeys(color) {
    const r0 = Math.min(S.sel.r0, S.sel.r1), r1 = Math.max(S.sel.r0, S.sel.r1), c0 = Math.min(S.sel.c0, S.sel.c1), c1 = Math.max(S.sel.c0, S.sel.c1);
    const ch = { rows: [], cases: [] };
    for (let r = r0; r <= r1; r++) { const ks = []; for (let c = c0; c <= c1; c++) if (isSlot(c)) ks.push(slotKeyAt(c)); if (ks.length) paintChange(S.view[r], ks, color, ch); }
    apply(ch);
  }
  document.addEventListener('copy', (e) => { if (!S.open || S.edit || document.activeElement !== keyEl() || !S.sel) return; e.preventDefault(); e.clipboardData.setData('text/plain', selText()); });
  document.addEventListener('cut', (e) => { if (!S.open || S.edit || document.activeElement !== keyEl() || !S.sel) return; e.preventDefault(); e.clipboardData.setData('text/plain', selText()); clearSel(); });
  document.addEventListener('paste', (e) => { if (!S.open || S.edit || document.activeElement !== keyEl()) return; e.preventDefault(); paste(e.clipboardData.getData('text/plain')); });
  window.addEventListener('beforeunload', () => { if (S.open) flush(); });

  /* ---------- 小さな画面 ---------- */
  function closeOverlay() { document.querySelectorAll('.pl-ov').forEach((x) => x.remove()); }
  const ask = (m, o) => (window.KARTE && window.KARTE.ask) ? window.KARTE.ask(m, o) : Promise.resolve(window.confirm(m));
  const say = (m) => (window.KARTE && window.KARTE.say) ? window.KARTE.say(m) : window.alert(m);
  function toast(msg) { const t = document.createElement('div'); t.className = 'kt-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3200); }

  window.PLAN = { open, close, isOpen: () => S.open, _state: S, _parseMonths: parseMonths, _parseNum: parseNum, _slotOfDate: slotOfDate };
})();
