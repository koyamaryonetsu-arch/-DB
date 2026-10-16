// 第5章 Step 3・4「クモイ地方（雲の上の島々）」と「しずみゆく島の古い神殿」の 魔物と、島を むしばむ 大ムカデ ガイアイーター（B: 戦い）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-kumoi-art.js。たたかいの しかけ（多部位の 戦い）は shared/battle-gaia.js
//
// 出現表（encounters-kumoi.js）: t5_kumoi＝クモイ地方の 島 / t5_ruin_up＝神殿 1〜3階 / t5_ruin_low＝4〜7階 / t5_ruin_cloud＝雲が 入った 所（強い・経験値と お金が 多い）
// おすすめ Lv44〜45（第26回で 経験値を ×0.6 に した ことを 考えて 合わせた。docs/plan-ch5.md の「13」）
// region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（data/rare-loot.js の regionOf）
//
// ・ガイアイーター（gaia_eater）: 島の 土を 食べる 大ムカデ。ばらばらの 体（部位）を 順に たおす 多部位の 戦い。
//   部位の ID … gaia_tail（しっぽ）・gaia_body（体）・gaia_eater（頭。この 戦いの 本体）。きまった 戦いには 左から しっぽ・体・頭 の じゅんに ならぶ。
//   しっぽ … 体に 土を はこんで 体と 頭の キズを ふさぐ（土はこび）・毒ばり・前ぶれの ある「毒ばりの雨」。炎に 弱い
//   体     … かたい こうらで ふつうの ダメージは 半分（合体技・爆発は そのまま）。生きている 間は 頭を まもる（頭への ダメージが へる）。
//            土を 食べて 回復・前ぶれの ある「大地ゆるがし」（みんな）。爆発に 弱い
//   頭     … いちばん 強い 攻撃。前ぶれの ある「大地のみこみ」（みんなに とても 大きい。身を 守ると 半分）。HPが へると あばれる。氷に 弱い。
//            頭を たおすと、のこりの 体も くずれおちる（勝ち）
//   部位は 図鑑・魔物の 数・配合の 一覧に 出ない（数えない 形で MONSTERS に 入れる。addGaiaParts。色ちがいと おなじ）

// ボスの じょうたい いじょうの 効きにくさ（第3章・第4章・アルゴスと おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
// 部位の 名前の はじめ（ガイアイーターの頭 など。battle-gaia.js）
export const GAIA = 'gaia_eater';
export const GAIA_BODY = 'gaia_body';
export const GAIA_TAIL = 'gaia_tail';

