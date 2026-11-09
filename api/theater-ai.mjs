// 劇場カルテの AI（Opus）
//
//   task 'review'    … 「劇場情報更新確認」に溜まった候補を、その劇場の今の情報と見比べて判定し、
//                      合っている新しい情報は劇場カルテに自動で入れる（theater_notes / theater_contacts / 支配人・電話）。
//                      重複・間違いは除く。AIが迷ったものだけ「更新確認」に残す（理由つき）。
//   task 'equipment' … 機器表（PDF・画像、または Excel を文字にしたもの）を読み、機器の一覧（表）にする。保存はしない。
//   task 'verify'    … 会社の公式サイト（劇場一覧）を web_fetch で読み、劇場の一覧と見比べる。公式サイトに無い劇場は
//                      theaters.hidden=true（劇場カルテの一覧に出さない。データは消さない）。前に隠して今はある劇場は戻す。
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
    verdict: { type: 'string', enum: ['add', 'dup', 'wrong', 'unsure'] },
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

const REVIEW_SYSTEM = [
  'あなたは、映画館（シネコン）の空調・設備の保守会社「菱熱工業」で、劇場ごとの「劇場カルテ」を管理する担当者です。',
  'メール・LINE・会議の記録から別のAIが拾った「劇場カルテに足す候補」を、その劇場の今のカルテと見比べて1件ずつ判定します。',
  '',
  '判定（verdict）:',
  '・add    … その劇場について長く役に立つ事実で、今のカルテにまだ無い。→ カルテに入れる。',
  '・dup    … 今のカルテに同じ意味の内容がもうある（言い方が違うだけ・前の情報の言い直し）。',
  '・wrong  … カルテに入れるべきでない。例：一時的な連絡・案件の進み具合や日程だけの話・挨拶・社内の段取り・ほかの劇場や劇場でない場所の話・根拠のない推測・読み間違い。',
  '・unsure … 判断できない（今のカルテと食い違う・どの劇場の話か分からない・内容があいまい）。人が確かめる。',
  '迷った時に add にしないこと。ただし、根拠がはっきりしていて新しい事実なら、細かくても add でよい（機器の型式・系統・更新した年・繰り返す故障・作業の決まりなど）。',
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
      let target = theater;
      const rt = ctx.canon(r.theater);
      if (rt && ctx.nameSet.has(rt)) target = rt;
      if (verdict === 'add' && !ctx.nameSet.has(target)) { verdict = 'unsure'; reason = '劇場の一覧に無い名前: ' + target + (reason ? '／' + reason : ''); }
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
  const allTheaters = await sbGet('theaters?select=name,company,manager,theater_phone&limit=2000');
  const ctx = { allTheaters, nameSet: new Set(allTheaters.map((t) => t.name)), theaterRows: {}, byKey: {} };
  allTheaters.forEach((t) => { ctx.theaterRows[t.name] = t; (ctx.byKey[nameKey(t.name)] = ctx.byKey[nameKey(t.name)] || []).push(t.name); });
  // 一覧に無い名前でも、ゆれだけの違いで1つに決まれば一覧の名前にする（例「109シネマズ川崎」→「109シネマズ 川崎」）
  ctx.canon = (n) => { if (!n || ctx.nameSet.has(n)) return n || ''; const c = ctx.byKey[nameKey(n)] || []; return c.length === 1 ? c[0] : n; };
  const groups = {};
  pending.forEach((p) => { const k = ctx.canon(p.theater) || '（劇場不明）'; (groups[k] = groups[k] || []).push(p); });
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

// ---------- 公式サイトで確かめる（閉館などで無くなった劇場を隠す） ----------
// 会社ごとの公式サイト。urls は AI が最初に開いてよいページ（web_fetch は会話に出た URL しか開けないため、
// 劇場一覧・サイトマップの候補を並べておく）。hosts は読んでよいサイト（www. などの下の名前も含む）
const OFFICIAL = {
  'TOHOシネマズ': { urls: ['https://www.tohotheater.jp/theater/find.html', 'https://www.tohotheater.jp/'], hosts: ['tohotheater.jp'] },
  '109シネマズ': { urls: ['https://109cinemas.net/', 'https://109cinemas.net/sitemap.xml'], hosts: ['109cinemas.net'] },
  'ユナイテッドシネマ': { urls: ['https://www.unitedcinemas.jp/', 'https://www.unitedcinemas.jp/sitemap.xml'], hosts: ['unitedcinemas.jp'] },
  '佐々木興業': { urls: ['https://www.cinemasunshine.co.jp/', 'https://www.cinemasunshine.co.jp/theater/', 'https://www.cinemasunshine.co.jp/sitemap.xml'], hosts: ['cinemasunshine.co.jp'] },
  'シネマサンシャイン': { urls: ['https://www.cinemasunshine.co.jp/', 'https://www.cinemasunshine.co.jp/theater/', 'https://www.cinemasunshine.co.jp/sitemap.xml'], hosts: ['cinemasunshine.co.jp'] },
  'コロナワールド': { urls: ['https://www.korona.co.jp/', 'https://www.korona.co.jp/cinema/', 'https://www.coronaworld.co.jp/'], hosts: ['korona.co.jp', 'coronaworld.co.jp'] },
  'MOVIX': { urls: ['https://www.smt-cinema.com/', 'https://www.smt-cinema.com/sitemap.xml'], hosts: ['smt-cinema.com'] },
  'イオンシネマズ': { urls: ['https://www.aeoncinema.com/theater/', 'https://www.aeoncinema.com/'], hosts: ['aeoncinema.com'] }
};
const VERIFY_SCHEMA = obj({
  site_ok: { type: 'boolean' },
  official_list: arr(str),
  theaters: arr(obj({ name: str, status: { type: 'string', enum: ['exists', 'closed', 'unknown'] }, official_name: str, reason: str })),
  source_url: str,
  note: str
});
const HIDE_REASON_MAX = 120;
// 劇場名の「場所」の部分（会社名・空白・記号を取る）。「TOHOシネマズ 名古屋ベイシティ」→「名古屋ベイシティ」
const CO_WORDS = /(TOHO\s*シネマズ|TOHO\s*CINEMAS|109\s*シネマズ|109\s*CINEMAS|ユナイテッド[・･\s]*シネマ[ズ]?|UNITED\s*CINEMAS|シネマサンシャイン|CINEMA\s*SUNSHINE|コロナシネマワールド|コロナワールド|MOVIX|イオンシネマ[ズ]?|劇場|シネマ|映画館)/gi;
export function placeCore(name) {
  return String(name || '').normalize('NFKC').replace(CO_WORDS, '').replace(/[\s　・･\-－ー（）()「」『』.,、。]/g, '').toLowerCase();
}
// アプリの劇場名が、公式サイトの一覧のどれかと同じ劇場らしいか（場所の部分が含まれ合う）
export function officialMatch(name, list) {
  const c = placeCore(name); if (c.length < 2) return '';
  for (const o of list || []) {
    const oc = placeCore(o); if (oc.length < 2) continue;
    if (oc === c || oc.includes(c) || c.includes(oc)) return o;
  }
  return '';
}
// 一度にこれより多く「無い」となった時は、名前の書き方の違いなどで AI が見落としている恐れがあるので自動では隠さない
const autoHideLimit = (n) => Math.max(3, Math.ceil(n * 0.15));
async function runVerify(body) {
  const company = String(body.company || '');
  const site = OFFICIAL[company];
  if (!site) return { status: 400, error: 'この会社の公式サイトは登録されていません: ' + company };
  const rows = await sbGet(`theaters?company=eq.${enc(company)}&select=name,hidden,hidden_reason,official_name&order=name.asc&limit=500`);
  if (!rows.length) return { status: 200, ok: true, company, checked: 0, hidden: [], shown: [], unknown: [], suspect: [], note: '劇場がありません' };
  const tools = [
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 15, allowed_domains: site.hosts },
    { type: 'web_search_20260209', name: 'web_search', max_uses: 8, allowed_domains: site.hosts }
  ];
  const prompt = [
    `${company} の公式サイトで、今営業している劇場（映画館）の一覧を読んでください。最初に開くページの候補:`,
    site.urls.map((u) => '- ' + u).join('\n'),
    '・一覧が無ければ、同じサイトの中の「劇場一覧」「劇場を探す」「シアター一覧」などのリンクや、サイトマップ（sitemap.xml）をたどる。',
    '・劇場名がページに出てこない（後から読み込まれる）時は、web_search（このサイトの中だけ）で劇場のページを探してよい。',
    '・official_list に、公式サイトで見つけた今営業中の劇場の名前を全部、公式の書き方のまま入れる。',
    '・そのうえで、下の「アプリの劇場の一覧」の1つずつについて答える:',
    '  exists＝公式サイトにある。名前の書き方が違っても、場所が同じなら exists（例「TOHOシネマズ 名古屋」と「TOHOシネマズ名古屋ベイシティ」、「ららぽーと横浜」と「TOHOシネマズららぽーと横浜」）',
    '  closed＝公式サイトに「閉館」「営業終了」と書いてある、または一覧を全部読み、さらに web_search でその場所の名前を探しても劇場のページが無かった時だけ',
    '  unknown＝それ以外。サイトが開けなかった・一覧を最後まで読めなかった・迷った時は unknown（閉館と決めつけない）',
    '・official_name は公式サイトでの名前（exists の時）。reason は判断の理由を日本語で短く（40字くらい。閉館の時は、どこにそう書いてあったか）。',
    '・site_ok は公式サイトの劇場一覧を最後まで読めた時だけ true。読めなかったら false にして、全部 unknown にする。',
    '・name は下の一覧の名前を1文字も変えずにそのまま返す。',
    '',
    '■ アプリの劇場の一覧',
    rows.map((r) => '- ' + r.name).join('\n')
  ].join('\n');
  const out = await claudeJson({ model: AI_MODEL, prevModel: AI_MODEL_PREV, system: 'あなたは映画館チェーンの劇場一覧を、公式サイトで確かめる担当者です。決まった JSON の形で答えます。推測で閉館と決めつけないこと。', content: prompt, schema: VERIFY_SCHEMA, tools, effort: 'medium', maxTokens: 24000, maxTurns: 10 });
  if (out.error) return { status: 502, error: out.error };
  const d = out.data || {};
  const official = (d.official_list || []).map(String).filter(Boolean);
  // 公式サイトの一覧がほとんど取れていない時は、読めなかったのと同じ扱い
  const siteOk = !!d.site_ok && official.length >= Math.min(3, rows.length);
  const byName = {}; (d.theaters || []).forEach((t) => { if (t && t.name) byName[t.name] = t; });
  // AI が「無い」と言っても、公式の一覧に場所の名前が同じ劇場があれば「ある」とみなす（書き方の違いで隠さない）
  for (const r of rows) {
    const t = byName[r.name];
    if (t && t.status === 'closed' && !/閉館|営業終了|閉鎖/.test(t.reason || '')) {
      const m = officialMatch(r.name, official);
      if (m) Object.assign(t, { status: 'exists', official_name: m, reason: '公式の一覧に同じ場所の劇場がある: ' + m });
    }
  }
  // AI が前に自動で隠した劇場（理由が「公式サイトに無い: 」）も数に入れる。人が隠した・人が戻した劇場は入れない
  const autoHidden = (r) => r.hidden && /^公式サイトに無い: /.test(r.hidden_reason || '');
  const closed = rows.filter((r) => { const t = byName[r.name]; return t && t.status === 'closed' && !/^人が戻した/.test(r.hidden_reason || '') && (!r.hidden || autoHidden(r)); });
  const tooMany = closed.length > autoHideLimit(rows.length);
  const now = new Date().toISOString();
  const res = { status: 200, ok: true, company, checked: rows.length, site_ok: siteOk, official_count: official.length, official_list: official.slice(0, 300), hidden: [], shown: [], unknown: [], suspect: [], source_url: d.source_url || '', note: d.note || '' };
  for (const r of rows) {
    const t = byName[r.name];
    if (!siteOk || !t || t.status === 'unknown') { res.unknown.push(r.name); continue; }
    const patch = { verified_at: now, official_name: t.status === 'exists' ? String(t.official_name || '').slice(0, 120) : r.official_name || '' };
    if (t.status === 'closed' && /^人が戻した/.test(r.hidden_reason || '')) {
      res.unknown.push(r.name);   // 人が「隠すのをやめる」で戻した劇場は、AI が無いと言っても隠さない
    } else if (t.status === 'closed' && tooMany && (!r.hidden || autoHidden(r))) {
      // 多すぎる → 自動では隠さず、人に確かめてもらう（前に AI が自動で隠したものも一度戻して候補に出す）
      if (r.hidden) { patch.hidden = false; patch.hidden_reason = ''; }
      res.suspect.push({ name: r.name, reason: t.reason || '' });
    } else if (t.status === 'closed') {
      patch.hidden = true; patch.hidden_reason = ('公式サイトに無い: ' + String(t.reason || '')).slice(0, HIDE_REASON_MAX);
      if (!r.hidden) res.hidden.push({ name: r.name, reason: t.reason || '' });
    } else if (t.status === 'exists' && r.hidden && /^公式サイトに無い/.test(r.hidden_reason || '')) {
      // 前に公式サイトに無いとして隠した劇場が、今は公式サイトにある → 戻す（人が隠したものは戻さない）
      patch.hidden = false; patch.hidden_reason = '';
      res.shown.push(r.name);
    }
    await sbPatch(`theaters?name=eq.${enc(r.name)}`, patch);
  }
  return res;
}

// 「公式サイトで確かめる」で、自動では隠さなかった劇場（多すぎた時）を、人が見て隠す
async function runVerifyHide(body) {
  const names = (Array.isArray(body.names) ? body.names : []).map(String).filter(Boolean).slice(0, 200);
  if (!names.length) return { status: 400, error: '隠す劇場がありません' };
  for (const n of names) await sbPatch(`theaters?name=eq.${enc(n)}`, { hidden: true, hidden_reason: ('公式サイトに無い（人が見て隠した）: ' + String((body.reasons || {})[n] || '')).slice(0, HIDE_REASON_MAX) });
  return { status: 200, ok: true, hidden: names.length };
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
    if (task === 'verify' && !fromGas) {
      if (!svc) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 未設定' });
      const out = await runVerify(body);
      return res.status(out.status).json(out.error ? { error: out.error } : out);
    }
    if (task === 'verify-hide' && !fromGas) {
      if (!svc) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 未設定' });
      const out = await runVerifyHide(body);
      return res.status(out.status).json(out.error ? { error: out.error } : out);
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
