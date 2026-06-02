// Supabase Database Webhook → AI初期対応判断 → LINEグループ通知
//
// 必須 ENV:
//   SUPABASE_WEBHOOK_SECRET   - Supabase Webhook の HTTP Header に同じ値を設定
//   LINE_CHANNEL_ACCESS_TOKEN - LINE Messaging API のチャネルアクセストークン
//   LINE_TARGET_GROUP_ID      - 通知先のLINEグループID
//   ANTHROPIC_API_KEY         - Anthropic Console で発行したAPIキー
//
// 動作:
//   1. Supabase Webhook (INSERT on cases) からPOSTを受ける
//   2. ヘッダの x-webhook-secret を検証
//   3. Claude API で「優先度・相談先・初動メモ」を生成
//   4. LINE Messaging API の push でグループに投稿
//
// Supabase Webhook ペイロード例:
//   { "type": "INSERT", "table": "cases", "record": { ... }, "schema": "public" }

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const APP_URL = 'https://cinema-cases.vercel.app';
const AI_MODEL = 'claude-haiku-4-5-20251001';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  // 認証: ヘッダの secret 一致を要求
  const secret = req.headers['x-webhook-secret'];
  if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body || {};
  if (payload.type !== 'INSERT' || payload.table !== 'cases' || !payload.record) {
    // 対象外のイベントは黙って 200 を返す
    return res.status(200).json({ skipped: true });
  }
  const c = payload.record;

  // 1) AI初期対応判断
  let aiAdvice = '';
  try {
    aiAdvice = await getInitialResponseAdvice(c);
  } catch (e) {
    console.error('AI判断エラー', e);
    aiAdvice = `(AI判断エラー: ${e.message})`;
  }

  // 2) LINEに投稿
  const text = buildLineMessage(c, aiAdvice);
  try {
    await pushLineMessage(process.env.LINE_TARGET_GROUP_ID, text);
  } catch (e) {
    console.error('LINE push エラー', e);
    return res.status(500).json({ ok: false, error: 'LINE push failed', detail: e.message });
  }
  return res.status(200).json({ ok: true });
}

async function getInitialResponseAdvice(c) {
  if (!process.env.ANTHROPIC_API_KEY) return '(ANTHROPIC_API_KEY 未設定のため AI判断はスキップ)';

  const prompt = [
    'あなたは菱熱工業のシネマ案件管理アシスタントです。',
    '新規案件が登録されました。以下の情報をもとに、',
    '「優先度」「誰に何を相談すべきか」「初動メモ」を簡潔に判断してください。',
    '',
    '# 案件情報',
    `- 会社: ${c.company || '(未設定)'}`,
    `- 劇場: ${c.theater || '(未設定)'}`,
    `- 種別: ${c.category || '(未設定)'}`,
    `- R担当: ${c.r_person || '(未設定)'}`,
    `- 客先担当: ${c.tc_person || '(未設定)'}`,
    `- 受付日: ${c.received_date || '(未設定)'}`,
    `- 内容: ${c.content || '(未記入)'}`,
    '',
    '# 出力フォーマット（厳守）',
    '【優先度】高/中/低 - 一行で理由',
    '【相談先】箇条書きで2-3個（例: ・劇場のTC担当へ詳細ヒアリング）',
    '【初動メモ】1-2行で次のアクション',
    '',
    '簡潔に。絵文字は使わない。'
  ].join('\n');

  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.content && data.content[0] && data.content[0].text) || '(AI応答が空)';
}

function buildLineMessage(c, aiAdvice) {
  const head = [
    '📋 新規案件が登録されました',
    '━━━━━━━━━━━━',
    `会社: ${c.company || '-'}`,
    `劇場: ${c.theater || '-'}`,
    `種別: ${c.category || '-'}`,
    `R担当: ${c.r_person || '-'}`,
    `受付日: ${c.received_date || '-'}`,
    '',
    '【内容】',
    (c.content || '(未記入)').slice(0, 500)
  ];
  const tail = [
    '',
    '━━━━━━━━━━━━',
    '🤖 AI初期対応案',
    aiAdvice,
    '',
    `🔗 ${APP_URL}`
  ];
  return [...head, ...tail].join('\n').slice(0, 4900);
}

async function pushLineMessage(to, text) {
  if (!to) throw new Error('LINE_TARGET_GROUP_ID 未設定');
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
  const r = await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'text', text }]
    })
  });
  if (!r.ok) throw new Error(`LINE API ${r.status}: ${await r.text()}`);
}
