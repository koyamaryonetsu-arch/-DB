/**
 * LINEトーク履歴（Googleドライブのスプレッドシート）から 劇場情報 を自動更新
 *
 * 役割: 毎日1回、LINEのトーク履歴スプレッドシートの「前回以降に増えた行」だけを読み、
 *       劇場情報（設備・持病・備考・支配人・劇場連絡先・パートナー連絡先）の
 *       「新しい事実」をAIで抽出して反映する。メール取込(TheaterInfo.gs)と同じ判定・同じ反映先。
 *         - 確信度 TI_AUTO_CONF(70%)以上 → theaters / theater_contacts へ自動反映（追記のみ）
 *         - 70%未満 → 要確認キュー(theater_info_pending) → アプリ「🔎 劇場情報更新確認」で承認
 *
 * 対象スプレッドシートの探し方（上から順に試す）:
 *   1. スクリプトプロパティ LINE_LOG_SHEET_ID にIDを設定（複数ある場合はカンマ区切り）→ それを使う
 *   2. 未設定なら、既定の LT_DEFAULT_SHEET_ID（シネマPJのLINEトーク履歴）を使う
 *   3. それも開けなければ、Driveから名前に「LINE」「ライン」「トーク」を含むスプレッドシートを自動検索
 *
 * 列の並びは問いません（1行ぶんのセルを連結して文章として読みます）。
 * 初回は直近 LT_FIRST_RUN_ROWS 行だけを読み、以降は増えたぶんだけを読みます（過去全部は遡りません）。
 *
 * ※ TheaterInfo.gs / Code.gs と同じプロジェクトに置く
 *    （extractTheaterInfo_ / routeTheaterItem_ / tiTheaterExists_ / normalizeCompany_ / cfg_ を流用）。
 * ※ 有効化: 本ファイルを貼付 → setupLineTalkTrigger() を1回実行（毎日AM2時トリガー作成）。
 */

// 既定の対象スプレッドシート（シネマPJ LINEトーク履歴）。
// 変更したい時はスクリプトプロパティ LINE_LOG_SHEET_ID を設定すれば、そちらが優先されます。
var LT_DEFAULT_SHEET_ID = '1FJqxZbCMh-aIDCCMwGHtT3S1aqUbMXGYBoK3boJ_5Fw';

var LT_FIRST_RUN_ROWS = 300;             // 初回に読む「直近の行数」（過去全部は読まない）
var LT_MAX_ROWS_PER_RUN = 600;           // 1回の実行で読む最大行数（増えすぎた時の保険）
var LT_CHUNK_ROWS = 60;                  // AIに1回で渡す行数（会話の前後関係を保つため塊で渡す）
var LT_TIME_BUDGET_MS = 5 * 60 * 1000;   // 実行時間の目安（6分制限の手前で安全停止）
var LT_MAX_CELL = 300;                   // 1セルの最大文字数（長文は丸める）
// シネコン設備に関係しそうな語。1つも含まれない塊はAIに渡さない（コスト削減）
var LT_KEYWORDS = ['劇場', 'シネマ', 'TOHO', 'ＴＯＨＯ', '109', 'ユナイテッド', 'MOVIX', 'サンシャイン',
  'コロナ', 'イオンシネマ', '空調', 'チラー', 'GHP', 'EHP', 'ＧＨＰ', 'ＥＨＰ', '熱源', '室外機', '室内機',
  '冷房', '暖房', '換気', 'ダクト', 'フィルタ', 'ポンプ', '故障', '修理', '点検', '更新', '支配人',
  'スクリーン', 'シアター', 'ロビー', '映写'];

