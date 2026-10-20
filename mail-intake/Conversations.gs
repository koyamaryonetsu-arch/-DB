/**
 * LINEのやり取り と Plaud（会議・電話の録音の要約）を、案件とタスク管理に使う
 *
 * いつ: 毎日 10時 と 18時（Googleの時間トリガーなので、その時間帯のどこかで動きます）
 *       ※ 以前の「LINE 毎日AM2時（劇場情報）」はやめて、ここに一本化（劇場情報もここで更新）
 * 何をする:
 *   1) LINEトーク履歴（スプレッドシート）の、前回以降に増えた行だけを読む
 *   2) Googleドライブ「Plaud記録」の「9:50」「17:50」フォルダの書き出しから、まだ読んでいない記録だけを読む
 *      （Claude の定期実行が、9:50 に「前日17:51〜当日9:50」、17:50 に「当日9:51〜17:50」の記録を、
 *        それぞれのフォルダに1つのファイルで書き出す。前のファイルはごみ箱へ＝増えない。記録IDで二重に読まない）
 *   3) それぞれ Sonnet 5.5 で読んで、
 *      ・案件: 今ある案件の続き（日程・進み具合）→ 社内メモに【LINE自動更新】【Plaud自動更新】で書き足し、空いている日程だけ埋める
 *              新しい案件らしい時 → 登録せず「🆕 登録確認」に溜めて LINE で知らせる（人がボタンで決める）
 *      ・タスク: メンバーのやること → 「💡 これタスクでは？」に提案（押すと登録・要らなければ破棄）
 *      ・劇場情報: 設備・支配人・連絡先などの新しい事実 → 今までどおり（自動反映／要確認）
 * 時間が足りない時: 1回 5分で区切り、続きは数分後に自動で再開（読んだ所は覚えているので重ならない）
 * 実行のきろく: 毎回の結果（件数・エラー）を「Plaud記録」フォルダの「GAS 実行ログ（LINE・Plaud）」に1行ずつ書く
 *   （1つのファイルを上書き・直近60行だけ）。Claude の毎日の確認（11:15・19:15）がこれを読み、おかしい時だけ知らせる
 *
 * 使い方（初めの1回だけ）:
 *   1) このファイルを貼る（Code.gs / LineTalk.gs / TheaterInfo.gs も今回の版に貼り直す）
 *   2) testConversationsDryRun() … 書き込まずに、何をするかだけログに出す（読んだ位置も進めない）
 *   3) setupConversationTriggers() … 10時・18時のトリガーを作り、以前の AM2時（LINE）トリガーを消す
 *
 * スクリプトプロパティ（任意）:
 *   ANTHROPIC_CONV_MODEL … 既定 claude-sonnet-5-5（LINE・Plaud の読み取り）
 *   PLAUD_SLOT_FOLDER_IDS … 既定 下の CV_PLAUD_SLOT_FOLDERS（「9:50」「17:50」フォルダ。カンマ区切り）
 */

// Googleドライブ「Plaud記録」の中の「9:50」「17:50」フォルダ（Claude の定期実行が、その時間の回の書き出しを置く）
var CV_PLAUD_SLOT_FOLDERS = ['1B-lLzN4cdrhZkInagw8q1HzRQ8GT_ink', '1xp267RTonlDEaFOPYFKLt7G9y44yk85n'];
var CV_TIME_BUDGET_MS = 5 * 60 * 1000;   // 1回の実行時間の目安（6分制限の手前で区切る）
var CV_CHUNK_ROWS = 60;                  // LINE は 60行ずつ AI に渡す（会話の前後が分かるように）
var CV_MAX_PLAUD_CHARS = 16000;          // Plaud の1記録で AI に渡す最大の文字数
var CV_PLAUD_FIRST_DAYS = 3;             // 初めて動く時は、直近3日ぶんの Plaud 記録だけ読む
var CV_MIN_CONF = 0.6;                   // 案件の話として扱う確信度の下限
var CV_DONE_KEY = 'CV_PLAUD_DONE';       // 読んだ Plaud 記録（記録ID → 読んだ日時）
var CV_CONT_FN = 'continueConversations'; // 時間切れの続き（1回だけのトリガー）
var CV_DRY = false;                      // true の時は書き込まない（testConversationsDryRun）

function CONV_MODEL_() { return cfg_('ANTHROPIC_CONV_MODEL', 'claude-sonnet-5-5'); }
function CV_AI_() { return { model: CONV_MODEL_(), effort: 'low' }; }

