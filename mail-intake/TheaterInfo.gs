/**
 * 劇場情報 自動更新（cinema-cases / Supabase）
 *
 * 役割: 毎日AM1時に前日分のシネコン関連メール（本文＋添付＝点検報告書・機器台帳・図面・見積書・
 *       名刺等。画像/PDFは視覚AIで、Excel/WordはDrive変換でテキスト化して）読み、各劇場情報
 *       （設備・持病・備考・支配人・劇場連絡先・パートナー連絡先）の「新しい事実」をAIで抽出する。
 * ※ Excel/Word読取には「Drive」高度サービス(Drive API v2)の有効化が必要（appsscript.jsonに記載）。
 *   - 拾った候補はすべて「劇場情報更新確認」(theater_info_pending) に入れる（読み取りは Sonnet 5.5）。
 *   - そのあと AI（Opus 5.5）が、その劇場の今の劇場カルテと見比べて判定する（Vercel の /api/theater-ai）:
 *       合っている新しい情報 → 劇場カルテ（theater_notes / 連絡先 / 支配人・電話）に自動で入れる
 *       重複・間違い → 除く ／ 迷うもの → 更新確認に残す（理由つき）。人が承認/却下する。
 *     判定は reviewTheaterPendingAuto()（毎日 2時台・19時台のトリガー。setupTheaterReviewTrigger() で作る）。
 *     画面の「🤖 AIでまとめて判定する」ボタンからも同じ判定ができる。
 *
 * ※ Code.gs と同じプロジェクトに置く（cfg_ / SUPABASE_URL_ / anthropicText_ / safeJson_ /
 *    buildThreadText_ / getOrCreateLabel_ / normalizeCompany_ / MODEL_ を流用）。
 * ※ 有効化: Supabaseで SETUP_THEATER_AUTOUPDATE.sql を1回実行 → 本ファイルを貼付 →
 *    setupTheaterInfoTrigger() を1回実行（毎日AM1時トリガー作成）。
 */

var TI_DONE_LABEL = '劇場情報確認済';        // 処理済みスレッド（再処理防止）
var TI_MIN_CONF = 0.2;                       // これより自信の低い候補は捨てる（ほとんど当て推量のもの）
var TI_REVIEW_BUDGET_MS = 4.5 * 60 * 1000;   // AI判定（reviewTheaterPendingAuto）の1回の時間の目安
// 劇場情報の読み取り（添付なし）に使うモデル。以前は Haiku。スクリプトプロパティ ANTHROPIC_THEATER_MODEL で変えられる
function TI_MODEL_() { return cfg_('ANTHROPIC_THEATER_MODEL', 'claude-sonnet-5-5'); }
var TI_THREAD_LIMIT = 30;                    // 1回で読むスレッド数上限
var TI_TIME_BUDGET_MS = 5 * 60 * 1000;       // 実行時間の目安（6分制限の手前で安全停止）。残りは次回処理
var TI_ATT_MAX_BYTES = 5 * 1024 * 1024;      // これより大きい添付は読まない（API上限・コスト対策）
var TI_ATT_MAX = 4;                          // 1スレッドで読む添付（画像/PDF）の最大数
// 抽出対象のシネコン関連メールを絞り込むGmailクエリ（前日〜当日分）
var TI_QUERY = '(from:(tohocinemas.co.jp OR tokyu-rec.co.jp OR unitedcinemas.co.jp OR movix.co.jp OR ' +
  'cinemasunshine.co.jp OR korona.co.jp OR aeonent.jp) OR "シネマズ" OR "ユナイテッドシネマ" OR ' +
  '"MOVIX" OR "シネマサンシャイン") newer_than:2d';

