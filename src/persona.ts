import * as fs from "fs";
import * as path from "path";
import type { Persona } from "./types";

// デフォルト人格(persona.json が無くてもボットは動くようにする)
const FALLBACK_PERSONA: Persona = {
  me: "わたし",
  styleSummary:
    "フレンドリーでカジュアルな口調。短めの文で、絵文字を時々使う。相手に寄り添って返事をする。",
  examples: [],
};

let cached: Persona | null = null;

/**
 * 人格データを読み込む。優先順位:
 *   1. 環境変数 PERSONA_JSON (Vercelデプロイ時に便利)
 *   2. persona/persona.json ファイル
 *   3. フォールバック人格
 * 手書きの persona/profile.md があれば styleSummary の先頭に追加する。
 */
export function loadPersona(): Persona {
  if (cached) return cached;

  let persona: Persona = FALLBACK_PERSONA;

  if (process.env.PERSONA_JSON) {
    try {
      persona = JSON.parse(process.env.PERSONA_JSON);
    } catch (e) {
      console.warn("PERSONA_JSON のパースに失敗しました。フォールバックを使います。", e);
    }
  } else {
    const jsonPath = path.join(process.cwd(), "persona", "persona.json");
    try {
      if (fs.existsSync(jsonPath)) {
        persona = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      } else {
        console.warn(
          "persona/persona.json が見つかりません。`npm run build-persona` で生成してください。"
        );
      }
    } catch (e) {
      console.warn("persona.json の読み込みに失敗しました。フォールバックを使います。", e);
    }
  }

  // 手書きプロフィール(任意)
  const profilePath = path.join(process.cwd(), "persona", "profile.md");
  try {
    if (fs.existsSync(profilePath)) {
      const profile = fs.readFileSync(profilePath, "utf8").trim();
      if (profile) {
        persona = {
          ...persona,
          styleSummary: `${profile}\n\n${persona.styleSummary}`,
        };
      }
    }
  } catch {
    /* プロフィールは任意なので無視 */
  }

  cached = persona;
  return persona;
}

/**
 * 人格からシステムプロンプト(文字列)を組み立てる。
 * これがプロンプトキャッシュの安定したプレフィックスになる。
 */
export function buildSystemPrompt(persona: Persona): string {
  const lines: string[] = [];

  lines.push(
    `あなたは「${persona.me}」という人物の分身として、LINEで友人や知人とチャットしています。`,
    `${persona.me}本人になりきり、本人が返信しそうな内容・口調で自然に返事をしてください。`,
    "",
    "# あなた(本人)の口調・文体",
    persona.styleSummary,
    "",
    "# ルール",
    "- LINEのメッセージらしく、簡潔に返す(普段のトークの長さに合わせる)。",
    "- 本人の口調・語尾・絵文字の使い方を真似る。",
    "- 知らないことは無理に作らず、本人なら言いそうな範囲で自然に返す。",
    "- AIであることや「分身」であることには触れない。普通の本人として振る舞う。",
    "- 機械的な定型文や過剰に丁寧な文章は避ける。",
  );

  if (persona.examples.length > 0) {
    lines.push(
      "",
      "# 口調の参考例(「相手」の発言に対する「あなた」の返信)",
      "次のやり取りは、あなた本人の実際の返信スタイルの例です。語彙・テンポ・絵文字の使い方を参考にしてください。",
      ""
    );
    for (const ex of persona.examples) {
      lines.push(`相手: ${ex.user}`);
      lines.push(`あなた: ${ex.assistant}`);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}
