/**
 * シネマPJ「新規案件 → 初期対応診断」LINEボット（方式B / 完全自動）
 *
 * 動作:
 *  1) checkNewCases()  … 時間トリガー（1〜5分毎）で Notion「TOHO修理案件管理」を監視。
 *                        新規案件を検知したら Claude API で初期対応診断を生成し、LINEグループへ自動push。
 *  2) doPost(e)        … LINE Webhook。グループのgroupIdを自動取得し、
 *                        グループ内で「診断」等と聞かれたらClaude APIで応答（任意機能）。
 *
 * 設定値は「プロジェクトの設定 > スクリプト プロパティ」に登録する（コードに直書きしない）:
 *  - NOTION_TOKEN                  Notion内部インテグレーションのトークン (secret_...)
 *  - NOTION_DATABASE_ID            8701f28e-f978-49b8-be18-17ce9f9cbd44
 *  - ANTHROPIC_API_KEY             Anthropic APIキー (sk-ant-...)
 *  - LINE_CHANNEL_ACCESS_TOKEN     LINE Messaging API のチャネルアクセストークン
 *  - LINE_GROUP_ID                 (任意) 送信先グループID。未設定でもボットがグループ参加時に自動保存する。
 *  - ANTHROPIC_MODEL               (任意) 既定 claude-sonnet-4-6
 */

// ===== 設定の取得 =====
function cfg_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  return (v === null || v === '') ? (fallback === undefined ? '' : fallback) : v;
}
function setProp_(key, val) {
  PropertiesService.getScriptProperties().setProperty(key, val);
}

var NOTION_VERSION = '2022-06-28';
var MODEL = function () { return cfg_('ANTHROPIC_MODEL', 'claude-sonnet-4-6'); };

// シネマPJ 初期対応診断のルーティング知識（Claudeへのシステムプロンプトに使用）
var ROUTING_KNOWLEDGE =
  'あなたはシネマPJの「初期対応診断」担当です。新規案件を受け、誰に・何を・どの順で相談すべきかを即断するための短い診断を返します。\n' +
  'メンバーと守備範囲:\n' +
  '- 金子さん: TOHO一次窓口・市川/横浜・事務調整（受付窓口、見積/請求/顧客連絡、配管/計画書）\n' +
  '- 細萱さん(修治): 技術判断・大型/緊急・空調熱源（空調/チラー/GHP/熱源/スプリンクラー/防災、緊急故障の技術ジャッジ）\n' +
  '- 山口くん: 現場対応・見積作成（現地調査/訪問/見積、夜間/応急の現場手配）\n' +
  '- 若山くん(駿): LED更新・ユナイテッドシネマ系・協力会社調整\n' +
  '- 大和さん: 裏方サポート・事務・AI活用（請求書/原価/書類、18時退社制約あり）\n' +
  '- 小山さん(PJリーダー): 全体統括・価格/方針・エスカレーション先（500万円超の大型/価格交渉/方針未確定/TOHO本社青木さん対応）\n' +
  '出力は日本語・スマホで一目で読める短さ。緊急度は 🔴至急(故障停止/ガス漏れ/水漏れ/安全防災/興行影響)・🟡通常・⚪情報共有 から1つ。';

