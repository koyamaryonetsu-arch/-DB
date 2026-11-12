// 劇場カルテの AI（Opus）
//
//   task 'review'    … 「劇場情報更新確認」に溜まった候補を、その劇場の今の情報と見比べて判定し、
//                      合っている新しい情報は劇場カルテに自動で入れる（theater_notes / theater_contacts / 支配人・電話）。
//                      重複・間違いは除く。AIが迷ったものだけ「更新確認」に残す（理由つき）。
//   task 'equipment' … 機器表（PDF・画像、または Excel を文字にしたもの）を読み、機器の一覧（表）にする。保存はしない。
//
// 認証: Authorization: Bearer <Supabaseのユーザーaccess_token>（@ryonetsu.com）
//       または x-flush-key = SUPABASE_SERVICE_ROLE_KEY（GAS の毎日の取り込みから。review だけ）
// 必須 ENV: ANTHROPIC_API_KEY / SUPABASE_SERVICE_ROLE_KEY /（任意）SUPABASE_URL

import { claudeJson } from '../lib/claude.mjs';

const AI_MODEL = 'claude-opus-5-5';
const AI_MODEL_PREV = 'claude-opus-5';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2pwYWR2YmZpY2lpdW9ja2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyMTYsImV4cCI6MjA5NTcyMTIxNn0.xrFZ7SChyYBKIyQbVzNq9vToEAQxG6zveUr9B2lRbYY';
const FILE_PREFIX = SUPABASE_URL + '/storage/v1/object/sign/theater-files/';
const MAX_FILES = 10;
const GROUPS_PER_CALL = 6;        // 1回で見る劇場の数（多いと時間切れになるため。残りは次の呼び出しで）
const ITEMS_PER_GROUP = 40;       // 1つの劇場で一度に見る候補の数
const TIME_BUDGET_MS = 200 * 1000; // これを過ぎたら新しい劇場には手をつけない（関数の上限は300秒）

const FIELD_TO_KIND = { equipment: 'equipment', chronic_issues: 'chronic', info_note: 'note' };
const KIND_LABEL = { chronic: '持病・注意', note: '備考', equipment: '設備メモ', manager: '支配人', theater_phone: '劇場の電話', contact: '連絡先' };

