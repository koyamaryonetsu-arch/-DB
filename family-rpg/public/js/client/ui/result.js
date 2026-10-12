// たたかいの けっかの まど（勝利・経験値・ゴールド・ドロップ・レベルアップの まとめ・★の 知らせ…）
// ・第31回: ぜんぶの 行を 1画面に いっぺんに 出す。1回の タップ（クリック・Z/Enter/スペース・ゲームパッドA）で とじる
//   レベルアップは 1人 1〜2行の まとめ（サーバーの world/growth.js）: 「ユウ　Lv12→15！　力+9　守り+6」「覚えた：ホイミ」
// ・まどが 出て すぐの タップは むし（戦いの さいごの タップで うっかり とじない）
// ・中みが まどに 入りきらない ときは、タップで 下へ スクロールしてから とじる（client/battle.js）
// ・DOM を つかわない ので テストできる（client/battle.js の showResult が つかう）

// まどが 出てから タップを うけつける までの 間
export const OPEN_GUARD_MS = 600;

// レベルアップの まとめの 行: 名前・上がった もの（Lv12→15・戦士Lv3→4）・強さ
const GROW_RE = /^([^　]+)　([^！]*Lv\d+→\d+)！(?:　(.*))?$/;

// まとめの 行を わける（ちがう 行は null）
//   { name, ups: 'Lv12→15　戦士Lv3→4', level: キャラの レベルが 上がったか, stats: 'HP+20　力+9' }
export function growthParts(line) {
  const m = GROW_RE.exec(String(line || ''));
  if (!m) return null;
  return { name: m[1], ups: m[2], level: /^Lv\d+→/.test(m[2]), stats: m[3] || '' };
}

// 行の しゅるい（音と いろを きめる）
export function resultKind(line) {
  const s = String(line || '');
  const g = growthParts(s);
  if (g) return g.level ? 'level' : 'job';
  if (/^覚えた：/.test(s)) return 'learn';
  // まえの 版の 行（1レベルずつ）
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
  const g = growthParts(line);
  if (g) return g.level ? g.name : null;
  const m = /^(.+?)のレベルが\d+に上がった/.exec(String(line || ''));
  return m ? m[1] : null;
}

// けっかの まど（1画面）。tap(now) … null（まだ 早い）/ { close: true }
export class ResultSheet {
  constructor(lines, now = 0) {
    this.lines = (lines || []).filter((l) => l !== '' && l != null);
    this.rows = this.lines.map((line) => ({ line, kind: resultKind(line), grow: growthParts(line) }));
    this.readyAt = this.lines.length ? now + OPEN_GUARD_MS : now;
    this.closed = false;
  }

  // レベルが 上がった 人（音を 1回・ステータスの まどを 光らせる）
  get levelNames() {
    return this.rows.map((r) => levelUpName(r.line)).filter(Boolean);
  }

  has(kind) {
    return this.rows.some((r) => r.kind === kind);
  }

  tap(now) {
    if (this.closed || now < this.readyAt) return null;
    this.closed = true;
    return { close: true };
  }

  waitLeft(now) {
    return Math.max(0, this.readyAt - now);
  }
}
