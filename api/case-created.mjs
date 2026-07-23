// Supabase Database Webhook → LINEグループ通知
//
// 必須 ENV:
//   SUPABASE_WEBHOOK_SECRET   - Supabase Webhook の HTTP Header に同じ値を設定
//   LINE_CHANNEL_ACCESS_TOKEN - LINE Messaging API のチャネルアクセストークン
//   LINE_TARGET_GROUP_ID      - 通知先のLINEグループID
//   ANTHROPIC_API_KEY         - Anthropic Console で発行したAPIキー（任意。未設定ならAI判断はスキップ）
//   SUPABASE_SERVICE_ROLE_KEY - (任意/Lv2) 同じ劇場の過去案件を参照して診断精度を上げる。未設定なら履歴なしで動作
//   SUPABASE_URL              - (任意) 既定 https://hykjpadvbficiiuockhj.supabase.co
//
// 動作:
//   - INSERT (新規案件): 通知。種別=修理 のときだけ Claude APIで「依頼先パートナー・注意点・過去の類似」を診断して添付
//   - UPDATE (既存案件): 内容 / メモ / 見積り提出日 / 作業開始日 / 作業完了日 に値が入った・変わった時だけ通知（AIは使わない）
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
const AI_MODEL = 'claude-sonnet-4-6';
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001'; // 更新通知の「案件」1行要約（安いモデルで十分）
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';