// ---------- Supabase（サーバーの鍵で読み書き。呼べる人は上で確かめる） ----------
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
async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: sbHeaders({ Prefer: 'return=representation' }), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`登録に失敗 (${r.status}): ${await r.text()}`);
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
const enc = encodeURIComponent;
// 劇場名の「ゆれ」をそろえる鍵（スペース・中黒・ハイフン・長音の有無、大文字小文字を無視）
const nameKey = (s) => String(s || '').toLowerCase().replace(/[\s　・･\-－ー]/g, '');
// 劇場名を一覧の名前にそろえる（GAS の canonTheater_ と同じ決まり）:
//   名前のゆれ（空白など）→ 別の呼び方（aliases）→ 同じ会社の劇場で場所の名前が同じ → 場所の名前が片方に含まれ、合う劇場が1つだけ
// 会社は劇場名に付いている会社名（TOHO・109 など）を先に見る。別の会社の劇場には寄せない
const BRANDS = [
  [/TOHO\s*(シネマズ|CINEMAS)?|東宝/i, ['TOHOシネマズ']],
  [/109\s*(シネマズ|CINEMAS)?/i, ['109シネマズ']],
  [/ユナイテッド[・･\s]*シネマ|UNITED\s*CINEMAS|シネプレックス|^CPX|^UC/i, ['ユナイテッドシネマ']],
  [/グランドシネマサンシャイン|シネマサンシャイン|CINEMA\s*SUNSHINE|^GCS|^CS/i, ['佐々木興業', 'シネマサンシャイン']],
  [/コロナ(シネマ)?ワールド|コロナシネマ/i, ['コロナワールド']],
  [/MOVIX|ムービックス/i, ['MOVIX']],
  [/イオンシネマ/i, ['イオンシネマズ']]
];
const nfkc = (s) => String(s || '').normalize('NFKC');
const placeOf = (s) => {
  let t = nfkc(s);
  BRANDS.forEach(([re]) => { t = t.replace(new RegExp(re.source, 'gi'), ''); });
  return nameKey(t.replace(/(シネマズ|シネマ|劇場|映画館)/g, '').replace(/[（）()「」『』.,、。]/g, ''));
};
const brandOf = (s) => { const t = nfkc(s); const b = BRANDS.find(([re]) => re.test(t)); return b ? b[1] : null; };
export function makeCanon(theaters) {
  const byKey = {}, byAlias = {};
  theaters.forEach((t) => {
    (byKey[nameKey(nfkc(t.name))] = byKey[nameKey(nfkc(t.name))] || []).push(t.name);
    (Array.isArray(t.aliases) ? t.aliases : []).forEach((a) => { if (a) (byAlias[nameKey(nfkc(a))] = byAlias[nameKey(nfkc(a))] || []).push(t.name); });
  });
  const names = new Set(theaters.map((t) => t.name));
  return (n, company) => {
    if (!n || names.has(n)) return n || '';
    const k = nameKey(nfkc(n));
    const one = (arr) => (arr && new Set(arr).size === 1 ? arr[0] : '');
    const hit = one(byKey[k]) || one(byAlias[k]);
    if (hit) return hit;
    const cos = brandOf(n) || (company ? [company] : null);
    if (!cos) return n;
    const same = theaters.filter((t) => cos.includes(t.company));
    const sn = same.filter((t) => t.short_name && nameKey(nfkc(t.short_name)) === k);   // 同じ会社の表示名（短い名前）
    if (sn.length === 1) return sn[0].name;
    const pl = placeOf(n); if (pl.length < 2) return n;
    const eq = same.filter((t) => placeOf(t.name) === pl);
    if (eq.length === 1) return eq[0].name;
    if (eq.length > 1) return n;
    const part = same.filter((t) => { const q = placeOf(t.name); return q.length >= 2 && (q.includes(pl) || pl.includes(q)); });
    return part.length === 1 ? part[0].name : n;
  };
}
const norm = (s) => String(s || '').replace(/[\s　、。，．・（）()「」『』【】\[\]:：/／\-－ー〜~]/g, '').toLowerCase();

// ---------- 答えの形 ----------
const str = { type: 'string' };
const num = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const int = { anyOf: [{ type: 'integer' }, { type: 'null' }] };
const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });
const arr = (items) => ({ type: 'array', items });
const REVIEW_SCHEMA = obj({
  results: arr(obj({
    id: str,
    verdict: { type: 'string', enum: ['add', 'dup', 'wrong'] },
    confidence: { type: 'number' },
    theater: str,
    kind: { type: 'string', enum: ['chronic', 'note', 'equipment', 'manager', 'theater_phone', 'contact'] },
    body: str,
    source_date: str,
    reason: str
  }))
});
const EQUIP_SCHEMA = obj({
  rows: arr(obj({
    system: str, symbol: str, kind: str, maker: str, model: str,
    cool_kw: num, heat_kw: num, qty: int, year: str, serves: str, location: str, note: str, src: str, unsure: str
  })),
  note: str
});

