"use strict";
/* ============================================================
   Excel（.xlsx）を作る小さな部品（JSZip を使う）。window.XLSXW
   ・セルに「値」「式（＋計算済みの値）」「書式」を入れる
   ・名前の定義（例: 単位換算）・入力の候補（プルダウン）・シート内リンク・条件付き書式・印刷設定
   ・開いた時に Excel が式を計算し直す（fullCalcOnLoad）
   使い方:
     const wb = XLSXW.book();
     const sh = wb.sheet('入力', { cols: [20, 12], freeze: 'A5', landscape: false });
     sh.set('B5', { v: 25, st: { fill: 'FFF2CC' } });            // 値
     sh.set('C5', { f: 'B5*2', v: 50 });                          // 式（v は計算済みの値）
     wb.name('室内温度', "'入力'!$B$5");
     const blob = await wb.blob();
   ============================================================ */
(function () {
  const xe = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const colL = (c) => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
  const colN = (L) => { let n = 0; for (const ch of L) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  const parse = (ref) => { const m = /^([A-Z]+)(\d+)$/.exec(ref); if (!m) throw new Error('セル番地が正しくありません: ' + ref); return { c: colN(m[1]), r: +m[2] }; };
  const addr = (r, c) => colL(c) + r;
  const FONT = '游ゴシック';

  function book() {
    const sheets = [], names = [];
    // ---- 書式の登録（同じ組み合わせは使い回す） ----
    const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'], numFmts = [], xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'], dxfs = [];
    const idx = (arr, x) => { let i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1; } return i; };
    const fontXml = (f) => '<font>' + (f.b ? '<b/>' : '') + (f.i ? '<i/>' : '') + (f.u ? '<u/>' : '') + '<sz val="' + (f.sz || 10) + '"/><color rgb="FF' + (f.color || '000000') + '"/><name val="' + FONT + '"/><family val="3"/><charset val="128"/></font>';
    idx(fonts, fontXml({}));
    const xfMap = {};
    function sid(o) {
      o = o || {}; const key = JSON.stringify(o); if (xfMap[key] != null) return xfMap[key];
      const fontId = idx(fonts, fontXml(o.font || {}));
      const fillId = o.fill ? idx(fills, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + o.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0;
      const e = (tag, st) => st ? `<${tag} style="${st}"><color rgb="FF${o.bc || 'A6A6A6'}"/></${tag}>` : `<${tag}/>`;
      const b = o.border === 'all' ? { l: 'thin', r: 'thin', t: 'thin', b: 'thin' } : (o.border || {});
      const borderId = idx(borders, '<border>' + e('left', b.l) + e('right', b.r) + e('top', b.t) + e('bottom', b.b) + '<diagonal/></border>');
      let numFmtId = 0;
      if (o.fmt) { const builtIn = { '0': 1, '0.00': 2, '#,##0': 3, '#,##0.00': 4, '0%': 9, '0.00%': 10, '@': 49 }; numFmtId = builtIn[o.fmt] != null ? builtIn[o.fmt] : 164 + idx(numFmts, o.fmt); }
      const al = '<alignment horizontal="' + (o.h || 'general') + '" vertical="' + (o.v || 'center') + '"' + (o.wrap ? ' wrapText="1"' : '') + (o.indent ? ' indent="' + o.indent + '"' : '') + '/>';
      xfs.push(`<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`);
      xfMap[key] = xfs.length - 1; return xfMap[key];
    }
    function dxf(o) { dxfs.push('<dxf>' + (o.font ? '<font>' + (o.font.b ? '<b/>' : '') + '<color rgb="FF' + o.font.color + '"/></font>' : '') + (o.fill ? '<fill><patternFill patternType="solid"><fgColor rgb="FF' + o.fill + '"/><bgColor rgb="FF' + o.fill + '"/></patternFill></fill>' : '') + '</dxf>'); return dxfs.length - 1; }

    function sheet(name, opt) {
      opt = opt || {};
      const cells = new Map(), merges = [], dvs = [], links = [], cfs = [], rowH = {};
      const sh = {
        name, opt,
        set(ref, cell) { const p = typeof ref === 'string' ? parse(ref) : { r: ref[0], c: ref[1] }; cells.set(p.r * 16384 + p.c, Object.assign({ r: p.r, c: p.c }, cell)); return sh; },
        get(ref) { const p = parse(ref); return cells.get(p.r * 16384 + p.c); },
        merge(range) { merges.push(range); return sh; },
        height(r, h) { rowH[r] = h; return sh; },
        list(sqref, formula) { dvs.push({ sqref, formula }); return sh; },
        link(ref, location, tip) { links.push({ ref, location, tip }); return sh; },
        cf(sqref, rules) { cfs.push({ sqref, rules }); return sh; },
        xml() {
          const rows = {}; let maxR = 1, maxC = 0;
          cells.forEach((c) => { (rows[c.r] = rows[c.r] || []).push(c); if (c.r > maxR) maxR = c.r; if (c.c > maxC) maxC = c.c; });
          const sd = Object.keys(rows).map(Number).sort((a, b) => a - b).map((r) => {
            const cs = rows[r].sort((a, b) => a.c - b.c).map((c) => {
              const s = sid(c.st), at = addr(c.r, c.c);
              if (c.f != null) {
                const f = '<f>' + xe(c.f) + '</f>';
                if (typeof c.v === 'string') return `<c r="${at}" s="${s}" t="str">${f}<v>${xe(c.v)}</v></c>`;
                if (typeof c.v === 'number' && isFinite(c.v)) return `<c r="${at}" s="${s}">${f}<v>${c.v}</v></c>`;
                return `<c r="${at}" s="${s}">${f}</c>`;
              }
              if (typeof c.v === 'number' && isFinite(c.v)) return `<c r="${at}" s="${s}"><v>${c.v}</v></c>`;
              if (c.v != null && c.v !== '') return `<c r="${at}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xe(c.v)}</t></is></c>`;
              return `<c r="${at}" s="${s}"/>`;
            }).join('');
            return `<row r="${r}"${rowH[r] ? ` ht="${rowH[r]}" customHeight="1"` : ''}>${cs}</row>`;
          }).join('');
          const cols = (opt.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
          let pane = '';
          if (opt.freeze) { const p = parse(opt.freeze); const xs = p.c, ys = p.r - 1; pane = `<pane${xs ? ` xSplit="${xs}"` : ''}${ys ? ` ySplit="${ys}"` : ''} topLeftCell="${opt.freeze}" activePane="${xs && ys ? 'bottomRight' : ys ? 'bottomLeft' : 'topRight'}" state="frozen"/>`; }
          const sel = opt.selected ? ' tabSelected="1"' : '';
          const cf = cfs.map((x, i) => `<conditionalFormatting sqref="${x.sqref}">${x.rules.map((r, j) => `<cfRule type="expression" dxfId="${r.dxf}" priority="${i * 10 + j + 1}"><formula>${xe(r.formula)}</formula></cfRule>`).join('')}</conditionalFormatting>`).join('');
          const dv = dvs.length ? `<dataValidations count="${dvs.length}">${dvs.map((d) => `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${d.sqref}"><formula1>${xe(d.formula)}</formula1></dataValidation>`).join('')}</dataValidations>` : '';
          const hl = links.length ? `<hyperlinks>${links.map((l) => `<hyperlink ref="${l.ref}" location="${xe(l.location)}" display="${xe(l.tip || '')}"/>`).join('')}</hyperlinks>` : '';
          const fit = opt.fitWidth !== false;
          return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
            `<sheetPr>${opt.tab ? `<tabColor rgb="FF${opt.tab}"/>` : ''}${fit ? '<pageSetUpPr fitToPage="1"/>' : ''}</sheetPr><dimension ref="A1:${addr(maxR, Math.max(0, maxC))}"/>` +
            `<sheetViews><sheetView workbookViewId="0"${sel}${opt.grid === false ? ' showGridLines="0"' : ''}${opt.zoom ? ` zoomScale="${opt.zoom}" zoomScaleNormal="${opt.zoom}"` : ''}>${pane}</sheetView></sheetViews>` +
            `<sheetFormatPr defaultRowHeight="18"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${sd}</sheetData>` +
            (merges.length ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '') + cf + dv + hl +
            `<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
            `<pageSetup paperSize="9" orientation="${opt.landscape ? 'landscape' : 'portrait'}"${fit ? ' fitToWidth="1" fitToHeight="0"' : ''}/>` +
            `<headerFooter><oddFooter>&amp;C&amp;9${xe(name)}　&amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
        }
      };
      sheets.push(sh); return sh;
    }
    function name(n, ref, sheetIndex) { names.push({ n, ref, sheetIndex }); }
    async function blob() {
      if (typeof JSZip === 'undefined') throw new Error('Excel を作る部品（JSZip）が読み込まれていません');
      const zip = new JSZip();
      const sheetXml = sheets.map((s) => s.xml());   // 先に作る（書式が登録される）
      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
      const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>菱熱工業株式会社</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
      zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>`);
      zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
      zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000" activeTab="${Math.max(0, sheets.findIndex((s) => s.opt.selected))}"/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${xe(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${names.length ? `<definedNames>${names.map((d) => `<definedName name="${xe(d.n)}"${d.sheetIndex != null ? ` localSheetId="${d.sheetIndex}"` : ''}>${xe(d.ref)}</definedName>`).join('')}</definedNames>` : ''}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
      zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${numFmts.length ? `<numFmts count="${numFmts.length}">${numFmts.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${xe(f)}"/>`).join('')}</numFmts>` : ''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="標準" xfId="0" builtinId="0"/></cellStyles><dxfs count="${dxfs.length}">${dxfs.join('')}</dxfs></styleSheet>`);
      sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml[i]));
      return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE' });
    }
    return { sheet, name, dxf, blob, sheets };
  }
  window.XLSXW = { book, colL, colN, addr, parse };
})();