// ===== メイン（10時・18時のトリガー） =====
function updateFromLineAndPlaud() { cvRun_(false); }
// 時間切れの続き（自分で作った1回だけのトリガーから呼ばれる）
function continueConversations() { cvRun_(true); }
// 書き込まずに、何をするかだけログに出す（読んだ位置も進めない）
function testConversationsDryRun() {
  CV_DRY = true;
  try { cvRun_(false); } finally { CV_DRY = false; }
}

function cvRun_(isContinue) {
  cvDeleteContinueTriggers_();
  var kind = isContinue ? '続き' : '定時';
  var lock = LockService.getScriptLock();
  // メールの取り込み（5分ごと）が動いている時は、終わるまで少し待つ
  if (!lock.tryLock(90 * 1000)) {
    Logger.log('LINE・Plaud: ほかの処理が動いているため、数分後にやり直します');
    cvRunLog_(kind, '待ち: ほかの処理が動いているため、数分後にやり直し');
    cvScheduleContinue_(); return;
  }
  var st = { start: Date.now(), timeUp: false, line: 0, plaud: 0, upd: 0, pend: 0, sugg: 0, ti: 0, skip: 0 };
  try {
    var apiKey = cfg_('ANTHROPIC_API_KEY');
    var svcKey = cfg_('SUPABASE_SERVICE_ROLE_KEY');
    if (!apiKey || !svcKey) { Logger.log('LINE・Plaud: キー未設定'); cvRunLog_(kind, 'エラー: キー未設定'); return; }
    cvLine_(apiKey, st);
    if (!st.timeUp) cvPlaud_(apiKey, st);
    // 数は文字にしてからつなぐ（Logger の %s だと「1.0」のように小数で出るため）
    var n = function (v) { return String(Math.round(Number(v) || 0)); };
    var summary = 'LINE ' + n(st.line) + ' 塊 / Plaud ' + n(st.plaud) + ' 件 → 案件の更新 ' + n(st.upd) +
      ' / 登録確認へ ' + n(st.pend) + ' / タスク提案 ' + n(st.sugg) + ' / 劇場情報 ' + n(st.ti) + ' / 案件の話なし ' + n(st.skip) + (st.timeUp ? '（時間切れ → 続きは数分後）' : '');
    Logger.log('LINE・Plaud' + (CV_DRY ? '（書き込みなし・確認だけ）' : '') + ': ' + summary);
    cvRunLog_(kind, (st.timeUp ? '途中: ' : '完了: ') + summary);
    if (st.timeUp && !CV_DRY) cvScheduleContinue_();
  } catch (e) {
    Logger.log('updateFromLineAndPlaud error: ' + e);
    cvRunLog_(kind, 'エラー: ' + String(e).slice(0, 300));
  } finally {
    lock.releaseLock();
  }
}

// ===== 実行のきろく（Claude の毎日の確認が読む） =====
// 「Plaud記録」フォルダ（「9:50」「17:50」の親）に、1回1行で書き足す。1つのファイルを上書きするので増えない（直近60行だけ残す）
var CV_RUNLOG_NAME = 'GAS 実行ログ（LINE・Plaud）';
var CV_RUNLOG_KEEP = 60;
function cvRunLog_(kind, text) {
  if (CV_DRY) return;   // 確認だけの時は書かない
  try {
    var ids = String(cfg_('PLAUD_SLOT_FOLDER_IDS', CV_PLAUD_SLOT_FOLDERS.join(','))).split(',');
    var parents = DriveApp.getFolderById(String(ids[0]).trim()).getParents();
    if (!parents.hasNext()) return;
    var folder = parents.next();
    var line = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm') + '｜' + kind + '｜' + String(text).replace(/[\r\n]+/g, ' ');
    var it = folder.getFilesByName(CV_RUNLOG_NAME), file = null;
    while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) { file = f; break; } }
    if (!file) { folder.createFile(CV_RUNLOG_NAME, cvRunLogHead_() + line + '\n', MimeType.PLAIN_TEXT); return; }
    var body = file.getBlob().getDataAsString('UTF-8').split('\n').filter(function (s) { return /^\d{4}-\d\d-\d\d \d\d:\d\d｜/.test(s); });
    body.push(line);
    file.setContent(cvRunLogHead_() + body.slice(-CV_RUNLOG_KEEP).join('\n') + '\n');
  } catch (e) { Logger.log('実行のきろくを書けません: ' + e); }
}
function cvRunLogHead_() {
  return 'GAS の LINE・Plaud の処理（毎日 10時台・18時台）の結果。1回1行（日時｜定時/続き｜完了・途中・待ち・エラー: 内容）。新しい行が下。\n';
}
function cvOutOfTime_(st) { if (Date.now() - st.start > CV_TIME_BUDGET_MS) st.timeUp = true; return st.timeUp; }
function cvScheduleContinue_() {
  try { ScriptApp.newTrigger(CV_CONT_FN).timeBased().after(3 * 60 * 1000).create(); } catch (e) { Logger.log('続きのトリガーを作れません: ' + e); }
}
function cvDeleteContinueTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === CV_CONT_FN) ScriptApp.deleteTrigger(t); });
}

