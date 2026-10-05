// 宿屋の だいほん（ドラクエの ながれ: ねだん → はい／いいえ → おやすみ → おはよう）
// x（だいほんの じょうほう）が あれば 時間で かわる:
//   昼 … 「はい（朝まで）」「いいえ」「夜まで休む」 / 夜 … 「はい」「いいえ」（朝まで とまる）
//   さそわれて 手伝っている 人は 時間を かえない（時計は リーダーの もの。world/clock.js）
// opts.noon … 「昼まで休む」も えらべる 宿屋（王都サファラ。ピラミッドの 日時計の とびらを 長く 待たなくて いい ように）
//   昼 … 「はい（朝まで）」「いいえ」「夜まで休む」「昼まで休む」 / 夜 … 「はい（朝まで）」「いいえ」「昼まで休む」
export function innSteps(keeper, price, x = null, opts = {}) {
  const hello = ['say', keeper, `旅人の宿屋へようこそ。\nひと晩${price}ゴールドですが、おとまりになりますか？`];
  const stay = [['inn', price, keeper]];
  const no = [['say', keeper, 'またのおこしをお待ちしております。']];
  const noon = [['inn', price, keeper, 'noon']];
  if (x?.helper) return [hello, ['choice', `とまる？（${price}ゴールド）`, ['はい', 'いいえ'], [stay, no]]];
  if (x?.night) {
    if (opts.noon) return [hello, ['choice', `とまる？（${price}ゴールド）`, ['はい（朝まで）', 'いいえ', '昼まで休む'], [stay, no, noon]]];
    return [hello, ['choice', `とまる？（${price}ゴールド）`, ['はい', 'いいえ'], [stay, no]]];
  }
  const labels = ['はい（朝まで）', 'いいえ', '夜まで休む'];
  const branches = [stay, no, [['inn', price, keeper, 'night']]];
  if (opts.noon) {
    labels.push('昼まで休む');
    branches.push(noon);
  }
  return [hello, ['choice', `とまる？（${price}ゴールド）`, labels, branches]];
}
