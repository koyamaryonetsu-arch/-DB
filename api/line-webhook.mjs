// LINE Messaging API Webhook 受信
//
// 主な役割（Phase 1）:
//   - 「id」または「ID」と送信されたら、Group ID を返す（LINE_TARGET_GROUP_ID 設定用）
//   - グループに招待された時 (join イベント) に Group ID を投稿
//
// Phase 2 で拡張予定:
//   - LINE上での「OK」「修正」返信を学習データとして Supabase に保存
//   - 自然言語からの案件登録
//
// 必須 ENV:
//   LINE_CHANNEL_SECRET       - 署名検証用
//   LINE_CHANNEL_ACCESS_TOKEN - 返信用

import crypto from 'node:crypto';

const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// 生のリクエストボディを取得するため bodyParser を無効化
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // LINE は Webhook URL の疎通確認に GET/POST 空ボディを叩くことがある → 200 で応答
  if (req.method !== 'POST') return res.status(200).end();

  // 生のbodyを取得（署名検証はバイト列単位で行う必要があるため）
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const raw = Buffer.concat(chunks);

  // 署名検証
  const sig = req.headers['x-line-signature'];
  if (!process.env.LINE_CHANNEL_SECRET) return res.status(500).json({ error: 'LINE_CHANNEL_SECRET 未設定' });
  const expected = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(raw)
    .digest('base64');
  if (sig !== expected) return res.status(401).json({ error: 'signature mismatch' });

  let body;
  try { body = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(200).end(); }

  const events = body.events || [];
  for (const ev of events) {
    try { await handleEvent(ev); }
    catch (e) { console.error('event handler error', e); }
  }
  return res.status(200).end();
}

async function handleEvent(ev) {
  const src = ev.source || {};
  const sourceId = src.groupId || src.roomId || src.userId || '';
  const sourceType = src.type || '';

  if (ev.type === 'join') {
    await reply(ev.replyToken, [
      'こんにちは。シネマ案件通知Botです。',
      '',
      `このグループの ID: ${sourceId}`,
      '',
      'Vercel の環境変数 LINE_TARGET_GROUP_ID にこのIDを設定すると、',
      '新規案件が登録された時にこのグループへ通知が届くようになります。'
    ].join('\n'));
    return;
  }

  if (ev.type === 'message' && ev.message && ev.message.type === 'text') {
    const text = ev.message.text.trim();
    if (text.toLowerCase() === 'id') {
      await reply(ev.replyToken, [
        `Source Type: ${sourceType}`,
        `Source ID: ${sourceId}`,
        '',
        'LINE_TARGET_GROUP_ID には Source ID を設定してください。'
      ].join('\n'));
      return;
    }
    if (text === 'ping') {
      await reply(ev.replyToken, 'pong');
      return;
    }
    // 他のテキストは Phase 1 では無応答（LINE Bot の自動応答を切るのが推奨）
  }
}

async function reply(replyToken, text) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  const r = await fetch(LINE_REPLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: text.slice(0, 4900) }]
    })
  });
  if (!r.ok) console.error('LINE reply failed', r.status, await r.text());
}