const LOW_CONF = 0.3;   // これ以下の確信度の候補だけ「劇場情報更新確認」に残して人が確かめる
const VERDICT_JA = { add: '入れる', dup: '重複', wrong: '入れない' };
const REVIEW_SYSTEM = [
  'あなたは、映画館（シネコン）の空調・設備の保守会社「菱熱工業」で、劇場ごとの「劇場カルテ」を管理する担当者です。',
  'メール・LINE・会議の記録から別のAIが拾った「劇場カルテに足す候補」を、その劇場の今のカルテと見比べて1件ずつ判定します。',
  '',
  '判定（verdict）は次の3つのどれか。必ず1つに決める:',
  '・add    … その劇場の設備・運用について役に立つ事実で、今のカルテにまだ無い。→ カルテに入れる。',
  '・dup    … 今のカルテに同じ意味の内容がもうある（言い方が違うだけ・前の情報の言い直し）。',
  '・wrong  … カルテに入れるべきでない。例：一時的な連絡・案件の進み具合や日程だけの話・挨拶・社内の段取り・ほかの劇場や劇場でない場所の話・読み間違い。',
  '拾った候補はほとんど合っている。だいたい合っていて新しい事実なら add にする（細かくてもよい: 機器の型式・系統・更新した年・繰り返す故障・作業の決まり・連絡先など）。',
  '言い回しが少しおかしい・一部があいまいなだけなら、body で正しく短く書き直して add にする。',
  'confidence: その判定（verdict）がどれくらい確かか 0〜1。0.3 以下の時だけ人が確かめる（それより上なら判定のとおりに入れる・除く）。',
  '  例: 今のカルテと食い違う・どの劇場の話か分からない・中身が読めない時は 0.3 以下にする。',
  '',
  '種類（kind）:',
  '・chronic=持病・注意（繰り返す故障・弱点・気をつけること） / note=備考（運用の決まり・窓口・作業申請のルールなど） / equipment=設備メモ（機種・系統・更新の履歴）',
  '・manager=支配人、theater_phone=劇場の電話、contact=業者の連絡先。候補の種類が合っていなければ、正しい種類にしてよい（chronic・note・equipment の間だけ）。manager・theater_phone・contact は変えない。',
  '',
  'body: add の時、カルテに入れる文。日本語で1〜2文、短く。機器の記号・型式・数字・人の名前はそのまま残す。末尾に年月や出典は付けない（別の欄に入れる）。add 以外は空でよい。',
  'theater: その候補が本当はどの劇場の話かを「劇場の一覧」の名前そのままで（一覧に無ければ空文字）。',
  'source_date: 情報の年月 YYYY-MM（候補に書いてあればそれ。分からなければ空文字）。',
  'reason: 判定の理由を日本語で短く（30字くらい）。dup の時は、今のカルテのどれと同じかが分かるように。',
  '候補はすべて1件ずつ答える（id はそのまま）。'
].join('\n');

function itemText(it) {
  if (it.kind === 'contact') {
    return `【連絡先】${[it.category, it.maker, it.vendor, it.person, it.phone, it.email].filter(Boolean).join(' / ')}${it.note ? '（' + it.note + '）' : ''}`;
  }
  return `【${KIND_LABEL[FIELD_TO_KIND[it.field] || it.field] || it.field}】${it.value || ''}`;
}