// 重複通知の抑止: 同じ内容の通知キーを line_notify_log に記録し、既にあれば送らない。
// Supabase Webhook が同一変更を二重発火しても1通に収める。テーブル未作成/キー無しなら抑止せず通常送信。
async function isDuplicateNotification(signature) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/line_notify_log`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        // 既存キーは無視して挿入。返った行が空＝重複（既に送信済み）
        Prefer: 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify({ signature })
    });
    if (!r.ok) return false; // テーブル未作成等 → 抑止しない（通常どおり送る）
    const rows = await r.json();
    return Array.isArray(rows) && rows.length === 0; // 空配列＝重複
  } catch (e) {
    console.error('dedup確認エラー', e);
    return false;
  }
}
// 10分単位のバケットを含めた通知キー（数秒差の二重発火は同一キー、時間が経てば別キー）
function notifySignature(type, c, changes) {
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const changeKey = (changes || []).map((x) => `${x.label}=${x.value}`).join('|');
  return `${type}:${c.id}:${bucket}:${changeKey}`.slice(0, 480);
}

// ===== Supabase REST 共通（service_role） =====
function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
async function sbGet(pathAndQuery) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`sbGet ${r.status}: ${await r.text()}`);
  return r.json();
}
async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`sbInsert ${r.status}: ${await r.text()}`);
}
async function sbPatch(pathAndQuery, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`sbPatch ${r.status}: ${await r.text()}`);
}
// 条件に合う行を削除しつつ中身を返す（まとめ通知の“取り出し”をアトミックに）
async function sbDeleteReturning(pathAndQuery) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method: 'DELETE', headers: { ...sbHeaders(), Prefer: 'return=representation' }
  });
  if (!r.ok) throw new Error(`sbDelete ${r.status}: ${await r.text()}`);
  return r.json();
}

// 更新を即送らず pending_notifications に貯める（5分後に flush がまとめて1通送る）。
// 同じ案件への複数更新は1行にマージ（内容/社内用メモは改行連結、日付等は最新で上書き）。
async function accumulatePendingUpdate(c, changes) {
  const id = String(c.id);
  const existing = await sbGet(`pending_notifications?case_id=eq.${encodeURIComponent(id)}&select=*`);
  const prev = (existing && existing[0]) || null;
  const merged = Object.assign({}, prev ? prev.changes : {});
  for (const ch of changes) {
    if (TEXT_LABELS.has(ch.label) && merged[ch.label]) {
      if (String(merged[ch.label]).indexOf(ch.value) === -1) merged[ch.label] += '\n' + ch.value;
    } else {
      merged[ch.label] = ch.value;
    }
  }
  const record = {
    id: id, company: c.company, theater: c.theater, category: c.category,
    r_person: c.r_person, content: c.content, estimate_name: c.estimate_name,
    // 通知文言（更新/自動更新）の判定用。null=AI/メール自動、値あり=担当者がアプリで更新
    updated_by: c.updated_by || null
  };
  const now = new Date().toISOString();
  if (prev) {
    await sbPatch(`pending_notifications?case_id=eq.${encodeURIComponent(id)}`, { changes: merged, record, updated_at: now });
  } else {
    await sbInsert('pending_notifications', { case_id: id, changes: merged, record, first_change_at: now, updated_at: now });
  }
}

// flush 側（api/flush-notifications.mjs）から使う共有関数をエクスポート
export {
  detectChanges, buildUpdateMessage, summarizeCaseOneLine,
  isDuplicateNotification, notifySignature, pushLineMessage, sbDeleteReturning
};

// AI診断は「修理案件」のみ実施（依頼先＝社外パートナー企業の選定が目的）
function isRepairCase(c) {
  return String(c.category || '').trim() === '修理';
}

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

  // ── 新規登録（INSERT）: 修理案件のみAI診断（依頼先パートナー）つきで通知 ──
  if (payload.type === 'INSERT') {
    let aiAdvice = '';
    if (isRepairCase(c)) {
      try {
        aiAdvice = await getInitialResponseAdvice(c);
      } catch (e) {
        console.error('AI判断エラー', e);
        aiAdvice = `(AI判断エラー: ${e.message})`;
      }
    }
    if (await isDuplicateNotification(notifySignature('INSERT', c, []))) {
      return res.status(200).json({ skipped: 'duplicate' });
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

  // ── 更新（UPDATE）: 内容 / 社内用メモ / 見積り提出日 / 作業開始日 / 作業完了日 が記入・変更された時だけ通知 ──
  // すぐ送らず pending に貯めて5分デバウンス。同じ案件への連続更新をまとめて1通にする（flushが送信）。
  if (payload.type === 'UPDATE') {
    const before = payload.old_record || {};
    // 社内メモ(memo)に追記があれば、客先向けに要約して内容(content)へ追記する。
    // （content の PATCH が別のUPDATE webhookを発火させ、そちらが「内容更新」として通知する。
    //   社内メモの更新それ自体は通知しない）
    let summarized = false;
    try {
      summarized = await summarizeMemoIntoContent(before, c);
    } catch (e) {
      console.error('社内メモ→内容 要約エラー', e);
    }
    const changes = detectChanges(before, c);
    if (changes.length === 0) {
      // 対象項目（内容/顧客メモ/見積り提出日/作業開始日/作業完了日）以外の変更は通知しない。
      // 社内メモのみの更新もここで終了（要約は上で content へ反映済み・その content 更新で通知される）
      return res.status(200).json({ skipped: 'no relevant change', summarized });
    }
    try {
      await accumulatePendingUpdate(c, changes);
      return res.status(200).json({ ok: true, queued: true });
    } catch (e) {
      console.error('pending蓄積エラー→即時送信でフォールバック', e);
      if (await isDuplicateNotification(notifySignature('UPDATE', c, changes))) {
        return res.status(200).json({ skipped: 'duplicate' });
      }
      const summary = await summarizeCaseOneLine(c);
      try {
        await pushLineMessage(process.env.LINE_TARGET_GROUP_ID, buildUpdateMessage(c, changes, summary));
      } catch (e2) {
        console.error('LINE push エラー', e2);
        return res.status(500).json({ ok: false, error: 'LINE push failed', detail: e2.message });
      }
      return res.status(200).json({ ok: true, changed: changes.map((x) => x.label), fallback: true });
    }
  }

  // それ以外（DELETE等）は対象外
  return res.status(200).json({ skipped: true });
}

// 同じ劇場の過去案件を Supabase から取得（RLSをまたぐためサービスロールキーが必要。未設定/失敗なら空配列）
async function fetchTheaterHistory(theater, excludeId) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !theater) return [];
  const params = new URLSearchParams({
    theater: `eq.${theater}`,
    select: 'id,received_date,category,content,memo,status,r_person,estimate_name,work_end_date',
    order: 'received_date.desc',
    limit: '8'
  });
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cases?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) { console.error('Supabase履歴取得失敗', r.status, await r.text()); return []; }
    const rows = await r.json();
    return Array.isArray(rows) ? rows.filter((x) => x && x.id !== excludeId) : [];
  } catch (e) { console.error('Supabase履歴取得エラー', e); return []; }
}

// Lv3: 劇場カルテ（設備・持病・支配人・パートナー連絡先）を客先マスタから取得
async function fetchTheaterNote(theater) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !theater) return null;
  const params = new URLSearchParams({
    name: `eq.${theater}`,
    select: 'company,equipment,chronic_issues,partner,manager,theater_phone,maintenance,gem2,info_note',
    limit: '1'
  });
  try {
    let r = await fetch(`${SUPABASE_URL}/rest/v1/theaters?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) {
      // 劇場情報列（manager等）が未移行のDBでは旧カルテ列のみで再試行
      const p2 = new URLSearchParams({ name: `eq.${theater}`, select: 'company,equipment,chronic_issues,partner', limit: '1' });
      r = await fetch(`${SUPABASE_URL}/rest/v1/theaters?${p2.toString()}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      if (!r.ok) { console.error('劇場カルテ取得失敗', r.status, await r.text()); return null; }
    }
    const rows = await r.json();
    const t = (Array.isArray(rows) && rows[0]) || null;
    const contacts = await fetchTheaterContacts(theater, t && t.company);
    if (!t && !contacts.length) return null;
    const out = t || {};
    out.contacts = contacts;
    return out;
  } catch (e) { console.error('劇場カルテ取得エラー', e); return null; }
}

// 各劇場情報: パートナー連絡先（theater_contacts）。会社の（共通）連絡先も含める
async function fetchTheaterContacts(theater, company) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !theater) return [];
  const targets = [theater];
  if (company) targets.push(`${company}（共通）`);
  const params = new URLSearchParams({
    theater: `in.(${targets.map((s) => `"${s}"`).join(',')})`,
    select: 'theater,category,maker,vendor,person,phone,email,note',
    order: 'sort_order.asc',
    limit: '40'
  });
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/theater_contacts?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) return []; // theater_contacts 未作成の環境では黙ってスキップ
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) { return []; }
}

function formatTheaterNote(t) {
  if (!t) return '(この劇場のカルテは未登録)';
  const lines = [];
  if (t.manager) lines.push('・支配人: ' + t.manager);
  if (t.theater_phone) lines.push('・劇場連絡先: ' + t.theater_phone);
  if (t.maintenance) lines.push('・保守契約: ' + t.maintenance);
  if (t.gem2) lines.push('・GeM2: ' + t.gem2);
  if (t.equipment) lines.push('・設備: ' + t.equipment);
  if (t.chronic_issues) lines.push('・持病/注意: ' + t.chronic_issues);
  if (t.partner) lines.push('・担当パートナー: ' + t.partner);
  if (t.info_note) lines.push('・備考: ' + t.info_note);
  if (t.contacts && t.contacts.length) {
    lines.push('・パートナー連絡先（相談先の選定に使う。備考の注意書きは必ず守る）:');
    for (const c of t.contacts) {
      const parts = [c.category, c.maker, c.vendor, c.person, c.phone, c.email].filter(Boolean).join(' / ');
      const note = c.note ? `（${c.note}）` : '';
      lines.push('   - ' + parts + note);
    }
  }
  if (!lines.length) return '(この劇場のカルテは未登録)';
  return lines.join('\n');
}

function formatTheaterHistory(rows) {
  if (!rows.length) return '(この劇場の過去案件はまだありません)';
  return rows.map((x, i) => {
    const line = `${i + 1}. ${x.received_date || '日付不明'} [${x.category || '種別不明'}] ${x.status || ''}`;
    const detail = x.content ? `\n   内容: ${String(x.content).slice(0, 120)}` : '';
    const memo = x.memo ? `\n   社内用メモ: ${String(x.memo).slice(0, 120)}` : '';
    const who = x.r_person ? `\n   R担当: ${x.r_person}` : '';
    return line + detail + memo + who;
  }).join('\n');
}

// Lv4: 同じ劇場で「人が確定した正しい対応メモ(advice_note)」を取得（列が無い/失敗なら空＝Lv2以前に影響なし）
async function fetchTheaterAdvice(theater) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !theater) return [];
  const params = new URLSearchParams({
    theater: `eq.${theater}`,
    advice_note: 'not.is.null',
    select: 'received_date,category,advice_note',
    order: 'received_date.desc',
    limit: '6'
  });
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cases?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) return []; // advice_note 列が未追加でも診断は継続
    const rows = await r.json();
    return Array.isArray(rows) ? rows.filter((x) => x && String(x.advice_note || '').trim()) : [];
  } catch (e) { return []; }
}

function formatTheaterAdvice(rows) {
  if (!rows.length) return '(この劇場の学習メモはまだありません)';
  return rows.map((x, i) => `${i + 1}. [${x.category || '種別不明'}] ${String(x.advice_note).slice(0, 200)}`).join('\n');
}

async function getInitialResponseAdvice(c) {
  if (!process.env.ANTHROPIC_API_KEY) return '(ANTHROPIC_API_KEY 未設定のため AI判断はスキップ)';

  // Lv2: 同じ劇場の過去案件（Lv4: 正解メモ含む） / Lv3: 劇場カルテ を並行取得（無ければ空でLv1相当）
  const [history, note, advice] = await Promise.all([
    fetchTheaterHistory(c.theater, c.id),
    fetchTheaterNote(c.theater),
    fetchTheaterAdvice(c.theater)
  ]);

  const system = [
    'あなたは菱熱工業（シネコン設備の保守/工事）の修理案件アシスタントです。',
    '新規の修理案件について「どの社外パートナー企業に依頼すべきか」を診断します。',
    '',
    '厳守事項:',
    '- 依頼先・相談先として挙げてよいのは【社外パートナー企業】のみ（劇場カルテのパートナー連絡先、過去案件に実際に出てくる業者）。',
    '- 菱熱工業の社内メンバー名（小山・細萱・大和・山口・金子・若山・伊藤・藤村・山本 など）は絶対に出力しない。',
    '- 根拠のない業者を推測で挙げない。該当する連絡先情報が無ければ「この系統のパートナーはカルテ未登録。各劇場情報への登録推奨」と書く。',
    '- パートナー連絡先の備考にある注意書き（例:「アズビル本体に電話しない」「支配人携帯には電話しない」）は必ず守り、注意点にも明記する。',
    '- 過去の類似案件（同じ設備・同じ症状）は「内容」「社内用メモ」「AI学習用メモ」から探し、当時起きたこと・ハマった点を短く引用する。無ければ無いと書く。',
    '- 「AI学習用メモ（人が確定した正しい対応）」があれば、最も信頼できる正解として最優先で反映する。'
  ].join('\n');

  const user = [
    '# 今回の修理案件',
    `- 会社: ${c.company || '(未設定)'}`,
    `- 劇場: ${c.theater || '(未設定)'}`,
    `- 受付日: ${c.received_date || '(未設定)'}`,
    `- 内容: ${c.content || '(未記入)'}`,
    '',
    `# 劇場カルテ（${c.theater || '不明'}／設備・持病・パートナー連絡先）`,
    formatTheaterNote(note),
    '',
    `# AI学習用メモ（${c.theater || '不明'}／人が確定した正しい対応・最優先で反映）`,
    formatTheaterAdvice(advice),
    '',
    `# この劇場（${c.theater || '不明'}）の過去案件（新しい順）`,
    formatTheaterHistory(history),
    '',
    '# 出力フォーマット（厳守・絵文字なし・この3項目だけ）',
    '【依頼先】この劇場のパートナー連絡先から系統の合う業者1-2件（業者名・担当者・電話＋一行の理由）',
    '【注意点】この案件内容で気を付けること1-3行（劇場の持病・連絡先備考の注意書きを反映）',
    '【過去の類似】同劇場の類似案件の要点1-3行（症状と当時の対応/教訓。無ければ「類似案件なし」）'
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
      max_tokens: 600,
      system: system,
      messages: [{ role: 'user', content: user }]
    })
  });
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.content && data.content[0] && data.content[0].text) || '(AI応答が空)';
}

