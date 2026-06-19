// Supabase Database Webhook → LINEグループ通知
//
// 必須 ENV:
//   SUPABASE_WEBHOOK_SECRET   - Supabase Webhook の HTTP Header に同じ値を設定
//   LINE_CHANNEL_ACCESS_TOKEN - LINE Messaging API のチャネルアクセストークン
//   LINE_TARGET_GROUP_ID      - 通知先のLINEグループID
//   ANTHROPIC_API_KEY         - Anthropic Console で発行したAPIキー（任意。未設定ならAI判断はスキップ）
//
// 動作:
//   - INSERT (新規案件): Claude APIで「優先度・相談先・初動メモ」を生成し、AI初期対応案つきで通知
//   - UPDATE (既存案件): 内容 / メモ / ステータス が変わった時だけ、変更内容を通知（AIは使わない）
//   いずれも x-webhook-secret を検証し、LINE Messaging API の push でグループへ投稿する。
//
// Supabase Webhook ペイロード例:
//   INSERT: { "type": "INSERT", "table": "cases", "record": {...} }
//   UPDATE: { "type": "UPDATE", "table": "cases", "record": {...}, "old_record": {...} }
//   ※ UPDATE/DELETE で old_record を受け取るには、Supabaseのテーブルで
//     「REPLICA IDENTITY FULL」が必要（Database Webhook作成時に自動設定される）。

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
  if (payload.table !== 'cases' || !payload.record) {
    // 対象外のイベントは黙って 200 を返す
    return res.status(200).json({ skipped: true });
  }
  const c = payload.record;

  // ── 新規登録（INSERT）: AI初期対応判断つきで通知 ──
  if (payload.type === 'INSERT') {
    let aiAdvice = '';
    try {
      aiAdvice = await getInitialResponseAdvice(c);
    } catch (e) {
      console.error('AI判断エラー', e);
      aiAdvice = `(AI判断エラー: ${e.message})`;
    }
    const text = buildLineMessage(c, aiAdvice);
    try {
      await pushLineMessage(process.env.LINE_TARGET_GROUP_ID, text);
    } catch (e) {
      console.error('LINE push エラー', e);
      return res.status(500).json({ ok: false, error: 'LINE push failed', detail: e.message });
    }
    return res.status(200).json({ ok: true });
  }

  // ── 更新（UPDATE）: 内容 / メモ / ステータス が変わった時だけ通知（AIなし） ──
  if (payload.type === 'UPDATE') {
    const before = payload.old_record || {};
    const changes = detectChanges(before, c);
    if (changes.length === 0) {
      // 内容・メモ・ステータス以外の変更（日付入力など）は通知しない
      return res.status(200).json({ skipped: 'no relevant change' });
    }
    const text = buildUpdateMessage(c, changes);
    try {
      await pushLineMessage(process.env.LINE_TARGET_GROUP_ID, text);
    } catch (e) {
      console.error('LINE push エラー', e);
      return res.status(500).json({ ok: false, error: 'LINE push failed', detail: e.message });
    }
    return res.status(200).json({ ok: true, changed: changes.map((x) => x.label) });
  }

  // それ以外（DELETE等）は対象外
  return res.status(200).json({ skipped: true });
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

// 表示用の実効ステータス（手動上書きがあればそれを優先）
function effectiveStatus(r) {
  const ov = (r.status_override || '').trim();
  return ov || r.status || '';
}

// 内容 / メモ / ステータス の変更を検出（変わったものだけ返す）
function detectChanges(before, after) {
  const changes = [];
  if ((before.content || '') !== (after.content || '')) {
    changes.push({ label: '内容', value: (after.content || '(空)').slice(0, 300) });
  }
  if ((before.memo || '') !== (after.memo || '')) {
    changes.push({ label: 'メモ', value: (after.memo || '(空)').slice(0, 300) });
  }
  const sb = effectiveStatus(before);
  const sa = effectiveStatus(after);
  if (sb !== sa) {
    changes.push({ label: 'ステータス', value: `${sb || '(なし)'} → ${sa || '(なし)'}` });
  }
  return changes;
}

function buildUpdateMessage(c, changes) {
  const head = [
    '✏️ 案件が更新されました',
    '━━━━━━━━━━━━',
    `会社: ${c.company || '-'}`,
    `劇場: ${c.theater || '-'}`,
    `種別: ${c.category || '-'}`,
    `R担当: ${c.r_person || '-'}`,
    '',
    '【更新項目】'
  ];
  const body = changes.map((ch) => `・${ch.label}: ${ch.value}`);
  const tail = ['', '━━━━━━━━━━━━', `🔗 ${APP_URL}`];
  return [...head, ...body, ...tail].join('\n').slice(0, 4900);
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
