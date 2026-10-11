// 第4章クリアの あとの より道「古代の大迷宮」と たのまれごとの 品（items.js で まぜる）
// ・大迷宮の 宝箱: ランク7〜8の ★の 装備（店では 買えない）。深い 階ほど 強い
// ・古竜オルドラが 落とす アクセサリー（ボスは かならず 1人 1つ）
// ・たのまれごとの ごほうび（★の 装備）と だいじなもの
export const ITEMS_LAB = {
  // ───── 大迷宮の 宝箱（ランク7〜8・★）─────
  sand_king_helm: {
    name: '砂の王のかぶと', type: 'head', rank: 7, star: true, helm: true, def: 24, bonus: { hp: 10 }, resist: { blind: 0.8 }, price: 0, sell: 1800,
    desc: '古代都市の王の兵がかぶっていた、金色のかぶと。戦士などが装備できる。',
  },
  ancient_robe: {
    name: '古代のローブ', type: 'armor', rank: 7, star: true, armorType: 'robe', def: 41, bonus: { mag: 12, heal: 10 }, price: 0, sell: 2200,
    desc: '古代都市の神官が着ていたローブ。金の糸で、星のもようがぬいこまれている。魔力が大きく上がる。',
  },
  ancient_blade: {
    name: '古代王の剣', type: 'weapon', rank: 7, star: true, cat: 'sword', atk: 68, bonus: { agi: 3 }, price: 0, sell: 2600,
    desc: '古代都市の王がこしにさげていた剣。何千年たっても、さびひとつない。',
  },
  sphinx_mail: {
    name: 'スフィンクスのよろい', type: 'armor', rank: 8, star: true, armorType: 'heavy', def: 64, bonus: { hp: 15 }, resist: { confuse: 0.8 }, price: 0, sell: 3200,
    desc: 'スフィンクスの宝物庫にねむっていた、金と青のよろい。とてもかたく、混乱しにくくなる。',
  },
  sphinx_fan: {
    name: 'スフィンクスのおうぎ', type: 'weapon', rank: 8, star: true, cat: 'fan', atk: 50, bonus: { agi: 12, mag: 6 }, price: 0, sell: 2800,
    desc: 'スフィンクスの宝物庫にねむっていた、金のおうぎ。ふると、砂の風がおこる。',
  },
  night_claw: {
    name: 'やみよのツメ', type: 'weapon', rank: 8, star: true, cat: 'claw', atk: 66, bonus: { agi: 6 }, price: 0, sell: 2800,
    desc: 'くらやみの通路で光っていた、黒いツメ。やみの中でも、まよわずに敵をとらえる。',
  },
  ancient_star_staff: {
    name: '古代の星のつえ', type: 'weapon', rank: 8, star: true, cat: 'staff', atk: 26, bonus: { mag: 34, heal: 18 }, price: 0, sell: 2800,
    desc: '古代都市の星読みが使っていたつえ。先の星が、ほのかに光る。呪文の力がとても上がる。',
  },
  dragon_helm: {
    name: '竜のかぶと', type: 'head', rank: 8, star: true, helm: true, def: 28, bonus: { hp: 15 }, resist: { fire: 0.85 }, price: 0, sell: 2600,
    desc: '竜のつのをかたどった、古代の番兵のかぶと。炎に少し強い。戦士などが装備できる。',
  },
  guardian_shield: {
    name: '番兵のたて', type: 'shield', rank: 8, star: true, def: 40, bonus: { hp: 10 }, price: 0, sell: 2600,
    desc: '古竜を守る番兵が持っていた、大きなたて。竜の顔がきざまれている。',
  },

  // ───── 古竜オルドラが 落とす（ボスの 品。1人 1つ）─────
  old_dragon_eye: {
    name: '古竜の目', type: 'acc', rank: 8, unique: true, bonus: { atk: 8, mag: 8, hp: 30 }, resist: { fire: 0.7, sleep: 0.5 }, price: 0, sell: 2000,
    desc: 'ねむれる古竜オルドラが、力をみとめた者にのこす、こはく色の宝石。力と魔力とHPが上がり、炎とねむりに強くなる。',
  },

  // ───── たのまれごとの ごほうび（★）─────
  star_reader_hat: {
    name: '星読みのぼうし', type: 'head', rank: 7, star: true, def: 16, bonus: { mag: 8, agi: 4 }, price: 0, sell: 1500,
    desc: '星読みのナジュムがくれた、星のもようのとんがりぼうし。だれでも装備でき、魔力と素早さが上がる。',
  },
  ironwood_shield: {
    name: 'てつぼくのたて', type: 'shield', rank: 7, star: true, def: 36, resist: { fire: 0.9 }, price: 0, sell: 1600,
    desc: '古代の鉄木で、船大工のドックが作ったたて。鉄のようにかたく、軽い。',
  },
  whirl_clothes: {
    name: 'うずしおの服', type: 'armor', rank: 7, star: true, armorType: 'cloth', def: 37, bonus: { agi: 6 }, resist: { ice: 0.9 }, price: 0, sell: 1600,
    desc: '大ダコをしずめたお礼に、漁師のカイがくれた服。うずしおのもようで、だれでも装備できる。',
  },
  earth_charm: {
    name: '大地のお守り', type: 'acc', rank: 7, star: true, bonus: { def: 10, hp: 25 }, resist: { paralyze: 0.6 }, price: 0, sell: 1400,
    desc: 'はぐれゴーレムの体から出てきた、大地の色の石のお守り。守りとHPが上がり、マヒしにくくなる。',
  },
  ancient_bangle: {
    name: '古代王のうでわ', type: 'acc', rank: 8, star: true, bonus: { atk: 6, def: 6, mag: 6, agi: 6 }, price: 0, sell: 2000,
    desc: '古代都市の王のうでわ。学者ハサンが、石板の写しのお礼にくれた。力・守り・魔力・素早さが少しずつ上がる。',
  },
  scale_sword: {
    name: '竜うろこの剣', type: 'weapon', rank: 8, star: true, cat: 'sword', atk: 76, bonus: { def: 4 }, price: 0, sell: 3000,
    desc: 'かじ屋のテツジイが、古竜のうろこをきたえて作った剣。竜のうろこのように、青白く光る。',
  },
  scale_staff: {
    name: '竜うろこのつえ', type: 'weapon', rank: 8, star: true, cat: 'staff', atk: 28, bonus: { mag: 36, heal: 18 }, price: 0, sell: 3000,
    desc: 'かじ屋のテツジイが、古竜のうろこをきたえて作ったつえ。呪文の力がとても上がる。',
  },
  scale_claw: {
    name: '竜うろこのツメ', type: 'weapon', rank: 8, star: true, cat: 'claw', atk: 70, bonus: { agi: 6 }, price: 0, sell: 3000,
    desc: 'かじ屋のテツジイが、古竜のうろこをきたえて作ったツメ。',
  },

  // ───── だいじなもの（たのまれごと）─────
  tablet_copy: { name: '石板の写し', type: 'key', desc: '古竜のねどこの石板を、紙に写したもの。学者ハサンにとどけよう。' },
  old_dragon_scale: { name: '古竜のうろこ', type: 'key', desc: '古竜オルドラがくれた、大きなうろこ。カナトコのかじ屋のテツジイなら、何か作れるかもしれない。' },
  ancient_ironwood: { name: '古代の鉄木', type: 'key', desc: '大迷宮の地下4階で見つけた、鉄のようにかたい木。ドゥナの船大工のドックにとどけよう。' },
  lumina_seeds: { name: 'ルミナの花の種', type: 'key', desc: 'ルミナの町の花屋ポーラにあずかった、花の種。温泉の里ユノハの湯守りのおばばにとどけよう。' },
  onsen_manju: { name: '温泉まんじゅう', type: 'key', desc: '湯守りのおばばが、ポーラへのお礼にくれたおまんじゅう。まだ、ほかほかだ。' },
  daigo_compass: { name: 'ダイゴのコンパス', type: 'key', desc: '宝探しのダイゴが、大迷宮でなくしたコンパス。地下6階のダイゴにとどけよう。' },
};

export const LAB_ITEM_KANA = {
  sand_king_helm: 'すなのおうのかぶと', ancient_robe: 'こだいのろーぶ', ancient_blade: 'こだいおうのけん', sphinx_mail: 'すふぃんくすのよろい',
  sphinx_fan: 'すふぃんくすのおうぎ', night_claw: 'やみよのつめ', ancient_star_staff: 'こだいのほしのつえ', dragon_helm: 'りゅうのかぶと',
  guardian_shield: 'ばんぺいのたて', old_dragon_eye: 'こりゅうのめ', star_reader_hat: 'ほしよみのぼうし', ironwood_shield: 'てつぼくのたて',
  whirl_clothes: 'うずしおのふく', earth_charm: 'だいちのおまもり', ancient_bangle: 'こだいおうのうでわ', scale_sword: 'りゅううろこのけん',
  scale_staff: 'りゅううろこのつえ', scale_claw: 'りゅううろこのつめ', tablet_copy: 'せきばんのうつし', old_dragon_scale: 'こりゅうのうろこ',
  ancient_ironwood: 'こだいのてつぼく', lumina_seeds: 'るみなのはなのたね', onsen_manju: 'おんせんまんじゅう', daigo_compass: 'だいごのこんぱす',
};
