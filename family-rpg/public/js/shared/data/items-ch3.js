// 第3章「星の竜がねむる山」の どうぐ・そうび（items.js で まぜる）
// ランク5「はがね」: 鉱山の町カナトコの 店で 売る（鉱山を 取りもどすと 品ぞろえが ふえる）
// ★の 品は 宝箱・ボス・魔物の レアドロップ・ふしぎなかじ（星の鉄）で 手に入る
export const ITEMS_CH3 = {
  // ───── 武器（カナトコの 武器屋）─────
  steel_sword: { name: 'はがねの剣', type: 'weapon', rank: 5, cat: 'sword', atk: 40, price: 2200, desc: 'カナトコの鉄できたえた、はがねの剣。' },
  steel_axe: { name: 'はがねのオノ', type: 'weapon', rank: 5, cat: 'axe', atk: 46, bonus: { agi: -3 }, price: 2500, desc: '鉱夫たちも使う、重くて強いオノ。' },
  steel_dagger: { name: 'はがねのナイフ', type: 'weapon', rank: 5, cat: 'dagger', atk: 28, bonus: { agi: 4 }, price: 1500, desc: '軽くてよく切れる、はがねのナイフ。' },
  steel_spear: { name: 'はがねのやり', type: 'weapon', rank: 5, cat: 'spear', atk: 37, price: 2000, desc: 'はがねの先をつけた、長いやり。' },
  steel_claw: { name: 'はがねのツメ', type: 'weapon', rank: 5, cat: 'claw', atk: 36, bonus: { agi: 3 }, price: 1900, desc: 'はがねでできた、するどいツメ。' },
  steel_whip: { name: 'はがねのムチ', type: 'weapon', rank: 5, cat: 'whip', atk: 34, price: 2000, desc: 'はがねの小さなとげが付いたムチ。' },
  steel_bat: { name: 'はがねのバット', type: 'weapon', rank: 5, cat: 'bat', atk: 39, price: 2200, desc: 'カキーン！とよくひびく、はがねのバット。' },
  snow_staff: { name: '雪のつえ', type: 'weapon', rank: 5, cat: 'staff', atk: 15, bonus: { mag: 18, heal: 8 }, price: 1900, desc: '雪の花のかざりがついたつえ。呪文の力が上がる。' },
  ice_fan: { name: '氷のおうぎ', type: 'weapon', rank: 5, cat: 'fan', atk: 26, bonus: { agi: 7 }, price: 1700, desc: 'うすい氷のようにすきとおった、まいのおうぎ。' },
  // ★の 武器
  frost_blade: { name: '氷の剣', type: 'weapon', rank: 5, star: true, cat: 'sword', atk: 46, bonus: { mag: 4 }, price: 0, sell: 1300, desc: '氷の洞窟のおくで見つけた剣。ふると、つめたい風がおこる。' },
  hammer_axe: { name: '大地のハンマー', type: 'weapon', rank: 5, star: true, cat: 'axe', atk: 52, bonus: { agi: -4 }, price: 0, sell: 1400, desc: '鉱山の親方たちが大事にしてきた、大きなハンマー。' },
  obsidian_sword: { name: '黒曜の剣', type: 'weapon', rank: 5, star: true, cat: 'sword', atk: 48, price: 0, sell: 1400, desc: '黒曜石をけずり出した、黒くかがやく剣。' },
  frost_lance: { name: '氷竜のやり', type: 'weapon', rank: 5, star: true, cat: 'spear', atk: 44, bonus: { agi: 2 }, price: 0, sell: 1300, desc: '氷の竜のキバを先に付けた、つめたいやり。' },
  fire_claw: { name: '炎のツメ', type: 'weapon', rank: 5, star: true, cat: 'claw', atk: 42, bonus: { agi: 3 }, price: 0, sell: 1200, desc: '炎の力がやどるツメ。' },
  // ふしぎなかじ（星の鉄）
  meteor_sword: { name: '流星の剣', type: 'weapon', rank: 5, star: true, forge: true, cat: 'sword', atk: 50, bonus: { agi: 4, mag: 4 }, price: 0, sell: 2400, desc: '空から落ちた星の鉄を、テツジイがきたえた剣。星のように光る。' },
  frost_robe: { name: '氷のローブ', type: 'armor', rank: 5, forge: true, armorType: 'robe', def: 27, bonus: { mag: 6, heal: 6 }, resist: { ice: 0.8 }, price: 0, sell: 1300, desc: '氷のかけらをぬいこんだローブ。氷に少し強い。' },
  flame_axe: { name: '炎のオノ', type: 'weapon', rank: 5, forge: true, cat: 'axe', atk: 49, bonus: { agi: -2 }, price: 0, sell: 1500, desc: '炎の石をとかしこんだ、赤くかがやくオノ。' },

  // ───── よろい・たて・頭 ─────
  steel_mail: { name: 'はがねのよろい', type: 'armor', rank: 5, armorType: 'heavy', def: 38, bonus: { agi: -2 }, price: 2600, desc: 'はがねでできた、じょうぶなよろい。' },
  fur_coat: { name: '毛皮のコート', type: 'armor', rank: 5, armorType: 'cloth', def: 22, resist: { ice: 0.85 }, price: 1500, desc: '温かい毛皮のコート。だれでも装備でき、氷に少し強い。' },
  snow_robe: { name: '雪のローブ', type: 'armor', rank: 5, armorType: 'robe', def: 24, bonus: { mag: 5, heal: 5 }, price: 1800, desc: '雪のように白いローブ。魔力が上がる。' },
  snow_gi: { name: '雪原の道着', type: 'armor', rank: 5, armorType: 'gi', def: 27, bonus: { agi: 6 }, price: 1800, desc: '雪の中でも動きやすい道着。' },
  steel_shield: { name: 'はがねのたて', type: 'shield', rank: 5, def: 22, price: 1700, desc: 'はがねのたて。' },
  steel_helm: { name: 'はがねのかぶと', type: 'head', rank: 5, helm: true, def: 13, price: 1300, desc: 'はがねのかぶと。戦士などが装備できる。' },
  fur_hat: { name: '毛皮のぼうし', type: 'head', rank: 5, def: 8, resist: { ice: 0.9 }, price: 800, desc: 'ふかふかの毛皮のぼうし。だれでも装備できる。' },
  // ★の よろい・たて・頭
  frost_mail: { name: '氷のよろい', type: 'armor', rank: 5, star: true, armorType: 'heavy', def: 44, bonus: { agi: -2 }, resist: { ice: 0.7 }, price: 0, sell: 1400, desc: 'とけない氷でできたよろい。氷に強い。' },
  fire_robe: { name: '炎のローブ', type: 'armor', rank: 5, star: true, armorType: 'robe', def: 28, bonus: { mag: 8 }, resist: { fire: 0.7 }, price: 0, sell: 1200, desc: '火の山でつくられたローブ。炎に強い。' },
  star_robe: { name: '星のローブ', type: 'armor', rank: 5, star: true, armorType: 'robe', def: 30, bonus: { mag: 10, heal: 8 }, price: 0, sell: 1500, desc: '星くずをぬいこんだローブ。呪文の力が大きく上がる。' },
  ice_shield: { name: '氷のたて', type: 'shield', rank: 5, star: true, def: 25, resist: { ice: 0.7 }, price: 0, sell: 1000, desc: 'とけない氷でできたたて。氷に強い。' },
  flame_shield: { name: '炎のたて', type: 'shield', rank: 5, star: true, def: 25, resist: { fire: 0.7 }, price: 0, sell: 1000, desc: '火の山の岩でできたたて。炎に強い。' },
  snow_hood: { name: '雪のずきん', type: 'head', rank: 5, star: true, def: 11, bonus: { agi: 3 }, resist: { ice: 0.8 }, price: 0, sell: 700, desc: '雪山の旅人がかぶる、温かいずきん。だれでも装備できる。' },
  sage_hat: { name: 'ちえのぼうし', type: 'head', rank: 5, star: true, def: 9, bonus: { mag: 8, mp: 10 }, price: 0, sell: 800, desc: 'ちえの試練をこえた者がさずかるぼうし。だれでも装備できる。' },

  // ───── アクセサリー ─────
  frost_ring: { name: '氷の指輪', type: 'acc', rank: 5, bonus: { def: 4 }, resist: { ice: 0.6 }, price: 0, sell: 500, desc: '白銀の湖の小島で見つけた指輪。氷にとても強くなる。' },
  snow_charm: { name: '雪のお守り', type: 'acc', rank: 5, bonus: { hp: 20 }, resist: { ice: 0.7, sleep: 0.6 }, price: 0, sell: 450, desc: '雪だるまコンテストのごほうび。氷とねむりに強くなる。' },
  fox_bell: { name: 'キツネのすず', type: 'acc', rank: 5, bonus: { agi: 10, mp: 5 }, price: 0, sell: 450, desc: '子ギツネのユキマルからもらったすず。素早さが上がる。' },
  bond_charm: { name: 'きずなのお守り', type: 'acc', rank: 5, bonus: { hp: 15, mp: 10, str: 3, agi: 3 }, price: 0, sell: 500, desc: 'きずなの試練をこえた者がさずかるお守り。' },
  // ボスが かならず 落とす 物（1人 1つ）
  ice_fang_charm: { name: '氷のキバのお守り', type: 'acc', rank: 5, unique: true, bonus: { hp: 25, def: 5 }, resist: { ice: 0.7 }, price: 0, sell: 500, desc: 'ブリザマンモスがくれたキバのかけら。HPと身の守りが上がり、氷に強い。' },
  magma_bangle: { name: 'ようがんのうでわ', type: 'acc', rank: 5, unique: true, bonus: { str: 7, def: 4 }, price: 0, sell: 550, desc: 'マグマゴーレムの体のかけら。力と身の守りが上がる。' },
  flare_brooch: { name: '炎のブローチ', type: 'acc', rank: 5, unique: true, bonus: { agi: 8, mag: 6 }, resist: { fire: 0.8 }, price: 0, sell: 600, desc: 'フレアードのマントの止め具。素早さと魔力が上がり、炎に少し強い。' },
  courage_emblem: { name: '勇気の紋章', type: 'acc', rank: 5, unique: true, bonus: { str: 6, agi: 6, hp: 15 }, price: 0, sell: 600, desc: '勇気の試練をこえた者のあかし。' },
  flame_earring: { name: '炎のイヤリング', type: 'acc', rank: 5, unique: true, bonus: { mag: 6, mp: 12 }, resist: { fire: 0.85 }, price: 0, sell: 600, desc: 'イグニアが落とした、炎の色のイヤリング。魔力とMPが上がる。' },
  witch_ring: { name: '魔女の指輪', type: 'acc', rank: 5, unique: true, bonus: { mag: 12, mp: 20 }, resist: { fire: 0.8 }, price: 0, sell: 800, desc: 'イグニアがはめていた、炎の宝石の指輪。魔力とMPが大きく上がる。' },

  // ───── 素材 ─────
  ice_crystal: { name: '氷のかけら', type: 'mat', price: 0, sell: 22, desc: 'とけない氷のかけら。氷の装備の素材になる。' },
  flame_stone: { name: '炎の石', type: 'mat', price: 0, sell: 26, desc: '中で炎がゆれている石。鉱山でほり出される。' },
  star_iron: { name: '星の鉄', type: 'mat', price: 0, sell: 300, desc: '空から落ちてきた星のかけら。伝説の武器の素材になるという。' },
  white_snowball: { name: 'まっ白な雪玉', type: 'mat', price: 0, sell: 2, desc: 'ゆきだるまんが持っていた、まっ白な雪玉。とけない。' },

  // ───── だいじな もの ─────
  eternal_ice: { name: '万年氷', type: 'key', desc: '氷の洞窟のおくの、何万年もとけない氷。' },
  ice_charm: { name: '氷のお守り', type: 'key', desc: '万年氷から作ったお守り。持っていると、炎の山のあつい地面でもやけどしない。' },
  fire_star: { name: '炎の守り星', type: 'key', desc: '3つ目の守り星。温かな炎の力が、やどっている。' },
};

