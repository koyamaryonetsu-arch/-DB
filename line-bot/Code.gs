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

// ===== セットアップ補助 =====
// 一度だけ手動実行して、1分毎の監視トリガーを作成する
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkNewCases') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkNewCases').timeBased().everyMinutes(1).create();
  Logger.log('checkNewCases を1分毎に実行するトリガーを作成しました。');
}

// 接続テスト（Notion / LINE設定の確認用）
function testConnections() {
  var pages = notionQueryNewCases_(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  Logger.log('Notion直近30日の案件数: ' + pages.length);
  Logger.log('LINE_GROUP_ID: ' + (cfg_('LINE_GROUP_ID') || '(未設定)'));
}
