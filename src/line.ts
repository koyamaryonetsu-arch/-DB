import * as crypto from "crypto";

// LINE Messaging API の最小ヘルパー(SDK不要、標準モジュールのみ)。

export interface LineMessageEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type: string; text?: string };
}

export interface LineWebhookBody {
  destination?: string;
  events: LineMessageEvent[];
}

/**
 * Webhookの署名を検証する。
 * LINEは本文をチャネルシークレットでHMAC-SHA256したものをBase64で x-line-signature に入れて送る。
 */
export function verifySignature(rawBody: string, signature: string | undefined, channelSecret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  // タイミング攻撃対策で固定時間比較
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * replyToken を使ってテキストを返信する。
 * replyToken は1回限り・約1分間有効。
 */
export async function replyText(replyToken: string, text: string, channelAccessToken: string): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LINE reply API error ${res.status}: ${detail}`);
  }
}
