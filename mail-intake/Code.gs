/**
 * シネマ案件：Gmail → 自動 登録 / 進捗更新（cinema-cases / Supabase）
 *
 * 動作:
 *   1. Gmailの「案件登録」ラベルの新着メールを5分毎に読む
 *   2. Claudeが判定: 案件依頼か? / 新規(new) か 進捗報告(progress) か / 各項目を抽出
 *      （差出人ヒント: 客先=新規依頼が多い / 菱熱工業メンバー=進捗報告が多い）
 *   3. 同じ劇場の既存案件と照合（AIマッチング）
 *      - 進捗 かつ 一致 → その案件を UPDATE（見積提出日/作業開始日/作業完了日/内容追記）
 *      - 新規 かつ 一致 → 重複扱いで登録しない（担当者の手動登録を「正」とする）
 *      - 新規 かつ 一致なし → INSERT（新規登録）
 *      - 進捗 かつ 一致なし → 更新先不明 → 「要確認」ラベル
 *   4. INSERT/UPDATE すると既存 Database Webhook (case-created) が発火し LINE 通知
 *   5. 処理済みメールにはラベルを付けて再処理を防止
 *
 * スクリプトプロパティ:
 *   ANTHROPIC_API_KEY          - Anthropic APIキー
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase の service_role キー（Settings > API）
 *   SUPABASE_URL               - (任意) 既定 https://hykjpadvbficiiuockhj.supabase.co
 *   ANTHROPIC_MODEL            - (任意) 既定 claude-haiku-4-5-20251001（抽出は安いHaikuで十分）
 */

var SRC_LABEL = '案件登録';        // 取込対象（フィルタ/手動で付与）
var DONE_LABEL = '案件登録済';      // 新規登録 完了
var UPD_LABEL = '案件更新済';       // 進捗更新 完了
var SKIP_LABEL = '案件登録_要確認'; // 案件でない / 進捗だが更新先不明
var DUP_LABEL = '案件登録_重複';    // 既存の手動登録と重複（登録せず）

var COMPANY_LIST = ['TOHOシネマズ', '109シネマズ', 'ユナイテッドシネマ', '佐々木興業', 'コロナワールド', 'MOVIX', 'イオンシネマズ', 'シネマサンシャイン'];
var CATEGORY_LIST = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'その他'];
// 菱熱工業メンバー（内部）の差出人ヒント。ここからのメールは進捗報告の可能性が高い
var MEMBER_HINT = '@ryonetsu.com / @ryonetsu-ai.com、および 金子/若山/山口/大和/細萱/小山 などの個人アドレス';

function cfg_(k, d) {
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === '') ? (d === undefined ? '' : d) : v;
}
function SUPABASE_URL_() { return cfg_('SUPABASE_URL', 'https://hykjpadvbficiiuockhj.supabase.co'); }
function MODEL_() { return cfg_('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'); }