export const MONSTERS_KUMOI = {
  // ── クモイ地方（雲の上の 島々）──
  // 雲ひつじ: 雲の 毛の ひつじ。ねむり雲で ねむらせる。風で ふきとびやすい
  cloud_sheep: {
    name: '雲ひつじ', lv: 43, hp: 620, mp: 60, str: 152, def: 132, agi: 50, mag: 96, exp: 560, gold: 240,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { wind: 1.35, bolt: 1.15, ice: 0.7, poison: 0.5, sleep: 0.2, confuse: 0.6 }, drops: { common: ['moonherb', 8], rare: ['seed_hp', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_wool_tackle' }, { w: 2, id: 'm_sleep_cloud', cond: 'notRecent:m_sleep_cloud' }, { w: 1, id: 'm_wool_puff', cond: 'notRecent:m_wool_puff' }],
    desc: '雲の毛がもこもこの、空の島のひつじ。ねむり雲で旅人をねむらせる。風がよく効き、ふきとばされやすい。',
  },
  // 空とびエイ: 雲の 中を およぐ 大きな エイ。雷の しっぽで しびれさせる
  sky_ray: {
    name: '空とびエイ', lv: 44, hp: 660, mp: 80, str: 168, def: 112, agi: 82, mag: 112, exp: 600, gold: 260,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { bolt: 0.5, ice: 1.3, wind: 0.8, poison: 0.6, sleep: 0.4, confuse: 0.5 }, drops: { common: ['herb', 5], rare: ['seed_agi', 44] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ray_glide' }, { w: 2, id: 'm_ray_sting' }, { w: 1, id: 'm_ray_wave', cond: 'notRecent:m_ray_wave' }],
    desc: '雲の海を、鳥のようにすいすいおよぐ大きなエイ。しっぽの雷でしびれさせる。氷がよく効き、雷は効きにくい。',
  },
  // かみなりぐも: ゴロゴロ 鳴る 小さな 雷雲。雷の 呪文
  thunder_puff: {
    name: 'かみなりぐも', lv: 44, hp: 480, mp: 160, str: 104, def: 92, agi: 72, mag: 152, exp: 580, gold: 260,
    race: 'spirit', size: 's', flying: true, region: 6,
    resist: { bolt: 0, wind: 1.4, ice: 1.1, fire: 0.8, poison: 0, sleep: 0.4, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 44] },
    actions: [{ w: 3, id: 'm_puff_bolt' }, { w: 2, id: 'm_puff_rain', cond: 'notRecent:m_puff_rain' }, { w: 1, id: 'm_puff_charge', cond: 'notRecent:m_puff_charge' }, { w: 1, id: 'attack' }],
    desc: 'ゴロゴロと鳴る、小さな雷雲。いなずまをおとしてくる。風がよく効き、雷はまったく効かない。',
  },
  // 雲海へび: 雲の 海に すむ 長い へび。しめつけて 素早さを 下げる
  sky_serpent: {
    name: '雲海へび', lv: 45, hp: 780, mp: 90, str: 178, def: 122, agi: 72, mag: 122, exp: 640, gold: 300,
    race: 'dragon', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { wind: 0.5, ice: 1.3, blast: 1.1, poison: 0.5, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 12], rare: ['seed_str', 44] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_serpent_bind' }, { w: 2, id: 'm_serpent_breath', cond: 'notRecent:m_serpent_breath' }, { w: 2, id: 'm_bite' }],
    desc: '雲の海の中を長い体でおよぐへび。体でしめつけて、動きをおそくする。氷がよく効く。',
  },

  // ── しずみゆく島の 古い神殿（1〜3階）──
  // 石の守り手: 神殿を 守る 古い 石の 像。足ぶみで みんなを ゆらす
  stone_keeper: {
    name: '石の守り手', lv: 44, hp: 820, mp: 20, str: 172, def: 180, agi: 36, mag: 40, exp: 660, gold: 280,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { blast: 1.3, bolt: 0.85, ice: 0.8, fire: 0.7, poison: 0, sleep: 0, confuse: 0.2, blind: 0.5 }, drops: { common: ['moonherb', 8], rare: ['seed_def', 40] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_keeper_stomp', cond: 'notRecent:m_keeper_stomp' }, { w: 1, id: 'm_keeper_wall', cond: 'notRecent:m_keeper_wall' }],
    desc: 'しずみゆく島の古い神殿を、ずっと守ってきた石の像。足ぶみで島ごとゆらす。とてもかたいが、爆発がよく効く。',
  },
  // 岩もぐら: 岩を ほって すすむ もぐら。土を かけて 目を くらませる
  rock_mole: {
    name: '岩もぐら', lv: 43, hp: 580, mp: 30, str: 158, def: 140, agi: 66, mag: 60, exp: 560, gold: 250,
    race: 'beast', size: 's', hit: 'slash', region: 6,
    resist: { ice: 1.3, bolt: 1.2, blast: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['herb', 5], rare: ['seed_str', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_mole_drill' }, { w: 2, id: 'm_mole_dirt', cond: 'notRecent:m_mole_dirt' }],
    desc: '大きなツメで岩をほってすすむもぐら。土をかけて目をくらませる。氷がよく効く。',
  },

  // ── しずみゆく島の 古い神殿（4〜7階）──
  // つちくいムカデ: ガイアイーターの 子ども。毒の キバ
  gaia_larva: {
    name: 'つちくいムカデ', lv: 45, hp: 660, mp: 30, str: 172, def: 132, agi: 78, mag: 60, exp: 640, gold: 280,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.3, ice: 1.1, poison: 0, sleep: 0.4, confuse: 0.5 }, drops: { common: ['antidote', 6], rare: ['seed_hp', 44] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_larva_fang' }, { w: 1, id: 'm_larva_curl', cond: 'notRecent:m_larva_curl' }],
    desc: '島の土を食べて大きくなる、ムカデの子ども。毒のキバでかみつく。炎がよく効く。',
  },
  // はにわ兵: 古代の 土の 人形の 兵。ふしぎな 歌で 混乱させる
  haniwa_soldier: {
    name: 'はにわ兵', lv: 45, hp: 720, mp: 80, str: 166, def: 150, agi: 50, mag: 124, exp: 660, gold: 290,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { ice: 1.3, blast: 1.2, fire: 0.6, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['jou_herb', 12], rare: ['seed_def', 44] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_haniwa_spear' }, { w: 1, id: 'm_haniwa_song', cond: 'notRecent:m_haniwa_song' }],
    desc: '古い神殿を守る、土の人形の兵。ふしぎな歌を聞くと、頭がぼーっとする。氷がよく効く。',
  },

  // ── 雲が 入った 所（強い。経験値と お金が 多い）──
  // 雲間のゆうれい: 雲の 中に ただよう ゆうれい。きりで 目を くらませ、つめたい 手で ふれる
  cloud_wraith: {
    name: '雲間のゆうれい', lv: 46, hp: 880, mp: 180, str: 160, def: 116, agi: 84, mag: 176, exp: 1000, gold: 420,
    race: 'undead', size: 'm', flying: true, region: 6,
    resist: { light: 1.4, dark: 0.3, ice: 0.6, poison: 0, sleep: 0, confuse: 0.5 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 40] },
    actions: [{ w: 3, id: 'm_wraith_chill' }, { w: 2, id: 'm_wraith_mist', cond: 'notRecent:m_wraith_mist' }, { w: 1, id: 'mahoton', cond: 'notRecent:mahoton' }, { w: 2, id: 'attack' }],
    desc: '神殿にしずみこんだ雲の中を、ふわふわただようゆうれい。きりで目をくらませ、つめたい手でふれてくる。光がよく効く。',
  },
  // 雷雲ワイバーン: 雲の 中を とぶ つばさの 竜。いかずちの いき
  cloud_wyvern: {
    name: '雷雲ワイバーン', lv: 47, hp: 1080, mp: 100, str: 216, def: 142, agi: 86, mag: 142, exp: 1100, gold: 460,
    race: 'dragon', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { bolt: 0.3, wind: 0.6, ice: 1.3, poison: 0.5, sleep: 0.3, confuse: 0.4 }, drops: { common: ['jou_herb', 8], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_wyvern_dive' }, { w: 2, id: 'm_wyvern_thunder', cond: 'notRecent:m_wyvern_thunder' }, { w: 2, id: 'm_wyvern_tail' }],
    desc: '雷雲の中をとぶ、つばさの竜。いかずちのいきをはく。雲の中でしか会えない、強い竜。氷がよく効く。',
  },

  // ── ボス（神殿の いちばん下）: ガイアイーターの 頭（この 戦いの 本体。図鑑・台本の showMon('gaia_eater') は 体ぜんぶの え）──
  gaia_eater: {
    name: 'ガイアイーター', lv: 46, hp: 10000, mp: 300, str: 420, def: 140, agi: 64, mag: 140, exp: 9000, gold: 3600,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.62, hit: 'bite', drops: { boss: ['gaia_fang_charm'] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, ice: 1.3, fire: 0.85, poison: 0 },
    // 頭を たおすと、のこりの 部位も くずれおちる（battle.js の minionsFall）
    minionsFall: [GAIA_BODY, GAIA_TAIL], fallMsg: 'のこりの体も、ばらばらにくずれおちた！',
    // 多部位の 戦い（battle-gaia.js）: guard … 体が 生きている 間の 頭への ダメージの 倍率
    gaia: { part: 'head', guard: 0.85 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_gaia_bite' }, { w: 3, id: 'm_gaia_dust', cond: 'notRecent:m_gaia_dust' },
      { w: 2, id: 'm_gaia_maw', cond: ['notRecent:m_gaia_maw', 'notRecent:m_gaia_devour'] },
    ],
    phases: [
      { hpBelow: 0.4, msg: ['ガイアイーターの頭が、大きくあばれ始めた！', 'ガイアイーターの頭の攻撃力が上がった！'], buff: { atk: 1.2 } },
    ],
    desc: 'しずみゆく島の土を食べて、島をむしばむ大ムカデ。体は、頭・体・しっぽに分かれて動く。しっぽは体に土をはこび、かたい体は頭を守っている。しっぽ→体→頭の順にたおそう。前ぶれのあとの大技は、身を守ろう。',
  },
};

// ガイアイーターの 部位（数えない 形で MONSTERS に 入れる。addGaiaParts）。頭は 上の gaia_eater
export const GAIA_PARTS = {
  // 体: かたい こうら（ふつうの ダメージは 半分。合体技・爆発は そのまま）。生きている 間は 頭を まもる
  [GAIA_BODY]: {
    name: 'ガイアイーターの体', lv: 46, hp: 7000, mp: 200, str: 350, def: 200, agi: 40, mag: 120, exp: 6000, gold: 2400,
    race: 'beast', size: 'xl', boss: true, turns: 1, speed: 0.66, hit: 'slash', part: GAIA, noBefriend: true,
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, blast: 1.3, bolt: 1.1, fire: 0.85, ice: 0.9, poison: 0 },
    gaia: { part: 'body', shell: 0.6 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_gaia_coil' }, { w: 2, id: 'm_gaia_eat', cond: ['c5:gaiaHurt', 'notRecent:m_gaia_eat'] },
      { w: 2, id: 'm_gaia_rumble', cond: ['notRecent:m_gaia_rumble', 'notRecent:m_gaia_quake'] },
    ],
    desc: 'ガイアイーターの、かたいこうらの体。生きている間は、頭を守っている。',
  },
  // しっぽ: 体に 土を はこぶ（体と 頭の 回復）・毒ばり・前ぶれの ある 毒ばりの雨
  [GAIA_TAIL]: {
    name: 'ガイアイーターのしっぽ', lv: 46, hp: 4400, mp: 200, str: 330, def: 120, agi: 78, mag: 120, exp: 4000, gold: 1500,
    race: 'beast', size: 'xl', boss: true, turns: 1, speed: 0.82, hit: 'slash', part: GAIA, noBefriend: true,
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, fire: 1.3, ice: 0.9, poison: 0 },
    gaia: { part: 'tail', feed: 0.05 },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm_gaia_sting' }, { w: 3, id: 'm_gaia_feed', cond: ['c5:gaiaFeed', 'notRecent:m_gaia_feed'] },
      { w: 2, id: 'm_gaia_needle_charge', cond: ['notRecent:m_gaia_needle_charge', 'notRecent:m_gaia_needles'] },
    ],
    desc: 'ガイアイーターの、毒ばりのあるしっぽ。島の土をかき集めて、体にはこんでいる。',
  },
};

// 部位を MONSTERS に 入れる（数えない 形。Object.keys には 出ない。monsters.js が よぶ）
export function addGaiaParts(table) {
  for (const [id, m] of Object.entries(GAIA_PARTS)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: m, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。雲の わた（雲の 魔物）・大地の かけら（神殿の 土と 岩の 魔物）
export const KUMOI_MAT_DROPS = {
  cloud_sheep: ['cloud_cotton', 3],
  sky_ray: ['cloud_cotton', 5],
  thunder_puff: ['cloud_cotton', 4],
  sky_serpent: ['dragon_scale', 6],
  stone_keeper: ['land_shard', 4],
  rock_mole: ['land_shard', 3],
  gaia_larva: ['land_shard', 4],
  haniwa_soldier: ['land_shard', 3],
  cloud_wraith: ['cloud_cotton', 3],
  cloud_wyvern: ['dragon_scale', 4],
};
