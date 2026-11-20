// 安全書類・大口予算書の作成（AI）（2026-11-20）。ファイルは保存しない（読んで返すだけ）。
//
// 必須 ENV: ANTHROPIC_API_KEY
// Authorization: Bearer <Supabaseのユーザーaccess_token>（菱熱の人だけ）
//
// リクエスト(POST, JSON): { action, ... }
//   action = 'fill'      … Excel のひな形に書き込むセルを返す
//            { template: { name, kind: 'ryonetsu'|'vendor'|'budget', sheets }, data, instruction? }
//            sheets は各シートの「行n: A1="…" B1=(式)…」の文字（結合セルも）。data は工事・会社・作業員・金額などの JSON
//            → { entries: [{ sheet, cell, value, label }], unfilled: [string], warnings: [string] }
//   action = 'emergency' … 劇場の住所から、管轄の警察署・消防署・労働基準監督署・救急病院・電力・ガス・水道の連絡先を調べる（Web 検索）
//            { theater, address } → { items: { police|fire|labor|hospital|power|gas|water: { name, tel, note } }, notes }
//   action = 'roster'    … 協力会社からもらった作業員名簿（Excel の文字・PDF/写真の画像）から作業員を読み取る
//            { sheets?, images?: [base64 jpeg] } → { workers: [{ … }] }

import { claudeJson } from '../lib/claude.mjs';

const AI_MODEL = 'claude-opus-5-5';          // 書式に書き込む・名簿を読む: 正確さ優先
const AI_MODEL_PREV = 'claude-sonnet-5-5';
const SEARCH_MODEL = 'claude-sonnet-5-5';    // 連絡先を調べる: Sonnet で十分
const SEARCH_MODEL_PREV = 'claude-sonnet-4-6';

const SUPABASE_URL = 'https://hykjpadvbficiiuockhj.supabase.co';
// anon(public) キー。RLS前提の公開キーなのでコード内保持で問題なし（ユーザートークン検証用）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';

const httpErr = (status, msg) => Object.assign(new Error(msg), { status });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized（菱熱の人だけ使えます）' });
  const body = req.body || {};
  try {
    if (body.action === 'fill') return res.status(200).json(await fill(body));
    if (body.action === 'emergency') return res.status(200).json(await emergency(body));
    if (body.action === 'roster') return res.status(200).json(await roster(body));
    return res.status(400).json({ error: 'action が正しくありません' });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || String(e) });
  }
}

