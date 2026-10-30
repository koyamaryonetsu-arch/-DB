// 第2部 第6章 Step 6: 第6章クリアの ごほうびの 乗り物（data/vehicles.js に 1行で まぜる。docs/plan-ch6.md の 13-3・17）
//
// ・ぜんまい馬（zenmai_horse）… 千年前でも 乗れる はじめての 乗り物（地上だけ。千年前は 空を 飛べない）
//   past: true … 千年前の マップ（map.past）でも 乗れる。ほかの 乗り物は 千年前では 乗れない（vehicles.js の rideShown）
// ・乗り物屋では 売らない（jobs: [] … たなには 持っている 時だけ 出る）。gift … 乗り物屋の 一らんで「もらった物」
// ・A が 台本の さいごで わたす（data/fq-common.js の vehicleSteps('zenmai_horse')。パーティーの みんなが もらえる）
// ・絵は client/render/vehicle-tokei.js（addTokeiVehicleArt）
export const TOKEI_VEHICLES = {
  zenmai_horse: { name: 'ぜんまい馬', price: 9800, jobs: [], gift: true, past: true, desc: 'ゼンマイのからくりを、トキネが「よい心」にもどした馬。せなかのねじが回ると、カタカタ走る。千年前でも乗れる。' },
};
