// 第50回 D3: 景品で しか もらえない 乗り物（カジノ・小さなメダル・星のかけらの 乗り物券。data/vehicles.js に 1行で まぜる）
//
// ・乗り物屋では 売らない（jobs: [] … たなには 持っている 時だけ 出る）。gift: true … 一らんで「もらった物」
// ・もらいかた: 乗り物券（data/items-prize-r50.js の prizeRide）を 道具から 使う（world/prizes-r50.js）
// ・price … 売り物では ないが、ほかの 乗り物と おなじ ものさしで ねうちを 書いておく（テストの きまり）
// ・絵は client/render/prize-vehicle-art.js（今の 乗り物の 絵の 作り方を 色がえで 使い回す）
export const PRIZE_VEHICLES = {
  gold_bicycle: { name: '金色の自転車', price: 2400, jobs: [], gift: true, desc: 'カジノの景品の、ぴかぴかの金色の自転車。' },
  gold_mane_horse: { name: '金のたてがみの馬', price: 6000, jobs: [], gift: true, desc: '金色のたてがみをなびかせて走る、白い馬。' },
  gold_carpet: { name: '金色のじゅうたん', price: 9000, jobs: [], gift: true, desc: '金の糸でおられた、空飛ぶじゅうたん。' },
  lucky_pegasus: { name: '幸運の天馬', price: 12000, jobs: [], gift: true, desc: 'ピンクのたてがみの天馬。乗ると、いいことがありそう。' },
  gold_open_car: { name: '黄金のオープンカー', price: 15000, jobs: [], gift: true, desc: 'カジノ王もあこがれる、金色のオープンカー。' },
  galaxy_bicycle: { name: '銀河の自転車', price: 14000, jobs: [], gift: true, desc: '夜空のような色の自転車。車輪が星のように光る。' },
  galaxy_pegasus: { name: '銀河の天馬', price: 18000, jobs: [], gift: true, desc: '夜空の色の体に、星のつばさの天馬。' },
  rainbow_carpet: { name: 'にじ色のじゅうたん', price: 20000, jobs: [], gift: true, desc: 'にじの7色でおられた、空飛ぶじゅうたん。' },
  medal_carpet: { name: 'メダル王のじゅうたん', price: 10000, jobs: [], gift: true, desc: 'メダル王がくれた、むらさきと金の空飛ぶじゅうたん。' },
  star_bicycle: { name: '星のかけらの自転車', price: 8000, jobs: [], gift: true, desc: '星のかけらをちりばめた、水色の自転車。' },
  comet_cloud: { name: 'ほうき星の雲', price: 16000, jobs: [], gift: true, desc: 'ほうき星のしっぽから生まれた、青白い雲。' },
};
