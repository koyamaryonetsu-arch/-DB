// 宿屋の だいほん（ドラクエの ながれ: ねだん → はい／いいえ → おやすみ → おはよう）
// x（だいほんの じょうほう）が あれば 時間で かわる:
//   昼 … 「はい（朝まで）」「いいえ」「夜まで休む」 / 夜 … 「はい」「いいえ」（朝まで とまる）
//   さそわれて 手伝っている 人は 時間を かえない（時計は リーダーの もの。world/clock.js）
export function innSteps(keeper, price, x = null) {
  const hello = ['say', keeper, `旅人の宿屋へようこそ。\nひと晩${price}ゴールドですが、おとまりになりますか？`];
  const stay = [['inn', price, keeper]];
  const no = [['say', keeper, 'またのおこしをお待ちしております。']];
  if (x?.night || x?.helper) return [hello, ['choice', `とまる？（${price}ゴールド）`, ['はい', 'いいえ'], [stay, no]]];
  return [
    hello,
    ['choice', `とまる？（${price}ゴールド）`, ['はい（朝まで）', 'いいえ', '夜まで休む'], [stay, no, [['inn', price, keeper, 'night']]]],
  ];
}
