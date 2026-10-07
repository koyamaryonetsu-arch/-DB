// 第4章「砂の海にしずむ星」の 品物と お店（items.js・shops.js で まぜる）
// 装備の ランク6「魔法」は 王都サファラ（Step 3）、ランク7は 砂の港ドゥナ（Step 6）で ふえる
// ランク6の 店の 品は、ランク5（カナトコの はがねの 品）より 少し 強い（items.js の EQUIP_RANKS: 剣 50・服 27）
export const ITEMS_CH4 = {
  sand_cloak: {
    name: '砂よけのマント', type: 'acc', rank: 6, bonus: { def: 6 }, resist: { blind: 0.5 }, price: 2200,
    desc: '砂ばくの旅人がはおる、うすいマント。砂かけやマヌーサで、目をくらまされにくくなる。',
  },
  // よろい大サソリが 落とす（Step 2）
  scorpion_brooch: {
    name: 'サソリのブローチ', type: 'acc', rank: 6, unique: true, bonus: { def: 8, hp: 20 }, resist: { poison: 0 }, price: 0, sell: 700,
    desc: 'よろい大サソリのこうらで作られたブローチ。毒を受けなくなり、守りとHPが上がる。',
  },

  // ───── ランク6「魔法」: 王都サファラの 武器と防具の店（Step 3）─────
  shamshir: { name: 'シャムシール', type: 'weapon', rank: 6, cat: 'sword', atk: 50, price: 3600, desc: '三日月のようにそった、砂の国の剣。軽くて、よく切れる。' },
  battle_axe: { name: 'バトルアックス', type: 'weapon', rank: 6, cat: 'axe', atk: 57, bonus: { agi: -3 }, price: 3900, desc: '両がわに大きなはのついた、重いオノ。一撃が強い。' },
  jambiya: { name: 'ジャンビーヤ', type: 'weapon', rank: 6, cat: 'dagger', atk: 36, bonus: { agi: 5 }, price: 2700, desc: 'くの字にまがった、砂の国の短剣。素早くふるえる。' },
  sand_lance: { name: '砂竜のやり', type: 'weapon', rank: 6, cat: 'spear', atk: 46, price: 3400, desc: '砂竜のキバを先に付けた、長いやり。' },
  tiger_claw: { name: 'タイガークロー', type: 'weapon', rank: 6, cat: 'claw', atk: 45, bonus: { agi: 3 }, price: 3300, desc: '砂ばくのトラのツメのように、するどいツメ。' },
  snake_whip: { name: 'ヘビ皮のムチ', type: 'weapon', rank: 6, cat: 'whip', atk: 43, price: 3300, desc: '砂ばくの大ヘビの皮であんだ、長いムチ。' },
  oasis_staff: { name: 'オアシスのつえ', type: 'weapon', rank: 6, cat: 'staff', atk: 18, bonus: { mag: 22, heal: 12 }, price: 3200, desc: 'オアシスの水のような、青い玉がついたつえ。呪文の力が上がる。' },
  sandwind_fan: { name: '砂風のおうぎ', type: 'weapon', rank: 6, cat: 'fan', atk: 33, bonus: { agi: 8 }, price: 2900, desc: 'ふると、さらさらと砂の音がする、まいのおうぎ。' },
  crescent_boomerang: { name: '三日月のブーメラン', type: 'weapon', rank: 6, cat: 'boomerang', atk: 32, price: 3400, desc: '三日月の形をした、よく飛ぶブーメラン。' },
  palm_bat: { name: 'ヤシの木のバット', type: 'weapon', rank: 6, cat: 'bat', atk: 48, bonus: { agi: 2 }, price: 3300, desc: '大きなヤシの木からけずり出した、よくしなるバット。' },
  sand_mail: { name: '砂のよろい', type: 'armor', rank: 6, armorType: 'heavy', def: 46, bonus: { agi: -2 }, resist: { blind: 0.8 }, price: 3900, desc: '砂色の金属でできた、かたいよろい。砂かけに少し強い。' },
  desert_garb: { name: '砂の衣', type: 'armor', rank: 6, armorType: 'cloth', def: 27, resist: { blind: 0.8 }, price: 2800, desc: '砂ばくの旅人が着る、うすい衣。だれでも装備でき、砂かけに少し強い。' },
  moon_robe: { name: '月のローブ', type: 'armor', rank: 6, armorType: 'robe', def: 30, bonus: { mag: 7, heal: 6 }, price: 3200, desc: '月の光のように白いローブ。魔力が上がる。' },
  sandstorm_gi: { name: '砂嵐の道着', type: 'armor', rank: 6, armorType: 'gi', def: 33, bonus: { agi: 8 }, price: 3200, desc: '砂嵐の中でも動きやすい道着。' },
  crescent_shield: { name: '三日月のたて', type: 'shield', rank: 6, def: 27, price: 2900, desc: '三日月のかざりがついた、金属のたて。' },
  sand_helm: { name: '砂のかぶと', type: 'head', rank: 6, helm: true, def: 16, price: 2300, desc: '砂色の金属でできたかぶと。戦士などが装備できる。' },
  turban: { name: 'ターバン', type: 'head', rank: 6, def: 10, resist: { blind: 0.9 }, price: 1400, desc: '頭に長い布をまいた、砂の国のぼうし。だれでも装備できる。' },
  // ★: 宮殿の地下水路の 宝箱（店では 買えない）
  crescent_blade: {
    name: '三日月の剣', type: 'weapon', rank: 6, star: true, cat: 'sword', atk: 56, bonus: { agi: 3 }, price: 0, sell: 1600,
    desc: '宮殿の地下水路でねむっていた剣。三日月のように、するどくそっている。',
  },

  // ───── 王家のピラミッド（Step 4）─────
  // だいじなもの: 月の鏡（4階の 王のへや。Step 5 から 戦いの「道具」でも 使える。まぼろしの 分身が いる 戦いだけ。shared/battle-ch4.js）
  moon_mirror: {
    name: '月の鏡', type: 'key',
    desc: '王家に伝わる、本当のすがたをうつす鏡。月の光のように、青白く光っている。まぼろしも、まやかしも、この鏡の前では本当のすがたをあらわすという。',
  },
  // のろいの宝（4階の かくしべや）: とても 強いが、とると ピラミッドの 外に 出るまで 魔物が ふえる（world/pyramid.js）
  royal_gold_sword: {
    name: '王家の黄金の剣', type: 'weapon', rank: 7, star: true, cat: 'sword', atk: 64, price: 0, sell: 2400,
    desc: 'ピラミッドのかくしべやにねむっていた、のろいの宝。とても強い剣だが、ぬいた者のまわりに、ピラミッドの魔物がよってくるという。（のろいは、ピラミッドの外に出るととける）',
  },
  // ミイラの王アンクが 落とす（ボスの 品。1人 1つ）
  royal_bracelet: {
    name: '王家のうでわ', type: 'acc', rank: 6, unique: true, bonus: { def: 10, mag: 10 }, resist: { paralyze: 0.5, blind: 0.6 }, price: 0, sell: 900,
    desc: 'ミイラの王アンクが身につけていた、金のうでわ。守りと魔力が上がり、マヒとマヌーサにかかりにくくなる。',
  },

  // ───── 夜の 宮殿（Step 5）─────
  // だいじなもの: 女王の手紙（砂の海賊の かしらに とどける。Step 6）
  queen_letter: {
    name: '女王の手紙', type: 'key',
    desc: '女王ネフィが書いた、砂の海賊へのおわびの手紙。王家の印がおしてある。砂の港ドゥナの、海賊のかしらにとどけよう。',
  },
  // 大臣ザイード（1だんめ）が 落とす（ボスの 品）: 混乱しにくく なる 指輪（ザイードの あやしいささやき）
  mirage_ring: {
    name: 'まぼろしの指輪', type: 'acc', rank: 6, unique: true, bonus: { agi: 8, mag: 6 }, resist: { confuse: 0.5 }, price: 0, sell: 900,
    desc: '大臣ザイードが指にはめていた、むらさきの宝石の指輪。素早さと魔力が上がり、混乱しにくくなる。',
  },
  // 砂の魔神ザイードが 落とす（ボスの 品）。そうびした まま、戦いの「道具」から 1回の 戦いで 1回 使える
  // （みんなの MPを 少し 回復。shared/battle-ch4.js の equipUse）
  majin_lamp: {
    name: '魔神のランプ', type: 'acc', rank: 6, unique: true, bonus: { mag: 8, def: 6 }, resist: { blind: 0.7 }, price: 0, sell: 1000,
    equipUse: { base: [16, 24], msg: 'ランプから、青いけむりがふき出した…！\nみんなの体に、ふしぎな力がしみこんでいく！' },
    desc: '砂の魔神ザイードがのこした、古い金のランプ。装備していると、戦いの「道具」から使えて、みんなのMPを少し回復する（1回の戦いで1回）。魔力と守りも上がる。',
  },

  // ───── 砂の海賊と砂クジラ（Step 6）─────
  // だいじなもの: 船のかじ（砂の古城の 2階。バルガに わたすと すなかぜ号が 動く）
  ship_rudder: {
    name: '船のかじ', type: 'key',
    desc: '砂の船「すなかぜ号」のかじ。古城の魔物たちにぬすまれていた。ドゥナのかしらバルガにとどけよう。',
  },
  // 砂クジラが 落とす（ボスの 品。1人 1つ）: 砂しぶき（マヌーサ）と 毒に 強く、HPと 守りが 上がる
  whale_charm: {
    name: '砂クジラのお守り', type: 'acc', rank: 7, unique: true, bonus: { hp: 30, def: 10 }, resist: { blind: 0.5, poison: 0.6 }, price: 0, sell: 1200,
    desc: '正気にもどった砂クジラが、お礼にくれたお守り。砂の海の主の力が、やどっている。HPと守りが上がり、マヌーサと毒にかかりにくくなる。',
  },
};