// ===== メイン（5分毎トリガー） =====
function importCaseEmails() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var lblDone = getOrCreateLabel_(DONE_LABEL);
    var lblUpd = getOrCreateLabel_(UPD_LABEL);
    var lblSkip = getOrCreateLabel_(SKIP_LABEL);
    var lblDup = getOrCreateLabel_(DUP_LABEL);
    var q = 'label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' -label:' + UPD_LABEL +
            ' -label:' + SKIP_LABEL + ' -label:' + DUP_LABEL + ' newer_than:14d';
    var threads = GmailApp.search(q, 0, 20);
    if (!threads.length) { Logger.log('対象メールなし'); return; }

    var nNew = 0, nUpd = 0, nDup = 0, nSkip = 0;
    threads.forEach(function (th) {
      var msgs = th.getMessages();
      var m = msgs[msgs.length - 1];
      var emailText =
        '件名: ' + m.getSubject() + '\n差出人: ' + m.getFrom() +
        '\n日時: ' + m.getDate().toISOString() + '\n\n' + m.getPlainBody().slice(0, 6000);

      var p = parseEmail_(emailText);
      if (!p || !p.is_case || (p.confidence || 0) < 0.5) { th.addLabel(lblSkip); nSkip++; return; }

      var received = p.received_date || Utilities.formatDate(m.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd');
      var theater = p.theater || '';
      var candidates = theater ? fetchTheaterCases_(theater) : [];
      var matched = candidates.length ? findMatch_(p, received, candidates) : null;

      if (p.intent === 'progress') {
        if (matched) {
          updateCase_(matched, p.progress || {}, p.content);
          th.addLabel(lblUpd); nUpd++;
        } else {
          th.addLabel(lblSkip); nSkip++; // 進捗だが対象案件が特定できない → 人の確認へ
          Logger.log('進捗だが更新先不明: ' + (p.title || m.getSubject()));
        }
      } else { // new
        if (matched) {
          th.addLabel(lblDup); nDup++; // 手動登録が正
          Logger.log('重複のため登録せず（手動優先）: ' + (p.title || m.getSubject()));
        } else {
          insertCase_({
            company: normalizeCompany_(p.company), theater: theater, received_date: received,
            tc_person: p.tc_person || '', r_person: p.r_person || '',
            category: normalizeCategory_(p.category), content: p.content || m.getPlainBody().slice(0, 1500)
          });
          th.addLabel(lblDone); nNew++;
        }
      }
    });
    Logger.log('新規 %s / 進捗更新 %s / 重複スキップ %s / 非案件・要確認 %s', nNew, nUpd, nDup, nSkip);
  } catch (e) {
    Logger.log('importCaseEmails error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateLabel_(name) { return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); }
function normalizeCompany_(v) {
  if (!v) return 'TOHOシネマズ';
  for (var i = 0; i < COMPANY_LIST.length; i++) if (COMPANY_LIST[i] === v) return v;
  return v;
}
function normalizeCategory_(v) {
  for (var i = 0; i < CATEGORY_LIST.length; i++) if (CATEGORY_LIST[i] === v) return v;
  return 'その他';
}

// ===== Claude: メール解析（新規/進捗の判定＋項目抽出） =====
function parseEmail_(emailText) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定'); return null; }
  var sys =
    'あなたはシネコン設備の案件管理アシスタントです。メールを読み、JSONのみ出力（前後に文章なし）。\n' +
    '判定: is_case=修理/工事/設備対応に関するメールか。intent="new"(新しい依頼) か "progress"(既存案件の進捗報告)。\n' +
    'ヒント: 差出人が客先なら新規依頼が多い。差出人が菱熱工業メンバー(' + MEMBER_HINT + ')なら進捗報告が多い。\n' +
    '会社は次のいずれかに正規化、なければ原文:\n' + JSON.stringify(COMPANY_LIST) + '\n' +
    '種別は次のいずれか:\n' + JSON.stringify(CATEGORY_LIST) + '\n' +
    'スキーマ: {"is_case":bool,"confidence":number,"intent":"new"|"progress","title":string,' +
    '"company":string,"theater":string(劇場名),"received_date":"YYYY-MM-DD",' +
    '"tc_person":string,"r_person":string,"category":string,"content":string(要点1-3文),' +
    '"progress":{"quote_date":"YYYY-MM-DD","work_start_date":"YYYY-MM-DD","work_end_date":"YYYY-MM-DD","note":string}}\n' +
    'progress は intent=progress のときだけ、メールに出てくる日付/報告内容を入れる（無い項目は空文字）。';
  return safeJson_(anthropicText_(apiKey, sys, emailText, 800));
}

// ===== Supabase: 同じ劇場の既存案件を取得 =====
function fetchTheaterCases_(theater) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return []; }
  var params = 'theater=eq.' + encodeURIComponent(theater) +
    '&select=id,received_date,category,content,memo,status,r_person,quote_date,work_start_date,work_end_date' +
    '&order=received_date.desc&limit=15';
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?' + params, {
    method: 'get', headers: { apikey: key, Authorization: 'Bearer ' + key }, muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('候補取得失敗: ' + res.getContentText()); return []; }
  try { return JSON.parse(res.getContentText()) || []; } catch (e) { return []; }
}

