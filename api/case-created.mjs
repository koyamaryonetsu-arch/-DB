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
//   - INSERT (新規案件): Claude APIで「優先度・相談先・初動メモ」を生成し、AI初期対応案つきで通知
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
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';

// シネマPJ 担当ルーティング（初期対応診断の判断材料）
const TEAM_ROUTING = [
  'シネマPJの担当と守備範囲:',
  '- 細萱(修治): 技術判断・大型/緊急・空調/チラー/GHP/熱源/スプリンクラー/防災/映写室系統。緊急故障の技術ジャッジ。',
  '- 山口: 現場対応・現地調査・見積作成。夜間/応急の現場手配。',
  '- 金子: TOHO一次窓口・市川/横浜・事務調整（見積/請求/顧客連絡/配管/計画書）。',
  '- 若山(駿): LED更新・ユナイテッドシネマ系・協力会社スケジュール調整。',
  '- 大和: 裏方サポート・事務・書類作成（18時退社制約あり）。',
  '- 小山(PJリーダー): 全体統括・価格/方針・エスカレーション先（500万超/価格交渉/方針未確定/TOHO本社 青木さん対応）。'
].join('\n');

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

  // ── 更新（UPDATE）: 内容 / メモ / 見積り提出日 / 作業開始日 / 作業完了日 が記入・変更された時だけ通知（AIなし） ──
  if (payload.type === 'UPDATE') {
    const before = payload.old_record || {};
    const changes = detectChanges(before, c);
    if (changes.length === 0) {
      // 対象5項目以外の変更（ステータスや他の日付など）は通知しない
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

// 同じ劇場の過去案件を Supabase から取得（RLSをまたぐためサービスロールキーが必要。未設定/失敗なら空配列）
async function fetchTheaterHistory(theater, excludeId) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !theater) return [];
  const params = new URLSearchParams({
    theater: `eq.${theater}`,
    select: 'id,received_date,category,content,status,r_person,estimate_name,work_end_date',
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

function formatTheaterHistory(rows) {
  if (!rows.length) return '(この劇場の過去案件はまだありません)';
  return rows.map((x, i) => {
    const line = `${i + 1}. ${x.received_date || '日付不明'} [${x.category || '種別不明'}] ${x.status || ''}`;
    const detail = x.content ? `\n   内容: ${String(x.content).slice(0, 120)}` : '';
    const who = x.r_person ? `\n   R担当: ${x.r_person}` : '';
    return line + detail + who;
  }).join('\n');
}

async function getInitialResponseAdvice(c) {
  if (!process.env.ANTHROPIC_API_KEY) return '(ANTHROPIC_API_KEY 未設定のため AI判断はスキップ)';

  // Lv2: 同じ劇場の過去案件を文脈として取得（無ければ空でLv1相当）
  const history = await fetchTheaterHistory(c.theater, c.id);

  const system = [
    'あなたは菱熱工業（シネコン設備の保守/工事）のシネマ案件管理アシスタントです。',
    '新規案件について、現場が即座に初動を判断できる実践的な初期対応診断を返します。',
    '',
    TEAM_ROUTING,
    '',
    '判断の指針:',
    '- 空調/チラー/GHP/熱源/スプリンクラー/防災/映写室系統は 技術＝細萱・現場手配＝山口 を軸に。',
    '- 見積/請求/客先連絡は 金子。価格/大型/方針未確定/TOHO本社対応は 小山 へエスカレーション。',
    '- 故障停止・漏れ・ガス・発煙・安全に関わる語があれば優先度=高。',
    '- 同じ劇場の過去案件があれば、その傾向・前例・担当・使ったパートナーを踏まえて具体的に助言する。'
  ].join('\n');

  const user = [
    '# 今回の新規案件',
    `- 会社: ${c.company || '(未設定)'}`,
    `- 劇場: ${c.theater || '(未設定)'}`,
    `- 種別: ${c.category || '(未設定)'}`,
    `- R担当: ${c.r_person || '(未設定)'}`,
    `- 客先担当: ${c.tc_person || '(未設定)'}`,
    `- 受付日: ${c.received_date || '(未設定)'}`,
    `- 内容: ${c.content || '(未記入)'}`,
    '',
    `# この劇場（${c.theater || '不明'}）の過去案件（新しい順・参考）`,
    formatTheaterHistory(history),
    '',
    '# 出力フォーマット（厳守・絵文字なし）',
    '【優先度】高/中/低 - 一行で理由',
    '【相談先】箇条書き2-3個（担当名＋理由。過去の担当/パートナーがあれば反映）',
    '【初動メモ】1-2行で次のアクション（この劇場の傾向を踏まえて具体的に）'
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
    `🔗 ${APP_URL}/?case=${c.id}`
  ];
  return [...head, ...tail].join('\n').slice(0, 4900);
}

// 通知対象の更新フィールド（この項目に値が入った/変わった時だけ通知。ステータス変更は通知しない）
const NOTIFY_FIELDS = [
  { key: 'content', label: '内容', text: true },
  { key: 'memo', label: 'メモ', text: true },
  { key: 'quote_date', label: '見積り提出日' },
  { key: 'work_start_date', label: '作業開始日' },
  { key: 'work_end_date', label: '作業完了日' }
];
function norm(v) { return v == null ? '' : String(v).trim(); }

// 内容/メモ/見積り提出日/作業開始日/作業完了日 のうち、
// 「新しい値が空でなく、かつ前と変わった」項目だけを返す（記入・追加・変更を検知。空にした時は通知しない）
function detectChanges(before, after) {
  const changes = [];
  for (const f of NOTIFY_FIELDS) {
    const ov = norm(before[f.key]);
    const nv = norm(after[f.key]);
    if (nv !== '' && nv !== ov) {
      changes.push({ label: f.label, value: f.text ? nv.slice(0, 300) : nv });
    }
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
  const tail = ['', '━━━━━━━━━━━━', `🔗 ${APP_URL}/?case=${c.id}`];
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
