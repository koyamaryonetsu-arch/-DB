import type { Turn } from "./types";

// 会話メモリ(ユーザーごとの直近のやり取り)。
//
// 注意: これはプロセス内メモリのため、サーバーレスのコールドスタートやスケールで消えます。
// 「直近の文脈を少し覚えている」程度の軽量実装です。
// 永続化したい場合は、このモジュールを Upstash Redis / Vercel KV などに差し替えてください
// (getHistory / appendTurn のインターフェースをそのまま実装すればOK)。

const MEMORY_TURNS = Number(process.env.MEMORY_TURNS) || 10;

const store = new Map<string, Turn[]>();

export function getHistory(userId: string): Turn[] {
  return store.get(userId) ?? [];
}

export function appendTurn(userId: string, role: Turn["role"], content: string): void {
  const history = store.get(userId) ?? [];
  history.push({ role, content });
  // 直近 MEMORY_TURNS ターンだけ保持
  while (history.length > MEMORY_TURNS) history.shift();
  store.set(userId, history);
}
