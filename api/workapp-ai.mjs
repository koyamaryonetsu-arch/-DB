// 作業申請書の自動作成（AI）。ファイルは保存しない（メモリ上で読んで返すだけ）。
//
// 必須 ENV: ANTHROPIC_API_KEY
// Authorization: Bearer <Supabaseのユーザーaccess_token>（菱熱の人だけ）
//
// リクエスト(POST, JSON): { action, ... }
//   action = 'classify' … 劇場情報の連絡先から協力会社（菱熱の下で作業する会社）を選ぶ
//            { contacts: [{ id, vendor, category, person, phone, email, note, theater }] }
//            → { results: [{ id, is_partner, company, phone, address }] }
//   action = 'plan'     … 書式と記入例を読んで、提出期限・作業場所/内容の案・追加で聞くことを返す
//            { case, answers, docs }
//   action = 'fill'     … 書式に書き込む内容（PDF は座標、Excel はセル、Word は段落）を返す
//            { case, answers, docs, instruction?, previous? }
//   action = 'check'    … 書き込んだ PDF の画像を見て、ずれ・はみ出しを直した内容を返す
//            { case, answers, docs, filled, previous }
//   docs: [{ role: 'template'|'example'|'filled', name, format: 'pdf'|'xlsx'|'docx'|'image', pages?: [{ w, h, image, texts }], sheets?: string, paras?: string }]
//     pages[].image は JPEG の base64（PDF は 10pt ごとの方眼と 50pt ごとの目盛り付き。座標は左上が原点・単位 pt）

import { claudeJson } from '../lib/claude.mjs';

// 書式を読む・書き込む: 最新の Opus（読み取りの正確さ優先）。使えない時は Sonnet でやり直す
const AI_MODEL = 'claude-opus-5-5';
const AI_MODEL_PREV = 'claude-sonnet-5-5';
// 協力会社かどうかの判定: Sonnet で十分
const CLASSIFY_MODEL = 'claude-sonnet-5-5';
const CLASSIFY_MODEL_PREV = 'claude-sonnet-4-6';

const SUPABASE_URL = 'https://hykjpadvbficiiuockhj.supabase.co';
// anon(public) キー。RLS前提の公開キーなのでコード内保持で問題なし（ユーザートークン検証用）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized（菱熱の人だけ使えます）' });
  const body = req.body || {};
  try {
    if (body.action === 'classify') return res.status(200).json(await classify(body));
    if (body.action === 'plan') return res.status(200).json(await plan(body));
    if (body.action === 'fill' || body.action === 'check') return res.status(200).json(await fill(body));
    return res.status(400).json({ error: 'action が正しくありません' });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || String(e) });
  }
}

// ---------- 協力会社の判定 ----------
const CLASSIFY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'is_partner', 'company', 'phone', 'address'],
        properties: {
          id: { type: 'string' },
          is_partner: { type: 'boolean' },
          company: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' }
        }
      }
    }
  }
};
async function classify({ contacts }) {
  const list = (Array.isArray(contacts) ? contacts : []).slice(0, 80);
  if (!list.length) return { results: [] };
  const system = [
    'あなたは菱熱工業株式会社（空調・設備の工事会社。映画館の空調の修理・点検・工事をしている）の事務担当です。',
    '劇場ごとの連絡先の一覧から「協力会社」（菱熱工業の下請け・協力業者として、菱熱工業の工事・作業に作業員を出す会社）だけを選びます。',
    '協力会社ではないもの: 劇場・映画館の会社（TOHOシネマズ・109シネマズ・ユナイテッドシネマ等）とその運営本部・劇場スタッフ、',
    'ショッピングセンターや建物の管理会社・防災センター・館側の設備管理、施主・ビルオーナー、メーカーの営業窓口、他社の保守契約先（劇場と直接契約している別の業者）、',
    '菱熱工業自身、個人だけで会社名が無いもの。',
    '協力会社の例: 空調工事・配管・電気工事・洗浄・修理の業者で、菱熱工業から作業を頼まれている会社（メモに「協力会社」「協力業者」「手配」「下請」などがあることが多い）。',
    'company は正式な会社名（「株式会社」などは連絡先の書き方どおり。半角カナは全角に直す）。phone・address は分かれば会社の代表の電話・住所（無ければ空文字）。',
    '迷う時は is_partner を false にしてください（あとで人が足せます）。'
  ].join('\n');
  const text = '連絡先の一覧(JSON):\n' + JSON.stringify(list.map((c) => ({
    id: String(c.id), 会社: c.vendor || '', 分類: c.category || '', 担当: c.person || '', 電話: c.phone || '', メール: c.email || '', メモ: c.note || '', 劇場: c.theater || ''
  })));
  const out = await claudeJson({ model: CLASSIFY_MODEL, prevModel: CLASSIFY_MODEL_PREV, system, content: [{ type: 'text', text }], schema: CLASSIFY_SCHEMA, maxTokens: 8000, effort: 'low' });
  if (out.error) throw httpErr(502, out.error);
  return { results: (out.data && out.data.results) || [] };
}

