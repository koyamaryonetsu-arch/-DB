/** 帳票生成：テンプレシートに値を流し込み → PDF化 → Driveリンク → 台帳記録 */

var SHEET_CONFIG = '設定';
var SHEET_LEDGER = '台帳';
var TEMPLATE_QUOTE = 'T_見積書';
var TEMPLATE_INVOICE = 'T_請求書';
var OUTPUT_SHEET = '_出力';
var PDF_FOLDER = '発行帳票（ラクミツ）';

/** テンプレの固定レイアウト（行・列を追加しない前提。書式の変更は自由） */
var LAYOUT = {
  TITLE: 'A1',
  NUMBER_LABEL: 'E3', NUMBER: 'F3',
  DATE_LABEL: 'E4', DATE: 'F4',
  CLIENT: 'A6',
  ISSUER_NAME: 'E6', ISSUER_ADDR: 'E7', ISSUER_CONTACT: 'E8', ISSUER_REG: 'E9',
  TOTAL_BOX_LABEL: 'A9', TOTAL_BOX: 'B9',
  HEADER_ROW: 11,
  ITEM_START: 12, ITEM_ROWS: 10,
  SUBTOTAL_ROW: 23, TAX10_ROW: 24, TAX8_ROW: 25, TOTAL_ROW: 26,
  NOTE_LABEL_ROW: 28, NOTE_ROW: 29
};

function getConfig_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
  var out = {};
  if (!sh) return out;
  var values = sh.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (k) out[k] = String(values[i][1] || '').trim();
  }
  return out;
}

function configSummaryText_() {
  var c = getConfig_();
  var lines = ['【設定の現在値】（スプレッドシートの「設定」タブで編集できます）'];
  ['事業者名', 'インボイス登録番号', '住所', '電話', 'メール', '振込先', '見積有効期限（日）', '支払期限（日）'].forEach(function (k) {
    lines.push('・' + k + '：' + (c[k] || '（未設定）'));
  });
  if (!/^T\d{13}$/.test(c['インボイス登録番号'] || '')) {
    lines.push('', '⚠️ インボイス登録番号は「T＋13桁の数字」です。適格請求書には必須です（税務の個別判断はできません。不明点は税理士へ）。');
  }
  return lines.join('\n');
}

function nextNumber_(type) {
  var prefix = type === 'invoice' ? 'R' : 'M';
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LEDGER);
  var count = 0;
  if (sh) {
    var values = sh.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var num = String(values[i][2] || '');
      if (num.indexOf(prefix + today) === 0) count++;
    }
  }
  var nn = String(count + 1);
  if (nn.length < 2) nn = '0' + nn;
  return prefix + today + '-' + nn;
}

