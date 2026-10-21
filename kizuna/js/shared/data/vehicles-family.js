// たのまれごとで しか もらえない 乗り物（第39回 C。家族の 仕事の たのまれごと。data/vehicles.js に 1行で まぜる）
//
// ・乗り物屋では 売らない（jobs: [] … たなには 持っている 時だけ 出る。buyVehicle も たなに ない 物は 買えない）
// ・gift: true … 乗り物屋の 一らんで「もらった物」と 出す（client/ui/vehicles.js）
// ・price … 売り物では ないが、ほかの 乗り物と おなじ ものさしで ねうちを 書いておく（テストの きまり）
// ・絵は client/render/family-art.js（addFamilyVehicleArt。2D と 2.5D の どちらも 第37回の 乗り物と おなじ しくみで かく）
// ・もらう 時は data/sidequests-family.js の vehicleSteps（パーティーの みんなが もらえる）
export const FAMILY_VEHICLES = {
  lift_truck: { name: '高所作業車', price: 9000, jobs: [], gift: true, desc: 'サファラ劇場の支配人がくれた、高い所の点検に使う車。台がぐーんと上がる。' },
  rickshaw: { name: '湯けむりの人力車', price: 7000, jobs: [], gift: true, desc: 'ユノハのおみやげ屋がくれた、赤い人力車。お客さんを乗せて温泉めぐり。' },
  kitchen_car: { name: 'キッチンカー', price: 8000, jobs: [], gift: true, desc: '料理大会の優勝のごほうび。どこでも料理が作れる、黄色い車。' },
  patrol_car: { name: 'パトカー', price: 8500, jobs: [], gift: true, desc: 'ルミナの町の見回りに使う、白と黒の車。赤いランプが光る。' },
  gold_trolley: { name: '金のトロッコ', price: 9500, jobs: [], gift: true, desc: 'だれも知らない小べやにねむっていた、金色のトロッコ。線路がなくても走る…？' },
};