// ===== 1) 新規案件の自動検知＆push =====
function checkNewCases() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return; // 多重起動防止
  try {
    var lastIso = cfg_('LAST_CHECK_ISO', '');
    var sinceIso = lastIso || new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // 初回は過去24h
    var pages = notionQueryNewCases_(sinceIso);

    var notified = JSON.parse(cfg_('NOTIFIED_IDS', '[]'));
    var notifiedSet = {};
    notified.forEach(function (id) { notifiedSet[id] = true; });

    var maxCreated = sinceIso;
    var sentCount = 0;

    pages.forEach(function (page) {
      if (notifiedSet[page.id]) return;               // 二重通知防止
      var c = page.created_time;
      if (c > maxCreated) maxCreated = c;

      var info = extractCase_(page);
      var diagnosis = generateDiagnosis_(info);
      var text = buildLineMessage_(info, diagnosis);
      linePush_(text);
      sentCount++;

      notified.push(page.id);
    });

    // 状態を更新（直近200件のIDだけ保持）
    if (notified.length > 200) notified = notified.slice(notified.length - 200);
    setProp_('NOTIFIED_IDS', JSON.stringify(notified));
    setProp_('LAST_CHECK_ISO', maxCreated);

    Logger.log('checkNewCases: %s件 push（since %s）', sentCount, sinceIso);
  } catch (err) {
    Logger.log('checkNewCases error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

// Notion: 指定時刻以降に「作成」された案件ページを取得
function notionQueryNewCases_(sinceIso) {
  var dbId = cfg_('NOTION_DATABASE_ID');
  var url = 'https://api.notion.com/v1/databases/' + dbId + '/query';
  var payload = {
    filter: { timestamp: 'created_time', created_time: { on_or_after: sinceIso } },
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    page_size: 25
  };
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + cfg_('NOTION_TOKEN'),
      'Notion-Version': NOTION_VERSION
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    Logger.log('Notion query失敗: ' + res.getResponseCode() + ' ' + res.getContentText());
    return [];
  }
  return JSON.parse(res.getContentText()).results || [];
}

// Notionページから案件情報を抽出
function extractCase_(page) {
  var p = page.properties || {};
  function selName(prop) { return (p[prop] && p[prop].select && p[prop].select.name) || ''; }
  function richText(prop) {
    var arr = (p[prop] && p[prop].rich_text) || [];
    return arr.map(function (t) { return t.plain_text; }).join('');
  }
  function titleText(prop) {
    var arr = (p[prop] && p[prop].title) || [];
    return arr.map(function (t) { return t.plain_text; }).join('');
  }
  function dateStart(prop) { return (p[prop] && p[prop].date && p[prop].date.start) || ''; }

  return {
    id: page.id,
    url: page.url,
    name: titleText('案件名') || '(案件名未設定)',
    theater: selName('劇場'),
    content: richText('内容'),
    hqStaff: selName('TOHO本社担当'),
    status: selName('進捗'),
    received: dateStart('受付日'),
    estimate: selName('見積')
  };
}

// Claude APIで初期対応診断を生成（緊急度 / まず誰に相談 / 次の一手）
function generateDiagnosis_(info) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  var userMsg =
    '次の新規案件について初期対応診断を作成してください。\n\n' +
    '劇場: ' + (info.theater || '不明') + '\n' +
    '案件名: ' + info.name + '\n' +
    '内容: ' + (info.content || '(記載なし)') + '\n' +
    '本社担当: ' + (info.hqStaff || '不明') + '\n' +
    '進捗: ' + (info.status || '不明') + ' / 見積: ' + (info.estimate || '不明') + '\n\n' +
    '次のフォーマットで簡潔に出力（前置き不要）:\n' +
    '緊急度: <🔴至急|🟡通常|⚪情報共有> （一言理由）\n' +
    'まず相談: <氏名>（理由を一言）\n' +
    'サポート: <氏名 or なし>\n' +
    '次の一手: <1〜3個を「/」区切りで>';

  if (!apiKey) {
    // APIキー未設定時はルールベースの簡易診断にフォールバック
    return ruleBasedDiagnosis_(info);
  }
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL(),
      max_tokens: 400,
      system: ROUTING_KNOWLEDGE,
      messages: [{ role: 'user', content: userMsg }]
    }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    Logger.log('Anthropic失敗: ' + res.getResponseCode() + ' ' + res.getContentText());
    return ruleBasedDiagnosis_(info);
  }
  var data = JSON.parse(res.getContentText());
  return (data.content && data.content[0] && data.content[0].text) || ruleBasedDiagnosis_(info);
}

// APIキーが無い/失敗時の簡易ルーティング
function ruleBasedDiagnosis_(info) {
  var c = (info.content || '') + ' ' + info.name;
  var urgent = /故障|停止|ガス漏れ|水漏れ|漏れ|緊急|至急|異音|発煙|火/.test(c);
  var tech = /空調|チラー|GHP|熱源|冷温水|スプリンクラー|防災|配管|映写|系統/.test(c);
  var money = /見積|請求|原価|金額|費用/.test(c);
  var lead = /大型|500万|価格|方針|青木/.test(c);
  var urgency = urgent ? '🔴至急（故障/漏れ等のため即時判断が必要）' : '🟡通常';
  var first = lead ? '小山さん（価格/方針判断）'
            : tech ? '細萱さん（技術判断）'
            : money ? '金子さん（見積/事務）'
            : '金子さん（TOHO一次窓口）';
  var support = tech ? '山口くん（現場対応/見積）' : 'なし';
  return '緊急度: ' + urgency + '\nまず相談: ' + first + '\nサポート: ' + support +
         '\n次の一手: 現地状況・型式の確認 / 訪問要否の判断 / 見積要否の確認';
}

// LINE投稿文の組み立て
function buildLineMessage_(info, diagnosis) {
  var head = /🔴/.test(diagnosis) ? '@here 至急ジャッジ希望\n' : '';
  return head +
    '🎬 新規案件\n' +
    '劇場：' + (info.theater || '—') + '\n' +
    '案件：' + info.name + '\n' +
    '内容：' + (info.content || '—') + '\n' +
    '本社担当：' + (info.hqStaff || '—') + '／受付：' + (info.received || '—') + '\n\n' +
    '🧭 初期対応診断\n' + diagnosis + '\n\n' +
    '🔗 ' + info.url;
}

