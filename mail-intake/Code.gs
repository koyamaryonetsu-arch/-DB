/**
 * シネマ案件：Gmail → 自動登録（cinema-cases / Supabase）
 *
 * 動作:
 *   1. Gmailの「案件登録」ラベルの新着メールを5分毎に読む
 *   2. Claudeが「案件依頼か？」を判定し、会社/劇場/受付日/担当/種別/内容 を抽出
 *   3. 【重複防止】同じ劇場の既存案件と照合し、同一案件が既にあれば登録しない
 *      （担当者による手動登録を「正」とする）
 *   4. 重複でなければ Supabase の cases に INSERT
 *      → 既存の Database Webhook (case-created) が発火し LINE 通知＋初期対応診断
 *   5. 処理済みメールにはラベルを付けて再処理を防止
 *
 * スクリプトプロパティ（プロジェクトの設定 > スクリプト プロパティ）:
 *   ANTHROPIC_API_KEY          - Anthropic APIキー
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase の service_role キー（Settings > API）
 *   SUPABASE_URL               - (任意) 既定 https://hykjpadvbficiiuockhj.supabase.co
 *   ANTHROPIC_MODEL            - (任意) 既定 claude-sonnet-4-6
 */

var SRC_LABEL = '案件登録';        // 取込対象（人が転送/フィルタ/手動で付与）
var DONE_LABEL = '案件登録済';      // 登録完了
var SKIP_LABEL = '案件登録_要確認'; // 案件と判定できず（人の確認へ）
var DUP_LABEL = '案件登録_重複';    // 既存の手動登録と重複（登録せず）

// 会社（顧客）候補と種別候補（抽出時の正規化用）
var COMPANY_LIST = ['TOHOシネマズ', '109シネマズ', 'ユナイテッドシネマ', '佐々木興業', 'コロナワールド', 'MOVIX', 'イオンシネマズ', 'シネマサンシャイン'];
var CATEGORY_LIST = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'その他'];

function cfg_(k, d) {
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === '') ? (d === undefined ? '' : d) : v;
}
function SUPABASE_URL_() { return cfg_('SUPABASE_URL', 'https://hykjpadvbficiiuockhj.supabase.co'); }
function MODEL_() { return cfg_('ANTHROPIC_MODEL', 'claude-sonnet-4-6'); }

// ===== メイン（5分毎トリガー） =====
function importCaseEmails() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var done = getOrCreateLabel_(DONE_LABEL);
    var skip = getOrCreateLabel_(SKIP_LABEL);
    var dup = getOrCreateLabel_(DUP_LABEL);
    var q = 'label:' + SRC_LABEL + ' -label:' + DONE_LABEL +
            ' -label:' + SKIP_LABEL + ' -label:' + DUP_LABEL + ' newer_than:14d';
    var threads = GmailApp.search(q, 0, 20);
    if (!threads.length) { Logger.log('対象メールなし'); return; }

    var registered = 0, skipped = 0, duplicated = 0;
    threads.forEach(function (th) {
      var msgs = th.getMessages();
      var m = msgs[msgs.length - 1]; // スレッド最新
      var emailText =
        '件名: ' + m.getSubject() + '\n差出人: ' + m.getFrom() +
        '\n日時: ' + m.getDate().toISOString() + '\n\n' + m.getPlainBody().slice(0, 6000);

      var parsed = parseCaseFromEmail_(emailText);
      if (!parsed || !parsed.is_case || (parsed.confidence || 0) < 0.5) {
        th.addLabel(skip); skipped++; return;
      }
      var received = parsed.received_date || Utilities.formatDate(m.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd');
      var theater = parsed.theater || '';

      // 【重複防止】同じ劇場の既存案件と照合（手動登録が正）
      var candidates = theater ? fetchTheaterCases_(theater) : [];
      if (candidates.length && isDuplicate_(parsed, received, candidates)) {
        th.addLabel(dup); duplicated++;
        Logger.log('重複のため登録せず（手動登録を優先）: ' + (parsed.title || m.getSubject()));
        return;
      }

      insertCase_({
        company: normalizeCompany_(parsed.company),
        theater: theater,
        received_date: received,
        tc_person: parsed.tc_person || '',
        r_person: parsed.r_person || '',
        category: normalizeCategory_(parsed.category),
        content: parsed.content || m.getPlainBody().slice(0, 1500)
      });
      th.addLabel(done); registered++;
    });
    Logger.log('登録 %s件 / 重複スキップ %s件 / 非案件 %s件', registered, duplicated, skipped);
  } catch (e) {
    Logger.log('importCaseEmails error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}
function normalizeCompany_(v) {
  if (!v) return 'TOHOシネマズ';
  for (var i = 0; i < COMPANY_LIST.length; i++) if (COMPANY_LIST[i] === v) return v;
  return v; // 一覧に無くてもそのまま保存（textカラム）
}
function normalizeCategory_(v) {
  for (var i = 0; i < CATEGORY_LIST.length; i++) if (CATEGORY_LIST[i] === v) return v;
  return 'その他';
}

// ===== Claude: メール → 案件項目 =====
function parseCaseFromEmail_(emailText) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定'); return null; }
  var sys =
    'あなたはシネコン設備の修理/工事依頼メールを読み、案件管理DBへ登録するための項目を抽出します。' +
    'JSONのみ出力（前後に文章を付けない）。\n' +
    '会社は次のいずれかに正規化。該当しなければ最も近い名称か原文:\n' + JSON.stringify(COMPANY_LIST) + '\n' +
    '種別は次のいずれか:\n' + JSON.stringify(CATEGORY_LIST) + '\n' +
    'スキーマ: {"is_case": boolean(修理/工事/設備対応の依頼か), "confidence": number(0-1), ' +
    '"title": string(短い要約), "company": string, "theater": string(劇場名), ' +
    '"received_date": string(YYYY-MM-DD, メール日時から), "tc_person": string(客先担当), ' +
    '"r_person": string(自社R担当, 不明なら空), "category": string, "content": string(依頼要点を1-3文)}';
  var txt = anthropicText_(apiKey, sys, emailText, 700);
  return safeJson_(txt);
}

// ===== Supabase: 同じ劇場の既存案件を取得 =====
function fetchTheaterCases_(theater) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return []; }
  var params = 'theater=eq.' + encodeURIComponent(theater) +
    '&select=id,received_date,category,content,status,r_person&order=received_date.desc&limit=15';
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?' + params, {
    method: 'get',
    headers: { apikey: key, Authorization: 'Bearer ' + key },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('候補取得失敗: ' + res.getContentText()); return []; }
  try { return JSON.parse(res.getContentText()) || []; } catch (e) { return []; }
}

