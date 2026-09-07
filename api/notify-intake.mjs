// 「新規か更新か」確認待ちの案件をLINEで通知する
//
// メール取込(GAS)が、同じ劇場で近い日程の似た案件があって判断できないとき、
// 案件を登録せず case_intake_pending に溜める。この時に GAS がこのエンドポイントを叩き、
// 「新規か更新か確認してください」とLINEグループへ投げる。
// 人はアプリの「🆕 登録確認」画面でボタンを押して 自動登録 / 自動更新 する。
//
// 認証: x-flush-key = SUPABASE_SERVICE_ROLE_KEY（flush-notifications と同じ方式・新規secret不要）
// 必須 ENV: SUPABASE_SERVICE_ROLE_KEY / LINE_CHANNEL_ACCESS_TOKEN / LINE_TARGET_GROUP_ID / (任意)SUPABASE_URL

import { pushLineMessages } from './case-created.mjs';

const APP_URL = 'https://cinema-cases.vercel.app';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';

function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function buildIntakeMessage(row, waiting) {
  const cands = Array.isArray(row.candidates) ? row.candidates : [];
  const lines = [
    '❓ 新規か更新か確認してください',
    '（似た案件があるため、まだ登録していません）',
    '━━━━━━━━━━━━',
    `会社: ${row.company || '-'}`,
    `劇場: ${row.theater || '-'}`,
    `受付日: ${row.received_date || '-'}`,
    `件名: ${(row.title || '-').slice(0, 60)}`,
    '',
    '【メールの内容】',
    String(row.content || '(未記入)').slice(0, 300)
  ];
  if (row.reason) lines.push('', `【迷った理由】${String(row.reason).slice(0, 150)}`);
  if (cands.length) {
    lines.push('', '【似ている既存案件】');
    cands.slice(0, 3).forEach((c, i) => {
      const name = c.estimate_name || String(c.content || '').slice(0, 30) || '(内容なし)';
      lines.push(`${i + 1}. ${c.received_date || '日付不明'} [${c.category || '種別不明'}] ${name}`);
    });
  }
  lines.push(
    '',
    '━━━━━━━━━━━━',
    '👉 下のボタンでそのまま登録／更新できます（アプリの「🆕 登録確認」でも操作できます）',
    `🔗 ${APP_URL}/?intake=1`
  );
  if (waiting > 1) lines.push(`（確認待ち: 全${waiting}件）`);
  return lines.join('\n').slice(0, 4900);
}

// LINE上でそのまま「新規登録／更新／破棄」を押せるボタンを作る。
// buttons テンプレートはボタン4つまで・text は160文字までなので、候補は最大2件まで載せる。
function buildIntakeButtons(row) {
  const cands = (Array.isArray(row.candidates) ? row.candidates : []).slice(0, 2);
  const actions = [{
    type: 'postback', label: '新規として登録',
    data: `a=new&p=${row.id}`, displayText: '新規として登録します'
  }];
  cands.forEach((c, i) => {
    const nm = (c.estimate_name || String(c.content || '').replace(/\s+/g, ' ') || '既存案件').slice(0, 8);
    actions.push({
      type: 'postback',
      label: `更新${cands.length > 1 ? (i + 1) : ''}: ${nm}`.slice(0, 20), // ラベルは20文字まで
      data: `a=upd&p=${row.id}&c=${c.id}`,
      displayText: `既存案件（${nm}）に更新します`
    });
  });
  actions.push({
    type: 'postback', label: '破棄（登録しない）',
    data: `a=del&p=${row.id}`, displayText: '破棄します'
  });

  const head = [
    `${row.theater || '(劇場未設定)'}`,
    `${(row.title || '').slice(0, 40)}`,
    cands.length ? '似た案件があります。どれにしますか？' : '似た既存案件は見つかりませんでした。'
  ].filter(Boolean).join('\n');

  return {
    type: 'template',
    altText: '新規か更新か確認してください（LINEのボタンで選べます）',
    template: { type: 'buttons', text: head.slice(0, 160), actions: actions.slice(0, 4) }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || req.headers['x-flush-key'] !== key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const id = (req.body && req.body.id) ? String(req.body.id) : '';
  if (!id) return res.status(400).json({ error: 'id required' });

  let row = null, waiting = 0;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/case_intake_pending?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: sbHeaders() }
    );
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const rows = await r.json();
    row = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!row) return res.status(404).json({ error: 'not found' });
    if (row.notified_at) return res.status(200).json({ skipped: 'already notified' });
    // 確認待ちの総数（LINEに「全N件」と出すため。取れなくても通知は続行）
    const r2 = await fetch(
      `${SUPABASE_URL}/rest/v1/case_intake_pending?status=eq.pending&select=id`,
      { headers: sbHeaders() }
    );
    if (r2.ok) { const all = await r2.json(); waiting = Array.isArray(all) ? all.length : 0; }
  } catch (e) {
    console.error('確認待ち取得エラー', e);
    return res.status(500).json({ ok: false, error: 'fetch failed', detail: e.message });
  }

  try {
    await pushLineMessages(process.env.LINE_TARGET_GROUP_ID, [
      { type: 'text', text: buildIntakeMessage(row, waiting) },
      buildIntakeButtons(row)
    ]);
  } catch (e) {
    console.error('LINE push エラー', e);
    return res.status(500).json({ ok: false, error: 'LINE push failed', detail: e.message });
  }
  // 二重通知を防ぐため通知済みを記録（失敗しても通知は完了しているので 200 を返す）
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/case_intake_pending?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ notified_at: new Date().toISOString() })
    });
  } catch (e) { console.error('notified_at 更新エラー', e); }

  return res.status(200).json({ ok: true, waiting });
}