// ---------- 書式を読む（質問を考える） ----------
const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['form_title', 'deadline', 'deadline_warning', 'other_docs', 'work_place', 'work_content', 'kubun', 'questions', 'notes'],
  properties: {
    form_title: { type: 'string' },          // 書式の名前（例: 外来作業・時間外店内使用許可申請書）
    deadline: { type: 'string' },            // 提出期限（書式の注記から。例: 作業の1週間前まで）
    deadline_warning: { type: 'string' },    // 作業日から見て期限に間に合わない・ぎりぎりの時の注意（無ければ空文字）
    other_docs: { type: 'string' },          // 別に要る書類（例: 火気を使う時は特殊物品持込承認申請書）
    work_place: { type: 'string' },          // 作業場所の案（記入例の書き方に合わせる）
    work_content: { type: 'string' },        // 作業内容の案（短く）
    kubun: { type: 'string' },               // 申請の区分・分類の案（書式に区分がある時。無ければ空文字）
    questions: {                             // 決まった質問（日時・場所・内容・責任者・協力会社・作業者・車両・火気・騒音・機材）以外に、この書式で聞くこと
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['key', 'label', 'kind', 'choices', 'default', 'why'],
        properties: {
          key: { type: 'string' }, label: { type: 'string' },
          kind: { type: 'string', enum: ['text', 'yesno', 'choice'] },
          choices: { type: 'array', items: { type: 'string' } },
          default: { type: 'string' }, why: { type: 'string' }
        }
      }
    },
    notes: { type: 'string' }                // 小山さんへの一言（書式の注意・押印が要る等）
  }
};
async function plan(body) {
  const system = commonRules() + '\n\n' + [
    '今は「書き込む前」です。書式（template）と記入例（example・前に実際に出した申請書）を読み、次を答えてください。',
    '・提出期限（書式の注記から）。作業日から見て間に合わない・ぎりぎりなら deadline_warning に書く（今日の日付は案件の情報にあります）',
    '・作業場所・作業内容・区分の案（記入例の書き方に合わせる）',
    '・決まった質問（作業日時・作業場所・作業内容・当日責任者・協力会社・作業者・車両/駐車・火気/騒音/臭気・持込機材）のほかに、',
    '  この書式で人に聞かないと書けない欄があれば questions に入れる（例: 鍵の貸出・エレベーター使用・荷捌き場の使用・養生・停電/断水 など）。',
    '  書式に無い欄・答えが決まっている欄（店舗側が書く欄・防災センター記入欄など）は聞かない。多くても6つまで。',
    '  key は英小文字と_、kind は yesno（有/無）・choice（choices から選ぶ）・text。default は記入例や案件から考えた最初の答え。'
  ].join('\n');
  const content = buildContent(body, '上の書式と記入例を読んで、答えてください。');
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system, content, schema: PLAN_SCHEMA, maxTokens: 16000, effort: 'medium' });
  if (out.error) throw httpErr(502, out.error);
  return out.data;
}