function buildLineMessage(c, aiAdvice) {
  // created_by が無い＝AI/メール自動登録（サービスロール）、有る＝担当者がアプリで登録
  const auto = !c.created_by;
  const head = [
    auto ? '📋 新規案件が自動登録されました' : '📋 新規案件が登録されました',
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
  // AI診断は修理案件のみ（依頼先パートナーの提案）。それ以外は案件情報のみ通知
  const tail = aiAdvice ? [
    '',
    '━━━━━━━━━━━━',
    '🤖 AI診断（依頼先パートナー）',
    aiAdvice,
    '',
    `🔗 ${APP_URL}/?case=${c.id}`
  ] : [
    '',
    `🔗 ${APP_URL}/?case=${c.id}`
  ];
  return [...head, ...tail].join('\n').slice(0, 4900);
}

// 通知対象の更新フィールド（この項目に値が入った/変わった時だけ通知。ステータス変更は通知しない）
// ※ 社内メモ(memo) は通知対象外。菱熱の社内事情なので客先向けの通知には出さない
//    （社内メモの追記分はサーバ側でAI要約→内容(content)へ追記し、その内容更新として通知する）
// ※ 顧客メモ(customer_memo) は客先が記入した時に菱熱へ通知する
const NOTIFY_FIELDS = [
  { key: 'content', label: '内容', text: true },
  { key: 'customer_memo', label: '顧客メモ', text: true },
  { key: 'quote_date', label: '見積り提出日' },
  { key: 'work_start_date', label: '作業開始日' },
  { key: 'work_end_date', label: '作業完了日' }
];
// 追記式（前の値に足していく）ラベル＝まとめ通知でも改行で連結する
const TEXT_LABELS = new Set(['内容', '顧客メモ']);
function norm(v) { return v == null ? '' : String(v).trim(); }

// 内容/メモ/見積り提出日/作業開始日/作業完了日 のうち、
// 「新しい値が空でなく、かつ前と変わった」項目だけを返す（記入・追加・変更を検知。空にした時は通知しない）
// text項目（内容・メモ）は、履歴全文ではなく「今回追記・変更された差分だけ」を返す。
function detectChanges(before, after) {
  const changes = [];
  for (const f of NOTIFY_FIELDS) {
    const ov = norm(before[f.key]);
    const nv = norm(after[f.key]);
    if (nv === '' || nv === ov) continue;
    if (f.text) {
      // 末尾に追記された場合はその差分だけ。途中変更など前方一致しない場合のみ新しい全文を短く表示
      let diff = (ov && nv.startsWith(ov)) ? nv.slice(ov.length) : nv;
      diff = diff.trim();
      if (diff === '') continue; // 実質的な変化なし（空白のみ）
      changes.push({ label: f.label, value: diff.slice(0, 300) });
    } else {
      changes.push({ label: f.label, value: nv });
    }
  }
  return changes;
}

// 社内メモ(memo)で「今回追記された差分」だけを取り出す（前方一致する末尾追記を想定。
// 途中変更などで前方一致しない場合は新しい全文を差分とみなす）。差分が無ければ空文字。
function appendedText(before, after) {
  const ov = norm(before);
  const nv = norm(after);
  if (nv === '' || nv === ov) return '';
  let diff = (ov && nv.startsWith(ov)) ? nv.slice(ov.length) : nv;
  return diff.trim();
}

// 社内メモの追記分(delta)を、客先に見せてよい「内容(content)」向けに要約する。
// 除外: 下請け/協力会社(パートナー)名・金額/費用感・作業の難易度 等、客先に伝えない社内事情。
// 重複回避: 既存の内容(content)・顧客メモ(customer_memo)に既にある事柄は繰り返さない。
// 共有すべき客先向け情報が無ければ空文字を返す（＝内容へ追記しない・通知しない）。
async function summarizeMemoForCustomer(delta, currentContent, customerMemo) {
  if (!process.env.ANTHROPIC_API_KEY) return '';
  const sys = [
    'あなたは菱熱工業（シネコン設備の保守/工事）の案件アシスタントです。',
    '社内メモに今回追記された内容を、客先（映画館）にそのまま見せる「内容」欄向けの短い文章に要約します。',
    '',
    '【最重要】あなたの出力は、客先がそのまま読むテキストです。',
    '前置き・理由・判定・分類・注釈など、要約本文以外は一切書かないでください。',
    '',
    '絶対に書いてはいけないこと（客先に見せない社内事情）:',
    '- 下請け・協力会社・パートナー企業・別業者の社名/選定/担当者/連絡先。',
    '- 金額・費用・原価・粗利・費用感（高い/安い等）。',
    '- 作業の難易度・大変さ・応急処置の技術的検討・社内での判断過程や検討理由。',
    '- 菱熱の社内メンバー名。',
    '',
    '出力ルール:',
    '- 客先が知りたい「案件の状況・進捗・次の予定・依頼事項」だけを、事実ベースで簡潔に。',
    '- 既存の「内容」「顧客メモ」に既にある事柄は繰り返さない（重複禁止）。',
    '- 客先に共有できる新情報が無い場合（社内事情のみ・重複のみ）は、要約文の代わりに半角で NONE とだけ返す。',
    '  理由や補足は一切書かない。「NONE」と要約文を混ぜない（共有できないなら NONE だけ）。',
    '',
    '文体ルール（管理ツールの記録欄なので厳守）:',
    '- 書き言葉で書く。「です・ます」の話し言葉にしない。常体（〜した／〜予定／体言止め）で簡潔に。',
    '- 「お見積り」「ご連絡」等の丁寧語・依頼調にしない（「見積」「連絡」等）。',
    '- 見やすさ優先。状況・予定・確認事項など項目が複数あるときは箇条書き（各行「・」始まり）にする。',
    '- 1項目なら1行。だらだら長い1文にしない。',
    '',
    '悪い例（絶対NG）: 「(なし) 理由：社内メモは別業者の選定と応急処置の検討で…」',
    '悪い例（話し言葉NG）: 「シアター3の空調を点検し、部品交換のお見積りを提出予定です。」',
    '良い例（書き言葉・1項目）: 「シアター3空調を点検。部品交換の見積を提出予定。」',
    '良い例（書き言葉・複数）: 「・シアター3空調の点検を実施\n・部品交換の見積を今週提出予定\n・調査日は要調整」',
    '共有なしの例: NONE'
  ].join('\n');
  const user = [
    '# 既存の「内容」（客先も見る。ここに書かれている事は繰り返さない）',
    norm(currentContent) || '(空)',
    '',
    '# 既存の「顧客メモ」（客先が記入。ここに書かれている事は繰り返さない）',
    norm(customerMemo) || '(空)',
    '',
    '# 今回、社内メモに追記された内容（この中から客先に共有してよい部分だけ要約）',
    norm(delta)
  ].join('\n');
  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: SUMMARY_MODEL, max_tokens: 300, system: sys, messages: [{ role: 'user', content: user }] })
    });
    if (!r.ok) { console.error('内容要約API失敗', r.status, await r.text()); return ''; }
    const data = await r.json();
    let s = (data.content && data.content[0] && data.content[0].text) || '';
    s = s.trim();
    // 「NONE」「(なし)」等の“共有なし”は内容へ書かない（却下理由の混入を防ぐ頑丈判定）
    if (isNoShareSummary(s)) return '';
    return s;
  } catch (e) {
    console.error('内容要約エラー', e);
    return '';
  }
}
// 要約結果が「客先に共有なし」を意味するか（内容へ書かない判定・頑丈版）。
// "NONE"を含む／先頭が「なし」系／「該当なし」等 → 共有なし扱い。
function isNoShareSummary(s) {
  s = String(s || '').trim();
  if (!s) return true;
  if (/NONE/i.test(s)) return true;                          // 半角センチネル
  if (/^[（(]?\s*なし\s*[）)]?/.test(s)) return true;           // 先頭が「なし」「(なし)」等
  if (/^(該当なし|共有(事項|情報)?なし|特になし|共有なし)/.test(s)) return true;
  return false;
}

