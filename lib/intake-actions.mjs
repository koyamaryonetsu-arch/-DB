// 「登録確認」キュー(case_intake_pending)に対する操作をサーバー側で行う共通処理。
//
// アプリの「🆕 登録確認」画面と同じことを、LINEのボタンからも実行できるようにするためのもの。
//   - registerNewFromPending : 新規案件として登録する
//   - applyUpdateFromPending : 選んだ既存案件に更新（社内メモへ追記＋空いている日程だけ補完）
//   - discardPending         : 破棄する（登録しない）
//
// 登録/更新は last_update_source='auto' で保存するため、LINE通知は
// 「自動登録されました／自動更新されました」と表示される（アプリ側の挙動と同じ）。
//
// 必須 ENV: SUPABASE_SERVICE_ROLE_KEY /（任意）SUPABASE_URL

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hykjpadvbficiiuockhj.supabase.co';

function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
async function sbGet(pathAndQuery) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`取得に失敗しました (${r.status}): ${await r.text()}`);
  return r.json();
}
async function sbPatch(pathAndQuery, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`更新に失敗しました (${r.status}): ${await r.text()}`);
}
async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=representation' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`登録に失敗しました (${r.status}): ${await r.text()}`);
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

function todayJst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 確認待ち1件を取得（無ければ null）
export async function getPending(id) {
  const rows = await sbGet(`case_intake_pending?id=eq.${encodeURIComponent(id)}&select=*`);
  return (Array.isArray(rows) && rows[0]) ? rows[0] : null;
}
// 処理済みとして記録
async function decidePending(id, status, caseId) {
  await sbPatch(`case_intake_pending?id=eq.${encodeURIComponent(id)}`, {
    status: status, decided_at: new Date().toISOString(), decided_case_id: caseId || null
  });
}
// 短い案件名（返信メッセージ用）
export function pendingLabel(p) {
  const name = (p.title || p.content || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  return [p.theater || '(劇場未設定)', name].filter(Boolean).join(' / ');
}

// 「新規として登録」: 確認待ちの内容で案件を作る
export async function registerNewFromPending(p) {
  const today = todayJst();
  const memo = '【AI自動登録 ' + today + '】（登録確認で「新規」を選択）\n' + String(p.content || '');
  const row = await sbInsert('cases', {
    company: p.company || '', theater: p.theater || '',
    received_date: p.received_date || today,
    tc_person: p.tc_person || '', r_person: p.r_person || '',
    category: p.category || '',
    content: '', memo: memo,
    survey_date: p.survey_date || null, quote_date: p.quote_date || null,
    work_start_date: p.work_start_date || null, work_end_date: p.work_end_date || null,
    last_update_source: 'auto'
  });
  await decidePending(p.id, 'registered', row ? row.id : null);
  return row;
}

// 「この案件に更新」: 既存案件の社内メモへ追記し、空いている日程だけ埋める
export async function applyUpdateFromPending(p, caseId) {
  const rows = await sbGet(
    `cases?id=eq.${encodeURIComponent(caseId)}` +
    `&select=id,theater,memo,survey_date,quote_date,work_start_date,work_end_date`
  );
  const c = (Array.isArray(rows) && rows[0]) ? rows[0] : null;
  if (!c) throw new Error('対象の案件が見つかりませんでした（削除された可能性があります）');

  const today = todayJst();
  const note = String(p.progress_note || p.content || '').trim();
  const block = '【AI自動更新 ' + today + '】（登録確認で「更新」を選択）\n' + note;
  const patch = {
    memo: c.memo ? (c.memo + '\n\n' + block) : block,
    last_update_source: 'auto'
  };
  // 既存の手入力は上書きしない（空いている日程だけ補完）
  if (p.survey_date && !c.survey_date) patch.survey_date = p.survey_date;
  if (p.quote_date && !c.quote_date) patch.quote_date = p.quote_date;
  if (p.work_start_date && !c.work_start_date) patch.work_start_date = p.work_start_date;
  if (p.work_end_date && !c.work_end_date) patch.work_end_date = p.work_end_date;

  await sbPatch(`cases?id=eq.${encodeURIComponent(caseId)}`, patch);
  await decidePending(p.id, 'updated', caseId);
  return c;
}

// 「破棄」: 登録しない
export async function discardPending(p) {
  await decidePending(p.id, 'discarded', null);
}
