/**
 * LINE通知 5分まとめ（デバウンス）の実行トリガー
 *
 * 役割: 1分ごとに Vercel の /api/flush-notifications を叩き、
 *       「最初の更新から5分経過した案件」をまとめて1通のLINEに送らせる。
 *   - 送信本体は Vercel 側（LINEトークンはVercelにあるまま。ここでは叩くだけ）。
 *   - 認証は x-flush-key に SUPABASE_SERVICE_ROLE_KEY を送る（Vercel側の同じ値と照合）。
 *     ※ GAS が既に持っているキーを流用するので、新しい秘密情報の登録は不要。
 *
 * ※ Code.gs と同じプロジェクトに置く（cfg_ を流用）。
 * ※ 有効化: Supabaseで SETUP_NOTIFY_BATCH.sql を実行 → 本ファイルを貼付 →
 *    setupFlushTrigger() を1回実行（毎分トリガー作成）。
 */

var FLUSH_URL = 'https://cinema-cases.vercel.app/api/flush-notifications';

function flushLineNotifications() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('flush: SERVICE_ROLE_KEY未設定'); return; }
  try {
    var res = UrlFetchApp.fetch(FLUSH_URL, {
      method: 'post', headers: { 'x-flush-key': key }, muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code >= 300) Logger.log('flush失敗(' + code + '): ' + res.getContentText());
    // 正常時はログ抑制（毎分実行なのでノイズを避ける）
  } catch (e) {
    Logger.log('flush例外: ' + e);
  }
}

// 毎分トリガーを作成（既存があれば作り直す）
function setupFlushTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'flushLineNotifications') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('flushLineNotifications').timeBased().everyMinutes(1).create();
  Logger.log('flushLineNotifications を毎分実行するトリガーを作成しました。');
}
// 手動テスト用: 1回だけ叩いて結果を見る
function testFlushOnce() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  var res = UrlFetchApp.fetch(FLUSH_URL, { method: 'post', headers: { 'x-flush-key': key }, muteHttpExceptions: true });
  Logger.log('flush結果: ' + res.getResponseCode() + ' ' + res.getContentText());
}
