/**
 * LINEのトーク履歴(エクスポートした .txt)を解析して、
 * あなたの口調・例文をまとめた persona/persona.json を生成する。
 *
 * 使い方:
 *   npm run build-persona -- <履歴ファイル.txt> --me "あなたの表示名" [--max 30] [--out persona/persona.json]
 *
 * 例:
 *   npm run build-persona -- ./history.txt --me "太郎"
 *
 * LINEの履歴は「トークルーム右上メニュー → 設定 → トーク履歴を送信/保存」で
 * テキスト形式 (.txt) として書き出せます。
 */
import * as fs from "fs";
import * as path from "path";
import type { Persona, PersonaExample } from "../src/types";

interface RawMessage {
  time: string;
  speaker: string;
  text: string;
}

// --- 引数パース -------------------------------------------------------------

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      opts[key] = val;
      i++;
    } else {
      positional.push(a);
    }
  }
  return { positional, opts };
}

// --- 履歴パース -------------------------------------------------------------

// 日付行: "2024/01/15(月)" や "2024.01.15 月曜日" など
const DATE_RE = /^\d{4}[./]\d{1,2}[./]\d{1,2}/;
// メッセージ行: "12:34<TAB>名前<TAB>本文" (午前/午後表記にも一応対応)
const MSG_RE = /^(\d{1,2}:\d{2})\t([^\t]+)\t(.*)$/;

function parseHistory(content: string): RawMessage[] {
  // BOM除去 & 改行正規化
  const text = content.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  const messages: RawMessage[] = [];
  let current: RawMessage | null = null;

  for (const line of lines) {
    const m = MSG_RE.exec(line);
    if (m) {
      if (current) messages.push(current);
      current = { time: m[1], speaker: m[2].trim(), text: m[3] };
    } else if (DATE_RE.test(line)) {
      // 日付の区切り行。複数行メッセージの途中で改行が来る可能性は低いので確定させる。
      if (current) {
        messages.push(current);
        current = null;
      }
    } else if (current && line.length > 0) {
      // 複数行メッセージの続き
      current.text += "\n" + line;
    }
  }
  if (current) messages.push(current);
  return messages;
}

// --- 連続する同一話者の発言をまとめる --------------------------------------

function mergeConsecutive(messages: RawMessage[]): RawMessage[] {
  const merged: RawMessage[] = [];
  for (const msg of messages) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === msg.speaker) {
      last.text += "\n" + msg.text;
    } else {
      merged.push({ ...msg });
    }
  }
  return merged;
}

// --- ノイズ判定(スタンプ・写真・通話などのプレースホルダ) -----------------

const PLACEHOLDER_RE =
  /^\[(スタンプ|写真|画像|動画|ファイル|ボイスメッセージ|連絡先|位置情報|アルバム|ノート|不在着信|通話時間|送信取消)/;

function isNoise(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (PLACEHOLDER_RE.test(t)) return true;
  if (/^https?:\/\/\S+$/.test(t)) return true; // URLのみ
  return false;
}

// --- 口調の統計 -------------------------------------------------------------

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]|\([^)]{0,6}[ﾟ°^][^)]{0,6}\)|[wｗ]{2,}$/u;