// ---------- 書式に書き込む ----------
const FILL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['entries', 'unfilled', 'warnings'],
  properties: {
    entries: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['sheet', 'cell', 'value', 'label'],
      properties: { sheet: { type: 'string' }, cell: { type: 'string' }, value: { type: 'string' }, label: { type: 'string' } } } },
    unfilled: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } }
  }
};
export async function fill(body) {
  const t = body.template || {};
  const sheets = String(t.sheets || '').slice(0, 120000);
  if (!sheets) throw httpErr(400, 'ひな形の中身がありません');
  const kind = t.kind === 'budget' ? 'budget' : t.kind === 'vendor' ? 'vendor' : 'ryonetsu';
  const system = [
    'あなたは菱熱工業株式会社（映画館・商業施設の空調・換気設備の工事会社。元請）の工事書類係です。',
    kind === 'budget'
      ? '社内の「大口工事予算書（工事原価管理表）」の Excel ひな形に、data の内容を書き込むセルを返します。'
      : '建設工事の安全書類（全建統一様式など）の Excel ひな形に、data の内容を書き込むセルを返します。',
    '決まり:',
    '・書くのは「様式書類」など入力用のシートだけ。「記載例」「記入要領」など見本・説明のシートには書かない（隠しシートにも書かない）。記載例は書き方の手本にする。',
    '・ラベルのセル（「工事名」「年」「月」「日」「殿」「㊞」など印字された文字）は変えない。ラベルの横・下の空いた入力用のセルに書く。結合セルは左上のセルを指定する。',
    '・(式) と付いたセルには書かない（計算はひな形の式に任せる）。',
    '・年・月・日が別々のセルに分かれている欄は、それぞれのセルに数字だけを書く（記載例と同じ形。年は西暦の4桁。記載例が和暦なら和暦）。',
    '・ひな形に前の工事の内容（別の劇場名・前の工事名・前の日付・前の会社名・前の人の名前・電話番号）が入っている入力セルは、今回の内容で上書きする。今回の内容が無い欄は value を空文字にして消す（ラベルは消さない）。',
    '・○で囲む・□に印を付ける欄は、記載例のやり方に合わせる（例:「■」に変える・選んだ語だけ残す）。分からなければ unfilled に入れる。',
    '・使わない届（火気・車両・持込機械など data で used=false のもの）は、主な欄（使用場所・車種・機械名など）に「該当なし」と書き、ほかの欄は空にする。',
    '・人の個人情報は data にあるものだけ書く。無い情報を作らない。分からない欄・協力会社や劇場が書く欄・押印の欄は書かずに unfilled に「欄の名前（理由）」を入れる。',
    kind === 'vendor' ? '・この書類は協力会社ごとの書類。data.company の会社・その作業員・その会社の届の内容だけを書く。元請（菱熱）の欄は data.ryonetsu から書く。' : '',
    kind === 'ryonetsu' ? '・この書類は元請（菱熱）が作る書類。施工体系図は data.companies の一次・二次の関係（parent）に合わせて、一次の枠・その下の二次の枠に書く。緊急連絡体制表は data.emergency を使う。' : '',
    kind === 'budget' ? [
      '・実行予算の内訳ページ（A 空調資材費・B 空調外注費・K 共通工事）の「品名仕様及び寸法」「数量」「金額」の行に data.lines を区分ごとに上から書く。品名が空の行は支払先の名前を品名にする。数量は「1式」。',
      '・まとめの行（A・B・K の金額・計・予想原価・工事指図書金額・差額・契約金額・粗利・比率）は式が入っていれば書かない。式が無く空の時だけ data の合計を書く。',
      '・「工事指図書金額」「契約金額」は data.contract_amount（見積り金額・税抜）。工事番号・発注・支払・入金の欄は空のまま（書かない）。',
      '・註文先は data.orderer、現場名は data.site、名称は data.work_name、納期は data.due。'
    ].join('\n') : '',
    '・label は人が見て分かる欄の名前（例:「工事名称」「工期（自・年）」「作業員1 氏名」）。',
    '・warnings には、提出の前に気を付けること（例: 資格の写しを付ける・押印が要る・二次の会社の書類も要る）を短く入れる。'
  ].filter(Boolean).join('\n');
  const text = [
    `ひな形のファイル名: ${String(t.name || '').slice(0, 120)}`,
    'ひな形の中身（シートごと。セル番地=値。(式) は計算式のセル）:',
    sheets,
    '',
    '書き込む内容（data）:',
    JSON.stringify(body.data || {}, null, 1).slice(0, 60000),
    body.instruction ? '\n小山さんからの直しの指示: ' + String(body.instruction).slice(0, 2000) : '',
    '',
    '書き込むセル（entries）・空けた欄（unfilled）・注意（warnings）を返してください。'
  ].join('\n');
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system, content: [{ type: 'text', text }], schema: FILL_SCHEMA, maxTokens: 32000, effort: 'medium' });
  if (out.error || !out.data) throw httpErr(502, 'AI の書き込みに失敗しました: ' + (out.error || '答えがありません'));
  const d = out.data;
  return {
    entries: (d.entries || []).filter((e) => e && /^[A-Z]{1,3}\d{1,5}$/i.test(String(e.cell || '').trim())).map((e) => ({ sheet: String(e.sheet || ''), cell: String(e.cell).trim().toUpperCase(), value: String(e.value == null ? '' : e.value), label: String(e.label || '') })),
    unfilled: (d.unfilled || []).map(String).slice(0, 80),
    warnings: (d.warnings || []).map(String).slice(0, 30)
  };
}

