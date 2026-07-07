/**
 * 劇場情報 自動更新（cinema-cases / Supabase）
 *
 * 役割: 毎日AM1時に前日分のシネコン関連メールを読み、各劇場情報（設備・持病・備考・支配人・
 *       劇場連絡先・パートナー連絡先）の「新しい事実」をAIで抽出する。
 *   - 確信が高く根拠のある事実 → theaters / theater_contacts へ自動反映（追記のみ・重複は入れない）
 *   - 支配人/劇場連絡先の変更、および確信が低いもの → 要確認キュー(theater_info_pending)へ。
 *     Webアプリ「🔎 劇場情報更新確認」で人が承認/却下する。
 *
 * ※ Code.gs と同じプロジェクトに置く（cfg_ / SUPABASE_URL_ / anthropicText_ / safeJson_ /
 *    buildThreadText_ / getOrCreateLabel_ / normalizeCompany_ / MODEL_ を流用）。
 * ※ 有効化: Supabaseで SETUP_THEATER_AUTOUPDATE.sql を1回実行 → 本ファイルを貼付 →
 *    setupTheaterInfoTrigger() を1回実行（毎日AM1時トリガー作成）。
 */

var TI_DONE_LABEL = '劇場情報確認済';        // 処理済みスレッド（再処理防止）
var TI_AUTO_CONF = 0.85;                     // これ以上の確信度＋根拠ありなら自動反映
var TI_THREAD_LIMIT = 40;                    // 1回で読むスレッド数上限
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

    var nAuto = 0, nPend = 0, nSkip = 0;
    threads.forEach(function (th) {
      try {
        var text = buildThreadText_(th);
        var ext = extractTheaterInfo_(apiKey, text);
        if (ext && ext.items && ext.items.length) {
          var theater = ext.theater || '';
          var company = ext.company ? normalizeCompany_(ext.company) : '';
          if (theater) {
            var known = tiTheaterExists_(theater);
            ext.items.forEach(function (it) {
              var r = routeTheaterItem_(it, theater, company, known);
              if (r === 'auto') nAuto++; else if (r === 'pending') nPend++; else nSkip++;
            });
          }
        }
      } catch (e) { Logger.log('劇場情報更新 スレッド処理エラー: ' + e); }
      th.addLabel(lblDone); // 成否に関わらず再処理はしない
    });
    Logger.log('劇場情報更新: 自動反映 %s / 要確認 %s / スキップ %s', nAuto, nPend, nSkip);
  } catch (e) {
    Logger.log('updateTheaterInfoDaily error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

// ===== Claude: メールから劇場情報の新事実を抽出 =====
function extractTheaterInfo_(apiKey, text) {
  var sys = [
    'あなたはシネコン設備の保守/工事会社のデータ整理担当です。メールを読み、劇場設備台帳に追記すべき',
    '「新しい事実」だけをJSONで出力（前後に文章なし）。案件の進捗のような一時的な連絡は対象外（別システムが担当）。',
    '対象は「特定の映画館(劇場)」に関する次の事実のみ:',
    '- 設備(equipment): 機種/型式/系統構成/更新工事の履歴',
    '- 持病(chronic_issues): 繰り返す不具合・慢性トラブル',
    '- 備考(info_note): 運用上の注意（施設管理会社・作業申請ルール等）',
    '- 支配人(manager): 支配人名（交代が読み取れた場合）',
    '- 劇場連絡先(theater_phone): 劇場の電話番号',
    '- パートナー連絡先(contact): 業者の会社/担当者/電話/メール（署名から）',
    '劇場名は正式表記に寄せる（例「TOHOシネマズ 新宿」「109シネマズ 川崎」「ユナイテッドシネマ新座」）。',
    '各itemに confidence(0〜1) と evidence(根拠: 件名や署名の要約、60字以内) と source_date(YYYY-MM) を付ける。',
    '推測・創作は禁止。メールから確実に読み取れるものだけ。無ければ items は空配列。',
    'スキーマ: {"theater":string,"company":string,"items":[{',
    '  "kind":"field"|"contact",',
    '  "field":"equipment"|"chronic_issues"|"info_note"|"manager"|"theater_phone",  // kind=fieldのみ',
    '  "value":string,  // kind=fieldの内容',
    '  "category":string,"maker":string,"vendor":string,"person":string,"phone":string,"email":string,"note":string, // kind=contact',
    '  "confidence":number,"evidence":string,"source_date":string}]}'
  ].join('\n');
  return safeJson_(anthropicText_(apiKey, sys, text, 1200));
}

// 1件を 自動反映 / 要確認 / スキップ に振り分ける
function routeTheaterItem_(it, theater, company, theaterKnown) {
  if (!it || !it.kind) return 'skip';
  var conf = (typeof it.confidence === 'number') ? it.confidence : 0;
  var hasEvidence = !!(it.evidence && String(it.evidence).trim());

  if (it.kind === 'contact') {
    if (!it.vendor) return 'skip';
    var contactAuto = theaterKnown && conf >= TI_AUTO_CONF && hasEvidence && (it.email || it.phone);
    if (contactAuto && tiAutoContact_(theater, company, it)) return 'auto';
    return tiQueuePending_(theater, company, it) ? 'pending' : 'skip'; // 自動失敗時も要確認へ
  }

  // field
  var f = it.field;
  var appendFields = { equipment: 1, chronic_issues: 1, info_note: 1 };
  // 支配人・劇場連絡先の変更は影響が大きいので常に要確認（自動反映しない）
  if (f === 'manager' || f === 'theater_phone') {
    return tiQueuePending_(theater, company, it) ? 'pending' : 'skip';
  }
  if (!appendFields[f] || !it.value) return 'skip';
  var fieldAuto = theaterKnown && conf >= TI_AUTO_CONF && hasEvidence;
  if (fieldAuto && tiAutoField_(theater, company, it)) return 'auto';
  return tiQueuePending_(theater, company, it) ? 'pending' : 'skip'; // 自動失敗時も要確認へ
}

// ===== 自動反映: theaters の列に追記（既存保持・重複語は入れない） =====
function tiAutoField_(theater, company, it) {
  var col = it.field;
  var row = tiGetTheater_(theater, col);
  if (row === null) return false; // 取得失敗時は反映しない
  var cur = String(row[col] || '');
  var add = tiWithEvidence_(it.value, it);
  var key = String(it.value || '').slice(0, 40);
  if (key && cur.indexOf(key) !== -1) return true; // 既に含む → 何もしないが成功扱い
  var patch = {};
  patch[col] = cur ? (cur + ' / ' + add) : add;
  return tiPatchTheater_(theater, patch);
}

// ===== 自動反映: theater_contacts へ挿入（同一 劇場×業者×担当者 が無ければ） =====
function tiAutoContact_(theater, company, it) {
  if (tiContactExists_(theater, it.vendor, it.person)) return true;
  var note = [it.note, it.evidence].filter(function (x) { return x; }).join(' / ');
  var body = {
    company: company || '', theater: theater, category: it.category || '', maker: it.maker || '',
    vendor: it.vendor || '', person: it.person || '', phone: it.phone || '', email: it.email || '',
    note: note, sort_order: 8000
  };
  return tiSupaInsert_('theater_contacts', body);
}

// ===== 要確認キューへ投入（同じ候補が既にあれば入れない） =====
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
function tiWithEvidence_(v, it) {
  var tag = [it.source_date, it.evidence].filter(function (x) { return x; }).join(' ');
  return tag ? (v + '（' + tag + '）') : v;
}
function tiTheaterExists_(theater) {
  var res = tiSupaGet_('theaters', 'name=eq.' + encodeURIComponent(theater) + '&select=name&limit=1');
  if (res && res.length) return true;
  var c = tiSupaGet_('theater_contacts', 'theater=eq.' + encodeURIComponent(theater) + '&select=id&limit=1');
  return !!(c && c.length);
}
function tiGetTheater_(theater, col) {
  var res = tiSupaGet_('theaters', 'name=eq.' + encodeURIComponent(theater) + '&select=' + encodeURIComponent(col) + '&limit=1');
  if (res === null) return null;
  return res.length ? res[0] : {};
}
function tiContactExists_(theater, vendor, person) {
  var q = 'theater=eq.' + encodeURIComponent(theater) +
    '&vendor=eq.' + encodeURIComponent(vendor || '') +
    '&person=eq.' + encodeURIComponent(person || '') + '&select=id&limit=1';
  var res = tiSupaGet_('theater_contacts', q);
  return !!(res && res.length);
}
function tiPendingExists_(theater, it) {
  var q = 'theater=eq.' + encodeURIComponent(theater) + '&status=in.(pending,approved)&select=id&limit=1';
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
function tiPatchTheater_(theater, patch) {
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/theaters?name=eq.' + encodeURIComponent(theater), {
    method: 'patch', contentType: 'application/json',
    headers: Object.assign({ Prefer: 'return=minimal' }, tiHeaders_()),
    payload: JSON.stringify(patch), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('PATCH失敗: ' + res.getContentText()); return false; }
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
// 手動テスト用: 直近メールを1回処理してログを見る
function testTheaterInfoOnce() { updateTheaterInfoDaily(); }