// ===== メイン（毎日AM1時トリガー） =====
function updateTheaterInfoDaily() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var apiKey = cfg_('ANTHROPIC_API_KEY');
    var svcKey = cfg_('SUPABASE_SERVICE_ROLE_KEY');
    if (!apiKey || !svcKey) { Logger.log('劇場情報更新: キー未設定'); return; }
    var lblDone = getOrCreateLabel_(TI_DONE_LABEL);
    var threads = GmailApp.search(TI_QUERY + ' -label:' + TI_DONE_LABEL, 0, TI_THREAD_LIMIT);
    if (!threads.length) { Logger.log('劇場情報更新: 対象メールなし'); return; }

    var startMs = Date.now();
    var nPend = 0, nSkip = 0, nDone = 0;
    for (var ti = 0; ti < threads.length; ti++) {
      // Apps Scriptの6分制限に達する前に安全停止（未処理はラベル無し→次回に続きから処理）
      if (Date.now() - startMs > TI_TIME_BUDGET_MS) {
        Logger.log('時間上限に近づいたため中断。残り ' + (threads.length - ti) + ' 件は次回処理します。');
        break;
      }
      var th = threads[ti];
      try {
        var text = buildThreadText_(th);
        var media = tiCollectAttachments_(th);      // 添付の見積書/報告書/台帳/図面(画像・PDF)を視覚で読む
        var officeText = tiCollectOfficeText_(th);  // 添付のExcel/Word(.xlsx/.docx)は変換してテキスト化
        var fullText = officeText ? (text + '\n\n=== 添付資料(Excel/Word)の内容 ===\n' + officeText) : text;
        var ext = extractTheaterInfo_(apiKey, fullText, media);
        if (ext && ext.items && ext.items.length) {
          var theater = ext.theater || '';
          var company = ext.company ? normalizeCompany_(ext.company) : '';
          if (theater) {
            var known = tiTheaterExists_(theater);
            ext.items.forEach(function (it) {
              var r = routeTheaterItem_(it, theater, company, known);
              if (r === 'pending') nPend++; else nSkip++;
            });
          }
        }
        th.addLabel(lblDone); nDone++; // 正常処理できたスレッドだけ処理済みにする
      } catch (e) {
        Logger.log('劇場情報更新 スレッド処理エラー: ' + e);
        th.addLabel(lblDone); nDone++; // エラーでも再処理ループを避けるため処理済みにする
      }
    }
    Logger.log('劇場情報更新: 処理 ' + nDone + ' 件 / 更新確認へ ' + nPend + '（このあと AI が判定） / スキップ ' + nSkip);
  } catch (e) {
    Logger.log('updateTheaterInfoDaily error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

// スレッドの添付（画像/PDF）を content ブロック配列にして返す（点検報告書/機器台帳/図面/見積書/名刺等）
// ※ Excel/Word(.xlsx/.docx)はそのままでは読めないためスキップ（画像・PDFのみ対応）
function tiCollectAttachments_(th) {
  var blocks = [];
  var msgs = th.getMessages();
  for (var i = 0; i < msgs.length && blocks.length < TI_ATT_MAX; i++) {
    var atts = msgs[i].getAttachments({ includeInlineImages: true, includeAttachments: true });
    for (var j = 0; j < atts.length && blocks.length < TI_ATT_MAX; j++) {
      var a = atts[j];
      var ct = String(a.getContentType() || '').toLowerCase();
      var isImg = ct.indexOf('image/') === 0;
      var isPdf = ct === 'application/pdf';
      if (!isImg && !isPdf) continue;
      if (a.getSize() > TI_ATT_MAX_BYTES) { Logger.log('添付が大きすぎ読取スキップ: ' + a.getName()); continue; }
      blocks.push(isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Utilities.base64Encode(a.getBytes()) } }
        : { type: 'image', source: { type: 'base64', media_type: normalizeImageMime_(ct), data: Utilities.base64Encode(a.getBytes()) } });
    }
  }
  return blocks;
}