async function reviewGroup(theater, items, ctx) {
  const t = ctx.theaterRows[theater] || null;
  const company = (t && t.company) || items.find((x) => x.company)?.company || '';
  const [notes, contacts] = await Promise.all([
    sbGet(`theater_notes?theater=eq.${enc(theater)}&select=id,kind,body,source_date&order=source_date.desc&limit=300`).catch(() => []),
    sbGet(`theater_contacts?theater=eq.${enc(theater)}&select=category,maker,vendor,person,phone,email&limit=150`).catch(() => [])
  ]);
  const names = ctx.allTheaters.filter((x) => !company || x.company === company).map((x) => x.name);
  const lines = [];
  lines.push(`■ 劇場: ${theater}${t ? '' : '（劇場の一覧に無い名前）'}　会社: ${company || '不明'}`);
  lines.push(`■ 劇場の一覧（同じ会社）: ${names.join('、') || '（なし）'}`);
  lines.push('■ 今のカルテ');
  lines.push(`・支配人: ${(t && t.manager) || '（未登録）'}　劇場の電話: ${(t && t.theater_phone) || '（未登録）'}`);
  ['chronic', 'note', 'equipment'].forEach((k) => {
    const ns = notes.filter((n) => n.kind === k);
    lines.push(`・${KIND_LABEL[k]}（${ns.length}件）`);
    ns.forEach((n) => lines.push(`  - ${n.source_date ? '[' + n.source_date + '] ' : ''}${String(n.body).slice(0, 220)}`));
  });
  lines.push(`・連絡先（${contacts.length}件）`);
  contacts.forEach((c) => lines.push(`  - ${[c.category, c.maker, c.vendor, c.person, c.phone, c.email].filter(Boolean).join(' / ')}`));
  lines.push('');
  lines.push('■ 判定する候補');
  items.forEach((it) => lines.push(`- id=${it.id} ${itemText(it)}${it.evidence ? '　出典: ' + it.evidence : ''}${it.source_date ? '　年月: ' + it.source_date : ''}${it.confidence != null ? '　拾ったAIの自信: ' + Math.round(Number(it.confidence) * 100) + '%' : ''}`));

  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: REVIEW_SYSTEM, content: lines.join('\n'), schema: REVIEW_SCHEMA, effort: 'medium', maxTokens: 16000 });
  if (out.error) throw new Error(out.error);
  const results = (out.data && out.data.results) || [];
  const byId = {};
  results.forEach((r) => { if (r && r.id) byId[r.id] = r; });
  const tally = { add: 0, dup: 0, wrong: 0, unsure: 0, error: 0 };
  const now = new Date().toISOString();
  for (const it of items) {
    const r = byId[it.id];
    try {
      if (!r) {
        await sbPatch(`theater_info_pending?id=eq.${enc(it.id)}`, { ai_verdict: 'unsure', ai_reason: 'AIの答えにこの候補が無かった（人が確かめてください）', ai_checked_at: now });
        tally.unsure++; continue;
      }
      let verdict = r.verdict;
      let reason = String(r.reason || '').slice(0, 200);
      // 確信度が 30% 以下の時だけ人が確かめる（それより上は判定のとおりにする）
      const conf = typeof r.confidence === 'number' ? r.confidence : 0;
      if (!['add', 'dup', 'wrong'].includes(verdict) || conf <= LOW_CONF) { reason = `確信度 ${Math.round(conf * 100)}%（AIの判定: ${VERDICT_JA[verdict] || verdict}）` + (reason ? '／' + reason : ''); verdict = 'unsure'; }
      else reason = `確信度 ${Math.round(conf * 100)}%／` + reason;
      let target = theater;
      const rt = ctx.canon(r.theater, company);
      if (rt && ctx.nameSet.has(rt)) target = rt;
      if (verdict === 'add' && !ctx.nameSet.has(target)) { verdict = 'unsure'; reason = `劇場の一覧に無い名前: ${target}（劇場の一覧に足すか、近い劇場の「別の呼び方」に入れると入ります）` + (reason ? '／' + reason : ''); }
      if (verdict === 'add') {
        const res = await applyAdd(it, r, target, company || (ctx.theaterRows[target] && ctx.theaterRows[target].company) || '', notes, target === theater);
        if (res.dup) {
          await sbPatch(`theater_info_pending?id=eq.${enc(it.id)}`, { status: 'rejected', decided_at: now, ai_verdict: 'dup', ai_reason: res.dup, ai_checked_at: now });
          tally.dup++;
        } else {
          await sbPatch(`theater_info_pending?id=eq.${enc(it.id)}`, { status: 'approved', decided_at: now, ai_verdict: 'add', ai_reason: (target !== theater ? `「${target}」に入れた／` : '') + reason, ai_checked_at: now, applied_note_id: res.noteId || null });
          tally.add++;
        }
      } else if (verdict === 'dup' || verdict === 'wrong') {
        await sbPatch(`theater_info_pending?id=eq.${enc(it.id)}`, { status: 'rejected', decided_at: now, ai_verdict: verdict, ai_reason: reason, ai_checked_at: now });
        tally[verdict]++;
      } else {
        await sbPatch(`theater_info_pending?id=eq.${enc(it.id)}`, { ai_verdict: 'unsure', ai_reason: reason, ai_checked_at: now });
        tally.unsure++;
      }
    } catch (e) {
      console.error('判定の反映に失敗', it.id, e.message);
      tally.error++;
    }
  }
  return tally;
}