// 読みがな（あいうえお順の ならべかえ）
export const CH3_ITEM_KANA = {
  steel_sword: 'はがねのけん', steel_axe: 'はがねのおの', steel_dagger: 'はがねのないふ', steel_spear: 'はがねのやり', steel_claw: 'はがねのつめ',
  steel_whip: 'はがねのむち', steel_bat: 'はがねのばっと', snow_staff: 'ゆきのつえ', ice_fan: 'こおりのおうぎ',
  frost_blade: 'こおりのけん', hammer_axe: 'だいちのはんまー', obsidian_sword: 'こくようのけん', frost_lance: 'ひょうりゅうのやり', fire_claw: 'ほのおのつめ',
  meteor_sword: 'りゅうせいのけん', frost_robe: 'こおりのろーぶ', flame_axe: 'ほのおのおの',
  steel_mail: 'はがねのよろい', fur_coat: 'けがわのこーと', snow_robe: 'ゆきのろーぶ', snow_gi: 'せつげんのどうぎ', steel_shield: 'はがねのたて',
  steel_helm: 'はがねのかぶと', fur_hat: 'けがわのぼうし', frost_mail: 'こおりのよろい', fire_robe: 'ほのおのろーぶ', star_robe: 'ほしのろーぶ',
  ice_shield: 'こおりのたて', flame_shield: 'ほのおのたて', snow_hood: 'ゆきのずきん', sage_hat: 'ちえのぼうし',
  frost_ring: 'こおりのゆびわ', snow_charm: 'ゆきのおまもり', fox_bell: 'きつねのすず', bond_charm: 'きずなのおまもり',
  ice_fang_charm: 'こおりのきばのおまもり', flame_earring: 'ほのおのいやりんぐ', magma_bangle: 'ようがんのうでわ', flare_brooch: 'ほのおのぶろーち', courage_emblem: 'ゆうきのもんしょう', witch_ring: 'まじょのゆびわ',
  ice_crystal: 'こおりのかけら', flame_stone: 'ほのおのいし', star_iron: 'ほしのてつ', white_snowball: 'まっしろなゆきだま',
  eternal_ice: 'まんねんごおり', ice_charm: 'こおりのおまもり', fire_star: 'ほのおのまもりぼし',
};

