// たたかいの けっかの まど（勝利・経験値・ゴールド・レベルアップ・おぼえた 技・ドロップ…）
// ・ボタン（タップ・クリック・Z/Enter/スペース・ゲームパッドA）を おすと 1行ずつ すすむ
//   文字の 速さの 設定に かかわらず、かってには すすまない
// ・レベルが 上がった 行の あとは すこし 間を おく（レベルアップの きょくの よいん）
// ・DOM を つかわない ので テストできる（client/battle.js の showResult が つかう）

// つぎの 行に すすめる までの 間（ボタンを れんだ しても とばしすぎない ように）
export const RESULT_GAP_MS = 220;
// レベルが 上がった 行の あとの 間
export const LEVEL_GAP_MS = 900;

// 行の しゅるい（音と いろを きめる）
export function resultKind(line) {
  const s = String(line || '');
  if (/職業レベルが\d+に上がった/.test(s)) return 'job';
  if (/のレベルが\d+に上がった/.test(s)) return 'level';
  if (/(覚えた|ひらめいた)！/.test(s) || /になれるようになった|をマスターした|ヒントを見つけた/.test(s)) return 'learn';
  if (/ゴールドを手に入れた/.test(s)) return 'gold';
  if (/を手に入れた！|を拾った！/.test(s)) return 'item';
  if (/を持っていた！/.test(s)) return 'found';
  if (/経験値/.test(s)) return 'exp';
  if (/^(HP|MP|力|守り|素早さ|魔力|回復)\+\d/.test(s)) return 'stats';
  return 'other';
}

// レベルが 上がった 人の 名前（ステータスの まどを 光らせる）
export function levelUpName(line) {
  const m = /^(.+?)のレベルが\d+に上がった/.exec(String(line || ''));
  return m ? m[1] : null;
}

export class ResultPager {
  constructor(lines) {
    this.lines = (lines || []).slice();
    this.i = 0;
    this.readyAt = 0;
  }

  get done() { return this.i >= this.lines.length; }

  // ボタンを おした（now: ミリびょう）
  // へんじ: null … まだ 早い（むし）/ { close: true } … ぜんぶ 見せた あとの ボタン（まどを とじる）
  //         { line, kind, last } … つぎの 行
  advance(now) {
    if (now < this.readyAt) return null;
    if (this.done) return { close: true };
    const line = this.lines[this.i++];
    const kind = resultKind(line);
    this.readyAt = now + (kind === 'level' ? LEVEL_GAP_MS : RESULT_GAP_MS);
    return { line, kind, last: this.done };
  }

  // つぎの ボタンを うけつける まで（▼ を 出す じかん）
  waitLeft(now) {
    return Math.max(0, this.readyAt - now);
  }
}
