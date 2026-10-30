// 第2部 第6章 Step 6: 第6章クリアの ごほうびの ぜんまい馬の え（data/vehicles-tokei.js。vehicle-art.js が addTokeiVehicleArt を よぶ）
// ・ゼンマイの からくりの 馬: 真ちゅうの 体・鉄の たてがみと よろい・金の ふち・むらさきの くら（ゼンマイの 色を すこし のこした）
export function addTokeiVehicleArt(ART, kit) {
  const { horseArt } = kit;
  ART.zenmai_horse = horseArt({ coat: '#c8963a', mane: '#5a5e6a', saddle: '#6a3ab8', armor: '#9aa0b0', trim: '#f0d080', hoof: '#3a3028', muzzle: '#e8c070' });
}