// ものがたりで いっしょに たたかう ゲスト（第4章 Step 6〜7。story-ch4-duna.js が shops.js の GUESTS に まぜる）
// サラ: 砂の海賊の かしらバルガの むすめ（14さい）。ムチ使いの 海賊。ドゥナで バルガの 話の あと 仲間に なり、
// 砂の古城と 砂の海の 航海に ついてくる。look は 主人公の みため（render/hero.js）。gear … ゲストの 装備（party.js の makeNpcSupportChar）
export const CH4_GUESTS = {
  sara: {
    id: 'guest_sara', name: 'サラ', job: 'pirate', tactics: 'aggressive', minLevel: 30,
    look: { body: 1, hair: 3, hairColor: 1, skin: 1, color: 1, style: 'pony', hcol: 'darkbrown', tone: 'tan', face: 'sharp' },
    gear: { weapon: 'snake_whip', armor: 'desert_garb', shield: null, head: 'bandana' },
  },
};

export const CH4_ITEM_KANA = {
  sand_cloak: 'すなよけのまんと',
  scorpion_brooch: 'さそりのぶろーち',
  shamshir: 'しゃむしーる', battle_axe: 'ばとるあっくす', jambiya: 'じゃんびーや', sand_lance: 'すなりゅうのやり', tiger_claw: 'たいがーくろー',
  snake_whip: 'へびがわのむち', oasis_staff: 'おあしすのつえ', sandwind_fan: 'すなかぜのおうぎ', crescent_boomerang: 'みかづきのぶーめらん', palm_bat: 'やしのきのばっと',
  sand_mail: 'すなのよろい', desert_garb: 'すなのころも', moon_robe: 'つきのろーぶ', sandstorm_gi: 'すなあらしのどうぎ',
  crescent_shield: 'みかづきのたて', sand_helm: 'すなのかぶと', turban: 'たーばん', crescent_blade: 'みかづきのけん',
  moon_mirror: 'つきのかがみ', royal_gold_sword: 'おうけのおうごんのけん', royal_bracelet: 'おうけのうでわ',
  queen_letter: 'じょおうのてがみ', majin_lamp: 'まじんのらんぷ', mirage_ring: 'まぼろしのゆびわ',
  ship_rudder: 'ふねのかじ', whale_charm: 'すなくじらのおまもり',
};

