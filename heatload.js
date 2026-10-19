"use strict";
/* ============================================================
   空調負荷計算（書類棚の書類「❄ 空調負荷計算」）
   ・最初に「シアター」か「シアター以外」かを選ぶ（書類棚の「新しく作る」で選ぶ）
   ・シアター: 機器表だけ読む（Opus）＋座席数は劇場のホームページから。必要空調能力＝躯体＋人体＋外気（菱熱の算定方法）
   ・シアター以外: 平面図・機器表 → 部屋の名前を読む → 計算したい部屋を選ぶ → その部屋だけ詳しく読む
   ・kW ⇔ kcal/h は、条件・算定方法・結果・計算書のすべてに使う（資料の中で混ざらない）
   ・保存・名前・印刷のボタンは書類棚（shelf.js）の上の帯。ここは中身（window.HL）
   ・図面・機器表のファイルは Supabase Storage（heatload-files）。読み取りは /api/heatload-read
   ============================================================ */
(function () {
  const root = () => document.getElementById('viewHeat');
  const $ = (s, r) => (r || root()).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DB = () => window.CINEMA_DB || {};
  const sbc = () => { try { return (DB().mode && DB().mode() === 'supabase') ? DB().client() : null; } catch (e) { return null; } };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const BUCKET = 'heatload-files';
  const API = '/api/heatload-read';

  let S = null;                 // 開いている計算書の中身（保存される）
  let onChange = () => {};
  let ctx = { name: '', company: '', theater: '', caseName: '' };
  let reading = '', readStart = 0, readTimer = null, uploading = 0;
  const mem = {};               // テストモード（?local=1）で入れたファイル（保存はされない）

  /* ============================================================
     表示の単位（kW ⇔ kcal/h。1 kW = 860 kcal/h）
     ============================================================ */
  const r1 = (v) => Math.round(v * 10) / 10;
  const isK = () => S.unit === 'kcal';
  const kw = (w) => isK() ? Math.round(w / 1000 * 860).toLocaleString() : r1(w / 1000);
  const U = () => isK() ? 'kcal/h' : 'kW';
  const nf = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString(undefined, { maximumFractionDigits: d });
  const sW = (w, suf, d) => isK() ? nf(w * 0.86, d == null ? 2 : d) + ' kcal/h' + (suf || '') : nf(w, d == null ? 1 : d) + ' W' + (suf || '');
  const perSeat = (w) => sW(w, '', isK() ? 2 : 1);
  const per = (x) => isK() ? '・' + x : '/' + x;
  const uK = (w) => isK() ? nf(w * 0.86, 3) + ' kcal/h・㎡・℃' : nf(w, 3) + ' W/(㎡・K)';
  const uA = (w) => isK() ? nf(w * 0.86, 1) + ' kcal/h・㎡' : nf(w, 1) + ' W/㎡';
  const nA = (w) => isK() ? nf(w * 0.86, 0) : String(w);
  const uAu = () => isK() ? 'kcal/h・㎡' : 'W/㎡';
  const uP = () => isK() ? 'kcal/h' : 'W';
  const tD = () => isK() ? '℃' : 'K';
  const uH = (kj) => isK() ? nf(kj / 4.186, 2) + ' kcal/kg' : nf(kj, 1) + ' kJ/kg';
  const capU = () => isK() ? 'kcal/h' : 'kW';
  const capIn = (v) => isK() ? Math.round(v * 860) : v;
  const capOut = (v) => isK() ? v / 860 : v;
  const hpNote = () => isK() ? '1馬力≒2,408 kcal/h（10馬力＝P280）' : '1馬力≒2.8 kW（10馬力＝P280）';
  const coefS = () => isK() ? '0.289' : '0.336', coefL = () => isK() ? '0.717' : '0.834';
  const noteTxt = (c) => String(c.note || '').replace(/\{h([\d.]+)\}/g, (m, v) => uH(+v));
  const uText = (t) => String(t).replace(/\{HP\}/g, () => hpNote()).replace(/\{kw:([^}]+)\}/g, (m, v) => v.replace(/[\d.]+/g, (n) => capIn(+n).toLocaleString()) + ' ' + capU());
  function toast(m) { const o = document.querySelector('.hl-toast'); if (o) o.remove(); const t = document.createElement('div'); t.className = 'hl-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }

  /* ============================================================
     系統（部屋のまとまり）
     ============================================================ */
  const BASE_ZONES = {
    lobby: { n: 'ロビー系統', c: '#2f6fed' }, conc: { n: 'コンセッション系統', c: '#e0791b' }, back: { n: 'コンセバック系統', c: '#8b5cf6' },
    proj: { n: '映写室系統', c: '#db2777' }, office: { n: '事務所系統', c: '#0f9d8a' }, concourse: { n: 'コンコース系統', c: '#65a30d' },
    storage: { n: '倉庫系統', c: '#a16207' }, other: { n: 'その他の系統', c: '#64748b' }
  };
  const FREE_COL = ['#0891b2', '#be123c', '#4d7c0f', '#7c3aed', '#c2410c'];
  let ZONES = {}, ZK = [];
  function buildZones() { ZONES = clone(BASE_ZONES); (S.freeZones || []).forEach((z) => { ZONES[z.k] = { n: z.n, c: z.c }; }); ZK = Object.keys(ZONES); }
  const zoneOf = (k) => ZONES[k] || ZONES.other;
  function guessZone(n) { const m = [[/映写/, 'proj'], [/通路|コンコース|コリドー/, 'concourse'], [/倉庫|在庫/, 'storage'], [/事務|休憩|更衣/, 'office'], [/売店|コンセッション|コンセ$/, 'conc'], [/バック|厨房/, 'back'], [/ロビー|ホワイエ|エントランス/, 'lobby']]; const f = m.find((x) => x[0].test(n)); return f ? f[1] : 'lobby'; }
  function addZone(name) {
    const n = name.trim(); if (!n) return null;
    const ex = ZK.find((k) => ZONES[k].n === n || ZONES[k].n === n + '系統'); if (ex) return ex;
    const k = 'free' + uid(); const c = FREE_COL[(S.freeZones || []).length % FREE_COL.length];
    S.freeZones = (S.freeZones || []).concat([{ k, n: /系統$/.test(n) ? n : n + '系統', c }]); buildZones(); return k;
  }
  const LIGHT_DEF = { lobby: 15, conc: 25, back: 12, proj: 10, office: 10, concourse: 10, storage: 6, other: 10 };
  const PEOPLE_DEF = { lobby: { auto: true, n: 0, kind: 'lobby' }, conc: { auto: false, n: 4, kind: 'staff' }, back: { auto: false, n: 2, kind: 'staff' }, proj: { auto: false, n: 1, kind: 'office' }, office: { auto: false, n: 4, kind: 'office' }, concourse: { auto: false, n: 0, kind: 'lobby' }, storage: { auto: false, n: 0, kind: 'staff' }, other: { auto: false, n: 0, kind: 'office' } };
  function newRoom(name, zone, src) {
    const z = zone || guessZone(name);
    return { id: 'r' + uid(), name, calc: false, read: false, zone: z, area: 0, h: 2.7, src: src || '', chk: '', env: { wall: {}, glass: {}, roof: 0, part: 0 }, sc: 0.6, light: LIGHT_DEF[z] || 10, people: clone(PEOPLE_DEF[z] || PEOPLE_DEF.other) };
  }

  /* ============================================================
     初めの値
     ============================================================ */
  const TH_STD = Object.freeze({ area: 1.5, etd: 21, k: 0.7, person: 85, t: 25, rh: 54 });
  const DEFAULT_CAT = [
    { id: 'sa', maker: '日本キヤリア', name: 'シングルエース', form: '床置き一体型（シアター系統）', notes: '外気処理仕様・加湿器組込・ミックスボックス・中性能フィルター・分割出荷/現地組立・室外機別置（50m以内）。納期 約5か月',
      jobs: '109南町田・TOHO浜北・TOHOくずは・109箕面・シネプレックス幸手・ユナイテッドシネマ新座わかば',
      items: [{ hp: 16, kw: 45, model: 'RDA-SP 4501 系', est: true }, { hp: 20, kw: 56, model: 'RDA-SP 5601 系', est: true }, { hp: 25, kw: 63, model: 'RDA-SP 6301 系', est: true }, { hp: 30, kw: 80, model: 'RDA-SP 8001 系', est: true }],
      src: '馬力の段階（16/20/25/30）は 2026-02-13 のメール（添付「シングルエース16,20,25,30馬力.pdf」）。型式と馬力の対応・能力はメールに無く、型式の数字からの推定' },
    { id: 'dk', maker: 'ダイキン', name: '床置き（屋外設置改装）FVYCDP', form: '床置き・屋外設置', notes: '外気処理モードあり（能力はほぼ無し）。屋外のため加湿器不可。ロングライフフィルター標準。納期 約5か月', jobs: 'MOVIX柏の葉（GHP更新の検討）',
      items: [{ hp: 10, kw: 28, model: 'FVYCDP280C', est: true }, { hp: 16, kw: 45, model: 'FVYCDP450C', est: true }, { hp: 20, kw: 56, model: 'FVYCDP560C', est: true }],
      src: '型式は 2025-09〜10 の MOVIX柏の葉のメール。能力・馬力は型式の数字からの推定' },
    { id: 'ym', maker: 'ヤンマー', name: 'GHP 床置き', form: 'GHP 床置き', notes: 'ガスヒートポンプ', jobs: 'TOHO鳳（シアター5）・シネマサンシャイン平和島・TOHO西宮',
      items: [{ hp: 16, kw: 45, model: 'YNZP450', est: true }, { hp: 20, kw: 56, model: 'YNZP560', est: true }], src: '型式は 2026-02 TOHO鳳・2025-09 平和島のメール。能力・馬力は型式の数字からの推定' },
    { id: 'ai', maker: 'アイシン', name: 'GHP エグゼア（室外）＋床置ダクト形（室内）', form: 'GHP 室外ユニット＋床置ダクト形 室内ユニット', notes: '室内の床置ダクト形はベルトレス（140・224・280・450・560形）。エグゼアⅣ（Hシリーズ・R32）は2026年4月受注・2027年1月出荷の予定', jobs: '',
      items: [{ hp: 16, kw: 45, model: '450形', est: false }, { hp: 20, kw: 56, model: '560形', est: false }, { hp: 25, kw: 71, model: '710形', est: false }, { hp: 30, kw: 85, model: '850形', est: false }],
      src: 'アイシン公式（2026年1月 エグゼアⅣ発売のお知らせ：冷房 {kw:45・56・71・85}＝16・20・25・30馬力。ラインアップ表の 560形＝20馬力・冷房 {kw:56.0}）。Web 検索で確認' },
    { id: 'tr', maker: 'トレイン・ジャパン', name: 'ルーフトップ WSH（循環型ヒートポンプ）', form: 'ルーフトップ（屋上設置・室内外一体）', notes: '12.5〜20トンクラス。50Hz と 60Hz で型式・能力が違います（50Hz：WSH125/155/200、60Hz：WSH150/180/240）。カタログで映画館向けとされ、国内映画館シェア約65%。外気取り入れ（エコノマイザ）付き。オールフレッシュ（外調機）型も同じ型式であり（50Hz {kw:43.7/54.0/76.0}・外気34℃DB/27℃WB 条件）、外気量はファンのインバーター制御（TOHO市川 RTU-10A/10B/11）', jobs: '109箕面・109大阪EC・109湘南・TOHO市川・109川崎（概算見積あり）',
      byHz: { 50: [{ hp: 14, kw: 39.0, model: 'WSH125', est: false }, { hp: 17, kw: 48.0, model: 'WSH155', est: false }, { hp: 24, kw: 68.5, model: 'WSH200', est: false }],
        60: [{ hp: 16, kw: 44.9, model: 'WSH150', est: false }, { hp: 20, kw: 54.6, model: 'WSH180', est: false }, { hp: 28, kw: 77.8, model: 'WSH240', est: false }] },
      src: 'トレイン・ジャパン カタログ（ルーフトップ型エアコン pac.pdf、6ページ「循環型ヒートポンプ 12.5〜20tクラス」）。冷房能力は JIS B 8616（室内 27℃DB/19℃WB・外気 35℃DB）。馬力は冷房能力から換算して四捨五入（{HP}）' }
  ];
  const DEFAULT_EXTRA = {
    door: { on: false, n: '外部（道路）から入る出入口', src: 'outside', zone: 'lobby', vest: true, share: 100, fromDrawing: '' },
    park: { on: false, n: '立体駐車場から直接入れる', src: 'park', zone: 'lobby', vest: false, share: 30, fromDrawing: '' },
    esc: { on: false, n: 'エスカレーター（下の階とつながる）', src: 'mall', zone: 'lobby', count: 2, fromDrawing: '' },
    ev: { on: false, n: 'エレベーターがロビーに直接着く', src: 'mall', zone: 'lobby', count: 2, fromDrawing: '' },
    mall: { on: false, n: 'モールの通路に開いている', src: 'mall', zone: 'lobby', width: 6, fromDrawing: '' }
  };
  function defaultState(o) {
    o = o || {};
    return {
      v: 1, kind: o.kind || '', step: 0, unit: 'kcal', basis: 1,
      cases: [{ n: '標準', t: 34.8, rh: 58, note: '建築設備設計基準（令和3年版）東京：34.8℃・エンタルピー{h87.8} を相対湿度にしたもの' }, { n: '酷暑', t: 36.0, rh: 50, note: '' }, { n: '酷暑（最悪）', t: 38.0, rh: 45, note: '' }],
      indoor: { t: 26, rh: 50 }, margin: 10,
      files: [],
      th: { in: { t: TH_STD.t, rh: TH_STD.rh }, p: { area: TH_STD.area, etd: TH_STD.etd, k: TH_STD.k, person: TH_STD.person }, url: o.url || '', oa: 25, screens: [], ac: [], seatsSrc: '', acRead: false, seatsRead: false },
      phase: 'files', sel: '', rooms: [], ac: [],
      oac: { on: false, id: 'OAC-1', flow: 0, cap: 0, ts: 24, xs: 10.0, to: {}, src: '' },
      exh: { hood: 0, hoodSrc: '', other: 0, otherSrc: '' },
      ab: { sf: 0, sfSrc: '', mix: 0.3, enter: 'lobby' },
      hex: { flow: 0, eff: 0.6, zone: 'office', src: '' },
      seats: { total: 0, turn: 20, stay: 40 }, inflow: 1, extra: clone(DEFAULT_EXTRA), equip: [], freeZones: [],
      cat: clone(DEFAULT_CAT), fam: { theater: 'sa', other: 'dk' }, hz: o.hz || 50, caseName: o.caseName || '', reportDate: ''
    };
  }
  function normalize(d) {
    const base = defaultState({ kind: d && d.kind });
    const s = Object.assign(base, d || {});
    s.th = Object.assign(defaultState().th, s.th || {}); s.th.in = Object.assign({ t: TH_STD.t, rh: TH_STD.rh }, s.th.in || {}); s.th.p = Object.assign({ area: TH_STD.area, etd: TH_STD.etd, k: TH_STD.k, person: TH_STD.person }, s.th.p || {});
    s.extra = Object.assign(clone(DEFAULT_EXTRA), s.extra || {});
    s.oac = Object.assign(defaultState().oac, s.oac || {}); if (!s.oac.to || typeof s.oac.to !== 'object') s.oac.to = {};
    ['exh', 'ab', 'hex', 'seats', 'indoor', 'fam'].forEach((k) => { s[k] = Object.assign(defaultState()[k], s[k] || {}); });
    if (!Array.isArray(s.cat) || !s.cat.length) s.cat = clone(DEFAULT_CAT);
    ['files', 'rooms', 'ac', 'equip', 'freeZones'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
    if (!Array.isArray(s.cases) || s.cases.length !== 3) s.cases = defaultState().cases;
    return s;
  }

  /* ============================================================
     計算（国交省「建築設備設計基準」の最大熱負荷計算の考え方を簡略化）
     ・時刻 9/12/14/16 時で計算し、いちばん大きい時刻をその系統のピークにする
     ・外気: 顕熱 0.336 W/(m³/h・K)、潜熱 0.834 W/(m³/h・g/kg)
     ============================================================ */
  const HOURS = [9, 12, 14, 16];
  const DT = { 9: 3.7, 12: 1.0, 14: 0, 16: 0 };
  const SHGF = { N: [45, 50, 50, 55], E: [480, 60, 45, 40], S: [150, 240, 170, 70], W: [45, 60, 390, 500] };
  const ETD = { N: [3, 4, 5, 6], E: [7, 10, 9, 8], S: [3, 5, 8, 9], W: [3, 4, 7, 11], roof: [8, 16, 22, 24] };
  const K = { wall: 0.7, glass: 3.5, roof: 0.5, part: 2.0 };
  const PEOPLE = { lobby: [65, 70], seated: [60, 40], staff: [80, 140], office: [60, 50] };
  const PEOPLE_N = { lobby: 'ロビーのお客様（立ち）', seated: '着席のお客様', staff: '店員・立ち作業', office: '事務・映写' };
  const CATALOG = [
    { n: 'ポップコーンマシーン（大型）', kw: 5.5, hoodable: true, sh: 0.35, shN: 0.55, lh: 0, lhN: 0.15, re: /ポップコーン.*(大|マシ)/ },
    { n: 'ポップコーンマシーン（中型）', kw: 3.0, hoodable: true, sh: 0.35, shN: 0.55, lh: 0, lhN: 0.15, re: /ポップコーン.*中/ },
    { n: 'ポップコーン保温ケース', kw: 1.0, sh: 0.8, lh: 0, re: /ポップコーン.*(保温|ケース|ウォーマ)/ },
    { n: 'ホットドッグローラー', kw: 1.2, sh: 0.6, lh: 0.1, re: /ホットドッグ|ローラー/ },
    { n: 'フライヤー', kw: 6.0, hoodable: true, sh: 0.3, shN: 0.5, lh: 0, lhN: 0.3, re: /フライヤ/ },
    { n: 'IHコンロ', kw: 3.0, hoodable: true, sh: 0.3, shN: 0.5, lh: 0, lhN: 0.2, re: /IH|コンロ|電磁/ },
    { n: 'コーヒーマシン', kw: 2.0, sh: 0.4, lh: 0.25, re: /コーヒー|エスプレッソ/ },
    { n: 'ドリンクディスペンサー（冷却内蔵）', kw: 1.0, sh: 1.0, lh: 0, re: /ドリンク|ディスペンサ|ビール/ },
    { n: '製氷機（空冷・内蔵）', kw: 1.5, sh: 1.5, lh: 0, re: /製氷/ },
    { n: '冷蔵ショーケース（内蔵）', kw: 1.2, sh: 1.5, lh: 0, re: /ショーケース/ },
    { n: '冷凍・冷蔵庫（内蔵）', kw: 0.6, sh: 1.5, lh: 0, re: /冷凍|冷蔵/ },
    { n: 'ナチョスチーズウォーマー', kw: 0.4, sh: 0.8, lh: 0, re: /チーズ|ナチョ/ },
    { n: 'レジ・モニター・サイネージ', kw: 0.4, sh: 1.0, lh: 0, re: /レジ|モニタ|サイネージ|POS/ },
    { n: 'プロジェクター（レーザー）', kw: 3.0, sh: 1.0, lh: 0, re: /プロジェクタ|映写機/ },
    { n: 'シネマサーバー・音響ラック', kw: 1.5, sh: 1.0, lh: 0, re: /サーバ|ラック|アンプ/ }
  ];
  const cat = (n) => CATALOG.find((c) => c.n === n) || { sh: 1, lh: 0 };
  const catGuess = (n) => (CATALOG.find((c) => c.re && c.re.test(n)) || {}).n || '';
  const xOf = (t, rh) => { const ps = 6.1078 * Math.pow(10, 7.5 * t / (t + 237.3)); const p = ps * rh / 100; return 622 * p / (1013.25 - p); };
  const hOf = (t, x) => 1.006 * t + x * (2501 + 1.86 * t) / 1000;
  const xIn = () => xOf(S.indoor.t, S.indoor.rh);
  const xTh = () => xOf(S.th.in.t, S.th.in.rh);
  const area = (r) => +r.area || 0;
  const lobbyPeople = () => Math.round(S.seats.total * S.seats.turn / 100 * S.seats.stay / 100);
  const capFactorT = (t) => t <= 35 ? 1 : Math.max(0.8, 1 - 0.015 * (t - 35));
  const DEG = [[1, '低下なし（100%）'], [0.95, '少し低下（95%）'], [0.9, '低下（90%）'], [0.85, 'かなり低下（85%）'], [0.8, '大きく低下・不調あり（80%）']];
  const degOf = (a) => a.deg != null ? a.deg : 1;
  const PASS_VOL = { on: 1.2, off: 3.0 };
  const extraPeople = () => Math.round(S.seats.total * S.seats.turn / 100 * 2);
  function extraFlow(k) {
    const e = S.extra[k], pp = extraPeople();
    if (k === 'door') { const share = S.extra.park.on ? Math.max(0, 100 - S.extra.park.share) : 100; return Math.round(pp * share / 100 * (e.vest ? PASS_VOL.on : PASS_VOL.off)); }
    if (k === 'park') return Math.round(pp * e.share / 100 * (e.vest ? PASS_VOL.on : PASS_VOL.off));
    if (k === 'esc') return Math.round(e.count * 1.2 * 2.5 * 0.1 * 3600);
    if (k === 'ev') return e.count * 150;
    if (k === 'mall') return Math.round(e.width * 2.5 * 0.05 * 3600);
    return 0;
  }
  function hoodInflow() { const sup = (S.oac.on ? S.oac.flow : 0) + S.ab.sf, exh = S.exh.hood + S.exh.other; return { sup, exh, raw: Math.max(0, exh - sup), over: Math.max(0, sup - exh) }; }
  const zonesOn = () => ZK.filter((z) => S.rooms.some((r) => r.calc && r.zone === z));
  function calc(ci) {
    const C = S.cases[ci], ti = S.indoor.t, xi = xIn(), xo = xOf(C.t, C.rh);
    const out = {}; ZK.forEach((z) => { out[z] = { hours: HOURS.map(() => ({ sh: 0, lh: 0 })), parts: {} }; });
    const add = (z, key, hi, sh, lh) => { const o = out[z]; if (!o) return; o.hours[hi].sh += sh; o.hours[hi].lh += lh; o.parts[key] = o.parts[key] || HOURS.map(() => 0); o.parts[key][hi] += sh + lh; };
    const air = (q, t, x) => [0.336 * q * (t - ti), Math.max(0, 0.834 * q * (x - xi))];
    const on = zonesOn();
    HOURS.forEach((h, hi) => {
      const to = C.t - DT[h];
      S.rooms.forEach((r) => {
        if (!r.calc) return; const z = r.zone, e = r.env || {};
        Object.keys(e.wall || {}).forEach((o) => { if (ETD[o]) add(z, '外壁', hi, (+e.wall[o] || 0) * K.wall * Math.max(0, ETD[o][hi] + (C.t - 34) + (26 - ti)), 0); });
        Object.keys(e.glass || {}).forEach((o) => { if (!SHGF[o]) return; const g = +e.glass[o] || 0; add(z, 'ガラス（温度）', hi, g * K.glass * (to - ti), 0); add(z, '日射', hi, g * SHGF[o][hi] * r.sc, 0); });
        if (e.roof) add(z, '屋根', hi, e.roof * K.roof * (ETD.roof[hi] + (C.t - 34)), 0);
        if (e.part) add(z, '共用部との壁', hi, e.part * K.part * (28 - ti), 0);
        add(z, '照明', hi, area(r) * r.light, 0);
        const n = r.people.auto ? lobbyPeople() : (+r.people.n || 0), pk = PEOPLE[r.people.kind || 'lobby'];
        add(z, '人', hi, n * pk[0], n * pk[1]);
      });
      S.equip.forEach((m) => { if (on.indexOf(m.zone) < 0) return; const c = cat(m.ck), p = (m.real !== '' && m.real != null && !isNaN(+m.real) ? +m.real : +m.kw) * 1000 * m.q * m.use; const hooded = m.hood && c.hoodable; add(m.zone, '機器', hi, p * (hooded ? c.sh : (c.shN != null ? c.shN : c.sh)), p * (hooded ? c.lh : (c.lhN != null ? c.lhN : c.lh))); });
      if (S.oac.on) Object.keys(S.oac.to).forEach((z) => { const q = +S.oac.to[z] || 0; if (!q) return; const s = air(q, S.oac.ts, S.oac.xs); add(z, '外気（外調機）', hi, s[0], Math.min(0, s[1])); });
      if (S.hex.flow > 0) { const a = air(S.hex.flow * (1 - S.hex.eff), to, xo); add(S.hex.zone, '外気（換気）', hi, a[0], a[1]); }
      const hoodIn = hoodInflow();
      if (hoodIn.raw > 0) { const a = air(hoodIn.raw, to, xo); add(S.ab.enter, '給気より排気が多い分（外気）', hi, a[0], a[1]); }
      if (S.ab.sf > 0) { const a = air(S.ab.sf * S.ab.mix, to, xo); add(on.indexOf('conc') >= 0 ? 'conc' : S.ab.enter, '専用給気ファンの外気', hi, a[0], a[1]); }
      Object.keys(S.extra).forEach((k) => { const e = S.extra[k]; if (!e.on) return; const src = e.src === 'outside' ? [to, xo] : e.src === 'park' ? [to + 2, xo] : [28, 11.5]; const a = air(extraFlow(k) * S.inflow, src[0], src[1]); add(e.zone, 'すきま風・出入口', hi, a[0], a[1]); });
    });
    ZK.forEach((z) => {
      const o = out[z]; let best = 0; o.hours.forEach((x, i) => { if (x.sh + x.lh > o.hours[best].sh + o.hours[best].lh) best = i; });
      const tots = o.hours.map((x) => x.sh + x.lh); o.flat = (Math.max(...tots) - Math.min(...tots)) < 0.01 * Math.max(...tots);
      o.peakHour = HOURS[best]; o.sh = o.hours[best].sh; o.lh = o.hours[best].lh; o.total = o.sh + o.lh; o.need = o.total * (1 + S.margin / 100);
      o.partsAt = {}; Object.keys(o.parts).forEach((k) => { o.partsAt[k] = o.parts[k][best]; });
      const units = S.ac.filter((a) => a.zone === z); o.capRated = units.reduce((s, a) => s + (+a.cap || 0), 0) * 1000; o.capEff = units.reduce((s, a) => s + (+a.cap || 0) * degOf(a), 0) * 1000 * capFactorT(C.t); o.diff = o.capEff - o.need;
    });
    const oacLoad = S.oac.on ? (S.oac.flow * (0.336 * (C.t - S.oac.ts) + 0.834 * Math.max(0, xOf(C.t, C.rh) - S.oac.xs))) : 0;
    out.oac = { load: oacLoad, cap: S.oac.cap * 1000 * capFactorT(C.t), hoodIn: hoodInflow() };
    return out;
  }
  // シアター（菱熱の算定方法）: 必要空調能力 ＝ 躯体 ＋ 人体 ＋ 外気（1席あたり × 座席数）。照明は上映中全消灯で 0
  const TP = () => S.th.p;
  function thPer(ci) { const C = S.cases[ci], P = TP(), bodyK = P.area * P.etd * P.k, personK = P.person; const dh = Math.max(0, hOf(C.t, xOf(C.t, C.rh)) - hOf(S.th.in.t, xTh())); const oaK = S.th.oa * 1.2 * dh / 4.186; return { bodyK, personK, oaK, dh, totK: bodyK + personK + oaK }; }
  function thRows(ci) { const C = S.cases[ci], p = thPer(ci); return S.th.screens.filter((s) => s.on).map((s) => { const units = S.th.ac.filter((a) => a.scr === s.id); const need = p.totK / 0.86 * (+s.seats || 0); const cap = units.reduce((x, a) => x + (+a.cap || 0) * degOf(a), 0) * 1000 * capFactorT(C.t); return { s, units, need, cap, diff: cap - need }; }); }
  const thIsStd = () => ['area', 'etd', 'k', 'person'].every((k) => Math.abs(TP()[k] - TH_STD[k]) < 1e-9) && S.th.in.t === TH_STD.t && S.th.in.rh === TH_STD.rh;
  const thStd = (v, s) => Math.abs(v - s) < 1e-9 ? '' : ` <span class="chip warn">標準 ${s}</span>`;
  const scrNo = (id) => { const m = String(id).match(/\d+/); return m ? +m[0] : 999; };
  const sortScreens = () => S.th.screens.sort((a, b) => scrNo(a.id) - scrNo(b.id) || String(a.id).localeCompare(String(b.id)));

  /* ============================================================
     更新する時の機種
     ============================================================ */
  const PAC = [[4.0, '1.5馬力（P40）'], [5.0, '2馬力（P50）'], [5.6, '2.3馬力（P56）'], [6.3, '2.5馬力（P63）'], [8.0, '3馬力（P80）'], [11.2, '4馬力（P112）'], [14.0, '5馬力（P140）'], [16.0, '6馬力（P160）'], [22.4, '8馬力（P224）'], [28.0, '10馬力（P280）']];
  const hp = (k) => Math.round(k / 2.8 * 2) / 2;
  const FORM_STEPS = { '天井カセット': [4.0, 4.5, 5.0, 5.6, 6.3, 8.0, 11.2, 14.0, 16.0], '天吊': [4.0, 4.5, 5.0, 5.6, 6.3, 8.0, 11.2, 14.0, 16.0], '壁掛': [4.0, 4.5, 5.0, 5.6, 6.3, 8.0], '天井埋込ダクト': [4.0, 4.5, 5.0, 5.6, 6.3, 8.0, 11.2, 14.0, 16.0, 22.4, 28.0], 'ビルトイン': [4.0, 4.5, 5.0, 5.6, 6.3, 8.0, 11.2, 14.0, 16.0] };
  const FORMS = Object.keys(FORM_STEPS).concat(['床置', 'その他']);
  const REPL_FORM = { '床置': '天井埋込ダクト', 'その他': '天井カセット' };   // シアター以外は床置きにしない
  const PHP = { 4.0: 1.5, 4.5: 1.8, 5.0: 2, 5.6: 2.3, 6.3: 2.5, 8.0: 3, 11.2: 4, 14.0: 5, 16.0: 6, 22.4: 8, 28.0: 10 };
  const pName = (k) => 'P' + Math.round(k * 10) + '（' + PHP[k] + '馬力）';
  function sameFormPlan(z, needKw) {
    const units = S.ac.filter((a) => a.zone === z); if (!units.length) return { rows: [], hp: hp(needKw), text: '既設の空調機が無い系統です（④ で空調機の形を入れてください）' };
    const sum = units.reduce((s, a) => s + (+a.cap || 0), 0) || units.length; let hpT = 0;
    const rows = units.map((a) => {
      const form = REPL_FORM[a.kind] || a.kind; const steps = FORM_STEPS[form] || FORM_STEPS['天井カセット']; const want = needKw * ((+a.cap || 1) / sum); const max = steps[steps.length - 1];
      let q = 1, size = steps.find((x) => x >= want); if (!size) { q = Math.ceil(want / max); size = steps.find((x) => x >= want / q) || max; }
      const maker = a.maker || 'ダイキン'; hpT += PHP[size] * q; return { a, maker, form, guess: !a.maker, size, q };
    });
    return { rows, hp: hpT, text: rows.map((r) => `${r.a.id} → ${r.maker}${r.guess ? '（既設が不明のため）' : ''} ${r.form}${r.form !== r.a.kind ? '（' + r.a.kind + 'から変える）' : ''} ${pName(r.size)}${r.q > 1 ? ' ×' + r.q : ''}`).join('／') };
  }
  function hzSync() { S.cat.forEach((f) => { if (f.byHz) f.items = f.byHz[S.hz] || f.byHz[50]; }); }
  const famOf = () => S.cat.find((f) => f.id === S.fam[S.kind === 'theater' ? 'theater' : 'other']) || S.cat[0];
  function replCombo(needKw) {
    const f = famOf(), its = (f.items || []).filter((x) => x.kw > 0).slice().sort((a, b) => a.kw - b.kw); if (!its.length || needKw <= 0) return null;
    const big = its[its.length - 1]; let n = Math.floor(needKw / big.kw); const rest = needKw - n * big.kw; let one = rest > 0.05 ? its.find((x) => x.kw >= rest) : null; if (one === big) { n++; one = null; }
    const parts = []; if (n) parts.push({ it: big, q: n }); if (one) parts.push({ it: one, q: 1 });
    return { f, parts, hp: parts.reduce((s, p) => s + p.it.hp * p.q, 0), kw: parts.reduce((s, p) => s + p.it.kw * p.q, 0) };
  }
  function replacePlan(needKw, short) {
    const c = replCombo(needKw); if (!c) { const f = famOf(); return (f.items || []).length ? '' : `${esc(f.maker)} ${esc(f.name)}の能力が未入力`; }
    return (short ? '' : esc(c.f.maker + ' ' + c.f.name) + (c.f.byHz ? '（' + S.hz + 'Hz）' : '') + ' ') + c.parts.map((p) => p.it.hp + '馬力' + (c.f.byHz ? '（' + esc(p.it.model) + '）' : '') + '×' + p.q).join(' ＋ ') + '（' + capIn(c.kw).toLocaleString() + ' ' + capU() + (c.parts.some((p) => p.it.est) ? '・推定' : '') + '）';
  }
  // 住所から電源の周波数（東日本 50Hz・西日本 60Hz）。静岡は富士川の東が 50Hz
  const HZ50 = /北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|山梨/;
  const SHIZ50 = /富士市|沼津|三島|熱海|伊東|御殿場|裾野|伊豆|下田|函南|長泉|清水町|小山町|東伊豆|河津|南伊豆|松崎|西伊豆/;
  function hzOfAddress(a) { a = String(a || ''); if (!a) return 0; if (/静岡/.test(a)) return SHIZ50.test(a) ? 50 : 60; return HZ50.test(a) ? 50 : 60; }

  const PART_COL = { '人': '#2f6fed', '照明': '#facc15', '機器': '#e0791b', '外壁': '#94a3b8', 'ガラス（温度）': '#7dd3fc', '日射': '#f97316', '屋根': '#64748b', '共用部との壁': '#cbd5e1', '外気（外調機）': '#14b8a6', '外気（換気）': '#22c55e', '給気より排気が多い分（外気）': '#dc2626', '専用給気ファンの外気': '#f87171', 'すきま風・出入口': '#a855f7' };
  const judge = (o) => o.diff >= 0 ? ['ok', '足りる'] : o.diff >= -0.05 * o.need ? ['warn', 'ぎりぎり'] : ['ng', '不足'];
  const unitSeg = () => `<span class="seg" role="group" aria-label="単位">${[['kw', 'kW'], ['kcal', 'kcal/h']].map((u) => `<button type="button" class="${S.unit === u[0] ? 'on' : ''}" data-unit="${u[0]}">${u[1]}</button>`).join('')}</span>`;
  const theaterName = () => ctx.theater || '';
  const docTitle = () => ctx.name || '空調負荷計算';

  /* ============================================================
     描画
     ============================================================ */
  const STEPS = ['図面・機器表', '計算する部屋', '条件', '機器・換気', '結果', '計算書'];
  const TH_STEPS = ['機器表・座席数', '条件', '結果', '計算書'];
  // 描き直しの途中で入力欄のフォーカスが外れると change が起き、描き直しが重なるので防ぐ
  // 入力のあとにボタンを押した時、押した瞬間に描き直すとボタンが消えて押せないので、指を離すまで待つ
  let rendering = false, ptrDown = false, pendingRender = false;
  function render() {
    const el = root(); if (!S || !el || el.classList.contains('hidden')) return;
    if (ptrDown) { pendingRender = true; return; }
    if (rendering) return; rendering = true;
    try { const a = document.activeElement; if (a && a !== document.body && el.contains(a) && a.blur) a.blur(); } catch (e) {}
    try { renderInner(); } finally { rendering = false; }
  }
  function changed() { onChange(); render(); }
  function readingBox() {
    if (!reading) return '';
    const sec = Math.round((Date.now() - readStart) / 1000);
    return `<span class="reading" role="status">🤖 ${esc(reading)}… ${sec} 秒 <span class="hint">（図面が多いと数分かかります。この画面のままお待ちください）</span></span>`;
  }
  function renderInner() {
    const steps = S.kind === 'theater' ? TH_STEPS : STEPS;
    if (S.kind && S.step >= steps.length) S.step = 0;
    const nav = S.kind ? `<nav class="steps" aria-label="手順"><button type="button" data-act="toEntry" title="シアターかそれ以外かを選び直す">${S.kind === 'theater' ? '🎬 シアター' : '🏢 シアター以外'} ▾</button>` +
      steps.map((s, i) => `<button type="button" data-step="${i}" class="${S.step === i ? 'on' : i < S.step ? 'done' : ''}"><span class="n">${i < S.step ? '✓' : i + 1}</span>${s}</button>`).join('') +
      `<span class="stepunit"><span class="hint">単位</span>${unitSeg()}</span></nav>` : '';
    const body = !S.kind ? stEntry() : S.kind === 'theater' ? [thInput, thCond, thResult, thReport][S.step]() : [stFiles, stZones, stCond, stEquip, stResult, stReport][S.step]();
    root().innerHTML = nav + `<div class="hl-read">${readingBox()}</div><div class="stage">${body}</div>`;
  }
  function stEntry() {
    return `<div class="entry"><h3>何を計算しますか？</h3><p class="hint">シアターは座席数で、それ以外は図面の部屋で計算します（あとから選び直せます。入れた内容は消えません）。</p>
    <div class="ecards">
     <button type="button" class="ecard" data-kind="theater"><span class="ei">🎬</span><b>シアター</b><span>スクリーン（シネマ・オーディトリアム）</span>
       <ul><li>読み込むのは<b>機器表だけ</b></li><li>座席数は<b>劇場のホームページから</b>読む</li><li>躯体＋人体＋外気＝必要空調能力（菱熱の算定方法）</li></ul></button>
     <button type="button" class="ecard" data-kind="other"><span class="ei">🏢</span><b>シアター以外</b><span>ロビー・コンセッション・コンセバック・映写室・事務所・コンコース・倉庫 など</span>
       <ul><li>平面図・機器表を読む</li><li>計算したい部屋を選ぶ</li><li>外壁・ガラス・人・照明・機器・外気・すきま風</li></ul></button>
    </div></div>`;
  }
  // 入れたファイルの一覧（role: th=シアターの機器表 / plan=シアター以外の図面・機器表）
  const fmtSize = (b) => b > 1048576 ? r1(b / 1048576) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  function filesCard(role, label) {
    const fs = S.files.filter((f) => f.role === role);
    return `<div class="files">${fs.map((f) => `<div class="file"><span class="ic">${/pdf/.test(f.mediaType) ? 'PDF' : 'IMG'}</span><div><b>${esc(f.name)}</b><div class="hint">${fmtSize(f.size || 0)}${f.path && f.path.indexOf('mem:') === 0 && !mem[f.id] ? '・テストモードで入れたため中身はありません' : ''}</div></div><span class="fbtns"><button type="button" class="btn sm" data-fopen="${esc(f.id)}">開く</button><button type="button" class="btn sm" data-fdel="${esc(f.id)}">外す</button></span></div>`).join('')}</div>
      <label class="drop" data-drop="${role}"><input type="file" data-fadd="${role}" multiple accept="application/pdf,image/jpeg,image/png,image/webp" hidden>
        📄 ${label}<br><span class="hint">ここにドラッグ、または押して選ぶ（PDF・写真。CAD の DWG は PDF にしてから）</span>${uploading ? `<br><b>入れています… 残り ${uploading} 件</b>` : ''}</label>`;
  }

  /* ---------------- シアター ---------------- */
  function scrOptions(cur) { const ids = S.th.screens.map((s) => s.id); if (cur && ids.indexOf(cur) < 0) ids.push(cur); return `<option value="">（未設定）</option>` + ids.map((id) => `<option${id === cur ? ' selected' : ''}>${esc(id)}</option>`).join(''); }
  function thInput() {
    const th = S.th, hasF = S.files.some((f) => f.role === 'th');
    return `<div class="cols"><div class="card"><h3>① 機器表を入れる <span class="hint">シアターは機器表だけで計算できます（平面図はいりません）</span></h3>
      ${filesCard('th', '空調機器表の PDF・写真')}
      <div class="row"><button type="button" class="btn ${th.acRead ? '' : 'pri'}" data-act="thReadAc" ${hasF && !reading ? '' : 'disabled'}>🤖 Opus 5.5 で機器表を読む</button><span class="hint">空調機の記号・冷房能力・どのスクリーン用か</span></div>
      <h4>空調機 ${th.acRead ? '<span class="chip ai">機器表から</span>' : ''} <span class="hint">スクリーンが機器表に無い時は、ここで選んでください</span></h4>
      <div class="tbl"><table><thead><tr><th>記号</th><th>スクリーン</th><th class="r">冷房能力 ${capU()}</th><th>能力の低下</th><th>読み取り元</th><th></th></tr></thead><tbody>
        ${th.ac.map((a, i) => `<tr class="${a.chk ? 'chk' : ''}"><td><input data-thac="${i}.id" value="${esc(a.id)}" style="width:90px"></td><td><select data-thac="${i}.scr">${scrOptions(a.scr)}</select></td><td><input type="number" step="${isK() ? 100 : 0.1}" data-thac="${i}.cap" value="${capIn(+a.cap || 0)}"></td><td><select data-thac="${i}.deg">${DEG.map((d) => `<option value="${d[0]}"${degOf(a) === d[0] ? ' selected' : ''}>${d[1]}</option>`).join('')}</select></td><td class="src">${esc(a.src || '')}${a.chk ? '<br>⚠ ' + esc(a.chk) : ''}</td><td><button type="button" class="btn sm" data-thacdel="${i}">外す</button></td></tr>`).join('') || `<tr><td colspan="6" class="hint">まだありません。機器表を読むか、「＋ 空調機を足す」で入れてください。</td></tr>`}</tbody></table></div>
      <div class="row"><button type="button" class="btn sm" data-act="thAcAdd">＋ 空調機を足す</button></div>
    </div>
    <div class="card"><h3>座席数 <span class="hint">劇場のホームページから読みます</span></h3>
      <div class="f"><label for="hlThUrl">劇場のホームページ <span class="u">劇場情報に残り、次からは自動で入ります</span></label><input id="hlThUrl" data-thurl="1" value="${esc(th.url)}" placeholder="https://..."></div>
      <div class="row"><button type="button" class="btn ${th.seatsRead ? '' : 'pri'}" data-act="thReadSeats" ${th.url && !reading ? '' : 'disabled'}>🌐 ホームページから座席数を読む</button></div>
      ${th.seatsSrc ? `<p class="hint">読んだページ：${esc(th.seatsSrc)}</p>` : ''}
      <p class="hint">計算するスクリーンに ☑。読めなかった時・違っていた時は数字を直せます。</p>
      <div class="tbl"><table><thead><tr><th></th><th>スクリーン</th><th class="r">座席数</th><th class="r">空調機</th><th></th></tr></thead><tbody>
        ${th.screens.map((s, i) => `<tr><td><input type="checkbox" data-ths="${i}.on" ${s.on ? 'checked' : ''} aria-label="${esc(s.id)}を計算する"></td><td><input data-ths="${i}.id" value="${esc(s.id)}" style="width:90px" aria-label="スクリーンの名前"></td><td><input type="number" data-ths="${i}.seats" value="${+s.seats || 0}" style="width:90px"></td><td class="r src">${th.ac.filter((a) => a.scr === s.id).length} 台</td><td><button type="button" class="btn sm" data-thsdel="${i}">外す</button></td></tr>`).join('') || `<tr><td colspan="5" class="hint">まだありません。ホームページから読むか、「＋ スクリーンを足す」で入れてください。</td></tr>`}</tbody></table></div>
      <div class="row"><button type="button" class="btn sm" data-act="thScrAdd">＋ スクリーンを足す</button></div>
    </div></div>`;
  }
  function caseCards(withBasis) {
    return `<div class="cases">${S.cases.map((c, i) => `<div class="case"><div class="t">${esc(c.n)}${withBasis && i === S.basis ? ' <span class="chip ai">機器を選ぶ基準</span>' : ''}</div>
      <div class="grid2 two"><div class="f"><label for="hlct${i}">外気温 <span class="u">℃</span></label><input id="hlct${i}" type="number" step="0.1" data-case="${i}.t" value="${c.t}"></div><div class="f"><label for="hlcx${i}">相対湿度 <span class="u">%</span></label><input id="hlcx${i}" type="number" step="1" data-case="${i}.rh" value="${c.rh}"></div></div>
      ${c.note ? `<div class="hint">${esc(noteTxt(c))}</div>` : ''}${withBasis ? `<button type="button" class="btn sm" data-basis="${i}">${i === S.basis ? '✓ これで機器を選ぶ' : 'この条件で機器を選ぶ'}</button>` : ''}</div>`).join('')}</div>`;
  }
  function thCond() {
    const p = thPer(S.basis), P = TP();
    return `<div class="cols"><div class="card"><h3>② 条件 <span class="hint">シアターで変えるのは、外気の温度・湿度と、1人あたりの換気量だけです</span></h3>
      ${caseCards(false)}
      <h4>1人あたりの換気量 <span class="hint">興行場法</span></h4>
      <div class="row"><span class="seg">${[25, 20].map((v) => `<button type="button" class="${S.th.oa === v ? 'on' : ''}" data-oa="${v}">${v} m³/h・人</button>`).join('')}</span><input type="number" data-thoa="1" value="${S.th.oa}" class="w72" aria-label="1人あたりの換気量"> m³/h・人</div>
    </div>
    <div class="card"><h3>算定方法の値 <span class="hint">標準の値です。必要な時だけ変えてください</span> ${thIsStd() ? '<span class="chip ok">標準</span>' : '<span class="chip warn">標準から変更あり</span>'}</h3>
      <div class="tbl"><table><tbody>
        <tr><td>室内</td><td><span class="thp"><input type="number" step="0.5" data-thin="t" value="${S.th.in.t}" aria-label="室内の温度"> ℃ ・ <input type="number" step="1" data-thin="rh" value="${S.th.in.rh}" aria-label="室内の相対湿度"> %</span>${thStd(S.th.in.t, TH_STD.t)}${thStd(S.th.in.rh, TH_STD.rh)}</td></tr>
        <tr><td>躯体（屋根・日射を受ける）</td><td><span class="thp"><input type="number" step="0.1" data-thp="area" value="${P.area}" aria-label="1席あたりの空調面積"> ㎡/席 × <input type="number" step="1" data-thp="etd" value="${P.etd}" aria-label="実効温度差"> ℃ × <input type="number" step="0.001" data-thp="k" value="${isK() ? P.k : nf(P.k / 0.86, 3)}" aria-label="熱貫流率"> ${isK() ? 'kcal/h・㎡・℃' : 'W/(㎡・K)'}</span><br><span class="u">＝ ${perSeat(p.bodyK / 0.86)}${per('席')}</span></td></tr>
        <tr><td>人体（静座）</td><td><span class="thp"><input type="number" step="0.1" data-thp="person" value="${isK() ? P.person : nf(P.person / 0.86, 1)}" aria-label="人体発熱"> ${isK() ? 'kcal/h' : 'W'}${per('人')}</span></td></tr>
        <tr><td>外気</td><td class="num">換気量 × 1.2 kg/m³ × 比エンタルピーの差</td></tr>
        <tr><td>照明</td><td>上映中は全消灯のため 0</td></tr></tbody></table></div>
      <div class="row"><button type="button" class="btn sm" data-act="thStd" ${thIsStd() ? 'disabled' : ''}>標準に戻す</button><span class="hint">標準：室内 ${TH_STD.t}℃・${TH_STD.rh}%、躯体 ${TH_STD.area}㎡/席 × ${TH_STD.etd}℃ × ${uK(TH_STD.k / 0.86)}、人体 ${sW(TH_STD.person / 0.86, per('人'), isK() ? 0 : 1)}</span></div>
      <p class="hint">必要空調能力 ＝ 躯体 ＋ 人体 ＋ 外気（余裕は足しません）</p></div></div>`;
  }
  function basisSeg(withRh) { return `<div class="seg">${S.cases.map((c, i) => `<button type="button" class="${S.basis === i ? 'on' : ''}" data-basis="${i}">${esc(c.n)} ${c.t}℃${withRh ? '・' + c.rh + '%' : ''}</button>`).join('')}</div>`; }
  function thResult() {
    const C = S.cases[S.basis], p = thPer(S.basis), rows = thRows(S.basis); const short = rows.filter((x) => x.diff < 0).length;
    const sh = (k) => perSeat(k / 0.86);
    if (!rows.length) return `<div class="card"><h3>③ 結果</h3><p class="hint">計算するスクリーンがありません。① で機器表・座席数を入れてください。</p></div>`;
    const noSeat = rows.filter((x) => !(+x.s.seats > 0)).map((x) => x.s.id), noAc = rows.filter((x) => !x.units.length).map((x) => x.s.id);
    return `<div class="bar2"><b>③ 結果</b><span class="hint">外気の条件:</span>${basisSeg(true)}</div>
     <div class="card"><div class="thsum"><div class="verdict ${short ? 'ng' : 'ok'}"><b>${short ? `${rows.length} スクリーン中 ${short} スクリーンが足りない` : `${rows.length} スクリーンとも足りる`}</b></div>
       <div class="hint">1席あたり <b class="num">${sh(p.totK)}</b> ＝ 躯体 ${sh(p.bodyK)} ＋ 人体 ${sh(p.personK)} ＋ 外気 ${sh(p.oaK)}（換気量 ${S.th.oa} m³/h・人）</div>
       ${noSeat.length ? `<div class="hint warn">⚠ 座席数が入っていないスクリーン：${esc(noSeat.join('・'))}</div>` : ''}${noAc.length ? `<div class="hint warn">⚠ 空調機が決まっていないスクリーン：${esc(noAc.join('・'))}</div>` : ''}</div>
     <div class="tbl mt"><table><thead><tr><th>スクリーン</th><th class="r">座席数</th><th class="r">必要空調能力</th><th class="r">今の空調機</th><th class="r">過不足</th><th>更新</th></tr></thead><tbody>
     ${rows.map((x) => `<tr><td><b>${esc(x.s.id)}</b></td><td class="r num">${+x.s.seats || 0}</td><td class="r num">${kw(x.need)} ${U()}<br><span class="u">約 ${hp(x.need / 1000)} 馬力</span></td><td class="r num">${kw(x.cap)} ${U()}<br><span class="u">約 ${hp(x.cap / 1000)} 馬力（${esc(x.units.map((a) => a.id).join('・') || 'なし')}）</span></td><td class="r"><span class="num vt ${x.diff >= 0 ? 'ok' : 'ng'}">${x.diff >= 0 ? kw(x.diff) + ' ' + U() + ' 余る' : kw(-x.diff) + ' ' + U() + ' 足りない'}</span>${x.diff < 0 ? `<br><span class="u">約 ${hp(-x.diff / 1000)} 馬力</span>` : ''}</td><td>${x.diff < 0 ? `<b>更新を検討</b><br><span class="u">更新する時 ${replacePlan(x.need / 1000 / capFactorT(C.t))}</span>` : '更新の必要なし'}</td></tr>`).join('')}
     </tbody></table></div>
     <p class="hint mt">今の空調機の能力は、選んだ能力の低下と外気温の補正（35℃を超えると1℃につき1.5%）を見込んでいます。馬力は ${hpNote()}。</p></div>${famCard()}`;
  }
  function famCard() {
    const key = S.kind === 'theater' ? 'theater' : 'other', f = famOf();
    return `<div class="card mt"><h3>更新に使う機種 <span class="hint">過去のメール・カタログから作った一覧です。能力は直せます（※は型式の数字からの推定）</span></h3>
     <div class="row"><label for="hlFam" class="hint">更新する時の機種</label><select id="hlFam" data-fam="${key}">${S.cat.map((c) => `<option value="${c.id}"${c.id === f.id ? ' selected' : ''}>${esc(c.maker)} ${esc(c.name)}${(c.items || []).length ? '' : '（能力 未入力）'}</option>`).join('')}</select>${f.byHz ? `<label for="hlHz" class="hint">電源の周波数</label><select id="hlHz" data-hz="1"><option value="50"${S.hz === 50 ? ' selected' : ''}>50Hz（東日本）</option><option value="60"${S.hz === 60 ? ' selected' : ''}>60Hz（西日本）</option></select>` : ''}</div>
     <div class="tbl mt"><table><thead><tr><th>馬力</th><th class="r">冷房能力 ${capU()}</th><th>型式</th><th></th></tr></thead><tbody>
      ${(f.items || []).map((it, i) => `<tr><td><input type="number" data-cati="${i}.hp" value="${it.hp}" class="w80"> 馬力</td><td><input type="number" step="${isK() ? 100 : 0.1}" data-cati="${i}.kw" value="${capIn(it.kw)}">${it.est ? ' <span class="chip warn">※推定</span>' : ''}</td><td><input data-cati="${i}.model" value="${esc(it.model)}"></td><td><button type="button" class="btn sm" data-catdel="${i}">外す</button></td></tr>`).join('') || '<tr><td colspan="4" class="hint">まだ能力が入っていません。「＋ 大きさを足す」で入れてください。</td></tr>'}
     </tbody></table></div>
     <div class="row"><button type="button" class="btn sm" data-act="catAdd">＋ 大きさを足す</button></div>
     <div class="hint mt"><b>形</b>：${esc(f.form)}　<b>特徴</b>：${esc(uText(f.notes || '—'))}<br><b>使った劇場</b>：${esc(f.jobs || '—')}<br><b>出どころ</b>：${esc(uText(f.src))}</div></div>`;
  }

  /* ---------------- 計算書（A4縦）の共通 ---------------- */
  const jpToday = () => { const d = new Date(); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
  const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out.length ? out : [[]]; };
  function coverPage(title, sub) {
    return `<div class="cover"><div class="c1">${esc(title)}</div><div class="c2">${esc(theaterName())}${sub ? '　' + esc(sub) : ''}</div><div class="c3">案件名：${esc(S.caseName || docTitle())}</div><div class="c4">${jpToday()}</div><div class="c5">菱熱工業株式会社</div></div>`;
  }
  const pagesWrap = (pages) => pages.map((h, i) => `<div class="hlpg">${h}<div class="ft">${i + 1}</div></div>`).join('');
  function reportCard(pages) {
    return `<div class="card"><h3>${S.kind === 'theater' ? '④' : '⑥'} 計算書（A4縦）<span class="hint">上の「🖨 印刷 / PDF」で、この形のまま出せます</span></h3>
      <div class="f mt" style="max-width:520px"><label for="hlCase">表紙の案件名 <span class="u">空けておくと書類の名前</span></label><input id="hlCase" data-casename="1" value="${esc(S.caseName)}" placeholder="${esc(docTitle())}"></div>
      <div class="pages">${pagesWrap(pages)}</div></div>`;
  }
  function thPages() {
    const p = thPer(S.basis), rows = thRows(S.basis), C = S.cases[S.basis], P = TP();
    const ids = rows.map((x) => x.s.id); const sub = ids.length ? (ids.length > 1 ? ids[0] + '〜' + ids[ids.length - 1] : ids[0]) : '';
    const pages = [coverPage('空調負荷計算書（シアター）', sub)];
    pages.push(`<h5>1. 設計条件と算定方法</h5><table><tr><th>項目</th><th>値</th></tr>
       <tr><td>外気（${esc(C.n)}）</td><td>${C.t}℃・${C.rh}%</td></tr><tr><td>室内</td><td>${S.th.in.t}℃・${S.th.in.rh}%</td></tr><tr><td>1人あたり換気量</td><td>${S.th.oa} m³/h・人（興行場法）</td></tr></table>
       <h6>算定方法</h6><div>必要空調能力 ＝ 躯体負荷 ＋ 人体負荷 ＋ 外気負荷（1席あたり × 座席数）。照明は上映中全消灯のため負荷なしとする。${thIsStd() ? '' : '（今回は標準の値から変更して計算）'}</div>
       <table class="mt"><tr><th>負荷</th><th>計算</th><th>1席あたり</th></tr>
       <tr><td>躯体</td><td>屋根面は日射を受けるものとし、実効温度差 ${P.etd}℃、熱貫流率 K=${uK(P.k / 0.86)}、1席あたりの空調面積 ${P.area}㎡ → ${P.area}×${P.etd}×${isK() ? P.k : nf(P.k / 0.86, 3)}</td><td>${perSeat(p.bodyK / 0.86)}</td></tr>
       <tr><td>人体</td><td>静座 ${sW(P.person / 0.86, per('人'), isK() ? 0 : 1)}</td><td>${perSeat(p.personK / 0.86)}</td></tr>
       <tr><td>外気</td><td>${S.th.oa} m³/h × 1.2 kg/m³ × ${uH(p.dh)}（外気と室内の比エンタルピーの差）${isK() ? '' : ' ÷ 3.6'}</td><td>${perSeat(p.oaK / 0.86)}</td></tr>
       <tr><th>合計</th><th></th><th>${perSeat(p.totK / 0.86)}</th></tr></table>
       <h6>座席数</h6><div>劇場のホームページ（施設案内）による。${S.th.seatsSrc ? '（' + esc(S.th.seatsSrc) + '）' : ''}</div>
       <h6>既設の空調機</h6><div>機器表による。${esc(S.files.filter((f) => f.role === 'th').map((f) => f.name).join('・'))}</div>`);
    const parts = chunk(rows, 12);
    parts.forEach((part, pi) => {
      pages.push(`<h5>2. スクリーンごとの必要空調能力と既設能力（${U()}）${parts.length > 1 ? '（' + (pi + 1) + '/' + parts.length + '）' : ''}</h5><table><tr><th style="width:11%">スクリーン</th><th style="width:8%">座席</th><th style="width:14%">必要空調能力</th><th style="width:14%">既設能力</th><th style="width:11%">過不足</th><th>更新の検討（更新する時の機種・馬力）</th></tr>
       ${part.map((x) => `<tr><td>${esc(x.s.id)}</td><td class="r">${+x.s.seats || 0}</td><td class="r">${kw(x.need)}<br>約${hp(x.need / 1000)}馬力</td><td class="r">${kw(x.cap)}<br>約${hp(x.cap / 1000)}馬力</td><td class="r">${x.diff >= 0 ? '＋' + kw(x.diff) : '－' + kw(-x.diff)}</td><td>${x.diff < 0 ? '更新を検討：' + replacePlan(x.need / 1000 / capFactorT(C.t), 1) : '更新の必要なし'}</td></tr>`).join('')}</table>
       ${pi === parts.length - 1 ? `<div class="mt">更新する時の機種：${esc(famOf().maker + ' ' + famOf().name)}${famOf().byHz ? '（電源 ' + S.hz + 'Hz）' : ''}。能力は ${esc(uText(famOf().src))}</div>
       <h6>注意</h6><div>既設能力は機器表の冷房能力に、選んだ能力の低下（100〜80%）と外気温の補正（35℃超は1℃につき1.5%低下）を掛けた値。最終の機器選定はメーカーの能力表で確認のこと。馬力は ${hpNote()}。</div>` : ''}`);
    });
    return pages;
  }
  const thReport = () => reportCard(thPages());

  /* ---------------- シアター以外 ---------------- */
  function stFiles() {
    const hasF = S.files.some((f) => f.role === 'plan'), picked = S.rooms.filter((r) => r.calc), unread = picked.filter((r) => !r.read);
    const pickable = S.rooms.filter((r) => r.zone !== 'theater');
    const theaters = S.rooms.filter((r) => r.zone === 'theater');
    let right;
    if (!S.rooms.length) right = `<p class="hint">まだ読み取っていません。左の「部屋の名前を読み取る」を押してください。図面が無い時は、下で部屋の名前を書いて足し、面積などを手で入れても計算できます。</p>${addNameRow()}`;
    else right = `<p class="hint"><b>計算したい部屋だけ ☑</b> を入れて「選んだ部屋を詳しく読む」を押してください。選ばない部屋は読みません（早く・安く済みます）。</p>
      <div class="rlist mt">${pickable.map((r) => `<label class="ritem${r.calc ? ' on' : ' off'}"><input type="checkbox" data-pick="${r.id}" ${r.calc ? 'checked' : ''}><span><b>${esc(r.name)}</b><div class="a">${esc(zoneOf(r.zone).n)}${r.src ? '・' + esc(r.src) : ''}</div></span><span>${r.read ? '<span class="chip ok">読んだ</span>' : ''}</span></label>`).join('')}</div>
      ${theaters.length ? `<p class="hint mt">シアター（${esc(theaters.map((r) => r.name).join('・'))}）は、書類棚で「シアター」の計算書を作って計算します。</p>` : ''}
      ${addNameRow()}
      <div class="row mt"><button type="button" class="btn pri" data-act="readDetail" ${unread.length && hasF && !reading ? '' : 'disabled'}>🤖 ${unread.length ? `選んだ ${unread.length} 部屋を詳しく読む` : '選んだ部屋を詳しく読む'}</button>${unread.length && !hasF ? '<span class="hint">図面を入れると読めます（入れない時は ② で手で入れられます）</span>' : ''}${picked.length && !unread.length ? '<span class="hint">選んだ部屋はすべて読みました。② で確かめてください</span>' : ''}</div>
      ${S.phase === 'read' ? readResult() : ''}`;
    return `<div class="cols"><div class="card"><h3>① 図面・機器表を入れる</h3>
      ${filesCard('plan', '平面図・機器表（空調・換気・厨房）の PDF・写真')}
      <ol class="flow"><li class="${S.rooms.length ? 'done' : 'now'}"><b>部屋の名前を読み取る</b><span>図面の室名だけを先に読みます</span></li><li class="${S.rooms.length && !picked.length ? 'now' : picked.length ? 'done' : ''}"><b>計算したい部屋を選ぶ</b><span>ロビー・売店など、計算したい部屋だけ</span></li><li class="${picked.length && !unread.length ? 'done' : picked.length ? 'now' : ''}"><b>選んだ部屋を詳しく読む</b><span>面積・外壁とガラス・その部屋の空調機・換気・排気フード・厨房機器</span></li></ol>
      <div class="row"><button type="button" class="btn ${S.rooms.length ? '' : 'pri'}" data-act="readNames" ${hasF && !reading ? '' : 'disabled'}>🤖 部屋の名前を読み取る</button><span class="hint">Opus 5.5 が読みます${S.rooms.length ? '（読み直すと、新しく見つかった部屋が足されます）' : ''}</span></div>
    </div>
    <div class="card"><h3>${S.rooms.length ? '計算したい部屋を選ぶ' : '読み取りの結果'} ${S.rooms.length ? '<span class="chip ai">Opus 5.5</span>' : ''}</h3>${right}</div></div>`;
  }
  const addNameRow = () => `<div class="row mt"><input id="hlAddName" placeholder="名前で部屋を足す（例：通路）" class="grow"><button type="button" class="btn sm" data-act="addName">＋ 足す</button></div>`;
  function readResult() {
    const chk = S.rooms.filter((r) => r.calc && r.chk).length + S.ac.filter((a) => a.chk).length + S.equip.filter((e) => e.chk).length;
    const list = S.rooms.filter((r) => r.calc && r.chk).map((r) => ({ id: r.name, chk: r.chk, src: r.src })).concat(S.ac.filter((a) => a.chk), S.equip.filter((e) => e.chk).map((e) => ({ id: e.n, chk: e.chk, src: e.src })));
    return `<h4>読み取った内容</h4><div class="tbl"><table><tbody>
      <tr><td>縮尺</td><td class="r">${esc(S.scale || '—')}</td></tr>
      <tr><td>部屋（面積・外壁・ガラス）</td><td class="r num">${S.rooms.filter((r) => r.calc && r.read).length}</td></tr>
      <tr><td>空調機（パッケージ）</td><td class="r num">${S.ac.length}</td></tr>
      <tr><td>外調機</td><td class="r num">${S.oac.on ? 1 : 0}</td></tr>
      <tr><td>厨房・売店の機器</td><td class="r num">${S.equip.length}</td></tr>
      <tr><td>確かめてほしい所</td><td class="r"><span class="chip ${chk ? 'warn' : 'ok'}">${chk} か所</span></td></tr></tbody></table></div>
      ${list.map((x) => `<div class="hint">⚠ <b>${esc(x.id)}</b>：${esc(x.chk)}${x.src ? '（' + esc(x.src) + '）' : ''}</div>`).join('')}
      <p class="hint mt">図面に無い機器は「④ 機器・換気」で、よくある機器から足せます。</p>`;
  }
  function stZones() {
    const calcR = S.rooms.filter((x) => x.calc);
    if (!calcR.length) return `<div class="card"><h3>② 計算する部屋</h3><p class="hint">まだ部屋を選んでいません。① で部屋を選ぶか、名前で足してください。</p>${addNameRow()}</div>`;
    if (!calcR.some((x) => x.id === S.sel)) S.sel = calcR[0].id;
    const r = S.rooms.find((x) => x.id === S.sel);
    return `<div class="cols"><div class="card"><h3>② ${esc(r.name)} <span class="src">${esc(r.src || '')}</span></h3>${r.chk ? `<p class="hint warn">⚠ ${esc(r.chk)}</p>` : ''}${roomForm(r)}</div>
    <div class="card"><h3>部屋 <span class="hint">計算する ${calcR.length} 部屋</span></h3>
      <div class="rlist">${calcR.map((x) => `<div class="ritem${x.id === S.sel ? ' on' : ''}"><i class="zdot" style="background:${zoneOf(x.zone).c}"></i><button type="button" class="rbtn" data-room="${x.id}"><b>${esc(x.name)}</b><div class="a">${esc(zoneOf(x.zone).n)}</div></button><span class="num">${r1(area(x))} ㎡</span></div>`).join('')}</div>
      ${addNameRow()}
      <h4>図面を見る</h4><div class="hint">${S.files.filter((f) => f.role === 'plan').map((f) => `<button type="button" class="lnk" data-fopen="${esc(f.id)}">📄 ${esc(f.name)}</button>`).join(' ') || '（図面は入っていません）'}</div>
    </div></div>`;
  }
  function roomForm(r) {
    const e = r.env, o = ['N', 'E', 'S', 'W'], on = { N: '北', E: '東', S: '南', W: '西' };
    return `<div class="grid2 two">
     <div class="f"><label for="hlRzone">系統</label><select id="hlRzone" data-rf="zone">${ZK.map((z) => `<option value="${z}"${r.zone === z ? ' selected' : ''}>${esc(ZONES[z].n)}</option>`).join('')}</select>
       <div class="row tight"><input id="hlNewZone" placeholder="ほかの系統を書く" class="grow"><button type="button" class="btn sm" data-act="newZone">＋</button></div></div>
     <div class="f"><label for="hlRname">名前</label><input id="hlRname" data-rf="name" value="${esc(r.name)}"></div>
     <div class="f"><label for="hlRarea">床面積 <span class="u">㎡</span></label><input id="hlRarea" type="number" step="0.1" data-rf="area" value="${+r.area || 0}"></div>
     <div class="f"><label for="hlRlight">照明 <span class="u">${uAu()}</span></label><input id="hlRlight" type="number" step="0.1" data-rf="light" value="${isK() ? nf(r.light * 0.86, 1) : r.light}"></div>
    </div>
    <h4>外壁・ガラス（㎡）${r.read ? '<span class="chip ai">図面から</span>' : ''}</h4>
    <div class="tbl"><table><thead><tr><th></th>${o.map((k) => `<th class="r">${on[k]}</th>`).join('')}</tr></thead><tbody>
    <tr><td>外壁</td>${o.map((k) => `<td><input type="number" data-env="wall.${k}" value="${(e.wall || {})[k] || 0}" aria-label="外壁 ${on[k]}"></td>`).join('')}</tr>
    <tr><td>ガラス</td>${o.map((k) => `<td><input type="number" data-env="glass.${k}" value="${(e.glass || {})[k] || 0}" aria-label="ガラス ${on[k]}"></td>`).join('')}</tr></tbody></table></div>
    <div class="grid2 three mt">
     <div class="f"><label for="hlRroof">屋根（最上階） <span class="u">㎡</span></label><input id="hlRroof" type="number" data-env="roof" value="${e.roof || 0}"></div>
     <div class="f"><label for="hlRpart">共用部との壁 <span class="u">㎡</span></label><input id="hlRpart" type="number" data-env="part" value="${e.part || 0}"></div>
     <div class="f"><label for="hlRsc">ブラインド等</label><select id="hlRsc" data-rf="sc"><option value="0.85"${r.sc == 0.85 ? ' selected' : ''}>なし</option><option value="0.6"${r.sc == 0.6 ? ' selected' : ''}>ブラインド</option><option value="0.45"${r.sc == 0.45 ? ' selected' : ''}>熱線反射ガラス</option></select></div>
    </div>
    <div class="f mt"><label>人数</label><div class="row tight"><select data-rf="pmode"><option value="auto"${r.people.auto ? ' selected' : ''}>座席数から（ロビーのお客様）</option><option value="n"${r.people.auto ? '' : ' selected'}>人数を入れる</option></select>
      ${r.people.auto ? `<span class="num">${lobbyPeople()} 人</span> <span class="hint">（③ 条件の「座席数から」）</span>` : `<input type="number" data-rf="pn" value="${+r.people.n || 0}" class="w80"> 人 <select data-rf="pk">${Object.keys(PEOPLE_N).map((k) => `<option value="${k}"${(r.people.kind || 'office') === k ? ' selected' : ''}>${PEOPLE_N[k]}</option>`).join('')}</select>`}</div></div>
    <div class="row mt"><button type="button" class="btn sm" data-act="uncalc">この部屋を計算から外す</button></div>`;
  }
  function stCond() {
    const hi = hoodInflow(), zs = zonesOn();
    return `<div class="cols"><div class="card"><h3>③ 外の暑さ・部屋の条件</h3>
      ${caseCards(true)}
      <div class="grid2 mt">
        <div class="f"><label for="hlTi">室内の温度 <span class="u">℃</span></label><input id="hlTi" type="number" step="0.5" data-in="t" value="${S.indoor.t}"></div>
        <div class="f"><label for="hlRh">室内の相対湿度 <span class="u">%</span></label><input id="hlRh" type="number" step="1" data-in="rh" value="${S.indoor.rh}"></div>
        <div class="f"><label for="hlMg">余裕 <span class="u">%</span></label><input id="hlMg" type="number" data-mg="1" value="${S.margin}"></div>
      </div>
      <h4>ロビーの人数（座席数から）</h4>
      <div class="grid2"><div class="f"><label for="hlSt">劇場の座席数 <span class="u">席</span></label><input id="hlSt" type="number" data-seat="total" value="${S.seats.total}"></div>
        <div class="f"><label for="hlSr">同時に入れ替わる割合 <span class="u">%</span></label><input id="hlSr" type="number" data-seat="turn" value="${S.seats.turn}"></div>
        <div class="f"><label for="hlSs">そのうちロビーにいる割合 <span class="u">%</span></label><input id="hlSs" type="number" data-seat="stay" value="${S.seats.stay}"></div>
        <div class="f"><label>ロビーの人数</label><div class="num big1">${lobbyPeople()} 人</div></div></div>
      <div class="row mt"><input data-thurl="1" value="${esc(S.th.url)}" placeholder="劇場のホームページ https://..." class="grow" aria-label="劇場のホームページ"><button type="button" class="btn sm" data-act="readTotal" ${S.th.url && !reading ? '' : 'disabled'}>🌐 座席数をホームページから読む</button></div>
      <h4>エアバランス（入れる空気と出す空気） <span class="chip ai">図面から</span></h4>
      <div class="tbl"><table><tbody>
        <tr><td>入れる：外調機 ${esc(S.oac.id)}（冷やした空気）</td><td class="r num">${(S.oac.on ? S.oac.flow : 0).toLocaleString()} m³/h</td><td class="src">${esc(S.oac.src)}</td></tr>
        <tr><td>入れる：専用の給気ファン（外気そのまま）</td><td><input type="number" data-ab="sf" value="${S.ab.sf}" aria-label="専用の給気ファン"></td><td class="src">${esc(S.ab.sfSrc)}</td></tr>
        <tr><td>出す：排気フード</td><td class="r num">${S.exh.hood.toLocaleString()} m³/h</td><td class="src">${esc(S.exh.hoodSrc)}</td></tr>
        <tr><td>出す：そのほかの排気（便所など）</td><td class="r num">${S.exh.other.toLocaleString()} m³/h</td><td class="src">${esc(S.exh.otherSrc)}</td></tr>
        <tr><th>差</th><th class="r num">${hi.raw > 0 ? '出す方が ' + hi.raw.toLocaleString() + ' m³/h 多い' : hi.over > 0 ? '入れる方が ' + hi.over.toLocaleString() + ' m³/h 多い' : 'つり合っている'}</th><th></th></tr>
      </tbody></table></div>
      <p class="hint mt">${hi.raw > 0 ? `出す方が多い <b>${hi.raw.toLocaleString()} m³/h</b> は、外の空気が冷やされないまま入ってきます。入ってくる所：<select data-ab="enter">${zs.map((z) => `<option value="${z}"${S.ab.enter === z ? ' selected' : ''}>${esc(ZONES[z].n)}</option>`).join('')}</select>（ロビーが冷えない劇場の原因になりやすい所です）` : '外の空気がそのまま入ってくる分はありません。'}${S.ab.sf > 0 ? `<br>専用の給気ファンの外気のうち、フードに吸われずに部屋に混ざる割合 <input type="number" step="0.1" data-ab="mix" value="${S.ab.mix}" class="w72">` : ''}<br>外調機・排気の風量は「④ 機器・換気」で直せます。</p>
    </div>
    <div class="card"><h3>図面に出てこない負荷 <span class="hint">あり/なしを切り替え</span></h3>
      <p class="hint">風量は測れないので、<b>見て分かること</b>（数・風除室の有無・開いている幅）と座席数から計算します。</p>
      <div class="row"><b>外気の入り方</b><div class="seg">${[[1.5, '強め'], [1, '標準'], [0.6, '弱め']].map((o) => `<button type="button" class="${S.inflow === o[0] ? 'on' : ''}" data-inflow="${o[0]}">${o[1]}${o[0] !== 1 ? '（×' + o[0] + '）' : ''}</button>`).join('')}</div><span class="hint">「この劇場は入口から熱気がよく入る」なら強め</span></div>
      ${Object.keys(S.extra).map((k) => { const e = S.extra[k]; return `<div class="tog"><button type="button" class="swb" data-extra="${k}" aria-pressed="${e.on}" aria-label="${esc(e.n)}"><span class="sw"></span></button><div><b>${esc(e.n)}</b>${e.fromDrawing ? ` <span class="chip ai">${esc(e.fromDrawing)}</span>` : ''}
        ${e.on ? `<div class="xin">${extraInputs(k)}<label class="d">入る所 <select data-exz="${k}">${(zs.length ? zs : ['lobby']).map((z) => `<option value="${z}"${e.zone === z ? ' selected' : ''}>${esc(zoneOf(z).n)}</option>`).join('')}</select></label></div><div class="d">→ 約 <b class="num">${Math.round(extraFlow(k) * S.inflow).toLocaleString()} m³/h</b> の空気が入る、として計算（${extraWhy(k)}）</div>` : ''}</div></div>`; }).join('')}
    </div></div>`;
  }
  function extraInputs(k) {
    const e = S.extra[k];
    const vest = `<span class="seg sm2">${[[true, '風除室あり'], [false, '風除室なし']].map((o) => `<button type="button" class="${e.vest === o[0] ? 'on' : ''}" data-exv="${k}.${o[0]}">${o[1]}</button>`).join('')}</span>`;
    if (k === 'door') return vest;
    if (k === 'park') return vest + ` <label class="d">お客様のうち駐車場から来る割合 <input type="number" data-exn="${k}.share" value="${e.share}" class="w64"> %</label>`;
    if (k === 'esc' || k === 'ev') return `<label class="d">台数 <input type="number" data-exn="${k}.count" value="${e.count}" class="w64"> 台</label>`;
    if (k === 'mall') return `<label class="d">開いている幅 <input type="number" step="0.5" data-exn="${k}.width" value="${e.width}" class="w64"> m</label>`;
    return '';
  }
  function extraWhy(k) {
    const e = S.extra[k], pp = extraPeople();
    if (k === 'door' || k === 'park') return `ピークの1時間に通る人 ${pp.toLocaleString()} 人${k === 'park' || S.extra.park.on ? 'の' + (k === 'park' ? e.share : Math.max(0, 100 - S.extra.park.share)) + '%' : ''} × 1人 ${e.vest ? PASS_VOL.on : PASS_VOL.off} m³`;
    if (k === 'esc') return `1台 約1,080 m³/h（開口 幅1.2m×高さ2.5m・0.1m/s）× ${e.count}台・下の階の空気 28℃`;
    if (k === 'ev') return `1台 150 m³/h × ${e.count}台`;
    if (k === 'mall') return `幅 ${e.width}m × 高さ2.5m・0.05m/s・通路の空気 28℃`;
    return '';
  }
  const zoneSel = (attr, cur) => { const zs = zonesOn(); const list = zs.indexOf(cur) < 0 ? zs.concat([cur]) : zs; return `<select ${attr}>${list.map((z) => `<option value="${z}"${cur === z ? ' selected' : ''}>${esc(zoneOf(z).n)}${zs.indexOf(z) < 0 ? '（計算しない）' : ''}</option>`).join('')}</select>`; };
  function stEquip() {
    const zs = zonesOn();
    return `<div class="card"><h3>④ 既設の空調機 ${S.ac.length ? '<span class="chip ai">機器表から</span>' : ''} <span class="hint">古くなったり不調があると能力が落ちます。落ちている分を選んでください（目安：使い始めて10年くらいで90%・15年くらいで85%）</span></h3>
      <div class="tbl"><table><thead><tr><th>記号</th><th>メーカー</th><th>形</th><th>系統</th><th class="r">冷房能力 ${capU()}</th><th>能力の低下</th><th class="r">見込む能力</th><th>読み取り元</th><th></th></tr></thead><tbody>
      ${S.ac.map((a, i) => `<tr class="${a.chk ? 'chk' : ''}"><td><input data-ac="${i}.id" value="${esc(a.id)}" class="w80"></td><td><input list="hlMakerList" data-acm="${i}" value="${esc(a.maker || '')}" placeholder="不明" class="w110"></td><td><select data-ack="${i}">${FORMS.map((k) => `<option${a.kind === k ? ' selected' : ''}>${k}</option>`).join('')}</select></td><td>${zoneSel(`data-ac="${i}.zone"`, a.zone)}</td><td><input type="number" step="${isK() ? 100 : 0.1}" data-ac="${i}.cap" value="${capIn(+a.cap || 0)}"></td><td><select data-acdeg="${i}" aria-label="能力の低下">${DEG.map((d) => `<option value="${d[0]}"${degOf(a) === d[0] ? ' selected' : ''}>${d[1]}</option>`).join('')}</select></td><td class="r num">${kw((+a.cap || 0) * degOf(a) * 1000)} ${U()}</td><td class="src">${esc(a.src || '')}${a.chk ? `<br>⚠ ${esc(a.chk)}` : ''}</td><td><button type="button" class="btn sm" data-acdel="${i}">外す</button></td></tr>`).join('') || `<tr><td colspan="9" class="hint">まだありません。</td></tr>`}</tbody></table></div>
      <datalist id="hlMakerList"><option value="ダイキン"></option><option value="三菱電機"></option><option value="日立"></option><option value="東芝キヤリア"></option><option value="パナソニック"></option><option value="三菱重工"></option></datalist>
      <div class="row"><button type="button" class="btn sm" data-act="acAdd" ${zs.length ? '' : 'disabled'}>＋ 空調機を足す</button></div>
    </div>
    <div class="cols mt"><div class="card"><h3>厨房・売店の機器 <span class="hint">機器表に無ければ下の一覧から。現地で測った値があれば「実測」に入れると、そちらを使います</span></h3>
      <div class="tbl"><table><thead><tr><th>機器</th><th>系統</th><th class="r">消費電力 ${capU()}</th><th class="r">台数</th><th>フードの下</th><th class="r">稼働率</th><th class="r">実測 ${capU()}</th><th>読み取り元</th><th></th></tr></thead><tbody>
      ${S.equip.map((m, i) => `<tr class="${m.chk ? 'chk' : ''}"><td><b>${esc(m.n)}</b>${m.ck && m.ck !== m.n ? `<div class="src">発熱の割合：${esc(m.ck)}</div>` : ''}</td><td>${zoneSel(`data-eq="${i}.zone"`, m.zone)}</td><td><input type="number" step="${isK() ? 10 : 0.1}" data-eq="${i}.kw" value="${capIn(+m.kw || 0)}"></td><td><input type="number" data-eq="${i}.q" value="${m.q}"></td><td>${cat(m.ck).hoodable ? `<input type="checkbox" data-eqh="${i}" ${m.hood ? 'checked' : ''} aria-label="フードの下">` : '―'}</td><td><input type="number" step="0.1" data-eq="${i}.use" value="${m.use}"></td><td><input type="number" step="${isK() ? 10 : 0.1}" data-eq="${i}.real" value="${m.real === '' || m.real == null ? '' : capIn(+m.real)}" placeholder="―"></td><td class="src">${esc(m.src || '')}${m.chk ? `<br>⚠ ${esc(m.chk)}` : ''}</td><td><button type="button" class="btn sm" data-eqdel="${i}">外す</button></td></tr>`).join('') || `<tr><td colspan="9" class="hint">まだありません。</td></tr>`}</tbody></table></div>
      <div class="row"><select id="hlCatSel">${CATALOG.map((c) => `<option>${esc(c.n)}</option>`).join('')}</select><button type="button" class="btn sm" data-act="addEq" ${zs.length ? '' : 'disabled'}>＋ よくある機器から足す</button></div>
    </div>
    <div class="card"><h3>外調機・換気 ${S.oac.src ? '<span class="chip ai">機器表から</span>' : ''}</h3>
      <div class="tog"><button type="button" class="swb" data-oac="1" aria-pressed="${S.oac.on}" aria-label="外調機あり"><span class="sw"></span></button><b>外調機あり</b></div>
      ${S.oac.on ? `<div class="grid2 two">
        <div class="f"><label>記号</label><input data-oacf="id" value="${esc(S.oac.id)}"></div>
        <div class="f"><label>風量 <span class="u">m³/h</span></label><input type="number" data-oacf="flow" value="${S.oac.flow}"></div>
        <div class="f"><label>冷却能力 <span class="u">${capU()}</span></label><input type="number" step="${isK() ? 100 : 0.1}" data-oacf="cap" value="${capIn(S.oac.cap)}"></div>
        <div class="f"><label>吹き出しの温度 <span class="u">℃</span></label><input type="number" step="0.5" data-oacf="ts" value="${S.oac.ts}"></div>
        ${zs.map((z) => `<div class="f"><label>${esc(zoneOf(z).n)}へ <span class="u">m³/h</span></label><input type="number" data-oacto="${z}" value="${+S.oac.to[z] || 0}"></div>`).join('')}
      </div>` : ''}
      <h4>排気・全熱交換器</h4>
      <div class="grid2 two">
        <div class="f"><label>排気フード <span class="u">m³/h</span></label><input type="number" data-exf="hood" value="${S.exh.hood}"><span class="src">${esc(S.exh.hoodSrc)}</span></div>
        <div class="f"><label>そのほかの排気 <span class="u">m³/h</span></label><input type="number" data-exf="other" value="${S.exh.other}"><span class="src">${esc(S.exh.otherSrc)}</span></div>
        <div class="f"><label>全熱交換器 <span class="u">m³/h</span></label><input type="number" data-hexf="flow" value="${S.hex.flow}"><span class="src">${esc(S.hex.src)}</span></div>
        <div class="f"><label>交換効率</label><input type="number" step="0.05" data-hexf="eff" value="${S.hex.eff}"></div>
        <div class="f"><label>全熱交換器のある系統</label>${zoneSel('data-hexz="1"', S.hex.zone)}</div>
      </div>
    </div></div>`;
  }
  function stResult() {
    const zs = zonesOn();
    if (!zs.length) return `<div class="card"><h3>⑤ 結果</h3><p class="hint">計算する部屋がありません。① で部屋を選んでください。</p></div>`;
    const res = S.cases.map((c, i) => calc(i)); const b = res[S.basis]; const C = S.cases[S.basis];
    const fmt = (o) => o.diff >= 0 ? `${kw(o.diff)} ${U()} 余る` : `${kw(-o.diff)} ${U()} 足りない`;
    const vtxt = (o) => { const j = judge(o); return (j[0] === 'warn' ? 'ぎりぎり ' : '') + fmt(o); };
    const cards = zs.map((z) => {
      const o = b[z], j = judge(o);
      const top = Object.keys(o.partsAt).filter((k) => o.partsAt[k] > 100).sort((x, y) => o.partsAt[y] - o.partsAt[x]).slice(0, 3);
      const units = S.ac.filter((a) => a.zone === z).map((a) => a.id).join('・') || 'なし';
      const pl = sameFormPlan(z, o.need / 1000 / capFactorT(C.t));
      const rec = o.diff < 0 ? `<b>更新を検討</b>：更新する時は合計 約 ${r1(pl.hp)} 馬力<br><span class="u">${esc(pl.text)}</span>` : '今の空調機で足ります（更新の必要なし）';
      return `<div class="zc" style="--zc:${zoneOf(z).c}"><div class="hd"><i class="zdot" style="background:${zoneOf(z).c}"></i><b>${esc(zoneOf(z).n)}</b></div>
        <div class="verdict ${j[0]}"><b class="num">${vtxt(o)}</b></div>
        <div class="pair"><div><span>必要な冷房能力</span><b class="num">${kw(o.need)} ${U()}</b><span>約 ${hp(o.need / 1000)} 馬力</span></div><div><span>今の空調機（${esc(units)}）</span><b class="num">${kw(o.capEff)} ${U()}</b><span>約 ${hp(o.capEff / 1000)} 馬力</span></div></div>
        <div class="why"><span>主な原因</span>${top.map((k) => `<i class="zdot" style="background:${PART_COL[k] || '#999'}"></i>${esc(k)} <b class="num">${kw(o.partsAt[k])} ${U()}</b>`).join('　') || '—'}</div>
        <div class="rec">${rec}</div></div>`;
    }).join('');
    const oa = b.oac, oaOk = oa.load <= oa.cap;
    const table = `<div class="tbl"><table><thead><tr><th>系統</th>${S.cases.map((c) => `<th>${esc(c.n)} ${c.t}℃</th>`).join('')}</tr></thead><tbody>
      ${zs.map((z) => `<tr><td><i class="zdot" style="background:${zoneOf(z).c}"></i> ${esc(zoneOf(z).n)}</td>${res.map((r) => { const o = r[z], j = judge(o); return `<td><span class="num vt ${j[0]}">${vtxt(o)}</span></td>`; }).join('')}</tr>`).join('')}
      ${S.oac.on ? `<tr><td>外調機 ${esc(S.oac.id)}</td>${res.map((r) => { const d = r.oac.cap - r.oac.load; return `<td><span class="num vt ${d >= 0 ? 'ok' : 'ng'}">${d >= 0 ? kw(d) + ' ' + U() + ' 余る' : kw(-d) + ' ' + U() + ' 足りない'}</span></td>`; }).join('')}</tr>` : ''}</tbody></table></div>`;
    return `<div class="bar2"><b>⑤ 結果</b><span class="hint">どの暑さで見る:</span>${basisSeg(false)}</div>
      <div class="zcards">${cards}
        ${S.oac.on ? `<div class="zc" style="--zc:#14b8a6"><div class="hd"><b>外調機 ${esc(S.oac.id)}</b></div>
          <div class="verdict ${oaOk ? 'ok' : 'ng'}"><b class="num">${oaOk ? kw(oa.cap - oa.load) + ' ' + U() + ' 余る' : kw(oa.load - oa.cap) + ' ' + U() + ' 足りない'}</b></div>
          <div class="pair"><div><span>外気を冷やすのに必要</span><b class="num">${kw(oa.load)} ${U()}</b></div><div><span>外調機の能力</span><b class="num">${kw(oa.cap)} ${U()}</b></div></div>
          ${oa.hoodIn.raw > 0 ? `<div class="why">出す空気が入れる空気より <b class="num">${oa.hoodIn.raw.toLocaleString()} m³/h</b> 多く、その分は外調機を通らずに外の空気が入っています</div>` : ''}</div>` : ''}
      </div>
      <div class="card mt"><h3>暑さごとの比較</h3>${table}<p class="hint mt">必要な能力には余裕 ${S.margin}% を含みます。馬力は ${hpNote()} で換算しています。今の空調機の能力は、選んだ低下と、外が暑い時の能力の下がり（35℃を超えると1℃につき1.5%）を見込んでいます。</p></div>
      <div class="card mt"><h3>更新する時の選び方（シアター以外）</h3><p class="hint">床置きにはせず、<b>今の空調機と同じ形</b>（天井カセット・壁掛など）で能力を選びます。メーカーは<b>既設と同じ</b>、機器表で分からない時は<b>ダイキン</b>で提案します。系統の必要な能力を、今の台数と能力の割合で1台ずつに分け、その形の段階（P40〜P160 など）から選びます。足りない時は同じ形を2台にします。今が床置きの時は天井埋込ダクトにします。形とメーカーは「④ 機器・換気」の表で直せます。</p><p class="hint">段階は業務用パッケージの一般的な段階です（メーカーごとの正確な段階は能力表で確認）。</p></div>`;
  }
  const BASIS_SRC = { std: '建築設備設計基準の考え方', gen: '一般的な目安', phy: '空気の性質（物理の値）', dwg: '図面・機器表から', site: '現地・入力' };
  function basisRows() {
    const ex = Object.keys(S.extra).filter((k) => S.extra[k].on);
    return [
      ['外気・室内の条件', '—', `標準 ${S.cases[0].t}℃・${S.cases[0].rh}%／酷暑 ${S.cases[1].t}℃・${S.cases[1].rh}%／最悪 ${S.cases[2].t}℃・${S.cases[2].rh}%、室内 ${S.indoor.t}℃・${S.indoor.rh}%。時刻 9・12・14・16時`, '標準は建築設備設計基準（令和3年版）東京。酷暑は入力'],
      ['外壁', '面積 × 熱通過率 × 実効温度差', `熱通過率 ${uK(K.wall)}（RC造＋断熱相当）。実効温度差 北3〜6・東7〜10・南3〜9・西3〜11 ${tD()}（時刻別）に、外気温の34℃からの差を加える`, '計算の仕方は' + BASIS_SRC.std + '。数値は' + BASIS_SRC.gen + '。面積は' + BASIS_SRC.dwg],
      ['ガラス（温度）', '面積 × 熱通過率 × (外気温 − 室温)', `熱通過率 ${uK(K.glass)}（複層ガラス相当）`, '数値は' + BASIS_SRC.gen + '。面積は' + BASIS_SRC.dwg],
      ['日射', '面積 × 日射熱取得 × 遮へい係数', `日射熱取得（${uAu()}）北${nA(45)}〜${nA(55)}・東${nA(480)}（9時）・南${nA(150)}〜${nA(240)}・西${nA(390)}〜${nA(500)}（16時）。遮へい係数 なし0.85・ブラインド0.6・熱線反射0.45`, '計算の仕方は' + BASIS_SRC.std + '。数値は東京の夏の' + BASIS_SRC.gen],
      ['屋根・共用部との壁', '面積 × 熱通過率 × 温度差', `屋根 ${uK(K.roof)}・実効温度差 8〜24 ${tD()}。共用部との壁 ${uK(K.part)}・共用部 28℃`, BASIS_SRC.gen],
      ['照明', `床面積 × 照明の電力（${uAu()}）`, S.rooms.filter((r) => r.calc).map((r) => esc(r.name.split('（')[0]) + ' ' + uA(r.light)).join('・'), 'LED照明の' + BASIS_SRC.gen + '（図面に照明器具表があれば器具の合計に置き換え）'],
      ['人', '人数 × 1人の発熱（顕熱＋潜熱）', `1人あたり（${uP()}）ロビーのお客様 ${nA(65)}＋${nA(70)}・店員 ${nA(80)}＋${nA(140)}・事務 ${nA(60)}＋${nA(50)}。ロビーの人数 = 座席 ${S.seats.total} × 入れ替わる ${S.seats.turn}% × ロビーにいる ${S.seats.stay}% = ${lobbyPeople()} 人`, '1人の発熱は室温26℃の' + BASIS_SRC.gen + '。座席数はホームページ・割合は入力'],
      ['厨房・売店の機器', '消費電力 × 台数 × 稼働率 × 部屋に出る割合', '部屋に出る割合の例：ポップコーンマシーン フードの下0.35・フードなし0.55、保温ケース0.8、冷蔵ショーケース・製氷機（内蔵）1.5', '消費電力は' + BASIS_SRC.dwg + '（無い物はよくある機器の目安）。実測値を入れた物は実測。割合は' + BASIS_SRC.gen],
      ['外気（外調機の給気・換気・エアバランスの差）', `顕熱 = 風量 × ${coefS()} × 温度差、潜熱 = 風量 × ${coefL()} × 絶対湿度の差（${uP()}）`, isK() ? '0.289 = 空気の密度1.2kg/m³ × 比熱0.24kcal/(kg・℃)、0.717 = 1.2 × 蒸発潜熱597kcal/kg ÷ 1,000' : '0.336 = 空気の密度1.2kg/m³ × 比熱1.006kJ/(kg・K) ÷ 3.6、0.834 = 1.2 × 蒸発潜熱2,501kJ/kg ÷ 3,600', '係数は' + BASIS_SRC.phy + '。風量は' + BASIS_SRC.dwg],
      ['すきま風・出入口', ex.length ? '風量（下の目安）× 外気の入り方 → 外気と同じ式' : '—', ex.length ? ex.map((k) => esc(S.extra[k].n) + '：' + extraWhy(k)).join('／') + `。外気の入り方 ×${S.inflow}` : 'なし', '風量の考え方は' + BASIS_SRC.gen + '。台数・風除室の有無は' + BASIS_SRC.dwg],
      ['余裕・既設の能力・馬力', '必要な能力 = 負荷 × (1＋余裕)、今の能力 = 定格 × 能力の低下 × 外気温の補正', `余裕 ${S.margin}%。馬力は ${hpNote()}。能力の低下は機器ごとに選んだ値。外気温の補正 35℃を超えると1℃につき1.5%下がる`, '能力の低下は' + BASIS_SRC.site + '。補正は' + BASIS_SRC.gen + '（最終はメーカーの能力表で確認）']
    ];
  }
  const basisTable = (a, z) => `<table><tr><th style="width:17%">項目</th><th style="width:25%">計算の仕方</th><th>使った値</th><th style="width:23%">値の出どころ</th></tr>${basisRows().slice(a, z).map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>`;
  function otherPages() {
    const res = S.cases.map((c, i) => calc(i)); const b = res[S.basis]; const zs = zonesOn(); const hi = hoodInflow();
    const zNames = zs.map((z) => zoneOf(z).n.replace('系統', '')).join('・');
    const pages = [coverPage('空調負荷計算書', zNames)];
    pages.push(`<h5>1. 設計条件</h5><table><tr><th>項目</th>${S.cases.map((c) => `<th>${esc(c.n)}</th>`).join('')}</tr><tr><td>外気 乾球温度</td>${S.cases.map((c) => `<td>${c.t}℃</td>`).join('')}</tr><tr><td>外気 相対湿度</td>${S.cases.map((c) => `<td>${c.rh}%（${r1(xOf(c.t, c.rh))} g/kg）</td>`).join('')}</tr><tr><td>室内</td><td colspan="3">${S.indoor.t}℃・${S.indoor.rh}%（${r1(xIn())} g/kg）</td></tr><tr><td>余裕</td><td colspan="3">${S.margin}%</td></tr></table>
      <h6>計算の方法</h6><div>国土交通省「建築設備設計基準」の最大熱負荷計算の考え方による。外壁・屋根は実効温度差、ガラスは温度差と日射、人・照明・機器・外気・すきま風を加え、9・12・14・16時（設計基準の時刻）で計算して最大の時刻を系統のピークとした。既設機器の能力は、機器ごとに選んだ能力の低下（100〜80%）と外気温（35℃超は1℃につき1.5%低下）で補正した。</div>
      <h6>2. 系統と部屋</h6><table><tr><th>系統</th><th>部屋</th><th>面積</th></tr>${zs.map((z) => { const rs = S.rooms.filter((r) => r.calc && r.zone === z); return `<tr><td>${esc(zoneOf(z).n)}</td><td>${rs.map((r) => esc(r.name)).join('・')}</td><td>${r1(rs.reduce((s, r) => s + area(r), 0))}㎡</td></tr>`; }).join('')}</table>
      <h6>図面に出てこない負荷</h6><div>${Object.keys(S.extra).filter((k) => S.extra[k].on).map((k) => esc(S.extra[k].n) + ' 約' + Math.round(extraFlow(k) * S.inflow).toLocaleString() + 'm³/h（' + extraWhy(k) + '）').join('、') || 'なし'}（外気の入り方：${S.inflow === 1 ? '標準' : S.inflow > 1 ? '強め' : '弱め'}）</div>
      <h6>エアバランス</h6><div>入れる空気 ${hi.sup.toLocaleString()} m³/h・出す空気 ${hi.exh.toLocaleString()} m³/h ${hi.raw > 0 ? '→ 差の ' + hi.raw.toLocaleString() + ' m³/h は外気のまま' + esc(zoneOf(S.ab.enter).n.replace('系統', '')) + 'に入るとした' : '（つり合い）'}</div>`);
    const partNames = Object.keys(PART_COL);
    chunk(zs, 5).forEach((part, pi, all) => {
      pages.push(`<h5>3. 系統ごとの負荷（${esc(S.cases[S.basis].n)} ${S.cases[S.basis].t}℃）${all.length > 1 ? '（' + (pi + 1) + '/' + all.length + '）' : ''}</h5><table><tr><th>内訳 (${U()})</th>${part.map((z) => `<th>${esc(zoneOf(z).n.replace('系統', ''))}</th>`).join('')}</tr>${partNames.filter((k) => part.some((z) => Math.abs(b[z].partsAt[k] || 0) > 50)).map((k) => `<tr><td>${esc(k)}</td>${part.map((z) => `<td class="r">${kw(b[z].partsAt[k] || 0)}</td>`).join('')}</tr>`).join('')}<tr><th>合計</th>${part.map((z) => `<th class="r">${kw(b[z].total)}</th>`).join('')}</tr><tr><th>余裕込み</th>${part.map((z) => `<th class="r">${kw(b[z].need)}</th>`).join('')}</tr><tr><td>ピーク時刻</td>${part.map((z) => `<td class="r">${b[z].flat ? '差なし' : b[z].peakHour + '時'}</td>`).join('')}</tr></table>`);
    });
    chunk(zs, 6).forEach((part, pi, all) => {
      pages.push(`<h5>4. 既設能力との比較と更新の検討（${U()}）${all.length > 1 ? '（' + (pi + 1) + '/' + all.length + '）' : ''}</h5><table><tr><th>系統</th>${S.cases.map((c) => `<th>${esc(c.n)}<br>必要/既設</th>`).join('')}<th>更新の検討（更新する時の機種・馬力）</th></tr>${part.map((z) => { const pl = sameFormPlan(z, b[z].need / 1000 / capFactorT(S.cases[S.basis].t)); return `<tr><td>${esc(zoneOf(z).n)}</td>${res.map((r) => { const o = r[z], j = judge(o); return `<td>${j[1]}<br>${kw(o.need)}/${kw(o.capEff)}</td>`; }).join('')}<td>${b[z].diff < 0 ? '更新を検討：約' + r1(pl.hp) + '馬力（' + esc(pl.text) + '）' : '更新の必要なし'}</td></tr>`; }).join('')}</table>
      ${pi === all.length - 1 ? '<h6>注意</h6><div>図面から読み取った値と現地調査の値にもとづく。機器の発熱は目安（実測値を入れたものは実測）。最終の機器選定はメーカーの能力表で確認のこと。</div>' : ''}`);
    });
    pages.push(`<h5>5. 計算の根拠（1）</h5>${basisTable(0, 5)}`);
    pages.push(`<h5>5. 計算の根拠（2）</h5>${basisTable(5, 8)}`);
    pages.push(`<h5>5. 計算の根拠（3）</h5>${basisTable(8, 99)}<div class="mt">「一般的な目安」の値は、建築設備設計基準の表の値に置き換える予定。</div>`);
    return pages;
  }
  const stReport = () => zonesOn().length ? reportCard(otherPages()) : `<div class="card"><h3>⑥ 計算書</h3><p class="hint">計算する部屋がありません。</p></div>`;

  /* ============================================================
     ファイル（Supabase Storage heatload-files。テストモードはこの画面の中だけ）
     ============================================================ */
  const pad = (n) => String(n).padStart(2, '0');
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid() + uid() + uid();
  // 写真は大きいと読めないので小さくする（長い辺 2400px・JPEG）
  function shrink(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        const max = Math.max(im.naturalWidth, im.naturalHeight);
        if (max <= 2400 && file.size <= 3.5 * 1048576) { URL.revokeObjectURL(url); resolve({ blob: file, type: file.type }); return; }
        const s = Math.min(1, 2400 / max), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob((b) => resolve(b ? { blob: b, type: 'image/jpeg' } : { blob: file, type: file.type }), 'image/jpeg', 0.88);
      };
      im.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: file, type: file.type }); };
      im.src = url;
    });
  }
  async function addFiles(role, list) {
    const cur = S;
    const arr = [...(list || [])].filter((f) => f.type === 'application/pdf' || /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!arr.length) { toast('PDF か写真（JPEG・PNG）を入れてください'); return; }
    if (S.files.length + arr.length > 40) { alert('ファイルは 40 個までです。'); return; }
    uploading += arr.length; render();
    for (const f of arr) {
      try {
        let blob = f, type = f.type;
        if (/^image\//.test(type)) { const r = await shrink(f); blob = r.blob; type = r.type; }
        if (blob.size > 30 * 1048576) { alert(`「${f.name}」は大きすぎます（30MB まで）。ページを分けて入れてください。`); continue; }
        const id = uid(); let path; const sb = sbc();
        if (sb) {
          const d = new Date(); path = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + uuid() + (type === 'application/pdf' ? '.pdf' : type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg');
          const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
          if (error) throw error;
        } else { path = 'mem:' + id; mem[id] = blob; }
        if (S !== cur) return;
        S.files.push({ id, path, name: f.name, mediaType: type, size: blob.size, role }); onChange();
      } catch (e) { console.error(e); alert(`「${f.name}」を入れられませんでした：${(e && e.message) || e}${/bucket|not found/i.test(String(e && e.message)) ? '（データベースの準備 SETUP_HEATLOAD.sql がまだかもしれません）' : ''}`); }
      finally { uploading--; render(); }
    }
  }
  async function fileUrls(fs) {
    const sb = sbc();
    if (!sb) return fs.map((f) => ({ url: f.path, mediaType: f.mediaType, name: f.name }));
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(fs.map((f) => f.path), 60 * 60);
    if (error) throw error;
    return fs.map((f) => { const x = (data || []).find((y) => y.path === f.path); return { url: x && x.signedUrl, mediaType: f.mediaType, name: f.name }; }).filter((x) => x.url);
  }
  async function openFile(id) {
    const f = S.files.find((x) => x.id === id); if (!f) return;
    const w = window.open('', '_blank');
    try {
      let url;
      if (mem[f.id]) url = URL.createObjectURL(mem[f.id]);
      else { const sb = sbc(); if (!sb) throw new Error('テストモードで入れたファイルは、閉じると見られなくなります'); const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(f.path, 60 * 30); if (error) throw error; url = data.signedUrl; }
      if (w) w.location.href = url; else window.location.href = url;
    } catch (e) { if (w) w.close(); alert('ファイルを開けませんでした：' + ((e && e.message) || e)); }
  }

  /* ============================================================
     AI の読み取り（/api/heatload-read）
     ============================================================ */
  async function callAI(task, label, payload) {
    if (reading) return null;
    const cur = S;
    reading = label; readStart = Date.now(); clearInterval(readTimer);
    readTimer = setInterval(() => { const b = root() && root().querySelector('.hl-read'); if (b) b.innerHTML = readingBox(); }, 1000);
    render();
    try {
      const sb = sbc(); let token = '';
      if (sb) { const { data } = await sb.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; }
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(Object.assign({ task }, payload)) });
      let js = {}; try { js = await r.json(); } catch (e) {}
      if (r.status === 504) throw new Error('時間がかかりすぎて止まりました。ファイルを減らすか、部屋を少しずつ選んで読んでください');
      if (!r.ok || !js.ok) throw new Error(js.error || ('通信エラー ' + r.status));
      return S === cur ? js.data : null;
    } catch (e) { alert(label + 'に失敗しました：' + ((e && e.message) || e)); return null; }
    finally { reading = ''; clearInterval(readTimer); render(); }
  }
  const normScr = (s) => { s = String(s || '').trim(); if (!s) return ''; const m = s.match(/(\d+)/); if (m && (/^\d+$/.test(s) || /SCR|スクリーン|シアター|theat|screen|劇場/i.test(s))) return 'SCR' + (+m[1]); return s; };
  const nameKey = (s) => String(s || '').replace(/[\s　・（）()]/g, '').toLowerCase();
  async function readThAc() {
    const fs = S.files.filter((f) => f.role === 'th'); if (!fs.length) return;
    if (S.th.ac.length && !confirm('今の空調機の一覧を、機器表から読み取った内容に置き換えます。よいですか？')) return;
    let files; try { files = await fileUrls(fs); } catch (e) { alert('ファイルの準備に失敗しました：' + e.message); return; }
    const d = await callAI('th-ac', '機器表の読み取り', { files }); if (!d) return;
    S.th.ac = (d.units || []).map((u, i) => ({ id: u.id || 'AC-' + (i + 1), scr: normScr(u.screen), cap: +u.cap_kw || 0, deg: 1, maker: u.maker || '', model: u.model || '', src: u.src || '', chk: u.unsure || (u.cap_kw == null ? '冷房能力が読めない' : '') }));
    const ids = (d.screens || []).map(normScr).concat(S.th.ac.map((a) => a.scr)).filter((x) => x);
    ids.forEach((id) => { if (!S.th.screens.some((s) => s.id === id)) S.th.screens.push({ id, seats: 0, on: true }); });
    sortScreens(); S.th.acRead = true; onChange(); render();
    toast(`機器表から空調機 ${S.th.ac.length} 台を読みました。${S.th.ac.some((a) => a.chk) ? '黄色の行を確かめてください' : ''}`);
  }
  async function saveHomepage(url) {
    const sb = sbc(); if (!sb || !ctx.theater || !url) return;
    try { await sb.from('theaters').update({ homepage: url }).eq('name', ctx.theater); } catch (e) { /* 列がまだ無い時は何もしない */ }
  }
  async function loadHomepage() {
    const sb = sbc(); if (!sb || !ctx.theater) return '';
    try { const { data, error } = await sb.from('theaters').select('homepage').eq('name', ctx.theater).maybeSingle(); return (!error && data && data.homepage) || ''; } catch (e) { return ''; }
  }
  async function readSeats(totalOnly) {
    const inp = root() && root().querySelector('[data-thurl]');
    if (inp && inp.value.trim() !== (S.th.url || '')) { S.th.url = inp.value.trim(); onChange(); }
    const url = (S.th.url || '').trim(); if (!url) return;
    const d = await callAI('seats', 'ホームページの読み取り', { url }); if (!d) return;
    saveHomepage(url);
    const list = (d.screens || []).map((s) => ({ id: normScr(s.id), seats: +s.seats || 0 })).filter((s) => s.id);
    const total = d.total || list.reduce((s, x) => s + x.seats, 0);
    if (totalOnly) {
      if (!total) { alert('座席数を読めませんでした。' + (d.note || '')); return; }
      S.seats.total = total; onChange(); render(); toast(`劇場の座席数 ${total} 席を読みました`); return;
    }
    if (!list.length) { alert('座席数を読めませんでした。' + (d.note || '') + '\n数字を手で入れてください。'); return; }
    list.forEach((x) => { const s = S.th.screens.find((y) => y.id === x.id); if (s) s.seats = x.seats; else S.th.screens.push({ id: x.id, seats: x.seats, on: true }); });
    if (total) S.seats.total = total;
    sortScreens(); S.th.seatsRead = true; S.th.seatsSrc = d.page_url || url; onChange(); render();
    toast(`ホームページから ${list.length} スクリーンの座席数を読みました`);
  }
  async function readNames() {
    const fs = S.files.filter((f) => f.role === 'plan'); if (!fs.length) return;
    let files; try { files = await fileUrls(fs); } catch (e) { alert('ファイルの準備に失敗しました：' + e.message); return; }
    const d = await callAI('names', '部屋の名前の読み取り', { files }); if (!d) return;
    if (d.scale) S.scale = d.scale;
    let n = 0;
    (d.rooms || []).forEach((x) => {
      const name = String(x.name || '').trim(); if (!name || S.rooms.some((r) => nameKey(r.name) === nameKey(name))) return;
      const z = x.zone === 'theater' ? 'theater' : (BASE_ZONES[x.zone] ? x.zone : guessZone(name));
      S.rooms.push(newRoom(name, z, x.src || '')); n++;
    });
    if (S.phase === 'files') S.phase = 'names';
    onChange(); render(); toast(n ? `部屋の名前を ${n} 件読みました。計算したい部屋を選んでください` : '新しい部屋は見つかりませんでした');
  }
  async function readDetail() {
    const fs = S.files.filter((f) => f.role === 'plan'); const want = S.rooms.filter((r) => r.calc && !r.read); if (!fs.length || !want.length) return;
    let files; try { files = await fileUrls(fs); } catch (e) { alert('ファイルの準備に失敗しました：' + e.message); return; }
    const d = await callAI('detail', '選んだ部屋の読み取り', { files, rooms: want.map((r) => r.name) }); if (!d) return;
    applyDetail(d, want); S.phase = 'read'; S.sel = (want[0] || {}).id || S.sel;
    onChange(); render(); toast(`選んだ ${want.length} 部屋を詳しく読みました。② で黄色の所を確かめてください`);
  }
  function applyDetail(d, want) {
    if (d.scale) S.scale = d.scale;
    const got = d.rooms || [];
    want.forEach((r, i) => {
      const x = got.find((g) => nameKey(g.name) === nameKey(r.name)) || got.find((g) => nameKey(g.name).indexOf(nameKey(r.name)) >= 0 || nameKey(r.name).indexOf(nameKey(g.name)) >= 0) || (got.length === want.length ? got[i] : null);
      r.read = true;
      if (!x) { r.chk = '図面で見つからなかった（面積などを手で入れてください）'; return; }
      const dir = (o) => { const v = {}; ['N', 'E', 'S', 'W'].forEach((k) => { if (o && +o[k] > 0) v[k] = +o[k]; }); return v; };
      r.area = +x.area_m2 || 0; if (+x.height_m > 0) r.h = +x.height_m;
      r.env = { wall: dir(x.wall), glass: dir(x.glass), roof: +x.roof_m2 || 0, part: +x.part_m2 || 0 };
      if (x.people != null && +x.people >= 0) r.people = { auto: false, n: +x.people, kind: (r.people && r.people.kind) || 'office' };
      if (r.zone === 'theater' && BASE_ZONES[x.zone]) r.zone = x.zone;
      r.src = x.src || r.src; r.chk = x.unsure || (x.area_m2 == null ? '面積が読めない' : '');
    });
    const calcR = S.rooms.filter((r) => r.calc);
    const roomZone = (name) => { const k = nameKey(name); const r = calcR.find((y) => nameKey(y.name) === k) || calcR.find((y) => k && (nameKey(y.name).indexOf(k) >= 0 || k.indexOf(nameKey(y.name)) >= 0)); return r ? r.zone : (calcR[0] || {}).zone || 'lobby'; };
    (d.ac || []).forEach((a, i) => {
      const id = a.id || 'PAC-' + (S.ac.length + 1);
      const v = { id, maker: a.maker || '', kind: FORMS.indexOf(a.form) >= 0 ? a.form : '天井カセット', zone: roomZone(a.room), cap: +a.cap_kw || 0, deg: 1, src: a.src || '', chk: a.unsure || (a.cap_kw == null ? '冷房能力が読めない' : '') };
      const ex = S.ac.findIndex((y) => y.id === id); if (ex >= 0) S.ac[ex] = Object.assign(S.ac[ex], v, { deg: S.ac[ex].deg }); else S.ac.push(v);
    });
    const o = d.oac || {};
    if (o.found) {
      const to = {}; (o.to || []).forEach((t) => { const z = roomZone(t.room); to[z] = (to[z] || 0) + (+t.flow || 0); });
      if (!Object.keys(to).length && +o.flow > 0) to[roomZone('ロビー')] = +o.flow;
      S.oac = { on: true, id: o.id || 'OAC-1', flow: +o.flow || 0, cap: +o.cap_kw || 0, ts: +o.supply_temp || 24, xs: 10.0, to, src: o.src || '' };
    }
    const mergeById = (key, items) => { S[key] = S[key] || []; items.forEach((x) => { const i = S[key].findIndex((y) => y.id && y.id === x.id); if (i >= 0) S[key][i] = x; else S[key].push(x); }); };
    mergeById('exhItems', (d.exhaust || []).map((x) => ({ id: x.id, kind: x.kind, flow: +x.flow || 0, src: x.src || '' })));
    mergeById('sfItems', (d.supply_fans || []).map((x) => ({ id: x.id, flow: +x.flow || 0, src: x.src || '' })));
    mergeById('hexItems', (d.hex || []).map((x) => ({ id: x.id, flow: +x.flow || 0, eff: +x.eff || 0.6, zone: roomZone(x.room), src: x.src || '' })));
    if ((S.exhItems || []).length) {
      const hood = S.exhItems.filter((x) => x.kind === 'hood'), oth = S.exhItems.filter((x) => x.kind !== 'hood');
      S.exh = { hood: hood.reduce((s, x) => s + x.flow, 0), hoodSrc: hood.map((x) => x.id + (x.src ? '（' + x.src + '）' : '')).join('・'), other: oth.reduce((s, x) => s + x.flow, 0), otherSrc: oth.map((x) => x.id + (x.src ? '（' + x.src + '）' : '')).join('・') };
    }
    if ((S.sfItems || []).length) S.ab = Object.assign(S.ab, { sf: S.sfItems.reduce((s, x) => s + x.flow, 0), sfSrc: S.sfItems.map((x) => x.id).join('・') });
    if ((S.hexItems || []).length) { const h = S.hexItems; S.hex = { flow: h.reduce((s, x) => s + x.flow, 0), eff: h[0].eff, zone: h[0].zone, src: h.map((x) => x.id).join('・') }; }
    (d.equip || []).forEach((m) => {
      const zone = roomZone(m.room), ck = catGuess(m.name || '') || '';
      const key = nameKey(m.name) + '|' + zone; if (S.equip.some((y) => nameKey(y.n) + '|' + y.zone === key)) return;
      S.equip.push({ id: 'e' + uid(), n: m.name || '機器', ck: ck || m.name, kw: +m.kw || (ck ? cat(ck).kw : 0) || 0, q: +m.qty || 1, zone, hood: !!(ck && cat(ck).hoodable && S.exh.hood > 0), use: 0.8, src: m.src || '', real: '', chk: m.unsure || (m.kw == null ? '消費電力が読めない（よくある機器の値）' : '') });
    });
    const ex = d.extra || {}, zs = zonesOn(), ez = zs.indexOf('lobby') >= 0 ? 'lobby' : (zs[0] || 'lobby');
    if (+ex.doors > 0) Object.assign(S.extra.door, { on: true, vest: ex.vestibule === true, zone: ez, fromDrawing: `図面から: 出入口${+ex.doors}か所${ex.vestibule ? '・風除室あり' : ex.vestibule === false ? '・風除室なし' : ''}` });
    if (+ex.escalators > 0) Object.assign(S.extra.esc, { on: true, count: +ex.escalators, zone: ez, fromDrawing: `図面から: ${+ex.escalators}台` });
    if (+ex.elevators > 0) Object.assign(S.extra.ev, { on: true, count: +ex.elevators, zone: ez, fromDrawing: `図面から: ${+ex.elevators}台` });
    if (+ex.mall_open_width_m > 0) Object.assign(S.extra.mall, { on: true, width: +ex.mall_open_width_m, zone: ez, fromDrawing: `図面から: 幅 ${+ex.mall_open_width_m}m` });
  }

  /* ============================================================
     操作
     ============================================================ */
  const setPath = (o, p, v) => { const a = p.split('.'); let x = o; for (let i = 0; i < a.length - 1; i++) { x[a[i]] = x[a[i]] || {}; x = x[a[i]]; } x[a[a.length - 1]] = v; };
  function onClick(e) {
    const t = e.target; if (!S) return;
    const st = t.closest('[data-step]'); if (st) { S.step = +st.dataset.step; changed(); return; }
    const kd = t.closest('[data-kind]'); if (kd) { S.kind = kd.dataset.kind; S.step = 0; changed(); return; }
    const a = t.closest('[data-act]');
    if (a) {
      const k = a.dataset.act;
      if (k === 'toEntry') { S.kind = ''; changed(); return; }
      if (k === 'catAdd') { famOf().items.push({ hp: 10, kw: 28, model: '', est: false }); changed(); return; }
      if (k === 'thStd') { Object.assign(TP(), { area: TH_STD.area, etd: TH_STD.etd, k: TH_STD.k, person: TH_STD.person }); S.th.in.t = TH_STD.t; S.th.in.rh = TH_STD.rh; changed(); toast('標準の値に戻しました'); return; }
      if (k === 'thReadAc') { readThAc(); return; }
      if (k === 'thReadSeats') { readSeats(false); return; }
      if (k === 'readTotal') { readSeats(true); return; }
      if (k === 'readNames') { readNames(); return; }
      if (k === 'readDetail') { readDetail(); return; }
      if (k === 'thAcAdd') { S.th.ac.push({ id: 'AC-' + (S.th.ac.length + 1), scr: (S.th.screens[0] || {}).id || '', cap: 28, deg: 1, maker: '', model: '', src: '手で入力', chk: '' }); changed(); return; }
      if (k === 'thScrAdd') { let n = S.th.screens.length + 1; while (S.th.screens.some((s) => s.id === 'SCR' + n)) n++; S.th.screens.push({ id: 'SCR' + n, seats: 0, on: true }); changed(); return; }
      if (k === 'addName') {
        const inp = $('#hlAddName'); const v = ((inp && inp.value) || '').trim(); if (!v) { if (inp) inp.focus(); return; }
        if (/シアター|シネマ|オーディトリアム|スクリーン|SCR/i.test(v)) { toast('シアターは、書類棚で「シアター」の計算書を作って計算します'); return; }
        const r = newRoom(v, guessZone(v), '名前で足した'); r.calc = true; S.rooms.push(r); S.sel = r.id; if (S.phase === 'files') S.phase = 'names';
        changed(); toast(S.files.some((f) => f.role === 'plan') ? `「${v}」を足しました。「詳しく読む」で図面から探します` : `「${v}」を足しました。② で面積などを入れてください`); return;
      }
      if (k === 'newZone') { const r = S.rooms.find((x) => x.id === S.sel); const inp = $('#hlNewZone'); const z = addZone((inp && inp.value) || ''); if (z && r) { r.zone = z; changed(); toast('「' + ZONES[z].n + '」を作りました'); } return; }
      if (k === 'uncalc') { const r = S.rooms.find((x) => x.id === S.sel); if (r) { r.calc = false; changed(); toast(`「${r.name}」を計算から外しました（① でまた選べます）`); } return; }
      if (k === 'addEq') { const n = $('#hlCatSel').value, c = cat(n), zs = zonesOn(); S.equip.push({ id: 'e' + uid(), n, ck: n, kw: c.kw, q: 1, zone: zs.indexOf('conc') >= 0 ? 'conc' : zs[0], hood: !!c.hoodable, use: 0.8, src: 'よくある機器から追加', real: '' }); changed(); toast('「' + n + '」を足しました'); return; }
      if (k === 'acAdd') { const zs = zonesOn(); S.ac.push({ id: 'PAC-' + (S.ac.length + 1), maker: '', kind: '天井カセット', zone: zs[0], cap: 11.2, deg: 1, src: '手で入力', chk: '' }); changed(); return; }
    }
    const fo = t.closest('[data-fopen]'); if (fo) { openFile(fo.dataset.fopen); return; }
    const fd = t.closest('[data-fdel]'); if (fd) { const f = S.files.find((x) => x.id === fd.dataset.fdel); if (f && confirm(`「${f.name}」を外しますか？（読み取った内容はそのまま残ります）`)) { S.files = S.files.filter((x) => x !== f); delete mem[f.id]; changed(); } return; }
    const rm = t.closest('[data-room]'); if (rm) { S.sel = rm.dataset.room; render(); return; }
    const bs = t.closest('[data-basis]'); if (bs) { S.basis = +bs.dataset.basis; changed(); return; }
    const oaB = t.closest('[data-oa]'); if (oaB) { S.th.oa = +oaB.dataset.oa; changed(); return; }
    const del = (attr, list) => { const b = t.closest('[' + attr + ']'); if (!b) return false; list.splice(+b.getAttribute(attr), 1); changed(); return true; };
    if (del('data-catdel', famOf().items) || del('data-thacdel', S.th.ac) || del('data-thsdel', S.th.screens) || del('data-acdel', S.ac) || del('data-eqdel', S.equip)) return;
    const un = t.closest('[data-unit]'); if (un) { S.unit = un.dataset.unit; changed(); return; }
    const inf = t.closest('[data-inflow]'); if (inf) { S.inflow = +inf.dataset.inflow; changed(); return; }
    const xv = t.closest('[data-exv]'); if (xv) { const [k, f] = xv.dataset.exv.split('.'); S.extra[k].vest = f === 'true'; changed(); return; }
    const ex = t.closest('[data-extra]'); if (ex) { const k = ex.dataset.extra, e = S.extra[k]; e.on = !e.on; if (e.on) { const zs = zonesOn(); if (zs.length && zs.indexOf(e.zone) < 0) e.zone = zs.indexOf('lobby') >= 0 ? 'lobby' : zs[0]; } changed(); return; }
    const oc = t.closest('[data-oac]'); if (oc) { S.oac.on = !S.oac.on; changed(); return; }
  }
  function onChangeEv(e) {
    const t = e.target; if (!S || !t.dataset) return;
    const v = t.type === 'number' ? (t.value === '' ? '' : +t.value) : t.value; const nv = +v || 0;
    const r = S.rooms.find((x) => x.id === S.sel); const d = t.dataset;
    if (d.fadd) { addFiles(d.fadd, t.files); t.value = ''; return; }
    if (d.pick) { const x = S.rooms.find((y) => y.id === d.pick); x.calc = t.checked; if (t.checked && !S.sel) S.sel = x.id; return changed(); }
    if (d.ths) { const [i, f] = d.ths.split('.'); const s = S.th.screens[+i]; if (f === 'on') s.on = t.checked; else if (f === 'id') { const old = s.id; s.id = String(v).trim() || old; S.th.ac.forEach((a) => { if (a.scr === old) a.scr = s.id; }); } else s[f] = nv; return changed(); }
    if (d.thac) { const [i, f] = d.thac.split('.'); const a = S.th.ac[+i]; a[f] = (f === 'scr' || f === 'id') ? v : f === 'cap' ? capOut(nv) : nv; if (f === 'cap') a.chk = ''; return changed(); }
    if (d.thurl) { S.th.url = String(v).trim(); return changed(); }
    if (d.fam) { S.fam[d.fam] = v; return changed(); }
    if (d.hz) { S.hz = nv; hzSync(); return changed(); }
    if (d.cati) { const [i, k] = d.cati.split('.'); const it = famOf().items[+i]; it[k] = k === 'model' ? v : k === 'kw' ? capOut(nv) : nv; if (k !== 'model') it.est = false; return changed(); }
    if (d.thp) { const k = d.thp; TP()[k] = (k === 'k' || k === 'person') && !isK() ? nv * 0.86 : nv; return changed(); }
    if (d.thin) { S.th.in[d.thin] = nv; return changed(); }
    if (d.thoa) { S.th.oa = nv; return changed(); }
    if (d.casename) { S.caseName = String(v).trim(); return changed(); }
    if (d.rf && r) {
      const k = d.rf;
      if (k === 'light') r.light = isK() ? nv / 0.86 : nv;
      else if (k === 'area') r.area = nv;
      else if (k === 'pmode') r.people = v === 'auto' ? { auto: true, n: 0, kind: 'lobby' } : { auto: false, n: 0, kind: r.people.kind && r.people.kind !== 'lobby' ? r.people.kind : 'office' };
      else if (k === 'pk') r.people.kind = v; else if (k === 'pn') r.people.n = nv; else if (k === 'sc') r.sc = nv;
      else if (k === 'name') r.name = String(v).trim() || r.name; else r[k] = v;
      if (r.chk && (k === 'area')) r.chk = '';
      return changed();
    }
    if (d.env && r) { setPath(r.env, d.env, nv); return changed(); }
    if (d.case) { const [i, k] = d.case.split('.'); S.cases[+i][k] = nv; return changed(); }
    if (d.in) { S.indoor[d.in] = nv; return changed(); }
    if (d.mg) { S.margin = nv; return changed(); }
    if (d.seat) { S.seats[d.seat] = nv; return changed(); }
    if (d.exn) { const [k, f] = d.exn.split('.'); S.extra[k][f] = nv; return changed(); }
    if (d.exz) { S.extra[d.exz].zone = v; return changed(); }
    if (d.ab) { const k = d.ab; S.ab[k] = k === 'enter' ? v : nv; return changed(); }
    if (d.ac) { const [i, k] = d.ac.split('.'); const a = S.ac[+i]; a[k] = (k === 'zone' || k === 'id') ? v : k === 'cap' ? capOut(nv) : nv; if (k === 'cap') a.chk = ''; return changed(); }
    if (d.acm != null) { S.ac[+d.acm].maker = String(v).trim(); return changed(); }
    if (d.ack != null) { S.ac[+d.ack].kind = v; return changed(); }
    if (d.acdeg) { S.ac[+d.acdeg].deg = nv; return changed(); }
    if (d.eq) { const [i, k] = d.eq.split('.'); const m = S.equip[+i]; m[k] = k === 'zone' ? v : k === 'real' ? (v === '' ? '' : capOut(nv)) : k === 'kw' ? capOut(nv) : nv; if (k === 'kw') m.chk = ''; return changed(); }
    if (d.eqh) { S.equip[+d.eqh].hood = t.checked; return changed(); }
    if (d.oacf) { const k = d.oacf; S.oac[k] = k === 'id' ? v : k === 'cap' ? capOut(nv) : nv; return changed(); }
    if (d.oacto) { S.oac.to[d.oacto] = nv; return changed(); }
    if (d.exf) { S.exh[d.exf] = nv; return changed(); }
    if (d.hexf) { S.hex[d.hexf] = nv; return changed(); }
    if (d.hexz) { S.hex.zone = v; return changed(); }
  }
  function bind() {
    const el = root(); if (!el || el.dataset.hlBound) return; el.dataset.hlBound = '1';
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChangeEv);
    // ホームページの URL は、文字を入れた時点でボタンを押せるようにする（入力の確定を待つと、1回目に押しても動かないため）
    el.addEventListener('input', (e) => {
      if (!S || !e.target.dataset || !e.target.dataset.thurl) return;
      const v = e.target.value.trim();
      el.querySelectorAll('[data-act="thReadSeats"],[data-act="readTotal"]').forEach((b) => { b.disabled = !v || !!reading; });
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'hlAddName') { e.preventDefault(); onClick({ target: el.querySelector('[data-act="addName"]') }); } });
    el.addEventListener('dragover', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
    el.addEventListener('dragleave', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) z.classList.remove('over'); });
    el.addEventListener('drop', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (!z) return; e.preventDefault(); z.classList.remove('over'); addFiles(z.dataset.drop, e.dataTransfer && e.dataTransfer.files); });
    document.addEventListener('pointerdown', (e) => { if (el.contains(e.target)) ptrDown = true; }, true);
    document.addEventListener('pointerup', () => { setTimeout(() => { ptrDown = false; if (pendingRender) { pendingRender = false; render(); } }, 0); }, true);
  }

  /* ============================================================
     印刷（A4縦）
     ============================================================ */
  function print() {
    const box = document.getElementById('heatPrint'); if (!box || !S) return;
    if (!S.kind) { alert('先に「シアター」か「シアター以外」かを選んでください'); return; }
    const pages = S.kind === 'theater' ? thPages() : (zonesOn().length ? otherPages() : []);
    if (!pages.length) { alert('計算する部屋がありません'); return; }
    box.innerHTML = pagesWrap(pages);
    document.body.classList.add('heat-printing');
    let pcss = document.getElementById('hlPageCss');
    if (!pcss) { pcss = document.createElement('style'); pcss.id = 'hlPageCss'; document.head.appendChild(pcss); }
    pcss.textContent = '@media print{@page{size:A4 portrait;margin:0}}';
    const cleanup = () => { document.body.classList.remove('heat-printing'); box.innerHTML = ''; pcss.textContent = ''; window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 50);
  }

  /* ============================================================
     Excel（式でつながった計算書。heatload-xlsx.js が作る）
     ============================================================ */
  async function excel() {
    if (!S || !S.kind) { alert('先に「シアター」か「シアター以外」かを選んでください'); return; }
    if (S.kind === 'other' && !zonesOn().length) { alert('計算する部屋がありません'); return; }
    if (!window.HLXL) { alert('Excel を作る部品が読み込まれていません'); return; }
    try {
      const blob = await window.HLXL.build(window.HL._x()).blob();
      const name = (docTitle() || '空調負荷計算').replace(/[\\/:*?"<>|\s]+/g, '_') + '.xlsx';
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast('Excel を作りました（黄色のセルを変えると計算し直されます）');
    } catch (e) { console.error(e); alert('Excel を作れませんでした：' + ((e && e.message) || e)); }
  }

  /* ============================================================
     書類棚（shelf.js）から使う
     ============================================================ */
  function newData(o) {
    o = o || {};
    let hz = 50;
    try { const t = (DB().theaters ? DB().theaters() : []).find((x) => x.name === o.theater); const h = t && hzOfAddress(t.address); if (h) hz = h; } catch (e) {}
    return defaultState({ kind: o.kind, hz, caseName: o.caseName || '' });
  }
  function load(data, opts) {
    opts = opts || {}; onChange = opts.onChange || (() => {});
    ctx = Object.assign({ name: '', company: '', theater: '' }, opts.ctx || {});
    S = normalize(clone(data || {})); buildZones(); hzSync(); bind(); render();
    if (!S.th.url && ctx.theater) { const cur = S; loadHomepage().then((u) => { if (u && S === cur && !S.th.url) { S.th.url = u; render(); } }); }
  }
  function getState() { return S ? clone(S) : null; }
  function summary(d) {
    d = d || {};
    if (d.kind === 'theater') { const sc = ((d.th && d.th.screens) || []).filter((s) => s.on); return '🎬 シアター' + (sc.length ? ' ' + sc.length + ' スクリーン' : ''); }
    if (d.kind === 'other') { const rs = (d.rooms || []).filter((r) => r.calc).map((r) => r.name); return '🏢 ' + (rs.length ? rs.slice(0, 4).join('・') + (rs.length > 4 ? ' ほか' : '') : 'シアター以外'); }
    return '';
  }
  window.HL = {
    newData, load, getState, summary, print, normalize,
    setTitle: (n) => { ctx.name = n || ''; },
    leave: () => {},
    busy: () => uploading > 0 || !!reading,
    excel: () => excel(),
    _calc: (ci) => calc(ci), _thRows: (ci) => thRows(ci), _hzOfAddress: hzOfAddress,
    // Excel を作る部品（heatload-xlsx.js）に、計算のもとを渡す
    _x: () => ({ S, ctx, docTitle: docTitle(), theaterName: theaterName(), jpToday: jpToday(), TH_STD, HOURS, DT, SHGF, ETD, K, PEOPLE, PEOPLE_N, CATALOG, cat, FORM_STEPS, FORMS, REPL_FORM, PHP, DEG, PASS_VOL, BASE_ZONES, zonesOn, zoneOf, ZONES: () => ZONES, ZK: () => ZK, calc, thRows, thPer, famOf, capFactorT, xOf, hOf, lobbyPeople, extraPeople, extraFlow, hoodInflow, sameFormPlan, replCombo, cat })
  };
})();