// ものがたりで いっしょに たたかう ゲスト（shops.js の GUESTS に まぜる）
// 竜のみこユキナ: 氷の洞窟（長老の 話から ブリザマンモスまで）と、竜の門から 頂上まで いっしょに 行く
export const CH3_GUESTS = {
  yukina: { id: 'guest_yukina', name: 'ユキナ', job: 'priest', look: { body: 1, hair: 1, hairColor: 5, skin: 0, color: 4, style: 'hime', hcol: 'silver', tone: 'fair' }, tactics: 'heal', minLevel: 18 },
};

// ふしぎなかじの レシピ（forge.js で まぜる）。open: 作れるように なる フラグ
export const CH3_RECIPES = [
  { id: 'frost_robe', gold: 2200, mats: [['ice_crystal', 6], ['magic_powder', 3]], open: 'c3_kanatoko' },
  { id: 'flame_axe', gold: 2600, mats: [['flame_stone', 6], ['iron_shard', 6]], open: 'c3_mine' },
  { id: 'meteor_sword', gold: 4000, mats: [['star_iron', 1], ['silver_shard', 4], ['flame_stone', 3]], open: 'c3_kanatoko' },
];

// 第3章の お店
export const SHOPS_CH3 = {
  // 竜守りの村の よろず屋（なだれが どくと 鉱山の町から 品物が とどく）
  dragon_village: {
    name: '竜守りの村のよろず屋',
    kind: 'general',
    keeper: 'よろず屋のおじさん',
    hello: 'いらっしゃい。竜守りの村のよろず屋だ。\n雪山の旅には、温かい服が一番だよ。\n何にするかね？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'fur_coat', 'fur_hat'],
    more: [{
      show: { all: ['c3_mammoth'] },
      items: ['snow_staff', 'snow_robe', 'snow_gi', 'steel_dagger'],
      hello: 'いらっしゃい！なだれがどいて、カナトコから品物がとどいたよ。\n何にするかね？',
    }],
  },
  kanatoko_weapon: {
    name: 'カナトコの武器屋',
    kind: 'weapon',
    keeper: '武器屋のおやじ',
    hello: 'いらっしゃい…。\n鉱山を魔物に取られて、鉄がとどかねえんだ。\n今ある分だけで、すまねえな。',
    items: ['steel_dagger', 'steel_claw', 'steel_whip', 'snow_staff', 'ice_fan', 'gold_mic', 'kunai'],
    // 鉱山を 取りもどすと はがねの 品が そろう
    more: [{
      show: { all: ['c3_mine'] },
      items: ['steel_sword', 'steel_axe', 'steel_spear', 'steel_bat', 'steel_boomerang'],
      hello: 'へいらっしゃい！\n鉱山がもどって、ほりたての鉄ではがねの武器をきたえたぜ！\nどれにする？',
    }],
  },
  kanatoko_armor: {
    name: 'カナトコの防具屋',
    kind: 'armor',
    keeper: '防具屋のおにいさん',
    hello: 'いらっしゃい。\n雪山を行くなら、温かい防具を持っていきな。\nどうする？',
    items: ['fur_coat', 'snow_robe', 'snow_gi', 'fur_hat'],
    more: [{
      show: { all: ['c3_mine'] },
      items: ['steel_mail', 'steel_shield', 'steel_helm', 'gold_button', 'leopard_shirt', 'takecopter'],
      hello: 'いらっしゃい！\nはがねの防具が入ったよ。カナトコのはがねは、世界一さ！\nどうする？',
    }],
  },
  kanatoko_item: {
    name: 'カナトコの道具屋',
    kind: 'item',
    keeper: '道具屋のおかみ',
    hello: 'いらっしゃい！\n鉱山の町の道具屋だよ。\n何にするんだい？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'],
  },
  yunoha_item: {
    name: 'ユノハの道具屋',
    kind: 'item',
    keeper: '道具屋',
    hello: 'いらっしゃいませ。\n炎の山へ行くなら、薬草を多めにどうぞ。\nどんなご用で？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'],
  },
  yunoha_armor: {
    name: 'ユノハの防具屋',
    kind: 'armor',
    keeper: '防具屋',
    hello: 'いらっしゃいませ。\n温泉の里の防具屋です。\nどれになさいます？',
    items: ['fur_coat', 'snow_robe', 'snow_gi', 'steel_mail', 'steel_shield', 'steel_helm', 'fur_hat'],
  },
  // 星竜山の 山小屋の 旅の商人（少し 高い）
  mountain_hut: {
    name: '山小屋の旅の商人',
    kind: 'general',
    keeper: '旅の商人',
    hello: 'こんな所まで、ようこそ！\n山の上でも、品ぞろえはばっちりよ。\n何にする？',
    items: ['herb', 'moonherb', 'antidote', 'holy_water', 'return_wing', 'guide_thread', 'steel_sword', 'steel_spear', 'snow_staff', 'steel_mail', 'snow_robe', 'snow_gi', 'steel_shield'],
  },
};