// ---------- 書き込む内容（PDF は座標・Excel はセル・Word は段落） ----------
const ENTRY = {
  type: 'object', additionalProperties: false,
  required: ['label', 'value', 'page', 'x', 'y', 'size', 'sheet', 'cell', 'para'],
  properties: {
    label: { type: 'string' },   // 人が見て分かる欄の名前（例: 申請日（年））
    value: { type: 'string' },   // 書く文字
    page: { type: 'integer' },   // PDF: ページ（1から）。PDF 以外は 0
    x: { type: 'number' },       // PDF: 文字の左端（pt・左上が原点）。PDF 以外は 0
    y: { type: 'number' },       // PDF: 文字の下端＝ベースライン（pt・上から）。PDF 以外は 0
    size: { type: 'number' },    // PDF: 文字の大きさ（pt）。PDF 以外は 0
    sheet: { type: 'string' },   // Excel: シート名。Excel 以外は空文字
    cell: { type: 'string' },    // Excel: セル（例: H22）。Excel 以外は空文字
    para: { type: 'integer' }    // Word: 段落の番号。Word 以外は -1
  }
};
const FILL_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['file_label', 'entries', 'marks', 'whiteouts', 'summary', 'unfilled', 'warnings'],
  properties: {
    file_label: { type: 'string' },   // ファイル名に入れる「作業日と作業内容」（例: 1017空調機点検）
    entries: { type: 'array', items: ENTRY },
    marks: {                          // PDF: ○で囲む所（中心と横・縦の半径 pt）
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['label', 'page', 'cx', 'cy', 'rx', 'ry'],
        properties: { label: { type: 'string' }, page: { type: 'integer' }, cx: { type: 'number' }, cy: { type: 'number' }, rx: { type: 'number' }, ry: { type: 'number' } } }
    },
    whiteouts: {                      // PDF: 白で消す所（印字済みの古い住所・TEL など。左上 x0,y0 と右下 x1,y1）
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['label', 'page', 'x0', 'y0', 'x1', 'y1'],
        properties: { label: { type: 'string' }, page: { type: 'integer' }, x0: { type: 'number' }, y0: { type: 'number' }, x1: { type: 'number' }, y1: { type: 'number' } } }
    },
    summary: { type: 'string' },      // 書いた内容の要約（2〜4行）
    unfilled: { type: 'array', items: { type: 'string' } },   // 空けた欄（人が書く・押印など）
    warnings: { type: 'array', items: { type: 'string' } }    // 注意（期限・別の書類・確かめてほしいこと）
  }
};
async function fill(body) {
  const fmt = templateFormat(body.docs);
  const check = body.action === 'check';
  const how = fmt === 'xlsx' ? [
    'この書式は Excel です。entries の sheet・cell に書くセルを入れる（page=0, x=0, y=0, size=0, para=-1）。',
    '・ラベルのセル（例:「月」「日」「時」）ではなく、その左などの空いた入力用のセルに書く。結合セルは左上のセルを指定する。',
    '・○を付ける欄は、記入例と同じやり方（「○」の入ったセルを有/無の位置に置く、など）に合わせる。もともと「○」が入っているセルで答えが違う時は、そのセルを空文字にして正しい位置に「○」を書く。',
    '・印字済みの古い情報（旧住所・旧TEL・前の担当者）が入ったセルは、新しい内容で上書きする。',
    '・申請者（テナント）欄に劇場の情報が入っている書式では、そこは変えない（劇場が申請者で、菱熱は作業会社の欄）。'
  ] : fmt === 'docx' ? [
    'この書式は Word です。entries の para に書き換える段落の番号を入れ、value はその段落の新しい文字全体（ラベルも含めて）にする（page=0, x=0, y=0, size=0, sheet/cell は空文字）。',
    '・ラベルと答えが同じ段落にある時（例:「会社名　菱熱工業株式会社」）は、ラベルを残して答えの部分だけ変えた文字全体を value にする。',
    '・「有・無」などを○で囲む欄は、選んだ方を「(無)」のように丸かっこで囲む（記入例に別のやり方があればそれに合わせる）。',
    '・印字済みの古い情報（旧住所・旧TEL・前回の日時・前回の作業者）は、今回の内容で置き換える。空ける欄は value を空文字ではなくラベルだけにする。'
  ] : [
    'この書式は PDF です。entries の page・x・y・size に書く位置を入れる（sheet/cell は空文字、para=-1）。',
    '・座標は pt で、ページの左上が原点。x は文字の左端、y は文字のベースライン（文字の下端）。画像の方眼は 10pt ごと、太い線と数字は 50pt ごと。',
    '・欄の枠の中に収まるように。y は枠の下の線より 2〜4pt 上。文字の大きさは欄の高さに合わせて 8〜11pt（狭い欄は小さく）。',
    '・「年」「月」「日」「時」「分」などの印字済みの文字の左の空いた所に数字を書く（印字済みの文字に重ねない）。',
    '・○で囲む所（有/無・区分・□の選択など）は marks に、囲む文字の中心（cx, cy）と半径（rx は文字の幅の半分＋3pt、ry は 6〜8pt）を入れる。□のチェック欄は「レ」を entries に書いてもよい（記入例に合わせる）。',
    '・印字済みの古い住所・TEL などは whiteouts で白く消してから、entries で新しい内容を書く。',
    '・1つの欄に長い文字を書く時は、欄の幅に収まるよう size を小さくするか2行に分ける（2行目は別の entry）。'
  ];
  const system = commonRules() + '\n\n' + [
    check
      ? '今は「書き込んだあとの確かめ」です。filled（書き込んだ結果の画像）を見て、ずれ・はみ出し・重なり・欄の間違い・○の位置のずれを直した、全部の entries・marks・whiteouts を返してください。直す所が無ければ前回（previous）と同じものを返す。'
      : '今は「書き込み」です。書式（template）に、答え（answers）と案件の情報を書き込む内容を返してください。記入例（example）の欄の埋め方・書き方に合わせます。',
    ...how,
    '・label は人が見て分かる欄の名前（例:「申請日（月）」「作業内容」）。同じ欄を2つに分けた時は「作業内容（2行目）」のようにする。',
    '・file_label は「作業日（MMDD）＋作業内容を短く」（例: 1017空調機点検。作業日が複数日なら最初の日）。',
    '・unfilled には空けた欄（店舗・劇場側が書く欄、押印、分からない欄）、warnings には提出期限や別に要る書類の注意を入れる。'
  ].join('\n');
  const tail = check
    ? '前回の書き込み内容(previous):\n' + JSON.stringify(body.previous || {}) + '\n\n上の filled の画像を見て、直した全部の内容を返してください。'
    : (body.previous ? '前回の書き込み内容(previous):\n' + JSON.stringify(body.previous) + '\n\n' : '') +
      (body.instruction ? '小山さんからの直しの指示: ' + String(body.instruction) + '\n（指示に合わせて前回の内容を直し、全部の内容を返す）\n\n' : '') +
      '書き込む内容を返してください。';
  const content = buildContent(body, tail);
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system, content, schema: FILL_SCHEMA, maxTokens: 32000, effort: 'medium' });
  if (out.error) throw httpErr(502, out.error);
  return out.data;
}

