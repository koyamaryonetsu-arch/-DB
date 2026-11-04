// 第7章 Step 3・4（A: 世界と物語）千年前の クモイの 海の「ナギの村」（22×14。今の ハネノの島の 町の あたり。maps/c7s-sea.js が はめこむ）
// ※ ネタバレ注意（docs/plan-ch7.md の 4）
// 海べの 小さな 村: 北西の 宿屋・まん中の「海のほこら」（記録）・北東の 店（武器・防具・道具）・南西の 村長の 家・南東の カイの 家・
//   まん中の 大通り（東西）・南の 船着き場へ 下りる 道・井戸・ヤシの木
// 文字は tiles.js の LEGEND（s … 砂・= … 土の 道・4 … ヤシの木・W … 木の かべ・_ … 木の ゆか・D … とびら・A … 祭だん・
//   B … ベッド・t … つくえ・c … いす・S … たな・o … つぼ・k … 本だな・w … 井戸・. … 草）
export const VILLAGE_ROWS = [
  '4ssss4ssss==ssss4ssss4',
  'sWWWWWWWsWWWWsWWWWWWWs',
  'sW_B_B_WsW_AWsW_S_S_Ws',
  'sW_____WsW__WsW_____Ws',
  'sWtc__oWsWWDWsW_____Ws',
  'sWWWDWWWss==ssWWWDWWWs',
  'ssss=sssss==sssss=ssss',
  '======================',
  'ssss=sssss==sssss=ssss',
  'sWWWDWWss.==.ssWWDWWWs',
  'sW____Wsw.==.ssW__B_Ws',
  'sW_tk_Wss.==.ssWo___Ws',
  'sWWWWWWss4==4ssWWWWWWs',
  'sssss4ssss==ssss4sssss',
];
// 村の 中の 場所（村の 左上からの 座標）
export const VILLAGE_SPOTS = {
  inn: { x: 4, y: 2 }, // 宿屋の おかみ
  shrine: { x: 10, y: 2 }, // 海のほこらの みこ（記録）
  altar: { x: 11, y: 2 },
  weapon: { x: 15, y: 2 }, armor: { x: 17, y: 2 }, item: { x: 19, y: 2 },
  elder: { x: 2, y: 10 }, // 村長の おばば
  kaiHome: { x: 19, y: 11 },
  plaza: { x: 10, y: 7 }, // 大通りの まん中（さいしょの 場面で 立つ 所）
  well: { x: 8, y: 10 },
  north: { x: 10, y: 0 }, // 北の 入口
  south: { x: 10, y: 13 }, // 南の 船着き場への 道
};
// やねの 色（たてもの。[x, y, はば, 高さ, 色]）
export const VILLAGE_ROOFS = [[1, 1, 7, 5, 'teal'], [9, 1, 4, 4, 'white'], [14, 1, 7, 5, 'clay'], [1, 9, 6, 4, 'canvas'], [15, 9, 6, 4, 'sand']];
