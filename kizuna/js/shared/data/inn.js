// 宿屋の だいほん（ドラクエの ながれ: ねだん → はい／いいえ → おやすみ → おはよう）
export function innSteps(keeper, price) {
  return [
    ['say', keeper, `旅人の宿屋へようこそ。\nひと晩${price}ゴールドですが、おとまりになりますか？`],
    ['choice', `とまる？（${price}ゴールド）`, ['はい', 'いいえ'], [
      [['inn', price, keeper]],
      [['say', keeper, 'またのおこしをお待ちしております。']],
    ]],
  ];
}
