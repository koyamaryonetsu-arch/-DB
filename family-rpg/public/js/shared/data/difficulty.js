// ゲームの むずかしさ（メニューの「設定」。キャラごとに のこる）
// ・mainMarks … メインの 目標の 行き先（ピンクの しるし・仲間の「行き先は 北東の ほう」）を 出す
// ・subMarks … たのまれごとの 行き先（水色・みどりの しるし）を 出す
// ・exp … 戦いで もらえる 経験値の 倍率（1・0.75・0.5）。仲間・馬車の 仲間も おなじ 倍率
// ・enemy … 敵の 強さの 倍率（1・1.2・1.5・2）。魔物の HP・MP・攻撃・守り・素早さ・魔力が この 倍に なる
//   （もらえる 経験値・ゴールド・落とす 物は かわらない）。パーティーでは リーダーの 設定で 戦う（world/battles.js）
export const EXP_RATES = [1, 0.75, 0.5];
export const EXP_RATE_NAMES = { 1: 'ふつう', 0.75: '0.75倍', 0.5: '0.5倍' };
export const ENEMY_RATES = [1, 1.2, 1.5, 2];
export const ENEMY_RATE_NAMES = { 1: 'ふつう', 1.2: 'ハード', 1.5: 'ベリーハード', 2: 'スーパーハード' };
// 設定の 画面の みじかい せつめい
export const ENEMY_RATE_NOTES = {
  1: '今までどおりの強さ',
  1.2: '敵が1.2倍の強さ。少し手ごわい',
  1.5: '敵が1.5倍の強さ。かなり手ごわい',
  2: '敵が2倍の強さ。とても手ごわい',
};

export function difficultyOf(c) {
  const d = c?.difficulty || {};
  return {
    mainMarks: d.mainMarks !== false,
    subMarks: d.subMarks !== false,
    exp: EXP_RATES.includes(d.exp) ? d.exp : 1,
    enemy: ENEMY_RATES.includes(d.enemy) ? d.enemy : 1,
  };
}

// メニューから とどいた 設定を ととのえる（知らない 値は つかわない）。ぜんぶ ふつう なら undefined
export function normDifficulty(prev, msg) {
  const d = { ...difficultyOf({ difficulty: prev }) };
  if (typeof msg?.mainMarks === 'boolean') d.mainMarks = msg.mainMarks;
  if (typeof msg?.subMarks === 'boolean') d.subMarks = msg.subMarks;
  if (EXP_RATES.includes(msg?.exp)) d.exp = msg.exp;
  if (ENEMY_RATES.includes(msg?.enemy)) d.enemy = msg.enemy;
  if (d.mainMarks && d.subMarks && d.exp === 1 && d.enemy === 1) return undefined;
  return d;
}

// 戦いで もらえる 経験値・お金の きほんの 倍率（2026年10月 見なおし。前は どちらも 1）
// 「レベルと お金が たまりやすすぎる」ので、経験値は 6わり・お金は 7わりに した。
// 設定の「もらえる経験値」（1・0.75・0.5）は この 上に かかる（scaleExp）。職業レベル（戦いの 数）・店の 値段は かえない
export const REWARD_EXP_RATE = 0.6;
export const REWARD_GOLD_RATE = 0.7;
// 戦い 1回ぶんの 経験値（魔物の exp の 合計 → きほんの 倍率。0 で なければ 1 いじょう）
export function rewardExp(exp) {
  return exp > 0 ? Math.max(1, Math.round(exp * REWARD_EXP_RATE)) : 0;
}
// 戦い・宝箱・ひみつのダンジョンの ごほうびの お金（0 で なければ 1 いじょう）
export function rewardGold(gold) {
  return gold > 0 ? Math.max(1, Math.round(gold * REWARD_GOLD_RATE)) : 0;
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

// 敵の 強さ（設定の「敵の強さ」）: 魔物 1体の HP（最大と 今）・MP・攻撃・守り・素早さ・魔力（回復の 力も）を rate 倍に する。
// たたかいの はじめの 魔物も、とちゅうで 来た 魔物（仲間を呼ぶ・ボスが 呼んだ 手下・まぼろしの 分身）も（battle.js の addEnemies）。
// 宝の洞窟の 強さ（data/treasure.js の scaleEnemy）の あとに かける。レベルと ほうしゅう（rewardK）は かえない
export function strengthenEnemy(m, rate) {
  if (!m || !(rate > 1) || !ENEMY_RATES.includes(rate)) return m;
  const up = (v) => Math.round((v || 0) * rate);
  m.maxHp = Math.max(1, up(m.maxHp));
  m.hp = Math.min(m.maxHp, Math.max(1, up(m.hp)));
  m.maxMp = up(m.maxMp);
  m.mp = Math.min(m.maxMp, up(m.mp));
  m.atk = up(m.atk);
  m.dfn = up(m.dfn);
  m.agi = up(m.agi);
  m.mag = up(m.mag);
  m.healPow = up(m.healPow);
  return m;
}
