/** ラクミツ：Webhookエントリポイント */

function doGet() {
  return ContentService.createTextOutput('ラクミツ webhook OK');
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    (body.events || []).forEach(function (ev) {
      if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text') return;
      var userId = (ev.source && ev.source.userId) || 'unknown';
      try {
        handleText_(userId, ev.message.text, ev.replyToken);
      } catch (err) {
        console.error(err && err.stack ? err.stack : err);
        try {
          replyText_(ev.replyToken, '⚠️ エラーが発生しました：' + (err && err.message ? err.message : err));
        } catch (ignore) {}
      }
    });
  } catch (outer) {
    console.error(outer);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
