// 保留中の更新通知を「まとめて」送信する（5分デバウンスの実送信側）
//
// case-created.mjs の UPDATE は即送信せず pending_notifications に貯める。
// このエンドポイントを1分毎に叩くと、最初の更新から5分以上経った案件を1通にまとめて送る。
// 呼び出しは GAS の flushLineNotifications()（毎分トリガー）。認証は x-flush-key = SUPABASE_SERVICE_ROLE_KEY。
//
// 必須 ENV: SUPABASE_SERVICE_ROLE_KEY / LINE_CHANNEL_ACCESS_TOKEN / LINE_TARGET_GROUP_ID / (任意)ANTHROPIC_API_KEY / SUPABASE_URL

import {
  buildUpdateMessage, summarizeCaseOneLine,
  isDuplicateNotification, notifySignature, pushLineMessage, sbDeleteReturning
} from './case-created.mjs';

const DEBOUNCE_MS = 5 * 60 * 1000; // 最初の更新から5分待ってまとめる

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || req.headers['x-flush-key'] !== key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cutoff = new Date(Date.now() - DEBOUNCE_MS).toISOString();
  let claimed;
  try {
    // 5分以上前に最初の更新があった案件を取り出す（削除しつつ取得＝二重送信を防止）
    claimed = await sbDeleteReturning(`pending_notifications?first_change_at=lte.${encodeURIComponent(cutoff)}`);
  } catch (e) {
    console.error('pending取り出し失敗', e);
    return res.status(500).json({ ok: false, error: 'claim failed', detail: e.message });
  }

  let sent = 0;
  for (const row of (claimed || [])) {
    const c = row.record || {};
    const changes = Object.entries(row.changes || {}).map(([label, value]) => ({ label, value }));
    if (!changes.length) continue;
    try {
      if (await isDuplicateNotification(notifySignature('UPDATE', c, changes))) continue;
      const summary = await summarizeCaseOneLine(c);
      await pushLineMessage(process.env.LINE_TARGET_GROUP_ID, buildUpdateMessage(c, changes, summary));
      sent++;
    } catch (e) {
      console.error('まとめ通知の送信失敗 case=' + (c.id || '?'), e);
    }
  }
  return res.status(200).json({ ok: true, claimed: (claimed || []).length, sent });
}
