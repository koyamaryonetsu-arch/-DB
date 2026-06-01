// 人格データの型定義。build-persona スクリプトが生成し、ボットが読み込む。

export interface PersonaExample {
  /** 相手のメッセージ */
  user: string;
  /** それに対する「あなた(分身)」の返信 */
  assistant: string;
}

export interface PersonaStats {
  /** 学習に使った自分の発話数 */
  messageCount: number;
  /** 1メッセージあたりの平均文字数 */
  avgLength: number;
  /** 絵文字・顔文字を含むメッセージの割合(0〜1) */
  emojiRatio: number;
  /** よく使う文末表現(例: "！", "w", "〜") */
  commonEndings: string[];
}

export interface Persona {
  /** 自分の名前(履歴上の表示名) */
  me: string;
  /** 生成日時(ISO) */
  generatedAt?: string;
  /** 口調・文体の要約(システムプロンプトに入る) */
  styleSummary: string;
  /** 数値統計(参考情報) */
  stats?: PersonaStats;
  /** 口調を再現するための例文(相手→自分のペア) */
  examples: PersonaExample[];
}

/** 会話メモリの1ターン */
export interface Turn {
  role: "user" | "assistant";
  content: string;
}
