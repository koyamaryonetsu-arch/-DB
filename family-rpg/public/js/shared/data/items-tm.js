// 宝の洞窟の 主（ボス）が 落とす 物（items.js で まぜる）
// どれも 1人 1つの 品（unique）。同じ 主を 何回 たおしても ふえない
export const ITEMS_TM = {
  tm_gold_bangle: { name: '黄金のうでわ', type: 'acc', rank: 3, unique: true, bonus: { def: 4, hp: 15 }, price: 0, sell: 300, desc: '黄金のゴーレムの体からけずり出したうでわ。HPと身の守りが上がる。' },
  tm_gem_ring: { name: '宝石の指輪', type: 'acc', rank: 3, unique: true, bonus: { mp: 10, heal: 5 }, price: 0, sell: 300, desc: '宝石のキングぷるりんがかくし持っていた指輪。MPと回復魔力が上がる。' },
  tm_dragon_scale: { name: '炎竜のうろこ', type: 'acc', rank: 3, unique: true, bonus: { def: 3, str: 3 }, resist: { fire: 0.7 }, price: 0, sell: 300, desc: '炎の竜のうろこのお守り。力と身の守りが上がり、炎に強くなる。' },
  tm_dark_ring: { name: '闇の指輪', type: 'acc', rank: 3, unique: true, bonus: { str: 4, agi: 3 }, resist: { dark: 0.7 }, price: 0, sell: 300, desc: '闇の騎士がはめていた指輪。力と素早さが上がり、闇に強くなる。' },
  tm_ice_pendant: { name: '氷のペンダント', type: 'acc', rank: 3, unique: true, bonus: { mag: 4, mp: 6 }, resist: { ice: 0.7 }, price: 0, sell: 300, desc: '氷の大へびのなみだがかたまったペンダント。魔力が上がり、氷に強くなる。' },
  tm_shadow_anklet: { name: '影のアンクレット', type: 'acc', rank: 3, unique: true, bonus: { agi: 9 }, price: 0, sell: 300, desc: '影のパンサーの足かざり。素早さが9上がる。' },
};
