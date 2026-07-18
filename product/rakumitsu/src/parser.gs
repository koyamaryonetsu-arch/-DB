/**
 * ラクミツ：乱れた入力 → 見積/請求明細の解析
 * 純粋関数のみ（GASのAPIを使わない）。Node でもそのまま読み込めるため test/ でローカルテストする。
 *
 * 解析の約束事（テストで固定）：
 * - 「2台 15000」は 数量2 × 単価15000（見積の慣習）。「2台で30000」は合計30000
 * - 「ずつ」「各」が付いた数字は単価
 * - 「1.5万」→ 15000、全角数字・カンマ・×・円 は正規化
 * - 行末の「様/さん/御中」だけの行、または行頭の「◯◯様 」は宛名
 * - 「値引き/割引」を含む行はマイナス金額
 * - 「※軽減」「(軽減)」を含む行は軽減税率8%
 * - 数字のない行は「金額未定の品目」として聞き返し対象
 */

var RakuParser = (function () {
  var UNITS = '台|個|回|式|枚|本|袋|箱|セット|時間|名|人|km|m2|m|坪|部屋|ヶ所|カ所|か所|件|日|h';

  function normalize(text) {
    var s = String(text || '');
    s = s.replace(/[０-９．]/g, function (c) {
      return c === '．' ? '.' : String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/　/g, ' ').replace(/，/g, ',').replace(/[×✕ｘＸX]/g, 'x').replace(/㎡/g, 'm2');
    while (/(\d),(\d{3})/.test(s)) s = s.replace(/(\d),(\d{3})/g, '$1$2');
    s = s.replace(/(\d+(?:\.\d+)?)\s*万/g, function (_, n) {
      return String(Math.round(parseFloat(n) * 10000));
    });
    return s;
  }

  function trimName(s) {
    return String(s || '').replace(/[\s:：、,・‐-]+$/, '').replace(/^[\s:：、,・]+/, '').trim();
  }

  /** 1行を解析して {type:'client'|'item'|'flag'|'empty', ...} を返す */
  function parseLine(rawLine) {
    var line = normalize(rawLine).trim();
    if (!line) return { type: 'empty' };

    // 税込/税別の指定行
    if (/^(税込|内税)\s*$/.test(line)) return { type: 'flag', taxIncluded: true };
    if (/^(税別|外税|税抜)\s*$/.test(line)) return { type: 'flag', taxIncluded: false };

    // 宛名（行全体）：数字を含まず 様/さん/御中 で終わる
    var mClient = line.match(/^(.{1,30}?)(様|さま|さん|御中)$/);
    if (mClient && !/\d/.test(line)) {
      return { type: 'client', client: trimName(mClient[1]), honorific: mClient[2] === '御中' ? '御中' : '様' };
    }

    // 行頭の宛名＋残り（例：「田中様 作業一式 30000」）
    var rest = line;
    var inlineClient = null, inlineHonorific = null;
    var mInline = line.match(/^(\S{1,20}?)(様|さま|さん|御中)[\s,、]+(.+)$/);
    if (mInline && !/\d/.test(mInline[1])) {
      inlineClient = trimName(mInline[1]);
      inlineHonorific = mInline[2] === '御中' ? '御中' : '様';
      rest = mInline[3].trim();
    }

    var reduced = /※?\s*軽減|\(軽減\)|（軽減）/.test(rest);
    rest = rest.replace(/※?\s*軽減(?:税率)?|\(軽減\)|（軽減）/g, '').trim();

    var discount = /値引|割引/.test(rest);
    var item = parseItemBody(rest, discount, reduced);
    if (item) {
      var out = { type: 'item', item: item };
      if (inlineClient) { out.client = inlineClient; out.honorific = inlineHonorific; }
      return out;
    }

    // 数字なし → 金額未定の品目（聞き返し対象）
    var res = { type: 'item', item: { name: trimName(rest), qty: 1, unit: '', unitPrice: null, amount: null, reduced: reduced } };
    if (inlineClient) { res.client = inlineClient; res.honorific = inlineHonorific; }
    return res;
  }

  /** 品目本体の解析（宛名・軽減フラグ除去済みの文字列を受け取る） */
  function parseItemBody(rest, discount, reduced) {
    var m, name, qty, unit, unitPrice, amount;
    var sign = discount ? -1 : 1;

    // A) 品名 数量 単位 [で] 金額 [ずつ|各]
    m = rest.match(new RegExp('^(.+?)\\s*(\\d+(?:\\.\\d+)?)\\s*(' + UNITS + ')\\s*(で\\s*)?(\\d+)\\s*円?\\s*(ずつ|各)?\\s*$'));
    if (m) {
      name = trimName(m[1]); qty = parseFloat(m[2]); unit = m[3];
      var n = parseInt(m[5], 10);
      if (m[4]) { amount = n; unitPrice = qty ? Math.round(n / qty) : n; }
      else { unitPrice = n; amount = Math.round(qty * unitPrice); }
      return mk(name, qty, unit, unitPrice, sign * amount, reduced);
    }

    // B) 品名 金額 ずつ|各 数量 単位
    m = rest.match(new RegExp('^(.+?)\\s*(\\d+)\\s*円?\\s*(?:ずつ|各)\\s*(\\d+(?:\\.\\d+)?)\\s*(' + UNITS + ')?\\s*$'));
    if (m) {
      name = trimName(m[1]); unitPrice = parseInt(m[2], 10); qty = parseFloat(m[3]); unit = m[4] || '';
      return mk(name, qty, unit, unitPrice, sign * Math.round(qty * unitPrice), reduced);
    }

    // C) 品名 数量 x 単価
    m = rest.match(/^(.+?)\s*(\d+(?:\.\d+)?)\s*x\s*(\d+)\s*円?\s*$/);
    if (m) {
      name = trimName(m[1]); qty = parseFloat(m[2]); unitPrice = parseInt(m[3], 10);
      return mk(name, qty, '', unitPrice, sign * Math.round(qty * unitPrice), reduced);
    }

    // D) 品名 数量 単位（金額なし→聞き返し）
    m = rest.match(new RegExp('^(.+?)\\s*(\\d+(?:\\.\\d+)?)\\s*(' + UNITS + ')\\s*$'));
    if (m) {
      return mk(trimName(m[1]), parseFloat(m[2]), m[3], null, null, reduced);
    }

    // E) 品名 金額（区切りあり or 品名直結の3桁以上）
    m = rest.match(/^(.+?)[\s:：]+(\d+)\s*円?\s*$/) || rest.match(/^(.+?)(\d{3,})\s*円?\s*$/);
    if (m) {
      name = trimName(m[1]); amount = parseInt(m[2], 10);
      return mk(name, 1, '', null, sign * amount, reduced);
    }

    return null;
  }

  function mk(name, qty, unit, unitPrice, amount, reduced) {
    return { name: name, qty: qty, unit: unit || '', unitPrice: unitPrice, amount: amount, reduced: !!reduced };
  }

  /** メモ全体を解析 */
  function parseMemo(text) {
    var lines = String(text || '').split(/\r?\n/);
    var result = { client: null, honorific: '様', items: [], taxIncluded: null };
    for (var i = 0; i < lines.length; i++) {
      var r = parseLine(lines[i]);
      if (r.type === 'client') { result.client = r.client; result.honorific = r.honorific; }
      else if (r.type === 'flag') { result.taxIncluded = r.taxIncluded; }
      else if (r.type === 'item') {
        if (r.client) { result.client = r.client; result.honorific = r.honorific; }
        if (r.item.name) result.items.push(r.item);
      }
    }
    return result;
  }

  /** 合計計算。taxIncluded=true なら金額は税込とみなす。税額は切り捨て */
  function computeTotals(items, taxIncluded) {
    var base10 = 0, base8 = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.amount == null) continue;
      if (it.reduced) base8 += it.amount; else base10 += it.amount;
    }
    var tax10, tax8, subtotal, total;
    if (taxIncluded) {
      tax10 = base10 - Math.floor(base10 / 1.1);
      tax8 = base8 - Math.floor(base8 / 1.08);
      total = base10 + base8;
      subtotal = total - tax10 - tax8;
    } else {
      tax10 = Math.floor(base10 * 0.10);
      tax8 = Math.floor(base8 * 0.08);
      subtotal = base10 + base8;
      total = subtotal + tax10 + tax8;
    }
    return { base10: base10, base8: base8, tax10: tax10, tax8: tax8, subtotal: subtotal, tax: tax10 + tax8, total: total };
  }

  /** 金額未定の品目一覧 */
  function unknownAmountItems(items) {
    var out = [];
    for (var i = 0; i < items.length; i++) if (items[i].amount == null) out.push(items[i].name);
    return out;
  }

  function yen(n) {
    var s = String(Math.abs(Math.round(n)));
    var out = '';
    while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (n < 0 ? '-' : '') + s + out;
  }

  /** 確認メッセージ用のテキスト（LINE返信で使用） */
  function summaryText(draft) {
    var t = computeTotals(draft.items, draft.taxIncluded === true);
    var lines = [];
    lines.push('【確認】' + (draft.client ? draft.client + ' ' + (draft.honorific || '様') : '宛名：未設定'));
    for (var i = 0; i < draft.items.length; i++) {
      var it = draft.items[i];
      var qtyPart = (it.qty !== 1 || it.unit) ? ' ' + it.qty + (it.unit || '') : '';
      var pricePart = it.amount == null ? ' 金額未定'
        : (it.unitPrice != null ? ' @' + yen(it.unitPrice) + ' = ¥' + yen(it.amount) : ' ¥' + yen(it.amount));
      lines.push('・' + it.name + qtyPart + pricePart + (it.reduced ? '（軽減8%）' : ''));
    }
    lines.push('小計 ¥' + yen(t.subtotal) + ' ／ 消費税 ¥' + yen(t.tax) + ' ／ 合計 ¥' + yen(t.total)
      + (draft.taxIncluded === true ? '（税込入力）' : ''));
    return lines.join('\n');
  }

  return {
    normalize: normalize,
    parseLine: parseLine,
    parseMemo: parseMemo,
    computeTotals: computeTotals,
    unknownAmountItems: unknownAmountItems,
    summaryText: summaryText,
    yen: yen
  };
})();

if (typeof module !== 'undefined') { module.exports = RakuParser; }