// ===== LINE =====
function cvLine_(apiKey, st) {
  var files = ltFindSpreadsheets_();
  if (!files.length) { Logger.log('LINE: 対象のトーク履歴が見つかりません'); return; }
  for (var f = 0; f < files.length && !cvOutOfTime_(st); f++) {
    var ss;
    try { ss = SpreadsheetApp.openById(files[f].id); } catch (e) { Logger.log('LINE: 開けません(' + files[f].name + '): ' + e); continue; }
    var sheets = ss.getSheets();
    for (var si = 0; si < sheets.length && !cvOutOfTime_(st); si++) {
      var sh = sheets[si];
      var got = cvReadNewRows_(ss.getId(), sh);
      if (!got.rows.length) { if (got.lastRow && !CV_DRY) ltSavePos_(ss.getId(), sh.getName(), got.lastRow); continue; }
      for (var i = 0; i < got.rows.length; i += CV_CHUNK_ROWS) {
        if (cvOutOfTime_(st)) break;
        var chunk = got.rows.slice(i, i + CV_CHUNK_ROWS);
        var text = '# LINEのやり取り（' + ss.getName() + ' / ' + sh.getName() + '）\n※ 1行が1発言です。\n\n' + chunk.map(function (x) { return x.text; }).join('\n');
        var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/edit';
        cvHandleText_(apiKey, text, 'line', 'line', url, cvToday_(), st);
        st.line++;
        // ここまで読んだ（途中で時間切れになっても、読んだ所までは覚える）
        if (!CV_DRY) ltSavePos_(ss.getId(), sh.getName(), chunk[chunk.length - 1].row);
      }
    }
  }
}
// 前回以降に増えた行（行番号つき）。読み取り位置は LineTalk.gs と同じ記録（LT_POS_…）を使う
function cvReadNewRows_(ssId, sh) {
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { rows: [], lastRow: 0 };
  var saved = PropertiesService.getScriptProperties().getProperty(ltPosKey_(ssId, sh.getName()));
  var from = saved === null ? Math.max(1, lastRow - LT_FIRST_RUN_ROWS + 1) : Number(saved) + 1;
  if (!(from >= 1)) from = 1;
  if (from > lastRow) return { rows: [], lastRow: lastRow };
  if (lastRow - from + 1 > LT_MAX_ROWS_PER_RUN) from = lastRow - LT_MAX_ROWS_PER_RUN + 1;
  var values = sh.getRange(from, 1, lastRow - from + 1, lastCol).getValues();
  var rows = [];
  for (var r = 0; r < values.length; r++) { var t = ltRowToLine_(values[r]); if (t) rows.push({ row: from + r, text: t }); }
  return { rows: rows, lastRow: lastRow };
}