// スレッドの添付のうち Excel(.xlsx/.xls) / Word(.docx/.doc) を Google 変換してテキスト化し連結
// ※ Drive 高度サービス(Drive API v2)が必要。無効な環境では黙ってスキップ（画像/PDFは別途読める）
function tiCollectOfficeText_(th) {
  var out = '', count = 0;
  var msgs = th.getMessages();
  for (var i = 0; i < msgs.length && count < 3 && out.length < 15000; i++) {
    var atts = msgs[i].getAttachments({ includeAttachments: true });
    for (var j = 0; j < atts.length && count < 3 && out.length < 15000; j++) {
      var a = atts[j];
      var t = tiExtractOfficeText_(a);
      if (t) { out += '\n【添付: ' + a.getName() + '】\n' + t + '\n'; count++; }
    }
  }
  return out;
}
// Excel/Word の Blob を Google スプレッドシート/ドキュメントに変換し、そのファイルIDを返す。
// Apps Scriptの「Drive」高度サービスが v2(Files.insert) でも v3(Files.create) でも動くよう両対応。
function tiConvertOffice_(blob, targetMime, title) {
  if (typeof Drive === 'undefined' || !Drive.Files) return null;
  // v3: Files.create（UIから追加されるDrive APIは通常v3）
  if (typeof Drive.Files.create === 'function') {
    var f3 = Drive.Files.create({ name: title, mimeType: targetMime }, blob);
    return f3 && f3.id;
  }
  // v2: Files.insert（convert:true で変換）
  if (typeof Drive.Files.insert === 'function') {
    var f2 = Drive.Files.insert({ title: title, mimeType: targetMime }, blob, { convert: true });
    return f2 && f2.id;
  }
  return null;
}
// 1つの添付が Excel/Word なら、Driveで Google スプレッドシート/ドキュメントに変換して本文テキストを返す
function tiExtractOfficeText_(a) {
  if (typeof Drive === 'undefined' || !Drive.Files) return ''; // Drive高度サービス未有効
  var name = String(a.getName() || '');
  var ct = String(a.getContentType() || '').toLowerCase();
  var isXls = ct.indexOf('spreadsheet') >= 0 || ct.indexOf('excel') >= 0 || /\.xlsx?$/i.test(name);
  var isDoc = ct.indexOf('wordprocessing') >= 0 || ct.indexOf('msword') >= 0 || /\.docx?$/i.test(name);
  if (!isXls && !isDoc) return '';
  if (a.getSize() > TI_ATT_MAX_BYTES) { Logger.log('Office添付が大きすぎスキップ: ' + name); return ''; }
  var tempId = null;
  try {
    var target = isXls ? 'application/vnd.google-apps.spreadsheet' : 'application/vnd.google-apps.document';
    tempId = tiConvertOffice_(a.copyBlob(), target, 'ti_tmp_' + name);
    if (!tempId) return '';
    var out = '';
    if (isXls) {
      var sheets = SpreadsheetApp.openById(tempId).getSheets();
      for (var s = 0; s < sheets.length && out.length < 12000; s++) {
        var vals = sheets[s].getDataRange().getValues();
        out += '［シート:' + sheets[s].getName() + '］\n';
        for (var r = 0; r < vals.length && out.length < 12000; r++) {
          var line = vals[r].join('\t').replace(/\t+$/, '');
          if (line.replace(/\t/g, '').trim()) out += line + '\n';
        }
      }
    } else {
      out = DocumentApp.openById(tempId).getBody().getText();
    }
    return String(out).slice(0, 12000);
  } catch (e) {
    Logger.log('Office変換読取失敗(' + name + '): ' + e);
    return '';
  } finally {
    if (tempId) { try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e2) {} }
  }
}

// ===== Claude: メール本文＋添付から劇場情報の新事実を抽出 =====
// aiOpts（任意）: { model, effort } … LINE・Plaud は Sonnet 5.5 で読む（Conversations.gs）
function extractTheaterInfo_(apiKey, text, mediaBlocks, aiOpts) {
  var sys = [
    'あなたはシネコン設備の保守/工事会社のデータ整理担当です。メール本文と添付資料（点検報告書・機器台帳・',
    '図面・見積書・名刺など）を読み、劇場設備台帳に追記すべき「新しい事実」だけをJSONで出力（前後に文章なし）。',
    '案件の進捗のような一時的な連絡は対象外（別システムが担当）。',
    '対象は「特定の映画館(劇場)」に関する次の事実のみ:',
    '- 設備(equipment): 機種/型式/系統構成/更新工事の履歴（添付の台帳・報告書・図面の記載も活用）',
    '- 持病(chronic_issues): 繰り返す不具合・慢性トラブル',
    '- 備考(info_note): 運用上の注意（施設管理会社・作業申請ルール等）',
    '- 支配人(manager): 支配人名（交代が読み取れた場合）',
    '- 劇場連絡先(theater_phone): 劇場の電話番号',
    '- パートナー連絡先(contact): 業者の会社/担当者/電話/メール（署名・名刺から）',
    '劇場名は正式表記に寄せる（例「TOHOシネマズ 新宿」「109シネマズ 川崎」「ユナイテッドシネマ新座」）。',
    '各itemに confidence(0〜1) と evidence(根拠: 件名/署名/資料名の要約、60字以内) と source_date(YYYY-MM) を付ける。',
    '推測・創作は禁止。メール・添付から確実に読み取れるものだけ。無ければ items は空配列。',
    'スキーマ: {"theater":string,"company":string,"items":[{',
    '  "kind":"field"|"contact",',
    '  "field":"equipment"|"chronic_issues"|"info_note"|"manager"|"theater_phone",  // kind=fieldのみ',
    '  "value":string,  // kind=fieldの内容',
    '  "category":string,"maker":string,"vendor":string,"person":string,"phone":string,"email":string,"note":string, // kind=contact',
    '  "confidence":number,"evidence":string,"source_date":string}]}'
  ].join('\n');
  // 添付が無ければ TI_MODEL_（既定 Sonnet 5.5）。添付ありは視覚対応モデル(既定Sonnet)で本文＋画像/PDFを読む
  if (!mediaBlocks || !mediaBlocks.length) {
    // 抽出項目が多いと1200では途中で切れることがあるため余裕を持たせる
    return safeJson_(anthropicText_(apiKey, sys, text, 2000, aiOpts || { model: TI_MODEL_(), effort: 'low' }));
  }
  var content = [{ type: 'text', text: text }].concat(mediaBlocks);
  // 呼び方は Code.gs の anthropicText_ に任せる（最新モデルの「考えた内容」を飛ばして答えを読む・
  // 上限に余裕・断られた時の自動切替・使えない時のやり直し）
  var txt = anthropicText_(apiKey, sys, content, 2000, { model: OCR_MODEL_(), effort: 'low' });
  if (!txt) { Logger.log('劇場情報抽出(添付)失敗: 応答なし'); return null; }
  return safeJson_(txt);
}

