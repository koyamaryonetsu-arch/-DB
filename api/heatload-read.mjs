// 空調負荷計算: 図面・機器表・劇場のホームページを Claude（Opus）で読み取る。
//
// 必須 ENV: ANTHROPIC_API_KEY
//
// リクエスト(POST, JSON)
//   Authorization: Bearer <Supabaseのユーザーaccess_token>（@ryonetsu.com のログイン中ユーザーだけ）
//   { task, files:[{ url, mediaType, name }], rooms:[部屋の名前], url:劇場のホームページ }
//   task:
//     'th-ac'  … シアター: 空調機器表から、空調機の記号・冷房能力・どのスクリーン用か
//     'seats'  … シアター: 劇場のホームページ（施設案内）から、スクリーンごとの座席数
//     'names'  … シアター以外: 平面図から部屋の名前だけ（先に選んでもらうため）
//     'detail' … シアター以外: 選んだ部屋だけ、面積・外壁/ガラス・空調機・外調機・換気・厨房機器・出入口
//   files の url は Supabase Storage（heatload-files）の期限付きURL。ファイルはここに置かず、URL を Claude に渡す
//   （大きい図面でも Vercel の送信の上限にかからない）
// レスポンス(JSON): { ok, data }  data の形は task ごと（下のスキーマ）

import { claudeJson } from '../lib/claude.mjs';

// 図面の読み取りは難しいので、いちばん賢い Opus。使えない時は以前の Opus でやり直す
const AI_MODEL = 'claude-opus-5-5';
const AI_MODEL_PREV = 'claude-opus-5';
const SUPABASE_URL = 'https://hykjpadvbficiiuockhj.supabase.co';
// anon(public) キー。RLS前提の公開キーなのでコード内保持で問題なし（ユーザートークン検証用）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';
const FILE_PREFIX = SUPABASE_URL + '/storage/v1/object/sign/heatload-files/';
const MAX_FILES = 40;

// ---------- 答えの形（JSON スキーマ） ----------
const num = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const str = { type: 'string' };
const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });
const arr = (items) => ({ type: 'array', items });
const dirs = obj({ N: num, E: num, S: num, W: num });
const ZONE_ENUM = ['lobby', 'conc', 'back', 'proj', 'office', 'concourse', 'storage', 'theater', 'other'];
const FORM_ENUM = ['天井カセット', '天吊', '壁掛', '天井埋込ダクト', 'ビルトイン', '床置', 'その他'];

const SCHEMAS = {
  'th-ac': obj({
    screens: arr(str),
    units: arr(obj({ id: str, screen: str, cap_kw: num, maker: str, model: str, src: str, unsure: str })),
    note: str
  }),
  seats: obj({
    screens: arr(obj({ id: str, seats: { type: 'integer' } })),
    total: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    page_url: str, note: str
  }),
  names: obj({
    scale: str,
    rooms: arr(obj({ name: str, zone: { type: 'string', enum: ZONE_ENUM }, src: str })),
    note: str
  }),
  detail: obj({
    scale: str,
    rooms: arr(obj({
      name: str, zone: { type: 'string', enum: ZONE_ENUM }, area_m2: num, height_m: num,
      wall: dirs, glass: dirs, roof_m2: num, part_m2: num, people: num, src: str, unsure: str
    })),
    ac: arr(obj({ id: str, maker: str, form: { type: 'string', enum: FORM_ENUM }, cap_kw: num, room: str, src: str, unsure: str })),
    oac: obj({ found: { type: 'boolean' }, id: str, flow: num, cap_kw: num, supply_temp: num, to: arr(obj({ room: str, flow: num })), src: str }),
    exhaust: arr(obj({ id: str, kind: { type: 'string', enum: ['hood', 'other'] }, flow: num, room: str, src: str })),
    supply_fans: arr(obj({ id: str, flow: num, room: str, src: str })),
    hex: arr(obj({ id: str, flow: num, eff: num, room: str, src: str })),
    equip: arr(obj({ name: str, kw: num, qty: num, room: str, src: str, unsure: str })),
    extra: obj({ doors: num, vestibule: { anyOf: [{ type: 'boolean' }, { type: 'null' }] }, escalators: num, elevators: num, mall_open_width_m: num, src: str }),
    note: str
  })
};

