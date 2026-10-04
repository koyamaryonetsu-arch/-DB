// 第4章「砂の海にしずむ星」の 村・ダンジョンの レイアウト（1文字 = 1マス。文字の いみは tiles.js の LEGEND）
// 0=砂ばく J=日干しれんがの かべ q=砂岩 4=ヤシの木 5=サボテン ;=広場 :=石の 道 ==かわいた どろ ~=水
// G=洞窟の かべ g=ゆか v=水 u=がれき p=柱 i=たいまつ <=上へ（井戸の なわばしご）

// オアシスの村ハミル（30×24）: 村長の家（左上）・教会（右上）・宿屋（左）・よろず屋（右）・アミの家（左下）
// まん中の オアシスは 水が へって、まわりが かわいた どろに なっている
// 門: 北（北の古井戸へ）・南（砂嵐のかべの 方へ）・東（北の海辺へ）
export const HAMIL_ROWS = [
  'JJJJJJJJJJJJJJ::JJJJJJJJJJJJJJ',
  'J4000000000000::0000000000004J',
  'J0JJJJJJJJJ000::000JJJJJJJJJ0J',
  'J0JkS_o_SkJ000::000Jl__A__lJ0J',
  'J4J_______J000::000J_______J4J',
  'J0J_tt___BJ000::000J_c_r_c_J0J',
  'J0J_cc___BJ000::000J_c_r_c_J0J',
  'J0JO_____oJ000::000JJJJDJJJJ0J',
  'J0JJJJDJJJJ000::0000000:00000J',
  'J:::::::::::::::::::::::::::::',
  'J0JJJJJJJJ:4;;;;;;4:0JJJJJJJ::',
  'J0J__B_B_J:;======;:0JSS_SSJ0J',
  'J4JCC____J:;=~~~~=;:0J_CCC_J0J',
  'J0J______J:;=~~~~=;:0J_____J4J',
  'J0Jo__tc_J:;=~~~~=;:0JJJDJJJ0J',
  'J0JJJDJJJJ:;======;:0000:0000J',
  'J0000:0000:4;;;;;;4:0000:0000J',
  'J::::::::::::::::::::::::::::J',
  'J0JJJJJJ00x0O0::000000JJJJJJ0J',
  'J0JB__oJ000000::0w0040JOB__J0J',
  'J4J___tJ0*0000::000000J___tJ4J',
  'J0JJDJJJ000000::0000*0JJJDJJ0J',
  'J0000000000000::0000000000000J',
  'JJJJJJJJJJJJJJ::JJJJJJJJJJJJJJ',
];

// 北の古井戸（34×28）: 上の なわばしご（<）から 下りる。まん中に 古い 水たまり。右下の へやに アミが いる
export const WELL_ROWS = [
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGiG<GGiGGGGGggggggggggGGGGGGGGGGG',
  'GGggggggGGGGGggggggugggGGGGGGGGGGG',
  'GGguggggGGGGGggggggggggGGGGGGGGGGG',
  'GGggggggGGGGGGGGGggGGGGGGGGGGGGGGG',
  'GGggggggGGGGiGGGGggGGGGGiGGGGGGGGG',
  'GGGGggGGGGGGGpgggggggggpGGGGGGGGGG',
  'GGGGggGGGGGGGgguggggggggGGGGGGGGGG',
  'GGGGggGGGGGGGgggggggggggGGGGGGGGGG',
  'GGggggggggGGGgggvvvvggggGGGGGGGGGG',
  'GGggggggggggggggvvvvggggGGGGGGGGGG',
  'GiggggggggggggggvvvvggggGGGGGGGGGG',
  'GGggggggugGGGgggvvvvggggGGGGGGGGGG',
  'GGggggggggGGGgggggggggggggggggGGGG',
  'GGGGGGGGGGGGGgggggggguggggggggGGGG',
  'GGGGGGGGGGGGGgggggggggggGGGGggGGGG',
  'GGGGGGGGGGGGGpgggggggggpGGGGggGGGG',
  'GGGGGGGGGGGGGGggGGGGGGGGGGGGggGGGG',
  'GGGGGGGGGGGGGGggGGGGpggggggggggpGG',
  'GGGGiGGGGGGGGGggGGGGggggggggggggGG',
  'GGGGGggggggggggggGGGggggggugggggGG',
  'GGGGGggggggguggggiGGggggggggggggiG',
  'GGGGGggggggggggggGGiggggggggggggGG',
  'GGGGGggugggggggggGGGggggggggggggGG',
  'GGGGGggggggggggggGGGgvvvggggggugGG',
  'GGGGGGGGGGGGGGGGGGGGgvvvggggggggGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGiGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
];