// 1件を「更新確認へ入れる(pending)」か「捨てる(skip)」に振り分ける。
// 方針: 劇場カルテに入れるかどうかは、AI（Opus）がその劇場の今のカルテと見比べて決める（/api/theater-ai）。
// ここでは形の正しい候補を更新確認に入れるだけ（同じ候補は二重に入れない）。
function routeTheaterItem_(it, theater, company, theaterKnown) {
  if (!it || !it.kind || !theater) return 'skip';
  var conf = (typeof it.confidence === 'number') ? it.confidence : 0;
  if (conf < TI_MIN_CONF) return 'skip';
  if (it.kind === 'contact') {
    if (!it.vendor) return 'skip';
    return tiQueuePending_(theater, company, it) ? 'pending' : 'skip';
  }
  var validFields = { equipment: 1, chronic_issues: 1, info_note: 1, manager: 1, theater_phone: 1 };
  if (!validFields[it.field] || !it.value) return 'skip';
  return tiQueuePending_(theater, company, it) ? 'pending' : 'skip';
}

// ===== 更新確認へ入れる（同じ候補が既にあれば入れない） =====
function tiQueuePending_(theater, company, it) {
  if (tiPendingExists_(theater, it)) return true; // 既にキュー/承認済み → 重複投入しない
  var body = {
    kind: it.kind || 'field', company: company || '', theater: theater,
    field: it.field || '', value: it.value || '',
    category: it.category || '', maker: it.maker || '', vendor: it.vendor || '',
    person: it.person || '', phone: it.phone || '', email: it.email || '', note: it.note || '',
    evidence: it.evidence || '', source_date: it.source_date || '',
    confidence: (typeof it.confidence === 'number') ? it.confidence : 0, status: 'pending'
  };
  return tiSupaInsert_('theater_info_pending', body);
}

// ===== Supabase REST 小物 =====
function tiHeaders_() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  return { apikey: key, Authorization: 'Bearer ' + key };
}
function tiTheaterExists_(theater) {
  var res = tiSupaGet_('theaters', 'name=eq.' + encodeURIComponent(theater) + '&select=name&limit=1');
  if (res && res.length) return true;
  var c = tiSupaGet_('theater_contacts', 'theater=eq.' + encodeURIComponent(theater) + '&select=id&limit=1');
  return !!(c && c.length);
}
function tiPendingExists_(theater, it) {
  // 一度 除いた（rejected）候補も入れない（同じ話が別のメールに出ても、AI に何度も見せない）
  var q = 'theater=eq.' + encodeURIComponent(theater) + '&status=in.(pending,approved,rejected)&select=id&limit=1';
  if (it.kind === 'contact') {
    q += '&vendor=eq.' + encodeURIComponent(it.vendor || '') + '&person=eq.' + encodeURIComponent(it.person || '');
  } else {
    q += '&field=eq.' + encodeURIComponent(it.field || '') + '&value=eq.' + encodeURIComponent(it.value || '');
  }
  var res = tiSupaGet_('theater_info_pending', q);
  return !!(res && res.length);
}
function tiSupaGet_(table, query) {
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/' + table + '?' + query, {
    method: 'get', headers: tiHeaders_(), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('GET失敗(' + table + '): ' + res.getContentText()); return null; }
  try { return JSON.parse(res.getContentText()) || []; } catch (e) { return null; }
}
function tiSupaInsert_(table, body) {
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/' + table, {
    method: 'post', contentType: 'application/json',
    headers: Object.assign({ Prefer: 'return=minimal' }, tiHeaders_()),
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('INSERT失敗(' + table + '): ' + res.getContentText()); return false; }
  return true;
}