export const SHOPS_CH4 = {
  // オアシスの村ハミルの よろず屋（水が へって、品物も 少ない）
  hamil: {
    name: 'ハミルのよろず屋',
    kind: 'general',
    keeper: 'よろず屋のおじさん',
    hello: 'いらっしゃい。水がへって、品物も少なくなっちまったが…\n砂ばくの旅のそなえなら、ここでそろうよ。',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'sand_cloak'],
  },
  // 王都サファラ（Step 3）: 武器と防具の店（ランク6）・市場の 道具屋の 屋台
  safara_weapon: {
    name: 'サファラの武器屋',
    kind: 'weapon',
    keeper: '武器屋のおやじ',
    hello: 'いらっしゃい！王都サファラの武器屋だ。\n砂の国の剣は、軽くてよく切れるぜ。\nどれにする？',
    items: ['shamshir', 'battle_axe', 'jambiya', 'sand_lance', 'tiger_claw', 'snake_whip', 'oasis_staff', 'sandwind_fan', 'crescent_boomerang', 'palm_bat', 'chef_knife'],
  },
  safara_armor: {
    name: 'サファラの防具屋',
    kind: 'armor',
    keeper: '防具屋のおねえさん',
    hello: 'いらっしゃいませ。\n砂ばくの旅には、砂に強い防具がおすすめよ。\nどれになさいます？',
    items: ['sand_mail', 'desert_garb', 'moon_robe', 'sandstorm_gi', 'crescent_shield', 'sand_helm', 'turban', 'sand_cloak'],
  },
  safara_item: {
    name: 'サファラ市場の道具屋',
    kind: 'item',
    keeper: '道具屋のおばさん',
    hello: 'いらっしゃい！市場の道具屋だよ。\n水はないけど、薬草ならあるよ。\n何にするんだい？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'],
  },
  // 砂の港ドゥナ（Step 6）: 港の 道具屋（砂の海の 旅の そなえ）。ランク7の 武器と 防具の 店は Step 7
  duna_item: {
    name: 'ドゥナの道具屋',
    kind: 'item',
    keeper: '道具屋のおやじ',
    hello: 'へい、らっしゃい！ドゥナの道具屋だ。\n砂の海へ出るなら、薬草はたっぷり持っていきな。\n何にする？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball', 'sand_cloak'],
  },
};