function analyzeStyle(myMessages: string[]) {
  const clean = myMessages.filter((s) => !isNoise(s));
  const count = clean.length;
  const avgLength =
    count > 0 ? Math.round(clean.reduce((a, s) => a + s.length, 0) / count) : 0;
  const emojiCount = clean.filter((s) => EMOJI_RE.test(s)).length;
  const emojiRatio = count > 0 ? Number((emojiCount / count).toFixed(2)) : 0;

  // 文末表現の集計(最後の1〜2文字)
  const endingTally = new Map<string, number>();
  const bump = (k: string) => endingTally.set(k, (endingTally.get(k) ?? 0) + 1);
  for (const s of clean) {
    const t = s.trim();
    if (/[!！]$/.test(t)) bump("！");
    else if (/[?？]$/.test(t)) bump("？");
    else if (/[wｗ]$/.test(t)) bump("w(笑)");
    else if (/[〜~ー]$/.test(t)) bump("〜");
    else if (/。$/.test(t)) bump("。");
    else if (/[ねよなさ]$/.test(t)) bump(t.slice(-1));
  }
  const commonEndings = [...endingTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return { messageCount: count, avgLength, emojiRatio, commonEndings };
}

function buildStyleSummary(me: string, stats: ReturnType<typeof analyzeStyle>): string {
  const parts: string[] = [];
  if (stats.avgLength <= 12) parts.push("基本的に短く、テンポよく返す");
  else if (stats.avgLength <= 30) parts.push("ほどよい長さの文で返す");
  else parts.push("やや長めにしっかり書くことが多い");

  if (stats.emojiRatio >= 0.4) parts.push("絵文字や顔文字をよく使う");
  else if (stats.emojiRatio >= 0.15) parts.push("絵文字を時々使う");
  else parts.push("絵文字はあまり使わない");

  if (stats.commonEndings.length > 0) {
    parts.push(`よく使う文末は ${stats.commonEndings.join(" / ")}`);
  }

  return `${me}の口調: ${parts.join("。")}。カジュアルで自然体なLINEのトーン。`;
}

// --- 例文(相手→自分)の抽出 ----------------------------------------------

function buildExamples(messages: RawMessage[], me: string, max: number): PersonaExample[] {
  const pairs: PersonaExample[] = [];
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const cur = messages[i];
    if (cur.speaker === me && prev.speaker !== me) {
      const user = prev.text.trim();
      const assistant = cur.text.trim();
      if (isNoise(user) || isNoise(assistant)) continue;
      if (user.length > 200 || assistant.length > 200) continue;
      pairs.push({ user, assistant });
    }
  }

  // 多すぎる場合はバリエーション確保のため均等サンプリング
  if (pairs.length <= max) return pairs;
  const step = pairs.length / max;
  const sampled: PersonaExample[] = [];
  for (let i = 0; i < max; i++) {
    sampled.push(pairs[Math.floor(i * step)]);
  }
  return sampled;
}

// --- メイン -----------------------------------------------------------------

function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const file = positional[0];
  const me = opts.me;
  const max = Number(opts.max) || 30;
  const out = opts.out || path.join("persona", "persona.json");

  if (!file || !me) {
    console.error(
      "使い方: npm run build-persona -- <履歴ファイル.txt> --me \"あなたの表示名\" [--max 30] [--out persona/persona.json]"
    );
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`ファイルが見つかりません: ${file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(file, "utf8");
  const raw = parseHistory(content);
  if (raw.length === 0) {
    console.error(
      "メッセージを1件も解析できませんでした。LINEのテキスト形式エクスポートか確認してください。"
    );
    process.exit(1);
  }

  const speakers = [...new Set(raw.map((m) => m.speaker))];
  if (!speakers.includes(me)) {
    console.warn(
      `警告: 指定した名前「${me}」が履歴内に見つかりません。履歴上の表示名は: ${speakers.join(", ")}`
    );
  }

  const merged = mergeConsecutive(raw);
  const myMessages = merged.filter((m) => m.speaker === me).map((m) => m.text);
  const stats = analyzeStyle(myMessages);
  const styleSummary = buildStyleSummary(me, stats);
  const examples = buildExamples(merged, me, max);

  const persona: Persona = {
    me,
    generatedAt: new Date().toISOString(),
    styleSummary,
    stats,
    examples,
  };

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(persona, null, 2), "utf8");

  console.log(`✓ ${out} を生成しました`);
  console.log(`  - 参加者: ${speakers.join(", ")}`);
  console.log(`  - あなた(${me})の発話数: ${stats.messageCount}`);
  console.log(`  - 平均文字数: ${stats.avgLength} / 絵文字率: ${stats.emojiRatio}`);
  console.log(`  - 抽出した例文: ${examples.length} 組`);
  console.log(`  - 口調: ${styleSummary}`);
}

main();
