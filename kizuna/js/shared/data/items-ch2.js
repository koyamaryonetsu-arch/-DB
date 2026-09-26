// 第2章の どうぐ・そうび（items.js で まぜる）
export const ITEMS_CH2 = {
  // ── ぶき（カモメ港で 売っている）──
  silver_sword: { name: '銀の剣', type: 'weapon', cat: 'sword', atk: 30, price: 1150, desc: '銀でつくった、よく切れる剣。' },
  pirate_axe: { name: '海賊のオノ', type: 'weapon', cat: 'axe', atk: 35, bonus: { agi: -3 }, price: 1250, desc: '海賊が使っていた大きなオノ。重いがとても強い。' },
  silver_dagger: { name: '銀のナイフ', type: 'weapon', cat: 'dagger', atk: 21, bonus: { agi: 3 }, price: 820, desc: '軽くてするどい銀のナイフ。' },
  coral_spear: { name: 'サンゴのやり', type: 'weapon', cat: 'spear', atk: 28, price: 1050, desc: 'サンゴの先をとがらせた、じょうぶなやり。' },
  shark_fang: { name: 'サメのキバ', type: 'weapon', cat: 'claw', atk: 27, bonus: { agi: 3 }, price: 1000, desc: 'サメのキバでつくったツメ。' },
  wave_staff: { name: '波のつえ', type: 'weapon', cat: 'staff', atk: 12, bonus: { mag: 14, heal: 6 }, price: 980, desc: '海の力がやどるつえ。呪文の力が上がる。' },
  sea_fan: { name: '海風のおうぎ', type: 'weapon', cat: 'fan', atk: 20, bonus: { agi: 6 }, price: 900, desc: '海風のようにかろやかにまうおうぎ。' },
  chain_whip: { name: 'くさりのムチ', type: 'weapon', cat: 'whip', atk: 26, price: 1000, desc: '鉄のくさりでできたムチ。' },
  // 宝箱の ぶき
  storm_whip: { name: '嵐のムチ', type: 'weapon', cat: 'whip', atk: 34, bonus: { agi: 4 }, price: 0, sell: 800, desc: '嵐の力をひめたムチ。' },
  thunder_sword: { name: '雷の剣', type: 'weapon', cat: 'sword', atk: 38, bonus: { mag: 4 }, price: 0, sell: 1000, desc: '雷の力がやどる剣。ふると空気がビリビリする。' },
  // ── よろい ──
  silver_mail: { name: '銀のよろい', type: 'armor', armorType: 'heavy', def: 30, bonus: { agi: -2 }, price: 1350, desc: 'かがやく銀のよろい。' },
  sailor_clothes: { name: '船乗りの服', type: 'armor', armorType: 'cloth', def: 17, bonus: { agi: 3 }, price: 720, desc: '動きやすい船乗りの服。だれでも装備できる。' },
  coral_robe: { name: 'サンゴのローブ', type: 'armor', armorType: 'robe', def: 18, bonus: { mag: 4, heal: 4 }, price: 920, desc: 'サンゴの色にそめたローブ。魔力が上がる。' },
  wave_gi: { name: '波の道着', type: 'armor', armorType: 'gi', def: 21, bonus: { agi: 5 }, price: 960, desc: '波のもようの道着。すばやく動ける。' },
  // ── たて・かぶと ──
  silver_shield: { name: '銀のたて', type: 'shield', def: 17, price: 900, desc: '銀のたて。' },
  shell_shield: { name: '貝のたて', type: 'shield', def: 14, resist: { ice: 0.8 }, price: 650, desc: '大きな貝がらのたて。こおりに強い。' },
  silver_helm: { name: '銀のかぶと', type: 'head', helm: true, def: 10, price: 720, desc: '銀のかぶと。戦士などが装備できる。' },
  captain_hat: { name: '船長のぼうし', type: 'head', def: 6, bonus: { agi: 2 }, price: 520, desc: 'りっぱな船長のぼうし。だれでも装備できる。' },
  // ── アクセサリー（宝箱）──
  wind_ring: { name: '風の指輪', type: 'acc', bonus: { agi: 14 }, price: 0, sell: 400, desc: '素早さが14上がる。風のように動ける。' },
  sea_charm: { name: '海のお守り', type: 'acc', bonus: { hp: 20 }, resist: { blind: 0.5, paralyze: 0.5 }, price: 0, sell: 300, desc: 'まぼろしとマヒにかかりにくくなるお守り。' },
  // ── だいじな もの ──
  light_orb: { name: '光の玉', type: 'key', desc: '灯台の火。嵐の海の中に、安全な道をてらしだす。' },
  wind_star: { name: '風の守り星', type: 'key', desc: '2つ目の守り星。やさしい風がふいている。' },
  bottle_letter: { name: 'びんの手紙', type: 'key', desc: '小島の宝箱に入っていた手紙。「カモメ港のミナへ」と書いてある。' },
};

// カモメ港の お店
export const SHOPS_CH2 = {
  port_arms: {
    name: 'カモメ港の武器と防具の店',
    kind: 'arms',
    keeper: '店のおやじ',
    hello: 'いらっしゃい！海の男のための、\nじょうぶな武器と防具がそろってるよ！\n今日はどうする？',
    items: ['silver_sword', 'pirate_axe', 'silver_dagger', 'coral_spear', 'shark_fang', 'wave_staff', 'sea_fan', 'chain_whip',
      'silver_mail', 'sailor_clothes', 'coral_robe', 'wave_gi', 'silver_shield', 'shell_shield', 'silver_helm', 'captain_hat'],
  },
  port_item: {
    name: 'カモメ港の道具屋',
    kind: 'item',
    keeper: '道具屋のおねえさん',
    hello: 'いらっしゃいませ！\n船旅には、薬草をたくさん持っていってね。\nどんなご用？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'smoke_ball'],
  },
};