// 社内メモの追記分をAI要約し、内容(content)へ追記する。追記した場合 true。
// ・要約結果が空（社内事情のみ/重複のみ）なら何もしない。
// ・content を PATCH すると別のUPDATE webhookが発火し、そちらが「内容更新」として通知する
//   （このイベント自体では社内メモ更新の通知はしない＝ループしない: 再発火時は memo 差分が無い）。
async function summarizeMemoIntoContent(before, after) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false; // PATCHにサービスロールキーが必要
  const delta = appendedText(before.memo, after.memo);
  if (!delta) return false;
  const summary = await summarizeMemoForCustomer(delta, after.content, after.customer_memo);
  if (!summary) return false;
  const cur = norm(after.content);
  const newContent = cur ? cur + '\n\n' + summary : summary;
  if (newContent === cur) return false;
  await sbPatch(`cases?id=eq.${encodeURIComponent(String(after.id))}`, { content: newContent });
  return true;
}

function buildUpdateMessage(c, changes, summary) {
  // updated_by が無い＝AI/メール自動更新（サービスロール。内容へのAI要約反映もこちら）、
  // 有る＝担当者がアプリで更新
  const auto = !c.updated_by;
  const head = [
    auto ? '✏️ 案件が自動更新されました' : '✏️ 案件が更新されました',
    '━━━━━━━━━━━━',
    `会社: ${c.company || '-'}`,
    `劇場: ${c.theater || '-'}`,
    `種別: ${c.category || '-'}`,
    `R担当: ${c.r_person || '-'}`,
    '',                                  // 空行（案件が埋もれないように）
    `案件: ${summary || '-'}`,           // ぱっと見で何の案件か分かる1行要約
    '',                                  // 空行（案件と更新項目の間）
    '【更新項目】'
  ];
  const body = changes.map((ch) => `・${ch.label}: ${ch.value}`);
  const tail = ['', '━━━━━━━━━━━━', `🔗 ${APP_URL}/?case=${c.id}`];
  return [...head, ...body, ...tail].join('\n').slice(0, 4900);
}

