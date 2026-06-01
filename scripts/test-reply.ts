/**
 * LINEなしで、分身の返信をローカル確認するためのスクリプト。
 * ANTHROPIC_API_KEY と persona/persona.json が必要。
 *
 * 使い方:
 *   npm run test-reply -- "今日ひま？ごはん行かない？"
 */
import { generateReply } from "../src/claude";
import { loadPersona } from "../src/persona";

async function main() {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    console.error('使い方: npm run test-reply -- "相手のメッセージ"');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("環境変数 ANTHROPIC_API_KEY が未設定です。");
    process.exit(1);
  }

  const persona = loadPersona();
  console.log(`分身: ${persona.me}（例文 ${persona.examples.length} 組を学習）`);
  console.log(`相手: ${message}`);

  const reply = await generateReply(message);
  console.log(`あなた(分身): ${reply}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
