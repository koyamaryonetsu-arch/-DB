// 見積りAI-OCR: 画像/PDF を Claude(ビジョン)で読み取り、見積り名・金額・提出日を返す。
// ファイルは保存しない（メモリ上で処理して破棄）。
//
// 必須 ENV: ANTHROPIC_API_KEY
//
// リクエスト(POST, JSON): { fileBase64: string, mediaType: string }
//   mediaType 例: image/jpeg / image/png / image/webp / application/pdf
//   Authorization: Bearer <Supabaseのユーザーaccess_token>（ログイン中ユーザーのみ許可）
// レスポンス(JSON): { ok, estimate_name, estimate_amount, quote_date }

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-sonnet-4-6';
const SUPABASE_URL = 'https://hykjpadvbficiiuockhj.supabase.co';
// anon(public) キー。RLS前提の公開キーなのでコード内保持で問題なし（ユーザートークン検証用）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // 認証: ログイン中ユーザーのみ（Supabaseのaccess_tokenを検証）
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !(await isValidUser(token))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { fileBase64, mediaType } = req.body || {};
  if (!fileBase64 || !mediaType) return res.status(400).json({ error: 'fileBase64 と mediaType が必要です' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 未設定' });

  // 画像 or PDF のコンテンツブロックを組み立て
  let mediaBlock;
  if (mediaType.indexOf('image/') === 0) {
    mediaBlock = { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } };
  } else if (mediaType === 'application/pdf') {
    mediaBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } };
  } else {
    return res.status(400).json({ error: '対応形式は画像(JPEG/PNG/WebP)またはPDFです' });
  }

  const prompt = [
    'これは設備工事の見積書です。内容を読み取り、JSONのみ出力してください（前後に文章を付けない）。',
    'スキーマ: {"estimate_name": string(見積書の件名/工事名), ' +
      '"estimate_amount": number(合計金額。税込があれば税込。円の整数、カンマや通貨記号なし。読めなければ null), ' +
      '"quote_date": string(見積日/提出日 YYYY-MM-DD。無ければ空文字)}',
    '金額は数値のみ。日付は西暦YYYY-MM-DD。'
  ].join('\n');

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: prompt }] }]
      })
    });
    if (!r.ok) return res.status(502).json({ error: `Anthropic ${r.status}: ${await r.text()}` });
    const data = await r.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '';
    const parsed = safeJson(text);
    if (!parsed) return res.status(502).json({ error: 'AI応答を解析できませんでした', raw: text });
    return res.status(200).json({
      ok: true,
      estimate_name: parsed.estimate_name || '',
      estimate_amount: (parsed.estimate_amount == null ? '' : parsed.estimate_amount),
      quote_date: parsed.quote_date || ''
    });
  } catch (e) {
    return res.status(500).json({ error: 'OCR失敗', detail: e.message });
  }
}

// Supabaseのユーザートークンが有効か（ログイン中ユーザーか）検証
async function isValidUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id);
  } catch (e) { return false; }
}

function safeJson(txt) {
  if (!txt) return null;
  const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(txt.slice(s, e + 1)); } catch (err) { return null; }
}