/** 帳票を発行して {url, number, totals, warnings} を返す */
function issueDocument_(type, draft) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = getConfig_();
  var totals = RakuParser.computeTotals(draft.items, draft.taxIncluded === true);
  var isInvoice = type === 'invoice';
  var label = isInvoice ? '請求書' : '見積書';

  // インボイス記載要件・体裁の形式チェック（税務判断はしない）
  var warnings = [];
  if (!config['事業者名']) warnings.push('設定タブの「事業者名」が未設定です');
  if (!draft.client) warnings.push('宛名が未設定です（記載要件：交付を受ける者の氏名/名称）');
  if (isInvoice && !/^T\d{13}$/.test(config['インボイス登録番号'] || '')) {
    warnings.push('インボイス登録番号（T＋13桁）が未設定/形式不正のため、適格請求書の要件を満たしません');
  }
  if (isInvoice && !config['振込先']) warnings.push('設定タブの「振込先」が未設定です');

  var templateName = isInvoice ? TEMPLATE_INVOICE : TEMPLATE_QUOTE;
  var template = ss.getSheetByName(templateName);
  if (!template) throw new Error('テンプレート「' + templateName + '」がありません。メニュー「ラクミツ」→「初期セットアップ」を実行してください');

  var old = ss.getSheetByName(OUTPUT_SHEET);
  if (old) ss.deleteSheet(old);
  var sh = template.copyTo(ss).setName(OUTPUT_SHEET);

  var number = nextNumber_(type);
  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy年M月d日');

  sh.getRange(LAYOUT.NUMBER).setValue(number);
  sh.getRange(LAYOUT.DATE).setValue(dateStr);
  sh.getRange(LAYOUT.CLIENT).setValue((draft.client || '') + ' ' + (draft.client ? (draft.honorific || '様') : ''));
  sh.getRange(LAYOUT.ISSUER_NAME).setValue(config['事業者名'] || '');
  sh.getRange(LAYOUT.ISSUER_ADDR).setValue(config['住所'] || '');
  sh.getRange(LAYOUT.ISSUER_CONTACT).setValue([config['電話'], config['メール']].filter(String).join(' / '));
  sh.getRange(LAYOUT.ISSUER_REG).setValue(config['インボイス登録番号'] ? '登録番号：' + config['インボイス登録番号'] : '');
  sh.getRange(LAYOUT.TOTAL_BOX).setValue('¥' + RakuParser.yen(totals.total) + '－（税込）');

  // 明細（最大 ITEM_ROWS 行。超過分は警告）
  var items = draft.items;
  if (items.length > LAYOUT.ITEM_ROWS) {
    warnings.push('明細が' + items.length + '行あり、' + LAYOUT.ITEM_ROWS + '行を超えた分は記載されていません');
    items = items.slice(0, LAYOUT.ITEM_ROWS);
  }
  var rows = [];
  for (var i = 0; i < LAYOUT.ITEM_ROWS; i++) {
    var it = items[i];
    if (it) {
      rows.push([i + 1, it.name + (it.reduced ? ' ※' : ''), it.qty, it.unit || '',
        it.unitPrice != null ? it.unitPrice : '', it.amount, it.reduced ? '8%' : '10%']);
    } else {
      rows.push(['', '', '', '', '', '', '']);
    }
  }
  sh.getRange(LAYOUT.ITEM_START, 1, LAYOUT.ITEM_ROWS, 7).setValues(rows);

  sh.getRange(LAYOUT.SUBTOTAL_ROW, 7).setValue(totals.subtotal);
  sh.getRange(LAYOUT.TAX10_ROW, 6).setValue('消費税（10%対象 ¥' + RakuParser.yen(totals.base10) + '）');
  sh.getRange(LAYOUT.TAX10_ROW, 7).setValue(totals.tax10);
  sh.getRange(LAYOUT.TAX8_ROW, 6).setValue('消費税（8%対象 ¥' + RakuParser.yen(totals.base8) + '）');
  sh.getRange(LAYOUT.TAX8_ROW, 7).setValue(totals.tax8);
  sh.getRange(LAYOUT.TOTAL_ROW, 7).setValue(totals.total);

  // 備考
  var notes = [];
  if (isInvoice) {
    var payDays = parseInt(config['支払期限（日）'] || '30', 10);
    var due = Utilities.formatDate(new Date(now.getTime() + payDays * 86400000), 'Asia/Tokyo', 'yyyy年M月d日');
    notes.push('お支払期限：' + due);
    if (config['振込先']) notes.push('お振込先：' + config['振込先'] + '（恐れ入りますが振込手数料はご負担ください）');
  } else {
    var validDays = parseInt(config['見積有効期限（日）'] || '30', 10);
    var until = Utilities.formatDate(new Date(now.getTime() + validDays * 86400000), 'Asia/Tokyo', 'yyyy年M月d日');
    notes.push('お見積有効期限：' + until);
  }
  if (totals.base8 > 0) notes.push('※印は軽減税率（8%）対象です。');
  if (config['備考']) notes.push(config['備考']);
  sh.getRange(LAYOUT.NOTE_ROW, 1).setValue(notes.join('\n'));

  SpreadsheetApp.flush();

  // PDF出力 → Drive保存 → 共有リンク
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export'
    + '?format=pdf&gid=' + sh.getSheetId()
    + '&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&gridlines=false'
    + '&top_margin=0.60&bottom_margin=0.60&left_margin=0.60&right_margin=0.60';
  var blob = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  }).getBlob().setName(label + '_' + (draft.client || '宛名未設定') + '_' + number + '.pdf');

  var folders = DriveApp.getFoldersByName(PDF_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PDF_FOLDER);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  ss.deleteSheet(sh);

  var ledger = ss.getSheetByName(SHEET_LEDGER);
  if (ledger) {
    ledger.appendRow([now, label, number, draft.client || '', totals.total, file.getUrl(), '']);
  }

  return { url: file.getUrl(), number: number, totals: totals, warnings: warnings };
}