// ===== Claude: メールが既存案件のどれと同一かを判定（無ければnull） =====
function findMatch_(p, received, candidates) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  var list = candidates.map(function (x, i) {
    return (i + 1) + '. id=' + x.id + ' 受付=' + (x.received_date || '?') +
      ' 種別=' + (x.category || '?') + ' 状態=' + (x.status || '?') +
      ' 内容=' + String(x.content || '').slice(0, 150);
  }).join('\n');
  var sys = 'あなたは案件の同一性判定を行います。JSONのみ出力。' +
    '新規メール案件が、既存案件リストのいずれかと「同一の案件（同じ設備トラブル/工事）」を指すか判定。' +
    '表現が違っても同じ劇場で同時期・同一対象なら同一とみなす。' +
    'スキーマ: {"matched":bool,"matched_id":string(同一相手のid,無ければ空),"reason":string}';
  var user = '# メール案件\n劇場: ' + (p.theater || '') + '\n受付: ' + received +
    '\n種別: ' + (p.category || '') + '\n内容: ' + (p.content || '') +
    '\n\n# 既存案件（同じ劇場）\n' + list;
  var j = safeJson_(anthropicText_(apiKey, sys, user, 300));
  if (!j || !j.matched || !j.matched_id) return null;
  for (var i = 0; i < candidates.length; i++) if (String(candidates[i].id) === String(j.matched_id)) return candidates[i];
  return null;
}

// ===== Supabase: 新規INSERT =====
function insertCase_(f) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return; }
  var body = {
    company: f.company, theater: f.theater, received_date: f.received_date || null,
    tc_person: f.tc_person || null, r_person: f.r_person || null,
    category: f.category || null, content: f.content || null
  };
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases', {
    method: 'post', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('INSERT失敗: ' + res.getContentText());
  else Logger.log('新規登録: ' + f.theater + ' / ' + String(f.content || '').slice(0, 30));
}

// ===== Supabase: 進捗UPDATE（該当案件に日付/内容を反映） =====
function updateCase_(matched, prog, summary) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) return;
  var patch = {};
  // 日付は「まだ空」の項目に記入（既存値は上書きしない＝手動入力を尊重）
  if (prog.quote_date && !matched.quote_date) patch.quote_date = prog.quote_date;
  if (prog.work_start_date && !matched.work_start_date) patch.work_start_date = prog.work_start_date;
  if (prog.work_end_date && !matched.work_end_date) patch.work_end_date = prog.work_end_date;
  // 進捗メモは内容に追記（元の内容は保持。ステータス誤作動を避けるためmemoではなくcontentへ）
  var note = (prog.note || summary || '').trim();
  if (note) {
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    patch.content = String(matched.content || '') + '\n[進捗 ' + today + '] ' + note;
  }
  if (!Object.keys(patch).length) { Logger.log('更新項目なし: id=' + matched.id); return; }
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?id=eq.' + encodeURIComponent(matched.id), {
    method: 'patch', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(patch), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('UPDATE失敗: ' + res.getContentText());
  else Logger.log('進捗更新: id=' + matched.id + ' 項目=' + Object.keys(patch).join(','));
}

// ===== 共通 =====
function anthropicText_(apiKey, system, user, maxTokens) {
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL_(), max_tokens: maxTokens || 500, system: system,
      messages: [{ role: 'user', content: user }]
    }), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('Anthropic失敗: ' + res.getContentText()); return ''; }
  var data = JSON.parse(res.getContentText());
  return (data.content && data.content[0] && data.content[0].text) || '';
}
function safeJson_(txt) {
  if (!txt) return null;
  var s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(txt.slice(s, e + 1)); } catch (err) { Logger.log('JSON解析失敗: ' + txt); return null; }
}

// ===== セットアップ補助 =====
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importCaseEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importCaseEmails').timeBased().everyMinutes(5).create();
  Logger.log('importCaseEmails を5分毎に実行するトリガーを作成しました。');
}
function testConnections() {
  var n = GmailApp.search('label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' newer_than:14d').length;
  Logger.log('Gmail「' + SRC_LABEL + '」未処理: ' + n + '件');
  Logger.log('Supabase接続（川崎の既存案件）: ' + fetchTheaterCases_('TOHOシネマズ 川崎').length + '件');
  Logger.log('ANTHROPIC_API_KEY: ' + (cfg_('ANTHROPIC_API_KEY') ? 'あり' : 'なし') +
    ' / SUPABASE_SERVICE_ROLE_KEY: ' + (cfg_('SUPABASE_SERVICE_ROLE_KEY') ? 'あり' : 'なし'));
}
