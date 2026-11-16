// 案件名（cases.title）を AI で付ける（TOHO の要望 2026-11-16）
//   案件名＝内容から「どこでどうなった（何をする）」だけ。例: 「昨日からシアター7で空調機が冷えなくなった。赤点滅はしている」→「シアター7空調機冷えない」
//
//   { text, category }          … 文章から案件名を1つ作って返す（保存しない）。編集パネルの「🤖 内容から作る」
//   { ids: [...] }              … その案件の案件名を作って保存する（案件名が空の時だけ。force: true なら作り直す）
//   { fill: true }              … 案件名が空の案件を、古い順に BATCH 件ずつ作って保存する（残りの数を返す）
//
// 認証: Authorization: Bearer <Supabaseのユーザーaccess_token>（@ryonetsu.com）
//       または x-flush-key = SUPABASE_SERVICE_ROLE_KEY（GAS から）
// 必須 ENV: ANTHROPIC_API_KEY / SUPABASE_SERVICE_ROLE_KEY /（任意）SUPABASE_URL

import { claudeJson } from '../lib/claude.mjs';

const AI_MODEL = 'claude-sonnet-5-5';
const AI_MODEL_PREV = 'claude-sonnet-5';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';
const BATCH = 40;
const MAX_TITLE = 30;

function sbHeaders(extra) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Object.assign({ apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, extra || {});
}
async function sbGet(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`取得に失敗 (${r.status}): ${await r.text()}`);
  return r.json();
}
async function sbPatch(q, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { method: 'PATCH', headers: sbHeaders({ Prefer: 'return=minimal' }), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`更新に失敗 (${r.status}): ${await r.text()}`);
}
const enc = encodeURIComponent;

export const TITLE_SYSTEM = [
  'あなたは、映画館（シネコン）の空調設備の保守・工事会社「菱熱工業」で、案件の一覧に出す「案件名」を付ける担当者です。',
  '案件名は、案件の「内容」から「どこで・どうなった（何をする）」だけを短く書いたもの。20字以内。',
  '・劇場名・会社名・日付・人の名前・敬語・「〜の件」「対応」などの余計な言葉は入れない（劇場は別の列にある）。',
  '・場所はシアター番号（「シアター7」「SCR3」は書いてある方で）・部屋（映写室・ロビー・売店・トイレ・機械室など）・設備（空調機・室外機・GHP・チラー・換気扇など）。',
  '・症状は短い言葉で（冷えない・暖まらない・異音・水漏れ・停止・エラー・臭い など）。工事・見積り・点検なら作業の名前（例: GHP更新工事・換気扇交換・定期点検）。',
  '例: 「昨日からシアター7で空調機が冷えなくなった。エラーは出ているかどうかわからない。赤点滅はしている。」→「シアター7空調機冷えない」',
  '例: 「SCR3 系統の GHP16-1 室外機の更新。現地調査済み・見積り提出済み」→「SCR3 GHP16-1更新」',
  '例: 「ロビーのトイレで天井から水が落ちてくる」→「ロビートイレ天井水漏れ」',
  '内容が空・あいまいな時は、種別から短く（例: 定期点検・修理）。決まった JSON の形で答える。'
].join('\n');
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['titles'],
  properties: { titles: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'title'], properties: { id: { type: 'string' }, title: { type: 'string' } } } } }
};
const clean = (t) => String(t || '').replace(/[\r\n]+/g, ' ').replace(/^[「『"]|[」』"]$/g, '').trim().slice(0, MAX_TITLE);

// items: [{ id, content, category }] → { id: title }
export async function makeTitles(items, call) {
  if (!items.length) return {};
  const content = items.map((x) => `- id=${x.id}　種別: ${x.category || '（なし）'}\n  内容: ${String(x.content || '').replace(/\s+/g, ' ').slice(0, 600) || '（空）'}`).join('\n');
  const out = await (call || claudeJson)({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: TITLE_SYSTEM, content: '次の案件に、それぞれ案件名を付けてください。id はそのまま返す。\n\n' + content, schema: SCHEMA, effort: 'low', maxTokens: 8000 });
  if (out.error) throw new Error(out.error);
  const map = {};
  ((out.data && out.data.titles) || []).forEach((t) => { if (t && t.id) map[t.id] = clean(t.title); });
  return map;
}

async function isRyonetsuUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id && /@ryonetsu\.com$/i.test(String(u.email || '')));
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const body = req.body || {};
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const flush = String(req.headers['x-flush-key'] || '');
  const fromGas = !!(svc && flush && flush === svc);
  if (!fromGas) {
    const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
    if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 未設定' });
  try {
    if (typeof body.text === 'string') {
      const map = await makeTitles([{ id: 'x', content: body.text, category: body.category || '' }]);
      return res.status(200).json({ ok: true, title: map.x || '' });
    }
    if (!svc) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 未設定' });
    let rows = [];
    if (Array.isArray(body.ids) && body.ids.length) {
      const ids = body.ids.map(String).filter((x) => /^[\w-]{1,64}$/.test(x)).slice(0, BATCH);
      if (!ids.length) return res.status(400).json({ error: 'ids が正しくありません' });
      rows = await sbGet(`cases?id=in.(${ids.map(enc).join(',')})&select=id,content,category,title`);
      if (!body.force) rows = rows.filter((r) => !String(r.title || '').trim());
    } else if (body.fill) {
      rows = await sbGet(`cases?or=(title.is.null,title.eq.)&select=id,content,category,title&order=received_date.asc.nullsfirst&limit=${BATCH}`);
    } else return res.status(400).json({ error: 'text・ids・fill のどれかを送ってください' });
    const map = await makeTitles(rows.map((r) => ({ id: String(r.id), content: r.content, category: r.category })));
    let done = 0;
    for (const r of rows) {
      const t = map[String(r.id)];
      if (!t) continue;
      await sbPatch(`cases?id=eq.${enc(r.id)}`, { title: t });
      done++;
    }
    let remaining = null;
    if (body.fill) {
      const rest = await fetch(`${SUPABASE_URL}/rest/v1/cases?or=(title.is.null,title.eq.)&select=id`, { headers: sbHeaders({ Prefer: 'count=exact', Range: '0-0' }) });
      const cr = rest.headers.get('content-range') || '';
      remaining = Number(cr.split('/')[1]) || 0;
    }
    return res.status(200).json({ ok: true, done, titles: map, remaining, model: AI_MODEL });
  } catch (e) {
    console.error('case-title', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