// 案件を「ぱっと見で分かる」10〜20字程度の1行に要約（AIが使えれば要点抽出、無ければ本文先頭）
async function summarizeCaseOneLine(c) {
  const fallback = heuristicCaseSummary(c);
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const sys = '案件内容を日本語の超短い1行（10〜20字目安）に要約します。劇場内の場所・設備・症状・エラーコードなど' +
      '要点だけを体言止めで。前置き・句点・箇条書き記号は不要。1行のみ返す。' +
      '例:「シアター1 エラーE49」「ロビー空調 水漏れ」「男子トイレ 詰まり」。';
    const user = `劇場: ${c.theater || ''}\n種別: ${c.category || ''}\n見積名: ${c.estimate_name || ''}\n` +
      `内容: ${norm(c.content).slice(0, 800)}`;
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: SUMMARY_MODEL, max_tokens: 60, system: sys, messages: [{ role: 'user', content: user }] })
    });
    if (!r.ok) return fallback;
    const data = await r.json();
    let s = (data.content && data.content[0] && data.content[0].text) || '';
    s = s.replace(/\s*\n\s*/g, ' ').replace(/[。\.]$/, '').trim();
    return s ? s.slice(0, 40) : fallback;
  } catch (e) {
    console.error('案件要約エラー', e);
    return fallback;
  }
}
// AIを使わない簡易要約: 進捗追記より前（元の依頼）の先頭行を短く
function heuristicCaseSummary(c) {
  let s = norm(c.content);
  const idx = s.indexOf('[進捗');
  if (idx > 0) s = s.slice(0, idx);
  s = (s.split('\n').find((line) => line.trim()) || '').trim();
  if (!s) s = [c.theater, c.category].filter(Boolean).join(' ');
  return s.slice(0, 40);
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