// add: 劇場カルテに入れる。戻り値 { noteId } か { dup: 理由 }
async function applyAdd(it, r, theater, company, notesOfOrig, sameTheater) {
  if (it.kind === 'contact') {
    if (!it.vendor) return { dup: '業者名が無い' };
    const dupRows = await sbGet(`theater_contacts?theater=eq.${enc(theater)}&vendor=eq.${enc(it.vendor)}&person=eq.${enc(it.person || '')}&select=id&limit=1`);
    if (dupRows.length) return { dup: '同じ業者・担当者の連絡先がもうある' };
    await sbInsert('theater_contacts', {
      company, theater, category: it.category || '', maker: it.maker || '', vendor: it.vendor || '', person: it.person || '',
      phone: it.phone || '', email: it.email || '', note: [it.note, it.evidence].filter(Boolean).join(' / '), sort_order: 9000
    });
    return {};
  }
  if (it.field === 'manager' || it.field === 'theater_phone') {
    const rows = await sbGet(`theaters?name=eq.${enc(theater)}&select=manager,theater_phone&limit=1`);
    const cur = Object.assign({}, rows[0] || {});
    const before = String(cur[it.field] || '');
    const value = String(it.value || '').trim();
    if (!value) return { dup: '中身が空' };
    if (norm(before) === norm(value)) return { dup: 'もう同じ内容が入っている' };
    await sbPatch(`theaters?name=eq.${enc(theater)}`, { [it.field]: value });
    let noteId = null;
    if (it.field === 'manager' && before) {
      const n = await sbInsert('theater_notes', { company, theater, kind: 'note', body: `前の支配人: ${before}（${value} に交代）`, source_date: r.source_date || it.source_date || '', evidence: it.evidence || '', origin: 'ai', pending_id: it.id, created_by: 'AI（Opus）' });
      noteId = n && n.id;
    }
    return { noteId };
  }
  let kind = ['chronic', 'note', 'equipment'].includes(r.kind) ? r.kind : (FIELD_TO_KIND[it.field] || 'note');
  const body = String(r.body || it.value || '').trim();
  if (!body) return { dup: '中身が空' };
  // 同じ文がもうあれば入れない（AIの見落としの念のため）
  const existing = sameTheater ? notesOfOrig : await sbGet(`theater_notes?theater=eq.${enc(theater)}&select=body&limit=300`).catch(() => []);
  const key = norm(body).slice(0, 30);
  if (key && existing.some((n) => norm(n.body).indexOf(key) !== -1)) return { dup: '同じ内容がもうカルテにある' };
  const n = await sbInsert('theater_notes', {
    company, theater, kind, body, source_date: r.source_date || it.source_date || '', evidence: it.evidence || '',
    origin: 'ai', pending_id: it.id, created_by: 'AI（Opus）'
  });
  if (sameTheater) notesOfOrig.push({ kind, body }); // 同じ回の中の重なりも防ぐ
  return { noteId: n && n.id };
}

const STALE_MS = 10 * 60 * 1000;  // 「判定中」のまま10分たったもの（途中で止まった）は、もう一度見る
const notYet = (p, now) => !p.ai_checked_at || (p.ai_verdict === 'checking' && now - Date.parse(p.ai_checked_at) > STALE_MS);

