/** LINE Messaging API ヘルパー（reply中心＝無料枠を消費しない想定） */

function lineReply_(replyToken, messages) {
  var token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) throw new Error('スクリプトプロパティ LINE_CHANNEL_ACCESS_TOKEN が未設定です（導入手順書 手順4）');
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ replyToken: replyToken, messages: messages }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    console.error('LINE reply error: ' + res.getResponseCode() + ' ' + res.getContentText());
  }
}

function replyText_(replyToken, text) {
  var t = String(text);
  if (t.length > 4900) t = t.slice(0, 4900) + '…';
  lineReply_(replyToken, [{ type: 'text', text: t }]);
}
