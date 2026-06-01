import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySignature, replyText, type LineWebhookBody } from "../src/line";
import { generateReply } from "../src/claude";
import { getHistory, appendTurn } from "../src/memory";

// 署名検証のために生のボディが必要なので、Vercelの自動JSONパースを無効化する。
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // 動作確認用(GETでアクセスすると生存確認)
  if (req.method === "GET") {
    res.status(200).send("LINE 分身チャット bot is running.");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelSecret || !channelAccessToken) {
    console.error("LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN が未設定です。");
    res.status(500).send("Server not configured");
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-line-signature"] as string | undefined;

  if (!verifySignature(rawBody, signature, channelSecret)) {
    console.warn("署名検証に失敗しました。");
    res.status(401).send("Invalid signature");
    return;
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    res.status(400).send("Bad Request");
    return;
  }

  // LINEには素早く200を返す必要があるが、replyTokenの有効期限内に返信したいので
  // ここでは各イベントを順次処理してから200を返す(Haikuなら十分速い)。
  for (const event of body.events ?? []) {
    try {
      if (event.type !== "message" || event.message?.type !== "text" || !event.replyToken) {
        continue;
      }
      // Webhook検証時のダミーイベントはスキップ
      if (event.replyToken === "00000000000000000000000000000000") continue;

      const userId = event.source?.userId ?? "anonymous";
      const userText = event.message.text ?? "";

      const history = getHistory(userId);
      const reply = await generateReply(userText, history);

      appendTurn(userId, "user", userText);
      appendTurn(userId, "assistant", reply);

      await replyText(event.replyToken, reply, channelAccessToken);
    } catch (e) {
      console.error("イベント処理中にエラー:", e);
      // 1件失敗しても他イベント処理は続ける
    }
  }

  res.status(200).send("OK");
}