// ===== LINE 送信 =====
function linePush_(text) {
  var to = cfg_('LINE_GROUP_ID');
  if (!to) { Logger.log('LINE_GROUP_ID未設定のためpushスキップ'); return; }
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + cfg_('LINE_CHANNEL_ACCESS_TOKEN') },
    payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('LINE push失敗: ' + res.getContentText());
}
function lineReply_(replyToken, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + cfg_('LINE_CHANNEL_ACCESS_TOKEN') },
    payload: JSON.stringify({ replyToken: replyToken, messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
}

// ===== 2) LINE Webhook =====
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    (body.events || []).forEach(function (ev) {
      var src = ev.source || {};
      // グループIDの自動取得・保存（初回参加/初投稿時）
      if (src.type === 'group' && src.groupId && !cfg_('LINE_GROUP_ID')) {
        setProp_('LINE_GROUP_ID', src.groupId);
        Logger.log('LINE_GROUP_ID 自動保存: ' + src.groupId);
      }
      // グループ内で「診断」と聞かれたらAI応答（任意機能）
      if (ev.type === 'message' && ev.message && ev.message.type === 'text') {
        var t = ev.message.text || '';
        if (/診断|だれに|誰に|相談/.test(t)) {
          var ans = answerQuestion_(t);
          lineReply_(ev.replyToken, ans);
        }
      }
    });
  } catch (err) {
    Logger.log('doPost error: ' + err);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function answerQuestion_(question) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return 'ルーティングの目安: 空調/熱源→細萱さん、現場/見積→山口くん、事務/請求→金子さん、価格/方針→小山さん。';
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL(),
      max_tokens: 300,
      system: ROUTING_KNOWLEDGE,
      messages: [{ role: 'user', content: question + '\n\n誰に何を相談すべきか、短く答えてください。' }]
    }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) return 'すみません、いま診断できませんでした。';
  var data = JSON.parse(res.getContentText());
  return (data.content && data.content[0] && data.content[0].text) || '（応答なし）';
}

// ===== 3) メール → 案件 自動登録（半自動化） =====
// Gmailの「案件登録」ラベルが付いたメールを読み、Claudeが内容を理解してNotionに案件を作成する。
// 作成された案件は、既存の checkNewCases() が拾って自動でLINE通知する（通知経路は一本化）。
var SRC_LABEL = '案件登録';      // 取込対象ラベル（人が転送/フィルタ/手動で付与）
var DONE_LABEL = '案件登録済';   // 処理済みラベル（再処理防止）
var SKIP_LABEL = '案件登録_要確認'; // 案件と判定できなかったメール

