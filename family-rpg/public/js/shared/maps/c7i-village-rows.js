// 第7章 Step 5・6（A: 世界と物語）千年前の シロガネ地方の「白雪の里」（22×14。今の 竜守りの村の まん中。maps/c7i-snow.js が はめこむ）
// ※ ネタバレ注意（docs/plan-ch7.md の 8）。のちの 竜守りの村の はじまりの 小さな 里
// 雪の 小さな 里: 北西の 宿屋・まん中の「竜のほこら」（記録）・北東の 店（武器・防具・道具）・南西の 里長の 家・南東の 竜の 世話係の 家・
//   まん中の 大通り（東西）・北と 南の 道・井戸・南の 道の りょうがわに 竜の 石像・雪の もみの木
// 文字は tiles.js の LEGEND（a … 雪・d … 雪の 道・e … 雪の もみの木・W … 木の かべ・_ … 木の ゆか・D … とびら・A … 祭だん・
//   B … ベッド・t … つくえ・c … いす・S … たな・o … つぼ・k … 本だな・w … 井戸・Y … 竜の 石像）
export const VILLAGE7I_ROWS = [
  'eaaaaeaaaaddaaaaeaaaae',
  'aWWWWWWWaWWWWaWWWWWWWa',
  'aW_B_B_WaW_AWaW_S_S_Wa',
  'aW_____WaW__WaW_____Wa',
  'aWtc__oWaWWDWaW_____Wa',
  'aWWWDWWWaaddaaWWWDWWWa',
  'aaaadaaaaaddaaaaadaaaa',
  'dddddddddddddddddddddd',
  'aaaadaaaaaddaaaaadaaaa',
  'aWWWDWWaaaddaaaWWDWWWa',
  'aW____WawaddaaaW__B_Wa',
  'aW_tk_WaaaddaaaWo___Wa',
  'aWWWWWWaaYddYaaWWWWWWa',
  'aaaaaeaaaaddaaaaeaaaaa',
];
// 里の 中の 場所（里の 左上からの 座標）
export const VILLAGE7I_SPOTS = {
  inn: { x: 4, y: 2 }, // 宿屋の おかみ
  shrine: { x: 10, y: 2 }, // 竜のほこらの 神官（記録）
  altar: { x: 11, y: 2 },
  weapon: { x: 15, y: 2 }, armor: { x: 17, y: 2 }, item: { x: 19, y: 2 },
  elder: { x: 2, y: 10 }, // 里長
  keeper: { x: 19, y: 11 }, // 竜の 世話係の むすめ
  plaza: { x: 10, y: 7 }, // 大通りの まん中（さいしょの 場面で 立つ 所）
  kai: { x: 13, y: 8 }, // 里で 待っている カイ（c7_frost 〜 c7_witch）
  well: { x: 8, y: 10 },
  statues: [{ x: 9, y: 12 }, { x: 12, y: 12 }],
  north: { x: 10, y: 0 }, // 北の 入口（城への 道）
  south: { x: 10, y: 13 }, // 南の 入口
  west: { x: 0, y: 7 }, east: { x: 21, y: 7 }, // 東西の 大通りの はし
};
// やねの 色（たてもの。[x, y, はば, 高さ, 色]）
export const VILLAGE7I_ROOFS = [[1, 1, 7, 5, 'snowblue'], [9, 1, 4, 4, 'snow'], [14, 1, 7, 5, 'snowred'], [1, 9, 6, 4, 'snowgreen'], [15, 9, 7, 4, 'snowred']];
