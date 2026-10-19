"use strict";
/* ============================================================
   空調負荷計算の Excel（window.HLXL）。xlsx-lite.js で作る
   ・数字は「式」でつながる（どのセルを使っているかは、セルを選ぶと数式バーに出る）
   ・黄色＝変えてよい所（入力）／白＝式（計算）／灰色＝基準値（ふだんは変えない）
   ・単位は Web で選んでいた単位（kW か kcal/h）で、全部のシートをそろえる（混ぜない）
   ・式の結果も計算して一緒に入れる（Excel 以外のプレビューでも数字が見える）。開くと Excel が計算し直す
   ============================================================ */
(function () {
  const q = (n) => "'" + String(n).replace(/'/g, "''") + "'";
  const abs = (a) => a.replace(/^([A-Z]+)(\d+)$/, '$$$1$$$2');
  const RF = (sh, a) => q(sh) + '!' + abs(a);
  const L = (c) => window.XLSXW.colL(c);
  const s = (str) => '"' + String(str).replace(/"/g, '""') + '"';
  const pv = (t, rh) => 6.1078 * Math.pow(10, 7.5 * t / (t + 237.3)) * rh / 100;
  const xo = (t, rh) => { const p = pv(t, rh); return 622 * p / (1013.25 - p); };
  const PV = (T, RH) => `6.1078*10^(7.5*${T}/(${T}+237.3))*${RH}/100`;
  const XF = (T, RH) => `622*(${PV(T, RH)})/(1013.25-${PV(T, RH)})`;
  const r05 = (v) => Math.round(v * 2) / 2;
  const roundX = (v) => Math.sign(v) * Math.round(Math.abs(v));   // Excel の ROUND(…,0)

  // ---------------- 書式 ----------------
  const ST = {
    title: { font: { b: 1, sz: 16 } }, sub: { font: { sz: 10, color: '595959' } }, big: { font: { b: 1, sz: 22 }, h: 'center' }, center: { h: 'center', font: { sz: 13 } },
    sec: { font: { b: 1, sz: 11, color: 'FFFFFF' }, fill: '1F2A44' },
    th: { font: { b: 1, sz: 10 }, fill: 'DDE3EC', border: 'all', h: 'center', wrap: 1 },
    lab: { border: 'all', wrap: 1 }, labB: { border: 'all', wrap: 1, font: { b: 1 } },
    note: { font: { sz: 9, color: '595959' }, wrap: 1, v: 'top' }, noteB: { font: { sz: 10 }, wrap: 1, v: 'top' },
    link: { font: { color: '0563C1', u: 1 } }
  };
  const IN = (fmt, txt) => ({ fill: 'FFF2CC', font: { color: '0000CC', b: 1 }, border: 'all', fmt: fmt || undefined, h: txt ? 'left' : 'right' });
  const CA = (fmt, b, txt) => ({ border: 'all', fmt: fmt || undefined, font: b ? { b: 1 } : undefined, h: txt ? 'left' : undefined, wrap: txt ? 1 : undefined });
  const BA = (fmt, txt) => ({ fill: 'EDEDED', border: 'all', fmt: fmt || undefined, font: { color: '404040' }, h: txt ? 'left' : undefined });
  const HP = (fmt) => ({ fill: 'F7F7F7', border: 'all', fmt: fmt || undefined, font: { color: '808080', sz: 9 } });

  function setup(x) {
    const kc = x.S.unit === 'kcal';
    return {
      kc, U: kc ? 'kcal/h' : 'kW', UB: kc ? 'kcal/h' : 'W', u: kc ? 0.86 : 1, DISP: kc ? 1 : 1000, HPU: kc ? 2408 : 2.8, capIn: (v) => kc ? v * 860 : v,
      fCap: kc ? '#,##0' : '#,##0.0', fDiff: kc ? '#,##0;[Red]-#,##0' : '#,##0.0;[Red]-#,##0.0', fBase: '#,##0', fSeat: kc ? '0.00' : '0.0', fK: '0.000', fHp: '0.0', fPct: '0%', fT: '0.0', fX: '0.00', fFlow: '#,##0'
    };
  }
  // 表の見出しの行
  function head(sh, r, c0, labels, widths) { labels.forEach((t, i) => sh.set([r, c0 + i], { v: t, st: ST.th })); }
  function band(sh, r, c0, c1, text) { for (let c = c0; c <= c1; c++) sh.set([r, c], { v: c === c0 ? text : '', st: ST.sec }); sh.merge(L(c0) + r + ':' + L(c1) + r); }
  function noteRow(sh, r, c0, c1, text, st) { sh.set([r, c0], { v: text, st: st || ST.note }); for (let c = c0 + 1; c <= c1; c++) sh.set([r, c], { v: '', st: st || ST.note }); sh.merge(L(c0) + r + ':' + L(c1) + r); }
  function judgeCf(wb) { return { ng: wb.dxf({ font: { b: 1, color: 'C00000' }, fill: 'FDE4E2' }), warn: wb.dxf({ font: { b: 1, color: 'B45309' }, fill: 'FEF3C7' }), ok: wb.dxf({ font: { b: 1, color: '15803D' }, fill: 'DCFCE7' }) }; }
  function addJudgeCf(sh, sqref, first, D) { sh.cf(sqref, [{ dxf: D.ng, formula: `${first}="不足"` }, { dxf: D.warn, formula: `${first}="ぎりぎり"` }, { dxf: D.ok, formula: `${first}="足りる"` }]); }

  // ---------------- 表紙・使い方（共通） ----------------
  function cover(wb, x, u, title, sub) {
    const sh = wb.sheet('表紙', { cols: [4, 18, 18, 18, 18, 18, 4], grid: false, selected: true, tab: '1F2A44' });
    sh.set('B8', { v: title, st: ST.big }); ['C8', 'D8', 'E8', 'F8'].forEach((a) => sh.set(a, { v: '', st: ST.big })); sh.merge('B8:F8'); sh.height(8, 40);
    sh.set('B11', { v: x.theaterName + (sub ? '　' + sub : ''), st: ST.center }); sh.merge('B11:F11');
    sh.set('B13', { v: '案件名', st: { h: 'right', font: { sz: 12 } } });
    sh.set('C13', { v: x.S.caseName || x.docTitle, st: Object.assign(IN(null, true), { font: { sz: 12, b: 1, color: '0000CC' } }) }); sh.merge('C13:E13'); ['D13', 'E13'].forEach((a) => sh.set(a, { v: '', st: IN(null, true) }));
    sh.set('B16', { v: x.jpToday, st: { h: 'center', font: { sz: 11 } } }); sh.merge('B16:F16');
    sh.set('B19', { v: '菱熱工業株式会社', st: { h: 'center', font: { sz: 14, b: 1 } } }); sh.merge('B19:F19');
    sh.set('B23', { v: '単位：' + u.U + '（Web で kW と kcal/h を切り替えて出し直せます。このファイルの中は ' + u.U + ' だけで計算しています）', st: ST.note }); sh.merge('B23:F23');
    sh.set('B24', { v: '見方は「使い方」シートを見てください。黄色のセルを変えると、すべてのシートが計算し直されます。', st: ST.note }); sh.merge('B24:F24');
    return sh;
  }
  // 使い方のシートは先に作り（シートの並び順のため）、中身は表を作り終えてから入れる（リンク先の行が決まってから）
  function guide(wb) {
    const sh = wb.sheet('使い方', { cols: [3, 26, 70, 3], grid: false, tab: 'F59E0B' });
    return (items, extra) => fillGuide(sh, items, extra);
  }
  function fillGuide(sh, items, extra) {
    sh.set('B1', { v: 'このファイルの使い方', st: ST.title });
    let r = 3; band(sh, r, 1, 2, '1. セルの色の意味'); r++;
    [[IN(null, true), '黄色（青い文字）', '変えてよい所（入力）。ここを変えると、つながっているセルがすべて計算し直されます。'],
      [CA(null, false, true), '白', '式（計算）。触らないでください。セルを選ぶと、上の数式バーに「どのセルを使っているか」が出ます。'],
      [BA(null, true), '灰色', '基準値（建築設備設計基準・メーカーの値など）。ふだんは変えません。根拠を変える時だけ変えます。'],
      [HP(), '薄い灰色（小さい文字）', '計算の途中の値（見るだけ）。']].forEach((it) => { sh.set([r, 1], { v: it[1], st: it[0] }); sh.set([r, 2], { v: it[2], st: ST.noteB }); sh.height(r, 30); r++; });
    r++; band(sh, r, 1, 2, '2. Excel で変えるなら、ここを変えてください（押すとそのセルへ移ります）'); r++;
    items.forEach((it) => { sh.set([r, 1], { v: '▶ ' + it[0], st: ST.link }); sh.link(L(1) + r, it[1], it[0]); sh.set([r, 2], { v: it[2], st: ST.noteB }); sh.height(r, it[3] || 30); r++; });
    r++; band(sh, r, 1, 2, '3. 式のたどり方'); r++;
    [['どのセルにつながっているか', '数式のタブ →「参照元のトレース」（矢印で元のセルが出ます）。「参照先のトレース」で、そのセルを使っている先も出ます。'],
      ['名前の付いた値', '数式のタブ →「名前の管理」に、式で使っている名前（例：室内温度・単位換算・馬力換算）と、そのセルの場所が一覧で出ます。'],
      ['シートの順番', '入力（黄色）→ 計算 → 結果 の順に並べています。各シートの1行目に、そのシートの説明があります。']].forEach((it) => { sh.set([r, 1], { v: it[0], st: ST.labB }); sh.set([r, 2], { v: it[1], st: ST.noteB }); sh.height(r, 32); r++; });
    r++; band(sh, r, 1, 2, '4. 気をつけること'); r++;
    (extra || []).forEach((t) => { sh.set([r, 1], { v: '・', st: { h: 'right' } }); sh.set([r, 2], { v: t, st: ST.noteB }); sh.height(r, 30); r++; });
    return sh;
  }

  /* ============================================================
     シアター
     ============================================================ */
  function theater(x) {
    const S = x.S, u = setup(x), wb = window.XLSXW.book(), D = judgeCf(wb), P = S.th.p;
    const SH = { in: '入力・条件', scr: 'スクリーン別', ac: '機器表', cat: '更新機種', base: '基準値' };
    cover(wb, x, u, '空調負荷計算書（シアター）', '');
    const fillG = guide(wb);
    const guideItems = () => fillG([
      ['外気の温度・湿度', RF(SH.in, 'B6'), '標準・酷暑・酷暑（最悪）の外気温と相対湿度。'],
      ['計算に使う条件を選ぶ', RF(SH.in, 'B10'), '標準／酷暑／酷暑（最悪）から選ぶと、スクリーン別の判定・更新の検討が、その条件で計算し直されます。'],
      ['1人あたりの換気量', RF(SH.in, 'B22'), '興行場法の 25 または 20 m³/h・人。'],
      ['座席数・計算するスクリーン', RF(SH.scr, 'C6'), 'スクリーンごとの座席数（劇場のホームページから読んだ値）と、計算する（○）／しない（×）。'],
      ['空調機の能力・能力の低下', RF(SH.ac, 'C5'), '機器表から読んだ冷房能力と、能力の低下（100〜80%）。スクリーンの欄で、どのスクリーン用かを選びます。'],
      ['更新に使う機種の能力', RF(SH.cat, 'B6'), '更新する時の機種の馬力・冷房能力・型式。カタログの値に変えられます。'],
      ['算定方法の値（標準）', RF(SH.in, 'B18'), '空調面積 1.5㎡/席・実効温度差 21℃・熱貫流率・人体発熱 85 kcal/h。必要な時だけ変えます（標準は右の欄）。', 40],
      ['室内の条件', RF(SH.in, 'B14'), '標準は 25℃・54%（18.6℃WB 相当）。']
    ], ['行を足す時は、表の下の空いている黄色の行に書いてください（式は入っています）。',
      'スクリーンの名前を変えた時は、機器表のスクリーンの欄も同じ名前にしてください（名前で結び付けています）。',
      '最終の機器の選定は、メーカーの能力表で確かめてください。']);
    const si = wb.sheet(SH.in, { cols: [34, 14, 14, 14, 14, 40], freeze: 'A4' });
    const sa = wb.sheet(SH.ac, { cols: [11, 12, 13, 15, 13, 15, 10, 28, 30], freeze: 'A5' });
    const ss = wb.sheet(SH.scr, { cols: [12, 9, 9, 13, 13, 9, 13, 9, 12, 11, 13, 56, 13, 12, 12, 12, 11, 9, 11, 11, 9, 11], landscape: true, freeze: 'B6', tab: '15803D' });
    const sc = wb.sheet(SH.cat, { cols: [12, 15, 22, 9, 60] });
    const sb = wb.sheet(SH.base, { cols: [34, 14, 50] });

    // ---- 基準値 ----
    sb.set('A1', { v: '基準値（ふだんは変えない値）', st: ST.title });
    const baseRows = [
      ['単位換算', u.DISP, 'W から ' + u.U + ' にする割り算（' + (u.kc ? 'kcal/h のままなので 1' : '1 kW ＝ 1,000 W') + '）', '0'],
      ['馬力換算', u.HPU, '1馬力あたりの冷房能力（' + (u.kc ? '1馬力≒2,408 kcal/h' : '1馬力≒2.8 kW') + '。10馬力＝P280）', u.kc ? '#,##0' : '0.0'],
      ['空気の密度', 1.2, 'kg/m³', '0.0'],
      ['補正の始まり', 35, '℃。これより暑いと空調機の能力が下がる', '0'],
      ['補正の割合', 0.015, '1℃あたりの能力の下がり（1.5%）', '0.0%'],
      ['補正の下限', 0.8, '下がっても 80% まで', '0%'],
      ['残りの扱い', 0.05 * (u.kc ? 860 : 1), u.U + '。更新の組み合わせで、これより小さい残りは数えない', u.kc ? '0' : '0.00'],
      ['熱の換算', 4.186, 'kJ → kcal（比エンタルピーを kcal/kg にする時）', '0.000']
    ];
    head(sb, 3, 0, ['名前', '値', '説明']);
    baseRows.forEach((b, i) => { const r = 4 + i; sb.set([r, 0], { v: b[0], st: ST.labB }); sb.set([r, 1], { v: b[1], st: BA(b[3]) }); sb.set([r, 2], { v: b[2], st: ST.lab }); wb.name(b[0], RF(SH.base, 'B' + r)); });
    head(sb, 13, 0, ['能力の低下の段階', '割合', '']);
    x.DEG.forEach((d, i) => { sb.set([14 + i, 0], { v: d[1], st: ST.lab }); sb.set([14 + i, 1], { v: d[0], st: BA('0%') }); });
    wb.name('低下の段階', RF(SH.base, 'B14') + ':' + abs('B18'));
    head(sb, 20, 0, ['計算する・しない', '', '']); sb.set('A21', { v: '○', st: ST.lab }); sb.set('A22', { v: '×', st: ST.lab }); wb.name('する_しない', RF(SH.base, 'A21') + ':' + abs('A22'));
    const capF = (t) => t <= 35 ? 1 : Math.max(0.8, 1 - 0.015 * (t - 35));

    // ---- 入力・条件 ----
    si.set('A1', { v: '入力・条件（シアター）', st: ST.title });
    si.set('A2', { v: '黄色のセルを変えると、すべてのシートが計算し直されます。単位：' + u.U + '（1席あたりは ' + u.UB + '）', st: ST.sub });
    band(si, 4, 0, 5, '1. 外気の条件');
    head(si, 5, 0, ['条件', '外気温 ℃', '相対湿度 %', '説明', '', '']); si.merge('D5:F5');
    S.cases.forEach((c, i) => { const r = 6 + i; si.merge('D' + r + ':F' + r); si.set([r, 0], { v: c.n, st: ST.labB }); si.set([r, 1], { v: c.t, st: IN('0.0') }); si.set([r, 2], { v: c.rh, st: IN('0') }); si.set([r, 3], { v: String(c.note || '').replace(/\{h([\d.]+)\}/g, (m, v) => u.kc ? (Math.round(+v / 4.186 * 100) / 100) + ' kcal/kg' : v + ' kJ/kg'), st: ST.note }); });
    wb.name('条件の一覧', RF(SH.in, 'A6') + ':' + abs('A8'));
    si.set('A10', { v: '計算に使う条件（判定・更新の検討）', st: ST.labB }); si.set('B10', { v: S.cases[S.basis].n, st: IN(null, true) }); si.list('B10', '条件の一覧');
    si.set('C10', { v: '← 押すと選べます', st: ST.note });
    si.set('A11', { v: '条件の番号', st: ST.lab }); si.set('B11', { f: 'MATCH(B10,A6:A8,0)', v: S.basis + 1, st: HP('0') }); wb.name('条件番号', RF(SH.in, 'B11'));
    band(si, 13, 0, 5, '2. 室内の条件');
    si.set('A14', { v: '室内の温度', st: ST.lab }); si.set('B14', { v: S.th.in.t, st: IN('0.0') }); si.set('C14', { v: '℃', st: ST.lab }); si.set('D14', { v: '標準 ' + x.TH_STD.t, st: ST.note });
    si.set('A15', { v: '室内の相対湿度', st: ST.lab }); si.set('B15', { v: S.th.in.rh, st: IN('0') }); si.set('C15', { v: '%', st: ST.lab }); si.set('D15', { v: '標準 ' + x.TH_STD.rh + '（18.6℃WB 相当）', st: ST.note });
    wb.name('室内温度', RF(SH.in, 'B14')); wb.name('室内湿度', RF(SH.in, 'B15'));
    band(si, 17, 0, 5, '3. 算定方法の値（菱熱の算定方法）');
    const kVal = u.kc ? P.k : P.k / 0.86, pVal = u.kc ? P.person : P.person / 0.86, kStd = u.kc ? x.TH_STD.k : x.TH_STD.k / 0.86, pStd = u.kc ? x.TH_STD.person : x.TH_STD.person / 0.86;
    [['1席あたりの空調面積', P.area, '㎡/席', '標準 ' + x.TH_STD.area, '0.0', '空調面積'],
      ['実効温度差（屋根・日射を受ける）', P.etd, '℃', '標準 ' + x.TH_STD.etd, '0.0', '実効温度差'],
      ['熱貫流率', kVal, u.kc ? 'kcal/h・㎡・℃' : 'W/(㎡・K)', '標準 ' + (Math.round(kStd * 1000) / 1000), '0.000', '熱貫流率'],
      ['人体発熱（静座）', pVal, u.UB + '・人', '標準 ' + (Math.round(pStd * 10) / 10), u.kc ? '0' : '0.0', '人体発熱'],
      ['1人あたりの換気量', S.th.oa, 'm³/h・人', '興行場法 25 または 20', '0', '換気量']
    ].forEach((it, i) => { const r = 18 + i; si.set([r, 0], { v: it[0], st: ST.lab }); si.set([r, 1], { v: it[1], st: IN(it[4]) }); si.set([r, 2], { v: it[2], st: ST.lab }); si.set([r, 3], { v: it[3], st: ST.note }); wb.name(it[5], RF(SH.in, 'B' + r)); });
    si.set('A23', { v: '照明', st: ST.lab }); si.set('B23', { v: 0, st: CA('0') }); si.set('C23', { v: '上映中は全消灯のため 0', st: ST.note }); si.merge('C23:F23');
    band(si, 25, 0, 5, '4. 空気の状態（計算）');
    head(si, 26, 0, ['項目', '室内', S.cases[0].n, S.cases[1].n, S.cases[2].n, '計算の仕方']);
    const tIn = S.th.in.t, rhIn = S.th.in.rh;
    const cols = ['B', 'C', 'D', 'E'], tv = [tIn].concat(S.cases.map((c) => c.t)), rhv = [rhIn].concat(S.cases.map((c) => c.rh));
    const hconv = u.kc ? '/熱の換算' : '';
    const hv = tv.map((t, i) => { const X = xo(t, rhv[i]); const h = 1.006 * t + X * (2501 + 1.86 * t) / 1000; return u.kc ? h / 4.186 : h; });
    [['温度 ℃', (i) => i ? `B${5 + i}` : '室内温度', (i) => tv[i], '0.0', '入力から'],
      ['相対湿度 %', (i) => i ? `C${5 + i}` : '室内湿度', (i) => rhv[i], '0', '入力から'],
      ['水蒸気分圧 hPa', (i) => PV(cols[i] + '27', cols[i] + '28'), (i) => pv(tv[i], rhv[i]), '0.00', '6.1078×10^(7.5t/(t+237.3))×相対湿度/100'],
      ['絶対湿度 g/kg', (i) => `622*${cols[i]}29/(1013.25-${cols[i]}29)`, (i) => xo(tv[i], rhv[i]), '0.00', '622×分圧/(1013.25−分圧)'],
      ['比エンタルピー ' + (u.kc ? 'kcal/kg' : 'kJ/kg'), (i) => `(1.006*${cols[i]}27+${cols[i]}30*(2501+1.86*${cols[i]}27)/1000)${hconv}`, (i) => hv[i], '0.00', '1.006t＋x(2501＋1.86t)/1000' + (u.kc ? ' を kcal にする（÷4.186）' : '')],
      ['室内との差 ' + (u.kc ? 'kcal/kg' : 'kJ/kg'), (i) => i ? `MAX(0,${cols[i]}31-$B$31)` : null, (i) => i ? Math.max(0, hv[i] - hv[0]) : null, '0.00', '外気 − 室内（マイナスは 0）']
    ].forEach((it, k) => { const r = 27 + k; si.set([r, 0], { v: it[0], st: ST.lab }); cols.forEach((cl, i) => { const f = it[1](i); si.set(cl + r, f == null ? { v: '—', st: CA(null) } : { f, v: it[2](i), st: CA(it[3]) }); }); si.set([r, 5], { v: it[4], st: ST.note }); });
    band(si, 34, 0, 5, '5. 1席あたりの負荷（' + u.UB + '/席）＝ 躯体 ＋ 人体 ＋ 外気（照明 0・余裕なし）');
    head(si, 35, 0, ['負荷', '計算に使う条件', S.cases[0].n, S.cases[1].n, S.cases[2].n, '計算の仕方']);
    const bodyV = P.area * P.etd * kVal;
    const dhv = [1, 2, 3].map((i) => Math.max(0, hv[i] - hv[0]));
    const oaV = dhv.map((dh) => S.th.oa * 1.2 * dh / (u.kc ? 1 : 3.6));
    const totV = oaV.map((o) => bodyV + pVal + o);
    const cc = ['C', 'D', 'E'];
    const perRow = (r, name, f, v, how) => { si.set([r, 0], { v: name, st: ST.lab }); si.set('B' + r, { f: `INDEX(C${r}:E${r},条件番号)`, v: v[x.S.basis], st: CA(u.fSeat, true) }); cc.forEach((c, i) => si.set(c + r, { f: f(c, i), v: v[i], st: CA(u.fSeat) })); si.set([r, 5], { v: how, st: ST.note }); };
    perRow(36, '躯体（屋根）', () => '空調面積*実効温度差*熱貫流率', [bodyV, bodyV, bodyV], '空調面積 × 実効温度差 × 熱貫流率');
    perRow(37, '人体（静座）', () => '人体発熱', [pVal, pVal, pVal], '人体発熱（満席）');
    perRow(38, '外気', (c) => `換気量*空気の密度*${c}32${u.kc ? '' : '/3.6'}`, oaV, '換気量 × 1.2 kg/m³ × 比エンタルピーの差' + (u.kc ? '' : ' ÷ 3.6'));
    perRow(39, '照明', () => '$B$23', [0, 0, 0], '上映中は全消灯');
    si.set('A40', { v: '合計（1席あたり）', st: ST.labB }); si.set('B40', { f: 'INDEX(C40:E40,条件番号)', v: totV[S.basis], st: CA(u.fSeat, true) }); cc.forEach((c, i) => si.set(c + '40', { f: `SUM(${c}36:${c}39)`, v: totV[i], st: CA(u.fSeat, true) })); si.set('F40', { v: '必要空調能力 ＝ これ × 座席数', st: ST.note });
    wb.name('一席あたりの負荷', RF(SH.in, 'B40'));
    band(si, 42, 0, 5, '6. 外気温による空調機の能力の補正');
    head(si, 43, 0, ['項目', '計算に使う条件', S.cases[0].n, S.cases[1].n, S.cases[2].n, '計算の仕方']);
    const cfv = S.cases.map((c) => capF(c.t));
    si.set('A44', { v: '能力の割合', st: ST.lab }); si.set('B44', { f: 'INDEX(C44:E44,条件番号)', v: cfv[S.basis], st: CA('0.0%', true) });
    cc.forEach((c, i) => si.set(c + '44', { f: `IF(B${6 + i}<=補正の始まり,1,MAX(補正の下限,1-補正の割合*(B${6 + i}-補正の始まり)))`, v: cfv[i], st: CA('0.0%') }));
    si.set('F44', { v: '35℃を超えると1℃につき1.5%下がる（下限80%）', st: ST.note });
    wb.name('外気温の補正', RF(SH.in, 'B44'));

    // ---- 更新機種 ----
    const fam = x.famOf();
    sc.set('A1', { v: '更新に使う機種', st: ST.title });
    sc.set('A2', { v: fam.maker + ' ' + fam.name + (fam.byHz ? '（電源 ' + S.hz + 'Hz）' : ''), st: { font: { b: 1, sz: 12 } } });
    sc.set('A3', { v: '黄色の値はカタログの値に変えられます。小さい順に並べなくても大丈夫です。行は 20 行目まで使えます。', st: ST.note }); sc.merge('A3:E3');
    head(sc, 5, 0, ['馬力', '冷房能力 ' + u.U, '型式', '推定', '']);
    const items = (fam.items || []).slice(0, 15);
    for (let i = 0; i < 15; i++) { const r = 6 + i, it = items[i]; sc.set([r, 0], { v: it ? it.hp : '', st: IN('0.0') }); sc.set([r, 1], { v: it ? u.capIn(it.kw) : '', st: IN(u.fCap) }); sc.set([r, 2], { v: it ? it.model : '', st: IN(null, true) }); sc.set([r, 3], { v: it && it.est ? '※推定' : '', st: IN(null, true) }); }
    wb.name('更新の馬力', RF(SH.cat, 'A6') + ':' + abs('A20')); wb.name('更新の能力', RF(SH.cat, 'B6') + ':' + abs('B20')); wb.name('更新の型式', RF(SH.cat, 'C6') + ':' + abs('C20'));
    const uT = (t) => String(t || '').replace(/\{HP\}/g, u.kc ? '1馬力≒2,408 kcal/h（10馬力＝P280）' : '1馬力≒2.8 kW（10馬力＝P280）').replace(/\{kw:([^}]+)\}/g, (m, v) => v.replace(/[\d.]+/g, (n) => Math.round(u.capIn(+n) * 10) / 10) + ' ' + u.U);
    [['形', fam.form], ['特徴', uT(fam.notes)], ['使った劇場', fam.jobs || '—'], ['出どころ', uT(fam.src)]].forEach((it, i) => { const r = 22 + i; sc.set([r, 0], { v: it[0], st: ST.labB }); sc.set([r, 1], { v: it[1], st: ST.noteB }); sc.merge('B' + r + ':E' + r); sc.height(r, 48); });

    // ---- 機器表 ----
    sa.set('A1', { v: '機器表（既設の空調機）', st: ST.title });
    sa.set('A2', { v: '機器表から読んだ空調機。スクリーンの欄で、どのスクリーン用かを選びます。行を足す時は空いている黄色の行に書きます。', st: ST.sub });
    head(sa, 4, 0, ['記号', 'スクリーン', '冷房能力 ' + u.U, '能力の低下', '定格×低下 ' + u.U, '見込む能力 ' + u.U + '（外気温の補正込み）', '馬力（定格）', '読み取り元', '確かめてほしい所']);
    const acs = S.th.ac, nAc = Math.max(acs.length + 10, 20), ac0 = 5, ac1 = ac0 + nAc - 1;
    for (let i = 0; i < nAc; i++) {
      const r = ac0 + i, a = acs[i]; const cap = a ? u.capIn(+a.cap || 0) : '', deg = a ? (a.deg != null ? a.deg : 1) : '';
      sa.set([r, 0], { v: a ? a.id : '', st: IN(null, true) }); sa.set([r, 1], { v: a ? a.scr : '', st: IN(null, true) }); sa.set([r, 2], { v: cap, st: IN(u.fCap) }); sa.set([r, 3], { v: deg, st: IN('0%') });
      sa.set([r, 4], { f: `IF(C${r}="","",C${r}*IF(D${r}="",1,D${r}))`, v: a ? cap * deg : '', st: CA(u.fCap) });
      sa.set([r, 5], { f: `IF(C${r}="","",E${r}*外気温の補正)`, v: a ? cap * deg * cfv[S.basis] : '', st: CA(u.fCap, true) });
      sa.set([r, 6], { f: `IF(C${r}="","",ROUND(C${r}/馬力換算*2,0)/2)`, v: a ? r05(cap / u.HPU) : '', st: CA(u.fHp) });
      sa.set([r, 7], { v: a ? a.src || '' : '', st: CA(null, false, true) }); sa.set([r, 8], { v: a ? a.chk || '' : '', st: CA(null, false, true) });
    }
    sa.list(`D${ac0}:D${ac1}`, '低下の段階'); sa.list(`B${ac0}:B${ac1}`, 'スクリーンの一覧');
    noteRow(sa, ac1 + 1, 0, 8, '能力の低下を空けた時は 100%（低下なし）として計算します。'); 
    sa.cf(`A${ac0}:I${ac1}`, [{ dxf: D.warn, formula: `$I${ac0}<>""` }]);
    const AC = (col) => RF(SH.ac, col + ac0) + ':' + abs(col + ac1);

    // ---- スクリーン別 ----
    ss.set('A1', { v: 'スクリーン別の必要空調能力と既設能力', st: ST.title });
    const scr = S.th.screens, nS = Math.max(scr.length + 5, 10), s0 = 6, s1 = s0 + nS - 1;
    const rows = [];
    let nShort = 0, nOn = 0;
    const big = Math.max.apply(null, items.map((it) => u.capIn(it.kw)).concat([0]));
    const thr = 0.05 * (u.kc ? 860 : 1);
    for (let i = 0; i < nS; i++) {
      const r = s0 + i, sc0 = scr[i];
      const on = sc0 && sc0.on, seats = sc0 ? (+sc0.seats || 0) : '';
      ss.set([r, 0], { v: sc0 ? sc0.id : '', st: IN(null, true) }); ss.set([r, 1], { v: sc0 ? (on ? '○' : '×') : '', st: IN(null, true) }); ss.set([r, 2], { v: seats, st: IN('#,##0') });
      const per = totV[S.basis];
      ss.set([r, 3], { f: `IF(A${r}="","",一席あたりの負荷)`, v: sc0 ? per : '', st: CA(u.fSeat) });
      const need = on ? per * seats / u.DISP : '';
      ss.set([r, 4], { f: `IF(OR(A${r}="",B${r}<>"○"),"",D${r}*C${r}/単位換算)`, v: need, st: CA(u.fCap, true) });
      ss.set([r, 5], { f: `IF(E${r}="","",ROUND(E${r}/馬力換算*2,0)/2)`, v: on ? r05(need / u.HPU) : '', st: CA(u.fHp) });
      const capv = sc0 ? acs.filter((a) => a.scr === sc0.id).reduce((t, a) => t + u.capIn(+a.cap || 0) * (a.deg != null ? a.deg : 1) * cfv[S.basis], 0) : '';
      ss.set([r, 6], { f: `IF(A${r}="","",SUMIF(${AC('B')},A${r},${AC('F')}))`, v: capv, st: CA(u.fCap, true) });
      ss.set([r, 7], { f: `IF(G${r}="","",ROUND(G${r}/馬力換算*2,0)/2)`, v: sc0 ? r05(capv / u.HPU) : '', st: CA(u.fHp) });
      const diff = on ? capv - need : '';
      ss.set([r, 8], { f: `IF(E${r}="","",G${r}-E${r})`, v: diff, st: CA(u.fDiff, true) });
      const jd = !sc0 ? '' : !on ? '計算しない' : diff >= 0 ? '足りる' : '不足';
      if (on) { nOn++; if (diff < 0) nShort++; }
      ss.set([r, 9], { f: `IF(A${r}="","",IF(B${r}<>"○","計算しない",IF(I${r}>=0,"足りる","不足")))`, v: jd, st: CA(null, true) });
      const kneed = on ? need / cfv[S.basis] : '';
      ss.set([r, 10], { f: `IF(E${r}="","",E${r}/外気温の補正)`, v: kneed, st: CA(u.fCap) });
      // 更新の組み合わせ（大きい機種を並べ、残りを満たす一番小さい機種）
      let n0 = '', rest = '', one = '', nA = '', oneA = '';
      if (on && big > 0) { n0 = Math.floor(kneed / big); rest = kneed - n0 * big; const cand = items.map((it) => u.capIn(it.kw)).filter((v) => v >= rest).sort((a, b) => a - b); one = rest > thr ? (cand[0] || 0) : 0; nA = one === big ? n0 + 1 : n0; oneA = one === big ? 0 : one; }
      ss.set([r, 16], { f: `MAX(更新の能力)`, v: big, st: HP(u.fCap) });
      ss.set([r, 17], { f: `IF(K${r}="","",INT(K${r}/Q${r}))`, v: n0, st: HP('0') });
      ss.set([r, 18], { f: `IF(K${r}="","",K${r}-R${r}*Q${r})`, v: rest, st: HP(u.fCap) });
      ss.set([r, 19], { f: `IF(K${r}="","",IF(S${r}>残りの扱い,SMALL(更新の能力,COUNTIF(更新の能力,"<"&S${r})+1),0))`, v: one, st: HP(u.fCap) });
      ss.set([r, 20], { f: `IF(K${r}="","",IF(T${r}=Q${r},R${r}+1,R${r}))`, v: nA, st: HP('0') });
      ss.set([r, 21], { f: `IF(K${r}="","",IF(T${r}=Q${r},0,T${r}))`, v: oneA, st: HP(u.fCap) });
      const itBy = (v) => items.find((it) => u.capIn(it.kw) === v) || {};
      const part = (v, n) => itBy(v).hp + '馬力（' + itBy(v).model + '）×' + n;
      const plan = !on ? '' : diff >= 0 ? '更新の必要なし' : '更新を検討：' + (nA > 0 ? part(big, nA) : '') + (nA > 0 && oneA > 0 ? ' ＋ ' : '') + (oneA > 0 ? part(oneA, 1) : '');
      const P1 = (V, N) => `INDEX(更新の馬力,MATCH(${V},更新の能力,0))&"馬力（"&INDEX(更新の型式,MATCH(${V},更新の能力,0))&"）×"&${N}`;
      ss.set([r, 11], { f: `IF(E${r}="","",IF(I${r}>=0,"更新の必要なし","更新を検討："&IF(U${r}>0,${P1('Q' + r, 'U' + r)},"")&IF(AND(U${r}>0,V${r}>0)," ＋ ","")&IF(V${r}>0,${P1('V' + r, '1')},"")))`, v: plan, st: CA(null, false, true) });
      ss.set([r, 12], { f: `IF(K${r}="","",U${r}*Q${r}+V${r})`, v: on ? nA * big + oneA : '', st: CA(u.fCap) });
      // 3つの条件での過不足
      ['C', 'D', 'E'].forEach((c, k) => {
        const rated = sc0 ? acs.filter((a) => a.scr === sc0.id).reduce((t, a) => t + u.capIn(+a.cap || 0) * (a.deg != null ? a.deg : 1), 0) : 0;
        const v = on ? rated * cfv[k] - totV[k] * seats / u.DISP : '';
        ss.set([r, 13 + k], { f: `IF(OR(A${r}="",B${r}<>"○"),"",SUMIF(${AC('B')},A${r},${AC('E')})*${RF(SH.in, c + '44')}-${RF(SH.in, c + '40')}*C${r}/単位換算)`, v, st: CA(u.fDiff) });
      });
      rows.push(r);
    }
    wb.name('スクリーンの一覧', RF(SH.scr, 'A' + s0) + ':' + abs('A' + s1));
    ss.set('A2', { f: `"計算に使う条件："&${RF(SH.in, 'B10')}&"（外気 "&INDEX(${RF(SH.in, 'B6')}:${abs('B8')},条件番号)&"℃・"&INDEX(${RF(SH.in, 'C6')}:${abs('C8')},条件番号)&"%）　1席あたり "&TEXT(一席あたりの負荷,"${u.fSeat}")&" ${u.UB}"`, v: `計算に使う条件：${S.cases[S.basis].n}（外気 ${S.cases[S.basis].t}℃・${S.cases[S.basis].rh}%）　1席あたり ${(Math.round(totV[S.basis] * (u.kc ? 100 : 10)) / (u.kc ? 100 : 10)).toFixed(u.kc ? 2 : 1)} ${u.UB}`, st: ST.sub });
    ss.set('A3', { f: `COUNTIF(B${s0}:B${s1},"○")&" スクリーン中 "&COUNTIF(J${s0}:J${s1},"不足")&" スクリーンが足りない"`, v: `${nOn} スクリーン中 ${nShort} スクリーンが足りない`, st: { font: { b: 1, sz: 13, color: nShort ? 'C00000' : '15803D' } } });
    head(ss, 5, 0, ['スクリーン', '計算する', '座席数', '1席あたり ' + u.UB, '必要空調能力 ' + u.U, '必要 馬力', '今の空調機 ' + u.U, '今 馬力', '過不足 ' + u.U, '判定', '更新する時の必要能力 ' + u.U + '（外気温の補正を戻す）', '更新の検討（' + fam.maker + ' ' + fam.name + '）', '組み合わせの能力 ' + u.U, '過不足（' + S.cases[0].n + '）', '過不足（' + S.cases[1].n + '）', '過不足（' + S.cases[2].n + '）', '計算の途中：一番大きい機種', '大きい機種の台数', '残り', '残りに使う機種', '大きい機種の台数（調整後）', '残りの機種（調整後）']);
    ss.height(5, 54);
    ss.list(`B${s0}:B${s1}`, 'する_しない');
    wb.name('_xlnm.Print_Area', RF(SH.scr, 'A1') + ':' + abs('P' + (s1 + 2)), wb.sheets.indexOf(ss));
    addJudgeCf(ss, `J${s0}:J${s1}`, `$J${s0}`, D);
    noteRow(ss, s1 + 2, 0, 11, '必要空調能力 ＝ 1席あたりの負荷 × 座席数（余裕は足さない）。今の空調機 ＝ 機器表の「見込む能力」をスクリーンごとに足したもの（能力の低下・外気温の補正込み）。更新の検討は、更新する時の必要能力を、更新機種のシートの一覧（大きい機種を並べ、残りを満たす一番小さい機種）で満たす組み合わせです。最終の機器選定はメーカーの能力表で確認のこと。');
    ss.height(s1 + 2, 42);
    guideItems();
    return wb;
  }

  /* ============================================================
     シアター以外
     ============================================================ */
  function other(x) {
    const S = x.S, u = setup(x), wb = window.XLSXW.book(), D = judgeCf(wb);
    const ZN = (k) => x.zoneOf(k).n;
    const zs = x.zonesOn();
    const calcRooms = S.rooms.filter((r) => r.calc);
    const SH = { in: '入力・条件', room: '部屋', eq: '機器・換気', res: '結果', pick: '更新の選定', base: '基準値' };
    const CS = S.cases.map((c) => '計算（' + c.n + '）');
    cover(wb, x, u, '空調負荷計算書', zs.map((z) => ZN(z).replace('系統', '')).join('・'));
    const fillG = guide(wb); const LK = {};
    const guideItems = () => fillG([
      ['外気の温度・湿度', RF(SH.in, 'B6'), '標準・酷暑・酷暑（最悪）の外気温と相対湿度。3つの条件は、それぞれ「計算（…）」のシートで計算します。'],
      ['機器を選ぶ基準の条件', RF(SH.in, 'B10'), '結果の「更新の検討」と「負荷の内訳」を、どの条件で出すか。'],
      ['室内の条件・余裕', RF(SH.in, 'B14'), '室内の温度・相対湿度と、必要な能力に足す余裕（%）。'],
      ['座席数（ロビーの人数）', RF(SH.in, 'B20'), '劇場の座席数・入れ替わる割合・ロビーにいる割合から、ロビーの人数を出します。'],
      ['部屋の面積・外壁・ガラス・人数', RF(SH.room, 'C5'), '図面から読んだ値。部屋ごとに 1 行。'],
      ['既設の空調機', RF(SH.eq, 'B' + LK.ac), 'メーカー・形・系統・冷房能力・能力の低下（100〜80%）。'],
      ['厨房・売店の機器', RF(SH.eq, 'C' + LK.eq), '消費電力・台数・稼働率・フードの下か。現地で測った値は「実測」に入れると、そちらを使います。'],
      ['外調機', RF(SH.eq, 'B' + LK.oac), '外調機のあり・なし、風量・冷却能力・吹き出しの温度、系統ごとの行き先の風量。'],
      ['排気・給気（エアバランス）', RF(SH.eq, 'B' + LK.exh), '排気フード・そのほかの排気・専用の給気ファン・全熱交換器。出す方が多い分は外気がそのまま入る。'],
      ['図面に出てこない負荷', RF(SH.eq, 'B' + LK.ex), '出入口・駐車場・エスカレーター・エレベーター・モールの通路のあり・なしと台数など。'],
      ['外壁・ガラス・日射などの基準値', RF(SH.base, 'A1'), '実効温度差・日射熱取得・熱通過率・人の発熱など。建築設備設計基準の表の値に置き換える時はここを変えます。', 40]
    ], ['行を足す時は、表の下の空いている黄色の行に書いてください（式は入っています）。',
      '系統は「基準値」シートの系統の一覧から選びます。新しい系統を増やす時は、Web で足してから出し直してください（結果の表は、出した時の系統で作っています）。',
      '時刻は 9・12・14・16 時で計算し、いちばん大きい時刻を系統のピークにしています。',
      '最終の機器選定はメーカーの能力表で確かめてください。']);
    const si = wb.sheet(SH.in, { cols: [36, 14, 14, 16, 46], freeze: 'A4' });
    const sr = wb.sheet(SH.room, { cols: [18, 17, 9, 10, 7, 7, 7, 7, 7, 7, 7, 7, 8, 9, 9, 13, 8, 16, 9, 9, 9, 22, 24], landscape: true, freeze: 'B5' });
    const se = wb.sheet(SH.eq, { cols: [26, 14, 13, 14, 12, 10, 12, 12, 12, 12, 12, 12, 12, 22, 22], landscape: true });
    const scs = S.cases.map((c, i) => wb.sheet(CS[i], { cols: [17, 20, 18, 8, 11, 11, 11, 11, 60], landscape: true, freeze: 'E12' }));
    const sres = wb.sheet(SH.res, { cols: [20, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 40], landscape: true, tab: '15803D' });
    const sp = wb.sheet(SH.pick, { cols: [10, 16, 13, 14, 12, 11, 12, 11, 11, 11, 7, 11, 16, 8, 9, 60], landscape: true });
    const sb = wb.sheet(SH.base, { cols: [28, 11, 11, 11, 11, 11, 40] });

    // ================= 基準値 =================
    sb.set('A1', { v: '基準値（ふだんは変えない値）', st: ST.title });
    sb.set('A2', { v: '「一般的な目安」の値は、建築設備設計基準の表の値に置き換える予定です。置き換える時は、ここの灰色のセルを変えます。', st: ST.note }); sb.merge('A2:G2');
    let r = 4;
    head(sb, r, 0, ['名前', '値', '', '', '', '', '説明']); r++;
    const consts = [
      ['単位換算', u.DISP, 'W から ' + u.U + ' にする割り算（' + (u.kc ? 'kcal/h のままなので 1' : '1 kW ＝ 1,000 W') + '）', '0'],
      ['馬力換算', u.HPU, '1馬力あたりの冷房能力（' + (u.kc ? '1馬力≒2,408 kcal/h' : '1馬力≒2.8 kW') + '。10馬力＝P280）', u.kc ? '#,##0' : '0.0'],
      ['顕熱係数', 0.336 * u.u, (u.kc ? 'kcal/h' : 'W') + '/(m³/h・℃)。空気の密度1.2 × 比熱' + (u.kc ? '0.24 kcal/(kg・℃)' : '1.006 kJ/(kg・K) ÷ 3.6'), '0.000'],
      ['潜熱係数', 0.834 * u.u, (u.kc ? 'kcal/h' : 'W') + '/(m³/h・g/kg)。空気の密度1.2 × 蒸発潜熱' + (u.kc ? '597 kcal/kg ÷ 1,000' : '2,501 kJ/kg ÷ 3,600'), '0.000'],
      ['補正の始まり', 35, '℃。これより暑いと空調機の能力が下がる', '0'],
      ['補正の割合', 0.015, '1℃あたりの能力の下がり（1.5%）', '0.0%'],
      ['補正の下限', 0.8, '下がっても 80% まで', '0%'],
      ['外壁の基準外気温', 34, '℃。実効温度差の表の外気温（これとの差を足す）', '0'],
      ['外壁の基準室温', 26, '℃。実効温度差の表の室温（これとの差を足す）', '0'],
      ['共用部の温度', 28, '℃。空調していない共用部（モールの通路など）', '0'],
      ['下の階の温度', 28, '℃。エスカレーター・エレベーター・モールの通路から入る空気', '0'],
      ['下の階の絶対湿度', 11.5, 'g/kg', '0.0'],
      ['駐車場の上乗せ', 2, '℃。立体駐車場の空気は外気より暑い', '0'],
      ['風除室ありの空気', 1.2, 'm³。1人が通るたびに入る空気（風除室あり）', '0.0'],
      ['風除室なしの空気', 3.0, 'm³。1人が通るたびに入る空気（風除室なし）', '0.0'],
      ['エスカレーターの風量', 1080, 'm³/h・台（開口 幅1.2m × 高さ2.5m を 0.1 m/s で空気が上がる）', '#,##0'],
      ['エレベーターの風量', 150, 'm³/h・台（扉の開閉）', '#,##0'],
      ['モールの開口の高さ', 2.5, 'm', '0.0'],
      ['モールの風速', 0.05, 'm/s（開いている所を空気が入れかわる速さ）', '0.00']
    ];
    const B = {};
    consts.forEach((c) => { sb.set([r, 0], { v: c[0], st: ST.labB }); sb.set([r, 1], { v: c[1], st: BA(c[3]) }); sb.set([r, 6], { v: c[2], st: ST.lab }); wb.name(c[0], RF(SH.base, 'B' + r)); B[c[0]] = c[1]; r++; });
    r++;
    // 時刻
    head(sb, r, 0, ['時刻', '9時', '12時', '14時', '16時', '', '説明']); r++;
    const rowT = r; sb.set([r, 0], { v: '時刻', st: ST.labB }); x.HOURS.forEach((h, k) => sb.set([r, 1 + k], { v: h, st: BA('0') })); r++;
    const rowDT = r; sb.set([r, 0], { v: '最高気温からの下がり幅 ℃', st: ST.lab }); x.HOURS.forEach((h, k) => sb.set([r, 1 + k], { v: x.DT[h], st: BA('0.0') })); sb.set([r, 6], { v: '時刻の外気温 ＝ 外気温 − 下がり幅', st: ST.note }); r += 2;
    head(sb, r, 0, ['実効温度差 ' + (u.kc ? '℃' : 'K'), '9時', '12時', '14時', '16時', '', '説明（重い壁・一般的な目安）']); r++;
    const ETDr = {}; [['N', '北'], ['E', '東'], ['S', '南'], ['W', '西'], ['roof', '屋根']].forEach((o) => { ETDr[o[0]] = r; sb.set([r, 0], { v: o[1], st: ST.lab }); x.ETD[o[0]].forEach((v, k) => sb.set([r, 1 + k], { v, st: BA('0') })); r++; });
    r++;
    head(sb, r, 0, ['日射熱取得 ' + u.UB + '/㎡', '9時', '12時', '14時', '16時', '', '説明（東京の夏・一般的な目安）']); r++;
    const SHr = {}; [['N', '北'], ['E', '東'], ['S', '南'], ['W', '西']].forEach((o) => { SHr[o[0]] = r; sb.set([r, 0], { v: o[1], st: ST.lab }); x.SHGF[o[0]].forEach((v, k) => sb.set([r, 1 + k], { v: v * u.u, st: BA('#,##0.0') })); r++; });
    r++;
    head(sb, r, 0, ['熱通過率 ' + (u.kc ? 'kcal/h・㎡・℃' : 'W/(㎡・K)'), '値', '', '', '', '', '説明']); r++;
    const Kr = {}; [['wall', '外壁', 'RC造＋断熱相当'], ['glass', 'ガラス', '複層ガラス相当'], ['roof', '屋根', ''], ['part', '共用部との壁', '']].forEach((o) => { Kr[o[0]] = r; sb.set([r, 0], { v: o[1], st: ST.lab }); sb.set([r, 1], { v: x.K[o[0]] * u.u, st: BA('0.000') }); sb.set([r, 6], { v: o[2], st: ST.lab }); wb.name('熱通過率_' + o[1], RF(SH.base, 'B' + r)); r++; });
    r++;
    head(sb, r, 0, ['人の発熱（1人あたり）', '顕熱 ' + u.UB, '潜熱 ' + u.UB, '', '', '', '説明（室温26℃の一般的な目安）']); r++;
    const pp0 = r; Object.keys(x.PEOPLE_N).forEach((k) => { sb.set([r, 0], { v: x.PEOPLE_N[k], st: ST.lab }); sb.set([r, 1], { v: x.PEOPLE[k][0] * u.u, st: BA('#,##0.0') }); sb.set([r, 2], { v: x.PEOPLE[k][1] * u.u, st: BA('#,##0.0') }); r++; });
    wb.name('人の発熱表', RF(SH.base, 'A' + pp0) + ':' + abs('C' + (r - 1))); wb.name('人の種類', RF(SH.base, 'A' + pp0) + ':' + abs('A' + (r - 1)));
    r++;
    head(sb, r, 0, ['能力の低下の段階', '割合', '', '', '', '', '']); r++;
    const dg0 = r; x.DEG.forEach((d) => { sb.set([r, 0], { v: d[1], st: ST.lab }); sb.set([r, 1], { v: d[0], st: BA('0%') }); r++; });
    wb.name('低下の段階', RF(SH.base, 'B' + dg0) + ':' + abs('B' + (r - 1)));
    r++;
    head(sb, r, 0, ['系統の一覧', '', '', '', '', '', '']); r++;
    const zl0 = r; const allZ = x.ZK().map(ZN); allZ.forEach((n) => { sb.set([r, 0], { v: n, st: BA(null, true) }); r++; });
    wb.name('系統の一覧', RF(SH.base, 'A' + zl0) + ':' + abs('A' + (r - 1)));
    r++;
    head(sb, r, 0, ['空調機の形', '', '', '', '', '', '']); r++;
    const fl0 = r; x.FORMS.forEach((f) => { sb.set([r, 0], { v: f, st: BA(null, true) }); r++; });
    wb.name('形の一覧', RF(SH.base, 'A' + fl0) + ':' + abs('A' + (r - 1)));
    r++;
    head(sb, r, 0, ['選べる値', '', '', '', '', '', '']); r++;
    const ab0 = r; ['あり', 'なし'].forEach((v) => { sb.set([r, 0], { v, st: BA(null, true) }); r++; }); wb.name('あり_なし', RF(SH.base, 'A' + ab0) + ':' + abs('A' + (r - 1)));
    const ox0 = r; ['○', '×'].forEach((v) => { sb.set([r, 0], { v, st: BA(null, true) }); r++; }); wb.name('する_しない', RF(SH.base, 'A' + ox0) + ':' + abs('A' + (r - 1)));
    const pm0 = r; ['座席数から', '入力'].forEach((v) => { sb.set([r, 0], { v, st: BA(null, true) }); r++; }); wb.name('人数の出し方', RF(SH.base, 'A' + pm0) + ':' + abs('A' + (r - 1)));
    const sc0 = r; [0.85, 0.6, 0.45].forEach((v, i) => { sb.set([r, 0], { v, st: BA('0.00') }); sb.set([r, 1], { v: ['なし', 'ブラインド', '熱線反射ガラス'][i], st: ST.lab }); r++; }); wb.name('遮へい係数の一覧', RF(SH.base, 'A' + sc0) + ':' + abs('A' + (r - 1)));
    const in0 = r; [1.5, 1, 0.6].forEach((v, i) => { sb.set([r, 0], { v, st: BA('0.0') }); sb.set([r, 1], { v: ['強め', '標準', '弱め'][i], st: ST.lab }); r++; }); wb.name('入り方の一覧', RF(SH.base, 'A' + in0) + ':' + abs('A' + (r - 1)));
    r++;
    // 更新の段階（形ごとに小さい順）
    head(sb, r, 0, ['更新の段階：形', '型番', '能力 ' + u.U, '馬力', '', '', '説明（業務用パッケージの一般的な段階。形ごとに小さい順に並べる）']); r++;
    const st0 = r; const stepRows = [];
    Object.keys(x.FORM_STEPS).forEach((f) => x.FORM_STEPS[f].forEach((k) => { stepRows.push({ f, k, cap: u.capIn(k), name: 'P' + Math.round(k * 10) + '（' + x.PHP[k] + '馬力）', hp: x.PHP[k] }); sb.set([r, 0], { v: f, st: BA(null, true) }); sb.set([r, 1], { v: 'P' + Math.round(k * 10) + '（' + x.PHP[k] + '馬力）', st: BA(null, true) }); sb.set([r, 2], { v: u.capIn(k), st: BA(u.fCap) }); sb.set([r, 3], { v: x.PHP[k], st: BA('0.0') }); r++; }));
    const st1 = r - 1;
    wb.name('段階の形', RF(SH.base, 'A' + st0) + ':' + abs('A' + st1)); wb.name('段階の型番', RF(SH.base, 'B' + st0) + ':' + abs('B' + st1)); wb.name('段階の能力', RF(SH.base, 'C' + st0) + ':' + abs('C' + st1)); wb.name('段階の馬力', RF(SH.base, 'D' + st0) + ':' + abs('D' + st1));
    const BR = (row, k) => RF(SH.base, L(1 + k) + row);   // 時刻 k の基準値

    // ================= 入力・条件 =================
    si.set('A1', { v: '入力・条件（シアター以外）', st: ST.title });
    si.set('A2', { v: '黄色のセルを変えると、すべてのシートが計算し直されます。単位：' + u.U + '（部屋ごとの負荷は ' + u.UB + '）', st: ST.sub });
    band(si, 4, 0, 4, '1. 外気の条件');
    head(si, 5, 0, ['条件', '外気温 ℃', '相対湿度 %', '絶対湿度 g/kg', '説明']);
    S.cases.forEach((c, i) => { const rr = 6 + i; si.set([rr, 0], { v: c.n, st: ST.labB }); si.set([rr, 1], { v: c.t, st: IN('0.0') }); si.set([rr, 2], { v: c.rh, st: IN('0') }); si.set([rr, 3], { f: XF('B' + rr, 'C' + rr), v: xo(c.t, c.rh), st: CA('0.00') }); si.set([rr, 4], { v: String(c.note || '').replace(/\{h([\d.]+)\}/g, (m, v) => u.kc ? (Math.round(+v / 4.186 * 100) / 100) + ' kcal/kg' : v + ' kJ/kg'), st: ST.note }); });
    wb.name('条件の一覧', RF(SH.in, 'A6') + ':' + abs('A8'));
    si.set('A10', { v: '機器を選ぶ基準の条件', st: ST.labB }); si.set('B10', { v: S.cases[S.basis].n, st: IN(null, true) }); si.list('B10', '条件の一覧'); si.set('C10', { v: '← 押すと選べます', st: ST.note });
    si.set('A11', { v: '条件の番号', st: ST.lab }); si.set('B11', { f: 'MATCH(B10,A6:A8,0)', v: S.basis + 1, st: HP('0') }); wb.name('条件番号', RF(SH.in, 'B11'));
    band(si, 13, 0, 4, '2. 室内の条件・余裕');
    const xi = xo(S.indoor.t, S.indoor.rh);
    [['室内の温度', S.indoor.t, '℃', '0.0', '室内温度'], ['室内の相対湿度', S.indoor.rh, '%', '0', '室内湿度']].forEach((it, i) => { const rr = 14 + i; si.set([rr, 0], { v: it[0], st: ST.lab }); si.set([rr, 1], { v: it[1], st: IN(it[3]) }); si.set([rr, 2], { v: it[2], st: ST.lab }); wb.name(it[4], RF(SH.in, 'B' + rr)); });
    si.set('A16', { v: '室内の絶対湿度', st: ST.lab }); si.set('B16', { f: XF('B14', 'B15'), v: xi, st: CA('0.00') }); si.set('C16', { v: 'g/kg', st: ST.lab }); wb.name('室内絶対湿度', RF(SH.in, 'B16'));
    si.set('A17', { v: '余裕', st: ST.lab }); si.set('B17', { v: S.margin, st: IN('0') }); si.set('C17', { v: '%', st: ST.lab }); si.set('D17', { v: '必要な能力 ＝ 負荷 ×（1＋余裕）', st: ST.note }); wb.name('余裕', RF(SH.in, 'B17'));
    band(si, 19, 0, 4, '3. ロビーの人数（座席数から）');
    [['劇場の座席数', S.seats.total, '席', '#,##0'], ['同時に入れ替わる割合', S.seats.turn, '%', '0'], ['そのうちロビーにいる割合', S.seats.stay, '%', '0']].forEach((it, i) => { const rr = 20 + i; si.set([rr, 0], { v: it[0], st: ST.lab }); si.set([rr, 1], { v: it[1], st: IN(it[3]) }); si.set([rr, 2], { v: it[2], st: ST.lab }); });
    const lobby = Math.round(S.seats.total * S.seats.turn / 100 * S.seats.stay / 100), pass = Math.round(S.seats.total * S.seats.turn / 100 * 2);
    si.set('A23', { v: 'ロビーの人数', st: ST.labB }); si.set('B23', { f: 'ROUND(B20*B21/100*B22/100,0)', v: lobby, st: CA('#,##0', true) }); si.set('C23', { v: '人', st: ST.lab }); si.set('D23', { v: '座席数 × 入れ替わる割合 × ロビーにいる割合', st: ST.note }); wb.name('ロビーの人数', RF(SH.in, 'B23'));
    si.set('A24', { v: 'ピークの1時間に出入口を通る人', st: ST.labB }); si.set('B24', { f: 'ROUND(B20*B21/100*2,0)', v: pass, st: CA('#,##0', true) }); si.set('C24', { v: '人', st: ST.lab }); si.set('D24', { v: '座席数 × 入れ替わる割合 × 2（入る・出る）', st: ST.note }); wb.name('通る人数', RF(SH.in, 'B24'));
    band(si, 26, 0, 4, '4. 外気の入り方（図面に出てこない負荷）');
    si.set('A27', { v: '外気の入り方（強め 1.5・標準 1.0・弱め 0.6）', st: ST.lab }); si.set('B27', { v: S.inflow, st: IN('0.0') }); si.list('B27', '入り方の一覧'); si.set('D27', { v: '「この劇場は入口から熱気がよく入る」なら強め', st: ST.note }); wb.name('外気の入り方', RF(SH.in, 'B27'));

    // ================= 部屋 =================
    sr.set('A1', { v: '部屋（計算する部屋だけ）', st: ST.title });
    sr.set('A2', { v: '図面から読んだ値です。黄色を変えられます。部屋を足す時は空いている黄色の行に書きます（系統は一覧から選ぶ）。', st: ST.sub });
    head(sr, 3, 0, ['', '', '', '', '外壁 ㎡', '', '', '', 'ガラス ㎡', '', '', '', '', '', '', '人', '', '', '', '', '', '', '']);
    sr.merge('E3:H3'); sr.merge('I3:L3'); sr.merge('P3:U3');
    head(sr, 4, 0, ['部屋', '系統', '床面積 ㎡', '照明 ' + u.UB + '/㎡', '北', '東', '南', '西', '北', '東', '南', '西', '屋根 ㎡', '共用部との壁 ㎡', '遮へい係数', '人数の出し方', '人数（入力）', '人の種類', '人数（計算に使う）', '1人の顕熱 ' + u.UB, '1人の潜熱 ' + u.UB, '読み取り元', '確かめてほしい所']);
    sr.height(4, 36);
    const nR = calcRooms.length + 3, r0 = 5, r1 = r0 + nR - 1;
    const roomV = [];
    for (let i = 0; i < nR; i++) {
      const rr = r0 + i, rm = calcRooms[i], e = rm ? rm.env : { wall: {}, glass: {} };
      const kindKey = rm ? (rm.people.kind || 'lobby') : 'lobby', kindN = x.PEOPLE_N[kindKey];
      const n = rm ? (rm.people.auto ? lobby : (+rm.people.n || 0)) : 0;
      const ps = rm ? x.PEOPLE[kindKey][0] * u.u : 0, pl = rm ? x.PEOPLE[kindKey][1] * u.u : 0;
      const v = rm ? { name: rm.name, zone: ZN(rm.zone), area: +rm.area || 0, light: rm.light * u.u, wall: ['N', 'E', 'S', 'W'].map((o) => +(e.wall || {})[o] || 0), glass: ['N', 'E', 'S', 'W'].map((o) => +(e.glass || {})[o] || 0), roof: +e.roof || 0, part: +e.part || 0, sc: +rm.sc, n, ps, pl } : null;
      roomV.push(v);
      sr.set([rr, 0], { v: rm ? rm.name : '', st: IN(null, true) }); sr.set([rr, 1], { v: rm ? v.zone : '', st: IN(null, true) });
      sr.set([rr, 2], { v: rm ? v.area : '', st: IN('#,##0.0') }); sr.set([rr, 3], { v: rm ? v.light : '', st: IN('0.0') });
      for (let k = 0; k < 4; k++) { sr.set([rr, 4 + k], { v: rm ? v.wall[k] : '', st: IN('#,##0.0') }); sr.set([rr, 8 + k], { v: rm ? v.glass[k] : '', st: IN('#,##0.0') }); }
      sr.set([rr, 12], { v: rm ? v.roof : '', st: IN('#,##0.0') }); sr.set([rr, 13], { v: rm ? v.part : '', st: IN('#,##0.0') }); sr.set([rr, 14], { v: rm ? v.sc : '', st: IN('0.00') });
      sr.set([rr, 15], { v: rm ? (rm.people.auto ? '座席数から' : '入力') : '', st: IN(null, true) }); sr.set([rr, 16], { v: rm && !rm.people.auto ? n : '', st: IN('#,##0') }); sr.set([rr, 17], { v: rm ? kindN : '', st: IN(null, true) });
      sr.set([rr, 18], { f: `IF(A${rr}="",0,IF(P${rr}="座席数から",ロビーの人数,N(Q${rr})))`, v: n, st: CA('#,##0') });
      sr.set([rr, 19], { f: `IF(A${rr}="",0,IFERROR(VLOOKUP(R${rr},人の発熱表,2,FALSE),0))`, v: ps, st: CA('#,##0.0') });
      sr.set([rr, 20], { f: `IF(A${rr}="",0,IFERROR(VLOOKUP(R${rr},人の発熱表,3,FALSE),0))`, v: pl, st: CA('#,##0.0') });
      sr.set([rr, 21], { v: rm ? rm.src || '' : '', st: CA(null, false, true) }); sr.set([rr, 22], { v: rm ? rm.chk || '' : '', st: CA(null, false, true) });
    }
    sr.list(`B${r0}:B${r1}`, '系統の一覧'); sr.list(`O${r0}:O${r1}`, '遮へい係数の一覧'); sr.list(`P${r0}:P${r1}`, '人数の出し方'); sr.list(`R${r0}:R${r1}`, '人の種類');
    sr.cf(`A${r0}:W${r1}`, [{ dxf: D.warn, formula: `$W${r0}<>""` }]);
    const RM = (col, rr) => RF(SH.room, col + rr);
    const RMr = (col) => RF(SH.room, col + r0) + ':' + abs(col + r1);

    // ================= 機器・換気 =================
    se.set('A1', { v: '機器・換気（既設の空調機・厨房機器・外調機・排気・図面に出てこない負荷）', st: ST.title });
    let er = 3;
    band(se, er, 0, 9, '1. 既設の空調機'); er++;
    head(se, er, 0, ['記号', 'メーカー', '形', '系統', '冷房能力 ' + u.U, '能力の低下', '定格×低下 ' + u.U, '馬力（定格）', '読み取り元', '確かめてほしい所']); er++;
    const nA = Math.max(S.ac.length + 5, 10), a0 = er, a1 = a0 + nA - 1;
    for (let i = 0; i < nA; i++) {
      const rr = a0 + i, a = S.ac[i], cap = a ? u.capIn(+a.cap || 0) : '', deg = a ? (a.deg != null ? a.deg : 1) : '';
      se.set([rr, 0], { v: a ? a.id : '', st: IN(null, true) }); se.set([rr, 1], { v: a ? a.maker || '' : '', st: IN(null, true) }); se.set([rr, 2], { v: a ? a.kind : '', st: IN(null, true) }); se.set([rr, 3], { v: a ? ZN(a.zone) : '', st: IN(null, true) });
      se.set([rr, 4], { v: cap, st: IN(u.fCap) }); se.set([rr, 5], { v: deg, st: IN('0%') });
      se.set([rr, 6], { f: `IF(E${rr}="",0,E${rr}*IF(F${rr}="",1,F${rr}))`, v: a ? cap * deg : 0, st: CA(u.fCap) });
      se.set([rr, 7], { f: `IF(E${rr}="","",ROUND(E${rr}/馬力換算*2,0)/2)`, v: a ? r05(cap / u.HPU) : '', st: CA(u.fHp) });
      se.set([rr, 8], { v: a ? a.src || '' : '', st: CA(null, false, true) }); se.set([rr, 9], { v: a ? a.chk || '' : '', st: CA(null, false, true) });
    }
    LK.ac = a0; se.list(`C${a0}:C${a1}`, '形の一覧'); se.list(`D${a0}:D${a1}`, '系統の一覧'); se.list(`F${a0}:F${a1}`, '低下の段階');
    se.cf(`A${a0}:J${a1}`, [{ dxf: D.warn, formula: `$J${a0}<>""` }]);
    const ACr = (col) => RF(SH.eq, col + a0) + ':' + abs(col + a1);
    noteRow(se, a1 + 1, 0, 9, '能力の低下を空けた時は 100%（低下なし）として計算します。系統は「基準値」シートの一覧から選びます。');
    er = a1 + 3;
    band(se, er, 0, 14, '2. 厨房・売店の機器（部屋に出る熱）'); er++;
    head(se, er, 0, ['機器', '系統', '消費電力 ' + u.U, '台数', '稼働率', 'フードの下', '実測 ' + u.U, '顕熱の割合（フードの下）', '顕熱の割合（フードなし）', '潜熱の割合（フードの下）', '潜熱の割合（フードなし）', '顕熱 ' + u.UB, '潜熱 ' + u.UB, '読み取り元', '確かめてほしい所']); se.height(er, 44); er++;
    const nE = Math.max(S.equip.length + 5, 8), e0 = er, e1 = e0 + nE - 1; LK.eq = e0;
    const eqV = [];
    for (let i = 0; i < nE; i++) {
      const rr = e0 + i, m = S.equip[i];
      const c = m ? x.cat(m.ck) : { sh: 1, lh: 0 };
      const shH = c.sh, shN = c.shN != null ? c.shN : c.sh, lhH = c.lh, lhN = c.lhN != null ? c.lhN : c.lh;
      const hood = m ? (m.hood && c.hoodable ? '○' : '×') : '';
      const kwv = m ? u.capIn(+m.kw || 0) : '', real = m && m.real !== '' && m.real != null ? u.capIn(+m.real) : '';
      const use = m ? (real !== '' ? real : kwv) : 0;
      const shv = m ? use * u.DISP * m.q * m.use * (hood === '○' ? shH : shN) : 0, lhv = m ? use * u.DISP * m.q * m.use * (hood === '○' ? lhH : lhN) : 0;
      eqV.push(m ? { zone: ZN(m.zone), sh: shv, lh: lhv } : null);
      se.set([rr, 0], { v: m ? m.n : '', st: IN(null, true) }); se.set([rr, 1], { v: m ? ZN(m.zone) : '', st: IN(null, true) }); se.set([rr, 2], { v: kwv, st: IN(u.kc ? '#,##0' : '0.00') }); se.set([rr, 3], { v: m ? m.q : '', st: IN('0') }); se.set([rr, 4], { v: m ? m.use : '', st: IN('0.0') });
      se.set([rr, 5], { v: hood, st: IN(null, true) }); se.set([rr, 6], { v: real, st: IN(u.kc ? '#,##0' : '0.00') });
      [shH, shN, lhH, lhN].forEach((v, k) => se.set([rr, 7 + k], { v: m ? v : '', st: BA('0.00') }));
      se.set([rr, 11], { f: `IF(A${rr}="",0,IF(G${rr}="",C${rr},G${rr})*単位換算*D${rr}*E${rr}*IF(F${rr}="○",H${rr},I${rr}))`, v: shv, st: CA('#,##0') });
      se.set([rr, 12], { f: `IF(A${rr}="",0,IF(G${rr}="",C${rr},G${rr})*単位換算*D${rr}*E${rr}*IF(F${rr}="○",J${rr},K${rr}))`, v: lhv, st: CA('#,##0') });
      se.set([rr, 13], { v: m ? m.src || '' : '', st: CA(null, false, true) }); se.set([rr, 14], { v: m ? m.chk || '' : '', st: CA(null, false, true) });
    }
    se.list(`B${e0}:B${e1}`, '系統の一覧'); se.list(`F${e0}:F${e1}`, 'する_しない');
    se.cf(`A${e0}:O${e1}`, [{ dxf: D.warn, formula: `$O${e0}<>""` }]);
    er = e1 + 1; noteRow(se, er, 0, 14, '顕熱・潜熱 ＝（実測があれば実測、なければ消費電力）× 台数 × 稼働率 × 部屋に出る割合。割合は機器ごとの一般的な目安（灰色）。冷蔵ショーケース・製氷機（内蔵）は 1.5（機器の中の冷やす熱も部屋に出る）。'); se.height(er, 30); er += 2;
    const EQr = (col) => RF(SH.eq, col + e0) + ':' + abs(col + e1);
    // 外調機
    band(se, er, 0, 9, '3. 外調機（冷やした外気を入れる）'); er++; LK.oac = er;
    const O = {};
    [['外調機あり（○／×）', S.oac.on ? '○' : '×', null, 'oacOn', true], ['記号', S.oac.id, null, 'oacId', true], ['風量 m³/h', S.oac.flow, '#,##0', 'oacFlow'], ['冷却能力 ' + u.U, u.capIn(S.oac.cap), u.fCap, 'oacCap'], ['吹き出しの温度 ℃', S.oac.ts, '0.0', 'oacTs'], ['吹き出しの絶対湿度 g/kg', S.oac.xs, '0.0', 'oacXs']].forEach((it) => { se.set([er, 0], { v: it[0], st: ST.lab }); se.set([er, 1], { v: it[1], st: IN(it[2], it[4]) }); O[it[3]] = RF(SH.eq, 'B' + er); er++; });
    se.list(O.oacOn.split('!')[1].replace(/\$/g, ''), 'する_しない');
    se.set([er, 0], { v: '行き先の系統', st: ST.th }); se.set([er, 1], { v: '風量 m³/h', st: ST.th }); er++;
    const toRef = {};
    zs.forEach((z) => { se.set([er, 0], { v: ZN(z), st: ST.lab }); se.set([er, 1], { v: +S.oac.to[z] || 0, st: IN('#,##0') }); toRef[z] = RF(SH.eq, 'B' + er); er++; });
    se.set([er, 0], { v: '外調機の吹き出しは部屋の空気より冷たいので、部屋を冷やす側（マイナス）になることがあります。湿気は取る側なので足しません。', st: ST.note }); se.merge('A' + er + ':J' + er); er += 2;
    // 排気・給気・全熱交換器
    band(se, er, 0, 9, '4. 排気・給気・全熱交換器（エアバランス）'); er++; LK.exh = er;
    const hi = x.hoodInflow();
    [['排気フード m³/h', S.exh.hood, '#,##0', 'hood', S.exh.hoodSrc], ['そのほかの排気（便所など） m³/h', S.exh.other, '#,##0', 'other', S.exh.otherSrc], ['専用の給気ファン（外気そのまま） m³/h', S.ab.sf, '#,##0', 'sf', S.ab.sfSrc], ['給気ファンの外気が部屋に混ざる割合', S.ab.mix, '0.0', 'mix', ''], ['全熱交換器の風量 m³/h', S.hex.flow, '#,##0', 'hexF', S.hex.src], ['全熱交換器の交換効率', S.hex.eff, '0.00', 'hexE', '']].forEach((it) => { se.set([er, 0], { v: it[0], st: ST.lab }); se.set([er, 1], { v: it[1], st: IN(it[2]) }); se.set([er, 2], { v: it[4] || '', st: ST.note }); se.merge('C' + er + ':J' + er); O[it[3]] = RF(SH.eq, 'B' + er); er++; });
    se.set([er, 0], { v: '全熱交換器のある系統', st: ST.lab }); se.set([er, 1], { v: ZN(S.hex.zone), st: IN(null, true) }); se.list('B' + er, '系統の一覧'); O.hexZ = RF(SH.eq, 'B' + er); er++;
    se.set([er, 0], { v: '入れる空気の合計 m³/h', st: ST.labB }); se.set([er, 1], { f: `IF(${O.oacOn}="○",${O.oacFlow},0)+${O.sf}`, v: hi.sup, st: CA('#,##0', true) }); se.set([er, 2], { v: '外調機（ありの時）＋ 専用の給気ファン', st: ST.note }); O.sup = RF(SH.eq, 'B' + er); er++;
    se.set([er, 0], { v: '出す空気の合計 m³/h', st: ST.labB }); se.set([er, 1], { f: `${O.hood}+${O.other}`, v: hi.exh, st: CA('#,##0', true) }); se.set([er, 2], { v: '排気フード ＋ そのほかの排気', st: ST.note }); O.exh = RF(SH.eq, 'B' + er); er++;
    se.set([er, 0], { v: '外の空気がそのまま入る分 m³/h', st: ST.labB }); se.set([er, 1], { f: `MAX(0,${O.exh}-${O.sup})`, v: hi.raw, st: CA('#,##0', true) }); se.set([er, 2], { v: '出す方が多い分は、出入口やすき間から冷やされないまま入る（ロビーが冷えない原因になりやすい所）', st: ST.note }); se.merge('C' + er + ':J' + er); O.raw = RF(SH.eq, 'B' + er); er++;
    se.set([er, 0], { v: 'その外気が入ってくる系統', st: ST.lab }); se.set([er, 1], { v: ZN(S.ab.enter), st: IN(null, true) }); se.list('B' + er, '系統の一覧'); O.enter = RF(SH.eq, 'B' + er); er += 2;
    // 図面に出てこない負荷
    band(se, er, 0, 9, '5. 図面に出てこない負荷（風量は見て分かることから計算）'); er++;
    head(se, er, 0, ['項目', 'あり・なし', '入る系統', '風除室', '駐車場から来る割合 %', '台数', '開いている幅 m', '風量 m³/h（外気の入り方込み）', '入ってくる空気', '計算のもと']); se.height(er, 44); er++;
    const XR = {}; LK.ex = er;
    const exKeys = ['door', 'park', 'esc', 'ev', 'mall'];
    exKeys.forEach((k) => { XR[k] = er; er++; });
    exKeys.forEach((k) => {
      const e = S.extra[k], rr = XR[k];
      se.set([rr, 0], { v: e.n, st: ST.labB }); se.set([rr, 1], { v: e.on ? 'あり' : 'なし', st: IN(null, true) }); se.set([rr, 2], { v: ZN(e.zone), st: IN(null, true) });
      se.set([rr, 3], { v: (k === 'door' || k === 'park') ? (e.vest ? 'あり' : 'なし') : '', st: (k === 'door' || k === 'park') ? IN(null, true) : CA(null) });
      se.set([rr, 4], { v: k === 'park' ? e.share : '', st: k === 'park' ? IN('0') : CA(null) });
      se.set([rr, 5], { v: (k === 'esc' || k === 'ev') ? e.count : '', st: (k === 'esc' || k === 'ev') ? IN('0') : CA(null) });
      se.set([rr, 6], { v: k === 'mall' ? e.width : '', st: k === 'mall' ? IN('0.0') : CA(null) });
      const vol = (rw) => `IF(D${rw}="あり",風除室ありの空気,風除室なしの空気)`;
      const f = { door: `ROUND(通る人数*IF(B${XR.park}="あり",MAX(0,100-E${XR.park}),100)/100*${vol(rr)},0)`, park: `ROUND(通る人数*E${rr}/100*${vol(rr)},0)`, esc: `ROUND(F${rr}*エスカレーターの風量,0)`, ev: `F${rr}*エレベーターの風量`, mall: `ROUND(G${rr}*モールの開口の高さ*モールの風速*3600,0)` }[k];
      se.set([rr, 7], { f: `IF(B${rr}="あり",${f}*外気の入り方,0)`, v: e.on ? x.extraFlow(k) * S.inflow : 0, st: CA('#,##0', true) });
      se.set([rr, 8], { v: e.src === 'outside' ? '外気' : e.src === 'park' ? '外気 ＋ 駐車場の上乗せ' : '下の階・通路の空気', st: CA(null, false, true) });
      se.set([rr, 9], { v: { door: 'ピークの1時間に通る人 × 1人あたりの空気（風除室あり1.2・なし3.0 m³）。駐車場から来る人は除く', park: '通る人 × 駐車場から来る割合 × 1人あたりの空気', esc: '1台 1,080 m³/h × 台数', ev: '1台 150 m³/h × 台数', mall: '幅 × 高さ2.5m × 0.05m/s × 3600' }[k], st: ST.note });
      se.list('B' + rr, 'あり_なし'); se.list('C' + rr, '系統の一覧'); if (k === 'door' || k === 'park') se.list('D' + rr, 'あり_なし');
    });
    const EX = (k, col) => RF(SH.eq, col + XR[k]);

    // ================= 計算（条件ごと） =================
    const parts = ['外壁', 'ガラス（温度）', '日射', '屋根', '共用部との壁', '照明', '人', '機器', '外気（外調機）', '外気（換気）', '給気より排気が多い分（外気）', '専用給気ファンの外気', 'すきま風・出入口'];
    const caseOut = [];
    S.cases.forEach((C, ci) => {
      const sh = scs[ci];
      sh.set('A1', { v: CS[ci] + ' — 時刻ごとの負荷（' + u.UB + '）', st: ST.title });
      const to = x.HOURS.map((h) => C.t - x.DT[h]);
      const xoc = xo(C.t, C.rh), ti = S.indoor.t;
      const cf = C.t <= 35 ? 1 : Math.max(0.8, 1 - 0.015 * (C.t - 35));
      [['外気温 ℃', `${RF(SH.in, 'B' + (6 + ci))}`, C.t, '0.0'], ['外気の相対湿度 %', `${RF(SH.in, 'C' + (6 + ci))}`, C.rh, '0'], ['外気の絶対湿度 g/kg', `${RF(SH.in, 'D' + (6 + ci))}`, xoc, '0.00'], ['室内の温度 ℃', '室内温度', ti, '0.0'], ['室内の絶対湿度 g/kg', '室内絶対湿度', xi, '0.00'], ['外気温による能力の補正', `IF(B3<=補正の始まり,1,MAX(補正の下限,1-補正の割合*(B3-補正の始まり)))`, cf, '0.0%']].forEach((it, k) => { const rr = 3 + k; sh.set([rr, 0], { v: it[0], st: ST.lab }); sh.set([rr, 1], { f: it[1], v: it[2], st: CA(it[3], true) }); });
      head(sh, 10, 0, ['系統', '部屋・機器', '負荷の種類', '顕熱・潜熱', '9時', '12時', '14時', '16時', '計算の仕方']);
      const HC = ['E', 'F', 'G', 'H'];
      sh.set('C11', { v: '時刻の外気温 ℃', st: ST.labB }); HC.forEach((c, k) => sh.set(c + '11', { f: `$B$3-${BR(rowDT, k)}`, v: to[k], st: CA('0.0', true) })); sh.set('I11', { v: '外気温 − 時刻の下がり幅（基準値）', st: ST.note });
      let cr = 12; const rowsZ = [];   // [zone, values[4]]
      const put = (zoneF, zoneV, nameF, nameV, part, sl, fn, vals, how) => {
        sh.set([cr, 0], typeof zoneF === 'string' && zoneF.startsWith('=') ? { f: zoneF.slice(1), v: zoneV, st: CA(null, false, true) } : { v: zoneV, st: CA(null, false, true) });
        sh.set([cr, 1], typeof nameF === 'string' && nameF.startsWith('=') ? { f: nameF.slice(1), v: nameV, st: CA(null, false, true) } : { v: nameV, st: CA(null, false, true) });
        sh.set([cr, 2], { v: part, st: CA(null, false, true) }); sh.set([cr, 3], { v: sl, st: CA(null) });
        HC.forEach((c, k) => sh.set(c + cr, { f: fn(c, k), v: vals[k], st: CA('#,##0') }));
        sh.set([cr, 8], { v: how, st: ST.note });
        rowsZ.push({ zone: zoneV, part, vals }); cr++;
      };
      // 部屋ごと
      roomV.forEach((v, i) => {
        const rr = r0 + i;
        const zF = `=IF(${RM('A', rr)}="","",${RM('B', rr)})`, nF = `=IF(${RM('A', rr)}="","",${RM('A', rr)})`;
        const zv = v ? v.zone : '', nv = v ? v.name : '';
        const dirs = ['N', 'E', 'S', 'W'], wc = ['E', 'F', 'G', 'H'], gc = ['I', 'J', 'K', 'L'];
        const wallV = x.HOURS.map((h, k) => v ? x.K.wall * u.u * dirs.reduce((t, o, j) => t + v.wall[j] * Math.max(0, x.ETD[o][k] + (C.t - 34) + (26 - ti)), 0) : 0);
        put(zF, zv, nF, nv, '外壁', '顕熱', (c, k) => `熱通過率_外壁*(${dirs.map((o, j) => `${RM(wc[j], rr)}*MAX(0,${BR(ETDr[o], k)}+$B$3-外壁の基準外気温+外壁の基準室温-$B$6)`).join('+')})`, wallV, '外壁の面積（方位ごと）× 熱通過率 × 実効温度差（＋外気温と室温の補正）');
        const gsum = v ? v.glass.reduce((a, b) => a + b, 0) : 0;
        put(zF, zv, nF, nv, 'ガラス（温度）', '顕熱', (c) => `(${gc.map((g) => RM(g, rr)).join('+')})*熱通過率_ガラス*(${c}$11-$B$6)`, to.map((t) => gsum * x.K.glass * u.u * (t - ti)), 'ガラスの面積 × 熱通過率 ×（時刻の外気温 − 室温）');
        put(zF, zv, nF, nv, '日射', '顕熱', (c, k) => `(${dirs.map((o, j) => `${RM(gc[j], rr)}*${BR(SHr[o], k)}`).join('+')})*${RM('O', rr)}`, x.HOURS.map((h, k) => v ? dirs.reduce((t, o, j) => t + v.glass[j] * x.SHGF[o][k] * u.u, 0) * v.sc : 0), 'ガラスの面積 × 日射熱取得（方位・時刻）× 遮へい係数');
        put(zF, zv, nF, nv, '屋根', '顕熱', (c, k) => `${RM('M', rr)}*熱通過率_屋根*(${BR(ETDr.roof, k)}+$B$3-外壁の基準外気温)`, x.HOURS.map((h, k) => v ? v.roof * x.K.roof * u.u * (x.ETD.roof[k] + (C.t - 34)) : 0), '屋根の面積 × 熱通過率 × 実効温度差');
        put(zF, zv, nF, nv, '共用部との壁', '顕熱', () => `${RM('N', rr)}*熱通過率_共用部との壁*(共用部の温度-$B$6)`, [0, 1, 2, 3].map(() => v ? v.part * x.K.part * u.u * (28 - ti) : 0), '共用部との壁の面積 × 熱通過率 ×（共用部の温度 − 室温）');
        put(zF, zv, nF, nv, '照明', '顕熱', () => `${RM('C', rr)}*${RM('D', rr)}`, [0, 1, 2, 3].map(() => v ? v.area * v.light : 0), '床面積 × 照明');
        put(zF, zv, nF, nv, '人', '顕熱', () => `${RM('S', rr)}*${RM('T', rr)}`, [0, 1, 2, 3].map(() => v ? v.n * v.ps : 0), '人数 × 1人の顕熱');
        put(zF, zv, nF, nv, '人', '潜熱', () => `${RM('S', rr)}*${RM('U', rr)}`, [0, 1, 2, 3].map(() => v ? v.n * v.pl : 0), '人数 × 1人の潜熱');
      });
      // 系統ごと: 機器・外調機
      zs.forEach((z) => {
        const zn = ZN(z);
        const esh = eqV.filter((e) => e && e.zone === zn).reduce((t, e) => t + e.sh, 0), elh = eqV.filter((e) => e && e.zone === zn).reduce((t, e) => t + e.lh, 0);
        put(zn, zn, '厨房・売店の機器', '厨房・売店の機器', '機器', '顕熱', () => `SUMIF(${EQr('B')},$A${cr},${EQr('L')})`, [esh, esh, esh, esh], '機器・換気シートの顕熱をこの系統で合計');
        put(zn, zn, '厨房・売店の機器', '厨房・売店の機器', '機器', '潜熱', () => `SUMIF(${EQr('B')},$A${cr},${EQr('M')})`, [elh, elh, elh, elh], '機器・換気シートの潜熱をこの系統で合計');
        const qv = S.oac.on ? (+S.oac.to[z] || 0) : 0, ov = 0.336 * u.u * qv * (S.oac.ts - ti);
        put(zn, zn, '外調機 ' + S.oac.id, '外調機', '外気（外調機）', '顕熱', () => `IF(${O.oacOn}="○",顕熱係数*${toRef[z]}*(${O.oacTs}-$B$6),0)`, [ov, ov, ov, ov], '顕熱係数 × この系統への風量 ×（吹き出しの温度 − 室温）');
      });
      // 全熱交換器・エアバランス・給気ファン・図面に出てこない負荷
      const hexQ = S.hex.flow * (1 - S.hex.eff);
      put(`=${O.hexZ}`, ZN(S.hex.zone), '全熱交換器', '全熱交換器', '外気（換気）', '顕熱', (c) => `顕熱係数*${O.hexF}*(1-${O.hexE})*(${c}$11-$B$6)`, to.map((t) => 0.336 * u.u * hexQ * (t - ti)), '顕熱係数 × 風量 ×（1−交換効率）×（時刻の外気温 − 室温）');
      put(`=${O.hexZ}`, ZN(S.hex.zone), '全熱交換器', '全熱交換器', '外気（換気）', '潜熱', () => `MAX(0,潜熱係数*${O.hexF}*(1-${O.hexE})*($B$5-$B$7))`, [0, 1, 2, 3].map(() => Math.max(0, 0.834 * u.u * hexQ * (xoc - xi))), '潜熱係数 × 風量 ×（1−交換効率）×（外気 − 室内の絶対湿度）');
      put(`=${O.enter}`, ZN(S.ab.enter), '出す空気が多い分', '給気より排気が多い分', '給気より排気が多い分（外気）', '顕熱', (c) => `顕熱係数*${O.raw}*(${c}$11-$B$6)`, to.map((t) => 0.336 * u.u * hi.raw * (t - ti)), '顕熱係数 × 外の空気がそのまま入る分 ×（時刻の外気温 − 室温）');
      put(`=${O.enter}`, ZN(S.ab.enter), '出す空気が多い分', '給気より排気が多い分', '給気より排気が多い分（外気）', '潜熱', () => `MAX(0,潜熱係数*${O.raw}*($B$5-$B$7))`, [0, 1, 2, 3].map(() => Math.max(0, 0.834 * u.u * hi.raw * (xoc - xi))), '潜熱係数 × 外の空気がそのまま入る分 × 絶対湿度の差');
      const sfZone = zs.indexOf('conc') >= 0 ? ZN('conc') : ZN(S.ab.enter), sfq = S.ab.sf * S.ab.mix;
      const sfZF = `=IF(COUNTIF(${RMr('B')},"${ZN('conc')}")>0,"${ZN('conc')}",${O.enter})`;
      put(sfZF, sfZone, '専用の給気ファン', '専用の給気ファン', '専用給気ファンの外気', '顕熱', (c) => `顕熱係数*${O.sf}*${O.mix}*(${c}$11-$B$6)`, to.map((t) => 0.336 * u.u * sfq * (t - ti)), '顕熱係数 × 給気ファンの風量 × 混ざる割合 ×（時刻の外気温 − 室温）');
      put(sfZF, sfZone, '専用の給気ファン', '専用の給気ファン', '専用給気ファンの外気', '潜熱', () => `MAX(0,潜熱係数*${O.sf}*${O.mix}*($B$5-$B$7))`, [0, 1, 2, 3].map(() => Math.max(0, 0.834 * u.u * sfq * (xoc - xi))), '潜熱係数 × 給気ファンの風量 × 混ざる割合 × 絶対湿度の差');
      exKeys.forEach((k) => {
        const e = S.extra[k], qx = e.on ? x.extraFlow(k) * S.inflow : 0;
        const Tf = (c) => e.src === 'outside' ? `${c}$11` : e.src === 'park' ? `(${c}$11+駐車場の上乗せ)` : '下の階の温度';
        const Xf = e.src === 'mall' ? '下の階の絶対湿度' : '$B$5';
        const Tv = (t) => e.src === 'outside' ? t : e.src === 'park' ? t + 2 : 28;
        const Xv = e.src === 'mall' ? 11.5 : xoc;
        put(`=${EX(k, 'C')}`, ZN(e.zone), e.n, e.n, 'すきま風・出入口', '顕熱', (c) => `顕熱係数*${EX(k, 'H')}*(${Tf(c)}-$B$6)`, to.map((t) => 0.336 * u.u * qx * (Tv(t) - ti)), '顕熱係数 × 風量 ×（入ってくる空気の温度 − 室温）');
        put(`=${EX(k, 'C')}`, ZN(e.zone), e.n, e.n, 'すきま風・出入口', '潜熱', () => `MAX(0,潜熱係数*${EX(k, 'H')}*(${Xf}-$B$7))`, [0, 1, 2, 3].map(() => Math.max(0, 0.834 * u.u * qx * (Xv - xi))), '潜熱係数 × 風量 × 絶対湿度の差');
      });
      const L0 = 12, L1 = cr - 1;
      // 系統のまとめ
      cr += 1; band(sh, cr, 0, 8, '系統ごとのまとめ（' + C.n + '）'); cr++;
      head(sh, cr, 0, ['系統', 'ピークの負荷 ' + u.UB, 'ピーク時刻', '時刻の番号', '9時', '12時', '14時', '16時', '']); cr++;
      const zRow = {}; const zv = {};
      zs.forEach((z) => {
        const zn = ZN(z); zRow[z] = cr;
        const hv = [0, 1, 2, 3].map((k) => rowsZ.filter((rw) => rw.zone === zn).reduce((t, rw) => t + rw.vals[k], 0));
        let best = 0; hv.forEach((v2, k) => { if (v2 > hv[best]) best = k; });
        const flat = (Math.max(...hv) - Math.min(...hv)) < 0.01 * Math.max(...hv);
        zv[z] = { hv, best, peak: hv[best], flat };
        sh.set([cr, 0], { v: zn, st: ST.labB });
        HC.forEach((c, k) => sh.set(c + cr, { f: `SUMIF($A$${L0}:$A$${L1},$A${cr},${c}$${L0}:${c}$${L1})`, v: hv[k], st: CA('#,##0') }));
        sh.set([cr, 1], { f: `MAX(E${cr}:H${cr})`, v: hv[best], st: CA('#,##0', true) });
        sh.set([cr, 3], { f: `MATCH(B${cr},E${cr}:H${cr},0)`, v: best + 1, st: HP('0') });
        sh.set([cr, 2], { f: `IF(MAX(E${cr}:H${cr})-MIN(E${cr}:H${cr})<0.01*MAX(E${cr}:H${cr}),"差なし",INDEX($E$10:$H$10,D${cr}))`, v: flat ? '差なし' : x.HOURS[best] + '時', st: CA(null) });
        cr++;
      });
      cr++;
      head(sh, cr, 0, ['系統', '必要な冷房能力 ' + u.U + '（余裕込み）', '今の空調機 ' + u.U + '（低下・補正込み）', '過不足 ' + u.U, '判定', '更新用の必要能力 ' + u.U + '（補正を戻す）', '', '', '']); sh.height(cr, 44); cr++;
      const nRow = {};
      zs.forEach((z) => {
        const zn = ZN(z); nRow[z] = cr;
        const need = zv[z].peak * (1 + S.margin / 100) / u.DISP;
        const cap = S.ac.filter((a) => ZN(a.zone) === zn).reduce((t, a) => t + u.capIn(+a.cap || 0) * (a.deg != null ? a.deg : 1), 0) * cf;
        const diff = cap - need, jd = diff >= 0 ? '足りる' : diff >= -0.05 * need ? 'ぎりぎり' : '不足';
        zv[z].need = need; zv[z].cap = cap; zv[z].diff = diff; zv[z].jd = jd; zv[z].kneed = need / cf;
        sh.set([cr, 0], { v: zn, st: ST.labB });
        sh.set([cr, 1], { f: `B${zRow[z]}*(1+余裕/100)/単位換算`, v: need, st: CA(u.fCap, true) });
        sh.set([cr, 2], { f: `SUMIF(${ACr('D')},$A${cr},${ACr('G')})*$B$8`, v: cap, st: CA(u.fCap, true) });
        sh.set([cr, 3], { f: `C${cr}-B${cr}`, v: diff, st: CA(u.fDiff, true) });
        sh.set([cr, 4], { f: `IF(D${cr}>=0,"足りる",IF(D${cr}>=-0.05*B${cr},"ぎりぎり","不足"))`, v: jd, st: CA(null, true) });
        sh.set([cr, 5], { f: `B${cr}/$B$8`, v: need / cf, st: CA(u.fCap) });
        cr++;
      });
      addJudgeCf(sh, `E${nRow[zs[0]]}:E${cr - 1}`, `$E${nRow[zs[0]]}`, D);
      // 外調機
      const oacLoad = S.oac.on ? (S.oac.flow * (0.336 * u.u * (C.t - S.oac.ts) + 0.834 * u.u * Math.max(0, xoc - S.oac.xs))) / u.DISP : 0;
      const oacCap = u.capIn(S.oac.cap) * cf;
      const oRow = cr;
      sh.set([cr, 0], { v: '外調機 ' + S.oac.id, st: ST.labB });
      sh.set([cr, 1], { f: `IF(${O.oacOn}="○",${O.oacFlow}*(顕熱係数*($B$3-${O.oacTs})+潜熱係数*MAX(0,$B$5-${O.oacXs})),0)/単位換算`, v: oacLoad, st: CA(u.fCap, true) });
      sh.set([cr, 2], { f: `${O.oacCap}*$B$8`, v: oacCap, st: CA(u.fCap, true) });
      sh.set([cr, 3], { f: `C${cr}-B${cr}`, v: oacCap - oacLoad, st: CA(u.fDiff, true) });
      sh.set([cr, 4], { f: `IF(${O.oacOn}<>"○","なし",IF(D${cr}>=0,"足りる","不足"))`, v: S.oac.on ? (oacCap - oacLoad >= 0 ? '足りる' : '不足') : 'なし', st: CA(null, true) });
      sh.set([cr, 8], { v: '外調機：外気を吹き出しの温度・湿度まで冷やすのに必要な能力', st: ST.note });
      addJudgeCf(sh, `E${cr}`, `$E${cr}`, D);
      cr += 2;
      // ピーク時刻の内訳
      head(sh, cr, 0, ['負荷の内訳（ピーク時刻）' + u.U].concat(zs.map((z) => ZN(z).replace('系統', ''))), null); sh.height(cr, 30); cr++;
      const pRow = {};
      parts.forEach((pn) => {
        pRow[pn] = cr; sh.set([cr, 0], { v: pn, st: ST.lab });
        zs.forEach((z, j) => {
          const v = rowsZ.filter((rw) => rw.zone === ZN(z) && rw.part === pn).reduce((t, rw) => t + rw.vals[zv[z].best], 0) / u.DISP;
          sh.set([cr, 1 + j], { f: `SUMIFS(INDEX($E$${L0}:$H$${L1},0,$D$${zRow[z]}),$A$${L0}:$A$${L1},"${ZN(z)}",$C$${L0}:$C$${L1},$A${cr})/単位換算`, v, st: CA(u.fCap) });
        });
        cr++;
      });
      sh.set([cr, 0], { v: '合計', st: ST.labB }); zs.forEach((z, j) => sh.set([cr, 1 + j], { f: `SUM(${L(1 + j)}${pRow[parts[0]]}:${L(1 + j)}${cr - 1})`, v: zv[z].peak / u.DISP, st: CA(u.fCap, true) }));
      caseOut.push({ sheet: CS[ci], zv, nRow, zRow, oRow, pRow, cf });
    });

    // ================= 結果 =================
    const CH = (sheetCell) => `CHOOSE(条件番号,${CS.map((n) => RF(n, sheetCell)).join(',')})`;
    const bo = caseOut[S.basis];
    sres.set('A1', { v: '結果（系統ごと）', st: ST.title });
    sres.set('A2', { f: `"機器を選ぶ基準の条件："&${RF(SH.in, 'B10')}`, v: '機器を選ぶ基準の条件：' + S.cases[S.basis].n, st: ST.sub });
    let rr = 4; band(sres, rr, 0, 13, '1. 3つの条件の比較（必要な冷房能力 / 今の空調機 / 過不足 ' + u.U + '）'); rr++;
    head(sres, rr, 0, ['系統'].concat(...S.cases.map((c) => ['必要（' + c.n + '）', '今（' + c.n + '）', '過不足（' + c.n + '）', '判定（' + c.n + '）']))); sres.height(rr, 44); rr++;
    const cmp0 = rr;
    zs.concat(['__oac']).forEach((z) => {
      const isO = z === '__oac'; sres.set([rr, 0], { v: isO ? '外調機 ' + S.oac.id : ZN(z), st: ST.labB });
      caseOut.forEach((co, i) => {
        const row = isO ? co.oRow : co.nRow[z], zvv = isO ? null : co.zv[z];
        const sh = scs[i]; const g = (col) => sh.get(col + row).v;
        sres.set([rr, 1 + i * 4], { f: RF(co.sheet, 'B' + row), v: g('B'), st: CA(u.fCap) });
        sres.set([rr, 2 + i * 4], { f: RF(co.sheet, 'C' + row), v: g('C'), st: CA(u.fCap) });
        sres.set([rr, 3 + i * 4], { f: RF(co.sheet, 'D' + row), v: g('D'), st: CA(u.fDiff, true) });
        sres.set([rr, 4 + i * 4], { f: RF(co.sheet, 'E' + row), v: g('E'), st: CA(null, true) });
      });
      rr++;
    });
    [4, 8, 12].forEach((c) => addJudgeCf(sres, `${L(c)}${cmp0}:${L(c)}${rr - 1}`, `$${L(c)}${cmp0}`, D));
    rr++;
    band(sres, rr, 0, 13, '2. 機器を選ぶ基準の条件での結果と更新の検討'); rr++;
    head(sres, rr, 0, ['系統', '床面積 ㎡', '必要 ' + u.U, '必要 馬力', '今 ' + u.U, '今 馬力', '過不足 ' + u.U, '判定', 'ピーク時刻', '更新用の必要能力 ' + u.U, '更新する時の合計 馬力', '更新の検討', '', '']); sres.merge('L' + rr + ':N' + rr); sres.height(rr, 44); rr++;
    const b0 = rr; const resRow = {};
    zs.forEach((z) => {
      const zn = ZN(z), co = bo, row = co.nRow[z], zr = co.zv[z]; resRow[z] = rr;
      const areaV = calcRooms.filter((r2) => r2.zone === z).reduce((t, r2) => t + (+r2.area || 0), 0);
      const hasAc = S.ac.some((a) => ZN(a.zone) === zn);
      sres.set([rr, 0], { v: zn, st: ST.labB });
      sres.set([rr, 1], { f: `SUMIF(${RMr('B')},A${rr},${RMr('C')})`, v: areaV, st: CA('#,##0.0') });
      sres.set([rr, 2], { f: CH('B' + row), v: zr.need, st: CA(u.fCap, true) });
      sres.set([rr, 3], { f: `ROUND(C${rr}/馬力換算*2,0)/2`, v: r05(zr.need / u.HPU), st: CA(u.fHp) });
      sres.set([rr, 4], { f: CH('C' + row), v: zr.cap, st: CA(u.fCap, true) });
      sres.set([rr, 5], { f: `ROUND(E${rr}/馬力換算*2,0)/2`, v: r05(zr.cap / u.HPU), st: CA(u.fHp) });
      sres.set([rr, 6], { f: CH('D' + row), v: zr.diff, st: CA(u.fDiff, true) });
      sres.set([rr, 7], { f: CH('E' + row), v: zr.jd, st: CA(null, true) });
      sres.set([rr, 8], { f: `CHOOSE(条件番号,${caseOut.map((co2) => RF(co2.sheet, 'C' + co2.zRow[z])).join(',')})`, v: zr.flat ? '差なし' : x.HOURS[zr.best] + '時', st: CA(null) });
      sres.set([rr, 9], { f: CH('F' + row), v: zr.kneed, st: CA(u.fCap) });
      rr++;
      zr._hasAc = hasAc;
    });
    addJudgeCf(sres, `H${b0}:H${rr - 1}`, `$H${b0}`, D);
    rr++;
    band(sres, rr, 0, 13, '3. 負荷の内訳（機器を選ぶ基準の条件・ピーク時刻）' + u.U); rr++;
    head(sres, rr, 0, ['負荷の種類'].concat(zs.map((z) => ZN(z).replace('系統', '')))); rr++;
    parts.forEach((pn) => {
      sres.set([rr, 0], { v: pn, st: ST.lab });
      zs.forEach((z, j) => { const cell = L(1 + j) + bo.pRow[pn]; sres.set([rr, 1 + j], { f: CH(cell), v: scs[S.basis].get(cell).v, st: CA(u.fCap) }); });
      rr++;
    });
    rr++;
    noteRow(sres, rr, 0, 13, '必要な冷房能力 ＝ ピーク時刻の負荷 ×（1＋余裕）。今の空調機 ＝ 機器・換気シートの定格×低下 を系統ごとに足し、外気温の補正を掛けたもの。更新の検討の内訳は「更新の選定」シート（同じ形・同じメーカー〈不明はダイキン〉・床置きにはしない）。最終の機器選定はメーカーの能力表で確認のこと。'); sres.height(rr, 44);

    // ================= 更新の選定 =================
    sp.set('A1', { v: '更新の選定（シアター以外：今と同じ形・同じメーカー。床置きにはしない）', st: ST.title });
    sp.set('A2', { v: '系統の必要な能力を、今の空調機の能力の割合で1台ずつに分け、その形の段階（基準値シート）から選びます。足りない時は同じ形を2台以上にします。', st: ST.sub });
    head(sp, 4, 0, ['記号', '系統', '今の形', '更新する形', 'メーカー', '今の能力 ' + u.U, '系統の更新用の必要能力 ' + u.U, '系統の今の能力の合計 ' + u.U, 'この機器の分 ' + u.U, '段階の最大 ' + u.U, '台数', '選ぶ能力 ' + u.U, '型番', '馬力（1台）', '馬力（合計）', '提案']); sp.height(4, 44);
    const p0 = 5;
    const hpByZone = {};
    for (let i = 0; i < nA; i++) {
      const rw = p0 + i, ar = a0 + i, a = S.ac[i];
      const zn = a ? ZN(a.zone) : '', zKey = a ? a.zone : null;
      const kind = a ? a.kind : '', form = a ? (x.REPL_FORM[a.kind] || a.kind) : '', formStep = x.FORM_STEPS[form] ? form : '天井カセット';
      const maker = a ? (a.maker || 'ダイキン') : '';
      const cap = a ? u.capIn(+a.cap || 0) : '';
      const zr = zKey && zs.indexOf(zKey) >= 0 ? bo.zv[zKey] : null;
      const kneed = zr ? zr.kneed : 0;
      const sum = a ? S.ac.filter((y) => ZN(y.zone) === zn).reduce((t, y) => t + u.capIn(+y.cap || 0), 0) : 0;
      const want = a && sum ? kneed * cap / sum : 0;
      const steps = stepRows.filter((sr2) => sr2.f === formStep);
      const max = steps.length ? steps[steps.length - 1].cap : 0;
      const qn = want <= max ? 1 : Math.ceil(want / max);
      const pick = steps.find((sr2) => sr2.cap >= want / qn) || steps[steps.length - 1] || {};
      const IDX = (V) => `MATCH(D${rw},段階の形,0)+COUNTIFS(段階の形,D${rw},段階の能力,"<"&${V})`;
      sp.set([rw, 0], { f: `IF(${RF(SH.eq, 'A' + ar)}="","",${RF(SH.eq, 'A' + ar)})`, v: a ? a.id : '', st: CA(null) });
      sp.set([rw, 1], { f: `IF(A${rw}="","",${RF(SH.eq, 'D' + ar)})`, v: zn, st: CA(null) });
      sp.set([rw, 2], { f: `IF(A${rw}="","",${RF(SH.eq, 'C' + ar)})`, v: kind, st: CA(null) });
      sp.set([rw, 3], { f: `IF(A${rw}="","",IF(C${rw}="床置","天井埋込ダクト",IF(COUNTIF(段階の形,C${rw})=0,"天井カセット",C${rw})))`, v: a ? formStep : '', st: CA(null, true) });
      sp.set([rw, 4], { f: `IF(A${rw}="","",IF(${RF(SH.eq, 'B' + ar)}="","ダイキン",${RF(SH.eq, 'B' + ar)}))`, v: maker, st: CA(null) });
      sp.set([rw, 5], { f: `IF(A${rw}="","",${RF(SH.eq, 'E' + ar)})`, v: cap, st: CA(u.fCap) });
      sp.set([rw, 6], { f: `IF(A${rw}="","",IFERROR(INDEX(${RF(SH.res, 'J' + b0)}:${abs('J' + (b0 + zs.length - 1))},MATCH(B${rw},${RF(SH.res, 'A' + b0)}:${abs('A' + (b0 + zs.length - 1))},0)),0))`, v: a ? kneed : '', st: CA(u.fCap) });
      sp.set([rw, 7], { f: `IF(A${rw}="","",SUMIF(${ACr('D')},B${rw},${ACr('E')}))`, v: a ? sum : '', st: CA(u.fCap) });
      sp.set([rw, 8], { f: `IF(A${rw}="","",IF(H${rw}=0,0,G${rw}*F${rw}/H${rw}))`, v: a ? want : '', st: CA(u.fCap) });
      sp.set([rw, 9], { f: `IF(A${rw}="","",INDEX(段階の能力,MATCH(D${rw},段階の形,0)+COUNTIF(段階の形,D${rw})-1))`, v: a ? max : '', st: HP(u.fCap) });
      sp.set([rw, 10], { f: `IF(A${rw}="","",IF(I${rw}<=J${rw},1,ROUNDUP(I${rw}/J${rw},0)))`, v: a ? qn : '', st: CA('0', true) });
      sp.set([rw, 11], { f: `IF(A${rw}="","",INDEX(段階の能力,${IDX(`I${rw}/K${rw}`)}))`, v: a ? pick.cap : '', st: CA(u.fCap, true) });
      sp.set([rw, 12], { f: `IF(A${rw}="","",INDEX(段階の型番,${IDX(`I${rw}/K${rw}`)}))`, v: a ? pick.name : '', st: CA(null, true) });
      sp.set([rw, 13], { f: `IF(A${rw}="","",INDEX(段階の馬力,${IDX(`I${rw}/K${rw}`)}))`, v: a ? pick.hp : '', st: CA('0.0') });
      sp.set([rw, 14], { f: `IF(A${rw}="",0,N${rw}*K${rw})`, v: a ? pick.hp * qn : 0, st: CA('0.0', true) });
      const short = zr ? zr.diff < 0 : false;
      const txt = !a ? '' : !zr ? '（計算しない系統）' : !short ? '（この系統は更新の必要なし）' : `${a.id} → ${maker}${a.maker ? '' : '（既設が不明のため）'} ${formStep}${formStep !== kind ? '（' + kind + 'から変える）' : ''} ${pick.name}${qn > 1 ? ' ×' + qn : ''}`;
      sp.set([rw, 15], { f: `IF(A${rw}="","",IFERROR(IF(INDEX(${RF(SH.res, 'G' + b0)}:${abs('G' + (b0 + zs.length - 1))},MATCH(B${rw},${RF(SH.res, 'A' + b0)}:${abs('A' + (b0 + zs.length - 1))},0))>=0,"（この系統は更新の必要なし）",A${rw}&" → "&E${rw}&IF(${RF(SH.eq, 'B' + ar)}="","（既設が不明のため）","")&" "&D${rw}&IF(D${rw}<>C${rw},"（"&C${rw}&"から変える）","")&" "&M${rw}&IF(K${rw}>1," ×"&K${rw},"")),"（計算しない系統）"))`, v: txt, st: CA(null, false, true) });
      if (a && zr) hpByZone[zKey] = (hpByZone[zKey] || 0) + pick.hp * qn;
    }
    const pRange = (col) => RF(SH.pick, col + p0) + ':' + abs(col + (p0 + nA - 1));
    // 結果の「更新する時の合計 馬力」「更新の検討」
    zs.forEach((z) => {
      const row = resRow[z], zr = bo.zv[z], zn = ZN(z), hasAc = zr._hasAc;
      const hpT = hasAc ? (hpByZone[z] || 0) : r05(zr.kneed / u.HPU);
      sres.set([row, 10], { f: `IF(COUNTIF(${ACr('D')},A${row})=0,ROUND(J${row}/馬力換算*2,0)/2,SUMIF(${pRange('B')},A${row},${pRange('O')}))`, v: hpT, st: CA('0.0', true) });
      const txt = zr.diff >= 0 ? '今の空調機で足ります（更新の必要なし）' : !hasAc ? '既設の空調機が無い系統です（機器・換気シートで空調機の形を入れてください）' : '更新を検討：合計 約 ' + hpT + ' 馬力（内訳は「更新の選定」シート）';
      sres.merge('L' + row + ':N' + row); sres.set([row, 12], { v: '', st: CA(null) }); sres.set([row, 13], { v: '', st: CA(null) });
      sres.set([row, 11], { f: `IF(G${row}>=0,"今の空調機で足ります（更新の必要なし）",IF(COUNTIF(${ACr('D')},A${row})=0,"既設の空調機が無い系統です（機器・換気シートで空調機の形を入れてください）","更新を検討：合計 約 "&K${row}&" 馬力（内訳は「更新の選定」シート）"))`, v: txt, st: CA(null, false, true) });
    });
    guideItems();
    return wb;
  }

  window.HLXL = { build: (x) => x.S.kind === 'theater' ? theater(x) : other(x) };
})();
