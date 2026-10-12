// ひみつのダンジョンの お店だけで 買える 回復薬（2026年10月 第32回 B。items.js で まぜる）
// お店の 階（data/secret-shop.js）に 運しだいで ならぶ。ほかの 店・宝箱・ドロップには 出ない
//   全員回復（target: 'allies'）は 戦いの 中だけ（フィールドでは 1人ずつの 薬を 使う）
export const SD_POTIONS = {
  sd_deep_water: {
    name: '地底の泉の水', type: 'use', price: 1200, target: 'ally', battle: true, field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [400, 450], fixed: true }, { type: 'mpHeal', base: [80, 90] }] },
    desc: 'ひみつのダンジョンのおくでくんだ水。1人のHPを400ほど、MPを80ほど回復する。',
  },
  sd_star_water: {
    name: '星くずの聖水', type: 'use', price: 1500, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [150, 170] },
    desc: '星のかけらをとかした聖水。1人のMPを160ほど回復する。',
  },
  sd_heal_bell: {
    name: 'いやしの大すず', type: 'use', price: 1800, target: 'allies', battle: true, field: false,
    effect: { type: 'heal', base: [250, 280], fixed: true },
    desc: 'ふると、すんだ音が仲間みんなをいやす。戦いの中で、全員のHPを250ほど回復する。',
  },
  sd_phoenix: {
    name: '不死鳥の羽', type: 'use', price: 2500, target: 'deadAlly', battle: true, field: true,
    effect: { type: 'revive', hpRatio: 1 },
    desc: '不死鳥がのこした金色の羽。死んでしまった仲間を、HPまんたんで生き返らせる。',
  },
};
export const SD_POTION_KANA = {
  sd_deep_water: 'ちていのいずみのみず', sd_star_water: 'ほしくずのせいすい', sd_heal_bell: 'いやしのおおすず', sd_phoenix: 'ふしちょうのはね',
};