async function runReview(body) {
  const started = Date.now();
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => /^[0-9a-f-]{36}$/i.test(String(x))).slice(0, 300) : [];
  const maxGroups = Math.max(1, Math.min(GROUPS_PER_CALL, Number(body.maxGroups) || GROUPS_PER_CALL));
  const maxItems = Math.max(1, Math.min(ITEMS_PER_GROUP, Number(body.maxItems) || ITEMS_PER_GROUP));
  let q = 'theater_info_pending?status=eq.pending&select=*&order=created_at.asc&limit=1000';
  if (ids.length) q += `&id=in.(${ids.join(',')})`;
  let pending = await sbGet(q);
  if (!ids.length) pending = pending.filter((p) => notYet(p, started));
  // aliases の列がまだ無い DB でも動くように
  const allTheaters = await sbGet('theaters?select=name,company,manager,theater_phone,aliases,short_name&limit=3000')
    .catch(() => sbGet('theaters?select=name,company,manager,theater_phone,aliases&limit=3000'))
    .catch(() => sbGet('theaters?select=name,company,manager,theater_phone&limit=3000'));
  const ctx = { allTheaters, nameSet: new Set(allTheaters.map((t) => t.name)), theaterRows: {}, byKey: {} };
  allTheaters.forEach((t) => { ctx.theaterRows[t.name] = t; (ctx.byKey[nameKey(t.name)] = ctx.byKey[nameKey(t.name)] || []).push(t.name); });
  // 一覧に無い名前でも、ゆれだけの違いで1つに決まれば一覧の名前にする（例「109シネマズ川崎」→「109シネマズ 川崎」）
  ctx.canon = makeCanon(allTheaters);
  const groups = {};
  pending.forEach((p) => { const k = ctx.canon(p.theater, p.company) || '（劇場不明）'; (groups[k] = groups[k] || []).push(p); });
  const keys = Object.keys(groups);
  const tally = { add: 0, dup: 0, wrong: 0, unsure: 0, error: 0 };
  let done = 0, failed = [];
  const todo = keys.slice(0, maxGroups);
  // 3劇場ずつ並べて動かす
  for (let i = 0; i < todo.length; i += 3) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const part = todo.slice(i, i + 3);
    const res = await Promise.all(part.map(async (k) => {
      const items = groups[k].slice(0, maxItems);
      // 判定中の印（ほかの呼び出しが同じ候補を二重に見ないように）
      await sbPatch(`theater_info_pending?id=in.(${items.map((x) => x.id).join(',')})`, { ai_verdict: 'checking', ai_reason: 'AIが判定中', ai_checked_at: new Date().toISOString() });
      try { return await reviewGroup(k, items, ctx); }
      catch (e) {
        failed.push(k + ': ' + e.message);
        // AIが失敗した時は印を外して、次の呼び出しでもう一度見る
        await sbPatch(`theater_info_pending?id=in.(${items.map((x) => x.id).join(',')})`, { ai_verdict: '', ai_reason: '', ai_checked_at: null }).catch(() => {});
        return null;
      }
    }));
    res.forEach((t, j) => {
      if (!t) return;
      done += Math.min(groups[part[j]].length, maxItems);
      Object.keys(tally).forEach((k) => { tally[k] += t[k] || 0; });
    });
  }
  // 残り（まだAIが見ていない候補）
  let remaining = 0;
  if (!ids.length) {
    const rest = await sbGet('theater_info_pending?status=eq.pending&select=id,ai_checked_at,ai_verdict&limit=1000');
    remaining = rest.filter((p) => notYet(p, Date.now())).length;
  }
  return { ok: true, checked: done, tally, remaining, failed: failed.slice(0, 5), model: AI_MODEL };
}