// ---------- 緊急連絡先を調べる ----------
const CONTACT = { type: 'object', additionalProperties: false, required: ['name', 'tel', 'note'], properties: { name: { type: 'string' }, tel: { type: 'string' }, note: { type: 'string' } } };
const EMERGENCY_KEYS = ['police', 'fire', 'labor', 'hospital', 'power', 'gas', 'water'];
const EMERGENCY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items', 'notes'],
  properties: {
    items: { type: 'object', additionalProperties: false, required: EMERGENCY_KEYS, properties: Object.fromEntries(EMERGENCY_KEYS.map((k) => [k, CONTACT])) },
    notes: { type: 'string' }
  }
};
export async function emergency(body) {
  const theater = String(body.theater || '').slice(0, 80), address = String(body.address || '').slice(0, 200);
  if (!theater && !address) throw httpErr(400, '劇場名か住所を入れてください');
  const system = [
    'あなたは工事の安全書類（緊急連絡体制表）を作る手伝いをします。',
    '工事をする建物（映画館）の住所から、その場所を管轄する次の連絡先を、web_search で公式の情報を確かめて返してください。',
    'police＝管轄の警察署、fire＝管轄の消防署（本署。出張所でなく）、labor＝管轄の労働基準監督署、hospital＝近くの救急指定病院（労災病院や救命救急センターがあればそれ）、',
    'power＝電力会社（その地域の送配電・停電の窓口）、gas＝都市ガス会社（ガス漏れの窓口）、water＝水道局（その市区の窓口）。',
    'name は正式な名前、tel は代表の電話番号（市外局番から・ハイフン区切り）。note には根拠の短いメモ（例:「〇〇市の管轄一覧」）。',
    '確かめられない時は推測で書かずに name・tel を空文字にして note に理由。notes には全体の注意（例: 劇場の防災センターにも確認を）。'
  ].join('\n');
  const text = `建物: ${theater}\n住所: ${address || '（不明。建物名から住所を調べてから管轄を調べる）'}`;
  const out = await claudeJson({ model: SEARCH_MODEL, prevModel: SEARCH_MODEL_PREV, system, content: [{ type: 'text', text }], schema: EMERGENCY_SCHEMA,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }], maxTokens: 12000, effort: 'medium', maxTurns: 8 });
  if (out.error || !out.data) throw httpErr(502, '連絡先を調べられませんでした: ' + (out.error || '答えがありません'));
  return out.data;
}

// ---------- 作業員名簿を読む ----------
const WORKER_FIELDS = ['name', 'kana', 'job', 'role_marks', 'hire_date', 'exp_years', 'birth', 'address', 'tel', 'family_contact', 'family_tel',
  'health_date', 'bp_high', 'bp_low', 'blood', 'special_health_date', 'education', 'skill', 'license', 'health_ins', 'pension_ins', 'employment_ins'];
const ROSTER_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['workers', 'company'],
  properties: {
    company: { type: 'string' },
    workers: { type: 'array', items: { type: 'object', additionalProperties: false, required: WORKER_FIELDS, properties: Object.fromEntries(WORKER_FIELDS.map((k) => [k, { type: 'string' }])) } }
  }
};
export async function roster(body) {
  const images = (Array.isArray(body.images) ? body.images : []).filter(Boolean).slice(0, 10);
  const sheets = String(body.sheets || '').slice(0, 80000);
  if (!images.length && !sheets) throw httpErr(400, '名簿の中身がありません');
  const system = [
    '協力会社からもらった作業員名簿（全建統一様式第5号など）から、作業員を1人ずつ読み取ります。記載例・見本の行（「以下略」など）は読まない。',
    '項目: name 氏名／kana ふりがな／job 職種／role_marks ※欄の記号（現・主・職・安・技・女・未・基 など。複数は「・」）／hire_date 雇入年月日／exp_years 経験年数（数字）／',
    'birth 生年月日／address 現住所／tel 電話／family_contact 家族連絡先（住所や続柄）／family_tel 家族の電話／health_date 最近の健康診断日／bp_high・bp_low 血圧／blood 血液型（A・B・O・AB）／',
    'special_health_date 特殊健康診断日／education 雇入・職長・特別教育／skill 技能講習／license 免許／health_ins・pension_ins・employment_ins 社会保険（名称と番号の下4桁）。',
    '日付は YYYY-MM-DD（和暦は西暦に直す。年だけ・年月だけなら分かる所まで）。読めない項目は空文字。推測で作らない。company には名簿の会社名。'
  ].join('\n');
  const content = [{ type: 'text', text: sheets ? '名簿（Excel の中身）:\n' + sheets : '名簿の画像を読んでください。' }];
  images.forEach((im) => content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(im).replace(/^data:image\/\w+;base64,/, '') } }));
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system, content, schema: ROSTER_SCHEMA, maxTokens: 16000, effort: 'medium' });
  if (out.error || !out.data) throw httpErr(502, '名簿を読めませんでした: ' + (out.error || '答えがありません'));
  return { company: String(out.data.company || ''), workers: (out.data.workers || []).filter((w) => w && String(w.name || '').trim()) };
}

async function isRyonetsuUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id && /@ryonetsu\.com$/i.test(String(u.email || '')));
  } catch (e) { return false; }
}
