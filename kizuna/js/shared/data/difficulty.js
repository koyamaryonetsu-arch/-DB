// ゲームの むずかしさ（メニューの「設定」。キャラごとに のこる）
// ・mainMarks … メインの 目標の 行き先（ピンクの しるし・仲間の「行き先は 北東の ほう」）を 出す
// ・subMarks … たのまれごとの 行き先（水色・みどりの しるし）を 出す
// ・exp … 戦いで もらえる 経験値の 倍率（1・0.75・0.5）。仲間・馬車の 仲間も おなじ 倍率
export const EXP_RATES = [1, 0.75, 0.5];
export const EXP_RATE_NAMES = { 1: 'ふつう', 0.75: '0.75倍', 0.5: '0.5倍' };

export function difficultyOf(c) {
  const d = c?.difficulty || {};
  return {
    mainMarks: d.mainMarks !== false,
    subMarks: d.subMarks !== false,
    exp: EXP_RATES.includes(d.exp) ? d.exp : 1,
  };
}

// メニューから とどいた 設定を ととのえる（知らない 値は つかわない）。ぜんぶ ふつう なら undefined
export function normDifficulty(prev, msg) {
  const d = { ...difficultyOf({ difficulty: prev }) };
  if (typeof msg?.mainMarks === 'boolean') d.mainMarks = msg.mainMarks;
  if (typeof msg?.subMarks === 'boolean') d.subMarks = msg.subMarks;
  if (EXP_RATES.includes(msg?.exp)) d.exp = msg.exp;
  if (d.mainMarks && d.subMarks && d.exp === 1) return undefined;
  return d;
}

// その キャラが もらう 経験値（0 で なければ 1 いじょう）
export function scaleExp(c, exp) {
  if (!(exp > 0)) return 0;
  return Math.max(1, Math.round(exp * difficultyOf(c).exp));
}

// 地図の しるしを むずかしさで しぼる（kind: main / sub / subReady）
export function visibleMarks(c, marks) {
  const d = difficultyOf(c);
  return marks.filter((m) => (m.kind === 'main' ? d.mainMarks : d.subMarks));
}
