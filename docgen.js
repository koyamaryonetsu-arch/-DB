/* 🦺 安全書類・💰 大口予算書を案件から作る（2026-11-20・菱熱の画面だけ）
 *  ひな形は書類棚の「🦺 安全書類のひな形」「💰 大口予算書のひな形」（doc_files の data.kind = safety_tpl / budget_tpl）。
 *  ・安全書類: いつも全部（菱熱分＝1つずつ、業者分＝入る会社ごと）。工事・菱熱の責任者・入る会社（一次・二次）・作業員・火気/車両/持込機械・緊急連絡先を聞いてから、
 *    AI（/api/safety-ai の fill）が書式の入力セルに書き込む → 書類ごとの Excel を ZIP。案件の書類と書類棚（劇場のフォルダ）に残す（客先には送らない）
 *  ・大口予算書: 大口の案件だけ。支払先（商社・協力会社）ごとに支払う金額＋品名を聞いて、ひな形の実行予算に書き込む → Excel
 *  ・作業員マスター: 協力会社マスターの「👷 作業員」。手で入れる＋業者の名簿（Excel・PDF・写真）を AI が読んで足す。個人情報なので菱熱だけ
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const K = () => window.KARTE;
  const DB = () => window.CINEMA_DB || {};
  const sbc = () => (DB().mode && DB().mode() === 'supabase') ? DB().client() : null;
  const XL = () => window.WORKAPP && window.WORKAPP._xl;
  const toast = (m) => { try { DB().toast(m); } catch (e) { /* なし */ } };
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const yen = (n) => (Number(n) || 0).toLocaleString('ja-JP');
  const num = (v) => { const n = Number(String(v == null ? '' : v).normalize('NFKC').replace(/[,，円\s]/g, '')); return isNaN(n) ? 0 : n; };
  const clean = (s) => String(s || '').replace(/[\\/:*?"<>|\s　]/g, '').slice(0, 40);
  const yymmdd = (iso) => { const d = String(iso || today()).slice(0, 10).split('-'); return d[0].slice(2) + d[1] + d[2]; };
  const API = '/api/safety-ai';
  const RYONETSU = { company: '菱熱工業株式会社', address: '東京都品川区北品川6-7-29 ガーデンシティ品川御殿山', tel: '03-6456-4201' };

  async function api(action, body) {
    const sb = sbc(); let token = '';
    try { const { data } = await sb.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch (e) { /* なし */ }
    const r = await fetch(API, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(Object.assign({ action }, body)) });
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('通信に失敗しました（' + r.status + '）'));
    return j;
  }
  function caseOf(id) {
    const c = DB().caseInfo ? DB().caseInfo(id) : null;
    if (!c) throw new Error('案件が見つかりません');
    return c;
  }
  // 大口の案件（一覧の「大口のみ」と同じ: 見積り300万円以上（税抜）または 種別＝更新案件）
  function isLarge(c) { const a = Number(c && c.estimateAmount); return !!c && ((!isNaN(a) && a >= 3000000) || c.category === '更新案件'); }

  /* ============================================================
     ひな形（書類棚）
     ============================================================ */
  const VENDOR_RE = /施工体制台帳|作業員名簿|誓約書|再下請|下請負業者編成|編成表|火気|車両|持ち?込み?機械|持込/;
  async function loadTemplates(kind) {
    const sb = sbc(); if (!sb) throw new Error('ログインして使ってください');
    const { data, error } = await sb.from('doc_files').select('*').is('deleted_at', null);
    if (error) throw new Error('書類棚を読めませんでした（' + error.message + '）');
    return (data || []).filter((r) => r.data && r.data.kind === kind && r.data.path)
      .sort((a, b) => String(a.data.rel_path || a.name).localeCompare(String(b.data.rel_path || b.name), 'ja'));
  }
  // 安全書類のひな形を分ける: 業者分（会社ごと）／菱熱分（1つ）／使わない
  function classify(r) {
    const name = String(r.data.file_name || r.name || ''), path = String(r.data.rel_path || name);
    if (/不要/.test(name)) return { role: 'skip', why: '名前に「不要」' };
    const vendor = /業者分/.test(path) || VENDOR_RE.test(name);
    // PDF・写真・Word（掲示物など）は書き込まずに、そのまま ZIP に入れる（2026-11-20）
    if (/\.(pdf|jpe?g|png|docx?)$/i.test(name)) return { role: 'asis', vendor };
    if (!/\.xlsx$/i.test(name)) return { role: 'skip', why: 'Excel（.xlsx）ではない（.xlsx で保存し直して入れてください）' };
    if (vendor) return { role: 'vendor' };
    return { role: 'ryonetsu' };
  }
  const tplLabel = (r) => String(r.data.file_name || r.name || '').replace(/\.xlsx$/i, '').replace(/^\s*\d{2,4}[\s　_-]*/, '').replace(/〝新〟|全建(?:統一)?[書様]式|参考様式|第\s*[０-９\d]+\s*号(?:[－-][甲乙])?/g, '').replace(/[\s　_]+/g, ' ').trim();
  async function bytesOf(path) {
    const { data, error } = await sbc().storage.from('doc-files').download(path);
    if (error) throw new Error('ひな形を読めませんでした（' + error.message + '）');
    return new Uint8Array(await data.arrayBuffer());
  }
  // AI に見せるひな形の中身（式のセルに印・見本のシートに印）
  function describe(book) {
    const x = XL();
    return book.sheets.map((sh) => {
      const cells = x.cells(book, sh).filter((c) => c.f || String(c.v).trim() !== '');
      const rows = new Map();
      cells.forEach((c) => { const m = String(c.ref).match(/^([A-Z]+)(\d+)$/); if (!m) return; const r = +m[2]; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(c); });
      const lines = [...rows.keys()].sort((a, b) => a - b).slice(0, 260).map((r) => `行${r}: ` + rows.get(r).map((c) => c.f ? `${c.ref}=(式)` : `${c.ref}=${JSON.stringify(String(c.v).slice(0, 60))}`).join(' '));
      const sample = /記載例|記入例|記入要領|見本|説明/.test(sh.name) ? '（見本・説明のシート。書かない）' : '';
      return `【シート: ${sh.name}】${sh.hidden ? '（隠しシート。書かない）' : ''}${sample}\n結合: ${x.merges(sh).slice(0, 400).join(', ') || 'なし'}\n` + lines.join('\n');
    }).join('\n\n');
  }
  async function fillOne(tplRow, kind, data, instruction) {
    const x = XL();
    const book = await x.open(await bytesOf(tplRow.data.path));
    const res = await api('fill', { template: { name: tplRow.data.file_name || tplRow.name, kind, sheets: describe(book) }, data, instruction: instruction || '' });
    const errs = x.apply(book, res.entries.map((e) => Object.assign({}, e, { value: e.value })));
    const bytes = await x.save(book);
    return { book, bytes, entries: res.entries, unfilled: res.unfilled || [], warnings: (res.warnings || []).concat(errs) };
  }

  /* ============================================================
     ダイアログ
     ============================================================ */
  function dialog(id, title, wide) {
    document.querySelectorAll('#' + id).forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = id;
    ov.innerHTML = `<div class="kt-dialog dg-dlg${wide ? ' dg-wide' : ''}"><div class="kt-dlg-head"><span class="dg-title">${title}</span><button type="button" class="close-btn" data-dgx>×</button></div><div class="kt-dlg-body dg-body"></div><div class="kt-dlg-foot dg-foot"></div></div>`;
    document.body.appendChild(ov);
    return { ov, body: ov.querySelector('.dg-body'), foot: ov.querySelector('.dg-foot') };
  }
  // 文字を入れてもらう小さな画面（ブラウザの入力ダイアログは使わない）
  function askText(msg, ph) {
    return new Promise((resolve) => {
      const ov = document.createElement('div'); ov.className = 'kt-ask-ov'; ov.setAttribute('role', 'dialog');
      ov.innerHTML = `<div class="kt-ask"><div class="kt-ask-msg">${esc(msg)}</div><textarea class="tm-input dg-asktext" rows="3" placeholder="${esc(ph || '')}"></textarea><div class="kt-ask-btns"><button type="button" class="kt-ask-no">やめる</button><button type="button" class="kt-ask-yes primary">これで直す</button></div></div>`;
      document.body.appendChild(ov);
      const ta = ov.querySelector('textarea'); ta.focus();
      ov.addEventListener('click', (e) => { if (e.target.closest('.kt-ask-yes')) { const v = ta.value.trim(); ov.remove(); resolve(v); } else if (e.target.closest('.kt-ask-no') || e.target === ov) { ov.remove(); resolve(''); } });
    });
  }
  function download(name, bytes, mime) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  async function lastMeta(kind, c) {
    try {
      const { data } = await sbc().from('case_files').select('case_id,meta,created_at').eq('kind', kind).is('deleted_at', null).order('created_at', { ascending: false }).limit(100);
      const rows = (data || []).filter((r) => r.meta && r.meta.answers);
      return (rows.find((r) => String(r.case_id) === String(c.id)) || rows.find((r) => r.meta.theater === c.theater) || rows.find((r) => r.meta.company === c.company) || rows[0] || {}).meta || null;
    } catch (e) { return null; }
  }

  /* ============================================================
     前に入れた値（プルダウンの候補）: 使った回数の多い順・会社や劇場は分けない（2026-11-20）
     ============================================================ */
  let HIST = null;
  async function loadHistory() {
    if (HIST) return HIST;
    const H = {};
    const add = (k, v) => { v = String(v == null ? '' : v).trim(); if (!v || v.length > 300) return; const m = H[k] || (H[k] = new Map()); m.set(v, (m.get(v) || 0) + 1); };
    try {
      const { data } = await sbc().from('case_files').select('kind,meta').in('kind', ['safety', 'budget']).is('deleted_at', null).order('created_at', { ascending: false }).limit(500);
      (data || []).forEach((r) => {
        const a = r.meta && r.meta.answers; if (!a) return;
        if (r.kind === 'safety') {
          ['work_name', 'orderer', 'work_hours', 'content'].forEach((k) => add(k, a[k]));
          (a.companies || []).forEach((co) => { add('co_work', co.work); add('person', co.safety_person); add('person', co.chief_engineer); USES.forEach(([k]) => { const u = (co.uses || {})[k]; if (u && u.used) add('use_' + k, u.detail); }); });
        } else { ['orderer', 'site', 'work_name'].forEach((k) => add('b_' + k, a[k])); (a.lines || []).forEach((l) => add('b_item', l.item)); }
      });
    } catch (e) { /* 読めない時は候補なし */ }
    HIST = {};
    Object.keys(H).forEach((k) => { HIST[k] = [...H[k].entries()].sort((x, y) => y[1] - x[1]).map((x) => x[0]).slice(0, 40); });
    return HIST;
  }
  const histOpts = (k, extra) => [...new Set((extra || []).concat((HIST && HIST[k]) || []))].map((v) => `<option value="${esc(v)}">`).join('');
  // 定番の候補（前に入れた値の下に並べる）
  const HIST_BASE = { work_hours: ['8:00〜17:00', '9:00〜18:00', '閉館後 24:00〜翌6:00（夜間）'] };
  const histList = (k) => `<datalist id="dgH_${k}">${[...new Set(((HIST && HIST[k]) || []).concat(HIST_BASE[k] || []))].map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;

  /* ============================================================
     なれる条件（労働安全衛生法）
     ============================================================ */
  const LAW = {
    chief: '統括安全衛生責任者（労働安全衛生法 第15条）: 元請の現場で、作業員が常時50人以上（ずい道・橋梁などは30人以上）の時に選任。その現場の仕事を統括して管理する人（所長など）。資格の決まりはありません。',
    safety_manager: '元方安全衛生管理者（同 第15条の2・規則 第18条の4）: 統括安全衛生責任者を選任した現場で、その事業場に専属の人から選任。大学・高専の理科系卒＋建設工事の安全衛生の実務3年以上／高校の理科系卒＋5年以上／そのほか8年以上。',
    site_manager: '職長（同 第60条）: 作業者を直接指導・監督する人。職長教育（職長・安全衛生責任者教育）を受けていること。',
    safety_person: '安全衛生責任者（同 第16条・協力会社側）: 協力会社が現場ごとに選び、元請との連絡や作業者への指示をする人。資格の決まりはありませんが、職長・安全衛生責任者教育を受けた人が望ましい。'
  };
  // 担当者マスターの資格の印で確かめる（印の列がある時だけ）
  function qualWarn(staff, role, name) {
    const s = staff.find((x) => x.name === name); if (!s || !s.qualsOn) return '';
    if (role === 'safety_manager' && !(s.quals || {}).motokata) return `${name} さんに「元方の要件」の印がありません（担当者マスターで確かめてください）`;
    if (role === 'site_manager' && !(s.quals || {}).shokucho) return `${name} さんに「職長教育」の印がありません（担当者マスターで確かめてください）`;
    return '';
  }

  /* ============================================================
     作った書類を1枚ずつ残す（案件の書類＋書類棚の「安全書類 日付」のフォルダ）・その場で開いて直す
     ============================================================ */
  async function keepFiles(c, kind, groupName, files, answers, into) {
    const sb = sbc(); const by = (DB().userName && DB().userName()) || '';
    const gid = (into && into.gid) || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    let folderId = into ? into.folderId : null;
    if (!into && c.company && c.theater) { try { const f = await sb.from('doc_folders').insert({ company: c.company, theater: c.theater, name: groupName }).select('id').single(); if (!f.error && f.data) folderId = f.data.id; } catch (e) { /* フォルダなし */ } }
    for (let i = 0; i < files.length; i++) {
      const f = files[i]; const ext = (f.name.match(/\.(\w+)$/) || [, 'bin'])[1];
      const path = `${c.id}/${Date.now()}_${i}_${kind}.${ext}`;
      const up = await sb.storage.from('case-files').upload(path, new Blob([f.bytes], { type: f.mime }), { contentType: f.mime, upsert: false });
      if (up.error) throw up.error;
      const meta = { group: gid, group_name: groupName, folder: f.folder || '', theater: c.theater, company: c.company, fill: f.fill || null, versions: [] };
      if (i === 0) meta.answers = answers;
      const ins = await sb.from('case_files').insert({ case_id: String(c.id), kind, name: f.name, path, mime: f.mime, size: f.bytes.length, status: 'final', created_by: by, meta }).select('id').single();
      if (ins.error) throw ins.error;
      const df = await sb.from('doc_files').insert({ name: (f.folder ? f.folder + '／' : '') + f.name, company: c.company || '', theater: c.theater || '', folder_id: folderId, case_id: String(c.id), updated_by_name: by,
        data: { kind: kind + '_doc', bucket: 'case-files', path, mime: f.mime, size: f.bytes.length, file_name: f.name, case_file_id: ins.data.id, group: gid } }).select('id').single();
      if (!df.error && df.data) await sb.from('case_files').update({ meta: Object.assign({}, meta, { doc_file_id: df.data.id }) }).eq('id', ins.data.id);
      f.kept = { cf: ins.data.id };
    }
    HIST = null;
    try { if (DB().afterWorkapp) DB().afterWorkapp(c.id); } catch (e) { /* なし */ }
    return { gid, folderId };
  }
  // 新しい版として保存（前の版は meta.versions に残す・10 個まで）
  async function saveVersion(cfId, bytes, note) {
    const sb = sbc(); const by = (DB().userName && DB().userName()) || '';
    const { data: row, error } = await sb.from('case_files').select('*').eq('id', cfId).maybeSingle();
    if (error || !row) throw new Error('書類が見つかりません');
    const ext = (row.name.match(/\.(\w+)$/) || [, 'bin'])[1];
    const path = `${row.case_id}/${Date.now()}_${row.kind}_v.${ext}`;
    const up = await sb.storage.from('case-files').upload(path, new Blob([bytes], { type: row.mime }), { contentType: row.mime, upsert: false });
    if (up.error) throw up.error;
    const meta = Object.assign({}, row.meta || {});
    meta.versions = [{ path: row.path, at: new Date().toISOString(), by, note: note || '' }].concat(meta.versions || []).slice(0, 10);
    const u = await sb.from('case_files').update({ path, size: bytes.length, meta }).eq('id', cfId);
    if (u.error) throw u.error;
    if (meta.doc_file_id) {
      const d = await sb.from('doc_files').select('data').eq('id', meta.doc_file_id).maybeSingle();
      if (d.data) await sb.from('doc_files').update({ data: Object.assign({}, d.data.data || {}, { path, size: bytes.length }), updated_by_name: by }).eq('id', meta.doc_file_id);
    }
    return Object.assign({}, row, { path, meta });
  }
  async function caseFileBytes(path) {
    const { data, error } = await sbc().storage.from('case-files').download(path);
    if (error) throw new Error('書類を読めませんでした（' + error.message + '）');
    return new Uint8Array(await data.arrayBuffer());
  }
  // 1枚の書類をその場で開く（Excel は表で見て、セルを押して直す。PDF などは開くだけ）
  async function openDoc(cfId) {
    const sb = sbc(); if (!sb) return;
    let { data: row } = await sb.from('case_files').select('*').eq('id', cfId).maybeSingle();
    if (!row) { K().say('書類が見つかりません'); return; }
    if (!/\.xlsx$/i.test(row.name)) {
      const r = await sb.storage.from('case-files').createSignedUrl(row.path, 600);
      if (r.error) { K().say('開けませんでした: ' + r.error.message); return; }
      window.open(r.data.signedUrl, '_blank', 'noopener'); return;
    }
    const x = XL();
    let book = await x.open(await caseFileBytes(row.path));
    let changes = new Map(), hits = new Set();
    const d = dialog('dgDoc', '📄 ' + esc((row.meta && row.meta.folder ? row.meta.folder + ' ／ ' : '') + row.name), true);
    const vis = () => book.sheets.filter((sh) => !sh.hidden);
    const draw = (msg) => {
      d.body.innerHTML = `<p class="ms-note">セルを押すと直せます（灰色は式のセル）。直したら「💾 保存」。前の版は残ります。${msg ? '<br><b>' + esc(msg) + '</b>' : ''}</p>` + x.previewHtml(book, hits);
      const tables = d.body.querySelectorAll('table.wa-xl');
      tables.forEach((t, i) => {
        const sh = vis()[i]; if (!sh) return;
        const fset = new Set(x.cells(book, sh).filter((cc) => cc.f).map((cc) => String(cc.ref).toUpperCase()));
        t.querySelectorAll('td[title]').forEach((td) => {
          if (fset.has(td.title)) { td.classList.add('dg-f'); return; }
          td.contentEditable = 'true'; td.dataset.si = i; td.spellcheck = false;
          if (changes.has(i + '!' + td.title)) td.classList.add('dg-chg');
        });
      });
      const nv = ((row.meta && row.meta.versions) || []).length;
      d.foot.innerHTML = `<span class="ms-note dg-chgn">${changes.size ? `直した所 ${changes.size}` : ''}</span>
        ${row.meta && row.meta.fill ? '<button type="button" data-daifix>✏️ AI に直してもらう</button>' : ''}
        ${nv ? `<button type="button" data-drevert>↩ 前の版に戻す（${nv}）</button>` : ''}
        <button type="button" data-ddl>⬇ ダウンロード</button><button type="button" data-dgx>閉じる</button><button type="button" class="primary" data-dsave>💾 保存</button>`;
    };
    draw();
    d.body.addEventListener('input', (e) => {
      const td = e.target.closest('td[contenteditable]'); if (!td) return;
      changes.set(td.dataset.si + '!' + td.title, td.innerText.replace(/\n+$/, '')); td.classList.add('dg-chg');
      const n = d.foot.querySelector('.dg-chgn'); if (n) n.textContent = `直した所 ${changes.size}`;
    });
    const applyChanges = () => { changes.forEach((v, k) => { const [i, ref] = k.split('!'); const sh = vis()[+i]; if (sh) { x.setCell(sh, ref, v); hits.add(sh.path + '!' + x.topLeft(sh, ref)); } }); changes = new Map(); };
    const save = async (note) => {
      applyChanges();
      const bytes = await x.save(book);
      row = await saveVersion(row.id, bytes, note || '手で直した');
      book = await x.open(bytes); draw('保存しました');
      toast('保存しました（前の版も残っています）');
    };
    d.ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-dgx]') || e.target === d.ov) {
        if (changes.size && !(await K().ask('保存していない直しがあります。保存せずに閉じますか？', { ok: '保存せずに閉じる', cancel: '戻る' }))) return;
        d.ov.remove(); return;
      }
      if (e.target.closest('[data-dsave]')) { try { await save(); } catch (err) { K().say('保存できませんでした: ' + (err.message || err)); } return; }
      if (e.target.closest('[data-ddl]')) { applyChanges(); download(row.name, await x.save(book), row.mime || 'application/octet-stream'); book = await x.open(await x.save(book)); draw(); return; }
      if (e.target.closest('[data-drevert]')) {
        const v = row.meta.versions[0];
        if (!(await K().ask(`${String(v.at).slice(0, 16).replace('T', ' ')} の版（${v.by || ''}${v.note ? '・' + v.note : ''}）に戻しますか？（今の版も残ります）`, { ok: '戻す', cancel: 'やめる' }))) return;
        const bytes = await caseFileBytes(v.path); row = await saveVersion(row.id, bytes, '前の版に戻した'); book = await x.open(bytes); changes = new Map(); hits = new Set(); draw('前の版に戻しました'); return;
      }
      if (e.target.closest('[data-daifix]')) {
        const ins = await askText('どう直しますか？', '例: 工期の年を2027にする・作業員の欄は空ける'); if (!ins) return;
        applyChanges(); draw('🤖 AI が直しています…（1分ほど）');
        try {
          const res = await api('fill', { template: { name: row.name, kind: row.meta.fill.kind, sheets: describe(book) }, data: row.meta.fill.data, instruction: ins });
          x.apply(book, res.entries); res.entries.forEach((en) => { const sh = book.sheets.find((s2) => s2.name.trim() === String(en.sheet || '').trim()) || book.sheets[0]; if (sh) hits.add(sh.path + '!' + x.topLeft(sh, en.cell)); });
          await save('AI が直した（' + ins.slice(0, 40) + '）');
        } catch (err) { draw('直せませんでした: ' + (err.message || err)); }
      }
    });
  }
  // 1回分（同じ時に作った書類）をまとめて ZIP
  async function zipGroup(caseId, gid) {
    const sb = sbc();
    const { data } = await sb.from('case_files').select('*').eq('case_id', String(caseId)).is('deleted_at', null);
    const rows = (data || []).filter((r) => r.meta && r.meta.group === gid);
    if (!rows.length) { K().say('書類が見つかりません'); return; }
    const zip = new window.JSZip();
    for (const r of rows) zip.file((r.meta.folder ? r.meta.folder + '/' : '') + r.name, await caseFileBytes(r.path));
    const head = rows.find((r) => r.meta.answers) || rows[0];
    download(`【${clean(String(head.meta.theater || '').replace(/^\S+\s/, ''))}】${clean(head.meta.group_name || '安全書類')}_菱熱工業.zip`, await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }), 'application/zip');
  }

  /* ============================================================
     現場案内（送り出し資料）の地図: OpenStreetMap。ひな形の地図の画像を、場所と大きさはそのままで入れ替える
     ============================================================ */
  const MAP_RE = /現場案内|送り出し/;
  async function geocode(addr) {
    const q = String(addr || '').trim(); if (!q) throw new Error('住所がありません');
    try {   // 国土地理院の住所検索（日本の住所に強い）
      const r = await fetch('https://msearch.gsi.go.jp/address-search/AddressSearch?q=' + encodeURIComponent(q));
      const j = await r.json(); if (Array.isArray(j) && j[0] && j[0].geometry) { const [lon, lat] = j[0].geometry.coordinates; return { lat: +lat, lon: +lon }; }
    } catch (e) { /* 次へ */ }
    const r2 = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q));
    const j2 = await r2.json(); if (Array.isArray(j2) && j2[0]) return { lat: +j2[0].lat, lon: +j2[0].lon };
    throw new Error('住所から場所が見つかりませんでした');
  }
  function loadImg(url) { return new Promise((resolve, reject) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => resolve(im); im.onerror = () => reject(new Error('地図の画像を読めませんでした')); im.src = url; }); }
  async function renderMap(pt, zoom, W, H) {
    const n = 256 * Math.pow(2, zoom);
    const cx = (pt.lon + 180) / 360 * n;
    const lr = pt.lat * Math.PI / 180;
    const cy = (1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n;
    const x0 = cx - W / 2, y0 = cy - H / 2;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, W, H);
    const jobs = [];
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++) {
      for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++) {
        const m = Math.pow(2, zoom); const wx = ((tx % m) + m) % m;
        jobs.push(loadImg(`https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png`).then((im) => g.drawImage(im, tx * 256 - x0, ty * 256 - y0)).catch(() => {}));
      }
    }
    await Promise.all(jobs);
    // 現場の印（赤いピン）
    const px = W / 2, py = H / 2, r = Math.max(10, Math.round(W / 60));
    g.fillStyle = '#e11d48'; g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, r / 4);
    g.beginPath(); g.arc(px, py - r * 1.6, r, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(px, py); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py - r * 1.6, r * 0.4, 0, Math.PI * 2); g.fill();
    // 出典（OpenStreetMap の決まり）
    const fs = Math.max(11, Math.round(W / 80)); g.font = `${fs}px sans-serif`;
    const t = '© OpenStreetMap contributors'; const tw = g.measureText(t).width;
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(W - tw - 12, H - fs - 10, tw + 12, fs + 10); g.fillStyle = '#333'; g.fillText(t, W - tw - 6, H - 8);
    return cv;
  }
  // xlsx の中の地図の画像（いちばん大きい絵）を入れ替える
  async function replaceMapImage(bytes, pt, zoom, manualBlob) {
    const zip = await window.JSZip.loadAsync(bytes);
    const draws = Object.keys(zip.files).filter((n) => /^xl\/drawings\/drawing\d+\.xml$/.test(n));
    let best = null;
    for (const dn of draws) {
      const xml = await zip.file(dn).async('string');
      const relF = zip.file(dn.replace('drawings/', 'drawings/_rels/') + '.rels'); if (!relF) continue;
      const rels = await relF.async('string');
      for (const m of xml.matchAll(/<xdr:pic\b[\s\S]*?<\/xdr:pic>/g)) {
        const pic = m[0]; const rid = (pic.match(/r:embed="([^"]+)"/) || [])[1]; if (!rid) continue;
        const ext = pic.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/) || [];
        const before = xml.slice(Math.max(0, m.index - 400), m.index); const ext2 = before.match(/<xdr:ext\s+cx="(\d+)"\s+cy="(\d+)"[^>]*\/>\s*$/) || [];
        const cxv = +(ext[1] || ext2[1] || 0), cyv = +(ext[2] || ext2[2] || 0);
        const tgt = ((rels.match(new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*>')) || [''])[0].match(/Target="([^"]+)"/) || [])[1]; if (!tgt) continue;
        const media = 'xl/' + tgt.replace(/^\.\.\//, '').replace(/^\/?xl\//, '');
        if (!zip.file(media)) continue;
        const area = cxv * cyv || (await zip.file(media).async('uint8array')).length;
        if (!best || area > best.area) best = { media, cx: cxv, cy: cyv, area };
      }
    }
    if (!best) throw new Error('ひな形に地図の画像が見つかりません');
    const W = 1400, H = Math.round(W * ((best.cy && best.cx) ? best.cy / best.cx : 0.75));
    const isPng = /\.png$/i.test(best.media);
    let out;
    if (manualBlob) {
      const url = URL.createObjectURL(manualBlob); const im = await loadImg(url); URL.revokeObjectURL(url);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      out = cv;
    } else out = await renderMap(pt, zoom, W, H);
    const blob = await new Promise((res) => out.toBlob(res, isPng ? 'image/png' : 'image/jpeg', 0.9));
    zip.file(best.media, new Uint8Array(await blob.arrayBuffer()));
    return new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
  }

  /* ============================================================
     👷 作業員マスター（協力会社ごと）
     ============================================================ */
  const WF = [
    ['name', '氏名'], ['kana', 'ふりがな'], ['job', '職種'], ['role_marks', '※記号（現・主・職・安・技・女・未・基）'], ['birth', '生年月日', 'date'], ['blood', '血液型', 'blood'],
    ['hire_date', '雇入年月日', 'date'], ['exp_years', '経験年数'], ['address', '現住所'], ['tel', '電話'], ['family_contact', '家族連絡先'], ['family_tel', '家族の電話'],
    ['health_date', '最近の健康診断日', 'date'], ['bp_high', '血圧（上）'], ['bp_low', '血圧（下）'], ['special_health_date', '特殊健康診断日', 'date'],
    ['education', '雇入・職長・特別教育'], ['skill', '技能講習'], ['license', '免許'], ['health_ins', '健康保険（名称・番号下4桁）'], ['pension_ins', '年金保険'], ['employment_ins', '雇用保険（番号下4桁）']
  ];
  async function partnersList() { const W = window.WORKAPP; if (!W) return []; await W.loadPartners(); return (W.partners().list || []); }
  async function openWorkers(partnerId, onDone) {
    const list = await partnersList(); const p = list.find((x) => String(x.id) === String(partnerId));
    if (!p) { K().say('協力会社が見つかりません'); return; }
    let workers = (p.workers || []).map((w) => Object.assign({}, w));
    const d = dialog('dgWorkers', `👷 作業員 — ${esc(p.name)}`, true);
    const draw = (msg) => {
      d.body.innerHTML = `<p class="ms-note">安全書類（作業員名簿・新規入場者教育など）に使います。個人情報なので菱熱の人だけが見られます。業者からもらった作業員名簿（Excel・PDF・写真）を入れると、AI が読んで足します（同じ名前の人は空いた欄だけ埋めます）。${msg ? '<br><b>' + esc(msg) + '</b>' : ''}</p>
        <div class="dg-tools"><button type="button" data-wadd>＋ 作業員を足す</button><label class="kt-upload">📄 名簿を読み込む（Excel・PDF・写真）<input type="file" id="dgRoster" accept=".xlsx,.pdf,image/*" hidden></label><span class="ms-note">${workers.length} 人</span></div>
        <div class="dg-workers">${workers.map((w, i) => `<details class="dg-worker"${!w.name ? ' open' : ''}><summary><b>${esc(w.name || '（名前なし）')}</b> <span class="ms-note">${esc([w.job, w.birth ? '生 ' + w.birth : '', w.blood ? w.blood + '型' : ''].filter(Boolean).join('・'))}</span>
          <button type="button" class="mini-btn danger" data-wdel="${i}" title="消す">🗑</button></summary>
          <div class="dg-wgrid">${WF.map(([k, l, t]) => `<label><span>${l}</span>${t === 'blood' ? `<select data-wi="${i}" data-wk="${k}"><option value=""></option>${['A', 'B', 'O', 'AB'].map((b) => `<option${w[k] === b ? ' selected' : ''}>${b}</option>`).join('')}</select>`
            : `<input ${t === 'date' ? 'type="date"' : 'type="text"'} class="tm-input" data-wi="${i}" data-wk="${k}" value="${esc(w[k] || (k === 'tel' ? w.phone || '' : ''))}">`}</label>`).join('')}</div></details>`).join('') || '<p class="sub">まだいません</p>'}</div>`;
      d.foot.innerHTML = '<span class="ms-note">「保存」を押すと残ります</span><button type="button" data-dgx>閉じる</button><button type="button" class="primary" data-wsave>保存</button>';
    };
    const collect = () => { d.body.querySelectorAll('[data-wi]').forEach((el) => { const w = workers[+el.dataset.wi]; if (w) w[el.dataset.wk] = el.value.trim(); }); workers.forEach((w) => { if (w.tel && !w.phone) w.phone = w.tel; }); };
    const save = async () => {
      collect(); workers = workers.filter((w) => String(w.name || '').trim());
      const r = await sbc().from('partners').update({ workers, updated_at: new Date().toISOString() }).eq('id', p.id);
      if (r.error) { K().say('保存できませんでした: ' + r.error.message); return false; }
      p.workers = workers; toast(`${p.name} の作業員を保存しました（${workers.length} 人）`); if (onDone) onDone(p); return true;
    };
    draw();
    d.ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-dgx]') || e.target === d.ov) { collect(); if (JSON.stringify(workers) !== JSON.stringify(p.workers || []) && !(await K().ask('保存していない変更があります。保存せずに閉じますか？', { ok: '保存せずに閉じる', cancel: '戻る' }))) return; d.ov.remove(); return; }
      if (e.target.closest('[data-wadd]')) { collect(); workers.push({ name: '' }); draw(); return; }
      const del = e.target.closest('[data-wdel]'); if (del) { e.preventDefault(); collect(); const w = workers[+del.dataset.wdel]; if (await K().ask(`${w.name || 'この人'} を消しますか？`, { ok: '消す', danger: true })) { workers.splice(+del.dataset.wdel, 1); draw(); } return; }
      if (e.target.closest('[data-wsave]')) { if (await save()) d.ov.remove(); }
    });
    d.ov.addEventListener('change', async (e) => {
      if (e.target.id !== 'dgRoster' || !e.target.files[0]) return;
      const f = e.target.files[0]; e.target.value = ''; collect();
      draw('AI が名簿を読んでいます…（1分ほど）');
      try {
        const body = {};
        const buf = new Uint8Array(await f.arrayBuffer());
        if (/\.xlsx$/i.test(f.name)) body.sheets = describe(await XL().open(buf));
        else if (/\.pdf$/i.test(f.name) || /pdf/.test(f.type)) body.images = (await window.WORKAPP._pdf.describe(buf, { maxPages: 6, maxPx: 1600, texts: false })).map((pg) => pg.image);
        else body.images = [await imageB64(f)];
        const r = await api('roster', body);
        let added = 0, merged = 0;
        r.workers.forEach((nw) => {
          const key = (s) => String(s || '').replace(/[\s　]/g, '');
          const ex = workers.find((w) => key(w.name) === key(nw.name));
          if (ex) { Object.keys(nw).forEach((k) => { if (nw[k] && !ex[k]) ex[k] = nw[k]; }); merged++; } else { workers.push(nw); added++; }
        });
        draw(`名簿から ${added} 人を足し、${merged} 人の空いた欄を埋めました。内容を確かめて「保存」を押してください。`);
      } catch (err) { draw('読めませんでした: ' + (err.message || err)); }
    });
  }
  function imageB64(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => { const s = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight)); const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '')); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読めませんでした')); };
      img.src = url;
    });
  }

  /* ============================================================
     🦺 安全書類
     ============================================================ */
  const EMERGENCY = [['police', '警察署'], ['fire', '消防署'], ['labor', '労働基準監督署'], ['hospital', '救急病院'], ['power', '電力'], ['gas', 'ガス'], ['water', '水道'], ['center', '劇場の防災センター'], ['guard', '劇場の警備室']];
  const USES = [['fire', '🔥 火気（溶接・溶断・ガスなど）', '使用場所・目的・火気の種類・期間・時間・火元責任者・火気使用責任者'], ['vehicle', '🚚 車両（現場に乗り入れる車）', '車種・ナンバー・運転者・期間'], ['machine', '🏗 持込機械（電動工具・脚立・高所作業車など）', '機械の名前・台数・点検者']];
  async function openSafety(caseId) {
    if (!sbc()) { K().say('ログインして使ってください'); return; }
    let c; try { c = caseOf(caseId); } catch (e) { K().say(e.message); return; }
    let tpls = [];
    try { tpls = await loadTemplates('safety_tpl'); } catch (e) { K().say(e.message); return; }
    const use = tpls.map((r) => Object.assign({ r }, classify(r)));
    const ry = use.filter((x) => x.role === 'ryonetsu'), ve = use.filter((x) => x.role === 'vendor'), sk = use.filter((x) => x.role === 'skip'), as = use.filter((x) => x.role === 'asis');
    if (!ry.length && !ve.length) {
      K().say(tpls.length
        ? `書類棚の「🦺 安全書類のひな形」に ${tpls.length} 件ありますが、使えるひな形（.xlsx）がありません。\n\n` + sk.map((x) => `・${x.r.data.file_name || x.r.name}（${x.why}）`).join('\n') + '\n\n.xlsx で保存し直したものを入れてください（古い .xls は 🗑 で外してください）。'
        : '書類棚の「🦺 安全書類のひな形」に、ひな形（.xlsx）がありません。先にひな形を入れてください。');
      return;
    }
    const partners = (await partnersList()).filter((p) => p.active !== false && p.kind !== 'trader');
    const staff = (DB().staff ? DB().staff() : []).filter((s) => s.active);
    await loadHistory();
    const mapTpl = use.find((x) => (x.role === 'ryonetsu' || x.role === 'vendor') && MAP_RE.test(x.r.data.file_name || x.r.name));
    const prev = await lastMeta('safety', c);
    const pa = (prev && prev.answers) || {};
    let saved = {};
    try { const { data } = await sbc().from('theater_safety').select('data').eq('theater', c.theater).maybeSingle(); saved = (data && data.data) || {}; } catch (e) { saved = {}; }
    const rp = String(c.rPerson || '').split(/[、・,\/]/)[0].trim();
    const A = {
      work_name: (pa.case_id === c.id && pa.work_name) || `${c.theaterShort || c.theater}　${c.title || '空調工事'}`.trim(),
      orderer: (pa.company === c.company && pa.orderer) || c.company || '',
      site: c.theater || '', site_address: c.theaterAddress || '',
      period_from: c.workStartDate || '', period_to: c.workEndDate || c.workStartDate || '',
      work_hours: pa.work_hours || '', content: String(c.title || '') + (c.content ? '：' + String(c.content).split('\n')[0].slice(0, 60) : ''),
      chief: rp, general_safety: rp, site_manager: rp, safety_manager: rp,
      companies: (pa.case_id === c.id && Array.isArray(pa.companies) ? pa.companies : []).map((x) => Object.assign({}, x)),
      emergency: Object.assign({}, saved),
      map: { zoom: (pa.map && pa.map.zoom) || 16, pt: null, msg: '' }
    };
    let mapManual = null;   // 手で入れた地図の画像（残さない）
    const d = dialog('dgSafety', `🦺 安全書類を作る — ${esc(c.theaterShort || c.theater)}　${esc(c.title || '')}`, true);
    const staffOpts = (sel) => `<option value="">（選ぶ）</option>` + staff.map((s) => `<option${s.name === sel ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
    const pOpts = (id) => `<option value="">（協力会社を選ぶ）</option>` + partners.map((p) => `<option value="${esc(p.id)}"${String(p.id) === String(id) ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
    const draw = () => {
      d.body.innerHTML = `
        <p class="ms-note">書類棚のひな形から、<b>菱熱分 ${ry.length} 枚</b>（${ry.map((x) => esc(tplLabel(x.r))).join('・')}）と、<b>入る会社ごとに業者分 ${ve.length} 枚</b>（${ve.map((x) => esc(tplLabel(x.r))).join('・')}）を作ります。${as.length ? `<br>そのまま入れるもの（書き込まない）: ${as.map((x) => esc(x.r.data.file_name || x.r.name) + (x.vendor ? '（会社ごと）' : '')).join('・')}` : ''}${sk.length ? `<br>使わないひな形: ${sk.map((x) => esc(tplLabel(x.r)) + '（' + esc(x.why) + '）').join('・')}` : ''}<br>
        分からない欄は空けて作ります（あとで Excel で直せます）。会社の住所・許可番号・保険などは、協力会社が書く欄として空けます。</p>
        <h3 class="mst-h">🏗 工事</h3>
        <div class="dg-grid">
          <label><span>工事名</span><input class="tm-input" data-a="work_name" list="dgH_work_name" value="${esc(A.work_name)}"></label>
          <label><span>発注者（正式な会社名）</span><input class="tm-input" data-a="orderer" list="dgH_orderer" value="${esc(A.orderer)}" placeholder="例: TOHOシネマズ株式会社"></label>
          <label><span>現場（劇場）</span><input class="tm-input" data-a="site" value="${esc(A.site)}"></label>
          <label><span>現場の住所</span><input class="tm-input" data-a="site_address" value="${esc(A.site_address)}"></label>
          <label><span>工期（自）</span><input type="date" class="tm-input" data-a="period_from" value="${esc(A.period_from)}"></label>
          <label><span>工期（至）</span><input type="date" class="tm-input" data-a="period_to" value="${esc(A.period_to)}"></label>
          <label><span>作業時間</span><input class="tm-input" data-a="work_hours" list="dgH_work_hours" value="${esc(A.work_hours)}" placeholder="例: 8:00〜17:00"></label>
          <label class="dg-wide2"><span>工事の内容（短く）</span><input class="tm-input" data-a="content" list="dgH_content" value="${esc(A.content)}"></label>
        </div>
        ${histList('work_name')}${histList('orderer')}${histList('work_hours')}${histList('content')}${histList('co_work')}
        <h3 class="mst-h">👷 菱熱の責任者（携帯は担当者マスターから）</h3>
        <div class="dg-grid dg-roles">
          <label><span>所長・統括安全衛生責任者</span><select data-a="chief">${staffOpts(A.chief)}</select><small class="dg-law">${esc(LAW.chief)}</small></label>
          <label><span>元方安全衛生管理者</span><select data-a="safety_manager">${staffOpts(A.safety_manager)}</select><small class="dg-law">${esc(LAW.safety_manager)}</small>${qualWarn(staff, 'safety_manager', A.safety_manager) ? `<small class="dg-qwarn">⚠ ${esc(qualWarn(staff, 'safety_manager', A.safety_manager))}</small>` : ''}</label>
          <label><span>作業責任者・職長</span><select data-a="site_manager">${staffOpts(A.site_manager)}</select><small class="dg-law">${esc(LAW.site_manager)}</small>${qualWarn(staff, 'site_manager', A.site_manager) ? `<small class="dg-qwarn">⚠ ${esc(qualWarn(staff, 'site_manager', A.site_manager))}</small>` : ''}</label>
        </div>
        <h3 class="mst-h">🤝 入る会社（一次・二次）</h3>
        <div class="dg-companies">${A.companies.map((co, i) => companyHtml(co, i)).join('') || '<p class="sub">まだありません。「＋ 会社を足す」で選んでください。</p>'}</div>
        <button type="button" data-cadd>＋ 会社を足す</button>
        <h3 class="mst-h">🚑 緊急連絡先（${esc(c.theaterShort || c.theater)}）</h3>
        <p class="ms-note">${saved.checked_at ? `前に確かめた連絡先です（${esc(String(saved.checked_at).slice(0, 10))}）。` : 'まだ残っていません。「🤖 AI で調べる」で、劇場の住所から管轄の警察署・消防署などを調べます（必ず確かめてください）。'}直すと劇場ごとに残ります。</p>
        <div class="dg-emg">${EMERGENCY.map(([k, l]) => { const v = A.emergency[k] || {}; return `<label><span>${l}</span><input class="tm-input" data-e="${k}" data-ef="name" value="${esc(v.name || '')}" placeholder="名前"><input class="tm-input dg-tel" data-e="${k}" data-ef="tel" value="${esc(v.tel || '')}" placeholder="電話"></label>`; }).join('')}</div>
        <button type="button" data-emg>🤖 AI で調べる</button><span class="ms-note dg-emg-msg"></span>
        ${mapTpl ? `<h3 class="mst-h">🗺 現場案内の地図（OpenStreetMap）</h3>
        <p class="ms-note">「${esc(tplLabel(mapTpl.r))}」の地図の画像を、現場の住所の地図に入れ替えます（場所・大きさはそのまま）。${esc(A.map.msg || '')}</p>
        <div class="dg-map"><div class="dg-map-view">${mapManual ? '<span class="ms-note">手で入れた画像を使います</span>' : A.map.pt ? '<canvas class="dg-map-cv"></canvas>' : '<span class="ms-note">住所から場所を探しています…</span>'}</div>
          <div class="dg-map-tools"><button type="button" data-mapz="1">＋ 近づける</button><button type="button" data-mapz="-1">－ 広く</button><button type="button" data-mapfind>📍 住所から探し直す</button>
          <label class="kt-upload">🖼 画像を自分で入れる<input type="file" id="dgMapImg" accept="image/*" hidden></label>${mapManual ? '<button type="button" data-mapclr>手で入れた画像をやめる</button>' : ''}</div></div>` : ''}`;
      if (mapTpl && A.map.pt && !mapManual) { const cv0 = d.body.querySelector('.dg-map-cv'); renderMap(A.map.pt, A.map.zoom, 640, 400).then((cv) => { cv0.width = cv.width; cv0.height = cv.height; cv0.getContext('2d').drawImage(cv, 0, 0); }).catch(() => {}); }
      d.foot.innerHTML = '<span class="ms-note">「作る」を押すと、AI がひな形に書き込みます（数分かかります）</span><button type="button" data-dgx>やめる</button><button type="button" class="primary" data-make>🦺 作る</button>';
    };
    const companyHtml = (co, i) => {
      const p = partners.find((x) => String(x.id) === String(co.partner_id));
      const ws = (p && p.workers) || [];
      const parents = A.companies.filter((x, j) => j !== i && Number(x.tier) === 1);
      return `<div class="dg-co" data-ci="${i}">
        <div class="dg-grid">
          <label><span>会社</span><select data-c="partner_id">${pOpts(co.partner_id)}</select></label>
          <label><span>次数</span><select data-c="tier"><option value="1"${Number(co.tier) !== 2 ? ' selected' : ''}>一次</option><option value="2"${Number(co.tier) === 2 ? ' selected' : ''}>二次</option></select></label>
          ${Number(co.tier) === 2 ? `<label><span>上の会社（一次）</span><select data-c="parent"><option value="">（選ぶ）</option>${parents.map((x) => `<option${x.name === co.parent ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : ''}
          <label class="dg-wide2"><span>担当工事内容</span><input class="tm-input" data-c="work" list="dgH_co_work" value="${esc(co.work || '')}" placeholder="例: 空調・冷媒配管工事"></label>
          <label><span>工期（自）</span><input type="date" class="tm-input" data-c="period_from" value="${esc(co.period_from || A.period_from)}"></label>
          <label><span>工期（至）</span><input type="date" class="tm-input" data-c="period_to" value="${esc(co.period_to || A.period_to)}"></label>
          <label><span>安全衛生責任者</span><input class="tm-input" list="dgW${i}" data-c="safety_person" value="${esc(co.safety_person || '')}"><small class="dg-law">${esc(LAW.safety_person)}</small></label>
          <label><span>主任技術者</span><input class="tm-input" list="dgW${i}" data-c="chief_engineer" value="${esc(co.chief_engineer || '')}"></label>
          <datalist id="dgW${i}">${histOpts('person', ws.map((w) => w.name))}</datalist>
        </div>
        <div class="dg-wsel"><span class="ms-note">入る作業員:</span> ${ws.map((w) => `<label class="wa-chip"><input type="checkbox" data-cw="${esc(w.name)}"${(co.workers || []).indexOf(w.name) !== -1 ? ' checked' : ''}> ${esc(w.name)}</label>`).join('') || '<span class="sub">作業員がまだいません</span>'}
          ${p ? `<button type="button" class="mini-btn" data-cwork="${esc(p.id)}">👷 作業員を入れる・直す</button>` : ''}</div>
        <div class="dg-uses">${USES.map(([k, l, ph]) => { const u = (co.uses || {})[k] || {}; const hs = (HIST && HIST['use_' + k]) || [];
          return `<div class="dg-use"><label><input type="checkbox" data-cu="${k}"${u.used ? ' checked' : ''}> ${l}</label>${u.used ? `${hs.length ? `<select class="dg-hpick" data-hpick="${k}"><option value="">前に入れた内容から選ぶ（${hs.length}）</option>${hs.map((v) => `<option value="${esc(v)}">${esc(v.slice(0, 60))}</option>`).join('')}</select>` : ''}<textarea class="tm-input" rows="2" data-cud="${k}" placeholder="${esc(ph)}">${esc(u.detail || '')}</textarea>` : '<span class="ms-note">使わない →「該当なし」と書きます</span>'}</div>`; }).join('')}</div>
        <button type="button" class="mini-btn danger dg-codel" data-cdel="${i}">この会社を外す</button></div>`;
    };
    const collect = () => {
      d.body.querySelectorAll('[data-a]').forEach((el) => { A[el.dataset.a] = el.value.trim(); });
      d.body.querySelectorAll('[data-e]').forEach((el) => { const k = el.dataset.e; A.emergency[k] = Object.assign({}, A.emergency[k] || {}, { [el.dataset.ef]: el.value.trim() }); });
      d.body.querySelectorAll('.dg-co').forEach((box) => {
        const co = A.companies[+box.dataset.ci]; if (!co) return;
        box.querySelectorAll('[data-c]').forEach((el) => { co[el.dataset.c] = el.value.trim(); });
        co.tier = Number(co.tier) === 2 ? 2 : 1;
        const p = partners.find((x) => String(x.id) === String(co.partner_id)); co.name = p ? p.name : '';
        co.workers = [...box.querySelectorAll('[data-cw]')].filter((x) => x.checked).map((x) => x.dataset.cw);
        co.uses = co.uses || {};
        USES.forEach(([k]) => { const cb = box.querySelector(`[data-cu="${k}"]`); const ta = box.querySelector(`[data-cud="${k}"]`); co.uses[k] = { used: !!(cb && cb.checked), detail: ta ? ta.value.trim() : ((co.uses[k] || {}).detail || '') }; });
      });
    };
    draw();
    d.ov.addEventListener('change', async (e) => {
      const hp = e.target.closest('[data-hpick]');
      if (hp) { const ta = hp.parentNode.querySelector(`[data-cud="${hp.dataset.hpick}"]`); if (ta && hp.value) ta.value = hp.value; hp.value = ''; return; }
      if (e.target.id === 'dgMapImg' && e.target.files[0]) { collect(); mapManual = e.target.files[0]; e.target.value = ''; draw(); return; }
      if (e.target.closest('[data-c="partner_id"],[data-c="tier"],[data-cu],[data-a="safety_manager"],[data-a="site_manager"]')) { collect(); draw(); }
    });
    const findMap = async () => {
      if (!mapTpl) return;
      try { A.map.pt = await geocode(A.site_address || A.site); A.map.msg = ''; } catch (err) { A.map.pt = null; A.map.msg = '⚠ ' + (err.message || err) + '（住所を直して「📍 住所から探し直す」か、画像を自分で入れてください）'; }
      collect(); draw();
    };
    findMap();
    d.ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-dgx]') || e.target === d.ov) { if (await K().ask('安全書類を作るのをやめますか？（入れた内容は残りません）', { ok: 'やめて閉じる', cancel: '続ける' })) d.ov.remove(); return; }
      if (e.target.closest('[data-cadd]')) { collect(); A.companies.push({ tier: 1, period_from: A.period_from, period_to: A.period_to, workers: [], uses: {} }); draw(); return; }
      const del = e.target.closest('[data-cdel]'); if (del) { collect(); A.companies.splice(+del.dataset.cdel, 1); draw(); return; }
      const mz = e.target.closest('[data-mapz]'); if (mz) { collect(); A.map.zoom = Math.max(12, Math.min(18, A.map.zoom + Number(mz.dataset.mapz))); draw(); return; }
      if (e.target.closest('[data-mapfind]')) { collect(); A.map.pt = null; draw(); await findMap(); return; }
      if (e.target.closest('[data-mapclr]')) { collect(); mapManual = null; draw(); return; }
      const cw = e.target.closest('[data-cwork]'); if (cw) { collect(); openWorkers(cw.dataset.cwork, (p) => { const ix = partners.findIndex((x) => String(x.id) === String(p.id)); if (ix >= 0) partners[ix] = p; draw(); }); return; }
      if (e.target.closest('[data-emg]')) {
        collect(); const msg = d.body.querySelector('.dg-emg-msg'); msg.textContent = '🤖 調べています…（1分ほど）';
        try {
          const r = await api('emergency', { theater: A.site, address: A.site_address });
          Object.keys(r.items || {}).forEach((k) => { const v = r.items[k] || {}; if (v.name || v.tel) A.emergency[k] = Object.assign({}, A.emergency[k] || {}, { name: v.name, tel: v.tel }); });
          A.emergency.by_ai = true; draw();
          d.body.querySelector('.dg-emg-msg').textContent = '調べました。必ず確かめて、違う所は直してください。' + (r.notes ? '（' + r.notes + '）' : '');
        } catch (err) { msg.textContent = '調べられませんでした: ' + (err.message || err); }
        return;
      }
      if (e.target.closest('[data-make]')) { collect(); await make(); }
    });

    // 足りない情報を聞いてから作る
    async function make() {
      const miss = [];
      if (!A.work_name) miss.push('工事名');
      if (!A.period_from || !A.period_to) miss.push('工期');
      if (!A.chief) miss.push('菱熱の所長・統括安全衛生責任者');
      if (!A.companies.length) miss.push('入る会社（業者分の書類が作れません）');
      A.companies.forEach((co) => {
        const n = co.name || '（会社を選んでいない行）';
        if (!co.name) miss.push(n);
        if (!co.work) miss.push(`${n} の担当工事内容`);
        if (!co.safety_person) miss.push(`${n} の安全衛生責任者`);
        if (!co.workers.length) miss.push(`${n} の作業員（作業員名簿が空になります）`);
        if (co.tier === 2 && !co.parent) miss.push(`${n} の上の会社（一次）`);
        USES.forEach(([k, l]) => { if (co.uses[k] && co.uses[k].used && !co.uses[k].detail) miss.push(`${n} の${l.replace(/^\S+\s/, '').replace(/（.*/, '')}の内容`); });
      });
      EMERGENCY.slice(0, 4).forEach(([k, l]) => { if (!(A.emergency[k] && A.emergency[k].tel)) miss.push(`緊急連絡先: ${l}`); });
      ['safety_manager', 'site_manager'].forEach((r) => { const w = qualWarn(staff, r, A[r]); if (w) miss.push(w); });
      if (mapTpl && !A.map.pt && !mapManual) miss.push('現場案内の地図（場所が見つからないので、ひな形の地図のままになります）');
      if (A.companies.some((co) => !co.name)) { K().say('会社を選んでいない行があります。選ぶか「この会社を外す」を押してください。'); return; }
      if (miss.length && !(await K().ask('次の情報がまだです。入れてから作るのがおすすめです。\n\n・' + miss.join('\n・') + '\n\nこのまま（空欄のまま）作りますか？', { ok: 'このまま作る', cancel: '戻って入れる' }))) return;
      // 劇場の緊急連絡先を残す
      try { await sbc().from('theater_safety').upsert({ theater: c.theater, data: Object.assign({}, A.emergency, { checked_at: new Date().toISOString() }), updated_by: (DB().userName && DB().userName()) || '', updated_at: new Date().toISOString() }); } catch (err) { /* 表が無い時は残さない */ }
      const st = (n) => staff.find((s) => s.name === n) || {};
      const workerData = (co) => { const p = partners.find((x) => String(x.id) === String(co.partner_id)); return co.workers.map((n) => ((p && p.workers) || []).find((w) => w.name === n) || { name: n }); };
      const base = {
        project: { work_name: A.work_name, orderer: A.orderer, site: A.site, site_address: A.site_address, period_from: A.period_from, period_to: A.period_to, work_hours: A.work_hours, content: A.content, created_date: today() },
        ryonetsu: Object.assign({}, RYONETSU, { chief: A.chief, chief_tel: st(A.chief).phone || '', general_safety: A.chief, safety_manager: A.safety_manager, safety_manager_tel: st(A.safety_manager).phone || '', site_manager: A.site_manager, site_manager_tel: st(A.site_manager).phone || '' }),
        companies: A.companies.map((co) => ({ name: co.name, tier: co.tier, parent: co.tier === 2 ? co.parent : RYONETSU.company, work: co.work, period_from: co.period_from, period_to: co.period_to, safety_person: co.safety_person, chief_engineer: co.chief_engineer, workers: co.workers, uses: co.uses })),
        emergency: A.emergency
      };
      const jobs = [];
      ry.forEach((x) => jobs.push({ tpl: x.r, kind: 'ryonetsu', folder: '菱熱分', label: tplLabel(x.r), data: base, map: x === mapTpl }));
      as.filter((x) => !x.vendor).forEach((x) => jobs.push({ tpl: x.r, asis: true, folder: '菱熱分', label: x.r.data.file_name || x.r.name }));
      A.companies.forEach((co) => as.filter((x) => x.vendor).forEach((x) => jobs.push({ tpl: x.r, asis: true, folder: '業者分_' + clean(co.name), label: x.r.data.file_name || x.r.name })));
      A.companies.forEach((co) => ve.forEach((x) => jobs.push({ tpl: x.r, kind: 'vendor', map: x === mapTpl, folder: '業者分_' + clean(co.name), label: tplLabel(x.r) + '（' + co.name + '）',
        data: Object.assign({}, base, { company: Object.assign({}, base.companies.find((b) => b.name === co.name), { worker_details: workerData(co) }) }) })));
      await runJobs(jobs);
    }
    async function runJobs(jobs) {
      d.foot.innerHTML = '<span class="ms-note dg-prog"></span><button type="button" data-dgx>閉じる</button>';
      const groupName = `安全書類 ${yymmdd()} ${c.title || ''}`.trim();
      let kept = null;   // { gid, folderId }（残したあと）
      const listHtml = () => jobs.map((j, i) => `<div class="dg-job ${j.state || ''}" data-ji="${i}"><span class="dg-job-st">${j.state === 'done' ? '✅' : j.state === 'err' ? '⚠' : j.state === 'run' ? '⏳' : '・'}</span>
        <span class="dg-job-n">${esc(j.folder)} / ${esc(j.label)}</span>
        ${j.state === 'done' && j.asis ? '<span class="ms-note">そのまま入れます（書き込まない）</span>' : ''}
        ${j.state === 'done' && j.kept ? `<button type="button" class="mini-btn" data-jopen="${i}">📄 開く（見る・直す）</button>` : ''}
        ${j.state === 'done' && !j.asis && j.res.unfilled.length ? `<span class="ms-note" title="${esc(j.res.unfilled.join('\n'))}">空けた欄 ${j.res.unfilled.length}</span>` : ''}
        ${j.state === 'err' ? `<span class="ms-note">${esc(j.err)}</span><button type="button" class="mini-btn" data-jretry="${i}">もう一度</button>` : ''}</div>`).join('');
      const warnHtml = () => { const w = [...new Set(jobs.filter((j) => j.res).flatMap((j) => j.res.warnings))]; return w.length ? `<div class="dg-warn"><b>⚠ 提出の前に:</b><ul>${w.slice(0, 15).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''; };
      const redraw = (keepMsg) => {
        const done = jobs.filter((j) => j.state === 'done').length;
        d.body.innerHTML = `<p class="ms-note">AI がひな形に書き込んでいます（1枚 30秒〜1分ほど・同時に3枚）。終わったら1枚ずつ、案件の書類と書類棚（${esc(c.theaterShort || c.theater)} の「${esc(groupName)}」フォルダ）に残します。「📄 開く」でその場で見て直せます。</p><div class="dg-jobs">${listHtml()}</div>${warnHtml()}${done === jobs.length ? `<div class="dg-done"><button type="button" class="primary" data-zip>⬇ ZIP でまとめてダウンロード</button> <span class="ms-note dg-keep">${esc(keepMsg || '')}</span></div>` : ''}`;
        const pr = d.foot.querySelector('.dg-prog'); if (pr) pr.textContent = `${done} / ${jobs.length} 枚`;
      };
      const runOne = async (j) => {
        j.state = 'run'; redraw();
        try {
          if (j.asis) j.res = { bytes: await bytesOf(j.tpl.data.path), entries: [], unfilled: [], warnings: [] };
          else {
            j.res = await fillOne(j.tpl, j.kind, j.data);
            if (j.map && (A.map.pt || mapManual)) {
              try { j.res.bytes = await replaceMapImage(j.res.bytes, A.map.pt, A.map.zoom, mapManual); }
              catch (err) { j.res.warnings.push('現場案内の地図を入れ替えられませんでした（' + (err.message || err) + '）。ひな形の地図のままです'); }
            }
          }
          j.state = 'done';
        } catch (err) { j.state = 'err'; j.err = err.message || String(err); }
        redraw();
      };
      const fileOf = (j) => ({ name: j.asis ? j.label : clean(j.label) + '.xlsx', folder: j.folder, bytes: j.res.bytes,
        mime: j.asis ? (j.tpl.data.mime || 'application/octet-stream') : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fill: j.asis ? null : { kind: j.kind, data: j.data } });
      const keepJobs = async (list) => {
        const files = list.map(fileOf);
        const r = await keepFiles(c, 'safety', groupName, files, Object.assign({ case_id: c.id }, A, { emergency: undefined, map: { zoom: A.map.zoom } }), kept);
        kept = kept || r; list.forEach((j, i) => { j.kept = files[i].kept; });
      };
      redraw();
      let next = 0;
      await Promise.all([0, 1, 2].map(async () => { while (next < jobs.length) { const j = jobs[next++]; await runOne(j); } }));
      const zipName = `【${clean(c.theaterShort || c.theater)}】${yymmdd()}_安全書類_菱熱工業.zip`;
      try { if (jobs.some((j) => j.state === 'done')) { redraw('案件と書類棚に残しています…'); await keepJobs(jobs.filter((j) => j.state === 'done')); } redraw('✅ 1枚ずつ、案件の書類と書類棚に残しました'); }
      catch (err) { redraw('残せませんでした: ' + (err.message || err)); }
      d.ov.addEventListener('click', async (e) => {
        const op = e.target.closest('[data-jopen]'); if (op) { const j = jobs[+op.dataset.jopen]; if (j.kept) openDoc(j.kept.cf); return; }
        const rt = e.target.closest('[data-jretry]');
        if (rt) { const j = jobs[+rt.dataset.jretry]; await runOne(j); if (j.state === 'done') { try { await keepJobs([j]); redraw('✅ 残しました'); } catch (err) { redraw('残せませんでした: ' + (err.message || err)); } } return; }
        if (e.target.closest('[data-zip]')) {
          if (kept) { await zipGroup(c.id, kept.gid); return; }
          const zip = new window.JSZip(); jobs.filter((j) => j.state === 'done').forEach((j) => { const f = fileOf(j); zip.file(`${f.folder}/${f.name}`, f.bytes); });
          download(zipName, await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }), 'application/zip');
        }
      });
    }
  }

  /* ============================================================
     💰 大口予算書
     ============================================================ */
  const CAT = { A: 'A 空調資材費', B: 'B 空調外注費', K: 'K 共通工事費' };
  async function openBudget(caseId) {
    if (!sbc()) { K().say('ログインして使ってください'); return; }
    let c; try { c = caseOf(caseId); } catch (e) { K().say(e.message); return; }
    if (!isLarge(c)) { K().say('大口予算書は、大口の案件（見積り300万円以上、または種別が更新案件）で作ります。'); return; }
    let tpls = [];
    try { tpls = (await loadTemplates('budget_tpl')).filter((r) => /\.xlsx$/i.test(r.data.file_name || r.name)); } catch (e) { K().say(e.message); return; }
    if (!tpls.length) { K().say('書類棚の「💰 大口予算書のひな形」に、ひな形（.xlsx）がありません。先にひな形を入れてください。'); return; }
    let partners = (await partnersList()).filter((p) => p.active !== false);
    await loadHistory();
    const prev = await lastMeta('budget', c);
    const pa = (prev && prev.answers && prev.answers.case_id === c.id) ? prev.answers : null;
    const B = pa ? JSON.parse(JSON.stringify(pa)) : {
      case_id: c.id, orderer: c.company || '', site: c.theater || '', work_name: c.title || '', due: c.workEndDate || '', contract_amount: Number(c.estimateAmount) || 0, lines: []
    };
    const d = dialog('dgBudget', `💰 大口予算書を作る — ${esc(c.theaterShort || c.theater)}　${esc(c.title || '')}`, true);
    const catOf = (name) => { const p = partners.find((x) => x.name === name); return p && p.kind === 'trader' ? 'A' : 'B'; };
    const totals = () => {
      const t = { A: 0, B: 0, K: 0 }; B.lines.forEach((l) => { t[l.category] = (t[l.category] || 0) + num(l.amount); });
      const sub = t.A + t.B + t.K, ct = num(B.contract_amount);
      const L = Math.round(ct * 0.018), M = Math.round(ct * 0.005), O = Math.round(ct * 0.01);
      return Object.assign(t, { sub, L, M, O, cost: sub + L + M + O, gross: ct - (sub + L + M + O), ct });
    };
    const draw = () => {
      const t = totals();
      const traders = partners.filter((p) => p.kind === 'trader'), pts = partners.filter((p) => p.kind !== 'trader');
      d.body.innerHTML = `
        <p class="ms-note">原価は案件アプリに無いので、支払先（商社・協力会社）ごとに支払う金額を入れてください。商社は「A 空調資材費」、協力会社は「B 空調外注費」を最初に選びます（変えられます）。工事番号・発注・支払の欄は空けて作ります。</p>
        <div class="dg-grid">
          <label><span>註文先</span><input class="tm-input" data-b="orderer" list="dgH_b_orderer" value="${esc(B.orderer)}"></label>
          <label><span>現場名</span><input class="tm-input" data-b="site" list="dgH_b_site" value="${esc(B.site)}"></label>
          <label><span>工事名称</span><input class="tm-input" data-b="work_name" list="dgH_b_work_name" value="${esc(B.work_name)}"></label>${histList('b_orderer')}${histList('b_site')}${histList('b_work_name')}${histList('b_item')}
          <label><span>納期</span><input type="date" class="tm-input" data-b="due" value="${esc(B.due)}"></label>
          <label><span>契約金額・工事指図書金額（税抜）</span><input class="tm-input dg-amt" data-b="contract_amount" value="${esc(yen(B.contract_amount))}"></label>
        </div>
        <h3 class="mst-h">🧾 支払先と金額</h3>
        <div class="dg-pick"><span class="ms-note">押すと行を足します:</span> ${traders.length ? '<b>🏬 商社</b> ' + traders.map((p) => `<button type="button" class="wa-chip" data-bpick="${esc(p.name)}">${esc(p.name)}</button>`).join('') : '<span class="sub">商社はまだ（協力会社マスターで区分を「商社」に）</span>'}
          <br>${pts.length ? '<b>🤝 協力会社</b> ' + pts.slice(0, 60).map((p) => `<button type="button" class="wa-chip" data-bpick="${esc(p.name)}">${esc(p.name)}</button>`).join('') : ''}</div>
        <datalist id="dgVendors">${partners.map((p) => `<option value="${esc(p.name)}">`).join('')}</datalist>
        <table class="ms-table dg-lines"><thead><tr><th>支払先</th><th>区分</th><th>品名・仕様（任意）</th><th>金額（税抜）</th><th></th></tr></thead><tbody>
          ${B.lines.map((l, i) => `<tr data-li="${i}"><td><input class="tm-input" list="dgVendors" data-l="vendor" value="${esc(l.vendor)}"></td>
            <td><select data-l="category">${Object.keys(CAT).map((k) => `<option value="${k}"${l.category === k ? ' selected' : ''}>${CAT[k]}</option>`).join('')}</select></td>
            <td><input class="tm-input" data-l="item" list="dgH_b_item" value="${esc(l.item || '')}" placeholder="空なら支払先の名前"></td>
            <td><input class="tm-input dg-amt" data-l="amount" value="${esc(l.amount ? yen(l.amount) : '')}" placeholder="0"></td>
            <td><button type="button" class="mini-btn danger" data-ldel="${i}">🗑</button></td></tr>`).join('') || '<tr><td colspan="5" class="sub">まだありません。上の会社を押すか「＋ 行を足す」</td></tr>'}
        </tbody></table>
        <button type="button" data-ladd>＋ 行を足す</button>
        <div class="dg-sum">
          <div>A 空調資材費 <b>${yen(t.A)}</b></div><div>B 空調外注費 <b>${yen(t.B)}</b></div><div>K 共通工事費 <b>${yen(t.K)}</b></div><div>資材外注費 計 <b>${yen(t.sub)}</b></div>
          <div>L 工事経費 1.8% <b>${yen(t.L)}</b></div><div>M 無償工事原価 0.5% <b>${yen(t.M)}</b></div><div>O 新商品開発費 1.0% <b>${yen(t.O)}</b></div>
          <div>予想原価 合計 <b>${yen(t.cost)}</b></div><div>契約金額 <b>${yen(t.ct)}</b></div><div class="${t.gross < 0 ? 'dg-neg' : ''}">粗利 <b>${yen(t.gross)}</b>（${t.ct ? (t.gross / t.ct * 100).toFixed(1) : '—'}%）</div>
        </div>
        <p class="ms-note">L・M・O と合計は目安です（Excel ではひな形の式で計算します）。</p>`;
      d.foot.innerHTML = '<button type="button" data-dgx>やめる</button><button type="button" class="primary" data-bmake>💰 作る（Excel）</button>';
    };
    const collect = () => {
      d.body.querySelectorAll('[data-b]').forEach((el) => { B[el.dataset.b] = el.dataset.b === 'contract_amount' ? num(el.value) : el.value.trim(); });
      d.body.querySelectorAll('[data-li]').forEach((tr) => { const l = B.lines[+tr.dataset.li]; if (!l) return; tr.querySelectorAll('[data-l]').forEach((el) => { l[el.dataset.l] = el.dataset.l === 'amount' ? num(el.value) : el.value.trim(); }); });
    };
    draw();
    d.ov.addEventListener('change', (e) => {
      if (e.target.matches('[data-l="vendor"]')) { collect(); const l = B.lines[+e.target.closest('[data-li]').dataset.li]; if (l && !l.categoryTouched) l.category = catOf(l.vendor); draw(); return; }
      if (e.target.matches('[data-l="category"]')) { collect(); const l = B.lines[+e.target.closest('[data-li]').dataset.li]; if (l) l.categoryTouched = true; draw(); return; }
      if (e.target.matches('[data-l="amount"],[data-b="contract_amount"]')) { collect(); draw(); }
    });
    d.ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-dgx]') || e.target === d.ov) { if (await K().ask('大口予算書を作るのをやめますか？（入れた内容は残りません）', { ok: 'やめて閉じる', cancel: '続ける' })) d.ov.remove(); return; }
      const pk = e.target.closest('[data-bpick]'); if (pk) { collect(); B.lines.push({ vendor: pk.dataset.bpick, category: catOf(pk.dataset.bpick), item: '', amount: 0 }); draw(); const ins = d.body.querySelectorAll('[data-l="amount"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
      if (e.target.closest('[data-ladd]')) { collect(); B.lines.push({ vendor: '', category: 'B', item: '', amount: 0 }); draw(); return; }
      const dl = e.target.closest('[data-ldel]'); if (dl) { collect(); B.lines.splice(+dl.dataset.ldel, 1); draw(); return; }
      if (e.target.closest('[data-bmake]')) { collect(); await make(); }
    });
    async function make() {
      B.lines = B.lines.filter((l) => l.vendor || l.amount);
      const miss = [];
      if (!B.lines.length) { K().say('支払先と金額を1行以上入れてください'); draw(); return; }
      B.lines.forEach((l, i) => { if (!l.vendor) miss.push(`${i + 1} 行目の支払先`); if (!l.amount) miss.push(`${l.vendor || i + 1 + ' 行目'} の金額`); });
      if (!B.contract_amount) miss.push('契約金額（見積り金額）');
      if (miss.length && !(await K().ask('次の情報がまだです。\n\n・' + miss.join('\n・') + '\n\nこのまま作りますか？', { ok: 'このまま作る', cancel: '戻って入れる' }))) { draw(); return; }
      // 一覧に無い支払先は協力会社マスターにも残す（A なら商社・ほかは協力会社）
      const sb = sbc(); const key = (s) => String(s || '').normalize('NFKC').replace(/株式会社|有限会社|合同会社|\(株\)|\(有\)|㈱|㈲|\s|　/g, '').toLowerCase();
      for (const l of B.lines) {
        if (!l.vendor || partners.some((p) => key(p.name) === key(l.vendor))) continue;
        const row = { name: l.vendor, name_key: key(l.vendor), phone: '', address: '', email: '', workers: [], active: true, source: 'manual', theaters: '', note: '大口予算書で足した', kind: l.category === 'A' ? 'trader' : 'partner' };
        let ins = await sb.from('partners').insert(row).select();
        if (ins.error && /kind/.test(ins.error.message || '')) { delete row.kind; ins = await sb.from('partners').insert(row).select(); }
        if (!ins.error && ins.data) partners.push(ins.data[0]);
      }
      const t = totals();
      const data = { orderer: B.orderer, site: B.site, work_name: B.work_name, due: B.due, contract_amount: B.contract_amount,
        lines: ['A', 'B', 'K'].flatMap((cat) => B.lines.filter((l) => l.category === cat).map((l) => ({ category: cat, category_name: CAT[cat], vendor: l.vendor, item: l.item || l.vendor, quantity: '1式', amount: l.amount }))),
        totals: { A: t.A, B: t.B, K: t.K, materials_outsourcing: t.sub } };
      d.body.innerHTML = '<p class="ms-note">⏳ AI がひな形に書き込んでいます（1分ほど）…</p>'; d.foot.innerHTML = '<button type="button" data-dgx>閉じる</button>';
      try {
        const res = await fillOne(tpls[0], 'budget', data);
        const name = `【${clean(c.theaterShort || c.theater)}】${yymmdd()}_大口工事予算書_菱熱工業.xlsx`;
        const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        d.body.innerHTML = `<p>✅ できました。<b>${esc(name)}</b></p>${res.unfilled.length ? `<p class="ms-note">空けた欄: ${esc(res.unfilled.join('・'))}</p>` : ''}${res.warnings.length ? `<p class="ms-note">⚠ ${esc(res.warnings.join('・'))}</p>` : ''}
          <p><button type="button" class="primary" data-bopen disabled>📄 開く（見る・直す）</button> <button type="button" data-bdl>⬇ Excel をダウンロード</button> <span class="ms-note dg-keep">案件と書類棚に残しています…</span></p>`;
        const file = { name, folder: '', bytes: res.bytes, mime, fill: { kind: 'budget', data } };
        d.ov.addEventListener('click', (e) => {
          if (e.target.closest('[data-bdl]')) download(name, res.bytes, mime);
          if (e.target.closest('[data-bopen]') && file.kept) openDoc(file.kept.cf);
        });
        try {
          await keepFiles(c, 'budget', `大口予算書 ${yymmdd()} ${c.title || ''}`.trim(), [file], Object.assign({}, B, { case_id: c.id }));
          d.body.querySelector('.dg-keep').textContent = '✅ 案件の書類と書類棚に残しました'; d.body.querySelector('[data-bopen]').disabled = false;
        } catch (err) { d.body.querySelector('.dg-keep').textContent = '残せませんでした: ' + (err.message || err); }
      } catch (err) { d.body.innerHTML = `<p>⚠ 作れませんでした: ${esc(err.message || err)}</p>`; }
    }
  }

  window.DOCGEN = { openSafety, openBudget, openWorkers, openDoc, zipGroup, isLarge, _classify: classify, _describe: describe };
})();
