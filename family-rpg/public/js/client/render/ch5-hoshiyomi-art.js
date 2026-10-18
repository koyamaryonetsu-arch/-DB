// 第5章 Step 5「星読みの里」「ノクトの思い出の迷宮」の 人の え（render/chars.js が まぜる）
// ・星読みのじいさま カナタ（あい色の ころもに 金の ふち・とんがり ぼうし・長い ひげ・つえ）
// ・里の 星読みたち（こい あい色の ころもに 星の 色の ふち）・星の 名前の 子どもたち（スピカ・ベガ・リゲル）
// ・ノクト（フードを はずした すがた。黒い かみ・あい色の マントに 星の 色の ぬいとり。フードの子〈hood_kid〉と おなじ 大きさ）
// ・ノクトの 影（迷宮の 6階。かおの 見えない フードの、まっくろな 子どもの 形の 影）
export const HOSHIYOMI_NPC_LOOKS = {
  kanata: { hair: 5, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#2a2a5a', robeTrim: '#f2d870', beard: true, cane: true, hunch: true, hat: 'wizard', hatColor: '#2a2a5a' },
  hoshi_m: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'robe', robeMain: '#34386a', robeTrim: '#c8d0ff' },
  hoshi_f: { hair: 0, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#3a3a74', robeTrim: '#f0d8a0', female: true },
  hoshi_old: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#4a3a6a', robeTrim: '#e8d8a0', female: true, cane: true, hunch: true },
  hoshi_deshi: { hair: 3, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#2e3a6a', robeTrim: '#a8d0ff', hat: 'cowl', hatColor: '#2e3a6a' },
  hoshi_kid: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#5a6ad8', female: true, small: true },
  hoshi_kid2: { hair: 1, hairStyle: 'pony', skin: 1, outfit: 'dress', cloth: '#a88ad8', female: true, small: true },
  hoshi_kid3: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#3a5aa8', small: true },
  nocto: { hair: '#24223a', hairStyle: 'short', skin: 1, outfit: 'robe', robeMain: '#262a48', robeTrim: '#a8b4f0', small: true, cape: '#1a1c34' },
  nocto_shade: { hair: '#08060e', hairStyle: 'short', skin: '#2a2438', outfit: 'robe', robeMain: '#14101e', robeTrim: '#4a3e7a', small: true, hat: 'hood_dark', hatColor: '#14101e' },
};
