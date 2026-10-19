"use strict";
/* ============================================================
   書類棚（工程表・工事写真台帳の置き場）
   ・PCのフォルダと同じ形: 左に「会社 › 劇場」（書類を作ると自動でできる）＋劇場の中に自分で作るフォルダ
   ・右にその場所の書類。開く・新しく作る・名前を変える・複製・フォルダへ移動・削除（ごみ箱に30日）
   ・保存は Excel と同じ「上書き保存」「名前を付けて新規に保存」の2つだけ。
     押すまで保存されない。押し忘れに備えて、保存前の内容はこの端末に一時的に残し、次に開いた時に「復元しますか？」と聞く
   ・工事写真台帳: A4縦・1ページ3枚（いただいた書式どおり）＋表紙。撮影日（写真から自動）・工種で並べ替え
   ・保存先: Supabase（koutei / photo_ledgers / doc_folders / Storage ledger-photos）。?local=1 の時は localStorage
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DB = () => window.CINEMA_DB || {};
  const call = (fn, dflt) => { try { const f = DB()[fn]; return f ? f() : dflt; } catch (e) { return dflt; } };
  const sbc = () => (DB().mode && DB().mode() === 'supabase') ? DB().client() : null;
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pad = (n) => String(n).padStart(2, '0');
  const isoDay = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => isoDay(new Date());
  const jpDay = (s) => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return y + '/' + m + '/' + d; };
  const fmtUpdated = (s) => { if (!s) return ''; const d = new Date(s); if (isNaN(d)) return ''; return isoDay(d).replace(/-/g, '/') + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const hhmm = (s) => { const d = new Date(s || Date.now()); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const TYPES = { kotei: { table: 'koutei', label: '工程表', icon: '📊' }, photo: { table: 'photo_ledgers', label: '写真台帳', icon: '📷' }, heat: { table: 'heat_loads', label: '空調負荷計算', icon: '❄' } };
  const DEFAULT_NAME = { kotei: '工程表', photo: '工事写真台帳', heat: '空調負荷計算' };
  const TRASH_DAYS = 30;
  const UNSET = '（劇場未設定）';
  const BUCKET = 'ledger-photos';

  /* ============================================================
     保存先（Supabase / ローカル）
     ============================================================ */
  const LS_DOCS = 'shelfDocsV1', LS_FOLDERS = 'shelfFoldersV1', LS_MIGRATED = 'shelfMigratedV1';
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  let setupMissing = { kotei: false, photo: false, heat: false, folders: false };   // SETUP_SHELF.sql 未実行の時の印

  function migrateLocalOnce() {
    if (lsGet(LS_MIGRATED, false)) return;
    const old = lsGet('koutei_docs_v1', {});
    const all = lsGet(LS_DOCS, {});
    Object.keys(old).forEach((id) => {
      if (all[id]) return;
      all[id] = { id, type: 'kotei', name: old[id].name || '工程表', company: '', theater: '', folder_id: null, case_id: null, data: old[id].data || {}, updated_at: new Date().toISOString(), updated_by_name: '', deleted_at: null };
    });
    lsSet(LS_DOCS, all); lsSet(LS_MIGRATED, true);
  }
  const rowOf = (type, r) => ({
    id: r.id, type, name: r.name || DEFAULT_NAME[type], company: r.company || '', theater: r.theater || '', is_basis: !!r.is_basis,
    folder_id: r.folder_id || null, case_id: r.case_id || null, data: r.data || {}, updated_at: r.updated_at || '',
    updated_by_name: r.updated_by_name || '', deleted_at: r.deleted_at || null
  });
  const api = {
    async list() {
      const sb = sbc();
      if (!sb) { migrateLocalOnce(); const all = lsGet(LS_DOCS, {}); return Object.keys(all).map((k) => rowOf(all[k].type, all[k])); }
      const out = [];
      for (const type of ['kotei', 'photo', 'heat']) {
        let res = await sb.from(TYPES[type].table).select('id,name,company,theater,folder_id,case_id,data,updated_at,updated_by_name,deleted_at' + (type === 'heat' ? ',is_basis' : ''));
        if (res.error && type === 'kotei') {   // 列がまだ無い（SQL未実行）→ 今までの列だけで読む
          setupMissing.kotei = true;
          res = await sb.from('koutei').select('id,name,data,updated_at');
        } else if (type === 'kotei') setupMissing.kotei = false;
        if (res.error) { if (type === 'photo' || type === 'heat') { setupMissing[type] = true; continue; } throw res.error; }
        if (type === 'photo' || type === 'heat') setupMissing[type] = false;
        (res.data || []).forEach((r) => out.push(rowOf(type, r)));
      }
      return out;
    },
    async get(type, id) {
      const sb = sbc();
      if (!sb) { const r = lsGet(LS_DOCS, {})[id]; return r ? rowOf(type, r) : null; }
      const cols = (type === 'kotei' && setupMissing.kotei) ? 'id,name,data,updated_at' : '*';
      const { data, error } = await sb.from(TYPES[type].table).select(cols).eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? rowOf(type, data) : null;
    },
    async stamp(type, id) {   // 最後に保存された時刻だけ読む（他の人が先に保存していないかの確認）
      const sb = sbc();
      if (!sb) { const r = lsGet(LS_DOCS, {})[id]; return r ? r.updated_at : null; }
      const { data, error } = await sb.from(TYPES[type].table).select('updated_at').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? data.updated_at : null;
    },
    cols(type, row) {
      const o = { name: row.name, data: row.data };
      if (!(type === 'kotei' && setupMissing.kotei)) Object.assign(o, { company: row.company || '', theater: row.theater || '', folder_id: row.folder_id || null, case_id: row.case_id || null, updated_by_name: row.updated_by_name || '', deleted_at: row.deleted_at || null });
      return o;
    },
    async insert(type, row) {
      const sb = sbc();
      row = Object.assign({ company: '', theater: '', folder_id: null, case_id: null, deleted_at: null }, row, { updated_by_name: userName() });
      if (!sb) {
        const all = lsGet(LS_DOCS, {}); const id = uuid();
        all[id] = Object.assign({}, row, { id, type, updated_at: new Date().toISOString() });
        if (!lsSet(LS_DOCS, all)) throw new Error('この端末の保存領域がいっぱいです');
        return rowOf(type, all[id]);
      }
      const { data, error } = await sb.from(TYPES[type].table).insert(api.cols(type, row)).select('*').single();
      if (error) throw error;
      return rowOf(type, data);
    },
    async update(type, id, patch) {
      const sb = sbc();
      patch = Object.assign({}, patch);
      if (!('deleted_at' in patch) || patch.name || patch.data) patch.updated_by_name = userName();
      if (!sb) {
        const all = lsGet(LS_DOCS, {}); if (!all[id]) throw new Error('書類が見つかりません（削除された可能性があります）');
        Object.assign(all[id], patch, { updated_at: new Date().toISOString() });
        if (!lsSet(LS_DOCS, all)) throw new Error('この端末の保存領域がいっぱいです');
        return rowOf(type, all[id]);
      }
      if (type === 'kotei' && setupMissing.kotei) ['company', 'theater', 'folder_id', 'case_id', 'updated_by_name', 'deleted_at'].forEach((k) => delete patch[k]);
      const { data, error } = await sb.from(TYPES[type].table).update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return rowOf(type, data);
    },
    async remove(type, id) {
      const sb = sbc();
      if (!sb) { const all = lsGet(LS_DOCS, {}); delete all[id]; lsSet(LS_DOCS, all); return; }
      const { error } = await sb.from(TYPES[type].table).delete().eq('id', id);
      if (error) throw error;
    },
    async folders() {
      const sb = sbc();
      if (!sb) return lsGet(LS_FOLDERS, []);
      const { data, error } = await sb.from('doc_folders').select('id,company,theater,name').order('created_at');
      if (error) { setupMissing.folders = true; return []; }
      setupMissing.folders = false;
      return data || [];
    },
    async addFolder(f) {
      const sb = sbc();
      if (!sb) { const l = lsGet(LS_FOLDERS, []); const nf = Object.assign({ id: uuid() }, f); l.push(nf); lsSet(LS_FOLDERS, l); return nf; }
      const { data, error } = await sb.from('doc_folders').insert(f).select('id,company,theater,name').single();
      if (error) throw error;
      return data;
    },
    async renameFolder(id, name) {
      const sb = sbc();
      if (!sb) { const l = lsGet(LS_FOLDERS, []); const f = l.find((x) => x.id === id); if (f) f.name = name; lsSet(LS_FOLDERS, l); return; }
      const { error } = await sb.from('doc_folders').update({ name }).eq('id', id);
      if (error) throw error;
    },
    async deleteFolder(id) {
      const sb = sbc();
      if (!sb) { lsSet(LS_FOLDERS, lsGet(LS_FOLDERS, []).filter((x) => x.id !== id)); return; }
      const { error } = await sb.from('doc_folders').delete().eq('id', id);
      if (error) throw error;
    },
    // 写真: Supabase は Storage に置いて置き場所(パス)を返す。ローカルは画像そのもの(data URL)を返す
    async putPhoto(blob, dataUrl) {
      const sb = sbc();
      if (!sb) return dataUrl;
      const d = new Date();
      const path = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + uuid() + '.jpg';
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      return path;
    },
    async photoUrls(refs) {
      const out = {}; const sb = sbc();
      const need = refs.filter((r) => r && !/^data:|^blob:|^https?:/.test(r));
      refs.forEach((r) => { if (r && /^data:|^blob:|^https?:/.test(r)) out[r] = r; });
      if (!sb || !need.length) return out;
      for (let i = 0; i < need.length; i += 100) {
        const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(need.slice(i, i + 100), 60 * 60 * 6);
        if (error) throw error;
        (data || []).forEach((x) => { if (x.signedUrl) out[x.path] = x.signedUrl; });
      }
      return out;
    }
  };

  // 誰が更新したか（メールの@より前から、チームの名前に置き換える）
  const ROMAJI = { koyama: '小山', hosogaya: '細萱', yamato: '大和', yamaguchi: '山口', kaneko: '金子', wakayama: '若山', ito: '伊藤', itou: '伊藤', fujimura: '藤村', yamamoto: '山本' };
  function userName() {
    const em = String(call('userEmail', '') || '');
    const local = em.split('@')[0].toLowerCase();
    const hit = Object.keys(ROMAJI).sort((a, b) => b.length - a.length).find((k) => local.indexOf(k) === 0 || local.split(/[._-]/).indexOf(k) >= 0);
    return hit ? ROMAJI[hit] : local;
  }

  /* ============================================================
     書類棚の状態
     ============================================================ */
  const S = {
    rows: [], folders: [], loaded: false,
    loc: { kind: 'recent' },   // {kind:'recent'|'trash'|'unset'} または {kind:'place', co, th, folder}
    filter: 'all', q: '', sel: '', open: {}, treeOpen: false,
    cur: null                  // 開いている書類 { type, row, dirty, loadedStamp }
  };
  const SEL_LS = 'shelfLocV1';
  const live = () => S.rows.filter((r) => !r.deleted_at);
  function companyNames() {
    const set = [];
    (call('companies', []) || []).forEach((c) => { if (c && c.name && set.indexOf(c.name) < 0) set.push(c.name); });
    S.rows.concat(S.folders).forEach((r) => { if (r.company && set.indexOf(r.company) < 0) set.push(r.company); });
    return set;
  }
  const theaterLabel = (co, th) => {
    if (!th) return UNSET;
    const f = DB().shortTheater; let s = th;
    try { if (f) s = f(th) || th; } catch (e) {}
    return s;
  };
  function theatersOf(co) {
    const out = [];
    live().concat(S.folders).forEach((r) => { if (r.company === co && r.theater && out.indexOf(r.theater) < 0) out.push(r.theater); });
    // 開いている劇場は、書類が0件になっても残す（消すと左の欄がずれて押し間違えるため）
    if (S.loc.kind === 'place' && S.loc.co === co && S.loc.th && out.indexOf(S.loc.th) < 0) out.push(S.loc.th);
    return out.sort((a, b) => theaterLabel(co, a).localeCompare(theaterLabel(co, b), 'ja'));
  }
  function masterTheaters(co) {
    const out = [];
    (call('theaters', []) || []).forEach((t) => { if (t && t.name && (!co || t.company === co) && out.indexOf(t.name) < 0) out.push(t.name); });
    return out;
  }
  const folderName = (id) => { const f = S.folders.find((x) => x.id === id); return f ? f.name : ''; };

  async function reload() {
    const [rows, folders] = await Promise.all([api.list(), api.folders()]);
    S.rows = rows; S.folders = folders; S.loaded = true;
    // ごみ箱に入れてから30日たったものは完全に削除
    const limit = Date.now() - TRASH_DAYS * 86400000;
    const old = S.rows.filter((r) => r.deleted_at && new Date(r.deleted_at).getTime() < limit);
    for (const r of old) { try { await api.remove(r.type, r.id); S.rows = S.rows.filter((x) => x !== r); } catch (e) { /* 次回 */ } }
  }

  /* ============================================================
     書類棚の描画
     ============================================================ */
  function inLoc(r) {
    const l = S.loc;
    if (l.kind === 'trash') return !!r.deleted_at;
    if (r.deleted_at) return false;
    if (l.kind === 'recent') return true;
    if (l.kind === 'unset') return !r.company || !r.theater;
    if (r.company !== l.co) return false;
    if (!l.th) return true;
    if (r.theater !== l.th) return false;
    return l.folder ? r.folder_id === l.folder : !r.folder_id || !S.folders.some((f) => f.id === r.folder_id);
  }
  function renderTree() {
    const l = S.loc;
    const cnt = (fn) => live().filter(fn).length;
    const nUnset = cnt((r) => !r.company || !r.theater);
    const nTrash = S.rows.filter((r) => r.deleted_at).length;
    let h = `<div class="sh-th">すばやく開く</div>
      <button type="button" class="sh-tn${l.kind === 'recent' ? ' on' : ''}" data-loc="recent"><span class="tw"></span>🕘 最近使った</button>
      <div class="sh-th">会社 › 劇場</div>`;
    companyNames().forEach((co) => {
      const n = cnt((r) => r.company === co && r.theater);
      const ths = theatersOf(co);
      const open = !!S.open[co];
      h += `<button type="button" class="sh-tn${l.kind === 'place' && l.co === co && !l.th ? ' on' : ''}" data-co="${esc(co)}"><span class="tw" data-tog="${esc(co)}" aria-label="${open ? '閉じる' : '開く'}">${ths.length ? (open ? '▼' : '▶') : ''}</span>📁 ${esc(co)}<span class="ct">${n || ''}</span></button>`;
      if (!open) return;
      ths.forEach((th) => {
        const nt = cnt((r) => r.company === co && r.theater === th);
        const on = l.kind === 'place' && l.co === co && l.th === th && !l.folder;
        h += `<button type="button" class="sh-tn lv2${on ? ' on' : ''}" data-co="${esc(co)}" data-th="${esc(th)}"><span class="tw"></span>📁 ${esc(theaterLabel(co, th))}<span class="ct">${nt || ''}</span></button>`;
        S.folders.filter((f) => f.company === co && f.theater === th).forEach((f) => {
          const nf = cnt((r) => r.folder_id === f.id);
          h += `<button type="button" class="sh-tn lv3${l.kind === 'place' && l.folder === f.id ? ' on' : ''}" data-co="${esc(co)}" data-th="${esc(th)}" data-folder="${esc(f.id)}"><span class="tw"></span>🗂 ${esc(f.name)}<span class="ct">${nf || ''}</span></button>`;
        });
        // フォルダを作るボタンは、開いている劇場のすぐ下に出す（一番下だと、ごみ箱の近くで位置が変わりやすい）
        if (l.kind === 'place' && l.co === co && l.th === th && !setupMissing.folders) h += `<button type="button" class="sh-tn lv3 sh-addf" data-act="newfolder"><span class="tw"></span>＋ ここにフォルダを作る</button>`;
      });
    });
    if (nUnset) h += `<button type="button" class="sh-tn${l.kind === 'unset' ? ' on' : ''}" data-loc="unset"><span class="tw"></span>❔ ${UNSET}<span class="ct">${nUnset}</span></button>`;
    h += `<div class="sh-th">　</div><button type="button" class="sh-tn${l.kind === 'trash' ? ' on' : ''}" data-loc="trash"><span class="tw"></span>🗑 ごみ箱<span class="ct">${nTrash || ''}</span></button>`;
    $('shTree').innerHTML = h;
  }
  function renderCrumb() {
    const l = S.loc; let h;
    if (l.kind === 'recent') h = '<span class="cur">🕘 最近使った</span>';
    else if (l.kind === 'trash') h = '<span class="cur">🗑 ごみ箱</span><span class="sh-note">（削除してから30日で完全に消えます）</span>';
    else if (l.kind === 'unset') h = `<span class="cur">❔ ${UNSET}</span><span class="sh-note">（「⋯」の「フォルダへ移動」で劇場を決められます）</span>`;
    else {
      h = `<button type="button" data-go="co">${esc(l.co)}</button>`;
      if (l.th) h += `<span class="sep">›</span><button type="button" data-go="th">${esc(theaterLabel(l.co, l.th))}</button>`;
      if (l.folder) h += `<span class="sep">›</span><span class="cur">🗂 ${esc(folderName(l.folder))}</span>`;
    }
    $('shCrumb').innerHTML = h;
  }
  function listRows() {
    let list = S.rows.filter(inLoc);
    if (S.filter !== 'all') list = list.filter((r) => r.type === S.filter);
    if (S.q) { const q = S.q.toLowerCase(); list = list.filter((r) => (r.name + ' ' + r.company + ' ' + r.theater).toLowerCase().indexOf(q) >= 0); }
    list.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    if (S.loc.kind === 'recent' && !S.q) list = list.slice(0, 12);
    return list;
  }
  function subOf(r) {
    if (r.type === 'kotei') { try { return window.KOTEI.summary(r.data); } catch (e) { return ''; } }
    if (r.type === 'heat') { try { return window.HL.summary(r.data); } catch (e) { return ''; } }
    const n = ((r.data && r.data.items) || []).length;
    return '写真 ' + n + ' 枚';
  }
  function renderList() {
    const l = S.loc, rows = listRows();
    let h = '';
    if (setupMissing.kotei || setupMissing.photo) h += `<div class="sh-warn">⚠ データベースの準備がまだです（SETUP_SHELF.sql を Supabase で1回実行してください）。${setupMissing.photo ? '写真台帳はまだ使えません。' : ''}${setupMissing.kotei ? '工程表は今までどおり開けますが、フォルダ分けはまだできません。' : ''}</div>`;
    if (setupMissing.heat && S.filter === 'heat') h += `<div class="sh-warn">⚠ 空調負荷計算のデータベースの準備がまだです（SETUP_HEATLOAD.sql を Supabase で1回実行してください）。</div>`;
    let body = '';
    // 会社を選んでいる時は劇場のフォルダ、劇場を選んでいる時は自分で作ったフォルダを先に並べる
    if (l.kind === 'place' && !l.th && !S.q) theatersOf(l.co).forEach((th) => {
      const n = live().filter((r) => r.company === l.co && r.theater === th).length;
      body += `<tr class="sh-frow" data-into-th="${esc(th)}"><td class="ic">📁</td><td><div class="nm">${esc(theaterLabel(l.co, th))}</div><div class="sub">劇場のフォルダ</div></td><td><span class="sh-kind f">フォルダ</span></td><td class="sub">${n} 件</td><td></td><td class="ra"></td></tr>`;
    });
    if (l.kind === 'place' && l.th && !l.folder && !S.q) S.folders.filter((f) => f.company === l.co && f.theater === l.th).forEach((f) => {
      const n = live().filter((r) => r.folder_id === f.id).length;
      body += `<tr class="sh-frow" data-into-folder="${esc(f.id)}"><td class="ic">🗂</td><td><div class="nm">${esc(f.name)}</div><div class="sub">自分で作ったフォルダ</div></td><td><span class="sh-kind f">フォルダ</span></td><td class="sub">${n} 件</td><td></td><td class="ra"><button type="button" class="sh-mini" data-fmenu="${esc(f.id)}" aria-label="フォルダの操作">⋯</button></td></tr>`;
    });
    rows.forEach((r) => {
      const where = (l.kind !== 'place' || !l.th || S.q) ? `<div class="sub">${esc(r.company ? r.company + ' › ' + theaterLabel(r.company, r.theater) : UNSET)}${r.folder_id && folderName(r.folder_id) ? ' › 🗂 ' + esc(folderName(r.folder_id)) : ''}</div>` : '';
      const actions = l.kind === 'trash'
        ? `<button type="button" class="sh-mini" data-restore="${esc(r.id)}">元に戻す</button> <button type="button" class="sh-mini danger" data-purge="${esc(r.id)}">完全に削除</button>`
        : `<button type="button" class="sh-mini pri" data-openid="${esc(r.id)}">開く</button> <button type="button" class="sh-mini" data-dmenu="${esc(r.id)}" aria-label="ほかの操作">⋯</button>`;
      body += `<tr class="sh-drow${S.sel === r.id ? ' sel' : ''}" data-doc="${esc(r.id)}">
        <td class="ic">${TYPES[r.type].icon}</td>
        <td><div class="nm">${esc(r.name)}${r.type === 'heat' && r.is_basis ? ' <span class="sh-pin" title="この劇場の正式な計算書（劇場情報の基）">📌 劇場情報の基</span>' : ''}</div><div class="sub">${esc(subOf(r))}</div>${where}</td>
        <td><span class="sh-kind ${r.type === 'kotei' ? 'k' : r.type === 'heat' ? 'h' : 'p'}">${TYPES[r.type].label}</span></td>
        <td class="sub">${l.kind === 'trash' ? '削除 ' + esc(fmtUpdated(r.deleted_at)) : esc(fmtUpdated(r.updated_at))}</td>
        <td class="sub">${esc(r.updated_by_name || '')}</td>
        <td class="ra">${actions}</td></tr>`;
    });
    if (body) h += `<table class="sh-table"><thead><tr><th></th><th>名前</th><th>種類</th><th>${l.kind === 'trash' ? '削除した日' : '更新'}</th><th>更新した人</th><th></th></tr></thead><tbody>${body}</tbody></table>`;
    else h += `<div class="sh-empty">${l.kind === 'trash' ? 'ごみ箱は空です。' : S.q ? '見つかりませんでした。' : 'この場所にはまだ書類がありません。<br>右上の「＋ 新しく作る」から作れます。'}</div>`;
    $('shList').innerHTML = h;
  }
  function renderShelf() {
    renderTree(); renderCrumb(); renderList();
    document.querySelectorAll('#shFilter [data-filter]').forEach((b) => b.classList.toggle('on', b.dataset.filter === S.filter));
    $('viewShelf').classList.toggle('tree-open', S.treeOpen);
    try { localStorage.setItem(SEL_LS, JSON.stringify(S.loc)); } catch (e) {}
  }
  function goPlace(co, th, folder) { S.loc = { kind: 'place', co, th: th || '', folder: folder || '' }; if (co) S.open[co] = true; S.sel = ''; S.treeOpen = false; renderShelf(); }

  /* ============================================================
     小窓（ダイアログ）・メニュー・お知らせ
     ============================================================ */
  let dlgKeyHandler = null;
  function openDlg(html, onKey) {
    $('shDlg').innerHTML = html;
    $('shDlgBg').classList.remove('hidden');
    dlgKeyHandler = onKey || null;
    setTimeout(() => { const f = $('shDlg').querySelector('[autofocus],input,select,button.pri'); if (f) { f.focus(); if (f.select) f.select(); } }, 0);
  }
  function closeDlg() { $('shDlgBg').classList.add('hidden'); $('shDlg').innerHTML = ''; dlgKeyHandler = null; }
  const dlgOpen = () => !$('shDlgBg').classList.contains('hidden');
  document.addEventListener('keydown', (e) => {
    if (!dlgOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDlg(); return; }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && dlgKeyHandler) { e.preventDefault(); dlgKeyHandler('enter'); }
  }, true);
  $('shDlgBg').addEventListener('pointerdown', (e) => { if (e.target === $('shDlgBg')) closeDlg(); });

  function openMenu(anchor, html) {
    const m = $('shMenu'); m.innerHTML = html; m.classList.remove('hidden');
    const r = anchor.getBoundingClientRect(), w = m.offsetWidth || 220, hgt = m.offsetHeight || 200;
    m.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
    m.style.top = (r.bottom + hgt + 8 > window.innerHeight ? Math.max(8, r.top - hgt - 4) : r.bottom + 4) + 'px';
  }
  const closeMenu = () => $('shMenu').classList.add('hidden');
  document.addEventListener('pointerdown', (e) => { if (!$('shMenu').classList.contains('hidden') && !e.target.closest('#shMenu') && !e.target.closest('[data-dmenu],[data-fmenu]')) closeMenu(); }, true);

  let toastTimer = null;
  function toast(msg, btn) {
    const t = $('shToast'); t.innerHTML = ''; t.appendChild(document.createTextNode(msg));
    if (btn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = btn.label; b.addEventListener('click', () => { t.classList.add('hidden'); btn.fn(); }); t.appendChild(b); }
    t.classList.remove('hidden'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), btn ? 7000 : 2600);
  }
  const fail = (what, e) => { console.error(what, e); alert(what + 'に失敗しました：' + ((e && e.message) || e)); };

  // 会社・劇場・フォルダを選ぶ欄（新しく作る・移動・名前を付けて保存で共通）
  function placeFields(p) {
    const cos = companyNames();
    if (p.co && cos.indexOf(p.co) < 0) cos.push(p.co);
    const ths = masterTheaters(p.co).concat(theatersOf(p.co)).filter((v, i, a) => a.indexOf(v) === i);
    const fs = S.folders.filter((f) => f.company === p.co && f.theater === p.th);
    return `<div class="sh-row2">
        <div class="sh-f"><label for="pfCo">会社</label><select id="pfCo"><option value="">（選ばない）</option>${cos.map((c) => `<option${c === p.co ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="sh-f"><label for="pfTh">劇場（ここのフォルダに入ります）</label><input id="pfTh" list="pfThList" value="${esc(p.th || '')}" placeholder="劇場名を選ぶか入力"><datalist id="pfThList">${ths.map((t) => `<option value="${esc(t)}">`).join('')}</datalist></div>
      </div>
      ${fs.length && !setupMissing.folders ? `<div class="sh-f"><label for="pfFolder">フォルダ</label><select id="pfFolder"><option value="">📁 劇場のフォルダ（自分で作ったフォルダに入れない）</option>${fs.map((f) => `<option value="${esc(f.id)}"${p.folder === f.id ? ' selected' : ''}>🗂 ${esc(f.name)}</option>`).join('')}</select></div>` : ''}`;
  }
  function readPlace(p) {
    const co = $('pfCo') ? $('pfCo').value : p.co, th = $('pfTh') ? $('pfTh').value.trim() : p.th;
    const folder = $('pfFolder') ? $('pfFolder').value : '';
    return { co, th, folder: (S.folders.find((f) => f.id === folder && f.company === co && f.theater === th) ? folder : '') };
  }
  // 会社・劇場を変えたら、劇場の候補・フォルダの欄を作り直す（入力中の値は残す）
  function bindPlace(p, rerender) {
    const co = $('pfCo'), th = $('pfTh');
    if (co) co.addEventListener('change', () => { Object.assign(p, readPlace(p), { co: co.value, th: '', folder: '' }); rerender(); });
    if (th) th.addEventListener('change', () => { Object.assign(p, readPlace(p)); rerender(); });
  }

  /* ---------- 新しく作る ---------- */
  function caseList(co, th) {
    return (call('cases', []) || []).filter((c) => (!co || c.company === co) && (!th || c.theater === th));
  }
  const workOf = (c) => String(c.estimateName || c.content || '').split('\n')[0].trim().slice(0, 40);
  const SUFFIX = { kotei: ' 工程表', photo: ' 写真台帳', heat: ' 空調負荷計算' };
  function newDialog(p) {
    p = Object.assign({ type: 'kotei', co: '', th: '', folder: '', caseId: '', name: '', kind: 'date', start: today(), copyFrom: '', hk: '' }, p);
    const render = () => {
      const cs = caseList(p.co, p.th).slice(0, 80);
      const kdocs = live().filter((r) => r.type === 'kotei').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      openDlg(`<h3>新しく作る</h3><div class="sh-dlg-b">
        <div class="sh-f"><label>作るもの</label><div class="sh-seg"><button type="button" class="${p.type === 'kotei' ? 'on' : ''}" data-ntype="kotei">📊 工程表</button><button type="button" class="${p.type === 'photo' ? 'on' : ''}" data-ntype="photo"${setupMissing.photo ? ' disabled title="データベースの準備（SETUP_SHELF.sql）がまだです"' : ''}>📷 工事写真台帳</button><button type="button" class="${p.type === 'heat' ? 'on' : ''}" data-ntype="heat"${setupMissing.heat || !window.HL ? ' disabled title="データベースの準備（SETUP_HEATLOAD.sql）がまだです"' : ''}>❄ 空調負荷計算</button></div></div>
        ${p.type === 'heat' ? `<div class="sh-f"><label>何を計算しますか？</label><div class="sh-seg sh-seg2"><button type="button" class="${p.hk === 'theater' ? 'on' : ''}" data-nhk="theater">🎬 シアター<small>機器表とホームページの座席数で</small></button><button type="button" class="${p.hk === 'other' ? 'on' : ''}" data-nhk="other">🏢 シアター以外<small>ロビー・売店・事務所など（図面で）</small></button></div></div>` : ''}
        ${placeFields(p)}
        <div class="sh-f"><label for="nCase">案件から作る（工事名などが自動で入ります）</label><select id="nCase"><option value="">案件を選ばない</option>${cs.map((c) => `<option value="${esc(c.id)}"${String(p.caseId) === String(c.id) ? ' selected' : ''}>${esc(theaterLabel(c.company, c.theater))}　${esc(workOf(c) || '（見積り名なし）')}</option>`).join('')}</select>${p.th ? '' : '<p class="sh-hint">劇場を選ぶと、その劇場の案件にしぼれます。</p>'}</div>
        <div class="sh-f"><label for="nName">名前</label><input id="nName" value="${esc(p.name)}" placeholder="${p.type === 'kotei' ? '例：SCR3 空調機更新 工程表' : p.type === 'heat' ? (p.hk === 'theater' ? '例：シアター 冷房能力の確認' : '例：2F ロビー・売店 空調負荷計算') : '例：コンセッション環境改善工事 写真台帳'}"></div>
        ${p.type === 'kotei' ? `<div class="sh-row2"><div class="sh-f"><label for="nKind">種類</label><select id="nKind"><option value="date"${p.kind === 'date' ? ' selected' : ''}>通常（日付）</option><option value="zero"${p.kind === 'zero' ? ' selected' : ''}>ゼロ工程表（1日目〜）</option><option value="master-week"${p.kind === 'master-week' ? ' selected' : ''}>マスター工程（週）</option><option value="master-month"${p.kind === 'master-month' ? ' selected' : ''}>マスター工程（月）</option></select></div>
          <div class="sh-f"><label for="nStart">着工日</label><input id="nStart" type="date" value="${esc(p.start)}"></div></div>
          <div class="sh-f"><label for="nCopy">もとにする工程表</label><select id="nCopy"><option value="">空から作る（標準の作業が並びます）</option>${kdocs.map((r) => `<option value="${esc(r.id)}"${p.copyFrom === r.id ? ' selected' : ''}>コピー：${esc(r.name)}</option>`).join('')}</select></div>` : ''}
      </div><div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri" data-dlg="ok">作って開く</button></div>`, () => create());
      const keep = () => { Object.assign(p, readPlace(p)); p.name = $('nName').value; if ($('nKind')) p.kind = $('nKind').value; if ($('nStart')) p.start = $('nStart').value; if ($('nCopy')) p.copyFrom = $('nCopy').value; };
      bindPlace(p, () => { p.name = $('nName') ? $('nName').value : p.name; render(); });
      $('shDlg').querySelectorAll('[data-ntype]').forEach((b) => b.addEventListener('click', () => { keep(); p.type = b.dataset.ntype; render(); }));
      $('shDlg').querySelectorAll('[data-nhk]').forEach((b) => b.addEventListener('click', () => { keep(); p.hk = b.dataset.nhk; render(); }));
      $('nCase').addEventListener('change', () => {
        keep(); p.caseId = $('nCase').value;
        const c = caseList('', '').find((x) => String(x.id) === String(p.caseId));
        if (c) { p.co = c.company || p.co; p.th = c.theater || p.th; p.name = (workOf(c) || theaterLabel(c.company, c.theater)) + SUFFIX[p.type]; }
        render();
      });
      $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
      $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', () => { keep(); create(); });
    };
    let busy = false;
    const create = async () => {
      if (busy) return;
      if ($('nName')) Object.assign(p, readPlace(p), { name: $('nName').value });
      if ($('nKind')) { p.kind = $('nKind').value; p.start = $('nStart').value || today(); p.copyFrom = $('nCopy').value; }
      const c = caseList('', '').find((x) => String(x.id) === String(p.caseId));
      if (p.type === 'heat' && !p.hk) { alert('「シアター」か「シアター以外」かを選んでください'); return; }
      const name = (p.name || '').trim() || (p.type === 'kotei' ? '新しい工程表' : p.type === 'heat' ? (p.hk === 'theater' ? 'シアター 空調負荷計算' : '空調負荷計算') : '新しい写真台帳');
      let data;
      if (p.type === 'kotei') {
        const K = window.KOTEI; let base = null;
        if (p.copyFrom) { const src = await api.get('kotei', p.copyFrom).catch(() => null); if (src) base = K.normalize(src.data); }
        data = base ? Object.assign(base, { title: name, start: p.start }) : K.defaultState({ title: name, start: p.start, content: c ? workOf(c) : '', client: p.co || '', author: userName() });
        if (p.kind.indexOf('master') === 0) { data.kind = 'master'; data.unit = p.kind === 'master-month' ? 'month' : 'week'; if (!base) data.days = 12; data.bars.forEach((b) => { b.night = false; }); } else data.kind = p.kind;
      } else if (p.type === 'heat') {
        data = window.HL.newData({ kind: p.hk, theater: p.th || (c && c.theater) || '', caseName: c ? workOf(c) : '' });
      } else {
        data = { theater: p.th || (c && c.theater) || '', work: c ? workOf(c) : '', date: today(), cover: true, showKoshu: true, showShot: true, items: [] };
      }
      busy = true;
      try {
        const row = await api.insert(p.type, { name, company: p.co || '', theater: p.th || '', folder_id: p.folder || null, case_id: c ? String(c.id) : null, data });
        S.rows.push(row); closeDlg();
        if (row.company && row.theater) { S.loc = { kind: 'place', co: row.company, th: row.theater, folder: row.folder_id || '' }; S.open[row.company] = true; }
        await openDoc(row.id, true);
        toast('作りました。保存は「💾 上書き保存」で行います');
      } catch (e) { fail('作成', e); } finally { busy = false; }
    };
    render();
  }

  /* ---------- 書類の操作（⋯ メニュー） ---------- */
  function docMenu(anchor, id) {
    const r = S.rows.find((x) => x.id === id); if (!r) return;
    S.sel = id; renderList();
    // 一覧を描き直したので、押したボタンを探し直してその近くに出す（古いボタンは画面から消えていて位置が取れない）
    anchor = document.querySelector(`#shList [data-dmenu="${CSS.escape(id)}"]`) || anchor;
    openMenu(anchor, `<button type="button" data-mact="open">開く</button><button type="button" data-mact="rename">名前を変える</button><button type="button" data-mact="dup">複製する</button><button type="button" data-mact="move">フォルダへ移動</button><hr><button type="button" class="danger" data-mact="del">削除する（ごみ箱へ）</button>`);
    $('shMenu').onclick = (e) => {
      const b = e.target.closest('[data-mact]'); if (!b) return; closeMenu();
      const a = b.dataset.mact;
      if (a === 'open') openDoc(id);
      if (a === 'rename') renameDoc(r);
      if (a === 'dup') dupDoc(r);
      if (a === 'move') moveDoc(r);
      if (a === 'del') delDoc(r);
    };
  }
  function nameDialog(title, value, onOk) {
    openDlg(`<h3>${esc(title)}</h3><div class="sh-dlg-b"><div class="sh-f"><label for="dlgName">名前</label><input id="dlgName" value="${esc(value || '')}"></div></div>
      <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri" data-dlg="ok">決定</button></div>`, () => ok());
    const ok = () => { const v = ($('dlgName').value || '').trim(); if (!v) return; closeDlg(); onOk(v); };
    $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
    $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', ok);
  }
  const replaceRow = (row) => { const i = S.rows.findIndex((x) => x.id === row.id && x.type === row.type); if (i >= 0) S.rows[i] = row; else S.rows.push(row); };
  function renameDoc(r) {
    nameDialog('名前を変える', r.name, async (v) => {
      try {
        const data = r.type === 'kotei' ? Object.assign({}, r.data, { title: v }) : r.data;
        replaceRow(await api.update(r.type, r.id, { name: v, data })); renderShelf();
      } catch (e) { fail('名前の変更', e); }
    });
  }
  async function dupDoc(r) {
    try {
      const full = await api.get(r.type, r.id);
      const name = r.name + '（コピー）';
      const data = JSON.parse(JSON.stringify(full.data)); if (r.type === 'kotei') data.title = name;
      const row = await api.insert(r.type, { name, company: r.company, theater: r.theater, folder_id: r.folder_id, case_id: r.case_id, data });
      S.rows.push(row); S.sel = row.id; renderShelf(); toast('複製しました');
    } catch (e) { fail('複製', e); }
  }
  function moveDoc(r) {
    const p = { co: r.company, th: r.theater, folder: r.folder_id || '' };
    const render = () => {
      openDlg(`<h3>フォルダへ移動 — ${esc(r.name)}</h3><div class="sh-dlg-b">${placeFields(p)}</div>
        <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri" data-dlg="ok">移動する</button></div>`, () => ok());
      bindPlace(p, render);
      $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
      $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', ok);
    };
    const ok = async () => {
      const q = readPlace(p); closeDlg();
      // 正式な計算書（📌）を別の劇場へ動かす時は📌を外す（劇場ごとに1つのため）
      const unpin = r.type === 'heat' && r.is_basis && (q.co !== r.company || q.th !== r.theater) ? { is_basis: false } : {};
      try { replaceRow(await api.update(r.type, r.id, Object.assign({ company: q.co, theater: q.th, folder_id: q.folder || null }, unpin))); renderShelf(); toast('移動しました'); }
      catch (e) { fail('移動', e); }
    };
    render();
  }
  function delDoc(r) {
    openDlg(`<h3>削除しますか？</h3><div class="sh-dlg-b"><p>「${esc(r.name)}」をごみ箱に入れます。<b>30日間はごみ箱から元に戻せます。</b></p></div>
      <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri danger" data-dlg="ok">削除する</button></div>`);
    $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
    $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', async () => {
      closeDlg();
      try {
        replaceRow(await api.update(r.type, r.id, Object.assign({ deleted_at: new Date().toISOString() }, r.type === 'heat' && r.is_basis ? { is_basis: false } : {}))); renderShelf();
        toast('ごみ箱に入れました', { label: '元に戻す', fn: () => restoreDoc(r.id) });
      } catch (e) { fail('削除', e); }
    });
  }
  async function restoreDoc(id) {
    const r = S.rows.find((x) => x.id === id); if (!r) return;
    try { replaceRow(await api.update(r.type, r.id, { deleted_at: null })); renderShelf(); toast('元に戻しました'); } catch (e) { fail('元に戻す', e); }
  }
  function purgeDoc(id) {
    const r = S.rows.find((x) => x.id === id); if (!r) return;
    openDlg(`<h3>完全に削除しますか？</h3><div class="sh-dlg-b"><p>「${esc(r.name)}」を完全に削除します。<b>もう元に戻せません。</b></p></div>
      <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri danger" data-dlg="ok">完全に削除する</button></div>`);
    $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
    $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', async () => {
      closeDlg();
      try { await api.remove(r.type, r.id); S.rows = S.rows.filter((x) => x !== r); renderShelf(); } catch (e) { fail('削除', e); }
    });
  }
  function folderMenu(anchor, id) {
    const f = S.folders.find((x) => x.id === id); if (!f) return;
    openMenu(anchor, `<button type="button" data-mact="rename">フォルダの名前を変える</button><hr><button type="button" class="danger" data-mact="del">フォルダを削除（中の書類は劇場のフォルダへ戻ります）</button>`);
    $('shMenu').onclick = async (e) => {
      const b = e.target.closest('[data-mact]'); if (!b) return; closeMenu();
      if (b.dataset.mact === 'rename') nameDialog('フォルダの名前を変える', f.name, async (v) => { try { await api.renameFolder(f.id, v); f.name = v; renderShelf(); } catch (er) { fail('名前の変更', er); } });
      if (b.dataset.mact === 'del') {
        try {
          for (const r of S.rows.filter((x) => x.folder_id === f.id)) replaceRow(await api.update(r.type, r.id, { folder_id: null }));
          await api.deleteFolder(f.id); S.folders = S.folders.filter((x) => x !== f);
          if (S.loc.folder === f.id) S.loc.folder = '';
          renderShelf(); toast('フォルダを削除しました（中の書類は劇場のフォルダへ）');
        } catch (er) { fail('フォルダの削除', er); }
      }
    };
  }

  /* ---------- 書類棚のクリック ---------- */
  const coarse = () => window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  $('viewShelf').addEventListener('click', (e) => {
    const t = e.target;
    const tog = t.closest('[data-tog]'); if (tog) { e.stopPropagation(); S.open[tog.dataset.tog] = !S.open[tog.dataset.tog]; renderTree(); return; }
    const lc = t.closest('[data-loc]'); if (lc) { S.loc = { kind: lc.dataset.loc }; S.sel = ''; S.treeOpen = false; renderShelf(); return; }
    const tn = t.closest('.sh-tn[data-co]'); if (tn) { goPlace(tn.dataset.co, tn.dataset.th, tn.dataset.folder); return; }
    if (t.closest('[data-act="newfolder"]')) {
      const l = S.loc;
      nameDialog('この劇場にフォルダを作る', '', async (v) => { try { const f = await api.addFolder({ company: l.co, theater: l.th, name: v }); S.folders.push(f); renderShelf(); } catch (er) { fail('フォルダの作成', er); } });
      return;
    }
    const go = t.closest('[data-go]'); if (go) { goPlace(S.loc.co, go.dataset.go === 'th' ? S.loc.th : '', ''); return; }
    const fl = t.closest('[data-filter]'); if (fl) { S.filter = fl.dataset.filter; renderShelf(); return; }
    if (t.closest('#shTreeBtn')) { S.treeOpen = !S.treeOpen; renderShelf(); return; }
    if (t.closest('#shNewBtn')) {
      const l = S.loc;
      newDialog({ type: S.filter === 'photo' && !setupMissing.photo ? 'photo' : S.filter === 'heat' && !setupMissing.heat && window.HL ? 'heat' : 'kotei', co: l.kind === 'place' ? l.co : '', th: l.kind === 'place' ? l.th : '', folder: l.kind === 'place' ? l.folder : '' });
      return;
    }
    const it = t.closest('[data-into-th]'); if (it) { goPlace(S.loc.co, it.dataset.intoTh, ''); return; }
    const fm = t.closest('[data-fmenu]'); if (fm) { folderMenu(fm, fm.dataset.fmenu); return; }
    const ifo = t.closest('[data-into-folder]'); if (ifo) { goPlace(S.loc.co, S.loc.th, ifo.dataset.intoFolder); return; }
    const op = t.closest('[data-openid]'); if (op) { openDoc(op.dataset.openid); return; }
    const dm = t.closest('[data-dmenu]'); if (dm) { docMenu(dm, dm.dataset.dmenu); return; }
    const rs = t.closest('[data-restore]'); if (rs) { restoreDoc(rs.dataset.restore); return; }
    const pg = t.closest('[data-purge]'); if (pg) { purgeDoc(pg.dataset.purge); return; }
    const row = t.closest('tr[data-doc]');
    if (row) {
      if (coarse() && S.loc.kind !== 'trash') { openDoc(row.dataset.doc); return; }   // スマホは1回押すと開く
      S.sel = row.dataset.doc;
      document.querySelectorAll('#shList tr.sel').forEach((x) => x.classList.remove('sel')); row.classList.add('sel');
    }
  });
  $('viewShelf').addEventListener('dblclick', (e) => { const row = e.target.closest('tr[data-doc]'); if (row && S.loc.kind !== 'trash') openDoc(row.dataset.doc); });
  $('shSearch').addEventListener('input', (e) => { S.q = e.target.value.trim(); renderList(); });

  /* ============================================================
     書類を開く・保存する（Excel と同じ: 上書き保存／名前を付けて新規に保存）
     ============================================================ */
  const DRAFT = (type, id) => 'shelfDraftV1:' + type + ':' + id;
  let draftTimer = null;
  function saveDraftSoon() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const c = S.cur; if (!c || !c.dirty) return;
      lsSet(DRAFT(c.type, c.row.id), { at: Date.now(), name: currentName(), data: currentData() });
    }, 400);
  }
  const dropDraft = (type, id) => { try { localStorage.removeItem(DRAFT(type, id)); } catch (e) {} };
  function currentName() { return ($('dtName').value || '').trim() || S.cur.row.name; }
  function currentData() {
    const c = S.cur; if (!c) return null;
    if (c.type === 'kotei') { const st = window.KOTEI.getState(); if (st) st.title = currentName(); return st; }
    if (c.type === 'heat') return window.HL.getState();
    return PH.getData();
  }
  function markDirty() { if (!S.cur) return; S.cur.dirty = true; saveUi(); saveDraftSoon(); }
  function saveUi() {
    const c = S.cur; if (!c) return;
    const s = $('dtSaved');
    if (c.saving) { s.className = 'dt-saved ing'; s.textContent = '保存しています…'; }
    else if (c.dirty) { s.className = 'dt-saved dirty'; s.textContent = '● 未保存の変更あり'; }
    else { s.className = 'dt-saved'; s.textContent = '✓ 保存済み ' + hhmm(c.row.updated_at); }
    $('dtSave').classList.toggle('on', !!c.dirty);
  }
  function showEditor(type) {
    $('viewShelf').classList.add('hidden');
    $('docTop').classList.remove('hidden');
    $('viewKotei').classList.toggle('hidden', type !== 'kotei');
    $('viewPhoto').classList.toggle('hidden', type !== 'photo');
    $('viewHeat').classList.toggle('hidden', type !== 'heat');
    $('dtExcel').classList.toggle('hidden', type !== 'kotei');
    $('dtPin').classList.toggle('hidden', type !== 'heat');
  }
  function showShelf() {
    if (window.KOTEI) window.KOTEI.leave();
    $('docTop').classList.add('hidden'); $('viewKotei').classList.add('hidden'); $('viewPhoto').classList.add('hidden'); $('viewHeat').classList.add('hidden');
    $('viewShelf').classList.remove('hidden');
    renderShelf();
  }
  function renderDocTop() {
    const c = S.cur, r = c.row;
    let h = '<button type="button" data-dt="shelf">📁 書類棚</button>';
    if (r.company) h += `<span class="sep">›</span><button type="button" data-dt="co">${esc(r.company)}</button>`;
    if (r.theater) h += `<span class="sep">›</span><button type="button" data-dt="th">${esc(theaterLabel(r.company, r.theater))}</button>`;
    if (r.folder_id && folderName(r.folder_id)) h += `<span class="sep">›</span><button type="button" data-dt="folder">🗂 ${esc(folderName(r.folder_id))}</button>`;
    h += '<span class="sep">›</span>';
    $('dtCrumb').innerHTML = h;
    $('dtIcon').textContent = TYPES[c.type].icon;
    $('dtName').value = r.name;
    sizeName();
    pinUi();
    saveUi();
  }
  function sizeName() { const n = $('dtName'); n.style.width = 'min(460px, ' + (Math.max(8, (n.value || '').length) + 2) + 'em)'; }

  // 書類の中身を、種類ごとの画面に読み込む
  async function loadInto(row, data) {
    if (row.type === 'kotei') window.KOTEI.load(data, { onChange: markDirty });
    else if (row.type === 'heat') window.HL.load(data, { onChange: markDirty, ctx: { name: $('dtName').value || row.name, company: row.company, theater: row.theater } });
    else await PH.load(data);
  }
  const busyMsg = () => PH.busy() ? '写真を入れている途中です。終わってから保存してください。' : (window.HL && S.cur && S.cur.type === 'heat' && window.HL.busy()) ? 'ファイルを入れている・読み取っている途中です。終わってから保存してください。' : '';
  // 「劇場情報の基にする」（空調負荷計算だけ。劇場ごとに1つ。テストの計算が混ざらないように）
  function pinUi() {
    const c = S.cur, b = $('dtPin'); if (!c || c.type !== 'heat') return;
    const on = !!c.row.is_basis; b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.querySelector('.tx').textContent = on ? '📌 劇場情報の基（この劇場の正式な計算書）' : '劇場情報の基にする';
  }
  let pinning = false;
  async function togglePin() {
    const c = S.cur; if (!c || c.type !== 'heat' || pinning) return;
    if (setupMissing.heat) { alert('データベースの準備（SETUP_HEATLOAD.sql）がまだです。'); return; }
    if (!c.row.company || !c.row.theater) { alert('劇場が決まっていません。書類棚の「⋯」→「フォルダへ移動」で劇場を決めてから使ってください。'); return; }
    const on = !c.row.is_basis;
    const others = S.rows.filter((r) => r.type === 'heat' && r.is_basis && !r.deleted_at && r.id !== c.row.id && r.company === c.row.company && r.theater === c.row.theater);
    if (on && others.length && !confirm(`この劇場の正式な計算書を、この計算書に切り替えます。\n今の「${others.map((r) => r.name).join('・')}」の📌は外れます。よいですか？`)) return;
    pinning = true;
    try {
      for (const r of on ? others : []) replaceRow(await api.update('heat', r.id, { is_basis: false }));
      const row = await api.update('heat', c.row.id, { is_basis: on });
      // 中身は保存しないので、名前や未保存の変更はそのまま（保存の時刻だけ合わせる）
      c.row.is_basis = row.is_basis; c.row.updated_at = row.updated_at; c.loadedStamp = row.updated_at;
      const i = S.rows.findIndex((x) => x.id === row.id && x.type === 'heat'); if (i >= 0) Object.assign(S.rows[i], { is_basis: row.is_basis, updated_at: row.updated_at });
      pinUi(); saveUi();
      toast(on ? 'この劇場の正式な計算書にしました（書類棚で 📌 が付きます）' : '劇場情報の基から外しました');
    } catch (e) { fail('切り替え', e); } finally { pinning = false; }
  }

  async function openDoc(id, fresh) {
    const meta = S.rows.find((x) => x.id === id); if (!meta) return;
    let row;
    try { row = await api.get(meta.type, id); } catch (e) { fail('読み込み', e); return; }
    if (!row) { alert('この書類は見つかりませんでした（削除された可能性があります）。'); await reload(); renderShelf(); return; }
    replaceRow(row);
    S.cur = { type: row.type, row, dirty: false, loadedStamp: row.updated_at };
    S.sel = row.id;
    renderDocTop(); showEditor(row.type);
    await loadInto(row, row.data);
    // 前に保存しないまま閉じた（ブラウザごと閉じた等）内容が残っていれば、復元するか聞く
    const d = fresh ? null : lsGet(DRAFT(row.type, row.id), null);
    if (d && d.data) {
      openDlg(`<h3>保存していない内容が残っています</h3><div class="sh-dlg-b"><p>「${esc(row.name)}」に、${esc(fmtUpdated(new Date(d.at).toISOString()))} の時点で<b>保存されていない変更</b>がこの端末に残っています。</p><p class="sh-hint">復元すると、その内容で開きます（まだ保存はされません。よければ「💾 上書き保存」を押してください）。</p></div>
        <div class="sh-dlg-f"><button type="button" data-dlg="drop">残っている内容を捨てる</button><button type="button" class="pri" data-dlg="ok">復元する</button></div>`);
      $('shDlg').querySelector('[data-dlg="drop"]').addEventListener('click', () => { dropDraft(row.type, row.id); closeDlg(); });
      $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', async () => {
        closeDlg();
        $('dtName').value = d.name || row.name; sizeName();
        await loadInto(row, d.data);
        S.cur.dirty = true; saveUi(); toast('復元しました。よければ「💾 上書き保存」を押してください');
      });
    }
  }
  let saving = false;
  async function saveOver(force) {
    const c = S.cur; if (!c || saving) return false;
    if (busyMsg()) { alert(busyMsg()); return false; }
    saving = true; c.saving = true; saveUi();
    try {
      if (!force) {
        const st = await api.stamp(c.type, c.row.id);
        if (st === null) { saving = false; c.saving = false; saveUi(); openDlg(`<h3>保存できません</h3><div class="sh-dlg-b"><p>この書類は、ほかの人が削除したようです。「名前を付けて新規に保存」で別の書類として残せます。</p></div><div class="sh-dlg-f"><button type="button" class="pri" data-dlg="cancel">閉じる</button></div>`); $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg); return false; }
        if (c.loadedStamp && st && st !== c.loadedStamp && new Date(st).getTime() !== new Date(c.loadedStamp).getTime()) {
          saving = false; c.saving = false; saveUi();
          return await new Promise((resolve) => {
            openDlg(`<h3>ほかの人が先に保存しています</h3><div class="sh-dlg-b"><p>あなたが開いた後に、この書類が保存されています（${esc(fmtUpdated(st))}）。上書きすると、その人の変更は消えます。</p></div>
              <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" data-dlg="as">名前を付けて新規に保存</button><button type="button" class="pri danger" data-dlg="ok">それでも上書き保存</button></div>`);
            $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', () => { closeDlg(); resolve(false); });
            $('shDlg').querySelector('[data-dlg="as"]').addEventListener('click', () => { closeDlg(); saveAs(); resolve(false); });
            $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', async () => { closeDlg(); resolve(await saveOver(true)); });
          });
        }
      }
      const row = await api.update(c.type, c.row.id, { name: currentName(), data: currentData() });
      c.row = row; c.loadedStamp = row.updated_at; c.dirty = false; replaceRow(row);
      dropDraft(c.type, row.id);
      saving = false; c.saving = false; renderDocTop(); toast('上書き保存しました');
      return true;
    } catch (e) { saving = false; c.saving = false; saveUi(); fail('保存', e); return false; }
  }
  function saveAs() {
    const c = S.cur; if (!c) return;
    if (busyMsg()) { alert(busyMsg()); return; }
    const p = { co: c.row.company, th: c.row.theater, folder: c.row.folder_id || '' };
    let nm = currentName() + ' のコピー';
    const render = () => {
      openDlg(`<h3>名前を付けて新規に保存</h3><div class="sh-dlg-b"><p class="sh-hint">今の内容を<b>別の新しい${TYPES[c.type].label}</b>として保存します。元の「${esc(c.row.name)}」は、最後に上書き保存した状態のまま残ります。</p>
        <div class="sh-f"><label for="saName">名前</label><input id="saName" value="${esc(nm)}"></div>${placeFields(p)}</div>
        <div class="sh-dlg-f"><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri" data-dlg="ok">保存する</button></div>`, () => ok());
      bindPlace(p, () => { nm = $('saName').value; render(); });
      $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
      $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', ok);
    };
    const ok = async () => {
      const name = ($('saName').value || '').trim(); if (!name) return;
      const q = readPlace(p); closeDlg();
      const data = currentData(); if (c.type === 'kotei') data.title = name;
      try {
        const row = await api.insert(c.type, { name, company: q.co, theater: q.th, folder_id: q.folder || null, case_id: c.row.case_id, data });
        const oldId = c.row.id, oldName = c.row.name;
        dropDraft(c.type, oldId);
        S.rows.push(row);
        S.cur = { type: c.type, row, dirty: false, loadedStamp: row.updated_at };
        if (c.type === 'kotei') window.KOTEI.setTitle(name);
        if (c.type === 'heat') window.HL.setTitle(name);
        renderDocTop();
        toast(`「${name}」として新しく保存しました（元の「${oldName}」はそのまま）`);
      } catch (e) { fail('保存', e); }
    };
    render();
  }
  // 閉じる前の確認（保存していない変更がある時だけ聞く）
  function confirmLeave(then) {
    const c = S.cur;
    if (!c || !c.dirty) { then(); return; }
    openDlg(`<h3>変更を保存しますか？</h3><div class="sh-dlg-b"><p>「${esc(currentName())}」に、まだ保存していない変更があります。</p></div>
      <div class="sh-dlg-f"><button type="button" data-dlg="no">保存しない</button><span class="sh-grow"></span><button type="button" data-dlg="cancel">やめる</button><button type="button" class="pri" data-dlg="ok">💾 上書き保存して閉じる</button></div>`);
    $('shDlg').querySelector('[data-dlg="cancel"]').addEventListener('click', closeDlg);
    $('shDlg').querySelector('[data-dlg="no"]').addEventListener('click', () => { closeDlg(); dropDraft(c.type, c.row.id); c.dirty = false; then(); });
    $('shDlg').querySelector('[data-dlg="ok"]').addEventListener('click', async () => { closeDlg(); if (await saveOver()) then(); });
  }
  function backToShelf(where) {
    confirmLeave(() => {
      const r = S.cur.row; S.cur = null;
      if (where !== 'keep' && r.company && r.theater) S.loc = { kind: 'place', co: r.company, th: where === 'co' ? '' : r.theater, folder: where === 'folder' ? (r.folder_id || '') : '' };
      if (r.company) S.open[r.company] = true;
      S.sel = r.id; showShelf();
    });
  }
  $('dtCrumb').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dt]'); if (!b) return;
    backToShelf(b.dataset.dt === 'shelf' ? 'th' : b.dataset.dt);
  });
  $('dtBack').addEventListener('click', () => backToShelf('folder'));
  $('dtSave').addEventListener('click', () => saveOver());
  $('dtSaveAs').addEventListener('click', saveAs);
  $('dtPrint').addEventListener('click', () => { if (!S.cur) return; if (S.cur.type === 'kotei') { window.KOTEI.setTitle(currentName()); window.KOTEI.print(); } else if (S.cur.type === 'heat') { window.HL.setTitle(currentName()); window.HL.print(); } else PH.print(); });
  $('dtPin').addEventListener('click', togglePin);
  $('dtExcel').addEventListener('click', () => { if (S.cur && S.cur.type === 'kotei') { window.KOTEI.setTitle(currentName()); window.KOTEI.excel(); } });
  $('dtName').addEventListener('input', () => { sizeName(); if (S.cur && S.cur.type === 'kotei') window.KOTEI.setTitle(currentName()); if (S.cur && S.cur.type === 'heat') window.HL.setTitle(currentName()); markDirty(); });
  $('dtName').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
  document.addEventListener('keydown', (e) => {
    if (!S.cur || $('docTop').classList.contains('hidden')) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (!dlgOpen()) { if (document.activeElement && document.activeElement.blur && document.activeElement !== document.body) document.activeElement.blur(); saveOver(); } }
  });
  window.addEventListener('beforeunload', (e) => { if (S.cur && S.cur.dirty) { saveDraftSoon(); e.preventDefault(); e.returnValue = ''; } });

  /* ============================================================
     工事写真台帳
     ============================================================ */
  const KUBUN = ['工事前', '工事中', '工事後', 'その他'];
  const KOSHU_BASE = ['仮設・養生', '解体・撤去', '機器据付', '配管', 'ダクト・排気口', '排気フード', '送風機', '電気', '風量測定', '試運転', 'その他'];
  const COMPANY = { name: '菱熱工業株式会社', addr: '東京都品川区北品川6-7-29 ガーデンシティ品川御殿山', tel: '03-6456-4201', logo: 'img/ryonetsu-logo.png' };
  const PH = (function () {
    let d = null, urls = {}, sel = new Set(), sortMode = '', hl = '', uploading = 0, pvTimer = null, dragId = null;
    const N = () => markDirty();
    const dayOf = (it) => String(it.shot || '').slice(0, 10);
    function normalizeData(o) {
      o = JSON.parse(JSON.stringify(o || {}));
      return {
        theater: o.theater || '', work: o.work || '', date: o.date || today(), cover: o.cover !== false,
        showKoshu: o.showKoshu !== false, showShot: o.showShot !== false,
        items: (o.items || []).map((it) => ({ id: it.id || uid(), ref: it.ref || it.path || it.src || '', kubun: it.kubun || '工事前', koshu: it.koshu || '', shot: it.shot || '', place: it.place || '', memo: it.memo || '' }))
      };
    }
    async function load(data) {
      d = normalizeData(data); sel = new Set(); sortMode = ''; hl = '';
      $('phTheater').value = d.theater; $('phWork').value = d.work; $('phDate').value = d.date;
      $('phOptCover').checked = d.cover; $('phOptKoshu').checked = d.showKoshu; $('phOptShot').checked = d.showShot;
      $('viewPhoto').classList.remove('pv-open');
      renderAll();
      try { Object.assign(urls, await api.photoUrls(d.items.map((x) => x.ref).filter((r) => r && !urls[r]))); } catch (e) { console.error('写真の読み込み', e); toast('写真を読み込めませんでした（通信を確認してください）'); }
      renderAll();
    }
    const getData = () => JSON.parse(JSON.stringify(d));
    function koshuList() { const used = []; d.items.forEach((x) => { if (x.koshu && used.indexOf(x.koshu) < 0) used.push(x.koshu); }); return used.concat(KOSHU_BASE.filter((k) => used.indexOf(k) < 0)); }
    function cardHtml(it, i) {
      const src = urls[it.ref];
      return `<div class="ph-card${sel.has(it.id) ? ' sel' : ''}${hl === it.id ? ' flash' : ''}" draggable="true" data-card="${esc(it.id)}">
        <div class="ph-cl"><input type="checkbox" data-csel="${esc(it.id)}" ${sel.has(it.id) ? 'checked' : ''} aria-label="${i + 1}枚目を選ぶ"><span class="ph-grip" title="つかんで並べ替え">⋮⋮</span><span class="ph-no">${i + 1}</span></div>
        <div class="ph-thumb">${src ? `<img src="${esc(src)}" alt="" draggable="false">` : '<span>読み込み中…</span>'}</div>
        <div class="ph-fx">
          <div class="ph-seg sm">${KUBUN.map((k) => `<button type="button" class="${it.kubun === k ? 'on' : ''}" data-ckubun="${esc(it.id)}" data-v="${k}">${k}</button>`).join('')}</div>
          <div class="ph-meta"><input type="datetime-local" class="ph-dt" value="${esc(it.shot)}" data-cshot="${esc(it.id)}" aria-label="撮影日時" title="撮影日時（写真から自動で読み取り）"><input value="${esc(it.koshu)}" placeholder="工種（例：送風機）" list="koshuList" data-ckoshu="${esc(it.id)}" aria-label="工種"></div>
          <input value="${esc(it.place)}" placeholder="場所（例：コンセッション内・屋上 送風機）" data-cplace="${esc(it.id)}" aria-label="場所">
          <textarea rows="2" placeholder="メモ（測定値・作業内容など。改行もそのまま台帳に出ます）" data-cmemo="${esc(it.id)}" aria-label="メモ">${esc(it.memo)}</textarea>
        </div>
        <button type="button" class="ph-rm" data-crm="${esc(it.id)}" title="この写真を外す" aria-label="この写真を外す">×</button></div>`;
    }
    function renderCards() {
      let last = null;
      const html = d.items.map((it, i) => {
        let head = '';
        if (sortMode === 'koshu' && (it.koshu || '（工種なし）') !== last) { last = it.koshu || '（工種なし）'; head = `<div class="ph-grp">■ ${esc(last)}<span>${d.items.filter((x) => (x.koshu || '（工種なし）') === last).length} 枚</span></div>`; }
        if (sortMode === 'date' && dayOf(it) !== last) { last = dayOf(it); head = `<div class="ph-grp">📅 ${last ? jpDay(last) : '撮影日なし'}<span>${d.items.filter((x) => dayOf(x) === last).length} 枚</span></div>`; }
        return head + cardHtml(it, i);
      }).join('');
      $('phCards').innerHTML = html || '<div class="ph-empty">まだ写真がありません。「＋ 写真を追加」から入れてください。</div>';
      $('koshuList').innerHTML = koshuList().map((k) => `<option value="${esc(k)}">`).join('');
    }
    function renderBar() {
      const pages = Math.ceil(d.items.length / 3);
      $('phCount').textContent = `写真 ${d.items.length} 枚・${pages} ページ${d.cover ? '＋表紙' : ''}${uploading ? `（${uploading} 枚を入れています…）` : ''}`;
      $('phBulk').innerHTML = sel.size
        ? `<span class="ph-bulk">選んだ ${sel.size} 枚を ${KUBUN.slice(0, 3).map((k) => `<button type="button" class="ph-btn sm" data-bulk="${k}">${k}</button>`).join('')} <input id="phBulkKoshu" list="koshuList" placeholder="工種" aria-label="まとめて付ける工種"><button type="button" class="ph-btn sm" data-bulkkoshu="1">工種にする</button> <button type="button" class="ph-btn sm" data-bulkdel="1">外す</button><button type="button" class="ph-btn sm" data-bulkclear="1">選ぶのをやめる</button></span>`
        : '<span class="ph-cnt">☑ で選ぶと「工事前」や工種を一度に付けられます</span>';
      document.querySelectorAll('#phSort [data-psort]').forEach((b) => b.classList.toggle('on', b.dataset.psort === sortMode));
      $('phSortHint').textContent = sortMode === 'koshu' ? '工種ごとに、工事前→工事後・撮影日の順' : sortMode === 'date' ? '古い写真から順に' : sortMode === 'kubun' ? '工事前→工事中→工事後、中は撮影日の順' : '押すとその順に並び替わります。あとから ⋮⋮ で手直しもできます';
    }
    // A4縦（595×842pt）。寸法はいただいたPDFを実測（写真の枠 x9〜353・高さ245pt×3段・右に説明）
    function pagesHtml(forPrint) {
      const out = [];
      const imgSrc = (it) => urls[it.ref] || '';
      if (d.cover) out.push(`<div class="pg cover"><div class="c1">${esc(d.theater)}<br>${esc(d.work)}</div><div class="c2">${esc(jpDay(d.date))}</div><img src="${COMPANY.logo}" alt="ryonetsu"><div class="c3">${COMPANY.name}</div><div class="c4">${COMPANY.addr}</div><div class="c4 c5">${COMPANY.tel}</div></div>`);
      const pages = Math.ceil(d.items.length / 3);
      for (let pi = 0; pi < pages; pi++) {
        const rows = d.items.slice(pi * 3, pi * 3 + 3).map((it, k) => {
          const lines = [esc(it.kubun) + (d.showKoshu && it.koshu ? '　' + esc(it.koshu) : '')];
          if (d.showShot && it.shot) lines.push('撮影日 ' + esc(jpDay(it.shot)));
          const memo = [it.place, it.memo].filter(Boolean).join('\n');
          return `<div class="rw${!forPrint && hl === it.id ? ' hl' : ''}" style="top:calc(44pt*var(--s) + ${k} * 245pt*var(--s))"><div class="pc">${imgSrc(it) ? `<img src="${esc(imgSrc(it))}" ${forPrint ? '' : `data-pvimg="${esc(it.id)}" title="押すと左の説明の欄へ"`} alt="">` : ''}</div><div class="tx"><div class="t1">${esc(d.theater)}</div><div>${esc(d.work)}</div>${lines.map((x) => `<div>${x}</div>`).join('')}${memo ? `<div class="m">${esc(memo)}</div>` : ''}</div></div>`;
        }).join('');
        out.push(`<div class="pg"><div class="ttl">${esc(d.theater)}　${esc(d.work)}</div>${rows}<div class="pn">${pi + 1}/${pages}ページ</div></div>`);
      }
      if (!out.length && !forPrint) out.push('<div class="ph-empty">写真を入れると、ここに見本が出ます。</div>');
      return out.join('');
    }
    // 見本の縮尺は、見本の欄の幅に合わせる（A4の幅 595pt＝793px）
    function fitPreview() { const w = $('phPv').clientWidth; if (w) $('phPv').style.setProperty('--pvs', String(Math.min(0.56, Math.max(0.3, (w - 30) / 793)).toFixed(3))); }
    function renderPreview() { fitPreview(); $('phPv').innerHTML = pagesHtml(false); }
    window.addEventListener('resize', () => { if (d && !$('viewPhoto').classList.contains('hidden')) fitPreview(); });
    function previewSoon() { clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 120); }
    function renderAll() {
      const c = $('phCards'), st = c.scrollTop;
      renderBar(); renderCards(); renderPreview(); c.scrollTop = st;
    }
    const item = (id) => d.items.find((x) => x.id === id);

    // ---- 並べ替え（押した時に1回並び替える。Excel の並べ替えと同じ。直後に「元に戻す」） ----
    function sortPhotos(mode) {
      const before = d.items.slice(), beforeMode = sortMode;
      const kub = (x) => { const i = KUBUN.indexOf(x.kubun); return i < 0 ? 9 : i; };
      const byShot = (a, b) => (a.shot || '9999').localeCompare(b.shot || '9999');
      const kOrder = []; d.items.slice().sort(byShot).forEach((x) => { const k = x.koshu || ''; if (k && kOrder.indexOf(k) < 0) kOrder.push(k); });   // 工種は、最初に撮った順
      const kIdx = (x) => x.koshu ? kOrder.indexOf(x.koshu) : 9999;
      const cmp = mode === 'date' ? byShot : mode === 'kubun' ? (a, b) => kub(a) - kub(b) || byShot(a, b) : (a, b) => kIdx(a) - kIdx(b) || kub(a) - kub(b) || byShot(a, b);
      d.items = d.items.slice().sort(cmp); sortMode = mode; N(); renderAll();
      toast({ date: '撮影日の順に並べ替えました', koshu: '工種ごとに並べ替えました', kubun: '工事前→工事後の順に並べ替えました' }[mode], { label: '元に戻す', fn: () => { d.items = before; sortMode = beforeMode; N(); renderAll(); } });
    }

    // ---- 写真を入れる（撮影日を読み取り、長い辺1600pxに縮めてから保存） ----
    function exifDate(buf) {
      try {
        const v = new DataView(buf); if (v.getUint16(0) !== 0xFFD8) return '';
        let o = 2;
        while (o < v.byteLength - 4) {
          const m = v.getUint16(o), len = v.getUint16(o + 2);
          if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
            const t0 = o + 10, le = v.getUint16(t0) === 0x4949;
            const u16 = (p) => v.getUint16(p, le), u32 = (p) => v.getUint32(p, le);
            const str = (p) => { let s = ''; for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
            const find = (ifd, tag) => { const n = u16(ifd); for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (u16(e) === tag) return u32(e + 8); } return null; };
            const ifd0 = t0 + u32(t0 + 4);
            const exif = find(ifd0, 0x8769);
            let off = exif != null ? find(t0 + exif, 0x9003) : null;
            if (off == null) off = find(ifd0, 0x0132);
            if (off == null) return '';
            const s = str(t0 + off);   // "2026:08:09 01:16:40"
            return /^\d{4}:\d\d:\d\d \d\d:\d\d/.test(s) ? `${s.slice(0, 4)}-${s.slice(5, 7)}-${s.slice(8, 10)}T${s.slice(11, 16)}` : '';
          }
          if ((m & 0xFF00) !== 0xFF00) break;
          o += 2 + len;
        }
      } catch (e) {}
      return '';
    }
    function shrink(file) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const max = 1600, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(url);
          const dataUrl = cv.toDataURL('image/jpeg', 0.82);
          cv.toBlob((blob) => blob ? resolve({ blob, dataUrl }) : reject(new Error('画像の変換に失敗しました')), 'image/jpeg', 0.82);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めませんでした（' + file.name + '）')); };
        img.src = url;
      });
    }
    async function addFiles(files) {
      const list = [...files].filter((f) => /^image\//.test(f.type)); if (!list.length) return;
      uploading += list.length; renderBar();
      let ok = 0, ng = 0;
      for (const f of list) {
        try {
          let shot = '';
          try { shot = exifDate(await f.arrayBuffer()); } catch (e) {}
          if (!shot) { const t = new Date(f.lastModified || Date.now()); shot = isoDay(t) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()); }
          const { blob, dataUrl } = await shrink(f);
          const ref = await api.putPhoto(blob, dataUrl);
          urls[ref] = sbc() ? URL.createObjectURL(blob) : dataUrl;
          d.items.push({ id: uid(), ref, kubun: '工事前', koshu: '', shot, place: '', memo: '' });
          ok++; N();
        } catch (e) { ng++; console.error('写真の追加', e); }
        uploading--; renderAll();
      }
      if (sortMode) sortMode = '';
      toast(ng ? `${ok} 枚入れました。${ng} 枚は入れられませんでした（通信や画像の形式を確認してください）` : `${ok} 枚入れました（自動で小さくしています）`);
      renderBar();
    }

    // ---- 印刷（A4縦。写真が全部読み込まれてから印刷の画面を出す） ----
    function print() {
      const box = $('photoPrint');
      box.innerHTML = pagesHtml(true);
      document.body.classList.add('photo-printing');
      // 工程表の印刷（A3横）の設定より後ろに置いて、写真台帳はA4縦で印刷する
      let pcss = document.getElementById('phPageCss');
      if (!pcss) { pcss = document.createElement('style'); pcss.id = 'phPageCss'; document.head.appendChild(pcss); }
      pcss.textContent = '@media print{@page{size:A4 portrait;margin:0}}';
      const imgs = [...box.querySelectorAll('img')];
      const ready = Promise.all(imgs.map((im) => im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; })));
      const cleanup = () => { document.body.classList.remove('photo-printing'); box.innerHTML = ''; pcss.textContent = ''; window.removeEventListener('afterprint', cleanup); };
      window.addEventListener('afterprint', cleanup);
      Promise.race([ready, new Promise((r) => setTimeout(r, 15000))]).then(() => setTimeout(() => window.print(), 50));
    }

    // ---- 操作 ----
    const view = $('viewPhoto');
    view.addEventListener('click', (e) => {
      const t = e.target;
      const kb = t.closest('[data-ckubun]'); if (kb) { item(kb.dataset.ckubun).kubun = kb.dataset.v; N(); renderAll(); return; }
      const rm = t.closest('[data-crm]'); if (rm) { const it = item(rm.dataset.crm), idx = d.items.indexOf(it); d.items.splice(idx, 1); sel.delete(it.id); N(); renderAll(); toast('写真を外しました', { label: '元に戻す', fn: () => { d.items.splice(idx, 0, it); N(); renderAll(); } }); return; }
      const bk = t.closest('[data-bulk]'); if (bk) { const n = sel.size; d.items.forEach((x) => { if (sel.has(x.id)) x.kubun = bk.dataset.bulk; }); N(); renderAll(); toast(`${n} 枚を「${bk.dataset.bulk}」にしました`); return; }
      if (t.closest('[data-bulkkoshu]')) { const v = ($('phBulkKoshu').value || '').trim(); if (!v) { $('phBulkKoshu').focus(); return; } const n = sel.size; d.items.forEach((x) => { if (sel.has(x.id)) x.koshu = v; }); N(); renderAll(); toast(`${n} 枚の工種を「${v}」にしました`); return; }
      if (t.closest('[data-bulkdel]')) { const before = d.items.slice(); const n = sel.size; d.items = d.items.filter((x) => !sel.has(x.id)); sel.clear(); N(); renderAll(); toast(`${n} 枚を外しました`, { label: '元に戻す', fn: () => { d.items = before; N(); renderAll(); } }); return; }
      if (t.closest('[data-bulkclear]')) { sel.clear(); renderAll(); return; }
      const ps = t.closest('[data-psort]'); if (ps) { sortPhotos(ps.dataset.psort); return; }
      const pi = t.closest('[data-pvimg]'); if (pi) {
        hl = pi.dataset.pvimg; view.classList.remove('pv-open'); renderAll();
        const c = document.querySelector(`#phCards [data-card="${CSS.escape(hl)}"]`); if (c) c.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => { hl = ''; }, 1200); return;
      }
      if (t.closest('#phPvBtn')) { view.classList.add('pv-open'); fitPreview(); return; }
      if (t.closest('#phPvClose')) { view.classList.remove('pv-open'); return; }
    });
    view.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.csel) { if (t.checked) sel.add(t.dataset.csel); else sel.delete(t.dataset.csel); renderBar(); t.closest('.ph-card').classList.toggle('sel', t.checked); return; }
      if (t.id === 'phAddInput') { addFiles(t.files).finally(() => { t.value = ''; }); return; }
      if (t.id === 'phOptCover') { d.cover = t.checked; N(); renderAll(); return; }
      if (t.id === 'phOptKoshu') { d.showKoshu = t.checked; N(); renderPreview(); return; }
      if (t.id === 'phOptShot') { d.showShot = t.checked; N(); renderPreview(); return; }
      if (t.dataset.cshot) { item(t.dataset.cshot).shot = t.value; N(); previewSoon(); return; }
      if (t.dataset.ckoshu) { renderCards(); return; }   // 工種の候補を更新
    });
    view.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'phTheater') { d.theater = t.value; N(); previewSoon(); return; }
      if (t.id === 'phWork') { d.work = t.value; N(); previewSoon(); return; }
      if (t.id === 'phDate') { d.date = t.value; N(); previewSoon(); return; }
      if (t.dataset.ckoshu) { item(t.dataset.ckoshu).koshu = t.value; N(); previewSoon(); return; }
      if (t.dataset.cplace) { item(t.dataset.cplace).place = t.value; N(); previewSoon(); return; }
      if (t.dataset.cmemo) { item(t.dataset.cmemo).memo = t.value; N(); previewSoon(); return; }
    });
    // 並べ替え（カードをつかんで上下へ）と、写真ファイルのドラッグ＆ドロップ
    const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].indexOf('Files') >= 0;
    view.addEventListener('dragstart', (e) => {
      const c = e.target.closest && e.target.closest('[data-card]');
      if (!c || e.target.closest('input,textarea,button')) { if (c) e.preventDefault(); return; }
      dragId = c.dataset.card; c.classList.add('drag');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } catch (x) {}
    });
    view.addEventListener('dragend', () => { dragId = null; view.querySelectorAll('.ph-card.drag,.ph-card.over').forEach((x) => x.classList.remove('drag', 'over')); $('phDrop').classList.remove('over'); });
    view.addEventListener('dragover', (e) => {
      if (hasFiles(e)) { e.preventDefault(); $('phDrop').classList.add('over'); return; }
      const c = e.target.closest && e.target.closest('[data-card]');
      if (c && dragId) { e.preventDefault(); view.querySelectorAll('.ph-card.over').forEach((x) => x.classList.remove('over')); c.classList.add('over'); }
    });
    view.addEventListener('dragleave', (e) => { if (e.target === $('phDrop')) $('phDrop').classList.remove('over'); });
    view.addEventListener('drop', (e) => {
      $('phDrop').classList.remove('over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); addFiles(e.dataTransfer.files); return; }
      const c = e.target.closest && e.target.closest('[data-card]');
      if (c && dragId && c.dataset.card !== dragId) {
        e.preventDefault();
        const from = d.items.findIndex((x) => x.id === dragId), to = d.items.findIndex((x) => x.id === c.dataset.card);
        const [m] = d.items.splice(from, 1); d.items.splice(to, 0, m); sortMode = ''; dragId = null; N(); renderAll();
      }
    });
    return { load, getData, print, busy: () => uploading > 0 };
  })();

  /* ============================================================
     公開API（app.js から使う）
     ============================================================ */
  async function open(opts) {
    opts = opts || {};
    try { const l = JSON.parse(localStorage.getItem(SEL_LS)); if (l && l.kind && !S.loaded) S.loc = l; } catch (e) {}
    if (S.cur) { showEditor(S.cur.type); return; }
    showShelf();
    $('shList').innerHTML = '<div class="sh-empty">読み込んでいます…</div>';
    try { await reload(); } catch (e) { fail('書類の読み込み', e); }
    if (S.loc.kind === 'place' && !companyNames().includes(S.loc.co)) S.loc = { kind: 'recent' };
    showShelf();
    if (opts.newFromCase) newFromCase(opts.newFromCase, opts.type);
  }
  // 他の画面へ切り替えた時（保存していない内容はこの端末に残るので、次に開いた時に復元できる）
  function close() {
    if (S.cur && S.cur.dirty) { const c = S.cur; lsSet(DRAFT(c.type, c.row.id), { at: Date.now(), name: currentName(), data: currentData() }); }
    if (window.KOTEI) window.KOTEI.leave();
    S.cur = null; closeDlg(); closeMenu();
    ['viewShelf', 'docTop', 'viewKotei', 'viewPhoto', 'viewHeat'].forEach((id) => $(id).classList.add('hidden'));
  }
  function newFromCase(c, type) {
    if (!c) return;
    newDialog({ type: type || 'photo', co: c.company || '', th: c.theater || '', caseId: String(c.id), name: (workOf(c) || theaterLabel(c.company, c.theater)) + SUFFIX[type || 'photo'] });
  }
  window.SHELF = { open, close, requestClose: (then) => confirmLeave(then), isDirty: () => !!(S.cur && S.cur.dirty), newFromCase };
})();
