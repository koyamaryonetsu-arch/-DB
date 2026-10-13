// 第33回の 職業の 装備（items.js で まぜる。shops.js が R33_SHOP_ADD で 店に ならべる）
//
// ・店の 品（レア度なし）: 手品師・れん金術師の はじめの 装備と、それぞれの 職業に 合う 品。強さは 同じ ランクの 店の 品と おなじ くらい
// ・レア装備（★3〜★4）: 職業の 系統ごとに 1〜2こ。強さの 式は items-rare.js の W・A・C と おなじ（ランクの めやす × 武器の 種類 × レア度）
//   src … 'tm' 宝の洞窟の 宝箱（grp: 地図の ことばの なかま）・'sd' ひみつのダンジョンだけ（data/rare-loot.js が まぜて えらぶ）
// ・見た目は 絵の 担当（client/render）。種類（cat）で 今の 絵が 出る

export const ITEMS_R33 = {
  // ── 店の 品 ──
  magic_wand: { name: 'マジックステッキ', type: 'weapon', rank: 1, cat: 'staff', atk: 5, bonus: { agi: 2, mag: 3 }, price: 50, desc: '先から花やハトが出てくる、黒と白のステッキ。手品師のあいぼう。' },
  chalk: { name: 'チョーク', type: 'weapon', rank: 1, cat: 'staff', atk: 4, bonus: { mag: 4 }, price: 30, desc: '地面にまるいもようをかいて、れん成するための白いチョーク。黒板にも書ける。' },
  silk_hat: { name: 'シルクハット', type: 'head', rank: 2, def: 3, bonus: { agi: 2, mag: 2 }, price: 160, desc: '背の高い、黒いぼうし。中から何が出てくるかは、ひみつ。' },
  school_robe: { name: '魔法学校のローブ', type: 'armor', rank: 3, armorType: 'robe', def: 12, bonus: { mag: 5, agi: 2 }, price: 380, desc: '魔法の学校の、黒いローブ。むねに学校のもんしょうがついている。' },
  tiara_boomerang: { name: 'ティアラ', type: 'weapon', rank: 4, cat: 'boomerang', atk: 18, bonus: { mag: 4 }, price: 1200, desc: 'ひたいにつける、金のティアラ。投げると光のわになって、敵全体に当たる。' },
  pointer_stick: { name: '指し棒', type: 'weapon', rank: 5, cat: 'staff', atk: 15, bonus: { mag: 10, heal: 10 }, price: 2000, desc: '黒板の字を指す、のびる棒。先生が持つと、なぜか強い。' },

  // ── レア装備 ──
  // かいとう・かいとうキッド（宝の洞窟「ひみつ」）
  kid_mantle: { name: 'かいとうの白いマント', type: 'armor', rank: 7, armorType: 'cloth', def: 36, rarity: 3, src: 'tm', grp: 'secret', bonus: { agi: 8, mag: 4 }, crit: 0.03, desc: '月夜にひるがえる、白いマント。だれでも装備でき、素早さが上がって会心が出やすい。' },
  // 魔法学校の生徒・ハリーポッター（宝の洞窟「まぼろし」・ひみつのダンジョン）
  invisible_cloak: { name: 'とうめいマント', type: 'armor', rank: 6, armorType: 'cloth', def: 29, rarity: 3, src: 'tm', grp: 'mirage', bonus: { agi: 6 }, resist: { blind: 0.6, confuse: 0.7 }, desc: 'かぶると、すがたが見えなくなるマント。だれでも装備でき、マヌーサと混乱にかかりにくい。' },
  elder_wand: { name: 'ニワトコのつえ', type: 'weapon', rank: 8, cat: 'staff', atk: 29, rarity: 4, src: 'sd', bonus: { mag: 32, heal: 8 }, mpRegen: 1, desc: 'いちばん強いといわれる、伝説のつえ。呪文の力がとても上がり、行動するたびにMPが1回復する。' },
  // れん金術師の 系統（宝の洞窟「大地・岩」）
  automail_arm: { name: 'はがねの機械のうで', type: 'weapon', rank: 7, cat: 'claw', atk: 59, rarity: 3, src: 'tm', grp: 'rock', bonus: { str: 4, def: 4 }, resist: { paralyze: 0.8 }, desc: 'はがねでできた、機械のうで。ツメのように使える。力と守りが上がり、マヒしにくい。' },
  // 美少女戦士・セーラームーン（ひみつのダンジョン）
  silver_crystal: { name: '銀水しょう', type: 'acc', rank: 8, rarity: 4, src: 'sd', bonus: { mag: 10, heal: 12, mp: 15 }, mpRegen: 2, desc: '月の王国につたわる、まぼろしの水しょう。魔力と回復の力が上がり、行動するたびにMPが2回復する。' },
  // 3年B組の担任（宝の洞窟「大地・岩」）
  nekketsu_jersey: { name: '熱血先生のジャージ', type: 'armor', rank: 7, armorType: 'cloth', def: 36, rarity: 3, src: 'tm', grp: 'rock', bonus: { hp: 20, heal: 6 }, desc: '生徒といっしょに走りつづけた、緑のジャージ。だれでも装備でき、HPと回復の力が上がる。' },
};

// 店では 買えない レア装備の 売り値（items-rare.js と おなじ 式: ランクと レア度）
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
for (const it of Object.values(ITEMS_R33)) {
  if (!it.src) continue;
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const R33_ITEM_KANA = {
  magic_wand: 'まじっくすてっき', chalk: 'ちょーく', silk_hat: 'しるくはっと', school_robe: 'まほうがっこうのろーぶ', tiara_boomerang: 'てぃあら', pointer_stick: 'さしぼう',
  kid_mantle: 'かいとうのしろいまんと', invisible_cloak: 'とうめいまんと', elder_wand: 'にわとこのつえ', automail_arm: 'はがねのきかいのうで',
  silver_crystal: 'ぎんずいしょう', nekketsu_jersey: 'ねっけつせんせいのじゃーじ',
};

// 店に ならべる 品（shops.js。more は 物語が すすむと ふえる 品）
export const R33_SHOP_ADD = {
  village: { items: ['magic_wand', 'chalk'] },
  armor: { items: ['silk_hat'], more: { c1_treant: ['school_robe'] } },
  port_arms: { more: { c2_kraken: ['tiara_boomerang'] } },
  kanatoko_weapon: { items: ['pointer_stick'] },
};