// ===== セットアップ補助 =====
function setupTheaterInfoTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'updateTheaterInfoDaily') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('updateTheaterInfoDaily').timeBased().atHour(1).everyDays(1).create();
  Logger.log('updateTheaterInfoDaily を毎日1時台に実行するトリガーを作成しました（スクリプトのタイムゾーンに従う）。');
}
// ===== AI（Opus）の判定: 更新確認に溜まった候補を、劇場カルテと見比べて自動で振り分ける =====
// Vercel の /api/theater-ai（task=review）を、1劇場ずつくり返し呼ぶ（1回の呼び出しを短くするため）。
// 認証は x-flush-key（SUPABASE_SERVICE_ROLE_KEY。確認待ちのLINE通知と同じ方式）。
function reviewTheaterPendingAuto() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  var base = cfg_('APP_API_BASE', 'https://cinema-cases.vercel.app');
  if (!key) { Logger.log('劇場情報のAI判定: キー未設定'); return; }
  var start = Date.now(), sum = { add: 0, dup: 0, wrong: 0, unsure: 0, error: 0 }, calls = 0, remaining = -1, stop = '';
  while (Date.now() - start < TI_REVIEW_BUDGET_MS && calls < 40) {
    calls++;
    var res;
    try {
      res = UrlFetchApp.fetch(base + '/api/theater-ai', {
        method: 'post', contentType: 'application/json', headers: { 'x-flush-key': key },
        payload: JSON.stringify({ task: 'review', maxGroups: 1, maxItems: 15 }), muteHttpExceptions: true
      });
    } catch (e) { stop = '呼び出しが時間切れ（残りは次の回）: ' + e; break; }
    if (res.getResponseCode() >= 300) { stop = '失敗 ' + res.getResponseCode() + ': ' + String(res.getContentText()).slice(0, 200); break; }
    var j = {};
    try { j = JSON.parse(res.getContentText()); } catch (e) { stop = '答えを読めません'; break; }
    Object.keys(sum).forEach(function (k) { sum[k] += (j.tally && j.tally[k]) || 0; });
    if (j.failed && j.failed.length) Logger.log('劇場情報のAI判定で失敗: ' + j.failed.join(' / '));
    remaining = Number(j.remaining) || 0;
    if (!remaining || !j.checked) break;
  }
  var n = function (v) { return String(Math.round(Number(v) || 0)); };
  Logger.log('劇場情報のAI判定: カルテに入れた ' + n(sum.add) + ' / 重複で除いた ' + n(sum.dup) + ' / 間違いで除いた ' + n(sum.wrong) +
    ' / 迷うので残した ' + n(sum.unsure) + (sum.error ? ' / 反映できなかった ' + n(sum.error) : '') + '（呼び出し ' + calls + ' 回・まだ見ていない ' + (remaining < 0 ? '?' : n(remaining)) + ' 件）' + (stop ? '｜' + stop : ''));
}
// 毎日 2時台（メールの劇場情報 1時台のあと）と 19時台（LINE・Plaud 18時台のあと）に AI判定を動かすトリガーを作る
function setupTheaterReviewTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'reviewTheaterPendingAuto') { ScriptApp.deleteTrigger(t); removed++; }
  });
  ScriptApp.newTrigger('reviewTheaterPendingAuto').timeBased().atHour(2).everyDays(1).inTimezone('Asia/Tokyo').create();
  ScriptApp.newTrigger('reviewTheaterPendingAuto').timeBased().atHour(19).everyDays(1).inTimezone('Asia/Tokyo').create();
  Logger.log('劇場情報のAI判定を毎日 2時台・19時台に動かすトリガーを作りました（前のものを ' + removed + ' 件消しました）。');
}
// 手動テスト用: 直近メールを1回処理してログを見る
function testTheaterInfoOnce() { updateTheaterInfoDaily(); }
