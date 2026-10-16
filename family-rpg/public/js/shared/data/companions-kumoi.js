// 第5章 Step 3・4「クモイ地方」と「しずみゆく島の古い神殿」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-ch5.js と おなじ）:
// ・ふつうの 魔物は 1/12〜1/18・強い 魔物・めずらしい 魔物（雲の 中の 魔物）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（前ぶれ・土はこび など ガイアイーターの 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
export const FRIENDS_KUMOI = {
  cloud_sheep: {
    rate: 1 / 14, names: ['モコ', 'ワタグモ', 'メェメェ', 'ふわり'],
    growth: { hp: 1.15, mp: 0.6, str: 1.05, def: 1.2, agi: 0.75, mag: 0.7, heal: 0.65 },
    learn: [[1, 'm_tackle'], [4, 'rariho'], [9, 'm_wool_tackle'], [14, 'm_wool_puff'], [20, 'm_sleep_cloud']],
    note: '空の島の雲ひつじ。ねむり雲で敵をねむらせる。',
  },
  sky_ray: {
    rate: 1 / 16, names: ['エイタ', 'ヒラリ', 'スカイ', 'マンタ'],
    growth: { hp: 1.0, mp: 0.5, str: 1.15, def: 0.95, agi: 1.2, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_peck'], [4, 'm_ray_sting'], [9, 'm_ray_glide'], [14, 'piorimu'], [20, 'm_ray_wave']],
    gear: { weapons: [] },
    note: '雲の海をおよぐ空とびエイ。雷のしっぽでしびれさせる。',
  },
  thunder_puff: {
    rate: 1 / 16, names: ['ゴロ', 'ピカッ', 'ライ', 'もくもく'],
    growth: { hp: 0.85, mp: 1.25, str: 0.65, def: 0.85, agi: 1.15, mag: 1.4, heal: 0.75 },
    learn: [[1, 'bagi'], [4, 'm_thunder'], [8, 'm_puff_charge'], [13, 'm_puff_bolt'], [19, 'm_puff_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '小さな雷雲。雷の呪文がとくい。',
  },
  sky_serpent: {
    rate: 1 / 18, names: ['ウンカイ', 'ニョロ', 'クモオ', 'ながれ'],
    growth: { hp: 1.1, mp: 0.45, str: 1.25, def: 0.95, agi: 1.0, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_serpent_bind'], [9, 'kabau'], [14, 'm_serpent_breath'], [20, 'm_twin_slash']],
    note: '雲の海に住む長いへび。しめつけて動きをおそくする。',
  },
  stone_keeper: {
    rate: 1 / 18, names: ['イシモリ', 'ガンセキ', 'セキゾウ', 'マモル'],
    growth: { hp: 1.2, mp: 0.45, str: 1.3, def: 1.4, agi: 0.5, mag: 0.4, heal: 0.55 },
    learn: [[1, 'm_rock_throw'], [4, 'm_harden'], [9, 'kabau'], [14, 'm_keeper_stomp'], [20, 'm_keeper_wall']],
    note: '古い神殿の石の守り手。とてもかたい。',
  },
  rock_mole: {
    rate: 1 / 14, names: ['モグ', 'ドリル', 'ホリホリ', 'つちお'],
    growth: { hp: 1.05, mp: 0.5, str: 1.2, def: 1.15, agi: 0.95, mag: 0.45, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm_mole_dirt'], [9, 'm_mole_drill'], [14, 'm_harden'], [20, 'm_twin_slash']],
    note: '岩をほってすすむもぐら。回るツメでつっこむ。',
  },
  gaia_larva: {
    rate: 1 / 16, names: ['ムカデン', 'ツチクイ', 'ヒャクアシ', 'もぞもぞ'],
    growth: { hp: 1.1, mp: 0.5, str: 1.2, def: 1.0, agi: 1.05, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_larva_fang'], [9, 'm_larva_curl'], [14, 'piorimu'], [20, 'm_twin_slash']],
    note: '島の土を食べるムカデの子ども。毒のキバでかみつく。',
  },
  haniwa_soldier: {
    rate: 1 / 18, names: ['ハニワ', 'ハニオ', 'ドグウ', 'ぽっかり'],
    growth: { hp: 1.1, mp: 0.6, str: 1.15, def: 1.25, agi: 0.65, mag: 0.6, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm_haniwa_spear'], [9, 'sukara'], [14, 'm_haniwa_song'], [20, 'kabau']],
    gear: { weapons: ['spear', 'axe'] },
    note: '古代の土の人形の兵。ふしぎな歌で敵を混乱させる。',
  },
  cloud_wraith: {
    rate: 1 / 22, names: ['クモユウ', 'ミスト', 'ふわゆう', 'ヒエビエ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.75, def: 0.9, agi: 1.15, mag: 1.3, heal: 0.6 },
    learn: [[1, 'hyado'], [4, 'manusa'], [9, 'm_wraith_chill'], [14, 'm_wraith_mist'], [20, 'hyadaruko']],
    gear: { weapons: ['dagger'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '雲の中をただようゆうれい。めったに仲間にならない。',
  },
  cloud_wyvern: {
    rate: 1 / 24, names: ['ライウン', 'ワイバ', 'イカヅチ', 'ソラキバ'],
    growth: { hp: 1.1, mp: 0.45, str: 1.2, def: 1.05, agi: 1.05, mag: 0.5, heal: 0.45 },
    learn: [[1, 'm_bite'], [4, 'm_wyvern_tail'], [9, 'm_wyvern_dive'], [14, 'piorimu'], [20, 'm_wyvern_thunder']],
    note: '雷雲の中をとぶ竜。めったに仲間にならない、強い仲間。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_KUMOI)) f.noFamily = true;
