/** 初期セットアップ：シート雛形（設定・台帳・テンプレ2種）を自動生成 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ラクミツ')
    .addItem('初期セットアップ（シート作成）', 'initialSetup')
    .addItem('解析テスト（ログ出力）', 'testParse')
    .addToUi();
}

function initialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 設定
  if (!ss.getSheetByName(SHEET_CONFIG)) {
    var conf = ss.insertSheet(SHEET_CONFIG);
    conf.getRange(1, 1, 1, 3).setValues([['項目', '値', 'メモ']]).setFontWeight('bold').setBackground('#EFEFEF');
    conf.getRange(2, 1, 10, 3).setValues([
      ['事業者名', '', '例：ラク運送（屋号でOK）'],
      ['インボイス登録番号', '', 'T＋13桁。適格請求書に必須。未登録なら空欄のまま'],
      ['住所', '', '例：〒100-0001 東京都千代田区…'],
      ['電話', '', ''],
      ['メール', '', ''],
      ['振込先', '', '例：◯◯銀行 ◯◯支店 普通 1234567 ヤマダタロウ'],
      ['見積有効期限（日）', '30', '発行日からの日数'],
      ['支払期限（日）', '30', '発行日からの日数'],
      ['備考', '', '帳票の備考欄に毎回入れる文言（任意）'],
      ['税表示', '税別', '「税別」＝入力金額に消費税を加算（既定）／LINEで「税込」と送れば都度変更可']
    ]);
    conf.setColumnWidth(1, 160).setColumnWidth(2, 260).setColumnWidth(3, 320);
  }

  // 台帳
  if (!ss.getSheetByName(SHEET_LEDGER)) {
    var led = ss.insertSheet(SHEET_LEDGER);
    led.getRange(1, 1, 1, 7).setValues([['発行日時', '種別', '番号', '宛名', '合計（税込）', 'PDFリンク', 'メモ']])
      .setFontWeight('bold').setBackground('#EFEFEF');
    led.setColumnWidth(4, 140).setColumnWidth(6, 320);
  }

  buildTemplate_(TEMPLATE_QUOTE, '御 見 積 書');
  buildTemplate_(TEMPLATE_INVOICE, '御 請 求 書');
  getStateSheet_(); // _状態

  var first = ss.getSheets()[0];
  if (first.getName() === 'シート1' && first.getLastRow() === 0) ss.deleteSheet(first);

  SpreadsheetApp.getUi().alert('セットアップ完了。「設定」タブに事業者情報を入力してください。\nテンプレ（T_見積書 / T_請求書）は色やフォントを自由に変えてOKですが、行や列の追加・削除はしないでください。');
}

function buildTemplate_(name, title) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(name)) return;
  var sh = ss.insertSheet(name);

  var widths = [36, 230, 55, 55, 95, 105, 55];
  for (var c = 0; c < widths.length; c++) sh.setColumnWidth(c + 1, widths[c]);

  sh.getRange('A1:G1').merge().setValue(title)
    .setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A2:G2').merge();

  sh.getRange(LAYOUT.NUMBER_LABEL).setValue('番号');
  sh.getRange(LAYOUT.DATE_LABEL).setValue('発行日');
  sh.getRange('E3:E4').setFontColor('#666666').setHorizontalAlignment('right');
  sh.getRange('F3:G3').merge().setHorizontalAlignment('right');
  sh.getRange('F4:G4').merge().setHorizontalAlignment('right');

  sh.getRange('A6:C6').merge().setFontSize(13).setFontWeight('bold');
  sh.getRange('A7:C7').merge().setBorder(false, false, true, false, false, false);

  sh.getRange('E6:G6').merge().setFontWeight('bold');
  sh.getRange('E7:G7').merge();
  sh.getRange('E8:G8').merge();
  sh.getRange('E9:G9').merge();
  sh.getRange('E6:G9').setFontSize(9).setWrap(true);

  sh.getRange(LAYOUT.TOTAL_BOX_LABEL).setValue('合計金額').setFontWeight('bold');
  sh.getRange('B9:C9').merge().setFontSize(14).setFontWeight('bold')
    .setBorder(false, false, true, false, false, false);

  var header = ['No', '品名', '数量', '単位', '単価', '金額', '税率'];
  sh.getRange(LAYOUT.HEADER_ROW, 1, 1, 7).setValues([header])
    .setFontWeight('bold').setBackground('#EFEFEF').setHorizontalAlignment('center');
  var table = sh.getRange(LAYOUT.HEADER_ROW, 1, 1 + LAYOUT.ITEM_ROWS, 7);
  table.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(LAYOUT.ITEM_START, 3, LAYOUT.ITEM_ROWS, 1).setHorizontalAlignment('center');
  sh.getRange(LAYOUT.ITEM_START, 4, LAYOUT.ITEM_ROWS, 1).setHorizontalAlignment('center');
  sh.getRange(LAYOUT.ITEM_START, 7, LAYOUT.ITEM_ROWS, 1).setHorizontalAlignment('center');
  sh.getRange(LAYOUT.ITEM_START, 5, LAYOUT.ITEM_ROWS, 2).setNumberFormat('¥#,##0');

  sh.getRange(LAYOUT.SUBTOTAL_ROW, 6).setValue('小計');
  sh.getRange(LAYOUT.TOTAL_ROW, 6).setValue('合計（税込）').setFontWeight('bold');
  sh.getRange(LAYOUT.SUBTOTAL_ROW, 6, 4, 1).setHorizontalAlignment('right');
  sh.getRange(LAYOUT.SUBTOTAL_ROW, 7, 4, 1).setNumberFormat('¥#,##0');
  sh.getRange(LAYOUT.TOTAL_ROW, 6, 1, 2).setBorder(true, false, true, false, false, false)
    .setFontWeight('bold');

  sh.getRange(LAYOUT.NOTE_LABEL_ROW, 1).setValue('備考').setFontWeight('bold');
  sh.getRange(LAYOUT.NOTE_ROW, 1, 4, 7).merge().setWrap(true).setVerticalAlignment('top')
    .setBorder(true, true, true, true, false, false, '#999999', SpreadsheetApp.BorderStyle.SOLID);

  sh.setHiddenGridlines(true);
}

/** LINEなしで解析〜合計を確認するテスト（GASエディタから実行） */
function testParse() {
  var memo = '田中様\nエアコンクリーニング 2台 15000ずつ\n出張費 3000\n値引き 2000';
  var draft = RakuParser.parseMemo(memo);
  console.log(RakuParser.summaryText(draft));
  console.log(JSON.stringify(RakuParser.computeTotals(draft.items, false)));
}
