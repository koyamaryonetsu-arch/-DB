/**
 * シネマ案件：Gmail → 自動 登録 / 進捗更新（cinema-cases / Supabase）
 *
 * 動作:
 *   1. Gmailの「案件登録」ラベルの新着スレッドを5分毎に読む（スレッド全体＝最初の依頼＋以降の進捗を文脈に）
 *   2. Claudeが判定: 案件依頼か? / 新規(new) か 進捗報告(progress) か / 各項目を抽出
 *   2.5 添付の見積書(画像/PDF)があればAI-OCRで 見積り名/金額/提出日 を抽出
 *   3. 同じ劇場の既存案件と照合（AIマッチング）
 *      - 一致あり かつ 進捗/見積添付 → その案件を UPDATE（見積名/金額/見積提出日/作業開始日/作業完了日/内容追記）
 *      - 一致あり かつ 新規 → 重複扱いで登録しない（担当者の手動登録を「正」とする）
 *      - 一致なし → INSERT（新規でも進捗でも「新規案件」として登録＝取りこぼし防止・見積添付も反映）
 *   4. INSERT/UPDATE すると既存 Database Webhook (case-created) が発火し LINE 通知
 *   5. 処理済みメールにはラベルを付けて再処理を防止
 *   ※ 案件と判定できないメール(is_case=false/確信度低)のみ「案件登録_要確認」で人の確認へ
 *
 * スクリプトプロパティ:
 *   ANTHROPIC_API_KEY          - Anthropic APIキー
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase の service_role キー（Settings > API）
 *   SUPABASE_URL               - (任意) 既定 https://hykjpadvbficiiuockhj.supabase.co
 *   ANTHROPIC_MODEL            - (任意) 既定 claude-haiku-4-5-20251001（本文抽出は安いHaikuで十分）
 *   ANTHROPIC_OCR_MODEL        - (任意) 既定 claude-sonnet-4-6（添付見積書の画像/PDF読取は視覚対応モデル）
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
// 添付見積書のAI-OCRは画像/PDFを読むため視覚対応モデル（既定Sonnet）を使う
function OCR_MODEL_() { return cfg_('ANTHROPIC_OCR_MODEL', 'claude-sonnet-4-6'); }
var OCR_MAX_BYTES = 5 * 1024 * 1024; // 5MB超の添付はスキップ（API上限・コスト対策）

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
      var m = msgs[msgs.length - 1];        // 最新（進捗判定・受付日フォールバック用）
      var emailText = buildThreadText_(th); // スレッド全体を文脈に（最初の依頼＋以降の進捗）

      var p = parseEmail_(emailText);
      // 方針: 要確認に回すのは「明確に案件でない」とAIが判断した時だけ。迷ったら登録する（不要なら後で削除）
      if (!p || p.is_case === false) { th.addLabel(lblSkip); nSkip++; return; }

      var received = p.received_date || Utilities.formatDate(msgs[0].getDate(), 'Asia/Tokyo', 'yyyy-MM-dd');
      var theater = p.theater || '';
      // 添付の見積書（画像/PDF）をAI-OCRで読み、見積り名・金額・提出日を抽出（無ければnull）
      var quote = extractQuoteFromAttachments_(th);
      var candidates = theater ? fetchTheaterCases_(theater) : [];
      var matched = candidates.length ? findMatch_(p, received, candidates) : null;

      if (matched) {
        if (p.intent === 'progress' || quote) {
          updateCase_(matched, p.progress || {}, p.content, quote);  // 進捗/見積 → 既存案件を更新
          th.addLabel(lblUpd); nUpd++;
        } else {
          th.addLabel(lblDup); nDup++;                         // 新規のつもりだが既存あり → 手動優先で登録せず
          Logger.log('重複のため登録せず（手動優先）: ' + (p.title || m.getSubject()));
        }
      } else {
        // 該当案件が無ければ、新規でも進捗報告でも「新規案件」として登録（取りこぼし防止）
        insertCase_({
          company: normalizeCompany_(p.company), theater: theater, received_date: received,
          tc_person: p.tc_person || '', r_person: p.r_person || '',
          category: normalizeCategory_(p.category), content: p.content || m.getPlainBody().slice(0, 1500),
          estimate_name: quote ? quote.estimate_name : '',
          estimate_amount: quote ? quote.estimate_amount : '',
          quote_date: quote ? quote.quote_date : ''
        });
        th.addLabel(lblDone); nNew++;
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
// スレッド全体を1つのテキストに（最初の依頼＋以降のやり取り）。長すぎる場合は先頭優先で丸める
function buildThreadText_(th) {
  var msgs = th.getMessages();
  var out = '件名: ' + msgs[0].getSubject() + '\n';
  for (var i = 0; i < msgs.length; i++) {
    var mm = msgs[i];
    out += '\n--- メッセージ' + (i + 1) + ' ---\n差出人: ' + mm.getFrom() +
      ' / 日時: ' + Utilities.formatDate(mm.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm') + '\n' + mm.getPlainBody();
    if (out.length > 8000) { out = out.slice(0, 8000); break; }
  }
  return out;
}
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
    '&select=id,received_date,category,content,memo,status,r_person,estimate_name,estimate_amount,quote_date,work_start_date,work_end_date' +
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
  // 添付見積書のOCR結果があれば書き込む（空はnullでスキップ）
  if (f.estimate_name) body.estimate_name = f.estimate_name;
  if (f.estimate_amount) body.estimate_amount = normalizeAmount_(f.estimate_amount);
  if (f.quote_date) body.quote_date = f.quote_date;
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases', {
    method: 'post', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('INSERT失敗: ' + res.getContentText());
  else Logger.log('新規登録: ' + f.theater + ' / ' + String(f.content || '').slice(0, 30));
}

// ===== Supabase: 進捗UPDATE（該当案件に日付/内容を反映） =====
function updateCase_(matched, prog, summary, quote) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) return;
  var patch = {};
  // 日付は「まだ空」の項目に記入（既存値は上書きしない＝手動入力を尊重）
  if (prog.quote_date && !matched.quote_date) patch.quote_date = prog.quote_date;
  if (prog.work_start_date && !matched.work_start_date) patch.work_start_date = prog.work_start_date;
  if (prog.work_end_date && !matched.work_end_date) patch.work_end_date = prog.work_end_date;
  // 添付見積書のOCR結果（見積り名/金額/提出日）も、空の項目のみ記入
  if (quote) {
    if (quote.estimate_name && !matched.estimate_name) patch.estimate_name = quote.estimate_name;
    if (quote.estimate_amount && (matched.estimate_amount === null || matched.estimate_amount === undefined || matched.estimate_amount === ''))
      patch.estimate_amount = normalizeAmount_(quote.estimate_amount);
    if (quote.quote_date && !matched.quote_date && !patch.quote_date) patch.quote_date = quote.quote_date;
  }
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

// ===== 添付見積書のAI-OCR =====
// スレッド内の添付（画像/PDF）を走査し、最初に読めた見積書から
// {estimate_name, estimate_amount, quote_date} を返す。見つからなければ null。
function extractQuoteFromAttachments_(th) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  var msgs = th.getMessages();
  for (var i = 0; i < msgs.length; i++) {
    var atts = msgs[i].getAttachments({ includeInlineImages: true, includeAttachments: true });
    for (var j = 0; j < atts.length; j++) {
      var a = atts[j];
      var ct = String(a.getContentType() || '').toLowerCase();
      var isImg = ct.indexOf('image/') === 0;
      var isPdf = ct === 'application/pdf';
      if (!isImg && !isPdf) continue;                 // 見積書になり得るのは画像/PDFのみ
      if (a.getSize() > OCR_MAX_BYTES) { Logger.log('添付が大きすぎOCRスキップ: ' + a.getName()); continue; }
      var block = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Utilities.base64Encode(a.getBytes()) } }
        : { type: 'image', source: { type: 'base64', media_type: normalizeImageMime_(ct), data: Utilities.base64Encode(a.getBytes()) } };
      var q = ocrQuote_(apiKey, block);
      if (q && (q.estimate_name || q.estimate_amount || q.quote_date)) {
        Logger.log('見積OCR成功: ' + a.getName() + ' → ' + JSON.stringify(q));
        return q;
      }
    }
  }
  return null;
}
// Anthropic API が受け付ける画像MIMEに寄せる（未対応は jpeg 扱い）
function normalizeImageMime_(ct) {
  if (ct.indexOf('png') >= 0) return 'image/png';
  if (ct.indexOf('gif') >= 0) return 'image/gif';
  if (ct.indexOf('webp') >= 0) return 'image/webp';
  return 'image/jpeg';
}
// 1件の添付（画像/PDFブロック）を視覚モデルでOCR。見積書でなければ空を返す。
function ocrQuote_(apiKey, mediaBlock) {
  var sys =
    'あなたは見積書の読み取りアシスタントです。画像/PDFを読み、JSONのみ出力（前後に文章なし）。\n' +
    'これが見積書（御見積書/お見積り/Quotation等）でなければ is_quote=false を返す。\n' +
    '見積書なら次を抽出: estimate_name=工事名/件名/工事件名（無ければ主な品目を要約）, ' +
    'estimate_amount=見積合計金額の数値のみ（税込があれば税込・カンマや¥や円は除く・整数）, ' +
    'quote_date=見積書の発行日/日付をYYYY-MM-DD。読めない項目は空文字。\n' +
    'スキーマ: {"is_quote":bool,"estimate_name":string,"estimate_amount":string,"quote_date":"YYYY-MM-DD"}';
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: OCR_MODEL_(), max_tokens: 400, system: sys,
      messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: 'この書類を読み取ってJSONで返してください。' }] }]
    }), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('OCR失敗: ' + res.getContentText()); return null; }
  var data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { return null; }
  var txt = (data.content && data.content[0] && data.content[0].text) || '';
  var j = safeJson_(txt);
  if (!j || j.is_quote === false) return null;
  return { estimate_name: j.estimate_name || '', estimate_amount: j.estimate_amount || '', quote_date: j.quote_date || '' };
}
// 「¥1,234,000」「1,234,000円」等 → 数値。変換できなければ null（送信しない）
function normalizeAmount_(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).replace(/[^0-9.]/g, '');
  if (!s) return null;
  var n = Number(s);
  return isNaN(n) ? null : n;
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
