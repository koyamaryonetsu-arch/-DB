// 第79回: 幻の職業の 乗り物（data/vehicles.js に 1行で まぜる。docs/plan-r79-phantom-vehicles.md）
//
// ・幻の職業 1つに つき 1つ（12こ）。その 幻の職業に 1度でも なった 人の たなに だけ 出る
//   （今の 職業の 乗り物と おなじ jobs の しくみ。まだ なって いない 人には 名前も 出さない。幻の職業は ひみつ）
// ・ねだんは 伝説の 職業の 乗り物（勇者の天馬 8000G・空飛ぶ玉座 9000G）より ずっと 上（20000〜30000G）
// ・速さは ほかの 乗り物と おなじ（乗り物は 絵だけ。強さに かかわる 数字は ない）。見た目の ごほうび
// ・phantom: true … 乗り物屋の 一らんで「幻」の しるし（client/ui/vehicles.js）
// ・持ち方（char.vehicles の id の ならび）は 今の まま。引っこしコードも そのまま とどく
// ・絵は client/render/vehicle-phantom.js（addPhantomVehicleArt。4方向・3コマ・2D と 2.5D は 同じ 絵）
export const PHANTOM_VEHICLES = {
  sky_galleon: { name: '空飛ぶ王の海賊船', price: 28000, jobs: ['pirate_king'], phantom: true, desc: '雲の海を走る、王さまの海賊船。大きなほに、風をいっぱいうけて進む。' },
  thunder_dragon: { name: '雷をまとう金の竜', price: 30000, jobs: ['super_hero'], phantom: true, desc: '金色にかがやく竜。体のまわりに、いなずまがパチパチ走る。' },
  sun_toad: { name: '日輪の大ガマ', price: 26000, jobs: ['sun_hokage'], phantom: true, desc: 'せなかに日輪をせおった、大きなガマ。ぴょーんとはねて進む。' },
  hover_pod: { name: '自動運転ホバーポッド', price: 24000, jobs: ['facility_ai'], phantom: true, desc: '行き先を言うだけで、勝手に進むポッド。足もとから風が出る。' },
  detective_blimp: { name: '探ていの飛行船', price: 25000, jobs: ['detective_king'], phantom: true, desc: 'サーチライトで、なぞを照らす小さな飛行船。' },
  moon_carriage: { name: '三日月と星の馬車', price: 27000, jobs: ['galaxy_queen'], phantom: true, desc: '小さな星が引く、三日月の形の馬車。車輪も星の形。' },
  magic_disc: { name: '魔法じんの円ばん', price: 26000, jobs: ['grand_magus'], phantom: true, desc: '空にうかぶ円ばん。足もとの魔法じんが、くるくる回る。' },
  gold_mikoshi: { name: '金のおみこし', price: 25000, jobs: ['sword_saint'], phantom: true, desc: 'みんなでかつぐ金のおみこし。小さな足が、ちょこちょこ走る。' },
  rocket_mamachari: { name: '宇宙ママチャリ', price: 20000, jobs: ['cosmic_okan'], phantom: true, desc: 'ロケットつきのママチャリ。前のかごには、今日の買い物。' },
  tiny_planet: { name: '小さな星', price: 30000, jobs: ['chaos_creator'], phantom: true, desc: '乗ると、草や花が生えては消える。こわして、また作る小さな星。' },
  dream_express: { name: '夢の特急', price: 28000, jobs: ['dream_stadium'], phantom: true, desc: 'まどから、応えんの旗がゆれる夢の特急。' },
  typhoon_eye: { name: '小さな台風の目', price: 27000, jobs: ['weather_god'], phantom: true, desc: 'うずまく雲のまん中は、風のない台風の目。小さな雷も光る。' },
};