function importFromGmail() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var doneLabel = getOrCreateLabel_(DONE_LABEL);
    var skipLabel = getOrCreateLabel_(SKIP_LABEL);
    // 未処理（SRC_LABELあり・DONE/ SKIPなし）の新しめのスレッドを対象
    var threads = GmailApp.search(
      'label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' -label:' + SKIP_LABEL + ' newer_than:14d', 0, 20);
    if (!threads.length) { Logger.log('importFromGmail: 対象メールなし'); return; }

    var opts = notionSchemaOptions_(); // {theaters, hqStaff}
    var created = 0;

    threads.forEach(function (th) {
      var msgs = th.getMessages();
      var m = msgs[msgs.length - 1]; // スレッド最新メッセージ
      var emailText =
        '件名: ' + m.getSubject() + '\n' +
        '差出人: ' + m.getFrom() + '\n' +
        '日時: ' + m.getDate().toISOString() + '\n\n' +
        m.getPlainBody().slice(0, 6000);

      var parsed = parseCaseFromEmail_(emailText, opts);
      if (!parsed || !parsed.is_case || (parsed.confidence || 0) < 0.5) {
        th.addLabel(skipLabel); // 案件と判断できず → 人の確認へ
        return;
      }
      // 受付日が空ならメール受信日
      var received = parsed['受付日'] || Utilities.formatDate(m.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd');
      notionCreateCase_({
        name: parsed['案件名'] || m.getSubject(),
        theater: parsed['劇場'] || '',
        content: parsed['内容'] || m.getPlainBody().slice(0, 1500),
        hqStaff: parsed['TOHO本社担当'] || '',
        received: received
      });
      th.addLabel(doneLabel);
      created++;
    });
    Logger.log('importFromGmail: %s件 を案件登録しました', created);
  } catch (err) {
    Logger.log('importFromGmail error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// 案件DBの選択肢（劇場・本社担当）を取得（24hキャッシュ）。enum外の値で項目を汚さないため。
function notionSchemaOptions_() {
  var cached = cfg_('SCHEMA_OPTS_CACHE', '');
  var cachedAt = Number(cfg_('SCHEMA_OPTS_AT', '0'));
  if (cached && (Date.now() - cachedAt) < 24 * 3600 * 1000) return JSON.parse(cached);

  var dbId = cfg_('NOTION_DATABASE_ID');
  var res = UrlFetchApp.fetch('https://api.notion.com/v1/databases/' + dbId, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + cfg_('NOTION_TOKEN'), 'Notion-Version': NOTION_VERSION },
    muteHttpExceptions: true
  });
  var opts = { theaters: [], hqStaff: [] };
  if (res.getResponseCode() < 300) {
    var props = JSON.parse(res.getContentText()).properties || {};
    if (props['劇場'] && props['劇場'].select) opts.theaters = props['劇場'].select.options.map(function (o) { return o.name; });
    if (props['TOHO本社担当'] && props['TOHO本社担当'].select) opts.hqStaff = props['TOHO本社担当'].select.options.map(function (o) { return o.name; });
    setProp_('SCHEMA_OPTS_CACHE', JSON.stringify(opts));
    setProp_('SCHEMA_OPTS_AT', String(Date.now()));
  } else {
    Logger.log('スキーマ取得失敗: ' + res.getContentText());
  }
  return opts;
}

// メール本文から案件項目をClaudeで抽出（JSON）
function parseCaseFromEmail_(emailText, opts) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定のため抽出不可'); return null; }
  var sys =
    'あなたはシネコン設備の修理依頼メールを読み、案件管理DBへ登録するための項目を抽出するアシスタントです。' +
    '出力はJSONのみ（前後に文章を付けない）。\n' +
    '「劇場」は次のいずれかに完全一致させる。該当が判断できなければ空文字にする:\n' + JSON.stringify(opts.theaters) + '\n' +
    '「TOHO本社担当」は次のいずれかに完全一致、なければ空文字:\n' + JSON.stringify(opts.hqStaff) + '\n' +
    'スキーマ: {"is_case": boolean(修理/工事/設備対応の依頼か), "confidence": number(0-1), ' +
    '"案件名": string(劇場+設備+症状で簡潔に), "劇場": string, "内容": string(依頼の要点を1-3文), ' +
    '"TOHO本社担当": string, "受付日": string(YYYY-MM-DD, メール日時から)}';
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL(), max_tokens: 600, system: sys,
      messages: [{ role: 'user', content: emailText }]
    }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('抽出失敗: ' + res.getContentText()); return null; }
  var txt = (JSON.parse(res.getContentText()).content || [{}])[0].text || '';
  var s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(txt.slice(s, e + 1)); } catch (err) { Logger.log('JSON解析失敗: ' + txt); return null; }
}

// Notionに案件ページを作成
function notionCreateCase_(f) {
  var props = {
    '案件名': { title: [{ text: { content: f.name } }] },
    '内容': { rich_text: [{ text: { content: f.content } }] },
    '進捗': { select: { name: '受付済' } }
  };
  if (f.theater) props['劇場'] = { select: { name: f.theater } };
  if (f.hqStaff) props['TOHO本社担当'] = { select: { name: f.hqStaff } };
  if (f.received) props['受付日'] = { date: { start: f.received } };

  var res = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
    method: 'post', contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + cfg_('NOTION_TOKEN'), 'Notion-Version': NOTION_VERSION },
    payload: JSON.stringify({ parent: { database_id: cfg_('NOTION_DATABASE_ID') }, properties: props }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('案件作成失敗: ' + res.getContentText());
  else Logger.log('案件作成: ' + f.name);
}

// ===== セットアップ補助 =====
// 一度だけ手動実行して、監視トリガー（案件→LINE / メール→案件）を作成する
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'checkNewCases' || fn === 'importFromGmail') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkNewCases').timeBased().everyMinutes(1).create();   // Notion→LINE
  ScriptApp.newTrigger('importFromGmail').timeBased().everyMinutes(5).create(); // メール→案件
  Logger.log('トリガー作成: checkNewCases(1分毎) / importFromGmail(5分毎)');
}

// 接続テスト（Notion / LINE / Gmail設定の確認用）
function testConnections() {
  var pages = notionQueryNewCases_(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  Logger.log('Notion直近30日の案件数: ' + pages.length);
  Logger.log('LINE_GROUP_ID: ' + (cfg_('LINE_GROUP_ID') || '(未設定)'));
  var opts = notionSchemaOptions_();
  Logger.log('劇場 選択肢数: ' + opts.theaters.length + ' / 本社担当: ' + opts.hqStaff.length);
  var n = GmailApp.search('label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' newer_than:14d').length;
  Logger.log('Gmail「' + SRC_LABEL + '」未処理スレッド: ' + n);
}
