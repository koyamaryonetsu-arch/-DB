// 夜の データ（夜の 魔物・夜の 出現表・夜の 店・夜の 人の だいほん）
// monsters.js / encounters.js / items.js / shops.js / story.js が まぜる。
// 夜の 人の いちは maps/night-npcs.js
//
// 夜（clock.js の isNightFrac）の フィールドでは、昼の 魔物の かわりに 夜の 出現表の 魔物が うろうろする。
// 夜の 魔物は すこし 強いが、経験値と ゴールドが 多い。どうくつ・塔の 中は 昼も 夜も おなじ

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───────────── 夜の 魔物 ─────────────
export const NIGHT_MONSTERS = {
  moon_pururin: {
    name: '月夜ぷるりん', lv: 3, hp: 16, mp: 10, str: 13, def: 6, agi: 10, mag: 10, exp: 6, gold: 8,
    race: 'slime', size: 's', night: true, resist: { bolt: 1.3, dark: 0.7, light: 1.3 }, drops: { common: ['moon_drop', 16], rare: ['seed_mag', 96] },
    actions: [{ w: 4, id: 'attack' }, { w: 1, id: 'm_sleep_powder' }],
    desc: '月の光をあびて、うすむらさきにかがやくぷるりん。夜にだけあらわれる。',
  },
  night_owl: {
    name: '夜ふかしフクロウ', lv: 5, hp: 30, mp: 12, str: 24, def: 11, agi: 24, exp: 15, gold: 14,
    race: 'beast', size: 's', flying: true, night: true, resist: { wind: 1.3, dark: 0.7, sleep: 0.3 }, drops: { common: ['moonherb', 12], rare: ['seed_agi', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_peck' }, { w: 1, id: 'm_glare' }],
    desc: '夜の森や平原を、音もなくとぶフクロウ。大きな目でにらみつけてくる。',
  },
  wisp_lamp: {
    name: 'ひとだまランプ', lv: 7, hp: 34, mp: 36, str: 20, def: 12, agi: 18, mag: 24, exp: 22, gold: 22,
    race: 'spirit', size: 's', night: true, resist: { fire: 0.3, ice: 1.4, light: 1.5, dark: 0.6 }, drops: { common: ['magic_water', 32], rare: ['wizard_staff', 96] },
    actions: [{ w: 2, id: 'gira' }, { w: 2, id: 'mera' }, { w: 1, id: 'attack' }],
    desc: '青白い火がゆらゆらもえるランプ。夜の森やぬまをさまよう。',
  },
  dark_wolf: {
    name: '闇ウルフ', lv: 9, hp: 52, str: 36, def: 17, agi: 30, exp: 32, gold: 26,
    race: 'beast', size: 'm', night: true, resist: { dark: 0.6, light: 1.4, fire: 1.2, ice: 0.8 }, drops: { common: ['herb', 6], rare: ['iron_claw', 64] },
    actions: [{ w: 6, id: 'attack' }, { w: 2, id: 'm_drain' }, { w: 1, id: 'm_howl', cond: 'callHelp' }],
    desc: '月のない夜にあらわれる黒いウルフ。群れで旅人をおそう。',
  },
  glow_jelly: {
    name: '夜光ぷるりん', lv: 13, hp: 72, mp: 30, str: 38, def: 28, agi: 22, mag: 30, exp: 54, gold: 36,
    race: 'slime', size: 's', night: true, resist: { ice: 0.5, bolt: 1.4, light: 0.7 }, drops: { common: ['moon_drop', 12], rare: ['seed_hp', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_splash' }, { w: 1, id: 'rariho' }],
    desc: '夜の海でぼんやり光るぷるりん。光にさそわれた船乗りをねむらせる。',
  },
};

// ───────────── 夜の 出現表 ─────────────
// 昼の ちいき → 夜の 出現表（ここに ない ちいきは 昼も 夜も おなじ）
export const NIGHT_ZONES = {
  outskirts: 'outskirts_night', plains: 'plains_night', forest: 'forest_night', swamp: 'swamp_night', east: 'east_night',
  sea: 'sea_night', isle: 'isle_night',
};
// 夜は 魔物が すこし 多い
export const NIGHT_MORE = 1.15;

export const NIGHT_ENCOUNTERS = {
  outskirts_night: [
    { w: 5, group: [['moon_pururin', 1, 2]] },
    { w: 3, group: [['koumorin', 1, 2]] },
    { w: 3, group: [['pururin', 1, 2], ['moon_pururin', 1, 1]] },
    { w: 2, group: [['kobushi', 1, 2]] },
  ],
  plains_night: [
    { w: 4, group: [['moon_pururin', 2, 3]] },
    { w: 4, group: [['koumorin', 2, 3]] },
    { w: 3, group: [['night_owl', 1, 2]] },
    { w: 2, group: [['goblin', 1, 2], ['night_owl', 1, 1]] },
  ],
  forest_night: [
    { w: 4, group: [['wisp_lamp', 1, 2]] },
    { w: 3, group: [['night_owl', 1, 3]] },
    { w: 3, group: [['wolf', 2, 3]] },
    { w: 2, group: [['nemuri', 1, 2], ['wisp_lamp', 1, 1]] },
  ],
  swamp_night: [
    { w: 4, group: [['wisp_lamp', 1, 3]] },
    { w: 3, group: [['hedoron', 1, 2]] },
    { w: 2, group: [['frog', 2, 3], ['wisp_lamp', 0, 1]] },
  ],
  east_night: [
    { w: 4, group: [['dark_wolf', 1, 2]] },
    { w: 3, group: [['skeleton', 1, 3]] },
    { w: 3, group: [['night_owl', 2, 3]] },
    { w: 2, group: [['dark_wolf', 1, 1], ['wisp_lamp', 1, 2]] },
  ],
  sea_night: [
    { w: 4, group: [['glow_jelly', 1, 3]] },
    { w: 3, group: [['sea_serpent', 1, 1]] },
    { w: 3, group: [['ghost_pirate', 1, 2]] },
    { w: 2, group: [['glow_jelly', 1, 2], ['wild_gull', 0, 1]] },
  ],
  isle_night: [
    { w: 4, group: [['ghost_pirate', 1, 3]] },
    { w: 3, group: [['wind_imp', 2, 3]] },
    { w: 2, group: [['glow_jelly', 1, 2], ['coconut', 1, 1]] },
    // めずらしい: いかずちタイガー（夜だけ。monsters-rare.js）
    { w: 1, group: [['ikazuchi_tiger', 1, 1]] },
  ],
};

// 夜の たたかいの はいけい（render/battlefx.js: 〜_night は 夜空に する）
export const NIGHT_ZONE_BG = {
  outskirts_night: 'grass_night', plains_night: 'grass_night', forest_night: 'forest_night', swamp_night: 'swamp_night',
  east_night: 'plains_east_night', sea_night: 'sea_night', isle_night: 'beach_night',
};

// ───────────── 夜の 品物 ─────────────
export const NIGHT_ITEMS = {
  moon_drop: {
    name: '月のしずく', type: 'use', price: 180, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [12, 18] },
    desc: 'MPを15ほど回復する、月の光を集めたしずく。夜の商人だけが売っている。',
  },
  dawn_bell: {
    name: '夜明けのすず', type: 'use', price: 200, target: 'self', battle: false, field: true,
    effect: { type: 'timeBell', until: 'morning' },
    desc: '鳴らすと、あっというまに朝になる。パーティーのリーダーが使える。',
  },
  dusk_bell: {
    name: '夕焼けのすず', type: 'use', price: 200, target: 'self', battle: false, field: true,
    effect: { type: 'timeBell', until: 'night' },
    desc: '鳴らすと、あっというまに夜になる。夜の魔物に会いたい時に。パーティーのリーダーが使える。',
  },
  moon_pendant: {
    name: '月のペンダント', type: 'acc', rank: 3, bonus: { mp: 10, mag: 3, heal: 3 }, resist: { sleep: 0.5 }, price: 0, sell: 250,
    desc: 'ゆうれいの女の子がくれたペンダント。MPと魔力が上がり、ねむりにくくなる。',
  },
  music_box: { name: '古いオルゴール', type: 'key', desc: '星見の丘で見つけた、古いオルゴール。ふたを開けると、やさしい音がする。' },
};

// 道具の 読みがな（あいうえお順）
export const NIGHT_ITEM_KANA = {
  moon_drop: 'つきのしずく', dawn_bell: 'よあけのすず', dusk_bell: 'ゆうやけのすず', moon_pendant: 'つきのぺんだんと', music_box: 'ふるいおるごーる',
};

// ───────────── 夜の 商人 ─────────────
export const NIGHT_SHOPS = {
  night_shop: {
    name: '夜の商人の店',
    kind: 'item',
    keeper: '夜の商人',
    hello: 'ひっひっひ…いらっしゃい。\nわしは夜にしか店を開かない、ふしぎな商人さ。\nめずらしい品があるよ。',
    items: ['moon_drop', 'dawn_bell', 'dusk_bell', 'moonherb', 'holy_water'],
  },
};

// ───────────── 夜の 人の だいほん ─────────────
export const NIGHT_SCRIPTS = {
  night_merchant: () => [['shop', 'night_shop']],
  night_guard: () => S('夜の門番', '夜は魔物が強くなる。昼には見ない魔物も出るぞ。',
    'そういえば…ホシフル村のはずれに、夜になると女の子のゆうれいが出るらしい。\nこわいけど、悲しそうな顔をしているんだと。'),
  night_sailor: () => S('夜の船乗り', '夜の海は、ぷるりんがぼんやり光ってきれいなんだ。',
    'でも夜の魔物は強いぜ。宿屋で朝まで休んでから、船を出すのもいいさ。'),
  night_townsfolk: () => S('夜ふかしのおじさん', '子どもたちは、もう家でねているよ。',
    '夜になると、広場に夜の商人が店を開くんだ。\nめずらしい品を売っているらしいぞ。'),

  // ゆうれいの 女の子（ホシフル村の はずれ。夜だけ）
  night_ghost: (x) => {
    if (x.flag('q_ghost_done')) return N('…だれもいない。やさしい風がふいている。');
    if (x.has('music_box')) {
      return [
        ...S('ゆうれいの女の子', 'あっ…そのオルゴール…！わたしのだ…！'),
        ['takeItem', 'music_box', 1],
        ['sfx', 'sparkle'],
        ...N('オルゴールのふたを開けると、やさしい音色が流れ出した…'),
        ...S('ゆうれいの女の子', 'この歌…お母さんが、よく歌ってくれたの。', 'ありがとう。これで、やっと星空へ帰れる…。', 'お礼に、これをあげる。月の光のお守りだよ。'),
        ['item', 'moon_pendant', 1],
        ['gold', 300],
        ['flash'],
        ['hideNpc', 'night_ghost'],
        ...N('女の子は、星のような光になって、夜空へのぼっていった…'),
        ['flag', 'q_ghost_done'],
      ];
    }
    if (x.flag('q_ghost_start')) return S('ゆうれいの女の子', 'わたしのオルゴール…星見の丘の草の中…。\n夜にならないと、見つからないの…。');
    return [
      ...S('ゆうれいの女の子', '…あなた、わたしが見えるの？', 'わたし、ずっとむかしに、大切なオルゴールをなくしちゃったの。',
        '星見の丘で、星を見ていた夜に…。\nあれがないと、お空へ帰れないの…。'),
      ['choice', 'オルゴールを探してあげる？', ['はい', 'いいえ'], [
        [...S('ゆうれいの女の子', 'ほんと…？ありがとう。\nオルゴールは、夜にだけ月の光で光るの。\n星見の丘を探してみて。'), ['flag', 'q_ghost_start']],
        [...S('ゆうれいの女の子', '…そう。…さびしいな…。')],
      ]],
    ];
  },
  // 星見の丘で 光る もの（夜だけ）
  night_glint: () => [
    ...N('草の中で、何かが月の光を受けて光っている…'),
    ['item', 'music_box', 1],
    ['flag', 'q_ghost_found'],
    ['hideNpc', 'night_glint'],
    ...N('（ホシフル村の、ゆうれいの女の子にとどけよう。\n夜にならないと会えないみたいだ）'),
  ],
};
