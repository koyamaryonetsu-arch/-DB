"use strict";
/* ============================================================
   劇場カルテ（各劇場情報の中身）。window.KARTE
   ・タブで分ける: 持病・注意 / 機器表 / 不具合の履歴 / 備考 / 設備メモ / 連絡先
   ・持病・注意・備考・設備メモは「1行に1件・新しい順・年月と根拠（どこで知ったか）つき」。1件ずつ直す・消す・別の劇場へ移す
     （AIが入れたものには 🤖 の印）
   ・機器表: 機器表のファイル（PDF・画像・Excel）を上げると AI（Opus）が表にする → 見て直してから保存。元のファイルも残る
   ・Excel: 会社・劇場を選んで（複数可）劇場カルテを出す。1劇場＝1ファイル、2つ以上は ZIP
   ・保存先: Supabase（theater_notes / theater_equipment / theater_files / Storage theater-files）。?local=1 の時は localStorage
   ・アプリ本体（app.js）とは window.CINEMA_DB でつながる
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
  const isoDay = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const jpDay = (s) => s ? String(s).slice(0, 10).replace(/-/g, '/') : '';
  const nowIso = () => new Date().toISOString();
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const norm = (s) => String(s || '').replace(/[\s　、。，．・（）()「」『』【】\[\]:：/／\-－ー〜~]/g, '').toLowerCase();
  const BUCKET = 'theater-files';
  const KINDS = { chronic: '持病・注意', note: '備考', equipment: '設備メモ' };
  const KIND_ICON = { chronic: '⚠', note: '🗒', equipment: '📝' };
  const FIELD_TO_KIND = { equipment: 'equipment', chronic_issues: 'chronic', info_note: 'note' };
  const TABS = [
    { key: 'chronic', label: '⚠ 持病・注意' },
    { key: 'machines', label: '🔧 機器表' },
    { key: 'cases', label: '🛠 不具合の履歴' },
    { key: 'note', label: '🗒 備考' },
    { key: 'equipment', label: '📝 設備メモ' },
    { key: 'contacts', label: '📇 連絡先' }
  ];
  const EQ_COLS = [
    { k: 'system', label: '系統', w: 110, ph: 'シアター1系統' },
    { k: 'symbol', label: '記号', w: 70, ph: 'PAC-1' },
    { k: 'kind', label: '種別', w: 80, ph: '室外機' },
    { k: 'maker', label: 'メーカー', w: 80, ph: 'ダイキン' },
    { k: 'model', label: '型式', w: 130, ph: 'RSXYP900L' },
    { k: 'cool_kw', label: '冷房kW', w: 60, num: true },
    { k: 'heat_kw', label: '暖房kW', w: 60, num: true },
    { k: 'qty', label: '台数', w: 44, num: true, int: true },
    { k: 'year', label: '設置年', w: 56, ph: '2012' },
    { k: 'serves', label: '受け持ち', w: 80, ph: 'SCR1' },
    { k: 'location', label: '設置場所', w: 80, ph: '屋上' },
    { k: 'note', label: '備考', w: 140 }
  ];
  const LS = { notes: 'karteNotesV1', equip: 'karteEquipV1', files: 'karteFilesV1', tab: 'karteTabV1' };

  /* ============================================================
     保存先（Supabase / ローカル）
     ============================================================ */
  let missing = false;   // SETUP_THEATER_KARTE.sql 未実行（テーブルが無い）
  let checked = false;
  const api = {
    async probe() {
      const sb = sbc();
      if (!sb) { missing = false; checked = true; return true; }
      const { error } = await sb.from('theater_notes').select('id').limit(1);
      missing = !!error; checked = true;
      return !missing;
    },
    async notes(theaters) {
      const sb = sbc();
      if (!sb) return lsGet(LS.notes, []).filter((n) => theaters.includes(n.theater));
      const out = [];
      for (let i = 0; i < theaters.length; i += 40) {
        const { data, error } = await sb.from('theater_notes').select('*').in('theater', theaters.slice(i, i + 40)).limit(5000);
        if (error) throw error;
        out.push(...(data || []));
      }
      return out;
    },
    async equipment(theaters) {
      const sb = sbc();
      if (!sb) return lsGet(LS.equip, []).filter((n) => theaters.includes(n.theater));
      const out = [];
      for (let i = 0; i < theaters.length; i += 40) {
        const { data, error } = await sb.from('theater_equipment').select('*').in('theater', theaters.slice(i, i + 40)).limit(5000);
        if (error) throw error;
        out.push(...(data || []));
      }
      return out;
    },
    async files(theater) {
      const sb = sbc();
      if (!sb) return lsGet(LS.files, []).filter((n) => n.theater === theater);
      const { data, error } = await sb.from('theater_files').select('*').eq('theater', theater).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async contacts(theaters) {
      const sb = sbc();
      if (!sb) return lsGet('cinema_theater_contacts', []).filter((c) => theaters.includes(c.theater));
      const out = [];
      for (let i = 0; i < theaters.length; i += 40) {
        const { data, error } = await sb.from('theater_contacts').select('*').in('theater', theaters.slice(i, i + 40)).order('sort_order', { ascending: true });
        if (error) return out;
        out.push(...(data || []));
      }
      return out;
    },
    async insert(table, row) {
      const sb = sbc();
      if (!sb) {
        const key = table === 'theater_notes' ? LS.notes : table === 'theater_equipment' ? LS.equip : LS.files;
        const all = lsGet(key, []);
        const r = Object.assign({ id: uuid(), created_at: nowIso(), updated_at: nowIso() }, row);
        all.push(r); lsSet(key, all);
        return r;
      }
      const { data, error } = await sb.from(table).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async insertMany(table, rows) {
      if (!rows.length) return [];
      const sb = sbc();
      if (!sb) { const out = []; for (const r of rows) out.push(await api.insert(table, r)); return out; }
      const { data, error } = await sb.from(table).insert(rows).select();
      if (error) throw error;
      return data || [];
    },
    async update(table, id, patch) {
      patch = Object.assign({}, patch, table === 'theater_files' ? {} : { updated_at: nowIso() });
      const sb = sbc();
      if (!sb) {
        const key = table === 'theater_notes' ? LS.notes : table === 'theater_equipment' ? LS.equip : LS.files;
        const all = lsGet(key, []);
        const r = all.find((x) => x.id === id); if (r) Object.assign(r, patch);
        lsSet(key, all); return;
      }
      const { error } = await sb.from(table).update(patch).eq('id', id);
      if (error) throw error;
    },
    async remove(table, ids) {
      ids = [].concat(ids);
      const sb = sbc();
      if (!sb) {
        const key = table === 'theater_notes' ? LS.notes : table === 'theater_equipment' ? LS.equip : LS.files;
        lsSet(key, lsGet(key, []).filter((x) => !ids.includes(x.id))); return;
      }
      const { error } = await sb.from(table).delete().in('id', ids);
      if (error) throw error;
    },
    async moveContact(id, theater, company) {
      const sb = sbc();
      if (!sb) {
        const all = lsGet('cinema_theater_contacts', []);
        const c = all.find((x) => String(x.id) === String(id)); if (c) { c.theater = theater; c.company = company; }
        lsSet('cinema_theater_contacts', all); return;
      }
      const { error } = await sb.from('theater_contacts').update({ theater, company, updated_at: nowIso() }).eq('id', id);
      if (error) throw error;
    },
    async upload(path, file) {
      const sb = sbc();
      if (!sb) return true;
      const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (error) throw error;
      return true;
    },
    async signedUrl(path, sec) {
      const sb = sbc();
      if (!sb) return '';
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, sec || 900);
      if (error) throw error;
      return data.signedUrl;
    },
    async removeFile(path) {
      const sb = sbc();
      if (!sb) return;
      await sb.storage.from(BUCKET).remove([path]);
    },
    async token() {
      const sb = sbc();
      if (!sb) return '';
      try { const { data } = await sb.auth.getSession(); return (data && data.session && data.session.access_token) || ''; } catch (e) { return ''; }
    }
  };
  async function aiCall(body) {
    const token = await api.token();
    const r = await fetch('/api/theater-ai', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok || !j || j.error) throw new Error((j && (j.error + (j.detail ? '（' + j.detail + '）' : ''))) || ('通信に失敗しました（' + r.status + '）'));
    return j;
  }

  /* ============================================================
     表示の状態
     ============================================================ */
  const S = { company: '', theater: '', tab: lsGet(LS.tab, 'chronic'), notes: [], equip: [], files: [], sel: new Set(), filter: '', editing: null, contactsEl: null, contactsHome: null, box: null, loadSeq: 0 };
  const theaterList = () => call('theaters', []);
  const companyList = () => call('companies', []);
  const casesOf = (theater) => call('cases', []).filter((c) => c.theater === theater);
  const sortNotes = (a, b) => (String(b.source_date || '').localeCompare(String(a.source_date || ''))) || (String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const sortEquip = (a, b) => ((a.sort_order || 0) - (b.sort_order || 0)) || String(a.created_at || '').localeCompare(String(b.created_at || ''));
  const userName = () => call('userEmail', '').split('@')[0] || '';
  const ageOf = (y) => { const m = /(\d{4})/.exec(String(y || '')); if (!m) return null; const a = new Date().getFullYear() - Number(m[1]); return a >= 0 && a < 100 ? a : null; };

  async function show(opts) {
    S.company = opts.company || ''; S.theater = opts.theater || '';
    S.box = opts.box || $('karteBox');
    if (opts.contactsEl && !S.contactsEl) {
      S.contactsEl = opts.contactsEl;
      S.contactsHome = { parent: opts.contactsEl.parentNode, next: opts.contactsEl.nextSibling };
    }
    if (!S.box) return;
    restoreContacts();
    S.box.classList.remove('hidden');
    S.sel.clear(); S.filter = ''; S.editing = null;
    if (!checked) await ready();
    // 表がある時は、各劇場情報の古い3つの欄（設備・持病・備考の長い文章）を隠す
    document.querySelectorAll('.karte-legacy').forEach((el) => el.classList.toggle('karte-on', !missing));
    if (missing) { restoreContacts(); S.box.innerHTML = '<div class="empty-msg">⚠ 劇場カルテの表がまだありません。SETUP_THEATER_KARTE.sql を Supabase で1回実行してください。</div>'; return; }
    const seq = ++S.loadSeq;
    // 連絡先の表がタブの中にある時は、先に元の場所へ戻す（中身を消すと表まで消えるため）
    restoreContacts();
    if (S.contactsEl && S.tab !== 'contacts') S.contactsEl.classList.add('kt-off');
    S.box.innerHTML = '<div class="kt-loading">読み込み中…</div>';
    try {
      const [notes, equip, files] = await Promise.all([api.notes([S.theater]), api.equipment([S.theater]), api.files(S.theater)]);
      if (seq !== S.loadSeq) return;
      S.notes = notes; S.equip = equip; S.files = files;
    } catch (e) {
      if (seq !== S.loadSeq) return;
      S.box.innerHTML = '<div class="empty-msg">劇場カルテを読み込めませんでした: ' + esc(e.message || e) + '</div>'; return;
    }
    render();
  }
  function restoreContacts() {
    if (S.contactsEl && S.contactsHome && S.contactsEl.parentNode !== S.contactsHome.parent) {
      S.contactsHome.parent.insertBefore(S.contactsEl, S.contactsHome.next && S.contactsHome.next.parentNode === S.contactsHome.parent ? S.contactsHome.next : null);
    }
  }
  function hide() {
    S.loadSeq++;
    restoreContacts();
    if (S.contactsEl) S.contactsEl.classList.remove('kt-off');
    if (S.box) { S.box.innerHTML = ''; S.box.classList.add('hidden'); }
  }
  function available() { return checked && !missing; }
  // 表があるか（まだ確かめていなければ確かめる）
  async function ready() { if (!checked) { try { await api.probe(); } catch (e) { missing = true; checked = true; } } return !missing; }

  function count(key) {
    if (KINDS[key]) return S.notes.filter((n) => n.kind === key).length;
    if (key === 'machines') return S.equip.length;
    if (key === 'cases') return casesOf(S.theater).length;
    if (key === 'contacts') return S.contactsEl ? S.contactsEl.querySelectorAll('tbody tr').length : 0;
    return 0;
  }
  function render() {
    if (!S.box) return;
    const tab = TABS.find((t) => t.key === S.tab) ? S.tab : 'chronic';
    S.tab = tab;
    S.box.innerHTML = `
      <div class="kt-tabs" role="tablist">${TABS.map((t) => `<button type="button" class="kt-tab${t.key === tab ? ' on' : ''}" data-tab="${t.key}" role="tab">${t.label}<span class="kt-count">${count(t.key)}</span></button>`).join('')}</div>
      <div class="kt-panel" id="ktPanel"></div>`;
    const panel = S.box.querySelector('#ktPanel');
    if (tab === 'contacts') {
      if (S.contactsEl) { S.contactsEl.classList.remove('kt-off'); panel.appendChild(S.contactsEl); }
      return;
    }
    restoreContactsHidden();
    if (KINDS[tab]) panel.innerHTML = notesHtml(tab);
    else if (tab === 'machines') panel.innerHTML = machinesHtml();
    else if (tab === 'cases') panel.innerHTML = casesHtml();
    requestAnimationFrame(() => panel.querySelectorAll('textarea.kt-grow').forEach(grow));
  }
  // 連絡先タブ以外の時、連絡先の表はタブの外へ戻して隠す
  function restoreContactsHidden() {
    restoreContacts();
    if (S.contactsEl) S.contactsEl.classList.add('kt-off');
  }
  function grow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 260) + 'px'; }

  /* ---------- Excel のような表の部品（見出しで並べ替え・列ごとに絞り込み） ---------- */
  const LS_SORT = 'karteSortV1', LS_EQCOLS = 'karteEqColsV1';
  S.sort = lsGet(LS_SORT, {});          // { タブ: { k, dir: 1|-1 } }
  S.colf = {};                          // { タブ: { 列: 絞り込みの言葉 } }
  const EQ_DEFAULT = ['system', 'symbol', 'kind', 'maker', 'model', 'cool_kw', 'qty', 'year', 'serves'];
  S.eqVis = lsGet(LS_EQCOLS, EQ_DEFAULT);
  // cols: [{ k, label, w, sort:false, filter:false, cls }]
  function headHtml(tab, cols) {
    const st = S.sort[tab] || {}, cf = S.colf[tab] || {};
    return `<thead><tr>${cols.map((c) => {
      const on = st.k === c.k; const arrow = on ? (st.dir > 0 ? ' ▲' : ' ▼') : '';
      const tip = (c.tip ? c.tip + '。' : '') + (c.sort === false ? '' : '押すと並べ替え（もう一度で逆・3回目で元の順）');
      return `<th class="kt-th${c.cls ? ' ' + c.cls : ''}${c.sort === false ? '' : ' kt-sortable'}${on ? ' on' : ''}"${c.w ? ` style="width:${c.w}px;min-width:${c.w}px"` : ''}${c.sort === false ? '' : ` data-sort="${c.k}"`}${tip ? ` title="${esc(tip)}"` : ''}>${c.label}${c.tip ? ' <span class="kt-th-q">？</span>' : ''}${arrow}</th>`;
    }).join('')}</tr><tr class="kt-frow">${cols.map((c) => c.filter === false ? '<th></th>' : `<th><input type="search" size="2" class="kt-colf" data-fk="${c.k}" value="${esc(cf[c.k] || '')}" placeholder="絞り込み" aria-label="${esc(c.label)}で絞り込み"></th>`).join('')}</tr></thead>`;
  }
  // 列ごとの絞り込みと並べ替え。getv(行, 列) で比べる値
  function gridRows(tab, list, getv) {
    const cf = S.colf[tab] || {};
    let out = list.filter((r) => Object.keys(cf).every((k) => !cf[k] || norm(getv(r, k)).includes(norm(cf[k]))));
    const st = S.sort[tab];
    if (st && st.k) {
      out = out.slice().sort((a, b) => {
        const x = getv(a, st.k), y = getv(b, st.k);
        const nx = Number(x), ny = Number(y);
        const bothNum = x !== '' && y !== '' && x != null && y != null && isFinite(nx) && isFinite(ny);
        const c = bothNum ? nx - ny : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'ja');
        return c * st.dir;
      });
    }
    return out;
  }
  const filtered = (tab) => Object.values(S.colf[tab] || {}).some(Boolean) || !!S.filter;

  /* ---------- 持病・注意 / 備考 / 設備メモ ---------- */
  const PH = { chronic: '例: 夏場 SCR3 が冷えにくい（室外機の能力不足）', note: '例: 作業は2日前までに防災センターへ申請', equipment: '例: シアター系統はダイキン VRV（2014年更新）' };
  // 登録者: 誰がこの1件を入れたか（AI＝メール・LINE・会議の記録から自動で入れた／旧データから移行＝前の劇場情報の欄から移した）
  const whoOf = (n) => n.origin === 'ai' ? 'AI（自動）' : n.origin === 'migrated' ? '旧データから移行' : (n.created_by || '人');
  const NOTE_COLS = [
    { k: '_sel', label: '<input type="checkbox" class="kt-sel-all" title="全部選ぶ">', w: 28, sort: false, filter: false, cls: 'kt-c-sel' },
    { k: 'source_date', label: '年月', w: 78 },
    { k: 'body', label: '内容' },
    { k: 'evidence', label: '根拠（メール・資料）', w: 210, tip: 'この情報をどこで知ったか（メールの件名・報告書・LINE・会議など）' },
    { k: 'who', label: '登録者', w: 104, tip: '誰がこの1件を入れたか。AI（自動）＝メールやLINEから自動で入れたもの／旧データから移行＝前の劇場情報の欄から移したもの' },
    { k: '_acts', label: '', w: 92, sort: false, filter: false }
  ];
  function noteVal(n, k) { return k === 'who' ? whoOf(n) : n[k] == null ? '' : n[k]; }
  function notesHtml(kind) {
    const f = norm(S.filter);
    const base = S.notes.filter((n) => n.kind === kind).sort(sortNotes).filter((n) => !f || norm(n.body + n.evidence).includes(f));
    const list = gridRows(kind, base, noteVal);
    const all = S.notes.filter((n) => n.kind === kind).length;
    const selN = list.filter((n) => S.sel.has(n.id)).length;
    return `
      <div class="kt-add">
        <textarea class="tm-input kt-grow" id="ktNewBody" rows="1" placeholder="${esc(PH[kind])}（Ctrl+Enter で足す）"></textarea>
        <label class="kt-add-date">年月 <input type="month" id="ktNewDate" class="tm-input" value="${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}"></label>
        <button type="button" class="primary" data-act="add-note" data-kind="${kind}">＋ ${KINDS[kind]}を足す</button>
      </div>
      <div class="kt-bar">
        <input type="search" class="tm-input kt-filter" id="ktFilter" placeholder="🔍 全部の列から探す" value="${esc(S.filter)}">
        <span class="kt-bar-n">${list.length === all ? all + '件' : list.length + ' / ' + all + '件'}</span>
        <span class="kt-bar-sel${selN ? '' : ' hidden'}">選んだ ${selN} 件を
          <button type="button" data-act="move-sel">↪ 別の劇場・種類へ移す</button>
          <button type="button" class="danger" data-act="del-sel">🗑 消す</button>
        </span>
        <span class="kt-bar-hint">見出しを押すと並べ替え・見出しの下の欄で列ごとに絞り込み・内容をダブルクリックで直す<br>根拠＝その情報をどこで知ったか（メール・報告書など）／登録者＝誰が入れたか（AI（自動）＝メールやLINEから自動で入れたもの）</span>
      </div>
      ${all ? `<div class="kt-eq-wrap"><table class="kt-xl kt-notes">${headHtml(kind, NOTE_COLS)}<tbody>${list.map(noteHtml).join('')}</tbody></table>
        ${list.length ? '' : '<p class="empty-msg">絞り込みに合うものはありません。</p>'}</div>`
        : '<p class="empty-msg">まだ登録されていません。上の欄に書いて「＋ 足す」を押してください。</p>'}`;
  }
  function noteHtml(n) {
    const ai = n.origin === 'ai';
    if (S.editing === n.id) {
      return `<tr class="kt-note editing" data-id="${esc(n.id)}"><td colspan="${NOTE_COLS.length}">
        <div class="kt-edit">
          <textarea class="tm-input kt-grow kt-edit-body" rows="3">${esc(n.body)}</textarea>
          <div class="kt-edit-row">年月 <input type="month" class="tm-input kt-edit-date" value="${esc(n.source_date || '')}">
            根拠 <input type="text" class="tm-input kt-edit-ev" value="${esc(n.evidence || '')}" placeholder="どこで知ったか（メールの件名・資料名など）">
            <button type="button" class="primary" data-act="save-note">保存</button><button type="button" data-act="cancel-edit">やめる</button></div>
        </div></td></tr>`;
    }
    return `<tr class="kt-note${ai ? ' ai' : ''}" data-id="${esc(n.id)}">
      <td class="kt-c-sel"><input type="checkbox" class="kt-sel" ${S.sel.has(n.id) ? 'checked' : ''} title="選ぶ（まとめて移す・消す）"></td>
      <td class="kt-date">${esc(n.source_date || '')}</td>
      <td class="kt-body" title="ダブルクリックで直す">${esc(n.body)}</td>
      <td class="kt-ev">${esc(n.evidence || '')}</td>
      <td class="kt-who">${ai ? '🤖 ' : ''}${esc(whoOf(n))}</td>
      <td class="kt-acts"><button type="button" data-act="edit-note" title="直す">✏</button><button type="button" data-act="move-note" title="別の劇場・種類へ移す">↪</button><button type="button" class="danger" data-act="del-note" title="消す">🗑</button></td>
    </tr>`;
  }

  /* ---------- 機器表 ---------- */
  function eqCols() {
    const vis = EQ_COLS.filter((c) => S.eqVis.includes(c.k));
    return [{ k: '_sel', label: '<input type="checkbox" class="kt-sel-all" title="全部選ぶ">', w: 28, sort: false, filter: false, cls: 'kt-c-sel' }]
      .concat(vis.map((c) => ({ k: c.k, label: c.label, w: c.w })))
      .concat([{ k: '_age', label: '経過', w: 50 }, { k: '_acts', label: '', w: 74, sort: false, filter: false }]);
  }
  function eqGetv(r, k) { if (k === '_age') { const a = ageOf(r.year); return a == null ? '' : a; } return r[k] == null ? '' : r[k]; }
  function machinesHtml() {
    const f = norm(S.filter);
    const all = S.equip.slice().sort(sortEquip);
    const list = gridRows('machines', all.filter((r) => !f || norm(EQ_COLS.map((c) => r[c.k]).join(' ')).includes(f)), eqGetv);
    const selN = list.filter((r) => S.sel.has(r.id)).length;
    const old15 = all.filter((r) => (ageOf(r.year) || 0) >= 15).length;
    return `
      <div class="kt-bar">
        <label class="kt-upload primary-like">📤 機器表を読み込む（PDF・写真・Excel）<input type="file" id="ktEqFile" accept=".pdf,.xlsx,.csv,image/*" multiple hidden></label>
        <button type="button" data-act="add-eq">＋ 1行足す</button>
        <span class="kt-colpick-wrap"><button type="button" data-act="eq-cols" title="出す列を選ぶ">列を選ぶ ▾</button>${S.eqColsOpen ? `<span class="kt-colpick">${EQ_COLS.map((c) => `<label><input type="checkbox" class="kt-eqcol" value="${c.k}" ${S.eqVis.includes(c.k) ? 'checked' : ''}> ${esc(c.label)}</label>`).join('')}<button type="button" data-act="eq-cols-reset">いつもの列に戻す</button></span>` : ''}</span>
        <input type="search" class="tm-input kt-filter" id="ktFilter" placeholder="🔍 全部の列から探す" value="${esc(S.filter)}">
        <span class="kt-bar-n">${list.length === all.length ? all.length + '行' : list.length + ' / ' + all.length + '行'}（計 ${list.reduce((m, r) => m + (r.qty || 1), 0)} 台）${old15 ? `　<span class="kt-old15-n">15年以上 ${old15}</span>` : ''}</span>
        <span class="kt-bar-sel${selN ? '' : ' hidden'}">選んだ ${selN} 行を
          <button type="button" data-act="move-sel">↪ 別の劇場へ移す</button>
          <button type="button" class="danger" data-act="del-sel">🗑 消す</button>
        </span>
      </div>
      ${S.files.length ? `<div class="kt-files">読み込んだファイル: ${S.files.map((f) => `<span class="kt-file" data-fid="${esc(f.id)}"><a href="#" data-act="open-file">📄 ${esc(f.name)}</a><small>${jpDay(f.created_at)}</small><button type="button" class="kt-x" data-act="del-file" title="ファイルを消す（表の行は残る）">×</button></span>`).join('')}</div>` : ''}
      ${all.length ? `<div class="kt-eq-wrap"><table class="kt-xl kt-eq">${headHtml('machines', eqCols())}
        <tbody>${list.map(eqRowHtml).join('')}</tbody></table>${list.length ? '' : '<p class="empty-msg">絞り込みに合う行はありません。</p>'}</div>`
        : '<p class="empty-msg">機器表はまだありません。「📤 機器表を読み込む」で機器表のファイルを選ぶと、AI が表にします（保存の前に確かめられます）。手で「＋ 1行足す」こともできます。</p>'}
      <p class="tm-hint">💡 セルを直すと自動で保存します。設置年から経過年数を出し、10年以上は黄、15年以上は赤。暖房kW・設置場所・備考は「列を選ぶ」で出せます。</p>`;
  }
  function eqRowHtml(r) {
    const age = ageOf(r.year);
    const cls = age == null ? '' : age >= 15 ? ' old15' : age >= 10 ? ' old10' : '';
    return `<tr data-id="${esc(r.id)}" class="${r.origin === 'ai' ? 'ai' : ''}">
      <td class="kt-c-sel"><input type="checkbox" class="kt-sel" ${S.sel.has(r.id) ? 'checked' : ''}></td>
      ${EQ_COLS.filter((c) => S.eqVis.includes(c.k)).map((c) => `<td><input type="text" class="kt-eq-f${c.num ? ' num' : ''}" data-f="${c.k}" value="${esc(r[c.k] == null ? '' : r[c.k])}" placeholder="${esc(c.ph || '')}"${c.num ? ' inputmode="decimal"' : ''}></td>`).join('')}
      <td class="kt-age${cls}">${age == null ? '' : age + '年'}</td>
      <td class="kt-acts">${r.origin === 'ai' ? '<span title="AIが機器表から読んだ行">🤖</span>' : ''}<button type="button" data-act="move-eq" title="別の劇場へ移す">↪</button><button type="button" class="danger" data-act="del-eq" title="消す">🗑</button></td>
    </tr>`;
  }

  /* ---------- 不具合の履歴（この劇場の案件） ---------- */
  const CASE_COLS = [
    { k: 'receivedDate', label: '受付日', w: 86 }, { k: 'category', label: '種別', w: 80 }, { k: 'content', label: '内容' },
    { k: 'status', label: '状態', w: 90 }, { k: 'workEndDate', label: '完了日', w: 86 }, { k: 'rPerson', label: '担当', w: 70 }
  ];
  function caseVal(c, k) { if (k === 'content') return [c.estimateName, c.content].filter(Boolean).join('｜'); return c[k] || ''; }
  function casesHtml() {
    const f = norm(S.filter);
    const all = casesOf(S.theater).sort((a, b) => String(b.receivedDate || '').localeCompare(String(a.receivedDate || '')));
    const list = gridRows('cases', all.filter((c) => !f || norm([c.category, c.content, c.estimateName, c.status, c.memo].join(' ')).includes(f)), caseVal);
    return `
      <div class="kt-bar">
        <input type="search" class="tm-input kt-filter" id="ktFilter" placeholder="🔍 全部の列から探す" value="${esc(S.filter)}">
        <span class="kt-bar-n">${list.length === all.length ? all.length + '件' : list.length + ' / ' + all.length + '件'}</span>
        <span class="kt-bar-hint">この劇場の案件（新しい順）。行を押すと案件を開きます。</span>
      </div>
      ${all.length ? `<div class="kt-eq-wrap"><table class="kt-xl kt-cases">${headHtml('cases', CASE_COLS)}<tbody>
        ${list.map((c) => `<tr data-case="${esc(c.id)}" class="kt-case-row"><td>${esc(jpDay(c.receivedDate))}</td><td>${esc(c.category || '')}</td><td class="kt-case-content">${esc(caseVal(c, 'content'))}</td><td><span class="kt-status">${esc(c.status || '')}</span></td><td>${esc(jpDay(c.workEndDate))}</td><td>${esc(c.rPerson || '')}</td></tr>`).join('')}
      </tbody></table>${list.length ? '' : '<p class="empty-msg">絞り込みに合う案件はありません。</p>'}</div>` : '<p class="empty-msg">この劇場の案件はまだありません。</p>'}`;
  }

  /* ============================================================
     操作
     ============================================================ */
  function noteById(id) { return S.notes.find((n) => n.id === id); }
  function eqById(id) { return S.equip.find((n) => n.id === id); }
  async function addNote(kind) {
    const body = ($('ktNewBody').value || '').trim();
    if (!body) { $('ktNewBody').focus(); return; }
    const row = { company: S.company, theater: S.theater, kind, body, source_date: ($('ktNewDate').value || '').slice(0, 7), evidence: '', origin: 'manual', created_by: userName() };
    try { S.notes.push(await api.insert('theater_notes', row)); render(); }
    catch (e) { say('保存に失敗しました: ' + (e.message || e)); }
  }
  async function saveNote(li) {
    const n = noteById(li.dataset.id); if (!n) return;
    const patch = { body: li.querySelector('.kt-edit-body').value.trim(), source_date: (li.querySelector('.kt-edit-date').value || '').slice(0, 7), evidence: li.querySelector('.kt-edit-ev').value.trim() };
    if (!patch.body) { say('中身が空です。消す時は 🗑 を押してください。'); return; }
    try { await api.update('theater_notes', n.id, patch); Object.assign(n, patch); S.editing = null; render(); }
    catch (e) { say('保存に失敗しました: ' + (e.message || e)); }
  }
  async function delNotes(ids) {
    if (!ids.length) return;
    const one = ids.length === 1 ? noteById(ids[0]) : null;
    if (!(await ask(one ? `「${one.body.slice(0, 40)}」を消しますか？` : `選んだ ${ids.length} 件を消しますか？`, { ok: '🗑 消す', danger: true }))) return;
    try { await api.remove('theater_notes', ids); S.notes = S.notes.filter((n) => !ids.includes(n.id)); ids.forEach((i) => S.sel.delete(i)); render(); }
    catch (e) { say('消せませんでした: ' + (e.message || e)); }
  }
  async function moveNotes(ids) {
    if (!ids.length) return;
    const first = noteById(ids[0]);
    const to = await pick({ title: ids.length === 1 ? '別の劇場・種類へ移す' : `選んだ ${ids.length} 件を移す`, company: S.company, theater: S.theater, kind: first ? first.kind : 'note', withKind: true });
    if (!to) return;
    if (to.theater === S.theater && first && to.kind === first.kind && ids.length === 1) return;
    try {
      for (const id of ids) {
        const patch = { theater: to.theater, company: to.company, kind: to.kind };
        await api.update('theater_notes', id, patch);
        const n = noteById(id); if (n) Object.assign(n, patch);
      }
      S.notes = S.notes.filter((n) => n.theater === S.theater);
      ids.forEach((i) => S.sel.delete(i));
      toast(`${ids.length} 件を「${to.theater}」の${KINDS[to.kind]}へ移しました`);
      render();
    } catch (e) { say('移せませんでした: ' + (e.message || e)); }
  }
  async function addEqRow() {
    const max = S.equip.reduce((m, r) => Math.max(m, r.sort_order || 0), 0);
    const row = { company: S.company, theater: S.theater, origin: 'manual', sort_order: max + 10, created_by: userName() };
    try { S.equip.push(await api.insert('theater_equipment', row)); render(); const last = S.box.querySelector('tbody tr:last-child input.kt-eq-f'); if (last) last.focus(); }
    catch (e) { say('保存に失敗しました: ' + (e.message || e)); }
  }
  // 設置年: 和暦（H28・平成28年・R3・S63）や「2012年」を西暦4けたにする
  const normYear = (v) => {
    const t = String(v == null ? '' : v).trim().replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
    let m = /^(?:H|Ｈ|平成)\s*(\d{1,2})/i.exec(t); if (m) return String(1988 + Number(m[1]));
    m = /^(?:R|Ｒ|令和)\s*(\d{1,2})/i.exec(t); if (m) return String(2018 + Number(m[1]));
    m = /^(?:S|Ｓ|昭和)\s*(\d{1,2})/i.exec(t); if (m) return String(1925 + Number(m[1]));
    m = /^(\d{4})\s*年?$/.exec(t); if (m) return m[1];
    return t;
  };
  const eqVal = (c, v) => {
    if (c && c.k === 'year') return normYear(v);
    v = String(v == null ? '' : v).trim();
    if (!c || !c.num) return v;
    if (v === '') return null;
    const n = Number(v.replace(/[,，kKwW台\s]/g, '').replace(/[０-９．]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0)));
    if (!isFinite(n)) return null;
    return c.int ? Math.round(n) : n;
  };
  async function saveEqCell(input) {
    const tr = input.closest('tr'); const r = eqById(tr.dataset.id); if (!r) return;
    const col = EQ_COLS.find((c) => c.k === input.dataset.f);
    const v = eqVal(col, input.value);
    if (col.num && input.value.trim() !== '' && v == null) { say('数字で入れてください'); input.value = r[col.k] == null ? '' : r[col.k]; return; }
    try {
      await api.update('theater_equipment', r.id, { [col.k]: v }); r[col.k] = v;
      if (col.k === 'year') { const td = tr.querySelector('.kt-age'); const age = ageOf(v); td.textContent = age == null ? '' : age + '年'; td.className = 'kt-age' + (age == null ? '' : age >= 15 ? ' old15' : age >= 10 ? ' old10' : ''); }
    } catch (e) { say('保存に失敗しました: ' + (e.message || e)); }
  }
  async function delEq(ids) {
    if (!ids.length) return;
    if (!(await ask(ids.length === 1 ? 'この行を消しますか？' : `選んだ ${ids.length} 行を消しますか？`, { ok: '🗑 消す', danger: true }))) return;
    try { await api.remove('theater_equipment', ids); S.equip = S.equip.filter((r) => !ids.includes(r.id)); ids.forEach((i) => S.sel.delete(i)); render(); }
    catch (e) { say('消せませんでした: ' + (e.message || e)); }
  }
  async function moveEq(ids) {
    if (!ids.length) return;
    const to = await pick({ title: ids.length === 1 ? '機器を別の劇場へ移す' : `選んだ ${ids.length} 行を別の劇場へ移す`, company: S.company, theater: S.theater });
    if (!to || to.theater === S.theater) return;
    try {
      for (const id of ids) await api.update('theater_equipment', id, { theater: to.theater, company: to.company });
      S.equip = S.equip.filter((r) => !ids.includes(r.id)); ids.forEach((i) => S.sel.delete(i));
      toast(`${ids.length} 行を「${to.theater}」の機器表へ移しました`);
      render();
    } catch (e) { say('移せませんでした: ' + (e.message || e)); }
  }
  async function openFile(fid) {
    const f = S.files.find((x) => x.id === fid); if (!f) return;
    try {
      const url = sbc() ? await api.signedUrl(f.path, 900) : (f.data_url || '');
      if (!url) { say('このファイルは、この端末（テスト）には残っていません。'); return; }
      window.open(url, '_blank', 'noopener');
    } catch (e) { say('ファイルを開けませんでした: ' + (e.message || e)); }
  }
  async function delFile(fid) {
    const f = S.files.find((x) => x.id === fid); if (!f) return;
    if (!(await ask(`ファイル「${f.name}」を消しますか？（機器表の行は残ります）`, { ok: '🗑 消す', danger: true }))) return;
    try { await api.removeFile(f.path); await api.remove('theater_files', [fid]); S.files = S.files.filter((x) => x.id !== fid); render(); }
    catch (e) { say('消せませんでした: ' + (e.message || e)); }
  }

  /* ---------- 連絡先を別の劇場へ（app.js の表から呼ぶ） ---------- */
  async function moveContact(c) {
    const to = await pick({ title: '連絡先を別の劇場へ移す', company: c.company || S.company, theater: c.theater });
    if (!to || to.theater === c.theater) return null;
    await api.moveContact(c.id, to.theater, to.company);
    toast(`連絡先を「${to.theater}」へ移しました`);
    return to;
  }

  /* ============================================================
     機器表の読み込み（AI）
     ============================================================ */
  // Excel(.xlsx) を「シートごと・タブ区切り」の文字にする（AI に渡す）
  async function xlsxToText(file) {
    if (typeof JSZip === 'undefined') throw new Error('Excel を読む部品（JSZip）がありません');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parser = new DOMParser();
    const xml = async (p) => { const f = zip.file(p); return f ? parser.parseFromString(await f.async('string'), 'application/xml') : null; };
    const ss = await xml('xl/sharedStrings.xml');
    const strings = ss ? Array.from(ss.getElementsByTagName('si')).map((si) => Array.from(si.getElementsByTagName('t')).map((t) => t.textContent).join('')) : [];
    const wb = await xml('xl/workbook.xml');
    const rels = await xml('xl/_rels/workbook.xml.rels');
    const relMap = {};
    if (rels) Array.from(rels.getElementsByTagName('Relationship')).forEach((r) => { relMap[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const sheets = wb ? Array.from(wb.getElementsByTagName('sheet')).map((s) => ({ name: s.getAttribute('name'), target: relMap[s.getAttribute('r:id')] || '' })) : [];
    let out = '';
    for (const s of sheets) {
      const path = s.target.replace(/^\//, '').replace(/^(?!xl\/)/, 'xl/');
      const doc = await xml(path); if (!doc) continue;
      out += `［シート:${s.name}］\n`;
      Array.from(doc.getElementsByTagName('row')).forEach((row) => {
        const cells = [];
        Array.from(row.getElementsByTagName('c')).forEach((c) => {
          const ref = c.getAttribute('r') || ''; const col = ref.replace(/\d+/g, '');
          let n = 0; for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
          const t = c.getAttribute('t'); const v = c.getElementsByTagName('v')[0];
          let val = '';
          if (t === 's' && v) val = strings[Number(v.textContent)] || '';
          else if (t === 'inlineStr') val = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent).join('');
          else if (v) val = v.textContent;
          cells[Math.max(0, n - 1)] = String(val).replace(/[\t\r\n]+/g, ' ');
        });
        const line = Array.from(cells, (x) => x || '').join('\t').replace(/\t+$/, '');
        if (line.replace(/\t/g, '').trim()) out += line + '\n';
      });
      if (out.length > 110000) break;
    }
    return out.slice(0, 110000);
  }
  async function csvToText(file) {
    const buf = await file.arrayBuffer();
    let t = new TextDecoder('utf-8').decode(buf);
    if (/�/.test(t)) { try { t = new TextDecoder('shift_jis').decode(buf); } catch (e) {} }
    return '［CSV］\n' + t.replace(/,/g, '\t').slice(0, 110000);
  }
  async function importEquipment(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    for (const f of files) {
      if (/\.xls$/i.test(f.name)) { say(`「${f.name}」は古い Excel の形です。Excel で開いて「名前を付けて保存」→「Excel ブック（.xlsx）」にしてから選んでください。`); return; }
      if (f.size > 25 * 1024 * 1024) { say(`「${f.name}」は大きすぎます（25MB まで）。`); return; }
    }
    const dlg = openImportDialog();
    dlg.status('ファイルを置いています…');
    const saved = [], aiFiles = [], texts = [];
    try {
      for (const f of files) {
        const id = uuid();
        const ext = ((/\.([a-z0-9]+)$/i.exec(f.name) || [])[1] || 'bin').toLowerCase();
        const path = `${id}.${ext}`;
        await api.upload(path, f);
        const row = { company: S.company, theater: S.theater, kind: 'equipment', name: f.name, path, mime: f.type || '', size: f.size, created_by: userName() };
        if (!sbc() && f.size < 1.5 * 1024 * 1024) row.data_url = await new Promise((res) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(''); rd.readAsDataURL(f); });
        const rec = await api.insert('theater_files', row);
        saved.push(rec);
        if (/\.xlsx$/i.test(f.name)) texts.push({ name: f.name, text: await xlsxToText(f) });
        else if (/\.csv$/i.test(f.name)) texts.push({ name: f.name, text: await csvToText(f) });
        else {
          const mt = /\.pdf$/i.test(f.name) ? 'application/pdf' : (f.type || 'image/jpeg');
          aiFiles.push({ url: sbc() ? await api.signedUrl(path, 1800) : 'local:' + path, mediaType: mt, name: f.name });
        }
      }
      S.files = saved.concat(S.files);
      dlg.status('AI（Opus）が機器表を読んでいます…（1〜3分かかることがあります）');
      const j = await aiCall({ task: 'equipment', theater: S.theater, files: aiFiles, text: texts.map((t) => `【${t.name}】\n${t.text}`).join('\n\n'), textName: texts.map((t) => t.name).join('・') });
      const rows = ((j.data && j.data.rows) || []).map((r) => Object.assign({}, r, { year: normYear(r.year), file_id: saved[0] ? saved[0].id : null }));
      dlg.preview(rows, (j.data && j.data.note) || '');
    } catch (e) {
      dlg.error('読み込めませんでした: ' + (e.message || e) + (saved.length ? '（ファイルは残しています。下の「読み込んだファイル」から開けます）' : ''));
    }
  }
  function openImportDialog() {
    closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'kt-overlay'; ov.id = 'ktImport';
    ov.innerHTML = `<div class="kt-dialog kt-dialog-wide"><div class="kt-dlg-head">📤 機器表を読み込む（${esc(S.theater)}）<button type="button" class="close-btn" data-act="close-ov">×</button></div>
      <div class="kt-dlg-body"><div class="kt-imp-status"><span class="kt-spin"></span><span id="ktImpMsg"></span></div><div id="ktImpPreview"></div></div>
      <div class="kt-dlg-foot" id="ktImpFoot"><button type="button" data-act="close-ov">閉じる</button></div></div>`;
    document.body.appendChild(ov);
    let rows = [];
    const api2 = {
      status(m) { ov.querySelector('#ktImpMsg').textContent = m; },
      error(m) { ov.querySelector('.kt-imp-status').innerHTML = '<span class="kt-err">⚠ ' + esc(m) + '</span>'; render(); },
      preview(list, note) {
        rows = list;
        ov.querySelector('.kt-imp-status').innerHTML = rows.length ? `✅ ${rows.length} 行を読み取りました。確かめて、要らない行のチェックを外してから保存してください。${note ? '<br><small>AIのメモ: ' + esc(note) + '</small>' : ''}` : '<span class="kt-err">⚠ 機器を読み取れませんでした。' + esc(note) + '</span>';
        if (!rows.length) { render(); return; }
        ov.querySelector('#ktImpPreview').innerHTML = `<div class="kt-eq-wrap"><table class="tm-table kt-eq kt-imp"><thead><tr><th><input type="checkbox" class="kt-imp-all" checked></th>${EQ_COLS.map((c) => `<th>${c.label}</th>`).join('')}<th>読んだ所</th></tr></thead><tbody>
          ${rows.map((r, i) => `<tr data-i="${i}" class="${r.unsure ? 'unsure' : ''}"><td><input type="checkbox" class="kt-imp-chk" checked></td>${EQ_COLS.map((c) => `<td><input type="text" class="tm-input kt-imp-f${c.num ? ' num' : ''}" data-f="${c.k}" value="${esc(r[c.k] == null ? '' : r[c.k])}"></td>`).join('')}<td class="kt-src">${esc(r.src || '')}${r.unsure ? `<div class="kt-unsure">⚠ ${esc(r.unsure)}</div>` : ''}</td></tr>`).join('')}
        </tbody></table></div>`;
        const n = S.equip.length;
        ov.querySelector('#ktImpFoot').innerHTML = `
          <label><input type="radio" name="ktImpMode" value="append" checked> 今の機器表に足す</label>
          ${n ? `<label><input type="radio" name="ktImpMode" value="replace"> 今の機器表（${n} 行）と入れ替える</label>` : ''}
          <button type="button" class="primary" data-act="imp-save">保存する</button><button type="button" data-act="close-ov">やめる</button>`;
        render();
      }
    };
    ov.addEventListener('change', (e) => {
      if (e.target.classList.contains('kt-imp-all')) ov.querySelectorAll('.kt-imp-chk').forEach((c) => { c.checked = e.target.checked; });
      if (e.target.classList.contains('kt-imp-f')) { const i = +e.target.closest('tr').dataset.i; const col = EQ_COLS.find((c) => c.k === e.target.dataset.f); rows[i][col.k] = eqVal(col, e.target.value); }
    });
    ov.addEventListener('click', async (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'close-ov') { closeOverlay(); return; }
      if (act !== 'imp-save') return;
      const pickRows = Array.from(ov.querySelectorAll('tbody tr')).filter((tr) => tr.querySelector('.kt-imp-chk').checked).map((tr) => rows[+tr.dataset.i]);
      if (!pickRows.length) { say('保存する行を選んでください'); return; }
      const mode = (ov.querySelector('input[name="ktImpMode"]:checked') || {}).value || 'append';
      if (mode === 'replace' && !(await ask(`今の機器表（${S.equip.length} 行）を消して、読み取った ${pickRows.length} 行に入れ替えますか？`, { ok: '入れ替える', danger: true }))) return;
      e.target.disabled = true;
      try {
        if (mode === 'replace' && S.equip.length) { await api.remove('theater_equipment', S.equip.map((r) => r.id)); S.equip = []; }
        let so = S.equip.reduce((m, r) => Math.max(m, r.sort_order || 0), 0);
        const ins = pickRows.map((r) => {
          const o = { company: S.company, theater: S.theater, origin: 'ai', file_id: r.file_id || null, created_by: userName(), sort_order: (so += 10) };
          EQ_COLS.forEach((c) => { const v = r[c.k]; o[c.k] = c.num ? (v == null || v === '' ? null : eqVal(c, v)) : c.k === 'year' ? normYear(v) : String(v == null ? '' : v); });
          return o;
        });
        S.equip = S.equip.concat(await api.insertMany('theater_equipment', ins));
        closeOverlay(); S.tab = 'machines'; render();
        toast(`機器表に ${ins.length} 行を保存しました`);
      } catch (err) { e.target.disabled = false; say('保存に失敗しました: ' + (err.message || err)); }
    });
    return api2;
  }

  /* ============================================================
     劇場を選ぶ小さな画面（移す時）
     ============================================================ */
  function pick(o) {
    return new Promise((resolve) => {
      closeOverlay();
      const cos = companyList().map((c) => c.name);
      const ov = document.createElement('div');
      ov.className = 'kt-overlay'; ov.id = 'ktPick';
      ov.innerHTML = `<div class="kt-dialog"><div class="kt-dlg-head">↪ ${esc(o.title)}<button type="button" class="close-btn" data-act="x">×</button></div>
        <div class="kt-dlg-body kt-pick">
          <label>会社 <select class="tm-input" id="ktPickCo">${cos.map((n) => `<option ${n === o.company ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
          <label>劇場 <input type="search" class="tm-input" id="ktPickQ" placeholder="🔍 名前で探す"></label>
          <select class="tm-input" id="ktPickTh" size="8"></select>
          ${o.withKind ? `<label>種類 <select class="tm-input" id="ktPickKind">${Object.keys(KINDS).map((k) => `<option value="${k}" ${k === o.kind ? 'selected' : ''}>${KIND_ICON[k]} ${KINDS[k]}</option>`).join('')}</select></label>` : ''}
        </div>
        <div class="kt-dlg-foot"><button type="button" class="primary" data-act="ok">移す</button><button type="button" data-act="x">やめる</button></div></div>`;
      document.body.appendChild(ov);
      const fill = () => {
        const co = ov.querySelector('#ktPickCo').value; const q = norm(ov.querySelector('#ktPickQ').value);
        const names = theaterList().filter((t) => t.company === co && (!q || norm(t.name).includes(q))).map((t) => t.name);
        ov.querySelector('#ktPickTh').innerHTML = names.map((n) => `<option ${n === o.theater ? 'selected' : ''}>${esc(n)}</option>`).join('');
        if (!ov.querySelector('#ktPickTh').value && names.length) ov.querySelector('#ktPickTh').selectedIndex = 0;
      };
      fill();
      ov.querySelector('#ktPickCo').addEventListener('change', fill);
      ov.querySelector('#ktPickQ').addEventListener('input', fill);
      const done = (v) => { closeOverlay(); resolve(v); };
      ov.addEventListener('click', (e) => {
        const act = e.target.dataset && e.target.dataset.act;
        if (act === 'x') done(null);
        if (act === 'ok') {
          const th = ov.querySelector('#ktPickTh').value;
          if (!th) { say('移す先の劇場を選んでください'); return; }
          done({ company: ov.querySelector('#ktPickCo').value, theater: th, kind: o.withKind ? ov.querySelector('#ktPickKind').value : undefined });
        }
      });
      ov.querySelector('#ktPickTh').addEventListener('dblclick', () => ov.querySelector('[data-act="ok"]').click());
    });
  }
  function closeOverlay() { document.querySelectorAll('.kt-overlay').forEach((x) => x.remove()); }
  // 画面の中の確認・お知らせ（ブラウザの confirm/alert は使わない。操作を止めず、Claude in Chrome でも押せる）
  function ask(msg, o) {
    o = o || {};
    return new Promise((resolve) => {
      const ov = document.createElement('div');
      ov.className = 'kt-ask-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = `<div class="kt-ask"><div class="kt-ask-msg">${esc(msg)}</div><div class="kt-ask-btns">${o.alertOnly ? '' : `<button type="button" class="kt-ask-no">${esc(o.cancel || 'やめる')}</button>`}<button type="button" class="kt-ask-yes ${o.danger ? 'danger' : 'primary'}">${esc(o.ok || 'OK')}</button></div></div>`;
      document.body.appendChild(ov);
      const done = (v) => { document.removeEventListener('keydown', onKey, true); ov.remove(); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); } else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true); } };
      document.addEventListener('keydown', onKey, true);
      ov.addEventListener('click', (e) => { if (e.target.closest('.kt-ask-yes')) done(true); else if (e.target.closest('.kt-ask-no') || e.target === ov) done(false); });
      const y = ov.querySelector('.kt-ask-yes'); if (y) y.focus();
    });
  }
  function say(msg) { return ask(msg, { alertOnly: true, ok: 'OK' }); }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'kt-toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3200);
  }

  /* ============================================================
     Excel（1劇場＝1ファイル。2つ以上は ZIP）
     ============================================================ */
  function openExport(defaultCompany) {
    closeOverlay();
    const ths = theaterList().filter((t) => t.name && !t.closed);   // 閉館した劇場は出さない
    const cos = companyList().map((c) => c.name).filter((n) => ths.some((t) => t.company === n));
    const sel = new Set();
    if (S.theater && ths.some((t) => t.name === S.theater)) sel.add(S.theater);
    const ov = document.createElement('div');
    ov.className = 'kt-overlay'; ov.id = 'ktExport';
    ov.innerHTML = `<div class="kt-dialog kt-dialog-mid"><div class="kt-dlg-head">📊 劇場カルテを Excel で出す<button type="button" class="close-btn" data-act="x">×</button></div>
      <div class="kt-dlg-body">
        <p class="tm-hint">出したい会社・劇場にチェックを入れてください（いくつでも）。1つの劇場が1つの Excel になります（中は「カルテ」「機器表」「不具合の履歴」「連絡先」のシート）。2つ以上は ZIP にまとめます。</p>
        <div class="kt-ex-bar"><input type="search" class="tm-input" id="ktExQ" placeholder="🔍 劇場の名前で探す"><button type="button" data-act="all">全部選ぶ</button><button type="button" data-act="none">全部外す</button></div>
        <div class="kt-ex-list" id="ktExList"></div>
      </div>
      <div class="kt-dlg-foot"><span id="ktExN"></span><span id="ktExMsg" class="kt-ex-msg"></span><button type="button" class="primary" data-act="go">⬇ ダウンロード</button><button type="button" data-act="x">閉じる</button></div></div>`;
    document.body.appendChild(ov);
    const draw = () => {
      const q = norm(ov.querySelector('#ktExQ').value);
      ov.querySelector('#ktExList').innerHTML = cos.map((co) => {
        const list = ths.filter((t) => t.company === co && (!q || norm(t.name).includes(q)));
        if (!list.length) return '';
        const n = list.filter((t) => sel.has(t.name)).length;
        const open = q || n || co === defaultCompany;
        return `<details class="kt-ex-co"${open ? ' open' : ''}><summary><label><input type="checkbox" class="kt-ex-co-chk" data-co="${esc(co)}" ${n === list.length ? 'checked' : ''} ${n && n < list.length ? 'data-mixed="1"' : ''}> ${esc(co)}</label> <small>${n ? n + ' / ' : ''}${list.length} 劇場</small></summary>
          <div class="kt-ex-ths">${list.map((t) => `<label><input type="checkbox" class="kt-ex-th" value="${esc(t.name)}" ${sel.has(t.name) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('')}</div></details>`;
      }).join('');
      ov.querySelectorAll('.kt-ex-co-chk[data-mixed]').forEach((c) => { c.indeterminate = true; });
      ov.querySelector('#ktExN').textContent = sel.size ? `${sel.size} 劇場を選んでいます` : '劇場を選んでください';
    };
    draw();
    ov.querySelector('#ktExQ').addEventListener('input', draw);
    ov.addEventListener('change', (e) => {
      if (e.target.classList.contains('kt-ex-th')) { if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value); draw(); }
      if (e.target.classList.contains('kt-ex-co-chk')) {
        const q = norm(ov.querySelector('#ktExQ').value);
        ths.filter((t) => t.company === e.target.dataset.co && (!q || norm(t.name).includes(q))).forEach((t) => { if (e.target.checked) sel.add(t.name); else sel.delete(t.name); });
        draw();
      }
    });
    ov.addEventListener('click', async (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'x') closeOverlay();
      if (act === 'all') { const q = norm(ov.querySelector('#ktExQ').value); ths.filter((t) => !q || norm(t.name).includes(q)).forEach((t) => sel.add(t.name)); draw(); }
      if (act === 'none') { sel.clear(); draw(); }
      if (act === 'go') {
        if (!sel.size) { say('劇場を選んでください'); return; }
        e.target.disabled = true;
        const msg = ov.querySelector('#ktExMsg');
        try { await exportTheaters(Array.from(sel), (m) => { msg.textContent = m; }); msg.textContent = '✅ ダウンロードしました'; }
        catch (err) { msg.textContent = ''; say('Excel を作れませんでした: ' + (err.message || err)); }
        e.target.disabled = false;
      }
    });
  }
  const fileSafe = (s) => String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
  const ymd = () => isoDay(new Date()).replace(/-/g, '');
  async function exportTheaters(names, progress) {
    if (!window.XLSXW) throw new Error('Excel を作る部品（xlsx-lite.js）がありません');
    if (!checked) await api.probe();
    if (missing) throw new Error('劇場カルテの表がまだありません（SETUP_THEATER_KARTE.sql を実行してください）');
    progress && progress('データを集めています…');
    const [notes, equip, contacts] = await Promise.all([api.notes(names), api.equipment(names), api.contacts(names)]);
    const byTh = (arr) => { const m = {}; arr.forEach((x) => { (m[x.theater] = m[x.theater] || []).push(x); }); return m; };
    const N = byTh(notes), E = byTh(equip), C = byTh(contacts);
    const thInfo = {}; theaterList().forEach((t) => { thInfo[t.name] = t; });
    const files = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      progress && progress(`Excel を作っています… ${i + 1} / ${names.length}`);
      const blob = await buildBook(thInfo[name] || { name, company: '' }, N[name] || [], E[name] || [], casesOf(name), C[name] || []).blob();
      files.push({ name: `劇場カルテ_${fileSafe(call('shortTheater', name, name) || name)}_${ymd()}.xlsx`, blob });
    }
    if (files.length === 1) { download(files[0].blob, files[0].name); return; }
    progress && progress('ZIP にまとめています…');
    const zip = new JSZip();
    const used = {};
    files.forEach((f) => { let n = f.name; if (used[n]) n = n.replace(/\.xlsx$/, `_${++used[f.name]}.xlsx`); else used[n] = 1; zip.file(n, f.blob); });
    download(await zip.generateAsync({ type: 'blob' }), `劇場カルテ_${files.length}劇場_${ymd()}.zip`);
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  // 1劇場の Excel
  function buildBook(t, notes, equip, cases, contacts) {
    const wb = XLSXW.book();
    const H = { font: { b: true, color: 'FFFFFF' }, fill: '1F4E79', border: 'all', h: 'center', wrap: true };
    const SEC = { font: { b: true, sz: 11, color: '1F4E79' } };
    const L = { font: { b: true }, fill: 'DDEBF7', border: 'all', v: 'top' };
    const V = { border: 'all', wrap: true, v: 'top' };
    const VC = { border: 'all', h: 'center', v: 'top' };
    const out = isoDay(new Date()).replace(/-/g, '/');
    // ---- カルテ ----
    const k = wb.sheet('カルテ', { cols: [11, 78, 34, 12], selected: true, grid: false, tab: '1F4E79' });
    k.set('A1', { v: '劇場カルテ　' + t.name, st: { font: { b: true, sz: 14 } } }).merge('A1:D1').height(1, 26);
    k.set('A2', { v: `出力日 ${out}　菱熱工業`, st: { font: { color: '666666' } } }).merge('A2:D2');
    let r = 4;
    k.set('A' + r, { v: '■ 基本情報', st: SEC }); r++;
    const basics = [['会社', t.company], ['劇場', t.name], ['住所', t.address], ['支配人', t.manager], ['劇場の電話', t.theaterPhone], ['保守契約', t.maintenance], ['GeM2', t.gem2], ['GeM2 CO2センサー', t.gem2Co2], ['GeM2 温湿度センサー', t.gem2Th], ['ホームページ', t.homepage]].concat(t.closed ? [['閉館', ('閉館' + (t.closedOn ? '（' + t.closedOn + '）' : '') + (t.closedNote ? ' ' + t.closedNote : ''))]] : []);
    basics.forEach(([a, b]) => { k.set('A' + r, { v: a, st: L }); k.set('B' + r, { v: b || '', st: V }).merge(`B${r}:D${r}`); k.set('C' + r, { st: V }); k.set('D' + r, { st: V }); r++; });
    ['chronic', 'note', 'equipment'].forEach((kind) => {
      const list = notes.filter((n) => n.kind === kind).sort(sortNotes);
      r++;
      k.set('A' + r, { v: `■ ${KINDS[kind]}（${list.length}件）`, st: SEC }); r++;
      ['年月', '内容', '根拠（メール・資料）', '登録者'].forEach((h, i) => k.set([r, i], { v: h, st: H })); r++;
      if (!list.length) { k.set('A' + r, { v: '（なし）', st: V }).merge(`A${r}:D${r}`); ['B', 'C', 'D'].forEach((c) => k.set(c + r, { st: V })); r++; }
      list.forEach((n) => {
        k.set('A' + r, { v: n.source_date || '', st: VC });
        k.set('B' + r, { v: n.body || '', st: V });
        k.set('C' + r, { v: n.evidence || '', st: V });
        k.set('D' + r, { v: whoOf(n), st: VC });
        r++;
      });
    });
    // ---- 機器表 ----
    const e = wb.sheet('機器表', { cols: [5].concat(EQ_COLS.map((c) => Math.max(7, Math.round(c.w / 7)))).concat([8]), freeze: 'A4', landscape: true, tab: '2E75B6' });
    e.set('A1', { v: '機器表　' + t.name, st: { font: { b: true, sz: 13 } } });
    e.set('A2', { v: `出力日 ${out}　経過年数は開いた日の年から計算（10年以上=黄・15年以上=赤）`, st: { font: { color: '666666' } } });
    const eh = ['No'].concat(EQ_COLS.map((c) => c.label)).concat(['経過年数']);
    eh.forEach((h, i) => e.set([3, i], { v: h, st: H }));
    const list = equip.slice().sort(sortEquip);
    const yearCol = 1 + EQ_COLS.findIndex((c) => c.k === 'year');
    const L2 = (c) => String.fromCharCode(65 + c);
    list.forEach((row, i) => {
      const rr = 4 + i;
      e.set([rr, 0], { v: i + 1, st: VC });
      EQ_COLS.forEach((c, j) => {
        let v = row[c.k];
        if (c.k === 'year') { const m = /(\d{4})/.exec(String(v || '')); v = m ? Number(m[1]) : (v || ''); }
        e.set([rr, j + 1], { v: v == null ? '' : v, st: c.num || c.k === 'year' ? Object.assign({ fmt: c.int || c.k === 'year' ? '0' : '0.0' }, VC) : V });
      });
      const age = ageOf(row.year);
      const yc = L2(yearCol) + rr;
      e.set([rr, EQ_COLS.length + 1], { f: `IF(ISNUMBER(${yc}),YEAR(TODAY())-${yc},"")`, v: age == null ? '' : age, st: VC });
    });
    if (!list.length) e.set('A4', { v: '（機器表はまだありません）' });
    else {
      const ac = L2(EQ_COLS.length + 1), last = 3 + list.length;
      e.cf(`${ac}4:${ac}${last}`, [{ dxf: wb.dxf ? wb.dxf({ fill: 'F8CBAD', font: { b: true, color: '9C0006' } }) : 0, formula: `AND(ISNUMBER(${ac}4),${ac}4>=15)` }, { dxf: wb.dxf ? wb.dxf({ fill: 'FFEB9C', font: { color: '9C5700' } }) : 0, formula: `AND(ISNUMBER(${ac}4),${ac}4>=10)` }]);
    }
    // ---- 不具合の履歴 ----
    const c = wb.sheet('不具合の履歴', { cols: [11, 10, 56, 12, 11, 11, 10, 10], freeze: 'A4', landscape: true, tab: 'C00000' });
    c.set('A1', { v: '不具合の履歴（案件）　' + t.name, st: { font: { b: true, sz: 13 } } });
    c.set('A2', { v: `出力日 ${out}　このアプリに登録された案件（新しい順）`, st: { font: { color: '666666' } } });
    ['受付日', '種別', '内容', '状態', '調査日', '完了日', '客先担当', '菱熱担当'].forEach((h, i) => c.set([3, i], { v: h, st: H }));
    const cs = cases.slice().sort((a, b) => String(b.receivedDate || '').localeCompare(String(a.receivedDate || '')));
    cs.forEach((x, i) => {
      const rr = 4 + i;
      [jpDay(x.receivedDate), x.category, [x.estimateName, x.content].filter(Boolean).join('｜'), x.status, jpDay(x.surveyDate), jpDay(x.workEndDate), x.tcPerson, x.rPerson]
        .forEach((v, j) => c.set([rr, j], { v: v || '', st: j === 2 ? V : VC }));
    });
    if (!cs.length) c.set('A4', { v: '（案件はまだありません）' });
    // ---- 連絡先 ----
    const ct = wb.sheet('連絡先', { cols: [18, 12, 22, 12, 18, 26, 30], freeze: 'A4', landscape: true, tab: '70AD47' });
    ct.set('A1', { v: '連絡先　' + t.name, st: { font: { b: true, sz: 13 } } });
    ['区分（系統/工種）', 'メーカー', '担当業者', '担当者', '電話', 'メール', '備考'].forEach((h, i) => ct.set([3, i], { v: h, st: H }));
    contacts.forEach((x, i) => { [x.category, x.maker, x.vendor, x.person, x.phone, x.email, x.note].forEach((v, j) => ct.set([4 + i, j], { v: v || '', st: V })); });
    if (!contacts.length) ct.set('A4', { v: '（連絡先はまだありません）' });
    return wb;
  }

    /* ============================================================
     更新確認の承認（app.js から呼ぶ）
     ============================================================ */
  // field が 設備/持病/備考 の候補を劇場カルテの1件として入れる。戻り値: 入れた行（既に同じ文があれば null）
  async function noteFromPending(item, opts) {
    const kind = FIELD_TO_KIND[item.field];
    if (!kind) return null;
    if (!checked) await api.probe();
    if (missing) throw new Error('劇場カルテの表がありません');
    const body = String(item.value || '').trim();
    const cur = await api.notes([item.theater]);
    const key = norm(body).slice(0, 30);
    if (key && cur.some((n) => norm(n.body).includes(key))) return null;
    return api.insert('theater_notes', { company: item.company || '', theater: item.theater, kind, body, source_date: item.source_date || '', evidence: item.evidence || '', origin: (opts && opts.origin) || 'manual', pending_id: item.id || null, created_by: userName() });
  }
  async function noteRaw(row) {
    if (!checked) await api.probe();
    if (missing) throw new Error('劇場カルテの表がありません');
    return api.insert('theater_notes', Object.assign({ origin: 'manual', created_by: userName() }, row));
  }

  /* ============================================================
     画面の操作をまとめて受ける
     ============================================================ */
  document.addEventListener('click', (e) => {
    if (!S.box || !S.box.contains(e.target)) return;
    const tabBtn = e.target.closest('.kt-tab');
    if (tabBtn) { S.tab = tabBtn.dataset.tab; lsSet(LS.tab, S.tab); S.sel.clear(); S.filter = ''; S.editing = null; render(); return; }
    const sortTh = e.target.closest('th[data-sort]');
    if (sortTh && !e.target.closest('input')) {
      const k = sortTh.dataset.sort, tab = S.tab, cur = S.sort[tab] || {};
      S.sort[tab] = cur.k !== k ? { k, dir: 1 } : cur.dir > 0 ? { k, dir: -1 } : {};
      lsSet(LS_SORT, S.sort); render(); return;
    }
    const btn = e.target.closest('[data-act]');
    const caseRow = e.target.closest('.kt-case-row');
    if (!btn && caseRow) { call('openCase', null, caseRow.dataset.case); return; }
    if (!btn) return;
    const act = btn.dataset.act;
    const li = btn.closest('.kt-note'); const tr = btn.closest('tr'); const fileEl = btn.closest('.kt-file');
    if (act === 'add-note') addNote(btn.dataset.kind);
    else if (act === 'edit-note') { S.editing = li.dataset.id; render(); const ta = S.box.querySelector('.kt-edit-body'); if (ta) ta.focus(); }
    else if (act === 'cancel-edit') { S.editing = null; render(); }
    else if (act === 'save-note') saveNote(li);
    else if (act === 'del-note') delNotes([li.dataset.id]);
    else if (act === 'move-note') moveNotes([li.dataset.id]);
    else if (act === 'add-eq') addEqRow();
    else if (act === 'del-eq') delEq([tr.dataset.id]);
    else if (act === 'move-eq') moveEq([tr.dataset.id]);
    else if (act === 'eq-cols') { S.eqColsOpen = !S.eqColsOpen; render(); }
    else if (act === 'eq-cols-reset') { S.eqVis = EQ_DEFAULT.slice(); lsSet(LS_EQCOLS, S.eqVis); render(); }
    else if (act === 'open-file') { e.preventDefault(); openFile(fileEl.dataset.fid); }
    else if (act === 'del-file') delFile(fileEl.dataset.fid);
    else if (act === 'del-sel' || act === 'move-sel') {
      const ids = Array.from(S.sel).filter((id) => S.tab === 'machines' ? eqById(id) : noteById(id));
      if (S.tab === 'machines') { if (act === 'del-sel') delEq(ids); else moveEq(ids); }
      else { if (act === 'del-sel') delNotes(ids); else moveNotes(ids); }
    }
  });
  document.addEventListener('change', (e) => {
    if (!S.box || !S.box.contains(e.target)) return;
    if (e.target.classList.contains('kt-sel')) {
      const id = (e.target.closest('.kt-note') || e.target.closest('tr')).dataset.id;
      if (e.target.checked) S.sel.add(id); else S.sel.delete(id);
      updateSelBar(); return;
    }
    if (e.target.classList.contains('kt-sel-all')) {
      S.box.querySelectorAll('tbody .kt-sel').forEach((c) => { c.checked = e.target.checked; const id = c.closest('tr').dataset.id; if (e.target.checked) S.sel.add(id); else S.sel.delete(id); });
      updateSelBar(); return;
    }
    if (e.target.classList.contains('kt-eq-f')) { saveEqCell(e.target); return; }
    if (e.target.classList.contains('kt-eqcol')) {
      const k = e.target.value; S.eqVis = e.target.checked ? Array.from(new Set(S.eqVis.concat([k]))) : S.eqVis.filter((x) => x !== k);
      if (!S.eqVis.length) S.eqVis = EQ_DEFAULT.slice();
      lsSet(LS_EQCOLS, S.eqVis); render(); return;
    }
    if (e.target.id === 'ktEqFile') { const fl = Array.from(e.target.files || []); const inp = e.target; importEquipment(fl).catch((err) => { console.error(err); say('読み込めませんでした: ' + (err.message || err)); }).finally(() => { inp.value = ''; }); }
  });
  document.addEventListener('input', (e) => {
    if (!S.box || !S.box.contains(e.target)) return;
    if (e.target.classList.contains('kt-colf')) {
      const k = e.target.dataset.fk, tab = S.tab; S.colf[tab] = S.colf[tab] || {}; S.colf[tab][k] = e.target.value;
      const pos = e.target.selectionStart; render();
      const f = S.box.querySelector(`.kt-colf[data-fk="${k}"]`); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (err) {} }
      return;
    }
    if (e.target.id === 'ktFilter') {
      S.filter = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const f = $('ktFilter'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (err) {} }
      return;
    }
    if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('kt-grow')) grow(e.target);
  });
  document.addEventListener('dblclick', (e) => {
    if (!S.box || !S.box.contains(e.target)) return;
    const td = e.target.closest('tr.kt-note:not(.editing) td.kt-body, tr.kt-note:not(.editing) td.kt-date, tr.kt-note:not(.editing) td.kt-ev');
    if (!td) return;
    S.editing = td.closest('tr').dataset.id; render();
    const ta = S.box.querySelector('.kt-edit-body'); if (ta) ta.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (!S.box || !S.box.contains(e.target)) return;
    if (e.target.id === 'ktNewBody' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const b = S.box.querySelector('[data-act="add-note"]'); if (b) b.click(); }
  });
  function updateSelBar() {
    const bar = S.box.querySelector('.kt-bar-sel'); if (!bar) return;
    const n = Array.from(S.sel).filter((id) => S.tab === 'machines' ? eqById(id) : noteById(id)).length;
    bar.classList.toggle('hidden', !n);
    bar.firstChild.textContent = `選んだ ${n} ${S.tab === 'machines' ? '行' : '件'}を `;
  }

  window.KARTE = { show, hide, available, ready, ask, say, openExport, exportTheaters, moveContact, noteFromPending, noteRaw, probe: () => api.probe(), _state: S };
})();