const COMMON = [
  'あなたは空調設備の設計者です。映画館（シネコン）の図面・機器表を読み、決まった JSON の形で答えます。',
  '・図面に書いてある数字だけを使い、推測で埋めないこと。読めない・見つからない数値は null。',
  '・数字がかすれている・手書きの訂正がある・2通りに読める時は、unsure にその理由を短く書く（問題が無ければ空文字）。',
  '・src には「どのファイルの何ページの、どこ（表の行・記号など）」から読んだかを短く書く（例：「空調機器表.pdf p2 行3」）。',
  '・能力・電力は kW。kcal/h で書かれていたら ÷860 で kW にする。馬力しか無ければ 1馬力＝2.8kW で kW にする。',
  '・答えの文章（note・unsure・src）は日本語で短く。'
].join('\n');

const ZONE_HELP = '系統(zone)は lobby=ロビー・ホワイエ, conc=売店・コンセッション, back=コンセバック・厨房・在庫, proj=映写室, office=事務所・休憩室・更衣室, concourse=コンコース・通路・コリドー, storage=倉庫, theater=シアター（スクリーン・シネマ・オーディトリアム）, other=それ以外（便所・機械室など）。';

function prompt(task, body) {
  if (task === 'th-ac') return [
    'これは映画館の空調機器表（または機器の一覧・系統図）です。シアター（スクリーン）を冷やしている空調機を全部挙げてください。',
    '・id は機器記号（例：AC-1、PAC-3、RTU-10A）。screen はその空調機が受け持つスクリーン。系統・設置場所・備考・系統図から判断し、"SCR1" のように「SCR＋番号」に直す（シアター1・スクリーン1・Theater1・No.1シアター → SCR1）。分からない時は空文字。',
    '・1台で複数スクリーンを受け持つ時は、その旨を unsure に書き、screen は主なスクリーン。',
    '・cap_kw は冷房能力（定格）。maker はメーカー名（分からなければ空文字）、model は型式。',
    '・ロビー・事務所など、シアター以外の空調機は入れない。外調機・換気扇も入れない。',
    '・screens には、機器表に出てくるスクリーンの一覧（"SCR1" の形）。'
  ].join('\n');
  if (task === 'seats') return [
    `この映画館のホームページを web_fetch で開き、スクリーンごとの座席数を読んでください: ${body.url}`,
    '・座席数は「施設案内」「劇場案内」「スクリーン紹介」「シアター案内」などのページにあります。最初のページに無ければ、そのページにあるリンクをたどって探す（同じサイトの中だけ）。',
    '・id は "SCR1" のように「SCR＋番号」（スクリーン1・シアター1 → SCR1）。IMAX などの名前でも番号があれば番号を使う。座席数は車いす席を含めた合計（書いてあれば）。',
    '・total は劇場全体の座席数（書いてあれば。無ければ null）。page_url は座席数を読んだページの URL。',
    '・読めなかったら screens は空にして、note に理由を書く。'
  ].join('\n');
  if (task === 'names') return [
    'これは映画館の平面図（と機器表）です。まず、図面にある部屋の名前（室名）だけを全部挙げてください。詳しい数値はまだ読まなくてよい。',
    '・同じ名前が別の階にある時は「2F ロビー」のように階を付けて分ける。',
    '・' + ZONE_HELP,
    '・scale は縮尺（例：1/100。分からなければ空文字）。src は室名を見つけたファイルとページ。'
  ].join('\n');
  if (task === 'detail') return [
    '計算したい部屋は次の部屋だけです。ほかの部屋は読まないでください：',
    (body.rooms || []).map((r) => '・' + r).join('\n'),
    '一覧の名前が図面の室名と少し違う時（例：「通路」→「コンコース」）は、いちばん近い場所を図面から探す。見つからない部屋も rooms に入れ、area_m2 を null にして unsure に「図面で見つからない」と書く。',
    '',
    'それぞれの部屋について：',
    '・area_m2 床面積（図面の面積表・寸法から。寸法から出した時は src にその旨）、height_m 天井高（分かれば）。',
    '・wall 外気に面する外壁の面積（㎡）を方位ごと（N 北・E 東・S 南・W 西。図面の方位記号から。斜めの時は近い方位）。ガラスの分は外壁に入れない。',
    '・glass 外気に面するガラス（窓・カーテンウォール・ガラスの扉）の面積（㎡）を方位ごと。',
    '・roof_m2 その部屋の上が屋上の時の屋根の面積、part_m2 空調していない共用部（モールの通路など）との間の壁の面積。無ければ 0。',
    '・people 図面・備考に人数があれば。無ければ null。',
    '・' + ZONE_HELP,
    '',
    'その部屋に関係する機器（ほかの部屋だけの機器は入れない）：',
    '・ac 空調機（パッケージ・室内機）。form は形（天井カセット/天吊/壁掛/天井埋込ダクト/ビルトイン/床置/その他）、cap_kw 冷房能力、room 置いてある部屋（上の部屋の名前で）。',
    '・oac 外調機（外気処理機）があれば found=true、flow 風量 m³/h、cap_kw 冷却能力、supply_temp 吹き出し温度（書いてあれば）、to 各部屋への給気量。無ければ found=false で他は null・空。',
    '・exhaust 排気（kind=hood は厨房・ポップコーンの排気フード、other は便所などその他）、supply_fans 外気をそのまま入れる給気ファン、hex 全熱交換器（eff は交換効率 0〜1）。風量は m³/h。',
    '・equip 厨房・売店の機器（ポップコーンマシーン・フライヤー・保温ケース・ショーケース・製氷機など）。kw は消費電力、qty 台数。',
    '・extra 外部への出入口の数(doors)、風除室があるか(vestibule)、下の階とつながるエスカレーターの台数、ロビーに直接着くエレベーターの台数、モールの通路に開いている幅(m)。'
  ].join('\n');
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 未設定' });

  const body = req.body || {};
  const task = String(body.task || '');
  if (!SCHEMAS[task]) return res.status(400).json({ error: 'task が正しくありません' });

  const content = [];
  let tools = [];
  if (task === 'seats') {
    const url = String(body.url || '').trim();
    if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url)) return res.status(400).json({ error: '劇場のホームページの URL を入れてください' });
    let host = '';
    try { host = new URL(url).hostname; } catch (e) { return res.status(400).json({ error: 'URL が正しくありません' }); }
    // 同じサイトの中だけ開く
    tools = [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 6, allowed_domains: [host] }];
  } else {
    const files = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
    if (!files.length) return res.status(400).json({ error: '図面・機器表のファイルを入れてください' });
    for (const f of files) {
      const url = String(f.url || '');
      if (url.indexOf(FILE_PREFIX) !== 0) return res.status(400).json({ error: 'ファイルの場所が正しくありません' });
      const mt = String(f.mediaType || '');
      content.push({ type: 'text', text: `ファイル「${String(f.name || '').slice(0, 120)}」` });
      if (mt === 'application/pdf') content.push({ type: 'document', source: { type: 'url', url } });
      else if (/^image\/(jpeg|png|webp|gif)$/.test(mt)) content.push({ type: 'image', source: { type: 'url', url } });
      else return res.status(400).json({ error: '対応しているのは PDF と画像（JPEG/PNG/WebP）です' });
    }
    if (task === 'detail' && !(Array.isArray(body.rooms) && body.rooms.length)) return res.status(400).json({ error: '計算する部屋を選んでください' });
  }
  content.push({ type: 'text', text: prompt(task, body) });

  // 部屋を詳しく読む時は、図面をよく見る（考える量を多めに）
  const effort = task === 'detail' ? 'high' : 'medium';
  try {
    let out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: COMMON, content, schema: SCHEMAS[task], tools, effort, maxTokens: task === 'detail' ? 32000 : 16000 });
    // URL のまま渡せなかった時は、ここで読み込んで中身を渡し直す
    if (out.error && out.status === 400 && /url|source|fetch|download/i.test(out.error) && task !== 'seats') {
      const inline = await inlineFiles(content);
      if (inline) out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: COMMON, content: inline, schema: SCHEMAS[task], tools, effort, maxTokens: task === 'detail' ? 32000 : 16000 });
    }
    if (out.error) return res.status(502).json({ error: out.error });
    return res.status(200).json({ ok: true, data: out.data, model: AI_MODEL });
  } catch (e) {
    return res.status(500).json({ error: '読み取りに失敗しました', detail: e.message });
  }
}

// Supabase の期限付きURLからファイルを読み込み、base64 にして渡す
async function inlineFiles(content) {
  const out = [];
  for (const b of content) {
    if ((b.type === 'document' || b.type === 'image') && b.source && b.source.type === 'url') {
      const r = await fetch(b.source.url);
      if (!r.ok) return null;
      const buf = Buffer.from(await r.arrayBuffer());
      const mt = b.type === 'document' ? 'application/pdf' : (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
      out.push({ type: b.type, source: { type: 'base64', media_type: mt, data: buf.toString('base64') } });
    } else out.push(b);
  }
  return out;
}

// @ryonetsu.com のログイン中ユーザーか（Supabase の access_token を確かめる）
async function isRyonetsuUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id && /@ryonetsu\.com$/i.test(String(u.email || '')));
  } catch (e) { return false; }
}

