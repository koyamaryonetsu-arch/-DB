"use strict";
/* ============================================================
   作業申請書の自動作成（菱熱だけ）
   1) 劇場の書式（書類棚の「作業申請書の書式」）と記入例（提出した申請書）を探す
   2) 先に足りないことを聞く（作業日時・場所・内容・当日責任者・協力会社・作業者・車両・火気など）
      AI（Opus）が書式を読んで、提出期限・作業場所/内容の案・この書式で聞くことを足す
   3) AI が書き込む内容を決め、ここで書式に書き込む（PDF は座標に文字・○、Excel はセル、Word は段落）
      PDF は書き込んだ結果を AI がもう一度見て、ずれを直す
   4) 確認画面: OK → 劇場へ通知メールで送る（案件の書類「完成」＝今の仕組み）＋書類棚に記入例として残す
                編集 → 直す（自分で直す・AI に直してもらう）→ もう一度確認
   協力会社マスター（partners）: 劇場情報のパートナー連絡先から AI が協力会社だけを選んで自動で足す。作業者は申請書で入れた人を覚える
   ============================================================ */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escXml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const unXml = (s) => String(s || '').replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[e.toLowerCase()] ||
    (e[1] === 'x' || e[1] === 'X' ? String.fromCodePoint(parseInt(e.slice(2), 16)) : String.fromCodePoint(parseInt(e.slice(1), 10)))));
  const DB = () => window.CINEMA_DB || {};
  const sbc = () => (DB().mode && DB().mode() === 'supabase') ? DB().client() : null;
  const K = () => window.KARTE || { ask: async (m) => window.confirm(m), say: (m) => window.alert(m) };
  const pad = (n) => String(n).padStart(2, '0');
  const isoDay = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const toast = (t) => { try { if (DB().toast) DB().toast(t); } catch (e) { /* なし */ } };

  // 申請者（作業する会社）の決まった情報。旧住所（大田区南馬込）・旧TEL は使わない
  const APPLICANT = {
    company: '菱熱工業株式会社', company_short: '菱熱工業（株）', zip: '141-0001',
    address: '東京都品川区北品川6-7-29　ガーデングレイス品川御殿山', tel: '03-6456-4201'
  };
  const SELF = '菱熱工業';
  const FORM_BUCKET = 'doc-files', CASE_BUCKET = 'case-files';
  const API = '/api/workapp-ai';
  const MAX_BODY = 4.0 * 1024 * 1024;   // Vercel の受け取れる大きさ（4.5MB）より少し小さく

  /* ============================================================
     部品の読み込み（使う時だけ）
     ============================================================ */
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error(src + ' を読み込めませんでした')); }; document.head.appendChild(s); });
    return loaded[src];
  }
  async function pdfLib() { await loadScript('vendor/pdf-lib.min.js'); await loadScript('vendor/fontkit.min.js'); return window.PDFLib; }
  let pdfjsP = null;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = import(new URL('vendor/pdfjs/pdf.min.mjs', document.baseURI).href).then((m) => {
      m.GlobalWorkerOptions.workerSrc = new URL('vendor/pdfjs/pdf.worker.min.mjs', document.baseURI).href; return m;
    }).catch((e) => { pdfjsP = null; throw e; });
    return pdfjsP;
  }
  let fontP = null;
  function jpFont() {
    if (!fontP) fontP = fetch('vendor/fonts/ipag.ttf').then((r) => { if (!r.ok) throw new Error('日本語の文字（フォント）を読み込めませんでした'); return r.arrayBuffer(); }).catch((e) => { fontP = null; throw e; });
    return fontP;
  }
  async function docxPreview() { await loadScript('vendor/docx-preview.min.js'); return window.docx; }

  const extOf = (name) => (String(name || '').match(/\.([A-Za-z0-9]{1,5})$/) || [, ''])[1].toLowerCase();
  function formatOf(name, mime) {
    const e = extOf(name);
    if (e === 'pdf' || /pdf/.test(mime || '')) return 'pdf';
    if (e === 'xlsx' || e === 'xlsm') return 'xlsx';
    if (e === 'docx') return 'docx';
    if (/^(jpe?g|png|webp)$/.test(e) || /^image\//.test(mime || '')) return 'image';
    if (e === 'xls') return 'xls';
    if (e === 'doc') return 'doc';
    return '';
  }
  const MIME = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

  /* ============================================================
     Excel（.xlsx）: 中身を文字にする・セルに書く（ほかの所は触らない）
     ============================================================ */
  const colNum = (s) => { let n = 0; for (const ch of String(s).toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
  const colStr = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const splitRef = (ref) => { const m = String(ref).toUpperCase().match(/^([A-Z]+)(\d+)$/); return m ? { c: colNum(m[1]), r: +m[2] } : null; };
  const attr = (s, k) => { const m = String(s).match(new RegExp('(?:^|\\s)' + k + '="([^"]*)"')); return m ? m[1] : ''; };
  const CELL_RE = /<c\b((?:[^>"]|"[^"]*")*?)(\/>|>([\s\S]*?)<\/c>)/g;
  const ROW_RE = /<row\b((?:[^>"]|"[^"]*")*?)(\/>|>([\s\S]*?)<\/row>)/g;
  function ssText(si) { return unXml((si.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<t\b[^>]*>|<\/t>/g, '')).join('')); }
  const XL = {
    async open(bytes) {
      const zip = await window.JSZip.loadAsync(bytes);
      const wb = await zip.file('xl/workbook.xml').async('string');
      const relsF = zip.file('xl/_rels/workbook.xml.rels');
      const rels = relsF ? await relsF.async('string') : '';
      const ssF = zip.file('xl/sharedStrings.xml');
      const strings = ssF ? ((await ssF.async('string')).match(/<si\b[\s\S]*?<\/si>/g) || []).map(ssText) : [];
      const sheets = [];
      for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
        const name = unXml(attr(m[1], 'name')), rid = attr(m[1], 'r:id'), state = attr(m[1], 'state');
        const rel = (rels.match(new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*>')) || [''])[0];
        let target = attr(rel, 'Target'); if (!target) continue;
        target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
        const path = 'xl/' + target; const f = zip.file(path); if (!f) continue;
        sheets.push({ name, path, hidden: !!state && state !== 'visible', xml: await f.async('string') });
      }
      return { zip, strings, sheets, touched: new Set() };
    },
    cells(book, sh) {
      const out = [];
      for (const m of sh.xml.matchAll(CELL_RE)) {
        const a = m[1], inner = m[3] || '', ref = attr(a, 'r'); if (!ref) continue;
        const t = attr(a, 't'); let v = '';
        if (t === 's') { const i = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; v = i != null ? (book.strings[+i] || '') : ''; }
        else if (t === 'inlineStr') v = ssText('<si>' + ((inner.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '') + '</si>');
        else v = unXml((inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || '');
        out.push({ ref, v, f: /<f\b/.test(inner) });
      }
      return out;
    },
    merges(sh) { return [...sh.xml.matchAll(/<mergeCell\b[^>]*ref="([A-Z]+\d+(?::[A-Z]+\d+)?)"/g)].map((m) => m[1]); },
    describe(book, withValues) {
      return book.sheets.map((sh) => {
        const cells = XL.cells(book, sh).filter((c) => String(c.v).trim() !== '');
        const rows = new Map();
        cells.forEach((c) => { const p = splitRef(c.ref); if (!p) return; if (!rows.has(p.r)) rows.set(p.r, []); rows.get(p.r).push(c); });
        const lines = [...rows.keys()].sort((a, b) => a - b).map((r) => `行${r}: ` + rows.get(r).sort((a, b) => splitRef(a.ref).c - splitRef(b.ref).c).map((c) => `${c.ref}=${JSON.stringify(String(c.v).slice(0, withValues ? 120 : 80))}${c.f ? '(式)' : ''}`).join(' | '));
        return `【シート: ${sh.name}】${sh.hidden ? '（隠しシート）' : ''}\n結合: ${XL.merges(sh).join(', ') || 'なし'}\n` + lines.join('\n');
      }).join('\n\n');
    },
    // 結合セルの中なら左上のセルにする
    topLeft(sh, ref) {
      const p = splitRef(ref); if (!p) return ref;
      for (const m of XL.merges(sh)) {
        const [a, b] = m.split(':'); if (!b) continue; const A = splitRef(a), B = splitRef(b);
        if (p.r >= A.r && p.r <= B.r && p.c >= A.c && p.c <= B.c) return a;
      }
      return ref.toUpperCase();
    },
    cellXml(ref, s, value) {
      const sa = s ? ` s="${s}"` : '';
      if (value === '' || value == null) return `<c r="${ref}"${sa}/>`;
      const v = String(value);
      if (/^-?\d{1,9}(\.\d+)?$/.test(v) && !/^-?0\d/.test(v)) return `<c r="${ref}"${sa}><v>${v}</v></c>`;
      return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
    },
    setCell(sh, ref0, value) {
      const ref = XL.topLeft(sh, ref0); const p = splitRef(ref); if (!p) return false;
      let xml = sh.xml, done = false;
      // 行を探す
      let rowM = null;
      for (const m of xml.matchAll(ROW_RE)) { if (+attr(m[1], 'r') === p.r) { rowM = m; break; } }
      if (rowM) {
        const rowAttrs = rowM[1].replace(/\s+spans="[^"]*"/, '');
        let inner = rowM[3] || '';
        let replaced = false, insertAt = -1;
        inner = inner.replace(CELL_RE, (whole, a) => {
          const r = attr(a, 'r'); if (replaced) return whole;
          if (r.toUpperCase() === ref) { replaced = true; return XL.cellXml(ref, attr(a, 's'), value); }
          return whole;
        });
        if (!replaced) {
          // 列の順に差し込む
          for (const m of inner.matchAll(CELL_RE)) { const q = splitRef(attr(m[1], 'r')); if (q && q.c > p.c) { insertAt = m.index; break; } }
          // 同じ行の左のセルの書式（s）を借りない（枠線などが変わるため）。行に書式があれば r の s を使う
          const cx = XL.cellXml(ref, attr(rowM[1], 's'), value);
          inner = insertAt < 0 ? inner + cx : inner.slice(0, insertAt) + cx + inner.slice(insertAt);
        }
        const rowXml = `<row${rowAttrs}>${inner}</row>`;
        xml = xml.slice(0, rowM.index) + rowXml + xml.slice(rowM.index + rowM[0].length);
        done = true;
      } else {
        const rowXml = `<row r="${p.r}">${XL.cellXml(ref, '', value)}</row>`;
        let at = -1;
        for (const m of xml.matchAll(ROW_RE)) { if (+attr(m[1], 'r') > p.r) { at = m.index; break; } }
        if (at >= 0) xml = xml.slice(0, at) + rowXml + xml.slice(at);
        else if (/<sheetData\s*\/>/.test(xml)) xml = xml.replace(/<sheetData\s*\/>/, `<sheetData>${rowXml}</sheetData>`);
        else xml = xml.replace('</sheetData>', rowXml + '</sheetData>');
        done = true;
      }
      sh.xml = xml;
      return done;
    },
    apply(book, entries) {
      const res = [];
      (entries || []).forEach((e) => {
        if (!e || !e.cell) return;
        const want = String(e.sheet || '').trim();
        const sh = book.sheets.find((s) => s.name.trim() === want) || (want ? null : book.sheets[0]);
        if (!sh) { res.push(`シート「${want}」がありません（${e.label}）`); return; }
        if (XL.setCell(sh, String(e.cell).toUpperCase(), e.value)) book.touched.add(sh.path + '!' + XL.topLeft(sh, e.cell));
      });
      return res;
    },
    async save(book) {
      const zip = book.zip;
      book.sheets.forEach((sh) => zip.file(sh.path, sh.xml));
      // 計算の順番の記録（calcChain）は消す（Excel が開く時に作り直す。残すと「修復」の確認が出ることがある）
      if (zip.file('xl/calcChain.xml')) {
        zip.remove('xl/calcChain.xml');
        const ct = await zip.file('[Content_Types].xml').async('string');
        zip.file('[Content_Types].xml', ct.replace(/<Override\b[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/, ''));
        const rf = zip.file('xl/_rels/workbook.xml.rels');
        if (rf) zip.file('xl/_rels/workbook.xml.rels', (await rf.async('string')).replace(/<Relationship\b[^>]*Target="[^"]*calcChain\.xml"[^>]*\/>/, ''));
      }
      return new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
    },
    // 確認画面用: シートを表にして見せる（書いたセルは黄色）
    previewHtml(book, filled) {
      return book.sheets.filter((s) => !s.hidden).map((sh) => {
        const cells = XL.cells(book, sh); const map = new Map(cells.map((c) => [c.ref.toUpperCase(), c.v]));
        let maxR = 1, maxC = 1;
        cells.forEach((c) => { if (String(c.v).trim() === '') return; const p = splitRef(c.ref); if (p) { maxR = Math.max(maxR, p.r); maxC = Math.max(maxC, p.c); } });
        maxR = Math.min(maxR + 1, 120); maxC = Math.min(maxC + 1, 40);
        const widths = {};
        for (const m of sh.xml.matchAll(/<col\b([^>]*)\/?>/g)) { const a = +attr(m[1], 'min'), b = +attr(m[1], 'max'), w = +attr(m[1], 'width'); if (a && b && w) for (let i = a; i <= Math.min(b, 60); i++) widths[i] = w; }
        const heights = {};
        for (const m of sh.xml.matchAll(ROW_RE)) { const r = +attr(m[1], 'r'), ht = +attr(m[1], 'ht'); if (r && ht) heights[r] = ht; }
        const skip = new Set(), span = new Map();
        XL.merges(sh).forEach((m) => { const [a, b] = m.split(':'); if (!b) return; const A = splitRef(a), B = splitRef(b);
          span.set(a, { rs: B.r - A.r + 1, cs: B.c - A.c + 1 });
          for (let r = A.r; r <= B.r; r++) for (let c = A.c; c <= B.c; c++) if (r !== A.r || c !== A.c) skip.add(colStr(c) + r); });
        let h = `<div class="wa-xl-name">シート: ${esc(sh.name)}</div><div class="wa-xl-wrap"><table class="wa-xl"><colgroup>`;
        for (let c = 1; c <= maxC; c++) h += `<col style="width:${Math.round((widths[c] || 8.43) * 7 + 5)}px">`;
        h += '</colgroup>';
        for (let r = 1; r <= maxR; r++) {
          h += `<tr style="height:${Math.round((heights[r] || 15) * 1.33)}px">`;
          for (let c = 1; c <= maxC; c++) {
            const ref = colStr(c) + r; if (skip.has(ref)) continue;
            const sp = span.get(ref); const v = map.get(ref);
            const hit = filled && filled.has(sh.path + '!' + ref);
            h += `<td${sp ? ` rowspan="${sp.rs}" colspan="${sp.cs}"` : ''}${hit ? ' class="wa-hit"' : ''} title="${ref}">${esc(v == null ? '' : v)}</td>`;
          }
          h += '</tr>';
        }
        return h + '</table></div>';
      }).join('');
    }
  };

  /* ============================================================
     Word（.docx）: 段落を番号付きの文字にする・段落の文字を書き換える
     ============================================================ */
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const DOCX = {
    async open(bytes) {
      const zip = await window.JSZip.loadAsync(bytes);
      const xml = await zip.file('word/document.xml').async('string');
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) throw new Error('Word の中身を読めませんでした');
      return { zip, doc, paras: DOCX.paras(doc), touched: new Set() };
    },
    // 段落（表の中・テキストボックスの中も。古い形の重複＝mc:Fallback の中は除く）
    paras(doc) {
      const all = [...doc.getElementsByTagNameNS(W_NS, 'p')];
      return all.filter((p) => { for (let a = p.parentNode; a; a = a.parentNode) if (a.localName === 'Fallback') return false; return true; });
    },
    text(p) {
      let s = '';
      p.querySelectorAll('*').forEach((el) => { if (el.namespaceURI !== W_NS) return; if (el.localName === 't') s += el.textContent; else if (el.localName === 'tab' && el.parentNode.localName === 'r') s += '\t'; else if (el.localName === 'br') s += '\n'; });
      return s;
    },
    where(p) {
      let tc = null, tr = null, tbl = null, box = false;
      for (let a = p.parentNode; a; a = a.parentNode) {
        if (a.localName === 'tc' && !tc) tc = a; else if (a.localName === 'tr' && !tr) tr = a; else if (a.localName === 'tbl' && !tbl) tbl = a; else if (a.localName === 'txbxContent') box = true;
      }
      const idx = (el) => el ? [...el.parentNode.children].filter((x) => x.localName === el.localName).indexOf(el) + 1 : 0;
      if (tbl) { const all = [...p.ownerDocument.getElementsByTagNameNS(W_NS, 'tbl')]; return `[表${all.indexOf(tbl) + 1} 行${idx(tr)} 列${idx(tc)}]`; }
      return box ? '[枠の中]' : '';
    },
    describe(d) { return d.paras.map((p, i) => `${i}: ${DOCX.where(p)}${JSON.stringify(DOCX.text(p).slice(0, 160))}`).join('\n'); },
    setText(p, value) {
      const doc = p.ownerDocument;
      const runs = [...p.childNodes].filter((n) => n.localName === 'r');
      const isText = (r) => [...r.childNodes].some((n) => ['t', 'tab', 'br'].includes(n.localName));
      const hasObj = (r) => [...r.childNodes].some((n) => ['drawing', 'pict', 'object', 'fldChar', 'instrText'].includes(n.localName));
      // 文字の書式を借りる run: ラベル（「住」「氏」など）は文字の間隔を広げた（spacing・fitText）ことが多いので、広げていない run（ふつうは答えの所）を選ぶ
      const SPREAD = ['fitText', 'spacing'];
      const spread = (r) => [...r.childNodes].some((n) => n.localName === 'rPr' && [...n.childNodes].some((k) => SPREAD.includes(k.localName)));
      const textRuns = runs.filter((r) => isText(r) && !hasObj(r));
      let tmpl = textRuns.slice().reverse().find((r) => !spread(r)) || textRuns[0] || null;
      if (tmpl) [...tmpl.childNodes].forEach((n) => { if (n.localName === 'rPr') [...n.childNodes].forEach((k) => { if (SPREAD.includes(k.localName)) n.removeChild(k); }); });
      // 文字の入った run（図形などは残す）を外す
      runs.forEach((r) => { if (r !== tmpl && isText(r) && !hasObj(r)) r.parentNode.removeChild(r); });
      if (!tmpl) {
        tmpl = doc.createElementNS(W_NS, 'w:r');
        const pr = [...p.childNodes].find((n) => n.localName === 'pPr');
        const rpr = pr && [...pr.childNodes].find((n) => n.localName === 'rPr');
        if (rpr) { const c = doc.createElementNS(W_NS, 'w:rPr'); [...rpr.childNodes].forEach((n) => { if (n.localName !== 'ins' && n.localName !== 'del') c.appendChild(n.cloneNode(true)); }); tmpl.appendChild(c); }
        p.appendChild(tmpl);
      }
      [...tmpl.childNodes].forEach((n) => { if (n.localName !== 'rPr') tmpl.removeChild(n); });
      String(value).split('\n').forEach((line, i) => {
        if (i) tmpl.appendChild(doc.createElementNS(W_NS, 'w:br'));
        line.split('\t').forEach((seg, j) => {
          if (j) tmpl.appendChild(doc.createElementNS(W_NS, 'w:tab'));
          const t = doc.createElementNS(W_NS, 'w:t'); t.setAttribute('xml:space', 'preserve'); t.textContent = seg; tmpl.appendChild(t);
        });
      });
    },
    apply(d, entries) {
      const res = [];
      (entries || []).forEach((e) => {
        const i = Number(e && e.para); if (!(i >= 0)) return;
        const p = d.paras[i]; if (!p) { res.push(`段落 ${i} がありません（${e.label}）`); return; }
        DOCX.setText(p, e.value == null ? '' : e.value); d.touched.add(i);
      });
      return res;
    },
    async save(d) {
      let xml = new XMLSerializer().serializeToString(d.doc);
      if (!/^<\?xml/.test(xml)) xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + xml;
      d.zip.file('word/document.xml', xml);
      return new Uint8Array(await d.zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
    }
  };

  /* ============================================================
     PDF: 画像にする（方眼つき）・文字と○を書き込む（回転したページにも対応）
     ============================================================ */
  async function toB64(blob) {
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function canvasJpeg(cv, q) { return new Promise((res) => cv.toBlob((b) => res(b), 'image/jpeg', q)); }
  function drawGrid(ctx, vw, vh, s) {
    ctx.save();
    for (let x = 0; x <= vw; x += 10) { const big = x % 50 === 0; ctx.strokeStyle = big ? 'rgba(220,0,0,.42)' : 'rgba(0,110,255,.16)'; ctx.lineWidth = big ? 1 : 0.6; ctx.beginPath(); ctx.moveTo(x * s, 0); ctx.lineTo(x * s, vh * s); ctx.stroke(); }
    for (let y = 0; y <= vh; y += 10) { const big = y % 50 === 0; ctx.strokeStyle = big ? 'rgba(220,0,0,.42)' : 'rgba(0,110,255,.16)'; ctx.lineWidth = big ? 1 : 0.6; ctx.beginPath(); ctx.moveTo(0, y * s); ctx.lineTo(vw * s, y * s); ctx.stroke(); }
    ctx.font = 'bold 11px sans-serif'; ctx.textBaseline = 'top';
    const lab = (t, x, y) => { const w = ctx.measureText(t).width; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x - 1, y - 1, w + 2, 13); ctx.fillStyle = '#c00'; ctx.fillText(t, x, y); };
    for (let x = 50; x < vw; x += 50) { lab(String(x), x * s + 2, 1); lab(String(x), x * s + 2, vh * s - 13); }
    for (let y = 50; y < vh; y += 50) { lab(String(y), 1, y * s + 1); lab(String(y), vw * s - 26, y * s + 1); }
    // ページの中にも 100pt ごとに目盛り（真ん中あたりの欄でも位置が読めるように）
    for (let x = 100; x < vw; x += 100) for (let y = 100; y < vh; y += 100) lab(`${x},${y}`, x * s + 2, y * s + 2);
    ctx.restore();
  }
  const PDF = {
    // ページを画像に（grid: 方眼つき）。texts: ページ上の文字と位置（スキャンなら空）
    async describe(bytes, o) {
      const lib = await pdfjs();
      const doc = await lib.getDocument({ data: new Uint8Array(bytes).slice(0), isEvalSupported: false, disableFontFace: false }).promise;
      const pages = [];
      for (let n = 1; n <= Math.min(doc.numPages, o.maxPages || 4); n++) {
        const page = await doc.getPage(n);
        const vp1 = page.getViewport({ scale: 1 });
        const vw = vp1.width, vh = vp1.height;
        const s = (o.maxPx || 1500) / Math.max(vw, vh);
        const vp = page.getViewport({ scale: s });
        const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (o.grid) drawGrid(ctx, vw, vh, s);
        const texts = [];
        if (o.texts !== false) {
          try {
            const tc = await page.getTextContent();
            tc.items.forEach((it) => {
              const str = String(it.str || '').trim(); if (!str) return;
              const tr = lib.Util.transform(vp1.transform, it.transform);
              const fh = Math.hypot(tr[2], tr[3]);
              texts.push({ s: str, x: tr[4], y: tr[5], w: it.width || 0, h: fh || it.height || 0 });
            });
          } catch (e) { /* 文字が取れない PDF */ }
        }
        const blob = await canvasJpeg(cv, o.q || 0.82);
        pages.push({ w: vw, h: vh, image: o.noImage ? '' : await toB64(blob), texts, url: o.keepUrl ? URL.createObjectURL(blob) : '' });
      }
      try { doc.destroy(); } catch (e) { /* なし */ }
      return pages;
    },
    async fromImage(bytes, mime) {
      const L = await pdfLib();
      const doc = await L.PDFDocument.create();
      let img;
      if (/png/.test(mime)) img = await doc.embedPng(bytes);
      else if (/jpe?g/.test(mime)) img = await doc.embedJpg(bytes);
      else {
        // webp などは JPEG にしてから
        const bm = await createImageBitmap(new Blob([bytes], { type: mime }));
        const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height; cv.getContext('2d').drawImage(bm, 0, 0);
        img = await doc.embedJpg(new Uint8Array(await (await canvasJpeg(cv, 0.92)).arrayBuffer()));
      }
      // A4 の大きさに合わせる（縦長なら縦、横長なら横）
      const portrait = img.height >= img.width; const W = portrait ? 595.28 : 841.89, H = portrait ? 841.89 : 595.28;
      const k = Math.min(W / img.width, H / img.height);
      const page = doc.addPage([W, H]);
      page.drawImage(img, { x: (W - img.width * k) / 2, y: (H - img.height * k) / 2, width: img.width * k, height: img.height * k });
      return new Uint8Array(await doc.save());
    },
    async apply(bytes, plan) {
      const L = await pdfLib();
      const doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true });
      doc.registerFontkit(window.fontkit);
      const font = await doc.embedFont(await jpFont(), { subset: true });
      const pages = doc.getPages();
      const black = L.rgb(0, 0, 0), white = L.rgb(1, 1, 1);
      const geo = (n) => {
        const page = pages[(n || 1) - 1]; if (!page) return null;
        const mb = page.getMediaBox(); const r = ((page.getRotation().angle % 360) + 360) % 360;
        const w = mb.width, h = mb.height, ox = mb.x, oy = mb.y;
        // 見た目の座標（左上が原点・下向き）→ PDF の座標
        const to = (vx, vy) => r === 90 ? [ox + vy, oy + vx] : r === 180 ? [ox + w - vx, oy + vy] : r === 270 ? [ox + w - vy, oy + h - vx] : [ox + vx, oy + h - vy];
        return { page, r, to };
      };
      (plan.whiteouts || []).forEach((b) => {
        const g = geo(b.page); if (!g) return;
        const [ax, ay] = g.to(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1)); const [bx, by] = g.to(Math.max(b.x0, b.x1), Math.max(b.y0, b.y1));
        g.page.drawRectangle({ x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(bx - ax), height: Math.abs(by - ay), color: white, borderWidth: 0 });
      });
      (plan.entries || []).forEach((e) => {
        if (!e || e.value == null || String(e.value) === '') return;
        const g = geo(e.page); if (!g) return;
        const size = Math.max(4, Math.min(40, Number(e.size) || 10));
        String(e.value).split('\n').forEach((line, i) => {
          const [x, y] = g.to(Number(e.x) || 0, (Number(e.y) || 0) + i * size * 1.25);
          g.page.drawText(line, { x, y, size, font, color: black, rotate: L.degrees(g.r) });
        });
      });
      (plan.marks || []).forEach((m) => {
        const g = geo(m.page); if (!g) return;
        const [x, y] = g.to(Number(m.cx) || 0, Number(m.cy) || 0);
        const rx = Math.max(2, Number(m.rx) || 8), ry = Math.max(2, Number(m.ry) || 7);
        const side = g.r === 90 || g.r === 270;
        g.page.drawEllipse({ x, y, xScale: side ? ry : rx, yScale: side ? rx : ry, borderColor: black, borderWidth: 0.9 });
      });
      return new Uint8Array(await doc.save({ useObjectStreams: true }));
    }
  };

  /* ============================================================
     書式・記入例を AI に渡す形にする
     ============================================================ */
  async function downloadForm(path) {
    const sb = sbc(); const { data, error } = await sb.storage.from(FORM_BUCKET).download(path);
    if (error || !data) throw new Error('書式のファイルを読めませんでした' + (error ? '（' + error.message + '）' : ''));
    return new Uint8Array(await data.arrayBuffer());
  }
  // level: 0=ふつう 1=小さめ 2=もっと小さく（送る量が多すぎた時）
  async function describeDoc(role, name, fmt, bytes, level) {
    const big = role === 'template' || role === 'filled';
    const px = [big ? 1500 : 1100, big ? 1250 : 900, big ? 1050 : 700][level || 0];
    const q = [0.82, 0.7, 0.6][level || 0];
    if (fmt === 'pdf') return { role, name, format: 'pdf', pages: await PDF.describe(bytes, { grid: big, maxPx: px, q, maxPages: big ? 4 : 2 }) };
    if (fmt === 'xlsx') { const b = await XL.open(bytes); return { role, name, format: 'xlsx', sheets: XL.describe(b, role !== 'template') }; }
    if (fmt === 'docx') { const d = await DOCX.open(bytes); return { role, name, format: 'docx', paras: DOCX.describe(d) }; }
    return null;
  }

  /* ============================================================
     AI を呼ぶ
     ============================================================ */
  async function ai(action, payload) {
    const sb = sbc(); const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    const body = JSON.stringify(Object.assign({ action }, payload));
    if (body.length > MAX_BODY) { const e = new Error('送る量が多すぎます'); e.tooBig = true; throw e; }
    let r;
    try { r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || '') }, body }); }
    catch (e) { throw new Error('AI につながりませんでした（' + (e.message || e) + '）'); }
    const j = await r.json().catch(() => ({ error: 'AI の答えを読めませんでした（' + r.status + '）' }));
    if (r.status === 413) { const e = new Error('送る量が多すぎます'); e.tooBig = true; throw e; }
    if (!r.ok || j.error) throw new Error(j.error || ('AI でエラー（' + r.status + '）'));
    return j;
  }

  /* ============================================================
     協力会社マスター（partners）
     ============================================================ */
  const P = { list: null, supported: true, syncing: null };
  const nameKey = (s) => String(s || '').normalize('NFKC').replace(/株式会社|有限会社|合同会社|\(株\)|\(有\)|㈱|㈲|\s|　/g, '').toLowerCase();
  async function loadPartners() {
    const sb = sbc(); if (!sb) { P.supported = false; P.list = []; return P.list; }
    const { data, error } = await sb.from('partners').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (error) { P.supported = false; P.list = []; return P.list; }
    P.supported = true; P.list = (data || []).map((r) => Object.assign({}, r, { workers: Array.isArray(r.workers) ? r.workers : [] }));
    return P.list;
  }
  // 劇場情報の連絡先から、AI が協力会社だけを選んで足す（まだ見ていない連絡先だけ。何回かに分けて）
  function syncPartners() {
    if (P.syncing) return P.syncing;
    P.syncing = (async () => {
      const sb = sbc(); if (!sb || !P.supported) return 0;
      let added = 0;
      // 全部見終わるまで続ける（1回 60 件。1000 件ほどなら 10 分ほど。画面を閉じたら、次に開いた時に続きから）
      for (let round = 0; round < 25; round++) {
        P.progress = { round: round + 1, added };
        const { data, error } = await sb.from('theater_contacts').select('id,company,theater,category,maker,vendor,person,phone,email,note,partner_checked').eq('partner_checked', false).limit(60);
        if (error || !data || !data.length) break;
        const list = data.filter((c) => String(c.vendor || '').trim());
        let results = [];
        if (list.length) results = (await ai('classify', { contacts: list.map((c) => ({ id: c.id, vendor: c.vendor, category: c.category, person: c.person, phone: c.phone, email: c.email, note: c.note, theater: c.theater })) })).results || [];
        if (!P.list) await loadPartners();
        for (const r of results) {
          if (!r.is_partner || !String(r.company || '').trim()) continue;
          const c = list.find((x) => String(x.id) === String(r.id)) || {};
          const key = nameKey(r.company);
          if (!key || key === nameKey(SELF)) continue;
          const ex = P.list.find((p) => p.name_key === key);
          if (ex) {
            const th = String(ex.theaters || '').split('、').filter(Boolean);
            const patch = {};
            if (c.theater && !th.includes(c.theater)) patch.theaters = th.concat(c.theater).join('、');
            if (!ex.phone && r.phone) patch.phone = r.phone;
            if (!ex.address && r.address) patch.address = r.address;
            if (Object.keys(patch).length) { patch.updated_at = new Date().toISOString(); await sb.from('partners').update(patch).eq('id', ex.id); Object.assign(ex, patch); }
          } else {
            const row = { name: String(r.company).normalize('NFKC').trim(), name_key: key, phone: r.phone || '', address: r.address || '', email: '', workers: [], active: true, source: 'auto', theaters: c.theater || '', note: c.category || '' };
            const ins = await sb.from('partners').insert(row).select();
            if (!ins.error) { P.list.push(Object.assign({ workers: [] }, (ins.data && ins.data[0]) || row)); added++; }
          }
        }
        try { if (P.onProgress) P.onProgress(); } catch (e) { /* なし */ }
        const ids = data.map((c) => c.id);
        const up = await sb.from('theater_contacts').update({ partner_checked: true }).in('id', ids);
        if (up.error) break;
        if (data.length < 60) break;
      }
      return added;
    })().catch((e) => { console.warn('協力会社の自動追加', e); return 0; }).finally(() => { P.syncing = null; });
    return P.syncing;
  }
  async function rememberWorkers(groups) {
    const sb = sbc(); if (!sb || !P.supported) return;
    if (!P.list) await loadPartners();
    for (const g of groups || []) {
      if (!g.company || nameKey(g.company) === nameKey(SELF)) continue;
      const key = nameKey(g.company);
      let p = P.list.find((x) => x.name_key === key);
      const names = (g.names || []).map((n) => String(n).trim()).filter(Boolean);
      if (!p) {
        const row = { name: g.company.trim(), name_key: key, phone: g.phone || '', address: g.address || '', email: '', workers: names.map((n) => ({ name: n, phone: n === g.leader ? (g.leader_phone || '') : '' })), active: true, source: 'workapp', theaters: '', note: '' };
        const ins = await sb.from('partners').insert(row).select(); if (!ins.error) P.list.push(Object.assign({}, row, (ins.data && ins.data[0]) || {}));
        continue;
      }
      const old = p.workers || [];
      const merged = names.map((n) => { const o = old.find((w) => w.name === n) || {}; return { name: n, phone: (n === g.leader && g.leader_phone) ? g.leader_phone : (o.phone || '') }; })
        .concat(old.filter((w) => !names.includes(w.name))).slice(0, 40);
      const patch = { workers: merged, updated_at: new Date().toISOString() };
      if (!p.phone && g.phone) patch.phone = g.phone;
      if (!p.address && g.address) patch.address = g.address;
      await sb.from('partners').update(patch).eq('id', p.id); Object.assign(p, patch);
    }
  }
  async function openPartners() {
    const sb = sbc(); if (!sb) { K().say('協力会社マスターは、ログインして使ってください'); return; }
    await loadPartners();
    if (!P.supported) { K().say('協力会社の表がありません。SETUP_WORKAPP_AUTO.sql を実行してください。'); return; }
    document.querySelectorAll('#waPartnerDlg').forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'waPartnerDlg';
    const SRC = { auto: '🤖 劇場情報から', manual: '✋ 手で足した', workapp: '📝 申請書から' };
    let q = '';
    const draw = (msg) => {
      const rows = P.list.slice().sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name, 'ja'))
        .filter((p) => !q || (p.name + p.theaters + (p.workers || []).map((w) => w.name).join('')).includes(q));
      ov.innerHTML = `<div class="kt-dialog kt-dialog-wide wa-pt-dlg"><div class="kt-dlg-head">🤝 協力会社マスター<button type="button" class="close-btn" data-x>×</button></div>
        <div class="kt-dlg-body">
          <p class="ms-note">作業申請書の「協力会社」「作業者」の候補に出ます。劇場情報のパートナー連絡先から、AI が協力会社だけを選んで自動で足します（${P.syncing ? `<b>今、劇場情報の連絡先を見ています…（${P.progress ? P.progress.round * 60 : 0} 件目あたり。この画面を開いたまま待つと、足した会社がここに出ます）</b>` : '新しい連絡先が入ると、次に開いた時に足します'}）。<br>
          協力会社ではない会社が入っていたら「候補に出す」を外してください。作業者は、作業申請書で入れた人を自動で覚えます（新しい順）。</p>
          <div class="wa-pt-tools"><input type="search" class="tm-input" id="waPtQ" placeholder="🔍 会社名・劇場・作業者で探す" value="${esc(q)}"><span class="ms-note">${rows.length} 社${msg ? '　' + esc(msg) : ''}</span></div>
          <div class="wa-pt-wrap"><table class="ms-table wa-pt-table"><thead><tr><th>会社名</th><th>電話</th><th>住所</th><th>作業者（「、」で区切る）</th><th>候補に出す</th><th>出どころ</th><th></th></tr></thead><tbody>
          ${rows.map((p) => `<tr class="${p.active === false ? 'mst-left' : ''}" data-pid="${esc(p.id)}">
            <td><input type="text" class="tm-input" data-pf="name" value="${esc(p.name)}"></td>
            <td><input type="tel" class="tm-input wa-pt-phone" data-pf="phone" value="${esc(p.phone || '')}"></td>
            <td><input type="text" class="tm-input" data-pf="address" value="${esc(p.address || '')}"></td>
            <td><input type="text" class="tm-input" data-pf="workers" value="${esc((p.workers || []).map((w) => w.name).join('、'))}"></td>
            <td class="wa-c"><input type="checkbox" data-pf="active"${p.active !== false ? ' checked' : ''}></td>
            <td class="sub" title="${esc(p.theaters || '')}">${SRC[p.source] || esc(p.source || '')}${p.theaters ? '<br><small>' + esc(String(p.theaters).slice(0, 30)) + '</small>' : ''}</td>
            <td><button type="button" class="mini-btn danger" data-pdel="${esc(p.id)}" title="消す">🗑</button></td></tr>`).join('') || '<tr><td colspan="7" class="sub">まだありません</td></tr>'}
          </tbody></table></div>
          <div class="acct-add"><input type="text" id="waPtName" class="tm-input" placeholder="足す協力会社の名前"><input type="tel" id="waPtPhone" class="tm-input" placeholder="電話"><button type="button" data-padd>＋ 協力会社を足す</button></div>
        </div><div class="kt-dlg-foot"><span class="ms-note">変えた所はすぐ保存されます</span><button type="button" data-x>閉じる</button></div></div>`;
      const qi = ov.querySelector('#waPtQ'); qi.addEventListener('input', () => { q = qi.value.trim(); const pos = qi.selectionStart; draw(); const n = ov.querySelector('#waPtQ'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* なし */ } });
    };
    draw();
    document.body.appendChild(ov);
    P.onProgress = () => { if (document.body.contains(ov) && !ov.contains(document.activeElement)) draw(); };
    if (!P.syncing) syncPartners().then((n) => { if (document.body.contains(ov)) draw(n ? `劇場情報から ${n} 社を足しました` : ''); });
    else P.syncing.then(() => { if (document.body.contains(ov)) draw(); });
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]') || e.target === ov) { ov.remove(); return; }
      if (e.target.closest('[data-padd]')) {
        const name = ov.querySelector('#waPtName').value.trim(); const phone = ov.querySelector('#waPtPhone').value.trim();
        if (!name) { K().say('会社名を入れてください'); return; }
        const key = nameKey(name);
        if (P.list.some((p) => p.name_key === key)) { K().say(`「${name}」はもうあります`); return; }
        const ins = await sbc().from('partners').insert({ name, name_key: key, phone, address: '', email: '', workers: [], active: true, source: 'manual', theaters: '', note: '' }).select();
        if (ins.error) { K().say('足せませんでした: ' + ins.error.message); return; }
        P.list.push(Object.assign({ workers: [] }, ins.data && ins.data[0])); draw(`${name} を足しました`); return;
      }
      const del = e.target.closest('[data-pdel]');
      if (del) {
        const p = P.list.find((x) => String(x.id) === del.dataset.pdel); if (!p) return;
        if (!(await K().ask(`「${p.name}」を消しますか？（劇場情報から自動で足し直さないように、消さずに「候補に出す」を外す方がおすすめです）`, { ok: '🗑 消す', danger: true }))) return;
        const r = await sbc().from('partners').delete().eq('id', p.id);
        if (r.error) { K().say('消せませんでした: ' + r.error.message); return; }
        P.list = P.list.filter((x) => x !== p); draw();
      }
    });
    ov.addEventListener('change', async (e) => {
      const f = e.target.dataset.pf; if (!f) return;
      const tr = e.target.closest('[data-pid]'); const p = P.list.find((x) => String(x.id) === tr.dataset.pid); if (!p) return;
      const patch = { updated_at: new Date().toISOString() };
      if (f === 'active') patch.active = e.target.checked;
      else if (f === 'workers') { const names = e.target.value.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean); patch.workers = names.map((n) => (p.workers || []).find((w) => w.name === n) || { name: n, phone: '' }); }
      else if (f === 'name') { const v = e.target.value.trim(); if (!v) { e.target.value = p.name; return; } patch.name = v; patch.name_key = nameKey(v); }
      else patch[f] = e.target.value.trim();
      const r = await sbc().from('partners').update(patch).eq('id', p.id);
      if (r.error) { K().say('保存できませんでした: ' + r.error.message); return; }
      Object.assign(p, patch); if (f === 'active') draw();
    });
  }

  /* ============================================================
     作業申請書を作る画面
     ============================================================ */
  let S = null;   // 今の作業（1つだけ）
  const yymmdd = (iso) => { const d = String(iso || isoDay(new Date())).slice(0, 10).split('-'); return d[0].slice(2) + d[1] + d[2]; };
  const cleanName = (s) => String(s || '').replace(/[\\/:*?"<>|\s　]/g, '').slice(0, 40);

  async function findForms(theater) {
    const sb = sbc();
    const { data, error } = await sb.from('doc_files').select('*').eq('theater', theater).is('deleted_at', null);
    if (error) throw new Error('書類棚を読めませんでした（' + error.message + '）');
    const rows = (data || []).filter((r) => r.data && r.data.path);
    const ts = (r) => Math.max(Number(r.data.modified) || 0, Date.parse(r.updated_at || r.created_at || '') || 0);
    const templates = rows.filter((r) => (r.data.kind || 'workapp_template') !== 'workapp_example').sort((a, b) => ts(b) - ts(a));
    const examples = rows.filter((r) => r.data.kind === 'workapp_example').sort((a, b) => ts(b) - ts(a));
    return { templates, examples };
  }
  async function lastAnswers(theater, rPerson) {
    const sb = sbc();
    const { data } = await sb.from('case_files').select('case_id,meta,created_at,status').eq('kind', 'workapp').is('deleted_at', null).order('created_at', { ascending: false }).limit(200);
    const rows = (data || []).filter((r) => r.meta && r.meta.answers);
    const same = rows.find((r) => r.meta.theater === theater);
    const leader = rows.find((r) => r.meta.answers.leader && r.meta.answers.leader.staff === rPerson);
    return { same: same ? same.meta.answers : null, leader: leader ? leader.meta.answers.leader : null };
  }

  function overlay() {
    document.querySelectorAll('#waDlg').forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'waDlg';
    ov.innerHTML = '<div class="kt-dialog wa-dlg"><div class="kt-dlg-head"><span id="waTitle">📝 作業申請書を作る</span><button type="button" class="close-btn" data-wax>×</button></div><div class="kt-dlg-body" id="waBody"></div><div class="kt-dlg-foot" id="waFoot"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-wax]')) { if (S && S.busy && !(await K().ask('AI が作っている途中です。やめますか？', { ok: 'やめる' }))) return; close(); }
    });
    return ov;
  }
  function close() { if (S) S.closed = true; S = null; document.querySelectorAll('#waDlg').forEach((x) => x.remove()); }
  const body = () => document.getElementById('waBody');
  const foot = () => document.getElementById('waFoot');
  function busy(msg, sub) {
    body().innerHTML = `<div class="wa-busy"><div class="wa-spin"></div><div><b>${esc(msg)}</b>${sub ? `<div class="ms-note">${esc(sub)}</div>` : ''}</div></div>`;
    foot().innerHTML = '<button type="button" data-wax>やめる</button>';
  }

  const PURPOSE_LABEL = { survey: '調査', work: '作業' };
  const mdOf = (iso) => { const m = String(iso || '').match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${+m[1]}/${+m[2]}` : ''; };
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const mdw = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return ''; const d = new Date(+m[1], +m[2] - 1, +m[3]); return `${+m[2]}/${+m[3]}（${WD[d.getDay()]}）`; };
  // purpose: 'survey'（調査）/ 'work'（作業）。調査と作業で、作業申請書は別々に作る
  async function open(caseId, purpose) {
    const sb = sbc(); if (!sb) { K().say('作業申請書の自動作成は、ログインして使ってください'); return; }
    const c = DB().caseInfo ? DB().caseInfo(caseId) : null;
    if (!c) { K().say('案件が見つかりません'); return; }
    if (!c.theater) { K().say('先に案件の「劇場名」を入れて保存してください'); return; }
    const pp = purpose === 'survey' ? 'survey' : 'work';
    const caseDate = pp === 'survey' ? c.surveyDate : c.workStartDate;
    if (!caseDate) { K().say(`先に案件の「${pp === 'survey' ? '調査日' : '作業開始日'}」を入れて保存してください`); return; }
    S = { caseId: String(caseId), c, busy: false, purpose: pp, caseDate };
    const my = S;
    overlay();
    document.getElementById('waTitle').textContent = `📝 作業申請書を作る（${PURPOSE_LABEL[pp]} ${mdw(caseDate)}）— ${c.theater}`;
    busy('書類棚で、この劇場の書式を探しています…');
    try {
      const [forms, last, , to] = await Promise.all([findForms(c.theater), lastAnswers(c.theater, c.rPerson), loadPartners(), DB().mailTo ? DB().mailTo(caseId) : '']);
      if (my.closed) return;
      S.forms = forms; S.last = last; S.mailTo = to || '';
      syncPartners();   // 劇場情報から協力会社を足す（後ろで）
      // 作成中の申請書があれば、続きから直せる
      const { data: drafts } = await sb.from('case_files').select('*').eq('case_id', S.caseId).eq('kind', 'workapp').eq('status', 'draft').is('deleted_at', null).order('created_at', { ascending: false }).limit(20);
      const draft = (drafts || []).find((d) => d.meta && d.meta.plan && (d.meta.purpose === 'survey' ? 'survey' : 'work') === pp) || null;
      if (!forms.templates.length) return noTemplate();
      if (draft && await K().ask(`作成中の作業申請書（${draft.name}）があります。続きから直しますか？\n「新しく作る」を押すと、最初から作り直します。`, { ok: '続きから直す', cancel: '新しく作る' })) return resumeDraft(draft);
      if (my.closed) return;
      if (forms.templates.length > 1) return pickTemplate();
      S.tpl = forms.templates[0];
      return startAsk();
    } catch (e) { fail(e); }
  }
  function noTemplate() {
    body().innerHTML = `<p>「${esc(S.c.theater)}」の作業申請書の書式が、書類棚にありません。</p>
      <p class="ms-note">☰ その他 →「📁 書類棚」→「📝 作業申請書の書式」で、この劇場の書式（PDF・Excel・Word）を入れてください。前に出した申請書（記入例）も入れておくと、書き方を合わせます。</p>`;
    foot().innerHTML = '<button type="button" data-wax>閉じる</button>';
  }
  function pickTemplate() {
    body().innerHTML = `<p>この劇場の書式が ${S.forms.templates.length} つあります。どれに書きますか？</p>
      <div class="wa-pick">${S.forms.templates.map((t, i) => `<button type="button" class="wa-pick-b" data-watpl="${i}">📄 ${esc(t.name || t.data.file_name)}<small>${esc(t.data.file_name || '')}</small></button>`).join('')}</div>`;
    foot().innerHTML = '<button type="button" data-wax>やめる</button>';
    body().querySelectorAll('[data-watpl]').forEach((b) => b.addEventListener('click', () => { S.tpl = S.forms.templates[+b.dataset.watpl]; startAsk(); }));
  }
  function fail(e) {
    if (!S) return;
    S.busy = false;
    body().innerHTML = `<p class="wa-err">うまくいきませんでした: ${esc(e && e.message || e)}</p><p class="ms-note">もう一度試すか、書式のファイルを確かめてください。</p>`;
    foot().innerHTML = '<button type="button" data-wax>閉じる</button>' + (S.answers ? '<button type="button" class="primary" data-waretry>もう一度作る</button>' : '');
    const rb = foot().querySelector('[data-waretry]'); if (rb) rb.addEventListener('click', () => make());
  }

  // ---------- 書式を読む（テンプレートの準備） ----------
  async function prepareTemplate() {
    if (S.tplReady) return;
    const d = S.tpl.data;
    let fmt = formatOf(d.file_name, d.mime);
    if (fmt === 'xls') throw new Error('古い Excel（.xls）の書式です。Excel で .xlsx に保存し直して、書類棚に入れ直してください');
    if (fmt === 'doc') throw new Error('古い Word（.doc）の書式です。Word で .docx に保存し直して、書類棚に入れ直してください');
    if (!fmt) throw new Error('この形の書式（' + (d.file_name || '') + '）には書き込めません（PDF・Excel・Word・画像だけ）');
    let bytes = await downloadForm(d.path);
    if (fmt === 'image') { bytes = await PDF.fromImage(bytes, d.mime || ('image/' + extOf(d.file_name))); fmt = 'pdf'; }
    S.fmt = fmt; S.tplBytes = bytes; S.tplReady = true;
  }
  async function buildDocs(level) {
    const docs = [await describeDoc('template', S.tpl.data.file_name, S.fmt, S.tplBytes, level)];
    for (const ex of S.forms.examples.slice(0, 2)) {
      try {
        const fmt = formatOf(ex.data.file_name, ex.data.mime);
        let b = await downloadForm(ex.data.path), f = fmt;
        if (fmt === 'image') { b = await PDF.fromImage(b, ex.data.mime || ('image/' + extOf(ex.data.file_name))); f = 'pdf'; }
        const d = await describeDoc('example', ex.data.file_name, f, b, level);
        if (d) docs.push(d);
      } catch (e) { console.warn('記入例を読めませんでした', ex.data.file_name, e); }
    }
    return docs;
  }
  // 送る量が多すぎた時は、画像を小さくしてやり直す
  async function aiWithDocs(action, extra, docsFn) {
    for (let level = 0; level < 3; level++) {
      const docs = await docsFn(level);
      try { return await ai(action, Object.assign({ case: caseForAi(), answers: S.answers || {}, docs }, extra || {})); }
      catch (e) { if (!e.tooBig || level === 2) throw e; }
    }
    return null;
  }
  function caseForAi() {
    const c = S.c;
    return { theater: c.theater, company: c.company, title: c.title, content: c.content, category: c.category, survey_date: c.surveyDate, work_start_date: c.workStartDate, work_end_date: c.workEndDate, r_person: c.rPerson, today: isoDay(new Date()) };
  }

  // ---------- 1) 先に聞く ----------
  async function startAsk() {
    const my = S;
    busy('書式を読み込んでいます…');
    try { await prepareTemplate(); } catch (e) { return fail(e); }
    if (my.closed) return;
    const c = S.c, last = S.last || {}, prev = last.same || {};
    const staff = (DB().staff ? DB().staff() : []) || [];
    const st = staff.find((x) => x.name === c.rPerson) || {};
    const lead = last.leader || {};
    S.form = {
      start_date: S.caseDate, end_date: S.purpose === 'survey' ? S.caseDate : (c.workEndDate && c.workEndDate >= S.caseDate ? c.workEndDate : S.caseDate),
      start_time: (prev.work && prev.work.start_time) || '09:00', end_time: (prev.work && prev.work.end_time) || '18:00',
      place: '', content: S.purpose === 'survey' ? '現地調査（' + (c.title || c.estimateName || c.category || '') + '）' : (c.title || c.estimateName || ''), kubun: '',
      leader_name: lead.name || c.rPerson || '', leader_phone: st.phone || lead.phone || '',
      partners: (prev.partners || []).map((p) => p.name).filter((n) => (P.list || []).some((x) => x.name === n && x.active !== false)),
      workers: {}, headcount: '',
      vehicle: (prev.vehicle && prev.vehicle.use) || '無', vehicle_detail: (prev.vehicle && prev.vehicle.detail) || '',
      fire: '無', fire_detail: '', noise: '無', odor: '無', equipment: prev.equipment || '', memo: '', extra: {}
    };
    (prev.workers || []).forEach((g) => { S.form.workers[g.company] = (g.names || []).join('、'); });
    if (!S.form.workers[SELF]) S.form.workers[SELF] = c.rPerson || '';
    S.plan = null; S.planErr = '';
    drawAsk();
    // AI が書式と記入例を読む（質問・作業場所の案・提出期限）
    (async () => {
      try {
        S.answers = collect();
        const r = await aiWithDocs('plan', {}, buildDocs);
        if (my.closed || S !== my) return;
        S.plan = r || {};
        if (document.getElementById('waAsk')) readForm();   // 待っている間に入れた値を先に読む（AI の案で消さない）
        const f = S.form;
        if (!f.place && S.plan.work_place) f.place = S.plan.work_place;
        if (S.plan.work_content && (!f.content || f.content === c.title)) f.content = S.plan.work_content || f.content;
        if (!f.kubun && S.plan.kubun) f.kubun = S.plan.kubun;
        (S.plan.questions || []).forEach((q) => { if (!(q.key in f.extra)) f.extra[q.key] = (prev.extra && prev.extra[q.key]) || q.default || (q.kind === 'yesno' ? '無' : ''); });
      } catch (e) { if (my.closed || S !== my) return; S.planErr = e.message || String(e); if (document.getElementById('waAsk')) readForm(); }
      if (document.getElementById('waAsk')) drawAsk();
    })();
  }
  function partnerNames() { return (P.list || []).filter((p) => p.active !== false).map((p) => p.name); }
  function workerCands(company) {
    if (company === SELF) return ((DB().staff ? DB().staff() : []) || []).filter((x) => x.active !== false).map((x) => x.name);
    const p = (P.list || []).find((x) => x.name === company); return p ? (p.workers || []).map((w) => w.name) : [];
  }
  function drawAsk() {
    const f = S.form, pl = S.plan;
    const yn = (k, v) => `<span class="wa-yn">${['無', '有'].map((o) => `<label><input type="radio" name="wa_${k}" value="${o}"${v === o ? ' checked' : ''}> ${o}</label>`).join('')}</span>`;
    const groups = [SELF].concat(f.partners);
    const aiBox = pl ? `<div class="wa-ai">
        <div><b>🤖 書式を読みました</b>${pl.form_title ? '：' + esc(pl.form_title) : ''}</div>
        ${pl.deadline ? `<div>⏰ 提出期限: ${esc(pl.deadline)}</div>` : ''}
        ${pl.deadline_warning ? `<div class="wa-warn">⚠ ${esc(pl.deadline_warning)}</div>` : ''}
        ${pl.other_docs ? `<div>📎 ${esc(pl.other_docs)}</div>` : ''}
        ${pl.notes ? `<div class="ms-note">${esc(pl.notes)}</div>` : ''}</div>`
      : S.planErr ? `<div class="wa-ai wa-err">🤖 書式を読めませんでした（${esc(S.planErr)}）。下の答えだけで作れます。</div>`
        : '<div class="wa-ai"><span class="wa-spin sm"></span> 🤖 AI が書式と記入例を読んでいます（30秒ほど）。その間に下を入れてください。</div>';
    const exN = S.forms.examples.length;
    body().innerHTML = `<div id="waAsk" class="wa-ask">
      <div class="wa-pp-h">${S.purpose === 'survey' ? '🔍 調査' : '🛠 作業'}の作業申請書（${esc(mdw(S.caseDate))}）</div>
      <div class="wa-src">📄 書式: <b>${esc(S.tpl.data.file_name || S.tpl.name)}</b>　📑 記入例: ${exN ? exN + ' 件（新しい ' + Math.min(exN, 2) + ' 件に合わせます）' : 'なし（記入例を書類棚に入れると、書き方を合わせます）'}</div>
      ${aiBox}
      <div class="wa-grid">
        <label>作業日</label><div><input type="date" id="wa_sd" value="${esc(f.start_date)}"> <input type="time" id="wa_st" value="${esc(f.start_time)}"> 〜 <input type="date" id="wa_ed" value="${esc(f.end_date)}"> <input type="time" id="wa_et" value="${esc(f.end_time)}"></div>
        <label>作業場所</label><div><input type="text" id="wa_place" class="tm-input" value="${esc(f.place)}" placeholder="${pl ? '' : 'AI が案を出します'}例: 映写室・屋上機械置場"></div>
        <label>作業内容</label><div><input type="text" id="wa_content" class="tm-input" value="${esc(f.content)}"></div>
        ${pl && pl.kubun || f.kubun ? `<label>区分</label><div><input type="text" id="wa_kubun" class="tm-input" value="${esc(f.kubun)}"></div>` : ''}
        <label>当日責任者</label><div><input type="text" id="wa_ln" class="tm-input wa-s" value="${esc(f.leader_name)}" placeholder="名前（フルネーム）"> 携帯 <input type="tel" id="wa_lp" class="tm-input wa-s" value="${esc(f.leader_phone)}" placeholder="090-0000-0000">
          ${f.leader_phone ? '' : '<div class="ms-note">携帯は ☰ その他 →「🗂 マスター編集」に入れておくと、次から自動で入ります</div>'}</div>
        <label>協力会社</label><div class="wa-pts">${P.supported ? `${partnerNames().map((n) => `<label class="wa-chip"><input type="checkbox" data-wapt="${esc(n)}"${f.partners.includes(n) ? ' checked' : ''}> ${esc(n)}</label>`).join('') || '<span class="ms-note">協力会社マスターが空です</span>'}
          <span class="wa-add"><input type="text" id="wa_newpt" class="tm-input wa-s" placeholder="ほかの会社"><button type="button" class="mini-btn" data-waaddpt>＋</button></span>${P.syncing ? '<span class="ms-note">（劇場情報から協力会社を探しています…）</span>' : ''}`
          : '<input type="text" id="wa_newpt" class="tm-input" placeholder="協力会社の名前（協力会社マスターはまだありません）">'}</div>
        <label>作業者</label><div class="wa-workers">${groups.map((g) => {
          const cands = workerCands(g).filter((n) => !String(f.workers[g] || '').split(/[、,，]/).map((s) => s.trim()).includes(n)).slice(0, 12);
          return `<div class="wa-wg"><span class="wa-wg-h">${esc(g)}</span><input type="text" class="tm-input" data-wawk="${esc(g)}" value="${esc(f.workers[g] || '')}" placeholder="名前を「、」で区切る">
            ${cands.length ? `<div class="wa-cands">${cands.map((n) => `<button type="button" class="wa-cand" data-wacand="${esc(g)}" data-name="${esc(n)}">＋${esc(n)}</button>`).join('')}</div>` : ''}</div>`;
        }).join('')}
          <div>人数 <input type="number" id="wa_hc" class="tm-input wa-xs" min="0" value="${esc(f.headcount)}" placeholder="${countWorkers()}"> 名 <span class="ms-note">（空なら名前の数）</span></div></div>
        <label>車両・駐車</label><div>${yn('veh', f.vehicle)} <input type="text" id="wa_vd" class="tm-input" value="${esc(f.vehicle_detail)}" placeholder="有の時: 車種・車番・台数・駐車場所"></div>
        <label>火気</label><div>${yn('fire', f.fire)} <input type="text" id="wa_fd" class="tm-input wa-s" value="${esc(f.fire_detail)}" placeholder="有の時: 溶接・バーナーなど"></div>
        <label>騒音・振動</label><div>${yn('noise', f.noise)}</div>
        <label>臭気・粉じん</label><div>${yn('odor', f.odor)}</div>
        <label>持込機材</label><div><input type="text" id="wa_eq" class="tm-input" value="${esc(f.equipment)}" placeholder="例: 脚立・工具一式・真空ポンプ（無ければ空）"></div>
        ${(pl && pl.questions || []).map((q) => `<label title="${esc(q.why || '')}">🤖 ${esc(q.label)}</label><div>${q.kind === 'yesno' ? yn('x_' + q.key, f.extra[q.key] || '無')
          : q.kind === 'choice' ? `<select data-waex="${esc(q.key)}">${(q.choices || []).map((o) => `<option${f.extra[q.key] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
            : `<input type="text" class="tm-input" data-waex="${esc(q.key)}" value="${esc(f.extra[q.key] || '')}">`}${q.why ? `<div class="ms-note">${esc(q.why)}</div>` : ''}</div>`).join('')}
        <label>AI への一言</label><div><input type="text" id="wa_memo" class="tm-input" value="${esc(f.memo)}" placeholder="任意。例: 鍵は屋上だけ借りたい"></div>
      </div></div>`;
    foot().innerHTML = `<span class="ms-note">申請者は「${esc(APPLICANT.company)}・${esc(APPLICANT.address)}・TEL ${esc(APPLICANT.tel)}」で書きます</span><button type="button" data-wax>やめる</button><button type="button" class="primary" data-wago>📝 作る</button>`;
    const B = body();
    B.querySelectorAll('[data-wapt]').forEach((x) => x.addEventListener('change', () => { readForm(); drawAsk(); }));
    const addPt = B.querySelector('[data-waaddpt]');
    if (addPt) addPt.addEventListener('click', () => { readForm(); const v = (B.querySelector('#wa_newpt').value || '').trim(); if (v && !S.form.partners.includes(v)) S.form.partners.push(v); drawAsk(); });
    B.querySelectorAll('[data-wacand]').forEach((b) => b.addEventListener('click', () => {
      readForm(); const g = b.dataset.wacand; const cur = String(S.form.workers[g] || '').split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
      cur.push(b.dataset.name); S.form.workers[g] = cur.join('、'); drawAsk();
    }));
    B.querySelectorAll('[data-wawk]').forEach((x) => x.addEventListener('input', () => { const hc = B.querySelector('#wa_hc'); readForm(); if (hc) hc.placeholder = String(countWorkers()); }));
    foot().querySelector('[data-wago]').addEventListener('click', () => { readForm(); make(); });
  }
  function countWorkers() { return Object.values(S.form.workers).reduce((n, v) => n + String(v || '').split(/[、,，]/).map((s) => s.trim()).filter(Boolean).length, 0); }
  function readForm() {
    const B = body(); if (!B || !B.querySelector('#waAsk')) return;
    const v = (id) => { const el = B.querySelector('#' + id); return el ? el.value.trim() : undefined; };
    const r = (k) => { const el = B.querySelector(`input[name="wa_${k}"]:checked`); return el ? el.value : undefined; };
    const f = S.form;
    const set = (k, val) => { if (val !== undefined) f[k] = val; };
    set('start_date', v('wa_sd')); set('start_time', v('wa_st')); set('end_date', v('wa_ed')); set('end_time', v('wa_et'));
    set('place', v('wa_place')); set('content', v('wa_content')); set('kubun', v('wa_kubun'));
    set('leader_name', v('wa_ln')); set('leader_phone', v('wa_lp'));
    set('headcount', v('wa_hc')); set('vehicle', r('veh')); set('vehicle_detail', v('wa_vd'));
    set('fire', r('fire')); set('fire_detail', v('wa_fd')); set('noise', r('noise')); set('odor', r('odor'));
    set('equipment', v('wa_eq')); set('memo', v('wa_memo'));
    const pts = [...B.querySelectorAll('[data-wapt]')];
    if (pts.length) f.partners = pts.filter((x) => x.checked).map((x) => x.dataset.wapt).concat(f.partners.filter((n) => !pts.some((x) => x.dataset.wapt === n)));
    else if (!P.supported) { const t = v('wa_newpt'); f.partners = t ? [t] : []; }
    B.querySelectorAll('[data-wawk]').forEach((x) => { f.workers[x.dataset.wawk] = x.value.trim(); });
    B.querySelectorAll('[data-waex]').forEach((x) => { f.extra[x.dataset.waex] = x.value.trim(); });
    (S.plan && S.plan.questions || []).forEach((q) => { if (q.kind === 'yesno') { const a = r('x_' + q.key); if (a) f.extra[q.key] = a; } });
  }
  function collect() {
    const f = S.form;
    const names = (s) => String(s || '').split(/[、,，]/).map((x) => x.trim()).filter(Boolean);
    const groups = [SELF].concat(f.partners).map((g) => ({ company: g === SELF ? APPLICANT.company : g, names: names(f.workers[g]) })).filter((g) => g.names.length || g.company !== APPLICANT.company);
    const partners = f.partners.map((n) => { const p = (P.list || []).find((x) => x.name === n) || {}; return { name: n, phone: p.phone || '', address: p.address || '' }; });
    const extra = {}; (S.plan && S.plan.questions || []).forEach((q) => { extra[q.label] = f.extra[q.key] || ''; });
    return {
      apply_date: isoDay(new Date()), applicant: APPLICANT,
      purpose: S.purpose === 'survey' ? '調査（現場調査・現地確認）' : '作業（工事・点検・メンテナンス・修理）',
      leader: { staff: S.c.rPerson || '', name: f.leader_name, phone: f.leader_phone },
      work: { start_date: f.start_date, start_time: f.start_time, end_date: f.end_date, end_time: f.end_time, place: f.place, content: f.content, kubun: f.kubun },
      partners, workers: groups, headcount: f.headcount ? Number(f.headcount) : countWorkers(),
      vehicle: { use: f.vehicle, detail: f.vehicle === '有' ? f.vehicle_detail : '' },
      fire: { use: f.fire, detail: f.fire === '有' ? f.fire_detail : '' }, noise: f.noise, odor_dust: f.odor, equipment: f.equipment,
      extra, extra_keys: Object.assign({}, f.extra), memo: f.memo
    };
  }

  // ---------- 2) 作る ----------
  async function make(instruction) {
    const my = S;
    if (!S.form.start_date) { K().say('作業日を入れてください'); return; }
    S.answers = collect();
    S.busy = true;
    busy('🤖 AI が書式に書き込んでいます…', '1〜2分かかります。この画面のまま待ってください。');
    try {
      let plan = await aiWithDocs('fill', instruction ? { instruction, previous: slimPlan(S.result) } : {}, buildDocs);
      if (my.closed) return;
      let out = await render(plan);
      // PDF は書き込んだ結果を AI がもう一度見て、ずれを直す
      if (S.fmt === 'pdf') {
        busy('🤖 書き込んだ結果を AI が確かめています…', 'ずれ・はみ出しを直します（30秒〜1分）');
        try {
          const fixed = await aiWithDocs('check', { previous: slimPlan(plan) }, async (level) => [{ role: 'filled', name: '書き込んだ結果', format: 'pdf', pages: await PDF.describe(out, { grid: true, maxPx: [1500, 1250, 1050][level], q: [0.82, 0.7, 0.6][level], maxPages: 4, texts: false }) }]);
          if (my.closed) return;
          if (fixed && Array.isArray(fixed.entries) && fixed.entries.length) { plan = Object.assign({}, plan, { entries: fixed.entries, marks: fixed.marks || plan.marks, whiteouts: fixed.whiteouts || plan.whiteouts }); out = await render(plan); }
        } catch (e) { console.warn('確かめ（check）に失敗。最初の書き込みのまま', e); }
      }
      S.result = plan; S.outBytes = out;
      await saveDraft();
      if (my.closed) return;
      S.busy = false;
      confirmView();
    } catch (e) { if (!my.closed) fail(e); }
  }
  const slimPlan = (p) => p ? { entries: p.entries || [], marks: p.marks || [], whiteouts: p.whiteouts || [], file_label: p.file_label || '' } : null;
  async function render(plan) {
    if (S.fmt === 'pdf') return PDF.apply(S.tplBytes, plan);
    if (S.fmt === 'xlsx') { const b = await XL.open(S.tplBytes); const errs = XL.apply(b, plan.entries); S.xl = b; S.applyErrs = errs; return XL.save(b); }
    if (S.fmt === 'docx') { const d = await DOCX.open(S.tplBytes); const errs = DOCX.apply(d, plan.entries); S.applyErrs = errs; return DOCX.save(d); }
    throw new Error('この形には書き込めません');
  }
  function fileName() {
    const short = cleanName((DB().shortTheater ? DB().shortTheater(S.c.theater) : '') || S.c.theater);
    const label = String(S.form.start_date || S.caseDate || '').slice(5, 10).replace('-', '') || '0000';
    return `【${short}】${yymmdd()}_作業申請書_${label}_菱熱工業`;
  }
  async function saveDraft() {
    const sb = sbc();
    const base = fileName();
    // 同じ日に作り直した時は _改1, _改2 …（今の作成中のファイルは数えない）
    const { data: same } = await sb.from('case_files').select('id,name').eq('case_id', S.caseId).eq('kind', 'workapp').is('deleted_at', null);
    const used = (same || []).filter((r) => r.id !== S.fileId).map((r) => String(r.name).replace(/\.[^.]+$/, ''));
    let name = base, n = 0; while (used.includes(name)) { n++; name = `${base}_改${n}`; }
    name += '.' + S.fmt;
    const path = `${S.caseId}/${Date.now()}_workapp.${S.fmt}`;
    const blob = new Blob([S.outBytes], { type: MIME[S.fmt] });
    const up = await sb.storage.from(CASE_BUCKET).upload(path, blob, { contentType: MIME[S.fmt], upsert: false });
    if (up.error) throw new Error('作った申請書を保存できませんでした（' + up.error.message + '）');
    const meta = { theater: S.c.theater, purpose: S.purpose, for_date: S.caseDate, template_id: S.tpl.id, template_path: S.tpl.data.path, template_name: S.tpl.data.file_name, format: S.fmt, answers: S.answers, form: S.form, plan: slimPlan(S.result),
      summary: S.result.summary || '', unfilled: S.result.unfilled || [], warnings: S.result.warnings || [], ai_plan: S.plan ? { deadline: S.plan.deadline || '', deadline_warning: S.plan.deadline_warning || '', other_docs: S.plan.other_docs || '', questions: S.plan.questions || [] } : null };
    const row = { case_id: S.caseId, kind: 'workapp', name, path, mime: MIME[S.fmt], size: S.outBytes.length, status: 'draft', created_by: DB().userName ? DB().userName() : '', meta };
    if (S.fileId) {
      const old = S.filePath;
      const r = await sb.from('case_files').update({ name, path, size: row.size, meta }).eq('id', S.fileId);
      if (r.error) throw new Error('保存できませんでした（' + r.error.message + '）');
      if (old) sb.storage.from(CASE_BUCKET).remove([old]).catch(() => {});
    } else {
      const r = await sb.from('case_files').insert(row).select();
      if (r.error) throw new Error('保存できませんでした（' + r.error.message + '）');
      S.fileId = r.data && r.data[0] && r.data[0].id;
    }
    S.fileName = name; S.filePath = path;
    try { if (DB().afterWorkapp) DB().afterWorkapp(S.caseId); } catch (e) { /* なし */ }
  }
  async function resumeDraft(draft) {
    const my = S;
    busy('作成中の申請書を開いています…');
    try {
      const m = draft.meta;
      S.tpl = S.forms.templates.find((t) => t.data.path === m.template_path) || null;
      if (!S.tpl) { S.tpl = { id: m.template_id, name: m.template_name, data: { path: m.template_path, file_name: m.template_name, mime: '' } }; }
      await prepareTemplate();
      S.form = m.form; S.answers = m.answers; S.result = Object.assign({}, m.plan, { summary: m.summary, unfilled: m.unfilled, warnings: m.warnings });
      S.plan = m.ai_plan || null; S.fileId = draft.id; S.filePath = draft.path; S.fileName = draft.name;
      S.outBytes = await render(S.result);
      if (my.closed) return;
      confirmView();
    } catch (e) {
      if (my.closed) return;
      if (await K().ask('作成中の申請書を開けませんでした（' + (e.message || e) + '）。新しく作りますか？', { ok: '新しく作る' })) { S.tplReady = false; S.fileId = draft.id; S.filePath = draft.path; if (S.forms.templates.length > 1) pickTemplate(); else { S.tpl = S.forms.templates[0]; startAsk(); } }
      else close();
    }
  }

  // ---------- 3) 確認画面 ----------
  async function previewInto(el) {
    if (S.fmt === 'pdf') {
      const pages = await PDF.describe(S.outBytes, { grid: false, maxPx: 1300, q: 0.9, maxPages: 6, texts: false, noImage: true, keepUrl: true });
      el.innerHTML = pages.map((p, i) => `<img class="wa-page" src="${p.url}" alt="${i + 1}ページ">`).join('');
    } else if (S.fmt === 'xlsx') {
      const b = await XL.open(S.outBytes);
      const filled = new Set(); const sh = (n) => b.sheets.find((s) => s.name.trim() === String(n || '').trim()) || b.sheets[0];
      (S.result.entries || []).forEach((e) => { if (e.cell) { const s = sh(e.sheet); if (s) filled.add(s.path + '!' + XL.topLeft(s, String(e.cell).toUpperCase())); } });
      el.innerHTML = XL.previewHtml(b, filled);
    } else if (S.fmt === 'docx') {
      el.innerHTML = '<div class="wa-docx"></div>';
      try { const d = await docxPreview(); await d.renderAsync(new Blob([S.outBytes]), el.firstChild, null, { inWrapper: true, ignoreLastRenderedPageBreak: true }); }
      catch (e) { el.innerHTML = `<p class="ms-note">Word の見た目を出せませんでした（${esc(e.message || e)}）。⬇ ダウンロードして確かめてください。</p>`; }
    }
  }
  function confirmView() {
    const R = S.result || {};
    const toLine = (a) => (a || []).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('');
    body().innerHTML = `<div class="wa-confirm">
      <div class="wa-prev" id="waPrev"><div class="wa-busy"><div class="wa-spin"></div>見た目を作っています…</div></div>
      <div class="wa-side">
        <div class="wa-fn">📄 ${esc(S.fileName)}<div class="ms-note">今は「作成中」で案件の書類に入っています（劇場にはまだ送っていません）</div></div>
        ${S.fmt === 'docx' ? '<div class="ms-note">Word の見た目はこの画面では簡易表示です（表の幅などがずれることがあります）。正確な見た目は ⬇ ダウンロードして Word で確かめてください。</div>' : S.fmt === 'xlsx' ? '<div class="ms-note">Excel は表の形で出しています（黄色＝書いたセル）。印刷の見た目は ⬇ ダウンロードして Excel で確かめてください。</div>' : ''}
        ${R.summary ? `<div class="wa-sum">${esc(R.summary).replace(/\n/g, '<br>')}</div>` : ''}
        ${(R.warnings || []).length || (S.plan && S.plan.deadline_warning) ? `<div class="wa-warn"><b>⚠ 注意</b><ul>${S.plan && S.plan.deadline_warning ? `<li>${esc(S.plan.deadline_warning)}</li>` : ''}${toLine(R.warnings)}</ul></div>` : ''}
        ${(R.unfilled || []).length ? `<div class="wa-unf"><b>空けた欄</b><ul>${toLine(R.unfilled)}</ul></div>` : ''}
        ${(S.applyErrs || []).length ? `<div class="wa-err"><b>書けなかった所</b><ul>${toLine(S.applyErrs)}</ul></div>` : ''}
        <div class="wa-to ms-note">${esc(S.mailTo || '')}</div>
      </div></div>`;
    foot().innerHTML = `<button type="button" data-wadl>⬇ ダウンロード</button><button type="button" data-waedit>✏ 編集</button><span class="wa-gap"></span>
      <button type="button" data-wax>あとで（作成中のまま）</button><button type="button" class="primary" data-waok>OK（劇場に送る）</button>`;
    previewInto(document.getElementById('waPrev')).catch((e) => { const el = document.getElementById('waPrev'); if (el) el.innerHTML = `<p class="ms-note">見た目を出せませんでした（${esc(e.message || e)}）</p>`; });
    foot().querySelector('[data-wadl]').addEventListener('click', () => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.outBytes], { type: MIME[S.fmt] })); a.download = S.fileName; document.body.appendChild(a); a.click(); a.remove();
    });
    foot().querySelector('[data-waedit]').addEventListener('click', () => editView());
    foot().querySelector('[data-waok]').addEventListener('click', () => finish());
  }

  // ---------- 編集 ----------
  function editView() {
    const R = S.result; const pdf = S.fmt === 'pdf';
    const rows = (R.entries || []).map((e, i) => `<tr data-ei="${i}"><td class="wa-lab">${esc(e.label)}<small>${pdf ? `p${e.page} (${Math.round(e.x)}, ${Math.round(e.y)})` : e.cell ? esc((e.sheet ? e.sheet + '!' : '') + e.cell) : '段落 ' + e.para}</small></td>
      <td><textarea class="tm-input" data-ev rows="${String(e.value).length > 30 || /\n/.test(e.value) ? 2 : 1}">${esc(e.value)}</textarea></td>
      ${pdf ? `<td class="wa-pos"><button type="button" class="mini-btn" data-mv="-2,0" title="左へ">←</button><button type="button" class="mini-btn" data-mv="2,0" title="右へ">→</button><button type="button" class="mini-btn" data-mv="0,-2" title="上へ">↑</button><button type="button" class="mini-btn" data-mv="0,2" title="下へ">↓</button>
        <input type="number" class="tm-input wa-xs" data-es min="4" max="30" step="0.5" value="${esc(e.size)}" title="文字の大きさ"></td>` : ''}
      <td><button type="button" class="mini-btn danger" data-edel title="この欄を書かない">✕</button></td></tr>`).join('');
    const marks = pdf ? (R.marks || []).map((m, i) => `<label class="wa-chip"><input type="checkbox" data-mk="${i}" checked> ○ ${esc(m.label)}</label>`).join('') : '';
    body().innerHTML = `<div class="wa-edit">
      <p class="ms-note">書いた内容を直せます。直したら「直して確かめる」を押してください。${pdf ? '位置は矢印で 2pt ずつ動かせます。' : ''}</p>
      <div class="wa-edit-wrap"><table class="ms-table wa-edit-t"><thead><tr><th>欄</th><th>書く内容</th>${pdf ? '<th>位置・大きさ</th>' : ''}<th></th></tr></thead><tbody>${rows}</tbody></table></div>
      ${marks ? `<div class="wa-marks"><b>○で囲む所</b>（外すと囲みません）<div>${marks}</div></div>` : ''}
      <div class="wa-aifix"><b>🤖 AI に直してもらう</b><textarea id="waInst" class="tm-input" rows="2" placeholder="例: 作業者の欄に協力会社の人も全部書いて／車両は有にして 品川 300 あ 12-34 を書いて／日付の文字をもう少し右に"></textarea>
        <button type="button" data-waaifix>🤖 この指示で作り直す</button></div></div>`;
    foot().innerHTML = '<button type="button" data-waback>← 確認に戻る（直さない）</button><span class="wa-gap"></span><button type="button" class="primary" data-wareapply>直して確かめる</button>';
    const B = body();
    B.addEventListener('click', (e) => {
      const mv = e.target.closest('[data-mv]');
      if (mv) { const tr = mv.closest('[data-ei]'); const en = R.entries[+tr.dataset.ei]; const [dx, dy] = mv.dataset.mv.split(',').map(Number); en.x = Math.round((Number(en.x) + dx) * 10) / 10; en.y = Math.round((Number(en.y) + dy) * 10) / 10; tr.querySelector('small').textContent = `p${en.page} (${Math.round(en.x)}, ${Math.round(en.y)})`; return; }
      const del = e.target.closest('[data-edel]');
      if (del) { const tr = del.closest('[data-ei]'); tr.classList.toggle('wa-off'); }
    });
    foot().querySelector('[data-waback]').addEventListener('click', () => confirmView());
    const readEdits = () => {
      const keep = [];
      B.querySelectorAll('[data-ei]').forEach((tr) => {
        const en = R.entries[+tr.dataset.ei]; if (tr.classList.contains('wa-off')) return;
        en.value = tr.querySelector('[data-ev]').value; const sz = tr.querySelector('[data-es]'); if (sz) en.size = Number(sz.value) || en.size; keep.push(en);
      });
      R.entries = keep;
      if (pdf) { const on = [...B.querySelectorAll('[data-mk]')].filter((x) => x.checked).map((x) => +x.dataset.mk); R.marks = (R.marks || []).filter((m, i) => on.includes(i)); }
    };
    foot().querySelector('[data-wareapply]').addEventListener('click', async () => {
      readEdits(); const my = S; S.busy = true; busy('直した内容で書き込んでいます…');
      try { S.outBytes = await render(R); await saveDraft(); if (my.closed) return; S.busy = false; confirmView(); } catch (e) { if (!my.closed) fail(e); }
    });
    B.querySelector('[data-waaifix]').addEventListener('click', () => {
      const inst = B.querySelector('#waInst').value.trim(); if (!inst) { K().say('直してほしいことを書いてください'); return; }
      readEdits(); make(inst);
    });
  }

  // ---------- 4) OK → 劇場に送る ----------
  async function finish() {
    const sb = sbc(); const my = S;
    if (!(await K().ask(`作業申請書「${S.fileName}」を「完成」にして、劇場に通知メールで送ります（5分後にまとめて送ります）。よろしいですか？\n${S.mailTo || ''}`, { ok: 'OK（送る）' }))) return;
    S.busy = true; busy('送る準備をしています…');
    try {
      const r = await sb.from('case_files').update({ status: 'final' }).eq('id', S.fileId);
      if (r.error) throw new Error('完成にできませんでした（' + r.error.message + '）');
      const warn = [];
      // 書類棚に記入例として残す（次に作る時、AI がこの書き方に合わせる）
      try {
        const ext = S.fmt; const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await sb.storage.from(FORM_BUCKET).upload(path, new Blob([S.outBytes], { type: MIME[ext] }), { contentType: MIME[ext], upsert: false });
        if (up.error) throw up.error;
        const ins = await sb.from('doc_files').insert({ name: '記入例 ' + S.fileName.replace(/\.[^.]+$/, ''), company: S.c.company || '', theater: S.c.theater, folder_id: null, case_id: S.caseId,
          data: { kind: 'workapp_example', path, file_name: S.fileName, mime: MIME[ext], size: S.outBytes.length, modified: Date.now(), from_case: S.caseId }, updated_by_name: DB().userName ? DB().userName() : '' });
        if (ins.error) throw ins.error;
      } catch (e) { warn.push('書類棚に記入例として残せませんでした（' + (e.message || e) + '）'); }
      // 作業者を協力会社マスターに覚える
      try {
        const A = S.answers;
        await rememberWorkers((A.workers || []).map((g) => { const p = (A.partners || []).find((x) => x.name === g.company) || {}; return { company: g.company, names: g.names, phone: p.phone || '', address: p.address || '' }; }));
      } catch (e) { warn.push('作業者を覚えられませんでした（' + (e.message || e) + '）'); }
      try { if (DB().afterWorkapp) DB().afterWorkapp(S.caseId); } catch (e) { /* なし */ }
      if (my.closed) return;
      close();
      toast('作業申請書を完成にしました（5分後に劇場へ送ります）');
      if (warn.length) K().say(warn.join('\n'));
    } catch (e) { if (!my.closed) fail(e); }
  }

  /* ============================================================
     作る？／申請不要／あとで（調査日・作業開始日を入れた時・一覧のボタン・開いた時にまだ決めていない予定）
     ============================================================ */
  const SNOOZE_KEY = 'waSnoozeV1';
  const snoozeKey = (id, pp, date) => `${id}|${pp}|${date}`;
  const snoozed = () => { try { return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) || '[]'); } catch (e) { return []; } };
  const snooze = (k) => { try { const a = snoozed(); if (!a.includes(k)) a.push(k); sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(a)); } catch (e) { /* なし */ } };
  const STATE_TEXT = { none: 'まだ決めていません', draft: '作成中', final: '✅ 送付済', skip: '申請不要で通知済み', manual: '✅ 別に提出済み', stale: '⚠ 作った後に日付が変わりました' };
  // 申請不要の理由（会社・劇場で共通。使った理由を溜めていく）: app_settings の workapp_skip_reasons = { reasons: [...] }
  async function loadReasons() {
    const sb = sbc(); if (!sb) return [];
    try { const { data } = await sb.from('app_settings').select('value').eq('key', 'workapp_skip_reasons').limit(1); const v = data && data[0] && data[0].value; return (v && Array.isArray(v.reasons)) ? v.reasons : []; } catch (e) { return []; }
  }
  async function addReason(r) {
    const list = await loadReasons(); if (!r || list.includes(r)) return;
    await sbc().from('app_settings').upsert({ key: 'workapp_skip_reasons', value: { reasons: list.concat(r) }, updated_at: new Date().toISOString() });
  }
  // items: [{ caseId, purpose }]。opts.why: 'manual'（手で日付を入れた）/ 'queue'（開いた時）/ 'button'、opts.from: [{ purpose, from }]（前の日付）
  async function decide(caseId, purposes, opts) {
    const c = DB().caseInfo ? DB().caseInfo(caseId) : null; if (!c) return;
    const list = (purposes && purposes.length ? purposes : ['survey', 'work']).map((pp) => ({ caseId: String(caseId), purpose: pp }));
    return decisionDialog(list, opts || {});
  }
  async function decisionDialog(items, opts) {
    const sb = sbc(); if (!sb) return;
    document.querySelectorAll('#waDecide').forEach((x) => x.remove());
    const rows = items.map((it) => {
      const c = DB().caseInfo(it.caseId); if (!c) return null;
      const date = it.purpose === 'survey' ? c.surveyDate : c.workStartDate;
      const st = DB().waState ? DB().waState(it.caseId, it.purpose) : null;
      const from = (st && st.rec && st.rec.for_date) || '';   // 前に作った（決めた）時の日付
      return Object.assign({}, it, { c, date, state: st ? st.state : 'none', from });
    }).filter(Boolean);
    if (!rows.length) return;
    const reasons = await loadReasons();
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'waDecide';
    const queue = opts.why === 'queue';
    const draw = () => {
      const live = rows.filter((r) => !r.done);
      if (!live.length) { ov.remove(); return; }
      ov.innerHTML = `<div class="kt-dialog kt-dialog-mid wa-dec"><div class="kt-dlg-head">📝 作業申請書${queue ? ` — まだ決めていない予定（${live.length} 件）` : ' — ' + esc(live[0].c.theater)}<button type="button" class="close-btn" data-dx>×</button></div>
        <div class="kt-dlg-body">
          <p class="ms-note">${queue ? 'メール・LINE の取り込みなどで調査日・作業開始日が入った予定のうち、作業申請書をまだ決めていないものです' + (opts.allCases ? '（R担当者のメールアドレスがマスターに無いので、全部の案件を出しています。☰ その他 →「🗂 マスター編集」で入れると、自分の案件だけになります）。' : '（あなたが R担当者の案件）。') : '調査日・作業開始日が入りました。作業申請書を作りますか？'}
            「申請不要」を選ぶと、理由を付けて客先に通知メールで知らせます（5分後にまとめて）。</p>
          ${live.map((r) => {
            const i = rows.indexOf(r); const lab = PURPOSE_LABEL[r.purpose];
            const changed = r.state === 'stale' && r.from && r.date;
            return `<div class="wa-dec-row" data-di="${i}">
              <div class="wa-dec-h"><b>${r.purpose === 'survey' ? '🔍' : '🛠'} ${lab} ${r.date ? esc(mdw(r.date)) : '（日付なし）'}</b>${queue ? `　${esc(r.c.theater)}${r.c.title ? '　' + esc(r.c.title) : ''}` : ''}
                <span class="wa-dec-st">${changed ? `⚠ ${lab}日が ${esc(mdw(r.from))} → ${esc(mdw(r.date))} に変わりました。作り直しますか？` : esc(STATE_TEXT[r.state] || '')}</span></div>
              ${!r.date ? `<div class="ms-note">${lab === '調査' ? '調査日' : '作業開始日'}が入っていません。入れて保存すると作れます。</div>` : r.skipping ? `<div class="wa-skip">
                <label>申請不要の理由</label>
                <select data-dsel="${i}"><option value="">（理由を選ぶ）</option>${reasons.map((x) => `<option${r.reason === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}<option value="__new"${r.reason === '__new' ? ' selected' : ''}>＋ 新しい理由を入れる</option></select>
                ${r.reason === '__new' || !reasons.length ? `<input type="text" class="tm-input" data-dnew="${i}" placeholder="例: 目視の確認だけで工具を使わないため" value="${esc(r.newReason || '')}">` : ''}
                <button type="button" class="primary" data-dskipgo="${i}">申請不要で通知する</button><button type="button" data-dskipno="${i}">やめる</button>
                <div class="ms-note">新しい理由は、次から選べるように溜めていきます（会社・劇場で共通）。</div></div>`
              : `<div class="wa-dec-btns"><button type="button" class="primary" data-dmake="${i}">📝 ${r.state === 'draft' ? '続きを直す' : (r.state === 'final' || r.state === 'stale' || r.state === 'skip' || r.state === 'manual') ? '作り直す' : '作る'}</button>
                <button type="button" data-dskip="${i}">申請不要</button><button type="button" data-dlater="${i}">あとで</button>
                <button type="button" class="link-btn" data-dmanual="${i}" title="作業申請書を別に（紙・メールなどで）出した時。通知メールは送りません">別に提出済み（メールは送らない）</button></div>`}
            </div>`;
          }).join('')}
        </div><div class="kt-dlg-foot"><span class="ms-note">${queue ? '「あとで」は、次にアプリを開いた時にもう一度聞きます' : ''}</span><button type="button" data-dx>閉じる</button></div></div>`;
    };
    draw(); document.body.appendChild(ov);
    const later = (r) => { if (r.date) snooze(snoozeKey(r.caseId, r.purpose, r.date)); r.done = true; };
    ov.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-dsel]'); if (sel) { const r = rows[+sel.dataset.dsel]; r.reason = sel.value; draw(); }
    });
    ov.addEventListener('input', (e) => { const n = e.target.closest('[data-dnew]'); if (n) rows[+n.dataset.dnew].newReason = n.value; });
    ov.addEventListener('click', async (e) => {
      const t = e.target;
      if (t.closest('[data-dx]') || t === ov) { rows.filter((r) => !r.done).forEach(later); ov.remove(); return; }
      const g = (k) => { const b = t.closest(`[data-${k}]`); return b ? rows[+b.getAttribute(`data-${k}`)] : null; };
      let r;
      if ((r = g('dmake'))) { r.done = true; ov.remove(); open(r.caseId, r.purpose); return; }
      if ((r = g('dlater'))) { later(r); draw(); return; }
      if ((r = g('dskip'))) { r.skipping = true; draw(); return; }
      if ((r = g('dskipno'))) { r.skipping = false; draw(); return; }
      if ((r = g('dmanual'))) {
        if (!(await K().ask(`${PURPOSE_LABEL[r.purpose]} ${mdw(r.date)} の作業申請書は、別に提出済みにします（客先に通知メールは送りません）。よろしいですか？`, { ok: '提出済みにする' }))) return;
        const ok = await saveDecision(r, 'manual', ''); if (ok) { r.done = true; draw(); }
        return;
      }
      if ((r = g('dskipgo'))) {
        const reason = (r.reason && r.reason !== '__new' ? r.reason : (r.newReason || '')).trim();
        if (!reason) { K().say('申請不要の理由を選ぶか、入れてください'); return; }
        const to = DB().mailTo ? await DB().mailTo(r.caseId) : '';
        if (!(await K().ask(`「${PURPOSE_LABEL[r.purpose]} ${mdw(r.date)}：作業申請書は不要（理由: ${reason}）」と、客先に通知メールで知らせます（5分後にまとめて送ります）。よろしいですか？\n${to}`, { ok: '申請不要で通知する' }))) return;
        const ok = await saveDecision(r, 'skip', reason);
        if (ok) { if (!reasons.includes(reason)) { reasons.push(reason); addReason(reason).catch(() => {}); } r.done = true; draw(); }
      }
    });
  }
  // 申請不要（skip: 通知メールで知らせる）・別に提出済み（manual: 知らせない）を案件の書類に残す
  async function saveDecision(r, status, reason) {
    const sb = sbc();
    const name = status === 'skip' ? `作業申請書 不要（${PURPOSE_LABEL[r.purpose]} ${mdOf(r.date)}）` : `作業申請書 別に提出済み（${PURPOSE_LABEL[r.purpose]} ${mdOf(r.date)}）`;
    const row = { case_id: r.caseId, kind: 'workapp', name, path: '', mime: '', size: 0, status, created_by: DB().userName ? DB().userName() : '',
      meta: { theater: r.c.theater, purpose: r.purpose, for_date: r.date, skip_reason: reason || '' } };
    const res = await sb.from('case_files').insert(row);
    if (res.error) { K().say('保存できませんでした: ' + res.error.message); return false; }
    try { if (DB().afterWorkapp) await DB().afterWorkapp(r.caseId); } catch (e) { /* なし */ }
    toast(status === 'skip' ? '申請不要にしました（5分後に客先へ通知します）' : '別に提出済みにしました');
    return true;
  }
  // 開いた時: まだ決めていない予定（今日以降の調査日・作業開始日）を、その案件の R担当者に聞く
  function checkQueue() {
    if (!sbc() || !DB().waCases || !DB().waState) return;
    if (document.querySelector('#waDecide, #waDlg')) return;
    const email = String(DB().userEmail ? DB().userEmail() : '').toLowerCase();
    const me = ((DB().staff ? DB().staff() : []) || []).find((x) => x.email && x.email.toLowerCase() === email);
    const today = isoDay(new Date()); const sn = snoozed();
    const items = [];
    DB().waCases().forEach((c) => {
      if (me && c.rPerson && c.rPerson !== me.name) return;   // 自分が R担当者の案件（R担当者が空の案件は全員。マスターにメールアドレスが無い人には全部）
      ['survey', 'work'].forEach((pp) => {
        const date = pp === 'survey' ? c.surveyDate : c.workStartDate;
        if (!date || date < today || sn.includes(snoozeKey(c.id, pp, date))) return;
        const st = DB().waState(c.id, pp); if (!st || !['none', 'stale'].includes(st.state)) return;
        items.push({ caseId: String(c.id), purpose: pp, date });
      });
    });
    if (!items.length) return;
    items.sort((a, b) => a.date.localeCompare(b.date));
    decisionDialog(items.slice(0, 20), { why: 'queue', allCases: !me });
  }

  window.WORKAPP = { open, decide, checkQueue, openPartners, syncPartners, _xl: XL, _docx: DOCX, _pdf: PDF, _state: () => S };
})();
