// 工事写真台帳: 写真から「工種」「場所」を AI で決める（2026-11-20）。写真は保存しない（読んで返すだけ）。
//
// 必須 ENV: ANTHROPIC_API_KEY
// Authorization: Bearer <Supabaseのユーザーaccess_token>（菱熱の人だけ）
//
// リクエスト(POST, JSON):
//   { theater, work, content, koshuList: [string],
//     history: [{ koshu, place, memo, same }],      … 前の台帳で人が付けた工種・場所（same=同じ劇場）。多いほど当たりやすくなる
//     photos: [{ id, image }] }                      … image は JPEG の base64（長い辺 640px 程度・1回 8 枚まで）
// 返り値: { results: [{ id, koshu, place, confidence }] }

import { claudeJson } from '../lib/claude.mjs';

// 写真を見て分ける: Sonnet 5.5 で十分（速さと費用）。使えない時は 1 つ前の Sonnet でやり直す
const AI_MODEL = 'claude-sonnet-5-5';
const AI_MODEL_PREV = 'claude-sonnet-4-6';
const MAX_PHOTOS = 8;

const SUPABASE_URL = 'https://hykjpadvbficiiuockhj.supabase.co';
// anon(public) キー。RLS前提の公開キーなのでコード内保持で問題なし（ユーザートークン検証用）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'koshu', 'place', 'confidence'],
        properties: {
          id: { type: 'string' },
          koshu: { type: 'string' },
          place: { type: 'string' },
          confidence: { type: 'number' }
        }
      }
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized（菱熱の人だけ使えます）' });
  try {
    return res.status(200).json(await judge(req.body || {}));
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || String(e) });
  }
}

export async function judge(body) {
  const photos = (Array.isArray(body.photos) ? body.photos : []).filter((p) => p && p.id && p.image).slice(0, MAX_PHOTOS);
  if (!photos.length) return { results: [] };
  const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const koshuList = (Array.isArray(body.koshuList) ? body.koshuList : []).map((k) => clip(k, 30)).filter(Boolean).slice(0, 60);
  const hist = (Array.isArray(body.history) ? body.history : []).slice(0, 120)
    .map((h) => `${h.same ? '［この劇場］' : '［ほかの劇場］'} 工種「${clip(h.koshu, 30)}」 場所「${clip(h.place, 40)}」${h.memo ? ` メモ「${clip(h.memo, 40)}」` : ''}`);
  const system = [
    'あなたは菱熱工業（映画館・商業施設の空調・換気設備の保守・工事会社）の工事写真台帳を手伝います。',
    '写真1枚ごとに「工種」（何の作業・設備の写真か）と「場所」（劇場の中のどこか）を決めます。',
    '工種は、なるべく次の一覧の言葉から選びます（合うものが無い時だけ、短い言葉で）: ' + (koshuList.join('／') || '仮設・養生／解体・撤去／機器据付／配管／ダクト・排気口／排気フード／送風機／電気／風量測定／試運転／その他'),
    '場所は「シアター3 天井内」「屋上 送風機まわり」「機械室」「コンセッション（売店）厨房」「ロビー」「事務所」のように短く（20字以内）。',
    '前の台帳で人が付けた工種・場所（下の「前の台帳」）があれば、同じ言い方にそろえます。特に「この劇場」のものを優先します。',
    '写真から分からない時は、場所は空文字にし、confidence を低く（0.4 未満）します。推測で作らないこと。',
    'confidence は 0〜1。'
  ].join('\n');
  const head = [
    `劇場: ${clip(body.theater, 60) || '（不明）'}`,
    `案件名: ${clip(body.work, 80) || '（不明）'}`,
    body.content ? `案件の内容: ${clip(body.content, 400)}` : '',
    hist.length ? '前の台帳（人が付けた工種・場所）:\n' + hist.join('\n') : '前の台帳: まだありません',
    '',
    '次の写真それぞれについて、id・工種・場所・confidence を返してください。'
  ].filter((x) => x !== '').join('\n');
  const content = [{ type: 'text', text: head }];
  photos.forEach((p) => {
    content.push({ type: 'text', text: `写真 id=${String(p.id)}` });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(p.image).replace(/^data:image\/\w+;base64,/, '') } });
  });
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system, content, schema: SCHEMA, maxTokens: 4000, effort: 'low' });
  if (out.error || !out.data) { const e = new Error('AI の判定に失敗しました: ' + (out.error || '答えがありません')); e.status = 502; throw e; }
  const ids = new Set(photos.map((p) => String(p.id)));
  const results = (out.data.results || []).filter((r) => r && ids.has(String(r.id))).map((r) => ({
    id: String(r.id), koshu: clip(r.koshu, 30), place: clip(r.place, 40), confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0))
  }));
  return { results };
}

async function isRyonetsuUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id && /@ryonetsu\.com$/i.test(String(u.email || '')));
  } catch (e) { return false; }
}
