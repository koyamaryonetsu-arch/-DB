import Anthropic from "@anthropic-ai/sdk";
import { loadPersona, buildSystemPrompt } from "./persona";
import type { Turn } from "./types";

const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から読む

// デフォルトは安価な Haiku 4.5。CLAUDE_MODEL で claude-sonnet-4-6 などに変更可。
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";
const MAX_TOKENS = Number(process.env.MAX_TOKENS) || 1024;

// LINEのテキストメッセージ上限(安全側に切り詰める)
const LINE_TEXT_LIMIT = 4900;

/**
 * 受信メッセージに対して「分身」としての返信を生成する。
 *
 * @param userText 相手から届いたメッセージ
 * @param history  直近の会話メモリ(時系列)
 */
export async function generateReply(userText: string, history: Turn[] = []): Promise<string> {
  const persona = loadPersona();
  const system = buildSystemPrompt(persona);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: userText },
  ];

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // 人格(口調＋例文)は毎回同じなのでキャッシュする。
    // 例文が十分あればキャッシュ最小トークン数を超え、2回目以降が大幅に安くなる。
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
  });

  // キャッシュの効きを確認したいときのために残す(本番ログでは消してもOK)
  if (process.env.DEBUG_USAGE) {
    console.log("usage:", JSON.stringify(res.usage));
  }

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const reply = text || "ごめん、いまうまく返事できなかった🙏";
  return reply.slice(0, LINE_TEXT_LIMIT);
}