// ===== Claude: 重複判定（既存の手動登録と同一案件か） =====
function isDuplicate_(parsed, received, candidates) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return false;
  var list = candidates.map(function (x, i) {
    return (i + 1) + '. id=' + x.id + ' 受付=' + (x.received_date || '?') +
      ' 種別=' + (x.category || '?') + ' 状態=' + (x.status || '?') +
      ' 内容=' + String(x.content || '').slice(0, 150);
  }).join('\n');
  var sys = 'あなたは案件の重複判定を行います。JSONのみ出力。' +
    '新規メール案件が、既存案件リストのいずれかと「同一の案件（同じ設備トラブル/工事）」を指しているか判定。' +
    '表現が違っても、同じ劇場で同時期・同一対象なら重複とみなす。' +
    'スキーマ: {"duplicate": boolean, "matched_id": string(重複相手のid, 無ければ空), "reason": string}';
  var user = '# 新規メール案件\n劇場: ' + (parsed.theater || '') +
    '\n受付: ' + received + '\n種別: ' + (parsed.category || '') +
    '\n内容: ' + (parsed.content || '') +
    '\n\n# 既存案件（同じ劇場）\n' + list;
  var txt = anthropicText_(apiKey, sys, user, 300);
  var j = safeJson_(txt);
  return !!(j && j.duplicate);
}

// ===== Supabase: 案件をINSERT（→ webhookでLINE通知） =====
function insertCase_(fields) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定のため登録不可'); return; }
  var body = {
    company: fields.company, theater: fields.theater,
    received_date: fields.received_date || null,
    tc_person: fields.tc_person || null, r_person: fields.r_person || null,
    category: fields.category || null, content: fields.content || null
  };
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases', {
    method: 'post', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('INSERT失敗: ' + res.getResponseCode() + ' ' + res.getContentText());
  else Logger.log('案件登録: ' + fields.theater + ' / ' + (fields.content || '').slice(0, 30));
}

// ===== 共通: Anthropic呼び出し / JSON抽出 =====
function anthropicText_(apiKey, system, user, maxTokens) {
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL_(), max_tokens: maxTokens || 500, system: system,
      messages: [{ role: 'user', content: user }]
    }),
    muteHttpExceptions: true
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
  var cs = fetchTheaterCases_('TOHOシネマズ 川崎');
  Logger.log('Supabase接続テスト（川崎の既存案件）: ' + cs.length + '件');
  Logger.log('ANTHROPIC_API_KEY: ' + (cfg_('ANTHROPIC_API_KEY') ? 'あり' : 'なし') +
    ' / SUPABASE_SERVICE_ROLE_KEY: ' + (cfg_('SUPABASE_SERVICE_ROLE_KEY') ? 'あり' : 'なし'));
}