// ===== メイン（毎日AM2時トリガー） =====
function updateTheaterInfoFromLine() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var apiKey = cfg_('ANTHROPIC_API_KEY');
    var svcKey = cfg_('SUPABASE_SERVICE_ROLE_KEY');
    if (!apiKey || !svcKey) { Logger.log('LINE劇場情報: キー未設定'); return; }

    var files = ltFindSpreadsheets_();
    if (!files.length) {
      Logger.log('LINE劇場情報: 対象スプレッドシートが見つかりません。'
        + 'スクリプトプロパティ LINE_LOG_SHEET_ID にファイルIDを設定してください。');
      return;
    }
    var startMs = Date.now();
    var nAuto = 0, nPend = 0, nSkip = 0, nRows = 0, nChunk = 0;

    for (var f = 0; f < files.length; f++) {
      if (Date.now() - startMs > LT_TIME_BUDGET_MS) { Logger.log('時間上限のため中断（残りは次回）'); break; }
      var ss;
      try { ss = SpreadsheetApp.openById(files[f].id); }
      catch (e) { Logger.log('開けません(' + files[f].name + '): ' + e); continue; }
      var sheets = ss.getSheets();
      for (var si = 0; si < sheets.length; si++) {
        if (Date.now() - startMs > LT_TIME_BUDGET_MS) break;
        var sh = sheets[si];
        var got = ltReadNewRows_(ss.getId(), sh);
        if (!got.lines.length) continue;
        nRows += got.lines.length;

        // 会話の前後関係が分かるよう、まとまり（塊）ごとにAIへ渡す
        for (var i = 0; i < got.lines.length; i += LT_CHUNK_ROWS) {
          if (Date.now() - startMs > LT_TIME_BUDGET_MS) { Logger.log('時間上限のため中断（残りは次回）'); break; }
          var chunk = got.lines.slice(i, i + LT_CHUNK_ROWS);
          var text = ltChunkToText_(ss.getName(), sh.getName(), chunk);
          if (!ltHasKeyword_(text)) { nSkip++; continue; }   // 設備に無関係な雑談はAIに渡さない
          nChunk++;
          try {
            var ext = extractTheaterInfo_(apiKey, text, null);
            if (ext && ext.items && ext.items.length && ext.theater) {
              var theater = ext.theater;
              var company = ext.company ? normalizeCompany_(ext.company) : '';
              var known = tiTheaterExists_(theater);
              ext.items.forEach(function (it) {
                var r = routeTheaterItem_(it, theater, company, known);
                if (r === 'auto') nAuto++; else if (r === 'pending') nPend++; else nSkip++;
              });
            }
          } catch (e) {
            Logger.log('LINE劇場情報 抽出エラー: ' + e);
          }
        }
        // ここまで読んだ位置を記録（次回はこの続きから）
        ltSavePos_(ss.getId(), sh.getName(), got.lastRow);
      }
    }
    Logger.log('LINE劇場情報: 読取 %s 行 / AI判定 %s 塊 / 自動反映 %s / 要確認 %s / スキップ %s',
      nRows, nChunk, nAuto, nPend, nSkip);
  } catch (e) {
    Logger.log('updateTheaterInfoFromLine error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

// ===== 対象スプレッドシートを決める =====
// 1) LINE_LOG_SHEET_ID（カンマ区切り可）→ 2) 名前で自動検索
function ltFindSpreadsheets_() {
  var out = [], seen = {};
  var ids = cfg_('LINE_LOG_SHEET_ID', '');
  if (ids) {
    ids.split(',').forEach(function (s) {
      var id = String(s || '').trim();
      if (!id || seen[id]) return;
      seen[id] = 1;
      var nm = id;
      try { nm = DriveApp.getFileById(id).getName(); } catch (e) {}
      out.push({ id: id, name: nm });
    });
    return out;
  }
  // 既定のトーク履歴ファイル（開ければこれを使う）
  if (LT_DEFAULT_SHEET_ID) {
    try {
      var df = DriveApp.getFileById(LT_DEFAULT_SHEET_ID);
      Logger.log('LINE劇場情報: 既定ファイルを使用 ' + df.getName());
      return [{ id: LT_DEFAULT_SHEET_ID, name: df.getName() }];
    } catch (e) {
      Logger.log('既定ファイルを開けませんでした（名前で自動検索します）: ' + e);
    }
  }
  var words = ['LINE', 'ライン', 'トーク'];
  for (var w = 0; w < words.length; w++) {
    var q = "mimeType = 'application/vnd.google-apps.spreadsheet' and title contains '" + words[w] + "'";
    try {
      var it = DriveApp.searchFiles(q);
      while (it.hasNext()) {
        var fl = it.next();
        var id = fl.getId();
        if (seen[id]) continue;
        seen[id] = 1;
        out.push({ id: id, name: fl.getName() });
        if (out.length >= 5) break;   // 誤検出で大量に拾わないよう上限
      }
    } catch (e) { Logger.log('Drive検索エラー(' + words[w] + '): ' + e); }
    if (out.length >= 5) break;
  }
  if (out.length) Logger.log('LINE劇場情報: 対象 ' + out.map(function (x) { return x.name; }).join(' / '));
  return out;
}

// ===== 前回以降に増えた行だけを読む =====
function ltPosKey_(ssId, sheetName) { return 'LT_POS_' + ssId + '_' + sheetName; }
function ltSavePos_(ssId, sheetName, lastRow) {
  PropertiesService.getScriptProperties().setProperty(ltPosKey_(ssId, sheetName), String(lastRow));
}
function ltReadNewRows_(ssId, sh) {
  var empty = { lines: [], lastRow: 0 };
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return empty;

  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty(ltPosKey_(ssId, sh.getName()));
  var from;
  if (saved === null) {
    // 初回: 過去全部は読まず、直近ぶんだけ（以降は増えたぶんだけ）
    from = Math.max(1, lastRow - LT_FIRST_RUN_ROWS + 1);
  } else {
    from = Number(saved) + 1;
    if (!(from >= 1)) from = 1;
  }
  if (from > lastRow) { return { lines: [], lastRow: lastRow }; }
  // 増えすぎている時は新しい方を優先（古い分は読み飛ばす）
  if (lastRow - from + 1 > LT_MAX_ROWS_PER_RUN) from = lastRow - LT_MAX_ROWS_PER_RUN + 1;

  var values = sh.getRange(from, 1, lastRow - from + 1, lastCol).getValues();
  var lines = [];
  for (var r = 0; r < values.length; r++) {
    var line = ltRowToLine_(values[r]);
    if (line) lines.push(line);
  }
  return { lines: lines, lastRow: lastRow };
}
// 1行ぶんのセルを「日時 名前 発言」のような1行テキストに（列の並びは問わない）
function ltRowToLine_(row) {
  var parts = [];
  for (var i = 0; i < row.length; i++) {
    var v = row[i];
    if (v === null || v === undefined || v === '') continue;
    if (Object.prototype.toString.call(v) === '[object Date]') {
      parts.push(Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'));
    } else {
      var s = String(v).replace(/\s+/g, ' ').trim();
      if (!s) continue;
      if (s.length > LT_MAX_CELL) s = s.slice(0, LT_MAX_CELL) + '…';
      parts.push(s);
    }
  }
  return parts.join(' ');
}
function ltChunkToText_(ssName, sheetName, lines) {
  return [
    '# LINEトーク履歴（' + ssName + ' / ' + sheetName + '）',
    '※ 1行が1発言です。設備・劇場に関する「新しい事実」だけを拾ってください。',
    '※ 雑談・案件の進捗連絡・日程調整は対象外です。',
    '',
    lines.join('\n')
  ].join('\n');
}
function ltHasKeyword_(text) {
  for (var i = 0; i < LT_KEYWORDS.length; i++) {
    if (text.indexOf(LT_KEYWORDS[i]) !== -1) return true;
  }
  return false;
}

// ===== セットアップ =====
// 毎日AM2時にLINEトーク履歴を読む（メール側は AM1時 の updateTheaterInfoDaily）
function setupLineTalkTrigger() {
  var fn = 'updateTheaterInfoFromLine';
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger(fn).timeBased().atHour(2).everyDays(1).create();
  Logger.log('LINEトーク履歴の毎日AM2時トリガーを作成しました。');
}
// 手動で1回だけ実行（動作確認用）
function testLineTalkOnce() { updateTheaterInfoFromLine(); }
// 読み取り位置をリセット（もう一度読み直したい時だけ実行）
function resetLineTalkPositions() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var n = 0;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('LT_POS_') === 0) { props.deleteProperty(k); n++; }
  });
  Logger.log('LINEトーク履歴の読み取り位置を ' + n + ' 件クリアしました（次回は直近ぶんから読み直します）。');
}
// 対象スプレッドシートの候補を確認する（設定の確認用）
function showLineTalkSources() {
  var files = ltFindSpreadsheets_();
  if (!files.length) { Logger.log('対象が見つかりません。LINE_LOG_SHEET_ID を設定してください。'); return; }
  files.forEach(function (f) { Logger.log('・' + f.name + '  (ID: ' + f.id + ')'); });
}