// ===== Plaud（Googleドライブ「Plaud記録」の「9:50」「17:50」フォルダ） =====
// それぞれのフォルダには、その回の書き出しが1つだけある（毎回作り直し、前のものはごみ箱へ）。
//   9:50 の回 … 前日 17:51 〜 当日 9:50 に始まった記録
//   17:50 の回 … 当日 9:51 〜 17:50 に始まった記録
// 1つのファイルに複数の記録が入っている。「Plaud 記録ID: …」の行で区切り、記録IDごとに1回だけ読む
// （同じ記録が両方のファイルに入っても、二度は案件・タスクに使わない）
function cvPlaud_(apiKey, st) {
  var ids = String(cfg_('PLAUD_SLOT_FOLDER_IDS', CV_PLAUD_SLOT_FOLDERS.join(','))).split(',');
  var props = PropertiesService.getScriptProperties();
  var done = {};
  try { done = JSON.parse(props.getProperty(CV_DONE_KEY) || '{}') || {}; } catch (e) { done = {}; }
  var firstRun = !Object.keys(done).length;
  var since = Date.now() - CV_PLAUD_FIRST_DAYS * 86400000;
  var blocks = [];
  ids.forEach(function (fid) {
    fid = String(fid || '').trim(); if (!fid) return;
    var folder;
    try { folder = DriveApp.getFolderById(fid); } catch (e) { Logger.log('Plaud: フォルダを開けません(' + fid + '): ' + e); return; }
    var it = folder.getFiles();
    while (it.hasNext()) {
      var fl = it.next();
      if (fl.isTrashed && fl.isTrashed()) continue;
      if (fl.getLastUpdated().getTime() < since) continue;   // 3日より前の書き出しは読まない
      cvSplitRecordings_(cvFileText_(fl)).forEach(function (b) { b.url = fl.getUrl(); b.slot = folder.getName(); blocks.push(b); });
    }
  });
  blocks.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  var seen = {};
  for (var i = 0; i < blocks.length && !cvOutOfTime_(st); i++) {
    var b = blocks[i];
    if (done[b.id] || seen[b.id]) continue;
    seen[b.id] = 1;
    // 初めての時は、3日より前の記録はさかのぼって読まない（読んだことにする）
    if (firstRun && b.date && new Date(b.date + 'T00:00:00+09:00').getTime() < since) { done[b.id] = Date.now(); continue; }
    var text = '# 会議・電話の記録（Plaud の要約）: ' + b.name + '\n\n' + b.body.slice(0, CV_MAX_PLAUD_CHARS);
    cvHandleText_(apiKey, text, 'plaud', 'plaud', b.url, b.date || cvToday_(), st);
    st.plaud++;
    done[b.id] = Date.now();
    if (!CV_DRY) cvSaveDone_(props, done);
  }
  if (!CV_DRY) cvSaveDone_(props, done);
}
// 書き出しのファイルを、記録ごとに分ける。各記録は「Plaud 記録ID: of_…」の行から始まる
function cvSplitRecordings_(text) {
  var out = [], re = /^Plaud 記録ID:\s*(\S+)\s*$/mg, m, marks = [];
  text = String(text || '');
  while ((m = re.exec(text))) marks.push({ id: m[1], at: m.index });
  for (var i = 0; i < marks.length; i++) {
    var body = text.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : text.length).replace(/[━\s]+$/, '');
    var nm = (body.match(/^名前[:：]\s*(.+)$/m) || [])[1] || '';
    out.push({ id: marks[i].id, date: cvPlaudDate_(body), name: nm, body: body });
  }
  return out;
}
function cvSaveDone_(props, done) {
  // 60日より前の記録は忘れる（大きくなりすぎないように）
  var lim = Date.now() - 60 * 86400000;
  Object.keys(done).forEach(function (k) { if (done[k] < lim) delete done[k]; });
  props.setProperty(CV_DONE_KEY, JSON.stringify(done));
}
function cvFileText_(file) {
  try {
    if (file.getMimeType() === MimeType.GOOGLE_DOCS) return DocumentApp.openById(file.getId()).getBody().getText();
    return file.getBlob().getDataAsString('UTF-8');
  } catch (e) { Logger.log('Plaud: 読めません(' + file.getName() + '): ' + e); return ''; }
}
// 書き出しの頭にある「日時: 2026-10-16 15:58」から日付を拾う
function cvPlaudDate_(body) { var m = String(body).match(/日時[:：]\s*(\d{4}-\d{2}-\d{2})/); return m ? m[1] : ''; }
function cvToday_() { return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'); }

// ===== 1つの文章（LINEの塊・Plaudの1記録）を、タスク・案件・劇場情報に使う =====
function cvHandleText_(apiKey, text, source, keyPrefix, srcUrl, date, st) {
  var label = source === 'plaud' ? 'Plaud' : 'LINE';
  // (1) タスクの提案（メールと同じしくみ。Sonnet 5.5 で読む）
  try { st.sugg += suggestTasksFromText_(apiKey, text, source, keyPrefix, srcUrl, CV_AI_()); } catch (e) { Logger.log('タスク提案(' + label + ')エラー: ' + e); }
  // シネマの設備に関係しそうな言葉が1つも無ければ、案件・劇場情報は読まない（費用を抑える）
  if (!ltHasKeyword_(text)) { st.skip++; return; }
  // (2) 案件
  try { cvCases_(apiKey, text, source, srcUrl, date, st); } catch (e) { Logger.log('案件(' + label + ')エラー: ' + e); }
  // (3) 劇場情報（今までの LINE の AM2時 の処理をここで）
  try {
    var ext = extractTheaterInfo_(apiKey, text, null, CV_AI_());
    if (ext && ext.items && ext.items.length && ext.theater) {
      var company = ext.company ? normalizeCompany_(ext.company) : '';
      var known = tiTheaterExists_(ext.theater);
      ext.items.forEach(function (x) {
        if (CV_DRY) { Logger.log('[確認だけ] 劇場情報: ' + ext.theater + ' / ' + (x.field || x.kind) + ' = ' + String(x.value || x.vendor || '').slice(0, 40)); st.ti++; return; }
        var r = routeTheaterItem_(x, ext.theater, company, known);
        if (r === 'auto' || r === 'pending') st.ti++;
      });
    }
  } catch (e) { Logger.log('劇場情報(' + label + ')エラー: ' + e); }
}

// ===== 案件: 話から案件ごとの「新しい進展」を拾い、メールと同じ判断で 続き＝更新／新しい＝登録確認 =====
function cvCases_(apiKey, text, source, srcUrl, date, st) {
  var label = source === 'plaud' ? 'Plaud' : 'LINE';
  var items = cvParseCases_(apiKey, text, source, date);
  if (!items.length) { st.skip++; return; }
  items.forEach(function (p) {
    if (cvOutOfTime_(st)) return;
    if (!p || !p.theater || (typeof p.confidence === 'number' && p.confidence < CV_MIN_CONF)) return;
    fixPersons_(p);
    p.company = normalizeCompany_(p.company);
    p.progress = p.progress || {};
    var d = decideCaseWithRecheck_(p, date, '', text.slice(0, 4000), false);
    var prog = p.progress, hasNew = !!(String(prog.note || '').trim() || hasProgressDates_(prog));
    if (d.decision === 'update' && d.row) {
      if (!hasNew) return;
      if (CV_DRY) { Logger.log('[確認だけ] 案件の更新: id=' + d.row.id + ' ' + d.row.theater + ' ← ' + String(prog.note || '').slice(0, 60)); st.upd++; return; }
      updateCase_(d.row, prog, p.content, null, label + '自動更新');
      st.upd++;
      return;
    }
    // 新しい案件らしい・迷う → 登録せず「🆕 登録確認」へ（同じ話がもう溜まっていれば溜めない）
    if (p.intent !== 'new' && !hasNew) return;
    if (cvPendingExists_(p)) { Logger.log(label + ': 同じ話がもう登録確認にあるため溜めない: ' + p.theater + ' / ' + (p.title || '')); return; }
    var reason = (d.decision === 'new' ? label + 'の話から、新しい案件の可能性があります' : label + 'の話から、新規か今ある案件の続きか判断できませんでした') + (d.reason ? '（' + d.reason + '）' : '');
    p.title = '【' + label + '】' + String(p.title || p.content || '').slice(0, 80);
    if (CV_DRY) { Logger.log('[確認だけ] 登録確認へ: ' + p.theater + ' / ' + p.title + ' / ' + reason); st.pend++; return; }
    var pid = queueIntakeConfirm_(p, date, null, null, reason, null, srcUrl);
    if (pid) st.pend++;
  });
}
function cvParseCases_(apiKey, text, source, date) {
  var sys = [
    'あなたは菱熱工業（シネコン＝映画館の空調などの設備の保守・工事会社）の案件管理アシスタントです。',
    (source === 'plaud' ? '会議・電話の記録の要約' : 'LINEのやり取り') + 'を読み、映画館の設備の「案件」ごとに、今回わかった新しい進展を拾います。JSONのみ出力（前後に文章なし）。',
    '今日は ' + date + '（この記録の日付）。「来週月曜」「月末」などは日付に直す。決まっていない日程（「ごろ」「予定未定」）は入れない。',
    '対象: 映画館（シネコン）の設備の修理・点検・工事・更新・見積の話だけ。',
    '対象外: 映画館以外の仕事（工場・食品会社・ヤクルトなど）、社内の勉強会・AI活用・人事・雑談、案件と関係ない話。',
    '1件 = 同じ劇場の同じ工事・不具合。劇場が違えば別の件。同じ劇場でも工事が別なら別の件。最大8件。',
    '会社は次のいずれかに正規化: ' + JSON.stringify(COMPANY_LIST) + '（109シネマズ＝東急レクリエーション）',
    '種別は次のいずれか: ' + JSON.stringify(CATEGORY_LIST),
    '担当者: r_person=菱熱工業のメンバーの苗字（' + JSON.stringify(RYONETSU_MEMBERS) + ' のどれか。違えば空文字）、tc_person=客先の担当者の苗字。敬称は付けない。分からなければ空文字。',
    'intent: 新しい依頼・新しい工事の話なら "new"、今ある案件の続き（調査・見積・発注・作業・報告・日程の決定）なら "progress"。',
    'content: その案件が何か（劇場・設備・工事）を1〜2文。',
    'progress.note: 今回わかった新しい進展・決まったこと・次にすることを1〜3文。経緯の繰り返しはしない。無ければ空文字。',
    'progress の日付: survey_date=現地調査の日 / quote_date=見積書の提出日 / work_start_date=作業・工事の開始日 / work_end_date=作業・工事の完了日。決まった日付だけ YYYY-MM-DD。',
    'confidence: 0〜1。劇場がはっきりしない・映画館の設備の話か分からない時は低くする。',
    'スキーマ: {"items":[{"company":string,"theater":string,"category":string,"title":string,"intent":"new"|"progress","content":string,"tc_person":string,"r_person":string,"progress":{"survey_date":string,"quote_date":string,"work_start_date":string,"work_end_date":string,"note":string},"confidence":number}]}'
  ].join('\n');
  var j = safeJson_(anthropicText_(apiKey, sys, text, 3000, CV_AI_()));
  var list = (j && Array.isArray(j.items)) ? j.items : [];
  // 日付の形を整える（形が違えば空に）
  list.forEach(function (p) {
    if (!p || !p.progress) return;
    ['survey_date', 'quote_date', 'work_start_date', 'work_end_date'].forEach(function (k) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.progress[k] || ''))) p.progress[k] = ''; });
  });
  return list;
}
// 同じ劇場の「確認待ち」に、似た話がもう溜まっていれば true（LINE と Plaud で同じ話をしていることが多い）
function cvPendingExists_(p) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !p.theater) return false;
  var since = Utilities.formatDate(new Date(Date.now() - 14 * 86400000), 'Asia/Tokyo', "yyyy-MM-dd'T'00:00:00'+09:00'");
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/case_intake_pending?status=eq.pending&theater=eq.' + encodeURIComponent(p.theater) +
    '&created_at=gte.' + encodeURIComponent(since) + '&select=id,title,content&limit=20', {
    method: 'get', headers: { apikey: key, Authorization: 'Bearer ' + key }, muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) return false;
  var rows = []; try { rows = JSON.parse(res.getContentText()) || []; } catch (e) { rows = []; }
  var mine = [p.title || '', p.content || ''].join(' ');
  for (var i = 0; i < rows.length; i++) {
    if (textSimilarity_(mine, [rows[i].title || '', rows[i].content || ''].join(' ')) >= 0.45) return true;
  }
  return false;
}

// ===== セットアップ =====
// 毎日 10時・18時 のトリガーを作り、以前の「LINE 毎日AM2時」トリガーは消す
function setupConversationTriggers() {
  var fn = 'updateFromLineAndPlaud';
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var h = t.getHandlerFunction();
    if (h === fn || h === 'updateTheaterInfoFromLine' || h === CV_CONT_FN) { ScriptApp.deleteTrigger(t); if (h === 'updateTheaterInfoFromLine') n++; }
  });
  ScriptApp.newTrigger(fn).timeBased().atHour(10).everyDays(1).inTimezone('Asia/Tokyo').create();
  ScriptApp.newTrigger(fn).timeBased().atHour(18).everyDays(1).inTimezone('Asia/Tokyo').create();
  Logger.log('LINE・Plaud の毎日10時・18時トリガーを作成しました。以前の LINE AM2時トリガーを ' + n + ' 件消しました。');
}
// いま入っているトリガーの一覧（確認用）
function showTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { Logger.log('・' + t.getHandlerFunction() + '（' + t.getEventType() + '）'); });
}