// ---------- 機器表 ----------
const EQUIP_SYSTEM = [
  'あなたは空調設備の技術者です。映画館（シネコン）の機器表・機器台帳・点検表・竣工図の機器リストを読み、機器の一覧にします。',
  '・空調・換気・熱源の機器を全部挙げる（室外機・室内機・パッケージエアコン・空調機(AHU)・外調機・全熱交換器・送風機・排気ファン・チラー・ポンプ・冷却塔・ボイラー・加湿器・エアカーテン など）。照明・音響・映写機は入れない。',
  '・表の1行を1件にする。同じ型の機器がまとめて書かれていれば qty に台数。',
  '・system 系統（例: シアター1系統・ロビー系統・映写室系統）、symbol 機器記号（例: PAC-1・AC-3・RTU-10A）、kind 種別（上の言葉で）。',
  '・maker メーカー、model 型式（書いてあるまま）。cool_kw 冷房能力・heat_kw 暖房能力は kW（kcal/h なら ÷860、馬力しか無ければ 1馬力＝2.8kW。分からなければ null）。',
  '・year 設置年か製造年を西暦4けた（和暦は直す。例: H24→2012。分からなければ空文字）。serves 受け持つ部屋（シアターは "SCR1" の形）。location 設置場所（屋上・機械室など）。',
  '・note その他（冷媒・電源・風量など、大事なものだけ短く）。src どのファイルの何ページ・何行目か。unsure 読みにくい・2通りに読める時に理由（無ければ空文字）。',
  '・書いてないことを推測で埋めない。答えの文章は日本語で短く。'
].join('\n');

async function runEquipment(body) {
  const content = [];
  const files = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
  for (const f of files) {
    const url = String(f.url || '');
    if (url.indexOf(FILE_PREFIX) !== 0) return { status: 400, error: 'ファイルの場所が正しくありません' };
    const mt = String(f.mediaType || '');
    content.push({ type: 'text', text: `ファイル「${String(f.name || '').slice(0, 120)}」` });
    if (mt === 'application/pdf') content.push({ type: 'document', source: { type: 'url', url } });
    else if (/^image\/(jpeg|png|webp|gif)$/.test(mt)) content.push({ type: 'image', source: { type: 'url', url } });
    else return { status: 400, error: '対応しているのは PDF・画像（JPEG/PNG/WebP）・Excel です' };
  }
  const text = String(body.text || '').slice(0, 120000);
  if (text) content.push({ type: 'text', text: `ファイル「${String(body.textName || 'Excel').slice(0, 120)}」の中身（シートごと・タブ区切り）:\n${text}` });
  if (!content.length) return { status: 400, error: '機器表のファイルを入れてください' };
  content.push({ type: 'text', text: `劇場: ${String(body.theater || '').slice(0, 80)}。この機器表の機器を全部、決まった形で答えてください。` });
  let out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: EQUIP_SYSTEM, content, schema: EQUIP_SCHEMA, effort: 'medium', maxTokens: 32000 });
  if (out.error && out.status === 400 && /url|source|fetch|download/i.test(out.error)) {
    const inline = await inlineFiles(content);
    if (inline) out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: EQUIP_SYSTEM, content: inline, schema: EQUIP_SCHEMA, effort: 'medium', maxTokens: 32000 });
  }
  if (out.error) return { status: 502, error: out.error };
  return { status: 200, ok: true, data: out.data, model: AI_MODEL };
}
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
  const task = String(body.task || '');
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const flush = String(req.headers['x-flush-key'] || '');
  const fromGas = !!(svc && flush && flush === svc);
  if (!fromGas) {
    const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
    if (!token || !(await isRyonetsuUser(token))) return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 未設定' });
  try {
    if (task === 'review') {
      if (!svc) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 未設定' });
      return res.status(200).json(await runReview(body));
    }
    if (task === 'equipment' && !fromGas) {
      const out = await runEquipment(body);
      return res.status(out.status).json(out.error ? { error: out.error } : { ok: true, data: out.data, model: out.model });
    }
    return res.status(400).json({ error: 'task が正しくありません' });
  } catch (e) {
    console.error('theater-ai 失敗', e);
    return res.status(500).json({ error: '処理に失敗しました', detail: e.message });
  }
}