// ---------- 共通 ----------
function commonRules() {
  return [
    'あなたは菱熱工業株式会社（空調・設備の工事会社）の事務担当です。映画館（劇場）や商業施設に出す「作業申請書（入館届・作業届・時間外申請など）」を、その施設の所定の書式に書き込みます。',
    '決まり:',
    '・申請者側（作業する会社）の情報は answers.applicant を使う。古い住所「東京都大田区南馬込2-29-17」・古いTEL「03-3778-2114」は使わない。',
    '・当日責任者は answers.leader（菱熱の担当者）。携帯は answers.leader.phone。',
    '・協力会社は answers.partners、作業者は answers.workers（会社ごと）。人数は作業者の数（answers.headcount があればそれ）。',
    '・作業者の名前を書く欄が足りない時は、書ける所まで書いて warnings に「書ききれない人は別紙」と入れる。',
    '・answers.purpose は、この申請書が「調査」（現場調査・現地確認）のためか「作業」（工事・点検・修理など）のためか。区分・作業内容・日時はそれに合わせる（調査と作業で申請書は別々）。',
    '・分類: 空調機の調査・現地確認は「現場調査」、修理・部品交換・取付・点検は「工事・点検・メンテナンス・修理」（書式の区分の言葉に合わせる）。',
    '・有/無の欄は answers に答えがあればそれ、無ければ「無」。',
    '・店舗番号・店舗名・店長印・立会い・防災センター記入欄・管理事務所の欄など、劇場・施設側が書く欄は空ける（記入例で劇場名などが入っていれば合わせる）。',
    '・日付は書式の書き方（西暦/和暦、24時間制など）に合わせる。申請日・提出日は answers.apply_date。',
    '・answers.work.date_note がある時（作業日が未定）は、作業日・作業期間の欄は空欄のままにする。日付を作ったり、案件の他の日付を使ったりしない。',
    '・記入例が複数ある時は、いちばん新しいものに合わせる。',
    '・分からないことは作らない（空けて unfilled に書く）。'
  ].join('\n');
}
function templateFormat(docs) {
  const t = (docs || []).find((d) => d && d.role === 'template');
  return t ? t.format : 'pdf';
}
// 書式・記入例・答えを、AI に渡す形（文字と画像）にする
function buildContent(body, tail) {
  const content = [];
  const c = body.case || {};
  content.push({ type: 'text', text: '案件の情報(JSON):\n' + JSON.stringify(c) + '\n\n答え(answers, JSON):\n' + JSON.stringify(body.answers || {}) });
  let images = 0;
  const docs = (body.docs || []).filter(Boolean);
  for (const d of docs) {
    const role = d.role === 'template' ? '書式（これに書き込む）' : d.role === 'filled' ? '書き込んだ結果（確かめる）' : '記入例（前に出した申請書）';
    content.push({ type: 'text', text: `\n===== ${role}: ${d.name || ''}（${d.format}） =====` });
    if (d.sheets) content.push({ type: 'text', text: 'Excel の中身（シートごと・セル: 値。結合セルは「結合」に）:\n' + String(d.sheets).slice(0, 60000) });
    if (d.paras) content.push({ type: 'text', text: 'Word の段落（番号: 文字。表の中は [表t 行r 列c]）:\n' + String(d.paras).slice(0, 60000) });
    (d.pages || []).forEach((p, i) => {
      if (images >= 14) return;
      content.push({ type: 'text', text: `ページ ${i + 1}（幅 ${round1(p.w)}pt × 高さ ${round1(p.h)}pt。左上が原点）` +
        (p.texts && p.texts.length ? '\nページ上の文字と位置（x, y=ベースライン, 幅, 高さ。pt）:\n' + p.texts.slice(0, 600).map((t) => `${round1(t.x)},${round1(t.y)},${round1(t.w)},${round1(t.h)} ${t.s}`).join('\n') : '\n（文字の情報なし＝スキャンした画像。画像の方眼で位置を決める）') });
      if (p.image) { content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(p.image) } }); images++; }
    });
  }
  content.push({ type: 'text', text: '\n' + tail });
  return content;
}
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }

// ログイン中の菱熱の人か（Supabase のトークンを確かめる）
async function isRyonetsuUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id && /@ryonetsu\.com$/i.test(String(u.email || '')));
  } catch (e) { return false; }
}
